/**
 * CGo OpenMap - 呼和浩特城市配置与能力接口 (city/hohhot/hohhot.js)
 *
 * 线路站序与站名取自呼和浩特地铁官网「交互线路图」（https://hhhtmetro.com/hsdt/toXlzs），
 * 线路标志色取自该图内联样式（1 号线 #bc3738、2 号线 #0367a5），
 * 车站真实经纬度取自高德地铁图接口（见 amap_data.json 的说明）。
 *
 * 数据文件由 main.html 按注册表自动加载：
 *   data_stations.js / data_lines.js / data_virtual_transfers.js /
 *   data_scattered.js / data_legend.js / data_timetable.js / data_notopen.js
 *
 * 车站信息板模块（modules/hohhot_timetable.js）、共享层渲染器，以及行程规划 / 固定侧栏 /
 * 跨城定位 / 地图小工具等共享能力（city/shenyang/shared/）由本文件的
 * loadStationBoardModules() 逐个 document.write 引入，须早于城市模块执行；
 * 加载顺序的硬约束见 city/shenyang/shared/README.md 第 2.1 节。
 */
(function () {
    /**
     * 站点图元（普通站沿用大连样式）
     *
     * 引擎通用模板为三层同心圆：地图底色 r=5 / 线路色 r=4.21 / 地图底色 r=3.5，
     * 最外圈地图底色会把站点与线路隔开一段白边。
     * 本城与大连一致：去掉最外的地图底色描边，并把环色由线路色改为地图文字色，
     * 使全图普通站统一为文字色圆环，线路色只保留在线路上。
     * 环宽沿用原值（0.71），仅改变颜色与去边；尺寸与 z 序仍由 css/style.css 的 .dot 决定。
     * 换乘站（tsf）不在此接管，回落引擎通用模板（保留换乘箭头与白边）。
     */
    const HHT_DOT_ICON = `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">`
        + `<circle cx="5" cy="5" r="4.21" fill="var(--text-color)"/>`
        + `<circle cx="5" cy="5" r="3.5" fill="var(--map-bg)"/>`
        + `</svg>`;

    /** 载入呼和浩特城市专属样式表（蒙文竖排站名、站型图元的城市口径） */
    (function loadCityStylesheet() {
        const href = "./city/hohhot/style.css";
        if (document.querySelector(`link[href^="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        const v = window.CGO_ASSET_VERSION;
        link.href = v ? `${href}?v=${v}` : href;
        document.head.appendChild(link);
    })();

    const HohhotCity = {
        id: "hohhot",
        name: "呼和浩特",
        // 城市主题色：呼和浩特地铁官方徽标蓝（与 city/data.js 中 svglogo 的原始填充色一致）
        themeColor: "#017FCB",
        searchCity: "呼和浩特",
        center: { x: 660, y: 490 },
        defaultScale: 1.0,
        // 线网含站名的外接盒 x 约 48…1260 / y 约 40…925，四周留出余量
        mapSize: { width: 1400, height: 1040 },
        // 官方交互线路图（线路与站序的核对入口）
        officialMapUrl: "https://hhhtmetro.com/hsdt/toXlzs",
        /**
         * 必须显式声明 dataFiles：引擎的默认回落对象指向北京（staname.csv / amap_data.json），
         * 若本城不声明，会去加载北京的旧站名库与 GCJ-02 坐标（「查找最近车站」将按北京算）。
         */
        dataFiles: {
            stanameCsvUrl: "./city/hohhot/staname.csv",
            amapDataUrl: "./city/hohhot/amap_data.json"
        },
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2"],
        LINE_SYNC_GROUPS: [],
        // 国铁点状条目（只落站徽标、不绘制走向）；引擎据此把同名站区分为「火车站 / 地铁站」
        SUBURBAN_LINES: ["Rwy"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        /**
         * 城市级站点图元接管（core/ 保持城市无关，本城专属画法只放本目录）：
         * 普通站（dot / tsfo）改为地图文字色圆环并去掉引擎模板最外的地图底色描边
         * （样式与大连一致）。其余站型返回 null，回落引擎通用模板。
         */
        renderStationIcon(station) {
            if (!station) return null;
            if (station.type === "dot" || station.type === "tsfo") {
                return { html: HHT_DOT_ICON, className: "hht-station-ring" };
            }
            return null;
        },
        /** 高德导航搜索词：高德 POI 命名为「站名(地铁站)」 */
        getNavigationUrl(stationName) {
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stationName}(地铁站)`)}&city=${encodeURIComponent("呼和浩特")}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "呼和浩特城市交通投资建设集团有限公司";
        },
        formatCompanyString(companyList) {
            const normalized = companyList.map((name) => this.formatOwnerName(name));
            return [...new Set(normalized)].join("，") || this.formatOwnerName("");
        },
        /** 车站地图卡片：渲染逻辑在共享层 stacard-engine.js（见 stacard/script.js，ES module） */
        stacard: {
            script: "./city/hohhot/stacard/script.js",
            geoDataUrl: "./city/hohhot/amap_data.json",
            basePath: "./city/hohhot/stacard/",
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
            // 紧凑线路徽标模块须早于时刻表模块加载：它只装一个 MutationObserver，
            // 靠 rAF 跟随信息板重渲染，故早于/晚于信息板首渲染都能追上；
            // 排在蒙文模块（hohhot_mongolian.js，负责按需加载蒙文字体）之后即可。
            scripts: [
                "modules/hohhot_mongolian.js",
                "modules/hohhot_station_board.js",
                "modules/hohhot_timetable.js",
                "modules/hohhot_facilities.js"
            ],
            modules: {
                "hohhot-line-timetable": { enabled: true, order: 15, targetTab: "line-tab" },
                // 车站层级图（官网剖面图，折叠行默认展开、缩略图懒加载）挂在「车站信息」选项卡；
                // order 与沈阳设施板块一致（车站类型之后、运营单位之前）
                "hohhot-facilities": { enabled: true, order: 6, targetTab: "station-info" }
            }
        }
    };

    /**
     * 官网时刻表的「终点站中文名 → 车站 ID」索引（惰性构建一次）
     *
     * 官网接口以终点站**站名**为方向键（如「坝堰（机场）」），而规划契约要的是
     * **车站 ID**（内核靠它判行进方向），故按 stationsData 反查。
     * 只在本城站名表里出现首个同名项处登记，重名站不会互相覆盖。
     */
    let hhtStationIdByName = null;
    function stationIdOfName(name) {
        if (!hhtStationIdByName) {
            hhtStationIdByName = new Map();
            const stations = typeof stationsData !== "undefined" ? stationsData : null;
            Object.entries(stations || {}).forEach(([id, station]) => {
                if (station?.cn && !hhtStationIdByName.has(station.cn)) {
                    hhtStationIdByName.set(station.cn, id);
                }
            });
        }
        return hhtStationIdByName.get(name) || "";
    }

    /**
     * 行程规划的城市侧配置
     *
     * 共享层负责算法、面板、坐标索引与站外换乘收集，本城只描述「数据长什么样」：
     * - coords：坐标兜底数据源（官方只公布票价与首末班、不公布里程，本城 distances
     *   尚未录入，里程一律由 amap_data.json 的坐标估算）
     * - reader：把官网「列车时刻表」的逐站首末班摊平成构建器要的时间条目
     * - fare：本城票价政策（见下）
     * - fareSystems：本城 1、2 号线并网、站内换乘，只有一个计费系统，故不声明
     * 上述配置都在实际规划时才被读取，不必担心此刻共享层尚未加载。
     */
    window.CGO_ROUTE_CONFIG = {
        coords: HohhotCity.dataFiles.amapDataUrl,
        // CGoUI 内置图标库没有呼和浩特徽标，故这里只放通用列车图标兜底，
        // 真正的官方徽标由下面的 officialIcon 提供
        cityIcon: "train",
        /**
         * 官网查询按钮的图标：本城用官方徽标本身。
         * 直接取 city/data.js 注册表里的 svglogo —— 它按约定已去色、坐标归一化到 100×100
         * 但不带 viewBox，这里补上再交给共享层；内联 SVG 才能吃到 currentColor，
         * 跟随按钮文字色并适配亮 / 暗主题。
         */
        officialIcon() {
            const logo = window.CITY_REGISTRY?.[HohhotCity.id]?.svglogo;
            return logo
                ? { svg: logo.replace("<svg ", '<svg viewBox="0 0 100 100" ') }
                : { name: "train" };
        },
        /**
         * 票价规则（呼和浩特市发展和改革委员会《关于呼和浩特市轨道交通票制票价的通知》）：
         * 0-5 公里（含）2 元；5-10 / 10-15 / 15-21 / 21-28 公里（含）依次 3 / 4 / 5 / 6 元；
         * 28 公里以上每增加 1 元可继续乘坐 10 公里。
         */
        fare: {
            metro(km) {
                const cuts = [5, 10, 15, 21, 28];
                if (km <= cuts[0]) return 2;
                for (let i = 1; i < cuts.length; i += 1) {
                    if (km <= cuts[i]) return i + 2;
                }
                return 6 + Math.ceil((km - 28) / 10);
            }
        },
        /**
         * 契约里用 label 把首班 / 末班拆成两条独立链（链内逐站取时刻差即区间用时），
         * 与官网「每站每方向各有 first / last」的口径一致。
         */
        reader(line, sid) {
            const info = window.GLOBAL_SCHEDULE_DATA?.[line?.id]?.[String(sid)];
            const slot = window.CGoRouteData?.hourSlots;
            if (!info?.directions || typeof slot !== "function") return [];
            const out = [];
            Object.entries(info.directions).forEach(([destName, times]) => {
                const dest = stationIdOfName(destName);
                if (!dest) return;
                out.push(...slot(dest, [
                    ["first", "首班", times?.first],
                    ["last", "末班", times?.last]
                ]));
            });
            return out;
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261006.120000";
        // 首末班车共享渲染层（须早于城市时刻表模块）
        document.write(`<script src="./city/shenyang/shared/timetable-renderer.js?v=${version}"><\/script>`);
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒）
        document.write(`<script src="./city/shenyang/shared/route-data.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-planner.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-panel.js?v=${version}"><\/script>`);
        // 跨城市「查找最近车站」：接管核心的 findNearestStation 及其「距离较远」confirm
        document.write(`<script src="./city/shenyang/shared/nearest-station.js?v=${version}"><\/script>`);
        // 固定侧栏「浮岛卡片」改造（须晚于 route-panel.js，样式表以本层为准）
        document.write(`<script src="./city/shenyang/shared/sidebar-refit.js?v=${version}"><\/script>`);
        // 地图小工具（票价图 / 等时圈 / 多人汇合）：取 route-data + route-planner 建图寻路
        document.write(`<script src="./city/shenyang/shared/map-tools.js?v=${version}"><\/script>`);
        // 浮层遮挡：声明浮层占用的边缘尺寸，由引擎据此收窄平移边界与居中区（须晚于上面三者）
        document.write(`<script src="./city/shenyang/shared/viewport-inset.js?v=${version}"><\/script>`);
        // 车站设施共享渲染层（须早于本城设施模块与数据文件；样式表由共享层按自身 URL 注入）
        document.write(`<script src="./city/shenyang/shared/facilities.js?v=${version}"><\/script>`);
        // 本城车站层级图数据（须早于本城设施模块）
        document.write(`<script src="./city/hohhot/data_facilities.js?v=${version}"><\/script>`);
        (HohhotCity.stationBoard?.scripts || []).forEach((scriptPath) => {
            document.write(`<script src="./city/hohhot/${scriptPath}?v=${version}"><\/script>`);
        });
    }

    window.HOHHOT_CITY = HohhotCity;
    window.CURRENT_CITY = HohhotCity;
    loadStationBoardModules();
    window.CityDataManager?.registerCity?.({
        id: HohhotCity.id,
        name: HohhotCity.name,
        themeColor: HohhotCity.themeColor,
        folder: "./city/hohhot",
        mainLogic: "./city/hohhot/hohhot.js",
        center: HohhotCity.center,
        defaultScale: HohhotCity.defaultScale,
        mapSize: HohhotCity.mapSize,
        searchCity: HohhotCity.searchCity,
        title: "CGo OpenMap - 呼和浩特轨道交通线路图",
        keywords: "CGo OpenMap, 呼和浩特地铁, 呼和浩特轨道交通, 线路图",
        description: "包含运营中的 1、2 号线（共 43 座车站，新华广场为换乘站）与 2 座国铁车站，站序与首末班车取自官方。",
        officialMapUrl: HohhotCity.officialMapUrl,
        registerDate: "2026-10-04",
        status: "active",
        // 城市主理人虚位以待（写法与哈尔滨一致，详见 city/data.js 同名字段的说明）
        maintainers: [
            {
                name: "待认领", role: "城市主理人招募中", isRecruiting: true,
                github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md"
            }
        ],
        isDefault: false,
        ...HohhotCity
    });
})();
