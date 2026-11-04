/**
 * CGo OpenMap - 车站图元模板与尺寸 (core/station-icons.js)
 * 车站图元绘制唯一真源，供地图引擎与编辑器共用
 * 包含：基础普通站、换乘同心圆、胶囊跑道圆、哑铃换乘、综合交通设施徽标 (Amenities) 与车站编码系统
 */

(function (root, factory) {
    const api = factory();
    root.CGoStationIcons = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    /**
     * 各类型图元的边长 (px，画布坐标)。
     *
     * ⚠️ 必须与 `css/style.css` 中 `.dot/.rdot/.tsfo/.tsf/.no` 的 width/height 一致——
     * 引擎靠 CSS 定尺寸，编辑器画布靠这里的数值定尺寸，两者一旦不同步，
     * 编辑器里看到的图元大小就不是线路图上的真实大小。
     * `selfcheck.js` 会直接解析 css/style.css 比对这张表。
     */
    const STATION_SIZE = {
        dot: 10,
        tsfo: 10,
        rdot: 10,
        no: 10,
        tsf: 17.5,
        tsf_pill_h: 26,
        tsf_pill_v: 26,
        tsf_pill_d45: 24,
        tsf_pill_d135: 24,
        tsf_dumbbell: 32
    };

    /** 精准图元宽高字典 (用于非正方形图元精准居中) */
    const STATION_DIMS = {
        dot: { width: 10, height: 10 },
        tsfo: { width: 10, height: 10 },
        rdot: { width: 10, height: 10 },
        no: { width: 10, height: 10 },
        tsf: { width: 17.5, height: 17.5 },
        tsf_pill_h: { width: 26, height: 14 },
        tsf_pill_v: { width: 14, height: 26 },
        tsf_pill_d45: { width: 24, height: 24 },
        tsf_pill_d135: { width: 24, height: 24 },
        tsf_dumbbell: { width: 32, height: 14 }
    };

    /** 车站图元 z 序，同样对齐 css/style.css */
    const STATION_Z = {
        no: 5,
        dot: 15,
        rdot: 15,
        tsfo: 15,
        tsf: 20,
        tsf_pill_h: 20,
        tsf_pill_v: 20,
        tsf_pill_d45: 20,
        tsf_pill_d135: 20,
        tsf_dumbbell: 20
    };

    const SVGTemplates = {
        tsf: `<svg viewBox="0 0 17.5 17.5"><circle cx="8.75" cy="8.75" r="8.75" style="fill: var(--map-bg);"/><circle cx="8.75" cy="8.75" r="8" style="fill: var(--station-stroke);"/><circle cx="8.75" cy="8.75" r="7.1" style="fill: var(--map-bg);"/><path d="M6.21,8.01c.12-2.35,2.26-4.22,4.88-4.22.23,0,.46.01.68.04-.55-.18-1.15-.27-1.77-.27-2.8,0-5.09,1.96-5.3,4.45h-1.4l2.34,2.47c.78-.82,1.56-1.65,2.34-2.47h-1.78.01Z" style="fill: var(--station-stroke);"/><path d="M11.85,7.02c-.78.82-1.56,1.65-2.34,2.47h1.78c-.12,2.35-2.26,4.22-4.88,4.22-.23,0-.46-.01-.68-.04.55.18,1.15.27,1.77.27,2.8,0,5.09-1.96,5.3-4.45h1.4l-2.34-2.47h0Z" style="fill: var(--station-stroke);"/></svg>`,
        tsfo: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:{{COLOR}};"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
        dot: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:{{COLOR}};"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
        no: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><path d="M7.5,5c0-.1-.02-.19-.03-.29l1.7-.13c-.05-.46-.15-.9-.33-1.3l-1.54.73c-.08-.18-.18-.34-.3-.5l1.41-.96c-.26-.37-.59-.69-.95-.95l-.97,1.41c-.15-.12-.32-.22-.5-.3l.74-1.54c-.4-.18-.84-.29-1.3-.34l-.14,1.7c-.1-.01-.19-.03-.29-.03s-.19.02-.29.03l-.13-1.7c-.46.05-.9.15-1.3.33l.73,1.54c-.18.08-.34.18-.5.3l-.96-1.41c-.37.26-.69.59-.95.95l1.41.97c-.12.15-.22.32-.3.5l-1.54-.74c-.18.4-.29.84-.34,1.3l1.7.14c-.01.1-.03.19-.03.29s.02.19.03.29l-1.7.13c.05.46.15.9.33,1.3l1.54-.73c.08.18.18.34.3.5l-1.41.96c.26.37.59.69.95.95l.97-1.41c.15.12.32.22.5.3l-.74,1.54c.4.18.84.29,1.3.34l.14-1.7c.1.01.19.03.29.03s.19-.02.29-.03l.13,1.7c.46-.05.9-.15,1.3-.33l-.73-1.54c.18-.08.34-.18.5-.3l.96,1.41c.37-.26.69-.58.95-.95l-1.41-.97c.12-.15.22-.32.3-.5l1.54.74c.18-.4.29-.84.34-1.3l-1.7-.14c.01-.1.03-.19.03-.29Z" style="fill: var(--not-open-color);"/><circle cx="5" cy="3.5" style="fill: var(--map-bg);"/></svg>`,
        rdot: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:#78848b;"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
        // 跑道圆长胶囊 (水平水平换乘，宽 26 x 高 14)
        tsf_pill_h: `<svg viewBox="0 0 26 14"><rect x="0" y="0" width="26" height="14" rx="7" ry="7" style="fill: var(--map-bg);"/><rect x="1" y="1" width="24" height="12" rx="6" ry="6" style="fill: var(--map-bg); stroke: var(--station-stroke); stroke-width: 2;"/><circle cx="7" cy="7" r="2.8" style="fill: var(--station-stroke);"/><circle cx="19" cy="7" r="2.8" style="fill: var(--station-stroke);"/></svg>`,
        // 跑道圆长胶囊 (垂直垂直换乘，宽 14 x 高 26)
        tsf_pill_v: `<svg viewBox="0 0 14 26"><rect x="0" y="0" width="14" height="26" rx="7" ry="7" style="fill: var(--map-bg);"/><rect x="1" y="1" width="12" height="24" rx="6" ry="6" style="fill: var(--map-bg); stroke: var(--station-stroke); stroke-width: 2;"/><circle cx="7" cy="7" r="2.8" style="fill: var(--station-stroke);"/><circle cx="7" cy="19" r="2.8" style="fill: var(--station-stroke);"/></svg>`,
        // 跑道圆长胶囊 (45° 对角倾斜，宽 24 x 高 24)
        tsf_pill_d45: `<svg viewBox="0 0 24 24"><g transform="rotate(45 12 12)"><rect x="-1" y="5" width="26" height="14" rx="7" ry="7" style="fill: var(--map-bg);"/><rect x="0" y="6" width="24" height="12" rx="6" ry="6" style="fill: var(--map-bg); stroke: var(--station-stroke); stroke-width: 2;"/><circle cx="6" cy="12" r="2.8" style="fill: var(--station-stroke);"/><circle cx="18" cy="12" r="2.8" style="fill: var(--station-stroke);"/></g></svg>`,
        // 跑道圆长胶囊 (135° 对角倾斜，宽 24 x 高 24)
        tsf_pill_d135: `<svg viewBox="0 0 24 24"><g transform="rotate(-45 12 12)"><rect x="-1" y="5" width="26" height="14" rx="7" ry="7" style="fill: var(--map-bg);"/><rect x="0" y="6" width="24" height="12" rx="6" ry="6" style="fill: var(--map-bg); stroke: var(--station-stroke); stroke-width: 2;"/><circle cx="6" cy="12" r="2.8" style="fill: var(--station-stroke);"/><circle cx="18" cy="12" r="2.8" style="fill: var(--station-stroke);"/></g></svg>`,
        // 双联哑铃连杆换乘 (宽 32 x 高 14)
        tsf_dumbbell: `<svg viewBox="0 0 32 14"><rect x="5" y="5.5" width="22" height="3" rx="1.5" style="fill: var(--station-stroke);"/><circle cx="7" cy="7" r="6" style="fill: var(--map-bg); stroke: var(--station-stroke); stroke-width: 2;"/><circle cx="25" cy="7" r="6" style="fill: var(--map-bg); stroke: var(--station-stroke); stroke-width: 2;"/><circle cx="7" cy="7" r="2.5" style="fill: var(--station-stroke);"/><circle cx="25" cy="7" r="2.5" style="fill: var(--station-stroke);"/></svg>`
    };

    /**
     * 综合交通设施徽标矢量库 (Transit Hub Amenities Vector Library)
     * 全部基于原生 SVG 矢量绘制，严格杜绝 Emoji，自适应主题色与高对比度排版
     */
    const AMENITY_ICONS = {
        airport: `<svg viewBox="0 0 14 14" width="13" height="13"><path d="M7 1.5 L8.2 5.5 L12.5 7 L12.5 8.2 L8.2 7.2 L8.2 10.5 L9.5 11.5 L9.5 12.5 L7 12 L4.5 12.5 L4.5 11.5 L5.8 10.5 L5.8 7.2 L1.5 8.2 L1.5 7 L5.8 5.5 Z" fill="currentColor"/></svg>`,
        crh: `<svg viewBox="0 0 14 14" width="13" height="13"><path d="M3.2 2.5 C3.2 1.8 4.2 1.2 7 1.2 C9.8 1.2 10.8 1.8 10.8 2.5 L11.2 8.5 C11.2 10.2 10 11.2 7 11.2 C4 11.2 2.8 10.2 2.8 8.5 Z M4.2 3.5 L4.2 6 L9.8 6 L9.8 3.5 Z M4.8 8.5 A1 1 0 1 0 4.8 8.49 Z M9.2 8.5 A1 1 0 1 0 9.2 8.49 Z M4 11.8 L3 13 M10 11.8 L11 13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>`,
        railway: `<svg viewBox="0 0 14 14" width="13" height="13"><rect x="3" y="2" width="8" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="3" y1="5.5" x2="11" y2="5.5" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="8.2" r="0.9" fill="currentColor"/><circle cx="9" cy="8.2" r="0.9" fill="currentColor"/><line x1="4" y1="12" x2="2.5" y2="13.2" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="12" x2="11.5" y2="13.2" stroke="currentColor" stroke-width="1.2"/></svg>`,
        ferry: `<svg viewBox="0 0 14 14" width="13" height="13"><path d="M4 3 L10 3 L9.2 5.5 L4.8 5.5 Z M2.5 7 L11.5 7 L10.5 10.2 L3.5 10.2 Z M1.5 11.8 C3 11 4.5 12.6 6 11.8 C7.5 11 9 12.6 10.5 11.8 C11.5 11.2 12.5 12 13 12.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        maglev: `<svg viewBox="0 0 14 14" width="13" height="13"><path d="M2.5 3 C2.5 2 4 1.5 7 1.5 C10 1.5 11.5 2 11.5 3 L12 7.5 C12 9 10.5 9.8 7 9.8 C3.5 9.8 2 9 2 7.5 Z" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="4" y1="4.5" x2="10" y2="4.5" stroke="currentColor" stroke-width="1.2"/><line x1="2" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2,2"/></svg>`,
        tram: `<svg viewBox="0 0 14 14" width="13" height="13"><rect x="3" y="3.5" width="8" height="7.5" rx="1.5" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="7" y1="3.5" x2="7" y2="1.2" stroke="currentColor" stroke-width="1.2"/><line x1="5" y1="1.2" x2="9" y2="1.2" stroke="currentColor" stroke-width="1.2"/><line x1="3" y1="6.8" x2="11" y2="6.8" stroke="currentColor" stroke-width="1.2"/><circle cx="5" cy="9" r="0.8" fill="currentColor"/><circle cx="9" cy="9" r="0.8" fill="currentColor"/></svg>`,
        pr: `<svg viewBox="0 0 14 14" width="13" height="13"><rect x="1.5" y="1.5" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M5 10.2 L5 3.8 L7.8 3.8 C9 3.8 9.8 4.5 9.8 5.6 C9.8 6.7 9 7.4 7.8 7.4 L5 7.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        accessible: `<svg viewBox="0 0 14 14" width="13" height="13"><circle cx="7" cy="3" r="1.2" fill="currentColor"/><path d="M5.5 5.5 L7.8 5.5 L7.8 8.8 L9.8 11.2 M5.5 8 C6.2 8.8 7.2 9.2 8.2 8.8 C8.8 8.5 9.2 7.8 9.2 7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
    };

    /** 交通设施元数据定义 */
    const AMENITY_META = {
        airport: { id: 'airport', label: '民航机场', tag: 'AIR', desc: '接驳民用航空航站楼' },
        crh: { id: 'crh', label: '高速铁路', tag: 'CRH', desc: '接驳国家高速铁路与动车组' },
        railway: { id: 'railway', label: '国家铁路', tag: 'RWY', desc: '接驳国家铁路普通旅客列车' },
        ferry: { id: 'ferry', label: '客运码头', tag: 'SEA', desc: '接驳水上客运轮渡与客运港口' },
        maglev: { id: 'maglev', label: '磁悬浮', tag: 'MAG', desc: '接驳中低速或高速磁悬浮专线' },
        tram: { id: 'tram', label: '有轨电车', tag: 'TRM', desc: '接驳地面现代有轨电车' },
        pr: { id: 'pr', label: 'P+R 停车', tag: 'P+R', desc: '具备驻车换乘大型停车场' },
        accessible: { id: 'accessible', label: '无障碍设施', tag: 'ACC', desc: '配备无障碍垂梯与坡道' }
    };

    /**
     * 取某座车站的图元 HTML。
     * @param {object} station 含 type、lineColors 的车站对象
     * @returns {string} SVG 字符串
     */
    function iconHtmlFor(station) {
        const type = station && station.type;
        const color = (station && station.lineColors && station.lineColors.length > 0)
            ? station.lineColors[0]
            : 'var(--station-stroke)';
        if (type === 'dot' || type === 'tsfo') return SVGTemplates.dot.replace('{{COLOR}}', color);
        if (SVGTemplates[type]) return SVGTemplates[type];
        return SVGTemplates.dot.replace('{{COLOR}}', color);
    }

    function sizeFor(type) {
        return STATION_SIZE[type] !== undefined ? STATION_SIZE[type] : STATION_SIZE.dot;
    }

    function dimensionsFor(type) {
        return STATION_DIMS[type] || { width: 10, height: 10 };
    }

    /**
     * 渲染设施徽标组 HTML (纯 SVG 矢量)
     * @param {Array<string>} amenities 设施标识数组
     * @returns {string} HTML 字符串
     */
    function renderAmenitiesHtml(amenities) {
        if (!amenities || !Array.isArray(amenities) || amenities.length === 0) return '';
        var html = '<span class="station-amenities-group">';
        amenities.forEach(function (key) {
            var svg = AMENITY_ICONS[key];
            var meta = AMENITY_META[key];
            if (svg && meta) {
                html += '<span class="amenity-badge amenity-' + key + '" title="' + meta.label + '" aria-label="' + meta.label + '">' + svg + '</span>';
            }
        });
        html += '</span>';
        return html;
    }

    /**
     * 渲染车站编号胶囊徽标 (Station Alphanumeric Code Badge)
     * @param {string} code 车站编号 (如 01, M05, A12, 1-10)
     * @param {string} color 背景线路主题色
     * @returns {string} HTML 字符串
     */
    function renderStationCodeBadge(code, color) {
        if (!code || typeof code !== 'string') return '';
        var trimmed = code.trim();
        if (!trimmed) return '';
        var bg = color || 'var(--station-stroke, #00263b)';
        return '<span class="station-code-pill" style="background:' + bg + ';" title="车站编号: ' + trimmed + '">' + trimmed + '</span>';
    }

    /**
     * 统计每座车站经停线路的标志色，写入 station.lineColors。
     * 与 core/script.js 的 processData 同义：普通站的环色取第一条经停线路的颜色。
     *
     * @param {object} stations 车站字典（就地写入 lineColors）
     * @param {Array} lines 线路数组
     * @param {function} stationIdsOf 取一条线路全部车站 ID 的函数（分支线安全）
     */
    function computeLineColors(stations, lines, stationIdsOf, key) {
        const field = key || 'lineColors';
        Object.keys(stations).forEach(id => { stations[id][field] = []; });
        (lines || []).forEach(line => {
            const ids = stationIdsOf ? stationIdsOf(line) : (line.stationIds || []);
            ids.forEach(sid => {
                const s = stations[sid];
                if (s && line.color && s[field].indexOf(line.color) === -1) {
                    s[field].push(line.color);
                }
            });
        });
        return stations;
    }

    /**
     * 逐行复刻 core/script.js processData 的经停线路标志色次序，返回 { sid: [color, …] }。
     *
     * 注意引擎的次序并不是「线路书写顺序」：普通线路用 unshift（后写的线路排在前面），
     * 只有 isPointOnly 的线路用 push；分支线路只统计 way1 / way2。普通站的环色取 [0]，
     * 城市钩子（长春、沈阳……）也按 [0] 上色——次序不一致，编辑器里的站点就会换一种颜色。
     *
     * @param {Array} lines 线路数组
     * @returns {Object<string, string[]>}
     */
    function engineLineColors(lines) {
        const out = {};
        (lines || []).forEach(line => {
            if (!line) return;
            let ids;
            if (line.hasbranch) {
                ids = Array.from(new Set([].concat(line['stationIds-way1'] || [], line['stationIds-way2'] || [])));
            } else {
                ids = line.stationIds || [];
            }
            ids.forEach(sid => {
                if (!out[sid]) out[sid] = [];
                if (line.isPointOnly) out[sid].push(line.color);
                else out[sid].unshift(line.color);
            });
        });
        return out;
    }

    /**
     * 「明确指定形状」的通用图元：车站选了这些类型，就画这里的通用模板，不交给城市钩子
     * （城市钩子通常按逐站 marker 或 dot / tsf 两分法画图，会把胶囊、哑铃吞掉）。
     * 引擎 renderStations 与 OpenMap Editor 画布共用这一规则。
     */
    const EXPLICIT_GLYPH_TYPES = ['tsf_pill_h', 'tsf_pill_v', 'tsf_pill_d45', 'tsf_pill_d135', 'tsf_dumbbell'];
    function isExplicitGlyph(type) {
        return EXPLICIT_GLYPH_TYPES.indexOf(type) !== -1;
    }

    /**
     * 找出经过某座车站的各条线路「站台」：每条线路折线上离车站最近的点及该处线路走向。
     * 供各城市的 getStationStyleOptions 钩子按真实站台位置生成合并 / 分离的换乘图元。
     * 同一位置（< 3px）的多条线路合并为一处站台，colors 记录全部线路色。
     *
     * @param {{x:number,y:number}} station
     * @param {Array} lines linesData（含 pathPoints / pathPoints-* 与 color）
     * @param {number} [radius=12] 认定「经过本站」的最大距离
     * @returns {Array<{x,y,dx,dy,angle,colors:string[],lineIds:string[]}>} dx/dy 为相对车站的偏移，angle 为线路走向（度）
     */
    function stationPlatforms(station, lines, radius) {
        const R = radius || 12;
        const near = {};
        (lines || []).forEach((line, li) => {
            if (!line) return;
            Object.keys(line).forEach(key => {
                if (key.indexOf('pathPoints') !== 0 || !Array.isArray(line[key])) return;
                const pts = line[key];
                for (let i = 0; i < pts.length - 1; i++) {
                    const a = pts[i], b = pts[i + 1];
                    const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy;
                    if (l2 < 1e-6) continue;
                    const t = Math.max(0, Math.min(1, ((station.x - a.x) * vx + (station.y - a.y) * vy) / l2));
                    const px = a.x + t * vx, py = a.y + t * vy;
                    const d = Math.hypot(station.x - px, station.y - py);
                    const id = line.id || ('L' + li);
                    if (d <= R && (!near[id] || d < near[id].d)) {
                        near[id] = { d, x: px, y: py, angle: Math.atan2(vy, vx) * 180 / Math.PI, color: line.color, id };
                    }
                }
            });
        });
        const out = [];
        Object.keys(near).forEach(id => {
            const p = near[id];
            const hit = out.find(q => Math.hypot(q.x - p.x, q.y - p.y) < 3);
            if (hit) {
                if (p.color && hit.colors.indexOf(p.color) === -1) hit.colors.push(p.color);
                hit.lineIds.push(id);
                return;
            }
            out.push({ x: p.x, y: p.y, dx: p.x - station.x, dy: p.y - station.y, angle: p.angle,
                colors: p.color ? [p.color] : [], lineIds: [id] });
        });
        return out;
    }

    /** 胶囊（跑道圆）轮廓路径：中心 (cx, cy)、总长 len、半径 r、长轴角度 angle（度），相对坐标 */
    function capsulePath(cx, cy, len, r, angle) {
        const a = (angle || 0) * Math.PI / 180;
        const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
        const h = Math.max(0, len / 2 - r);
        const f = v => (Math.round(v * 100) / 100).toFixed(2);
        const ax = cx - ux * h, ay = cy - uy * h, bx = cx + ux * h, by = cy + uy * h;
        return `M${f(ax + nx * r)} ${f(ay + ny * r)}L${f(bx + nx * r)} ${f(by + ny * r)}` +
            `A${f(r)} ${f(r)} 0 0 0 ${f(bx - nx * r)} ${f(by - ny * r)}` +
            `L${f(ax - nx * r)} ${f(ay - ny * r)}A${f(r)} ${f(r)} 0 0 0 ${f(ax + nx * r)} ${f(ay + ny * r)}Z`;
    }

    return {
        stationPlatforms,
        capsulePath,
        EXPLICIT_GLYPH_TYPES,
        isExplicitGlyph,
        engineLineColors,
        SVGTemplates,
        STATION_SIZE,
        STATION_DIMS,
        STATION_Z,
        AMENITY_ICONS,
        AMENITY_META,
        iconHtmlFor,
        sizeFor,
        dimensionsFor,
        renderAmenitiesHtml,
        renderStationCodeBadge,
        computeLineColors
    };
});
