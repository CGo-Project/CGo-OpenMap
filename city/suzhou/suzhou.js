/**
 * CGo OpenMap - 苏州 城市模块 (city/suzhou/suzhou.js)
 *
 * 线网数据依苏州地铁官方「运行线路图」(sz-mtr.com) 矢量底图整理，含 1~8 号线与 11 号线。
 * 站心与走向折点统一对齐 5px 网格（坐标均为 5 的倍数），便于人工增删站与核对走向。
 */

(function () {
    "use strict";
    const City = {
        id: "suzhou",
        name: "苏州",
        themeColor: "#0c3674",
        searchCity: "苏州",
        /* 首屏视点：乐桥（1 / 4 号线换乘，古城核心） */
        center: { x: 1250, y: 1165 },
        defaultScale: 0.72,
        mapSize: { width: 2570, height: 2600 },
        officialMapUrl: "https://www.sz-mtr.com/service/guide/map/index_zh.html",
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M11"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        MAP_12306: {
            "苏州火车站": "苏州",
            "高铁苏州北站": "苏州北",
            "苏州园区火车站": "苏州园区",
            "苏州新区火车站": "苏州新区"
        },
        dataFiles: { stanameCsvUrl: "./city/suzhou/staname.csv" },
        getNavigationUrl(stationName, isRailway = false) {
            const query = isRailway ? stationName : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("苏州")}`;
        },
        getRailway12306Url(stationName) {
            const cleanName = stationName.replace(/站$/, "");
            const mappedName = this.MAP_12306[stationName] || this.MAP_12306[cleanName] || cleanName;
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(mappedName)}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "苏州市轨道交通集团";
        },
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，");
        }
    };
    window.CURRENT_CITY = City;
    window.SUZHOU_CITY = City;
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/suzhou", mainLogic: "./city/suzhou/suzhou.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 苏州轨道交通线路图",
        keywords: "CGo OpenMap, 苏州地铁, 苏州轨道交通, 线路图",
        description: "覆盖 1~8 号线与 11 号线，含 11 号线花桥接驳上海地铁 11 号线。",
        officialMapUrl: City.officialMapUrl,
        isDefault: false,
        ...City
    });
})();
