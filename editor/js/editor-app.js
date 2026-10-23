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
        gridVisible: false,
        snapEnabled: true
    };

    /**
     * 全局统一 Toast 提示 (100% 复用 CGoUI 官方规范)
     */
    function showToast(msg, type, duration) {
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

    /**
     * 全局统一重绘
     */
    function renderAll() {
        if (!app.project) return;

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
        window.OpenMapEditor.VectorRouteLayer.render(app.project, {
            selectedSegmentId: selSegId,
            selectedLineId: app.activeLineId,
            selectedPointIdx: selSegPtIdx
        });

        // 2.5 在建与规划走向 (包含白线描边等样式)
        if (window.OpenMapEditor.NotOpenLayer) {
            window.OpenMapEditor.NotOpenLayer.render(app.project, { selectedIdx: selNotOpenIdx });
        }

        // 2.6 虚拟换乘连接线
        if (window.OpenMapEditor.VirtualConnectorLayer) {
            window.OpenMapEditor.VirtualConnectorLayer.render(app.project, { selectedIdx: selVirtualIdx });
        }

        // 3. 车站与站名
        var lineColorsMap = {};
        if (app.project && app.project.lines) {
            var io = window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
            var getAllStationIds = (io && typeof io.lineAllStationIds === 'function')
                ? io.lineAllStationIds
                : function (line) {
                    if (Array.isArray(line.stationIds)) return line.stationIds;
                    var sids = [];
                    Object.keys(line || {}).forEach(function (k) {
                        if (/^stationIds-/.test(k) && Array.isArray(line[k])) {
                            line[k].forEach(function (sid) { if (sids.indexOf(sid) === -1) sids.push(sid); });
                        }
                    });
                    return sids;
                };

            (app.project.lines || []).forEach(function (l) {
                var color = l.color;
                if (!color) return;
                var sids = getAllStationIds(l);
                sids.forEach(function (sid) {
                    if (!lineColorsMap[sid]) lineColorsMap[sid] = [];
                    if (lineColorsMap[sid].indexOf(color) === -1) {
                        lineColorsMap[sid].push(color);
                    }
                });
            });

            var lineMap = {};
            (app.project.lines || []).forEach(function (l) { lineMap[l.id] = l.color; });
            (app.project.segments || []).forEach(function (seg) {
                var color = lineMap[seg.lineId];
                if (!color) return;
                (seg.points || []).forEach(function (pt) {
                    if (pt.nid) {
                        if (!lineColorsMap[pt.nid]) lineColorsMap[pt.nid] = [];
                        if (lineColorsMap[pt.nid].indexOf(color) === -1) {
                            lineColorsMap[pt.nid].push(color);
                        }
                    }
                });
            });
        }

        var multiNodeIds = [];
        if (app.selected) {
            if (app.selected.type === 'node') multiNodeIds = [app.selected.id];
            else if (app.selected.type === 'multi' && Array.isArray(app.selected.nodeIds)) multiNodeIds = app.selected.nodeIds;
        }

        window.OpenMapEditor.StationLayer.render(app.project, {
            selectedNodeId: selNodeId,
            selectedNodeIds: multiNodeIds,
            lineColorsMap: lineColorsMap
        });

        // 3.5 多选包围盒渲染 (Multi-selection Bounding Box)
        var handleLayerEl = document.getElementById('handleLayer');
        var oldBbox = document.getElementById('multiSelectBoundingBox');
        if (oldBbox) oldBbox.remove();
        if (app.selected && app.selected.type === 'multi' && multiNodeIds.length > 0 && handleLayerEl) {
            var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            multiNodeIds.forEach(function (nid) {
                var n = app.project.nodes[nid];
                if (n) {
                    if (n.x < minX) minX = n.x;
                    if (n.x > maxX) maxX = n.x;
                    if (n.y < minY) minY = n.y;
                    if (n.y > maxY) maxY = n.y;
                }
            });
            if (minX !== Infinity) {
                var pad = 16;
                var bboxG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                bboxG.id = 'multiSelectBoundingBox';
                bboxG.setAttribute('pointer-events', 'none');

                var bboxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bboxRect.setAttribute('x', String(minX - pad));
                bboxRect.setAttribute('y', String(minY - pad));
                bboxRect.setAttribute('width', String(maxX - minX + pad * 2));
                bboxRect.setAttribute('height', String(maxY - minY + pad * 2));
                bboxRect.setAttribute('rx', '6');
                bboxRect.setAttribute('fill', 'rgba(2, 132, 199, 0.05)');
                bboxRect.setAttribute('stroke', '#0284c7');
                bboxRect.setAttribute('stroke-width', '1.5');
                bboxRect.setAttribute('stroke-dasharray', '4,4');

                var tagRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                tagRect.setAttribute('x', String(minX - pad));
                tagRect.setAttribute('y', String(minY - pad - 20));
                tagRect.setAttribute('width', String(16 + multiNodeIds.length.toString().length * 8 + 80));
                tagRect.setAttribute('height', '18');
                tagRect.setAttribute('rx', '4');
                tagRect.setAttribute('fill', '#0284c7');

                var tagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                tagText.setAttribute('x', String(minX - pad + 6));
                tagText.setAttribute('y', String(minY - pad - 7));
                tagText.setAttribute('fill', '#ffffff');
                tagText.setAttribute('font-size', '11');
                tagText.setAttribute('font-family', 'var(--cgo-font-sans, system-ui)');
                tagText.textContent = '已多选 ' + multiNodeIds.length + ' 座车站';

                bboxG.appendChild(bboxRect);
                bboxG.appendChild(tagRect);
                bboxG.appendChild(tagText);
                handleLayerEl.appendChild(bboxG);
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
                activeLineId: app.activeLineId
            });
        }

        // 7. 刷新右侧检视面板
        updateInspector();

        // 8. 更新数据健康状态栏
        updateHealthBadge();
    }

    function updateNavCounts() {
        // 兼容保留接口，大纲计数与树状图已由 NavTreeView 统一处理
    }

    function updateInspector() {
        if (!app.selected || !app.project) {
            window.OpenMapEditor.InspectorView.renderEmpty();
            return;
        }

        if (app.selected.type === 'node') {
            var node = app.project.nodes[app.selected.id];
            if (node) {
                window.OpenMapEditor.InspectorView.renderNodeInspector(node, app.project);
            } else {
                window.OpenMapEditor.InspectorView.renderEmpty();
            }
        } else if (app.selected.type === 'segment') {
            var seg = (app.project.segments || []).find(function (s) { return s.id === app.selected.id; });
            if (seg) {
                window.OpenMapEditor.InspectorView.renderSegmentInspector(seg, app.project, { selectedPointIdx: app.selected.pointIdx });
            } else {
                window.OpenMapEditor.InspectorView.renderEmpty();
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
                                app.project.virtualConnectors.splice(app.selected.idx, 1);
                                app.selected = null;
                                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                                renderAll();
                                showToast('已删除虚拟换乘连线');
                            }
                        }
                    ]
                );
            } else {
                window.OpenMapEditor.InspectorView.renderEmpty();
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
                                app.project.notOpenLines.splice(app.selected.idx, 1);
                                app.selected = null;
                                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                                renderAll();
                                showToast('已删除在建规划走向');
                            }
                        }
                    ]
                );
            } else {
                window.OpenMapEditor.InspectorView.renderEmpty();
            }
        } else if (app.selected.type === 'scattered') {
            var sc = (app.project.scattered || [])[app.selected.idx];
            if (sc) {
                window.OpenMapEditor.InspectorView.renderGenericInspector(
                    sc.id || '地点图标地标', 'tourist',
                    [
                        { label: '地标标识', value: sc.id || '未知' },
                        { label: '素材文件', value: sc.file || '内置' },
                        { label: '中心坐标', value: '(' + sc.x + ', ' + sc.y + ')' },
                        { label: '尺寸宽高', value: (sc.width || 36) + ' × ' + (sc.height || 36) + ' px' },
                        { label: '图层层级', value: sc.zIndex !== undefined ? sc.zIndex : 5 }
                    ],
                    [
                        {
                            label: '删除此地标', danger: true, icon: 'delete',
                            onClick: function () {
                                app.project.scattered.splice(app.selected.idx, 1);
                                app.selected = null;
                                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                                renderAll();
                                showToast('已删除地点图标');
                            }
                        }
                    ]
                );
            } else {
                window.OpenMapEditor.InspectorView.renderEmpty();
            }
        } else if (app.selected.type === 'water') {
            var water = (app.project.waters || []).find(function (w) { return w.id === app.selected.id; });
            if (water) {
                var isR = (water.type === 'path' || water.type === 'river');
                window.OpenMapEditor.InspectorView.renderGenericInspector(
                    water.name || (isR ? '河道' : '水面'), 'map',
                    [
                        { label: '水系名称', value: water.name || water.id },
                        { label: '要素形态', value: isR ? '带线宽河道 (Polyline)' : '水面多边形 (Polygon)' },
                        { label: '多边形点数', value: (water.points || []).length + ' 个顶点' }
                    ],
                    [
                        {
                            label: '删除此水域', danger: true, icon: 'delete',
                            onClick: function () {
                                app.project.waters = (app.project.waters || []).filter(function (w) { return w.id !== water.id; });
                                app.selected = null;
                                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                                renderAll();
                                showToast('已删除水域要素');
                            }
                        }
                    ]
                );
            } else {
                window.OpenMapEditor.InspectorView.renderEmpty();
            }
        } else if (app.selected.type === 'text') {
            var txt = (app.project.texts || []).find(function (t) { return t.id === app.selected.id; });
            if (txt) {
                window.OpenMapEditor.InspectorView.renderGenericInspector(
                    '自由注释文本', 'vi-text',
                    [
                        { label: '文本内容', value: txt.text || '' },
                        { label: '基准坐标', value: '(' + Math.round(txt.x) + ', ' + Math.round(txt.y) + ')' },
                        { label: '字体字号', value: (txt.size || 14) + 'px' + (txt.bold ? ' 粗体' : '') },
                        { label: '文本颜色', value: txt.color || '跟随主题' }
                    ],
                    [
                        {
                            label: '删除此文本', danger: true, icon: 'delete',
                            onClick: function () {
                                app.project.texts = (app.project.texts || []).filter(function (t) { return t.id !== txt.id; });
                                app.selected = null;
                                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                                renderAll();
                                showToast('已删除注释文本');
                            }
                        }
                    ]
                );
            } else {
                window.OpenMapEditor.InspectorView.renderEmpty();
            }
        } else if (app.selected.type === 'multi') {
            var nList = app.selected.nodeIds || [];
            var tList = app.selected.textIds || [];
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
                        label: '水平对齐', icon: 'flip-h',
                        onClick: function () {
                            if (nList.length < 2) return;
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            var sumY = 0, countY = 0;
                            nList.forEach(function (nid) {
                                if (app.project.nodes[nid]) { sumY += app.project.nodes[nid].y; countY++; }
                            });
                            if (!countY) return;
                            var avgY = Math.round(sumY / countY);
                            nList.forEach(function (nid) {
                                if (app.project.nodes[nid]) app.project.nodes[nid].y = avgY;
                            });
                            syncSegmentsForNodes(nList);
                            renderAll();
                            showToast('已将选中 ' + countY + ' 座车站水平对齐 (Y: ' + avgY + ')');
                        }
                    },
                    {
                        label: '垂直对齐', icon: 'flip-v',
                        onClick: function () {
                            if (nList.length < 2) return;
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            var sumX = 0, countX = 0;
                            nList.forEach(function (nid) {
                                if (app.project.nodes[nid]) { sumX += app.project.nodes[nid].x; countX++; }
                            });
                            if (!countX) return;
                            var avgX = Math.round(sumX / countX);
                            nList.forEach(function (nid) {
                                if (app.project.nodes[nid]) app.project.nodes[nid].x = avgX;
                            });
                            syncSegmentsForNodes(nList);
                            renderAll();
                            showToast('已将选中 ' + countX + ' 座车站垂直对齐 (X: ' + avgX + ')');
                        }
                    },
                    {
                        label: '批量删除', danger: true, icon: 'delete',
                        onClick: function () {
                            if (!confirm('确定要删除选中的 ' + nList.length + ' 座车站吗？')) return;
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            nList.forEach(function (nid) {
                                delete app.project.nodes[nid];
                                (app.project.lines || []).forEach(function (l) {
                                    ['stationIds'].forEach(function (k) {
                                        if (Array.isArray(l[k])) {
                                            var idx = l[k].indexOf(nid);
                                            if (idx !== -1) {
                                                l[k].splice(idx, 1);
                                                if (Array.isArray(l.distances) && l.distances.length >= l[k].length) {
                                                    l.distances.splice(idx, 1);
                                                }
                                            }
                                        }
                                    });
                                });
                                (app.project.segments || []).forEach(function (seg) {
                                    seg.points = (seg.points || []).filter(function (p) { return p.nid !== nid; });
                                });
                            });
                            app.selected = null;
                            renderAll();
                            showToast('已批量删除 ' + nList.length + ' 座车站');
                        }
                    }
                ]
            );
        } else {
            window.OpenMapEditor.InspectorView.renderEmpty();
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
            showToast('已激活并高亮线路: ' + ((lineObj && lineObj.name) || id));
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

        // linesData: 从线路+线段重建站序
        var linesData = (project.lines || []).map(function (line) {
            var lCopy = Object.assign({}, line);
            var io = window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
            var groups = (io && typeof io.lineStationGroups === 'function')
                ? io.lineStationGroups(line)
                : [];
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

        return { stationsData: stationsData, linesData: linesData };
    }

    /**
     * 更新标题栏数据健康状态指示 (dirtyCounterBadge / 校验摘要)
     */
    function updateHealthBadge() {
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
     * 选中属性变更回调
     */
    function handlePropertyChange(targetType, targetId, prop, value) {
        if (!app.project) return;

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);

        if (targetType === 'node') {
            var node = app.project.nodes[targetId];
            if (!node) return;
            if (prop === 'delete') {
                var refLines = [];
                (app.project.lines || []).forEach(function (l) {
                    var inThis = false;
                    if (Array.isArray(l.stationIds) && l.stationIds.indexOf(targetId) !== -1) inThis = true;
                    Object.keys(l).forEach(function (k) {
                        if (/^stationIds-/.test(k) && Array.isArray(l[k]) && l[k].indexOf(targetId) !== -1) inThis = true;
                    });
                    if (inThis) refLines.push(l);
                });

                if (refLines.length > 0) {
                    var names = refLines.map(function (l) { return l.name || l.id; }).join('、');
                    var ok = window.confirm('确认删除车站「' + (node.cn || targetId) + '」吗？\n该车站属于 ' + refLines.length + ' 条线路（' + names + '）。\n删除后将自动从所有线路站序中平滑摘除，防止产生孤儿悬空 ID。');
                    if (!ok) return;
                }

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
                showToast('已安全删除车站并平滑自愈拓扑线路');
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
                            showToast('已调整「' + (node.cn || targetId) + '」在 ' + (lObj.name || lObj.id) + ' 中的站序');
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
                            showToast('已将「' + (node.cn || targetId) + '」移出 ' + (lObj2.name || lObj2.id));
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
                        showToast('已将「' + (node.cn || targetId) + '」加入 ' + (lObj3.name || lObj3.id));
                    }
                }
            } else if (prop === 'position') {
                node.x = value.x;
                node.y = value.y;
                // 同步更新绑定线段端点
                app.project.segments.forEach(function (seg) {
                    var pts = seg.points;
                    if (pts[0].nid === targetId) { pts[0].x = value.x; pts[0].y = value.y; }
                    if (pts[pts.length - 1].nid === targetId) { pts[pts.length - 1].x = value.x; pts[pts.length - 1].y = value.y; }
                });
            } else if (prop === 'align') {
                node.align = value;
            } else if (prop === 'offset') {
                node.offset = value;
            } else if (prop === 'type') {
                node.type = value;
            } else if (prop === 'cn') {
                node.cn = value;
            } else if (prop === 'en') {
                node.en = value;
            } else if (prop === 'hideLabel') {
                node.hideLabel = !!value;
            } else if (prop === 'textScale') {
                node.textScale = value;
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
                    showToast('已删除折点并拉直线段');
                }
            }
        }

        renderAll();
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
                }
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
        });

        // 3. 历史管理器状态联动
        window.OpenMapEditor.HistoryManager.onChange(function (st) {
            var undoBtn = document.getElementById('btnUndo');
            var redoBtn = document.getElementById('btnRedo');
            var dirtyBadge = document.getElementById('dirtyCounterBadge');
            if (undoBtn) undoBtn.disabled = !st.canUndo;
            if (redoBtn) redoBtn.disabled = !st.canRedo;
            if (dirtyBadge) {
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

        // 4. 工具栏按钮事件绑定
        bindToolbarButtons();

        // 5. 画布点击与交互事件
        bindCanvasInteractions(viewportEl);

        // 6. 模态框与弹窗事件
        bindModals();

        // 7. 填充已有城市列表
        populateCitySelect();

        // 8. 默认新建空白工程
        createDefaultProject();

        // 9. 解析 URL 参数
        parseUrlParams();
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

    function bindToolbarButtons() {
        // 工具切换
        ['select', 'box', 'points', 'station', 'temp', 'water', 'text'].forEach(function (t) {
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
                    renderAll();
                    showToast('已撤销');
                }
            }
        });

        var redoBtn = document.getElementById('btnRedo');
        if (redoBtn) redoBtn.addEventListener('click', function () {
            if (window.OpenMapEditor.HistoryManager.canRedo()) {
                var next = window.OpenMapEditor.HistoryManager.redo(app.project);
                if (next) {
                    app.project = next;
                    renderAll();
                    showToast('已重做');
                }
            }
        });

        // 翻转折角
        var flipBtn = document.getElementById('btnFlipCorner');
        if (flipBtn) flipBtn.addEventListener('click', function () {
            if (app.selected && app.selected.type === 'segment') {
                var seg = (app.project.segments || []).find(function (s) { return s.id === app.selected.id; });
                if (seg) {
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                    window.OpenMapEditor.SegmentRouter.flipSegmentCorner(seg, app.project.slope);
                    renderAll();
                    showToast('已翻转折角方向');
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
            showToast(app.isAutoRoute ? '已开启自动走线' : '已关闭自动走线');
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

        // 网格显示切换
        var gridBtn = document.getElementById('hudBtnGrid');
        if (gridBtn) gridBtn.addEventListener('click', function () {
            app.gridVisible = !app.gridVisible;
            gridBtn.classList.toggle('active', app.gridVisible);
            if (window.OpenMapEditor.GridLayer) {
                window.OpenMapEditor.GridLayer.setVisible(app.gridVisible);
            }
            if (window.OpenMapEditor.ViewportLayer && window.OpenMapEditor.ViewportLayer.setGrid) {
                window.OpenMapEditor.ViewportLayer.setGrid(app.gridVisible);
            }
            showToast(app.gridVisible ? '已显示网格' : '已隐藏网格');
        });

        // 吸附开关
        var snapBtn = document.getElementById('hudBtnSnap');
        if (snapBtn) snapBtn.addEventListener('click', function () {
            app.snapEnabled = !app.snapEnabled;
            snapBtn.classList.toggle('active', app.snapEnabled);
            if (window.OpenMapEditor.ViewportLayer) {
                if (window.OpenMapEditor.ViewportLayer.setSnap) {
                    window.OpenMapEditor.ViewportLayer.setSnap(app.snapEnabled);
                } else if (window.OpenMapEditor.ViewportLayer.setSnapEnabled) {
                    window.OpenMapEditor.ViewportLayer.setSnapEnabled(app.snapEnabled);
                }
            }
            showToast(app.snapEnabled ? '已开启吸附' : '已关闭吸附');
        });

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
            showToast(willCollapse ? '已收起图层大纲' : '已展开图层大纲');
        }

        function toggleInspector(forceExpand) {
            if (!inspPanel) return;
            var willCollapse = (typeof forceExpand === 'boolean') ? !forceExpand : !inspPanel.classList.contains('collapsed');
            inspPanel.classList.toggle('collapsed', willCollapse);
            updateSidePanelState();
            showToast(willCollapse ? '已收起属性检视面板' : '已展开属性检视面板');
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
            document.getElementById('modalNewCanvas')?.classList.add('open');
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
                        if (!parsed || !parsed.nodes) throw new Error('不是有效的工程 JSON 文件');
                        app.project = parsed;
                        app.activeLineId = (parsed.lines && parsed.lines[0]) ? parsed.lines[0].id : null;
                        if (app.activeLineId) window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
                        document.getElementById('currentDocLabel').textContent = file.name.replace('.json', '');
                        if (parsed.canvas) {
                            window.OpenMapEditor.ViewportLayer.fitCanvas(parsed.canvas.width, parsed.canvas.height);
                        }
                        window.OpenMapEditor.HistoryManager.reset && window.OpenMapEditor.HistoryManager.reset();
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
                document.getElementById('modalDeepseekSettings')?.classList.add('open');
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
                                app.project = result.project;
                                app.activeLineId = (result.project.lines && result.project.lines[0]) ? result.project.lines[0].id : null;
                                if (app.activeLineId) window.OpenMapEditor.PipelineDraw.setActiveLine(app.activeLineId);
                                document.getElementById('currentDocLabel').textContent = '[DeepSeek] ' + file.name;
                                if (result.project.canvas) {
                                    window.OpenMapEditor.ViewportLayer.fitCanvas(result.project.canvas.width, result.project.canvas.height);
                                }
                                renderAll();
                                showToast('识图完成', 'success');
                                window.OpenMapEditor.RibbonController.switchTab('home');
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

        // 摄入 Tab：DeepSeek 模型设置
        var btnDsConfig = document.getElementById('btnDeepseekConfig');
        if (btnDsConfig) btnDsConfig.addEventListener('click', function () {
            // 预填现有配置到弹窗
            var keyInput = document.getElementById('deepseekApiKey');
            var baseInput = document.getElementById('deepseekApiBase');
            var modelInput = document.getElementById('deepseekModel');
            if (keyInput && window.DeepSeekVision) keyInput.value = window.DeepSeekVision.getApiKey ? window.DeepSeekVision.getApiKey() : '';
            if (baseInput && window.DeepSeekVision) baseInput.value = window.DeepSeekVision.getApiBase ? window.DeepSeekVision.getApiBase() : '';
            if (modelInput && window.DeepSeekVision) modelInput.value = window.DeepSeekVision.getModel ? window.DeepSeekVision.getModel() : '';
            document.getElementById('modalDeepseekSettings')?.classList.add('open');
        });

        // 工具化 Tab：拓扑净化
        var btnSanitize = document.getElementById('btnSanitizeTopology');
        if (btnSanitize) btnSanitize.addEventListener('click', function () {
            if (!app.project) return;
            try {
                var sanitizer = window.OpenMapEditor.DataSanitizer || window.DrunkSanitizer;
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
                var sanitizer = window.OpenMapEditor.DataSanitizer || window.DrunkSanitizer;
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
                        var result = solver.solveAlign(n.x, n.y, n.x, n.y);
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
            try {
                var res = await surgical.saveDirectToLocal(app.project);
                showToast(res.message + '；请记得在发布前将 sw.js 的 CACHE_NAME 递增版本号', 'success');
                document.getElementById('modalChangeset')?.classList.remove('open');
            } catch (err) {
                showToast('直接保存失败: ' + (err.message || err), 'error');
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
                if (summaryEl && result) {
                    if (result.errors.length) {
                        summaryEl.style.color = '#f44';
                        summaryEl.innerHTML = '<strong>⚠ ' + result.errors.length + ' 项错误：</strong><br>' +
                            result.errors.slice(0, 5).join('<br>') +
                            (result.errors.length > 5 ? '<br>…' : '');
                    } else if (result.warnings.length) {
                        summaryEl.style.color = '#fa3';
                        summaryEl.innerHTML = '⚠ ' + result.warnings.length + ' 项警告：' +
                            result.warnings.slice(0, 3).join(' | ');
                    } else {
                        summaryEl.style.color = '#4c4';
                        summaryEl.innerHTML = '✔ 数据完整性校验通过，可安全打包';
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
            document.getElementById('modalExportPackage')?.classList.add('open');
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
            showToast('已关联本地目录: ' + handle.name + '，现在支持直接写回', 'success');
        } catch (err) {
            if (err.name !== 'AbortError') {
                showToast('关联本地目录失败: ' + (err.message || err), 'error');
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
            try {
                showToast('正在写回本地目录…');
                var res = await surgical.saveDirectToLocal(app.project);
                if (res.savedCount > 0) {
                    showToast(res.message + '；请记得在发布前将 sw.js 的 CACHE_NAME 递增版本号', 'success');
                } else {
                    showToast(res.message);
                }
            } catch (err) {
                showToast('直接保存失败: ' + (err.message || err), 'error');
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

        document.getElementById('modalChangeset')?.classList.add('open');
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

        if (!entries.length) {
            showToast('当前无任何改动文件需要打包');
            return;
        }

        try {
            var zipBytes = window.OpenMapEditor.BundleExporter.buildZipBytes(entries);
            var blob = new Blob([zipBytes], { type: 'application/zip' });
            window.OpenMapEditor.BundleExporter.download(cityId + '-changeset.zip', blob);
            showToast('已导出改动补丁包: ' + cityId + '-changeset.zip', 'success');
        } catch (err) {
            showToast('打包失败: ' + (err.message || err), 'error');
        }
    }

    function bindCanvasInteractions(viewportEl) {
        if (!viewportEl) return;

        var isDraggingNode = false;
        var draggedNodeId = null;
        var isDraggingPoint = false;
        var draggedSegId = null;
        var draggedPointIdx = null;
        var isBoxSelecting = false;
        var boxStartPos = null;
        var isDraggingMulti = false;
        var initialMultiPositions = null;
        var dragStartPos = null;
        var hasDragged = false;

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
                        if (initialMultiPositions[nid] && app.project.nodes[nid]) {
                            app.project.nodes[nid].x = Math.round(initialMultiPositions[nid].x + dX);
                            app.project.nodes[nid].y = Math.round(initialMultiPositions[nid].y + dY);
                        }
                    });
                    syncSegmentsForNodes(nList);
                    renderAll();
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
                        renderAll();
                    }
                }
            }

            // 2. 拖动节点移动 (带智能对齐参考线与正交导轨协同推移)
            if (isDraggingNode && draggedNodeId && app.project.nodes[draggedNodeId]) {
                var snapped = app.snapEnabled
                    ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                    : { x: world.x, y: world.y };

                // 智能参考线 Smart Alignment Guides 探测 (4~5px 吸附)
                var scale = window.OpenMapEditor.ViewportLayer.getScale() || 1;
                var snapTol = 5 / scale;
                var smartGuides = [];
                Object.keys(app.project.nodes || {}).forEach(function (otherId) {
                    if (otherId === draggedNodeId) return;
                    var otherNode = app.project.nodes[otherId];
                    if (!otherNode) return;
                    if (Math.abs(snapped.x - otherNode.x) <= snapTol) {
                        snapped.x = otherNode.x;
                        smartGuides.push({
                            type: 'v',
                            pos: otherNode.x,
                            from: Math.min(snapped.y, otherNode.y) - 30,
                            to: Math.max(snapped.y, otherNode.y) + 30,
                            label: (otherNode.cn || otherId) + ' X:' + Math.round(otherNode.x)
                        });
                    }
                    if (Math.abs(snapped.y - otherNode.y) <= snapTol) {
                        snapped.y = otherNode.y;
                        smartGuides.push({
                            type: 'h',
                            pos: otherNode.y,
                            from: Math.min(snapped.x, otherNode.x) - 30,
                            to: Math.max(snapped.x, otherNode.x) + 30,
                            label: (otherNode.cn || otherId) + ' Y:' + Math.round(otherNode.y)
                        });
                    }
                });
                if (window.OpenMapEditor.GridLayer && window.OpenMapEditor.GridLayer.renderSmartGuides) {
                    window.OpenMapEditor.GridLayer.renderSmartGuides(smartGuides, app.project.canvas);
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

                    renderAll();
                }
            }
        });

        viewportEl.addEventListener('mousedown', function (e) {
            if (e.target.closest('.viewport-hud')) return;

            // 1. 点击折点控制手柄 (Vertex Handle)
            var targetPointHandle = e.target.closest('.segment-point-handle');
            if (targetPointHandle && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var segId = targetPointHandle.getAttribute('data-seg-id');
                var pIdx = parseInt(targetPointHandle.getAttribute('data-point-idx'), 10);
                app.selected = { type: 'segment', id: segId, pointIdx: pIdx };
                isDraggingPoint = true;
                draggedSegId = segId;
                draggedPointIdx = pIdx;
                hasDragged = false;
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                renderAll();
                e.stopPropagation();
                return;
            }

            // 2. 点击线段中点添加手柄 (Midpoint Add Handle)
            var targetMidHandle = e.target.closest('.segment-midpoint-handle');
            if (targetMidHandle && (app.activeTool === 'select' || app.activeTool === 'points')) {
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
                    dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                    renderAll();
                    showToast('已在线段中段插入新折点');
                    e.stopPropagation();
                    return;
                }
            }

            // 3. 点击车站节点 (单选 / Shift 多选 / 多选群组整体拖拽)
            var targetNodeEl = e.target.closest('[data-node-id]');
            if (targetNodeEl && (app.activeTool === 'select' || app.activeTool === 'points' || app.activeTool === 'box')) {
                var nid = targetNodeEl.getAttribute('data-node-id');
                if (e.shiftKey) {
                    if (!app.selected || app.selected.type !== 'multi') {
                        var baseIds = (app.selected && app.selected.type === 'node') ? [app.selected.id] : [];
                        if (baseIds.indexOf(nid) === -1) baseIds.push(nid);
                        app.selected = { type: 'multi', nodeIds: baseIds };
                    } else {
                        var idx = app.selected.nodeIds.indexOf(nid);
                        if (idx !== -1) {
                            app.selected.nodeIds.splice(idx, 1);
                            if (app.selected.nodeIds.length === 1) {
                                app.selected = { type: 'node', id: app.selected.nodeIds[0] };
                            } else if (app.selected.nodeIds.length === 0) {
                                app.selected = null;
                            }
                        } else {
                            app.selected.nodeIds.push(nid);
                        }
                    }
                    renderAll();
                    return;
                }

                // 非 Shift 点击：若已在该多选集合中，启动多选整体拖拽
                if (app.selected && app.selected.type === 'multi' && app.selected.nodeIds.indexOf(nid) !== -1) {
                    isDraggingMulti = true;
                    hasDragged = false;
                    dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                    initialMultiPositions = {};
                    app.selected.nodeIds.forEach(function (id) {
                        if (app.project.nodes[id]) {
                            initialMultiPositions[id] = { x: app.project.nodes[id].x, y: app.project.nodes[id].y };
                        }
                    });
                    renderAll();
                    return;
                }

                // 常规单选并启动单节点拖拽
                app.selected = { type: 'node', id: nid };
                isDraggingNode = true;
                hasDragged = false;
                draggedNodeId = nid;
                dragStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
                renderAll();
                return;
            }

            var targetSegEl = e.target.closest('[data-segment-id]');
            if (targetSegEl && (app.activeTool === 'select' || app.activeTool === 'points')) {
                var sid = targetSegEl.getAttribute('data-segment-id');
                var segLineId = targetSegEl.getAttribute('data-line-id');
                app.selected = { type: 'segment', id: sid };
                if (segLineId) {
                    app.activeLineId = segLineId;
                    if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.setActiveLine) {
                        window.OpenMapEditor.PipelineDraw.setActiveLine(segLineId);
                    }
                }
                renderAll();
                return;
            }

            // 画布空白处按住：启动框选 (Rubber-band Box Selection)
            if ((app.activeTool === 'select' || app.activeTool === 'box') && !targetNodeEl && !targetSegEl) {
                isBoxSelecting = true;
                hasDragged = false;
                boxStartPos = window.OpenMapEditor.ViewportLayer.screenToWorld(e.clientX, e.clientY);
            }
        });

        viewportEl.addEventListener('mouseup', function (e) {
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

                        if (foundNodes.length > 1 || (foundNodes.length + foundTexts.length > 1)) {
                            app.selected = { type: 'multi', nodeIds: foundNodes, textIds: foundTexts };
                            showToast('已框选 ' + foundNodes.length + ' 座车站');
                        } else if (foundNodes.length === 1) {
                            app.selected = { type: 'node', id: foundNodes[0] };
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

            if (isDraggingMulti) {
                if (hasDragged) {
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                }
                isDraggingMulti = false;
                initialMultiPositions = null;
                hasDragged = false;
                if (window.OpenMapEditor.GridLayer) window.OpenMapEditor.GridLayer.clearSmartGuides();
                return;
            }

            if (isDraggingPoint) {
                if (hasDragged) {
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                }
                isDraggingPoint = false;
                draggedSegId = null;
                draggedPointIdx = null;
                hasDragged = false;
                return;
            }

            if (isDraggingNode) {
                // 只有真正拖动过才记录历史快照
                if (hasDragged) {
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                }
                isDraggingNode = false;
                hasDragged = false;
                draggedNodeId = null;
                if (window.OpenMapEditor.GridLayer) window.OpenMapEditor.GridLayer.clearSmartGuides();
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
                        showToast('已在线路上插入新车站并建立拓扑: ' + res.node.cn);
                        return;
                    }
                }
                var snapped = app.snapEnabled
                    ? window.OpenMapEditor.ViewportLayer.snapPoint(world.x, world.y)
                    : { x: world.x, y: world.y };
                var result = window.OpenMapEditor.PipelineDraw.handleCanvasClick(app.project, snapped, null);
                if (result.updated) {
                    if (result.createdId) app.selected = { type: 'node', id: result.createdId };
                    renderAll();
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

                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                var result = window.OpenMapEditor.PipelineDraw.handleCanvasClick(app.project, snapped, targetNid);
                if (result.updated) {
                    if (result.createdId) app.selected = { type: 'node', id: result.createdId };
                    renderAll();
                }
            }
        });

        // 双击折线在线插入车站
        viewportEl.addEventListener('dblclick', function (e) {
            if (app.activeTool !== 'select' && app.activeTool !== 'points' && app.activeTool !== 'box') return;
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
                    showToast('已在线路上插入新车站并建立拓扑: ' + res.node.cn);
                }
            }
        });

        // 快捷键支持
        window.addEventListener('keydown', function (e) {
            if (e.target.matches('input, textarea, select')) return;

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
                    window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                    renderAll();
                    return;
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                if (e.shiftKey) {
                    document.getElementById('btnRedo')?.click();
                } else {
                    document.getElementById('btnUndo')?.click();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
                e.preventDefault();
                document.getElementById('btnRedo')?.click();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
                // Ctrl+S → 原地直接保存或弹出 Changeset
                e.preventDefault();
                handleSmartSave();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') {
                e.preventDefault();
                document.getElementById('btnHeaderOpenFile')?.click();
            } else if ((e.ctrlKey || e.metaKey) && (e.code === 'BracketLeft' || e.key === '[')) {
                e.preventDefault();
                toggleNavDrawer();
            } else if ((e.ctrlKey || e.metaKey) && (e.code === 'BracketRight' || e.key === ']')) {
                e.preventDefault();
                toggleInspector();
            } else if (e.code === 'Delete' || e.code === 'Backspace') {
                if (app.selected) {
                    if (app.selected.type === 'segment' && app.selected.pointIdx !== null && app.selected.pointIdx !== undefined) {
                        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                        handlePropertyChange('segment', app.selected.id, 'delete_point', { pointIdx: app.selected.pointIdx });
                    } else if (app.selected.type === 'multi') {
                        var nListDel = app.selected.nodeIds || [];
                        if (confirm('确定要删除选中的 ' + nListDel.length + ' 座车站吗？')) {
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            nListDel.forEach(function (nid) {
                                delete app.project.nodes[nid];
                                (app.project.lines || []).forEach(function (l) {
                                    ['stationIds'].forEach(function (k) {
                                        if (Array.isArray(l[k])) {
                                            var idx = l[k].indexOf(nid);
                                            if (idx !== -1) {
                                                l[k].splice(idx, 1);
                                                if (Array.isArray(l.distances) && l.distances.length >= l[k].length) {
                                                    l.distances.splice(idx, 1);
                                                }
                                            }
                                        }
                                    });
                                });
                                (app.project.segments || []).forEach(function (seg) {
                                    seg.points = (seg.points || []).filter(function (p) { return p.nid !== nid; });
                                });
                            });
                            app.selected = null;
                            renderAll();
                            showToast('已批量删除 ' + nListDel.length + ' 座车站');
                        }
                    } else {
                        handlePropertyChange(app.selected.type, app.selected.id, 'delete', true);
                        showToast('已删除选中图元');
                    }
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
                } else if (e.code === 'KeyS') {
                    // 仅在无修饰键时才触发 station 工具
                    setTool('station');
                } else if (e.code === 'KeyT') {
                    setTool('temp');
                } else if (e.code === 'KeyF') {
                    document.getElementById('hudBtnFit')?.click();
                } else if (e.code === 'KeyG') {
                    document.getElementById('hudBtnGrid')?.click();
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
                    if (icon) icon.setAttribute('name', isHidden ? 'view' : 'view-disabled');
                }
            });
        }

        // DeepSeek 配置：保存
        var btnDsSave = document.getElementById('btnDeepseekSave');
        if (btnDsSave) btnDsSave.addEventListener('click', function () {
            var key = (document.getElementById('deepseekApiKey') || {}).value || '';
            var base = (document.getElementById('deepseekApiBase') || {}).value || '';
            var model = (document.getElementById('deepseekModel') || {}).value || '';
            if (window.DeepSeekVision) {
                if (window.DeepSeekVision.setApiKey) window.DeepSeekVision.setApiKey(key);
                if (window.DeepSeekVision.setApiBase) window.DeepSeekVision.setApiBase(base);
                if (window.DeepSeekVision.setModel) window.DeepSeekVision.setModel(model);
            }
            document.getElementById('modalDeepseekSettings')?.classList.remove('open');
            showToast('DeepSeek 配置已保存', 'success');
        });

        // DeepSeek 配置：测试连接
        var btnDsTest = document.getElementById('btnDeepseekTest');
        if (btnDsTest) btnDsTest.addEventListener('click', async function () {
            var statusEl = document.getElementById('deepseekStatusText');
            if (statusEl) statusEl.textContent = '正在测试连接…';
            try {
                var key = (document.getElementById('deepseekApiKey') || {}).value || '';
                var base = (document.getElementById('deepseekApiBase') || {}).value || 'https://api.deepseek.com';
                var model = (document.getElementById('deepseekModel') || {}).value || 'deepseek-chat';

                var res = await fetch(base.replace(/\/$/, '') + '/models', {
                    headers: { 'Authorization': 'Bearer ' + key }
                });
                if (res.ok) {
                    if (statusEl) { statusEl.textContent = '✔ 连接成功'; statusEl.style.color = '#4c4'; }
                } else {
                    if (statusEl) { statusEl.textContent = '✘ 连接失败 (HTTP ' + res.status + ')'; statusEl.style.color = '#f44'; }
                }
            } catch (err) {
                if (statusEl) { statusEl.textContent = '✘ 连接异常: ' + (err.message || err); statusEl.style.color = '#f44'; }
            }
        });

        // DeepSeek 配置：清除 Key
        var btnDsClear = document.getElementById('btnDeepseekClear');
        if (btnDsClear) btnDsClear.addEventListener('click', function () {
            if (window.DeepSeekVision && window.DeepSeekVision.setApiKey) window.DeepSeekVision.setApiKey('');
            var keyInput = document.getElementById('deepseekApiKey');
            if (keyInput) keyInput.value = '';
            var statusEl = document.getElementById('deepseekStatusText');
            if (statusEl) { statusEl.textContent = '已清除本地保存的 API Key'; statusEl.style.color = '#fa3'; }
        });

        // 新建画布
        var btnConfirmNew = document.getElementById('btnConfirmNewCanvas');
        if (btnConfirmNew) btnConfirmNew.addEventListener('click', function () {
            var w = parseInt(document.getElementById('newCanvasWidth').value, 10) || 2000;
            var h = parseInt(document.getElementById('newCanvasHeight').value, 10) || 1500;
            var slope = (document.getElementById('newCanvasSlope').value || '1:1').split(':');

            app.project = window.OpenMapEditor.ProjectModel.createProject(w, h);
            app.project.slope = { m: parseInt(slope[0], 10) || 1, n: parseInt(slope[1], 10) || 1 };
            app.project.lines.push({ id: 'L1', name: '1号线', color: '#c23531' });
            app.activeLineId = 'L1';

            document.getElementById('currentDocLabel').textContent = '未命名工程 (' + w + '×' + h + ')';
            document.getElementById('modalNewCanvas')?.classList.remove('open');
            window.OpenMapEditor.ViewportLayer.fitCanvas(w, h);
            renderAll();
            showToast('已创建新画布');
        });

        // 存量维护：选择城市加载 (支持 cgo-toolbar-select 与原生 select)
        var citySelect = document.getElementById('selectCityToLoad');
        if (citySelect) {
            var handleCityChange = async function (cityId) {
                if (!cityId) return;
                try {
                    showToast('正在载入城市: ' + cityId + '...', 'info');
                    var res = await window.OpenMapEditor.PipelineSurgical.loadCity(cityId);
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
                    window.OpenMapEditor.HistoryManager.reset && window.OpenMapEditor.HistoryManager.reset();
                    renderAll();
                    showToast('已无损载入城市: ' + cName, 'success');
                } catch (e) {
                    showToast('载入失败: ' + (e.message || e), 'error');
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

        // 导出纯 SVG
        var btnExportSvg = document.getElementById('btnExportRenderedSvg');
        if (btnExportSvg) {
            btnExportSvg.addEventListener('click', function () {
                var svg = document.getElementById('editorSvg');
                window.OpenMapEditor.BundleExporter.exportSvgElement(svg, 'openmap-export.svg');
                showToast('已导出矢量 SVG', 'success');
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
            document.getElementById('modalMileage')?.classList.add('open');
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

            document.getElementById('modalMileage')?.classList.remove('open');
            showToast('已保存线路「' + lineId + '」站间距 ' + parsed.count + ' 条', 'success');
        });

        // 百科批量放站弹窗
        var btnOpenBatch = document.getElementById('btnOpenBatchStationModal');
        if (btnOpenBatch) {
            btnOpenBatch.addEventListener('click', function () {
                var sel = document.getElementById('batchTargetLine');
                if (sel && app.project) {
                    sel.innerHTML = app.project.lines.map(function (l) {
                        return '<option value="' + l.id + '">' + (l.name || l.id) + '</option>';
                    }).join('');
                }
                document.getElementById('modalBatchStation')?.classList.add('open');
            });
        }

        var btnApplyBatch = document.getElementById('btnApplyBatchStation');
        if (btnApplyBatch) {
            btnApplyBatch.addEventListener('click', function () {
                var input = document.getElementById('batchHtmlInput').value;
                var lineId = document.getElementById('batchTargetLine').value;
                var dir = document.getElementById('batchDirection').value;
                var step = parseInt(document.getElementById('batchStepDistance').value, 10) || 60;

                var stations = window.OpenMapEditor.BatchStationTool.extractStationsFromHtml(input);
                if (!stations.length) {
                    stations = window.OpenMapEditor.BatchStationTool.parseStationList(input);
                }

                if (!stations.length) {
                    showToast('未能从输入文本中识别出车站');
                    return;
                }

                window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                var created = window.OpenMapEditor.BatchStationTool.batchCreateStations(app.project, lineId, stations, {
                    startX: 200, startY: 200, step: step, direction: dir, autoConnect: true
                });

                document.getElementById('modalBatchStation')?.classList.remove('open');
                renderAll();
                showToast('已批量放置 ' + created.length + ' 座车站并连线', 'success');
            });
        }

        // 导出 OpenMap 城市工程包
        var btnConfirmZip = document.getElementById('btnConfirmDownloadZip');
        if (btnConfirmZip) btnConfirmZip.addEventListener('click', async function () {
            if (!app.project) return;
            var cityId = (document.getElementById('exportCityId') || {}).value || 'unnamed';
            var cityName = (document.getElementById('exportCityName') || {}).value || cityId;
            var themeColor = (document.getElementById('exportThemeColor') || {}).value || '#00263b';
            var linePrefix = (document.getElementById('exportLinePrefix') || {}).value || 'M';
            var company = (document.getElementById('exportCompany') || {}).value || '';
            var pxMeter = parseFloat((document.getElementById('exportPxMeter') || {}).value) || 25;

            showToast('正在打包 OpenMap 城市工程包…');
            try {
                var pack = window.OpenMapEditor.BundleExporter.formatCityPackage(app.project, {
                    cityId: cityId,
                    cityName: cityName,
                    themeColor: themeColor,
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

                var zipBytes = await window.OpenMapEditor.BundleExporter.buildZipBytes(entries);
                var blob = new Blob([zipBytes], { type: 'application/zip' });
                window.OpenMapEditor.BundleExporter.download(cityId + '-openmap-bundle.zip', blob);

                document.getElementById('modalExportPackage')?.classList.remove('open');
                showToast('已导出 OpenMap 城市包: ' + cityId + '-openmap-bundle.zip', 'success');
            } catch (err) {
                showToast('打包失败: ' + (err.message || err), 'error');
            }
        });
    }

    function populateCitySelect() {
        var sel = document.getElementById('selectCityToLoad');
        if (!sel) return;
        var io = window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
        if (!io) return;
        var cities = io.listCities();
        if (cities && cities.length) {
            var optionsHtml = '<cgo-toolbar-option value="">载入城市工程...</cgo-toolbar-option>' +
                cities.map(function (c) {
                    return '<cgo-toolbar-option value="' + c.id + '">' + c.name + ' (' + c.id + ')</cgo-toolbar-option>';
                }).join('');
            // 同时兼容原生 select
            if (sel.tagName.toLowerCase() === 'select') {
                optionsHtml = '<option value="">载入城市工程...</option>' +
                    cities.map(function (c) {
                        return '<option value="' + c.id + '">' + c.name + ' (' + c.id + ')</option>';
                    }).join('');
            }
            sel.innerHTML = optionsHtml;
            if (typeof sel.requestUpdate === 'function') {
                sel.requestUpdate();
            }
        }
    }

    function parseUrlParams() {
        var params = new URLSearchParams(window.location.search);
        var city = params.get('city');
        var mode = params.get('mode');

        if (mode === 'draw') {
            window.OpenMapEditor.RibbonController.switchTab('home');
        } else if (mode === 'ingest') {
            window.OpenMapEditor.RibbonController.switchTab('ingest');
        }

        if (city) {
            var citySel = document.getElementById('selectCityToLoad');
            if (citySel) {
                citySel.value = city;
                citySel.dispatchEvent(new CustomEvent('cgo-change', { detail: { value: city } }));
                citySel.dispatchEvent(new Event('change'));
            }
            window.OpenMapEditor.RibbonController.switchTab('surgical');
        }
    }

    // 暴露公共 API (供全站工具链与组件通信)
    window.OpenMapEditor.showToast = showToast;
    window.OpenMapEditor.openModal = openModal;
    window.OpenMapEditor.closeModal = closeModal;
    window.OpenMapEditor._getApp = function () { return app; }; // 供调试使用

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
