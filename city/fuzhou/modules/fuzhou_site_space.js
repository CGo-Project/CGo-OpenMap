/**
 * CGo OpenMap - 福州城市专属模块：车站空间示意图与出入口
 * (city/fuzhou/modules/fuzhou_site_space.js)
 *
 * 数据源：data_site_space.js 的 FUZHOU_SITE_SPACE_DATA
 * （福州地铁官网「站点查询」，2026-09-23 抓取）。
 *
 * 车站空间示意图与出入口都是**车站级**资料 —— 官网对同一座换乘站在各条线路上各登记一个 map
 * 地址，但图片内容相同（13 座换乘站逐张比对：12 座各线字节完全一致，洪塘为同图的 JPEG / WebP
 * 两种编码，详见数据文件头部说明）。因此挂载于「车站信息」选项卡（station-info），order 15，
 * 紧随「车站类型」之后，整站只展示一次。
 *
 * 看大图的方式：点示意图**在本页浮层里看**（`<cgo-modal>`，核心自带的 Web Component），
 * 不跳转官网。浮层的宽度上限随窗口分辨率走（`max-width` 取 min(1560px, 94vw)，
 * 图片本身 `max-height: 84vh` + `object-fit: contain`），点窗口以外的遮罩即退出，
 * 也支持 Esc；沿用组件默认的 `close-on-overlay`，不自己写遮罩。
 *
 * 图片是官网 CDN 外链（单张 0.3~3.5 MB，共 102 张），不随仓库分发；
 * 列表里的缩略图用 loading="lazy" 延迟加载，配合 .tab-pane 的 display:none，
 * 只有切到「车站信息」时才真正下载；大图等用户点了才加载（`decoding="async"`）。
 * 图标严格使用 CGoUI 矢量组件，禁用 Emoji。
 */

(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    const SOURCE_LABEL = "福州地铁官网「站点查询」";
    const MODAL_ID = "fuzhou-space-lightbox";
    /** 大图浮层的宽度上限：宽屏给到 1560px，窄屏留出边距（随分辨率变化） */
    const MODAL_MAX_WIDTH = "min(1560px, 94vw)";

    function getEntry(context) {
        if (typeof FUZHOU_SITE_SPACE_DATA === "undefined" || !FUZHOU_SITE_SPACE_DATA) return null;
        const stationId = context.station && context.station.id;
        return (stationId && FUZHOU_SITE_SPACE_DATA[stationId]) || null;
    }

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /* ======================================================================
     * 大图浮层
     * ==================================================================== */

    /** 取（或创建）大图浮层。宿主是 0×0 挂载点，遮罩与布局都由组件自带 */
    function lightboxEl() {
        let el = document.getElementById(MODAL_ID);
        if (el) return el;
        el = document.createElement("cgo-modal");
        el.id = MODAL_ID;
        el.setAttribute("max-width", MODAL_MAX_WIDTH);
        // 遮罩点击关闭是组件默认行为（close-on-overlay 默认 true），这里显式写出来
        el.setAttribute("close-on-overlay", "");
        document.body.appendChild(el);
        // 关掉后清掉内容：大图是几 MB 的外链，留在 DOM 里会一直占着内存与解码结果
        el.addEventListener("cgo-close", () => { el.innerHTML = ""; });
        return el;
    }

    /**
     * 打开大图。
     * @param {{ map: string, cn?: string }} entry 站点条目
     * @param {string} stationName 站点中文名（用于标题与 alt）
     */
    function openLightbox(entry, stationName) {
        const modal = lightboxEl();
        const name = stationName || entry.cn || "本站";
        modal.title = `${name} 车站空间示意图`;
        modal.innerHTML = `
            <div class="fuzhou-space-lightbox" style="display:flex; flex-direction:column; gap:8px;">
                <img src="${esc(entry.map)}" alt="${esc(name)}站点空间示意图（大图）"
                     decoding="async" referrerpolicy="no-referrer"
                     style="display:block; width:100%; max-height:84vh; object-fit:contain;
                            border-radius:6px; background:var(--card-bg);">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;
                            flex-wrap:wrap; font-size:11px; color:var(--text-light);">
                    <span style="display:inline-flex; align-items:center; gap:4px;">
                        <cgo-icon name="info" size="12"></cgo-icon>
                        <span>${SOURCE_LABEL} · 点窗口以外区域或按 Esc 退出</span>
                    </span>
                    <a href="${esc(entry.map)}" target="_blank" rel="noreferrer"
                       style="color:var(--primary-color, #006098); text-decoration:none;
                              display:inline-flex; align-items:center; gap:3px; white-space:nowrap;">
                        <span>官网原图</span><cgo-icon name="external" size="11"></cgo-icon>
                    </a>
                </div>
            </div>
        `;
        // 外链可能取不到（离线 / CDN 变动）：给一句可读的提示，而不是留一片空白
        const img = modal.querySelector("img");
        img?.addEventListener("error", () => {
            img.replaceWith(Object.assign(document.createElement("div"), {
                textContent: "大图加载失败，请检查网络后重试，或点下方「官网原图」打开。",
                style: "padding:28px 16px; text-align:center; color:var(--text-light); font-size:12px;"
            }));
        }, { once: true });
        modal.open = true;
    }

    /* ======================================================================
     * 点击接管（委托到 document，故面板反复重建也不需要重新绑定）
     * ==================================================================== */
    if (!window.__fuzhouSpaceLightboxBound) {
        window.__fuzhouSpaceLightboxBound = true;
        document.addEventListener("click", (event) => {
            const link = event.target?.closest?.("[data-fz-space-view]");
            if (!link) return;
            const url = link.getAttribute("data-fz-space-view");
            if (!url) return;
            // 摘掉默认的跳官网：改为本页浮层看大图
            event.preventDefault();
            openLightbox({ map: url, cn: link.getAttribute("data-fz-space-name") || "" },
                link.getAttribute("data-fz-space-name") || "");
        });
    }

    function exitRow(line) {
        const m = /^([^：:]+)[：:]\s*(.*)$/.exec(String(line).trim());
        const name = m ? m[1].trim() : String(line).trim();
        const desc = m ? m[2].trim() : "";
        return `
            <div style="display:flex; gap:6px; padding:1px 0;">
                <span style="flex:0 0 auto; color:var(--text-main); font-weight:600;">${esc(name)}</span>
                <span style="color:var(--text-light);">${esc(desc)}</span>
            </div>
        `;
    }

    window.StationBoard.registerModule({
        id: "fuzhou-station-space",
        name: "福州车站空间示意图",
        targetTab: "station-info",
        order: 15,
        shouldRender(context) {
            const entry = getEntry(context);
            return Boolean(entry && entry.map);
        },
        render(context) {
            const entry = getEntry(context);
            if (!entry || !entry.map) return "";
            const exits = Array.isArray(entry.exits) ? entry.exits : [];
            const cn = entry.cn || (context.station && context.station.cn) || "本站";
            const updated = entry.updatedAt ? " · 更新于 " + entry.updatedAt : "";

            return `
                <div style="margin:0 0 15px; padding:8px 10px; background:var(--card-bg); border-radius:6px; font-size:11px; line-height:1.45;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px;">
                        <span style="font-weight:600; color:var(--text-main); display:inline-flex; align-items:center; gap:4px;">
                            <cgo-icon name="map" size="13"></cgo-icon><span>车站空间示意图</span>
                        </span>
                        <button type="button" data-fz-space-view="${esc(entry.map)}" data-fz-space-name="${esc(cn)}"
                           style="border:0; background:none; padding:0; cursor:pointer; font:inherit;
                                  color:var(--primary-color, #006098); display:inline-flex; align-items:center;
                                  gap:3px; white-space:nowrap;">
                            <span>查看大图</span><cgo-icon name="zoom-in" size="12"></cgo-icon>
                        </button>
                    </div>
                    <button type="button" data-fz-space-view="${esc(entry.map)}" data-fz-space-name="${esc(cn)}"
                            title="点开看大图"
                            style="display:block; width:100%; padding:0; border:0; background:none; cursor:zoom-in;">
                        <img src="${esc(entry.map)}" alt="${esc(cn)}站点空间示意图"
                             loading="lazy" decoding="async" referrerpolicy="no-referrer"
                             style="display:block; width:100%; height:auto; border:1px solid var(--border-color); border-radius:6px; background:var(--card-bg);">
                    </button>
                    <div style="margin-top:8px; font-weight:600; color:var(--text-main); display:inline-flex; align-items:center; gap:4px;">
                        <cgo-icon name="gate" size="13"></cgo-icon><span>出入口${exits.length ? "（" + exits.length + "）" : ""}</span>
                    </div>
                    <div style="margin-top:4px;">
                        ${exits.length ? exits.map(exitRow).join("") : `<span style="color:var(--text-light);">官网暂未登记本站出入口信息。</span>`}
                    </div>
                    <div style="margin-top:6px; color:var(--text-light); font-size:10px;">${SOURCE_LABEL}${updated} · 图片为官网外链，需联网加载</div>
                </div>
            `;
        }
    });
})();
