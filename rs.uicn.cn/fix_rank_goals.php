<?php
require_once __DIR__ . '/api/config.php';

$db = getDB();

echo "=== 修复 rank_goals 表缺失列 ===\n";

try {
    $db->exec("ALTER TABLE rank_goals ADD COLUMN subject_scores TEXT NOT NULL DEFAULT '{}'");
    echo "已添加 subject_scores 列\n";
} catch (Exception $e) {
    echo "subject_scores 列已存在: " . $e->getMessage() . "\n";
}

try {
    $db->exec("ALTER TABLE rank_goals ADD COLUMN exam_id INTEGER DEFAULT NULL");
    echo "已添加 exam_id 列\n";
} catch (Exception $e) {
    echo "exam_id 列已存在: " . $e->getMessage() . "\n";
}

echo "\n=== 当前 rank_goals 表结构 ===\n";
$cols = $db->query("PRAGMA table_info(rank_goals)");
foreach ($cols as $col) {
    echo $col['name'] . ' | ' . $col['type'] . "\n";
}

echo "\n修复完成\n";