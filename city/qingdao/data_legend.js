/** CGo OpenMap - 青岛轨道交通图例 */
const LEGEND_CONFIG = [
    { type: "title", title: "城市轨道交通", subtitle: "Urban Rail Transit" },
    { type: "grid", cols: 2, items: [
        { targets: ["QDM01"], name: "1号线" },
        { targets: ["QDM02"], name: "2号线" },
        { targets: ["QDM03"], name: "3号线" },
        { targets: ["QDM04"], name: "4号线" },
        { targets: ["QDM05"], name: "5号线" },
        { targets: ["QDM06"], name: "6号线" },
        { targets: ["QDM07N","QDM07S"], name: "7号线" },
        { targets: ["QDM08","QDM08B"], name: "8号线" },
        { targets: ["QDM09"], name: "9号线" },
        { targets: ["QDM11"], name: "蓝谷快线" },
        { targets: ["QDM13"], name: "西海岸快线" },
        { targets: ["QDM15"], name: "15号线" }
    ] }
];

if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.QINGDAO_CITY) window.QINGDAO_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
