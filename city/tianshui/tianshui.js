/**
 * CGo OpenMap - 天水 城市模块 (city/tianshui/tianshui.js)
 */
(function () {
    "use strict";
    const City = {
        id: "tianshui",
        name: "天水",
        searchCity: "天水",
        center: { x: 598, y: 105 },
        defaultScale: 1.0,
        mapSize: { width: 1196, height: 210 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["TIANSHUI-L1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["TIANSHUI-L1"],
        dataFiles: { stanameCsvUrl: "./city/tianshui/staname.csv" },
        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) { return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id))); },
        formatOwnerName(raw) { return raw || "天水有轨电车"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("天水")}`;
        }
    };
    window.CURRENT_CITY = City;
    window.TIANSHUI_CITY = City;
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/tianshui", mainLogic: "./city/tianshui/tianshui.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 天水有轨电车线路图",
        keywords: "CGo OpenMap, 天水, 有轨电车, 1号线, 线路图",
        description: "天水有轨电车 1 号线交互线路图，共 29 站。",
        isDefault: false,
        ...City
    });
})();
