/**
 * 开放地图编辑器 (OpenMap Editor) - 多线共线平行走线路由器 (ParallelCorridorRouter)
 * 解决多条线路共通道重合走线时的严重遮盖压线问题：
 * 1. 自动拓扑聚类：识别在相同站点/区间共线的线路走向段；
 * 2. 几何法向量与斜接反算 (Miter Offset)：计算多点折线各顶点单位法向量与外扩倒角；
 * 3. 动态对称平移：按预设轨距 (标准 5.4px) 对称外展渲染，实现无损并排平行走线；
 * 4. 纯函数设计：既支持实时渲染时动态无损并行，也支持一键外科手术式将折点实体化回写工程。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.ParallelCorridorRouter = (function () {
    'use strict';

    var DEFAULT_TRACK_SPACING = 5.4; // 标准轨距间距 (px)

    /**
     * 计算两点间欧式距离
     */
    function dist(p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算线段 p1 -> p2 的单位法向量 (垂直向左)
     */
    function segmentNormal(p1, p2) {
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-6) return { x: 0, y: 0 };
        return { x: -dy / len, y: dx / len };
    }

    /**
     * 计算三点转角处 pCurr 的平分线法向量及斜接扩展比 (Miter Vector & Scale)
     */
    function vertexMiterNormal(pPrev, pCurr, pNext) {
        var n1 = segmentNormal(pPrev, pCurr);
        var n2 = segmentNormal(pCurr, pNext);

        var sumX = n1.x + n2.x;
        var sumY = n1.y + n2.y;
        var len = Math.sqrt(sumX * sumX + sumY * sumY);

        if (len < 1e-4) {
            // 接近 180 度调头或重合退化情况
            return { x: n1.x, y: n1.y, scale: 1.0 };
        }

        var bisectorX = sumX / len;
        var bisectorY = sumY / len;

        // 计算点积 n1 · bisector = cos(theta / 2)
        var dot = n1.x * bisectorX + n1.y * bisectorY;
        var scale = dot > 1e-3 ? (1.0 / dot) : 1.0;
        // 限制尖角过长突刺 (miter limit = 2.0)
        if (scale > 2.0) scale = 2.0;

        return { x: bisectorX, y: bisectorY, scale: scale };
    }

    /**
     * 对一条折线点阵进行法向等距平移
     * @param {Array<{x: number, y: number, nid?: string}>} points 原折线点集
     * @param {number} offsetDist 平移距离 (正数向左，负数向右)
     * @returns {Array<{x: number, y: number, nid?: string}>} 平移后的折线点集
     */
    function offsetPolyline(points, offsetDist) {
        if (!points || points.length < 2) return (points || []).slice();
        if (Math.abs(offsetDist) < 1e-4) {
            return points.map(function (p) {
                return { x: p.x, y: p.y, nid: p.nid };
            });
        }

        var n = points.length;
        var result = [];

        // 起点：直接沿第一段线段法向平移
        var startN = segmentNormal(points[0], points[1]);
        result.push({
            x: Math.round((points[0].x + startN.x * offsetDist) * 100) / 100,
            y: Math.round((points[0].y + startN.y * offsetDist) * 100) / 100,
            nid: points[0].nid
        });

        // 中间各折点：计算转角角平分线法向量
        for (var i = 1; i < n - 1; i++) {
            var miter = vertexMiterNormal(points[i - 1], points[i], points[i + 1]);
            result.push({
                x: Math.round((points[i].x + miter.x * miter.scale * offsetDist) * 100) / 100,
                y: Math.round((points[i].y + miter.y * miter.scale * offsetDist) * 100) / 100,
                nid: points[i].nid
            });
        }

        // 终点：直接沿最后一段线段法向平移
        var endN = segmentNormal(points[n - 2], points[n - 1]);
        result.push({
            x: Math.round((points[n - 1].x + endN.x * offsetDist) * 100) / 100,
            y: Math.round((points[n - 1].y + endN.y * offsetDist) * 100) / 100,
            nid: points[n - 1].nid
        });

        return result;
    }

    /**
     * 判断两组折线是否在几何上近似重合或逆向重合
     */
    function arePathsCoincident(ptsA, ptsB, tolerance) {
        if (!ptsA || !ptsB || ptsA.length !== ptsB.length) return false;
        var tol = tolerance !== undefined ? tolerance : 3.0;
        var n = ptsA.length;

        // 正向比对
        var forwardMatch = true;
        for (var i = 0; i < n; i++) {
            if (dist(ptsA[i], ptsB[i]) > tol) {
                forwardMatch = false;
                break;
            }
        }
        if (forwardMatch) return { isCoincident: true, reversed: false };

        // 逆向比对
        var reverseMatch = true;
        for (var j = 0; j < n; j++) {
            if (dist(ptsA[j], ptsB[n - 1 - j]) > tol) {
                reverseMatch = false;
                break;
            }
        }
        if (reverseMatch) return { isCoincident: true, reversed: true };

        return { isCoincident: false, reversed: false };
    }

    /**
     * 自动聚类工程中所有线段的共享通道
     * @param {Array<Object>} segments 线段数组
     * @returns {Array<Array<{segment: Object, reversed: boolean}>>} 通道聚类分组
     */
    function detectCorridorGroups(segments) {
        if (!segments || segments.length === 0) return [];
        var groups = [];
        var visited = new Set();

        for (var i = 0; i < segments.length; i++) {
            var segA = segments[i];
            if (visited.has(segA.id) || !segA.points || segA.points.length < 2) continue;

            var cluster = [{ segment: segA, reversed: false }];
            visited.add(segA.id);

            for (var j = i + 1; j < segments.length; j++) {
                var segB = segments[j];
                if (visited.has(segB.id) || !segB.points || segB.points.length < 2) continue;

                var match = arePathsCoincident(segA.points, segB.points);
                if (match.isCoincident) {
                    cluster.push({ segment: segB, reversed: match.reversed });
                    visited.add(segB.id);
                }
            }

            if (cluster.length > 1) {
                groups.push(cluster);
            }
        }

        return groups;
    }

    /**
     * 计算全图所有线段的平行偏移点阵映射
     * @param {Array<Object>} segments 线段数组
     * @param {Object} [options] 配置参数 { spacing: number }
     * @returns {Object<string, Array<{x: number, y: number, nid?: string}>>} segmentId -> 偏移后折点
     */
    function computeParallelOffsets(segments, options) {
        var opt = options || {};
        var spacing = typeof opt.spacing === 'number' ? opt.spacing : DEFAULT_TRACK_SPACING;
        var offsetMap = {};
        if (!segments || segments.length === 0) return offsetMap;

        var groups = detectCorridorGroups(segments);

        groups.forEach(function (cluster) {
            var totalLines = cluster.length;
            cluster.forEach(function (item, idx) {
                // 计算当前线路在共线通道中的对称偏移距离
                // 例如 2 条线：-0.5 * spacing, +0.5 * spacing
                // 3 条线：-1 * spacing, 0, +1 * spacing
                var rank = idx - (totalLines - 1) / 2.0;
                var offsetDist = rank * spacing;

                var basePoints = item.segment.points;
                var shifted = offsetPolyline(basePoints, offsetDist);
                offsetMap[item.segment.id] = shifted;
            });
        });

        return offsetMap;
    }

    /**
     * 将平行走线物理应用回工程数据对象 (外科手术式持久化)
     * @param {Object} project 工程模型对象
     * @param {Object} [options] 配置参数
     */
    function applyParallelOffsetsToProject(project, options) {
        if (!project || !project.segments) return 0;
        var offsetMap = computeParallelOffsets(project.segments, options);
        var count = 0;
        project.segments.forEach(function (seg) {
            if (offsetMap[seg.id]) {
                seg.points = offsetMap[seg.id];
                count++;
            }
        });
        return count;
    }

    return {
        DEFAULT_TRACK_SPACING: DEFAULT_TRACK_SPACING,
        dist: dist,
        segmentNormal: segmentNormal,
        vertexMiterNormal: vertexMiterNormal,
        offsetPolyline: offsetPolyline,
        arePathsCoincident: arePathsCoincident,
        detectCorridorGroups: detectCorridorGroups,
        computeParallelOffsets: computeParallelOffsets,
        applyParallelOffsetsToProject: applyParallelOffsetsToProject
    };
})();

// 全局别名兼容
window.ParallelCorridorRouter = window.OpenMapEditor.ParallelCorridorRouter;

