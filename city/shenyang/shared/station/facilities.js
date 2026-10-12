/**
 * CGo OpenMap - 车站设施共享层
 *
 * 一个板块容纳两种语义相近的站内空间信息，避免它们在信息板里并列：
 *   1. 车站层级图（可选，官网剖面图热链）——默认展开，可点「收起」；
 *   2. 车站设施位置（一行一处设施，左侧「图标 + 名称」，右侧位置条数与开合按钮）。
 *
 * 城市侧只提供「数据长什么样」与「类型对应的名字和图标」，渲染、开合、来源标注都在这里：
 *
 *   CGoFacilities.register({
 *       idPrefix: "shenyang",
 *       dataGlobals: ["SHENYANG_STATION_FACILITIES"],
 *       types: { toilet: { name: "卫生间", icon: "toilet" }, … },
 *       levelMap: { global: "SHENYANG_STATION_LEVEL_MAP" },   // 可选
 *       sourceNote: "以上内容摘自沈阳地铁官网，与现场可能不一致"
 *   });
 *
 * 数据由各城的离线抓取脚本生成（drunk/tools/facilities/，开发期工具、不入版本库），结构见生成文件头部；
 * 位置段是自由文本，按来源原文逐段展示，不做结构化。换乘站的段落可带 line（线路 ID），
 * 渲染时标出线名；由两条线共用的位置在抓取阶段已合并、不带 line，因此也就不会标线名。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const STYLE_FLAG_ATTR = "data-cgo-facilities-style";

    /* ── 样式注入：按脚本自身 URL 找同名 css，query（?v=）原样搬过去。
       Service Worker 对静态资源是「精确匹配优先」，CSS 的 URL 若恒定不变，改了样式也会被旧缓存命中。 ── */
    const SELF_URL = document.currentScript?.src || "";

    function injectStyle() {
        if (!SELF_URL) return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = SELF_URL.replace(/facilities\.js(\?|$)/, "facilities.css$1");
        link.setAttribute(STYLE_FLAG_ATTR, "");
        (document.head || document.documentElement).appendChild(link);
    }

    const escapeAttribute = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    const escapeHtml = (value) => escapeAttribute(value);

    /** 城市配置注册表：key 为模块稳定 ID */
    const registered = new Map();

    /** 线路稳定 ID → 中文线名；linesData 是各城 data_lines.js 的全局词法绑定 */
    function getLineName(lineId) {
        if (typeof linesData === "undefined" || !Array.isArray(linesData)) return lineId;
        return linesData.find((line) => line?.id === lineId)?.name || lineId;
    }

    /** 从若干候选全局名里取第一个可用的数据表 */
    function pickData(globals) {
        for (const name of globals || []) {
            const table = window[name];
            if (table && typeof table === "object") return table;
        }
        return null;
    }

    /**
     * 位置段统一成 { text, line }。
     * 抓取脚本对单线站存纯字符串、多线换乘站才带 line（见数据文件头部说明），此处一次归一，
     * 下游不必再判形状。
     */
    function normalizeLocations(locations) {
        return (Array.isArray(locations) ? locations : []).map((segment) => (
            typeof segment === "string" ? { text: segment } : segment
        ));
    }

    /**
     * 展开区正文：一段一行。
     * 换乘站必须标出该段属于哪条线——「站厅层 / 站台层」在换乘站里指的是本线那一层，
     * 不标线名等于把两条线的位置混在一起（共用位置在抓取阶段已合并、不带 line，故不标）。
     */
    function locationLinesHtml(segments) {
        return segments.map((segment) => {
            const prefix = segment.line
                ? `<span class="cgo-fac-line">${escapeHtml(getLineName(segment.line))}</span>`
                : "";
            return `<div>${prefix}${escapeHtml(segment.text)}</div>`;
        }).join("");
    }

    /** 折叠行 + 展开区；expanded 决定初始开合状态与按钮文案 */
    function collapsibleRowHtml({ icon, name, count, more, expanded = false, tone, detailClass, detail }) {
        const countHtml = count === undefined ? "" : `<span>${count} 处</span>`;
        // 类型可带 tone（城市在 types 里声明），转成修饰类名供样式表着色；
        // 只放行小写字母与连字符，避免把配置里的任意字符串塞进 class
        const toneClass = /^[a-z][a-z-]*$/.test(String(tone || "")) ? ` cgo-fac-row--${tone}` : "";
        return `
            <div class="info-row cgo-fac-row${toneClass}">
                <span class="info-label cgo-fac-name">
                    <cgo-icon name="${icon}" size="14"></cgo-icon>${escapeHtml(name)}
                </span>
                <span class="info-value">
                    <button type="button" class="cgo-fac-toggle" aria-expanded="${expanded}">
                        ${countHtml}
                        <span class="cgo-fac-more" data-more="${escapeAttribute(more)}">${expanded ? "收起" : escapeAttribute(more)}</span>
                    </button>
                </span>
            </div>
            <div class="${detailClass}"${expanded ? "" : " hidden"}>${detail}</div>
        `;
    }

    /** 官网剖面图：整宽缩略图，点击在新标签页打开官网原图（不加标题条，图名由折叠行给出） */
    function levelMapHtml(url, altText) {
        return `
            <a class="cgo-fac-map" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer" title="点击查看官网原图">
                <img class="cgo-fac-map-img" src="${escapeAttribute(url)}" alt="${escapeAttribute(altText)}" loading="lazy" draggable="false">
            </a>
        `;
    }

    function register(config) {
        const {
            idPrefix, dataGlobals, types, levelMap, sourceNote
        } = config;
        if (!idPrefix || !types) return;

        const moduleId = `${idPrefix}-facilities`;
        registered.set(moduleId, config);
        injectStyle();

        if (!window.StationBoard?.registerModule) return;

        const facilityTable = () => pickData(dataGlobals);
        const levelMapTable = () => (levelMap ? pickData([levelMap.global]) : null);

        const getFacilities = (stationId) => {
            const list = facilityTable()?.[String(stationId || "")];
            return Array.isArray(list) ? list : [];
        };
        const getLevelMapUrl = (stationId) => levelMapTable()?.[String(stationId || "")] || "";

        window.StationBoard.registerModule({
            id: moduleId,
            name: config.name || `${idPrefix}车站设施`,
            targetTab: "station-info",
            order: typeof config.order === "number" ? config.order : 6,
            shouldRender({ station }) {
                return getFacilities(station?.id).length > 0 || Boolean(getLevelMapUrl(station?.id));
            },
            render({ station }) {
                const facilities = getFacilities(station?.id);
                const mapUrl = getLevelMapUrl(station?.id);
                if (!facilities.length && !mapUrl) return "";

                const mapRow = mapUrl
                    ? collapsibleRowHtml({
                        icon: levelMap.icon || "layer",
                        name: levelMap.name || "车站层级图",
                        tone: levelMap.tone,
                        more: "查看",
                        expanded: true,
                        detailClass: "cgo-fac-map-detail",
                        detail: levelMapHtml(
                            mapUrl,
                            levelMap.altText
                                ? levelMap.altText(station)
                                : `${station?.cn || ""}车站层级图`
                        )
                    })
                    : "";
                const facilityRows = facilities.map((facility) => {
                    const meta = types[facility.type];
                    if (!meta) return "";
                    // 已搬到出入口页签的段（如「地面-站厅 A出入口附近」的电梯、扶梯）不再在这里重复罗列，
                    // 整条被搬空时该行一并消失。类型与位置前缀规则由 city 的 window.CGO_EXIT_VERTICAL 声明，
                    // 判定实现在共享层 exit-vertical.js（与出入口页签同一份，不会两边口径不一）。
                    const segments = normalizeLocations(facility.location)
                        .filter((segment) => !window.CGoExitVertical?.match?.(facility.type, segment.text));
                    if (!segments.length) return "";
                    return collapsibleRowHtml({
                        icon: meta.icon,
                        name: meta.name,
                        tone: meta.tone,
                        count: segments.length,
                        more: "详情",
                        detailClass: "cgo-fac-detail",
                        detail: locationLinesHtml(segments)
                    });
                }).join("");

                if (!facilityRows && !mapRow) return "";

                return `
                    <div class="cgo-fac-section">
                        <div class="info-label cgo-fac-title">${escapeHtml(config.title || "车站设施")}</div>
                        ${mapRow}
                        ${facilityRows}
                        ${sourceNote ? `<div class="cgo-fac-source">
                            <cgo-icon name="info" size="12"></cgo-icon>
                            <span>${escapeHtml(sourceNote)}</span>
                        </div>` : ""}
                    </div>
                `;
            },
            /**
             * 折叠开合：按钮是原生 button，天然可聚焦、回车与空格可触发；再同步 aria-expanded
             * 与「详情 / 收起」文案。监听器只挂在本次渲染出来的节点上，信息板换站会重建整块
             * DOM，旧节点连同监听器一并丢弃，不累积、也无需显式解绑。
             */
            onMounted(container) {
                container.querySelectorAll(".cgo-fac-toggle").forEach((toggle) => {
                    const row = toggle.closest(".cgo-fac-row");
                    const detail = row?.nextElementSibling;
                    if (!detail) return;

                    const more = toggle.querySelector(".cgo-fac-more");
                    const collapsedLabel = more?.dataset.more || "详情";
                    toggle.addEventListener("click", () => {
                        const expanded = toggle.getAttribute("aria-expanded") === "true";
                        toggle.setAttribute("aria-expanded", String(!expanded));
                        detail.hidden = expanded;
                        if (more) more.textContent = expanded ? collapsedLabel : "收起";
                    });
                });

                // 官网图属外部资源，个别编号可能尚未刊载或被撤下，加载失败即清空该块
                // （与「无图不渲染」同一口径；换站重建后自然重试）
                container.querySelectorAll(".cgo-fac-map-detail").forEach((detail) => {
                    const img = detail.querySelector(".cgo-fac-map-img");
                    if (!img) return;
                    const drop = () => detail.replaceChildren();
                    // 命中缓存时 complete 已为真，error 不会再触发，须当场判定
                    if (img.complete) {
                        if (img.naturalWidth === 0) drop();
                        return;
                    }
                    img.addEventListener("error", drop, { once: true });
                });
            }
        });

        document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
            detail: { cityId: idPrefix, moduleId }
        }));
    }

    window.CGoFacilities = { register, registered };
})();
