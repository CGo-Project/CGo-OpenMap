/**
 * CGo OpenMap - 上海虚拟换乘与出站连通配置 (city/shanghai/data_virtual_transfers.js)
 * 车站 ID 采用官方线网图站点编号（SH_ + 线路两位 + 站序两位，如 SH_0123 = 1 号线人民广场）。
 * 出站换乘关系待补充。
 */

// 免费虚拟换乘/站外换乘映射表 (上海公共交通卡/随申码出站限时换乘)
const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];

// 付费虚拟换乘/火车站接驳映射表
const VIRTUAL_TRANSFER_MAP = {};
const VIRTUAL_CONNECT_LINES = [];
