/**
 * CGo OpenMap - 上海城市业务逻辑与数据关系接口 (city/shanghai/shanghai.js)
 * 
 * ==============================================================================
 * ️ 上海轨道交通业务规则说明
 * ==============================================================================
 */

(function () {
    /** 载入上海城市专属样式表（站点图元尺寸与站名排版） */
    function loadCityStylesheet() {
        const href = "./city/shanghai/style.css";
        if (document.querySelector(`link[href^="${href}"]`)) return null;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
        return link;
    }
    loadCityStylesheet();
    document.documentElement.classList.add("map-shanghai");

    // ── 上海官方线网图站点画法常量（取自官方矢量图实测值）──
    const TICK_LONG = 15;        // 普通站短横长度（垂直于线路方向）
    const TICK_SHORT = 7;        // 普通站短横宽度（沿线路方向）
    const CAPSULE_SHORT = 12.76; // 换乘站胶囊宽度（直径）
    const CAPSULE_STROKE = 1.5;  // 换乘站胶囊描边宽度
    const CAPSULE_COLOR = "#3e3a39";

    /** 站点缺少原图图元数据时，按所属线路折线的切线方向推断短横朝向 */
    const tangentAngleCache = new Map();
    function inferTangentAngle(station, stationId) {
        if (tangentAngleCache.has(stationId)) return tangentAngleCache.get(stationId);
        let angle = 90;
        const lines = (typeof linesData !== "undefined" && Array.isArray(linesData)) ? linesData : [];
        let best = null;
        lines.forEach((line) => {
            const groups = line.hasbranch
                ? [line["pathPoints-main"], line["pathPoints-branch1"], line["pathPoints-branch2"]]
                : [line.pathPoints];
            groups.forEach((pts) => {
                if (!Array.isArray(pts) || pts.length < 2) return;
                for (let i = 0; i < pts.length - 1; i++) {
                    const a = pts[i], b = pts[i + 1];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const l2 = dx * dx + dy * dy;
                    if (l2 < 1e-6) continue;
                    const t = Math.max(0, Math.min(1, ((station.x - a.x) * dx + (station.y - a.y) * dy) / l2));
                    const d = Math.hypot(station.x - (a.x + t * dx), station.y - (a.y + t * dy));
                    if (!best || d < best.d) best = { d, dx, dy };
                }
            });
        });
        if (best && best.d <= 12) {
            // 短横垂直于线路走向
            angle = (Math.atan2(best.dy, best.dx) * 180 / Math.PI) + 90;
        }
        while (angle < 0) angle += 180;
        while (angle >= 180) angle -= 180;
        angle = Math.round(angle * 10) / 10;
        tangentAngleCache.set(stationId, angle);
        return angle;
    }

    const ShanghaiCity = {
        /** 城市唯一标识符 */
        id: "shanghai",
        /** 城市名称 */
        name: "上海",
        officialMapUrl: "http://service.shmetro.com/yxxp/index.htm",

        /** 城市主理人与维护者 */
        maintainers: [
            { name: "待认领", role: "城市主理人招募中", isRecruiting: true }
        ],

        dataFiles: {
            stanameCsvUrl: './city/shanghai/staname.csv',
            amapDataUrl: './city/shanghai/amap_data.json'
        },

        /** 线路元数据字典 (LINE_META) */
        LINE_META: {},

        /**
         * 线路排序权重表 (LINE_SORT_ORDER)
         * 控制车站详情面板、多线换乘图标、图例列表中的线路显示顺序
         */
        LINE_SORT_ORDER: [
            "SH1", "SH2", "SH3", "SH4", "SH5", "SH6", "SH7", "SH8", "SH9", "SH10",
            "SH11", "SH12", "SH13", "SH14", "SH15", "SH16", "SH17", "SH18",
            "SHAPMR", "SHMaglev", "SHAPT", "Rwy", "Rwy2"
        ],

        /** 线路同步联动高亮组 */
        LINE_SYNC_GROUPS: [
            ['SH3', 'SH4']
        ],

        /** 市郊铁路与国铁干线标识列表 */
        SUBURBAN_LINES: ['SHMaglev', 'SHAPT', 'Rwy', 'Rwy2', '中国铁路', '金山铁路', '市域铁路'],

        /** 同名合并车站列表 */
        MERGE_STATIONS: [],

        /** 同台换乘车站列表 */
        CROSS_PLATFORM_STATIONS: [],

        /** 国铁火车站 12306 购票检索站名映射 */
        MAP_12306: {
            "上海火车站": "上海",
            "上海虹桥": "上海虹桥",
            "上海南站": "上海南",
            "上海西站": "上海西"
        },

        /**
         * 生成高德地图外链
         * @param {string} stationName - 车站中文名称
         * @param {boolean} [isRailway=false] - 是否为火车站
         * @returns {string} 导航 URI
         */
        getNavigationUrl(stationName, isRailway = false) {
            const query = isRailway ? `${stationName}` : `${stationName}地铁站`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent('上海')}`;
        },

        /**
         * 生成中国铁路 12306 购票外链
         * @param {string} stationName - 车站名称
         * @returns {string} 12306 购票查询链接
         */
        getRailway12306Url(stationName) {
            const cleanName = stationName.replace(/站$/, '');
            const mappedName = this.MAP_12306[stationName] || this.MAP_12306[cleanName] || cleanName;
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(mappedName)}`;
        },

        /** 市郊铁路票务外链 */
        getSuburbanLinks() {
            return {
                timetableUrl: "http://service.shmetro.com/yxxp/index.htm",
                ticketUrl: "http://service.shmetro.com/"
            };
        },

        /**
         * 格式化所属运营公司名称
         * @param {string} rawOwnerName - 原始运营单位名称
         * @returns {string} 规范化单位名称
         */
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "上海申通地铁集团有限公司";
        },

        /**
         * 格式化多个运营公司合并字符串
         */
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，");
        },

        // 车站卡片与微缩视窗系统接口 (StaCard API)
        stacard: {
            script: './city/shanghai/stacard/script.js',
            geoDataUrl: './city/shanghai/amap_data.json',
            basePath: './city/shanghai/stacard/',
            getRenderer: () => window.ShanghaiStaCard || window.StaCard || null
        },

        /**
         * 还原上海官方线网图的站点画法（核心引擎 renderStations 的城市钩子）
         * - 普通站：垂直于线路的线路色短横
         * - 换乘站 / 国铁站：白底深灰描边胶囊，多线共站时沿站台方向拉长
         * - 未开通站：交回核心通用模板
         * @param {object} station - 处理后的车站对象（含 marker、lineColors）
         * @param {string} stationId - 车站 ID
         * @returns {{html: string, width: number, height: number, className: string}|null}
         */
        renderStationIcon(station, stationId) {
            if (station.type === "no") return null;

            const marker = station.marker || null;
            const isCapsule = marker
                ? marker.shape !== "tick"
                : (station.type === "tsf" || station.type === "rdot" || station.type === "tsfo");
            const angle = marker ? marker.angle : inferTangentAngle(station, stationId);

            if (isCapsule) {
                const short = marker ? Math.max(marker.short, CAPSULE_SHORT) : CAPSULE_SHORT;
                const long = marker ? Math.max(marker.long, short) : CAPSULE_SHORT;
                const box = Math.ceil(long + CAPSULE_STROKE * 2 + 2);
                const c = box / 2;
                const x = c - long / 2, y = c - short / 2;
                const html = `<svg viewBox="0 0 ${box} ${box}" xmlns="http://www.w3.org/2000/svg">`
                    + `<g transform="rotate(${angle} ${c} ${c})">`
                    + `<rect x="${x}" y="${y}" width="${long}" height="${short}" rx="${short / 2}" ry="${short / 2}"`
                    + ` fill="var(--map-bg)" stroke="${CAPSULE_COLOR}" stroke-width="${CAPSULE_STROKE}"/>`
                    + `</g></svg>`;
                return { html, width: box, height: box, className: "sh-marker sh-capsule" };
            }

            const long = marker ? marker.long : TICK_LONG;
            const short = marker ? marker.short : TICK_SHORT;
            const color = (station.lineColors && station.lineColors.length > 0)
                ? station.lineColors[0]
                : "var(--station-stroke)";
            const box = Math.ceil(Math.max(long, short) + 2);
            const c = box / 2;
            // marker.angle 描述长轴方向；短横长轴垂直于线路，直接按该角度摆放
            const html = `<svg viewBox="0 0 ${box} ${box}" xmlns="http://www.w3.org/2000/svg">`
                + `<g transform="rotate(${angle} ${c} ${c})">`
                + `<rect x="${c - long / 2}" y="${c - short / 2}" width="${long}" height="${short}" fill="${color}"/>`
                + `</g></svg>`;
            return { html, width: box, height: box, className: "sh-marker sh-tick" };
        },

        /** 初始化车站卡片系统 */
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({
                basePath: this.stacard.basePath,
                geoDataUrl: this.stacard.geoDataUrl,
                ...options
            });
        },

        /** 检查指定车站是否具有可展示的卡片/微缩视窗 */
        hasStaCard(stationId, lineId, stationInfo) {
            return Boolean(this.stacard.getRenderer()?.hasCard?.(stationId, lineId, stationInfo));
        },

        /** 获取车站卡片占位 HTML */
        getStaCardHtml(station, lineInfo, isCrossPlatform = false) {
            return this.stacard.getRenderer()?.getCardPlaceholderHtml?.(station, lineInfo, isCrossPlatform) || '';
        },

        /** 渲染车站详情面板内的全部卡片 */
        async renderStaCards(infoPanel, station) {
            return await this.stacard.getRenderer()?.renderPanelCards?.(infoPanel, station);
        }
    };

    // 全局导出与城市注册
    window.SHANGHAI_CITY = ShanghaiCity;
    window.CityDataManager?.registerCity?.({
        id: ShanghaiCity.id,
        name: ShanghaiCity.name,
        folder: "./city/shanghai",
        mainLogic: "./city/shanghai/shanghai.js",
        center: { x: 1415, y: 1459 },
        defaultScale: 0.6,
        mapSize: { width: 2639, height: 3693 },
        searchCity: "上海",
        title: "CGo OpenMap - 上海轨道交通线路图",
        keywords: "CGo OpenMap, 上海地铁, 申通地铁, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的上海轨道交通智能交互线路图",
        officialMapUrl: "http://service.shmetro.com/yxxp/index.htm",
        isDefault: false,
        ...ShanghaiCity
    });

    console.log("[ShanghaiCity] 上海城市专属业务逻辑与数据关系模块加载完成。");
})();
