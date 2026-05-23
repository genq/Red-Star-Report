var encourageMessages = [
    '🌟 每一天的努力，都是为了更好的自己！',
    '💪 坚持就是胜利，加油！',
    '🎯 目标就在前方，勇敢向前冲！',
    '📚 知识改变命运，学习成就未来！',
    '🌈 阳光总在风雨后，成功就在坚持后！',
    '🔥 今天的汗水，是明天的笑容！',
    '⭐ 你比想象中更强大！',
    '🚀 梦想不远，奋力前行！',
    '💎 每一次进步都值得骄傲！',
    '🌻 保持热爱，奔赴山海！',
    '🏆 相信自己，你能做到！',
    '✨ 努力的人运气都不会差！',
    '🎓 好好学习，天天向上！',
    '🌸 你的付出，时间会给出答案！',
    '🔔 不忘初心，方得始终！',
];

function showRandomEncourage() {
    var el = $('encourageMsg');
    if (el) {
        var idx = Math.floor(Math.random() * encourageMessages.length);
        el.textContent = encourageMessages[idx];
    }
}

var page = 'dashboard';
var user = null;
var isAdmin = false;
var isSuperAdmin = false;
var uniPage = 1;
var uniList = [];
var uniTotal = 0;
var adminTab = 'visitors';

function $(id) { return document.getElementById(id); }
function h(html) { $('content').innerHTML = html; }

function getSubjectMap() {
    var st = (user && user.subject_type) || '物化生';
    var map = {
        '物化生': ['物理', '化学', '生物'],
        '物化地': ['物理', '化学', '地理'],
        '物化政': ['物理', '化学', '政治'],
        '物生地': ['物理', '生物', '地理'],
        '物生政': ['物理', '生物', '政治'],
        '物政地': ['物理', '政治', '地理'],
        '史政地': ['历史', '政治', '地理'],
        '史政生': ['历史', '政治', '生物'],
        '史地生': ['历史', '地理', '生物'],
    };
    return map[st] || ['物理', '化学', '生物'];
}

function getExamSubjects(exam) {
    var grade = user ? user.grade : '';
    var semester = exam.semester || '';
    var isG1FirstSemester = grade === '高一' && semester === '上学期';

    if (isG1FirstSemester) {
        return ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '政治', '地理'];
    }
    var electives = getSubjectMap();
    return ['语文', '数学', '英语'].concat(electives);
}

function api(method, url, data) {
    return fetch('/api' + url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: data ? JSON.stringify(data) : null
    }).then(function(r) { return r.json(); }).then(function(json) {
        if (!json.success && json.message) {
            var err = new Error(json.message);
            err.code = json.code;
            err.data = json.data;
            throw err;
        }
        return json;
    });
}

function logout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    location.href = '/login.php';
}

function toggleMobileMenu() {
    var sidebar = document.querySelector('.sidebar');
    var main = document.querySelector('.main');
    var btn = $('mobileToggle');
    var overlay = document.querySelector('.sidebar-overlay');
    if (!sidebar) return;
    var isShow = sidebar.classList.contains('show');
    if (isShow) {
        sidebar.classList.remove('show');
        main.classList.remove('expanded');
        if (overlay) overlay.classList.remove('active');
        if (btn) btn.textContent = '☰';
    } else {
        sidebar.classList.add('show');
        main.classList.add('expanded');
        if (overlay) overlay.classList.add('active');
        if (btn) btn.textContent = '✕';
    }
}

function initApp() {
    if (!currentUser) { location.href = '/login.php'; return; }
    user = currentUser;
    isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    isSuperAdmin = user && user.role === 'SUPER_ADMIN';
    $('userAvatar').textContent = (user.name || '用').charAt(0);
    $('userName').textContent = user.name || '用户';
    var roleText = { 'SUPER_ADMIN': '超级管理员', 'ADMIN': '管理员', 'PRO': '专业版', 'STUDENT': '学生', 'USER': '学生' };
    $('userRole').textContent = roleText[user.role] || '学生用户';
    api('GET', '/settings').then(function(res) {
        var s = res.data || {};
        if (s.site_name) {
            var logo = $('siteLogoText');
            if (logo) logo.textContent = s.site_name;
            document.title = s.site_name + ' - V' + (typeof siteVersion !== 'undefined' ? siteVersion : '7.0.0');
        }
    });
    renderMenu();
    showRandomEncourage();
    if (window.innerWidth <= 768) {
        var sidebar = document.querySelector('.sidebar');
        var main = document.querySelector('.main');
        if (sidebar) { sidebar.classList.remove('show'); }
        if (main) main.classList.remove('expanded');
    }
    navigate('dashboard');
}

var menuItems = [
    { id: 'dashboard', icon: '📊', label: '数据概览' },
    { id: 'exam-select', icon: '📋', label: '考试选择' },
    { id: 'score-entry', icon: '✏️', label: '成绩录入' },
    { id: 'score-manage', icon: '📝', label: '成绩管理' },
    { id: 'exam-goal', icon: '🏆', label: '考试目标' },
    { id: 'score-analysis', icon: '📈', label: '成绩分析' },
    { id: 'target-uni', icon: '🎯', label: '目标大学' },
    { id: 'preference', icon: '✨', label: '志愿分析' },
    { id: 'profile', icon: '👤', label: '个人信息' },
    { id: 'support', icon: '🔧', label: '技术支持' },
];

function renderMenu() {
    var html = '';
    menuItems.forEach(function(item) {
        html += '<div class="menu-item' + (page === item.id ? ' active' : '') + '" onclick="navigate(\'' + item.id + '\')"><span class="icon">' + item.icon + '</span> ' + item.label + '</div>';
    });
    if (isAdmin) {
        html += '<div class="menu-divider"></div>';
        html += '<div class="menu-item' + (page === 'admin' ? ' active' : '') + '" onclick="navigate(\'admin\')"><span class="icon">⚙️</span> 数据管理</div>';
    }
    $('menu').innerHTML = html;
}

function navigate(p) {
    page = p;
    renderMenu();
    var pages = {
        'dashboard': renderDashboard,
        'exam-select': renderExamSelect,
        'score-entry': renderScoreEntry,
        'score-manage': renderScoreManage,
        'exam-goal': renderExamGoal,
        'score-analysis': renderScoreAnalysis,
        'target-uni': renderTargetUni,
        'preference': renderPreference,
        'profile': renderProfile,
        'support': renderSupport,
        'admin': renderAdmin
    };
    if (pages[p]) pages[p]();
    else h('<div class="page-title">页面开发中...</div>');
}

function renderDashboard() {
    api('GET', '/dashboard').then(function(res) {
        var d = res.data || {};
        h('<div class="page-title">欢迎回来，' + htmlEscape(user.name) + '同学</div>' +
            '<div class="page-desc">继续记录成绩，追踪学习进步</div>' +
            '<div class="stats-row">' +
                '<div class="stat-card"><div class="icon pink">📊</div><div class="info"><div class="value">' + (d.examCount || 0) + '</div><div class="label">已参加考试</div></div></div>' +
                '<div class="stat-card"><div class="icon green">📈</div><div class="info"><div class="value">' + (d.avgRate || 0) + '%</div><div class="label">平均得分率</div></div></div>' +
                '<div class="stat-card"><div class="icon orange">🎯</div><div class="info"><div class="value">' + (d.goalCount || 0) + '</div><div class="label">目标数量</div></div></div>' +
            '</div>' +
            '<div class="page-title" style="font-size:16px;margin-top:24px">快速操作</div>' +
            '<div class="quick-actions">' +
                '<div class="action-card" onclick="navigate(\'exam-select\')"><div class="action-icon pink">📋</div><div class="action-info"><div class="title">选择考试</div><div class="desc">从预设考试中选择并录入成绩</div></div><div class="arrow">›</div></div>' +
                '<div class="action-card" onclick="navigate(\'score-manage\')"><div class="action-icon green">📝</div><div class="action-info"><div class="title">成绩管理</div><div class="desc">查看和管理所有成绩记录</div></div><div class="arrow">›</div></div>' +
                '<div class="action-card" onclick="navigate(\'score-analysis\')"><div class="action-icon orange">📈</div><div class="action-info"><div class="title">成绩分析</div><div class="desc">查看成绩趋势和科目表现</div></div><div class="arrow">›</div></div>' +
                '<div class="action-card" onclick="navigate(\'target-uni\')"><div class="action-icon blue">🎯</div><div class="action-info"><div class="title">目标大学</div><div class="desc">搜索并设定你的目标大学</div></div><div class="arrow">›</div></div>' +
            '</div>');
    });
}

var gradeTab = 'g1';

function renderExamSelect() {
    api('GET', '/exams').then(function(res) {
        var allExams = res.data ? (res.data.list || []) : [];
        var seen = {};
        var uniqueExams = [];
        for (var i = 0; i < allExams.length; i++) {
            if (!seen[allExams[i].name]) {
                seen[allExams[i].name] = true;
                uniqueExams.push(allExams[i]);
            }
        }
        var filtered = uniqueExams.filter(function(e) {
            var gradeRange = [];
            if (e.grade_range) {
                try { gradeRange = typeof e.grade_range === 'string' ? JSON.parse(e.grade_range) : e.grade_range; } catch(ex) { gradeRange = []; }
            }
            if (gradeTab === 'g1') return gradeRange.indexOf('高一') !== -1;
            if (gradeTab === 'g2') return gradeRange.indexOf('高二') !== -1;
            if (gradeTab === 'g3') return gradeRange.indexOf('高三') !== -1;
            return true;
        });
        var rows = filtered.map(function(e) {
            return '<tr><td>' + htmlEscape(e.name) + '</td><td>' + htmlEscape(e.semester || '-') + '</td><td>' + e.date + '</td><td><a href="#" onclick="selectExam(' + e.id + ')" style="color:#409EFF;font-weight:500">选择</a></td></tr>';
        }).join('');
        h('<div class="page-title">考试选择</div>' +
            '<div class="page-desc">选择考试并录入成绩</div>' +
            '<div class="card">' +
                '<div class="tab-bar">' +
                    '<div class="tab' + (gradeTab === 'g1' ? ' active' : '') + '" onclick="gradeTab=\'g1\';renderExamSelect()">高一</div>' +
                    '<div class="tab' + (gradeTab === 'g2' ? ' active' : '') + '" onclick="gradeTab=\'g2\';renderExamSelect()">高二</div>' +
                    '<div class="tab' + (gradeTab === 'g3' ? ' active' : '') + '" onclick="gradeTab=\'g3\';renderExamSelect()">高三</div>' +
                '</div>' +
                '<table class="data-table"><thead><tr><th>考试名称</th><th>学期</th><th>日期</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" style="text-align:center;color:#888">暂无考试</td></tr>') + '</tbody></table>' +
            '</div>');
    }).catch(function(err) {
        h('<div class="page-title">考试选择</div>' +
            '<div class="card"><div class="empty-state">加载失败，请刷新重试</div></div>');
    });
}

var selectedExamId = null;

function selectExam(examId) {
    selectedExamId = examId;
    navigate('score-entry');
}

function renderScoreEntry() {
    if (isAdmin) {
        h('<div class="page-title">成绩录入</div>' +
            '<div class="card" style="text-align:center;padding:40px 20px"><div style="font-size:48px;margin-bottom:16px">👨‍💼</div>' +
            '<div style="font-size:16px;font-weight:500;color:#333;margin-bottom:8px">管理员无需录入成绩</div>' +
            '<div style="color:#909399;margin-bottom:20px;line-height:1.8">管理员可通过"成绩管理"页面查看和编辑所有学生的成绩数据</div>' +
            '<button class="btn-primary" onclick="navigate(\'score-manage\')">前往成绩管理</button></div>');
        return;
    }
    var url = '/exams/current';
    if (selectedExamId) url += '?examId=' + selectedExamId;
    api('GET', url).then(function(res) {
        var exam = (res.data && res.data.data) || res.data || {};
        if (!exam || !exam.id) {
            h('<div class="page-title">成绩录入</div>' +
                '<div class="card"><div class="empty-state">暂无考试数据，请先选择考试</div></div>');
            return;
        }
        var subjects = getExamSubjects(exam);
        var subjectOrder = ['语文', '数学', '英语'];
        var electives = getSubjectMap();
        for (var ei = 0; ei < electives.length; ei++) { if (subjectOrder.indexOf(electives[ei]) === -1) subjectOrder.push(electives[ei]); }
        var orderedSubjects = subjects.filter(function(s) { return subjectOrder.indexOf(s) !== -1; });
        var extraSubjects = subjects.filter(function(s) { return subjectOrder.indexOf(s) === -1; });
        orderedSubjects = orderedSubjects.concat(extraSubjects);

        var isEditMode = !!exam.has_scores;
        var existingData = {};
        var existingTotalGradeRank = '';
        var existingTotalClassRank = '';

        function renderForm() {
            var rows = orderedSubjects.map(function(s) {
                var isMain = s === '语文' || s === '数学' || s === '英语';
                var defaultFull = isMain ? 150 : 100;
                var ed = existingData[s] || {};
                return '<tr>' +
                    '<td style="width:55px;font-weight:500;font-size:13px;white-space:nowrap">' + htmlEscape(s) + '</td>' +
                    '<td style="width:75px"><input type="number" id="score_' + s + '" value="' + (ed.score !== undefined && ed.score !== null ? ed.score : '') + '" placeholder="分数" style="width:100%;padding:5px 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px" /></td>' +
                    '<td style="width:35px;color:#909399;text-align:center;font-size:12px">' + (ed.full_score || defaultFull) + '</td>' +
                    '<td style="width:80px"><input type="number" id="rank_' + s + '_grade" value="' + (ed.grade_rank || '') + '" placeholder="年级排" style="width:100%;padding:5px 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:11px" /></td>' +
                    '<td style="width:80px"><input type="number" id="rank_' + s + '_class" value="' + (ed.class_rank || '') + '" placeholder="班级排" style="width:100%;padding:5px 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:11px" /></td>' +
                    '<td style="width:70px"><input type="number" id="assign_' + s + '" value="' + (ed.assigned_score !== undefined && ed.assigned_score !== null ? ed.assigned_score : '') + '" placeholder="赋分" style="width:100%;padding:5px 6px;border:1px solid #dcdfe6;border-radius:4px;font-size:11px" /></td>' +
                    '</tr>';
            }).join('');

            var btnText = isEditMode ? '更新成绩' : '提交成绩';
            var editBadge = isEditMode ? ' <span style="color:#E6A23C;font-size:12px;font-weight:normal">【编辑模式】</span>' : '';
            var stText = user.subject_type || '物化生';
            h('<div class="page-title">成绩录入</div>' +
                '<div class="page-desc">' + htmlEscape(exam.name) + editBadge + ' <span style="color:#999;font-size:12px">（共' + orderedSubjects.length + '科，' + stText + '）</span></div>' +
                '<div class="card" style="padding:14px"><div class="table-wrapper"><table class="data-table score-entry-table"><thead><tr><th>科目</th><th>分数</th><th>满分</th><th>年级排名</th><th>班级排名</th><th>赋分(选)</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
                '<div style="margin-top:14px;padding-top:14px;border-top:2px solid #ebeef5;display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap">' +
                    '<span style="font-size:15px;color:#333;font-weight:500">总分：<strong id="totalScoreValue" style="color:#409EFF;font-size:22px">0</strong> 分</span>' +
                    '<div style="display:flex;align-items:center;gap:6px"><label style="font-size:13px;color:#606266;font-weight:500;white-space:nowrap">年级排名：</label><input type="number" id="totalGradeRank" value="' + existingTotalGradeRank + '" placeholder="总分年级排名" style="width:140px;padding:7px 10px;border:1px solid #dcdfe6;border-radius:6px;font-size:13px" /></div>' +
                    '<div style="display:flex;align-items:center;gap:6px"><label style="font-size:13px;color:#606266;font-weight:500;white-space:nowrap">班级排名：</label><input type="number" id="totalClassRank" value="' + existingTotalClassRank + '" placeholder="总分班级排名" style="width:140px;padding:7px 10px;border:1px solid #dcdfe6;border-radius:6px;font-size:13px" /></div>' +
                    '<button class="btn-primary" onclick="submitScores(' + exam.id + ', ' + isEditMode + ')">' + btnText + '</button>' +
                '</div></div>');

            var scoreInputs = document.querySelectorAll('[id^="score_"]');
            scoreInputs.forEach(function(input) {
                input.addEventListener('input', updateTotalScore);
            });
            updateTotalScore();
        }

        if (isEditMode) {
            api('GET', '/scores?examId=' + exam.id).then(function(sRes) {
                var list = sRes.data ? (sRes.data.list || []) : [];
                list.forEach(function(sc) { existingData[sc.subject] = sc; });
                if (list.length > 0) {
                    existingTotalGradeRank = list[0].grade_rank || '';
                    existingTotalClassRank = list[0].class_rank || '';
                }
                renderForm();
            });
        } else {
            renderForm();
        }
    }).catch(function(err) {
        h('<div class="page-title">成绩录入</div>' +
            '<div class="card"><div class="empty-state">暂无考试数据，请先在"考试选择"中选择考试</div></div>');
    });
}

function updateTotalScore() {
    var subjects = ['语文','数学','英语'].concat(getSubjectMap());
    var total = 0;
    subjects.forEach(function(s) {
        var el = $('score_' + s);
        if (el && el.value) { total += parseFloat(el.value) || 0; }
    });
    var tv = $('totalScoreValue');
    if (tv) tv.textContent = total;
}

function submitScores(examId, isEdit) {
    var scores = [];
    var subjects = getExamSubjects({ semester: '' });
    var subjectMap = {};
    for (var si = 0; si < subjects.length; si++) { subjectMap[subjects[si]] = si < 3 ? 150 : 100; }
    var inputs = document.querySelectorAll('[id^="score_"]');
    inputs.forEach(function(input) {
        var subject = input.id.replace('score_', '');
        var val = parseFloat(input.value);
        if (!isNaN(val) && val >= 0) {
            var gradeRankInput = document.getElementById('rank_' + subject + '_grade');
            var classRankInput = document.getElementById('rank_' + subject + '_class');
            var assignInput = document.getElementById('assign_' + subject);
            var assignedScore = assignInput && assignInput.value !== '' ? parseFloat(assignInput.value) : null;
            scores.push({
                subject: subject,
                score: val,
                fullScore: subjectMap[subject] || 100,
                gradeRank: gradeRankInput && gradeRankInput.value ? parseInt(gradeRankInput.value) : null,
                classRank: classRankInput && classRankInput.value ? parseInt(classRankInput.value) : null,
                assignedScore: assignedScore
            });
        }
    });
    if (scores.length === 0) {
        alert('请至少输入一科成绩');
        return;
    }
    var totalGradeRank = $('totalGradeRank');
    var totalClassRank = $('totalClassRank');
    api('POST', '/scores', { examId: examId, scores: scores, totalGradeRank: totalGradeRank && totalGradeRank.value ? parseInt(totalGradeRank.value) : null, totalClassRank: totalClassRank && totalClassRank.value ? parseInt(totalClassRank.value) : null }).then(function(res) {
        if (res.success) {
            alert(isEdit ? '成绩已更新' : '成绩已提交');
            navigate('score-manage');
        } else {
            alert((isEdit ? '更新' : '提交') + '失败: ' + (res.message || '未知错误'));
        }
    }).catch(function(err) {
        alert((isEdit ? '更新' : '提交') + '失败：' + (err.message || '未知错误'));
    });
}

var adminTargetUserId = null;

function renderScoreManage() {
    if (isAdmin) {
        renderScoreManageAdmin();
        return;
    }
    api('GET', '/scores').then(function(res) {
        var list = res.data ? (res.data.list || []) : [];
        renderScoreTable(list);
    }).catch(function(err) {
        h('<div class="page-title">成绩管理</div>' +
            '<div class="card"><div class="empty-state">加载失败，请刷新重试</div></div>');
    });
}

function renderScoreManageAdmin() {
    var scoreUrl = '/scores?limit=500';
    if (adminTargetUserId) scoreUrl += '&userId=' + adminTargetUserId;
    Promise.all([api('GET', '/admin/users?limit=1000'), api('GET', scoreUrl)]).then(function(results) {
        var users = (results[0] && results[0].data && results[0].data.list) || [];
        var targetScores = (results[1] && results[1].data && results[1].data.list) || [];

        if (!users.length) {
            h('<div class="page-title">成绩管理</div><div class="card"><div class="empty-state">无法加载用户列表</div></div>');
            return;
        }

        var userOptions = '<option value="">-- 选择学生 --</option>';
        users.forEach(function(u) {
            if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN') return;
            var sel = adminTargetUserId == u.id ? ' selected' : '';
            userOptions += '<option value="' + u.id + '"' + sel + '>' + htmlEscape(u.name || u.email) + ' (' + (u.grade || '-') + (u.class_name || '') + ')</option>';
        });

        var emptyState = '';
        if (!adminTargetUserId) {
            emptyState = '<div class="card"><div class="empty-state">请选择一个学生查看成绩</div></div>';
        } else if (targetScores.length === 0) {
            emptyState = '<div class="card"><div class="empty-state">该学生暂无成绩记录</div></div>';
        } else {
            emptyState = '<div id="adminScoreArea"></div>';
        }

        h('<div class="page-title">成绩管理 <span style="font-size:13px;color:#909399;font-weight:normal">（管理员模式）</span></div>' +
            '<div class="card" style="padding:14px;margin-bottom:16px"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
                '<label style="font-size:14px;font-weight:500;white-space:nowrap">查看学生：</label>' +
                '<select id="adminUserSelect" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid #dcdfe6;border-radius:6px;font-size:14px">' + userOptions + '</select>' +
                '<button class="btn-primary" style="padding:8px 16px;font-size:13px" onclick="adminTargetUserId=null;renderScoreManageAdmin()">刷新数据</button>' +
            '</div></div>' + emptyState);

        $('adminUserSelect').addEventListener('change', function() {
            adminTargetUserId = this.value ? parseInt(this.value) : null;
            renderScoreManageAdmin();
        });

        // 如果有成绩数据，渲染表格到adminScoreArea
        if (adminTargetUserId && targetScores.length > 0) {
            var area = $('adminScoreArea');
            if (area) {
                area.innerHTML = renderScoreTableHTML(targetScores);
            }
        }
    }).catch(function(err) {
        console.error('管理员成绩加载失败:', err);
        h('<div class="page-title">成绩管理</div><div class="card"><div class="empty-state">加载失败，请刷新重试<br><span style="font-size:12px;color:#ccc">' + (err.message || '网络错误') + '</span></div></div>');
    });
}

function renderScoreTableHTML(list) {
    var examGroups = {};
    var allSubjects = {};
    list.forEach(function(s) {
        var examKey = (s.exam_id || '0') + '|' + (s.exam_name || '未知考试');
        var examName = s.exam_name || '未知考试';
        if (!examGroups[examKey]) examGroups[examKey] = { exam_id: s.exam_id, exam_name: examName, exam_date: s.exam_date || '-', scores: {}, total_score: 0, grade_rank: null, class_rank: null };
        examGroups[examKey].scores[s.subject] = { id: s.id, score: s.score, full_score: s.full_score, grade_rank: s.grade_rank, class_rank: s.class_rank, assigned_score: s.assigned_score };
        examGroups[examKey].total_score += parseFloat(s.score) || 0;
        if (s.grade_rank && (!examGroups[examKey].grade_rank || parseInt(s.grade_rank) < parseInt(examGroups[examKey].grade_rank))) examGroups[examKey].grade_rank = s.grade_rank;
        if (s.class_rank && (!examGroups[examKey].class_rank || parseInt(s.class_rank) < parseInt(examGroups[examKey].class_rank))) examGroups[examKey].class_rank = s.class_rank;
        allSubjects[s.subject] = true;
    });

    var subjectOrder = ['语文','数学','英语'].concat(getSubjectMap());
    Object.keys(allSubjects).forEach(function(s) { if (subjectOrder.indexOf(s) === -1) subjectOrder.push(s); });

    // 按日期升序排列（旧在上，新在下）
    var examKeys = Object.keys(examGroups);
    examKeys.sort(function(a, b) {
        return (examGroups[a].exam_date || '').localeCompare(examGroups[b].exam_date || '');
    });

    var totalColumns = 1 + subjectOrder.length + 3;

    var rows = examKeys.map(function(examKey, idx) {
        var exam = examGroups[examKey];
        var filledCount = 0;
        var cells = subjectOrder.map(function(s) {
            var sc = exam.scores[s];
            if (!sc) {
                var eid = exam.exam_id || 0;
                return '<td style="cursor:pointer" onclick="editScore(null,' + eid + ',\'' + s + '\',\'\',100)" title="点击录入此科目成绩"><span style="color:#c0c4cc;text-decoration:underline">- 录入</span></td>';
            }
            filledCount++;
            var scoreHtml = '<span style="color:#409EFF;font-weight:600;cursor:pointer;text-decoration:underline" onclick="editScore(' + sc.id + ',' + (exam.exam_id || 0) + ',\'' + (exam.exam_name+'').replace(/'/g, "\\'") + '\',\'' + s + '\',' + sc.score + ',' + sc.full_score + ')">' + sc.score + '</span>';
            if (sc.assigned_score !== null && sc.assigned_score !== undefined) scoreHtml += '<br><span style="font-size:11px;color:#E6A23C">赋:' + sc.assigned_score + '</span>';
            return '<td>' + scoreHtml + '</td>';
        }).join('');
        var completeness = '<span style="font-size:11px;color:' + (filledCount >= subjectOrder.length ? '#67C23A' : '#E6A23C') + '">(' + filledCount + '/' + subjectOrder.length + '科)</span>';
        var kLabel = '<span style="display:inline-block;background:#f0f0f0;color:#606266;font-size:10px;font-weight:600;padding:2px 6px;border-radius:3px;margin-right:6px;">K' + (idx + 1) + '</span>';
        return '<tr><td style="font-weight:500;white-space:nowrap">' + kLabel + htmlEscape(exam.exam_name) + ' ' + completeness + '</td>' + cells +
            '<td style="font-weight:600;color:#E6A23C">' + exam.total_score + '</td><td>' + (exam.grade_rank || '-') + '</td><td>' + (exam.class_rank || '-') + '</td></tr>';
    }).join('');

    var headerCells = subjectOrder.map(function(s) { return '<th>' + htmlEscape(s) + '</th>'; }).join('');
    var tableHtml = '<div class="table-wrapper"><table class="data-table" style="min-width:' + Math.max(100 * totalColumns, 900) + 'px"><thead><tr><th>考试名称</th>' + headerCells + '<th>总分</th><th>年级排名</th><th>班级排名</th></tr></thead><tbody>' + (rows || '<tr><td colspan="' + totalColumns + '" style="text-align:center;color:#888">暂无成绩记录，请先录入成绩</td></tr>') + '</tbody></table></div>';
    return '<div class="card">' + tableHtml + '</div>';
}

function renderScoreTable(list, isAppend) {
    var examGroups = {};
    var allSubjects = {};
    list.forEach(function(s) {
        var examKey = (s.exam_id || '0') + '|' + (s.exam_name || '未知考试');
        var examName = s.exam_name || '未知考试';
        if (!examGroups[examKey]) examGroups[examKey] = { exam_id: s.exam_id, exam_name: examName, exam_date: s.exam_date || '-', scores: {}, total_score: 0, grade_rank: null, class_rank: null };
        examGroups[examKey].scores[s.subject] = { id: s.id, score: s.score, full_score: s.full_score, grade_rank: s.grade_rank, class_rank: s.class_rank, assigned_score: s.assigned_score };
        examGroups[examKey].total_score += parseFloat(s.score) || 0;
        if (s.grade_rank && (!examGroups[examKey].grade_rank || parseInt(s.grade_rank) < parseInt(examGroups[examKey].grade_rank))) examGroups[examKey].grade_rank = s.grade_rank;
        if (s.class_rank && (!examGroups[examKey].class_rank || parseInt(s.class_rank) < parseInt(examGroups[examKey].class_rank))) examGroups[examKey].class_rank = s.class_rank;
        allSubjects[s.subject] = true;
    });

    // 优先用选科组合排序，然后补其他出现过的科目
    var subjectOrder = ['语文','数学','英语'].concat(getSubjectMap());
    Object.keys(allSubjects).forEach(function(s) { if (subjectOrder.indexOf(s) === -1) subjectOrder.push(s); });

    // 按日期升序排列（旧在上，新在下）
    var examKeys = Object.keys(examGroups);
    examKeys.sort(function(a, b) {
        return (examGroups[a].exam_date || '').localeCompare(examGroups[b].exam_date || '');
    });

    // 表格列数：1个考试名称 + N个科目 + 3个（总分/年级排名/班级排名）
    var totalColumns = 1 + subjectOrder.length + 3;

    var rows = examKeys.map(function(examKey, idx) {
        var exam = examGroups[examKey];
        var filledCount = 0;
        var cells = subjectOrder.map(function(s) {
            var sc = exam.scores[s];
            if (!sc) {
                var eid = exam.exam_id || 0;
                return '<td style="cursor:pointer" onclick="editScore(null,' + eid + ',\'' + s + '\',\'\',100)" title="点击录入此科目成绩"><span style="color:#c0c4cc;text-decoration:underline">- 录入</span></td>';
            }
            filledCount++;
            var scoreHtml = '<span style="color:#409EFF;font-weight:600;cursor:pointer;text-decoration:underline" onclick="editScore(' + sc.id + ',' + (exam.exam_id || 0) + ',\'' + (exam.exam_name+'').replace(/'/g, "\\'") + '\',\'' + s + '\',' + sc.score + ',' + sc.full_score + ')">' + sc.score + '</span>';
            if (sc.assigned_score !== null && sc.assigned_score !== undefined) scoreHtml += '<br><span style="font-size:11px;color:#E6A23C">赋:' + sc.assigned_score + '</span>';
            return '<td>' + scoreHtml + '</td>';
        }).join('');
        var completeness = '<span style="font-size:11px;color:' + (filledCount >= subjectOrder.length ? '#67C23A' : '#E6A23C') + '">(' + filledCount + '/' + subjectOrder.length + '科)</span>';
        var kLabel = '<span style="display:inline-block;background:#f0f0f0;color:#606266;font-size:10px;font-weight:600;padding:2px 6px;border-radius:3px;margin-right:6px;">K' + (idx + 1) + '</span>';
        return '<tr><td style="font-weight:500;white-space:nowrap">' + kLabel + htmlEscape(exam.exam_name) + ' ' + completeness + '</td>' + cells +
            '<td style="font-weight:600;color:#E6A23C">' + exam.total_score + '</td><td>' + (exam.grade_rank || '-') + '</td><td>' + (exam.class_rank || '-') + '</td></tr>';
    }).join('');

    var headerCells = subjectOrder.map(function(s) { return '<th>' + htmlEscape(s) + '</th>'; }).join('');
    var tableHtml = '<div class="table-wrapper"><table class="data-table" style="min-width:' + Math.max(100 * totalColumns, 900) + 'px"><thead><tr><th>考试名称</th>' + headerCells + '<th>总分</th><th>年级排名</th><th>班级排名</th></tr></thead><tbody>' + (rows || '<tr><td colspan="' + totalColumns + '" style="text-align:center;color:#888">暂无成绩记录，请先录入成绩</td></tr>') + '</tbody></table></div>';

    if (isAppend) document.getElementById('content').innerHTML += '<div class="card">' + tableHtml + '</div>';
    else h('<div class="page-title">成绩管理</div><div class="page-desc">查看和管理所有成绩记录</div><div class="card">' + tableHtml + '</div>');
}

function deleteScore(scoreId) {
    if (!confirm('确定要删除这条成绩记录吗？')) return;
    api('DELETE', '/scores/' + scoreId).then(function(res) {
        if (res.success) {
            alert('成绩已删除');
            renderScoreManage();
        } else {
            alert('删除失败: ' + (res.message || '未知错误'));
        }
    });
}

function renderExamGoal() {
    api('GET', '/goals').then(function(res1) {
        var goals = res1.data.list || [];
        api('GET', '/exams').then(function(res2) {
            var allExams = res2.data ? (res2.data.list || []) : [];
            var seen = {};
            var uniqueExams = [];
            for (var i = 0; i < allExams.length; i++) { if (!seen[allExams[i].name]) { seen[allExams[i].name] = true; uniqueExams.push(allExams[i]); } }
            var gradeRange = [];
            if (user && user.grade === '高一') gradeRange = ['高一'];
            else if (user && user.grade === '高二') gradeRange = ['高二'];
            else if (user && user.grade === '高三') gradeRange = ['高三'];
            var myExams = uniqueExams.filter(function(e) {
                try { var gr = typeof e.grade_range === 'string' ? JSON.parse(e.grade_range) : e.grade_range || []; return gr.some(function(g) { return gradeRange.indexOf(g) !== -1; }); } catch(ex) { return false; }
            });
            myExams.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });

            var rows = goals.map(function(g) {
                var typeText = g.target_type === 'grade_rank' ? '年级排名' : '班级排名';
                var achieved = g.is_achieved ? '<span style="color:#67C23A">✓ 已达成</span>' : '<span style="color:#999">未达成</span>';
                var totalScore = g.total_score || 0;
                return '<tr><td>' + htmlEscape(g.name) + '</td><td>' + (totalScore > 0 ? totalScore + '分' : '-') + '</td>' +
                    '<td>' + (g.target_grade_rank ? '年级:' + g.target_grade_rank : '-') + '</td>' +
                    '<td>' + (g.target_class_rank ? '班级:' + g.target_class_rank : '-') + '</td>' +
                    '<td>' + achieved + '</td><td><a href="#" onclick="deleteGoal(' + g.id + ')" style="color:#F56C6C">删除</a></td></tr>';
            }).join('');
            var electives = getSubjectMap();
            var examOptions = myExams.map(function(e) { return '<option value="' + e.id + '">' + htmlEscape(e.name) + '(' + e.date + ')</option>'; }).join('');

            h('<div class="page-title">考试目标</div>' +
                '<div class="page-desc">设定各科目标分数与排名目标</div>' +
                '<div class="card"><div class="card-title">设置目标</div>' +
                    '<div class="form-group"><label>目标名称</label><input type="text" id="goalName" placeholder="如：高一下期中目标" /></div>' +
                    '<div class="form-group"><label>关联考试</label><select id="goalExamId"><option value="">-- 选择要挑战的考试 --</option>' + examOptions + '</select></div>' +
                    '<table class="data-table" style="margin-top:12px;font-size:13px"><thead><tr><th>科目</th><th>目标分数</th><th>满分</th></tr></thead><tbody>' +
                    '<tr><td style="font-weight:500">语文</td><td><input type="number" id="goalChinese" placeholder="目标分" style="width:80px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px" /></td><td style="color:#909399">150</td></tr>' +
                    '<tr><td style="font-weight:500">数学</td><td><input type="number" id="goalMath" placeholder="目标分" style="width:80px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px" /></td><td style="color:#909399">150</td></tr>' +
                    '<tr><td style="font-weight:500">英语</td><td><input type="number" id="goalEnglish" placeholder="目标分" style="width:80px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px" /></td><td style="color:#909399">150</td></tr>' +
                    '<tr><td style="font-weight:500">' + htmlEscape(electives[0] || '科目4') + '</td><td><input type="number" id="goalSubject4" placeholder="目标分" style="width:80px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px" /></td><td style="color:#909399">100</td></tr>' +
                    '<tr><td style="font-weight:500">' + htmlEscape(electives[1] || '科目5') + '</td><td><input type="number" id="goalSubject5" placeholder="目标分" style="width:80px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px" /></td><td style="color:#909399">100</td></tr>' +
                    '<tr><td style="font-weight:500">' + htmlEscape(electives[2] || '科目6') + '</td><td><input type="number" id="goalSubject6" placeholder="目标分" style="width:80px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px" /></td><td style="color:#909399">100</td></tr>' +
                    '</tbody></table>' +
                    '<div style="display:flex;align-items:center;gap:16px;margin-top:14px"><span style="color:#888;font-size:13px">目标总分：</span><strong id="goalTotalScore" style="font-size:18px;color:#409EFF">0分</strong></div>' +
                    '<div class="form-group" style="margin-top:12px"><label>目标排名（可同时设置）</label>' +
                        '<div style="display:flex;gap:24px;margin-top:8px">' +
                            '<div><span style="color:#666;font-size:12px">年级排名</span><br><input type="number" id="goalGradeRank" placeholder="选填" style="width:120px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px;margin-top:4px" /></div>' +
                            '<div><span style="color:#666;font-size:12px">班级排名</span><br><input type="number" id="goalClassRank" placeholder="选填" style="width:120px;padding:5px 6px;border:1px solid #dcdfe6;border-radius:3px;margin-top:4px" /></div>' +
                        '</div></div>' +
                    '<div style="text-align:right;margin-top:16px"><button class="btn-primary" onclick="submitGoal()">设置目标</button></div>' +
                '</div>' +
                '<div class="card" style="margin-top:16px"><div class="card-title">我的目标</div>' +
                    '<table class="data-table" style="font-size:13px"><thead><tr><th>目标名称</th><th>目标总分</th><th>年级排名</th><th>班级排名</th><th>状态</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" style="text-align:center;color:#888">暂无目标</td></tr>') + '</tbody></table>' +
                '</div>');
            var scoreInputs = ['goalChinese', 'goalMath', 'goalEnglish', 'goalSubject4', 'goalSubject5', 'goalSubject6'];
            scoreInputs.forEach(function(id) {
                var el = $(id);
                if (el) el.addEventListener('input', updateGoalTotal);
            });
        });
    }).catch(function(err) {
        h('<div class="page-title">考试目标</div>' +
            '<div class="card"><div class="empty-state">加载失败，请刷新重试</div></div>');
    });
}

function updateGoalTotal() {
    var ids = ['goalChinese', 'goalMath', 'goalEnglish', 'goalSubject4', 'goalSubject5', 'goalSubject6'];
    var total = 0;
    ids.forEach(function(id) {
        var v = parseFloat($(id).value) || 0;
        total += v;
    });
    var el = $('goalTotalScore');
    if (el) el.textContent = total + '分';
}

function submitGoal() {
    var name = $('goalName').value.trim();
    if (!name) { alert('请输入目标名称'); return; }
    var electives = getSubjectMap();
    var subjectScores = {
        '语文': parseFloat($('goalChinese').value) || 0,
        '数学': parseFloat($('goalMath').value) || 0,
        '英语': parseFloat($('goalEnglish').value) || 0
    };
    subjectScores[electives[0] || '科目4'] = parseFloat($('goalSubject4').value) || 0;
    subjectScores[electives[1] || '科目5'] = parseFloat($('goalSubject5').value) || 0;
    subjectScores[electives[2] || '科目6'] = parseFloat($('goalSubject6').value) || 0;
    var data = {
        name: name,
        subjectScores: subjectScores,
        targetGradeRank: parseInt($('goalGradeRank').value) || null,
        targetClassRank: parseInt($('goalClassRank').value) || null
    };
    var goalExamId = $('goalExamId').value;
    if (goalExamId) data.exam_id = parseInt(goalExamId);
    api('POST', '/goals', data).then(function(res) {
        if (res.success) {
            alert('目标已设置');
            renderExamGoal();
        } else {
            alert('设置失败: ' + (res.message || '未知错误'));
        }
    });
}

function deleteGoal(goalId) {
    if (!confirm('确定要删除这个目标吗？')) return;
    api('DELETE', '/goals/' + goalId).then(function(res) {
        if (res.success) {
            alert('目标已删除');
            renderExamGoal();
        } else {
            alert('删除失败: ' + (res.message || '未知错误'));
        }
    });
}

function renderScoreAnalysis() {
    api('GET', '/scores').then(function(scoreRes) {
        var scores = scoreRes.data ? (scoreRes.data.list || []) : [];
        var examGroups = {};
        var allSubjects = {};
        var examList = [];
        scores.forEach(function(s) {
            var en = s.exam_name || '未知考试';
            if (!examGroups[en]) { examGroups[en] = { exam_id: s.exam_id, exam_name: en, exam_date: s.exam_date || '-', scores: {}, total_score: 0, grade_rank: null, class_rank: null, subject_type: s.subject_type || '' }; examList.push(en); }
            examGroups[en].scores[s.subject] = { id: s.id, score: s.score, full_score: s.full_score };
            examGroups[en].total_score += parseFloat(s.score) || 0;
            if (s.grade_rank && (!examGroups[en].grade_rank || parseInt(s.grade_rank) < parseInt(examGroups[en].grade_rank))) examGroups[en].grade_rank = s.grade_rank;
            if (s.class_rank && (!examGroups[en].class_rank || parseInt(s.class_rank) < parseInt(examGroups[en].class_rank))) examGroups[en].class_rank = s.class_rank;
            allSubjects[s.subject] = true;
        });
        examList.sort(function(a, b) {
            return (examGroups[a].exam_date || '').localeCompare(examGroups[b].exam_date || '');
        });

        var defaultSubjects = ['语文','数学','英语'].concat(getSubjectMap());
        var fullSubjectOrder = defaultSubjects.slice();
        Object.keys(allSubjects).forEach(function(s) { if (fullSubjectOrder.indexOf(s) === -1) fullSubjectOrder.push(s); });

        var st = (user && user.subject_type) || '物化生';
        var isScience = st.indexOf('物') === 0;
        var scienceSubjects = ['语文','数学','英语','物理','化学','生物'];
        var artsSubjects = ['语文','数学','英语','历史','政治','地理'];
        var comboSubjects = isScience ? scienceSubjects : artsSubjects;

        window._analysisAllData = { examGroups: examGroups, examList: examList, fullSubjectOrder: fullSubjectOrder, comboSubjects: comboSubjects, scienceSubjects: scienceSubjects, artsSubjects: artsSubjects };

        renderAnalysisView(examGroups, examList, fullSubjectOrder, null, null);
    });
}

function renderAnalysisView(examGroups, examList, subjectOrder, rangeFilter, comboFilter) {
    var allData = window._analysisAllData || { examGroups: examGroups, examList: examList, fullSubjectOrder: subjectOrder };
    var st = (user && user.subject_type) || '物化生';
    var totals = examList.map(function(en) { return examGroups[en].total_score; });
    var maxTotal = Math.max.apply(null, totals.length > 0 ? totals : [0]);
    var minTotal = Math.min.apply(null, totals.length > 0 ? totals : [0]);
    var avgTotal = totals.length > 0 ? Math.round(totals.reduce(function(a,b){return a+b;},0)/totals.length*10)/10 : 0;
    var bestRank = null;
    examList.forEach(function(en) { if (examGroups[en].grade_rank) { if (!bestRank || parseInt(examGroups[en].grade_rank) < parseInt(bestRank)) bestRank = examGroups[en].grade_rank; } });

    var examOptions = allData.examList.map(function(en) { return '<option value="' + en + '">' + htmlEscape(en) + '</option>'; }).join('');
    var rangeOpts = '<option value="">全部考试</option>';
    for (var i = 1; i <= Math.min(allData.examList.length, 10); i++) {
        rangeOpts += '<option value="' + i + '">最近' + i + '次</option>';
    }

    h('<div class="page-title">成绩分析</div>' +
        '<div class="page-desc">查看学习趋势、科目分析和波动情况</div>' +
        '<div class="analysis-filters">' +
            '<div class="filter-item"><label style="font-size:12px;color:#909399;margin-bottom:4px">科目组合</label><select id="analysisCombo" onchange="applyAnalysisFilter()"><option value="">全部科目</option><option value="science">理科（6科）</option><option value="arts">文科（6科）</option></select></div>' +
            '<div class="filter-item"><label style="font-size:12px;color:#909399;margin-bottom:4px">考试范围</label><select id="analysisRange" onchange="applyAnalysisFilter()">' + rangeOpts + '</select></div>' +
        '</div>' +
        '<div class="stats-row" style="margin-bottom:16px">' +
            '<div class="stat-card"><div class="icon pink">📊</div><div class="info"><div class="value" style="color:#F56C6C;font-size:24px">' + maxTotal + '</div><div class="label">最新总分</div></div></div>' +
            '<div class="stat-card"><div class="icon green">📈</div><div class="info"><div class="value" style="color:#67C23A;font-size:24px">' + (bestRank || '-') + '</div><div class="label">最佳排名</div></div></div>' +
            '<div class="stat-card"><div class="icon orange">📋</div><div class="info"><div class="value" style="color:#E6A23C;font-size:24px">' + avgTotal + '</div><div class="label">平均总分</div></div></div>' +
            '<div class="stat-card"><div class="icon blue">📉</div><div class="info"><div class="value" style="color:#409EFF;font-size:16px">' + ((maxTotal - minTotal > 30) ? '波动较大' : '相对稳定') + '</div><div class="label">波动情况</div></div></div>' +
        '</div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-title">成绩趋势</div><div id="trendScrollArea"></div></div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-title">排名趋势</div><div id="rankScrollArea"></div></div>' +
        '<div class="card"><div class="card-title" style="display:flex;justify-content:space-between;align-items:center"><span>成绩详情</span><button class="btn-primary" style="font-size:11px;padding:4px 10px" onclick="exportScores()">预览/导出</button></div>' +
        '<div style="overflow-x:auto"><table class="data-table" style="min-width:700px;width:100%;font-size:12px"><thead><tr><th style="width:60px">序号</th><th>考试名称</th>' +
        subjectOrder.map(function(s){ return '<th>' + htmlEscape(s) + '</th>'; }).join('') +
        '<th style="color:#E6A23C">总分</th><th>年级排名</th><th>班级排名</th></tr></thead><tbody>' +
        examList.map(function(en, idx) {
            var eg = examGroups[en];
            return '<tr><td style="font-weight:600;color:#909399">K' + (idx + 1) + '</td><td style="font-weight:500">' + htmlEscape(en) + '</td>' +
                subjectOrder.map(function(s) {
                    var sc = eg.scores[s];
                    return sc ? '<td style="color:' + (sc.score >= sc.full_score * 0.8 ? '#67C23A' : sc.score >= sc.full_score * 0.6 ? '#E6A23C' : '#F56C6C') + ';cursor:pointer;text-decoration:underline" onclick="editScore(' + (sc.id || 0) + ',' + (eg.exam_id || 0) + ',\'' + en + '\',\'' + s + '\',' + sc.score + ',' + sc.full_score + ')">' + sc.score + '</td>' : '<td style="color:#c0c4cc">-</td>';
                }).join('') +
                '<td style="font-weight:600;color:#E6A23C">' + eg.total_score + '</td>' +
                '<td>' + (eg.grade_rank || '-') + '</td><td>' + (eg.class_rank || '-') + '</td></tr>';
        }).join('') +
        '</tbody></table></div>');

    if (rangeFilter) {
        if ($('analysisRange')) $('analysisRange').value = rangeFilter;
    }
    if (comboFilter && $('analysisCombo')) {
        $('analysisCombo').value = comboFilter;
    }

    setTimeout(function() { renderTrendCards(examGroups, examList, subjectOrder); renderRankChart(examGroups, examList); }, 100);
}

function renderTrendCards(examGroups, examList, subjectOrder) {
    var area = $('trendScrollArea');
    if (!area) return;
    var colors = ['#F56C6C', '#409EFF', '#67C23A', '#E6A23C', '#9b59b6', '#1abc9c'];
    var n = examList.length;

    var maxScores = {};
    var minScores = {};
    subjectOrder.forEach(function(s) {
        var vals = [];
        examList.forEach(function(en) { if (examGroups[en].scores[s]) vals.push(examGroups[en].scores[s].score); });
        maxScores[s] = vals.length > 0 ? Math.max.apply(null, vals) : 0;
        minScores[s] = vals.length > 0 ? Math.min.apply(null, vals) : 0;
    });

    var html = '<div class="trend-cards-grid">';
    subjectOrder.forEach(function(s, ci) {
        var c = colors[ci % colors.length];
        var vals = [];
        examList.forEach(function(en) { var sc = examGroups[en].scores[s]; vals.push(sc ? sc.score : 0); });
        var vMin = Math.min.apply(null, vals.filter(function(v){return v>0})) || 0;
        var vMax = Math.max.apply(null, vals) || 150;

        html += '<div class="trend-card"><div class="trend-card-header"><span class="trend-dot" style="background:' + c + '"></span>';
        html += '<span class="trend-card-title">' + htmlEscape(s) + '</span>';
        html += '<span class="trend-card-range">' + vMin + '-' + vMax + '</span></div>';
        html += '<canvas class="trend-card-canvas" data-subject="' + ci + '" data-vmin="' + vMin + '" data-vmax="' + vMax + '" data-color="' + c + '"></canvas></div>';
    });
    html += '</div>';
    area.innerHTML = html;

    setTimeout(function() {
        var canvasList = area.querySelectorAll('.trend-card-canvas');
        canvasList.forEach(function(canvas, idx) {
            var s = subjectOrder[idx];
            var vals = [];
            examList.forEach(function(en) { var sc = examGroups[en].scores[s]; vals.push(sc ? sc.score : 0); });
            var vMin = parseInt(canvas.dataset.vmin);
            var vMax = parseInt(canvas.dataset.vmax);
            var vRange = vMax - vMin || 1;
            var color = canvas.dataset.color;
            var dpr = window.devicePixelRatio || 1;

            var card = canvas.closest('.trend-card');
            var rect = card.getBoundingClientRect();
            var w = rect.width - 20;
            var h = 150;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);

            var ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            var sidePad = n > 3 ? 22 : 14;
            var pad = { t: 32, b: 26, l: sidePad, r: sidePad };
            var cw = w - pad.l - pad.r;
            var ch = h - pad.t - pad.b;

            ctx.fillStyle = 'rgba(0,0,0,0.01)';
            ctx.fillRect(0, 0, w, h);

            var grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
            grad.addColorStop(0, color + '1a');
            grad.addColorStop(1, color + '05');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(pad.l, pad.t + ch);
            vals.forEach(function(v, i) {
                var px = pad.l + (i / Math.max(n - 1, 1)) * cw;
                var py = v > 0 ? pad.t + (1 - (v - vMin) / vRange) * ch : pad.t + ch;
                ctx.lineTo(px, py);
            });
            ctx.lineTo(pad.l + cw, pad.t + ch);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            vals.forEach(function(v, i) {
                var px = pad.l + (i / Math.max(n - 1, 1)) * cw;
                var py = v > 0 ? pad.t + (1 - (v - vMin) / vRange) * ch : pad.t + ch;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.stroke();

            ctx.font = 'bold 10px -apple-system,sans-serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            vals.forEach(function(v, i) {
                var px = pad.l + (i / Math.max(n - 1, 1)) * cw;
                var py = v > 0 ? pad.t + (1 - (v - vMin) / vRange) * ch : pad.t + ch;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                if (v > 0) {
                    ctx.fillStyle = color;
                    ctx.fillText(v, px, py - 7);
                }
            });

            ctx.fillStyle = '#b0b0b0';
            ctx.font = '9px -apple-system,sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            examList.forEach(function(en, i) {
                var px = pad.l + (i / Math.max(n - 1, 1)) * cw;
                ctx.fillText('K' + (i + 1), px, h - 12);
            });
        });
    }, 50);
}

function renderRankChart(examGroups, examList) {
    var area = $('rankScrollArea');
    if (!area) return;
    var ranks = [];
    var validExams = [];
    examList.forEach(function(en) { if (examGroups[en].grade_rank) { ranks.push(parseInt(examGroups[en].grade_rank)); validExams.push(en); } });
    if (ranks.length < 2) { area.innerHTML = '<div style="text-align:center;color:#909399;padding:30px">需要至少2次考试成绩</div>'; return; }

    var n = validExams.length;
    var bestRank = Math.min.apply(null, ranks);
    var worstRank = Math.max.apply(null, ranks);
    var avgRank = Math.round(ranks.reduce(function(a, b) { return a + b; }, 0) / n);

    var html = '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    
    ranks.forEach(function(r, i) {
        var prev = i > 0 ? ranks[i - 1] : null;
        var change = prev ? prev - r : 0;
        var changeColor = change > 0 ? '#67C23A' : change < 0 ? '#F56C6C' : '#909399';
        var changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '-';
        var changeText = change !== 0 ? changeIcon + Math.abs(change) : '持平';
        
        var cardColor = r <= bestRank * 1.2 ? '#67C23A' : r <= bestRank * 1.5 ? '#E6A23C' : '#F56C6C';
        
        html += '<div style="flex:1;min-width:100px;max-width:160px;background:#fafbfc;border-radius:10px;border:2px solid ' + cardColor + ';padding:12px;text-align:center;box-sizing:border-box;">';
        html += '<div style="font-size:10px;color:#b0b0b0;margin-bottom:6px;">K' + (i + 1) + '</div>';
        html += '<div style="font-size:28px;font-weight:bold;color:' + cardColor + ';line-height:1;">' + r + '</div>';
        html += '<div style="font-size:10px;color:#909399;margin-top:4px;">名</div>';
        if (i > 0) {
            html += '<div style="font-size:11px;color:' + changeColor + ';margin-top:6px;font-weight:600;">' + changeText + '</div>';
        } else {
            html += '<div style="font-size:11px;color:#c0c4cc;margin-top:6px;">首次</div>';
        }
        html += '</div>';
    });

    html += '<div style="flex:1;min-width:100px;max-width:160px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:10px;padding:12px;text-align:center;color:#fff;box-sizing:border-box;">';
    html += '<div style="font-size:10px;opacity:0.8;margin-bottom:6px;">最佳排名</div>';
    html += '<div style="font-size:28px;font-weight:bold;line-height:1;">' + bestRank + '</div>';
    html += '<div style="font-size:10px;opacity:0.7;margin-top:4px;">名</div>';
    html += '</div>';

    html += '<div style="flex:1;min-width:100px;max-width:160px;background:#f0f9eb;border-radius:10px;padding:12px;text-align:center;box-sizing:border-box;">';
    html += '<div style="font-size:10px;color:#909399;margin-bottom:6px;">平均排名</div>';
    html += '<div style="font-size:28px;font-weight:bold;color:#67C23A;line-height:1;">' + avgRank + '</div>';
    html += '<div style="font-size:10px;color:#909399;margin-top:4px;">名</div>';
    html += '</div>';

    html += '</div>';
    area.innerHTML = html;
}

function applyAnalysisFilter() {
    var allData = window._analysisAllData;
    if (!allData) return;
    var comboFilter = $('analysisCombo') ? $('analysisCombo').value : '';
    var rangeFilter = $('analysisRange') ? $('analysisRange').value : '';

    var filteredGroups = {};
    var filteredList = [];
    var sourceList = allData.examList.slice();

    if (rangeFilter && rangeFilter !== '') {
        var n = parseInt(rangeFilter);
        sourceList = sourceList.slice(-n);
    }

    var subjectOrder = allData.fullSubjectOrder;
    if (comboFilter === 'science') subjectOrder = allData.scienceSubjects;
    else if (comboFilter === 'arts') subjectOrder = allData.artsSubjects;

    sourceList.forEach(function(en) {
        var eg = allData.examGroups[en];
        filteredGroups[en] = { exam_id: eg.exam_id, exam_name: en, exam_date: eg.exam_date, scores: {}, total_score: 0, grade_rank: eg.grade_rank, class_rank: eg.class_rank, subject_type: eg.subject_type || '' };
        subjectOrder.forEach(function(s) {
            if (eg.scores[s]) {
                filteredGroups[en].scores[s] = eg.scores[s];
                filteredGroups[en].total_score += eg.scores[s].score;
            }
        });
        filteredList.push(en);
    });

    renderAnalysisView(filteredGroups, filteredList, subjectOrder, rangeFilter, comboFilter);
}

function getShortLabel(name) {
    if (!name) return '';
    if (name.length <= 6) return name;
    var parts = name.split(/[_\-]/);
    if (parts.length >= 3) return parts[parts.length - 2] + parts[parts.length - 1];
    return name.substring(name.length - 5);
}

function setupCanvas(canvas) {
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = rect.width - 36;
    var h = canvas.height || 300;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h };
}

function drawTrendChart(examGroups, examList, subjectOrder) {
    var result = setupCanvas($('trendChart'));
    if (!result) return;
    var ctx = result.ctx, w = result.w, h = result.h;
    var colors = ['#F56C6C', '#409EFF', '#67C23A', '#E6A23C', '#9b59b6', '#1abc9c'];
    var padding = { top: 50, right: 25, bottom: 95, left: 50 };
    var cw = w - padding.left - padding.right;
    var ch = h - padding.top - padding.bottom;

    var allValues = [];
    examList.forEach(function(en) { subjectOrder.forEach(function(s) { var sc = examGroups[en].scores[s]; if (sc) allValues.push(sc.score); }); });
    var minV = Math.min.apply(null, allValues.length > 0 ? allValues : [0]);
    var maxV = Math.max.apply(null, allValues.length > 0 ? allValues : [150]);
    var range = maxV - minV || 1;
    var step = Math.pow(10, Math.floor(Math.log10(range)));
    var niceMin = Math.floor(minV / step) * step;
    var niceMax = Math.ceil(maxV / step) * step;
    if (niceMin === niceMax) { niceMin = niceMin - step; niceMax = niceMax + step; }
    minV = niceMin; maxV = niceMax;
    var n = examList.length;

    for (var i = 0; i <= 5; i++) {
        var y = padding.top + ch * i / 5;
        ctx.fillStyle = 'rgba(144,147,153,0.1)';
        ctx.fillRect(padding.left, y, cw, ch / 5);
        var val = Math.round(maxV - (maxV - minV) * i / 5);
        ctx.fillStyle = '#909399'; ctx.font = '11px -apple-system,sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(val, padding.left - 6, y);
    }

    for (var xi = 0; xi < n; xi++) {
        var x = padding.left + (xi + 0.5) * cw / n;
        ctx.strokeStyle = 'rgba(144,147,153,0.15)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, padding.top + ch); ctx.stroke();
    }

    subjectOrder.forEach(function(si, ci) {
        var c = colors[ci % colors.length];
        ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
        examList.forEach(function(en, xi) {
            var x = padding.left + (xi + 0.5) * cw / n;
            var sc = examGroups[en].scores[si];
            if (sc) {
                var y = padding.top + (1 - (sc.score - minV) / (maxV - minV)) * ch;
                if (xi === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        ctx.fillStyle = '#fff'; ctx.strokeStyle = c; ctx.lineWidth = 2;
        examList.forEach(function(en, xi) {
            var x = padding.left + (xi + 0.5) * cw / n;
            var sc = examGroups[en].scores[si];
            if (sc) {
                var y = padding.top + (1 - (sc.score - minV) / (maxV - minV)) * ch;
                ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
        });
    });

    examList.forEach(function(en, xi) {
        var x = padding.left + (xi + 0.5) * cw / n;
        var lbl = en.length > 14 ? en.substring(0, 13) + '…' : en;
        ctx.fillStyle = '#909399'; ctx.font = '11px -apple-system,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(lbl, x, padding.top + ch + 8);
    });

    var legendW = subjectOrder.reduce(function(s, si) { return s + ctx.measureText(si).width + 30; }, 0);
    var legendX = (w - legendW) / 2;
    var legendY = 14;
    subjectOrder.forEach(function(si, ci) {
        var c = colors[ci % colors.length];
        ctx.strokeStyle = c; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(legendX, legendY + 7); ctx.lineTo(legendX + 20, legendY + 7); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = c; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(legendX + 10, legendY + 7, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#606266'; ctx.font = '11px -apple-system,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(si, legendX + 26, legendY + 7);
        legendX += ctx.measureText(si).width + 34;
    });
}

function drawRankChart(examGroups, examList) {
    var canvas = $('rankChart');
    if (!canvas || !canvas.getContext) return;
    var result = setupCanvas(canvas);
    if (!result) return;
    var ctx = result.ctx, w = result.w, h = result.h;
    var ranks = [];
    var validExams = [];
    examList.forEach(function(en) { if (examGroups[en].grade_rank) { ranks.push(parseInt(examGroups[en].grade_rank)); validExams.push(en); } });
    if (ranks.length < 2) { ctx.fillStyle='#909399';ctx.font='14px -apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('需要至少2次考试成绩',w/2,h/2);return; }

    var padding = { top: 50, right: 25, bottom: 95, left: 50 };
    var cw = w - padding.left - padding.right, ch = h - padding.top - padding.bottom;
    var minR = Math.min.apply(null, ranks);
    var maxR = Math.max.apply(null, ranks);
    var rangeR = maxR - minR || 1;
    var stepR = Math.pow(10, Math.floor(Math.log10(rangeR)));
    var niceMin = Math.max(0, Math.floor(minR / stepR) * stepR - stepR);
    var niceMax = Math.ceil(maxR / stepR) * stepR + stepR;
    var n = validExams.length;

    var grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + ch);
    grad.addColorStop(0, 'rgba(155,89,182,0.2)');
    grad.addColorStop(1, 'rgba(155,89,182,0.02)');
    ctx.fillStyle = grad;
    ctx.fillRect(padding.left, padding.top, cw, ch);

    for (var i = 0; i <= 5; i++) {
        var y = padding.top + ch * i / 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
        var val = Math.round(niceMax - (niceMax - niceMin) * i / 5);
        ctx.fillStyle = '#909399'; ctx.font = '11px -apple-system,sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(val, padding.left - 6, y);
    }

    for (var xi = 0; xi < n; xi++) {
        var x = padding.left + (xi + 0.5) * cw / n;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, padding.top + ch); ctx.stroke();
    }

    var c = '#9b59b6';
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
    ranks.forEach(function(r, i) {
        var x = padding.left + (i + 0.5) * cw / n;
        var y = padding.top + (r - niceMin) / (niceMax - niceMin) * ch;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#fff'; ctx.strokeStyle = c; ctx.lineWidth = 2;
    ranks.forEach(function(r, i) {
        var x = padding.left + (i + 0.5) * cw / n;
        var y = padding.top + (r - niceMin) / (niceMax - niceMin) * ch;
        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = c; ctx.font = 'bold 10px -apple-system,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('#' + r, x, y - 8);
        ctx.fillStyle = '#fff';
    });

    validExams.forEach(function(en, i) {
        var x = padding.left + (i + 0.5) * cw / n;
        var lbl = en.length > 14 ? en.substring(0, 13) + '…' : en;
        ctx.fillStyle = '#909399'; ctx.font = '11px -apple-system,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(lbl, x, padding.top + ch + 8);
    });

    var legendText = '排名';
    var legendW = ctx.measureText(legendText).width + 44;
    var legendX = (w - legendW) / 2;
    var legendY = 14;
    ctx.strokeStyle = c; ctx.lineWidth = 2.5;
    ctx.strokeRect(legendX, legendY, 32, 14);
    ctx.fillStyle = '#606266'; ctx.font = 'bold 11px -apple-system,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(legendText, legendX + 38, legendY + 7);
}

var _chartTimer = null;
function bindChartResize() {
    window.removeEventListener('resize', _chartResizeHandler);
    window.addEventListener('resize', _chartResizeHandler);
}
function _chartResizeHandler() {
    if (_chartTimer) clearTimeout(_chartTimer);
    _chartTimer = setTimeout(function() {
        if (page === 'score-analysis') renderScoreAnalysis();
    }, 200);
}

var editingScoreId = null;
function editScore(id, examId, examName, subject, currentScore, fullScore) {
    if (id && id > 0) {
        var newScore = prompt('编辑 ' + examName + ' - ' + subject + '\n当前分数: ' + currentScore + '/' + fullScore + '\n\n请输入新分数:', currentScore);
        if (newScore === null) return;
        var val = parseFloat(newScore);
        if (isNaN(val)) { alert('请输入有效的数字'); return; }
        api('PUT', '/scores/' + id, { score: val }).then(function(res) {
            if (res.success) { alert('修改成功'); renderScoreManage(); }
            else alert('修改失败: ' + (res.message || '未知错误'));
        });
    } else {
        var newScore = prompt('录入 ' + examName + ' - ' + subject + '\n满分: ' + fullScore + '\n\n请输入分数:');
        if (newScore === null) return;
        var val = parseFloat(newScore);
        if (isNaN(val) || val < 0) { alert('请输入有效的分数'); return; }
        if (val > fullScore * 1.5) { alert('分数不能超过满分的1.5倍'); return; }
        api('POST', '/scores', { examId: examId, scores: [{ subject: subject, score: val, fullScore: fullScore }] }).then(function(res) {
            if (res.success) { alert('录入成功'); renderScoreManage(); }
            else alert('录入失败: ' + (res.message || '未知错误'));
        });
    }
}

function exportScores() {
    api('GET', '/scores').then(function(res) {
        var list = res.data ? (res.data.list || []) : [];
        if (!list.length) { alert('暂无数据可导出'); return; }
        
        var examGroups = {};
        var examList = [];
        var allSubjects = {};
        list.forEach(function(s) {
            var en = s.exam_name || '未知考试';
            if (!examGroups[en]) { examGroups[en] = { exam_name: en, exam_date: s.exam_date || '-', scores: {}, total_score: 0, grade_rank: null, class_rank: null }; examList.push(en); }
            examGroups[en].scores[s.subject] = { score: s.score, full_score: s.full_score };
            examGroups[en].total_score += parseFloat(s.score) || 0;
            if (s.grade_rank && (!examGroups[en].grade_rank || parseInt(s.grade_rank) < parseInt(examGroups[en].grade_rank))) examGroups[en].grade_rank = s.grade_rank;
            if (s.class_rank && (!examGroups[en].class_rank || parseInt(s.class_rank) < parseInt(examGroups[en].class_rank))) examGroups[en].class_rank = s.class_rank;
            allSubjects[s.subject] = true;
        });
        examList.sort(function(a, b) {
            return (examGroups[b].exam_date || '').localeCompare(examGroups[a].exam_date || '');
        });
        var subjectOrder = ['语文','数学','英语'].concat(getSubjectMap());
        Object.keys(allSubjects).forEach(function(s) { if (subjectOrder.indexOf(s) === -1) subjectOrder.push(s); });
        
        var studentName = user.name || '学生';
        var schoolName = '阳光学情报告';
        
        var rows = examList.map(function(en) {
            var eg = examGroups[en];
            var cells = subjectOrder.map(function(s) {
                var sc = eg.scores[s];
                var val = sc ? sc.score : '-';
                var color = sc ? (sc.score >= sc.full_score * 0.8 ? '#67C23A' : sc.score >= sc.full_score * 0.6 ? '#E6A23C' : '#F56C6C') : '#c0c4cc';
                return '<td style="border:1px solid #ebeef5;padding:8px;text-align:center;color:' + color + ';font-weight:500">' + val + '</td>';
            }).join('');
            return '<tr><td style="border:1px solid #ebeef5;padding:8px;font-weight:600;white-space:nowrap">' + htmlEscape(en) + '</td>' + cells +
                '<td style="border:1px solid #ebeef5;padding:8px;text-align:center;font-weight:700;color:#E6A23C">' + eg.total_score + '</td>' +
                '<td style="border:1px solid #ebeef5;padding:8px;text-align:center">' + (eg.grade_rank || '-') + '</td>' +
                '<td style="border:1px solid #ebeef5;padding:8px;text-align:center">' + (eg.class_rank || '-') + '</td></tr>';
        }).join('');
        
        var totals = examList.map(function(en) { return examGroups[en].total_score; });
        var maxTotal = Math.max.apply(null, totals.length > 0 ? totals : [0]);
        var avgTotal = totals.length > 0 ? Math.round(totals.reduce(function(a,b){return a+b;},0)/totals.length*10)/10 : 0;
        var bestRank = null;
        examList.forEach(function(en) { if (examGroups[en].grade_rank) { if (!bestRank || parseInt(examGroups[en].grade_rank) < parseInt(bestRank)) bestRank = examGroups[en].grade_rank; } });
        
        var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>成绩报告 - ' + htmlEscape(studentName) + '</title><style>' +
            '*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:40px;background:#f5f7fa;color:#333}' +
            '.container{max-width:1200px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.1);overflow:hidden}' +
            '.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px 40px;text-align:center}' +
            '.header h1{font-size:24px;margin-bottom:8px}.header p{font-size:14px;opacity:0.9}' +
            '.stats{display:flex;justify-content:space-around;padding:24px 40px;background:#fafafa;border-bottom:1px solid #ebeef5}' +
            '.stat{text-align:center}.stat .val{font-size:28px;font-weight:700;color:#409EFF}.stat .lbl{font-size:12px;color:#999;margin-top:4px}' +
            '.content{padding:24px 40px}' +
            '.content h2{font-size:16px;color:#333;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #409EFF;display:inline-block}' +
            'table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}' +
            'thead th{background:#f5f7fa;padding:10px 8px;font-weight:600;color:#606266;border:1px solid #ebeef5;white-space:nowrap}' +
            '.footer{text-align:center;padding:20px;color:#999;font-size:12px;border-top:1px solid #ebeef5}' +
            '.btn{display:inline-block;padding:10px 24px;background:#409EFF;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin:8px}' +
            '.btn:hover{background:#66b1ff}.btn-print{background:#67C23A}.btn-print:hover{background:#85ce61}' +
            '.actions{text-align:center;padding:20px}' +
            '@media print{body{padding:0;background:#fff}.actions{display:none}.container{box-shadow:none}}' +
            '</style></head><body>' +
            '<div class="container">' +
            '<div class="header"><h1>📊 学情成绩报告</h1><p>' + htmlEscape(studentName) + ' | 生成日期：' + new Date().toLocaleDateString('zh-CN') + '</p></div>' +
            '<div class="stats">' +
                '<div class="stat"><div class="val">' + maxTotal + '</div><div class="lbl">最高总分</div></div>' +
                '<div class="stat"><div class="val">' + avgTotal + '</div><div class="lbl">平均总分</div></div>' +
                '<div class="stat"><div class="val">' + (bestRank || '-') + '</div><div class="lbl">最佳排名</div></div>' +
                '<div class="stat"><div class="val">' + examList.length + '</div><div class="lbl">考试次数</div></div>' +
            '</div>' +
            '<div class="content">' +
                '<h2>成绩详情</h2>' +
                '<table><thead><tr><th>考试名称</th>' + subjectOrder.map(function(s){return '<th>'+htmlEscape(s)+'</th>';}).join('') + '<th>总分</th><th>年级排名</th><th>班级排名</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '</div>' +
            '<div class="footer">本报告由「阳光学情报告」系统自动生成 | 数据仅供参考</div>' +
            '</div>' +
            '<div class="actions">' +
                '<button class="btn btn-print" onclick="window.print()">🖨️ 打印/保存PDF</button>' +
                '<button class="btn" onclick="window.close()">关闭</button>' +
            '</div>' +
            '</body></html>';
        
        var win = window.open('', '_blank', 'width=1100,height=800');
        win.document.write(html);
        win.document.close();
    });
}

function renderTargetUni() {
    h('<div class="page-title">目标大学</div>' +
        '<div class="page-desc">设定目标院校，追踪成绩差距，明确努力方向</div>' +
        '<div id="targetCardsArea" style="margin-bottom:16px"></div>' +
        '<div class="card" style="margin-bottom:16px"><div class="card-title">当前成绩概况</div><div id="myScoreSummary">加载中...</div></div>' +
        '<div class="card" style="margin-top:16px"><div class="card-title">我的目标大学</div>' +
            '<div id="myGoalsArea">加载中...</div>' +
        '</div>' +
        '<div class="card" style="margin-top:16px"><div class="card-title" style="display:flex;justify-content:space-between;align-items:center"><span>大学库</span>' +
            '<input type="text" id="uniSearchInput" placeholder="搜索大学名称..." style="padding:5px 10px;border:1px solid #ebeef5;border-radius:4px;width:200px;font-size:12px" oninput="searchUni()" />' +
            '<select id="uniSubjectSelect" style="padding:5px;border:1px solid #ebeef5;border-radius:4px;width:100px;font-size:12px;margin-left:8px" onchange="loadUniversities()"><option value="">全部</option><option value="physics">物理类</option><option value="history">历史类</option><option value="art">美术类</option></select>' +
        '</div>' +
        '<div id="uniTableArea"></div>' +
        '<div id="uniPagination"></div>' +
        '</div>');
    loadTargetCards();
    loadScoreSummary();
    loadMyGoals();
    loadUniversities();
}

function loadTargetCards() {
    var area = $('targetCardsArea');
    if (!area) return;
    area.innerHTML = '<div class="card"><div class="empty-state">加载中...</div></div>';

    api('GET', '/scores').then(function(scoreRes) {
        var scores = scoreRes.data ? (scoreRes.data.list || []) : [];
        var examGroups = {};
        scores.forEach(function(s) {
            var en = s.exam_name || '未知考试';
            if (!examGroups[en]) examGroups[en] = { total: 0, date: s.exam_date || '', scores: {} };
            examGroups[en].total += parseFloat(s.score) || 0;
            examGroups[en].scores[s.subject] = s.score;
        });
        var examList = Object.keys(examGroups).sort(function(a, b) {
            return (examGroups[b].date || '').localeCompare(examGroups[a].date || '');
        });
        var n = Math.min(5, examList.length);
        var recentExams = examList.slice(0, n);

        var subjectType = user.subject_type || '物化生';
        var stField = subjectType.indexOf('史') === 0 ? 'history' : 'physics';
        if (subjectType === 'art') stField = 'art';

        var allSubjects = {};
        var subjectScores = {};
        recentExams.forEach(function(en) {
            var eg = examGroups[en];
            Object.keys(eg.scores).forEach(function(s) {
                allSubjects[s] = true;
                if (!subjectScores[s]) subjectScores[s] = 0;
                subjectScores[s] += parseFloat(eg.scores[s]) || 0;
            });
        });
        var avgTotal = 0;
        Object.keys(allSubjects).forEach(function(s) {
            avgTotal += subjectScores[s] / n;
        });
        avgTotal = Math.round(avgTotal);

        api('GET', '/user/universities').then(function(res) {
            var goals = res.data.list || [];
            var safeUni = null, matchUni = null, riskUni = null;

            goals.forEach(function(g) {
                var mt = g.match_type || 'safe';
                if (mt === 'safe' && (!safeUni || g.score_diff < safeUni.score_diff)) safeUni = g;
                else if (mt === 'match' && (!matchUni || Math.abs(g.score_diff - 20) < Math.abs((matchUni.score_diff || 20) - 20))) matchUni = g;
                else if (mt === 'risk' && (!riskUni || g.score_diff > riskUni.score_diff)) riskUni = g;
            });

            if (goals.length === 0) {
                area.innerHTML = '<div class="target-cards-grid">' +
                    createTargetCard('risk', '冲刺', '#E6A23C', '#fff3e0', '去设定', null, 'K1') +
                    createTargetCard('match', '稳妥', '#409EFF', '#ecf5ff', '去设定', null, 'K2') +
                    createTargetCard('safe', '保底', '#67C23A', '#f0f9eb', '去设定', null, 'K3') +
                    '</div>';
            } else {
                area.innerHTML = '<div class="target-cards-grid">' +
                    createTargetCard('risk', '冲刺', '#E6A23C', '#fff3e0', riskUni ? '' : '去设定', riskUni, 'K1') +
                    createTargetCard('match', '稳妥', '#409EFF', '#ecf5ff', matchUni ? '' : '去设定', matchUni, 'K2') +
                    createTargetCard('safe', '保底', '#67C23A', '#f0f9eb', safeUni ? '' : '去设定', safeUni, 'K3') +
                    '</div>';
            }
        });
    }).catch(function() {
        area.innerHTML = '<div class="card"><div class="empty-state">加载失败，请刷新重试</div></div>';
    });
}

function createTargetCard(type, label, color, bgColor, btnText, uni, sequence) {
    if (uni) {
        var gap = uni.score_diff || 0;
        var gapText = gap >= 0 ? '超' + gap + '分' : '差' + Math.abs(gap) + '分';
        var progress = Math.max(0, Math.min(100, (uni.admission_score || 1) / ((uni.admission_score || 1) + (gap > 0 ? gap : 0)) * 100));
        if (gap < 0) progress = Math.max(10, ((uni.admission_score || 1) + gap) / (uni.admission_score || 1) * 100);
        progress = Math.round(progress);
        return '<div class="target-card" style="border-left:4px solid ' + color + '">' +
            '<div class="target-card-header">' +
                '<span class="target-sequence">' + sequence + '</span>' +
                '<span class="target-label" style="background:' + color + '">' + label + '</span>' +
                '<span class="target-uni-name">' + htmlEscape(uni.university_name) + '</span>' +
            '</div>' +
            '<div class="target-card-body">' +
                '<div class="target-row"><span class="target-label-sm">录取分</span><span class="target-value">' + (uni.admission_score || '-') + '</span></div>' +
                '<div class="target-row"><span class="target-label-sm">你的分</span><span class="target-value" style="color:' + color + '">' + Math.round(uni.admission_score + gap) + '</span></div>' +
                '<div class="target-row"><span class="target-label-sm">差距</span><span class="target-value" style="color:' + (gap >= 0 ? '#67C23A' : '#F56C6C') + '">' + gapText + '</span></div>' +
                '<div class="target-progress"><div class="target-progress-bar" style="width:' + progress + '%;background:' + color + '"></div></div>' +
                '<div class="target-progress-text">达成率 ' + progress + '%</div>' +
            '</div>' +
            '<div class="target-card-footer">' +
                '<button class="btn-small" onclick="removeUniGoal(' + uni.id + ')" style="color:#F56C6C">移除</button>' +
            '</div>' +
            '</div>';
    } else {
        return '<div class="target-card target-card-empty" style="border-left:4px solid ' + color + ';background:' + bgColor + '">' +
            '<div class="target-card-header">' +
                '<span class="target-sequence">' + sequence + '</span>' +
                '<span class="target-label" style="background:' + color + '">' + label + '</span>' +
            '</div>' +
            '<div class="target-card-body" style="justify-content:center;align-items:center">' +
                '<div class="target-empty">' +
                    '<div style="font-size:32px;opacity:.4;margin-bottom:8px">🎯</div>' +
                    '<div style="font-size:13px;color:#909399;margin-bottom:12px">尚未设定目标大学</div>' +
                    '<button class="btn-small btn-primary" onclick="showGoalPicker(\'' + type + '\')">去设定</button>' +
                '</div>' +
            '</div>' +
            '</div>';
    }
}

function showGoalPicker(type) {
    var overlay = document.createElement('div');
    overlay.className = 'goal-picker-overlay';
    overlay.innerHTML = '<div class="goal-picker-modal">' +
        '<div class="goal-picker-title">选择目标大学 - ' + {risk:'冲刺',match:'稳妥',safe:'保底'}[type] + '</div>' +
        '<input type="text" id="goalPickerSearch" placeholder="搜索大学名称..." style="width:100%;padding:10px;border:1px solid #dcdfe6;border-radius:6px;font-size:14px;margin-bottom:12px" oninput="filterGoalPicker()" />' +
        '<div id="goalPickerList" class="goal-picker-list">加载中...</div>' +
        '<div style="text-align:right;margin-top:12px"><button class="btn-small" onclick="closeGoalPicker()">取消</button></div>' +
        '</div>';
    overlay.onclick = function(e) { if (e.target === overlay) closeGoalPicker(); };
    document.body.appendChild(overlay);

    api('GET', '/universities?page=1&limit=50').then(function(res) {
        var list = res.data.list || [];
        window._goalPickerUnis = list;
        window._goalPickerType = type;
        renderGoalPickerList(list);
    });
}

function filterGoalPicker() {
    var kw = ($('goalPickerSearch') || {}).value || '';
    var list = window._goalPickerUnis || [];
    if (kw) list = list.filter(function(u) { return u.name.indexOf(kw) !== -1; });
    renderGoalPickerList(list.slice(0, 20));
}

function renderGoalPickerList(list) {
    var el = $('goalPickerList');
    if (!el) return;
    var rows = list.map(function(u) {
        return '<div class="goal-picker-item" onclick="selectGoalUni(' + u.id + ',\'' + htmlEscape(u.name) + '\')">' +
            '<span class="goal-picker-uni-name">' + htmlEscape(u.name) + '</span>' +
            '<span class="goal-picker-uni-info">' + htmlEscape(u.province) + ' · ' + htmlEscape(u.university_level) + '</span>' +
            '</div>';
    }).join('');
    el.innerHTML = rows || '<div style="text-align:center;color:#999;padding:20px">未找到匹配的大学</div>';
}

function selectGoalUni(uniId, uniName) {
    closeGoalPicker();
    api('POST', '/university-goals', { universityId: uniId }).then(function() {
        loadTargetCards();
        loadMyGoals();
        loadUniversities();
        loadScoreSummary();
    });
}

function closeGoalPicker() {
    var overlay = document.querySelector('.goal-picker-overlay');
    if (overlay) overlay.remove();
}

function loadScoreSummary() {
    api('GET', '/scores').then(function(res) {
        var scores = res.data ? (res.data.list || []) : [];
        var examCount = 0;
        var latestTotal = 0;
        var examGroups = {};
        scores.forEach(function(s) {
            var en = s.exam_name || '未知考试';
            if (!examGroups[en]) { examGroups[en] = { total: 0, date: s.exam_date || '' }; examCount++; }
            examGroups[en].total += parseFloat(s.score) || 0;
        });
        var examList = Object.keys(examGroups);
        if (examList.length > 0) {
            examList.sort(function(a, b) { return (examGroups[b].date || '').localeCompare(examGroups[a].date || ''); });
            latestTotal = examGroups[examList[0]].total;
        }
        var st = (user && user.subject_type) || '物化生';
        var stText = { '物化生': '物理类', '物化政': '物理类', '物生地': '物理类', '物化地': '物理类', '史政地': '历史类', '史政生': '历史类' };
        var area = $('myScoreSummary');
        if (area) {
            area.innerHTML = '<div style="display:flex;justify-content:space-around;text-align:center;padding:8px 0">' +
                '<div><div style="font-size:22px;font-weight:700;color:#F56C6C">' + Math.round(latestTotal) + '分</div><div style="font-size:12px;color:#999">最新总分</div></div>' +
                '<div><div style="font-size:16px;font-weight:600;color:#409EFF">' + (stText[st] || st) + '</div><div style="font-size:12px;color:#999">科类</div></div>' +
                '<div><div style="font-size:16px;font-weight:600;color:#67C23A">' + examCount + '次</div><div style="font-size:12px;color:#999">已录考试</div></div>' +
                '</div>';
        }
        window._targetScoreAvg = Math.round(latestTotal);
    }).catch(function() {
        var area = $('myScoreSummary');
        if (area) area.innerHTML = '<div style="text-align:center;color:#999;padding:8px">暂无成绩数据</div>';
    });
}

function searchUni() { uniPage = 1; loadUniversities(); }

function loadUniversities() {
    var search = $('uniSearchInput') ? $('uniSearchInput').value : '';
    var subject = $('uniSubjectSelect') ? $('uniSubjectSelect').value : '';
    var url = '/universities?page=' + uniPage;
    if (search) url += '&search=' + encodeURIComponent(search);
    if (subject) url += '&subject_type=' + subject;
    api('GET', url).then(function(res) {
        var data = res.data || {};
        uniList = data.list || [];
        uniTotal = data.total || 0;
        var rows = uniList.map(function(u, idx) {
            var levelColor = { '985': '#e74c5c', '211': '#ff9800', '双一流': '#4caf50', '普通': '#999' };
            var level = u.university_level || '普通';
            var physicsScore = u.physics_score || u.admission_score || '-';
            var historyScore = u.history_score || '-';
            var artScore = u.art_score || '-';
            var physicsRank = u.physics_rank || u.admission_rank || '-';
            var historyRank = u.history_rank || '-';
            var artRank = u.art_rank || '-';
            var typeColor = { '综合': '#F56C6C', '理工': '#409EFF', '师范': '#E6A23C', '农林': '#67C23A', '医药': '#909399', '财经': '#67C23A', '政法': '#E6A23C', '民族': '#909399', '体育': '#F56C6C', '艺术': '#E6A23C', '军事': '#909399' };
            var type = u.university_type || '综合';
            return '<tr><td style="font-weight:600;color:#909399;width:50px">' + (idx + 1) + '</td><td>' + htmlEscape(u.name) + '</td><td>' + htmlEscape(u.province) + '</td><td><span style="color:' + (levelColor[level] || '#999') + '">' + htmlEscape(level) + '</span></td><td><span style="color:' + (typeColor[type] || '#999') + '">' + htmlEscape(type) + '</span></td>' +
                '<td>' + physicsScore + '<br><small style="color:#888">' + physicsRank + '名</small></td>' +
                '<td>' + historyScore + '<br><small style="color:#888">' + historyRank + '名</small></td>' +
                '<td>' + artScore + '<br><small style="color:#888">' + artRank + '名</small></td>' +
                '<td>' + (u.linked ? '<span style="color:#67C23A">已添加</span>' : '<a href="javascript:;" onclick="addUniGoal(' + u.id + ')">添加</a>') + '</td></tr>';
        }).join('');
        var area = $('uniTableArea');
        if (area) {
            area.innerHTML = '<table class="data-table"><thead><tr><th style="width:50px">序号</th><th>大学名称</th><th>省份</th><th>层次</th><th>类型</th><th>物理类</th><th>历史类</th><th>美术类</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="9" style="text-align:center;color:#888">暂无数据</td></tr>') + '</tbody></table>';
        }
        var totalPages = Math.ceil(uniTotal / 20);
        var pagHtml = '';
        if (totalPages > 1) {
            pagHtml = '<div class="pagination">';
            if (uniPage > 1) pagHtml += '<button onclick="uniPage=' + (uniPage - 1) + ';loadUniversities()">上一页</button>';
            pagHtml += '<span>第 ' + uniPage + ' / ' + totalPages + ' 页，共 ' + uniTotal + ' 条</span>';
            if (uniPage < totalPages) pagHtml += '<button onclick="uniPage=' + (uniPage + 1) + ';loadUniversities()">下一页</button>';
            pagHtml += '</div>';
        }
        var pag = $('uniPagination');
        if (pag) pag.innerHTML = pagHtml;
    });
}

function addUniGoal(id) {
    api('POST', '/university-goals', { universityId: id }).then(function() {
        alert('已添加为目标大学');
        loadUniversities();
        loadMyGoals();
    });
}

function loadMyGoals() {
    api('GET', '/user/universities').then(function(res) {
        var goals = res.data.list || [];
        var rows = goals.map(function(g) {
            var matchType = g.match_type || 'safe';
            var matchLabels = { 'risk': '<span style="color:#e74c5c;font-weight:600">冲刺</span>', 'match': '<span style="color:#ff9800;font-weight:600">稳妥</span>', 'safe': '<span style="color:#67C23A;font-weight:600">保底</span>' };
            return '<tr><td>' + htmlEscape(g.university_name) + '</td><td>' + htmlEscape(g.province) + '</td><td>' + htmlEscape(g.university_level) + '</td><td>' + (g.admission_rank || '-') + '</td><td>' + (matchLabels[matchType] || '-') + '</td><td><a href="#" onclick="removeUniGoal(' + g.id + ')" style="color:#e74c5c">移除</a></td></tr>';
        }).join('');
        var area = $('myGoalsArea');
        if (area) {
            area.innerHTML = '<table class="data-table"><thead><tr><th>大学名称</th><th>省份</th><th>层次</th><th>录取位次</th><th>定位</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" style="text-align:center;color:#888">暂无目标大学</td></tr>') + '</tbody></table>';
        }
    });
}

function removeUniGoal(id) {
    if (!confirm('确定移除此目标大学？')) return;
    api('DELETE', '/user/universities/' + id).then(function(res) {
        if (res.success) {
            alert('已移除');
            loadMyGoals();
            loadUniversities();
            loadTargetCards();
            loadScoreSummary();
        } else {
            alert('移除失败: ' + (res.message || '未知错误'));
        }
    });
}

function renderPreference() {
    api('GET', '/preference/exams').then(function(res) {
        var exams = res.data.list || [];
        if (!exams || exams.length === 0) {
            h('<div class="page-title">志愿分析</div>' +
                '<div class="page-desc">基于您的成绩表现，AI智能分析志愿填报建议</div>' +
                '<div class="card"><div class="empty-state">暂无考试数据，请先录入成绩</div></div>');
            return;
        }
        var examOptions = exams.map(function(e) {
            return '<option value="' + e.id + '">' + e.name + ' (' + e.date + ')</option>';
        }).join('');
        h('<div class="page-title">志愿分析</div>' +
            '<div class="page-desc">基于您的成绩表现，AI智能分析志愿填报建议</div>' +
            '<div id="recentAnalysesArea"></div>' +
            '<div class="card" style="margin-top:16px">' +
                '<div class="card-title">选择分析条件</div>' +
                '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:12px">' +
                    '<div style="flex:1;min-width:200px">' +
                        '<label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px">选择考试次数</label>' +
                        '<select id="prefExamSelect" style="padding:10px 12px;border:1px solid #ebeef5;border-radius:6px;width:100%;background:#fff">' +
                            '<option value="recent3">最近3次考试</option>' +
                            '<option value="recent5" selected>最近5次考试</option>' +
                            '<option value="all">全部考试</option>' +
                            '<option value="">-- 选择单次考试 --</option>' + examOptions +
                        '</select>' +
                    '</div>' +
                    '<div style="flex:1;min-width:200px">' +
                        '<label style="display:block;font-weight:600;margin-bottom:8px;font-size:14px">目标专业方向</label>' +
                        '<select id="prefMajorSelect" style="padding:10px 12px;border:1px solid #ebeef5;border-radius:6px;width:100%;background:#fff">' +
                            '<option value="">不限（文理均可）</option>' +
                            '<option value="理工">理工类</option>' +
                            '<option value="文史">文史类</option>' +
                            '<option value="师范">师范类</option>' +
                            '<option value="医学">医学类</option>' +
                            '<option value="财经">财经类</option>' +
                            '<option value="艺术">艺术类</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div style="text-align:center;margin-top:20px">' +
                    '<button class="btn-primary" onclick="analyzePreference()" style="padding:10px 32px;font-size:15px">开始AI分析</button>' +
                '</div>' +
            '</div>' +
            '<div id="prefResultArea"></div>');
        loadRecentAnalyses();
    }).catch(function(err) {
        h('<div class="page-title">志愿分析</div>' +
            '<div class="page-desc">基于您的成绩表现，AI智能分析志愿填报建议</div>' +
            '<div class="card"><div class="empty-state">加载失败，请刷新重试</div></div>');
    });
}

function analyzePreference() {
    var examId = $('prefExamSelect').value;
    if (!examId) { alert('请选择考试'); return; }
    var area = $('prefResultArea');
    if (area) area.innerHTML = '<div class="card"><div class="empty-state">分析中...</div></div>';

    if (examId === 'recent3' || examId === 'recent5' || examId === 'all') {
        api('GET', '/scores').then(function(res) {
            var scores = res.data ? (res.data.list || []) : [];
            if (!scores.length) {
                if (area) area.innerHTML = '<div class="card"><div class="empty-state">暂无成绩数据</div></div>';
                return;
            }
            var examGroups = {};
            scores.forEach(function(s) {
                var en = s.exam_name || '未知考试';
                if (!examGroups[en]) examGroups[en] = { exam_name: en, exam_id: s.exam_id, exam_date: s.exam_date || '-', scores: {}, total_score: 0 };
                examGroups[en].scores[s.subject] = { score: s.score, full_score: s.full_score };
                examGroups[en].total_score += parseFloat(s.score) || 0;
            });
            var examList = Object.keys(examGroups).sort(function(a, b) {
                var da = examGroups[a].exam_date || '';
                var db = examGroups[b].exam_date || '';
                return db.localeCompare(da);
            });
            var n = examId === 'recent3' ? Math.min(3, examList.length) : examId === 'recent5' ? Math.min(5, examList.length) : examList.length;
            var recentExams = examList.slice(0, n);
            var allSubjects = {};
            var subjectScores = {};
            var subjectFullScores = {};
            var subjectMinScores = {};
            var subjectMaxScores = {};
            recentExams.forEach(function(en) {
                var eg = examGroups[en];
                Object.keys(eg.scores).forEach(function(s) {
                    allSubjects[s] = true;
                    if (!subjectScores[s]) subjectScores[s] = 0;
                    if (!subjectFullScores[s]) subjectFullScores[s] = 0;
                    if (!subjectMinScores[s]) subjectMinScores[s] = Infinity;
                    if (!subjectMaxScores[s]) subjectMaxScores[s] = 0;
                    subjectScores[s] += eg.scores[s].score;
                    subjectFullScores[s] += eg.scores[s].full_score;
                    subjectMinScores[s] = Math.min(subjectMinScores[s], parseFloat(eg.scores[s].score) || 0);
                    subjectMaxScores[s] = Math.max(subjectMaxScores[s], parseFloat(eg.scores[s].score) || 0);
                });
            });
            var subjectType = user.subject_type || 'physics';
            var selectedSubjects = [];
            if (subjectType === '物化生' || subjectType === 'physics') {
                subjectType = 'physics';
                selectedSubjects = ['物理', '化学', '生物'];
            } else if (subjectType.indexOf('史') === 0) {
                subjectType = 'history';
                selectedSubjects = ['历史', '政治', '地理'];
            } else if (subjectType === 'art') {
                subjectType = 'art';
                selectedSubjects = ['历史', '政治', '地理'];
            } else {
                subjectType = 'physics';
                selectedSubjects = ['物理', '化学', '生物'];
            }
            var mainSubjects = ['语文', '数学', '英语'].concat(selectedSubjects);
            var mainSet = {};
            mainSubjects.forEach(function(s) { mainSet[s] = true; });

            var totalScore = 0;
            var totalFull = 0;
            var subjectAvgScores = {};
            Object.keys(allSubjects).forEach(function(s) {
                if (!mainSet[s]) return;
                subjectAvgScores[s] = Math.round(subjectScores[s] / n);
                totalScore += subjectScores[s] / n;
                totalFull += subjectFullScores[s] / n;
            });
            totalScore = Math.round(totalScore);
            totalFull = Math.round(totalFull);
            var rate = totalFull > 0 ? Math.round(totalScore / totalFull * 1000) / 10 : 0;
            var allExamTotals = recentExams.map(function(en) {
                var eg = examGroups[en];
                var t = 0;
                Object.keys(eg.scores).forEach(function(s) {
                    if (mainSet[s]) t += parseFloat(eg.scores[s].score) || 0;
                });
                return t;
            });
            var maxScore = Math.round(Math.max.apply(null, allExamTotals));
            var minScore = Math.round(Math.min.apply(null, allExamTotals));
            var volatility = Math.round(maxScore - minScore);
            var trend = '稳定';
            if (n >= 3) {
                var firstHalf = allExamTotals.slice(0, Math.floor(n / 2)).reduce(function(a, b) { return a + b; }, 0) / Math.floor(n / 2);
                var secondHalf = allExamTotals.slice(Math.floor(n / 2)).reduce(function(a, b) { return a + b; }, 0) / (n - Math.floor(n / 2));
                if (secondHalf - firstHalf > 15) trend = '上升';
                else if (firstHalf - secondHalf > 15) trend = '下滑';
            }
            renderPreferenceResult(area, totalScore, totalFull, rate, subjectType, n, subjectAvgScores, subjectMinScores, subjectMaxScores, maxScore, minScore, volatility, trend);
        });
    } else {
        api('GET', '/preference/analyze?examId=' + examId).then(function(res) {
            if (!res.success) {
                if (area) area.innerHTML = '<div class="card"><div class="empty-state">' + (res.message || '分析失败') + '</div></div>';
                return;
            }
            var d = res.data || {};
            renderPreferenceResult(area, d.totalScore || 0, d.totalFull || 0, d.rate || 0, d.subjectType || 'physics', 1, d.subjectAvgScores || {}, d.subjectMinScores || {}, d.subjectMaxScores || {}, d.maxScore || 0, d.minScore || 0, d.volatility || 0, d.trend || '稳定');
        });
    }
}

function renderPreferenceResult(area, totalScore, totalFull, rate, subjectType, examCount, subjectAvgScores, subjectMinScores, subjectMaxScores, maxScore, minScore, volatility, trend) {
    if (!area) area = $('prefResultArea');
    if (!area) return;
    var subjectText = { 'physics': '物理类', 'history': '历史类', 'art': '美术类' };
    var subjectNames = { 'physics': ['语文', '数学', '英语', '物理', '化学', '生物'], 'history': ['语文', '数学', '英语', '历史', '政治', '地理'], 'art': ['语文', '数学', '英语', '物理', '化学', '美术'] };
    var trendColor = { '稳定': '#ff9800', '上升': '#67C23A', '下滑': '#e74c5c' };
    var html = '<div class="card"><div class="card-title">总体评价</div>' +
        '<div style="background:linear-gradient(135deg,#f5f3ff 0%,#fdf2f8 100%);border-radius:12px;padding:20px;margin-top:12px">' +
            '<div style="display:flex;gap:32px;flex-wrap:wrap">' +
                '<div><div style="color:#888;font-size:13px">平均分</div><div style="font-size:24px;font-weight:700;color:#1a1a2e">' + totalScore + '</div></div>' +
                '<div><div style="color:#888;font-size:13px">最高分</div><div style="font-size:24px;font-weight:700;color:#1a1a2e">' + maxScore + '</div></div>' +
                '<div><div style="color:#888;font-size:13px">波动幅度</div><div style="font-size:24px;font-weight:700;color:#1a1a2e">' + volatility + '</div></div>' +
                '<div><div style="color:#888;font-size:13px">趋势</div><div style="font-size:24px;font-weight:700;color:' + (trendColor[trend] || '#999') + '">' + trend + '</div></div>' +
            '</div>' +
        '</div>' +
        '<div style="margin-top:16px;padding:16px;background:#fafafa;border-radius:8px;border-left:3px solid #e74c5c">' +
            '<span style="color:#666">根据您最近' + examCount + '次考试的成绩分析，您的平均总分约为<strong>' + totalScore + '</strong>分，成绩相对' + (trend === '稳定' ? '稳定' : (trend === '上升' ? '良好，呈上升趋势' : '一般，近期表现略有下滑')) + '。总分波动幅度为<strong>' + volatility + '</strong>分' + (volatility > 100 ? '，波动较大，建议调整学习状态' : '，波动在合理范围内') + '。</span>' +
        '</div>' +
    '</div>';

    var subjects = subjectNames[subjectType] || subjectNames['physics'];
    var subjectAdvice = {};
    subjects.forEach(function(subj) {
        var avg = subjectAvgScores[subj] || 0;
        var min = subjectMinScores[subj] || 0;
        var max = subjectMaxScores[subj] || 0;
        var level = '待提升';
        var color = '#ff9800';
        var bg = '#fff3e0';
        var advice = subj + '有一定基础，建议加强专项练习';
        var fullScore = 150;
        if (subj === '物理' || subj === '化学' || subj === '生物' || subj === '历史' || subj === '政治' || subj === '地理') fullScore = 100;
        if (avg / fullScore >= 0.85) { level = '优势科目'; color = '#67C23A'; bg = '#e8f8e8'; advice = subj + '成绩优秀，保持优势并适当拓展'; }
        else if (avg / fullScore >= 0.7) { level = '稳定科目'; color = '#409EFF'; bg = '#e8f4fd'; advice = subj + '成绩稳定，可针对性突破薄弱知识点'; }
        else if (avg / fullScore >= 0.6) { level = '待提升'; color = '#ff9800'; bg = '#fff3e0'; }
        else { level = '薄弱科目'; color = '#e74c5c'; bg = '#fff0f0'; advice = subj + '基础较弱，建议重点加强基础训练'; }
        subjectAdvice[subj] = { avg: avg, min: min, max: max, level: level, color: color, bg: bg, advice: advice };
    });
    html += '<div class="card" style="margin-top:16px"><div class="card-title">科目分析</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:12px">';
    subjects.forEach(function(subj) {
        var sa = subjectAdvice[subj];
        if (!sa || !sa.avg) return;
        html += '<div style="background:' + sa.bg + ';border-radius:8px;padding:16px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<strong style="font-size:15px">' + subj + '</strong>' +
                '<span style="font-size:12px;color:' + sa.color + ';background:' + sa.bg + ';border:1px solid ' + sa.color + ';border-radius:10px;padding:2px 8px">' + sa.level + '</span>' +
            '</div>' +
            '<div style="margin-top:8px;font-size:13px;color:#666">' +
                '平均: ' + sa.avg + '  最高: ' + sa.max + '  最低: ' + sa.min +
            '</div>' +
            '<div style="margin-top:6px;font-size:12px;color:#888">' + sa.advice + '</div>' +
        '</div>';
    });
    html += '</div></div>';

    html += '<div class="card" style="margin-top:16px"><div class="card-title">院校推荐</div>' +
        '<div id="schoolTabs" style="display:flex;gap:0;border-bottom:2px solid #ebeef5;margin-top:12px">' +
            '<div class="school-tab active" data-type="risk" onclick="switchSchoolTab(this)" style="padding:10px 20px;cursor:pointer;color:#e74c5c;border-bottom:2px solid #e74c5c;margin-bottom:-2px;font-weight:600">冲刺型</div>' +
            '<div class="school-tab" data-type="match" onclick="switchSchoolTab(this)" style="padding:10px 20px;cursor:pointer;color:#888">稳妥型</div>' +
            '<div class="school-tab" data-type="safe" onclick="switchSchoolTab(this)" style="padding:10px 20px;cursor:pointer;color:#888">保底型</div>' +
        '</div>' +
        '<div id="schoolListArea"></div>' +
    '</div>';

    html += '<div class="card" style="margin-top:16px"><div class="card-title">志愿填报建议</div>' +
        '<div id="suggestionArea"></div>' +
    '</div>';

    area.innerHTML = html;

    var majorType = $('prefMajorSelect') ? $('prefMajorSelect').value : '';
    api('GET', '/preference/score-analysis?score=' + totalScore + '&subjectType=' + subjectType + (majorType ? '&majorType=' + majorType : '')).then(function(res) {
        if (!res.success || !res.data) return;
        var d = res.data || {};
        window._prefSchoolData = d;
        switchSchoolTab(document.querySelector('.school-tab.active'));
        renderSuggestions(d);
        saveAnalysis(totalScore, totalScore, maxScore, volatility, trend, examCount, subjectType, subjectAvgScores, subjectMinScores, subjectMaxScores, d);
    });
}

function saveAnalysis(avgScore, totalScore, maxScore, volatility, trend, examCount, subjectType, subjectAvgScores, subjectMinScores, subjectMaxScores, schoolData) {
    api('POST', '/preference/analyses', {
        avgScore: avgScore,
        totalScore: totalScore,
        maxScore: maxScore,
        volatility: volatility,
        trend: trend,
        examCount: examCount,
        subjectType: subjectType,
        subjectAvgScores: subjectAvgScores,
        subjectMinScores: subjectMinScores,
        subjectMaxScores: subjectMaxScores,
        schoolData: schoolData
    }).then(function() {
        loadRecentAnalyses();
    });
}

function switchSchoolTab(el) {
    var tabs = document.querySelectorAll('.school-tab');
    tabs.forEach(function(t) { t.style.color = '#888'; t.style.borderBottom = 'none'; t.style.fontWeight = '400'; });
    el.style.color = '#e74c5c'; el.style.borderBottom = '2px solid #e74c5c'; el.style.fontWeight = '600';
    var type = el.getAttribute('data-type');
    var d = window._prefSchoolData || {};
    var list = d[type] || [];
    var typeColors = { 'risk': '#e74c5c', 'match': '#4caf50', 'safe': '#409EFF' };
    var typeDescs = { 'risk': '分数略低，需要冲刺', 'match': '分数充足，录取概率高', 'safe': '分数充裕，作为保底' };
    var area = $('schoolListArea');
    if (!area) return;
    if (list.length === 0) {
        area.innerHTML = '<div style="text-align:center;color:#888;padding:40px">暂无' + (type === 'risk' ? '冲刺' : type === 'match' ? '稳妥' : '保底') + '类型院校推荐</div>';
        return;
    }
    var html = '';
    list.slice(0, 20).forEach(function(u, i) {
        var levelColor = { '985': '#e74c5c', '211': '#ff9800', '双一流': '#4caf50', '普通': '#999' };
        var diff = u.score_diff || 0;
        var diffText = diff >= 0 ? '+' + diff : diff;
        var matchRate = Math.max(0, Math.min(100, 50 + diff));
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f0f0f0">' +
            '<div style="display:flex;align-items:center;gap:12px;flex:1">' +
                '<span style="background:' + (levelColor[u.level] || '#999') + ';color:#fff;font-size:11px;padding:2px 8px;border-radius:10px">' + htmlEscape(u.level || '普通') + '</span>' +
                '<div>' +
                    '<div style="font-weight:600">' + htmlEscape(u.name) + '</div>' +
                    '<div style="font-size:12px;color:#888">录取分数线: ' + u.admission_score + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="text-align:right">' +
                '<div style="font-size:18px;font-weight:700;color:' + typeColors[type] + '">' + matchRate + '%</div>' +
                '<div style="font-size:11px;color:#888">匹配度</div>' +
            '</div>' +
        '</div>';
    });
    if (list.length > 20) {
        html += '<div style="text-align:center;color:#888;padding:12px">仅显示前20所，共' + list.length + '所</div>';
    }
    area.innerHTML = html;
}

function renderSuggestions(d) {
    var area = $('suggestionArea');
    if (!area) return;
    var riskCount = (d.risk || []).length;
    var matchCount = (d.match || []).length;
    var safeCount = (d.safe || []).length;
    var total = riskCount + matchCount + safeCount;
    var suggestions = [];
    suggestions.push({ num: 1, text: '建议以稳妥型志愿为主，冲刺型志愿为辅，合理分配志愿梯度' });
    suggestions.push({ num: 2, text: '根据您的成绩分布，建议关注' + (riskCount > matchCount ? '理工科' : '综合') + '类专业，就业前景广阔' });
    suggestions.push({ num: 3, text: '注意各科目的均衡发展，避免单科拉分影响总体排名' });
    suggestions.push({ num: 4, text: '可在志愿填报前再进行一次模拟考试，检验学习成果' });
    suggestions.push({ num: 5, text: '建议关注目标院校的招生简章，了解具体的选科要求' });
    var html = '';
    suggestions.forEach(function(s) {
        html += '<div style="display:flex;gap:12px;align-items:flex-start;padding:14px;margin-top:8px;background:#f7f7f7;border-radius:8px">' +
            '<span style="background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">' + s.num + '</span>' +
            '<span style="color:#555;font-size:14px">' + s.text + '</span>' +
        '</div>';
    });
    area.innerHTML = html;
}

function loadRecentAnalyses() {
    api('GET', '/preference/analyses').then(function(res) {
        var area = $('recentAnalysesArea');
        if (!area) return;
        var analyses = res.data ? (res.data.list || []) : [];
        if (!analyses.length) {
            area.innerHTML = '';
            return;
        }
        var trendColor = { '稳定': '#ff9800', '上升': '#67C23A', '下滑': '#e74c5c' };
        var trendBg = { '稳定': '#fff3e0', '上升': '#e8f8e8', '下滑': '#fff0f0' };
        var html = '<div class="card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ebeef5;padding-bottom:12px">' +
                '<div class="card-title" style="margin:0">最近分析记录（保留最近3次）</div>' +
                '<a href="javascript:;" onclick="clearAnalyses()" style="color:#e74c5c;font-size:13px">清空记录</a>' +
            '</div>';
        analyses.slice(0, 3).forEach(function(a, i) {
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:' + (i < analyses.length - 1 ? '1px solid #f0f0f0' : 'none') + '">' +
                '<div style="display:flex;align-items:center;gap:16px">' +
                    '<span style="background:#f5f3ff;color:#7c3aed;font-size:12px;padding:2px 8px;border-radius:4px;font-weight:600">#' + (i + 1) + '</span>' +
                    '<div>' +
                        '<div style="font-size:13px;color:#888">' + a.avg_score + '分</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:12px">' +
                    '<span style="font-size:12px;color:#888">趋势</span>' +
                    '<span style="background:' + (trendBg[a.trend] || '#f0f0f0') + ';color:' + (trendColor[a.trend] || '#999') + ';font-size:12px;padding:2px 8px;border-radius:4px">' + (a.trend || '稳定') + '</span>' +
                    '<span style="font-size:12px;color:#888">考试次数</span>' +
                    '<span style="font-weight:600">' + a.exam_count + '次</span>' +
                    '<a href="javascript:;" onclick="viewAnalysis(' + a.id + ')" style="color:#e74c5c;font-size:13px">查看详情</a>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
        area.innerHTML = html;
    }).catch(function() {
        var area = $('recentAnalysesArea');
        if (area) area.innerHTML = '';
    });
}

function clearAnalyses() {
    if (!confirm('确定清空所有分析记录？')) return;
    api('DELETE', '/preference/analyses').then(function(res) {
        if (res.success) {
            alert('已清空');
            loadRecentAnalyses();
        }
    });
}

function viewAnalysis(id) {
    api('GET', '/preference/analyses/' + id).then(function(res) {
        if (!res.success || !res.data) return;
        var d = res.data;
        var area = $('prefResultArea');
        if (area) {
            var subjectNames = { 'physics': ['语文', '数学', '英语', '物理', '化学', '生物'], 'history': ['语文', '数学', '英语', '历史', '政治', '地理'], 'art': ['语文', '数学', '英语', '物理', '化学', '美术'] };
            var trendColor = { '稳定': '#ff9800', '上升': '#67C23A', '下滑': '#e74c5c' };
            var subjects = subjectNames[d.subject_type] || subjectNames['physics'];
            var subjectAdvice = {};
            subjects.forEach(function(subj) {
                var avg = d.subject_avg_scores ? d.subject_avg_scores[subj] : 0;
                var min = d.subject_min_scores ? d.subject_min_scores[subj] : 0;
                var max = d.subject_max_scores ? d.subject_max_scores[subj] : 0;
                if (!avg) return;
                var level = '待提升';
                var color = '#ff9800';
                var bg = '#fff3e0';
                var advice = subj + '有一定基础，建议加强专项练习';
                var fullScore = 150;
                if (subj === '物理' || subj === '化学' || subj === '生物' || subj === '历史' || subj === '政治' || subj === '地理') fullScore = 100;
                if (avg / fullScore >= 0.85) { level = '优势科目'; color = '#67C23A'; bg = '#e8f8e8'; advice = subj + '成绩优秀，保持优势并适当拓展'; }
                else if (avg / fullScore >= 0.7) { level = '稳定科目'; color = '#409EFF'; bg = '#e8f4fd'; advice = subj + '成绩稳定，可针对性突破薄弱知识点'; }
                else if (avg / fullScore >= 0.6) { level = '待提升'; color = '#ff9800'; bg = '#fff3e0'; }
                else { level = '薄弱科目'; color = '#e74c5c'; bg = '#fff0f0'; advice = subj + '基础较弱，建议重点加强基础训练'; }
                subjectAdvice[subj] = { avg: avg, min: min, max: max, level: level, color: color, bg: bg, advice: advice };
            });
            var html = '<div class="card"><div class="card-title">总体评价</div>' +
                '<div style="background:linear-gradient(135deg,#f5f3ff 0%,#fdf2f8 100%);border-radius:12px;padding:20px;margin-top:12px">' +
                    '<div style="display:flex;gap:32px;flex-wrap:wrap">' +
                        '<div><div style="color:#888;font-size:13px">平均分</div><div style="font-size:24px;font-weight:700;color:#1a1a2e">' + d.total_score + '</div></div>' +
                        '<div><div style="color:#888;font-size:13px">最高分</div><div style="font-size:24px;font-weight:700;color:#1a1a2e">' + (d.max_score || '-') + '</div></div>' +
                        '<div><div style="color:#888;font-size:13px">波动幅度</div><div style="font-size:24px;font-weight:700;color:#1a1a2e">' + (d.volatility || '-') + '</div></div>' +
                        '<div><div style="color:#888;font-size:13px">趋势</div><div style="font-size:24px;font-weight:700;color:' + (trendColor[d.trend] || '#999') + '">' + (d.trend || '稳定') + '</div></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
            html += '<div class="card" style="margin-top:16px"><div class="card-title">科目分析</div>' +
                '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-top:12px">';
            subjects.forEach(function(subj) {
                var sa = subjectAdvice[subj];
                if (!sa) return;
                html += '<div style="background:' + sa.bg + ';border-radius:8px;padding:16px">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center">' +
                        '<strong style="font-size:15px">' + subj + '</strong>' +
                        '<span style="font-size:12px;color:' + sa.color + ';background:' + sa.bg + ';border:1px solid ' + sa.color + ';border-radius:10px;padding:2px 8px">' + sa.level + '</span>' +
                    '</div>' +
                    '<div style="margin-top:8px;font-size:13px;color:#666">' +
                        '平均: ' + sa.avg + '  最高: ' + sa.max + '  最低: ' + sa.min +
                    '</div>' +
                    '<div style="margin-top:6px;font-size:12px;color:#888">' + sa.advice + '</div>' +
                '</div>';
            });
            html += '</div></div>';

            html += '<div class="card" style="margin-top:16px"><div class="card-title">院校推荐</div>' +
                '<div id="schoolTabs" style="display:flex;gap:0;border-bottom:2px solid #ebeef5;margin-top:12px">' +
                    '<div class="school-tab active" data-type="risk" onclick="switchSchoolTab(this)" style="padding:10px 20px;cursor:pointer;color:#e74c5c;border-bottom:2px solid #e74c5c;margin-bottom:-2px;font-weight:600">冲刺型</div>' +
                    '<div class="school-tab" data-type="match" onclick="switchSchoolTab(this)" style="padding:10px 20px;cursor:pointer;color:#888">稳妥型</div>' +
                    '<div class="school-tab" data-type="safe" onclick="switchSchoolTab(this)" style="padding:10px 20px;cursor:pointer;color:#888">保底型</div>' +
                '</div>' +
                '<div id="schoolListArea"></div>' +
            '</div>';

            html += '<div class="card" style="margin-top:16px"><div class="card-title">志愿填报建议</div>' +
                '<div id="suggestionArea"></div>' +
            '</div>';

            area.innerHTML = html;
            window._prefSchoolData = d.school_data || {};
            switchSchoolTab(document.querySelector('.school-tab.active'));
            renderSuggestions(d.school_data || {});
        }
    });
}

function renderProfile() {
    api('GET', '/profile').then(function(res) {
        var p = res.data || {};
        var rawSubject = p.subject_type || 'physics';
        var subjectType = rawSubject;
        if (rawSubject === 'physics') subjectType = '物化生';
        else if (rawSubject === 'history') subjectType = '史政地';
        else if (rawSubject === 'art') subjectType = '物化生';
        var isAdmin = (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
        var nameDisabled = isAdmin ? '' : ' disabled title="姓名已锁定，如需修改请联系管理员"';
        var phoneDisabled = isAdmin ? '' : ' disabled title="手机号已锁定，如需修改请联系管理员"';
        var subjectDisabled = isAdmin ? '' : ' disabled title="选科已锁定，如需修改请联系管理员"';
        var lockHint = isAdmin ? '' : '<p style="font-size:12px;color:#999;margin-top:8px">姓名、手机号、选科已锁定，如需修改请<a href="#" onclick="navigate(\'support\')" style="color:#409EFF;text-decoration:none">提交工单</a>获取技术支持</p>';
        h('<div class="page-title">个人信息</div>' +
            '<div class="page-desc">管理你的个人信息</div>' +
            '<div class="card"><div class="card-title">基本信息</div>' +
                '<div class="form-group"><label>姓名</label><input type="text" id="profileName" value="' + escapeAttr(p.name || '') + '"' + nameDisabled + ' /></div>' +
                '<div class="form-group"><label>邮箱</label><input type="text" value="' + escapeAttr(p.email || '') + '" disabled /></div>' +
                '<div class="form-group"><label>手机号</label><input type="text" id="profilePhone" value="' + escapeAttr(p.phone || '') + '"' + phoneDisabled + ' /></div>' +
                '<div class="form-group"><label>学校</label><input type="text" value="' + escapeAttr(p.school_name || '') + '" disabled /></div>' +
                '<div class="form-group"><label>年级</label><select id="profileGrade"><option value="高一"' + (p.grade === '高一' ? ' selected' : '') + '>高一</option><option value="高二"' + (p.grade === '高二' ? ' selected' : '') + '>高二</option><option value="高三"' + (p.grade === '高三' ? ' selected' : '') + '>高三</option></select></div>' +
                '<div class="form-group"><label>班级</label><select id="profileClass"><option value="">-- 请选择班级 --</option>' + (function(){ var opts=''; for(var i=1;i<=20;i++){ opts+='<option value="'+i+'班"'+((p.class_name||'')===i+'班'?' selected':'')+'>'+i+'班</option>'; } return opts; })() + '</select></div>' +
                '<div class="form-group"><label>选科类型</label><select id="profileSubject"' + subjectDisabled + '>' +
                    '<option value="物化生"' + (subjectType === '物化生' ? ' selected' : '') + '>物化生</option>' +
                    '<option value="物化地"' + (subjectType === '物化地' ? ' selected' : '') + '>物化地</option>' +
                    '<option value="物化政"' + (subjectType === '物化政' ? ' selected' : '') + '>物化政</option>' +
                    '<option value="物生地"' + (subjectType === '物生地' ? ' selected' : '') + '>物生地</option>' +
                    '<option value="物生政"' + (subjectType === '物生政' ? ' selected' : '') + '>物生政</option>' +
                    '<option value="物政地"' + (subjectType === '物政地' ? ' selected' : '') + '>物政地</option>' +
                    '<option value="史政地"' + (subjectType === '史政地' ? ' selected' : '') + '>史政地</option>' +
                    '<option value="史政生"' + (subjectType === '史政生' ? ' selected' : '') + '>史政生</option>' +
                    '<option value="史地生"' + (subjectType === '史地生' ? ' selected' : '') + '>史地生</option>' +
                '</select>' + lockHint + '</div>' +
                '<div class="form-group"><label>会员有效期</label><input type="text" value="' + escapeAttr(p.membership_expires_at || '-') + '" disabled /></div>' +
                '<div style="text-align:right;margin-top:16px"><button class="btn-primary" onclick="saveProfile()">保存</button></div>' +
            '</div>' +
            '<div class="card"><div class="card-title">修改密码</div>' +
                '<div class="form-group"><label>当前密码</label><input type="password" id="oldPassword" /></div>' +
                '<div class="form-group"><label>新密码</label><input type="password" id="newPassword" /></div>' +
                '<div style="text-align:right;margin-top:16px"><button class="btn-primary" onclick="changePassword()">修改密码</button></div>' +
            '</div>');
    }).catch(function(err) {
        h('<div class="page-title">个人信息</div>' +
            '<div class="card"><div class="empty-state">加载失败，请刷新重试</div></div>');
    });
}

function htmlEscape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function changePassword() {
    var oldPwd = $('oldPassword').value;
    var newPwd = $('newPassword').value;
    if (!oldPwd) { alert('请输入当前密码'); return; }
    if (!newPwd) { alert('请输入新密码'); return; }
    if (newPwd.length < 6) { alert('新密码长度不能少于6位'); return; }
    api('POST', '/me/change-password', { oldPassword: oldPwd, newPassword: newPwd }).then(function(res) {
        if (res.success) {
            alert('密码修改成功');
            renderProfile();
        } else {
            alert('修改失败: ' + (res.message || '未知错误'));
        }
    }).catch(function(err) {
        alert('网络错误，请重试');
    });
}

function saveProfile() {
    var data = {
        name: $('profileName').value,
        phone: $('profilePhone').value,
        grade: $('profileGrade').value,
        className: $('profileClass').value,
        subjectType: $('profileSubject').value
    };
    api('PUT', '/profile', data).then(function(res) {
        if (res.success) {
            user.subject_type = data.subjectType;
            alert('个人信息已更新，选科变更为"' + data.subjectType + '"，成绩相关页面将按新科目显示');
            renderMenu();
        } else {
            alert('更新失败: ' + (res.message || '未知错误'));
        }
    });
}

function renderSupport() {
    api('GET', '/captcha').then(function(res) {
        var captchaId = res.data.captchaId || '';
        var captchaImg = res.data.captchaImg || '';
        h('<div class="page-title">技术支持</div>' +
            '<div class="page-desc">提交工单获取技术支持</div>' +
            '<div class="card"><div class="card-title">提交新工单</div>' +
                '<div class="form-group"><label>工单类型</label><select id="ticketType"><option value="账号问题">账号问题</option><option value="考试成绩问题">考试成绩问题</option><option value="其他问题">其他问题</option></select></div>' +
                '<div class="form-group"><label>问题描述</label><textarea id="ticketContent" rows="4" placeholder="请详细描述您遇到的问题" style="resize:vertical"></textarea></div>' +
                '<div class="form-group"><label>验证码</label><div style="display:flex;gap:12px;align-items:center"><img id="captchaImg" src="' + captchaImg + '" style="height:40px;cursor:pointer;border:1px solid var(--border);border-radius:8px" onclick="refreshCaptcha()" /><input type="text" id="ticketCaptcha" placeholder="请输入验证码" style="flex:1" /></div></div>' +
                '<input type="hidden" id="ticketCaptchaId" value="' + captchaId + '" />' +
                '<div style="text-align:right;margin-top:16px"><button class="btn-primary" onclick="submitTicket()">提交工单</button></div>' +
            '</div>' +
            '<div class="card" style="margin-top:16px"><div class="card-title">我的工单</div><div id="myTicketsArea">加载中...</div></div>');
        loadMyTickets();
    });
}

function refreshCaptcha() {
    api('GET', '/captcha').then(function(res) {
        var img = $('captchaImg');
        var idField = $('ticketCaptchaId');
        if (img) img.src = res.data.captchaImg || '';
        if (idField) idField.value = res.data.captchaId || '';
    });
}

function submitTicket() {
    var type = $('ticketType').value;
    var content = $('ticketContent').value.trim();
    var captcha = $('ticketCaptcha').value.trim();
    var captchaId = $('ticketCaptchaId').value;
    if (!content) { alert('请输入问题描述'); return; }
    if (!captcha) { alert('请输入验证码'); return; }
    api('POST', '/tickets', { title: type, content: content, captcha: captcha, captchaId: captchaId }).then(function(res) {
        if (res.success) {
            alert('工单已提交');
            renderSupport();
        } else {
            alert('提交失败: ' + (res.message || '未知错误'));
        }
    });
}

function loadMyTickets() {
    api('GET', '/tickets').then(function(res) {
        var tickets = res.data.data || [];
        var rows = tickets.map(function(t) {
            var statusText = { 'pending': '待处理', 'processing': '处理中', 'resolved': '已解决', 'closed': '已关闭' };
            var statusColor = { 'pending': '#e74c5c', 'processing': '#ff9800', 'resolved': '#4caf50', 'closed': '#999' };
            var status = t.status || 'pending';
            return '<tr><td>' + htmlEscape(t.title) + '</td><td><span style="color:' + (statusColor[status] || '#999') + '">' + (statusText[status] || status) + '</span></td><td>' + (t.created_at || '-') + '</td><td><a href="#" onclick="viewTicket(' + t.id + ')" style="color:#409EFF">查看</a></td></tr>';
        }).join('');
        var area = $('myTicketsArea');
        if (area) {
            area.innerHTML = '<table class="data-table"><thead><tr><th>标题</th><th>状态</th><th>时间</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" style="text-align:center;color:#888">暂无工单</td></tr>') + '</tbody></table>';
        }
    });
}

function viewTicket(id) {
    api('GET', '/tickets/' + id).then(function(res) {
        var t = res.data.data || {};
        var statusText = { 'pending': '待处理', 'processing': '处理中', 'resolved': '已解决', 'closed': '已关闭' };
        h('<div class="page-title">工单详情</div>' +
            '<div class="card"><div class="card-title">' + htmlEscape(t.title) + '</div>' +
                '<div style="margin-bottom:12px"><span style="color:#888">状态：</span><span>' + (statusText[t.status] || htmlEscape(t.status)) + '</span></div>' +
                '<div style="margin-bottom:12px"><span style="color:#888">提交时间：</span><span>' + (t.created_at || '-') + '</span></div>' +
                '<div style="margin-bottom:12px;padding:12px;background:#f5f5f5;border-radius:4px;white-space:pre-wrap">' + htmlEscape(t.content) + '</div>' +
                (t.admin_reply ? '<div style="margin-bottom:12px;padding:12px;background:#fff0f0;border-radius:4px"><strong>管理员回复：</strong><br>' + htmlEscape(t.admin_reply) + '</div>' : '') +
                '<div style="text-align:right"><button class="btn-primary" onclick="renderSupport()">返回</button></div>' +
            '</div>');
    });
}

function renderAdmin() {
    var tabs = [
        { id: 'visitors', label: '访问统计' },
        { id: 'users', label: '用户管理' },
        { id: 'universities', label: '大学数据' },
        { id: 'tickets', label: '工单管理' },
        { id: 'changelog', label: '更新记录' },
        { id: 'settings', label: '系统设置' },
        { id: 'logs', label: '操作日志' },
        { id: 'backup', label: '备份管理' },
    ];
    var tabHtml = tabs.map(function(t) {
        return '<div class="tab' + (adminTab === t.id ? ' active' : '') + '" onclick="adminTab=\'' + t.id + '\';renderAdmin()">' + t.label + '</div>';
    }).join('');
    h('<div class="page-title">数据管理</div>' +
        '<div class="page-desc">管理员功能</div>' +
        '<div class="card"><div class="tab-bar">' + tabHtml + '</div></div>' +
        '<div id="adminContent"></div>');
    if (adminTab === 'visitors') loadAdminVisitors();
    else if (adminTab === 'users') loadAdminUsers();
    else if (adminTab === 'universities') loadAdminUniversities();
    else if (adminTab === 'tickets') loadAdminTickets();
    else if (adminTab === 'changelog') loadAdminChangelog();
    else if (adminTab === 'settings') loadAdminSettings();
    else if (adminTab === 'logs') loadAdminLogs();
    else if (adminTab === 'backup') loadAdminBackup();
    else if (adminTab === 'visitors') loadAdminVisitors();
}

function loadAdminVisitors() {
    var area = $('adminContent');
    if (!area) return;

    Promise.all([
        api('GET', '/visitor?stats=1'),
        api('GET', '/visitor?trend=1&days=7'),
        api('GET', '/visitor?sources=1'),
        api('GET', '/visitor?pages=1'),
        api('GET', '/visitor?geo=1'),
        api('GET', '/visitor?keywords=1')
    ]).then(function(results) {
        var stats = results[0].data.data || {};
        var trend = results[1].data.data.trend || [];
        var sources = results[2].data.data.sources || [];
        var pages = results[3].data.data.pages || [];
        var geo = results[4].data.data.geo || [];
        var keywords = results[5].data.data.keywords || [];

        var growthIcon = stats.growth_rate >= 0 ? '↑' : '↓';

        area.innerHTML = '<div class="card"><div class="card-title">访问统计概览</div>' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:24px">' +
                '<div style="background:#f0f5ff;border-radius:8px;padding:16px;text-align:center">' +
                    '<div style="font-size:28px;font-weight:700;color:#409EFF">' + stats.today_visitors + '</div>' +
                    '<div style="font-size:13px;color:#909399;margin-top:4px">今日访客</div>' +
                    '<div style="font-size:12px;color:' + (stats.growth_rate >= 0 ? '#67C23A' : '#F56C6C') + '">' + growthIcon + ' ' + Math.abs(stats.growth_rate) + '% 较昨日</div>' +
                '</div>' +
                '<div style="background:#f5f7fa;border-radius:8px;padding:16px;text-align:center">' +
                    '<div style="font-size:28px;font-weight:700;color:#606266">' + stats.week_visitors + '</div>' +
                    '<div style="font-size:13px;color:#909399;margin-top:4px">本周访客</div>' +
                '</div>' +
                '<div style="background:#f5f7fa;border-radius:8px;padding:16px;text-align:center">' +
                    '<div style="font-size:28px;font-weight:700;color:#606266">' + stats.month_visitors + '</div>' +
                    '<div style="font-size:13px;color:#909399;margin-top:4px">本月访客</div>' +
                '</div>' +
                '<div style="background:#f5f7fa;border-radius:8px;padding:16px;text-align:center">' +
                    '<div style="font-size:28px;font-weight:700;color:#606266">' + stats.avg_duration + 's</div>' +
                    '<div style="font-size:13px;color:#909399;margin-top:4px">平均停留时长</div>' +
                '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">' +
                '<div><h4 style="margin-bottom:12px;color:#303133">访问量趋势（近7天）</h4>' + renderTrendChart(trend) + '</div>' +
                '<div><h4 style="margin-bottom:12px;color:#303133">来源渠道占比</h4>' + renderSourcesChart(sources) + '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">' +
                '<div><h4 style="margin-bottom:12px;color:#303133">热门页面</h4>' + renderPagesList(pages) + '</div>' +
                '<div><h4 style="margin-bottom:12px;color:#303133">地域分布</h4>' + renderGeoList(geo) + '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' +
                '<div><h4 style="margin-bottom:12px;color:#303133">搜索关键词</h4>' + renderKeywordsList(keywords) + '</div>' +
                '<div><h4 style="margin-bottom:12px;color:#303133">快速操作</h4>' +
                    '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
                        '<button class="btn-primary" style="padding:8px 20px;font-size:13px" onclick="showVisitorLogs()">查看访问明细</button>' +
                        '<button class="btn-primary" style="padding:8px 20px;font-size:13px;background:#E6A23C;border-color:#E6A23C" onclick="showVisitorBlacklist()">IP黑名单管理</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '</div>';
    }).catch(function(err) {
        area.innerHTML = '<div class="card"><div class="card-title">访问统计概览</div><div class="empty-state">加载失败，请刷新重试</div></div>';
    });
}

function renderTrendChart(trend) {
    if (!trend.length) return '<div style="color:#909399;text-align:center;padding:20px">暂无数据</div>';
    var maxVal = Math.max.apply(null, trend.map(function(t) { return t.visitors; }));
    if (maxVal === 0) maxVal = 1;
    var rows = trend.map(function(t) {
        var pct = (t.visitors / maxVal * 100);
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
            '<span style="width:80px;font-size:12px;color:#909399">' + t.date + '</span>' +
            '<div style="flex:1;background:#f0f0f0;border-radius:4px;height:20px;overflow:hidden">' +
                '<div style="width:' + pct + '%;height:100%;background:#409EFF;border-radius:4px;transition:width .3s"></div>' +
            '</div>' +
            '<span style="width:30px;font-size:12px;color:#606266;text-align:right">' + t.visitors + '</span>' +
            '</div>';
    }).join('');
    return rows;
}

function renderSourcesChart(sources) {
    if (!sources.length) return '<div style="color:#909399;text-align:center;padding:20px">暂无数据</div>';
    var total = sources.reduce(function(s, item) { return s + item.visitors; }, 0);
    if (total === 0) total = 1;
    var colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C'];
    var rows = sources.map(function(s, i) {
        var pct = (s.visitors / total * 100);
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
            '<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:' + (colors[i % colors.length]) + '"></span>' +
            '<span style="width:60px;font-size:12px;color:#606266">' + s.source + '</span>' +
            '<div style="flex:1;background:#f0f0f0;border-radius:4px;height:16px;overflow:hidden">' +
                '<div style="width:' + pct + '%;height:100%;background:' + (colors[i % colors.length]) + ';border-radius:4px"></div>' +
            '</div>' +
            '<span style="width:40px;font-size:12px;color:#909399">' + pct.toFixed(1) + '%</span>' +
            '</div>';
    }).join('');
    return rows;
}

function renderPagesList(pages) {
    if (!pages.length) return '<div style="color:#909399;text-align:center;padding:20px">暂无数据</div>';
    return pages.map(function(p) {
        return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0">' +
            '<span style="font-size:13px;color:#303133">' + htmlEscape(p.page_url) + '</span>' +
            '<span style="font-size:13px;color:#409EFF;font-weight:600">' + p.visitors + '</span>' +
            '</div>';
    }).join('');
}

function renderGeoList(geo) {
    if (!geo.length) return '<div style="color:#909399;text-align:center;padding:20px">暂无数据</div>';
    return geo.map(function(g) {
        return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0">' +
            '<span style="font-size:13px;color:#303133">' + htmlEscape(g.province) + '</span>' +
            '<span style="font-size:13px;color:#409EFF;font-weight:600">' + g.visitors + '</span>' +
            '</div>';
    }).join('');
}

function renderKeywordsList(keywords) {
    if (!keywords.length) return '<div style="color:#909399;text-align:center;padding:20px">暂无数据</div>';
    return keywords.map(function(k) {
        return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0">' +
            '<span style="font-size:13px;color:#303133">' + htmlEscape(k.search_keyword) + '</span>' +
            '<span style="font-size:13px;color:#E6A23C;font-weight:600">' + k.count + '</span>' +
            '</div>';
    }).join('');
}

function showVisitorLogs() {
    visitorLogsPage = 1;
    loadVisitorLogs();
}

function loadVisitorLogs() {
    api('GET', '/visitor?logs=1&page=' + visitorLogsPage + '&limit=20').then(function(res) {
        var data = res.data.data || {};
        var logs = data.list || [];
        var total = data.total || 0;
        var pages = data.pages || 1;

        var rows = logs.map(function(l) {
            var duration = l.duration_seconds ? l.duration_seconds + 's' : '-';
            return '<tr>' +
                '<td style="font-size:12px">' + l.visitor_uuid.substring(0, 8) + '</td>' +
                '<td style="font-size:12px">' + l.ip_address + '</td>' +
                '<td style="font-size:12px">' + (l.province || '-') + ' ' + (l.city || '') + '</td>' +
                '<td style="font-size:12px">' + (l.device_type || '-') + '</td>' +
                '<td style="font-size:12px">' + (l.browser_name || '-') + '</td>' +
                '<td style="font-size:12px">' + (l.page_url || '-') + '</td>' +
                '<td style="font-size:12px">' + duration + '</td>' +
                '<td style="font-size:12px">' + l.visit_start_time + '</td>' +
                '<td style="font-size:12px"><a href="#" onclick="addToBlacklist(\'' + l.ip_address + '\')" style="color:#F56C6C">拉黑</a></td>' +
                '</tr>';
        }).join('');

        var area = $('adminContent');
        area.innerHTML = '<div class="card"><div class="card-title">访问明细 <a href="#" onclick="renderAdmin();adminTab=\'visitors\';renderAdmin();" style="float:right;font-size:13px;color:#409EFF">返回统计</a></div>' +
            '<div class="table-wrapper"><table class="data-table"><thead><tr>' +
                '<th>访客ID</th><th>IP地址</th><th>地理位置</th><th>设备</th><th>浏览器</th><th>访问页面</th><th>停留时长</th><th>访问时间</th><th>操作</th>' +
                '</tr></thead><tbody>' + (rows || '<tr><td colspan="9" style="text-align:center;color:#888">暂无记录</td></tr>') + '</tbody></table></div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">' +
                '<span style="font-size:13px;color:#909399">共 ' + total + ' 条记录</span>' +
                '<div style="display:flex;gap:8px">' +
                    '<button class="btn-primary" style="padding:4px 12px;font-size:12px" onclick="visitorLogsPage=Math.max(1,' + (visitorLogsPage - 1) + ');loadVisitorLogs()" ' + (visitorLogsPage <= 1 ? 'disabled' : '') + '>上一页</button>' +
                    '<span style="font-size:13px;padding:4px 8px">' + visitorLogsPage + ' / ' + pages + '</span>' +
                    '<button class="btn-primary" style="padding:4px 12px;font-size:12px" onclick="visitorLogsPage=Math.min(' + pages + ',' + (visitorLogsPage + 1) + ');loadVisitorLogs()" ' + (visitorLogsPage >= pages ? 'disabled' : '') + '>下一页</button>' +
                '</div>' +
            '</div></div>';
    });
}

function showVisitorBlacklist() {
    loadVisitorBlacklist();
}

function loadVisitorBlacklist() {
    api('GET', '/visitor?blacklist=1').then(function(res) {
        var list = res.data.data.list || [];
        var rows = list.map(function(item) {
            return '<tr>' +
                '<td style="font-size:13px">' + item.ip_address + '</td>' +
                '<td style="font-size:13px">' + htmlEscape(item.reason || '-') + '</td>' +
                '<td style="font-size:13px">' + item.created_at + '</td>' +
                '<td style="font-size:13px"><a href="#" onclick="removeFromBlacklist(' + item.id + ')" style="color:#409EFF">移除</a></td>' +
                '</tr>';
        }).join('');

        var area = $('adminContent');
        area.innerHTML = '<div class="card"><div class="card-title">IP黑名单管理 <a href="#" onclick="renderAdmin();adminTab=\'visitors\';renderAdmin();" style="float:right;font-size:13px;color:#409EFF">返回统计</a></div>' +
            '<div style="margin-bottom:16px;display:flex;gap:12px">' +
                '<input type="text" id="blacklistIP" placeholder="输入IP地址" style="padding:8px 12px;border:1px solid #dcdfe6;border-radius:6px;flex:1" />' +
                '<input type="text" id="blacklistReason" placeholder="拉黑原因（可选）" style="padding:8px 12px;border:1px solid #dcdfe6;border-radius:6px;flex:1" />' +
                '<button class="btn-primary" onclick="addBlacklistItem()">添加黑名单</button>' +
            '</div>' +
            '<div class="table-wrapper"><table class="data-table"><thead><tr>' +
                '<th>IP地址</th><th>拉黑原因</th><th>添加时间</th><th>操作</th>' +
                '</tr></thead><tbody>' + (rows || '<tr><td colspan="4" style="text-align:center;color:#888">暂无黑名单IP</td></tr>') + '</tbody></table></div>' +
            '</div>';
    });
}

function addBlacklistItem() {
    var ip = $('blacklistIP').value.trim();
    var reason = $('blacklistReason').value.trim();
    if (!ip) { alert('请输入IP地址'); return; }
    api('POST', '/visitor', { addBlacklist: true, ip: ip, reason: reason }).then(function(res) {
        if (res.data.success) {
            alert('已添加');
            loadVisitorBlacklist();
        } else {
            alert('添加失败: ' + (res.data.message || '未知错误'));
        }
    });
}

function removeFromBlacklist(id) {
    if (!confirm('确定要移除该IP吗？')) return;
    api('POST', '/visitor', { removeBlacklist: true, id: id }).then(function(res) {
        if (res.data.success) {
            alert('已移除');
            loadVisitorBlacklist();
        } else {
            alert('移除失败: ' + (res.data.message || '未知错误'));
        }
    });
}

function addToBlacklist(ip) {
    if (!confirm('确定要将 ' + ip + ' 加入黑名单吗？')) return;
    api('POST', '/visitor', { addBlacklist: true, ip: ip, reason: '手动拉黑' }).then(function(res) {
        if (res.data.success) {
            alert('已加入黑名单');
        } else {
            alert('添加失败: ' + (res.data.message || '未知错误'));
        }
    });
}

function loadAdminUsers() {
    api('GET', '/admin/users').then(function(res) {
        var users = res.data.list || [];
        var rows = users.map(function(u) {
            var roleText = { 'SUPER_ADMIN': '超级管理员', 'ADMIN': '管理员', 'PRO': '专业版', 'STUDENT': '学生', 'USER': '学生' };
            return '<tr><td>' + u.id + '</td><td>' + htmlEscape(u.name) + '</td><td>' + htmlEscape(u.email) + '</td><td>' + (roleText[u.role] || htmlEscape(u.role)) + '</td><td>' + htmlEscape(u.class_name) + '</td><td>' + (u.created_at || '-') + '</td><td><a href="#" onclick="editAdminUser(' + u.id + ')" style="color:#409EFF">编辑</a></td></tr>';
        }).join('');
        var area = $('adminContent');
        if (area) {
            area.innerHTML = '<div class="card"><div class="card-title">用户列表</div>' +
                '<table class="data-table"><thead><tr><th>ID</th><th>姓名</th><th>邮箱</th><th>角色</th><th>班级</th><th>注册时间</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" style="text-align:center;color:#888">暂无数据</td></tr>') + '</tbody></table>' +
                '</div>';
        }
    });
}

function editAdminUser(userId) {
    api('GET', '/admin/users').then(function(res) {
        var users = res.data.list || [];
        var u = users.find(function(x) { return x.id == userId; });
        if (!u) { alert('用户不存在'); return; }
        var roleText = { 'SUPER_ADMIN': '超级管理员', 'ADMIN': '管理员', 'PRO': '专业版', 'STUDENT': '学生', 'USER': '学生' };
        h('<div class="page-title">编辑用户 #' + u.id + '</div>' +
            '<div class="card"><div class="card-title">用户信息</div>' +
                '<div class="form-group"><label>姓名</label><input type="text" id="editUserName" value="' + escapeAttr(u.name || '') + '" /></div>' +
                '<div class="form-group"><label>邮箱</label><input type="text" value="' + escapeAttr(u.email || '') + '" disabled /></div>' +
                '<div class="form-group"><label>角色</label><select id="editUserRole">' +
                    '<option value="USER"' + (u.role === 'USER' ? ' selected' : '') + '>学生</option>' +
                    '<option value="PRO"' + (u.role === 'PRO' ? ' selected' : '') + '>专业版</option>' +
                    '<option value="ADMIN"' + (u.role === 'ADMIN' ? ' selected' : '') + '>管理员</option>' +
                    '<option value="SUPER_ADMIN"' + (u.role === 'SUPER_ADMIN' ? ' selected' : '') + '>超级管理员</option>' +
                '</select></div>' +
                '<div class="form-group"><label>班级</label><input type="text" id="editUserClass" value="' + escapeAttr(u.class_name || '') + '" /></div>' +
                '<div class="form-group"><label>手机号</label><input type="text" id="editUserPhone" value="' + escapeAttr(u.phone || '') + '" /></div>' +
                '<div class="form-group"><label>会员有效期</label><input type="text" id="editUserExpiry" value="' + escapeAttr(u.membership_expires_at || '') + '" /></div>' +
                '<div style="text-align:right;margin-top:16px"><button class="btn-primary" onclick="saveAdminUser(' + u.id + ')">保存</button></div>' +
            '</div>');
    });
}

function saveAdminUser(userId) {
    var data = {
        name: $('editUserName').value,
        role: $('editUserRole').value,
        className: $('editUserClass').value,
        phone: $('editUserPhone').value,
        membership_expires_at: $('editUserExpiry').value
    };
    api('PUT', '/admin/users/' + userId, data).then(function(res) {
        if (res.success) {
            alert('用户信息已更新');
            adminTab = 'users';
            renderAdmin();
        } else {
            alert('更新失败: ' + (res.message || '未知错误'));
        }
    });
}

function loadAdminUniversities() {
    api('GET', '/admin/universities').then(function(res) {
        var unis = res.data.list || [];
        var rows = unis.map(function(u) {
            return '<tr><td>' + htmlEscape(u.name) + '</td><td>' + htmlEscape(u.province) + '</td><td>' + htmlEscape(u.university_level) + '</td><td>' + htmlEscape(u.subject_type) + '</td><td>' + (u.admission_score || '-') + '</td><td>' + (u.admission_rank || '-') + '</td></tr>';
        }).join('');
        var area = $('adminContent');
        if (area) {
            area.innerHTML = '<div class="card"><div class="card-title">大学数据</div>' +
                '<table class="data-table"><thead><tr><th>名称</th><th>省份</th><th>层次</th><th>科类</th><th>分数线</th><th>位次</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" style="text-align:center;color:#888">暂无数据</td></tr>') + '</tbody></table>' +
                '</div>';
        }
    });
}

function loadAdminTickets() {
    api('GET', '/admin/tickets').then(function(res) {
        var tickets = res.data.data || [];
        var rows = tickets.map(function(t) {
            var statusText = { 'pending': '待处理', 'processing': '处理中', 'resolved': '已解决', 'closed': '已关闭' };
            var statusColor = { 'pending': '#e74c5c', 'processing': '#ff9800', 'resolved': '#4caf50', 'closed': '#999' };
            var status = t.status || 'pending';
            return '<tr><td>' + htmlEscape(t.user_name) + '</td><td>' + htmlEscape(t.title) + '</td><td><span style="color:' + (statusColor[status] || '#999') + '">' + (statusText[status] || status) + '</span></td><td>' + (t.created_at || '-') + '</td><td><a href="#" onclick="replyTicket(' + t.id + ')" style="color:#409EFF">回复</a></td></tr>';
        }).join('');
        var area = $('adminContent');
        if (area) {
            area.innerHTML = '<div class="card"><div class="card-title">工单管理</div>' +
                '<table class="data-table"><thead><tr><th>用户</th><th>标题</th><th>状态</th><th>时间</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" style="text-align:center;color:#888">暂无工单</td></tr>') + '</tbody></table>' +
                '</div>';
        }
    });
}

function replyTicket(id) {
    api('GET', '/admin/tickets/' + id).then(function(res) {
        var t = res.data.data || {};
        h('<div class="page-title">回复工单 #' + t.id + '</div>' +
            '<div class="card"><div class="card-title">工单详情</div>' +
                '<div style="margin-bottom:12px"><span style="color:#888">用户：</span>' + htmlEscape(t.user_name) + '</div>' +
                '<div style="margin-bottom:12px"><span style="color:#888">标题：</span>' + htmlEscape(t.title) + '</div>' +
                '<div style="margin-bottom:12px;padding:12px;background:#f5f5f5;border-radius:4px;white-space:pre-wrap">' + htmlEscape(t.content) + '</div>' +
                (t.admin_reply ? '<div style="margin-bottom:12px;padding:12px;background:#fff0f0;border-radius:4px"><strong>已有回复：</strong><br>' + htmlEscape(t.admin_reply) + '</div>' : '') +
                '<div class="form-group"><label>回复内容</label><textarea id="ticketReply" rows="4" style="resize:vertical"></textarea></div>' +
                '<div style="text-align:right;margin-top:16px"><button class="btn-primary" onclick="submitTicketReply(' + t.id + ')">提交回复</button></div>' +
            '</div>');
    });
}

function submitTicketReply(id) {
    var reply = $('ticketReply').value.trim();
    if (!reply) { alert('请输入回复内容'); return; }
    api('POST', '/admin/tickets/' + id + '/reply', { reply: reply }).then(function(res) {
        if (res.success) {
            alert('回复已发送');
            loadAdminTickets();
        } else {
            alert('回复失败: ' + (res.message || '未知错误'));
        }
    });
}

function loadAdminChangelog() {
    api('GET', '/admin/changelog').then(function(res) {
        var logs = res.data.data || [];
        var rows = logs.map(function(l) {
            var contentHtml = htmlEscape(l.content).replace(/\n/g, '<br>');
            return '<tr><td style="width:80px">' + htmlEscape(l.version) + '</td><td style="width:150px">' + htmlEscape(l.title) + '</td><td style="white-space:pre-wrap">' + contentHtml + '</td><td style="width:160px">' + l.created_at + '</td></tr>';
        }).join('');
        var area = $('adminContent');
        if (area) {
            area.innerHTML = '<div class="card"><div class="card-title">更新记录</div>' +
                '<table class="data-table"><thead><tr><th style="width:80px">版本号</th><th style="width:150px">标题</th><th>更新内容</th><th style="width:160px">创建时间</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" style="text-align:center;color:#888">暂无记录</td></tr>') + '</tbody></table>' +
                '</div>';
        }
    });
}

function loadAdminSettings() {
    if (!isSuperAdmin) { alert('仅超级管理员可访问'); return; }
    api('GET', '/admin/settings').then(function(res) {
        var settings = res.data || {};
        var area = $('adminContent');
        if (area) {
            area.innerHTML = '<div class="card"><div class="card-title">系统设置</div>' +
                '<div class="form-row">' +
                    '<div><label>网站名称</label><input type="text" id="setting_site_name" value="' + (settings.site_name || '') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                    '<div><label>每页显示条数</label><input type="number" id="setting_items_per_page" value="' + (settings.items_per_page || '20') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div><label>默认年级</label><select id="setting_default_grade" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px">' +
                        '<option value="高一"' + (settings.default_grade === '高一' ? ' selected' : '') + '>高一</option>' +
                        '<option value="高二"' + (settings.default_grade === '高二' ? ' selected' : '') + '>高二</option>' +
                        '<option value="高三"' + (settings.default_grade === '高三' ? ' selected' : '') + '>高三</option>' +
                    '</select></div>' +
                    '<div><label>维护模式</label><select id="setting_maintenance_mode" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px">' +
                        '<option value="0"' + (settings.maintenance_mode === '0' ? ' selected' : '') + '>关闭</option>' +
                        '<option value="1"' + (settings.maintenance_mode === '1' ? ' selected' : '') + '>开启</option>' +
                    '</select></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div><label>允许注册</label><select id="setting_allow_register" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px">' +
                        '<option value="1"' + (settings.allow_register === '1' ? ' selected' : '') + '>开启</option>' +
                        '<option value="0"' + (settings.allow_register === '0' ? ' selected' : '') + '>关闭</option>' +
                    '</select></div>' +
                    '<div><label>邮箱验证必选</label><select id="setting_email_verify" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px">' +
                        '<option value="1"' + (settings.email_verify_required === '1' ? ' selected' : '') + '>开启</option>' +
                        '<option value="0"' + (settings.email_verify_required === '0' ? ' selected' : '') + '>关闭</option>' +
                    '</select></div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div><label>会员默认有效期</label><input type="text" id="setting_membership_expires" value="' + (settings.membership_default_expires || '') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                    '<div><label>数据年份</label><input type="text" id="setting_data_year" value="' + (settings.data_year || '2025') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                '</div>' +
                '<div class="form-group" style="margin-top:12px"><label>站点公告</label><textarea id="setting_site_notice" rows="2" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px;resize:vertical">' + (settings.site_notice || '') + '</textarea></div>' +
                '<div class="form-row">' +
                    '<div><label>语文满分</label><input type="number" id="setting_full_chinese" value="' + (settings.exam_full_score_chinese || '150') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                    '<div><label>数学满分</label><input type="number" id="setting_full_math" value="' + (settings.exam_full_score_math || '150') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                    '<div><label>英语满分</label><input type="number" id="setting_full_english" value="' + (settings.exam_full_score_english || '150') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                    '<div><label>其他科目满分</label><input type="number" id="setting_full_default" value="' + (settings.exam_full_score_default || '100') + '" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-top:4px" /></div>' +
                '</div>' +
                '<div style="margin-top:16px"><button class="btn-primary" onclick="saveSettings()">保存设置</button></div>' +
                '</div>';
        }
    });
}

function saveSettings() {
    var settings = {
        site_name: $('setting_site_name').value,
        items_per_page: $('setting_items_per_page').value,
        default_grade: $('setting_default_grade').value,
        maintenance_mode: $('setting_maintenance_mode').value,
        allow_register: $('setting_allow_register').value,
        email_verify_required: $('setting_email_verify').value,
        membership_default_expires: $('setting_membership_expires').value,
        data_year: $('setting_data_year').value,
        site_notice: $('setting_site_notice').value,
        exam_full_score_chinese: $('setting_full_chinese').value,
        exam_full_score_math: $('setting_full_math').value,
        exam_full_score_english: $('setting_full_english').value,
        exam_full_score_default: $('setting_full_default').value
    };
    api('POST', '/admin/settings', settings).then(function(res) {
        if (res.success) {
            alert('设置已保存');
        } else {
            alert('保存失败: ' + (res.message || '未知错误'));
        }
    });
}

function loadAdminLogs() {
    api('GET', '/admin/logs').then(function(res) {
        var logs = res.data.list || [];
        var rows = logs.map(function(l) {
            return '<tr><td>' + (l.user_name || '-') + '</td><td>' + (l.action || '-') + '</td><td>' + (l.description || '-') + '</td><td>' + (l.ip || '-') + '</td><td>' + (l.created_at || '-') + '</td></tr>';
        }).join('');
        var area = $('adminContent');
        if (area) {
            area.innerHTML = '<div class="card"><div class="card-title">操作日志</div>' +
                '<table class="data-table"><thead><tr><th>用户</th><th>操作</th><th>描述</th><th>IP</th><th>时间</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" style="text-align:center;color:#888">暂无日志</td></tr>') + '</tbody></table>' +
                '</div>';
        }
    });
}

function loadAdminBackup() {
    api('GET', '/admin/backup').then(function(res) {
        var backups = res.data.list || [];
        var rows = backups.map(function(b) {
            return '<tr><td>' + b.filename + '</td><td>' + (b.size || '-') + '</td><td>' + (b.created_at || '-') + '</td><td><a href="/api/admin/backups/' + encodeURIComponent(b.filename) + '/download" style="color:#409EFF">下载</a></td></tr>';
        }).join('');
        var area = $('adminContent');
        if (area) {
            area.innerHTML = '<div class="card"><div class="card-title">备份管理</div>' +
                '<div style="margin-bottom:16px"><button class="btn-primary" onclick="createBackup()">创建备份</button></div>' +
                '<table class="data-table"><thead><tr><th>文件名</th><th>大小</th><th>创建时间</th><th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4" style="text-align:center;color:#888">暂无备份</td></tr>') + '</tbody></table>' +
                '</div>';
        }
    });
}

function createBackup() {
    api('POST', '/admin/backup').then(function(res) {
        if (res.success) {
            alert('备份已创建');
            loadAdminBackup();
        } else {
            alert('备份失败: ' + (res.message || '未知错误'));
        }
    });
}
