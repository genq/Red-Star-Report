<?php
$dbPath = '/www/wwwroot/rs.uicn.cn/data/redstar.db';
$db = new PDO('sqlite:' . $dbPath);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("
CREATE TABLE IF NOT EXISTS visitor_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_uuid TEXT NOT NULL,
    visit_start_time TEXT NOT NULL,
    visit_end_time TEXT,
    duration_seconds INTEGER DEFAULT 0,
    page_url TEXT,
    referer_url TEXT,
    ip_address TEXT NOT NULL,
    country TEXT,
    province TEXT,
    city TEXT,
    isp TEXT,
    device_type TEXT,
    os_name TEXT,
    browser_name TEXT,
    browser_version TEXT,
    search_engine TEXT,
    search_keyword TEXT,
    channel_tag TEXT,
    is_bot INTEGER DEFAULT 0,
    is_blacklisted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', '+8 hours'))
);

CREATE INDEX IF NOT EXISTS idx_visitor_uuid ON visitor_logs(visitor_uuid);
CREATE INDEX IF NOT EXISTS idx_visit_start_time ON visitor_logs(visit_start_time);
CREATE INDEX IF NOT EXISTS idx_ip_address ON visitor_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_is_blacklisted ON visitor_logs(is_blacklisted);

CREATE TABLE IF NOT EXISTS ip_blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now', '+8 hours'))
);

CREATE INDEX IF NOT EXISTS idx_blacklist_ip ON ip_blacklist(ip_address);
");

echo "Tables created successfully.\n";
?>
