<?php
if ($routePath === '/dashboard' && $method === 'GET') {
    $user = needAuth();
    $examCount = queryOne("SELECT COUNT(DISTINCT exam_id) as cnt FROM scores WHERE user_id = ?", [$user['id']])['cnt'];
    $avgRate = queryOne("SELECT ROUND(AVG(score * 100.0 / full_score), 1) as avg_rate FROM scores WHERE user_id = ?", [$user['id']])['avg_rate'] ?? 0;
    $goalCount = queryOne("SELECT COUNT(*) as cnt FROM rank_goals WHERE user_id = ?", [$user['id']])['cnt'];
    $trend = queryAll("SELECT e.name as exam_name, e.date, ROUND(AVG(s.score * 100.0 / s.full_score), 1) as avg_rate FROM scores s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = ? GROUP BY e.id ORDER BY e.date DESC LIMIT 5", [$user['id']]);
    $trend = array_reverse($trend);
    $recentExams = queryAll("SELECT e.id, e.name, e.date FROM exams e JOIN scores s ON s.exam_id = e.id WHERE s.user_id = ? GROUP BY e.id ORDER BY e.date DESC LIMIT 5", [$user['id']]);
    ok(['examCount' => (int)$examCount, 'avgRate' => floatval($avgRate), 'goalCount' => (int)$goalCount, 'trend' => $trend, 'recentExams' => $recentExams]);
}
