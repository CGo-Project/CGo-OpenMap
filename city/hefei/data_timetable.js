/**
 * CGo OpenMap - 合肥车站时刻表 (city/hefei/data_timetable.js)
 *
 * 官方列结构（与官网图片表一致）：
 *   车站 | 开往甲方向 首班(周一至周四/周五至周日) 末班(周一至周四/周五至周日)
 *        | 开往乙方向 首班(周一至周四/周五至周日) 末班(周一至周四/周五至周日)
 * 终点该方向无车：first / last 为 null。
 * 已对照官网图抄录：1–8 号线。未开通站（馆驿、紫云湖等）只保留官网链接。
 * 官网表若不分周一至周四/周五至周日，weekday 与 weekend 填同一时刻。
 *
 * 官网查询：value.url 指向该线官网文章（无逐站 H5）。
 */

const HEFEI_OFFICIAL_LINE_URL = {
    HFM1: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=33582&activeIndex=0",
    HFM2: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=33581&activeIndex=0",
    HFM3: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=33580&activeIndex=0",
    HFM4: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=33579&activeIndex=0",
    HFM5: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=33578&activeIndex=0",
    HFM6: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=100106&activeIndex=0",
    HFM7: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=100473&activeIndex=0",
    HFM8: "https://www.hfgdjt.com/#/listContentTMPL?classId=58&parentId=53&classType=normal_lv3&contentId=33824&activeIndex=0"
};

function hfPeriod(weekday, weekend) {
    if (weekday == null && weekend == null) return null;
    return { weekday: weekday, weekend: weekend };
}

function hfBound(firstWeekday, firstWeekend, lastWeekday, lastWeekend) {
    if (firstWeekday == null && lastWeekday == null) {
        return { first: null, last: null };
    }
    return {
        first: hfPeriod(firstWeekday, firstWeekend),
        last: hfPeriod(lastWeekday, lastWeekend)
    };
}

function hfSame(first, last) {
    return hfBound(first, first, last, last);
}

function hfStop(cn, url, source, directions) {
    return { cn: cn, url: url, source: source, directions: directions };
}

function hfLineUrlOnly(url, stationIds) {
    const out = {};
    stationIds.forEach((id) => {
        out[id] = { url: url };
    });
    return out;
}

const GLOBAL_SCHEDULE_DATA = {
    "HFM1": {
        "0101": {
            cn: "张洼",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound(null, null, null, null),
                "九联圩": hfBound("06:00", "06:00", "22:40", "23:10")
            }
        },
        "0102": {
            cn: "兴华苑",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:25", "06:25", "00:01", "00:21"),
                "九联圩": hfBound("06:02", "06:02", "22:42", "23:12")
            }
        },
        "0103": {
            cn: "瑶海公园",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:22", "06:22", "23:58", "00:18"),
                "九联圩": hfBound("06:05", "06:05", "22:45", "23:15")
            }
        },
        "0104": {
            cn: "合肥火车站",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:20", "06:20", "23:56", "00:16"),
                "九联圩": hfBound("06:07", "06:07", "22:47", "23:17")
            }
        },
        "0105": {
            cn: "长淮",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:17", "06:17", "23:54", "00:14"),
                "九联圩": hfBound("06:10", "06:10", "22:50", "23:20")
            }
        },
        "0106": {
            cn: "明光路",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:15", "06:15", "23:52", "00:12"),
                "九联圩": hfBound("06:00", "06:00", "22:51", "23:21")
            }
        },
        "0107": {
            cn: "大东门",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:14", "06:14", "23:50", "00:10"),
                "九联圩": hfBound("06:02", "06:02", "22:53", "23:23")
            }
        },
        "0108": {
            cn: "包公园",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:11", "06:11", "23:48", "00:08"),
                "九联圩": hfBound("06:04", "06:04", "22:56", "23:26")
            }
        },
        "0109": {
            cn: "合工大南区",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:09", "06:09", "23:46", "00:06"),
                "九联圩": hfBound("06:06", "06:06", "22:58", "23:28")
            }
        },
        "0110": {
            cn: "朱岗",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:06", "06:06", "23:43", "00:03"),
                "九联圩": hfBound("06:09", "06:09", "23:00", "23:30")
            }
        },
        "0111": {
            cn: "秋浦河路",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:04", "06:04", "23:41", "00:01"),
                "九联圩": hfBound("06:11", "06:11", "23:03", "23:33")
            }
        },
        "0112": {
            cn: "葛大店",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:02", "06:02", "23:39", "23:59"),
                "九联圩": hfBound("06:00", "06:00", "23:04", "23:34")
            }
        },
        "0113": {
            cn: "望湖城",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:00", "06:00", "23:36", "23:56"),
                "九联圩": hfBound("06:02", "06:02", "23:07", "23:37")
            }
        },
        "0114": {
            cn: "合肥南站",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:12", "06:12", "23:35", "23:55"),
                "九联圩": hfBound("06:04", "06:04", "23:35", "23:55")
            }
        },
        "0115": {
            cn: "南站南广场",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:10", "06:10", "22:44", "23:14"),
                "九联圩": hfBound("06:06", "06:06", "23:36", "23:56")
            }
        },
        "0116": {
            cn: "骆岗",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:08", "06:08", "22:42", "23:12"),
                "九联圩": hfBound("06:08", "06:08", "23:38", "23:58")
            }
        },
        "0117": {
            cn: "高王",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:06", "06:06", "22:40", "23:10"),
                "九联圩": hfBound("06:10", "06:10", "23:40", "00:00")
            }
        },
        "0118": {
            cn: "滨湖会展中心",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:02", "06:02", "22:36", "23:06"),
                "九联圩": hfBound("06:14", "06:14", "23:44", "00:04")
            }
        },
        "0119": {
            cn: "紫庐",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:00", "06:00", "22:34", "23:04"),
                "九联圩": hfBound("06:17", "06:17", "23:47", "00:07")
            }
        },
        "0120": {
            cn: "塘西河公园",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:11", "06:11", "22:31", "23:01"),
                "九联圩": hfBound("06:19", "06:19", "23:49", "00:09")
            }
        },
        "0121": {
            cn: "金斗公园",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:10", "06:10", "22:30", "23:00"),
                "九联圩": hfBound("06:21", "06:21", "23:51", "00:11")
            }
        },
        "0122": {
            cn: "云谷路",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:08", "06:08", "22:28", "22:58"),
                "九联圩": hfBound("06:23", "06:23", "23:53", "00:13")
            }
        },
        "0123": {
            cn: "万达城",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:05", "06:05", "22:25", "22:55"),
                "九联圩": hfBound("06:25", "06:25", "23:55", "00:15")
            }
        },
        "0124": {
            cn: "万年埠",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:04", "06:04", "22:24", "22:54"),
                "九联圩": hfBound("06:27", "06:27", "23:57", "00:17")
            }
        },
        "0125": {
            cn: "丙子铺",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:02", "06:02", "22:22", "22:52"),
                "九联圩": hfBound("06:28", "06:28", "23:59", "00:19")
            }
        },
        "0126": {
            cn: "九联圩",
            url: HEFEI_OFFICIAL_LINE_URL.HFM1,
            source: "合肥轨道交通官方 1 号线首末班车时间",
            directions: {
                "张洼": hfBound("06:00", "06:00", "22:20", "22:50"),
                "九联圩": hfBound(null, null, null, null)
            }
        }
    },
    "HFM2": {
        "0201": hfStop("南岗", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound(null, null, null, null),
            "撮镇": hfBound("06:00", "06:00", "22:30", "23:00")
        }),
        "0202": hfStop("桂庄", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:22", "06:22", "23:41", "00:01"),
            "撮镇": hfBound("06:01", "06:01", "22:31", "23:01")
        }),
        "0203": hfStop("汽车西站", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:20", "06:20", "23:40", "00:00"),
            "撮镇": hfBound("06:03", "06:03", "22:33", "23:03")
        }),
        "0204": hfStop("振兴路", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:17", "06:17", "23:37", "23:57"),
            "撮镇": hfBound("06:06", "06:06", "22:36", "23:06")
        }),
        "0205": hfStop("蜀山西", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:15", "06:15", "23:35", "23:55"),
            "撮镇": hfBound("06:08", "06:08", "22:38", "23:08")
        }),
        "0206": hfStop("大蜀山", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:12", "06:12", "23:32", "23:52"),
            "撮镇": hfBound("06:00", "06:00", "22:41", "23:11")
        }),
        "0207": hfStop("天柱路", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:10", "06:10", "23:30", "23:50"),
            "撮镇": hfBound("06:02", "06:02", "22:43", "23:13")
        }),
        "0208": hfStop("科学大道", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:08", "06:08", "23:28", "23:48"),
            "撮镇": hfBound("06:04", "06:04", "22:45", "23:15")
        }),
        "0209": hfStop("十里庙", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:06", "06:06", "23:26", "23:46"),
            "撮镇": hfBound("06:06", "06:06", "22:47", "23:17")
        }),
        "0210": hfStop("西七里塘", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:04", "06:04", "23:24", "23:44"),
            "撮镇": hfBound("06:08", "06:08", "22:49", "23:19")
        }),
        "0211": hfStop("五里墩", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:02", "06:02", "23:22", "23:42"),
            "撮镇": hfBound("06:10", "06:10", "22:51", "23:21")
        }),
        "0212": hfStop("三里庵", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:00", "06:00", "23:19", "23:39"),
            "撮镇": hfBound("06:00", "06:00", "22:53", "23:23")
        }),
        "0213": hfStop("安农大", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:13", "06:13", "23:17", "23:37"),
            "撮镇": hfBound("06:01", "06:01", "22:55", "23:25")
        }),
        "0214": hfStop("三孝口", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:11", "06:11", "23:15", "23:35"),
            "撮镇": hfBound("06:03", "06:03", "22:57", "23:27")
        }),
        "0215": hfStop("四牌楼", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:08", "06:08", "23:13", "23:33"),
            "撮镇": hfBound("06:06", "06:06", "23:00", "23:30")
        }),
        "0107": hfStop("大东门", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:06", "06:06", "23:11", "23:31"),
            "撮镇": hfBound("06:08", "06:08", "23:02", "23:32")
        }),
        "0217": hfStop("三里街", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:04", "06:04", "23:08", "23:28"),
            "撮镇": hfBound("06:10", "06:10", "23:04", "23:34")
        }),
        "0218": hfStop("东五里井", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:02", "06:02", "23:06", "23:26"),
            "撮镇": hfBound("06:00", "06:00", "23:06", "23:36")
        }),
        "0219": hfStop("东七里", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:00", "06:00", "23:04", "23:24"),
            "撮镇": hfBound("06:02", "06:02", "23:08", "23:38")
        }),
        "0220": hfStop("漕冲", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:08", "06:08", "23:02", "23:22"),
            "撮镇": hfBound("06:04", "06:04", "23:11", "23:41")
        }),
        "0221": hfStop("东二十埠", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:05", "06:05", "22:58", "23:18"),
            "撮镇": hfBound("06:07", "06:07", "23:14", "23:44")
        }),
        "0222": hfStop("龙岗", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:03", "06:03", "22:57", "23:17"),
            "撮镇": hfBound("06:09", "06:09", "23:16", "23:46")
        }),
        "0223": hfStop("王岗", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:01", "06:01", "22:55", "23:15"),
            "撮镇": hfBound("06:11", "06:11", "23:18", "23:48")
        }),
        "0224": hfStop("三十埠", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:00", "06:00", "22:53", "23:13"),
            "撮镇": hfBound("06:12", "06:12", "23:19", "23:49")
        }),
        "0225": hfStop("三十埠东", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:06", "06:06", "22:50", "23:10"),
            "撮镇": hfBound("06:15", "06:15", "23:22", "23:52")
        }),
        "0226": hfStop("祥和", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:04", "06:04", "22:48", "23:08"),
            "撮镇": hfBound("06:00", "06:00", "23:24", "23:54")
        }),
        "0227": hfStop("桂王", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:02", "06:02", "22:46", "23:06"),
            "撮镇": hfBound("06:02", "06:02", "23:26", "23:56")
        }),
        "0228": hfStop("对河", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:00", "06:00", "22:44", "23:04"),
            "撮镇": hfBound("06:04", "06:04", "23:28", "23:58")
        }),
        "0229": hfStop("店埠河", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:11", "06:11", "22:41", "23:01"),
            "撮镇": hfBound("06:06", "06:06", "23:31", "00:01")
        }),
        "0230": hfStop("排头", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:09", "06:09", "22:39", "22:59"),
            "撮镇": hfBound("06:08", "06:08", "23:33", "00:03")
        }),
        "0231": hfStop("肥东站", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:07", "06:07", "22:37", "22:57"),
            "撮镇": hfBound("06:10", "06:10", "23:35", "00:05")
        }),
        "0232": hfStop("和睦湖", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:05", "06:05", "22:35", "22:55"),
            "撮镇": hfBound("06:12", "06:12", "23:37", "00:07")
        }),
        "0233": hfStop("马桥", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:04", "06:04", "22:34", "22:54"),
            "撮镇": hfBound("06:14", "06:14", "23:39", "00:09")
        }),
        "0234": hfStop("南沙河", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:01", "06:01", "22:31", "22:51"),
            "撮镇": hfBound("06:16", "06:16", "23:41", "00:11")
        }),
        "0235": hfStop("撮镇", HEFEI_OFFICIAL_LINE_URL.HFM2, "合肥轨道交通官方 2 号线首末班车时间", {
            "南岗": hfBound("06:00", "06:00", "22:30", "22:50"),
            "撮镇": hfBound(null, null, null, null)
        })
    },
    "HFM3": Object.assign(hfLineUrlOnly(HEFEI_OFFICIAL_LINE_URL.HFM3, ["0341"]), {
        "0340": hfStop("省儿童医院新区", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame(null, null),
            "相城路": hfSame("06:00", "22:25")
        }),
        "0339": hfStop("乐平", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:37", "23:51"),
            "相城路": hfSame("06:01", "22:26")
        }),
        "0338": hfStop("芮祠", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:34", "23:49"),
            "相城路": hfSame("06:04", "22:29")
        }),
        "0337": hfStop("四十埠", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:32", "23:47"),
            "相城路": hfSame("06:06", "22:31")
        }),
        "0336": hfStop("李湾", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:29", "23:44"),
            "相城路": hfSame("06:08", "22:34")
        }),
        "0335": hfStop("凉亭", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:27", "23:42"),
            "相城路": hfSame("06:10", "22:35")
        }),
        "0334": hfStop("安医一附院南区", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:24", "23:39"),
            "相城路": hfSame("06:14", "22:39")
        }),
        "0333": hfStop("幸福坝", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:22", "23:37"),
            "相城路": hfSame("06:00", "22:41")
        }),
        "0332": hfStop("安大磬苑校区", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:19", "23:34"),
            "相城路": hfSame("06:02", "22:44")
        }),
        "0331": hfStop("工大翡翠湖校区", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:16", "23:32"),
            "相城路": hfSame("06:04", "22:46")
        }),
        "0330": hfStop("大学城北", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:14", "23:29"),
            "相城路": hfSame("06:06", "22:48")
        }),
        "0329": hfStop("繁华大道", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:12", "23:28"),
            "相城路": hfSame("06:08", "22:50")
        }),
        "0328": hfStop("安医大二附院", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:11", "23:26"),
            "相城路": hfSame("06:10", "22:52")
        }),
        "0327": hfStop("省博物馆", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:08", "23:23"),
            "相城路": hfSame("06:12", "22:55")
        }),
        "0326": hfStop("图书馆", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:06", "23:21"),
            "相城路": hfSame("06:00", "22:57")
        }),
        "0325": hfStop("合肥大剧院", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:04", "23:19"),
            "相城路": hfSame("06:02", "22:59")
        }),
        "0324": hfStop("市政务中心", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:02", "23:16"),
            "相城路": hfSame("06:04", "23:02")
        }),
        "0323": hfStop("洪岗", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:00", "23:14"),
            "相城路": hfSame("06:06", "23:04")
        }),
        "0322": hfStop("国防科技大学", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:15", "23:12"),
            "相城路": hfSame("06:08", "23:06")
        }),
        "0210": hfStop("西七里塘", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:12", "23:10"),
            "相城路": hfSame("06:11", "23:08")
        }),
        "0320": hfStop("南新庄", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:10", "23:08"),
            "相城路": hfSame("06:13", "23:10")
        }),
        "0319": hfStop("合肥西站", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:08", "23:05"),
            "相城路": hfSame("06:15", "23:13")
        }),
        "0318": hfStop("杏花村", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:06", "23:03"),
            "相城路": hfSame("06:00", "23:15")
        }),
        "0317": hfStop("四泉桥", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:03", "23:00"),
            "相城路": hfSame("06:02", "23:18")
        }),
        "0316": hfStop("郑河", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:01", "22:58"),
            "相城路": hfSame("06:04", "23:20")
        }),
        "0315": hfStop("海棠", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:00", "22:56"),
            "相城路": hfSame("06:06", "23:22")
        }),
        "0314": hfStop("一里井", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:13", "22:54"),
            "相城路": hfSame("06:08", "23:24")
        }),
        "0313": hfStop("淮南路", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:11", "22:52"),
            "相城路": hfSame("06:10", "23:26")
        }),
        "0312": hfStop("鸭林冲", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:09", "22:50"),
            "相城路": hfSame("06:12", "23:28")
        }),
        "0104": hfStop("合肥火车站", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:07", "22:48"),
            "相城路": hfSame("06:14", "23:30")
        }),
        "0310": hfStop("竹丝滩", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:04", "22:45"),
            "相城路": hfSame("06:17", "23:33")
        }),
        "0309": hfStop("方庙", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:02", "22:43"),
            "相城路": hfSame("06:19", "23:35")
        }),
        "0308": hfStop("窦桥湾", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:00", "22:41"),
            "相城路": hfSame("06:21", "23:37")
        }),
        "0307": hfStop("新海大道", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:13", "22:38"),
            "相城路": hfSame("06:24", "23:40")
        }),
        "0306": hfStop("勤劳村", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:11", "22:36"),
            "相城路": hfSame("06:26", "23:41")
        }),
        "0305": hfStop("文浍苑", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:09", "22:34"),
            "相城路": hfSame("06:28", "23:44")
        }),
        "0304": hfStop("幼儿师范", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:07", "22:32"),
            "相城路": hfSame("06:31", "23:46")
        }),
        "0303": hfStop("职教城", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:04", "22:29"),
            "相城路": hfSame("06:33", "23:49")
        }),
        "0302": hfStop("职教城东", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:02", "22:27"),
            "相城路": hfSame("06:36", "23:51")
        }),
        "0301": hfStop("相城路", HEFEI_OFFICIAL_LINE_URL.HFM3, "合肥轨道交通官方 3 号线首末班车时间", {
            "省儿童医院新区": hfSame("06:00", "22:25"),
            "相城路": hfSame(null, null)
        })
    }),
    "HFM4": Object.assign(hfLineUrlOnly(HEFEI_OFFICIAL_LINE_URL.HFM4, ["0435"]), {
        "0401": hfStop("综保区", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound(null, null, null, null),
            "烧脉岗": hfBound("06:00", "06:00", "22:00", "22:30")
        }),
        "0402": hfStop("安医一附院北区", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:48", "06:48", "00:09", "00:29"),
            "烧脉岗": hfBound("06:02", "06:02", "22:02", "22:32")
        }),
        "0403": hfStop("陶冲湖东", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:46", "06:46", "00:07", "00:27"),
            "烧脉岗": hfBound("06:04", "06:04", "22:04", "22:34")
        }),
        "0404": hfStop("十里村", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:42", "06:42", "00:03", "00:23"),
            "烧脉岗": hfBound("06:09", "06:09", "22:09", "22:39")
        }),
        "0405": hfStop("新海公园", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:39", "06:39", "00:00", "00:20"),
            "烧脉岗": hfBound("06:00", "06:00", "22:11", "22:41")
        }),
        "0309": hfStop("方庙", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:37", "06:37", "23:58", "00:18"),
            "烧脉岗": hfBound("06:02", "06:02", "22:14", "22:44")
        }),
        "0407": hfStop("站塘", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:35", "06:35", "23:56", "00:16"),
            "烧脉岗": hfBound("06:04", "06:04", "22:16", "22:46")
        }),
        "0219": hfStop("东七里", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:33", "06:33", "23:54", "00:14"),
            "烧脉岗": hfBound("06:06", "06:06", "22:18", "22:48")
        }),
        "0409": hfStop("唐桥", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:30", "06:30", "23:51", "00:11"),
            "烧脉岗": hfBound("06:09", "06:09", "22:20", "22:50")
        }),
        "0410": hfStop("五里庙", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:26", "06:26", "23:47", "00:07"),
            "烧脉岗": hfBound("06:00", "06:00", "22:23", "22:53")
        }),
        "0411": hfStop("尧渡河路", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:24", "06:24", "23:45", "00:05"),
            "烧脉岗": hfBound("06:02", "06:02", "22:26", "22:56")
        }),
        "0412": hfStop("工经学院", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:22", "06:22", "23:43", "00:03"),
            "烧脉岗": hfBound("06:04", "06:04", "22:28", "22:58")
        }),
        "0413": hfStop("葛大店南", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:19", "06:19", "23:40", "00:00"),
            "烧脉岗": hfBound("06:07", "06:07", "22:31", "23:01")
        }),
        "0414": hfStop("望湖城南", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:17", "06:17", "23:38", "23:58"),
            "烧脉岗": hfBound("06:00", "06:00", "22:33", "23:03")
        }),
        "0114": hfStop("合肥南站", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:14", "06:14", "23:35", "23:55"),
            "烧脉岗": hfBound("06:03", "06:03", "23:35", "23:55")
        }),
        "0416": hfStop("淝南", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:12", "06:12", "22:45", "23:15"),
            "烧脉岗": hfBound("06:05", "06:05", "23:36", "23:56")
        }),
        "0417": hfStop("竹西", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:10", "06:10", "22:43", "23:13"),
            "烧脉岗": hfBound("06:07", "06:07", "23:38", "23:58")
        }),
        "0418": hfStop("薛河", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:08", "06:08", "22:41", "23:11"),
            "烧脉岗": hfBound("06:09", "06:09", "23:40", "00:00")
        }),
        "0419": hfStop("南屏路", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:06", "06:06", "22:39", "23:09"),
            "烧脉岗": hfBound("06:11", "06:11", "23:42", "00:02")
        }),
        "0420": hfStop("姚公庙", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:03", "06:03", "22:36", "23:06"),
            "烧脉岗": hfBound("06:14", "06:14", "23:45", "00:05")
        }),
        "0421": hfStop("天鹅湖东", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:01", "06:01", "22:34", "23:04"),
            "烧脉岗": hfBound("06:16", "06:16", "23:47", "00:07")
        }),
        "0422": hfStop("天鹅湖", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:00", "06:00", "22:33", "23:03"),
            "烧脉岗": hfBound("06:18", "06:18", "23:49", "00:09")
        }),
        "0326": hfStop("图书馆", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:07", "06:07", "22:30", "23:00"),
            "烧脉岗": hfBound("06:20", "06:20", "23:51", "00:11")
        }),
        "0424": hfStop("柳树塘", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:04", "06:04", "22:28", "22:58"),
            "烧脉岗": hfBound("06:23", "06:23", "23:54", "00:14")
        }),
        "0425": hfStop("金桂", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:02", "06:02", "22:25", "22:55"),
            "烧脉岗": hfBound("06:25", "06:25", "23:56", "00:16")
        }),
        "0426": hfStop("玉兰大道", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:00", "06:00", "22:23", "22:53"),
            "烧脉岗": hfBound("06:27", "06:27", "23:58", "00:18")
        }),
        "0427": hfStop("北雁湖", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:09", "06:09", "22:20", "22:50"),
            "烧脉岗": hfBound("06:30", "06:30", "00:01", "00:21")
        }),
        "0428": hfStop("复兴集", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:06", "06:06", "22:17", "22:47"),
            "烧脉岗": hfBound("06:33", "06:33", "00:04", "00:24")
        }),
        "0429": hfStop("长安集", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:03", "06:03", "22:15", "22:45"),
            "烧脉岗": hfBound("06:35", "06:35", "00:06", "00:26")
        }),
        "0430": hfStop("桃花潭", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:00", "06:00", "22:11", "22:41"),
            "烧脉岗": hfBound("06:39", "06:39", "00:10", "00:30")
        }),
        "0431": hfStop("金小郢", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:08", "06:08", "22:08", "22:38"),
            "烧脉岗": hfBound("06:42", "06:42", "00:13", "00:33")
        }),
        "0432": hfStop("铜锣寨路", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:03", "06:03", "22:03", "22:33"),
            "烧脉岗": hfBound("06:46", "06:46", "00:18", "00:38")
        }),
        "0433": hfStop("魏庄", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:02", "06:02", "22:02", "22:32"),
            "烧脉岗": hfBound("06:48", "06:48", "00:19", "00:39")
        }),
        "0434": hfStop("烧脉岗", HEFEI_OFFICIAL_LINE_URL.HFM4, "合肥轨道交通官方 4 号线首末班车时间", {
            "综保区": hfBound("06:00", "06:00", "22:00", "22:30"),
            "烧脉岗": hfBound(null, null, null, null)
        })
    }),
    "HFM5": {
        "0501": hfStop("汲桥路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound(null, null, null, null),
            "贵阳路": hfBound("06:00", "06:00", "22:00", "22:30")
        }),
        "0502": hfStop("六中菱湖校区", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:41", "06:41", "00:04", "00:24"),
            "贵阳路": hfBound("06:02", "06:02", "22:02", "22:32")
        }),
        "0503": hfStop("菱湖公园", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:38", "06:38", "00:01", "00:21"),
            "贵阳路": hfBound("06:05", "06:05", "22:05", "22:35")
        }),
        "0504": hfStop("北五里井", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:35", "06:35", "23:59", "00:19"),
            "贵阳路": hfBound("06:08", "06:08", "22:08", "22:38")
        }),
        "0315": hfStop("海棠", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:33", "06:33", "23:56", "00:16"),
            "贵阳路": hfBound("06:10", "06:10", "22:10", "22:40")
        }),
        "0506": hfStop("白水坝", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:31", "06:31", "23:54", "00:14"),
            "贵阳路": hfBound("06:12", "06:12", "22:12", "22:42")
        }),
        "0507": hfStop("杏花公园", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:29", "06:29", "23:52", "00:12"),
            "贵阳路": hfBound("06:14", "06:14", "22:14", "22:44")
        }),
        "0214": hfStop("三孝口", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:27", "06:27", "23:50", "00:10"),
            "贵阳路": hfBound("06:00", "06:00", "22:16", "22:46")
        }),
        "0509": hfStop("稻香楼", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:24", "06:24", "23:48", "00:08"),
            "贵阳路": hfBound("06:02", "06:02", "22:19", "22:49")
        }),
        "0510": hfStop("中国科大东区", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:23", "06:23", "23:46", "00:06"),
            "贵阳路": hfBound("06:04", "06:04", "22:20", "22:50")
        }),
        "0511": hfStop("市第三医院", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:20", "06:20", "23:43", "00:03"),
            "贵阳路": hfBound("06:06", "06:06", "22:23", "22:53")
        }),
        "0512": hfStop("休宁路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:18", "06:18", "23:41", "00:01"),
            "贵阳路": hfBound("06:09", "06:09", "22:25", "22:55")
        }),
        "0513": hfStop("凌大塘", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:16", "06:16", "23:39", "23:59"),
            "贵阳路": hfBound("06:11", "06:11", "22:27", "22:57")
        }),
        "0514": hfStop("望湖城西", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:13", "06:13", "23:37", "23:57"),
            "贵阳路": hfBound("06:00", "06:00", "22:30", "23:00")
        }),
        "0114": hfStop("合肥南站", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:11", "06:11", "23:35", "23:55"),
            "贵阳路": hfBound("06:02", "06:02", "23:35", "23:55")
        }),
        "0516": hfStop("盛大", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:09", "06:09", "22:37", "23:07"),
            "贵阳路": hfBound("06:04", "06:04", "23:37", "23:57")
        }),
        "0517": hfStop("包河苑", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:06", "06:06", "22:35", "23:05"),
            "贵阳路": hfBound("06:07", "06:07", "23:40", "00:00")
        }),
        "0518": hfStop("义兴", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:04", "06:04", "22:33", "23:03"),
            "贵阳路": hfBound("06:09", "06:09", "23:41", "00:01")
        }),
        "0519": hfStop("大连路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:02", "06:02", "22:30", "23:00"),
            "贵阳路": hfBound("06:11", "06:11", "23:44", "00:04")
        }),
        "0520": hfStop("花园大道", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:00", "06:00", "22:28", "22:58"),
            "贵阳路": hfBound("06:13", "06:13", "23:46", "00:06")
        }),
        "0521": hfStop("黄河路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:11", "06:11", "22:26", "22:56"),
            "贵阳路": hfBound("06:15", "06:15", "23:48", "00:08")
        }),
        "0522": hfStop("扬子江路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:09", "06:09", "22:24", "22:54"),
            "贵阳路": hfBound("06:18", "06:18", "23:51", "00:11")
        }),
        "0523": hfStop("义城", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:06", "06:06", "22:21", "22:51"),
            "贵阳路": hfBound("06:20", "06:20", "23:53", "00:13")
        }),
        "0524": hfStop("省行政中心东", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:04", "06:04", "22:19", "22:49"),
            "贵阳路": hfBound("06:22", "06:22", "23:55", "00:15")
        }),
        "0525": hfStop("方兴湖", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:02", "06:02", "22:16", "22:46"),
            "贵阳路": hfBound("06:25", "06:25", "23:58", "00:18")
        }),
        "0526": hfStop("渡江纪念馆", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:00", "06:00", "22:14", "22:44"),
            "贵阳路": hfBound("06:27", "06:27", "00:00", "00:20")
        }),
        "0527": hfStop("沈湾", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:12", "06:12", "22:12", "22:42"),
            "贵阳路": hfBound("06:29", "06:29", "00:02", "00:22")
        }),
        "0528": hfStop("华山路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:10", "06:10", "22:10", "22:40"),
            "贵阳路": hfBound("06:31", "06:31", "00:04", "00:24")
        }),
        "0122": hfStop("云谷路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:09", "06:09", "22:08", "22:39"),
            "贵阳路": hfBound("06:33", "06:33", "00:06", "00:26")
        }),
        "0530": hfStop("清水冲", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:06", "06:06", "22:06", "22:36"),
            "贵阳路": hfBound("06:35", "06:35", "00:08", "00:28")
        }),
        "0531": hfStop("云川公园", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:04", "06:04", "22:04", "22:34"),
            "贵阳路": hfBound("06:37", "06:37", "00:10", "00:30")
        }),
        "0532": hfStop("滨湖竹园", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:02", "06:02", "22:02", "22:32"),
            "贵阳路": hfBound("06:40", "06:40", "00:12", "00:32")
        }),
        "0533": hfStop("贵阳路", HEFEI_OFFICIAL_LINE_URL.HFM5, "合肥轨道交通官方 5 号线首末班车时间", {
            "汲桥路": hfBound("06:00", "06:00", "22:00", "22:30"),
            "贵阳路": hfBound(null, null, null, null)
        })
    },
    "HFM6": Object.assign(hfLineUrlOnly(HEFEI_OFFICIAL_LINE_URL.HFM6, ["0618"]), {
        "0622": hfStop("龙塘", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame(null, null),
            "青龙岗": hfSame("06:00", "22:00")
        }),
        "0621": hfStop("伏龙", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:28", "22:49"),
            "青龙岗": hfSame("06:02", "22:02")
        }),
        "0620": hfStop("大兴集", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:25", "22:47"),
            "青龙岗": hfSame("06:04", "22:04")
        }),
        "0619": hfStop("钢红", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:23", "22:45"),
            "青龙岗": hfSame("06:06", "22:06")
        }),
        "0617": hfStop("市儿童医院", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:19", "22:41"),
            "青龙岗": hfSame("06:00", "22:10")
        }),
        "0616": hfStop("唐大楼", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:16", "22:38"),
            "青龙岗": hfSame("06:03", "22:13")
        }),
        "0411": hfStop("尧渡河路", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:15", "22:36"),
            "青龙岗": hfSame("06:05", "22:16")
        }),
        "0110": hfStop("朱岗", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:11", "22:33"),
            "青龙岗": hfSame("06:00", "22:19")
        }),
        "0613": hfStop("卫岗", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:09", "22:30"),
            "青龙岗": hfSame("06:02", "22:21")
        }),
        "0511": hfStop("市第三医院", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:06", "22:28"),
            "青龙岗": hfSame("06:04", "22:24")
        }),
        "0611": hfStop("南七里", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:04", "22:26"),
            "青龙岗": hfSame("06:07", "22:26")
        }),
        "0610": hfStop("陆军兵种大学", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:02", "22:24"),
            "青龙岗": hfSame("06:09", "22:28")
        }),
        "0323": hfStop("洪岗", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:00", "22:21"),
            "青龙岗": hfSame("06:11", "22:31")
        }),
        "0608": hfStop("松荫桥", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:08", "22:19"),
            "青龙岗": hfSame("06:13", "22:32")
        }),
        "0607": hfStop("梦城", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:06", "22:17"),
            "青龙岗": hfSame("06:15", "22:35")
        }),
        "0606": hfStop("开福寺", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:03", "22:14"),
            "青龙岗": hfSame("06:18", "22:37")
        }),
        "0427": hfStop("北雁湖", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:00", "22:10"),
            "青龙岗": hfSame("06:22", "22:41")
        }),
        "0604": hfStop("科大先研院", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:07", "22:07"),
            "青龙岗": hfSame("06:26", "22:45")
        }),
        "0603": hfStop("量子科学中心", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:04", "22:04"),
            "青龙岗": hfSame("06:28", "22:48")
        }),
        "0602": hfStop("合肥七中", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:01", "22:01"),
            "青龙岗": hfSame("06:31", "22:50")
        }),
        "0601": hfStop("青龙岗", HEFEI_OFFICIAL_LINE_URL.HFM6, "合肥轨道交通官方 6 号线首末班车时间", {
            "龙塘": hfSame("06:00", "22:00"),
            "青龙岗": hfSame(null, null)
        })
    }),
    "HFM7": Object.assign(hfLineUrlOnly(HEFEI_OFFICIAL_LINE_URL.HFM7, ["0523", "0716"]), {
        "0714": hfStop("省文化和非遗馆", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame(null, null),
            "翡翠公园": hfSame("06:00", "22:00")
        }),
        "0713": hfStop("嵩山路", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:13", "22:27"),
            "翡翠公园": hfSame("06:02", "22:02")
        }),
        "0119": hfStop("紫庐", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:11", "22:24"),
            "翡翠公园": hfSame("06:04", "22:04")
        }),
        "0711": hfStop("滨湖医院", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:09", "22:22"),
            "翡翠公园": hfSame("06:06", "22:06")
        }),
        "0710": hfStop("要素大市场", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:07", "22:20"),
            "翡翠公园": hfSame("06:09", "22:09")
        }),
        "0709": hfStop("南艳湖南", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:04", "22:17"),
            "翡翠公园": hfSame("06:11", "22:11")
        }),
        "0708": hfStop("合肥大学", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:02", "22:15"),
            "翡翠公园": hfSame("06:00", "22:13")
        }),
        "0707": hfStop("一六八中学", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:00", "22:12"),
            "翡翠公园": hfSame("06:02", "22:16")
        }),
        "0706": hfStop("南艳湖北", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:10", "22:10"),
            "翡翠公园": hfSame("06:04", "22:18")
        }),
        "0705": hfStop("天都路", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:08", "22:08"),
            "翡翠公园": hfSame("06:06", "22:20")
        }),
        "0704": hfStop("明珠广场", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:06", "22:06"),
            "翡翠公园": hfSame("06:08", "22:22")
        }),
        "0703": hfStop("徽园", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:04", "22:04"),
            "翡翠公园": hfSame("06:10", "22:24")
        }),
        "0329": hfStop("繁华大道", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:02", "22:02"),
            "翡翠公园": hfSame("06:13", "22:27")
        }),
        "0701": hfStop("翡翠公园", HEFEI_OFFICIAL_LINE_URL.HFM7, "合肥轨道交通官方 7 号线首末班车时间", {
            "省文化和非遗馆": hfSame("06:00", "22:00"),
            "翡翠公园": hfSame(null, null)
        })
    }),
    "HFM8": {
        "0801": hfStop("北城高铁站", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame(null, null),
            "一里井": hfSame("06:00", "22:00")
        }),
        "0802": hfStop("省立医院北区", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:15", "23:01"),
            "一里井": hfSame("06:04", "22:04")
        }),
        "0803": hfStop("双墩", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:12", "22:58"),
            "一里井": hfSame("06:06", "22:06")
        }),
        "0804": hfStop("北城世纪城", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:09", "22:55"),
            "一里井": hfSame("06:10", "22:10")
        }),
        "0805": hfStop("梅冲湖", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:06", "22:52"),
            "一里井": hfSame("06:13", "22:13")
        }),
        "0806": hfStop("金梅路", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:03", "22:48"),
            "一里井": hfSame("06:00", "22:16")
        }),
        "0807": hfStop("双凤", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:00", "22:45"),
            "一里井": hfSame("06:03", "22:19")
        }),
        "0808": hfStop("荷塘路", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:12", "22:42"),
            "一里井": hfSame("06:06", "22:22")
        }),
        "0502": hfStop("六中菱湖校区", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:09", "22:39"),
            "一里井": hfSame("06:09", "22:26")
        }),
        "0810": hfStop("庐阳经开区", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:06", "22:36"),
            "一里井": hfSame("06:12", "22:28")
        }),
        "0811": hfStop("杏林", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:02", "22:32"),
            "一里井": hfSame("06:16", "22:32")
        }),
        "0314": hfStop("一里井", HEFEI_OFFICIAL_LINE_URL.HFM8, "合肥轨道交通官方 8 号线首末班车时间", {
            "北城高铁站": hfSame("06:00", "22:30"),
            "一里井": hfSame(null, null)
        })
    }
};
