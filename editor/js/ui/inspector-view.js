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
        }

        html += '<div class="form-row">' +
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

        var delBtn = document.getElementById('btnDeleteSelected');
        if (delBtn) delBtn.addEventListener('click', function () { fireChange('node', node.id, 'delete', true); });
    }

    /**
     * 渲染线段属性检视
     */
    function renderSegmentInspector(segment, project) {
        if (!dom.body) return;

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

        html += '</select></div>' +
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
            '<div class="form-row" style="margin-top:8px;">' +
            '<button type="button" class="ribbon-btn-sm" id="btnInspectorFlipCorner" style="flex:1;">' +
            '<cgo-icon name="flip-h" size="12"></cgo-icon><span>翻转折角方向</span></button>' +
            '</div>' +
            '<button type="button" class="ribbon-btn-sm danger" id="btnDeleteSelected" style="margin-top:14px;">' +
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

        var delBtn = document.getElementById('btnDeleteSelected');
        if (delBtn) delBtn.addEventListener('click', function () { fireChange('segment', segment.id, 'delete', true); });
    }

    /**
     * 通用图元检视面板（用于虚拟换乘、在建走向、地点地标、水域、文本等）
     */
    function renderGenericInspector(title, iconName, fields, actions) {
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

    return {
        init: init,
        renderNodeInspector: renderNodeInspector,
        renderSegmentInspector: renderSegmentInspector,
        renderGenericInspector: renderGenericInspector,
        renderEmpty: renderEmpty
    };
})();

// 保留全局别名兼容
window.InspectorView = window.OpenMapEditor.InspectorView;
