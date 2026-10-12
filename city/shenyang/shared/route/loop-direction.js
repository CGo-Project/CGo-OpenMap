/**
 * CGo OpenMap - 环线乘车方向文案（三城共享层）
 * ==============================================================================
 * 环线没有「终点站」，报方向只能给「下一站 + 内环 / 外环」。
 * 中国等**右侧通行**的城市，环线默认「内环 = 顺时针、外环 = 逆时针」；
 * 城市若要反着叫，可在 {city}.js 里声明：
 *
 *     window.CGO_LOOP_DIRECTION = { clockwise: "外环", counterclockwise: "内环" };
 *
 * ⚠️ 顺 / 逆按**站序**（`stationIds` 的顺序）判定，不按折线的画法 ——
 * 调用方拿到的 `dir`（规划内核给出的 ±1）正是相对站序的，两者必须同一口径；
 * 折线的绘制方向未必与站序一致，用折线去判会把内环外环彻底弄反。
 *
 * 判定方法：对站点坐标按站序做鞋带公式（有向面积）。SVG 的 y 轴朝下，
 * 屏幕上的逆时针对应面积为负，顺时针为正。
 *
 * 用法：
 *   CGoLoopDirection.of(line, dir)              → "内环" / "外环"，非环线或判不出时 ""
 *   CGoLoopDirection.label(line, dir, 下一站名)  → "开往湘江路（内环）"，判不出时 ""
 * ==============================================================================
 */
(function () {
    const DEFAULT_NAMES = { clockwise: "内环", counterclockwise: "外环" };

    const stationTable = () => {
        if (typeof stationsData !== "undefined" && stationsData) return stationsData;
        if (typeof STATIONS_DATA !== "undefined" && STATIONS_DATA) return STATIONS_DATA;
        return null;
    };

    /** 环线按站序取站点坐标；缺坐标的站跳过（环线不应有，跳了也不会误判方向） */
    function ringPoints(line) {
        const stations = stationTable();
        const ids = Array.isArray(line?.stationIds) ? line.stationIds : null;
        if (!stations || !ids || ids.length < 3) return null;
        const points = ids.map((id) => stations[id])
            .filter((station) => station && Number.isFinite(station.x) && Number.isFinite(station.y));
        return points.length >= 3 ? points : null;
    }

    /** 有向面积的两倍（鞋带公式）。首尾自动相连；SVG y 轴朝下：负值＝屏幕上的逆时针 */
    function signedArea(points) {
        let sum = 0;
        for (let i = 0; i < points.length; i += 1) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            sum += a.x * b.y - b.x * a.y;
        }
        return sum;
    }

    // 站序朝向与线路对象本身一一对应，缓存即可（线路对象不会重建）
    const orientationCache = new WeakMap();

    /** 站序在屏幕上的朝向："cw" 顺时针 / "ccw" 逆时针 / "" 判不出 */
    function orientation(line) {
        if (!line || !line.isLoop) return "";
        if (orientationCache.has(line)) return orientationCache.get(line);
        const points = ringPoints(line);
        let value = "";
        if (points) {
            const area = signedArea(points);
            if (area > 0) value = "cw";
            else if (area < 0) value = "ccw";
        }
        orientationCache.set(line, value);
        return value;
    }

    /**
     * 环别文案。
     * @param {object} line - 线路数据（需 isLoop: true 且带 stationIds）
     * @param {number} dir  - 沿站序的前进方向：+1 正向、-1 反向（规划内核给出的就是这个口径）
     * @returns {string} "内环" / "外环"；非环线、方向非法或坐标判不出时返回 ""
     */
    function of(line, dir) {
        const kind = orientation(line);
        if (!kind || (dir !== 1 && dir !== -1)) return "";
        const names = Object.assign({}, DEFAULT_NAMES, window.CGO_LOOP_DIRECTION || {});
        // 沿站序正向走，站序顺时针时是内环，逆时针时是外环；反向取另一个名字
        const clockwise = (kind === "cw") === (dir === 1);
        return clockwise ? names.clockwise : names.counterclockwise;
    }

    /**
     * 环线乘车方向文案：「开往X（内环）」。
     * 判不出环别（非环线等）时返回 ""，由调用方沿用原有的「开往X」。
     */
    function label(line, dir, nextName) {
        const ring = of(line, dir);
        if (!ring || !nextName) return "";
        return `开往${nextName}（${ring}）`;
    }

    window.CGoLoopDirection = { of, label, orientation };
})();
