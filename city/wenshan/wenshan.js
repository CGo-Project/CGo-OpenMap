/**
 * CGo OpenMap - 文山 城市模块 (city/wenshan/wenshan.js)
 */
(function () {
    "use strict";

    const City = {
        id: "wenshan",
        name: "文山",
        searchCity: "文山",
        center: { x: 161, y: 323 },
        defaultScale: 1.0,
        mapSize: { width: 248, height: 626 },
        maintainers: [{"name": "Zihuanana", "role": "城市主理人", "github": "https://github.com/Zihuanana"}],
        LINE_META: {},
        LINE_SORT_ORDER: ["WS-M4", "WS-M5"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["WS-M4", "WS-M5"],
        dataFiles: {},

        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id)));
        },
        formatOwnerName(raw) { return raw || "文山轨道交通"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("文山")}`;
        }
    };

    window.CURRENT_CITY = City;
    window["WENSHAN_CITY"] = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/wenshan",
        mainLogic: "./city/wenshan/wenshan.js",
        center: City.center,
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 文山轨道交通线路图",
        keywords: "CGo OpenMap, 文山, 有轨电车, 线路图, 轨道交通",
        description: "文山普者黑有轨电车 4 号线、5 号线，共 10 站；人民医院至普者黑高铁站两线共线。",
        isDefault: false,
        ...City
    });
})();
