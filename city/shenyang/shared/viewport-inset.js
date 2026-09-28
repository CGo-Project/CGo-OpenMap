/**
 * CGo OpenMap - 视口遮挡与取景（共享层）
 *
 * 打开的面板浮层会盖住画布边缘，本模块负责把这件事实报给引擎：
 * `window.CGoViewportInsets = { left, right, bottom }`（px），引擎的
 * `getViewportInsets()` 消费它，把平移边界与居中区收缩进来（见 core/script.js）。
 * 遮挡一显一隐就调一次 `enforceBoundaries()` 让引擎重算，全为 0 时与不加本模块完全一致。
 *
 * 口径：按浮层实际所在的那一侧留白——浮层在左就留左、在右就留右，另一侧只让开缩放控件。
 * 早先「两侧同留浮层宽」在 1440 宽的屏上会吃掉近三分之二画布，与浮层实际遮挡量不符；
 * 只在浮层跨越中线换边时才会左右互换，属可接受的一次重排。
 *
 * 只统计「浮层」：position 为 fixed 且确实可见的面板。固定侧栏里的区块是文档流内排布的，
 * 不与画布重叠，天然不计入——所以本模块不需要知道任何形态细节。
 */
(function () {
    "use strict";

    /** 计入遮挡的面板：规划行程、路线结果、以及核心的车站详情（后两者可能并不存在） */
    const PANEL_IDS = ["cgo-route-card", "cgo-route-result", "info-panel"];
    /**
     * 另有按 `data-cgo-inset` 自行声明的浮层（如小工具面板）。
     * 面板栈那几块只按"在哪一侧"留白，而这些浮层贴在角上（右下），光留右侧不够高，
     * 故声明里可以点名 `bottom` —— 本模块据此再留出底部。缺省行为与不加本属性完全一致。
     */
    const INSET_SELECTOR = "[data-cgo-inset]";
    const ZOOM_CONTROL_ID = "modern-zoom-control";
    const MOBILE_MAX = 640;

    const state = { left: 0, right: 0, bottom: 0 };

    function visibleFloatRect(el) {
        if (!el || !el.isConnected) return null;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.position !== "fixed") return null;
        const rect = el.getBoundingClientRect();
        return rect.width >= 1 && rect.height >= 1 ? rect : null;
    }

    /** 自行声明遮挡的浮层：返回 [元素, 声明] 列表 */
    function declaredInsets() {
        return [...document.querySelectorAll(INSET_SELECTOR)].map((el) => ({
            rect: visibleFloatRect(el),
            sides: (el.getAttribute("data-cgo-inset") || "").split(/[\s,]+/).filter(Boolean)
        })).filter((item) => item.rect);
    }

    function compute() {
        const rects = PANEL_IDS
            .map((id) => visibleFloatRect(document.getElementById(id)))
            .filter(Boolean);
        const declared = declaredInsets();
        if (!rects.length && !declared.length) return { left: 0, right: 0, bottom: 0 };

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const zoom = document.getElementById(ZOOM_CONTROL_ID)?.getBoundingClientRect();
        const zoomRight = zoom && zoom.width ? Math.ceil(zoom.right) : 0;

        // 自行声明了 bottom 的浮层（贴底那一类）：按它遮住的高度留出底部
        const declaredBottom = Math.max(0, ...declared
            .filter((item) => item.sides.includes("bottom"))
            .map((item) => Math.ceil(screenH - item.rect.top)));

        if (screenW <= MOBILE_MAX) {
            // 移动端的浮层是贴底抽屉：底部留出最高的那一个（直接取高度，抽屉拖动改高度时随内联
            // style 实时刷新），左侧同样给缩放控件让位
            const bottom = Math.max(
                declaredBottom,
                ...rects.map((rect) => Math.ceil(rect.height)),
                0
            );
            return { left: zoomRight, right: 0, bottom: Math.max(0, bottom) };
        }

        // 浮层在左半就留左边（留到它的右边缘），在右半就留右边（留到它的左边缘）
        let left = zoomRight;
        let right = 0;
        rects.forEach((rect) => {
            if (rect.left + rect.width / 2 < screenW / 2) left = Math.max(left, Math.ceil(rect.right));
            else right = Math.max(right, Math.ceil(screenW - rect.left));
        });
        declared.forEach((item) => {
            if (item.sides.includes("right")) right = Math.max(right, Math.ceil(screenW - item.rect.left));
            else if (item.sides.includes("left")) left = Math.max(left, Math.ceil(item.rect.right));
        });
        // 窄窗口下两侧预留可能把可用区挤成负数（可用区一负，居中与边界都会失去意义），
        // 故按比例等比收缩，保证至少留下画布三分之一的可用区
        const maxTotal = (screenW * 2) / 3;
        if (left + right > maxTotal) {
            const shrink = maxTotal / (left + right);
            left = Math.ceil(left * shrink);
            right = Math.ceil(right * shrink);
        }
        return { left, right, bottom: declaredBottom };
    }

    /** 写回遮挡尺寸并让引擎重算：遮挡没变就不打扰引擎 */
    function sync() {
        const next = compute();
        const changed = next.left !== state.left || next.right !== state.right || next.bottom !== state.bottom;
        if (!changed) return;
        Object.assign(state, next);
        window.CGoViewportInsets = { left: state.left, right: state.right, bottom: state.bottom };
        if (typeof window.enforceBoundaries === "function") window.enforceBoundaries();
        if (typeof window.updateMapTransform === "function") window.updateMapTransform();
    }

    /** 顶部遮挡：浮动标题栏浮岛的实际底边（与引擎 getMapTopOffset 同口径，移动端标题栏也是浮岛式） */
    function topOffset() {
        const floating = document.documentElement.getAttribute("header-mode") === "floating"
            || document.body.getAttribute("header-mode") === "floating";
        if (!floating) return 0;
        const island = document.querySelector(".tool-header .header-island");
        if (!island) return 76;
        const rect = island.getBoundingClientRect();
        return Math.max(76, Math.ceil(rect.bottom + 12));
    }

    /**
     * 让这次视图变更走一段过渡动画：复用引擎自己的 `.animate-zoom`
     * （css/style.css 里 transform 0.2s，引擎的飞跃定位、档位切换都用它），
     * 不再新造一套时长与缓动函数。
     *
     * 用定时器而非 transitionend 收尾：取景结果与当前视图相同时不会触发 transitionend，
     * 而 `.animate-zoom` 一旦留在元素上，之后每次拖动都会被动画拖成「跟手迟滞」。
     * 定时器（略长于 0.2s）保证一定摘掉，与引擎的写法一致。
     */
    const VIEW_TRANSITION_MS = 320;
    let viewTransitionTimer = null;

    function withViewTransition(run) {
        const content = document.getElementById("map-content");
        if (!content) return run();
        content.classList.add("animate-zoom");
        const result = run();
        clearTimeout(viewTransitionTimer);
        viewTransitionTimer = setTimeout(() => {
            viewTransitionTimer = null;
            content.classList.remove("animate-zoom");
        }, VIEW_TRANSITION_MS);
        return result;
    }

    /**
     * 「查看全程」：把一段地图坐标范围取景到刚好全部可见，落在可用区中心。
     * 直接调引擎的 `setMapView` 落位——平移与缩放都写进引擎自己的坐标里，
     * 之后拖动 / 缩放从同一份状态继续，不会有任何错位（早先用「事后叠加 transform 偏移」
     * 的做法正是错位的根源：引擎并不知道那份偏移，一动就打架）。
     * 落位带一段过渡动画（见 withViewTransition），不是硬切。
     * 缩放会钳制在城市的 minScale / maxScale 之内；顶部也避开标题栏浮岛（移动端标题栏是浮岛式）。
     * @param {{minX:number,minY:number,maxX:number,maxY:number}} box 地图坐标范围
     * @param {{padding?:number}} [options] padding 四周额外留白（px，缺省 60）
     * @returns {boolean} 是否已应用
     */
    function fit(box, options) {
        if (!box || typeof window.setMapView !== "function") return false;
        const padding = Number.isFinite(options?.padding) ? options.padding : 60;
        const container = document.getElementById("map-container");
        const containerW = container?.clientWidth || window.innerWidth;
        const containerH = container?.clientHeight || window.innerHeight;
        const top = topOffset();
        // 引擎已按内边距把可用区收窄，这里据此算「刚好装下」的缩放（顶部还要避开浮岛标题栏）
        const availW = Math.max(1, containerW - state.left - state.right);
        const availH = Math.max(1, containerH - top - state.bottom);
        const boxW = Math.max(1, box.maxX - box.minX);
        const boxH = Math.max(1, box.maxY - box.minY);
        const limits = window.getScaleLimits?.() || { min: 0.5, max: 3 };
        const scale = Math.min(limits.max, Math.max(limits.min, Math.min(
            Math.max(1, availW - padding * 2) / boxW,
            Math.max(1, availH - padding * 2) / boxH
        )));
        // 可用区中心在容器坐标里是 (left + availW/2, top + availH/2)；地图点 p 的屏幕位置是 currentX + p×scale
        return withViewTransition(() => window.setMapView({
            x: state.left + availW / 2 - ((box.minX + box.maxX) / 2) * scale,
            y: top + availH / 2 - ((box.minY + box.maxY) / 2) * scale,
            scale
        }));
    }

    let queued = false;
    function schedule() {
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
            queued = false;
            sync();
        });
    }

    const attrObserver = new MutationObserver(schedule);
    const watched = new WeakSet();

    /**
     * 面板的显隐、被面板栈压到栈下、以及形态迁移导致的整块重建，都会落到 class / 内联 style 上，
     * 故盯这两项即可。元素会被重建，所以每次 DOM 变动后都按当前节点重新绑定一遍。
     */
    function watchPanels() {
        PANEL_IDS.forEach((id) => {
            const el = document.getElementById(id);
            if (!el || watched.has(el)) return;
            watched.add(el);
            attrObserver.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
        });
        // 自行声明遮挡的浮层同样要盯：它们的显隐也落在 class 上
        document.querySelectorAll(INSET_SELECTOR).forEach((el) => {
            if (watched.has(el)) return;
            watched.add(el);
            attrObserver.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
        });
    }

    function refresh() {
        watchPanels();
        sync();
    }

    function start() {
        window.CGoViewportInsets = { left: 0, right: 0, bottom: 0 };
        refresh();
        // 面板挂载 / 拆除：浮层形态挂在 body 下，也会随面板栈在 body 与动态内容区之间搬家
        new MutationObserver(refresh).observe(document.body, { childList: true });
        const zoom = document.getElementById(ZOOM_CONTROL_ID);
        if (zoom) attrObserver.observe(zoom, { attributes: true, attributeFilter: ["class", "style"] });
        window.addEventListener("resize", schedule);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.CGoViewportInset = { refresh, compute, fit };
})();
