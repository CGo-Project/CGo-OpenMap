/**
 * 青岛地铁建设进度数据
 * 数据源：青岛三期施工进度2(2).xlsx
 *
 * 处理规则：
 * 1. 施工状态、日期、区间名称均以源表为准，不使用外部资料补值；
 * 2. 源表“未知”或空日期统一显示为“—”；
 * 3. 既有运营车站不录入车站施工状态，但与在建车站相连的边界区间仍保留，并显示在在建车站信息卡中；
 * 4. 信息卡中的车站名始终读取 data_stations.js 的正式/当前显示名；
 * 5. 区间名保留源表写法，不做正式站名式校正；
 * 6. 日期保留源表精度。
 */
window.QINGDAO_CONSTRUCTION_DATA = {
    "QDM05": {
        "stations": {
            "M0221": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "麦岛"
            },
            "M0502": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "北山公园"
            },
            "M0503": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "福宁立交"
            },
            "M0314": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "宁夏路"
            },
            "M0817": {
                "date": "2024-07-29",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "澳柯玛桥"
            },
            "M0506": {
                "date": "—",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "镇江路"
            },
            "M0507": {
                "date": "2026-01-25",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "延安二路"
            },
            "M0421": {
                "date": "2026-05",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "昌乐路"
            },
            "M0509": {
                "date": "2024-06-18",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "八号码头"
            },
            "M0510": {
                "date": "2024-10-30",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "四方厂"
            },
            "M0511": {
                "date": "2026-01",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "海云庵"
            },
            "M0512": {
                "date": "2024-03-18",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "湖岛"
            },
            "M0513": {
                "date": "2023-12-13",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "瑞昌路"
            },
            "M0514": {
                "date": "2023-10-19",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "欢乐滨海城"
            },
            "M0515": {
                "date": "2024-04-05",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "环湾大道"
            },
            "M0516": {
                "date": "2026-02",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "镇平路"
            },
            "M0117": {
                "date": "2026-08-14",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "胜利桥"
            },
            "M0813": {
                "date": "2023-07-22",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "闫家山"
            },
            "M0519": {
                "date": "2024-07-05",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "重庆路"
            },
            "M0308": {
                "date": "2025-08-10",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "地铁大厦"
            },
            "M0521": {
                "date": "2023-12-31",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "滁州路"
            },
            "M0522": {
                "date": "2025-04-25",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "合肥路"
            },
            "M0412": {
                "date": "2025-11-04",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "大埠东"
            },
            "M0524": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "国信体育馆"
            },
            "M0525": {
                "date": "2025-10",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "青医东院"
            },
            "M0217": {
                "date": "2024-12-11",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "石老人浴场"
            },
            "M0527": {
                "date": "2024-07-31",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "云岭路"
            },
            "M0528": {
                "date": "—",
                "status": "暂未施工",
                "side": "",
                "sourceName": "石老人"
            }
        },
        "segments": {
            "M0221-M0502": {
                "name": "麦北区间",
                "from": "M0221",
                "to": "M0502",
                "details": [
                    {
                        "side": "左线",
                        "date": "2023-09-08",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2023-07-25",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0502-M0503": {
                "name": "北福区间",
                "from": "M0502",
                "to": "M0503",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-02",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2023-12-11",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0503-M0314": {
                "name": "福宁区间",
                "from": "M0503",
                "to": "M0314",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0314-M0817": {
                "name": "宁澳区间",
                "from": "M0314",
                "to": "M0817",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-11-20",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-08-28",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0817-M0506": {
                "name": "澳镇区间",
                "from": "M0817",
                "to": "M0506",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-08",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0506-M0507": {
                "name": "镇延区间",
                "from": "M0506",
                "to": "M0507",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-08-13",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0507-M0421": {
                "name": "延昌区间",
                "from": "M0507",
                "to": "M0421",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0421-M0509": {
                "name": "昌八区间",
                "from": "M0421",
                "to": "M0509",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12-18",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0509-M0510": {
                "name": "八四区间",
                "from": "M0509",
                "to": "M0510",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-07-20",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0510-M0511": {
                "name": "四海区间",
                "from": "M0510",
                "to": "M0511",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01-21",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0511-M0512": {
                "name": "海湖区间",
                "from": "M0511",
                "to": "M0512",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-07",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-06-20",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0512-M0513": {
                "name": "湖瑞区间",
                "from": "M0512",
                "to": "M0513",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-06",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-05-12",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0513-M0514": {
                "name": "瑞欢区间",
                "from": "M0513",
                "to": "M0514",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-12-26",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-09-15",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0514-M0515": {
                "name": "欢环区间",
                "from": "M0514",
                "to": "M0515",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-10-12",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-09-14",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0515-M0516": {
                "name": "环镇区间",
                "from": "M0515",
                "to": "M0516",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-02",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01-01",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0516-M0117": {
                "name": "镇胜区间",
                "from": "M0516",
                "to": "M0117",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-06-27",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-05-27",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0117-M0813": {
                "name": "胜闫区间",
                "from": "M0117",
                "to": "M0813",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-02-23",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2023-12-15",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0813-M0519": {
                "name": "闫重区间",
                "from": "M0813",
                "to": "M0519",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-03-20",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-03-10",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0519-M0308": {
                "name": "重地区间",
                "from": "M0519",
                "to": "M0308",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0308-M0521": {
                "name": "地滁区间",
                "from": "M0308",
                "to": "M0521",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-11-09",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-07-15",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0521-M0522": {
                "name": "滁合区间",
                "from": "M0521",
                "to": "M0522",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-05-06",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-05-29",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0522-M0412": {
                "name": "合劲区间",
                "from": "M0522",
                "to": "M0412",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-02",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-10-27",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0412-M0524": {
                "name": "劲国区间",
                "from": "M0412",
                "to": "M0524",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-01-14",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12-24",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0524-M0525": {
                "name": "国青区间",
                "from": "M0524",
                "to": "M0525",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-07-18",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0525-M0217": {
                "name": "青石区间",
                "from": "M0525",
                "to": "M0217",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-07-19",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-08-14",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0217-M0527": {
                "name": "石云区间",
                "from": "M0217",
                "to": "M0527",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-12-27",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01-06",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0527-M0528": {
                "name": "云石区间",
                "from": "M0527",
                "to": "M0528",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "暂未掘进"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "暂未掘进"
                    }
                ]
            }
        }
    },
    "QDM06": {
        "stations": {
            "M0631": {
                "date": "—",
                "status": "铁路青岛西站工程已预留",
                "side": "",
                "sourceName": "青岛西站"
            },
            "M0630": {
                "date": "—",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "海西路"
            },
            "M0629": {
                "date": "2025-05-17",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "东岳路"
            },
            "M0628": {
                "date": "—",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "灵山湾路"
            },
            "M0627": {
                "date": "2025-04-22",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "琅琊台路"
            },
            "M1312": {
                "date": "2025-11-25",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "双珠路"
            },
            "M0625": {
                "date": "2025-12",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "凤凰山路"
            },
            "M0624": {
                "date": "2025-07-13",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "朝阳山路"
            },
            "M0623": {
                "date": "2024-12-29",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "海南路"
            },
            "M0622": {
                "date": "2025-09-12",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "红树林"
            }
        },
        "segments": {
            "M0621-M0622": {
                "name": "红辛区间",
                "from": "M0621",
                "to": "M0622",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-01-26",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01-07",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0631-M0630": {
                "name": "青海区间",
                "from": "M0631",
                "to": "M0630",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-06-29",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-09-05",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0630-M0629": {
                "name": "海东区间",
                "from": "M0630",
                "to": "M0629",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-01-30",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12-26",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M0629-M0628": {
                "name": "东灵区间",
                "from": "M0629",
                "to": "M0628",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "暂未掘进"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12-26",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M0628-M0627": {
                "name": "灵琅区间",
                "from": "M0628",
                "to": "M0627",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-04-24",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "2026-03-20",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M0627-M1312": {
                "name": "琅双区间",
                "from": "M0627",
                "to": "M1312",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-01-09",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12-13",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1312-M0625": {
                "name": "双凤区间",
                "from": "M1312",
                "to": "M0625",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-08-06",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "暂未掘进"
                    }
                ]
            },
            "M0625-M0624": {
                "name": "凤朝区间",
                "from": "M0625",
                "to": "M0624",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-05-01",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-05-17",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0624-M0623": {
                "name": "朝海区间",
                "from": "M0624",
                "to": "M0623",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-09-01",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-09-19",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0623-M0622": {
                "name": "海红区间",
                "from": "M0623",
                "to": "M0622",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "暂未掘进"
                    },
                    {
                        "side": "右线",
                        "date": "2026-05-26",
                        "status": "区间掘进中"
                    }
                ]
            }
        }
    },
    "QDM07N": {
        "stations": {
            "M0701": {
                "date": "2024-01-31",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "营普路"
            },
            "M0702": {
                "date": "2024-05-30",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "北安"
            },
            "M0703": {
                "date": "—",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "青威路"
            },
            "M0704": {
                "date": "2025-06",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "鹤山路"
            },
            "M0705": {
                "date": "2025-05-15",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "蓝鳌路"
            },
            "M0706": {
                "date": "2024-04-30",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "文峰路"
            },
            "M0707": {
                "date": "2024-04-30",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "环秀"
            },
            "M0708": {
                "date": "2025-03-29",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "景岱"
            },
            "M0709": {
                "date": "2025-11",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "东城"
            },
            "M0710": {
                "date": "2024-07",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "前东城"
            },
            "M0711": {
                "date": "2024-07",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "周村"
            }
        },
        "segments": {
            "M0701-M0702": {
                "name": "北营区间",
                "from": "M0701",
                "to": "M0702",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-08-08",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-10-20",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0702-M0703": {
                "name": "青北区间",
                "from": "M0702",
                "to": "M0703",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-10",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0703-M0704": {
                "name": "鹤青区间",
                "from": "M0703",
                "to": "M0704",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-04-24",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-01",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0704-M0705": {
                "name": "蓝鹤区间",
                "from": "M0704",
                "to": "M0705",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-11",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-03",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0705-M0706": {
                "name": "文蓝区间",
                "from": "M0705",
                "to": "M0706",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-04-25",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-08-07",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0706-M0707": {
                "name": "环文区间",
                "from": "M0706",
                "to": "M0707",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-06-10",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-10-25",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0707-M0708": {
                "name": "景环区间",
                "from": "M0707",
                "to": "M0708",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-06-30",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-07-29",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0708-M0709": {
                "name": "东景区间",
                "from": "M0708",
                "to": "M0709",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-12",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0709-M0710": {
                "name": "前东区间",
                "from": "M0709",
                "to": "M0710",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M0710-M0711": {
                "name": "周前区间",
                "from": "M0710",
                "to": "M0711",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-01-20",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0711-M0712": {
                "name": "东周区间",
                "from": "M0711",
                "to": "M0712",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-05",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间贯通"
                    }
                ]
            }
        }
    },
    "QDM07S": {
        "stations": {
            "M0724": {
                "date": "2025-11-25",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "文安路"
            },
            "M0303": {
                "date": "2024-12-24",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "振华路"
            },
            "M0812": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "东南山"
            }
        },
        "segments": {
            "M0112-M0724": {
                "name": "文兴区间",
                "from": "M0112",
                "to": "M0724",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-08-20",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "2026-06-17",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M0724-M0303": {
                "name": "振文区间",
                "from": "M0724",
                "to": "M0303",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-02",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "2026-09-08",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0303-M0812": {
                "name": "沧振区间",
                "from": "M0303",
                "to": "M0812",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "暂未掘进"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "暂未掘进"
                    }
                ]
            }
        }
    },
    "QDM08B": {
        "stations": {
            "M0819": {
                "date": "2023-07-22",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "大沽河博物馆"
            },
            "M0820": {
                "date": "2023-10-26",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "少海北"
            },
            "M0821": {
                "date": "2024-01-30",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "太湖路"
            },
            "M0822": {
                "date": "2023-10-20",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "站前大道"
            },
            "M0823": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "海尔大道"
            },
            "M0824": {
                "date": "2024-01-26",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "温州路"
            },
            "M0825": {
                "date": "2024-08-16",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "福州南路"
            },
            "M0826": {
                "date": "2024-05-18",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "广州路"
            },
            "M0827": {
                "date": "2024-07-01",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "泸州路"
            },
            "M0828": {
                "date": "2013-11-10",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "兰州西路"
            },
            "M0829": {
                "date": "2024-03",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "胶州火车站"
            }
        },
        "segments": {
            "M0804-M0819": {
                "name": "大大区间",
                "from": "M0804",
                "to": "M0819",
                "parts": [
                    {
                        "name": "大大区间（大风段）",
                        "details": [
                            {
                                "side": "左线",
                                "date": "2024-07-11",
                                "status": "区间贯通"
                            },
                            {
                                "side": "右线",
                                "date": "2024-06-23",
                                "status": "区间贯通"
                            }
                        ]
                    },
                    {
                        "name": "大大区间（风大段）",
                        "details": [
                            {
                                "side": "左线",
                                "date": "2024-11-28",
                                "status": "区间贯通"
                            },
                            {
                                "side": "右线",
                                "date": "2024-12-28",
                                "status": "区间贯通"
                            }
                        ]
                    }
                ]
            },
            "M0819-M0820": {
                "name": "大少区间",
                "from": "M0819",
                "to": "M0820",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-08-30",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-07-01",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0820-M0821": {
                "name": "少太区间",
                "from": "M0820",
                "to": "M0821",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-05",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-12-09",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0821-M0822": {
                "name": "太站区间",
                "from": "M0821",
                "to": "M0822",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-11-05",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-04-26",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0822-M0823": {
                "name": "站海区间",
                "from": "M0822",
                "to": "M0823",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "暂未掘进"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "暂未掘进"
                    }
                ]
            },
            "M0823-M0824": {
                "name": "海温区间",
                "from": "M0823",
                "to": "M0824",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0824-M0825": {
                "name": "温福区间",
                "from": "M0824",
                "to": "M0825",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-04-22",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0825-M0826": {
                "name": "福广区间",
                "from": "M0825",
                "to": "M0826",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-12",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-09",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0826-M0827": {
                "name": "广泸区间",
                "from": "M0826",
                "to": "M0827",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-05",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-12",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0827-M0828": {
                "name": "泸兰区间",
                "from": "M0827",
                "to": "M0828",
                "details": [
                    {
                        "side": "左线",
                        "date": "2024-07-01",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-05-16",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0828-M0829": {
                "name": "兰胶区间",
                "from": "M0828",
                "to": "M0829",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2024-09-28",
                        "status": "区间贯通"
                    }
                ]
            }
        }
    },
    "QDM09": {
        "stations": {
            "M0913": {
                "date": "2025-01",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "海西村"
            },
            "M0912": {
                "date": "2025-12",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "皂户"
            },
            "M0911": {
                "date": "2024-10-07",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "城子"
            },
            "M0910": {
                "date": "2024-10-29",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "华城路"
            },
            "M0715": {
                "date": "2024-12-29",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "正阳中路"
            },
            "M0908": {
                "date": "2024-09-16",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "长城路"
            },
            "M0907": {
                "date": "2025-12-27",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "靖城路"
            },
            "M0906": {
                "date": "2024-12-24",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "荟城路"
            },
            "M0905": {
                "date": "2025-06-17",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "玉皇岭"
            },
            "M0904": {
                "date": "2025-07",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "西荆"
            },
            "M0903": {
                "date": "2025-01-08",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "正阳东路"
            },
            "M0902": {
                "date": "2026-05-06",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "惜福镇"
            },
            "M0901": {
                "date": "2025-08-20",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "前金社区"
            }
        },
        "segments": {
            "M0913-M0912": {
                "name": "西户区间",
                "from": "M0913",
                "to": "M0912",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-09",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0912-M0911": {
                "name": "户城区间",
                "from": "M0912",
                "to": "M0911",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "2025-11",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M0911-M0910": {
                "name": "城华区间",
                "from": "M0911",
                "to": "M0910",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-05-07",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-05-21",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0910-M0715": {
                "name": "华正区间",
                "from": "M0910",
                "to": "M0715",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-12-22",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-04-20",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0715-M0908": {
                "name": "正长区间",
                "from": "M0715",
                "to": "M0908",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-05-19",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-03-31",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0908-M0907": {
                "name": "长靖区间",
                "from": "M0908",
                "to": "M0907",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-12-25",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0907-M0906": {
                "name": "靖荟区间",
                "from": "M0907",
                "to": "M0906",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-07-10",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-08",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0906-M0905": {
                "name": "荟玉区间",
                "from": "M0906",
                "to": "M0905",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-08",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-07",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0905-M0904": {
                "name": "玉西区间",
                "from": "M0905",
                "to": "M0904",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-08-18",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "—",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0904-M0903": {
                "name": "西正区间",
                "from": "M0904",
                "to": "M0903",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-07",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-04-20",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0903-M0902": {
                "name": "正福区间",
                "from": "M0903",
                "to": "M0902",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-07-26",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-06-05",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0902-M0901": {
                "name": "福金区间",
                "from": "M0902",
                "to": "M0901",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-04-13",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-12",
                        "status": "区间贯通"
                    }
                ]
            }
        }
    },
    "QDM15": {
        "stations": {
            "M1501": {
                "date": "2024-06-13",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "四方厂"
            },
            "M1502": {
                "date": "2024-12-05",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "南万"
            },
            "M1503": {
                "date": "2024-06-24",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "天山二路"
            },
            "M1504": {
                "date": "2024-11-11",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "天山一路"
            },
            "M0713": {
                "date": "2025-07-23",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "沟岔"
            },
            "M1506": {
                "date": "2025-01",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "春阳路"
            },
            "M0907": {
                "date": "2025-12-27",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "靖城路"
            },
            "M1508": {
                "date": "2025-09",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "文阳路"
            },
            "M1509": {
                "date": "2024-11-21",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "体育馆"
            },
            "M1510": {
                "date": "—",
                "status": "主体结构施工",
                "side": "",
                "sourceName": "富民路"
            },
            "M1511": {
                "date": "2024-12-14",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "夏塔路"
            },
            "M1512": {
                "date": "2025-05",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "仙山路"
            },
            "M1513": {
                "date": "2024-11-08",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "玉霞路"
            },
            "M1514": {
                "date": "2025-08-20",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "丹山"
            },
            "M1515": {
                "date": "—",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "丹山南"
            },
            "M1516": {
                "date": "—",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "富锦路"
            },
            "M0208": {
                "date": "2025-06-11",
                "status": "主体结构封顶",
                "side": "",
                "sourceName": "下王埠"
            }
        },
        "segments": {
            "M1501-M1502": {
                "name": "万方区间",
                "from": "M1501",
                "to": "M1502",
                "parts": [
                    {
                        "name": "万方区间（风万段）",
                        "details": [
                            {
                                "side": "左线",
                                "date": "2026-01",
                                "status": "区间贯通"
                            },
                            {
                                "side": "右线",
                                "date": "2026-08",
                                "status": "区间贯通"
                            }
                        ]
                    },
                    {
                        "name": "万方区间（万风段）",
                        "details": [
                            {
                                "side": "左线",
                                "date": "2025-05",
                                "status": "区间贯通"
                            },
                            {
                                "side": "右线",
                                "date": "2025-08",
                                "status": "区间贯通"
                            }
                        ]
                    }
                ]
            },
            "M1502-M1503": {
                "name": "天南区间",
                "from": "M1502",
                "to": "M1503",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-05",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-02",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1503-M1504": {
                "name": "天天区间",
                "from": "M1503",
                "to": "M1504",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-07-06",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-05-11",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1504-M0713": {
                "name": "沟天区间",
                "from": "M1504",
                "to": "M0713",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-08-26",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-03",
                        "status": "区间贯通"
                    }
                ]
            },
            "M0713-M1506": {
                "name": "春沟区间",
                "from": "M0713",
                "to": "M1506",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-04",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "2026-06-26",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1506-M0907": {
                "name": "靖春区间",
                "from": "M1506",
                "to": "M0907",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "暂未掘进"
                    },
                    {
                        "side": "右线",
                        "date": "2026-08",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M0907-M1508": {
                "name": "文靖区间",
                "from": "M0907",
                "to": "M1508",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-09",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-05-14",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M1508-M1509": {
                "name": "体文区间",
                "from": "M1508",
                "to": "M1509",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-01-15",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-02-17",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1509-M1510": {
                "name": "富体区间",
                "from": "M1509",
                "to": "M1510",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-12",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1510-M1511": {
                "name": "夏富区间",
                "from": "M1510",
                "to": "M1511",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-07",
                        "status": "区间掘进中"
                    },
                    {
                        "side": "右线",
                        "date": "2025-04-18",
                        "status": "区间掘进中"
                    }
                ]
            },
            "M1511-M1512": {
                "name": "仙夏区间",
                "from": "M1511",
                "to": "M1512",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-09-17",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-11-27",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1512-M1513": {
                "name": "玉仙区间",
                "from": "M1512",
                "to": "M1513",
                "details": [
                    {
                        "side": "左线",
                        "date": "—",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-07-20",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1513-M1514": {
                "name": "丹玉区间",
                "from": "M1513",
                "to": "M1514",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-07",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-08-20",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1514-M1515": {
                "name": "丹丹区间",
                "from": "M1514",
                "to": "M1515",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-01",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-05",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1515-M1516": {
                "name": "富丹区间",
                "from": "M1515",
                "to": "M1516",
                "details": [
                    {
                        "side": "左线",
                        "date": "2026-01-08",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2026-01-31",
                        "status": "区间贯通"
                    }
                ]
            },
            "M1516-M0208": {
                "name": "下富区间",
                "from": "M1516",
                "to": "M0208",
                "details": [
                    {
                        "side": "左线",
                        "date": "2025-05",
                        "status": "区间贯通"
                    },
                    {
                        "side": "右线",
                        "date": "2025-06-20",
                        "status": "区间贯通"
                    }
                ]
            }
        }
    }
};
