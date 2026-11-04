/**
 * CGo OpenMap - 北京规划 图例分类配置 (city/beijing_plan/data_legend.js)
 */

const legendData = {
    "groups": [
        {
            "title": "城市轨道交通线网",
            "lineIds": [
                "M1",
                "M2",
                "M3",
                "M4",
                "M5",
                "M6",
                "M7",
                "M9",
                "M8",
                "M10",
                "M11",
                "M12",
                "M13",
                "M14",
                "M15",
                "M16",
                "M17",
                "M19",
                "M1B",
                "M18",
                "M22",
                "M101",
                "M13_EXP",
                "M28",
                "M101_NORTH",
                "M102",
                "M103",
                "M104",
                "M28_NORTH"
            ]
        },
        {
            "title": "延伸段与规划新建线",
            "lineIds": [
                "XAE",
                "M3_EAST",
                "M7_P3",
                "M11_P2W",
                "M12_SOUTH",
                "M15_P2",
                "M19_P2N",
                "M19_P2S",
                "R4_P1",
                "M17_BR",
                "M3_WEST",
                "CP_SOUTH",
                "YF_BRANCH",
                "M11_P2E",
                "LIJIN",
                "M19_P2SB",
                "M8_SOUTH",
                "M9_SOUTH",
                "M11_EAST",
                "M12_EAST",
                "M15_WEST",
                "M6_SOUTH",
                "M101_EAST",
                "R1"
            ]
        },
        {
            "title": "郊区快线与有轨电车",
            "lineIds": [
                "YZ",
                "FS",
                "YF",
                "S1",
                "CP",
                "CAE",
                "DAE",
                "XJ",
                "YZ_T1"
            ]
        },
        {
            "title": "市郊铁路网",
            "lineIds": [
                "S_FZX",
                "S_S2",
                "S_HRMY",
                "S_TM",
                "S_DBH",
                "S_XCLK",
                "S_XCLK_FZX"
            ]
        },
        {
            "title": "综合客运高速铁路干线",
            "lineIds": [
                "CR_JINGHA",
                "CR_JINGXIONG",
                "CR_GUAN",
                "CR_JINGTANG",
                "CR_JINGGUANG_HSR",
                "CR_JINGZHANG",
                "CR_JINGGUANG",
                "CR_JINGHU",
                "CR_JINGJIN"
            ]
        }
    ]
};

const LEGEND_CONFIG = [
    { type: 'title', title: '城市轨道交通线网', subtitle: 'Urban Rail Transit', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ["M1"] }, { targets: ["M2"] }, { targets: ["M3"] }, { targets: ["M4"] },
        { targets: ["M5"] }, { targets: ["M6"] }, { targets: ["M7"] }, { targets: ["M9"] },
        { targets: ["M8"] }, { targets: ["M10"] }, { targets: ["M11"] }, { targets: ["M12"] },
        { targets: ["M13"] }, { targets: ["M14"] }, { targets: ["M15"] }, { targets: ["M16"] },
        { targets: ["M17"] }, { targets: ["M19"] }, { targets: ["M1B"] }, { targets: ["M18"] },
        { targets: ["M22"] }, { targets: ["M101"] }, { targets: ["M13_EXP"] }, { targets: ["M28"] },
        { targets: ["M101_NORTH"] }, { targets: ["M102"] }, { targets: ["M103"] }, { targets: ["M104"] },
        { targets: ["M28_NORTH"] }
    ] },
    { type: 'title', title: '延伸段与规划新建线', subtitle: 'Extensions & Planned Lines', marginTop: 14 },
    { type: 'grid', cols: 2, items: [
        { targets: ["XAE"] }, { targets: ["M3_EAST"] }, { targets: ["M7_P3"] }, { targets: ["M11_P2W"] },
        { targets: ["M12_SOUTH"] }, { targets: ["M15_P2"] }, { targets: ["M19_P2N"] }, { targets: ["M19_P2S"] },
        { targets: ["R4_P1"] }, { targets: ["M17_BR"] }, { targets: ["M3_WEST"] }, { targets: ["CP_SOUTH"] },
        { targets: ["YF_BRANCH"] }, { targets: ["M11_P2E"] }, { targets: ["LIJIN"] }, { targets: ["M19_P2SB"] },
        { targets: ["M8_SOUTH"] }, { targets: ["M9_SOUTH"] }, { targets: ["M11_EAST"] }, { targets: ["M12_EAST"] },
        { targets: ["M15_WEST"] }, { targets: ["M6_SOUTH"] }, { targets: ["M101_EAST"] }, { targets: ["R1"] }
    ] },
    { type: 'title', title: '郊区快线与有轨电车', subtitle: 'Suburban Express & Tram', marginTop: 14 },
    { type: 'grid', cols: 2, items: [
        { targets: ["YZ"] }, { targets: ["FS"] }, { targets: ["YF"] }, { targets: ["S1"] },
        { targets: ["CP"] }, { targets: ["CAE"] }, { targets: ["DAE"] }, { targets: ["XJ"] },
        { targets: ["YZ_T1"] }
    ] },
    { type: 'title', title: '市郊铁路网', subtitle: 'Suburban Railway', marginTop: 14 },
    { type: 'grid', cols: 2, items: [
        { targets: ["S_FZX"] }, { targets: ["S_S2"] }, { targets: ["S_HRMY"] }, { targets: ["S_TM"] },
        { targets: ["S_DBH"] }, { targets: ["S_XCLK"] }, { targets: ["S_XCLK_FZX"] }
    ] },
    { type: 'title', title: '综合客运高速铁路干线', subtitle: 'High-Speed Railway', marginTop: 14 },
    { type: 'grid', cols: 2, items: [
        { targets: ["CR_JINGHA"] }, { targets: ["CR_JINGXIONG"] }, { targets: ["CR_GUAN"] },
        { targets: ["CR_JINGTANG"] }, { targets: ["CR_JINGGUANG_HSR"] }, { targets: ["CR_JINGZHANG"] },
        { targets: ["CR_JINGGUANG"] }, { targets: ["CR_JINGHU"] }, { targets: ["CR_JINGJIN"] }
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { legendData, LEGEND_CONFIG };
}
