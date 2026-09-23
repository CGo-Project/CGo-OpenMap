/**
 * CGo OpenMap - 沈阳车站卡片模块
 *
 * 读取高德坐标数据，在车站详情中渲染可缩放的周边地图。
 * 运营信息由 modules/shenyang_service_info.js 负责，本模块只渲染地图卡片。
 * 渲染逻辑位于三城共享引擎（临时位置 city/shenyang/shared/stacard-engine.js，
 * 计划在开发团队确认后迁入 core/，详见 docs/STACARD_TIMETABLE_UNIFICATION.md）。
 */

import "./data.js";
import { createStaCard } from "../shared/stacard-engine.js";

const ShenyangStaCard = createStaCard({
    cityName: "沈阳",
    geoDataUrl: "./city/shenyang/amap_data.json",
    index: { byId: true, stripSuffix: false, byPoiid: false },
    hasCard: "strict",
    placeholder: "always",
    // 同台换乘置顶卡片：加 hoisted-stacard 类并收紧上边距
    crossPlatform: { className: "hoisted-stacard", margin: "0 0 12px 0" },
    attribution: false,
    zoom: { default: 15, min: 12, max: 18 },
    interactions: { wheel: true, dblclick: true }
});

if (typeof window !== "undefined") {
    window.CGoStaCard = ShenyangStaCard;
}

export { ShenyangStaCard };
