/**
 * CGo OpenMap - 澳門 城市模块 (city/macau/macau.js)
 *
 * 数据来源：官方《澳門輕軌》示意图
 *   氹仔線（綠）13 站、石排灣線（紫）2 站、橫琴線（紅）2 站
 *   蓮花 = 氹仔線/橫琴線 換乘；協和醫院 = 氹仔線/石排灣線 換乘
 *   站名三语：中文 / 葡萄牙文 / 英文
 */
(function () {
    "use strict";

    const City = {
        id: "macau",
        name: "澳門",
        searchCity: "澳门",
        center: { x: 156, y: 230 },
        defaultScale: 1.0,
        mapSize: { width: 318, height: 436 },
        maintainers: [
            { name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }
        ],
        LINE_META: {},
        LINE_SORT_ORDER: ["MC-TAIPA", "MC-SEAC", "MC-HENGQIN"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["MC-TAIPA", "MC-SEAC", "MC-HENGQIN"],
        dataFiles: {},

        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id)));
        },
        formatOwnerName(raw) { return raw || "澳門輕軌股份有限公司"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const q = this.isTramStation(context?.station) ? `${stationName}(輕軌站)` : `${stationName}(巴士站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("澳门")}`;
        }
    };

    window.CURRENT_CITY = City;
    window.MACAU_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/macau",
        mainLogic: "./city/macau/macau.js",
        center: City.center,
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 澳門輕軌線路圖",
        keywords: "CGo OpenMap, 澳門, 澳門輕軌, Macau LRT, 氹仔線, 石排灣線, 橫琴線, 線路圖",
        description: "澳門輕軌氹仔線、石排灣線、橫琴線交互線路圖，站名中葡英三語。",
        isDefault: false,
        ...City
    });
})();
