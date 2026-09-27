const VIRTUAL_FREE_TRANSFER_MAP = {};
const VIRTUAL_FREE_CONNECT_LINES = [];
const VIRTUAL_TRANSFER_MAP = {
    // 兰州火车站 - 兰州
    "M207": ["S101"],
    "S101": ["M207"],

    // 兰州西站北广场 / 兰州西站南广场 - 兰州西（同一键只能写一次，否则后者覆盖前者）
    "M114": ["S102"],
    "M216": ["S102"],
    "S102": ["M114", "M216"],

    // 陈官营 - 陈官营
    "M120": ["S103"],
    "S103": ["M120"],

    // 中川机场3号航站楼 - 中川机场东
    "M516": ["S107"],
    "S107": ["M516"]
};


const VIRTUAL_CONNECT_LINES = [
    {// 兰州火车站 - 兰州
        from: "M207", 
        to: "S101",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {// 兰州西站北广场 - 兰州西
        from: "M114", 
        to: "S102",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {// 兰州西站南广场 - 兰州西
        from: "M216", 
        to: "S102",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {// 陈官营 - 陈官营
        from: "M120", 
        to: "S103",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    },
    {// 中川机场3号航站楼 - 中川机场东
        from: "M516", 
        to: "S107",
        offsetFrom: { x: 0, y: 0 },  // 起点向下偏移5px
        offsetTo: { x: 0, y: 0 }    // 终点向左偏移5px
    }
];