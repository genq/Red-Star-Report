<?php
$dbPath = __DIR__ . '/data/redstar.db';
$db = new PDO('sqlite:' . $dbPath);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. 列出所有考试名称
echo "=== 当前考试列表 ===\n";
$stmt = $db->query("SELECT id, name, semester, date FROM exams ORDER BY date");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    printf("ID:%d  name:'%s'  semester:'%s'  date:'%s'\n", $row['id'], $row['name'], $row['semester'], $row['date']);
}

// 2. 标准化名称：统一用阿拉伯数字
$replacements = [
    '一月' => '1月',
    '二月' => '2月',
    '三月' => '3月',
    '四月' => '4月',
    '五月' => '5月',
    '六月' => '6月',
    '七月' => '7月',
    '八月' => '8月',
    '九月' => '9月',
    '十月' => '10月',
    '十一月' => '11月',
    '十二月' => '12月',
];

echo "\n=== 需要修改的名称 ===\n";
$changedCount = 0;
$stmt = $db->query("SELECT id, name FROM exams ORDER BY id");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $newName = $row['name'];
    $changed = false;
    foreach ($replacements as $from => $to) {
        if (strpos($newName, $from) !== false) {
            $newName = str_replace($from, $to, $newName);
            $changed = true;
        }
    }
    if ($changed) {
        printf("ID:%d  '%s' -> '%s'\n", $row['id'], $row['name'], $newName);
        $stmt2 = $db->prepare("UPDATE exams SET name = ? WHERE id = ?");
        $stmt2->execute([$newName, $row['id']]);
        $changedCount++;
    }
}

// 3. 标准化semester字段：统一为"上学期"/"下学期"
echo "\n=== 需要修改的semester ===\n";
$stmt = $db->query("SELECT id, name, semester FROM exams ORDER BY id");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $currentSem = $row['semester'];
    $newSem = $currentSem;
    $changed = false;
    
    if (strpos($row['name'], '上学期') !== false) {
        if ($newSem !== '上学期') { $newSem = '上学期'; $changed = true; }
    } elseif (strpos($row['name'], '下学期') !== false) {
        if ($newSem !== '下学期') { $newSem = '下学期'; $changed = true; }
    }
    
    if ($changed) {
        printf("ID:%d  name:'%s'  semester:'%s' -> '%s'\n", $row['id'], $row['name'], $currentSem, $newSem);
        $stmt2 = $db->prepare("UPDATE exams SET semester = ? WHERE id = ?");
        $stmt2->execute([$newSem, $row['id']]);
    }
}

echo "\n=== 修改完成，共修改 {$changedCount} 条记录 ===\n";

// 4. 验证结果
echo "\n=== 修改后考试列表 ===\n";
$stmt = $db->query("SELECT id, name, semester, date FROM exams ORDER BY date");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    printf("ID:%d  name:'%s'  semester:'%s'  date:'%s'\n", $row['id'], $row['name'], $row['semester'], $row['date']);
}
?>
