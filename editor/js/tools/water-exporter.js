/**
 * 开放地图编辑器 (OpenMap Editor) - 水域资产导出器（纯函数，零依赖）
 *
 * 城市侧的水域契约沿用项目既有范式（参考青岛 `assets/qingdao_sea.svg` + `data_scattered.js`）：
 *   · 一个多边形/河道 → 一个自包含 SVG 资产文件（内部自带暗色模式样式）；
 *   · 在 data_scattered.js 里追加一条 `{ id, file, x, y, width, height, opacity, zIndex }`。
 *
 * 为什么不用「多边形直接进引擎」：main.html 对每个城市固定 document.write 一批 data_*.js，
 * 新增 data_waters.js 会让没有该文件的城市 404（铁律六要求控制台零报错）；
 * 而 SVG 资产 + scattered 条目是引擎已支持、各城市已在用的通道。
 */
window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.WaterExporter = (function () {
    'use strict';

    function r2(v) {
        return Math.round((Number(v) || 0) * 100) / 100;
    }

    function isRiver(water) {
        return !!(water && (water.type === 'path' || water.type === 'river'));
    }

    /** 计算水域包围盒（用于 SVG viewBox 与 scattered 的定位/尺寸） */
    function waterBounds(water) {
        var pts = (water && water.points) || [];
        if (!pts.length) return null;
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        pts.forEach(function (p) {
            var x = Number(p.x) || 0;
            var y = Number(p.y) || 0;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        });
        var stroke = isRiver(water) ? (Number(water.width) || 20) : 0;
        var pad = stroke / 2;
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
        return {
            minX: r2(minX),
            minY: r2(minY),
            width: Math.max(1, r2(maxX - minX)),
            height: Math.max(1, r2(maxY - minY))
        };
    }

    /**
     * 把一个水域生成为自包含 SVG 文本。
     * @param {Object} water  { id, type, points, width?, opacity?, style? }
     * @param {Object} [waterStyle] { fillLight, fillDark, opacity }
     * @returns {{ svg:string, width:number, height:number, minX:number, minY:number }|null}
     */
    function waterToSvg(water, waterStyle) {
        var bounds = waterBounds(water);
        if (!bounds) return null;
        var pts = (water && water.points) || [];
        var st = waterStyle || {};
        var style = water.style || {};
        var fillLight = style.fillLight || st.fillLight || '#a5d7e8';
        var fillDark = style.fillDark || st.fillDark || '#13354d';
        var opacity = (water.opacity != null) ? Number(water.opacity)
            : (style.opacity != null ? Number(style.opacity)
                : (st.opacity != null ? Number(st.opacity) : 0.6));

        var d = pts.map(function (p, i) {
            return (i === 0 ? 'M' : 'L') + r2((Number(p.x) || 0) - bounds.minX) + ' ' + r2((Number(p.y) || 0) - bounds.minY);
        }).join(' ');
        var river = isRiver(water);
        if (!river) d += ' Z';

        var shape;
        if (river) {
            shape = '<path class="w" d="' + d + '" fill="none" stroke-width="' + r2(Number(water.width) || 20) +
                '" stroke-linecap="round" stroke-linejoin="round" opacity="' + opacity + '"/>';
        } else {
            shape = '<path class="w" d="' + d + '" opacity="' + opacity + '"/>';
        }

        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + bounds.width + '" height="' + bounds.height +
            '" viewBox="0 0 ' + bounds.width + ' ' + bounds.height + '">' +
            '<style>' +
            '.w { fill: ' + fillLight + '; stroke: ' + fillLight + '; }' +
            '@media (prefers-color-scheme: dark) { .w { fill: ' + fillDark + '; stroke: ' + fillDark + '; } }' +
            '</style>' + shape + '</svg>';

        return {
            svg: svg,
            width: bounds.width,
            height: bounds.height,
            minX: bounds.minX,
            minY: bounds.minY
        };
    }

    /** 资产文件名（相对城市目录）：assets/{cityId}_water_{slug}.svg */
    function assetFileName(water, cityId) {
        var raw = String((water && water.id) || 'water');
        var slug = raw.replace(/[^a-zA-Z0-9_-]/g, '') || 'water';
        return 'assets/' + cityId + '_water_' + slug + '.svg';
    }

    /**
     * 生成 data_scattered.js 的条目。
     * `.scattered-item` 用 translate(-50%,-50%) 定位，所以 x/y 是**中心点**。
     */
    function scatteredEntry(water, cityId, info) {
        var slug = String((water && water.id) || 'water').replace(/[^a-zA-Z0-9_-]/g, '') || 'water';
        return {
            id: 'water-' + cityId + '-' + slug,
            file: './city/' + cityId + '/' + assetFileName(water, cityId),
            x: r2(info.minX + info.width / 2),
            y: r2(info.minY + info.height / 2),
            width: info.width,
            height: info.height,
            opacity: 1,
            zIndex: 2
        };
    }

    /**
     * 规划本次需要新增的水域资产（只挑"还没导出过"的）。
     * @param {Object} project
     * @param {string} cityId
     * @returns {{ assets:Array<{path:string,content:string}>, entries:Array<Object>, waterIds:Array<string> }}
     */
    function planWaterAssets(project, cityId) {
        var out = { assets: [], entries: [], waterIds: [] };
        if (!project || !Array.isArray(project.waters) || !project.waters.length || !cityId) return out;

        project.waters.forEach(function (water) {
            if (!water || !Array.isArray(water.points) || water.points.length < 2) return;
            if (water._exportedToCity) return;                 // 已经写回过，避免重复追加
            var info = waterToSvg(water, project.waterStyle);
            if (!info) return;
            out.assets.push({ path: assetFileName(water, cityId), content: info.svg });
            out.entries.push(scatteredEntry(water, cityId, info));
            out.waterIds.push(water.id);
        });
        return out;
    }

    return {
        waterBounds: waterBounds,
        waterToSvg: waterToSvg,
        assetFileName: assetFileName,
        scatteredEntry: scatteredEntry,
        planWaterAssets: planWaterAssets
    };
})();

window.WaterExporter = window.OpenMapEditor.WaterExporter;
