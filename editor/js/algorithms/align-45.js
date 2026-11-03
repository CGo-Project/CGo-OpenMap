/**
 * 开放地图编辑器 (OpenMap Editor) - 45°/90° 角度对齐器（纯函数，零依赖）
 *
 * 目的：把整份工程里所有走向折线与车站链**一次性**对齐到 45° 的整数倍方向
 * （0°/45°/90°/135°，即轴段与斜段），让手工描摹留下的 2~5° 歪斜归零。
 *
 * 算法（逐点顺序投影，确定且可解释）：
 *   1. 一条折线的第一个点固定不动（它通常钉在车站或端点锚点上）；
 *   2. 从第二个点起，把它「以前一个已对齐点为起点」投影到最近的 45° 射线上，
 *      保留投影长度 → 该段方向恰好是 0/45/90/135°，且尽量少动；
 *   3. 下一个点再以这个新位置为起点重复，于是整条折线逐段都是 45°/90°。
 *
 * 对齐后带 `nid` 的折点会同步移动对应车站，车站与折线不会脱开。
 * 只做几何，不碰任何城市私有字段。
 */
window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.Align45 = (function () {
    'use strict';

    var STEP = Math.PI / 4;
    var EPS = 0.005;

    function r2(v) {
        return Math.round((Number(v) || 0) * 100) / 100;
    }

    /**
     * 把「起点 → 目标点」约束到 45° 的整数倍方向。
     * 投影而非截断，所以拖动时长度仍然跟手。
     * @param {{x:number,y:number}} start
     * @param {{x:number,y:number}} point
     * @param {number} [gridSize] >0 时把长度也量化到网格（轴段取 g 的倍数，斜段取 g·√2 的倍数）
     * @returns {{x:number,y:number}}
     */
    function constrainTo45(start, point, gridSize) {
        if (!start || !point) return point;
        var dx = point.x - start.x;
        var dy = point.y - start.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (!len) return { x: point.x, y: point.y };

        var ang = Math.round(Math.atan2(dy, dx) / STEP) * STEP;
        var ux = Math.cos(ang), uy = Math.sin(ang);
        var proj = dx * ux + dy * uy;
        if (proj < 0) proj = 0;

        var g = Number(gridSize) || 0;
        if (g > 0) {
            var axisAligned = Math.abs(ux) < 1e-6 || Math.abs(uy) < 1e-6;
            proj = axisAligned
                ? Math.round(proj / g) * g
                : Math.round(proj / (g * Math.SQRT2)) * g * Math.SQRT2;
        }

        return {
            x: r2(start.x + ux * proj),
            y: r2(start.y + uy * proj)
        };
    }

    /**
     * 沿一条折线逐段对齐到 45°/90°（首点固定）。
     * @param {Array<{x:number,y:number,nid?:string}>} points
     * @param {{grid?:number}} [opts]
     * @returns {{points:Array, moved:number, maxShift:number, changed:boolean}}
     */
    function alignChain(points, opts) {
        opts = opts || {};
        if (!Array.isArray(points) || points.length === 0) {
            return { points: [], moved: 0, maxShift: 0, changed: false };
        }

        var out = [];
        var moved = 0;
        var maxShift = 0;

        var first = {};
        Object.keys(points[0]).forEach(function (k) { first[k] = points[0][k]; });
        first.x = r2(points[0].x);
        first.y = r2(points[0].y);
        out.push(first);

        var prev = { x: first.x, y: first.y };
        for (var i = 1; i < points.length; i++) {
            var src = points[i];
            var aligned = constrainTo45(prev, { x: Number(src.x) || 0, y: Number(src.y) || 0 }, opts.grid);
            var shift = Math.sqrt(Math.pow(aligned.x - (Number(src.x) || 0), 2) + Math.pow(aligned.y - (Number(src.y) || 0), 2));
            if (shift > EPS) moved++;
            if (shift > maxShift) maxShift = shift;

            var next = {};
            Object.keys(src).forEach(function (k) { next[k] = src[k]; });
            // 已经在对角线上（偏差不足 0.01px）时保留原值，避免二次取整产生 0.01px 抖动，
            // 这样重复执行"45/90 对齐"是严格幂等的。
            var srcX = Number(src.x) || 0;
            var srcY = Number(src.y) || 0;
            if (Math.abs(aligned.x - srcX) < 0.01 && Math.abs(aligned.y - srcY) < 0.01) {
                next.x = r2(srcX);
                next.y = r2(srcY);
                if (shift > EPS) moved++;   // 仍在 0.01 以内，不计入移动
                if (shift <= EPS && out.length) { /* 视为未变 */ }
            } else {
                next.x = r2(aligned.x);
                next.y = r2(aligned.y);
            }
            out.push(next);

            prev = { x: next.x, y: next.y };
        }

        return { points: out, moved: moved, maxShift: r2(maxShift), changed: moved > 0 };
    }

    /**
     * 判断相邻点方向是否已落在 45° 的整数倍上。
     * @param {Array<{x:number,y:number}>} points
     * @param {number} [tolDeg=0.5] 角度容差（度）
     */
    function isChainOn45(points, tolDeg) {
        if (!Array.isArray(points) || points.length < 2) return true;
        var tol = (tolDeg === undefined ? 0.5 : tolDeg) * Math.PI / 180;
        for (var i = 1; i < points.length; i++) {
            var dx = (Number(points[i].x) || 0) - (Number(points[i - 1].x) || 0);
            var dy = (Number(points[i].y) || 0) - (Number(points[i - 1].y) || 0);
            if (dx === 0 && dy === 0) continue;                     // 重合点不参与角度判定
            var ang = Math.atan2(dy, dx);
            var off = Math.abs(ang / STEP - Math.round(ang / STEP)) * STEP;
            if (off > tol && Math.abs(off - Math.PI) > tol) return false;
        }
        return true;
    }

    /**
     * 对整份工程生成对齐方案（**不修改入参**，由调用方决定是否应用）。
     *
     * 处理范围：
     *   - `project.segments[]`：每条走向折线逐段对齐；带 `nid` 的折点同步移动对应车站；
     *   - 没有任何走向几何、只有站序的线路：按 `stationIds(-wayN)` 顺序对齐车站；
     *   - `project.notOpenLines[]`：在建/规划虚线的折点。
     *
     * @param {Object} project
     * @param {{grid?:number}} [opts]
     * @returns {{segments:Array<{id:string,points:Array}>, notOpen:Array<{index:number,points:Array}>,
     *            nodes:Object<string,{x:number,y:number}>,
     *            stats:{polylineCount:number,stationChainCount:number,movedPoints:number,
     *                   movedStations:number,maxShift:number,changed:boolean}}}
     */
    function alignProject(project, opts) {
        opts = opts || {};
        var grid = Number(opts.grid) || 0;
        var result = {
            segments: [],
            notOpen: [],
            nodes: {},
            stats: {
                polylineCount: 0,
                stationChainCount: 0,
                movedPoints: 0,
                movedStations: 0,
                maxShift: 0,
                skippedHandTuned: 0,
                changed: false
            }
        };
        if (!project) return result;

        var placedStations = {};     // 已被折线锚定或已对齐过的车站：不再二次移动

        /**
         * 这条折线是否"作者手工调过倒角"。
         * - 线路声明 useStrictRounding：明确要求收紧倒角，不应重排；
         * - 一半以上折点带 r（例如上海全网逐点 r:0 的直角密折点、北京 CAE 的 r:400/550）：
         *   这些半径与当时的夹角绑定，改角度会让它们失去意义。
         * 这类折线一律跳过，宁可不整齐也不破坏作者的手工成果。
         */
        function isHandTunedPolyline(points, lineConf) {
            if (lineConf && lineConf.useStrictRounding) return true;
            if (!Array.isArray(points) || !points.length) return false;
            var withR = points.filter(function (p) { return p && p.r !== undefined; }).length;
            return withR * 2 >= points.length;
        }

        function trackShift(shift) {
            if (shift > result.stats.maxShift) result.stats.maxShift = shift;
        }

        function moveStation(nid, x, y) {
            if (!nid || !project.nodes || !project.nodes[nid]) return;
            placedStations[nid] = true;
            var cur = project.nodes[nid];
            if (Math.abs(cur.x - x) < EPS && Math.abs(cur.y - y) < EPS) return;
            result.nodes[nid] = { x: r2(x), y: r2(y) };
            result.stats.movedStations++;
            trackShift(Math.sqrt(Math.pow(cur.x - x, 2) + Math.pow(cur.y - y, 2)));
        }

        /* 1. 走向折线：线段（CAD）优先，它们带着 nid 锚点 */
        // 城市数据里的 pathPoints 往往没有 nid（例如苏州、上海的一部分线路），
        // 折点就是"描"在车站上的坐标。若只挪折点不挪车站，车站就会被甩在线外，
        // 看起来正是"折点过去了、渲染没跟过去"。所以这里在**对齐前**先给每个折点
        // 认领最近的、尚未被认领的车站，对齐后再把车站搬到折点的新位置。
        // 只认领"基本压在同一位置"的车站：手描的站通常距折点 1~2px，
        // 容差给大了会把有意偏移的站（换乘错位、国铁散布站）硬拽到折点上。
        var stationTol = (opts.stationTolerance === undefined ? 6 : Number(opts.stationTolerance));
        var snapStations = opts.snapStations === undefined ? true : !!opts.snapStations;
        var claimedStations = {};     // nid → true（已被某个折点认领，避免两点抢一站）

        function findStationAt(x, y) {
            if (!snapStations || stationTol <= 0 || !project.nodes) return null;
            var best = null, bestD = stationTol;
            Object.keys(project.nodes).forEach(function (nid) {
                if (claimedStations[nid]) return;
                var node = project.nodes[nid];
                if (!node || node.x === undefined || node.y === undefined) return;
                var d = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
                if (d <= bestD) { bestD = d; best = nid; }
            });
            return best;
        }

        var lineConfMap = {};
        (project.lines || []).forEach(function (l) { if (l && l.id) lineConfMap[l.id] = l; });

        (project.segments || []).forEach(function (seg) {
            if (!seg || !Array.isArray(seg.points) || seg.points.length < 2) return;
            if (isHandTunedPolyline(seg.points, lineConfMap[seg.lineId])) {
                result.stats.skippedHandTuned = (result.stats.skippedHandTuned || 0) + 1;
                return;
            }

            // 先按"对齐前"的坐标认领，避免对齐后位置漂移导致认错站
            var claims = seg.points.map(function (p, idx) {
                if (p && p.nid) return p.nid;
                var nid = findStationAt(Number(p.x) || 0, Number(p.y) || 0);
                if (nid) claimedStations[nid] = true;
                return nid;
            });

            var res = alignChain(seg.points, { grid: grid });
            if (res.changed) {
                result.segments.push({ id: seg.id, points: res.points });
                result.stats.polylineCount++;
                result.stats.movedPoints += res.moved;
                trackShift(res.maxShift);
            }
            // 折点上的 nid：车站跟着走，避免车站与走向脱开；
            // 没有 nid 但被认领的车站（描在折点上的站）同样跟着搬 ——
            // 但**只有该折点本身真的动了**才搬，否则重复执行会平白拖动"只是靠近折点"的车站。
            res.points.forEach(function (p, idx) {
                var nid = (p && p.nid) ? p.nid : claims[idx];
                if (!nid) return;
                var oldP = seg.points[idx] || {};
                var vertexMoved = Math.abs((Number(oldP.x) || 0) - p.x) > EPS ||
                    Math.abs((Number(oldP.y) || 0) - p.y) > EPS;
                if (p.nid) {
                    // 带 nid 的锚点始终与折点保持一致（折点动没动都要对齐）
                    moveStation(nid, p.x, p.y);
                } else if (vertexMoved) {
                    moveStation(nid, p.x, p.y);
                }
            });
        });

        /* 2. 只有在"完全没有走向几何"的线路上，才用站序来对齐（会移动车站） */
        var segLineIds = {};
        (project.segments || []).forEach(function (s) { if (s && s.lineId) segLineIds[s.lineId] = true; });

        (project.lines || []).forEach(function (line) {
            if (!line || segLineIds[line.id]) return;
            if (line.isPointOnly) return;

            var groups = null;
            if (window.OpenMapEditor.CityProjectIO && window.OpenMapEditor.CityProjectIO.lineStationGroups) {
                groups = window.OpenMapEditor.CityProjectIO.lineStationGroups(line);
            }
            if (!groups || !groups.length) {
                // 兜底：普通线路直接读 stationIds
                if (Array.isArray(line.stationIds) && line.stationIds.length) {
                    groups = [{ ids: line.stationIds }];
                } else {
                    return;
                }
            }

            groups.forEach(function (g) {
                var ids = (g && g.ids) || [];
                if (ids.length < 2) return;

                var anchorNid = ids[0];
                var anchor = project.nodes[anchorNid];
                if (!anchor) return;

                result.stats.stationChainCount++;
                var prev = { x: anchor.x, y: anchor.y };

                for (var i = 1; i < ids.length; i++) {
                    var nid = ids[i];
                    var node = project.nodes[nid];
                    if (!node) continue;

                    // 已经被别的线路/折线定死的车站：不再移动，但仍作为下一段的起点
                    if (placedStations[nid]) {
                        prev = { x: node.x, y: node.y };
                        continue;
                    }

                    var aligned = constrainTo45(prev, { x: node.x, y: node.y }, grid);
                    moveStation(nid, aligned.x, aligned.y);
                    prev = { x: aligned.x, y: aligned.y };
                }
            });
        });

        /* 3. 在建 / 规划虚线的折点 */
        (project.notOpenLines || []).forEach(function (ln, idx) {
            if (!ln || !Array.isArray(ln.points) || ln.points.length < 2) return;
            var res = alignChain(ln.points, { grid: grid });
            if (res.changed) {
                result.notOpen.push({ index: idx, points: res.points });
                result.stats.polylineCount++;
                result.stats.movedPoints += res.moved;
                trackShift(res.maxShift);
            }
        });

        result.stats.maxShift = r2(result.stats.maxShift);
        result.stats.changed = result.stats.movedPoints > 0 || result.stats.movedStations > 0;
        return result;
    }

    return {
        constrainTo45: constrainTo45,
        alignChain: alignChain,
        isChainOn45: isChainOn45,
        alignProject: alignProject
    };
})();

window.Align45 = window.OpenMapEditor.Align45;
