/**
 * 开放地图编辑器 (OpenMap Editor) - 参考底图图层与变换手柄
 * 负责描图参照图加载、移动、等比/自由缩放、旋转手柄与透明度调节
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.GhostTransformer = (function () {
    'use strict';

    var GHOST_DEFAULT_OPACITY = 0.4;
    var GHOST_MIN_SIZE = 10;

    var dom = {
        layer: null,
        imageNode: null,
        handleGroup: null
    };

    var state = {
        src: null,
        img: null,
        name: '',
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        rotate: 0,
        opacity: GHOST_DEFAULT_OPACITY,
        visible: true,
        aspectLock: true,
        active: false // 是否显示手柄
    };

    function init(layerEl) {
        dom.layer = layerEl;
    }

    function round2(v) {
        return Math.round(v * 100) / 100;
    }

    function rectCenter() {
        return { x: state.x + state.w / 2, y: state.y + state.h / 2 };
    }

    /**
     * 载入底图图片文件或 URL
     */
    function loadImage(fileOrUrl, onLoaded) {
        var url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
        var name = typeof fileOrUrl === 'object' && fileOrUrl.name ? fileOrUrl.name : '参考底图';
        var img = new Image();
        img.onload = function () {
            state.src = url;
            state.img = img;
            state.name = name;
            state.w = img.naturalWidth || img.width || 800;
            state.h = img.naturalHeight || img.height || 600;
            state.visible = true;
            if (typeof onLoaded === 'function') onLoaded(state);
        };
        img.src = url;
    }

    /**
     * 铺满或适应画布
     */
    function fitToCanvas(canvasWidth, canvasHeight, mode) {
        if (!state.img) return;
        var cw = canvasWidth || 2000;
        var ch = canvasHeight || 1500;
        var iw = state.img.naturalWidth || state.img.width || 1;
        var ih = state.img.naturalHeight || state.img.height || 1;

        if (mode === 'cover') {
            state.x = 0;
            state.y = 0;
            state.w = cw;
            state.h = ch;
            state.rotate = 0;
        } else {
            // contain 等比居中
            var k = Math.min(cw / iw, ch / ih);
            state.w = round2(iw * k);
            state.h = round2(ih * k);
            state.x = round2((cw - state.w) / 2);
            state.y = round2((ch - state.h) / 2);
            state.rotate = 0;
        }
    }

    /**
     * 在画布上渲染参考底图与交互手柄
     */
    function render(selected) {
        if (!dom.layer) return;
        dom.layer.innerHTML = '';
        if (!state.src || !state.visible) return;

        var center = rectCenter();
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        if (state.rotate) {
            g.setAttribute('transform', 'rotate(' + round2(state.rotate) + ' ' + round2(center.x) + ' ' + round2(center.y) + ')');
        }

        var imgEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', state.src);
        imgEl.setAttribute('href', state.src);
        imgEl.setAttribute('x', round2(state.x));
        imgEl.setAttribute('y', round2(state.y));
        imgEl.setAttribute('width', round2(state.w));
        imgEl.setAttribute('height', round2(state.h));
        imgEl.setAttribute('opacity', round2(state.opacity));
        imgEl.style.cursor = selected ? 'move' : 'default';
        g.appendChild(imgEl);

        // 如果被选中，渲染外框和 4 角缩放手柄 + 旋转手柄
        if (selected) {
            var border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            border.setAttribute('x', round2(state.x));
            border.setAttribute('y', round2(state.y));
            border.setAttribute('width', round2(state.w));
            border.setAttribute('height', round2(state.h));
            border.setAttribute('fill', 'none');
            border.setAttribute('stroke', '#38bdf8');
            border.setAttribute('stroke-width', '1.5');
            border.setAttribute('stroke-dasharray', '4,4');
            border.setAttribute('pointer-events', 'none');
            g.appendChild(border);

            var corners = [
                { id: 'tl', x: state.x, y: state.y },
                { id: 'tr', x: state.x + state.w, y: state.y },
                { id: 'br', x: state.x + state.w, y: state.y + state.h },
                { id: 'bl', x: state.x, y: state.y + state.h }
            ];

            corners.forEach(function (c) {
                var handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                handle.setAttribute('cx', round2(c.x));
                handle.setAttribute('cy', round2(c.y));
                handle.setAttribute('r', '6');
                handle.setAttribute('fill', '#ffffff');
                handle.setAttribute('stroke', '#0284c7');
                handle.setAttribute('stroke-width', '2');
                handle.setAttribute('data-ghost-handle', c.id);
                handle.style.cursor = 'nwse-resize';
                g.appendChild(handle);
            });

            // 旋转手柄 (顶部引出一条线 + 绿色圆球)
            var rotLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            rotLine.setAttribute('x1', round2(center.x));
            rotLine.setAttribute('y1', round2(state.y));
            rotLine.setAttribute('x2', round2(center.x));
            rotLine.setAttribute('y2', round2(state.y - 24));
            rotLine.setAttribute('stroke', '#0284c7');
            rotLine.setAttribute('stroke-width', '1.5');
            g.appendChild(rotLine);

            var rotHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            rotHandle.setAttribute('cx', round2(center.x));
            rotHandle.setAttribute('cy', round2(state.y - 24));
            rotHandle.setAttribute('r', '7');
            rotHandle.setAttribute('fill', '#10b981');
            rotHandle.setAttribute('stroke', '#ffffff');
            rotHandle.setAttribute('stroke-width', '2');
            rotHandle.setAttribute('data-ghost-handle', 'rotate');
            rotHandle.style.cursor = 'grab';
            g.appendChild(rotHandle);
        }

        dom.layer.appendChild(g);
    }

    return {
        init: init,
        loadImage: loadImage,
        fitToCanvas: fitToCanvas,
        render: render,
        getState: function () { return state; },
        setOpacity: function (op) { state.opacity = Math.max(0, Math.min(1, op)); },
        setVisible: function (vis) { state.visible = !!vis; },
        setPosition: function (x, y) { state.x = x; state.y = y; },
        setSize: function (w, h) { state.w = Math.max(GHOST_MIN_SIZE, w); state.h = Math.max(GHOST_MIN_SIZE, h); },
        setRotate: function (deg) { state.rotate = deg; }
    };
})();

// 保留全局别名兼容
window.GhostTransformer = window.OpenMapEditor.GhostTransformer;
