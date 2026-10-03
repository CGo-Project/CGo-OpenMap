/**
 * CGo OpenMap - 哈尔滨城市配置与能力接口 (city/harbin/harbin.js)
 *
 * 线路与站点数据取自高德地铁图接口（1 / 2 / 3 号线全线，3 号线为环线）。
 * 城市专属模块位于 modules/，本文件只保留数据关系、运行时参数与共享层的能力桥接。
 *
 * 数据文件由 main.html 按注册表自动加载：
 *   data_stations.js / data_lines.js / data_virtual_transfers.js /
 *   data_scattered.js / data_legend.js / data_timetable.js / data_notopen.js
 *
 * 共享层（临时位于 city/shenyang/shared/）由本文件的 loadStationBoardModules()
 * 逐个 document.write 引入，须早于城市模块执行。
 */
(function () {
    /**
     * 站点图元 (哈尔滨变体，口径与大连一致)
     *
     * 引擎通用模板为三层同心圆：地图底色 r=5 / 线路色 r=4.21 / 地图底色 r=3.5，
     * 最外圈地图底色会把站点与线路隔开一段白边。
     * 本城与大连相同：去掉最外的地图底色描边，并把圆环色由线路色改为地图文字色，
     * 使全图站点统一为文字色圆环（与换乘站同色系），线路色只保留在线路上。
     * 环宽沿用原值（普通站 0.71、换乘站 0.9），仅改变颜色与去边。
     */
    const HRB_DOT_ICON = `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">`
        + `<circle cx="5" cy="5" r="4.21" fill="var(--text-color)"/>`
        + `<circle cx="5" cy="5" r="3.5" fill="var(--map-bg)"/>`
        + `</svg>`;

    /** 换乘站：文字色双环 + 双向换乘箭头（箭头同取文字色，与大连一致） */
    const HRB_TSF_ICON = `<svg viewBox="0 0 17.5 17.5" xmlns="http://www.w3.org/2000/svg">`
        + `<circle cx="8.75" cy="8.75" r="8" fill="var(--text-color)"/>`
        + `<circle cx="8.75" cy="8.75" r="7.1" fill="var(--map-bg)"/>`
        + `<path d="M6.21,8.01c.12-2.35,2.26-4.22,4.88-4.22.23,0,.46.01.68.04-.55-.18-1.15-.27-1.77-.27-2.8,0-5.09,1.96-5.3,4.45h-1.4l2.34,2.47c.78-.82,1.56-1.65,2.34-2.47h-1.78.01Z" fill="var(--text-color)"/>`
        + `<path d="M11.85,7.02c-.78.82-1.56,1.65-2.34,2.47h1.78c-.12,2.35-2.26,4.22-4.88,4.22-.23,0-.46-.01-.68-.04.55.18,1.15.27,1.77.27,2.8,0,5.09-1.96,5.3-4.45h1.4l-2.34-2.47h0Z" fill="var(--text-color)"/>`
        + `</svg>`;

    const HarbinCity = {
        id: "harbin",
        name: "哈尔滨",
        searchCity: "哈尔滨",
        center: { x: 700, y: 780 },
        defaultScale: 0.55,
        // 线网含站名的外接盒 x 235…1163 / y 94…1465，右、下各留约 125px 余量
        mapSize: { width: 1290, height: 1590 },
        // 官方域名（现挂「维护升级中」）；官方公告另有市政府交通栏目
        officialMapUrl: "http://www.harbin-metro.com/",
        /**
         * 必须显式声明 dataFiles：引擎的默认回落对象指向北京（staname.csv / amap_data.json），
         * 若本城不声明，会去加载北京的旧站名库与 GCJ-02 坐标（「查找最近车站」将按北京算）。
         */
        dataFiles: {
            stanameCsvUrl: "./city/harbin/staname.csv",
            amapDataUrl: "./city/harbin/amap_data.json"
        },
        LINE_META: {},
        LINE_SORT_ORDER: ["HBM01", "HBM02", "HBM03"],
        LINE_SYNC_GROUPS: [],
        // 国铁点状条目（只落站徽标，不绘制走向），与大连 / 长春同口径
        SUBURBAN_LINES: ["Rwy"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        /**
         * 城市级站点图元接管（core/ 保持城市无关，本城专属画法只放本目录）：
         * dot / tsfo / tsf 统一改为地图文字色圆环，并去掉引擎模板最外的地图底色描边，
         * 口径与本项目的其他城市保持一致。
         * 尺寸与 z 序沿用 css/style.css 的 .dot / .tsfo / .tsf，不在此覆盖。
         * 其余站型（no / rdot 等）返回 null，回落引擎通用模板。
         */
        renderStationIcon(station) {
            if (!station) return null;
            if (station.type === "dot" || station.type === "tsfo") {
                return { html: HRB_DOT_ICON, className: "hrb-station-ring" };
            }
            if (station.type === "tsf") {
                return { html: HRB_TSF_ICON, className: "hrb-station-ring" };
            }
            return null;
        },
        /**
         * 高德导航搜索词（与高德 POI 命名一致）：
         *   火车站 → 「站名」（裸名）；地铁站 → 「站名(地铁站)」
         */
        getNavigationUrl(stationName, isRailway = false) {
            const query = isRailway ? stationName : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("哈尔滨")}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "哈尔滨地铁集团有限公司";
        },
        formatCompanyString(companyList) {
            const normalized = companyList.map((name) => this.formatOwnerName(name));
            return [...new Set(normalized)].join("，") || this.formatOwnerName("");
        },
        /** 车站地图卡片：渲染逻辑在共享层 stacard-engine.js（见 stacard/script.js，ES module） */
        stacard: {
            script: "./city/harbin/stacard/script.js",
            geoDataUrl: "./city/harbin/amap_data.json",
            basePath: "./city/harbin/stacard/",
            getRenderer: () => window.CGoStaCard || null
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
            scripts: ["modules/harbin_map.js", "modules/harbin_station_title.js"],
            modules: {
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" }
            }
        }
    };

    /**
     * 行程规划的城市侧配置
     *
     * 共享层负责算法、面板、坐标索引与站外换乘收集，本城只描述「数据长什么样」：
     * - coords：坐标兜底数据源（本城 distances 尚未补录，里程一律由坐标估算）
     * - fare：本城票价政策
     * - reader：本城暂无逐站首末班车数据（官方只发布线网级时段，官网长期维护中），
     *   返回空数组，规划内核改用坐标兜底估算区间用时
     */
    window.CGO_ROUTE_CONFIG = {
        coords: HarbinCity.dataFiles.amapDataUrl,
        cityIcon: "harbin",
        /**
         * 票价规则（哈尔滨市发改委口径，与沈阳市相同）
         * 起步 2 元可乘 6 公里；3~6 元的分界里程依次为 10 / 14 / 21 / 28 公里，
         * 29 公里以上每增加 10 公里增加 1 元。
         */
        fare: {
            metro(km) {
                const cuts = [6, 10, 14, 21, 28];
                if (km <= cuts[0]) return 2;
                for (let i = 1; i < cuts.length; i += 1) {
                    if (km <= cuts[i]) return i + 2;
                }
                return 6 + Math.ceil((km - 28) / 10);
            }
        },
        reader() {
            return [];
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261003.0929";
        // 环线方向文案（内环 / 外环）：须早于行程规划与时刻表渲染
        document.write(`<script src="./city/shenyang/shared/loop-direction.js?v=${version}"><\/script>`);
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒）
        document.write(`<script src="./city/shenyang/shared/route-data.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-planner.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-panel.js?v=${version}"><\/script>`);
        // 跨城市「查找最近车站」：接管核心的 findNearestStation 及其「距离较远」confirm
        document.write(`<script src="./city/shenyang/shared/nearest-station.js?v=${version}"><\/script>`);
        // 固定侧栏「浮岛卡片」改造（须晚于 route-panel.js，样式表以本层为准）
        document.write(`<script src="./city/shenyang/shared/sidebar-refit.js?v=${version}"><\/script>`);
        // 地图小工具（票价图 / 等时圈）：入口在「查找最近车站」按钮下方
        document.write(`<script src="./city/shenyang/shared/map-tools.js?v=${version}"><\/script>`);
        // 侧栏站名标题归一化（本城文案规则在 modules/ 内）
        document.write(`<script src="./city/shenyang/shared/station-title.js?v=${version}"><\/script>`);
        // 浮层遮挡：声明浮层占用的边缘尺寸，由引擎据此收窄平移边界与居中区
        document.write(`<script src="./city/shenyang/shared/viewport-inset.js?v=${version}"><\/script>`);
        (HarbinCity.stationBoard?.scripts || []).forEach((scriptPath) => {
            document.write(`<script src="./city/harbin/${scriptPath}?v=${version}"><\/script>`);
        });
    }

    window.HARBIN_CITY = HarbinCity;
    window.CURRENT_CITY = HarbinCity;
    loadStationBoardModules();
    window.CityDataManager?.registerCity?.({
        id: HarbinCity.id,
        name: HarbinCity.name,
        folder: "./city/harbin",
        mainLogic: "./city/harbin/harbin.js",
        center: HarbinCity.center,
        defaultScale: HarbinCity.defaultScale,
        mapSize: HarbinCity.mapSize,
        searchCity: HarbinCity.searchCity,
        title: "CGo OpenMap - 哈尔滨轨道交通线路图",
        keywords: "CGo OpenMap, 哈尔滨地铁, 哈尔滨轨道交通, 线路图",
        description: "包含 1、2、3 号线全线（3 号线为环线）与 4 座国铁车站。",
        officialMapUrl: HarbinCity.officialMapUrl,
        registerDate: "2026-09-28",
        status: "active",
        // 主理人虚位以待（写法与上海 / 悉尼 / 香港一致，详见 city/data.js 同名字段的说明）
        maintainers: [
            {
                name: "待认领", role: "城市主理人招募中", isRecruiting: true,
                github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md"
            }
        ],
        isDefault: false,
        ...HarbinCity
    });
})();
