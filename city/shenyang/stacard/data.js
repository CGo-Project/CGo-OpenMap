/**
 * CGo OpenMap - 沈阳车站卡片数据
 *
 * 以“车站 ID → 线路 ID → 卡片信息”保存卡片专属内容，与线路图坐标和标签数据分离。
 * 所有卡片信息均按线路保存；即使同一物理车站的内容暂时相同，也应分别
 * 记录在对应线路下，以便后续补充各线站厅、出入口和运营差异。
 * `destination` 使用 "line-first" / "line-last" 时，渲染器会根据
 * data_lines.js 中当前线路的站点序列自动解析目的地；区间车等特殊终到
 * 情况填写明确的车站 ID。
 */

const SHENYANG_STACARD_DATA = {
    "0101": {
        SYM01: {
            location: "十三号街与开发大路交叉路口处",
            serviceHours: [
                {
                    destination: "line-last",
                    summer: { first: "05:30", last: "22:30" },
                    winter: { first: "05:30", last: "22:20" }
                }
            ]
        }
    },
    "0102": {
        SYM01: {
            location: "中央大街与开发大路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:28", last: "00:14" },
                    winter: { first: "06:28", last: "23:34" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:32", last: "23:02" },
                    winter: { first: "05:32", last: "22:22" }
                }
            ]
        }
    },
    "0103": {
        SYM01: {
            location: "七号街与开发大路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:25", last: "00:12" },
                    winter: { first: "06:25", last: "23:32" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:34", last: "23:04" },
                    winter: { first: "05:34", last: "22:24" }
                }
            ]
        }
    },
    "0104": {
        SYM01: {
            location: "三号街与开发大路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:23", last: "00:10" },
                    winter: { first: "06:23", last: "23:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:36", last: "23:06" },
                    winter: { first: "05:36", last: "22:26" }
                }
            ]
        }
    },
    "0105": {
        SYM01: {
            location: "昆明湖街与沧海路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:21", last: "00:07" },
                    winter: { first: "06:21", last: "23:27" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:38", last: "23:08" },
                    winter: { first: "05:38", last: "22:28" }
                }
            ]
        }
    },
    "0106": {
        SYM01: {
            location: "太湖街与沈新路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:18", last: "00:05" },
                    winter: { first: "06:18", last: "23:25" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:41", last: "23:11" },
                    winter: { first: "05:41", last: "22:31" }
                }
            ]
        }
    },
    "0107": {
        SYM01: {
            location: "太湖街与黄海路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:16", last: "00:02" },
                    winter: { first: "06:16", last: "23:22" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:43", last: "23:13" },
                    winter: { first: "05:43", last: "22:33" }
                }
            ]
        }
    },
    "0108": {
        SYM01: {
            location: "沈大路与洪湖北街交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:13", last: "00:00" },
                    winter: { first: "06:13", last: "23:20" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:46", last: "23:16" },
                    winter: { first: "05:46", last: "22:36" }
                }
            ]
        }
    },
    "0109": {
        SYM01: {
            location: "建设大路与富工四街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:11", last: "00:57" },
                    winter: { first: "06:11", last: "23:17" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:48", last: "23:18" },
                    winter: { first: "05:48", last: "22:38" }
                }
            ]
        }
    },
    "0110": {
        SYM01: {
            location: "建设西路与启工街交汇处以东",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:09", last: "00:55" },
                    winter: { first: "06:09", last: "23:15" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:50", last: "23:20" },
                    winter: { first: "05:50", last: "22:40" }
                }
            ]
        }
    },
    "0111": {
        SYM01: {
            location: "保工北街与建设中路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:07", last: "00:53" },
                    winter: { first: "06:07", last: "23:13" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:52", last: "23:22" },
                    winter: { first: "05:52", last: "22:42" }
                }
            ]
        }
    },
    "0112": {
        SYM01: {
            location: "建设大路与兴华街交汇口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:05", last: "00:51" },
                    winter: { first: "06:05", last: "23:11" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:55", last: "23:25" },
                    winter: { first: "05:55", last: "22:45" }
                }
            ]
        },
        SYM09: {
            location: "建设大路与兴华街交汇口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:45", last: "23:41" },
                    winter: { first: "05:45", last: "23:01" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:11", last: "23:11" },
                    winter: { first: "06:11", last: "22:31" }
                }
            ]
        },
    },
    "0113": {
        SYM01: {
            location: "云峰北街与北四东路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:02", last: "23:49" },
                    winter: { first: "06:02", last: "23:09" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:57", last: "23:27" },
                    winter: { first: "05:57", last: "22:47" }
                }
            ]
        },
    },
    "0114": {
        SYM01: {
            location: "中华路与胜利南街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:00", last: "23:46" },
                    winter: { first: "06:00", last: "23:06" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:00", last: "23:30" },
                    winter: { first: "06:00", last: "22:50" }
                }
            ]
        },
    },
    "0115": {
        SYM01: {
            location: "中华路与南京街交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:14", last: "23:44" },
                    winter: { first: "06:14", last: "23:04" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:03", last: "23:33" },
                    winter: { first: "06:03", last: "22:53" }
                }
            ]
        },
        SYM04: {
            location: "南京街与南一马路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:59", last: "23:29" },
                    winter: { first: "05:59", last: "22:49" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:58", last: "23:27" },
                    winter: { first: "05:58", last: "22:48" }
                }
            ]
        },
    },
    "0116": {
        SYM01: {
            location: "十一纬路与南四经街、南五经街交叉口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:12", last: "23:42" },
                    winter: { first: "06:12", last: "23:02" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:05", last: "23:35" },
                    winter: { first: "06:05", last: "22:55" }
                }
            ]
        },
    },
    "0117": {
        SYM01: {
            location: "青年大街与十一纬路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:09", last: "23:39" },
                    winter: { first: "06:09", last: "22:59" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:07", last: "23:37" },
                    winter: { first: "06:07", last: "22:57" }
                }
            ]
        },
        SYM02: {
            location: "青年大街与十一纬路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:59", last: "23:29" },
                    winter: { first: "05:59", last: "22:49" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:58", last: "23:27" },
                    winter: { first: "05:58", last: "22:48" }
                }
            ]
        },
    },
    "0118": {
        SYM01: {
            location: "西顺城街与大西路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:07", last: "23:37" },
                    winter: { first: "06:07", last: "22:57" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:09", last: "23:39" },
                    winter: { first: "06:09", last: "22:59" }
                }
            ]
        },
    },
    "0119": {
        SYM01: {
            location: "中街路与朝阳街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:04", last: "23:34" },
                    winter: { first: "06:04", last: "22:54" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:12", last: "23:42" },
                    winter: { first: "06:12", last: "23:02" }
                }
            ]
        },
    },
    "0120": {
        SYM01: {
            location: "小东路与小什字街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:02", last: "23:32" },
                    winter: { first: "06:02", last: "22:52" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:14", last: "23:44" },
                    winter: { first: "06:14", last: "23:04" }
                }
            ]
        },
    },
    "0121": {
        SYM01: {
            location: "滂江街与富裕路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:00", last: "23:30" },
                    winter: { first: "06:00", last: "22:50" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:17", last: "23:47" },
                    winter: { first: "06:17", last: "23:07" }
                }
            ]
        },
        SYM10: {
            location: "沈海立交桥南端",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:50", last: "23:20" },
                    winter: { first: "05:50", last: "22:40" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:00", last: "23:30" },
                    winter: { first: "06:00", last: "22:50" }
                }
            ]
        },
    },
    "0122": {
        SYM01: {
            location: "和睦路与黎明五街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:57", last: "23:27" },
                    winter: { first: "05:57", last: "22:47" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:19", last: "23:49" },
                    winter: { first: "06:19", last: "23:09" }
                }
            ]
        },
    },
    "0123": {
        SYM01: {
            location: "和睦路与新惠街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:55", last: "23:25" },
                    winter: { first: "05:55", last: "22:45" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:22", last: "23:52" },
                    winter: { first: "06:22", last: "23:12" }
                }
            ]
        },
    },
    "0124": {
        SYM01: {
            location: "东陵路与新宁街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:52", last: "23:22" },
                    winter: { first: "05:52", last: "22:42" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:24", last: "23:54" },
                    winter: { first: "06:24", last: "23:14" }
                }
            ]
        },
    },
    "0125": {
        SYM01: {
            location: "东陵路与东大营街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:50", last: "23:20" },
                    winter: { first: "05:50", last: "22:40" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:27", last: "23:57" },
                    winter: { first: "06:27", last: "23:17" }
                }
            ]
        },
    },
    "0126": {
        SYM01: {
            location: "东陵路与神农路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:47", last: "23:17" },
                    winter: { first: "05:47", last: "22:37" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:29", last: "23:59" },
                    winter: { first: "06:29", last: "23:19" }
                }
            ]
        },
    },
    "0127": {
        SYM01: {
            location: "东陵路与李东路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:45", last: "23:15" },
                    winter: { first: "05:45", last: "22:35" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:32", last: "00:02" },
                    winter: { first: "06:32", last: "23:22" }
                }
            ]
        },
    },
    "0128": {
        SYM01: {
            location: "双园路与东高线交叉口西侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:42", last: "23:12" },
                    winter: { first: "05:42", last: "22:32" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:34", last: "00:04" },
                    winter: { first: "06:34", last: "23:24" }
                }
            ]
        },
    },
    "0129": {
        SYM01: {
            location: "中水街与中旅万科城道路交叉路口北侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:38", last: "23:08" },
                    winter: { first: "05:38", last: "22:28" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:39", last: "00:09" },
                    winter: { first: "06:39", last: "23:29" }
                }
            ]
        },
    },
    "0130": {
        SYM01: {
            location: "博福路与伯官北大街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:35", last: "23:05" },
                    winter: { first: "05:35", last: "22:25" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:42", last: "00:12" },
                    winter: { first: "06:42", last: "23:32" }
                }
            ]
        },
    },
    "0131": {
        SYM01: {
            location: "规划双马地块西侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:32", last: "23:02" },
                    winter: { first: "05:32", last: "22:22" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:44", last: "00:14" },
                    winter: { first: "06:44", last: "23:34" }
                }
            ]
        },
    },
    "0132": {
        SYM01: {
            location: "规划双马地块北侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:30", last: "23:00" },
                    winter: { first: "05:30", last: "22:20" }
                },
            ]
        },
    },
    "0257": {
        SYM02: {
            location: "物华街与蒲盈路交叉路口处",
            serviceHours: [
                {
                    destination: "line-last",
                    summer: { first: "06:00", last: "23:00" },
                    winter: { first: "06:00", last: "22:20" }
                },
            ]
        },
    },
    "0256": {
        SYM02: {
            location: "物华街与蒲河路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:28", last: "00:18" },
                    winter: { first: "06:28", last: "23:38" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:02", last: "23:02" },
                    winter: { first: "06:02", last: "22:22" }
                },
            ]
        },
    },
    "0255": {
        SYM02: {
            location: "蒲北路与人湖西街交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:25", last: "00:15" },
                    winter: { first: "06:25", last: "23:35" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:04", last: "23:04" },
                    winter: { first: "06:04", last: "22:24" }
                },
            ]
        },
    },
    "0254": {
        SYM02: {
            location: "道义南大街与蒲新路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:23", last: "00:13" },
                    winter: { first: "06:23", last: "23:33" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:06", last: "23:06" },
                    winter: { first: "06:06", last: "22:26" }
                },
            ]
        },
    },
    "0253": {
        SYM02: {
            location: "道义南大街与蒲昌路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:20", last: "00:10" },
                    winter: { first: "06:20", last: "23:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:00", last: "23:09" },
                    winter: { first: "06:00", last: "22:29" }
                },
            ]
        },
    },
    "0252": {
        SYM02: {
            location: "道义南大街与正良一路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:17", last: "00:07" },
                    winter: { first: "06:17", last: "23:27" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:02", last: "23:11" },
                    winter: { first: "06:02", last: "22:31" }
                },
            ]
        },
    },
    "0251": {
        SYM02: {
            location: "黄河北大街与闾山路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:14", last: "00:04" },
                    winter: { first: "06:14", last: "23:24" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:05", last: "23:14" },
                    winter: { first: "06:05", last: "22:34" }
                },
            ]
        },
    },
    "0201": {
        SYM02: {
            location: "黄河北大街与松山路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:11", last: "00:01" },
                    winter: { first: "06:11", last: "23:21" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:07", last: "23:16" },
                    winter: { first: "06:07", last: "22:36" }
                },
            ]
        },
    },
    "0202": {
        SYM02: {
            location: "黄河北大街与黄山路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:08", last: "23:58" },
                    winter: { first: "06:08", last: "23:18" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:10", last: "23:19" },
                    winter: { first: "06:20", last: "22:39" }
                },
            ]
        },
    },
    "0203": {
        SYM02: {
            location: "黄河北大街与龙山路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:06", last: "23:56" },
                    winter: { first: "06:06", last: "23:16" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:12", last: "23:21" },
                    winter: { first: "06:22", last: "22:41" }
                },
            ]
        },
    },
    "0204": {
        SYM02: {
            location: "泰山路与细河街交叉口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:03", last: "23:53" },
                    winter: { first: "06:03", last: "23:13" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:14", last: "23:23" },
                    winter: { first: "06:24", last: "22:43" }
                },
            ]
        },
    },
    "0205": {
        SYM02: {
            location: "北陵大街与崇山中路交叉口",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:01", last: "23:51" },
                    winter: { first: "06:01", last: "23:11" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:00", last: "23:25" },
                    winter: { first: "06:00", last: "22:45" }
                },
            ]
        },
        SYM10: {
            location: "北陵大街与崇山中路交叉口",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:03", last: "23:33" },
                    winter: { first: "06:03", last: "22:53" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:47", last: "23:17" },
                    winter: { first: "05:47", last: "22:37" }
                },
            ]
        },
    },
    "0206": {
        SYM02: {
            location: "北陵大街与岐山路交叉口",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:59", last: "23:49" },
                    winter: { first: "05:59", last: "23:09" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:02", last: "23:27" },
                    winter: { first: "06:02", last: "22:47" }
                },
            ]
        },
    },
    "0207": {
        SYM02: {
            location: "北站路与友好街丁字路口北侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:57", last: "23:47" },
                    winter: { first: "05:57", last: "23:07" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:04", last: "23:30" },
                    winter: { first: "06:04", last: "22:50" }
                },
            ]
        },
        SYM04: {
            location: "北站路与友好街丁字路口北侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:07", last: "23:37" },
                    winter: { first: "06:07", last: "22:57" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:50", last: "23:20" },
                    winter: { first: "05:50", last: "22:40" }
                },
            ]
        },
    },
    "0208": {
        SYM02: {
            location: "哈尔滨路与惠工街交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:55", last: "23:45" },
                    winter: { first: "05:55", last: "23:05" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:06", last: "23:31" },
                    winter: { first: "06:06", last: "22:51" }
                },
            ]
        },
    },
    "0209": {
        SYM02: {
            location: "市府大路与青年北大街交叉口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:53", last: "23:43" },
                    winter: { first: "05:53", last: "23:03" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:08", last: "23:33" },
                    winter: { first: "06:08", last: "22:53" }
                },
            ]
        },
    },
    "0211": {
        SYM02: {
            location: "青年大街与西滨河路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:48", last: "23:38" },
                    winter: { first: "05:48", last: "22:58" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:13", last: "23:38" },
                    winter: { first: "06:13", last: "22:58" }
                },
            ]
        },
    },
    "0212": {
        SYM02: {
            location: "青年大街与文化路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:46", last: "23:36" },
                    winter: { first: "05:46", last: "22:56" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:15", last: "23:41" },
                    winter: { first: "06:15", last: "23:01" }
                },
            ]
        },
        SYM03: {
            location: "文化路与青年大街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:00", last: "21:42" },
                    //winter: { first: "06:00", last: "21:42" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:00", last: "23:12" },
                    //winter: { first: "06:00", last: "23:12" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:23", last: "23:26" },
                    //winter: { first: "06:23", last: "23:26" }
                },
            ]
        }
    },
    "0213": {
        SYM02: {
            location: "青年大街与文体路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:43", last: "23:33" },
                    winter: { first: "05:43", last: "22:53" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:00", last: "23:43" },
                    winter: { first: "06:00", last: "23:03" }
                },
            ]
        },
    },
    "0214": {
        SYM02: {
            location: "青年大街与沈水路交汇口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:41", last: "23:31" },
                    winter: { first: "05:41", last: "22:51" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:02", last: "23:45" },
                    winter: { first: "06:02", last: "23:05" }
                },
            ]
        },
    },
    "0215": {
        SYM02: {
            location: "浑南四路与营盘北街交汇路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:39", last: "23:29" },
                    winter: { first: "05:39", last: "22:49" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:04", last: "23:48" },
                    winter: { first: "06:04", last: "23:08" }
                },
            ]
        },
        SYM09: {
            location: "浑南四路与营盘北街交汇路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:10", last: "23:10" },
                    winter: { first: "06:10", last: "22:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:43", last: "23:42" },
                    winter: { first: "05:43", last: "23:02" }
                },
            ]
        },
    },
    "0216": {
        SYM02: {
            location: "营盘西街与银卡路交汇路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:36", last: "23:26" },
                    winter: { first: "05:36", last: "22:46" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:06", last: "23:50" },
                    winter: { first: "06:06", last: "23:10" }
                },
            ]
        },
    },
    "0217": {
        SYM02: {
            location: "新隆街与世纪路交叉路口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:34", last: "23:24" },
                    winter: { first: "05:34", last: "22:44" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:09", last: "23:52" },
                    winter: { first: "06:09", last: "23:12" }
                },
            ]
        },
    },
    "0218": {
        SYM02: {
            location: "沈本大街与双深北路交汇路口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:32", last: "23:22" },
                    winter: { first: "05:32", last: "22:42" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:00", last: "23:55" },
                    winter: { first: "06:00", last: "23:15" }
                },
            ]
        },
    },
    "0219": {
        SYM02: {
            location: "双深路与全运站路交汇口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:30", last: "23:20" },
                    winter: { first: "05:30", last: "22:40" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:02", last: "23:57" },
                    winter: { first: "06:02", last: "23:17" }
                },
            ]
        },
    },
    "0220": {
        SYM02: {
            location: "沈本大街与高深东路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:39", last: "23:16" },
                    winter: { first: "05:39", last: "22:36" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:05", last: "00:00" },
                    winter: { first: "06:05", last: "23:20" }
                },
            ]
        },
    },
    "0221": {
        SYM02: {
            location: "沈中大街与高深东路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:37", last: "23:14" },
                    winter: { first: "05:37", last: "22:34" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:08", last: "00:03" },
                    winter: { first: "06:08", last: "23:23" }
                },
            ]
        },
    },
    "0222": {
        SYM02: {
            location: "智慧三街与全运三路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:34", last: "23:11" },
                    winter: { first: "05:34", last: "22:31" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:11", last: "00:06" },
                    winter: { first: "06:11", last: "23:26" }
                },
            ]
        },
    },
    "0223": {
        SYM02: {
            location: "智慧三街与新运河路交叉口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:32", last: "23:09" },
                    winter: { first: "05:32", last: "22:29" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:14", last: "00:09" },
                    winter: { first: "06:14", last: "23:29" }
                },
            ]
        },
    },
    "0224": {
        SYM02: {
            location: "智慧三街与创新一路交叉口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:30", last: "23:07" },
                    winter: { first: "05:30", last: "22:27" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:17", last: "00:12" },
                    winter: { first: "06:17", last: "23:32" }
                },
            ]
        },
    },
    "0225": {
        SYM02: {
            location: "智慧三街与创新二路南侧规划路交叉口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:04", last: "23:04" },
                    winter: { first: "06:04", last: "22:24" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:19", last: "00:14" },
                    winter: { first: "06:19", last: "23:34" }
                },
            ]
        },
    },
    "0226": {
        SYM02: {
            location: "桃仙机场T3航站楼北侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:00", last: "23:00" },
                    winter: { first: "06:00", last: "22:20" }
                },
            ]
        },
    },
    "0301": {
        SYM03: {
            location: "开发二十二号路路北，华晨宝马里达工厂6号门东侧300米",
            serviceHours: [
                {
                    destination: "line-last",
                    summer: { first: "05:30", last: "21:30" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0302": {
        SYM03: {
            location: "开发二十二号路与浑河二十六东街交汇处东北侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:34", last: "22:33" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:32", last: "21:32" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0303": {
        SYM03: {
            location: "开发二十二号路与浑河二十四东街交汇处东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:30", last: "22:30" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:36", last: "21:36" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0304": {
        SYM03: {
            location: "开发二十二号路与中德大街交汇处西侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:28", last: "22:27" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:38", last: "21:38" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0305": {
        SYM03: {
            location: "开发二十二号路与浑河十九街交汇处东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:24", last: "22:23" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:42", last: "21:42" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0306": {
        SYM03: {
            location: "浑河十五街与开发二十二号路交叉口",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:21", last: "22:20" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:45", last: "21:46" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0307": {
        SYM03: {
            location: "开发二十二号路与中央南大街交叉路口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:18", last: "22:16" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:48", last: "21:49" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0308": {
        SYM03: {
            location: "开发二十二号路（规划）与规划路交叉口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:15", last: "22:13" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:51", last: "21:52" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0309": {
        SYM03: {
            location: "开发二十二号路与浑河四街交叉路口东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:13", last: "22:11" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:53", last: "21:54" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0310": {
        SYM03: {
            location: "细河路与阳澄湖街交叉路口西侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:10", last: "22:08" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:56", last: "23:00" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0311": {
        SYM03: {
            location: "汪河路与千岛湖街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:07", last: "22:05" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:07", last: "23:35" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "05:59", last: "23:03" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0312": {
        SYM03: {
            location: "南阳湖街与汪河路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:05", last: "22:03" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:05", last: "23:33" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:01", last: "23:05" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0911": {
        SYM03: {
            location: "汪河路与大通湖街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:02", last: "22:00" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:02", last: "23:30" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:04", last: "23:07" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
        SYM09: {
            location: "大通湖街与汪河路交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:33", last: "23:30" },
                    winter: { first: "05:33", last: "22:50" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:23", last: "23:23" },
                    winter: { first: "06:23", last: "22:43" }
                },
            ]
        },
    },
    "0314": {
        SYM03: {
            location: "汪河路和吉力湖街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:00", last: "21:58" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:00", last: "23:28" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:07", last: "23:10" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0315": {
        SYM03: {
            location: "凌空一街与滑翔路西北侧交界处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:12", last: "21:55" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:12", last: "23:25" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:10", last: "23:13" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0414": {
        SYM03: {
            location: "南京南街与砂阳路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:10", last: "21:52" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:10", last: "23:22" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:12", last: "23:16" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
        SYM04: {
            location: "南京南街与砂阳路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:54", last: "23:24" },
                    winter: { first: "05:54", last: "22:44" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:03", last: "23:33" },
                    winter: { first: "06:03", last: "22:53" }
                },
            ]
        },
    },
    "0317": {
        SYM03: {
            location: "和平南大街与南八马路交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:07", last: "21:50" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:07", last: "23:20" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:14", last: "23:18" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0318": {
        SYM03: {
            location: "南五马路路北与振兴街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:05", last: "21:48" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:05", last: "23:18" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:17", last: "23:20" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0319": {
        SYM03: {
            location: "南五马路与光荣街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:03", last: "21:46" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:03", last: "23:16" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:18", last: "23:22" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0320": {
        SYM03: {
            location: "文化路与三好街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:01", last: "21:44" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:01", last: "23:14" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:20", last: "23:24" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0322": {
        SYM03: {
            location: "文化路与五爱街交汇处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:10", last: "21:40" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:10", last: "23:10" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:24", last: "23:28" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0323": {
        SYM03: {
            location: "文化路与小南街交汇处东侧200米",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:08", last: "21:38" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:08", last: "23:08" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:26", last: "23:29" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0324": {
        SYM03: {
            location: "文化东路与文富路交叉口",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:06", last: "21:36" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:06", last: "23:06" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:28", last: "23:31" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "0325": {
        SYM03: {
            location: "富民街与文化东路交汇处东侧",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:04", last: "21:34" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:04", last: "23:04" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:30", last: "23:33" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
    "1017": {
        SYM03: {
            location: "长青街与江东街交汇处东南角",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:02", last: "21:32" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:02", last: "23:02" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "line-last",
                    summer: { first: "06:32", last: "23:36" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
        SYM10: {
            location: "长青街与江东街交叉路口处",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "05:40", last: "23:10" },
                    winter: { first: "05:40", last: "22:30" },
                },
                {
                    destination: "line-last",
                    summer: { first: "06:10", last: "23:40" },
                    winter: { first: "06:10", last: "23:00" },
                },
            ]
        },
    },
    "0327": {
        SYM03: {
            location: "方和路8号",
            serviceHours: [
                {
                    destination: "line-first",
                    summer: { first: "06:00", last: "21:30" },
                    //winter: { first: "05:30", last: "21:30" }
                },
                {
                    destination: "0310",
                    summer: { first: "06:00", last: "23:00" },
                    //winter: { first: "05:30", last: "21:30" }
                },
            ]
        },
    },
};

/*
 * 4、9、10 号线补充数据。每项依次为：
 * [车站 ID, 线路 ID, 位置, [[目的地, 夏令首班, 夏令末班, 冬令末班], ...]]。
 * 官网仅公示夏令时；冬令时首班与夏令时相同，末班按现行规则提前 40 分钟。
 * 下方合并逻辑只填补不存在的线路键，已有手工数据保持优先。
 */
const SHENYANG_STACARD_SUPPLEMENT = [
    ["0401", "SYM04", "望花北街与正新路交叉路口处", [["line-last", "05:30", "23:00", "22:20"]]],
    ["0402", "SYM04", "文官街与劳动路交叉路口处", [["line-first", "06:24", "23:54", "23:14"], ["line-last", "05:32", "23:02", "22:22"]]],
    ["0403", "SYM04", "北大营街与轩兴四路交叉路口处", [["line-first", "06:22", "23:52", "23:12"], ["line-last", "05:34", "23:04", "22:24"]]],
    ["0404", "SYM04", "北大营街与观泉路交叉路口处", [["line-first", "06:19", "23:49", "23:09"], ["line-last", "05:37", "23:07", "22:27"]]],
    ["0405", "SYM04", "北大营街与南卡门路交叉路口处", [["line-first", "06:17", "23:47", "23:07"], ["line-last", "05:39", "23:09", "22:29"]]],
    ["1011", "SYM04", "合作街与北海街交叉路口处", [["line-first", "06:14", "23:44", "23:04"], ["line-last", "05:42", "23:12", "22:32"]]],
    ["0407", "SYM04", "联合路与临河路交叉路口东侧", [["line-first", "06:12", "23:42", "23:02"], ["line-last", "05:44", "23:14", "22:34"]]],
    ["0408", "SYM04", "联合路与八王寺街交叉路口西侧", [["line-first", "06:10", "23:40", "23:00"], ["line-last", "05:46", "23:16", "22:36"]]],
    ["0410", "SYM04", "南京北街与皇寺路交叉路口处", [["line-first", "06:04", "23:34", "22:54"], ["line-last", "05:52", "23:22", "22:42"]]],
    ["0411", "SYM04", "南京北街与市府大路交叉路口处", [["line-first", "06:02", "23:32", "22:52"], ["line-last", "05:54", "23:24", "22:44"]]],
    ["0413", "SYM04", "南京南街与南五马路交汇口处", [["line-first", "05:57", "23:27", "22:47"], ["line-last", "06:00", "23:29", "22:49"]]],
    ["0415", "SYM04", "南京南街与长白四街交汇口处", [["line-first", "05:51", "23:21", "22:41"], ["line-last", "06:06", "23:35", "22:55"]]],
    ["0416", "SYM04", "南京南街与长白中路交汇口处", [["line-first", "05:48", "23:18", "22:38"], ["line-last", "06:08", "23:38", "22:58"]]],
    ["0915", "SYM04", "南京南街与浑南西路交叉路口处", [["line-first", "05:46", "23:16", "22:36"], ["line-last", "06:11", "23:41", "23:01"]]],
    ["0418", "SYM04", "南京南街与金仓路交汇口处", [["line-first", "05:42", "23:12", "22:32"], ["line-last", "06:14", "23:44", "23:04"]]],
    ["0419", "SYM04", "南京南街与云杉路交汇处", [["line-first", "05:40", "23:10", "22:30"], ["line-last", "06:16", "23:46", "23:06"]]],
    ["0420", "SYM04", "红椿路与规划路交汇处", [["line-first", "05:38", "23:08", "22:28"], ["line-last", "06:19", "23:49", "23:09"]]],
    ["0421", "SYM04", "火石桥大街与全运二西路交汇处", [["line-first", "05:35", "23:05", "22:25"], ["line-last", "06:21", "23:51", "23:11"]]],
    ["0422", "SYM04", "沈阳南东街与新运河路交汇口", [["line-first", "05:32", "23:02", "22:22"], ["line-last", "06:24", "23:54", "23:14"]]],
    ["0423", "SYM04", "火石桥大街与创新路交叉口南侧", [["line-first", "05:30", "23:00", "22:20"]]],

    ["0901", "SYM09", "西江街与新开河交汇处北侧", [["line-last", "06:00", "23:00", "22:20"]]],
    ["0902", "SYM09", "宁山西路与淮河街交汇处", [["line-first", "05:54", "23:50", "23:10"], ["line-last", "06:02", "23:02", "22:22"]]],
    ["0903", "SYM09", "淮河南街与景山路交汇处", [["line-first", "05:52", "23:48", "23:08"], ["line-last", "06:04", "23:04", "22:24"]]],
    ["0904", "SYM09", "北一路与兴华北街交汇处", [["line-first", "05:49", "23:46", "23:06"], ["line-last", "06:07", "23:07", "22:27"]]],
    ["0905", "SYM09", "兴华北街与北二路交叉路口处", [["line-first", "05:47", "23:44", "23:04"], ["line-last", "06:09", "23:09", "22:29"]]],
    ["0907", "SYM09", "兴华南街与九马路交叉路口处", [["line-first", "05:43", "23:39", "22:59"], ["line-last", "06:13", "23:13", "22:33"]]],
    ["0908", "SYM09", "兴华南街与沈辽路交叉路口处", [["line-first", "05:41", "23:37", "22:57"], ["line-last", "06:15", "23:15", "22:35"]]],
    ["0909", "SYM09", "腾飞二街与南滑翔路交叉路口处", [["line-first", "05:39", "23:35", "22:55"], ["line-last", "06:17", "23:17", "22:37"]]],
    ["0910", "SYM09", "细河路与吉力湖街规划路交叉路口处", [["line-first", "05:36", "23:32", "22:52"], ["line-last", "06:20", "23:20", "22:40"]]],
    ["0912", "SYM09", "平融路与悦融路交叉路口处", [["line-first", "05:30", "23:26", "22:46"], ["line-last", "06:26", "23:26", "22:46"]]],
    ["0913", "SYM09", "平融路与沈苏西路交叉路口处", [["line-first", "06:24", "23:24", "22:44"], ["line-last", "05:30", "23:28", "22:48"]]],
    ["0914", "SYM09", "长白二街与浑南西路交叉路口处", [["line-first", "06:21", "23:21", "22:41"], ["line-last", "05:33", "23:31", "22:51"]]],
    ["0915", "SYM09", "南京南街与浑南西路交叉路口处", [["line-first", "06:19", "23:19", "22:39"], ["line-last", "05:35", "23:34", "22:54"]]],
    ["0916", "SYM09", "浑南西路南京街交汇口以东1千米", [["line-first", "06:16", "23:16", "22:36"], ["line-last", "05:37", "23:36", "22:56"]]],
    ["0917", "SYM09", "浑南西路与金阳大街交叉路口处", [["line-first", "06:15", "23:15", "22:35"], ["line-last", "05:39", "23:37", "22:57"]]],
    ["0918", "SYM09", "浑南西路与夹河街交叉路口处", [["line-first", "06:13", "23:13", "22:33"], ["line-last", "05:41", "23:39", "22:59"]]],
    ["0920", "SYM09", "浑南四路与天成街交叉路口处", [["line-first", "06:07", "23:07", "22:27"], ["line-last", "05:46", "23:45", "23:05"]]],
    ["0921", "SYM09", "浑南中路与朗日街交叉路口处", [["line-first", "06:04", "23:04", "22:24"], ["line-last", "05:49", "23:48", "23:08"]]],
    ["0922", "SYM09", "长青南街与浑南中路交叉路口处", [["line-first", "06:02", "23:02", "22:22"], ["line-last", "05:51", "23:50", "23:10"]]],
    ["0923", "SYM09", "浑南中路与文华街交叉路口西侧", [["line-first", "06:00", "23:00", "22:20"]]],

    ["1001", "SYM10", "元江街与赤山路交叉路口处", [["line-last", "05:30", "23:00", "22:20"]]],
    ["1002", "SYM10", "元江街与白山路交叉路口处北侧", [["line-first", "06:18", "23:48", "23:08"], ["line-last", "05:32", "23:02", "22:22"]]],
    ["1003", "SYM10", "向山路与向工街交叉路口北侧", [["line-first", "06:15", "23:45", "23:05"], ["line-last", "05:35", "23:05", "22:25"]]],
    ["1004", "SYM10", "昆山西路与塔湾街交叉路口西北侧", [["line-first", "06:12", "23:42", "23:02"], ["line-last", "05:37", "23:07", "22:27"]]],
    ["0902", "SYM10", "宁山西路与淮河街交汇处", [["line-first", "06:10", "23:40", "23:00"], ["line-last", "05:40", "23:10", "22:30"]]],
    ["1006", "SYM10", "怒江街与崇山路交叉路口处东南侧", [["line-first", "06:07", "23:37", "22:57"], ["line-last", "05:42", "23:12", "22:32"]]],
    ["1007", "SYM10", "长江街与崇山中路交叉路口处", [["line-first", "06:05", "23:35", "22:55"], ["line-last", "05:44", "23:14", "22:34"]]],
    ["1009", "SYM10", "陵东街与崇山东路交叉路口处", [["line-first", "06:00", "23:30", "22:50"], ["line-last", "05:49", "23:19", "22:39"]]],
    ["1010", "SYM10", "鸭绿江街与崇山东路交叉路口处", [["line-first", "05:58", "23:28", "22:48"], ["line-last", "05:51", "23:21", "22:41"]]],
    ["1011", "SYM10", "合作街与北海街交叉路口处", [["line-first", "05:55", "23:25", "22:45"], ["line-last", "05:54", "23:24", "22:44"]]],
    ["1012", "SYM10", "北海街与东北大马路交叉路口处", [["line-first", "05:53", "23:23", "22:43"], ["line-last", "05:57", "23:27", "22:47"]]],
    ["1014", "SYM10", "滂江街与长安路交叉路口处", [["line-first", "05:47", "23:17", "22:37"], ["line-last", "06:02", "23:32", "22:52"]]],
    ["1015", "SYM10", "滂江街与小河沿路交叉路口处", [["line-first", "05:45", "23:15", "22:35"], ["line-last", "06:05", "23:35", "22:55"]]],
    ["1016", "SYM10", "长青街与泉园一路丁字路口处", [["line-first", "05:42", "23:12", "22:32"], ["line-last", "06:08", "23:38", "22:58"]]],
    ["1018", "SYM10", "长青街与沈水东路交叉路口处南侧", [["line-first", "05:37", "23:07", "22:27"], ["line-last", "06:12", "23:42", "23:02"]]],
    ["0922", "SYM10", "长青南街与浑南中路交叉路口处", [["line-first", "05:35", "23:05", "22:25"], ["line-last", "06:15", "23:45", "23:05"]]],
    ["1020", "SYM10", "长青南街与汇泉东路交叉路口处南侧", [["line-first", "05:32", "23:02", "22:22"], ["line-last", "06:18", "23:48", "23:08"]]],
    ["1021", "SYM10", "长青南街与李相街交叉路口处", [["line-first", "05:30", "23:00", "22:20"]]],
];

for (const [stationId, lineId, location, timeRows] of SHENYANG_STACARD_SUPPLEMENT) {
    const stationData = SHENYANG_STACARD_DATA[stationId] || {};
    if (stationData[lineId]) continue;

    stationData[lineId] = {
        location,
        serviceHours: timeRows.map(([destination, first, summerLast, winterLast]) => ({
            destination,
            summer: { first, last: summerLast },
            winter: { first, last: winterLast }
        }))
    };
    SHENYANG_STACARD_DATA[stationId] = stationData;
}

export { SHENYANG_STACARD_DATA };
