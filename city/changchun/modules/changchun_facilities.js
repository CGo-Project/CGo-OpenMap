/**
 * CGo OpenMap - 长春车站设施配置
 *
 * 渲染、逐条开合与来源标注都在共享层 `shared/facilities.js`（多城共用），本文件只声明
 * 长春的数据在哪、各类设施叫什么、用哪个 CGoUI 图标。
 *
 * 数据：`city/changchun/data_facilities.js`（由 `drunk/tools/facilities/gen_changchun_facilities.js`
 * 依 `drunk/tools/changchun_facilities.transcript.json` 生成，重跑脚本即刷新）。
 * 长春官网没有可抓取的设施接口，设施只出现在官方公众号推送的表格图里
 * （2025-04 发布、此后未更新），故走「人工转录 → 脚本生成」这条路，
 * 与沈阳、大连（有接口可重抓）不同：本城数据不会随官网自动刷新。
 *
 * 加载顺序：`changchun.js` 的 loadStationBoardModules() 先 document.write 数据与共享层，
 * 再加载本文件，故此处可直接调用 window.CGoFacilities.register()。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const facilities = window.CGoFacilities;
    if (!facilities) {
        console.warn("[changchun_facilities] 共享层 CGoFacilities 未加载，车站设施模块未注册");
        return;
    }

    facilities.register({
        idPrefix: "changchun",
        name: "长春车站设施",
        title: "车站设施",
        order: 6,
        dataGlobals: ["CHANGCHUN_STATION_FACILITIES"],
        sourceNote: "以上内容摘自长春轨道交通官方公众号（2025 年 4 月推送，此后未更新），与现场可能不一致",
        /**
         * 归一化类型 → 展示名与 CGoUI 图标（数据层只存 type 与位置）。
         * 官方把「无障碍电梯 / 升降平台」并在一列，数据层已按官方原文分行拆成两个类型。
         * 饮料 / 文创自动售卖机与充电宝在 CGoUI 里暂无专用图标，按现有图标择近降级为 info。
         * `tone: "alert"` 是共享层的通用强调位（样式表见 shared/facilities.css）：
         * AED 是急救设备，图标与开合按钮文字转红以便一眼找到。
         */
        types: {
            toilet: { name: "卫生间", icon: "toilet" },
            nursing_room: { name: "母婴室", icon: "baby" },
            elevator: { name: "无障碍电梯", icon: "elevator" },
            a11yplatform: { name: "升降平台", icon: "a11yplatform" },
            vending_drink: { name: "饮料自动售卖机", icon: "info" },
            vending_merch: { name: "文创自动售卖机", icon: "info" },
            power_bank: { name: "充电宝", icon: "info" },
            aed: { name: "自动体外除颤仪（AED）", icon: "aed", tone: "alert" },
            photo_booth: { name: "自助照相机", icon: "camera" }
        }
    });
})();
