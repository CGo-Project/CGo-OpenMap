/**
 * CGo 国铁散点（rdot）站名标签机制（city/shenyang/shared/base/rdot-label.js）
 *
 * 语义（用户约定的例外规则，**只在「线网发展史」播放中生效**）：
 *   · 国铁站**还没有**轨道交通线路接驳时 —— 站名**强制显示**（图上一个没有名字的孤点没法认）；
 *   · 一旦接驳成立 —— **隐藏**（同名 / 邻近的轨交站名已承担识别，如长春站 / 长春西站的
 *     国铁名不再与地铁名重复标）。
 * ⚠️ **非演示态（底图）不套用这条**：数据里写 `hideLabel: true` 的 rdot 在底图上一律不显示
 *    标签，与数据原意完全一致 —— 「接驳前显示」是演练里的叙事手法，不该外溢到日常浏览
 *    （否则接驳线还在建的站，如长春 龙嘉 / 九台南，会在底图上凭空多出一个标签）。
 *
 * 本模块只负责**让标签节点可被渲染**（底图隐藏、演示可按时间接管）；演示态的显隐判定
 * 在 `opening-history.js` 的 `syncRdotLabels()` 里，按「接驳对端是否已入场」逐帧算。
 *
 * 判定源：城市的**三张**换乘登记表 —— `VIRTUAL_FREE_TRANSFER_MAP`（免费虚拟换乘）、
 * `VIRTUAL_TRANSFER_MAP`（付费虚拟换乘）、`VIRTUAL_CONNECT_LINES`（站外连接线）。
 * ⚠️ 三张都要看：坐标完全重合的城市（哈尔滨 / 呼和浩特、大连北站）只在付费映射里
 *    登记配对、**不画连线**（车站在同一处，连线没有意义），早先只读免费映射 + 连线，
 *    这些城市会被误判成「无接驳」，机制形同虚设。
 * rdot 站的对端里只要有一个是**已开通轨交站**（type 非 rdot 且非 no）就算「有接驳」。
 *
 * ⚠️ core 对 `hideLabel: true` 的站**根本不渲染标签节点**（script.js 里 `continue`），
 * 所以「强制显示」必须发生在 core 渲染之前 —— 本模块在数据就绪后把无接驳 rdot 的
 * `hideLabel` 摘掉，让 core 正常渲染；有接驳的站保持原样（该藏就藏）。
 * 未来接驳线开通（对端站从 no 转正）后重跑本模块即可自动「恢复隐藏」，
 * 数据侧只需给该站如实写 `hideLabel: true`。
 *
 * ⚠️ 车站字典的读法（曾经的静默失效点）：经典脚本顶层的 `stationsData` **不挂 window**
 * —— 哈尔滨 / 呼和浩特 / 大连的部分 `data_stations.js` 只写 `const stationsData = {…}`，
 * 没有 `window.stationsData = stationsData` 那一句。而本模块在 core 之前执行（core 是
 * module、最后跑），此时 `window.processedStations` 也还不存在 —— 若只认 window 上的
 * 名字，整条机制在这些城市直接 `return false`，页面上看不出任何异常。故按名直读全局
 * 词法变量（typeof 守卫），与 `VIRTUAL_*` 的读法同源。
 *
 * 接入方式：main.html 在**全部数据脚本之后**全局引入（core 是 module、最后执行，故治理
 * 必然先于渲染）。各城无需任何配置。
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    /**
     * 车站字典：先取全局词法里的经典脚本 `stationsData`（多数城市的唯一来源），
     * 运行期再回落到 core 挂到 window 的字典。
     */
    function stationTable() {
        if (typeof stationsData !== "undefined" && stationsData) return stationsData;
        return window.processedStations || window.stationsData || null;
    }

    /**
     * 三张换乘登记表（免费映射 / 付费映射 / 站外连线）。
     * `VIRTUAL_*` 是城市脚本的顶层 const、**不挂 window**，故按名直读（typeof 守卫）；
     * 同时保留 window 兜底，兼容显式挂全局的写法。
     */
    function transferTables() {
        return {
            free: (typeof VIRTUAL_FREE_TRANSFER_MAP !== "undefined" && VIRTUAL_FREE_TRANSFER_MAP)
                || window.VIRTUAL_FREE_TRANSFER_MAP || {},
            paid: (typeof VIRTUAL_TRANSFER_MAP !== "undefined" && VIRTUAL_TRANSFER_MAP)
                || window.VIRTUAL_TRANSFER_MAP || {},
            conn: (typeof VIRTUAL_CONNECT_LINES !== "undefined" && VIRTUAL_CONNECT_LINES)
                || window.VIRTUAL_CONNECT_LINES || []
        };
    }

    /** 该站的全部对端车站 ID（三张表合一、按出现顺序去重） */
    function peersOf(sid, tables) {
        const out = [];
        const push = (list) => (Array.isArray(list) ? list : [list]).forEach((p) => {
            if (p && out.indexOf(p) < 0) out.push(p);
        });
        const t = tables || transferTables();
        push(t.free[sid]);
        push(t.paid[sid]);
        (t.conn || []).forEach((c) => {
            if (c && c.from === sid) push(c.to);
            if (c && c.to === sid) push(c.from);
        });
        return out;
    }

    /**
     * 该 rdot 站在**终态**是否有轨交接驳：任一登记表里的对端存在轨交站（不区分形态）。
     * ⚠️ 底图的隐藏已不依赖它（底图一律隐藏，见 injectBaseCss）；演示态的显隐按
     *    「对端是否已入场」在 opening-history.js 里算。此处保留为通用判定 / 对外参考。
     */
    function hasRailLink(sid, st, tables) {
        const table = st || stationTable() || {};
        return peersOf(sid, tables || transferTables()).some((p) => {
            const q = table[p];
            return !!q && q.type !== "rdot";
        });
    }

    /**
     * 数据治理：rdot 标签一律**先让 core 渲染**（`hideLabel` 置 false 并打意图标记
     * `_rdotHideAfterLink`），显隐改由「此刻有没有接驳」决定：
     *   · 底图（非演示）：一律隐藏（与数据原意一致，见 injectBaseCss）；
     *   · 演示：opening-history.js 按「接驳对端站是否已入场」逐帧显隐。
     * 幂等：重复跑不会把已隐藏的站标签找回来。
     */
    function apply() {
        const st = stationTable();
        if (!st) return false;
        Object.keys(st).forEach((sid) => {
            const s = st[sid];
            if (!s || s.type !== "rdot") return;
            if (s.hideLabel === true) {
                s.hideLabel = false;
                s._rdotHideAfterLink = true;   // 意图标记：底图隐藏、演示按接驳时间接管
            }
        });
        injectBaseCss(st);
        return true;
    }

    /**
     * 底图（非演示态）**一律隐藏**这些 rdot 的标签 —— 数据里写 `hideLabel: true` 的站，
     * 本意就是「底图上看不到它」（同名 / 邻近的轨交站名已经承担识别，或该站根本不需要标名）。
     * 本模块之所以先把它摘掉，只是为了**让 core 把标签节点渲染出来**，好让演示态能按时间
     * 显隐（core 对 `hideLabel: true` 的站直接 `continue`，不渲染就没法后补）。
     *
     * ⚠️ 早先这里只隐藏「终态已有接驳」的那些，于是「接驳尚未成立」的站（长春 龙嘉 / 九台南
     * 的接驳线还在建）在底图上被**强制显示**了 —— 那是演示态的语义，不该外溢到非演示态。
     * 现在底图与数据原意一致：全部隐藏；「接驳前强制显示」只发生在演练播放中。
     */
    function injectBaseCss(st) {
        if (typeof document === "undefined" || !document.head) return;
        const hide = Object.keys(st).filter((sid) => {
            const s = st[sid];
            return s && s.type === "rdot" && s._rdotHideAfterLink;
        });
        const css = hide.map((sid) => [
            `#map-content:not(.cgo-oh-stage) #label_${sid}`,
            `#map-content:not(.cgo-oh-stage) [data-cgo-callout="${sid}"]`
        ].join(",")).join(",") + "{display:none !important}";
        if (!css) return;
        const el = document.createElement("style");
        el.id = "cgo-rdot-label-hide";
        el.textContent = css;
        document.head.appendChild(el);
    }

    // 数据就绪即治理（main.html 在数据区之后引入，此时数据已挂载）
    apply();

    // 对外暴露：opening-history.js 的演示态显隐复用同一套判定（保证与底图同口径）；
    // apply 幂等，接驳线数据更新后可再调一次
    window.CGoRdotLabel = {
        apply: apply,
        hasRailLink: hasRailLink,
        peersOf: peersOf,
        transferTables: transferTables,
        stationTable: stationTable
    };
})();
