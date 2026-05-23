<?php
if ($routePath === '/goals' && $method === 'GET') {
    $user = needAuth();
    $goals = queryAll("SELECT g.*, gr.actual_class_rank, gr.actual_grade_rank, gr.is_achieved, gr.gap_value FROM rank_goals g LEFT JOIN goal_results gr ON g.id = gr.goal_id WHERE g.user_id = ? ORDER BY g.created_at DESC", [$user['id']]);
    foreach ($goals as &$g) {
        $g['subject_scores'] = $g['subject_scores'] ? json_decode($g['subject_scores'], true) : [];
        $g['total_score'] = array_sum($g['subject_scores']);
    }
    ok(['list' => $goals]);
}

if ($routePath === '/goals' && $method === 'POST') {
    $user = needAuth();
    needVerified($user);
    $name = trim($input['name'] ?? '');
    $subjectScores = $input['subjectScores'] ?? [];
    $targetGradeRank = isset($input['targetGradeRank']) ? (int)$input['targetGradeRank'] : null;
    $targetClassRank = isset($input['targetClassRank']) ? (int)$input['targetClassRank'] : null;
    $examId = isset($input['exam_id']) ? (int)$input['exam_id'] : null;
    if (!$name) err('请输入目标名称');

    $db = getDB();
    try {
        $stmt = $db->prepare("INSERT INTO rank_goals (user_id, name, target_type, target_value, subject_scores, exam_id) VALUES (?, ?, 'grade_rank', 0, ?, ?)");
        $stmt->execute([$user['id'], $name, json_encode($subjectScores), $examId]);
        $goalId = $db->lastInsertId();
        if ($targetGradeRank !== null || $targetClassRank !== null) {
            $stmt2 = $db->prepare("UPDATE rank_goals SET target_value = ? WHERE id = ?");
            $stmt2->execute([($targetGradeRank ?? 0) + ($targetClassRank ?? 0), $goalId]);
        }
        ok(['message' => '目标创建成功']);
    } catch (Exception $e) {
        error_log('[Goals] 创建目标失败: ' . $e->getMessage());
        err('目标创建失败，请稍后重试', 500);
    }
}

if (preg_match('#^/goals/(\d+)$#', $routePath, $m) && $method === 'PUT') {
    $user = needAuth();
    $goalId = (int)$m[1];
    $goal = queryOne("SELECT * FROM rank_goals WHERE id = ? AND user_id = ?", [$goalId, $user['id']]);
    if (!$goal) err('目标不存在');
    $name = trim($input['name'] ?? $goal['name']);
    $targetValue = (int)($input['targetValue'] ?? $goal['target_value']);
    $subjectScores = isset($input['subjectScores']) ? json_encode($input['subjectScores']) : ($goal['subject_scores'] ?? '{}');
    try {
        $db = getDB();
        $stmt = $db->prepare("UPDATE rank_goals SET name = ?, target_value = ?, subject_scores = ? WHERE id = ?");
        $stmt->execute([$name, $targetValue, $subjectScores, $goalId]);
        ok(['message' => '目标更新成功']);
    } catch (Exception $e) {
        error_log('[Goals] 更新目标失败: ' . $e->getMessage());
        err('目标更新失败，请稍后重试', 500);
    }
}

if (preg_match('#^/goals/(\d+)$#', $routePath, $m) && $method === 'DELETE') {
    $user = needAuth();
    $goalId = (int)$m[1];
    $db = getDB();
    $stmt = $db->prepare("DELETE FROM rank_goals WHERE id = ? AND user_id = ?");
    $stmt->execute([$goalId, $user['id']]);
    ok(['message' => '目标已删除']);
}
