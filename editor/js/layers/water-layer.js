/**
 * 开放地图编辑器 (OpenMap Editor) - 水域与河流图层
 * 负责水域多边形面与带线宽河道路径的绘制、管理与双主题 SVG 代码生成
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.WaterLayer = (function () {
    'use strict';

    var dom = {
        layer: null
    };

    function init(layerEl) {
        dom.layer = layerEl;
    }

    function isWaterPath(water) {
        return !!(water && (water.type === 'path' || water.type === 'river'));
    }

    function round2(v) {
        return Math.round(v * 100) / 100;
    }

    function polygonPath(points) {
        if (!points || points.length < 2) return '';
        var d = 'M ' + round2(points[0].x) + ' ' + round2(points[0].y);
        for (var i = 1; i < points.length; i++) {
            d += ' L ' + round2(points[i].x) + ' ' + round2(points[i].y);
        }
        return d + ' Z';
    }

    function polylinePath(points) {
        if (!points || points.length < 2) return '';
        var d = 'M ' + round2(points[0].x) + ' ' + round2(points[0].y);
        for (var i = 1; i < points.length; i++) {
            d += ' L ' + round2(points[i].x) + ' ' + round2(points[i].y);
        }
        return d;
    }

    /**
     * 在画布上渲染水域图层
     * @param {Array} waters 水域数据数组
     * @param {Object} style 水域样式配置 { fillLight, fillDark, opacity }
     * @param {string} [selectedWaterId] 当前选中的水域 ID
     */
    function render(waters, style, selectedWaterId) {
        if (!dom.layer) return;
        dom.layer.innerHTML = '';
        if (!waters || !waters.length) return;

        var st = style || { fillLight: '#a5d7e8', fillDark: '#13354d', opacity: 0.6 };
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var fillColor = isDark ? st.fillDark : st.fillLight;

        waters.forEach(function (w) {
            var pts = w.points || [];
            if (pts.length < 2) return;

            var el;
            var isSelected = (w.id === selectedWaterId);

            if (isWaterPath(w)) {
                el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                el.setAttribute('d', polylinePath(pts));
                el.setAttribute('fill', 'none');
                el.setAttribute('stroke', fillColor);
                el.setAttribute('stroke-width', w.width || 20);
                el.setAttribute('stroke-linecap', 'round');
                el.setAttribute('stroke-linejoin', 'round');
            } else {
                if (pts.length < 3) return;
                el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                el.setAttribute('d', polygonPath(pts));
                el.setAttribute('fill', fillColor);
            }

            el.setAttribute('opacity', st.opacity != null ? st.opacity : 0.6);
            el.setAttribute('data-water-id', w.id);
            el.style.cursor = 'pointer';

            if (isSelected) {
                el.setAttribute('stroke', '#38bdf8');
                el.setAttribute('stroke-dasharray', '4,4');
                if (!isWaterPath(w)) {
                    el.setAttribute('stroke-width', '2');
                }
            }

            dom.layer.appendChild(el);
        });
    }

    /**
     * 生成双主题独立 SVG 文件字符串 (供导出为 assets/{city}_sea.svg)
     * @param {Array} waters
     * @param {number} width 画布宽
     * @param {number} height 画布高
     * @param {Object} style 水域全局样式配置
     * @returns {string}
     */
    function exportSeaSvg(waters, width, height, style) {
        var wList = (waters || []).filter(function (w) {
            return isWaterPath(w) ? (w.points || []).length >= 2 : (w.points || []).length >= 3;
        });
        if (!wList.length) return '';

        var st = style || { fillLight: '#a5d7e8', fillDark: '#13354d', opacity: 0.6 };
        var svgParts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
            '" viewBox="0 0 ' + width + ' ' + height + '">',
            '  <style>',
            '    .sea { fill: ' + st.fillLight + '; }',
            '    .sea-line { fill: none; stroke: ' + st.fillLight + '; stroke-linecap: round; stroke-linejoin: round; }',
            '    @media (prefers-color-scheme: dark) {',
            '      .sea { fill: ' + st.fillDark + '; }',
            '      .sea-line { stroke: ' + st.fillDark + '; }',
            '    }',
            '  </style>'
        ];

        wList.forEach(function (water) {
            if (isWaterPath(water)) {
                svgParts.push('  <path class="sea-line" stroke-width="' + round2(water.width || 20) +
                    '" d="' + polylinePath(water.points) + '"/>');
            } else {
                svgParts.push('  <path class="sea" d="' + polygonPath(water.points) + '"/>');
            }
        });

        svgParts.push('</svg>');
        return svgParts.join('\n') + '\n';
    }

    return {
        init: init,
        render: render,
        exportSeaSvg: exportSeaSvg,
        isWaterPath: isWaterPath
    };
})();

// 保留全局别名兼容
window.WaterLayer = window.OpenMapEditor.WaterLayer;
