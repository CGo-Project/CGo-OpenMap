/**
 * CGo OpenMap - 合肥在建与规划线路
 */

const NOT_OPEN_LINES = [
    {
        name: "S1线（新桥1号航站楼以西）",
        points: [
            { x: 117, y: 722 },
            { x: 200, y: 722 },
            { x: 296, y: 722 },
            { x: 296, y: 764 },
            { x: 296, y: 817, r: 28 },
            { x: 347, y: 817 }
        ],
        style: { color: "#baa284", width: "3.4", dashArray: "6,4" }
    },
    {
        name: "S1线（省中医院西区—五里墩）",
        points: [
            { x: 1008, y: 1279 },
            { x: 1010, y: 1279 },
            { x: 1010, y: 1349 }
        ],
        style: { color: "#baa284", width: "3.4", dashArray: "6,4" }
    }
];
