/**
 * CGo OpenMap - 辽源 城市模块 (city/liaoyuan/liaoyuan.js)
 */
(function () {
    "use strict";

    const City = {
        id: "liaoyuan",
        name: "辽源",
        searchCity: "辽源",
        center: { x: 261, y: 219 },
        defaultScale: 1.0,
        mapSize: { width: 406, height: 441 },
        maintainers: [{"name": "Zihuanana", "role": "城市主理人", "github": "https://github.com/Zihuanana"}],
        LINE_META: {},
        LINE_SORT_ORDER: ["LY-M1", "LY-M2"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["LY-M2"],
        dataFiles: {},

        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id)));
        },
        formatOwnerName(raw) { return raw || "辽源轨道交通"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("辽源")}`;
        }
    };

    window.CURRENT_CITY = City;
    window["LIAOYUAN_CITY"] = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/liaoyuan",
        mainLogic: "./city/liaoyuan/liaoyuan.js",
        center: City.center,
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 辽源轨道交通线路图",
        keywords: "CGo OpenMap, 辽源, 有轨电车, 线路图, 轨道交通",
        description: "辽源氢能文旅线 1 号线、2 号线，共 8 站。",
        isDefault: false,
        ...City
    });
})();
