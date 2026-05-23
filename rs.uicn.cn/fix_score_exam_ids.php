<?php
require __DIR__ . '/api/config.php';
$db = getDB();

echo "=== 修复成绩记录中的exam_id ===\n\n";

// 映射关系：旧exam_id -> 新exam_id（去重后保留的ID）
$mapping = [
    53 => 51,  // 高一上学期期中考试
    56 => 4,   // 高一上学期期末考试
    57 => 5,   // 高一下学期3月月考
    31 => 6,   // 高一下学期期中考试
];

$totalFixed = 0;
foreach ($mapping as $oldId => $newId) {
    $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM scores WHERE exam_id = ?");
    $stmt->execute([$oldId]);
    $count = $stmt->fetchColumn();
    
    if ($count > 0) {
        $stmt2 = $db->prepare("UPDATE scores SET exam_id = ? WHERE exam_id = ?");
        $stmt2->execute([$newId, $oldId]);
        echo "exam_id {$oldId} -> {$newId}: 修复了 {$count} 条成绩记录\n";
        $totalFixed += $count;
    } else {
        echo "exam_id {$oldId} -> {$newId}: 无相关成绩记录，跳过\n";
    }
}

echo "\n=== 共修复 {$totalFixed} 条成绩记录 ===\n";

// 验证修复结果
echo "\n=== 验证：姜旻昊的成绩记录 ===\n";
$stmt3 = $db->prepare("SELECT s.id, s.exam_id, e.name as exam_name, s.subject, s.score FROM scores s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = 4 ORDER BY e.date, s.subject");
$stmt3->execute([]);
$scores = $stmt3->fetchAll(PDO::FETCH_ASSOC);

$examGroups = [];
foreach ($scores as $s) {
    $ename = $s['exam_name'];
    if (!isset($examGroups[$ename])) {
        $examGroups[$ename] = ['exam_id' => $s['exam_id'], 'count' => 0];
    }
    $examGroups[$ename]['count']++;
}

foreach ($examGroups as $ename => $info) {
    echo "exam_id:{$info['exam_id']}  exam:{$ename}  科目数:{$info['count']}\n";
}

echo "\n修复完成.\n";
?>
