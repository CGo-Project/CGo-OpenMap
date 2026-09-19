/**
 * CGo OpenMap - 大连官方首末班车信息板模块
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    function getEntries(stationId, lineId) {
        if (typeof window.getDalianTimetableInfoEntries === "function") {
            return window.getDalianTimetableInfoEntries(stationId, lineId);
        }
        const info = window.DALIAN_TIMETABLE_DATA?.[String(stationId)]?.[String(lineId)];
        return info ? [{ lineId: String(lineId), info }] : [];
    }

    function getServiceDayLabel(date = new Date()) {
        const dayType = typeof window.getDalianTimetableDayType === "function"
            ? window.getDalianTimetableDayType(date)
            : [0, 6].includes(date.getDay()) ? "restday" : "workday";
        return dayType === "restday" ? "节假日" : "工作日";
    }

    function collectRows(stationId, lineId, date = new Date()) {
        const entries = getEntries(stationId, lineId);
        if (!entries.length) return [];

        const getSchedules = (info) => typeof window.getDalianTimetableSchedules === "function"
            ? window.getDalianTimetableSchedules(info, date)
            : (info.schedules || []);
        const rows = [];
        const rowIndex = new Map();

        entries.forEach(({ info }) => {
            getSchedules(info).forEach((schedule) => {
                (schedule.directions || []).forEach((direction) => {
                    const destinationName = direction.destinationName || "未知终点";
                    const destinationId = String(direction.destinationStationId || "");
                    const first = String(direction.first || "");
                    const last = String(direction.last || "");
                    if (!first && !last) return;

                    const isJiuliDevelopmentDirection = String(stationId) === "0320" && destinationId === "0308";
                    const estimated = Boolean(info?.isEstimated || direction?.isEstimated);
                    const key = isJiuliDevelopmentDirection
                        ? "jiuli-development-zone"
                        : `${destinationId}|${first}|${last}|${estimated}`;
                    const existing = rowIndex.get(key);
                    if (!existing) {
                        const row = { destinationName, first, last, estimated };
                        rowIndex.set(key, row);
                        rows.push(row);
                        return;
                    }

                    if (isJiuliDevelopmentDirection) {
                        if (first && (!existing.first || first < existing.first)) existing.first = first;
                        if (last && (!existing.last || last > existing.last)) existing.last = last;
                    }
                });
            });
        });
        return rows;
    }

    function renderRows(rows) {
        return rows.map((row) => {
            const first = escapeHtml(row.first);
            const last = escapeHtml(row.last);
            const time = first && last
                ? `${first}-${last}`
                : first ? `首班 ${first}` : `末班 ${last}`;
            const estimateLabel = row.estimated ? "<small>（推算）</small>" : "";
            return `${estimateLabel}开往${escapeHtml(row.destinationName)}：${time}`;
        }).join("<br>");
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "dalian-line-timetable",
            name: "大连首末班车",
            targetTab: "line-tab",
            order: 15,
            shouldRender({ station, lineInfo }) {
                return collectRows(station?.id, lineInfo?.id).length > 0;
            },
            render({ station, lineInfo }) {
                const today = new Date();
                const rows = collectRows(station?.id, lineInfo?.id, today);
                if (!rows.length) return "";
                return `
                    <div class="dalian-line-timetable-card" style="margin:8px 0 14px 0;">
                        <div class="stacard-info-content" style="width:100%;box-sizing:border-box;padding:4px 0;border-bottom:1px dashed var(--divider,rgba(0,0,0,.08));">
                            <div class="info-row">
                                <span class="info-label">首末班车<br><small>${getServiceDayLabel(today)}</small></span>
                                <span class="info-value">${renderRows(rows)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "dalian", moduleId: "dalian-line-timetable" }
    }));
})();
