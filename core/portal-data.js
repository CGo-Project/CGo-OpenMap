/**
 * CGo OpenMap - 城市门户数据与元数据模块 (Portal Data)
 * 纯原生 ES6 实现，负责城市拼音/缩写元数据、地理坐标、球面大圆测距、Logo 矢量包装及最近访问历史持久化
 */
(function () {
    'use strict';

    // 规范化并包装城市徽标；优先使用 CGoUI 官方原生收录城市图标（已内置 42+ 座城市），缺失时回退自定义 SVG 或通用列车图标。
    const CGO_BUILTIN_CITY_ICONS = new Set([
        'beijing', 'changchun', 'dalian', 'fuzhou', 'hefei', 'qingdao', 'shanghai', 'shenyang',
        'changsha', 'changzhou', 'chengdu', 'chongqing', 'dongguan', 'foshan', 'guangzhou', 'guiyang',
        'hangzhou', 'harbin', 'hongkong', 'jinan', 'kaohsiung', 'kunming', 'lanzhou', 'nanchang',
        'nanjing', 'nanning', 'nantong', 'ningbo', 'shijiazhuang', 'shenzhen', 'suzhou', 'taipei',
        'taiyuan', 'taoyuan', 'tianjin', 'wenzhou', 'wuhan', 'wuhu', 'wuxi', 'xiamen',
        'xian', 'zhengzhou',
        // 常用别名兼容
        'xianggang', 'taibei', 'gaoxiong', 'haerbin', 'xi-an'
    ]);

    // 城市拼音元数据与快速检索缩写对照表
    const CITY_LETTER_DATA = {
        'beijing': { letter: 'B', pinyin: 'Beijing', zh: '北京', pyInitials: 'bj' },
        'changchun': { letter: 'C', pinyin: 'Changchun', zh: '长春', pyInitials: 'cc' },
        'dalian': { letter: 'D', pinyin: 'Dalian', zh: '大连', pyInitials: 'dl' },
        'fuzhou': { letter: 'F', pinyin: 'Fuzhou', zh: '福州', pyInitials: 'fz' },
        'harbin': { letter: 'H', pinyin: 'Harbin', zh: '哈尔滨', pyInitials: 'heb,hrb' },
        'hohhot': { letter: 'H', pinyin: 'Hohhot', zh: '呼和浩特', pyInitials: 'hhht' },
        'hongkong': { letter: 'H', pinyin: 'Hong Kong (Xianggang)', zh: '香港', pyInitials: 'hk,xg' },
        'lanzhou': { letter: 'L', pinyin: 'Lanzhou', zh: '兰州', pyInitials: 'lz' },
        'liaoyuan': { letter: 'L', pinyin: 'Liaoyuan', zh: '辽源', pyInitials: 'ly' },
        'macau': { letter: 'M', pinyin: 'Macau (Aomen)', zh: '澳門', pyInitials: 'am,mo,mac' },
        'nanping': { letter: 'N', pinyin: 'Nanping', zh: '南平', pyInitials: 'np' },
        'qingdao': { letter: 'Q', pinyin: 'Qingdao', zh: '青岛', pyInitials: 'qd' },
        'sanya': { letter: 'S', pinyin: 'Sanya', zh: '三亚', pyInitials: 'sy' },
        'shanghai': { letter: 'S', pinyin: 'Shanghai', zh: '上海', pyInitials: 'sh' },
        'shenzhen': { letter: 'S', pinyin: 'Shenzhen', zh: '深圳', pyInitials: 'sz' },
        'shenyang': { letter: 'S', pinyin: 'Shenyang', zh: '沈阳', pyInitials: 'sy' },
        'shijiazhuang': { letter: 'S', pinyin: 'Shijiazhuang', zh: '石家庄', pyInitials: 'sjz' },
        'sydney': { letter: 'S', pinyin: 'Sydney (Xini)', zh: '悉尼', pyInitials: 'xn,syd' },
        'wenshan': { letter: 'W', pinyin: 'Wenshan', zh: '文山', pyInitials: 'ws' }
    };

    /**
     * 获取城市拼音与字母元数据
     */
    function getCityMeta(city) {
        if (!city) return { letter: '#', pinyin: '', zh: '', pyInitials: '' };
        const id = (city.id || '').toLowerCase();
        const matched = CITY_LETTER_DATA[id];
        if (matched) return matched;
        const letter = (city.id || '#')[0].toUpperCase();
        return {
            letter: letter >= 'A' && letter <= 'Z' ? letter : '#',
            pinyin: city.id || '',
            zh: city.name || '',
            pyInitials: (city.id || '').slice(0, 3)
        };
    }

    /**
     * 格式化包装城市官方徽标或降级显示
     */
    function formatCityLogoSvg(cityOrSvg) {
        if (!cityOrSvg) return '<cgo-icon name="train" size="22"></cgo-icon>';
        let cityId = '';
        let rawSvg = '';
        if (typeof cityOrSvg === 'object') {
            cityId = (cityOrSvg.id || '').toLowerCase();
            rawSvg = cityOrSvg.svglogo || '';
        } else if (typeof cityOrSvg === 'string') {
            rawSvg = cityOrSvg;
        }
        const hasBuiltin = (name) => {
            if (!name) return false;
            if (CGO_BUILTIN_CITY_ICONS.has(name)) return true;
            if (window.CGO && typeof window.CGO.iconList === 'function') {
                return window.CGO.iconList().includes(name);
            }
            return false;
        };

        if (cityId && hasBuiltin(cityId)) {
            return `<cgo-icon name="${cityId}" size="22"></cgo-icon>`;
        }
        if (!rawSvg || typeof rawSvg !== 'string' || !rawSvg.trim()) {
            return '<cgo-icon name="train" size="22"></cgo-icon>';
        }
        let svg = rawSvg.trim();
        // 移除 XML 声明及 DOCTYPE (如果有)
        svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').trim();
        // 若收录时去除了 viewBox，根据坐标特征智能赋予初始视口 (1000 级 vs 100 级)
        if (!/viewBox\s*=/i.test(svg)) {
            const pathDMatch = svg.match(/\bd=["']([^"']+)["']/i);
            const pathD = pathDMatch ? pathDMatch[1] : '';
            const nums = pathD.match(/-?\d+(?:\.\d+)?/g);
            const isLarge = nums && nums.some(n => Math.abs(parseFloat(n)) > 150);
            const initVb = isLarge ? '0 0 1024 1024' : '0 0 100 100';
            svg = svg.replace(/<svg\b/i, `<svg viewBox="${initVb}"`);
        }
        // 统一设置 width="22" height="22" fill="currentColor"，并剥离写死的固定尺寸和填充色
        svg = svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
            let cleanAttrs = attrs
                .replace(/\s+(width|height|fill)\s*=\s*["'][^"']*["']/gi, '')
                .trim();
            return `<svg width="22" height="22" fill="currentColor" ${cleanAttrs}>`;
        });
        return svg;
    }

    // 城市地理中心坐标库 (WGS84 纬度与经度，用于球面大圆距离计算)
    const CITY_GEO_COORDS = {
        'beijing': { lat: 39.9042, lng: 116.4074 },
        'shanghai': { lat: 31.2304, lng: 121.4737 },
        'shenyang': { lat: 41.8057, lng: 123.4315 },
        'qingdao': { lat: 36.0671, lng: 120.3826 },
        'hefei': { lat: 31.8206, lng: 117.2272 },
        'sydney': { lat: -33.8688, lng: 151.2093 },
        'hongkong': { lat: 22.3193, lng: 114.1694 },
        'shenzhen': { lat: 22.5431, lng: 114.0579 },
        'dalian': { lat: 38.9140, lng: 121.6147 },
        'changchun': { lat: 43.8171, lng: 125.3235 },
        'fuzhou': { lat: 26.0745, lng: 119.2965 },
        'lanzhou': { lat: 36.0611, lng: 103.8343 },
        'harbin': { lat: 45.8038, lng: 126.5349 },
        'hohhot': { lat: 40.8427, lng: 111.7500 },
        'shijiazhuang': { lat: 38.0428, lng: 114.5149 },
        'sanya': { lat: 18.2528, lng: 109.5120 },
        'nanping': { lat: 27.3299, lng: 118.1777 },
        'liaoyuan': { lat: 42.9026, lng: 125.1451 },
        'wenshan': { lat: 23.3692, lng: 104.2440 },
        'macau': { lat: 22.1987, lng: 113.5439 }
    };

    /**
     * Haversine 大圆距离公式 (单位：公里)
     */
    function calculateDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半径 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 格式化人类易读距离
     */
    function formatDistance(distKm) {
        if (!Number.isFinite(distKm) || distKm === Infinity) return '距离未知';
        if (distKm < 1) {
            return `${Math.round(distKm * 1000)} m`;
        }
        if (distKm < 10) {
            return `${distKm.toFixed(1)} km`;
        }
        return `${Math.round(distKm).toLocaleString()} km`;
    }

    // 最近浏览存储键与记录管理
    const RECENT_VIEWS_KEY = 'cgo_openmap_recent_views';

    /**
     * 记录城市访问历史，保持最近访问置顶
     */
    function recordCityVisit(cityId) {
        if (!cityId) return;
        try {
            let recents = [];
            const raw = localStorage.getItem(RECENT_VIEWS_KEY);
            if (raw) {
                try { recents = JSON.parse(raw); } catch (e) { recents = []; }
            }
            if (!Array.isArray(recents)) recents = [];
            // 过滤掉同城旧记录，将最新点开的城市收入并置于第一位
            recents = recents.filter(item => item && item.id !== cityId);
            recents.unshift({ id: String(cityId), time: Date.now() });
            if (recents.length > 60) recents = recents.slice(0, 60);
            localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(recents));
        } catch (e) { }
    }

    /**
     * 读取最近访问历史列表
     */
    function getRecentVisits() {
        try {
            const raw = localStorage.getItem(RECENT_VIEWS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) { }
        // 首次访问兜底：若本地有激活城市偏好，则作为初始访问记录收录
        const fallbackCity = localStorage.getItem('cgo_openmap_city');
        if (fallbackCity) {
            const initRecord = [{ id: fallbackCity, time: Date.now() - 3600000 }];
            try { localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(initRecord)); } catch (e) { }
            return initRecord;
        }
        return [];
    }

    /**
     * 格式化相对时间
     */
    function formatRelativeTime(timestamp) {
        if (!timestamp) return '近期';
        const now = Date.now();
        const diff = Math.max(0, now - timestamp);
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (diff < minute) return '刚刚';
        if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
        if (diff < day) return `${Math.floor(diff / hour)}小时前`;
        const days = Math.floor(diff / day);
        if (days === 1) return '昨天';
        if (days === 2) return '前天';
        if (days < 7) return `${days}天前`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}周前`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}个月前`;
        return `${Math.floor(days / 365)}年前`;
    }

    // 挂载全局与模块对象
    window.recordCityVisit = recordCityVisit;

    window.PortalData = {
        CGO_BUILTIN_CITY_ICONS,
        CITY_LETTER_DATA,
        CITY_GEO_COORDS,
        RECENT_VIEWS_KEY,
        getCityMeta,
        formatCityLogoSvg,
        calculateDistanceKm,
        formatDistance,
        recordCityVisit,
        getRecentVisits,
        formatRelativeTime
    };
})();
