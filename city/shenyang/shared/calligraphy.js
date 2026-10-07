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
 *   2. {idPrefix}-calligrapher-intro（targetTab: station-info, order: 7）
 *      题写者模块；仅登记「有题字」事实的占位条目（pendingCalligrapher）
 *      显示题写者待考说明，占位条目可用 pendingNote 覆盖城市默认待考文案
 *      （用于「题字实物无落款、疑为集字」等与通用表述不符的情形）。
 *      排版与同屏的「车站类型 / 运营单位 / 首末班车」等信息行同构（复用核心那套
 *      .info-row / .info-label / .info-value）：折叠态一行「站名题写者 | 姓名 详情」，
 *      点行尾的「详情 / 收起」展开正文——生平简介、题字写旧名时的说明、以及素材缺失
 *      时的投稿引导都放在这里，不再铺成一张卡片、也不再套 hover 气泡。
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

    /** 样式表注入标记，避免重复引入 */
    const STYLE_FLAG_ATTR = "data-sy-calligraphy-style";

    const DEFAULT_PENDING_TEXT = "本站有书法家题写站名，题写者信息待补充。";

    /**
     * 「内容缺失 → 欢迎投稿」入口：一句说明 + 一个按钮。
     *
     * 题字功能的素材完全依赖实地采集：题字横图要有人到站拍摄，题写者信息要靠落款辨认，
     * 两者都可能长期缺位。与其只留一句「待补充」，不如把补齐路径直接给到访客——
     * 常有人正好身处那座城市、那个车站。
     *
     * 早先这里是一段纯文字（「投稿给城市主理人 xxx，或加入官方 QQ 交流群 …」），
     * 联系方式与正文都在本模块里硬编码、也没法一键带走反馈；现在改为按钮，直接打开
     * **共享层的反馈面板**（`shared/feedback.js` 的 `CGoFeedback.open`，与出入口页签的
     * 「待补充」标同一套）：正文自带定位信息（城市 / 车站 ID / `data_calligraphy.js` 路径），
     * 可复制、可新建 GitHub Issue、也可直接加入官方 QQ 群 —— 联系方式与模板
     * 都收敛在反馈层，本模块只注册这一种场景的文案。
     *
     * @param {string} reason 一句话说明当前缺的是什么（纯文本，函数内转义）
     * @param {object} station 当前车站，取其 id 与站名作为反馈正文的定位信息
     */
    function contributionNoteHtml(reason, station) {
        return `<div class="sy-cali-note">${escapeHtml(reason)}`
            + `<button type="button" class="cgo-feedback-link" data-cali-feedback`
            + ` data-station-id="${escapeHtml(station?.id || "")}"`
            + ` data-station-cn="${escapeHtml(station?.cn || "")}"`
            + ` data-reason="${escapeHtml(reason)}"`
            + `><cgo-icon name="edit" size="12"></cgo-icon>投稿 / 反馈</button>`
            + `</div>`;
    }

    /* 题字投稿场景的文案：登记进共享层。同样刻意不写 `label` —— 它的触发点在题字卡片里，
       不需要出现在「更多」入口的场景切换中。 */
    const CALLIGRAPHY_KIND = {
        modalTitle: "投稿站名题字",
        heading: ({ cityName, stationCn }) => `${cityName} ${stationCn} · 站名题字`,
        subject: ({ cityName, stationCn }) => `【站名题字】${cityName} ${stationCn} 素材待补充`,
        notePlaceholder: "补充说明（选填，如题写者姓名、落款、拍摄位置）",
        context: ({ cityId, cityName, stationId, stationCn, reason }) => [
            `【站名题字投稿】${cityName} ${stationCn}`,
            "",
            `- 城市：${cityName}（${cityId}）`,
            `- 车站：${stationCn}（${stationId}）`,
            `- 数据文件：city/${cityId}/data_calligraphy.js`,
            `- 缺失内容：${reason || "本站的题字横图 / 题写者信息尚未收录。"}`,
            "- 如有照片，请说明拍摄位置（站厅哪一侧、靠近哪个出入口）。"
        ]
    };
    const registerCalligraphyKind = () => window.CGoFeedback?.registerKind("calligraphy", CALLIGRAPHY_KIND);
    registerCalligraphyKind();

    /**
     * 投稿按钮 → 共享层反馈面板。
     * 未加载反馈层时只提示一句，不抛错——按钮仍在原地，缺的是面板本身。
     */
    function bindContributionButtons(infoPanel) {
        infoPanel?.querySelectorAll("[data-cali-feedback]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const feedback = window.CGoFeedback;
                if (typeof feedback?.open !== "function") {
                    console.warn("[calligraphy] 共享层 CGoFeedback 未加载，投稿按钮暂不可用");
                    return;
                }
                registerCalligraphyKind();
                const city = (typeof window.CityDataManager?.getCurrentCity === "function")
                    ? window.CityDataManager.getCurrentCity()
                    : null;
                feedback.open({
                    kind: "calligraphy",
                    cityId: city?.id || "",
                    stationId: btn.dataset.stationId,
                    stationCn: btn.dataset.stationCn,
                    reason: btn.dataset.reason
                });
            });
        });
    }

    /**
     * 题写者一行（折叠态）+ 可展开的详情。
     *
     * 排版刻意与同屏的其余信息行（车站类型 / 运营单位 / 首末班车…）同构：直接复用核心那套
     * .info-row / .info-label / .info-value，字号、颜色、行距、右对齐全交给核心样式，
     * 亮暗主题自动跟随——本模块不再自带一套卡片外观。
     * 开合入口是行尾的「详情 / 收起」文字（非粗体，与加粗的题写者姓名拉开层级），
     * 默认折叠；监听与文案切换由 bindCalligrapherToggle 接管（切站重建 DOM 后自然回到折叠态）。
     *
     * @param {string} name   折叠态右侧文本（题写者姓名，调用方已转义；待考时为「待考」）
     * @param {string} detail 展开区 HTML（可信内容，调用方负责转义其中的数据部分）
     */
    function renderCalligrapherRow(name, detail) {
        return `
            <div class="info-row sy-cali-row">
                <span class="info-label">站名题写者</span>
                <span class="info-value">
                    <button type="button" class="sy-cali-toggle" aria-expanded="false">
                        <span>${name}</span>
                        <span class="sy-cali-more">详情</span>
                    </button>
                </span>
            </div>
            <div class="sy-cali-detail" hidden>${detail}</div>
        `;
    }

    /**
     * 折叠开合：按钮是原生 button，天然可聚焦、回车与空格可触发；再同步 aria-expanded
     * 与「详情 / 收起」文案，读屏与键盘操作都能跟上。
     *
     * 监听器只挂在本次渲染出来的节点上：车站信息板每次换站都会重建整块 DOM，
     * 旧节点连同监听器一起丢弃，不会累积、也不需要显式解绑。
     */
    function bindCalligrapherToggle(infoPanel) {
        const rows = infoPanel ? infoPanel.querySelectorAll(".sy-cali-row") : [];
        rows.forEach((row) => {
            const toggle = row.querySelector(".sy-cali-toggle");
            const detail = row.nextElementSibling;
            if (!toggle || !detail?.classList.contains("sy-cali-detail")) return;
            const more = toggle.querySelector(".sy-cali-more");
            toggle.addEventListener("click", () => {
                const expanded = toggle.getAttribute("aria-expanded") === "true";
                toggle.setAttribute("aria-expanded", String(!expanded));
                detail.hidden = expanded;
                if (more) more.textContent = expanded ? "详情" : "收起";
            });
        });
    }

    /** 题字站激活时挂在 body 上的类名：供 header 之外的元素（如移动端顶部填充层）联动染色 */
    const ACTIVE_CLASS = "sy-calligraphy-active";

    /**
     * 本脚本自身的 URL，用于推导同目录的 calligraphy.css。
     *
     * ⚠️ 必须在**脚本执行期**读取 currentScript：register() 由城市薄配置在另一个脚本里
     * 调用，那时 currentScript 已指向城市脚本，据此推导会得到
     * `city/{city}/modules/calligraphy.css` 这种错误路径（样式表 404 后，题字图与
     * header 染色规则会一并失效，表现为「题字和染色 header 都不见了」）。
     */
    const SELF_URL = document.currentScript?.src || "";

    /**
     * 按自身脚本 URL 推导并注入题字样式表（幂等）。
     *
     * ⚠️ 必须用字符串替换把脚本 URL 上的 `?v=` 版本串**原样搬到 CSS 上**，不能走
     * `new URL("calligraphy.css", SELF_URL)`——那条路径会把 query 丢掉，于是 CSS 的 URL
     * 恒定不变，改了样式也会被浏览器 / Service Worker 一直命中旧缓存（表现就是
     * 「代码改了、页面没变」）。与 sidebar-refit / route-panel / map-tools 同一做法。
     * 用 SELF_URL 而非写死路径：共享层将来迁入 core/ 时，只要两者仍同目录即无需改动此处。
     */
    function injectStyle() {
        if (!SELF_URL) return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = SELF_URL.replace(/calligraphy\.js(\?|$)/, "calligraphy.css$1");
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

        // is-pending：遮罩图是异步加载的，取到之前元素会按 background-color 整块填色
        // （标题栏上一坨实心色块），故先隐藏、由 onMounted 的探测在加载完成后摘掉；
        // 加载失败则整块回退成标准中英文标题（见 fallbackToStandardTitle）。
        return `
            <div class="header-name-group">
                <div class="panel-cn-name sy-calligraphy-title is-pending" role="img" aria-label="${altText}"
                     style="--sy-cali-ratio:${ratio}">
                    <span class="sy-calligraphy-glyph" style="${maskStyle}" aria-hidden="true"></span>
                    <span class="sy-calligraphy-text">${altText}</span>
                </div>
                <div class="panel-en-name">${formatEnName(station)}</div>
            </div>
        `;
    }

    /**
     * 题字横图取不到时的兜底：把标题栏还原成标准中英文标题，并撤掉题字染色。
     *
     * 为什么需要：数据层的 hasGlyphImage() 只判得出「有没有登记路径」，判不出
     * 「这个路径此刻取不取得到」。而题字是 CSS luminance mask，遮罩图取不到时
     * 元素会按 background-color 整块填色——标题栏上会出现一坨实心色块，
     * 比普通图片挂掉更难看。
     *
     * 「下次再试」不需要额外机制：失败的响应不会被写进 Service Worker 缓存
     * （sw.js 只在 status 200 时回填），所以这是一次性降级，不会把「暂时取不到」
     * 记成永久结论，下次打开该站会重新探测。
     */
    function fallbackToStandardTitle({ infoPanel, header, station, info, onFallback }) {
        const group = infoPanel.querySelector(".header-name-group");
        if (group) group.outerHTML = renderStandardTitle(station);
        header.classList.remove("sy-calligraphy-header");
        delete header.dataset.syCaliLineId;
        document.body.classList.remove(ACTIVE_CLASS);
        document.body.style.removeProperty("--sy-cali-line-color");
        document.body.style.removeProperty("--sy-cali-on-color");
        // 城市侧在 onHeaderMounted 里对 header 做过的改动（地标换单色版、线路徽标按
        // 题字配色反色等）不会因为 header 未重建而自动还原，必须由城市侧自己收尾。
        // 钩子经参数传入而非直接引用：本函数在模块级，拿不到 register() 内的局部配置。
        onFallback?.(header, { station, info });
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
     * @param {(header: HTMLElement, context: object) => void} [config.onHeaderFallback]
     *        题字横图取不到、整块标题回退成标准中英文标题时的收尾钩子，
     *        context 提供 { station, info }。此时 header 并未重渲染，城市须自行撤销
     *        onHeaderMounted 里做过的改动（换过的地标单色版、按题字配色重画过的徽标等）
     * @returns {void}
     */
    function register(config = {}) {
        if (!window.StationBoard?.registerModule) return;

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
        const onHeaderFallback = typeof config.onHeaderFallback === "function"
            ? config.onHeaderFallback
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
                // 记录染色来源线路 ID，供城市侧徽标模块判定「哪个圆与 header 同色而需反白」。
                // 不能改用颜色距离：同色系的不同线路会被误判（沈阳 1 号线 #CF3517 与
                // 2 号线 #EE782D 的 RGB 距离仅 77，低于 80 阈值，青年大街站的 2 号线
                // 徽标会被 1 号线色 header 误反白）。回退取色时 lineId 为空，由城市侧兜底。
                if (picked.lineId) header.dataset.syCaliLineId = picked.lineId;
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

                // 探测题字图能否取到：成功则摘掉 is-pending 让题字显形，
                // 失败则整块回退标准中英文标题（否则遮罩缺失会让元素按 background-color
                // 填成一坨实心色块）。用一次 Image 预加载即可——与 mask 同源同 URL，
                // 命中同一份缓存，不会多下一张图。
                // 快速切站时旧站的探测可能晚到，故用 header 上记的站 ID 校验，
                // 免得把新站的标题改掉。
                header.dataset.syCaliStation = String(station.id);
                const titleEl = infoPanel.querySelector(".sy-calligraphy-title");
                const glyphProbe = new Image();
                glyphProbe.onload = () => titleEl?.classList.remove("is-pending");
                glyphProbe.onerror = () => {
                    if (!header.isConnected || header.dataset.syCaliStation !== String(station.id)) return;
                    fallbackToStandardTitle({
                        infoPanel,
                        header,
                        station,
                        info,
                        onFallback: onHeaderFallback
                    });
                };
                glyphProbe.src = info.image;
            }
        });

        if (window.StationBoard?.registerModule) {
            window.StationBoard.registerModule({
                id: `${idPrefix}-calligrapher-intro`,
                name: `${cityName}站名题字人简介`,
                targetTab: "station-info",
                // 7 = 插在「车站层级图」(5) 与「车站类型」(10) 之间；实际顺序以城市配置
                // shenyang.js 的 stationBoard.modules 为准（配置里的 order 优先于这里的值）
                order: 7,
                shouldRender({ station }) {
                    return Boolean(getCalligraphy(station));
                },
                render({ station }) {
                    const info = getCalligraphy(station);
                    if (!info) return "";
                    const person = info.calligrapher || {};

                    // 占位条目（pendingCalligrapher）：题字实物已确证、题写者尚未考证出来。
                    // 这与「题写者已知、题字横图未采集」是两种不同状态，故走单独的待考文案，
                    // 只陈述「本站有题字」这一事实，不臆测题写渊源。
                    // 条目可用 pendingNote 覆盖城市默认待考文案（如题字无落款、疑为集字的站）
                    if (!person.name) {
                        return renderCalligrapherRow(
                            "待考",
                            (info.pendingNote || pendingText)
                                + contributionNoteHtml("本站题写者的落款、印章或站内说明牌尚待考证。", station)
                        );
                    }

                    // 正文不再重复「本站站名由 X 题写」——折叠态那行已经写着「站名题写者 | X」，
                    // 重复一遍纯属占地方。只有题字写的是车站旧名时才需要点明（如人民广场站的
                    // 题字为「市府广场」），否则访客会以为题字写错了站名。
                    const lead = info.inscribedOldName
                        ? `本站旧名“${escapeHtml(info.inscribedOldName)}”由<strong>${escapeHtml(person.name)}</strong>题写。<br>`
                        : "";
                    // 生平简介以数据文件收录的官方口径为准；intro 需自带姓名主语
                    // （如「阎肃，男，生于……」），否则正文会以「男，」开头成为残句。
                    // 题写者已知但横图未采集时，一并向访客征求实拍照片
                    const note = info.image
                        ? ""
                        : contributionNoteHtml("本站题字横图尚未收录，标题栏暂以普通文字显示站名。", station);
                    const detail = `${lead}${escapeHtml(person.intro)}。${note}`;

                    return renderCalligrapherRow(escapeHtml(person.name), detail);
                },
                onMounted(infoPanel) {
                    bindCalligrapherToggle(infoPanel);
                    bindContributionButtons(infoPanel);
                }
            });
        }
    }

    window.CGoCalligraphy = { register };
})();
