/**
 * 开放地图编辑器 (OpenMap Editor) - 虚拟换乘连接器图层 (Virtual Connector Layer)
 * 严格按照主地图 core/script.js 的 renderVirtualConnectors 规范渲染：
 * 1. 付费/国铁换乘连线 (VIRTUAL_CONNECT_LINES):
 *    - 3 层复合线：底描边 3.25px (var(--map-bg)) + 中层 2.25px (#78848b) + 细芯 0.85px (var(--map-bg))
 * 2. 免费换乘连线 (VIRTUAL_FREE_CONNECT_LINES):
 *    - 2 层复合线：底描边 2.75px (var(--map-bg)) + 实体 1.5px (#78848b)
 * 3. 完美支持端点 offsetFrom / offsetTo 偏移，与主地图 100% 毫无偏差
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.VirtualConnectorLayer = (function () {
    'use strict';

    var dom = {
        layer: null
    };

    function init(layerEl) {
        dom.layer = layerEl;
    }

    function createSvgPath(d, color, width, lineCap) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', String(width));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', lineCap || 'round');
        path.setAttribute('pointer-events', 'none');
        return path;
    }

    /**
     * 渲染虚拟换乘连线
     * @param {Object} project 工程模型
     * @param {Object} [options]
     */
    function render(project, options) {
        if (!dom.layer) return;
        dom.layer.innerHTML = '';
        if (!project || !project.virtualConnectors || !project.nodes) return;

        var nodes = project.nodes;
        var conns = project.virtualConnectors;

        conns.forEach(function (conn, idx) {
            var sFrom = nodes[conn.from];
            var sTo = nodes[conn.to];
            if (!sFrom || !sTo) return;

            var x1 = sFrom.x + ((conn.offsetFrom && conn.offsetFrom.x) || 0);
            var y1 = sFrom.y + ((conn.offsetFrom && conn.offsetFrom.y) || 0);
            var x2 = sTo.x + ((conn.offsetTo && conn.offsetTo.x) || 0);
            var y2 = sTo.y + ((conn.offsetTo && conn.offsetTo.y) || 0);

            var pathD = 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;

            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'virtual-connector-item');
            g.setAttribute('data-from', conn.from);
            g.setAttribute('data-to', conn.to);
            g.setAttribute('data-virtual-idx', String(idx));

            if (options && options.selectedIdx === idx) {
                var halo = createSvgPath(pathD, 'var(--office-primary, #0078d4)', 7, 'round');
                halo.setAttribute('stroke-opacity', '0.45');
                g.appendChild(halo);
            }

            if (conn.free) {
                // 免费换乘连线 (2 层)
                g.appendChild(createSvgPath(pathD, 'var(--map-bg, #ffffff)', 2.75));
                g.appendChild(createSvgPath(pathD, '#78848b', 1.5));
            } else {
                // 付费/国铁换乘连线 (3 层复合空心线)
                g.appendChild(createSvgPath(pathD, 'var(--map-bg, #ffffff)', 3.25));
                g.appendChild(createSvgPath(pathD, '#78848b', 2.25));
                g.appendChild(createSvgPath(pathD, 'var(--map-bg, #ffffff)', 0.85));
            }

            dom.layer.appendChild(g);
        });
    }

    return {
        init: init,
        render: render
    };
})();

window.VirtualConnectorLayer = window.OpenMapEditor.VirtualConnectorLayer;
