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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = legendData;
}
