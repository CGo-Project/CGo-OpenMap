/** CGo OpenMap - 长春图例配置 */
const LEGEND_CONFIG = [
    { type: "title", title: "运营线路", subtitle: "Metro Lines" },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["CCM01"], name: "1号线" },
            { targets: ["CCM02"], name: "2号线" },
            { targets: ["CCM03"], name: "3号线" },
            { targets: ["CCM04"], name: "4号线" },
            // 5 号线一期在建，开通时刻登记在 data_opening.js；
            // 图例项与已开通线路同样列出，方便开通前后都能点选定位（与北京列出在建线路的做法一致）
            { targets: ["CCM05"], name: "5号线" },
            { targets: ["CCM06"], name: "6号线" },
            { targets: ["CCM07"], name: "7号线" },
            { targets: ["CCM08"], name: "8号线" }
        ]
    },
    { type: "title", title: "有轨线路", subtitle: "Tram Lines" },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["CCG54"], name: "G54路" },
            { targets: ["CCG55"], name: "G55路" }
        ]
    }
];
if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.CHANGCHUN_CITY) window.CHANGCHUN_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
