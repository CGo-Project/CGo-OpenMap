/**
 * CGo OpenMap - 侧栏站名标题归一化共享层
 *
 * ⚠️ 临时共享位置
 * 本文件与 stacard-engine.js、timetable-renderer.js 目前放在 city/shenyang/shared/ 下，
 * 供沈阳、大连、长春三城共用。计划在开发团队确认共享位置后迁入 core/，届时只需
 * git mv 并改 6 处引用路径（3 处 {city}.js 的 document.write + 3 处城市模块文件），
 * 零逻辑改动。迁移步骤见 docs/STACARD_TIMETABLE_UNIFICATION.md 第 4.4 节。
 *
 * 加载方式：classic script。由各城 {city}.js 在加载自身模块**之前** document.write
 * 引入，因此以全局形式暴露，不走 ES module（城市模块本身也是 classic script）。
 *
 * 职责边界
 * - 本文件负责：MutationObserver 安装、requestAnimationFrame 节流、body.dataset 防重复
 *   安装、「仅在确有差异时写入」的防自触发保护，以及站类判定与标题拼装的通用规则。
 * - 城市侧负责：文案规则配置（metroRailForm / keepDoubleZhanKinds /
 *   tramForceSuffixNames）与站点类别数据（由城市对象的 isTramStation 提供）。
 *
 * 背景：侧栏历史车站的标题由引擎按「站名 + 站」拼装，同名车站（地铁 / 有轨电车 /
 * 国铁）无法区分，站名本身以「站」结尾时还会拼出「XX站站」。引擎只按 SUBURBAN_LINES
 * 粗略区分「火车站 / 地铁站」，不识别有轨电车。故在**城市层**对标题做后处理，
 * 不修改 core/。
 */
(function () {
    "use strict";

    const SECTION_SELECTOR = ".station-history-section";

    /**
     * 创建某城市的侧栏站名标题归一化器
     *
     * @param {object} config
     * @param {string[]} config.cityGlobals - 取 isTramStation 的城市对象全局名，按序取首个可用者
     * @param {"prefix"|"suffix"|"none"} config.metroRailForm
     *        与国铁站同名的地铁站标题形式：prefix = 「地铁XX站」/ suffix = 「XX站（轨道交通）」/
     *        none = 不作区分（由城市自行用其它手段区分，如沈阳的末尾「站」双写）
     * @param {string[]} config.keepDoubleZhanKinds
     *        站名以「站」结尾时**保留双写**的站类（"metro" / "tram" / "rail"）；
     *        未列入的站类一律去重，避免「XX站站」
     * @param {string[]} config.tramForceSuffixNames
     *        强制标注「（有轨站）」的有轨站名。用于「字面不同名、语义却高度混淆」的情况
     *        —— 同名判定抓不到，需人工列出
     * @param {string} config.observerFlag - body.dataset 上的防重复安装标记名（驼峰）
     * @param {string} config.globalName - 暴露归一化能力的 window 属性名
     * @returns {{ buildTitle: Function, normalizeTitles: Function, install: Function }}
     */
    function createStationTitleNormalizer(config = {}) {
        const cityGlobals = Array.isArray(config.cityGlobals) && config.cityGlobals.length
            ? config.cityGlobals
            : ["CURRENT_CITY"];
        const metroRailForm = config.metroRailForm || "none";
        const keepDoubleZhanKinds = Array.isArray(config.keepDoubleZhanKinds)
            ? config.keepDoubleZhanKinds
            : [];
        const tramForceSuffixNames = Array.isArray(config.tramForceSuffixNames)
            ? config.tramForceSuffixNames
            : [];
        const observerFlag = config.observerFlag;
        const globalName = config.globalName;

        function allStations() {
            if (window.processedStations && typeof window.processedStations === "object") return window.processedStations;
            if (window.stationsData && typeof window.stationsData === "object") return window.stationsData;
            return {};
        }

        /** 有轨站判定统一走城市对象，城市侧只维护一份线路类型知识 */
        function isTramStation(station) {
            for (const globalKey of cityGlobals) {
                const city = window[globalKey];
                if (typeof city?.isTramStation === "function") return Boolean(city.isTramStation(station));
            }
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

        /** 计算侧栏标题 */
        function buildTitle(station, stations) {
            const name = String(station?.cn || "");
            if (!name) return "";

            const kind = kindOf(station);

            // 末尾「站」去重：站名本身以「站」结尾时不再叠加，避免「XX站站」；
            // keepDoubleZhanKinds 中的站类例外，保留双写
            const base = name.endsWith("站")
                ? (keepDoubleZhanKinds.includes(kind) ? name + "站" : name)
                : name + "站";

            const others = sameNameOthers(station, stations);
            const hasMetro = others.some((other) => kindOf(other) === "metro");
            const hasRail = others.some((other) => kindOf(other) === "rail");

            if (kind === "tram") {
                return (hasMetro || tramForceSuffixNames.includes(name)) ? `${base}（有轨站）` : base;
            }
            if (kind === "rail") return `${base}（火车站）`;
            if (hasRail) {
                if (metroRailForm === "prefix") return `地铁${base}`;
                if (metroRailForm === "suffix") return `${base}（轨道交通）`;
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
            if (!document.body) return;
            if (observerFlag && document.body.dataset[observerFlag] === "true") return;
            if (observerFlag) document.body.dataset[observerFlag] = "true";

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

        const normalizer = { buildTitle, normalizeTitles, install };
        if (globalName) window[globalName] = normalizer;

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", install, { once: true });
        } else {
            install();
        }

        return normalizer;
    }

    window.CGoStationTitle = { createStationTitleNormalizer };
})();
