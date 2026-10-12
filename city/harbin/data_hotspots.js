/**
 * CGo OpenMap - 哈尔滨「快速前往」静态清单（行程规划面板的推荐目的地）
 *
 * 口径同 city/shenyang/data_hotspots.js：纯静态写入、无热度算法、不消费规划结果。
 * ⚠️ 太平国际机场暂无地铁直达——机场不做端点；东北虎林园、731 遗址等
 * 站名对不上的暂不收录（宁少勿错）。
 * 接驳口字段（exit / enterExit / leaveExit）可选，未配则点选只填车站、不指定口。
 * 供共享层 shared/route/route-panel.js 读取（约定全局 CGO_HOTSPOTS）。
 */
const HARBIN_HOTSPOTS = [
    // ── 交通枢纽 ──
    { name: "哈尔滨站", sid: "HEB", kind: "hub", icon: "railway", exit: "1" },
    // 哈尔滨西站（HEBX）暂无出口数据，不配接驳口
    { name: "哈尔滨西站", sid: "HEBX", kind: "hub", icon: "railway" },
    // ── 名胜景点 ──
    { name: "太阳岛", sid: "TYD", kind: "poi", tag: "5A", exit: "1" },
    { name: "中央大街", sid: "ZYDJ", kind: "poi", tag: "中国历史文化名街", exit: "1" },
    { name: "圣索菲亚教堂", sid: "SZDJ", kind: "poi", tag: "全国文保 · 4A", exit: "2" },
    { name: "黑龙江省博物馆", sid: "BWG", kind: "poi", tag: "省博", exit: "1" },
    // 以下按「官方交通建议含地铁」补录（2026-10-09 搜索核实，接驳口待逐口核对暂不配）：
    // 731 罪证陈列馆：馆方公告与新华网「地铁 1 号线新疆大街站 2 号口」；旧址为全国重点文保
    { name: "侵华日军第七三一部队罪证陈列馆", sid: "XJD", kind: "poi", tag: "全国文保", exit: "2" },
    // 冰雪大世界（5A）：哈尔滨市政府网「2 号线串联中央大街、冰雪大世界、太阳岛」；西口兜底
    { name: "冰雪大世界", sid: "BXDDSJ", kind: "poi", tag: "5A", exit: "1" },
    // ── 省市级公共建筑与公园（2026-10-09 补录）──
    // 极地公园：哈尔滨本地宝「2 号线太阳岛站 1 号出口出站直达」
    { name: "哈尔滨极地公园", sid: "TYD", kind: "poi", tag: "4A", exit: "1" },
    // 兆麟公园（1906 年建，市级公园）：哈尔滨市政府网「3 号线兆麟公园站进出」；
    // 旅游指南标注该站即公园北门 → 取 2 号北口
    { name: "兆麟公园", sid: "ZLGY", kind: "poi", tag: "市级公园", exit: "2" }
];
window.HARBIN_HOTSPOTS = HARBIN_HOTSPOTS;
window.CGO_HOTSPOTS = HARBIN_HOTSPOTS;
