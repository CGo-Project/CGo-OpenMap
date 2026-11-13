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
            { targets: ["L1"], name: "1号线 Line 1" },
            { targets: ["L2"], name: "2号线 Line 2" },
            { targets: ["L3"], name: "3号线 Line 3" },
            { targets: ["L4"], name: "4号线 Line 4" },
            { targets: ["L5"], name: "5号线 Line 5" },
            { targets: ["L6"], name: "6号线 Line 6" },
            { targets: ["L7"], name: "7号线 Line 7" },
            { targets: ["L8"], name: "8号线 Line 8" },
            { targets: ["L11"], name: "11号线 Line 11" }
        ]
    },
    {
        type: "title",
        title: "有轨电车",
        subtitle: "Tram Lines"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["TSND1"], name: "有轨1号线 SNZ Tram Line 1" },
            { targets: ["TSND2"], name: "有轨2号线 SNZ Tram Line 2" },
            { targets: ["TSND5"], name: "有轨5号线 SNZ Tram Line 5" }
        ]
    },
    {
        type: "title",
        title: "跨省换乘",
        subtitle: "Cross-province Transfer"
    },
    {
        type: "grid",
        cols: 1,
        items: [
            { targets: ["SH11"], name: "上海地铁11号线 Shanghai Metro Line 11" }
        ]
    }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
