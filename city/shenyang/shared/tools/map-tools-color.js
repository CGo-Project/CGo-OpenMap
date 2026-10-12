/**
 * CGo OpenMap - 地图小工具：颜色与主题墨色（共享层）
 *
 * 对外接口（window.CGoMapToolsColor）：
 *   hexToRgb(hex)         → [r, g, b]（#rrggbb）
 *   parseRgb(text)        → [r, g, b] | null，认 #rgb / #rrggbb / rgb() / rgba()
 *   themeInk()            → { bg, fg }，主题的 --map-bg / --text-main 实际值（canvas 读不到 CSS 变量）
 *   shadeColor(rgb, k)    → 向白提亮（k > 0）／向黑压暗（k < 0）
 *   scaleColor(scale, t)  → 在色标锚点之间分段线性插值（t ∈ [0,1]）
 *
 * 从 tools/map-tools.js 的「色标」章节抽出：**纯函数、不依赖任何模块级状态**，是拆巨石的第 1 步。
 * 载入时机：须早于 map-tools.js —— 后者在「色标」位置以别名解构引用本模块（见那里的注释）。
 *
 * @event 无（纯函数集合，不发事件、不碰 DOM，除 themeInk 读一次计算样式）
 */
(function () {
    "use strict";

    const hexToRgb = (hex) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];

    /** 解析 CSS 颜色的常见写法（#rgb / #rrggbb / rgb() / rgba()）成 RGB 三元组 */
    function parseRgb(text) {
        const value = String(text || "").trim();
        const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
        if (hex) {
            const body = hex[1].length === 3 ? hex[1].replace(/./g, (ch) => ch + ch) : hex[1];
            return [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16));
        }
        const fn = /^rgba?\(([^)]+)\)$/i.exec(value);
        if (!fn) return null;
        const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number).filter(Number.isFinite);
        return parts.length >= 3 ? parts.slice(0, 3).map((n) => Math.round(n)) : null;
    }

    /**
     * 主题里的地图背景色与文本色。
     * 等级线改成「粗的背景色描边 + 细的文本色内芯」之后，这两色必须拿到实际值才能在
     * canvas 上落笔（canvas 读不到 CSS 变量）。每次建图都重读一遍，换主题后才跟着变。
     */
    function themeInk() {
        const style = getComputedStyle(document.documentElement);
        return {
            bg: parseRgb(style.getPropertyValue("--map-bg")) || [255, 255, 255],
            fg: parseRgb(style.getPropertyValue("--text-main")) || [0, 38, 59]
        };
    }

    /**
     * 明暗偏移：amount > 0 向白提亮、< 0 向黑压暗（取 0 即原色）。
     * 用于「同色系内分档」—— 等时圈每两条等级线之间是一组，组内几档只靠明暗拉开，
     * 色系保持一致，离散的色表因此不必塞进几十个色。
     */
    const shadeColor = (rgb, amount) => {
        const target = amount >= 0 ? 255 : 0;
        const k = Math.min(1, Math.abs(amount));
        return rgb.map((c) => Math.round(c + (target - c) * k));
    };

    /** 在色标锚点之间分段线性插值：t ∈ [0,1] */
    function scaleColor(scale, t) {
        const stops = scale.map(hexToRgb);
        const pos = Math.max(0, Math.min(1, t)) * (stops.length - 1);
        const i = Math.min(stops.length - 2, Math.floor(pos));
        const f = pos - i;
        const a = stops[i], b = stops[i + 1];
        return [
            Math.round(a[0] + (b[0] - a[0]) * f),
            Math.round(a[1] + (b[1] - a[1]) * f),
            Math.round(a[2] + (b[2] - a[2]) * f)
        ];
    }

    window.CGoMapToolsColor = { hexToRgb, parseRgb, themeInk, shadeColor, scaleColor };
})();
