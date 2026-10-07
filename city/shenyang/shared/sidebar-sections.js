/**
 * CGo OpenMap - 侧栏区块协调器（共享层）
 *
 * ⚠️ 临时共享位置：与 route-panel.js、sidebar-refit.js 等同处 city/shenyang/shared/，
 * 计划随共享层整体迁入 core/。
 *
 * 为什么有它：固定侧栏里的可折叠区块原本各自为政 —— 核心按 .panel-section 批量展开/折叠、
 * route-panel 自己挂观察器反推「谁刚展开」再按一堆特例收别人、sidebar-refit 为腾高度又扫一遍
 * DOM、map-tools 再写一份。四处互不知晓，只能靠监听 class 间接协同。本模块把它们收敛成
 * **一份唯一真相 + 一个唯写入口**：状态由自己持有（class 只是投影），规则声明式表达。
 *
 * 规则（按项目规格）
 * ────────────────
 * 1. 展开窗口的最大高度 = min(内容高度, 侧栏剩余高度)；
 * 2. 主窗口（图例 / 规划行程 / 地图小工具）同时只允许展开一个，优先级
 *    地图小工具 > 规划行程 > 图例（搜索另立一档，见下）；
 * 3. 次级窗口（车站详情 / 路线结果 / 小工具图例）展开时，折叠除搜索外的其它窗口；
 * 4. 次级窗口有最小高度（规格 20em）：展开后若剩余高度不足，**依次收起其它窗口**，
 *    一满足即停；全部收完仍不满足就到此为止 —— **不把别的窗口挤压出去**；
 * 5. 侧栏收起/重开时按快照还原各区块的展开态。
 *
 * 搜索的席位：与图例/规划/小工具可共存，但展开规划行程或地图小工具时会被一并收起；
 * 展开图例时反过来把搜索带出来（这两条由各模块用 collidesWith / onExpand 声明）。
 *
 * 对外接口（window.CGoSidebarSections）
 *   register(spec) / unregister(id) / refresh() / refit()
 *   expand(id, reason) / collapse(id, reason) / toggle(id, reason)
 *   collapseAllExcept(ids, reason) / isExpanded(id) / expandedIds() / settle()
 *
 * SectionSpec
 *   id            区块 DOM id（唯一标识）
 *   el            区块根节点（带 .collapsed 语义）
 *   group         互斥组，默认 "main"；"compact"（搜索）与 main 组共存
 *   collidesWith  额外声明式冲突：本区块展开时要一并收起的 id 列表
 *   priority      数值越大优先级越高，用于「依次收起其它窗口」的顺序（默认 0）
 *   secondary     true = 次级窗口：展开时折叠除搜索外的其它窗口，且受 minHeight 约束
 *   minHeightEm   最小高度（em，按区块自身字号折算），0 表示不限
 *   persist       是否参与侧栏快照还原（默认 true）
 *   onExpand/onCollapse  状态变化回调（detail.reason 说明是谁引起的）
 *
 * @event cgo:sidebar-section-change  { id, expanded, reason }
 * @event cgo:sidebar-sections-restored {}
 */
(function () {
    "use strict";

    if (window.__cgoSidebarSectionsBound) return;
    window.__cgoSidebarSectionsBound = true;

    const MOBILE_MAX = 640;
    const PINNED_CLASS = "legend-pinned";
    const HIDDEN_CLASS = "pinned-hidden";
    const COLLAPSED_CLASS = "collapsed";
    const SEARCH_ID = "section-search";
    const CARD_GAP = 8;              // 与 sidebar-refit.css 的 --cgo-sb-card-gap 一致

    const registry = new Map();      // id -> spec
    const collapsed = new Map();     // id -> boolean（唯一真相）
    let applying = false;            // 自己改 class 期间为真，观察器据此区分外部改动
    let snapshot = null;

    const inPinnedSidebar = () =>
        window.innerWidth > MOBILE_MAX && document.body.classList.contains(PINNED_CLASS);

    const groupOf = (spec) => spec.group || "main";
    const byPriority = (a, b) => (a.priority || 0) - (b.priority || 0);
    /**
     * 折叠与否**一律读 DOM**。
     *
     * ⚠️ 别改成「以内部 Map 为准」：核心与 route-panel 有好几条路径是直接改 class 的
     * （menuBtn 批量展开、dockStationPanel、runPlan 里 remove('collapsed')…），
     * 内部状态只能靠观察器事后采纳。只要采纳还没跑到，`expandedSpecs()` 就会漏掉那些
     * 实际上已经展开的区块 —— 表现正是「展开次级窗口时收不掉别的窗口」。
     * DOM 是唯一真源，`collapsed` 这份 Map 已废弃，只保留给快照比对时的语义参考。
     */
    const isCollapsed = (spec) => spec.el.classList.contains(COLLAPSED_CLASS);
    const expandedSpecs = () => [...registry.values()].filter((s) => !isCollapsed(s));

    /* ── 高度账：最大高 = min(内容高, 剩余高) ────────────────────────────────── */
    /** 区块自身的最小高度（px）；minHeightEm 按它自己的字号折算 */
    function minHeightOf(spec) {
        if (!spec.minHeightEm) return 0;
        const font = parseFloat(window.getComputedStyle(spec.el).fontSize) || 13;
        return Math.round(spec.minHeightEm * font);
    }

    /**
     * 该区块展开后能用的剩余高度：宿主可视高 − 内边距 − 其它兄弟区块占掉的高度 − 缝隙。
     * 宿主可能不是 #legend-content（结果面板在动态内容区），故一律以 parentElement 为准。
     */
    function remainingFor(spec) {
        const host = spec.el.parentElement;
        if (!host || !host.clientHeight) return Infinity;      // 量不到就别限制（浮层形态/未布局）
        const cs = window.getComputedStyle(host);
        let others = 0, count = 0;
        for (const sib of host.children) {
            if (sib === spec.el) continue;
            others += sib.getBoundingClientRect().height;
            count++;
        }
        const used = others + (realGap(host) || CARD_GAP) * count;
        const avail = host.clientHeight
            - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0) - used;
        return Math.max(0, Math.round(avail));
    }

    function realGap(host) {
        const gap = parseFloat(window.getComputedStyle(host).rowGap);
        return Number.isFinite(gap) ? gap : 0;
    }

    /**
     * 把「最大高度」写到展开区块上。
     *
     * ⚠️ 暂时停用内联 max-height：实测它在真实窗口里会把展开窗口压到看不见、还连累缩放控件
     * 与标题栏浮岛的观感（`remainingFor` 的「其它兄弟占掉的高度」在宿主不是 #legend-content
     * 时会失真），因此先交回 CSS 那套（小工具卡片的 100vh 口径 + 规划/结果的 flex:1），
     * 等其余规则（三选一、次级窗口、车站详情收口）稳定后再单独把这条高度账接回来并逐项实测。
     * 规格第 1 条「最大高 = min(内容高, 剩余高)」目前由 CSS 兜着，精度不如现算。
     */
    function applyHeight() {
        // 有意留空：见上方说明
    }

    /** 宿主尺寸/兄弟区块变了就重算一遍（窗口 resize、某块展开折叠后都走它） */
    function refit() {
        if (!inPinnedSidebar()) {
            registry.forEach((spec) => spec.el.style.removeProperty("max-height"));
            return;
        }
        expandedSpecs().forEach(applyHeight);
    }

    /* ── 状态落库 ────────────────────────────────────────────────────────────── */
    function emit(spec, nowCollapsed, reason) {
        const detail = { id: spec.id, expanded: !nowCollapsed, reason: reason || "api" };
        document.dispatchEvent(new CustomEvent("cgo:sidebar-section-change", { detail }));
        const hook = nowCollapsed ? spec.onCollapse : spec.onExpand;
        if (typeof hook === "function") hook(detail);
    }

    function apply(spec, nowCollapsed, reason) {
        const changed = isCollapsed(spec) !== nowCollapsed;
        collapsed.set(spec.id, nowCollapsed);
        if (changed) {
            applying = true;
            try { spec.el.classList.toggle(COLLAPSED_CLASS, nowCollapsed); } finally { applying = false; }
        }
        applyHeight(spec);
        if (changed) emit(spec, nowCollapsed, reason);
    }

    function sortForCollapse(list) {
        // 先收优先级最低的；同级则后加入的先收（DOM 里更靠下的往往是次要窗口）
        return list.slice().sort(byPriority);
    }

    /**
     * 次级窗口的最小高度保障：不足时依次收起其它窗口，一满足即停；
     * 全收完仍不足就停手 —— 规格明确「不要将其他窗口挤压出去」，宁可让它自己内部滚动。
     */
    function ensureMinHeight(spec, reason) {
        const min = minHeightOf(spec);
        if (!min) return;
        if (remainingFor(spec) >= min) return;
        const others = sortForCollapse(
            expandedSpecs().filter((s) => s.id !== spec.id && s.id !== SEARCH_ID && !s.secondary)
        );
        for (const other of others) {
            // 逐个收、逐个判，达成即停；「至少留一个」的护栏也在这里生效
            autoCollapse([other], `min-height:${spec.id}`);
            if (remainingFor(spec) >= min) return;
        }
    }

    /** 收掉除白名单外的所有区块（次级窗口展开、车站详情展开都用它） */
    function collapseAllExcept(ids, reason) {
        const keep = new Set(ids || []);
        autoCollapse(expandedSpecs().filter((spec) => !keep.has(spec.id)), reason || "collapse-others");
    }

    /**
     * 「至少留一个」的一组：路线结果 与 小工具图例。
     *
     * 规格：**自动**让位（为别的次级窗口腾高度、别的窗口展开时的收口）不得把这两类清光 ——
     * 至少留一个展开；两者本来都没展开时也不去生造一个。
     * 手动收起、或该窗口自己失效（换起点、切车站）不受此限。
     */
    const KEEP_ONE_GROUP = ["cgo-route-result", "cgo-map-tools-panel"];

    /**
     * 自动收起一批区块。
     * @param {Array} specs 本次打算收起的区块（可能为空）
     * @returns {void}
     */
    function autoCollapse(specs, reason) {
        if (!specs.length) return;
        const doomed = new Set(specs.map((spec) => spec.id));
        const openMembers = KEEP_ONE_GROUP.filter((id) => {
            const spec = registry.get(id);
            return spec && !isCollapsed(spec);
        });
        // 这一批会把「至少留一个」那组全收掉时，放过其中一个（不额外展开、更不生造）
        const spare = openMembers.length && openMembers.every((id) => doomed.has(id))
            ? openMembers[0] : null;
        specs.forEach((spec) => {
            if (spec.id !== spare) apply(spec, true, reason);
        });
    }

    /**
     * 收起「车站详情」窗口（核心生成的历史区块，如 #station-section-0115）。
     *
     * 它们不在登记表里 —— 元素由核心按选中车站动态重建，绑不住固定节点，故这里按核心的
     * 类名直接收。属于本模块里唯一一处「认识核心 DOM」的地方，集中在此便于日后上游改了
     * 选择器时一处修改。
     * 规格要求：主窗口（图例 / 规划行程 / 地图小工具）与次级窗口展开时都要收起车站详情。
     */
    function collapseStationWindows(reason) {
        document.querySelectorAll("#sidebar-dynamic-content .station-history-section:not(.collapsed)")
            .forEach((section) => {
                applying = true;
                try { section.classList.add(COLLAPSED_CLASS); } finally { applying = false; }
            });
    }

    function collapseRivals(id, reason) {
        const spec = registry.get(id);
        if (!spec) return;
        const group = groupOf(spec);
        expandedSpecs().forEach((other) => {
            if (other.id === id || groupOf(other) !== group) return;
            apply(other, true, `exclusive:${id}`);
        });
        (spec.collidesWith || []).forEach((otherId) => {
            const other = registry.get(otherId);
            if (other && !isCollapsed(other)) apply(other, true, `collides:${id}`);
        });
        // 次级窗口：规格要求「展开时折叠除搜索外的其它窗口」
        if (spec.secondary) collapseAllExcept([id, SEARCH_ID], `secondary:${id}`);
        // 车站详情不管属于哪一类，展开别的窗口时都要收（规格：展开时收起车站详情窗口）
        collapseStationWindows(reason || `expand:${id}`);
    }

    function expand(id, reason) {
        const spec = registry.get(id);
        if (!spec || !inPinnedSidebar()) return;
        collapseRivals(id, reason);
        apply(spec, false, reason);
        ensureMinHeight(spec, reason);
        refit();
    }

    function collapse(id, reason) {
        const spec = registry.get(id);
        if (!spec) return;
        apply(spec, true, reason);
        refit();
    }

    function toggle(id, reason) {
        if (isCollapsed(registry.get(id) || { el: { classList: { contains: () => true } } })) expand(id, reason);
        else collapse(id, reason);
    }

    /** 收敛到「每组至多一个展开」：核心那批批量展开之后用它收口 */
    function settle(reason) {
        if (!inPinnedSidebar()) return;
        const opened = expandedSpecs().filter((s) => groupOf(s) === "main");
        opened.slice(1).forEach((s) => apply(s, true, `settle:${reason || "core"}`));
        refit();
    }

    /* ── 外部改动（核心批量展开 / 直接改类）的采纳 ───────────────────────────── */
    let observer = null;
    const OBSERVE_OPTIONS = { attributes: true, attributeFilter: ["class"] };

    /**
     * 采纳一次外部改动（核心的批量展开、route-panel 直接改类…）。
     * 这里**不做「与自身状态比对」**——状态就是 DOM，比了必然恒等、直接 return，
     * 外部展开就不会再被协调（三选一、收车站详情、次级窗口收口全部失效）。
     * 观察器只在 `applying` 为假时进来，所以这里必然是一次真实的外部改动。
     */
    function adopt(spec) {
        const nowCollapsed = spec.el.classList.contains(COLLAPSED_CLASS);
        if (!nowCollapsed) {
            collapseRivals(spec.id, "external");
            ensureMinHeight(spec, "external");
        }
        emit(spec, nowCollapsed, "external");
        refit();
    }

    /**
     * 换绑：MutationObserver **没有**「撤销单个节点」的接口（`unobserve` 并不存在），
     * 故一律 disconnect 后按注册表重新观察全部节点。注册 / 注销 / 元素被重建都走它。
     * ⚠️ 曾写成 `observer.unobserve(el)`，注册时直接抛 TypeError，登记中途断掉。
     */
    function rebindObserver() {
        if (!observer) return;
        observer.disconnect();
        registry.forEach((spec) => observer.observe(spec.el, OBSERVE_OPTIONS));
    }

    function ensureObserver() {
        if (observer) return;
        observer = new MutationObserver((records) => {
            if (applying) return;
            for (const record of records) {
                const spec = registry.get(record.target.id);
                if (spec) adopt(spec);
            }
        });
        rebindObserver();
    }

    function register(spec) {
        if (!spec || !spec.id || !(spec.el instanceof HTMLElement)) return;
        const prev = registry.get(spec.id);
        const elChanged = !prev || prev.el !== spec.el;
        registry.set(spec.id, spec);
        collapsed.set(spec.id, spec.el.classList.contains(COLLAPSED_CLASS));
        ensureObserver();
        if (elChanged) rebindObserver();
        refit();
    }

    function unregister(id) {
        if (!registry.has(id)) return;
        registry.delete(id);
        collapsed.delete(id);
        rebindObserver();
        refit();
    }

    /** 元素可能被核心整块重建（renderLegend 重写 #legend-content），各模块挂好新节点后调它一次 */
    function refresh() {
        let elChanged = false;
        registry.forEach((spec) => {
            const el = document.getElementById(spec.id);
            if (el && el !== spec.el) { registry.set(spec.id, { ...spec, el }); elChanged = true; }
        });
        if (elChanged) rebindObserver();
        refit();
    }

    /* ── 侧栏「收起 / 重开」的状态快照 ───────────────────────────────────────── */
    /* 核心的顶栏菜单按钮重新展开侧栏时，会把所有「非历史区块」一律 remove('collapsed')，
       收起再打开一次，搜索 / 图例 / 规划行程就被强制摊开。快照取在**收起的那一刻**
       （pinned-hidden 刚挂上时）：核心收起侧栏只折叠历史车站区块，在册的固定区块此刻还没被碰过，
       抓到的正是用户离开时的布局，也没有竞态。
       ⚠️ 别改成「可见期间每次状态变化都刷新」——重开时核心那批批量展开会先被采纳、把快照写成全部摊开。 */

    function takeSnapshot() {
        const out = {};
        registry.forEach((spec) => {
            if (spec.persist === false) return;
            out[spec.id] = isCollapsed(spec);
        });
        return out;
    }

    function applySnapshot(snap) {
        if (!snap) return;
        // 只对「状态真的变了」的区块回调：还原期间回调里的模块策略（如搜索展开时带出图例）
        // 会顺手改别的区块，那不是还原该做的事 —— 快照必须说了算。
        const changed = [];
        applying = true;
        try {
            Object.entries(snap).forEach(([id, nowCollapsed]) => {
                const spec = registry.get(id);
                if (!spec) return;
                if (isCollapsed(spec) !== nowCollapsed) changed.push(spec);
                collapsed.set(id, nowCollapsed);
                spec.el.classList.toggle(COLLAPSED_CLASS, nowCollapsed);
            });
        } finally {
            applying = false;
        }
        changed.forEach((spec) => emit(spec, isCollapsed(spec), "restore"));
        refit();
        document.dispatchEvent(new CustomEvent("cgo:sidebar-sections-restored"));
    }

    function watchVisibility() {
        let lastHidden = document.body.classList.contains(HIDDEN_CLASS);
        new MutationObserver(() => {
            const hidden = document.body.classList.contains(HIDDEN_CLASS);
            if (hidden === lastHidden) return;
            lastHidden = hidden;
            if (hidden) snapshot = takeSnapshot();
            else applySnapshot(snapshot);
        }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }

    let refitQueued = false;
    function scheduleRefit() {
        if (refitQueued) return;
        refitQueued = true;
        requestAnimationFrame(() => { refitQueued = false; refit(); });
    }

    window.CGoSidebarSections = {
        register, unregister, refresh, refit,
        expand, collapse, toggle, collapseAllExcept, settle,
        isExpanded: (id) => {
            const spec = registry.get(id);
            return Boolean(spec) && !isCollapsed(spec);
        },
        expandedIds: () => expandedSpecs().map((s) => s.id)
    };

    watchVisibility();
    // 窗口尺寸一变，剩余高度账就全变了；宿主重建由各模块调 refresh() 覆盖
    window.addEventListener("resize", scheduleRefit);
})();
