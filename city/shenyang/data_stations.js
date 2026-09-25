/**
 * CGo OpenMap - 沈阳车站数据库 (city/shenyang/data_stations.js)
 *
 * 收录当前沈阳线路图已配置车站的拓扑与示意图坐标。
 * 坐标仅用于线路图排版；地理坐标由 amap_data.json 维护。
 *
 * 车站字段约定：
 * - type: "dot" 普通站，"tsf" 换乘站，"no" 暂缓开通站，"rdot" 国铁车站
 * - x / y: 1944x1680 画布坐标
 * - cn / en: 中文站名与英文站名
 * - aliases: 可选的搜索别名数组（包括车站历史名称与重点目的地）
 * - align: "top" | "bottom" | "left" | "right" | "top-left" | "top-right" |
 *          "bottom-left" | "bottom-right"
 * - offset / textScale / hideLabel: 可选的标签布局微调字段
 * - 车站卡片的运营与出入口信息由 stacard/data.js 单独维护
 */

const stationsData = {
    "0101": {
        type: "dot",
        x: 100,
        y: 960,
        cn: "十三号街",
        en: "SHISANHAOJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0102": {
        type: "dot",
        x: 160,
        y: 960,
        cn: "中央大街",
        en: "ZHONGYANGDAJIE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0103": {
        type: "dot",
        x: 220,
        y: 960,
        cn: "七号街",
        en: "QIHAOJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0104": {
        type: "dot",
        x: 280,
        y: 960,
        cn: "四号街",
        en: "SIHAOJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0105": {
        type: "dot",
        x: 340,
        y: 960,
        cn: "张士",
        en: "ZHANGSHI",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0106": {
        type: "dot",
        x: 360,
        y: 920,
        cn: "开发大道",
        en: "KAIFADADAO",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0107": {
        type: "dot",
        x: 360,
        y: 880,
        cn: "于洪广场",
        en: "YUHONGGUANGCHANG",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0108": {
        type: "dot",
        x: 360,
        y: 840,
        cn: "迎宾路",
        en: "YINGBINLU",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0109": {
        type: "dot",
        x: 400,
        y: 800,
        cn: "重工街",
        en: "ZHONGGONGJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0110": {
        type: "dot",
        x: 460,
        y: 800,
        cn: "启工街",
        en: "QIGONGJIE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0111": {
        type: "dot",
        x: 520,
        y: 800,
        cn: "保工街",
        en: "BAOGONGJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0112": {
        type: "tsf",
        x: 580,
        y: 800,
        cn: "铁西广场",
        en: "TIEXIGUANGCHANG",
        align: "top",
        offset: { x: -55, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0113": {
        type: "dot",
        x: 660,
        y: 800,
        cn: "云峰北街",
        en: "YUNFENGBEIJIE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0114": {
        type: "dot",
        x: 740,
        y: 800,
        cn: "沈阳站",
        en: "SHENYANGZHAN",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0115": {
        type: "tsf",
        x: 820,
        y: 800,
        cn: "太原街",
        en: "TAIYUANJIE",
        align: "top",
        offset: { x: -48, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0116": {
        type: "dot",
        x: 910,
        y: 800,
        cn: "南市场",
        en: "NANSHICHANG",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0117": {
        type: "tsf",
        x: 1000,
        y: 800,
        cn: "青年大街",
        en: "QINGNIANDAJIE",
        align: "top",
        offset: { x: -48, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0118": {
        type: "dot",
        x: 1070,
        y: 800,
        cn: "怀远门",
        en: "HUAIYUANMEN",
        aliases: ["沈阳故宫"],
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0119": {
        type: "dot",
        x: 1140,
        y: 800,
        cn: "中街",
        en: "ZHONGJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0120": {
        type: "dot",
        x: 1210,
        y: 800,
        cn: "东中街",
        en: "DONGZHONGJIE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0121": {
        type: "tsf",
        x: 1280,
        y: 800,
        cn: "滂江街",
        en: "PANGJIANGJIE",
        align: "top",
        offset: { x: 48, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0122": {
        type: "dot",
        x: 1340,
        y: 800,
        cn: "黎明广场",
        en: "LIMINGGUANGCHANG",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0123": {
        type: "dot",
        x: 1400,
        y: 800,
        cn: "新惠街",
        en: "XINHUIJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0124": {
        type: "dot",
        x: 1440,
        y: 780,
        cn: "新宁街",
        en: "XINNINGJIE",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0125": {
        type: "dot",
        x: 1488,
        y: 748,
        cn: "东大营街",
        en: "DONGDAYINGJIE",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0126": {
        type: "dot",
        x: 1536,
        y: 716,
        cn: "农业大学",
        en: "NONGYEDAXUE",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0127": {
        type: "dot",
        x: 1584,
        y: 684,
        cn: "前陵",
        en: "QIANLING",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0128": {
        type: "dot",
        x: 1632,
        y: 652,
        cn: "东陵公园",
        en: "DONGLINGGONGYUAN",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0129": {
        type: "dot",
        x: 1680,
        y: 620,
        cn: "水泉",
        en: "SHUIQUAN",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0130": {
        type: "dot",
        x: 1728,
        y: 588,
        cn: "伯官北大街",
        en: "BOGUANBEIDAJIE",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0131": {
        type: "dot",
        x: 1776,
        y: 556,
        cn: "植物园",
        en: "ZHIWUYUAN",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0132": {
        type: "dot",
        x: 1824,
        y: 524,
        cn: "双马",
        en: "SHUANGMA",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0257": {
        type: "dot",
        x: 1000,
        y: 120,
        cn: "蒲田路",
        en: "PUTIANLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0256": {
        type: "dot",
        x: 1000,
        y: 160,
        cn: "蒲河路",
        en: "PUHELU",
        aliases: ["盛京医院沈北院区"],
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0255": {
        type: "dot",
        x: 1000,
        y: 200,
        cn: "人杰湖公园",
        en: "RENJIEHUGONGYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0254": {
        type: "dot",
        x: 1000,
        y: 240,
        cn: "辽宁大学",
        en: "LIAONINGDAXUE",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0253": {
        type: "dot",
        x: 1000,
        y: 280,
        cn: "航空航天大学",
        en: "HANGKONGHANGTIANDAXUE",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0252": {
        type: "dot",
        x: 1000,
        y: 320,
        cn: "师范大学",
        en: "SHIFANDAXUE",
        aliases: ["辽宁古生物博物馆"],
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0251": {
        type: "dot",
        x: 1000,
        y: 360,
        cn: "医学院",
        en: "YIXUEYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0201": {
        type: "dot",
        x: 1000,
        y: 400,
        cn: "三台子",
        en: "SANTAIZI",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0202": {
        type: "dot",
        x: 1000,
        y: 440,
        cn: "陵西",
        en: "LINGXI",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0203": {
        type: "dot",
        x: 1000,
        y: 480,
        cn: "新乐遗址",
        en: "XINLEYIZHI",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0204": {
        type: "dot",
        x: 1000,
        y: 520,
        cn: "北陵公园",
        en: "BEILINGGONGYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0205": {
        type: "tsf",
        x: 1000,
        y: 560,
        cn: "中医药大学",
        en: "ZHONGYIYAODAXUE",
        align: "top",
        offset: { x: -55, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0206": {
        type: "dot",
        x: 1000,
        y: 620,
        cn: "岐山路",
        en: "QISHANLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0207": {
        type: "tsf",
        x: 1000,
        y: 680,
        cn: "沈阳北站",
        en: "SHENYANGBEIZHAN",
        align: "top",
        offset: { x: -55, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0208": {
        type: "dot",
        x: 1000,
        y: 720,
        cn: "金融中心",
        en: "JINRONGZHONGXIN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0209": {
        type: "dot",
        x: 1000,
        y: 760,
        cn: "人民广场",
        en: "RENMINGUANGCHANG",
        aliases: ["市府广场", "沈阳博物馆"],
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0211": {
        type: "dot",
        x: 1000,
        y: 860,
        cn: "青年公园",
        en: "QINGNIANGONGYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0212": {
        type: "tsf",
        x: 1000,
        y: 920,
        cn: "工业展览馆",
        en: "GONGYEZHANLANGUAN",
        align: "top",
        offset: { x: -60, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0213": {
        type: "dot",
        x: 1000,
        y: 980,
        cn: "市图书馆",
        en: "SHITUSHUGUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0214": {
        type: "dot",
        x: 1000,
        y: 1040,
        cn: "五里河",
        en: "WULIHE",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0215": {
        type: "tsf",
        x: 1000,
        y: 1120,
        cn: "奥体中心",
        en: "AOTIZHONGXIN",
        align: "top",
        offset: { x: -48, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0216": {
        type: "dot",
        x: 1000,
        y: 1160,
        cn: "营盘街",
        en: "YINGPANJIE",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0217": {
        type: "dot",
        x: 1000,
        y: 1200,
        cn: "世纪大厦",
        en: "SHIJIDASHA",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0218": {
        type: "dot",
        x: 1000,
        y: 1240,
        cn: "白塔河路",
        en: "BAITAHELU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0219": {
        type: "dot",
        x: 1000,
        y: 1280,
        cn: "全运路",
        en: "QUANYUNLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0220": {
        type: "dot",
        x: 1000,
        y: 1320,
        cn: "沈本大街",
        en: "SHENBENDAJIE",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0221": {
        type: "dot",
        x: 1000,
        y: 1360,
        cn: "沈中大街",
        en: "SHENZHONGDAJIE",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0222": {
        type: "dot",
        x: 1000,
        y: 1400,
        cn: "省博物馆",
        en: "SHENGBOWUGUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0223": {
        type: "dot",
        x: 1000,
        y: 1440,
        cn: "中央公园",
        en: "ZHONGYANGGONGYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0224": {
        type: "dot",
        x: 1000,
        y: 1480,
        cn: "创新一路",
        en: "CHUANGXINYILU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0225": {
        type: "dot",
        x: 1000,
        y: 1520,
        cn: "综合保税区",
        en: "ZONGHEBAOSHUIQU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0226": {
        type: "dot",
        x: 1000,
        y: 1560,
        cn: "桃仙机场",
        en: "TAOXIANJICHANG",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0901": {
        type: "dot",
        x: 580,
        y: 500,
        cn: "怒江公园",
        en: "NUJIANGGONGYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0902": {
        type: "tsf",
        x: 580,
        y: 560,
        cn: "淮河街沈医二院",
        en: "HUAIHEJIESHENYIERYUAN",
        align: "top",
        offset: { x: -70, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0903": {
        type: "dot",
        x: 580,
        y: 620,
        cn: "皇姑屯站",
        en: "HUANGGUTUNZHAN",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0904": {
        type: "dot",
        x: 580,
        y: 680,
        cn: "重型文化广场",
        en: "ZHONGXINGWENHUAGUANGCHANG",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0905": {
        type: "dot",
        x: 580,
        y: 740,
        cn: "北二路",
        en: "BEIERLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0907": {
        type: "dot",
        x: 580,
        y: 840,
        cn: "兴华公园",
        en: "XINGHUAGONGYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0908": {
        type: "dot",
        x: 580,
        y: 880,
        cn: "沈辽路",
        en: "SHENLIAOLU",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0909": {
        type: "dot",
        x: 580,
        y: 920,
        cn: "滑翔",
        en: "HUAXIANG",
        aliases: ["盛京医院滑翔院区"],
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0910": {
        type: "dot",
        x: 580,
        y: 960,
        cn: "吉力湖街",
        en: "JILIHUJIE",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0911": {
        type: "tsf",
        x: 580,
        y: 1000,
        cn: "大通湖街",
        en: "DATONGHUJIE",
        align: "top",
        offset: { x: 40, y: 35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0912": {
        type: "dot",
        x: 580,
        y: 1080,
        cn: "曹仲",
        en: "CAOZHONG",
        align: "top-right",
        offset: { x: 0, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0913": {
        type: "dot",
        x: 630,
        y: 1120,
        cn: "浑河站",
        en: "HUNHEZHAN",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0914": {
        type: "dot",
        x: 690,
        y: 1120,
        cn: "胜利南街",
        en: "SHENGLINANJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0915": {
        type: "tsf",
        x: 750,
        y: 1120,
        cn: "长白南",
        en: "CHANGBAINAN",
        align: "top",
        offset: { x: -40, y: -20 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0916": {
        type: "dot",
        x: 810,
        y: 1120,
        cn: "榆树台",
        en: "YUSHUTAI",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0917": {
        type: "dot",
        x: 870,
        y: 1120,
        cn: "金阳大街",
        en: "JINYANGDAJIE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0918": {
        type: "dot",
        x: 930,
        y: 1120,
        cn: "彩霞街",
        en: "CAIXIAJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0920": {
        type: "dot",
        x: 1090,
        y: 1120,
        cn: "天成街",
        en: "TIANCHENGJIE",
        align: "top-right",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0921": {
        type: "dot",
        x: 1160,
        y: 1120,
        cn: "朗日街",
        en: "LANGRIJIE",
        align: "top-right",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0922": {
        type: "tsf",
        x: 1280,
        y: 1120,
        cn: "长青南街",
        en: "CHANGQINGNANJIE",
        align: "top",
        offset: { x: 48, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0923": {
        type: "dot",
        x: 1340,
        y: 1120,
        cn: "建筑大学",
        en: "JIANZHUDAXUE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1001": {
        type: "dot",
        x: 410,
        y: 460,
        cn: "丁香湖",
        en: "DINGXIANGHU",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1002": {
        type: "dot",
        x: 410,
        y: 520,
        cn: "元江街",
        en: "YUANJIANGJIE",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1003": {
        type: "dot",
        x: 460,
        y: 560,
        cn: "向工街",
        en: "XIANGGONGJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1004": {
        type: "dot",
        x: 520,
        y: 560,
        cn: "塔湾街",
        en: "TAWANJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1006": {
        type: "dot",
        x: 720,
        y: 560,
        cn: "百鸟公园",
        en: "BAINIAOGONGYUAN",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1007": {
        type: "dot",
        x: 860,
        y: 560,
        cn: "长江街",
        en: "CHANGJIANGJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1009": {
        type: "dot",
        x: 1090,
        y: 560,
        cn: "陵东街",
        en: "LINGDONGJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1010": {
        type: "dot",
        x: 1190,
        y: 560,
        cn: "北塔",
        en: "BEITA",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1011": {
        type: "tsf",
        x: 1280,
        y: 580,
        cn: "合作街",
        en: "HEZUOJIE",
        aliases: ["胸科医院", "“九·一八”历史博物馆"],
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1012": {
        type: "dot",
        x: 1280,
        y: 680,
        cn: "东北大马路",
        en: "DONGBEIDAMALU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1014": {
        type: "dot",
        x: 1280,
        y: 830,
        cn: "长安路",
        en: "CHANG'ANLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1015": {
        type: "dot",
        x: 1280,
        y: 860,
        cn: "万莲",
        en: "WANLIAN",
        aliases: ["小河沿早市"],
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1016": {
        type: "dot",
        x: 1280,
        y: 890,
        cn: "泉园",
        en: "QUANYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1017": {
        type: "tsf",
        x: 1280,
        y: 920,
        cn: "江东街",
        en: "JIANGDONGJIE",
        align: "top",
        offset: { x: 48, y: 60 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1018": {
        type: "dot",
        x: 1280,
        y: 1020,
        cn: "长青桥",
        en: "CHANGQINGQIAO",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1020": {
        type: "dot",
        x: 1280,
        y: 1200,
        cn: "理工大学",
        en: "LIGONGDAXUE",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "1021": {
        type: "dot",
        x: 1280,
        y: 1260,
        cn: "张沙布",
        en: "ZHANGSHABU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0401": {
        type: "dot",
        x: 1280,
        y: 320,
        cn: "正新路",
        en: "ZHENGXINLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0402": {
        type: "dot",
        x: 1280,
        y: 375,
        cn: "文官街",
        en: "WENGUANJIE",
        aliases: ["沈阳职业技术学院"],
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0403": {
        type: "dot",
        x: 1280,
        y: 430,
        cn: "望花",
        en: "WANGHUA",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0404": {
        type: "dot",
        x: 1280,
        y: 485,
        cn: "观泉路",
        en: "GUANQUANLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0405": {
        type: "dot",
        x: 1280,
        y: 530,
        cn: "北大营",
        en: "BEIDAYING",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0407": {
        type: "dot",
        x: 1220,
        y: 630,
        cn: "洮昌街",
        en: "TAOCHANGJIE",
        align: "bottom",
        offset: { x: 24, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0408": {
        type: "dot",
        x: 1090,
        y: 680,
        cn: "沈阳大学",
        en: "SHENYANGDAXUE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0410": {
        type: "dot",
        x: 910,
        y: 680,
        cn: "皇寺路",
        en: "HUANGSILU",
        aliases: ["老北市"],
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0411": {
        type: "dot",
        x: 820,
        y: 740,
        cn: "市府大路",
        en: "SHIFUDALU",
        aliases: ["西塔"],
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0413": {
        type: "dot",
        x: 820,
        y: 860,
        cn: "南五马路",
        en: "NANWUMALU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0414": {
        type: "tsf",
        x: 790,
        y: 920,
        cn: "砂阳",
        en: "SHAYANG",
        align: "top",
        offset: { x: -48, y: -35 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0415": {
        type: "dot",
        x: 750,
        y: 1000,
        cn: "南京桥",
        en: "NANJINGQIAO",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0416": {
        type: "dot",
        x: 750,
        y: 1060,
        cn: "长白岛",
        en: "CHANGBAIDAO",
        align: "left",
        offset: { x: -10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0418": {
        type: "dot",
        x: 750,
        y: 1180,
        cn: "金仓路",
        en: "JINCANGLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0419": {
        type: "dot",
        x: 750,
        y: 1240,
        cn: "云杉路",
        en: "YUNSHANLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0420": {
        type: "dot",
        x: 750,
        y: 1300,
        cn: "红椿路",
        en: "HONGCHUNLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0421": {
        type: "dot",
        x: 750,
        y: 1360,
        cn: "城建学院",
        en: "CHENGJIANXUEYUAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0422": {
        type: "dot",
        x: 750,
        y: 1420,
        cn: "沈阳南站",
        en: "SHENYANGNANZHAN",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0423": {
        type: "dot",
        x: 750,
        y: 1480,
        cn: "创新路",
        en: "CHUANGXINLU",
        align: "right",
        offset: { x: 10, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0301": {
        type: "dot",
        x: 148,
        y: 1288,
        cn: "李达",
        en: "LIDA",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0302": {
        type: "dot",
        x: 184,
        y: 1264,
        cn: "铁西汽车工厂",
        en: "TIEXIQICHEGONGCHANG",
        align: "left",
        offset: { x: -5, y: -10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0303": {
        type: "dot",
        x: 220,
        y: 1240,
        cn: "马贝",
        en: "MABEI",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0304": {
        type: "dot",
        x: 256,
        y: 1216,
        cn: "中德大街",
        en: "ZHONGDEDAJIE",
        align: "left",
        offset: { x: -5, y: -10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0305": {
        type: "dot",
        x: 292,
        y: 1192,
        cn: "细河悠谷",
        en: "XIHEYOUGU",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0306": {
        type: "dot",
        x: 328,
        y: 1168,
        cn: "翟家",
        en: "ZHAIJIA",
        align: "left",
        offset: { x: -5, y: -10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0307": {
        type: "dot",
        x: 364,
        y: 1144,
        cn: "工业大学",
        en: "GONGYEDAXUE",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0308": {
        type: "dot",
        x: 400,
        y: 1120,
        cn: "宁官",
        en: "NINGGUAN",
        align: "left",
        offset: { x: -5, y: -10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0309": {
        type: "dot",
        x: 436,
        y: 1096,
        cn: "余良",
        en: "YULIANG",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0310": {
        type: "dot",
        x: 472,
        y: 1072,
        cn: "甘官",
        en: "GANGUAN",
        align: "left",
        offset: { x: -5, y: -10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0311": {
        type: "dot",
        x: 508,
        y: 1048,
        cn: "千岛湖街",
        en: "QIANDAOHUJIE",
        align: "right",
        offset: { x: 5, y: 10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0312": {
        type: "dot",
        x: 544,
        y: 1024,
        cn: "南阳湖街",
        en: "NANYANGHUJIE",
        align: "left",
        offset: { x: -5, y: -10 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0314": {
        type: "dot",
        x: 640,
        y: 960,
        cn: "南李官",
        en: "NANLIGUAN",
        align: "top-left",
        offset: { x: 8, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0315": {
        type: "dot",
        x: 720,
        y: 920,
        cn: "凌空",
        en: "LINGKONG",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0317": {
        type: "dot",
        x: 835,
        y: 920,
        cn: "南八马路",
        en: "NANBAMALU",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0318": {
        type: "dot",
        x: 875,
        y: 920,
        cn: "嘉兴街",
        en: "JIAXINGJIE",
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0319": {
        type: "dot",
        x: 915,
        y: 920,
        cn: "方型广场",
        en: "FANGXINGGUANGCHANG",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0320": {
        type: "dot",
        x: 960,
        y: 920,
        cn: "三好街",
        en: "SANHAOJIE",
        aliases: ["盛京医院南湖院区"],
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0322": {
        type: "dot",
        x: 1070,
        y: 920,
        cn: "中科院金属所",
        en: "ZHONGKEYUANJINSHUSUO",
        aliases: ["北部战区总医院", "沈阳药科大学", "沈阳二中"],
        align: "top",
        offset: { x: 0, y: -4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0323": {
        type: "dot",
        x: 1125,
        y: 920,
        cn: "南塔",
        en: "NANTA",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0324": {
        type: "dot",
        x: 1180,
        y: 920,
        cn: "文富路",
        en: "WENFULU",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0325": {
        type: "dot",
        x: 1235,
        y: 920,
        cn: "富民街",
        en: "FUMINJIE",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "0327": {
        type: "dot",
        x: 1340,
        y: 920,
        cn: "方家栏",
        en: "FANGJIALAN",
        align: "bottom",
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "T501": {
        type: "dot",
        x: 1010,
        y: 1095,
        cn: "奥体中心",
        en: "",
        //en: "Olympic Center",
        align: "bottom",
        hideLabel: true,
        offset: { x: 0, y: 4 },
        textScale: { cn: 1.0, en: 1.0 }
    },
    "T502": {
        type: "dot",
        x: 1040,
        y: 1095,
        cn: "沈阳海关",
        en: "",
        //en: "Shenyang Customs",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 0.7 }
    },
    "T503": {
        type: "dot",
        x: 1070,
        y: 1095,
        cn: "金水花城",
        en: "",
        //en: "Jinshuihuacheng",
        align: "top-right",
        offset: { x: -4, y: 1 },
        textScale: { cn: 0.9, en: 0.8 }
    },
    "T504": {
        type: "dot",
        x: 1082,
        y: 1130,
        cn: "奥体游泳馆",
        en: "",
        //en: "Olympic Aquatic Stadium",
        align: "left",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T505": {
        type: "dot",
        x: 1115,
        y: 1140,
        cn: "行政服务中心",
        en: "",
        //en: "Administrative<br> Service Center",
        align: "bottom",
        offset: { x: -10, y: 0 },
        textScale: { cn: 0.8, en: 1 }
    },
    "T506": {
        type: "dot",
        x: 1160,
        y: 1140,
        cn: "浑南图书馆",
        en: "",
        //en: "Hunnan Library",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.8, en: 0.95 }
    },
    "T507": {
        type: "dot",
        x: 1205,
        y: 1140,
        cn: "陆军总院",
        en: "",
        //en: "Lujun Hospital",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.8, en: 0.8 }
    },
    "T508": {
        type: "dot",
        x: 1250,
        y: 1140,
        cn: "浑南实验小学",
        en: "",
        //en: "Hunnan Experimental<br> Primary School",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.7, en: 0.7 }
    },
    "T509": {
        type: "dot",
        x: 1295,
        y: 1140,
        cn: "万科新里程",
        en: "",
        //en: "Wanke Everest Town",
        align: "bottom-right",
        offset: { x: -10, y: -1 },
        textScale: { cn: 0.8, en: 0.72 }
    },
    "T510": {
        type: "dot",
        x: 1340,
        y: 1140,
        cn: "建筑大学",
        en: "",
        //en: "Jianzhu University",
        align: "bottom",
        hideLabel: true,
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.8, en: 0.75 }
    },
    "T511": {
        type: "dot",
        x: 1370,
        y: 1140,
        cn: "金地滨河国际",
        en: "",
        //en: "Riverine Paradise",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.8, en: 1 }
    },
    "T512": {
        type: "dot",
        x: 1400,
        y: 1140,
        cn: "综合保税区",
        en: "",
        //en: "Free Trade Zone",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T513": {
        type: "dot",
        x: 1430,
        y: 1140,
        cn: "万科新城",
        en: "",
        //en: "Wanke New City",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T514": {
        type: "dot",
        x: 1460,
        y: 1140,
        cn: "浑南实验中学",
        en: "",
        //en: "Hunnan Experimental<br> Middle School",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.8, en: 0.85 }
    },
    "T515": {
        type: "dot",
        x: 1490,
        y: 1140,
        cn: "李巴彦",
        en: "",
        //en: "Libayan",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T516": {
        type: "dot",
        x: 1520,
        y: 1140,
        cn: "杨官",
        en: "",
        //en: "Yangguan",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T517": {
        type: "dot",
        x: 1550,
        y: 1140,
        cn: "温馨港湾",
        en: "",
        //en: "Wenxingangwan",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T518": {
        type: "dot",
        x: 1580,
        y: 1140,
        cn: "金地艺境",
        en: "",
        //en: "Brown Stone",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T519": {
        type: "dot",
        x: 1610,
        y: 1140,
        cn: "东北冷鲜港",
        en: "",
        //en: "Yidu Distribution Center",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.8, en: 0.65 }
    },
    "T520": {
        type: "dot",
        x: 1640,
        y: 1140,
        cn: "天洁华尔街",
        en: "",
        //en: "Tianjie Wall Street",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T521": {
        type: "dot",
        x: 1670,
        y: 1140,
        cn: "汪家馨城",
        en: "",
        //en: "Wangjiaxincheng",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T522": {
        type: "dot",
        x: 1700,
        y: 1140,
        cn: "人民文化公园",
        en: "",
        //en: "Renminwenhuagongyuan",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.8, en: 0.7 }
    },
    "T523": {
        type: "dot",
        x: 1730,
        y: 1140,
        cn: "伯官",
        en: "",
        //en: "Boguan",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T524": {
        type: "dot",
        x: 1760,
        y: 1140,
        cn: "上伯官",
        en: "",
        //en: "Shangboguan",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T525": {
        type: "dot",
        x: 1790,
        y: 1140,
        cn: "玄菟郡遗址公园",
        en: "",
        //en: "Xuantujunyizhigongyuan",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.75, en: 0.8 }
    },
    "T526": {
        type: "dot",
        x: 1820,
        y: 1140,
        cn: "规划馆",
        en: "",
        //en: "Guihuaguan",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T527": {
        type: "dot",
        x: 1850,
        y: 1140,
        cn: "中金公元启城",
        en: "",
        //en: "Zhongjingongyuanqicheng",
        align: "bottom",
        offset: { x: 6, y: 0 },
        textScale: { cn: 0.75, en: 0.65 }
    },
    "T528": {
        type: "dot",
        x: 1880,
        y: 1140,
        cn: "汇置城",
        en: "",
        //en: "Huizhicheng",
        align: "top",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "T529": {
        type: "dot",
        x: 1910,
        y: 1140,
        cn: "李石寨",
        en: "",
        //en: "Lishizhai",
        align: "bottom",
        offset: { x: 0, y: 0 },
        textScale: { cn: 0.9, en: 1 }
    },
    "SYT": {
        type: "rdot",
        x: 740,
        y: 780,
        cn: "沈阳站",
        en: "Shenyang Railway Station",
        hideLabel: true,
        badge: "./city/shenyang/assets/railway.svg",
    },
    "SBT": {
        type: "rdot",
        x: 1020,
        y: 660,
        cn: "沈阳北站",
        en: "Shenyangbei Railway Station",
        hideLabel: true,
        badge: "./city/shenyang/assets/railway.svg",
    },
    "SOT": {
        type: "rdot",
        x: 730,
        y: 1420,
        cn: "沈阳南站",
        en: "Shenyangnan Railway Station",
        hideLabel: true,
        badge: "./city/shenyang/assets/railway.svg",
    },
};

if (typeof window !== "undefined") {
    window.stationsData = stationsData;
}
