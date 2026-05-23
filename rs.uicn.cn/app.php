<?php
require_once __DIR__ . '/api/config.php';

// 禁用所有缓存（开发阶段）
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$user = null;

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($authHeader) {
    $token = substr($authHeader, 7);
    $user = me();
    if ($user) {
        setcookie('token', $token, time() + 86400 * 7, '/');
    }
}

if (!$user) {
    $cookieToken = $_COOKIE['token'] ?? '';
    if ($cookieToken) {
        $authHeader = "Bearer {$cookieToken}";
        $_SERVER['HTTP_AUTHORIZATION'] = $authHeader;
        $user = me();
    }
}

if (!$user) {
    header('Location: /');
    exit;
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo getSetting('site_name', '阳光学情报告'); ?> - V<?php echo SITE_VERSION; ?></title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>★</text></svg>" />
    <link rel="stylesheet" href="/assets/style.css?v=<?php echo SITE_VERSION . '.' . filemtime(__DIR__ . '/assets/style.css'); ?>" />
</head>
<body>
    <div id="app">
        <div class="layout">
            <div class="sidebar">
                <div class="logo-bar">
                    <div class="logo-icon">★</div>
                    <span class="logo-text" id="siteLogoText">Red-Star</span>
                    <span class="version">V<?php echo SITE_VERSION; ?></span>
                </div>
                <div class="menu" id="menu"></div>
                <div class="footer"><div class="menu-item" onclick="logout()"><span class="icon">🚪</span> 退出登录</div></div>
            </div>
            <div class="main">
                <div class="topbar">
                    <div class="left"></div>
                    <div class="right">
                        <span id="encourageMsg" style="font-size:13px;color:#ff9800;margin-right:16px"></span>
                        <div class="user-info">
                            <div class="avatar" id="userAvatar"></div>
                            <div>
                                <div class="user-name" id="userName"></div>
                                <div class="user-role" id="userRole"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content" id="content"></div>
            </div>
        </div>
    </div>
    <button class="mobile-toggle" id="mobileToggle" onclick="toggleMobileMenu()">☰</button>
    <div class="sidebar-overlay" onclick="toggleMobileMenu()"></div>
    <script src="/assets/app.js?v=<?php echo SITE_VERSION . '.' . filemtime(__DIR__ . '/assets/app.js'); ?>"></script>
    <script src="/assets/visitor-admin.js?v=<?php echo SITE_VERSION; ?>"></script>
    <script>
        var currentUser = <?php echo json_encode(sanitizeUser($user)); ?>;
        var siteVersion = '<?php echo SITE_VERSION; ?>';
        initApp();
    </script>
    <!-- 访客统计 -->
    <script src="/assets/visitor.js"></script>
</body>
</html>
