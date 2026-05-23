<?php
require_once __DIR__ . '/../../config.php';

$input = jsonInput();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && isPost('start')) {
    handleVisitStart($input);
} elseif ($method === 'POST' && isPost('heartbeat')) {
    handleVisitHeartbeat($input);
} elseif ($method === 'POST' && isPost('end')) {
    handleVisitEnd($input);
} elseif ($method === 'GET' && isGet('stats')) {
    needAdmin();
    handleGetStats();
} elseif ($method === 'GET' && isGet('trend')) {
    needAdmin();
    handleGetTrend();
} elseif ($method === 'GET' && isGet('sources')) {
    needAdmin();
    handleGetSources();
} elseif ($method === 'GET' && isGet('pages')) {
    needAdmin();
    handleGetTopPages();
} elseif ($method === 'GET' && isGet('geo')) {
    needAdmin();
    handleGetGeoDistribution();
} elseif ($method === 'GET' && isGet('keywords')) {
    needAdmin();
    handleGetSearchKeywords();
} elseif ($method === 'GET' && isGet('logs')) {
    needAdmin();
    handleGetLogs();
} elseif ($method === 'POST' && isPost('addBlacklist')) {
    needAdmin();
    handleAddBlacklist($input);
} elseif ($method === 'POST' && isPost('removeBlacklist')) {
    needAdmin();
    handleRemoveBlacklist($input);
} elseif ($method === 'GET' && isGet('blacklist')) {
    needAdmin();
    handleGetBlacklist();
} else {
    ok(['message' => 'Visitor tracking API']);
}

function handleVisitStart($input) {
    $db = getDB();
    $uuid = $input['uuid'] ?? generateUUID();
    $ip = getClientIP();
    $referer = $input['referer'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    $url = $input['url'] ?? $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

    // Check blacklist
    $stmt = $db->prepare("SELECT id FROM ip_blacklist WHERE ip_address = ?");
    $stmt->execute([$ip]);
    $isBlacklisted = $stmt->fetchColumn() ? 1 : 0;

    // Detect bot
    $isBot = detectBot($userAgent);

    // Parse referer for search engine info
    $searchInfo = parseSearchReferrer($referer);

    // Parse user agent
    $uaInfo = parseUserAgent($userAgent);

    // Get IP geolocation (simple local lookup for China IPs)
    $geo = getIPGeo($ip);

    // Create or update visitor session
    $stmt = $db->prepare("INSERT INTO visitor_logs (
        visitor_uuid, visit_start_time, page_url, referer_url, ip_address,
        country, province, city, isp, device_type, os_name, browser_name,
        browser_version, search_engine, search_keyword, channel_tag,
        is_bot, is_blacklisted, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+8 hours'))");

    $stmt->execute([
        $uuid,
        date('Y-m-d H:i:s'),
        $url,
        $referer,
        $ip,
        $geo['country'] ?? '',
        $geo['province'] ?? '',
        $geo['city'] ?? '',
        $geo['isp'] ?? '',
        $uaInfo['device'],
        $uaInfo['os'],
        $uaInfo['browser'],
        $uaInfo['version'],
        $searchInfo['engine'],
        $searchInfo['keyword'],
        $input['channel'] ?? '',
        $isBot,
        $isBlacklisted
    ]);

    ok(['uuid' => $uuid, 'is_blacklisted' => $isBlacklisted]);
}

function handleVisitHeartbeat($input) {
    // Update last activity time
    $uuid = $input['uuid'] ?? '';
    if ($uuid) {
        $db = getDB();
        $stmt = $db->prepare("UPDATE visitor_logs SET visit_end_time = datetime('now', '+8 hours') WHERE visitor_uuid = ? AND visit_end_time IS NULL");
        $stmt->execute([$uuid]);
    }
    ok();
}

function handleVisitEnd($input) {
    $uuid = $input['uuid'] ?? '';
    if ($uuid) {
        $db = getDB();
        $stmt = $db->prepare("UPDATE visitor_logs SET visit_end_time = datetime('now', '+8 hours'), duration_seconds = CAST((julianday(datetime('now', '+8 hours')) - julianday(visit_start_time)) * 86400 AS INTEGER) WHERE visitor_uuid = ?");
        $stmt->execute([$uuid]);
    }
    ok();
}

function handleGetStats() {
    $db = getDB();
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $weekAgo = date('Y-m-d', strtotime('-7 days'));
    $monthAgo = date('Y-m-d', strtotime('-30 days'));

    // Total visitors (unique UUIDs)
    $total = $db->query("SELECT COUNT(DISTINCT visitor_uuid) FROM visitor_logs WHERE is_bot = 0 AND is_blacklisted = 0")->fetchColumn();

    // Today visitors
    $todayVisitors = $db->query("SELECT COUNT(DISTINCT visitor_uuid) FROM visitor_logs WHERE DATE(visit_start_time) = '$today' AND is_bot = 0 AND is_blacklisted = 0")->fetchColumn();

    // Yesterday visitors
    $yesterdayVisitors = $db->query("SELECT COUNT(DISTINCT visitor_uuid) FROM visitor_logs WHERE DATE(visit_start_time) = '$yesterday' AND is_bot = 0 AND is_blacklisted = 0")->fetchColumn();

    // Week visitors
    $weekVisitors = $db->query("SELECT COUNT(DISTINCT visitor_uuid) FROM visitor_logs WHERE DATE(visit_start_time) >= '$weekAgo' AND is_bot = 0 AND is_blacklisted = 0")->fetchColumn();

    // Month visitors
    $monthVisitors = $db->query("SELECT COUNT(DISTINCT visitor_uuid) FROM visitor_logs WHERE DATE(visit_start_time) >= '$monthAgo' AND is_bot = 0 AND is_blacklisted = 0")->fetchColumn();

    // Average duration today
    $avgDuration = $db->query("SELECT COALESCE(AVG(duration_seconds), 0) FROM visitor_logs WHERE DATE(visit_start_time) = '$today' AND duration_seconds > 0 AND is_bot = 0 AND is_blacklisted = 0")->fetchColumn();

    ok([
        'total_visitors' => (int)$total,
        'today_visitors' => (int)$todayVisitors,
        'yesterday_visitors' => (int)$yesterdayVisitors,
        'week_visitors' => (int)$weekVisitors,
        'month_visitors' => (int)$monthVisitors,
        'avg_duration' => round($avgDuration, 1),
        'growth_rate' => $yesterdayVisitors > 0 ? round(($todayVisitors - $yesterdayVisitors) / $yesterdayVisitors * 100, 1) : 0
    ]);
}

function handleGetTrend() {
    $db = getDB();
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 7;
    $startDate = date('Y-m-d', strtotime("-{$days} days"));

    $stmt = $db->prepare("
        SELECT DATE(visit_start_time) as date, COUNT(DISTINCT visitor_uuid) as visitors
        FROM visitor_logs
        WHERE DATE(visit_start_time) >= ? AND is_bot = 0 AND is_blacklisted = 0
        GROUP BY DATE(visit_start_time)
        ORDER BY date
    ");
    $stmt->execute([$startDate]);
    $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);

    ok(['trend' => $trend, 'days' => $days]);
}

function handleGetSources() {
    $db = getDB();
    $startDate = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');

    $stmt = $db->prepare("
        SELECT
            CASE
                WHEN referer_url LIKE '%baidu.com%' THEN '百度'
                WHEN referer_url LIKE '%sogou.com%' THEN '搜狗'
                WHEN referer_url LIKE '%so.com%' OR referer_url LIKE '%360.cn%' THEN '360'
                WHEN referer_url LIKE '%google.com%' OR referer_url LIKE '%google.cn%' THEN '谷歌'
                WHEN referer_url LIKE '%bing.com%' THEN '必应'
                WHEN referer_url = '' OR referer_url IS NULL THEN '直接访问'
                ELSE '其他来源'
            END as source,
            COUNT(DISTINCT visitor_uuid) as visitors
        FROM visitor_logs
        WHERE DATE(visit_start_time) BETWEEN ? AND ? AND is_bot = 0 AND is_blacklisted = 0
        GROUP BY source
        ORDER BY visitors DESC
    ");
    $stmt->execute([$startDate, $endDate]);

    ok(['sources' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function handleGetTopPages() {
    $db = getDB();
    $startDate = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');

    $stmt = $db->prepare("
        SELECT page_url, COUNT(DISTINCT visitor_uuid) as visitors
        FROM visitor_logs
        WHERE DATE(visit_start_time) BETWEEN ? AND ? AND is_bot = 0 AND is_blacklisted = 0
        GROUP BY page_url
        ORDER BY visitors DESC
        LIMIT 10
    ");
    $stmt->execute([$startDate, $endDate]);

    ok(['pages' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function handleGetGeoDistribution() {
    $db = getDB();
    $startDate = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');

    $stmt = $db->prepare("
        SELECT COALESCE(province, '未知') as province, COUNT(DISTINCT visitor_uuid) as visitors
        FROM visitor_logs
        WHERE DATE(visit_start_time) BETWEEN ? AND ? AND is_bot = 0 AND is_blacklisted = 0 AND province != ''
        GROUP BY province
        ORDER BY visitors DESC
        LIMIT 15
    ");
    $stmt->execute([$startDate, $endDate]);

    ok(['geo' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function handleGetSearchKeywords() {
    $db = getDB();
    $startDate = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');

    $stmt = $db->prepare("
        SELECT search_keyword, COUNT(*) as count
        FROM visitor_logs
        WHERE DATE(visit_start_time) BETWEEN ? AND ? AND is_bot = 0 AND is_blacklisted = 0 AND search_keyword != ''
        GROUP BY search_keyword
        ORDER BY count DESC
        LIMIT 20
    ");
    $stmt->execute([$startDate, $endDate]);

    ok(['keywords' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function handleGetLogs() {
    $db = getDB();
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    $where = 'WHERE is_bot = 0';
    $params = [];

    if (isset($_GET['start'])) {
        $where .= ' AND DATE(visit_start_time) >= ?';
        $params[] = $_GET['start'];
    }
    if (isset($_GET['end'])) {
        $where .= ' AND DATE(visit_start_time) <= ?';
        $params[] = $_GET['end'];
    }
    if (isset($_GET['ip'])) {
        $where .= ' AND ip_address = ?';
        $params[] = $_GET['ip'];
    }
    if (isset($_GET['uuid'])) {
        $where .= ' AND visitor_uuid = ?';
        $params[] = $_GET['uuid'];
    }
    if (isset($_GET['blacklisted'])) {
        $where .= ' AND is_blacklisted = 1';
    }

    $totalStmt = $db->prepare("SELECT COUNT(*) FROM visitor_logs $where");
    $totalStmt->execute($params);
    $total = $totalStmt->fetchColumn();

    $stmt = $db->prepare("SELECT * FROM visitor_logs $where ORDER BY visit_start_time DESC LIMIT $limit OFFSET $offset");
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    ok([
        'list' => $logs,
        'total' => (int)$total,
        'page' => $page,
        'limit' => $limit,
        'pages' => ceil($total / $limit)
    ]);
}

function handleAddBlacklist($input) {
    $ip = trim($input['ip'] ?? '');
    $reason = trim($input['reason'] ?? '');
    if (!$ip || !filter_var($ip, FILTER_VALIDATE_IP)) err('IP地址格式不正确');

    $db = getDB();
    try {
        $stmt = $db->prepare("INSERT INTO ip_blacklist (ip_address, reason) VALUES (?, ?)");
        $stmt->execute([$ip, $reason]);
        // Also update existing logs
        $db->prepare("UPDATE visitor_logs SET is_blacklisted = 1 WHERE ip_address = ?")->execute([$ip]);
        ok(['message' => 'IP已加入黑名单']);
    } catch (PDOException $e) {
        err('IP已在黑名单中');
    }
}

function handleRemoveBlacklist($input) {
    $id = (int)($input['id'] ?? 0);
    if (!$id) err('记录ID不正确');

    $db = getDB();
    $stmt = $db->prepare("SELECT ip_address FROM ip_blacklist WHERE id = ?");
    $stmt->execute([$id]);
    $ip = $stmt->fetchColumn();

    if (!$ip) err('黑名单记录不存在');

    $db->prepare("DELETE FROM ip_blacklist WHERE id = ?")->execute([$id]);
    $db->prepare("UPDATE visitor_logs SET is_blacklisted = 0 WHERE ip_address = ?")->execute([$ip]);

    ok(['message' => '已从黑名单移除']);
}

function handleGetBlacklist() {
    $db = getDB();
    $stmt = $db->query("SELECT * FROM ip_blacklist ORDER BY created_at DESC");
    ok(['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function getClientIP() {
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'REMOTE_ADDR'
    ];
    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ips = explode(',', $_SERVER[$header]);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

function detectBot($ua) {
    $botPatterns = [
        'Googlebot', 'Bingbot', 'Baiduspider', 'Sogou web spider', '360Spider',
        'Yahoo! Slurp', 'YandexBot', 'DuckDuckBot', 'facebot', 'ia_archiver',
        'Scrapy', 'curl', 'wget', 'python-requests', 'Go-http-client',
        'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'Bytespider'
    ];
    foreach ($botPatterns as $pattern) {
        if (stripos($ua, $pattern) !== false) return 1;
    }
    return 0;
}

function parseSearchReferrer($referer) {
    $result = ['engine' => '', 'keyword' => ''];
    if (!$referer) return $result;

    $url = parse_url($referer);
    if (!$url || !isset($url['host'])) return $result;

    $host = $url['host'];
    $query = isset($url['query']) ? $url['query'] : '';
    parse_str($query, $params);

    $engines = [
        'baidu.com' => ['name' => '百度', 'param' => 'wd'],
        'www.baidu.com' => ['name' => '百度', 'param' => 'wd'],
        'sogou.com' => ['name' => '搜狗', 'param' => 'query'],
        'www.sogou.com' => ['name' => '搜狗', 'param' => 'query'],
        'so.com' => ['name' => '360', 'param' => 'q'],
        'www.so.com' => ['name' => '360', 'param' => 'q'],
        'google.com' => ['name' => '谷歌', 'param' => 'q'],
        'www.google.com' => ['name' => '谷歌', 'param' => 'q'],
        'google.cn' => ['name' => '谷歌', 'param' => 'q'],
        'bing.com' => ['name' => '必应', 'param' => 'q'],
        'www.bing.com' => ['name' => '必应', 'param' => 'q'],
    ];

    foreach ($engines as $domain => $info) {
        if (strpos($host, $domain) !== false) {
            $result['engine'] = $info['name'];
            $result['keyword'] = urldecode($params[$info['param']] ?? '');
            break;
        }
    }

    return $result;
}

function parseUserAgent($ua) {
    $result = ['device' => 'PC', 'os' => 'Unknown', 'browser' => 'Unknown', 'version' => ''];

    // Device
    if (preg_match('/Mobile|Android|iPhone|iPad/i', $ua)) {
        $result['device'] = preg_match('/iPad/i', $ua) ? '平板' : '手机';
    }

    // OS
    if (preg_match('/Windows NT 10/i', $ua)) $result['os'] = 'Windows 10';
    elseif (preg_match('/Windows NT 6.3/i', $ua)) $result['os'] = 'Windows 8.1';
    elseif (preg_match('/Windows NT 6.2/i', $ua)) $result['os'] = 'Windows 8';
    elseif (preg_match('/Windows NT 6.1/i', $ua)) $result['os'] = 'Windows 7';
    elseif (preg_match('/Mac OS X/i', $ua)) $result['os'] = 'macOS';
    elseif (preg_match('/Android/i', $ua)) $result['os'] = 'Android';
    elseif (preg_match('/iPhone|iPad|iPod/i', $ua)) $result['os'] = 'iOS';
    elseif (preg_match('/Linux/i', $ua)) $result['os'] = 'Linux';

    // Browser
    if (preg_match('/Edg\/(\d+)/i', $ua, $m)) { $result['browser'] = 'Edge'; $result['version'] = $m[1]; }
    elseif (preg_match('/Chrome\/(\d+)/i', $ua, $m)) { $result['browser'] = 'Chrome'; $result['version'] = $m[1]; }
    elseif (preg_match('/Firefox\/(\d+)/i', $ua, $m)) { $result['browser'] = 'Firefox'; $result['version'] = $m[1]; }
    elseif (preg_match('/Safari\/(\d+)/i', $ua, $m) && !preg_match('/Chrome/i', $ua)) { $result['browser'] = 'Safari'; $result['version'] = $m[1]; }
    elseif (preg_match('/MSIE (\d+)/i', $ua, $m)) { $result['browser'] = 'IE'; $result['version'] = $m[1]; }
    elseif (preg_match('/Trident.*rv:(\d+)/i', $ua, $m)) { $result['browser'] = 'IE'; $result['version'] = $m[1]; }

    return $result;
}

function getIPGeo($ip) {
    // Simple IP range mapping for China provinces (limited dataset)
    // In production, you'd use a proper GeoIP database or API
    $geo = [
        'country' => '中国',
        'province' => '',
        'city' => '',
        'isp' => ''
    ];

    // For local/private IPs
    if (in_array($ip, ['127.0.0.1', '0.0.0.0', '::1'])) {
        $geo['province'] = '本地';
        $geo['city'] = '本地';
        $geo['isp'] = '本地网络';
        return $geo;
    }

    // Try to get location from a free API (taobao API)
    $ctx = stream_context_create(['http' => ['timeout' => 2, 'ignore_errors' => true]]);
    $url = "https://ip.taobao.com/outGetIpInfo?ip={$ip}&accessKey=alibaba-inc";
    $data = @file_get_contents($url, false, $ctx);
    if ($data) {
        $json = json_decode($data, true);
        if ($json && $json['code'] == 0 && isset($json['data'])) {
            $d = $json['data'];
            $geo['province'] = $d['region'] ?? '';
            $geo['city'] = $d['city'] ?? '';
            $geo['isp'] = $d['isp'] ?? '';
        }
    }

    return $geo;
}
?>
