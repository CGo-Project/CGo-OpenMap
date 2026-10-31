/**
 * CGo OpenMap - 苏州 城市模块 (city/suzhou/suzhou.js)
 *
 * 线网数据依苏州地铁官方「运行线路图」(sz-mtr.com) 矢量底图整理，含 1~8 号线与 11 号线。
 * 站心与走向折点统一对齐 6px 网格（2026-10-31 全图 ×1.2 缩放后由 5px 栅格映射而来），便于人工增删站与核对走向。
 */

(function () {
    "use strict";

    /* 花桥站：上海地铁 11 号线跨省换乘卡片（参考深圳 ⇄ 香港的邻城衔接） */
    const Sh11TransferModule = {
        id: "sz-hq-sh11",
        name: "上海地铁11号线换乘",
        slot: "body-top",
        order: 12,
        shouldRender(ctx) { return Boolean(ctx.station && ctx.station.id === "M1127"); },
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
        /* 首屏视点：乐桥（1 / 4 号线换乘，古城核心） */
        center: { x: 1500, y: 1398 },
        defaultScale: 0.72,
        mapSize: { width: 3084, height: 3120 },
        officialMapUrl: "https://www.sz-mtr.com/service/guide/map/index_zh.html",
        LINE_META: {},
        LINE_SORT_ORDER: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M11", "SH11"],
        stationBoard: {
            modules: { "sz-hq-sh11": Sh11TransferModule }
        },
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
        dataFiles: { stanameCsvUrl: "./city/suzhou/staname.csv" },
        getNavigationUrl(stationName, isRailway = false) {
            const query = isRailway ? stationName : `${stationName}(地铁站)`;
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
    window.CityDataManager?.registerCity?.({
        id: City.id, name: City.name,
        folder: "./city/suzhou", mainLogic: "./city/suzhou/suzhou.js",
        center: City.center, defaultScale: City.defaultScale, mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 苏州轨道交通线路图",
        keywords: "CGo OpenMap, 苏州地铁, 苏州轨道交通, 线路图",
        description: "覆盖 1~8 号线与 11 号线，含 11 号线花桥接驳上海地铁 11 号线。",
        officialMapUrl: City.officialMapUrl,
        isDefault: false,
        ...City
    });
    injectStyle();
})();
