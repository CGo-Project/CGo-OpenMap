/**
 * CGo OpenMap - 站名题字共享层
 *
 * ⚠️ 临时共享位置
 * 本文件与 calligraphy.css 同址，供多城共用。计划在开发团队确认共享位置后随共享层
 * 一并迁入 core/（与 stacard-engine.js、timetable-renderer.js、tip-card.js 等同批）。
 *
 * 加载方式：classic script。由各城 {city}.js 在加载自身模块**之前** document.write
 * 引入，因此以全局形式暴露，不走 ES module（城市模块本身也是 classic script）。
 *
 * 职责边界
 * - 本文件负责：两个信息板模块的注册与渲染、header 整块线路色染色与可读文字色计算、
 *   移动端顶部填充层联动、切站时的染色清理，以及题字样式表的按需注入。
 * - 城市侧负责：题字数据（各城 data_calligraphy.js）、题字图资源、header 取色优先级、
 *   城市专属装饰联动（onHeaderMounted 钩子）与待考文案。
 *
 * 注册的两个模块
 *   1. {idPrefix}-calligraphy-title（slot: header, order: 20）
 *      接管内置 header-title：**有题字横图**的车站以题字图替换中文站名，英文站名保留；
 *      其余车站（仅收录题写者简介、题写者待考、尚无题字图的站）回退标准中英文标题。
 *      城市配置中需将内置 "header-title" 置为 enabled: false。
 *   2. {idPrefix}-calligrapher-intro（targetTab: station-info, order: 12）
 *      题字人简介卡片；仅登记「有题字」事实的占位条目（pendingCalligrapher）
 *      显示题写者待考说明。卡片 DOM 走共享层 CGoTipCard。
 *
 * 兼容性注意：题字标题必须保留 .panel-cn-name 类名与可读站名文本
 * （.sy-calligraphy-text 为裁剪但可读取的文本），core/script.js 在面板吸附
 * 侧栏时会读取 .panel-cn-name 的 innerText 同步侧栏标题。
 *
 * 数据结构：字段规范见各城 data_calligraphy.js 顶部说明。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    /** 与 calligraphy.js 同目录的样式表文件名 */
    const STYLE_FILE = "calligraphy.css";

    /** 样式表注入标记，避免重复引入 */
    const STYLE_FLAG_ATTR = "data-sy-calligraphy-style";

    const DEFAULT_PENDING_TEXT = "本站有书法家题写站名，题写者信息待补充。";

    /** 题字站激活时挂在 body 上的类名：供 header 之外的元素（如移动端顶部填充层）联动染色 */
    const ACTIVE_CLASS = "sy-calligraphy-active";

    /**
     * 按自身脚本 URL 推导并注入题字样式表（幂等）。
     * 用 currentScript.src 而非城市侧写死路径：共享层将来迁入 core/ 时，
     * 只要 calligraphy.css 仍与 calligraphy.js 同目录即无需改动此处。
     */
    function injectStyle() {
        const current = document.currentScript;
        if (!current || !current.src) return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = new URL(STYLE_FILE, current.src).href;
        link.setAttribute(STYLE_FLAG_ATTR, "");
        (document.head || document.documentElement).appendChild(link);
    }

    const escapeAttribute = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    /** 与内置 header-title 一致的英文名处理（<br> 折行转空格） */
    function formatEnName(station) {
        return String(station?.en || "").replace(/<br>/gi, " ");
    }

    /** 标准中英文标题（无题字车站回退，结构与内置 header-title 完全一致） */
    function renderStandardTitle(station) {
        return `
            <div class="header-name-group">
                <div class="panel-cn-name">${station.cn || ""}</div>
                <div class="panel-en-name">${formatEnName(station)}</div>
            </div>
        `;
    }

    /** 题字标题：题字图替换中文站名，真实站名文本仅供无障碍与侧栏标题读取 */
    function renderCalligraphyTitle(station, info) {
        const imageUrl = escapeAttribute(info.image);
        const ratio = Number.isFinite(Number(info.ratio)) ? Number(info.ratio) : 4.7;
        const altText = escapeHtml(info.alt || `${station.cn || ""}站`);
        // mask-image 必须直接写在元素内联样式上：内联样式中的 url() 相对宿主文档
        // （站点根）解析；若经 CSS 变量交给外部样式表 var() 消费，url 会改为相对
        // style.css 所在目录解析，导致路径前缀重复。
        const maskStyle = `-webkit-mask-image:url('${imageUrl}');mask-image:url('${imageUrl}');`;

        return `
            <div class="header-name-group">
                <div class="panel-cn-name sy-calligraphy-title" role="img" aria-label="${altText}"
                     style="--sy-cali-ratio:${ratio}">
                    <span class="sy-calligraphy-glyph" style="${maskStyle}" aria-hidden="true"></span>
                    <span class="sy-calligraphy-text">${altText}</span>
                </div>
                <div class="panel-en-name">${formatEnName(station)}</div>
            </div>
        `;
    }

    /**
     * 缺省可读文字色：按 WCAG 相对亮度判断底色深浅，深底取白字、浅底取近黑字。
     * 城市若已有自己的取色实现（如沈阳的 ShenyangUi.getReadableTextColor），
     * 应以 config.getReadableTextColor 覆盖，保持该城既有观感一致。
     */
    function defaultReadableTextColor(color) {
        const hex = String(color || "").trim().replace(/^#/, "");
        const full = hex.length === 3
            ? hex.split("").map((ch) => ch + ch).join("")
            : hex;
        if (!/^[0-9a-f]{6}$/i.test(full)) return "#ffffff";

        const channel = (offset) => parseInt(full.slice(offset, offset + 2), 16) / 255;
        const linear = (value) => (value <= 0.03928
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4);
        const luminance = 0.2126 * linear(channel(0))
            + 0.7152 * linear(channel(2))
            + 0.0722 * linear(channel(4));

        return luminance > 0.45 ? "#1f1f1f" : "#ffffff";
    }

    /**
     * 为一座城市注册题字相关的两个信息板模块
     *
     * @param {object} config
     * @param {string} config.idPrefix
     *        模块 ID 前缀，也是模块 ID 的构成（如 "shenyang" →
     *        "shenyang-calligraphy-title" / "shenyang-calligrapher-intro"），
     *        需与城市 {city}.js 的 stationBoard.modules 键一致
     * @param {string} [config.cityName] - 模块显示名中的城市名，缺省沿用 idPrefix
     * @param {string[]} [config.dataGlobals]
     *        题字数据全局名，按序取首个含该站条目的对象
     * @param {string[]} [config.lineColorPriority]
     *        换乘题字站 header 取色优先级（按稳定线路 ID，不依赖 relatedLinesInfo 的排序）；
     *        均未命中时回退该站首条经停线路色
     * @param {string} [config.pendingText] - 题写者待考卡片的正文
     * @param {(color: string) => string} [config.getReadableTextColor]
     *        由线路底色计算可读文字色，缺省用本文件的亮度判定
     * @param {(header: HTMLElement, context: object) => void} [config.onHeaderMounted]
     *        染色 header 挂载后的城市专属修饰钩子；仅在该站有题字横图时调用，
     *        context 提供 { station, info, lineColor, onColor, relatedLinesInfo }。
     *        header 每次重渲染均为全新 DOM，无需手工还原
     * @returns {void}
     */
    function register(config = {}) {
        if (!window.StationBoard?.registerModule) return;

        const tipCard = window.CGoTipCard;
        const idPrefix = config.idPrefix || "cgo";
        const cityName = config.cityName || idPrefix;
        const dataGlobals = Array.isArray(config.dataGlobals) && config.dataGlobals.length
            ? config.dataGlobals
            : ["CALLIGRAPHY_DATA"];
        const lineColorPriority = Array.isArray(config.lineColorPriority)
            ? config.lineColorPriority
            : [];
        const pendingText = config.pendingText || DEFAULT_PENDING_TEXT;
        const readableTextColor = typeof config.getReadableTextColor === "function"
            ? config.getReadableTextColor
            : defaultReadableTextColor;
        const onHeaderMounted = typeof config.onHeaderMounted === "function"
            ? config.onHeaderMounted
            : null;

        injectStyle();

        function getCalligraphy(station) {
            if (!station) return null;
            for (const globalKey of dataGlobals) {
                const data = window[globalKey];
                if (data && data[station.id]) return data[station.id];
            }
            return null;
        }

        /**
         * 该站是否有可用的题字横图。
         * 数据中部分站点只有题写者简介（或仅有「有题字」占位条目）、没有题字横图，
         * 这类站点不接管标题栏站名，只在车站信息页签显示卡片。
         */
        function hasGlyphImage(info) {
            return Boolean(info && info.image);
        }

        /** 按固定优先级选出题字 header 的代表线路色，均未命中时回退首条经停线路 */
        function pickHeaderLineColor(relatedLinesInfo) {
            const list = Array.isArray(relatedLinesInfo) ? relatedLinesInfo : [];
            for (const lineId of lineColorPriority) {
                const hit = list.find((info) => info?.id === lineId && info.lineColor);
                if (hit) return { lineId, color: hit.lineColor };
            }
            return list[0]?.lineColor
                ? { lineId: list[0].id, color: list[0].lineColor }
                : null;
        }

        window.StationBoard.registerModule({
            id: `${idPrefix}-calligraphy-title`,
            name: `${cityName}题字站名标题`,
            slot: "header",
            order: 20,
            shouldRender() {
                return true;
            },
            render(context) {
                const station = context.station || {};
                const info = getCalligraphy(station);
                // 仅有题写者简介、题写者待考或无题字横图的站不接管标题，回退标准中英文标题
                return hasGlyphImage(info)
                    ? renderCalligraphyTitle(station, info)
                    : renderStandardTitle(station);
            },
            onMounted(infoPanel, context) {
                // 仅「有题字横图」的站把整个标题栏染为首条经停线路的标志色。
                // .panel-header 外壳由 core 装配，模块只能通过挂载后修饰；
                const station = context.station || {};
                const info = getCalligraphy(station);
                if (!infoPanel || !hasGlyphImage(info)) {
                    // 无题字横图的站需清掉 body 上的染色状态，否则移动端顶部填充层
                    // 会残留上一站的线路色
                    document.body.classList.remove(ACTIVE_CLASS);
                    document.body.style.removeProperty("--sy-cali-line-color");
                    document.body.style.removeProperty("--sy-cali-on-color");
                    return;
                }

                const header = infoPanel.querySelector(".panel-header");
                if (!header) return;

                // 取色按城市配置的线路优先级，稳定线路 ID 不随线路排序漂移
                const picked = pickHeaderLineColor(context.relatedLinesInfo)
                    || (station.lineColors?.[0] ? { lineId: "", color: station.lineColors[0] } : null);
                if (!picked?.color) return;

                const onColor = readableTextColor(picked.color) || "#ffffff";
                header.classList.add("sy-calligraphy-header");
                // 染色变量挂在 body 而非 header：body 是 header 与移动端顶部填充层
                // (.mobile-top-bar-backdrop，位于 main.html 的 body 级) 的公共祖先，
                // 一处赋值即可同时驱动两处颜色，避免两处各存一份
                document.body.classList.add(ACTIVE_CLASS);
                document.body.style.setProperty("--sy-cali-line-color", picked.color);
                document.body.style.setProperty("--sy-cali-on-color", onColor);

                onHeaderMounted?.(header, {
                    station,
                    info,
                    lineColor: picked.color,
                    onColor,
                    relatedLinesInfo: context.relatedLinesInfo
                });
            }
        });

        if (!tipCard) {
            console.warn(`[${idPrefix}_calligraphy] 共享层 CGoTipCard 未加载，题字人简介卡片未注册`);
            return;
        }

        window.StationBoard.registerModule({
            id: `${idPrefix}-calligrapher-intro`,
            name: `${cityName}站名题字人简介`,
            targetTab: "station-info",
            order: 12,
            shouldRender({ station }) {
                return Boolean(getCalligraphy(station));
            },
            render({ station }) {
                const info = getCalligraphy(station);
                if (!info) return "";
                const person = info.calligrapher || {};

                // 占位条目（pendingCalligrapher）：题字实物已确证、题写者尚未考证出来。
                // 这与「题写者已知、题字横图未采集」是两种不同状态，故走单独的待考文案，
                // 只陈述「本站有题字」这一事实，不臆测题写渊源
                if (!person.name) {
                    return tipCard.render({
                        title: "站名题字",
                        icon: "edit",
                        iconSize: 14,
                        body: pendingText
                    });
                }

                // 生平简介以数据文件收录的官方口径为准；intro 需自带姓名主语
                // （如「阎肃，男，生于……」），否则第二句会以「男，」开头成为残句。
                // 若题字写的是车站旧名（如人民广场站的题字为「市府广场」），
                // 引导句改用旧名表述，避免卡片与当前站名对不上
                const lead = info.inscribedOldName
                    ? `本站旧名“${escapeHtml(info.inscribedOldName)}”由<strong>${escapeHtml(person.name)}</strong>题写。`
                    : `本站站名由<strong>${escapeHtml(person.name)}</strong>题写。`;
                const body = `${lead}<br>${escapeHtml(person.intro)}。`;

                return tipCard.render({
                    title: "站名题字",
                    icon: "edit",
                    iconSize: 14,
                    body
                });
            }
        });
    }

    window.CGoCalligraphy = { register };
})();
