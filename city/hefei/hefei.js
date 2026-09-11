/**
 * CGo OpenMap - 合肥城市配置与扩展模块 (city/hefei/hefei.js)
 *
 * 提供城市上下文、线路排序及 StaCard 地图数据接入。
 * 不修改 core/；合肥专属逻辑只放在本目录。
 */

(function () {
    const HefeiCity = {
        id: "hefei",
        name: "合肥",
        searchCity: "合肥",
        center: { x: 1200, y: 1400 },
        defaultScale: 0.75,
        mapSize: { width: 2400, height: 3000 },
        officialMapUrl: "https://www.hfgdjt.com/",
        LINE_META: {},
        LINE_SORT_ORDER: ["HFM1", "HFM2", "HFM3", "HFM4", "HFM5", "HFM6", "HFM7", "HFM8", "HFS1"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: ["HFS1", "S1线"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: ["0114"], // 合肥南站：1 号线与 5 号线同台换乘
        MAP_12306: {
            "合肥火车站": "合肥",
            "合肥南站": "合肥南",
            "合肥西站": "合肥西",
            "肥东站": "肥东",
            "北城高铁站": "合肥北城"
        },
        maintainers: [
            { name: "Evin", role: "城市主理人", github: "https://github.com/walternie" }
        ],
        dataFiles: {
            stanameCsvUrl: "./city/hefei/staname.csv",
            amapDataUrl: "./city/hefei/amap_data.json"
        },
        getNavigationUrl(stationName, isRailway = false) {
            const query = isRailway ? stationName : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("合肥")}`;
        },
        getRailway12306Url(stationName) {
            const cleanName = stationName.replace(/站$/, "");
            const mappedName = this.MAP_12306[stationName] || this.MAP_12306[cleanName] || cleanName;
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(mappedName)}`;
        },
        getSuburbanLinks() {
            return null;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "合肥市轨道交通集团有限公司";
        },
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，");
        },
        stacard: {
            script: "./city/hefei/stacard/script.js",
            geoDataUrl: "./city/hefei/amap_data.json",
            basePath: "./city/hefei/stacard/",
            getRenderer: () => window.HefeiStaCard || window.StaCard || null
        },
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({
                basePath: this.stacard.basePath,
                geoDataUrl: this.stacard.geoDataUrl,
                ...options
            });
        },
        hasStaCard(stationId, lineId, stationInfo) {
            return Boolean(this.stacard.getRenderer()?.hasCard?.(stationId, lineId, stationInfo));
        },
        getStaCardHtml(station, lineInfo, isCrossPlatform = false) {
            return this.stacard.getRenderer()?.getCardPlaceholderHtml?.(station, lineInfo, isCrossPlatform) || "";
        },
        async renderStaCards(infoPanel, station) {
            return await this.stacard.getRenderer()?.renderPanelCards?.(infoPanel, station);
        },
        stationBoard: {
            scripts: [
                "modules/hefei_timetable.js",
                "modules/hefei_cultural.js"
            ],
            modules: {
                "hefei-line-timetable": { enabled: true, targetTab: "line-tab", order: 22 },
                "hefei-cultural-tip": { enabled: true, targetTab: "station-info", order: 15 }
            }
        }
    };

    if (typeof document !== "undefined" && typeof document.write === "function") {
        document.write('<scr' + 'ipt src="./city/hefei/modules/hefei_timetable.js?v=260908.150200"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/hefei/modules/hefei_cultural.js?v=260908.182800"><\/scr' + 'ipt>');
    }

    window.HEFEI_CITY = HefeiCity;
    window.CURRENT_CITY = HefeiCity;
    window.CityDataManager?.registerCity?.({
        id: HefeiCity.id,
        name: HefeiCity.name,
        folder: "./city/hefei",
        mainLogic: "./city/hefei/hefei.js",
        center: HefeiCity.center,
        defaultScale: HefeiCity.defaultScale,
        mapSize: HefeiCity.mapSize,
        searchCity: HefeiCity.searchCity,
        title: "CGo OpenMap - 合肥轨道交通线路图",
        keywords: "CGo OpenMap, 合肥地铁, 合肥轨道交通, 线路图",
        description: "由 CGo OpenMap 驱动的合肥轨道交通智能交互线路图，覆盖 1–8 号线及 S1 线示意。",
        officialMapUrl: HefeiCity.officialMapUrl,
        isDefault: false,
        ...HefeiCity
    });

    console.log("[HefeiCity] 合肥城市模块加载完成。");
})();
