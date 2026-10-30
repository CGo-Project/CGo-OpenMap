/**
 * CGo OpenMap - 台中 站外換乘（參考三亞 三亞火車站 ⇄ 三亞）
 * 綠線「大慶／烏日／高鐵台中站」 ⇄ 台鐵「大慶／烏日／新烏日」，同名同址步行換乘
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_TRANSFER_MAP = {
    "TC115": ["T09"],
    "T09": ["TC115"],
    "TC118": ["T10"],
    "T10": ["TC118"],
    "TC119": ["T11"],
    "T11": ["TC119"],
};

const VIRTUAL_FREE_CONNECT_LINES = [];

const VIRTUAL_CONNECT_LINES = [
    { from: "TC115", to: "T09", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } },
    { from: "TC118", to: "T10", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } },
    { from: "TC119", to: "T11", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } }
];
