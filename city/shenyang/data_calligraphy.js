/**
 * CGo OpenMap - 沈阳地铁站名题字数据
 *
 * 仅收录经实拍核实、由名人或书法家题写站名的车站，按车站 ID 索引
 * （与 data_stations.js 的 key 一致）。
 *
 * 字段说明
 *   image       题字横图路径（站点根相对 URL，如 ./city/shenyang/assets/...）。
 *               素材要求：黑底白字高对比图（PNG/JPEG），展示时经 CSS luminance
 *               蒙版将黑底褪为透明、字迹着色为当前标题栏文字色，
 *               亮 / 暗主题自动切换并保留飞白浓淡
 *   ratio       图片原始宽高比 (width / height)，供标题栏等比排版
 *   alt         无障碍题名（含末尾「站」字），同时作为吸附侧栏标题文本来源
 *   calligrapher.name   题字人姓名
 *   calligrapher.intro  生平简介完整句（含姓名主语，可信 HTML）；
 *                       卡片引导句为「本站站名由 XX 题写。」，
 *                       intro 必须自带主语，避免出现「男，生于……」式残句
 *
 * 生平文案以题字人公开身份 / 沈阳地铁官方口径为准，不臆测题写渊源、不自行增补。
 */
const CALLIGRAPHY_DATA = {
    // 1号线东延段，站名由辽宁 / 沈阳书法界名家题写
    "0123": {
        image: "./city/shenyang/assets/calligraphy/xinhuijie.png",
        ratio: 4.48,
        alt: "新惠街站",
        calligrapher: {
            name: "王贺良",
            intro: "王贺良，辽宁省书协顾问，辽宁书法“九畹”之一"
        }
    },
    "0124": {
        image: "./city/shenyang/assets/calligraphy/xinningjie.png",
        ratio: 3.593,
        alt: "新宁街站",
        calligrapher: {
            name: "宋慧莹",
            intro: "宋慧莹，辽宁省书协顾问"
        }
    },
    "0125": {
        image: "./city/shenyang/assets/calligraphy/dongdayingjie.png",
        ratio: 6.118,
        alt: "东大营街站",
        calligrapher: {
            name: "宋鍦",
            intro: "宋鍦，辽宁省职工书协主席、沈阳市职工书协主席"
        }
    },
    "0126": {
        image: "./city/shenyang/assets/calligraphy/nongyedaxue.png",
        ratio: 4.064,
        alt: "农业大学站",
        calligrapher: {
            name: "卢林",
            intro: "卢林，沈阳市书协主席"
        }
    },
    "0127": {
        image: "./city/shenyang/assets/calligraphy/qianling.png",
        ratio: 3.322,
        alt: "前陵站",
        calligrapher: {
            name: "张殿忠",
            intro: "张殿忠，沈阳市书协副主席"
        }
    },
    "0128": {
        image: "./city/shenyang/assets/calligraphy/donglinggongyuan.png",
        ratio: 4.075,
        alt: "东陵公园站",
        calligrapher: {
            name: "李仲元",
            intro: "李仲元，沈阳市书协名誉主席，辽宁书法“九畹”之一"
        }
    },
    "0129": {
        image: "./city/shenyang/assets/calligraphy/shuiquan.png",
        ratio: 3.55,
        alt: "水泉站",
        calligrapher: {
            name: "胡崇炜",
            intro: "胡崇炜，辽宁省书协主席"
        }
    },
    "0130": {
        image: "./city/shenyang/assets/calligraphy/boguanbeidajie.png",
        ratio: 4.379,
        alt: "伯官北大街站",
        calligrapher: {
            name: "朱成国",
            intro: "朱成国，沈阳市书协顾问"
        }
    },
    "0131": {
        image: "./city/shenyang/assets/calligraphy/zhiwuyuan.png",
        ratio: 4.328,
        alt: "植物园站",
        calligrapher: {
            name: "董文",
            intro: "董文，沈阳市书协名誉主席，辽宁书法“九畹”之一"
        }
    },
    "0132": {
        image: "./city/shenyang/assets/calligraphy/shuangma.png",
        ratio: 3.222,
        alt: "双马站",
        calligrapher: {
            name: "陈洪普",
            intro: "陈洪普，沈阳市书协副主席兼秘书长"
        }
    }
};

window.CALLIGRAPHY_DATA = CALLIGRAPHY_DATA;
