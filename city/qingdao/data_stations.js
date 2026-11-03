/**
 * CGo OpenMap - 青岛轨道交通车站数据
 * 数据源：用户表格(8)。坐标 ×5；为左右留白，全部 X 额外 +250。
 * S/X/Z/Y = 上/下/左/右；换乘属性仅按 H。
 * 普通站名使用 \n 作为地图/信息卡共同换行；毕家上流、李家上流额外保留 <br> 作为信息卡专用换行。英文词间空格统一使用 NBSP（U+00A0）。
 */
const stationsData = {
    "M0112": {
        type: "tsf",
        x: 1557,
        y: 648,
        cn: "兴国路",
        en: "Xingguo Rd",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0113": {
        type: "dot",
        x: 1503,
        y: 684,
        cn: "永年路",
        en: "Yongnian Rd",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0114": {
        type: "dot",
        x: 1467,
        y: 711,
        cn: "沧安路",
        en: "Cang’an Rd",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0116": {
        type: "dot",
        x: 1467,
        y: 810,
        cn: "安顺路",
        en: "Anshun Rd",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0117": {
        type: "tsf",
        x: 1467,
        y: 864,
        cn: "胜利桥(纺织谷)",
        en: "Shengli Bridge (Textile Valley)",
        align: "top-left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0118": {
        type: "dot",
        x: 1431,
        y: 918,
        cn: "中心医院",
        en: "Qingdao Central Hospital",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0119": {
        type: "dot",
        x: 1395,
        y: 954,
        cn: "水清沟",
        en: "Shuiqinggou",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0120": {
        type: "dot",
        x: 1377,
        y: 1026,
        cn: "北岭",
        en: "Beiling",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0121": {
        type: "dot",
        x: 1377,
        y: 1080,
        cn: "小村庄",
        en: "Xiaocunzhuang",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0122": {
        type: "tsf",
        x: 1377,
        y: 1152,
        cn: "海泊桥(海慈医疗)",
        en: "Haipo Bridge (Hiser Hospital)",
        align: "top-left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0124": {
        type: "dot",
        x: 1269,
        y: 1242,
        cn: "广饶路",
        en: "Guangrao Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0125": {
        type: "tsf",
        x: 1197,
        y: 1242,
        cn: "观象山(市立医院)",
        en: "Guanxiangshan\n<br> (Qingdao Municipal Hospital)",
        align: "top-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0126": {
        type: "dot",
        x: 1143,
        y: 1278,
        cn: "中山路",
        en: "Zhongshan Rd",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0128": {
        type: "dot",
        x: 1125,
        y: 1377,
        cn: "西镇",
        en: "Xizhen",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0129": {
        type: "dot",
        x: 1125,
        y: 1404,
        cn: "团岛",
        en: "Tuandao",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0130": {
        type: "dot",
        x: 1125,
        y: 1494,
        cn: "凤凰岛",
        en: "Fenghuangdao",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0131": {
        type: "dot",
        x: 1125,
        y: 1521,
        cn: "山里",
        en: "Shanli",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0132": {
        type: "dot",
        x: 1125,
        y: 1548,
        cn: "南北屯",
        en: "Nanbeitun",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0133": {
        type: "dot",
        x: 1125,
        y: 1575,
        cn: "新港山路",
        en: "Xingangshan Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0134": {
        type: "dot",
        x: 1125,
        y: 1602,
        cn: "安子",
        en: "Anzi",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0135": {
        type: "dot",
        x: 1107,
        y: 1620,
        cn: "天目山路",
        en: "Tianmushan Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0136": {
        type: "dot",
        x: 1071,
        y: 1620,
        cn: "薛家岛",
        en: "Xuejiadao",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0137": {
        type: "dot",
        x: 1026,
        y: 1620,
        cn: "丁家河",
        en: "Dingjiahe",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0139": {
        type: "dot",
        x: 945,
        y: 1620,
        cn: "太行山路",
        en: "Taihangshan Rd",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0140": {
        type: "dot",
        x: 909,
        y: 1620,
        cn: "石油大学",
        en: "China University\n<br>of Petroleum",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0141": {
        type: "tsf",
        x: 873,
        y: 1615.5,
        cn: "王家港",
        en: "Wangjiagang",
        align: "top",
        offset: { x: 0, y: -6 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0202": {
        type: "no",
        x: 1962,
        y: 720,
        cn: "毕家上流<br>(世博园南门)",
        en: "Bijiashangliu (International<br>Horticultural \nExposition<br>Park South Gate)",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0203": {
        type: "no",
        x: 1917,
        y: 720,
        cn: "南王家上流",
        en: "Nanwangjiashangliu",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0204": {
        type: "no",
        x: 1872,
        y: 720,
        cn: "李家上流<br>(八医东院区)",
        en: "Lijiashangliu (East<br>Campus of \nQingdao<br>Eighth People’s Hospital)",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0205": {
        type: "no",
        x: 1827,
        y: 720,
        cn: "上臧",
        en: "Shangzang",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0206": {
        type: "no",
        x: 1782,
        y: 720,
        cn: "长涧",
        en: "Changjian",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0207": {
        type: "no",
        x: 1737,
        y: 720,
        cn: "佛耳崖",
        en: "Fo’erya",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0208": {
        type: "no",
        x: 1692,
        y: 715.5,
        cn: "下王埠(外贸学院)",
        en: "Xiawangbu (Shandong Foreign\n<br>Trade Vocational College)",
        align: "bottom",
        offset: { x: 0, y: 6 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0209": {
        type: "dot",
        x: 1665,
        y: 765,
        cn: "李村公园",
        en: "Licun Park",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0211": {
        type: "dot",
        x: 1719,
        y: 810,
        cn: "枣山路",
        en: "Zaoshan Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0212": {
        type: "dot",
        x: 1755,
        y: 864,
        cn: "华楼山路",
        en: "Hualoushan Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0213": {
        type: "dot",
        x: 1755,
        y: 936,
        cn: "东韩",
        en: "Donghan",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0214": {
        type: "tsf",
        x: 1782,
        y: 999,
        cn: "辽阳东路",
        en: "Liaoyang East Rd",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0215": {
        type: "dot",
        x: 1827,
        y: 1044,
        cn: "同安路",
        en: "Tong’an Rd",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0216": {
        type: "tsf",
        x: 1872,
        y: 1089,
        cn: "苗岭路",
        en: "Miaoling Rd",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0217": {
        type: "tsf",
        x: 1854,
        y: 1161,
        cn: "石老人浴场",
        en: "Shilaoren Beach",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0218": {
        type: "dot",
        x: 1818,
        y: 1197,
        cn: "海安路",
        en: "Hai’an Rd",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0219": {
        type: "dot",
        x: 1773,
        y: 1242,
        cn: "海川路",
        en: "Haichuan Rd",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0220": {
        type: "dot",
        x: 1728,
        y: 1287,
        cn: "海游路",
        en: "Haiyou Rd",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0221": {
        type: "tsf",
        x: 1681.65,
        y: 1330.65,
        cn: "麦岛",
        en: "Maidao",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0222": {
        type: "dot",
        x: 1629,
        y: 1332,
        cn: "高雄路",
        en: "Gaoxiong Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0223": {
        type: "dot",
        x: 1566,
        y: 1332,
        cn: "青岛中央法务区<br>\n(燕儿岛路)",
        en: "Qingdao Central Legal-<br>\nServices District (Yan’erdao Rd)",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0224": {
        type: "dot",
        x: 1503,
        y: 1332,
        cn: "浮山所",
        en: "Fushansuo",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0226": {
        type: "dot",
        x: 1377,
        y: 1300.5,
        cn: "芝泉路",
        en: "Zhiquan Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0227": {
        type: "dot",
        x: 1377,
        y: 1269,
        cn: "海信桥",
        en: "Haixin Bridge",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0228": {
        type: "tsf",
        x: 1336.5,
        y: 1210.5,
        cn: "台东",
        en: "Taidong",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0229": {
        type: "dot",
        x: 1251,
        y: 1179,
        cn: "利津路",
        en: "Lijin Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0230": {
        type: "tsf",
        x: 1197,
        y: 1179,
        cn: "泰山路",
        en: "Taishan Rd",
        align: "top-left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0231": {
        type: "dot",
        x: 1152,
        y: 1197,
        cn: "国际邮轮港",
        en: "Qingdao International Cruise Terminal",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0232": {
        type: "dot",
        x: 1125,
        y: 1224,
        cn: "小港",
        en: "Xiaogang",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0233": {
        type: "dot",
        x: 1098,
        y: 1251,
        cn: "四川路(轮渡)",
        en: "Sichuan Rd (Qingdao Ferry Terminal)",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0301": {
        type: "tsf",
        x: 1467,
        y: 760.5,
        cn: "青岛北站",
        en: "Qingdao North Railway Station",
        align: "top-left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0302": {
        type: "dot",
        x: 1512,
        y: 756,
        cn: "永平路",
        en: "Yongping Rd",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0303": {
        type: "tsf",
        x: 1557,
        y: 756,
        cn: "振华路",
        en: "Zhenhua Rd",
        align: "top-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0304": {
        type: "dot",
        x: 1620,
        y: 765,
        cn: "君峰路",
        en: "Junfeng Rd",
        align: "bottom-left",
        offset: { x: 2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0305": {
        type: "tsf",
        x: 1662.75,
        y: 805.5,
        cn: "李村",
        en: "Licun",
        align: "top-right",
        offset: { x: 2, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0306": {
        type: "dot",
        x: 1665,
        y: 855,
        cn: "万年泉路",
        en: "Wannianquan Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0307": {
        type: "dot",
        x: 1663.88,
        y: 895.5,
        cn: "海尔路",
        en: "Hai’er Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0308": {
        type: "tsf",
        x: 1629,
        y: 936,
        cn: "地铁大厦",
        en: "Metro Building",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0309": {
        type: "dot",
        x: 1584,
        y: 981,
        cn: "长沙路",
        en: "Changsha Rd",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0310": {
        type: "dot",
        x: 1539,
        y: 1026,
        cn: "双山",
        en: "Shuangshan",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0311": {
        type: "dot",
        x: 1521,
        y: 1089,
        cn: "清江路",
        en: "Qingjiang Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0312": {
        type: "tsf",
        x: 1521,
        y: 1152,
        cn: "错埠岭",
        en: "Cuobuling",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0313": {
        type: "dot",
        x: 1521,
        y: 1197,
        cn: "敦化路",
        en: "Dunhua Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0314": {
        type: "tsf",
        x: 1521,
        y: 1242,
        cn: "宁夏路",
        en: "Ningxia Rd",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0315": {
        type: "dot",
        x: 1521,
        y: 1296,
        cn: "江西路",
        en: "Jiangxi Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0316": {
        type: "tsf",
        x: 1449,
        y: 1327.5,
        cn: "五四广场",
        en: "May 4<sup>th</sup> Square",
        align: "bottom",
        offset: { x: 0, y: 6 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0317": {
        type: "dot",
        x: 1377,
        y: 1341,
        cn: "延安三路",
        en: "Yan’an 3<sup>rd</sup> Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0318": {
        type: "dot",
        x: 1332,
        y: 1341,
        cn: "太平角公园",
        en: "Taipingjiao Park",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0319": {
        type: "dot",
        x: 1287,
        y: 1341,
        cn: "中山公园",
        en: "Zhongshan Park",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0320": {
        type: "dot",
        x: 1242,
        y: 1341,
        cn: "汇泉广场",
        en: "Huiquan Square",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0321": {
        type: "tsf",
        x: 1197,
        y: 1341,
        cn: "人民会堂",
        en: "Hall of the People",
        align: "bottom",
        offset: { x: 0, y: 3 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0322": {
        type: "tsf",
        x: 1125,
        y: 1341,
        cn: "青岛站",
        en: "Qingdao Railway Station",
        align: "left",
        offset: { x: -6, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0401": {
        type: "dot",
        x: 2205,
        y: 1062,
        cn: "大河东",
        en: "Dahedong",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0402": {
        type: "dot",
        x: 2151,
        y: 1062,
        cn: "登瀛",
        en: "Dengying",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0403": {
        type: "dot",
        x: 2115,
        y: 1044,
        cn: "段家埠",
        en: "Duanjiabu",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0404": {
        type: "dot",
        x: 2088,
        y: 1017,
        cn: "沙子口",
        en: "Shazikou",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0405": {
        type: "dot",
        x: 2061,
        y: 990,
        cn: "小崂山",
        en: "Xiaolaoshan",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0406": {
        type: "dot",
        x: 2034,
        y: 963,
        cn: "南宅科",
        en: "Nanzhaike",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0407": {
        type: "dot",
        x: 2007,
        y: 936,
        cn: "彭家庄",
        en: "Pengjiazhuang",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0409": {
        type: "dot",
        x: 1899,
        y: 918,
        cn: "雄安路",
        en: "Xiong’an Rd",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0410": {
        type: "dot",
        x: 1836,
        y: 945,
        cn: "董家下庄",
        en: "Dongjiaxiazhuang",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0412": {
        type: "tsf",
        x: 1737,
        y: 1044,
        cn: "大埠东",
        en: "Dabudong",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0413": {
        type: "dot",
        x: 1701,
        y: 1080,
        cn: "埠西",
        en: "Buxi",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0414": {
        type: "dot",
        x: 1669.5,
        y: 1111.5,
        cn: "劲松三路",
        en: "Jingsong 3<sup>rd</sup> Rd",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0415": {
        type: "dot",
        x: 1638,
        y: 1143,
        cn: "洪山坡(妇儿医院)",
        en: "Hongshanpo (Qingdao Women\n<br>and Children’s Hospital)",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0416": {
        type: "dot",
        x: 1575,
        y: 1152,
        cn: "福辽立交桥",
        en: "Fuliao Flyover",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0418": {
        type: "tsf",
        x: 1449,
        y: 1152,
        cn: "西吴家村",
        en: "Xiwujiacun",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0420": {
        type: "dot",
        x: 1323,
        y: 1152,
        cn: "海泊河公园",
        en: "Haipohe Park",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0421": {
        type: "tsf",
        x: 1269,
        y: 1152,
        cn: "昌乐路",
        en: "Changle Rd",
        align: "top-left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0424": {
        type: "dot",
        x: 1197,
        y: 1291.5,
        cn: "信号山(青大附院)",
        en: "Xinhaoshan (The Affliated\n<br>Hospital of Qingdao University)",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0502": {
        type: "no",
        x: 1629,
        y: 1278,
        cn: "北山公园",
        en: "BEISHANGONGYUAN",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0503": {
        type: "no",
        x: 1575,
        y: 1242,
        cn: "福宁立交",
        en: "FUNINGLIJIAO",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0506": {
        type: "no",
        x: 1404,
        y: 1242,
        cn: "镇江路",
        en: "ZHENJIANGLU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0507": {
        type: "no",
        x: 1341,
        y: 1242,
        cn: "延安二路",
        en: "YAN’AN’ERLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0509": {
        type: "no",
        x: 1269,
        y: 1107,
        cn: "八号码头",
        en: "BAHAOMATOU",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0510": {
        type: "no",
        x: 1269,
        y: 1071,
        cn: "四方厂",
        en: "SIFANGCHANG",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0511": {
        type: "no",
        x: 1269,
        y: 1035,
        cn: "海云庵",
        en: "HAIYUN’AN",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0512": {
        type: "no",
        x: 1269,
        y: 990,
        cn: "湖岛",
        en: "HUDAO",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0513": {
        type: "no",
        x: 1287,
        y: 954,
        cn: "瑞昌路",
        en: "RUICHANGLU",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0514": {
        type: "no",
        x: 1323,
        y: 918,
        cn: "欢乐滨海城",
        en: "HUANLEBINHAICHENG",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0515": {
        type: "no",
        x: 1359,
        y: 882,
        cn: "环湾大道",
        en: "HUANWANDADAO",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0516": {
        type: "no",
        x: 1413,
        y: 864,
        cn: "镇平路",
        en: "ZHENPINGLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0519": {
        type: "no",
        x: 1593,
        y: 900,
        cn: "重庆路",
        en: "CHONGQINGLU",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0521": {
        type: "no",
        x: 1665,
        y: 972,
        cn: "滁州路",
        en: "CHUZHOULU",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0522": {
        type: "no",
        x: 1701,
        y: 1008,
        cn: "合肥路",
        en: "HEFEILU",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0524": {
        type: "no",
        x: 1777.5,
        y: 1084.5,
        cn: "国信体育馆",
        en: "GUOXINTIYUGUAN",
        align: "bottom-left",
        offset: { x: 2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0525": {
        type: "no",
        x: 1818,
        y: 1125,
        cn: "青医东院",
        en: "QINGYIDONGYUAN",
        align: "bottom-left",
        offset: { x: 2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0527": {
        type: "no",
        x: 1917,
        y: 1188,
        cn: "云岭路",
        en: "YUNLINGLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0528": {
        type: "no",
        x: 1989,
        y: 1188,
        cn: "石老人",
        en: "SHILAOREN",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0601": {
        type: "dot",
        x: 729,
        y: 1179,
        cn: "横云山路",
        en: "Hengyunshan Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0602": {
        type: "dot",
        x: 783,
        y: 1179,
        cn: "山王河(福莱社区)",
        en: "Shanwanghe (Fulai Community)",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0603": {
        type: "dot",
        x: 825,
        y: 1203,
        cn: "河洛埠(中德生态园)",
        en: "Heluobu (Sino-German Ecopark)",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0604": {
        type: "dot",
        x: 855,
        y: 1233,
        cn: "青岛九中(幸福小镇)",
        en: "Qingdao\xa0No.\xa09\xa0High\xa0School\n<br>(Xingfuxiaozhen)",
        align: "bottom-left",
        offset: { x: 2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0605": {
        type: "dot",
        x: 885,
        y: 1263,
        cn: "抓马山",
        en: "Zhuamashan",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0606": {
        type: "dot",
        x: 909,
        y: 1305,
        cn: "马家楼",
        en: "Majialou",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0607": {
        type: "dot",
        x: 909,
        y: 1350,
        cn: "薛家泊子",
        en: "Xuejiapozi",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0608": {
        type: "dot",
        x: 909,
        y: 1395,
        cn: "港头",
        en: "Gangtou",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0609": {
        type: "dot",
        x: 909,
        y: 1440,
        cn: "青大附院西海岸院区",
        en: "West Coast Campus of the Affliated\n<br>Hospital of Qingdao University",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0610": {
        type: "dot",
        x: 909,
        y: 1485,
        cn: "扒山(滨海学院)",
        en: "Pashan (Qingdao Binhai University)",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0611": {
        type: "dot",
        x: 909,
        y: 1530,
        cn: "钱塘江路(青职学院)",
        en: "Qiantangjiang Rd\n<br>(Qingdao Technical College)",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0612": {
        type: "dot",
        x: 909,
        y: 1575,
        cn: "九顶山",
        en: "Jiudingshan",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0614": {
        type: "dot",
        x: 828,
        y: 1611,
        cn: "北门外",
        en: "Beimenwai",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0615": {
        type: "dot",
        x: 783,
        y: 1611,
        cn: "西门外",
        en: "Ximenwai",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0616": {
        type: "dot",
        x: 738,
        y: 1611,
        cn: "毛家山(黄海学院)",
        en: "Maojiashan\n<br> (Qingdao Huanghai University)",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0617": {
        type: "dot",
        x: 693,
        y: 1611,
        cn: "赵家庙(影视产业园)",
        en: "Zhaojiamiao (Flim Metropolis)",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0618": {
        type: "dot",
        x: 648,
        y: 1611,
        cn: "星海滩路",
        en: "Xinghaitan Rd",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0619": {
        type: "dot",
        x: 630,
        y: 1647,
        cn: "华山",
        en: "Huashan",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0621": {
        type: "dot",
        x: 612,
        y: 1764,
        cn: "灵山湾",
        en: "Lingshan Bay",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0622": {
        type: "no",
        x: 576,
        y: 1764,
        cn: "红树林",
        en: "HONGSHULIN",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0623": {
        type: "no",
        x: 540,
        y: 1764,
        cn: "海南路",
        en: "HAINANLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0624": {
        type: "no",
        x: 504,
        y: 1764,
        cn: "朝阳山路",
        en: "CHAOYANGSHANLU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0625": {
        type: "no",
        x: 468,
        y: 1764,
        cn: "凤凰山路",
        en: "FENGHUANGSHANLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0627": {
        type: "no",
        x: 387,
        y: 1746,
        cn: "琅琊台路",
        en: "LANGYATAILU",
        align: "bottom-left",
        offset: { x: 2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0628": {
        type: "no",
        x: 360,
        y: 1719,
        cn: "灵山湾路",
        en: "LINGSHANWANLU",
        align: "bottom-left",
        offset: { x: 2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0629": {
        type: "no",
        x: 333,
        y: 1692,
        cn: "东岳路",
        en: "DONGYUELU",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0630": {
        type: "no",
        x: 306,
        y: 1665,
        cn: "海西路",
        en: "HAIXILU",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0631": {
        type: "no",
        x: 279,
        y: 1638,
        cn: "青西站",
        en: "QINGXIZHAN",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0701": {
        type: "no",
        x: 2061,
        y: 90,
        cn: "营普路",
        en: "YINGPULU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0702": {
        type: "no",
        x: 2016,
        y: 90,
        cn: "北安",
        en: "BEI’AN",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0703": {
        type: "no",
        x: 1971,
        y: 90,
        cn: "青威路",
        en: "QINGWEILU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0704": {
        type: "no",
        x: 1926,
        y: 90,
        cn: "鹤山路",
        en: "HESHANLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0705": {
        type: "no",
        x: 1881,
        y: 90,
        cn: "蓝鳌路",
        en: "LAN’AOLU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0706": {
        type: "no",
        x: 1836,
        y: 90,
        cn: "文峰路",
        en: "WENFENGLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0707": {
        type: "no",
        x: 1791,
        y: 90,
        cn: "环秀",
        en: "HUANXIU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0708": {
        type: "no",
        x: 1755,
        y: 108,
        cn: "景岱",
        en: "JINGDAI",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0709": {
        type: "no",
        x: 1728,
        y: 135,
        cn: "东城",
        en: "DONGCHENG",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0710": {
        type: "no",
        x: 1701,
        y: 162,
        cn: "前东城",
        en: "QIANDONGCHENG",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0711": {
        type: "no",
        x: 1674,
        y: 189,
        cn: "周村",
        en: "ZHOUCUN",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0712": {
        type: "dot",
        x: 1647,
        y: 216,
        cn: "东郭庄",
        en: "Dongguozhuang",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0713": {
        type: "tsf",
        x: 1611,
        y: 252,
        cn: "沟岔",
        en: "Goucha",
        align: "right",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0714": {
        type: "dot",
        x: 1575,
        y: 288,
        cn: "农业大学",
        en: "Qingdao Agricultural University",
        align: "top-left",
        offset: { x: 2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0715": {
        type: "tsf",
        x: 1557,
        y: 342,
        cn: "正阳中路",
        en: "Zhengyang Middle Rd",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0716": {
        type: "dot",
        x: 1557,
        y: 396,
        cn: "小寨子",
        en: "Xiaozhaizi",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0717": {
        type: "dot",
        x: 1557,
        y: 432,
        cn: "凤岗路",
        en: "Fenggang Rd",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0718": {
        type: "dot",
        x: 1557,
        y: 468,
        cn: "流亭",
        en: "Liuting",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0719": {
        type: "dot",
        x: 1557,
        y: 504,
        cn: "仙家寨(汽车北站)",
        en: "Xianjiazhai (North Coach Station)",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0720": {
        type: "dot",
        x: 1557,
        y: 540,
        cn: "瑞金路",
        en: "Ruijin Rd",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0721": {
        type: "dot",
        x: 1557,
        y: 576,
        cn: "遵义路",
        en: "Zunyi Rd",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0722": {
        type: "dot",
        x: 1557,
        y: 612,
        cn: "南岭",
        en: "Nanling",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0724": {
        type: "no",
        x: 1557,
        y: 702,
        cn: "文安路",
        en: "WEN’ANLU",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0801": {
        type: "dot",
        x: 837,
        y: 198,
        cn: "胶州北站",
        en: "Jiaozhou North Railway Station",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0802": {
        type: "dot",
        x: 837,
        y: 288,
        cn: "胶东机场",
        en: "Jiaodong International Airport",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0803": {
        type: "dot",
        x: 837,
        y: 378,
        cn: "胶东",
        en: "Jiaodong",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0804": {
        type: "dot",
        x: 873,
        y: 450,
        cn: "大涧",
        en: "Dajian",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0805": {
        type: "dot",
        x: 927,
        y: 468,
        cn: "红岛火车站",
        en: "Hongdao Railway Station",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0806": {
        type: "dot",
        x: 981,
        y: 522,
        cn: "健康中心",
        en: "Health Center",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0807": {
        type: "dot",
        x: 1035,
        y: 576,
        cn: "健身中心(红岛会展)",
        en: "Fitness Center (Hongdao International\n<br>Convention and Exhibition Center)",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0808": {
        type: "dot",
        x: 1089,
        y: 630,
        cn: "观涛",
        en: "Guantao",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0809": {
        type: "dot",
        x: 1143,
        y: 684,
        cn: "红岛科技馆(方特)",
        en: "Hongdao Science and\n<br>Technology Museum (Fangte)",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0810": {
        type: "dot",
        x: 1197,
        y: 738,
        cn: "大洋",
        en: "Dayang",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0812": {
        type: "no",
        x: 1552.5,
        y: 819,
        cn: "东南山",
        en: "Dongnanshan",
        align: "right",
        offset: { x: 6, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0813": {
        type: "tsf",
        x: 1548,
        y: 864,
        cn: "闫家山",
        en: "Yanjiashan",
        align: "top-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0814": {
        type: "dot",
        x: 1503,
        y: 954,
        cn: "小水清沟",
        en: "Xiaoshuiqinggou",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0815": {
        type: "dot",
        x: 1449,
        y: 1035,
        cn: "大山",
        en: "Dashan",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0817": {
        type: "tsf",
        x: 1449,
        y: 1242,
        cn: "澳柯玛桥",
        en: "Aokema Flyover",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0819": {
        type: "no",
        x: 801,
        y: 450,
        cn: "大沽河博物馆",
        en: "DAGUHEBOWUGUAN",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0820": {
        type: "no",
        x: 756,
        y: 450,
        cn: "少海北",
        en: "SHAOHAIBEI",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0821": {
        type: "no",
        x: 711,
        y: 450,
        cn: "太湖路",
        en: "TAIHULU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0822": {
        type: "no",
        x: 666,
        y: 450,
        cn: "站前大道",
        en: "ZHANQIANDADAO",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0823": {
        type: "no",
        x: 621,
        y: 450,
        cn: "海尔大道",
        en: "HAI’ERDADAO",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0824": {
        type: "no",
        x: 576,
        y: 450,
        cn: "温州路",
        en: "WENZHOULU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0825": {
        type: "no",
        x: 531,
        y: 450,
        cn: "福州南路",
        en: "FUZHOUNANLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0826": {
        type: "no",
        x: 486,
        y: 450,
        cn: "广州路",
        en: "GUANGZHOULU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0827": {
        type: "no",
        x: 441,
        y: 414,
        cn: "泸州路",
        en: "LUZHOULU",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0828": {
        type: "no",
        x: 441,
        y: 360,
        cn: "兰州西路",
        en: "LANZHOUXILU",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0829": {
        type: "no",
        x: 441,
        y: 306,
        cn: "胶州火车站",
        en: "JIAOZHOUHUOCHEZHAN",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0901": {
        type: "no",
        x: 1935,
        y: 342,
        cn: "前金社区",
        en: "QIANJINSHEQU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0902": {
        type: "no",
        x: 1890,
        y: 342,
        cn: "惜福镇",
        en: "XIFUZHEN",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0903": {
        type: "no",
        x: 1845,
        y: 342,
        cn: "正阳东路",
        en: "ZHENGYANGDONGLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0904": {
        type: "no",
        x: 1800,
        y: 342,
        cn: "西荆",
        en: "XIJING",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0905": {
        type: "no",
        x: 1755,
        y: 342,
        cn: "玉皇岭",
        en: "YUHUANGLING",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0906": {
        type: "no",
        x: 1710,
        y: 342,
        cn: "荟城路",
        en: "HUICHENGLU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0907": {
        type: "no",
        x: 1665,
        y: 342,
        cn: "靖城路",
        en: "JINGCHENGLU",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0908": {
        type: "no",
        x: 1611,
        y: 342,
        cn: "长城路",
        en: "CHANGCHENGLU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0910": {
        type: "no",
        x: 1512,
        y: 342,
        cn: "华城路",
        en: "HUACHENGLU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0911": {
        type: "no",
        x: 1467,
        y: 342,
        cn: "城子",
        en: "CHENGZI",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0912": {
        type: "no",
        x: 1422,
        y: 342,
        cn: "皂户",
        en: "ZAOHU",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M0913": {
        type: "no",
        x: 1377,
        y: 342,
        cn: "海西村",
        en: "HAIXICUN",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1102": {
        type: "dot",
        x: 1912.5,
        y: 1048.5,
        cn: "会展中心",
        en: "Convention Center",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1103": {
        type: "dot",
        x: 1944,
        y: 1017,
        cn: "青岛二中",
        en: "Qingdao No. 2\n<br>Middle School",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1104": {
        type: "dot",
        x: 1953,
        y: 972,
        cn: "青岛科大",
        en: "Qingdao University of\n<br>Science & Technology",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1105": {
        type: "tsf",
        x: 1953,
        y: 918,
        cn: "张村",
        en: "Zhangcun",
        align: "top-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1106": {
        type: "dot",
        x: 1989,
        y: 846,
        cn: "枯桃",
        en: "Kutao",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1107": {
        type: "dot",
        x: 2007,
        y: 792,
        cn: "海洋大学",
        en: "Ocean University of China",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1108": {
        type: "tsf",
        x: 2007,
        y: 720,
        cn: "世博园",
        en: "International Horticultural\n<br>Exposition Park",
        align: "right",
        offset: { x: 6, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1109": {
        type: "dot",
        x: 2007,
        y: 648,
        cn: "北宅",
        en: "Beizhai",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1110": {
        type: "dot",
        x: 2025,
        y: 576,
        cn: "北九水",
        en: "Beijiushui",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1111": {
        type: "dot",
        x: 2061,
        y: 540,
        cn: "庙石",
        en: "Miaoshi",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1112": {
        type: "dot",
        x: 2097,
        y: 504,
        cn: "浦里",
        en: "Puli",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1113": {
        type: "dot",
        x: 2133,
        y: 468,
        cn: "鳌山卫",
        en: "Aoshanwei",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1114": {
        type: "dot",
        x: 2169,
        y: 432,
        cn: "山东大学",
        en: "Shandong University",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1115": {
        type: "dot",
        x: 2205,
        y: 396,
        cn: "蓝色硅谷",
        en: "Oceantec Valley",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1116": {
        type: "dot",
        x: 2241,
        y: 360,
        cn: "水泊",
        en: "Shuipo",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1117": {
        type: "dot",
        x: 2277,
        y: 324,
        cn: "博览中心",
        en: "Expo Center",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1118": {
        type: "dot",
        x: 2295,
        y: 270,
        cn: "温泉东",
        en: "Wenquan East",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1119": {
        type: "dot",
        x: 2295,
        y: 225,
        cn: "皋虞",
        en: "Gaoyu",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1120": {
        type: "dot",
        x: 2295,
        y: 180,
        cn: "臧村",
        en: "Zangcun",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1121": {
        type: "dot",
        x: 2295,
        y: 135,
        cn: "钱谷山",
        en: "Qiangu Mountain",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1122": {
        type: "no",
        x: 2295,
        y: 90,
        cn: "鳌山湾",
        en: "Aoshan Bay",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1301": {
        type: "dot",
        x: 981,
        y: 1530,
        cn: "嘉陵江西路",
        en: "Jialingjiang West Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1302": {
        type: "dot",
        x: 981,
        y: 1575,
        cn: "香江路",
        en: "Xiangjiang Rd",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1303": {
        type: "tsf",
        x: 981,
        y: 1620,
        cn: "井冈山路",
        en: "Jinggangshan Rd",
        align: "top-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1304": {
        type: "dot",
        x: 963,
        y: 1692,
        cn: "积米崖",
        en: "Jimiya",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1305": {
        type: "dot",
        x: 882,
        y: 1692,
        cn: "灵山卫",
        en: "Lingshanwei",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1306": {
        type: "dot",
        x: 801,
        y: 1692,
        cn: "学院路",
        en: "Xueyuan Rd",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1307": {
        type: "dot",
        x: 720,
        y: 1692,
        cn: "朝阳山",
        en: "Chaoyangshan",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1308": {
        type: "tsf",
        x: 630,
        y: 1692,
        cn: "辛屯",
        en: "Xintun",
        align: "bottom-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1309": {
        type: "dot",
        x: 576,
        y: 1692,
        cn: "两河",
        en: "Lianghe",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1310": {
        type: "dot",
        x: 522,
        y: 1692,
        cn: "隐珠",
        en: "Yinzhu",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1311": {
        type: "dot",
        x: 459,
        y: 1692,
        cn: "凤凰山路",
        en: "Fenghuangshan Rd",
        align: "top",
        offset: { x: 0, y: -1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1312": {
        type: "tsf",
        x: 423,
        y: 1764,
        cn: "双珠路",
        en: "Shuangzhu Rd",
        align: "bottom-left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1313": {
        type: "dot",
        x: 423,
        y: 1808,
        cn: "世纪大道",
        en: "Shiji Ave",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1314": {
        type: "dot",
        x: 423,
        y: 1835,
        cn: "盛海路(世博城)",
        en: "Shenghai Rd (World Expo City)",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1315": {
        type: "dot",
        x: 423,
        y: 1862,
        cn: "大珠山",
        en: "Dazhu Mountain",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1316": {
        type: "dot",
        x: 423,
        y: 1889,
        cn: "张家楼",
        en: "Zhangjialou",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1317": {
        type: "dot",
        x: 423,
        y: 1916,
        cn: "古镇口",
        en: "Guzhenkou",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1318": {
        type: "dot",
        x: 414,
        y: 1943,
        cn: "龙湾",
        en: "Longwan Bay",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1319": {
        type: "dot",
        x: 387,
        y: 1970,
        cn: "琅琊",
        en: "Langya",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1320": {
        type: "dot",
        x: 360,
        y: 1997,
        cn: "贡口湾",
        en: "Gongkou Bay",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1321": {
        type: "dot",
        x: 333,
        y: 2024,
        cn: "董家口港",
        en: "Dongjiakou Port",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1322": {
        type: "dot",
        x: 306,
        y: 2051,
        cn: "泊里",
        en: "Poli",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1323": {
        type: "dot",
        x: 279,
        y: 2078,
        cn: "董家口火车站",
        en: "Dongjiakou Railway Station",
        align: "bottom-right",
        offset: { x: -2, y: -2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1501": {
        type: "no",
        x: 1341,
        y: 216,
        cn: "四方厂",
        en: "SIFANGCHANG",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1502": {
        type: "no",
        x: 1413,
        y: 216,
        cn: "南万",
        en: "NANWAN",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1503": {
        type: "no",
        x: 1485,
        y: 216,
        cn: "天山二路",
        en: "TIANSHAN’ERLU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1504": {
        type: "no",
        x: 1557,
        y: 216,
        cn: "天山一路",
        en: "TIANSHANYILU",
        align: "bottom",
        offset: { x: 0, y: 1 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1506": {
        type: "no",
        x: 1647,
        y: 288,
        cn: "春阳路",
        en: "CHUNYANGLU",
        align: "top-right",
        offset: { x: -2, y: 2 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1508": {
        type: "no",
        x: 1665,
        y: 396,
        cn: "文阳路",
        en: "WENYANGLU",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1509": {
        type: "no",
        x: 1665,
        y: 432,
        cn: "体育馆",
        en: "TIYUGUAN",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1510": {
        type: "no",
        x: 1665,
        y: 468,
        cn: "富民路",
        en: "FUMINLU",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1511": {
        type: "no",
        x: 1665,
        y: 504,
        cn: "夏塔路",
        en: "XIATALU",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1512": {
        type: "no",
        x: 1665,
        y: 540,
        cn: "仙山路",
        en: "XIANSHANLU",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1513": {
        type: "no",
        x: 1665,
        y: 576,
        cn: "玉霞路",
        en: "YUXIALU",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1514": {
        type: "no",
        x: 1665,
        y: 612,
        cn: "丹山",
        en: "DANSHAN",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1515": {
        type: "no",
        x: 1665,
        y: 648,
        cn: "丹山南",
        en: "DANSHANNAN",
        align: "right",
        offset: { x: 1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "M1516": {
        type: "no",
        x: 1665,
        y: 684,
        cn: "富锦路",
        en: "FUJINLU",
        align: "right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    }
};

if (typeof window !== "undefined") {
    window.stationsData = stationsData;
}
