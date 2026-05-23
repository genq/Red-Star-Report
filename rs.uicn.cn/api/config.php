<?php
/**
 * 配置文件 — 整个项目只需改这一个文件
 */

// ========== PHP 扩展检查 ==========
$requiredExtensions = ['pdo', 'pdo_sqlite', 'json', 'mbstring', 'openssl'];
foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        http_response_code(500);
        die("缺少PHP扩展: {$ext}，请安装后重试。宝塔面板 → PHP管理 → 扩展 → 启用{$ext}");
    }
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('DB_PATH', __DIR__ . '/../data/redstar.db');
define('SITE_NAME', '阳光学情报告');
define('SITE_CODE', 'Red-Star');
define('SITE_VERSION', '7.5.2');
define('SITE_URL', 'http://rs.cn');

// JWT
define('JWT_SECRET', '848ecb1910ec04837bcffe0620814e5a7c36995505a7d698b5c556d4b5d5cde7');
define('JWT_EXPIRE', 86400 * 7);

if (JWT_SECRET === 'CHANGE_ME_TO_A_RANDOM_LONG_STRING_2026') {
    $autoSecret = bin2hex(random_bytes(32));
    $cfgFile = __FILE__;
    $cfgContent = file_get_contents($cfgFile);
    $newContent = str_replace(
        "define('JWT_SECRET', '848ecb1910ec04837bcffe0620814e5a7c36995505a7d698b5c556d4b5d5cde7')",
        "define('JWT_SECRET', '{$autoSecret}')",
        $cfgContent
    );
    if ($newContent !== $cfgContent) file_put_contents($cfgFile, $newContent);
    $GLOBALS['_JWT_SECRET'] = $autoSecret;
}
function getJwtSecret() { return $GLOBALS['_JWT_SECRET'] ?? JWT_SECRET; }

// 邮件
define('SMTP_HOST', 'smtp.feishu.cn');
define('SMTP_PORT', 465);
define('SMTP_USER', 'chge@chge.cn');
define('SMTP_PASS', 'PmdkkESGWYFRQ3Qm1N');
define('SMTP_NAME', '阳光学情报告');
define('EMAIL_ENABLED', true);
define('ADMIN_EMAIL', 'hy@uicn.cn');

// 密码重置
define('RESET_TOKEN_EXPIRE', 1800);

// 错误 + 日志
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../data/php_errors.log');
date_default_timezone_set('Asia/Shanghai');

// ========== 登录限流 ==========
function checkLoginRateLimit($account) {
    $dir = __DIR__ . '/../data';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $lockFile = $dir . '/login_limits.json';
    $limits = file_exists($lockFile) ? json_decode(file_get_contents($lockFile), true) : [];
    $now = time();
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = md5($ip . '|' . $account);
    if (isset($limits[$key])) {
        if ($limits[$key]['count'] >= 5) {
            $lockExpiry = $limits[$key]['locked_at'] + 900;
            if ($now < $lockExpiry) {
                $remaining = ceil(($lockExpiry - $now) / 60);
                return ['allowed' => false, 'message' => "登录失败次数过多，请{$remaining}分钟后重试"];
            } else {
                unset($limits[$key]);
            }
        }
    }
    return ['allowed' => true];
}

function recordLoginFailure($account) {
    $dir = __DIR__ . '/../data';
    $lockFile = $dir . '/login_limits.json';
    $limits = file_exists($lockFile) ? json_decode(file_get_contents($lockFile), true) : [];
    $now = time();
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = md5($ip . '|' . $account);
    if (!isset($limits[$key])) $limits[$key] = ['count' => 0, 'locked_at' => 0];
    $limits[$key]['count']++;
    if ($limits[$key]['count'] >= 5 && $limits[$key]['locked_at'] === 0) $limits[$key]['locked_at'] = $now;
    foreach ($limits as $k => $v) {
        if ($v['locked_at'] > 0 && $now - $v['locked_at'] > 3600) unset($limits[$k]);
    }
    file_put_contents($lockFile, json_encode($limits), LOCK_EX);
}

// ========== 数据库 ==========
function getDB() {
    static $db = null;
    if ($db !== null) return $db;
    $dir = dirname(DB_PATH);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $isNew = !file_exists(DB_PATH);
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("PRAGMA journal_mode=WAL");
    $db->exec("PRAGMA busy_timeout=5000");
    $db->exec("PRAGMA foreign_keys=ON");
    if ($isNew) {
        $schema = file_get_contents(__DIR__ . '/schema.sql');
        $db->exec($schema);
    }
    // 迁移
    $ver = 0;
    try {
        $r = $db->query("SELECT value FROM db_meta WHERE key='version'");
        if ($r) $ver = (int)$r->fetchColumn();
    } catch (Exception $e) {}
    $migrations = [
        1 => [
            "ALTER TABLE settings ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''"
        ],
        2 => [
            "CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', captcha TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', admin_reply TEXT NOT NULL DEFAULT '', replied_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')))",
            "CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)",
            "CREATE TABLE IF NOT EXISTS changelog (id INTEGER PRIMARY KEY AUTOINCREMENT, version TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')))",
            "CREATE INDEX IF NOT EXISTS idx_changelog_version ON changelog(version)",
            "INSERT OR IGNORE INTO changelog (version, title, content) VALUES ('7.0.0', 'V7.0.0 重大更新', '1. 系统更名为阳光学情报告\n2. 密码最低6位\n3. 注册需邮箱验证码激活\n4. 会员有效期统一到2028-06-06\n5. 完善个人信息页面\n6. 新增技术支持工单系统\n7. 目标大学显示多科类分数\n8. 新增版本号显示\n9. 新增更新记录功能')"
        ],
        3 => [
            "ALTER TABLE accounts ADD COLUMN phone TEXT NOT NULL DEFAULT ''"
        ],
        4 => [
            "CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL DEFAULT 0)",
            "CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL DEFAULT 0)",
            "INSERT OR IGNORE INTO grades (id, name, sort_order) VALUES (1, '高一', 1), (2, '高二', 2), (3, '高三', 3)",
            "INSERT OR IGNORE INTO classes (id, name, sort_order) VALUES (1, '1班', 1), (2, '2班', 2), (3, '3班', 3), (4, '4班', 4), (5, '5班', 5), (6, '6班', 6), (7, '7班', 7), (8, '8班', 8), (9, '9班', 9), (10, '10班', 10), (11, '11班', 11), (12, '12班', 12), (13, '13班', 13), (14, '14班', 14), (15, '15班', 15), (16, '16班', 16), (17, '17班', 17), (18, '18班', 18), (19, '19班', 19), (20, '20班', 20)"
        ],
        5 => [
            "ALTER TABLE rank_goals ADD COLUMN subject_scores TEXT NOT NULL DEFAULT '{}'",
            "ALTER TABLE rank_goals ADD COLUMN exam_id INTEGER DEFAULT NULL",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一上学期10月月考', '2025-10-15', '上学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一上学期期中考试', '2025-11-15', '上学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一上学期12月月考', '2025-12-15', '上学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一上学期期末考试', '2026-01-20', '上学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一下学期3月月考', '2026-03-15', '下学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一下学期期中考试', '2026-04-20', '下学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一下学期5月月考', '2026-05-20', '下学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高一下学期期末考试', '2026-07-05', '下学期', '[\"高一\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二上学期10月月考', '2025-10-15', '上学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二上学期期中考试', '2025-11-15', '上学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二上学期12月月考', '2025-12-15', '上学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二上学期期末考试', '2026-01-20', '上学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二下学期3月月考', '2026-03-15', '下学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二下学期期中考试', '2026-04-20', '下学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二下学期5月月考', '2026-05-20', '下学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高二下学期期末考试', '2026-07-05', '下学期', '[\"高二\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三上学期9月月考', '2025-09-10', '上学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三上学期10月月考', '2025-10-15', '上学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三上学期期中考试', '2025-11-15', '上学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三上学期12月月考', '2025-12-15', '上学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三一模', '2026-01-25', '上学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三下学期开学考', '2026-02-20', '下学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三二模', '2026-03-25', '下学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高三三模', '2026-04-25', '下学期', '[\"高三\"]')",
            "INSERT OR IGNORE INTO exams (name, date, semester, grade_range) VALUES ('高考仿真模拟', '2026-05-20', '下学期', '[\"高三\"]')",
        ],
        6 => [
            "ALTER TABLE scores ADD COLUMN assigned_score REAL",
        ],
        7 => [
            "ALTER TABLE universities ADD COLUMN admission_score INTEGER",
        ],
        8 => [
            "ALTER TABLE universities ADD COLUMN university_type TEXT NOT NULL DEFAULT '综合'",
        ],
    ];
    for ($i = $ver + 1; $i <= count($migrations); $i++) {
        if (!isset($migrations[$i])) break;
        $db->beginTransaction();
        try {
            foreach ($migrations[$i] as $sql) {
                try { $db->exec($sql); } catch (Exception $ex) {}
            }
            $db->exec("INSERT OR REPLACE INTO db_meta (key, value) VALUES ('version', '{$i}')");
            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
    return $db;
}

function queryOne($sql, $params = []) {
    $stmt = getDB()->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function queryAll($sql, $params = []) {
    $stmt = getDB()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getSetting($key, $default = '') {
    try {
        $row = queryOne("SELECT value FROM settings WHERE key = ?", [$key]);
        return $row ? $row['value'] : $default;
    } catch (Exception $e) {
        return $default;
    }
}

// ========== JWT ==========
function generateJwt($payload) {
    $header = base64_url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload['exp'] = time() + JWT_EXPIRE;
    $payload['iat'] = time();
    $body = base64_url_encode(json_encode($payload));
    $sig = base64_url_encode(hash_hmac('sha256', "{$header}.{$body}", getJwtSecret(), true));
    return "{$header}.{$body}.{$sig}";
}

function verifyJwt($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    list($header, $body, $sig) = $parts;
    $expected = base64_url_encode(hash_hmac('sha256', "{$header}.{$body}", getJwtSecret(), true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64_url_decode($body), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

function base64_url_encode($data) { return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); }
function base64_url_decode($data) { return base64_decode(strtr($data, '-_', '+/')); }

// ========== 认证 ==========
function me() {
    // Try Authorization header first
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$auth && isset($_COOKIE['token'])) {
        $auth = 'Bearer ' . $_COOKIE['token'];
    }
    if (!$auth || !str_starts_with($auth, 'Bearer ')) return null;
    $token = substr($auth, 7);
    $pl = verifyJwt($token);
    if (!$pl) return null;
    $st = getDB()->prepare("SELECT id,email,name,role,is_email_verified,membership_type,membership_expires_at,school_id,grade,class_name,subject_type,subjects,subject_preset_id,graduation_status,status,password_hash,phone FROM accounts WHERE id=? AND status='active'");
    $st->execute([$pl['uid']]);
    return $st->fetch(PDO::FETCH_ASSOC) ?: null;
}

function needAuth() { $u = me(); if (!$u) err('请先登录', 401); return $u; }

function needSuperAdmin() {
    $u = me();
    if (!$u) err('请先登录', 401);
    if ($u['role'] !== 'SUPER_ADMIN') err('需要超级管理员权限', 403);
    return $u;
}

function needAdmin() {
    $u = me();
    if (!$u) err('请先登录', 401);
    if (!in_array($u['role'], ['SUPER_ADMIN', 'ADMIN'])) err('需要管理员权限', 403);
    return $u;
}

function needAdminOrViewer() {
    $u = me();
    if (!$u) err('请先登录', 401);
    if (!in_array($u['role'], ['ADMIN', 'SUPER_ADMIN'])) err('需要管理员权限', 403);
    return $u;
}

function protectSuperAdmin($targetUserId) {
    $target = queryOne("SELECT role FROM accounts WHERE id = ?", [$targetUserId]);
    if (!$target) err('用户不存在', 404);
    if ($target['role'] === 'SUPER_ADMIN') err('超级管理员不可被修改', 403);
}

function needVerified($u) {
    if (!$u['is_email_verified']) err('请先完成邮箱验证', 403);
    if (!in_array($u['role'], ['ADMIN', 'SUPER_ADMIN'])) {
        if ($u['membership_expires_at'] && strtotime($u['membership_expires_at']) < time()) {
            err('会员已过期，请联系管理员续费', 403);
        }
    }
}

// ========== 响应 ==========
function ok($data = []) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}
function err($msg, $code = 400) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// ========== 日志 ==========
function logAction($userId, $action, $description = '') {
    try {
        $stmt = getDB()->prepare("INSERT INTO logs (user_id, action, description, ip) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $action, $description, $_SERVER['REMOTE_ADDR'] ?? '']);
    } catch (Exception $e) {}
}

// ========== 自动备份 ==========
function autoBackupIfNeeded() {
    $backupDir = __DIR__ . '/../backups';
    if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
    $today = date('Ymd');
    $todayBackup = $backupDir . "/auto_{$today}.db";
    if (!file_exists($todayBackup)) copy(DB_PATH, $todayBackup);
}

// ========== 邮件 ==========
function sendMail($to, $subject, $body) {
    if (!EMAIL_ENABLED || !SMTP_HOST) return false;
    $fp = fsockopen('ssl://' . SMTP_HOST, SMTP_PORT, $errno, $errstr, 30);
    if (!$fp) return false;
    $CRLF = "\r\n";
    $resp = fgets($fp, 1024);
    fputs($fp, "EHLO " . SMTP_HOST . $CRLF); fgets($fp, 1024);
    fputs($fp, "AUTH LOGIN" . $CRLF); fgets($fp, 1024);
    fputs($fp, base64_encode(SMTP_USER) . $CRLF); fgets($fp, 1024);
    fputs($fp, base64_encode(SMTP_PASS) . $CRLF); fgets($fp, 1024);
    fputs($fp, "MAIL FROM: <" . SMTP_USER . ">" . $CRLF); fgets($fp, 1024);
    fputs($fp, "RCPT TO: <" . $to . ">" . $CRLF); fgets($fp, 1024);
    fputs($fp, "DATA" . $CRLF); fgets($fp, 1024);
    $headers = "From: " . SMTP_NAME . " <" . SMTP_USER . ">" . $CRLF;
    $headers .= "To: <" . $to . ">" . $CRLF;
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=" . $CRLF;
    $headers .= "Content-Type: text/html; charset=UTF-8" . $CRLF . $CRLF;
    fputs($fp, $headers . $body . $CRLF . "." . $CRLF); fgets($fp, 1024);
    fputs($fp, "QUIT" . $CRLF);
    fclose($fp);
    return true;
}

function sendVerificationEmail($email, $code) {
    if (!EMAIL_ENABLED || !SMTP_HOST) return;
    $subject = '阳光学情报告 - 邮箱验证码';
    $body = '<h2>邮箱验证码</h2><p>您的验证码是：<strong style="font-size:24px;color:#409EFF">' . $code . '</strong></p><p>30分钟内有效，请尽快完成验证。</p>';
    sendMail($email, $subject, $body);
}

function sendResetEmail($email, $link) {
    if (!EMAIL_ENABLED || !SMTP_HOST) return;
    $subject = '阳光学情报告 - 重置密码';
    $body = '<h2>重置密码</h2><p>点击以下链接重置密码：</p><p><a href="' . $link . '" style="color:#409EFF">重置密码</a></p><p>30分钟内有效。</p>';
    sendMail($email, $subject, $body);
}

function sendTicketNotification($ticketData) {
    if (!EMAIL_ENABLED || !SMTP_HOST) return;
    $subject = '阳光学情报告 - 新工单通知';
    $body = '<h2>新工单通知</h2>';
    $body .= '<p><strong>用户：</strong>' . htmlspecialchars($ticketData['user_name'] ?? '') . '</p>';
    $body .= '<p><strong>邮箱：</strong>' . htmlspecialchars($ticketData['user_email'] ?? '') . '</p>';
    $body .= '<p><strong>标题：</strong>' . htmlspecialchars($ticketData['title'] ?? '') . '</p>';
    $body .= '<p><strong>内容：</strong>' . nl2br(htmlspecialchars($ticketData['content'] ?? '')) . '</p>';
    $body .= '<p><strong>验证码：</strong>' . htmlspecialchars($ticketData['captcha'] ?? '') . '</p>';
    sendMail(ADMIN_EMAIL, $subject, $body);
}

// ========== 工具 ==========
function sanitizeUser($user) {
    if (!$user) return null;
    unset($user['password_hash'], $user['verification_code']);
    return $user;
}
