/**
 * CGo OpenMap - 长春车站地图卡片
 *
 * 使用高德地铁图接口返回的 GCJ-02 坐标，在车站详情面板中渲染可缩放的
 * 高德地图切片。卡片只处理地图展示，不写入线路或站点排版数据。
 * 渲染逻辑位于三城共享引擎（临时位置 city/shenyang/shared/stacard-engine.js，
 * 计划在开发团队确认后迁入 core/，详见 docs/STACARD_TIMETABLE_UNIFICATION.md）。
 */

import { createStaCard } from "../../shenyang/shared/stacard-engine.js";

const ChangchunStaCard = createStaCard({
    cityName: "长春",
    geoDataUrl: "./city/changchun/amap_data.json",
    // 长春数据带站点 ID 与 poiid，且站名常带尾部「站」，故索引最全
    index: { byId: true, stripSuffix: true, byPoiid: true },
    hasCard: "strict",
    // 无坐标时不输出占位卡片（而非渲染空状态提示）
    placeholder: "onlyWithCoords",
    crossPlatform: { className: "hoisted-stacard", margin: "0 0 12px 0" },
    attribution: true,
    zoom: { default: 15, min: 12, max: 18 },
    interactions: { wheel: true, dblclick: true }
});

if (typeof window !== "undefined") {
    window.CGoStaCard = ChangchunStaCard;
}

export { ChangchunStaCard };
