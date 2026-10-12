/**
 * CGo OpenMap - 行程规划面板：SVG 图标注入（共享层）
 *
 * 对外接口（window.CGoRoutePanelIcons）：
 *   adoptHelpers(context) → 接入核心下发的 helpers（有 injectInlineSvgs 就优先复用核心那份）
 *   injectSvgs(root)      → 把 root 下的 .svg-icon-placeholder[data-src] 就地替换成内联 SVG
 *
 * 从 route/route-panel.js 的「SVG 图标注入」章节抽出 —— 拆巨石第 2 步：
 * 原先挂在 route-panel 闭包里的 `coreInjectSvgs` 与 `SVG_CACHE` 一并搬进来，
 * 调用侧由别名解构引用（调用点不变）。
 *
 * 载入时机：须早于 route/route-panel.js。
 */
(function () {
    "use strict";

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

    window.CGoRoutePanelIcons = { adoptHelpers, injectSvgs };
})();
