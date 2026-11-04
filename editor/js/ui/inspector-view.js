/**
 * 开放地图编辑器 (OpenMap Editor) - 右侧属性检视面板与 8 方向文字轮盘
 * 整合 8 方向文字避让轮盘、拐角圆角微调滑块与图元属性编辑表单
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.InspectorView = (function () {
    'use strict';

    var dom = {
        panel: null,
        body: null
    };

    var onPropertyChangeCallback = null;

    var ALIGN_SECTORS = [
        { id: 'top-left', rot: -45, label: '↖', title: '左上 (NW)' },
        { id: 'top', rot: 0, label: '↑', title: '正上 (N)' },
        { id: 'top-right', rot: 45, label: '↗', title: '右上 (NE)' },
        { id: 'left', rot: -90, label: '←', title: '正左 (W)' },
        { id: 'center', rot: 0, label: '•', title: '居中' },
        { id: 'right', rot: 90, label: '→', title: '正右 (E)' },
        { id: 'bottom-left', rot: -135, label: '↙', title: '左下 (SW)' },
        { id: 'bottom', rot: 180, label: '↓', title: '正下 (S)' },
        { id: 'bottom-right', rot: 135, label: '↘', title: '右下 (SE)' }
    ];

    function init(panelEl, bodyEl, onChange) {
        dom.panel = panelEl;
        dom.body = bodyEl;
        onPropertyChangeCallback = onChange;
    }

    function fireChange(targetType, targetId, prop, value) {
        if (typeof onPropertyChangeCallback === 'function') {
            onPropertyChangeCallback(targetType, targetId, prop, value);
        }
    }

    /**
     * 渲染 8 方向锚点轮盘 HTML
     */
    function renderAlignWheelHtml(currentAlign) {
        var align = currentAlign || 'bottom';   // 与引擎一致：缺省 align 时站名在下方
        var html = '<div class="cgo-align-wheel-container">' +
            '<div class="cgo-align-wheel-label">站名 8 方向避让锚点</div>' +
            '<div class="cgo-align-wheel" id="inspectorAlignWheel">';

        ALIGN_SECTORS.forEach(function (sec) {
            var isActive = (sec.id === align);
            if (sec.id === 'center') {
                html += '<div style="display:flex;align-items:center;justify-content:center;"><div class="wheel-center-dot"></div></div>';
            } else {
                html += '<button type="button" class="wheel-sector-btn' + (isActive ? ' active' : '') +
                    '" data-align="' + sec.id + '" title="' + sec.title + '">' +
                    '<cgo-icon name="arrow-up" size="13" style="transform: rotate(' + sec.rot + 'deg);"></cgo-icon>' +
                    '</button>';
            }
        });

        html += '</div></div>';
        return html;
    }


    // ==========================================================================
    // 车站样式选择器（js/core/station-style-catalog.js 统一提供选项）
    //   当前样式 / 恢复载入时的样式 / 为本站生成 / 本城市现有样式 / 通用图元
    // 每个选项都是一组外观字段（type + marker / mk / halo…），预览按当前城市画法实时生成。
    // ==========================================================================

    var typePickerState = { node: null, project: null, outsideHandler: null, options: {} };

    function escAttr(v) {
        return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function catalog() {
        return window.OpenMapEditor.StationStyleCatalog;
    }

    function runtime() {
        return window.OpenMapEditor.CityRenderRuntime;
    }

    /** 预览用的线路方向：取该站所在折线上相邻折点的方向 */
    function previewLineAngle(node, project) {
        var segs = (project && project.segments) || [];
        for (var i = 0; i < segs.length; i++) {
            var pts = segs[i].points || [];
            for (var j = 0; j < pts.length; j++) {
                if (pts[j].nid !== node.id) continue;
                var nb = pts[j + 1] || pts[j - 1];
                if (!nb) continue;
                var dx = nb.x - node.x, dy = nb.y - node.y;
                if (Math.abs(dx) + Math.abs(dy) < 0.01) continue;
                return Math.atan2(dy, dx) * 180 / Math.PI;
            }
        }
        return 0;
    }

    function previewLineColor(node, project) {
        var icons = window.CGoStationIcons;
        if (icons && typeof icons.engineLineColors === 'function') {
            var map = icons.engineLineColors((project && project.lines) || []);
            if (map[node.id] && map[node.id].length) return map[node.id].slice();
        }
        var segs = (project && project.segments) || [];
        var lineColor = {};
        ((project && project.lines) || []).forEach(function (l) { lineColor[l.id] = l.color; });
        for (var i = 0; i < segs.length; i++) {
            if ((segs[i].points || []).some(function (p) { return p.nid === node.id; }) && lineColor[segs[i].lineId]) {
                return [lineColor[segs[i].lineId]];
            }
        }
        return [];
    }

    /** 某个外观补丁套到本站后的小样 */
    function patchTileHtml(node, project, patch) {
        var layer = window.OpenMapEditor.StationLayer;
        var cat = catalog();
        if (!layer || typeof layer.previewTileHtml !== 'function' || !cat) return '';
        var station = cat.applyPatch(node, patch || {});
        station.type = cat.typeOf(station);
        station.lineColors = previewLineColor(node, project);
        return layer.previewTileHtml(station, { angle: previewLineAngle(node, project), id: node.id });
    }

    function originNodeOf(node) {
        var surg = window.OpenMapEditor.PipelineSurgical;
        var snap = surg && typeof surg.getOriginalSnapshot === 'function' ? surg.getOriginalSnapshot() : null;
        return (snap && snap.nodes && snap.nodes[node.id]) || null;
    }

    function styleGroups(node, project) {
        var cat = catalog();
        if (!cat) return [];
        var rt = runtime();
        var city = rt && rt.getCity ? rt.getCity() : null;
        var cityOptions = [];
        if (rt && typeof rt.getStationStyleOptions === 'function') {
            var colors = previewLineColor(node, project);
            cityOptions = rt.getStationStyleOptions(Object.assign({}, node, { lineColors: colors }), node.id);
        }
        return cat.optionsFor({ node: node, project: project, origin: originNodeOf(node), city: city, cityOptions: cityOptions });
    }

    function renderTypePickerHtml(node, project) {
        var cat = catalog();
        var d = cat ? cat.describe(node) : { name: node.type, detail: '' };
        var cur = cat ? cat.typeOf(node) : (node.type || 'dot');
        return '<div class="cgo-type-picker" id="propNodeTypePicker" data-current="' + escAttr(cur) + '">' +
            '<button type="button" class="type-picker-trigger" id="propNodeTypeTrigger" aria-haspopup="listbox" aria-expanded="false"' +
            ' title="选择车站样式（预览按当前城市画法实时生成）">' +
            '<span class="type-tile-slot" data-style-key="current">' + patchTileHtml(node, project, {}) + '</span>' +
            '<span class="type-picker-text"><span class="type-picker-name">' + escAttr(d.name) + '</span>' +
            '<span class="type-picker-code">' + escAttr(cur + (d.detail ? ' · ' + d.detail : '')) + '</span></span>' +
            '<cgo-icon name="chevron-down" size="13" class="type-picker-caret"></cgo-icon>' +
            '</button></div>';
    }

    function renderTypeMenuHtml(node, project) {
        var groups = styleGroups(node, project);
        typePickerState.options = {};
        var rt = runtime();
        var cityId = rt && rt.getActiveCityId ? rt.getActiveCityId() : null;
        var cityName = (cityId && window.CITY_REGISTRY && window.CITY_REGISTRY[cityId]) ? (window.CITY_REGISTRY[cityId].name || cityId) : '';
        var html = '<div class="type-picker-menu" role="listbox" aria-label="车站样式">' +
            '<div class="type-picker-hint">' + (cityName
                ? '预览按「' + escAttr(cityName) + '」线路图的实际画法生成，所有选项都可随时切回'
                : '预览按通用画法生成') + '</div>';
        groups.forEach(function (g) {
            html += '<div class="type-picker-group">' + escAttr(g.title) + '</div>';
            g.items.forEach(function (it) {
                typePickerState.options[it.key] = it;
                var count = it.count ? '<span class="type-option-count">' + it.count + ' 座</span>' : '';
                html += '<button type="button" class="type-option' + (it.current ? ' is-current' : '') +
                    (g.group === 'original' ? ' is-restore' : '') + '" role="option"' +
                    ' aria-selected="' + (it.current ? 'true' : 'false') + '" data-style-key="' + escAttr(it.key) + '">' +
                    '<span class="type-tile-slot" data-style-key="' + escAttr(it.key) + '">' + patchTileHtml(node, project, it.patch) + '</span>' +
                    '<span class="type-option-text"><span class="type-option-name">' +
                    (g.group === 'original' ? '<cgo-icon name="undo" size="11"></cgo-icon>' : '') +
                    escAttr(it.name) + count + '</span>' +
                    '<span class="type-option-desc">' + escAttr(it.detail || '') + '</span></span>' +
                    (it.current ? '<cgo-icon name="check" size="13" class="type-option-check"></cgo-icon>' : '') +
                    '</button>';
            });
        });
        html += '</div>';
        return html;
    }

    function closeTypeMenu() {
        var picker = document.getElementById('propNodeTypePicker');
        if (picker) {
            var menu = picker.querySelector('.type-picker-menu');
            if (menu) menu.remove();
            picker.classList.remove('open');
            var trig = picker.querySelector('.type-picker-trigger');
            if (trig) trig.setAttribute('aria-expanded', 'false');
        }
        if (typePickerState.outsideHandler) {
            document.removeEventListener('mousedown', typePickerState.outsideHandler, true);
            typePickerState.outsideHandler = null;
        }
    }

    function openTypeMenu(node, project) {
        var picker = document.getElementById('propNodeTypePicker');
        if (!picker) return;
        closeTypeMenu();
        picker.insertAdjacentHTML('beforeend', renderTypeMenuHtml(node, project));
        picker.classList.add('open');
        var trig = picker.querySelector('.type-picker-trigger');
        if (trig) trig.setAttribute('aria-expanded', 'true');
        var menu = picker.querySelector('.type-picker-menu');
        var options = Array.prototype.slice.call(menu.querySelectorAll('.type-option'));
        var focusAt = function (i) {
            if (!options.length) return;
            options[(i + options.length) % options.length].focus();
        };
        options.forEach(function (btn, i) {
            btn.addEventListener('click', function () {
                var it = typePickerState.options[btn.getAttribute('data-style-key')];
                closeTypeMenu();
                if (it && !it.current) fireChange('node', node.id, 'appearance', it.patch);
            });
            btn.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowDown') { e.preventDefault(); focusAt(i + 1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); focusAt(i - 1); }
                else if (e.key === 'Home') { e.preventDefault(); focusAt(0); }
                else if (e.key === 'End') { e.preventDefault(); focusAt(options.length - 1); }
                else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeTypeMenu(); if (trig) trig.focus(); }
                else if (e.key === 'Tab') { closeTypeMenu(); }
            });
        });
        var curIdx = options.findIndex(function (b) { return b.classList.contains('is-current'); });
        focusAt(curIdx >= 0 ? curIdx : 0);
        if (menu.scrollIntoView) menu.scrollIntoView({ block: 'nearest' });
        typePickerState.outsideHandler = function (e) {
            if (!picker.contains(e.target)) closeTypeMenu();
        };
        document.addEventListener('mousedown', typePickerState.outsideHandler, true);
    }

    function bindTypePicker(node) {
        typePickerState.node = node;
        var trig = document.getElementById('propNodeTypeTrigger');
        if (!trig) return;
        trig.addEventListener('click', function () {
            var picker = document.getElementById('propNodeTypePicker');
            if (picker && picker.classList.contains('open')) closeTypeMenu();
            else openTypeMenu(node, typePickerState.project);
        });
        trig.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                openTypeMenu(node, typePickerState.project);
            }
        });
    }

    /** 城市渲染钩子异步就绪 / 主题切换后，重画检视面板里的图元小样 */
    function refreshPreviews() {
        var node = typePickerState.node, project = typePickerState.project;
        var picker = document.getElementById('propNodeTypePicker');
        if (!picker || !node || !project) return;
        picker.querySelectorAll('[data-style-key]').forEach(function (slot) {
            if (!slot.classList.contains('type-tile-slot')) return;
            var key = slot.getAttribute('data-style-key');
            var it = key === 'current' ? { patch: {} } : typePickerState.options[key];
            if (it) slot.innerHTML = patchTileHtml(node, project, it.patch);
        });
    }

    /**
     * 渲染车站节点属性
     */
    function renderNodeInspector(node, project) {
        if (!dom.body) return;
        closeTypeMenu();
        typePickerState.project = project;
        typePickerState.node = node;
        var isStation = (node.type !== 'temp');

        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title">' +
            '<span>' + (isStation ? '车站属性' : '辅助临时节点') + '</span>' +
            '<cgo-badge variant="info">' + node.id + '</cgo-badge>' +
            '</div>';

        if (isStation) {
            html += '<div class="form-row">' +
                '<span class="form-label">中文站名:</span>' +
                '<input type="text" class="form-input" id="propNodeCn" value="' + escAttr(node.cn || '') + '">' +
                '</div>' +
                '<div class="form-row">' +
                '<span class="form-label">英文站名:</span>' +
                '<input type="text" class="form-input" id="propNodeEn" value="' + escAttr(node.en || '') + '">' +
                '</div>' +
                '<div class="form-row">' +
                '<span class="form-label">车站编号:</span>' +
                '<input type="text" class="form-input" id="propNodeCode" placeholder="如 01, M05, A12" value="' + escAttr(node.code || '') + '">' +
                '</div>' +
                '<div class="form-row">' +
                '<span class="form-label">图元类型:</span>' +
                renderTypePickerHtml(node, project) +
                '</div>';

            // 综合交通设施挂载徽标
            var curAmenities = Array.isArray(node.amenities) ? node.amenities : [];
            var amenityKeys = ['airport', 'crh', 'railway', 'ferry', 'maglev', 'tram', 'pr', 'accessible'];
            var amenityLabels = {
                airport: '民航机场',
                crh: '高速铁路',
                railway: '国家铁路',
                ferry: '客运码头',
                maglev: '磁悬浮',
                tram: '有轨电车',
                pr: 'P+R停车',
                accessible: '无障碍设施'
            };
            var amenityIcons = {
                airport: 'plane',
                crh: 'crh',
                railway: 'railway',
                ferry: 'ferry',
                maglev: 'monorail',
                tram: 'tram',
                pr: 'pr',
                accessible: 'elevator'
            };

            html += '<div style="margin: 8px 0; padding: 6px 0; border-top: 1px dashed var(--border-color,#e2e8f0); border-bottom: 1px dashed var(--border-color,#e2e8f0);">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<span style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;">' +
                '<cgo-icon name="map" size="12"></cgo-icon><span>交通设施徽标挂载</span>' +
                '</span>' +
                '<span style="font-size:10px;color:var(--text-light);">' + curAmenities.length + ' 项已激活</span>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;">';

            amenityKeys.forEach(function (key) {
                var isActive = curAmenities.indexOf(key) !== -1;
                html += '<button type="button" class="amenity-chip-btn' + (isActive ? ' active' : '') + '" data-amenity="' + key + '" title="' + amenityLabels[key] + '" style="display:flex;align-items:center;gap:4px;padding:4px 6px;font-size:11px;border-radius:4px;border:1px solid ' + (isActive ? 'var(--theme-accent, #0284c7)' : 'var(--border-light, rgba(0,0,0,0.1))') + ';background:' + (isActive ? 'var(--theme-subtle, rgba(2,132,199,0.12))' : 'var(--bg-subtle, transparent)') + ';color:' + (isActive ? 'var(--theme-accent, #0284c7)' : 'var(--text-color, #334155)') + ';cursor:pointer;transition:all 0.15s;">' +
                    ((window.CGoStationIcons && window.CGoStationIcons.AMENITY_ICONS && window.CGoStationIcons.AMENITY_ICONS[key])
                        ? '<span class="amenity-glyph" aria-hidden="true">' + window.CGoStationIcons.AMENITY_ICONS[key] + '</span>'
                        : '<cgo-icon name="' + amenityIcons[key] + '" size="12"></cgo-icon>') +
                    '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + amenityLabels[key] + '</span>' +
                    '</button>';
            });

            html += '</div></div>';

            // 嵌入 8 方向轮盘
            html += renderAlignWheelHtml(node.align);

            // 偏移微调
            html += '<div class="form-row">' +
                '<span class="form-label">位置偏移:</span>' +
                '<div style="display:flex;gap:4px;flex:1;">' +
                '<input type="number" class="form-input" id="propNodeOffsetX" placeholder="dX" value="' + ((node.offset && node.offset.x) || 0) + '">' +
                '<input type="number" class="form-input" id="propNodeOffsetY" placeholder="dY" value="' + ((node.offset && node.offset.y) || 0) + '">' +
                '</div></div>';

            // 文字压缩率 textScale
            var scaleCn = (node.textScale && node.textScale.cn) ? node.textScale.cn : 1;
            var scaleEn = (node.textScale && node.textScale.en) ? node.textScale.en : 1;
            html += '<div class="form-row">' +
                '<span class="form-label">文字拉伸:</span>' +
                '<div style="display:flex;gap:4px;flex:1;">' +
                '<input type="number" step="0.05" min="0.5" max="2" class="form-input" id="propNodeScaleCn" placeholder="中文" value="' + scaleCn + '" title="中文 X 轴缩放比例 (默认 1)">' +
                '<input type="number" step="0.05" min="0.5" max="2" class="form-input" id="propNodeScaleEn" placeholder="英文" value="' + scaleEn + '" title="英文 X 轴缩放比例 (默认 1)">' +
                '</div></div>';

            // 隐藏站名文字 hideLabel 开关
            html += '<div class="form-row" style="margin-top:2px;">' +
                '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;user-select:none;">' +
                '<input type="checkbox" id="propNodeHideLabel"' + (node.hideLabel ? ' checked' : '') + '> ' +
                '<span>隐藏站名标注 (hideLabel)</span>' +
                '</label></div>';

            // 收集此车站所属线路及站序
            var memberLines = [];
            var lines = project ? (project.lines || []) : [];
            lines.forEach(function (line) {
                var groups = [];
                if (Array.isArray(line.stationIds)) {
                    groups.push({ key: 'stationIds', label: line.hasbranch ? '主线' : '全线', ids: line.stationIds });
                }
                Object.keys(line).forEach(function (k) {
                    if (/^stationIds-/.test(k) && Array.isArray(line[k])) {
                        groups.push({ key: k, label: k.replace('stationIds-', ''), ids: line[k] });
                    }
                });
                groups.forEach(function (g) {
                    var idx = g.ids.indexOf(node.id);
                    if (idx !== -1) {
                        memberLines.push({
                            line: line,
                            groupKey: g.key,
                            groupLabel: g.label,
                            index: idx,
                            total: g.ids.length
                        });
                    }
                });
            });

            // 渲染「线路归属与站序」模块
            html += '<div class="inspector-topology-section" style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-color,#e2e8f0);">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                '<span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;">' +
                '<cgo-icon name="route" size="13"></cgo-icon><span>线路归属与站序</span>' +
                '</span>' +
                '<cgo-badge variant="neutral" style="font-size:10px;">' + memberLines.length + ' 条线</cgo-badge>' +
                '</div>';

            if (memberLines.length > 0) {
                memberLines.forEach(function (m) {
                    var line = m.line;
                    var branchTag = m.groupKey !== 'stationIds' ? ' <span class="cgo-badge" style="font-size:9px;padding:1px 4px;margin-left:2px;">' + m.groupLabel + '</span>' : '';
                    html += '<div class="inspector-line-item" style="background:var(--bg-subtle, rgba(0,0,0,0.03));border:1px solid var(--border-light, rgba(0,0,0,0.06));border-radius:6px;padding:6px 8px;margin-bottom:6px;">' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                        '<div style="display:flex;align-items:center;gap:6px;overflow:hidden;flex:1;min-width:0;">' +
                        '<span style="width:8px;height:8px;border-radius:50%;background:' + (line.color || '#0284c7') + ';flex-shrink:0;"></span>' +
                        '<span style="font-weight:600;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (line.name || line.id) + '</span>' +
                        branchTag +
                        '</div>' +
                        '<span style="font-size:10px;color:var(--text-light);flex-shrink:0;">第 ' + (m.index + 1) + ' / ' + m.total + ' 站</span>' +
                        '</div>' +
                        '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                        '<button type="button" class="ribbon-btn-sm btn-sta-order-up" data-line-id="' + line.id + '" data-group-key="' + m.groupKey + '" title="在站序中上移一位"' + (m.index === 0 ? ' disabled' : '') + '>' +
                        '<cgo-icon name="arrow-up" size="10"></cgo-icon><span>上移</span></button>' +
                        '<button type="button" class="ribbon-btn-sm btn-sta-order-down" data-line-id="' + line.id + '" data-group-key="' + m.groupKey + '" title="在站序中下移一位"' + (m.index === m.total - 1 ? ' disabled' : '') + '>' +
                        '<cgo-icon name="arrow-down" size="10"></cgo-icon><span>下移</span></button>' +
                        '<button type="button" class="ribbon-btn-sm danger btn-sta-line-remove" data-line-id="' + line.id + '" data-group-key="' + m.groupKey + '" title="将此站移出该线路">' +
                        '<cgo-icon name="close" size="10"></cgo-icon><span>移出</span></button>' +
                        '</div></div>';
                });
            } else {
                html += '<div style="font-size:11px;color:var(--text-light);padding:6px 0 8px 0;text-align:center;">此站暂未归属任何线路</div>';
            }

            // 加入新线路快速选择行
            var candidateLines = lines.filter(function (l) {
                return !memberLines.some(function (m) { return m.line.id === l.id; });
            });
            html += '<div class="form-row" style="margin-top:6px;gap:4px;">' +
                '<select class="form-select" id="selAddLineToStation" style="flex:1;font-size:11px;">' +
                '<option value="">-- 加入线路 --</option>';
            candidateLines.forEach(function (l) {
                html += '<option value="' + l.id + '">' + (l.name || l.id) + '</option>';
            });
            html += '</select>' +
                '<button type="button" class="ribbon-btn-sm" id="btnAddStationToLine">' +
                '<cgo-icon name="add" size="11"></cgo-icon><span>加入</span></button>' +
                '</div></div>';
        }

        html += '<div class="form-row" style="margin-top:10px;">' +
            '<span class="form-label">坐标位置:</span>' +
            '<div style="display:flex;gap:4px;flex:1;">' +
            '<input type="number" class="form-input" id="propNodeX" value="' + Math.round(node.x) + '">' +
            '<input type="number" class="form-input" id="propNodeY" value="' + Math.round(node.y) + '">' +
            '</div></div>';

        html += '<button type="button" class="ribbon-btn-sm danger" id="btnDeleteSelected" style="margin-top:10px;">' +
            '<cgo-icon name="delete" size="12"></cgo-icon><span>删除此图元</span></button>' +
            '</div>';

        dom.body.innerHTML = html;

        // 绑定事件
        bindNodeEvents(node);
    }

    function bindNodeEvents(node) {
        var cnInput = document.getElementById('propNodeCn');
        if (cnInput) cnInput.addEventListener('change', function () { fireChange('node', node.id, 'cn', this.value); });

        var enInput = document.getElementById('propNodeEn');
        if (enInput) enInput.addEventListener('change', function () { fireChange('node', node.id, 'en', this.value); });

        var codeInput = document.getElementById('propNodeCode');
        if (codeInput) codeInput.addEventListener('change', function () { fireChange('node', node.id, 'code', this.value.trim() || null); });

        // 绑定交通设施徽标挂载点击
        document.querySelectorAll('.amenity-chip-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var key = this.getAttribute('data-amenity');
                var list = Array.isArray(node.amenities) ? node.amenities.slice() : [];
                var idx = list.indexOf(key);
                if (idx === -1) {
                    list.push(key);
                } else {
                    list.splice(idx, 1);
                }
                fireChange('node', node.id, 'amenities', list.length > 0 ? list : null);
            });
        });

        bindTypePicker(node);

        var oxInput = document.getElementById('propNodeOffsetX');
        var oyInput = document.getElementById('propNodeOffsetY');
        if (oxInput && oyInput) {
            var handleOffset = function () {
                fireChange('node', node.id, 'offset', { x: parseFloat(oxInput.value) || 0, y: parseFloat(oyInput.value) || 0 });
            };
            oxInput.addEventListener('change', handleOffset);
            oyInput.addEventListener('change', handleOffset);
        }

        var scInput = document.getElementById('propNodeScaleCn');
        var seInput = document.getElementById('propNodeScaleEn');
        if (scInput && seInput) {
            var handleScale = function () {
                var c = parseFloat(scInput.value) || 1;
                var e = parseFloat(seInput.value) || 1;
                fireChange('node', node.id, 'textScale', (c === 1 && e === 1) ? null : { cn: c, en: e });
            };
            scInput.addEventListener('change', handleScale);
            seInput.addEventListener('change', handleScale);
        }

        var hideInput = document.getElementById('propNodeHideLabel');
        if (hideInput) {
            hideInput.addEventListener('change', function () {
                fireChange('node', node.id, 'hideLabel', this.checked);
            });
        }

        var xInput = document.getElementById('propNodeX');
        var yInput = document.getElementById('propNodeY');
        if (xInput && yInput) {
            var handlePos = function () {
                fireChange('node', node.id, 'position', { x: parseFloat(xInput.value) || 0, y: parseFloat(yInput.value) || 0 });
            };
            xInput.addEventListener('change', handlePos);
            yInput.addEventListener('change', handlePos);
        }

        // 绑定 8 方向轮盘扇区点击
        var wheel = document.getElementById('inspectorAlignWheel');
        if (wheel) {
            wheel.addEventListener('click', function (e) {
                var btn = e.target.closest('.wheel-sector-btn');
                if (!btn) return;
                var targetAlign = btn.getAttribute('data-tab') || btn.getAttribute('data-align');
                if (targetAlign) {
                    wheel.querySelectorAll('.wheel-sector-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    fireChange('node', node.id, 'align', targetAlign);
                }
            });
        }

        // 绑定线路站序微调与归属控制
        document.querySelectorAll('.btn-sta-order-up').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var lid = this.getAttribute('data-line-id');
                var gk = this.getAttribute('data-group-key');
                fireChange('node', node.id, 'reorder_line_station', { lineId: lid, groupKey: gk, direction: -1 });
            });
        });

        document.querySelectorAll('.btn-sta-order-down').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var lid = this.getAttribute('data-line-id');
                var gk = this.getAttribute('data-group-key');
                fireChange('node', node.id, 'reorder_line_station', { lineId: lid, groupKey: gk, direction: 1 });
            });
        });

        document.querySelectorAll('.btn-sta-line-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var lid = this.getAttribute('data-line-id');
                var gk = this.getAttribute('data-group-key');
                fireChange('node', node.id, 'remove_from_line', { lineId: lid, groupKey: gk });
            });
        });

        var addBtn = document.getElementById('btnAddStationToLine');
        var addSel = document.getElementById('selAddLineToStation');
        if (addBtn && addSel) {
            addBtn.addEventListener('click', function () {
                var lid = addSel.value;
                if (!lid) return;
                fireChange('node', node.id, 'add_to_line', { lineId: lid });
            });
        }

        var delBtn = document.getElementById('btnDeleteSelected');
        if (delBtn) delBtn.addEventListener('click', function () { fireChange('node', node.id, 'delete', true); });
    }

    /**
     * 渲染线段属性检视
     */
    function renderSegmentInspector(segment, project, opts) {
        if (!dom.body) return;

        var opt = opts || {};
        var selPtIdx = (opt.selectedPointIdx !== undefined && opt.selectedPointIdx !== null) ? Number(opt.selectedPointIdx) : -1;
        var pts = segment.points || [];
        var activePoint = (selPtIdx >= 0 && selPtIdx < pts.length) ? pts[selPtIdx] : null;

        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title">' +
            '<span>折线线段属性</span>' +
            '<span class="cgo-badge">' + segment.id + '</span>' +
            (segment.branchKey ? ' <span class="cgo-badge" style="background:var(--cgo-primary-subtle);color:var(--cgo-primary);font-size:10px;">' + segment.branchKey + '</span>' : '') +
            '</div>' +
            '<div class="form-row">' +
            '<span class="form-label">所属线路:</span>' +
            '<select class="form-select" id="propSegLine">';

        (project.lines || []).forEach(function (l) {
            html += '<option value="' + l.id + '"' + (l.id === segment.lineId ? ' selected' : '') + '>' + (l.name || l.id) + '</option>';
        });

        html += '</select>' +
            (segment.lineId
                ? '<button type="button" class="ribbon-btn-sm" id="btnEditSegLine" style="flex:0 0 auto;margin-left:4px;"' +
                  ' title="打开所属线路的属性面板（线路名称 / 标志色 / 运营公司）">' +
                  '<cgo-icon name="edit" size="12"></cgo-icon><span>编辑线路</span></button>'
                : '') +
            '</div>' +
            '<div class="form-row">' +
            '<span class="form-label">走线类型:</span>' +
            '<select class="form-select" id="propSegType">' +
            '<option value="seg135"' + (segment.type === 'seg135' ? ' selected' : '') + '>135° 正交折角</option>' +
            '<option value="seg90"' + (segment.type === 'seg90' ? ' selected' : '') + '>90° 直角走线</option>' +
            '<option value="seg90d"' + (segment.type === 'seg90d' ? ' selected' : '') + '>斜 90° 折角</option>' +
            '<option value="segratio"' + (segment.type === 'segratio' ? ' selected' : '') + '>比例斜率走线</option>' +
            '<option value="segaxis"' + (segment.type === 'segaxis' ? ' selected' : '') + '>自由直线</option>' +
            '</select></div>' +
            '<div class="form-row">' +
            '<span class="form-label">在建/规划:</span>' +
            '<label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;">' +
            '<input type="checkbox" id="propSegNotOpen"' + (segment.notOpen ? ' checked' : '') + '> 标记为未开通虚线' +
            '</label></div>' +
            '<div class="form-row" style="margin-top:6px;">' +
            '<button type="button" class="ribbon-btn-sm" id="btnInspectorFlipCorner" style="flex:1;">' +
            '<cgo-icon name="flip-h" size="12"></cgo-icon><span>翻转折角方向</span></button>' +
            '</div>';

        // 拐角半径微调模块 (Corner Radius)
        if (activePoint) {
            // 当前选中的特定折点
            var curR = activePoint.r !== undefined ? activePoint.r : 18;
            html += '<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-color,#e2e8f0);">' +
                '<div style="font-weight:600;font-size:12px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
                '<span>折点控制 #' + selPtIdx + '</span>' +
                '<span class="cgo-badge" style="font-size:10px;">' + (activePoint.nid ? ('车站: ' + activePoint.nid) : '拐角点') + '</span>' +
                '</div>' +
                '<div class="form-row">' +
                '<span class="form-label">折点坐标:</span>' +
                '<div style="display:flex;gap:4px;flex:1;">' +
                '<input type="number" class="form-input" id="propPointX" value="' + Math.round(activePoint.x) + '">' +
                '<input type="number" class="form-input" id="propPointY" value="' + Math.round(activePoint.y) + '">' +
                '</div></div>' +
                '<div class="form-row" style="margin-top:6px;">' +
                '<span class="form-label">拐角半径:</span>' +
                '<div style="display:flex;gap:4px;flex:1;">' +
                '<button type="button" class="ribbon-btn-sm btn-radius-preset" data-r="0" title="严格直角 (0px)">直角 0</button>' +
                '<button type="button" class="ribbon-btn-sm btn-radius-preset" data-r="8" title="紧凑小圆角 (8px)">紧凑 8</button>' +
                '<button type="button" class="ribbon-btn-sm btn-radius-preset" data-r="18" title="标准大圆角 (18px)">标准 18</button>' +
                '</div></div>' +
                '<div class="form-row" style="margin-top:4px;align-items:center;">' +
                '<span class="form-label">半径滑块:</span>' +
                '<input type="range" min="0" max="40" step="1" id="propCornerRadiusSlider" value="' + curR + '" style="flex:1;">' +
                '<span id="propCornerRadiusVal" style="font-size:11px;min-width:32px;text-align:right;">' + curR + 'px</span>' +
                '</div>';

            if (!activePoint.nid && selPtIdx > 0 && selPtIdx < pts.length - 1) {
                html += '<button type="button" class="ribbon-btn-sm danger" id="btnDeleteSelectedPoint" style="margin-top:8px;width:100%;">' +
                    '<cgo-icon name="delete" size="12"></cgo-icon><span>删除此折点 (拉直)</span></button>';
            }
            html += '</div>';
        } else {
            // 全线段拐角预设
            html += '<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-color,#e2e8f0);">' +
                '<div style="font-weight:600;font-size:12px;margin-bottom:6px;">拐角圆角半径微调</div>' +
                '<div class="form-row">' +
                '<span class="form-label">预设半径:</span>' +
                '<div style="display:flex;gap:4px;flex:1;">' +
                '<button type="button" class="ribbon-btn-sm btn-radius-all-preset" data-r="0">直角 0</button>' +
                '<button type="button" class="ribbon-btn-sm btn-radius-all-preset" data-r="8">紧凑 8</button>' +
                '<button type="button" class="ribbon-btn-sm btn-radius-all-preset" data-r="18">标准 18</button>' +
                '</div></div>' +
                '<div class="form-row" style="margin-top:4px;align-items:center;">' +
                '<span class="form-label">统一滑块:</span>' +
                '<input type="range" min="0" max="40" step="1" id="propSegCornerRadiusSlider" value="18" style="flex:1;">' +
                '<span id="propSegCornerRadiusVal" style="font-size:11px;min-width:32px;text-align:right;">18px</span>' +
                '</div></div>';
        }

        html += '<button type="button" class="ribbon-btn-sm danger" id="btnDeleteSelected" style="margin-top:14px;">' +
            '<cgo-icon name="delete" size="12"></cgo-icon><span>删除此线段</span></button>' +
            '</div>';

        dom.body.innerHTML = html;

        var lineSel = document.getElementById('propSegLine');
        if (lineSel) lineSel.addEventListener('change', function () { fireChange('segment', segment.id, 'lineId', this.value); });

        var typeSel = document.getElementById('propSegType');
        if (typeSel) typeSel.addEventListener('change', function () { fireChange('segment', segment.id, 'type', this.value); });

        var notOpenChk = document.getElementById('propSegNotOpen');
        if (notOpenChk) notOpenChk.addEventListener('change', function () { fireChange('segment', segment.id, 'notOpen', this.checked); });

        var flipBtn = document.getElementById('btnInspectorFlipCorner');
        if (flipBtn) flipBtn.addEventListener('click', function () { fireChange('segment', segment.id, 'flipCorner', true); });

        // 单折点圆角事件绑定
        document.querySelectorAll('.btn-radius-preset').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var rVal = parseInt(this.getAttribute('data-r'), 10);
                fireChange('segment', segment.id, 'point_radius', { pointIdx: selPtIdx, r: rVal });
            });
        });

        var slider = document.getElementById('propCornerRadiusSlider');
        var sliderVal = document.getElementById('propCornerRadiusVal');
        if (slider) {
            slider.addEventListener('input', function () {
                if (sliderVal) sliderVal.textContent = this.value + 'px';
            });
            slider.addEventListener('change', function () {
                fireChange('segment', segment.id, 'point_radius', { pointIdx: selPtIdx, r: parseInt(this.value, 10) });
            });
        }

        // 全线段圆角事件绑定
        document.querySelectorAll('.btn-radius-all-preset').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var rVal = parseInt(this.getAttribute('data-r'), 10);
                fireChange('segment', segment.id, 'all_radius', { r: rVal });
            });
        });

        var segSlider = document.getElementById('propSegCornerRadiusSlider');
        var segSliderVal = document.getElementById('propSegCornerRadiusVal');
        if (segSlider) {
            segSlider.addEventListener('input', function () {
                if (segSliderVal) segSliderVal.textContent = this.value + 'px';
            });
            segSlider.addEventListener('change', function () {
                fireChange('segment', segment.id, 'all_radius', { r: parseInt(this.value, 10) });
            });
        }

        // 单折点坐标修改
        var ptXInput = document.getElementById('propPointX');
        var ptYInput = document.getElementById('propPointY');
        if (ptXInput && ptYInput) {
            var handlePtPos = function () {
                fireChange('segment', segment.id, 'point_position', {
                    pointIdx: selPtIdx,
                    x: parseFloat(ptXInput.value) || 0,
                    y: parseFloat(ptYInput.value) || 0
                });
            };
            ptXInput.addEventListener('change', handlePtPos);
            ptYInput.addEventListener('change', handlePtPos);
        }

        var delPointBtn = document.getElementById('btnDeleteSelectedPoint');
        if (delPointBtn) {
            delPointBtn.addEventListener('click', function () {
                fireChange('segment', segment.id, 'delete_point', { pointIdx: selPtIdx });
            });
        }

        var delBtn = document.getElementById('btnDeleteSelected');
        if (delBtn) delBtn.addEventListener('click', function () { fireChange('segment', segment.id, 'delete', true); });

        var editSegLineBtn = document.getElementById('btnEditSegLine');
        if (editSegLineBtn) {
            editSegLineBtn.addEventListener('click', function () {
                fireChange('segment', segment.id, 'open_line', segment.lineId);
            });
        }
    }

    /**
     * 通用图元检视面板（用于虚拟换乘、在建走向、地点地标、水域、文本等）
     */
    /**
     * 地图装饰（散点）检视面板：素材、位置、尺寸、旋转、不透明度、层级均可直接编辑。
     * @param {Object} item SCATTERED_DATA 条目
     * @param {number} idx 条目下标
     * @param {Object} project 工程（用于列出本城市已用的素材文件）
     */
    function renderScatteredInspector(item, idx, project) {
        if (!dom.body) return;
        var resolve = (window.OpenMapEditor.ScatteredLayer && window.OpenMapEditor.ScatteredLayer.resolveSvgPath) || function (f) { return f; };
        var pickable = window.OpenMapEditor.ScatteredLayer && window.OpenMapEditor.ScatteredLayer.isPickable
            ? window.OpenMapEditor.ScatteredLayer.isPickable(item) : true;
        var files = [];
        ((project && project.scattered) || []).forEach(function (sc) {
            if (sc && sc.file && files.indexOf(sc.file) === -1) files.push(sc.file);
        });
        var num = function (v, d) { return (v === undefined || v === null || v === '') ? d : v; };
        var fileName = function (f) { return String(f || '').split('/').pop(); };

        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title"><span>地图装饰</span>' +
            '<cgo-badge variant="info">' + escAttr(item.id || ('#' + idx)) + '</cgo-badge></div>' +
            '<div class="scattered-preview">' +
            (item.file ? '<img src="' + escAttr(resolve(item.file)) + '" alt="" draggable="false">' : '<span>无素材</span>') +
            '</div>' +
            (pickable ? '' : '<div class="scattered-backdrop-note"><cgo-icon name="info" size="12"></cgo-icon>' +
                '<span>这是铺满画布的底图装饰，为避免误拖，只能在这里调整，画布上不可直接点选。</span></div>') +
            '<div class="form-row"><span class="form-label">素材文件:</span>' +
            '<select class="form-select" id="propScFileSel">' +
            files.map(function (f) {
                return '<option value="' + escAttr(f) + '"' + (f === item.file ? ' selected' : '') + '>' + escAttr(fileName(f)) + '</option>';
            }).join('') +
            '<option value="__custom">自定义路径…</option></select></div>' +
            '<div class="form-row" id="propScFileCustomRow" style="display:none;"><span class="form-label">路径:</span>' +
            '<input type="text" class="form-input" id="propScFile" spellcheck="false" placeholder="./city/{id}/assets/xxx.svg" value="' + escAttr(item.file || '') + '"></div>' +
            '<div class="form-row"><span class="form-label">中心坐标:</span><div style="display:flex;gap:4px;flex:1;">' +
            '<input type="number" step="0.1" class="form-input" id="propScX" value="' + escAttr(num(item.x, 0)) + '">' +
            '<input type="number" step="0.1" class="form-input" id="propScY" value="' + escAttr(num(item.y, 0)) + '"></div></div>' +
            '<div class="form-row"><span class="form-label">宽 × 高:</span><div style="display:flex;gap:4px;flex:1;align-items:center;">' +
            '<input type="number" step="0.1" min="1" class="form-input" id="propScW" value="' + escAttr(num(item.width, '')) + '" placeholder="原始">' +
            '<input type="number" step="0.1" min="1" class="form-input" id="propScH" value="' + escAttr(num(item.height, '')) + '" placeholder="原始">' +
            '<label class="sc-lock" title="锁定宽高比"><input type="checkbox" id="propScLock" checked><cgo-icon name="link" size="12"></cgo-icon></label>' +
            '</div></div>' +
            '<div class="form-row"><span class="form-label">旋转角:</span>' +
            '<input type="number" step="1" class="form-input" id="propScRot" value="' + escAttr(num(item.rotation, 0)) + '"></div>' +
            '<div class="form-row"><span class="form-label">不透明度:</span><div style="display:flex;gap:6px;flex:1;align-items:center;">' +
            '<input type="range" min="0" max="1" step="0.05" id="propScOpacity" value="' + escAttr(num(item.opacity, 1)) + '" style="flex:1;">' +
            '<span id="propScOpacityVal" style="width:34px;text-align:right;font-size:11px;">' + Math.round(num(item.opacity, 1) * 100) + '%</span></div></div>' +
            '<div class="form-row"><span class="form-label">图层层级:</span>' +
            '<input type="number" step="1" class="form-input" id="propScZ" value="' + escAttr(num(item.zIndex, 5)) + '" title="数值越大越靠上（车站约 15~20，线路约 10）"></div>' +
            '<div style="display:flex;gap:6px;margin-top:10px;">' +
            '<button type="button" class="ribbon-btn-sm" id="btnScDuplicate"><cgo-icon name="copy" size="12"></cgo-icon><span>复制一份</span></button>' +
            '<button type="button" class="ribbon-btn-sm danger" id="btnScDelete"><cgo-icon name="delete" size="12"></cgo-icon><span>删除装饰</span></button>' +
            '</div></div>';
        dom.body.innerHTML = html;

        var fire = function (prop, value) { fireChange('scattered', idx, prop, value); };
        var numOrNull = function (el) { var v = parseFloat(el.value); return isNaN(v) ? null : Math.round(v * 100) / 100; };
        var sel = document.getElementById('propScFileSel');
        var customRow = document.getElementById('propScFileCustomRow');
        var fileInput = document.getElementById('propScFile');
        if (!item.file || files.indexOf(item.file) === -1) { sel.value = '__custom'; customRow.style.display = ''; }
        sel.addEventListener('change', function () {
            if (sel.value === '__custom') { customRow.style.display = ''; fileInput.focus(); return; }
            customRow.style.display = 'none';
            fire('file', sel.value);
        });
        fileInput.addEventListener('change', function () { if (fileInput.value.trim()) fire('file', fileInput.value.trim()); });
        var xEl = document.getElementById('propScX'), yEl = document.getElementById('propScY');
        var onPos = function () { fire('position', { x: numOrNull(xEl) || 0, y: numOrNull(yEl) || 0 }); };
        xEl.addEventListener('change', onPos); yEl.addEventListener('change', onPos);
        var wEl = document.getElementById('propScW'), hEl = document.getElementById('propScH'), lock = document.getElementById('propScLock');
        var ratio = (item.width && item.height) ? item.height / item.width : 1;
        wEl.addEventListener('change', function () {
            var w = numOrNull(wEl);
            var h = lock.checked && w ? Math.round(w * ratio * 100) / 100 : numOrNull(hEl);
            fire('size', { width: w, height: h });
        });
        hEl.addEventListener('change', function () {
            var h = numOrNull(hEl);
            var w = lock.checked && h ? Math.round(h / ratio * 100) / 100 : numOrNull(wEl);
            fire('size', { width: w, height: h });
        });
        document.getElementById('propScRot').addEventListener('change', function () { fire('rotation', numOrNull(this) || null); });
        var op = document.getElementById('propScOpacity');
        op.addEventListener('input', function () { document.getElementById('propScOpacityVal').textContent = Math.round(op.value * 100) + '%'; });
        op.addEventListener('change', function () { var v = parseFloat(op.value); fire('opacity', v >= 1 ? 1 : v); });
        document.getElementById('propScZ').addEventListener('change', function () { fire('zIndex', numOrNull(this)); });
        document.getElementById('btnScDuplicate').addEventListener('click', function () { fire('duplicate', true); });
        document.getElementById('btnScDelete').addEventListener('click', function () { fire('delete', true); });
    }

    /** 坐标显示：最多 2 位小数，整数不带 ".0" */
    function fmtCoord(v) {
        var n = Math.round(Number(v) * 100) / 100;
        return isFinite(n) ? String(n) : '0';
    }

    function renderGenericInspector(title, iconName, fields, actions, extraHtml) {
        if (!dom.body) return;
        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title" style="display:flex;align-items:center;gap:6px;">' +
            '<cgo-icon name="' + (iconName || 'info') + '" size="14"></cgo-icon>' +
            '<span>' + (title || '图元检视') + '</span>' +
            '</div>';

        (fields || []).forEach(function (f) {
            html += '<div class="form-row">' +
                '<span class="form-label">' + f.label + ':</span>' +
                '<span style="font-size:11px;color:var(--text-main);word-break:break-all;flex:1;">' + (f.value !== undefined ? f.value : '') + '</span>' +
                '</div>';
        });

        // 调用方自定义控件（如多选时的「批量入线路」下拉）
        if (extraHtml) html += extraHtml;

        if (actions && actions.length) {
            html += '<div class="form-row" style="margin-top:12px;gap:6px;">';
            actions.forEach(function (act, i) {
                html += '<button type="button" class="ribbon-btn-sm ' + (act.danger ? 'danger' : '') + '" id="btnInspectorGenericAct_' + i + '" style="flex:1;">' +
                    (act.icon ? '<cgo-icon name="' + act.icon + '" size="12"></cgo-icon>' : '') +
                    '<span>' + act.label + '</span></button>';
            });
            html += '</div>';
        }

        html += '</div>';
        dom.body.innerHTML = html;

        if (actions && actions.length) {
            actions.forEach(function (act, i) {
                var btn = document.getElementById('btnInspectorGenericAct_' + i);
                if (btn && typeof act.onClick === 'function') {
                    btn.addEventListener('click', act.onClick);
                }
            });
        }
    }

    /**
     * 空白提示态
     */
    /**
     * 空选择状态。
     * @param {{activeLine?: Object}} [ctx] 当前绘制线路（取消选中后仍需知道新画的线挂到哪条线上）
     */
    function renderEmpty(ctx) {
        if (!dom.body) return;
        var hint = '<div>点击画布或左侧大纲中的车站、折线、要素进行属性检视与微调</div>';
        var activeLine = ctx && ctx.activeLine;
        if (activeLine) {
            var color = activeLine.color || '#0284c7';
            var name = activeLine.name || activeLine.id;
            hint = '<div style="margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
                '<span style="width:10px;height:10px;border-radius:50%;display:inline-block;background:' + color + ';"></span>' +
                '<span style="font-size:11px;color:var(--text-main);">当前绘制线路：' + name + '</span>' +
                '</div>' + hint;
        }
        dom.body.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 40px 10px; font-size: 12px;">' +
            '<cgo-icon name="touch" size="24" style="opacity:0.4;margin-bottom:8px;"></cgo-icon>' +
            hint + '</div>';
    }

    /**
     * 线路属性检视面板
     *
     * 只负责这条线路条目里的少数字段（名称 / 标志色 / 运营公司 / 严格倒角），
     * 写回时由 CityProjectIO.patchEntries 做条目级最小编辑——
     * 改一个色号只会在源文件里产生一行 diff，不会动到 stationIds / pathPoints。
     */
    function renderLineInspector(line, project) {
        if (!dom.body || !line) return;

        // 分支安全统计（不能直接读 line.stationIds.length，分支线会 undefined）
        var stationCount = 0, poiCount = 0;
        var io = window.OpenMapEditor && window.OpenMapEditor.CityProjectIO;
        if (io) {
            if (typeof io.lineStationGroups === 'function') {
                io.lineStationGroups(line).forEach(function (g) { stationCount += (g.ids || []).length; });
            }
            if (typeof io.linePathGroups === 'function') {
                io.linePathGroups(line).forEach(function (g) { poiCount += (g.points || []).length; });
            }
        }
        var segCount = (project && project.segments ? project.segments.filter(function (s) { return s.lineId === line.id; }) : []).length;
        var color = line.color || '#0284c7';

        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title">' +
            '<span style="display:inline-flex;align-items:center;gap:6px;">' +
            '<span style="width:10px;height:10px;border-radius:50%;background:' + color +
            ';box-shadow:0 0 0 1px var(--office-border,#cbd5e1);"></span>' +
            '<span>线路属性</span></span>' +
            '<span class="cgo-badge">' + line.id + '</span>' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">线路 ID:</span>' +
            '<span style="font-size:11px;font-family:monospace;color:var(--text-light);flex:1;">' + line.id + '</span>' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">线路名称:</span>' +
            '<input type="text" class="form-input" id="propLineName" value="' + (line.name || '') + '" style="flex:1;">' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">标志色:</span>' +
            '<input type="color" class="form-input" id="propLineColorPicker" value="' + color + '" style="flex:0 0 36px;width:36px;padding:2px;">' +
            '<input type="text" class="form-input" id="propLineColorText" value="' + color + '" style="flex:1;font-family:monospace;">' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">运营公司:</span>' +
            '<input type="text" class="form-input" id="propLineCompany" value="' + (line.company || '') + '" style="flex:1;" placeholder="（可留空）">' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">线宽:</span>' +
            '<input type="number" class="form-input" id="propLineStrokeWidth" value="' + ((line.strokeWidth !== undefined && line.strokeWidth !== null) ? line.strokeWidth : 5.4) + '" step="0.5" min="1" max="24" style="flex:0 0 54px;width:54px;">' +
            '<span style="font-size:11px;color:var(--text-light);margin-right:auto;">px</span>' +
            '<div style="display:flex;gap:4px;">' +
            '<button type="button" class="btn-line-sw-preset" data-sw="3.5" style="padding:2px 6px;font-size:10px;border-radius:4px;border:1px solid var(--office-border);background:var(--card-bg);cursor:pointer;" title="细线 (有轨电车/单轨)">细 3.5</button>' +
            '<button type="button" class="btn-line-sw-preset" data-sw="5.4" style="padding:2px 6px;font-size:10px;border-radius:4px;border:1px solid var(--office-border);background:var(--card-bg);cursor:pointer;" title="标准 (标准地铁)">标 5.4</button>' +
            '<button type="button" class="btn-line-sw-preset" data-sw="8" style="padding:2px 6px;font-size:10px;border-radius:4px;border:1px solid var(--office-border);background:var(--card-bg);cursor:pointer;" title="粗线 (机场快线/城际线)">粗 8</button>' +
            '</div>' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">倒角:</span>' +
            '<label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;flex:1;">' +
            '<input type="checkbox" id="propLineStrict"' + (line.useStrictRounding ? ' checked' : '') + '>' +
            '<span>严格倒角 (useStrictRounding)</span></label>' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">端点 (Cap):</span>' +
            '<select class="form-select" id="propLineCap" style="flex:1;">' +
            '<option value="round"' + ((line.strokeLinecap || 'round') === 'round' ? ' selected' : '') + '>圆头 (Round)</option>' +
            '<option value="butt"' + (line.strokeLinecap === 'butt' ? ' selected' : '') + '>平头 (Butt)</option>' +
            '<option value="square"' + (line.strokeLinecap === 'square' ? ' selected' : '') + '>方头 (Square)</option>' +
            '</select>' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">转角 (Join):</span>' +
            '<select class="form-select" id="propLineJoin" style="flex:1;">' +
            '<option value="round"' + ((line.strokeLinejoin || 'round') === 'round' ? ' selected' : '') + '>圆角 (Round)</option>' +
            '<option value="miter"' + (line.strokeLinejoin === 'miter' ? ' selected' : '') + '>尖角 (Miter)</option>' +
            '<option value="bevel"' + (line.strokeLinejoin === 'bevel' ? ' selected' : '') + '>斜角 (Bevel)</option>' +
            '</select>' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">虚线分段:</span>' +
            '<input type="text" class="form-input" id="propLineDash" value="' + (line.strokeDasharray || '') + '" placeholder="如 10,6 或留空为实线" style="flex:1;font-family:monospace;">' +
            '</div>' +

            '<div id="lineSwatchesContainer"></div>' +

            '<div class="form-row">' +
            '<span class="form-label">规模:</span>' +
            '<span style="font-size:11px;color:var(--text-main);flex:1;">' +
            stationCount + ' 站 · ' + poiCount + ' 折点 · ' + segCount + ' 线段' +
            (line.hasbranch ? ' · 分支线' : '') + (line.isLoop ? ' · 环线' : '') +
            '</span></div>' +

            '<div class="form-row" style="gap:6px;margin-top:8px;">' +
            '<button type="button" class="ribbon-btn-sm" id="btnLineFocus" style="flex:1;" title="把视口定位到这条线路">' +
            '<cgo-icon name="location" size="12"></cgo-icon><span>定位线路</span></button>' +
            '<button type="button" class="ribbon-btn-sm" id="btnLineSelectStations" style="flex:1;" title="选中这条线路的全部车站（含分支）">' +
            '<cgo-icon name="location" size="12"></cgo-icon><span>选中全线车站</span></button>' +
            '</div>' +

            '<div style="font-size:10px;color:var(--text-light);margin-top:8px;line-height:1.6;">' +
            '改动只写回这条线路条目里真正变更的字段；站序与折点仍请在画布或点编辑模式下调整。' +
            '</div>' +

            '<div class="form-row" style="gap:6px;margin-top:10px;">' +
            '<button type="button" class="ribbon-btn-sm danger" id="btnLineDelete" style="flex:1;width:100%;" ' +
            'title="删除这条线路（车站本身不会被删除，其它线路仍可继续使用）">' +
            '<cgo-icon name="delete" size="12"></cgo-icon><span>删除线路</span></button>' +
            '</div>' +
            '</div>';

        dom.body.innerHTML = html;

        var nameInput = document.getElementById('propLineName');
        if (nameInput) {
            nameInput.addEventListener('change', function () {
                fireChange('line', line.id, 'name', this.value);
            });
        }

        var colorPicker = document.getElementById('propLineColorPicker');
        var colorText = document.getElementById('propLineColorText');
        var applyColor = function (raw) {
            var hex = normalizeHex(raw);
            if (!hex) {
                if (colorText) colorText.value = line.color || '';
                return;
            }
            fireChange('line', line.id, 'color', hex);
        };
        if (colorPicker) {
            colorPicker.addEventListener('input', function () {
                if (colorText) colorText.value = this.value;
                applyColor(this.value);
            });
        }
        if (colorText) {
            colorText.addEventListener('change', function () {
                var hex = normalizeHex(this.value);
                if (!hex) { this.value = line.color || ''; return; }
                this.value = hex;
                if (colorPicker) colorPicker.value = hex;
                applyColor(hex);
            });
        }

        var companyInput = document.getElementById('propLineCompany');
        if (companyInput) {
            companyInput.addEventListener('change', function () {
                fireChange('line', line.id, 'company', this.value);
            });
        }

        var swInput = document.getElementById('propLineStrokeWidth');
        if (swInput) {
            swInput.addEventListener('change', function () {
                var val = parseFloat(this.value);
                if (isNaN(val) || val <= 0) val = 5.4;
                fireChange('line', line.id, 'strokeWidth', val);
            });
        }
        var swPresets = dom.body.querySelectorAll('.btn-line-sw-preset');
        swPresets.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var val = parseFloat(this.getAttribute('data-sw'));
                if (swInput) swInput.value = val;
                fireChange('line', line.id, 'strokeWidth', val);
            });
        });

        var strictInput = document.getElementById('propLineStrict');
        if (strictInput) {
            strictInput.addEventListener('change', function () {
                fireChange('line', line.id, 'useStrictRounding', this.checked);
            });
        }

        var capInput = document.getElementById('propLineCap');
        if (capInput) {
            capInput.addEventListener('change', function () {
                fireChange('line', line.id, 'strokeLinecap', this.value);
            });
        }

        var joinInput = document.getElementById('propLineJoin');
        if (joinInput) {
            joinInput.addEventListener('change', function () {
                fireChange('line', line.id, 'strokeLinejoin', this.value);
            });
        }

        var dashInput = document.getElementById('propLineDash');
        if (dashInput) {
            dashInput.addEventListener('change', function () {
                fireChange('line', line.id, 'strokeDasharray', this.value.trim());
            });
        }

        // 轨交色板渲染与选取
        var swContainer = dom.body.querySelector('#lineSwatchesContainer');
        if (swContainer && window.OpenMapEditor.SwatchesPalette) {
            window.OpenMapEditor.SwatchesPalette.renderSwatches(swContainer, project, function (hex) {
                if (colorText) colorText.value = hex;
                if (colorPicker) colorPicker.value = hex;
                applyColor(hex);
            });
        }

        var focusBtn = document.getElementById('btnLineFocus');
        if (focusBtn) focusBtn.addEventListener('click', function () { fireChange('line', line.id, 'focus', true); });
        var selStBtn = document.getElementById('btnLineSelectStations');
        if (selStBtn) selStBtn.addEventListener('click', function () { fireChange('line', line.id, 'selectStations', true); });
        var delLineBtn = document.getElementById('btnLineDelete');
        if (delLineBtn) delLineBtn.addEventListener('click', function () { fireChange('line', line.id, 'delete_line', true); });
    }

    /**
     * 渲染自由注释文本属性面板
     */
    function renderTextInspector(textItem, project) {
        if (!dom.body || !textItem) return;

        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title">' +
            '<span style="display:inline-flex;align-items:center;gap:4px;"><cgo-icon name="vi-text" size="14"></cgo-icon> 注释文本属性</span>' +
            '<cgo-badge variant="info">' + textItem.id + '</cgo-badge>' +
            '</div>';

        // 文本内容
        html += '<div class="form-row" style="flex-direction:column;align-items:stretch;gap:4px;">' +
            '<span class="form-label" style="min-width:auto;">文本内容 (支持换行):</span>' +
            '<textarea class="form-textarea" id="propTextContent" style="height:64px;resize:vertical;font-family:inherit;">' +
            (textItem.text || '') + '</textarea>' +
            '</div>';

        // 字号大小 (带预设药丸)
        var curSize = textItem.size || 14;
        html += '<div class="form-row">' +
            '<span class="form-label">字体字号:</span>' +
            '<input type="number" class="form-input" id="propTextSize" min="8" max="120" step="1" value="' + curSize + '" style="flex:1;">' +
            '<span style="font-size:11px;color:var(--text-light);margin-left:4px;">px</span>' +
            '</div>' +
            '<div style="display:flex;gap:4px;margin-bottom:8px;padding-left:70px;flex-wrap:wrap;">';
        [12, 14, 16, 20, 24, 32].forEach(function (sz) {
            html += '<button type="button" class="ribbon-btn-sm btn-text-size-preset" data-sz="' + sz + '" style="padding:1px 6px;font-size:10px;">' + sz + '</button>';
        });
        html += '</div>';

        // 粗体 & 锚点对齐
        var curAnchor = textItem.anchor || 'start';
        html += '<div class="form-row">' +
            '<span class="form-label">文字对齐:</span>' +
            '<select class="form-select" id="propTextAnchor" style="flex:1;">' +
            '<option value="start"' + (curAnchor === 'start' ? ' selected' : '') + '>居左 (Start)</option>' +
            '<option value="middle"' + (curAnchor === 'middle' ? ' selected' : '') + '>居中 (Middle)</option>' +
            '<option value="end"' + (curAnchor === 'end' ? ' selected' : '') + '>居右 (End)</option>' +
            '</select>' +
            '</div>' +
            '<div class="form-row">' +
            '<span class="form-label">样式:</span>' +
            '<label style="display:inline-flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;">' +
            '<input type="checkbox" id="propTextBold"' + (textItem.bold ? ' checked' : '') + '>' +
            '<span>加粗文本 (Bold)</span>' +
            '</label>' +
            '</div>';

        // 旋转角度 Rotate
        var curRot = Math.round(textItem.rotate || 0);
        html += '<div class="form-row">' +
            '<span class="form-label">旋转角度:</span>' +
            '<input type="range" class="form-range" id="propTextRotateRange" min="-180" max="180" step="5" value="' + curRot + '" style="flex:1;">' +
            '<input type="number" class="form-input" id="propTextRotateInput" min="-180" max="180" step="1" value="' + curRot + '" style="flex:0 0 52px;text-align:right;">' +
            '<span style="font-size:11px;color:var(--text-light);margin-left:2px;">°</span>' +
            '</div>' +
            '<div style="display:flex;gap:4px;margin-bottom:8px;padding-left:70px;flex-wrap:wrap;">' +
            '<button type="button" class="ribbon-btn-sm btn-text-rot-preset" data-rot="0" style="padding:1px 6px;font-size:10px;">0° (正)</button>' +
            '<button type="button" class="ribbon-btn-sm btn-text-rot-preset" data-rot="45" style="padding:1px 6px;font-size:10px;">45°</button>' +
            '<button type="button" class="ribbon-btn-sm btn-text-rot-preset" data-rot="90" style="padding:1px 6px;font-size:10px;">90°</button>' +
            '<button type="button" class="ribbon-btn-sm btn-text-rot-preset" data-rot="-45" style="padding:1px 6px;font-size:10px;">-45°</button>' +
            '</div>';

        // 字体颜色
        var curColor = textItem.color || '';
        html += '<div class="form-row">' +
            '<span class="form-label">字体颜色:</span>' +
            '<input type="color" class="form-input" id="propTextColorPicker" value="' + (curColor || '#1e293b') + '" style="flex:0 0 36px;width:36px;padding:2px;">' +
            '<input type="text" class="form-input" id="propTextColorText" value="' + (curColor || '') + '" placeholder="跟随主题" style="flex:1;font-family:monospace;">' +
            '<button type="button" class="ribbon-btn-sm" id="btnResetTextColor" title="恢复跟随系统主题">默认</button>' +
            '</div>' +
            '<div id="textSwatchesContainer"></div>';

        // 坐标微调
        html += '<div class="form-row">' +
            '<span class="form-label">基准坐标:</span>' +
            '<div style="display:flex;gap:4px;flex:1;">' +
            '<input type="number" class="form-input" id="propTextPosX" value="' + Math.round(textItem.x || 0) + '">' +
            '<input type="number" class="form-input" id="propTextPosY" value="' + Math.round(textItem.y || 0) + '">' +
            '</div>' +
            '</div>';

        // 操作按钮 (删除)
        html += '<div style="margin-top:14px;display:flex;gap:6px;justify-content:flex-end;">' +
            '<button type="button" class="ribbon-btn-sm danger" id="btnDeleteText">' +
            '<cgo-icon name="delete" size="12"></cgo-icon><span>删除此文本</span>' +
            '</button>' +
            '</div>';

        html += '</div>';

        dom.body.innerHTML = html;

        // 绑定事件
        var contentEl = document.getElementById('propTextContent');
        if (contentEl) {
            contentEl.addEventListener('input', function () {
                fireChange('text', textItem.id, 'text', this.value);
            });
        }

        var sizeEl = document.getElementById('propTextSize');
        if (sizeEl) {
            sizeEl.addEventListener('change', function () {
                fireChange('text', textItem.id, 'size', Number(this.value) || 14);
            });
        }
        document.querySelectorAll('.btn-text-size-preset').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var sz = Number(this.getAttribute('data-sz'));
                if (sizeEl) sizeEl.value = sz;
                fireChange('text', textItem.id, 'size', sz);
            });
        });

        var anchorEl = document.getElementById('propTextAnchor');
        if (anchorEl) {
            anchorEl.addEventListener('change', function () {
                fireChange('text', textItem.id, 'anchor', this.value);
            });
        }

        var boldEl = document.getElementById('propTextBold');
        if (boldEl) {
            boldEl.addEventListener('change', function () {
                fireChange('text', textItem.id, 'bold', this.checked);
            });
        }

        var rotRange = document.getElementById('propTextRotateRange');
        var rotInput = document.getElementById('propTextRotateInput');
        function setRot(deg) {
            if (rotRange) rotRange.value = deg;
            if (rotInput) rotInput.value = deg;
            fireChange('text', textItem.id, 'rotate', deg);
        }
        if (rotRange) rotRange.addEventListener('input', function () { setRot(Number(this.value) || 0); });
        if (rotInput) rotInput.addEventListener('change', function () { setRot(Number(this.value) || 0); });
        document.querySelectorAll('.btn-text-rot-preset').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setRot(Number(this.getAttribute('data-rot')) || 0);
            });
        });

        var clrPicker = document.getElementById('propTextColorPicker');
        var clrText = document.getElementById('propTextColorText');
        if (clrPicker) {
            clrPicker.addEventListener('input', function () {
                if (clrText) clrText.value = this.value;
                fireChange('text', textItem.id, 'color', this.value);
            });
        }
        if (clrText) {
            clrText.addEventListener('change', function () {
                var hex = normalizeHex(this.value);
                if (hex) {
                    this.value = hex;
                    if (clrPicker) clrPicker.value = hex;
                    fireChange('text', textItem.id, 'color', hex);
                } else if (!this.value.trim()) {
                    fireChange('text', textItem.id, 'color', null);
                }
            });
        }
        var btnResetClr = document.getElementById('btnResetTextColor');
        if (btnResetClr) {
            btnResetClr.addEventListener('click', function () {
                if (clrText) clrText.value = '';
                fireChange('text', textItem.id, 'color', null);
            });
        }

        var textSwContainer = dom.body.querySelector('#textSwatchesContainer');
        if (textSwContainer && window.OpenMapEditor.SwatchesPalette) {
            window.OpenMapEditor.SwatchesPalette.renderSwatches(textSwContainer, project, function (hex) {
                if (clrText) clrText.value = hex;
                if (clrPicker) clrPicker.value = hex;
                fireChange('text', textItem.id, 'color', hex);
            });
        }

        var posX = document.getElementById('propTextPosX');
        var posY = document.getElementById('propTextPosY');
        function updatePos() {
            var x = Number(posX.value) || 0;
            var y = Number(posY.value) || 0;
            fireChange('text', textItem.id, 'position', { x: x, y: y });
        }
        if (posX) posX.addEventListener('change', updatePos);
        if (posY) posY.addEventListener('change', updatePos);

        var delBtn = document.getElementById('btnDeleteText');
        if (delBtn) {
            delBtn.addEventListener('click', function () {
                fireChange('text', textItem.id, 'delete', true);
            });
        }
    }

    /**
     * 渲染水域多边形与河道属性面板
     */
    function renderWaterInspector(waterItem, project) {
        if (!dom.body || !waterItem) return;

        var isPath = (waterItem.type === 'path' || waterItem.type === 'river');
        var pts = waterItem.points || [];

        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title">' +
            '<span style="display:inline-flex;align-items:center;gap:4px;"><cgo-icon name="map" size="14"></cgo-icon> ' + (isPath ? '河道线要素' : '水域多边形') + '</span>' +
            '<cgo-badge variant="info">' + waterItem.id + '</cgo-badge>' +
            '</div>';

        html += '<div class="form-row">' +
            '<span class="form-label">要素形态:</span>' +
            '<select class="form-select" id="propWaterType" style="flex:1;">' +
            '<option value="polygon"' + (!isPath ? ' selected' : '') + '>闭合多边形面 (Polygon)</option>' +
            '<option value="river"' + (isPath ? ' selected' : '') + '>河道折线 (River Path)</option>' +
            '</select>' +
            '</div>';

        if (isPath) {
            html += '<div class="form-row">' +
                '<span class="form-label">河道线宽:</span>' +
                '<input type="number" class="form-input" id="propWaterWidth" min="2" max="200" step="2" value="' + (waterItem.width || 20) + '" style="flex:1;">' +
                '<span style="font-size:11px;color:var(--text-light);margin-left:4px;">px</span>' +
                '</div>';
        }

        html += '<div class="form-row">' +
            '<span class="form-label">顶点总数:</span>' +
            '<span style="font-size:12px;font-weight:600;flex:1;">' + pts.length + ' 个控制顶点</span>' +
            '</div>' +
            '<div style="font-size:10px;color:var(--text-light);margin-bottom:8px;line-height:1.5;">' +
            '可在画布上拖拽任意顶点调整形状，或点击两点中点插入新顶点。' +
            '</div>';

        // 路径查找器布尔运算 (仅限多边形要素)
        var otherWaters = (project && project.waters ? project.waters.filter(function (w) { return w.id !== waterItem.id && w.type !== 'path' && w.type !== 'river'; }) : []);
        if (!isPath && otherWaters.length > 0) {
            html += '<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--border-color,#e2e8f0);">' +
                '<div style="font-weight:600;font-size:12px;margin-bottom:6px;display:flex;align-items:center;gap:4px;">' +
                '<cgo-icon name="design" size="13"></cgo-icon><span>路径查找器 (布尔运算)</span>' +
                '</div>' +
                '<div class="form-row">' +
                '<span class="form-label">运算目标:</span>' +
                '<select class="form-select" id="propWaterBoolTarget" style="flex:1;">';
            otherWaters.forEach(function (ow) {
                html += '<option value="' + ow.id + '">' + ow.id + ' (' + (ow.points ? ow.points.length : 0) + ' 顶点)</option>';
            });
            html += '</select></div>' +
                '<div style="display:flex;gap:4px;margin-top:6px;">' +
                '<button type="button" class="ribbon-btn-sm" id="btnWaterUnion" style="flex:1;" title="合并两水域为一个连续轮廓">并集</button>' +
                '<button type="button" class="ribbon-btn-sm" id="btnWaterSubtract" style="flex:1;" title="从当前水域中减去目标水域 (镂空/抠除)">差集</button>' +
                '<button type="button" class="ribbon-btn-sm" id="btnWaterIntersect" style="flex:1;" title="保留两个水域的交叠重合部分">交集</button>' +
                '</div></div>';
        }

        // 操作按钮
        html += '<div style="margin-top:14px;display:flex;gap:6px;justify-content:flex-end;">' +
            '<button type="button" class="ribbon-btn-sm danger" id="btnDeleteWater">' +
            '<cgo-icon name="delete" size="12"></cgo-icon><span>删除此水域</span>' +
            '</button>' +
            '</div>';

        html += '</div>';

        dom.body.innerHTML = html;

        var typeSel = document.getElementById('propWaterType');
        if (typeSel) {
            typeSel.addEventListener('change', function () {
                fireChange('water', waterItem.id, 'type', this.value);
            });
        }

        var widthEl = document.getElementById('propWaterWidth');
        if (widthEl) {
            widthEl.addEventListener('change', function () {
                fireChange('water', waterItem.id, 'width', Number(this.value) || 20);
            });
        }

        var delBtn = document.getElementById('btnDeleteWater');
        if (delBtn) {
            delBtn.addEventListener('click', function () {
                fireChange('water', waterItem.id, 'delete', true);
            });
        }

        var boolTargetSel = document.getElementById('propWaterBoolTarget');
        var btnUnion = document.getElementById('btnWaterUnion');
        if (btnUnion && boolTargetSel) {
            btnUnion.addEventListener('click', function () {
                fireChange('water', waterItem.id, 'boolean_op', { op: 'union', targetId: boolTargetSel.value });
            });
        }
        var btnSub = document.getElementById('btnWaterSubtract');
        if (btnSub && boolTargetSel) {
            btnSub.addEventListener('click', function () {
                fireChange('water', waterItem.id, 'boolean_op', { op: 'subtract', targetId: boolTargetSel.value });
            });
        }
        var btnInt = document.getElementById('btnWaterIntersect');
        if (btnInt && boolTargetSel) {
            btnInt.addEventListener('click', function () {
                fireChange('water', waterItem.id, 'boolean_op', { op: 'intersect', targetId: boolTargetSel.value });
            });
        }
    }

    /**
     * 标准化颜色输入：#RGB → #RRGGBB，去空格，统一大写。
     * 与源文件里 #E4002B 这种写法对齐；无效输入返回 null。
     */
    function normalizeHex(input) {
        var v = String(input || '').trim();
        if (!v) return null;
        if (v.charAt(0) !== '#') v = '#' + v;
        if (/^#[0-9a-fA-F]{3}$/.test(v)) {
            v = '#' + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2) + v.charAt(3) + v.charAt(3);
        }
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) return null;
        return v.toUpperCase();
    }

    return {
        refreshPreviews: refreshPreviews,
        init: init,
        renderNodeInspector: renderNodeInspector,
        renderSegmentInspector: renderSegmentInspector,
        renderLineInspector: renderLineInspector,
        renderTextInspector: renderTextInspector,
        renderWaterInspector: renderWaterInspector,
        renderGenericInspector: renderGenericInspector,
        renderScatteredInspector: renderScatteredInspector,
        renderEmpty: renderEmpty
    };
})();

// 保留全局别名兼容
window.InspectorView = window.OpenMapEditor.InspectorView;
