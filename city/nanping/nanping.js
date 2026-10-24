/**
 * CGo OpenMap - 南平 城市模块 (city/nanping/nanping.js)
 *
 * 数据来源：官方《武夷有轨电车》示意图（1 条线，10 站；固县站封闭改造）。
 */
(function () {
    "use strict";

    const NanpingCity = {
        id: "nanping",
        name: "南平",
        searchCity: "南平",
        center: { x: 472, y: 329 },
        defaultScale: 1.0,
        mapSize: { width: 719, height: 608 },
        maintainers: [
            { name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }
        ],
        LINE_META: {},
        LINE_SORT_ORDER: ["NP-T1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["NP-T1"],
        dataFiles: {},

        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id)));
        },
        formatOwnerName(raw) { return raw || "南平武夷有轨电车"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(有轨电车站)` : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("南平")}`;
        }
    };

    window.NANPING_CITY = NanpingCity;
    window.CURRENT_CITY = NanpingCity;

    window.CityDataManager?.registerCity?.({
        id: NanpingCity.id,
        name: NanpingCity.name,
        folder: "./city/nanping",
        mainLogic: "./city/nanping/nanping.js",
        center: NanpingCity.center,
        defaultScale: NanpingCity.defaultScale,
        mapSize: NanpingCity.mapSize,
        searchCity: NanpingCity.searchCity,
        title: "CGo OpenMap - 南平武夷有轨电车线路图",
        keywords: "CGo OpenMap, 南平, 武夷, 有轨电车, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的南平武夷有轨电车交互线路图",
        isDefault: false,
        ...NanpingCity
    });
})();
