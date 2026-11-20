/**
 * CGo OpenMap - 共享层：把一块 DOM「海报」栅格化成 canvas（通用基建）
 * (shared/base/poster.js)
 *
 * 用途：车站卡 / 行程卡这类**一次性成像**的海报——尺寸固定、无相机、无逐帧。
 *
 * 与沿革视频导出那份（`tools/opening-history.export.js` 的 `paintFrame`）**仍是两份**：
 * 那份耦合了相机矩阵、逐帧背压、站名 canvas 缓存、机场徽标重着色与主题切换，是为视频服务的；
 * 这里只做「克隆 → 内联自定义属性与样式表 → 组 foreignObject → 栅格化」这一小段。
 * **两边真正重合的部分（`sanitizeXml` / `imgFromData` / 同源样式表收集 / 搬 `--变量` /
 * CDATA 转义 / base64）已抽到同目录的 `base/svg-raster.js`（`window.CGoSvgRaster`）**，
 * 本文件与沿革导出各自引用它，不再各写一遍。
 * ⚠️ 故本文件**依赖 `base/svg-raster.js`**，后者必须更早加载（各城 `{city}.js` 已排好）。
 *
 * ⚠️ 海报 DOM 里**不能用 `<cgo-icon>`**：它是 shadow DOM 组件（Lit + attachShadow），
 *    `cloneNode` 拿不到影子里那棵 svg，进 foreignObject 会渲染成**空白**（沿革导出当年
 *    就是这么踩的，它改为把图标预加载成图片再 drawImage）。海报要用的图形一律**内联
 *    `<svg>`**（线路徽标本就是 core 的 `.svg-icon-placeholder` + 内联 SVG 这一套）；
 *    位图（如 `assets/icons/mapicon.png`）由本模块抓成 data URL 内联。
 *
 * 对外接口：window.CGoPoster = { render, loadCss, toDataUrl }。
 * 无样式表；脚本存在即生效。
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    // 公共栅格化零件（同目录 svg-raster.js）——硬依赖，须更早加载
    const RASTER = window.CGoSvgRaster;
    if (!RASTER) {
        console.warn("[CGoPoster] 缺少共享层 base/svg-raster.js（须早于本文件加载），海报栅格化不可用");
        return;
    }

    /** 图片内联缓存：src → Promise<data URL|null>（海报反复打开不必重复抓） */
    const imgCache = new Map();
    /** 同源样式表规则文本缓存 */
    let cssCache = null;

    /**
     * 收集页面里**同源**样式表的规则文本（在公共件上再套一层缓存：海报会反复取用）。
     */
    function loadCss() {
        if (cssCache != null) return cssCache;
        cssCache = RASTER.collectCss();
        return cssCache;
    }

    /**
     * 把资源抓成 data URL。外域默认**不抓**（抓了只会污染 canvas，让 toBlob/toDataURL 抛
     * SecurityError —— 车站卡里那张高德瓦片就是这种）；但 `opts.crossOrigin` 为例外：
     * webfont 常放在带 CORS 头的 CDN（Google Fonts / fonts.loli.net），而字体不进画布像素、
     * 不会污染，故允许按跨域抓取。对方没给 CORS 头时 fetch 会失败 → 退回系统字体。
     */
    function toDataUrl(src, opts) {
        if (!src) return null;      // 空/未定义一律不抓：`new URL(undefined, …)` 会拼出 `<origin>/undefined` 白跑一趟
        const key = (opts && opts.crossOrigin ? "x:" : "s:") + src;
        if (imgCache.has(key)) return imgCache.get(key);
        let url;
        try { url = new URL(src, document.baseURI); } catch (err) { return null; }
        if (!(opts && opts.crossOrigin) && url.origin !== location.origin) {
            imgCache.set(key, Promise.resolve(null));
            return null;
        }
        const task = fetch(url.href)
            .then((res) => (res.ok ? res.blob() : null))
            .then((blob) => new Promise((resolve) => {
                if (!blob) return resolve(null);
                const reader = new FileReader();
                reader.onload = () => { imgCache.set(key, Promise.resolve(reader.result)); resolve(reader.result); };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            }))
            .catch(() => null);
        imgCache.set(key, task);      // 先占位：并发调用只抓一次
        return task;
    }

    /* ── webfont 内联 ──────────────────────────────────────────────
       SVG 以 <img> 载入后是一个**独立文档**：外部资源一律不加载，`@import` / 字体链接
       全部失效 —— 页面上的 Arimo / Noto Sans SC 都不会生效，文字退回系统字体。后果有两层：
       ① 观感与页面不一致；② 回退字体的行高更小，卡片栅格化后比量高时矮一截，
       导出图底部就多出一条**透明（在深色底上看着是黑边）的空白带**。故必须把字体内联进去。
       Noto Sans SC 被 Google 拆成上百个 unicode-range 分片，全量内联要好几 MB，
       这里按「卡片上真出现过的字符」筛，通常只剩几片。 */

    const FONT_FACE_RE = /@font-face\s*\{([^}]*)\}/gi;

    /** 从一段 CSS 文本里抽出所有 @font-face 声明 */
    function parseFontFaces(cssText, baseHref) {
        const out = [];
        if (!cssText) return out;
        FONT_FACE_RE.lastIndex = 0;
        let m;
        while ((m = FONT_FACE_RE.exec(cssText))) {
            const body = m[1];
            const family = /font-family\s*:\s*([^;}]+)/i.exec(body);
            const src = /src\s*:\s*([^;}]+)/i.exec(body);
            const urlMatch = src && /url\(\s*["']?([^"')]+)["']?\s*\)/i.exec(src[1]);
            if (!family || !urlMatch) continue;      // 只有 local() 没有 url() 的跳过
            let href;
            try { href = new URL(urlMatch[1].trim(), baseHref).href; } catch (err) { continue; }
            const format = /format\(\s*["']?([^"')]+)["']?\s*\)/i.exec(src[1]);
            out.push({
                family: family[1].trim(),
                weight: (/font-weight\s*:\s*([^;}]+)/i.exec(body) || [, "400"])[1].trim(),
                style: (/font-style\s*:\s*([^;}]+)/i.exec(body) || [, "normal"])[1].trim(),
                range: (/unicode-range\s*:\s*([^;}]+)/i.exec(body) || [, ""])[1].trim(),
                url: href,
                format: format ? format[1].trim() : ""
            });
        }
        return out;
    }

    /** 页面里所有 @font-face：同源样式表直读 cssRules；跨域表读不到，按 <link> href 另取一份 CSS */
    async function collectFontFaces() {
        const faces = [];
        const crossHrefs = [];
        for (const sheet of Array.from(document.styleSheets)) {
            try {
                faces.push(...parseFontFaces(Array.from(sheet.cssRules).map((r) => r.cssText).join("\n"),
                    sheet.href || document.baseURI));
            } catch (err) {
                if (sheet.href) crossHrefs.push(sheet.href);
            }
        }
        await Promise.all(crossHrefs.map(async (href) => {
            try {
                const res = await fetch(href);
                if (res.ok) faces.push(...parseFontFaces(await res.text(), href));
            } catch (err) { /* 取不到就只能退回系统字体 */ }
        }));
        return faces;
    }

    /** 子树里出现过的所有字符（含 SVG <text> 的文本节点） */
    function textCharsOf(root) {
        const set = new Set();
        const walk = (node) => {
            if (node.nodeType === 3) {
                for (const ch of node.nodeValue || "") set.add(ch);
                return;
            }
            if (node.nodeType !== 1) return;
            for (const child of node.childNodes) walk(child);
        };
        walk(root);
        return set;
    }

    /** 该分片的 unicode-range 是否覆盖卡片上的任一字符（没写 unicode-range 视为全都要） */
    function rangeHits(range, chars) {
        if (!range) return true;
        if (!chars.size) return false;
        for (const part of String(range).split(",")) {
            const m = /^\s*U\+([0-9A-Fa-f?]{1,6})(?:-([0-9A-Fa-f]{1,6}))?\s*$/.exec(part);
            if (!m) continue;
            const lo = parseInt(m[1].replace(/\?/g, "0"), 16);
            const hi = m[2] ? parseInt(m[2], 16) : parseInt(m[1].replace(/\?/g, "F"), 16);
            for (const ch of chars) {
                const cp = ch.codePointAt(0);
                if (cp >= lo && cp <= hi) return true;
            }
        }
        return false;
    }

    /** 产出需要内联的 @font-face 规则文本（可能为空：字体取不到时静默退回系统字体） */
    async function inlineFonts(root) {
        const faces = await collectFontFaces();
        if (!faces.length) return "";
        const chars = textCharsOf(root);
        // 按**文件**归组再落声明：同一份文件常被多个字重共用 —— Google Fonts（及其镜像）对
        // 「多字重请求」返回的正是**一份可变字体**，400/500/700 三条声明指向同一个 URL。
        // 逐条声明会把这串 data URL 重复三遍（Noto 一片就上百 KB），归组后写成一个字重区间
        // `font-weight: 400 700`，语义与页面完全一致（可变字体按请求到的字重取实例）。
        const groups = new Map();
        for (const face of faces) {
            if (!rangeHits(face.range, chars)) continue;
            let group = groups.get(face.url);
            if (!group) {
                group = { url: face.url, family: face.family, style: face.style, format: face.format, weights: [], ranges: [] };
                groups.set(face.url, group);
            }
            if (!group.weights.includes(face.weight)) group.weights.push(face.weight);
            if (face.range && !group.ranges.includes(face.range)) group.ranges.push(face.range);
        }
        const rules = await Promise.all(Array.from(groups.values()).map(async (group) => {
            const data = await toDataUrl(group.url, { crossOrigin: true });
            if (!data) return "";
            const nums = group.weights.map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
            const weight = nums.length > 1 ? nums[0] + " " + nums[nums.length - 1] : (group.weights[0] || "400");
            // data URL 里含 `;`，src 必须加引号，否则 CSS 词法会把声明提前截断
            return "@font-face{font-family:" + group.family + ";font-style:" + group.style
                + ";font-weight:" + weight + ';src:url("' + data + '")'
                + (group.format ? " format(" + group.format + ")" : "")
                + (group.ranges.length ? ";unicode-range:" + group.ranges.join(",") : "") + ";}";
        }));
        return rules.filter(Boolean).join("\n");
    }

    /** 把克隆里所有相对引用的位图换成 data URL；抓不到就摘掉，免得留下破图 */
    async function inlineImages(root) {
        const nodes = Array.from(root.querySelectorAll("img, image"));
        await Promise.all(nodes.map(async (el) => {
            const src = el.getAttribute("src") || el.getAttribute("xlink:href") || el.getAttribute("href");
            if (!src || src.indexOf("data:") === 0) return;
            const data = await toDataUrl(src);
            if (!data) { el.remove(); return; }
            if (el.hasAttribute("src")) el.setAttribute("src", data);
            if (el.hasAttribute("xlink:href")) el.setAttribute("xlink:href", data);
            if (el.hasAttribute("href")) el.setAttribute("href", data);
        }));
    }

    /**
     * 把一块已挂在文档里的 DOM 栅格化成 canvas。
     * @param {HTMLElement} el 海报根节点（须**已挂进文档**，否则量不到尺寸）
     * @param {Object} [opts]
     * @param {number} [opts.width]     输出宽度（px）；默认取 el 的布局宽度
     * @param {number} [opts.scale=2]   像素倍率（2 = 二倍图，够清晰又不至于爆内存）
     * @param {string} [opts.background] 底色；不传则透明（海报自身通常自带底色）
     * @param {boolean} [opts.fonts=true] 是否先等 document.fonts 就绪（不等会用回退字体）
     * @param {number} [opts.heightPad=0] 量高后再多留这么多 px 的余量（配合 `trim()` 用）
     * @returns {Promise<HTMLCanvasElement>}
     */
    async function render(el, opts) {
        const o = opts || {};
        if (o.fonts !== false && document.fonts && document.fonts.ready) {
            try { await document.fonts.ready; } catch (err) { /* 忽略：字体等待失败不该挡住出图 */ }
        }
        const W = Math.round(o.width || el.getBoundingClientRect().width);
        // 高度量准的前提是「栅格化时的字体 = 量高时的字体」。字体内联失败时（CDN 不给 CORS /
        // 离线）回退字体的行高与页面字体不同，卡片会比量出来**更矮或更高**：矮了是空白带、
        // 高了会被裁掉一截。故给出 `heightPad` 余量 + 出图后 `trim()` 双向兜住。
        const H = Math.round(el.getBoundingClientRect().height + (Number(o.heightPad) || 0));
        if (!(W > 0 && H > 0)) throw new Error("海报尺寸为 0：海报须先挂进文档并可见");

        const clone = el.cloneNode(true);
        clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        clone.style.setProperty("margin", "0");
        // foreignObject 里没有 :root —— 自定义属性逐个搬到克隆根上，否则海报全丢主题色
        RASTER.applyRootVars(clone);
        await inlineImages(clone);

        const xml = new XMLSerializer().serializeToString(clone);
        const buildSvg = (fontCss) =>
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">'
            + '<foreignObject width="' + W + '" height="' + H + '">'
            + '<style><![CDATA[' + RASTER.cdata(fontCss) + "\n" + RASTER.cdata(loadCss()) + ']]></style>'
            + xml + '</foreignObject></svg>';

        // 页面的 webfont 必须内联（SVG 图片文档取不到它们，见 inlineFonts 上面的说明），
        // 排在页面 CSS 之前：@font-face 与其它规则不冲突，先声明后引用更符合直觉。
        const fontCss = await inlineFonts(clone);
        // ⚠️ 兜底：字体**没内联上**时（CDN 不给 CORS / 离线 / 分片没捞到），海报里的
        // webfont 引用就成了**指向不存在字体的字体名**。浏览器会直接回落到该字体的
        // font-family 兜底 —— 若海报根写的是 `font-family: inherit`，那份 inherit 在
        // foreignObject 里只会继承到它默认的 **serif**，导出图就与页面的无衬线观感割裂。
        // 故这里**显式删掉**海报根的 font-family：让 CSS 栈里末位的 `sans-serif` 生效，
        // 与「照 style.css 栈写死的兜底」两头对齐 —— 不管 webfont 有没有捞到，都是无衬线。
        // （成功时本函数已把 @font-face 内联进 SVG，海报根的这行声明本就会被 CSS 覆盖。）
        if (!fontCss) clone.style.removeProperty("font-family");
        const decode = (svgText) => RASTER.imgFromData(svgText, () => "海报栅格化失败：SVG 数据无法解码");
        let img;
        try {
            img = await decode(RASTER.sanitizeXml(buildSvg(fontCss)));
        } catch (err) {
            // 兜底：字体内联把 SVG 撑得过大、或某个字体文件解不开时，宁可**少字体也别出不了图**
            if (!fontCss) throw err;
            console.warn("[CGoPoster] 带内联字体的 SVG 无法解码，退回不带 webfont 出图", err);
            // 退化时要与上面 `!fontCss` 分支同一步调：删掉根上的 font-family，
            // 让 CSS 栈末位的 sans-serif 兜底（否则 foreignObject 默认 serif 会接管，字形突变）
            clone.style.removeProperty("font-family");
            img = await decode(RASTER.sanitizeXml(buildSvg("")));
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(W * (o.scale || 2));
        canvas.height = Math.round(H * (o.scale || 2));
        const ctx = canvas.getContext("2d");
        if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    /**
     * 裁掉四周全透明的空白，返回新的 canvas（没有可裁的就原样返回）。
     *
     * 为什么需要：导出图的背面是一条**透明空白带**（在深色聊天窗里看着就是黑边）。它来自
     * 「量高时的字体 ≠ 栅格化时的字体」—— 页面用 webfont，SVG 图片文档里若字体没内联上，
     * 行高更小、卡片实际矮一截，多出来的那截就是透明底。字体内联（见 inlineFonts）能治本，
     * 这里再兜一道：卡片自身底色不透明，按 alpha 裁边不会切到内容。
     */
    function trim(canvas) {
        const { width, height } = canvas;
        const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
        let top = -1, bottom = -1, left = width, right = -1;
        for (let y = 0; y < height; y += 1) {
            const row = y * width;
            for (let x = 0; x < width; x += 1) {
                if (data[(row + x) * 4 + 3] <= 4) continue;
                if (top < 0) top = y;
                bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
        if (top < 0 || (left === 0 && right === width - 1 && top === 0 && bottom === height - 1)) return canvas;
        const out = document.createElement("canvas");
        out.width = right - left + 1;
        out.height = bottom - top + 1;
        out.getContext("2d").drawImage(canvas, left, top, out.width, out.height, 0, 0, out.width, out.height);
        return out;
    }

    window.CGoPoster = { render, trim, loadCss, toDataUrl, inlineImages };
}());
