/**
 * 开放地图编辑器 (OpenMap Editor) - 统一视口漫游与坐标变换层
 * 整合 CAD 级坐标吸附与平滑触控手势，统一视口计算
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.ViewportLayer = (function () {
    'use strict';

    var MIN_SCALE = 0.05;
    var MAX_SCALE = 6.0;

    var ZOOM_K_WHEEL = 0.0012;   // 鼠标滚轮一格 (deltaY=120) ≈ 15%
    var ZOOM_K_PINCH = 0.008;    // 触控板捏合

    var dom = {
        viewport: null,
        svg: null,
        viewLayer: null
    };

    var state = {
        scale: 1.0,
        pan: { x: 0, y: 0 },
        canvasSize: { width: 2000, height: 1500 },
        gridSize: 5,
        gridVisible: false,
        snapEnabled: true,
        slope: { m: 1, n: 1 }
    };

    var listeners = [];
    var isPanning = false;
    var lastPointer = { x: 0, y: 0 };
    var activePointers = new Map();
    var lastPinchDist = 0;

    function notify() {
        var info = {
            scale: state.scale,
            pan: { x: state.pan.x, y: state.pan.y },
            percentText: Math.round(state.scale * 100) + '%'
        };
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](info);
            } catch (err) {
                console.error('[ViewportLayer] 回调失败:', err);
            }
        }
    }

    function applyTransform() {
        if (!dom.viewLayer) return;
        dom.viewLayer.setAttribute(
            'transform',
            'translate(' + state.pan.x + ', ' + state.pan.y + ') scale(' + state.scale + ')'
        );
        notify();
    }

    /**
     * 屏幕客户端坐标转换为 SVG 世界坐标
     * @param {number} clientX
     * @param {number} clientY
     * @returns {{x: number, y: number}}
     */
    function screenToWorld(clientX, clientY) {
        if (!dom.viewport) return { x: clientX, y: clientY };
        var rect = dom.viewport.getBoundingClientRect();
        return {
            x: (clientX - rect.left - state.pan.x) / state.scale,
            y: (clientY - rect.top - state.pan.y) / state.scale
        };
    }

    /**
     * SVG 世界坐标转换为屏幕客户端坐标
     * @param {number} worldX
     * @param {number} worldY
     * @returns {{x: number, y: number}}
     */
    function worldToScreen(worldX, worldY) {
        if (!dom.viewport) return { x: worldX, y: worldY };
        var rect = dom.viewport.getBoundingClientRect();
        return {
            x: rect.left + state.pan.x + worldX * state.scale,
            y: rect.top + state.pan.y + worldY * state.scale
        };
    }

    /**
     * 以视口内某一客户端点为锚缩放
     */
    function zoomToPoint(targetScale, clientX, clientY) {
        if (!dom.viewport) return;
        var next = Math.min(Math.max(targetScale, MIN_SCALE), MAX_SCALE);
        if (Math.abs(next - state.scale) < 1e-6) return;
        var rect = dom.viewport.getBoundingClientRect();
        var mx = clientX - rect.left;
        var my = clientY - rect.top;
        state.pan.x = mx - (mx - state.pan.x) * (next / state.scale);
        state.pan.y = my - (my - state.pan.y) * (next / state.scale);
        state.scale = next;
        applyTransform();
    }

    /**
     * 按平移差值漫游画布
     */
    function panBy(dx, dy) {
        state.pan.x += dx;
        state.pan.y += dy;
        applyTransform();
    }

    /**
     * 以视口中心为锚按倍率缩放
     */
    function zoomBy(factor) {
        if (!dom.viewport) return;
        var rect = dom.viewport.getBoundingClientRect();
        zoomToPoint(state.scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    /**
     * 自适应充满视口并居中展示
     */
    function fitCanvas(width, height) {
        if (!dom.viewport) return;
        var w = Number(width) > 0 ? Number(width) : state.canvasSize.width;
        var h = Number(height) > 0 ? Number(height) : state.canvasSize.height;
        state.canvasSize.width = w;
        state.canvasSize.height = h;

        var vpW = dom.viewport.clientWidth;
        var vpH = dom.viewport.clientHeight;
        if (!vpW || !vpH) return;

        var padding = 60;
        var fitScale = Math.min((vpW - padding) / w, (vpH - padding) / h);
        state.scale = Math.min(Math.max(fitScale, MIN_SCALE), 1.2);
        state.pan.x = (vpW - w * state.scale) / 2;
        state.pan.y = (vpH - h * state.scale) / 2;
        applyTransform();
        if (window.OpenMapEditor.GridLayer) {
            window.OpenMapEditor.GridLayer.render({
                width: w,
                height: h,
                scale: state.scale,
                gridSize: state.gridSize
            });
        }
    }

    /**
     * 复位至 100% 原始比例居中
     */
    function resetView() {
        if (!dom.viewport) return;
        var vpW = dom.viewport.clientWidth;
        var vpH = dom.viewport.clientHeight;
        state.scale = 1.0;
        state.pan.x = (vpW - state.canvasSize.width) / 2;
        state.pan.y = (vpH - state.canvasSize.height) / 2;
        applyTransform();
    }

    /**
     * 将视口平移居中到指定的 SVG 世界坐标点
     * @param {number} worldX
     * @param {number} worldY
     * @param {number} [targetScale]
     */
    function centerOn(worldX, worldY, targetScale) {
        if (!dom.viewport) return;
        var vpW = dom.viewport.clientWidth;
        var vpH = dom.viewport.clientHeight;
        if (!vpW || !vpH) return;
        if (targetScale !== undefined && targetScale !== null) {
            state.scale = Math.min(Math.max(targetScale, MIN_SCALE), MAX_SCALE);
        }
        state.pan.x = vpW / 2 - worldX * state.scale;
        state.pan.y = vpH / 2 - worldY * state.scale;
        applyTransform();
    }

    /**
     * 网格吸附计算
     */
    function snapPoint(x, y) {
        if (!state.snapEnabled) return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
        var g = state.gridSize || 5;
        // 低缩放时网格会按 LOD 变稀，吸附步长必须跟着变，否则点会落在可见网格线之间
        if (window.OpenMapEditor && window.OpenMapEditor.GridLayer &&
            typeof window.OpenMapEditor.GridLayer.getEffectiveGridSize === 'function') {
            var eff = window.OpenMapEditor.GridLayer.getEffectiveGridSize();
            if (eff > g) g = eff;
        }
        return {
            x: Math.round(x / g) * g,
            y: Math.round(y / g) * g
        };
    }

    /** 当前生效的吸附步长（供绘制工具在 45° 约束后继续对齐网格） */
    function getSnapStep() {
        var g = state.gridSize || 5;
        if (window.OpenMapEditor && window.OpenMapEditor.GridLayer &&
            typeof window.OpenMapEditor.GridLayer.getEffectiveGridSize === 'function') {
            var eff = window.OpenMapEditor.GridLayer.getEffectiveGridSize();
            if (eff > g) g = eff;
        }
        return g;
    }

    /**
     * Shift 射线吸附（沿 0/90° 或斜率比例射线约束）
     */
    function snapPointToRays(from, to, slopeRatio) {
        if (!from) return snapPoint(to.x, to.y);
        var g = state.snapEnabled ? (state.gridSize || 5) : 1;
        var dx = to.x - from.x, dy = to.y - from.y;
        if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
            return { x: Math.round(from.x * 100) / 100, y: Math.round(from.y * 100) / 100 };
        }
        var s = slopeRatio || state.slope || { m: 1, n: 1 };
        var cands = [
            { A: 1, B: 0 }, { A: -1, B: 0 }, { A: 0, B: 1 }, { A: 0, B: -1 },
            { A: s.m, B: s.n }, { A: -s.m, B: s.n }, { A: s.m, B: -s.n }, { A: -s.m, B: -s.n },
            { A: s.n, B: s.m }, { A: -s.n, B: s.m }, { A: s.n, B: -s.m }, { A: -s.n, B: -s.m }
        ];
        var dist = Math.hypot(dx, dy) || 1;
        var best = cands[0], bestCos = -2;
        for (var i = 0; i < cands.length; i++) {
            var c = cands[i], len = Math.hypot(c.A, c.B) || 1;
            var cos = (dx * c.A + dy * c.B) / (dist * len);
            if (cos > bestCos) { bestCos = cos; best = c; }
        }
        var step = Math.hypot(best.A, best.B) || 1;
        var along = (dx * best.A + dy * best.B) / step;
        var k = Math.max(1, Math.round(Math.abs(along) / step / g)) * g;
        var x = from.x + best.A * k, y = from.y + best.B * k;
        return state.snapEnabled
            ? { x: Math.round(x / g) * g, y: Math.round(y / g) * g }
            : { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
    }

    /**
     * 滚轮事件监听器（支持鼠标滚轮与 macOS 触控板智能区分）
     */
    function onWheel(e) {
        e.preventDefault();

        var factorFor = function (k) {
            var f = Math.exp(-e.deltaY * k);
            return Math.max(0.75, Math.min(1.33, f));
        };

        // 触控板捏合缩放（macOS 表现为 ctrlKey + wheel）
        if (e.ctrlKey) {
            zoomToPoint(state.scale * factorFor(ZOOM_K_PINCH), e.clientX, e.clientY);
            return;
        }

        var mode = localStorage.getItem('openmap_editor_wheel_mode') ||
            localStorage.getItem('cgo_openmap_wheel_mode') ||
            localStorage.getItem('nal_pref_wheel_mode') || 'smart';
        var doPan = function () { panBy(-e.deltaX * 1.5, -e.deltaY * 1.5); };
        var doZoom = function () { zoomToPoint(state.scale * factorFor(ZOOM_K_WHEEL), e.clientX, e.clientY); };

        if (mode === 'zoom') { doZoom(); return; }
        if (mode === 'pan') { doPan(); return; }

        // smart 模式：识别是否有横向分量或平滑滚动
        var isTouchpad = (function () {
            if (Math.abs(e.deltaX) > 0) return true;
            if (e.deltaMode === 1) return false;
            if (e.wheelDelta !== undefined) {
                if (Math.abs(e.wheelDelta) % 120 === 0) return false;
                if (Math.abs(e.wheelDelta) < 100) return true;
            }
            return Math.abs(e.deltaY) < 40;
        })();

        if (isTouchpad) doPan(); else doZoom();
    }

    /**
     * 绑定画布与视口交互事件
     */
    function init(viewportEl, svgEl, viewLayerEl) {
        dom.viewport = viewportEl;
        dom.svg = svgEl;
        dom.viewLayer = viewLayerEl;

        if (!dom.viewport) return;

        dom.viewport.addEventListener('wheel', onWheel, { passive: false });

        // 漫游拖拽支持（中键或按住空格拖拽）
        window.addEventListener('keydown', function (e) {
            if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
                dom.viewport.classList.add('panning');
            }
        });

        window.addEventListener('keyup', function (e) {
            if (e.code === 'Space') {
                dom.viewport.classList.remove('panning');
            }
        });

        dom.viewport.addEventListener('mousedown', function (e) {
            var wantPan = (e.button === 1) || (e.button === 0 && spaceHeld);
            if (!wantPan) return;
            if (e.target.closest('.viewport-hud')) return;
            panDrag = {
                startX: e.clientX, startY: e.clientY,
                panX: state.pan.x, panY: state.pan.y
            };
            isPanning = true;
            setPanCursor(true);
            e.preventDefault();              // 压掉浏览器中键「自动滚动」圆钮与拖选文字
        });

        window.addEventListener('mousemove', function (e) {
            if (!panDrag) return;
            // 兜底：在窗口外松开鼠标时收不到 mouseup，避免平移「粘住」
            if (e.buttons === 0) {
                panDrag = null;
                isPanning = false;
                setPanCursor(false);
                return;
            }
            state.pan.x = panDrag.panX + (e.clientX - panDrag.startX);
            state.pan.y = panDrag.panY + (e.clientY - panDrag.startY);
            applyTransform();
        });

        window.addEventListener('mouseup', function (e) {
            if (!panDrag) return;
            if (e.button !== 0 && e.button !== 1) return;
            panDrag = null;
            isPanning = false;
            setPanCursor(false);             // 空格仍按住时 setPanCursor 会保留手形光标
        });

        // 失焦（切标签页、弹窗抢焦点）时如果漏了 keyup，空格会被"卡住"，
        // 表现为左键点击全被当成平移、画不了东西 —— 这里兜底复位。
        window.addEventListener('blur', function () {
            spaceHeld = false;
            panDrag = null;
            isPanning = false;
            if (dom.viewport) dom.viewport.classList.remove('panning');
        });

        // 响应窗口尺寸重排
        window.addEventListener('resize', function () {
            applyTransform();
        });
    }

    function onTransform(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    return {
        init: init,
        screenToWorld: screenToWorld,
        worldToScreen: worldToScreen,
        zoomBy: zoomBy,
        zoomToPoint: zoomToPoint,
        panBy: panBy,
        fitCanvas: fitCanvas,
        resetView: resetView,
        centerOn: centerOn,
        applyTransform: applyTransform,
        snapPoint: snapPoint,
        getSnapStep: getSnapStep,
        snapPointToRays: snapPointToRays,
        onTransform: onTransform,
        getScale: function () { return state.scale; },
        getPan: function () { return { x: state.pan.x, y: state.pan.y }; },
        getGridSize: function () { return state.gridSize || 5; },
        getCanvasSize: function () { return { width: state.canvasSize.width, height: state.canvasSize.height }; },
        isGridVisible: function () { return !!state.gridVisible; },
        setGrid: function (visible) {
            state.gridVisible = !!visible;
            if (window.OpenMapEditor.GridLayer) {
                window.OpenMapEditor.GridLayer.setVisible(state.gridVisible);
            }
        },
        setGridVisible: function (visible) {
            this.setGrid(visible);
        },
        setGridSize: function (g) {
            state.gridSize = Number(g) || 5;
            if (window.OpenMapEditor.GridLayer) {
                window.OpenMapEditor.GridLayer.setGridSize(state.gridSize);
            }
        },
        setSnap: function (enabled) {
            state.snapEnabled = !!enabled;
        },
        setSnapEnabled: function (en) { state.snapEnabled = !!en; },
        setSlope: function (m, n) { state.slope = { m: m, n: n }; }
    };
})();

// 保留全局别名兼容
window.ViewportLayer = window.OpenMapEditor.ViewportLayer;
