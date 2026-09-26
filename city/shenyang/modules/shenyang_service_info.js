/**
 * CGo OpenMap - 沈阳车站位置与首末班车模块
 *
 * 取数逻辑（有轨端点表、季节阈值、位置与出入口）留在本模块；
 * 「归一化行 → HTML」「终点站代号解析」「季节标签差异判定」交由共享渲染层处理
 * （city/shenyang/shared/timetable-renderer.js）。
 *
 * 本模块同时渲染「位置」「首末班车」「出入口」三行，故用 renderCardShell +
 * renderInfoRow 自行组合，而非直接调用 renderCard。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    function getInfo(stationId, lineId) {
        return window.SHENYANG_STACARD_DATA?.[String(stationId)]?.[String(lineId)] || null;
    }

    function getTramwayTimetable(lineId) {
        const timetable = window.SHENYANG_TRAMWAY_TIMETABLE?.[String(lineId)];
        return timetable && Array.isArray(timetable.endpoints) ? timetable : null;
    }

    function getTramwayOriginInfos(lineId) {
        const timetable = getTramwayTimetable(lineId);
        if (!timetable) return [];
        return timetable.endpoints.filter((endpoint) => endpoint && (endpoint.first || endpoint.last));
    }

    function getLineById(lineId) {
        if (typeof linesData === "undefined" || !Array.isArray(linesData)) return null;
        return linesData.find((line) => line?.id === lineId) || null;
    }

    function isTramLine(lineId) {
        const line = getLineById(lineId);
        return Boolean(
            String(lineId || "").toUpperCase().startsWith("HNT")
            || String(line?.name || "").includes("有轨")
        );
    }

    /** 季节阈值属城市数据（沈阳 4–10 月夏令时）；判定与文案由共享层统一提供 */
    const SEASON_CONFIG = { summerFrom: 4, summerTo: 10 };

    /** 地铁：serviceHours → 归一化行；seasonKey 决定取夏冬哪一套时刻 */
    function serviceRows(serviceHours, lineId, seasonKey) {
        if (!Array.isArray(serviceHours)) return [];
        const line = getLineById(lineId);
        return serviceHours.map((item) => {
            const timeRange = item?.[seasonKey];
            return {
                destination: CGoTimetable.resolveDestination(line, item?.destination),
                first: timeRange?.first || "",
                last: timeRange?.last || "",
                note: item?.note || ""
            };
        }).filter((row) => row.destination && (row.first || row.last));
    }

    /** 有轨：端点站始发时刻 → 归一化行（该表不区分工作日/节假日与夏冬） */
    function tramwayRows(lineId) {
        const infos = getTramwayOriginInfos(lineId);
        if (!infos.length) return [];
        const timetable = getTramwayTimetable(lineId) || {};
        return infos.map((info) => ({
            destination: info.stationName || "",
            first: info.first || "",
            last: info.last || "",
            mode: "origin",
            note: timetable.dailySinglePair ? "每日1对" : ""
        })).filter((row) => row.destination && (row.first || row.last));
    }

    /** 某线路在某季节下的全部行；有轨无季节维度，两季返回相同结果 */
    function rowsFor(info, lineId, seasonKey) {
        if (isTramLine(lineId)) return tramwayRows(lineId);
        return serviceRows(info?.serviceHours, lineId, seasonKey);
    }

    function renderRows(info, lineId) {
        const season = CGoTimetable.getSeason(SEASON_CONFIG);
        const isTram = isTramLine(lineId);
        const rows = rowsFor(info, lineId, season.key);
        const blocks = [];

        if (info?.location) {
            blocks.push(CGoTimetable.renderInfoRow("位置", CGoTimetable.escapeHtml(info.location)));
        }

        const timetableText = CGoTimetable.renderRows(rows);
        if (timetableText) {
            // 季节标签：仅当夏冬时刻确有差异时才显示；有轨无季节维度，恒不显示
            const otherRows = isTram ? [] : rowsFor(info, lineId, season.otherKey);
            const seasonLabel = !isTram && !CGoTimetable.sameRows(rows, otherRows)
                ? season.label
                : "";
            blocks.push(CGoTimetable.renderInfoRow(
                CGoTimetable.buildLabel("首末班车", { seasonLabel }),
                timetableText
            ));
        }

        if (Array.isArray(info?.exits) && info.exits.length) {
            blocks.push(CGoTimetable.renderInfoRow(
                "出入口",
                info.exits.map(CGoTimetable.escapeHtml).join("、")
            ));
        }

        return CGoTimetable.renderCardShell(blocks.join(""));
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "shenyang-timetable",
            name: "沈阳车站运营信息",
            targetTab: "line-tab",
            order: 15,
            shouldRender({ station, lineInfo }) {
                return Boolean(
                    getInfo(station?.id, lineInfo?.id)
                    || (isTramLine(lineInfo?.id) && getTramwayOriginInfos(lineInfo?.id).length > 0)
                );
            },
            render({ station, lineInfo }) {
                const info = getInfo(station?.id, lineInfo?.id);
                if (!info && !(isTramLine(lineInfo?.id) && getTramwayOriginInfos(lineInfo?.id).length > 0)) return "";
                return renderRows(info, lineInfo?.id);
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-timetable" }
    }));
})();
