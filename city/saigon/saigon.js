/**
 * CGo OpenMap - 胡志明市 城市模块 (city/saigon/saigon.js)
 */
(function () {
    "use strict";

    const City = {
        id: "saigon",
        name: "胡志明市",
        nameEn: "Ho Chi Minh City",
        searchCity: "胡志明市",
        center: { x: 556, y: 530 },
        defaultScale: 1.0,
        mapSize: { width: 1273, height: 899 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["SAIGON-1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},

        isTramLine() { return false; },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "胡志明市都市铁路"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(ga)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("胡志明市")}`;
        }
    };

    window.SAIGON_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/saigon",
        mainLogic: "./city/saigon/saigon.js",
        themeColor: "#0093D8",
        themeColorDark: "#3FB4EC",
        svglogo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080"><path d="M275.46,512.2c-70.94,70.71-108.7,164.61-109.05,263.72l-97.85.22c-.75-158.81,78.53-306.23,211.55-394.32l393.68,393.84-134.33.47-264-263.93Z"/><path d="M816.43,525.02l-12.55-13.44-170.43,170.55-67.45-67.55,233.11-232.98c132.74,87.36,212.48,234.8,212.33,394.33l-97.42.23-2.44-34.53c-7.22-80.78-39.48-156.96-95.15-216.6Z"/><path d="M693.24,434.92c-98.42-43.63-209.24-43.67-307.09.31l-72.85-73.6c141.25-77.08,311.55-76.86,452.41-.38l-72.46,73.68Z"/></svg>',
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 胡志明市地铁线路图",
        keywords: "CGo OpenMap, 胡志明市, Ho Chi Minh City, 地铁, 1号线, 滨城",
        description: "西贡地铁 1 号线，自滨城至新东方客运站。",
        isDefault: false,
        ...City
    });
})();
