/**
 * CGo OpenMap - 大连侧栏站名标题归一化 (city/dalian/modules/dalian_station_title.js)
 *
 * ==============================================================================
 * 背景
 * ==============================================================================
 * 侧栏历史车站的标题由引擎按「站名 + 站」拼装，同名车站（地铁 / 有轨电车 / 国铁）
 * 无法区分，还会因站名本身以「站」结尾而拼出「XX站站」。
 * 引擎只按 SUBURBAN_LINES 粗略区分「火车站 / 地铁站」，不识别有轨电车。
 *
 * 本模块在**城市层**对标题做后处理，不修改 core/。
 *
 * ==============================================================================
 * 大连规则
 * ==============================================================================
 *   - 末尾「站」去重：站名以「站」结尾时不再叠加（大连站 → 大连站）
 *   - 与地铁站同名的有轨站 → 「XX站（有轨站）」
 *   - 国铁车站           → 「XX站（火车站）」
 *   - 与国铁站同名的地铁站 → 「地铁XX站」
 *   - 其余               → 「XX站」
 */
(function () {
    "use strict";

    /** 与火车站同名的地铁站标题形式：prefix = 「地铁XX站」 / suffix = 「XX站（轨道交通）」 / none = 不特殊处理 */
    const METRO_RAIL_FORM = "prefix";
    /** 站名以「站」结尾时是否保留双写（true = 保留「XX站站」） */
    const KEEP_DOUBLE_ZHAN = false;
    /**
     * 强制标注「（有轨站）」的有轨站名。
     * 用于「字面不同名、语义却高度混淆」的情况 —— 同名判定抓不到，需人工列出：
     * 201 路的「大连火车站」与国铁/地铁的「大连站」实为同一处铁路车站，必须区分。
     */
    const TRAM_FORCE_SUFFIX_NAMES = ["大连火车站"];

    const SECTION_SELECTOR = ".station-history-section";

    function allStations() {
        if (window.processedStations && typeof window.processedStations === "object") return window.processedStations;
        if (window.stationsData && typeof window.stationsData === "object") return window.stationsData;
        return {};
    }

    function isTramStation(station) {
        const city = window.DALIAN_CITY || window.CURRENT_CITY;
        if (typeof city?.isTramStation === "function") return Boolean(city.isTramStation(station));
        return false;
    }

    function isRailStation(station) {
        return station?.type === "rdot";
    }

    /** 站点类别：tram / rail / metro */
    function kindOf(station) {
        if (isTramStation(station)) return "tram";
        if (isRailStation(station)) return "rail";
        return "metro";
    }

    function sameNameOthers(station, stations) {
        return Object.keys(stations)
            .map((id) => stations[id])
            .filter((other) => other && other !== station && other.id !== station.id && other.cn === station.cn);
    }

    /** 按大连规则计算侧栏标题 */
    function buildTitle(station, stations) {
        const name = String(station?.cn || "");
        if (!name) return "";

        const kind = kindOf(station);

        // 末尾「站」去重：站名本身以「站」结尾时不再叠加，避免「XX站站」
        const doubleZhan = name.endsWith("站") && KEEP_DOUBLE_ZHAN && kind === "metro";
        const base = doubleZhan ? name + "站" : (name.endsWith("站") ? name : name + "站");

        const others = sameNameOthers(station, stations);
        const hasMetro = others.some((o) => kindOf(o) === "metro");
        const hasRail = others.some((o) => kindOf(o) === "rail");

        if (kind === "tram") {
            return (hasMetro || TRAM_FORCE_SUFFIX_NAMES.includes(name)) ? `${base}（有轨站）` : base;
        }
        if (kind === "rail") return `${base}（火车站）`;
        if (hasRail) {
            if (METRO_RAIL_FORM === "prefix") return `地铁${base}`;
            if (METRO_RAIL_FORM === "suffix") return `${base}（轨道交通）`;
        }
        return base;
    }

    /** 把侧栏历史车站的标题改写为归一化结果 */
    function normalizeTitles() {
        const stations = allStations();
        document.querySelectorAll(SECTION_SELECTOR).forEach((section) => {
            const sid = section.dataset?.sid;
            const station = sid ? stations[sid] : null;
            if (!station) return;
            const titleEl = section.querySelector(".section-title-text")
                || section.querySelector(".section-header > span:first-child");
            if (!titleEl) return;
            const next = buildTitle(station, stations);
            // 仅在确有差异时写入，避免 MutationObserver 自触发死循环
            if (next && titleEl.textContent !== next) titleEl.textContent = next;
        });
    }

    function install() {
        if (!document.body || document.body.dataset.dalianTitleObserver === "true") return;
        document.body.dataset.dalianTitleObserver = "true";

        let frameId = 0;
        const schedule = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                normalizeTitles();
            });
        };
        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
        schedule();
    }

    window.DalianStationTitle = { buildTitle, normalizeTitles };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
