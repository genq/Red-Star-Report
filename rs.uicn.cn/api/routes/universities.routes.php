<?php
if ($routePath === '/universities' && $method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $province = $_GET['province'] ?? '';
    $level = $_GET['level'] ?? '';
    $subjectType = $_GET['subject_type'] ?? '';
    $year = $_GET['year'] ?? null;
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    if (!$year) {
        $year = queryOne("SELECT MAX(data_year) as y FROM universities")['y'] ?? date('Y') - 1;
    }

    $conditions = ["data_year = ?"]; $params = [$year];
    if ($search) { $conditions[] = "name LIKE ?"; $params[] = "%{$search}%"; }
    if ($province) { $conditions[] = "province = ?"; $params[] = $province; }
    if ($level) { $conditions[] = "university_level = ?"; $params[] = $level; }
    if ($subjectType) { $conditions[] = "subject_type = ?"; $params[] = $subjectType; }
    $where = 'WHERE ' . implode(' AND ', $conditions);

    $total = queryOne("SELECT COUNT(DISTINCT name) as cnt FROM universities $where", $params)['cnt'];
    $rawList = queryAll("SELECT * FROM universities $where ORDER BY admission_rank ASC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));

    $linkedIds = [];
    try {
        $user = needAuth();
        $goals = queryAll("SELECT university_id FROM university_goals WHERE user_id = ?", [$user['id']]);
        $linkedIds = array_column($goals, 'university_id');
    } catch (Exception $e) {}

    $grouped = [];
    foreach ($rawList as $u) {
        $name = $u['name'];
        if (!isset($grouped[$name])) {
            $grouped[$name] = [
                'id' => (int)$u['id'],
                'name' => $u['name'],
                'code' => $u['code'],
                'university_level' => $u['university_level'],
                'university_type' => $u['university_type'] ?? '综合',
                'province' => $u['province'],
                'physics_score' => null, 'physics_rank' => null,
                'history_score' => null, 'history_rank' => null,
                'art_score' => null, 'art_rank' => null,
                'admission_score' => $u['admission_score'],
                'admission_rank' => $u['admission_rank'],
                'linked' => in_array((int)$u['id'], $linkedIds)
            ];
        }
        $st = $u['subject_type'];
        if ($st === 'physics') { $grouped[$name]['physics_score'] = $u['admission_score']; $grouped[$name]['physics_rank'] = $u['admission_rank']; }
        elseif ($st === 'history') { $grouped[$name]['history_score'] = $u['admission_score']; $grouped[$name]['history_rank'] = $u['admission_rank']; }
        elseif ($st === 'art') { $grouped[$name]['art_score'] = $u['admission_score']; $grouped[$name]['art_rank'] = $u['admission_rank']; }
    }

    $list = array_values($grouped);

    $availableYears = queryAll("SELECT DISTINCT data_year FROM universities ORDER BY data_year DESC");

    ok(['list' => $list, 'total' => (int)$total, 'page' => $page, 'year' => (int)$year, 'availableYears' => array_column($availableYears, 'data_year')]);
}

if ($routePath === '/user/universities' && $method === 'GET') {
    $user = needAuth();

    $scores = queryAll("SELECT s.*, e.date as exam_date, e.id as exam_id FROM scores s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = ? ORDER BY e.date DESC", [$user['id']]);

    $examGroups = [];
    foreach ($scores as $s) {
        $eid = $s['exam_id'];
        if (!isset($examGroups[$eid])) $examGroups[$eid] = ['total' => 0, 'date' => $s['exam_date']];
        $examGroups[$eid]['total'] += (float)$s['score'];
    }

    $examDates = [];
    foreach ($examGroups as $eid => $eg) {
        $examDates[$eid] = $eg['date'];
    }
    arsort($examDates);
    $latestExamId = array_key_first($examDates);
    $avgScore = $latestExamId ? round($examGroups[$latestExamId]['total']) : 0;

    $subjectType = $user['subject_type'] ?? 'physics';
    if (mb_strpos($subjectType, '物') === 0) $subjectType = 'physics';
    elseif (mb_strpos($subjectType, '史') === 0) $subjectType = 'history';

    $goals = queryAll("SELECT * FROM university_goals WHERE user_id = ? ORDER BY created_at DESC", [$user['id']]);
    $list = [];
    foreach ($goals as $g) {
        $uni = queryOne("SELECT * FROM universities WHERE id = ?", [$g['university_id']]);
        if ($uni) {
            $goalId = $g['id'];
            $item = array_merge($g, $uni);
            $item['id'] = $goalId;
            $item['university_name'] = $uni['name'];
            $list[] = $item;
        }
    }

    foreach ($list as &$uni) {
        $uniScore = $uni['admission_score'] ?? null;
        $uniRank = $uni['admission_rank'] ?? null;
        if ($uniScore !== null && $avgScore > 0) {
            $diff = $avgScore - $uniScore;
            if ($diff >= 30) $uni['match_type'] = 'safe';
            elseif ($diff >= 10) $uni['match_type'] = 'match';
            else $uni['match_type'] = 'risk';
            $uni['score_diff'] = $diff;
        } elseif ($uniRank !== null) {
            $uni['match_type'] = 'risk';
            $uni['score_diff'] = -50;
        } else {
            $uni['match_type'] = 'risk';
            $uni['score_diff'] = -50;
        }
    }
    unset($uni);

    ok(['list' => $list, 'avgScore' => $avgScore]);
}

if ($routePath === '/user/universities/link' && $method === 'POST') {
    $user = needAuth();
    needVerified($user);
    $universityId = (int)($input['universityId'] ?? 0);
    $targetRank = (int)($input['targetRank'] ?? 0);
    if (!$universityId) err('请选择大学');
    if ($targetRank <= 0) err('请输入目标排名');

    $existing = queryOne("SELECT id FROM university_goals WHERE user_id = ? AND university_id = ?", [$user['id'], $universityId]);
    if ($existing) err('已关联该大学');

    $count = queryOne("SELECT COUNT(*) as cnt FROM university_goals WHERE user_id = ?", [$user['id']]);
    if ($count['cnt'] >= 3) err('最多只能添加3所目标大学');

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO university_goals (user_id, university_id, target_rank) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $universityId, $targetRank]);
    ok(['message' => '大学目标设置成功']);
}

if (preg_match('#^/user/universities/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    $user = needAuth();
    $uuId = (int)$m[1];
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM university_goals WHERE id = ? AND user_id = ?");
    $stmt->execute([$uuId, $user['id']]);
    if ($stmt->rowCount() === 0) {
        err('删除失败，记录不存在');
    }
    ok(['message' => '已移除']);
}

if ($routePath === '/university-goals' && $method === 'GET') {
    $user = needAuth();
    $list = queryAll("SELECT ug.*, u.name, u.province, u.university_level, u.admission_score, u.admission_rank, u.data_year FROM university_goals ug JOIN universities u ON ug.university_id = u.id WHERE ug.user_id = ? ORDER BY ug.created_at DESC", [$user['id']]);
    ok(['list' => $list]);
}

if ($routePath === '/university-goals' && $method === 'POST') {
    $user = needAuth();
    $universityId = (int)($input['universityId'] ?? 0);
    if (!$universityId) err('请选择大学');
    $existing = queryOne("SELECT id FROM university_goals WHERE user_id = ? AND university_id = ?", [$user['id'], $universityId]);
    if ($existing) err('已关联该大学');
    $count = queryOne("SELECT COUNT(*) as cnt FROM university_goals WHERE user_id = ?", [$user['id']]);
    if ($count['cnt'] >= 3) err('最多只能添加3所目标大学');
    $db = getDB();
    $db->prepare("INSERT INTO university_goals (user_id, university_id, target_rank) VALUES (?, ?, 0)")->execute([$user['id'], $universityId]);
    ok(['message' => '已添加为目标大学']);
}

if (preg_match('#^/university-goals/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    $user = needAuth();
    $uuId = (int)$m[1];
    $db = getDB();
    $db->prepare("DELETE FROM university_goals WHERE id = ? AND user_id = ?")->execute([$uuId, $user['id']]);
    ok(['message' => '已移除']);
}
