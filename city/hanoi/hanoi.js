/**
 * CGo OpenMap - 河内 城市模块 (city/hanoi/hanoi.js)
 */
(function () {
    "use strict";

    const City = {
        id: "hanoi",
        name: "河内",
        searchCity: "河内",
        center: { x: 383.6, y: 355.4 },
        defaultScale: 0.8,
        mapSize: { width: 1130, height: 996 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["HN-2A", "HN-3"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},

        isTramLine() { return false; },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "河内都市铁路"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(ga)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("河内")}`;
        }
    };

    window.HANOI_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/hanoi",
        mainLogic: "./city/hanoi/hanoi.js",
        themeColor: "#90403E",
        themeColorDark: "#C0625F",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 河内都市铁路线路图",
        keywords: "CGo OpenMap, 河内, 都市铁路, 吉灵河东线",
        description: "河内都市铁路2A号线（吉灵—河东）与3号线（嫩—河内站）。",
        isDefault: false,
        ...City
    });
})();
