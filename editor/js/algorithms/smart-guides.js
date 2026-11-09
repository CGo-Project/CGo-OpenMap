/**
 * 开放地图编辑器 (OpenMap Editor) - 智能参考线与动态对齐度量算法 (SmartGuides)
 * 对标 VectorCraft / Figma / RMP 矢量辅助线系统：
 *   1. 正交轴向磁吸：水平 (Y) 与垂直 (X) 中心对齐；
 *   2. 轨交专用 45° / 135° 斜轴线磁吸：自动探测邻站 45° / 135° 对角线并正交投影吸附；
 *   3. 等间距分布检测与磁吸 (Equal Spacing)：支持三站居中平分与连续外推等步长检测。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.SmartGuides = (function () {
    'use strict';

    var MAX_DIAGONAL_SPAN = 480; // 斜向 45°/135° 磁吸最大探测跨度 (px)

    function round2(v) {
        return Math.round(v * 100) / 100;
    }

    /**
     * 侦测连续三站的等间距步长 (Equal Spacing)
     * 同时支持：
     *   - 居中内插: pA < pCenter < pB (d1 ≈ d2)
     *   - 顺向外推: pA < pB < pCenter (d(A,B) ≈ d(B,Center))
     *   - 逆向外推: pCenter < pA < pB (d(Center,A) ≈ d(A,B))
     * @param {{x: number, y: number}} pCenter 当前移动站
     * @param {Array<{id?: string, x: number, y: number}>} neighbors 参考站列表
     * @param {number} [tolerance=2] 步长误差阈值
     * @returns {Object|null} { dist, axis: 'x'|'y', pA, pB, pCenter, snappedCoord, segments }
     */
    function detectEqualSpacing(pCenter, neighbors, tolerance) {
        if (!neighbors || neighbors.length < 2) return null;
        var tol = (typeof tolerance === 'number') ? tolerance : 2;
        var alignBand = Math.max(8, tol * 3);
        var maxDistance = 380; // 局部等间距探测上限，避免远距离不相干车站引发 O(N^2) 耗时

        // 空间粗筛：只保留距离当前移动中心 380px 以内的邻近参考站
        var localNeighbors = [];
        for (var k = 0; k < neighbors.length; k++) {
            var nb = neighbors[k];
            if (nb && Math.abs(nb.x - pCenter.x) <= maxDistance && Math.abs(nb.y - pCenter.y) <= maxDistance) {
                localNeighbors.push(nb);
            }
        }
        if (localNeighbors.length < 2) return null;

        for (var i = 0; i < localNeighbors.length; i++) {
            for (var j = i + 1; j < localNeighbors.length; j++) {
                var n1 = localNeighbors[i];
                var n2 = localNeighbors[j];

                // ── 1. 水平 X 轴等距检测 ──
                var left = n1.x <= n2.x ? n1 : n2;
                var right = n1.x <= n2.x ? n2 : n1;
                var sameRow = Math.abs(left.y - right.y) <= alignBand && Math.abs(pCenter.y - left.y) <= alignBand * 2;

                // 1a) 居中内插: left.x < pCenter.x < right.x
                var d1X = pCenter.x - left.x;
                var d2X = right.x - pCenter.x;
                if (d1X > 20 && d2X > 20 && Math.abs(d1X - d2X) <= tol) {
                    var midX = round2((left.x + right.x) / 2);
                    return {
                        dist: Math.round((right.x - left.x) / 2),
                        axis: 'x',
                        mode: 'midpoint',
                        pA: left,
                        pB: right,
                        pCenter: { x: midX, y: pCenter.y },
                        snappedCoord: midX
                    };
                }

                // 1b) 顺向/逆向外推 (仅在同一水平走廊内生效)
                if (sameRow) {
                    var baseSpanX = right.x - left.x;
                    if (baseSpanX > 20 && baseSpanX <= 300) {
                        var dRightExt = pCenter.x - right.x;
                        if (dRightExt > 20 && Math.abs(dRightExt - baseSpanX) <= tol) {
                            var snapRX = round2(right.x + baseSpanX);
                            return {
                                dist: Math.round(baseSpanX),
                                axis: 'x',
                                mode: 'extend-right',
                                pA: left,
                                pB: right,
                                pCenter: { x: snapRX, y: pCenter.y },
                                snappedCoord: snapRX
                            };
                        }
                        var dLeftExt = left.x - pCenter.x;
                        if (dLeftExt > 20 && Math.abs(dLeftExt - baseSpanX) <= tol) {
                            var snapLX = round2(left.x - baseSpanX);
                            return {
                                dist: Math.round(baseSpanX),
                                axis: 'x',
                                mode: 'extend-left',
                                pA: left,
                                pB: right,
                                pCenter: { x: snapLX, y: pCenter.y },
                                snappedCoord: snapLX
                            };
                        }
                    }
                }

                // ── 2. 垂直 Y 轴等距检测 ──
                var top = n1.y <= n2.y ? n1 : n2;
                var bottom = n1.y <= n2.y ? n2 : n1;
                var sameCol = Math.abs(top.x - bottom.x) <= alignBand && Math.abs(pCenter.x - top.x) <= alignBand * 2;

                // 2a) 居中内插: top.y < pCenter.y < bottom.y
                var d1Y = pCenter.y - top.y;
                var d2Y = bottom.y - pCenter.y;
                if (d1Y > 20 && d2Y > 20 && Math.abs(d1Y - d2Y) <= tol) {
                    var midY = round2((top.y + bottom.y) / 2);
                    return {
                        dist: Math.round((bottom.y - top.y) / 2),
                        axis: 'y',
                        mode: 'midpoint',
                        pA: top,
                        pB: bottom,
                        pCenter: { x: pCenter.x, y: midY },
                        snappedCoord: midY
                    };
                }

                // 2b) 顺向/逆向外推 (仅在同一垂直走廊内生效)
                if (sameCol) {
                    var baseSpanY = bottom.y - top.y;
                    if (baseSpanY > 20 && baseSpanY <= 300) {
                        var dBotExt = pCenter.y - bottom.y;
                        if (dBotExt > 20 && Math.abs(dBotExt - baseSpanY) <= tol) {
                            var snapBY = round2(bottom.y + baseSpanY);
                            return {
                                dist: Math.round(baseSpanY),
                                axis: 'y',
                                mode: 'extend-bottom',
                                pA: top,
                                pB: bottom,
                                pCenter: { x: pCenter.x, y: snapBY },
                                snappedCoord: snapBY
                            };
                        }
                        var dTopExt = top.y - pCenter.y;
                        if (dTopExt > 20 && Math.abs(dTopExt - baseSpanY) <= tol) {
                            var snapTY = round2(top.y - baseSpanY);
                            return {
                                dist: Math.round(baseSpanY),
                                axis: 'y',
                                mode: 'extend-top',
                                pA: top,
                                pB: bottom,
                                pCenter: { x: pCenter.x, y: snapTY },
                                snappedCoord: snapTY
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    /**
     * 探测 45° / 135° 斜轴线对齐
     * @param {{x: number, y: number}} pt 当前坐标
     * @param {Array<{id: string, x: number, y: number}>} targetList 目标节点列表
     * @param {number} tol 磁吸阈值
     * @param {{lockX?: boolean, lockY?: boolean}} [locks] 已锁定的正交轴
     * @returns {Object|null} { snapped: {x, y}, guide: Object }
     */
    function computeDiagonalAlignment(pt, targetList, tol, locks) {
        if (!targetList || !targetList.length) return null;
        var lk = locks || {};
        if (lk.lockX && lk.lockY) return null;

        var bestPerpDist = tol + 1e-6;
        var bestMatch = null;

        for (var i = 0; i < targetList.length; i++) {
            var item = targetList[i];
            var dx = pt.x - item.x;
            var dy = pt.y - item.y;
            var dist = Math.hypot(dx, dy);
            if (dist < 12 || dist > MAX_DIAGONAL_SPAN) continue;

            // 1) 45° 对角线: (x - item.x) - (y - item.y) = 0 (右下 / 左上)
            var perp45 = Math.abs(dx - dy) / Math.SQRT2;
            if (perp45 <= tol && perp45 < bestPerpDist) {
                var sx45 = pt.x, sy45 = pt.y;
                if (lk.lockX) {
                    sy45 = round2(item.y + (pt.x - item.x));
                } else if (lk.lockY) {
                    sx45 = round2(item.x + (pt.y - item.y));
                } else {
                    var avg45 = (dx + dy) / 2;
                    sx45 = round2(item.x + avg45);
                    sy45 = round2(item.y + avg45);
                }
                bestPerpDist = perp45;
                bestMatch = {
                    snapped: { x: sx45, y: sy45 },
                    guide: {
                        type: 'diagonal',
                        angle: 45,
                        x1: item.x,
                        y1: item.y,
                        x2: sx45,
                        y2: sy45,
                        targetId: item.id,
                        label: '45°'
                    }
                };
            }

            // 2) 135° 对角线: (x - item.x) + (y - item.y) = 0 (右上 / 左下)
            var perp135 = Math.abs(dx + dy) / Math.SQRT2;
            if (perp135 <= tol && perp135 < bestPerpDist) {
                var sx135 = pt.x, sy135 = pt.y;
                if (lk.lockX) {
                    sy135 = round2(item.y - (pt.x - item.x));
                } else if (lk.lockY) {
                    sx135 = round2(item.x - (pt.y - item.y));
                } else {
                    var avg135 = (dx - dy) / 2;
                    sx135 = round2(item.x + avg135);
                    sy135 = round2(item.y - avg135);
                }
                bestPerpDist = perp135;
                bestMatch = {
                    snapped: { x: sx135, y: sy135 },
                    guide: {
                        type: 'diagonal',
                        angle: 135,
                        x1: item.x,
                        y1: item.y,
                        x2: sx135,
                        y2: sy135,
                        targetId: item.id,
                        label: '135°'
                    }
                };
            }
        }

        return bestMatch;
    }

    /**
     * 计算移动图元与静态参考图元之间的智能磁吸与对齐导轨
     * @param {{x: number, y: number}} movingPoint 正在移动的中心点或锚点
     * @param {Array<{id: string, x: number, y: number, minX?: number, maxX?: number, minY?: number, maxY?: number}>} targetList 目标图元列表
     * @param {number} [tolerance=5] 磁吸阈值 (物理像素)
     * @param {Object} [options] { enableDiagonal: true, enableSpacing: true }
     * @returns {Object} { snapped: {x, y}, guides: Array, badgeText: string, spacing: Object|null }
     */
    function computeAlignment(movingPoint, targetList, tolerance, options) {
        var tol = (typeof tolerance === 'number') ? tolerance : 5;
        var opt = options || {};
        var res = {
            snapped: { x: movingPoint.x, y: movingPoint.y },
            guides: [],
            badgeText: '',
            spacing: null
        };

        if (!targetList || !targetList.length) return res;

        var bestDiffX = tol + 1;
        var bestTargetX = null;
        var bestDiffY = tol + 1;
        var bestTargetY = null;

        for (var i = 0; i < targetList.length; i++) {
            var item = targetList[i];
            // X 轴对齐比对 (水平方向位置相同，呈现垂直垂线)
            var diffX = Math.abs(movingPoint.x - item.x);
            if (diffX <= tol && diffX < bestDiffX) {
                bestDiffX = diffX;
                bestTargetX = item;
            }

            // Y 轴对齐比对 (垂直方向位置相同，呈现水平标线)
            var diffY = Math.abs(movingPoint.y - item.y);
            if (diffY <= tol && diffY < bestDiffY) {
                bestDiffY = diffY;
                bestTargetY = item;
            }
        }

        if (bestTargetX) {
            res.snapped.x = bestTargetX.x;
            var minY = Math.min(movingPoint.y, bestTargetX.y) - 30;
            var maxY = Math.max(movingPoint.y, bestTargetX.y) + 30;
            res.guides.push({
                type: 'vertical',
                x: bestTargetX.x,
                y1: minY,
                y2: maxY,
                targetId: bestTargetX.id
            });
        }

        if (bestTargetY) {
            res.snapped.y = bestTargetY.y;
            var minX = Math.min(movingPoint.x, bestTargetY.x) - 30;
            var maxX = Math.max(movingPoint.x, bestTargetY.x) + 30;
            res.guides.push({
                type: 'horizontal',
                y: bestTargetY.y,
                x1: minX,
                x2: maxX,
                targetId: bestTargetY.id
            });
        }

        // 轨交 45° / 135° 斜轴线对齐探测 (默认开启)
        if (opt.enableDiagonal !== false && (!bestTargetX || !bestTargetY)) {
            var diagMatch = computeDiagonalAlignment(res.snapped, targetList, tol, {
                lockX: !!bestTargetX,
                lockY: !!bestTargetY
            });
            if (diagMatch) {
                res.snapped.x = diagMatch.snapped.x;
                res.snapped.y = diagMatch.snapped.y;
                res.guides.push(diagMatch.guide);
            }
        }

        // 等间距分布探测 (默认开启)
        if (opt.enableSpacing !== false && targetList.length >= 2) {
            var sp = detectEqualSpacing(res.snapped, targetList, Math.min(tol, 3));
            if (sp) {
                res.spacing = sp;
                if (sp.axis === 'x' && !bestTargetX && sp.snappedCoord !== undefined) {
                    res.snapped.x = sp.snappedCoord;
                } else if (sp.axis === 'y' && !bestTargetY && sp.snappedCoord !== undefined) {
                    res.snapped.y = sp.snappedCoord;
                }
                res.guides.push({
                    type: 'spacing',
                    axis: sp.axis,
                    dist: sp.dist,
                    pA: sp.pA,
                    pB: sp.pB,
                    pCenter: { x: res.snapped.x, y: res.snapped.y },
                    label: sp.dist + 'px'
                });
            }
        }

        // 动态徽章提示文本
        if (bestTargetX && bestTargetY) {
            res.badgeText = '双向十字对齐';
        } else if (bestTargetX) {
            res.badgeText = '垂直轴向对齐';
        } else if (bestTargetY) {
            res.badgeText = '水平轴向对齐';
        } else if (res.guides.some(function (g) { return g.type === 'diagonal'; })) {
            var dg = res.guides.find(function (g) { return g.type === 'diagonal'; });
            res.badgeText = dg.angle + '° 斜轴对齐';
        } else if (res.spacing) {
            res.badgeText = '等距分布 (' + res.spacing.dist + 'px)';
        }

        return res;
    }

    return {
        computeAlignment: computeAlignment,
        computeDiagonalAlignment: computeDiagonalAlignment,
        detectEqualSpacing: detectEqualSpacing
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.SmartGuides;
}
