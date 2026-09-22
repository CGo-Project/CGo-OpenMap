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
            if (station.type === "dot" || station.type === "tsfo") {
                const colors = Array.isArray(station.lineColors) ? station.lineColors : [];
                const color = colors[0] || "var(--station-stroke)";
                return { html: CC_DOT_ICON(color), className: "cc-station-dot" };
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
