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
            scripts: ["modules/harbin_map.js", "modules/harbin_station_title.js", "modules/harbin_exits.js"],
            // 出入口独立页签（自定义 tab），渲染在「车站信息」之前
            tabs: [
                { id: "harbin-exits", title: "出入口", icon: "gate" }
            ],
            modules: {
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" },
                // 出入口页签（自定义 tab，见上方 tabs）
                "harbin-exits": { enabled: true, targetTab: "harbin-exits", order: 10 }
            }
        }
    };

    /**
     * 行程规划的城市侧配置
     *
     * 共享层负责算法、面板、坐标索引与站外换乘收集，本城只描述「数据长什么样」：
     * - coords：坐标兜底数据源 —— 里程以 data_lines.js 的 distances 为准（官方不公布
     *   逐站里程，本城按 OSM 线路走向量算，见 data_lines.js 头部），仅缺失路段回退估算
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
         *
         * ⚠️ 计价口径的已知偏差：本表按**站距**（data_lines.js 的 distances）套费率，
         * 而票价实际按**计价里程**分档结算 —— 两者不是同一套数，**档位分界点附近的站对
         * 可能错一档**（同一段路在临界处差 1 元）。本城官方只公布线网级里程，站距系按
         * OSM 线路走向量算（**非官方数据**，见 data_lines.js 头部），沿轨总长与官方线网
         * 里程相差约 1.4%~2.3%；以高德坐标直线距离抽样核对，逐段吻合良好。福州已改用
         * 官网抓取的站间票价表（city/fuzhou/data_official_fare.js，10302 组）消除该误差，
         * 本城暂维持按费率推算。若要完全对齐，需拿到本城官网的分站票价表。
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
        /**
         * 站外换乘的步行时间（分钟）。键为 `起点ID|终点ID`，逐对覆盖共享层的 6 分钟
         * 默认值（机制见 shared/route/route-data.js）。
         *
         * 本城四条站外配对都是「国铁车站 ⇄ 同名地铁站」：两者分属国铁与地铁两套票务
         * 系统、付费区不连通，出站换乘需重新购票（见 data_virtual_transfers.js）。
         * 哈尔滨市府（2024-11-27）载地铁站已与各火车站实现无缝接驳。
         *
         * 口径为「出站 → 步行 → 进站 → 到站台」的总时间 = 出站口至地铁口步行距离
         * ÷ 60 米/分钟 + 3 分钟（进出站安检与上下站台）。
         *
         * 来源（均为「出站口 → 地铁口」实测距离）：
         *   · 哈尔滨站 HBB ⇄ HEB：步行 172 米（哈尔滨本地宝《哈尔滨火车站怎么去会展
         *     中心》2025-08-04 口径）；
         *   · 哈尔滨西站 VAB ⇄ HEBX：步行 59 米（山东省注协哈市培训班交通指引
         *     2025-09-01）；地铁哈尔滨西站位于国铁换乘大厅内，出站口直行即到
         *     （哈尔滨日报 2017-01-27）；
         *   · 哈尔滨北站 HTB ⇄ HEBB：步行 272 米至 4 号口（同上山东省注协指引）；
         *   · 哈尔滨东站 VBB ⇄ HEBD：步行 108 米至 3 号口（哈尔滨本地宝 2025-08-04）。
         *
         * 两个方向写同一分钟数 —— 步行时间与方向无关。
         */
        walkMinutes: {
            "HBB|HEB": 6, "HEB|HBB": 6,       // 哈尔滨站（国铁）⇄ 哈尔滨站（2 号线）
            "VAB|HEBX": 4, "HEBX|VAB": 4,     // 哈尔滨西站（国铁）⇄ 哈尔滨西站（3 号线）
            "HTB|HEBB": 8, "HEBB|HTB": 8,     // 哈尔滨北站（国铁）⇄ 哈尔滨北站（2 号线）
            "VBB|HEBD": 5, "HEBD|VBB": 5      // 哈尔滨东站（国铁）⇄ 哈尔滨东站（1 号线）
        },
        /**
         * 站内换乘方式与换乘用时（分钟）。键为换乘站 ID，机制见 shared/route/route-data.js
         * 的 transferAt。未列出的换乘站用共享层默认值（2 分钟）。
         *
         * 换乘方式按步行尺度分档：同台 / 节点换乘 1 分钟量级，站厅换乘 2~3 分钟，
         * 通道换乘 4~5 分钟。用时口径：能查到实测分钟的用实测值，只有站内换乘步行
         * 距离的按「距离 ÷ 60 米/分钟」取整（不足 1 分钟按 1 分钟）——博物馆、医大二院
         * 两站由两个独立来源交叉验证（见下），该口径与实测吻合。
         *
         * 全城 5 座换乘站（哈尔滨市府 2024-11-27《哈尔滨地铁开启“十字+环线”新篇章》）：
         */
        transferAt: {
            // 博物馆 1号线 ⇄ 2号线：T型换乘站（线路走向十字交叉，受条件所限做成 T 型；
            // 地下三层为 2 号线站台、地下四层为 1 号线站台）——中国地铁网 2012-07-19
            // 《冰城地铁新规划》引哈尔滨地铁集团口径。站内换乘 56 米约 1 分钟，
            // 见 CIMC“西门子杯”2024 年东北二赛区交通指引（哈站 → 哈工大路线：
            // “于博物馆换乘 1 号线，站内换乘 56 米 1 分钟”）。
            "BWG": { mode: "T型节点换乘", minutes: 1 },
            // 医大二院 1号线 ⇄ 3号线：两线沿学府路与保健路十字相交、3 号线站台位于
            // 1 号线站台正下方，站台中间楼梯可直接上下换乘（哈尔滨日报 2017-01-26
            // 《哈尔滨地铁会“拐弯”了》开通日报道）。站内换乘约 80 米 1 分钟，
            // 见 CIMC“西门子杯”2024 年东北二赛区交通指引（哈西站 → 哈工大路线）。
            "YDEY": { mode: "十字节点换乘", minutes: 1 },
            // 人民广场 2号线 ⇄ 3号线：车站与既有 2 号线人民广场站 T 型换乘
            // （哈尔滨发布 2024-10-04《地铁3号线人民广场站装饰装修即将完成》）。
            // 换乘路径为站厅层乘换乘扶梯直下 2 号线站台层（哈尔滨日报 2024-12-09
            // 实地走访），换乘步行约 100 米（公交网换乘方案口径）。
            "RMGC": { mode: "T型节点换乘", minutes: 2 },
            // 珠江路 2号线 ⇄ 3号线：地下三层岛式站台车站，地下一层为两线共用站厅层、
            // 地下二层为 3 号线站台层、地下三层为 2 号线站台层（东北网 / 哈尔滨日报
            // 2020-12-26《2号线一期、3号线二期东南环实现“车通”》），属站厅换乘；
            // 换乘步行约 110 米（公交网换乘方案口径）。
            "ZJL": { mode: "站厅换乘", minutes: 2 },
            // 太平桥 1号线 ⇄ 3号线：本站采用 T 形换乘，1 号线为一岛一侧式车站、
            // 位于上层，3 号线为岛式车站、位于下层（高楼迷引哈尔滨地铁 1 号线
            // 各站资料 2013-08）；换乘步行约 190 米（公交网换乘方案口径）。
            "TPQ": { mode: "T型节点换乘", minutes: 3 }
        },
        reader() {
            return [];
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261010.1526";
        // 环线方向文案（内环 / 外环）：须早于行程规划与时刻表渲染
        document.write(`<script src="./city/shenyang/shared/route/loop-direction.js?v=${version}"><\/script>`);
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒）
        document.write(`<script src="./city/shenyang/shared/route/route-data.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route/route-planner.js?v=${version}"><\/script>`);
        // 移动端抽屉手势引擎（车站详情与行程/结果面板共用；须早于两个消费方）
        document.write(`<script src="./city/shenyang/shared/base/sheet-drag.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route/route-panel-icons.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route/route-panel-search.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route/route-panel.js?v=${version}"><\/script>`);
        // 跨城市「查找最近车站」：接管核心的 findNearestStation 及其「距离较远」confirm
        document.write(`<script src="./city/shenyang/shared/station/nearest-station.js?v=${version}"><\/script>`);
        // 固定侧栏「浮岛卡片」改造（须晚于 route-panel.js，样式表以本层为准）
        document.write(`<script src="./city/shenyang/shared/base/sidebar-refit.js?v=${version}"><\/script>`);
        // 地图小工具（票价图 / 等时圈）：入口在「查找最近车站」按钮下方
        document.write(`<script src="./city/shenyang/shared/tools/map-tools-color.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/tools/map-tools.js?v=${version}"><\/script>`);
        // 侧栏站名标题归一化（本城文案规则在 modules/ 内）
        document.write(`<script src="./city/shenyang/shared/base/station-title.js?v=${version}"><\/script>`);
        // 浮层遮挡：声明浮层占用的边缘尺寸，由引擎据此收窄平移边界与居中区
        document.write(`<script src="./city/shenyang/shared/base/viewport-inset.js?v=${version}"><\/script>`);
        // 移动端抽屉手势仲裁：内容区优先滚动、半屏上滑优先展开（core 零改动，见 shared/base/panel-sheet-gesture.js）
        document.write(`<script src="./city/shenyang/shared/base/panel-sheet-gesture.js?v=${version}"><\/script>`);
        // 上一站 / 下一站点击跳转：面板装配完成后给 info-value 绑定目标站（core 零改动）
        document.write(`<script src="./city/shenyang/shared/station/adjacent-jump.js?v=${version}"><\/script>`);
        // 城市私有数据与车站出入口（须早于依赖它的模块加载）
        document.write(`<script src="./city/harbin/data_exits.js?v=${version}"><\/script>`);
        // 「快速前往」静态推荐清单（行程规划面板；约定全局 CGO_HOTSPOTS）
        document.write(`<script src="./city/harbin/data_hotspots.js?v=${version}"><\/script>`);
        // 反馈面板（出入口「待补充」与右上角「更多」入口共用；须早于 exits.js）
        document.write(`<script src="./city/shenyang/shared/feedback/feedback.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/station/exits.js?v=${version}"><\/script>`);
        // 出入口检索：全局搜索栏与行程规划起终点的出入口命中（须在 exits.js 之后）
        document.write(`<script src="./city/shenyang/shared/station/exit-search.js?v=${version}"><\/script>`);
        // 开通沿革时间线（发展史动态演示的数据源，约定全局 CGO_OPENING_HISTORY）
        document.write(`<script src="./city/harbin/data_opening_history.js?v=${version}"><\/script>`);
        // 线网发展史：把沿革时间线播成生长动画，经 CGoMapTools.registerTool 挂进「地图小工具」
        document.write(`<script src="./city/shenyang/shared/tools/opening-history.js?v=${version}"><\/script>`);
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
