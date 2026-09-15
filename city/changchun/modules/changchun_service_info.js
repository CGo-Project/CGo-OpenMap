/**
 * CGo OpenMap - 长春车站首末班车模块
 *
 * 时刻数据来自用户提供的长春轨道交通首末班车图片；官网查询链接仍由
 * data_timetable.js 中的 GLOBAL_SCHEDULE_DATA 单独维护。
 */
(function () {
    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const getEntries = (stationId, lineId) => {
        const lineData = window.CHANGCHUN_TIMETABLE_DATA?.[String(lineId)];
        return lineData?.[String(stationId)] || [];
    };

    const getStationName = (stationId) => {
        if (typeof stationsData === "undefined") return String(stationId || "");
        return stationsData[String(stationId)]?.cn || String(stationId || "");
    };

    const getSeason = () => {
        const month = Number(new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Shanghai",
            month: "numeric"
        }).format(new Date()));
        return month >= 5 && month <= 10
            ? { key: "summer", label: "夏令时" }
            : { key: "winter", label: "冬令时" };
    };

    const getDayType = () => {
        const weekday = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Shanghai",
            weekday: "short"
        }).format(new Date());
        return ["Sat", "Sun"].includes(weekday)
            ? { key: "weekend", label: "节假日" }
            : { key: "workday", label: "工作日" };
    };

    const formatFirst = (first, dayType) => {
        if (!first) return "";
        return escapeHtml(first[dayType.key] || first.workday || first.weekend || "");
    };

    const renderScheduleRow = (entries, season, dayType) => {
        const schedule = entries.map((entry) => {
            const destination = escapeHtml(getStationName(entry.destination));
            const first = formatFirst(entry.first, dayType);
            const last = escapeHtml(entry[season.key] || "");
            if (!destination || (!first && !last)) return "";
            const timeRange = first && last ? `${first}-${last}` : first || last;
            return `开往${destination}：${escapeHtml(timeRange)}`;
        }).filter(Boolean).join("<br>");
        if (!schedule) return "";
        return `
            <div class="info-row">
                <span class="info-label">首末班车<br><small>${season.label} ${dayType.label}</small></span>
                <span class="info-value">${schedule}</span>
            </div>
        `;
    };

    const register = () => {
        if (!window.StationBoard?.registerModule) return;
        window.StationBoard.registerModule({
            id: "changchun-service-info",
            name: "长春首末班车",
            targetTab: "line-tab",
            order: 15,
            shouldRender({ station, lineInfo }) {
                return getEntries(station?.id, lineInfo?.id).length > 0;
            },
            render({ station, lineInfo }) {
                const entries = getEntries(station?.id, lineInfo?.id);
                if (!entries.length) return "";
                const season = getSeason();
                const dayType = getDayType();
                return `
                    <section class="changchun-service-info-card" style="margin:8px 0 14px 0;">
                        <div class="stacard-info-content" style="width:100%;box-sizing:border-box;padding:4px 0;border-bottom:1px dashed var(--divider,rgba(0,0,0,.08));">
                            ${renderScheduleRow(entries, season, dayType)}
                        </div>
                    </section>
                `;
            }
        });
    };

    register();
    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "changchun", moduleId: "changchun-service-info" }
    }));
})();
