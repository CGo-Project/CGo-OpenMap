/**
 * CGo OpenMap - 大连车站设施配置
 *
 * 渲染、开合与来源标注都在共享层 `shared/facilities.js`（多城共用），本文件只声明
 * 大连的数据在哪、各类设施叫什么、用哪个 CGoUI 图标。
 *
 * 数据：`city/dalian/data_facilities.js`（由 `drunk/tools/facilities/fetch_dalian_facilities.js` 抓取）。
 * 大连官网只给卫生间 / 充值机 / 无障碍电梯三类，且没有站内剖面图，故不配 levelMap。
 *
 * 加载顺序：`dalian.js` 的 loadStationBoardModules() 先 document.write 共享层，
 * 再加载本文件，故此处可直接调用 window.CGoFacilities.register()。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const facilities = window.CGoFacilities;
    if (!facilities) {
        console.warn("[dalian_facilities] 共享层 CGoFacilities 未加载，车站设施模块未注册");
        return;
    }

    facilities.register({
        idPrefix: "dalian",
        name: "大连车站设施",
        title: "车站设施",
        order: 6,
        dataGlobals: ["DALIAN_STATION_FACILITIES"],
        sourceNote: "以上内容摘自大连公共交通建设投资集团官网，与现场可能不一致",
        /** 归一化类型 → 展示名与 CGoUI 图标（数据层只存 type 与位置） */
        types: {
            toilet: { name: "卫生间", icon: "toilet" },
            accessible_toilet: { name: "无障碍卫生间", icon: "a11ytoilet" },
            recharge_machine: { name: "充值机", icon: "card" },
            elevator: { name: "无障碍电梯", icon: "elevator" }
        }
    });
})();
