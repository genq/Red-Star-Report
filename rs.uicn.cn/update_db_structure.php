<?php
// 数据库结构更新脚本
$dbPath = '/www/wwwroot/rs.uicn.cn/data/redstar.db';
$db = new PDO("sqlite:$dbPath");

echo "=== 数据库结构更新 ===\n";

// 创建 email_verification_codes 表（忘记密码验证码）
$db->exec("CREATE TABLE IF NOT EXISTS email_verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
)");
echo "✅ email_verification_codes 表已创建\n";

// 检查 accounts 表是否有 phone 字段
$cols = array_map(fn($c) => $c['name'], $db->query("PRAGMA table_info(accounts)")->fetchAll(PDO::FETCH_ASSOC));
if (!in_array('phone', $cols)) {
    $db->exec("ALTER TABLE accounts ADD COLUMN phone TEXT DEFAULT ''");
    echo "✅ phone 字段已添加\n";
} else {
    echo "  phone 字段已存在\n";
}

echo "\n数据库结构更新完成\n";
