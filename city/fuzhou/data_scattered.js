/**
 * CGo OpenMap - 地图背景装饰物与示意图素材配置 (city/fuzhou/data_scattered.js)
 *
 * 编辑器中的水域已合并导出为 assets/fuzhou_sea.svg，作为底层地理底图注入（亮/暗两套填充色写在 SVG 内部）。
 * 字段：id、file、x、y（素材中心点，核心以 translate(-50%,-50%) 居中定位）、width、height、opacity、zIndex。
 * 水域底图建议 x/y 取画布中心、width/height 取画布尺寸、zIndex 1，与 city/qingdao、city/dalian 一致。
 *
 * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（2026-09-16）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 */

const SCATTERED_DATA = [
    {
        id: "fuzhou-sea",
        file: "./city/fuzhou/assets/fuzhou_sea.svg",
        x: 1250,
        y: 800,
        width: 2500,
        height: 1600,
        opacity: 1,
        zIndex: 1
    },
];
