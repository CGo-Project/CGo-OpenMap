/**
 * CGo OpenMap - 台州 城市模块 (city/taizhou/taizhou.js)
 */
(function () {
    "use strict";
    const City = {
        id: "taizhou",
        name: "台州",
        searchCity: "台州",
        center: { x: 165, y: 319 },
        defaultScale: 1.0,
        mapSize: { width: 282, height: 638 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["TAIZHOU-L1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},
        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) { return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id))); },
        formatOwnerName(raw) { return raw || "台州市域铁路"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("台州")}`;
        }
    };
    window.CURRENT_CITY = City;
    window["TAIZHOU_CITY"] = City;
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/taizhou", mainLogic: "./city/taizhou/taizhou.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 台州轨道交通线路图",
        keywords: "CGo OpenMap, 台州, S1线, 线路图, 轨道交通",
        description: "台州市域铁路 S1 线（台州火车站 → 城南），共 15 站。",
        isDefault: false,
        ...City
    });
})();
