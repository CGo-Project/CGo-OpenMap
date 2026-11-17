/**
 * 滨海快线「大站快车 / 直达快车」时刻（福州）
 *
 * 数据来源与推演口径
 * ------------------
 * 官网「站点查询」每站除普通车时刻外，另有一组快车时刻，采集时收在
 * `data_timetable.js` 该站的 **`fast`** 字段里（不是 `directions` —— 那里面是普通车）。
 * 例：东门 `fast.文岭 = "第二列(大站) 06:02"`，机场 `fast.文岭 = "第一列(直达) 06:30 | 第二列(大站) 06:38"`。
 *
 * 大站快车的**逐班发车时刻**官网未公布，只有「每日 7:00–22:00、约 60 分钟一班」
 * （`data_timetable.js` 的 `FUZHOU_LINE_INTERVALS.BE.peak` 原文）。按主理人确认的规则推演：
 *
 *   快车在各站 = **该站首班大站车的「分钟」每小时重复一次**（07:xx、08:xx … 22:xx）。
 *
 * 于是相邻两站「首班大站时刻」的分钟差，就是快车的区间用时；两个方向各自累加即端到端用时。
 * 本文件把推演结果**固化**下来，不在运行期重算 —— 推演过程与真值由
 * `tools/fuzhou_check.js` 第 ②-3 节逐项核对（从 `fast` 字段重新解析后比对）。
 *
 * 注意：`offset` 是从本方向首站起算的累计分钟，逐站递增；它同时等于
 *   （该站首班大站时刻 − 首站首班大站时刻），方向内不会跨小时错位。
 */

const FUZHOU_EXPRESS_SERVICE = {
    lineId: "BE",

    /** 行车间隔（分钟）：官网原文「大站快车(每日 7:00-22:00)：行车间隔约 60分钟 / 班」 */
    headwayMinutes: 60,

    /** 服务时段（整点，含两端）；快车只在这个区间内发车 */
    window: { startHour: 7, endHour: 22 },

    directions: {
        /* 去程：福州火车站 → 文岭。首班大站 06:00（官网 fast.文岭 的「第二列(大站)」） */
        wenling: {
            name: "福州火车站 → 文岭",
            from: "M104",
            to: "BE01",
            totalMinutes: 41,
            stops: [
                { id: "M104", firstExpress: "06:00", offset: 0 },
                { id: "M410", firstExpress: "06:02", offset: 2 },
                { id: "BE09", firstExpress: "06:07", offset: 7 },
                { id: "M423", firstExpress: "06:11", offset: 11 },
                { id: "BE04", firstExpress: "06:29", offset: 29 },
                { id: "BE02", firstExpress: "06:38", offset: 38 },
                { id: "BE01", firstExpress: "06:41", offset: 41 }
            ]
        },

        /* 回程：文岭 → 福州火车站。首班大站 05:55（官网 fast.福州火车站 的「第一列(大站)」） */
        fuzhou: {
            name: "文岭 → 福州火车站",
            from: "BE01",
            to: "M104",
            totalMinutes: 42,
            stops: [
                { id: "BE01", firstExpress: "05:55", offset: 0 },
                { id: "BE02", firstExpress: "06:00", offset: 5 },
                { id: "BE04", firstExpress: "06:07", offset: 12 },
                { id: "M423", firstExpress: "06:25", offset: 30 },
                { id: "BE09", firstExpress: "06:29", offset: 34 },
                { id: "M410", firstExpress: "06:35", offset: 40 },
                { id: "M104", firstExpress: "06:37", offset: 42 }
            ]
        }
    },

    /**
     * 直达快车：**单向、每日仅一班**，05:55 自福州火车站发往文岭。
     * 停靠站见 `data_lines.js` 的 way3；这里只记班次事实（不参与大站快车的整点网格）。
     */
    direct: {
        name: "直达快车",
        from: "M104",
        to: "BE01",
        departAt: "05:55",
        reverse: false,
        /* 停靠站（与 data_lines.js 的 way3 一致），供面板算「直达快车乘坐几站」 */
        stops: ["M104", "BE11", "BE09", "BE02", "BE01"],
        /* 逐站时刻（官网 fast.文岭 的「第一列(直达)」）与其相对首站的累计分钟：
           05:55 / 05:59 / 06:02 / 06:30 / 06:34 ⇒ 0 / 4 / 7 / 35 / 39，
           区间用时 4 / 3 / 28 / 4，端到端 39 分钟。 */
        totalMinutes: 39,
        directOffsets: {
            "M104": 0,
            "BE11": 4,
            "BE09": 7,
            "BE02": 35,
            "BE01": 39
        }
    }
};

/* ── 以下为纯函数访问器，供行程规划与自检共用；不做任何 I/O ────────────── */

/** "HH:MM" → 当日分钟数 */
function fuzhouExpressToMinutes(clock) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(clock || "").trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** 当日分钟数 → "HH:MM" */
function fuzhouExpressToClock(minuteOfDay) {
    if (!Number.isFinite(minuteOfDay)) return null;
    const m = ((minuteOfDay % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 某方向某站的快车发车（每小时的第几分钟）；站不在该方向时返回 null */
function fuzhouExpressMinuteOfHour(directionKey, stationId) {
    const dir = FUZHOU_EXPRESS_SERVICE.directions[directionKey];
    if (!dir) return null;
    const stop = dir.stops.find((s) => s.id === stationId);
    if (!stop) return null;
    const minutes = fuzhouExpressToMinutes(stop.firstExpress);
    return minutes === null ? null : minutes % 60;
}

/** 该站从首站起算的累计用时（分钟）；站不在该方向时返回 null */
function fuzhouExpressOffset(directionKey, stationId) {
    const dir = FUZHOU_EXPRESS_SERVICE.directions[directionKey];
    if (!dir) return null;
    const stop = dir.stops.find((s) => s.id === stationId);
    return stop ? stop.offset : null;
}

/**
 * 下一班快车：`afterMinuteOfDay` 之后（含等于）该站最早的一班，返回当日分钟数。
 * 超出「7:00–22:00」服务时段返回 null（末班 22:00 之后没有快车）。
 */
function fuzhouExpressNextDeparture(directionKey, stationId, afterMinuteOfDay) {
    const minuteOfHour = fuzhouExpressMinuteOfHour(directionKey, stationId);
    if (minuteOfHour === null || !Number.isFinite(afterMinuteOfDay)) return null;
    const { startHour, endHour } = FUZHOU_EXPRESS_SERVICE.window;
    const lastMinute = endHour * 60 + minuteOfHour;
    let candidate = Math.floor(afterMinuteOfDay / 60) * 60 + minuteOfHour;
    if (candidate < afterMinuteOfDay) candidate += 60;
    if (candidate < startHour * 60 + minuteOfHour) candidate = startHour * 60 + minuteOfHour;
    return candidate <= lastMinute ? candidate : null;
}

if (typeof window !== "undefined") {
    window.FUZHOU_EXPRESS_SERVICE = FUZHOU_EXPRESS_SERVICE;
    window.fuzhouExpressToMinutes = fuzhouExpressToMinutes;
    window.fuzhouExpressToClock = fuzhouExpressToClock;
    window.fuzhouExpressMinuteOfHour = fuzhouExpressMinuteOfHour;
    window.fuzhouExpressOffset = fuzhouExpressOffset;
    window.fuzhouExpressNextDeparture = fuzhouExpressNextDeparture;
}
