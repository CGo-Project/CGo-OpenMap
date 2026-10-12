/**
 * CGo OpenMap - 共享层：移动端车站详情抽屉手势 (shared/base/panel-sheet-gesture.js)
 *
 * 车站详情 #info-panel 的三档抽屉（收起 / 半屏 / 全屏）在移动端的**全部**手势：
 *   · 头部 / 把手：跟手拖动、松手甩动 / 就近吸附、轻点循环换档；
 *   · 内容区：半屏上滑优先展开、到顶下滑跟手收起、其余交给原生滚动；
 *   · 半屏禁掉内容区原生滚动（否则上滑会被浏览器先抢去滚内容）；
 * 均**委托给通用引擎** shared/base/sheet-drag.js，本文件只提供「车站面板适配器」：
 * 位置空间是 `top`、档位是 body 上的三个类、滚动容器是 `.panel-body`。
 *
 * 为什么卸掉 core 的拖拽：
 *   core 的 initMobileSheetDrag() 写死在 #info-panel 上（内容区按下也会被拖走、且把
 *   touch-action 连同内容滚动一起禁掉），且是闭包私有、无法复用；既然要统一到一份实现，
 *   就由本模块在每次渲染后调用它暴露的 `panel._mobileSheetDragCleanup()` 卸掉，再装上引擎。
 *   ⚠️ core 每次重渲染都会重绑，故每次面板重建都要再卸一次（见 ensure()）。
 *
 * 样式表由脚本按自身 URL 注入（同 adjacent-jump.js 的做法）。
 * 加载：接入城市在 {city}.js 的 document.write 列表里引入（须晚于 sheet-drag.js 与 viewport-inset.js）。
 * 对外接口：window.CGoPanelSheetGesture = { refresh }（一般无需调用）。
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    /** 样式表注入标记，避免重复引入 */
    const STYLE_FLAG_ATTR = "data-cgo-panel-sheet-gesture-style";

    /**
     * 本脚本自身的 URL，用于推导同目录的 panel-sheet-gesture.css。
     * ⚠️ 必须在脚本执行期读取 currentScript，之后它会指向别的脚本。
     */
    const SELF_URL = (typeof document !== "undefined" && document.currentScript?.src) || "";

    const SETTLE_MS = 420;   // ms：CSS 档位过渡 0.38s + 顶部填色延时，同拍

    /**
     * 按自身脚本 URL 推导并注入样式表（幂等）。
     * 用字符串替换把 `?v=` 版本串原样搬到 CSS 上，避免走 new URL() 丢 query 命中旧缓存。
     */
    function injectStyle() {
        if (!SELF_URL || typeof document === "undefined") return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = SELF_URL.replace(/panel-sheet-gesture\.js(\?|$)/, "panel-sheet-gesture.css$1");
        link.setAttribute(STYLE_FLAG_ATTR, "");
        (document.head || document.documentElement).appendChild(link);
    }

    /** 当前档位（与 core 的三档类同源） */
    function stage() {
        const b = document.body;
        if (b.classList.contains("panel-sheet-collapsed")) return "collapsed";
        if (b.classList.contains("mobile-panel-expanded")) return "full";
        return "half";
    }

    /** 三档对应的 top 值（px），与 core 的 getDetents() 同口径 */
    function detents() {
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const COLLAPSED_EXPOSE = 90;   // 20px 把手感应区 + 70px panel-header min-height
        return {
            full: 60,
            half: vh * 0.40,
            collapsed: Math.max(vh * 0.40 + COLLAPSED_EXPOSE, vh - COLLAPSED_EXPOSE)
        };
    }

    /** 写档位类（与 core 的 applyStage 同款；动画交给 CSS 的 top 过渡） */
    function setStageClasses(name) {
        const b = document.body;
        b.classList.remove("panel-sheet-collapsed", "mobile-panel-expanded", "mobile-panel-docked-full");
        if (name === "collapsed") {
            b.classList.add("panel-sheet-collapsed");
        } else if (name === "full") {
            b.classList.add("mobile-panel-expanded");
            // 落位后再开顶部填色（与 core 的延时一致）
            setTimeout(() => {
                if (b.classList.contains("mobile-panel-expanded")) b.classList.add("mobile-panel-docked-full");
            }, SETTLE_MS);
        }
        // mobile-split-active 是三档共同的面板「已打开」标记
        if (!b.classList.contains("mobile-split-active")) b.classList.add("mobile-split-active");
    }

    /** 换档后宽度变了，请 viewport-inset 按落定后的抽屉高度重算遮挡并重新取景 */
    function refit() {
        const api = window.CGoViewportInset;
        if (!api || typeof api.refresh !== "function") return;
        api.refresh();                                   // 过渡刚开始，通常无变化（保险）
        setTimeout(() => api.refresh(), SETTLE_MS + 40);  // 落定后再按真实高度算一次
    }

    /** 车站面板适配器：把引擎接到 top 空间 + body 档位类上 */
    function createHandle(panel) {
        return window.CGoSheetDrag.create({
            panel,
            getScrollEl: () => panel.querySelector(".panel-body"),
            stages: ["collapsed", "half", "full"],
            halfStage: "half",
            lockHalfScroll: true,
            getStage: stage,
            detents,
            deltaSign: 1,                                   // top 空间：手指上滑 → top 变小
            readPosition: () => panel.getBoundingClientRect().top,
            writePosition: (p) => panel.style.setProperty("top", p + "px", "important"),
            clearPosition: () => panel.style.removeProperty("top"),
            beginDrag: () => {
                document.body.classList.add("panel-sheet-dragging");    // 禁过渡、恢复 overflow（复用 core 的类）
                document.body.classList.remove("mobile-panel-docked-full");
            },
            endDrag: () => document.body.classList.remove("panel-sheet-dragging"),
            applyStage: setStageClasses,
            onSettle: refit,
            // 轻点把手 / 标题栏：收起 → 半屏、半屏 ⇄ 全屏（与 core 的三档循环一致）
            tapTarget: (cur) => (cur === "full" ? "half" : cur === "half" ? "full" : "half")
        });
    }

    let handle = null;
    let boundBody = null;

    /**
     * 确保引擎接在当前的面板内容上。
     * 面板每次重渲染都会换掉 .panel-body，且 core 会重新绑上它自己的拖拽，故按
     * 「.panel-body 是否换过」判断要不要重建引擎——没换就只校正滚动锁（避免被
     * 地图卡片铺瓦片之类的子节点变动频繁触发重建）。
     */
    function ensure() {
        const panel = document.getElementById("info-panel");
        if (!panel) return;
        const body = panel.querySelector(".panel-body");
        if (handle && body && body === boundBody) {
            handle.refresh();
            return;
        }
        // 卸掉 core 的移动端拖拽（每次重建都要再卸一次：core 每次渲染都会重绑）
        if (typeof panel._mobileSheetDragCleanup === "function") {
            try { panel._mobileSheetDragCleanup(); } catch (err) { /* 仅解除监听，失败无碍 */ }
        }
        panel._mobileSheetDragCleanup = null;
        if (handle) { handle.destroy(); handle = null; }
        if (!window.CGoSheetDrag) return;      // 引擎未就绪：退化为不接管（不报错）
        boundBody = body || null;
        handle = createHandle(panel);
        // 让 core 的下一次 initMobileSheetDrag() 先卸掉我们的；它随后会绑 core 自己的，由本观察器再接管回来
        panel._mobileSheetDragCleanup = () => { if (handle) { handle.destroy(); handle = null; } };
    }

    function start() {
        ensure();
        const panel = document.getElementById("info-panel");
        if (panel) {
            new MutationObserver(ensure).observe(panel, { childList: true, subtree: true });
        }
        window.addEventListener("resize", ensure);
    }

    injectStyle();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.CGoPanelSheetGesture = { refresh: ensure };
})();
