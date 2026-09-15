/**
 * CGo OpenMap - 悉尼轨道交通图例配置 (city/sydney/data_legend.js)
 *
 * 分组与命名对应官方线网图底部 "Sydney train and metro lines" 图例。
 */

const LEGEND_CONFIG = [
    {
        type: "title",
        title: "悉尼城际与市郊铁路",
        subtitle: "Sydney Trains"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["T1"], name: "T1 North Shore & Western" },
            { targets: ["T2"], name: "T2 Leppington & Inner West" },
            { targets: ["T3"], name: "T3 Liverpool & Inner West" },
            { targets: ["T4"], name: "T4 Eastern Suburbs & Illawarra" },
            { targets: ["T5"], name: "T5 Cumberland" },
            { targets: ["T6"], name: "T6 Lidcombe & Bankstown" },
            { targets: ["T7"], name: "T7 Olympic Park" },
            { targets: ["T8"], name: "T8 Airport & South" },
            { targets: ["T9"], name: "T9 Northern" }
        ]
    },
    {
        type: "title",
        title: "悉尼地铁",
        subtitle: "Sydney Metro"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["M1"], name: "M1 North West & Bankstown" }
        ]
    },
    {
        type: "title",
        title: "改造中区间",
        subtitle: "Line under conversion"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["CONV"], name: "Bankstown 线（公交接驳）" }
        ]
    },
    {
        type: "title",
        title: "在建线路",
        subtitle: "Under construction"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["MW"], name: "Sydney Metro West" },
            { targets: ["WSA"], name: "Sydney Metro - Western Sydney Airport" }
        ]
    }
];

if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.SYDNEY_CITY) window.SYDNEY_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
