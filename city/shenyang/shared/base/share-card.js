/**
 * CGo OpenMap - 共享层：车站卡 / 行程卡分享弹窗
 * (shared/base/share-card.js)
 *
 * 把车站信息板与行程结果面板上的分享按钮，改成「一张卡片图 + 三个动作」的分享弹窗：
 *   卡片预览（可保存为图片）· 复制链接 · 系统分享。
 *
 * ── 设计要点 ───────────────────────────────────────────────────────────
 * 1. **不碰 core**：两个 `.panel-share-btn`（车站面板那个由 core/script.js 直接绑 click、
 *    行程结果面板那个由 route-panel.js 绑 click）一律在 **document 捕获阶段扣下**
 *    （`stopPropagation` 让事件到不了目标节点，原监听器自然不触发），与
 *    `nearest-station.js` 接管 `#locate-btn` 是同一手法。core 与 route-panel 都不知道本模块存在。
 * 2. **不依赖 core 私有实现**：车站链接沿用 core 现有的 `?=nmlsta&{lineId}&{sid}tab{n}`
 *    格式（本模块自己按 DOM 复算，不改 core 的 `handleShare`，避免破坏既有分享）；
 *    车站 / 线路数据只读各城公开的 `stationsData` / `linesData`。
 * 3. **海报里禁用 `<cgo-icon>`**：它是 shadow DOM 组件（Lit + attachShadow），
 *    `cloneNode` 拿不到影子里的 svg，进 `foreignObject` 会渲染成**空白**。
 *    卡片内一律用**内联 `<svg>`**——线路徽标直接克隆车站面板里已注入好的那份
 *    （core 的 `.svg-icon-placeholder` → 内联 svg），其余图标用 `window.CGO.icon()`
 *    这个官方全局垫片现场生成。弹窗上的三个按钮在卡片外，照常用 `<cgo-icon>`。
 * 4. **出图交给 `base/poster.js`**（克隆 → 搬自定义属性 → 内联同源位图 → foreignObject → canvas）。
 *    本模块只负责「临时挂一份带 `is-poster` 的克隆去出图」。
 * 5. **二维码**用 `tools/vendor/qrcode-generator.js`（MIT，见同目录 LICENSE 文本），
 *    **首次用到时才注入**（同 mp4-muxer 的按需注入做法），不拖慢常规访问。
 * 6. **深链**：车站卡沿用 core 的 `?=nmlsta&…` 格式；行程卡新增
 *    `?city=&from=&to=[&need=luggage|accessible]`（缺省步行**不写参数**；
 *    另接受 `accessible=true` 归一到 `need=accessible`）。本模块自己读
 *    `location.search` 落地，**不动 core 的 `handleUrlParams`**（它只认 `?=nmlsta` 前缀，两者不冲突）。
 *
 * 对外接口：`window.CGoShareCard = { open }`（其余为内部实现）。
 * 样式表由脚本按自身 URL 注入（与 route-panel.css 同一做法）。
 *
 * @event cgo:share-card-opened  { kind: "station" | "route", link }
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    const MODAL_ID = "cgo-share-modal";
    const STYLE_ID = "cgo-share-style";
    const STATION_PANEL_ID = "info-panel";
    const PLAN_ID = "cgo-route-card";
    const RESULT_ID = "cgo-route-result";
    const CARD_WIDTH = 420;      // 海报设计宽度（px）
    const POSTER_SCALE = 2;      // 二倍图
    const SELF_URL = document.currentScript?.src || "";

    /* ── 样式注入：按脚本自身 URL 找同名 css ──
       注意要把 query（?v= 版本号）一并带过去：Service Worker 对静态资源「精确匹配优先」，
       CSS 的 URL 若恒定不变，改了样式也会一直被旧缓存命中。 */
    (function injectStyle() {
        if (document.getElementById(STYLE_ID) || !SELF_URL) return;
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = SELF_URL.replace(/share-card\.js(\?|$)/, "share-card.css$1");
        document.head.appendChild(link);
    })();

    /* ======================================================================
     * 小工具
     * ==================================================================== */

    const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

    /** 城市脚本顶层声明的数据：`stationsData` / `linesData` 只有部分城市挂到 window，
     *  故一律「typeof 守卫按名直读 + window 兜底」（与共享层既有约定一致）。 */
    function allStations() {
        try { return (typeof stationsData !== "undefined" && stationsData) || window.stationsData || {}; }
        catch (err) { return window.stationsData || {}; }
    }
    function allLines() {
        try { return (typeof linesData !== "undefined" && linesData) || window.linesData || []; }
        catch (err) { return window.linesData || []; }
    }

    const titleFull = () => (document.querySelector(".title-full")?.textContent || "").trim() || "CGo OpenMap";
    const currentCityId = () => window.CURRENT_CITY?.id
        || window.CityDataManager?.getCurrentCity?.()?.id || "";
    const toast = (message, type) => window.CGO?.showToast?.(message, type || "success");

    /**
     * 当前是否**非官方域**（测试环境）。
     *
     * 分享卡里的二维码指向当前页面 URL，只有官方域（`https://centralgo.site/dev/openmap/` 下）
     * 的码扫出来才是官方站点。本地 localhost、fork 的 GitHub Pages、以及任何第三方自建部署扫出来
     * 都是「别人的站点」——卡片被截图/打印传播出去会让人误以为是官方卡。
     *
     * 铁律是「纯前端零服务端」，没法跨域探测某个部署是否真的合并了本功能，所以不采用
     * 「改写成官方域」（那样反而会在官方域未合并时给出「打开城市却不规划路线」的静默降级）。
     * 改为**如实标注**：非官方域仍正常出码（保住自测与第三方自建的可用性），但卡片打「测试环境」
     * 水印，链接类动作首次点按给一次性提示，把「这是测试产物」讲清楚。
     */
    const OFFICIAL_HOST = "centralgo.site";
    const isTestHost = () => location.hostname !== OFFICIAL_HOST
        && !location.hostname.endsWith("." + OFFICIAL_HOST);

    /** 一次性提示的记号（每次会话各一次，避免每次点复制都唠叨） */
    const devNoticeShown = { copy: false, share: false };

    /** 取元素的纯文本：`<br>` 视作空格，并剔除城市模块注入的徽章图形（img / svg）。 */
    function textOf(el) {
        if (!el) return "";
        const clone = el.cloneNode(true);
        clone.querySelectorAll("br").forEach((br) => br.replaceWith(document.createTextNode(" ")));
        clone.querySelectorAll("img, svg").forEach((node) => node.remove());
        return (clone.textContent || "").replace(/\s+/g, " ").trim();
    }

    /** CGoUI 图标 → 内联 `<svg>` 字符串（海报区域不能用 `<cgo-icon>`，见文件头说明）。 */
    function iconSvg(name, size) {
        if (!name || typeof window.CGO?.icon !== "function") return "";
        try { return window.CGO.icon(name, { size: String(size || 20) }); } catch (err) { return ""; }
    }

    /** 把子树里的 `<cgo-icon>` 就地换成内联 svg（**须在节点挂进文档前**跑，免得影子白渲染一遍）。 */
    function inlineIcons(root) {
        root.querySelectorAll("cgo-icon").forEach((host) => {
            const svgNode = iconNode(host.getAttribute("name"), host.getAttribute("size"));
            if (!svgNode) { host.remove(); return; }
            const cls = ["cgo-share-icon"].concat(Array.from(host.classList)).join(" ");
            svgNode.setAttribute("class", cls);
            const style = host.getAttribute("style");
            if (style) svgNode.setAttribute("style", style);
            host.replaceWith(svgNode);
        });
    }
    function iconNode(name, size) {
        const html = iconSvg(name, size);
        if (!html) return null;
        const tpl = document.createElement("template");
        tpl.innerHTML = html;
        return tpl.content.firstElementChild || null;
    }

    /* ======================================================================
     * 二维码（第三方 qrcode-generator，首次用到才注入）
     * ==================================================================== */

    let qrcodeLoading = null;

    /** 注入 vendor 的 qrcode-generator.js（沿用脚本自身的 ?v= 版本串），返回是否可用。 */
    function ensureQrcode() {
        if (typeof window.qrcode === "function") return Promise.resolve(true);
        if (qrcodeLoading) return qrcodeLoading;
        qrcodeLoading = new Promise((resolve) => {
            if (!SELF_URL) return resolve(false);
            const base = new URL(SELF_URL);
            const url = new URL("../tools/vendor/qrcode-generator.js", base);
            url.search = base.search;      // 带上同一版本串，避免旧缓存
            const script = document.createElement("script");
            script.src = url.href;
            script.onload = () => resolve(typeof window.qrcode === "function");
            script.onerror = () => {
                script.remove();           // 失败的标签留在 head 里没有意义，移除后重试才会插入新的一份
                resolve(false);
            };
            document.head.appendChild(script);
        }).then((ok) => {
            // 失败态不缓存：脚本 404 / 断网时若把 rejected 结果一直挂着，
            // 恢复网络后再打开分享卡也永远不会重试。清空后下次调用会重新注入。
            if (!ok) qrcodeLoading = null;
            return ok;
        });
        return qrcodeLoading;
    }

    /**
     * 建码：型号按容量**逐级试到能装下为止**（本 vendor 版本不做自动选型，
     * typeNumber 0 会算出非法模块数），纠错等级取 M（约 15% 冗余，够贴屏幕扫）。
     */
    function qrOf(text) {
        const data = String(text || "");
        if (!data || typeof window.qrcode !== "function") return null;
        for (let type = 2; type <= 40; type += 1) {
            try {
                const qr = window.qrcode(type, "M");
                qr.addData(data);
                qr.make();
                return qr;
            } catch (err) { /* 容量不够：换更大的型号 */ }
        }
        return null;
    }

    /** 二维码 SVG（`scalable` 不写死宽高，尺寸交给 CSS；自带白底以便在深色卡上仍可扫）。 */
    function qrSvg(text) {
        const qr = qrOf(text);
        if (!qr) return "";
        try { return qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true }); }
        catch (err) { return ""; }
    }

    /* ======================================================================
     * 链接
     * ==================================================================== */

    /** 站点是否在一条线上（兼容分支线：`stationIds` 或 `stationIds-way1/-way2`） */
    function lineHasStation(line, sid) {
        const groups = [line.stationIds];
        if (line.hasbranch) groups.push(line["stationIds-way1"], line["stationIds-way2"]);
        return groups.some((ids) => Array.isArray(ids) && ids.includes(sid));
    }

    /** 车站面板当前站 ID：核心选站时会给 `#map-content` 里的 `#node_{sid}` 加 `.active`。 */
    function activeStationId() {
        const node = document.querySelector("#map-content [id^='node_'].active")
            || document.querySelector("[id^='node_'].active");
        return node ? node.id.slice(5) : "";
    }

    /**
     * 车站分享链接：**完全复刻 core 现有的 `?=nmlsta&{lineId}&{sid}tab{n}` 格式**
     * （见 core/script.js 的 handleShare）。lineId 取当前激活线路页签对应的线路，
     * 落在「车站信息」页签时回退到本站首条经停线路；tab{n} 为页签在面板里的序号（1 起）。
     * 哪怕格式上 lineId 实际不参与落地解析，也照抄，免得与既有分享链路分叉。
     */
    function stationLink(panel) {
        const sid = activeStationId();
        if (!sid) return "";
        let lineId = "";
        let tabSuffix = "";
        const activeTab = panel?.querySelector(".tab-item.active");
        if (activeTab) {
            const tabs = Array.from(panel.querySelectorAll(".tab-item"));
            tabSuffix = `tab${tabs.indexOf(activeTab) + 1}`;
            if (activeTab.dataset.tabIndex !== "station-info") {
                const name = textOf(activeTab);
                lineId = allLines().find((line) => line.name === name)?.id || "";
            }
        }
        if (!lineId) {
            lineId = allLines().find((line) => !line.isPointOnly && lineHasStation(line, sid))?.id || "";
        }
        return `${location.origin}${location.pathname}?=nmlsta&${lineId}&${sid}${tabSuffix}`;
    }

    /** 行程卡深链：只带 OpenMap 自己的参数（city / from / to / need），不接 /map 的语义。 */
    function routeLink() {
        const params = new URLSearchParams();
        const city = currentCityId();
        if (city) params.set("city", city);
        if (lastRoute?.from) params.set("from", lastRoute.from);
        if (lastRoute?.to) params.set("to", lastRoute.to);
        const need = activeNeed();
        if (need) params.set("need", need);
        return `${location.origin}${location.pathname}?${params.toString()}`;
    }

    /* ======================================================================
     * 行程状态快照（供深链的 from / to / need）
     * ==================================================================== */

    /** 最近一次规划的起讫站 ID（route-panel 的 `cgo:route-opened` / `cgo:route-planned` 都带）。 */
    let lastRoute = null;
    function cacheRouteEnds(event) {
        const detail = event?.detail || {};
        if (detail.from && detail.to) lastRoute = { from: String(detail.from), to: String(detail.to) };
    }
    document.addEventListener("cgo:route-opened", cacheRouteEnds);
    document.addEventListener("cgo:route-planned", cacheRouteEnds);

    /** 当前出行需求（需求分段控件 `.cgo-rt-need-opt.is-on`，空串 = 步行） */
    const activeNeed = () => document.querySelector(`#${PLAN_ID} .cgo-rt-need-opt.is-on`)?.dataset.need || "";

    /**
     * 取行程规划面板里的元素：**移动端核心会把 `.panel-footer` 整块挪进 `.cgo-mobile-sheet-dock`**
     * （面板之外），故先面板内找、再全局兜一次。仅用于 `route-panel.js` 独有的类名
     * （如「查询路线」按钮 `.cgo-rt-go`，全文档唯一）——`.cgo-rt-need-opt` 这类被出入口页签
     * 复用的类名**不能**全局兜底，否则会在车站面板里点错一组。
     */
    function planEl(selector) {
        return document.getElementById(PLAN_ID)?.querySelector(selector) || document.querySelector(selector);
    }

    /** 当前需求徽记的内联 svg（无需求返回空串） */
    function activeNeedIcon() {
        const on = document.querySelector(`#${PLAN_ID} .cgo-rt-need-opt.is-on`);
        if (!on?.dataset.need) return "";
        return iconSvg(on.querySelector("cgo-icon")?.getAttribute("name"), 15);
    }

    /** 需求名（「携带行李」「无障碍」）：取自城市的 `CGO_EXIT_FILTERS`，取不到返回空串 */
    function needLabel(needId) {
        if (!needId) return "";
        const filters = Array.isArray(window.CGO_EXIT_FILTERS) ? window.CGO_EXIT_FILTERS : [];
        return filters.find((f) => f.id === needId)?.name || "";
    }

    /**
     * 行程卡标题里的需求标记：**徽记 + 文字**。
     * 只画图标的话，分享出去谁也认不出那个小图标是什么（需求正是这张卡的卖点之一）；
     * 城市未在 `CGO_EXIT_FILTERS` 里给出名字时退化为只有图标。
     */
    function needMarkHtml() {
        const need = activeNeed();
        if (!need) return "";
        const label = needLabel(need);
        return `<span class="cgo-share-need">${activeNeedIcon()}${label ? `<span>${esc(label)}</span>` : ""}</span>`;
    }

    /* ======================================================================
     * 卡片
     * ==================================================================== */

    const BRAND_IMG = "./assets/icons/mapicon.png";

    /** 车站卡：站名 → 英文名 → 线路徽标 → 二维码 → 提示语（品牌行仅出图时显示） */
    function buildStationCard(panel) {
        if (!panel) return null;
        const cn = textOf(panel.querySelector(".panel-cn-name"));
        if (!cn) return null;
        const en = textOf(panel.querySelector(".panel-en-name"));
        const badges = panel.querySelector(".panel-badges");

        const card = document.createElement("div");
        card.className = "cgo-share-card cgo-share-card--station";
        card.innerHTML = `
            <div class="cgo-share-sta-name">${esc(cn)}</div>
            ${en ? `<div class="cgo-share-sta-en" lang="en">${esc(en)}</div>` : ""}
            <div class="cgo-share-sta-lines"></div>
            <div class="cgo-share-qr" data-cgo-qr></div>
            <div class="cgo-share-hint">扫码查看车站详细信息</div>
            <div class="cgo-share-brand">
                <span>CGo OpenMap · ${esc(titleFull())}</span>
                <img src="${BRAND_IMG}" alt="" width="44" height="44">
            </div>
        `;
        const lines = card.querySelector(".cgo-share-sta-lines");
        if (badges && badges.children.length) lines.appendChild(badges.cloneNode(true));
        else lines.remove();
        return { card, link: stationLink(panel), copyText: null, shareTitle: `CGo OpenMap · ${cn}`, fileName: safeFileName(`CGo OpenMap-${cn}.png`) };
    }

    /**
     * 下载文件名净化：站名 / 需求名都是城市给的自由文本，Windows 与 macOS 都不接受
     * `\ / : * ? " < > |` 与控制字符（浏览器会静默改名或截断），统一换成「-」。
     */
    const safeFileName = (name) => String(name).replace(/[\\/:*?"<>|]/g, "-").replace(/[\u0000-\u001F]/g, "").trim();

    /**
     * 车站卡的线路徽标「按原形重画」钩子（**可选**，城市自行实现）。
     *
     * 面板里那份徽标是**为染色 header 特化**过的渲染结果 —— 例如沈阳：题字（calligraphy）给
     * `.panel-header` 染上线路线色后，徽标会按该底色**反色**画一版（同线路的圆底/数字对调防融合）。
     * 克隆进卡片后，这份反色就成了**无源之水**（卡片里没有染色 header），故卡片挂进文档后回调本钩子，
     * 由城市按「无染色上下文」重画一遍：
     *
     *     window.CGO_SHARE_BADGES = (container) => { … container.querySelectorAll(":scope > .line-badge") … }
     *
     * `container` 是卡片里的那个 `.panel-badges` 克隆（已在文档中，量得到尺寸）。
     * ⚠️ 钩子里画出的图形必须是**内联 `<svg>`**，不能用 `<cgo-icon>`（海报出图见文件头说明）。
     * 未声明该钩子的城市（用 core 的 `icon@NN` 徽标，本就与 header 染色无关）无需任何处理。
     */
    function refreshCardBadges(card) {
        const hook = window.CGO_SHARE_BADGES;
        if (typeof hook !== "function") return;
        const container = card.querySelector(".cgo-share-sta-lines > .panel-badges");
        if (!container) return;
        try { hook(container); } catch (err) { console.warn("[CGoShareCard] 线路徽标重画失败", err); }
    }

    /**
     * 给卡片打「测试环境」角标（右上角，绝对定位）。
     *
     * 非官方域的二维码指向本地 / fork 地址，卡片被截图传播会让人误以为是官方卡，故明确标注。
     * 只出文字不带 `<cgo-icon>`（海报区禁用 shadow DOM 图标，见文件头说明）。
     */
    function stampTestBadge(card) {
        card.classList.add("is-test");
        const badge = document.createElement("div");
        badge.className = "cgo-share-test";
        badge.textContent = "测试环境";
        card.appendChild(badge);
    }

    /**
     * 行程卡：标题（需求徽记 + 起点 → 终点）→ 处理过的结果正文 → footer（二维码 + 双行引导 + 品牌图标）
     */
    function buildRouteCard() {
        const result = document.getElementById(RESULT_ID);
        const body = result?.querySelector(".cgo-rt-result-body");
        if (!result || !body) return null;
        const { from, to } = routeEnds(result);

        const card = document.createElement("div");
        card.className = "cgo-share-card cgo-share-card--route";
        card.innerHTML = `
            <div class="cgo-share-rt-head">
                ${needMarkHtml()}
                <span class="cgo-share-od">
                    <b>${esc(from)}</b>
                    <span class="cgo-share-od-arrow">${iconSvg("arrow-right", 16)}</span>
                    <b>${esc(to)}</b>
                </span>
            </div>
            <div class="cgo-share-rt-body"></div>
            <div class="cgo-share-rt-foot">
                <div class="cgo-share-qr" data-cgo-qr></div>
                <div class="cgo-share-rt-tip">
                    <b>扫码查看行程</b>
                    <span>使用「${esc(titleFull())}」继续</span>
                </div>
                <div class="cgo-share-brand"><img src="${BRAND_IMG}" alt="" width="36" height="36"></div>
            </div>
        `;
        card.querySelector(".cgo-share-rt-body").appendChild(processedResultBody(body));

        const link = routeLink();
        // 「复制链接」= 原分享文案 + 深链（原文案由 route-panel 单一真源给出，见 CGoRoutePanel.shareText）
        const text = window.CGoRoutePanel?.shareText?.() || "";
        // 文件名带上起讫站（+ 需求）：固定叫「CGo OpenMap-行程.png」的话，连着导出几张会互相覆盖。
        const needName = needLabel(activeNeed());
        return {
            card,
            link,
            copyText: text ? `${text}\n请参考：${link}` : link,
            shareTitle: `CGo OpenMap · ${from} → ${to}`,
            fileName: safeFileName(`CGo OpenMap-${from}→${to}${needName ? `（${needName}）` : ""}.png`)
        };
    }

    /**
     * 行程卡标题的起讫站名。
     *
     * 浮层形态的结果面板标题栏里是 `.cgo-rt-od-from` / `.cgo-rt-od-to`；
     * **固定侧栏形态没有这两个节点**（标题改由 `.section-title-text` 承载）—— 只认前者的话
     * 标题会整个空掉（实测：桌面侧栏下导出，起终点是空的）。故取不到时退回「最近一次规划的
     * 起讫站 ID + 站名」（`cgo:route-planned` 缓存）。
     */
    function routeEnds(result) {
        let from = textOf(result.querySelector(".cgo-rt-od-from"));
        let to = textOf(result.querySelector(".cgo-rt-od-to"));
        if (!from || !to) {
            const stations = allStations();
            if (!from) from = stations[lastRoute?.from]?.cn || "";
            if (!to) to = stations[lastRoute?.to]?.cn || "";
        }
        return { from: from || "起点", to: to || "终点" };
    }

    /**
     * 结果正文的三道后处理（都在**克隆**上做，不碰活面板）：
     *   ① 删纯设施行（`data-role="fac"`，见 route-panel.js 的行级语义标记说明）；
     *   ② 展开区一律折起（`[data-list]` / `.cgo-fac-detail` 置 hidden，并写死 `display:none`，
     *      以防 UA 的 `[hidden]` 规则不随 `loadCss()` 进 foreignObject）；
     *   ③ 摘掉展开箭头 `.cgo-rt-expand-caret`（折叠态不该出现，且它也是 shadow DOM 图标）。
     * 最后把残余的 `<cgo-icon>` 换成内联 svg，并清掉交互残留属性。
     */
    function processedResultBody(source) {
        const body = source.cloneNode(true);
        body.removeAttribute("id");

        body.querySelectorAll('[data-role="fac"]').forEach((el) => el.remove());
        body.querySelectorAll("[data-list], .cgo-fac-detail").forEach((el) => {
            el.setAttribute("hidden", "");
            el.style.display = "none";
        });
        body.querySelectorAll(".cgo-rt-expand-caret").forEach((el) => el.remove());
        ["data-jump", "data-expand", "tabindex"].forEach((attr) => {
            body.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
        });
        inlineIcons(body);
        return body;
    }

    /* ======================================================================
     * 弹窗与三个动作
     * ==================================================================== */

    /** 当前弹窗里的分享目标 */
    let current = null;

    function modalEl() {
        let el = document.getElementById(MODAL_ID);
        if (el) return el;
        el = document.createElement("cgo-modal");
        el.id = MODAL_ID;
        el.setAttribute("max-width", "480px");
        // 关闭（遮罩 / Esc / 关闭键）即清空内容：卡片里的内联 svg 与 data URL 不必留在 DOM 里
        el.addEventListener("cgo-close", () => { el.innerHTML = ""; current = null; });
        document.body.appendChild(el);
        return el;
    }

    function shellHtml() {
        return `
            <div class="cgo-share">
                <div class="cgo-share-stage"></div>
                <div class="cgo-share-actions">
                    <cgo-button class="cgo-share-btn" variant="primary" icon="download" data-cgo-act="save"><span>下载图片</span></cgo-button>
                    <cgo-button class="cgo-share-btn" variant="info" icon="link" data-cgo-act="copy"><span>复制链接</span></cgo-button>
                    <cgo-button class="cgo-share-btn" variant="info" icon="external" data-cgo-act="share"><span>分享链接</span></cgo-button>
                </div>
            </div>
        `;
    }

    /**
     * 打开分享弹窗。
     * @param {"station"|"route"} kind
     * @param {HTMLElement} [panel] 车站面板（kind 为 station 时必需）
     */
    function open(kind, panel) {
        const built = kind === "route" ? buildRouteCard() : buildStationCard(panel);
        if (!built) return;

        const modal = modalEl();
        modal.title = kind === "route" ? "分享行程" : "分享车站";
        modal.innerHTML = shellHtml();
        modal.querySelector(".cgo-share-stage").appendChild(built.card);
        refreshCardBadges(built.card);   // 徽标按「无染色 header」的原形重画（城市可选钩子）
        modal.querySelectorAll("[data-cgo-act]").forEach((btn) => {
            btn.addEventListener("click", () => onAction(btn.dataset.cgoAct, btn));
        });
        modal.open = true;

        // 非官方域：卡片打「测试环境」水印（预览与导出图都带 —— renderPoster 是克隆本卡，
        // is-test 类与水印节点一并被克隆进 foreignObject）。
        if (isTestHost()) stampTestBadge(built.card);

        const qrHost = built.card.querySelector("[data-cgo-qr]");
        const ready = ensureQrcode().then((ok) => {
            if (!ok || !qrHost) return "failed";
            const svg = qrSvg(built.link);
            if (!svg) return "failed";
            qrHost.innerHTML = svg;
            return "ok";
        });
        current = Object.assign({ kind }, built, { ready });
        document.dispatchEvent(new CustomEvent("cgo:share-card-opened", { detail: { kind, link: built.link } }));
    }

    function onAction(act, btn) {
        if (act === "save") return saveImage(btn);
        if (act === "copy") return copyLink();
        if (act === "share") return shareLink();
    }

    /**
     * 出图：临时挂一份带 `is-poster` 的克隆（显示品牌行），渲染完即摘。
     *
     * ⚠️ 挪到屏幕外的定位必须加在**外层容器**上，**不能写进卡片自己的内联样式** ——
     * `position: fixed; left: -10000px` 会被序列化进那份导出的 SVG，卡片在栅格化文档里
     * 同样被摆到画布外 10000px 处，于是**整张图全空**（尺寸对、内容白，实测踩过）。
     */
    function renderPoster(card) {
        const clone = card.cloneNode(true);
        clone.classList.add("is-poster");
        clone.style.width = `${CARD_WIDTH}px`;
        const host = document.createElement("div");
        host.style.cssText = "position:fixed; left:-10000px; top:0; margin:0; pointer-events:none;";
        host.appendChild(clone);
        document.body.appendChild(host);
        return window.CGoPoster.render(clone, { width: CARD_WIDTH, scale: POSTER_SCALE, heightPad: 24 })
            .finally(() => host.remove());
    }

    async function saveImage(btn) {
        if (!current || typeof window.CGoPoster?.render !== "function") return;
        btn.toggleAttribute("disabled", true);
        try {
            // 二维码是异步注入的，出图前等它落位。失败不阻断出图（图仍然有分享价值），
            // 但绝不能报「已保存」了事——否则用户会以为手里这张图是带可扫码的完整卡。
            const qrState = await current.ready;
            let canvas = await renderPoster(current.card);
            // 裁掉四周透明空白（字体没内联上时底部会多出一条「黑边」，见 CGoPoster.trim）
            if (typeof window.CGoPoster?.trim === "function") canvas = window.CGoPoster.trim(canvas);
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
            if (!blob) throw new Error("canvas 未产出 PNG");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = current.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            if (qrState === "ok") toast("分享卡已保存为图片");
            else toast("二维码未能生成，已保存不含二维码的分享卡", "warning");
        } catch (err) {
            console.warn("[CGoShareCard] 出图失败", err);
            toast("出图失败，可改用「复制链接」分享", "error");
        } finally {
            btn.toggleAttribute("disabled", false);
        }
    }

    /**
     * 测试环境的一次性提示：非官方域下链接指向本地 / fork 地址，分享出去对方打不开官方内容。
     * 每个动作（复制 / 分享）每次会话各提示一次，之后不再唠叨。
     */
    function warnTestLink(action) {
        if (!isTestHost() || devNoticeShown[action]) return;
        devNoticeShown[action] = true;
        toast("当前为测试环境，链接指向本地 / 测试地址", "warning");
    }

    function copyLink() {
        if (!current) return;
        warnTestLink("copy");
        writeClipboard(current.copyText || current.link).then((ok) => {
            toast(ok ? "链接已复制" : "复制失败，请手动复制", ok ? "success" : "error");
        });
    }

    /** 系统分享：**只分享链接本身**（不带上卡片图，也不带行程文案）。 */
    function shareLink() {
        if (!current) return;
        warnTestLink("share");
        if (typeof navigator.share === "function") {
            navigator.share({ title: current.shareTitle, url: current.link })
                .catch((err) => {
                    // 用户主动取消（AbortError）不是失败：此时替他复制链接反而像「点取消却动了剪贴板」
                    if (err && err.name === "AbortError") return;
                    copyLink();
                });
            return;
        }
        copyLink();
    }

    /** 剪贴板：优先异步 API，非 https / 老浏览器退回 execCommand。 */
    async function writeClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) { /* 退回到 execCommand 通道 */ }
        try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.cssText = "position:fixed; left:-10000px; top:0;";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return ok;
        } catch (err) {
            return false;
        }
    }

    /* ======================================================================
     * 接管两个分享按钮（document 捕获阶段扣下）
     * ==================================================================== */

    function onDocumentClick(event) {
        const btn = event.target?.closest?.(".panel-share-btn");
        if (!btn) return;
        // 地图小工具入口复用了 .panel-share-btn 的样式（shared/tools/map-tools.js 的
        // cgo-mt-inline-btn），但它是工具入口、不是分享入口：捕获阶段必须放行，
        // 否则会抢在按钮自身的 click 处理器之前弹出分享卡
        if (btn.classList.contains("cgo-mt-inline-btn")) return;
        // 行程结果面板的分享按钮：带 data-share="route"
        if (btn.dataset.share === "route") {
            event.preventDefault();
            event.stopPropagation();
            open("route");
            return;
        }
        // 车站面板的分享按钮：面板内没有 data-* 标记，靠所在容器认
        const panel = btn.closest(`#${STATION_PANEL_ID}`);
        if (!panel) return;      // 余下的（如路线栏的「查看全程」）一律放行
        event.preventDefault();
        event.stopPropagation();
        open("station", panel);
    }
    document.addEventListener("click", onDocumentClick, true);

    /* ======================================================================
     * 深链：?city=&from=&to=[&need=luggage|accessible]
     * ==================================================================== */

    /** 读出可落地的行程深链（缺站 / 非法站 ID 一律当作没有）。 */
    function readRouteLink() {
        const params = new URLSearchParams(location.search);
        const from = params.get("from");
        const to = params.get("to");
        if (!from || !to) return null;
        let need = params.get("need") || "";
        if (!need && params.get("accessible") === "true") need = "accessible";   // 母产品写法 → 归一
        if (need !== "luggage" && need !== "accessible") need = "";              // 其余 /map 语义一律不接
        const stations = allStations();
        if (!stations[from] || !stations[to]) return null;
        return { from, to, need };
    }

    /**
     * 落地：展开行程面板、复现需求，并**立刻查询一次**（二维码上写的是「扫码查看行程」，
     * 落地就该看见这趟行程）。轮询等数据脚本就绪（它们晚于 `{city}.js` 执行）。
     */
    function bootRouteLink() {
        const spec = readRouteLink();
        if (!spec) return;
        let tries = 0;
        let opened = false;
        const giveUp = () => tries > 100;    // 约 10s 仍未就绪就放弃，不影响其余功能
        const tick = () => {
            if (!window.CGoRoutePanel?.open || !allStations()[spec.from]) {
                if (!giveUp()) setTimeout(tick, 100);
                tries += 1;
                return;
            }
            if (!opened) {
                window.CGoRoutePanel.open({ from: spec.from, to: spec.to });
                opened = true;
            }
            // ⚠️ `open()` 返回时面板已在文档里，但**它底部的操作行还不在**：核心的移动端停靠栏 /
            // 底栏模块会先把 `.panel-footer`（含「查询路线」按钮与状态行）摘出去，过一拍才挂回停靠栏。
            // 实测：面板已 `connected`，而 `.cgo-rt-go` 要 ~150ms 后才拿得到 —— 这一步等不到就点了等于没点。
            if (!planEl(".cgo-rt-go")) {
                if (!giveUp()) setTimeout(tick, 100);
                tries += 1;
                return;
            }
            // 需求分段控件：走与用户点击**完全相同**的路径（含不合规口的自动替换与结果重渲）。
            // 须早于「查询路线」—— 内核建图不吃需求，但换乘方式与口合规要在出结果前后都生效。
            if (spec.need) {
                document.querySelector(`#${PLAN_ID} .cgo-rt-need-opt[data-need="${spec.need}"]`)?.click();
            }
            // openPlan 只把起终点填好、清空旧结果（`refreshResult()` 不发起规划），
            // 故这里补一次「查询路线」按钮点击 —— 与用户按一下按钮完全等价，route-panel 无需新增接口。
            planEl(".cgo-rt-go").click();
            // 出结果依赖异步建图（坐标索引 / 内核），万一这一下赶上未就绪，`runPlan` 只会写一句状态、
            // 不报错也不出结果 —— 故未出结果前有限次再点，最多 3 次，等价于用户自己多按几下。
            let left = 3;
            const verify = () => {
                if (document.getElementById(RESULT_ID) || left-- <= 0) return;
                planEl(".cgo-rt-go")?.click();
                setTimeout(verify, 800);
            };
            setTimeout(verify, 800);
        };
        tick();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootRouteLink);
    else bootRouteLink();

    window.CGoShareCard = { open };
}());
