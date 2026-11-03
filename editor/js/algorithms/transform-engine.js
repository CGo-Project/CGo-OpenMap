/**
 * 开放地图编辑器 (OpenMap Editor) - 2D 矢量对象几何变换引擎 (TransformEngine)
 * 对标 VectorCraft (crates/geom) 的无副作用纯数学变换算法
 * 提供 8 方向外框定界、比例缩放、中心锚定与定角旋转纯函数
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.TransformEngine = (function () {
    'use strict';

    /**
     * 计算点集的轴对齐包围盒 (AABB)
     * @param {Array<{x: number, y: number}>} points 
     * @returns {Object} { minX, minY, maxX, maxY, width, height, cx, cy }
     */
    function computeBounds(points) {
        if (!points || !points.length) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, cx: 0, cy: 0 };
        }
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        var w = Math.max(0, maxX - minX);
        var h = Math.max(0, maxY - minY);
        return {
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY,
            width: w,
            height: h,
            cx: minX + w / 2,
            cy: minY + h / 2
        };
    }

    /**
     * 获取 8 个方向手柄在世界坐标系中的位置
     * @param {Object} bounds 
     * @returns {Object} 各手柄坐标
     */
    function getHandlePositions(bounds) {
        return {
            nw: { x: bounds.minX, y: bounds.minY, cursor: 'nwse-resize' },
            n:  { x: bounds.cx,   y: bounds.minY, cursor: 'ns-resize' },
            ne: { x: bounds.maxX, y: bounds.minY, cursor: 'nesw-resize' },
            e:  { x: bounds.maxX, y: bounds.cy,   cursor: 'ew-resize' },
            se: { x: bounds.maxX, y: bounds.maxY, cursor: 'nwse-resize' },
            s:  { x: bounds.cx,   y: bounds.maxY, cursor: 'ns-resize' },
            sw: { x: bounds.minX, y: bounds.maxY, cursor: 'nesw-resize' },
            w:  { x: bounds.minX, y: bounds.cy,   cursor: 'ew-resize' }
        };
    }

    /**
     * 执行手柄拖拽变换计算 (Scale Transformation)
     * @param {Array<{x: number, y: number}>} points 初始点集
     * @param {Object} initBounds 初始包围盒
     * @param {string} handleName 手柄名称 ('nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w')
     * @param {{x: number, y: number}} currentPos 当前鼠标物理世界坐标
     * @param {Object} options { isShift: boolean, isAlt: boolean }
     * @returns {Array<{x: number, y: number}>} 变换后的点集
     */
    function scalePoints(points, initBounds, handleName, currentPos, options) {
        if (!points || !points.length || !initBounds || initBounds.width <= 0 || initBounds.height <= 0) {
            return points;
        }
        var opts = options || {};
        var isShift = !!opts.isShift;
        var isAlt = !!opts.isAlt;

        // 确定固定基准锚点 (Anchor Point)
        var anchor = { x: initBounds.cx, y: initBounds.cy };
        if (!isAlt) {
            switch (handleName) {
                case 'nw': anchor = { x: initBounds.maxX, y: initBounds.maxY }; break;
                case 'n':  anchor = { x: initBounds.cx,   y: initBounds.maxY }; break;
                case 'ne': anchor = { x: initBounds.minX, y: initBounds.maxY }; break;
                case 'e':  anchor = { x: initBounds.minX, y: initBounds.cy };   break;
                case 'se': anchor = { x: initBounds.minX, y: initBounds.minY }; break;
                case 's':  anchor = { x: initBounds.cx,   y: initBounds.minY }; break;
                case 'sw': anchor = { x: initBounds.maxX, y: initBounds.minY }; break;
                case 'w':  anchor = { x: initBounds.maxX, y: initBounds.cy };   break;
            }
        }

        // 计算 X 和 Y 轴上的缩放比率
        var scaleX = 1, scaleY = 1;
        var initDistX = isAlt ? (initBounds.width / 2) : initBounds.width;
        var initDistY = isAlt ? (initBounds.height / 2) : initBounds.height;

        if (initDistX < 1) initDistX = 1;
        if (initDistY < 1) initDistY = 1;

        if (handleName === 'e' || handleName === 'w' || handleName === 'ne' || handleName === 'se' || handleName === 'nw' || handleName === 'sw') {
            var curDistX = Math.abs(currentPos.x - anchor.x);
            // 翻转保护：如果拖拽越过锚点，允许反向翻转镜像
            var signX = (currentPos.x >= anchor.x) === (handleName.indexOf('e') !== -1) ? 1 : -1;
            scaleX = (curDistX / initDistX) * signX;
        }

        if (handleName === 'n' || handleName === 's' || handleName === 'ne' || handleName === 'se' || handleName === 'nw' || handleName === 'sw') {
            var curDistY = Math.abs(currentPos.y - anchor.y);
            var signY = (currentPos.y >= anchor.y) === (handleName.indexOf('s') !== -1) ? 1 : -1;
            scaleY = (curDistY / initDistY) * signY;
        }

        // Shift 锁定等宽高比
        if (isShift) {
            if (handleName === 'e' || handleName === 'w') {
                scaleY = Math.abs(scaleX);
            } else if (handleName === 'n' || handleName === 's') {
                scaleX = Math.abs(scaleY);
            } else {
                var maxRatio = Math.max(Math.abs(scaleX), Math.abs(scaleY));
                scaleX = maxRatio * (scaleX >= 0 ? 1 : -1);
                scaleY = maxRatio * (scaleY >= 0 ? 1 : -1);
            }
        }

        // 避免极致缩放到 0 产生 NaN
        if (Math.abs(scaleX) < 0.05) scaleX = 0.05 * (scaleX >= 0 ? 1 : -1);
        if (Math.abs(scaleY) < 0.05) scaleY = 0.05 * (scaleY >= 0 ? 1 : -1);

        return points.map(function (pt) {
            var newPt = {};
            Object.keys(pt).forEach(function (k) { newPt[k] = pt[k]; });
            newPt.x = Math.round(anchor.x + (pt.x - anchor.x) * scaleX);
            newPt.y = Math.round(anchor.y + (pt.y - anchor.y) * scaleY);
            return newPt;
        });
    }

    /**
     * 绕中心执行自由角度旋转 (Rotation Transformation)
     * @param {Array<{x: number, y: number}>} points 点集
     * @param {{x: number, y: number}} center 旋转中心
     * @param {number} angleRad 旋转弧度 (顺时针为正)
     * @param {Object} options { isShift: boolean }
     * @returns {Array<{x: number, y: number}>} 旋转后的点集
     */
    function rotatePoints(points, center, angleRad, options) {
        if (!points || !points.length || !center) return points;
        var opts = options || {};
        var angle = angleRad;

        // Shift 约束：吸附到 15° (π/12) 的整数倍
        if (opts.isShift) {
            var step = Math.PI / 12; // 15度
            angle = Math.round(angle / step) * step;
        }

        var cosA = Math.cos(angle);
        var sinA = Math.sin(angle);

        return points.map(function (pt) {
            var newPt = {};
            Object.keys(pt).forEach(function (k) { newPt[k] = pt[k]; });
            var dx = pt.x - center.x;
            var dy = pt.y - center.y;
            newPt.x = Math.round(center.x + dx * cosA - dy * sinA);
            newPt.y = Math.round(center.y + dx * sinA + dy * cosA);
            return newPt;
        });
    }

    return {
        computeBounds: computeBounds,
        getHandlePositions: getHandlePositions,
        scalePoints: scalePoints,
        rotatePoints: rotatePoints
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.TransformEngine;
}

