/**
 * CGo OpenMap - 福州车站首末班车时刻表 (city/fuzhou/data_timetable.js)
 *
 * 数据源：福州地铁官网「站点查询」(https://www.fzmtr.com/services/siteQuery?lineName=&stationName=)，
 * 于 2026-09-23 抓取；各站数据在官网的最后更新时间见每条记录的 updatedAt 字段。
 *
 * 结构说明：
 *   GLOBAL_SCHEDULE_DATA[线路ID][车站ID] = {
 *       cn, url, source, updatedAt,
 *       directions: { 终点站名: { first: 首班, last: 末班, text?: 官网原文 } },  // 终点站名不含「往」字
 *       fast?: { 终点站名: { text } }                                  // 仅滨海快线有直达/大站快车
 *   }。
 *   first / last 是官网的结构化时间（末班车跨日写法与官网一致，如「次日00:23」）；
 *   text 仅在官网原文不只是「首班车 X | 末班车 Y」时才写入 —— 即滨海快线要区分
 *   直达 / 大站 / 普通列车（如「第三列(普通) 06:51 | 末班车(普通) 23:14」）。
 *   FUZHOU_LINE_INTERVALS[线路ID] 为官网同页给出的各时段行车间隔。
 *
 * 覆盖情况：1/2/4/5 号线全部车站；6 号线缺 莲花、壶井，滨海快线缺 滨海西 —— 这三站在官网上尚未收录
 * （地图上均为未开通车站），因此不写入本文件，车站卡片对它们不显示首末班车模块。
 */

const GLOBAL_SCHEDULE_DATA = {
    "M1": {
        "M101": {
            cn: "象峰",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=象峰",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:12:11",
            directions: {
                "三江口": { first: "06:00", last: "23:30" },
                "象峰": { first: "06:53", last: "次日00:23" }
            }
        },
        "M102": {
            cn: "秀山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=秀山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:12:20",
            directions: {
                "三江口": { first: "06:02", last: "23:32" },
                "象峰": { first: "06:50", last: "次日00:20" }
            }
        },
        "M103": {
            cn: "罗汉山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=罗汉山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:12:31",
            directions: {
                "三江口": { first: "06:04", last: "23:34" },
                "象峰": { first: "06:48", last: "次日00:18" }
            }
        },
        "M104": {
            cn: "福州火车站",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=福州火车站",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:12:44",
            directions: {
                "三江口": { first: "06:07", last: "23:37" },
                "象峰": { first: "06:45", last: "次日00:15" }
            }
        },
        "M105": {
            cn: "斗门",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=斗门",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:12:51",
            directions: {
                "三江口": { first: "06:09", last: "23:39" },
                "象峰": { first: "06:43", last: "次日00:13" }
            }
        },
        "M106": {
            cn: "树兜",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=树兜",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:13:00",
            directions: {
                "三江口": { first: "06:11", last: "23:41" },
                "象峰": { first: "06:41", last: "次日00:11" }
            }
        },
        "M107": {
            cn: "屏山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=屏山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:13:06",
            directions: {
                "三江口": { first: "06:13", last: "23:43" },
                "象峰": { first: "06:39", last: "次日00:09" }
            }
        },
        "M108": {
            cn: "东街口",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=东街口",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:13:12",
            directions: {
                "三江口": { first: "06:15", last: "23:45" },
                "象峰": { first: "06:37", last: "次日00:07" }
            }
        },
        "M109": {
            cn: "南门兜",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=南门兜",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:13:18",
            directions: {
                "三江口": { first: "06:18", last: "23:48" },
                "象峰": { first: "06:35", last: "次日00:05" }
            }
        },
        "M110": {
            cn: "茶亭",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=茶亭",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:13:25",
            directions: {
                "三江口": { first: "06:20", last: "23:50" },
                "象峰": { first: "06:32", last: "次日00:02" }
            }
        },
        "M111": {
            cn: "达道",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=达道",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:13:32",
            directions: {
                "三江口": { first: "06:22", last: "23:52" },
                "象峰": { first: "06:30", last: "次日00:00" }
            }
        },
        "M112": {
            cn: "上藤",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=上藤",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 17:58:57",
            directions: {
                "三江口": { first: "06:25", last: "23:55" },
                "象峰": { first: "06:27", last: "23:57" }
            }
        },
        "M113": {
            cn: "三叉街",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=三叉街",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 17:59:24",
            directions: {
                "三江口": { first: "06:27", last: "23:57" },
                "象峰": { first: "06:25", last: "23:55" }
            }
        },
        "M114": {
            cn: "白湖亭",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=白湖亭",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:13:53",
            directions: {
                "三江口": { first: "06:30", last: "次日00:00" },
                "象峰": { first: "06:22", last: "23:52" }
            }
        },
        "M115": {
            cn: "葫芦阵",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=葫芦阵",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:00",
            directions: {
                "三江口": { first: "06:32", last: "次日00:02" },
                "象峰": { first: "06:20", last: "23:50" }
            }
        },
        "M116": {
            cn: "黄山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=黄山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:08",
            directions: {
                "三江口": { first: "06:34", last: "次日00:04" },
                "象峰": { first: "06:19", last: "23:49" }
            }
        },
        "M117": {
            cn: "排下",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=排下",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:14",
            directions: {
                "三江口": { first: "06:36", last: "次日00:06" },
                "象峰": { first: "06:16", last: "23:46" }
            }
        },
        "M118": {
            cn: "城门",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=城门",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:20",
            directions: {
                "三江口": { first: "06:37", last: "次日00:07" },
                "象峰": { first: "06:15", last: "23:45" }
            }
        },
        "M119": {
            cn: "三角埕",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=三角埕",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:26",
            directions: {
                "三江口": { first: "06:39", last: "次日00:09" },
                "象峰": { first: "06:13", last: "23:43" }
            }
        },
        "M120": {
            cn: "胪雷",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=胪雷",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:32",
            directions: {
                "三江口": { first: "06:42", last: "次日00:12" },
                "象峰": { first: "06:10", last: "23:40" }
            }
        },
        "M121": {
            cn: "福州火车南站",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=福州火车南站",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:38",
            directions: {
                "三江口": { first: "06:44", last: "次日00:14" },
                "象峰": { first: "06:08", last: "23:38" }
            }
        },
        "M122": {
            cn: "安平",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=安平",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:46",
            directions: {
                "三江口": { first: "06:47", last: "次日00:17" },
                "象峰": { first: "06:06", last: "23:36" }
            }
        },
        "M123": {
            cn: "梁厝",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=梁厝",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:52",
            directions: {
                "三江口": { first: "06:49", last: "次日00:19" },
                "象峰": { first: "06:03", last: "23:33" }
            }
        },
        "M124": {
            cn: "下洋",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=下洋",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:14:57",
            directions: {
                "三江口": { first: "06:51", last: "次日00:21" },
                "象峰": { first: "06:01", last: "23:31" }
            }
        },
        "M125": {
            cn: "三江口",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=1号线&stationName=三江口",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:15:03",
            directions: {
                "三江口": { first: "06:53", last: "次日00:23" },
                "象峰": { first: "06:00", last: "23:30" }
            }
        }
    },
    "M2": {
        "M201": {
            cn: "苏洋",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=苏洋",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:16:16",
            directions: {
                "洋里": { first: "06:00", last: "23:30" },
                "苏洋": { first: "06:53", last: "次日00:23" }
            }
        },
        "M202": {
            cn: "沙堤",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=沙堤",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:16:22",
            directions: {
                "洋里": { first: "06:03", last: "23:33" },
                "苏洋": { first: "06:50", last: "次日00:20" }
            }
        },
        "M203": {
            cn: "上街",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=上街",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:16:29",
            directions: {
                "洋里": { first: "06:05", last: "23:35" },
                "苏洋": { first: "06:47", last: "次日00:17" }
            }
        },
        "M204": {
            cn: "金屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=金屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:16:34",
            directions: {
                "洋里": { first: "06:08", last: "23:38" },
                "苏洋": { first: "06:44", last: "次日00:14" }
            }
        },
        "M205": {
            cn: "福州大学",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=福州大学",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:16:40",
            directions: {
                "洋里": { first: "06:10", last: "23:40" },
                "苏洋": { first: "06:42", last: "次日00:12" }
            }
        },
        "M206": {
            cn: "董屿·福建师大",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=董屿·福建师大",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:16:47",
            directions: {
                "洋里": { first: "06:13", last: "23:43" },
                "苏洋": { first: "06:39", last: "次日00:09" }
            }
        },
        "M207": {
            cn: "厚庭",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=厚庭",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:16:54",
            directions: {
                "洋里": { first: "06:15", last: "23:45" },
                "苏洋": { first: "06:37", last: "次日00:07" }
            }
        },
        "M208": {
            cn: "桔园洲",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=桔园洲",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:17:01",
            directions: {
                "洋里": { first: "06:19", last: "23:49" },
                "苏洋": { first: "06:34", last: "次日00:04" }
            }
        },
        "M209": {
            cn: "洪湾",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=洪湾",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:17:08",
            directions: {
                "洋里": { first: "06:21", last: "23:51" },
                "苏洋": { first: "06:32", last: "次日00:02" }
            }
        },
        "M210": {
            cn: "金山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=金山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:11:48",
            directions: {
                "洋里": { first: "06:24", last: "23:54" },
                "苏洋": { first: "06:29", last: "23:59" }
            }
        },
        "M211": {
            cn: "金祥",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=金祥",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:12:18",
            directions: {
                "洋里": { first: "06:25", last: "23:55" },
                "苏洋": { first: "06:27", last: "23:57" }
            }
        },
        "M212": {
            cn: "祥坂",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=祥坂",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:12:46",
            directions: {
                "洋里": { first: "06:29", last: "23:59" },
                "苏洋": { first: "06:24", last: "23:54" }
            }
        },
        "M213": {
            cn: "宁化",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=宁化",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:17:22",
            directions: {
                "洋里": { first: "06:31", last: "次日00:01" },
                "苏洋": { first: "06:22", last: "23:52" }
            }
        },
        "M214": {
            cn: "西洋",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=西洋",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:17:33",
            directions: {
                "洋里": { first: "06:34", last: "次日00:04" },
                "苏洋": { first: "06:19", last: "23:49" }
            }
        },
        "M109": {
            cn: "南门兜",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=南门兜",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:17:44",
            directions: {
                "洋里": { first: "06:36", last: "次日00:06" },
                "苏洋": { first: "06:17", last: "23:47" }
            }
        },
        "M216": {
            cn: "水部",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=水部",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:17:50",
            directions: {
                "洋里": { first: "06:38", last: "次日00:08" },
                "苏洋": { first: "06:14", last: "23:44" }
            }
        },
        "M217": {
            cn: "紫阳",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=紫阳",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:17:57",
            directions: {
                "洋里": { first: "06:41", last: "次日00:11" },
                "苏洋": { first: "06:12", last: "23:42" }
            }
        },
        "M218": {
            cn: "五里亭",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=五里亭",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:18:05",
            directions: {
                "洋里": { first: "06:43", last: "次日00:13" },
                "苏洋": { first: "06:09", last: "23:39" }
            }
        },
        "M219": {
            cn: "前屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=前屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:18:12",
            directions: {
                "洋里": { first: "06:46", last: "次日00:16" },
                "苏洋": { first: "06:07", last: "23:37" }
            }
        },
        "M220": {
            cn: "上洋",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=上洋",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:18:20",
            directions: {
                "洋里": { first: "06:48", last: "次日00:18" },
                "苏洋": { first: "06:05", last: "23:35" }
            }
        },
        "M221": {
            cn: "鼓山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=鼓山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:18:28",
            directions: {
                "洋里": { first: "06:51", last: "次日00:21" },
                "苏洋": { first: "06:02", last: "23:32" }
            }
        },
        "M222": {
            cn: "洋里",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=2号线&stationName=洋里",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:18:35",
            directions: {
                "洋里": { first: "06:53", last: "次日00:23" },
                "苏洋": { first: "06:00", last: "23:30" }
            }
        }
    },
    "M3": {
        "M401": {
            cn: "半洲",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=半洲",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:18:52",
            directions: {
                "帝封江": { first: "06:00", last: "23:30" },
                "半洲": { first: "06:52", last: "次日00:22" }
            }
        },
        "M402": {
            cn: "建新",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=建新",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:18:59",
            directions: {
                "帝封江": { first: "06:02", last: "23:32" },
                "半洲": { first: "06:50", last: "次日00:20" }
            }
        },
        "M403": {
            cn: "洪塘",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=洪塘",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:06",
            directions: {
                "帝封江": { first: "06:04", last: "23:34" },
                "半洲": { first: "06:48", last: "次日00:18" }
            }
        },
        "M404": {
            cn: "金牛山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=金牛山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:13",
            directions: {
                "帝封江": { first: "06:06", last: "23:36" },
                "半洲": { first: "06:45", last: "次日00:15" }
            }
        },
        "M405": {
            cn: "凤凰池",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=凤凰池",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:19",
            directions: {
                "帝封江": { first: "06:09", last: "23:39" },
                "半洲": { first: "06:43", last: "次日00:13" }
            }
        },
        "M406": {
            cn: "陆庄",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=陆庄",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:25",
            directions: {
                "帝封江": { first: "06:11", last: "23:41" },
                "半洲": { first: "06:41", last: "次日00:11" }
            }
        },
        "M407": {
            cn: "西门",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=西门",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:30",
            directions: {
                "帝封江": { first: "06:13", last: "23:43" },
                "半洲": { first: "06:39", last: "次日00:09" }
            }
        },
        "M108": {
            cn: "东街口",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=东街口",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:36",
            directions: {
                "帝封江": { first: "06:15", last: "23:45" },
                "半洲": { first: "06:37", last: "次日00:07" }
            }
        },
        "M409": {
            cn: "省立医院",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=省立医院",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:42",
            directions: {
                "帝封江": { first: "06:17", last: "23:47" },
                "半洲": { first: "06:35", last: "次日00:05" }
            }
        },
        "M410": {
            cn: "东门",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=东门",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:48",
            directions: {
                "帝封江": { first: "06:19", last: "23:49" },
                "半洲": { first: "06:32", last: "次日00:02" }
            }
        },
        "M411": {
            cn: "三角池",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=三角池",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:19:53",
            directions: {
                "帝封江": { first: "06:21", last: "23:51" },
                "半洲": { first: "06:30", last: "次日00:00" }
            }
        },
        "M412": {
            cn: "竹屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=竹屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:22:29",
            directions: {
                "帝封江": { first: "06:24", last: "23:54" },
                "半洲": { first: "06:28", last: "23:58" }
            }
        },
        "M413": {
            cn: "横屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=横屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:22:46",
            directions: {
                "帝封江": { first: "06:27", last: "23:57" },
                "半洲": { first: "06:25", last: "23:55" }
            }
        },
        "M414": {
            cn: "后屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=后屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:22:59",
            directions: {
                "帝封江": { first: "06:29", last: "23:59" },
                "半洲": { first: "06:23", last: "23:53" }
            }
        },
        "M219": {
            cn: "前屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=前屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:03",
            directions: {
                "帝封江": { first: "06:31", last: "次日00:01" },
                "半洲": { first: "06:21", last: "23:51" }
            }
        },
        "M416": {
            cn: "光明港",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=光明港",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:11",
            directions: {
                "帝封江": { first: "06:33", last: "次日00:03" },
                "半洲": { first: "06:19", last: "23:49" }
            }
        },
        "M417": {
            cn: "鳌峰洲",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=鳌峰洲",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:20",
            directions: {
                "帝封江": { first: "06:35", last: "次日00:05" },
                "半洲": { first: "06:16", last: "23:46" }
            }
        },
        "M418": {
            cn: "花海公园",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=花海公园",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:27",
            directions: {
                "帝封江": { first: "06:38", last: "次日00:08" },
                "半洲": { first: "06:13", last: "23:43" }
            }
        },
        "M419": {
            cn: "会展中心",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=会展中心",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:34",
            directions: {
                "帝封江": { first: "06:41", last: "次日00:11" },
                "半洲": { first: "06:11", last: "23:41" }
            }
        },
        "M420": {
            cn: "林浦",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=林浦",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:41",
            directions: {
                "帝封江": { first: "06:44", last: "次日00:14" },
                "半洲": { first: "06:08", last: "23:38" }
            }
        },
        "M118": {
            cn: "城门",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=城门",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:47",
            directions: {
                "帝封江": { first: "06:47", last: "次日00:17" },
                "半洲": { first: "06:04", last: "23:34" }
            }
        },
        "M422": {
            cn: "螺洲温泉",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=螺洲温泉",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:20:54",
            directions: {
                "帝封江": { first: "06:49", last: "次日00:19" },
                "半洲": { first: "06:02", last: "23:32" }
            }
        },
        "M423": {
            cn: "帝封江",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=4号线&stationName=帝封江",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:21:02",
            directions: {
                "帝封江": { first: "06:52", last: "次日00:22" },
                "半洲": { first: "06:00", last: "23:30" }
            }
        }
    },
    "M4": {
        "M401_2": {
            cn: "荆溪厚屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=荆溪厚屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:21:37",
            directions: {
                "福州火车南站": { first: "06:00", last: "23:30" },
                "荆溪厚屿": { first: "06:48", last: "次日00:25" }
            }
        },
        "M402_2": {
            cn: "农林大学",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=农林大学",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:21:44",
            directions: {
                "福州火车南站": { first: "06:04", last: "23:34" },
                "荆溪厚屿": { first: "06:44", last: "次日00:21" }
            }
        },
        "M403": {
            cn: "洪塘",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=洪塘",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:21:51",
            directions: {
                "福州火车南站": { first: "06:06", last: "23:37" },
                "荆溪厚屿": { first: "06:42", last: "次日00:18" }
            }
        },
        "M404_2": {
            cn: "阵坂",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=阵坂",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:21:59",
            directions: {
                "福州火车南站": { first: "06:08", last: "23:39" },
                "荆溪厚屿": { first: "06:39", last: "次日00:16" }
            }
        },
        "M405_2": {
            cn: "马榕",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=马榕",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:05",
            directions: {
                "福州火车南站": { first: "06:11", last: "23:43" },
                "荆溪厚屿": { first: "06:36", last: "次日00:12" }
            }
        },
        "M210": {
            cn: "金山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=金山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:12",
            directions: {
                "福州火车南站": { first: "06:14", last: "23:45" },
                "荆溪厚屿": { first: "06:34", last: "次日00:10" }
            }
        },
        "M407_2": {
            cn: "凤岗里",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=凤岗里",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:18",
            directions: {
                "福州火车南站": { first: "06:16", last: "23:48" },
                "荆溪厚屿": { first: "06:32", last: "次日00:07" }
            }
        },
        "M408": {
            cn: "浦上大道",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=浦上大道",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:25",
            directions: {
                "福州火车南站": { first: "06:18", last: "23:50" },
                "荆溪厚屿": { first: "06:30", last: "次日00:05" }
            }
        },
        "M409_2": {
            cn: "霞镜",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=霞镜",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:32",
            directions: {
                "福州火车南站": { first: "06:20", last: "23:53" },
                "荆溪厚屿": { first: "06:28", last: "次日00:02" }
            }
        },
        "M410_2": {
            cn: "东岭",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=东岭",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:20:42",
            directions: {
                "福州火车南站": { first: "06:22", last: "23:55" },
                "荆溪厚屿": { first: "06:25", last: "23:59" }
            }
        },
        "M411_2": {
            cn: "台屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=台屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-08-28 18:21:04",
            directions: {
                "福州火车南站": { first: "06:25", last: "23:58" },
                "荆溪厚屿": { first: "06:23", last: "23:57" }
            }
        },
        "M412_2": {
            cn: "盘屿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=盘屿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:44",
            directions: {
                "福州火车南站": { first: "06:27", last: "次日00:00" },
                "荆溪厚屿": { first: "06:21", last: "23:54" }
            }
        },
        "M413_2": {
            cn: "吴山",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=吴山",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:53",
            directions: {
                "福州火车南站": { first: "06:30", last: "次日00:04" },
                "荆溪厚屿": { first: "06:18", last: "23:51" }
            }
        },
        "M414_2": {
            cn: "盖山竹榄",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=盖山竹榄",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:22:59",
            directions: {
                "福州火车南站": { first: "06:32", last: "次日00:06" },
                "荆溪厚屿": { first: "06:16", last: "23:49" }
            }
        },
        "M415": {
            cn: "义序",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=义序",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:23:05",
            directions: {
                "福州火车南站": { first: "06:34", last: "次日00:09" },
                "荆溪厚屿": { first: "06:13", last: "23:46" }
            }
        },
        "M423": {
            cn: "帝封江",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=帝封江",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:23:14",
            directions: {
                "福州火车南站": { first: "06:36", last: "次日00:11" },
                "荆溪厚屿": { first: "06:11", last: "23:44" }
            }
        },
        "M417_2": {
            cn: "螺洲古镇",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=螺洲古镇",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:23:20",
            directions: {
                "福州火车南站": { first: "06:39", last: "次日00:14" },
                "荆溪厚屿": { first: "06:09", last: "23:41" }
            }
        },
        "M418_2": {
            cn: "前锦",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=前锦",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:23:27",
            directions: {
                "福州火车南站": { first: "06:41", last: "次日00:17" },
                "荆溪厚屿": { first: "06:06", last: "23:38" }
            }
        },
        "M419_2": {
            cn: "龙江",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=龙江",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:23:35",
            directions: {
                "福州火车南站": { first: "06:44", last: "次日00:20" },
                "荆溪厚屿": { first: "06:04", last: "23:35" }
            }
        },
        "M121": {
            cn: "福州火车南站",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=5号线&stationName=福州火车南站",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-09-11 18:23:48",
            directions: {
                "福州火车南站": { first: "06:48", last: "次日00:25" },
                "荆溪厚屿": { first: "06:00", last: "23:30" }
            }
        }
    },
    "M5": {
        "M516": {
            cn: "万寿",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=万寿",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:41:03",
            directions: {
                "万寿": { first: "06:42", last: "23:12" },
                "潘墩": { first: "06:00", last: "22:30" }
            }
        },
        "M514": {
            cn: "下吴",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=下吴",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:40:34",
            directions: {
                "万寿": { first: "06:38", last: "23:08" },
                "潘墩": { first: "06:04", last: "22:34" }
            }
        },
        "M512": {
            cn: "沙京",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=沙京",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:40:01",
            directions: {
                "万寿": { first: "06:33", last: "23:03" },
                "潘墩": { first: "06:09", last: "22:39" }
            }
        },
        "M511": {
            cn: "鹤上",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=鹤上",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:39:27",
            directions: {
                "万寿": { first: "06:31", last: "23:01" },
                "潘墩": { first: "06:11", last: "22:41" }
            }
        },
        "M510": {
            cn: "吴航",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=吴航",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:39:00",
            directions: {
                "万寿": { first: "06:28", last: "22:58" },
                "潘墩": { first: "06:14", last: "22:44" }
            }
        },
        "M509": {
            cn: "十洋",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=十洋",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:38:40",
            directions: {
                "万寿": { first: "06:25", last: "22:55" },
                "潘墩": { first: "06:16", last: "22:46" }
            }
        },
        "M508": {
            cn: "郑和",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=郑和",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:38:12",
            directions: {
                "万寿": { first: "06:23", last: "22:53" },
                "潘墩": { first: "06:18", last: "22:48" }
            }
        },
        "M507": {
            cn: "航城",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=航城",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:37:40",
            directions: {
                "万寿": { first: "06:21", last: "22:51" },
                "潘墩": { first: "06:21", last: "22:51" }
            }
        },
        "M506": {
            cn: "营前",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=营前",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:37:04",
            directions: {
                "万寿": { first: "06:18", last: "22:48" },
                "潘墩": { first: "06:24", last: "22:54" }
            }
        },
        "M124": {
            cn: "下洋",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=下洋",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:36:38",
            directions: {
                "万寿": { first: "06:10", last: "22:40" },
                "潘墩": { first: "06:32", last: "23:02" }
            }
        },
        "M123": {
            cn: "梁厝",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=梁厝",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:36:06",
            directions: {
                "万寿": { first: "06:08", last: "22:38" },
                "潘墩": { first: "06:34", last: "23:04" }
            }
        },
        "M503": {
            cn: "樟岚",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=樟岚",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:35:31",
            directions: {
                "万寿": { first: "06:05", last: "22:35" },
                "潘墩": { first: "06:37", last: "23:07" }
            }
        },
        "M420": {
            cn: "林浦",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=林浦",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-03-11 17:50:23",
            directions: {
                "万寿": { first: "06:02", last: "22:32" },
                "潘墩": { first: "06:40", last: "23:10" }
            }
        },
        "M501": {
            cn: "潘墩",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=6号线&stationName=潘墩",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:34:41",
            directions: {
                "万寿": { first: "06:00", last: "22:30" },
                "潘墩": { first: "06:42", last: "23:12" }
            }
        }
    },
    "M6": {
        "M615": {
            cn: "文岭",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=文岭",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-06 17:53:46",
            directions: {
                "文岭": { first: "06:55", last: "23:18", text: "第三列(普通) 06:55 | 末班车(普通) 23:18" },
                "福州火车站": { first: "06:00", last: "22:30", text: "第二列(普通) 06:00 | 末班车(普通) 22:30" }
            },
            fast: {
                "文岭": { text: "第一列(直达) 06:34 | 第二列(大站) 06:41" },
                "福州火车站": { text: "第一列(大站) 05:55" }
            }
        },
        "M614": {
            cn: "机场",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=机场",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-06 17:53:33",
            directions: {
                "文岭": { first: "06:51", last: "23:14", text: "第三列(普通) 06:51 | 末班车(普通) 23:14" },
                "福州火车站": { first: "06:04", last: "22:34", text: "第二列(普通) 06:04 | 末班车(普通) 22:34" }
            },
            fast: {
                "文岭": { text: "第一列(直达) 06:30 | 第二列(大站) 06:38" },
                "福州火车站": { text: "第一列(大站) 06:00" }
            }
        },
        "M613": {
            cn: "滨海中央商务区",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=滨海中央商务区",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:57:29",
            directions: {
                "文岭": { first: "06:44", last: "23:07", text: "第三列(普通) 06:44 | 末班车(普通) 23:07" },
                "福州火车站": { first: "06:10", last: "22:40", text: "第二列(普通) 06:10 | 末班车(普通) 22:40" }
            }
        },
        "M612": {
            cn: "大数据",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=大数据",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-07-29 17:17:40",
            directions: {
                "文岭": { first: "06:42", last: "23:05", text: "第三列(普通) 06:42 | 末班车(普通) 23:05" },
                "福州火车站": { first: "06:12", last: "22:42", text: "第二列(普通) 06:12 | 末班车(普通) 22:42" }
            },
            fast: {
                "文岭": { text: "第二列(大站) 06:29" },
                "福州火车站": { text: "第一列(大站) 06:07" }
            }
        },
        "M609": {
            cn: "首占",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=首占",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:55:57",
            directions: {
                "文岭": { first: "06:34", last: "22:57", text: "第三列(普通) 06:34 | 末班车(普通) 22:57" },
                "福州火车站": { first: "06:21", last: "22:51", text: "第二列(普通) 06:21 | 末班车(普通) 22:51" }
            }
        },
        "M608": {
            cn: "祥谦",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=祥谦",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:55:36",
            directions: {
                "文岭": { first: "06:27", last: "22:50", text: "第三列(普通) 06:27 | 末班车(普通) 22:50" },
                "福州火车站": { first: "06:27", last: "22:57", text: "第二列(普通) 06:27 | 末班车(普通) 22:57" }
            }
        },
        "M423": {
            cn: "帝封江",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=帝封江",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-06 17:52:33",
            directions: {
                "文岭": { first: "06:21", last: "22:44", text: "第三列(普通) 06:21 | 末班车(普通) 22:44" },
                "福州火车站": { first: "06:33", last: "23:03", text: "第二列(普通) 06:33 | 末班车(普通) 23:03" }
            },
            fast: {
                "文岭": { text: "第二列(大站) 06:11" },
                "福州火车站": { text: "第一列(大站) 06:25" }
            }
        },
        "M605": {
            cn: "三叉街（滨海快线）",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=三叉街（滨海快线）",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-06 17:51:48",
            directions: {
                "文岭": { first: "06:16", last: "22:39", text: "第三列(普通) 06:16 | 末班车(普通) 22:39" },
                "福州火车站": { first: "06:38", last: "23:08", text: "第二列(普通) 06:38 | 末班车(普通) 23:08" }
            },
            fast: {
                "文岭": { text: "第一列(直达) 06:02 | 第二列(大站) 06:07" },
                "福州火车站": { text: "第一列(大站) 06:29" }
            }
        },
        "M604": {
            cn: "南公园",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=南公园",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 17:53:33",
            directions: {
                "文岭": { first: "06:13", last: "22:36", text: "第三列(普通) 06:13 | 末班车(普通) 22:36" },
                "福州火车站": { first: "06:41", last: "23:11", text: "第二列(普通) 06:41 | 末班车(普通) 23:11" }
            }
        },
        "M603": {
            cn: "闽都",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=闽都",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-02 18:44:10",
            directions: {
                "文岭": { first: "06:11", last: "22:34", text: "第三列(普通) 06:11 | 末班车(普通) 22:34" },
                "福州火车站": { first: "06:43", last: "23:13", text: "第二列(普通) 06:43 | 末班车(普通) 23:13" }
            },
            fast: {
                "文岭": { text: "第一列(直达) 05:59" }
            }
        },
        "M410": {
            cn: "东门",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=东门",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-06 17:50:37",
            directions: {
                "文岭": { first: "06:09", last: "22:32", text: "第三列(普通) 06:09 | 末班车(普通) 22:32" },
                "福州火车站": { first: "06:45", last: "23:15", text: "第二列(普通) 06:45 | 末班车(普通) 23:15" }
            },
            fast: {
                "文岭": { text: "第二列(大站) 06:02" },
                "福州火车站": { text: "第一列(大站) 06:35" }
            }
        },
        "M104": {
            cn: "福州火车站",
            url: "https://www.fzmtr.com/services/siteQuery?lineName=滨海快线&stationName=福州火车站",
            source: "福州地铁官网「站点查询」",
            updatedAt: "2026-02-06 17:49:56",
            directions: {
                "文岭": { first: "06:07", last: "22:30", text: "第三列(普通) 06:07 | 末班车(普通) 22:30" },
                "福州火车站": { first: "06:48", last: "23:18", text: "第二列(普通) 06:48 | 末班车(普通) 23:18" }
            },
            fast: {
                "文岭": { text: "第一列(直达) 05:55 | 第二列(大站) 06:00" },
                "福州火车站": { text: "第一列(大站) 06:37" }
            }
        }
    }
};

/** 各线路的行车间隔（来源同上，官网按高峰 / 平峰 / 低峰分别给出） */
const FUZHOU_LINE_INTERVALS = {
    "M1": {
        peak: "高峰时段(工作日7:00-9:00、17:00-19:00，休息日17:00-19:00）：行车间隔约 4分30秒～5分钟 / 班（超高峰时段7:30-8:30、17:45-18:45最小4分30秒）",
        offPeak: "平峰时段(工作日 6:30-7:00、9:00-17:00、19:00-22:00，休息日 6:30-22:00扣除高峰期)：行车间隔约 6分50秒 / 班",
        lowPeak: "低峰时段(工作日及休息日 22:00-23:00)：行车间隔约 10分钟 / 班"
    },
    "M2": {
        peak: "高峰时段(工作日 7:00-9:00、17:00-19:00，休息日 17:00-19:00)：行车间隔约 4分30秒~5分钟 / 班（超高峰时段7:30-8:30、17:45-18:45最小4分30秒）",
        offPeak: "平峰时段(工作日 6:30-7:00、9:00-17:00、19:00-22:00，休息日 6:30-22:00扣除高峰期)：行车间隔约 6分50秒 / 班",
        lowPeak: "低峰期(工作日及休息日 22:00-23:00)：行车间隔约 10分钟 / 班"
    },
    "M3": {
        peak: "高峰时段(工作日 7:00-9:00、17:00-19:00，休息日 17:00-19:00)：行车间隔约 5分30秒 / 班",
        offPeak: "平峰时段(工作日 6:30-7:00、9:00-17:00、19:00-22:00，休息日 6:30-22:00扣除高峰期)：行车间隔约 6分50秒 / 班",
        lowPeak: "低峰时段(工作日及休息日 22:00-23:00)：行车间隔约 10分钟 / 班"
    },
    "M4": {
        peak: "高峰时段(工作日 7:00-9:00、17:00-19:00)：行车间隔约 6分50秒 / 班",
        offPeak: "平峰时段(工作日 6:30-7:00、9:00-17:00、19:00-22:00，休息日 6:30-22:00)：行车间隔约 7分50秒 / 班",
        lowPeak: "低峰时段(工作日及休息日 22:00-23:00)：行车间隔约 10分钟 / 班"
    },
    "M5": {
        peak: "高峰时段(工作日 7:00-9:00、17:00-19:00)：行车间隔约 7分50秒 / 班",
        offPeak: "平峰时段(工作日 6:30-7:00、9:00-17:00、19:00-22:00，休息日 6:30-22:00)：行车间隔约 9分20秒 / 班",
        lowPeak: "低峰时段(工作日及休息日 22:00-23:00，6号线部分至22:30)：行车间隔约 10分钟 / 班"
    },
    "M6": {
        peak: "大站快车(每日 7:00-22:00)：行车间隔约 60分钟 / 班（中间仅停靠东门、三叉街（滨海快线）、帝封江、大数据、机场共5个站）",
        offPeak: "普通列车(全天运营时段)：行车间隔最小 7分30秒 / 班",
        lowPeak: ""
    }
};
