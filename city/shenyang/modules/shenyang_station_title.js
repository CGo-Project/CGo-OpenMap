/**
 * CGo OpenMap - 沈阳侧栏站名标题归一化 (city/shenyang/modules/shenyang_station_title.js)
 *
 * 机制（MutationObserver 安装、rAF 节流、防重复安装、防自触发写入）与站类判定、
 * 标题拼装的通用规则均在共享层 `city/shenyang/shared/station-title.js`，
 * 本文件只写沈阳的文案规则。
 *
 * 本模块原先内嵌于 shenyang_station_board.js，与「紧凑线路徽标同步」共用同一个
 * MutationObserver；拆分后标题归一化走共享层的独立 observer，
 * shenyang_station_board.js 只留徽标同步与同名站点击处理。
 *
 * ==============================================================================
 * 沈阳规则
 * ==============================================================================
 *   - 末尾「站」去重：**仅地铁站**保留双写（沈阳站 → 沈阳站站，与地铁官方站名一致），
 *     有轨站与国铁站一律去重
 *   - 与地铁站同名的有轨站 → 「XX站（有轨站）」
 *   - 国铁车站           → 「XX站（火车站）」
 *   - 与国铁站同名的地铁站：不作特殊化（metroRailForm: "none"），
 *     仍靠末尾「站」双写与国铁侧区分（「沈阳站站」vs「沈阳站（火车站）」）
 */
(function () {
    "use strict";

    const shared = window.CGoStationTitle;
    if (!shared) {
        console.warn("[shenyang_station_title] 共享层 CGoStationTitle 未加载，侧栏站名标题归一化未生效");
        return;
    }

    shared.createStationTitleNormalizer({
        cityGlobals: ["SHENYANG_CITY", "CURRENT_CITY"],
        metroRailForm: "none",
        keepDoubleZhanKinds: ["metro"],
        /**
         * 强制标注「（有轨站）」的有轨站名。
         * 用于「字面不同名、语义却高度混淆」的情况 —— 同名判定抓不到，需人工列出。
         * 沈阳目前为空，如有此类站名再补。
         */
        tramForceSuffixNames: [],
        observerFlag: "shenyangTitleObserver",
        globalName: "ShenyangStationTitle"
    });
})();
