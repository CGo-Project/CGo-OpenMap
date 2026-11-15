/**
 * CGo OpenMap - 城市配置与能力接口 (city/xiamen/xiamen.js)
 *
 * 线路与站点几何由 CGo OpenMap 线路图在线编辑器产出，本目录**手工维护**（原一键导出工具已弃用）。
 *
 * 快速公交（BRT）不是一条独立线路而是一个线网：快1/2/3/5/6/7/8/9 路共用专用道与车站，
 * 因此 BRT 在 data_lines.js 里写成「一条线 + 8 条交路」（way1…way8），交路显示名见 wayNames。
 *
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 */

(function () {
    const XiamenCity = {
        id: "xiamen",
        name: "厦门",
        themeColor: "#032976",
        searchCity: "厦门",
        center: { x: 950, y: 800 },
        defaultScale: 1.0,
        mapSize: { width: 1900, height: 1600 },
        officialMapUrl: "https://www.xmgdjt.com.cn/",
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2", "M3", "M4", "M5", "BRT"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        dataFiles: {
            stanameCsvUrl: "./city/xiamen/staname.csv"
        },
        getNavigationUrl(stationName) {
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stationName}(地铁站)`)}&city=${encodeURIComponent("厦门")}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName && rawOwnerName !== "未知运营" ? rawOwnerName : "厦门轨道建设发展集团";
        },
        formatCompanyString(companyList) {
            const normalized = companyList.map((name) => this.formatOwnerName(name));
            return [...new Set(normalized)].join("，") || this.formatOwnerName("");
        },
        stacard: {
            script: "./city/xiamen/stacard/script.js",
            basePath: "./city/xiamen/stacard/",
            getRenderer: () => window.XiamenStaCard || window.StaCard || null
        },
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({ basePath: this.stacard.basePath, ...options });
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
                "./city/xiamen/modules/xiamen_brt_routes.js"
            ],
            modules: {
                "xiamen-brt-routes": { enabled: true, order: 14, targetTab: "station-info" },
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" }
            }
        }
    };

    // 城市专属样式与模块必须在核心引擎执行前同步载入（与其它城市一致：document.write）
    // 快速公交 8 条营运快线路的站序/站距已并入 data_lines.js 的 BRT 交路（way1…way8），
    // 不再单独维护 data_brt_routes.js；模块只负责把交路信息展示到车站卡片里。
    if (typeof document !== "undefined" && typeof document.write === "function") {
        const suffix = window.CGO_ASSET_VERSION ? "?v=" + window.CGO_ASSET_VERSION : "";
        document.write('<link rel="stylesheet" href="./city/xiamen/style.css' + suffix + '">');
        document.write('<scr' + 'ipt src="./city/xiamen/modules/xiamen_brt_routes.js' + suffix + '"><\/scr' + 'ipt>');
    }

    window.XIAMEN_CITY = XiamenCity;
    window.CURRENT_CITY = XiamenCity;
    window.CityDataManager?.registerCity?.({
        id: XiamenCity.id,
        name: XiamenCity.name,
        folder: "./city/xiamen",
        mainLogic: "./city/xiamen/xiamen.js",
        center: XiamenCity.center,
        defaultScale: XiamenCity.defaultScale,
        mapSize: XiamenCity.mapSize,
        searchCity: XiamenCity.searchCity,
        title: "CGo OpenMap - 厦门轨道交通线路图",
        keywords: "CGo OpenMap, 厦门, 轨道交通, 线路图, 快速公交, BRT",
        description: "厦门轨道交通 1 / 2 / 3 / 4 / 6 号线与快速公交（BRT）线路图，含快1/2/3/5/6/7/8/9 路经停查询。",
        registerDate: "2026-10-03",
        stationCount: 169,
        status: "active",
        isDefault: false,
        ...XiamenCity
    });
})();
