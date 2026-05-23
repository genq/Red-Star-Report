<?php
require __DIR__ . '/api/config.php';
$db = getDB();

echo "=== 修复所有成绩记录的exam_id映射 ===\n\n";

// 考试名称 -> 去重后保留的exam_id（按date DESC排序后第一个出现的）
$mapping = [
    '高一上学期10月月考' => 26,
    '高一上学期期中考试' => 27,
    '高一上学期12月月考' => 28,
    '高一上学期期末考试' => 29,
    '高一下学期3月月考' => 30,
    '高一下学期期中考试' => 31,
    '高一下学期5月月考' => 32,
    '高一下学期期末考试' => 33,
    '高二上学期10月月考' => 34,
    '高二上学期期中考试' => 35,
    '高二上学期12月月考' => 36,
    '高二上学期期末考试' => 37,
    '高二下学期3月月考' => 38,
    '高二下学期期中考试' => 39,
    '高二下学期5月月考' => 40,
    '高二下学期期末考试' => 41,
    '高三上学期9月月考' => 42,
    '高三上学期10月月考' => 43,
    '高三上学期期中考试' => 44,
    '高三上学期12月月考' => 45,
    '高三一模' => 46,
    '高三下学期开学考' => 47,
    '高三二模' => 48,
    '高三三模' => 49,
    '高考仿真模拟' => 50,
];

$totalFixed = 0;
foreach ($mapping as $examName => $newId) {
    // 找到所有关联到同名考试但exam_id不同的成绩记录
    $stmt = $db->prepare("SELECT s.id, s.exam_id, e.name FROM scores s JOIN exams e ON s.exam_id = e.id WHERE e.name = ? AND s.exam_id != ?");
    $stmt->execute([$examName, $newId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($rows) > 0) {
        $oldIds = array_unique(array_column($rows, 'exam_id'));
        foreach ($oldIds as $oldId) {
            $stmt2 = $db->prepare("UPDATE scores SET exam_id = ? WHERE exam_id = ?");
            $stmt2->execute([$newId, $oldId]);
            $count = $stmt2->rowCount();
            echo "exam_name:'{$examName}' exam_id {$oldId} -> {$newId}: 修复了 {$count} 条\n";
            $totalFixed += $count;
        }
    }
}

echo "\n=== 共修复 {$totalFixed} 条成绩记录 ===\n";

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
