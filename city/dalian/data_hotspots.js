/**
 * CGo OpenMap - 大连「快速前往」静态清单（行程规划面板的推荐目的地）
 *
 * 口径同 city/shenyang/data_hotspots.js：纯静态写入、无热度算法、不消费规划结果；
 * 枢纽一律映射**地铁侧**站点保证可规划（rdot 散站不做端点）；景点只收
 * 3A 及以上景区 / 省市级博物馆 / 全国文保且站点映射确凿的，宁少勿错
 * （老虎滩、俄罗斯风情街等无地铁直达或站名对不上的暂不收录）。
 * 接驳口字段（exit / enterExit / leaveExit）可选——本城出口表逐口核对后再补，
 * 未配则点选只填车站、不指定口。
 * 供共享层 shared/route/route-panel.js 读取（约定全局 CGO_HOTSPOTS）。
 */
const DALIAN_HOTSPOTS = [
    // ── 交通枢纽 ──
    { name: "大连站", sid: "0301", kind: "hub", icon: "railway", exit: "A" },
    { name: "大连北站", sid: "0102", kind: "hub", icon: "railway", exit: "C" },
    { name: "周水子机场", sid: "0219", kind: "hub", icon: "plane", exit: "A" },
    // ── 名胜景点 ──
    { name: "金石滩旅游度假区", sid: "0311", kind: "poi", tag: "5A", exit: "B" },
    { name: "中山广场近代建筑群", sid: "0206", kind: "poi", tag: "全国文保", exit: "B" },
    { name: "旅顺博物馆", sid: "0806", kind: "poi", tag: "全国文保", exit: "1号门" },
    // 以下按「官方交通建议含地铁」补录（2026-10-09 搜索核实）：
    // 老虎滩海洋公园：本地宝「地铁 5 号线直达虎滩公园站 C 口出站」（站取 0502 虎滩公园）
    { name: "老虎滩海洋公园", sid: "0502", kind: "poi", tag: "4A", exit: "C" },
    // 日俄监狱旧址：本地宝交通页「地铁 12 号线旅顺站（B 口）+ 公交」；旧址为全国重点文保
    // （本站出口表只有 1 号门 / 2 号门，与旅顺博物馆同站同口兜底）
    { name: "日俄监狱旧址", sid: "0806", kind: "poi", tag: "全国文保", exit: "1号门" }
];
window.DALIAN_HOTSPOTS = DALIAN_HOTSPOTS;
window.CGO_HOTSPOTS = DALIAN_HOTSPOTS;
