/**
 * CGo OpenMap - 深圳出站换乘配置 (city/shenzhen/data_virtual_transfers.js)
 *
 * 官方线网图以灰色虚线连接的出站换乘：湖贝（2 号线 / 5 号线）、红岭南（9 号线 / 11 号线）、
 * 福田口岸（4 号线 / 10 号线，合为一站绘制）。虚线已作为静态图层绘于 shenzhen_deco.svg，
 * 这里只登记换乘关系，供信息板列出可换乘线路，不再让引擎重复绘制连接线。
 */

const VIRTUAL_TRANSFER_MAP = {
    "hubei_l2": ["hubei_l5"],
    "hubei_l5": ["hubei_l2"],
    "hongling_south_l9": ["hongling_south_l11"],
    "hongling_south_l11": ["hongling_south_l9"]
};
const VIRTUAL_CONNECT_LINES = [];
const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];
