/**
 * CGo OpenMap - 大连车站地图卡片
 *
 * 首末班车由 modules/dalian_timetable.js 渲染，本模块只负责车站周边地图。
 * 渲染逻辑位于三城共享引擎（临时位置 city/shenyang/shared/stacard-engine.js，
 * 计划在开发团队确认后迁入 core/，详见 docs/STACARD_TIMETABLE_UNIFICATION.md）。
 */

import { createStaCard } from "../../shenyang/shared/stacard-engine.js";

const DalianStaCard = createStaCard({
    cityName: "大连",
    geoDataUrl: "./city/dalian/amap_data.json",
    // 大连坐标数据无站点 ID / poiid，也不需要去掉尾部「站」，索引沿用默认
    hasCard: "loose",
    placeholder: "always",
    crossPlatform: null,
    attribution: false,
    zoom: { default: 15, min: 12, max: 18 },
    // 大连原先只支持按钮与滚轮缩放，无双击放大
    interactions: { wheel: true, dblclick: false }
});

if (typeof window !== "undefined") {
    window.CGoStaCard = DalianStaCard;
}

export { DalianStaCard };
