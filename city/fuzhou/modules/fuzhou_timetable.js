/**
 * CGo OpenMap - 福州城市专属模块：首末班时刻
 * (city/fuzhou/modules/fuzhou_timetable.js)
 *
 * 数据源：data_timetable.js 中的 GLOBAL_SCHEDULE_DATA（福州地铁官网「服务时间」）。
 * 挂载于「线路」选项卡（line-tab），order 22。
 * 图标严格使用 CGoUI 矢量组件，禁用 Emoji。
 */

(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    function getEntry(lineId, stationId) {
        if (typeof GLOBAL_SCHEDULE_DATA === "undefined" || !GLOBAL_SCHEDULE_DATA) return null;
        return GLOBAL_SCHEDULE_DATA[lineId]?.[stationId] || null;
    }

    function formatSlot(slot) {
        if (!slot) return "—";
        const weekday = slot.weekday || "—";
        const weekend = slot.weekend || "—";
        if (weekday === weekend) return weekday;
        return weekday + " / " + weekend;
    }

    window.StationBoard.registerModule({
        id: "fuzhou-line-timetable",
        name: "福州首末班时刻",
        targetTab: "line-tab",
        order: 22,
        shouldRender(context) {
            const entry = getEntry(context.lineInfo?.id, context.station?.id);
            return Boolean(entry && entry.directions);
        },
        render(context) {
            const entry = getEntry(context.lineInfo.id, context.station.id);
            const rows = Object.keys(entry.directions).map((dest) => {
                const bound = entry.directions[dest];
                const first = formatSlot(bound && bound.first);
                const last = formatSlot(bound && bound.last);
                return `
                    <div style="display:grid; grid-template-columns: 84px 1fr 1fr; gap:4px 8px; align-items:center; padding:4px 0; border-bottom:1px solid var(--border-color);">
                        <span style="color:var(--text-main); font-weight:600; display:inline-flex; align-items:center; gap:3px;">
                            <cgo-icon name="arrow-right" size="11"></cgo-icon><span>往${dest}</span>
                        </span>
                        <span style="color:var(--text-light);">首班 ${first}</span>
                        <span style="color:var(--text-light);">末班 ${last}</span>
                    </div>
                `;
            }).join("");

            return `
                <div style="margin:8px 0; padding:8px 10px; background:var(--card-sub-bg); border-radius:6px; font-size:11px; line-height:1.45;">
                    <div style="font-weight:600; color:var(--text-main); margin-bottom:4px; display:inline-flex; align-items:center; gap:4px;">
                        <cgo-icon name="clock" size="13"></cgo-icon><span>首末班车</span>
                    </div>
                    <div style="color:var(--text-light); margin-bottom:6px;">${entry.source || "福州地铁官网"}</div>
                    ${rows}
                </div>
            `;
        }
    });
})();
