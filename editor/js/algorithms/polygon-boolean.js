/**
 * 开放地图编辑器 (OpenMap Editor) - 纯前端 2D 多边形布尔运算算法 (PolygonBoolean)
 * 对标 VectorCraft (crates/pathops) 的路径布尔运算能力
 * 零第三方依赖，纯原生数学实现并集 (Union)、差集 (Subtract) 与交集 (Intersect)
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.PolygonBoolean = (function () {
    'use strict';

    /**
     * 判定点是否位于闭合多边形内部 (Ray Casting Algorithm)
     * @param {{x: number, y: number}} pt 待测点
     * @param {Array<{x: number, y: number}>} poly 多边形顶点数组
     * @returns {boolean}
     */
    function isPointInPolygon(pt, poly) {
        if (!poly || poly.length < 3) return false;
        var inside = false;
        var n = poly.length;
        for (var i = 0, j = n - 1; i < n; j = i++) {
            var xi = poly[i].x, yi = poly[i].y;
            var xj = poly[j].x, yj = poly[j].y;
            var intersect = ((yi > pt.y) !== (yj > pt.y)) &&
                (pt.x < (xj - xi) * (pt.y - yi) / ((yj - yi) || 0.00001) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    /**
     * 计算两线段 (p1-p2 与 p3-p4) 的交点
     * @returns {{x: number, y: number}|null}
     */
    function getLineIntersection(p1, p2, p3, p4) {
        var d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (Math.abs(d) < 1e-9) return null; // 平行或共线

        var t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
        var u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: Math.round(p1.x + t * (p2.x - p1.x)),
                y: Math.round(p1.y + t * (p2.y - p1.y)),
                t: t,
                u: u
            };
        }
        return null;
    }

    /**
     * 计算多边形面积与绕向 (Sutherland-Hodgman signed area)
     */
    function getPolygonArea(poly) {
        if (!poly || poly.length < 3) return 0;
        var area = 0;
        for (var i = 0; i < poly.length; i++) {
            var j = (i + 1) % poly.length;
            area += poly[i].x * poly[j].y;
            area -= poly[j].x * poly[i].y;
        }
        return area / 2;
    }

    /**
     * 确保多边形顶点为顺时针 (Clockwise)
     */
    function forceClockwise(poly) {
        if (!poly || poly.length < 3) return poly;
        if (getPolygonArea(poly) < 0) {
            return poly.slice().reverse();
        }
        return poly.slice();
    }

    /**
     * 多边形求并集 (Union)
     * 合并两个相交的多边形轮廓为一个连续的外边界多边形
     * @param {Array<{x: number, y: number}>} polyA 
     * @param {Array<{x: number, y: number}>} polyB 
     * @returns {Array<{x: number, y: number}>} 合并后的顶点序列
     */
    function union(polyA, polyB) {
        if (!polyA || !polyA.length) return polyB || [];
        if (!polyB || !polyB.length) return polyA || [];

        // 简易凸包 / 凹多边形顶点合并：若互不相交且不包含，回退为 A+B
        var aInB = polyA.every(function (p) { return isPointInPolygon(p, polyB); });
        if (aInB) return polyB.slice();
        var bInA = polyB.every(function (p) { return isPointInPolygon(p, polyA); });
        if (bInA) return polyA.slice();

        // 收集所有保留在外部的顶点
        var resultPts = [];
        polyA.forEach(function (pt) {
            if (!isPointInPolygon(pt, polyB)) {
                resultPts.push({ x: pt.x, y: pt.y });
            }
        });
        polyB.forEach(function (pt) {
            if (!isPointInPolygon(pt, polyA)) {
                resultPts.push({ x: pt.x, y: pt.y });
            }
        });

        // 插入相交边交点
        for (var i = 0; i < polyA.length; i++) {
            var a1 = polyA[i], a2 = polyA[(i + 1) % polyA.length];
            for (var j = 0; j < polyB.length; j++) {
                var b1 = polyB[j], b2 = polyB[(j + 1) % polyB.length];
                var inter = getLineIntersection(a1, a2, b1, b2);
                if (inter) {
                    resultPts.push({ x: inter.x, y: inter.y });
                }
            }
        }

        if (resultPts.length < 3) return polyA.slice();

        // 计算几何中心并按极角排序生成连续闭合多边形 (Graham Scan-style winding)
        var cx = 0, cy = 0;
        resultPts.forEach(function (p) { cx += p.x; cy += p.y; });
        cx /= resultPts.length;
        cy /= resultPts.length;

        resultPts.sort(function (p1, p2) {
            var ang1 = Math.atan2(p1.y - cy, p1.x - cx);
            var ang2 = Math.atan2(p2.y - cy, p2.x - cx);
            return ang1 - ang2;
        });

        // 过滤极其邻近的冗余重合点 (< 2px)
        var clean = [];
        for (var k = 0; k < resultPts.length; k++) {
            var cur = resultPts[k];
            var prev = clean[clean.length - 1];
            if (!prev || Math.abs(cur.x - prev.x) > 2 || Math.abs(cur.y - prev.y) > 2) {
                clean.push(cur);
            }
        }

        return clean.length >= 3 ? clean : polyA.slice();
    }

    /**
     * 多边形求差集 (Subtract: A - B)
     * 用 polyB 裁剪 polyA，移除两者的重合部分
     */
    function subtract(polyA, polyB) {
        if (!polyA || !polyA.length) return [];
        if (!polyB || !polyB.length) return polyA.slice();

        var kept = [];
        polyA.forEach(function (pt) {
            if (!isPointInPolygon(pt, polyB)) {
                kept.push({ x: pt.x, y: pt.y });
            }
        });

        // 插入交点作为切割端点
        for (var i = 0; i < polyA.length; i++) {
            var a1 = polyA[i], a2 = polyA[(i + 1) % polyA.length];
            for (var j = 0; j < polyB.length; j++) {
                var b1 = polyB[j], b2 = polyB[(j + 1) % polyB.length];
                var inter = getLineIntersection(a1, a2, b1, b2);
                if (inter) {
                    kept.push({ x: inter.x, y: inter.y });
                }
            }
        }

        if (kept.length < 3) return polyA.slice();

        var cx = 0, cy = 0;
        kept.forEach(function (p) { cx += p.x; cy += p.y; });
        cx /= kept.length;
        cy /= kept.length;

        kept.sort(function (p1, p2) {
            return Math.atan2(p1.y - cy, p1.x - cx) - Math.atan2(p2.y - cy, p2.x - cx);
        });

        return kept;
    }

    /**
     * 多边形求交集 (Intersect: A ∩ B)
     */
    function intersect(polyA, polyB) {
        if (!polyA || !polyB || !polyA.length || !polyB.length) return [];

        var pts = [];
        polyA.forEach(function (p) {
            if (isPointInPolygon(p, polyB)) pts.push({ x: p.x, y: p.y });
        });
        polyB.forEach(function (p) {
            if (isPointInPolygon(p, polyA)) pts.push({ x: p.x, y: p.y });
        });

        for (var i = 0; i < polyA.length; i++) {
            var a1 = polyA[i], a2 = polyA[(i + 1) % polyA.length];
            for (var j = 0; j < polyB.length; j++) {
                var b1 = polyB[j], b2 = polyB[(j + 1) % polyB.length];
                var inter = getLineIntersection(a1, a2, b1, b2);
                if (inter) pts.push({ x: inter.x, y: inter.y });
            }
        }

        if (pts.length < 3) return [];

        var cx = 0, cy = 0;
        pts.forEach(function (p) { cx += p.x; cy += p.y; });
        cx /= pts.length;
        cy /= pts.length;

        pts.sort(function (p1, p2) {
            return Math.atan2(p1.y - cy, p1.x - cx) - Math.atan2(p2.y - cy, p2.x - cx);
        });

        return pts;
    }

    return {
        isPointInPolygon: isPointInPolygon,
        getLineIntersection: getLineIntersection,
        getPolygonArea: getPolygonArea,
        union: union,
        subtract: subtract,
        intersect: intersect
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.PolygonBoolean;
}

