/**
 * CGo OpenMap - 福州城市专属模块：首末班时刻与行车间隔
 * (city/fuzhou/modules/fuzhou_timetable.js)
 *
 * 数据源：data_timetable.js 的 GLOBAL_SCHEDULE_DATA / FUZHOU_LINE_INTERVALS
 * （福州地铁官网「站点查询」，2026-09-23 抓取）。
 * 挂载于「线路」选项卡（line-tab），order 22。
 *
 * 时间文本优先使用官网原文（dir.text）——滨海快线要区分「直达 / 大站 / 普通」列车，
 * 例如「第三列(普通) 06:51 | 末班车(普通) 23:14」，自行拼装会丢掉列车类型；
 * 只有普通线（原文恰为「首班车 X | 末班车 Y」）才用 first/last 字段拼。
 * 图标严格使用 CGoUI 矢量组件，禁用 Emoji。
 */

(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    function getEntry(context) {
        if (typeof GLOBAL_SCHEDULE_DATA === "undefined" || !GLOBAL_SCHEDULE_DATA) return null;
        const lineId = context.lineInfo && context.lineInfo.id;
        const stationId = context.station && context.station.id;
        if (!lineId || !stationId) return null;
        return (GLOBAL_SCHEDULE_DATA[lineId] && GLOBAL_SCHEDULE_DATA[lineId][stationId]) || null;
    }

    /** 某方向的时间文本：官网原文优先，否则用结构化的首末班拼接 */
    function directionText(bound) {
        if (!bound) return "—";
        if (bound.text) return bound.text;
        const first = bound.first || "—";
        const last = bound.last || "—";
        return "首班 " + first + " | 末班 " + last;
    }

    function intervalRows(lineId) {
        if (typeof FUZHOU_LINE_INTERVALS === "undefined" || !FUZHOU_LINE_INTERVALS) return [];
        const info = FUZHOU_LINE_INTERVALS[lineId];
        if (!info) return [];
        return [
            { label: "高峰", value: info.peak },
            { label: "平峰", value: info.offPeak },
            { label: "低峰", value: info.lowPeak }
        ].filter((row) => row.value);
    }

    window.StationBoard.registerModule({
        id: "fuzhou-line-timetable",
        name: "福州首末班时刻",
        targetTab: "line-tab",
        order: 22,
        shouldRender(context) {
            const entry = getEntry(context);
            return Boolean(entry && entry.directions && Object.keys(entry.directions).length);
        },
        render(context) {
            const entry = getEntry(context);
            if (!entry) return "";
            const fast = entry.fast || {};

            const rows = Object.keys(entry.directions).map((dest) => {
                const bound = entry.directions[dest];
                const fastText = fast[dest] && fast[dest].text;
                return `
                    <div style="padding:4px 0; border-bottom:1px solid var(--border-color);">
                        <div style="display:flex; align-items:center; gap:3px; color:var(--text-main); font-weight:600;">
                            <cgo-icon name="arrow-right" size="11"></cgo-icon><span>往${dest}</span>
                        </div>
                        ${fastText ? `<div style="color:var(--text-light); padding-left:14px;">快车 ${fastText}</div>` : ""}
                        <div style="color:var(--text-main); padding-left:14px;">${directionText(bound)}</div>
                    </div>
                `;
            }).join("");

            const intervals = intervalRows(context.lineInfo && context.lineInfo.id);
            const intervalHtml = intervals.length ? `
                <details style="margin-top:6px;">
                    <summary style="cursor:pointer; color:var(--text-main); font-weight:600; display:flex; align-items:center; gap:4px;">
                        <cgo-icon name="time" size="12"></cgo-icon><span>行车间隔</span>
                    </summary>
                    ${intervals.map((row) => `
                        <div style="margin-top:3px; color:var(--text-light); display:flex; gap:6px;">
                            <span style="flex:0 0 auto; color:var(--text-main); font-weight:600;">${row.label}</span>
                            <span>${row.value}</span>
                        </div>
                    `).join("")}
                </details>
            ` : "";

            const updated = entry.updatedAt ? " · 更新于 " + entry.updatedAt : "";

            return `
                <div style="margin:8px 0; padding:8px 10px; background:var(--card-sub-bg); border-radius:6px; font-size:11px; line-height:1.45;">
                    <div style="font-weight:600; color:var(--text-main); margin-bottom:4px; display:inline-flex; align-items:center; gap:4px;">
                        <cgo-icon name="time" size="13"></cgo-icon><span>首末班车</span>
                    </div>
                    ${rows}
                    ${intervalHtml}
                    <div style="margin-top:6px; color:var(--text-light); font-size:10px;">${entry.source || "福州地铁官网"}${updated}</div>
                </div>
            `;
        }
    });
})();
