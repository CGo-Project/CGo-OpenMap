/**
 * CGo OpenMap - 苏州城市专属模块：车站地图位置 / 车站结构示意图 / 车站设施
 * (city/suzhou/modules/suzhou_station_info.js)
 *
 * 数据源：data_station_info.js 的 SUZHOU_STATION_INFO（整理自苏州地铁官网「车站信息」栏目
 * https://www.sz-mtr.com/service/guide/stations/ 的街区示意图、站层示意图 3D 与站点导航信息）。
 * 官网原图单张 1~7MB，因此默认不下载图片：点「查看大图」时才拉取并放进浮层。
 *
 * 挂载于「车站信息」选项卡（station-info），order 15。图标用 CGoUI 矢量组件，配色走主题变量。
 */

(function () {
    "use strict";

    const SOURCE_LABEL = "苏州地铁官网「车站信息」";
    const OVERLAY_ID = "sz-si-lightbox";
    const STYLE_ID = "sz-si-style";
    const ROOT_ATTR = "data-sz-si-station";

    let activeCleanup = null;

    function allInfo() {
        const d = window.SUZHOU_STATION_INFO;
        return d && typeof d === "object" ? d : null;
    }

    function entryOf(context) {
        const all = allInfo();
        const id = context && context.station ? context.station.id : null;
        return (all && id && all[id]) || null;
    }

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const st = document.createElement("style");
        st.id = STYLE_ID;
        st.textContent = `
.sz-si { margin: 10px 14px 4px; }
.sz-si-section { margin-bottom: 12px; padding: 10px 12px; border: 1px solid var(--divider, rgba(0,0,0,.1)); border-radius: 10px; background: var(--card-bg, transparent); }
.sz-si-head { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--text-main, #222); }
.sz-si-head small { font-size: 11px; font-weight: 400; color: var(--text-light, #888); }
.sz-si-desc { margin: 6px 0 0; font-size: 12px; line-height: 1.55; color: var(--text-main, #222); }
.sz-si-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 9px; }
.sz-si-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border: 1px solid var(--divider, rgba(0,0,0,.12)); border-radius: 999px;
  background: transparent; color: var(--text-main, #222); font: inherit; font-size: 12px; line-height: 1; cursor: pointer; text-decoration: none; }
.sz-si-btn:hover, .sz-si-btn:focus-visible { border-color: var(--primary-color, #0c3674); color: var(--primary-color, #0c3674); }
.sz-si-fac { margin-top: 8px; display: grid; gap: 7px; }
.sz-si-row { display: grid; grid-template-columns: 16px 74px 1fr; gap: 8px; align-items: start; font-size: 12px; line-height: 1.6; }
.sz-si-row cgo-icon { margin-top: 2px; color: var(--text-light, #777); }
.sz-si-row b { font-weight: 600; color: var(--text-main, #222); }
.sz-si-row span { color: var(--text-main, #222); word-break: break-word; }
.sz-si-travels { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
.sz-si-travels a { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; background: var(--hover-bg, rgba(0,0,0,.05));
  color: var(--text-main, #222); font-size: 12px; text-decoration: none; }
.sz-si-travels a:hover { color: var(--primary-color, #0c3674); }
.sz-si-source { margin: 2px 0 8px; font-size: 11px; line-height: 1.5; color: var(--text-light, #999); }
#${OVERLAY_ID} { position: fixed; inset: 0; z-index: 100000; display: none; align-items: center; justify-content: center;
  background: rgba(0,0,0,.74); padding: 14px; }
#${OVERLAY_ID}.on { display: flex; }
#${OVERLAY_ID} .sz-si-box { position: relative; max-width: min(1500px, 96vw); max-height: 94vh; display: flex; flex-direction: column;
  background: var(--panel-bg, #fff); border-radius: 12px; overflow: hidden; box-shadow: 0 14px 50px rgba(0,0,0,.4); }
#${OVERLAY_ID} .sz-si-bar { display: flex; align-items: center; gap: 10px; padding: 9px 10px 9px 14px; border-bottom: 1px solid var(--divider, rgba(0,0,0,.08)); }
#${OVERLAY_ID} .sz-si-title { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; color: var(--text-main, #222);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${OVERLAY_ID} .sz-si-close { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px;
  border: 1px solid var(--divider, rgba(0,0,0,.1)); border-radius: 50%; background: transparent; color: var(--text-main, #222); cursor: pointer; }
#${OVERLAY_ID} .sz-si-stage { position: relative; display: flex; align-items: center; justify-content: center; min-width: 260px; min-height: 160px; padding: 8px; overflow: auto; }
#${OVERLAY_ID} .sz-si-stage img { display: block; max-width: 100%; max-height: calc(94vh - 110px); object-fit: contain; }
#${OVERLAY_ID} .sz-si-spin { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 12px; color: var(--text-light, #888); }
#${OVERLAY_ID} .sz-si-spin::before { content: ""; width: 20px; height: 20px; border: 2px solid var(--divider, rgba(0,0,0,.15));
  border-top-color: var(--primary-color, #0c3674); border-radius: 50%; animation: sz-si-rot .8s linear infinite; }
#${OVERLAY_ID} .sz-si-spin.hide { display: none; }
#${OVERLAY_ID} .sz-si-spin.err::before { display: none; }
@keyframes sz-si-rot { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { #${OVERLAY_ID} .sz-si-spin::before { animation: none; } }
`;
        document.head.appendChild(st);
    }

    function overlay() {
        let el = document.getElementById(OVERLAY_ID);
        if (el) return el;
        injectStyle();
        el = document.createElement("div");
        el.id = OVERLAY_ID;
        el.setAttribute("role", "dialog");
        el.setAttribute("aria-modal", "true");
        el.setAttribute("aria-label", "车站示意图大图");
        el.innerHTML = `
            <div class="sz-si-box">
                <div class="sz-si-bar">
                    <span class="sz-si-title"></span>
                    <button type="button" class="sz-si-close" aria-label="关闭大图"><cgo-icon name="close" size="14"></cgo-icon></button>
                </div>
                <div class="sz-si-stage"><div class="sz-si-spin">正在加载官网原图…</div></div>
            </div>`;
        document.body.appendChild(el);
        el.addEventListener("click", (e) => { if (e.target === el) close(); });
        el.querySelector(".sz-si-close").addEventListener("click", close);
        return el;
    }

    function close() {
        const el = document.getElementById(OVERLAY_ID);
        if (!el) return;
        el.classList.remove("on");
        const img = el.querySelector(".sz-si-stage img");
        if (img) img.remove();
        const spin = el.querySelector(".sz-si-spin");
        if (spin) { spin.classList.remove("hide", "err"); spin.textContent = "正在加载官网原图…"; }
        if (activeCleanup) { const f = activeCleanup; activeCleanup = null; f(); }
    }

    function open(url, title) {
        if (!url) return;
        const el = overlay();
        const stage = el.querySelector(".sz-si-stage");
        const spin = el.querySelector(".sz-si-spin");
        el.querySelector(".sz-si-title").textContent = title;
        const old = stage.querySelector("img");
        if (old) old.remove();
        spin.classList.remove("hide", "err");
        spin.textContent = "正在加载官网原图…";
        el.classList.add("on");

        const img = new Image();
        img.decoding = "async";
        img.alt = title;
        img.addEventListener("load", () => spin.classList.add("hide"));
        img.addEventListener("error", () => {
            spin.classList.remove("hide");
            spin.classList.add("err");
            spin.textContent = "官网原图加载失败，请稍后重试";
        });
        img.src = url;
        stage.appendChild(img);

        const onKey = (e) => { if (e.key === "Escape") close(); };
        document.addEventListener("keydown", onKey);
        activeCleanup = () => document.removeEventListener("keydown", onKey);
    }

    function row(icon, label, value) {
        if (!value) return "";
        return `<div class="sz-si-row"><cgo-icon name="${icon}" size="14"></cgo-icon><b>${esc(label)}</b><span>${esc(value)}</span></div>`;
    }

    function render(context) {
        const entry = entryOf(context);
        if (!entry) return "";
        injectStyle();
        const station = (context && context.station) || {};
        const id = station.id || "";
        const cn = station.cn || "";
        const city = (window.getActiveCity && window.getActiveCity()) || null;
        const navUrl = city && typeof city.getNavigationUrl === "function"
            ? city.getNavigationUrl(cn)
            : `https://uri.amap.com/search?keyword=${encodeURIComponent(cn + "(地铁站)")}`;

        const mapCard = entry.block ? `
            <div class="sz-si-section">
                <div class="sz-si-head"><cgo-icon name="map" size="14"></cgo-icon>街区示意图<small>出入口与周边街区 · 官网原图</small></div>
                <p class="sz-si-desc">上方地图卡片给出本站位置；这张官网《街区示意图》另标出各出入口编号、周边道路与公交站点，可据此确认从哪个口出站。</p>
                <div class="sz-si-actions">
                    <button type="button" class="sz-si-btn" data-sz-si-zoom="block" data-title="${esc(cn)} · 街区示意图（出入口）"><cgo-icon name="unfold" size="13"></cgo-icon>查看大图</button>
                    <a class="sz-si-btn" href="${esc(navUrl)}" target="_blank" rel="noopener"><cgo-icon name="location" size="13"></cgo-icon>在高德地图中搜索本站</a>
                </div>
            </div>` : "";

        const floorCard = entry.floor ? `
            <div class="sz-si-section">
                <div class="sz-si-head"><cgo-icon name="layer" size="14"></cgo-icon>车站结构示意图<small>站层示意图 3D</small></div>
                <p class="sz-si-desc">官网《站层示意图 3D》给出本站站厅层、站台层、通道与出入口的竖向关系，换乘走法可对照查看。</p>
                <div class="sz-si-actions">
                    <button type="button" class="sz-si-btn" data-sz-si-zoom="floor" data-title="${esc(cn)} · 站层示意图 3D"><cgo-icon name="unfold" size="13"></cgo-icon>查看大图</button>
                </div>
            </div>` : "";

        const facRows = [
            row("toilet", "卫生间", entry.toilet),
            row("elevator", "无障碍电梯", entry.elevator),
            row("a11yplatform", "轮椅固定位", entry.wheelchair),
            row("card", "其他设备", entry.other),
            row("bus", "周边公交", entry.bus)
        ].join("");

        const travels = Array.isArray(entry.travels) && entry.travels.length ? `
            <div class="sz-si-head" style="margin-top:10px"><cgo-icon name="tourist" size="14"></cgo-icon>周边景点</div>
            <ul class="sz-si-travels">${entry.travels.map((t) =>
                `<li><a href="${esc(t[1])}" target="_blank" rel="noopener"><cgo-icon name="tourist" size="12"></cgo-icon>${esc(t[0])}</a></li>`).join("")}</ul>` : "";

        const facCard = (facRows || travels) ? `
            <div class="sz-si-section">
                <div class="sz-si-head"><cgo-icon name="info" size="14"></cgo-icon>车站设施<small>站内服务与周边接驳</small></div>
                ${facRows ? `<div class="sz-si-fac">${facRows}</div>` : ""}
                ${travels}
            </div>` : "";

        if (!mapCard && !floorCard && !facCard) return "";
        return `<div class="sz-si" ${ROOT_ATTR}="${esc(id)}">${mapCard}${floorCard}${facCard}
            <p class="sz-si-source">资料来源：${SOURCE_LABEL}。示意图为官网原图，点击「查看大图」后按需加载。</p>
        </div>`;
    }

    function onMounted(panel) {
        if (!panel || panel.__szSiBound) return;
        panel.__szSiBound = true;
        panel.addEventListener("click", (e) => {
            const btn = e.target.closest && e.target.closest("[data-sz-si-zoom]");
            if (!btn) return;
            const root = btn.closest(`[${ROOT_ATTR}]`);
            const all = allInfo();
            const id = root ? root.getAttribute(ROOT_ATTR) : null;
            const rec = (all && id && all[id]) || null;
            if (!rec) return;
            e.preventDefault();
            e.stopPropagation();
            const key = btn.getAttribute("data-sz-si-zoom");
            const title = btn.getAttribute("data-title") || "车站示意图";
            if (rec[key]) open(rec[key], title);
        });
    }

    window.StationBoard.registerModule({
        id: "suzhou-station-info",
        name: "苏州车站资料（地图位置 / 结构示意图 / 设施）",
        targetTab: "station-info",
        order: 15,
        shouldRender(context) {
            return Boolean(entryOf(context));
        },
        render,
        onMounted
    });
})();
