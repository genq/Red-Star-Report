<?php
if ($routePath === '/scores' && $method === 'GET') {
    $user = needAuth();
    $examId = $_GET['examId'] ?? null;
    $subject = $_GET['subject'] ?? null;
    $targetUserId = $_GET['userId'] ?? null;
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 500;
    $offset = ($page - 1) * $limit;

    $isAdminUser = in_array($user['role'], ['SUPER_ADMIN', 'ADMIN']);
    if ($targetUserId && $isAdminUser) {
        $where = "s.user_id = ?";
        $params = [(int)$targetUserId];
    } else {
        $where = "s.user_id = ?";
        $params = [$user['id']];
    }
    if ($examId) { $where .= " AND s.exam_id = ?"; $params[] = $examId; }
    if ($subject) { $where .= " AND s.subject = ?"; $params[] = $subject; }

    $total = queryOne("SELECT COUNT(*) as cnt FROM scores s WHERE $where", $params)['cnt'];
    $scores = queryAll("SELECT s.*, e.name as exam_name, e.date as exam_date FROM scores s JOIN exams e ON s.exam_id = e.id WHERE $where ORDER BY e.date DESC, s.subject ASC LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
    ok(['list' => $scores, 'total' => (int)$total, 'page' => $page]);
}

if ($routePath === '/scores' && $method === 'POST') {
    $user = needAuth();
    needVerified($user);
    $examId = $input['examId'] ?? null;
    $scores = $input['scores'] ?? [];
    $totalGradeRank = isset($input['totalGradeRank']) && $input['totalGradeRank'] !== '' ? (int)$input['totalGradeRank'] : null;
    $totalClassRank = isset($input['totalClassRank']) && $input['totalClassRank'] !== '' ? (int)$input['totalClassRank'] : null;

    if (!$examId) err('请选择考试');
    if (empty($scores)) err('请输入成绩');

    $db = getDB();
    try { $db->exec("ALTER TABLE scores ADD COLUMN assigned_score REAL"); } catch (Exception $e) {}

    $exam = queryOne("SELECT * FROM exams WHERE id = ?", [$examId]);
    if (!$exam) err('考试不存在');

    $db->beginTransaction();
    try {
        foreach ($scores as $s) {
            $subject = trim($s['subject'] ?? '');
            $score = floatval($s['score'] ?? 0);
            $fullScore = floatval($s['fullScore'] ?? 100);
            $gradeRank = $s['gradeRank'] ? (int)$s['gradeRank'] : null;
            $classRank = $s['classRank'] ? (int)$s['classRank'] : null;
            $assignedScore = isset($s['assignedScore']) && $s['assignedScore'] !== '' ? floatval($s['assignedScore']) : null;
            if (!$subject) continue;

            $finalGradeRank = $totalGradeRank !== null ? $totalGradeRank : $gradeRank;
            $finalClassRank = $totalClassRank !== null ? $totalClassRank : $classRank;

            $stmt = $db->prepare("DELETE FROM scores WHERE user_id = ? AND exam_id = ? AND subject = ?");
            $stmt->execute([$user['id'], $examId, $subject]);
            $stmt = $db->prepare("INSERT INTO scores (exam_id, user_id, subject, score, full_score, grade_rank, class_rank, assigned_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$examId, $user['id'], $subject, $score, $fullScore, $finalGradeRank, $finalClassRank, $assignedScore]);
        }
        $db->commit();
        autoBackupIfNeeded();
        ok(['message' => '成绩录入成功']);
    } catch (Exception $e) {
        $db->rollBack();
        err('成绩录入失败：' . $e->getMessage());
    }
}

if (preg_match('#^/scores/(\d+)$#', $routePath, $m) && $method === 'PUT') {
    $user = needAuth();
    needVerified($user);
    $scoreId = (int)$m[1];
    $db = getDB();
    try { $db->exec("ALTER TABLE scores ADD COLUMN assigned_score REAL"); } catch (Exception $e) {}
    $isAdminUser = in_array($user['role'], ['SUPER_ADMIN', 'ADMIN']);
    if ($isAdminUser) {
        $score = queryOne("SELECT * FROM scores WHERE id = ?", [$scoreId]);
    } else {
        $score = queryOne("SELECT * FROM scores WHERE id = ? AND user_id = ?", [$scoreId, $user['id']]);
    }
    if (!$score) err('成绩不存在');

    $fields = []; $params = []; $oldValues = [];
    foreach (['score', 'full_score', 'grade_rank', 'class_rank', 'assigned_score'] as $field) {
        if (isset($input[$field])) {
            $oldValues[$field] = $score[$field];
            $fields[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    if (empty($fields)) err('没有要修改的字段');
    $params[] = $scoreId;
    $stmt = $db->prepare("UPDATE scores SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);

    foreach ($oldValues as $field => $oldVal) {
        $db->prepare("INSERT INTO score_edit_logs (score_id, editor_id, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)")
           ->execute([$scoreId, $user['id'], $field, $oldVal, $input[$field]]);
    }
    ok(['message' => '成绩修改成功']);
}

if (preg_match('#^/scores/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    $user = needAuth();
    needVerified($user);
    $scoreId = (int)$m[1];
    $isAdminUser = in_array($user['role'], ['SUPER_ADMIN', 'ADMIN']);
    if ($isAdminUser) {
        $score = queryOne("SELECT * FROM scores WHERE id = ?", [$scoreId]);
    } else {
        $score = queryOne("SELECT * FROM scores WHERE id = ? AND user_id = ?", [$scoreId, $user['id']]);
    }
    if (!$score) err('成绩不存在');
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM scores WHERE id = ?");
    $stmt->execute([$scoreId]);
    autoBackupIfNeeded();
    ok(['message' => '成绩已删除']);
}

if ($routePath === '/scores/trend' && $method === 'GET') {
    $user = needAuth();
    $subject = $_GET['subject'] ?? null;
    $where = "s.user_id = ?"; $params = [$user['id']];
    if ($subject) { $where .= " AND s.subject = ?"; $params[] = $subject; }
    $trend = queryAll("SELECT e.name as exam_name, e.date as exam_date, s.subject, s.score, s.full_score, ROUND(s.score * 100.0 / s.full_score, 1) as rate, s.grade_rank, s.class_rank FROM scores s JOIN exams e ON s.exam_id = e.id WHERE $where ORDER BY e.date ASC", $params);
    ok(['list' => $trend]);
}

if ($routePath === '/scores/stats' && $method === 'GET') {
    $user = needAuth();
    $examId = $_GET['examId'] ?? null;
    $where = "s.user_id = ?"; $params = [$user['id']];
    if ($examId) { $where .= " AND s.exam_id = ?"; $params[] = $examId; }
    $stats = queryOne("SELECT COUNT(DISTINCT s.exam_id) as exam_count, ROUND(AVG(s.score * 100.0 / s.full_score), 1) as avg_rate, MIN(s.score * 100.0 / s.full_score) as min_rate, MAX(s.score * 100.0 / s.full_score) as max_rate FROM scores s WHERE $where", $params);
    ok($stats);
}

if ($routePath === '/scores/analysis' && $method === 'GET') {
    $user = needAuth();
    $trends = queryAll("SELECT e.name as exam_name, e.date, ROUND(SUM(s.score), 1) as total_score, MIN(s.grade_rank) as grade_rank, MIN(s.class_rank) as class_rank FROM scores s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = ? GROUP BY s.exam_id ORDER BY e.date ASC", [$user['id']]);

    $subjectStats = queryAll("SELECT s.subject, ROUND(AVG(s.score), 1) as avg, MAX(s.score) as max, MIN(s.score) as min FROM scores s WHERE s.user_id = ? GROUP BY s.subject", [$user['id']]);
    $subjects = [];
    foreach ($subjectStats as $s) {
        $subjects[$s['subject']] = ['avg' => $s['avg'], 'max' => $s['max'], 'min' => $s['min']];
    }

    ok(['trends' => $trends, 'subjects' => $subjects]);
}
