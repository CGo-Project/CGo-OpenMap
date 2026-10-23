/**
 * 开放地图编辑器 (OpenMap Editor) - 在建与规划未开通线路走向图层 (Not Open Lines Layer)
 * 严格按照主地图 core/script.js 的 renderNotOpenLines 规范渲染：
 * 1. 自动调用 CGoPathGeometry.generateRoundedPath(points, 0.99) 平滑倒角；
 * 2. 默认使用 style.color || "var(--map-bg, #ffffff)" —— 对应北京等城市的白线遮罩描边；
 * 3. 默认使用 style.width || 3.4px；
 * 4. 支持 dashArray（如虚线走向）与 opacity 透明度；
 * 5. 端点与拐角全圆角，与主地图 100% 毫无偏差。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.NotOpenLayer = (function () {
    'use strict';

    var dom = {
        layer: null
    };

    function init(layerEl) {
        dom.layer = layerEl;
    }

    function getGeometryEngine() {
        return window.CGoPathGeometry;
    }

    /**
     * 渲染在建规划与白线描边未开通走向
     * @param {Object} project 工程模型
     * @param {Object} [options]
     */
    function render(project, options) {
        if (!dom.layer) return;
        dom.layer.innerHTML = '';
        if (!project || !project.notOpenLines) return;

        var geom = getGeometryEngine();

        (project.notOpenLines || []).forEach(function (item, idx) {
            var pts = item.points || [];
            if (pts.length < 2) return;

            var pathD = '';
            if (geom && typeof geom.generateRoundedPath === 'function') {
                pathD = geom.generateRoundedPath(pts, 0.99);
            } else {
                pathD = 'M ' + pts[0].x + ' ' + pts[0].y;
                for (var i = 1; i < pts.length; i++) {
                    pathD += ' L ' + pts[i].x + ' ' + pts[i].y;
                }
            }

            if (!pathD) return;

            var style = item.style || {};
            var color = style.color || 'var(--map-bg, #ffffff)';
            var width = style.width !== undefined ? style.width : '3.4';
            var opacity = style.opacity !== undefined ? style.opacity : 1;
            var dashArray = style.dashArray || 'none';

            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('class', 'line-visual-notopen-overlay');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', String(width));
            path.setAttribute('stroke-opacity', String(opacity));
            if (dashArray !== 'none') {
                path.setAttribute('stroke-dasharray', dashArray);
            }
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            if (options && options.selectedIdx === idx) {
                var halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                halo.setAttribute('d', pathD);
                halo.setAttribute('stroke', 'var(--office-primary, #0078d4)');
                halo.setAttribute('stroke-width', String(Number(width) + 6));
                halo.setAttribute('stroke-opacity', '0.45');
                halo.setAttribute('fill', 'none');
                halo.setAttribute('stroke-linecap', 'round');
                halo.setAttribute('stroke-linejoin', 'round');
                halo.setAttribute('pointer-events', 'none');
                dom.layer.appendChild(halo);
            }

            dom.layer.appendChild(path);
        });
    }

    return {
        init: init,
        render: render
    };
})();

window.NotOpenLayer = window.OpenMapEditor.NotOpenLayer;
