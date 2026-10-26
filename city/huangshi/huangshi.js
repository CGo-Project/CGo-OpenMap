/**
 * CGo OpenMap - 黄石 城市模块 (city/huangshi/huangshi.js)
 */
(function () {
    "use strict";
    const City = {
        id: "huangshi",
        name: "黄石",
        searchCity: "黄石",
        center: { x: 277, y: 332 },
        defaultScale: 1.0,
        mapSize: { width: 514, height: 659 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["HUANGSHI-L1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["HUANGSHI-L1"],
        dataFiles: { stanameCsvUrl: "./city/huangshi/staname.csv" },
        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) { return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id))); },
        formatOwnerName(raw) { return raw || "黄石现代有轨电车"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("黄石")}`;
        }
    };
    window.CURRENT_CITY = City;
    window["HUANGSHI_CITY"] = City;
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/huangshi", mainLogic: "./city/huangshi/huangshi.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 黄石轨道交通线路图",
        keywords: "CGo OpenMap, 黄石, 1号线, 线路图, 轨道交通",
        description: "黄石现代有轨电车 1 号线，共 30 站；师范大学站暂未开通。",
        isDefault: false,
        ...City
    });
})();
