<?php
require __DIR__ . '/api/config.php';
$db = getDB();

echo "=== 修复剩余不匹配的exam_id ===\n\n";

// 高一上学期期末考试: 29 -> 54
$stmt = $db->prepare("UPDATE scores SET exam_id = 54 WHERE exam_id = 29");
$stmt->execute();
echo "exam_id 29 -> 54 (高一上学期期末考试): 修复了 " . $stmt->rowCount() . " 条\n";

// 高一下学期3月月考: 30 -> 57
$stmt2 = $db->prepare("UPDATE scores SET exam_id = 57 WHERE exam_id = 30");
$stmt2->execute();
echo "exam_id 30 -> 57 (高一下学期3月月考): 修复了 " . $stmt2->rowCount() . " 条\n";

// 验证姜同学的成绩
echo "\n=== 验证：姜旻昊的成绩记录 ===\n";
$stmt3 = $db->prepare("SELECT s.exam_id, e.name as exam_name, COUNT(*) as cnt FROM scores s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = 4 GROUP BY s.exam_id ORDER BY e.date");
$stmt3->execute([]);
$scores = $stmt3->fetchAll(PDO::FETCH_ASSOC);

foreach ($scores as $s) {
    echo "  exam_id:{$s['exam_id']}  exam:{$s['exam_name']}  科目数:{$s['cnt']}\n";
}

echo "\n修复完成.\n";
?>
