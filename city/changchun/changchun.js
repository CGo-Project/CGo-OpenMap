/**
 * CGo OpenMap - 长春城市配置与能力接口
 *
 * 线路与站点数据来自官方交互线路图；本文件只负责城市运行时元数据。
 */
(function () {
    /**
     * 普通站图元 (长春变体，viewBox 0 0 10 10)
     *
     * 引擎通用模板为三层同心圆：地图底色 r=5 / 线路色 r=4.21 / 地图底色 r=3.5，
     * 最外圈地图底色会把站点与线路隔开一段白边。
     * 长春：去掉最外的地图底色描边，线路色环向外撑满，
     * 环宽由 0.71 加粗至 1.2（内留白半径 3.8）。
     */
    /**
     * 换乘站图元 (源: assets/transfer-badge.svg, viewBox 0 0 48 48)
     *
     * 源图由三层构成，按要求分别着色：
     *   白色填充圆   → 地图背景色 var(--map-bg)
     *   黑色描边圆环 → 地图文字色 var(--text-color)
     *   两个灰色旋转箭头 → 车站前两条经停线路的标识色（lineColors[0] / lineColors[1]）
     * 源图的圆形 clipPath 已去除：所有图元都落在 r=24 之内，保留反而会因多站复用产生重复 id。
     */
    /** 换乘徽标渲染边长 (px)，源图 48×48；调整此值即可整体改大小 */
    const CC_TSF_SIZE = 24;
    const CC_TSF_ARROW_0 = "M30,5.97Q28.55,5.49,27.04,5.24Q25.53,5,24,5Q23.53,5,23.07,5.02Q22.6,5.05,22.14,5.09Q21.67,5.14,21.21,5.21Q20.75,5.27,20.29,5.37Q19.84,5.46,19.38,5.57Q18.93,5.68,18.48,5.82Q18.04,5.95,17.6,6.11Q17.16,6.27,16.73,6.45Q16.3,6.62,15.88,6.82Q15.45,7.02,15.04,7.24Q14.63,7.46,14.23,7.7Q13.83,7.94,13.44,8.2Q13.06,8.46,12.68,8.74Q12.31,9.02,11.95,9.31Q11.59,9.61,11.24,9.92Q10.89,10.24,10.56,10.56Q10.24,10.89,9.92,11.24Q9.61,11.59,9.31,11.95Q9.02,12.31,8.74,12.68Q8.46,13.06,8.2,13.44Q7.94,13.83,7.7,14.23Q7.46,14.63,7.24,15.04Q7.02,15.45,6.82,15.88Q6.62,16.3,6.45,16.73Q6.27,17.16,6.11,17.6Q5.95,18.04,5.82,18.48Q5.68,18.93,5.57,19.38Q5.46,19.84,5.37,20.29Q5.27,20.75,5.21,21.21Q5.14,21.67,5.09,22.14Q5.05,22.6,5.02,23.07Q5,23.53,5,24Q5,24.98,5.1,25.96Q5.2,26.94,5.4,27.9Q5.61,28.86,5.91,29.8Q6.21,30.74,6.6,31.64L3,35L18,36.5L18,21L15,23.8Q15.01,23.58,15.02,23.36Q15.04,23.15,15.06,22.93Q15.09,22.71,15.13,22.5Q15.16,22.28,15.21,22.07Q15.26,21.86,15.31,21.65Q15.37,21.44,15.44,21.23Q15.5,21.02,15.58,20.82Q15.66,20.62,15.74,20.42Q15.83,20.22,15.93,20.02Q16.02,19.83,16.13,19.64Q16.23,19.44,16.35,19.26Q16.46,19.07,16.59,18.9Q16.71,18.72,16.84,18.54Q16.98,18.37,17.12,18.2Q17.26,18.04,17.4,17.88Q17.55,17.72,17.71,17.56Q17.86,17.41,18.03,17.27Q18.19,17.12,18.36,16.99Q18.53,16.85,18.7,16.72Q18.88,16.59,19.06,16.47Q19.25,16.36,19.43,16.24Q19.62,16.13,19.81,16.03Q20.01,15.93,20.2,15.84Q20.4,15.75,20.6,15.67Q20.8,15.58,21.01,15.51Q21.22,15.44,21.42,15.38Q21.63,15.31,21.84,15.26Q22.06,15.21,22.27,15.17Q22.48,15.13,22.7,15.09Q22.91,15.06,23.13,15.04Q23.35,15.02,23.56,15.01Q23.78,15,24,15Q24.41,15,24.82,15.04Q25.23,15.07,25.63,15.15Q26.04,15.22,26.43,15.33Q26.83,15.45,27.21,15.59Q27.6,15.74,27.96,15.92Q28.33,16.1,28.68,16.31Q29.03,16.53,29.36,16.77Q29.69,17.02,30,17.29L30,5.97Z";
    const CC_TSF_ARROW_1 = "M72,43.97Q70.55,43.49,69.04,43.24Q67.53,43,66,43Q65.53,43,65.07,43.02Q64.6,43.05,64.14,43.09Q63.67,43.14,63.21,43.21Q62.75,43.27,62.29,43.37Q61.84,43.46,61.38,43.57Q60.93,43.68,60.48,43.82Q60.04,43.95,59.6,44.11Q59.16,44.27,58.73,44.45Q58.3,44.62,57.88,44.82Q57.45,45.02,57.04,45.24Q56.63,45.46,56.23,45.7Q55.83,45.94,55.44,46.2Q55.06,46.46,54.68,46.74Q54.31,47.02,53.95,47.31Q53.59,47.61,53.24,47.92Q52.89,48.24,52.56,48.56Q52.24,48.89,51.92,49.24Q51.61,49.59,51.31,49.95Q51.02,50.31,50.74,50.68Q50.46,51.06,50.2,51.44Q49.94,51.83,49.7,52.23Q49.46,52.63,49.24,53.04Q49.02,53.45,48.82,53.88Q48.62,54.3,48.45,54.73Q48.27,55.16,48.11,55.6Q47.95,56.04,47.82,56.48Q47.68,56.93,47.57,57.38Q47.46,57.84,47.37,58.29Q47.27,58.75,47.21,59.21Q47.14,59.67,47.09,60.14Q47.05,60.6,47.02,61.07Q47,61.53,47,62Q47,62.98,47.1,63.96Q47.2,64.94,47.4,65.9Q47.61,66.86,47.91,67.8Q48.21,68.74,48.6,69.64L45,73L60,74.5L60,59L57,61.8Q57.01,61.58,57.02,61.36Q57.04,61.15,57.06,60.93Q57.09,60.71,57.13,60.5Q57.16,60.28,57.21,60.07Q57.26,59.86,57.31,59.65Q57.37,59.44,57.44,59.23Q57.5,59.02,57.58,58.82Q57.66,58.62,57.74,58.42Q57.83,58.22,57.93,58.02Q58.02,57.83,58.13,57.64Q58.23,57.44,58.35,57.26Q58.46,57.07,58.59,56.9Q58.71,56.72,58.84,56.54Q58.98,56.37,59.12,56.2Q59.26,56.04,59.4,55.88Q59.55,55.72,59.71,55.56Q59.86,55.41,60.03,55.27Q60.19,55.12,60.36,54.99Q60.53,54.85,60.7,54.72Q60.88,54.59,61.06,54.47Q61.25,54.36,61.43,54.24Q61.62,54.13,61.81,54.03Q62.01,53.93,62.2,53.84Q62.4,53.75,62.6,53.67Q62.8,53.58,63.01,53.51Q63.22,53.44,63.42,53.38Q63.63,53.31,63.84,53.26Q64.06,53.21,64.27,53.17Q64.48,53.13,64.7,53.09Q64.91,53.06,65.13,53.04Q65.35,53.02,65.56,53.01Q65.78,53,66,53Q66.41,53,66.82,53.04Q67.23,53.07,67.63,53.15Q68.04,53.22,68.43,53.33Q68.83,53.45,69.21,53.59Q69.6,53.74,69.96,53.92Q70.33,54.1,70.68,54.31Q71.03,54.53,71.36,54.77Q71.69,55.02,72,55.29L72,43.97Z";
    const CC_TSF_ICON = (a, b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">`
        + `<ellipse cx="24" cy="24" rx="24" ry="24" fill="var(--map-bg)"/>`
        + `<ellipse cx="24" cy="24" rx="23.5" ry="23.5" fill="none" stroke="var(--text-color)" stroke-width="1"/>`
        + `<path d="${CC_TSF_ARROW_0}" fill="${a}" fill-rule="evenodd"/>`
        + `<path d="${CC_TSF_ARROW_1}" fill="${b}" fill-rule="evenodd" transform="matrix(-1,0,0,-1,90,86)"/>`
        + `</svg>`;

    /**
     * 国铁车站图元 (rdot)：直接以铁路徽标作为站点图元，取代原 SCATTERED_DATA 叠加层。
     *
     * 几何来自 assets/railway.svg (viewBox 0 0 11 11)，此处内联而非 <img>，
     * 目的是让 CSS 变量能够生效——SVG 以 <img> 加载时处于独立文档，拿不到页面变量。
     *   底板 → var(--text-color, #00263b)
     *   徽标图形 (2 段) → var(--map-bg, #ffffff)
     */
    /** 国铁徽标渲染边长 (px)，源图 11×11；原 scattered 叠加层为 20 */
    const RAILWAY_SIZE = 20;
    const RAILWAY_ICON = `<svg viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">`
        + `<path d="M1.1045,-3.9192e-23 L9.8911,-3.9192e-23 C10.5047,-3.9192e-23 10.9956,0.4909 10.9956,1.1045 L10.9956,9.8911 C10.9956,10.5047 10.5047,10.9956 9.8911,10.9956 L1.1045,10.9956 C0.4909,10.9956 0,10.5047 0,9.8911 L0,1.1045 C0,0.4909 0.4909,-3.9192e-23 1.1045,-3.9192e-23" fill="var(--text-color, #00263b)"/>`
        + `<path d="M1.669,5.1051 L1.669,5.4487 C1.669,5.4487 1.669,5.6696 1.669,5.7432 C1.6935,6.0378 1.7426,6.2587 1.8408,6.5286 C1.9635,6.9213 2.258,7.4368 2.528,7.7558 L2.6753,7.9276 C2.8716,8.0994 2.9698,8.2222 3.1907,8.3694 C3.2643,8.4185 3.5098,8.5903 3.5834,8.6149 L3.9761,8.0994 C3.9761,8.0994 4.0252,8.0504 4.0497,8.0013 C4.0497,7.9767 4.0988,7.9522 4.1234,7.9031 C4.0006,7.8786 3.8288,7.7313 3.7307,7.6577 C3.6079,7.584 3.4852,7.4613 3.387,7.3631 C2.6753,6.6514 2.3562,5.596 2.6016,4.5406 C2.6998,4.1234 2.9207,3.7307 3.1907,3.4116 C3.5098,3.0189 3.9025,2.7489 4.3933,2.5526 C5.0315,2.2826 5.866,2.2826 6.5041,2.5526 C6.9213,2.7244 7.1668,2.8962 7.4613,3.1661 C7.6086,3.2889 7.7804,3.5343 7.9031,3.6816 C8.5167,4.6142 8.5167,5.6942 8.0504,6.6514 C7.9767,6.7986 7.7804,7.0932 7.6822,7.2159 L7.5349,7.3877 C7.5349,7.3877 7.314,7.584 7.1913,7.6822 C7.1177,7.7313 7.0686,7.7558 6.995,7.8049 C6.9459,7.8295 6.8477,7.9031 6.7986,7.9276 C6.7986,7.9767 7.0195,8.2222 7.0686,8.2958 L7.3386,8.6394 C7.3386,8.6394 7.4859,8.5658 7.5349,8.5167 C7.8295,8.3449 8.0013,8.1731 8.2222,7.9276 L8.3694,7.7558 C8.4921,7.584 8.5167,7.584 8.6394,7.3877 C9.2775,6.455 9.2285,5.5714 9.2775,5.4733 L9.2775,5.0806 C9.2775,5.0806 9.253,4.786 9.2285,4.7124 C9.2285,4.5897 9.1794,4.4915 9.1548,4.3688 C9.1057,4.1479 9.0321,3.9515 8.9339,3.7552 C8.8603,3.5588 8.7376,3.387 8.6394,3.2152 C8.6149,3.1661 8.5903,3.1416 8.5658,3.0925 C8.4676,2.9453 8.1976,2.6507 8.0994,2.528 C7.854,2.3071 7.6822,2.1599 7.3877,1.988 C7.0932,1.8162 6.5777,1.5953 6.185,1.5463 C6.185,1.3499 6.1114,1.2272 5.9887,1.1536 C5.8414,1.0554 5.1051,1.0799 4.9333,1.1536 C4.8106,1.2272 4.7124,1.3499 4.7369,1.5463 C4.3688,1.5953 3.8534,1.8162 3.5343,1.988 C3.2398,2.1599 3.068,2.3071 2.8225,2.528 C2.6998,2.6262 2.528,2.8225 2.4298,2.9698 C2.4053,2.9943 2.3807,3.0434 2.3562,3.0925 C1.6199,4.197 1.7181,4.9333 1.669,5.0806" fill="var(--map-bg, #ffffff)"/>`
        + `<path d="M3.0434,9.4494 C3.0434,9.4494 2.9943,9.7439 2.9943,9.8911 L7.9522,9.8911 C7.9522,9.8911 7.9522,9.5475 7.9276,9.4739 C7.8786,9.4003 7.6822,9.4003 7.584,9.3757 L6.455,9.1548 C6.2832,9.1303 6.0869,9.1057 5.9641,8.9585 C5.8169,8.8112 5.8169,8.6394 5.8169,8.4431 L5.8169,6.6268 C5.8169,6.3568 5.8169,6.1359 6.1359,6.0378 C6.3568,5.9641 6.6023,5.8905 6.8477,5.8414 C6.8477,5.7678 6.8477,5.6205 6.8477,5.5224 C6.8477,5.2278 6.8723,4.9333 6.6514,4.7369 C6.4796,4.6142 6.3814,4.6142 6.1359,4.5897 C5.7187,4.5651 5.3015,4.5651 4.8842,4.5897 C4.6879,4.5897 4.4915,4.6142 4.3688,4.7124 C4.2461,4.8106 4.1724,4.9333 4.1724,5.1787 C4.1724,5.3751 4.1724,5.6205 4.1724,5.8169 C4.197,5.8169 4.7124,5.9641 4.8106,5.9887 C5.0069,6.0378 5.2033,6.1114 5.2033,6.4059 C5.2033,6.9459 5.2033,7.4859 5.2033,8.0504 C5.2033,8.2713 5.2278,8.6394 5.1542,8.8112 C5.056,9.0321 4.8842,9.0812 4.6388,9.1303 L3.6079,9.3266 C3.6079,9.3266 3.1171,9.4494 3.068,9.4739" fill="var(--map-bg, #ffffff)"/>`
        + `</svg>`;

    const CC_DOT_ICON = (color) => `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">`
        + `<circle cx="5" cy="5" r="5" fill="${color}"/>`
        + `<circle cx="5" cy="5" r="3.8" fill="var(--map-bg)"/>`
        + `</svg>`;

    /**
     * 长春公交集团标志（源: assets/ccgj.svg，viewBox 0 0 60 60）
     *
     * 有轨电车 G54/G55 归长春公交集团运营，官网查询也落在公交集团平台，
     * 图标不能沿用长春轨道交通的徽标。与上面的国铁徽标同样内联而非 <img>，
     * 目的是让 fill 吃到 currentColor，跟随按钮文字色并适配亮/暗主题。
     */
    const CCGJ_ICON = `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">`
        + `<path d="M2.5,53Q15,48,30,48Q45,48,57,53L30,6L2.5,53Z" fill="currentColor" fill-rule="evenodd"/>`
        + `</svg>`;

    const ChangchunCity = {
        id: "changchun",
        name: "长春",
        themeColor: "#C9062C",
        searchCity: "长春",
        center: { x: 1150, y: 950 },
        defaultScale: 0.7,
        mapSize: { width: 2300, height: 2100 },
        officialMapUrl: "http://www.ccqg.com/metro-map/metromap_new/ccSubwayMap1.html",
        LINE_META: {},
        LINE_SORT_ORDER: ["CCM01", "CCM02", "CCM03", "CCM04", "CCM05", "CCM06", "CCM07", "CCM08"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["Rwy"],
        /**
         * 有轨电车线路 ID；用于区分地铁站 / 有轨站（侧栏标题、导航链接等）。
         */
        TRAM_LINES: ["CCG54", "CCG55"],
        isTramLine(lineId) {
            if (this.TRAM_LINES.includes(lineId)) return true;
            const line = (typeof linesData !== "undefined" && Array.isArray(linesData))
                ? linesData.find((item) => item?.id === lineId)
                : null;
            return /有轨/.test(String(line?.name || ""));
        },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((lineId) => this.isTramLine(lineId)));
        },
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        dataFiles: {
            amapDataUrl: "./city/changchun/amap_data.json",
            stanameCsvUrl: "./city/changchun/staname.csv"
        },
        /**
         * 城市级站点图元接管（core/ 保持城市无关，长春专属画法只放本目录）：
         * dot / tsfo 去掉引擎模板最外的地图底色描边，线路色环加粗至 1.2。
         * 尺寸与 z 序沿用 css/style.css 的 .dot / .tsfo，不在此覆盖。
         * 换乘站 tsf 与其余站型返回 null，回落引擎通用模板。
         */
        renderStationIcon(station) {
            if (!station) return null;
            const colors = Array.isArray(station.lineColors) ? station.lineColors : [];
            const first = colors[0] || "var(--station-stroke)";

            if (station.type === "dot" || station.type === "tsfo") {
                return { html: CC_DOT_ICON(first), className: "cc-station-dot" };
            }

            if (station.type === "tsf") {
                const second = colors[1] || first;
                return {
                    html: CC_TSF_ICON(first, second),
                    className: "cc-transfer-badge",
                    width: CC_TSF_SIZE,
                    height: CC_TSF_SIZE
                };
            }

            if (station.type === "rdot") {
                return {
                    html: RAILWAY_ICON,
                    className: "cc-railway-badge",
                    width: RAILWAY_SIZE,
                    height: RAILWAY_SIZE
                };
            }

            return null;
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
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("长春")}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName && rawOwnerName !== "未知运营"
                ? rawOwnerName
                : "长春市轨道交通集团有限公司";
        },
        formatCompanyString(companyList) {
            const normalized = companyList.map((name) => this.formatOwnerName(name));
            return [...new Set(normalized)].join("，") || this.formatOwnerName("");
        },
        stacard: {
            script: "./city/changchun/stacard/script.js",
            geoDataUrl: "./city/changchun/amap_data.json",
            basePath: "./city/changchun/stacard/",
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
                "modules/changchun_service_info.js",
                "modules/changchun_station_title.js",
                "modules/changchun_facilities.js",
                "modules/changchun_exits.js"
            ],
            // 出入口独立页签（自定义 tab），渲染在「车站信息」之前
            tabs: [
                { id: "changchun-exits", title: "出入口", icon: "gate" }
            ],
            modules: {
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" },
                "changchun-timetable": { enabled: true, order: 15, targetTab: "line-tab" },
                // 官方公众号表格里的设施位置（卫生间 / 母婴室 / 无障碍电梯 / 升降平台 /
                // 售卖机 / 充电宝 / AED / 自助照相机）：配置驱动，与沈阳、大连同用共享层
                "changchun-facilities": { enabled: true, targetTab: "station-info", order: 6 },
                // 出入口页签（自定义 tab，见上方 tabs）
                "changchun-exits": { enabled: true, targetTab: "changchun-exits", order: 10 }
            }
        }
    };

    /**
     * 出入口清单的筛选模式（共享层 exits.js 读取）
     * 长春官方表格里的无障碍设施有「无障碍电梯」与「升降平台」两类，故无障碍模式取两者。
     * 官方未提供扶梯数据，故没有「携带行李」模式。
     */
    window.CGO_EXIT_FILTERS = [
        { id: "accessible", name: "无障碍", icon: "vi-stn", types: ["elevator", "a11yplatform"] }
    ];

    /**
     * 出口垂直交通的搬迁声明（共享层 shared/exit-vertical.js 读取）
     *
     * 长春设施表里「无障碍电梯 / 升降平台」的位置大多**直接以出口编号开头**
     * （「D口」「B口」「A、C口通道」「A2口升降平台」「DC口(升降平台)」），另有「站外C口」
     * 以「站外」开头——这些出口本身就是设施的落点，故按「出口编号开头 / 站外开头」两条前缀搬走；
     * 不以出口开头的位置（「换乘通道，站厅层中部」「站台层北侧」「站厅近B口处」「站内A口」）
     * 属于站内垂直交通、或只是位置靠近出口，一律留在车站设施板块不动。
     */
    window.CGO_EXIT_VERTICAL = {
        patterns: [
            /^[A-Za-z]{1,2}\d{0,2}(?:\s*[、,，和及]\s*[A-Za-z]{1,2}\d{0,2})*\s*口/,
            /^站外/
        ],
        types: {
            elevator: { name: "无障碍电梯", icon: "elevator" },
            a11yplatform: { name: "升降平台", icon: "a11yplatform" }
        }
    };

    /**
     * 行程规划的城市侧配置
     *
     * 共享层负责算法、面板、坐标索引与站外换乘收集，本城只描述「数据长什么样」：
     * - coords：坐标兜底数据源 —— 里程以 data_lines.js 的 distances 为准（地铁取自长春
     *   轨道交通官网「行程查询」接口的实测站间距；有轨 G54/G55 为 OSM 走向实测），
     *   仅未开通段（"?"）回退坐标估算
     * - reader：把抄录的时刻摊平成构建器要的时间条目（dest / period / label / time）
     * - fareSystems / fare：计费系统划分与票价规则（地铁轻轨并网，有轨各线单独购票）
     * 上述配置都在实际规划时才被读取，故不必担心此刻共享层尚未加载。
     */
    window.CGO_ROUTE_CONFIG = {
        coords: ChangchunCity.dataFiles.amapDataUrl,
        cityIcon: "changchun",
        /**
         * 官网查询按钮的图标：地铁与轻轨指向长春轨道交通官网，用 CGoUI 内置城市徽标；
         * 有轨电车（G54/G55）归长春公交集团，改用公交集团标志（内联 SVG 才能染色）。
         */
        officialIcon(lineId) {
            return ChangchunCity.isTramLine(lineId) ? { svg: CCGJ_ICON } : { name: "changchun" };
        },
        /**
         * 计费系统：地铁与轻轨同网同价（CCM* 按制式默认并网）；G54 与 G55 各自购票
         * —— 两线在共线段各站可互相换乘，但换乘须重新购票。
         */
        fareSystems: {
            "CCG54": "tram-54",
            "CCG55": "tram-55"
        },
        /**
         * 票价规则（按计费系统，单位：元）
         * - metro：长春市发改委《轨道交通实行同网同价》方案——轻轨与地铁同价，
         *   2 元起步可乘 7 公里，3~6 元的分界里程依次为 7 / 13 / 19 / 27 / 35 公里，
         *   35 公里以上每 1 元可乘 10 公里
         * - tram-54 / tram-55：单一票价 2 元（长春公交官网口径）
         *
         * ⚠️ 计价口径的已知偏差：本表按**站距**（data_lines.js 的 distances）套费率，
         * 而票价实际按**计价里程**分档结算 —— 两者不是同一套数，**档位分界点附近的站对
         * 可能错一档**（同一段路在临界处差 1 元）。本城站距取自长春轨道交通官网「行程
         * 查询」接口下发的实测站间距，来源较可靠；仅 1 号线南延、3 号线南延等未开通段
         * 为 "?" 占位（该段走坐标兜底）。福州已改用官网抓取的站间票价表
         * （city/fuzhou/data_official_fare.js，10302 组）消除该误差，本城暂维持按费率
         * 推算。若要完全对齐，需拿到本城官网的分站票价表。
         */
        fare: {
            metro(km) {
                const cuts = [7, 13, 19, 27, 35];
                if (km <= cuts[0]) return 2;
                for (let i = 1; i < cuts.length; i += 1) {
                    if (km <= cuts[i]) return i + 2;
                }
                return 6 + Math.ceil((km - 35) / 10);
            },
            "tram-54"() {
                return 2;
            },
            "tram-55"() {
                return 2;
            }
        },
        /**
         * 站外换乘的步行时间（分钟）。键为 `起点ID|终点ID`，逐对覆盖共享层的 6 分钟
         * 默认值（机制见 shared/route-data.js）。
         *
         * 口径为「出站 → 步行 → 进站 → 到站台」的总时间。2026-10-06 起并入高德地图
         * 步行路径规划：取「出站口 POI → 对方站点」的步行距离 ÷ 60 米/分钟 + 3 分钟
         * （进出站安检与上下站台）。国铁站一律以出站口为起点 —— 长春站有南北两个出站口，
         * 走哪个差一倍以上，故按配对分别取北 / 南出站口（见下方逐条注释）。
         *
         * 本城 `data_virtual_transfers.js` 登记了 9 组站外配对，已录入 8 组；
         * 仅东大桥（4 号线 0424 ⇄ 5 号线 0501）留空 —— 两线站厅不连通、须出站换乘
         * （维基「东大桥站」条目 interchange 直书「出站换乘」），而 amap_data.json 里
         * 两站坐标完全相同，高德步行结果恒为 0 米，无法作为口径；待现场实测或官方
         * 出站换乘指引补录（未录时回落共享层 6 分钟默认值）。
         *
         * 两个方向写同一分钟数 —— 步行时间与方向无关。
         */
        walkMinutes: {
            // 国铁长春站（北出站口）⇄ 长春站北（1/4 号线，北广场）：高德 357 米 → 9 分钟。
            "CCT|0124": 9, "0124|CCT": 9,
            // 国铁长春站（南出站口）⇄ 长春站（1/3 号线，南广场换乘中心）：高德 193 米 → 6 分钟。
            "CCT|0125": 6, "0125|CCT": 6,
            // 国铁长春西站（南 1 出站口）⇄ 长春西站（2/6 号线）：高德 325 米 → 8 分钟
            // （本地宝载「长春西站换乘地铁不需要出站」，与二者同处站前换乘区一致）。
            "CRT|0225": 8, "0225|CRT": 8,
            // 国铁长春西站（南 1 出站口）⇄ 有轨 55 路长春西站：高德 231 米 → 7 分钟
            // （55 路站点表载该站位于国铁长春西站东北出口）。
            "CRT|G5519": 7, "G5519|CRT": 7,
            // 长春西站（2/6 号线）⇄ 有轨 55 路长春西站：高德 252 米 → 7 分钟。
            "0225|G5519": 7, "G5519|0225": 7,
            // 有轨 54 路宽平大桥 ⇄ 宽平桥（3 号线）：高德 138 米 → 5 分钟。
            "G5406|0331": 5, "0331|G5406": 5,
            // 有轨 54 路景阳大路 ⇄ 万福街（2 号线）：高德 333 米 → 9 分钟。
            "G5412|0229": 9, "0229|G5412": 9,
            // 有轨 54/55 路工农大路 ⇄ 红旗街（5 号线）：高德 61 米 → 4 分钟。
            "G5401|0507": 4, "0507|G5401": 4
        },
        /**
         * 站内换乘方式与换乘用时（分钟）。键为换乘站 ID，机制见 shared/route-data.js
         * 的 transferAt。未列出的换乘站用共享层默认值（2 分钟）。
         *
         * 换乘方式有三个来源，逐站交叉核对：
         *   1) 百科「长春轨道交通」条目的换乘站点表（1/2/3/4/6/8 号线的换乘方式）；
         *   2) **维基百科各车站条目的 interchange 字段与「车站结构」正文** —— 后者往往
         *      直接写明「两线采用 XX 换乘形式」并给出换乘节点连接的两侧站台，是本站
         *      最主要的方式来源（7 号线 6 站、5 号线 5 站、双丰、职业技术大学均取自此处）；
         *   3) 官方开通报道（如 6 号线「地下车站与高架车站换乘增设垂梯」）。
         * **未查到逐站实测耗时的，按其换乘方式档位取中值**（节点换乘 1 分钟、
         * 站厅换乘 2 分钟、站厅通道换乘 3 分钟、通道换乘 4 分钟）——这是「按方式定档」
         * 的约定口径，不是实测值，取得实测后应逐站替换。
         *
         * 本表已覆盖全图 **25 座换乘站**：含 5 号线一期开通后新成为换乘站的人民广场、
         * 文化广场、电台街、硅谷广场、南湖广场，以及 7 号线一期的 6 座换乘站。
         * 东大桥（0501 与 4 号线 0424）不在此列 —— 两站厅并不连通、属付费出站换乘，
         * 登记在 data_virtual_transfers.js。
         */
        transferAt: {
            // 解放大路 1号线 ⇄ 2号线：百科换乘站点表列为「通道换乘」。1 号线站厅层与
            // 2 号线站台层以 4 个弧形换乘通道平层交替换乘，1 号线站台层与 2 号线站厅层
            // 以 4 个楼梯步道双层换乘（长春日报 2018-08-30 2 号线通车试运营报道）；
            // 长春轨道交通集团 2025-12 又开通了连接 1、2 号线的单行节点楼梯，
            // 「2 号线换乘 1 号线走节点楼梯超近，1 号线换乘 2 号线仍需走站厅层」。
            // 方向不对称且以线路对区分，未用 sameDir；取通道换乘档 4 分钟（保守值，
            // 走节点楼梯时实际更短）。
            "0128": { mode: "通道换乘", minutes: 4 },
            // 长春站 1号线 ⇄ 3号线：百科列为「站厅换乘」。2019 年时 3 号线长春站为地面站、
            // 1 号线在地下，须出站再进站；3 号线东延伸线（2021-12 通车）将西安桥至长春站
            // 区段改为地下，此后与 1 号线、4 号线实现站内换乘（长春本地宝 2019-05-27）。
            "0125": { mode: "站厅换乘", minutes: 2 },
            // 长春站北 1号线 ⇄ 4号线：百科列为「站厅换乘」。两站均位于长春站北站房
            // 换乘中心内，建设时即做了换乘预留，2019-05-30 起站内一票换乘
            // （长春本地宝 2019-05-27、中国吉林网 2019-05-29）。
            "0124": { mode: "站厅换乘", minutes: 2 },
            // 卫星广场 1号线 ⇄ 3号线：百科列为「站厅通道换乘」。1 号线与轻轨 3 号线的
            // 换乘通道于 2019-05-30 投用，实现站内换乘（长春本地宝 2019-05-27）。
            "0132": { mode: "站厅换乘", minutes: 3 },
            // 华庆路 1号线 ⇄ 6号线：百科列为「节点换乘、站厅通道换乘」（两种方式并存），
            // 按站厅通道口径取中值。
            "0134": { mode: "站厅换乘", minutes: 3 },
            // 北环城路 1号线 ⇄ 8号线：百科列为「站厅通道换乘」，2019-05-30 前即已实现
            // 站内换乘（长春本地宝 2019-05-27）。
            "0121": { mode: "站厅换乘", minutes: 3 },
            // 吉林大路 2号线 ⇄ 4号线：全城首座地铁与轻轨室内一票式换乘车站，
            // 出站厅经换乘大厅及换乘通道即可换乘，2019-05-30 投用（中国吉林网 2019-05-29）。
            "0237": { mode: "站厅换乘", minutes: 2 },
            // 解放桥 2号线 ⇄ 3号线：2 号线在地下、3 号线在地面/高架，属「天地换乘」；
            // 2019 年时换乘通道未完工，需出站步行上解放桥再下桥、约 500 米
            // （长春本地宝 2019-05-27），此后站内换乘通道建成（轨道交通爱好者换乘实录，
            // 标题即「鸽了两年的站内天地换乘」）。按通道换乘档取 4 分钟。
            "0231": { mode: "通道换乘", minutes: 4 },
            // 福祉大路 4号线 ⇄ 6号线：4 号线在地面/高架、6 号线在地下，属「天地换乘」；
            // 官方开通报道明确「以福祉大路站、长影世纪城站为例，地下车站与高架车站换乘
            // 增设垂梯，实现了无障碍换乘」（城市晚报 / 吉林日报 2024-03-27 引长春轨道
            // 交通集团）。按通道换乘档取 4 分钟。
            "0437": { mode: "通道换乘", minutes: 4 },
            // 长春西站 2号线 ⇄ 6号线：百科换乘站点表列为「站厅换乘」。6 号线开通报道
            // 亦确认本站为与既有线路的换乘站之一（新华网 2024-03-28）。
            "0225": { mode: "站厅换乘", minutes: 2 },
            // 伪满皇宫 3号线 ⇄ 4号线：百科换乘站点表列为「**同台同向换乘**、站厅换乘」，
            // 即同向的那一对列车同台换乘、反向需经站厅。
            // ⚠️ 未启用 sameDir：本站是 3 号线起点站（站序索引 0），共享层的同向几何判定
            // 在端头站取不到位移向量（headingVector 会返回 null），若配 sameDirMinutes
            // 会出现「同一对方向在不同 from/to 顺序下结果不一致」；而公开资料未给出
            // 「哪一对方向同台」的具体对应，故按两条路径中值取 2 分钟（同台约 1 分、
            // 站厅约 3 分），待拿到站台布置资料后可用 sameDir 显式点明。
            "0321": { mode: "同台换乘", minutes: 2 },
            // 长影世纪城 3号线 ⇄ 6号线：3 号线为高架、6 号线为地下，同属官方口径的
            // 「地下车站与高架车站换乘」并增设垂梯（同上 2024-03-27 报道，与福祉大路
            // 并列举例）。按通道换乘档取 4 分钟。
            "0355": { mode: "通道换乘", minutes: 4 },
            /* ── 以下 13 站依据维基百科各站条目的 `interchange` 字段与「车站结构」正文 ----
             * （条目同时给出两线的楼层与走向，可与下述换乘形式互相印证）：
             */
            // 人民广场 1号线 ⇄ 5号线：两线采用通道换乘，换乘通道连接 1 号线站厅南侧与
            // 5 号线站厅西侧（1 号线地下二层、沿人民大街南北向；5 号线地下三层、
            // 沿长春大街东西向）。
            "0127": { mode: "通道换乘", minutes: 4 },
            // 双丰 2号线 ⇄ 6号线：interchange 直书「通道换乘」。两站沿站前街**平行**设置
            // （2 号线在西、6 号线在东），通道连接 2 号线站厅东侧与 6 号线站厅西侧。
            "0224": { mode: "通道换乘", minutes: 4 },
            // 文化广场 2号线 ⇄ 5号线：两线采用 L 型节点换乘，换乘节点连接 2 号线站台东侧
            // 与 5 号线站台南侧（2 号线地下二层、沿解放大路东西向；5 号线地下三层）。
            "0233": { mode: "L型节点换乘", minutes: 1 },
            // 电台街 3号线 ⇄ 5号线：interchange 直书「通道换乘」。交叉口东北侧建有换乘站厅，
            // 连接 5 号线站厅东侧与 3 号线两站台中部（3 号线为半地下敞开式侧式站台、
            // 5 号线为地下二层岛式）。
            "0335": { mode: "通道换乘", minutes: 4 },
            // 硅谷广场（吉大中心校区） 5号线 ⇄ 6号线：interchange 记「节点换乘、站厅换乘」，
            // 正文写明为 T 型节点换乘——换乘节点连接 5 号线站台中部与 6 号线站台南侧，
            // 也可利用地下一层站厅换乘。
            "0628": { mode: "T型节点换乘", minutes: 1 },
            // 南湖广场（吉大南湖校区） 5号线 ⇄ 7号线：两线采用 L 型节点换乘，换乘节点连接
            // 5 号线站台北侧与 7 号线站台西侧（7 号线地下二层、5 号线地下三层），
            // 也可利用地下一层站厅换乘。
            "0729": { mode: "L型节点换乘", minutes: 1 },
            // 工农广场 1号线 ⇄ 7号线：interchange 直书「通道换乘」（7 号线车站为地下三层
            // 暗挖车站，1 号线在其上方，见城市晚报 2020-06-09 施工报道）。
            "0130": { mode: "通道换乘", minutes: 4 },
            // 汽车公园 2号线 ⇄ 7号线：interchange 记「节点换乘、站厅换乘」，正文写明为
            // L 型节点换乘——换乘节点连接 2 号线站台南侧与 7 号线站台东侧（2 号线地下二层、
            // 7 号线地下三层），也可利用地下一层站厅换乘。
            "0221": { mode: "L型节点换乘", minutes: 1 },
            // 东环城路 2号线 ⇄ 7号线：interchange 直书「站厅换乘」。两线地下一层均为站厅、
            // 2 号线地下二层站台（东西向）、7 号线地下三层站台（南北向）。
            "0239": { mode: "站厅换乘", minutes: 2 },
            // 孟家屯 3号线 ⇄ 7号线：两线采用通道换乘，换乘通道连接 3 号线两站台南侧与
            // 7 号线站厅北侧（3 号线为高架两层侧式站台、7 号线为地下两层岛式）。
            "0333": { mode: "通道换乘", minutes: 4 },
            // 威海路 4号线 ⇄ 7号线：interchange 直书「通道换乘」。换乘通道连接 4 号线
            // 车站东侧（高架两层侧式站台）与 7 号线站厅南侧（地下两层岛式）。
            "0430": { mode: "通道换乘", minutes: 4 },
            // 飞跃广场 6号线 ⇄ 7号线：两线采用 T 型节点换乘，换乘节点连接 6 号线站台中部
            // 与 7 号线站台西侧（6 号线地下二层、7 号线地下三层），也可利用地下一层站厅换乘。
            "0625": { mode: "T型节点换乘", minutes: 1 },
            // 职业技术大学 3号线 ⇄ 4号线：interchange 直书「通道换乘」。本站即 2019 年
            // 由 3 号线临河街、4 号线卫星路统一更名的「职业学院」站，位于卫星路与
            // 临河街交叉口，两线均为高架侧式站台（站名对应关系经维基条目 former 字段确认）。
            "0343": { mode: "通道换乘", minutes: 4 }
        },
        /**
         * 抄录数据按 [线路][车站] 存放，每站两条（首班方向与末班方向各一条），
         * 每条含首班（工作日/周末）与夏、冬两季末班，故拆成四条独立的链。
         */
        reader(line, sid) {
            const rows = window.CHANGCHUN_TIMETABLE_DATA?.[String(line.id)]?.[String(sid)] || [];
            const slot = window.CGoRouteData.hourSlots;
            return rows.flatMap((row) => slot(row.destination, [
                ["first", "工作日首", row.first?.workday], ["first", "周末首", row.first?.restday],
                ["last", "夏末", row.summer], ["last", "冬末", row.winter]
            ]));
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261008.180000";
        // 共享层（临时位于 city/shenyang/shared/，须早于各城模块加载）
        // 环线方向文案（内环 / 外环）：须早于行程规划与时刻表渲染
        document.write(`<script src="./city/shenyang/shared/loop-direction.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/timetable-renderer.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/station-title.js?v=${version}"><\/script>`);
        // 浮层遮挡：声明浮层占用的边缘尺寸，由引擎据此收窄平移边界与居中区
        document.write(`<script src="./city/shenyang/shared/viewport-inset.js?v=${version}"><\/script>`);
        // 未开通区段与车站的开通时刻（共享层读取并应用）
        document.write(`<script src="./city/shenyang/shared/opening-schedule.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/changchun/data_opening.js?v=${version}"><\/script>`);
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒）
        document.write(`<script src="./city/shenyang/shared/route-data.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-planner.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-panel.js?v=${version}"><\/script>`);
        // 跨城市「查找最近车站」：接管核心的 findNearestStation 及其「距离较远」confirm
        document.write(`<script src="./city/shenyang/shared/nearest-station.js?v=${version}"><\/script>`);
        // 固定侧栏「浮岛卡片」改造（须晚于 route-panel.js，样式表以本层为准）
        document.write(`<script src="./city/shenyang/shared/sidebar-refit.js?v=${version}"><\/script>`);
        // 地图小工具（票价图 / 等时圈）：入口在「查找最近车站」按钮下方
        document.write(`<script src="./city/shenyang/shared/map-tools.js?v=${version}"><\/script>`);
        // 城市私有数据与车站设施（须早于依赖它的模块加载）
        document.write(`<script src="./city/changchun/data_facilities.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/changchun/data_exits.js?v=${version}"><\/script>`);
        // 出入口垂直交通搬迁：把设施表里以出口开头的「无障碍电梯 / 升降平台」段搬到出口页签下
        // （须早于 facilities.js 与 exits.js，两者都调用它）
        document.write(`<script src="./city/shenyang/shared/exit-vertical.js?v=${version}"><\/script>`);
        // 车站设施（配置驱动，共享层位于沈阳目录下）
        document.write(`<script src="./city/shenyang/shared/facilities.js?v=${version}"><\/script>`);
        // 反馈面板（出入口「待补充」与右上角「更多」入口共用；须早于 exits.js）
        document.write(`<script src="./city/shenyang/shared/feedback.js?v=${version}"><\/script>`);
        // 车站出入口独立页签：配置驱动，与沈阳、大连同用共享层
        document.write(`<script src="./city/shenyang/shared/exits.js?v=${version}"><\/script>`);
        (ChangchunCity.stationBoard?.scripts || []).forEach((scriptPath) => {
            document.write(`<script src="./city/changchun/${scriptPath}?v=${version}"><\/script>`);
        });
    }

    loadStationBoardModules();
    window.CHANGCHUN_CITY = ChangchunCity;
    window.CURRENT_CITY = ChangchunCity;
    window.CityDataManager?.registerCity?.({
        id: ChangchunCity.id,
        name: ChangchunCity.name,
        folder: "./city/changchun",
        mainLogic: "./city/changchun/changchun.js",
        center: ChangchunCity.center,
        defaultScale: ChangchunCity.defaultScale,
        mapSize: ChangchunCity.mapSize,
        searchCity: ChangchunCity.searchCity,
        title: "CGo OpenMap - 长春轨道交通线路图",
        keywords: "CGo OpenMap, 长春地铁, 长春轨道交通, 线路图",
        description: "线路走向依据官方交互线路图整理。",
        officialMapUrl: ChangchunCity.officialMapUrl,
        registerDate: "2026-09-13",
        status: "active",
        maintainers: [
            { name: "jrzhang", role: "城市主理人", github: "https://github.com/beepingflijo" }
        ],
        isDefault: false,
        ...ChangchunCity
    });

    // ── 画布尺寸对齐 ────────────────────────────────────────────────────────────
    // 引擎只按 city.mapSize 计算平移 / 居中边界，DOM 上的 #map-content 仍是
    // css/style.css 里的默认尺寸（1850×1300），必须在这里把它对齐到本市实际画布，
    // 否则画布与边界对不上：本城内容外接盒约 2072×1900，大于 1850×1300，会溢出。
    // 口径与大连 modules/dalian_map.js、哈尔滨 modules/harbin_map.js 里的
    // installMapCanvas 一致。
    (function installMapCanvas() {
        const apply = () => {
            const mapContent = document.getElementById("map-content");
            const size = ChangchunCity.mapSize;
            if (!mapContent || !size) return;
            mapContent.style.setProperty("width", `${size.width}px`, "important");
            mapContent.style.setProperty("height", `${size.height}px`, "important");
        };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", apply, { once: true });
        } else {
            apply();
        }
    })();
})();
