/**
 * CGo OpenMap - 川西 城市模块 (city/chuanxi/chuanxi.js)
 */
(function () {
    "use strict";

    const City = {
        id: "chuanxi",
        name: "川西",
        searchCity: "都江堰",
        center: { x: 737, y: 376 },
        defaultScale: 0.9,
        mapSize: { width: 1640, height: 900 },
        maintainers: [{ name: "Zihuanana", role: "城市主理人", github: "https://github.com/Zihuanana" }],
        LINE_META: {},
        LINE_SORT_ORDER: ["CX-MTR-G", "CX-MTR-B", "CX-DUSI"],
        LINE_SYNC_GROUPS: [["CX-MTR-G", "CX-MTR-B"]],
        SUBURBAN_LINES: ["CX-DUSI"],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        TRAM_LINES: ["CX-MTR-G", "CX-MTR-B"],
        dataFiles: {},

        isTramLine(id) { return id === "CX-MTR-G" || id === "CX-MTR-B"; },

        /** 三条 M-TR 交路共用蓝绿双色徽标（悬停与图例一致） */
        getTooltipBadge(name) {
            if (name !== "M-TR专线") return null;
            return {
                svg: "./city/chuanxi/assets/cx-dual.svg",
                svgclr: "#027BBE",
                svgtext: "#ffffff"
            };
        },
        isTramStation() { return false; },
        formatOwnerName(raw) { return raw || "都江堰轨道交通"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },
        getNavigationUrl(stationName) {
            const q = `${stationName}(都江堰)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(q)}&city=${encodeURIComponent("都江堰")}`;
        }
    };

    window.CHUANXI_CITY = City;
    window.CURRENT_CITY = City;

    window.CityDataManager?.registerCity?.({
        id: City.id,
        name: City.name,
        folder: "./city/chuanxi",
        mainLogic: "./city/chuanxi/chuanxi.js",
        themeColor: "#A67C52",
        themeColorDark: "#C9A277",
        svglogo: "",
        defaultScale: City.defaultScale,
        mapSize: City.mapSize,
        searchCity: City.searchCity,
        title: "CGo OpenMap - 川西有轨电车与山地轨道线路图",
        keywords: "CGo OpenMap, 川西, 都江堰, M-TR, 有轨电车, 都四铁路",
        description: "都江堰 M-TR 有轨电车（蓝绿双线）与在建的都四山地轨道。",
        isDefault: false,
        ...City
    });

    /**
     * 川西车站面板收敛：
     * 1) 徽标：M-TR 三条共用一张蓝绿双色标，只保留一个；
     * 2) 标签页：分叉点（共线段末站，12 站）保留「绿」「蓝」两个，其余站只留一个。
     * 标签页与内容面板是按索引一一对应的，删导航项必须同步删内容面板，否则会串页。
     */
    (function tidyTramPanel() {
        const DUAL = "./city/chuanxi/assets/cx-dual.svg";
        const JUNCTION = "CX12";
        let lastSid = "";

        document.addEventListener("click", function (ev) {
            const node = ev.target && ev.target.closest ? ev.target.closest('[id^="node_"]') : null;
            if (node) lastSid = node.id.slice(5);
        }, true);

        function isTramTab(el) {
            return /^M-TR专线/.test((el.textContent || "").trim());
        }

        function tidyBadges(root) {
            const box = root.querySelector(".panel-badges");
            if (!box) return;
            const tram = Array.prototype.slice.call(box.querySelectorAll(".line-badge"))
                .filter(function (el) { return /cx-(green|blue|dual)\.svg/.test(el.getAttribute("data-src") || ""); });
            if (tram.length < 2) return;
            const keep = tram[0];
            const img = document.createElement("img");
            img.className = "line-badge";
            img.setAttribute("data-src", DUAL);
            img.src = DUAL;
            img.alt = "M-TR专线";
            img.style.cssText = "height:22px;width:auto;display:inline-block;vertical-align:middle;margin-left:2px;";
            keep.replaceWith(img);
            tram.slice(1).forEach(function (el) { el.remove(); });
        }

        function resolveActiveSid(root) {
            const wmWin = root && root.closest ? root.closest(".cgowm-window.openmap-station-window[data-station-id]") : null;
            if (wmWin && wmWin.dataset.stationId) return wmWin.dataset.stationId;
            const activeNode = document.querySelector('#map-content .station.active[id^="node_"]');
            if (activeNode) return activeNode.id.slice(5);
            return lastSid;
        }

        function tidyTabs(root) {
            const nav = root.querySelector(".panel-tabs-nav");
            const body = root.querySelector(".panel-tabs-body");
            if (!nav || !body) return;
            const items = Array.prototype.slice.call(nav.children);
            const panes = Array.prototype.slice.call(body.children);
            const tramIdx = items.map(function (el, i) { return isTramTab(el) ? i : -1; })
                                 .filter(function (i) { return i >= 0; });
            if (!tramIdx.length) return;
            const keepCount = (resolveActiveSid(root) === JUNCTION) ? 2 : 1;
            const drop = tramIdx.slice(keepCount);
            let removedActive = false;
            drop.sort(function (a, b) { return b - a; }).forEach(function (i) {
                if (items[i]?.classList.contains("active")) removedActive = true;
                if (items[i]) items[i].remove();
                if (panes[i]) panes[i].remove();
            });
            if (removedActive && nav.children.length > 0 && !nav.querySelector(".tab-item.active")) {
                nav.children[0].classList.add("active");
                if (body.children[0]) body.children[0].classList.add("active");
            }
        }

        function clean() {
            document.querySelectorAll("#info-panel").forEach(function (panel) {
                tidyBadges(panel);
                tidyTabs(panel);
            });
        }

        function start() {
            clean();
            let rafId = 0;
            const scheduleClean = function () {
                if (rafId) return;
                rafId = requestAnimationFrame(function () {
                    rafId = 0;
                    clean();
                });
            };
            const isRelevant = function (node) {
                if (!node || node.nodeType !== 1) return false;
                return Boolean(
                    node.id === "info-panel"
                    || node.matches?.(".panel-badges, .panel-tabs-nav, .line-badge, .tab-item")
                    || node.querySelector?.("#info-panel, .panel-badges, .panel-tabs-nav")
                );
            };
            new MutationObserver(function (mutations) {
                for (let i = 0; i < mutations.length; i += 1) {
                    const m = mutations[i];
                    if (m.target?.closest?.("#info-panel")) {
                        scheduleClean();
                        return;
                    }
                    for (let j = 0; j < m.addedNodes.length; j += 1) {
                        if (isRelevant(m.addedNodes[j])) {
                            scheduleClean();
                            return;
                        }
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", start);
        } else {
            setTimeout(start, 400);
        }
    })();
})();
