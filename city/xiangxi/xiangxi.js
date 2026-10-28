/**
 * CGo OpenMap - 湘西 城市模块 (city/xiangxi/xiangxi.js)
 */
(function () {
    "use strict";

    const City = {
        id: "xiangxi",
        name: "湘西",
        searchCity: "湘西",
        center: { x: 214, y: 358 },
        defaultScale: 1.2,
        mapSize: { width: 443, height: 759 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["XX-M1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["XX-M1"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: [],
        dataFiles: {},

        isTramLine() { return false; },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "湖南磁浮交通"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(凤凰磁浮)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("湘西")}`;
        }
    };

    window.XIANGXI_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/xiangxi",
        mainLogic: "./city/xiangxi/xiangxi.js",
        themeColor: "#B69572",
        themeColorDark: "#D4B896",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 湘西凤凰磁浮线路图",
        keywords: "CGo OpenMap, 湘西, 凤凰, 磁浮, 凤凰磁浮线",
        description: "凤凰磁浮线（凤凰古城—凤凰等待），串联凤凰古城与奇梁洞景区。",
        isDefault: false,
        ...City
    });
})();
