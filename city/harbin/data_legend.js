/** CGo OpenMap - 哈尔滨图例配置 (city/harbin/data_legend.js) */
const LEGEND_CONFIG = [
    { type: "title", title: "运营线路", subtitle: "Metro Lines" },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["HBM01"], name: "1号线" },
            { targets: ["HBM02"], name: "2号线" },
            { targets: ["HBM03"], name: "3号线" }
        ]
    }
];
if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.HARBIN_CITY) window.HARBIN_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
