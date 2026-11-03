/**
 * 开放地图编辑器 (OpenMap Editor) - 智能参考线与动态对齐度量算法 (SmartGuides)
 * 对标 VectorCraft (crates/tools/smart_guides) 算法
 * 提供中心对齐、边界对齐、动态距离气泡与等间距检测纯数学计算
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.SmartGuides = (function () {
    'use strict';

    /**
     * 计算移动图元与静态参考图元之间的智能磁吸与对齐导轨
     * @param {{x: number, y: number}} movingPoint 正在移动的中心点或锚点
     * @param {Array<{id: string, x: number, y: number, minX?: number, maxX?: number, minY?: number, maxY?: number}>} targetList 目标图元列表
     * @param {number} [tolerance=5] 磁吸阈值 (物理像素)
     * @returns {Object} { snapped: {x, y}, guides: Array, badgeText: string }
     */
    function computeAlignment(movingPoint, targetList, tolerance) {
        var tol = (typeof tolerance === 'number') ? tolerance : 5;
        var res = {
            snapped: { x: movingPoint.x, y: movingPoint.y },
            guides: [],
            badgeText: ''
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

        // 动态徽章提示文本
        if (bestTargetX && bestTargetY) {
            res.badgeText = '双向十字对齐';
        } else if (bestTargetX) {
            res.badgeText = '垂直轴向对齐';
        } else if (bestTargetY) {
            res.badgeText = '水平轴向对齐';
        }

        return res;
    }

    /**
     * 侦测连续三站的等间距步长 (Equal Spacing)
     * @param {{x: number, y: number}} pCenter 当前移动站
     * @param {Array<{x: number, y: number}>} neighbors 相邻站
     * @param {number} [tolerance=2] 步长误差阈值
     * @returns {Object|null} { dist: number, axis: 'x'|'y', line1: Object, line2: Object }
     */
    function detectEqualSpacing(pCenter, neighbors, tolerance) {
        if (!neighbors || neighbors.length < 2) return null;
        var tol = tolerance || 2;

        for (var i = 0; i < neighbors.length; i++) {
            for (var j = i + 1; j < neighbors.length; j++) {
                var pA = neighbors[i];
                var pB = neighbors[j];

                // 水平 X 轴等距检测: pA.x < pCenter.x < pB.x
                var d1X = pCenter.x - pA.x;
                var d2X = pB.x - pCenter.x;
                if (d1X > 20 && d2X > 20 && Math.abs(d1X - d2X) <= tol) {
                    return {
                        dist: Math.round(d1X),
                        axis: 'x',
                        pA: pA,
                        pB: pB,
                        pCenter: pCenter
                    };
                }

                // 垂直 Y 轴等距检测: pA.y < pCenter.y < pB.y
                var d1Y = pCenter.y - pA.y;
                var d2Y = pB.y - pCenter.y;
                if (d1Y > 20 && d2Y > 20 && Math.abs(d1Y - d2Y) <= tol) {
                    return {
                        dist: Math.round(d1Y),
                        axis: 'y',
                        pA: pA,
                        pB: pB,
                        pCenter: pCenter
                    };
                }
            }
        }
        return null;
    }

    return {
        computeAlignment: computeAlignment,
        detectEqualSpacing: detectEqualSpacing
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.SmartGuides;
}

