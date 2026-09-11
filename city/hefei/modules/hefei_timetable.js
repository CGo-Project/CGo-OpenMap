/**
 * 合肥车站信息板：官方首末班（周一至周四 / 周五至周日）
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
        id: "hefei-line-timetable",
        name: "合肥首末班时刻",
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
                    <div style="display:grid; grid-template-columns: 72px 1fr 1fr; gap:4px 8px; align-items:center; padding:4px 0; border-bottom:1px solid var(--border-color);">
                        <span style="color:var(--text-main); font-weight:600;">开往${dest}</span>
                        <span style="color:var(--text-light);">首班 ${first}</span>
                        <span style="color:var(--text-light);">末班 ${last}</span>
                    </div>
                `;
            }).join("");

            return `
                <div style="margin:8px 0; padding:8px 10px; background:var(--card-sub-bg); border-radius:6px; font-size:11px; line-height:1.45;">
                    <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">⏱️ 首末班车</div>
                    <div style="color:var(--text-light); margin-bottom:6px;">周一至周四 / 周五至周日</div>
                    ${rows}
                </div>
            `;
        }
    });
})();
