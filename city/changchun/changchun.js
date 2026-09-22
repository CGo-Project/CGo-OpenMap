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
        SUBURBAN_LINES: [],
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
