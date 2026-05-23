<?php
/**
 * 数据库备份脚本
 * 用法: php backup_db.php
 * 每次上传代码前运行此脚本备份当前数据库
 */
$source = __DIR__ . '/data/redstar.db';
$backupDir = __DIR__ . '/data/backups';
if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);

if (!file_exists($source)) {
    echo "数据库不存在，跳过备份\n";
    exit(0);
}

$backupFile = $backupDir . '/backup_' . date('Ymd_His') . '.db';
if (copy($source, $backupFile)) {
    echo "备份成功: " . basename($backupFile) . "\n";

    // 清理旧备份（保留最近10个）
    $backups = glob($backupDir . '/backup_*.db');
    rsort($backups);
    if (count($backups) > 10) {
        foreach (array_slice($backups, 10) as $old) {
            unlink($old);
        }
        echo "已清理旧备份，保留最近10个\n";
    }
} else {
    echo "备份失败！\n";
    exit(1);
}
