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
    // 将军衙署：本地宝地铁攻略明确「1 号线将军衙署站 C2 口」（据以修正此前的 A 口）
    { name: "将军衙署", sid: "M110", kind: "poi", tag: "全国文保", exit: "C2" },
    // 以下按「官方交通建议含地铁」补录（2026-10-09 搜索核实，接驳口待逐口核对暂不配）：
    // 大召无量寺（国保）：本地宝地铁攻略「1 号线附属医院站 C 口 + 接驳」
    { name: "大召无量寺", sid: "M107", kind: "poi", tag: "全国文保", exit: "C" },
    // 五塔寺（1988 国保）：本地宝地铁攻略「2 号线诺和木勒站 D 口」（1 号线南茶坊站本站数据未收录）
    { name: "五塔寺", sid: "M216", kind: "poi", tag: "全国文保", exit: "D" },
    // 公主府博物馆（全国文保）：本地宝地铁攻略「2 号线公主府站 A 口步行 1.1 公里」
    { name: "公主府博物馆", sid: "M212", kind: "poi", tag: "全国文保", exit: "A" },
    // ── 省市级公共建筑（2026-10-09 按呼市本地宝「景点地铁出行攻略」补录）──
    { name: "内蒙古美术馆", sid: "M115", kind: "poi", tag: "省属场馆", exit: "C" },
    { name: "内蒙古科技馆", sid: "M115", kind: "poi", tag: "省属场馆", exit: "D" },
    { name: "呼和浩特雕塑艺术馆", sid: "M114", kind: "poi", tag: "省属场馆", exit: "C" }
];
window.HOHHOT_HOTSPOTS = HOHHOT_HOTSPOTS;
window.CGO_HOTSPOTS = HOHHOT_HOTSPOTS;
