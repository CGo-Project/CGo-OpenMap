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
            { targets: ["CCM06"], name: "6号线" },
            { targets: ["CCM07"], name: "7号线" },
            { targets: ["CCM08"], name: "8号线" }
        ]
    }
];
if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.CHANGCHUN_CITY) window.CHANGCHUN_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
