/**
 * CGo OpenMap - 苏州 城市模块 (city/suzhou/suzhou.js)
 *
 * 线网数据依苏州地铁官方「运行线路图」(sz-mtr.com) 矢量底图整理，含 1~8 号线与 11 号线。
 * 站心与走向折点对齐「整 5 整 10」网格（以 10 为主、几何必须处保留 5），便于人工增删站；收拢手法见 city/suzhou/README.md。
 */

(function () {
    "use strict";

    /* 花桥站：上海地铁 11 号线跨省换乘卡片（参考深圳 ⇄ 香港的邻城衔接） */
    const Sh11TransferModule = {
        id: "sz-hq-sh11",
        name: "上海地铁11号线换乘",
        slot: "body-top",
        order: 12,
        shouldRender(ctx) { return Boolean(ctx.station && ctx.station.id === "M1128"); },
        render() {
            return `<div class="sz-hq-sh11">
                <div class="sz-hq-sh11-head"><cgo-icon name="transfer" size="16"></cgo-icon><b>上海地铁 11 号线</b><span>跨省换乘 · Shanghai Metro Line 11</span></div>
                <div class="sz-hq-sh11-body"><i></i><span>花桥站与上海地铁 11 号线同站换乘，可前往嘉定、上海市区方向。</span></div>
                <button type="button" class="sz-hq-sh11-go" data-sh11-go><cgo-icon name="map" size="14"></cgo-icon><span>在上海线路图中查看花桥</span><cgo-icon name="arrow-right" size="12"></cgo-icon></button>
            </div>`;
        },
        onMounted(panel) {
            const btn = panel.querySelector("[data-sh11-go]");
            if (!btn) return;
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.CGoNeighbors?.go?.("shanghai", { at: { x: 85, y: 693, s: 1.1 }, sel: "SH_1114" })) return;
                location.href = "main.html?city=shanghai";
            });
        }
    };

    function injectStyle() {
        if (document.getElementById("sz-hq-style")) return;
        const st = document.createElement("style");
        st.id = "sz-hq-style";
        st.textContent = `
.sz-hq-sh11 { margin: 10px 14px 4px; padding: 12px 14px; border: 1px solid var(--divider, rgba(0,0,0,.1)); border-radius: 12px; background: var(--panel-bg, #fff); }
.sz-hq-sh11-head { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-main, #222); }
.sz-hq-sh11-head b { font-weight: 600; }
.sz-hq-sh11-head span { font-size: 11px; color: var(--text-light, #888); }
.sz-hq-sh11-body { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 12px; line-height: 1.5; color: var(--text-main, #222); }
.sz-hq-sh11-body i { flex: none; width: 18px; height: 6px; border-radius: 3px; background: #871c2b; }
.sz-hq-sh11-go { margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid var(--divider, rgba(0,0,0,.1)); border-radius: 999px; background: transparent; color: var(--text-main, #222); font: inherit; font-size: 12px; cursor: pointer; }
.sz-hq-sh11-go:hover { border-color: #871c2b; color: #871c2b; }
`;
        document.head.appendChild(st);
    }

    const City = {
        id: "suzhou",
        name: "苏州",
        themeColor: "#0c3674",
        searchCity: "苏州",
        /* 首屏视点：线网几何中心（古城区与工业园区之间） */
        center: { x: 1050, y: 1050 },
        defaultScale: 0.9,
        mapSize: { width: 2100, height: 2100 },
        officialMapUrl: "https://www.sz-mtr.com/service/guide/map/index_zh.html",
        LINE_META: {},
        LINE_SORT_ORDER: ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L11", "TSND1", "TSND2", "SH11"],
        stationBoard: {
            // 花桥跨省换乘卡片（本城内联定义）+ 官网资料模块（独立脚本注册，此处只配置开关与顺序）
            modules: {
                "sz-hq-sh11": Sh11TransferModule,
                "suzhou-station-info": { enabled: true, order: 15, targetTab: "station-info" }
            }
        },
        /* 贯通运行（同一列车直通，无需下车）：声明为 through 后行程规划不计换乘、车站详情合并显示。
           目前只有 3 号线 ⇄ 11 号线在唯亭。
           （高新有轨电车原本在这里还有一条「5 号线 ⇄ 2 号线在航船浜」的贯通声明；2026-11 核定
             原 5 号线只是土建编号、运行系统上归 2 号线后，两条交路已并作同一条线路，声明随之删除） */
        lineLinks: [{
            id: "L3-L11",
            lineIds: ["L3", "L11"],
            at: "M337",
            name: "3 / 11 号线（贯通）",
            through: true,
            keepBadges: true
        }],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        MAP_12306: {
            "苏州火车站": "苏州",
            "高铁苏州北站": "苏州北",
            "苏州园区火车站": "苏州园区",
            "苏州新区火车站": "苏州新区"
        },
        dataFiles: {
            stanameCsvUrl: "./city/suzhou/staname.csv",
            amapDataUrl: "./city/suzhou/amap_data.json"
        },
        /* 车站信息板「周边地图」卡片：高德瓦片 + 本站经纬度落针（坐标取自高德地铁图，GCJ-02） */
        stacard: {
            script: "./city/suzhou/stacard/script.js",
            geoDataUrl: "./city/suzhou/amap_data.json",
            basePath: "./city/suzhou/stacard/",
            getRenderer: () => window.SuzhouStaCard || window.StaCard || null
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
        /* 高新有轨电车站 ID 统一为 TSNZ{线路号}{两位序号}，导航检索词与地铁区分 */
        isTramStation(station) {
            const sid = typeof station === "string" ? station : station?.id;
            return typeof sid === "string" && /^TSNZ\d+$/.test(sid);
        },
        getNavigationUrl(stationName, isRailway = false, context = {}) {
            const query = isRailway ? stationName
                : `${stationName}(${this.isTramStation(context && context.station) ? "有轨电车站" : "地铁站"})`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("苏州")}`;
        },
        getRailway12306Url(stationName) {
            const cleanName = stationName.replace(/站$/, "");
            const mappedName = this.MAP_12306[stationName] || this.MAP_12306[cleanName] || cleanName;
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(mappedName)}`;
        },
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "苏州市轨道交通集团";
        },
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，");
        }
    };
    window.CURRENT_CITY = City;
    window.SUZHOU_CITY = City;

    /* 行程规划（共享层 route/*）：城市侧只描述坐标与时刻表读取方式 */
    window.CGO_ROUTE_CONFIG = {
        coords: "./city/suzhou/amap_data.json",
        cityIcon: "suzhou",
        reader(line, sid) {
            const data = window.SUZHOU_SCHEDULE_DATA;
            const lineData = data && data[line.id];
            const info = lineData && lineData.stations && lineData.stations[sid];
            if (!info) return [];
            const slot = window.CGoRouteData && window.CGoRouteData.hourSlots;
            if (typeof slot !== "function") return [];
            const toward = lineData.toward || {};
            return Object.entries(info.directions || {}).map(([label, times]) => {
                const dest = toward[label] || label;
                return slot(dest, [["first", "首", times.first], ["last", "末", times.last]]);
            }).flat();
        },
        /* 官方未公开站间票价表，票价一律按「未知」处理（不做站距推算） */
        fareSystems: {},
        fare: {}
    };

    /* 官网车站资料 + 行程规划共享层（须在核心引擎执行前同步写入） */
    function loadStationBoardModules() {
        if (typeof document === "undefined" || typeof document.write !== "function") return;
        const version = "261114.022704";
        const shared = "./city/shenyang/shared";
        const write = (src) => document.write(`<script src="${src}?v=${version}"><\/script>`);

        // 首末班车数据（行程规划 reader 依赖，须早于 route-data 建图）
        write("./city/suzhou/data_timetable.js");
        // 行程规划：数据构建器 → 内核 → 面板（顺序不可颠倒；面板自带 CSS 注入）
        write(`${shared}/station/line-link.js`);
        write(`${shared}/route/route-data.js`);
        write(`${shared}/route/route-planner.js`);
        write(`${shared}/route/route-panel-icons.js`);
        write(`${shared}/route/route-panel-search.js`);
        write(`${shared}/route/route-panel.js`);
        // 浮层遮挡：声明浮层占用的边缘尺寸，由引擎据此收窄平移边界与居中区
        write(`${shared}/base/viewport-inset.js`);
        // 车站信息板横滑切页补充通道
        write(`${shared}/base/panel-tab-swipe-relay.js`);

        // 城市专属：官网站厅示意图/设施/结构图 + 首末班车模块
        write("./city/suzhou/data_station_info.js");
        write("./city/suzhou/modules/suzhou_station_info.js");
        write("./city/suzhou/modules/suzhou_timetable.js");
    }

    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/suzhou", mainLogic: "./city/suzhou/suzhou.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 苏州轨道交通线路图",
        keywords: "CGo OpenMap, 苏州地铁, 苏州轨道交通, 高新有轨电车, 线路图",
        description: "覆盖 1~8 号线、11 号线与高新有轨电车 1 / 2 / 5 号线，含 4 / 7 号线在建延伸段与花桥接驳上海地铁 11 号线。",
        officialMapUrl: City.officialMapUrl,
        isDefault: false,
        ...City
    });
    loadStationBoardModules();
    injectStyle();
})();
