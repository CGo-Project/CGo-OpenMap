/**
 * 开放地图编辑器 (OpenMap Editor) - CAD 级网格与坐标刻度图层 (Grid & Coordinate Axes Layer)
 * 1. 物理画布外框与边界高亮 (Canvas Boundary & Backdrop)
 * 2. 细分网格与主网格两级自适应 LOD (Minor & Major Adaptive Grid Mesh)
 * 3. 采用单一 SVG <path> + vector-effect="non-scaling-stroke" 硬件加速极速渲染
 * 4. X / Y 正交坐标轴（X 沿画布上边缘向右为正、Y 沿画布左边缘向下为正）、原点 O (0,0) 与动态刻度读数
 * 5. 零事件阻断 (pointer-events: none)，不影响图元交互拾取与视口漫游
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.GridLayer = (function () {
    'use strict';

    var dom = {
        layer: null
    };

    var state = {
        visible: false,
        gridSize: 10,
        canvasSize: { width: 2000, height: 1500 },
        lastScale: 1.0,
        lastRenderedStep: 0
    };

    var NS = 'http://www.w3.org/2000/svg';

    function round2(v) {
        return Math.round(v * 100) / 100;
    }

    /**
     * 初始化网格图层
     * @param {SVGElement} layerEl <g id="gridLayer">
     */
    function init(layerEl) {
        dom.layer = layerEl;
        if (!dom.layer) return;

        dom.layer.style.pointerEvents = 'none';
        dom.layer.style.display = state.visible ? '' : 'none';

        // 视口缩放与平移变换联动自适应
        if (window.OpenMapEditor.ViewportLayer && typeof window.OpenMapEditor.ViewportLayer.onTransform === 'function') {
            window.OpenMapEditor.ViewportLayer.onTransform(function (info) {
                if (!state.visible) return;
                onScaleChange(info.scale);
            });
        }
    }

    /**
     * 缩放比例微调时的自适应更新（带阈值节流，防抖避免无谓重构 DOM）
     */
    function onScaleChange(scale) {
        if (!dom.layer || !state.visible) return;
        var s = scale || 1.0;
        var ratio = s / (state.lastScale || 1.0);
        // 缩放跨越约 20% 时触发 LOD 或刻度重绘
        if (ratio < 0.8 || ratio > 1.25) {
            render({ scale: s });
        }
    }

    /**
     * 切换网格显示状态
     * @param {boolean} visible
     */
    function setVisible(visible) {
        state.visible = !!visible;
        if (dom.layer) {
            dom.layer.style.display = state.visible ? '' : 'none';
        }
        if (state.visible) {
            render();
        }
    }

    /**
     * 查询网格是否处于可见状态
     * @returns {boolean}
     */
    function isVisible() {
        return state.visible;
    }

    /**
     * 设置基准网格步长
     * @param {number} size
     */
    function setGridSize(size) {
        var g = Number(size);
        if (g > 0) {
            state.gridSize = g;
            if (state.visible) render();
        }
    }

    /**
     * 获取基准网格步长
     * @returns {number}
     */
    function getGridSize() {
        return state.gridSize;
    }

    /**
     * 实际画出来的网格步长（低缩放时会按 LOD 倍增以避免摩尔纹）。
     * 吸附必须用它，否则缩小时吸附到 10px 而画面上的线是每 20px 一条，
     * 点就会落在两条可见网格线之间，看起来"没吸附上"。
     * @returns {number}
     */
    function getEffectiveGridSize() {
        return state.lastRenderedStep > 0 ? state.lastRenderedStep : state.gridSize;
    }

    /**
     * 渲染完整网格与坐标刻度
     * @param {Object} [options]
     * @param {number} [options.width]
     * @param {number} [options.height]
     * @param {number} [options.scale]
     * @param {number} [options.gridSize]
     */
    function render(options) {
        if (!dom.layer) return;

        var vp = window.OpenMapEditor.ViewportLayer;
        var opt = options || {};

        var w = Number(opt.width) > 0 ? Number(opt.width)
            : (vp && vp.getCanvasSize ? vp.getCanvasSize().width : state.canvasSize.width);
        var h = Number(opt.height) > 0 ? Number(opt.height)
            : (vp && vp.getCanvasSize ? vp.getCanvasSize().height : state.canvasSize.height);
        var k = Number(opt.scale) > 0 ? Number(opt.scale)
            : (vp && vp.getScale ? vp.getScale() : state.lastScale || 1.0);
        var baseGrid = Number(opt.gridSize) > 0 ? Number(opt.gridSize)
            : (vp && vp.getGridSize ? vp.getGridSize() : state.gridSize || 10);

        state.canvasSize.width = w;
        state.canvasSize.height = h;
        state.lastScale = k;
        state.gridSize = baseGrid;

        if (!state.visible) {
            dom.layer.style.display = 'none';
            return;
        }

        dom.layer.style.display = '';

        // 世界坐标 1px 对应的屏幕像素
        var u = 1 / (k || 1);

        // 自适应 LOD 步长计算：若网格像素在屏幕上小于 8px 则倍增，避免视觉摩尔纹与密集过载
        var g = baseGrid;
        while (g * k < 8) {
            g *= 2;
        }
        var majorStep = g * 5;
        while (majorStep * k < 35) {
            majorStep *= 2;
        }

        state.lastRenderedStep = g;

        // 构建次要细分网格与主要网格的单一 SVG <path> d 字符串
        var minorPathParts = [];
        var majorPathParts = [];

        var x, y;
        for (x = g; x < w; x += g) {
            var isMajorX = Math.abs(x % majorStep) < 1e-4;
            var segX = 'M' + round2(x) + ' 0V' + round2(h);
            if (isMajorX) {
                majorPathParts.push(segX);
            } else {
                minorPathParts.push(segX);
            }
        }

        for (y = g; y < h; y += g) {
            var isMajorY = Math.abs(y % majorStep) < 1e-4;
            var segY = 'M0 ' + round2(y) + 'H' + round2(w);
            if (isMajorY) {
                majorPathParts.push(segY);
            } else {
                minorPathParts.push(segY);
            }
        }

        var frag = document.createDocumentFragment();

        // 1. 画布物理边界外框
        var boundaryRect = document.createElementNS(NS, 'rect');
        boundaryRect.setAttribute('class', 'grid-canvas-boundary');
        boundaryRect.setAttribute('x', '0');
        boundaryRect.setAttribute('y', '0');
        boundaryRect.setAttribute('width', String(round2(w)));
        boundaryRect.setAttribute('height', String(round2(h)));
        boundaryRect.setAttribute('fill', 'none');
        boundaryRect.setAttribute('stroke', 'var(--office-border, #cbd5e1)');
        boundaryRect.setAttribute('stroke-width', '1.5');
        boundaryRect.setAttribute('vector-effect', 'non-scaling-stroke');
        frag.appendChild(boundaryRect);

        // 2. 细分网格 (Minor Mesh)
        if (minorPathParts.length > 0) {
            var minorPathEl = document.createElementNS(NS, 'path');
            minorPathEl.setAttribute('class', 'grid-minor-path');
            minorPathEl.setAttribute('d', minorPathParts.join(' '));
            minorPathEl.setAttribute('fill', 'none');
            minorPathEl.setAttribute('stroke', 'var(--office-border, #94a3b8)');
            minorPathEl.setAttribute('stroke-width', '1');
            minorPathEl.setAttribute('vector-effect', 'non-scaling-stroke');
            frag.appendChild(minorPathEl);
        }

        // 3. 主网格 (Major Mesh)
        if (majorPathParts.length > 0) {
            var majorPathEl = document.createElementNS(NS, 'path');
            majorPathEl.setAttribute('class', 'grid-major-path');
            majorPathEl.setAttribute('d', majorPathParts.join(' '));
            majorPathEl.setAttribute('fill', 'none');
            majorPathEl.setAttribute('stroke', 'var(--office-border, #64748b)');
            majorPathEl.setAttribute('stroke-width', '1.25');
            majorPathEl.setAttribute('vector-effect', 'non-scaling-stroke');
            frag.appendChild(majorPathEl);
        }

        // 4. 坐标轴与刻度指示
        var axesGroup = document.createElementNS(NS, 'g');
        axesGroup.setAttribute('class', 'grid-axes-group');

        // X 轴（沿上边缘向右）
        var xAxisLine = document.createElementNS(NS, 'line');
        xAxisLine.setAttribute('class', 'grid-axis-line x-axis');
        xAxisLine.setAttribute('x1', '0');
        xAxisLine.setAttribute('y1', '0');
        xAxisLine.setAttribute('x2', String(round2(w)));
        xAxisLine.setAttribute('y2', '0');
        axesGroup.appendChild(xAxisLine);

        // Y 轴（沿左边缘向下）
        var yAxisLine = document.createElementNS(NS, 'line');
        yAxisLine.setAttribute('class', 'grid-axis-line y-axis');
        yAxisLine.setAttribute('x1', '0');
        yAxisLine.setAttribute('y1', '0');
        yAxisLine.setAttribute('x2', '0');
        yAxisLine.setAttribute('y2', String(round2(h)));
        axesGroup.appendChild(yAxisLine);

        // 原点 O (0,0)
        var originCircle = document.createElementNS(NS, 'circle');
        originCircle.setAttribute('class', 'grid-axis-origin-point');
        originCircle.setAttribute('cx', '0');
        originCircle.setAttribute('cy', '0');
        originCircle.setAttribute('r', String(round2(3.5 * u)));
        axesGroup.appendChild(originCircle);

        var originText = document.createElementNS(NS, 'text');
        originText.setAttribute('class', 'grid-axis-text tick');
        originText.setAttribute('x', String(round2(6 * u)));
        originText.setAttribute('y', String(round2(14 * u)));
        originText.setAttribute('font-size', String(round2(11 * u)));
        originText.textContent = 'O (0,0)';
        axesGroup.appendChild(originText);

        // X 轴末端指示文本
        var xLabel = document.createElementNS(NS, 'text');
        xLabel.setAttribute('class', 'grid-axis-text x-axis');
        xLabel.setAttribute('x', String(round2(w - 24 * u)));
        xLabel.setAttribute('y', String(round2(14 * u)));
        xLabel.setAttribute('text-anchor', 'end');
        xLabel.setAttribute('font-size', String(round2(10 * u)));
        xLabel.textContent = 'X+ (向右)';
        axesGroup.appendChild(xLabel);

        // Y 轴末端指示文本
        var yLabel = document.createElementNS(NS, 'text');
        yLabel.setAttribute('class', 'grid-axis-text y-axis');
        yLabel.setAttribute('x', String(round2(6 * u)));
        yLabel.setAttribute('y', String(round2(h - 6 * u)));
        yLabel.setAttribute('font-size', String(round2(10 * u)));
        yLabel.textContent = 'Y+ (向下)';
        axesGroup.appendChild(yLabel);

        // 刻度数值：沿 X 轴和 Y 轴按 majorStep 标记
        var tickStep = majorStep;
        while (tickStep * k < 45) {
            tickStep *= 2;
        }

        var tx, ty;
        for (tx = tickStep; tx < w; tx += tickStep) {
            var tickTextX = document.createElementNS(NS, 'text');
            tickTextX.setAttribute('class', 'grid-axis-text tick');
            tickTextX.setAttribute('x', String(round2(tx + 2 * u)));
            tickTextX.setAttribute('y', String(round2(12 * u)));
            tickTextX.setAttribute('font-size', String(round2(9.5 * u)));
            tickTextX.textContent = String(Math.round(tx));
            axesGroup.appendChild(tickTextX);
        }

        for (ty = tickStep; ty < h; ty += tickStep) {
            var tickTextY = document.createElementNS(NS, 'text');
            tickTextY.setAttribute('class', 'grid-axis-text tick');
            tickTextY.setAttribute('x', String(round2(4 * u)));
            tickTextY.setAttribute('y', String(round2(ty - 3 * u)));
            tickTextY.setAttribute('font-size', String(round2(9.5 * u)));
            tickTextY.textContent = String(Math.round(ty));
            axesGroup.appendChild(tickTextY);
        }

        frag.appendChild(axesGroup);

        dom.layer.innerHTML = '';
        dom.layer.appendChild(frag);
    }

    /**
     * 渲染智能对齐参考线 (Smart Alignment Guides)
     * @param {Array<{type:'h'|'v', pos:number, from?:number, to?:number, label?:string}>} guides
     * @param {{width:number, height:number}} [canvasSize]
     */
    function renderSmartGuides(guides, canvasSize) {
        var handleLayer = document.getElementById('handleLayer');
        if (!handleLayer) return;

        var el = document.getElementById('editorSmartGuides');
        if (!guides || guides.length === 0) {
            if (el) el.remove();
            return;
        }

        if (!el) {
            el = document.createElementNS(NS, 'g');
            el.id = 'editorSmartGuides';
            el.setAttribute('pointer-events', 'none');
            handleLayer.appendChild(el);
        }
        el.innerHTML = '';

        var cw = (canvasSize && canvasSize.width) || (state.canvasSize && state.canvasSize.width) || 2000;
        var ch = (canvasSize && canvasSize.height) || (state.canvasSize && state.canvasSize.height) || 1500;

        guides.forEach(function (g) {
            var guideG = document.createElementNS(NS, 'g');
            guideG.setAttribute('class', 'smart-guide-item');

            var line = document.createElementNS(NS, 'line');
            line.setAttribute('stroke', '#0284c7');
            line.setAttribute('stroke-width', '1.2');
            line.setAttribute('stroke-dasharray', '4,3');
            line.setAttribute('opacity', '0.85');

            if (g.type === 'v') {
                line.setAttribute('x1', String(g.pos));
                line.setAttribute('x2', String(g.pos));
                line.setAttribute('y1', String(g.from !== undefined ? g.from : 0));
                line.setAttribute('y2', String(g.to !== undefined ? g.to : ch));
            } else {
                line.setAttribute('y1', String(g.pos));
                line.setAttribute('y2', String(g.pos));
                line.setAttribute('x1', String(g.from !== undefined ? g.from : 0));
                line.setAttribute('x2', String(g.to !== undefined ? g.to : cw));
            }
            guideG.appendChild(line);

            if (g.label) {
                var badgeG = document.createElementNS(NS, 'g');
                var bx = g.type === 'v' ? g.pos + 6 : (g.from !== undefined ? g.from + 10 : 20);
                var by = g.type === 'v' ? (g.from !== undefined ? g.from + 16 : 20) : g.pos - 6;

                var rect = document.createElementNS(NS, 'rect');
                rect.setAttribute('x', String(bx - 3));
                rect.setAttribute('y', String(by - 10));
                rect.setAttribute('width', String(g.label.length * 6.5 + 8));
                rect.setAttribute('height', '14');
                rect.setAttribute('rx', '3');
                rect.setAttribute('fill', '#0284c7');
                rect.setAttribute('opacity', '0.9');

                var txt = document.createElementNS(NS, 'text');
                txt.setAttribute('x', String(bx + 1));
                txt.setAttribute('y', String(by));
                txt.setAttribute('fill', '#ffffff');
                txt.setAttribute('font-size', '9.5');
                txt.setAttribute('font-family', 'var(--cgo-font-mono, monospace)');
                txt.textContent = g.label;

                badgeG.appendChild(rect);
                badgeG.appendChild(txt);
                guideG.appendChild(badgeG);
            }

            el.appendChild(guideG);
        });
    }

    function clearSmartGuides() {
        var el = document.getElementById('editorSmartGuides');
        if (el) el.remove();
    }

    return {
        init: init,
        render: render,
        setVisible: setVisible,
        isVisible: isVisible,
        setGridSize: setGridSize,
        getGridSize: getGridSize,
        getEffectiveGridSize: getEffectiveGridSize,
        renderSmartGuides: renderSmartGuides,
        clearSmartGuides: clearSmartGuides
    };
})();

// 保留全局兼容别名
window.GridLayer = window.OpenMapEditor.GridLayer;
