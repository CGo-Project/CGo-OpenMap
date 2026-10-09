/**
 * CGo OpenMap - 沈阳「快速前往」静态清单（行程规划面板的推荐目的地）
 *
 * 母产品 /map 同名功能口径：**纯静态写入、无热度算法、不消费规划结果**。
 * 两类（kind）：
 *   hub = 交通枢纽（机场 / 火车站——一律映射**地铁侧**站点，保证可参与规划；
 *         国铁 rdot 散站不直接做端点）
 *   poi = 名胜景点（首批口径：3A 及以上景区、省市级博物馆、全国重点文物保护
 *         单位——仅收录地铁可及且站点映射确凿的，宁少勿错）
 * 字段：name 显示名；sid 地铁站 ID（点击即填入起 / 终点）；kind 分组；
 *       tag 副标题（等级 / 类别）；icon 分组图标（hub 逐条给了 plane/railway，
 *       poi 统一 tourist，可逐条覆盖）；
 *       **接驳出入口**（可选）：exit = 通用接驳口；enterExit / leaveExit 分别
 *       覆盖「设为起点（进站）/ 设为终点（出站）」的取口——点选时自动带上，
 *       并在需求启用时按合规口自动替换（见 route-panel 的 enforceExitCompliance）。
 *       口编号取自 data_exits.js，配的口不存在时静默不设。
 * 站点映射出处：cultural 报站字典（沈阳故宫→怀远门、九一八→合作街、沈阳博物馆→
 *       人民广场）与站名直取（北陵公园 / 东陵公园 / 新乐遗址即站名本身）。
 *
 * 供共享层 shared/route-panel.js 读取（约定全局 CGO_HOTSPOTS，其他城市自建同名
 * 文件与全局即可接入；没有该文件的城不出「快速前往」区）。
 */
const SHENYANG_HOTSPOTS = [
    // ── 交通枢纽 ──
    { name: "沈阳站", sid: "0114", kind: "hub", icon: "railway", enterExit: "L1", leaveExit: "A2" },
    { name: "沈阳北站", sid: "0207", kind: "hub", icon: "railway", exit: "A" },
    { name: "沈阳南站", sid: "0422", kind: "hub", icon: "railway", exit: "A" },
    // 桃仙机场：航站楼直接口（data_exits 手工补录的「航站楼（-1F）」）
    { name: "桃仙机场", sid: "0226", kind: "hub", icon: "plane", exit: "航站楼" },
    // ── 名胜景点（3A+ 景区 / 省市级博物馆 / 全国文保）──
    { name: "沈阳故宫", sid: "0118", kind: "poi", tag: "全国文保 · 4A", exit: "C" },
    { name: "张学良旧居", sid: "0118", kind: "poi", tag: "全国文保 · 4A", exit: "C" },
    { name: "北陵公园（昭陵）", sid: "0204", kind: "poi", tag: "全国文保 · 4A", exit: "E" },
    { name: "东陵公园（福陵）", sid: "0128", kind: "poi", tag: "全国文保 · 4A", exit: "B" },
    { name: "新乐遗址", sid: "0203", kind: "poi", tag: "全国文保", exit: "B" },
    { name: "九·一八历史博物馆", sid: "1011", kind: "poi", tag: "博物馆", exit: "E" },
    { name: "辽宁省博物馆", sid: "0222", kind: "poi", tag: "省博", exit: "A" },
    { name: "沈阳博物馆", sid: "0209", kind: "poi", tag: "市博", exit: "D" }
];
window.SHENYANG_HOTSPOTS = SHENYANG_HOTSPOTS;
window.CGO_HOTSPOTS = SHENYANG_HOTSPOTS;
