/**
 * CGo OpenMap - 在建与规划未开通线路走向数据 (city/shijiazhuang/data_notopen.js)
 * ==============================================================================
 */

const NOT_OPEN_LINES = [
    {
        // 1号线西延（西王 → 上庄 → 槐安路）
        points: [
            { x: 260, y: 820 },
            { x: 200, y: 820 },
            { x: 140, y: 820 }
        ],
        style: {
            color: "#E4002B",
            width: "3",
            dashArray: "6,4"
        }
    }
];