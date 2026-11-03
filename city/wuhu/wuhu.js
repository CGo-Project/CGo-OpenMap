/**
 * CGo OpenMap - 芜湖 城市模块 (city/wuhu/wuhu.js)
 */
(function () {
    "use strict";

    const City = {
        id: "wuhu",
        name: "芜湖",
        searchCity: "芜湖",
        center: { x: 470, y: 501 },
        defaultScale: 0.85,
        mapSize: { width: 795, height: 1122 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["WH-1", "WH-2"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},

        isTramLine() { return false; },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "芜湖轨道交通"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(轻轨站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("芜湖")}`;
        }
    };

    window.WUHU_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/wuhu",
        mainLogic: "./city/wuhu/wuhu.js",
        themeColor: "#CC2D46",
        themeColorDark: "#E8607A",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 芜湖轨道交通线路图",
        keywords: "CGo OpenMap, 芜湖, 轨道交通, 单轨, 1号线, 2号线",
        description: "芜湖轨道交通 1 号线与 2 号线，跨座式单轨系统，于鸠兹广场换乘。",
        isDefault: false,
        ...City
    });
})();
