<?php
if ($routePath === '/profile' && $method === 'GET') {
    $user = needAuth();
    $fullUser = queryOne("SELECT a.*, s.name as school_name FROM accounts a LEFT JOIN schools s ON a.school_id = s.id WHERE a.id = ?", [(int)$user['id']]);

    $subjectPresets = queryAll("SELECT * FROM subject_presets ORDER BY name ASC");

    ok(array_merge(sanitizeUser($fullUser), ['subjectPresets' => $subjectPresets]));
}

if ($routePath === '/profile' && $method === 'PUT') {
    $user = needAuth();
    $isAdmin = in_array($user['role'], ['SUPER_ADMIN', 'ADMIN']);

    // 姓名/手机号/选科：普通用户不可修改，只有管理员可以
    if ($isAdmin) {
        $name = trim($input['name'] ?? $user['name']);
        $phone = trim($input['phone'] ?? $user['phone'] ?? '');
        $subjectType = trim($input['subjectType'] ?? $user['subject_type'] ?? 'physics');
        if ($phone && !preg_match('/^1[3-9]\d{9}$/', $phone)) err('请输入正确的手机号');
    } else {
        $name = $user['name'];
        $phone = $user['phone'];
        $subjectType = $user['subject_type'];
    }

    $grade = trim($input['grade'] ?? $user['grade'] ?? '');
    $className = trim($input['className'] ?? $user['class_name'] ?? '');

    $db = getDB();
    $stmt = $db->prepare("UPDATE accounts SET name = ?, phone = ?, grade = ?, class_name = ?, subject_type = ?, updated_at = datetime('now','localtime') WHERE id = ?");
    $stmt->execute([$name, $phone, $grade, $className, $subjectType, $user['id']]);

    logAction($user['id'], 'profile_update', '更新个人信息');
    ok(['message' => '个人信息已更新', 'subjectType' => $subjectType]);
}
