/**
 * CGo OpenMap - 金华 城市模块 (city/jinhua/jinhua.js)
 */
(function () {
    "use strict";

    const City = {
        id: "jinhua",
        name: "金华",
        searchCity: "金华",
        center: { x: 888, y: 325 },
        defaultScale: 0.8,
        mapSize: { width: 1926, height: 825 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["JH-M1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["JH-M1"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},

        isTramLine() { return false; },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "金华轨道交通"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(金华轨道交通)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("金华")}`;
        }
    };

    window.JINHUA_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/jinhua",
        mainLogic: "./city/jinhua/jinhua.js",
        themeColor: "#CC2D46",
        themeColorDark: "#E85A70",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 金华轨道交通金义东线线路图",
        keywords: "CGo OpenMap, 金华, 轨道交通, 金义东线, 义乌, 横店",
        description: "金华轨道交通金义东线，自金华站经义乌至横店客运中心，另设义乌高铁站支线。",
        isDefault: false,
        ...City
    });
})();
