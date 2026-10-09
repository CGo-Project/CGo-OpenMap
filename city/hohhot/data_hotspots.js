/**
 * CGo OpenMap - 呼和浩特「快速前往」静态清单（行程规划面板的推荐目的地）
 *
 * 口径同 city/shenyang/data_hotspots.js：纯静态写入、无热度算法、不消费规划结果。
 * ⚠️ 白塔机场的地铁站名为「坝堰（机场）」（M120），显示名用机场常用名；
 * 大召寺、昭君墓、五塔寺等站名对不上的暂不收录（宁少勿错）。
 * 接驳口字段（exit / enterExit / leaveExit）可选，未配则点选只填车站、不指定口。
 * 供共享层 shared/route-panel.js 读取（约定全局 CGO_HOTSPOTS）。
 */
const HOHHOT_HOTSPOTS = [
    // ── 交通枢纽 ──
    { name: "呼和浩特站", sid: "M213", kind: "hub", icon: "railway", exit: "A" },
    { name: "呼和浩特东站", sid: "M116", kind: "hub", icon: "railway", exit: "A" },
    // 白塔机场两口天然分向：A 仅供出站、B 仅供进站——用双字段分别指定
    { name: "白塔机场", sid: "M120", kind: "hub", icon: "plane", enterExit: "B", leaveExit: "A" },
    // ── 名胜景点 ──
    { name: "内蒙古博物院", sid: "M114", kind: "poi", tag: "省博", exit: "A" },
    { name: "将军衙署", sid: "M110", kind: "poi", tag: "全国文保", exit: "A" }
];
window.HOHHOT_HOTSPOTS = HOHHOT_HOTSPOTS;
window.CGO_HOTSPOTS = HOHHOT_HOTSPOTS;
