<?php
if ($routePath === '/admin/users' && $method === 'GET') {
    needAdminOrViewer();
    $search = trim($_GET['search'] ?? '');
    $role = $_GET['role'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    $where = "1=1"; $params = [];
    if ($search) { $where .= " AND (email LIKE ? OR name LIKE ?)"; $params[] = "%{$search}%"; $params[] = "%{$search}%"; }
    if ($role) { $where .= " AND role = ?"; $params[] = $role; }

    $total = queryOne("SELECT COUNT(*) as cnt FROM accounts WHERE $where", $params)['cnt'];
    $list = queryAll("SELECT id, email, name, role, is_email_verified, membership_type, membership_expires_at, grade, class_name, status, created_at FROM accounts WHERE $where ORDER BY id ASC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
    ok(['list' => $list, 'total' => (int)$total, 'page' => $page]);
}

if (preg_match('#^/admin/users/(\d+)/role$#', $routePath, $m) && $method === 'PUT') {
    $admin = needAdmin();
    $userId = (int)$m[1];
    protectSuperAdmin($userId);
    $newRole = $input['role'] ?? '';
    if (!in_array($newRole, ['USER', 'PRO', 'ADMIN', 'SUPER_ADMIN'])) err('无效角色');
    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET role = ?, updated_at = datetime('now','localtime') WHERE id = ?");
    $stmt->execute([$newRole, $userId]);
    logAction((int)$admin['id'], 'role_change', "修改用户{$userId}角色为{$newRole}");
    ok(['message' => '角色已更新']);
}

if (preg_match('#^/admin/users/(\d+)$#', $routePath, $m) && $method === 'PUT') {
    $admin = needAdmin();
    $userId = (int)$m[1];
    protectSuperAdmin($userId);
    $name = trim($input['name'] ?? '');
    $role = trim($input['role'] ?? '');
    $className = trim($input['className'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $expiry = trim($input['membership_expires_at'] ?? '');

    if (!$name) err('姓名不能为空');
    if (mb_strlen($name, 'UTF-8') > 4) err('姓名最多4个字');
    if ($role && !in_array($role, ['USER', 'PRO', 'ADMIN', 'SUPER_ADMIN'])) err('无效角色');
    if ($phone && !preg_match('/^1[3-9]\d{9}$/', $phone)) err('请输入正确的手机号');

    $fields = ["name = ?"]; $params = [$name];
    if ($role) { $fields[] = "role = ?"; $params[] = $role; }
    if ($className !== '') { $fields[] = "class_name = ?"; $params[] = $className; }
    if ($phone !== '') { $fields[] = "phone = ?"; $params[] = $phone; }
    if ($expiry !== '') { $fields[] = "membership_expires_at = ?"; $params[] = $expiry; }
    $fields[] = "updated_at = datetime('now','localtime')";
    $params[] = $userId;

    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);
    logAction((int)$admin['id'], 'user_update', "编辑用户{$userId}信息");
    ok(['message' => '用户信息已更新']);
}

if (preg_match('#^/admin/users/(\d+)/reset-password$#', $routePath, $m) && $method === 'POST') {
    $admin = needAdmin();
    $userId = (int)$m[1];
    protectSuperAdmin($userId);
    $newPassword = bin2hex(random_bytes(4));
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?");
    $stmt->execute([$hash, $userId]);
    logAction((int)$admin['id'], 'password_reset', "重置用户{$userId}密码");
    ok(['message' => '密码已重置', 'newPassword' => $newPassword]);
}

if (preg_match('#^/admin/users/(\d+)/status$#', $routePath, $m) && $method === 'PUT') {
    $admin = needAdmin();
    $userId = (int)$m[1];
    protectSuperAdmin($userId);
    $status = $input['status'] ?? '';
    if (!in_array($status, ['active', 'disabled'])) err('无效状态');
    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?");
    $stmt->execute([$status, $userId]);
    ok(['message' => $status === 'active' ? '已启用' : '已禁用']);
}

if ($routePath === '/admin/exams' && $method === 'GET') {
    needAdminOrViewer();
    $list = queryAll("SELECT * FROM exams ORDER BY date DESC");
    ok(['list' => $list]);
}

if ($routePath === '/admin/exams' && $method === 'POST') {
    $admin = needAdmin();

    if (isset($input['id']) && isset($input['isActive'])) {
        $examId = (int)$input['id'];
        $isActive = $input['isActive'] ? 1 : 0;
        $db = getDB();
        $db->prepare("UPDATE exams SET is_active = ? WHERE id = ?")->execute([$isActive, $examId]);
        ok(['message' => '状态已更新']);
    }

    $name = trim($input['name'] ?? '');
    $date = $input['date'] ?? '';
    $semester = $input['semester'] ?? '';
    $gradeRange = $input['gradeRange'] ?? [];
    if (!$name) err('请输入考试名称');
    if (!$date) err('请选择考试日期');

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO exams (name, date, semester, grade_range) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $date, $semester, json_encode($gradeRange)]);
    logAction((int)$admin['id'], 'exam_create', "创建考试: {$name}");
    ok(['message' => '考试创建成功']);
}

if ($routePath === '/admin/schools' && $method === 'GET') {
    needAdminOrViewer();
    $list = queryAll("SELECT * FROM schools ORDER BY id ASC");
    ok(['list' => $list]);
}

if ($routePath === '/admin/schools' && $method === 'POST') {
    needAdmin();
    $name = trim($input['name'] ?? '');
    if (!$name) err('请输入学校名称');
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO schools (name, address, contact, phone) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $input['address'] ?? '', $input['contact'] ?? '', $input['phone'] ?? '']);
    ok(['message' => '学校添加成功']);
}

if ($routePath === '/admin/subject-presets' && $method === 'GET') {
    needAdminOrViewer();
    $list = queryAll("SELECT * FROM subject_presets ORDER BY id ASC");
    ok(['list' => $list]);
}

if ($routePath === '/admin/settings' && $method === 'GET') {
    needAdmin();
    $settings = queryAll("SELECT * FROM settings");
    $result = [];
    foreach ($settings as $s) $result[$s['key']] = $s['value'];
    ok($result);
}

if ($routePath === '/admin/settings' && $method === 'PUT') {
    needAdmin();
    $key = $input['key'] ?? '';
    $value = $input['value'] ?? '';
    if (!$key) err('key不能为空');
    $db = getDB();
    $db->prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))")->execute([$key, $value]);
    ok(['message' => '设置已更新']);
}

if ($routePath === '/admin/settings' && $method === 'POST') {
    needSuperAdmin();
    $db = getDB();
    $db->beginTransaction();
    try {
        foreach ($input as $key => $value) {
            $db->prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))")->execute([$key, $value]);
        }
        $db->commit();
        logAction((int)me()['id'], 'settings_update', '更新系统设置');
        ok(['message' => '设置已保存']);
    } catch (Exception $e) {
        $db->rollBack();
        err('保存失败: ' . $e->getMessage());
    }
}

if ($routePath === '/admin/grade-up' && $method === 'POST') {
    $admin = needAdmin();
    $db = getDB();
    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE accounts SET graduation_status = 1, graduation_date = date('now','localtime'), grade = '已毕业', updated_at = datetime('now','localtime') WHERE grade = '高三' AND graduation_status = 0");
        $stmt->execute();
        $graduated = $stmt->rowCount();

        $stmt = $db->prepare("UPDATE accounts SET grade = '高二', updated_at = datetime('now','localtime') WHERE grade = '高一' AND graduation_status = 0");
        $stmt->execute();
        $g1 = $stmt->rowCount();

        $stmt = $db->prepare("UPDATE accounts SET grade = '高三', updated_at = datetime('now','localtime') WHERE grade = '高二' AND graduation_status = 0");
        $stmt->execute();
        $g2 = $stmt->rowCount();

        $db->commit();
        logAction((int)$admin['id'], 'grade_upgrade', "年级升级: 毕业{$graduated}人, 高一→高二{$g1}人, 高二→高三{$g2}人");
        ok(['message' => "升级完成: 毕业{$graduated}人, 高一→高二{$g1}人, 高二→高三{$g2}人"]);
    } catch (Exception $e) {
        $db->rollBack();
        err('升级失败：' . $e->getMessage());
    }
}

if ($routePath === '/admin/backup' && $method === 'POST') {
    needAdminOrViewer();
    $backupDir = __DIR__ . '/../backups';
    if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
    $filename = 'manual_' . date('Ymd_His') . '.db';
    copy(DB_PATH, $backupDir . '/' . $filename);
    logAction((int)me()['id'], 'backup', "手动备份: {$filename}");
    ok(['message' => '备份成功', 'filename' => $filename]);
}

if ($routePath === '/admin/backup' && $method === 'GET') {
    needAdminOrViewer();
    $backupDir = __DIR__ . '/../backups';
    $files = glob($backupDir . '/*.db');
    $list = [];
    foreach ($files as $f) {
        $bn = basename($f);
        $rawSize = filesize($f);
        if ($rawSize > 1048576) $sizeStr = round($rawSize / 1048576, 1) . ' MB';
        elseif ($rawSize > 1024) $sizeStr = round($rawSize / 1024, 1) . ' KB';
        else $sizeStr = $rawSize . ' B';
        $list[] = ['filename' => $bn, 'size' => $sizeStr, 'created_at' => date('Y-m-d H:i:s', filemtime($f))];
    }
    usort($list, function($a, $b) { return strtotime($b['created_at']) - strtotime($a['created_at']); });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($routePath === '/admin/backups' && $method === 'GET') {
    needAdminOrViewer();
    $backupDir = __DIR__ . '/../backups';
    $files = glob($backupDir . '/*.db');
    $list = [];
    foreach ($files as $f) {
        $bn = basename($f);
        $rawSize = filesize($f);
        if ($rawSize > 1048576) $sizeStr = round($rawSize / 1048576, 1) . ' MB';
        elseif ($rawSize > 1024) $sizeStr = round($rawSize / 1024, 1) . ' KB';
        else $sizeStr = $rawSize . ' B';
        $list[] = ['filename' => $bn, 'size' => $sizeStr, 'created_at' => date('Y-m-d H:i:s', filemtime($f))];
    }
    usort($list, function($a, $b) { return strtotime($b['created_at']) - strtotime($a['created_at']); });
    ok(['list' => $list, 'total' => count($list)]);
}

if ($routePath === '/admin/logs' && $method === 'GET') {
    needAdminOrViewer();
    $type = $_GET['type'] ?? '';
    $from = $_GET['from'] ?? '';
    $to = $_GET['to'] ?? '';
    $search = trim($_GET['search'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 50;
    $offset = ($page - 1) * $limit;

    $where = "1=1"; $params = [];
    if ($type) { $where .= " AND action = ?"; $params[] = $type; }
    if ($from) { $where .= " AND created_at >= ?"; $params[] = $from; }
    if ($to) { $where .= " AND created_at <= ?"; $params[] = $to . ' 23:59:59'; }
    if ($search) { $where .= " AND description LIKE ?"; $params[] = "%{$search}%"; }

    $total = queryOne("SELECT COUNT(*) as cnt FROM logs WHERE $where", $params)['cnt'];
    $list = queryAll("SELECT l.*, a.name as user_name, a.email as user_email FROM logs l LEFT JOIN accounts a ON l.user_id = a.id WHERE $where ORDER BY l.created_at DESC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
    ok(['list' => $list, 'total' => (int)$total, 'page' => $page]);
}

if ($routePath === '/admin/universities/import' && $method === 'POST') {
    $admin = needAdmin();
    $csv = trim($input['csv'] ?? '');
    if (!$csv) err('请提供CSV数据');

    $lines = preg_split('/\r?\n/', $csv);
    $imported = 0; $skipped = 0; $errors = [];

    foreach ($lines as $i => $line) {
        $line = trim($line);
        if (!$line) continue;
        if ($i === 0 && strpos($line, '大学名称') !== false) continue;

        $parts = explode(',', $line);
        if (count($parts) < 5) {
            $errors[] = "第{$i}行格式错误";
            continue;
        }

        $name = trim($parts[0]);
        $province = trim($parts[1]);
        $level = trim($parts[2]);
        $subjectType = trim($parts[3] ?? 'physics');
        if (!in_array($subjectType, ['physics', 'history', 'art', '军校', '警校'])) $subjectType = 'physics';
        $score = (int)(trim($parts[4]) ?: 0);
        $rank = (int)(trim($parts[5]) ?: 0);
        $year = isset($parts[6]) ? (int)(trim($parts[6]) ?: 2025) : 2025;

        try {
            $db = getDB();
            $stmt = $db->prepare("INSERT OR REPLACE INTO universities (name, province, university_level, subject_type, data_year, admission_score, admission_rank) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $province, $level, $subjectType, $year, $score, $rank]);
            $imported++;
        } catch (Exception $e) {
            $skipped++;
        }
    }

    logAction((int)$admin['id'], 'uni_import', "导入{$imported}所大学");
    ok(['message' => "导入完成: {$imported}条成功, {$skipped}条跳过", 'imported' => $imported, 'skipped' => $skipped]);
}

if ($routePath === '/admin/universities' && $method === 'GET') {
    needAdminOrViewer();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 50;
    $offset = ($page - 1) * $limit;
    $subjectType = $_GET['subject_type'] ?? '';
    $search = trim($_GET['search'] ?? '');
    $where = '';
    $params = [];
    $conditions = [];
    if ($subjectType) { $conditions[] = 'subject_type = ?'; $params[] = $subjectType; }
    if ($search) { $conditions[] = 'name LIKE ?'; $params[] = "%{$search}%"; }
    if (!empty($conditions)) { $where = 'WHERE ' . implode(' AND ', $conditions); }
    $list = queryAll("SELECT * FROM universities $where ORDER BY admission_rank ASC LIMIT ? OFFSET ?", [...$params, $limit, $offset]);
    $totalRow = queryOne("SELECT COUNT(*) as cnt FROM universities $where", $params);
    $total = $totalRow ? (int)$totalRow['cnt'] : 0;
    ok(['list' => $list, 'total' => $total, 'page' => $page]);
}

if (preg_match('#^/admin/universities/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    needAdmin();
    $uniId = (int)$m[1];
    $db = getDB();
    $db->exec("DELETE FROM universities WHERE id = {$uniId}");
    logAction((int)me()['id'], 'uni_delete', "删除大学ID:{$uniId}");
    ok(['message' => '已删除']);
}

if (preg_match('#^/admin/schools/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    needAdmin();
    $schoolId = (int)$m[1];
    $db = getDB();
    $db->exec("DELETE FROM schools WHERE id = {$schoolId}");
    logAction((int)me()['id'], 'school_delete', "删除学校ID:{$schoolId}");
    ok(['message' => '已删除']);
}

if ($routePath === '/admin/subject-presets' && $method === 'POST') {
    needAdmin();
    $name = trim($input['name'] ?? '');
    $subjectType = trim($input['subjectType'] ?? '');
    $subjects = $input['subjects'] ?? [];
    if (!$name) err('请输入名称');
    $db = getDB();
    $firstChoice = $subjectType === 'history' ? '历史' : '物理';
    $stmt = $db->prepare("INSERT INTO subject_presets (name, first_choice, re_choices, subjects) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $firstChoice, '', json_encode($subjects)]);
    ok(['message' => '添加成功']);
}

if (preg_match('#^/admin/subject-presets/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    needAdmin();
    $presetId = (int)$m[1];
    $db = getDB();
    $db->exec("DELETE FROM subject_presets WHERE id = {$presetId}");
    ok(['message' => '已删除']);
}

if (preg_match('#^/admin/backups/([^/]+)/download$#', $routePath, $m) && $method === 'GET') {
    needAdminOrViewer();
    $filename = basename($m[1]);
    $filePath = __DIR__ . '/../backups/' . $filename;
    if (!file_exists($filePath)) err('备份文件不存在', 404);
    header('Content-Type: application/octet-stream');
    header("Content-Disposition: attachment; filename=\"{$filename}\"");
    readfile($filePath);
    exit;
}

if (preg_match('#^/admin/backups/([^/]+)$#', $routePath, $m) && $method === 'DELETE') {
    needAdmin();
    $filename = basename($m[1]);
    $filePath = __DIR__ . '/../backups/' . $filename;
    if (!file_exists($filePath)) err('文件不存在', 404);
    unlink($filePath);
    logAction((int)me()['id'], 'backup_delete', "删除备份: {$filename}");
    ok(['message' => '已删除']);
}

if (preg_match('#^/admin/role/(\d+)$#', $routePath, $m) && $method === 'POST') {
    $admin = needAdmin();
    $userId = (int)$m[1];
    protectSuperAdmin($userId);
    $newRole = trim($input['role'] ?? '');
    if (!in_array($newRole, ['USER', 'PRO', 'ADMIN'])) err('无效角色');
    $db = getDB();
    $db->prepare("UPDATE accounts SET role = ?, updated_at = datetime('now','localtime') WHERE id = ?")->execute([$newRole, $userId]);
    logAction((int)$admin['id'], 'role_change', "修改用户{$userId}角色为{$newRole}");
    ok(['message' => '角色已更新']);
}

if (preg_match('#^/admin/reset-password/(\d+)$#', $routePath, $m) && $method === 'POST') {
    $admin = needAdmin();
    $userId = (int)$m[1];
    protectSuperAdmin($userId);
    $newPassword = '12345678';
    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $db = getDB();
    $db->prepare("UPDATE accounts SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?")->execute([$hash, $userId]);
    logAction((int)$admin['id'], 'password_reset', "重置用户{$userId}密码");
    ok(['message' => '密码已重置为 12345678']);
}

if (preg_match('#^/admin/status/(\d+)$#', $routePath, $m) && $method === 'POST') {
    $admin = needAdmin();
    $userId = (int)$m[1];
    protectSuperAdmin($userId);
    $status = $input['status'] ?? 'disabled';
    if (!in_array($status, ['active', 'disabled'])) err('无效状态');
    $db = getDB();
    $db->prepare("UPDATE accounts SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?")->execute([$status, $userId]);
    ok(['message' => $status === 'active' ? '已启用' : '已禁用']);
}

if ($routePath === '/admin/changelog' && $method === 'GET') {
    needAdmin();
    $list = queryAll("SELECT * FROM changelog ORDER BY created_at DESC");
    ok(['data' => $list]);
}

if ($routePath === '/admin/changelog' && $method === 'POST') {
    needAdmin();
    $version = trim($input['version'] ?? '');
    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');

    if (!$version || !$title) err('版本号和标题不能为空');

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO changelog (version, title, content) VALUES (?, ?, ?)");
    $stmt->execute([$version, $title, $content]);

    logAction((int)me()['id'], 'changelog_create', "添加更新记录: {$version}");
    ok(['message' => '更新记录已添加']);
}

if (preg_match('#^/admin/changelog/(\d+)$#', $routePath, $m) && $method === 'PUT') {
    needAdmin();
    $id = (int)$m[1];
    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');

    $existing = queryOne("SELECT * FROM changelog WHERE id = ?", [$id]);
    if (!$existing) err('记录不存在', 404);

    $db = getDB();
    $stmt = $db->prepare("UPDATE changelog SET title = ?, content = ? WHERE id = ?");
    $stmt->execute([$title, $content, $id]);

    logAction((int)me()['id'], 'changelog_update', "更新记录 #{$id}");
    ok(['message' => '更新记录已修改']);
}

if (preg_match('#^/admin/changelog/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    needAdmin();
    $id = (int)$m[1];
    $existing = queryOne("SELECT * FROM changelog WHERE id = ?", [$id]);
    if (!$existing) err('记录不存在', 404);

    $db = getDB();
    $stmt = $db->prepare("DELETE FROM changelog WHERE id = ?");
    $stmt->execute([$id]);

    logAction((int)me()['id'], 'changelog_delete', "删除更新记录 #{$id}");
    ok(['message' => '更新记录已删除']);
}

if ($routePath === '/admin/tickets' && $method === 'GET') {
    needAdminOrViewer();
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 20);
    $status = $_GET['status'] ?? '';
    $offset = ($page - 1) * $limit;

    $where = "1=1";
    $params = [];
    if ($status) { $where .= " AND t.status = ?"; $params[] = $status; }

    $total = queryOne("SELECT COUNT(*) as cnt FROM tickets t WHERE $where", $params)['cnt'];
    $list = queryAll("SELECT t.*, a.name as user_name, a.email as user_email FROM tickets t LEFT JOIN accounts a ON t.user_id = a.id WHERE $where ORDER BY t.created_at DESC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
    ok(['data' => $list, 'total' => $total, 'page' => $page, 'limit' => $limit]);
}

if (preg_match('#^/admin/tickets/(\d+)$#', $routePath, $m) && $method === 'GET') {
    needAdminOrViewer();
    $ticketId = (int)$m[1];
    $ticket = queryOne("SELECT t.*, a.name as user_name, a.email as user_email FROM tickets t LEFT JOIN accounts a ON t.user_id = a.id WHERE t.id = ?", [$ticketId]);
    if (!$ticket) err('工单不存在', 404);
    ok(['data' => $ticket]);
}

if (preg_match('#^/admin/tickets/(\d+)/reply$#', $routePath, $m) && $method === 'POST') {
    needAdmin();
    $ticketId = (int)$m[1];
    $reply = trim($input['reply'] ?? '');
    $status = $input['status'] ?? 'replied';
    if (!$reply) err('请输入回复内容');

    $ticket = queryOne("SELECT * FROM tickets WHERE id = ?", [$ticketId]);
    if (!$ticket) err('工单不存在', 404);

    $db = getDB();
    $stmt = $db->prepare("UPDATE tickets SET admin_reply = ?, replied_at = datetime('now','localtime'), status = ? WHERE id = ?");
    $stmt->execute([$reply, $status, $ticketId]);

    logAction((int)me()['id'], 'ticket_reply', "回复工单 #{$ticketId}");
    ok(['message' => '回复已发送']);
}

if ($routePath === '/notifications' && $method === 'GET') {
    $user = needAuth();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;
    $total = queryOne("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ?", [$user['id']])['cnt'];
    $list = queryAll("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", [$user['id'], $limit, $offset]);
    ok(['list' => $list, 'total' => (int)$total, 'page' => $page]);
}

if ($routePath === '/notifications/unread-count' && $method === 'GET') {
    $user = needAuth();
    $count = queryOne("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0", [$user['id']])['cnt'];
    ok(['count' => (int)$count]);
}

if (preg_match('#^/notifications/(\d+)/read$#', $routePath, $m) && $method === 'PUT') {
    $user = needAuth();
    $notifId = (int)$m[1];
    $db = getDB();
    $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
    $stmt->execute([$notifId, $user['id']]);
    ok(['message' => '已标记']);
}

if ($routePath === '/tickets' && $method === 'POST') {
    $user = needAuth();
    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');
    $captcha = trim(strtoupper($input['captcha'] ?? ''));
    $captchaId = $input['captchaId'] ?? '';

    if (!$title) err('请输入工单标题');
    if (!$content) err('请输入工单内容');
    if (!$captcha) err('请输入验证码');

    $sessionKey = 'captcha_' . $captchaId;
    $storedCaptcha = $_SESSION[$sessionKey] ?? '';
    if (!$storedCaptcha || $captcha !== strtoupper($storedCaptcha)) {
        err('验证码错误，请刷新后重试');
    }
    unset($_SESSION[$sessionKey]);

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO tickets (user_id, title, content, captcha) VALUES (?, ?, ?, ?)");
    $stmt->execute([(int)$user['id'], $title, $content, $captcha]);
    $ticketId = $db->lastInsertId();

    sendTicketNotification([
        'user_name' => $user['name'],
        'user_email' => $user['email'],
        'title' => $title,
        'content' => $content,
        'captcha' => $captcha
    ]);

    logAction((int)$user['id'], 'ticket_create', "创建工单: {$title}");
    ok(['message' => '工单已提交', 'ticketId' => $ticketId]);
}

if ($routePath === '/tickets' && $method === 'GET') {
    $user = needAuth();
    $list = queryAll("SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC", [(int)$user['id']]);
    ok(['data' => $list]);
}

if (preg_match('#^/tickets/(\d+)$#', $routePath, $m) && $method === 'GET') {
    $user = needAuth();
    $ticketId = (int)$m[1];
    $ticket = queryOne("SELECT * FROM tickets WHERE id = ? AND user_id = ?", [$ticketId, (int)$user['id']]);
    if (!$ticket) err('工单不存在', 404);
    ok(['data' => $ticket]);
}

if (preg_match('#^/tickets/(\d+)/reply$#', $routePath, $m) && $method === 'POST') {
    $user = needAuth();
    $ticketId = (int)$m[1];
    $reply = trim($input['reply'] ?? '');
    if (!$reply) err('请输入回复内容');

    $ticket = queryOne("SELECT * FROM tickets WHERE id = ? AND user_id = ?", [$ticketId, (int)$user['id']]);
    if (!$ticket) err('工单不存在', 404);

    $db = getDB();
    $stmt = $db->prepare("UPDATE tickets SET admin_reply = ?, replied_at = datetime('now','localtime'), status = 'replied' WHERE id = ?");
    $stmt->execute([$reply, $ticketId]);
    ok(['message' => '回复已提交']);
}
