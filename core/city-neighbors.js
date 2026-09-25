/**
 * CGo OpenMap - 邻城衔接引擎 (core/city-neighbors.js)
 *
 * ==============================================================================
 * 作用
 * ==============================================================================
 * 两座城市在系统里仍是各自独立的线路图，但地理上相邻时（如深圳与香港），可以在
 * 城市注册表里互相声明 `neighbors`，本模块据此：
 *
 * 1. 影子：把邻城的线网（取自它自己的 data_stations.js / data_lines.js）按比例画在
 *    本城画布之外，只在本城画布以外的区域显示，平时是淡淡的一层「影子」；
 * 2. 上拉进入：拖到画布边缘时允许继续露出一段影子，再往外拉会出现进度提示，
 *    拉满后以过渡动画切换到邻城，并把视口对齐到刚才看到的同一片区域；
 * 3. 双城并看：缩得足够小时，边界放宽到「本城 ∪ 邻城」，两座城市同时可见，
 *    点击影子即可进入邻城；
 * 4. 衔接比例：scale 取两座城市示意图线宽之比，保证影子与本城线路粗细一致。
 *
 * 配置示例（city/data.js）：
 *   neighbors: [{
 *       id: "shenzhen", edge: "top",          // 邻城位于本城的哪一侧：top / bottom / left / right
 *       scale: 1.5, offset: { x: -1050, y: -2047 },  // 本城坐标 = offset + scale × 邻城坐标
 *       title: ["深圳", "Shenzhen"]
 *   }]
 * 邻城自身的注册项可提供 lineWidth（示意图线宽）与 shadowDeco（影子底图）。
 *
 * 本模块不含任何城市私有逻辑；未声明 neighbors 的城市完全不受影响。
 * ==============================================================================
 */

(function () {
    "use strict";

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(location.search);

    function registry() { return window.CITY_REGISTRY || {}; }
    function activeCity() { return typeof window.getActiveCity === "function" ? window.getActiveCity() : null; }

    const city = activeCity();
    const reg = registry()[city && city.id] || {};
    const NEIGHBORS = (city && city.neighbors) || reg.neighbors || [];

    // 到达动画的遮罩兜底：即使本城没有邻城配置，也不能让地图一直隐藏
    function releaseArrivalMask() {
        const root = document.documentElement;
        if (!root.classList.contains("nb-arrive")) return;
        root.classList.add("nb-fadein");
        root.classList.remove("nb-arrive");
        setTimeout(() => root.classList.remove("nb-fadein"), 1300);
    }
    setTimeout(releaseArrivalMask, 4000);
    if (!NEIGHBORS.length) { releaseArrivalMask(); return; }

    const container = document.getElementById("map-container");
    const content = document.getElementById("map-content");
    if (!container || !content) { releaseArrivalMask(); return; }

    injectStyle();

    const W = (city.mapSize && city.mapSize.width) || 1850;
    const H = (city.mapSize && city.mapSize.height) || 1300;

    const nbs = NEIGHBORS.map((cfg) => {
        const meta = registry()[cfg.id] || {};
        const k = cfg.scale || 1;
        const size = meta.mapSize || { width: 1000, height: 1000 };
        return {
            cfg, meta, k,
            ox: (cfg.offset && cfg.offset.x) || 0,
            oy: (cfg.offset && cfg.offset.y) || 0,
            box: {
                x: (cfg.offset && cfg.offset.x) || 0, y: (cfg.offset && cfg.offset.y) || 0,
                w: size.width * k, h: size.height * k
            },
            name: cfg.title || [meta.name || cfg.id, ""],
            el: null, data: null
        };
    });

    // ── 坐标换算 ────────────────────────────────────────────────────────────
    const S = () => window.currentScale || 1;
    function toNeighbor(nb, p) { return { x: (p.x - nb.ox) / nb.k, y: (p.y - nb.oy) / nb.k }; }
    function screenToMap(sx, sy) { return { x: (sx - window.currentX) / S(), y: (sy - window.currentY) / S() }; }

    // 容器尺寸：读取 clientWidth / clientHeight 会强制布局，拖动时每帧读会拖慢，改为缓存
    let CW = container.clientWidth, CH = container.clientHeight;
    if (window.ResizeObserver) new ResizeObserver(() => { CW = container.clientWidth; CH = container.clientHeight; topCache = null; }).observe(container);
    else window.addEventListener("resize", () => { CW = container.clientWidth; CH = container.clientHeight; });

    // 浮动标题栏的避让高度：读取需要强制布局，拖动时每帧调用会拖慢，按窗口尺寸缓存
    let topCache = null;
    window.addEventListener("resize", () => { topCache = null; });
    function topOffset() {
        if (topCache === null) topCache = measureTopOffset();
        return topCache;
    }
    function measureTopOffset() {
        const floating = document.documentElement.getAttribute("header-mode") === "floating" ||
            document.body.getAttribute("header-mode") === "floating" ||
            Boolean(document.querySelector('.tool-header[header-mode="floating"]'));
        if (!floating) return 0;
        const island = document.querySelector(".tool-header .header-island");
        return island ? Math.max(76, Math.ceil(island.getBoundingClientRect().bottom + 12)) : 76;
    }

    // ── 影子绘制 ────────────────────────────────────────────────────────────
    async function loadNeighbor(nb) {
        const folder = nb.meta.folder;
        if (!folder) return null;
        const v = window.CGO_ASSET_VERSION ? `?v=${window.CGO_ASSET_VERSION}` : "";
        const [st, ln] = await Promise.all(["data_stations.js", "data_lines.js"].map((f) =>
            fetch(`${folder}/${f}${v}`).then((r) => (r.ok ? r.text() : ""))));
        if (!st || !ln) return null;
        // 数据文件以 const 声明全局变量；放进独立函数作用域求值，避免与本城同名变量冲突
        // eslint-disable-next-line no-new-func
        return new Function(`${st}\n${ln}\nreturn { stationsData, linesData };`)();
    }

    /** 邻城盒子与「本城画布之外、邻城所在一侧」半平面的交集：影子真正可能被看到的区域（本城坐标） */
    function visibleRect(nb) {
        const b = nb.box, e = nb.cfg.edge;
        let x0 = b.x, y0 = b.y, x1 = b.x + b.w, y1 = b.y + b.h;
        if (e === "top") y1 = Math.min(y1, 0);
        else if (e === "bottom") y0 = Math.max(y0, H);
        else if (e === "left") x1 = Math.min(x1, 0);
        else x0 = Math.max(x0, W);
        return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
    }

    const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 16));
    const nextIdle = () => new Promise((r) => idle(r));
    const CJK_FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
    const LAT_FONT = '"Helvetica Neue", Arial, sans-serif';

    /**
     * 影子画成一张位图（canvas）：之后平移缩放只是变换这张位图，不再每帧栅格化几百条矢量与文字；
     * 分几次在浏览器空闲时绘制，不阻塞首屏。分辨率按区域大小封顶，影子本就是半透明的示意。
     */
    async function buildShadow(nb) {
        const V = visibleRect(nb);
        if (V.w < 1 || V.h < 1) return null;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const r = Math.min(dpr, 3200 / Math.max(V.w, V.h));
        const cv = document.createElement("canvas");
        cv.className = "nb-shadow";
        cv.dataset.city = nb.cfg.id;
        cv.width = Math.round(V.w * r);
        cv.height = Math.round(V.h * r);
        cv.style.cssText = `left:${V.x}px;top:${V.y}px;width:${V.w}px;height:${V.h}px;`;
        const ctx = cv.getContext("2d");
        const css = getComputedStyle(document.documentElement);
        const dark = document.documentElement.getAttribute("data-theme") === "dark";
        const ink = (css.getPropertyValue("--text-main") || "").trim() || (dark ? "#e5e8ea" : "#222");
        const bg = (getComputedStyle(content).backgroundColor) || (dark ? "#15181b" : "#fff");
        const toNb = () => ctx.setTransform(r * nb.k, 0, 0, r * nb.k, (nb.ox - V.x) * r, (nb.oy - V.y) * r);
        const toOwn = () => ctx.setTransform(r, 0, 0, r, -V.x * r, -V.y * r);

        // 1) 邻城底图（海陆轮廓）；深色模式下底图是浅色的，叠上去只会形成一块灰框，直接不画
        if (nb.meta.shadowDeco && !dark) {
            try {
                const img = new Image();
                img.src = nb.meta.shadowDeco;
                await img.decode();
                await nextIdle();
                toNb();
                ctx.drawImage(img, 0, 0, nb.box.w / nb.k, nb.box.h / nb.k);
            } catch (_) { /* 底图缺失时只画线网 */ }
        }
        // 2) 线路
        await nextIdle();
        toNb();
        const lw = nb.meta.lineWidth || 5.4;
        const geo = window.CGoPathGeometry;
        const { stationsData = {}, linesData = [] } = nb.data || {};
        ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = lw;
        linesData.forEach((line) => {
            if (!geo || line.isPointOnly) return;
            geo.lineSegments(line, stationsData).forEach((seg) => {
                const d = geo.generateRoundedPath(seg.points, line.useStrictRounding || false);
                if (!d) return;
                ctx.strokeStyle = line.color || "#999";
                ctx.stroke(new Path2D(d));
            });
        });
        // 3) 车站与站名
        await nextIdle();
        toNb();
        ctx.fillStyle = bg; ctx.strokeStyle = "#8a8f94"; ctx.lineWidth = lw * 0.32;
        const dots = new Path2D();
        Object.values(stationsData).forEach((s) => {
            if (typeof s.x !== "number") return;
            dots.moveTo(s.x + lw * 0.62, s.y);
            dots.arc(s.x, s.y, lw * 0.62, 0, Math.PI * 2);
        });
        ctx.fill(dots); ctx.stroke(dots);
        ctx.fillStyle = ink;
        ctx.textBaseline = "alphabetic";
        Object.values(stationsData).forEach((s) => {
            const b = s.lab && s.lab.cn;
            if (!b || !s.cn) return;
            const h = b[3] - b[1];
            ctx.font = `${(h * 1.12).toFixed(1)}px ${CJK_FONT}`;
            ctx.fillText(s.cn, b[0], b[3] - h * 0.08, b[2] - b[0]);
        });
        // 4) 接缝处的城市名
        toOwn();
        const tp = seamTitlePoint(nb);
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.55;
        ctx.font = `600 64px ${CJK_FONT}`;
        ctx.fillText(nb.name[0], tp.x, tp.y);
        if (nb.name[1]) {
            ctx.font = `500 26px ${LAT_FONT}`;
            ctx.fillText(nb.name[1], tp.x, tp.y + 34);
        }
        ctx.globalAlpha = 1;
        return cv;
    }

    async function mountShadow(nb) {
        const token = (nb.token = (nb.token || 0) + 1);
        const cv = await buildShadow(nb);
        if (!cv || token !== nb.token) return;
        cv.style.display = nb.el ? nb.el.style.display : "none";
        cv.style.opacity = nb.el ? nb.el.style.opacity : "0";
        if (nb.el) nb.el.replaceWith(cv); else content.insertBefore(cv, content.firstChild);
        nb.el = cv;
        nb.shown = nb.op = undefined;
        updateShadows();
    }

    function seamTitlePoint(nb) {
        const e = nb.cfg.edge;
        const midX = Math.max(0, nb.box.x) / 2 + Math.min(W, nb.box.x + nb.box.w) / 2;
        const midY = Math.max(0, nb.box.y) / 2 + Math.min(H, nb.box.y + nb.box.h) / 2;
        if (e === "top") return { x: midX, y: -70 };
        if (e === "bottom") return { x: midX, y: H + 110 };
        if (e === "left") return { x: -220, y: midY };
        return { x: W + 220, y: midY };
    }

    // ── 边界：画布边缘可多露出一段影子，再往外拉累计「进入」进度 ──────────────
    let pointerDown = false;
    let pressure = 0;            // 屏幕像素
    let wheelTimer = 0;
    let lastScale = null;
    let leaving = false;
    let active = null;           // 当前被拉出的邻城
    let lastNudge = -1e9;        // 最近一次滚轮 / 方向键输入的时刻
    const THRESHOLD = 120;

    function unionBox() {
        let x0 = 0, y0 = 0, x1 = W, y1 = H;
        nbs.forEach((nb) => {
            x0 = Math.min(x0, nb.box.x); y0 = Math.min(y0, nb.box.y);
            x1 = Math.max(x1, nb.box.x + nb.box.w); y1 = Math.max(y1, nb.box.y + nb.box.h);
        });
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    /** 缩放低于该值时两城并看：边界放宽到本城 ∪ 邻城 */
    function unionScale() {
        const u = unionBox();
        const fit = Math.min(CW / u.w, (CH - topOffset()) / u.h);
        return fit * 1.35;
    }
    function clampTo(b) {
        const s = S(), cw = CW, ch = CH, top = topOffset();
        const w = b.w * s, h = b.h * s;
        if (w >= cw) window.currentX = Math.min(-b.x * s, Math.max(cw - (b.x + b.w) * s, window.currentX));
        else window.currentX = (cw - w) / 2 - b.x * s;
        if (h >= ch - top) window.currentY = Math.min(top - b.y * s, Math.max(ch - (b.y + b.h) * s, window.currentY));
        else window.currentY = top + (ch - top - h) / 2 - b.y * s;
    }

    let frozen = null;           // 离开过程中锁定的视口，避免继续滚动打断过渡
    function enforce() {
        if (typeof window.localEnforceBoundaries !== "function") return;
        if (leaving && frozen) {
            window.currentX = frozen.x; window.currentY = frozen.y; window.currentScale = frozen.s;
            return;
        }
        const s = S();
        const scaleChanged = lastScale !== null && Math.abs(s - lastScale) > 1e-6;
        lastScale = s;
        if (s <= unionScale()) {
            clampTo(unionBox());
            setPressure(0, null);
            return;
        }
        const dx = window.currentX, dy = window.currentY;
        window.localEnforceBoundaries();
        const cx0 = window.currentX, cy0 = window.currentY;
        let best = null;
        nbs.forEach((nb) => {
            const e = nb.cfg.edge;
            const over = e === "top" ? dy - cy0 : e === "bottom" ? cy0 - dy : e === "left" ? dx - cx0 : cx0 - dx;
            if (over > 0 && (!best || over > best.over)) best = { nb, over };
        });
        if (!best) { setPressure(0, null); return; }
        const { nb, over } = best;
        const e = nb.cfg.edge;
        const span = (e === "top" || e === "bottom") ? CH : CW;
        const peek = Math.min(span * 0.42, (e === "top" || e === "bottom" ? nb.box.h : nb.box.w) * s);
        const allow = Math.min(over, peek);
        if (e === "top") window.currentY = cy0 + allow;
        else if (e === "bottom") window.currentY = cy0 - allow;
        else if (e === "left") window.currentX = cx0 + allow;
        else window.currentX = cx0 - allow;
        const excess = Math.max(0, over - peek);
        // 只有真实的拖拽 / 滚轮 / 方向键才累计「进入」进度；选站居中等程序化移动只露出影子
        const userNudge = performance.now() - lastNudge < 80;
        if (pointerDown) setPressure(excess, nb);
        else if (!scaleChanged && userNudge) {
            setPressure(excess > 0 ? pressure + excess : pressure, nb);
            clearTimeout(wheelTimer);
            wheelTimer = setTimeout(() => setPressure(0, nb), 280);
        }
        if (pressure >= THRESHOLD && !pointerDown && userNudge) go(nb);
    }

    function setPressure(p, nb) {
        pressure = Math.max(0, p);
        active = pressure > 0 || nb ? nb : null;
        updateHint();
    }

    // ── 提示胶囊 ────────────────────────────────────────────────────────────
    const hint = document.createElement("button");
    hint.type = "button";
    hint.id = "nb-hint";
    hint.innerHTML = `<svg class="nb-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" class="nb-ring-bg"/><circle cx="18" cy="18" r="15" class="nb-ring-fg"/></svg><cgo-icon size="16"></cgo-icon><span class="nb-hint-text"></span>`;
    container.appendChild(hint);
    hint.addEventListener("pointerdown", (e) => e.stopPropagation());
    hint.addEventListener("mousedown", (e) => e.stopPropagation());
    hint.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    hint.addEventListener("click", (e) => { e.stopPropagation(); if (hint.dataset.city) go(nbs.find((n) => n.cfg.id === hint.dataset.city)); });

    const EDGE_ICON = { top: "arrow-up", bottom: "arrow-down", left: "arrow-left", right: "arrow-right" };
    const EDGE_VERB = { top: "上滑", bottom: "下滑", left: "左滑", right: "右滑" };
    function peekShown(nb) {
        const s = S(), e = nb.cfg.edge;
        if (e === "top") return window.currentY - topOffset() > 24;
        if (e === "bottom") return window.currentY + H * s < CH - 24;
        if (e === "left") return window.currentX > 24;
        return window.currentX + W * s < CW - 24;
    }
    // 只在内容真的变化时才写 DOM：拖动时每帧都会调用，重复写入会触发图标组件重绘与重新排版
    const hintState = {};
    function put(key, val, apply) {
        if (hintState[key] === val) return;
        hintState[key] = val;
        apply(val);
    }
    function updateHint() {
        const union = S() <= unionScale();
        const nb = active || nbs.find(peekShown);
        const show = nb && (leaving || (!union && (pressure > 0 || peekShown(nb))));
        put("on", Boolean(show), (v) => hint.classList.toggle("on", v));
        if (!nb) return;
        put("city", nb.cfg.id, (v) => { hint.dataset.city = v; });
        put("edge", nb.cfg.edge, (v) => {
            hint.dataset.edge = v;
            hint.querySelector("cgo-icon").setAttribute("name", EDGE_ICON[v] || "arrow-up");
        });
        const ready = leaving || pressure >= THRESHOLD * 0.999;
        const text = leaving
            ? `正在进入${nb.name[0]}线路图…`
            : ready ? `松手进入${nb.name[0]}线路图`
            : (pressure > 0 ? `继续${EDGE_VERB[nb.cfg.edge]}，进入${nb.name[0]}线路图` : `${nb.name[0]} · 继续${EDGE_VERB[nb.cfg.edge]}进入`);
        put("text", text, (v) => { hint.querySelector(".nb-hint-text").textContent = v; });
        const c = 2 * Math.PI * 15;
        const off = leaving ? 0 : Math.round(c * (1 - Math.min(1, pressure / THRESHOLD)) * 10) / 10;
        put("ring", off, (v) => {
            const fg = hint.querySelector(".nb-ring-fg");
            fg.style.strokeDasharray = `${c}`;
            fg.style.strokeDashoffset = `${v}`;
        });
        put("ready", ready, (v) => hint.classList.toggle("ready", v));
    }

    // ── 影子透明度随缩放变化 ────────────────────────────────────────────────
    function updateShadows() {
        const s = S(), u = unionScale();
        // 平时是淡影；缩到接近两城并看时逐渐变实
        const t = Math.max(0, Math.min(1, (u * 1.5 - s) / (u * 0.5)));
        const base = 0.34 + 0.5 * t;
        const boost = active ? Math.min(0.3, pressure / THRESHOLD * 0.3) : 0;
        nbs.forEach((nb) => {
            if (!nb.el) return;
            // 影子完全不在视口内时不参与绘制
            const visible = s <= u || peekShown(nb) || pressure > 0;
            const op = String(Math.round(Math.min(0.92, base + boost) * 50) / 50);
            if (nb.shown !== visible) { nb.shown = visible; nb.el.style.display = visible ? "" : "none"; }
            if (nb.op !== op) { nb.op = op; nb.el.style.opacity = op; }
        });
        const um = s <= u;
        if (container.classList.contains("nb-union-mode") !== um) container.classList.toggle("nb-union-mode", um);
    }

    // ── 切换到邻城（带过渡）────────────────────────────────────────────────
    function go(nb, opts = {}) {
        if (!nb || leaving) return;
        leaving = true;
        updateHint();
        const cw = CW, ch = CH;
        let target;
        if (opts.at) {
            target = { x: opts.at.x, y: opts.at.y, s: opts.at.s || S() * nb.k };
        } else {
            // 让视口继续朝邻城方向滑一段，再以此刻屏幕中心对应的邻城坐标与等效缩放进入
            const e = nb.cfg.edge, push = reduceMotion ? 0 : 0.28;
            const shift = { x: e === "left" ? cw * push : e === "right" ? -cw * push : 0, y: e === "top" ? ch * push : e === "bottom" ? -ch * push : 0 };
            const center = opts.point ? { x: opts.point.x, y: opts.point.y } : screenToMap(cw / 2 - shift.x, ch / 2 - shift.y);
            const n = toNeighbor(nb, center);
            target = { x: n.x, y: n.y, s: S() * nb.k };
            if (!reduceMotion && !opts.point) {
                content.classList.add("nb-glide");
                window.currentX += shift.x;
                window.currentY += shift.y;
                window.updateMapTransform && window.updateMapTransform();
            }
        }
        frozen = { x: window.currentX, y: window.currentY, s: S() };
        document.documentElement.classList.add("nb-leaving");
        const q = new URLSearchParams();
        q.set("city", nb.cfg.id);
        q.set("nbfrom", city.id);
        q.set("at", `${target.x.toFixed(1)},${target.y.toFixed(1)},${target.s.toFixed(4)}`);
        if (opts.sel) q.set("sel", opts.sel);
        const url = `${location.pathname}?${q.toString()}`;
        setTimeout(() => { location.href = url; }, reduceMotion ? 0 : 430);
    }

    // ── 输入跟踪：区分拖拽（按绝对位移计进度）与滚轮/键盘（逐次累计）──────────
    function down() { pointerDown = true; }
    function up() {
        if (!pointerDown) return;
        pointerDown = false;
        if (active && pressure >= THRESHOLD) go(active);
        else if (pressure > 0) setPressure(0, active);
        updateShadows();
    }
    container.addEventListener("wheel", (e) => { if (!e.ctrlKey) lastNudge = performance.now(); }, { capture: true, passive: true });
    document.addEventListener("keydown", (e) => {
        if (/^(Arrow(Up|Down|Left|Right)|[wasdWASD])$/.test(e.key) && !/INPUT|TEXTAREA/.test(e.target.tagName)) lastNudge = performance.now();
    }, true);
    container.addEventListener("mousedown", (e) => { if (e.button === 0) down(); }, true);
    container.addEventListener("touchstart", (e) => { if (e.touches.length === 1) down(); else { pointerDown = false; setPressure(0, null); } }, { capture: true, passive: true });
    window.addEventListener("mouseup", up, true);
    window.addEventListener("touchend", (e) => { if (!e.touches.length) up(); }, true);
    window.addEventListener("touchcancel", up, true);

    // 两城并看时点击影子直接进入邻城（落点即点击处）
    container.addEventListener("click", (e) => {
        if (window.isMapDragging || leaving) return;
        if (e.target.closest && e.target.closest(".station, .label-group, #nb-hint, #info-panel")) return;
        const r = container.getBoundingClientRect();
        const p = screenToMap(e.clientX - r.left, e.clientY - r.top);
        const beyond = (n) => ({ top: p.y < 0, bottom: p.y > H, left: p.x < 0, right: p.x > W }[n.cfg.edge]);
        const nb = nbs.find((n) => beyond(n) && p.x >= n.box.x && p.x <= n.box.x + n.box.w && p.y >= n.box.y && p.y <= n.box.y + n.box.h);
        if (!nb || !nb.el) return;
        if (S() > unionScale() && !peekShown(nb)) return;
        go(nb, { point: p });
    });

    // 引擎每次平移缩放后会改写 #map-content 的 transform，借此刷新影子与提示
    // （不用 requestAnimationFrame：页面在后台时它会暂停，提示与影子就停在旧状态）
    let queued = false;
    new MutationObserver(() => {
        if (queued) return;
        queued = true;
        queueMicrotask(() => { queued = false; updateShadows(); updateHint(); });
    }).observe(content, { attributes: true, attributeFilter: ["style"] });

    // ── 到达：还原上一座城市最后的画面，再滑回本城 ─────────────────────────
    function arrive() {
        const from = params.get("nbfrom");
        const at = (params.get("at") || "").split(",").map(Number);
        const sel = params.get("sel");
        // 地址栏只保留 ?city=，刷新或分享时不会重复播放过渡
        const clean = new URLSearchParams(location.search);
        ["nbfrom", "at", "sel"].forEach((k) => clean.delete(k));
        history.replaceState(null, "", `${location.pathname}${clean.toString() ? "?" + clean : ""}${location.hash}`);
        if (!from || at.length < 3 || at.some((v) => !isFinite(v))) { releaseArrivalMask(); return; }
        const cw = CW, ch = CH;
        const lim = typeof window.getScaleLimits === "function" ? window.getScaleLimits() : { min: 0.5, max: 3 };
        const s = Math.min(lim.max, Math.max(lim.min, at[2]));
        window.currentScale = s;
        window.currentX = cw / 2 - at[0] * s;
        window.currentY = ch / 2 - at[1] * s;
        lastScale = s;
        window.updateMapTransform();
        const slider = document.getElementById("mz-slider");
        if (slider) slider.value = s;
        const zv = document.getElementById("zoom-val");
        if (zv) zv.innerText = Math.round(s * 100) + "%";
        setTimeout(() => {
            releaseArrivalMask();
            setTimeout(() => {
                content.classList.add("nb-glide");
                if (S() <= unionScale()) clampTo(unionBox()); else window.localEnforceBoundaries();
                window.updateMapTransform();
                setTimeout(() => {
                    content.classList.remove("nb-glide");
                    if (sel && window.selectStation && window.processedStations && window.processedStations[sel]) window.selectStation(sel);
                }, reduceMotion ? 0 : 760);
            }, reduceMotion ? 0 : 160);
        }, 30);
    }

    // ── 启动：等引擎首次居中后再接管边界、画影子 ────────────────────────────
    function onEngineReady(cb) {
        if (content.style.transform) { cb(); return; }
        const mo = new MutationObserver(() => {
            if (!content.style.transform) return;
            mo.disconnect(); cb();
        });
        mo.observe(content, { attributes: true, attributeFilter: ["style"] });
    }
    onEngineReady(() => {
        window.enforceBoundaries = enforce;
        arrive();
        nbs.forEach(async (nb) => {
            try {
                // 首屏渲染完、浏览器空闲后再取邻城数据并绘制影子，不与本城加载抢主线程
                await nextIdle();
                nb.data = await loadNeighbor(nb);
                if (!nb.data) return;
                await mountShadow(nb);
            } catch (err) {
                console.warn(`[CityNeighbors] 邻城 ${nb.cfg.id} 影子加载失败:`, err);
            }
        });
        updateShadows();
        updateHint();
    });

    // 切换深浅色主题时重画影子（位图不会跟随 CSS 变量变化）
    new MutationObserver(() => nbs.forEach((nb) => { if (nb.data) mountShadow(nb); }))
        .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    /** 供城市模块调用：跳转到邻城并可选中某站 */
    window.CGoNeighbors = {
        list: () => nbs.map((n) => n.cfg.id),
        go(cityId, opts = {}) {
            const nb = nbs.find((n) => n.cfg.id === cityId);
            if (!nb) return false;
            go(nb, opts);
            return true;
        }
    };

    function injectStyle() {
        if (document.getElementById("nb-style")) return;
        const st = document.createElement("style");
        st.id = "nb-style";
        st.textContent = `
.nb-shadow { position: absolute; pointer-events: none; z-index: 1; opacity: .34; transition: opacity .35s ease; }
#map-content.nb-glide { transition: transform .75s cubic-bezier(.22,.61,.36,1) !important; }
#map-container.nb-union-mode { cursor: grab; }
#nb-hint { position: absolute; left: 50%; z-index: 60; display: flex; align-items: center; gap: 8px; padding: 8px 16px 8px 8px;
  border: 1px solid var(--divider, rgba(0,0,0,.08)); border-radius: 999px; background: var(--panel-bg, rgba(255,255,255,.92));
  color: var(--text-main, #222); font: 500 13px/1.2 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  box-shadow: 0 6px 24px rgba(0,0,0,.14); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  opacity: 0; pointer-events: none; transform: translate(-50%, 0) scale(.92); transition: opacity .25s ease, transform .25s ease; cursor: pointer;
  white-space: nowrap; max-width: calc(100% - 32px); }
#nb-hint .nb-hint-text { overflow: hidden; text-overflow: ellipsis; }
#nb-hint[data-edge="top"] { top: 88px; }
#nb-hint[data-edge="bottom"] { bottom: 28px; }
#nb-hint[data-edge="left"], #nb-hint[data-edge="right"] { top: 50%; }
#nb-hint.on { opacity: 1; pointer-events: auto; transform: translate(-50%, 0) scale(1); }
#nb-hint.ready { background: var(--primary-color, #00263b); color: #fff; }
#nb-hint .nb-ring { width: 26px; height: 26px; transform: rotate(-90deg); flex: none; }
#nb-hint .nb-ring-bg { fill: none; stroke: currentColor; opacity: .15; stroke-width: 3; }
#nb-hint .nb-ring-fg { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; transition: stroke-dashoffset .12s linear; }
#nb-hint cgo-icon { margin-left: -30px; margin-right: 8px; }
html.nb-leaving #nb-hint { opacity: 1; }
html.nb-leaving #map-content { opacity: 0; transition: opacity .42s ease .02s, transform .75s cubic-bezier(.22,.61,.36,1) !important; }
@media (max-width: 640px) { #nb-hint[data-edge="top"] { top: 78px; } #nb-hint { font-size: 12px; } }
@media (prefers-reduced-motion: reduce) { .nb-shadow, #nb-hint { transition: none; } html.nb-leaving #map-content { transition: none !important; } }
`;
        document.head.appendChild(st);
    }
})();
