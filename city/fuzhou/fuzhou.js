/**
 * CGo OpenMap - 城市配置与能力接口 (city/fuzhou/fuzhou.js)
 *
 * 线路与站点数据来自 CGo OpenMap 线路图在线编辑器，本文件负责城市运行时元数据。
 *
 * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（2026-09-16）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 */

(function () {
    const FuzhouCity = {
        id: "fuzhou",
        name: "福州",
        themeColor: "#079445",
        searchCity: "福州",
        center: { x: 1250, y: 800 },
        defaultScale: 1.0,
        mapSize: { width: 2500, height: 1600 },
        officialMapUrl: "",
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2", "M3", "M4", "M5", "M6"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        dataFiles: {
            stanameCsvUrl: "./city/fuzhou/staname.csv"
        },
        getNavigationUrl(stationName) {
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stationName}(地铁站)`)}&city=${encodeURIComponent("福州")}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName && rawOwnerName !== "未知运营" ? rawOwnerName : "福州轨道交通";
        },
        formatCompanyString(companyList) {
            const normalized = companyList.map((name) => this.formatOwnerName(name));
            return [...new Set(normalized)].join("，") || this.formatOwnerName("");
        },
        stacard: {
            script: "./city/fuzhou/stacard/script.js",
            basePath: "./city/fuzhou/stacard/",
            getRenderer: () => window.FuzhouStaCard || window.StaCard || null
        },
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({ basePath: this.stacard.basePath, ...options });
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
            scripts: [],
            modules: {
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" }
            }
        }
    };

    window.FUZHOU_CITY = FuzhouCity;
    window.CURRENT_CITY = FuzhouCity;
    window.CityDataManager?.registerCity?.({
        id: FuzhouCity.id,
        name: FuzhouCity.name,
        folder: "./city/fuzhou",
        mainLogic: "./city/fuzhou/fuzhou.js",
        center: FuzhouCity.center,
        defaultScale: FuzhouCity.defaultScale,
        mapSize: FuzhouCity.mapSize,
        searchCity: FuzhouCity.searchCity,
        title: "CGo OpenMap - 福州轨道交通线路图",
        keywords: "CGo OpenMap, 福州, 轨道交通, 线路图",
        description: "尝试性的功能，使用线路编辑器直接制作的福州轨道交通线路图。",
        registerDate: "2026-09-16",
        status: "active",
        maintainers: [],
        isDefault: false,
        ...FuzhouCity
    });
})();
