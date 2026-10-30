/**
 * CGo OpenMap - 台中 城市模块 (city/taichung/taichung.js)
 */
(function () {
    "use strict";

    const City = {
        id: "taichung",
        name: "台中",
        searchCity: "台中",
        center: { x: 493, y: 389 },
        defaultScale: 1.0,
        mapSize: { width: 1286, height: 1081 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["TC-G", "TC-B", "TC-R"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["TC-R"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},

        isTramLine() { return false; },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "台中捷運"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(捷運站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("台中")}`;
        }
    };

    window.TAICHUNG_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/taichung",
        mainLogic: "./city/taichung/taichung.js",
        themeColor: "#8EC31A",
        themeColorDark: "#A8D93C",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 台中捷運路線圖",
        keywords: "CGo OpenMap, 台中, 捷運, 綠線, 藍線, 台鐵紅線",
        description: "台中捷運綠線營運中路線，藍線與台鐵紅線以規劃虛線呈現。",
        isDefault: false,
        ...City
    });
})();
