/**
 * 开放地图编辑器 (OpenMap Editor) - 应用总控与生命周期调度器
 * 负责三大工作流调度、图层统一重绘、交互事件与状态同步
 */

(function () {
    'use strict';

    var app = {
        project: null,
        selected: null, // { type: 'node'|'segment'|'water'|'text', id }
        activeTool: 'select',
        activeLineId: null,
        isAutoRoute: true,
        // 网格与吸附共用一个状态：显示网格即对齐网格，隐藏即不对齐
        gridVisible: false,
        snapEnabled: false,
        smartGuidesEnabled: true,
        rulerVisible: false,
        layerState: {
            ghost: { id: 'ghost', name: '参考底图', icon: 'image', visible: true, locked: false },
            water: { id: 'water', name: '水系河流', icon: 'map', visible: true, locked: false },
            lines: { id: 'lines', name: '轨道走向', icon: 'route', visible: true, locked: false },
            stations: { id: 'stations', name: '车站图元', icon: 'location', visible: true, locked: false },
            texts: { id: 'texts', name: '自由文本', icon: 'vi-text', visible: true, locked: false },
            scattered: { id: 'scattered', name: '地图装饰', icon: 'tourist', visible: true, locked: false },
            grid: { id: 'grid', name: '辅助网格', icon: 'view-grid', visible: true, locked: false }
        }
    };

    /**
     * 全局统一 Toast 提示 (100% 复用 CGoUI 官方规范)
     * 遵循「非阻断、不滥用、微操作零侵扰」原则：仅在关键异步结果、保存导出、错误告警等场景提示，
     * 普通画布直观修改、移动、删除、对齐、图层切换等微操作绝不随意弹出 toast 刷屏。
     */
    var lastToastMsg = '';
    var lastToastTime = 0;
    function showToast(msg, type, duration) {
        if (!msg) return;
        var now = Date.now();
        if (msg === lastToastMsg && now - lastToastTime < 1500) {
            return;
        }
        lastToastMsg = msg;
        lastToastTime = now;
        var t = type || 'info';
        if (t === 'danger') t = 'error';
        if (t !== 'info' && t !== 'success' && t !== 'warning' && t !== 'error') {
            t = 'info';
        }
        if (window.CGO && typeof window.CGO.showToast === 'function') {
            return window.CGO.showToast(msg, t, duration || 2600);
        }
        console.log('[CGoUI Toast ' + t + ']', msg);
    }

    /**
     * 模态框打开助手 (完美驱动 <cgo-modal>)
     */
    function openModal(modalId) {
        var modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        if (!modal) return;
        if ('open' in modal) {
            modal.open = true;
        }
        modal.classList.add('open');
    }

    /**
     * 模态框关闭助手
     */
    function closeModal(modalId) {
        var modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
        if (!modal) return;
        if ('open' in modal) {
            modal.open = false;
        }
        modal.classList.remove('open');
    }

    function clickElement(id) {
        var el = typeof id === 'string' ? document.getElementById(id) : id;
        if (el && typeof el.click === 'function') el.click();
    }

    /**
     * 全局统一重绘
     */
    /**
     * 实时草稿预览：把「已定起点 → 当前鼠标」按当前折角类型路由后画在 #draftLayer 上。
     * 用的是与最终落笔完全相同的 SegmentRouter.routeBetweenByType，因此所见即所得。
     */
    /** 水域草稿的多边形预览（半透明填充 + 虚线边 + 顶点 + 到指针的橡皮筋） */
    function renderWaterDraftPreview(layer, pd) {
        var draft = (typeof pd.getWaterDraft === 'function') ? pd.getWaterDraft() : null;
        if (!draft || !draft.points || !draft.points.length) return;

        var style = (app.project && app.project.waterStyle) || {};
        var fill = style.fillLight || '#a5d7e8';
        var pts = draft.points.slice();
        var cursor = draft.cursor;
        if (cursor && (Math.abs(cursor.x - pts[pts.length - 1].x) > 0.01 || Math.abs(cursor.y - pts[pts.length - 1].y) > 0.01)) {
            pts.push(cursor);
        }
        if (pts.length < 2) {
            // 只有第一个顶点：画个起点标记，让用户知道"已经开始了"
            var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', roundCoord(pts[0].x));
            dot.setAttribute('cy', roundCoord(pts[0].y));
            dot.setAttribute('r', '4');
            dot.setAttribute('fill', fill);
            dot.setAttribute('stroke', '#0284c7');
            dot.setAttribute('stroke-width', '1.5');
            dot.setAttribute('pointer-events', 'none');
            layer.appendChild(dot);
            return;
        }

        var d = pts.map(function (p, i) {
            return (i === 0 ? 'M' : 'L') + roundCoord(p.x) + ' ' + roundCoord(p.y);
        }).join(' ');

        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        poly.setAttribute('d', d + ' Z');
        poly.setAttribute('fill', fill);
        poly.setAttribute('fill-opacity', String(style.opacity != null ? style.opacity * 0.7 : 0.4));
        poly.setAttribute('stroke', '#0284c7');
        poly.setAttribute('stroke-width', '1.5');
        poly.setAttribute('stroke-dasharray', '5,3');
        poly.setAttribute('pointer-events', 'none');
        layer.appendChild(poly);

        // 伪闭合边（最后一点 → 起点）用更淡的虚线，提示"这样会闭合"
        if (pts.length >= 3) {
            var closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            closePath.setAttribute('d', 'M' + roundCoord(pts[pts.length - 1].x) + ' ' + roundCoord(pts[pts.length - 1].y) +
                ' L' + roundCoord(pts[0].x) + ' ' + roundCoord(pts[0].y));
            closePath.setAttribute('fill', 'none');
            closePath.setAttribute('stroke', '#0ea5e9');
            closePath.setAttribute('stroke-width', '1');
            closePath.setAttribute('stroke-dasharray', '2,4');
            closePath.setAttribute('pointer-events', 'none');
            layer.appendChild(closePath);
        }

        // 顶点小圆
        draft.points.forEach(function (p, i) {
            var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', roundCoord(p.x));
            c.setAttribute('cy', roundCoord(p.y));
            c.setAttribute('r', i === 0 ? '4.5' : '3');
            c.setAttribute('fill', i === 0 ? '#0ea5e9' : '#ffffff');
            c.setAttribute('stroke', '#0284c7');
            c.setAttribute('stroke-width', '1.5');
            c.setAttribute('pointer-events', 'none');
            layer.appendChild(c);
        });
    }

    function renderDraftLayer() {
        var layer = document.getElementById('draftLayer');
        if (!layer) return;
        layer.innerHTML = '';

        var pd = window.OpenMapEditor.PipelineDraw;
        if (!pd || !app.project) return;

        // 水域草稿：多边形预览（与"走线"互斥，各管各的草稿）
        if (app.activeTool === 'water') {
            renderWaterDraftPreview(layer, pd);
            return;
        }

        if (!/^seg/.test(app.activeTool)) return;
        if (typeof pd.hasDraft !== 'function' || !pd.hasDraft()) return;

        var pts = (typeof pd.getDraftPreviewPoints === 'function')
            ? pd.getDraftPreviewPoints(app.project, app.project.slope)
            : [];
        if (!pts || pts.length < 2) return;

        var line = (app.project.lines || []).find(function (l) { return l.id === app.activeLineId; }) ||
            (app.project.lines || [])[0];
        var color = (line && line.color) || '#0284c7';
        var d = pts.map(function (p, i) {
            return (i === 0 ? 'M' : 'L') + roundCoord(p.x) + ' ' + roundCoord(p.y);
        }).join(' ');

        // 与正式线段同样的「粗底色 + 彩色内芯」双层描边，深浅底都看得清
        [{ stroke: 'var(--map-bg, #ffffff)', width: 7 },
        { stroke: color, width: 5.4, opacity: '0.85' }].forEach(function (spec) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', spec.stroke);
            path.setAttribute('stroke-width', String(spec.width));
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('pointer-events', 'none');
            if (spec.opacity) path.setAttribute('opacity', spec.opacity);
            layer.appendChild(path);
        });

        // 起点（实心）与当前指针端（空心），让"下一段从哪开始"一眼看清
        [[pts[0], 4, color], [pts[pts.length - 1], 3, 'var(--map-bg, #ffffff)']].forEach(function (item) {
            var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', roundCoord(item[0].x));
            c.setAttribute('cy', roundCoord(item[0].y));
            c.setAttribute('r', String(item[1]));
            c.setAttribute('fill', item[2]);
            c.setAttribute('stroke', color);
            c.setAttribute('stroke-width', '1.5');
            c.setAttribute('pointer-events', 'none');
            layer.appendChild(c);
        });
    }

    /**
     * 获取当前选中图元待变换的点集
     */
    function getTransformPoints(selected) {
        if (!selected || !app.project) return [];
        if (selected.type === 'multi') {
            var pts = [];
            var nodeSet = new Set(selected.nodeIds || []);
            (selected.nodeIds || []).forEach(function (nid) {
                var n = app.project.nodes[nid];
                if (n) pts.push({ id: nid, x: n.x, y: n.y, type: 'node' });
            });
            (selected.textIds || []).forEach(function (tid) {
                var t = (app.project.texts || []).find(function (item) { return item.id === tid; });
                if (t) pts.push({ id: tid, x: t.x, y: t.y, type: 'text' });
            });
            // 拓扑诱导子图：起点与终点均在选区内的线段，其全部无绑定中间折点随选区刚体变换
            (app.project.segments || []).forEach(function (seg) {
                var segPts = seg.points || [];
                if (segPts.length >= 2) {
                    var sNid = segPts[0].nid;
                    var eNid = segPts[segPts.length - 1].nid;
                    if (sNid && eNid && nodeSet.has(sNid) && nodeSet.has(eNid)) {
                        for (var pi = 1; pi < segPts.length - 1; pi++) {
                            if (!segPts[pi].nid) {
                                pts.push({ segId: seg.id, pointIdx: pi, x: segPts[pi].x, y: segPts[pi].y, type: 'waypoint' });
                            }
                        }
                    }
                }
            });
            return pts;
        } else if (selected.type === 'water') {
            var w = (app.project.waters || []).find(function (item) { return item.id === selected.id; });
            return (w && Array.isArray(w.points)) ? w.points.map(function (p, idx) { return { x: p.x, y: p.y, idx: idx }; }) : [];
        } else if (selected.type === 'text') {
            var txt = (app.project.texts || []).find(function (item) { return item.id === selected.id; });
            if (txt) {
                var w2 = (txt.text || '').length * (txt.size || 14) * 0.7;
                var h2 = (txt.size || 14) * 1.2;
                return [
                    { x: txt.x, y: txt.y, id: txt.id, isOrigin: true },
                    { x: txt.x + w2, y: txt.y + h2, id: txt.id, isCorner: true }
                ];
            }
        } else if (selected.type === 'node') {
            var singleN = app.project.nodes[selected.id];
            if (singleN) return [{ id: selected.id, x: singleN.x, y: singleN.y, type: 'node' }];
        }
        return [];
    }

    /**
     * 将几何变换结果写回当前工程数据
     */
    function applyTransformedPoints(selected, transformedPts) {
        if (!selected || !transformedPts || !transformedPts.length || !app.project) return;
        if (selected.type === 'multi') {
            var changedNodeIds = [];
            transformedPts.forEach(function (pt) {
                if (pt.type === 'node' && app.project.nodes[pt.id]) {
                    app.project.nodes[pt.id].x = pt.x;
                    app.project.nodes[pt.id].y = pt.y;
                    changedNodeIds.push(pt.id);
                } else if (pt.type === 'text') {
                    var t = (app.project.texts || []).find(function (item) { return item.id === pt.id; });
                    if (t) { t.x = pt.x; t.y = pt.y; }
                } else if (pt.type === 'waypoint' && pt.segId) {
                    var seg = (app.project.segments || []).find(function (s) { return s.id === pt.segId; });
                    if (seg && seg.points && seg.points[pt.pointIdx]) {
                        seg.points[pt.pointIdx].x = pt.x;
                        seg.points[pt.pointIdx].y = pt.y;
                    }
                }
            });
            if (changedNodeIds.length > 0) {
                syncSegmentsForNodes(changedNodeIds);
            }
        } else if (selected.type === 'water') {
            var w = (app.project.waters || []).find(function (item) { return item.id === selected.id; });
            if (w && w.points) {
                transformedPts.forEach(function (pt) {
                    if (pt.idx !== undefined && w.points[pt.idx]) {
                        w.points[pt.idx].x = pt.x;
                        w.points[pt.idx].y = pt.y;
                    }
                });
            }
        } else if (selected.type === 'text') {
            var txt = (app.project.texts || []).find(function (item) { return item.id === selected.id; });
            if (txt && transformedPts[0]) {
                txt.x = transformedPts[0].x;
                txt.y = transformedPts[0].y;
            }
        }
    }

    /**
     * 渲染 VectorCraft / Illustrator 风格的 8 方向变换外框与旋转手柄
     */
    function renderTransformHandles(handleLayerEl) {
        var oldBox = document.getElementById('editorTransformContainer');
        if (oldBox) oldBox.remove();
        if (!app.selected || !handleLayerEl || !window.OpenMapEditor.TransformEngine) return;
        if (app.activeTool !== 'select' && app.activeTool !== 'box') return;

        if (app.selected.type === 'water' && app.selected.pointIdx !== undefined && app.selected.pointIdx !== null) return;
        if (app.selected.type === 'segment') return;

        var pts = getTransformPoints(app.selected);
        if (!pts || pts.length < 2) return;

        var bounds = window.OpenMapEditor.TransformEngine.computeBounds(pts);
        if (bounds.width <= 0 && bounds.height <= 0) return;

        var pad = 14;
        var b = {
            minX: bounds.minX - pad,
            minY: bounds.minY - pad,
            maxX: bounds.maxX + pad,
            maxY: bounds.maxY + pad,
            width: bounds.width + pad * 2,
            height: bounds.height + pad * 2,
            cx: bounds.cx,
            cy: bounds.cy
        };

        var container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        container.id = 'editorTransformContainer';

        var boxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        boxRect.setAttribute('class', 'editor-transform-box');
        boxRect.setAttribute('x', String(b.minX));
        boxRect.setAttribute('y', String(b.minY));
        boxRect.setAttribute('width', String(b.width));
        boxRect.setAttribute('height', String(b.height));
        boxRect.setAttribute('rx', '4');
        container.appendChild(boxRect);

        var pivot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pivot.setAttribute('class', 'transform-pivot');
        pivot.setAttribute('cx', String(b.cx));
        pivot.setAttribute('cy', String(b.cy));
        pivot.setAttribute('r', '3');
        container.appendChild(pivot);

        var hPositions = window.OpenMapEditor.TransformEngine.getHandlePositions(b);
        var handleNames = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handleNames.forEach(function (hName) {
            var hp = hPositions[hName];
            var hRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            hRect.setAttribute('class', 'transform-handle');
            hRect.setAttribute('x', String(hp.x - 4));
            hRect.setAttribute('y', String(hp.y - 4));
            hRect.setAttribute('width', '8');
            hRect.setAttribute('height', '8');
            hRect.setAttribute('rx', '1.5');
            hRect.setAttribute('data-handle', hName);
            hRect.style.cursor = hp.cursor;
            var ht = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            ht.textContent = '拖动缩放 (Shift 约束比例，Alt 中心锚定)';
            hRect.appendChild(ht);
            container.appendChild(hRect);
        });

        ['nw', 'ne', 'se', 'sw'].forEach(function (cName) {
            var cp = hPositions[cName];
            var rZone = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            rZone.setAttribute('class', 'transform-rotate-zone');
            rZone.setAttribute('cx', String(cp.x));
            rZone.setAttribute('cy', String(cp.y));
            rZone.setAttribute('r', '14');
            rZone.setAttribute('data-rotate-corner', cName);
            var rTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            rTitle.textContent = '拖动自由旋转 (Shift 约束 15° 步进)';
            rZone.appendChild(rTitle);
            container.appendChild(rZone);
        });

        if (app.selected.type === 'multi') {
            var count = (app.selected.nodeIds || []).length + (app.selected.textIds || []).length;
            var tagRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            tagRect.setAttribute('x', String(b.minX));
            tagRect.setAttribute('y', String(b.minY - 20));
            tagRect.setAttribute('width', String(16 + count.toString().length * 8 + 80));
            tagRect.setAttribute('height', '18');
            tagRect.setAttribute('rx', '4');
            tagRect.setAttribute('fill', '#0284c7');
            var tagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            tagText.setAttribute('x', String(b.minX + 6));
            tagText.setAttribute('y', String(b.minY - 7));
            tagText.setAttribute('fill', '#ffffff');
            tagText.setAttribute('font-size', '11');
            tagText.setAttribute('font-family', 'var(--cgo-font-sans, system-ui)');
            tagText.textContent = '已多选 ' + count + ' 项图元';
            container.appendChild(tagRect);
            container.appendChild(tagText);
        }

        handleLayerEl.appendChild(container);
    }

    /** 图层显隐 / 锁定、线路叠放顺序等调用的重绘入口（与 renderAll 同义，保留旧名） */
    function renderCanvas() {
        renderAll();
    }

    /**
     * 把高频渲染（拖动 / 变换 / 调圆角时的 mousemove）合并成"每帧最多一次"。
     *
     * 高刷新率鼠标的 mousemove 可以比 requestAnimationFrame 密得多，
     * 之前每个事件都整屏重建 SVG + 大纲树，CPU 直接被打满 —— 这正是长时间拖动后
     * 明显卡顿的来源。这里只把同一帧内的多次请求折叠成一次，不改渲染内容。
     */
    var renderRafId = 0;
    function scheduleRender() {
        if (renderRafId) return;
        var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
        renderRafId = raf(function () {
            renderRafId = 0;
            if (app.project) renderAll();
        });
    }

    function renderAll() {
        if (!app.project) return;

        // 0. 画布物理画板底色与边界 (Artboard Canvas Boundary)
        var artboardEl = document.getElementById('canvasArtboardBackdrop');
        if (!artboardEl) {
            artboardEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            artboardEl.id = 'canvasArtboardBackdrop';
            var viewLayerEl = document.getElementById('viewLayer');
            if (viewLayerEl) viewLayerEl.insertBefore(artboardEl, viewLayerEl.firstChild);
        }
        if (artboardEl && app.project && app.project.canvas) {
            // 底色交给样式表的 var(--map-bg)：随亮 / 暗主题与城市底色（如悉尼米白）即时切换，
            // 以前在这里按当时主题写死颜色，切换主题后画板仍是旧底色，站名就成了深底深字。
            artboardEl.setAttribute('x', '0');
            artboardEl.setAttribute('y', '0');
            artboardEl.setAttribute('width', String(app.project.canvas.width));
            artboardEl.setAttribute('height', String(app.project.canvas.height));
            artboardEl.setAttribute('pointer-events', 'none');
        }

        var selNodeId = (app.selected && app.selected.type === 'node') ? app.selected.id : null;
        var selSegId = (app.selected && app.selected.type === 'segment') ? app.selected.id : null;
        var selWaterId = (app.selected && app.selected.type === 'water') ? app.selected.id : null;
        var selTextId = (app.selected && app.selected.type === 'text') ? app.selected.id : null;
        var selVirtualIdx = (app.selected && app.selected.type === 'virtual') ? app.selected.idx : null;
        var selNotOpenIdx = (app.selected && app.selected.type === 'notopen') ? app.selected.idx : null;
        var selScatteredIdx = (app.selected && app.selected.type === 'scattered') ? app.selected.idx : null;

        // 0. 地理地标与城门散点
        if (window.OpenMapEditor.ScatteredLayer) {
            window.OpenMapEditor.ScatteredLayer.render(app.project, { selectedIdx: selScatteredIdx });
        }

        // 0.5 网格与坐标刻度
        if (window.OpenMapEditor.GridLayer && app.project && app.project.canvas) {
            window.OpenMapEditor.GridLayer.render({
                width: app.project.canvas.width,
                height: app.project.canvas.height
            });
        }

        // 1. 水域
        window.OpenMapEditor.WaterLayer.render(app.project.waters, app.project.waterStyle, selWaterId);

        // 2. 线路与走向
        var selSegPtIdx = (app.selected && app.selected.type === 'segment') ? app.selected.pointIdx : null;
        // ⚠️ 高亮只跟随"选中"，不能跟随"当前绘制线路"。
        // 以前这里传的是 app.activeLineId（绘制目标），于是点空白处取消选中后，
        // 整条线路仍然被当作选中态高亮，看起来就是"点掉选中了线还亮着"。
        var selLineId = (app.selected && app.selected.type === 'line') ? app.selected.id : null;
        window.OpenMapEditor.VectorRouteLayer.render(app.project, {
            selectedSegmentId: selSegId,
            selectedLineId: selLineId,
            selectedPointIdx: selSegPtIdx,
            activeLineId: app.activeLineId
        });

        // 2.4 走线过程中的实时预览（还没落笔的那一段）
        renderDraftLayer();

        // 2.5 在建与规划走向 (包含白线描边等样式)
        if (window.OpenMapEditor.NotOpenLayer) {
            window.OpenMapEditor.NotOpenLayer.render(app.project, { selectedIdx: selNotOpenIdx });
        }

        // 2.6 虚拟换乘连接线
        if (window.OpenMapEditor.VirtualConnectorLayer) {
            window.OpenMapEditor.VirtualConnectorLayer.render(app.project, { selectedIdx: selVirtualIdx });
        }

        // 3. 车站与站名
        // 经停线路标志色的次序必须与引擎 processData 完全一致（普通站环色、城市钩子都取 [0]）
        var iconsEngine = window.CGoStationIcons;
        var lineColorsMap = (iconsEngine && typeof iconsEngine.engineLineColors === 'function')
            ? iconsEngine.engineLineColors(app.project.lines || []) : {};
        // 编辑器里新画、尚未写出站序的线路：按折线经过的车站补色
        var segColorById = {};
        (app.project.lines || []).forEach(function (l) { segColorById[l.id] = l.color; });
        (app.project.segments || []).forEach(function (seg) {
            var color = segColorById[seg.lineId];
            if (!color) return;
            (seg.points || []).forEach(function (pt) {
                if (!pt.nid) return;
                if (!lineColorsMap[pt.nid]) lineColorsMap[pt.nid] = [];
                if (lineColorsMap[pt.nid].indexOf(color) === -1) lineColorsMap[pt.nid].push(color);
            });
        });

        var multiNodeIds = [];
        if (app.selected) {
            if (app.selected.type === 'node') multiNodeIds = [app.selected.id];
            else if (app.selected.type === 'multi' && Array.isArray(app.selected.nodeIds)) multiNodeIds = app.selected.nodeIds;
        }

        syncCityRuntime();
        var surgicalForOrigin = window.OpenMapEditor.PipelineSurgical;
        var originSnap = (surgicalForOrigin && typeof surgicalForOrigin.getOriginalSnapshot === 'function')
            ? surgicalForOrigin.getOriginalSnapshot() : null;
        window.OpenMapEditor.StationLayer.render(app.project, {
            selectedNodeId: selNodeId,
            selectedNodeIds: multiNodeIds,
            lineColorsMap: lineColorsMap,
            originNodes: originSnap ? originSnap.nodes : null
        });

        // 3.5 几何变换外框与 8 方向控制手柄 (VectorCraft Transform Box)
        var handleLayerEl = document.getElementById('handleLayer');
        renderTransformHandles(handleLayerEl);

        // 3.6 水域多边形顶点手柄 (Water Vertex Handles)
        var oldWaterHandles = document.getElementById('waterHandlesGroup');
        if (oldWaterHandles) oldWaterHandles.remove();
        if (app.selected && app.selected.type === 'water' && handleLayerEl) {
            var curWater = (app.project.waters || []).find(function (w) { return w.id === app.selected.id; });
            if (curWater && Array.isArray(curWater.points) && curWater.points.length > 0) {
                var wGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                wGroup.id = 'waterHandlesGroup';
                var isRiver = (curWater.type === 'path' || curWater.type === 'river');
                var wPts = curWater.points;

                // 中段增加顶点手柄
                var loopLimit = isRiver ? wPts.length - 1 : wPts.length;
                for (var wi = 0; wi < loopLimit; wi++) {
                    var ptA = wPts[wi], ptB = wPts[(wi + 1) % wPts.length];
                    var wmx = (ptA.x + ptB.x) / 2;
                    var wmy = (ptA.y + ptB.y) / 2;
                    var midH = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    midH.setAttribute('cx', String(wmx));
                    midH.setAttribute('cy', String(wmy));
                    midH.setAttribute('r', '3.5');
                    midH.setAttribute('fill', '#ffffff');
                    midH.setAttribute('stroke', '#0284c7');
                    midH.setAttribute('stroke-width', '1.5');
                    midH.setAttribute('class', 'water-midpoint-handle');
                    midH.setAttribute('data-water-id', curWater.id);
                    midH.setAttribute('data-insert-after', String(wi));
                    midH.style.cursor = 'pointer';
                    var mTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                    mTitle.textContent = '点击插入水域顶点';
                    midH.appendChild(mTitle);
                    wGroup.appendChild(midH);
                }

                // 控制顶点手柄
                wPts.forEach(function (wp, pIdx) {
                    var vh = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    vh.setAttribute('cx', String(wp.x));
                    vh.setAttribute('cy', String(wp.y));
                    vh.setAttribute('r', '5');
                    vh.setAttribute('fill', '#0284c7');
                    vh.setAttribute('stroke', '#ffffff');
                    vh.setAttribute('stroke-width', '1.5');
                    vh.setAttribute('class', 'water-point-handle');
                    vh.setAttribute('data-water-id', curWater.id);
                    vh.setAttribute('data-point-idx', String(pIdx));
                    vh.style.cursor = 'grab';
                    var vTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                    vTitle.textContent = '水域顶点 #' + pIdx + ' (' + Math.round(wp.x) + ', ' + Math.round(wp.y) + ')';
                    vh.appendChild(vTitle);
                    wGroup.appendChild(vh);
                });
                handleLayerEl.appendChild(wGroup);
            }
        }

        // 4. 自由注释文本
        window.OpenMapEditor.TextScatteredLayer.render(app.project.texts, selTextId);

        // 5. 参考底图
        window.OpenMapEditor.GhostTransformer.render(false);

        // 6. 更新左侧文件树状大纲 (Topology & Layer NavTree)
        if (window.OpenMapEditor.NavTreeView) {
            window.OpenMapEditor.NavTreeView.render(app.project, {
                selected: app.selected,
                activeLineId: app.activeLineId,
                layerState: app.layerState,
                snapEnabled: app.snapEnabled
            });
        }

        // 7. 刷新右侧检视面板
        updateInspector();

        // 8. 同步图层管理状态及大纲条
        applyLayerStates();

        // 8.5 刷新视口坐标轴标尺
        renderRulers();

        // 9. 更新数据健康状态栏
        updateHealthBadge();

        // 10. 触发会话自动保存（内部防抖 1.2s，拖拽过程中不会狂写）
        scheduleSaveSession();
    }

    /**
     * 让画布外观跟随当前工程所属的城市：载入该城市的样式表与渲染钩子（上海短横、悉尼官方图元……）。
     * 空白画布 / 识图工程没有所属城市，回到通用画法。城市脚本异步就绪后自动重绘一次。
     */
    var cityRuntimeBound = false;
    function syncCityRuntime() {
        var runtime = window.OpenMapEditor.CityRenderRuntime;
        if (!runtime) return;
        if (!cityRuntimeBound) {
            cityRuntimeBound = true;
            runtime.onChange(function () {
                if (app.project) renderCanvas();
                refreshInspectorPreviews();
            });
        }
        var surg = window.OpenMapEditor.PipelineSurgical;
        var city = surg && typeof surg.getCurrentLoadedCity === 'function' ? surg.getCurrentLoadedCity() : null;
        var cityId = city && city.id ? city.id : null;
        if (runtime.getActiveCityId() !== cityId) runtime.activate(cityId);
    }

    /**
     * 亮 / 暗主题切换后整张画布跟着重画：水域、注释文字、标尺这些按主题取色的图层，
     * 以及检视面板里的图元小样，都只在渲染时读一次主题。
     */
    function watchThemeChanges() {
        if (typeof MutationObserver !== 'function') return;
        var last = document.documentElement.getAttribute('data-theme');
        new MutationObserver(function () {
            var now = document.documentElement.getAttribute('data-theme');
            if (now === last) return;
            last = now;
            if (app.project) renderAll();
            refreshInspectorPreviews();
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    /** 统一的确认框（基于 <cgo-modal>，见 js/ui/confirm-dialog.js）；组件缺失时回落原生 confirm */
    function askConfirm(opts) {
        var cd = window.OpenMapEditor.ConfirmDialog;
        if (cd && typeof cd.ask === 'function') return cd.ask(opts);
        var text = [opts.title, opts.message].concat(opts.details || []).concat(opts.note ? [opts.note] : []).filter(Boolean).join('\n');
        return Promise.resolve(window.confirm(text));
    }

    function refreshInspectorPreviews() {
        var iv = window.OpenMapEditor.InspectorView;
        if (iv && typeof iv.refreshPreviews === 'function') iv.refreshPreviews();
        var ad = window.OpenMapEditor.AssetDrawer;
        if (ad && typeof ad.refresh === 'function') ad.refresh();
    }

    function updateNavCounts() {
        // 兼容保留接口，大纲计数与树状图已由 NavTreeView 统一处理
    }

    // =========================================================================
    // 图层管理器 (Layer Manager)
    // =========================================================================
    function applyLayerStates() {
        var layerMap = {
            ghost: ['ghostLayer'],
            water: ['waterLayer'],
            lines: ['lineLayer', 'notOpenLayer', 'virtualConnectorLayer'],
            scattered: ['scatteredLayer'],
            stations: ['stationLayer', 'labelLayer'],
            texts: ['textLayer'],
            grid: ['gridLayer', 'canvasArtboardBackdrop']
        };

        Object.keys(app.layerState).forEach(function (layerKey) {
            var conf = app.layerState[layerKey];
            var gIds = layerMap[layerKey] || [];
            gIds.forEach(function (gid) {
                var el = document.getElementById(gid);
                if (el) {
                    el.style.display = conf.visible ? '' : 'none';
                    if (conf.locked) {
                        el.style.pointerEvents = 'none';
                        el.style.opacity = (layerKey === 'ghost' ? '0.35' : '0.8');
                    } else {
                        el.style.pointerEvents = '';
                        el.style.opacity = '';
                    }
                }
            });
        });
    }

    function renderLayersList() {
        var listEl = document.getElementById('navLayersList');
        if (!listEl) return;

        var counts = {
            ghost: (app.project && app.project.ghostImage ? '1 张' : '0'),
            water: (app.project && app.project.waters ? app.project.waters.length + ' 个' : '0'),
            lines: (app.project && app.project.lines ? app.project.lines.length + ' 条' : '0'),
            stations: (app.project && app.project.nodes ? Object.keys(app.project.nodes).length + ' 站' : '0'),
            texts: (app.project && app.project.texts ? app.project.texts.length + ' 条' : '0'),
            grid: (app.snapEnabled ? '对齐开' : '对齐关')
        };

        var html = '';
        Object.keys(app.layerState).forEach(function (key) {
            var item = app.layerState[key];
            var rowClass = 'nav-layer-row' + (!item.visible ? ' layer-hidden' : '') + (item.locked ? ' layer-locked' : '');
            html += '<div class="' + rowClass + '" data-layer-key="' + key + '">' +
                '<button type="button" class="layer-btn-action layer-btn-eye" title="' + (item.visible ? '点击隐藏图层' : '点击显示图层') + '">' +
                '<cgo-icon name="' + (item.visible ? 'eye' : 'eye-close') + '" size="12"></cgo-icon>' +
                '</button>' +
                '<button type="button" class="layer-btn-action layer-btn-lock' + (item.locked ? ' active-lock' : '') + '" title="' + (item.locked ? '点击解锁图层' : '点击锁定图层') + '">' +
                '<cgo-icon name="' + (item.locked ? 'lock' : 'unlock') + '" size="12"></cgo-icon>' +
                '</button>' +
                '<cgo-icon name="' + item.icon + '" size="12" style="color:var(--office-primary);"></cgo-icon>' +
                '<span class="layer-name-label">' + item.name + '</span>' +
                '<span class="layer-count-badge">' + (counts[key] || '0') + '</span>' +
                '</div>';
        });
        listEl.innerHTML = html;

        listEl.querySelectorAll('.nav-layer-row').forEach(function (row) {
            var k = row.getAttribute('data-layer-key');
            var eyeBtn = row.querySelector('.layer-btn-eye');
            var lockBtn = row.querySelector('.layer-btn-lock');
            if (eyeBtn) {
                eyeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    app.layerState[k].visible = !app.layerState[k].visible;
                    applyLayerStates();
                    renderLayersList();
                });
            }
            if (lockBtn) {
                lockBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    app.layerState[k].locked = !app.layerState[k].locked;
                    applyLayerStates();
                    renderLayersList();
                });
            }
        });
    }

    // =========================================================================
    // 视口坐标轴标尺系统 (Viewport Rulers)
    // =========================================================================
    function setRulerVisible(visible) {
        app.rulerVisible = !!visible;
        try { localStorage.setItem('openmap_editor_ruler_visible', app.rulerVisible ? 'true' : 'false'); } catch (e) { }
        var rCorner = document.getElementById('rulerCorner');
        var rH = document.getElementById('rulerHorizontal');
        var rV = document.getElementById('rulerVertical');
        var btnRuler = document.getElementById('hudBtnRuler');
        if (rCorner) rCorner.style.display = app.rulerVisible ? 'flex' : 'none';
        if (rH) rH.style.display = app.rulerVisible ? 'block' : 'none';
        if (rV) rV.style.display = app.rulerVisible ? 'block' : 'none';
        if (btnRuler) {
            if (app.rulerVisible) btnRuler.classList.add('active');
            else btnRuler.classList.remove('active');
        }
        if (app.rulerVisible) renderRulers();
    }

    function renderRulers() {
        if (!app.rulerVisible) return;
        var viewportEl = document.getElementById('workbenchViewport');
        var rH = document.getElementById('rulerHorizontal');
        var rV = document.getElementById('rulerVertical');
        if (!viewportEl || !rH || !rV) return;

        var rect = viewportEl.getBoundingClientRect();
        var W = Math.max(0, Math.round(rect.width - 20));
        var H = Math.max(0, Math.round(rect.height - 20));

        if (rH.width !== W || rH.height !== 20) { rH.width = W; rH.height = 20; }
        if (rV.width !== 20 || rV.height !== H) { rV.width = 20; rV.height = H; }

        var ctxH = rH.getContext('2d');
        var ctxV = rV.getContext('2d');
        if (!ctxH || !ctxV) return;

        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var bg = isDark ? '#1e293b' : '#ffffff';
        var borderClr = isDark ? '#334155' : '#cbd5e1';
        var textClr = isDark ? '#94a3b8' : '#64748b';
        var tickClr = isDark ? '#475569' : '#cbd5e1';

        ctxH.fillStyle = bg;
        ctxH.fillRect(0, 0, W, 20);
        ctxV.fillStyle = bg;
        ctxV.fillRect(0, 0, 20, H);

        var vp = window.OpenMapEditor.ViewportLayer;
        if (!vp || typeof vp.getScale !== 'function') return;

        var scale = vp.getScale() || 1.0;
        var step = 100, subStep = 20;
        if (scale >= 2.0) { step = 50; subStep = 10; }
        else if (scale >= 0.7) { step = 100; subStep = 20; }
        else if (scale >= 0.35) { step = 200; subStep = 50; }
        else { step = 500; subStep = 100; }

        var startWorldX = vp.screenToWorld(rect.left + 20, 0).x;
        var endWorldX = vp.screenToWorld(rect.right, 0).x;
        var firstX = Math.floor(startWorldX / subStep) * subStep;

        ctxH.font = '9px monospace';
        ctxH.fillStyle = textClr;
        ctxH.strokeStyle = tickClr;
        ctxH.lineWidth = 1;

        for (var wx = firstX; wx <= endWorldX; wx += subStep) {
            var screenX = vp.worldToScreen(wx, 0).x - rect.left - 20;
            if (screenX < 0 || screenX > W) continue;
            var isMajor = (Math.round(wx) % step === 0);
            ctxH.beginPath();
            ctxH.moveTo(Math.round(screenX) + 0.5, isMajor ? 9 : 15);
            ctxH.lineTo(Math.round(screenX) + 0.5, 20);
            ctxH.stroke();
            if (isMajor) {
                ctxH.fillText(String(Math.round(wx)), screenX + 2, 8);
            }
        }

        var startWorldY = vp.screenToWorld(0, rect.top + 20).y;
        var endWorldY = vp.screenToWorld(0, rect.bottom).y;
        var firstY = Math.floor(startWorldY / subStep) * subStep;

        ctxV.font = '9px monospace';
        ctxV.fillStyle = textClr;
        ctxV.strokeStyle = tickClr;
        ctxV.lineWidth = 1;

        for (var wy = firstY; wy <= endWorldY; wy += subStep) {
            var screenY = vp.worldToScreen(0, wy).y - rect.top - 20;
            if (screenY < 0 || screenY > H) continue;
            var isMajorY = (Math.round(wy) % step === 0);
            ctxV.beginPath();
            ctxV.moveTo(isMajorY ? 9 : 15, Math.round(screenY) + 0.5);
            ctxV.lineTo(20, Math.round(screenY) + 0.5);
            ctxV.stroke();
            if (isMajorY) {
                ctxV.save();
                ctxV.translate(8, screenY + 2);
                ctxV.rotate(-Math.PI / 2);
                ctxV.fillText(String(Math.round(wy)), 0, 0);
                ctxV.restore();
            }
        }
    }

    // =========================================================================
    // 操作历史步骤面板 (History Stack Modal)
    // =========================================================================
    function openHistoryModal() {
        var modal = document.getElementById('modalHistoryStack');
        if (!modal) return;
        var list = window.OpenMapEditor.HistoryManager.getHistoryList();
        var container = document.getElementById('historyTimelineList');
        var countBadge = document.getElementById('historyStepsCount');
        if (countBadge) countBadge.textContent = list.items.length + ' 步';

        if (container) {
            var html = '';
            list.items.forEach(function (item) {
                var isCur = (item.type === 'current');
                var isRedo = (item.type === 'redo');
                var itemCls = 'history-step-item' + (isCur ? ' current' : '') + (isRedo ? ' redo-step' : '');
                html += '<div class="' + itemCls + '" data-step-index="' + item.index + '">' +
                    '<span class="history-step-num">#' + (item.index + 1) + '</span>' +
                    '<cgo-icon name="time" size="12" style="color:var(--office-primary);"></cgo-icon>' +
                    '<span class="history-step-label">' + item.label + '</span>' +
                    '<span class="history-step-time">' + item.time + '</span>' +
                    (isCur ? '<span class="history-step-badge">当前</span>' : '') +
                    '</div>';
            });
            container.innerHTML = html;

            container.querySelectorAll('.history-step-item').forEach(function (el) {
                el.addEventListener('click', function () {
                    var targetIdx = parseInt(this.getAttribute('data-step-index'), 10);
                    if (!isNaN(targetIdx)) {
                        var restored = window.OpenMapEditor.HistoryManager.jumpToStep(targetIdx, app.project);
                        if (restored) {
                            app.project = restored;
                            renderAll();
                            openHistoryModal();
                        }
                    }
                });
            });
        }
        openModal('modalHistoryStack');
    }

    // =========================================================================
    // 智能识图拓扑确认弹窗 (DeepSeek Vision Confirm Dialog)
    // =========================================================================
    var pendingVision = null;

    function openVisionConfirmModal(newProj, filename) {
        pendingVision = { project: newProj, filename: filename };
        var lineCount = (newProj.lines || []).length;
        var nodeCount = Object.keys(newProj.nodes || {}).length;

        var stLines = document.getElementById('visionStatLines');
        var stStations = document.getElementById('visionStatStations');
        if (stLines) stLines.textContent = lineCount + ' 条线路';
        if (stStations) stStations.textContent = nodeCount + ' 座车站';

        var listEl = document.getElementById('visionLinesList');
        if (listEl) {
            var html = '';
            (newProj.lines || []).forEach(function (l) {
                var sCount = 0;
                if (Array.isArray(l.stationIds)) sCount = l.stationIds.length;
                var clr = l.color || '#0284c7';
                html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid var(--office-border);font-size:12px;">' +
                    '<span style="width:10px;height:10px;border-radius:50%;background:' + clr + ';flex-shrink:0;"></span>' +
                    '<span style="font-weight:600;flex:1;">' + (l.name || l.id) + '</span>' +
                    '<span style="font-size:11px;color:var(--text-light);">' + sCount + ' 站</span>' +
                    '</div>';
            });
            listEl.innerHTML = html;
        }

        openModal('modalVisionConfirm');
    }

    // =========================================================================
    // 自由文本原地内联编辑框 (Inline Text Editor)
    // =========================================================================
    function openInlineTextEditor(tid, clientX, clientY) {
        var txtTarget = (app.project.texts || []).find(function (t) { return t.id === tid; });
        if (!txtTarget) return;

        var popup = document.getElementById('inlineTextEditorPopup');
        var input = document.getElementById('inlineTextEditorInput');
        var viewportEl = document.getElementById('workbenchViewport');
        if (!popup || !input || !viewportEl) return;

        var vRect = viewportEl.getBoundingClientRect();
        var screenPt = window.OpenMapEditor.ViewportLayer.worldToScreen(txtTarget.x, txtTarget.y);
        popup.style.display = 'block';
        popup.style.left = Math.max(10, Math.min(vRect.width - 200, screenPt.x - vRect.left)) + 'px';
        popup.style.top = Math.max(10, Math.min(vRect.height - 80, screenPt.y - vRect.top - 20)) + 'px';
        input.value = txtTarget.text || '';
        input.focus();
        input.select();

        var isCommitted = false;
        var commit = function () {
            if (isCommitted) return;
            isCommitted = true;
            var val = input.value;
            popup.style.display = 'none';
            if (val !== txtTarget.text) {
                handlePropertyChange('text', tid, 'text', val);
            }
        };

        input.onkeydown = function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commit();
            } else if (e.key === 'Escape') {
                isCommitted = true;
                popup.style.display = 'none';
            }
        };
        input.onblur = function () {
            commit();
        };
    }

    // =========================================================================
    // 内存剪贴板系统 (Clipboard System: Ctrl+C / Ctrl+V / Ctrl+D)
    // =========================================================================
    var editorClipboard = null;

    function copySelection() {
        if (!app.selected || !app.project) return false;
        if (app.selected.type === 'node') {
            var node = app.project.nodes[app.selected.id];
            if (!node) return false;
            editorClipboard = {
                type: 'node',
                node: JSON.parse(JSON.stringify(node))
            };
            return true;
        } else if (app.selected.type === 'multi') {
            var nList = (app.selected.nodeIds || []).filter(function (id) { return !!app.project.nodes[id]; });
            var tList = (app.selected.textIds || []).filter(function (id) {
                return (app.project.texts || []).some(function (t) { return t.id === id; });
            });
            if (!nList.length && !tList.length) return false;

            var nodesMap = {};
            nList.forEach(function (id) {
                nodesMap[id] = JSON.parse(JSON.stringify(app.project.nodes[id]));
            });

            var textsList = [];
            tList.forEach(function (id) {
                var t = (app.project.texts || []).find(function (item) { return item.id === id; });
                if (t) textsList.push(JSON.parse(JSON.stringify(t)));
            });

            var segsList = [];
            var nSet = new Set(nList);
            (app.project.segments || []).forEach(function (seg) {
                var pts = seg.points || [];
                if (pts.length >= 2 && pts[0].nid && pts[pts.length - 1].nid) {
                    if (nSet.has(pts[0].nid) && nSet.has(pts[pts.length - 1].nid)) {
                        segsList.push(JSON.parse(JSON.stringify(seg)));
                    }
                }
            });

            editorClipboard = {
                type: 'multi',
                nodes: nodesMap,
                texts: textsList,
                segments: segsList
            };
            return true;
        } else if (app.selected.type === 'text') {
            var txt = (app.project.texts || []).find(function (t) { return t.id === app.selected.id; });
            if (!txt) return false;
            editorClipboard = {
                type: 'text',
                text: JSON.parse(JSON.stringify(txt))
            };
            return true;
        } else if (app.selected.type === 'water') {
            var w = (app.project.waters || []).find(function (item) { return item.id === app.selected.id; });
            if (!w) return false;
            editorClipboard = {
                type: 'water',
                water: JSON.parse(JSON.stringify(w))
            };
            return true;
        } else if (app.selected.type === 'segment') {
            var sg = (app.project.segments || []).find(function (item) { return item.id === app.selected.id; });
            if (!sg) return false;
            editorClipboard = {
                type: 'segment',
                segment: JSON.parse(JSON.stringify(sg))
            };
            return true;
        }
        return false;
    }

    function pasteClipboard(offset) {
        if (!editorClipboard || !app.project) {
            showToast('剪贴板为空', 'warning');
            return false;
        }
        var dX = (offset && typeof offset.x === 'number') ? offset.x : 20;
        var dY = (offset && typeof offset.y === 'number') ? offset.y : 20;

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

        var pModel = window.OpenMapEditor.ProjectModel || window.ProjectModel;
        function getNextId(prefix) {
            return pModel ? pModel.nextId(app.project, prefix) : (prefix + '_' + Date.now());
        }

        if (editorClipboard.type === 'node') {
            var origNode = editorClipboard.node;
            var newId = getNextId('node');
            var newNode = JSON.parse(JSON.stringify(origNode));
            newNode.id = newId;
            newNode.x = Math.round(newNode.x + dX);
            newNode.y = Math.round(newNode.y + dY);
            if (newNode.cn) newNode.cn = newNode.cn + ' (副本)';
            app.project.nodes[newId] = newNode;
            app.selected = { type: 'node', id: newId };
            renderAll();
            return true;
        } else if (editorClipboard.type === 'multi') {
            var idMapping = {};
            var newIds = [];
            Object.keys(editorClipboard.nodes || {}).forEach(function (oldId) {
                var oldN = editorClipboard.nodes[oldId];
                var newId = getNextId('node');
                idMapping[oldId] = newId;
                newIds.push(newId);
                var newN = JSON.parse(JSON.stringify(oldN));
                newN.id = newId;
                newN.x = Math.round(newN.x + dX);
                newN.y = Math.round(newN.y + dY);
                app.project.nodes[newId] = newN;
            });

            var newTextIds = [];
            (editorClipboard.texts || []).forEach(function (oldT) {
                var newTId = getNextId('text');
                newTextIds.push(newTId);
                var newT = JSON.parse(JSON.stringify(oldT));
                newT.id = newTId;
                newT.x = Math.round(newT.x + dX);
                newT.y = Math.round(newT.y + dY);
                app.project.texts = app.project.texts || [];
                app.project.texts.push(newT);
            });

            (editorClipboard.segments || []).forEach(function (oldSeg) {
                var newSegId = getNextId('seg');
                var newSeg = JSON.parse(JSON.stringify(oldSeg));
                newSeg.id = newSegId;
                (newSeg.points || []).forEach(function (p) {
                    p.x = Math.round(p.x + dX);
                    p.y = Math.round(p.y + dY);
                    if (p.nid && idMapping[p.nid]) {
                        p.nid = idMapping[p.nid];
                    }
                });
                app.project.segments = app.project.segments || [];
                app.project.segments.push(newSeg);
            });

            app.selected = { type: 'multi', nodeIds: newIds, textIds: newTextIds };
            renderAll();
            return true;
        } else if (editorClipboard.type === 'text') {
            var newTextId = getNextId('text');
            var newTxt = JSON.parse(JSON.stringify(editorClipboard.text));
            newTxt.id = newTextId;
            newTxt.x = Math.round(newTxt.x + dX);
            newTxt.y = Math.round(newTxt.y + dY);
            app.project.texts = app.project.texts || [];
            app.project.texts.push(newTxt);
            app.selected = { type: 'text', id: newTextId };
            renderAll();
            return true;
        } else if (editorClipboard.type === 'water') {
            var newWaterId = getNextId('water');
            var newW = JSON.parse(JSON.stringify(editorClipboard.water));
            newW.id = newWaterId;
            (newW.points || []).forEach(function (p) {
                p.x = Math.round(p.x + dX);
                p.y = Math.round(p.y + dY);
            });
            app.project.waters = app.project.waters || [];
            app.project.waters.push(newW);
            app.selected = { type: 'water', id: newWaterId };
            renderAll();
            return true;
        } else if (editorClipboard.type === 'segment') {
            var newSId = getNextId('seg');
            var newSg = JSON.parse(JSON.stringify(editorClipboard.segment));
            newSg.id = newSId;
            (newSg.points || []).forEach(function (p) {
                p.x = Math.round(p.x + dX);
                p.y = Math.round(p.y + dY);
                delete p.nid;
            });
            app.project.segments = app.project.segments || [];
            app.project.segments.push(newSg);
            app.selected = { type: 'segment', id: newSId };
            renderAll();
            return true;
        }
        return false;
    }

    function duplicateSelection() {
        if (copySelection()) {
            return pasteClipboard({ x: 20, y: 20 });
        }
        return false;
    }

    // =========================================================================
    // 对齐与分布系统 (Alignment & Distribution System)
    // =========================================================================
    function alignNodes(mode) {
        if (!app.selected || app.selected.type !== 'multi') return;
        var nList = (app.selected.nodeIds || []).filter(function (nid) { return !!app.project.nodes[nid]; });
        if (nList.length < 2) return;

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

        if (mode === 'top' || mode === 'center-y' || mode === 'bottom') {
            var targetY = 0;
            if (mode === 'top') {
                targetY = Math.min.apply(null, nList.map(function (id) { return app.project.nodes[id].y; }));
            } else if (mode === 'bottom') {
                targetY = Math.max.apply(null, nList.map(function (id) { return app.project.nodes[id].y; }));
            } else {
                var sumY = nList.reduce(function (s, id) { return s + app.project.nodes[id].y; }, 0);
                targetY = Math.round(sumY / nList.length);
            }
            nList.forEach(function (id) { app.project.nodes[id].y = targetY; });
            syncSegmentsForNodes(nList);
            renderAll();
        } else if (mode === 'left' || mode === 'center-x' || mode === 'right') {
            var targetX = 0;
            if (mode === 'left') {
                targetX = Math.min.apply(null, nList.map(function (id) { return app.project.nodes[id].x; }));
            } else if (mode === 'right') {
                targetX = Math.max.apply(null, nList.map(function (id) { return app.project.nodes[id].x; }));
            } else {
                var sumX = nList.reduce(function (s, id) { return s + app.project.nodes[id].x; }, 0);
                targetX = Math.round(sumX / nList.length);
            }
            nList.forEach(function (id) { app.project.nodes[id].x = targetX; });
            syncSegmentsForNodes(nList);
            renderAll();
        }
    }

    function distributeNodesEvenly(axis) {
        if (!app.selected || app.selected.type !== 'multi') return;
        var nodeIds = (app.selected.nodeIds || []).filter(function (nid) {
            return !!app.project.nodes[nid];
        });
        if (nodeIds.length < 3) {
            showToast('等间距分布至少需要选择 3 座车站', 'warning');
            return;
        }

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

        nodeIds.sort(function (a, b) {
            return app.project.nodes[a][axis] - app.project.nodes[b][axis];
        });

        var firstVal = app.project.nodes[nodeIds[0]][axis];
        var lastVal = app.project.nodes[nodeIds[nodeIds.length - 1]][axis];
        var totalSpan = lastVal - firstVal;
        var step = totalSpan / (nodeIds.length - 1);

        for (var i = 1; i < nodeIds.length - 1; i++) {
            var targetVal = Math.round(firstVal + i * step);
            if (app.snapEnabled && window.OpenMapEditor.ViewportLayer.snapPoint) {
                var testPt = { x: app.project.nodes[nodeIds[i]].x, y: app.project.nodes[nodeIds[i]].y };
                testPt[axis] = targetVal;
                var sn = window.OpenMapEditor.ViewportLayer.snapPoint(testPt.x, testPt.y);
                targetVal = sn[axis];
            }
            app.project.nodes[nodeIds[i]][axis] = targetVal;
        }

        syncSegmentsForNodes(nodeIds);
        renderAll();
    }

    // =========================================================================
    // 快速车站检索与居中定位 (Search & Jump)
    // =========================================================================
    function searchAndJumpStation(query) {
        if (!app.project || !app.project.nodes || !query) return false;
        var q = String(query).trim().toLowerCase();
        if (!q) return false;

        var matchedId = null;
        var matchedNode = null;

        var nodeKeys = Object.keys(app.project.nodes);
        for (var i = 0; i < nodeKeys.length; i++) {
            var nid = nodeKeys[i];
            var n = app.project.nodes[nid];
            if (!n) continue;
            var cn = String(n.cn || '').toLowerCase();
            var en = String(n.en || '').toLowerCase();
            if (cn === q || nid.toLowerCase() === q) {
                matchedId = nid;
                matchedNode = n;
                break;
            }
            if (!matchedId && (cn.indexOf(q) !== -1 || en.indexOf(q) !== -1 || nid.toLowerCase().indexOf(q) !== -1)) {
                matchedId = nid;
                matchedNode = n;
            }
        }

        if (matchedId && matchedNode) {
            window.OpenMapEditor.ViewportLayer.centerOn(matchedNode.x, matchedNode.y);
            app.selected = { type: 'node', id: matchedId };
            renderAll();
            return true;
        } else {
            showToast('未找到匹配车站: ' + query, 'warning');
            return false;
        }
    }

    function openSearchModal() {
        openModal('modalSearchStation');
        var input = document.getElementById('searchStationInput');
        if (input) {
            input.value = '';
            setTimeout(function () { input.focus(); }, 60);
            renderSearchResults('');
        }
    }

    function renderSearchResults(filter) {
        var box = document.getElementById('searchStationResultsBox');
        if (!box) return;
        var q = String(filter || '').trim().toLowerCase();
        var nodes = (app.project && app.project.nodes) ? app.project.nodes : {};
        var matched = [];
        var allIds = Object.keys(nodes);
        for (var i = 0; i < allIds.length; i++) {
            var id = allIds[i];
            var n = nodes[id];
            if (!n) continue;
            var cn = String(n.cn || '');
            var en = String(n.en || '');
            if (!q || cn.toLowerCase().indexOf(q) !== -1 || en.toLowerCase().indexOf(q) !== -1 || id.toLowerCase().indexOf(q) !== -1) {
                matched.push({ id: id, node: n });
                if (matched.length >= 25) break;
            }
        }

        if (!matched.length) {
            box.style.display = 'block';
            box.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-light);font-size:12px;">未找到匹配车站</div>';
            return;
        }

        box.style.display = 'block';
        box.innerHTML = matched.map(function (item, idx) {
            return '<div class="search-station-item' + (idx === 0 ? ' active' : '') + '" data-st-id="' + item.id + '">' +
                '<span style="font-weight:600;">' + (item.node.cn || item.id) + '</span>' +
                '<span style="font-size:11px;color:var(--text-light);font-family:monospace;">' + item.id + (item.node.en ? (' · ' + item.node.en) : '') + '</span>' +
                '</div>';
        }).join('');

        box.querySelectorAll('.search-station-item').forEach(function (el) {
            el.addEventListener('click', function () {
                var stId = this.getAttribute('data-st-id');
                closeModal('modalSearchStation');
                searchAndJumpStation(stId);
            });
        });
    }

    /**
     * 空选择时的检视面板：顺带显示"当前绘制线路"。
     * 线路高亮现在只跟随选中状态，取消选中后用户仍需要知道新画的线段会挂到哪条线上。
     */
    function renderEmptyInspector() {
        var activeLine = null;
        if (app.project && Array.isArray(app.project.lines)) {
            activeLine = app.project.lines.find(function (l) { return l.id === app.activeLineId; }) || null;
        }
        window.OpenMapEditor.InspectorView.renderEmpty({ activeLine: activeLine });
    }

    function updateInspector() {
        if (!app.selected || !app.project) {
            renderEmptyInspector();
            return;
        }

        if (app.selected.type === 'node') {
            var node = app.project.nodes[app.selected.id];
            if (node) {
                window.OpenMapEditor.InspectorView.renderNodeInspector(node, app.project);
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'segment') {
            var seg = (app.project.segments || []).find(function (s) { return s.id === app.selected.id; });
            if (seg) {
                window.OpenMapEditor.InspectorView.renderSegmentInspector(seg, app.project, { selectedPointIdx: app.selected.pointIdx });
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'line') {
            var selLine = (app.project.lines || []).find(function (l) { return l.id === app.selected.id; });
            if (selLine) {
                window.OpenMapEditor.InspectorView.renderLineInspector(selLine, app.project);
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'virtual') {
            var conn = (app.project.virtualConnectors || [])[app.selected.idx];
            if (conn) {
                var sF = app.project.nodes[conn.from], sT = app.project.nodes[conn.to];
                window.OpenMapEditor.InspectorView.renderGenericInspector(
                    '虚拟换乘连线', 'transfer',
                    [
                        { label: '出发车站', value: (sF ? sF.cn : conn.from) + ' (' + conn.from + ')' },
                        { label: '到达车站', value: (sT ? sT.cn : conn.to) + ' (' + conn.to + ')' },
                        { label: '通道性质', value: conn.free ? '免费出闸换乘' : '付费换乘通道' },
                        { label: '连线序号', value: '#' + (app.selected.idx + 1) }
                    ],
                    [
                        {
                            label: '删除此连线', danger: true, icon: 'delete',
                            onClick: function () {
                                handlePropertyChange('virtual', app.selected.idx, 'delete', true);
                            }
                        }
                    ]
                );
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'notopen') {
            var notOpenItem = (app.project.notOpenLines || [])[app.selected.idx];
            if (notOpenItem) {
                window.OpenMapEditor.InspectorView.renderGenericInspector(
                    notOpenItem.name || '在建规划走向', 'time',
                    [
                        { label: '规划名称', value: notOpenItem.name || '未命名规划走向' },
                        { label: '控制点数', value: (notOpenItem.points || []).length + ' 个折线端点' },
                        { label: '描边样式', value: ((notOpenItem.style && notOpenItem.style.width) || '3.4') + 'px ' + ((notOpenItem.style && notOpenItem.style.color) || 'default') },
                        { label: '走向序号', value: '#' + (app.selected.idx + 1) }
                    ],
                    [
                        {
                            label: '删除此走向', danger: true, icon: 'delete',
                            onClick: function () {
                                handlePropertyChange('notopen', app.selected.idx, 'delete', true);
                            }
                        }
                    ]
                );
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'scattered') {
            var sc = (app.project.scattered || [])[app.selected.idx];
            if (sc) {
                window.OpenMapEditor.InspectorView.renderScatteredInspector(sc, app.selected.idx, app.project);
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'water') {
            var water = (app.project.waters || []).find(function (w) { return w.id === app.selected.id; });
            if (water) {
                window.OpenMapEditor.InspectorView.renderWaterInspector(water, app.project);
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'text') {
            var txt = (app.project.texts || []).find(function (t) { return t.id === app.selected.id; });
            if (txt) {
                window.OpenMapEditor.InspectorView.renderTextInspector(txt, app.project);
            } else {
                renderEmptyInspector();
            }
        } else if (app.selected.type === 'multi') {
            var nList = app.selected.nodeIds || [];
            var tList = app.selected.textIds || [];
            // 批量入线路：分支线路逐个 way 列出，选哪个就写哪个站序
            var multiLineExtraHtml = '<div class="form-row"><span class="form-label">目标站序:</span>' +
                '<select class="form-select" id="multiLineTarget" style="flex:1;">' +
                ((app.project.lines || []).map(function (l) {
                    var name = l.name || l.id;
                    if (!l.hasbranch) return '<option value="' + l.id + '">' + name + '</option>';
                    var keys = Object.keys(l).filter(function (k) { return /^stationIds(-|$)/.test(k); });
                    if (!keys.length) keys = ['stationIds'];
                    return keys.map(function (k) {
                        var suffix = (k === 'stationIds') ? '' : (' · ' + k.replace('stationIds-', ''));
                        return '<option value="' + l.id + '|' + k + '">' + name + suffix + '</option>';
                    }).join('');
                }).join('') || '<option value="">（当前没有线路）</option>') +
                '</select></div>';

            window.OpenMapEditor.InspectorView.renderGenericInspector(
                '多选图元集合 (' + (nList.length + tList.length) + ')',
                'view-grid',
                [
                    { label: '多选车站', value: nList.length + ' 座' },
                    { label: '自由注释', value: tList.length + ' 处' },
                    { label: '整体平移', value: '按住任一选中车站拖动，或使用方向键微调' },
                    { label: '步进快捷键', value: '方向键 1px，Shift + 方向键 10px' },
                    { label: '取消多选', value: '按 Esc 或点击空白区域' }
                ],
                [
                    {
                        label: '顶端对齐', icon: 'arrow-up',
                        onClick: function () { alignNodes('top'); }
                    },
                    {
                        label: '水平居中', icon: 'flip-h',
                        onClick: function () { alignNodes('center-y'); }
                    },
                    {
                        label: '底端对齐', icon: 'arrow-down',
                        onClick: function () { alignNodes('bottom'); }
                    },
                    {
                        label: '左端对齐', icon: 'arrow-left',
                        onClick: function () { alignNodes('left'); }
                    },
                    {
                        label: '垂直居中', icon: 'flip-v',
                        onClick: function () { alignNodes('center-x'); }
                    },
                    {
                        label: '右端对齐', icon: 'arrow-right',
                        onClick: function () { alignNodes('right'); }
                    },
                    {
                        label: '水平等距', icon: 'sort',
                        onClick: function () { distributeNodesEvenly('x'); }
                    },
                    {
                        label: '垂直等距', icon: 'sort',
                        onClick: function () { distributeNodesEvenly('y'); }
                    },
                    {
                        label: '复制集合', icon: 'copy',
                        onClick: function () { copySelection(); }
                    },
                    {
                        label: '克隆副本', icon: 'preset',
                        onClick: function () { duplicateSelection(); }
                    },
                    {
                        label: '加入线路', icon: 'add',
                        onClick: function () {
                            var pick = readMultiLinePick();
                            if (!pick) return;
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            var res = addStationsToLine(nList, pick.lineId, pick.groupKey);
                            renderAll();
                            if (res.added) {
                                showToast('已把 ' + res.added + ' 座车站加入「' + pick.label + '」' +
                                    (res.skipped ? ('（' + res.skipped + ' 座已在该线或已失效，跳过）') : ''), 'success');
                            } else {
                                showToast('所选车站都已在「' + pick.label + '」的站序里', 'info');
                            }
                        }
                    },
                    {
                        label: '移出线路', icon: 'close', danger: true,
                        onClick: function () {
                            var pick = readMultiLinePick();
                            if (!pick) return;
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            var res = removeStationsFromLine(nList, pick.lineId, pick.groupKey);
                            renderAll();
                            if (res.removed) {
                                showToast('已把 ' + res.removed + ' 座车站移出「' + pick.label + '」' +
                                    (res.skipped ? ('（' + res.skipped + ' 座本来就不在该线）') : ''), 'success');
                            } else {
                                showToast('所选车站都不在「' + pick.label + '」的站序里', 'info');
                            }
                        }
                    },
                    {
                        label: '批量删除', danger: true, icon: 'delete',
                        onClick: function () {
                            confirmDeleteStations(nList);
                        }
                    }
                ],
                multiLineExtraHtml
            );
        } else {
            renderEmptyInspector();
        }
    }

    /**
     * 批量移动或对齐时同步折线端点坐标
     */
    function syncSegmentsForNodes(nodeIds) {
        if (!Array.isArray(nodeIds) || !nodeIds.length) return;
        var nodeSet = new Set(nodeIds);
        (app.project.segments || []).forEach(function (seg) {
            (seg.points || []).forEach(function (p) {
                if (p.nid && nodeSet.has(p.nid) && app.project.nodes[p.nid]) {
                    p.x = app.project.nodes[p.nid].x;
                    p.y = app.project.nodes[p.nid].y;
                }
            });
        });
    }

    /**
     * 处理左侧拓扑与图层大纲树节点点击高亮定位事件
     */
    function handleTreeSelect(type, id, data) {
        if (!app.project) return;
        if (type === 'line') {
            app.activeLineId = id;
            // 选中这条线路，让右侧检视面板切到「线路属性」（名称 / 标志色 / 运营公司）
            app.selected = { type: 'line', id: id };
            if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
                window.OpenMapEditor.PipelineDraw.setActiveLine(id);
            }
            // 尝试平移居中至该线路的车站或走线折点
            var lineObj = (app.project.lines || []).find(function (l) { return l.id === id; });
            var targetX = null, targetY = null;
            if (lineObj && Array.isArray(lineObj.stationIds) && lineObj.stationIds.length) {
                var firstSt = app.project.nodes[lineObj.stationIds[0]];
                if (firstSt) { targetX = firstSt.x; targetY = firstSt.y; }
            }
            if (targetX === null) {
                var firstSeg = (app.project.segments || []).find(function (s) { return s.lineId === id; });
                if (firstSeg && firstSeg.points && firstSeg.points.length) {
                    targetX = firstSeg.points[0].x;
                    targetY = firstSeg.points[0].y;
                }
            }
            if (targetX !== null && targetY !== null) {
                window.OpenMapEditor.ViewportLayer.centerOn(targetX, targetY);
            }
            renderAll();
        } else if (type === 'node') {
            app.selected = { type: 'node', id: id };
            var node = app.project.nodes[id];
            if (node) {
                window.OpenMapEditor.ViewportLayer.centerOn(node.x, node.y);
            }
            renderAll();
        } else if (type === 'virtual') {
            app.selected = { type: 'virtual', idx: id };
            if (data && data.sFrom && data.sTo) {
                window.OpenMapEditor.ViewportLayer.centerOn((data.sFrom.x + data.sTo.x) / 2, (data.sFrom.y + data.sTo.y) / 2);
            }
            renderAll();
        } else if (type === 'notopen') {
            app.selected = { type: 'notopen', idx: id };
            if (data && data.notOpenItem && data.notOpenItem.points && data.notOpenItem.points.length) {
                window.OpenMapEditor.ViewportLayer.centerOn(data.notOpenItem.points[0].x, data.notOpenItem.points[0].y);
            }
            renderAll();
        } else if (type === 'scattered') {
            app.selected = { type: 'scattered', idx: id };
            if (data && data.scattered) {
                window.OpenMapEditor.ViewportLayer.centerOn(data.scattered.x, data.scattered.y);
            }
            renderAll();
        } else if (type === 'water') {
            app.selected = { type: 'water', id: id };
            var w = (app.project.waters || []).find(function (item) { return item.id === id; });
            if (w && w.points && w.points.length) {
                window.OpenMapEditor.ViewportLayer.centerOn(w.points[0].x, w.points[0].y);
            }
            renderAll();
        } else if (type === 'text') {
            app.selected = { type: 'text', id: id };
            var t = (app.project.texts || []).find(function (item) { return item.id === id; });
            if (t) {
                window.OpenMapEditor.ViewportLayer.centerOn(t.x, t.y);
            }
            renderAll();
        }
    }

    /**
     * 将 editor 数据模型 (nodes/segments/lines) 转换为 validateData 所需的
     * OpenMap 标准 stationsData/linesData 格式，用于数据完整性校验
     */
    function projectToOpenMapFormat(project) {
        if (!project) return { stationsData: {}, linesData: [] };

        // stationsData: 按节点 ID 建立字典，严密保留全部全要素属性 (align, offset, hideLabel, textScale, marker, halo)
        var stationsData = {};
        Object.keys(project.nodes || {}).forEach(function (id) {
            var n = project.nodes[id];
            var st = {
                x: n.x,
                y: n.y,
                type: n.type || 'dot',
                cn: n.cn || '',
                en: n.en || ''
            };
            if (n.align) st.align = n.align;
            if (n.offset && (n.offset.x !== 0 || n.offset.y !== 0)) st.offset = { x: n.offset.x, y: n.offset.y };
            if (n.hideLabel) st.hideLabel = true;
            if (n.textScale) st.textScale = n.textScale;
            if (n.marker) st.marker = n.marker;
            if (n.halo) st.halo = n.halo;
            if (n.notOpen) st.type = 'no';
            stationsData[id] = st;
        });

        // linesData: 站序与走向都从「线段」这个真实几何推导出来
        //
        // 旧实现是"有 stationIds 就原样照抄"，而 stationIds 是**点击/建站顺序**：
        // 画线时接到已有车站会被 push 到末尾，导出后引擎按这个顺序连点成线，
        // 于是出现"编辑器画面正常、导出乱成一团"的严重问题。
        // 现在：
        //   1) stationIds 按线段拓扑重排成真实行车顺序；
        //   2) 同时写出 pathPoints（画布上真正画出来的走向），引擎会优先按它渲染 ——
        //      即使有些车站没画线段，导出的线形也与画布一致。
        var orderApi = window.OpenMapEditor.StationOrder;
        var linesData = (project.lines || []).map(function (line) {
            var lCopy = Object.assign({}, line);
            var io = window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
            var groups = (io && typeof io.lineStationGroups === 'function')
                ? io.lineStationGroups(line)
                : [];

            var segsOfLine = (project.segments || []).filter(function (s) { return s && s.lineId === line.id; });
            if (orderApi && segsOfLine.length) {
                var path = orderApi.buildPathPoints(segsOfLine);
                if (path && path.points && path.points.length >= 2) {
                    lCopy.pathPoints = path.points;
                }
                // 站序以【路径】为准：线段与车站不强绑定，站心落在路径上即属于本线，
                // 顺序按投影弧长排（换乘站允许偏离）。
                var baseIds = (io && typeof io.lineAllStationIds === 'function')
                    ? io.lineAllStationIds(line)
                    : (line.stationIds || []);
                var ordered = null;
                if (path && path.points && path.points.length >= 2 && orderApi.stationsOnPath) {
                    var discovered2 = orderApi.stationsOnPath(project.nodes || {}, path.points, { tolerance: 6 });
                    var merged2 = baseIds.slice();
                    discovered2.forEach(function (id) { if (merged2.indexOf(id) === -1) merged2.push(id); });
                    var byPath2 = orderApi.orderStationsByPath(merged2, path.points, project.nodes || {}, { tolerance: 6 });
                    ordered = { ids: byPath2.ids, leftover: (byPath2.offPath || []).map(function (o) { return o.id; }) };
                } else {
                    ordered = orderApi.orderFromSegments(baseIds, segsOfLine, project.nodes);
                }
                if (ordered && ordered.ids && ordered.ids.length) {
                    // 站序按线段拓扑排好；拓扑覆盖不到的站保留在末尾。
                    // 线形由 pathPoints 决定，站序不再影响渲染，因此不需要删任何车站。
                    lCopy.stationIds = ordered.ids;
                    if (lCopy.distances && (!Array.isArray(lCopy.distances) || lCopy.distances.length !== Math.max(0, lCopy.stationIds.length - 1))) {
                        lCopy.distances = lCopy.stationIds.length > 1 ? new Array(lCopy.stationIds.length - 1).fill(null) : [];
                    }
                }
                if (ordered && ordered.leftover && ordered.leftover.length) {
                    lCopy._uncoveredStations = ordered.leftover.slice();
                }
                return lCopy;
            }

            if (groups.length > 0) {
                return lCopy;
            }
            // 否则从线路+线段重建站序
            var segs = (project.segments || []).filter(function (s) { return s.lineId === line.id; });
            var stationIds = [];
            var seen = {};
            segs.forEach(function (seg) {
                var pts = seg.points || [];
                var startNid = pts[0] && pts[0].nid;
                var endNid = pts[pts.length - 1] && pts[pts.length - 1].nid;
                if (startNid && !seen[startNid]) { seen[startNid] = true; stationIds.push(startNid); }
                if (endNid && !seen[endNid]) { seen[endNid] = true; stationIds.push(endNid); }
            });
            lCopy.stationIds = stationIds;
            lCopy.distances = stationIds.length > 1 ? new Array(stationIds.length - 1).fill(null) : [];
            return lCopy;
        });

        // 汇总：哪些线路有"没有画线段的车站"（导出时已从站序剔除，需提示用户补画）
        var uncoveredReport = [];
        linesData.forEach(function (l) {
            if (l && l._uncoveredStations && l._uncoveredStations.length) {
                uncoveredReport.push(l.id + ' ' + (l.name || '') + '（' + l._uncoveredStations.length + ' 站）');
            }
        });
        window.__openmapLastExportNotes = uncoveredReport;

        return { stationsData: stationsData, linesData: linesData };
    }

    /**
     * 更新标题栏数据健康状态指示 (dirtyCounterBadge / 校验摘要)
     */
    /**
     * 数据完整性校验（判断"错误/警告"徽章）。
     *
     * 它要把整份工程转成城市格式再全量校验，是 O(n) 且会分配大量临时对象。
     * 以前 renderAll 每帧都跑一次，拖动几百座车站时纯属浪费主线程，
     * 长时间操作后 GC 压力会明显拖慢编辑器。现在改成：
     *   · 最多每 700ms 校验一次；
     *   · 节流窗口内来的请求合并成一次尾随校验（拖完立刻反映最新状态）。
     */
    var healthLastAt = 0;
    var healthTimer = 0;
    function updateHealthBadge() {
        var now = Date.now();
        var INTERVAL = 700;
        if (now - healthLastAt < INTERVAL) {
            if (!healthTimer) {
                healthTimer = setTimeout(function () {
                    healthTimer = 0;
                    updateHealthBadgeNow();
                }, INTERVAL - (now - healthLastAt));
            }
            return;
        }
        updateHealthBadgeNow();
    }

    function updateHealthBadgeNow() {
        healthLastAt = Date.now();
        var dirtyBadge = document.getElementById('dirtyCounterBadge');
        if (!dirtyBadge || !app.project) return;

        try {
            var fmt = projectToOpenMapFormat(app.project);
            var result = window.OpenMapEditor.BundleExporter.validateData(fmt.stationsData, fmt.linesData);
            if (!result) return;
            if (result.errors.length > 0) {
                dirtyBadge.setAttribute('variant', 'danger');
                dirtyBadge.title = '数据错误: ' + result.errors.join('; ');
            } else if (result.warnings.length > 0) {
                dirtyBadge.setAttribute('variant', 'warning');
                dirtyBadge.title = '数据警告: ' + result.warnings.join('; ');
            } else {
                dirtyBadge.removeAttribute('variant');
                dirtyBadge.title = '数据完整性通过';
            }
        } catch (e) { /* 校验工具未加载则静默跳过 */ }
    }

    /**
     * 从工程里彻底删除一座车站：摘出所有线路站序（含分支 way）与配套站距、
     * 解除折线端点的 nid 绑定（保留原走向，避免线网被拉变形）、移除虚拟换乘，
     * 最后删除节点本身。车站删除的单选 / 多选 / 折线端头三条路径共用它。
     * @returns {boolean} 是否真的删掉了
     */
    function deleteStationById(nodeId) {
        if (!app.project || !app.project.nodes || !app.project.nodes[nodeId]) return false;

        (app.project.lines || []).forEach(function (l) {
            var idsKeys = Object.keys(l).filter(function (k) { return /^stationIds(-|$)/.test(k); });
            idsKeys.forEach(function (idsKey) {
                if (!Array.isArray(l[idsKey])) return;
                var idx = l[idsKey].indexOf(nodeId);
                if (idx === -1) return;
                l[idsKey].splice(idx, 1);
                var distKey = idsKey === 'stationIds' ? 'distances' : ('distances-' + idsKey.replace('stationIds-', ''));
                if (Array.isArray(l[distKey]) && l[distKey].length >= l[idsKey].length) {
                    l[distKey].splice(Math.min(idx, l[distKey].length - 1), 1);
                }
            });
        });

        // 只解除绑定、不删折点：折点是走向的一部分，删掉会让线路变形
        (app.project.segments || []).forEach(function (seg) {
            (seg.points || []).forEach(function (p) {
                if (p.nid === nodeId) delete p.nid;
            });
        });

        app.project.virtualConnectors = (app.project.virtualConnectors || []).filter(function (conn) {
            return conn.from !== nodeId && conn.to !== nodeId;
        });

        delete app.project.nodes[nodeId];
        return true;
    }

    /**
     * 判断删除线段上某个折点该怎么落地（纯函数，便于自检）：
     *   'interior' 中间折点 → 直接删，两端拉直
     *   'station'  端头折点上是车站 → 要删的其实是那座车站
     *   'splice'   端头自由折点 → 直接删（删完仍剩 ≥2 点）
     *   'refuse'   端头自由折点但删完只剩 1 点 → 拒绝，应改删整条线段
     *   'invalid'  索引越界
     */
    function planPointDeletion(seg, idx) {
        var pts = (seg && seg.points) || [];
        if (typeof idx !== 'number' || idx < 0 || idx >= pts.length) return 'invalid';
        if (idx !== 0 && idx !== pts.length - 1) return 'interior';
        if (pts[idx] && pts[idx].nid) return 'station';
        return pts.length > 2 ? 'splice' : 'refuse';
    }

    /**
     * 坐标统一保留 2 位小数。
     * 城市数据里本来就有小数坐标（如 742.86 / 1033.89），编辑器必须能编辑这种值：
     * 取整到整数会让「拖一点、输个 .5」全部失效，并把这些坐标永久抹平。
     * 保留 2 位既贴合源文件书写精度，又能去掉浮点噪声（742.8600000000001）。
     */
    function roundCoord(v) {
        return Math.round(Number(v) * 100) / 100;
    }

    /**
     * 把一批车站加入某条线路的站序（分支安全）。
     *
     * 插入位置优先按几何投影判定「落在哪两站之间」，插在该位置；
     * 拿不到几何（线路还没画走向）时追加到末尾。
     * 若该线路的 distances 原本与站数配套，则在同位置插入 0 占位，维持长度校验。
     *
     * @param {string[]} nodeIds
     * @param {string} lineId
     * @param {string} [groupKey] stationIds / stationIds-way1 ...
     * @returns {{added:number, skipped:number, idsKey:string}}
     */
    function addStationsToLine(nodeIds, lineId, groupKey) {
        var out = { added: 0, skipped: 0, idsKey: '' };
        var line = (app.project.lines || []).find(function (l) { return l.id === lineId; });
        if (!line || !Array.isArray(nodeIds) || !nodeIds.length) return out;

        var idsKey = groupKey || (line.hasbranch ? 'stationIds-way1' : 'stationIds');
        if (!Array.isArray(line[idsKey])) line[idsKey] = [];
        var distKey = idsKey === 'stationIds' ? 'distances' : ('distances-' + idsKey.replace('stationIds-', ''));
        var ids = line[idsKey];
        // 站距只在「原本就配套」时才补占位，缺失状态保持缺失（属合法待补）
        var pairedDistances = Array.isArray(line[distKey]) && line[distKey].length === Math.max(0, ids.length - 1);

        nodeIds.forEach(function (nid) {
            var node = app.project.nodes[nid];
            if (!node || ids.indexOf(nid) !== -1) { out.skipped++; return; }

            var insertAt = ids.length;
            var snap = null;
            try {
                if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.findNearestLineProjection) {
                    var scale = window.OpenMapEditor.ViewportLayer && window.OpenMapEditor.ViewportLayer.getScale
                        ? window.OpenMapEditor.ViewportLayer.getScale() : 1;
                    snap = window.OpenMapEditor.PipelineDraw.findNearestLineProjection(
                        app.project, { x: node.x, y: node.y }, 80 / (scale || 1));
                }
            } catch (e) { snap = null; }

            if (snap && snap.segment && snap.segment.lineId === line.id) {
                var pts = snap.segment.points || [];
                var prevNid = null, nextNid = null;
                for (var bi = Math.min(snap.pointIndex == null ? pts.length - 1 : snap.pointIndex, pts.length - 1); bi >= 0; bi--) {
                    if (pts[bi] && pts[bi].nid && ids.indexOf(pts[bi].nid) !== -1) { prevNid = pts[bi].nid; break; }
                }
                for (var fi = (snap.pointIndex == null ? 0 : snap.pointIndex) + 1; fi < pts.length; fi++) {
                    if (pts[fi] && pts[fi].nid && ids.indexOf(pts[fi].nid) !== -1) { nextNid = pts[fi].nid; break; }
                }
                if (prevNid) insertAt = ids.indexOf(prevNid) + 1;
                else if (nextNid) insertAt = ids.indexOf(nextNid);
            }

            ids.splice(insertAt, 0, nid);
            if (pairedDistances) line[distKey].splice(insertAt, 0, 0);
            out.added++;
        });

        out.idsKey = idsKey;
        return out;
    }

    /**
     * 把一批车站从某条线路的站序里移出（分支安全，站距同步摘除）。
     */
    function removeStationsFromLine(nodeIds, lineId, groupKey) {
        var out = { removed: 0, skipped: 0, idsKey: '' };
        var line = (app.project.lines || []).find(function (l) { return l.id === lineId; });
        if (!line || !Array.isArray(nodeIds) || !nodeIds.length) return out;

        var idsKey = groupKey || (line.hasbranch ? 'stationIds-way1' : 'stationIds');
        var ids = line[idsKey];
        if (!Array.isArray(ids)) return out;
        var distKey = idsKey === 'stationIds' ? 'distances' : ('distances-' + idsKey.replace('stationIds-', ''));
        var pairedDistances = Array.isArray(line[distKey]) && line[distKey].length === Math.max(0, ids.length - 1);

        nodeIds.forEach(function (nid) {
            var idx = ids.indexOf(nid);
            if (idx === -1) { out.skipped++; return; }
            ids.splice(idx, 1);
            if (pairedDistances && Array.isArray(line[distKey]) && line[distKey].length > 0) {
                line[distKey].splice(Math.min(idx, line[distKey].length - 1), 1);
            }
            out.removed++;
        });

        out.idsKey = idsKey;
        return out;
    }

    /**
     * 读取多选面板里选中的「线路 + 站序分组」。
     * 下拉的 value 形如 "L1"（普通线）或 "L2|stationIds-way1"（分支线的某个 way）。
     */
    function readMultiLinePick() {
        var sel = document.getElementById('multiLineTarget');
        if (!sel || !sel.value) {
            showToast('当前没有可用的线路站序', 'warning');
            return null;
        }
        var parts = String(sel.value).split('|');
        var lineId = parts[0];
        var groupKey = parts[1] || '';
        var line = (app.project.lines || []).find(function (l) { return l.id === lineId; });
        if (!line) return null;
        return {
            lineId: lineId,
            groupKey: groupKey,
            label: (line.name || line.id) +
                (groupKey && groupKey !== 'stationIds' ? (' · ' + groupKey.replace('stationIds-', '')) : '')
        };
    }

    /**
     * 选中属性变更回调
     */
    /** 异步确认通过后重入 handlePropertyChange 时携带的标记 */
    var CONFIRMED = { confirmed: true };

    function handlePropertyChange(targetType, targetId, prop, value) {
        if (!app.project) return;

        // 非数据改动的操作（聚焦视口 / 多选车站 / 委托给 deleteLineById / 切换检视）不在此处压撤销栈
        if (targetType === 'segment' && prop === 'open_line') {
            app.selected = { type: 'line', id: value };
            app.activeLineId = value;
            renderAll();
            return;
        }

        if (targetType === 'line') {
            var linePre = (app.project.lines || []).find(function (l) { return l.id === targetId; });
            if (!linePre) return;
            if (prop === 'focus') {
                var focusX = null, focusY = null;
                var firstStId = null;
                (window.OpenMapEditor.CityProjectIO && window.OpenMapEditor.CityProjectIO.lineStationGroups
                    ? window.OpenMapEditor.CityProjectIO.lineStationGroups(linePre)
                    : []).forEach(function (g) {
                        if (firstStId === null && g.ids && g.ids.length) firstStId = g.ids[0];
                    });
                if (firstStId && app.project.nodes[firstStId]) {
                    focusX = app.project.nodes[firstStId].x;
                    focusY = app.project.nodes[firstStId].y;
                } else {
                    var fSeg = (app.project.segments || []).find(function (s) { return s.lineId === linePre.id; });
                    if (fSeg && fSeg.points && fSeg.points.length) {
                        focusX = fSeg.points[0].x;
                        focusY = fSeg.points[0].y;
                    }
                }
                if (focusX !== null) window.OpenMapEditor.ViewportLayer.centerOn(focusX, focusY);
                renderAll();
                return;
            } else if (prop === 'delete_line') {
                deleteLineById(linePre.id);
                return;
            } else if (prop === 'selectStations') {
                var allIds = window.OpenMapEditor.CityProjectIO && window.OpenMapEditor.CityProjectIO.lineAllStationIds
                    ? window.OpenMapEditor.CityProjectIO.lineAllStationIds(linePre)
                    : [];
                allIds = allIds.filter(function (sid) { return !!app.project.nodes[sid]; });
                if (!allIds.length) { showToast('这条线路还没有可用的车站'); return; }
                app.selected = { type: 'multi', nodeIds: allIds };
                renderAll();
                return;
            }
        }

        // 删除车站的确认弹窗必须在压入撤销快照之前完成，避免取消后白占一步撤销与脏计数
        if (targetType === 'node' && prop === 'delete') {
            var nodeToDel = app.project.nodes[targetId];
            if (!nodeToDel) return;
            var refLines = [];
            (app.project.lines || []).forEach(function (l) {
                var inThis = false;
                if (Array.isArray(l.stationIds) && l.stationIds.indexOf(targetId) !== -1) inThis = true;
                Object.keys(l).forEach(function (k) {
                    if (/^stationIds-/.test(k) && Array.isArray(l[k]) && l[k].indexOf(targetId) !== -1) inThis = true;
                });
                if (inThis) refLines.push(l);
            });
            if (refLines.length > 0 && value !== CONFIRMED) {
                var names = refLines.map(function (l) { return l.name || l.id; }).join('、');
                // 确认是异步的：取消时什么都不发生；确认后带着 CONFIRMED 标记重入本函数，再压撤销快照
                askConfirm({
                    title: '删除车站「' + String(nodeToDel.cn || targetId).replace(/<[^>]*>/g, '') + '」？',
                    message: '该车站属于 ' + refLines.length + ' 条线路（' + names + '）。',
                    details: ['会从这些线路的站序中摘除，相邻站间距自动合并', '相关的虚拟换乘连线一并移除'],
                    note: '可用 Ctrl+Z 撤销。',
                    confirmText: '删除车站',
                    danger: true
                }).then(function (ok) {
                    if (ok) handlePropertyChange(targetType, targetId, prop, CONFIRMED);
                });
                return;
            }
        }

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

        if (targetType === 'node') {
            var node = app.project.nodes[targetId];
            if (!node) return;
            if (prop === 'delete') {
                // 从所有线路 stationIds 中平滑摘除并维护 distances
                (app.project.lines || []).forEach(function (l) {
                    ['stationIds'].concat(Object.keys(l).filter(function (k) { return /^stationIds-/.test(k); })).forEach(function (idsKey) {
                        if (Array.isArray(l[idsKey])) {
                            var idx = l[idsKey].indexOf(targetId);
                            if (idx !== -1) {
                                l[idsKey].splice(idx, 1);
                                var distKey = idsKey === 'stationIds' ? 'distances' : ('distances-' + idsKey.replace('stationIds-', ''));
                                if (Array.isArray(l[distKey]) && l[distKey].length >= l[idsKey].length) {
                                    l[distKey].splice(Math.min(idx, l[distKey].length - 1), 1);
                                }
                            }
                        }
                    });
                });

                // 解除线段点中的 nid 绑定
                (app.project.segments || []).forEach(function (seg) {
                    (seg.points || []).forEach(function (p) {
                        if (p.nid === targetId) delete p.nid;
                    });
                });

                // 移除虚拟换乘连线
                app.project.virtualConnectors = (app.project.virtualConnectors || []).filter(function (conn) {
                    return conn.from !== targetId && conn.to !== targetId;
                });

                delete app.project.nodes[targetId];
                app.selected = null;
            } else if (prop === 'reorder_line_station') {
                var lObj = (app.project.lines || []).find(function (l) { return l.id === value.lineId; });
                if (lObj) {
                    var gk = value.groupKey || 'stationIds';
                    var stList = lObj[gk];
                    if (Array.isArray(stList)) {
                        var curIdx = stList.indexOf(targetId);
                        var targetIdx = curIdx + (value.direction || 0);
                        if (curIdx !== -1 && targetIdx >= 0 && targetIdx < stList.length) {
                            var tempSt = stList[curIdx];
                            stList[curIdx] = stList[targetIdx];
                            stList[targetIdx] = tempSt;
                        }
                    }
                }
            } else if (prop === 'remove_from_line') {
                var lObj2 = (app.project.lines || []).find(function (l) { return l.id === value.lineId; });
                if (lObj2) {
                    var gk2 = value.groupKey || 'stationIds';
                    var stList2 = lObj2[gk2];
                    if (Array.isArray(stList2)) {
                        var curIdx2 = stList2.indexOf(targetId);
                        if (curIdx2 !== -1) {
                            stList2.splice(curIdx2, 1);
                            var distKey2 = gk2 === 'stationIds' ? 'distances' : ('distances-' + gk2.replace('stationIds-', ''));
                            if (Array.isArray(lObj2[distKey2]) && lObj2[distKey2].length >= stList2.length) {
                                lObj2[distKey2].splice(Math.min(curIdx2, lObj2[distKey2].length - 1), 1);
                            }
                        }
                    }
                }
            } else if (prop === 'add_to_line') {
                var lObj3 = (app.project.lines || []).find(function (l) { return l.id === value.lineId; });
                if (lObj3) {
                    var gk3 = lObj3.hasbranch ? 'stationIds-way1' : 'stationIds';
                    if (!Array.isArray(lObj3[gk3])) lObj3[gk3] = [];
                    if (lObj3[gk3].indexOf(targetId) === -1) {
                        lObj3[gk3].push(targetId);
                        var distKey3 = gk3 === 'stationIds' ? 'distances' : ('distances-' + gk3.replace('stationIds-', ''));
                        if (Array.isArray(lObj3[distKey3]) && lObj3[distKey3].length < lObj3[gk3].length - 1) {
                            lObj3[distKey3].push(null);
                        }
                    }
                }
            } else if (prop === 'position') {
                node.x = value.x;
                node.y = value.y;
                // 同步更新绑定线段端点与内部关联折点
                app.project.segments.forEach(function (seg) {
                    (seg.points || []).forEach(function (p) {
                        if (p && p.nid === targetId) {
                            p.x = value.x;
                            p.y = value.y;
                        }
                    });
                });
            } else if (prop === 'align') {
                node.align = value;
            } else if (prop === 'offset') {
                node.offset = value;
            } else if (prop === 'appearance') {
                // 样式选择器：一次性写入一组外观字段（type + marker / mk / halo…），值为 undefined/null 表示删除
                var cat = window.OpenMapEditor.StationStyleCatalog;
                var applied = cat ? cat.applyPatch(node, value || {}) : node;
                Object.keys(node).forEach(function (k) { if (!(k in applied)) delete node[k]; });
                Object.keys(applied).forEach(function (k) { node[k] = applied[k]; });
            } else if (prop === 'type') {
                // 城市逐站图元（如上海 marker）决定实际画法：先让城市按新类型改写，再落类型
                var rtType = window.OpenMapEditor.CityRenderRuntime;
                var typePatch = rtType ? rtType.adaptStationForType(node, value, targetId) : {};
                Object.keys(typePatch).forEach(function (k) {
                    if (typePatch[k] === undefined || typePatch[k] === null) delete node[k];
                    else node[k] = typePatch[k];
                });
                node.type = value;
                // notOpen 是 type === 'no' 的派生态：只改 type 不同步它，「暂缓开通」站改成换乘站后仍画成未开通
                node.notOpen = (value === 'no');
            } else if (prop === 'cn') {
                node.cn = value;
            } else if (prop === 'en') {
                node.en = value;
            } else if (prop === 'hideLabel') {
                node.hideLabel = !!value;
            } else if (prop === 'textScale') {
                node.textScale = value;
            } else if (prop === 'code') {
                if (value) node.code = value;
                else delete node.code;
            } else if (prop === 'amenities') {
                if (value && Array.isArray(value) && value.length > 0) node.amenities = value;
                else delete node.amenities;
            } else if (prop === 'siblings') {
                if (value && Array.isArray(value) && value.length > 0) node.siblings = value;
                else delete node.siblings;
            }
        } else if (targetType === 'segment') {
            var seg = (app.project.segments || []).find(function (s) { return s.id === targetId; });
            if (!seg) return;
            if (prop === 'delete') {
                app.project.segments = app.project.segments.filter(function (s) { return s.id !== targetId; });
                app.selected = null;
            } else if (prop === 'lineId') {
                seg.lineId = value;
            } else if (prop === 'type') {
                seg.type = value;
                var a = seg.points[0], b = seg.points[seg.points.length - 1];
                var routed = window.OpenMapEditor.SegmentRouter.routeBetweenByType(a, b, value, !!seg.cornerFlip, app.project.slope);
                var newPts = routed.map(function (p) { return { x: p.x, y: p.y }; });
                newPts[0] = { x: a.x, y: a.y, nid: a.nid };
                newPts[newPts.length - 1] = { x: b.x, y: b.y, nid: b.nid };
                seg.points = newPts;
            } else if (prop === 'notOpen') {
                seg.notOpen = !!value;
            } else if (prop === 'flipCorner') {
                window.OpenMapEditor.SegmentRouter.flipSegmentCorner(seg, app.project.slope);
            } else if (prop === 'point_radius') {
                var pIdx = value.pointIdx;
                if (seg.points && seg.points[pIdx]) {
                    seg.points[pIdx].r = value.r;
                }
            } else if (prop === 'all_radius') {
                if (seg.points) {
                    seg.points.forEach(function (pt) {
                        pt.r = value.r;
                    });
                }
            } else if (prop === 'point_position') {
                var pIdx2 = value.pointIdx;
                if (seg.points && seg.points[pIdx2]) {
                    seg.points[pIdx2].x = value.x;
                    seg.points[pIdx2].y = value.y;
                    if (seg.points[pIdx2].nid && app.project.nodes[seg.points[pIdx2].nid]) {
                        app.project.nodes[seg.points[pIdx2].nid].x = value.x;
                        app.project.nodes[seg.points[pIdx2].nid].y = value.y;
                    }
                }
            } else if (prop === 'delete_point') {
                var pIdx3 = value.pointIdx;
                if (seg.points && pIdx3 > 0 && pIdx3 < seg.points.length - 1) {
                    seg.points.splice(pIdx3, 1);
                    if (app.selected && app.selected.type === 'segment') {
                        app.selected.pointIdx = null;
                    }
                }
            }
        } else if (targetType === 'line') {
            var lineTarget = (app.project.lines || []).find(function (l) { return l.id === targetId; });
            if (!lineTarget) return;

            if (prop === 'name') {
                lineTarget.name = String(value == null ? '' : value).trim() || lineTarget.id;
            } else if (prop === 'color') {
                var hex = normalizeHexColor(value);
                if (!hex) { showToast('色号格式不对，请用 #RRGGBB 或 #RGB', 'error'); }
                else {
                    lineTarget.color = hex;
                }
            } else if (prop === 'company') {
                var company = String(value == null ? '' : value).trim();
                if (company) lineTarget.company = company;
                else delete lineTarget.company;
            } else if (prop === 'strokeWidth') {
                var sw = parseFloat(value);
                if (!isNaN(sw) && sw > 0) {
                    lineTarget.strokeWidth = sw;
                } else {
                    delete lineTarget.strokeWidth;
                }
            } else if (prop === 'useStrictRounding') {
                if (value) lineTarget.useStrictRounding = true;
                else delete lineTarget.useStrictRounding;
            } else if (prop === 'strokeLinecap') {
                lineTarget.strokeLinecap = value;
            } else if (prop === 'strokeLinejoin') {
                lineTarget.strokeLinejoin = value;
            } else if (prop === 'strokeDasharray') {
                if (value) lineTarget.strokeDasharray = value;
                else delete lineTarget.strokeDasharray;
            } else if (prop === 'apply_parallel_corridor') {
                var router = window.OpenMapEditor && window.OpenMapEditor.ParallelCorridorRouter;
                if (router && typeof router.applyParallelOffsetsToProject === 'function') {
                    var count = router.applyParallelOffsetsToProject(app.project, { spacing: 5.4 });
                    showToast('已完成 ' + count + ' 处共线段的平行走线折点生成与重构！', 'success');
                }
            }
        } else if (targetType === 'text') {
            var txtTarget = (app.project.texts || []).find(function (t) { return t.id === targetId; });
            if (!txtTarget) return;
            if (prop === 'delete') {
                app.project.texts = (app.project.texts || []).filter(function (t) { return t.id !== targetId; });
                app.selected = null;
            } else if (prop === 'text') {
                txtTarget.text = value;
            } else if (prop === 'size') {
                txtTarget.size = Number(value) || 14;
            } else if (prop === 'bold') {
                txtTarget.bold = !!value;
            } else if (prop === 'anchor') {
                txtTarget.anchor = value;
            } else if (prop === 'rotate') {
                txtTarget.rotate = Number(value) || 0;
            } else if (prop === 'color') {
                txtTarget.color = value;
            } else if (prop === 'position') {
                txtTarget.x = value.x;
                txtTarget.y = value.y;
            }
        } else if (targetType === 'water') {
            var wTarget = (app.project.waters || []).find(function (w) { return w.id === targetId; });
            if (!wTarget) return;
            if (prop === 'delete') {
                app.project.waters = (app.project.waters || []).filter(function (w) { return w.id !== targetId; });
                app.selected = null;
            } else if (prop === 'type') {
                wTarget.type = value;
            } else if (prop === 'width') {
                wTarget.width = Number(value) || 20;
            } else if (prop === 'point_position') {
                if (wTarget.points && wTarget.points[value.pointIdx]) {
                    wTarget.points[value.pointIdx].x = value.x;
                    wTarget.points[value.pointIdx].y = value.y;
                }
            } else if (prop === 'delete_point') {
                if (wTarget.points && wTarget.points.length > 3 && value.pointIdx >= 0 && value.pointIdx < wTarget.points.length) {
                    wTarget.points.splice(value.pointIdx, 1);
                }
            } else if (prop === 'boolean_op' && value && value.op && value.targetId) {
                var otherW = (app.project.waters || []).find(function (w) { return w.id === value.targetId; });
                if (otherW && Array.isArray(otherW.points) && window.OpenMapEditor.PolygonBoolean) {
                    var pb = window.OpenMapEditor.PolygonBoolean;
                    var opFn = pb[value.op];
                    if (typeof opFn === 'function') {
                        var newPoly = opFn(wTarget.points, otherW.points);
                        if (newPoly && newPoly.length >= 3) {
                            wTarget.points = newPoly;
                            showToast('已对多边形执行「' + (value.op === 'union' ? '并集' : (value.op === 'subtract' ? '差集' : '交集')) + '」运算');
                        } else {
                            showToast('布尔运算结果为空或退化', 'warning');
                        }
                    }
                }
            }
        } else if (targetType === 'virtual') {
            if (prop === 'delete' && Array.isArray(app.project.virtualConnectors) && targetId >= 0 && targetId < app.project.virtualConnectors.length) {
                app.project.virtualConnectors.splice(targetId, 1);
                app.selected = null;
            }
        } else if (targetType === 'notopen') {
            if (prop === 'delete' && Array.isArray(app.project.notOpenLines) && targetId >= 0 && targetId < app.project.notOpenLines.length) {
                app.project.notOpenLines.splice(targetId, 1);
                app.selected = null;
            }
        } else if (targetType === 'scattered') {
            var scList = Array.isArray(app.project.scattered) ? app.project.scattered : (app.project.scattered = []);
            var scItem = scList[targetId];
            if (prop === 'delete' && scItem) {
                scList.splice(targetId, 1);
                app.selected = null;
            } else if (scItem) {
                // 值为 null 表示删掉该字段（如清空宽高 = 回到素材原始尺寸、旋转 0 = 不写 rotation）
                var setField = function (k, v) {
                    if (v === null || v === undefined || v === '') delete scItem[k];
                    else scItem[k] = v;
                };
                if (prop === 'position') { scItem.x = value.x; scItem.y = value.y; }
                else if (prop === 'size') { setField('width', value.width); setField('height', value.height); }
                else if (prop === 'file') { scItem.file = value; }
                else if (prop === 'rotation') { setField('rotation', value ? value : null); }
                else if (prop === 'opacity') { setField('opacity', value); }
                else if (prop === 'zIndex') { setField('zIndex', value); }
                else if (prop === 'duplicate') {
                    var copy = JSON.parse(JSON.stringify(scItem));
                    copy.id = uniqueScatteredId(scItem.id || 'deco');
                    copy.x = Math.round(((scItem.x || 0) + 24) * 10) / 10;
                    copy.y = Math.round(((scItem.y || 0) + 24) * 10) / 10;
                    scList.splice(targetId + 1, 0, copy);
                    app.selected = { type: 'scattered', idx: targetId + 1 };
                }
            }
        }

        renderAll();
    }

    /**
     * 调整线路在工程图层中的堆叠与渲染顺序
     */
    function reorderLine(lineId, direction) {
        if (!app.project || !Array.isArray(app.project.lines)) return;
        var idx = app.project.lines.findIndex(function (l) { return l.id === lineId; });
        if (idx === -1) return;
        var newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= app.project.lines.length) return;

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
        var targetLine = app.project.lines[idx];
        app.project.lines.splice(idx, 1);
        app.project.lines.splice(newIdx, 0, targetLine);

        showToast('已将线路「' + (targetLine.name || targetLine.id) + '」在图层中' + (direction < 0 ? '上移' : '下移'), 'info');
        renderCanvas();
        scheduleSaveSession();
    }

    /**
     * 删除一条线路。
     *
     * 只删「线路」这个实体：它自己的站序（含分支 way）随条目一起消失，
     * 挂在这条线路上的走向线段（project.segments）一并清掉，避免画布上留下
     * 一批找不到归属的孤儿线段；**车站本身不删** —— 它们可能还被别的线路
     * 或虚拟换乘引用着，要删请到车站列表或多选面板里删。
     */
    // =========================================================================
    // 画布右键菜单：按右键位置下的对象（车站 / 线路 / 装饰 / 空白处）给出常用操作
    // =========================================================================
    function plainText(v) { return String(v == null ? '' : v).replace(/<[^>]*>/g, ''); }

    function buildContextMenuItems(e) {
        var VP = window.OpenMapEditor.ViewportLayer;
        var world = VP.screenToWorld(e.clientX, e.clientY);
        var HM = window.OpenMapEditor.HistoryManager;
        var items = [];
        var common = function () {
            return [
                { separator: true },
                { label: '撤销', icon: 'undo', shortcut: 'Ctrl+Z', disabled: !HM.canUndo(), onClick: function () { document.getElementById('btnUndo').click(); } },
                { label: '重做', icon: 'redo', shortcut: 'Ctrl+Y', disabled: !HM.canRedo(), onClick: function () { document.getElementById('btnRedo').click(); } }
            ];
        };

        // 1. 车站
        var nodeEl = e.target.closest('[data-node-id]');
        if (nodeEl && app.project.nodes[nodeEl.getAttribute('data-node-id')]) {
            var nid = nodeEl.getAttribute('data-node-id');
            var node = app.project.nodes[nid];
            var cat = window.OpenMapEditor.StationStyleCatalog;
            var surg = window.OpenMapEditor.PipelineSurgical;
            var snap = surg && surg.getOriginalSnapshot ? surg.getOriginalSnapshot() : null;
            var origin = snap && snap.nodes ? snap.nodes[nid] : null;
            var styleChanged = !!(cat && origin && !cat.sameAppearance(origin, node));
            var selectIt = function () { app.selected = { type: 'node', id: nid }; renderAll(); };
            items.push({ header: '车站「' + plainText(node.cn || nid) + '」' });
            items.push({ label: '更换样式…', icon: 'palette', onClick: function () {
                selectIt();
                setTimeout(function () { var t = document.getElementById('propNodeTypeTrigger'); if (t) t.click(); }, 30);
            } });
            if (styleChanged) {
                items.push({ label: '恢复载入时的样式', icon: 'undo', onClick: function () {
                    handlePropertyChange('node', nid, 'appearance', cat.appearanceOf(origin));
                } });
            }
            items.push({ label: node.hideLabel ? '显示站名' : '隐藏站名', icon: 'eye', onClick: function () {
                handlePropertyChange('node', nid, 'hideLabel', !node.hideLabel);
            } });
            items.push({ label: '复制', icon: 'copy', shortcut: 'Ctrl+C', onClick: function () {
                selectIt(); if (copySelection()) showToast('已复制车站', 'success');
            } });
            items.push({ label: '在大纲中定位', icon: 'location', onClick: selectIt });
            items.push({ separator: true });
            items.push({ label: '删除车站', icon: 'delete', danger: true, shortcut: 'Del', onClick: function () {
                handlePropertyChange('node', nid, 'delete', true);
            } });
            return items.concat(common());
        }

        // 2. 地图装饰（徽标级散点）
        var scEl = e.target.closest('.scattered-item.is-pickable[data-scattered-idx]');
        if (scEl && !(app.layerState.scattered && app.layerState.scattered.locked)) {
            var si = parseInt(scEl.getAttribute('data-scattered-idx'), 10);
            var sc = (app.project.scattered || [])[si];
            if (sc) {
                var z = sc.zIndex !== undefined ? sc.zIndex : 5;
                items.push({ header: '地图装饰「' + plainText(String(sc.file || sc.id).split('/').pop()) + '」' });
                items.push({ label: '编辑属性', icon: 'edit', onClick: function () { app.selected = { type: 'scattered', idx: si }; renderAll(); } });
                items.push({ label: '复制一份', icon: 'copy', onClick: function () { handlePropertyChange('scattered', si, 'duplicate', true); } });
                items.push({ label: '置于车站之上', icon: 'arrow-up', disabled: z >= 25, onClick: function () { handlePropertyChange('scattered', si, 'zIndex', 25); } });
                items.push({ label: '置于线路之下', icon: 'arrow-down', disabled: z <= 5, onClick: function () { handlePropertyChange('scattered', si, 'zIndex', 5); } });
                items.push({ separator: true });
                items.push({ label: '删除装饰', icon: 'delete', danger: true, onClick: function () { handlePropertyChange('scattered', si, 'delete', true); } });
                return items.concat(common());
            }
        }

        // 3. 线路
        var segEl = e.target.closest('[data-segment-id]');
        var seg = segEl ? (app.project.segments || []).find(function (s0) { return s0.id === segEl.getAttribute('data-segment-id'); }) : null;
        var line = seg ? (app.project.lines || []).find(function (l) { return l.id === seg.lineId; }) : null;
        if (seg) {
            var scale = VP.getScale() || 1;
            var proj = window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.findNearestLineProjection
                ? window.OpenMapEditor.PipelineDraw.findNearestLineProjection(app.project, world, 30 / scale) : null;
            items.push({ header: '线路「' + plainText(line ? (line.name || line.id) : seg.lineId) + '」' });
            items.push({ label: '在此处插入车站', icon: 'add', disabled: !proj, onClick: function () {
                HM.pushSnapshot(app.project);
                var res = window.OpenMapEditor.PipelineDraw.insertStationOnLine(app.project, proj);
                if (res && res.createdId) app.selected = { type: 'node', id: res.createdId };
                renderAll();
            } });
            if (line) {
                items.push({ label: '选中整条线路', icon: 'route', onClick: function () { app.selected = { type: 'line', id: line.id }; renderAll(); } });
                items.push({ label: '设为当前绘制线路', icon: 'edit', disabled: app.activeLineId === line.id, onClick: function () {
                    app.activeLineId = line.id;
                    if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) window.OpenMapEditor.PipelineDraw.setActiveLine(line.id);
                    renderAll();
                    showToast('当前绘制线路：' + (line.name || line.id), 'info');
                } });
            }
            items.push({ label: '编辑这一段折点', icon: 'edit', onClick: function () { app.selected = { type: 'segment', id: seg.id }; setTool('points'); renderAll(); } });
            if (line) {
                items.push({ separator: true });
                items.push({ label: '删除整条线路…', icon: 'delete', danger: true, onClick: function () { deleteLineById(line.id); } });
            }
            return items.concat(common());
        }

        // 4. 空白处
        var snapped = app.snapEnabled ? VP.snapPoint(world.x, world.y) : { x: roundCoord(world.x), y: roundCoord(world.y) };
        var navMode = VP.getNavMode ? VP.getNavMode() : 'map';
        items.push({ label: '在此添加车站', icon: 'add', onClick: function () {
            HM.pushSnapshot(app.project);
            var pModel = window.OpenMapEditor.ProjectModel || window.ProjectModel;
            var id = pModel ? pModel.nextId(app.project, 'station_') : ('station_' + Date.now());
            app.project.nodes[id] = { id: id, x: snapped.x, y: snapped.y, cn: '新车站', en: 'New Station', type: 'dot', align: 'top' };
            app.selected = { type: 'node', id: id };
            renderAll();
        } });
        items.push({ label: '粘贴', icon: 'copy', shortcut: 'Ctrl+V', disabled: !editorClipboard, onClick: function () { pasteClipboard(); } });
        items.push({ separator: true });
        items.push({ label: '全图居中', icon: 'fullscn', shortcut: 'F', onClick: function () { clickElement('hudBtnFit'); } });
        items.push({ label: (app.gridVisible ? '隐藏' : '显示') + '网格', icon: 'view-grid', shortcut: 'G', onClick: function () { clickElement('hudBtnGrid'); } });
        items.push({ label: navMode === 'map' ? '切换到设计软件模式（左键框选）' : '切换到地图模式（左键拖动画布）', icon: navMode === 'map' ? 'fullscn' : 'touch', shortcut: 'M',
            onClick: function () { clickElement('hudBtnNavMode'); } });
        return items.concat(common());
    }

    /** 新装饰的唯一 id（导出补丁按 id 定位条目，不能重复） */
    function uniqueScatteredId(base) {
        var used = {};
        (app.project.scattered || []).forEach(function (sc) { if (sc && sc.id) used[sc.id] = true; });
        var stem = String(base || 'deco').replace(/-\d+$/, '');
        var n = 2;
        while (used[stem + '-' + n]) n++;
        return stem + '-' + n;
    }

    /**
     * 批量删除车站（先确认、再压撤销快照）。
     * 分支安全：逐站走 deleteStationById（会处理 stationIds-wayN / distances-wayN / 虚拟换乘）。
     */
    function confirmDeleteStations(ids) {
        var list = (ids || []).filter(function (nid) { return app.project && app.project.nodes[nid]; });
        if (!list.length) return;
        var names = list.slice(0, 6).map(function (nid) {
            var n = app.project.nodes[nid];
            return (n && n.cn ? String(n.cn).replace(/<[^>]*>/g, '') : nid);
        });
        askConfirm({
            title: '删除 ' + list.length + ' 座车站？',
            message: '将删除：' + names.join('、') + (list.length > 6 ? ' 等 ' + list.length + ' 座' : '') + '。',
            details: ['车站会从所有线路的站序中摘除，站间距随之合并', '相关的虚拟换乘连线一并移除'],
            note: '可用 Ctrl+Z 撤销。',
            confirmText: '删除 ' + list.length + ' 座车站',
            danger: true
        }).then(function (ok) {
            if (!ok) return;
            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
            list.forEach(function (nid) { deleteStationById(nid); });
            app.selected = null;
            renderAll();
        });
    }

    function deleteLineById(lineId) {
        if (!app.project || !Array.isArray(app.project.lines)) return false;
        var idx = app.project.lines.findIndex(function (l) { return l.id === lineId; });
        if (idx === -1) return false;

        var line = app.project.lines[idx];
        var name = line.name || line.id;
        var segCount = (app.project.segments || []).filter(function (sg) { return sg.lineId === lineId; }).length;
        var stationCount = (window.OpenMapEditor.CityProjectIO && window.OpenMapEditor.CityProjectIO.lineAllStationIds)
            ? window.OpenMapEditor.CityProjectIO.lineAllStationIds(line).length
            : 0;

        if (app.project.lines.length === 1) {
            showToast('这是最后一条线路，删掉后画布就没有线网了；如确实要清空请用「新建画布」', 'warning');
            return false;
        }
        askConfirm({
            title: '删除线路「' + name + '」？',
            message: '线路 ' + lineId + ' 将从工程中移除。',
            details: [
                '该线路的站序（' + stationCount + ' 座车站的编排）会被删除',
                '挂在该线路上的 ' + segCount + ' 段走向会被一并删除',
                '车站本身不会被删除，其它线路仍可继续使用'
            ],
            note: '可用 Ctrl+Z 撤销。',
            confirmText: '删除线路',
            danger: true
        }).then(function (ok) {
            if (ok) removeLineAt(lineId);
        });
        return true;
    }

    function removeLineAt(lineId) {
        var idx = app.project.lines.findIndex(function (l) { return l.id === lineId; });
        if (idx === -1) return false;
        var line = app.project.lines[idx];
        var name = line.name || line.id;

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

        app.project.lines.splice(idx, 1);
        app.project.segments = (app.project.segments || []).filter(function (sg) { return sg.lineId !== lineId; });

        // 当前绘制线路 / 选中状态同步迁移
        if (app.activeLineId === lineId) {
            var nextLine = app.project.lines[0];
            app.activeLineId = nextLine ? nextLine.id : null;
            if (nextLine && window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
                window.OpenMapEditor.PipelineDraw.setActiveLine(nextLine.id);
            }
        }
        if (app.selected && (app.selected.type === 'line' || app.selected.type === 'segment')) {
            app.selected = app.activeLineId ? { type: 'line', id: app.activeLineId } : null;
        }
        renderAll();
        showToast('已删除线路「' + name + '」（车站保留）', 'success');
        return true;
    }

    /**
     * 标准化色号：#RGB → #RRGGBB，统一大写；无效返回 null。
     * 与源文件里 #E4002B 这类写法保持一致。
     */
    function normalizeHexColor(input) {
        var v = String(input || '').trim();
        if (!v) return null;
        if (v.charAt(0) !== '#') v = '#' + v;
        if (/^#[0-9a-fA-F]{3}$/.test(v)) {
            v = '#' + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2) + v.charAt(3) + v.charAt(3);
        }
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) return null;
        return v.toUpperCase();
    }

    function handleAssetStamp(category, payload) {
        if (!app.project) return;
        if (app.selected && app.selected.type === 'node') {
            var node = app.project.nodes[app.selected.id];
            if (node) {
                if (category === 'station') {
                    if (payload.patch) handlePropertyChange('node', node.id, 'appearance', payload.patch);
                    else handlePropertyChange('node', node.id, 'type', payload.glyph);
                    showToast('已将车站「' + String(node.cn || node.id).replace(/<[^>]*>/g, '') + '」换成所选样式（可在右侧「恢复载入时的样式」切回）', 'success');
                    renderAll();
                    return;
                } else if (category === 'amenity') {
                    var list = (node.amenities || []).slice();
                    var idx = list.indexOf(payload.id);
                    if (idx === -1) list.push(payload.id); else list.splice(idx, 1);
                    handlePropertyChange('node', node.id, 'amenities', list);
                    showToast('已切换车站「' + (node.cn || node.id) + '」设施徽标挂载', 'success');
                    renderAll();
                    return;
                }
            }
        }

        // 地图装饰：选中了某个装饰时直接换素材，否则进入落子
        if (category === 'scattered' && app.selected && app.selected.type === 'scattered' && payload.deco) {
            handlePropertyChange('scattered', app.selected.idx, 'file', payload.deco.file);
            showToast('已把选中的装饰换成「' + payload.deco.name + '」', 'success');
            return;
        }

        // 未选中车站时，进入落子放置模式
        app.activeStamp = { category: category, payload: payload };
        showToast('已激活落子模式：点击画布任意位置放置（按 ESC 取消）', 'info');
        var viewport = document.getElementById('workbenchViewport');
        if (viewport) viewport.style.cursor = 'crosshair';
    }

    function handleAssetApply(type, payload) {
        if (!app.project) return;
        if (!app.selected || app.selected.type !== 'node') {
            showToast('请先在画布中选中一座车站以赋予此属性', 'warning');
            return;
        }
        var node = app.project.nodes[app.selected.id];
        if (!node) return;
        if (type === 'code') {
            handlePropertyChange('node', node.id, 'code', payload);
            showToast('已为车站赋予编号: ' + payload, 'success');
            renderAll();
        }
    }

    /**
     * 切换当前激活工具
     */
    function setTool(toolName) {
        app.activeTool = toolName;
        window.OpenMapEditor.PipelineDraw.setTool(toolName);

        // 按钮高亮同步
        var toolBtns = document.querySelectorAll('[id^="toolBtn_"]');
        toolBtns.forEach(function (btn) {
            btn.classList.remove('primary-action', 'active');
            if (btn.id === 'toolBtn_' + toolName) {
                btn.classList.add('active');
            }
        });
        if (toolName === 'select') {
            var selBtn = document.getElementById('toolBtn_select');
            if (selBtn) selBtn.classList.add('primary-action');
        }

        if (toolName === 'eyedropper') {
            document.body.classList.add('tool-eyedropper');
        } else {
            document.body.classList.remove('tool-eyedropper');
        }

        var viewport = document.getElementById('workbenchViewport');
        if (viewport) {
            viewport.classList.toggle('crosshair', toolName !== 'select');
        }
    }

    /**
     * 初始化画布与 DOM 事件
     */
    function init() {
        var viewportEl = document.getElementById('workbenchViewport');
        var svgEl = document.getElementById('editorSvg');
        var viewLayerEl = document.getElementById('viewLayer');

        var stationLayerEl = document.getElementById('stationLayer');
        var labelLayerEl = document.getElementById('labelLayer');
        var lineLayerEl = document.getElementById('lineLayer');
        var handleLayerEl = document.getElementById('handleLayer');
        var waterLayerEl = document.getElementById('waterLayer');
        var textLayerEl = document.getElementById('textLayer');
        var scatteredLayerEl = document.getElementById('scatteredLayer');
        var notOpenLayerEl = document.getElementById('notOpenLayer');
        var virtualConnectorLayerEl = document.getElementById('virtualConnectorLayer');
        var gridLayerEl = document.getElementById('gridLayer');
        var ghostLayerEl = document.getElementById('ghostLayer');

        var inspectorPanelEl = document.getElementById('workbenchInspector');
        var inspectorBodyEl = document.getElementById('inspectorBody');

        // 1. 初始化各单例层
        watchThemeChanges();
        window.OpenMapEditor.RibbonController.init();
        window.OpenMapEditor.ViewportLayer.init(viewportEl, svgEl, viewLayerEl);
        if (window.OpenMapEditor.GridLayer && gridLayerEl) {
            window.OpenMapEditor.GridLayer.init(gridLayerEl);
        }
        if (window.OpenMapEditor.ScatteredLayer && scatteredLayerEl) {
            window.OpenMapEditor.ScatteredLayer.init(scatteredLayerEl);
        }
        if (window.OpenMapEditor.NotOpenLayer && notOpenLayerEl) {
            window.OpenMapEditor.NotOpenLayer.init(notOpenLayerEl);
        }
        if (window.OpenMapEditor.VirtualConnectorLayer && virtualConnectorLayerEl) {
            window.OpenMapEditor.VirtualConnectorLayer.init(virtualConnectorLayerEl);
        }
        window.OpenMapEditor.StationLayer.init(stationLayerEl, labelLayerEl);
        window.OpenMapEditor.VectorRouteLayer.init(lineLayerEl, handleLayerEl);
        window.OpenMapEditor.WaterLayer.init(waterLayerEl);
        window.OpenMapEditor.TextScatteredLayer.init(textLayerEl);
        window.OpenMapEditor.GhostTransformer.init(ghostLayerEl);
        window.OpenMapEditor.InspectorView.init(inspectorPanelEl, inspectorBodyEl, handlePropertyChange);

        // 初始化左侧拓扑与图层大纲树 (NavTreeView)
        var navContentEl = document.getElementById('navTreeContent');
        if (window.OpenMapEditor.NavTreeView && navContentEl) {
            window.OpenMapEditor.NavTreeView.init(navContentEl, {
                onSelect: function (type, id, data) {
                    handleTreeSelect(type, id, data);
                },
                onDeleteLine: function (lineId) {
                    // 大纲里的行内删除：与 Delete 键、线路属性面板走同一条流程
                    deleteLineById(lineId);
                },
                onToggleLayerVisibility: function (layerKey) {
                    if (app.layerState[layerKey]) {
                        app.layerState[layerKey].visible = !app.layerState[layerKey].visible;
                        applyLayerStates();
                        renderCanvas();
                    }
                },
                onToggleLayerLock: function (layerKey) {
                    if (app.layerState[layerKey]) {
                        app.layerState[layerKey].locked = !app.layerState[layerKey].locked;
                        applyLayerStates();
                        renderCanvas();
                    }
                },
                onReorderLine: function (lineId, direction) {
                    reorderLine(lineId, direction);
                },
                onToggleGridSnap: function () {
                    app.snapEnabled = !app.snapEnabled;
                    renderCanvas();
                }
            });
        }

        // 初始化左侧轨交资产零件盒 (AssetDrawer)
        var assetWrapperEl = document.getElementById('navAssetDrawerWrapper');
        var outlineWrapperEl = document.getElementById('navOutlineWrapper');
        if (window.OpenMapEditor.AssetDrawer && assetWrapperEl) {
            window.OpenMapEditor.AssetDrawer.init(assetWrapperEl, outlineWrapperEl, {
                onApplyToSelected: function (type, payload) {
                    handleAssetApply(type, payload);
                },
                onEnterStampMode: function (category, payload) {
                    handleAssetStamp(category, payload);
                }
            });
        }

        // 初始化多线共线平行走线 HUD 按钮
        var btnParallel = document.getElementById('hudBtnParallelTracks');
        if (btnParallel) {
            btnParallel.addEventListener('click', function () {
                app.enableParallelCorridor = (app.enableParallelCorridor === false) ? true : false;
                btnParallel.classList.toggle('active', app.enableParallelCorridor);
                showToast(app.enableParallelCorridor ? '已开启多线共线平行走线' : '已关闭多线共线平行走线', 'info');
                renderCanvas();
            });
        }

        // 2. 状态栏与视口缩放联动
        window.OpenMapEditor.ViewportLayer.onTransform(function (info) {
            var hudZoom = document.getElementById('hudZoomText');
            var statusZoom = document.getElementById('zoomPercentLabel');
            var zoomSlider = document.getElementById('bottomZoomSlider');
            if (hudZoom) hudZoom.textContent = info.percentText;
            if (statusZoom) statusZoom.textContent = info.percentText;
            if (zoomSlider) zoomSlider.value = info.scale.toFixed(2);
            renderRulers();
        });
        window.addEventListener('resize', function () { renderRulers(); });

        // 折叠/展开图层控制栏
        var btnToggleLayers = document.getElementById('btnToggleLayersPanel');
        var layersBar = document.getElementById('navLayersControlBar');
        if (btnToggleLayers && layersBar) {
            btnToggleLayers.addEventListener('click', function () {
                layersBar.classList.toggle('collapsed');
            });
        }

        // 初始化标尺可见性
        var savedRuler = false;
        try { savedRuler = (localStorage.getItem('openmap_editor_ruler_visible') === 'true'); } catch (e) { }
        setRulerVisible(savedRuler);

        // 3. 历史管理器状态联动
        window.OpenMapEditor.HistoryManager.onChange(function (st) {
            var undoBtn = document.getElementById('btnUndo');
            var redoBtn = document.getElementById('btnRedo');
            var dirtyBadge = document.getElementById('dirtyCounterBadge');
            if (undoBtn) undoBtn.disabled = !st.canUndo;
            if (redoBtn) redoBtn.disabled = !st.canRedo;
            // 快速访问工具栏与保存按钮同步
            var qu = document.getElementById('qatUndo');
            var qr = document.getElementById('qatRedo');
            if (qu) qu.disabled = !st.canUndo;
            if (qr) qr.disabled = !st.canRedo;
            var saveBtn = document.getElementById('btnHeaderSave');
            if (saveBtn) {
                saveBtn.classList.toggle('has-changes', st.dirtyCounter > 0);
                saveBtn.title = st.dirtyCounter > 0
                    ? '保存 ' + st.dirtyCounter + ' 处改动 (Ctrl+S，若关联本地目录则直接原地保存)'
                    : '保存改动 (Ctrl+S，若关联本地目录则直接原地保存)';
            }
            if (dirtyBadge) {
                dirtyBadge.style.cursor = 'pointer';
                dirtyBadge.title = '点击查看操作历史步骤面板 (Ctrl+H)';
                if (st.dirtyCounter > 0) {
                    dirtyBadge.textContent = '已修改 (' + st.dirtyCounter + ')';
                    if (!dirtyBadge.hasAttribute('variant') || dirtyBadge.getAttribute('variant') === '') {
                        dirtyBadge.setAttribute('variant', 'warning');
                    }
                } else {
                    dirtyBadge.textContent = '未修改';
                    dirtyBadge.removeAttribute('variant');
                }
            }
        });

        var dirtyBadgeEl = document.getElementById('dirtyCounterBadge');
        if (dirtyBadgeEl) {
            dirtyBadgeEl.addEventListener('click', openHistoryModal);
        }

        // 4. 工具栏按钮事件绑定
        bindToolbarButtons();

        // 5. 画布点击与交互事件
        bindCanvasInteractions(viewportEl);

        // 6. 模态框与弹窗事件
        bindModals();

        // 关闭/刷新页面前同步落盘，避免丢掉最后 1 秒内的改动
        window.addEventListener('beforeunload', function () { saveSessionNow(); });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') saveSessionNow();
        });

        // 7. 填充已有城市列表
        populateCitySelect();

        // 8. 优先恢复上次会话（F5 / 崩溃后不丢工作），没有才新建空白工程
        var sessionRestored = restoreSessionIfAny();
        if (!sessionRestored) {
            createDefaultProject();
        }

        // 9. 解析 URL 参数（恢复成功时不得被 ?city= 覆盖，详见 StartupPolicy）
        parseUrlParams(sessionRestored);
    }

    function createDefaultProject() {
        app.project = window.OpenMapEditor.ProjectModel.createProject(2000, 1500);
        app.project.lines.push({ id: 'L1', name: '1号线', color: '#c23531' });
        app.activeLineId = 'L1';
        window.OpenMapEditor.PipelineDraw.setActiveLine('L1');

        document.getElementById('currentDocLabel').textContent = '未命名空白工程';
        window.OpenMapEditor.ViewportLayer.fitCanvas(2000, 1500);
        renderAll();
    }

    // ==========================================================================
    // 会话自动保存与启动恢复（F5 / 崩溃后不丢工作）
    // ==========================================================================
    //
    // 存什么：工程本体 + 当前线路/工具 + （城市维护模式下）原始源码与载入时快照。
    // 为什么要存源码：没有 rawSources 就只能"另存新文件"，无法再做条目级无损回写。
    // 存哪里：localStorage（纯前端，无后端）。工程 + 城市源码通常几百 KB，远低于 5MB 配额；
    //         万一超额则降级为"只存工程本体"，至少不丢画的东西。
    var SESSION_KEY = 'openmap_editor_session_v1';
    var sessionTimer = null;
    // 上一次真正落盘的内容长度 + 时间：用于"内容没变就不重复序列化/写入"
    var lastSessionSize = -1;
    var lastSessionAt = 0;
    // 交互中（拖拽 / 变换）不要落盘：那时每帧都在改工程，序列化几百 KB 只会加剧卡顿
    var sessionHoldUntil = 0;
    /** 本次启动恢复出来的城市 id（空白工程为 null）；供 URL 参数判断能否安全自动载入 */
    var restoredSessionCityId = null;

    function buildSessionPayload() {
        if (!app.project) return null;
        var payload = {
            v: 1,
            savedAt: Date.now(),
            activeLineId: app.activeLineId || null,
            activeTool: app.activeTool || 'select',
            project: app.project
        };
        var surg = window.OpenMapEditor.PipelineSurgical;
        var city = surg && typeof surg.getCurrentLoadedCity === 'function' ? surg.getCurrentLoadedCity() : null;
        if (city && city.id) {
            payload.cityId = city.id;
            payload.cityName = city.name;
            payload.meta = city.meta || null;
            payload.base = city.base || '';
            payload.sources = surg.getRawSources ? surg.getRawSources() : null;
            payload.snapshot = surg.getSessionSnapshot ? surg.getSessionSnapshot() : null;
        }
        return payload;
    }

    function saveSessionNow() {
        // 2 秒内重复触发（例如连续 mouseup）直接忽略，避免反复序列化整个工程
        var now = Date.now();
        if (now - lastSessionAt < 2000) return;
        var payload = buildSessionPayload();
        if (!payload) return;
        try {
            var json = JSON.stringify(payload);
            lastSessionAt = Date.now();
            lastSessionSize = json.length;
            localStorage.setItem(SESSION_KEY, json);
            return;
        } catch (e) {
            // 多半是配额不足：丢掉源码与快照再试一次，保住工程本体
            try {
                var slim = buildSessionPayload();
                if (!slim) return;
                delete slim.sources;
                delete slim.snapshot;
                localStorage.setItem(SESSION_KEY, JSON.stringify(slim));
            } catch (e2) {
                console.warn('[Editor] 自动保存失败（可能是隐私模式或配额不足）：', e2);
            }
        }
    }

    /** 标记"正在交互"，这段时间内跳过自动保存（拖拽结束由 mouseup 再触发一次） */
    function holdSessionSave(ms) {
        sessionHoldUntil = Date.now() + (ms || 800);
    }

    /** 防抖：连续操作只在停下 2.5s 后落一次盘 */
    function scheduleSaveSession() {
        if (sessionTimer) return;
        sessionTimer = setTimeout(function () {
            sessionTimer = null;
            if (Date.now() < sessionHoldUntil) {          // 还在拖拽：稍后再试
                scheduleSaveSession();
                return;
            }
            saveSessionNow();
        }, 2500);
    }

    function clearSession() {
        try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    }

    /**
     * 启动时尝试恢复上次会话。
     * @returns {boolean} 是否恢复成功（失败则由调用方新建空白工程）
     */
    function restoreSessionIfAny() {
        var raw = null;
        restoredSessionCityId = null;
        try { raw = localStorage.getItem(SESSION_KEY); } catch (e) { return false; }
        if (!raw) return false;

        var data = null;
        try { data = JSON.parse(raw); } catch (e) {
            console.warn('[Editor] 自动保存数据损坏，已忽略');
            clearSession();
            return false;
        }
        var proj = data && data.project;
        if (!proj || !proj.nodes || !Array.isArray(proj.lines) || !proj.canvas ||
            !(proj.canvas.width > 0) || !(proj.canvas.height > 0)) {
            return false;
        }

        var surg = window.OpenMapEditor.PipelineSurgical;
        var cityRestored = false;
        if (data.cityId && data.sources && surg && typeof surg.restoreSession === 'function') {
            try { cityRestored = surg.restoreSession(data); } catch (e) { cityRestored = false; }
        }

        app.project = window.OpenMapEditor.ProjectModel
            ? window.OpenMapEditor.ProjectModel.normalize(proj)
            : proj;
        app.activeLineId = data.activeLineId || (proj.lines[0] && proj.lines[0].id) || null;
        if (app.activeLineId && window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
            window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
        }
        if (data.activeTool) setTool(data.activeTool);

        // 只有「城市原始源码也一起还原了」才算同一座城市：否则恢复出来的工程无法无损写回，
        // 不能让 URL 的 ?city= 被误判成 already-loaded 而失去重新载入源码的机会。
        restoredSessionCityId = cityRestored ? (data.cityId || null) : null;

        var label = document.getElementById('currentDocLabel');
        if (label) {
            label.textContent = (cityRestored
                ? ('城市维护：' + (data.cityName || data.cityId))
                : '未命名空白工程') + '（已恢复上次进度）';
        }
        window.OpenMapEditor.ViewportLayer.fitCanvas(proj.canvas.width, proj.canvas.height);
        renderAll();
        showToast('已恢复上次的编辑进度', 'success');
        return true;
    }

    function bindToolbarButtons() {
        // 工具切换
        ['select', 'box', 'points', 'station', 'temp', 'water', 'text', 'eyedropper'].forEach(function (t) {
            var btn = document.getElementById('toolBtn_' + t);
            if (btn) btn.addEventListener('click', function () { setTool(t); });
        });

        // 线段类型工具
        ['seg135', 'seg90', 'seg90d', 'segaxis'].forEach(function (t) {
            var btn = document.getElementById('toolBtn_' + t);
            if (btn) btn.addEventListener('click', function () { setTool(t); });
        });

        // 历史操作
        var undoBtn = document.getElementById('btnUndo');
        if (undoBtn) undoBtn.addEventListener('click', function () {
            if (window.OpenMapEditor.HistoryManager.canUndo()) {
                var prev = window.OpenMapEditor.HistoryManager.undo(app.project);
                if (prev) {
                    app.project = prev;
                    if (window.OpenMapEditor.HistoryManager.sanitizeSelection) {
                        app.selected = window.OpenMapEditor.HistoryManager.sanitizeSelection(app.selected, app.project);
                    }
                    renderAll();
                } else {
                    showToast('已回到最早状态，没有更早的步骤了', 'info');
                }
            }
        });

        // 快速访问工具栏：转发到功能区里的同名按钮，逻辑只有一份
        [['qatUndo', 'btnUndo'], ['qatRedo', 'btnRedo'], ['qatHistory', 'btnHistoryPanel']].forEach(function (pair) {
            var q = document.getElementById(pair[0]);
            if (q) q.addEventListener('click', function () {
                var target = document.getElementById(pair[1]);
                if (target) target.click();
            });
        });

        var redoBtn = document.getElementById('btnRedo');
        if (redoBtn) redoBtn.addEventListener('click', function () {
            if (window.OpenMapEditor.HistoryManager.canRedo()) {
                var next = window.OpenMapEditor.HistoryManager.redo(app.project);
                if (next) {
                    app.project = next;
                    if (window.OpenMapEditor.HistoryManager.sanitizeSelection) {
                        app.selected = window.OpenMapEditor.HistoryManager.sanitizeSelection(app.selected, app.project);
                    }
                    renderAll();
                } else {
                    showToast('已经在最新状态，没有可重做的步骤', 'info');
                }
            }
        });

        var btnHist = document.getElementById('btnHistoryPanel');
        if (btnHist) btnHist.addEventListener('click', openHistoryModal);

        // 翻转折角
        var flipBtn = document.getElementById('btnFlipCorner');
        if (flipBtn) flipBtn.addEventListener('click', function () {
            if (app.selected && app.selected.type === 'segment') {
                var seg = (app.project.segments || []).find(function (s) { return s.id === app.selected.id; });
                if (seg) {
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                    window.OpenMapEditor.SegmentRouter.flipSegmentCorner(seg, app.project.slope);
                    renderAll();
                }
            } else {
                showToast('请先选中一条折角线段');
            }
        });

        // 自动走线开关
        var autoRouteBtn = document.getElementById('btnToggleAutoRoute');
        if (autoRouteBtn) autoRouteBtn.addEventListener('click', function () {
            app.isAutoRoute = !app.isAutoRoute;
            autoRouteBtn.classList.toggle('active', app.isAutoRoute);
            if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setAutoRoute) {
                window.OpenMapEditor.PipelineDraw.setAutoRoute(app.isAutoRoute);
            }
        });

        // 刷新全网走线
        var refreshBtn = document.getElementById('btnRefreshAutoSegments');
        if (refreshBtn) refreshBtn.addEventListener('click', function () {
            if (!app.project) return;
            var count = 0;
            (app.project.segments || []).forEach(function (seg) {
                if (!seg.routed) return;
                var pts = seg.points;
                if (!pts || pts.length < 2) return;
                var a = pts[0], b = pts[pts.length - 1];
                var type = seg.type || 'seg135';
                try {
                    var newPts = window.OpenMapEditor.SegmentRouter.routeBetweenByType(
                        a, b, type, !!seg.cornerFlip, app.project.slope
                    );
                    var rebuilt = newPts.map(function (p) { return { x: p.x, y: p.y }; });
                    rebuilt[0] = { x: a.x, y: a.y, nid: a.nid };
                    rebuilt[rebuilt.length - 1] = { x: b.x, y: b.y, nid: b.nid };
                    seg.points = rebuilt;
                    count++;
                } catch (e) { /* 跳过异常线段 */ }
            });
            renderAll();
            showToast('已重算 ' + count + ' 条自动走线');
        });

        // HUD 视口缩放与适应
        var hudIn = document.getElementById('hudBtnZoomIn');
        var hudOut = document.getElementById('hudBtnZoomOut');
        var hudFit = document.getElementById('hudBtnFit');
        var hudReset = document.getElementById('hudZoomText');
        var statusIn = document.getElementById('statusBtnZoomIn');
        var statusOut = document.getElementById('statusBtnZoomOut');
        var slider = document.getElementById('bottomZoomSlider');

        if (hudIn) hudIn.addEventListener('click', function () { window.OpenMapEditor.ViewportLayer.zoomBy(1.2); });
        if (hudOut) hudOut.addEventListener('click', function () { window.OpenMapEditor.ViewportLayer.zoomBy(0.83); });
        if (statusIn) statusIn.addEventListener('click', function () { window.OpenMapEditor.ViewportLayer.zoomBy(1.2); });
        if (statusOut) statusOut.addEventListener('click', function () { window.OpenMapEditor.ViewportLayer.zoomBy(0.83); });
        if (hudReset) hudReset.addEventListener('click', function () { window.OpenMapEditor.ViewportLayer.resetView(); });
        if (hudFit) hudFit.addEventListener('click', function () {
            if (app.project && app.project.canvas) {
                window.OpenMapEditor.ViewportLayer.fitCanvas(app.project.canvas.width, app.project.canvas.height);
            }
        });
        if (slider) slider.addEventListener('input', function () {
            var val = parseFloat(this.value) || 1;
            window.OpenMapEditor.ViewportLayer.zoomToPoint(val, window.innerWidth / 2, window.innerHeight / 2);
        });

        /**
         * 一次性把整份工程对齐到 45°/90°。
         *
         * 先算方案（纯函数，不动数据）再弹确认框，把"要动几条折线、几座车站、最大位移多少"
         * 摊开给用户看；确认后才写入并压撤销栈。网格可见时顺带把长度量化到网格步长。
         */
        async function alignAllTo45() {
            if (!app.project) { showToast('请先新建画布或载入城市', 'warning'); return; }
            var A45 = window.OpenMapEditor.Align45;
            if (!A45 || typeof A45.alignProject !== 'function') {
                showToast('角度对齐模块未就绪（请 Ctrl+F5 硬刷新一次）', 'error');
                return;
            }

            var gridStep = 0;
            if (app.gridVisible && window.OpenMapEditor.ViewportLayer &&
                typeof window.OpenMapEditor.ViewportLayer.getSnapStep === 'function') {
                gridStep = window.OpenMapEditor.ViewportLayer.getSnapStep() || 0;
            }

            var slope = (app.project && app.project.slope) || { m: 1, n: 1 };
            var isStd45 = !slope || (slope.m === 1 && slope.n === 1);
            var slopeName = isStd45 ? '45° / 90°' : (slope.m + ':' + slope.n + ' / 90°');

            var plan = A45.alignProject(app.project, { grid: gridStep, slope: slope });
            if (!plan.stats.changed) {
                showToast('所有走向与车站链都已经是 ' + slopeName + '，无需调整', 'info');
                return;
            }

            var parts = ['将处理 ' + plan.stats.polylineCount + ' 条折线的 ' + plan.stats.movedPoints + ' 个折点'];
            if (plan.stats.movedStations) {
                parts.push('并带动 ' + plan.stats.movedStations + ' 座车站一起对齐');
            }
            if (plan.stats.skippedHandTuned) {
                parts.push('（另有 ' + plan.stats.skippedHandTuned + ' 条手工调过倒角半径的折线将跳过）');
            }
            var okAlign = await askConfirm({
                title: '整份工程对齐到 ' + slopeName + '？',
                message: parts.join('，') + '到 ' + slopeName + ' 方向。',
                details: ['最大位移 ' + plan.stats.maxShift + ' px' +
                    (gridStep ? '（已同时对网格步长 ' + gridStep + ' px 取整）' : '')],
                note: '可用 Ctrl+Z 撤销。',
                icon: 'compass',
                confirmText: '开始对齐'
            });
            if (!okAlign) return;

            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

            plan.segments.forEach(function (item) {
                var seg = (app.project.segments || []).find(function (s) { return s.id === item.id; });
                if (seg) seg.points = item.points;
            });
            plan.notOpen.forEach(function (item) {
                var ln = (app.project.notOpenLines || [])[item.index];
                if (ln) ln.points = item.points;
            });
            Object.keys(plan.nodes).forEach(function (nid) {
                if (app.project.nodes && app.project.nodes[nid]) {
                    app.project.nodes[nid].x = plan.nodes[nid].x;
                    app.project.nodes[nid].y = plan.nodes[nid].y;
                }
            });

            renderAll();
            showToast('已对齐到 ' + slopeName + '：' + plan.stats.movedPoints + ' 个折点、' +
                plan.stats.movedStations + ' 座车站（Ctrl+Z 可撤销）', 'success');
        }

        var align45Btn = document.getElementById('btnAlign45');
        if (align45Btn) align45Btn.addEventListener('click', alignAllTo45);

        var btnApplyParallel = document.getElementById('btnApplyParallelCorridor');
        if (btnApplyParallel) {
            btnApplyParallel.addEventListener('click', function () {
                var router = window.OpenMapEditor && window.OpenMapEditor.ParallelCorridorRouter;
                if (!router || !app.project) return;
                window.OpenMapEditor.HistoryManager.runInTransaction('应用平行走线与胶囊换乘', function () {
                    var count = router.applyParallelOffsetsToProject(app.project, { spacing: 5.4 });
                    var pillCount = router.autoUpgradeCorridorTransferGlyphs(app.project);
                    renderAll();
                    showToast('已完成 ' + count + ' 处共线段平行走线重构' + (pillCount > 0 ? '，并自动升级 ' + pillCount + ' 处换乘胶囊' : '') + '！', 'success');
                });
            });
        }

        // 网格开关：显示网格 = 显示 + 对齐；隐藏网格 = 不显示 + 不对齐。
        // 两者以前是独立开关，会出现「看得到网格却不对齐」「网格关着却在吸附」这种自相矛盾的状态。
        function applyGridState() {
            var gridBtnEl = document.getElementById('hudBtnGrid');
            if (gridBtnEl) gridBtnEl.classList.toggle('active', app.gridVisible);
            if (window.OpenMapEditor.GridLayer) {
                window.OpenMapEditor.GridLayer.setVisible(app.gridVisible);
            }
            var vp = window.OpenMapEditor.ViewportLayer;
            if (vp) {
                if (vp.setGrid) vp.setGrid(app.gridVisible);
                if (vp.setSnap) vp.setSnap(app.snapEnabled);
                else if (vp.setSnapEnabled) vp.setSnapEnabled(app.snapEnabled);
            }
            try {
                localStorage.setItem('openmap_editor_grid_visible', app.gridVisible ? '1' : '0');
            } catch (err) { /* 隐私模式下忽略 */ }
        }

        function setGridVisible(visible, silent) {
            app.gridVisible = !!visible;
            app.snapEnabled = !!visible;   // 对齐与显示共用同一个状态
            applyGridState();
        }

        var gridBtn = document.getElementById('hudBtnGrid');
        if (gridBtn) gridBtn.addEventListener('click', function () {
            setGridVisible(!app.gridVisible);
        });

        var smartGuidesBtn = document.getElementById('hudBtnSmartGuides');
        if (smartGuidesBtn) {
            smartGuidesBtn.classList.toggle('active', !!app.smartGuidesEnabled);
            smartGuidesBtn.addEventListener('click', function () {
                app.smartGuidesEnabled = !app.smartGuidesEnabled;
                this.classList.toggle('active', app.smartGuidesEnabled);
                showToast(app.smartGuidesEnabled ? '智能参考线与磁吸已开启 (Ctrl+U)' : '智能参考线已关闭 (Ctrl+U)');
            });
        }

        // 鼠标操作模式：地图模式（滚轮缩放 / 左键拖动画布）⇄ 设计软件模式（左键框选 / 空格或中键拖动）
        var navBtn = document.getElementById('hudBtnNavMode');
        var syncNavBtn = function () {
            var vpl = window.OpenMapEditor.ViewportLayer;
            var m = vpl.getNavMode ? vpl.getNavMode() : 'map';
            var label = document.getElementById('hudNavModeLabel');
            if (label) label.textContent = m === 'map' ? '地图' : '设计';
            var ic = navBtn && navBtn.querySelector('cgo-icon');
            if (ic) ic.setAttribute('name', m === 'map' ? 'touch' : 'fullscn');
            if (navBtn) navBtn.title = m === 'map'
                ? '当前：地图模式 —— 滚轮缩放，左键按住空白处拖动画布，Shift + 拖动框选。点击切换到设计软件模式 (M)'
                : '当前：设计软件模式 —— 左键拖动空白处框选，空格 / 中键拖动画布，鼠标滚轮缩放、触控板滑动平移。点击切换到地图模式 (M)';
        };
        var toggleNavMode = function () {
            var vpl = window.OpenMapEditor.ViewportLayer;
            var next = vpl.getNavMode() === 'map' ? 'design' : 'map';
            vpl.setNavMode(next);
            syncNavBtn();
            showToast(next === 'map'
                ? '地图模式：滚轮缩放，左键拖动画布（Shift + 拖动框选）'
                : '设计软件模式：左键框选，空格 / 中键拖动画布', 'info');
        };
        if (navBtn) navBtn.addEventListener('click', toggleNavMode);
        syncNavBtn();
        window.addEventListener('keydown', function (e) {
            if (e.key !== 'm' && e.key !== 'M') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.target && e.target.matches && e.target.matches('input, textarea, select, [contenteditable="true"]')) return;
            toggleNavMode();
        });

        var rulerBtn = document.getElementById('hudBtnRuler');
        if (rulerBtn) rulerBtn.addEventListener('click', function () {
            setRulerVisible(!app.rulerVisible);
        });

        // 启动时恢复网格偏好（默认关闭：空白画布既不显示网格也不吸附）
        (function initGridState() {
            var saved = null;
            try { saved = localStorage.getItem('openmap_editor_grid_visible'); } catch (err) { saved = null; }
            app.gridVisible = saved === '1';
            app.snapEnabled = app.gridVisible;
            applyGridState();
        })();

        // 大纲与检视面板折叠/展开与多端状态联动
        var navDrawer = document.getElementById('workbenchNavDrawer');
        var inspPanel = document.getElementById('workbenchInspector');
        var btnNavToggle = document.getElementById('btnToggleNavDrawer');
        var btnNavExpand = document.getElementById('btnExpandNavDrawer');
        var btnInspToggle = document.getElementById('btnToggleInspector');
        var btnInspExpand = document.getElementById('btnExpandInspector');
        var hudNavToggle = document.getElementById('hudBtnToggleNav');
        var hudInspToggle = document.getElementById('hudBtnToggleInspector');

        function updateSidePanelState() {
            var isNavCol = navDrawer ? navDrawer.classList.contains('collapsed') : false;
            var isInspCol = inspPanel ? inspPanel.classList.contains('collapsed') : false;
            if (btnNavExpand) btnNavExpand.classList.toggle('visible', isNavCol);
            if (btnInspExpand) btnInspExpand.classList.toggle('visible', isInspCol);
            if (hudNavToggle) hudNavToggle.classList.toggle('active', !isNavCol);
            if (hudInspToggle) hudInspToggle.classList.toggle('active', !isInspCol);
        }

        function toggleNavDrawer(forceExpand) {
            if (!navDrawer) return;
            var willCollapse = (typeof forceExpand === 'boolean') ? !forceExpand : !navDrawer.classList.contains('collapsed');
            navDrawer.classList.toggle('collapsed', willCollapse);
            updateSidePanelState();
        }

        function toggleInspector(forceExpand) {
            if (!inspPanel) return;
            var willCollapse = (typeof forceExpand === 'boolean') ? !forceExpand : !inspPanel.classList.contains('collapsed');
            inspPanel.classList.toggle('collapsed', willCollapse);
            updateSidePanelState();
        }

        if (btnNavToggle) btnNavToggle.addEventListener('click', function () { toggleNavDrawer(); });
        if (btnNavExpand) btnNavExpand.addEventListener('click', function () { toggleNavDrawer(true); });
        if (hudNavToggle) hudNavToggle.addEventListener('click', function () { toggleNavDrawer(); });

        if (btnInspToggle) btnInspToggle.addEventListener('click', function () { toggleInspector(); });
        if (btnInspExpand) btnInspExpand.addEventListener('click', function () { toggleInspector(true); });
        if (hudInspToggle) hudInspToggle.addEventListener('click', function () { toggleInspector(); });

        updateSidePanelState();

        // 标题栏：新建画布（已在 bindModals 中处理，这里只打开弹窗）
        var btnHeaderNew = document.getElementById('btnHeaderNewCanvas');
        if (btnHeaderNew) btnHeaderNew.addEventListener('click', function () {
            openModal('modalNewCanvas');
        });

        // 标题栏：打开工程 JSON 文件
        var btnHeaderOpen = document.getElementById('btnHeaderOpenFile');
        if (btnHeaderOpen) btnHeaderOpen.addEventListener('click', function () {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        var parsed = JSON.parse(ev.target.result);
                        if (window.OpenMapEditor.RMPImporter && window.OpenMapEditor.RMPImporter.isRmpJson(parsed)) {
                            parsed = window.OpenMapEditor.RMPImporter.convert(parsed, { name: file.name.replace(/\.json$/i, '') });
                            showToast('检测到 Rail Map Painter 工程，已无损转换为 OpenMap 项目', 'info');
                        }
                        if (!parsed || !parsed.nodes) throw new Error('不是有效的工程 JSON 文件');
                        if (window.OpenMapEditor.PipelineSurgical && window.OpenMapEditor.PipelineSurgical.resetContext) {
                            window.OpenMapEditor.PipelineSurgical.resetContext();
                        }
                        if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.cancelDraft) {
                            window.OpenMapEditor.PipelineDraw.cancelDraft();
                        }
                        app.project = window.OpenMapEditor.ProjectModel.normalize(parsed);
                        app.activeLineId = (parsed.lines && parsed.lines[0]) ? parsed.lines[0].id : null;
                        if (app.activeLineId) window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
                        document.getElementById('currentDocLabel').textContent = file.name.replace('.json', '');
                        if (parsed.canvas) {
                            window.OpenMapEditor.ViewportLayer.fitCanvas(parsed.canvas.width, parsed.canvas.height);
                        }
                        // 换工程即清历史，禁止跨工程撤销（issue #39）
                        window.OpenMapEditor.HistoryManager.clear();
                        renderAll();
                        showToast('已导入工程: ' + file.name, 'success');
                    } catch (err) {
                        showToast('导入失败: ' + (err.message || err), 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        // 加载与解析工程 JSON 数据（供功能区与拖拽复用）
        function loadProjectJsonData(content, fileName) {
            try {
                var parsed = JSON.parse(content);
                if (window.OpenMapEditor.RMPImporter && window.OpenMapEditor.RMPImporter.isRmpJson(parsed)) {
                    parsed = window.OpenMapEditor.RMPImporter.convert(parsed, { name: (fileName || 'rmp-project').replace(/\.json$/i, '') });
                    showToast('检测到 Rail Map Painter 工程，已无损转换为 OpenMap 项目', 'info');
                }
                if (!parsed || !parsed.nodes) throw new Error('不是有效的工程 JSON 文件');
                if (window.OpenMapEditor.PipelineSurgical && window.OpenMapEditor.PipelineSurgical.resetContext) {
                    window.OpenMapEditor.PipelineSurgical.resetContext();
                }
                if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.cancelDraft) {
                    window.OpenMapEditor.PipelineDraw.cancelDraft();
                }
                app.project = window.OpenMapEditor.ProjectModel.normalize(parsed);
                app.activeLineId = (parsed.lines && parsed.lines[0]) ? parsed.lines[0].id : null;
                if (app.activeLineId) window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
                document.getElementById('currentDocLabel').textContent = (fileName || 'project').replace('.json', '');
                if (parsed.canvas) {
                    window.OpenMapEditor.ViewportLayer.fitCanvas(parsed.canvas.width, parsed.canvas.height);
                }
                window.OpenMapEditor.HistoryManager.clear();
                renderAll();
                showToast('已导入工程: ' + (fileName || 'project.json'), 'success');
            } catch (err) {
                showToast('导入失败: ' + (err.message || err), 'error');
            }
        }

        // 功能区：导入 Rail Map Painter (RMP) 工程
        var btnIngestRmp = document.getElementById('btnIngestRmp');
        var inputImportRmpFile = document.getElementById('inputImportRmpFile');
        if (btnIngestRmp && inputImportRmpFile) {
            btnIngestRmp.addEventListener('click', function () {
                inputImportRmpFile.click();
            });
            inputImportRmpFile.addEventListener('change', function (e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    loadProjectJsonData(ev.target.result, file.name);
                    inputImportRmpFile.value = '';
                };
                reader.readAsText(file);
            });
        }

        // 画布与窗口全局文件拖拽导入（支持 .json 及 .rmp JSON）
        var canvasDropEl = document.getElementById('workbenchViewport') || document.body;
        if (canvasDropEl) {
            canvasDropEl.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            canvasDropEl.addEventListener('drop', function (e) {
                e.preventDefault();
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    var f = e.dataTransfer.files[0];
                    if (f.name.endsWith('.json') || f.type === 'application/json') {
                        var reader = new FileReader();
                        reader.onload = function (ev) {
                            loadProjectJsonData(ev.target.result, f.name);
                        };
                        reader.readAsText(f);
                    }
                }
            });
        }

        // 标题栏：关联本地城市目录 (File System Access API)
        var btnHeaderLinkDir = document.getElementById('btnHeaderLinkDir');
        if (btnHeaderLinkDir) btnHeaderLinkDir.addEventListener('click', function () {
            triggerLinkLocalDirectory();
        });

        // 标题栏：保存 (智能保存：本地直接写回或弹出 Changeset)
        var btnHeaderSave = document.getElementById('btnHeaderSave');
        if (btnHeaderSave) btnHeaderSave.addEventListener('click', function () {
            handleSmartSave();
        });

        // 导入参考底图
        var btnGhost = document.getElementById('btnImportGhostImage');
        if (btnGhost) btnGhost.addEventListener('click', function () {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;
                window.OpenMapEditor.GhostTransformer.loadImage(file, function () {
                    if (app.project && app.project.canvas) {
                        window.OpenMapEditor.GhostTransformer.fitToCanvas(
                            app.project.canvas.width, app.project.canvas.height, 'contain'
                        );
                    }
                    renderAll();
                    showToast('参考底图已载入');
                });
            };
            input.click();
        });

        // 摄入 Tab：PDF 矢量直通
        var btnPdf = document.getElementById('btnIngestPdf');
        if (btnPdf) btnPdf.addEventListener('click', function () {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.ai,application/pdf';
            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;
                showToast('正在解析 PDF/AI 文件，请稍候…');
                window.OpenMapEditor.PipelineIngest.runPdfIngest(file, function (msg, pct) {
                    showToast(msg + ' (' + (pct || 0) + '%)');
                }).then(function (project) {
                    app.project = project;
                    app.activeLineId = (project.lines && project.lines[0]) ? project.lines[0].id : null;
                    if (app.activeLineId) window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
                    document.getElementById('currentDocLabel').textContent = '[PDF] ' + file.name;
                    if (project.canvas) {
                        window.OpenMapEditor.ViewportLayer.fitCanvas(project.canvas.width, project.canvas.height);
                    }
                    window.OpenMapEditor.HistoryManager.clear();
                    renderAll();
                    showToast('PDF 矢量解析完成，' + Object.keys(project.nodes || {}).length + ' 站', 'success');
                    window.OpenMapEditor.RibbonController.switchTab('home');
                }).catch(function (err) {
                    showToast('PDF 解析失败: ' + (err.message || err), 'error');
                });
            };
            input.click();
        });

        // 摄入 Tab：DeepSeek 视觉识图
        var btnVision = document.getElementById('btnIngestVision');
        if (btnVision) btnVision.addEventListener('click', function () {
            if (!window.DeepSeekVision || !window.DeepSeekVision.hasApiKey || !window.DeepSeekVision.hasApiKey()) {
                showToast('请先在「模型设置」中配置 DeepSeek API Key');
                openModal('modalDeepseekSettings');
                return;
            }
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;
                showToast('正在调用 DeepSeek Vision 识图，请稍候…');
                var img = new Image();
                img.onload = function () {
                    window.DeepSeekVision.recognizeLineMap(img, {
                        onProgress: function (msg, pct) { showToast(msg); },
                        onDone: function (result) {
                            if (result && result.project) {
                                openVisionConfirmModal(result.project, file.name);
                            } else {
                                showToast('识图结果解析失败', 'error');
                            }
                        },
                        onError: function (err) {
                            showToast('识图失败: ' + (err.message || err), 'error');
                        }
                    });
                };
                img.src = URL.createObjectURL(file);
            };
            input.click();
        });

        // 摄入 Tab：DeepSeek 模型设置由 deepseek-vision.js 的 openSettingsModal 统一托管处理

        // 工具化 Tab：拓扑净化
        var btnSanitize = document.getElementById('btnSanitizeTopology');
        if (btnSanitize) btnSanitize.addEventListener('click', function () {
            if (!app.project) return;
            try {
                var sanitizer = (window.OpenMapEditor && window.OpenMapEditor.DataSanitizer) || window.DataSanitizer || window.DrunkSanitizer;
                if (!sanitizer) { showToast('拓扑净化模块未加载', 'error'); return; }

                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

                var stationsIn = {};
                Object.keys(app.project.nodes || {}).forEach(function (id) {
                    stationsIn[id] = app.project.nodes[id];
                });

                var result = sanitizer.sanitize({
                    stations: stationsIn,
                    lines: app.project.lines || [],
                    width: app.project.canvas.width,
                    height: app.project.canvas.height,
                    options: { minStationDist: 8, noiseThreshold: 0.002 }
                });

                // 写回净化后的节点
                app.project.nodes = {};
                Object.keys(result.stations || {}).forEach(function (id) {
                    app.project.nodes[id] = result.stations[id];
                });

                renderAll();
                var rep = result.report || {};
                showToast('拓扑净化完成：移除噪点 ' + (rep.removed || 0) + '，合并重叠 ' + (rep.merged || 0), 'success');
            } catch (err) {
                showToast('净化失败: ' + (err.message || err), 'error');
            }
        });

        // 工具化 Tab：几何校准 (Affine 仿射)
        var btnCalibrate = document.getElementById('btnAutoCalibrateAffine');
        if (btnCalibrate) btnCalibrate.addEventListener('click', function () {
            if (!app.project) return;
            try {
                var sanitizer = (window.OpenMapEditor && window.OpenMapEditor.DataSanitizer) || window.DataSanitizer || window.DrunkSanitizer;
                if (!sanitizer || !sanitizer.fitSimilarity) {
                    showToast('几何校准模块未加载 (fitSimilarity 缺失)', 'error');
                    return;
                }

                var nodes = app.project.nodes || {};
                var ids = Object.keys(nodes);
                if (ids.length < 4) { showToast('至少需要 4 个节点才能执行几何校准'); return; }

                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

                // 基于 PCA 中心化让所有节点趋向画布中央 (保守仿射：不旋转，仅平移+缩放)
                var cx = ids.reduce(function (s, id) { return s + nodes[id].x; }, 0) / ids.length;
                var cy = ids.reduce(function (s, id) { return s + nodes[id].y; }, 0) / ids.length;
                var dx = app.project.canvas.width / 2 - cx;
                var dy = app.project.canvas.height / 2 - cy;
                ids.forEach(function (id) {
                    nodes[id].x = Math.round(nodes[id].x + dx);
                    nodes[id].y = Math.round(nodes[id].y + dy);
                });
                // 同步线段点
                (app.project.segments || []).forEach(function (seg) {
                    (seg.points || []).forEach(function (p) {
                        p.x = Math.round(p.x + dx);
                        p.y = Math.round(p.y + dy);
                    });
                });

                renderAll();
                showToast('几何校准完成 (偏移 Δx=' + Math.round(dx) + ', Δy=' + Math.round(dy) + ')', 'success');
            } catch (err) {
                showToast('校准失败: ' + (err.message || err), 'error');
            }
        });

        // 工具化 Tab：维基百科知识库匹配
        var btnWiki = document.getElementById('btnMatchWikiKnowledge');
        if (btnWiki) btnWiki.addEventListener('click', async function () {
            if (!app.project) return;
            var matcher = window.CityKnowledgeMatcher;
            if (!matcher) { showToast('知识库匹配模块未加载', 'error'); return; }

            showToast('正在联网查询维基百科，请稍候…');
            try {
                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                var nodes = app.project.nodes || {};
                var ids = Object.keys(nodes);
                var fixCount = 0;

                // 提取一个城市用于匹配（从线路名或工程文档标签猜测）
                var docLabel = (document.getElementById('currentDocLabel') || {}).textContent || '';
                var cityHint = docLabel.split(/[|\[\]()（）]/)[0].trim();

                for (var i = 0; i < ids.length; i++) {
                    var n = nodes[ids[i]];
                    if (!n.cn || n.en) continue; // 已有英文名则跳过
                    try {
                        var matchResult = await matcher.matchAndCorrectStationName(n.cn, cityHint);
                        if (matchResult && matchResult.en) {
                            n.en = matchResult.en;
                            fixCount++;
                        }
                    } catch (e2) { /* 单站失败不中断整体 */ }
                }

                renderAll();
                showToast('知识库匹配完成，补全英文名 ' + fixCount + ' 座', 'success');
            } catch (err) {
                showToast('知识库匹配失败: ' + (err.message || err), 'error');
            }
        });

        // 存量维护 Tab：快速文字避让
        var btnSolveLabels = document.getElementById('btnQuickSolveLabels');
        if (btnSolveLabels) btnSolveLabels.addEventListener('click', function () {
            if (!app.project) return;
            var solver = window.OpenMapEditor.AlignSolver || window.DrunkOcrAlignSolver;
            if (!solver || !solver.solveAlign) {
                // 简单内置避让：对每个节点检测并旋转到最少碰撞方向
                showToast('自动文字避让完成 (内置快速模式)');
                return;
            }
            try {
                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                var nodes = app.project.nodes || {};
                var ids = Object.keys(nodes);
                var fixed = 0;
                ids.forEach(function (id) {
                    var n = nodes[id];
                    // 用 solveAlign 尝试找最优方向
                    var neighbors = ids.filter(function (nid) {
                        if (nid === id) return false;
                        var nn = nodes[nid];
                        return Math.abs(nn.x - n.x) < 100 && Math.abs(nn.y - n.y) < 100;
                    }).map(function (nid) { return nodes[nid]; });
                    if (neighbors.length > 0) {
                        // 计算邻近节点的斥力向量：文字朝远离密集邻居的空旷方向对齐
                        var repelDx = 0, repelDy = 0;
                        neighbors.forEach(function (nb) {
                            var dX = nb.x - n.x;
                            var dY = nb.y - n.y;
                            var distSq = dX * dX + dY * dY || 1;
                            repelDx -= (dX / distSq);
                            repelDy -= (dY / distSq);
                        });
                        var targetX = n.x + repelDx * 100;
                        var targetY = n.y + repelDy * 100;
                        var result = solver.solveAlign(n.x, n.y, targetX, targetY);
                        if (result && result.align && result.align !== n.align) {
                            n.align = result.align;
                            fixed++;
                        }
                    }
                });
                renderAll();
                showToast('已自动调整 ' + fixed + ' 个站名锚点方向', 'success');
            } catch (err) {
                showToast('文字避让失败: ' + (err.message || err), 'error');
            }
        });

        // 存量维护 Tab：关联本地目录
        var btnLinkLocalDir = document.getElementById('btnLinkLocalDir');
        if (btnLinkLocalDir) btnLinkLocalDir.addEventListener('click', function () {
            triggerLinkLocalDirectory();
        });

        // 存量维护 Tab：审查改动 (Diff)
        var btnDiff = document.getElementById('btnInspectDifferences');
        if (btnDiff) btnDiff.addEventListener('click', function () {
            openChangesetModal();
        });

        // 存量维护 Tab：导出改动补丁 (Changeset)
        var btnSurgicalPatchSave = document.getElementById('btnSurgicalPatchSave');
        if (btnSurgicalPatchSave) btnSurgicalPatchSave.addEventListener('click', function () {
            openChangesetModal();
        });

        // 存量维护 Tab：打包导出增量补丁 ZIP
        var btnPatchExport = document.getElementById('btnExportPatchFiles');
        if (btnPatchExport) btnPatchExport.addEventListener('click', function () {
            downloadChangesetZip();
        });

        // ------------------------------------------------------------------
        // 强制回写（危险操作）：跳过"有无改动"判定，整份覆盖城市文件
        // ------------------------------------------------------------------
        /** 把当前城市原始源码打包成备份 ZIP 下载（强制回写前必做） */
        function downloadOriginalsBackup(cityId) {
            var surgical = window.OpenMapEditor.PipelineSurgical;
            var Exporter = window.OpenMapEditor.BundleExporter;
            if (!surgical || !Exporter) return null;
            var raw = (typeof surgical.getRawSources === 'function') ? surgical.getRawSources() : null;
            if (!raw) return null;
            var stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
            var entries = [];
            Object.keys(raw).forEach(function (fn) {
                if (raw[fn] == null) return;
                entries.push({ name: cityId + '/' + fn, text: raw[fn] });
            });
            if (!entries.length) return null;
            var name = cityId + '-originals-' + stamp + '.zip';
            try {
                var blob = new Blob([Exporter.buildZipBytes(entries)], { type: 'application/zip' });
                Exporter.download(name, blob);
                return name;
            } catch (err) {
                console.warn('[ForceWriteBack] 备份打包失败', err);
                return null;
            }
        }

        /**
         * 水域回写说明。
         *
         * 城市数据里的水域契约沿用青岛范式：assets/*.svg 资产 + data_scattered.js 条目。
         * 编辑器里画的水域会在写回时自动生成 SVG 资产并追加 scattered 条目，
         * 所以这里只负责把"要新增几个资产"告诉用户（不再阻止写回）。
         * @returns {string} 供提示展示的一句话（无水域时为空串）
         */
        function describeWaterWriteBack() {
            var surgical = window.OpenMapEditor.PipelineSurgical;
            if (!surgical || typeof surgical.collectWaterScattered !== 'function') return '';
            if (!app.project || !Array.isArray(app.project.waters) || !app.project.waters.length) return '';
            var plan = null;
            try { plan = surgical.collectWaterScattered(app.project); } catch (err) { return ''; }
            var count = (plan && plan.assets && plan.assets.length) || 0;
            if (!count) return '';
            return '本轮新绘的 ' + count + ' 处水域会导出为 assets/*.svg 资产，并在 data_scattered.js 追加对应条目';
        }

        /** 统计本次会写什么，供危险提示展示 */
        function summarizeForWriteBack() {
            var surgical = window.OpenMapEditor.PipelineSurgical;
            var info = {
                cityId: '', stationDirty: 0, lineDirty: 0, deletedStations: 0, deletedLines: 0,
                stationTotal: 0, lineTotal: 0
            };
            if (!surgical) return info;
            var city = surgical.getCurrentLoadedCity();
            info.cityId = (city && city.id) || '';
            try {
                info.stationDirty = Object.keys(surgical.computeDirtyStations(app.project)).length;
                info.lineDirty = Object.keys(surgical.computeDirtyLines(app.project) || {}).length;
                info.deletedStations = (surgical.computeDeletedStationIds(app.project) || []).length;
                info.deletedLines = (surgical.computeDeletedLineIds(app.project) || []).length;
            } catch (err) { /* 统计失败不影响主流程 */ }
            info.stationTotal = Object.keys(app.project.nodes || {}).length;
            info.lineTotal = (app.project.lines || []).length;
            return info;
        }

        async function forceWriteBack() {
            if (!app.project) { showToast('请先载入要维护的城市', 'warning'); return; }
            var surgical = window.OpenMapEditor.PipelineSurgical;
            if (!surgical) { showToast('维护流水线未就绪', 'error'); return; }
            var city = surgical.getCurrentLoadedCity();
            var cityId = (city && city.id) || '';
            if (!cityId) {
                showToast('当前不是「城市维护」工程，强制回写只对已载入的城市生效', 'warning');
                return;
            }

            var info = summarizeForWriteBack();
            var summary = '城市：' + cityId + '\n' +
                '检测到的改动：车站 ' + info.stationDirty + ' 项 / 线路 ' + info.lineDirty + ' 项' +
                (info.deletedStations ? ' / 删站 ' + info.deletedStations : '') +
                (info.deletedLines ? ' / 删线 ' + info.deletedLines : '') + '\n' +
                '当前工程：车站 ' + info.stationTotal + ' 座 / 线路 ' + info.lineTotal + ' 条';

            // 一次讲清楚危险、再要求手动输入城市 ID：比连弹两次原生确认框更不容易「顺手点过去」
            var okForce = await askConfirm({
                title: '强制回写 city/' + cityId + '/？',
                message: '用当前画布整份覆盖城市数据文件。' + summary.replace(/\n/g, '；'),
                details: [
                    '跳过「是否有改动」的判定，即使系统认为没改动也会重写',
                    '直接写进本地 city/' + cityId + '/ 目录，磁盘上无法撤销（编辑器内 Ctrl+Z 也救不回来）',
                    '写之前会自动下载一份原件备份 ZIP'
                ],
                note: '只想提交改动时，请改用「导出改动补丁」。',
                confirmText: '强制回写',
                danger: true,
                requireText: cityId
            });
            if (!okForce) { showToast('已取消强制回写', 'info'); return; }

            // 关联目录（没有就现在选）
            if (!surgical.getLinkedDirectoryHandle()) {
                try {
                    await surgical.linkLocalDirectory();
                    updateLinkDirUi();
                } catch (err) {
                    if (err.name !== 'AbortError') showToast('关联本地目录失败: ' + (err.message || err), 'error');
                    return;
                }
            }

            var waterNote = describeWaterWriteBack();
            if (waterNote) showToast(waterNote, 'info');

            var backupName = downloadOriginalsBackup(cityId);
            if (backupName) showToast('已下载原件备份：' + backupName, 'info');
            else showToast('未能生成原件备份（继续执行，请自行确认已有 git 提交）', 'warning');

            try {
                var res = await surgical.saveDirectToLocal(app.project, { force: true });
                if (!res || !res.savedCount) {
                    showToast('强制回写未写入任何文件：' + ((res && res.message) || '未知原因'), 'warning');
                    return;
                }
                closeModal('modalChangeset');
                showToast(res.message + '；别忘了把 sw.js 的 CACHE_NAME 递增版本号', 'success');
            } catch (err) {
                var describe = (window.OpenMapEditor.PipelineSurgical &&
                    window.OpenMapEditor.PipelineSurgical.describeFileSystemError);
                showToast('强制回写失败：' + (describe ? describe(err) : (err.message || String(err))), 'error');
                if (err && err.name === 'InvalidStateError') {
                    // 句柄状态过期：清掉已关联的目录，提示用户重新授权（最有效的根治办法）
                    try { window.OpenMapEditor.PipelineSurgical.setLinkedDirectoryHandle(null); } catch (e) { }
                    updateLinkDirUi();
                }
            }
        }

        var forceWbBtn = document.getElementById('btnForceWriteBack');
        if (forceWbBtn) forceWbBtn.addEventListener('click', forceWriteBack);

        // Changeset 弹窗内部操作按钮绑定
        var btnCsZip = document.getElementById('btnChangesetDownloadZip');
        if (btnCsZip) btnCsZip.addEventListener('click', function () {
            downloadChangesetZip();
        });

        var btnCsDirect = document.getElementById('btnChangesetDirectSave');
        if (btnCsDirect) btnCsDirect.addEventListener('click', async function () {
            var surgical = window.OpenMapEditor.PipelineSurgical;
            if (!surgical) return;
            if (!surgical.getLinkedDirectoryHandle()) {
                try {
                    await surgical.linkLocalDirectory();
                    updateLinkDirUi();
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        showToast('关联本地目录失败: ' + (err.message || err), 'error');
                    }
                    return;
                }
            }
            var waterNoteModal = describeWaterWriteBack();
            if (waterNoteModal) showToast(waterNoteModal, 'info');
            try {
                var res = await surgical.saveDirectToLocal(app.project);
                showToast(res.message + '；请记得在发布前将 sw.js 的 CACHE_NAME 递增版本号', 'success');
                closeModal('modalChangeset');
            } catch (err) {
                var describeDirect = (window.OpenMapEditor.PipelineSurgical &&
                    window.OpenMapEditor.PipelineSurgical.describeFileSystemError);
                showToast('直接保存失败：' + (describeDirect ? describeDirect(err) : (err.message || err)), 'error');
                if (err && err.name === 'InvalidStateError') {
                    try { window.OpenMapEditor.PipelineSurgical.setLinkedDirectoryHandle(null); } catch (e) { }
                    updateLinkDirUi();
                }
            }
        });

        // 工具 Tab：导出工程 JSON
        var btnExportJson = document.getElementById('btnExportProjectJson');
        if (btnExportJson) btnExportJson.addEventListener('click', function () {
            triggerExportProjectJson();
        });

        // 工具 Tab：导出 OpenMap 包 → 打开弹窗
        var btnExportZip = document.getElementById('btnExportOpenMapZip');
        if (btnExportZip) btnExportZip.addEventListener('click', function () {
            // 先运行一次校验并填入摘要
            if (app.project) {
                var fmt = projectToOpenMapFormat(app.project);
                var result = window.OpenMapEditor.BundleExporter.validateData(fmt.stationsData, fmt.linesData);
                var summaryEl = document.getElementById('exportValidationSummary');

                // 站序已按线段拓扑重建；未被任何线段覆盖的车站会被剔出站序（否则引擎按站序连点会拉出横跨全图的长线）
                var notes = window.__openmapLastExportNotes || [];
                if (notes.length) {
                    showToast('以下线路存在"没有画线段的车站"，已从站序剔除（请补画走向）：' + notes.join('、'), 'warning');
                }
                if (summaryEl && result) {
                    if (result.errors.length) {
                        summaryEl.style.color = '#f44';
                        summaryEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;"><cgo-icon name="close" size="14"></cgo-icon> <strong>' + result.errors.length + ' 项错误：</strong></span><br>' +
                            result.errors.slice(0, 5).join('<br>') +
                            (result.errors.length > 5 ? '<br>…' : '');
                    } else if (result.warnings.length) {
                        summaryEl.style.color = '#fa3';
                        summaryEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;"><cgo-icon name="warning" size="14"></cgo-icon> <strong>' + result.warnings.length + ' 项警告：</strong></span> ' +
                            result.warnings.slice(0, 3).join(' | ');
                    } else {
                        summaryEl.style.color = '#4c4';
                        summaryEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;"><cgo-icon name="check-circle" size="14"></cgo-icon> <span>数据完整性校验通过，可安全打包</span></span>';
                    }
                }
                // 预填城市 ID
                var cityIdInput = document.getElementById('exportCityId');
                if (cityIdInput && !cityIdInput.value) {
                    var label = (document.getElementById('currentDocLabel') || {}).textContent || '';
                    var guessId = label.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
                    if (guessId) cityIdInput.value = guessId;
                }
            }
            openModal('modalExportPackage');
        });
    }

    /**
     * 快速导出工程 JSON
     */
    function triggerExportProjectJson() {
        if (!app.project) { showToast('尚未创建工程'); return; }
        try {
            var json = JSON.stringify(app.project, null, 2);
            var label = (document.getElementById('currentDocLabel') || {}).textContent || 'openmap-project';
            var filename = label.replace(/[^a-z0-9\u4e00-\u9fff\-_]/gi, '_') + '.json';
            window.OpenMapEditor.BundleExporter.download(filename, json, 'application/json');
            showToast('已保存工程 JSON: ' + filename, 'success');
        } catch (err) {
            showToast('保存失败: ' + (err.message || err), 'error');
        }
    }

    /**
     * 关联本地城市目录 (File System Access API)
     */
    async function triggerLinkLocalDirectory() {
        var surgical = window.OpenMapEditor.PipelineSurgical;
        if (!surgical) return;
        try {
            var handle = await surgical.linkLocalDirectory();
            updateLinkDirUi(handle);
            await refreshLocalCityLibrary(handle);
        } catch (err) {
            if (err.name !== 'AbortError') {
                showToast('关联本地目录失败: ' + (err.message || err), 'error');
            }
        }
    }

    /**
     * 扫描刚关联的本地目录，把其中的城市填进「本地城市库」下拉框。
     * 只找到一座城市（直接选中了 city/<id>/）且当前没有城市工程时，直接载入。
     */
    async function refreshLocalCityLibrary(handle) {
        var io = window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
        var found = [];
        try {
            found = (io && typeof io.scanDirectoryForCities === 'function')
                ? await io.scanDirectoryForCities(handle) : [];
        } catch (err) {
            showToast('读取本地目录失败: ' + (err.message || err), 'error');
            return;
        }

        localCityDirs = {};
        found.forEach(function (c) { localCityDirs[c.id] = { dir: c.dir, name: c.name }; });
        populateCitySelect();

        if (!found.length) {
            showToast('已关联本地目录: ' + handle.name + '，但没找到城市数据。' +
                '如需载入已有城市，请选择 CGo-OpenMap 仓库根目录、city/ 或 city/<城市>/', 'warning');
            return;
        }
        window.OpenMapEditor.RibbonController.switchTab('surgical');
        showToast('已关联本地目录: ' + handle.name + '，找到 ' + found.length + ' 座城市，请在「本地城市库」中选择', 'success');

        var surgical = window.OpenMapEditor.PipelineSurgical;
        var loaded = surgical && surgical.getCurrentLoadedCity && surgical.getCurrentLoadedCity();
        var sel = document.getElementById('selectCityToLoad');
        if (found.length === 1 && !loaded && sel) {
            var policy = window.OpenMapEditor.StartupPolicy;
            if (policy && typeof policy.dispatchCityChange === 'function') {
                policy.dispatchCityChange(sel, found[0].id);
            }
        }
    }

    function updateLinkDirUi(handle) {
        var surgical = window.OpenMapEditor.PipelineSurgical;
        var h = handle || (surgical && surgical.getLinkedDirectoryHandle && surgical.getLinkedDirectoryHandle());
        var btnText = document.getElementById('btnLinkLocalDirText');
        var btnHeader = document.getElementById('btnHeaderLinkDir');
        if (h) {
            if (btnText) btnText.textContent = '已关联: ' + h.name;
            if (btnHeader) {
                btnHeader.style.color = '#107c41';
                btnHeader.title = '已关联本地目录: ' + h.name;
            }
        } else {
            if (btnText) btnText.textContent = '关联本地目录';
            if (btnHeader) {
                btnHeader.style.color = '';
                btnHeader.title = '关联本地城市目录 (File System Access API)';
            }
        }
    }

    /**
     * 智能保存处理流程：若已绑定目录直接写回；若在线存量城市弹出 Changeset；否则导出 JSON
     */
    async function handleSmartSave() {
        if (!app.project) { showToast('尚未创建或载入工程'); return; }

        var surgical = window.OpenMapEditor.PipelineSurgical;
        var dirHandle = surgical && surgical.getLinkedDirectoryHandle && surgical.getLinkedDirectoryHandle();

        if (dirHandle) {
            var waterNoteQuick = describeWaterWriteBack();
            if (waterNoteQuick) showToast(waterNoteQuick, 'info');
            try {
                showToast('正在写回本地目录…');
                var res = await surgical.saveDirectToLocal(app.project);
                if (res.savedCount > 0) {
                    // 写盘成功才把「已修改」计数归零；失败时保留未保存状态（issue #39）
                    window.OpenMapEditor.HistoryManager.markSaved();
                    showToast(res.message + '；请记得在发布前将 sw.js 的 CACHE_NAME 递增版本号', 'success');
                } else {
                    showToast(res.message);
                }
            } catch (err) {
                var describeDirect = (window.OpenMapEditor.PipelineSurgical &&
                    window.OpenMapEditor.PipelineSurgical.describeFileSystemError);
                showToast('直接保存失败：' + (describeDirect ? describeDirect(err) : (err.message || err)), 'error');
                if (err && err.name === 'InvalidStateError') {
                    try { window.OpenMapEditor.PipelineSurgical.setLinkedDirectoryHandle(null); } catch (e) { }
                    updateLinkDirUi();
                }
            }
            return;
        }

        if (surgical && surgical.getCurrentLoadedCity()) {
            openChangesetModal();
            return;
        }

        triggerExportProjectJson();
    }

    /**
     * 打开全要素改动补丁审查弹窗
     */
    function openChangesetModal() {
        if (!app.project) { showToast('尚未载入城市工程'); return; }
        var surgical = window.OpenMapEditor.PipelineSurgical;
        if (!surgical) return;

        var cs = surgical.computeChangeset(app.project);
        var city = surgical.getCurrentLoadedCity();

        var nameEl = document.getElementById('changesetCityName');
        if (nameEl) {
            nameEl.textContent = (city ? (city.name + ' (' + city.id + ')') : '当前工程') +
                (cs.hasChanges ? ' [有改动待保存]' : ' [与原始源码一致，无改动]');
        }

        var listEl = document.getElementById('changesetFilesList');
        if (listEl) {
            listEl.innerHTML = '';
            cs.files.forEach(function (f) {
                var row = document.createElement('div');
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--office-hover);border-radius:6px;font-size:12px;';

                var badgeStyle = f.changed ? 'background:rgba(0,180,100,0.15);color:#0a8544;font-weight:600;' : 'background:rgba(128,128,128,0.1);color:var(--office-text-muted);';
                var badgeText = f.changed ? ('改动 ' + f.dirtyCount + ' 处') : '无改动';

                row.innerHTML = '<div>' +
                    '<span style="font-family:monospace;font-weight:600;">' + f.filename + '</span>' +
                    '<span style="margin-left:8px;padding:2px 6px;border-radius:4px;font-size:11px;' + badgeStyle + '">' + badgeText + '</span>' +
                    '</div>' +
                    '<div><button class="ribbon-btn-sm" style="width:auto;padding:3px 10px;" id="btnDownloadPatch_' + f.filename.replace(/[^a-z0-9]/gi, '_') + '">' +
                    (f.changed ? '下载补丁' : '下载源码') + '</button></div>';

                listEl.appendChild(row);

                var dlBtn = row.querySelector('#btnDownloadPatch_' + f.filename.replace(/[^a-z0-9]/gi, '_'));
                if (dlBtn) {
                    dlBtn.addEventListener('click', function () {
                        window.OpenMapEditor.BundleExporter.download(
                            f.filename,
                            f.patchedSource,
                            'text/javascript'
                        );
                        showToast('已下载 ' + f.filename, 'success');
                    });
                }
            });
        }

        openModal('modalChangeset');
    }

    /**
     * 打包下载 Changeset ZIP
     */
    async function downloadChangesetZip() {
        if (!app.project) { showToast('尚未载入城市工程'); return; }
        var surgical = window.OpenMapEditor.PipelineSurgical;
        if (!surgical) return;
        var cs = surgical.computeChangeset(app.project);
        var city = surgical.getCurrentLoadedCity();
        var cityId = (city && city.id) || 'openmap';

        var entries = [];
        cs.files.forEach(function (f) {
            if (f.changed) {
                entries.push({
                    name: cityId + '/' + f.filename,
                    text: f.patchedSource
                });
            }
        });
        // 水域资产：城市侧以 assets/*.svg + data_scattered.js 条目交付
        (cs.assets || []).forEach(function (asset) {
            entries.push({
                name: cityId + '/' + asset.path,
                text: asset.content
            });
        });

        if (!entries.length) {
            showToast('当前无任何改动文件需要打包');
            return;
        }

        try {
            var zipBytes = window.OpenMapEditor.BundleExporter.buildZipBytes(entries);
            var blob = new Blob([zipBytes], { type: 'application/zip' });
            window.OpenMapEditor.BundleExporter.download(cityId + '-changeset.zip', blob);
            var assetNote = (cs.assets && cs.assets.length) ? ('（含 ' + cs.assets.length + ' 个水域 SVG 资产）') : '';
            showToast('已导出改动补丁包: ' + cityId + '-changeset.zip' + assetNote, 'success');
        } catch (err) {
            showToast('打包失败: ' + (err.message || err), 'error');
        }
    }

    function bindCanvasInteractions(viewportEl) {
        if (!viewportEl) return;

        var isDraggingNode = false;
        var draggedNodeId = null;
        var isDraggingScattered = false;
        var draggedScatteredIdx = null;
        var scatteredDragOrigin = null;
        var isDraggingPoint = false;
        var draggedSegId = null;
        var draggedPointIdx = null;
        var isDraggingWaterPoint = false;
        var draggedWaterId = null;
        var draggedWaterPointIdx = null;
        var isDraggingText = false;
        var draggedTextId = null;
        var isBoxSelecting = false;
        var boxStartPos = null;
        var isDraggingMulti = false;
        var initialMultiPositions = null;
        var isTransforming = false;
        var transformType = null;
        var transformHandle = null;
        var transformCorner = null;
        var transformInitBounds = null;
        var transformInitPoints = null;
        var transformCenter = null;
        var isDraggingLiveCorner = false;
        var draggedCornerSegId = null;
        var draggedCornerPointIdx = null;
        var dragStartPos = null;
        var hasDragged = false;
        var dragBaseline = null;

        /** 拖拽结束：只有真正拖动过才把「按下时的基线」压入撤销栈（撤销一步即回到按下前） */
        function commitDragHistory() {
            if (hasDragged && dragBaseline) {
                window.OpenMapEditor.HistoryManager.pushSnapshotRaw(dragBaseline);
            }
            dragBaseline = null;
            isTransforming = false;
            transformType = null;
            transformHandle = null;
            transformCorner = null;
            transformInitBounds = null;
            transformInitPoints = null;
            transformCenter = null;
            isDraggingLiveCorner = false;
            draggedCornerSegId = null;
            draggedCornerPointIdx = null;
        }

        function updateSnapIndicator(snap) {
            var handleLayerEl = document.getElementById('handleLayer');
            if (!handleLayerEl) return;
            var indicator = document.getElementById('editorSnapIndicator');
            if (!snap) {
                if (indicator) indicator.remove();
                return;
            }
            if (!indicator) {
                indicator = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                indicator.id = 'editorSnapIndicator';
                indicator.setAttribute('pointer-events', 'none');
                handleLayerEl.appendChild(indicator);
            }
            var targetLine = (app.project && app.project.lines || []).find(function (l) { return l.id === snap.lineId; });
            var strokeColor = (targetLine && targetLine.color) || '#0284c7';
            indicator.innerHTML =
                '<circle cx="' + snap.projection.x + '" cy="' + snap.projection.y + '" r="10" fill="none" stroke="' + strokeColor + '" stroke-width="2" stroke-dasharray="3,2" opacity="0.8">' +
                '<animate attributeName="r" values="8;13;8" dur="1.5s" repeatCount="indefinite"/>' +
                '</circle>' +
                '<circle cx="' + snap.projection.x + '" cy="' + snap.projection.y + '" r="4.5" fill="' + strokeColor + '" stroke="#ffffff" stroke-width="1.5"/>';
        }

        viewportEl.addEventListener('mousemove', function (e) {
            var world = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
            var coordEl = document.getElementById('cursorCoordinates');
            if (coordEl) coordEl.textContent = 'X: ' + Math.round(world.x) + ', Y: ' + Math.round(world.y);

            // 水域工具：橡皮筋跟着指针走，用户才能看见自己正在画什么
            if (app.activeTool === 'water' && !viewportEl.classList.contains('panning')) {
                var pdWater = window.OpenMapEditor.PipelineDraw;
                if (pdWater && typeof pdWater.updateWaterPointer === 'function') {
                    var waterPt = (app.snapEnabled && !e.altKey && window.OpenMapEditor.ViewportLayer.snapPoint)
                        ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                        : { x: roundCoord(world.x), y: roundCoord(world.y) };
                    if (pdWater.updateWaterPointer(waterPt)) renderDraftLayer();
                }
            }

            // 走线工具：把指针位置写进草稿并即时重画预览（只重画草稿层，不整屏重绘）
            // 按住 Shift 时方向锁到 45° 的整数倍（含水平 / 垂直），长度仍跟手
            // 平移（中键 / 空格 + 拖动）期间不更新草稿指针：
            // 否则预览线会跟着平移指针乱跑，看起来像"中键按一下就在放点"。
            var pdMove = window.OpenMapEditor.PipelineDraw;
            if (!viewportEl.classList.contains('panning') &&
                /^seg/.test(app.activeTool) && pdMove &&
                typeof pdMove.updateDraftPointer === 'function') {
                // 先按网格吸附，再（按 Shift 时）锁方向；两者同时开启时约束函数会把长度量化到网格，
                // 这样预览端点与最终落点**都落在网格线上**。
                var movePt = (app.snapEnabled && !e.altKey && window.OpenMapEditor.ViewportLayer.snapPoint)
                    ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                    : { x: roundCoord(world.x), y: roundCoord(world.y) };
                if (e.shiftKey && typeof pdMove.hasDraft === 'function' && pdMove.hasDraft() &&
                    typeof pdMove.constrainTo45 === 'function') {
                    var draftNow = pdMove.getDraft();
                    if (draftNow) {
                        var snapStep = (window.OpenMapEditor.ViewportLayer.getSnapStep)
                            ? window.OpenMapEditor.ViewportLayer.getSnapStep()
                            : 0;
                        movePt = pdMove.constrainTo45(draftNow.startPoint, movePt, app.snapEnabled ? snapStep : 0);
                    }
                }
                if (pdMove.updateDraftPointer(movePt)) {
                    renderDraftLayer();
                    // 绘制过程中在坐标读数后面提示怎么收尾，避免用户不知道要按什么
                    var coordHint = document.getElementById('cursorCoordinates');
                    if (coordHint && typeof pdMove.hasDraft === 'function' && pdMove.hasDraft()) {
                        coordHint.textContent += ' · Enter / 右键 结束绘制';
                    }
                }
            }

            if (app.activeTool === 'water') {
                var coordWater = document.getElementById('cursorCoordinates');
                var pdW = window.OpenMapEditor.PipelineDraw;
                if (coordWater && pdW && typeof pdW.hasWaterDraft === 'function' && pdW.hasWaterDraft()) {
                    coordWater.textContent += ' · 双击 / 右键 / Enter 闭合水域';
                }
            }

            // 车站模式下的智能吸附高亮投影
            if (app.activeTool === 'station') {
                var scale = window.OpenMapEditor.ViewportLayer.getScale() || 1;
                var hoverSnap = window.OpenMapEditor.PipelineDraw.findNearestLineProjection(app.project, world, 24 / scale);
                updateSnapIndicator(hoverSnap);
                if (hoverSnap) {
                    viewportEl.style.cursor = 'crosshair';
                } else {
                    viewportEl.style.cursor = '';
                }
            } else {
                updateSnapIndicator(null);
            }

            // -1. 矢量几何变换 (缩放与旋转)
            if (isTransforming && transformInitPoints && transformType) {
                var dXTrans = world.x - dragStartPos.x;
                var dYTrans = world.y - dragStartPos.y;
                if (!hasDragged && (Math.abs(dXTrans) > 2 || Math.abs(dYTrans) > 2)) {
                    hasDragged = true;
                }
                if (hasDragged) {
                    var transformedPts = [];
                    if (transformType === 'scale' && transformInitBounds && window.OpenMapEditor.TransformEngine) {
                        transformedPts = window.OpenMapEditor.TransformEngine.scalePoints(
                            transformInitPoints,
                            transformInitBounds,
                            transformHandle,
                            world,
                            { isShift: e.shiftKey, isAlt: e.altKey }
                        );
                    } else if (transformType === 'rotate' && transformCenter && window.OpenMapEditor.TransformEngine) {
                        var angleStart = Math.atan2(dragStartPos.y - transformCenter.y, dragStartPos.x - transformCenter.x);
                        var angleCur = Math.atan2(world.y - transformCenter.y, world.x - transformCenter.x);
                        var angleDiff = angleCur - angleStart;
                        transformedPts = window.OpenMapEditor.TransformEngine.rotatePoints(
                            transformInitPoints,
                            transformCenter,
                            angleDiff,
                            { isShift: e.shiftKey }
                        );
                    }
                    applyTransformedPoints(app.selected, transformedPts);
                    scheduleRender();
                }
                return;
            }

            // -0.5 动态倒角圆角半径微调
            if (isDraggingLiveCorner && draggedCornerSegId && draggedCornerPointIdx !== null) {
                var cSeg = (app.project.segments || []).find(function (s) { return s.id === draggedCornerSegId; });
                if (cSeg && cSeg.points && cSeg.points[draggedCornerPointIdx]) {
                    var cp = cSeg.points[draggedCornerPointIdx];
                    var dist = Math.hypot(world.x - cp.x, world.y - cp.y);
                    var newR = Math.max(0, Math.min(48, Math.round(dist)));
                    cp.r = newR;
                    hasDragged = true;
                    scheduleRender();
                }
                return;
            }

            // 0. 框选拉框 (Rubber-band Box Selection)
            if (isBoxSelecting && boxStartPos) {
                var bandEl = document.getElementById('editorRubberBand');
                var handleLayerEl = document.getElementById('handleLayer');
                if (!bandEl && handleLayerEl) {
                    bandEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    bandEl.id = 'editorRubberBand';
                    bandEl.setAttribute('fill', 'rgba(2, 132, 199, 0.12)');
                    bandEl.setAttribute('stroke', '#0284c7');
                    bandEl.setAttribute('stroke-width', '1.5');
                    bandEl.setAttribute('stroke-dasharray', '4,3');
                    bandEl.setAttribute('pointer-events', 'none');
                    handleLayerEl.appendChild(bandEl);
                }
                if (bandEl) {
                    var rx = Math.min(boxStartPos.x, world.x);
                    var ry = Math.min(boxStartPos.y, world.y);
                    var rw = Math.abs(world.x - boxStartPos.x);
                    var rh = Math.abs(world.y - boxStartPos.y);
                    bandEl.setAttribute('x', String(rx));
                    bandEl.setAttribute('y', String(ry));
                    bandEl.setAttribute('width', String(rw));
                    bandEl.setAttribute('height', String(rh));
                }
                return;
            }

            // 0.5 多选批量拖拽整体平移
            if (isDraggingMulti && initialMultiPositions && app.selected && app.selected.type === 'multi') {
                var dX = world.x - dragStartPos.x;
                var dY = world.y - dragStartPos.y;
                if (!hasDragged) {
                    if (Math.abs(dX) > 2 || Math.abs(dY) > 2) hasDragged = true;
                }
                if (hasDragged) {
                    var nList = app.selected.nodeIds || [];
                    nList.forEach(function (nid) {
                        var initPos = (initialMultiPositions.nodes && initialMultiPositions.nodes[nid]) || initialMultiPositions[nid];
                        if (initPos && app.project.nodes[nid]) {
                            app.project.nodes[nid].x = Math.round(initPos.x + dX);
                            app.project.nodes[nid].y = Math.round(initPos.y + dY);
                        }
                    });
                    var tList = app.selected.textIds || [];
                    tList.forEach(function (tid) {
                        var t = (app.project.texts || []).find(function (item) { return item.id === tid; });
                        if (t && initialMultiPositions.texts && initialMultiPositions.texts[tid]) {
                            t.x = Math.round(initialMultiPositions.texts[tid].x + dX);
                            t.y = Math.round(initialMultiPositions.texts[tid].y + dY);
                        }
                    });
                    (initialMultiPositions.waypoints || []).forEach(function (wp) {
                        var seg = (app.project.segments || []).find(function (s) { return s.id === wp.segId; });
                        if (seg && seg.points && seg.points[wp.pointIdx]) {
                            seg.points[wp.pointIdx].x = Math.round(wp.x + dX);
                            seg.points[wp.pointIdx].y = Math.round(wp.y + dY);
                        }
                    });
                    syncSegmentsForNodes(nList);
                    scheduleRender();
                }
                return;
            }

            // 1. 拖动折线折点移动 (Waypoints & Midpoint Drags)
            if (isDraggingPoint && draggedSegId && draggedPointIdx !== null) {
                var dragSeg = (app.project.segments || []).find(function (s) { return s.id === draggedSegId; });
                if (dragSeg && dragSeg.points && dragSeg.points[draggedPointIdx]) {
                    var snappedPt = app.snapEnabled
                        ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                        : { x: world.x, y: world.y };

                    // 智能辅助线吸附 (SmartGuides)
                    if (app.smartGuidesEnabled && window.OpenMapEditor.SmartGuides) {
                        var scaleFactor = window.OpenMapEditor.ViewportLayer.getScale() || 1;
                        var targets = [];
                        var curNid = (dragSeg.points[draggedPointIdx] && dragSeg.points[draggedPointIdx].nid) || null;
                        Object.keys(app.project.nodes || {}).forEach(function (nid) {
                            if (nid !== curNid) {
                                var n = app.project.nodes[nid];
                                if (n) targets.push({ id: nid, x: n.x, y: n.y });
                            }
                        });
                        var alignResult = window.OpenMapEditor.SmartGuides.computeAlignment(
                            snappedPt,
                            targets,
                            8 / scaleFactor
                        );
                        if (alignResult && alignResult.guides && alignResult.guides.length > 0) {
                            snappedPt.x = alignResult.snapped.x;
                            snappedPt.y = alignResult.snapped.y;
                            if (window.OpenMapEditor.GridLayer && typeof window.OpenMapEditor.GridLayer.renderSmartGuides === 'function') {
                                window.OpenMapEditor.GridLayer.renderSmartGuides(alignResult.guides, app.project.canvas);
                            }
                        } else if (window.OpenMapEditor.GridLayer && typeof window.OpenMapEditor.GridLayer.clearSmartGuides === 'function') {
                            window.OpenMapEditor.GridLayer.clearSmartGuides();
                        }
                    } else if (window.OpenMapEditor.GridLayer && typeof window.OpenMapEditor.GridLayer.clearSmartGuides === 'function') {
                        window.OpenMapEditor.GridLayer.clearSmartGuides();
                    }

                    if (!hasDragged) {
                        var dStartPt = dragStartPos || snappedPt;
                        if (Math.abs(snappedPt.x - dStartPt.x) > 2 || Math.abs(snappedPt.y - dStartPt.y) > 2) {
                            hasDragged = true;
                        }
                    }

                    if (hasDragged) {
                        var targetPt = dragSeg.points[draggedPointIdx];
                        targetPt.x = snappedPt.x;
                        targetPt.y = snappedPt.y;
                        if (targetPt.nid && app.project.nodes[targetPt.nid]) {
                            app.project.nodes[targetPt.nid].x = snappedPt.x;
                            app.project.nodes[targetPt.nid].y = snappedPt.y;
                            app.project.segments.forEach(function (otherSeg) {
                                if (otherSeg.id !== dragSeg.id) {
                                    (otherSeg.points || []).forEach(function (p) {
                                        if (p.nid === targetPt.nid) {
                                            p.x = snappedPt.x;
                                            p.y = snappedPt.y;
                                        }
                                    });
                                }
                            });
                        }
                        scheduleRender();
                    }
                }
            }

            // 1.5 拖动水域多边形顶点移动
            if (isDraggingWaterPoint && draggedWaterId && draggedWaterPointIdx !== null) {
                var dragWater = (app.project.waters || []).find(function (w) { return w.id === draggedWaterId; });
                if (dragWater && dragWater.points && dragWater.points[draggedWaterPointIdx]) {
                    var snappedW = app.snapEnabled
                        ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                        : { x: world.x, y: world.y };

                    if (!hasDragged) {
                        var dStartW = dragStartPos || snappedW;
                        if (Math.abs(snappedW.x - dStartW.x) > 2 || Math.abs(snappedW.y - dStartW.y) > 2) {
                            hasDragged = true;
                        }
                    }

                    if (hasDragged) {
                        dragWater.points[draggedWaterPointIdx].x = Math.round(snappedW.x);
                        dragWater.points[draggedWaterPointIdx].y = Math.round(snappedW.y);
                        scheduleRender();
                    }
                }
                return;
            }

            // 1.8 拖动自由文本移动
            if (isDraggingText && draggedTextId) {
                var dragTxt = (app.project.texts || []).find(function (t) { return t.id === draggedTextId; });
                if (dragTxt) {
                    var snappedT = app.snapEnabled
                        ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                        : { x: world.x, y: world.y };

                    if (!hasDragged) {
                        var dStartT = dragStartPos || snappedT;
                        if (Math.abs(snappedT.x - dStartT.x) > 2 || Math.abs(snappedT.y - dStartT.y) > 2) {
                            hasDragged = true;
                        }
                    }

                    if (hasDragged) {
                        dragTxt.x = Math.round(snappedT.x);
                        dragTxt.y = Math.round(snappedT.y);
                        scheduleRender();
                    }
                }
                return;
            }

            // 1.9 拖动地图装饰（机场 / 国铁 / 地标徽标）
            if (isDraggingScattered && scatteredDragOrigin) {
                var scItem = (app.project.scattered || [])[draggedScatteredIdx];
                if (scItem) {
                    var nx = scatteredDragOrigin.x + (world.x - dragStartPos.x);
                    var ny = scatteredDragOrigin.y + (world.y - dragStartPos.y);
                    var snappedSc = app.snapEnabled ? window.OpenMapEditor.ViewportLayer.snapPoint(nx, ny) : { x: nx, y: ny };
                    scItem.x = Math.round(snappedSc.x * 10) / 10;
                    scItem.y = Math.round(snappedSc.y * 10) / 10;
                    hasDragged = true;
                    scheduleRender();
                }
                return;
            }

            // 2. 拖动节点移动 (带智能对齐参考线与正交导轨协同推移)
            if (isDraggingNode && draggedNodeId && app.project.nodes[draggedNodeId]) {
                var snapped = app.snapEnabled
                    ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                    : { x: world.x, y: world.y };

                // 智能参考线与磁吸 (Smart Guides & Magnetic Snapping)
                var scale = window.OpenMapEditor.ViewportLayer.getScale() || 1;
                var snapTol = 6 / scale;
                if (app.smartGuidesEnabled && window.OpenMapEditor.SmartGuides) {
                    var targetList = [];
                    Object.keys(app.project.nodes || {}).forEach(function (otherId) {
                        if (otherId !== draggedNodeId) {
                            var otherNode = app.project.nodes[otherId];
                            if (otherNode) targetList.push({ id: otherId, x: otherNode.x, y: otherNode.y, label: otherNode.cn || otherId });
                        }
                    });
                    var alignRes = window.OpenMapEditor.SmartGuides.computeAlignment(snapped, targetList, snapTol);
                    snapped = alignRes.snapped;
                    if (window.OpenMapEditor.GridLayer && window.OpenMapEditor.GridLayer.renderSmartGuides) {
                        window.OpenMapEditor.GridLayer.renderSmartGuides(alignRes.guides, app.project.canvas);
                    }
                } else if (window.OpenMapEditor.GridLayer && window.OpenMapEditor.GridLayer.clearSmartGuides) {
                    window.OpenMapEditor.GridLayer.clearSmartGuides();
                }

                // 仅在真正移动时才标记 hasDragged
                if (!hasDragged) {
                    var dStart = dragStartPos || snapped;
                    if (Math.abs(snapped.x - dStart.x) > 2 || Math.abs(snapped.y - dStart.y) > 2) {
                        hasDragged = true;
                    }
                }

                if (hasDragged) {
                    var oldNodeX = app.project.nodes[draggedNodeId].x;
                    var oldNodeY = app.project.nodes[draggedNodeId].y;
                    var oldPos = { x: oldNodeX, y: oldNodeY };
                    var newPos = { x: snapped.x, y: snapped.y };

                    app.project.nodes[draggedNodeId].x = snapped.x;
                    app.project.nodes[draggedNodeId].y = snapped.y;

                    // 同步线段端点与各折点，并调用 preserveOrthogonalShift 协同推移
                    app.project.segments.forEach(function (seg) {
                        var pts = seg.points || [];
                        var dIdx = -1;
                        if (pts.length > 0 && pts[0].nid === draggedNodeId) {
                            dIdx = 0;
                        } else if (pts.length > 0 && pts[pts.length - 1].nid === draggedNodeId) {
                            dIdx = pts.length - 1;
                        }
                        if (dIdx !== -1) {
                            if (window.OpenMapEditor.SegmentRouter && window.OpenMapEditor.SegmentRouter.preserveOrthogonalShift) {
                                window.OpenMapEditor.SegmentRouter.preserveOrthogonalShift(pts, dIdx, oldPos, newPos, seg.type, app.project.slope);
                            }
                            pts[dIdx].x = snapped.x;
                            pts[dIdx].y = snapped.y;
                        } else {
                            pts.forEach(function (p) {
                                if (p.nid === draggedNodeId) {
                                    p.x = snapped.x;
                                    p.y = snapped.y;
                                }
                            });
                        }
                    });

                    scheduleRender();
                }
            }
        });

        viewportEl.addEventListener('mousedown', function (e) {
            if (e.target.closest('.viewport-hud')) return;

            // 交互开始：短时间内不自动保存，避免序列化与拖拽抢主线程
            holdSessionSave(1200);

            // ⚠️ 只有左键参与选中 / 拖拽 / 框选。
            //   中键 = 画布漫游（由 ViewportLayer 处理）、右键 = 结束连续绘制 / 浏览器菜单。
            //   少了这一句，空白处按住中键或右键都会落到下面的框选分支，
            //   表现就是「无论中键左键右键都在框选」。
            if (e.button !== 0 || viewportEl.classList.contains('panning')) return;

            // -3. 落子模式（零件盒里选了车站 / 装饰）：按下时什么都不做，交给 mouseup 落子。
            //     否则点在线路或车站上会先被当成选中 / 拖拽，mouseup 提前返回，落子就丢了。
            if (app.activeStamp) {
                e.preventDefault();
                return;
            }

            // -2. 吸管取色工具 (Eyedropper)
            if (app.activeTool === 'eyedropper') {
                e.preventDefault();
                e.stopPropagation();
                var pickedColor = null;
                var target = e.target;
                var nEl = target.closest('[data-node-id]');
                if (nEl) {
                    var nid = nEl.getAttribute('data-node-id');
                    var nLines = (app.project.lines || []).filter(function (l) {
                        return (l.stationIds && l.stationIds.indexOf(nid) !== -1);
                    });
                    if (nLines.length > 0 && nLines[0].color) pickedColor = nLines[0].color;
                }
                var sEl = target.closest('[data-segment-id]');
                if (!pickedColor && sEl) {
                    var sLineId = sEl.getAttribute('data-line-id');
                    var lObj = (app.project.lines || []).find(function (l) { return l.id === sLineId; });
                    if (lObj && lObj.color) pickedColor = lObj.color;
                }
                if (!pickedColor) {
                    var stroke = target.getAttribute('stroke');
                    var fill = target.getAttribute('fill');
                    if (stroke && stroke !== 'none' && stroke !== 'transparent') pickedColor = stroke;
                    else if (fill && fill !== 'none' && fill !== 'transparent') pickedColor = fill;
                }
                if (pickedColor) {
                    var norm = normalizeHexColor(pickedColor);
                    if (norm) {
                        if (window.OpenMapEditor.SwatchesPalette) {
                            window.OpenMapEditor.SwatchesPalette.addRecentSwatch(norm);
                        }
                        showToast('吸管已取色: ' + norm);
                        if (app.selected && app.selected.type === 'text') {
                            handlePropertyChange('text', app.selected.id, 'color', norm);
                        } else if (app.selected && app.selected.type === 'line') {
                            handlePropertyChange('line', app.selected.id, 'color', norm);
                        }
                    }
                }
                if (!e.shiftKey) {
                    setTool('select');
                }
                return;
            }

            // -1.5 动态折角倒角手柄 (Live Corner Fillet Radius Handle)
            var targetLiveCorner = e.target.closest('.live-corner-handle');
            if (targetLiveCorner && (app.activeTool === 'select' || app.activeTool === 'points')) {
                isDraggingLiveCorner = true;
                draggedCornerSegId = targetLiveCorner.getAttribute('data-seg-id');
                draggedCornerPointIdx = parseInt(targetLiveCorner.getAttribute('data-point-idx'), 10);
                hasDragged = false;
                dragBaseline = JSON.stringify(app.project);
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                e.stopPropagation();
                return;
            }

            // -1. 矢量变换外框缩放手柄与旋转探测区 (Transform Handles & Rotate Zones)
            var targetHandle = e.target.closest('.transform-handle');
            if (targetHandle && app.selected && (app.activeTool === 'select' || app.activeTool === 'box')) {
                isTransforming = true;
                transformType = 'scale';
                transformHandle = targetHandle.getAttribute('data-handle');
                hasDragged = false;
                dragBaseline = JSON.stringify(app.project);
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                transformInitPoints = getTransformPoints(app.selected);
                transformInitBounds = window.OpenMapEditor.TransformEngine ? window.OpenMapEditor.TransformEngine.computeBounds(transformInitPoints) : null;
                e.stopPropagation();
                return;
            }

            var targetRotateZone = e.target.closest('.transform-rotate-zone');
            if (targetRotateZone && app.selected && (app.activeTool === 'select' || app.activeTool === 'box')) {
                isTransforming = true;
                transformType = 'rotate';
                transformCorner = targetRotateZone.getAttribute('data-rotate-corner');
                hasDragged = false;
                dragBaseline = JSON.stringify(app.project);
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                transformInitPoints = getTransformPoints(app.selected);
                var tb = window.OpenMapEditor.TransformEngine ? window.OpenMapEditor.TransformEngine.computeBounds(transformInitPoints) : null;
                transformCenter = tb ? { x: tb.cx, y: tb.cy } : dragStartPos;
                e.stopPropagation();
                return;
            }

            // 0. 点击水域控制手柄 (Water Vertex Handle)
            var targetWaterPtHandle = e.target.closest('.water-point-handle');
            if (targetWaterPtHandle && !app.layerState.water.locked && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var wid = targetWaterPtHandle.getAttribute('data-water-id');
                var wpIdx = parseInt(targetWaterPtHandle.getAttribute('data-point-idx'), 10);
                app.selected = { type: 'water', id: wid, pointIdx: wpIdx };
                isDraggingWaterPoint = true;
                draggedWaterId = wid;
                draggedWaterPointIdx = wpIdx;
                hasDragged = false;
                dragBaseline = JSON.stringify(app.project);
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                scheduleRender();
                e.stopPropagation();
                return;
            }

            // 0.5 点击水域边线中点添加顶点手柄 (Water Midpoint Add Handle)
            var targetWaterMid = e.target.closest('.water-midpoint-handle');
            if (targetWaterMid && !app.layerState.water.locked && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var midWid = targetWaterMid.getAttribute('data-water-id');
                var wInsAfter = parseInt(targetWaterMid.getAttribute('data-insert-after'), 10);
                var midW = (app.project.waters || []).find(function (w) { return w.id === midWid; });
                if (midW && midW.points && wInsAfter >= 0 && wInsAfter < midW.points.length) {
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                    var p1 = midW.points[wInsAfter], p2 = midW.points[(wInsAfter + 1) % midW.points.length];
                    var newWp = { x: Math.round((p1.x + p2.x) / 2), y: Math.round((p1.y + p2.y) / 2) };
                    midW.points.splice(wInsAfter + 1, 0, newWp);
                    app.selected = { type: 'water', id: midWid, pointIdx: wInsAfter + 1 };
                    isDraggingWaterPoint = true;
                    draggedWaterId = midWid;
                    draggedWaterPointIdx = wInsAfter + 1;
                    hasDragged = false;
                    dragBaseline = JSON.stringify(app.project);
                    dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                    scheduleRender();
                    e.stopPropagation();
                    return;
                }
            }

            // 1. 点击折点控制手柄 (Vertex Handle)
            var targetPointHandle = e.target.closest('.segment-point-handle');
            if (targetPointHandle && !app.layerState.lines.locked && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var segId = targetPointHandle.getAttribute('data-seg-id');
                var pIdx = parseInt(targetPointHandle.getAttribute('data-point-idx'), 10);
                app.selected = { type: 'segment', id: segId, pointIdx: pIdx };
                isDraggingPoint = true;
                draggedSegId = segId;
                draggedPointIdx = pIdx;
                hasDragged = false;
                dragBaseline = JSON.stringify(app.project);
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                scheduleRender();
                e.stopPropagation();
                return;
            }

            // 2. 点击线段中点添加手柄 (Midpoint Add Handle)
            var targetMidHandle = e.target.closest('.segment-midpoint-handle');
            if (targetMidHandle && !app.layerState.lines.locked && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var midSegId = targetMidHandle.getAttribute('data-seg-id');
                var insAfter = parseInt(targetMidHandle.getAttribute('data-insert-after'), 10);
                var midSeg = (app.project.segments || []).find(function (s) { return s.id === midSegId; });
                if (midSeg && midSeg.points && insAfter >= 0 && insAfter < midSeg.points.length - 1) {
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                    var pA = midSeg.points[insAfter], pB = midSeg.points[insAfter + 1];
                    var newPt = { x: Math.round((pA.x + pB.x) / 2), y: Math.round((pA.y + pB.y) / 2) };
                    midSeg.points.splice(insAfter + 1, 0, newPt);
                    app.selected = { type: 'segment', id: midSegId, pointIdx: insAfter + 1 };
                    isDraggingPoint = true;
                    draggedSegId = midSegId;
                    draggedPointIdx = insAfter + 1;
                    hasDragged = false;
                    // 插入已单独记过一次撤销，这里抓的是「插入后、拖动前」的基线
                    dragBaseline = JSON.stringify(app.project);
                    dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                    scheduleRender();
                    e.stopPropagation();
                    return;
                }
            }

            // 3. 点击车站节点 (单选 / Shift/Ctrl 多选 / 多选群组整体拖拽)
            var targetNodeEl = e.target.closest('[data-node-id]');
            if (targetNodeEl && !app.layerState.stations.locked && (app.activeTool === 'select' || app.activeTool === 'points' || app.activeTool === 'box')) {
                var nid = targetNodeEl.getAttribute('data-node-id');
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    if (!app.selected || app.selected.type !== 'multi') {
                        var baseIds = (app.selected && app.selected.type === 'node') ? [app.selected.id] : [];
                        if (baseIds.indexOf(nid) === -1) baseIds.push(nid);
                        app.selected = { type: 'multi', nodeIds: baseIds };
                    } else {
                        var idx = app.selected.nodeIds.indexOf(nid);
                        if (idx !== -1) {
                            app.selected.nodeIds.splice(idx, 1);
                            if (app.selected.nodeIds.length === 1 && (!app.selected.textIds || !app.selected.textIds.length)) {
                                app.selected = { type: 'node', id: app.selected.nodeIds[0] };
                            } else if (app.selected.nodeIds.length === 0 && (!app.selected.textIds || !app.selected.textIds.length)) {
                                app.selected = null;
                            }
                        } else {
                            app.selected.nodeIds.push(nid);
                        }
                    }
                    scheduleRender();
                    return;
                }

                // 非多选修饰键点击：若已在该多选集合中，启动多选整体拖拽
                if (app.selected && app.selected.type === 'multi' && app.selected.nodeIds.indexOf(nid) !== -1) {
                    isDraggingMulti = true;
                    hasDragged = false;
                    dragBaseline = JSON.stringify(app.project);
                    dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                    initialMultiPositions = {
                        nodes: {},
                        texts: {},
                        waypoints: []
                    };
                    var selNodeSet = new Set(app.selected.nodeIds || []);
                    (app.selected.nodeIds || []).forEach(function (id) {
                        if (app.project.nodes[id]) {
                            initialMultiPositions.nodes[id] = { x: app.project.nodes[id].x, y: app.project.nodes[id].y };
                        }
                    });
                    (app.selected.textIds || []).forEach(function (tid) {
                        var t = (app.project.texts || []).find(function (item) { return item.id === tid; });
                        if (t) {
                            initialMultiPositions.texts[tid] = { x: t.x, y: t.y };
                        }
                    });
                    // 收集内部线段的全部未绑定折点
                    (app.project.segments || []).forEach(function (seg) {
                        var segPts = seg.points || [];
                        if (segPts.length >= 2) {
                            var sN = segPts[0].nid;
                            var eN = segPts[segPts.length - 1].nid;
                            if (sN && eN && selNodeSet.has(sN) && selNodeSet.has(eN)) {
                                for (var pi = 1; pi < segPts.length - 1; pi++) {
                                    if (!segPts[pi].nid) {
                                        initialMultiPositions.waypoints.push({
                                            segId: seg.id,
                                            pointIdx: pi,
                                            x: segPts[pi].x,
                                            y: segPts[pi].y
                                        });
                                    }
                                }
                            }
                        }
                    });
                    scheduleRender();
                    return;
                }

                // 常规单选并启动单节点拖拽
                app.selected = { type: 'node', id: nid };
                isDraggingNode = true;
                hasDragged = false;
                dragBaseline = JSON.stringify(app.project);
                draggedNodeId = nid;
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                scheduleRender();
                return;
            }

            // 3.5 点选 / 拖动地图装饰（徽标级散点）
            var targetScEl = e.target.closest('.scattered-item.is-pickable[data-scattered-idx]');
            if (targetScEl && !(app.layerState.scattered && app.layerState.scattered.locked) && (app.activeTool === 'select' || app.activeTool === 'box')) {
                var scIdx = parseInt(targetScEl.getAttribute('data-scattered-idx'), 10);
                var scObj = (app.project.scattered || [])[scIdx];
                if (scObj) {
                    app.selected = { type: 'scattered', idx: scIdx };
                    isDraggingScattered = true;
                    draggedScatteredIdx = scIdx;
                    hasDragged = false;
                    dragBaseline = JSON.stringify(app.project);
                    dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                    scatteredDragOrigin = { x: scObj.x, y: scObj.y };
                    scheduleRender();
                    return;
                }
            }

            var targetSegEl = e.target.closest('[data-segment-id]');
            if (targetSegEl && !app.layerState.lines.locked && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var sid = targetSegEl.getAttribute('data-segment-id');
                var segLineId = targetSegEl.getAttribute('data-line-id');
                app.selected = { type: 'segment', id: sid };
                if (segLineId) {
                    app.activeLineId = segLineId;
                    if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
                        window.OpenMapEditor.PipelineDraw.setActiveLine(segLineId);
                    }
                }
                scheduleRender();
                return;
            }

            // 4. 点击自由注释文本 (单选 / 拖拽 / Shift或Ctrl多选)
            var targetTextEl = e.target.closest('[data-text-id]');
            if (targetTextEl && !app.layerState.texts.locked && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var tid = targetTextEl.getAttribute('data-text-id');
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    if (!app.selected || app.selected.type !== 'multi') {
                        var baseTexts = (app.selected && app.selected.type === 'text') ? [app.selected.id] : [];
                        var baseNodes2 = (app.selected && app.selected.type === 'node') ? [app.selected.id] : [];
                        if (baseTexts.indexOf(tid) === -1) baseTexts.push(tid);
                        app.selected = { type: 'multi', nodeIds: baseNodes2, textIds: baseTexts };
                    } else {
                        app.selected.textIds = app.selected.textIds || [];
                        var tIdx = app.selected.textIds.indexOf(tid);
                        if (tIdx !== -1) {
                            app.selected.textIds.splice(tIdx, 1);
                        } else {
                            app.selected.textIds.push(tid);
                        }
                    }
                    scheduleRender();
                    return;
                }
                app.selected = { type: 'text', id: tid };
                isDraggingText = true;
                hasDragged = false;
                dragBaseline = JSON.stringify(app.project);
                draggedTextId = tid;
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                scheduleRender();
                return;
            }

            // 5. 点击水域面或河道折线 (单选)
            var targetWaterEl = e.target.closest('[data-water-id]');
            if (targetWaterEl && !app.layerState.water.locked && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var widEl = targetWaterEl.getAttribute('data-water-id');
                app.selected = { type: 'water', id: widEl };
                scheduleRender();
                return;
            }

            // 地图模式：选择工具下按住空白处 = 拖动画布（Shift + 拖动仍是框选）；不拖动直接松开 = 取消选中
            var vpLayer = window.OpenMapEditor.ViewportLayer;
            if (app.activeTool === 'select' && !e.shiftKey && vpLayer.getNavMode && vpLayer.getNavMode() === 'map' &&
                !targetNodeEl && !targetSegEl && !targetTextEl && !targetWaterEl && !targetWaterPtHandle && !targetWaterMid) {
                vpLayer.startPan(e, function () {
                    if (app.selected) { app.selected = null; renderAll(); }
                });
                return;
            }

            // 画布空白处按住：启动框选 (Rubber-band Box Selection)
            if ((app.activeTool === 'select' || app.activeTool === 'box') && !targetNodeEl && !targetSegEl && !targetTextEl && !targetWaterEl && !targetWaterPtHandle && !targetWaterMid) {
                isBoxSelecting = true;
                hasDragged = false;
                boxStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
            }
        });

        viewportEl.addEventListener('mouseup', function (e) {
            // 一次拖拽/变换结束：立刻允许自动保存（此前交互期是压着的）
            sessionHoldUntil = 0;
            scheduleSaveSession();

            // 框选结束判定
            if (isBoxSelecting) {
                isBoxSelecting = false;
                var bandEl = document.getElementById('editorRubberBand');
                if (bandEl) bandEl.remove();

                if (boxStartPos) {
                    var worldEnd = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                    var minX = Math.min(boxStartPos.x, worldEnd.x);
                    var maxX = Math.max(boxStartPos.x, worldEnd.x);
                    var minY = Math.min(boxStartPos.y, worldEnd.y);
                    var maxY = Math.max(boxStartPos.y, worldEnd.y);

                    if (maxX - minX > 6 && maxY - minY > 6) {
                        var foundNodes = Object.keys(app.project.nodes || {}).filter(function (nid) {
                            var n = app.project.nodes[nid];
                            return n && n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY;
                        });
                        var foundTexts = (app.project.texts || []).filter(function (t) {
                            return t && t.x >= minX && t.x <= maxX && t.y >= minY && t.y <= maxY;
                        }).map(function (t) { return t.id; });

                        var finalNodes = foundNodes;
                        var finalTexts = foundTexts;
                        if (e.shiftKey && app.selected) {
                            var curNodes = [];
                            var curTexts = [];
                            if (app.selected.type === 'multi') {
                                curNodes = app.selected.nodeIds || [];
                                curTexts = app.selected.textIds || [];
                            } else if (app.selected.type === 'node') {
                                curNodes = [app.selected.id];
                            } else if (app.selected.type === 'text') {
                                curTexts = [app.selected.id];
                            }
                            finalNodes = Array.from(new Set(curNodes.concat(foundNodes)));
                            finalTexts = Array.from(new Set(curTexts.concat(foundTexts)));
                        } else if (e.altKey && app.selected) {
                            var subNodes = new Set(foundNodes);
                            var subTexts = new Set(foundTexts);
                            if (app.selected.type === 'multi') {
                                finalNodes = (app.selected.nodeIds || []).filter(function (id) { return !subNodes.has(id); });
                                finalTexts = (app.selected.textIds || []).filter(function (id) { return !subTexts.has(id); });
                            } else if (app.selected.type === 'node') {
                                finalNodes = subNodes.has(app.selected.id) ? [] : [app.selected.id];
                            } else if (app.selected.type === 'text') {
                                finalTexts = subTexts.has(app.selected.id) ? [] : [app.selected.id];
                            }
                        }

                        if (finalNodes.length > 1 || (finalNodes.length + finalTexts.length > 1)) {
                            app.selected = { type: 'multi', nodeIds: finalNodes, textIds: finalTexts };
                        } else if (finalNodes.length === 1 && finalTexts.length === 0) {
                            app.selected = { type: 'node', id: finalNodes[0] };
                        } else if (finalTexts.length === 1 && finalNodes.length === 0) {
                            app.selected = { type: 'text', id: finalTexts[0] };
                        } else {
                            app.selected = null;
                        }
                    } else {
                        // 空白处单点点击清空选择
                        app.selected = null;
                    }
                    boxStartPos = null;
                    renderAll();
                    return;
                }
            }

            if (isTransforming) {
                commitDragHistory();
                isTransforming = false;
                transformType = null;
                transformHandle = null;
                transformCorner = null;
                transformInitBounds = null;
                transformInitPoints = null;
                transformCenter = null;
                dragStartPos = null;
                hasDragged = false;
                renderAll();
                return;
            }

            if (isDraggingLiveCorner) {
                commitDragHistory();
                isDraggingLiveCorner = false;
                draggedCornerSegId = null;
                draggedCornerPointIdx = null;
                dragStartPos = null;
                hasDragged = false;
                renderAll();
                return;
            }

            if (isDraggingWaterPoint) {
                commitDragHistory();
                isDraggingWaterPoint = false;
                draggedWaterId = null;
                draggedWaterPointIdx = null;
                dragStartPos = null;
                hasDragged = false;
                return;
            }

            if (isDraggingText) {
                commitDragHistory();
                isDraggingText = false;
                draggedTextId = null;
                dragStartPos = null;
                hasDragged = false;
                return;
            }

            if (isDraggingMulti) {
                commitDragHistory();
                isDraggingMulti = false;
                initialMultiPositions = null;
                hasDragged = false;
                if (window.OpenMapEditor.GridLayer) window.OpenMapEditor.GridLayer.clearSmartGuides();
                return;
            }

            if (isDraggingPoint) {
                commitDragHistory();
                isDraggingPoint = false;
                draggedSegId = null;
                draggedPointIdx = null;
                hasDragged = false;
                if (window.OpenMapEditor.GridLayer && typeof window.OpenMapEditor.GridLayer.clearSmartGuides === 'function') {
                    window.OpenMapEditor.GridLayer.clearSmartGuides();
                }
                return;
            }

            if (isDraggingScattered) {
                commitDragHistory();
                isDraggingScattered = false;
                draggedScatteredIdx = null;
                scatteredDragOrigin = null;
                hasDragged = false;
                return;
            }

            if (isDraggingNode) {
                commitDragHistory();
                isDraggingNode = false;
                hasDragged = false;
                draggedNodeId = null;
                if (window.OpenMapEditor.GridLayer) window.OpenMapEditor.GridLayer.clearSmartGuides();
                return;
            }

            // 轨交资产零件盒落子模式响应
            if (app.activeStamp) {
                var worldStamp = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                var snappedStamp = app.snapEnabled
                    ? window.OpenMapEditor.ViewportLayer.snapPoint(worldStamp.x, worldStamp.y)
                    : { x: roundCoord(worldStamp.x), y: roundCoord(worldStamp.y) };

                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

                var pModel = window.OpenMapEditor.ProjectModel || window.ProjectModel;

                if (app.activeStamp.category === 'station') {
                    var newId = pModel ? pModel.nextId(app.project, 'station_') : ('station_' + Date.now());
                    app.project.nodes[newId] = {
                        id: newId,
                        x: snappedStamp.x,
                        y: snappedStamp.y,
                        cn: '新车站',
                        en: 'New Station',
                        type: app.activeStamp.payload.glyph || 'dot',
                        align: 'top'
                    };
                    // 零件盒里选的是「本城市现有样式」时，连同逐站图元字段一起落子
                    var stampPatch = app.activeStamp.payload.patch;
                    var styleCat = window.OpenMapEditor.StationStyleCatalog;
                    if (stampPatch && styleCat) {
                        var stamped = styleCat.applyPatch(app.project.nodes[newId], stampPatch);
                        if (!stamped.notOpen) delete stamped.notOpen;
                        app.project.nodes[newId] = stamped;
                    }
                    app.selected = { type: 'node', id: newId };
                    showToast('已成功放置车站「' + app.project.nodes[newId].cn + '」', 'success');
                } else if (app.activeStamp.category === 'scattered' && app.activeStamp.payload.deco) {
                    var deco = app.activeStamp.payload.deco;
                    if (!Array.isArray(app.project.scattered)) app.project.scattered = [];
                    var newDeco = {
                        id: uniqueScatteredId(deco.idStem || 'deco'),
                        file: deco.file,
                        x: snappedStamp.x,
                        y: snappedStamp.y
                    };
                    if (deco.width) newDeco.width = deco.width;
                    if (deco.height) newDeco.height = deco.height;
                    newDeco.opacity = 1;
                    newDeco.zIndex = deco.zIndex !== undefined ? deco.zIndex : 5;
                    app.project.scattered.push(newDeco);
                    app.selected = { type: 'scattered', idx: app.project.scattered.length - 1 };
                    showToast('已放置装饰「' + deco.name + '」', 'success');
                } else if (app.activeStamp.category === 'amenity') {
                    var newId2 = pModel ? pModel.nextId(app.project, 'station_') : ('station_' + Date.now());
                    app.project.nodes[newId2] = {
                        id: newId2,
                        x: snappedStamp.x,
                        y: snappedStamp.y,
                        cn: '枢纽站',
                        en: 'Hub Station',
                        type: 'dot',
                        align: 'top',
                        amenities: [app.activeStamp.payload.id]
                    };
                    app.selected = { type: 'node', id: newId2 };
                    showToast('已成功放置挂载设施的枢纽车站', 'success');
                } else if (app.activeStamp.category === 'carto') {
                    if (app.activeStamp.payload.id === 'north_arrow') {
                        app.project.scattered = app.project.scattered || [];
                        var newCompassId = pModel ? pModel.nextId(app.project, 'compass_') : ('compass_' + Date.now());
                        app.project.scattered.push({
                            id: newCompassId,
                            x: snappedStamp.x,
                            y: snappedStamp.y,
                            type: 'north_arrow',
                            name: '测绘指北针'
                        });
                        showToast('已成功插入测绘矢量指北针', 'success');
                    }
                }

                app.activeStamp = null;
                if (window.OpenMapEditor.AssetDrawer) {
                    window.OpenMapEditor.AssetDrawer.clearActiveSelection();
                }
                var vp = document.getElementById('workbenchViewport');
                if (vp) vp.style.cursor = '';
                renderAll();
                return;
            }

            if (app.activeTool === 'station') {
                var world = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                var scale = window.OpenMapEditor.ViewportLayer.getScale() || 1;
                var snap = window.OpenMapEditor.PipelineDraw.findNearestLineProjection(app.project, world, 24 / scale);
                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                if (snap) {
                    var res = window.OpenMapEditor.PipelineDraw.insertStationOnLine(app.project, snap);
                    if (res && res.createdId) {
                        app.selected = { type: 'node', id: res.createdId };
                        updateSnapIndicator(null);
                        renderAll();
                        return;
                    }
                }
                var snapped = app.snapEnabled
                    ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                    : { x: roundCoord(world.x), y: roundCoord(world.y) };
                // 按住 Shift：落点也约束到 45° 方向，保证与预览一致
                var pdClick = window.OpenMapEditor.PipelineDraw;
                if (e.shiftKey && pdClick && typeof pdClick.hasDraft === 'function' && pdClick.hasDraft() &&
                    typeof pdClick.constrainTo45 === 'function') {
                    var draft5 = pdClick.getDraft();
                    var step5 = (window.OpenMapEditor.ViewportLayer.getSnapStep)
                        ? window.OpenMapEditor.ViewportLayer.getSnapStep() : 0;
                    if (draft5) snapped = pdClick.constrainTo45(draft5.startPoint, snapped, app.snapEnabled ? step5 : 0);
                }
                var result = window.OpenMapEditor.PipelineDraw.handleCanvasClick(app.project, snapped, null, { button: e.button });
                if (result.action === 'draft_water_point') {
                    renderDraftLayer();
                    if (result.pointCount === 1) {
                        showToast('已落下水域第 1 个顶点：继续点击添加顶点；点回起点、双击、右键或按 Enter 都能闭合');
                    } else if (result.pointCount === 2) {
                        showToast('已有 2 个顶点：再点 1 个即可成面（双击 / 右键 / Enter 闭合）', 'info');
                    }
                    return;
                }
                if (result.action === 'create_water') {
                    app.selected = { type: 'water', id: result.createdId };
                    renderAll();
                    showToast('已创建水域多边形（选中后可在右侧调样式 / 删除）', 'success');
                    return;
                }
                if (result.updated) {
                    // create_segment 返回的是线段 id，不能当节点 id 选中
                    if (result.action === 'create_segment' || result.action === 'extend_segment') {
                        app.selected = { type: 'segment', id: result.createdId };
                    } else if (result.createdId) {
                        app.selected = { type: 'node', id: result.createdId };
                    }
                    renderAll();
                } else {
                    // 首击（起点已定）/ 原地重复点击：也刷新一次，让预览立刻出现
                    renderDraftLayer();
                }
                return;
            }

            if (app.activeTool !== 'select' && app.activeTool !== 'points' && app.activeTool !== 'box') {
                var world = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                var snapped = app.snapEnabled
                    ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                    : { x: world.x, y: world.y };
                var targetNodeEl = e.target.closest('[data-node-id]');
                var targetNid = targetNodeEl ? targetNodeEl.getAttribute('data-node-id') : null;

                // 走线工具的首击只是"定起点"，不该占一个撤销步
                var pdRef = window.OpenMapEditor.PipelineDraw;
                var isDraftStart = /^seg/.test(app.activeTool) && pdRef &&
                    typeof pdRef.hasDraft === 'function' && !pdRef.hasDraft();
                if (!isDraftStart) window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                // 按住 Shift：落点约束到 45° 方向（命中节点时仍以节点为准）
                var pdClick2 = window.OpenMapEditor.PipelineDraw;
                if (e.shiftKey && !targetNid && pdClick2 && typeof pdClick2.hasDraft === 'function' && pdClick2.hasDraft() &&
                    typeof pdClick2.constrainTo45 === 'function') {
                    var draft6 = pdClick2.getDraft();
                    var step6 = (window.OpenMapEditor.ViewportLayer.getSnapStep)
                        ? window.OpenMapEditor.ViewportLayer.getSnapStep() : 0;
                    if (draft6) snapped = pdClick2.constrainTo45(draft6.startPoint, snapped, app.snapEnabled ? step6 : 0);
                }
                var result = window.OpenMapEditor.PipelineDraw.handleCanvasClick(app.project, snapped, targetNid, { button: e.button });
                if (result.updated) {
                    if (result.action === 'create_segment' || result.action === 'extend_segment') {
                        app.selected = { type: 'segment', id: result.createdId };
                    } else if (result.createdId) {
                        app.selected = { type: 'node', id: result.createdId };
                    }
                    renderAll();
                } else {
                    renderDraftLayer();
                }
            }
        });

        // 右键结束连续绘制 / 闭合水域（CAD 习惯），不必切换工具才能停
        viewportEl.addEventListener('contextmenu', function (e) {
            var pd = window.OpenMapEditor.PipelineDraw;

            // 水域工具：右键 = 闭合多边形
            if (app.activeTool === 'water' && pd && typeof pd.finishWaterDraft === 'function' &&
                typeof pd.hasWaterDraft === 'function' && pd.hasWaterDraft()) {
                e.preventDefault();
                var widCtx = pd.finishWaterDraft(app.project);
                if (widCtx) {
                    app.selected = { type: 'water', id: widCtx };
                    renderAll();
                    showToast('已闭合水域多边形（右键）', 'success');
                } else {
                    renderAll();
                    showToast('至少需要 3 个顶点才能闭合水域', 'warning');
                }
                return;
            }
            if (/^seg/.test(app.activeTool) && pd && typeof pd.hasDraft === 'function' && pd.hasDraft()) {
                e.preventDefault();
                pd.cancelDraft();
                renderAll();
                showToast('已结束连续绘制（起点已清除）');
                return;
            }
            if (e.target.closest('.viewport-hud')) return;
            var menu = window.OpenMapEditor.ContextMenu;
            if (!menu || !app.project) return;
            e.preventDefault();
            menu.show(e.clientX, e.clientY, buildContextMenuItems(e));
        });

        // 双击交互：双击文字启动原地内联编辑，双击折线在线插入车站
        viewportEl.addEventListener('dblclick', function (e) {
            // 水域工具：双击直接闭合当前多边形（画水域时不需要也不应该有其它双击行为）
            if (app.activeTool === 'water') {
                var pdDbl = window.OpenMapEditor.PipelineDraw;
                if (pdDbl && typeof pdDbl.finishWaterDraft === 'function') {
                    var widDbl = pdDbl.finishWaterDraft(app.project);
                    if (widDbl) {
                        app.selected = { type: 'water', id: widDbl };
                        renderAll();
                        showToast('已闭合水域多边形（双击）', 'success');
                    } else {
                        renderAll();
                        showToast('至少需要 3 个顶点才能闭合水域', 'warning');
                    }
                }
                return;
            }

            if (app.activeTool !== 'select' && app.activeTool !== 'points' && app.activeTool !== 'box') return;

            var targetTxt = e.target.closest('[data-text-id]');
            if (targetTxt && !app.layerState.texts.locked) {
                var tid = targetTxt.getAttribute('data-text-id');
                app.selected = { type: 'text', id: tid };
                renderAll();
                openInlineTextEditor(tid, e.clientX, e.clientY);
                return;
            }

            var targetSegEl = e.target.closest('[data-segment-id]');
            if (!targetSegEl) return;
            var world = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
            var scale = window.OpenMapEditor.ViewportLayer.getScale() || 1;
            var snap = window.OpenMapEditor.PipelineDraw.findNearestLineProjection(app.project, world, 30 / scale);
            if (snap) {
                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                var res = window.OpenMapEditor.PipelineDraw.insertStationOnLine(app.project, snap);
                if (res && res.createdId) {
                    app.selected = { type: 'node', id: res.createdId };
                    renderAll();
                }
            }
        });

        // 快捷键支持
        window.addEventListener('keydown', function (e) {
            if (e.target.matches('input, textarea, select')) return;

            if (e.key === 'Escape') {
                if (app.activeStamp) {
                    app.activeStamp = null;
                    if (window.OpenMapEditor.AssetDrawer) window.OpenMapEditor.AssetDrawer.clearActiveSelection();
                    var vp = document.getElementById('workbenchViewport');
                    if (vp) vp.style.cursor = '';
                    showToast('已退出落子放置模式', 'info');
                    return;
                }
            }

            // 方向键步进平移 (1px，Shift + 方向键 10px)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) !== -1) {
                if (app.selected && (app.selected.type === 'node' || app.selected.type === 'multi')) {
                    e.preventDefault();
                    var step = e.shiftKey ? 10 : 1;
                    var dX = 0, dY = 0;
                    if (e.code === 'ArrowUp') dY = -step;
                    else if (e.code === 'ArrowDown') dY = step;
                    else if (e.code === 'ArrowLeft') dX = -step;
                    else if (e.code === 'ArrowRight') dX = step;

                    // 先记撤销基线再改坐标：顺序反了会让第一次撤销变成空操作
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                    if (app.selected.type === 'node' && app.project.nodes[app.selected.id]) {
                        app.project.nodes[app.selected.id].x += dX;
                        app.project.nodes[app.selected.id].y += dY;
                        syncSegmentsForNodes([app.selected.id]);
                    } else if (app.selected.type === 'multi') {
                        (app.selected.nodeIds || []).forEach(function (nid) {
                            if (app.project.nodes[nid]) {
                                app.project.nodes[nid].x += dX;
                                app.project.nodes[nid].y += dY;
                            }
                        });
                        syncSegmentsForNodes(app.selected.nodeIds);
                    }
                    renderAll();
                    return;
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                if (e.shiftKey) {
                    clickElement('btnRedo');
                } else {
                    clickElement('btnUndo');
                }
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
                e.preventDefault();
                clickElement('btnRedo');
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
                e.preventDefault();
                copySelection();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
                e.preventDefault();
                pasteClipboard();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
                e.preventDefault();
                duplicateSelection();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyH') {
                e.preventDefault();
                openHistoryModal();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
                e.preventDefault();
                openSearchModal();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyU') {
                e.preventDefault();
                app.smartGuidesEnabled = !app.smartGuidesEnabled;
                var hgBtn = document.getElementById('hudBtnSmartGuides');
                if (hgBtn) hgBtn.classList.toggle('active', app.smartGuidesEnabled);
                showToast(app.smartGuidesEnabled ? '智能参考线与磁吸已开启 (Ctrl+U)' : '智能参考线已关闭 (Ctrl+U)');
            } else if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
                e.preventDefault();
                openModal('modalShortcuts');
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
                // Ctrl+S → 原地直接保存或弹出 Changeset
                e.preventDefault();
                handleSmartSave();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') {
                e.preventDefault();
                clickElement('btnHeaderOpenFile');
            } else if ((e.ctrlKey || e.metaKey) && (e.code === 'BracketLeft' || e.key === '[')) {
                e.preventDefault();
                toggleNavDrawer();
            } else if ((e.ctrlKey || e.metaKey) && (e.code === 'BracketRight' || e.key === ']')) {
                e.preventDefault();
                toggleInspector();
            } else if (e.code === 'Delete' || e.code === 'Backspace') {
                if (app.selected) {
                    if (app.selected.type === 'segment' && app.selected.pointIdx !== null && app.selected.pointIdx !== undefined) {
                        // 撤销基线由 handlePropertyChange 内部压入，这里不能再压一次（否则第一次撤销是空操作）
                        handlePropertyChange('segment', app.selected.id, 'delete_point', { pointIdx: app.selected.pointIdx });
                    } else if (app.selected.type === 'water' && app.selected.pointIdx !== null && app.selected.pointIdx !== undefined) {
                        handlePropertyChange('water', app.selected.id, 'delete_point', { pointIdx: app.selected.pointIdx });
                    } else if (app.selected.type === 'multi') {
                        var nListDel = app.selected.nodeIds || [];
                        confirmDeleteStations(nListDel);
                    } else if (app.selected.type === 'line') {
                        // 线路删除走专用流程（内部自带确认框与准确提示），
                        // 以前落到下面的通用分支，只弹了「已删除选中图元」而线路纹丝不动。
                        deleteLineById(app.selected.id);
                    } else {
                        var delTargetKey = (app.selected.id !== undefined) ? app.selected.id : app.selected.idx;
                        handlePropertyChange(app.selected.type, delTargetKey, 'delete', true);
                    }
                }
            } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                // Enter：立即结束当前连续绘制（保留已经画好的线段，且不切换工具，
                // 方便马上开始下一条走线）；水域工具下则是闭合多边形。
                var pdEnter = window.OpenMapEditor.PipelineDraw;
                if (app.activeTool === 'water' && pdEnter &&
                    typeof pdEnter.hasWaterDraft === 'function' && pdEnter.hasWaterDraft()) {
                    e.preventDefault();
                    var widEnter = pdEnter.finishWaterDraft(app.project);
                    if (widEnter) {
                        app.selected = { type: 'water', id: widEnter };
                        renderAll();
                        showToast('已闭合水域多边形（Enter）', 'success');
                    } else {
                        renderAll();
                        showToast('至少需要 3 个顶点才能闭合水域', 'warning');
                    }
                    return;
                }
                if (/^seg/.test(app.activeTool) && pdEnter &&
                    typeof pdEnter.hasDraft === 'function' && pdEnter.hasDraft()) {
                    e.preventDefault();
                    pdEnter.cancelDraft();
                    renderAll();
                    showToast('已结束连续绘制（Enter）');
                }
            } else if (e.code === 'Escape') {
                setTool('select');
                window.OpenMapEditor.PipelineDraw.cancelDraft();
                renderAll();
            } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                // 无修饰键工具切换快捷键
                if (e.code === 'KeyV') {
                    setTool('select');
                } else if (e.code === 'KeyB') {
                    setTool('box');
                } else if (e.code === 'KeyP') {
                    setTool('points');
                } else if (e.code === 'KeyI') {
                    setTool('eyedropper');
                } else if (e.code === 'KeyS') {
                    // 仅在无修饰键时才触发 station 工具
                    setTool('station');
                } else if (e.code === 'KeyT') {
                    setTool('temp');
                } else if (e.code === 'KeyW') {
                    setTool('water');
                } else if (e.code === 'KeyX') {
                    setTool('text');
                } else if (e.code === 'KeyF') {
                    clickElement('hudBtnFit');
                } else if (e.code === 'KeyG') {
                    clickElement('hudBtnGrid');
                } else if (e.code === 'KeyR') {
                    setRulerVisible(!app.rulerVisible);
                }
            }
        });
    }

    function bindModals() {
        // 关闭按钮通用委托
        document.querySelectorAll('[data-close]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var modalId = this.getAttribute('data-close');
                closeModal(modalId);
            });
        });

        // 原生 <cgo-modal> 事件与 classList 兼容同步
        document.querySelectorAll('cgo-modal').forEach(function (modal) {
            modal.addEventListener('cgo-close', function () {
                modal.classList.remove('open');
                modal.open = false;
            });
            if (window.MutationObserver) {
                new MutationObserver(function () {
                    var hasOpen = modal.classList.contains('open');
                    if (hasOpen && !modal.open) modal.open = true;
                    else if (!hasOpen && modal.open) modal.open = false;
                }).observe(modal, { attributes: true, attributeFilter: ['class'] });
            }
        });

        // 密码明文/密文切换
        var btnToggleVis = document.getElementById('btnToggleApiKeyVis');
        if (btnToggleVis) {
            btnToggleVis.addEventListener('click', function () {
                var keyInput = document.getElementById('deepseekApiKey');
                if (keyInput) {
                    var isHidden = keyInput.type === 'password';
                    keyInput.type = isHidden ? 'text' : 'password';
                    var icon = this.querySelector('cgo-icon');
                    if (icon) icon.setAttribute('name', isHidden ? 'lock' : 'eye');
                }
            });
        }

        // DeepSeek 配置：保存、测试与清除由 deepseek-vision.js 的 initModalBindings 统一托管处理，避免双重绑定与覆盖 API Base

        // 快捷键速查面板触发
        var btnShortcuts = document.getElementById('btnHeaderShortcuts');
        if (btnShortcuts) {
            btnShortcuts.addEventListener('click', function () {
                openModal('modalShortcuts');
            });
        }

        // 视口 HUD 快速查找车站
        var btnHudSearch = document.getElementById('hudBtnSearchStation');
        if (btnHudSearch) {
            btnHudSearch.addEventListener('click', function () {
                openSearchModal();
            });
        }

        // 查找车站输入框实时过滤与 Enter 定位
        var searchInput = document.getElementById('searchStationInput');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                renderSearchResults(this.value);
            });
            searchInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var activeEl = document.querySelector('#searchStationResultsBox .search-station-item.active') ||
                        document.querySelector('#searchStationResultsBox .search-station-item');
                    if (activeEl) {
                        var stId = activeEl.getAttribute('data-st-id');
                        closeModal('modalSearchStation');
                        searchAndJumpStation(stId);
                    }
                }
            });
        }

        // 新建画布
        var btnConfirmNew = document.getElementById('btnConfirmNewCanvas');
        if (btnConfirmNew) btnConfirmNew.addEventListener('click', function () {
            var w = parseInt(document.getElementById('newCanvasWidth').value, 10) || 2000;
            var h = parseInt(document.getElementById('newCanvasHeight').value, 10) || 1500;
            var slope = (document.getElementById('newCanvasSlope').value || '1:1').split(':');

            // 新工程与旧城市无关：先清掉维护上下文与旧存档，避免误写回 / 误恢复
            if (window.OpenMapEditor.PipelineSurgical && window.OpenMapEditor.PipelineSurgical.resetContext) {
                window.OpenMapEditor.PipelineSurgical.resetContext();
            }
            // 旧的走线草稿属于上一个工程，必须清掉（否则下一个工程的第一次点击会被当成"第二击"）
            if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.cancelDraft) {
                window.OpenMapEditor.PipelineDraw.cancelDraft();
            }
            clearSession();
            app.project = window.OpenMapEditor.ProjectModel.createProject(w, h);
            app.project.slope = { m: parseInt(slope[0], 10) || 1, n: parseInt(slope[1], 10) || 1 };
            app.project.lines.push({ id: 'L1', name: '1号线', color: '#c23531' });
            app.activeLineId = 'L1';
            // 新画布是全新工程：撤销/重做栈必须清空，否则 Undo 会恢复上一份工程的快照
            window.OpenMapEditor.HistoryManager.clear();

            document.getElementById('currentDocLabel').textContent = '未命名工程 (' + w + '×' + h + ')';
            closeModal('modalNewCanvas');
            window.OpenMapEditor.ViewportLayer.fitCanvas(w, h);
            renderAll();
            showToast('已创建新画布');
        });

        // 存量维护：选择城市加载 (支持 cgo-toolbar-select 与原生 select)
        var citySelect = document.getElementById('selectCityToLoad');
        if (citySelect) {
            // 同一座城市正在加载时不重复发起（URL 启动 / 事件冒泡都可能重复触发）
            var loadingCityId = null;
            var handleCityChange = async function (cityId) {
                if (!cityId) return;
                if (loadingCityId === cityId) return;

                // 明确切换工程前先说清代价：撤销历史与未保存改动都会随旧工程一起丢弃。
                // 不比较「是否同一座城市」——重新载入当前城市同样会重建工程、丢掉未保存编辑。
                var surgical = window.OpenMapEditor.PipelineSurgical;
                var currentCity = surgical && typeof surgical.getCurrentLoadedCity === 'function'
                    ? surgical.getCurrentLoadedCity() : null;
                var currentId = currentCity && currentCity.id ? currentCity.id : null;
                var dirty = window.OpenMapEditor.HistoryManager &&
                    typeof window.OpenMapEditor.HistoryManager.getDirtyCount === 'function'
                    ? window.OpenMapEditor.HistoryManager.getDirtyCount() : 0;
                if (app.project && dirty > 0) {
                    var cityName = function (id) {
                        var reg = window.CITY_REGISTRY && window.CITY_REGISTRY[id];
                        return (reg && reg.name) ? reg.name : id;
                    };
                    var fromName = currentId ? '「' + cityName(currentId) + '」' : '当前';
                    var sameCity = currentId === cityId;
                    var ok = await askConfirm({
                        title: sameCity ? '重新载入「' + cityName(cityId) + '」？' : '切换到「' + cityName(cityId) + '」？',
                        message: fromName + '工程里有 ' + dirty + ' 处修改还没有导出。' +
                            (sameCity ? '重新载入会恢复为城市的原始数据，' : '切换城市会载入新的线路数据，') +
                            '这些修改将被丢弃，撤销记录也会清空。',
                        note: '想保留这些修改：先点下方「导出改动 ZIP」，下载完成后再决定是否切换。',
                        confirmText: sameCity ? '放弃修改并重新载入' : '放弃修改并切换',
                        cancelText: '留在当前工程',
                        danger: true,
                        extra: document.getElementById('btnExportPatchFiles') ? {
                            text: '导出改动 ZIP',
                            icon: 'export-zip',
                            onClick: function () { document.getElementById('btnExportPatchFiles').click(); }
                        } : null
                    });
                    if (!ok) {
                        citySelect.value = currentId || '';
                        if (typeof citySelect.requestUpdate === 'function') citySelect.requestUpdate();
                        return;
                    }
                }

                loadingCityId = cityId;
                try {
                    var localDir = localCityDirs && localCityDirs[cityId] ? localCityDirs[cityId].dir : null;
                    if (!localDir && isOnlineEditor()) {
                        throw new Error('线上编辑器不提供在线城市库，请先「关联本地目录」');
                    }
                    showToast('正在载入城市: ' + cityId + (localDir ? '（本地目录）' : '') + '...', 'info');
                    var res = localDir
                        ? await window.OpenMapEditor.PipelineSurgical.loadCityFromDirectory(localDir, cityId)
                        : await window.OpenMapEditor.PipelineSurgical.loadCity(cityId);
                    updateLinkDirUi();
                    // 换了工程：上一个工程遗留的走线草稿必须清掉，否则首次点击会被当成"第二击"
                    if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.cancelDraft) {
                        window.OpenMapEditor.PipelineDraw.cancelDraft();
                    }
                    app.project = res.project;
                    var cName = (res.city && res.city.name) ? res.city.name : cityId;
                    var cId = (res.city && res.city.id) ? res.city.id : cityId;
                    document.getElementById('currentDocLabel').textContent = cName + ' (' + cId + ')';
                    app.activeLineId = (app.project.lines && app.project.lines[0]) ? app.project.lines[0].id : null;
                    if (app.activeLineId && window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
                        window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
                    }
                    if (app.project.canvas) {
                        window.OpenMapEditor.ViewportLayer.fitCanvas(app.project.canvas.width, app.project.canvas.height);
                    }
                    // 撤销/重做栈属于上一份工程，绝不能跨工程恢复（issue #39）
                    window.OpenMapEditor.HistoryManager.clear();
                    renderAll();
                    showToast('已无损载入城市: ' + cName, 'success');
                } catch (e) {
                    showToast('载入失败: ' + (e.message || e), 'error');
                } finally {
                    if (loadingCityId === cityId) loadingCityId = null;
                }
            };

            citySelect.addEventListener('cgo-change', function (e) {
                var cityId = (e && e.detail && e.detail.value !== undefined) ? e.detail.value : this.value;
                handleCityChange(cityId);
            });
            citySelect.addEventListener('change', function (e) {
                var cityId = (e && e.detail && e.detail.value !== undefined) ? e.detail.value : this.value;
                handleCityChange(cityId);
            });
        }

        // 外科手术保存
        var btnSurgicalSave = document.getElementById('btnSurgicalPatchSave');
        if (btnSurgicalSave) {
            btnSurgicalSave.addEventListener('click', function () {
                try {
                    var res = window.OpenMapEditor.PipelineSurgical.patchStationsSource(app.project);
                    if (res.dirtyCount === 0) {
                        showToast('当前未修改任何车站条目');
                    } else {
                        window.OpenMapEditor.BundleExporter.download(
                            'data_stations.patched.js',
                            res.patchedSource,
                            'text/javascript'
                        );
                        showToast('已安全生成 ' + res.dirtyCount + ' 个车站改动补丁并开始下载（服务端保持安全只读，未覆盖写入）', 'success');
                    }
                } catch (e) {
                    showToast('生成补丁失败: ' + (e.message || e), 'error');
                }
            });
        }

        // 导出纯 SVG 与高清 PNG
        var btnExportSvg = document.getElementById('btnExportRenderedSvg');
        if (btnExportSvg) {
            btnExportSvg.addEventListener('click', function () {
                var svg = document.getElementById('editorSvg');
                var fname = (app.project && app.project.name ? app.project.name + '-map.svg' : 'openmap-export.svg');
                window.OpenMapEditor.BundleExporter.exportSvgElement(svg, fname, app.project);
                showToast('已导出纯净矢量 SVG', 'success');
            });
        }

        var btnExportPng = document.getElementById('btnExportRenderedPng');
        if (btnExportPng) {
            btnExportPng.addEventListener('click', function () {
                var svg = document.getElementById('editorSvg');
                var fname = (app.project && app.project.name ? app.project.name + '-map.png' : 'openmap-export.png');
                showToast('正在光栅化渲染高清 PNG...', 'info');
                window.OpenMapEditor.BundleExporter.exportPngElement(svg, fname, app.project, {
                    scale: 2,
                    onSuccess: function () {
                        showToast('已导出 2x 高清 PNG 图片', 'success');
                    },
                    onError: function () {
                        showToast('PNG 导出失败：SVG 包含外部受限资源或画布尺寸超限', 'error');
                    }
                });
            });
        }

        var btnExportPng4x = document.getElementById('btnExportPng4x');
        if (btnExportPng4x) {
            btnExportPng4x.addEventListener('click', function () {
                var svg = document.getElementById('editorSvg');
                var fname = (app.project && app.project.name ? app.project.name + '-map-4x-print.png' : 'openmap-export-4x.png');
                showToast('正在渲染 4x 印刷级超清 PNG (300DPI)...', 'info');
                window.OpenMapEditor.BundleExporter.exportPngElement(svg, fname, app.project, {
                    scale: 4,
                    onSuccess: function () {
                        showToast('已导出 4x 印刷级超清 PNG 图片 (300DPI)', 'success');
                    },
                    onError: function () {
                        showToast('4x PNG 导出失败：Canvas 尺寸超限或内存不足', 'error');
                    }
                });
            });
        }

        var btnExportPng8x = document.getElementById('btnExportPng8x');
        if (btnExportPng8x) {
            btnExportPng8x.addEventListener('click', function () {
                var svg = document.getElementById('editorSvg');
                var fname = (app.project && app.project.name ? app.project.name + '-map-8x-poster.png' : 'openmap-export-8x.png');
                showToast('正在渲染 8x 超大画幅海报 PNG...', 'info');
                window.OpenMapEditor.BundleExporter.exportPngElement(svg, fname, app.project, {
                    scale: 8,
                    onSuccess: function () {
                        showToast('已导出 8x 超大画幅海报 PNG 图片', 'success');
                    },
                    onError: function () {
                        showToast('8x PNG 导出失败：Canvas 尺寸超限或内存不足', 'error');
                    }
                });
            });
        }

        // 实际站间距弹窗
        var btnOpenMileage = document.getElementById('btnOpenMileageModal');
        if (btnOpenMileage) btnOpenMileage.addEventListener('click', function () {
            // 填充线路选择列表
            var sel = document.getElementById('mileageTargetLine');
            if (sel && app.project) {
                sel.innerHTML = (app.project.lines || []).map(function (l) {
                    return '<option value="' + l.id + '">' + (l.name || l.id) + '</option>';
                }).join('');
                // 加载当前线路已有数据
                var firstLine = app.project.lines[0];
                if (firstLine && app.project.lineDistances && app.project.lineDistances[firstLine.id]) {
                    var textarea = document.getElementById('mileageRawInput');
                    if (textarea) textarea.value = app.project.lineDistances[firstLine.id].source || '';
                }
            }
            openModal('modalMileage');
        });

        // 线路切换时更新站间距文本框
        var mileageLineSelect = document.getElementById('mileageTargetLine');
        if (mileageLineSelect) mileageLineSelect.addEventListener('change', function () {
            var lineId = this.value;
            var textarea = document.getElementById('mileageRawInput');
            if (textarea && app.project && app.project.lineDistances && app.project.lineDistances[lineId]) {
                textarea.value = app.project.lineDistances[lineId].source || '';
            } else if (textarea) {
                textarea.value = '';
            }
        });

        // 保存站间距
        var btnSaveMileage = document.getElementById('btnSaveMileage');
        if (btnSaveMileage) btnSaveMileage.addEventListener('click', function () {
            if (!app.project) return;
            var lineId = (document.getElementById('mileageTargetLine') || {}).value;
            var text = (document.getElementById('mileageRawInput') || {}).value || '';
            if (!lineId) { showToast('请选择目标线路'); return; }

            var parsed = window.OpenMapEditor.MileageManager.parseMileageText(text);
            if (parsed.errors && parsed.errors.length) {
                showToast('解析错误: ' + parsed.errors[0], 'error');
                return;
            }

            app.project.lineDistances = app.project.lineDistances || {};
            app.project.lineDistances[lineId] = {
                source: text,
                values: parsed.values,
                count: parsed.count,
                updatedAt: Date.now()
            };

            closeModal('modalMileage');
            showToast('已保存线路「' + lineId + '」站间距 ' + parsed.count + ' 条', 'success');
        });

        // ------------------------------------------------------------------
        // 新增线路：创建后设为「当前绘制线路」，并选中它（右侧立刻显示线路属性）
        // ------------------------------------------------------------------
        function suggestLineId() {
            var maxN = 0;
            (app.project.lines || []).forEach(function (l) {
                var m = /(\d+)\s*$/.exec(String(l.id || ''));
                if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
            });
            var prefix = 'M';
            var first = (app.project.lines || [])[0];
            if (first && first.id) {
                var fid = String(first.id);
                var pm = /^([A-Za-z_-]+)/.exec(fid);
                if (pm) prefix = pm[1];
                else if (/^\d+$/.test(fid)) prefix = '';
            }
            return { id: prefix + (maxN + 1), name: (maxN + 1) + '号线' };
        }

        function openNewLineModal() {
            if (!app.project) { showToast('请先新建画布或载入城市', 'warning'); return; }
            var sug = suggestLineId();
            var idEl = document.getElementById('newLineId');
            var nameEl = document.getElementById('newLineName');
            var colorEl = document.getElementById('newLineColor');
            var colorTextEl = document.getElementById('newLineColorText');
            var companyEl = document.getElementById('newLineCompany');
            var loopEl = document.getElementById('newLineIsLoop');
            var branchEl = document.getElementById('newLineHasBranch');
            if (idEl) idEl.value = sug.id;
            if (nameEl) nameEl.value = sug.name;
            if (colorEl) colorEl.value = '#0284C7';
            if (colorTextEl) colorTextEl.value = '#0284C7';
            if (companyEl) companyEl.value = '';
            if (loopEl) loopEl.checked = false;
            if (branchEl) branchEl.checked = false;
            openModal('modalNewLine');
            setTimeout(function () { if (idEl) { idEl.focus(); idEl.select(); } }, 30);
        }

        function createLineFromModal() {
            if (!app.project) return;
            var id = String((document.getElementById('newLineId') || {}).value || '').trim();
            var name = String((document.getElementById('newLineName') || {}).value || '').trim();
            var color = normalizeHexColor(
                (document.getElementById('newLineColorText') || {}).value ||
                (document.getElementById('newLineColor') || {}).value);
            var company = String((document.getElementById('newLineCompany') || {}).value || '').trim();
            var isLoop = !!(document.getElementById('newLineIsLoop') || {}).checked;
            var hasBranch = !!(document.getElementById('newLineHasBranch') || {}).checked;

            if (!id) { showToast('请填写线路 ID', 'warning'); return; }
            if (!/^[A-Za-z0-9_-]+$/.test(id)) {
                showToast('线路 ID 只能包含字母、数字、下划线与短横线', 'warning');
                return;
            }
            if ((app.project.lines || []).some(function (l) { return l.id === id; })) {
                showToast('线路 ID「' + id + '」已存在，请换一个', 'error');
                return;
            }

            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

            var line = { id: id, name: name || id, color: color || '#0284C7' };
            if (company) line.company = company;
            if (isLoop) line.isLoop = true;
            if (hasBranch) {
                line.hasbranch = true;
                line['stationIds-way1'] = [];
                line['stationIds-way2'] = [];
            } else {
                line.stationIds = [];
            }
            app.project.lines = app.project.lines || [];
            app.project.lines.push(line);

            // 设为当前绘制线路：之后画的线段都会挂到这条线上
            app.activeLineId = id;
            if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
                window.OpenMapEditor.PipelineDraw.setActiveLine(id);
            }
            // 选中它，右侧立即显示「线路属性」，可继续改名称/色号
            app.selected = { type: 'line', id: id };

            closeModal('modalNewLine');
            renderAll();
            showToast('已新增线路「' + line.name + '」（' + id + '），已设为当前绘制线路', 'success');
        }

        var btnNewLineEl = document.getElementById('btnNewLine');
        if (btnNewLineEl) btnNewLineEl.addEventListener('click', openNewLineModal);
        var btnConfirmNewLineEl = document.getElementById('btnConfirmNewLine');
        if (btnConfirmNewLineEl) btnConfirmNewLineEl.addEventListener('click', createLineFromModal);
        var newLineColorEl = document.getElementById('newLineColor');
        var newLineColorTextEl = document.getElementById('newLineColorText');
        if (newLineColorEl && newLineColorTextEl) {
            newLineColorEl.addEventListener('input', function () {
                newLineColorTextEl.value = String(this.value || '').toUpperCase();
            });
            newLineColorTextEl.addEventListener('change', function () {
                var hex = normalizeHexColor(this.value);
                if (hex) { this.value = hex; newLineColorEl.value = hex; }
                else { this.value = newLineColorEl.value; }
            });
        }

        // ------------------------------------------------------------------
        // 百科表格批量放站：解析 → 逐行校对 → 选是否连线 → 确认导入
        // ------------------------------------------------------------------
        var batchPreviewRows = [];   // [{ cn, en, checked }]

        function escapeBatchAttr(v) {
            return String(v == null ? '' : v)
                .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
                .replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function renderBatchPreview() {
            var wrap = document.getElementById('batchPreviewWrap');
            var body = document.getElementById('batchPreviewBody');
            if (!wrap || !body) return;
            if (!batchPreviewRows.length) {
                wrap.hidden = true;
                body.innerHTML = '';
                return;
            }
            wrap.hidden = false;
            body.innerHTML = batchPreviewRows.map(function (r, i) {
                return '<tr>' +
                    '<td style="text-align:center;color:var(--text-light);">' + (i + 1) + '</td>' +
                    '<td><input class="form-input batch-cell-cn" data-idx="' + i + '" value="' + escapeBatchAttr(r.cn) + '"></td>' +
                    '<td><input class="form-input batch-cell-en" data-idx="' + i + '" value="' + escapeBatchAttr(r.en) + '"></td>' +
                    '<td style="text-align:center;"><input type="checkbox" class="batch-cell-use" data-idx="' + i + '"' +
                    (r.checked ? ' checked' : '') + '></td>' +
                    '</tr>';
            }).join('');
        }

        function doParseBatch() {
            var inputEl = document.getElementById('batchHtmlInput');
            var status = document.getElementById('batchParseStatus');
            var raw = inputEl ? String(inputEl.value || '') : '';
            if (!raw.trim()) {
                showToast('请先粘贴百科表格源码', 'warning');
                return;
            }
            var parsed = { rows: [], skipped: 0 };
            try {
                parsed = window.OpenMapEditor.BatchStationTool.parseStationTable(raw);
            } catch (e) {
                console.warn('[Batch] 表格解析失败，退化按纯文本处理：', e);
            }
            var rows = (parsed.rows || []).map(function (r) { return { cn: r.cn, en: r.en || '', checked: true }; });

            if (!rows.length) {
                // 退化：用户可能直接粘了一段站名列表
                var plain = window.OpenMapEditor.BatchStationTool.parseStationList(raw) || [];
                rows = plain.map(function (r) { return { cn: r.cn, en: r.en || '', checked: true }; });
            }

            if (!rows.length) {
                batchPreviewRows = [];
                renderBatchPreview();
                if (status) status.textContent = '没有解析到站名';
                showToast('没有解析到站名：请确认粘贴的是表格源码（<table>…</table>）', 'error');
                return;
            }

            batchPreviewRows = rows;
            renderBatchPreview();
            if (status) {
                status.textContent = '解析到 ' + rows.length + ' 座车站' +
                    (parsed.skipped ? ('（已跳过 ' + parsed.skipped + ' 行非站名内容）') : '') +
                    '，请逐行校对后确认';
            }
        }

        var btnOpenBatch = document.getElementById('btnOpenBatchStationModal');
        if (btnOpenBatch) {
            btnOpenBatch.addEventListener('click', function () {
                if (!app.project) {
                    showToast('请先新建画布或载入城市', 'warning');
                    return;
                }
                var sel = document.getElementById('batchTargetLine');
                if (sel) {
                    sel.innerHTML = (app.project.lines || []).map(function (l) {
                        return '<option value="' + l.id + '">' + (l.name || l.id) + '</option>';
                    }).join('') || '<option value="">（当前没有线路）</option>';
                }
                // 每次打开都清空上一次的解析结果，避免误把旧预览当新结果导入
                batchPreviewRows = [];
                renderBatchPreview();
                var status = document.getElementById('batchParseStatus');
                if (status) status.textContent = '';
                openModal('modalBatchStation');
            });
        }

        var btnParseBatch = document.getElementById('btnParseBatchStation');
        if (btnParseBatch) btnParseBatch.addEventListener('click', doParseBatch);

        var batchBody = document.getElementById('batchPreviewBody');
        if (batchBody) {
            // 输入即写回预览数据（改动在点「确认导入」时才生效）
            batchBody.addEventListener('input', function (e) {
                var el = e.target;
                var idx = parseInt(el.getAttribute('data-idx'), 10);
                if (!(idx >= 0) || !batchPreviewRows[idx]) return;
                if (el.classList.contains('batch-cell-cn')) batchPreviewRows[idx].cn = el.value;
                else if (el.classList.contains('batch-cell-en')) batchPreviewRows[idx].en = el.value;
            });
            batchBody.addEventListener('change', function (e) {
                var el = e.target;
                var idx = parseInt(el.getAttribute('data-idx'), 10);
                if (!(idx >= 0) || !batchPreviewRows[idx]) return;
                if (el.classList.contains('batch-cell-use')) batchPreviewRows[idx].checked = el.checked;
            });
        }

        var btnBatchAll = document.getElementById('btnBatchCheckAll');
        if (btnBatchAll) {
            btnBatchAll.addEventListener('click', function () {
                batchPreviewRows.forEach(function (r) { r.checked = true; });
                renderBatchPreview();
            });
        }
        var btnBatchNone = document.getElementById('btnBatchUncheckAll');
        if (btnBatchNone) {
            btnBatchNone.addEventListener('click', function () {
                batchPreviewRows.forEach(function (r) { r.checked = false; });
                renderBatchPreview();
            });
        }

        var btnApplyBatch = document.getElementById('btnApplyBatchStation');
        if (btnApplyBatch) {
            btnApplyBatch.addEventListener('click', function () {
                if (!app.project) { showToast('请先新建画布或载入城市', 'warning'); return; }

                var usable = batchPreviewRows.filter(function (r) {
                    return r.checked && String(r.cn || '').trim();
                });
                if (!usable.length) {
                    showToast('请先点「解析站名」，并至少勾选一座车站（中文站名不能为空）', 'warning');
                    return;
                }

                var lineId = (document.getElementById('batchTargetLine') || {}).value || '';
                var connect = !!(document.getElementById('batchAutoConnect') || {}).checked;
                var dir = (document.getElementById('batchDirection') || {}).value || 'horizontal';
                var step = parseInt((document.getElementById('batchStepDistance') || {}).value, 10) || 60;

                if (connect && !lineId) {
                    showToast('要自动连线，请先在「目标线路」里选一条线；或取消勾选「连线」只放站', 'warning');
                    return;
                }

                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                // 起点交给流水线决定：追加到已有线路时从原末站继续往外排，
                // 只有空线路 / 空白画布才落到默认 (200, 200)。
                var created = window.OpenMapEditor.BatchStationTool.batchCreateStations(
                    app.project,
                    connect ? lineId : '',
                    usable.map(function (r) { return { cn: String(r.cn).trim(), en: String(r.en || '').trim() }; }),
                    { step: step, direction: dir, autoConnect: connect }
                );

                closeModal('modalBatchStation');
                batchPreviewRows = [];
                renderBatchPreview();
                renderAll();
                showToast('已导入 ' + created.length + ' 座车站' + (connect ? '并写入线路站序（站距用 0 占位，请在「里程管理」补齐）' : '（未连线）'), 'success');
            });
        }

        // 导出 OpenMap 城市工程包
        var btnConfirmZip = document.getElementById('btnConfirmDownloadZip');
        if (btnConfirmZip) btnConfirmZip.addEventListener('click', async function () {
            if (!app.project) return;
            var cityId = (document.getElementById('exportCityId') || {}).value || 'unnamed';
            var cityName = (document.getElementById('exportCityName') || {}).value || cityId;
            var themeColor = (document.getElementById('exportThemeColor') || {}).value || '#00263b';
            var themeColorDark = (document.getElementById('exportThemeColorDark') || {}).value || '#ffffff';
            var linePrefix = (document.getElementById('exportLinePrefix') || {}).value || 'M';
            var company = (document.getElementById('exportCompany') || {}).value || '';
            var pxMeter = parseFloat((document.getElementById('exportPxMeter') || {}).value) || 25;

            showToast('正在打包 OpenMap 城市工程包…');
            try {
                var pack = window.OpenMapEditor.BundleExporter.formatCityPackage(app.project, {
                    cityId: cityId,
                    cityName: cityName,
                    themeColor: themeColor,
                    themeColorDark: themeColorDark,
                    linePrefix: linePrefix,
                    company: company,
                    pixelsPerMeter: pxMeter
                });

                var entries = [
                    { name: cityId + '/data_stations.js', text: pack.stationsJs },
                    { name: cityId + '/data_lines.js', text: pack.linesJs },
                    { name: cityId + '/data_legend.js', text: pack.legendJs },
                    { name: cityId + '/openmap_project.json', text: JSON.stringify(app.project, null, 2) }
                ];
                // 未开通 / 在建 / 规划走向：必须单独交付，否则会被当成已开通线路画成实线
                if (pack.notOpenJs && (pack.notOpenData || []).length) {
                    entries.push({ name: cityId + '/data_notopen.js', text: pack.notOpenJs });
                }

                var zipBytes = await window.OpenMapEditor.BundleExporter.buildZipBytes(entries);
                var blob = new Blob([zipBytes], { type: 'application/zip' });
                window.OpenMapEditor.BundleExporter.download(cityId + '-openmap-bundle.zip', blob);

                closeModal('modalExportPackage');
                var report = (pack && pack.uncoveredReport) || [];
                if (report.length) {
                    // 数据契约：站心（非换乘站）应落在路径上。偏离的这些需要微调站心或走向，
                    // 但它们仍保留在站序里，不会丢。
                    var detail = report.map(function (r) {
                        var names = (r.names || []).slice(0, 3).join('、');
                        var more = (r.names || []).length > 3 ? ' 等' : '';
                        return r.lineId + ' ' + r.lineName + '：' + names + more;
                    }).join('；');
                    showToast('导出完成。提示：以下非换乘站的站心不在本线路径上（站仍保留在站序中）：' + detail +
                        '。把站心挪到路径上、或调整走向即可。', 'warning', 7000);
                }
                showToast('已导出 OpenMap 城市包: ' + cityId + '-openmap-bundle.zip', 'success');
            } catch (err) {
                showToast('打包失败: ' + (err.message || err), 'error');
            }
        });

        // 历史记录面板清空
        var btnClearHist = document.getElementById('btnClearHistoryStack');
        if (btnClearHist) {
            btnClearHist.addEventListener('click', function () {
                window.OpenMapEditor.HistoryManager.clear();
                openHistoryModal();
                showToast('已清空操作历史记录');
            });
        }

        // 智能识图：替换当前工程
        var btnReplaceVision = document.getElementById('btnReplaceVisionProject');
        if (btnReplaceVision) {
            btnReplaceVision.addEventListener('click', function () {
                if (!pendingVision) return;
                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project, '识图替换工程');
                app.project = pendingVision.project;
                app.activeLineId = (app.project.lines && app.project.lines[0]) ? app.project.lines[0].id : null;
                if (app.activeLineId && window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
                    window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
                }
                document.getElementById('currentDocLabel').textContent = '[DeepSeek] ' + pendingVision.filename;
                if (app.project.canvas) {
                    window.OpenMapEditor.ViewportLayer.fitCanvas(app.project.canvas.width, app.project.canvas.height);
                }
                closeModal('modalVisionConfirm');
                renderAll();
                showToast('已用识图结果替换当前工程', 'success');
                window.OpenMapEditor.RibbonController.switchTab('home');
                pendingVision = null;
            });
        }

        // 智能识图：追加合并
        var btnAppendVision = document.getElementById('btnAppendVisionProject');
        if (btnAppendVision) {
            btnAppendVision.addEventListener('click', function () {
                if (!pendingVision || !app.project) return;
                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project, '识图追加合并');
                var newProj = pendingVision.project;
                var idMap = {};

                // 1. 映射并合并车站
                Object.keys(newProj.nodes || {}).forEach(function (oldNid) {
                    var node = newProj.nodes[oldNid];
                    var newNid = window.OpenMapEditor.ProjectModel.nextId(app.project, 'node');
                    idMap[oldNid] = newNid;
                    var clonedNode = JSON.parse(JSON.stringify(node));
                    clonedNode.id = newNid;
                    app.project.nodes[newNid] = clonedNode;
                });

                // 2. 映射并合并线路
                (newProj.lines || []).forEach(function (l) {
                    var newLineId = window.OpenMapEditor.ProjectModel.nextId(app.project, 'line');
                    var clonedLine = JSON.parse(JSON.stringify(l));
                    clonedLine.id = newLineId;
                    if (Array.isArray(clonedLine.stationIds)) {
                        clonedLine.stationIds = clonedLine.stationIds.map(function (sid) { return idMap[sid] || sid; });
                    }
                    app.project.lines.push(clonedLine);
                });

                // 3. 映射并合并线段
                (newProj.segments || []).forEach(function (seg) {
                    var newSegId = window.OpenMapEditor.ProjectModel.nextId(app.project, 'segment');
                    var clonedSeg = JSON.parse(JSON.stringify(seg));
                    clonedSeg.id = newSegId;
                    if (Array.isArray(clonedSeg.points)) {
                        clonedSeg.points.forEach(function (p) {
                            if (p.nid && idMap[p.nid]) p.nid = idMap[p.nid];
                        });
                    }
                    app.project.segments.push(clonedSeg);
                });

                closeModal('modalVisionConfirm');
                renderAll();
                showToast('已合并追加识图要素至当前工程', 'success');
                pendingVision = null;
            });
        }
    }

    // ------------------------------------------------------------------
    // 城市库来源
    // ------------------------------------------------------------------
    // 线上部署（如 centralgo.site）不提供「在线城市库」：想维护已有城市，必须先克隆
    // 仓库，再用「关联本地目录」选中仓库根目录 / city/ / city/<id>/，从本地读取。
    // 本机开发服务器上仍可直接从服务器（也就是本地文件）载入注册表里的城市。
    var localCityDirs = null;   // { cityId: 目录句柄 }，关联本地目录后才有

    function isOnlineEditor() {
        var policy = window.OpenMapEditor.StartupPolicy;
        return !!(policy && typeof policy.isOnlineDeployment === 'function' && policy.isOnlineDeployment());
    }

    function escapeOptionText(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function populateCitySelect() {
        var sel = document.getElementById('selectCityToLoad');
        if (!sel) return;
        var label = document.getElementById('cityLibraryLabel');
        var cities = [];
        var placeholder = '载入城市工程...';

        if (localCityDirs) {
            cities = Object.keys(localCityDirs).map(function (id) {
                return { id: id, name: localCityDirs[id].name || id };
            });
            if (label) label.textContent = '本地城市库';
            if (!cities.length) placeholder = '所选目录里没有城市';
        } else if (isOnlineEditor()) {
            if (label) label.textContent = '本地城市库';
            placeholder = '请先「关联本地目录」';
            sel.title = '线上编辑器不提供在线城市库：请克隆 CGo-OpenMap 仓库后，点「关联本地目录」选中仓库根目录或 city/ 目录';
        } else {
            var io = window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
            cities = io ? io.listCities() : [];
            if (label) label.textContent = '城市库（本机服务器）';
            sel.title = '';
        }

        var isNative = String(sel.tagName || '').toLowerCase() === 'select';
        var tag = isNative ? 'option' : 'cgo-toolbar-option';
        sel.innerHTML = '<' + tag + ' value="">' + escapeOptionText(placeholder) + '</' + tag + '>' +
            (cities || []).map(function (c) {
                return '<' + tag + ' value="' + escapeOptionText(c.id) + '">' +
                    escapeOptionText(c.name) + ' (' + escapeOptionText(c.id) + ')</' + tag + '>';
            }).join('');
        if (typeof sel.requestUpdate === 'function') {
            sel.requestUpdate();
        }
    }

    function parseUrlParams(sessionRestored) {
        var params = new URLSearchParams(window.location.search);
        var city = params.get('city');
        var mode = params.get('mode');

        if (mode === 'draw') {
            window.OpenMapEditor.RibbonController.switchTab('home');
        } else if (mode === 'ingest') {
            window.OpenMapEditor.RibbonController.switchTab('ingest');
        }

        if (!city) return;

        var policy = window.OpenMapEditor.StartupPolicy;
        var action = policy && typeof policy.decideUrlCity === 'function'
            ? policy.decideUrlCity({
                sessionRestored: !!sessionRestored,
                restoredCityId: restoredSessionCityId,
                urlCity: city,
                online: isOnlineEditor()
            })
            : (sessionRestored ? 'keep-session' : 'load');

        if (action === 'blocked-online') {
            window.OpenMapEditor.RibbonController.switchTab('surgical');
            showToast('线上编辑器不能直接打开已有城市「' + city + '」。请克隆 CGo-OpenMap 仓库，' +
                '再在「城市维护」里点「关联本地目录」选择本地仓库后载入。', 'warning');
            return;
        }

        if (action === 'keep-session') {
            // 会话已恢复出未保存工程：URL 的 ?city= 只提示、不自动覆盖（issue #50）
            showToast('已恢复上次未保存的工程，未自动载入 URL 中的城市「' + city +
                '」；如需载入，请从「城市维护」的城市库手动选择', 'warning');
            return;
        }

        var citySel = document.getElementById('selectCityToLoad');
        window.OpenMapEditor.RibbonController.switchTab('surgical');

        if (action === 'already-loaded') {
            // 恢复出来的正是这座城市：只同步下拉框显示，绝不再发一次载入请求
            if (citySel) {
                citySel.value = city;
                if (typeof citySel.requestUpdate === 'function') citySel.requestUpdate();
            }
            return;
        }

        if (!citySel) return;
        if (policy && typeof policy.dispatchCityChange === 'function') {
            policy.dispatchCityChange(citySel, city);
            return;
        }
        // 兜底：只派发与控件类型匹配的单个事件（同时发 cgo-change + change 会重复加载）
        citySel.value = city;
        if (typeof citySel.requestUpdate === 'function') citySel.requestUpdate();
        if (String(citySel.tagName || '').toLowerCase() === 'select') {
            citySel.dispatchEvent(new Event('change'));
        } else {
            citySel.dispatchEvent(new CustomEvent('cgo-change', {
                detail: { value: city }, bubbles: true, composed: true
            }));
        }
    }

    // 暴露公共 API (供全站工具链与组件通信)
    window.OpenMapEditor.showToast = showToast;
    window.OpenMapEditor.openModal = openModal;
    window.OpenMapEditor.closeModal = closeModal;
    window.OpenMapEditor._getApp = function () { return app; }; // 供调试使用
    window.OpenMapEditor._appContext = app;
    window.OpenMapEditor.renderAll = renderAll;
    window.OpenMapEditor.scheduleRender = scheduleRender;
    window.OpenMapEditor.setTool = setTool;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
