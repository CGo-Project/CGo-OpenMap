/**
 * CGo OpenMap - 福州虚拟换乘与出站连通配置 (city/fuzhou/data_virtual_transfers.js)
 *
 * 福州无免费站外换乘；付费虚拟换乘为 水部 ⇄ 闽都、三叉街 ⇄ 三叉街（滨海快线）。
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};

const VIRTUAL_FREE_CONNECT_LINES = [];

const VIRTUAL_TRANSFER_MAP = {
    // 水部
    "M216": ["BE11"],
    "BE11": ["M216"],
    // 三叉街
    "M113": ["BE09"],
    "BE09": ["M113"],
};

// 付费/国铁虚拟换乘连线数组
const VIRTUAL_CONNECT_LINES = [
    // 水部
    { from: "M216", to: "BE11" },
    // 三叉街
    { from: "M113", to: "BE09" },
];
