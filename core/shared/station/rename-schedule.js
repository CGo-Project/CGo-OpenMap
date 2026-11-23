/**
 * CGo OpenMap - 站名更名的定时生效 (core/shared/station/rename-schedule.js)
 *
 * 时间语义与 opening-schedule.js 一致：站点数据一律存**更名后**的现名，
 * 本层在更名日之前把显示名回退成旧名（含英文 / 蒙文），并把新名登记进检索别名；
 * 到点整页刷新，回退自然消失——此后图上就是数据里的现名。
 *
 * 为什么需要它：更名日之前，官方后台、广播、导向标识都还是旧名（站牌也可能用贴纸盖回），
 * 若直接渲染数据里的新名，就会出现「图上比官方早几天改名」的错位；而如果把旧名写回数据，
 * 到点又得人工再改一次。让沿革里的 rename 事件按时生效，两个问题一起解决。
 *
 * 数据源只有一个：开通沿革 data_opening_history.js 的 kind === "rename" 事件
 * （from / to / date，可选 fromEn / fromMn / sid）。城市把它与 data_opening_history.js
 * 一起引入即可；没有该数据、或没有未来事件时，整段不产生任何动作。
 *
 * 加载方式：classic script，须晚于城市 data_opening_history.js、早于 core/script.js 的
 * processData()（core/script.js 在 init() 之前调用 CGoRenameSchedule.apply()）。
 */
(function () {
    "use strict";

    /** 沿革里的日期是「东八区当日 00:00 生效」 */
    const TZ_SUFFIX = "T00:00:00+08:00";

    /** setTimeout 的上限（约 24.8 天），超过则不设定时器，下次刷新页面时重新计算 */
    const MAX_TIMEOUT = 2147483647;

    let reloadTimer = null;

    function openingHistory() {
        if (typeof CGO_OPENING_HISTORY !== "undefined" && Array.isArray(CGO_OPENING_HISTORY)) {
            return CGO_OPENING_HISTORY;
        }
        return Array.isArray(window.CGO_OPENING_HISTORY) ? window.CGO_OPENING_HISTORY : [];
    }

    function stationsTable() {
        return (typeof stationsData !== "undefined" && stationsData) ? stationsData : null;
    }

    function parseRenameDate(value) {
        if (typeof value !== "string") return null;
        const text = value.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
        const date = new Date(text + TZ_SUFFIX);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    /** 更名条目指向哪座车站：优先 sid，老数据按「新名 = 现名或曾用名」反查 */
    function findStationId(spec, table) {
        if (spec.sid && table[spec.sid]) return spec.sid;
        if (!spec.to) return null;
        return Object.keys(table).find((id) => {
            const station = table[id];
            return station && (station.cn === spec.to
                || (Array.isArray(station.aliases) && station.aliases.includes(spec.to)));
        }) || null;
    }

    function rollbackStation(station, spec) {
        if (!station || !spec.from) return;
        station.cn = spec.from;
        if (spec.fromEn) station.en = spec.fromEn;
        if (spec.fromMn) station.mn = spec.fromMn;
        // 新名留在检索别名里：更名日之前搜「白塔」也应能找到该站
        const aliases = Array.isArray(station.aliases) ? station.aliases.slice() : [];
        [spec.to, spec.toEn].forEach((name) => {
            if (name && !aliases.includes(name)) aliases.push(name);
        });
        station.aliases = aliases;
        // 供按站名做的经纬度匹配（最近车站 / 车站地图卡片）回查：
        // 这两处读的是 amap_data.json，里面存的仍是更名后的新名
        if (spec.to) {
            window.CGO_STATION_NAME_ALIASES = window.CGO_STATION_NAME_ALIASES || {};
            window.CGO_STATION_NAME_ALIASES[spec.from] = spec.to;
        }
    }

    /**
     * 时刻表数据自带一份站名与「方向键」（终点站名），需同步回退，
     * 否则方向名与车站对不上，信息板的方向文案会出现「白塔方向」而站名已回退成旧名。
     */
    function rollbackTimetable(stationId, spec) {
        if (typeof GLOBAL_SCHEDULE_DATA === "undefined" || !GLOBAL_SCHEDULE_DATA) return;
        Object.values(GLOBAL_SCHEDULE_DATA).forEach((lineTable) => {
            if (!lineTable || typeof lineTable !== "object") return;
            const entry = lineTable[stationId];
            if (entry && entry.cn === spec.to) {
                entry.cn = spec.from;
                if (typeof entry.url === "string") {
                    entry.url = entry.url.replace(/site_name=[^&]*/, "site_name=" + encodeURIComponent(spec.from));
                }
            }
            Object.values(lineTable).forEach((row) => {
                if (!row || !row.directions || typeof row.directions !== "object") return;
                if (!Object.prototype.hasOwnProperty.call(row.directions, spec.to)) return;
                row.directions[spec.from] = row.directions[spec.to];
                delete row.directions[spec.to];
            });
        });
    }

    /** 在 processData() 之前调用：把更名日尚未到来的车站回退成旧名 */
    function apply() {
        const table = stationsTable();
        const events = openingHistory();
        if (!table || !events.length) return "noop";

        const now = Date.now();
        let nextAt = null;

        events.forEach((ev) => {
            if (!ev || ev.kind !== "rename") return;
            const at = parseRenameDate(ev.date);
            if (!at) return;
            // 已生效的事件：数据本身就是现名，不必回退
            if (at.getTime() <= now) return;
            const specs = (Array.isArray(ev.renames) && ev.renames.length) ? ev.renames : [ev];
            specs.forEach((spec) => {
                const stationId = findStationId(spec, table);
                if (!stationId) return;
                rollbackStation(table[stationId], spec);
                rollbackTimetable(stationId, spec);
            });
            if (!nextAt || at < nextAt) nextAt = at;
        });

        if (nextAt && reloadTimer === null) {
            const delay = nextAt.getTime() - Date.now();
            // 超过 setTimeout 上限就不设定时器（否则会在错误的时间点触发刷新），
            // 下次打开页面时会重新计算 —— 与 opening-schedule.js 同口径
            if (delay > 0 && delay <= MAX_TIMEOUT) {
                reloadTimer = setTimeout(() => { window.location.reload(); }, delay);
            }
        }
        return nextAt ? "rolled-back" : "noop";
    }

    window.CGoRenameSchedule = {
        apply,
        /** 仅用于调试 / 自检：暴露解析函数 */
        parseRenameDate
    };
})();
