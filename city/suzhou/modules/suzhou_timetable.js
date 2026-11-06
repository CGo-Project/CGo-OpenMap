/**
 * CGo OpenMap - 苏州城市专属模块：首末班车
 * (city/suzhou/modules/suzhou_timetable.js)
 *
 * 数据源：data_timetable.js 的 SUZHOU_SCHEDULE_DATA（整理自苏州地铁官网「车站信息」，
 * 上行 / 下行各自的首班、末班）。逐分钟列车时刻按官网「列车动态」查询，模块内给出入口。
 * 挂载于「线路」选项卡（line-tab），order 22。
 */

(function () {
    "use strict";

    const OFFICIAL_URL = "http://106.14.198.252:8512/scheduling";

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function entryOf(context) {
        const data = window.SUZHOU_SCHEDULE_DATA;
        const stationId = context && context.station && context.station.id;
        const lineId = context && context.lineInfo && context.lineInfo.id;
        if (!data || !stationId || !lineId) return null;
        const line = data[lineId];
        const info = line && line.stations && line.stations[stationId];
        return info ? { line, info } : null;
    }

    function render(context) {
        const hit = entryOf(context);
        if (!hit) return "";
        const { line, info } = hit;
        const toward = line.toward || {};
        const rows = Object.entries(info.directions || {}).map(([label, t]) => {
            const dest = toward[label] || label;
            return `<div class="sz-tt-row">
                <span class="sz-tt-dir"><cgo-icon name="route" size="12"></cgo-icon>${esc(label)} · 往 ${esc(dest)}</span>
                <span class="sz-tt-time"><i>首 ${esc(t.first || "—")}</i><i>末 ${esc(t.last || "—")}</i></span>
            </div>`;
        }).join("");
        if (!rows) return "";
        return `
<style id="sz-tt-style">
.sz-tt { margin: 10px 14px 4px; }
.sz-tt-head { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: var(--text-main, #222); }
.sz-tt-head small { font-weight: 400; font-size: 11px; color: var(--text-light, #888); }
.sz-tt-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px dashed var(--divider, rgba(0,0,0,.08)); font-size: 12px; }
.sz-tt-row:last-child { border-bottom: 0; }
.sz-tt-dir { display: inline-flex; align-items: center; gap: 5px; color: var(--text-main, #222); }
.sz-tt-time { display: inline-flex; gap: 10px; color: var(--text-main, #222); font-variant-numeric: tabular-nums; }
.sz-tt-time i { font-style: normal; }
.sz-tt-foot { margin-top: 8px; font-size: 11px; line-height: 1.5; color: var(--text-light, #999); }
.sz-tt-foot a { color: var(--primary-color, #0c3674); text-decoration: none; }
</style>
<div class="sz-tt">
    <div class="sz-tt-head"><cgo-icon name="time" size="14"></cgo-icon>首末班车<small>${esc(line.lineName || "")} · ${esc(info.cn || "")}</small></div>
    ${rows}
    <p class="sz-tt-foot">首末班车以官网公布为准；逐分钟列车时刻可查
        <a href="${OFFICIAL_URL}" target="_blank" rel="noopener">官网「列车动态」</a>。</p>
</div>`;
    }

    window.StationBoard.registerModule({
        id: "suzhou-timetable",
        name: "苏州首末班车",
        targetTab: "line-tab",
        order: 22,
        shouldRender(context) {
            return Boolean(entryOf(context));
        },
        render
    });
})();
