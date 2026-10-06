/**
 * CGo OpenMap - 沈阳车站出入口配置
 *
 * 渲染逻辑在共享层 `shared/exits.js`（多城共用），本文件只声明数据在哪与页签叫什么。
 * 数据：`city/shenyang/data_exits.js`（由 drunk/tools/facilities/ 下的开发期脚本从
 *       高德地图开放平台 Web 服务 API 抓取生成，脚本不入版本库）。
 *
 * 页签声明在 `shenyang.js` 的 `stationBoard.tabs` 里（id 必须与共享层模块的 targetTab 一致），
 * 自定义页签渲染在「车站信息」之前，正好紧挨着它。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const exits = window.CGoExits;
    if (!exits) {
        console.warn("[shenyang_exits] 共享层 CGoExits 未加载，出入口页签未注册");
        return;
    }

    exits.register({
        idPrefix: "shenyang",
        name: "沈阳车站出入口",
        dataGlobals: ["SHENYANG_STATION_EXITS"],
        // 该出口的扶梯 / 电梯取自车站设施表，判定规则见 shenyang.js 的 CGO_EXIT_VERTICAL
        facilityGlobals: ["SHENYANG_STATION_FACILITIES"],
        sourceNote: "出入口编号摘自高德地图，电梯与扶梯位置摘自沈阳地铁官网，与现场可能不一致"
    });
})();
