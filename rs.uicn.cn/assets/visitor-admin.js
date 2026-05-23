var adminTab = 'visitors';
var visitorLogsPage = 1;

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
        area.innerHTML = '<div class="card"><div class="card-title">访问明细 <a href="#" onclick="loadAdminVisitors()" style="float:right;font-size:13px;color:#409EFF">返回统计</a></div>' +
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
        area.innerHTML = '<div class="card"><div class="card-title">IP黑名单管理 <a href="#" onclick="loadAdminVisitors()" style="float:right;font-size:13px;color:#409EFF">返回统计</a></div>' +
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
