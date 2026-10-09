/**
 * CGo OpenMap - 呼和浩特车站设施配置
 *
 * 渲染、开合与来源标注都在共享层 `city/shenyang/shared/station/facilities.js`（多城共用），
 * 本文件只声明呼和浩特的数据在哪、官网层级图叫什么、用哪个 CGoUI 图标。
 *
 * 本城官网「服务设施」只发布车站层级图（剖面图），没有逐条设施位置数据，
 * 故 dataGlobals 与 types 均留空（types 必须是对象，共享层据此放行注册），
 * 仅配置 levelMap；层级图地址表 HOHHOT_STATION_LEVEL_MAP 见
 * `city/hohhot/data_facilities.js`。
 *
 * 加载顺序：`hohhot.js` 的 loadStationBoardModules() 先 document.write 共享层，
 * 再加载本文件，故此处可直接调用 window.CGoFacilities.register()。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const facilities = window.CGoFacilities;
    if (!facilities) {
        console.warn("[hohhot_facilities] 共享层 CGoFacilities 未加载，车站设施模块未注册");
        return;
    }

    facilities.register({
        idPrefix: "hohhot",
        name: "呼和浩特车站设施",
        title: "车站设施",
        order: 6,
        dataGlobals: [],
        types: {},
        sourceNote: "图源：呼和浩特地铁官网『服务设施』，与现场可能不一致",
        /** 官网层级图（车站剖面图）：无图的车站不渲染该条目 */
        levelMap: {
            global: "HOHHOT_STATION_LEVEL_MAP",
            icon: "layer",
            name: "车站层级图",
            altText: (station) => `${station?.cn || ""}车站层级图`
        }
    });
})();
