<?php
if ($routePath === '/preference/analyze' && $method === 'GET') {
    $user = needAuth();
    $examId = $_GET['examId'] ?? null;

    if (!$examId) {
        $latestExam = queryOne("SELECT e.id FROM exams e JOIN scores s ON s.exam_id = e.id WHERE s.user_id = ? ORDER BY e.date DESC LIMIT 1", [$user['id']]);
        if (!$latestExam) err('暂无成绩数据');
        $examId = $latestExam['id'];
    }

    $scores = queryAll("SELECT s.subject, s.score, s.full_score FROM scores s WHERE s.user_id = ? AND s.exam_id = ?", [$user['id'], $examId]);
    if (empty($scores)) err('该考试暂无成绩');

    $subjectType = $user['subject_type'] ?? 'physics';
    $selectedSubjects = [];
    if ($subjectType === '物化生' || $subjectType === 'physics') {
        $selectedSubjects = ['物理', '化学', '生物'];
    } elseif (strpos($subjectType, '史') === 0) {
        $selectedSubjects = ['历史', '政治', '地理'];
    } elseif ($subjectType === 'art') {
        $selectedSubjects = ['历史', '政治', '地理'];
    } else {
        $selectedSubjects = ['物理', '化学', '生物'];
    }
    $mainSubjects = array_merge(['语文', '数学', '英语'], $selectedSubjects);
    $mainSet = array_combine($mainSubjects, $mainSubjects);

    $totalScore = 0;
    $totalFull = 0;
    foreach ($scores as $s) {
        if (!isset($mainSet[$s['subject']])) continue;
        $totalScore += $s['score'];
        $totalFull += $s['full_score'];
    }
    $rate = $totalFull > 0 ? round($totalScore / $totalFull * 100, 1) : 0;

    $year = queryOne("SELECT MAX(data_year) as y FROM universities")['y'] ?? date('Y') - 1;
    $province = getSetting('province', '安徽');

    $allUnis = queryAll("SELECT * FROM universities WHERE data_year = ? ORDER BY admission_rank ASC", [$year]);

    $grouped = [];
    foreach ($allUnis as $u) {
        $name = $u['name'];
        if (!isset($grouped[$name])) {
            $grouped[$name] = [
                'id' => (int)$u['id'],
                'name' => $u['name'],
                'code' => $u['code'],
                'university_level' => $u['university_level'],
                'province' => $u['province'],
                'physics_score' => null, 'physics_rank' => null,
                'history_score' => null, 'history_rank' => null,
                'art_score' => null, 'art_rank' => null,
                'admission_score' => $u['admission_score'],
                'admission_rank' => $u['admission_rank'],
            ];
        }
        if ($u['subject_type'] === 'physics') {
            $grouped[$name]['physics_score'] = $u['admission_score'];
            $grouped[$name]['physics_rank'] = $u['admission_rank'];
        } elseif ($u['subject_type'] === 'history') {
            $grouped[$name]['history_score'] = $u['admission_score'];
            $grouped[$name]['history_rank'] = $u['admission_rank'];
        } elseif ($u['subject_type'] === 'art') {
            $grouped[$name]['art_score'] = $u['admission_score'];
            $grouped[$name]['art_rank'] = $u['admission_rank'];
        }
    }

    $subjectType = $user['subject_type'] ?? 'physics';
    if (mb_strpos($subjectType, '物') === 0) $subjectType = 'physics';
    elseif (mb_strpos($subjectType, '史') === 0) $subjectType = 'history';
    $scoreField = $subjectType === 'history' ? 'history_score' : ($subjectType === 'art' ? 'art_score' : 'physics_score');
    $rankField = $subjectType === 'history' ? 'history_rank' : ($subjectType === 'art' ? 'art_rank' : 'physics_rank');

    $matched = [];
    foreach ($grouped as $u) {
        $uniScore = $u[$scoreField];
        if ($uniScore === null) continue;

        // 志愿推荐匹配逻辑（差值 = 考生分数 - 学校录取线）
        // 保底型(safe): 差值 >= 40（学校低40分以上，保底录取）
        // 稳妥型(match): 差值 15~39（学校低15-40分，录取概率大）
        // 冲刺型(risk): 差值 -20~14（学校高20分到低于15分，有挑战可冲刺）
        // 危险型(danger): 差值 < -20（学校高20分以上，差距过大）
        $diff = $totalScore - $uniScore;
        $matchType = 'safe';
        if ($diff >= 40) $matchType = 'safe';
        elseif ($diff >= 15) $matchType = 'match';
        elseif ($diff >= -20) $matchType = 'risk';
        else $matchType = 'danger';

        $matched[] = [
            'id' => $u['id'],
            'name' => $u['name'],
            'level' => $u['university_level'],
            'province' => $u['province'],
            'admission_score' => $uniScore,
            'admission_rank' => $u[$rankField],
            'score_diff' => $diff,
            'match_type' => $matchType,
        ];
    }

    usort($matched, function($a, $b) {
        return $b['score_diff'] - $a['score_diff'];
    });

    $safe = array_filter($matched, function($m) { return $m['match_type'] === 'safe'; });
    $match = array_filter($matched, function($m) { return $m['match_type'] === 'match'; });
    $risk = array_filter($matched, function($m) { return $m['match_type'] === 'risk'; });
    $danger = array_filter($matched, function($m) { return $m['match_type'] === 'danger'; });

    ok([
        'examId' => (int)$examId,
        'totalScore' => $totalScore,
        'totalFull' => $totalFull,
        'rate' => $rate,
        'subjectType' => $subjectType,
        'safe' => array_values($safe),
        'match' => array_values($match),
        'risk' => array_values($risk),
        'danger' => array_values($danger),
    ]);
}

if ($routePath === '/preference/exams' && $method === 'GET') {
    $user = needAuth();
    $exams = queryAll("SELECT DISTINCT e.id, e.name, e.date FROM exams e JOIN scores s ON s.exam_id = e.id WHERE s.user_id = ? ORDER BY e.date DESC", [$user['id']]);
    ok(['list' => $exams]);
}

if ($routePath === '/preference/score-analysis' && $method === 'GET') {
    $user = needAuth();
    needVerified($user);
    $totalScore = (int)($_GET['score'] ?? 0);
    $subjectType = trim($_GET['subjectType'] ?? 'physics');

    $year = queryOne("SELECT MAX(data_year) as y FROM universities")['y'] ?? date('Y') - 1;

    $allUnis = queryAll("SELECT * FROM universities WHERE data_year = ? ORDER BY admission_rank ASC", [$year]);

    $grouped = [];
    foreach ($allUnis as $u) {
        $name = $u['name'];
        if (!isset($grouped[$name])) {
            $grouped[$name] = [
                'id' => (int)$u['id'],
                'name' => $u['name'],
                'code' => $u['code'],
                'university_level' => $u['university_level'],
                'province' => $u['province'],
                'physics_score' => null, 'physics_rank' => null,
                'history_score' => null, 'history_rank' => null,
                'art_score' => null, 'art_rank' => null,
                'admission_score' => $u['admission_score'],
                'admission_rank' => $u['admission_rank'],
            ];
        }
        if ($u['subject_type'] === 'physics') {
            $grouped[$name]['physics_score'] = $u['admission_score'];
            $grouped[$name]['physics_rank'] = $u['admission_rank'];
        } elseif ($u['subject_type'] === 'history') {
            $grouped[$name]['history_score'] = $u['admission_score'];
            $grouped[$name]['history_rank'] = $u['admission_rank'];
        } elseif ($u['subject_type'] === 'art') {
            $grouped[$name]['art_score'] = $u['admission_score'];
            $grouped[$name]['art_rank'] = $u['admission_rank'];
        }
    }

    $st = $subjectType;
    if (mb_strpos($st, '物') === 0) $st = 'physics';
    elseif (mb_strpos($st, '史') === 0) $st = 'history';
    $scoreField = $st === 'history' ? 'history_score' : ($st === 'art' ? 'art_score' : 'physics_score');
    $rankField = $st === 'history' ? 'history_rank' : ($st === 'art' ? 'art_rank' : 'physics_rank');

    $matched = [];
    foreach ($grouped as $u) {
        $uniScore = $u[$scoreField];
        if ($uniScore === null) continue;

        // 志愿推荐匹配逻辑（差值 = 考生分数 - 学校录取线）
    // 保底型(safe): 差值 >= 40（学校低40分以上，保底录取）
    // 稳妥型(match): 差值 15~39（学校低15-40分，录取概率大）
    // 冲刺型(risk): 差值 -20~14（学校高20分到低于15分，有挑战可冲刺）
    // 危险型(danger): 差值 < -20（学校高20分以上，差距过大）
    $diff = $totalScore - $uniScore;
    $matchType = 'safe';
    if ($diff >= 40) $matchType = 'safe';
    elseif ($diff >= 15) $matchType = 'match';
    elseif ($diff >= -20) $matchType = 'risk';
    else $matchType = 'danger';

        $matched[] = [
            'id' => $u['id'],
            'name' => $u['name'],
            'level' => $u['university_level'],
            'province' => $u['province'],
            'admission_score' => $uniScore,
            'admission_rank' => $u[$rankField],
            'score_diff' => $diff,
            'match_type' => $matchType,
        ];
    }

    usort($matched, function($a, $b) {
        return $b['score_diff'] - $a['score_diff'];
    });

    $safe = array_filter($matched, function($m) { return $m['match_type'] === 'safe'; });
    $match = array_filter($matched, function($m) { return $m['match_type'] === 'match'; });
    $risk = array_filter($matched, function($m) { return $m['match_type'] === 'risk'; });
    $danger = array_filter($matched, function($m) { return $m['match_type'] === 'danger'; });

    ok([
        'safe' => array_values($safe),
        'match' => array_values($match),
        'risk' => array_values($risk),
        'danger' => array_values($danger),
    ]);
}

if ($routePath === '/preference/analyses' && $method === 'GET') {
    $user = needAuth();
    $list = queryAll("SELECT id, avg_score, trend, exam_count, subject_type, created_at FROM preference_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 3", [$user['id']]);
    foreach ($list as &$a) {
        $a['created_at'] = date('n月j日 H:i', strtotime($a['created_at']));
    }
    ok(['list' => $list]);
}

if ($routePath === '/preference/analyses' && $method === 'POST') {
    $user = needAuth();
    $avgScore = (int)($input['avgScore'] ?? 0);
    $totalScore = (int)($input['totalScore'] ?? 0);
    $maxScore = (int)($input['maxScore'] ?? 0);
    $volatility = (int)($input['volatility'] ?? 0);
    $trend = trim($input['trend'] ?? '稳定');
    $examCount = (int)($input['examCount'] ?? 1);
    $subjectType = trim($input['subjectType'] ?? 'physics');
    $subjectAvgScores = json_encode($input['subjectAvgScores'] ?? []);
    $subjectMinScores = json_encode($input['subjectMinScores'] ?? []);
    $subjectMaxScores = json_encode($input['subjectMaxScores'] ?? []);
    $schoolData = json_encode($input['schoolData'] ?? []);

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO preference_analyses (user_id, avg_score, total_score, max_score, volatility, trend, exam_count, subject_type, subject_avg_scores, subject_min_scores, subject_max_scores, school_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$user['id'], $avgScore, $totalScore, $maxScore, $volatility, $trend, $examCount, $subjectType, $subjectAvgScores, $subjectMinScores, $subjectMaxScores, $schoolData]);

    ok(['message' => '分析记录已保存', 'id' => $db->lastInsertId()]);
}

if ($routePath === '/preference/analyses' && $method === 'DELETE') {
    $user = needAuth();
    queryAll("DELETE FROM preference_analyses WHERE user_id = ?", [$user['id']]);
    ok(['message' => '分析记录已清空']);
}

if (preg_match('#^/preference/analyses/(\d+)$#', $routePath, $m) && $method === 'GET') {
    $user = needAuth();
    $id = (int)$m[1];
    $analysis = queryOne("SELECT * FROM preference_analyses WHERE id = ? AND user_id = ?", [$id, $user['id']]);
    if (!$analysis) err('分析记录不存在', 404);
    $analysis['subject_avg_scores'] = json_decode($analysis['subject_avg_scores'], true) ?: [];
    $analysis['subject_min_scores'] = json_decode($analysis['subject_min_scores'], true) ?: [];
    $analysis['subject_max_scores'] = json_decode($analysis['subject_max_scores'], true) ?: [];
    $analysis['school_data'] = json_decode($analysis['school_data'], true) ?: [];
    $analysis['subject_type'] = $analysis['subject_type'] ?: 'physics';
    ok(['data' => $analysis]);
}
