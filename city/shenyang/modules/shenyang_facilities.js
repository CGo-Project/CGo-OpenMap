/**
 * CGo OpenMap - 沈阳车站设施配置
 *
 * 渲染、开合与来源标注都在共享层 `shared/facilities.js`（多城共用），本文件只声明
 * 沈阳的数据在哪、各类设施叫什么、用哪个 CGoUI 图标，以及官网剖面图地址表。
 *
 * 数据：`city/shenyang/data_facilities.js`（由 `drunk/tools/facilities/fetch_shenyang_facilities.js` 抓取，
 * 重跑脚本即刷新）；层级图地址表 `SHENYANG_STATION_LEVEL_MAP` 由 `data_timetable.js` 生成。
 *
 * 加载顺序：`shenyang.js` 的 loadStationBoardModules() 先 document.write 共享层，
 * 再加载本文件，故此处可直接调用 window.CGoFacilities.register()。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const facilities = window.CGoFacilities;
    if (!facilities) {
        console.warn("[shenyang_facilities] 共享层 CGoFacilities 未加载，车站设施模块未注册");
        return;
    }

    facilities.register({
        idPrefix: "shenyang",
        name: "沈阳车站设施",
        title: "车站设施",
        order: 6,
        dataGlobals: ["SHENYANG_STATION_FACILITIES"],
        sourceNote: "以上内容摘自沈阳地铁官网，与现场可能不一致",
        /** 归一化类型 → 展示名与 CGoUI 图标（数据层只存 type 与位置） */
        types: {
            service_center: { name: "乘客服务中心", icon: "counter" },
            ticket_machine: { name: "自动售票机", icon: "payment" },
            toilet: { name: "卫生间", icon: "toilet" },
            accessible_toilet: { name: "无障碍卫生间", icon: "a11ytoilet" },
            nursing_room: { name: "母婴室", icon: "baby" },
            elevator: { name: "无障碍电梯", icon: "elevator" },
            escalator_up: { name: "自动扶梯（上行）", icon: "escup" },
            escalator_down: { name: "自动扶梯（下行）", icon: "escdown" },
            shengjingtong: { name: "盛京通网点", icon: "card" }
        },
        /** 官网剖面图（默认展开，可收起）；无图的车站不渲染该条目 */
        levelMap: {
            global: "SHENYANG_STATION_LEVEL_MAP",
            icon: "layer",
            name: "车站层级图",
            altText: (station) => `${station?.cn || ""}车站层级图`
        }
    });
})();
