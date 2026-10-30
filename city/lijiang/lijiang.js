/**
 * CGo OpenMap - 丽江 城市模块 (city/lijiang/lijiang.js)
 */
(function () {
    "use strict";

    const City = {
        id: "lijiang",
        name: "丽江",
        searchCity: "丽江",
        center: { x: 425, y: 492 },
        defaultScale: 1.0,
        mapSize: { width: 850, height: 889 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["LJ-M1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["LJ-M1"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},

        isTramLine() { return false; },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "丽江雪山观光火车"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(丽江雪山观光火车)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("丽江")}`;
        }
    };

    window.LIJIANG_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/lijiang",
        mainLogic: "./city/lijiang/lijiang.js",
        themeColor: "#84B886",
        themeColorDark: "#9CD3A0",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 丽江雪山观光火车线路图",
        keywords: "CGo OpenMap, 丽江, 雪山观光火车, 玉龙雪山, 游客中心",
        description: "丽江雪山观光火车 1 号线，自玉龙雪山经东巴谷、玉水寨、白沙古镇至游客中心。",
        isDefault: false,
        ...City
    });
})();
