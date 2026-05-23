<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>阳光学情报告 - 让学习更高效</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; background: #fff; line-height: 1.6; }
        a { text-decoration: none; color: inherit; }

        /* 导航栏 */
        .navbar { position: fixed; top: 0; left: 0; right: 0; height: 64px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: space-between; padding: 0 48px; z-index: 100; border-bottom: 1px solid #f0f0f0; }
        .navbar .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; color: #409EFF; }
        .navbar .brand .star { font-size: 24px; }
        .navbar .nav-links { display: flex; align-items: center; gap: 32px; }
        .navbar .nav-links a { font-size: 15px; color: #606266; transition: color .2s; }
        .navbar .nav-links a:hover { color: #409EFF; }
        .navbar .btn-login { padding: 8px 24px; background: #409EFF; color: #fff; border-radius: 20px; font-size: 14px; transition: background .2s; }
        .navbar .btn-login:hover { background: #66b1ff; }

        /* Hero */
        .hero { padding: 160px 48px 100px; text-align: center; background: linear-gradient(180deg, #f0f5ff 0%, #fff 100%); }
        .hero h1 { font-size: 48px; font-weight: 800; color: #1a1a2e; margin-bottom: 20px; line-height: 1.3; }
        .hero h1 span { color: #409EFF; }
        .hero p { font-size: 18px; color: #606266; max-width: 600px; margin: 0 auto 40px; }
        .hero .btn-group { display: flex; gap: 16px; justify-content: center; }
        .hero .btn-primary { padding: 14px 40px; background: #409EFF; color: #fff; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all .2s; }
        .hero .btn-primary:hover { background: #66b1ff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(64,158,255,.3); }
        .hero .btn-outline { padding: 14px 40px; border: 2px solid #dcdfe6; color: #606266; border-radius: 8px; font-size: 16px; font-weight: 600; transition: all .2s; }
        .hero .btn-outline:hover { border-color: #409EFF; color: #409EFF; }

        /* 数据统计 */
        .stats { display: flex; justify-content: center; gap: 80px; padding: 60px 48px; background: #fff; }
        .stats .stat-item { text-align: center; }
        .stats .stat-num { font-size: 36px; font-weight: 800; color: #409EFF; }
        .stats .stat-label { font-size: 14px; color: #909399; margin-top: 4px; }

        /* 功能介绍 */
        .features { padding: 80px 48px; max-width: 1200px; margin: 0 auto; }
        .features h2 { text-align: center; font-size: 32px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; }
        .features .subtitle { text-align: center; color: #909399; font-size: 16px; margin-bottom: 60px; }
        .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        .feature-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 36px 28px; text-align: center; transition: all .3s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.08); border-color: transparent; }
        .feature-card .icon { font-size: 40px; margin-bottom: 20px; }
        .feature-card h3 { font-size: 18px; font-weight: 600; color: #303133; margin-bottom: 12px; }
        .feature-card p { font-size: 14px; color: #909399; line-height: 1.8; }

        /* 优势 */
        .advantages { padding: 80px 48px; background: linear-gradient(135deg, #f5f7fa 0%, #e8f0fe 100%); }
        .advantages h2 { text-align: center; font-size: 32px; font-weight: 700; color: #1a1a2e; margin-bottom: 60px; }
        .adv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
        .adv-item { background: #fff; border-radius: 12px; padding: 28px 24px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,.04); }
        .adv-item .icon { font-size: 32px; margin-bottom: 16px; }
        .adv-item h4 { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 8px; }
        .adv-item p { font-size: 13px; color: #909399; line-height: 1.6; }

        /* CTA */
        .cta { padding: 80px 48px; text-align: center; background: #fff; }
        .cta h2 { font-size: 32px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
        .cta p { color: #909399; margin-bottom: 32px; font-size: 16px; }

        /* 底部 */
        .footer { background: #1a1a2e; color: #fff; padding: 40px 48px; text-align: center; }
        .footer .brand { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
        .footer p { font-size: 13px; color: #888; }

        @media (max-width: 768px) {
            .hero h1 { font-size: 32px; }
            .hero p { font-size: 15px; }
            .feature-grid { grid-template-columns: 1fr; }
            .adv-grid { grid-template-columns: repeat(2, 1fr); }
            .stats { flex-direction: column; gap: 24px; }
            .navbar { padding: 0 20px; }
            .navbar .nav-links { display: none; }
        }
    </style>
</head>
<body>
    <!-- 导航栏 -->
    <nav class="navbar">
        <div class="brand"><span class="star">☀️</span> 阳光学情报告</div>
        <div class="nav-links">
            <a href="#features">功能特色</a>
            <a href="#advantages">平台优势</a>
            <a href="login.php" class="btn-login">登录 / 注册</a>
        </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
        <h1>智能分析成绩<br><span>精准规划志愿</span></h1>
        <p>为高中生打造的一站式学情管理平台，记录每次考试成绩，AI智能分析学习趋势，科学推荐志愿院校。</p>
        <div class="btn-group">
            <a href="login.php" class="btn-primary">立即开始</a>
            <a href="#features" class="btn-outline">了解更多</a>
        </div>
    </section>

    <!-- 数据统计 -->
    <section class="stats">
        <div class="stat-item"><div class="stat-num">6</div><div class="stat-label">科目同步追踪</div></div>
        <div class="stat-item"><div class="stat-num">5+</div><div class="stat-label">次考试分析</div></div>
        <div class="stat-item"><div class="stat-num">1000+</div><div class="stat-label">院校数据支撑</div></div>
        <div class="stat-item"><div class="stat-num">24h</div><div class="stat-label">随时访问学习</div></div>
    </section>

    <!-- 功能介绍 -->
    <section class="features" id="features">
        <h2>核心功能</h2>
        <p class="subtitle">全方位覆盖高中学习管理的每一个环节</p>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="icon">📊</div>
                <h3>成绩录入与管理</h3>
                <p>支持多次考试成绩录入，自动统计总分、年级排名、班级排名，清晰展示每次考试数据。</p>
            </div>
            <div class="feature-card">
                <div class="icon">📈</div>
                <h3>智能成绩分析</h3>
                <p>AI分析各科目表现，识别优势与薄弱科目，生成波动趋势报告，帮助制定针对性提升计划。</p>
            </div>
            <div class="feature-card">
                <div class="icon">🎯</div>
                <h3>考试目标设定</h3>
                <p>为每次考试设定目标分数和排名目标，实时对比实际成绩与目标，激发学习动力。</p>
            </div>
            <div class="feature-card">
                <div class="icon">🏫</div>
                <h3>志愿分析推荐</h3>
                <p>基于成绩表现智能推荐院校，分为冲刺型、稳妥型、保底型三个梯度，科学规划志愿填报。</p>
            </div>
            <div class="feature-card">
                <div class="icon">📋</div>
                <h3>成绩趋势图表</h3>
                <p>可视化展示成绩变化趋势，支持单科目与总分趋势对比，直观了解学习进步情况。</p>
            </div>
            <div class="feature-card">
                <div class="icon">🔒</div>
                <h3>安全数据管理</h3>
                <p>数据加密存储，支持邮箱验证注册，个人信息锁定保护，确保学生数据安全可靠。</p>
            </div>
        </div>
    </section>

    <!-- 平台优势 -->
    <section class="advantages" id="advantages">
        <h2>为什么选择阳光学情报告？</h2>
        <div class="adv-grid">
            <div class="adv-item"><div class="icon">⚡</div><h4>快速高效</h4><p>简洁界面设计，30秒完成成绩录入，节省时间专注学习。</p></div>
            <div class="adv-item"><div class="icon">🧠</div><h4>智能分析</h4><p>AI驱动的成绩分析算法，精准识别学习规律与提升空间。</p></div>
            <div class="adv-item"><div class="icon">📱</div><h4>多端适配</h4><p>完美适配手机、平板和电脑，随时随地查看学情数据。</p></div>
            <div class="adv-item"><div class="icon">💡</div><h4>志愿指导</h4><p>基于真实录取数据的院校推荐，让志愿填报不再盲目。</p></div>
        </div>
    </section>

    <!-- CTA -->
    <section class="cta">
        <h2>准备好开始了吗？</h2>
        <p>注册账号，开启你的智能学习之旅</p>
        <a href="login.php" class="btn-primary" style="padding:14px 48px;background:#409EFF;color:#fff;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;transition:all .2s;">免费注册</a>
    </section>

    <!-- 底部 -->
    <footer class="footer">
        <div class="brand">☀️ 阳光学情报告</div>
        <p>Red-Star Academic Report Platform &copy; <?php echo date('Y'); ?> All rights reserved.</p>
    </footer>
</body>
</html>
