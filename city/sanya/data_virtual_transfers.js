/**
 * CGo OpenMap - 三亚 站外换乘 (city/sanya/data_virtual_transfers.js)
 * 有轨电车「三亚火车站」 ⇄ 三乐旅游铁路「三亚」：两站步行换乘（参考兰州陈官营）
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_TRANSFER_MAP = {
    "SY01": ["SL01"],
    "SL01": ["SY01"]
};

const VIRTUAL_FREE_CONNECT_LINES = [];

const VIRTUAL_CONNECT_LINES = [
    { from: "SY01", to: "SL01", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } }
];
