/**
 * 开放地图编辑器 (OpenMap Editor) - 车站与站名图层
 *
 * 画布上的车站与站名按 main.html 的 DOM 结构逐元素复刻：
 *   <foreignObject> 里放一块与地图同尺规的 HTML 底板（.cgo-map-replica），
 *   车站是绝对定位的 .station.{type}（translate(-50%,-50%) 居中），
 *   站名是 .label-group.type-{type} > .stacn + .staen，锚点算法与 core/script.js 完全一致。
 *
 * 之所以不再用 SVG 自绘：各城市的外观写在 city/{id}/{id}.js 的钩子和 city/{id}/style.css 里，
 * 它们针对的正是这套 DOM。结构一致之后，城市样式表、renderStationIcon、
 * decorateStationLabel 这些钩子在编辑器里原样生效（见 js/core/city-render-runtime.js），
 * 上海的短横与胶囊、悉尼的官方图元与 45° 斜排、香港 / 深圳的墨迹框排版都不必在编辑器里再写一遍。
 *
 * 编辑器自己的东西（选中光圈、临时节点 ×）仍是 SVG，叠在底板之上。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.StationLayer = (function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var XHTML_NS = 'http://www.w3.org/1999/xhtml';

    var dom = {
        stationLayer: null,
        labelLayer: null
    };

    function init(stationLayerEl, labelLayerEl) {
        dom.stationLayer = stationLayerEl;
        dom.labelLayer = labelLayerEl;
    }

    function getStationIconsEngine() {
        return window.CGoStationIcons;
    }

    function getRuntime() {
        return window.OpenMapEditor.CityRenderRuntime || null;
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /** 与 core/a11y.js 的 safeNameHtml 同义：站名里只放行 <br> / <sup> / <sub> */
    function safeNameHtml(value) {
        if (window.CGoA11y && typeof window.CGoA11y.safeNameHtml === 'function') {
            return window.CGoA11y.safeNameHtml(value);
        }
        return escapeHtml(value)
            .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
            .replace(/&lt;(\/?)(sup|sub)&gt;/gi, '<$1$2>');
    }

    /** 站名里的排版标签去掉后的纯文本（用于标题提示） */
    function plainName(value) {
        return String(value == null ? '' : value)
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * 站名锚点（逐行对齐 core/script.js renderStations）。
     * 注意缺省 align 时引擎落在「下方」分支，不是 top。
     * @returns {{ x, y, transform, textAlign, transformOriginX }}
     */
    function calculateLabelLayout(n) {
        var distV = 5.2, distH = 6, distD = 6;
        var left = n.x || 0, top = n.y || 0;
        var transform = '', textAlign = 'center', transformOriginX = '50%';
        switch (n.align) {
            case 'top': top -= distV; transform = 'translate(-50%, -100%)'; break;
            case 'bottom': top += distV; transform = 'translate(-50%, 0)'; break;
            case 'left': left -= distH; transform = 'translate(-100%, -50%)'; textAlign = 'right'; transformOriginX = '100%'; break;
            case 'right': left += distH; transform = 'translate(0, -50%)'; textAlign = 'left'; transformOriginX = '0%'; break;
            case 'top-left': left -= distD; top -= distD; transform = 'translate(-100%, -100%)'; textAlign = 'right'; transformOriginX = '100%'; break;
            case 'top-right': left += distD; top -= distD; transform = 'translate(0, -100%)'; textAlign = 'left'; transformOriginX = '0%'; break;
            case 'bottom-left': left -= distD; top += distD; transform = 'translate(-100%, 0)'; textAlign = 'right'; transformOriginX = '100%'; break;
            case 'bottom-right': left += distD; top += distD; transform = 'translate(0, 0)'; textAlign = 'left'; transformOriginX = '0%'; break;
            default: top += distV; transform = 'translate(-50%, 0)';
        }
        if (n.offset) {
            if (n.offset.x) left += n.offset.x;
            if (n.offset.y) top += n.offset.y;
        }
        return { x: left, y: top, transform: transform, textAlign: textAlign, transformOriginX: transformOriginX };
    }

    /** 保持向后兼容的偏移查询 */
    function labelOffsetFor(align) {
        var layout = calculateLabelLayout({ x: 0, y: 0, align: align });
        return { dx: layout.x, dy: layout.y, anchor: layout.textAlign === 'right' ? 'end' : (layout.textAlign === 'left' ? 'start' : 'middle') };
    }

    // ==========================================================================
    // 图元 HTML：城市钩子优先，回落 core/station-icons.js（与引擎同一分支顺序）
    // ==========================================================================

    /**
     * @param {Object} s 车站对象（type 已归一、含 lineColors）
     * @param {string} id 车站 ID
     * @returns {{ html: string, className: string, width: number|null, height: number|null, zIndex: number|undefined }}
     */
    function stationMarkup(s, id) {
        var runtime = getRuntime();
        var custom = runtime ? runtime.renderStationIcon(s, id) : null;
        if (custom && custom.html) {
            return {
                html: custom.html,
                className: custom.className || '',
                width: custom.width || null,
                height: custom.height || null,
                zIndex: custom.zIndex
            };
        }
        var icons = getStationIconsEngine();
        // 与引擎同一份模板与分支（dot / tsfo 按首条线路色上色，其余按类型，未知类型回落 dot）
        var html = (icons && typeof icons.iconHtmlFor === 'function') ? icons.iconHtmlFor(s) : '';
        return { html: html, className: '', width: null, height: null, zIndex: undefined };
    }

    /**
     * 单座车站在本城市画法下的图元（供检视面板的类型选择器做实时预览）。
     * @returns {{ html: string, width: number, height: number, className: string }}
     */
    function previewMarker(station, id) {
        var s = Object.assign({}, station);
        var m = stationMarkup(s, id || s.id || '__preview__');
        var dims = (getStationIconsEngine() && getStationIconsEngine().dimensionsFor)
            ? getStationIconsEngine().dimensionsFor(s.type) : { width: 10, height: 10 };
        return {
            html: m.html,
            className: m.className,
            width: m.width || dims.width,
            height: m.height || dims.height
        };
    }

    function escAttr(v) {
        return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * 图元小样：地图底色 + 一段线路 + 该站在当前城市画法下的图元。
     * 检视面板的类型选择器与左侧零件盒共用，城市样式表经 .cgo-map-replica / map-{city} 同样生效。
     * @param {Object} station 车站对象（含 type、lineColors，可带城市私有字段如 marker）
     * @param {Object} [opts] { angle: 线路方向（度）, id: 车站 ID }
     */
    function previewTileHtml(station, opts) {
        var o = opts || {};
        var type = station.type || 'dot';
        var colors = station.lineColors || [];
        var mk = previewMarker(station, o.id || station.id);
        var w = mk.width || 10, h = mk.height || 10;
        var scale = Math.max(0.5, Math.min(1.7, 24 / Math.max(w, h)));
        var lineColor = type === 'no' ? 'var(--not-open-color, #bdcbd2)' : (colors[0] || 'var(--station-stroke)');
        var angle = o.angle || 0;
        return '<span class="type-tile cgo-map-replica" aria-hidden="true">' +
            '<svg class="type-tile-line" viewBox="-30 -20 60 40" preserveAspectRatio="xMidYMid slice">' +
            '<line x1="-60" y1="0" x2="60" y2="0" transform="rotate(' + angle.toFixed(1) + ')"' +
            ' stroke="' + escAttr(lineColor) + '" stroke-width="' + (5.4 * scale).toFixed(2) + '" stroke-linecap="round"' +
            (type === 'no' ? ' stroke-dasharray="' + (6 * scale).toFixed(1) + ' ' + (6 * scale).toFixed(1) + '"' : '') + '/></svg>' +
            '<span class="type-tile-marker" style="transform:scale(' + scale.toFixed(3) + ') translate(-50%,-50%);">' +
            '<span class="station ' + escAttr(type) + (mk.className ? ' ' + escAttr(mk.className) : '') + '"' +
            ' style="position:relative;left:auto;top:auto;transform:none;width:' + w + 'px;height:' + h + 'px;">' +
            mk.html + '</span></span></span>';
    }

    // ==========================================================================
    // 墨迹框类站名（香港 / 深圳的 lab）：随车站一起平移
    // ==========================================================================

    /** 把 [x0, y0, x1, y1] 形式的包围盒（可嵌套）整体平移 */
    function shiftBoxes(v, dx, dy) {
        if (Array.isArray(v)) {
            if (v.length === 4 && v.every(function (n) { return typeof n === 'number'; })) {
                return [v[0] + dx, v[1] + dy, v[2] + dx, v[3] + dy];
            }
            return v.map(function (x) { return shiftBoxes(x, dx, dy); });
        }
        if (v && typeof v === 'object') {
            var out = {};
            Object.keys(v).forEach(function (k) { out[k] = shiftBoxes(v[k], dx, dy); });
            return out;
        }
        return v;
    }

    /**
     * 车站从原位被挪动后，按位移平移它的绝对排版框（lab）。
     * 导出补丁时 PipelineSurgical 用同一个函数换算，画布所见即导出所得。
     */
    function followStation(node, origin) {
        if (!node || !node.lab || !origin || !origin.lab) return node;
        var dx = (node.x || 0) - (origin.x || 0);
        var dy = (node.y || 0) - (origin.y || 0);
        if (!dx && !dy) return node;
        if (JSON.stringify(node.lab) !== JSON.stringify(origin.lab)) return node;
        return Object.assign({}, node, { lab: shiftBoxes(origin.lab, dx, dy) });
    }

    // ==========================================================================
    // 渲染
    // ==========================================================================

    function makeReplica(layerEl, cls, width, height) {
        var fo = document.createElementNS(SVG_NS, 'foreignObject');
        fo.setAttribute('x', '0');
        fo.setAttribute('y', '0');
        fo.setAttribute('width', String(width));
        fo.setAttribute('height', String(height));
        fo.setAttribute('class', 'cgo-map-replica-host');
        var root = document.createElementNS(XHTML_NS, 'div');
        root.className = 'cgo-map-replica ' + cls;
        root.style.width = width + 'px';
        root.style.height = height + 'px';
        fo.appendChild(root);
        layerEl.appendChild(fo);
        return root;
    }

    function buildLabelHtml(id, s, isSelected) {
        var layout = calculateLabelLayout(s);
        var scaleCn = (s.textScale && s.textScale.cn) || 1;
        var scaleEn = (s.textScale && s.textScale.en) || 1;
        var icons = getStationIconsEngine();
        var primary = (s.lineColors && s.lineColors.length) ? s.lineColors[0] : 'var(--station-stroke)';
        var codeBadge = (s.code && icons && icons.renderStationCodeBadge) ? icons.renderStationCodeBadge(String(s.code), primary) : '';
        var amenities = (Array.isArray(s.amenities) && icons && icons.renderAmenitiesHtml) ? icons.renderAmenitiesHtml(s.amenities) : '';
        var style = 'left:' + layout.x + 'px;top:' + layout.y + 'px;transform:' + layout.transform + ';text-align:' + layout.textAlign + ';';
        return '<div class="label-group type-' + escapeHtml(s.type) + (isSelected ? ' active' : '') + '"' +
            ' data-sid="' + escapeHtml(id) + '" data-node-id="' + escapeHtml(id) + '" style="' + style + '"' +
            ' title="' + escapeHtml(plainName(s.cn)) + '">' +
            '<span class="stacn" style="transform:scaleX(' + scaleCn + ');transform-origin:' + layout.transformOriginX + ' center;">' +
            codeBadge + safeNameHtml(s.cn) + amenities + '</span>' +
            '<span class="staen" lang="en" style="transform:scaleX(' + scaleEn + ');transform-origin:' + layout.transformOriginX + ' center;">' +
            safeNameHtml(s.en) + '</span></div>';
    }

    /**
     * 渲染车站节点与站名文字
     * @param {Object} project 工程数据模型
     * @param {Object} options { selectedNodeId, selectedNodeIds, lineColorsMap, originNodes }
     */
    function render(project, options) {
        if (!dom.stationLayer) return;
        dom.stationLayer.innerHTML = '';
        if (dom.labelLayer) dom.labelLayer.innerHTML = '';
        if (!project || !project.nodes) return;

        var opt = options || {};
        var selectedSet = new Set(opt.selectedNodeIds || []);
        if (opt.selectedNodeId) selectedSet.add(opt.selectedNodeId);
        var colorsMap = opt.lineColorsMap || {};
        var originNodes = opt.originNodes || null;
        var runtime = getRuntime();
        var icons = getStationIconsEngine();
        var canvasW = (project.canvas && project.canvas.width) || 2000;
        var canvasH = (project.canvas && project.canvas.height) || 1500;

        // 1. 归一化为引擎视角的车站对象
        var stations = {};
        var tempIds = [];
        Object.keys(project.nodes).forEach(function (id) {
            var n = project.nodes[id];
            if (!n) return;
            if (n.type === 'temp') { tempIds.push(id); return; }
            var s = Object.assign({}, n);
            s.type = n.notOpen ? 'no' : (n.type || 'dot');
            s.lineColors = (colorsMap[id] || []).slice();
            if (originNodes && originNodes[id]) s = followStation(s, originNodes[id]);
            stations[id] = s;
        });

        // 城市钩子（如上海短横按线路切线定向）读的 linesData 用当前工程的折线
        if (runtime) {
            var lineById = {};
            (project.lines || []).forEach(function (l) { lineById[l.id] = l; });
            var linesForHooks = (project.segments || []).map(function (seg) {
                var l = lineById[seg.lineId] || {};
                return { id: seg.lineId, name: l.name, color: l.color, pathPoints: seg.points || [] };
            });
            runtime.syncData(stations, linesForHooks);
        }

        // 2. 底衬（悉尼换乘站灰色胶囊等）：SVG，正片叠底压在线路之上、车站之下
        var underlays = runtime ? runtime.getStationUnderlays(stations) : [];
        if (underlays.length) {
            var ug = document.createElementNS(SVG_NS, 'g');
            ug.setAttribute('class', 'cgo-station-underlays');
            ug.setAttribute('pointer-events', 'none');
            underlays.forEach(function (u) {
                var r = document.createElementNS(SVG_NS, 'rect');
                r.setAttribute('x', String(u.cx - u.w / 2));
                r.setAttribute('y', String(u.cy - u.h / 2));
                r.setAttribute('width', String(u.w));
                r.setAttribute('height', String(u.h));
                var rad = (u.r !== undefined) ? u.r : Math.min(u.w, u.h) / 2;
                r.setAttribute('rx', String(rad));
                r.setAttribute('ry', String(rad));
                if (u.angle) r.setAttribute('transform', 'rotate(' + u.angle + ' ' + u.cx + ' ' + u.cy + ')');
                if (u.className) r.setAttribute('class', u.className);
                r.style.fill = u.fill || 'var(--station-stroke)';
                if (u.blend) r.style.mixBlendMode = u.blend;
                ug.appendChild(r);
            });
            dom.stationLayer.appendChild(ug);
        }

        // 3. 车站图元（HTML 底板，结构同 main.html #stations-layer）
        var stationRoot = makeReplica(dom.stationLayer, 'cgo-replica-stations', canvasW, canvasH);
        var parts = [];
        var marks = {};
        Object.keys(stations).forEach(function (id) {
            var s = stations[id];
            var m = stationMarkup(s, id);
            marks[id] = m;
            var style = 'left:' + s.x + 'px;top:' + s.y + 'px;';
            if (m.width) style += 'width:' + m.width + 'px;';
            if (m.height) style += 'height:' + m.height + 'px;';
            if (m.zIndex !== undefined) style += 'z-index:' + m.zIndex + ';';
            parts.push('<div class="station ' + escapeHtml(s.type) + (m.className ? ' ' + escapeHtml(m.className) : '') +
                (selectedSet.has(id) ? ' is-selected' : '') + '" data-sid="' + escapeHtml(id) + '" data-node-id="' + escapeHtml(id) +
                '" style="' + style + '">' + m.html + '</div>');
        });
        stationRoot.innerHTML = parts.join('');

        // 4. 站名（HTML 底板，结构同 main.html #labels-layer），再交给城市钩子二次排版
        var labelHost = dom.labelLayer || dom.stationLayer;
        var labelRoot = makeReplica(labelHost, 'cgo-replica-labels', canvasW, canvasH);
        var labelParts = [];
        Object.keys(stations).forEach(function (id) {
            var s = stations[id];
            if (s.hideLabel === true) return;
            if (!s.cn && !s.en) return;
            labelParts.push(buildLabelHtml(id, s, selectedSet.has(id)));
        });
        labelRoot.innerHTML = labelParts.join('');
        if (runtime && runtime.getCity()) {
            var labels = labelRoot.children;
            for (var li = 0; li < labels.length; li++) {
                var el = labels[li];
                var sid = el.getAttribute('data-sid');
                if (stations[sid]) runtime.decorateStationLabel(el, stations[sid], sid);
            }
        }

        // 5. 编辑器自己的叠加物：选中光圈、临时节点
        var overlay = document.createElementNS(SVG_NS, 'g');
        overlay.setAttribute('class', 'cgo-station-editor-overlay');
        selectedSet.forEach(function (id) {
            var s = stations[id];
            if (!s) return;
            var m = marks[id] || {};
            var dims = (icons && icons.dimensionsFor) ? icons.dimensionsFor(s.type) : { width: 10, height: 10 };
            var w = m.width || dims.width || 10;
            var h = m.height || dims.height || 10;
            var halo = document.createElementNS(SVG_NS, 'rect');
            var pad = 3.5;
            halo.setAttribute('x', String(s.x - w / 2 - pad));
            halo.setAttribute('y', String(s.y - h / 2 - pad));
            halo.setAttribute('width', String(w + pad * 2));
            halo.setAttribute('height', String(h + pad * 2));
            var rr = Math.min(w, h) / 2 + pad;
            halo.setAttribute('rx', String(rr));
            halo.setAttribute('ry', String(rr));
            halo.setAttribute('class', 'cgo-station-selection-halo');
            halo.setAttribute('pointer-events', 'none');
            overlay.appendChild(halo);
        });
        tempIds.forEach(function (id) {
            var n = project.nodes[id];
            var sel = selectedSet.has(id);
            var g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('data-node-id', id);
            g.style.cursor = 'pointer';
            [[-4, -4, 4, 4], [-4, 4, 4, -4]].forEach(function (d) {
                var l = document.createElementNS(SVG_NS, 'line');
                l.setAttribute('x1', String(n.x + d[0])); l.setAttribute('y1', String(n.y + d[1]));
                l.setAttribute('x2', String(n.x + d[2])); l.setAttribute('y2', String(n.y + d[3]));
                l.setAttribute('stroke', sel ? '#38bdf8' : '#64748b');
                l.setAttribute('stroke-width', '2');
                g.appendChild(l);
            });
            // 透明热区：× 的线条太细，点不中
            var hit = document.createElementNS(SVG_NS, 'circle');
            hit.setAttribute('cx', String(n.x)); hit.setAttribute('cy', String(n.y)); hit.setAttribute('r', '6');
            hit.setAttribute('fill', 'transparent');
            g.appendChild(hit);
            overlay.appendChild(g);
        });
        dom.stationLayer.appendChild(overlay);
    }

    return {
        init: init,
        render: render,
        calculateLabelLayout: calculateLabelLayout,
        labelOffsetFor: labelOffsetFor,
        previewMarker: previewMarker,
        previewTileHtml: previewTileHtml,
        followStation: followStation,
        shiftBoxes: shiftBoxes,
        getStationIconsEngine: getStationIconsEngine
    };
})();

// 保留全局别名兼容
window.StationLayer = window.OpenMapEditor.StationLayer;
