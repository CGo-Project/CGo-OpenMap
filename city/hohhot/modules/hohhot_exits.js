/**
 * CGo OpenMap - 呼和浩特车站出入口配置
 *
 * 渲染逻辑在共享层 `shared/exits.js`（多城共用），本文件只声明数据在哪与页签叫什么。
 * 数据：`city/hohhot/data_exits.js`（来源为中文维基百科各车站条目的「车站出口」章节）。
 *
 * 本城官网「服务设施」只发布车站层级图、没有逐条设施位置数据，故不配 `facilityGlobals`
 * （出口下不挂扶梯 / 电梯）。
 *
 * 页签声明在 `hohhot.js` 的 `stationBoard.tabs` 里（id 必须与共享层模块的 targetTab 一致），
 * 自定义页签渲染在「车站信息」之前，正好紧挨着它。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const exits = window.CGoExits;
    if (!exits) {
        console.warn("[hohhot_exits] 共享层 CGoExits 未加载，出入口页签未注册");
        return;
    }

    exits.register({
        idPrefix: "hohhot",
        name: "呼和浩特车站出入口",
        dataGlobals: ["HOHHOT_STATION_EXITS"],
        sourceNote: "以上出口编号与周边目的地摘自中文维基百科各车站条目，与现场可能不一致"
    });
})();
