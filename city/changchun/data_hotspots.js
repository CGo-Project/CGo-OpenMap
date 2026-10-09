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
    { name: "净月潭公园", sid: "0351", kind: "poi", tag: "5A" },
    // 以下按「官方交通建议含地铁」补录（2026-10-09 搜索核实，接驳口待逐口核对暂不配）：
    // 长春世界雕塑园（5A）：本地宝交通页「1 号线市政府站 B2 口步行 594 米」
    { name: "长春世界雕塑园", sid: "0133", kind: "poi", tag: "5A", exit: "B2" },
    // 长影旧址博物馆（4A）：长春轨道交通集团官方推文「3 号线湖西桥站 B 口」
    { name: "长影旧址博物馆", sid: "0330", kind: "poi", tag: "4A" },
    // 吉林省博物院（省博）：长春轨道交通集团官方推文「6 号线省博物院站 C 口」
    { name: "吉林省博物院", sid: "0641", kind: "poi", tag: "省博", exit: "C" },
    // ── 省市级公共建筑（2026-10-09 按长春轨道交通集团官方推文补录）──
    { name: "长春历史文化博物馆", sid: "0233", kind: "poi", tag: "市属场馆", exit: "C2" },
    { name: "长春市博物馆", sid: "0133", kind: "poi", tag: "市属场馆", exit: "D" },
    { name: "长春市城乡规划展览馆", sid: "0133", kind: "poi", tag: "市属场馆", exit: "D" },
    { name: "吉林省自然博物馆", sid: "0348", kind: "poi", tag: "省属场馆" }
];
window.CHANGCHUN_HOTSPOTS = CHANGCHUN_HOTSPOTS;
window.CGO_HOTSPOTS = CHANGCHUN_HOTSPOTS;
