<?php
if ($routePath === '/exams' && $method === 'GET') {
    $user = needAuth();
    $list = queryAll("SELECT * FROM exams WHERE is_active = 1 ORDER BY date DESC");
    ok(['list' => $list]);
}

if ($routePath === '/exams/current' && $method === 'GET') {
    $user = needAuth();
    $examId = $_GET['examId'] ?? null;

    if ($examId) {
        $exam = queryOne("SELECT id, name, date, semester, grade_range FROM exams WHERE id = ? AND is_active = 1", [(int)$examId]);
    } else {
        $exam = queryOne("SELECT e.id, e.name, e.date, e.semester, e.grade_range FROM exams e JOIN scores s ON s.exam_id = e.id WHERE s.user_id = ? ORDER BY e.date DESC LIMIT 1", [$user['id']]);
    }
    if (!$exam) err('暂无考试');
    $existingScores = queryOne("SELECT COUNT(*) as cnt FROM scores WHERE exam_id = ? AND user_id = ?", [$exam['id'], $user['id']]);
    $exam['has_scores'] = (int)$existingScores['cnt'] > 0;
    $exam['grade_range'] = $exam['grade_range'] ? json_decode($exam['grade_range'], true) : [];
    $subjects = $user['subjects'] ? json_decode($user['subjects'], true) : [];
    if (empty($subjects)) {
        $preset = queryOne("SELECT subjects FROM subject_presets WHERE id = ?", [$user['subject_preset_id']]);
        $subjects = $preset ? json_decode($preset['subjects'], true) : ['语文', '数学', '英语'];
    }
    $exam['subjects'] = $subjects;
    ok(['data' => $exam]);
}

if ($routePath === '/exams/select' && $method === 'POST') {
    $user = needAuth();
    needVerified($user);
    $examId = $input['examId'] ?? null;
    if (!$examId) err('请选择考试');
    $exam = queryOne("SELECT * FROM exams WHERE id = ?", [$examId]);
    if (!$exam) err('考试不存在');
    ok(['message' => '考试已选择']);
}
