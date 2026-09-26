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
        MERGE_STATIONS: ["0320", "0308"],
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
                "modules/dalian_station_title.js"
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
                "operators": { enabled: true, targetTab: "station-info", order: 20 },
                "footer-actions": { enabled: true, order: 10 }
            }
        }
    };

    /**
     * 行程规划的城市侧配置
     *
     * 共享层负责算法、面板、坐标索引与站外换乘收集，本城只描述「数据长什么样」：
     * - coords：坐标兜底数据源（官方只公布票价、不公布里程，地铁站距已按票价档位反解写入 distances）
     * - reader：把官方首末班摊平成构建器要的时间条目（dest / period / label / time）
     * - fareSystems / fare：计费系统划分与票价规则（地铁与有轨不并网，有轨各线单独购票）
     * 上述配置都在实际规划时才被读取，故不必担心此刻共享层尚未加载。
     */
    window.CGO_ROUTE_CONFIG = {
        coords: DalianCity.dataFiles.amapDataUrl,
        cityIcon: "dalian",
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
        const version = "260926.1610";
        // 共享层（临时位于 city/shenyang/shared/，须早于各城模块加载）
        document.write(`<script src="./city/shenyang/shared/timetable-renderer.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/station-title.js?v=${version}"><\/script>`);
        // 未开通区段与车站的开通时刻（共享层读取并应用）
        document.write(`<script src="./city/shenyang/shared/opening-schedule.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/dalian/data_opening.js?v=${version}"><\/script>`);
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒）
        document.write(`<script src="./city/shenyang/shared/route-data.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-planner.js?v=${version}"><\/script>`);
        document.write(`<script src="./city/shenyang/shared/route-panel.js?v=${version}"><\/script>`);
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
