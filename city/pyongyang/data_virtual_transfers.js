/**
 * CGo OpenMap - 平壤 站外换乘 (city/pyongyang/data_virtual_transfers.js)
 * 两线在交叉点各设一站、图元分开，步行换乘（参考三亚 三亚火车站 ⇄ 三亚）
 * 黄金原三站两两可换乘，但图上只画两条连接线（PY23 居中串成 V 形）
 */

const VIRTUAL_FREE_TRANSFER_MAP = {};

const VIRTUAL_TRANSFER_MAP = {
    // 黄金原：革新线 / 3号线 / 1号线 三站互连
    "PY20": ["PY23", "PY26"],
    "PY23": ["PY20", "PY26"],
    "PY26": ["PY20", "PY23"],
    // 复兴：千里马线 ⇄ 3号线
    "PY37": ["PY41"],
    "PY41": ["PY37"],
    // 三兴：革新线 ⇄ 锦绣山线
    "PY05": ["PY09"],
    "PY09": ["PY05"],
    // 荣光 ⇄ 平壤站：千里马线 ⇄ 1号线
    "PY38": ["PY42"],
    "PY42": ["PY38"],
};

const VIRTUAL_FREE_CONNECT_LINES = [];

const VIRTUAL_CONNECT_LINES = [
    { from: "PY23", to: "PY20", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } },
    { from: "PY23", to: "PY26", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } },
    { from: "PY37", to: "PY41", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } },
    { from: "PY05", to: "PY09", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } },
    { from: "PY38", to: "PY42", offsetFrom: { x: 0, y: 0 }, offsetTo: { x: 0, y: 0 } }
];
