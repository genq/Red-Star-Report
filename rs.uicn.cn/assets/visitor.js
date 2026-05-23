(function() {
    var UUID_KEY = 'visitor_uuid';
    var HEARTBEAT_INTERVAL = 30000;
    var heartbeatTimer = null;

    function getUUID() {
        var uuid = localStorage.getItem(UUID_KEY);
        if (!uuid) {
            uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0;
                var v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem(UUID_KEY, uuid);
        }
        return uuid;
    }

    function parseSearchQuery(referer) {
        var searchInfo = { engine: '', keyword: '' };
        if (!referer) return searchInfo;
        try {
            var url = new URL(referer);
            var host = url.hostname;
            var params = new URLSearchParams(url.search);
            if (host.indexOf('baidu.com') !== -1) { searchInfo.engine = '百度'; searchInfo.keyword = params.get('wd') || ''; }
            else if (host.indexOf('sogou.com') !== -1) { searchInfo.engine = '搜狗'; searchInfo.keyword = params.get('query') || ''; }
            else if (host.indexOf('so.com') !== -1 || host.indexOf('360.cn') !== -1) { searchInfo.engine = '360'; searchInfo.keyword = params.get('q') || ''; }
            else if (host.indexOf('google.com') !== -1) { searchInfo.engine = '谷歌'; searchInfo.keyword = params.get('q') || ''; }
            else if (host.indexOf('bing.com') !== -1) { searchInfo.engine = '必应'; searchInfo.keyword = params.get('q') || ''; }
        } catch(e) {}
        return searchInfo;
    }

    function detectDevice() {
        var ua = navigator.userAgent;
        if (/iPad/i.test(ua)) return '平板';
        if (/Mobile|Android|iPhone/i.test(ua)) return '手机';
        return 'PC';
    }

    function parseBrowser() {
        var ua = navigator.userAgent;
        var info = { name: 'Unknown', version: '' };
        if (/Edg\/(\d+)/i.test(ua)) { info.name = 'Edge'; info.version = ua.match(/Edg\/(\d+)/i)[1]; }
        else if (/Chrome\/(\d+)/i.test(ua)) { info.name = 'Chrome'; info.version = ua.match(/Chrome\/(\d+)/i)[1]; }
        else if (/Firefox\/(\d+)/i.test(ua)) { info.name = 'Firefox'; info.version = ua.match(/Firefox\/(\d+)/i)[1]; }
        else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) { info.name = 'Safari'; info.version = ua.match(/Version\/(\d+)/i)[1]; }
        else if (/MSIE (\d+)/i.test(ua)) { info.name = 'IE'; info.version = ua.match(/MSIE (\d+)/i)[1]; }
        return info;
    }

    function sendVisitStart() {
        var uuid = getUUID();
        var searchInfo = parseSearchQuery(document.referrer);
        var browser = parseBrowser();

        var data = {
            start: true,
            uuid: uuid,
            url: window.location.href,
            referer: document.referrer || '',
            search_engine: searchInfo.engine,
            search_keyword: searchInfo.keyword,
            device_type: detectDevice(),
            browser_name: browser.name,
            browser_version: browser.version,
            channel: ''
        };

        fetch('/api/visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(function(res) { return res.json(); }).then(function(res) {
            if (res.success && res.data && res.data.is_blacklisted) {
                document.body.innerHTML = '<div style="text-align:center;padding:100px 20px;font-family:sans-serif"><h2>访问被拒绝</h2><p style="color:#909399">您的IP已被加入黑名单</p></div>';
            }
        }).catch(function() {});
    }

    function sendHeartbeat() {
        var uuid = localStorage.getItem(UUID_KEY);
        if (!uuid) return;
        fetch('/api/visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ heartbeat: true, uuid: uuid })
        }).catch(function() {});
    }

    function sendVisitEnd() {
        var uuid = localStorage.getItem(UUID_KEY);
        if (!uuid) return;
        var data = { end: true, uuid: uuid };
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/visitor', JSON.stringify(data));
        } else {
            fetch('/api/visitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify(data)
            }).catch(function() {});
        }
    }

    // Start tracking when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sendVisitStart);
    } else {
        sendVisitStart();
    }

    // Heartbeat every 30 seconds
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Send end when leaving page
    window.addEventListener('beforeunload', sendVisitEnd);
    window.addEventListener('pagehide', sendVisitEnd);
})();
