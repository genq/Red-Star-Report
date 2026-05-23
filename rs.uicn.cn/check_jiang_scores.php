<?php
require __DIR__ . '/api/config.php';
$db = getDB();

echo "=== 查找姜旻昊用户 ===\n";
$stmt = $db->query("SELECT id, name, grade, class_name, subject_type FROM accounts WHERE name LIKE '%姜%'");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo "ID:{$u['id']}  name:{$u['name']}  grade:{$u['grade']}  class:{$u['class_name']}  subjects:{$u['subject_type']}\n";
    $uid = $u['id'];
}

if (!isset($uid)) {
    echo "未找到姜姓用户\n";
    exit;
}

echo "\n=== 该用户的成绩记录 ===\n";
$stmt2 = $db->prepare("SELECT s.id, s.exam_id, e.name as exam_name, s.subject, s.score, s.full_score FROM scores s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = ? ORDER BY e.date, s.subject");
$stmt2->execute([$uid]);
$scores = $stmt2->fetchAll(PDO::FETCH_ASSOC);

$examGroups = [];
foreach ($scores as $s) {
    $ename = $s['exam_name'];
    if (!isset($examGroups[$ename])) {
        $examGroups[$ename] = ['exam_id' => $s['exam_id'], 'count' => 0, 'subjects' => []];
    }
    $examGroups[$ename]['count']++;
    $examGroups[$ename]['subjects'][] = $s['subject'];
}

foreach ($examGroups as $ename => $info) {
    echo "exam_id:{$info['exam_id']}  exam:{$ename}  科目数:{$info['count']}  科目:" . implode(',', $info['subjects']) . "\n";
}

echo "\n=== 所有高一考试（去重） ===\n";
$stmt3 = $db->query("SELECT id, name, date FROM exams WHERE grade_range LIKE '%高一%' ORDER BY date");
$exams = $stmt3->fetchAll(PDO::FETCH_ASSOC);
$seen = [];
foreach ($exams as $e) {
    if (!isset($seen[$e['name']])) {
        $seen[$e['name']] = true;
        echo "ID:{$e['id']}  name:{$e['name']}  date:{$e['date']}\n";
    }
}

echo "\n检查完成.\n";
?>
