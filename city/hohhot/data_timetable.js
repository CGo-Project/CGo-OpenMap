/**
 * CGo OpenMap - 呼和浩特车站首末班车时刻表 (city/hohhot/data_timetable.js)
 *
 * 数据源：呼和浩特城市交通投资建设集团官网「列车时刻表」页面的 XML 接口
 *   https://hhhtmetro.com/site/getDirName?line=N      （方向名）
 *   https://hhhtmetro.com/site/getSiteNameAFC?line=N  （各站首末班）
 * 抓取日期：2026-10-04。官网原文的端点站「朝向本站」方向无服务（页面写作「/」），
 * 本文件同样不写入该方向。
 *
 * 结构：GLOBAL_SCHEDULE_DATA[线路 ID][车站 ID] = { cn, source, directions, url }，
 * directions[终点站名] = { first, last }；终点站名不含「方向」二字。
 * url（信息板与行程面板「官网查询」按钮的目标）不在表里逐条写，由文件末尾统一按 cn
 * 生成「官网分站点查询」地址，见彼处说明。
 * 渲染走共享层 city/shenyang/shared/timetable-renderer.js（window.CGoTimetable）。
 */

const GLOBAL_SCHEDULE_DATA = {
    "M1": {
        "M101": {
            cn: "伊利健康谷",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:00", last: "22:09" }
            }
        },
        "M102": {
            cn: "西二环路",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:04", last: "22:14" },
                "伊利健康谷": { first: "6:37", last: "22:40" }
            }
        },
        "M103": {
            cn: "孔家营",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:06", last: "22:16" },
                "伊利健康谷": { first: "6:35", last: "22:38" }
            }
        },
        "M104": {
            cn: "呼钢南路",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:08", last: "22:18" },
                "伊利健康谷": { first: "6:33", last: "22:36" }
            }
        },
        "M105": {
            cn: "西龙王庙",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:11", last: "22:20" },
                "伊利健康谷": { first: "6:31", last: "22:34" }
            }
        },
        "M106": {
            cn: "乌兰夫纪念馆",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:12", last: "22:22" },
                "伊利健康谷": { first: "6:29", last: "22:32" }
            }
        },
        "M107": {
            cn: "附属医院",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:15", last: "22:24" },
                "伊利健康谷": { first: "6:27", last: "22:30" }
            }
        },
        "M108": {
            cn: "新华广场",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:17", last: "22:28" },
                "伊利健康谷": { first: "6:25", last: "22:28" }
            }
        },
        "M109": {
            cn: "人民会堂",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:18", last: "22:29" },
                "伊利健康谷": { first: "6:23", last: "22:24" }
            }
        },
        "M110": {
            cn: "将军衙署",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:20", last: "22:31" },
                "伊利健康谷": { first: "6:21", last: "22:22" }
            }
        },
        "M111": {
            cn: "艺术学院",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:22", last: "22:33" },
                "伊利健康谷": { first: "6:19", last: "22:21" }
            }
        },
        "M112": {
            cn: "东影路",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:24", last: "22:35" },
                "伊利健康谷": { first: "6:17", last: "22:19" }
            }
        },
        "M113": {
            cn: "内蒙古展览馆",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:26", last: "22:37" },
                "伊利健康谷": { first: "6:16", last: "22:17" }
            }
        },
        "M114": {
            cn: "内蒙古博物院",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:28", last: "22:39" },
                "伊利健康谷": { first: "6:14", last: "22:15" }
            }
        },
        "M115": {
            cn: "市政府",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:30", last: "22:41" },
                "伊利健康谷": { first: "6:11", last: "22:12" }
            }
        },
        "M116": {
            cn: "呼和浩特东站",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:33", last: "22:44" },
                "伊利健康谷": { first: "6:08", last: "22:10" }
            }
        },
        "M117": {
            cn: "后不塔气",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:35", last: "22:46" },
                "伊利健康谷": { first: "6:06", last: "22:07" }
            }
        },
        "M118": {
            cn: "什兰岱",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:38", last: "22:49" },
                "伊利健康谷": { first: "6:03", last: "22:05" }
            }
        },
        "M119": {
            cn: "白塔西",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "坝堰（机场）": { first: "6:40", last: "22:51" },
                "伊利健康谷": { first: "6:02", last: "22:03" }
            }
        },
        "M120": {
            cn: "坝堰（机场）",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "伊利健康谷": { first: "6:00", last: "22:01" }
            }
        }
    },
    "M2": {
        "M201": {
            cn: "塔利东路",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:00", last: "22:00" }
            }
        },
        "M202": {
            cn: "新店",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:01", last: "22:01" },
                "塔利东路": { first: "6:45", last: "22:52" }
            }
        },
        "M203": {
            cn: "百合路",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:03", last: "22:03" },
                "塔利东路": { first: "6:44", last: "22:50" }
            }
        },
        "M204": {
            cn: "北山公园",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:05", last: "22:05" },
                "塔利东路": { first: "6:42", last: "22:48" }
            }
        },
        "M205": {
            cn: "丝绸之路大道",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:07", last: "22:07" },
                "塔利东路": { first: "6:40", last: "22:46" }
            }
        },
        "M206": {
            cn: "一家村",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:09", last: "22:09" },
                "塔利东路": { first: "6:38", last: "22:44" }
            }
        },
        "M207": {
            cn: "成吉思汗公园",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:11", last: "22:11" },
                "塔利东路": { first: "6:36", last: "22:42" }
            }
        },
        "M208": {
            cn: "毫沁营",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:13", last: "22:13" },
                "塔利东路": { first: "6:34", last: "22:40" }
            }
        },
        "M209": {
            cn: "成吉思汗广场",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:15", last: "22:15" },
                "塔利东路": { first: "6:32", last: "22:38" }
            }
        },
        "M210": {
            cn: "内蒙古体育馆",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:17", last: "22:17" },
                "塔利东路": { first: "6:30", last: "22:36" }
            }
        },
        "M211": {
            cn: "呼和浩特体育场",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:19", last: "22:19" },
                "塔利东路": { first: "6:27", last: "22:34" }
            }
        },
        "M212": {
            cn: "公主府",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:22", last: "22:22" },
                "塔利东路": { first: "6:25", last: "22:31" }
            }
        },
        "M213": {
            cn: "呼和浩特站",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:24", last: "22:24" },
                "塔利东路": { first: "6:23", last: "22:29" }
            }
        },
        "M108": {
            cn: "新华广场",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:26", last: "22:27" },
                "塔利东路": { first: "6:21", last: "22:27" }
            }
        },
        "M214": {
            cn: "中山路",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:28", last: "22:29" },
                "塔利东路": { first: "6:19", last: "22:24" }
            }
        },
        "M215": {
            cn: "大学西街",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:30", last: "22:31" },
                "塔利东路": { first: "6:17", last: "22:22" }
            }
        },
        "M216": {
            cn: "诺和木勒",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:31", last: "22:33" },
                "塔利东路": { first: "6:15", last: "22:20" }
            }
        },
        "M217": {
            cn: "水上公园",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:34", last: "22:35" },
                "塔利东路": { first: "6:13", last: "22:18" }
            }
        },
        "M218": {
            cn: "五里营",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:36", last: "22:37" },
                "塔利东路": { first: "6:11", last: "22:16" }
            }
        },
        "M219": {
            cn: "锡林公园",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:37", last: "22:39" },
                "塔利东路": { first: "6:10", last: "22:14" }
            }
        },
        "M220": {
            cn: "内大南校区",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:40", last: "22:41" },
                "塔利东路": { first: "6:07", last: "22:12" }
            }
        },
        "M221": {
            cn: "帅家营",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:42", last: "22:44" },
                "塔利东路": { first: "6:05", last: "22:09" }
            }
        },
        "M222": {
            cn: "喇嘛营",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "阿尔山路": { first: "6:45", last: "22:47" },
                "塔利东路": { first: "6:02", last: "22:07" }
            }
        },
        "M223": {
            cn: "阿尔山路",
            source: "呼和浩特地铁官网「列车时刻表」",
            directions: {
                "塔利东路": { first: "6:00", last: "22:04" }
            }
        }
    }
};

/**
 * 官网「分站点查询」入口：车站信息板与行程面板的「官网查询」按钮取这里的 url。
 * 形如 https://hhhtmetro.com/site/site_sel_index?site_name=<站名>（站名需百分号编码）。
 * url 由 cn 现算：上面各站只维护 cn，站名变更时不必逐站改地址；同名站在各线路下取同一页。
 * 放在导出之前，保证任何消费方读到的都已是分站点地址。
 */
(function attachOfficialQueryUrls() {
    const BASE = "https://hhhtmetro.com/site/site_sel_index?site_name=";
    Object.values(GLOBAL_SCHEDULE_DATA).forEach((lineTable) => {
        Object.values(lineTable).forEach((entry) => {
            if (entry && entry.cn) entry.url = BASE + encodeURIComponent(entry.cn);
        });
    });
})();

if (typeof window !== "undefined") { window.GLOBAL_SCHEDULE_DATA = GLOBAL_SCHEDULE_DATA; }
