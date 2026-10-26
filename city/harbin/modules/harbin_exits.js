/**
 * CGo OpenMap - 哈尔滨车站出入口配置
 *
 * 渲染逻辑在共享层 `shared/station/exits.js`（多城共用），本文件只声明数据在哪与页签叫什么。
 * 数据：`city/harbin/data_exits.js`（由 tools/facilities/ 下的开发期脚本从
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

    /**
     * 出入口页签的激活色（城市侧覆盖，见 shared/station/exits.css 的 --cgo-exit-accent）。
     * 共享层默认用成功语义色（--success-color），但本城导视牌的出入口提示取色偏柠檬黄，
     * 页签底线改用警告语义色以与实地标识对齐。
     * 本城没有 style.css，且这里只需一条规则，故就地内联一个 <style>（同 harbin_line_badges.js 手法）。
     */
    (function injectAccent() {
        if (document.getElementById("harbin-exit-accent-style")) return;
        const style = document.createElement("style");
        style.id = "harbin-exit-accent-style";
        style.textContent = ':root { --cgo-exit-accent: var(--warning-color); }';
        document.head.appendChild(style);
    })();

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
