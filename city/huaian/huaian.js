/**
 * CGo OpenMap - 淮安 城市模块 (city/huaian/huaian.js)
 */
(function () {
    "use strict";
    const City = {
        id: "huaian",
        name: "淮安",
        searchCity: "淮安",
        center: { x: 280, y: 333 },
        defaultScale: 1.0,
        mapSize: { width: 560, height: 634 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["HA-L1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["HA-L1"],
        dataFiles: { stanameCsvUrl: "./city/huaian/staname.csv" },
        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) { return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id))); },
        formatOwnerName(raw) { return raw || "淮安市现代有轨电车"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("淮安")}`;
        }
    };
    window.CURRENT_CITY = City;
    window.HUAIAN_CITY = City;
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/huaian", mainLogic: "./city/huaian/huaian.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 淮安有轨电车线路图",
        keywords: "CGo OpenMap, 淮安, 有轨电车, 1号线, 线路图",
        description: "淮安有轨电车 1 号线交互线路图，共 23 站。",
        isDefault: false,
        ...City
    });
})();
