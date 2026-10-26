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
        { id: 'bottom-left', rot: -135, label: '左下 (SW)' },
        { id: 'bottom', rot: 180, label: '正下 (S)' },
        { id: 'bottom-right', rot: 135, label: '右下 (SE)' }
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
        var align = currentAlign || 'top';
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

    /**
     * 渲染车站节点属性
     */
    function renderNodeInspector(node, project) {
        if (!dom.body) return;
        var isStation = (node.type !== 'temp');

        var html = '<div class="inspector-section">' +
            '<div class="inspector-section-title">' +
            '<span>' + (isStation ? '车站属性' : '辅助临时节点') + '</span>' +
            '<cgo-badge variant="info">' + node.id + '</cgo-badge>' +
            '</div>';

        if (isStation) {
            html += '<div class="form-row">' +
                '<span class="form-label">中文站名:</span>' +
                '<input type="text" class="form-input" id="propNodeCn" value="' + (node.cn || '') + '">' +
                '</div>' +
                '<div class="form-row">' +
                '<span class="form-label">英文站名:</span>' +
                '<input type="text" class="form-input" id="propNodeEn" value="' + (node.en || '') + '">' +
                '</div>' +
                '<div class="form-row">' +
                '<span class="form-label">图元类型:</span>' +
                '<select class="form-select" id="propNodeType">' +
                '<option value="dot"' + (node.type === 'dot' ? ' selected' : '') + '>普通站 (dot)</option>' +
                '<option value="tsf"' + (node.type === 'tsf' ? ' selected' : '') + '>换乘站 (tsf)</option>' +
                '<option value="rdot"' + (node.type === 'rdot' ? ' selected' : '') + '>国铁站 (rdot)</option>' +
                '<option value="no"' + (node.notOpen || node.type === 'no' ? ' selected' : '') + '>暂缓开通 (no)</option>' +
                '</select>' +
                '</div>';

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

        var typeSelect = document.getElementById('propNodeType');
        if (typeSelect) typeSelect.addEventListener('change', function () { fireChange('node', node.id, 'type', this.value); });

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
    function renderEmpty() {
        if (!dom.body) return;
        dom.body.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 40px 10px; font-size: 12px;">' +
            '<cgo-icon name="touch" size="24" style="opacity:0.4;margin-bottom:8px;"></cgo-icon>' +
            '<div>点击画布或左侧大纲中的车站、折线、要素进行属性检视与微调</div></div>';
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
            '<span class="form-label">倒角:</span>' +
            '<label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;flex:1;">' +
            '<input type="checkbox" id="propLineStrict"' + (line.useStrictRounding ? ' checked' : '') + '>' +
            '<span>严格倒角 (useStrictRounding)</span></label>' +
            '</div>' +

            '<div class="form-row">' +
            '<span class="form-label">规模:</span>' +
            '<span style="font-size:11px;color:var(--text-main);flex:1;">' +
            stationCount + ' 站 · ' + poiCount + ' 折点 · ' + segCount + ' 线段' +
            (line.hasbranch ? ' · 分支线' : '') + (line.isLoop ? ' · 环线' : '') +
            '</span></div>' +

            '<div class="form-row" style="gap:6px;margin-top:8px;">' +
            '<button type="button" class="ribbon-btn-sm" id="btnLineFocus" style="flex:1;" title="把视口定位到这条线路">' +
            '<cgo-icon name="target" size="12"></cgo-icon><span>定位线路</span></button>' +
            '<button type="button" class="ribbon-btn-sm" id="btnLineSelectStations" style="flex:1;" title="选中这条线路的全部车站（含分支）">' +
            '<cgo-icon name="location" size="12"></cgo-icon><span>选中全线车站</span></button>' +
            '</div>' +

            '<div style="font-size:10px;color:var(--text-light);margin-top:8px;line-height:1.6;">' +
            '改动只写回这条线路条目里真正变更的字段；站序与折点仍请在画布或点编辑模式下调整。' +
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

        var strictInput = document.getElementById('propLineStrict');
        if (strictInput) {
            strictInput.addEventListener('change', function () {
                fireChange('line', line.id, 'useStrictRounding', this.checked);
            });
        }

        var focusBtn = document.getElementById('btnLineFocus');
        if (focusBtn) focusBtn.addEventListener('click', function () { fireChange('line', line.id, 'focus', true); });
        var selStBtn = document.getElementById('btnLineSelectStations');
        if (selStBtn) selStBtn.addEventListener('click', function () { fireChange('line', line.id, 'selectStations', true); });
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
        init: init,
        renderNodeInspector: renderNodeInspector,
        renderSegmentInspector: renderSegmentInspector,
        renderLineInspector: renderLineInspector,
        renderGenericInspector: renderGenericInspector,
        renderEmpty: renderEmpty
    };
})();

// 保留全局别名兼容
window.InspectorView = window.OpenMapEditor.InspectorView;
