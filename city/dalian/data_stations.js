/**
 * CGo OpenMap - 大连车站数据库 (city/dalian/data_stations.js)
 *
 * 数据来源：大连公共交通建设投资集团官网线网图的原始 JSON，更新时间为 2024-05-13。
 * 官网 1200×1000 示意图坐标已等比映射到本项目 2200×1400 画布；坐标仅用于图形排版。
 * 为改善线路图的留白与拐角观感，部分站点在映射坐标上做了局部排版偏移，详见对应线路控制点。
 * 原始数据未提供英文名的车站保留为空，避免使用未经核验的翻译。
 * 地图中英文标签支持在 cn/en 中使用 \n 或 <br> 换行；搜索和导航仍使用自动清理换行后的标准站名。
 * 站名前置图标使用 labelIcon: { src, alt?, title? }，也可使用 label: { cn, icon } 独立配置标签文本。
 */

const stationsData = {
    "1321": {
        "type": "dot",
        "x": 1358,
        "y": 227,
        "cn": "十三里",
        "en": "Shisanli",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1322": {
        "type": "dot",
        "x": 1404,
        "y": 227,
        "cn": "二十里堡",
        "en": "Ershilipu",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1324": {
        "type": "dot",
        "x": 1450,
        "y": 227,
        "cn": "三十里堡",
        "en": "Sanshilipu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1327": {
        "type": "dot",
        "x": 1495,
        "y": 227,
        "cn": "石河黄旗",
        "en": "Shihe Huangqi",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1328": {
        "type": "dot",
        "x": 1540,
        "y": 227,
        "cn": "普湾体育场",
        "en": "Puwan Stadium",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1329": {
        "type": "dot",
        "x": 1585,
        "y": 227,
        "cn": "石河北海",
        "en": "Shihe Beihai",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1331": {
        "type": "dot",
        "x": 1630,
        "y": 227,
        "cn": "长店堡",
        "en": "Changdianpu",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1332": {
        "type": "dot",
        "x": 1675,
        "y": 227,
        "cn": "大医三院",
        "en": "The Third Hospital of\n Dalian Medical University",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1333": {
        "type": "dot",
        "x": 1720,
        "y": 227,
        "cn": "海湾高中",
        "en": "Haiwan High School",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1334": {
        "type": "dot",
        "x": 1774,
        "y": 216,
        "cn": "普兰店开发区",
        "en": "Pulandian Development Zone",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "1336": {
        "type": "dot",
        "x": 1806,
        "y": 184,
        "cn": "普兰店振兴街",
        "en": "Pulandian Zhenxing Street",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0320": {
        "type": "dot",
        "x": 1302,
        "y": 263,
        "cn": "九里",
        "en": "Jiuli",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0319": {
        "type": "dot",
        "x": 1282,
        "y": 306,
        "cn": "十九局",
        "en": "CR 19th Bureau",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0318": {
        "type": "dot",
        "x": 1282,
        "y": 337,
        "cn": "和平路",
        "en": "Heping Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0317": {
        "type": "dot",
        "x": 1282,
        "y": 368,
        "cn": "东山路",
        "en": "Dongshan Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0316": {
        "type": "dot",
        "x": 1282,
        "y": 400,
        "cn": "鸿玮澜山",
        "en": "Phoenix Peak",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0315": {
        "type": "dot",
        "x": 1282,
        "y": 429,
        "cn": "通世泰",
        "en": "Tostem",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0308": {
        "type": "tsf",
        "x": 1282,
        "y": 465,
        "cn": "开发区",
        "en": "Dalian Development Zone",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0301": {
        "type": "tsf",
        "x": 1115,
        "y": 729,
        "cn": "大连站",
        "en": "Dalian Railway<br> Station",
        "labelIcon": {
            "src": "./city/dalian/assets/railway.svg",
            "title": "铁路换乘"
        },
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0302": {
        "type": "dot",
        "x": 1021,
        "y": 692,
        "cn": "香炉礁",
        "en": "Xianglujiao",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0303": {
        "type": "dot",
        "x": 1021,
        "y": 605,
        "cn": "金家街",
        "en": "Jinjia Street",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0304": {
        "type": "dot",
        "x": 1021,
        "y": 526,
        "cn": "泉水",
        "en": "Quanshui",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0305": {
        "type": "tsf",
        "x": 1115,
        "y": 465,
        "cn": "后盐",
        "en": "Houyan",
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0306": {
        "type": "dot",
        "x": 1183,
        "y": 465,
        "cn": "大连湾",
        "en": "Dalianwan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0307": {
        "type": "dot",
        "x": 1228,
        "y": 465,
        "cn": "金马路",
        "en": "Jinma Road",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0309": {
        "type": "dot",
        "x": 1342,
        "y": 465,
        "cn": "保税区",
        "en": "Free Trade Zone",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0310": {
        "type": "dot",
        "x": 1403,
        "y": 465,
        "cn": "双D港",
        "en": "DD Port",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0313": {
        "type": "dot",
        "x": 1454,
        "y": 465,
        "cn": "小窑湾",
        "en": "Xiaoyaowan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0311": {
        "type": "dot",
        "x": 1503,
        "y": 465,
        "cn": "金石滩",
        "en": "Golden Pebble Beach",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0201": {
        "type": "dot",
        "x": 1399,
        "y": 796,
        "cn": "海之韵",
        "en": "Haizhiyun",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0202": {
        "type": "dot",
        "x": 1358,
        "y": 796,
        "cn": "东海",
        "en": "Donghai",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0203": {
        "type": "dot",
        "x": 1317,
        "y": 796,
        "cn": "东港",
        "en": "Donggang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0204": {
        "type": "dot",
        "x": 1277,
        "y": 796,
        "cn": "会议中心",
        "en": "Conference Center",
        "align": "bottom-right",
        "offset": {
            "x": -10,
            "y": -2
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0205": {
        "type": "dot",
        "x": 1236,
        "y": 796,
        "cn": "港湾广场",
        "en": "Gangwan Square",
        "align": "top-right",
        "offset": {
            "x": -10,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0206": {
        "type": "dot",
        "x": 1196,
        "y": 796,
        "cn": "中山广场",
        "en": "Zhongshan Square",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.7
        }
    },
    "0207": {
        "type": "dot",
        "x": 1146,
        "y": 796,
        "cn": "友好广场",
        "en": "Youhao Square",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
    },
    "0208": {
        "type": "tsf",
        "x": 1115,
        "y": 796,
        "cn": "青泥洼桥",
        "en": "Qingniwaqiao",
        "align": "bottom-left",
        "offset": {
            "x": 0,
            "y": 3
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        }
    },
    "0209": {
        "type": "dot",
        "x": 1043,
        "y": 796,
        "cn": "一二九街",
        "en": "Yi'erjiu Street",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        }
    },
    "0210": {
        "type": "dot",
        "x": 998,
        "y": 796,
        "cn": "人民广场",
        "en": "Renmin Square",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.85
        }
    },
    "0211": {
        "type": "dot",
        "x": 956,
        "y": 796,
        "cn": "联合路",
        "en": "Lianhe Road",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 0.9
        }
    },
    "0113": {
        "type": "tsf",
        "x": 922,
        "y": 796,
        "cn": "西安路",
        "en": "Xi'an Road",
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0212": {
        "type": "dot",
        "x": 840,
        "y": 796,
        "cn": "交通大学",
        "en": "Dalian Jiaotong<br> University",
        "align": "bottom-left",
        "offset": {
            "x": 16,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0213": {
        "type": "dot",
        "x": 800,
        "y": 796,
        "cn": "辽师大",
        "en": "Liaoning Normal<br> University",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0214": {
        "type": "dot",
        "x": 760,
        "y": 796,
        "cn": "马栏广场",
        "en": "Malan Square",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0215": {
        "type": "dot",
        "x": 720,
        "y": 796,
        "cn": "湾家",
        "en": "Wanjia",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0216": {
        "type": "dot",
        "x": 680    ,
        "y": 796,
        "cn": "红旗西路",
        "en": "Hongqi West Road",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0217": {
        "type": "dot",
        "x": 633,
        "y": 753,
        "cn": "虹锦路",
        "en": "Hongjin Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0218": {
        "type": "dot",
        "x": 633,
        "y": 715,
        "cn": "虹港路",
        "en": "Honggang Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0219": {
        "type": "dot",
        "x": 633,
        "y": 668,
        "cn": "机场",
        "en": "Airport",
        "labelIcon": {
            "src": "./city/dalian/assets/airport.svg",
            "title": "机场"
        },
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0220": {
        "type": "dot",
        "x": 633,
        "y": 632,
        "cn": "辛寨子",
        "en": "Xinzhaizi",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0221": {
        "type": "dot",
        "x": 633,
        "y": 593,
        "cn": "前革",
        "en": "Qian'ge",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0222": {
        "type": "dot",
        "x": 633,
        "y": 546,
        "cn": "中革",
        "en": "Zhongge",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0223": {
        "type": "dot",
        "x": 633,
        "y": 508,
        "cn": "革镇堡",
        "en": "Gezhenpu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0224": {
        "type": "dot",
        "x": 687,
        "y": 456,
        "cn": "后革",
        "en": "Houge",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0225": {
        "type": "dot",
        "x": 749,
        "y": 456,
        "cn": "卫生中心",
        "en": "Health Center",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0226": {
        "type": "dot",
        "x": 807,
        "y": 456,
        "cn": "体育中心",
        "en": "Sports Center",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0227": {
        "type": "dot",
        "x": 864,
        "y": 456,
        "cn": "南关岭",
        "en": "Nanguanling",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0102": {
        "type": "tsf",
        "x": 922,
        "y": 456,
        "cn": "大连北站",
        "en": "Dalian North Railway Station",
        "labelIcon": {
            "src": "./city/dalian/assets/railway.svg",
            "title": "铁路换乘"
        },
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0101": {
        "type": "dot",
        "x": 922,
        "y": 405,
        "cn": "姚家",
        "en": "Yaojia",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0103": {
        "type": "dot",
        "x": 922,
        "y": 485,
        "cn": "华北路",
        "en": "Huabei Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0104": {
        "type": "dot",
        "x": 922,
        "y": 515,
        "cn": "华南北",
        "en": "Hua'nan North",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0105": {
        "type": "dot",
        "x": 922,
        "y": 544,
        "cn": "华南广场",
        "en": "Hua'nan Square",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0106": {
        "type": "dot",
        "x": 922,
        "y": 573,
        "cn": "千山路",
        "en": "Qianshan Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0107": {
        "type": "dot",
        "x": 922,
        "y": 603,
        "cn": "松江路",
        "en": "Songjiang Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0108": {
        "type": "dot",
        "x": 922,
        "y": 632,
        "cn": "东纬路",
        "en": "Dongwei Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0109": {
        "type": "dot",
        "x": 922,
        "y": 661,
        "cn": "春柳",
        "en": "Chunliu",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0110": {
        "type": "dot",
        "x": 922,
        "y": 690,
        "cn": "香工街",
        "en": "Xianggong Street",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0111": {
        "type": "dot",
        "x": 922,
        "y": 720,
        "cn": "中长街",
        "en": "Zhongchang Street",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0112": {
        "type": "dot",
        "x": 922,
        "y": 749,
        "cn": "兴工街",
        "en": "Xinggong Street",
        "align": "left",
        "offset": {
            "x": -6,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0114": {
        "type": "dot",
        "x": 922,
        "y": 847,
        "cn": "富国街",
        "en": "Fuguo Street",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0115": {
        "type": "dot",
        "x": 922,
        "y": 899,
        "cn": "会展中心",
        "en": "Convention & Exhibition Center",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0116": {
        "type": "dot",
        "x": 922,
        "y": 950,
        "cn": "星海广场",
        "en": "Xinghai Square",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0117": {
        "type": "dot",
        "x": 896,
        "y": 993,
        "cn": "大医二院",
        "en": "2nd Hospital of Dalian \nMedical University",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0118": {
        "type": "dot",
        "x": 868,
        "y": 1020,
        "cn": "黑石礁",
        "en": "Heishijiao",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0119": {
        "type": "dot",
        "x": 843,
        "y": 1045,
        "cn": "学苑广场",
        "en": "Xueyuan Square",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0120": {
        "type": "dot",
        "x": 818,
        "y": 1070,
        "cn": "海事大学",
        "en": "Dalian Maritime University",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0121": {
        "type": "dot",
        "x": 786,
        "y": 1103,
        "cn": "七贤岭",
        "en": "Qixianling",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0801": {
        "type": "tsf",
        "x": 710,
        "y": 1140,
        "cn": "河口",
        "en": "Hekou",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0802": {
        "type": "dot",
        "x": 661,
        "y": 1140,
        "cn": "蔡大岭",
        "en": "Caidaling",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0803": {
        "type": "dot",
        "x": 613,
        "y": 1140,
        "cn": "黄泥川",
        "en": "Huangnichuan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0804": {
        "type": "dot",
        "x": 564,
        "y": 1140,
        "cn": "龙王塘",
        "en": "Longwangtang",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0805": {
        "type": "dot",
        "x": 516,
        "y": 1140,
        "cn": "塔河湾",
        "en": "Tahewan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0806": {
        "type": "dot",
        "x": 467,
        "y": 1140,
        "cn": "旅顺",
        "en": "Lüshun",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0807": {
        "type": "dot",
        "x": 419,
        "y": 1140,
        "cn": "铁山",
        "en": "Tieshan",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0808": {
        "type": "dot",
        "x": 370,
        "y": 1140,
        "cn": "旅顺新港",
        "en": "Lüshun New Port",
        "align": "top",
        "offset": {
            "x": 0,
            "y": -4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0501": {
        "type": "dot",
        "x": 1234,
        "y": 1056,
        "cn": "虎滩新区",
        "en": "Hutan Xinqu",
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0502": {
        "type": "dot",
        "x": 1196,
        "y": 1019,
        "cn": "虎滩公园",
        "en": "Tigerbeach Park",
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0503": {
        "type": "dot",
        "x": 1162,
        "y": 985,
        "cn": "秀月街",
        "en": "Xiuyue Street",
        "align": "top-right",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0504": {
        "type": "dot",
        "x": 1135,
        "y": 957,
        "cn": "桃源",
        "en": "Taoyuan",
        "align": "bottom-left",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0505": {
        "type": "dot",
        "x": 1115,
        "y": 919,
        "cn": "青云街",
        "en": "Qingyun Street",
        "align": "right",
        "offset": {
            "x": 4,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0506": {
        "type": "dot",
        "x": 1115,
        "y": 882,
        "cn": "石葵路",
        "en": "Shikui Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0507": {
        "type": "dot",
        "x": 1115,
        "y": 848,
        "cn": "劳动公园",
        "en": "Labor Park",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0510": {
        "type": "dot",
        "x": 1115,
        "y": 652,
        "cn": "梭鱼湾南",
        "en": "Suoyuwan South",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0511": {
        "type": "dot",
        "x": 1115,
        "y": 625,
        "cn": "梭鱼湾",
        "en": "Suoyuwan",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0512": {
        "type": "dot",
        "x": 1115,
        "y": 598,
        "cn": "甘井子街",
        "en": "Ganjingzi Street",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0513": {
        "type": "dot",
        "x": 1115,
        "y": 576,
        "cn": "甘北路",
        "en": "Ganbei Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0514": {
        "type": "dot",
        "x": 1115,
        "y": 553,
        "cn": "中华东路",
        "en": "Zhonghua East Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0515": {
        "type": "dot",
        "x": 1115,
        "y": 528,
        "cn": "泉水东",
        "en": "Quanshui East",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0516": {
        "type": "dot",
        "x": 1115,
        "y": 503,
        "cn": "龙华路",
        "en": "Longhua Road",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0518": {
        "type": "dot",
        "x": 1115,
        "y": 391,
        "cn": "后关",
        "en": "Houguan",
        "align": "right",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "20101": {
        "type": "dot",
        "x": 932,
        "y": 759,
        "cn": "兴工街",
        "en": "Xinggong Street",
        "align": "right",
        hideLabel: true,
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
     },
    "20102": {
        "type": "dot",
        "x": 959,
        "y": 759,
        "cn": "振工街",
        "en": "Zhengong Street",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20103": {
        "type": "dot",
        "x": 986,
        "y": 759,
        "cn": "五一广场",
        "en": "Wuyi Square",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        }
     },
    "20104": {
        "type": "dot",
        "x": 1013,
        "y": 759,
        "cn": "大同街",
        "en": "Datong Street",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20105": {
        "type": "dot",
        "x": 1040,
        "y": 759,
        "cn": "北京街",
        "en": "Beijing Street",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20106": {
        "type": "dot",
        "x": 1067,
        "y": 759,
        "cn": "市场街",
        "en": "Shichang Street",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20107": {
        "type": "dot",
        "x": 1094,
        "y": 759,
        "cn": "东关街",
        "en": "Dongguan Street",
        "align": "bottom",
        "offset": {
            "x": -4,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.7
        }
     },
    "20108": {
        "type": "dot",
        "x": 1126,
        "y": 759,
        "cn": "大连火车站",
        "en": "Dalian Railway Station",
        "align": "top-right",
        "offset": {
            "x": -4,
            "y": 0
        },
        "textScale": {
            "cn": 0.7,
            "en": 0.6
        }
     },
    "20109": {
        "type": "dot",
        "x": 1158,
        "y": 759,
        "cn": "胜利桥",
        "en": "Shengliqiao",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20110": {
        "type": "dot",
        "x": 1190,
        "y": 759,
        "cn": "民生街",
        "en": "Minsheng Street",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.6
        }
     },
    "20111": {
        "type": "dot",
        "x": 1225,
        "y": 775,
        "cn": "民主广场",
        "en": "Minzhu Square",
        "align": "left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.8,
            "en": 0.8
        }
     },
    "20112": {
        "type": "dot",
        "x": 1225,
        "y": 806,
        "cn": "世纪街",
        "en": "Shiji Street",
        "align": "bottom-right",
        "offset": {
            "x": 0,
            "y": -10
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20113": {
        "type": "dot",
        "x": 1225,
        "y": 830,
        "cn": "三八广场",
        "en": "Sanba Square",
        "align": "left",
        "offset": {
            "x": 0,
            "y": 6
        },
        "textScale": {
            "cn": 0.8,
            "en": 0.9
        }
     },
    "20114": {
        "type": "dot",
        "x": 1240,
        "y": 845,
        "cn": "二七广场",
        "en": "Erqi Square",
        "align": "bottom-left",
        "offset": {
            "x": 0,
            "y": -1
        },
        "textScale": {
            "cn": 0.8,
            "en": 1
        }
     },
    "20115": {
        "type": "dot",
        "x": 1260,
        "y": 845,
        "cn": "寺儿沟",
        "en": "Siergou",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        }
     },
    "20116": {
        "type": "dot",
        "x": 1280,
        "y": 845,
        "cn": "春海街",
        "en": "Chunhai Street",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20117": {
        "type": "dot",
        "x": 1300,
        "y": 845,
        "cn": "华乐广场",
        "en": "Huale Square",
        "align": "bottom",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 0.8,
            "en": 0.9
        }
     },
    "20117-1": {
        "type": "dot",
        "x": 1310,
        "y": 845,
        "cn": "华乐广场",
        "en": "Huale Square",
        hideLabel: true,
        "align": "bottom",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 0.8,
            "en": 0.9
        }
     },
    "20118": {
        "type": "dot",
        "x": 1330,
        "y": 845,
        "cn": "海昌欣城",
        "en": "Haichangxincheng",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.8,
            "en": 0.9
        }
     },
    "20119": {
        "type": "dot",
        "x": 1355,
        "y": 845,
        "cn": "金广东海岸",
        "en": "Jinguangdonghaian",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.8,
            "en": 0.75
        }
     },
    "20120": {
        "type": "dot",
        "x": 1380,
        "y": 845,
        "cn": "海之韵公园",
        "en": "Haizhiyun Park",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.8,
            "en": 0.9
        }
     },
    "20201": {
        "type": "dot",
        "x": 912,
        "y": 759,
        "cn": "兴工街",
        "en": "Xinggong Street",
        "align": "left",
        hideLabel: true,
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
     },
    "20202": {
        "type": "dot",
        "x": 912,
        "y": 785,
        "cn": "锦辉商城",
        "en": "Jinhui Mall",
        "align": "left",
        "offset": {
            "x": 0,
            "y": -6
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        }
     },
    "20203": {
        "type": "dot",
        "x": 912,
        "y": 815,
        "cn": "解放广场",
        "en": "Jiefang Square",
        "align": "left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20204": {
        "type": "dot",
        "x": 912,
        "y": 845,
        "cn": "功成街",
        "en": "Gongcheng Street",
        "align": "left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20205": {
        "type": "dot",
        "x": 912,
        "y": 875,
        "cn": "和平广场",
        "en": "Heping Square",
        "align": "left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20206": {
        "type": "dot",
        "x": 912,
        "y": 905,
        "cn": "会展中心",
        "en": "Convention & Exhibition Center",
        "align": "left",
        hideLabel: true,
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20207": {
        "type": "dot",
        "x": 912,
        "y": 935,
        "cn": "星海广场",
        "en": "Xinghai Square",
        "align": "left",
        hideLabel: true,
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20208": {
        "type": "dot",
        "x": 908,
        "y": 967,
        "cn": "化物所",
        "en": "Institute of Chemical Physics",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20209": {
        "type": "dot",
        "x": 895,
        "y": 980,
        "cn": "大医二院",
        "en": "2nd Hospital of Dalian Medical University",
        "align": "top-left",
        hideLabel: true,
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20210": {
        "type": "dot",
        "x": 880,
        "y": 995,
        "cn": "星海公园",
        "en": "Xinghai Park",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        }
     },
    "20211": {
        "type": "dot",
        "x": 865,
        "y": 1010,
        "cn": "黑石礁",
        "en": "Heishijiao",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        },
        hideLabel: true,
     },
    "20212": {
        "type": "dot",
        "x": 845,
        "y": 1030,
        "cn": "学苑广场地铁站",
        "en": "Xueyuan Square Metro Station",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        },
     },
    "20213": {
        "type": "dot",
        "x": 823,
        "y": 1052,
        "cn": "海事大学",
        "en": "Dalian Maritime University",
        "align": "top-left",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        },
        hideLabel: true,
     },
    "20214": {
        "type": "dot",
        "x": 805,
        "y": 1070,
        "cn": "万达广场",
        "en": "Wanda Plaza",
        "align": "top-left",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.95
        },
     },
    "20215": {
        "type": "dot",
        "x": 785,
        "y": 1090,
        "cn": "七贤岭地铁站",
        "en": "Qixianling Metro Station",
        "align": "top-left",
        "offset": {
            "x": 6,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 0.9
        },
     },
    "20216": {
        "type": "dot",
        "x": 768,
        "y": 1107,
        "cn": "中国华录",
        "en": "China Hualu",
        "align": "top-left",
        "offset": {
            "x": 3,
            "y": 3
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        },
     },
    "20217": {
        "type": "dot",
        "x": 735,
        "y": 1110,
        "cn": "七贤岭",
        "en": "Qixianling",
        "align": "bottom",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        },
     },
    "20218": {
        "type": "dot",
        "x": 710,
        "y": 1110,
        "cn": "河口",
        "en": "Hekou",
        "align": "top-left",
        hideLabel: true,
        "offset": {
            "x": 10,
            "y": 0
        },
        "textScale": {
            "cn": 0.8,
            "en": 1
        },
     },
    "20219": {
        "type": "dot",
        "x": 660,
        "y": 1110,
        "cn": "小平岛前",
        "en": "Xiaopingdaoqian",
        "align": "top",
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        },
     },
     "DLT":
     {
        "type": "rdot",
        "x": 1125,
        "y": 739,
        "cn": "大连站",
        "en": "Dalian Railway Station",
        "align": "top",
        hideLabel: true,
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
            "en": 1
        },
     },
     "DFT":
     {
        "type": "rdot",
        "x": 922,
        "y": 456,
        "cn": "大连北站",
        "en": "Dalianbei Railway Station",
        "align": "top",
        hideLabel: true,
        "offset": {
            "x": 0,
            "y": 0
        },
        "textScale": {
            "cn": 0.9,
        }
     }
};

if (typeof window !== "undefined") window.stationsData = stationsData;
