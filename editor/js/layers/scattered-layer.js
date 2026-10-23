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
     * 渲染地理地标与城门散点
     * @param {Object} project 工程模型
     * @param {Object} [options]
     */
    function render(project, options) {
        if (!dom.layer) return;
        dom.layer.innerHTML = '';
        if (!project || !project.scattered || !project.scattered.length) return;

        project.scattered.forEach(function (item, idx) {
            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'scattered-landmark-item');
            g.setAttribute('data-scattered-idx', String(idx));
            g.setAttribute('transform', 'translate(' + item.x + ', ' + item.y + ')' +
                (item.rotation ? ' rotate(' + item.rotation + ')' : ''));
            if (item.opacity !== undefined) {
                g.setAttribute('opacity', String(item.opacity));
            }

            var w = item.width || 36;
            var h = item.height || 36;

            if (item.file) {
                var img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                img.setAttribute('href', resolveSvgPath(item.file));
                img.setAttribute('x', String(-w / 2));
                img.setAttribute('y', String(-h / 2));
                img.setAttribute('width', String(w));
                img.setAttribute('height', String(h));
                img.setAttribute('pointer-events', 'none');
                g.appendChild(img);
            }

            if (options && options.selectedIdx === idx) {
                var ring = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
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
                ring.setAttribute('pointer-events', 'none');
                g.appendChild(ring);
            }

            dom.layer.appendChild(g);
        });
    }

    return {
        init: init,
        render: render,
        resolveSvgPath: resolveSvgPath
    };
})();

window.ScatteredLayer = window.OpenMapEditor.ScatteredLayer;
