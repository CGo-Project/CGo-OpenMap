/**
 * CGo OpenMap - 图例结构与分组配置 (city/suzhou/data_legend.js)
 */

const LEGEND_CONFIG = [
    {
        type: "title",
        title: "运营线路",
        subtitle: "Metro Lines"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["M1"], name: "1号线 Line 1" },
            { targets: ["M2"], name: "2号线 Line 2" },
            { targets: ["M3"], name: "3号线 Line 3" },
            { targets: ["M4"], name: "4号线 Line 4" },
            { targets: ["M5"], name: "5号线 Line 5" },
            { targets: ["M6"], name: "6号线 Line 6" },
            { targets: ["M7"], name: "7号线 Line 7" },
            { targets: ["M8"], name: "8号线 Line 8" },
            { targets: ["M11"], name: "11号线 Line 11" }
        ]
    },
    {
        type: "title",
        title: "跨省换乘",
        subtitle: "Intercity Transfer"
    },
    {
        type: "grid",
        cols: 1,
        items: [
            { targets: ["SH11"], name: "上海地铁11号线 Shanghai Metro Line 11" }
        ]
    }
];
