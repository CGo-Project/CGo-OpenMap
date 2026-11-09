/**
 * 开放地图编辑器 (OpenMap Editor) - 多线共线平行走线路由器 (ParallelCorridorRouter)
 * 解决多条线路共通道重合走线时的严重遮盖压线问题：
 * 1. 自动拓扑与几何聚类：识别在相同站点/区间共线的线路走向段（支持不同折点数共线 Hausdorff 判定与逆向共轨）；
 * 2. 几何法向量与斜接反算 (Miter Offset)：计算多点折线各顶点单位法向量与外扩倒角；
 * 3. 动态对称平移：按预设轨距 (标准 5.4px) 对称外展渲染，修正逆向线段法向符号确保异向同通道对称分列；
 * 4. 换乘站胶囊自动对齐：根据共轨切线角度自动推断并升级对应方向的跑道圆长胶囊换乘站 (tsf_pill_*)；
 * 5. 纯函数设计：既支持实时渲染时动态无损并行，也支持一键外科手术式将折点实体化回写工程。
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
     * 点 p 到线段 a-b 的最短距离
     */
    function pointToSegmentDist(p, a, b) {
        var vx = b.x - a.x;
        var vy = b.y - a.y;
        var len2 = vx * vx + vy * vy;
        if (len2 < 1e-6) return dist(p, a);
        var t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        var projX = a.x + t * vx;
        var projY = a.y + t * vy;
        return Math.hypot(p.x - projX, p.y - projY);
    }

    /**
     * 点 p 到折线 poly 的最短距离
     */
    function pointToPolylineDist(p, poly) {
        if (!poly || !poly.length) return Infinity;
        if (poly.length === 1) return dist(p, poly[0]);
        var minD = Infinity;
        for (var i = 0; i < poly.length - 1; i++) {
            var d = pointToSegmentDist(p, poly[i], poly[i + 1]);
            if (d < minD) minD = d;
        }
        return minD;
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
     * @param {Array<{x: number, y: number, nid?: string, r?: number}>} points 原折线点集
     * @param {number} offsetDist 平移距离 (正数向左，负数向右)
     * @returns {Array<{x: number, y: number, nid?: string, r?: number}>} 平移后的折线点集
     */
    function offsetPolyline(points, offsetDist) {
        if (!points || points.length < 2) return (points || []).slice();
        if (Math.abs(offsetDist) < 1e-4) {
            return points.map(function (p) {
                var copy = { x: p.x, y: p.y, nid: p.nid };
                if (p.r !== undefined) copy.r = p.r;
                return copy;
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
            var midPt = {
                x: Math.round((points[i].x + miter.x * miter.scale * offsetDist) * 100) / 100,
                y: Math.round((points[i].y + miter.y * miter.scale * offsetDist) * 100) / 100,
                nid: points[i].nid
            };
            if (points[i].r !== undefined) midPt.r = points[i].r;
            result.push(midPt);
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
     * 判断两组折线是否在几何上近似重合或逆向重合（支持相同折点数快速比对 + 不同折点数共线 Hausdorff 判定）
     */
    function arePathsCoincident(ptsA, ptsB, tolerance) {
        if (!ptsA || !ptsB || ptsA.length < 2 || ptsB.length < 2) {
            return { isCoincident: false, reversed: false };
        }
        var tol = tolerance !== undefined ? tolerance : 3.0;
        var nA = ptsA.length;
        var nB = ptsB.length;

        // 1. 折点数相同时优先执行逐顶点比对
        if (nA === nB) {
            var forwardMatch = true;
            for (var i = 0; i < nA; i++) {
                if (dist(ptsA[i], ptsB[i]) > tol) {
                    forwardMatch = false;
                    break;
                }
            }
            if (forwardMatch) return { isCoincident: true, reversed: false };

            var reverseMatch = true;
            for (var j = 0; j < nA; j++) {
                if (dist(ptsA[j], ptsB[nA - 1 - j]) > tol) {
                    reverseMatch = false;
                    break;
                }
            }
            if (reverseMatch) return { isCoincident: true, reversed: true };
        }

        // 2. 折点数不同但首尾端点重合，且双向折线 Hausdorff 距离 <= tol（如一段多了中间共线点）
        var startA = ptsA[0], endA = ptsA[nA - 1];
        var startB = ptsB[0], endB = ptsB[nB - 1];
        var sameEndsForward = dist(startA, startB) <= tol && dist(endA, endB) <= tol;
        var sameEndsReverse = dist(startA, endB) <= tol && dist(endA, startB) <= tol;

        if (!sameEndsForward && !sameEndsReverse) {
            return { isCoincident: false, reversed: false };
        }

        for (var aIdx = 0; aIdx < nA; aIdx++) {
            if (pointToPolylineDist(ptsA[aIdx], ptsB) > tol) {
                return { isCoincident: false, reversed: false };
            }
        }
        for (var bIdx = 0; bIdx < nB; bIdx++) {
            if (pointToPolylineDist(ptsB[bIdx], ptsA) > tol) {
                return { isCoincident: false, reversed: false };
            }
        }

        return { isCoincident: true, reversed: !sameEndsForward && sameEndsReverse };
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
                // 若该线段与通道基准线段方向相反，其自身法向量相反，需取反 offsetDist 以保证异向分列在中心线两侧
                var effectiveOffset = item.reversed ? -offsetDist : offsetDist;

                var basePoints = item.segment.points;
                var shifted = offsetPolyline(basePoints, effectiveOffset);
                offsetMap[item.segment.id] = shifted;
            });
        });

        return offsetMap;
    }

    /**
     * 根据共轨折线在端点处的切线方向，推断最佳匹配的跑道圆长胶囊换乘图元类型
     * （胶囊长轴须垂直横跨平行轨道，才能同时包住并排的多条线路）
     * @param {Array<{x: number, y: number}>} points 折线点集
     * @param {'start'|'end'|number} [atEnd='start'] 端点位置
     * @returns {string} 'tsf_pill_v' | 'tsf_pill_h' | 'tsf_pill_d45' | 'tsf_pill_d135'
     */
    function suggestTransferPillType(points, atEnd) {
        if (!points || points.length < 2) return 'tsf_pill_v';
        var p1, p2;
        if (atEnd === 'end' || atEnd === points.length - 1) {
            p1 = points[points.length - 2];
            p2 = points[points.length - 1];
        } else if (typeof atEnd === 'number' && atEnd > 0 && atEnd < points.length) {
            p1 = points[atEnd - 1];
            p2 = points[atEnd];
        } else {
            p1 = points[0];
            p2 = points[1];
        }
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        var adx = Math.abs(dx);
        var ady = Math.abs(dy);

        // 水平走线 -> 垂直胶囊横跨轨道
        if (adx >= ady * 1.8) return 'tsf_pill_v';
        // 垂直走线 -> 水平胶囊横跨轨道
        if (ady >= adx * 1.8) return 'tsf_pill_h';
        // 45° 斜向走线 (左上<->右下, dx*dy > 0) -> 135° 斜胶囊垂直横跨
        if (dx * dy > 0) return 'tsf_pill_d135';
        // 135° 斜向走线 (右上<->左下, dx*dy < 0) -> 45° 斜胶囊垂直横跨
        return 'tsf_pill_d45';
    }

    /**
     * 自动将共轨走廊经过的共用车站升级为方向匹配的跑道圆胶囊换乘图元
     * @param {Object} project 工程模型对象
     * @returns {number} 升级的换乘站数量
     */
    function autoUpgradeCorridorTransferGlyphs(project) {
        if (!project || !project.segments || !project.nodes) return 0;
        var groups = detectCorridorGroups(project.segments);
        var upgradedCount = 0;
        var upgradedSet = {};

        groups.forEach(function (cluster) {
            if (!cluster || cluster.length < 2) return;
            var basePts = cluster[0].segment.points;
            if (!basePts || basePts.length < 2) return;

            basePts.forEach(function (pt, idx) {
                var nid = pt && pt.nid;
                if (!nid || upgradedSet[nid] || !project.nodes[nid]) return;
                var node = project.nodes[nid];
                if (node.type === 'no') return; // 未开通站保持原状
                var pillType = suggestTransferPillType(basePts, idx === basePts.length - 1 ? 'end' : idx);
                if (node.type !== pillType && node.type !== 'tsf_dumbbell') {
                    node.type = pillType;
                    upgradedSet[nid] = true;
                    upgradedCount++;
                }
            });
        });

        return upgradedCount;
    }

    /**
     * 将平行走线物理应用回工程数据对象 (外科手术式持久化)
     * @param {Object} project 工程模型对象
     * @param {Object} [options] 配置参数 { spacing: number, upgradeTransferPills: boolean }
     */
    function applyParallelOffsetsToProject(project, options) {
        if (!project || !project.segments) return 0;
        var opt = options || {};
        var offsetMap = computeParallelOffsets(project.segments, opt);
        var count = 0;
        project.segments.forEach(function (seg) {
            if (offsetMap[seg.id]) {
                seg.points = offsetMap[seg.id];
                count++;
            }
        });
        if (opt.upgradeTransferPills) {
            autoUpgradeCorridorTransferGlyphs(project);
        }
        return count;
    }

    return {
        DEFAULT_TRACK_SPACING: DEFAULT_TRACK_SPACING,
        dist: dist,
        pointToSegmentDist: pointToSegmentDist,
        pointToPolylineDist: pointToPolylineDist,
        segmentNormal: segmentNormal,
        vertexMiterNormal: vertexMiterNormal,
        offsetPolyline: offsetPolyline,
        arePathsCoincident: arePathsCoincident,
        detectCorridorGroups: detectCorridorGroups,
        computeParallelOffsets: computeParallelOffsets,
        suggestTransferPillType: suggestTransferPillType,
        autoUpgradeCorridorTransferGlyphs: autoUpgradeCorridorTransferGlyphs,
        applyParallelOffsetsToProject: applyParallelOffsetsToProject
    };
})();

// 全局别名兼容
window.ParallelCorridorRouter = window.OpenMapEditor.ParallelCorridorRouter;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.ParallelCorridorRouter;
}
