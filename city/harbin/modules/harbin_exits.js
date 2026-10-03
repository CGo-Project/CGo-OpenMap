/**
 * CGo OpenMap - 哈尔滨车站出入口配置
 *
 * 渲染逻辑在共享层 `shared/exits.js`（多城共用），本文件只声明数据在哪与页签叫什么。
 * 数据：`city/harbin/data_exits.js`（由 drunk/tools/facilities/ 下的开发期脚本从
 *       高德地图开放平台 Web 服务 API 抓取生成，脚本不进运行时、不入版本库）。
 *
 * 页签声明在 `harbin.js` 的 `stationBoard.tabs` 里（id 必须与共享层模块的 targetTab 一致），
 * 自定义页签渲染在「车站信息」之前，正好紧挨着它。
 *
 * 注：哈尔滨未接入车站设施层，故本模块不配 facilityGlobals（无扶梯 / 电梯可挂）。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const exits = window.CGoExits;
    if (!exits) {
        console.warn("[harbin_exits] 共享层 CGoExits 未加载，出入口页签未注册");
        return;
    }

    exits.register({
        idPrefix: "harbin",
        name: "哈尔滨车站出入口",
        dataGlobals: ["HARBIN_STATION_EXITS"],
        sourceNote: "出入口编号摘自高德地图，与现场可能不一致"
    });
})();
