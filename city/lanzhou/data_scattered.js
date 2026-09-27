/**
 * CGo OpenMap - 兰州散点与底图装饰元素 (city/lanzhou/data_scattered.js)
 *
 * ==============================================================================
 * 数据结构规范 (Scattered Item Schema)
 * ------------------------------------------------------------------------------
 * - id      {string} 装饰物唯一标识
 * - file    {string} SVG 资源路径（须以 "./" 开头，getSvgPath 才会原样放行）
 * - x / y   {number} 装饰物中心点画布坐标（.scattered-item 带 translate(-50%,-50%)）
 * - width   {number} 渲染宽度 (px)
 * - height  {number} 渲染高度 (px)
 * - opacity {number} 不透明度
 * - rotation{number} 旋转角度 (deg，可选)
 * - zIndex  {number} 同层内堆叠顺序（#scattered-layer 整体为 z-index:5）
 *
 * 图层叠序说明 (css/style.css)：
 *   #scattered-layer 5  <  #lines-layer 10  <  #not-open-layer 12
 *   <  #stations-layer 20  <  #labels-layer 30
 *   → 因此本层元素天然位于所有线路与车站「下方」，且 pointer-events:none
 *     不会拦截站点点击。
 * ==============================================================================
 */
const SCATTERED_DATA = [
    {
        id: "lanzhou-river",
        file: "./city/lanzhou/assets/lanzhou_river.svg",
        // x/y 取画布中心，宽高等于城市 mapSize (2700 x 2000)：
        // 使 SVG 的 viewBox 与画布坐标 1:1 对应，河道可直接按站点坐标定位。
        x: 1350,
        y: 1000,
        width: 2700,
        height: 2000,
        opacity: 1,
        // 同层内置于最底：压在国铁/机场等散点图标之下
        zIndex: 1
    }
];


if (typeof document !== "undefined") {
    // 河流主题色。手动主题优先；页面尚未写入 data-theme 时，
    // 跟随操作系统配色作为启动兜底。
    const styleId = "lanzhou-river-theme-style";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            :root { --lanzhou-river-color: #dceff4; }
            html[data-theme="light"] { --lanzhou-river-color: #dceff4; }
            html[data-theme="dark"] { --lanzhou-river-color: #17323b; }
            @media (prefers-color-scheme: dark) {
                html:not([data-theme]) { --lanzhou-river-color: #17323b; }
            }
            #scattered-layer .lanzhou-river-inline {
                width: 100%;
                height: 100%;
                display: block;
                color: var(--lanzhou-river-color);
                pointer-events: none;
            }
            #scattered-layer .lanzhou-river-inline .river {
                stroke: var(--lanzhou-river-color) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // SCATTERED_DATA 默认以 <img> 外链形式渲染 SVG，而 <img> 内部的 SVG
    // 无法读取宿主页面的 CSS 变量（只能跟随系统 prefers-color-scheme）。
    // 因此针对河流做一次「内联替换」：拉取 SVG 源码后直接插入 DOM，
    // 使其可跟随页面手动亮暗主题切换，与项目内联线路徽标的做法一致。
    const inlineLanzhouRiver = async () => {
        const img = document.querySelector('#scattered-layer img[src*="lanzhou_river.svg"]');
        if (!img || img.dataset.lanzhouInlining === "1") return false;
        img.dataset.lanzhouInlining = "1";
        try {
            const response = await fetch(img.src);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
            const sourceSvg = parsed.documentElement;
            if (!sourceSvg || sourceSvg.nodeName.toLowerCase() !== "svg") {
                throw new Error("Invalid SVG");
            }
            const svg = document.importNode(sourceSvg, true);
            svg.classList.add("lanzhou-river-inline");
            svg.setAttribute("aria-hidden", "true");
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            img.replaceWith(svg);
            return true;
        } catch (error) {
            // 保留原始外链 SVG 作为优雅降级，其内置 prefers-color-scheme
            // 规则仍可跟随系统主题。
            img.removeAttribute("data-lanzhou-inlining");
            console.warn("[Lanzhou] River SVG inline injection failed:", error);
            return false;
        }
    };

    const startRiverObserver = () => {
        inlineLanzhouRiver().then(done => {
            if (done) return;
            const observer = new MutationObserver(async () => {
                if (await inlineLanzhouRiver()) observer.disconnect();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startRiverObserver, { once: true });
    } else {
        startRiverObserver();
    }
}

if (typeof window !== "undefined") {
    window.SCATTERED_DATA = SCATTERED_DATA;
}
