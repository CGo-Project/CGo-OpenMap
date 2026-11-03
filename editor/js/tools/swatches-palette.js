/**
 * 开放地图编辑器 (OpenMap Editor) - 轨道交通色板库与吸管系统 (SwatchesPalette)
 * 对标 VectorCraft 的色板库与吸管工具 (I)
 * 集成全网轨交标准色谱、工程当前调色板与像素级吸管取色器
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.SwatchesPalette = (function () {
    'use strict';

    // 常用标准城市轨道交通色谱 (GB/T 轨交色系与标杆城市精选)
    var PRESET_SWATCHES = [
        '#C23531', '#E11D48', '#DC2626', '#EA580C', '#D97706',
        '#CA8A04', '#16A34A', '#059669', '#0D9488', '#0891B2',
        '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA',
        '#C026D3', '#DB2777', '#475569', '#1E293B', '#0F172A'
    ];

    var RECENT_KEY = 'openmap_editor_recent_swatches';

    function getRecentSwatches() {
        try {
            var raw = localStorage.getItem(RECENT_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }

    function addRecentSwatch(hex) {
        if (!hex) return;
        var list = getRecentSwatches();
        var upper = hex.toUpperCase();
        list = list.filter(function (c) { return c !== upper; });
        list.unshift(upper);
        if (list.length > 10) list = list.slice(0, 10);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
    }

    /**
     * 自动从当前工程中提取所有使用中的主题色彩
     * @param {Object} project 
     * @returns {Array<string>} 排序去重后的 Hex 数组
     */
    function extractProjectSwatches(project) {
        if (!project) return [];
        var colorSet = {};
        (project.lines || []).forEach(function (l) {
            if (l.color) colorSet[l.color.toUpperCase()] = true;
        });
        (project.texts || []).forEach(function (t) {
            if (t.color) colorSet[t.color.toUpperCase()] = true;
        });
        if (project.waterStyle && project.waterStyle.fill) {
            colorSet[project.waterStyle.fill.toUpperCase()] = true;
        }
        return Object.keys(colorSet);
    }

    /**
     * 渲染交互式色板网格组件
     * @param {HTMLElement} container 
     * @param {Object} project 
     * @param {Function} onSelectColor 
     */
    function renderSwatches(container, project, onSelectColor) {
        if (!container) return;
        var projColors = extractProjectSwatches(project);
        var recents = getRecentSwatches();

        var html = '<div class="swatches-widget-box">' +
            '<div class="swatches-label">当前工程色板</div>' +
            '<div class="swatches-row">';

        if (projColors.length > 0) {
            projColors.forEach(function (hex) {
                html += '<span class="swatch-color-pill" data-hex="' + hex + '" style="background:' + hex + ';" title="' + hex + '"></span>';
            });
        } else {
            html += '<span style="font-size:10px;color:var(--text-light);">（暂无色板）</span>';
        }

        html += '</div>' +
            '<div class="swatches-label" style="margin-top:6px;">标准标杆线网色谱</div>' +
            '<div class="swatches-row">';

        PRESET_SWATCHES.forEach(function (hex) {
            html += '<span class="swatch-color-pill" data-hex="' + hex + '" style="background:' + hex + ';" title="' + hex + '"></span>';
        });

        html += '</div></div>';
        container.innerHTML = html;

        container.querySelectorAll('.swatch-color-pill').forEach(function (pill) {
            pill.addEventListener('click', function () {
                var hex = this.getAttribute('data-hex');
                addRecentSwatch(hex);
                if (typeof onSelectColor === 'function') {
                    onSelectColor(hex);
                }
            });
        });
    }

    return {
        getPresetSwatches: function () { return PRESET_SWATCHES.slice(); },
        getRecentSwatches: getRecentSwatches,
        addRecentSwatch: addRecentSwatch,
        extractProjectSwatches: extractProjectSwatches,
        renderSwatches: renderSwatches
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.SwatchesPalette;
}

