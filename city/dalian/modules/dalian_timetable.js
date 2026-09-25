/**
 * CGo OpenMap - 大连官方首末班车信息板模块
 *
 * 取数逻辑（贯通区段合并、九里开发方向合并、推算标记、调休日历）留在本模块；
 * 「归一化行 → HTML」「日期类型判定」「标签差异判定」交由共享渲染层处理
 * （city/shenyang/shared/timetable-renderer.js）。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const getCalendar = () => window.DALIAN_TIMETABLE_CALENDAR;

    function getEntries(stationId, lineId) {
        if (typeof window.getDalianTimetableInfoEntries === "function") {
            return window.getDalianTimetableInfoEntries(stationId, lineId);
        }
        const info = window.DALIAN_TIMETABLE_DATA?.[String(stationId)]?.[String(lineId)];
        return info ? [{ lineId: String(lineId), info }] : [];
    }

    /**
     * 收集归一化行
     *
     * 业务逻辑与原实现一致，仅输出字段名对齐统一契约（destinationName → destination）。
     */
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
                    const destination = direction.destinationName || "未知终点";
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
                        const row = { destination, first, last, estimated };
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

    /**
     * 日期类型标签：仅当「工作日」与「节假日」时刻确有差异时才显示
     *
     * 标签用于区分当前用的是哪一套时刻表，不是装饰；两者完全相同时隐去。
     */
    function buildDayTypeMeta(stationId, lineId, rows, today) {
        const dayType = CGoDayType.resolve(today, { calendar: getCalendar() });
        const otherKey = dayType.key === "workday" ? "restday" : "workday";
        const otherDate = CGoDayType.findDate(otherKey, today, { calendar: getCalendar() });
        const otherRows = otherDate ? collectRows(stationId, lineId, otherDate) : [];
        return CGoTimetable.sameRows(rows, otherRows) ? {} : { dayTypeLabel: dayType.label };
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "dalian-timetable",
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
                return CGoTimetable.renderCard({
                    rows,
                    meta: buildDayTypeMeta(station?.id, lineInfo?.id, rows, today)
                });
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "dalian", moduleId: "dalian-timetable" }
    }));
})();
