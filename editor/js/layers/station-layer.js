/**
 * 开放地图编辑器 (OpenMap Editor) - 车站交互与标注图层
 * 强制调用 core/station-icons.js 渲染车站图元，并与主地图 main.html 站名文字规范 100% 对齐：
 * 1. 站名间距：distV = 5.2px, distH = 6px, distD = 6px，8 方向精确对齐；
 * 2. 字体与字级：中文 11.5px / line-height 13.8px / weight 500 / "Noto Sans SC"；
 *               英文 6.65px / line-height 6.35px / weight 500 / "Arimo"；
 * 3. 结构与样式：采用主地图标准 .label-group 包含 .stacn 与 .staen；
 * 4. 支持 textScale (cn/en) 字符拉伸与 offset 偏移；
 * 5. 选中态联动高亮，双向捕获点击事件。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.StationLayer = (function () {
    'use strict';

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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * 计算站名标签的锚点位置与变换 (严格对齐主地图 core/script.js 第 1156~1176 行)
     * @param {Object} n 车站节点数据
     * @returns {{ x: number, y: number, transform: string, textAlign: string, transformOriginX: string }}
     */
    function calculateLabelLayout(n) {
        var distV = 5.2; // 垂直间距 (top / bottom)
        var distH = 6;   // 水平间距 (left / right)
        var distD = 6;   // 对角间距 (top-left, top-right, bottom-left, bottom-right)

        var left = n.x || 0;
        var top = n.y || 0;
        var transform = "";
        var textAlign = "center";
        var transformOriginX = "50%";
        var align = n.align || 'top';

        switch (align) {
            case 'top':
                top -= distV;
                transform = "translate(-50%, -100%)";
                textAlign = "center";
                transformOriginX = "50%";
                break;
            case 'bottom':
                top += distV;
                transform = "translate(-50%, 0)";
                textAlign = "center";
                transformOriginX = "50%";
                break;
            case 'left':
                left -= distH;
                transform = "translate(-100%, -50%)";
                textAlign = "right";
                transformOriginX = "100%";
                break;
            case 'right':
                left += distH;
                transform = "translate(0, -50%)";
                textAlign = "left";
                transformOriginX = "0%";
                break;
            case 'top-left':
                left -= distD;
                top -= distD;
                transform = "translate(-100%, -100%)";
                textAlign = "right";
                transformOriginX = "100%";
                break;
            case 'top-right':
                left += distD;
                top -= distD;
                transform = "translate(0, -100%)";
                textAlign = "left";
                transformOriginX = "0%";
                break;
            case 'bottom-left':
                left -= distD;
                top += distD;
                transform = "translate(-100%, 0)";
                textAlign = "right";
                transformOriginX = "100%";
                break;
            case 'bottom-right':
                left += distD;
                top += distD;
                transform = "translate(0, 0)";
                textAlign = "left";
                transformOriginX = "0%";
                break;
            default:
                top += distV;
                transform = "translate(-50%, 0)";
                textAlign = "center";
                transformOriginX = "50%";
        }

        if (n.offset) {
            if (n.offset.x) left += n.offset.x;
            if (n.offset.y) top += n.offset.y;
        }

        return {
            x: left,
            y: top,
            transform: transform,
            textAlign: textAlign,
            transformOriginX: transformOriginX
        };
    }

    /**
     * 保持向后兼容的偏移查询
     */
    function labelOffsetFor(align) {
        var dummy = { x: 0, y: 0, align: align };
        var layout = calculateLabelLayout(dummy);
        return { dx: layout.x, dy: layout.y, anchor: layout.textAlign === 'right' ? 'end' : (layout.textAlign === 'left' ? 'start' : 'middle') };
    }

    /**
     * 渲染车站节点与站名文字
     * @param {Object} project 工程数据模型
     * @param {Object} options { selectedNodeId, selectedNodeIds, lineColorsMap }
     */
    function render(project, options) {
        if (!dom.stationLayer) return;
        dom.stationLayer.innerHTML = '';
        if (dom.labelLayer) dom.labelLayer.innerHTML = '';
        if (!project || !project.nodes) return;

        var opt = options || {};
        var selectedId = opt.selectedNodeId;
        var selectedSet = new Set(opt.selectedNodeIds || []);
        var iconsEngine = getStationIconsEngine();

        // 遍历 nodes 字典
        Object.keys(project.nodes).forEach(function (nodeId) {
            var n = project.nodes[nodeId];
            if (!n) return;

            var isSelected = (nodeId === selectedId || selectedSet.has(nodeId));

            // 1. 临时辅助节点 (temp) -> 渲染为交叉 ×
            if (n.type === 'temp') {
                var tempG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                tempG.setAttribute('data-node-id', nodeId);
                tempG.style.cursor = 'pointer';

                var l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                l1.setAttribute('x1', n.x - 4); l1.setAttribute('y1', n.y - 4);
                l1.setAttribute('x2', n.x + 4); l1.setAttribute('y2', n.y + 4);
                l1.setAttribute('stroke', isSelected ? '#38bdf8' : '#64748b');
                l1.setAttribute('stroke-width', '2');

                var l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                l2.setAttribute('x1', n.x - 4); l2.setAttribute('y1', n.y + 4);
                l2.setAttribute('x2', n.x + 4); l2.setAttribute('y2', n.y - 4);
                l2.setAttribute('stroke', isSelected ? '#38bdf8' : '#64748b');
                l2.setAttribute('stroke-width', '2');

                tempG.appendChild(l1);
                tempG.appendChild(l2);
                dom.stationLayer.appendChild(tempG);
                return;
            }

            // 2. 车站节点 (station 图元)
            var stType = n.notOpen ? 'no' : (n.type || 'dot');
            var size = 10;
            if (iconsEngine && iconsEngine.STATION_SIZE) {
                size = iconsEngine.STATION_SIZE[stType] || 10;
            }

            var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', 'translate(' + (n.x - size / 2) + ', ' + (n.y - size / 2) + ')');
            g.setAttribute('data-node-id', nodeId);
            g.style.cursor = 'pointer';

            // 优先使用 core/station-icons.js 模版
            if (iconsEngine && typeof iconsEngine.iconHtmlFor === 'function') {
                var colors = [];
                if (opt.lineColorsMap && opt.lineColorsMap[nodeId]) {
                    colors = opt.lineColorsMap[nodeId];
                }
                var iconHtml = iconsEngine.iconHtmlFor({ type: stType, lineColors: colors });
                // 彻底剥离外层 <svg...> 与 </svg> 标签，将内部原生图形元素直接填入 <g>
                var innerShapes = iconHtml
                    ? iconHtml.replace(/^<svg[^>]*>/i, '').replace(/<\/svg>$/i, '')
                    : '';
                g.innerHTML = innerShapes;
            } else {
                // 兜底圆形
                var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', size / 2);
                circle.setAttribute('cy', size / 2);
                circle.setAttribute('r', size / 2);
                circle.setAttribute('fill', '#ffffff');
                circle.setAttribute('stroke', '#00263b');
                circle.setAttribute('stroke-width', '2');
                g.appendChild(circle);
            }

            if (isSelected) {
                var halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                halo.setAttribute('cx', size / 2);
                halo.setAttribute('cy', size / 2);
                halo.setAttribute('r', (size / 2) + 4);
                halo.setAttribute('fill', 'none');
                halo.setAttribute('stroke', '#38bdf8');
                halo.setAttribute('stroke-width', '2.5');
                halo.setAttribute('pointer-events', 'none');
                g.appendChild(halo);
            }

            dom.stationLayer.appendChild(g);

            // 3. 站名文字标注 (labelLayer，采用与主地图 100% 相同的 DOM 渲染标准)
            if (dom.labelLayer && !n.hideLabel && (n.cn || n.en)) {
                var layout = calculateLabelLayout(n);
                var scaleCn = (n.textScale && n.textScale.cn) ? n.textScale.cn : 1;
                var scaleEn = (n.textScale && n.textScale.en) ? n.textScale.en : 1;

                var fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                fo.setAttribute('x', String(layout.x));
                fo.setAttribute('y', String(layout.y));
                fo.setAttribute('width', '1');
                fo.setAttribute('height', '1');
                fo.setAttribute('data-node-id', nodeId);
                fo.style.overflow = 'visible';
                fo.style.pointerEvents = 'none';

                var labelDiv = document.createElement('div');
                labelDiv.className = 'label-group type-' + stType + (isSelected ? ' active' : '');
                labelDiv.setAttribute('data-node-id', nodeId);
                labelDiv.style.transform = layout.transform;
                labelDiv.style.textAlign = layout.textAlign;
                labelDiv.style.pointerEvents = 'auto';
                labelDiv.style.cursor = 'pointer';

                var innerHtml = '';
                if (n.cn) {
                    innerHtml += '<span class="stacn" style="transform:scaleX(' + scaleCn + ');transform-origin:' + layout.transformOriginX + ' center;">' + escapeHtml(n.cn) + '</span>';
                }
                if (n.en) {
                    innerHtml += '<span class="staen" lang="en" style="transform:scaleX(' + scaleEn + ');transform-origin:' + layout.transformOriginX + ' center;">' + escapeHtml(n.en) + '</span>';
                }

                labelDiv.innerHTML = innerHtml;
                fo.appendChild(labelDiv);
                dom.labelLayer.appendChild(fo);
            }
        });
    }

    return {
        init: init,
        render: render,
        calculateLabelLayout: calculateLabelLayout,
        labelOffsetFor: labelOffsetFor,
        getStationIconsEngine: getStationIconsEngine
    };
})();

// 保留全局别名兼容
window.StationLayer = window.OpenMapEditor.StationLayer;

