<?php
// ========== 注册 ==========
if ($routePath === '/auth/register' && $method === 'POST') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $schoolId = $input['schoolId'] ?? null;
    $grade = $input['grade'] ?? '';
    $className = trim($input['className'] ?? '');

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) err('请输入有效邮箱');
    if (strlen($password) < 6) err('密码至少6位');
    if ($password !== $confirmPassword) err('两次密码不一致');
    if (!$name) err('请输入姓名');
    if (mb_strlen($name, 'UTF-8') > 4) err('姓名最多4个字');
    if (!$phone || !preg_match('/^1[3-9]\d{9}$/', $phone)) err('请输入正确的手机号');

    $existingEmail = queryOne("SELECT id FROM accounts WHERE email = ?", [$email]);
    if ($existingEmail) err('该邮箱已注册');
    $existingPhone = queryOne("SELECT id FROM accounts WHERE phone = ?", [$phone]);
    if ($existingPhone) err('该手机号已注册');

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $verifyCode = str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO accounts (email, name, password_hash, phone, verification_code, school_id, grade, class_name, role, membership_expires_at, membership_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USER', '2028-06-06 23:59:59', 'FREE')");
    $stmt->execute([$email, $name, $hash, $phone, $verifyCode, $schoolId, $grade, $className]);
    $userId = $db->lastInsertId();

    sendVerificationEmail($email, $verifyCode);
    logAction($userId, 'register', '用户注册');

    if (EMAIL_ENABLED) {
        ok(['message' => '注册成功，请检查邮箱完成验证']);
    } else {
        ok(['message' => '注册成功', 'verifyCode' => $verifyCode]);
    }
}

// ========== 登录（支持邮箱/手机号） ==========
if ($routePath === '/auth/login' && $method === 'POST') {
    $account = trim($input['account'] ?? '');
    $password = $input['password'] ?? '';

    if (!$account || !$password) err('请输入账号和密码');

    $limitCheck = checkLoginRateLimit($account);
    if (!$limitCheck['allowed']) err($limitCheck['message'], 429);

    // 支持邮箱或手机号登录
    $isPhone = preg_match('/^1[3-9]\d{9}$/', $account);
    $where = $isPhone ? 'phone = ?' : 'email = ?';
    $user = queryOne("SELECT * FROM accounts WHERE {$where}", [$account]);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        recordLoginFailure($account);
        err('账号或密码错误');
    }

    if ($user['status'] === 'disabled') err('账号已被禁用');

    $token = generateJwt(['uid' => (int)$user['id'], 'email' => $user['email'], 'role' => $user['role']]);
    logAction((int)$user['id'], 'login', '用户登录');

    ok(['token' => $token, 'user' => sanitizeUser($user)]);
}

// ========== 个人信息查询 ==========
if ($routePath === '/auth/me' && $method === 'GET') {
    $user = needAuth();
    ok(sanitizeUser($user));
}

if ($routePath === '/me' && $method === 'GET') {
    $user = needAuth();
    $fullUser = queryOne("SELECT a.*, s.name as school_name FROM accounts a LEFT JOIN schools s ON a.school_id = s.id WHERE a.id = ?", [(int)$user['id']]);
    ok(sanitizeUser($fullUser));
}

// ========== 个人信息更新（姓名/手机号锁定，仅管理员可改） ==========
if ($routePath === '/me' && $method === 'PUT') {
    $user = needAuth();
    $isAdmin = ($user['role'] === 'SUPER_ADMIN' || $user['role'] === 'ADMIN');
    $isOwner = true; // 用户自己修改
    $targetId = (int)($input['userId'] ?? $user['id']);
    if ($targetId !== $user['id']) {
        // 尝试修改他人信息，必须管理员
        if (!$isAdmin) err('无权修改他人信息');
        $isOwner = false;
        $targetUser = queryOne("SELECT id FROM accounts WHERE id = ?", [$targetId]);
        if (!$targetUser) err('用户不存在');
    }

    $grade = trim($input['grade'] ?? $user['grade'] ?? '');
    $className = trim($input['className'] ?? $user['class_name'] ?? '');
    $phone = trim($input['phone'] ?? $user['phone'] ?? '');
    $schoolId = isset($input['school_id']) && $input['school_id'] !== '' ? (int)$input['school_id'] : null;
    $subjectType = trim($input['subjectType'] ?? $user['subject_type'] ?? 'physics');

    // 姓名和手机号：仅管理员可改
    if ($isAdmin) {
        $name = trim($input['name'] ?? $user['name']);
        if (mb_strlen($name, 'UTF-8') > 4) err('姓名最多4个字');
    } else {
        $name = $user['name']; // 普通用户不能改姓名
    }
    if ($isAdmin) {
        if ($phone && !preg_match('/^1[3-9]\d{9}$/', $phone)) err('请输入正确的手机号');
    } else {
        $phone = $user['phone']; // 普通用户不能改手机号
    }

    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET name = ?, grade = ?, class_name = ?, phone = ?, school_id = ?, subject_type = ?, updated_at = datetime('now','localtime') WHERE id = ?");
    $stmt->execute([$name, $grade, $className, $phone, $schoolId, $subjectType, $targetId]);

    logAction($user['id'], 'profile_update', '更新个人信息' . ($targetId !== $user['id'] ? " (用户#$targetId)" : ''));
    ok(['message' => '更新成功']);
}

// ========== 修改密码（已登录） ==========
if ($routePath === '/me/change-password' && $method === 'POST') {
    $user = needAuth();
    $oldPassword = $input['oldPassword'] ?? '';
    $newPassword = $input['newPassword'] ?? '';

    if (!$oldPassword) err('请输入当前密码');
    if (!$newPassword) err('请输入新密码');
    if (!password_verify($oldPassword, $user['password_hash'])) err('当前密码错误');
    if (strlen($newPassword) < 6) err('新密码至少6位');

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?");
    $stmt->execute([$hash, $user['id']]);

    logAction($user['id'], 'password_change', '修改密码');
    ok(['message' => '密码修改成功']);
}

// ========== 选科 ==========
if ($routePath === '/me/subjects' && $method === 'POST') {
    $user = needAuth();
    $subjectType = $input['subjectType'] ?? 'physics';
    $subjects = $input['subjects'] ?? [];
    $db = getDB();
    $db->prepare("UPDATE accounts SET subject_type = ?, subjects = ?, updated_at = datetime('now','localtime') WHERE id = ?")->execute([$subjectType, json_encode($subjects), $user['id']]);
    ok(['message' => '选科已保存']);
}

// ========== 邮箱验证 ==========
if ($routePath === '/auth/verify-email' && $method === 'GET') {
    $code = $_GET['code'] ?? '';
    if (!$code) err('验证链接无效');

    $user = queryOne("SELECT id, is_email_verified FROM accounts WHERE verification_code = ?", [$code]);
    if (!$user) err('验证链接已过期或无效');
    if ($user['is_email_verified']) ok(['message' => '邮箱已验证']);

    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET is_email_verified = 1, verification_code = NULL, role = 'PRO', membership_type = 'PRO', updated_at = datetime('now','localtime') WHERE id = ?");
    $stmt->execute([$user['id']]);

    logAction((int)$user['id'], 'email_verified', '邮箱验证完成，激活专业版会员');
    ok(['message' => '邮箱验证成功，已激活专业版会员']);
}

// ========== 忘记密码：发送邮箱验证码 ==========
if ($routePath === '/auth/forgot-password-send' && $method === 'POST') {
    $email = trim($input['email'] ?? '');
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) err('请输入有效邮箱');

    $user = queryOne("SELECT id FROM accounts WHERE email = ?", [$email]);
    if (!$user) ok(['message' => '如果该邮箱已注册，验证码已发送']);

    // 检查发送频率（1分钟内）
    $recent = queryOne("SELECT id FROM email_verification_codes WHERE email = ? AND used = 0 AND expires_at > datetime('now','localtime') ORDER BY created_at DESC LIMIT 1", [$email]);
    if ($recent) {
        $recent2 = queryOne("SELECT id FROM email_verification_codes WHERE email = ? AND used = 0 AND created_at > datetime('now','localtime','-1 minute')", [$email]);
        if ($recent2) err('验证码已发送，请1分钟后再试');
    }

    $code = str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', time() + 300); // 5分钟有效

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO email_verification_codes (email, code, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $code, $expiresAt]);

    // 发送邮件
    if (EMAIL_ENABLED) {
        $subject = "阳光学情报告 - 密码重置验证码";
        $body = "<h3>密码重置验证码</h3><p>您的验证码是：<strong style='font-size:24px;color:#409EFF'>{$code}</strong></p><p>验证码5分钟内有效，请勿泄露给他人。</p>";
        sendEmail($email, $subject, $body);
        ok(['message' => '验证码已发送到邮箱']);
    } else {
        ok(['message' => '调试模式', 'verifyCode' => $code]);
    }
}

// ========== 忘记密码：验证验证码 ==========
if ($routePath === '/auth/forgot-password-verify' && $method === 'POST') {
    $email = trim($input['email'] ?? '');
    $code = trim($input['code'] ?? '');

    if (!$email || !$code) err('请输入邮箱和验证码');

    $record = queryOne("SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now','localtime') ORDER BY created_at DESC LIMIT 1", [$email, $code]);
    if (!$record) err('验证码错误或已过期');

    // 标记已使用
    $db = getDB();
    $db->prepare("UPDATE email_verification_codes SET used = 1 WHERE id = ?", [$record['id']])->execute();

    // 生成一次性token
    $token = bin2hex(random_bytes(16));
    $expiresAt = date('Y-m-d H:i:s', time() + 300);
    $stmt = $db->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expiresAt]);

    ok(['message' => '验证成功', 'token' => $token]);
}

// ========== 忘记密码：重置密码 ==========
if ($routePath === '/auth/forgot-password-reset' && $method === 'POST') {
    $token = $input['token'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';

    if (!$token) err('令牌无效');
    if (strlen($newPassword) < 6) err('密码至少6位');
    if ($newPassword !== $confirmPassword) err('两次密码不一致');

    $reset = queryOne("SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now','localtime')", [$token]);
    if (!$reset) err('重置链接已过期或无效');

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db = getDB();
    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE accounts SET password_hash = ?, updated_at = datetime('now','localtime') WHERE email = ?");
        $stmt->execute([$hash, $reset['email']]);
        $stmt = $db->prepare("UPDATE password_resets SET used = 1 WHERE token = ?");
        $stmt->execute([$token]);
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    ok(['message' => '密码重置成功，请登录']);
}

// ========== 忘记邮箱：姓名+手机号找回 ==========
if ($routePath === '/auth/recover-email' && $method === 'POST') {
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');

    if (!$name) err('请输入姓名');
    if (!$phone || !preg_match('/^1[3-9]\d{9}$/', $phone)) err('请输入正确的手机号');

    $user = queryOne("SELECT email, phone FROM accounts WHERE name = ? AND phone = ?", [$name, $phone]);
    if (!$user) err('未找到匹配的账号');

    // 部分隐藏邮箱
    $email = $user['email'];
    $parts = explode('@', $email);
    if (count($parts) === 2) {
        $local = $parts[0];
        $domain = $parts[1];
        if (strlen($local) > 3) {
            $hidden = mb_substr($local, 0, 2, 'UTF-8') . '***' . mb_substr($local, -1, 1, 'UTF-8');
        } else {
            $hidden = mb_substr($local, 0, 1, 'UTF-8') . '***';
        }
        $displayEmail = $hidden . '@' . $domain;
    } else {
        $displayEmail = '***@***';
    }

    ok(['message' => '已找到账号', 'email' => $displayEmail]);
}

// ========== 密码重置链接方式（旧版，保留兼容） ==========
if ($routePath === '/auth/request-reset' && $method === 'POST') {
    $email = trim($input['email'] ?? '');
    if (!$email) err('请输入邮箱');

    $user = queryOne("SELECT id FROM accounts WHERE email = ?", [$email]);
    if (!$user) ok(['message' => '如果该邮箱已注册，重置链接已发送']);

    $recent = queryOne("SELECT id FROM password_resets WHERE email = ? AND used = 0 AND expires_at > datetime('now','localtime','-1 minute')", [$email]);
    if ($recent) err('请稍后再试');

    $token = bin2hex(random_bytes(16));
    $expiresAt = date('Y-m-d H:i:s', time() + RESET_TOKEN_EXPIRE);

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expiresAt]);

    $resetLink = SITE_URL . "/reset-password?token={$token}";
    if (EMAIL_ENABLED) {
        sendResetEmail($email, $resetLink);
        ok(['message' => '重置链接已发送到邮箱']);
    } else {
        ok(['message' => '调试模式', 'resetLink' => $resetLink]);
    }
}

if ($routePath === '/auth/reset-password' && $method === 'POST') {
    $token = $input['token'] ?? '';
    $newPassword = $input['newPassword'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';

    if (!$token) err('令牌无效');
    if (strlen($newPassword) < 8) err('密码至少8位');
    if ($newPassword !== $confirmPassword) err('两次密码不一致');

    $reset = queryOne("SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now','localtime')", [$token]);
    if (!$reset) err('重置链接已过期或无效');

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db = getDB();
    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE accounts SET password_hash = ?, updated_at = datetime('now','localtime') WHERE email = ?");
        $stmt->execute([$hash, $reset['email']]);
        $stmt = $db->prepare("UPDATE password_resets SET used = 1 WHERE token = ?");
        $stmt->execute([$token]);
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    ok(['message' => '密码重置成功，请登录']);
}

if ($routePath === '/auth/resend-email' && $method === 'POST') {
    $user = needAuth();
    if ($user['is_email_verified']) err('邮箱已验证');
    $newCode = bin2hex(random_bytes(3));
    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET verification_code = ? WHERE id = ?");
    $stmt->execute([$newCode, $user['id']]);
    sendVerificationEmail($user['email'], $newCode);
    if (EMAIL_ENABLED) {
        ok(['message' => '验证邮件已重新发送']);
    } else {
        ok(['message' => '验证码已重新生成', 'verifyCode' => $newCode]);
    }
}
