/**
 * CGo OpenMap - 大连城市配置与能力接口
 *
 * 城市定制渲染位于 modules/，本文件只保留数据关系、运行时参数与能力桥接。
 */
(function () {
    const DalianCity = {
        id: "dalian",
        name: "大连",
        themeColor: "#0031A8",
        searchCity: "大连",
        center: { x: 1000, y: 800 },
        defaultScale: 1.0,
        mapSize: { width: 2200, height: 1400 },
        LINE_META: {},
        LINE_SORT_ORDER: ["DLM01", "DLM02", "DLM03", "DLM99", "DLM05", "DLM12", "DLM13"],
        LINE_SYNC_GROUPS: [["DLM13", "DLM99"]],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: ["0320", "0308"],
        CROSS_PLATFORM_STATIONS: [],
        dataFiles: {
            amapDataUrl: "./city/dalian/amap_data.json"
        },
        handleLineMerge(station, relatedLinesInfo) {
            const mergeConfig = {
                "0320": { mainId: "DLM13", branchId: "DLM99", name: "3号线支线-13号线", keepBranchBadge: true },
                "0308": { mainId: "DLM03", branchId: "DLM99", name: "3号线-3号线支线" }
            }[station?.id];
            if (!mergeConfig) return;

            const main = relatedLinesInfo.find((line) => line.id === mergeConfig.mainId);
            const branch = relatedLinesInfo.find((line) => line.id === mergeConfig.branchId);
            if (!main || !branch) return;

            main.name = mergeConfig.name;
            if (!main.prev || main.prev === "无") main.prev = branch.prev;
            if (!main.next || main.next === "无") main.next = branch.next;
            main.svg ||= branch.svg;
            main.svgclr ||= branch.svgclr;
            main.svgtext ||= branch.svgtext;
            main.company ||= branch.company;
            main.scheduleUrl ||= branch.scheduleUrl;
            if (mergeConfig.keepBranchBadge) {
                branch.isPointOnly = true;
                return;
            }
            relatedLinesInfo.splice(relatedLinesInfo.indexOf(branch), 1);
        },
        stacard: {
            script: "./city/dalian/stacard/script.js",
            geoDataUrl: "./city/dalian/amap_data.json",
            getRenderer: () => window.DalianStaCard || window.StaCard || null
        },
        getNavigationUrl(stationName) {
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stationName}(地铁站)`)}&city=${encodeURIComponent("大连")}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "大连地铁运营有限公司";
        },
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，");
        },
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({
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
                "modules/dalian_map.js",
                "modules/dalian_timetable.js",
                "modules/dalian_transfers.js"
            ],
            modules: {
                "header-controls": { enabled: true, order: 10 },
                "header-title": { enabled: true, order: 20 },
                "header-badges": { enabled: true, order: 30 },
                "stacard": { enabled: true, targetTab: "line-tab", order: 10 },
                "dalian-line-timetable": { enabled: true, targetTab: "line-tab", order: 15 },
                "adjacent-stations": { enabled: true, targetTab: "line-tab", order: 20 },
                "transfers": { enabled: true, targetTab: "line-tab", order: 30 },
                "station-type": { enabled: true, targetTab: "station-info", order: 10 },
                "operators": { enabled: true, targetTab: "station-info", order: 20 },
                "footer-actions": { enabled: true, order: 10 }
            }
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "260911.170000";
        (DalianCity.stationBoard?.scripts || []).forEach((scriptPath) => {
            document.write(`<script src="./city/dalian/${scriptPath}?v=${version}"><\/script>`);
        });
    }

    window.DALIAN_CITY = DalianCity;
    window.CURRENT_CITY = DalianCity;
    loadStationBoardModules();
    window.CityDataManager?.registerCity?.({
        id: DalianCity.id,
        name: DalianCity.name,
        folder: "./city/dalian",
        mainLogic: "./city/dalian/dalian.js",
        center: DalianCity.center,
        defaultScale: DalianCity.defaultScale,
        mapSize: DalianCity.mapSize,
        searchCity: DalianCity.searchCity,
        title: "CGo OpenMap - 大连地铁线网图",
        keywords: "CGo OpenMap, 大连地铁, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的大连地铁轨道交通交互线路图",
        isDefault: false,
        ...DalianCity
    });
})();
