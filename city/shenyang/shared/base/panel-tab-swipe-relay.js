/**
 * CGo OpenMap - 共享层：车站信息板「在交互元素上的横滑切页」补充通道
 * (shared/base/panel-tab-swipe-relay.js)
 *
 * 核心的 core/panel-tab-swipe.js 在起手目标命中 `button` / `a` 等交互元素时**直接放弃**，
 * 用意是保护点击（历史上出过「手势接管之后按钮点不动」）。但车站信息板里**整宽 `<a>`**
 * （车站层级图、卡片标题行）与成排按钮占了大半可视面积，于是「在它们上面左右滑」
 * 完全没反应，且没有别的手势可以替代。
 *
 * 本模块只补这一种缺口，做法刻意保守：
 *   · 仅在起手目标命中 `a` / `button` / `[role=button]` / `[role=tab]` 时动作
 *     （核心已处理的普通区域一律不碰，两套引擎不会重复切页）；
 *   · **横向**位移超过 10px 且大于纵向位移的 1.15 倍，才认作切页手势；未达阈值
 *     一律不 preventDefault、不拦点击 —— 点击因此完全不受影响（正是核心当年担心之处）；
 *   · 真表单控件（input / textarea / select / label）、可横向滚动的容器、
 *     地图卡片 / 画布 / iframe 仍然让路（与核心同口径）；
 *   · 命中后与核心同做法：点下一枚 / 上一枚页签（复用核心的激活事件），并把选中页签
 *     带进视野。**纵向手势完全不拦**，原生滚动照旧。
 *
 * ⚠️ 纵向的「从按钮起手拖动换档」仍未补：核心把抽屉位置写在面板的内联 transform 上、
 *    档位由闭包里的 getDetents() 决定，外部没有接口；要补就得复刻整套跟手与弹簧，
 *    与本仓库「上游有重叠实现一律以上游为准」的约定相冲。该缺口留待上游在 core 内修。
 *
 * 无对外接口，脚本存在即生效；面板每次重渲染后由 MutationObserver 重新接管。
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    const PANEL_ID = "info-panel";
    const MOBILE_MAX = 640;
    const MOVE_THRESHOLD = 10;    // px：与核心同口径
    const DIR_RATIO = 1.15;       // 横向须明显大于纵向，才认作切页
    /** 只接管核心放弃的交互元素 */
    const RELAY_TARGET = "a, button, [role='button'], [role='tab']";
    /** 这些上起手仍让路：真表单控件（文本选择等原生行为）+ 核心约定的忽略标记 */
    const SKIP_SELECTOR = "input, select, textarea, label, [data-panel-swipe-ignore]";
    /** 自管手势的区域（地图卡片 / 画布 / 内嵌页），不参与切页 */
    const IGNORE_ZONE = "[data-card-type='map'], .stacard-minimap-viewport, canvas, iframe";

    const isMobile = () => window.innerWidth <= MOBILE_MAX;

    /** 可见且可用的页签，顺序即左右滑动顺序（与核心同一口径） */
    function tabsOf(panel) {
        return Array.from(panel.querySelectorAll(".panel-tabs-nav > .tab-item"))
            .filter((tab) => !tab.hidden && tab.getClientRects().length
                && tab.getAttribute("aria-disabled") !== "true");
    }

    /** 接管某个 .panel-body，返回解除函数 */
    function attach(body) {
        const panel = body.closest("#" + PANEL_ID);
        if (!panel) return null;
        let gesture = null;

        function onStart(e) {
            gesture = null;
            if (!isMobile() || e.touches.length !== 1) return;
            const target = e.target instanceof Element ? e.target : null;
            if (!target) return;
            // 只补核心跳过的那类目标；普通区域交给核心自己的引擎
            if (!target.closest(RELAY_TARGET) || target.closest(SKIP_SELECTOR)) return;
            if (target.closest(IGNORE_ZONE)) return;
            // 自身可横向滚动的容器（表格、时刻表等）保留自己的手势
            for (let node = target; node && node !== body; node = node.parentElement) {
                const style = getComputedStyle(node);
                if (node.scrollWidth - node.clientWidth > 2 && /auto|scroll/.test(style.overflowX)) return;
            }
            const order = tabsOf(panel);
            if (order.length < 2) return;
            const index = order.findIndex((tab) => tab.classList.contains("active"));
            if (index < 0) return;
            const touch = e.touches[0];
            gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY,
                at: performance.now(), order, index, horizontal: false };
        }

        function onMove(e) {
            if (!gesture) return;
            const touch = Array.from(e.touches).find((t) => t.identifier === gesture.id);
            if (!touch) return;
            const dx = touch.clientX - gesture.x;
            const dy = touch.clientY - gesture.y;
            if (!gesture.horizontal) {
                if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;
                // 纵向占优 → 让给原生滚动（不做任何拦截）
                if (Math.abs(dx) <= Math.abs(dy) * DIR_RATIO) { gesture = null; return; }
                // 浏览器已接管（如原生滚动/缩放）时不改判
                if (!e.cancelable) { gesture = null; return; }
                gesture.horizontal = true;
            }
            // 到这里才确定是切页手势：吞掉这一下，避免手指离开时误触发点击
            if (e.cancelable) e.preventDefault();
        }

        function onEnd(e) {
            const g = gesture;
            gesture = null;
            if (!g || !g.horizontal) return;
            if (e.type === "touchcancel") return;
            const touch = Array.from(e.changedTouches).find((t) => t.identifier === g.id);
            if (!touch) return;
            const dx = touch.clientX - g.x;
            const speed = Math.abs(dx) / Math.max(1, performance.now() - g.at);
            const threshold = Math.min(80, Math.max(48, body.clientWidth * 0.12));   // 与核心同口径
            const nextIndex = g.index + (dx < 0 ? 1 : -1);
            const swipe = Math.abs(dx) >= threshold || (Math.abs(dx) >= 24 && speed >= 0.45);
            if (!swipe || nextIndex < 0 || nextIndex >= g.order.length) return;
            const next = g.order[nextIndex];
            next.click();                                                             // 复用核心的激活事件
            next.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
        }

        function onCancel() { gesture = null; }

        body.addEventListener("touchstart", onStart, { passive: true });
        body.addEventListener("touchmove", onMove, { passive: false });   // 需 preventDefault
        body.addEventListener("touchend", onEnd, { passive: true });
        body.addEventListener("touchcancel", onCancel, { passive: true });
        return () => {
            body.removeEventListener("touchstart", onStart);
            body.removeEventListener("touchmove", onMove);
            body.removeEventListener("touchend", onEnd);
            body.removeEventListener("touchcancel", onCancel);
        };
    }

    let release = null;
    let boundBody = null;

    /** 面板每次重渲染都会换掉 .panel-body，按「容器是否换过」决定要不要重接管 */
    function ensure() {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;
        const body = panel.querySelector(".panel-body");
        if (release && body && body === boundBody) return;
        if (release) { release(); release = null; }
        boundBody = body || null;
        release = body ? attach(body) : null;
    }

    function start() {
        ensure();
        const panel = document.getElementById(PANEL_ID);
        if (panel) new MutationObserver(ensure).observe(panel, { childList: true, subtree: true });
        window.addEventListener("resize", ensure);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
