/**
 * CGo OpenMap - 合肥车站数据库
 * 坐标来自底图点选 hefei_picked_coords.json；未点选站按线路邻锚点线性插值。
 */

const stationsData = {
    "0101": {
        type: "dot",
        x: 1361,
        y: 960,
        cn: "张洼",
        en: "Zhangwa",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0102": {
        type: "dot",
        x: 1361,
        y: 1022,
        cn: "兴华苑",
        en: "Xinghuayuan",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0103": {
        type: "dot",
        x: 1362,
        y: 1085,
        cn: "瑶海公园",
        en: "Yaohai Gongyuan",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0104": {
        type: "tsf",
        x: 1362,
        y: 1147,
        cn: "合肥火车站",
        en: "Hefei Railway Station<br>(Hefei Railway Station)",
        align: "bottom-right",
        offset: { x: 6, y: 6 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0105": {
        type: "dot",
        x: 1362,
        y: 1230,
        cn: "长淮",
        en: "Changhuai",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0106": {
        type: "dot",
        x: 1361,
        y: 1280,
        cn: "明光路",
        en: "Mingguang Lu",
        align: "left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0107": {
        type: "tsf",
        x: 1361,
        y: 1347,
        cn: "大东门",
        en: "Dadongmen",
        align: "top-left",
        offset: { x: 1, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0108": {
        type: "dot",
        x: 1361,
        y: 1396,
        cn: "包公园",
        en: "Baogongyuan",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0109": {
        type: "dot",
        x: 1362,
        y: 1446,
        cn: "合工大南区",
        en: "Hegongda Nanqu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0110": {
        type: "tsf",
        x: 1362,
        y: 1495,
        cn: "朱岗",
        en: "Zhugang",
        align: "top-left",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0111": {
        type: "dot",
        x: 1362,
        y: 1545,
        cn: "秋浦河路",
        en: "Qiupuhe Lu",
        align: "left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0112": {
        type: "dot",
        x: 1362,
        y: 1595,
        cn: "葛大店",
        en: "Gedadian",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0113": {
        type: "dot",
        x: 1335,
        y: 1657,
        cn: "望湖城",
        en: "Wanghucheng",
        align: "bottom-right",
        offset: { x: 6, y: -14 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0114": {
        type: "tsf",
        x: 1291,
        y: 1692,
        cn: "合肥南站",
        en: "Hefei Nanzhan",
        align: "top",
        offset: { x: -3, y: -10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0115": {
        type: "dot",
        x: 1293,
        y: 1759,
        cn: "南站南广场",
        en: "Nanzhan Nanguangchang",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0116": {
        type: "dot",
        x: 1296,
        y: 1826,
        cn: "骆岗",
        en: "Luogang",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0117": {
        type: "dot",
        x: 1298,
        y: 1893,
        cn: "高王",
        en: "Gaowang",
        align: "left",
        offset: { x: -5, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0118": {
        type: "dot",
        x: 1338,
        y: 1974,
        cn: "滨湖会展中心",
        en: "Binhu Huizhan Zhongxin",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0119": {
        type: "tsf",
        x: 1338,
        y: 2047,
        cn: "紫庐",
        en: "Zilu",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0120": {
        type: "dot",
        x: 1338,
        y: 2111,
        cn: "塘西河公园",
        en: "Tangxihe Gongyuan",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0121": {
        type: "dot",
        x: 1338,
        y: 2174,
        cn: "金斗公园",
        en: "Jindou Gongyuan",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0122": {
        type: "tsf",
        x: 1338,
        y: 2238,
        cn: "云谷路",
        en: "Yungu Lu",
        align: "top-left",
        offset: { x: -1, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0123": {
        type: "dot",
        x: 1338,
        y: 2300,
        cn: "万达城",
        en: "Wandacheng",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0124": {
        type: "dot",
        x: 1338,
        y: 2363,
        cn: "万年埠",
        en: "Wannianbu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0125": {
        type: "dot",
        x: 1314,
        y: 2393,
        cn: "丙子铺",
        en: "Bingzipu",
        align: "bottom",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0126": {
        type: "dot",
        x: 1256,
        y: 2394,
        cn: "九联圩",
        en: "Jiulianwei",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0201": {
        type: "dot",
        x: 270,
        y: 1347,
        cn: "南岗",
        en: "Nangang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0202": {
        type: "dot",
        x: 346,
        y: 1347,
        cn: "桂庄",
        en: "Guizhuang",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0203": {
        type: "dot",
        x: 422,
        y: 1347,
        cn: "汽车西站",
        en: "Qiche Xizhan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0204": {
        type: "dot",
        x: 498,
        y: 1347,
        cn: "振兴路",
        en: "Zhenxing Lu",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0205": {
        type: "dot",
        x: 574,
        y: 1347,
        cn: "蜀山西",
        en: "Shushanxi",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0206": {
        type: "dot",
        x: 649,
        y: 1347,
        cn: "大蜀山",
        en: "Dashushan",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0207": {
        type: "dot",
        x: 725,
        y: 1347,
        cn: "天柱路",
        en: "Tianzhu Lu",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0208": {
        type: "dot",
        x: 801,
        y: 1347,
        cn: "科学大道",
        en: "Science Dadao",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0209": {
        type: "dot",
        x: 877,
        y: 1347,
        cn: "十里庙",
        en: "Shilimiao",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0210": {
        type: "tsf",
        x: 953,
        y: 1347,
        cn: "西七里塘",
        en: "Xiqilitang",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0211": {
        type: "tsf",
        x: 1010,
        y: 1349,
        cn: "五里墩",
        en: "Wulidun",
        align: "bottom",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0212": {
        type: "dot",
        x: 1062,
        y: 1348,
        cn: "三里庵",
        en: "Sanlian",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0213": {
        type: "dot",
        x: 1115,
        y: 1348,
        cn: "安农大",
        en: "Annongda",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0214": {
        type: "tsf",
        x: 1167,
        y: 1347,
        cn: "三孝口",
        en: "Sanxiaokou",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0215": {
        type: "dot",
        x: 1264,
        y: 1347,
        cn: "四牌楼",
        en: "Sipailou",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0217": {
        type: "dot",
        x: 1418,
        y: 1347,
        cn: "三里街",
        en: "Sanlijie",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0218": {
        type: "dot",
        x: 1475,
        y: 1348,
        cn: "东五里井",
        en: "Dongwulijing",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0219": {
        type: "tsf",
        x: 1532,
        y: 1348,
        cn: "东七里",
        en: "Dongqili",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0220": {
        type: "dot",
        x: 1601,
        y: 1348,
        cn: "漕冲",
        en: "Caochong",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0221": {
        type: "dot",
        x: 1670,
        y: 1348,
        cn: "东二十埠",
        en: "Dong'ershibu",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0222": {
        type: "dot",
        x: 1739,
        y: 1348,
        cn: "龙岗",
        en: "Longgang",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0223": {
        type: "dot",
        x: 1808,
        y: 1348,
        cn: "王岗",
        en: "Wanggang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0224": {
        type: "dot",
        x: 1878,
        y: 1348,
        cn: "三十埠",
        en: "Sanshibu",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0225": {
        type: "dot",
        x: 1950,
        y: 1347,
        cn: "三十埠东",
        en: "Sanshibudong",
        align: "bottom",
        offset: { x: 0, y: 5 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0226": {
        type: "dot",
        x: 2016,
        y: 1347,
        cn: "祥和",
        en: "Xianghe",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0227": {
        type: "dot",
        x: 2085,
        y: 1347,
        cn: "桂王",
        en: "Guiwang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0228": {
        type: "dot",
        x: 2154,
        y: 1347,
        cn: "对河",
        en: "Duihe",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0229": {
        type: "dot",
        x: 2223,
        y: 1347,
        cn: "店埠河",
        en: "Dianbuhe",
        align: "bottom",
        offset: { x: 0, y: 5 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0230": {
        type: "dot",
        x: 2283,
        y: 1397,
        cn: "排头",
        en: "Paitou",
        align: "top-right",
        offset: { x: 6, y: 19 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0231": {
        type: "rdot",
        x: 2283,
        y: 1456,
        cn: "肥东站",
        en: "Feidong Zhan<br>Feidong Railway Station",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0232": {
        type: "dot",
        x: 2282,
        y: 1515,
        cn: "和睦湖",
        en: "Hemu Lake",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0233": {
        type: "dot",
        x: 2282,
        y: 1574,
        cn: "马桥",
        en: "Maqiao",
        align: "left",
        offset: { x: -2, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0234": {
        type: "dot",
        x: 2281,
        y: 1633,
        cn: "南沙河",
        en: "Nanshahe",
        align: "right",
        offset: { x: 7, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0235": {
        type: "dot",
        x: 2281,
        y: 1692,
        cn: "撮镇",
        en: "Cuozhen",
        align: "left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0301": {
        type: "dot",
        x: 1920,
        y: 921,
        cn: "相城路",
        en: "Xiangcheng Lu",
        align: "top",
        offset: { x: 0, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0302": {
        type: "dot",
        x: 1825,
        y: 922,
        cn: "职教城东",
        en: "Zhijiaochengdong",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0303": {
        type: "dot",
        x: 1732,
        y: 921,
        cn: "职教城",
        en: "Zhijiaocheng",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0304": {
        type: "dot",
        x: 1675,
        y: 955,
        cn: "幼儿师范",
        en: "You'er Shifan",
        align: "top-left",
        offset: { x: -6, y: 12 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0305": {
        type: "dot",
        x: 1675,
        y: 1003,
        cn: "文浍苑",
        en: "Wenhuiyuan",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0306": {
        type: "dot",
        x: 1675,
        y: 1052,
        cn: "勤劳村",
        en: "Qinlaocun",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0307": {
        type: "dot",
        x: 1675,
        y: 1100,
        cn: "新海大道",
        en: "Xinhai Dadao",
        align: "bottom-right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0308": {
        type: "dot",
        x: 1617,
        y: 1147,
        cn: "窦桥湾",
        en: "Douqiaowan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0309": {
        type: "tsf",
        x: 1532,
        y: 1146,
        cn: "方庙",
        en: "Fangmiao",
        align: "bottom-right",
        offset: { x: -1, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0310": {
        type: "dot",
        x: 1447,
        y: 1146,
        cn: "竹丝滩",
        en: "Zhusitan",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0312": {
        type: "dot",
        x: 1314,
        y: 1147,
        cn: "鸭林冲",
        en: "Yalinchong",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0313": {
        type: "dot",
        x: 1265,
        y: 1146,
        cn: "淮南路",
        en: "Huainan Lu",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0314": {
        type: "tsf",
        x: 1217,
        y: 1146,
        cn: "一里井",
        en: "Yilijing",
        align: "bottom",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0315": {
        type: "tsf",
        x: 1166,
        y: 1147,
        cn: "海棠",
        en: "Haitang",
        align: "top-left",
        offset: { x: -6, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0316": {
        type: "dot",
        x: 1122,
        y: 1146,
        cn: "郑河",
        en: "Zhenghe",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0317": {
        type: "dot",
        x: 1078,
        y: 1145,
        cn: "四泉桥",
        en: "Siquanqiao",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0318": {
        type: "dot",
        x: 1029,
        y: 1177,
        cn: "杏花村",
        en: "Xinghuacun",
        align: "bottom-right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0319": {
        type: "tsf",
        x: 987,
        y: 1217,
        cn: "合肥西站",
        en: "Hefei Xizhan<br>Hefei West Railway Station",
        align: "top-left",
        offset: { x: -4, y: -8 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0320": {
        type: "dot",
        x: 953,
        y: 1277,
        cn: "南新庄",
        en: "Nanxinzhuang",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0322": {
        type: "dot",
        x: 952,
        y: 1422,
        cn: "国防科技大学",
        en: "Guofang Keji Daxue",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0323": {
        type: "tsf",
        x: 952,
        y: 1496,
        cn: "洪岗",
        en: "Honggang",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0324": {
        type: "dot",
        x: 953,
        y: 1550,
        cn: "市政务中心",
        en: "Shi Zhengwuzhongxin",
        align: "right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0325": {
        type: "dot",
        x: 889,
        y: 1607,
        cn: "合肥大剧院",
        en: "Hefei Dajuyuan",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0326": {
        type: "tsf",
        x: 840,
        y: 1692,
        cn: "图书馆",
        en: "Tushuguan",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0327": {
        type: "dot",
        x: 840,
        y: 1749,
        cn: "省博物馆",
        en: "Sheng Bowuguan",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0328": {
        type: "dot",
        x: 840,
        y: 1805,
        cn: "安医大二附院",
        en: "Anyida 2 Fuyuan",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0329": {
        type: "tsf",
        x: 840,
        y: 1862,
        cn: "繁华大道",
        en: "Fanhua Dadao",
        align: "top-right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0330": {
        type: "dot",
        x: 839,
        y: 1917,
        cn: "大学城北",
        en: "Daxuechengbei",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0331": {
        type: "dot",
        x: 806,
        y: 1974,
        cn: "工大翡翠湖校区",
        en: "Gongda Feicuihu Xiaoqu",
        align: "top-left",
        offset: { x: -4, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0332": {
        type: "dot",
        x: 768,
        y: 2012,
        cn: "安大磬苑校区",
        en: "Anda Qingyuan Xiaoqu",
        align: "bottom-right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0333": {
        type: "dot",
        x: 730,
        y: 2050,
        cn: "幸福坝",
        en: "Xingfuba",
        align: "left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0334": {
        type: "dot",
        x: 691,
        y: 2089,
        cn: "安医一附院南区",
        en: "Anyi 1 Fuyuan Nanqu",
        align: "right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0335": {
        type: "dot",
        x: 653,
        y: 2127,
        cn: "凉亭",
        en: "Liangting",
        align: "left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0336": {
        type: "dot",
        x: 620,
        y: 2170,
        cn: "李湾",
        en: "Liwan",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0337": {
        type: "dot",
        x: 634,
        y: 2223,
        cn: "四十埠",
        en: "Sishibu",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0338": {
        type: "dot",
        x: 678,
        y: 2267,
        cn: "芮祠",
        en: "Ruici",
        align: "right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0339": {
        type: "dot",
        x: 723,
        y: 2311,
        cn: "乐平",
        en: "Leping",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0340": {
        type: "dot",
        x: 722,
        y: 2365,
        cn: "省儿童医院新区",
        en: "Sheng Ertong Yiyuan Xinqu",
        align: "bottom-right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0341": {
        type: "no",
        x: 646,
        y: 2413,
        cn: "馆驿",
        en: "Guanyi",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0401": {
        type: "dot",
        x: 1532,
        y: 754,
        cn: "综保区",
        en: "Zongbaoqu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0402": {
        type: "dot",
        x: 1532,
        y: 820,
        cn: "安医一附院北区",
        en: "Anyi 1 Fuayuan Beiqu",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0403": {
        type: "dot",
        x: 1532,
        y: 911,
        cn: "陶冲湖东",
        en: "Taochonghudong",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0404": {
        type: "dot",
        x: 1532,
        y: 989,
        cn: "十里村",
        en: "Shilicun",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0405": {
        type: "dot",
        x: 1532,
        y: 1068,
        cn: "新海公园",
        en: "Xinhai Park",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0407": {
        type: "dot",
        x: 1532,
        y: 1247,
        cn: "站塘",
        en: "Zhantang",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0409": {
        type: "dot",
        x: 1532,
        y: 1398,
        cn: "唐桥",
        en: "Tangqiao",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0410": {
        type: "dot",
        x: 1510,
        y: 1445,
        cn: "五里庙",
        en: "Wulimiao",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0411": {
        type: "tsf",
        x: 1485,
        y: 1495,
        cn: "尧渡河路",
        en: "Yaoduhe Road",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0412": {
        type: "dot",
        x: 1485,
        y: 1597,
        cn: "工经学院",
        en: "Industrial Economics College",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0413": {
        type: "dot",
        x: 1445,
        y: 1692,
        cn: "葛大店南",
        en: "South Gedadian",
        align: "bottom-right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0414": {
        type: "dot",
        x: 1368,
        y: 1692,
        cn: "望湖城南",
        en: "South Wanghucheng",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0416": {
        type: "dot",
        x: 1235,
        y: 1692,
        cn: "淝南",
        en: "Feinan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0417": {
        type: "dot",
        x: 1178,
        y: 1692,
        cn: "竹西",
        en: "Zhuxi",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0418": {
        type: "dot",
        x: 1122,
        y: 1692,
        cn: "薛河",
        en: "Xuehe",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0419": {
        type: "dot",
        x: 1066,
        y: 1692,
        cn: "南屏路",
        en: "Nanping Lu",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0420": {
        type: "dot",
        x: 1009,
        y: 1692,
        cn: "姚公庙",
        en: "Yaogongmiao",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0421": {
        type: "dot",
        x: 953,
        y: 1692,
        cn: "天鹅湖东",
        en: "Tian'ehudong",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0422": {
        type: "dot",
        x: 896,
        y: 1692,
        cn: "天鹅湖",
        en: "Tian'ehu",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0424": {
        type: "dot",
        x: 763,
        y: 1690,
        cn: "柳树塘",
        en: "Liushutang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0425": {
        type: "dot",
        x: 715,
        y: 1648,
        cn: "金桂",
        en: "Jingui",
        align: "right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0426": {
        type: "dot",
        x: 670,
        y: 1607,
        cn: "玉兰大道",
        en: "Yulan Dadao",
        align: "bottom",
        offset: { x: -8, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0427": {
        type: "tsf",
        x: 563,
        y: 1601,
        cn: "北雁湖",
        en: "Beiyanhu",
        align: "bottom",
        offset: { x: 6, y: 7 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0428": {
        type: "dot",
        x: 483,
        y: 1666,
        cn: "复兴集",
        en: "Fuxingji",
        align: "left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0429": {
        type: "dot",
        x: 483,
        y: 1757,
        cn: "长安集",
        en: "Changanji",
        align: "right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0430": {
        type: "dot",
        x: 386,
        y: 1851,
        cn: "桃花潭",
        en: "Taohuatan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0431": {
        type: "dot",
        x: 270,
        y: 1850,
        cn: "金小郢",
        en: "Jinxiaoying",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0432": {
        type: "dot",
        x: 132,
        y: 1902,
        cn: "铜锣寨路",
        en: "Tongluozhai Lu",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0433": {
        type: "dot",
        x: 132,
        y: 1993,
        cn: "魏庄",
        en: "Weizhuang",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0434": {
        type: "dot",
        x: 212,
        y: 2055,
        cn: "烧脉岗",
        en: "Shaomaigang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0435": {
        type: "no",
        x: 318,
        y: 2053,
        cn: "紫云湖",
        en: "Ziyunhu",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0501": {
        type: "dot",
        x: 1167,
        y: 894,
        cn: "汲桥路",
        en: "Jiqiao Lu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0502": {
        type: "tsf",
        x: 1167,
        y: 960,
        cn: "六中菱湖校区",
        en: "Liuzhong Linghu Xiaoqu",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0503": {
        type: "dot",
        x: 1167,
        y: 1022,
        cn: "菱湖公园",
        en: "Linghu Gongyuan",
        align: "left",
        offset: { x: -2, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0504": {
        type: "dot",
        x: 1166,
        y: 1085,
        cn: "北五里井",
        en: "Beiwulijing",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0506": {
        type: "dot",
        x: 1166,
        y: 1214,
        cn: "白水坝",
        en: "Baishuiba",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0507": {
        type: "dot",
        x: 1167,
        y: 1280,
        cn: "杏花公园",
        en: "Xinghua Gongyuan",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0509": {
        type: "dot",
        x: 1167,
        y: 1396,
        cn: "稻香楼",
        en: "Daoxianglou",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0510": {
        type: "dot",
        x: 1166,
        y: 1446,
        cn: "中国科大东区",
        en: "Zhonguo Keda Dongqu",
        align: "left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0511": {
        type: "tsf",
        x: 1166,
        y: 1495,
        cn: "市第三医院",
        en: "Shi Di-3 Yiyuan",
        align: "top-right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0512": {
        type: "dot",
        x: 1166,
        y: 1548,
        cn: "休宁路",
        en: "Xiuninglu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0513": {
        type: "dot",
        x: 1167,
        y: 1600,
        cn: "凌大塘",
        en: "Lingdatang",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0514": {
        type: "dot",
        x: 1219,
        y: 1652,
        cn: "望湖城西",
        en: "West Wanghucheng",
        align: "bottom-left",
        offset: { x: -1, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0516": {
        type: "dot",
        x: 1348,
        y: 1755,
        cn: "盛大",
        en: "Shengda",
        align: "bottom-left",
        offset: { x: 20, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0517": {
        type: "dot",
        x: 1420,
        y: 1754,
        cn: "包河苑",
        en: "Baoheyuan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0518": {
        type: "dot",
        x: 1491,
        y: 1753,
        cn: "义兴",
        en: "Yixing",
        align: "bottom",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0519": {
        type: "dot",
        x: 1545,
        y: 1811,
        cn: "大连路",
        en: "Dalian Lu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0520": {
        type: "dot",
        x: 1545,
        y: 1870,
        cn: "花园大道",
        en: "Huayuan Dadao",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0521": {
        type: "dot",
        x: 1545,
        y: 1929,
        cn: "黄河路",
        en: "Huanghe Lu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0522": {
        type: "dot",
        x: 1545,
        y: 1988,
        cn: "扬子江路",
        en: "Yangzijiang Lu",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0523": {
        type: "tsf",
        x: 1545,
        y: 2047,
        cn: "义城",
        en: "Yicheng",
        align: "bottom-right",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0524": {
        type: "dot",
        x: 1546,
        y: 2112,
        cn: "省行政中心东",
        en: "Sheng Xingzheng Zhongxindong",
        align: "right",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0525": {
        type: "dot",
        x: 1546,
        y: 2177,
        cn: "方兴湖",
        en: "Fangxinghu",
        align: "left",
        offset: { x: -5, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0526": {
        type: "dot",
        x: 1502,
        y: 2239,
        cn: "渡江纪念馆",
        en: "Dujiang Jinianguan",
        align: "bottom-right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0527": {
        type: "dot",
        x: 1445,
        y: 2237,
        cn: "沈湾",
        en: "Shenwan",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0528": {
        type: "dot",
        x: 1393,
        y: 2238,
        cn: "华山路",
        en: "Huashan Lu",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0530": {
        type: "dot",
        x: 1264,
        y: 2238,
        cn: "清水冲",
        en: "Qingshuichong",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0531": {
        type: "dot",
        x: 1191,
        y: 2237,
        cn: "云川公园",
        en: "Yunchuan Gongyuan",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0532": {
        type: "dot",
        x: 1155,
        y: 2300,
        cn: "滨湖竹园",
        en: "Binhu Zhuyuan",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0533": {
        type: "dot",
        x: 1155,
        y: 2359,
        cn: "贵阳路",
        en: "Guiyang Lu",
        align: "left",
        offset: { x: -5, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0601": {
        type: "dot",
        x: 88,
        y: 1494,
        cn: "青龙岗",
        en: "Qinglonggang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0602": {
        type: "dot",
        x: 179,
        y: 1495,
        cn: "合肥七中",
        en: "Hefei Qizhong",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0603": {
        type: "dot",
        x: 270,
        y: 1495,
        cn: "量子科学中心",
        en: "Liangzi Kexue Zhongxin",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 0.9 }
    },
    "0604": {
        type: "dot",
        x: 362,
        y: 1496,
        cn: "科大先研院",
        en: "Keda Xianyanyuan",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 0.85 }
    },
    "0606": {
        type: "dot",
        x: 718,
        y: 1495,
        cn: "开福寺",
        en: "Kaifusi",
        align: "bottom-right",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0607": {
        type: "dot",
        x: 796,
        y: 1495,
        cn: "梦城",
        en: "Mengcheng",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0608": {
        type: "dot",
        x: 874,
        y: 1496,
        cn: "松荫桥",
        en: "Songyinqiao",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0610": {
        type: "dot",
        x: 1019,
        y: 1495,
        cn: "陆军兵种大学",
        en: "Lujun Bingzhong Daxue",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0611": {
        type: "dot",
        x: 1095,
        y: 1495,
        cn: "南七里",
        en: "Nanqili",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0613": {
        type: "dot",
        x: 1264,
        y: 1495,
        cn: "卫岗",
        en: "Weigang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0616": {
        type: "dot",
        x: 1551,
        y: 1495,
        cn: "唐大楼",
        en: "Tangdalou",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0617": {
        type: "dot",
        x: 1617,
        y: 1495,
        cn: "市儿童医院",
        en: "Shi Ertong Yiyuan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0618": {
        type: "no",
        x: 1683,
        y: 1495,
        cn: "市博物馆",
        en: "Shi Bowuguan",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0619": {
        type: "dot",
        x: 1750,
        y: 1495,
        cn: "钢红",
        en: "Ganghong",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0620": {
        type: "dot",
        x: 1816,
        y: 1495,
        cn: "大兴集",
        en: "Daxingji",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0621": {
        type: "dot",
        x: 1882,
        y: 1495,
        cn: "伏龙",
        en: "Fulong",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0622": {
        type: "dot",
        x: 1948,
        y: 1495,
        cn: "龙塘",
        en: "Longtang",
        align: "top",
        offset: { x: 0, y: -5 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0701": {
        type: "dot",
        x: 727,
        y: 1862,
        cn: "翡翠公园",
        en: "Feicui Gongyuan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0703": {
        type: "dot",
        x: 900,
        y: 1862,
        cn: "徽园",
        en: "Huiyuan",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0704": {
        type: "dot",
        x: 959,
        y: 1861,
        cn: "明珠广场",
        en: "Mingzhu Guangchang",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0705": {
        type: "dot",
        x: 1019,
        y: 1861,
        cn: "天都路",
        en: "Tiandu Lu",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0706": {
        type: "dot",
        x: 1061,
        y: 1890,
        cn: "南艳湖北",
        en: "Nanyanhubei",
        align: "right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0707": {
        type: "dot",
        x: 1060,
        y: 1939,
        cn: "一六八中学",
        en: "Yiliuba Zhongxue",
        align: "left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0708": {
        type: "dot",
        x: 1104,
        y: 1966,
        cn: "合肥大学",
        en: "Hefei Daxue",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0709": {
        type: "dot",
        x: 1177,
        y: 1966,
        cn: "南艳湖南",
        en: "Nanyanhunan",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0710": {
        type: "dot",
        x: 1232,
        y: 2004,
        cn: "要素大市场",
        en: "Yaosu Dashichang",
        align: "left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0711": {
        type: "dot",
        x: 1275,
        y: 2046,
        cn: "滨湖医院",
        en: "Binhu Yiyuan",
        align: "bottom",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0713": {
        type: "dot",
        x: 1407,
        y: 2047,
        cn: "嵩山路",
        en: "Songshan Lu",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0714": {
        type: "dot",
        x: 1476,
        y: 2047,
        cn: "省文化和非遗馆",
        en: "Sheng Wenhuahefeiyiguan",
        align: "bottom",
        offset: { x: -4, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0716": {
        type: "no",
        x: 1640,
        y: 2047,
        cn: "合肥四中",
        en: "Hefei No.4 High School",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0801": {
        type: "dot",
        x: 1163,
        y: 538,
        cn: "北城高铁站",
        en: "Beicheng Gaotiezhan<br>(Beicheng High-speed Railway Station)",
        align: "right",
        offset: { x: 28, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0802": {
        type: "dot",
        x: 1113,
        y: 583,
        cn: "省立医院北区",
        en: "Shengliyiyuan Beiqu",
        align: "top-left",
        offset: { x: -6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0803": {
        type: "dot",
        x: 1113,
        y: 639,
        cn: "双墩",
        en: "Shuangdun",
        align: "right",
        offset: { x: 11, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0804": {
        type: "dot",
        x: 1114,
        y: 695,
        cn: "北城世纪城",
        en: "Beicheng Shijicheng",
        align: "left",
        offset: { x: -8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0805": {
        type: "dot",
        x: 1114,
        y: 752,
        cn: "梅冲湖",
        en: "Meichonghu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0806": {
        type: "dot",
        x: 1114,
        y: 808,
        cn: "金梅路",
        en: "Jinmei Lu",
        align: "left",
        offset: { x: -5, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0807": {
        type: "dot",
        x: 1115,
        y: 864,
        cn: "双凤",
        en: "Shuangfeng",
        align: "left",
        offset: { x: -7, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0808": {
        type: "dot",
        x: 1115,
        y: 920,
        cn: "荷塘路",
        en: "Hetang Lu",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0810": {
        type: "dot",
        x: 1215,
        y: 1000,
        cn: "庐阳经开区",
        en: "Luyang Jingkaiqu",
        align: "right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0811": {
        type: "dot",
        x: 1216,
        y: 1073,
        cn: "杏林",
        en: "Xinglin",
        align: "right",
        offset: { x: 2, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S101": {
        type: "no",
        x: 117,
        y: 722,
        cn: "寿县炎刘",
        en: "Yanliu, Shouxian",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S102": {
        type: "no",
        x: 200,
        y: 721,
        cn: "寿县经开区",
        en: "Shouxian Jingkaiqu",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S103": {
        type: "no",
        x: 296,
        y: 764,
        cn: "新桥1号航站楼",
        en: "Xinqiao T1",
        align: "top-right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S104": {
        type: "no",
        x: 347,
        y: 817,
        cn: "新桥2号航站楼",
        en: "Xinqiao T2",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S105": {
        type: "no",
        x: 445,
        y: 847,
        cn: "迎宾大道",
        en: "Yingbin Dadao",
        align: "bottom",
        offset: { x: 6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S106": {
        type: "no",
        x: 537,
        y: 850,
        cn: "未来湖",
        en: "Weilai Lake",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S107": {
        type: "no",
        x: 634,
        y: 849,
        cn: "长兴湖",
        en: "Changxing Lake",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S108": {
        type: "no",
        x: 732,
        y: 847,
        cn: "未来大科学城",
        en: "Weilai Dakexuecheng",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S109": {
        type: "no",
        x: 804,
        y: 917,
        cn: "岗集",
        en: "Gangji",
        align: "right",
        offset: { x: 6, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S110": {
        type: "no",
        x: 804,
        y: 990,
        cn: "大杨",
        en: "Dayang",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S111": {
        type: "no",
        x: 805,
        y: 1064,
        cn: "庐州公园",
        en: "Luzhou Gongyuan",
        align: "bottom-left",
        offset: { x: -6, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "S113": {
        type: "no",
        x: 1008,
        y: 1279,
        cn: "省中医院西区",
        en: "Sheng Zhongyiyuan Xiqu",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    }
};
