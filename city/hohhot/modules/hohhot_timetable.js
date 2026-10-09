/**
 * CGo OpenMap - 呼和浩特首末班车信息板模块
 * (city/hohhot/modules/hohhot_timetable.js)
 *
 * 取数留在本模块（读 data_timetable.js 的 GLOBAL_SCHEDULE_DATA），
 * 「归一化行 → HTML」交由共享渲染层处理
 * （city/shenyang/shared/station/timetable-renderer.js，window.CGoTimetable）。
 * 挂载于「线路」选项卡（line-tab），order 15 —— 夹在「地图卡片」(stacard, order 10)
 * 与「上一站 / 下一站」(adjacent-stations, order 20) 之间，与沈阳 / 大连同一排法。
 *
 * 数据源：呼和浩特地铁官网「列车时刻表」，见 data_timetable.js 的文件头。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    /** 取本站本线的官方时刻记录（无则返回 null） */
    function getEntry(stationId, lineId) {
        if (typeof GLOBAL_SCHEDULE_DATA === "undefined" || !GLOBAL_SCHEDULE_DATA) return null;
        if (!stationId || !lineId) return null;
        const byLine = GLOBAL_SCHEDULE_DATA[lineId];
        return (byLine && byLine[stationId]) || null;
    }

    /** 官方记录 → 共享层归一化行模型（destination / first / last） */
    function toRows(entry) {
        return Object.keys(entry.directions || {}).map((destination) => ({
            destination,
            first: entry.directions[destination].first,
            last: entry.directions[destination].last
        }));
    }

    window.StationBoard.registerModule({
        id: "hohhot-line-timetable",
        name: "呼和浩特首末班车",
        targetTab: "line-tab",
        order: 15,
        shouldRender({ station, lineInfo }) {
            const entry = getEntry(station && station.id, lineInfo && lineInfo.id);
            return Boolean(entry && Object.keys(entry.directions || {}).length);
        },
        render({ station, lineInfo }) {
            const entry = getEntry(station && station.id, lineInfo && lineInfo.id);
            if (!entry) return "";
            const rows = toRows(entry);
            const timetable = window.CGoTimetable;
            if (timetable && typeof timetable.renderCard === "function") {
                return timetable.renderCard({ rows });
            }
            // 共享层尚未就绪时的纯文本兜底
            return rows.map((row) => `开往${row.destination}: ${row.first}-${row.last}`).join("<br>");
        }
    });

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "hohhot", moduleId: "hohhot-line-timetable" }
    }));
})();
