/**
 * CGo OpenMap - 沈阳站名题字模块
 *
 * 沈阳地铁部分车站的站名由名人或书法家题写。本模块注册两个信息板模块：
 *
 *   1. shenyang-calligraphy-title（slot: header, order: 20）
 *      接管内置 header-title：**有题字横图**的车站以题字图替换中文站名，
 *      英文站名保留；其余车站（包括仅收录了题写者简介、尚无题字图的站）
 *      回退为内置的标准中英文标题结构。
 *      城市配置中需将内置 "header-title" 置为 enabled: false。
 *
 *   2. shenyang-calligrapher-intro（targetTab: station-info, order: 12）
 *      在车站信息页签简要介绍题字人生平，卡片 DOM 走共享层 CGoTipCard。
 *      只要数据文件收录了 calligrapher 即显示，不要求该站有题字横图；
 *      若该站题字写的是车站旧名（inscribedOldName），引导句会相应改写。
 *
 * 主题适配：题字素材为黑底白字图，标题中以 CSS luminance 蒙版将黑底褪为
 * 透明、字迹着色为标题栏当前文字色（currentColor），亮 / 暗主题自动切换。
 *
 * 兼容性注意：必须保留 .panel-cn-name 类名与可读站名文本
 * （.sy-calligraphy-text 为裁剪但可读取的文本），core/script.js 在面板
 * 吸附侧栏时会读取 .panel-cn-name 的 innerText 同步侧栏标题。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    /**
     * 换乘题字站 header 取色优先级（按稳定线路 ID，不依赖 relatedLinesInfo 的排序）。
     * 目前已知有题字的为 1、2、3 号线；表中列入全部运营线以备后续扩展。
     */
    const LINE_COLOR_PRIORITY = ["SYM01", "SYM02", "SYM09", "SYM10", "SYM04", "SYM03"];

    const FANGCHENG_MONO_SRC = "./city/shenyang/assets/fangcheng_mono.svg";

    /** 题字站激活时挂在 body 上的类名：供 header 之外的元素（如移动端顶部填充层）联动染色 */
    const SY_ACTIVE_CLASS = "sy-calligraphy-active";

    /** 按固定优先级选出题字 header 的代表线路色，均未命中时回退首条经停线路 */
    function pickHeaderLineColor(relatedLinesInfo) {
        const list = Array.isArray(relatedLinesInfo) ? relatedLinesInfo : [];
        for (const lineId of LINE_COLOR_PRIORITY) {
            const hit = list.find((info) => info?.id === lineId && info.lineColor);
            if (hit) return { lineId, color: hit.lineColor };
        }
        return list[0]?.lineColor
            ? { lineId: list[0].id, color: list[0].lineColor }
            : null;
    }

    function getCalligraphy(station) {
        const data = window.CALLIGRAPHY_DATA;
        if (!data || !station) return null;
        return data[station.id] || null;
    }

    /**
     * 该站是否有可用的题字横图。
     * 数据文件中部分站点（如 2 号线各站）只有官方公布的题写者简介、没有题字
     * 横图，这类站点不接管标题栏站名，只在车站信息页签显示题写者简介卡片。
     */
    function hasGlyphImage(info) {
        return Boolean(info && info.image);
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

    if (!window.StationBoard?.registerModule) return;

    window.StationBoard.registerModule({
        id: "shenyang-calligraphy-title",
        name: "沈阳题字站名标题",
        slot: "header",
        order: 20,
        shouldRender() {
            return true;
        },
        render(context) {
            const station = context.station || {};
            const info = getCalligraphy(station);
            // 仅有题写者简介、无题字横图的站不接管标题，回退标准中英文标题
            return hasGlyphImage(info)
                ? renderCalligraphyTitle(station, info)
                : renderStandardTitle(station);
        },
        onMounted(infoPanel, context) {
            // 仅「有题字横图」的站把整个标题栏染为首条经停线路的标志色。
            // .panel-header 外壳由 core 装配，模块只能通过挂载后修饰；
            // 面板每次重渲染 header 均为全新 DOM，其余站不会残留该 class。
            const station = context.station || {};
            if (!infoPanel || !hasGlyphImage(getCalligraphy(station))) {
                // 无题字横图的站需清掉 body 上的染色状态，否则移动端顶部填充层
                // 会残留上一站的线路色
                document.body.classList.remove(SY_ACTIVE_CLASS);
                document.body.style.removeProperty("--sy-cali-line-color");
                document.body.style.removeProperty("--sy-cali-on-color");
                return;
            }
            const header = infoPanel.querySelector(".panel-header");
            if (!header) return;

            // 取色按固定线路优先级 1→2→9→10→4→3（稳定线路 ID，不随线路排序漂移）
            const picked = pickHeaderLineColor(context.relatedLinesInfo)
                || (station.lineColors?.[0] ? { lineId: "", color: station.lineColors[0] } : null);
            if (!picked?.color) return;

            const onColor = window.ShenyangUi?.getReadableTextColor?.(picked.color) || "#ffffff";
            header.classList.add("sy-calligraphy-header");
            // 染色变量挂在 body 而非 header：body 是 header 与移动端顶部填充层
            // (.mobile-top-bar-backdrop，位于 main.html 的 body 级) 的公共祖先，
            // 一处赋值即可同时驱动两处颜色，避免两处各存一份
            document.body.classList.add(SY_ACTIVE_CLASS);
            document.body.style.setProperty("--sy-cali-line-color", picked.color);
            document.body.style.setProperty("--sy-cali-on-color", onColor);

            // 方城地标在染色 header 上：深底（白字）切换为白色单色版；
            // 浅底（深字，如 10 号线浅绿）保留彩色原图——目前仅有白色 mono，
            // 待补充深色 mono 后在此扩展。header 每次重建，无需手工还原。
            const decoration = header.querySelector(".shenyang-station-header-decoration");
            if (decoration) {
                const isDarkGround = onColor.toLowerCase() === "#ffffff";
                if (isDarkGround) {
                    decoration.dataset.syOriginalSrc = decoration.dataset.syOriginalSrc || decoration.getAttribute("src");
                    decoration.setAttribute("src", FANGCHENG_MONO_SRC);
                }
            }
        }
    });

    const tipCard = window.CGoTipCard;
    if (tipCard) {
        window.StationBoard.registerModule({
            id: "shenyang-calligrapher-intro",
            name: "沈阳站名题字人简介",
            targetTab: "station-info",
            order: 12,
            shouldRender({ station }) {
                return Boolean(getCalligraphy(station));
            },
            render({ station }) {
                const info = getCalligraphy(station);
                if (!info) return "";
                const person = info.calligrapher || {};
                if (!person.name) return "";

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
    } else {
        console.warn("[shenyang_calligraphy] 共享层 CGoTipCard 未加载，题字人简介卡片未注册");
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-calligraphy" }
    }));
})();
