/**
 * CGo OpenMap - 沈阳城市配置与能力接口
 *
 * 城市定制渲染位于 modules/，本文件只保留数据关系、运行时参数与能力桥接。
 */
(function () {
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
