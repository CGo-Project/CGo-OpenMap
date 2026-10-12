/**
 * CGo OpenMap - 大连车站出入口配置
 *
 * 渲染逻辑在共享层 `shared/station/exits.js`（多城共用），本文件只声明数据在哪与页签叫什么。
 * 数据：`city/dalian/data_exits.js`（由 `drunk/tools/facilities/fetch_dalian_exits.js` 逐站抓取）。
 *
 * 页签声明在 `dalian.js` 的 `stationBoard.tabs` 里（id 必须与共享层模块的 targetTab 一致），
 * 自定义页签渲染在「车站信息」之前，正好紧挨着它。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const exits = window.CGoExits;
    if (!exits) {
        console.warn("[dalian_exits] 共享层 CGoExits 未加载，出入口页签未注册");
        return;
    }

    exits.register({
        idPrefix: "dalian",
        name: "大连车站出入口",
        dataGlobals: ["DALIAN_STATION_EXITS"],
        // 该出口的电梯取自车站设施表，判定规则见 dalian.js 的 CGO_EXIT_VERTICAL
        facilityGlobals: ["DALIAN_STATION_FACILITIES"],
        sourceNote: "以上内容摘自大连公共交通建设投资集团官网，与现场可能不一致"
    });
})();
