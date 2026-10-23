/**
 * 开放地图编辑器 (OpenMap Editor) - 矢量线路走向与折点手柄层
 * 强制调用 core/path-geometry.js 生成平滑倒角 path，并与主地图 main.html 描边规范 100% 对齐：
 * 1. 外描边底色 (line-visual-outer): 7px stroke-width，底色隔离相交线路防粘连与分叉白缝；
 * 2. 实体内描边 (line-visual-inner): 5.4px stroke-width，线路标志色，端点与拐角全圆角；
 * 3. 纹理叠加层 (line-visual-overlay): 支持市郊铁路/国铁 overlayStyle；
 * 4. 未开通虚线 (line-visual-notopen): 3.4px stroke-width，6,6 虚线，圆角端点；
 * 5. 交互判定热区 (line-interaction): 15px 透明热区，提供精准点击拾取与折点手柄。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.VectorRouteLayer = (function () {
    'use strict';

    var dom = {
        lineLayer: null,
        handleLayer: null
    };

    var NOT_OPEN_STYLE = {
        color: '#94a3b8',
        width: 3.4,
        dashArray: '6,6'
    };

    function init(lineLayerEl, handleLayerEl) {
        dom.lineLayer = lineLayerEl;
        dom.handleLayer = handleLayerEl;
    }

    function getGeometryEngine() {
        return window.CGoPathGeometry;
    }

    /**
     * 渲染线路图元及折点手柄
     * @param {Object} project 工程数据对象
     * @param {Object} options { selectedSegmentId, selectedLineId, activeLineId, isNotOpenMode }
     */
    function render(project, options) {
        if (!dom.lineLayer) return;
        dom.lineLayer.innerHTML = '';
        if (dom.handleLayer) dom.handleLayer.innerHTML = '';
        if (!project || !project.segments) return;

        var opt = options || {};
        var geom = getGeometryEngine();

        // 建立线路色彩与配置映射表
        var lineMap = {};
        (project.lines || []).forEach(function (l) {
            lineMap[l.id] = l;
        });

        // 分层收集器：外描边底色 -> 未开通层 -> 实体主题层 -> 叠加纹理层 -> 交互与高亮层
        // 确保所有外描边在最底层，绝不会在 Y 形分歧处遮挡先画线段留下白缝
        var outerLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        outerLayer.setAttribute('class', 'lines-outer-group');

        var notOpenLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        notOpenLayer.setAttribute('class', 'lines-notopen-group');

        var innerLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        innerLayer.setAttribute('class', 'lines-inner-group');

        var overlayLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        overlayLayer.setAttribute('class', 'lines-overlay-group');

        var highlightLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        highlightLayer.setAttribute('class', 'lines-highlight-group');

        var interactionLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        interactionLayer.setAttribute('class', 'lines-interaction-group');

        project.segments.forEach(function (seg) {
            var pts = seg.points || [];
            if (pts.length < 2) return;

            var lineConf = lineMap[seg.lineId] || {};
            var strict = !!lineConf.useStrictRounding;

            // 调用唯一真源倒角生成算法
            var pathD = '';
            if (geom && typeof geom.generateRoundedPath === 'function') {
                pathD = geom.generateRoundedPath(pts, strict);
            } else {
                pathD = 'M ' + pts[0].x + ' ' + pts[0].y;
                for (var i = 1; i < pts.length; i++) {
                    pathD += ' L ' + pts[i].x + ' ' + pts[i].y;
                }
            }

            if (!pathD) return;

            var isSelected = (seg.id === opt.selectedSegmentId || (opt.selectedLineId && seg.lineId === opt.selectedLineId));

            if (seg.notOpen) {
                // 1. 未开通/在建虚线走向 (严格对齐主地图 renderNotOpenLines)
                var pathNotOpen = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathNotOpen.setAttribute('d', pathD);
                pathNotOpen.setAttribute('class', 'line-visual-notopen');
                pathNotOpen.setAttribute('stroke', lineConf.notOpenColor || NOT_OPEN_STYLE.color);
                pathNotOpen.setAttribute('stroke-width', String(NOT_OPEN_STYLE.width));
                pathNotOpen.setAttribute('stroke-dasharray', NOT_OPEN_STYLE.dashArray);
                pathNotOpen.setAttribute('stroke-linecap', 'round');
                pathNotOpen.setAttribute('stroke-linejoin', 'round');
                pathNotOpen.setAttribute('fill', 'none');
                notOpenLayer.appendChild(pathNotOpen);
            } else {
                // 2. 常规线路：底层 7px 外描边 (主地图规范：隔离不同相交线路，增强立体可读性)
                var pathOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathOuter.setAttribute('d', pathD);
                pathOuter.setAttribute('class', 'line-visual-outer');
                pathOuter.setAttribute('stroke', 'var(--map-bg, #ffffff)');
                pathOuter.setAttribute('stroke-width', '7');
                pathOuter.setAttribute('stroke-linecap', 'round');
                pathOuter.setAttribute('stroke-linejoin', 'round');
                pathOuter.setAttribute('fill', 'none');
                outerLayer.appendChild(pathOuter);

                // 3. 常规线路：表层 5.4px 实体主题色描边 (主地图规范)
                var pathInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathInner.setAttribute('d', pathD);
                pathInner.setAttribute('class', 'line-visual-inner');
                pathInner.setAttribute('stroke', lineConf.color || '#00263b');
                pathInner.setAttribute('stroke-width', '5.4');
                pathInner.setAttribute('stroke-linecap', 'round');
                pathInner.setAttribute('stroke-linejoin', 'round');
                pathInner.setAttribute('fill', 'none');
                innerLayer.appendChild(pathInner);

                // 4. 叠加纹理 (例如市郊铁路/国铁 overlayStyle)
                if (lineConf.overlayStyle) {
                    var pathOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    pathOverlay.setAttribute('d', pathD);
                    pathOverlay.setAttribute('class', 'line-visual-overlay');
                    pathOverlay.setAttribute('stroke', lineConf.overlayStyle.color || '#000000');
                    pathOverlay.setAttribute('stroke-width', String(lineConf.overlayStyle.width || 2));
                    if (lineConf.overlayStyle.opacity !== undefined) {
                        pathOverlay.setAttribute('stroke-opacity', String(lineConf.overlayStyle.opacity));
                    }
                    if (lineConf.overlayStyle.dashArray) {
                        pathOverlay.setAttribute('stroke-dasharray', lineConf.overlayStyle.dashArray);
                    }
                    pathOverlay.setAttribute('stroke-linecap', 'butt');
                    pathOverlay.setAttribute('fill', 'none');
                    overlayLayer.appendChild(pathOverlay);
                }
            }

            // 5. 选中高亮光晕 (Halo)
            if (isSelected) {
                var halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                halo.setAttribute('d', pathD);
                halo.setAttribute('fill', 'none');
                halo.setAttribute('stroke', '#38bdf8');
                halo.setAttribute('stroke-width', '11');
                halo.setAttribute('stroke-linecap', 'round');
                halo.setAttribute('stroke-linejoin', 'round');
                halo.setAttribute('opacity', '0.65');
                halo.setAttribute('pointer-events', 'none');
                highlightLayer.appendChild(halo);
            }

            // 6. 交互判定热区 (15px 透明加宽路径，确保微小线段也能轻松点选)
            var pathHit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathHit.setAttribute('d', pathD);
            pathHit.setAttribute('class', 'line-interaction');
            pathHit.setAttribute('data-segment-id', seg.id);
            pathHit.setAttribute('data-line-id', seg.lineId || '');
            pathHit.setAttribute('stroke', 'transparent');
            pathHit.setAttribute('stroke-width', '15');
            pathHit.setAttribute('stroke-linecap', 'round');
            pathHit.setAttribute('stroke-linejoin', 'round');
            pathHit.setAttribute('fill', 'none');
            pathHit.style.cursor = 'pointer';
            interactionLayer.appendChild(pathHit);

            // 7. 选中的线段渲染折点控制手柄
            if (isSelected && dom.handleLayer) {
                pts.forEach(function (p, pIdx) {
                    var handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    handle.setAttribute('cx', p.x);
                    handle.setAttribute('cy', p.y);
                    handle.setAttribute('r', pIdx === 0 || pIdx === pts.length - 1 ? '5' : '4');
                    handle.setAttribute('fill', p.nid ? '#10b981' : '#ffffff');
                    handle.setAttribute('stroke', '#0284c7');
                    handle.setAttribute('stroke-width', '2');
                    handle.setAttribute('data-seg-id', seg.id);
                    handle.setAttribute('data-point-idx', pIdx);
                    handle.style.cursor = 'grab';
                    dom.handleLayer.appendChild(handle);
                });
            }
        });

        // 统一按 外描边 -> 未开通 -> 实体描边 -> 叠加纹理 -> 高亮光圈 -> 交互热区 顺序挂载
        dom.lineLayer.appendChild(outerLayer);
        dom.lineLayer.appendChild(notOpenLayer);
        dom.lineLayer.appendChild(innerLayer);
        dom.lineLayer.appendChild(overlayLayer);
        dom.lineLayer.appendChild(highlightLayer);
        dom.lineLayer.appendChild(interactionLayer);
    }

    return {
        init: init,
        render: render,
        getGeometryEngine: getGeometryEngine
    };
})();

// 保留全局别名兼容
window.VectorRouteLayer = window.OpenMapEditor.VectorRouteLayer;
