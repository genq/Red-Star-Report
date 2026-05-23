<?php
require_once __DIR__ . '/api/config.php';

$cookieToken = $_COOKIE['token'] ?? '';
if ($cookieToken) {
    $_SERVER['HTTP_AUTHORIZATION'] = "Bearer {$cookieToken}";
    $user = me();
    if ($user) {
        header('Location: /index.php');
        exit;
    }
}

$schools = queryAll("SELECT id, name FROM schools ORDER BY id");
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>登录 - 阳光学情报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .login-card { background: #fff; border-radius: 12px; padding: 40px; width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,.15); }
        .login-card h1 { text-align: center; color: #409EFF; margin-bottom: 8px; font-size: 24px; }
        .login-card .subtitle { text-align: center; color: #888; margin-bottom: 24px; font-size: 14px; }
        .login-card .error { background: #fef0f0; color: #f56c6c; padding: 10px; border-radius: 4px; margin-bottom: 16px; font-size: 14px; display: none; }
        .login-card .error.show { display: block; }
        .login-card .success { background: #f0f9eb; color: #67c23a; padding: 10px; border-radius: 4px; margin-bottom: 16px; font-size: 14px; display: none; }
        .login-card .success.show { display: block; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: #333; }
        .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; outline: none; transition: border-color .2s; }
        .form-group input:focus, .form-group select:focus { border-color: #409EFF; }
        .btn-login { width: 100%; padding: 12px; background: #409EFF; color: #fff; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; transition: background .2s; }
        .btn-login:hover { background: #66b1ff; }
        .btn-login:disabled { background: #a0cfff; cursor: not-allowed; }
        .login-footer { text-align: center; margin-top: 16px; font-size: 13px; color: #888; }
        .login-footer a { color: #409EFF; text-decoration: none; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .hidden { display: none; }
        .input-hint { font-size: 12px; color: #999; margin-top: 4px; }
        .confirm-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
        .confirm-overlay.show { display: flex; }
        .confirm-box { background: #fff; border-radius: 12px; padding: 32px; width: 380px; text-align: center; }
        .confirm-box h3 { margin-bottom: 16px; color: #333; }
        .confirm-box .info { background: #f5f7fa; border-radius: 8px; padding: 12px; margin: 16px 0; text-align: left; font-size: 14px; color: #666; line-height: 1.8; }
        .confirm-box .btns { display: flex; gap: 12px; margin-top: 20px; }
        .confirm-box .btns button { flex: 1; padding: 10px; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; }
        .confirm-box .btn-cancel { background: #f0f0f0; color: #666; }
        .confirm-box .btn-confirm { background: #409EFF; color: #fff; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>☀️ 阳光学情报告</h1>
        <p class="subtitle">Red-Star Academic Report Platform</p>
        <div class="error" id="errorMsg"></div>
        <div class="success" id="successMsg"></div>

        <!-- 登录表单 -->
        <div id="loginForm">
            <form onsubmit="return handleLogin(event)">
                <div class="form-group">
                    <label>邮箱 / 手机号</label>
                    <input type="text" id="loginAccount" placeholder="请输入邮箱或手机号" required autocomplete="username" />
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" id="loginPassword" placeholder="请输入密码" required autocomplete="current-password" />
                </div>
                <button type="submit" class="btn-login" id="loginBtn">登 录</button>
            </form>
            <div class="login-footer">
                <p><a href="#" onclick="showForgotPassword()">忘记密码？</a></p>
                <p style="margin-top:8px">还没有账号？<a href="#" onclick="showRegister()">立即注册</a></p>
            </div>
        </div>

        <!-- 注册表单 -->
        <div id="registerForm" class="hidden">
            <form onsubmit="return handleRegister(event)">
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email" id="regEmail" placeholder="请输入邮箱" required autocomplete="email" />
                </div>
                <div class="form-group">
                    <label>手机号</label>
                    <input type="tel" id="regPhone" placeholder="请输入手机号" required pattern="^1[3-9]\d{9}$" maxlength="11" autocomplete="tel" />
                    <div class="input-hint">手机号用于登录和找回密码</div>
                </div>
                <div class="form-group">
                    <label>姓名</label>
                    <input type="text" id="regName" placeholder="请输入姓名（最多4个字）" required maxlength="4" />
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <input type="password" id="regPassword" placeholder="至少6位" required minlength="6" autocomplete="new-password" />
                </div>
                <div class="form-group">
                    <label>确认密码</label>
                    <input type="password" id="regConfirmPassword" placeholder="再次输入密码" required autocomplete="new-password" />
                </div>
                <div class="form-group">
                    <label>学校</label>
                    <select id="regSchool">
                        <option value="">请选择学校</option>
                        <?php foreach ($schools as $s): ?>
                        <option value="<?php echo $s['id']; ?>"><?php echo htmlspecialchars($s['name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>年级</label>
                        <select id="regGrade">
                            <option value="高一">高一</option>
                            <option value="高二">高二</option>
                            <option value="高三">高三</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>班级</label>
                        <input type="text" id="regClassName" placeholder="如：1班" />
                    </div>
                </div>
                <button type="submit" class="btn-login" id="regBtn">注 册</button>
            </form>
            <div class="login-footer">
                <p>已有账号？<a href="#" onclick="showLogin()">返回登录</a></p>
            </div>
        </div>

        <!-- 邮箱验证 -->
        <div id="verifyForm" class="hidden">
            <p style="text-align:center;color:#666;margin-bottom:16px;font-size:14px">请检查邮箱获取验证码</p>
            <div class="form-group">
                <label>验证码</label>
                <input type="text" id="verifyCode" placeholder="请输入6位验证码" maxlength="6" required />
            </div>
            <button type="submit" class="btn-login" id="verifyBtn" onclick="handleVerify()">确 认</button>
            <div class="login-footer">
                <p><a href="#" onclick="handleResendEmail()">重新发送验证码</a></p>
                <p style="margin-top:8px"><a href="#" onclick="showLogin()">返回登录</a></p>
            </div>
        </div>

        <!-- 忘记密码：发送验证码 -->
        <div id="forgotForm" class="hidden">
            <p style="text-align:center;color:#666;margin-bottom:16px;font-size:14px">通过邮箱验证码重置密码</p>
            <div class="form-group">
                <label>邮箱</label>
                <input type="email" id="forgotEmail" placeholder="请输入注册邮箱" required />
            </div>
            <button type="submit" class="btn-login" id="forgotSendBtn" onclick="handleForgotSend()">发送验证码</button>
            <div class="login-footer" style="margin-top:12px">
                <p><a href="#" onclick="showRecoverEmail()">忘记邮箱？</a></p>
                <p style="margin-top:8px"><a href="#" onclick="showLogin()">返回登录</a></p>
            </div>
        </div>

        <!-- 忘记密码：输入验证码 -->
        <div id="forgotVerifyForm" class="hidden">
            <p style="text-align:center;color:#666;margin-bottom:16px;font-size:14px">请输入邮箱收到的验证码</p>
            <div class="form-group">
                <label>验证码</label>
                <input type="text" id="forgotCode" placeholder="请输入6位验证码" maxlength="6" required />
            </div>
            <button type="submit" class="btn-login" id="forgotVerifyBtn" onclick="handleForgotVerify()">验证</button>
            <div class="login-footer" style="margin-top:12px">
                <p><a href="#" onclick="handleForgotSend()">重新发送</a></p>
            </div>
        </div>

        <!-- 忘记密码：设置新密码 -->
        <div id="forgotResetForm" class="hidden">
            <p style="text-align:center;color:#666;margin-bottom:16px;font-size:14px">请设置新密码</p>
            <div class="form-group">
                <label>新密码</label>
                <input type="password" id="newPassword" placeholder="至少6位" required minlength="6" autocomplete="new-password" />
            </div>
            <div class="form-group">
                <label>确认密码</label>
                <input type="password" id="confirmPassword" placeholder="再次输入密码" required autocomplete="new-password" />
            </div>
            <button type="submit" class="btn-login" id="resetBtn" onclick="handleForgotReset()">确认重置</button>
        </div>

        <!-- 忘记邮箱：姓名+手机号找回 -->
        <div id="recoverEmailForm" class="hidden">
            <p style="text-align:center;color:#666;margin-bottom:16px;font-size:14px">通过姓名和手机号找回邮箱</p>
            <div class="form-group">
                <label>姓名</label>
                <input type="text" id="recoverName" placeholder="请输入姓名" required />
            </div>
            <div class="form-group">
                <label>手机号</label>
                <input type="tel" id="recoverPhone" placeholder="请输入手机号" required pattern="^1[3-9]\d{9}$" maxlength="11" />
            </div>
            <button type="submit" class="btn-login" id="recoverBtn" onclick="handleRecoverEmail()">查询</button>
            <div class="login-footer" style="margin-top:12px">
                <p><a href="#" onclick="showForgotPassword()">返回</a></p>
            </div>
        </div>

        <!-- 查询结果 -->
        <div id="recoverResultForm" class="hidden">
            <p style="text-align:center;color:#666;margin-bottom:16px;font-size:14px" id="recoverResultMsg"></p>
            <div class="login-footer">
                <p><a href="#" onclick="showForgotPassword()">去重置密码</a></p>
                <p style="margin-top:8px"><a href="#" onclick="showLogin()">返回登录</a></p>
            </div>
        </div>
    </div>

    <!-- 注册确认弹窗 -->
    <div class="confirm-overlay" id="regConfirmOverlay">
        <div class="confirm-box">
            <h3>请确认注册信息</h3>
            <div class="info" id="regConfirmInfo"></div>
            <p style="font-size:12px;color:#e74c5c;margin-top:8px">姓名和手机号保存后将锁定，如需修改请联系管理员</p>
            <div class="btns">
                <button class="btn-cancel" onclick="closeRegConfirm()">返回修改</button>
                <button class="btn-confirm" onclick="submitRegister()">确认注册</button>
            </div>
        </div>
    </div>

    <script>
        function showMsg(msg) {
            var el = document.getElementById('errorMsg');
            el.textContent = msg;
            el.className = 'error show';
            document.getElementById('successMsg').className = 'success';
        }
        function showSuccess(msg) {
            var el = document.getElementById('successMsg');
            el.textContent = msg;
            el.className = 'success show';
            document.getElementById('errorMsg').className = 'error';
        }
        function hideMsg() {
            document.getElementById('errorMsg').className = 'error';
            document.getElementById('successMsg').className = 'success';
        }
        function showRegister() {
            document.getElementById('loginForm').className = 'hidden';
            document.getElementById('forgotForm').className = 'hidden';
            document.getElementById('forgotVerifyForm').className = 'hidden';
            document.getElementById('forgotResetForm').className = 'hidden';
            document.getElementById('recoverEmailForm').className = 'hidden';
            document.getElementById('recoverResultForm').className = 'hidden';
            document.getElementById('registerForm').className = '';
            hideMsg();
        }
        function showLogin() {
            document.getElementById('registerForm').className = 'hidden';
            document.getElementById('verifyForm').className = 'hidden';
            document.getElementById('forgotForm').className = 'hidden';
            document.getElementById('forgotVerifyForm').className = 'hidden';
            document.getElementById('forgotResetForm').className = 'hidden';
            document.getElementById('recoverEmailForm').className = 'hidden';
            document.getElementById('recoverResultForm').className = 'hidden';
            document.getElementById('loginForm').className = '';
            hideMsg();
        }
        function showVerify() {
            document.getElementById('loginForm').className = 'hidden';
            document.getElementById('registerForm').className = 'hidden';
            document.getElementById('verifyForm').className = '';
            document.getElementById('forgotForm').className = 'hidden';
            document.getElementById('forgotVerifyForm').className = 'hidden';
            document.getElementById('forgotResetForm').className = 'hidden';
            document.getElementById('recoverEmailForm').className = 'hidden';
            document.getElementById('recoverResultForm').className = 'hidden';
            hideMsg();
        }
        function showForgotPassword() {
            document.getElementById('loginForm').className = 'hidden';
            document.getElementById('registerForm').className = 'hidden';
            document.getElementById('verifyForm').className = 'hidden';
            document.getElementById('forgotForm').className = '';
            document.getElementById('forgotVerifyForm').className = 'hidden';
            document.getElementById('forgotResetForm').className = 'hidden';
            document.getElementById('recoverEmailForm').className = 'hidden';
            document.getElementById('recoverResultForm').className = 'hidden';
            hideMsg();
        }
        function showRecoverEmail() {
            document.getElementById('loginForm').className = 'hidden';
            document.getElementById('registerForm').className = 'hidden';
            document.getElementById('verifyForm').className = 'hidden';
            document.getElementById('forgotForm').className = 'hidden';
            document.getElementById('forgotVerifyForm').className = 'hidden';
            document.getElementById('forgotResetForm').className = 'hidden';
            document.getElementById('recoverResultForm').className = 'hidden';
            document.getElementById('recoverEmailForm').className = '';
            hideMsg();
        }

        async function handleLogin(e) {
            e.preventDefault();
            hideMsg();
            var btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.textContent = '登录中...';
            try {
                var res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        account: document.getElementById('loginAccount').value,
                        password: document.getElementById('loginPassword').value
                    })
                });
                var data = await res.json();
                if (data.success && data.data && data.data.token) {
                    document.cookie = 'token=' + data.data.token + '; path=/; max-age=' + (86400 * 7);
                    location.href = '/index.php';
                } else {
                    showMsg(data.message || '登录失败');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '登 录';
            }
            return false;
        }

        // 注册分两步：先弹出确认，再提交
        function handleRegister(e) {
            e.preventDefault();
            hideMsg();
            var phone = document.getElementById('regPhone').value.trim();
            var name = document.getElementById('regName').value.trim();
            var email = document.getElementById('regEmail').value.trim();
            if (!/^1[3-9]\d{9}$/.test(phone)) { showMsg('请输入正确的手机号'); return false; }
            if (name.length === 0 || name.length > 4) { showMsg('姓名最多4个字'); return false; }
            var password = document.getElementById('regPassword').value;
            var confirmPassword = document.getElementById('regConfirmPassword').value;
            if (password.length < 6) { showMsg('密码至少6位'); return false; }
            if (password !== confirmPassword) { showMsg('两次密码不一致'); return false; }

            // 弹出确认
            var schoolEl = document.getElementById('regSchool');
            var schoolName = schoolEl.selectedIndex > 0 ? schoolEl.options[schoolEl.selectedIndex].text : '未选择';
            var grade = document.getElementById('regGrade').value;
            var className = document.getElementById('regClassName').value || '未填写';
            document.getElementById('regConfirmInfo').innerHTML =
                '<strong>邮箱：</strong>' + email + '<br>' +
                '<strong>手机号：</strong>' + phone + '<br>' +
                '<strong>姓名：</strong>' + name + '<br>' +
                '<strong>学校：</strong>' + schoolName + '<br>' +
                '<strong>班级：</strong>' + grade + ' ' + className;
            document.getElementById('regConfirmOverlay').className = 'confirm-overlay show';
            return false;
        }

        function closeRegConfirm() {
            document.getElementById('regConfirmOverlay').className = 'confirm-overlay';
        }

        async function submitRegister() {
            closeRegConfirm();
            hideMsg();
            var btn = document.getElementById('regBtn');
            btn.disabled = true;
            btn.textContent = '注册中...';
            try {
                var res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: document.getElementById('regEmail').value,
                        phone: document.getElementById('regPhone').value,
                        name: document.getElementById('regName').value,
                        password: document.getElementById('regPassword').value,
                        confirmPassword: document.getElementById('regConfirmPassword').value,
                        schoolId: document.getElementById('regSchool').value || null,
                        grade: document.getElementById('regGrade').value,
                        className: document.getElementById('regClassName').value
                    })
                });
                var data = await res.json();
                if (data.success) {
                    showSuccess('注册成功！请检查邮箱获取验证码');
                    window._regEmail = document.getElementById('regEmail').value;
                    setTimeout(function() { showVerify(); }, 1500);
                } else {
                    showMsg(data.message || '注册失败');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '注 册';
            }
        }

        async function handleVerify() {
            var code = document.getElementById('verifyCode').value.trim();
            if (!code || code.length < 4) { showMsg('请输入验证码'); return; }
            hideMsg();
            var btn = document.getElementById('verifyBtn');
            btn.disabled = true;
            btn.textContent = '验证中...';
            try {
                var res = await fetch('/api/auth/verify-email?code=' + encodeURIComponent(code), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                var data = await res.json();
                if (data.success) {
                    showSuccess('验证成功！正在跳转...');
                    setTimeout(function() { showLogin(); }, 1500);
                } else {
                    showMsg(data.message || '验证失败');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '确 认';
            }
        }

        async function handleResendEmail() {
            hideMsg();
            try {
                var res = await fetch('/api/auth/resend-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                var data = await res.json();
                if (data.success) {
                    showSuccess('验证码已重新发送');
                } else {
                    showMsg(data.message || '发送失败');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            }
        }

        // 忘记密码
        async function handleForgotSend() {
            hideMsg();
            var email = document.getElementById('forgotEmail').value.trim();
            if (!email) { showMsg('请输入邮箱'); return; }
            var btn = document.getElementById('forgotSendBtn');
            btn.disabled = true;
            btn.textContent = '发送中...';
            try {
                var res = await fetch('/api/auth/forgot-password-send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                var data = await res.json();
                if (data.success) {
                    showSuccess(data.message || '验证码已发送');
                    window._forgotEmail = email;
                    window._forgotToken = data.data ? data.data.token : '';
                    document.getElementById('forgotForm').className = 'hidden';
                    document.getElementById('forgotVerifyForm').className = '';
                    // 调试模式直接显示验证码
                    if (data.data && data.data.verifyCode) {
                        showSuccess('验证码: ' + data.data.verifyCode);
                    }
                } else {
                    showMsg(data.message || '发送失败');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '发送验证码';
            }
        }

        async function handleForgotVerify() {
            hideMsg();
            var email = window._forgotEmail || document.getElementById('forgotEmail').value.trim();
            var code = document.getElementById('forgotCode').value.trim();
            if (!code) { showMsg('请输入验证码'); return; }
            var btn = document.getElementById('forgotVerifyBtn');
            btn.disabled = true;
            btn.textContent = '验证中...';
            try {
                var res = await fetch('/api/auth/forgot-password-verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, code: code })
                });
                var data = await res.json();
                if (data.success) {
                    window._forgotToken = data.data ? data.data.token : '';
                    document.getElementById('forgotVerifyForm').className = 'hidden';
                    document.getElementById('forgotResetForm').className = '';
                } else {
                    showMsg(data.message || '验证失败');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '验证';
            }
        }

        async function handleForgotReset() {
            hideMsg();
            var newPwd = document.getElementById('newPassword').value;
            var confirmPwd = document.getElementById('confirmPassword').value;
            if (newPwd.length < 6) { showMsg('密码至少6位'); return; }
            if (newPwd !== confirmPwd) { showMsg('两次密码不一致'); return; }
            var btn = document.getElementById('resetBtn');
            btn.disabled = true;
            btn.textContent = '重置中...';
            try {
                var res = await fetch('/api/auth/forgot-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: window._forgotToken,
                        newPassword: newPwd,
                        confirmPassword: confirmPwd
                    })
                });
                var data = await res.json();
                if (data.success) {
                    showSuccess('密码重置成功！请登录');
                    setTimeout(function() { showLogin(); }, 1500);
                } else {
                    showMsg(data.message || '重置失败');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '确认重置';
            }
        }

        async function handleRecoverEmail() {
            hideMsg();
            var name = document.getElementById('recoverName').value.trim();
            var phone = document.getElementById('recoverPhone').value.trim();
            if (!name) { showMsg('请输入姓名'); return; }
            if (!/^1[3-9]\d{9}$/.test(phone)) { showMsg('请输入正确的手机号'); return; }
            var btn = document.getElementById('recoverBtn');
            btn.disabled = true;
            btn.textContent = '查询中...';
            try {
                var res = await fetch('/api/auth/recover-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, phone: phone })
                });
                var data = await res.json();
                if (data.success) {
                    document.getElementById('recoverResultMsg').textContent = '已找到账号，邮箱为：' + (data.data ? data.data.email : '');
                    document.getElementById('recoverEmailForm').className = 'hidden';
                    document.getElementById('recoverResultForm').className = '';
                } else {
                    showMsg(data.message || '未找到匹配账号');
                }
            } catch (err) {
                showMsg('网络错误，请重试');
            } finally {
                btn.disabled = false;
                btn.textContent = '查询';
            }
        }
    </script>
</body>
</html>
