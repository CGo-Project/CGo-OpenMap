/**
 * CGo OpenMap - 城市配置与能力接口 (city/fuzhou/fuzhou.js)
 *
 * 城市运行时元数据 + 共享层薄配置（window.CGO_ROUTE_CONFIG 的 reader / fare）。
 * 票价只查官网抓取的站间票价表，不做站距推算；契约自检见 tools/fuzhou_check.js。
 */

(function () {
    const FuzhouCity = {
        id: "fuzhou",
        name: "福州",
        themeColor: "#079445",
        searchCity: "福州",
        /* 首屏视点：上藤 / 达道 / 南公园 三站站心的几何中心（台江—鼓楼老城核心） */
        center: { x: 745, y: 560 },
        defaultScale: 1.0,
        /* 画布（world 坐标）：须覆盖全部内容，内容外接盒到 x≈1931 / y≈1239，故取 1972×1530 */
        mapSize: { width: 1972, height: 1530 },
        /* 官网线路查询入口；与 city/data.js 注册项一致（{city}.js 末尾会以本对象覆盖注册表） */
        officialMapUrl: "https://www.fzmtr.com/xlcx",
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2", "M4", "M5", "M6", "BE"],
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
                "modules/fuzhou_cultural.js",
                "modules/fuzhou_airport.js",
                "modules/fuzhou_railway.js"
            ],
            modules: {
                "stacard": { enabled: true, order: 10, targetTab: "line-tab" },
                "fuzhou-line-timetable": { enabled: true, order: 22, targetTab: "line-tab" },
                // 文旅卡片：本站名胜指引 + 附近景点（点景点前往服务它的车站）
                "fuzhou-cultural-tip": { enabled: true, order: 14, targetTab: "station-info" },
                // 车站空间示意图与出入口是车站级资料（换乘站各线为同一张图），放在「车站信息」栏目
                "fuzhou-station-space": { enabled: true, order: 15, targetTab: "station-info" },
                // 机场联络：只挂机场站（BE02），说明两座航站楼的步行距离与航司分工
                "fuzhou-airport-tip": { enabled: true, order: 16, targetTab: "station-info" },
                // 国铁联络：只挂与国铁直接接驳的三站（M104 福州站 / M121 福州南站 / BE06 长乐站）
                "fuzhou-railway-tip": { enabled: true, order: 17, targetTab: "station-info" }
            }
        }
    };

    /* 行程规划的城市侧配置（window.CGO_ROUTE_CONFIG）：共享层管算法与面板，
       本城只描述数据 —— coords 坐标兜底、lineCodes 徽标编号、reader 时刻摊平、fare 查票价表 */

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
        lineCodes: { BE: { prefix: "F", code: "1" } },
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
                const entries = line.id === "BE"
                    ? binhaiEntries(times)
                    : [["first", "首", times.first], ["last", "末", times.last]];
                return slot(dest, entries);
            });
        },
        /**
         * 票价：只查官网抓取的官方站间票价表（10302 组），不按站距反算 ——
         * 计价站距与土建站距不同源，套费率会在档位分界附近错档。
         * 查不到（未开通站 / 同站进出）返回 null，内核按「票价未知」处理。
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
        /* 站外换乘步行时间（分钟），逐对覆盖共享层默认 6 分：水部⇄闽都 10 分、三叉街⇄三叉街 6 分 */
        walkMinutes: {
            "M216|BE11": 10, "BE11|M216": 10,     // 水部 ⇄ 闽都
            "M113|BE09": 6, "BE09|M113": 6        // 三叉街 ⇄ 三叉街（滨海快线）
        },
        /* 站内换乘方式与用时（分钟），键为换乘站 ID；出站换乘走上面的 walkMinutes。
           未列出的换乘站用共享层默认 2 分；pairs 用于同一站不同线路对方式不同的情形。 */
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
             *   · 6 号线：梁厝(M123) 在索引 12，往万寿(M601, 索引 0)  即 "−"
             * 故同台对写作 "M1+M6-"（线对顺序无关，两种写法都认）。
             *
             * 这里用 sameDir **显式指定**而不是靠几何判定 —— 站台实际布置以现场为准。
             */
            "M123": {
                mode: "同台换乘", minutes: 2,
                sameDir: { "M1+M6-": 1, "M1-M6+": 1 }
            },
            "M124": { mode: "站厅换乘", minutes: 2 },      // 下洋 1号线 ⇄ 6号线
            "M210": { mode: "T型节点换乘", minutes: 1 },   // 金山 2号线 ⇄ 5号线
            "M219": { mode: "T型节点换乘", minutes: 1 },   // 前屿 2号线 ⇄ 4号线
            "M403": { mode: "L型节点换乘", minutes: 2 },   // 洪塘 4号线 ⇄ 5号线
            "M410": { mode: "通道换乘", minutes: 4 },      // 东门 4号线 ⇄ 滨海快线
            "M420": { mode: "T型节点换乘", minutes: 1 },   // 林浦 4号线 ⇄ 6号线
            /**
             * 帝封江（主理人核定）：4/5 号线同台与否取决于方向 ——
             * 4 号线到站 → 5 号线往荆溪厚屿、5 号线往火车南站 → 4 号线往半洲为同台 1 分，
             * 4 号线到站 → 5 号线往火车南站走站厅 2 分，换滨海快线一律通道 5 分。
             * 方向按站序编码（+ 递增 / − 递减），故同台写作 "M4-M5+" / "M5+M4-"；
             * sameDir 值写成 { mode, minutes }，未命中的方向取该 pairs 自身值。
             * 键按字典序归一化，换滨海快线的键写作 "BE|M4" / "BE|M5"。
             */
            "M423": {
                pairs: {
                    /* 4 ⇄ 5 号线：同台的那一对方向 1 分钟，其余方向走站厅 2 分钟 */
                    "M4|M5": {
                        mode: "站厅换乘", minutes: 2,
                        sameDir: {
                            "M4+M5-": { mode: "同台换乘", minutes: 1 },
                            "M5+M4-": { mode: "同台换乘", minutes: 1 }
                        }
                    },
                    /* 换滨海快线：一律通道，5 分钟 */
                    "BE|M4": { mode: "通道换乘", minutes: 5 },
                    "BE|M5": { mode: "通道换乘", minutes: 5 }
                }
            }
        }
    };

    /* 加载共享层与城市专属模块（须在核心引擎执行前同步写入）：
       route-data → route-planner → route-panel 顺序不可颠倒，sidebar-refit / map-tools 须晚于 route-panel */
    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261031.105324";
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
        // 车站信息板横滑切页的补充通道：补上「在交互元素（整宽链接 / 按钮）上左右滑」这一缺口
        write(`${shared}/base/panel-tab-swipe-relay.js`);
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒）
        write(`${shared}/route/route-data.js`);
        write(`${shared}/route/route-planner.js`);
        write(`${shared}/route/route-panel-icons.js`);
        write(`${shared}/route/route-panel-search.js`);
        write(`${shared}/route/route-panel.js`);
        // 公共栅格化零件（分享卡海报与沿革视频导出共用，须早于 poster.js 与 opening-history.export.js）
        write(`${shared}/base/svg-raster.js`);
        // 分享卡（车站卡 / 行程卡）：接管两个面板的分享按钮；出图基建 poster.js 须先于其加载
        write(`${shared}/base/poster.js`);
        write(`${shared}/base/share-card.js`);
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
