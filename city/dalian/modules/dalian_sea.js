/**
 * CGo OpenMap - 大连海域底图主题适配
 *
 * 海域按项目规范登记在 data_scattered.js（散点装饰层，引擎以 <img> 引用）。
 * 但 <img> 处于独立文档，拿不到页面 CSS 变量；这里照青岛的做法，在它出现后换成 inline SVG，
 * 再用 --dalian-sea-color 驱动填充，手动切换深浅主题时才会跟着变色。
 * 取色：亮色沿用原图填充色 #40B5FF，暗色取同色相的深蓝。
 */
(function () {
    const STYLE_ID = "dalian-sea-theme-style";
    const INLINE_CLASS = "dalian-sea-inline";
    const ASSET_NAME = "dalian_sea.svg";

    function installThemeStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            :root { --dalian-sea-color: #40B5FF; }
            html[data-theme="light"] { --dalian-sea-color: #40B5FF; }
            html[data-theme="dark"] { --dalian-sea-color: #17323b; }
            @media (prefers-color-scheme: dark) {
                html:not([data-theme]) { --dalian-sea-color: #17323b; }
            }
            #scattered-layer .${INLINE_CLASS} {
                width: 100%;
                height: 100%;
                display: block;
                color: var(--dalian-sea-color);
                pointer-events: none;
            }
            #scattered-layer .${INLINE_CLASS} path,
            #scattered-layer .${INLINE_CLASS} polygon,
            #scattered-layer .${INLINE_CLASS} rect,
            #scattered-layer .${INLINE_CLASS} circle,
            #scattered-layer .${INLINE_CLASS} ellipse {
                fill: var(--dalian-sea-color) !important;
            }
        `;
        document.head.appendChild(style);
    }

    async function inlineSea() {
        const img = document.querySelector(`#scattered-layer img[src*="${ASSET_NAME}"]`);
        if (!img || img.dataset.dalianInlining === "1") return false;
        img.dataset.dalianInlining = "1";
        try {
            const response = await fetch(img.src);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const parsed = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
            const source = parsed.documentElement;
            if (!source || source.nodeName.toLowerCase() !== "svg") throw new Error("Invalid SVG");
            const svg = document.importNode(source, true);
            svg.classList.add(INLINE_CLASS);
            svg.setAttribute("aria-hidden", "true");
            // 与原地理图层一致：拉伸铺满画布，不按比例留边
            svg.setAttribute("preserveAspectRatio", "none");
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            img.replaceWith(svg);
            return true;
        } catch (error) {
            // 保留原 <img> 作为降级：它自身仍跟随系统深浅色，只是不参与手动主题切换
            img.removeAttribute("data-dalian-inlining");
            console.warn("[Dalian] 海域 SVG 内联失败:", error);
            return false;
        }
    }

    function start() {
        installThemeStyle();
        inlineSea().then((done) => {
            if (done) return;
            const observer = new MutationObserver(async () => {
                if (await inlineSea()) observer.disconnect();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
