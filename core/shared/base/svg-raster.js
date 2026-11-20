/**
 * CGo OpenMap - 共享层：SVG 栅格化的公共零件（city/shenyang/shared/base/svg-raster.js）
 *
 * 服务两处「DOM / SVG → canvas」的成像：
 *   · 一次性成像的海报：`base/poster.js`（车站卡 / 行程卡分享出图）；
 *   · 逐帧成像的视频：`tools/opening-history.export.js`（沿革「导出视频」）。
 * 二者其余部分**依然各自保留**——海报的 webfont 内联 / 裁边（`inlineFonts` / `trim`）、
 * 视频的相机矩阵 / 逐帧背压 / 进度卡 / 诊断上报，都不属于公共件。这里只收敛两边
 * 真正重合的那几段，避免同一份逻辑各写一遍、长期漂移。
 *
 * 对外接口：window.CGoSvgRaster = {
 *     sanitizeXml(str, onBad?)  剔除 XML 非法字符（可选回调交调用方上报诊断）
 *     imgFromData(svgText, errFactory?)  SVG 文本 → 已解码的 <img>（走 base64）
 *     collectCss()              收集页面**同源**样式表的规则文本
 *     applyRootVars(el)         把 documentElement / body 上的 --变量 搬到 el 上
 *     cdata(text)               转义 CDATA 内文本（`]]>` 会提前闭合）
 *     bytesToBase64(bytes)      Uint8Array → base64
 *     stringToBase64(str)       文本（UTF-8）→ base64
 * }
 *
 * ⚠️ 加载顺序：本文件必须**早于** `base/poster.js` 与 `tools/opening-history.export.js`
 *    （各城 `{city}.js` 已按此排好）。二者都把它当**硬依赖**——这是「公共件放共享层」
 *    这一决定的前提，故随功能整批提交、不单独分拆。
 * 无样式表；脚本存在即生效。
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    /**
     * XML 1.0 里**不允许出现**的字符：控制符（除 \t \n \r）、孤立代理项、U+FFFE / U+FFFF。
     * HTML 解析对它们照收不误，但把同一棵 DOM 序列化成 SVG 再交给 XML 解析器就整份失败
     * （实测症状：`invalid attribute value`，指到克隆根节点的 style 属性里）。
     * ⚠️ 正则**不加** `u` 标志：要按 UTF-16 码元匹配，才能抓到孤立代理项。
     */
    const XML_BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g;

    /**
     * 剔掉 XML 不允许的字符。
     * @param {string} str
     * @param {(bad: string[]) => void} [onBad] 命中非法字符时回调（调用方据此上报诊断；
     *        不传则静默剔除）
     * @returns {string}
     */
    function sanitizeXml(str, onBad) {
        const bad = str.match(XML_BAD_CHARS);
        if (!bad) return str;
        if (onBad) onBad(bad);
        return str.replace(XML_BAD_CHARS, "");
    }

    /** Uint8Array → base64（分块拼接：一次性 apply 到超长数组会因参数过多爆栈） */
    function bytesToBase64(bytes) {
        let bin = "";
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
        }
        return btoa(bin);
    }

    /** 文本（UTF-8）→ base64。中文 / 字体走 base64 比 `encodeURIComponent` 小得多 */
    function stringToBase64(str) {
        return bytesToBase64(new TextEncoder().encode(str));
    }

    /**
     * SVG 文本 → 已解码的 Image（`decoded ≠ painted`，调用方需自行留出绘制等待）。
     * @param {string} svgText
     * @param {(svgText: string) => string} [errFactory] 自定义错误文案（调用方据此附诊断）
     * @returns {Promise<HTMLImageElement>}
     */
    function imgFromData(svgText, errFactory) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            // <img> 的 onerror 不给任何细节，故允许调用方传自定义文案（如带 DOMParser 复核的版本）
            img.onerror = () => reject(new Error(errFactory ? errFactory(svgText) : "SVG 数据无法解码"));
            img.src = "data:image/svg+xml;base64," + stringToBase64(svgText);
        });
    }

    /**
     * 收集页面里**同源**样式表的规则文本。
     * 跨域样式表读 cssRules 会抛（CORS），跳过即可——本项目的样式表都是同源的。
     * 不缓存：调用方按各自的生命周期决定是否复用（海报逐次取用会自行缓存，导出每轮只取一次）。
     */
    function collectCss() {
        const out = [];
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                out.push(Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n"));
            } catch (err) { /* 跨域样式表：跳过 */ }
        }
        return out.join("\n");
    }

    /**
     * 把 `documentElement` / `body` 上的自定义属性（`--*`）逐个搬到 `el` 上。
     * `foreignObject` 里没有 `:root`，不搬则栅格化出来的图全丢主题色。
     */
    function applyRootVars(el) {
        [document.documentElement, document.body].forEach((src) => {
            const cs = getComputedStyle(src);
            for (let i = 0; i < cs.length; i++) {
                const name = cs[i];
                if (name.slice(0, 2) === "--") el.style.setProperty(name, cs.getPropertyValue(name));
            }
        });
    }

    /** 内联 CSS 走 CDATA：文本里出现 `]]>` 会提前闭合、把后面的标签名当文本，整份 SVG 解析失败 */
    function cdata(text) {
        return String(text).replace(/]]>/g, "]]]]><![CDATA[>");
    }

    window.CGoSvgRaster = {
        sanitizeXml: sanitizeXml,
        imgFromData: imgFromData,
        collectCss: collectCss,
        applyRootVars: applyRootVars,
        cdata: cdata,
        bytesToBase64: bytesToBase64,
        stringToBase64: stringToBase64
    };
}());
