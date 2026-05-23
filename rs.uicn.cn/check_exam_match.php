<?php
require __DIR__ . '/api/config.php';
$db = getDB();

echo "=== 检查考试选择页面会显示哪些考试（按API返回顺序） ===\n\n";

// API返回: SELECT * FROM exams WHERE is_active = 1 ORDER BY date DESC
$stmt = $db->query("SELECT id, name, date, is_active FROM exams WHERE is_active = 1 ORDER BY date DESC");
$allExams = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "API返回的考试（按date DESC排序）:\n";
foreach ($allExams as $e) {
    echo "  ID:{$e['id']}  name:{$e['name']}  date:{$e['date']}  active:{$e['is_active']}\n";
}

// 前端去重逻辑
echo "\n前端去重后显示的考试:\n";
$seen = [];
$uniqueExams = [];
foreach ($allExams as $e) {
    if (!isset($seen[$e['name']])) {
        $seen[$e['name']] = true;
        $uniqueExams[] = $e;
        echo "  ID:{$e['id']}  name:{$e['name']}  date:{$e['date']}\n";
    }
}

// 检查姜同学的成绩记录
echo "\n=== 姜旻昊的成绩记录 ===\n";
$stmt2 = $db->prepare("SELECT s.exam_id, e.name as exam_name, COUNT(*) as cnt FROM scores s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = 4 GROUP BY s.exam_id ORDER BY e.date");
$stmt2->execute([]);
$scores = $stmt2->fetchAll(PDO::FETCH_ASSOC);

foreach ($scores as $s) {
    // 检查这个exam_id是否在去重后的列表中
    $found = false;
    foreach ($uniqueExams as $ue) {
        if ($ue['id'] == $s['exam_id']) {
            $found = true;
            break;
        }
    }
    $status = $found ? '✓ 匹配' : '✗ 不匹配';
    echo "  exam_id:{$s['exam_id']}  exam:{$s['exam_name']}  科目数:{$s['cnt']}  {$status}\n";
}

echo "\n检查完成.\n";
?>
