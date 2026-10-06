/**
 * CGo OpenMap - 呼和浩特车站地图卡片 (city/hohhot/stacard/script.js)
 *
 * 渲染逻辑位于共享层（临时位置 city/shenyang/shared/stacard-engine.js，
 * 计划迁入 core/，详见 docs/STACARD_TIMETABLE_UNIFICATION.md）。
 *
 * 坐标来源：高德地铁图接口生成的 city/hohhot/amap_data.json（GCJ-02），
 * 该数据只带站名与经纬度、无站点 ID / poiid，因此索引沿用默认（按站名匹配），
 * 配置口径与大连 / 哈尔滨一致。
 */

import { createStaCard } from "../../shenyang/shared/stacard-engine.js";

const HohhotStaCard = createStaCard({
    cityName: "呼和浩特",
    geoDataUrl: "./city/hohhot/amap_data.json",
    hasCard: "loose",
    placeholder: "always",
    crossPlatform: null,
    attribution: false,
    zoom: { default: 15, min: 12, max: 18 },
    interactions: { wheel: true, dblclick: true }
});

if (typeof window !== "undefined") {
    window.CGoStaCard = HohhotStaCard;
}

export { HohhotStaCard };
