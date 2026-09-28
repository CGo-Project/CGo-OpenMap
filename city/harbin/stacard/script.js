/**
 * CGo OpenMap - 哈尔滨车站地图卡片 (city/harbin/stacard/script.js)
 *
 * 渲染逻辑位于共享层（临时位置 city/shenyang/shared/stacard-engine.js，
 * 计划在开发团队确认后迁入 core/，详见 docs/STACARD_TIMETABLE_UNIFICATION.md）。
 *
 * 坐标来源：高德地铁图接口生成的 city/harbin/amap_data.json（GCJ-02），
 * 该数据只带站名与经纬度、无站点 ID / poiid，也不需要去掉尾部「站」，
 * 因此索引沿用默认（按站名匹配），配置口径与大连一致。
 */

import { createStaCard } from "../../shenyang/shared/stacard-engine.js";

const HarbinStaCard = createStaCard({
    cityName: "哈尔滨",
    geoDataUrl: "./city/harbin/amap_data.json",
    hasCard: "loose",
    placeholder: "always",
    crossPlatform: null,
    attribution: false,
    zoom: { default: 15, min: 12, max: 18 },
    interactions: { wheel: true, dblclick: true }
});

if (typeof window !== "undefined") {
    window.CGoStaCard = HarbinStaCard;
}

export { HarbinStaCard };
