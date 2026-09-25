/**
 * CGo OpenMap - 沈阳城市配置与能力接口
 *
 * 城市定制渲染位于 modules/，本文件只保留数据关系、运行时参数与能力桥接。
 */
(function () {
    /**
     * 换乘站图元几何 (源: assets/transfer-badge.svg, viewBox 0 0 34 24)
     * 原图前景为单条 evenodd 路径，此处按视觉元素拆成三段分别着色：
     *   ARROW_TOP    上方闭合箭头 → 第一条经停线路标识色
     *   ARROW_BOTTOM 下方闭合箭头 → 第二条经停线路标识色
     *   TEXT         中间文字轮廓 → 地图文字色 var(--text-color)
     * 背景底衬 → 地图背景色 var(--map-bg)
     */
    const TRANSFER_BADGE = {
        viewBox: "0 0 34 24",
        // 相对源图 34×24 的缩放；调这两个值即可整体改图元大小
        width: 25.5,
        height: 18,
        bg: "M0,6L0,24L5.5,19.5Q13,24,20.5,24Q28,24,33,18.5L34,18L34,0L28.5,4.5Q21,0,13.5,0Q6,0,1,5.5L0,6Z",
        arrowTop: "M1,5.5Q8.5,2.5,13.5,2.5Q18.5,2.5,27,9.5L30,7L30,16.5L22,16.5L22,18L34,18L34,0L28.5,4.5Q21,0,13.5,0Q6,0,1,5.5Z",
        arrowBottom: "M33,18.5Q25.5,21.5,20.5,21.5Q15.5,21.5,7,14.5L4,17L4,7.5L12,7.5L12,6L0,6L0,24L5.5,19.5Q13,24,20.5,24Q28,24,33,18.5Z",
        text: "M15.19,14.27Q14.63,13.86,14.38,13.33L16.56,13.33L16.56,12.65L15.99,12.65L15.99,10.58L14.81,10.58L15.53,9.61L15.53,8.98L13.48,8.98Q13.59,8.74,13.7,8.46L13.01,8.26Q12.76,8.86,12.39,9.4Q12.02,9.94,11.49,10.48L11.49,9.78L10.83,9.78L10.83,8.36L10.11,8.36L10.11,9.78L9.31,9.78L9.31,10.5L10.11,10.5L10.11,11.99Q9.36,12.26,9.13,12.34L9.3,13.12L10.11,12.79L10.11,14.45Q10.11,14.69,10.05,14.78Q9.99,14.86,9.8,14.86Q9.55,14.86,9.33,14.8L9.47,15.54Q9.68,15.58,10,15.58Q10.46,15.58,10.64,15.38Q10.83,15.19,10.83,14.71L10.83,12.51L11.54,12.25L11.38,11.48L10.83,11.71L10.83,10.5L11.47,10.5L11.29,10.68L11.72,11.24L11.94,11.03L11.94,12.65L11.29,12.65L11.29,13.33L13.48,13.33Q13.3,13.86,12.75,14.24Q12.2,14.62,11.16,14.94L11.54,15.66Q12.53,15.3,13.12,14.91Q13.72,14.52,14,13.97Q14.68,15.12,16.25,15.64L16.57,14.91Q15.75,14.67,15.19,14.27ZM23.8,13.67Q23.01,13.14,22.44,12.34L22.44,10.53L25.62,10.53L25.62,9.89L22.44,9.89L22.44,9.26Q24.03,9.18,24.93,9.11L24.85,8.48Q23.71,8.58,22.07,8.66Q20.43,8.74,19.24,8.75L19.28,9.36Q20.17,9.35,21.56,9.3L21.74,9.29L21.74,9.89L18.61,9.89L18.61,10.53L21.74,10.53L21.74,12.37Q21.2,13.12,20.48,13.61Q19.76,14.1,18.45,14.67L18.81,15.37Q19.82,14.9,20.51,14.41Q21.2,13.92,21.74,13.3L21.74,15.61L22.44,15.61L22.44,13.28Q22.98,13.92,23.72,14.42Q24.46,14.93,25.47,15.37L25.76,14.64Q24.58,14.21,23.8,13.67ZM13.09,9.66L14.64,9.66L13.92,10.58L12.36,10.58Q12.8,10.1,13.09,9.66ZM19.24,12.48Q18.67,12.63,18.57,12.65L18.7,13.24L20.26,12.78L20.26,13.16L20.91,13.16L20.91,10.76L20.26,10.76L20.26,11.22L18.77,11.22L18.77,11.79L20.26,11.79L20.26,12.2Q19.8,12.33,19.24,12.48ZM23.92,10.76L23.28,10.76L23.28,12.45Q23.28,12.86,23.46,13.03Q23.64,13.21,24.06,13.22L24.35,13.23L24.64,13.22Q25.14,13.21,25.34,13.06Q25.55,12.9,25.56,12.5L25.6,11.92L25.03,11.8Q25.03,12,25.01,12.3Q24.99,12.47,24.94,12.54Q24.88,12.62,24.77,12.64Q24.65,12.66,24.41,12.66L24.24,12.66Q24.06,12.65,23.99,12.58Q23.92,12.52,23.92,12.37L23.92,12.04Q24.94,11.65,25.45,11.38L25.2,10.85Q24.72,11.14,23.92,11.45L23.92,10.76ZM12.62,12.65L12.62,11.26L13.58,11.26L13.58,12.65L12.62,12.65ZM15.32,12.65L14.27,12.65L14.27,11.26L15.32,11.26L15.32,12.65Z"
    };

    /**
     * 普通站图元 (沈阳变体，viewBox 0 0 10 10)
     * 引擎通用模板为三层同心圆：地图底色 r=5 / 线路色 r=4.21 / 地图底色 r=3.5，
     * 最外圈地图底色会把站点与线路隔开一段白边。
     * 沈阳改为两层：去掉最外的地图底色描边，线路色环向外撑满，
     * 环宽由 0.71 加粗至 1.5（内留白半径 3.5）。
     */
    const STATION_DOT = {
        viewBox: "0 0 10 10",
        outer: 5,
        inner: 3.5
    };

    /**
     * 国铁车站图元 (rdot)：直接以铁路徽标作为站点图元，取代原 SCATTERED_DATA 叠加层。
     *
     * 几何来自 assets/railway.svg (viewBox 0 0 11 11)，此处内联而非 <img>，
     * 目的是让 CSS 变量能够生效——SVG 以 <img> 加载时处于独立文档，拿不到页面变量。
     *   底板 → #C5361E
     *   徽标图形 (2 段) → #FFFFFF
     */
    /** 国铁徽标渲染边长 (px)，源图 11×11；原 scattered 叠加层为 20 */
    const RAILWAY_SIZE = 20;
    const RAILWAY_ICON = `<svg viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">`
        + `<path d="M1.1045,-3.9192e-23 L9.8911,-3.9192e-23 C10.5047,-3.9192e-23 10.9956,0.4909 10.9956,1.1045 L10.9956,9.8911 C10.9956,10.5047 10.5047,10.9956 9.8911,10.9956 L1.1045,10.9956 C0.4909,10.9956 0,10.5047 0,9.8911 L0,1.1045 C0,0.4909 0.4909,-3.9192e-23 1.1045,-3.9192e-23" fill="#C5361E"/>`
        + `<path d="M1.669,5.1051 L1.669,5.4487 C1.669,5.4487 1.669,5.6696 1.669,5.7432 C1.6935,6.0378 1.7426,6.2587 1.8408,6.5286 C1.9635,6.9213 2.258,7.4368 2.528,7.7558 L2.6753,7.9276 C2.8716,8.0994 2.9698,8.2222 3.1907,8.3694 C3.2643,8.4185 3.5098,8.5903 3.5834,8.6149 L3.9761,8.0994 C3.9761,8.0994 4.0252,8.0504 4.0497,8.0013 C4.0497,7.9767 4.0988,7.9522 4.1234,7.9031 C4.0006,7.8786 3.8288,7.7313 3.7307,7.6577 C3.6079,7.584 3.4852,7.4613 3.387,7.3631 C2.6753,6.6514 2.3562,5.596 2.6016,4.5406 C2.6998,4.1234 2.9207,3.7307 3.1907,3.4116 C3.5098,3.0189 3.9025,2.7489 4.3933,2.5526 C5.0315,2.2826 5.866,2.2826 6.5041,2.5526 C6.9213,2.7244 7.1668,2.8962 7.4613,3.1661 C7.6086,3.2889 7.7804,3.5343 7.9031,3.6816 C8.5167,4.6142 8.5167,5.6942 8.0504,6.6514 C7.9767,6.7986 7.7804,7.0932 7.6822,7.2159 L7.5349,7.3877 C7.5349,7.3877 7.314,7.584 7.1913,7.6822 C7.1177,7.7313 7.0686,7.7558 6.995,7.8049 C6.9459,7.8295 6.8477,7.9031 6.7986,7.9276 C6.7986,7.9767 7.0195,8.2222 7.0686,8.2958 L7.3386,8.6394 C7.3386,8.6394 7.4859,8.5658 7.5349,8.5167 C7.8295,8.3449 8.0013,8.1731 8.2222,7.9276 L8.3694,7.7558 C8.4921,7.584 8.5167,7.584 8.6394,7.3877 C9.2775,6.455 9.2285,5.5714 9.2775,5.4733 L9.2775,5.0806 C9.2775,5.0806 9.253,4.786 9.2285,4.7124 C9.2285,4.5897 9.1794,4.4915 9.1548,4.3688 C9.1057,4.1479 9.0321,3.9515 8.9339,3.7552 C8.8603,3.5588 8.7376,3.387 8.6394,3.2152 C8.6149,3.1661 8.5903,3.1416 8.5658,3.0925 C8.4676,2.9453 8.1976,2.6507 8.0994,2.528 C7.854,2.3071 7.6822,2.1599 7.3877,1.988 C7.0932,1.8162 6.5777,1.5953 6.185,1.5463 C6.185,1.3499 6.1114,1.2272 5.9887,1.1536 C5.8414,1.0554 5.1051,1.0799 4.9333,1.1536 C4.8106,1.2272 4.7124,1.3499 4.7369,1.5463 C4.3688,1.5953 3.8534,1.8162 3.5343,1.988 C3.2398,2.1599 3.068,2.3071 2.8225,2.528 C2.6998,2.6262 2.528,2.8225 2.4298,2.9698 C2.4053,2.9943 2.3807,3.0434 2.3562,3.0925 C1.6199,4.197 1.7181,4.9333 1.669,5.0806" fill="#FFFFFF"/>`
        + `<path d="M3.0434,9.4494 C3.0434,9.4494 2.9943,9.7439 2.9943,9.8911 L7.9522,9.8911 C7.9522,9.8911 7.9522,9.5475 7.9276,9.4739 C7.8786,9.4003 7.6822,9.4003 7.584,9.3757 L6.455,9.1548 C6.2832,9.1303 6.0869,9.1057 5.9641,8.9585 C5.8169,8.8112 5.8169,8.6394 5.8169,8.4431 L5.8169,6.6268 C5.8169,6.3568 5.8169,6.1359 6.1359,6.0378 C6.3568,5.9641 6.6023,5.8905 6.8477,5.8414 C6.8477,5.7678 6.8477,5.6205 6.8477,5.5224 C6.8477,5.2278 6.8723,4.9333 6.6514,4.7369 C6.4796,4.6142 6.3814,4.6142 6.1359,4.5897 C5.7187,4.5651 5.3015,4.5651 4.8842,4.5897 C4.6879,4.5897 4.4915,4.6142 4.3688,4.7124 C4.2461,4.8106 4.1724,4.9333 4.1724,5.1787 C4.1724,5.3751 4.1724,5.6205 4.1724,5.8169 C4.197,5.8169 4.7124,5.9641 4.8106,5.9887 C5.0069,6.0378 5.2033,6.1114 5.2033,6.4059 C5.2033,6.9459 5.2033,7.4859 5.2033,8.0504 C5.2033,8.2713 5.2278,8.6394 5.1542,8.8112 C5.056,9.0321 4.8842,9.0812 4.6388,9.1303 L3.6079,9.3266 C3.6079,9.3266 3.1171,9.4494 3.068,9.4739" fill="#FFFFFF"/>`
        + `</svg>`;

    const ShenyangCity = {
        id: "shenyang",
        name: "沈阳",
        searchCity: "沈阳",
        center: { x: 1000, y: 800 },
        defaultScale: 1.0,
        mapSize: { width: 1944, height: 1680 },
        LINE_META: {},
        LINE_SORT_ORDER: [],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["Rwy"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        /**
         * 城市级站点图元接管（core/ 保持城市无关，沈阳专属画法只放本目录）：
         * - tsf       换乘站 → 线路色换乘徽标（上/下箭头取前两条线路色，中间文字取地图文字色）
         * - dot/tsfo  普通站 → 去掉地图底色描边，线路色环加粗
         * 其余站型（no / rdot 等）返回 null，回落引擎通用模板。
         */
        renderStationIcon(station) {
            if (!station) return null;
            const colors = Array.isArray(station.lineColors) ? station.lineColors : [];
            const first = colors[0] || "var(--station-stroke)";

            if (station.type === "tsf") {
                const bottom = colors[1] || first;
                const b = TRANSFER_BADGE;
                return {
                    html: `<svg viewBox="${b.viewBox}" xmlns="http://www.w3.org/2000/svg">`
                        + `<path d="${b.bg}" fill="var(--map-bg)"/>`
                        + `<path d="${b.arrowTop}" fill="${first}" fill-rule="evenodd"/>`
                        + `<path d="${b.arrowBottom}" fill="${bottom}" fill-rule="evenodd"/>`
                        + `<path d="${b.text}" fill="var(--text-color)" fill-rule="evenodd"/>`
                        + `</svg>`,
                    className: "sy-transfer-badge",
                    width: b.width,
                    height: b.height,
                    zIndex: 20
                };
            }

            if (station.type === "dot" || station.type === "tsfo") {
                const d = STATION_DOT;
                return {
                    html: `<svg viewBox="${d.viewBox}" xmlns="http://www.w3.org/2000/svg">`
                        + `<circle cx="5" cy="5" r="${d.outer}" fill="${first}"/>`
                        + `<circle cx="5" cy="5" r="${d.inner}" fill="var(--map-bg)"/>`
                        + `</svg>`,
                    className: "sy-station-dot"
                    // 尺寸与 z 序沿用 css/style.css 的 .dot / .tsfo，不在此覆盖
                };
            }

            if (station.type === "rdot") {
                return {
                    html: RAILWAY_ICON,
                    className: "sy-railway-badge",
                    width: RAILWAY_SIZE,
                    height: RAILWAY_SIZE
                };
            }

            return null;
        },
        getStationLabelStyle(station) {
            if (station?.labelStyle) return station.labelStyle;
            if (station?.type !== "tsf" || station.cn === "合作街") return null;
            return "callout";
        },
        isTramLine(lineId) {
            const line = (typeof linesData !== "undefined" && Array.isArray(linesData))
                ? linesData.find((item) => item?.id === lineId)
                : null;
            return Boolean(
                String(lineId || "").toUpperCase().startsWith("HNT")
                || String(line?.name || "").includes("有轨")
            );
        },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((lineId) => this.isTramLine(lineId)));
        },
        maintainers: [
            { name: "jrzhang", role: "城市主理人", github: "https://github.com/beepingflijo" },
            { name: "从恒隆到细河", role: "运营数据支持" },
            { name: "普兰店大鹅", role: "有轨数据支持" }
        ],
        dataFiles: {
            stanameCsvUrl: "./city/shenyang/staname.csv",
            amapDataUrl: "./city/shenyang/amap_data.json"
        },
        /**
         * 高德导航搜索词（与高德 POI 命名一致，三城统一口径，已实测）：
         *   有轨电车站 → 「站名(有轨电车站)」
         *   火车站 / 市郊铁路 → 「站名」（裸名，高德该 POI 原名即如此）
         *   地铁站 → 「站名(地铁站)」
         * 站型判断走本城市 isTramStation；station 由 core 作为第三参传入。
         */
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const query = this.isTramStation(context?.station)
                ? `${stationName}(有轨电车站)`
                : isRailway ? stationName : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("沈阳")}`;
        },
        getRailway12306Url(stationName) {
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(stationName.replace(/站$/, ""))}`;
        },
        getSuburbanLinks() {
            return null;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "未知运营单位";
        },
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，");
        },
        stacard: {
            script: "./city/shenyang/stacard/script.js",
            geoDataUrl: "./city/shenyang/amap_data.json",
            basePath: "./city/shenyang/stacard/",
            getRenderer: () => window.CGoStaCard || null
        },
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({
                basePath: this.stacard.basePath,
                geoDataUrl: this.stacard.geoDataUrl,
                ...options
            });
        },
        hasStaCard(stationId, lineId, stationInfo) {
            return Boolean(this.stacard.getRenderer()?.hasCard?.(stationId, lineId, stationInfo));
        },
        getStaCardHtml(station, lineInfo, isCrossPlatform = false) {
            return this.stacard.getRenderer()?.getCardPlaceholderHtml?.(station, lineInfo, isCrossPlatform) || "";
        },
        async renderStaCards(infoPanel, station) {
            return await this.stacard.getRenderer()?.renderPanelCards?.(infoPanel, station);
        },
        stationBoard: {
            scripts: [
                "modules/shenyang_map.js",
                "modules/shenyang_station_board.js",
                "modules/shenyang_station_title.js",
                "modules/shenyang_calligraphy.js",
                "modules/shenyang_cultural.js",
                "modules/shenyang_service_info.js"
            ],
            modules: {
                "header-controls": { enabled: true, order: 10 },
                "shenyang-fangcheng-decoration": { enabled: true, targetTab: "header", order: 15 },
                // 内置中英文标题由沈阳题字标题模块接管（题字站展示题字图，其余站回退标准结构）
                "header-title": { enabled: false },
                "shenyang-calligraphy-title": { enabled: true, targetTab: "header", order: 20 },
                "header-badges": { enabled: true, order: 30 },
                "stacard": { enabled: true, targetTab: "line-tab", order: 10 },
                "shenyang-timetable": { enabled: true, targetTab: "line-tab", order: 15 },
                "shenyang-calligrapher-intro": { enabled: true, targetTab: "station-info", order: 12 },
                "shenyang-cultural-destinations": { enabled: true, targetTab: "station-info", order: 15 },
                "adjacent-stations": { enabled: true, targetTab: "line-tab", order: 20 },
                "transfers": { enabled: true, targetTab: "line-tab", order: 30 },
                "station-type": { enabled: true, targetTab: "station-info", order: 10 },
                "operators": { enabled: true, targetTab: "station-info", order: 20 },
                "footer-actions": { enabled: true, order: 10 }
            }
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "260926.1702";
        // 城市私有数据（须早于依赖它的模块加载）
        document.write(`<script src="./city/shenyang/data_calligraphy.js?v=${version}"><\/script>`);
        // 共享层（本目录下，须早于各城模块加载）
        document.write(`<script src="./city/shenyang/shared/timetable-renderer.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/station-title.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/tip-card.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/calligraphy.js?v=${version}"><\/script>`);
        // 未开通区段与车站的开通时刻（共享层读取并应用）
        document.write(`<script src="./city/shenyang/shared/opening-schedule.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/data_opening.js?v=${version}"><\/script>`);
        (ShenyangCity.stationBoard?.scripts || []).forEach((scriptPath) => {
            document.write(`<script src="./city/shenyang/${scriptPath}?v=${version}"><\/script>`);
        });
    }

    window.SHENYANG_CITY = ShenyangCity;
    window.CURRENT_CITY = ShenyangCity;
    loadStationBoardModules();
    window.CityDataManager?.registerCity?.({
        id: ShenyangCity.id,
        name: ShenyangCity.name,
        folder: "./city/shenyang",
        mainLogic: "./city/shenyang/shenyang.js",
        center: ShenyangCity.center,
        defaultScale: ShenyangCity.defaultScale,
        mapSize: ShenyangCity.mapSize,
        searchCity: ShenyangCity.searchCity,
        title: "CGo OpenMap - 沈阳地铁线网图",
        keywords: "CGo OpenMap, 沈阳地铁, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的沈阳地铁智能交互线路图",
        isDefault: false,
        ...ShenyangCity
    });
})();
