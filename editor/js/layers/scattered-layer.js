/**
 * 开放地图编辑器 (OpenMap Editor) - 背景地标与城门散点图层 (Scattered Layer)
 * 严格按照主地图 core/script.js 的 renderScatteredObjects 规范渲染：
 * 包含：各城市城门地标（如北京西直门、德胜门、东直门等）、指南针、河流图腾与文化标志。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.ScatteredLayer = (function () {
    'use strict';

    var dom = {
        layer: null
    };

    function init(layerEl) {
        dom.layer = layerEl;
    }

    function resolveSvgPath(filename) {
        if (!filename) return '';
        if (/^(https?:|data:|\/)/.test(filename)) {
            return filename;
        }
        // 编辑器位于 /editor/ 目录，将相对根目录的路径回退一级
        if (/^\.\//.test(filename)) {
            return '../' + filename.slice(2);
        }
        if (/^(city|assets)\//.test(filename)) {
            return '../' + filename;
        }
        var clean = filename.replace(/^svg\//, '');
        return '../assets/svg/' + clean;
    }

    /**
     * 渲染地理地标与城门散点。
     * DOM 与 core/script.js renderScatteredObjects 一致（#scattered-layer > .scattered-item > img），
     * 这样城市样式表里针对 #scattered-layer 的规则（深色主题反相、提亮等）在编辑器里同样生效。
     * @param {Object} project 工程模型
     * @param {Object} [options] { selectedIdx }
     */
    function render(project, options) {
        if (!dom.layer) return;
        dom.layer.innerHTML = '';
        if (!project || !project.scattered || !project.scattered.length) return;

        var SVG_NS = 'http://www.w3.org/2000/svg';
        var cw = (project.canvas && project.canvas.width) || 2000;
        var ch = (project.canvas && project.canvas.height) || 1500;
        var fo = document.createElementNS(SVG_NS, 'foreignObject');
        fo.setAttribute('x', '0');
        fo.setAttribute('y', '0');
        fo.setAttribute('width', String(cw));
        fo.setAttribute('height', String(ch));
        fo.setAttribute('class', 'cgo-map-replica-host');
        fo.setAttribute('pointer-events', 'none');
        var root = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        root.id = 'scattered-layer';
        root.className = 'cgo-map-replica cgo-replica-scattered';
        root.style.width = cw + 'px';
        root.style.height = ch + 'px';
        fo.appendChild(root);

        project.scattered.forEach(function (item, idx) {
            var div = document.createElement('div');
            div.className = 'scattered-item';
            div.setAttribute('data-scattered-idx', String(idx));
            div.style.left = item.x + 'px';
            div.style.top = item.y + 'px';
            div.style.zIndex = item.zIndex || 5;
            div.style.width = item.width ? item.width + 'px' : 'auto';
            div.style.height = item.height ? item.height + 'px' : 'auto';
            if (item.opacity !== undefined) div.style.opacity = item.opacity;
            if (item.rotation) div.style.transform = 'translate(-50%, -50%) rotate(' + item.rotation + 'deg)';
            if (item.file) {
                var img = document.createElement('img');
                img.src = resolveSvgPath(item.file);
                img.alt = '';
                img.draggable = false;
                img.style.cssText = 'width:100%; height:100%; display:block;';
                div.appendChild(img);
            }
            root.appendChild(div);
        });
        dom.layer.appendChild(fo);

        var sel = options ? options.selectedIdx : null;
        var item = (sel !== null && sel !== undefined) ? project.scattered[sel] : null;
        if (item) {
            var w = item.width || 36;
            var h = item.height || 36;
            var g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('transform', 'translate(' + item.x + ', ' + item.y + ')' +
                (item.rotation ? ' rotate(' + item.rotation + ')' : ''));
            var ring = document.createElementNS(SVG_NS, 'rect');
            ring.setAttribute('x', String(-w / 2 - 4));
            ring.setAttribute('y', String(-h / 2 - 4));
            ring.setAttribute('width', String(w + 8));
            ring.setAttribute('height', String(h + 8));
            ring.setAttribute('rx', '6');
            ring.setAttribute('ry', '6');
            ring.setAttribute('fill', 'none');
            ring.setAttribute('stroke', 'var(--office-primary, #0078d4)');
            ring.setAttribute('stroke-width', '2');
            ring.setAttribute('stroke-dasharray', '4,3');
            ring.setAttribute('vector-effect', 'non-scaling-stroke');
            ring.setAttribute('pointer-events', 'none');
            g.appendChild(ring);
            dom.layer.appendChild(g);
        }
    }

    return {
        init: init,
        render: render,
        resolveSvgPath: resolveSvgPath
    };
})();

window.ScatteredLayer = window.OpenMapEditor.ScatteredLayer;
