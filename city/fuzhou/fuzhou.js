/**
 * CGo OpenMap - 城市配置与能力接口 (city/fuzhou/fuzhou.js)
 *
 * 线路与站点数据来自 CGo OpenMap 线路图在线编辑器，本文件负责城市运行时元数据。
 *
 * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（2026-09-16）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 *
 * 2026-10 增补：接入共享层（临时位于 city/shenyang/shared/）的完整行程规划链与
 * 地图小工具（票价图 / 等时圈 / 多人汇合）。城市侧只补 window.CGO_ROUTE_CONFIG 薄配置：
 *   - reader  ：把官网站点查询的首末班摊平成构建器要的时间条目；
 *   - fare    ：**只查官网抓取的官方站间票价表**（data_official_fare.js），不做站距推算。
 * 城市数据的说明见同目录 README.md，契约自检见 tools/fuzhou_check.js。
 */

(function () {
    const FuzhouCity = {
        id: "fuzhou",
        name: "福州",
        themeColor: "#079445",
        searchCity: "福州",
        center: { x: 1250, y: 800 },
        defaultScale: 1.0,
        mapSize: { width: 2500, height: 1600 },
        /**
         * 官网线路查询入口（首页城市卡片的「官方参考」链接）。
         * 与 city/data.js 的注册项保持一致；两处都写是因为各城 {city}.js 末尾的
         * registerCity(...) 会以本对象覆盖注册表，漏写就会把 data.js 里那份抹掉。
         */
        officialMapUrl: "https://www.fzmtr.com/xlcx",
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2", "M3", "M4", "M5", "M6"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        dataFiles: {
            stanameCsvUrl: "./city/fuzhou/staname.csv",
            amapDataUrl: "./city/fuzhou/amap_data.json"
        },
        getNavigationUrl(stationName) {
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stationName}(地铁站)`)}&city=${encodeURIComponent("福州")}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName && rawOwnerName !== "未知运营" ? rawOwnerName : "福州轨道交通";
        },
        formatCompanyString(companyList) {
            const normalized = companyList.map((name) => this.formatOwnerName(name));
            return [...new Set(normalized)].join("，") || this.formatOwnerName("");
        },
        stacard: {
            script: "./city/fuzhou/stacard/script.js",
            geoDataUrl: "./city/fuzhou/amap_data.json",
            basePath: "./city/fuzhou/stacard/",
            getRenderer: () => window.FuzhouStaCard || window.StaCard || null
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
                "modules/fuzhou_timetable.js",
                "modules/fuzhou_site_space.js",
                "modules/fuzhou_cultural.js"
            ],
            modules: {
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" },
                "fuzhou-line-timetable": { enabled: true, order: 22, targetTab: "line-tab" },
                // 文旅卡片：本站名胜指引 + 附近景点（点景点前往服务它的车站）
                "fuzhou-cultural-tip": { enabled: true, order: 14, targetTab: "station-info" },
                // 车站空间示意图与出入口是车站级资料（换乘站各线为同一张图），放在「车站信息」栏目
                "fuzhou-station-space": { enabled: true, order: 15, targetTab: "station-info" }
            }
        }
    };

    /* ======================================================================
     * 行程规划的城市侧配置（window.CGO_ROUTE_CONFIG）
     *
     * 共享层（city/shenyang/shared/）负责算法、面板、坐标索引与站外换乘收集，
     * 本城只描述「数据长什么样」：
     *   - coords   ：坐标兜底数据源；福州各线 distances 已按 OSM 轨道里程补全，仅作后备
     *   - lineCodes：线路编号徽标的城市覆盖（滨海快线写作 F1）
     *   - reader   ：把官网「站点查询」的首末班摊平成构建器要的时间条目
     *   - fare     ：查官方站间票价表（data_official_fare.js），不做站距推算
     * 各处都在实际规划时才被读取，故不必担心此刻共享层尚未加载
     * （下方 loadStationBoardModules() 会用 document.write 先引入共享层）。
     * ====================================================================== */

    /** 站序分组（分支安全，与共享层同口径：福州当前无分支线，属防御性写法） */
    function lineStationGroups(line) {
        if (line?.hasbranch) {
            return ["way1", "way2"].map((way) => line[`stationIds-${way}`] || []).filter((ids) => ids.length);
        }
        return line?.stationIds ? [line.stationIds] : [];
    }

    /**
     * 线路内「终点站中文名 → 车站 ID」解析表。
     *
     * 官网时刻表给的终点站名是与本站同线的车站中文名（如 1 号线「三江口」「象峰」），
     * 而规划内核的 dest 只认车站 ID、或 "line-first" / "line-last" 两个端点代号
     * （见 shared/route/route-data.js 的 chainDirection）——认不出来的链会被整条丢弃，
     * 区间用时只能退化成坐标模型估算，故这里必须翻译。
     *
     * 同名不唯一时不写进表：宁可退化成端点代号，也不要认错方向。
     * 端点站在站序两端，翻译成端点代号后语义完全等价。
     */
    function buildTerminusIndex() {
        const index = {};
        if (typeof linesData === "undefined" || !Array.isArray(linesData)) return index;
        const stations = typeof stationsData !== "undefined" ? stationsData : {};
        linesData.forEach((line) => {
            lineStationGroups(line).forEach((ids) => {
                const byName = new Map();
                ids.forEach((sid) => {
                    const cn = stations[sid]?.cn;
                    if (!cn) return;
                    byName.set(cn, byName.has(cn) ? null : sid);
                });
                const table = index[line.id] || (index[line.id] = {});
                byName.forEach((sid, cn) => {
                    if (!sid || table[cn]) return;
                    table[cn] = sid === ids[0] ? "line-first"
                        : sid === ids[ids.length - 1] ? "line-last" : sid;
                });
            });
        });
        return index;
    }

    /**
     * 滨海快线某方向的一格时刻 → 按列车类别拆分的首末班。
     *
     * 官网在同一格里写明「第三列(普通) 06:51 | 末班车(普通) 23:14」，另有直达 / 大站快车，
     * 例如「第一列(直达) 06:34 | 第二列(大站) 06:41」「第一列(直达) 05:55 | 第二列(大站) 06:00」。
     * 一格里可以混排多类车，故按「(类别) 时刻」逐段切分，再按「第 N 列 → 首班、末班车 → 末班」
     * 归位。类别必须各成一条链——大站快车跳站，与普通车串在一根链上逐站差值立刻失真。
     *
     * 取值一律来自官网原文里的时刻；不做任何推算。普通车与官网结构化的 first / last 冗余，
     * 只登记原文里确实列出的类别（大站 / 直达），避免同一时刻被两条链重复登记。
     *
     * @returns {{ first: Record<string,string>, last: Record<string,string> }}
     */
    function parseBinhaiClasses(text) {
        const first = {};
        const last = {};
        String(text || "").split("|").forEach((chunk) => {
            const match = /\(([^)]+)\)\s*(\d{1,2}:\d{2})/.exec(chunk);
            if (!match) return;
            const type = match[1];
            const time = match[2];
            // 「末班车(普通)」常与首班同格；同类只登记一次，避免同一时刻进两条链
            if (/末班/.test(chunk)) { if (!last[type]) last[type] = time; }
            else if (/第\s*\d+\s*列/.test(chunk) && !first[type]) first[type] = time;
        });
        return { first, last };
    }

    /**
     * 滨海快线某站的时刻条目：普通车取官网结构化的 first / last，其余类别按原文拆分。
     * 返回 [period, label, time] 三元组，交给构建器按「终点 | 期 | 标注」分链。
     */
    function binhaiEntries(times) {
        const entries = [["first", "普通首", times.first], ["last", "普通末", times.last]];
        const classes = parseBinhaiClasses(times.text);
        Object.keys(classes.first).forEach((type) => entries.push(["first", `${type}首`, classes.first[type]]));
        Object.keys(classes.last).forEach((type) => entries.push(["last", `${type}末`, classes.last[type]]));
        return entries;
    }

    /** 计费系统名：福州全网同网同价（滨海快线新区段是段内费率差，不是另一个售票系统） */
    const FUZHOU_FARE_SYSTEM = "metro";

    window.CGO_ROUTE_CONFIG = {
        coords: FuzhouCity.dataFiles.amapDataUrl,
        cityIcon: "fuzhou",
        /** 滨海快线是城际快线，编号按官方口径写作 F1（F 为小号修饰字） */
        lineCodes: { M6: { prefix: "F", code: "1" } },
        /**
         * 首末班取值：官网结构化的 first / last 一律是「HH:MM」或「次日HH:MM」，
         * 本城两种写法都有，这里统一交给 hourSlots；末班跨日用 period "last" 区分，
         * 不做跨零点合并——区间用时由构建器自行按 ±1440 处理。
         */
        reader(line, sid) {
            const info = (typeof GLOBAL_SCHEDULE_DATA !== "undefined" ? GLOBAL_SCHEDULE_DATA : null)?.[line.id]?.[sid];
            if (!info) return [];
            const slot = window.CGoRouteData.hourSlots;
            const terminuses = buildTerminusIndex()[line.id] || {};
            return Object.entries(info.directions || {}).flatMap(([destName, times]) => {
                const dest = terminuses[destName] || destName;
                // 滨海快线一格里混排普通 / 大站 / 直达，必须按类别分链；其余线路官网只有一类车
                const entries = line.id === "M6"
                    ? binhaiEntries(times)
                    : [["first", "首", times.first], ["last", "末", times.last]];
                return slot(dest, entries);
            });
        },
        /**
         * 票价（元）：**只取自官网抓取的官方站间票价表**（data_official_fare.js）。
         *
         * 福州地铁官网「票价线路查询」背后的接口
         *   GET /api/system/way/list?pageNum=1&pageSize=10&startStation={站名}&endStation={站名}
         * 给出全网运营车站两两组合的官方票价（10302 组，双向齐备）。本城直接查表返回，
         * **不做任何站距推算** —— 计价站距与土建站距本就不同源，拿 data_lines.js 的地图站距
         * 去套计费规则，必然在票价档位分界附近错档（实测约 3% 的组合差 ±1~2 元）。
         *
         * 查不到的组合返回 null（内核按「票价未知」处理、不显示票价，不猜不估）：
         *   · 起点或终点是官网未收录的 3 座未开通车站（莲花 / 壶井 / 滨海西）；
         *   · 同站进出（官方表不含该组合）。
         *
         * 票制背景（仅供阅读，不参与计算）：榕发改价格〔2025〕51 号把滨海快线分成
         * 主城区段（福州火车站—帝封江，计价 13.91 km，与地铁同网分段计价）与
         * 新区段（帝封江—文岭，计价 47.85 km，里程 × 0.3 元/公里、按元四舍五入），
         * 跨段行程两段分别计价后累加，单次行程不低于 2 元。
         * 这些规则已由官方票价表逐对体现，故代码里不再重复实现一份。
         */
        fareSystems: {},
        fare: {
            [FUZHOU_FARE_SYSTEM](km, context = {}) {
                const entry = String(context.entry ?? "");
                const exit = String(context.exit ?? "");
                const table = typeof FUZHOU_OFFICIAL_FARE !== "undefined" ? FUZHOU_OFFICIAL_FARE : null;
                if (!table || !entry || !exit || entry === exit) return null;
                const price = table[`${entry}|${exit}`];
                return Number.isFinite(price) ? price : null;
            }
        },
        /**
         * 站外换乘的步行时间（分钟）。键为 `起点ID|终点ID`，逐对覆盖共享层的 6 分钟默认值
         * （机制见 shared/route/route-data.js；行程规划、等时圈与票价图的用时都吃这个数）。
         *
         * 取值来自地面实测：
         *   · 水部（2 号线）⇄ 闽都（滨海快线）    约 10 分钟（地面直线 525 m，
         *     含进出站、过街与站厅穿行）；
         *   · 三叉街（1 号线）⇄ 三叉街（滨海快线） 约 6 分钟（地面直线 406 m，
         *     两站分属不同付费区，须出站换乘）。
         *
         * 两个方向写同一分钟数 —— 步行时间与方向无关；日后若拿到单向实测值
         * （例如某侧有专用通道），按方向分别写即可。
         */
        walkMinutes: {
            "M216|M603": 10, "M603|M216": 10,     // 水部 ⇄ 闽都
            "M113|M605": 6, "M605|M113": 6        // 三叉街 ⇄ 三叉街（滨海快线）
        },
        /**
         * 站内换乘方式与换乘用时（分钟）。键为换乘站 ID，机制见 shared/route/route-data.js
         * 的 transferAt：`pairs` 用于「同一站上不同线路对换乘方式不同」的情形（帝封江），
         * 其余站直接给 mode + minutes。未列出的换乘站用共享层默认值（2 分钟）。
         *
         * 换乘方式按步行尺度分档：同台 / 节点换乘 1 分钟量级，站厅换乘 2~3 分钟，
         * 通道换乘 4~5 分钟。取值来自城市实测的站台形式与通道长度。
         *
         * ⚠️ 本表只覆盖**站内换乘**；三叉街（滨海快线）⇄ 三叉街、水部 ⇄ 闽都这类
         * **出站换乘**不走这里，见上面的 walkMinutes。
         */
        transferAt: {
            "M104": { mode: "通道换乘", minutes: 5 },      // 福州火车站 1号线 ⇄ 滨海快线
            "M108": { mode: "十字节点换乘", minutes: 1 },  // 东街口 1号线 ⇄ 4号线
            "M109": { mode: "通道换乘", minutes: 4 },      // 南门兜 1号线 ⇄ 2号线
            "M118": { mode: "站厅换乘", minutes: 3 },      // 城门 1号线 ⇄ 4号线
            "M121": { mode: "通道换乘", minutes: 5 },      // 福州火车南站 1号线 ⇄ 5号线
            /**
             * 梁厝：1 号线与 6 号线同台换乘 —— 同台的是「1 号线往三江口方向 ⇄
             * 6 号线往万寿方向」这一对，1 分钟；反方向要绕到对面站台，2 分钟。
             *
             * 方向按各线 stationIds 的顺序编码：dir "+" 表示沿站序递增、"−" 递减。
             *   · 1 号线：梁厝(M123) 在索引 22，往三江口(M125, 索引 24) 即 "+"
             *   · 6 号线：梁厝(M123) 在索引 12，往万寿(M516, 索引 0)  即 "−"
             * 故同台对写作 "M1+M5-"（线对顺序无关，两种写法都认）。
             *
             * 这里用 sameDir **显式指定**而不是靠几何判定 —— 站台实际布置以现场为准。
             */
            "M123": {
                mode: "同台换乘", minutes: 2,
                sameDir: { "M1+M5-": 1, "M1-M5+": 1 }
            },
            "M124": { mode: "站厅换乘", minutes: 2 },      // 下洋 1号线 ⇄ 6号线
            "M210": { mode: "T型节点换乘", minutes: 1 },   // 金山 2号线 ⇄ 5号线
            "M219": { mode: "T型节点换乘", minutes: 1 },   // 前屿 2号线 ⇄ 4号线
            "M403": { mode: "L型节点换乘", minutes: 2 },   // 洪塘 4号线 ⇄ 5号线
            "M410": { mode: "通道换乘", minutes: 4 },      // 东门 4号线 ⇄ 滨海快线
            "M420": { mode: "T型节点换乘", minutes: 1 },   // 林浦 4号线 ⇄ 6号线
            /**
             * 帝封江：4 号线与 5 号线同台换乘，换滨海快线则要走通道（4 分钟）。
             *
             * 同台的是「4 号线往帝封江方向（终点，下客站台）⇄ 5 号线往荆溪厚屿方向」，
             * 1 分钟；另一对方向要绕到对面站台，故默认给 2 分钟。
             * 方向按各线 stationIds 顺序编码：
             *   · 4 号线：帝封江(M423) 在索引 22（本站即其终点），往帝封江即 "−"
             *     （沿站序递减驶向终点，到站下客）
             *   · 5 号线：帝封江(M423) 在索引 15，往荆溪厚屿(M401_2, 索引 0) 即 "−"
             * 故同台对写作 "M3-M4-"。
             *
             * ⚠️ 这一对与站序几何算出来的「同向」并不一致（几何给 M3−/M4+），
             * 以现场站台布置为准，故用 sameDir **显式指定**。
             * pairs 用于覆盖「与滨海快线换乘」——那是通道换乘，4 分钟。
             */
            "M423": {
                mode: "同台换乘", minutes: 2,
                sameDir: { "M3-M4-": 1, "M4-M3-": 1 },
                pairs: {
                    "M3|M6": { mode: "通道换乘", minutes: 4 },
                    "M4|M6": { mode: "通道换乘", minutes: 4 }
                }
            }
        }
    };

    /**
     * 加载共享层与城市专属模块（必须在核心引擎执行前同步写入）。
     *
     * 顺序约束（见 city/shenyang/shared/README.md 第二节）：
     *   - route-data → route-planner → route-panel 不可颠倒；
     *   - sidebar-refit / map-tools 须晚于 route-panel（前者样式同权重以本层为准，
     *     后者入口要挂进结果面板的页签栏）。
     */
    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261010.1327";
        const shared = "./city/shenyang/shared";
        const write = (src) => document.write(`<script src="${src}?v=${version}"><\/script>`);

        // 官方站间票价表（行程规划与票价图唯一价格来源；须早于 route-data / route-panel 建图）
        write("./city/fuzhou/data_official_fare.js");
        // 文旅景点名录（含建库时算好的最近车站与直线距离），供车站信息板的文旅卡片使用
        write("./city/fuzhou/data_attractions.js");
        // 环线方向文案（内环 / 外环）：须早于行程规划与时刻表渲染
        write(`${shared}/route/loop-direction.js`);
        // 浮层遮挡：声明浮层占用的边缘尺寸，由引擎据此收窄平移边界与居中区
        write(`${shared}/base/viewport-inset.js`);
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒）
        write(`${shared}/route/route-data.js`);
        write(`${shared}/route/route-planner.js`);
        write(`${shared}/route/route-panel-icons.js`);
        write(`${shared}/route/route-panel-search.js`);
        write(`${shared}/route/route-panel.js`);
        // 跨城市「查找最近车站」：接管核心的 findNearestStation 及其「距离较远」confirm
        write(`${shared}/station/nearest-station.js`);
        // 固定侧栏「浮岛卡片」改造（须晚于 route-panel.js，样式表以本层为准）
        write(`${shared}/base/sidebar-refit.js`);
        // 地图小工具（票价图 / 等时圈 / 多人汇合）：入口在车站详情与路线结果的页签栏
        write(`${shared}/tools/map-tools-color.js`);
        write(`${shared}/tools/map-tools.js`);

        // 城市专属数据与模块（城市数据文件由 main.html 统一加载，此处只补模块所需的数据）
        write("./city/fuzhou/data_site_space.js");
        (FuzhouCity.stationBoard?.scripts || []).forEach((scriptPath) => {
            write(`./city/fuzhou/${scriptPath}`);
        });
    }

    window.FUZHOU_CITY = FuzhouCity;
    window.CURRENT_CITY = FuzhouCity;
    loadStationBoardModules();
    window.CityDataManager?.registerCity?.({
        id: FuzhouCity.id,
        name: FuzhouCity.name,
        folder: "./city/fuzhou",
        mainLogic: "./city/fuzhou/fuzhou.js",
        center: FuzhouCity.center,
        defaultScale: FuzhouCity.defaultScale,
        mapSize: FuzhouCity.mapSize,
        searchCity: FuzhouCity.searchCity,
        title: "CGo OpenMap - 福州轨道交通线路图",
        keywords: "CGo OpenMap, 福州, 轨道交通, 线路图",
        description: "尝试性的功能，使用线路编辑器直接制作的福州轨道交通线路图。",
        registerDate: "2026-09-16",
        status: "active",
        maintainers: [],
        isDefault: false,
        ...FuzhouCity
    });
})();
