<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$routePath = preg_replace('#/+#', '/', $uri);
$routePath = preg_replace('#^/api#', '', $routePath);

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$allowedOrigins = ['http://localhost:5173', 'http://rs.cn', 'http://localhost'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($method === 'OPTIONS') {
    if (in_array($origin, $allowedOrigins)) header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type,Authorization');
    exit;
}
if (in_array($origin, $allowedOrigins)) header("Access-Control-Allow-Origin: {$origin}");
header('Content-Type: application/json; charset=utf-8');

$routeFiles = [
    __DIR__ . '/routes/common.routes.php',
    __DIR__ . '/routes/auth.routes.php',
    __DIR__ . '/routes/profile.routes.php',
    __DIR__ . '/routes/dashboard.routes.php',
    __DIR__ . '/routes/scores.routes.php',
    __DIR__ . '/routes/exams.routes.php',
    __DIR__ . '/routes/goals.routes.php',
    __DIR__ . '/routes/universities.routes.php',
    __DIR__ . '/routes/preference.routes.php',
    __DIR__ . '/routes/visitor.routes.php',
    __DIR__ . '/routes/admin.routes.php',
];

foreach ($routeFiles as $file) {
    if (file_exists($file)) {
        include $file;
    }
}

err('接口不存在', 404);
