/**
 * CGo OpenMap - 交路（Routing / Way）模型 (core/line-routing.js)
 *
 * 「交路」是运营意义上的一条完整运行径路：从一端终点站开到另一端终点站。
 * 以前数据层把它叫「支线」，且只支持 way1 / way2 两条；本模块把它提升为
 * 一等公民：
 *   · 一条线路可以有 1 ~ 99 条交路：stationIds-way1 … stationIds-way99；
 *   · 站序仍写成完整交路（含与其它交路共用的区段），走向仍按
 *     pathPoints-main（所有交路共用的主干）+ pathPoints-branchN（wayN 独有区段）拆分；
 *   · 高亮以「车站 → 经过它的交路 → 这些交路经过的全部走向与车站」推导，
 *     而不是以前那种「按 way1/way2 硬编码互相淡化」的写法。
 *
 * 由此得到两条用户可见的规则（本模块的 plan() 就是它的唯一实现）：
 *   1. 点主干（共用区段）上的车站：经过它的交路 = 全部交路 ⇒ 主线、支线一起亮；
 *   2. 点某条交路独有的车站：只亮这条交路 ⇒ 支线 + 它贯通的主线区段
 *      （例：上海 11 号线点花桥 ⇒ 花桥—嘉定新城—迪士尼）。
 *
 * 走向与交路的对应关系（顺序即优先级）：
 *   1. pathPoints-main / pathPoints ⇒ 所有交路共用（只画一次，所以只高亮一次）；
 *   2. pathPoints-branchN / pathPoints-wayN ⇒ 仅 wayN 使用；
 *   3. 其它 pathPoints-* ⇒ 视为所有交路共用（历史遗留写法，不影响渲染）；
 *   4. 值是对象 { points, ways: ["way1","way2"] } 时可显式声明一条被部分交路
 *      共用的区段（多个 way 重叠在同一区间时用它，避免重复绘制）；
 *   5. 以上都没有 ⇒ 按各交路站序取站点坐标连线（单交路与旧行为一致）。
 *
 * 同一份点阵若被写了两遍（坐标完全相同），按点阵哈希合并为一段并合并交路归属，
 * 因此「多个 way 重叠在同一区间」只会画一次、也只高亮一次。
 *
 * 线路走向的渲染仍由 core/path-geometry.js 的 lineSegments() 统一分发，
 * 那里会直接转调本模块，保证引擎、编辑器与城市模块共用同一份判定。
 */

(function (root, factory) {
    const api = factory();
    root.CGoLineRouting = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    /** 交路数量的硬上限（way1 … way99） */
    const MAX_WAYS = 99;

    const STATION_KEY_RE = /^stationIds-(way\d+|branch\d+)$/;
    const PATH_KEY_RE = /^pathPoints(?:-(.+))?$/;

    /** 取线路自己的交路键（stationIds-wayN），按 N 升序 */
    function wayKeysOfLine(line) {
        const found = [];
        if (!line || typeof line !== 'object') return found;
        Object.keys(line).forEach((key) => {
            const m = STATION_KEY_RE.exec(key);
            if (!m || !Array.isArray(line[key])) return;
            const num = parseInt(String(m[1]).replace(/\D/g, ''), 10);
            if (!Number.isFinite(num) || num < 1 || num > MAX_WAYS) return;
            // 键名里带 wayN/branchN 都接受，但统一用 wayN 作为交路身份。
            found.push({ key, wayKey: 'way' + num, index: num });
        });
        found.sort((a, b) => a.index - b.index);
        return found;
    }

    /**
     * 线路的全部交路。
     * @returns {Array<{key:string, index:number, name:string, ids:string[],
     *                  distances:any[], idsKey:string, distKey:string}>}
     */
    function ways(line) {
        if (!line || typeof line !== 'object') return [];
        const named = (line.wayNames && typeof line.wayNames === 'object') ? line.wayNames : {};
        const out = [];
        const wayKeys = wayKeysOfLine(line);
        wayKeys.forEach(({ key, wayKey, index }) => {
            const ids = Array.isArray(line[key]) ? line[key] : [];
            out.push({
                key: wayKey,
                index,
                name: typeof named[wayKey] === 'string' ? named[wayKey] : '',
                ids,
                distances: line['distances-' + key.replace(/^stationIds-/, '')] || [],
                idsKey: key,
                distKey: 'distances-' + key.replace(/^stationIds-/, '')
            });
        });
        if (out.length) return out;
        // 无交路键 ⇒ 单交路：stationIds（允许缺省，如 isPointOnly 或只画走向的线路）
        const ids = Array.isArray(line.stationIds) ? line.stationIds : [];
        return [{
            key: 'way1',
            index: 1,
            name: typeof named.way1 === 'string' ? named.way1 : '',
            ids,
            distances: Array.isArray(line.distances) ? line.distances : [],
            idsKey: 'stationIds',
            distKey: 'distances'
        }];
    }

    function wayCount(line) {
        return ways(line).length;
    }

    /** 是否是多交路（分支）线路 */
    function isBranchLine(line) {
        return ways(line).length > 1;
    }

    /** 线路涉及的全部车站 ID（跨交路去重，保持首次出现顺序） */
    function allStationIds(line) {
        const seen = new Set();
        ways(line).forEach((w) => w.ids.forEach((id) => seen.add(id)));
        return Array.from(seen);
    }

    /** 经过该站的交路对象数组 */
    function waysOfStation(line, stationId) {
        if (!stationId) return [];
        return ways(line).filter((w) => w.ids.includes(stationId));
    }

    function wayKeysOfStation(line, stationId) {
        return waysOfStation(line, stationId).map((w) => w.key);
    }

    /** 车站详情面板「上一站/下一站」用的主交路：取站序里第一条经过它的交路 */
    function primaryWay(line, stationId) {
        return waysOfStation(line, stationId)[0] || null;
    }

    /**
     * 交路的显示名：优先 wayNames，其次用首末站名拼「A—B」，都缺时退回「交路N」。
     * @param {object} line
     * @param {string|{key:string}} wayOrKey
     * @param {object} [stations] 车站字典（用于拼首末站名）
     */
    function wayLabel(line, wayOrKey, stations) {
        const list = ways(line);
        // 传字符串键但该交路不存在时返回空，避免把 way1 的名字张冠李戴
        const way = typeof wayOrKey === 'string'
            ? list.find((w) => w.key === wayOrKey)
            : (wayOrKey && wayOrKey.key ? list.find((w) => w.key === wayOrKey.key) : list[0]);
        if (!way) return '';
        if (way.name) return way.name;
        const ids = way.ids;
        if (stations && ids.length >= 2) {
            const a = stations[ids[0]];
            const b = stations[ids[ids.length - 1]];
            if (a && b && a.cn && b.cn) return `${a.cn}—${b.cn}`;
        }
        return list.length > 1 ? `交路${way.index}` : '';
    }

    /** 线路站序分组（与 OpenMap Editor 的 lineStationGroups 同形） */
    function stationGroups(line) {
        const out = [];
        if (Array.isArray(line && line.stationIds)) {
            out.push({
                idsKey: 'stationIds', distKey: 'distances',
                ids: line.stationIds, distances: line.distances, wayKey: 'way1'
            });
        }
        wayKeysOfLine(line).forEach(({ key, wayKey }) => {
            out.push({
                idsKey: key,
                distKey: 'distances-' + key.replace(/^stationIds-/, ''),
                ids: line[key],
                distances: line['distances-' + key.replace(/^stationIds-/, '')],
                wayKey
            });
        });
        return out;
    }

    /** 点阵签名：同一段走向写了两遍时用它判重 */
    function pointsSignature(points) {
        let sig = '';
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const x = Math.round(p.x * 100) / 100;
            const y = Math.round(p.y * 100) / 100;
            sig += (i ? ';' : '') + x + ',' + y;
        }
        return sig;
    }

    /** 把 pathPoints-* 的值归一化为 { points, ways } */
    function readPathEntry(line, key, value, allWayKeys) {
        if (value && !Array.isArray(value) && Array.isArray(value.points)) {
            const declared = Array.isArray(value.ways) ? value.ways.filter((w) => allWayKeys.includes(w)) : [];
            return { points: value.points, ways: declared.length ? declared : allWayKeys.slice() };
        }
        if (!Array.isArray(value) || value.length < 2) return null;
        const suffix = (PATH_KEY_RE.exec(key) || [])[1] || '';
        if (!suffix || suffix === 'main') return { points: value, ways: allWayKeys.slice() };
        const m = /^(?:branch|way)(\d+)$/.exec(suffix);
        if (m) {
            const wayKey = 'way' + parseInt(m[1], 10);
            // 声明的交路不存在时退回「所有交路共用」，避免整段走向消失在图上
            return { points: value, ways: allWayKeys.includes(wayKey) ? [wayKey] : allWayKeys.slice() };
        }
        return { points: value, ways: allWayKeys.slice() };
    }

    /**
     * 线路的走向分段：每段只出现一次，并带上使用它的交路集合。
     *
     * @param {object} line
     * @param {object} [stations] 车站字典，仅在「没有 pathPoints、要按站序兜底连线」时使用
     * @returns {Array<{key:string, cls:string, points:Array, ways:Set<string>}>}
     */
    function segments(line, stations) {
        if (!line || line.isPointOnly) return [];
        const routeWays = ways(line);
        const allWayKeys = routeWays.map((w) => w.key);
        const out = [];
        const bySignature = new Map();

        const emit = (key, points, waysList) => {
            if (!Array.isArray(points) || points.length < 2) return;
            const sig = pointsSignature(points);
            const exist = bySignature.get(sig);
            if (exist) {
                // 同一段被多个 way 各写一遍：合并归属，不再重复入列（只画一次、只亮一次）
                waysList.forEach((w) => exist.ways.add(w));
                if (!exist.aliases.includes(key)) exist.aliases.push(key);
                return;
            }
            const suffix = (PATH_KEY_RE.exec(key) || [])[1] || 'main';
            const piece = {
                key,
                cls: 'seg-' + (suffix === 'main' || !suffix ? 'main' : suffix),
                points,
                ways: new Set(waysList),
                aliases: [key]
            };
            bySignature.set(sig, piece);
            out.push(piece);
        };

        // 1. 显式声明的走向（普通 pathPoints / pathPoints-main / pathPoints-branchN …）
        let hasExplicit = false;
        Object.keys(line).forEach((key) => {
            if (!PATH_KEY_RE.test(key)) return;
            const entry = readPathEntry(line, key, line[key], allWayKeys);
            if (!entry) return;
            if (Array.isArray(line[key]) && line[key].length >= 2) hasExplicit = true;
            if (line[key] && !Array.isArray(line[key]) && Array.isArray(line[key].points) && line[key].points.length >= 2) hasExplicit = true;
            emit(key, entry.points, entry.ways);
        });
        if (hasExplicit) return out;

        // 2. 多交路（分支）线路必须显式给走向：各交路在分叉处该怎么画无法由站序唯一确定，
        //    强行按站序连线会在共用区段重复叠线。单交路才回退到「按站序直连」。
        if (routeWays.length > 1 || line.hasbranch) return out;

        // 3. 单交路兜底：按站序取站点坐标连成一段（站点缺坐标时跳过该点）
        const points = routeWays[0].ids
            .map((id) => {
                const s = stations && stations[id];
                return s ? { x: s.x, y: s.y } : null;
            })
            .filter(Boolean);
        emit('pathPoints', points, allWayKeys);
        return out;
    }

    /** 交路 → 走向分段反查（编辑器与规划器用） */
    function segmentsOfWay(line, wayKey, stations) {
        return segments(line, stations).filter((seg) => seg.ways.has(wayKey));
    }

    /**
     * 车站高亮方案：点中某个车站时该亮哪些交路、哪些走向、哪些车站。
     *
     * @param {object} line
     * @param {string} [stationId] 缺省（点图例线路头）时视为整条线路全亮
     * @param {object} [stations] 车站字典，仅站序兜底连线时用
     * @returns {{
     *   allLit:boolean, litWays:Set<string>, dimWays:Set<string>,
     *   litSegKeys:Set<string>, dimSegKeys:Set<string>,
     *   litStationIds:Set<string>, dimStationIds:string[]
     * }}
     */
    function plan(line, stationId, stations) {
        const routeWays = ways(line);
        const allWayKeys = routeWays.map((w) => w.key);
        const owners = stationId ? routeWays.filter((w) => w.ids.includes(stationId)).map((w) => w.key) : [];
        // 车站不属于任何交路（如 isPointOnly 或数据缺站序）⇒ 不做局部高亮，整条亮起
        const litWays = new Set(owners.length ? owners : allWayKeys);
        const dimWays = new Set(allWayKeys.filter((k) => !litWays.has(k)));

        const litStationIds = new Set();
        routeWays.forEach((w) => {
            if (litWays.has(w.key)) w.ids.forEach((id) => litStationIds.add(id));
        });
        const dimStationIds = [];
        allStationIds(line).forEach((id) => {
            if (!litStationIds.has(id)) dimStationIds.push(id);
        });

        const litSegKeys = new Set();
        const dimSegKeys = new Set();
        segments(line, stations).forEach((seg) => {
            let lit = false;
            seg.ways.forEach((k) => { if (litWays.has(k)) lit = true; });
            if (lit) litSegKeys.add(seg.key); else dimSegKeys.add(seg.key);
            // 去重合并时保留的别名键（同一段被多个 way 写了两遍）也要一起处理
            (seg.aliases || []).forEach((alias) => {
                if (alias === seg.key) return;
                if (lit) litSegKeys.add(alias); else dimSegKeys.add(alias);
            });
        });

        return {
            allLit: dimWays.size === 0,
            litWays,
            dimWays,
            litSegKeys,
            dimSegKeys,
            litStationIds,
            dimStationIds
        };
    }

    return {
        MAX_WAYS,
        ways,
        wayCount,
        isBranchLine,
        allStationIds,
        waysOfStation,
        wayKeysOfStation,
        primaryWay,
        wayLabel,
        stationGroups,
        segments,
        segmentsOfWay,
        plan,
        pointsSignature
    };
});
