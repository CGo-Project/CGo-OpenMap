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
            { name: "从恒隆到细河", role: "运营数据支持" }
        ],
        dataFiles: {
            stanameCsvUrl: "./city/shenyang/staname.csv",
            amapDataUrl: "./city/shenyang/amap_data.json"
        },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const isTram = context?.isTram === true
                || this.isTramStation(context?.station);
            const query = isTram
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
            getRenderer: () => window.ShenyangStaCard || window.StaCard || null
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
                "modules/shenyang_cultural.js",
                "modules/shenyang_service_info.js"
            ],
            modules: {
                "header-controls": { enabled: true, order: 10 },
                "shenyang-fangcheng-decoration": { enabled: true, targetTab: "header", order: 15 },
                "header-title": { enabled: true, order: 20 },
                "header-badges": { enabled: true, order: 30 },
                "shenyang-tramway-navigation": { enabled: true, targetTab: "footer", order: 11 },
                "stacard": { enabled: true, targetTab: "line-tab", order: 10 },
                "shenyang-service-info": { enabled: true, targetTab: "line-tab", order: 15 },
                "shenyang-cultural-destinations": { enabled: true, targetTab: "station-info", order: 5 },
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
        const version = "260911.260000";
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
