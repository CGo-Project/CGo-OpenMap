/**
 * CGo OpenMap - 三亚 城市模块 (city/sanya/sanya.js)
 *
 * 数据来源：官方《三亚有轨电车》示意图
 *   1. 有轨电车 1 号线（三亚火车站 → 建港路，15 站）
 *   2. 三乐旅游铁路（三亚 → 崖州，8 站，国铁图例；红塘湾 / 中心渔港 未开通）
 * 两线在三亚火车站 ⇄ 三亚 之间站外换乘。
 */
(function () {
    "use strict";

    const SanyaCity = {
        id: "sanya",
        name: "三亚",
        searchCity: "三亚",
        center: { x: 445, y: 470 },
        defaultScale: 1.0,
        mapSize: { width: 890, height: 941 },
        maintainers: [
            { name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }
        ],
        LINE_META: {},
        LINE_SORT_ORDER: ["SY-T1", "SY-SL"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["SY-SL"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["SY-T1"],
        dataFiles: {},

        isTramLine(lineId) {
            return this.TRAM_LINES.includes(lineId);
        },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id)));
        },
        isRailwayStation(station) {
            return station?.type === "rdot" || Boolean(station?.relatedLines?.some((id) => this.SUBURBAN_LINES.includes(id)));
        },
        formatOwnerName(raw) { return raw || "三亚轨道交通"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station)
                ? `${stationName}(有轨电车站)`
                : (isRailway || this.isRailwayStation(context?.station)) ? stationName : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("三亚")}`;
        }
    };

    window.SANYA_CITY = SanyaCity;
    window.CURRENT_CITY = SanyaCity;

    window.CityDataManager?.registerCity?.({
        id: SanyaCity.id,
        name: SanyaCity.name,
        folder: "./city/sanya",
        mainLogic: "./city/sanya/sanya.js",
        center: SanyaCity.center,
        defaultScale: SanyaCity.defaultScale,
        mapSize: SanyaCity.mapSize,
        searchCity: SanyaCity.searchCity,
        title: "CGo OpenMap - 三亚有轨电车线路图",
        keywords: "CGo OpenMap, 三亚, 有轨电车, 三乐旅游铁路, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的三亚有轨电车与三乐旅游铁路交互线路图",
        isDefault: false,
        ...SanyaCity
    });
})();
