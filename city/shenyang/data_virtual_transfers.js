/** CGo OpenMap - 沈阳虚拟换乘配置 (city/shenyang/data_virtual_transfers.js) */
const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];
const VIRTUAL_TRANSFER_MAP = {
    // 奥体中心
    "T501": ["0215"],
    "0215": ["T501"],
    // 行政服务中心-朗日街-浑南图书馆
    "T505": ["0921"],
    "T506": ["0921"],
    "0921": ["T505","T506"],
    // 长青南街-浑南实验小学
    "T508": ["0922"],
    "0922": ["T508"],
    // 建筑大学
    "T510": ["0923"],
    "0923": ["T510"],
    // 沈阳站
    "0114": ["SYT"],
    "SYT": ["0114"],
    // 沈阳北站
    "0207": ["SBT"],
    "SBT": ["0207"],
    // 沈阳南站
    "0422": ["SOT"],
    "SOT": ["0422"],
};
const VIRTUAL_CONNECT_LINES = [
    { from: "T501", to: "0215" },
    { from: "T505", to: "0921" },
    { from: "T506", to: "0921" },
    { from: "T508", to: "0922" },
    { from: "T510", to: "0923" },
    { from: "0114", to: "SYT" },
    { from: "0207", to: "SBT" },
    { from: "0422", to: "SOT" },
];
