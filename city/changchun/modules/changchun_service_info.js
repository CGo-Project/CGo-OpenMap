/**
 * CGo OpenMap - 长春车站首末班车模块
 *
 * 取数逻辑（季节阈值、四维数据的读取方式）留在本模块；
 * 「归一化行 → HTML」「日期类型判定」「季节与日期类型标签的差异判定」交由共享渲染层
 * 处理（city/shenyang/shared/timetable-renderer.js）。
 *
 * 时刻数据来自长春轨道交通官网各线路首末班车图（录入于 data_timetable.js）；
 * 官网查询链接仍由 data_timetable.js 中的 GLOBAL_SCHEDULE_DATA 单独维护。
 */
(function () {
    /**
     * 取某站某线路的时刻表条目
     *
     * 5 号线开通前，换乘站以「未开通侧」ID（如 0127-1）出现在站序里；开通时刻一到，
     * 共享层 opening-schedule 会把站序引用改指到既有站（0127）并移除未开通侧条目，
     * 而时刻表数据仍按原 ID 存放，故此处双向回退查询，避免开通瞬间丢数据。
     */
    const getEntries = (stationId, lineId) => {
        const lineData = window.CHANGCHUN_TIMETABLE_DATA?.[String(lineId)];
        if (!lineData) return [];
        const sid = String(stationId);
        return lineData[sid] || lineData[`${sid}-1`] || lineData[sid.replace(/-1$/, "")] || [];
    };

    /** 季节阈值属城市数据（长春 5–10 月夏令时）；判定与文案由共享层统一提供 */
    const SEASON_CONFIG = { summerFrom: 5, summerTo: 10 };

    /**
     * 生成某季节 + 某日期类型下的归一化行
     *
     * 日期类型键名与共享层契约一致（workday / restday）；长春无调休日历，
     * 由共享层 CGoDayType 按星期判定。
     *
     * destination 与沈阳保持同一语义（终点站）：既可能是 "line-first" / "line-last"
     * 代号，也可能是具体站 ID（区间车、或线路延长后时刻表尚未覆盖的旧终点），
     * 两者都交由共享层 resolveDestination 解析，本模块不再自行查站名。
     */
    function buildRows(line, entries, seasonKey, dayKey) {
        return entries.map((entry) => {
            const firstSlot = entry?.first || {};
            return {
                destination: CGoTimetable.resolveDestination(line, entry?.destination),
                // 首班按日期类型取值，缺项时沿用原实现的回退链（workday → restday）
                first: firstSlot[dayKey] || firstSlot.workday || firstSlot.restday || "",
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
    function buildMeta(line, entries, season, dayType) {
        const dayKey = dayType.key;
        const otherDayKey = dayKey === "workday" ? "restday" : "workday";
        const rows = buildRows(line, entries, season.key, dayKey);
        const meta = {};
        if (!CGoTimetable.sameRows(rows, buildRows(line, entries, season.otherKey, dayKey))) {
            meta.seasonLabel = season.label;
        }
        if (!CGoTimetable.sameRows(rows, buildRows(line, entries, season.key, otherDayKey))) {
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
                // 未开通车站（含暂缓开通）不展示运营时刻——否则会抢跑，
                // 把「尚未开通」的站显示出时刻表；开通时刻到期后站型转正即自动展示。
                if (String(station?.type || "") === "no") return false;
                return getEntries(station?.id, lineInfo?.id).length > 0;
            },
            render({ station, lineInfo }) {
                const entries = getEntries(station?.id, lineInfo?.id);
                if (!entries.length) return "";

                const season = CGoTimetable.getSeason(SEASON_CONFIG);
                const dayType = CGoDayType.resolve(new Date());
                const rows = buildRows(lineInfo, entries, season.key, dayType.key);
                return CGoTimetable.renderCard({ rows, meta: buildMeta(lineInfo, entries, season, dayType) });
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "changchun", moduleId: "changchun-timetable" }
    }));
})();
