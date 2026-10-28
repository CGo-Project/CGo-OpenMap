/**
 * CGo OpenMap - 宜宾 城市模块 (city/yibin/yibin.js)
 */
(function () {
    "use strict";

    const City = {
        id: "yibin",
        name: "宜宾",
        searchCity: "宜宾",
        center: { x: 777, y: 300 },
        defaultScale: 1.0,
        mapSize: { width: 1936, height: 990 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["YB-T1", "YB-T1B", "YB-T1C", "YB-T2", "YB-T2B", "YB-T4", "YB-T4B"],

        /**
         * 线路同步/联动高亮组（贯通运营）
         * T1（牌坊路方向）与 T4（南溪经开区方向）在「智轨产业园」贯通，
         * 高亮其中一条时另一条同步高亮。
         */
        LINE_SYNC_GROUPS: [
            ["YB-T1", "YB-T4"]
        ],

        SUBURBAN_LINES: [],
        MERGE_STATIONS: ["YB56"],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["YB-T1", "YB-T1B", "YB-T1C", "YB-T2", "YB-T2B", "YB-T4", "YB-T4B"],
        dataFiles: { stanameCsvUrl: "./city/yibin/staname.csv" },

        isTramLine(lineId) { return this.TRAM_LINES.includes(lineId); },
        isTramStation(station) {
            return Boolean(station?.relatedLines?.some((id) => this.isTramLine(id)));
        },
        formatOwnerName(raw) { return raw || "宜宾智轨"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(智轨站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("宜宾")}`;
        }
    };

    window.YIBIN_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/yibin",
        mainLogic: "./city/yibin/yibin.js",
        themeColor: "#50B344",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 宜宾智轨线路图",
        keywords: "CGo OpenMap, 宜宾, 智轨, ART, 线路图",
        description: "宜宾智轨 T1 / T2 / T4 线网，含 7 条交路与贯通运营。",
        isDefault: false,
        ...City
    });

    /**
     * 交路线路标去重
     * 宜宾每条物理线路拆成了多个交路（T1 三条、T2 两条、T4 两条），它们共用同一套
     * 图标与标志色，于是车站面板会重复渲染出多个一模一样的线路标。
     * 这里按「图标 + 配色」去重，只保留第一个。
     */
    (function dedupeLineBadges() {
        function key(el) {
            const src = el.getAttribute("data-src") || "";
            const style = (el.getAttribute("style") || "").replace(/\s+/g, "");
            return src + "|" + style;
        }

        function clean() {
            document.querySelectorAll(".panel-badges").forEach(function (box) {
                const seen = new Set();
                Array.prototype.slice.call(box.querySelectorAll(".line-badge")).forEach(function (el) {
                    const k = key(el);
                    if (seen.has(k)) {
                        el.remove();
                    } else {
                        seen.add(k);
                    }
                });
            });
        }

        function start() {
            clean();
            new MutationObserver(clean).observe(document.body, { childList: true, subtree: true });
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", start);
        } else {
            setTimeout(start, 400);
        }
    })();
})();
