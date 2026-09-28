/**
 * CGo OpenMap - 哈尔滨车站数据 (city/harbin/data_stations.js)
 *
 * 【骨架阶段】当前仅收录 1 / 2 / 3 号线的局部区段，坐标按示意图步进规则推算，
 * 仅用于线路图排版，不代表地理坐标或真实站间里程。
 *
 * 坐标步进：
 * - 一般区间 X / Y 各步进 40px；
 * - 2 号线过江段（太阳岛 → 人民广场）单独放大到 80px；
 * - 1 号线南段（黑龙江大学以南）按 40 / 60 / 80 逐段放大；
 * - 1 号线起点江北大学城定位于 (240, 120)；
 * - 1 号线北段（交通学院 → 哈尔滨东站）沿 y=380 水平 +60；
 * - 1 号线南端（镜泊路 → 新疆大街）沿 45° 步进 +60,+60；
 * - 3 号线（医大一院群力院区 ↔ 凯盛源广场）在两站之间四等分（+35,+35）。
 *
 * 车站字段约定：
 * - type: "dot" 普通站，"tsf" 换乘站，"no" 暂缓开通站，"rdot" 国铁车站
 * - x / y: 画布坐标（左上角为原点 0,0）
 * - cn / en: 中文站名与英文站名（英文名为初步整理，待官方口径校核）
 * - align: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" |
 *          "bottom-left" | "bottom-right"
 * - offset: 标签相对站点的微调像素（可选）
 *
 * 换乘站（共用同一编号）：
 *   人民广场 RMGC —— 2 / 3 号线
 *   博物馆   BWG  —— 1 / 2 号线
 *   珠江路   ZJL  —— 2 / 3 号线
 *   太平桥   TPQ  —— 1 / 3 号线
 *   医大二院 YDEY —— 1 / 3 号线
 *
 * 国铁车站（type "rdot"，ID 取车站电报码，与同名地铁站同址）：
 *   哈尔滨站 HBB / 哈尔滨西站 VAB / 哈尔滨北站 HTB / 哈尔滨东站 VBB
 * 数据格式参照大连：仅落徽标、hideLabel，站名由同名地铁站承担；
 * 归属线路为 data_lines.js 中的「中国铁路」点状条目（isPointOnly）。
 */

const stationsData = {
    // ===== 2号线（江北大学城 → 气象台）=====
    "JBDXC": {
        type: "dot",
        x: 240,
        y: 120,
        cn: "江北大学城",
        en: "Jiangbei University Town",
        align: "top-right"
    },
    "HEBB": {
        type: "dot",
        x: 280,
        y: 160,
        cn: "哈尔滨北站",
        en: "Harbin North Railway Station",
        align: "top-right"
    },
    "DGJ": {
        type: "dot",
        x: 320,
        y: 200,
        cn: "大耿家",
        en: "Dagengjia",
        align: "top-right"
    },
    "LCL": {
        type: "dot",
        x: 360,
        y: 240,
        cn: "龙川路",
        en: "Longchuan Road",
        align: "top-right"
    },
    "SMDD": {
        type: "dot",
        x: 400,
        y: 280,
        cn: "世茂大道",
        en: "Shimao Avenue",
        align: "top-right"
    },
    "BXDDSJ": {
        type: "dot",
        x: 440,
        y: 320,
        cn: "冰雪大世界",
        en: "Ice and Snow World",
        align: "top-right"
    },
    "TYD": {
        type: "dot",
        x: 480,
        y: 360,
        cn: "太阳岛",
        en: "Sun Island",
        align: "top-right"
    },
    "RMGC": {
        type: "tsf",
        x: 560,
        y: 440,
        cn: "人民广场",
        en: "People's Square",
        align: "left",
        offset: { x: -8, y: 0 }
    },
    "ZYDJ": {
        type: "dot",
        x: 600,
        y: 480,
        cn: "中央大街",
        en: "Zhongyang Street",
        align: "top-right"
    },
    "SZDJ": {
        type: "dot",
        x: 640,
        y: 520,
        cn: "尚志大街",
        en: "Shangzhi Street",
        align: "top-right"
    },
    "HEB": {
        type: "dot",
        x: 680,
        y: 560,
        cn: "哈尔滨站",
        en: "Harbin Railway Station",
        align: "top-right"
    },
    "BWG": {
        type: "tsf",
        x: 720,
        y: 600,
        cn: "博物馆",
        en: "Museum of <br>Heilongjiang Province",
        align: "left",
        offset: { x: -8, y: 0 }
    },
    // 博物馆 → 珠江路 之间四等分（每站 +50,+50）
    "GRWHG": {
        type: "dot",
        x: 770,
        y: 650,
        cn: "工人文化宫",
        en: "Workers' Cultural Palace",
        align: "top-right"
    },
    "SZF": {
        type: "dot",
        x: 820,
        y: 700,
        cn: "省政府",
        en: "The People's Government <br>of Heilongjiang Province",
        align: "bottom-left"
    },
    "SYY": {
        type: "dot",
        x: 870,
        y: 750,
        cn: "省医院",
        en: "Provincial Hospital",
        align: "bottom-left"
    },
    "ZJL": {
        type: "tsf",
        x: 920,
        y: 800,
        cn: "珠江路",
        en: "Zhujiang Road",
        align: "top-right"
    },
    "NZL": {
        type: "dot",
        x: 1000,
        y: 820,
        cn: "南直路",
        en: "Nanzhi Road",
        align: "bottom"
    },
    "DBNYDX": {
        type: "dot",
        x: 1060,
        y: 820,
        cn: "东北农业大学",
        en: "Northeast Agricultural University",
        align: "top"
    },
    "QXT": {
        type: "dot",
        x: 1120,
        y: 820,
        cn: "气象台",
        en: "Meteorological Observatory",
        align: "bottom"
    },

    // ===== 1号线（新疆大街 → 哈尔滨东站，经博物馆）=====
    // 南端：镜泊路 → 新疆大街 沿 45° 步进 +60；医大二院以南：Y 步进 +80；
    // 医大二院：+60；黑龙江大学 / 理工大学：+40
    "XJD": {
        type: "dot",
        x: 700,
        y: 1460,
        cn: "新疆大街",
        en: "Xinjiang Street",
        align: "top-right"
    },
    "BHL": {
        type: "dot",
        x: 640,
        y: 1400,
        cn: "渤海路",
        en: "Bohai Road",
        align: "top-right"
    },
    "JBL": {
        type: "dot",
        x: 580,
        y: 1340,
        cn: "镜泊路",
        en: "Jingbo Road",
        align: "top-right"
    },
    "WPY": {
        type: "dot",
        x: 540,
        y: 1260,
        cn: "瓦盆窑",
        en: "Wapengyao",
        align: "right"
    },
    "TJL": {
        type: "dot",
        x: 540,
        y: 1180,
        cn: "同江路",
        en: "Tongjiang Road",
        align: "right"
    },
    "HEBN": {
        type: "dot",
        x: 540,
        y: 1100,
        cn: "哈尔滨南站",
        en: "Harbin South Railway Station",
        align: "right"
    },
    "HD": {
        type: "dot",
        x: 540,
        y: 1020,
        cn: "哈达",
        en: "Hada",
        align: "right"
    },
    "YDEY": {
        type: "tsf",
        x: 540,
        y: 940,
        cn: "医大二院",
        en: "The Second Affiliated <br>Hospital of Harbin <br>Medical University",
        align: "bottom-right"
    },
    "HLJDX": {
        type: "dot",
        x: 540,
        y: 900,
        cn: "黑龙江大学",
        en: "Heilongjiang University",
        align: "right"
    },
    "LGDX": {
        type: "dot",
        x: 540,
        y: 850,
        cn: "理工大学",
        en: "Harbin University of <br>Science and Technology",
        align: "right"
    },
    "XFL": {
        type: "dot",
        x: 540,
        y: 800,
        cn: "学府路",
        en: "Xuefu Road",
        align: "right"
    },
    "HXL": {
        type: "dot",
        x: 560,
        y: 760,
        cn: "和兴路",
        en: "Hexing Road",
        align: "bottom-right"
    },
    "XDQ": {
        type: "dot",
        x: 600,
        y: 720,
        cn: "西大桥",
        en: "Xidaqiao",
        align: "bottom-right"
    },
    "HGD": {
        type: "dot",
        x: 640,
        y: 680,
        cn: "哈工大",
        en: "Harbin Institute of <br>Technology",
        align: "bottom-right"
    },
    "TLJ": {
        type: "dot",
        x: 680,
        y: 640,
        cn: "铁路局",
        en: "Harbin Railway Co., Ltd.",
        align: "bottom-right"
    },
    "YDYY": {
        type: "dot",
        x: 760,
        y: 560,
        cn: "医大一院",
        en: "The First Affiliated Hospital of<br>Harbin Medical University",
        align: "bottom-right"
    },
    "YC": {
        type: "dot",
        x: 800,
        y: 520,
        cn: "烟厂",
        en: "Tobacco Manufacturer",
        align: "bottom-right"
    },
    "GCDX": {
        type: "dot",
        x: 840,
        y: 480,
        cn: "工程大学",
        en: "Harbin Engineering <br>University",
        align: "bottom-right"
    },
    "TPQ": {
        type: "tsf",
        x: 880,
        y: 440,
        cn: "太平桥",
        en: "Taipingqiao",
        align: "right",
        offset: { x: 8, y: 0 }
    },
    "JTXY": {
        type: "dot",
        x: 960,
        y: 380,
        cn: "交通学院",
        en: "Jiaotongxueyuan",
        align: "bottom-right",
        offset: { x: -8, y: 0 }
    },
    "HSL": {
        type: "dot",
        x: 1020,
        y: 380,
        cn: "桦树街",
        en: "Huashu Street",
        align: "top"
    },
    "HEBD": {
        type: "dot",
        x: 1080,
        y: 380,
        cn: "哈尔滨东站",
        en: "Harbin East Railway Station",
        align: "bottom"
    },

    // ===== 3号线（环线，36 站；环序见 data_lines.js）=====
    // 珠江路 → 太平桥 段（沿 x=920 向北，再折向太平桥）
    "GBL": {
        type: "dot",
        x: 920,
        y: 850,
        cn: "公滨路",
        en: "Gongbin Road",
        align: "right"
    },
    "YFJ": {
        type: "dot",
        x: 920,
        y: 900,
        cn: "油坊街",
        en: "Yuofang Street",
        align: "right"
    },
    "XJL": {
        type: "dot",
        x: 920,
        y: 740,
        cn: "湘江路",
        en: "Xiangjiang Road",
        align: "right"
    },
    "HZZX": {
        type: "dot",
        x: 920,
        y: 680,
        cn: "会展中心",
        en: "Convention and Exhibition Center",
        align: "right"
    },
    "HHDL": {
        type: "dot",
        x: 920,
        y: 620,
        cn: "海河东路",
        en: "Haihe East Road",
        align: "right"
    },
    "SDEYY": {
        type: "dot",
        x: 920,
        y: 560,
        cn: "市第二医院",
        en: "Second Hospital of Harbin City",
        align: "right"
    },
    "DYFJ": {
        type: "dot",
        x: 920,
        y: 500,
        cn: "大有坊街",
        en: "Dayoufang Street",
        align: "right"
    },
    // 太平桥 → 人民广场 段（西北弧）
    "JYGY": {
        type: "dot",
        x: 840,
        y: 400,
        cn: "靖宇公园",
        en: "Jingyu Park",
        align: "bottom-left"
    },
    "QZS": {
        type: "dot",
        x: 800,
        y: 360,
        cn: "清真寺",
        en: "Harbin Mosque",
        align: "top-right"
    },
    "ZHBLKJQ": {
        type: "dot",
        x: 760,
        y: 320,
        cn: "中华巴洛克街区",
        en: "Chinese-baroque Block",
        align: "top-right"
    },
    "BML": {
        type: "dot",
        x: 680,
        y: 320,
        cn: "北马路",
        en: "Beima Road",
        align: "top-left"
    },
    "ZLGY": {
        type: "dot",
        x: 640,
        y: 360,
        cn: "兆麟公园",
        en: "Zhaolin Park",
        align: "top-left"
    },
    "YYG": {
        type: "dot",
        x: 600,
        y: 400,
        cn: "友谊宫",
        en: "Youyigong",
        align: "bottom-right"
    },
    "SHJ": {
        type: "dot",
        x: 520,
        y: 480,
        cn: "上海街",
        en: "Shanghai Street",
        align: "bottom-right"
    },
    "GLDQ": {
        type: "dot",
        x: 480,
        y: 520,
        cn: "公路大桥",
        en: "Highway Bridge",
        align: "bottom-right"
    },
    "HSJ": {
        type: "dot",
        x: 440,
        y: 560,
        cn: "河松街",
        en: "Hesong Street",
        align: "bottom-right"
    },
    "HSHJ": {
        type: "dot",
        x: 400,
        y: 600,
        cn: "河山街",
        en: "Heshan Street",
        align: "bottom-right"
    },
    "DXGY": {
        type: "dot",
        x: 360,
        y: 640,
        cn: "丁香公园",
        en: "Lilac Park",
        align: "bottom-right"
    },
    "TYGY": {
        type: "dot",
        x: 320,
        y: 680,
        cn: "体育公园",
        en: "Sports Park",
        align: "bottom-right"
    },
    "QLDWDD": {
        type: "dot",
        x: 280,
        y: 720,
        cn: "群力第五大道",
        en: "No.5 Qunli Avenue",
        align: "bottom-right"
    },
    "YDYYQLYQ": {
        type: "dot",
        x: 280,
        y: 780,
        cn: "医大一院群力院区",
        en: "Qunli Hospital, the First Affiliated <br>Hospital of Harbin Medical University",
        align: "top-right"
    },
    "KSYGC": {
        type: "dot",
        x: 420,
        y: 920,
        cn: "凯盛源广场",
        en: "Kaishengyuan Plaza",
        align: "bottom-left"
    },
    "GNDJ": {
        type: "dot",
        x: 315,
        y: 815,
        cn: "工农大街",
        en: "Gongnong Street",
        align: "top-right"
    },
    "CXL": {
        type: "dot",
        x: 350,
        y: 850,
        cn: "城乡路",
        en: "Chengxiang Road",
        align: "bottom-left"
    },
    "HEBX": {
        type: "dot",
        x: 385,
        y: 885,
        cn: "哈尔滨西站",
        en: "Harbin West Railway Station",
        align: "top-right"
    },
    // 医大二院 → 汽轮机厂 段（沿 y=940 向东）
    "HXDJ": {
        type: "dot",
        x: 480,
        y: 940,
        cn: "哈西大街",
        en: "Haxi Street",
        align: "top"
    },
    "ZYL": {
        type: "dot",
        x: 600,
        y: 940,
        cn: "征仪路",
        en: "Zhengyi Road",
        align: "top"
    },
    "ZLYY": {
        type: "dot",
        x: 660,
        y: 940,
        cn: "肿瘤医院",
        en: "Harbin Medical University <br>Cancer Hospital",
        align: "bottom"
    },
    "XSJ": {
        type: "dot",
        x: 720,
        y: 940,
        cn: "旭升街",
        en: "Xusheng Street",
        align: "top"
    },
    "LDGY": {
        type: "dot",
        x: 780,
        y: 940,
        cn: "劳动公园",
        en: "Labor Park",
        align: "bottom"
    },
    "JXJ": {
        type: "dot",
        x: 840,
        y: 940,
        cn: "进乡街",
        en: "Jinxiang Street",
        align: "top"
    },
    "QLJC": {
        type: "dot",
        x: 900,
        y: 940,
        cn: "汽轮机厂",
        en: "Turbine Co., Ltd.",
        align: "bottom"
    },

    // ===== 国铁车站（rdot，ID 取车站电报码，与同名地铁站同址）=====
    // 数据格式参照大连：仅落铁路徽标、hideLabel；站名与标签由同名地铁站承担。
    "HBB": {
        type: "rdot",
        x: 680,
        y: 560,
        cn: "哈尔滨站",
        en: "Harbin Railway Station",
        align: "top",
        hideLabel: true,
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "VAB": {
        type: "rdot",
        x: 385,
        y: 885,
        cn: "哈尔滨西站",
        en: "Harbinxi Railway Station",
        align: "top",
        hideLabel: true,
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "HTB": {
        type: "rdot",
        x: 280,
        y: 160,
        cn: "哈尔滨北站",
        en: "Harbinbei Railway Station",
        align: "top",
        hideLabel: true,
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "VBB": {
        type: "rdot",
        x: 1080,
        y: 380,
        cn: "哈尔滨东站",
        en: "Harbindong Railway Station",
        align: "top",
        hideLabel: true,
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    }
};
