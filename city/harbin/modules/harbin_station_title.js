/**
 * CGo OpenMap - 哈尔滨侧栏站名标题归一化 (city/harbin/modules/harbin_station_title.js)
 *
 * 机制（MutationObserver 安装、rAF 节流、防重复安装、防自触发写入）与站类判定、
 * 标题拼装的通用规则均在共享层 `city/shenyang/shared/station-title.js`，
 * 本文件只写哈尔滨的文案规则。
 *
 * ==============================================================================
 * 哈尔滨规则
 * ==============================================================================
 *   - 末尾「站」去重：站名以「站」结尾时不再叠加（哈尔滨站 → 哈尔滨站）
 *   - 国铁车站              → 「XX站（火车站）」
 *   - 与国铁站同名的地铁站  → 「地铁XX站」（哈尔滨站 / 西 / 北 / 东 四座与国铁同名）
 *   - 其余                  → 「XX站」
 *   - 本城无有轨电车，tramForceSuffixNames 留空
 */
(function () {
    "use strict";

    const shared = window.CGoStationTitle;
    if (!shared) {
        console.warn("[harbin_station_title] 共享层 CGoStationTitle 未加载，侧栏站名标题归一化未生效");
        return;
    }

    shared.createStationTitleNormalizer({
        cityGlobals: ["HARBIN_CITY", "CURRENT_CITY"],
        metroRailForm: "prefix",
        keepDoubleZhanKinds: [],
        tramForceSuffixNames: [],
        observerFlag: "harbinTitleObserver",
        globalName: "HarbinStationTitle"
    });
})();
