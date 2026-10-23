(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.OpenMapEditor = root.OpenMapEditor || {};
        root.OpenMapEditor.SegmentRouter = factory();
        root.SegmentRouter = root.OpenMapEditor.SegmentRouter;
    }
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    var AUTO = {
        axisTol: 2,          // 与坐标轴平行容差 (px)
        shortDiag: 12,       // 最短斜边长度
        diagRatio: 2.4       // 对角带判定：min/max 大于该倒数 (1/2.4 ≈ 0.417) 时视为可 135° 折角
    };

    function round2(v) {
        return Math.round(v * 100) / 100;
    }

    function dedupePoints(points) {
        var out = [];
        (points || []).forEach(function (p) {
            var last = out[out.length - 1];
            if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.5) {
                out.push({ x: round2(p.x), y: round2(p.y) });
            }
        });
        return out.length ? out : [{ x: round2(points[0].x), y: round2(points[0].y) }];
    }

    function dedupePointsKeepNid(points) {
        var out = [];
        (points || []).forEach(function (p) {
            var last = out[out.length - 1];
            if (last && Math.hypot(p.x - last.x, p.y - last.y) <= 0.01) {
                if (p.nid && !last.nid) last.nid = p.nid;
                return;
            }
            var item = { x: round2(p.x), y: round2(p.y) };
            if (p.nid) item.nid = p.nid;
            out.push(item);
        });
        return out;
    }

    function polylineLength(points) {
        var total = 0;
        for (var i = 1; i < (points || []).length; i++) {
            total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        }
        return total;
    }

    function samePolyline(p1, p2) {
        if (!p1 || !p2 || p1.length !== p2.length) return false;
        for (var i = 0; i < p1.length; i++) {
            if (round2(p1[i].x) !== round2(p2[i].x) || round2(p1[i].y) !== round2(p2[i].y)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 生成 90° 折角路径（轴平行 L 形走线）
     * @param {Object} a 起点 {x, y}
     * @param {Object} b 终点 {x, y}
     * @param {string} firstAxis 'vertical' | 'horizontal'
     */
    function buildRectPath(a, b, firstAxis) {
        if (Math.abs(a.x - b.x) <= AUTO.axisTol || Math.abs(a.y - b.y) <= AUTO.axisTol) {
            return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
        }
        var mid = { x: a.x, y: a.y };
        if (firstAxis === 'horizontal') mid.x = b.x;
        else mid.y = b.y;
        return dedupePoints([{ x: a.x, y: a.y }, mid, { x: b.x, y: b.y }]);
    }

    /** 两种 L 形走线中较短的一种 */
    function pickRectPath(a, b) {
        var rv = buildRectPath(a, b, 'vertical');
        var rh = buildRectPath(a, b, 'horizontal');
        var pick = polylineLength(rv) <= polylineLength(rh) ? rv : rh;
        return { points: pick, firstAxis: pick === rv ? 'vertical' : 'horizontal' };
    }

    /**
     * 生成 135° 折角路径（一段 45° 斜边 + 一段轴平行线段）
     * @param {Object} a
     * @param {Object} b
     * @param {string} firstAxis 'diagonal' | 'axis'
     */
    function buildDiagPath(a, b, firstAxis) {
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.min(Math.abs(dx), Math.abs(dy));
        if (len <= AUTO.axisTol) return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
        var sx = dx >= 0 ? 1 : -1, sy = dy >= 0 ? 1 : -1;
        var diagonalFirst = firstAxis !== 'axis';
        var mid = diagonalFirst
            ? { x: a.x + sx * len, y: a.y + sy * len }
            : { x: b.x - sx * len, y: b.y - sy * len };
        return dedupePoints([{ x: a.x, y: a.y }, mid, { x: b.x, y: b.y }]);
    }

    /**
     * 生成比例斜率路径（A:B 斜率）
     */
    function buildRatioPath(a, b, firstAxis, ratio) {
        var s = ratio || { m: 1, n: 1 };
        if (s.m === 1 && s.n === 1) return buildDiagPath(a, b, firstAxis);
        var dx = b.x - a.x, dy = b.y - a.y;
        var adx = Math.abs(dx), ady = Math.abs(dy);
        var A = (ady * s.m > adx * s.n) ? s.n : s.m;
        var B = (ady * s.m > adx * s.n) ? s.m : s.n;
        var k = Math.min(adx / A, ady / B);
        if (k * Math.hypot(A, B) <= AUTO.axisTol) return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
        var sx = dx >= 0 ? 1 : -1, sy = dy >= 0 ? 1 : -1;
        var diagonalFirst = firstAxis !== 'axis';
        var mid = diagonalFirst
            ? { x: a.x + sx * k * A, y: a.y + sy * k * B }
            : { x: b.x - sx * k * A, y: b.y - sy * k * B };
        return dedupePoints([{ x: a.x, y: a.y }, mid, { x: b.x, y: b.y }]);
    }

    /**
     * 生成斜 90° 折角路径（两段 45° 斜线相交）
     */
    function buildDiag90Path(a, b, flip) {
        var c1 = { x: (a.x - a.y + b.x + b.y) / 2, y: 0 };
        c1.y = a.y + (c1.x - a.x);
        var c2 = { x: (a.x + a.y + b.x - b.y) / 2, y: 0 };
        c2.y = a.y - (c2.x - a.x);
        var t1 = Math.abs(c1.x - a.x), t2 = Math.abs(c2.x - a.x);
        var primary = (t1 <= t2) ? c1 : c2;
        var secondary = (t1 <= t2) ? c2 : c1;
        var mid = flip ? secondary : primary;
        return dedupePoints([{ x: a.x, y: a.y }, mid, { x: b.x, y: b.y }]);
    }

    /**
     * 计算翻转折角后的走线点阵
     */
    function flippedPoints(seg, slopeRatio) {
        var pts = (seg && seg.points) || [];
        if (pts.length < 2) return null;
        var a = pts[0], b = pts[pts.length - 1];
        if (!a || !b) return null;
        var adx = Math.abs(a.x - b.x), ady = Math.abs(a.y - b.y);
        var minor = Math.min(adx, ady);

        if (seg.type === 'seg90' && minor > AUTO.axisTol) {
            var picked = pickRectPath(a, b);
            var def = picked.points;
            var alt = buildRectPath(a, b, picked.firstAxis === 'horizontal' ? 'vertical' : 'horizontal');
            if (samePolyline(alt, pts)) return samePolyline(def, pts) ? null : def;
            return alt;
        }
        if (seg.type === 'seg135' && pts.length === 3 && minor > AUTO.axisTol) {
            var d1 = buildDiagPath(a, b, 'diagonal'), d2 = buildDiagPath(a, b, 'axis');
            var target = samePolyline(pts, d1) ? d2 : d1;
            return samePolyline(pts, target) ? null : target;
        }
        if (seg.type === 'segratio' && pts.length === 3 && minor > AUTO.axisTol) {
            var rr = slopeRatio || { m: 1, n: 1 };
            var q1 = buildRatioPath(a, b, 'diagonal', rr), q2 = buildRatioPath(a, b, 'axis', rr);
            if (samePolyline(q1, q2)) return null;
            var qTarget = samePolyline(pts, q1) ? q2 : q1;
            return samePolyline(pts, qTarget) ? null : qTarget;
        }
        if (seg.type === 'seg90d') {
            var v1 = buildDiag90Path(a, b, false), v2 = buildDiag90Path(a, b, true);
            if (samePolyline(v1, v2)) return null;
            return samePolyline(pts, v1) ? v2 : v1;
        }
        return null;
    }

    /**
     * 翻转线段折角方向
     */
    function flipSegmentCorner(seg, slopeRatio) {
        var flipped = flippedPoints(seg, slopeRatio);
        if (!flipped) return false;
        var pts = seg.points;
        var first = pts[0], last = pts[pts.length - 1];
        var next = flipped.map(function (p) { return { x: round2(p.x), y: round2(p.y) }; });
        next[0] = { x: first.x, y: first.y };
        next[next.length - 1] = { x: last.x, y: last.y };
        if (first.nid) next[0].nid = first.nid;
        if (last.nid) next[next.length - 1].nid = last.nid;
        seg.points = next;
        seg.cornerFlip = !seg.cornerFlip;
        return true;
    }

    /**
     * 根据两端点自动判定走线类型与路径
     */
    function autoRouteBetween(a, b, flip, slopeRatio) {
        var dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
        var major = Math.max(dx, dy), minor = Math.min(dx, dy);

        // 1. 与坐标轴平行 -> 自由直线
        if (minor <= AUTO.axisTol) {
            return {
                type: 'segaxis',
                points: [{ x: round2(a.x), y: round2(a.y) }, { x: round2(b.x), y: round2(b.y) }]
            };
        }

        // 2. 对角带内 -> 135° 折角或比例斜率
        var s = slopeRatio || { m: 1, n: 1 };
        if (minor * s.m * AUTO.diagRatio >= major * s.n && minor >= AUTO.shortDiag) {
            if (s.m === 1 && s.n === 1) {
                return { type: 'seg135', points: buildDiagPath(a, b, flip ? 'axis' : 'diagonal') };
            }
            return { type: 'segratio', points: buildRatioPath(a, b, flip ? 'axis' : 'diagonal', s) };
        }

        // 3. 其余情况 -> 90° 直角走线
        var picked = pickRectPath(a, b);
        if (!flip) return { type: 'seg90', points: picked.points };
        return {
            type: 'seg90',
            points: buildRectPath(a, b, picked.firstAxis === 'horizontal' ? 'vertical' : 'horizontal')
        };
    }

    /**
     * 按指定类型生成两点间走线
     */
    function routeBetweenByType(a, b, type, flip, slopeRatio) {
        if (type === 'seg135') return buildDiagPath(a, b, flip ? 'axis' : 'diagonal');
        if (type === 'segratio') return buildRatioPath(a, b, flip ? 'axis' : 'diagonal', slopeRatio);
        if (type === 'seg90d') return buildDiag90Path(a, b, flip);
        if (type === 'seg90') {
            if (flip) {
                var picked = pickRectPath(a, b);
                return buildRectPath(a, b, picked.firstAxis === 'horizontal' ? 'vertical' : 'horizontal');
            }
            return pickRectPath(a, b).points;
        }
        return [{ x: round2(a.x), y: round2(a.y) }, { x: round2(b.x), y: round2(b.y) }];
    }

    /**
     * 端点移动时的正交导轨协同推移求解
     * 保持 90°、135°、水平/垂直连线形态不畸变
     * @param {Array<{x:number, y:number, nid?:string, r?:number}>} pts 折线点阵
     * @param {number} draggedIdx 被拖动的端点下标 (0 或 pts.length - 1)
     * @param {{x:number, y:number}} oldPos 移动前坐标
     * @param {{x:number, y:number}} newPos 移动后目标坐标
     * @param {string} [segType] 走线类型 (seg90, seg135, seg90d, segaxis...)
     * @param {Object} [slopeRatio] 斜率比例 (默认 {m:1, n:1})
     * @returns {boolean} 是否成功应用了协同推移
     */
    function preserveOrthogonalShift(pts, draggedIdx, oldPos, newPos, segType, slopeRatio) {
        if (!pts || pts.length < 3) return false;
        var dx = newPos.x - oldPos.x;
        var dy = newPos.y - oldPos.y;
        if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return false;

        // 若为标准 3 点折角线段且指定了 routed 类型，基于新端点重算中间折角并保持原有折角朝向
        if (pts.length === 3 && segType && segType !== 'segaxis') {
            var startPt = draggedIdx === 0 ? newPos : pts[0];
            var endPt = draggedIdx === 2 ? newPos : pts[2];

            if (segType === 'seg90') {
                var firstLegWasHoriz = Math.abs(pts[0].y - pts[1].y) <= AUTO.axisTol;
                var reRouted90 = buildRectPath(startPt, endPt, firstLegWasHoriz ? 'horizontal' : 'vertical');
                if (reRouted90 && reRouted90.length === 3) {
                    pts[1].x = reRouted90[1].x;
                    pts[1].y = reRouted90[1].y;
                    return true;
                }
            } else if (segType === 'seg135') {
                var firstLegWasDiag = Math.abs(Math.abs(pts[0].x - pts[1].x) - Math.abs(pts[0].y - pts[1].y)) <= AUTO.axisTol;
                var reRouted135 = buildDiagPath(startPt, endPt, firstLegWasDiag ? 'diagonal' : 'axis');
                if (reRouted135 && reRouted135.length === 3) {
                    pts[1].x = reRouted135[1].x;
                    pts[1].y = reRouted135[1].y;
                    return true;
                }
            } else {
                var reRouted = routeBetweenByType(startPt, endPt, segType, false, slopeRatio);
                if (reRouted && reRouted.length === 3) {
                    pts[1].x = reRouted[1].x;
                    pts[1].y = reRouted[1].y;
                    return true;
                }
            }
        }

        // 通用多折点正交保持：检测相邻连线形态
        var adjIdx = (draggedIdx === 0) ? 1 : pts.length - 2;
        var nextIdx = (draggedIdx === 0) ? 2 : pts.length - 3;
        var adj = pts[adjIdx];
        if (adj && !adj.nid) {
            var isHoriz = Math.abs(oldPos.y - adj.y) <= AUTO.axisTol;
            var isVert = Math.abs(oldPos.x - adj.x) <= AUTO.axisTol;
            var isDiag = Math.abs(Math.abs(oldPos.x - adj.x) - Math.abs(oldPos.y - adj.y)) <= AUTO.axisTol;

            if (isHoriz && !isVert) {
                adj.y = newPos.y;
                return true;
            } else if (isVert && !isHoriz) {
                adj.x = newPos.x;
                return true;
            } else if (isDiag && pts[nextIdx]) {
                var next = pts[nextIdx];
                var nextIsHoriz = Math.abs(adj.y - next.y) <= AUTO.axisTol;
                var nextIsVert = Math.abs(adj.x - next.x) <= AUTO.axisTol;
                if (nextIsHoriz) {
                    var signX = (oldPos.x >= adj.x) ? 1 : -1;
                    var diagLen = Math.abs(newPos.y - adj.y);
                    adj.x = newPos.x - signX * diagLen;
                    return true;
                } else if (nextIsVert) {
                    var signY = (oldPos.y >= adj.y) ? 1 : -1;
                    var diagLen2 = Math.abs(newPos.x - adj.x);
                    adj.y = newPos.y - signY * diagLen2;
                    return true;
                }
            }
        }
        return false;
    }

    return {
        buildRectPath: buildRectPath,
        pickRectPath: pickRectPath,
        buildDiagPath: buildDiagPath,
        buildRatioPath: buildRatioPath,
        buildDiag90Path: buildDiag90Path,
        polylineLength: polylineLength,
        dedupePoints: dedupePoints,
        dedupePointsKeepNid: dedupePointsKeepNid,
        samePolyline: samePolyline,
        flippedPoints: flippedPoints,
        flipSegmentCorner: flipSegmentCorner,
        autoRouteBetween: autoRouteBetween,
        routeBetweenByType: routeBetweenByType,
        preserveOrthogonalShift: preserveOrthogonalShift
    };
});
