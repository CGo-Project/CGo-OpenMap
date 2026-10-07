/**
 * CGo OpenMap - 大连城市配置与能力接口
 *
 * 城市定制渲染位于 modules/，本文件只保留数据关系、运行时参数与能力桥接。
 */
(function () {
    /**
     * 站点图元 (大连变体)
     *
     * 引擎通用模板为三层同心圆：地图底色 r=5 / 线路色 r=4.21 / 地图底色 r=3.5，
     * 最外圈地图底色会把站点与线路隔开一段白边。
     * 大连：去掉最外的地图底色描边，并把描边色由线路色改为地图文字色，
     * 使全图站点统一为文字色圆环（与换乘站同色系），线路色只保留在线路上。
     * 环宽沿用原值（普通站 0.71、换乘站 0.9），仅改变颜色与去边。
     */
    const DL_DOT_ICON = `<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">`
        + `<circle cx="5" cy="5" r="4.21" fill="var(--text-color)"/>`
        + `<circle cx="5" cy="5" r="3.5" fill="var(--map-bg)"/>`
        + `</svg>`;

    const DL_TSF_ICON = `<svg viewBox="0 0 17.5 17.5" xmlns="http://www.w3.org/2000/svg">`
        + `<circle cx="8.75" cy="8.75" r="8" fill="var(--text-color)"/>`
        + `<circle cx="8.75" cy="8.75" r="7.1" fill="var(--map-bg)"/>`
        + `<path d="M6.21,8.01c.12-2.35,2.26-4.22,4.88-4.22.23,0,.46.01.68.04-.55-.18-1.15-.27-1.77-.27-2.8,0-5.09,1.96-5.3,4.45h-1.4l2.34,2.47c.78-.82,1.56-1.65,2.34-2.47h-1.78.01Z" fill="var(--text-color)"/>`
        + `<path d="M11.85,7.02c-.78.82-1.56,1.65-2.34,2.47h1.78c-.12,2.35-2.26,4.22-4.88,4.22-.23,0-.46-.01-.68-.04.55.18,1.15.27,1.77.27,2.8,0,5.09-1.96,5.3-4.45h1.4l-2.34-2.47h0Z" fill="var(--text-color)"/>`
        + `</svg>`;

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
        SUBURBAN_LINES: ["Rwy"],
        /** 有轨电车线路 ID；用于区分地铁站 / 有轨站（侧栏标题、导航链接等） */
        TRAM_LINES: ["DL201", "DL201-1", "DL202"],
        isTramLine(lineId) {
            if (this.TRAM_LINES.includes(lineId)) return true;
            const line = (typeof linesData !== "undefined" && Array.isArray(linesData))
                ? linesData.find((item) => item?.id === lineId)
                : null;
            return /有轨/.test(String(line?.name || ""));
        },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((lineId) => this.isTramLine(lineId)));
        },
        /**
         * 线路接续声明（机制全部在 city/shenyang/shared/line-link.js，这里只描述数据关系）
         *
         * 贯通运行：3 号线支线与 13 号线在九里（0320）接续、跑同一趟车。
         *   - 贯通区段各站在车站详情里统一显示为一个贯通线名，相邻站也跨线相连；
         *   - 规划内核把经由九里的「支线 ⇄ 13 号线」切换视作同一列车，不计换乘、无换乘耗时；
         *   - 衔接站按 ownerLineId 归属 3 号线支线（九里归支线，与线路图上的画法一致）。
         *
         * 开发区（0308）不在此列：那里 3 号线主线与支线是各自独立的乘车选择
         * （大连没有「支线车直通大连站 / 金石滩」的交路），故两条线各自成页签，不做合并。
         */
        lineLinks: [
            {
                id: "DLM99-DLM13",
                lineIds: ["DLM99", "DLM13"],
                at: "0320",
                ownerLineId: "DLM99",
                name: "3号线支线-13号线",
                keepBadges: true,
                through: true
            }
        ],
        /** 接续站即详情里的合并站，下面由 lineLinks 派生，避免两处各写一份 */
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        dataFiles: {
            amapDataUrl: "./city/dalian/amap_data.json"
        },
        /**
         * 城市级站点图元接管（core/ 保持城市无关，大连专属画法只放本目录）：
         * dot / tsfo / tsf 统一改为地图文字色圆环，并去掉引擎模板最外的地图底色描边。
         * 尺寸与 z 序沿用 css/style.css 的 .dot / .tsfo / .tsf，不在此覆盖。
         * 其余站型（no / rdot 等）返回 null，回落引擎通用模板。
         */
        renderStationIcon(station) {
            if (!station) return null;
            if (station.type === "dot" || station.type === "tsfo") {
                return { html: DL_DOT_ICON, className: "dl-station-ring" };
            }
            if (station.type === "tsf") {
                return { html: DL_TSF_ICON, className: "dl-station-ring" };
            }
            return null;
        },
        /**
         * 车站详情里的线路合并：按 lineLinks 声明交给共享层统一处理
         * （机制见 city/shenyang/shared/line-link.js，原先这里的按站硬编码已收敛为声明）。
         */
        handleLineMerge(station, relatedLinesInfo) {
            window.CGoLineLink?.mergeStationLines(station, relatedLinesInfo);
        },
        stacard: {
            script: "./city/dalian/stacard/script.js",
            geoDataUrl: "./city/dalian/amap_data.json",
            getRenderer: () => window.CGoStaCard || null
        },
        /**
         * 高德导航搜索词（与高德 POI 命名一致，三城统一口径，已实测）：
         *   有轨电车站 → 「站名(有轨电车站)」
         *   火车站 / 市郊铁路 → 「站名」（裸名，高德该 POI 原名即如此）
         *   地铁站 → 「站名(地铁站)」
         * 站型判断走本城市 isTramStation；station 由 core 作为第三参传入。
         */
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const query = this.isTramStation(context?.station)
                ? `${stationName}(有轨电车站)`
                : isRailway ? stationName : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("大连")}`;
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
                "modules/dalian_transfers.js",
                "modules/dalian_station_title.js",
                "modules/dalian_facilities.js",
                "modules/dalian_exits.js"
            ],
            // 自定义页签：渲染在「车站信息」之前，紧挨着它
            tabs: [
                { id: "dalian-exits", title: "出入口", icon: "gate" }
            ],
            modules: {
                "header-controls": { enabled: true, order: 10 },
                "header-title": { enabled: true, order: 20 },
                "header-badges": { enabled: true, order: 30 },
                "stacard": { enabled: true, targetTab: "line-tab", order: 10 },
                "dalian-timetable": { enabled: true, targetTab: "line-tab", order: 15 },
                "adjacent-stations": { enabled: true, targetTab: "line-tab", order: 20 },
                "transfers": { enabled: true, targetTab: "line-tab", order: 30 },
                "station-type": { enabled: true, targetTab: "station-info", order: 10 },
                // 官网设施位置（卫生间 / 充值机 / 无障碍电梯）：配置驱动，与沈阳同用共享层
                "dalian-facilities": { enabled: true, targetTab: "station-info", order: 6 },
                // 出入口页签（自定义 tab，见上方 tabs）
                "dalian-exits": { enabled: true, targetTab: "dalian-exits", order: 10 },
                "operators": { enabled: true, targetTab: "station-info", order: 20 },
                "footer-actions": { enabled: true, order: 10 }
            }
        }
    };

    /**
     * 「位置在出入口的扶梯 / 电梯」搬迁规则（共享层 exit-vertical.js 读取）
     *
     * 大连官网的电梯位置里，「站外:A1口」「站外电梯：A口旁1台，站厅与站台中间位置1台」这类
     * 以「站外」开头的条目已从车站设施板块搬到出入口页签的对应出口下；
     * 「站内:付费区-站厅与站台中间位置」「站内:非付费区-靠近A口进站闸机位置」
     * 这类站内条目留在设施板块（后者虽然提到出口编号，但指的是闸机、不是出口本身）。
     * 混合描述（同一条里既有站外又有站内）整条搬走并保留原文，信息不丢。
     * types 的展示名与图标须与 modules/dalian_facilities.js 的 types 保持一致。
     */
    window.CGO_EXIT_VERTICAL = {
        types: {
            elevator: { name: "无障碍电梯", icon: "elevator" }
        },
        patterns: [/^站外/]
    };

    /**
     * 出入口清单的筛选模式（共享层 exits.js 读取）
     * 官网大连只提供无障碍电梯，没有扶梯数据，故只有「无障碍」一种模式。
     */
    window.CGO_EXIT_FILTERS = [
        { id: "accessible", name: "无障碍", icon: "vi-stn", types: ["elevator"] }
    ];

    /**
     * 行程规划的城市侧配置
     *
     * 共享层负责算法、面板、坐标索引与站外换乘收集，本城只描述「数据长什么样」：
     * - coords：坐标兜底数据源 —— 里程以 data_lines.js 的 distances 为准（官方接口只公布
     *   票价、不公布里程：地铁 3/5/12/13 号线按票价档位反解；地铁 1/2 号线与有轨 201/202 路
     *   改按 OSM 走向实测，仅 201 路区间段取高德公交路径规划值）
     * - reader：把官方首末班摊平成构建器要的时间条目（dest / period / label / time）
     * - fareSystems / fare：计费系统划分与票价规则（地铁与有轨不并网，有轨各线单独购票）
     * 上述配置都在实际规划时才被读取，故不必担心此刻共享层尚未加载。
     */
    window.CGO_ROUTE_CONFIG = {
        coords: DalianCity.dataFiles.amapDataUrl,
        cityIcon: "dalian",
        /**
         * 线路编号徽标的城市覆盖：3 号线支线写作「3支」。
         * 从线路名抽数字只能得到「3」，与 3 号线本体撞号；后缀「支」是小号修饰字（suffix）。
         */
        lineCodes: { DLM99: { code: "3", suffix: "支" } },
        /**
         * 计费系统：地铁线网（DLM*）按制式默认并网，有轨各自独立购票
         * —— 201 路与其区间段同一票制（华乐广场凭换乘票接驳），202 路单算。
         */
        fareSystems: {
            "DL201": "tram-201",
            "DL201-1": "tram-201",
            "DL202": "tram-202"
        },
        /**
         * 票价规则（按计费系统，单位：元）
         * - metro：大连市发改委《关于大连地铁线网票制票价的通知》（大发改价格字〔2021〕714 号）
         *   ——按里程分段计价，6 公里以内（含）2 元；
         *   3~8 元的分界里程依次为 6 / 12 / 18 / 26 / 34 / 44 / 54 公里，
         *   54 公里以上每 1 元可乘 15 公里，不封顶
         * - tram-201：以大连火车站（20108）为分段点，段内 1 元、跨段 2 元（现金口径）
         * - tram-202：单一票价 1 元（现金口径，202 路区间同价）
         *
         * ⚠️ 计价口径的已知偏差：本表按**站距**（data_lines.js 的 distances）套费率，
         * 而票价实际按**计价里程**分档结算 —— 两者不是同一套数，**档位分界点附近的站对
         * 可能错一档**（同一段路在临界处差 1 元）。本城站距来源分两类：
         *   · 地铁 3/5/12/13 号线：官网接口只返回票价、不提供里程，故以官方运营里程为总长锚、
         *     以官方票价档位为约束**反解**站距（见 data_lines.js 头部），已在票价约束下完全满足；
         *   · 地铁 1/2 号线与有轨 201/202 路：改按 **OSM 线路走向实测**（非官方数据，精度约 ±2%）；
         *     201 路区间段（华乐广场→海之韵公园）OSM 无数据，改取高德公交路径规划的分段里程。
         * 福州已改用官网抓取的站间票价表（city/fuzhou/data_official_fare.js，10302 组）消除
         * 该误差，本城暂维持按费率推算。若要完全对齐，需拿到本城官网的分站票价表。
         */
        fare: {
            metro(km) {
                const cuts = [6, 12, 18, 26, 34, 44, 54];
                if (km <= cuts[0]) return 2;
                for (let i = 1; i < cuts.length; i += 1) {
                    if (km <= cuts[i]) return i + 2;
                }
                return 8 + Math.ceil((km - 54) / 15);
            },
            "tram-201"(km, context = {}) {
                const order = (typeof linesData !== "undefined" && Array.isArray(linesData)
                    ? linesData.find((line) => line.id === "DL201")?.stationIds
                    : null) || [];
                const split = order.indexOf("20108");   // 大连火车站
                // 分段点两侧都属「段内」，故只有该段同时出现分段点以西与以东的站才算跨段
                // （从大连火车站出发往任一侧坐，都是段内 1 元）
                const indexes = (context.stops || [])
                    .map((sid) => order.indexOf(sid))
                    .filter((index) => index >= 0);
                const crossed = split >= 0
                    && indexes.some((index) => index < split)
                    && indexes.some((index) => index > split);
                return crossed ? 2 : 1;
            },
            "tram-202"() {
                return 1;
            }
        },
        /**
         * 站外换乘的步行时间（分钟）。键为 `起点ID|终点ID`，逐对覆盖共享层的 6 分钟
         * 默认值（机制见 shared/route-data.js）。
         *
         * 口径为「出站 → 步行 → 进站 → 到站台」的总时间。2026-10-06 起本表统一并入
         * 高德地图步行路径规划：取「出站口 POI → 对方站点」的步行距离 ÷ 60 米/分钟
         * + 3 分钟（进出站安检与上下站台）。国铁站一律以出站口为起点，不用站房中心。
         *
         * 本城 `data_virtual_transfers.js` 登记了 22 组站外配对，其中 21 组已录入
         * （另 1 组为 201 路与 201 区间车的免费同站接驳），已全覆盖：
         *   · 大连北站（国铁）⇄ 大连北站（1 号线）：从 A1/B1 出站口步行 30 米即进入
         *     地铁站 C 入口，地铁站位于国铁出站层南侧（大连火车站 / 大连本地宝
         *     《大连站和大连北站区别》2022-04-24）→ 4 分钟。高德按站前广场绕行给
         *     539 米，明显大于乘客实际走行，故保留本口径；
         *   · 大连站（国铁南出站口）⇄ 友好广场（2 号线）：大连站南广场东侧步行约 300 米
         *     至 2 号线友好广场站 D 出口（同上资料）→ 8 分钟；第三方铁路专题
         *     UrbanRail.Net《Dalian 2018》亦载「自 3 号线大连站终点步行 8 分钟到
         *     友好广场地铁站」，与本表取值吻合；
         *   · 大连站（3/5 号线）⇄ 友好广场（2 号线）：与上一条起点不同 —— 地铁大连站
         *     在**北广场**，到南侧的友好广场须绕行站房，故按高德 1119 米取 22 分钟；
         *   · 兴工街（1 号线）⇄ 兴工街（有轨 201 / 202）、有轨 202 路 ↔ 地铁 1 号线
         *     各区段同名站、有轨 201 路大连火车站 ↔ 国铁大连站 / 地铁大连站 / 友好广场：
         *     均为高德步行距离换算，逐组见下方 walkMinutes；
         *   · 华乐广场（201 路）⇄ 华乐广场（201 路区间车）：大连公交官网载 201 路
         *     「在华乐广场站领取换乘票免费换乘」，即同站台接驳、无需出站步行
         *     （大连公交网 201 路线路页）→ 1 分钟。
         *
         * 两个方向写同一分钟数 —— 步行时间与方向无关。
         */
        walkMinutes: {
            // 站外换乘用时（分钟）：出站 → 步行 → 进站 → 到站台。
            // 口径 = 高德地图步行路径规划的距离 ÷ 60 米/分钟 + 3 分钟（进出站与上下站台），
            // 取数日 2026-10-06；国铁站以「出站口 POI」为起点（用站房中心会把站内走行也算进去）。
            // 只有大连北站、大连站南出站口 → 友好广场 两组沿用官方/媒体口径，理由见下。

            // 大连北站（1 号线）⇄ 大连北站（国铁）：大连本地宝载「从 A1 或 B1 出站口步行
            // 30 米即可进入地铁站 C 入口」→ 4 分钟。高德按站前广场绕行给 539 米 / 12 分钟
            // （国铁出站层与地铁站厅直连，站外绕行不代表实际走行），不采用。
            "0102|DFT": 4, "DFT|0102": 4,
            // 大连站（国铁 南出站口）⇄ 友好广场（2 号线）：本地宝载大连站南广场东侧
            // 步行约 300 米到 2 号线友好广场站 D 出口 → 300÷60+3 ≈ 8 分钟。
            "DLT|0207": 8, "0207|DLT": 8,
            // 大连站（3/5 号线）⇄ 友好广场（2 号线）：高德 1119 米 / 步行 15 分钟 → 22 分钟。
            // 地铁大连站在火车站**北广场**，到南侧的友好广场须绕行站房，实际就是 1 公里量级
            // ——不能套用上面「南出站口 300 米」的口径（那是国铁站的距离）。
            "0301|0207": 22, "0207|0301": 22,
            // 大连站（国铁 北出站口）⇄ 大连站（3/5 号线）：高德 375 米 → 9 分钟。
            "DLT|0301": 9, "0301|DLT": 9,
            // 有轨 201 路大连火车站 ⇄ 国铁大连站 / 地铁大连站 / 友好广场：
            // 高德 264 / 752 / 503 米 → 7 / 16 / 11 分钟。
            "20108|DLT": 7, "DLT|20108": 7,
            "20108|0301": 16, "0301|20108": 16,
            "20108|0207": 11, "0207|20108": 11,
            // 兴工街 201 ⇄ 202：两线在 amap_data.json 里共用同一坐标（同站台接驳），
            // 步行 0 米，仅计进出站 3 分钟。
            "20101|20201": 3, "20201|20101": 3,
            // 兴工街（1 号线）⇄ 兴工街（有轨 201 / 202）：高德 264 米 → 7 分钟。
            "0112|20101": 7, "20101|0112": 7,
            "0112|20201": 7, "20201|0112": 7,
            // 有轨 202 路 ↔ 地铁 1 号线各区段，高德步行距离 → 分钟：
            // 锦辉商城 ⇄ 西安路 439→10；解放广场 ⇄ 西安路 443→10；功成街 ⇄ 富国街 30→4；
            // 会展中心 322→8；星海广场 407→10；大医二院 173→6；黑石礁 384→9；
            // 学苑广场 25→3；海事大学 158→6；七贤岭 122→5；河口 139→5。
            "0113|20202": 10, "20202|0113": 10,
            "0113|20203": 10, "20203|0113": 10,
            "0114|20204": 4, "20204|0114": 4,
            "0115|20206": 8, "20206|0115": 8,
            "0116|20207": 10, "20207|0116": 10,
            "0117|20209": 6, "20209|0117": 6,
            "0118|20211": 9, "20211|0118": 9,
            "0119|20212": 3, "20212|0119": 3,
            "0120|20213": 6, "20213|0120": 6,
            "0121|20215": 5, "20215|0121": 5,
            "0801|20218": 5, "20218|0801": 5,
            // 华乐广场（201）⇄ 华乐广场（201 区间车）：同站台领换乘票接驳 → 1 分钟。
            "20117|20117-1": 1, "20117-1|20117": 1
        },
        /**
         * 站内换乘方式与换乘用时（分钟）。键为换乘站 ID，机制见 shared/route-data.js
         * 的 transferAt。未列出的换乘站用共享层默认值（2 分钟）。
         *
         * 换乘方式按步行尺度分档：同台 / 节点换乘 1 分钟量级，站厅换乘 2~3 分钟，
         * 通道换乘 4~5 分钟。全城 8 座换乘站（半岛晨报 2023-03-29《地铁5号线日均纳客
         * 4万余人次》），其中 7 座在本图线网内（九里站属 3 号线支线 × 13 号线，13 号线
         * 未收入本图，故不登记）。
         */
        transferAt: {
            // 大连北站 1号线 ⇄ 2号线：两线站台平行但互不连通，须先上站厅层再下到另一
            // 线站台，全程在付费区内（大连本地宝 2022-09-30 引自大连地铁 2 号线二期
            // 北段开通公告）→ 站厅换乘。
            "0102": { mode: "站厅换乘", minutes: 2 },
            // 西安路 1号线 ⇄ 2号线：地下三层双岛重叠平行换乘，地下二层为 1 号线站台、
            // 地下三层为 2 号线站台，两线站台上下重叠、换乘只需上下一层楼梯
            // （大连本地宝 2015-10-28《大连地铁1号线如何换乘地铁2号线》）。
            // 半岛晨报（2023-03-29）把 5 号线开通前的既有换乘方式概括为「同站台、站厅」
            // 两类，本站属其中「同站台」一类，故按同台换乘档取 1 分钟。
            "0113": { mode: "同台换乘", minutes: 1 },
            // 青泥洼桥 2号线 ⇄ 5号线：全城首处通道换乘，两站间由一条 157 米长的通道
            // 连接，通道用时约 2 分钟；官方口径「从 2 号线下车换乘到 5 号线上车全程
            // 大约需要 7 分钟」（含候车）——本表取 4 分钟（通道 2 分钟 + 上下站厅与站台，
            // 不含候车）。来源：大连发布 / 头条《40分钟！海下地铁速度！》2023-03-17、
            // 大连本地宝《大连地铁5号线和2号线换乘要出站吗》。
            "0208": { mode: "通道换乘", minutes: 4 },
            // 大连站 3号线 ⇄ 5号线：站内换乘无需出站，路径为上车厅层 → 换乘入口 →
            // 两段向上自动扶梯 → 地面层 → 换乘大厅 → 3 号线站厅层 → 站台层，
            // 官方口径「一般在 7 分钟内即可实现换乘」（大连本地宝 2023-03-17 引自大连地铁）
            // —— 本表取 5 分钟（扣除候车的走行部分）。
            "0301": { mode: "通道换乘", minutes: 5 },
            // 后盐 3号线 ⇄ 5号线：3 号线在高架、5 号线在地下，换乘通道需走楼梯加两段
            // 自动扶梯，平峰 5~8 分钟、高峰超过 10 分钟（TravelChinaGuide 大连地铁 3 号线
            // 站况说明）→ 取 6 分钟。
            "0305": { mode: "通道换乘", minutes: 6 },
            // 开发区 3号线 ⇄ 3号线支线：高架站，一岛两侧混合式站台（百科「开发区站」）。
            // 方向不对称：3 号线（往大连站方向）下车换 3 号线支线（往九里方向）为同台
            // 换乘、无需下站厅；反向（支线 → 3 号线）需下到站厅再换站台。
            // 依据为轨道交通爱好者现场实录（B 站《地铁换乘POV.01 开发区站 3 号线支线→
            // 3 号线》2023-05，画面与旁白均述及），属现场实测一类。
            // 方向编码：DLM03 的 "-" = 沿站序递减驶向大连站；DLM99 的 "-" = 驶向九里。
            "0308": {
                mode: "同台换乘", minutes: 2,
                sameDir: { "DLM03-DLM99-": 1, "DLM99-DLM03-": 1 }
            },
            // 河口 1号线 ⇄ 12号线：地下二层双岛式车站，1 号线站层与 12 号线站层合建，
            // 是大连地铁首座、也是目前唯一一座可同站台换乘的车站（百科引大连地铁官网
            // 2023-07 站况数据；大连地铁官方口径）。
            "0801": { mode: "同台换乘", minutes: 1 }
        },
        /**
         * 官方接口按「工作日/周末」给出每站每方向的 first / last，故契约里
         * 用 label 把两类日期拆成独立链（链内逐站取时刻差即区间用时，
         * 不同车次类型也分开成链，避免同站时刻互相覆盖）。
         * isEstimated 的推算记录不参与，以免污染实测区间用时。
         */
        reader(line, sid) {
            const info = window.DALIAN_TIMETABLE_DATA?.[String(sid)]?.[String(line.id)];
            const slot = window.CGoRouteData.hourSlots;
            const workdays = DALIAN_TIMETABLE_WORKDAY_CODES;
            const restdays = DALIAN_TIMETABLE_RESTDAY_CODES;
            const out = [];
            (info?.schedules || []).forEach((schedule) => {
                if (schedule.isEstimated) return;
                const days = (schedule.includeWeekdays || []).map(Number);
                const dayLabel = days.length && days.every((day) => restdays.includes(day)) ? "周末"
                    : days.length && days.every((day) => workdays.includes(day)) ? "工作日" : "每日";
                const trip = schedule.trainTypeName || "班次";
                (schedule.directions || []).forEach((dir) => {
                    out.push(...slot(dir.destinationStationId, [
                        ["first", `${dayLabel}${trip}首`, dir.first],
                        ["last", `${dayLabel}${trip}末`, dir.last]
                    ]));
                });
            });
            return out;
        }
    };

    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261008.120000";
        // 共享层（临时位于 city/shenyang/shared/，须早于各城模块加载）
        // 环线方向文案（内环 / 外环）：须早于行程规划与时刻表渲染
        document.write(`<script src="./city/shenyang/shared/loop-direction.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/timetable-renderer.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/station-title.js?v=${version}"><\/script>`);
        // 浮层遮挡：声明浮层占用的边缘尺寸，由引擎据此收窄平移边界与居中区
        document.write(`<script src="./city/shenyang/shared/viewport-inset.js?v=${version}"><\/script>`);
        // 未开通区段与车站的开通时刻（共享层读取并应用）
        document.write(`<script src="./city/shenyang/shared/opening-schedule.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/dalian/data_opening.js?v=${version}"><\/script>`);
        // 线路接续（贯通运行）声明解析：规划内核、车站详情、时刻表共用
        document.write(`<script src="./city/shenyang/shared/line-link.js?v=${version}"><\/script>`);
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
        // 城市私有数据（须早于依赖它的模块加载）
        document.write(`<script src="./city/dalian/data_facilities.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/dalian/data_exits.js?v=${version}"><\/script>`);
        // 车站设施 / 出入口（配置驱动，共享层位于沈阳目录下）
        // 出入口垂直交通：把「站外 X口」这类电梯从设施板块搬到出口页签（须早于下面两者）
        document.write(`<script src="./city/shenyang/shared/exit-vertical.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/facilities.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/exits.js?v=${version}"><\/script>`);
        (DalianCity.stationBoard?.scripts || []).forEach((scriptPath) => {
            document.write(`<script src="./city/dalian/${scriptPath}?v=${version}"><\/script>`);
        });
    }

    // 接续站即详情里的合并站：由 lineLinks 派生，免得与声明两处各写一份
    DalianCity.MERGE_STATIONS = DalianCity.lineLinks.map((link) => String(link.at));

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
