/**
 * CGo OpenMap - 长春车站首末班车模块
 *
 * 取数逻辑（季节阈值、四维数据的读取方式）留在本模块；
 * 「归一化行 → HTML」「日期类型判定」「季节与日期类型标签的差异判定」交由共享渲染层
 * 处理（city/shenyang/shared/timetable-renderer.js）。
 *
 * 时刻数据来自用户提供的长春轨道交通首末班车图片；官网查询链接仍由
 * data_timetable.js 中的 GLOBAL_SCHEDULE_DATA 单独维护。
 */
(function () {
    const getEntries = (stationId, lineId) => {
        const lineData = window.CHANGCHUN_TIMETABLE_DATA?.[String(lineId)];
        return lineData?.[String(stationId)] || [];
    };

    const getStationName = (stationId) => {
        if (typeof stationsData === "undefined") return String(stationId || "");
        return stationsData[String(stationId)]?.cn || String(stationId || "");
    };

    /**
     * 季节：阈值属城市数据（长春为 5–10 月夏令时），故保留在本模块，
     * 不随共享层统一。
     */
    function getSeason() {
        const month = Number(new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Shanghai",
            month: "numeric"
        }).format(new Date()));
        const isSummer = month >= 5 && month <= 10;
        return {
            key: isSummer ? "summer" : "winter",
            otherKey: isSummer ? "winter" : "summer",
            label: isSummer ? "夏令时" : "冬令时"
        };
    }

    /**
     * 数据中「休息日」的键名为 weekend，与统一契约的 restday 对应。
     * 长春无调休日历，日期类型由共享层按星期判定。
     */
    const dayKeyOf = (key) => (key === "restday" ? "weekend" : "workday");

    /** 生成某季节 + 某日期类型下的归一化行 */
    function buildRows(entries, seasonKey, dayKey) {
        return entries.map((entry) => {
            const firstSlot = entry?.first || {};
            return {
                destination: getStationName(entry?.destination),
                // 首班按日期类型取值，缺项时沿用原实现的回退链（workday → weekend）
                first: firstSlot[dayKey] || firstSlot.workday || firstSlot.weekend || "",
                last: entry?.[seasonKey] || ""
            };
        }).filter((row) => row.destination && (row.first || row.last));
    }

    /**
     * 标签：仅当该维度确有差异时才显示
     *
     * 标签用于区分当前用的是哪一套时刻表，不是装饰；某维度取另一分支后
     * 结果完全相同则隐去该维度标签。
     */
    function buildMeta(entries, season, dayType) {
        const dayKey = dayKeyOf(dayType.key);
        const otherDayKey = dayKey === "workday" ? "weekend" : "workday";
        const rows = buildRows(entries, season.key, dayKey);
        const meta = {};
        if (!CGoTimetable.sameRows(rows, buildRows(entries, season.otherKey, dayKey))) {
            meta.seasonLabel = season.label;
        }
        if (!CGoTimetable.sameRows(rows, buildRows(entries, season.key, otherDayKey))) {
            meta.dayTypeLabel = dayType.label;
        }
        return meta;
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "changchun-timetable",
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
                const dayType = CGoDayType.resolve(new Date());
                const rows = buildRows(entries, season.key, dayKeyOf(dayType.key));
                return CGoTimetable.renderCard({ rows, meta: buildMeta(entries, season, dayType) });
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "changchun", moduleId: "changchun-timetable" }
    }));
})();
