/** CGo OpenMap - 长春虚拟换乘配置（官方图未声明站外免费换乘） */
const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];
const VIRTUAL_TRANSFER_MAP = {
    "CCT": ["0124", "0125"],
    "0124": ["CCT"],
    "0125": ["CCT"],
    "CRT": ["0225","G5519"],
    "0225": ["CRT","G5519"],
    "G5519": ["CRT","0225"],
    "G5406": ["0331"],
    "0331": ["G5406"],
    "G5412": ["0229"],
    "0229": ["G5412"],
    "G5401": ["0507"],
    "0507": ["G5401"],
    //东大桥：3 号线与 5 号线站厅不连通，付费出站换乘
    "0424": ["0501"],
    "0501": ["0424"],
};
const VIRTUAL_CONNECT_LINES = [
    { from: "CCT", to: "0124"},
    { from: "CCT", to: "0125"},
    { from: "CRT", to: "0225"},
    { from: "G5519", to: "CRT"},
    { from: "G5406", to: "0331"},
    { from: "G5412", to: "0229"},
    { from: "G5401", to: "0507"},
    { from: "0424", to: "0501"},
];
