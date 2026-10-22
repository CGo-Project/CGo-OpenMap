/**
 * CGo OpenMap - 哈尔滨自定义紧凑线路徽标
 * (city/harbin/modules/harbin_line_badges.js)
 *
 * 把 core 默认的 `icon@NN.svg` 线路徽标，替换成哈尔滨自己的紧凑徽标：
 * **1:2 竖向、微圆角、白描边的长方形 + 居中加粗数字**。
 *
 * 整体形态参照沈阳（modules/shenyang_station_board.js）：同样由 MutationObserver 盯住
 * 全部徽标出现的位置（车站信息板 / 同名站选择器 / 换乘接驳行 / 搜索结果 / 行程规划候选项 /
 * 线路悬停气泡），同样把合并的线路 ID 记在徽标自身的 `data-*` 上以便重画时不打回单线，
 * 同样提供 `window.CGO_SHARE_BADGES` 让分享卡按「无染色上下文的原形」重画。
 * 差别只在**图形**：沈阳是「圆底数字 + 右侧「号线 / Line N」」，哈尔滨是「白描边长方形 +
 * 居中数字」，不带双语文字。
 *
 * ⚠️ **`isPointOnly` 的散点线路一律不接管**（当前即 `Rwy`「中国铁路」，只落 4 座国铁车站
 *    徽标、不绘制走向）。它的 core 图标（icon@56.svg）承载的是「铁路车站」这个语义，
 *    不是线路编号；强行套上「1:2 + 数字」的外壳既没有数字可写，也会丢掉它与地铁徽标的
 *    视觉区分。判据是 `line.isPointOnly`，故日后新增散点线路同样自动保持默认。
 *
 * 无对外接口；脚本存在即生效（经 `harbin.js` 的 `stationBoard.scripts` 引入）。
 * 事件：`cgo:city-module-ready` { cityId: "harbin", moduleId: "harbin-line-badges" }
 */
(function () {
    const SVG_NS = "http://www.w3.org/2000/svg";

    /**
     * 徽标几何（viewBox 单位，最终按 core 的 `.line-badge` 高度 32px 等比放大）。
     * `aspectWidth / aspectHeight` 即「宽高比 1:2」——**长方形本身**宽 16、高 32；
     * 右侧文字标签另算宽度（参照沈阳「圆 + 号线 / Line N」的排版）。
     *
     * ⚠️ **「数字高度 = 长方形高度的一半」指的是字形的可视高度（cap height），
     *    不是 font-size**：Arial / Helvetica 的大写高约为 0.716em，故 font-size 22
     *    得到的数字高 ≈ 15.8 ≈ 32 的一半。若误把 font-size 设成 16，数字视觉上会明显
     *    偏小（只有四分之一高）。双位数按同一口径缩号，否则会撑破 16px 宽的长方形。
     */
    const BADGE_CONFIG = {
        aspectWidth: 16,
        aspectHeight: 32,
        gap: 1.5,                 // 多条线路并排时的间隔
        strokeWidth: 1,           // 白描边宽度（实测 1.6 在 32px 高的徽标里偏厚）
        radius: 1.5,              // 微圆角
        numberFontSize: 22,       // 单数字：cap height ≈ 15.8 ≈ 长方形高(32) 的一半
        twoDigitFontSize: 15,     // 双位数：缩号，避免撑破 16px 宽的长方形
        numberFontWeight: 700,
        numberVerticalOffset: 0.5, // dominant-baseline="central" 在不同字体下的基线微调
        labelGap: 3,              // 长方形 ↔ 文字标签的间距
        labelCnY: -5.2,           // 「号线」基线（相对垂直居中）
        labelEnY: 6.2,            // 「Line N」基线
        labelCnSize: 11,          // 「号线」字号
        labelEnSize: 8.5          // 「Line N」字号
    };

    /**
     * 徽标内数字的字体栈。与沈阳同一口径：把系统 Arial/Helvetica 排在 cgo-ui 的
     * --font-en（Arimo）之前 —— Arimo 数字字面偏窄小，放在窄长方形里不够饱满；
     * 系统缺这两款时（Linux / Android）再回落到 Arimo。
     */
    const BADGE_EN_FONT = "Arial, Helvetica, var(--font-en, Arimo, sans-serif)";

    /* ── 线路数据读取 ──────────────────────────────────────────────
       `linesData` 顶层声明不保证挂到 window（共享层既有约定），一律 typeof 守卫 + window 兜底。 */
    function getHarbinLinesData() {
        if (Array.isArray(window.linesData)) return window.linesData;
        if (typeof linesData !== "undefined" && Array.isArray(linesData)) return linesData;
        return [];
    }

    /** 从线路名里取编号（「1号线」→「1」）；取不到返回 null，调用方据此不接管 */
    function getLineNumber(line) {
        const match = String(line?.name || "").match(/(\d+)号线$/);
        return match ? match[1] : null;
    }

    /** 按 core 写在徽标上的 `data-src`（icon@NN.svg 的文件名 / 图标编号）反查线路 */
    function getLineForBadge(badge) {
        const source = String(badge?.dataset?.src || "");
        const sourceFile = source.split("?")[0].split("/").pop();
        const sourceNumber = sourceFile?.match(/icon@(\d+)\.svg$/i)?.[1];
        const lineList = getHarbinLinesData();

        return lineList.find((line) => line.svg === sourceFile)
            || lineList.find((line) => getLineNumber(line) === String(Number(sourceNumber)))
            || null;
    }

    /**
     * 徽标对应的线路数组。
     * 多线换乘站会被 `syncLineBadges()` 合并成一个徽标，合并的线路 ID 记在
     * `data-harbin-badge` 上 —— 重画（含分享卡回调）时优先读它，避免打回单线。
     */
    function getBadgeLines(badge) {
        const lineList = getHarbinLinesData();
        const mergedIds = String(badge?.dataset?.harbinBadge || "")
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

    /* ── 数字配色 ────────────────────────────────────────────────── */

    /** 解析 #RRGGBB / rgb() 为 [r, g, b]（0-255），无法解析返回 null */
    function parseColorChannels(color) {
        const raw = String(color || "").trim();
        const hex = raw.match(/^#([0-9a-f]{6})$/i);
        const rgb = raw.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
        if (hex) {
            const value = hex[1];
            return [
                parseInt(value.slice(0, 2), 16),
                parseInt(value.slice(4, 6), 16),
                parseInt(value.slice(2, 4), 16)
            ];
        }
        if (rgb) return rgb.slice(1, 4).map(Number);
        return null;
    }

    /** 按 WCAG 相对亮度判定「线路色底上该用深字还是浅字」 */
    function getReadableNumberTextColor(color) {
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

    /* ── SVG 生成 ────────────────────────────────────────────────── */

    /**
     * 生成「1:2 微圆角白描边长方形 + 居中加粗数字 + 右侧『号线 / Line N』文字标签」的紧凑徽标。
     * 每条线路各占一个长方形，多线时横向并排（参照沈阳的圆并排）。
     * 取不到任何线路编号返回 null —— 调用方保持 core 默认图标。
     */
    function createLineBadgeSvg(lines) {
        const numbers = lines.map(getLineNumber).filter(Boolean);
        if (!numbers.length) return null;

        const {
            aspectWidth, aspectHeight, gap, strokeWidth, radius,
            numberFontSize, twoDigitFontSize, numberFontWeight, numberVerticalOffset,
            labelGap, labelCnY, labelEnY, labelCnSize, labelEnSize
        } = BADGE_CONFIG;
        // 描边画在长方形内侧（避免被 viewBox 裁掉半条边），实际外形宽高即 aspectWidth/Height
        const inset = strokeWidth / 2;
        const rectsWidth = aspectWidth * numbers.length + gap * (numbers.length - 1);
        const centerY = aspectHeight / 2;
        const labelX = rectsWidth + labelGap;
        const englishLabel = `Line ${numbers.join("/")}`;
        // 文字宽度按字号估算：「号线」11px × 2 + 余量；英文 8.5px × 字符数 × 0.55 逐字宽
        const labelWidth = Math.max(22, Math.ceil(Math.max(
            labelCnSize * 2.2,
            englishLabel.length * labelEnSize * 0.62
        )));
        const totalWidth = Math.ceil(labelX + labelWidth + 1);

        const rectMarkup = lines.map((line, index) => {
            const number = getLineNumber(line);
            if (!number) return "";
            const x = index * (aspectWidth + gap);
            const centerX = x + aspectWidth / 2;
            // 双位数按同一口径缩号，否则会撑破 16px 宽的长方形
            const fontSize = number.length > 1 ? twoDigitFontSize : numberFontSize;
            const scaleX = number.length > 1 ? 0.82 : 1;   // 双位数再横向收一点
            const transform = scaleX === 1
                ? ""
                : ` transform="translate(${centerX} 0) scale(${scaleX} 1) translate(${-centerX} 0)"`;
            return `
                <rect x="${x + inset}" y="${inset}" width="${aspectWidth - strokeWidth}" height="${aspectHeight - strokeWidth}" rx="${radius}" fill="${line.color}" stroke="#ffffff" stroke-width="${strokeWidth}" />
                <text x="${centerX}" y="${centerY + numberVerticalOffset}" text-anchor="middle" dominant-baseline="central" fill="${getReadableNumberTextColor(line.color)}" font-family="${BADGE_EN_FONT}" font-size="${fontSize}" font-weight="${numberFontWeight}"${transform}>${number}</text>
            `;
        }).join("");

        // 文字标签（与沈阳同款：「号线」中文在上、`Line N` 英文在下，填 currentColor 跟随文字色）
        const labelMarkup = `
            <g transform="translate(${labelX} ${centerY})" fill="currentColor" text-anchor="start">
                <text x="0" y="${labelCnY}" dominant-baseline="middle" font-family="var(--font-sans, 'Noto Sans SC', sans-serif)" font-size="${labelCnSize}" font-weight="700">号线</text>
                <text x="0" y="${labelEnY}" dominant-baseline="middle" font-family="${BADGE_EN_FONT}" font-size="${labelEnSize}" font-weight="700">${englishLabel}</text>
            </g>
        `;

        return {
            width: totalWidth,
            height: aspectHeight,
            svg: `
                <svg class="harbin-line-badge-svg" viewBox="0 0 ${totalWidth} ${aspectHeight}" aria-hidden="true" focusable="false" xmlns="${SVG_NS}">
                    ${rectMarkup}
                    ${labelMarkup}
                </svg>
            `
        };
    }

    /* ── 注入与同步 ──────────────────────────────────────────────── */

    /**
     * 取 core 的 `.line-badge` 实际高度（默认 32px），据此把自绘 SVG 等比放大到同高。
     * 与沈阳同口径。
     */
    function getBadgeHeight(badge) {
        const computedHeight = Number.parseFloat(window.getComputedStyle(badge).height);
        return Number.isFinite(computedHeight) && computedHeight > 0
            ? computedHeight
            : BADGE_CONFIG.aspectHeight;
    }

    /**
     * 把一个 core 徽标替换成本城紧凑徽标。
     * 不接管的场合（散点线路 / 抽不到编号 / 数据未就绪）返回 false，
     * core 的默认图标保持原样 —— 这正是 `Rwy`「中国铁路」的走法。
     */
    function renderLineBadge(badge, lines) {
        const compactBadge = createLineBadgeSvg(lines);
        if (!compactBadge) return false;

        const height = getBadgeHeight(badge);
        const width = compactBadge.width * height / compactBadge.height;
        const lineNames = lines.map((line) => line.name).join(" / ");

        badge.innerHTML = compactBadge.svg;
        badge.classList.remove("svg-icon-placeholder");
        badge.classList.add("svg-icon-inlined", "harbin-line-badge");
        badge.dataset.harbinBadge = lines.map((line) => line.id).join(",");
        badge.style.width = `${width}px`;
        badge.title = lineNames;
        badge.setAttribute("aria-label", lineNames);
        return true;
    }

    /** 同一批徽标去重出线路列表；其中任何一条抽不到编号（如 Rwy）即整体不接管 */
    function getDistinctBadgeLines(badges) {
        const seen = new Set();
        const lines = [];
        for (const badge of badges) {
            const badgeLines = getBadgeLines(badge);
            if (!badgeLines) return null;
            for (const line of badgeLines) {
                if (line.isPointOnly || !getLineNumber(line)) return null;
                if (seen.has(line.id)) continue;
                seen.add(line.id);
                lines.push(line);
            }
        }
        return lines;
    }

    /**
     * 把同一批徽标合并成一个紧凑徽标（多线换乘站 / 搜索结果一行多线 / 换乘接驳行），
     * 并移除其余占位。
     */
    function renderBadgeGroup(badges) {
        if (!badges.length) return;
        if (!badges.every((badge) => badge.classList.contains("svg-icon-inlined"))) return;
        // 已经合并过（合并 ID 记在徽标上）就不再动，避免每次 mutation 都重画
        if (badges.length === 1 && badges[0].dataset.harbinBadge) return;

        const lines = getDistinctBadgeLines(badges);
        if (!lines?.length) return;

        const finalBadge = badges[badges.length - 1];
        if (!renderLineBadge(finalBadge, lines)) return;
        badges.slice(0, -1).forEach((badge) => badge.remove());
    }

    /**
     * 全量同步：覆盖 core 渲染出徽标的所有位置。
     * 时序注意（与沈阳同一坑）：core 的 SVG 注入是逐个 `await fetch` 的，可能只注入了一半
     * 就被扫到 —— 故整行必须等**全部**注入完成再合并，否则会固化成不完整的结果。
     */
    function syncLineBadges() {
        // 车站信息板标题栏（core 的 header-badges 模块）
        document.querySelectorAll(".panel-badges").forEach((container) => {
            const badges = [...container.querySelectorAll(":scope > .line-badge")];
            if (badges.length >= 2) renderBadgeGroup(badges);
        });

        // 同名站选择器（core 弹出的站点列表）
        document.querySelectorAll("#station-selector .selector-item").forEach((item) => {
            const badges = [...item.querySelectorAll(":scope > .svg-icon-inlined")];
            renderBadgeGroup(badges);
        });

        // 换乘 / 接驳行：同一对端站的多条线路合并
        document.querySelectorAll(".transfer-section .info-row > div:last-child").forEach((container) => {
            const groups = new Map();
            const badges = [...container.querySelectorAll(":scope > .line-badge.transfer-link")];
            badges.forEach((badge) => {
                const targetSid = badge.dataset.jumpSid || "";
                if (!groups.has(targetSid)) groups.set(targetSid, []);
                groups.get(targetSid).push(badge);
            });
            groups.forEach(renderBadgeGroup);
        });

        // 搜索结果与行程规划候选项：一行多线合并；只有一条线时同样走本城徽标
        document.querySelectorAll(".search-item, .cgo-rt-item").forEach((item) => {
            const badges = [...item.querySelectorAll(":scope > .search-line-icon")]
                .filter((badge) => !badge.dataset.harbinBadge);
            if (!badges.length) return;
            if (!badges.every((badge) => badge.classList.contains("svg-icon-inlined"))) return;
            if (badges.length >= 2) {
                renderBadgeGroup(badges);
                return;
            }
            const line = getLineForBadge(badges[0]);
            if (line) renderLineBadge(badges[0], [line]);
        });

        // 余下散落的单个徽标（含上面整行合并后留下的那个）
        document.querySelectorAll(
            ".line-badge.svg-icon-inlined:not([data-harbin-badge]), "
            + ".search-line-icon.svg-icon-inlined:not([data-harbin-badge])"
        ).forEach((badge) => {
            if (badge.closest(".search-item, .cgo-rt-item")) return;   // 交由整行合并处理
            const line = getLineForBadge(badge);
            if (line) renderLineBadge(badge, [line]);
        });

        // 线路悬停气泡
        document.querySelectorAll("#line-tooltip > .svg-icon-inlined[data-src]:not([data-harbin-badge])").forEach((badge) => {
            const line = getLineForBadge(badge);
            if (line) renderLineBadge(badge, [line]);
        });
    }

    /* ── 样式 ──────────────────────────────────────────────────────
       哈尔滨没有 city/harbin/style.css，且这里只需几条规则，故就地内联一个 <style>，
       不必为此多开一个 css 文件与一条 sw 预缓存。core 的 .line-badge 已给
       height:32px / width:auto / display:inline-block。`height:100%` 让 svg 填满徽标高，
       宽度由 viewBox 的宽高比自动推出（1:2 → 16px）。 */
    const STYLE_ID = "harbin-line-badge-style";
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            .harbin-line-badge, .harbin-line-badge svg {
                display: block;
                height: 100%;
                width: auto;
                overflow: visible;
            }

            /* 线路悬停气泡：给徽标垫一块底板（与沈阳同款观感）。
               核心给 #line-tooltip 整块套了 drop-shadow(0 3px 6px …)，而 drop-shadow 跟随的
               是**渲染后的 alpha 轮廓** —— 没有底时它贴着数字与白描边走、显得碎；垫上不透明
               底板后，阴影自动落到板的圆角轮廓上（即「把阴影移到这个底上来」，不必改核心的 filter）。
               底色走 --header-bg / --border-color（沈阳同款写法），故暗色主题下自动变深底浅字，
               徽标里的文字标签用 currentColor，无需另配一套配色。 */
            #line-tooltip {
                box-sizing: border-box;
                background: var(--header-bg);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 3px 5px;
            }
        `;
        document.head.appendChild(style);
    }

    function installObserver() {
        const root = document.body;
        if (!root || root.dataset.harbinLineBadgeObserver === "true") return;

        injectStyle();

        // 合并与重画都在同一次 rAF 里做，多轮 mutation 只跑一遍（参照沈阳）
        let frameId = 0;
        const scheduleSync = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                syncLineBadges();
            });
        };
        const observer = new MutationObserver(scheduleSync);
        observer.observe(root, { childList: true, subtree: true });
        root.dataset.harbinLineBadgeObserver = "true";
        scheduleSync();
    }

    /**
     * 分享卡（共享层 `base/share-card.js`）的线路徽标「按原形重画」钩子。
     * 哈尔滨的徽标没有沈阳那种「为染色 header 特化」的反色，这里重画主要是
     * 保证分享卡里克隆进来的徽标与当前线路数据一致（含多线合并）。
     * 画出的图形必须是**内联 `<svg>`**（海报出图走 foreignObject，`<cgo-icon>` 会渲染成空白）。
     */
    window.CGO_SHARE_BADGES = (container) => {
        container.querySelectorAll(":scope > .line-badge").forEach((badge) => {
            const lines = getBadgeLines(badge);
            if (lines?.length) renderLineBadge(badge, lines);
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installObserver, { once: true });
    } else {
        installObserver();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "harbin", moduleId: "harbin-line-badges" }
    }));
})();
