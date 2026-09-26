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
    const MAX_SUGGEST = 30;

    /* ── 样式注入：按脚本自身 URL 找同名 css，调用方无需手工引用 ── */
    (function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const src = document.currentScript?.src;
        if (!src) return;
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = src.replace(/route-panel\.js/, "route-panel.css");
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

    function planPanelHtml() {
        return `
            <div class="panel-header">
                <cgo-icon name="route" size="18"></cgo-icon>
                <span class="cgo-rt-title">规划行程</span>
                <button class="panel-close-btn" data-close="plan" title="关闭"><cgo-icon name="close" size="18"></cgo-icon></button>
            </div>
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
                        <cgo-icon name="location" size="14"></cgo-icon>我的位置
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

    function ensurePlanPanel() {
        let panel = document.getElementById(PLAN_ID);
        if (panel) return panel;
        panel = document.createElement("div");
        panel.id = PLAN_ID;
        panel.className = "cgo-rt-panel";
        panel.innerHTML = planPanelHtml();
        document.body.appendChild(panel);

        panel.querySelector('[data-close="plan"]').addEventListener("click", () => closePanel("plan"));
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

        ["from", "to"].forEach((field) => {
            const wrap = panel.querySelector(`[data-field="${field}"]`);
            const input = wrap.querySelector("input");
            const suggest = wrap.querySelector(".cgo-rt-suggest");

            input.addEventListener("input", () => renderSuggest(field, suggest, input.value));
            input.addEventListener("focus", () => { if (input.value) renderSuggest(field, suggest, input.value); });
            input.addEventListener("blur", () => {
                // 延迟收起，避免点击候选时先触发 blur
                setTimeout(() => suggest.classList.remove("show"), 160);
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
                    panel.querySelector('[data-field="to"] input').focus();
                }
            });
        });
        makeDraggable(panel);
        installDrawer(panel);
        return panel;
    }

    function syncFields() {
        const panel = ensurePlanPanel();
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
    }

    function stopPicking() {
        if (!state.picking) return;
        state.picking = null;
        document.getElementById("map-content")?.classList.remove("cgo-picking");
        pickingHost()?.removeEventListener("click", onPickClick, true);
        syncPickButton();
        syncGoButton();
    }

    /* ======================================================================
     * 规划与结果
     * ==================================================================== */

    async function ensurePlanner() {
        if (state.planner) return state.planner;
        const config = window.CGO_ROUTE_CONFIG;
        if (!window.CGoRouteData || !window.CGoRoutePlanner || !config) return null;
        // 构建是异步的：内部先等坐标索引就绪再建图——大连、长春全网缺 distances，
        // 里程完全由坐标推算，索引未就绪时所有区间都会算不出里程而不可通行
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
        renderRoutes(routes);
        const planPanel = document.getElementById(PLAN_ID);
        const resultPanel = ensureResultPanel();
        // 结果面板接替规划面板的位置，避免拖动过后面板“跳回”初始角落
        if (planPanel?.style.left) {
            resultPanel.style.left = planPanel.style.left;
            resultPanel.style.top = planPanel.style.top;
            resultPanel.style.right = "auto";
        }
        // 结果面板上到栈顶，规划面板由栈自动隐去（不摘它的 show，否则关掉结果后就回不来了）
        resultPanel.classList.add("show");
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
            popPanel(RESULT_ID);
            panel.querySelector(".cgo-rt-steps")?.remove();
            const sum = panel.querySelector(".cgo-rt-sum");
            if (sum) sum.remove();
        }
        clearHighlight();
    }

    const lineOf = (id) => allLines().find((line) => line.id === String(id).split("#")[0]) || null;

    const lineName = (id) => {
        const base = String(id).split("#")[0];
        return lineOf(id)?.name || base;
    };

    /** 该乘车段的行驶方向终点站：往该方向列车的终到站，而非上/下车站 */
    function rideTerminus(step) {
        const line = allLines().find((item) => item.id === String(step.line).split("#")[0]);
        const ids = line?.stationIds || [];
        return ids.length ? (step.dir > 0 ? ids[ids.length - 1] : ids[0]) : "";
    }

    function ensureResultPanel() {
        let panel = document.getElementById(RESULT_ID);
        if (panel) return panel;
        panel = document.createElement("div");
        panel.id = RESULT_ID;
        panel.className = "cgo-rt-panel";
        panel.innerHTML = `
            <div class="panel-header cgo-rt-result-head">
                <span class="cgo-rt-od">
                    <b class="cgo-rt-od-from">起点</b>
                    <cgo-icon name="arrow-right" size="16"></cgo-icon>
                    <b class="cgo-rt-od-to">终点</b>
                </span>
                <button class="cgo-rt-again" title="重新选择"><cgo-icon name="edit" size="16"></cgo-icon></button>
                <button class="panel-close-btn" data-close="result" title="关闭"><cgo-icon name="close" size="18"></cgo-icon></button>
            </div>
            <div class="cgo-rt-routebar"></div>
            <div class="panel-body cgo-rt-result-body"></div>
        `;
        document.body.appendChild(panel);

        panel.querySelector('[data-close="result"]').addEventListener("click", () => closePanel("result"));
        panel.querySelector(".cgo-rt-again").addEventListener("click", () => {
            panel.classList.remove("show");
            popPanel(RESULT_ID);
            const planPanel = ensurePlanPanel();
            planPanel.classList.add("show");
            pushPanel(PLAN_ID);
            syncFields();
        });
        panel.querySelector(".cgo-rt-routebar").addEventListener("click", (event) => {
            const tab = event.target.closest("[data-route]");
            if (!tab) return;
            state.routeIndex = Number(tab.dataset.route) || 0;
            renderActiveRoute();
        });
        const body = panel.querySelector(".cgo-rt-result-body");
        body.addEventListener("click", (event) => {
            const jump = event.target.closest("[data-jump]");
            if (jump) { window.selectStation?.(jump.dataset.jump); return; }
            const expand = event.target.closest("[data-expand]");
            if (!expand) return;
            const list = body.querySelector(`[data-list="${expand.dataset.expand}"]`);
            if (!list) return;
            const open = list.hasAttribute("hidden");
            list.toggleAttribute("hidden", !open);
            expand.classList.toggle("open", open);
        });
        makeDraggable(panel);
        installDrawer(panel);
        return panel;
    }

    /** 线路徽标占位符：沿用核心与检索面板同一套机制（注入 SVG 后由城市模块定制为紧凑圆标） */
    function lineBadgeHtml(lineId) {
        const line = lineOf(lineId);
        if (!line?.svg) return "";
        const meta = window.getLineSvgMeta?.(line.svg || line.id);
        const style = meta ? `--svgclr:${meta.svgclr};--svgtext:${meta.svgtext};` : "";
        return `<span class="svg-icon-placeholder line-badge" data-src="${window.getSvgPath?.(line.svg) || ""}" style="${style}"></span>`;
    }

    /** 交通方式图标：有轨与地铁区分 */
    const modeIcon = (lineId) => (lineOf(lineId)?.mode === "tram"
        || String(lineId).toUpperCase().startsWith("HNT")) ? "tram" : "train";

    /**
     * 步骤区：乘车段为「出发/上车行 + 开往行 + 站数时间行」，换乘段为三行，末尾补一行到达。
     * 乘车段左侧用线路色粗竖线、换乘段用灰色竖线串联，形成一条连续的行程脊线。
     */
    function renderLegs(route, tailId) {
        const legs = [];
        let boarded = 0;
        route.steps.forEach((step, index) => {
            if (step.t === "ride") {
                const line = lineOf(step.line);
                const start = step.stops[0];
                const terminus = rideTerminus(step);
                // 途经站只列中途停站：上车站与下车站已由上下行文案表达
                const middle = step.stops.slice(1, -1);
                const action = boarded === 0 ? "出发" : "上车";
                boarded++;
                legs.push(`
                    <li class="cgo-rt-leg ride" style="--line-color:${line?.color || "var(--primary-color, #006098)"}">
                        <div class="cgo-rt-leg-head">
                            <span class="cgo-rt-mode"><cgo-icon name="${modeIcon(step.line)}" size="16"></cgo-icon></span>
                            <span class="cgo-rt-leg-name">
                                <b data-jump="${start}">${stationName(start)}</b><em>${action}</em>
                            </span>
                        </div>
                        <div class="cgo-rt-leg-line">
                            ${lineBadgeHtml(step.line)}
                            <span>开往 <b data-jump="${terminus}">${stationName(terminus)}</b></span>
                        </div>
                        <div class="cgo-rt-leg-line">
                            <span>${step.stops.length - 1} 站 · ${Math.round(step.minutes)} 分钟</span>
                            ${middle.length ? `
                                <button class="cgo-rt-expand" data-expand="${index}" title="查看途经车站">
                                    <cgo-icon name="chevron-down" size="14"></cgo-icon>
                                </button>` : ""}
                        </div>
                        ${middle.length ? `
                            <div class="cgo-rt-stoplist" data-list="${index}" hidden>
                                ${middle.map((sid) => `<span data-jump="${sid}">${stationName(sid)}</span>`).join("")}
                            </div>` : ""}
                    </li>
                `);
                return;
            }
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
     */
    function renderRoutes(routes) {
        const panel = ensureResultPanel();
        const bar = panel.querySelector(".cgo-rt-routebar");
        if (routes.length > 1) {
            bar.innerHTML = routes.map((route, index) => `
                <button class="cgo-rt-tab${index === 0 ? " active" : ""}" data-route="${index}">
                    ${route.labels[0]}
                </button>
            `).join("");
            bar.classList.add("show");
        } else {
            bar.innerHTML = "";
            bar.classList.remove("show");
        }
        state.routeIndex = 0;
        renderActiveRoute();
    }

    function renderActiveRoute() {
        const route = (state.routes || [])[state.routeIndex];
        if (!route) return;
        const panel = ensureResultPanel();
        panel.querySelectorAll(".cgo-rt-tab").forEach((tab) => {
            tab.classList.toggle("active", Number(tab.dataset.route) === state.routeIndex);
        });

        // 标题栏显示起讫站：取实际乘车的首末站（起讫点本身可能只是出站换乘的落点）；
        // 末段是出站步行时，步行落点才是真正的终点（如末段从地铁站步行到国铁站）
        const rides = route.steps.filter((step) => step.t === "ride");
        const lastStep = route.steps[route.steps.length - 1];
        const head = rides[0]?.stops[0] || state.from;
        const tail = lastStep?.t === "walk" ? lastStep.b
            : (rides.length ? rides[rides.length - 1].stops.slice(-1)[0] : state.to);
        panel.querySelector(".cgo-rt-od-from").textContent = stationName(head);
        panel.querySelector(".cgo-rt-od-to").textContent = stationName(tail);

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
        injectSvgs(body);   // 注入线路徽标，城市模块随后会将其定制为紧凑圆标
        applyHighlight(route);
    }

    /* ======================================================================
     * 图上高亮
     * ==================================================================== */

    const SVG_NS = "http://www.w3.org/2000/svg";
    const ROUTE_LAYER_ID = "cgo-route-layer";

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
     * 截取线路折线在「上车站 → 下车站」之间的那一段（保留原走向与拐点）。
     * 站点坐标未必落在折线上（走向由 pathPoints 定义），故两端取投影点。
     */
    function slicePath(points, from, to) {
        if (!points || points.length < 2) return null;
        const a = projectOnPath(points, from);
        const b = projectOnPath(points, to);
        if (!a || !b) return null;
        if (!(a.seg < b.seg || (a.seg === b.seg && a.t <= b.t))) {
            // 折线走向与乘车方向相反：在反向序列上切即可，
            // 此时起讫站在序列中的先后关系已与乘车方向一致，切出来天然就是 from → to，不能再倒回来
            return slicePath(points.slice().reverse(), from, to);
        }
        const out = [a.point, ...points.slice(a.seg + 1, b.seg + 1), b.point];
        return out.length >= 2 ? out : null;
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
                    const sliced = slicePath(segment.points, head, tail);
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
        const layer = document.getElementById(ROUTE_LAYER_ID);
        if (layer) layer.innerHTML = "";
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
    }

    /* ======================================================================
     * 拖动
     * ==================================================================== */

    /**
     * 标题栏拖动：与车站详情面板同一套行为（桌面端可拖、按钮/链接上不起拖、限制在视口内）。
     * 核心的 initPanelDrag() 写死在 #info-panel 上无法复用，故在此按同样规则实现一份；
     * 拖动时由 right 定位切到 left 定位，避免两边同时生效。
     */
    function makeDraggable(panel) {
        const header = panel.querySelector(".panel-header");
        if (!header) return;
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
        });

        document.addEventListener("mouseup", () => {
            if (!dragging) return;
            dragging = false;
            document.body.style.cursor = "";
        });
    }

    /* ======================================================================
     * 移动端抽屉
     * ==================================================================== */

    /**
     * 移动端抽屉：拖动把手或标题栏跟手调整高度，松手吸附到「半屏 / 全屏」两档。
     * 核心的 initMobileSheetDrag() 是写死在 #info-panel 上的三档甩动系统，无法复用，
     * 故按其档位语义（half / full）做一个精简版；桌面端把手隐藏、整段逻辑不生效。
     */
    function installDrawer(panel) {
        if (panel.querySelector(".cgo-rt-grabber")) return;
        const grabber = document.createElement("div");
        grabber.className = "cgo-rt-grabber";
        grabber.title = "拖动调整高度";
        panel.insertBefore(grabber, panel.firstChild);

        const viewportHeight = () => window.visualViewport?.height || window.innerHeight;
        let dragging = false, startY = 0, startHeight = 0;

        const onDown = (event) => {
            if (window.innerWidth > 640) return;
            // 标题栏上还有「重新选择 / 关闭」等按钮，点它们照常走点击，不起拖
            if (event.target.closest("button") || event.target.closest("a")) return;
            dragging = true;
            startY = event.clientY;
            startHeight = panel.getBoundingClientRect().height;
            panel.classList.add("cgo-rt-dragging");   // 拖动期间禁掉标题栏站名的文本选中
            event.currentTarget.setPointerCapture?.(event.pointerId);
        };

        const onMove = (event) => {
            if (!dragging) return;
            const vh = viewportHeight();
            const next = Math.min(Math.max(startHeight - (event.clientY - startY), vh * 0.3), vh - 60);
            // 改 height 而非 max-height：内容不足时 max-height 既撑不高、也切不到档
            panel.style.height = `${Math.round(next)}px`;
        };

        const settle = () => {
            if (!dragging) return;
            dragging = false;
            panel.classList.remove("cgo-rt-dragging");
            const current = panel.getBoundingClientRect().height;
            const vh = viewportHeight();
            const half = vh * 0.40, full = vh - 60;
            panel.style.height = "";             // 交回 CSS 档位控制
            panel.classList.toggle("drawer-full", Math.abs(current - full) < Math.abs(current - half));
        };

        // 把手与标题栏共用同一套档位拖动；标题栏的按钮已由 onDown 排除
        [grabber, panel.querySelector(".panel-header")].forEach((handle) => {
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
     */
    function syncPanels() {
        const top = openStack[openStack.length - 1] || null;
        [PLAN_ID, RESULT_ID, INFO_PANEL_ID].forEach((id) => {
            const panel = document.getElementById(id);
            if (!panel) return;
            panel.classList.toggle(STACK_HIDDEN, id !== top && openStack.includes(id));
        });
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
            if (open) pushPanel(INFO_PANEL_ID); else popPanel(INFO_PANEL_ID);
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
        const panel = ensurePlanPanel();
        stopPicking();
        hideSuggests();
        applyDefaultPosition(panel);
        // 从车站面板进来是「从这一站出发」，故预设起点并清掉上一次的终点
        if (preset.from) {
            state.from = preset.from;
            state.to = null;
        }
        if (preset.to) state.to = preset.to;
        syncFields();
        refreshResult();   // 重新规划：旧结果连同其面板一起退出（内部会出栈）
        panel.classList.add("show");
        pushPanel(PLAN_ID);
        const focusField = state.from && !state.to ? "to" : "from";
        panel.querySelector(`[data-field="${focusField}"] input`).focus();
        emit("cgo:route-opened", { from: state.from, to: state.to });
    }

    function closePanel(which) {
        if (which !== "result") {
            stopPicking();
            hideSuggests();
            const planPanel = document.getElementById(PLAN_ID);
            if (planPanel) planPanel.classList.remove("show");
            popPanel(PLAN_ID);
        } else {
            document.getElementById(RESULT_ID)?.classList.remove("show");
            popPanel(RESULT_ID);
        }
        // 两个面板都收起时才撤销图上高亮
        const anyOpen = [PLAN_ID, RESULT_ID].some((id) => document.getElementById(id)?.classList.contains("show"));
        if (!anyOpen) clearHighlight();
        emit("cgo:route-closed", {});
    }

    function toggle() {
        const panel = ensurePlanPanel();
        const result = document.getElementById(RESULT_ID);
        if (panel.classList.contains("show") || result?.classList.contains("show")) {
            const openId = panel.classList.contains("show") ? PLAN_ID : RESULT_ID;
            closePanel(openId === PLAN_ID ? "plan" : "result");
        } else {
            openPlan();
        }
    }

    /** 浏览器定位：取最近车站作为起点（失败时给出提示，不做静默降级） */
    function useMyLocation() {
        if (!navigator.geolocation) { setStatus("当前环境不支持定位"); return; }
        setStatus("正在定位…");
        navigator.geolocation.getCurrentPosition((pos) => {
            const config = window.CGO_ROUTE_CONFIG;
            if (!config?.coordOf) { setStatus("该城市暂无坐标数据"); return; }
            const { latitude, longitude } = pos.coords;
            let best = null;
            Object.entries(allStations()).forEach(([sid, station]) => {
                if (station.type === "no") return;
                const raw = config.coordOf(station.cn);
                if (!raw) return;
                const [lng, lat] = raw.split(",").map(Number);
                const d = Math.hypot(lat - latitude, lng - longitude);
                if (!best || d < best.d) best = { sid, d };
            });
            if (!best) { setStatus("附近没有可用车站"); return; }
            state.from = best.sid;
            syncFields();
            refreshResult();
            setStatus("已设为起点（最近车站）");
        }, () => setStatus("定位失败，请手动选择"));
    }

    /* ======================================================================
     * 入口：顶栏 + 车站信息板底栏
     * ==================================================================== */

    function injectTopButton() {
        if (document.getElementById(ENTRY_ID)) return;
        const anchor = document.getElementById("mz-menu");
        if (!anchor) return;
        const button = document.createElement("button");
        button.id = ENTRY_ID;
        button.title = "行程规划";
        button.innerHTML = `<cgo-icon name="route" style="width:20px;height:20px;"></cgo-icon>`;
        button.addEventListener("click", toggle);
        anchor.insertAdjacentElement("afterend", button);
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
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.CGoRoutePanel = { open: openPlan, close: closePanel, toggle };
})();
