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
        "type": "tsf",
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
        "en": "Dalian Railway Station",
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
    "0205": {
        "type": "dot",
        "x": 1236,
        "y": 796,
        "cn": "港湾广场",
        "en": "Gangwan Square",
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
            "cn": 1,
            "en": 1
        }
    },
    "0207": {
        "type": "dot",
        "x": 1156,
        "y": 796,
        "cn": "友好广场",
        "en": "Youhao Square",
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
    "0208": {
        "type": "tsf",
        "x": 1115,
        "y": 796,
        "cn": "青泥洼桥",
        "en": "Qingniwaqiao",
        "align": "bottom-left",
        "offset": {
            "x": 0,
            "y": 4
        },
        "textScale": {
            "cn": 1,
            "en": 1
        }
    },
    "0209": {
        "type": "dot",
        "x": 1063,
        "y": 796,
        "cn": "一二九街",
        "en": "Yi'erjiu Street",
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
    "0210": {
        "type": "dot",
        "x": 1018,
        "y": 796,
        "cn": "人民广场",
        "en": "Renmin Square",
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
    "0211": {
        "type": "dot",
        "x": 972,
        "y": 796,
        "cn": "联合路",
        "en": "Lianhe Road",
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
    "0113": {
        "type": "tsf",
        "x": 922,
        "y": 796,
        "cn": "西安路",
        "en": "Xi'an Road",
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
    "0212": {
        "type": "dot",
        "x": 873,
        "y": 796,
        "cn": "交通大学",
        "en": "Dalian Jiaotong University",
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
    "0213": {
        "type": "dot",
        "x": 825,
        "y": 796,
        "cn": "辽师大",
        "en": "Liaoning Normal University",
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
        "x": 780,
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
        "x": 737,
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
        "x": 694    ,
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
        "x": 863,
        "y": 1025,
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
        "x": 831,
        "y": 1057,
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
        "x": 798,
        "y": 1091,
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
        "x": 766,
        "y": 1123,
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
    }
};

if (typeof window !== "undefined") window.stationsData = stationsData;
