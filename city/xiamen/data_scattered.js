/**
 * CGo OpenMap - 地图背景装饰物与示意图素材配置 (city/xiamen/data_scattered.js)
 *
 * 水域底图（厦门海域与岸线）：素材 viewBox 与画布尺寸完全一致（1900 × 1600），
 * 因此 x/y 取画布中心 (950, 800)、width/height 取画布尺寸即 **1:1 对齐站点坐标**，无需缩放。
 * 本层（#scattered-layer）位于线路与站点**下方**（素材 zIndex 1 < 线路 10），只作底色，
 * 不参与鼠标/触控交互（pointer-events: none）。
 * 深色主题下对水域的亮度压制见 city/xiamen/style.css。
 *
 * 字段：id、file、x、y（素材中心点，核心以 translate(-50%,-50%) 居中定位）、width、height、opacity、zIndex。
 * 编辑器中没有水域，可自行加入城市特色地标矢量素材。
 *
 * 本文件与 assets/xiamen_sea.svg 自 2026-09-28 起为**手工维护**：厦门线网几何已基本固定，
 * 原一键导出工具（原 city/xiamen/tools/）已弃用，其快照与说明见仓库外归档
 * `F:\github\cgo-archive\20260928-厦门导出工具弃用\`（含编辑器工程 JSON）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 */

const SCATTERED_DATA = [
    {
        id: "xiamen-sea",
        file: "./city/xiamen/assets/xiamen_sea.svg",
        x: 950,
        y: 800,
        width: 1900,
        height: 1600,
        opacity: 1,
        zIndex: 1
    }
];
