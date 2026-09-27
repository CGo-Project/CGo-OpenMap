/**
 * CGo OpenMap - 固定侧栏「浮岛卡片」改造（三城共享层）
 *
 * 目标：桌面端固定侧栏（body.legend-pinned）向官方 /map 页面靠拢——侧栏不再是一条贴着
 * 屏幕左缘的通栏，而是挂在标题栏浮岛下方、宽度与浮岛等宽的浮起圆角卡片；卡片内部的各区块
 * 退成一张张「去掉底色 + 细描边 + 圆角」的小卡片。视觉部分全部在同目录 sidebar-refit.css
 * （本脚本按自身 URL 注入，调用方无需手工引用），这里只做 CSS 做不到的三件事：
 *
 *  1. 量标题栏浮岛（.header-island-left）的实际矩形，写回 --cgo-sb-left / --cgo-sb-width /
 *     --cgo-sb-top。浮岛是 width: fit-content，宽度由内容（两个图标按钮 + 城市标题）决定，
 *     本项目三城的左岛内容完全相同，实测稳定在 284px、左缘 20px；仍以实测为准，
 *     是为了覆盖字体差异、窄窗口下被 max-width 截断、以及将来顶栏增删按钮的情况。
 *  2. 固定侧栏形态下把「取消固定」按钮从侧栏顶端搬到浮动缩放条的检索面板按钮位
 *     （#modern-zoom-control 的第一位，即 #mz-menu 所在的位置带），取消固定后原样搬回。
 *     搬的是同一个节点，核心与 route-panel.js 都靠 #legend-pin-btn 这个 id 取它
 *     （route-panel.js 还会程序化 pinBtn.click() 来吸附固定），因此不能换成副本。
 *  3. 把标题栏里的线路色块换成结果面板同款迷你线路标（正方/正圆 + 线路编号）。
 *     色块由核心 rebuildSidebarHistory（历史车站）与 route-panel.js（路线结果）两处填充，
 *     都只给到「线路名 + 内联底色」，故这里按颜色/同名反查线路，再沿用结果面板那套编号规则
 *     （CGO_ROUTE_CONFIG.lineCodes 覆盖 → 线路名抽数字；有轨保持方形）。
 *
 * 不引入任何城市业务数据：三城共用同一份实现，城市侧只需在 {city}.js 里引入本脚本。
 *
 * 对外接口：window.CGoSidebarRefit = { refresh }
 */
(function () {
    "use strict";

    const STYLE_ID = "cgo-sidebar-refit-style";
    const SKIN_ATTR = "data-cgo-sidebar-refit";

    const PIN_ID = "legend-pin-btn";
    const ZOOM_ID = "modern-zoom-control";
    const CONTENT_ID = "legend-content";
    const ISLAND_SELECTOR = ".tool-header .header-island-left";

    const MOBILE_MAX = 640;
    /** 编号徽标边长（px），与 sidebar-refit.css 的 --cgo-sb-badge 一致 */
    const BADGE_SIZE = 16;
    /** 编号可用宽度占徽标边长的比例：方形只留一点边距，圆形还要躲开弧线的内收 */
    const BADGE_ROOM = { square: 0.9, circle: 0.74 };

    /* ── 样式注入：按脚本自身 URL 找同名 css，与 calligraphy.css / route-panel.css 同一做法。
        query（?v= 版本号）一并带过去：Service Worker 对静态资源是「精确匹配优先」，
       CSS 的 URL 若恒定不变，改了样式也会一直被旧缓存命中。 ── */
    (function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const src = document.currentScript?.src;
        if (!src) return;
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = src.replace(/sidebar-refit\.js(\?|$)/, "sidebar-refit.css$1");
        document.head.appendChild(link);
    })();

    const root = () => document.documentElement;
    const pinned = () => document.body.classList.contains("legend-pinned") && window.innerWidth > MOBILE_MAX;

    /* ======================================================================
     * 1. 侧栏几何：跟随标题栏浮岛
     * ==================================================================== */

    /**
     * 标题栏浮岛的「固有宽度」——也就是它没被本层 CSS 撑开时本会有的宽度。
     *
     * 不能直接量浮岛自己的 rect：侧栏列宽是从浮岛宽推出来的，而浮岛宽又被侧栏列反向
     * 撑开（见 sidebar-refit.css 的 --cgo-sb-column），两边互相喂，每量一轮就宽 2×内边距，
     * 会一路无限加宽。所以改量它内部子元素的宽度之和：header-left 是 flex-shrink: 0、
     * 分隔线固定 1px、header-center 是 flex: 0 1 auto 且 overflow: hidden，
     * 这些子元素不随浮岛被撑宽而变，量出来是稳定值，闭环即断。
     * （浮岛窄到要截断标题时，子元素会跟着缩，此时量到的就是「当前真实可用宽度」，也正确。）
     */
    function islandIntrinsicWidth(island) {
        const style = window.getComputedStyle(island);
        const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
        const gap = parseFloat(style.columnGap) || 0;
        const kids = Array.from(island.children)
            .filter((el) => window.getComputedStyle(el).display !== "none");
        if (!kids.length) return 0;
        const inner = kids.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0)
            + gap * (kids.length - 1);
        return Math.ceil(inner + padding);
    }

    /** 变量同一个值不再重复写：反复写同一个自定义属性虽不改变计算值，
        却会惊动挂在浮岛上的 ResizeObserver，白白多跑一轮 */
    function setVar(name, value) {
        const style = root().style;
        if (style.getPropertyValue(name) !== value) style.setProperty(name, value);
    }

    /** 浮岛未被本层 CSS 干预时的左缘：固定形态下浮岛的 left 被强制成 0，
        量它会污染「浮岛原本离窗口左边多远」，故只在未固定时更新并缓存 */
    let naturalLeft = null;

    /**
     * 量标题栏浮岛并写回几何变量。
     *
     * 浮岛只在悬浮顶栏模式（header-mode="floating"）下才是有形状的卡片，经典模式下
     * .header-island 是 display: contents（量不出矩形），此时退回顶栏自身的底边与固定左缘，
     * 保证两种顶栏形态下侧栏都不会盖住标题栏。
     */
    function syncGeometry() {
        const header = document.querySelector(".tool-header");
        const island = document.querySelector(ISLAND_SELECTOR);
        const islandRect = island ? island.getBoundingClientRect() : null;
        const measureIsland = Boolean(islandRect && islandRect.width > 40);

        if (measureIsland && !pinned()) naturalLeft = Math.round(islandRect.left);
        const left = measureIsland ? (naturalLeft ?? Math.round(islandRect.left)) : 20;
        const width = measureIsland ? (islandIntrinsicWidth(island) || 284) : 284;

        let bottom = measureIsland ? islandRect.bottom : 0;
        if (!measureIsland && header) bottom = header.getBoundingClientRect().bottom;
        // 与引擎 getMapTopOffset 同口径：浮岛底边再留 12px
        const top = Math.max(76, Math.round(bottom + 12));

        setVar("--cgo-sb-left", `${left}px`);
        setVar("--cgo-sb-width", `${width}px`);
        setVar("--cgo-sb-top", `${top}px`);
    }

    /* ======================================================================
     * 2. 「取消固定」按钮：固定侧栏形态下搬进浮动缩放条
     * ==================================================================== */

    /** 按钮原位（.legend-modal 内、返回按钮之后）的锚点，取消固定时按它搬回 */
    let pinHome = null;
    let pinMoved = false;

    function syncPinButton() {
        const btn = document.getElementById(PIN_ID);
        const zoom = document.getElementById(ZOOM_ID);
        if (!btn || !zoom) return;

        if (!pinned()) {
            if (pinMoved && pinHome?.isConnected) {
                pinHome.parentNode.insertBefore(btn, pinHome.nextSibling);
                pinMoved = false;
            }
            return;
        }

        if (!pinHome || !pinHome.isConnected) {
            pinHome = document.createComment("cgo-sidebar-refit-pin-home");
            btn.parentNode.insertBefore(pinHome, btn);
        }
        if (btn.parentNode !== zoom) {
            // 放最前面：即检索面板按钮（#mz-menu）所在的位置带，与其上方的固定按钮位一致
            zoom.insertBefore(btn, zoom.firstElementChild);
            pinMoved = true;
        }
    }

    /* ======================================================================
     * 3. 标题栏线路标：色块 → 结果面板同款迷你徽标
     * ==================================================================== */

    /** 有轨还是地铁：决定编号徽标形状与编号写法（与 route-panel.js 同一口径） */
    function isTramLine(line) {
        return line?.mode === "tram" || String(line?.id || "").toUpperCase().startsWith("HNT");
    }

    /** 线路编号：城市可用 CGO_ROUTE_CONFIG.lineCodes 覆盖个别线路（如沈阳有轨 5 号线写作 "T5"） */
    function lineCode(line) {
        const id = String(line?.id || "");
        const override = window.CGO_ROUTE_CONFIG?.lineCodes;
        if (override?.[id]) return String(override[id]);
        const name = String(line?.name || "");
        return name.match(/\d+/)?.[0] || name.slice(0, 3) || id.slice(0, 3);
    }

    /** 城市声明 lineCodeShape: "circle" 时地铁用正圆，其余一概圆角方形 */
    function codeShape(line) {
        return window.CGO_ROUTE_CONFIG?.lineCodeShape === "circle" && !isTramLine(line) ? "circle" : "square";
    }

    /**
     * 国铁散点线（中国铁路）：编号无从抽取——线路名是「中国铁路」，抽数字得到空、
     * 退化成「中国铁」三个字挤在徽标里。这类线路的徽标改用 CGoUI 的 railway 图标，
     * 底色取线路徽标底色 svgclr（画布上 icon@56 的底色），而不是线网走向色 color
     * （#bdcbd2 之类的浅灰，配白字几乎看不清）。
     * 判据与 route-panel.js 的同名函数一致：国铁散点线按 AGENTS.md 的定义即 isPointOnly。
     */
    function isRailwayLine(line) {
        return Boolean(line) && (line.isPointOnly === true || String(line.name || "") === "中国铁路");
    }

    /** 颜色归一为小写六位 Hex，便于与线路数据里的 color 直接比对 */
    function toHex(value) {
        const text = String(value || "").trim();
        if (!text) return "";
        if (text.startsWith("#")) {
            const hex = text.slice(1);
            if (hex.length === 3) return `#${hex.split("").map((c) => c + c).join("").toLowerCase()}`;
            return hex.length === 6 ? `#${hex.toLowerCase()}` : "";
        }
        const match = text.match(/rgba?\(([^)]+)\)/i);
        if (!match) return "";
        const [r, g, b] = match[1].split(",").map((n) => parseInt(n, 10));
        if (![r, g, b].every(Number.isFinite)) return "";
        return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
    }

    /**
     * 反查色块对应的线路：填充方只给了 title（线路名）与内联底色。
     * 同名线路（如沈阳地铁 5 号线 / 有轨 5 号线）按颜色再分一次；查不到就回落线路名抽数字。
     */
    function lineOfSquare(square) {
        const lines = window.linesData || [];
        const name = square.getAttribute("title") || "";
        const color = toHex(square.style.backgroundColor || square.style.background);
        const sameName = lines.filter((line) => String(line.name || "") === name);
        if (sameName.length === 1) return sameName[0];
        const pool = sameName.length ? sameName : lines;
        if (!color) return sameName[0] || null;
        const byColor = pool.filter((line) => toHex(line.color) === color);
        return byColor.length === 1 ? byColor[0] : sameName[0] || byColor[0] || null;
    }

    let measureCtx = null;

    /**
     * 编号偏长（"10"、"T5"）时横向压扁文字，徽标本身始终保持正形。
     *
     * 用 canvas 量文字宽度而非读 DOM：折叠态下徽标处于 display:none，量不出宽度，
     * 而 canvas 只依赖字体本身（字体从计算样式取，隐藏元素也能取到），任何状态下都能给出结果。
     * 压缩比例写在 --cgo-rt-code-sx 上，由 CSS 的 transform 消费（与 route-panel.css 同一套）。
     */
    function fitCode(badge, codeEl) {
        if (!codeEl?.textContent) return;
        measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
        if (!measureCtx) return;
        const style = window.getComputedStyle(badge);
        measureCtx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const width = measureCtx.measureText(codeEl.textContent).width;
        if (!Number.isFinite(width) || width <= 0) return;
        const size = parseFloat(style.width) || BADGE_SIZE;
        const room = size * (badge.classList.contains("circle") ? BADGE_ROOM.circle : BADGE_ROOM.square);
        const scale = Math.min(1, room / width);
        if (scale < 0.999) codeEl.style.setProperty("--cgo-rt-code-sx", scale.toFixed(3));
    }

    /** 就地把尚未处理过的色块换成徽标（已处理的打 data 标记，避免观察器反复处理） */
    function decorateSquares(scope) {
        const squares = scope.querySelectorAll(`.header-color-square:not([${SKIN_ATTR}])`);
        squares.forEach((square) => {
            const line = lineOfSquare(square);
            if (isRailwayLine(line)) {
                // 国铁特例：内容换成 railway 图标，底色换成线路徽标底色；无编号可压，也就不用压字
                square.setAttribute(SKIN_ATTR, "1");
                square.classList.remove("circle");
                if (line.svgclr) square.style.background = line.svgclr;
                square.textContent = "";
                const icon = document.createElement("cgo-icon");
                icon.setAttribute("name", "railway");
                icon.setAttribute("size", "12");
                square.appendChild(icon);
                return;
            }
            const code = line ? lineCode(line) : (square.getAttribute("title") || "").match(/\d+/)?.[0];
            if (!code) return;
            square.setAttribute(SKIN_ATTR, "1");
            square.textContent = "";
            if (line && codeShape(line) === "circle") square.classList.add("circle");
            const codeEl = document.createElement("span");
            codeEl.className = "cgo-rt-code";
            codeEl.textContent = code;
            square.appendChild(codeEl);
            fitCode(square, codeEl);
        });
    }

    /* ======================================================================
     * 启动
     * ==================================================================== */

    let contentObserver = null;

    /** 盯住侧栏内容区：搜索/图例/历史车站区块重建、路线结果与被固定进来的面板都会落到这里 */
    function observeContent() {
        const content = document.getElementById(CONTENT_ID);
        if (!content) return;
        contentObserver?.disconnect();
        // 只盯子节点：压扁编号会写内联样式，若连属性一起盯就会自触发
        contentObserver = new MutationObserver(() => decorateSquares(content));
        contentObserver.observe(content, { childList: true, subtree: true });
        decorateSquares(content);
    }

    function refresh() {
        syncGeometry();
        syncPinButton();
        observeContent();
    }

    function start() {
        refresh();
        // body 的 class 决定形态（legend-pinned / pinned-hidden）与侧栏显隐
        new MutationObserver(() => {
            syncPinButton();
            decorateSquares(document.getElementById(CONTENT_ID) || document);
        }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
        // html 的 header-mode 决定浮岛是否存在（切换顶栏形态后几何要重量一次）
        new MutationObserver(syncGeometry).observe(root(), {
            attributes: true,
            attributeFilter: ["header-mode", "glass-mode"]
        });
        window.addEventListener("resize", syncGeometry);
        // 浮岛宽度是 fit-content：字体就绪、标题变化都会改宽度，直接盯它自身
        const island = document.querySelector(ISLAND_SELECTOR);
        if (island && "ResizeObserver" in window) new ResizeObserver(syncGeometry).observe(island);
    }

    start();

    window.CGoSidebarRefit = { refresh };
})();