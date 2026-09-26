/**
 * CGo OpenMap - 深圳图例配置 (city/shenzhen/data_legend.js)
 *
 * 分组与命名对应官方运营线路网络图底部图例；2 号线与 8 号线贯通运营。
 */

const LEGEND_CONFIG = [
    { type: "title", title: "运营线路", subtitle: "Metro Lines" },
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
            { targets: ["L6B"], name: "6号线支线 Line 6 Branch" },
            { targets: ["L7"], name: "7号线 Line 7" },
            { targets: ["L8"], name: "8号线 Line 8" },
            { targets: ["L9"], name: "9号线 Line 9" },
            { targets: ["L10"], name: "10号线 Line 10" },
            { targets: ["L11"], name: "11号线 Line 11" },
            { targets: ["L12"], name: "12号线 Line 12" },
            { targets: ["L13"], name: "13号线 Line 13" },
            { targets: ["L14"], name: "14号线 Line 14" },
            { targets: ["L16"], name: "16号线 Line 16" },
            { targets: ["L20"], name: "20号线 Line 20" }
        ]
    },
    { type: "title", title: "跨境衔接", subtitle: "Cross-boundary" },
    {
        type: "grid",
        cols: 1,
        items: [
            { targets: ["EAL"], name: "港铁东铁线 MTR East Rail Line" }
        ]
    }
];

if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.SHENZHEN_CITY) window.SHENZHEN_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
