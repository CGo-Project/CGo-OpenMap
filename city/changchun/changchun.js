/**
 * CGo OpenMap - 长春城市配置与能力接口
 *
 * 线路与站点数据来自官方交互线路图；本文件只负责城市运行时元数据。
 */
(function () {
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
        description: "由 CGo OpenMap 驱动的长春轨道交通交互线路图，线路走向依据官方交互线路图整理。",
        officialMapUrl: ChangchunCity.officialMapUrl,
        registerDate: "2026-09-13",
        status: "active",
        maintainers: [
            { name: "待认领", role: "城市主理人招募中", isRecruiting: true, github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md" }
        ],
        isDefault: false,
        ...ChangchunCity
    });
})();
