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

    const ChangchunCity = {
        id: "changchun",
        name: "长春",
        themeColor: "#C9062C",
        searchCity: "长春",
        center: { x: 1150, y: 950 },
        defaultScale: 0.7,
        mapSize: { width: 2300, height: 1900 },
        officialMapUrl: "http://www.ccqg.com/metro-map/metromap_new/ccSubwayMap1.html",
        LINE_META: {},
        LINE_SORT_ORDER: ["CCM01", "CCM02", "CCM03", "CCM04", "CCM06", "CCM07", "CCM08"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["Rwy"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        dataFiles: {
            amapDataUrl: "./city/changchun/amap_data.json"
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
        getNavigationUrl(stationName) {
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stationName}(地铁站)`)}&city=${encodeURIComponent("长春")}`;
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
            getRenderer: () => window.ChangchunStaCard || window.CHANGCHUN_STACARD || window.StaCard || null
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
            scripts: ["modules/changchun_service_info.js"],
            modules: {
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" },
                "changchun-service-info": { enabled: true, order: 15, targetTab: "line-tab" }
            }
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "260913.220000";
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
})();
