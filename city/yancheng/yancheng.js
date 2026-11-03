/**
 * CGo OpenMap - 盐城 城市模块 (city/yancheng/yancheng.js)
 */
(function () {
    "use strict";

    const City = {
        id: "yancheng",
        name: "盐城",
        searchCity: "盐城",
        center: { x: 304, y: 304 },
        defaultScale: 1.6,
        mapSize: { width: 608, height: 608 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["YC-SRT1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["YC-SRT1"],
        dataFiles: {},

        isTramLine(id) { return id === "YC-SRT1"; },
        isTramStation() { return true; },
        formatOwnerName(raw) { return raw || "盐城SRT"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(公交站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("盐城")}`;
        }
    };

    window.YANCHENG_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/yancheng",
        mainLogic: "./city/yancheng/yancheng.js",
        themeColor: "#EA0537",
        themeColorDark: "#FF5C7A",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 盐城SRT线路图",
        keywords: "CGo OpenMap, 盐城, SRT, 智轨, 一号线",
        description: "盐城SRT一号线，沿青年路布置的十七座路口站。",
        isDefault: false,
        ...City
    });
})();
