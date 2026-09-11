/**
 * CGo OpenMap - 沈阳车站位置与首末班车模块
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

    function getInfo(stationId, lineId) {
        return window.SHENYANG_STACARD_DATA?.[String(stationId)]?.[String(lineId)] || null;
    }

    function getLineById(lineId) {
        if (typeof linesData === "undefined" || !Array.isArray(linesData)) return null;
        return linesData.find((line) => line?.id === lineId) || null;
    }

    function resolveDestinationStationId(lineId, destination) {
        if (!destination) return "";
        if (destination !== "line-first" && destination !== "line-last") return String(destination);

        const line = getLineById(lineId);
        if (!line) return "";
        const stationIds = line.hasbranch
            ? (line["stationIds-way1"] || line.stationIds || [])
            : (line.stationIds || []);
        if (!stationIds.length) return "";
        return destination === "line-first" ? stationIds[0] : stationIds[stationIds.length - 1];
    }

    function getStationNameById(stationId) {
        if (typeof stationsData === "undefined") return "";
        return stationsData[String(stationId)]?.cn || "";
    }

    function getSeason() {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Shanghai",
            month: "numeric"
        }).formatToParts(new Date());
        const month = Number(parts.find((part) => part.type === "month")?.value);
        return {
            key: month >= 4 && month <= 10 ? "summer" : "winter",
            label: month >= 4 && month <= 10 ? "夏令时" : "冬令时"
        };
    }

    function formatServiceHours(serviceHours, season, lineId) {
        if (!Array.isArray(serviceHours)) return "";
        return serviceHours.map((item) => {
            const destinationId = resolveDestinationStationId(lineId, item.destination);
            const destinationName = getStationNameById(destinationId);
            const timeRange = item?.[season.key];
            if (!destinationName || !timeRange) return "";

            const first = timeRange.first ? escapeHtml(timeRange.first) : "";
            const last = timeRange.last ? escapeHtml(timeRange.last) : "";
            const hours = first && last
                ? `${first}-${last}`
                : first ? `首班 ${first}` : last ? `末班 ${last}` : "";
            if (!hours) return "";
            const noteText = String(item.note || "").trim();
            const note = noteText ? `（${escapeHtml(noteText)}）` : "";
            const leadingNote = noteText === "推算" ? `<small>${note}</small>` : "";
            const trailingNote = noteText === "推算" ? "" : note;
            return `${leadingNote}开往${escapeHtml(destinationName)}：${hours}${trailingNote}`;
        }).filter(Boolean).join("<br>");
    }

    function renderRows(info, lineId) {
        const season = getSeason();
        const rows = [];
        if (info.location) rows.push(["位置", escapeHtml(info.location)]);

        const serviceHours = formatServiceHours(info.serviceHours, season, lineId);
        if (serviceHours) rows.push([`首末班车<br><small>${escapeHtml(season.label)}</small>`, serviceHours]);
        if (Array.isArray(info.exits) && info.exits.length) {
            rows.push(["出入口", info.exits.map(escapeHtml).join("、")]);
        }

        return rows.map(([label, value]) => `
            <div class="info-row">
                <span class="info-label">${label}</span>
                <span class="info-value">${value || "暂无数据"}</span>
            </div>
        `).join("");
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "shenyang-service-info",
            name: "沈阳车站运营信息",
            targetTab: "line-tab",
            order: 15,
            shouldRender({ station, lineInfo }) {
                return Boolean(getInfo(station?.id, lineInfo?.id));
            },
            render({ station, lineInfo }) {
                const info = getInfo(station?.id, lineInfo?.id);
                if (!info) return "";
                return `
                    <div class="shenyang-service-info-card" style="margin:8px 0 14px 0;">
                        <div class="stacard-info-content" style="width:100%;box-sizing:border-box;padding:4px 0;border-bottom:1px dashed var(--divider,rgba(0,0,0,.08));">
                            ${renderRows(info, lineInfo.id)}
                        </div>
                    </div>
                `;
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-service-info" }
    }));
})();
