/**
 * CGo OpenMap - 长春侧栏站名标题归一化 (city/changchun/modules/changchun_station_title.js)
 *
 * 机制（MutationObserver 安装、rAF 节流、防重复安装、防自触发写入）与站类判定、
 * 标题拼装的通用规则均在共享层 `city/shenyang/shared/station-title.js`，
 * 本文件只写长春的文案规则。
 *
 * ==============================================================================
 * 长春规则
 * ==============================================================================
 *   - 末尾「站」去重：站名以「站」结尾时不再叠加（长春站 → 长春站）
 *   - 与地铁站同名的有轨站 → 「XX站（有轨站）」
 *   - 国铁车站           → 「XX站（火车站）」
 *   - 与国铁站同名的地铁站 → 「XX站（轨道交通）」
 *   - 其余               → 「XX站」
 *
 * 注：54 路、55 路有轨电车线路 ID 已补进 changchun.js 的 TRAM_LINES，
 *     有轨站标题（含同名站标注「（有轨站）」）即自动生效。
 */
(function () {
    "use strict";

    const shared = window.CGoStationTitle;
    if (!shared) {
        console.warn("[changchun_station_title] 共享层 CGoStationTitle 未加载，侧栏站名标题归一化未生效");
        return;
    }

    shared.createStationTitleNormalizer({
        cityGlobals: ["CHANGCHUN_CITY", "CURRENT_CITY"],
        metroRailForm: "suffix",
        keepDoubleZhanKinds: [],
        /**
         * 强制标注「（有轨站）」的有轨站名。
         * 用于「字面不同名、语义却高度混淆」的情况 —— 同名判定抓不到，需人工列出。
         * 长春目前为空，录入 54 / 55 路有轨电车后如有此类站名再补。
         */
        tramForceSuffixNames: [],
        observerFlag: "changchunTitleObserver",
        globalName: "ChangchunStationTitle"
    });
})();
