/**
 * CGo OpenMap - 呼和浩特车站信息板紧凑线路徽标模块
 * (city/hohhot/modules/hohhot_station_board.js)
 *
 * 机制照沈阳 city/shenyang/modules/shenyang_station_board.js：
 *  - 把车站信息板 .panel-badges、车站选择器、换乘链接、搜索结果 / 行程规划候选项、
 *    线路悬停提示里的线路徽标，统一重画为「本城紧凑徽标」；
 *  - 同一行内多条线路合并为一枚徽标（合并结果记在徽标自身的 data-hohhot-badge 上，
 *    重画时优先读它，不会把已合并的徽标打回单线）；
 *  - MutationObserver + requestAnimationFrame 跟随信息板的重渲染。
 *
 * 与沈阳不同的「徽标形态」（本城口径）：
 *  - 编号由圆形改为**微圆角方标**（设计圆角 5、白色描边 1.75），底色取本线 color；
 *  - 右侧文字由一行改为三行（自上而下）：中文「号线」/ 蒙文（线路 mn 字段）/ 英文「Line」，
 *    三行等高（每行 10 个设计单位），与方标一起竖直居中；
 *  - 文字描述一律取 var(--text-color)，不写死颜色。
 *
 * ── 蒙文行的渲染方案（重点）──────────────────────────────────────────────
 * 规则来源：站名蒙文见 modules/hohhot_mongolian.js 与 style.css 文件头 ——
 * 胡都木文竖排（writing-mode: vertical-lr，块方向自左向右、行内方向自上而下），
 * 字体栈 "Mongolian Baiti" → "Noto Sans Mongolian" → "Menksoft Qagan" → "Daicing Xiaokai"。
 *
 * 最终方案：**方标用内联 SVG，三行文字用 HTML/CSS**（不把整枚徽标做成一张 SVG）。
 * 「SVG <text> 做不到竖排朝向、故降级」的依据：
 *  1. SVG <text> 没有盒模型：既无法给蒙文行指定一个「与中文行等高的固定高度」，
 *     也无法让超长的蒙文词按列换行 / 压缩收进该高度 —— 本城蒙文是「序数词 + ᠮᠥᠷ」的
 *     完整词组（如 ᠨᠢᠭᠡᠳᠦᠭᠡᠷ ᠮᠥᠷ），比一行「号线」长得多，写成单个 <text> 必然
 *     顺着行内轴溢出到下面两行；
 *  2. 浏览器对 SVG <text> 上 writing-mode 竖排的支持并不一致，且蒙文连写依赖字体的
 *     竖排 metrics，无法像 HTML 那样直接复用站名蒙文那套已验证的字体栈与换列策略；
 *  3. HTML/CSS 可以直接复用与站名蒙文完全相同的规则（vertical-lr + 同一字体栈 + 固定行高），
 *     并用与 hohhot_mongolian.js 的 fitVertical 同口径的「量高 → scaleY 压缩」把过长的
 *     词收进行高内，从而兑现「其高度与中文那行等高」这一要求。
 * 因此本模块把三行文字做成 HTML，方标仍为内联 SVG（与本城 assets/line-1.svg 同一观感）。
 * ⚠️ 已知降级点：为了与「号线」行等高（10 设计单位），蒙文词组会被 scaleY 明显压缩，
 *    在 32px 级别的徽标里辨识度有限；是否放大徽标、或改用其它蒙文排版，
 *    留待主理人复核（交付汇报中已单列）。
 *
 * ── 有意「不搬」的沈阳逻辑（本城无对应场景）──────────────────────────────
 *  - 方城标识（FANGCHENG_*）：沈阳专属地标装饰，本城无用例；
 *  - 有轨电车矩形徽标与 LINE_BADGE_OVERRIDES（沈阳 10 号线的压缩覆盖）：本城只有
 *    1、2 号线，没有有轨电车、没有需要单独覆盖的线路；
 *  - 题字 header 的近色反色（headerTint / colorsClose / ShenyangUi）：本城没有题字染色
 *    header，反色无意义；
 *  - 同名站点击处理（installSameNameStationClickHandler）：属沈阳线网的站名/虚拟换乘
 *    场景，与线路徽标无关。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const SVG_NS = "http://www.w3.org/2000/svg";

    /**
     * 徽标设计参数（单位＝设计 px，与 style.css 里 .hohhot-line-badge-* 的数值一一对应）。
     * 面板里 1 个设计单位 ≈ 1px；选择器（22px 槽）与搜索结果（25px 槽）通过
     * --hht-badge-u 整体等比缩小，故这里只描述「面板尺寸」这一基准。
     */
    const CONFIG = {
        squareSize: 24,             // 方标边长
        squareGap: 2,               // 合并后各方标之间的间距
        cornerRadius: 3,            // 微圆角半径
        strokeWidth: 1.2,           // 白色描边宽度
        numberFontSize: 17,         // 单位数编号字号
        twoDigitNumberFontSize: 13, // 两位数编号字号（本城暂无，留作通用兜底）
        rowHeight: 10,              // 三行文字每行的行高（＝蒙文行的固定高度）
        cnFontSize: 10,             // 中文「号线」字号
        mnFontSize: 10,             // 蒙文字号（与站名 .hohhot-mn 一致）
        enFontSize: 7.5,            // 英文「Line」字号
        labelGap: 4                 // 方标与文字块之间的间距
    };

    /**
     * 徽标内西文（编号 / Line）字体栈：与沈阳同口径，把系统 Arial/Helvetica 排在
     * cgo-ui 的 --font-en（Arimo）之前 —— Arimo 数字偏窄小，放进方标不够饱满。
     */
    const BADGE_EN_FONT = "Arial, Helvetica, var(--font-en, Arimo, sans-serif)";

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    function getLinesData() {
        if (Array.isArray(window.linesData)) return window.linesData;
        if (typeof linesData !== "undefined" && Array.isArray(linesData)) return linesData;
        return [];
    }

    function getLineNumber(line) {
        const match = String(line?.name || "").match(/(\d+)号线$/);
        return match ? match[1] : null;
    }

    /** 取路径的文件名（去 query、取最后一段），如 ./city/hohhot/assets/line-1.svg → line-1.svg */
    function baseName(path) {
        return String(path || "").split("?")[0].split("/").pop();
    }

    /**
     * 由徽标反查线路。
     * 本城 line.svg 是带路径的（./city/hohhot/assets/line-1.svg），因此按**文件名**比对；
     * 若文件名对不上，再从 line-N.svg 里的 N 按「N 号线」兜底匹配。
     */
    function getLineForBadge(badge) {
        const sourceFile = baseName(badge?.dataset?.src);
        if (!sourceFile) return null;
        const lineList = getLinesData();

        const byFile = lineList.find((line) => baseName(line.svg) === sourceFile);
        if (byFile) return byFile;

        const sourceNumber = sourceFile.match(/^line-(\d+)\.svg$/i)?.[1];
        if (sourceNumber) {
            return lineList.find((line) => getLineNumber(line) === String(Number(sourceNumber))) || null;
        }
        return null;
    }

    /** 解析 #RRGGBB / rgb() 为 [r, g, b]（0-255），无法解析返回 null */
    function parseColorChannels(color) {
        const raw = String(color || "").trim();
        const hex = raw.match(/^#([0-9a-f]{6})$/i);
        const rgb = raw.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
        if (hex) {
            const value = hex[1];
            return [
                parseInt(value.slice(0, 2), 16),
                parseInt(value.slice(2, 4), 16),
                parseInt(value.slice(4, 6), 16)
            ];
        }
        if (rgb) return rgb.slice(1, 4).map(Number);
        return null;
    }

    /** 方标底色上可读的编号颜色（白或品牌深蓝），沿用沈阳的亮度判定口径 */
    function getReadableTextColor(color) {
        const channels = parseColorChannels(color);
        if (!channels) return "#ffffff";
        const [red, green, blue] = channels.map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.04045
                ? normalized / 12.92
                : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        return luminance > 0.34 ? "#00263b" : "#ffffff";
    }

    /** 优先读徽标自身记下的合并线路 ID；没有则按 data-src 反查单条线路 */
    function getBadgeLines(badge) {
        const lineList = getLinesData();
        const mergedIds = String(badge?.dataset?.hohhotBadge || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        if (mergedIds.length > 0) {
            const mergedLines = mergedIds.map((id) => lineList.find((line) => line.id === id));
            return mergedLines.every(Boolean) ? mergedLines : null;
        }
        const line = getLineForBadge(badge);
        return line ? [line] : null;
    }

    /**
     * 生成紧凑徽标的 HTML：编号方标为内联 SVG，右侧三行文字为 HTML。
     * 蒙文取线路的 mn 字段；**并列（合并）徽标改用不带序数词的 ᠮᠥᠷ** ——
     * 两枚方标旁只留一个「线」，否则「第一线 / 第二线」并置既与方标数字重复表述、
     * 竖排占位也翻倍。
     */
    function createCompactBadgeMarkup(lines) {
        const entries = lines.map((line) => ({ line, number: getLineNumber(line) }));
        if (!entries.length || entries.some((entry) => !entry.number)) return null;

        const { squareSize, cornerRadius, strokeWidth } = CONFIG;
        const half = strokeWidth / 2;
        const side = squareSize - strokeWidth;

        const squares = entries.map(({ line, number }) => {
            const fontSize = number.length > 1 ? CONFIG.twoDigitNumberFontSize : CONFIG.numberFontSize;
            const numberFill = getReadableTextColor(line.color);
            return `<svg class="hohhot-line-badge-square" viewBox="0 0 ${squareSize} ${squareSize}" aria-hidden="true" focusable="false" xmlns="${SVG_NS}">`
                + `<rect x="${half}" y="${half}" width="${side}" height="${side}" rx="${cornerRadius}" ry="${cornerRadius}"`
                + ` fill="${escapeHtml(line.color || "#00263b")}" stroke="#ffffff" stroke-width="${strokeWidth}" />`
                + `<text x="${squareSize / 2}" y="${squareSize / 2}" text-anchor="middle" dominant-baseline="central"`
                + ` fill="${numberFill}" font-family="${BADGE_EN_FONT}" font-size="${fontSize}">${number}</text>`
                + `</svg>`;
        }).join("");

        // 单线：带序数词的完整站名式写法（第一线 / 第二线）；并列：只留「线」
        const mnText = lines.length > 1
            ? "ᠮᠥᠷ"
            : String(lines[0]?.mn || "").trim();

        return `<span class="hohhot-line-badge-squares">${squares}</span>`
            + `<span class="hohhot-line-badge-labels">`
            + `<span class="hohhot-line-badge-cn">号线</span>`
            + `<span class="hohhot-line-badge-mn" lang="mn-Mong">${escapeHtml(mnText)}</span>`
            + `<span class="hohhot-line-badge-en">Line</span>`
            + `</span>`;
    }

    /**
     * 量「可见字高」：竖排下 Range 的每个矩形即一列，取其中最大高度。
     * 元素带 transform 时量到的是缩放后的视觉高度（被下面的收敛循环利用）。
     */
    function measureInkHeight(el) {
        let need = 0;
        try {
            const range = document.createRange();
            range.selectNodeContents(el);
            Array.from(range.getClientRects()).forEach((rect) => {
                if (rect.height > need) need = rect.height;
            });
        } catch (_) {
            return 0;
        }
        return need;
    }

    /**
     * 把蒙文行收进它的固定行高。
     *
     * ⚠️ 判据不能用 scrollHeight：竖排元素的滚动溢出发生在**块轴（横向）**，行内轴
     * （纵向）的溢出不会被 scrollHeight 反映（实测恒等于 clientHeight）。故用 Range
     * 逐列量「可见字高」取最大值，超出固定行高时按实测比例 scaleY 压缩，直到列高
     * 与行高一致（与 hohhot_mongolian.js 的 fitVertical 同口径，最多 3 轮收敛）。
     */
    function fitMongolian(el) {
        // ⚠️ 先量再清：元素不可见时（祖先 display:none，例如未激活的「车站信息」页签）
        // clientHeight 为 0，此刻必须原样返回、**不要** removeProperty —— 否则会把已经
        // 贴好的压缩白白清掉、却又量不出行高，该处蒙文就此一直保持原长不压缩
        // （实测：切走页签后，任意一次 DOM 变动扫到这里就会把它清掉）。
        // 「由隐藏变可见」的补贴合由 installPanelClickRefit 负责。
        const cap = el.clientHeight;    // CSS 里高度固定，故它就是行高
        if (!cap) return;

        el.style.removeProperty("transform");
        const ink = measureInkHeight(el);
        if (!ink || ink <= cap + 0.5) return;

        let ratio = Math.max(0.2, cap / ink);
        for (let round = 0; round < 3; round += 1) {
            el.style.transform = `scaleY(${ratio.toFixed(3)})`;
            const measured = measureInkHeight(el);
            if (!measured || Math.abs(measured - cap) <= 0.5) return;
            const next = Math.min(1, Math.max(0.2, ratio * (cap / measured)));
            if (next >= 0.999) {
                el.style.removeProperty("transform");
                return;
            }
            ratio = next;
        }
    }

    /**
     * 页签切换兜底：车站信息板的「车站信息」页签（运营单位、车站设施等都在这一页）默认是
     * display:none 的，其内容在**建板时就已生成好**。切页签时 core 只加/删 .active 类，
     * 既没有 childList 变动（MutationObserver 不醒），tab 处理器里还有 e.stopPropagation()
     * （普通冒泡监听收不到）；而隐藏期间又量不到行高。故改为在**捕获阶段**监听信息板内的
     * 点击（捕获先于 target 上的 stopPropagation），等页签切完后再补几拍重贴一次蒙文。
     */
    function scheduleRefitSoon() {
        requestAnimationFrame(refitAllMongolian);
        [80, 300].forEach((ms) => setTimeout(refitAllMongolian, ms));
    }

    function installPanelClickRefit() {
        document.addEventListener("click", (event) => {
            const target = event.target;
            if (!target || typeof target.closest !== "function") return;
            if (!target.closest(".panel-tabs-container, .panel-badges, #station-selector")) return;
            scheduleRefitSoon();
        }, true);
    }

    function renderCompactLineBadge(badge, lines) {
        const markup = createCompactBadgeMarkup(lines);
        if (!markup) return false;

        const lineNames = lines.map((line) => line.name).join(" / ");
        badge.innerHTML = markup;
        badge.classList.remove("svg-icon-placeholder");
        badge.classList.add("svg-icon-inlined", "hohhot-line-badge");
        badge.dataset.hohhotBadge = lines.map((line) => line.id).join(",");
        badge.style.width = "auto";
        badge.title = lineNames;
        badge.setAttribute("aria-label", lineNames);
        badge.querySelectorAll(".hohhot-line-badge-mn").forEach(fitMongolian);
        return true;
    }

    function getDistinctBadgeLines(badges) {
        const seen = new Set();
        const lines = [];
        for (const badge of badges) {
            const badgeLines = getBadgeLines(badge);
            if (!badgeLines) return null;
            for (const line of badgeLines) {
                if (!getLineNumber(line)) return null;
                if (seen.has(line.id)) continue;
                seen.add(line.id);
                lines.push(line);
            }
        }
        return lines;
    }

    function renderBadgeGroup(badges) {
        if (!badges.length || !badges.every((badge) => badge.classList.contains("svg-icon-inlined"))) return;
        if (badges.length === 1 && badges[0].dataset.hohhotBadge) return;

        const lines = getDistinctBadgeLines(badges);
        if (!lines?.length) return;

        const finalBadge = badges[badges.length - 1];
        if (!renderCompactLineBadge(finalBadge, lines)) return;
        badges.slice(0, -1).forEach((badge) => badge.remove());
    }

    function syncCompactLineBadges() {
        // 车站信息板头部：多线换乘站合并为一枚
        document.querySelectorAll(".panel-badges").forEach((container) => {
            const badges = [...container.querySelectorAll(":scope > .line-badge")];
            if (badges.length >= 2) renderBadgeGroup(badges);
        });

        // 站名气泡选择器里的线路图标（无 .line-badge 类，仅 .svg-icon-inlined）
        document.querySelectorAll("#station-selector .selector-item").forEach((item) => {
            renderBadgeGroup([...item.querySelectorAll(":scope > .svg-icon-inlined")]);
        });

        // 换乘链接：同一目标站（data-jump-sid）的徽标才属于一组
        document.querySelectorAll(".transfer-section .info-row > div:last-child").forEach((container) => {
            const groups = new Map();
            [...container.querySelectorAll(":scope > .line-badge.transfer-link")].forEach((badge) => {
                const targetSid = badge.dataset.jumpSid || "";
                if (!groups.has(targetSid)) groups.set(targetSid, []);
                groups.get(targetSid).push(badge);
            });
            groups.forEach(renderBadgeGroup);
        });

        // 搜索结果与行程规划候选项：同一行内多条线路合并；只有一条时也用本城定制徽标。
        // 时序注意：core 的 SVG 注入是逐个 await fetch 的，可能在只注入一半时就被本函数
        // 扫到；故必须等整行徽标都注入完成再处理，否则会被先固化成不完整的结果。
        document.querySelectorAll(".search-item, .cgo-rt-item").forEach((item) => {
            const badges = [...item.querySelectorAll(":scope > .search-line-icon")]
                .filter((badge) => !badge.dataset.hohhotBadge);
            if (!badges.length) return;
            if (!badges.every((badge) => badge.classList.contains("svg-icon-inlined"))) return;
            if (badges.length >= 2) {
                renderBadgeGroup(badges);
                return;
            }
            const line = getLineForBadge(badges[0]);
            if (line) renderCompactLineBadge(badges[0], [line]);
        });

        // 其余单枚徽标（车站信息板 / 换乘链接 / 搜索结果外）
        document.querySelectorAll(
            ".line-badge.svg-icon-inlined:not([data-hohhot-badge]), "
            + ".search-line-icon.svg-icon-inlined:not([data-hohhot-badge])"
        ).forEach((badge) => {
            // 位于搜索结果/规划候选项内的交由上面的整行处理
            if (badge.closest(".search-item, .cgo-rt-item")) return;
            const line = getLineForBadge(badge);
            if (line) renderCompactLineBadge(badge, [line]);
        });

        // 线路悬停提示（#line-tooltip 内的徽标）
        document.querySelectorAll("#line-tooltip > .svg-icon-inlined[data-src]:not([data-hohhot-badge])").forEach((badge) => {
            const line = getLineForBadge(badge);
            if (line) renderCompactLineBadge(badge, [line]);
        });
    }

    /** 补齐几拍：蒙文字体（系统或 CDN）就绪后，按最终字体重新贴合一次 */
    function refitAllMongolian() {
        document.querySelectorAll(".hohhot-line-badge-mn").forEach(fitMongolian);
    }

    function scheduleRefit() {
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refitAllMongolian).catch(() => { });
        }
        [400, 1500, 4000].forEach((ms) => setTimeout(refitAllMongolian, ms));
    }

    function installCompactLineBadgeObserver() {
        const root = document.body;
        if (!root || root.dataset.hohhotLineBadgeObserver === "true") return;

        let frameId = 0;
        const scheduleSync = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                syncCompactLineBadges();
                // 每拍顺带重贴一次蒙文：新徽标是被重画出来了（上面的同步），但它的蒙文行
                // 可能正好在不可见时被量（量为 0，fitMongolian 原样返回），需要后面补一次。
                // 贴合是幂等的，元素也很少，开销可忽略。注意本观察器只监听 childList，
                // 贴合写的是内联 transform（属性），不会自触发。页签切换见 installPanelClickRefit。
                refitAllMongolian();
            });
        };
        const observer = new MutationObserver(scheduleSync);
        observer.observe(root, { childList: true, subtree: true });
        root.dataset.hohhotLineBadgeObserver = "true";
        installPanelClickRefit();
        scheduleSync();
        scheduleRefit();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installCompactLineBadgeObserver, { once: true });
    } else {
        installCompactLineBadgeObserver();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "hohhot", moduleId: "hohhot-station-board" }
    }));
})();
