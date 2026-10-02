/**
 * CGo OpenMap - 行程规划面板（共享层）
 *
 * ⚠️ 临时共享位置：与 route-planner.js、route-data.js 同处 city/shenyang/shared/，
 * 计划随共享层整体迁入 core/。
 *
 * 拆成两个面板，骨架与行为对齐车站详情面板（复用 .panel-header / .panel-body /
 * .panel-footer / .panel-close-btn 等全局类与其主题变量）：
 *   #cgo-route-card   规划行程：起终点选择（搜索 / 地图选点 / 定位）与查询
 *   #cgo-route-result 行程结果：分段步骤与换乘汇总
 *
 * 入口：顶栏（#mz-menu 与 #mz-in 之间）+ 车站信息板底栏（station-board 的 footer 插槽）
 *
 * 依赖（均由本目录共享层提供）
 *   CGoRouteData.build() → network   CGoRoutePlanner.create() → planner
 * 城市侧只需提供 window.CGO_ROUTE_CONFIG（字段适配器、坐标查询、城市图标）。
 *
 * @event cgo:route-opened   { from, to }
 * @event cgo:route-planned  { minutes, stops, transfers }
 * @event cgo:route-closed
 */
(function () {
    "use strict";

    const PLAN_ID = "cgo-route-card";
    const RESULT_ID = "cgo-route-result";
    const ENTRY_ID = "cgo-route-entry";
    const STYLE_ID = "cgo-route-style";
    const BACKDROP_ID = "cgo-route-backdrop";
    const PICK_TIP_ID = "cgo-route-picker-tip";
    const MAX_SUGGEST = 30;
    /** 固定侧栏形态下 section-body 需要自带一层 flex 列布局（核心的 .section-body 是 display:block） */
    const SECTION_BODY_CLASS = "cgo-rt-section-body";

    /* ── 样式注入：按脚本自身 URL 找同名 css，调用方无需手工引用 ──
       注意要把 query（?v= 版本号）一并带过去：Service Worker 对静态资源是「精确匹配优先」，
       CSS 的 URL 若恒定不变，改了样式也会一直被旧缓存命中。 */
    (function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const src = document.currentScript?.src;
        if (!src) return;
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = src.replace(/route-panel\.js(\?|$)/, "route-panel.css$1");
        document.head.appendChild(link);
    })();

    const allStations = () => window.stationsData || {};
    const allLines = () => window.linesData || [];
    const stationName = (sid) => allStations()[sid]?.cn || sid;
    const stationEn = (sid) => allStations()[sid]?.en || "";
    const linesAt = (sid) => allLines().filter((line) => !line.isPointOnly
        && (line.stationIds || []).includes(sid));
    /** 可参与规划：已开通且至少属于一条可规划线路（国铁等点状线路的站不可用） */
    const pickable = (sid) => allStations()[sid]?.type !== "no" && linesAt(sid).length > 0;

    const state = { from: null, to: null, result: null, routes: [], routeIndex: 0, planner: null, picking: null };
    const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

    /**
     * 形态判定：固定侧栏（桌面端 body.legend-pinned）下两个面板改造成 panel-section 入驻
     * #legend-content——只有此时 .section-header 才可见、#legend-content 才是 flex 列。
     * 判定条件与核心 renderLegend() 的分叉保持一致；浮层弹窗与移动端抽屉仍用原有浮动面板，
     * 两套形态随 pin 状态自动迁移（见 syncRoutePanels）。
     */
    const inPinnedSidebar = () =>
        window.innerWidth > 640 && document.body.classList.contains("legend-pinned");
    const panelMode = () => (inPinnedSidebar() ? "section" : "float");

    /**
     * 固定侧栏里「规划行程」区块的展开态。该区块在侧栏是常驻的（与搜索、图例同级），
     * 入口按钮只切换它的展开 / 折叠，不会把它撤下；浮层形态下它仍是按需开关的浮窗，与此状态无关。
     */
    let planExpanded = false;

    /**
     * 面板元素的权威引用。核心重建 #legend-content、rebuildSidebarHistory 清空动态内容区时，
     * 会把入驻的面板整个摘出文档，此后 getElementById 再也找不到它们——只靠查询既拿不回
     * 状态也做不了形态迁移，故额外留一份模块内引用（livePanel 优先取文档里的活节点）。
     */
    const panelRefs = new Map();
    const trackPanel = (panel) => panelRefs.set(panel.id, panel);
    function livePanel(id) {
        const live = document.getElementById(id);
        if (live) { panelRefs.set(id, live); return live; }
        return panelRefs.get(id) || null;
    }

    /* ======================================================================
     * SVG 图标注入
     * ==================================================================== */

    /**
     * 核心的 injectInlineSvgs 是内部函数，只随车站信息板的 helpers 下发给模块
     * （见 core/script.js 的 context.helpers）。这里优先复用核心那一份，避免为了
     * 一个工具函数去改动上游核心；若用户本次会话还没打开过车站信息板，
     * 则退化为本地实现，行为与核心保持一致：带缓存、按 --svgclr/--svgtext 赋色、
     * 占位类换成 svg-icon-inlined（城市模块的徽标定制依赖这个类）。
     */
    let coreInjectSvgs = null;
    const SVG_CACHE = new Map();

    function adoptHelpers(context) {
        const helpers = context?.helpers || context?.city?.helpers || window.StationBoard?.helpers || null;
        if (typeof helpers?.injectInlineSvgs === "function") coreInjectSvgs = helpers.injectInlineSvgs;
    }

    async function injectSvgs(root) {
        if (!root) return;
        if (coreInjectSvgs) return coreInjectSvgs(root);
        for (const node of root.querySelectorAll(".svg-icon-placeholder[data-src]")) {
            const src = node.dataset.src;
            const meta = window.getLineSvgMeta?.(src);
            if (meta) {
                const clr = node.dataset.svgclr || meta.svgclr;
                const txt = node.dataset.svgtext || meta.svgtext;
                if (clr) node.style.setProperty("--svgclr", clr);
                if (txt) node.style.setProperty("--svgtext", txt);
                if (meta.color) node.style.setProperty("--data3", meta.color);
            }
            let content = SVG_CACHE.get(src);
            if (!content) {
                try {
                    const resp = await fetch(src);
                    if (resp.ok) { content = await resp.text(); SVG_CACHE.set(src, content); }
                } catch { /* 图标取不到时保留占位，不影响其余文字信息 */ }
            }
            if (!content) continue;
            node.innerHTML = content;
            node.classList.remove("svg-icon-placeholder");
            node.classList.add("svg-icon-inlined");
        }
    }

    /* ======================================================================
     * 搜索
     * ==================================================================== */

    function searchStations(keyword) {
        const kw = String(keyword || "").trim().toLowerCase();
        if (!kw) return [];
        const hits = [];
        Object.entries(allStations()).forEach(([sid, station]) => {
            if (!pickable(sid) || !station.cn) return;
            const cn = String(station.cn), en = String(station.en || "");
            const cnLower = cn.toLowerCase(), enLower = en.toLowerCase();
            let score = -1;
            if (cnLower === kw || enLower === kw || sid.toLowerCase() === kw) score = 0;
            else if (cnLower.startsWith(kw) || enLower.startsWith(kw)) score = 1;
            else if (cnLower.includes(kw) || enLower.includes(kw)) score = 2;
            if (score >= 0) hits.push({ sid, cn, en, score });
        });
        return hits
            .sort((a, b) => a.score - b.score || a.cn.length - b.cn.length)
            .slice(0, MAX_SUGGEST);
    }

    /**
     * 线路徽标占位符：与核心检索面板使用同一套结构与类名。
     * 由 core 注入 SVG 后，城市模块会把同一行内的多条线路合并为单个紧凑徽标；
     * 未实现该能力的城市自动退化为并列的单线路图标，与检索面板表现一致。
     */
    function badgesHtml(sid) {
        const sorted = linesAt(sid).slice().sort((a, b) =>
            (window.getLineSortIndex?.(a.id) ?? 0) - (window.getLineSortIndex?.(b.id) ?? 0));
        return sorted.map((line) => {
            if (!line.svg) return "";
            const meta = window.getLineSvgMeta?.(line.svg || line.id);
            const style = meta ? `--svgclr:${meta.svgclr};--svgtext:${meta.svgtext};` : "";
            const src = window.getSvgPath?.(line.svg) || "";
            return `<span class="svg-icon-placeholder search-line-icon" data-src="${src}" style="${style}"></span>`;
        }).join("");
    }

    function renderSuggest(field, panel, keyword) {
        const hits = searchStations(keyword);
        if (!hits.length) {
            panel.innerHTML = `<div class="cgo-rt-empty">没有匹配的车站</div>`;
            panel.classList.add("show");
            return;
        }
        panel.innerHTML = hits.map((hit) => `
            <div class="search-item" data-sid="${hit.sid}">
                ${badgesHtml(hit.sid)}
                <span class="search-item-text">${hit.cn}
                    <span style="font-size:12px;color:var(--text-light);">${hit.en}</span>
                </span>
            </div>
        `).join("");
        panel.classList.add("show");
        injectSvgs(panel);
    }

    /* ======================================================================
     * 规划行程面板
     * ==================================================================== */

    /** 查询面板的内容区与底栏：两种形态共用，形态差异只在外层骨架（见下方两个 Html） */
    function planContentHtml() {
        return `
            <div class="panel-body">
                <div class="cgo-rt-fields">
                    <div class="cgo-rt-rail">
                        <i class="cgo-rt-dot from"></i>
                        <i class="cgo-rt-rail-line"></i>
                        <i class="cgo-rt-dot to"></i>
                    </div>
                    <div class="cgo-rt-inputs">
                        <div class="cgo-rt-field" data-field="from">
                            <input type="text" placeholder="搜索起点站" autocomplete="off">
                            <div class="cgo-rt-suggest"></div>
                        </div>
                        <div class="cgo-rt-field" data-field="to">
                            <input type="text" placeholder="搜索终点站" autocomplete="off">
                            <div class="cgo-rt-suggest"></div>
                        </div>
                    </div>
                    <button class="cgo-rt-swap" title="对调起终点"><cgo-icon name="vi-way" size="18" class="cgo-rt-swap-icon"></cgo-icon></button>
                </div>
                <div class="cgo-rt-actions">
                    <button class="cgo-rt-quick" data-quick="locate">
                        <cgo-icon name="location" size="14"></cgo-icon>定位
                    </button>
                    <button class="cgo-rt-quick" data-quick="pick">
                        <cgo-icon name="map" size="14"></cgo-icon>地图选点
                    </button>
                    <button class="cgo-rt-quick" data-quick="clear">
                        <cgo-icon name="close" size="14"></cgo-icon>清空
                    </button>
                </div>
            </div>
            <div class="panel-footer cgo-rt-foot">
                <span class="cgo-rt-status">请选择起点和终点</span>
                <button class="cgo-rt-go" disabled>查询路线<cgo-icon name="chevron-right" size="14"></cgo-icon></button>
            </div>
        `;
    }

    /** 浮层形态：独立窗口，保留可拖动的标题栏 */
    function planFloatHtml() {
        return `
            <div class="panel-header">
                <cgo-icon name="route" size="18"></cgo-icon>
                <span class="cgo-rt-title">规划行程</span>
                <button class="panel-close-btn" data-close="plan" title="关闭"><cgo-icon name="close" size="18"></cgo-icon></button>
            </div>
            ${planContentHtml()}
        `;
    }

    /**
     * 固定侧栏形态：去掉标题栏，改用侧栏统一的 section-header（标题与原标题栏标题一致），
     * 内容装进 section-body，方能吃到核心的折叠交互与侧栏排版。
     */
    function planSectionHtml() {
        return `
            <div class="section-header">
                <span class="section-title-text">规划行程</span>
                <cgo-icon name="expand-more" class="section-arrow"></cgo-icon>
            </div>
            <div class="section-body ${SECTION_BODY_CLASS}">${planContentHtml()}</div>
        `;
    }

    /**
     * 构建查询面板（不挂载）：按形态拼出浮层 / 侧栏两套骨架。
     * 两者内部类名与事件完全一致，形态切换时只换外壳，交互逻辑无需分叉。
     */
    function buildPlanPanel(mode) {
        const panel = document.createElement("div");
        panel.id = PLAN_ID;
        panel.dataset.cgoMode = mode;
        if (mode === "section") {
            panel.className = "panel-section cgo-rt-section cgo-rt-plan-section";
            panel.innerHTML = planSectionHtml();
        } else {
            panel.className = "cgo-rt-panel";
            panel.innerHTML = planFloatHtml();
        }
        bindPlanEvents(panel);
        // 拖动与移动端抽屉只属于浮层形态：侧栏里的面板由侧栏布局接管，不该被拖走
        if (mode === "float") {
            makeDraggable(panel);
            installDrawer(panel);
        }
        trackPanel(panel);
        return panel;
    }

    /** 取到查询面板：不存在或形态已过期时按当前形态重建；已被核心摘出文档的则就地挂回 */
    function ensurePlanPanel() {
        let panel = livePanel(PLAN_ID);
        if (panel && panel.dataset.cgoMode !== panelMode()) panel = null;
        if (!panel) panel = buildPlanPanel(panelMode());
        if (panel.dataset.cgoMode === "section") mountPlanSection(panel);   // 由侧栏槽位决定落点
        else document.body.appendChild(panel);
        return panel;
    }

    function bindPlanEvents(panel) {
        panel.querySelector('[data-close="plan"]')?.addEventListener("click", () => closePanel("plan"));
        panel.querySelector(".cgo-rt-swap").addEventListener("click", () => {
            [state.from, state.to] = [state.to, state.from];
            syncFields();
            refreshResult();
        });
        panel.querySelector(".cgo-rt-go").addEventListener("click", runPlan);
        panel.querySelector('[data-quick="clear"]').addEventListener("click", () => {
            state.from = state.to = null;
            syncFields();
            refreshResult();
        });
        panel.querySelector('[data-quick="locate"]').addEventListener("click", useMyLocation);
        panel.querySelector('[data-quick="pick"]').addEventListener("click", () => {
            if (state.picking) { stopPicking(); return; }   // 再点一次即取消选点
            // 起点优先，起点已定时自动转向终点
            startPicking(state.from ? "to" : "from");
        });

        // 固定侧栏形态：折叠由自己接管（takeOverHeader 摘掉了核心的通用绑定）。
        // 状态走 planExpanded 这个唯一真源，展开时顺带让位给搜索 / 图例 / 车站详情 / 路线结果
        panel.querySelector(":scope > .section-header")?.addEventListener("click", () => {
            setPlanExpanded(!planExpanded);
        });

        ["from", "to"].forEach((field) => {
            const wrap = panel.querySelector(`[data-field="${field}"]`);
            const input = wrap.querySelector("input");
            const suggest = wrap.querySelector(".cgo-rt-suggest");

            input.addEventListener("input", () => {
                renderSuggest(field, suggest, input.value);
                // 正在输入：撑到全屏让候选列表有地方铺开。除 focus 之外再兜一层 ——
                // 无窗口焦点的环境下 Blink 不派发 focus，但打字照样会触发 input
                mobileStage(panel, "full");
            });
            input.addEventListener("focus", () => {
                if (input.value) renderSuggest(field, suggest, input.value);
                // 移动端：软键盘弹出会压缩视口，半屏装不下候选列表，输入期间先撑到全屏
                mobileStage(panel, "full");
            });
            input.addEventListener("blur", () => {
                // 延迟收起，避免点击候选时先触发 blur
                setTimeout(() => {
                    suggest.classList.remove("show");
                    // 焦点已离开本面板才算输入结束；还在面板内（如转去另一个输入框）就不动档位
                    if (!panel.contains(document.activeElement)) mobileStage(panel, "half");
                }, 160);
            });
            suggest.addEventListener("mousedown", (event) => {
                const item = event.target.closest("[data-sid]");
                if (!item) return;
                event.preventDefault();
                state[field] = item.dataset.sid;
                input.value = stationName(item.dataset.sid);
                suggest.classList.remove("show");
                syncFields();
                refreshResult();
                if (field === "from" && !state.to) {
                    panel.querySelector('[data-field="to"] input').focus();   // 接着填终点，保持全屏
                } else {
                    mobileStage(panel, "half");   // 输入到此结束，收回半屏
                }
            });
        });
    }

    function syncFields() {
        const panel = document.getElementById(PLAN_ID);
        if (!panel) return;
        ["from", "to"].forEach((field) => {
            const input = panel.querySelector(`[data-field="${field}"] input`);
            input.value = state[field] ? stationName(state[field]) : "";
        });
        syncGoButton();
    }

    function syncGoButton() {
        const panel = document.getElementById(PLAN_ID);
        if (!panel) return;
        const ready = Boolean(state.from && state.to);
        panel.querySelector(".cgo-rt-go").disabled = !ready;
        if (ready) setStatus("已选好起终点");
        else if (!state.from && !state.to) setStatus("请选择起点和终点");
        else if (!state.from) setStatus("请选择起点");
        else setStatus("请选择终点");
    }

    function setStatus(text) {
        const node = document.getElementById(PLAN_ID)?.querySelector(".cgo-rt-status");
        if (node) node.textContent = text;
    }

    /** 收起所有候选下拉，避免残留列表遮挡输入行 */
    function hideSuggests() {
        document.querySelectorAll(`#${PLAN_ID} .cgo-rt-suggest`).forEach((panel) => panel.classList.remove("show"));
    }

    /* ======================================================================
     * 地图选点
     * ==================================================================== */

    /** 选点监听挂在 #map-content 上：站点层与站名标签层都在其内，站名标签因此也是点击热区 */
    function pickingHost() {
        return document.getElementById("map-content");
    }

    function onPickClick(event) {
        if (!state.picking) return;
        const node = event.target.closest?.("[data-sid]");
        if (!node) return;
        // 拦下这次点击，避免同时打开车站详情面板
        event.preventDefault();
        event.stopPropagation();
        const sid = node.dataset.sid;
        const field = state.picking;
        stopPicking();
        if (!pickable(sid)) { setStatus("该车站不参与规划"); return; }
        state[field] = sid;
        syncFields();
        refreshResult();
    }

    /** 选点按钮就地切换为「取消选点」并以危险色填充，省得再去别处找退出入口 */
    function syncPickButton() {
        const button = document.getElementById(PLAN_ID)?.querySelector('[data-quick="pick"]');
        if (!button) return;
        const picking = Boolean(state.picking);
        button.classList.toggle("danger", picking);
        button.innerHTML = picking
            ? `<cgo-icon name="close" size="14"></cgo-icon>取消选点`
            : `<cgo-icon name="map" size="14"></cgo-icon>地图选点`;
    }

    function startPicking(field) {
        stopPicking();
        if (!state.from && !state.to && field === "to") field = "from";
        state.picking = field;
        document.getElementById("map-content")?.classList.add("cgo-picking");
        setStatus(field === "from" ? "请在地图上点击起点车站" : "请在地图上点击终点车站");
        pickingHost()?.addEventListener("click", onPickClick, true);
        syncPickButton();
        // 移动端：选点全靠点图，面板缩到最小化把视野让出来，另起一条胶囊提示说明点什么、怎么退
        mobileStage(document.getElementById(PLAN_ID), "min");
        showPickTip(field);
    }

    function stopPicking() {
        if (!state.picking) return;
        state.picking = null;
        document.getElementById("map-content")?.classList.remove("cgo-picking");
        pickingHost()?.removeEventListener("click", onPickClick, true);
        syncPickButton();
        syncGoButton();
        hidePickTip();
        // 选完或取消后回到半屏，输入区重新完整露出
        mobileStage(document.getElementById(PLAN_ID), "half");
    }

    /* ======================================================================
     * 规划与结果
     * ==================================================================== */

    async function ensurePlanner() {
        if (state.planner) return state.planner;
        const config = window.CGO_ROUTE_CONFIG;
        if (!window.CGoRouteData || !window.CGoRoutePlanner || !config) return null;
        // 构建是异步的：内部先等坐标索引就绪再建图——站距缺失的区间（含以 "?" 占位的推算值）
        // 由坐标推算里程，索引未就绪时那些区间会算不出里程而不可通行
        const { network } = await window.CGoRouteData.build({
            linesData: allLines(),
            stationsData: allStations(),
            coords: config.coords,
            coordOf: config.coordOf,                    // 城市自备坐标索引时的后备
            reader: config.reader,
            virtualTransfers: config.virtualTransfers,  // 省略即由共享层取全局 VIRTUAL_*_TRANSFER_MAP
            fareSystems: config.fareSystems,            // 各自购票的线路（有轨等）拆成独立计费系统
            bend: config.bend,
            walkMinutes: config.walkMinutes,
            xferMinutes: config.xferMinutes,
            fare: config.fare
        });
        state.planner = window.CGoRoutePlanner.create(network);
        return state.planner;
    }

    async function runPlan() {
        if (!state.from || !state.to) return;
        const planner = await ensurePlanner();
        if (!planner) { setStatus("当前城市暂不支持规划"); return; }
        // 一次按多种优先级寻路，完全相同的路线会被合并为一条
        const routes = planner.planAll(state.from, state.to);
        if (!routes.length) {
            setStatus("两地之间暂无可达路线");
            clearHighlight();
            return;
        }
        state.routes = routes;
        const planPanel = document.getElementById(PLAN_ID);
        const resultPanel = ensureResultPanel();
        resultPanel.classList.remove("collapsed");
        resultPanel.classList.add("show");
        if (resultPanel.dataset.cgoMode === "section") {
            // 固定侧栏：结果面板入驻动态内容区，独占侧栏的剩余高度
            mountResultSection(resultPanel);
            makeRoomForResult();
        } else {
            // 浮层形态：结果面板接替规划面板的位置，避免拖动过后面板“跳回”初始角落
            if (planPanel?.style.left) {
                resultPanel.style.left = planPanel.style.left;
                resultPanel.style.top = planPanel.style.top;
                resultPanel.style.right = "auto";
            }
            resetDrawer(resultPanel);
        }
        // 结果面板上到栈顶，规划面板由栈自动隐去（不摘它的 show，否则关掉结果后就回不来了）
        renderRoutes(routes);
        pushPanel(RESULT_ID);
        emit("cgo:route-planned", {
            from: state.from, to: state.to,
            minutes: routes[0].minutes, stops: routes[0].stops,
            transfers: routes[0].transfers, routes: routes.length
        });
    }

    function refreshResult() {
        state.result = null;
        state.routes = [];
        state.routeIndex = 0;
        const panel = document.getElementById(RESULT_ID);
        if (panel) {
            panel.classList.remove("show");
            // 固定侧栏：结果面板本身即「有结果」的代表，随结果一起撤出侧栏；
            // 浮层形态保留窗口只清内容，下次查询就地复用
            if (panel.dataset.cgoMode === "section") panel.remove();
            else {
                panel.querySelector(".cgo-rt-steps")?.remove();
                const sum = panel.querySelector(".cgo-rt-sum");
                if (sum) sum.remove();
            }
        }
        popPanel(RESULT_ID);
        clearHighlight();
    }

    const lineOf = (id) => allLines().find((line) => line.id === String(id).split("#")[0]) || null;

    /** 当前展示的候选方案（无结果时为 null） */
    const currentRoute = () => (state.routes || [])[state.routeIndex] || null;

    const lineName = (id) => {
        const base = String(id).split("#")[0];
        return lineOf(id)?.name || base;
    };

    /**
     * 该段所在的站序。分支线（hasbranch）的站序写在 stationIds-way1 / -way2，规划内核给的
     * wi 正是这两个 way 的**有效**下标（空 way 在建图时已滤掉，见 route-data.js 的 stationGroups），
     * 故这里按同一规则取，不能写死 stationIds——那会把分支段报成主线的端点。
     */
    function wayStationIds(line, wi) {
        if (!line?.hasbranch) return line?.stationIds || [];
        const ways = ["way1", "way2"]
            .map((way) => line[`stationIds-${way}`])
            .filter((ids) => Array.isArray(ids) && ids.length);
        return ways[wi] || ways[0] || line.stationIds || [];
    }

    /**
     * 车站是否处于可运营状态（未开通车站 type "no" 不算）。
     * 与首末班车渲染共用同一份判定：优先取共享层的 CGoTimetable.isOperableStation
     * （timetable-renderer.js 在本模块之后加载，故运行时取；取不到时按同一规则就地判定）。
     */
    function isOperableStation(sid) {
        const station = allStations()[sid];
        const shared = window.CGoTimetable?.isOperableStation;
        return typeof shared === "function"
            ? shared(station)
            : !station || String(station.type || "") !== "no";
    }

    /**
     * 该乘车段的行驶方向终点站：往该方向列车的终到站，而非上/下车站。
     *
     * 与首末班车同一口径：未开通车站（type "no"）一律跳过——线路端点还在建时
     * （如长春 5 号线末端的省妇儿中心、有轨 G54/G55 首站的工农大路），
     * 方向该报该方向最后一个实际运营的车站，而不是那个尚未对外运营的站。
     */
    function rideTerminus(step) {
        const ids = wayStationIds(lineOf(step.line), Number(step.wi) || 0);
        const operable = ids.filter(isOperableStation);
        if (!operable.length) return "";
        return step.dir > 0 ? operable[operable.length - 1] : operable[0];
    }

    /** 结果面板的内容区：页签栏 + 正文（两种形态共用） */
    function resultContentHtml() {
        return `
            <div class="cgo-rt-routebar panel-tabs-container"></div>
            <div class="panel-body cgo-rt-result-body"></div>
        `;
    }

    /** 浮层形态：标题栏显示起讫站，并带关闭按钮 */
    function resultFloatHtml() {
        return `
            <div class="panel-header cgo-rt-result-head">
                <span class="cgo-rt-od">
                    <b class="cgo-rt-od-from">起点</b>
                    <cgo-icon name="arrow-right" size="16"></cgo-icon>
                    <b class="cgo-rt-od-to">终点</b>
                </span>
                <button class="panel-close-btn" data-close="result" title="关闭"><cgo-icon name="close" size="18"></cgo-icon></button>
            </div>
            ${resultContentHtml()}
        `;
    }

    /**
     * 固定侧栏形态：标题取「起点站→终点站（当前方案标签）」，
     * 折叠时在 header-color-squares 里按乘坐顺序铺开每一段线路的标志色
     * （填充见 renderActiveRoute → syncResultSectionHeader）。
     */
    function resultSectionHtml() {
        return `
            <div class="section-header">
                <span class="section-title-text"></span>
                <span class="header-color-squares"></span>
                <cgo-icon name="expand-more" class="section-arrow"></cgo-icon>
            </div>
            <div class="section-body ${SECTION_BODY_CLASS}">${resultContentHtml()}</div>
        `;
    }

    /** 构建结果面板（不挂载）：与查询面板同一套双形态思路 */
    function buildResultPanel(mode) {
        const panel = document.createElement("div");
        panel.id = RESULT_ID;
        panel.dataset.cgoMode = mode;
        if (mode === "section") {
            panel.className = "panel-section cgo-rt-section cgo-rt-result-section";
            panel.innerHTML = resultSectionHtml();
        } else {
            panel.className = "cgo-rt-panel";
            panel.innerHTML = resultFloatHtml();
        }
        bindResultEvents(panel);
        if (mode === "float") {
            makeDraggable(panel);
            installDrawer(panel);
        }
        trackPanel(panel);
        return panel;
    }

    /** 取到结果面板：不存在或形态已过期时按当前形态重建；已被核心摘出文档的则就地挂回 */
    function ensureResultPanel() {
        let panel = livePanel(RESULT_ID);
        if (panel && panel.dataset.cgoMode !== panelMode()) panel = null;
        if (!panel) panel = buildResultPanel(panelMode());
        if (panel.dataset.cgoMode === "section") mountResultSection(panel);
        else document.body.appendChild(panel);
        return panel;
    }

    function bindResultEvents(panel) {
        panel.querySelector('[data-close="result"]')?.addEventListener("click", () => closePanel("result"));
        // 页签与分享按钮都在 routebar 上做事件委托：分享按钮是出结果后才由 paintRouteBar
        // 注入的，面板创建时该节点还不存在，直接 querySelector 会取空、监听根本绑不上。
        // 原「重新选择」按钮已移除：回到查询面板改起终点，直接展开查询面板的 section-header 即可
        panel.querySelector(".cgo-rt-routebar").addEventListener("click", (event) => {
            if (event.target.closest('[data-share="route"]')) {
                event.stopPropagation();
                shareRoute();
                return;
            }
            if (event.target.closest('[data-fit="route"]')) {
                event.stopPropagation();
                fitEntireRoute();
                return;
            }
            const tab = event.target.closest("[data-route]");
            if (!tab) return;
            state.routeIndex = Number(tab.dataset.route) || 0;
            renderActiveRoute();
        });
        const body = panel.querySelector(".cgo-rt-result-body");
        body.addEventListener("click", (event) => {
            const jump = event.target.closest("[data-jump]");
            if (jump) {
                // 车站详情要停靠进侧栏，结果面板先让位：否则两者同屏，核心的线路聚焦高亮
                // 也会与规划路线高亮叠在一起
                collapseResultSection();
                window.selectStation?.(jump.dataset.jump);
                return;
            }
            const expand = event.target.closest("[data-expand]");
            if (!expand) return;
            const list = body.querySelector(`[data-list="${expand.dataset.expand}"]`);
            if (!list) return;
            const open = list.hasAttribute("hidden");
            list.toggleAttribute("hidden", !open);
            expand.classList.toggle("open", open);
        });
        // 固定侧栏形态：本区块的折叠同样得自己接管（核心的通用绑定已被 takeOverHeader 摘掉），
        // 顺带把「折叠即退出线路高亮、展开即补回来」接在这一个动作上
        panel.querySelector(":scope > .section-header")?.addEventListener("click", () => {
            const collapsed = panel.classList.toggle("collapsed");
            if (collapsed) {
                clearHighlight();
            } else {
                // 展开时让查询面板、图例与历史车站区块一起让位，正文才拿得到完整高度
                makeRoomForResult();
                // 重新露出来就按新的可用区再取一次全景：收起期间用户可能已经拖过地图
                fitEntireRoute({ park: false });
                applyHighlight(currentRoute());
            }
        });
    }

    /** 有轨还是地铁：决定编号徽标的形状与编号写法 */
    const isTramLine = (lineId) => (lineOf(lineId)?.mode === "tram"
        || String(lineId).toUpperCase().startsWith("HNT"));

    /**
     * 国铁散点线（中国铁路）：线路名里没有可抽的编号，徽标若照常走编号规则会退化成
     * 「中国铁」三个字挤在 22px 里；这类线路改用 railway 图标 + 线路徽标底色。
     * 判据与 sidebar-refit.js 的同名函数一致：国铁散点线按 AGENTS.md 的定义即 isPointOnly。
     */
    const isRailwayLine = (line) => Boolean(line)
        && (line.isPointOnly === true || String(line.name || "") === "中国铁路");

    /**
     * 线路编号的构成。
     *
     * 默认从线路名里抽数字（"1号线" → "1"、"201路" → "201"）；
     * 城市可用 CGO_ROUTE_CONFIG.lineCodes 覆盖个别线路——写字符串表示整段同号（"T5"），
     * 写 { prefix, code, suffix } 则把修饰字单独标出、渲染成小号字，
     * 例如沈阳有轨 5 号线「T5」的 T、大连 3 号线支线「3支」的支。
     *
     * @returns {{ prefix: string, code: string, suffix: string }}
     */
    function parseLineCode(lineId) {
        const id = String(lineId || "").split("#")[0];
        const override = window.CGO_ROUTE_CONFIG?.lineCodes?.[id];
        if (override && typeof override === "object") {
            return {
                prefix: String(override.prefix ?? ""),
                code: String(override.code ?? ""),
                suffix: String(override.suffix ?? "")
            };
        }
        if (override) return { prefix: "", code: String(override), suffix: "" };

        const name = String(lineOf(id)?.name || "");
        return {
            prefix: "",
            code: name.match(/\d+/)?.[0] || name.slice(0, 3) || id.slice(0, 3),
            suffix: ""
        };
    }

    /**
     * 编号的 HTML 形态：修饰字单独成段，由 .cgo-rt-affix 排成小号字。
     * 主编号不加包裹，压缩（fitModeCodes）与测宽都以它为主体。
     */
    function lineCodeHtml(lineId) {
        const { prefix, code, suffix } = parseLineCode(lineId);
        const affix = (text) => (text ? `<span class="cgo-rt-affix">${text}</span>` : "");
        return `${affix(prefix)}${code}${affix(suffix)}`;
    }

    /** 编号徽标的边长（px），与 route-panel.css 的 .cgo-rt-mode 一致；形状不变，只压文字 */
    const MODE_BADGE_SIZE = 22;
    /** 编号可用宽度占徽标边长的比例：方形只留一点边距，圆形还要躲开弧线的内收 */
    const MODE_CODE_ROOM = { square: 0.9, circle: 0.74 };
    let measureCtx = null;

    /**
     * 量编号的实际渲染宽度。
     *
     * 编号可能带小号修饰字（「T5」的 T、「3支」的支），它们与主编号字号不同，
     * 必须逐段测量——整段按主字号量会把修饰字算宽，压缩比因此偏大、文字被压小。
     * 修饰段的字体从计算样式取（隐藏元素同样取得到）。
     */
    function measureCodeWidth(codeEl, baseStyle) {
        const measure = (text, style) => {
            measureCtx.font = `${style.fontWeight || baseStyle.fontWeight} `
                + `${style.fontSize || baseStyle.fontSize} `
                + `${style.fontFamily || baseStyle.fontFamily}`;
            return measureCtx.measureText(text).width;
        };
        let total = 0;
        codeEl.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                total += measure(node.nodeValue || "", baseStyle);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                total += measure(node.textContent || "", window.getComputedStyle(node));
            }
        });
        return total;
    }

    /**
     * 把编号文字横向压扁到徽标可用宽度内。徽标本身固定为正方形 / 正圆形（见 .cgo-rt-mode
     * 的 width/height），编号偏长（"T5"、"201"）时变形的是文字，而不是把徽标撑成扁的。
     *
     * 用 canvas 量文字宽度而非读 DOM：面板折叠时徽标处于 display:none，量不出宽度，
     * 而 canvas 只依赖字体本身，任何可见状态下都能给出正确结果。
     */
    function fitModeCodes(root) {
        const codes = root?.querySelectorAll(".cgo-rt-mode > .cgo-rt-code");
        if (!codes?.length) return;
        measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
        codes.forEach((code) => {
            const badge = code.parentElement;
            const width = measureCodeWidth(code, window.getComputedStyle(badge));
            const room = MODE_BADGE_SIZE * (badge.classList.contains("circle")
                ? MODE_CODE_ROOM.circle
                : MODE_CODE_ROOM.square);
            code.style.setProperty("--cgo-rt-code-sx", (width > room ? room / width : 1).toFixed(3));
        });
    }

    /**
     * 把 steps 归并成展示用的段列表。
     *
     * 贯通运行（如大连 3 号线支线 ⇄ 13 号线）在寻路里必然是「支线 ride + through 衔接 + 13 号线 ride」
     * 三步，但乘客是在同一列车上一路坐过去的，展示上应当还原成一条贯通的线：
     * 这里按 through 衔接把相邻 ride 粘成一组，衔接本身不再产生换乘行；
     * 其余步（真换乘、出站步行）照原样打断 ride。
     */
    function groupLegs(steps) {
        const groups = [];
        let pending = null;
        const flush = () => { if (pending) { groups.push(pending); pending = null; } };

        (steps || []).forEach((step) => {
            if (step.t === "ride") {
                if (pending?.riding) {
                    pending.segments.push(step);   // 上一段 ride 没被非贯通步打断 → 同一列车继续开
                    return;
                }
                flush();
                pending = { t: "ride", segments: [step], throughName: "", riding: true };
                return;
            }
            if (step.t === "xfer" && step.through) {
                if (pending?.riding) pending.throughName ||= step.name || "";
                return;
            }
            flush();
            groups.push({ t: step.t, raw: step });
        });
        flush();
        return groups;
    }

    /**
     * 步骤区：乘车段为「出发/上车行 + 开往行 + 站数时间行」，换乘段为三行，末尾补一行到达。
     * 乘车段左侧用线路色粗竖线、换乘段用灰色竖线串联，形成一条连续的行程脊线。
     */
    function renderLegs(route, tailId) {
        const legs = [];
        let boarded = 0;
        groupLegs(route.steps).forEach((group, index) => {
            if (group.t === "ride") {
                // 贯通区段已由 groupLegs 粘成一组：按「同一列车」还原为一条线来展示
                const segments = group.segments;
                const first = segments[0];
                const last = segments[segments.length - 1];
                const line = lineOf(first.line);
                const start = first.stops[0];
                const terminus = rideTerminus(last);
                const stopsCount = segments.reduce((n, seg) => n + Math.max(0, seg.stops.length - 1), 0);
                const minutes = segments.reduce((n, seg) => n + (seg.minutes || 0), 0);
                // 编号形状：城市声明 lineCodeShape: "circle" 时地铁用圆形，其余一概圆角方形
                // （有轨即便在沈阳也保持方形，好与同号地铁线区分开）
                const codeCircle = window.CGO_ROUTE_CONFIG?.lineCodeShape === "circle" && !isTramLine(first.line);
                const codeClass = codeCircle ? "circle" : "square";
                // 国铁散点线没有编号可抽：徽标换成 railway 图标，底色就地覆盖成线路徽标底色
                // svgclr（改在本徽标的局部 --line-color 上，不动整段行程的线网走向色）
                const modeHtml = isRailwayLine(line)
                    ? `<span class="cgo-rt-mode square" style="--line-color:${line.svgclr || line.color}"><cgo-icon name="railway" size="16"></cgo-icon></span>`
                    : `<span class="cgo-rt-mode ${codeClass}"><span class="cgo-rt-code">${lineCodeHtml(first.line)}</span></span>`;
                // 途经站只列中途停站：上车站与下车站已由上下行文案表达；
                // 贯通衔接点会被相邻两段各记一次，按相邻去重压成一份
                const allStops = segments.flatMap((seg) => seg.stops)
                    .filter((sid, i, list) => i === 0 || sid !== list[i - 1]);
                const middle = allStops.slice(1, -1);
                const action = boarded === 0 ? "出发" : "上车";
                boarded++;
                // 环线没有终点站：方向报「下一站 + 内环 / 外环」（中国等右侧通行城市默认内环顺时针）。
                // 环别按站序判定，取的 dir 正是内核沿站序给出的 ±1，两者同一口径。
                // 下一站同样跳过未开通车站：环线报的是"下一站"，列车只是经过但不办客的
                // 暂缓开通站不该被报成方向（与终点站、首末班车同一口径）
                const nextStop = allStops.slice(1).find(isOperableStation) || allStops[1];
                const ring = line?.isLoop && nextStop
                    ? (window.CGoLoopDirection?.of(line, first.dir) || "") : "";
                const directionHtml = ring
                    ? `开往 <b data-jump="${nextStop}">${stationName(nextStop)}</b>（${ring}）`
                    : `开往 <b data-jump="${terminus}">${stationName(terminus)}</b>`;
                legs.push(`
                    <li class="cgo-rt-leg ride" style="--line-color:${line?.color || "var(--primary-color, #006098)"}">
                        <div class="cgo-rt-leg-head">
                            ${modeHtml}
                            <span class="cgo-rt-leg-name">
                                <b data-jump="${start}">${stationName(start)}</b><em>${action}</em>
                            </span>
                        </div>
                        <div class="cgo-rt-leg-line">
                            <span class="cgo-rt-line-name">${group.throughName || line?.name || ""}</span>
                            <span>${directionHtml}</span>
                        </div>
                        <div class="cgo-rt-leg-line${middle.length ? " cgo-rt-expandable" : ""}"${middle.length ? ` data-expand="${index}" title="查看途经车站"` : ""}>
                            ${middle.length ? `<cgo-icon class="cgo-rt-expand-caret" name="chevron-down" size="14"></cgo-icon>` : ""}
                            <span>乘坐 ${stopsCount} 站 · ${Math.round(minutes)} 分钟</span>
                        </div>
                        ${middle.length ? `
                            <div class="cgo-rt-stoplist" data-list="${index}" hidden>
                                ${middle.map((sid) => `<span data-jump="${sid}">${stationName(sid)}</span>`).join("")}
                            </div>` : ""}
                    </li>
                `);
                return;
            }
            const step = group.raw;   // 非乘车段：顺着归并前的原始步渲染
            if (step.t === "xfer") {
                legs.push(`
                    <li class="cgo-rt-leg xfer">
                        <div class="cgo-rt-leg-head">
                            <span class="cgo-rt-mode xfer"><cgo-icon name="transfer" size="16"></cgo-icon></span>
                            <span class="cgo-rt-leg-name">
                                <b data-jump="${step.at}">${stationName(step.at)}</b><em>换乘</em>
                            </span>
                        </div>
                        <div class="cgo-rt-leg-line muted"><span>站内换乘 · 约 ${Math.round(step.minutes)} 分钟</span></div>
                    </li>
                `);
                return;
            }
            // 站外步行：按位置区分「出站换乘 / 步行前往乘车 / 出站步行到达」，
            // 出站换乘里付费出站需重新购票，故用支付图标与文案区分免费/付费
            const kind = step.kind || "transfer";
            const meters = Math.round((Number(step.minutes) || 0) * 80);   // 约 4.8 km/h 步行速度
            const caption = kind === "transfer"
                ? `${step.free ? "免费出站换乘" : "付费出站换乘"} · 约 ${meters} 米 · ${Math.round(step.minutes)} 分钟`
                : `${kind === "exit" ? "出站步行至目的地" : "步行前往乘车"} · 约 ${meters} 米 · ${Math.round(step.minutes)} 分钟`;
            legs.push(`
                <li class="cgo-rt-leg walk">
                    <div class="cgo-rt-leg-head">
                        <span class="cgo-rt-mode walk"><cgo-icon name="${kind === "transfer" && !step.free ? "payment" : "walk"}" size="16"></cgo-icon></span>
                        <span class="cgo-rt-leg-name">
                            <b data-jump="${step.a}">${stationName(step.a)}</b><em>${kind === "transfer" ? "换乘" : "步行"}</em>
                        </span>
                    </div>
                    <div class="cgo-rt-leg-line muted">
                        <span>${caption}</span>
                    </div>
                </li>
            `);
        });
        legs.push(`
            <li class="cgo-rt-leg arrive">
                <div class="cgo-rt-leg-head">
                    <span class="cgo-rt-mode arrive"><cgo-icon name="gate" size="16"></cgo-icon></span>
                    <span class="cgo-rt-leg-name"><em>到达</em><b data-jump="${tailId}">${stationName(tailId)}</b></span>
                </div>
            </li>
        `);
        return legs.join("");
    }

    /**
     * 候选路线的页签栏，0/1 条时不显示。
     * 既有的 <cgo-tabs> 面板内边距（36px 40px）写在 Shadow DOM 内，在 360px 宽的面板里
     * 会把内容挤到只剩 280px 且外部无法覆盖，故沿用它的视觉规范（底部 3px 主色高亮条、
     * hover 底色）自行实现页签。
     *
     * 首次出结果与形态切换后的重绘共用本函数。选中态用专属类名而不是 .active——核心的
     * clearHighlights() 是 `document.querySelectorAll('.active')` 一把清空，任何带 .active
     * 的元素都会被它顺手抹掉（选中车站就会触发），页签的选中态因此会莫名消失。
     */
    function paintRouteBar(panel, routes) {
        const bar = panel?.querySelector(".cgo-rt-routebar");
        if (!bar) return;
        if (!routes.length) {
            bar.innerHTML = "";
            bar.classList.remove("show");
            return;
        }
        bar.innerHTML = `
            <div class="panel-tabs-nav">
                ${routes.map((route, index) => `
                    <div class="tab-item${index === state.routeIndex ? " cgo-rt-tab-active" : ""}" data-route="${index}">
                        ${route.labels[0]}
                    </div>
                `).join("")}
            </div>
            <button class="panel-share-btn" title="查看全程" data-fit="route">
                <cgo-icon name="map" size="20"></cgo-icon>
            </button>
            <button class="panel-share-btn" title="分享路线信息" data-share="route">
                <cgo-icon name="external" size="20"></cgo-icon>
            </button>
        `;
        bar.classList.add("show");
    }

    function renderRoutes(routes) {
        state.routeIndex = 0;
        paintRouteBar(ensureResultPanel(), routes);
        renderActiveRoute();
    }

    /**
     * 形态切换（pin / unpin）会重建面板外壳，新外壳里的页签栏与结果正文都是空的，
     * 只迁移状态而不重放内容，切过去就只剩一个空壳面板。据此按 state 把内容补回去。
     */
    function repaintPanels() {
        syncFields();
        const routes = state.routes || [];
        const panel = document.getElementById(RESULT_ID);
        if (panel && routes.length) {
            paintRouteBar(panel, routes);
            renderActiveRoute();
        }
    }

    /**
     * 轻提示：转发到核心的 toast（core/script.js 的 showToast，经 CGO.showToast 暴露）。
     * 核心未暴露时退化为面板内的状态行，功能不丢。
     */
    function showToast(message, type = "success") {
        const toast = window.CGO?.showToast;
        if (typeof toast === "function") {
            toast.call(window.CGO, message, type);
            return;
        }
        setStatus(message);
    }

    /**
     * 分享：把当前行程描述复制到剪贴板。
     *
     * 起讫站取实际乘车的首末站（与结果面板标题栏同一口径）：起讫点本身可能只是
     * 出站换乘的落点，末段是出站步行时步行落点才是真正的终点。
     */
    async function shareRoute() {
        const route = currentRoute();
        if (!route) return;
        const rides = route.steps.filter((step) => step.t === "ride");
        const lastStep = route.steps[route.steps.length - 1];
        const head = rides[0]?.stops[0] || state.from;
        const tail = lastStep?.t === "walk" ? lastStep.b
            : (rides.length ? rides[rides.length - 1].stops.slice(-1)[0] : state.to);
        const text = `我目前在${stationName(head)}，距离${stationName(tail)}还有 ${route.stops} 站左右，`
            + `大约 ${Math.round(route.minutes)} 分钟到达。本信息由 ${location.href} 提供，仅供参考。`;
        try {
            await navigator.clipboard.writeText(text);
            showToast("行程信息已复制，可直接粘贴分享");
        } catch (error) {
            showToast("复制失败，请手动复制行程信息", "error");
            setStatus(text);
        }
    }

    /**
     * 路线在标题里呈现的起讫站：取实际乘车的首末站（用户填的起讫点可能只是出站换乘的落点）；
     * 末段是出站步行时，步行落点才是真正的终点（如末段从地铁站步行到国铁站）。
     * 侧栏区块标题、浮层起讫行与页面标题都取这一份，口径才不会分叉。
     */
    function routeEndpoints(route) {
        const rides = route.steps.filter((step) => step.t === "ride");
        const lastStep = route.steps[route.steps.length - 1];
        return {
            head: rides[0]?.stops[0] || state.from,
            tail: lastStep?.t === "walk" ? lastStep.b
                : (rides.length ? rides[rides.length - 1].stops.slice(-1)[0] : state.to)
        };
    }

    /**
     * 页面标题（浏览器标签页）也会随焦点切换：核心在选中车站时把它写成「XX站详细信息」
     * （见 core/script.js 的 updateShareMeta），规划路线展开时则换成「起点站→终点站」导航路线。
     * 这里存一份占用前的原值，退出路线焦点时原样还回去——两条来源都会先收起对方再改标题，
     * 所以一份原值就够，不会有互相覆盖的窗口。
     */
    let titleBeforeRoute = null;

    /**
     * 上一次取景所对应的方案：用方案对象引用 + 页签序号标识，用来识别「路径真的换了」。
     */
    let lastFittedRoute = null;
    let lastFittedIndex = -1;

    /** 上一次取景时的布局签名（形态 / 抽屉档位 / 画布尺寸），用来识别「可用区变了」 */
    let lastFittedLayout = null;

    function beginRouteTitle(title) {
        if (titleBeforeRoute === null) titleBeforeRoute = document.title;
        document.title = title;
    }

    function endRouteTitle() {
        if (titleBeforeRoute === null) return;
        document.title = titleBeforeRoute;
        titleBeforeRoute = null;
    }

    function renderActiveRoute() {
        const route = currentRoute();
        if (!route) return;
        const panel = ensureResultPanel();
        panel.querySelectorAll(".cgo-rt-routebar .tab-item").forEach((tab) => {
            tab.classList.toggle("cgo-rt-tab-active", Number(tab.dataset.route) === state.routeIndex);
        });

        // 标题栏显示起讫站（浮层形态的起讫行与侧栏区块标题共用同一份口径）
        const { head, tail } = routeEndpoints(route);
        const odFrom = panel.querySelector(".cgo-rt-od-from");
        const odTo = panel.querySelector(".cgo-rt-od-to");
        if (odFrom) odFrom.textContent = stationName(head);
        if (odTo) odTo.textContent = stationName(tail);
        if (panel.dataset.cgoMode === "section") syncResultSectionHeader(panel, route, head, tail);

        const body = panel.querySelector(".cgo-rt-result-body");
        body.innerHTML = `
            <div class="cgo-rt-sum">
                <b>约 ${Math.round(route.minutes)} 分钟</b>
                <span>${route.distance} 公里 · ${route.stops} 站 · 换乘 ${route.transfers} 次${
                    route.fare === null ? "" : ` · ${route.fare} 元`}</span>
            </div>
            ${route.labels.length > 1 ? `<div class="cgo-rt-labels">${route.labels.join(" · ")}</div>` : ""}
            <ol class="cgo-rt-steps">${renderLegs(route, tail)}</ol>
        `;
        injectSvgs(body);   // 面板其余部分仍可能有需注入的 SVG 占位（结果区本身已改用文字线路名）
        fitModeCodes(body); // 编号徽标固定正形，编号偏长时压文字而不是撑徽标
        // 布局变了（pin/unpin、桌面↔移动端、抽屉换档）就按新可用区重取一次；
        // 路径变了（新出结果、切换方案页签）也重取一次。两者只取一次景，避免同一轮里连算两遍。
        const visible = isResultVisible();
        const layoutChanged = refitIfLayoutChanged();
        const routeChanged = route !== lastFittedRoute || state.routeIndex !== lastFittedIndex;
        lastFittedRoute = route;
        lastFittedIndex = state.routeIndex;
        // 面板不可见时不点亮线网（侧栏里的折叠、浮层里的隐藏都算不可见），
        // 否则核心脚本把站点高亮写回 DOM 时会连规划路径一起亮起来
        // 取景先行落位，再染高亮（高亮只动类与独立图层、不写 transform，但先后定死更稳）
        if (visible && routeChanged && !layoutChanged) fitEntireRoute({ park: false });
        if (visible) applyHighlight(route);
    }

    /**
     * 固定侧栏形态的结果面板标题：正文为「起点站→终点站（当前方案标签）」，
     * 折叠时在同一行的 header-color-squares 里按乘坐顺序铺开每一段线路的标志色。
     *
     * **不做线路去重**：每个 ride 段铺一个色块，同一条线坐几段就铺几个，
     * 色块的个数与先后顺序如实对应方案的换乘次数
     * （如 1 号线 → 2 号线 → 1 号线 铺三块，而不是被折叠成两块）。
     */
    function syncResultSectionHeader(panel, route, head, tail) {
        const title = panel.querySelector(".section-title-text");
        if (title) {
            // 括号里用当前选中页签的标签（时间最快 / 距离最短 / 票价最低），与页签栏文案保持一致；
            // 只有一条路线时页签栏不显示，但标签本身依然有值
            const tag = route.labels?.[0] || "";
            title.textContent = `${stationName(head)}→${stationName(tail)}${tag ? `（${tag}）` : ""}`;
        }
        const squares = panel.querySelector(".header-color-squares");
        if (!squares) return;
        squares.innerHTML = "";
        route.steps.filter((step) => step.t === "ride").forEach((step) => {
            const line = lineOf(String(step.line).split("#")[0]);
            if (!line) return;
            const square = document.createElement("span");
            square.className = "header-color-square";
            square.style.background = line.color;
            square.title = line.name;
            squares.appendChild(square);
        });
    }

    /**
     * 路线涉及的所有站点（含出站换乘的落点）的坐标包围盒；取不到坐标时返回 null。
     *
     * 站名标签也算进取景范围：标签是画布坐标系里的 HTML 元素，屏幕上量到的矩形除以当前缩放
     * 就是它的画布坐标占地（`#map-content` 是 `transform-origin: 0 0` 的 translate + scale，
     * 故 `mapX = (clientX − 画布左缘 − currentX) / currentScale`）。这样换算出的盒子与取景后的
     * 缩放无关——标签字号在画布坐标里是恒定值，一次换算即可，不必按目标缩放迭代求解。
     */
    function routeBounds(route) {
        const stations = allStations();
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        const view = window.getMapView?.();
        const containerRect = document.getElementById("map-container")?.getBoundingClientRect();
        /** 把站名标签的实际占地并入包围盒（隐藏 / 尚未渲染的标签不参与） */
        const includeLabel = (sid) => {
            if (!view || !(view.scale > 0) || !containerRect) return;
            const label = document.getElementById(`label_${sid}`);
            if (!label) return;
            const rect = label.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) return;
            minX = Math.min(minX, (rect.left - containerRect.left - view.x) / view.scale);
            minY = Math.min(minY, (rect.top - containerRect.top - view.y) / view.scale);
            maxX = Math.max(maxX, (rect.right - containerRect.left - view.x) / view.scale);
            maxY = Math.max(maxY, (rect.bottom - containerRect.top - view.y) / view.scale);
        };
        const push = (sid) => {
            const station = stations[sid];
            if (!station || !Number.isFinite(station.x) || !Number.isFinite(station.y)) return;
            minX = Math.min(minX, station.x);
            maxX = Math.max(maxX, station.x);
            minY = Math.min(minY, station.y);
            maxY = Math.max(maxY, station.y);
            includeLabel(sid);
        };
        route.steps.forEach((step) => {
            if (step.t === "ride") step.stops.forEach(push);
            else if (step.t === "xfer") push(step.at);
            else { push(step.a); push(step.b); }
        });
        return minX === Infinity ? null : { minX, minY, maxX, maxY };
    }

    /**
     * 桌面浮层形态下，把结果浮层就近停到标题栏下方的左上 / 右上角：浮层原本可能正压在
     * 路线要落的位置上。左侧不放——那里是缩放控件的地盘，浮层贴到它的右边缘。
     */
    function parkFloatPanel() {
        const panel = livePanel(RESULT_ID);
        if (!panel || panel.dataset.cgoMode !== "float" || !panel.classList.contains("show")) return;
        const zoom = document.getElementById("modern-zoom-control")?.getBoundingClientRect();
        const rect = panel.getBoundingClientRect();
        const containerW = document.getElementById("map-container")?.clientWidth || window.innerWidth;
        const onLeftHalf = rect.left + rect.width / 2 < containerW / 2;
        const left = onLeftHalf
            ? (zoom?.right ?? 0) + 18
            : containerW - rect.width - 20;
        panel.style.left = `${Math.max(0, Math.round(left))}px`;
        panel.style.top = `${Math.round(zoom?.top ?? 20)}px`;
    }

    /**
     * 「查看全程」：把整条路线缩放到刚好全部可见（缩放由共享层经核心钳制在城市的 minScale / maxScale 内）。
     * 桌面浮层形态下先把结果浮层挪到角落——浮层一动可用宽度就变了，
     * 故紧接着同步刷新一次视口内边距，再交给共享层的取景接口落位。
     * @param {{park?:boolean}} [options] 是否顺带把浮层挪到角落。
     *   仅用户手动点「查看全程」按钮时才挪（缺省 true）——自动取景（出结果、切方案、展开面板）
     *   不该动用户摆好的浮层位置。
     */
    function fitEntireRoute(options = {}) {
        const route = currentRoute();
        if (!route) return;
        const box = routeBounds(route);
        if (!box) return;
        if (options.park !== false && panelMode() === "float") parkFloatPanel();
        window.CGoViewportInset?.refresh?.();
        window.CGoViewportInset?.fit?.(box, { padding: 60 });
    }

    /**
     * 布局签名：形态（浮层 / 侧栏）、结果面板的移动端抽屉档位、画布尺寸。
     *
     * 取景结果由「路线包围盒」与「可用区」共同决定，所以可用区一变就得重取一次，
     * 否则路线会有一部分落在浮层下或屏幕外。这四项恰好覆盖了全部会改变可用区的切换：
     *   - pin / unpin —— 侧栏模式下 #map-container 被推开 360px（见 style.css），尺寸随之改变；
     *   - 桌面 ↔ 移动端、窗口最大化 / 还原 —— 画布尺寸改变；
     *   - 移动端半屏 ↔ 最小化 ↔ 全屏 —— 抽屉档位改变，底部遮挡随之改变。
     * 刻意不含浮层位置：用户拖动浮层时不该把视角拽走。
     */
    function layoutSignature() {
        const panel = livePanel(RESULT_ID);
        const stage = !panel ? "none"
            : panel.classList.contains("drawer-min") ? "min"
                : panel.classList.contains("drawer-full") ? "full" : "half";
        const container = document.getElementById("map-container");
        return [panelMode(), stage, container?.clientWidth || 0, container?.clientHeight || 0].join("|");
    }

    /**
     * 布局变化的取景延迟：pin / unpin 时 #map-container 有 0.3s 的 left / width 过渡
     * （见 style.css），过渡途中量到的画布尺寸仍是旧值，据此取景会偏大，
     * 等动画结束路线反而被裁掉。故等过渡落定再取景；连续变化只保留最后一次。
     */
    const LAYOUT_REFIT_DELAY = 340;
    let layoutRefitTimer = null;

    /**
     * 布局变了就按新的可用区重取一次全景，返回本次布局变化是否已被接管
     * （调用方据此避免同一次改动里重复取景）。
     * 签名先落定、取景再延后，所以取景自身引发的回流不会触发第二轮。
     */
    function refitIfLayoutChanged() {
        const signature = layoutSignature();
        const changed = signature !== lastFittedLayout;
        lastFittedLayout = signature;
        if (!changed) return false;
        clearTimeout(layoutRefitTimer);
        layoutRefitTimer = setTimeout(() => {
            layoutRefitTimer = null;
            // 落定后再确认一次：这段延迟里用户可能已经收起了结果面板
            if (currentRoute() && isResultVisible()) fitEntireRoute({ park: false });
        }, LAYOUT_REFIT_DELAY);
        return true;
    }

    /* ======================================================================
     * 图上高亮
     * ==================================================================== */

    const SVG_NS = "http://www.w3.org/2000/svg";
    const ROUTE_LAYER_ID = "cgo-route-layer";

    /**
     * 起终点 active 的归属标记。核心的车站选中态与本层给起终点加的选中态都是同一个 `.active` 类，
     * 光看类名分不出归属——故本层加的那一份一律另打一个 `data-cgo-route-endpoint` 属性：
     * 保活只补带标记的元素，拆除也只摘带标记的元素，核心与其它模块给别的车站加的 active 一律不碰。
     * 标记用属性而不是类，还因为核心的 `clearHighlights()` 是 `querySelectorAll('.active')` 一把清空，
     * 属性不会被它抹掉，保活才有依据。
     */
    const ENDPOINT_FLAG = "cgo-route-endpoint";
    /** 本轮高亮的起终点车站 ID；保活与拆除都按它重新查节点（图层重建后节点可能换新） */
    let endpointIds = [];
    let endpointObserver = null;

    /**
     * 清掉地图上残留的车站选中态：进入路线高亮时，焦点整体让给规划路线。
     * 只清 #stations-layer / #labels-layer 两处的 .active，不走核心的 clearHighlights()——
     * 后者会连核心自己的界面态一起摘（如侧栏固定按钮 #legend-pin-btn 的 active），那不该本层来动。
     */
    function clearStationActives() {
        document.querySelectorAll("#stations-layer .station.active, #labels-layer .label-group.active")
            .forEach((el) => el.classList.remove("active"));
    }

    /** 一站对应的图元与站名标签（城市可用 renderStationIcon 接管图元画法，但 id 由核心给） */
    function endpointNodes(sid) {
        return ["node_", "label_"]
            .map((prefix) => document.getElementById(prefix + sid))
            .filter(Boolean);
    }

    /**
     * 保活：起终点的 active 随时可能被核心清掉（每次 selectStation 都会先 clearHighlights()，
     * 点空白处的 resetMapState() 同理），而此时结果窗口还开着、路线高亮也还在，起终点不该跟着熄灭。
     * 这里只做「带标记却丢了 active 就补回来」，只补不删，因此不会影响核心与其它模块给别的车站加 active。
     * 节点可能被图层重建换掉，故每次按车站 ID 重新查找，不缓存元素引用。
     */
    function restoreEndpoints() {
        endpointIds.forEach((sid) => {
            endpointNodes(sid).forEach((el) => {
                el.setAttribute(`data-${ENDPOINT_FLAG}`, "");
                if (!el.classList.contains("active")) el.classList.add("active");
            });
        });
    }

    function watchEndpoints() {
        if (endpointObserver || !endpointIds.length) return;
        const layers = ["stations-layer", "labels-layer"]
            .map((id) => document.getElementById(id)).filter(Boolean);
        if (!layers.length) return;
        endpointObserver = new MutationObserver(restoreEndpoints);
        layers.forEach((layer) => endpointObserver.observe(layer, {
            attributes: true, childList: true, subtree: true, attributeFilter: ["class"]
        }));
        restoreEndpoints();
    }

    /** 点亮起终点：先清掉图上其它选中态，再给两站的图元与标签加 active（并打归属标记） */
    function markRouteEndpoints(sids) {
        clearStationActives();
        endpointIds = [...new Set(sids.filter(Boolean))];
        restoreEndpoints();
        watchEndpoints();
    }

    /** 退出路线高亮：只摘带标记的那一份 active，别的车站的选中态原样保留 */
    function clearRouteEndpoints() {
        endpointObserver?.disconnect();
        endpointObserver = null;
        endpointIds = [];
        document.querySelectorAll(`[data-${ENDPOINT_FLAG}]`).forEach((el) => {
            el.removeAttribute(`data-${ENDPOINT_FLAG}`);
            el.classList.remove("active");
        });
    }

    /** 规划路径层：独立于引擎线网层，因此不会被「淡化其余线网」的规则命中 */
    function ensureRouteLayer() {
        let layer = document.getElementById(ROUTE_LAYER_ID);
        if (layer) return layer;
        const content = document.getElementById("map-content");
        if (!content || !document.getElementById("lines-layer")) return null;
        layer = document.createElementNS(SVG_NS, "svg");
        layer.id = ROUTE_LAYER_ID;
        // 尺寸必须自己给全：引擎各图层靠 css/style.css 里的 width/height:100% 撑开，
        // 本层不在那份选择器名单里，若不写尺寸就会退回 SVG 默认值，
        // 画布坐标整片溢出被裁掉（元素在 DOM 里但完全看不见）。
        layer.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;"
            + "overflow:visible;pointer-events:none;";
        content.insertBefore(layer, document.getElementById("stations-layer") || null);
        return layer;
    }

    const stationXY = (sid) => {
        const station = allStations()[sid];
        return station && Number.isFinite(station.x) ? { x: station.x, y: station.y } : null;
    };

    /** 点在线段上的投影：返回折线上离目标最近的位置（所在线段下标 + 投影点） */
    function projectOnPath(points, target) {
        let best = null;
        for (let i = 0; i < points.length - 1; i += 1) {
            const a = points[i], b = points[i + 1];
            const dx = b.x - a.x, dy = b.y - a.y;
            const lenSq = dx * dx + dy * dy;
            const t = lenSq
                ? Math.max(0, Math.min(1, ((target.x - a.x) * dx + (target.y - a.y) * dy) / lenSq))
                : 0;
            // 投影点取两位小数：站点恰好落在折线上时应还原成站点的整洁坐标，
            // 否则会写出 679.9999999999999 这类浮点尾巴
            const point = {
                x: Math.round((a.x + dx * t) * 100) / 100,
                y: Math.round((a.y + dy * t) * 100) / 100
            };
            const dist = Math.hypot(target.x - point.x, target.y - point.y);
            if (!best || dist < best.dist) best = { dist, seg: i, t, point };
        }
        return best;
    }

    /**
     * 折线上从 from 顺向走到 to 的一段（不跨折线末端）。
     * 起点若落在 to 之后，顺向走不到，返回 null，由调用方改看反向序列那条候选。
     */
    function sliceArc(points, from, to) {
        if (!points || points.length < 2) return null;
        const a = projectOnPath(points, from);
        const b = projectOnPath(points, to);
        if (!a || !b) return null;
        // 两站投影落在同一条线段上：截取就是该线段上的一段。线段是直线，两点之间不可能
        // 再夹着折点，因此与 t 的先后无关。相邻两站——包括环线跨接缝的那一跳——多数落在这里。
        // 早先这里要求 a.t <= b.t，不满足就去反转序列重试；而反转后两点仍落在同一条线段、
        // t 的先后依旧反着，于是正反来回递归直到爆栈
        //（RangeError: Maximum call stack size exceeded）。
        if (a.seg === b.seg) return [a.point, b.point];
        if (a.seg > b.seg) return null;
        const out = [a.point, ...points.slice(a.seg + 1, b.seg + 1), b.point];
        return out.length >= 2 ? out : null;
    }

    /**
     * 跨接缝的那一条弧：折线首尾相接成环时，从 from 顺向走到折线末端，
     * 再从折线首端接到 to（环线两站之间存在两条弧，线性截取只能给出不跨接缝的那条）。
     */
    function sliceArcWrapped(points, from, to) {
        if (!points || points.length < 2) return null;
        const head = points[0], tail = points[points.length - 1];
        if (Math.hypot(head.x - tail.x, head.y - tail.y) > 1) return null;   // 折线本身不闭合
        const a = projectOnPath(points, from);
        const b = projectOnPath(points, to);
        if (!a || !b) return null;
        const out = [a.point, ...points.slice(a.seg + 1), ...points.slice(0, b.seg + 1), b.point];
        return out.length >= 2 ? out : null;
    }

    /** 这条弧上压着给定车站中的几个（用于在环线的两条弧之间取舍） */
    function stopsOnArc(arc, stops) {
        if (!arc || !Array.isArray(stops)) return 0;
        let hit = 0;
        stops.forEach((sid) => {
            const xy = stationXY(sid);
            const projected = xy ? projectOnPath(arc, xy) : null;
            if (projected && projected.dist <= 1) hit += 1;
        });
        return hit;
    }

    const arcLength = (arc) => arc.reduce((total, point, index) => (
        index ? total + Math.hypot(point.x - arc[index - 1].x, point.y - arc[index - 1].y) : 0), 0);

    /**
     * 截取线路折线在「上车站 → 下车站」之间的那一段（保留原走向与拐点）。
     *
     * 站点坐标未必落在折线上（走向由 pathPoints 定义），故两端取投影点。折线的绘制方向与
     * 乘车方向未必一致，环线（options.loop）的折线还首尾相接、两站之间存在两条弧，单看一个
     * 方向总会漏：
     *   ① 只截「不跨接缝」的那条 → 跨接缝的近路被画成绕环一整圈的远路；
     *   ② 只补「跨接缝」那条 → 反方向（如湘江路 → 公滨路）时它恰恰是绕整圈的长弧，短弧只能
     *      从反向序列上跨接缝截出来。
     * 所以四个候选都算一遍——原序列 / 反向序列 各取「顺向一段」与「跨接缝一段」——再按
     * 「弧上覆盖了本次乘车的哪些车站」取舍：覆盖多者优先，同分取更短者。
     * 非环线的折线不闭合，跨接缝那两个候选会自行落空，只剩「顺向一段」的两个方向。
     */
    function slicePath(points, from, to, options) {
        const reversed = points.slice().reverse();
        const candidates = [
            sliceArc(points, from, to),
            sliceArc(reversed, from, to),
            sliceArcWrapped(points, from, to),
            sliceArcWrapped(reversed, from, to)
        ];
        const valid = candidates.filter((arc) => Array.isArray(arc) && arc.length >= 2);
        if (!valid.length) return null;
        if (valid.length === 1) return valid[0];
        const scored = valid.map((arc) => ({
            arc,
            hit: options?.loop ? stopsOnArc(arc, options.stops) : 0,
            length: arcLength(arc)
        }));
        scored.sort((x, y) => (y.hit - x.hit) || (x.length - y.length));
        return scored[0].arc;
    }

    /**
     * 高亮层：按线路真实走向复制一份经过的路径（截断副本），再叠一层底色描边避免与底层线网糊在一起。
     * 走向取自核心的 CGoPathGeometry.lineSegments（与引擎渲染同源，含分支线路的多条走向），
     * 取不到时回退为站点直连。
     */
    function drawRoutePath(result) {
        const layer = ensureRouteLayer();
        if (!layer) return;
        layer.innerHTML = "";
        const geometry = window.CGoPathGeometry;
        result.steps.filter((step) => step.t === "ride").forEach((step) => {
            const line = lineOf(step.line);
            const head = stationXY(step.stops[0]);
            const tail = stationXY(step.stops[step.stops.length - 1]);
            let points = null;

            if (geometry?.lineSegments && line && head && tail) {
                let bestScore = Infinity;
                (geometry.lineSegments(line, allStations()) || []).forEach((segment) => {
                    if (!Array.isArray(segment.points) || segment.points.length < 2) return;
                    const from = projectOnPath(segment.points, head);
                    const to = projectOnPath(segment.points, tail);
                    if (!from || !to) return;
                    // 起讫站都更贴近的那条走向，才是本站所在的这一支
                    const score = from.dist + to.dist;
                    if (score >= bestScore) return;
                    const sliced = slicePath(segment.points, head, tail,
                        { loop: Boolean(line.isLoop), stops: step.stops });
                    if (!sliced) return;
                    bestScore = score;
                    points = sliced;
                });
            }
            if (!points) points = step.stops.map(stationXY).filter(Boolean);   // 回退：站点直连
            if (!points || points.length < 2) return;

            // 圆角必须与引擎渲染同源：直接取 CGoPathGeometry 的倒角结果。
            // 若画 polyline，只能靠 stroke-linejoin:round 得到约半个线宽的圆角，
            // 与底图 18px（直角）/ 8px（斜角）的拐角对不上，高亮线会在拐点处明显「变尖」。
            const d = geometry?.generateRoundedPath
                ? geometry.generateRoundedPath(points, line?.useStrictRounding || false)
                : `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`;
            const color = line?.color || "var(--primary-color, #006098)";
            [[15, "var(--card-bg, #ffffff)"], [9, color]].forEach(([width, stroke]) => {
                const path = document.createElementNS(SVG_NS, "path");
                path.setAttribute("d", d);
                path.setAttribute("fill", "none");
                // 颜色走内联样式：stroke 作为表现属性时不吃 CSS 变量，
                // 写成 stroke="var(--card-bg)" 会被判为无效值而丢掉
                path.style.stroke = stroke;
                path.setAttribute("stroke-width", String(width));
                path.setAttribute("stroke-linecap", "round");
                path.setAttribute("stroke-linejoin", "round");
                layer.appendChild(path);
            });
        });
    }

    function clearHighlight() {
        document.getElementById("map-content")?.classList.remove("cgo-routing");
        document.querySelectorAll(".cgo-on-route").forEach((el) => el.classList.remove("cgo-on-route"));
        clearRouteEndpoints();
        const layer = document.getElementById(ROUTE_LAYER_ID);
        if (layer) layer.innerHTML = "";
        // 高亮与页面标题同属「规划路线焦点」，一并退出
        endRouteTitle();
    }

    function applyHighlight(result) {
        clearHighlight();
        if (!result) return;
        const content = document.getElementById("map-content");
        if (!content) return;
        const stations = new Set();
        result.steps.forEach((step) => {
            if (step.t === "ride") step.stops.forEach((sid) => stations.add(sid));
            else if (step.t === "xfer") stations.add(step.at);
            else { stations.add(step.a); stations.add(step.b); }
        });
        stations.forEach((sid) => {
            ["node_", "label_"].forEach((prefix) => {
                document.getElementById(prefix + sid)?.classList.add("cgo-on-route");
            });
        });
        content.classList.add("cgo-routing");
        drawRoutePath(result);
        // 页面标题随规划路线一起切换（收起时由 clearHighlight 还原）
        const { head, tail } = routeEndpoints(result);
        // 焦点交给规划路线：先清掉图上原有的车站选中态，只点亮起终点两站（退出高亮时由
        // clearHighlight 摘除；期间被核心清掉会自动补回，见 watchEndpoints）
        markRouteEndpoints([head, tail]);
        beginRouteTitle(`「${stationName(head)}→${stationName(tail)}」导航路线`);
    }

    /* ======================================================================
     * 拖动
     * ==================================================================== */

    /** 拖到屏幕左缘这个宽度以内松手，即吸附固定到常驻侧栏（与核心 initPanelDrag 的阈值一致） */
    const DOCK_EDGE_PX = 100;

    /**
     * 标题栏拖动：与车站详情面板同一套行为（桌面端可拖、按钮/链接上不起拖、限制在视口内，
     * 拖到屏幕左缘亮起吸附提示、松手即停靠进常驻侧栏）。
     * 核心的 initPanelDrag() 写死在 #info-panel 上无法复用，故在此按同样规则实现一份；
     * 拖动时由 right 定位切到 left 定位，避免两边同时生效。
     * 吸附提示直接复用核心那个 #drag-ghost 元素，固定动作则去点核心的固定按钮，
     * 走它那套完整流程（写 localStorage、翻按钮态、重渲图例），不重复实现一遍。
     */
    function makeDraggable(panel) {
        const header = panel.querySelector(".panel-header");
        if (!header) return;
        const ghost = () => document.getElementById("drag-ghost");
        let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

        header.addEventListener("mousedown", (event) => {
            // 移动端抽屉布局（≤640px，与车站详情面板同一断点）下不拖：那里面板是全宽贴底，
            // 拖动时由 right 切到 left 会触发 shrink-to-fit 而突然变窄
            if (window.innerWidth <= 640) return;
            if (event.target.closest("button") || event.target.closest("a")) return;
            const rect = panel.getBoundingClientRect();
            dragging = true;
            startX = event.clientX;
            startY = event.clientY;
            startLeft = rect.left;
            startTop = rect.top;
            panel.style.width = `${rect.width}px`;   // 固定当前宽度，避免定位切换引发收缩
            panel.style.right = "auto";
            panel.style.left = `${rect.left}px`;
            panel.style.top = `${rect.top}px`;
            document.body.style.cursor = "move";
            event.preventDefault();
        });

        document.addEventListener("mousemove", (event) => {
            if (!dragging) return;
            const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
            const left = Math.min(Math.max(0, startLeft + (event.clientX - startX)), maxLeft);
            const top = Math.min(Math.max(0, startTop + (event.clientY - startY)), maxTop);
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            ghost()?.classList.toggle("active", event.clientX < DOCK_EDGE_PX);
        });

        document.addEventListener("mouseup", () => {
            if (!dragging) return;
            dragging = false;
            document.body.style.cursor = "";
            const hint = ghost();
            if (!hint?.classList.contains("active")) return;
            hint.classList.remove("active");
            pinToSidebar(panel);
        });
    }

    /**
     * 吸附固定：固定完之后，侧栏里应当由「被拖过来的那个面板」独占展开位。
     * 核心在这次固定里会顺手做两件事——把搜索与图例一起摊开、把上次选中的车站重新停靠并展开
     * （initLegendPin 里那句 dockStationPanel），后者还走 setTimeout、可能再延 300ms，
     * 所以统一在稍后收拾一次。延时取 360ms 就是为了压过核心那个 300ms。
     * @param {HTMLElement} panel 被拖动的面板
     */
    function pinToSidebar(panel) {
        const pinBtn = document.getElementById("legend-pin-btn");
        if (!pinBtn || document.body.classList.contains("legend-pinned")) return;
        const draggedResult = panel?.id === RESULT_ID;
        // 拖的是路线结果时别动规划行程：它的展开会顺带把结果面板收掉（yieldSidebarToPlan）
        if (!draggedResult) setPlanExpanded(true);
        pinBtn.click();
        setTimeout(() => {
            if (panelMode() !== "section") return;
            if (draggedResult) {
                // 结果面板保持可见展开，其余一并让位
                setPlanExpanded(false);
                document.getElementById("section-search")?.classList.add("collapsed");
                document.getElementById("section-legend-tree")?.classList.add("collapsed");
                collapseStationSections();
                const result = livePanel(RESULT_ID);
                if (result?.dataset.cgoMode === "section" && result.classList.contains("collapsed")) {
                    // 迁移途中可能已被互斥观察器顺手收掉，而用户拖过来就是要看它，补回展开态
                    result.classList.remove("collapsed");
                    if (currentRoute()) applyHighlight(currentRoute());
                }
            } else {
                // 拖的是查询面板：确保它展开（setPlanExpanded 内部会顺带让位）
                setPlanExpanded(true);
            }
        }, 360);
    }

    /* ======================================================================
     * 移动端抽屉
     * ==================================================================== */

    let backdropTimer = null;

    /**
     * 全屏档的顶部填色遮罩（body 级单例，规划 / 结果两个面板共用一个）。
     * 刻意不复用核心的 .mobile-top-bar-backdrop：那个由 body 的 mobile-panel-docked-full
     * 驱动，属于车站面板档位机的产物，规划面板借道加同一个类会污染对方的状态。
     */
    function routeBackdrop() {
        let el = document.getElementById(BACKDROP_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = BACKDROP_ID;
            el.className = "cgo-rt-backdrop";
            document.body.appendChild(el);
        }
        return el;
    }

    /** 移动端切档；桌面端没有抽屉，直接忽略（免得在桌面留下无意义的档位类） */
    function mobileStage(panel, stage) {
        if (!panel || window.innerWidth > 640) return;
        applyDrawerStage(panel, stage);
    }

    /** 选点提示条（元素懒建，body 级单例） */
    function pickTip() {
        let el = document.getElementById(PICK_TIP_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = PICK_TIP_ID;
            el.className = "cgo-rt-picker-tip";
            el.innerHTML = '<span class="cgo-rt-picker-dot"></span>'
                + '<span class="cgo-rt-picker-text"></span>'
                + '<button type="button" class="cgo-rt-picker-cancel">取消</button>';
            el.querySelector(".cgo-rt-picker-cancel").addEventListener("click", () => stopPicking());
            document.body.appendChild(el);
        }
        return el;
    }

    /** 进入选点时面板已缩到最小化，靠这条胶囊提示说明点什么、以及怎么退出 */
    function showPickTip(field) {
        const tip = pickTip();
        tip.querySelector(".cgo-rt-picker-text").textContent = field === "from" ? "请选择起点" : "请选择终点";
        tip.classList.add("show");
    }

    function hidePickTip() {
        document.getElementById(PICK_TIP_ID)?.classList.remove("show");
    }

    /** 只有「正在显示（栈顶）且在全屏档」的规划面板才需要填色；落定后再展开，避免与抽屉位移打架 */
    function syncBackdrop() {
        const backdrop = routeBackdrop();
        if (backdropTimer) { clearTimeout(backdropTimer); backdropTimer = null; }
        // 必须连「是否被面板栈隐藏」一起看：全屏的规划面板被结果面板（可能只是半屏）压到栈下时，
        // 它仍带着 show 与 drawer-full，只看这两个类会把遮罩错误地顶出来
        const isFull = [PLAN_ID, RESULT_ID].some((id) => {
            const el = document.getElementById(id);
            return el && el.classList.contains("show")
                && el.classList.contains("drawer-full")
                && !el.classList.contains(STACK_HIDDEN);
        });
        if (!isFull) {
            backdrop.classList.remove("show");
            return;
        }
        backdropTimer = setTimeout(() => {
            backdropTimer = null;
            backdrop.classList.add("show");
        }, 420);   // 等抽屉高度动画落定，与核心的 420ms 对齐
    }

    /** 切到指定档位（min / half / full）并同步顶部填色 */
    function applyDrawerStage(panel, stage) {
        panel.classList.toggle("drawer-min", stage === "min");
        panel.classList.toggle("drawer-full", stage === "full");
        syncBackdrop();
        // 抽屉换档等于底部遮挡变了，路线要按新的可用区重新取景
        refitIfLayoutChanged();
    }

    /** 每次呼出都回到半屏档起步，并清掉上次留下的内联高度与填色 */
    function resetDrawer(panel) {
        panel.classList.remove("drawer-min", "drawer-full", "cgo-rt-dragging");
        panel.style.height = "";
        panel.style.removeProperty("max-height");
        syncBackdrop();
    }

    /**
     * 移动端抽屉：拖动把手或标题栏跟手调整高度，松手吸附到「最小化 / 半屏 / 全屏」三档；
     * 轻点把手依次循环三档。核心的 initMobileSheetDrag() 是写死在 #info-panel 上的三档
     * 甩动系统，无法复用，故按其档位语义做一个精简版；桌面端把手隐藏、整段逻辑不生效。
     */
    function installDrawer(panel) {
        if (panel.querySelector(".cgo-rt-grabber")) return;
        const grabber = document.createElement("div");
        grabber.className = "cgo-rt-grabber";
        grabber.title = "拖动调整高度";
        panel.insertBefore(grabber, panel.firstChild);

        const viewportHeight = () => window.visualViewport?.height || window.innerHeight;
        const header = panel.querySelector(".panel-header");
        let dragging = false, moved = false, startY = 0, startHeight = 0;

        // 最小化档的高度 = 把手 + 标题栏（内容区与底栏折叠后的自然高度）
        const minHeight = () => grabber.offsetHeight + header.offsetHeight;
        const detents = () => {
            const vh = viewportHeight();
            // half 取 60vh，与半屏档的 max-height 上限对齐：半屏实际高度是「内容自适应、
            // 60vh 封顶」，吸附基准若还按旧的 40vh 算，拖到半屏位置会被误判成最小化或全屏
            return { min: minHeight(), half: vh * 0.6, full: vh - 60 };
        };

        const onDown = (event) => {
            if (window.innerWidth > 640) return;
            // 标题栏上还有「重新选择 / 关闭」等按钮，点它们照常走点击，不起拖
            if (event.target.closest("button") || event.target.closest("a")) return;
            dragging = true;
            moved = false;
            startY = event.clientY;
            startHeight = panel.getBoundingClientRect().height;
            panel.classList.add("cgo-rt-dragging");   // 拖动期间禁掉标题栏站名的文本选中
            routeBackdrop().classList.remove("show"); // 拖动期间收回填色，落定后再按档位展开
            // 半屏档的 max-height:60vh 带 !important，会压死内联 height 让面板拖不高，
            // 拖动期间必须先解除，落定后再交回 CSS
            panel.style.setProperty("max-height", "none", "important");
            event.currentTarget.setPointerCapture?.(event.pointerId);
        };

        const onMove = (event) => {
            if (!dragging) return;
            const dy = startY - event.clientY;
            if (Math.abs(dy) > 4) moved = true;
            const { min, full } = detents();
            const next = Math.min(Math.max(startHeight + dy, min), full);
            // 改 height 而非 max-height：内容不足时 max-height 既撑不高、也切不到档
            panel.style.height = `${Math.round(next)}px`;
        };

        const settle = () => {
            if (!dragging) return;
            dragging = false;
            panel.classList.remove("cgo-rt-dragging");
            // 必须在清空内联 height 之前量，否则拿到的是档位高度而非拖到的位置
            const dragged = panel.getBoundingClientRect().height;
            const { min, half, full } = detents();
            panel.style.height = "";                    // 交回 CSS 档位控制
            panel.style.removeProperty("max-height");   // 恢复该档位的高度上限

            if (!moved) {
                // 轻点把手：最小化 → 半屏 → 全屏 → 最小化 循环
                const current = panel.classList.contains("drawer-min") ? "min"
                    : panel.classList.contains("drawer-full") ? "full" : "half";
                applyDrawerStage(panel, current === "min" ? "half" : current === "half" ? "full" : "min");
                return;
            }
            const nearest = [
                { name: "min", height: min },
                { name: "half", height: half },
                { name: "full", height: full }
            ].reduce((a, b) => (Math.abs(dragged - b.height) < Math.abs(dragged - a.height) ? b : a));
            applyDrawerStage(panel, nearest.name);
        };

        // 把手与标题栏共用同一套档位拖动；标题栏的按钮已由 onDown 排除
        [grabber, header].forEach((handle) => {
            if (!handle) return;
            handle.addEventListener("pointerdown", onDown);
            handle.addEventListener("pointermove", onMove);
            handle.addEventListener("pointerup", settle);
            handle.addEventListener("pointercancel", settle);
        });
    }

    /* ======================================================================
     * 面板栈：同时打开多个面板时只显示最后打开的那个
     * ==================================================================== */

    const INFO_PANEL_ID = "info-panel";
    const STACK_HIDDEN = "cgo-rt-stacked-hidden";
    const openStack = [];

    /** 入栈（已在栈中则提到栈顶），随后只显示栈顶面板 */
    function pushPanel(id) {
        const index = openStack.indexOf(id);
        if (index >= 0) openStack.splice(index, 1);
        openStack.push(id);
        syncPanels();
    }

    function popPanel(id) {
        const index = openStack.indexOf(id);
        if (index < 0) return;
        openStack.splice(index, 1);
        syncPanels();
    }

    /**
     * 只显示栈顶：其余已打开的面板用独立类隐藏，不改动它们各自的显示状态，
     * 因此栈顶关闭后收回该类即可让「最晚打开的那个」原样恢复。
     * 车站信息面板属于核心，这里只增删这个类，绝不改写它的内联 display。
     * 固定侧栏下各面板各居其位（查询在搜索区块下、结果在动态内容区、车站面板停靠在历史区块内），
     * 天然不会互相遮挡，故整套「只显示栈顶」的规则在此停用。
     */
    function syncPanels() {
        const pinned = inPinnedSidebar();
        // 栈里可能留着已经不在文档里的面板：形态迁移时它被拆掉（见 syncRoutePanels 里
        // 「已无结果 / 形状不符」那几条 current.remove() 分支），核心重建外壳时也会被摘出文档。
        // 它若占着栈顶，真正打开的车站面板就会被永久判成「非栈顶」而隐藏（内联 display 一直是 flex，
        // observeInfoPanel 看不到变化、也就不会把它重新提到栈顶），只有核心把内联 display 关掉
        // （点空白处 resetMapState 才会）才出栈——表现出来正是「取消固定后点车站打不开详情，
        // 得先点一下空白才行」。故此处按「文档里真实存在」清理栈，栈顶永远落在可见的面板上。
        if (!pinned) {
            for (let i = openStack.length - 1; i >= 0; i--) {
                if (!document.getElementById(openStack[i])) openStack.splice(i, 1);
            }
        }
        const top = openStack[openStack.length - 1] || null;
        [PLAN_ID, RESULT_ID, INFO_PANEL_ID].forEach((id) => {
            const panel = document.getElementById(id);
            if (!panel) return;
            if (pinned) { panel.classList.remove(STACK_HIDDEN); return; }
            panel.classList.toggle(STACK_HIDDEN, id !== top && openStack.includes(id));
        });
        // 栈顶切换会连带改变「哪个面板在全屏档」，填色遮罩要跟着这个唯一的收口点同步
        syncBackdrop();
    }

    /** 核心用内联 display 控制车站信息面板显隐，据此把它并入同一个面板栈 */
    function observeInfoPanel() {
        const panel = document.getElementById(INFO_PANEL_ID);
        if (!panel || panel.dataset.cgoStackWatched === "true") return;
        panel.dataset.cgoStackWatched = "true";
        const isOpen = () => panel.style.display !== "" && panel.style.display !== "none";
        // 只在「开关状态真的翻转」时才动栈：syncPanels 给本面板增删 STACK_HIDDEN 类同样会
        // 触发本回调，而 isOpen() 只看 display（此时仍为 flex），若无条件 pushPanel，
        // 打开着的车站面板会一次次把自己抬回栈顶，规划/结果面板刚 push 就被压住看不见
        // （从顶栏入口进入时必现；经「设为起点/终点」进入因为先关掉了车站面板才侥幸避开）。
        let lastOpen = isOpen();
        new MutationObserver(() => {
            const open = isOpen();
            if (open === lastOpen) return;
            lastOpen = open;
            if (open) {
                pushPanel(INFO_PANEL_ID);
                // 固定侧栏：车站详情不与路线面板并存。这条兜住「点地图车站 → 详情停靠」那一侧，
                // 反向（展开路线面板 → 收起历史区块）由 bindExclusiveSections 与
                // 结果面板自己的 section-header 负责
                setPlanExpanded(false);
                yieldSidebarToStation();
            } else {
                popPanel(INFO_PANEL_ID);
            }
        }).observe(panel, { attributes: true, attributeFilter: ["style", "class"] });
        if (lastOpen) pushPanel(INFO_PANEL_ID);
    }

    /* ======================================================================
     * 打开 / 关闭
     * ==================================================================== */

    /**
     * 首次呼出时按左上控制条定位：面板与其同高、并停在其右侧，据此避开顶部标题栏。
     * 注意标题栏在 floating 模式下 .tool-header 高度为 0（真正可见的是绝对定位的浮岛），
     * 故锚点取 #modern-zoom-control；取不到锚点时保留 CSS 默认值并允许下次重试。
     */
    function applyDefaultPosition(panel) {
        if (panel.dataset.cgoPosApplied || window.innerWidth <= 640) return;
        const anchor = document.getElementById("modern-zoom-control");
        if (!anchor) return;
        const rect = anchor.getBoundingClientRect();
        if (!rect.height) return;
        panel.style.top = `${Math.round(rect.top)}px`;
        panel.style.left = `${Math.round(rect.right + 18)}px`;
        panel.dataset.cgoPosApplied = "true";
    }

    function openPlan(preset = {}) {
        stopPicking();
        hideSuggests();
        let panel;
        if (panelMode() === "section") {
            // 固定侧栏：面板常驻，这里只是把它展开（内部会顺带让位给搜索 / 图例 / 车站详情 / 路线结果）
            panel = ensurePlanSection(true);
            setPlanExpanded(true);
        } else {
            panel = ensurePlanPanel();
            panel.classList.add("show");
            applyDefaultPosition(panel);
            resetDrawer(panel);
        }
        // 从车站面板进来是「从这一站出发」，故预设起点并清掉上一次的终点
        if (preset.from) {
            state.from = preset.from;
            state.to = null;
        }
        if (preset.to) state.to = preset.to;
        syncFields();
        refreshResult();   // 重新规划：旧结果连同其面板一起退出（内部会出栈）
        pushPanel(PLAN_ID);
        // 起终点都已确定时不再自动聚焦：移动端聚焦会把面板撑到全屏，纯属打扰
        if (!(state.from && state.to)) {
            const focusField = state.from ? "to" : "from";
            panel.querySelector(`[data-field="${focusField}"] input`).focus();
        }
        emit("cgo:route-opened", { from: state.from, to: state.to });
    }

    function closePanel(which) {
        if (panelMode() === "section") {
            // 固定侧栏里「规划行程」是常驻区块，没有关闭一说，收起即折叠（内容与状态都留着）；
            // 结果面板则是按需存在的窗口，收起它同样保留内容，展开可恢复
            if (which === "result") collapseResultSection();
            else setPlanExpanded(false);
            emit("cgo:route-closed", {});
            return;
        }
        if (which !== "result") {
            stopPicking();
            hideSuggests();
            const planPanel = document.getElementById(PLAN_ID);
            if (planPanel) {
                planPanel.classList.remove("show");
                resetDrawer(planPanel);   // 顺手清掉移动端档位与内联高度，下次打开重新起步
            }
            popPanel(PLAN_ID);
        } else {
            const resultPanel = document.getElementById(RESULT_ID);
            if (resultPanel) {
                resultPanel.classList.remove("show");
                resetDrawer(resultPanel);
            }
            popPanel(RESULT_ID);
        }
        // 高亮归结果面板所有：它不可见了才撤销（查询面板开着与否与此无关）
        if (!isResultVisible()) clearHighlight();
        emit("cgo:route-closed", {});
    }

    function toggle() {
        if (panelMode() === "section") {
            // 固定侧栏：面板是常驻区块，入口按钮只切换它的展开 / 折叠
            setPlanExpanded(!planExpanded);
            return;
        }
        const panel = ensurePlanPanel();
        const result = document.getElementById(RESULT_ID);
        if (panel.classList.contains("show") || result?.classList.contains("show")) {
            const openId = panel.classList.contains("show") ? PLAN_ID : RESULT_ID;
            closePanel(openId === PLAN_ID ? "plan" : "result");
        } else {
            openPlan();
        }
    }

    /* ======================================================================
     * 固定侧栏入驻：槽位同步、折叠接管与互斥展开
     * ==================================================================== */

    /** 查询面板落在「搜索」区块之后（两者相邻，互斥展开的观感才连贯） */
    function mountPlanSection(panel) {
        const content = document.getElementById("legend-content");
        if (!content) return;
        const search = document.getElementById("section-search");
        if (panel.parentElement !== content || panel.previousElementSibling !== search) {
            content.insertBefore(panel, search ? search.nextSibling : content.firstChild);
        }
        takeOverHeader(panel);
    }

    /** 结果面板落在动态内容区，与历史车站区块同级 */
    function mountResultSection(panel) {
        const dynamic = document.getElementById("sidebar-dynamic-content");
        if (!dynamic) return;
        // 动态内容区里「展开的区块沉到最下方」是侧栏的既定位次规则（历史车站区块靠
        // STATION_HISTORY.push 到末尾实现同款效果），故这里始终把结果面板压在最后一位
        if (dynamic.lastElementChild !== panel) dynamic.appendChild(panel);
        takeOverHeader(panel);
    }

    /**
     * 夺回 section-header 的点击归属：核心的 bindSearchAndLegendEvents 会给所有
     * `.panel-section:not(.station-history-section) .section-header` 绑一个通用折叠（onclick 属性），
     * 与面板自带的折叠语义（退出高亮 / 折叠搜索）会互相抵消，故挂载后清掉那份属性绑定，
     * 改由 build 阶段注册的监听器独家处理。
     */
    function takeOverHeader(panel) {
        const header = panel.querySelector(":scope > .section-header");
        if (header) header.onclick = null;
    }

    /** 收起动态内容区里的历史车站区块（车站详情面板停靠在其中，一并让出位置） */
    function collapseStationSections() {
        document.querySelectorAll("#sidebar-dynamic-content .station-history-section")
            .forEach((section) => section.classList.add("collapsed"));
    }

    /**
     * 结果面板入场时腾出侧栏空间：规划行程、图例分区与历史车站区块一并收起，
     * 把纵向空间整块让给路线结果。三者都能在结果收起后手动展开回来。
     */
    function makeRoomForResult() {
        setPlanExpanded(false);
        document.getElementById("section-legend-tree")?.classList.add("collapsed");
        collapseStationSections();
    }

    /**
     * 路线结果此刻是否对用户可见。两种形态表达「收起」的方式不同：
     * 侧栏里是加 collapsed 类，浮层里是摘掉 show —— 判可见性必须分形态看，
     * 只盯 collapsed 会在浮层形态下永远为「可见」（那儿压根没有这个类）。
     * 取面板要用 livePanel 而不是 getElementById：核心重渲 #legend-content 的那一瞬间
     * 结果面板会被摘出文档，此时 getElementById 取不到、会被误判成「不可见」，
     * 进而被互斥观察器当成「该让位」而收掉。
     */
    function isResultVisible() {
        const panel = livePanel(RESULT_ID);
        if (!panel) return false;
        return panel.dataset.cgoMode === "section"
            ? !panel.classList.contains("collapsed")
            : panel.classList.contains("show");
    }

    /**
     * 收起结果面板，与用户主动收起走同一套收尾（收起即退出线路高亮）。
     * 两种形态的「收起」写法不同：侧栏里加 collapsed（保留区块），浮层里摘掉 show 并退出面板栈。
     * 浮层分支不能省——否则点车站时结果浮层仍占着栈顶，车站详情会被面板栈压住，
     * 而它的内联 display 本来就是 flex（栈隐藏只加类、不改内联），
     * observeInfoPanel 看不到变化也就不会把它提到栈顶，表现出来就是「点了车站却打不开详情」。
     */
    function collapseResultSection() {
        const panel = livePanel(RESULT_ID);
        if (!panel?.classList.contains("show")) return;
        if (panel.dataset.cgoMode === "section") {
            if (panel.classList.contains("collapsed")) return;
            panel.classList.add("collapsed");
        } else {
            panel.classList.remove("show");
            popPanel(RESULT_ID);
        }
        clearHighlight();
    }

    /** 侧栏里让位给规划行程：搜索、图例、历史车站区块与路线结果一并收起 */
    function yieldSidebarToPlan() {
        document.getElementById("section-search")?.classList.add("collapsed");
        document.getElementById("section-legend-tree")?.classList.add("collapsed");
        collapseStationSections();
        collapseResultSection();
    }

    /**
     * 侧栏里让位给车站详情（它停靠在历史车站区块里）：规划行程、图例与路线结果一并收起。
     * 规划行程必须一起收——它是互斥观察器裁定「车站详情该不该展开」的依据之一：
     * 只收图例与结果的话，观察器看到 planExpanded 仍为 true，会立刻把用户刚展开的车站详情
     * 收回去（那条分支本意是拦核心自动停靠的车站详情，见 bindExclusiveSections）。
     */
    function yieldSidebarToStation() {
        setPlanExpanded(false);
        document.getElementById("section-legend-tree")?.classList.add("collapsed");
        collapseResultSection();
    }

    /**
     * 刚迁进侧栏时的收敛：核心固定面板会把「搜索 / 图例 / 规划行程」一并 remove('collapsed')
     * （见 script.js 的 menuBtn 处理器），从移动端浮层切到桌面侧栏时就会三块同时摊开
     * （用户反馈的「图例 + 搜索 + 路线结果」即由此而来）。
     * 这里只裁掉真正冲突的两类：结果可见 → 让位给结果；规划行程展开 → 让位给它。
     * 「搜索 + 图例」本身是侧栏的合法默认态，不动。
     */
    function settleSidebarSections() {
        if (isResultVisible()) { makeRoomForResult(); return; }
        if (planExpanded) yieldSidebarToPlan();
    }

    /**
     * 设置侧栏常驻规划行程区块的展开态。planExpanded 是唯一真源：所有入口（入口按钮、
     * section-header 点击、被动让位、结果面板独占）都改它，再由此处落到 class 上，
     * 免得「状态说展开、DOM 却是折叠」这类两套真相打架。
     * 展开时顺带让位，把它需要的纵向空间腾出来。
     */
    function setPlanExpanded(expanded) {
        planExpanded = expanded;
        // 侧栏里首次呼出时这个常驻区块还不存在，补建一个再落到 class 上
        if (panelMode() === "section" && !livePanel(PLAN_ID)) ensurePlanSection();
        livePanel(PLAN_ID)?.classList.toggle("collapsed", !expanded);
        if (expanded) yieldSidebarToPlan();
    }

    /**
     * 确保「规划行程」在固定侧栏里常驻。与结果面板不同，它在侧栏不需要「打开 / 关闭」，
     * 始终占着搜索区块下方那一格，只切换展开折叠。
     * @param {boolean} [adopt=false] 是否在本次调用后按展开态让位。只在面板刚被呼出或
     *   刚迁进侧栏时传 true——日常重绑不能传，否则用户点开图例的那一刻会被这次让位反向折叠掉。
     */
    function ensurePlanSection(adopt = false) {
        let panel = livePanel(PLAN_ID);
        if (panel && panel.dataset.cgoMode !== "section") { panel.remove(); panel = null; }
        if (!panel) {
            panel = buildPlanPanel("section");
            panel.classList.add("show");
            // 首次创建时按状态初始化；已存在的面板不再动它的 class，避免与互斥观察器抢方向盘
            panel.classList.toggle("collapsed", !planExpanded);
            trackPanel(panel);
        }
        mountPlanSection(panel);
        if (adopt && planExpanded) yieldSidebarToPlan();
        return panel;
    }

    /**
     * 侧栏里同一时刻只让一个区块展开，唯一的例外是「搜索」——它矮且独立，与其余区块都能共存
     * （唯独不与规划行程并存，那是入口按钮所在的主任务区块）。
     * 用观察器而非点击监听，是因为「展开」还有好几条程序式通道：顶栏菜单按钮、核心固定面板时的
     * `fixedSections.forEach(sec => sec.classList.remove('collapsed'))`、以及停靠车站详情时的
     * `dockStationPanel` —— 它们都绕过点击直接把 collapsed 摘掉。
     * 裁定依据是「本轮刚由折叠变为展开的那一个」：正常交互只会有它一条记录，
     * 批量展开时按 DOM 顺序保留前者（搜索），与核心的默认预期一致。
     */
    let exclusiveObserver = null;

    /**
     * 侧栏此刻是否「除刚展开的搜索外全都折叠」。
     *
     * 用于决定展开搜索时要不要顺手把图例也带出来：侧栏只剩一行搜索框太空，
     * 带上图例才有内容可看。判断口径与互斥规则一致——规划行程、图例、
     * 车站详情区块、路线结果，四者都折着才算空。
     */
    function sidebarOtherwiseEmpty() {
        const legend = document.getElementById("section-legend-tree");
        const dynamic = document.getElementById("sidebar-dynamic-content");
        return !planExpanded
            && (!legend || legend.classList.contains("collapsed"))
            && !isResultVisible()
            && !dynamic?.querySelector(".station-history-section:not(.collapsed)");
    }

    function bindExclusiveSections() {
        const search = document.getElementById("section-search");
        const legend = document.getElementById("section-legend-tree");
        const dynamic = document.getElementById("sidebar-dynamic-content");
        const plan = livePanel(PLAN_ID);
        if (exclusiveObserver) exclusiveObserver.disconnect();
        exclusiveObserver = null;
        if (!plan) return;
        exclusiveObserver = new MutationObserver((records) => {
            let expanded = null;
            for (const record of records) {
                const wasCollapsed = (record.oldValue || "").includes("collapsed");
                if (wasCollapsed && !record.target.classList.contains("collapsed")) {
                    expanded = record.target;
                    break;
                }
            }
            if (!expanded || expanded === plan) {
                // 规划行程被外部（核心的批量展开）摊开：同步状态并按展开处理
                if (expanded === plan) { planExpanded = true; yieldSidebarToPlan(); }
                return;
            }
            const id = expanded.id;
            if (id === RESULT_ID) {
                // 路线结果自己展开：与 makeRoomForResult 同一套语义，但别把结果自己收掉
                makeRoomForResult();
                return;
            }
            if (id === "section-search") {
                setPlanExpanded(false);   // 搜索只与规划行程互斥，不与图例 / 车站详情 / 结果互斥
                // 侧栏此刻已空无一物（连图例都折着）时，把图例一并带出来——
                // 否则展开搜索后侧栏只剩孤零零一行，用户还得再点一次
                if (legend && sidebarOtherwiseEmpty()) legend.classList.remove("collapsed");
                return;
            }
            if (id === "section-legend-tree") {
                setPlanExpanded(false);
                collapseStationSections();
                collapseResultSection();
                return;
            }
            // 剩下就是车站详情区块。它此刻展开有两种来路：
            //   1) 用户点开某个折叠的历史区块 —— 捕获阶段的 bindStationSectionExpand 已先把规划行程
            //      与结果面板都收掉了，所以走到这里时两者都不可见；
            //   2) 核心把面板固定进侧栏时自动停靠上次选中的车站（initLegendPin 里那句 dockStationPanel，
            //      走 setTimeout，绕过上面那条捕获监听）—— 此时用户拖过来的那个面板还亮着。
            // 第 2 种是「用户拖路线面板过来、却被一个自动冒出的车站详情抢走展开位」，故反过来收起它。
            if (isResultVisible() || planExpanded) {
                collapseStationSections();
                return;
            }
            setPlanExpanded(false);
            collapseResultSection();
            document.getElementById("section-legend-tree")?.classList.add("collapsed");
        });
        [search, legend, plan].forEach((section) => {
            if (section) exclusiveObserver.observe(section, {
                attributes: true, attributeFilter: ["class"], attributeOldValue: true
            });
        });
        // 历史车站区块每次停靠车站都会重建，元素换得勤、绑不住具体节点，
        // 故直接盯住动态内容区的 class 变化（subtree 覆盖其中所有 station-section 与结果面板）
        if (dynamic) {
            exclusiveObserver.observe(dynamic, {
                attributes: true, attributeFilter: ["class"], attributeOldValue: true, subtree: true
            });
        }
    }

    /**
     * 用户点开某个折叠的历史车站区块时，先把图例与路线结果收掉。
     * 互斥裁定本身交给 bindExclusiveSections 的观察器，这里的作用是**标注意图**：
     * 核心固定面板时会自动停靠上次选中的车站（走 setTimeout，不经过点击），
     * 观察器只看 class 变化分不清两者 —— 有了这条捕获监听，轮到观察器处理时
     * 「结果面板已不可见」就说明这次展开是用户点的，反之则是核心自动冒出来的。
     */
    function bindStationSectionExpand() {
        const dynamic = document.getElementById("sidebar-dynamic-content");
        if (!dynamic || dynamic.dataset.cgoRouteExpandWatched === "true") return;
        dynamic.dataset.cgoRouteExpandWatched = "true";
        dynamic.addEventListener("click", (event) => {
            const header = event.target.closest(".station-history-section > .section-header");
            if (!header) return;
            if (header.parentElement.classList.contains("collapsed")) {
                // 用户明确要开车站详情：规划行程、图例与路线结果都让位
                yieldSidebarToStation();
            }
        }, true);
    }

    /**
     * 点地图上的车站（站点圆点或站名标签）也会打开车站详情，这条入口同样要让图例与结果面板让位
     * （从而顺带退出规划路线高亮，避免与核心的线路聚焦高亮叠在一起）。
     * 监听挂在 #map-content 而不是 #stations-layer：站名标签在 #labels-layer 内，与站点层是
     * 兄弟图层，挂在站点层上会漏掉「点站名」这一半热区。捕获阶段也不可少——车站详情已经开着时
     * 再点另一个站，#info-panel 的 display 只会在同一次微任务里 flex → none → flex 地闪一下，
     * 而 observeInfoPanel 读的是最终状态，看到的仍是 true，那次翻转判定就漏掉了。
     */
    function bindStationOpenSources() {
        const content = document.getElementById("map-content");
        if (!content || content.dataset.cgoRouteOpenWatched === "true") return;
        content.dataset.cgoRouteOpenWatched = "true";
        content.addEventListener("click", (event) => {
            // 地图选点中：这一击是给规划填起终点（由 onPickClick 接住），不是要打开车站详情，
            // 因此不该让位——否则刚点完起点，规划面板就被自己折叠了。
            // 两个监听同挂在 #map-content 的捕获阶段，且本监听注册更早，所以只能在这里判断；
            // onPickClick 里的 stopPropagation 拦不住同元素上已先执行的其他监听器。
            if (state.picking) return;
            if (event.target.closest("[data-sid]")) yieldSidebarToStation();
        }, true);
    }

    /** 退出固定侧栏（或面板撤出）时停掉互斥观察，避免盯着已脱离文档的节点 */
    function disconnectExclusiveSections() {
        if (exclusiveObserver) exclusiveObserver.disconnect();
        exclusiveObserver = null;
    }

    /* ── 侧栏收起 / 重新展开：记住各区块的展开状态，重开时按原样还原 ──────────
       核心的顶栏菜单按钮在重新展开侧栏时，会把所有「非历史区块」一律 remove('collapsed')
       （script.js 的 menuBtn 处理器），于是收起再打开一次，搜索、图例与路线面板会被
       强制摊开，跟关闭前的布局对不上。这里在侧栏可见期间持续留一份最新快照，
       pinned-hidden 消失时按快照还原。 */
    let sidebarSnapshot = null;

    function snapshotSidebarSections() {
        const snapshot = {};
        document.querySelectorAll("#legend-content .panel-section").forEach((section) => {
            if (section.id) snapshot[section.id] = section.classList.contains("collapsed");
        });
        return snapshot;
    }

    function restoreSidebarSections(snapshot) {
        if (!snapshot) return;
        // 还原本身会产生一批 class 变化，先停掉互斥观察器（连带丢弃核心那批「强制展开」的记录），
        // 否则它会把刚还原好的搜索 / 查询面板又按自己的规则改回去
        disconnectExclusiveSections();
        Object.entries(snapshot).forEach(([id, collapsed]) => {
            document.getElementById(id)?.classList.toggle("collapsed", collapsed);
            // 规划行程的展开态另有一份权威状态，跟着快照一起回写，免得两套说法打架
            if (id === PLAN_ID) planExpanded = !collapsed;
        });
        if (panelMode() === "section") bindExclusiveSections();
        // 结果面板若由「隐藏 / 折叠」还原为可见，把路线高亮一并补回来（不可见即明确退出高亮）
        if (isResultVisible() && currentRoute()) applyHighlight(currentRoute());
    }

    function watchSidebarVisibility() {
        // 快照只在侧栏可见时刷新。核心收起侧栏时会先 resetMapState() 把历史区块折叠掉、
        // 再挂上 pinned-hidden，而观察器回调要到两者都执行完才跑；若等看到 pinned-hidden
        // 再抓快照，抓到的已经是「被折叠过的」状态，关不关的差别就丢了。
        const refresh = () => {
            if (!document.body.classList.contains("pinned-hidden")) sidebarSnapshot = snapshotSidebarSections();
        };
        let lastHidden = document.body.classList.contains("pinned-hidden");
        new MutationObserver(() => {
            const hidden = document.body.classList.contains("pinned-hidden");
            if (hidden !== lastHidden) {
                lastHidden = hidden;
                if (!hidden) { restoreSidebarSections(sidebarSnapshot); return; }
            }
            if (!hidden) refresh();
        }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

        const content = document.getElementById("legend-content");
        if (content) {
            new MutationObserver(refresh).observe(content, {
                attributes: true, attributeFilter: ["class"], subtree: true
            });
        }
        refresh();
    }

    /** 形态切换后重建浮层面的面板栈（固定侧栏下不使用该机制，风格上直接排定即可） */
    function rebuildOpenStack() {
        openStack.length = 0;
        const info = document.getElementById(INFO_PANEL_ID);
        if (info && info.style.display !== "" && info.style.display !== "none") openStack.push(INFO_PANEL_ID);
        [PLAN_ID, RESULT_ID].forEach((id) => {
            if (document.getElementById(id)?.classList.contains("show")) openStack.push(id);
        });
        syncPanels();
    }

    /** 上一次归位时的形态；用于识别「移动端浮层 ⇄ 桌面侧栏」的跨形态迁移（首帧为 null） */
    let lastPanelMode = null;

    /**
     * 把已打开的面板归位到当前形态该在的地方；pin 状态翻转导致形态不符时按打开/折叠状态重建。
     * 核心在 pin、unpin、resize、切换城市时都会重建 #legend-content，rebuildSidebarHistory
     * 还会清空动态内容区，入驻的面板会被一并摘出文档——这里既是形态切换的执行点，
     * 也是被摘掉后的补挂点，故用 livePanel（带回退引用）而不是 getElementById 取面板。
     */
    function syncRoutePanels() {
        const mode = panelMode();
        // 真正跨形态迁移（首帧不算，那时只是首次入驻，应当保留核心的默认展开态）
        const modeSwitched = lastPanelMode !== null && lastPanelMode !== mode;
        lastPanelMode = mode;
        let modeChanged = false;

        // —— 规划行程：固定侧栏里是常驻区块，不参与下面那套「未打开就撤下」的规则 ——
        if (mode === "section") {
            const current = livePanel(PLAN_ID);
            if (!current || current.dataset.cgoMode !== "section") modeChanged = true;
            // 刚被呼出 / 刚迁进侧栏（modeChanged）时才按展开态让位；日常重绑不带这个动作，
            // 否则用户点开图例的那一刻会被反向折叠
            ensurePlanSection(modeChanged);
        } else {
            const current = livePanel(PLAN_ID);
            // 浮层形态下面板按需存在：侧栏里只是折叠着（没被用过）的就不必搬到浮层来占地方
            if (current?.classList.contains("show") && planExpanded) {
                if (current.dataset.cgoMode !== "float") {
                    current.remove();
                    const rebuilt = buildPlanPanel("float");
                    rebuilt.classList.add("show");
                    document.body.appendChild(rebuilt);
                    modeChanged = true;
                } else if (!current.isConnected) {
                    document.body.appendChild(current);
                }
            } else if (current && !current.isConnected) {
                panelRefs.delete(PLAN_ID);
            } else if (current && current.dataset.cgoMode === "section") {
                current.remove();
                panelRefs.delete(PLAN_ID);
            }
        }

        // —— 结果面板：只要还有结果就跟着形态走 ——
        // 它在侧栏里「折叠着」等价于在浮层里「藏着」，两者互相映射；
        // 若一律搬到浮层并 show，取消固定时就会平白冒出一个用户明明已经收起来的窗口。
        {
            const panel = livePanel(RESULT_ID);
            if (panel) {
                const hasResult = (state.routes || []).length > 0;
                if (panel.dataset.cgoMode === mode) {
                    // 形状已经对了：只需确保它待在当前形态的槽位上（含被核心摘掉后的补挂）
                    if (mode === "section") mountResultSection(panel);
                    else if (!panel.isConnected) document.body.appendChild(panel);
                } else if (!hasResult) {
                    // 已经没有结果了（浮层形态下只是清了内容没拆窗口），不必搬过去
                    panel.remove();
                    panelRefs.delete(RESULT_ID);
                } else {
                    // 形态不符：按「用户此刻看不看得见」重建
                    //   侧栏里看 collapsed，浮层里看 show —— 收起的对应浮层里的隐藏
                    const visible = panel.dataset.cgoMode === "section"
                        ? !panel.classList.contains("collapsed")
                        : panel.classList.contains("show");
                    panel.remove();
                    const rebuilt = buildResultPanel(mode);
                    // 侧栏里它是常驻槽位（show 表示「在册」），浮层里 show 就是显示
                    rebuilt.classList.toggle("show", mode === "section" || visible);
                    rebuilt.classList.toggle("collapsed", mode === "section" && !visible);
                    if (mode === "section") mountResultSection(rebuilt);
                    else document.body.appendChild(rebuilt);
                    modeChanged = true;
                }
            }
        }

        if (mode === "section") {
            bindExclusiveSections();
            bindStationSectionExpand();
        } else {
            disconnectExclusiveSections();
        }
        // 跨形态迁进侧栏时先收敛一次：核心固定面板时会顺手摊开搜索 / 图例 / 规划行程，
        // 不收敛就会出现「图例 + 搜索 + 路线结果」三块并排展开
        if (modeSwitched && mode === "section") settleSidebarSections();
        if (modeChanged) {
            // 形态切换是重建外壳，新外壳里的输入框、页签与结果正文都是空的，先按 state 重放内容
            repaintPanels();
            rebuildOpenStack();
        } else {
            syncPanels();
        }
        // 兜住「不触发重绘的布局变化」：桌面 ↔ 移动端、窗口最大化 / 还原都只改画布尺寸，
        // 结果面板既不重建也不重放内容（pin / unpin 那类会重绘的已在上面的 renderActiveRoute 里取景）
        refitIfLayoutChanged();
    }

    let syncQueued = false;
    /** 合并同一轮内的多次 DOM 变动，避免搜索联想等高频更新反复触发归位检查 */
    function scheduleRouteSync() {
        if (syncQueued) return;
        syncQueued = true;
        queueMicrotask(() => {
            syncQueued = false;
            syncRoutePanels();
        });
    }

    /**
     * 盯住 #legend-content：核心重建它会清掉入驻的面板，rebuildSidebarHistory 也会清空
     * #sidebar-dynamic-content（连同其中的结果面板）。只对「区块级」的增删做出反应，
     * 搜索联想列表那种逐条更新直接跳过。
     */
    function watchLegendForRoutePanels() {
        const content = document.getElementById("legend-content");
        if (!content || content.dataset.cgoRouteWatched === "true") return;
        content.dataset.cgoRouteWatched = "true";
        const sectionLevel = (nodes) => Array.prototype.some.call(nodes, (node) =>
            node.nodeType === 1
            && (node.id === "sidebar-dynamic-content" || node.classList?.contains("panel-section")));
        new MutationObserver((records) => {
            for (const record of records) {
                if (record.target.id === "sidebar-dynamic-content") { scheduleRouteSync(); return; }
                if (sectionLevel(record.addedNodes) || sectionLevel(record.removedNodes)) {
                    scheduleRouteSync();
                    return;
                }
            }
        }).observe(content, { childList: true, subtree: true });
    }

    /**
     * 浏览器定位：取最近车站填进空的起点/终点（失败时给出提示，不做静默降级）。
     *
     * 最近站的判定交给共享层的唯一真源 `window.CGoNearestStation.find()`（nearest-station.js），
     * 与「查找最近车站」按钮共用同一套定位坐标基准与距离口径。此处原先自建了一份候选遍历：
     * 拿原始 WGS-84 的定位去比高德 GCJ-02 的站点坐标（国内差数百米），距离又用经纬度直角距离
     * （经度未按 cos 折算），于是同一个位置会算出与那个按钮不同的车站。
     */
    async function useMyLocation() {
        if (typeof window.CGoNearestStation?.find !== "function") {
            setStatus("定位能力未就绪，请手动选择");
            return;
        }
        setStatus("正在定位…");
        try {
            const hit = await window.CGoNearestStation.find();
            // 智能选空位：起点空着就填起点，起点定了而终点还空着就填终点；
            // 两个都填过则覆盖起点——「我的位置」的本义是从我所在的地方出发。
            const field = !state.from ? "from" : (!state.to ? "to" : "from");
            state[field] = hit.sid;
            syncFields();
            refreshResult();
            setStatus(`已将「${stationName(hit.sid)}」设为${field === "from" ? "起点" : "终点"}`);
        } catch (error) {
            setStatus(error?.message || "定位失败，请手动选择");
        }
    }

    /* ======================================================================
     * 入口：顶栏 + 车站信息板底栏
     * ==================================================================== */

    /** 顶栏入口按钮与其后的分隔线：两侧都紧贴，纵向间距交给分隔线自己的 4px 上下边距 */
    function injectTopButton() {
        if (document.getElementById(ENTRY_ID)) return;
        const anchor = document.getElementById("mz-menu");
        if (!anchor) return;
        const button = document.createElement("button");
        button.id = ENTRY_ID;
        button.title = "行程规划";
        button.innerHTML = `<cgo-icon name="route" style="width:20px;height:20px;"></cgo-icon>`;
        button.addEventListener("click", toggle);
        // mz-menu 与入口按钮的底端边距都清掉，改由分隔线自带上下边距撑开
        anchor.style.marginBottom = "0";
        anchor.insertAdjacentElement("afterend", button);
        const divider = document.createElement("div");
        divider.style.cssText = "width: 20px; height: 1px; background-color: #e0e0e0; margin: 4px 0;";
        button.insertAdjacentElement("afterend", divider);
    }

    /**
     * 底栏入口行的宽度自适应（三档降级，档位由实测决定而非写死阈值）。
     *
     * 为什么要实测：能不能放下只取决于「这颗按钮自己的内容有多宽」，而按钮里装着
     * 图标 + 四个汉字，宽度随字体、字号、城市文案而变——用固定断点一定会错位。
     * 于是这里从满档开始实测本行的 scrollWidth 是否超过 clientWidth，超了就降一档再量，
     * 直到放得下；档位写在 data-cgo-fit 上，具体长什么样交给 route-panel.css 决定。
     *
     *   全档 full：四颗按钮都带完整文案
     *   二档 icons：带文案的非强调按钮（设为起点）收成图标方块
     *   三档 short：强调按钮（设为终点）的文案简化为「终点」
     *   四档 icon：强调按钮也只留图标
     *
     * 逐档实测最多触发三次强制重排，且只在挂载与本行尺寸变化时各跑一次，代价可忽略。
     */
    const ENTRY_FIT_LEVELS = ["full", "icons", "short", "icon"];

    function fitEntryRow(row) {
        // 不可见时（车站面板折叠、被别的面板顶掉）量不出尺寸，留待 ResizeObserver 回调；
        // 若此时硬判，clientWidth 为 0 会被当成「放得下」，档位就永远停在满档了。
        if (!row || !row.clientWidth) return;
        for (const level of ENTRY_FIT_LEVELS) {
            row.dataset.cgoFit = level;
            // 1px 容差：scrollWidth/clientWidth 都是取整值，边界上会假报溢出
            if (row.scrollWidth <= row.clientWidth + 1) return;
        }
    }

    function registerFooterModule() {
        if (!window.StationBoard?.registerModule) return;
        window.StationBoard.registerModule({
            id: "cgo-route-entry",
            name: "行程规划入口",
            slot: "footer",
            order: 5,
            shouldRender(context) {
                // 未开通站的底栏由开通倒计时接管；国铁站保留其 12306 行，不并入本行
                if (context.station?.type === "no" || context.isRwyStation) return false;
                return Boolean(window.CGoRoutePlanner);
            },
            render(context) {
                // 顺带接住核心下发的 SVG 注入器（自己实现一份的成本更高，见 injectSvgs 注释）
                adoptHelpers(context);
                const station = context.station || {};
                const displayLines = context.displayLines || [];
                const scheduleLine = displayLines.find((line) => line.scheduleUrl) || null;
                const scheduleUrl = scheduleLine?.scheduleUrl || "";
                const mapUrl = (typeof context.city?.getNavigationUrl === "function")
                    ? context.city.getNavigationUrl(station.cn, false, { station })
                    : `https://uri.amap.com/search?keyword=${encodeURIComponent(station.cn || "")}`;
                // 官网查询按钮的图标：默认用城市官方徽标；同一城市存在不同运营方时
                // （如长春有轨归公交集团），由城市用 officialIcon(lineId) 给出 CGoUI 图标名
                // 或内联 SVG —— 只有内联 SVG 能吃到 currentColor，随按钮文字色适配亮/暗主题
                const official = window.CGO_ROUTE_CONFIG?.officialIcon?.(scheduleLine?.id) || null;
                const officialIconHtml = official?.svg
                    ? `<span class="cgo-rt-fbtn-svg">${official.svg}</span>`
                    : `<cgo-icon name="${official?.name || window.CGO_ROUTE_CONFIG?.cityIcon
                        || context.city?.id || "external"}" size="20"></cgo-icon>`;
                return `
                    <div class="cgo-rt-entry-btn">
                        <button class="cgo-rt-fbtn" data-route-act="from" title="设为起点">
                            <cgo-icon name="location" size="18"></cgo-icon><span>设为起点</span>
                        </button>
                        <button class="cgo-rt-fbtn emphasis" data-route-act="to" title="设为终点">
                            <cgo-icon name="route" size="18"></cgo-icon><span>设为终点</span>
                        </button>
                        ${scheduleUrl
                            ? `<a class="cgo-rt-fbtn icon-only" href="${scheduleUrl}" target="_blank" rel="noreferrer" title="官网查询">${officialIconHtml}</a>`
                            : ""}
                        <a class="cgo-rt-fbtn icon-only" href="${mapUrl}" target="_blank" rel="noreferrer" onclick="resetMapState()" title="高德导航">
                            <cgo-icon name="map" size="20"></cgo-icon>
                        </a>
                    </div>
                `;
            },
            onMounted(container, context) {
                adoptHelpers(context);
                const row = container.querySelector(".cgo-rt-entry-btn");
                if (!row) return;
                // 普通地铁站：本行即底栏的全部操作，隐藏核心默认的「官网查询 / 高德导航」行以免重复；
                // 市郊站保留原行（还有时刻表、票务等专属入口）。
                if (!context.isSuburbanStation) {
                    container.querySelectorAll(".panel-footer > div").forEach((node) => {
                        if (node !== row) node.style.display = "none";
                    });
                }
                row.querySelector('[data-route-act="from"]')?.addEventListener("click", () => {
                    closeInfoPanel();   // 设为起点后收起车站面板，让规划面板独占视野
                    openPlan({ from: context.station?.id });
                });
                row.querySelector('[data-route-act="to"]')?.addEventListener("click", () => {
                    closeInfoPanel();
                    openPlan({ to: context.station?.id });
                });
                // 宽度自适应：侧栏与浮层两套形态、以及侧栏宽度本身都会变，尺寸一变就重新判档
                fitEntryRow(row);
                if ("ResizeObserver" in window) new ResizeObserver(() => fitEntryRow(row)).observe(row);
            }
        });
    }

    /** 关闭车站信息面板：点它自己的关闭按钮，复用核心的收尾逻辑（不改核心代码） */
    function closeInfoPanel() {
        document.getElementById(INFO_PANEL_ID)?.querySelector(".panel-close-btn")?.click();
    }

    function init() {
        injectTopButton();
        registerFooterModule();
        observeInfoPanel();
        watchLegendForRoutePanels();
        watchSidebarVisibility();
        bindStationOpenSources();
        // 视口跨过 640px 断点会切换浮层 / 侧栏两套形态，核心的 resize 收口不一定重渲图例，故自行补一刀
        window.addEventListener("resize", scheduleRouteSync);
        scheduleRouteSync();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.CGoRoutePanel = { open: openPlan, close: closePanel, toggle };
})();
