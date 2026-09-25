/**
 * CGo OpenMap - 大连侧栏站名标题归一化 (city/dalian/modules/dalian_station_title.js)
 *
 * 机制（MutationObserver 安装、rAF 节流、防重复安装、防自触发写入）与站类判定、
 * 标题拼装的通用规则均在共享层 `city/shenyang/shared/station-title.js`，
 * 本文件只写大连的文案规则。
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

    const shared = window.CGoStationTitle;
    if (!shared) {
        console.warn("[dalian_station_title] 共享层 CGoStationTitle 未加载，侧栏站名标题归一化未生效");
        return;
    }

    shared.createStationTitleNormalizer({
        cityGlobals: ["DALIAN_CITY", "CURRENT_CITY"],
        metroRailForm: "prefix",
        keepDoubleZhanKinds: [],
        /**
         * 强制标注「（有轨站）」的有轨站名。
         * 用于「字面不同名、语义却高度混淆」的情况 —— 同名判定抓不到，需人工列出：
         * 201 路的「大连火车站」与国铁/地铁的「大连站」实为同一处铁路车站，必须区分。
         */
        tramForceSuffixNames: ["大连火车站"],
        observerFlag: "dalianTitleObserver",
        globalName: "DalianStationTitle"
    });
})();
