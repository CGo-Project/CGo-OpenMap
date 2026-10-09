/**
 * CGo OpenMap - 长春「快速前往」静态清单（行程规划面板的推荐目的地）
 *
 * 口径同 city/shenyang/data_hotspots.js：纯静态写入、无热度算法、不消费规划结果。
 * ⚠️ 龙嘉机场暂无地铁直达（轨道交通空港线在建）——**机场不做端点**（pickable 会拦
 * 在建站），待通车后补录；伪满国务院等无就近地铁站映射的景点暂不收录。
 * 接驳口字段（exit / enterExit / leaveExit）可选，未配则点选只填车站、不指定口。
 * 供共享层 shared/route-panel.js 读取（约定全局 CGO_HOTSPOTS）。
 */
const CHANGCHUN_HOTSPOTS = [
    // ── 交通枢纽 ──
    { name: "长春站", sid: "0125", kind: "hub", icon: "railway", exit: "A" },
    { name: "长春西站", sid: "0225", kind: "hub", icon: "railway", exit: "SE" },
    // ── 名胜景点 ──
    { name: "伪满皇宫博物院", sid: "0321", kind: "poi", tag: "全国文保 · 4A", exit: "B" },
    { name: "长影世纪城", sid: "0355", kind: "poi", tag: "4A", exit: "A" },
    // 净月潭公园（0351）暂无出口数据，不配接驳口
    { name: "净月潭公园", sid: "0351", kind: "poi", tag: "5A" }
];
window.CHANGCHUN_HOTSPOTS = CHANGCHUN_HOTSPOTS;
window.CGO_HOTSPOTS = CHANGCHUN_HOTSPOTS;
