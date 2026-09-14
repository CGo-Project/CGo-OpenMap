/** CGo OpenMap - 大连图例配置 (city/dalian/data_legend.js) */
const LEGEND_CONFIG = [
    { type: "title", title: "地铁线路", subtitle: "Metro Lines" },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["DLM01"], name: "1号线" },
            { targets: ["DLM02"], name: "2号线" },
            { targets: ["DLM03", "DLM99"], name: "3号线 / 3号线支线" },
            { targets: ["DLM05"], name: "5号线" },
            { targets: ["DLM12"], name: "12号线" },
            { targets: ["DLM13"], name: "13号线" }
        ]
    },
    { type: "title", title: "有轨线路", subtitle: "Tram Lines" },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["DL201","DL201-1"], name: "201路 / 201路区间" },
            { targets: ["DL202"], name: "202路" },
        ]
    }
];
if (typeof window !== "undefined") { window.LEGEND_CONFIG = LEGEND_CONFIG; window.LEGEND_SECTIONS = LEGEND_CONFIG; if (window.DALIAN_CITY) window.DALIAN_CITY.LEGEND_CONFIG = LEGEND_CONFIG; if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG; }
