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
 * 图片是官网 CDN 外链（单张 0.3~3.5 MB，共 102 张），不随仓库分发；
 * 用 loading="lazy" 延迟加载，配合 .tab-pane 的 display:none，只有切到「车站信息」时才真正下载。
 * 图标严格使用 CGoUI 矢量组件，禁用 Emoji。
 */

(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    const SOURCE_LABEL = "福州地铁官网「站点查询」";

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
                <div style="margin:0 0 15px; padding:8px 10px; background:var(--card-sub-bg); border-radius:6px; font-size:11px; line-height:1.45;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px;">
                        <span style="font-weight:600; color:var(--text-main); display:inline-flex; align-items:center; gap:4px;">
                            <cgo-icon name="map" size="13"></cgo-icon><span>车站空间示意图</span>
                        </span>
                        <a href="${esc(entry.map)}" target="_blank" rel="noreferrer"
                           style="color:var(--link-color, #006098); text-decoration:none; display:inline-flex; align-items:center; gap:3px; white-space:nowrap;">
                            <span>查看原图</span><cgo-icon name="external" size="11"></cgo-icon>
                        </a>
                    </div>
                    <a href="${esc(entry.map)}" target="_blank" rel="noreferrer" style="display:block;">
                        <img src="${esc(entry.map)}" alt="${esc(cn)}站点空间示意图"
                             loading="lazy" decoding="async" referrerpolicy="no-referrer"
                             style="display:block; width:100%; height:auto; border:1px solid var(--border-color); border-radius:6px; background:var(--card-bg);">
                    </a>
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
