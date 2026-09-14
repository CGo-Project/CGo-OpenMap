/**
 * CGo OpenMap - 合肥轨道交通图例配置 (city/hefei/data_legend.js)
 */

const LEGEND_CONFIG = [
    {
        type: "title",
        title: "城市轨道交通",
        subtitle: "Urban Rail Transit"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["HFM1"], name: "1号线" },
            { targets: ["HFM2"], name: "2号线" },
            { targets: ["HFM3"], name: "3号线" },
            { targets: ["HFM4"], name: "4号线" },
            { targets: ["HFM5"], name: "5号线" },
            { targets: ["HFM6"], name: "6号线" },
            { targets: ["HFM7"], name: "7号线" },
            { targets: ["HFM8"], name: "8号线" }
        ]
    },
    {
        type: "title",
        title: "市域/机场线",
        subtitle: "Airport / Suburban"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["HFS1"], name: "S1线" }
        ]
    }
];

if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.HEFEI_CITY) window.HEFEI_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
