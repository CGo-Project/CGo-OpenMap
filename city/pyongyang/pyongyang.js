/**
 * CGo OpenMap - 平壤 城市模块 (city/pyongyang/pyongyang.js)
 */
(function () {
    "use strict";
    const City = {
        id: "pyongyang",
        name: "平壤",
        searchCity: "平壤",
        center: { x: 378, y: 346 },
        defaultScale: 1.0,
        mapSize: { width: 767, height: 642 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["PY-CL", "PY-HK", "PY-T1", "PY-T2", "PY-T3", "PY-KS"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: ["PY02", "PY04", "PY38", "PY42"],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["PY-T1", "PY-T2", "PY-T3", "PY-KS"],
        dataFiles: { stanameCsvUrl: "./city/pyongyang/staname.csv" },
        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) { return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id))); },
        formatOwnerName(raw) { return raw || "평양시 인민위원회 교통운수국"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("平壤")}`;
        }
    };
    window.CURRENT_CITY = City;
    window.PYONGYANG_CITY = City;
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/pyongyang", mainLogic: "./city/pyongyang/pyongyang.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 平壤城市轨道交通线路图",
        keywords: "CGo OpenMap, 平壤, 地铁, 有轨电车, 千里马线, 革新线",
        description: "平壤地铁与有轨电车线网交互线路图，共 61 站。",
        isDefault: false,
        ...City
    });
})();
