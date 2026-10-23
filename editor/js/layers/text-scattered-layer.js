/**
 * 开放地图编辑器 (OpenMap Editor) - 自由注释文本图层
 * 负责画布中自由文本的排版、字体缩放、旋转、对齐与 SVG 导出
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.TextScatteredLayer = (function () {
    'use strict';

    var dom = {
        layer: null
    };

    var TEXT_DEFAULT = {
        light: '#1e293b',
        dark: '#e2e8f0',
        fontStack: 'system-ui, -apple-system, sans-serif'
    };

    function init(layerEl) {
        dom.layer = layerEl;
    }

    function round2(v) {
        return Math.round(v * 100) / 100;
    }

    function escapeXml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * 在画布上渲染自由注释文本
     * @param {Array} texts 文本对象数组
     * @param {string} [selectedTextId] 当前选中的文本 ID
     */
    function render(texts, selectedTextId) {
        if (!dom.layer) return;
        dom.layer.innerHTML = '';
        if (!texts || !texts.length) return;

        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var defaultColor = isDark ? TEXT_DEFAULT.dark : TEXT_DEFAULT.light;

        texts.forEach(function (t) {
            if (!t || !t.text) return;
            var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('x', round2(t.x));
            textEl.setAttribute('y', round2(t.y));
            textEl.setAttribute('font-size', round2(t.size || 14));
            textEl.setAttribute('text-anchor', t.anchor || 'start');
            textEl.setAttribute('font-family', TEXT_DEFAULT.fontStack);
            textEl.setAttribute('data-text-id', t.id);

            var color = t.color || defaultColor;
            textEl.setAttribute('fill', color);
            if (t.bold) textEl.setAttribute('font-weight', '700');

            if (t.rotate) {
                textEl.setAttribute('transform', 'rotate(' + round2(t.rotate) + ' ' + round2(t.x) + ' ' + round2(t.y) + ')');
            }

            // 支持换行多行 tspan
            var lines = String(t.text).split('\n');
            var lineHeight = (t.size || 14) * 1.25;
            lines.forEach(function (line, idx) {
                var span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                span.setAttribute('x', round2(t.x));
                if (idx > 0) span.setAttribute('dy', round2(lineHeight));
                span.textContent = line || ' ';
                textEl.appendChild(span);
            });

            textEl.style.cursor = 'pointer';
            if (t.id === selectedTextId) {
                textEl.setAttribute('paint-order', 'stroke fill');
                textEl.setAttribute('stroke', '#38bdf8');
                textEl.setAttribute('stroke-width', '2');
            }

            dom.layer.appendChild(textEl);
        });
    }

    /**
     * 导出自由注释文本独立 SVG
     */
    function exportTextSvg(texts, width, height) {
        var tList = (texts || []).filter(function (t) {
            return String(t.text || '').trim() !== '';
        });
        if (!tList.length) return '';

        var svgParts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
            '" viewBox="0 0 ' + width + ' ' + height + '">',
            '  <style>',
            '    .txt { fill: ' + TEXT_DEFAULT.light + '; }',
            '    @media (prefers-color-scheme: dark) {',
            '      .txt { fill: ' + TEXT_DEFAULT.dark + '; }',
            '    }',
            '    text { font-family: ' + TEXT_DEFAULT.fontStack + '; }',
            '  </style>'
        ];

        tList.forEach(function (t) {
            var attr = [
                'x="' + round2(t.x) + '"',
                'y="' + round2(t.y) + '"',
                'font-size="' + round2(t.size || 14) + '"',
                'text-anchor="' + (t.anchor || 'start') + '"'
            ];
            if (t.bold) attr.push('font-weight="700"');
            if (t.rotate) attr.push('transform="rotate(' + round2(t.rotate) + ' ' + round2(t.x) + ' ' + round2(t.y) + ')"');
            var followsTheme = !/^#[0-9a-fA-F]{6}$/.test(String(t.color || ''));
            if (followsTheme) attr.push('class="txt"');
            else attr.push('fill="' + t.color + '"');

            var lines = String(t.text).split('\n');
            var lineHeight = (t.size || 14) * 1.25;
            var spans = lines.map(function (line, i) {
                return '<tspan x="' + round2(t.x) + '"' + (i === 0 ? '' : ' dy="' + round2(lineHeight) + '"') + '>' +
                    escapeXml(line === '' ? ' ' : line) + '</tspan>';
            }).join('');

            svgParts.push('  <text ' + attr.join(' ') + '>' + spans + '</text>');
        });

        svgParts.push('</svg>');
        return svgParts.join('\n') + '\n';
    }

    return {
        init: init,
        render: render,
        exportTextSvg: exportTextSvg
    };
})();

// 保留全局别名兼容
window.TextScatteredLayer = window.OpenMapEditor.TextScatteredLayer;
