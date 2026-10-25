/**
 * CGo OpenMap - 嘉兴 城市模块 (city/jiaxing/jiaxing.js)
 */
(function () {
    "use strict";
    const City = {
        id: "jiaxing",
        name: "嘉兴",
        searchCity: "嘉兴",
        center: { x: 323, y: 326 },
        defaultScale: 1.0,
        mapSize: { width: 602, height: 632 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["JIAXING-L1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["JIAXING-L1"],
        dataFiles: { stanameCsvUrl: "./city/jiaxing/staname.csv" },
        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) { return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id))); },
        formatOwnerName(raw) { return raw || "嘉兴有轨电车"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("嘉兴")}`;
        }
    };
    window.CURRENT_CITY = City;
    window.JIAXING_CITY = City;
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/jiaxing", mainLogic: "./city/jiaxing/jiaxing.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 嘉兴有轨电车线路图",
        keywords: "CGo OpenMap, 嘉兴, 有轨电车, 1号线, 线路图",
        description: "嘉兴有轨电车 1 号线交互线路图，共 21 站。",
        isDefault: false,
        ...City
    });
})();
