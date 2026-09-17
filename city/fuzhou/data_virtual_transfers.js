/**
 * CGo OpenMap - 虚拟换乘与出站连通配置 (city/fuzhou/data_virtual_transfers.js)
 *
 * 编辑器中有 2 组虚拟换乘，已按 city/beijing、city/dalian 的格式导出：
 * 组内车站两两互认（映射表为完全互连），连线按最小生成树给出。
 * 字段：VIRTUAL_FREE_TRANSFER_MAP / VIRTUAL_TRANSFER_MAP 为「车站键 → 可换乘车站键数组」，
 *       VIRTUAL_FREE_CONNECT_LINES / VIRTUAL_CONNECT_LINES 为 { from, to, offsetFrom?, offsetTo? } 连线。
 *
 * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（2026-09-16）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 */

// 免费虚拟换乘/站外换乘映射表
const VIRTUAL_FREE_TRANSFER_MAP = {};

// 免费虚拟换乘连线数组
const VIRTUAL_FREE_CONNECT_LINES = [];

// 付费/国铁虚拟换乘映射表
const VIRTUAL_TRANSFER_MAP = {
    // 水部
    "M216": ["M603"],
    "M603": ["M216"],
    // 三叉街
    "M113": ["M605"],
    "M605": ["M113"],
};

// 付费/国铁虚拟换乘连线数组
const VIRTUAL_CONNECT_LINES = [
    // 水部
    { from: "M216", to: "M603" },
    // 三叉街
    { from: "M113", to: "M605" },
];
