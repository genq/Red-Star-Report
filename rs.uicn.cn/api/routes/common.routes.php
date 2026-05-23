<?php
if ($routePath === '/captcha' && $method === 'GET') {
    $captchaId = bin2hex(random_bytes(16));
    $captchaText = substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), 0, 4);

    $img = imagecreate(80, 30);
    $bg = imagecolorallocate($img, 255, 255, 255);
    $textColor = imagecolorallocate($img, 51, 51, 51);
    $lineColor = imagecolorallocate($img, 200, 200, 200);

    for ($i = 0; $i < 3; $i++) {
        imageline($img, rand(0, 80), rand(0, 30), rand(0, 80), rand(0, 30), $lineColor);
    }

    imagestring($img, 5, 20, 8, $captchaText, $textColor);

    ob_start();
    imagepng($img);
    $imgData = ob_get_clean();
    imagedestroy($img);

    $captchaBase64 = 'data:image/png;base64,' . base64_encode($imgData);

    $_SESSION['captcha_' . $captchaId] = $captchaText;

    ok(['captchaId' => $captchaId, 'captchaImg' => $captchaBase64]);
}

if ($routePath === '/settings' && $method === 'GET') {
    $settings = queryAll("SELECT * FROM settings");
    $result = [];
    foreach ($settings as $s) $result[$s['key']] = $s['value'];
    ok($result);
}

if ($routePath === '/changelog' && $method === 'GET') {
    $list = queryAll("SELECT * FROM changelog ORDER BY created_at DESC");
    ok(['data' => $list]);
}

if ($routePath === '/options' && $method === 'GET') {
    $schools = queryAll("SELECT id, name FROM schools ORDER BY id");
    $grades = queryAll("SELECT id, name FROM grades ORDER BY sort_order");
    $classes = queryAll("SELECT id, name FROM classes ORDER BY sort_order");
    $presets = queryAll("SELECT id, name, first_choice, re_choices, subjects FROM subject_presets WHERE is_active = 1 ORDER BY id");
    ok(['schools' => $schools, 'grades' => $grades, 'classes' => $classes, 'presets' => $presets]);
}
