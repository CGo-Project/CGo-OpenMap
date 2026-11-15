/**
 * CGo OpenMap - 虚拟换乘与出站连通配置 (city/xiamen/data_virtual_transfers.js)
 *
 * 编辑器中有 7 组虚拟换乘，已按 city/beijing、city/dalian 的格式导出：
 * 组内车站两两互认（映射表为完全互连），连线按最小生成树给出。
 * 字段：VIRTUAL_FREE_TRANSFER_MAP / VIRTUAL_TRANSFER_MAP 为「车站键 → 可换乘车站键数组」，
 *       VIRTUAL_FREE_CONNECT_LINES / VIRTUAL_CONNECT_LINES 为 { from, to, offsetFrom?, offsetTo? } 连线。
 *
 * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（2026-09-27）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 */

// 免费虚拟换乘/站外换乘映射表
const VIRTUAL_FREE_TRANSFER_MAP = {};

// 免费虚拟换乘连线数组
const VIRTUAL_FREE_CONNECT_LINES = [];

// 付费/国铁虚拟换乘映射表
const VIRTUAL_TRANSFER_MAP = {
    // 文灶
    "M104": ["M606"],
    "M606": ["M104"],
    // 厦门火车站
    "M306": ["M608"],
    "M608": ["M306"],
    // 华侨大学
    "M521": ["M622"],
    "M622": ["M521"],
    // 官浔
    "M404": ["M609_2"],
    "M609_2": ["M404"],
    // 厦门北站
    "M123": ["M628"],
    "M628": ["M123"],
    // 蔡塘
    "M221": ["M613"],
    "M613": ["M221"],
    // 湖里创新园
    "M316": ["M616"],
    "M616": ["M316"],
};

// 付费/国铁虚拟换乘连线数组
const VIRTUAL_CONNECT_LINES = [
    // 文灶
    { from: "M104", to: "M606" },
    // 厦门火车站
    { from: "M306", to: "M608" },
    // 华侨大学
    { from: "M521", to: "M622" },
    // 官浔
    { from: "M404", to: "M609_2" },
    // 厦门北站
    { from: "M123", to: "M628" },
    // 蔡塘
    { from: "M221", to: "M613" },
    // 湖里创新园
    { from: "M316", to: "M616" },
];
