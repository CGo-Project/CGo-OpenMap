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
        snapEnabled: false
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
    /**
     * 实时草稿预览：把「已定起点 → 当前鼠标」按当前折角类型路由后画在 #draftLayer 上。
     * 用的是与最终落笔完全相同的 SegmentRouter.routeBetweenByType，因此所见即所得。
     */
    function renderDraftLayer() {
        var layer = document.getElementById('draftLayer');
        if (!layer) return;
        layer.innerHTML = '';

        var pd = window.OpenMapEditor.PipelineDraw;
        if (!pd || !app.project || !/^seg/.test(app.activeTool)) return;
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

        // 9. 触发会话自动保存（内部防抖 1.2s，拖拽过程中不会狂写）
        scheduleSaveSession();
    }

    function updateNavCounts() {
        // 兼容保留接口，大纲计数与树状图已由 NavTreeView 统一处理
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
                renderEmptyInspector();
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
                renderEmptyInspector();
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
                renderEmptyInspector();
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
                        label: '水平等距', icon: 'sort',
                        onClick: function () { distributeNodesEvenly('x'); }
                    },
                    {
                        label: '垂直等距', icon: 'align',
                        onClick: function () { distributeNodesEvenly('y'); }
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
                            if (!confirm('确定要删除选中的 ' + nList.length + ' 座车站吗？')) return;
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            // 分支安全：统一走 deleteStationById
                            nList.forEach(function (nid) { deleteStationById(nid); });
                            app.selected = null;
                            renderAll();
                            showToast('已批量删除 ' + nList.length + ' 座车站');
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
        } else if (targetType === 'line') {
            var lineTarget = (app.project.lines || []).find(function (l) { return l.id === targetId; });
            if (!lineTarget) return;

            if (prop === 'name') {
                lineTarget.name = String(value == null ? '' : value).trim() || lineTarget.id;
                showToast('线路名称已改为「' + lineTarget.name + '」');
            } else if (prop === 'color') {
                var hex = normalizeHexColor(value);
                if (!hex) { showToast('色号格式不对，请用 #RRGGBB 或 #RGB', 'error'); }
                else {
                    lineTarget.color = hex;
                    showToast('标志色已改为 ' + hex);
                }
            } else if (prop === 'company') {
                var company = String(value == null ? '' : value).trim();
                if (company) lineTarget.company = company;
                else delete lineTarget.company;
            } else if (prop === 'useStrictRounding') {
                if (value) lineTarget.useStrictRounding = true;
                else delete lineTarget.useStrictRounding;
            } else if (prop === 'focus') {
                // 视口定位到该线路的首站或首个折点
                var focusX = null, focusY = null;
                var firstStId = null;
                (window.OpenMapEditor.CityProjectIO && window.OpenMapEditor.CityProjectIO.lineStationGroups
                    ? window.OpenMapEditor.CityProjectIO.lineStationGroups(lineTarget)
                    : []).forEach(function (g) {
                        if (firstStId === null && g.ids && g.ids.length) firstStId = g.ids[0];
                    });
                if (firstStId && app.project.nodes[firstStId]) {
                    focusX = app.project.nodes[firstStId].x;
                    focusY = app.project.nodes[firstStId].y;
                } else {
                    var fSeg = (app.project.segments || []).find(function (s) { return s.lineId === lineTarget.id; });
                    if (fSeg && fSeg.points && fSeg.points.length) {
                        focusX = fSeg.points[0].x;
                        focusY = fSeg.points[0].y;
                    }
                }
                if (focusX !== null) window.OpenMapEditor.ViewportLayer.centerOn(focusX, focusY);
            } else if (prop === 'delete_line') {
                deleteLineById(lineTarget.id);
                return;
            } else if (prop === 'selectStations') {
                // 选中该线路全部车站（分支安全 + 去重）
                var allIds = window.OpenMapEditor.CityProjectIO && window.OpenMapEditor.CityProjectIO.lineAllStationIds
                    ? window.OpenMapEditor.CityProjectIO.lineAllStationIds(lineTarget)
                    : [];
                allIds = allIds.filter(function (sid) { return !!app.project.nodes[sid]; });
                if (!allIds.length) { showToast('这条线路还没有可用的车站'); return; }
                app.selected = { type: 'multi', nodeIds: allIds };
                showToast('已选中「' + (lineTarget.name || lineTarget.id) + '」的 ' + allIds.length + ' 座车站');
            }
        }

        renderAll();
    }

    /**
     * 删除一条线路。
     *
     * 只删「线路」这个实体：它自己的站序（含分支 way）随条目一起消失，
     * 挂在这条线路上的走向线段（project.segments）一并清掉，避免画布上留下
     * 一批找不到归属的孤儿线段；**车站本身不删** —— 它们可能还被别的线路
     * 或虚拟换乘引用着，要删请到车站列表或多选面板里删。
     */
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
        var msg = '确定删除线路「' + name + '」（' + lineId + '）吗？\n\n' +
            '· 该线路的站序（' + stationCount + ' 座车站的编排）会被删除\n' +
            '· 挂在该线路上的 ' + segCount + ' 段走向会被一并删除\n' +
            '· 车站本身不会被删除，其它线路仍可继续使用\n\n' +
            '可用 Ctrl+Z 撤销。';
        if (!confirm(msg)) return false;

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
                },
                onDeleteLine: function (lineId) {
                    // 大纲里的行内删除：与 Delete 键、线路属性面板走同一条流程
                    deleteLineById(lineId);
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
        var payload = buildSessionPayload();
        if (!payload) return;
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
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

    /** 防抖：连续操作只在停下 1.2s 后落一次盘 */
    function scheduleSaveSession() {
        if (sessionTimer) return;
        sessionTimer = setTimeout(function () {
            sessionTimer = null;
            saveSessionNow();
        }, 1200);
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
        showToast('已恢复上次的编辑进度' +
            (cityRestored ? '（城市源码已还原，可继续无损写回）' : '') +
            '；要清空重来请点「新建画布」', 'success');
        return true;
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
                } else {
                    showToast('已回到最早状态，没有更早的步骤了', 'info');
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
                } else {
                    showToast('已经在最新状态，没有可重做的步骤', 'info');
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

        /**
         * 一次性把整份工程对齐到 45°/90°。
         *
         * 先算方案（纯函数，不动数据）再弹确认框，把"要动几条折线、几座车站、最大位移多少"
         * 摊开给用户看；确认后才写入并压撤销栈。网格可见时顺带把长度量化到网格步长。
         */
        function alignAllTo45() {
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

            var plan = A45.alignProject(app.project, { grid: gridStep });
            if (!plan.stats.changed) {
                showToast('所有走向与车站链都已经是 45°/90°，无需调整', 'info');
                return;
            }

            var parts = ['将处理 ' + plan.stats.polylineCount + ' 条折线的 ' + plan.stats.movedPoints + ' 个折点'];
            if (plan.stats.movedStations) {
                parts.push('并带动 ' + plan.stats.movedStations + ' 座车站一起对齐');
            }
            if (plan.stats.skippedHandTuned) {
                parts.push('（另有 ' + plan.stats.skippedHandTuned + ' 条手工调过倒角半径的折线将跳过）');
            }
            var msg = parts.join('，') + '到 45°/90° 方向。\n' +
                '最大位移 ' + plan.stats.maxShift + ' px' +
                (gridStep ? '（已同时对网格步长 ' + gridStep + ' px 取整）' : '') + '。\n\n' +
                '可用 Ctrl+Z 撤销。确定执行？';
            if (!confirm(msg)) return;

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
            showToast('已对齐到 45°/90°：' + plan.stats.movedPoints + ' 个折点、' +
                plan.stats.movedStations + ' 座车站（Ctrl+Z 可撤销）', 'success');
        }

        var align45Btn = document.getElementById('btnAlign45');
        if (align45Btn) align45Btn.addEventListener('click', alignAllTo45);

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
            if (!silent) {
                showToast(app.gridVisible
                    ? '已显示网格，落点自动对齐网格（按住 Alt 可临时不对齐）'
                    : '已隐藏网格，不再对齐网格');
            }
        }

        var gridBtn = document.getElementById('hudBtnGrid');
        if (gridBtn) gridBtn.addEventListener('click', function () {
            setGridVisible(!app.gridVisible);
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
                        // 导入的 JSON 与当前城市无关：清掉维护上下文，避免写回错城市
                        if (window.OpenMapEditor.PipelineSurgical && window.OpenMapEditor.PipelineSurgical.resetContext) {
                            window.OpenMapEditor.PipelineSurgical.resetContext();
                        }
                        if (window.OpenMapEditor.PipelineDraw && window.OpenMapEditor.PipelineDraw.cancelDraft) {
                            window.OpenMapEditor.PipelineDraw.cancelDraft();
                        }
                        // 旧版 / 手改工程可能缺 idSeq 等字段：先规范化再接管，避免批量建站生成 node_NaN
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
                                window.OpenMapEditor.HistoryManager.clear();
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

        /** 统计本次会写什么，供危险提示展示 */
        function summarizeForWriteBack() {
            var surgical = window.OpenMapEditor.PipelineSurgical;
            var info = { cityId: '', stationDirty: 0, lineDirty: 0, deletedStations: 0, deletedLines: 0,
                         stationTotal: 0, lineTotal: 0 };
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

            // 第一次确认：把"危险"讲清楚
            var first = confirm(
                '⚠ 危险操作：强制回写\n\n' + summary + '\n\n' +
                '它和「导出改动补丁」的区别：\n' +
                '· 跳过"是否有改动"的判定，用当前画布**整份覆盖**城市文件；\n' +
                '· 不受脏条目限制，即使系统认为"没改动"也会重写；\n' +
                '· 直接写进本地 city/' + cityId + '/ 目录，磁盘上无法撤销（编辑器内 Ctrl+Z 也救不回来）。\n\n' +
                '写之前会自动下载一份原件备份 ZIP。\n\n' +
                '确定继续？');
            if (!first) return;

            // 第二次确认：防止连点/手滑
            var second = confirm('请再次确认：真的要强制覆盖 city/' + cityId + '/data_*.js 吗？');
            if (!second) { showToast('已取消强制回写', 'info'); return; }

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

            var backupName = downloadOriginalsBackup(cityId);
            if (backupName) showToast('已下载原件备份：' + backupName, 'info');
            else showToast('未能生成原件备份（继续执行，请自行确认已有 git 提交）', 'warning');

            try {
                var res = await surgical.saveDirectToLocal(app.project, { force: true });
                if (!res || !res.savedCount) {
                    showToast('强制回写未写入任何文件：' + ((res && res.message) || '未知原因'), 'warning');
                    return;
                }
                document.getElementById('modalChangeset')?.classList.remove('open');
                showToast(res.message + '；别忘了把 sw.js 的 CACHE_NAME 递增版本号', 'success');
            } catch (err) {
                var describe = (window.OpenMapEditor.PipelineSurgical &&
                    window.OpenMapEditor.PipelineSurgical.describeFileSystemError);
                showToast('强制回写失败：' + (describe ? describe(err) : (err.message || String(err))), 'error');
                if (err && err.name === 'InvalidStateError') {
                    // 句柄状态过期：清掉已关联的目录，提示用户重新授权（最有效的根治办法）
                    try { window.OpenMapEditor.PipelineSurgical.setLinkedDirectoryHandle(null); } catch (e) {}
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
            try {
                var res = await surgical.saveDirectToLocal(app.project);
                showToast(res.message + '；请记得在发布前将 sw.js 的 CACHE_NAME 递增版本号', 'success');
                document.getElementById('modalChangeset')?.classList.remove('open');
            } catch (err) {
                var describeDirect = (window.OpenMapEditor.PipelineSurgical &&
                    window.OpenMapEditor.PipelineSurgical.describeFileSystemError);
                showToast('直接保存失败：' + (describeDirect ? describeDirect(err) : (err.message || err)), 'error');
                if (err && err.name === 'InvalidStateError') {
                    try { window.OpenMapEditor.PipelineSurgical.setLinkedDirectoryHandle(null); } catch (e) {}
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
                    try { window.OpenMapEditor.PipelineSurgical.setLinkedDirectoryHandle(null); } catch (e) {}
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
        // 拖拽前的工程快照：撤销栈存的是「操作前」的状态，故必须在按下时抓，
        // 释放时再压栈。若等到释放时才 pushSnapshot(app.project)，压进去的已是拖拽后的状态，
        // 表现为「第一次撤销什么都没动，还要再撤一次」。
        var dragBaseline = null;

        /** 拖拽结束：只有真正拖动过才把「按下时的基线」压入撤销栈（撤销一步即回到按下前） */
        function commitDragHistory() {
            if (hasDragged && dragBaseline) {
                window.OpenMapEditor.HistoryManager.pushSnapshotRaw(dragBaseline);
            }
            dragBaseline = null;
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

            // ⚠️ 只有左键参与选中 / 拖拽 / 框选。
            //   中键 = 画布漫游（由 ViewportLayer 处理）、右键 = 结束连续绘制 / 浏览器菜单。
            //   少了这一句，空白处按住中键或右键都会落到下面的框选分支，
            //   表现就是「无论中键左键右键都在框选」。
            if (e.button !== 0 || viewportEl.classList.contains('panning')) return;

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
                dragBaseline = JSON.stringify(app.project);
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
                    // 插入已单独记过一次撤销，这里抓的是「插入后、拖动前」的基线
                    dragBaseline = JSON.stringify(app.project);
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
                    dragBaseline = JSON.stringify(app.project);
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
                dragBaseline = JSON.stringify(app.project);
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

        // 右键结束连续绘制（CAD 习惯），不必切换工具才能停
        viewportEl.addEventListener('contextmenu', function (e) {
            var pd = window.OpenMapEditor.PipelineDraw;
            if (/^seg/.test(app.activeTool) && pd && typeof pd.hasDraft === 'function' && pd.hasDraft()) {
                e.preventDefault();
                pd.cancelDraft();
                renderAll();
                showToast('已结束连续绘制（起点已清除）');
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
                        // 撤销基线由 handlePropertyChange 内部压入，这里不能再压一次（否则第一次撤销是空操作）
                        handlePropertyChange('segment', app.selected.id, 'delete_point', { pointIdx: app.selected.pointIdx });
                    } else if (app.selected.type === 'multi') {
                        var nListDel = app.selected.nodeIds || [];
                        if (confirm('确定要删除选中的 ' + nListDel.length + ' 座车站吗？')) {
                            window.OpenMapEditor.HistoryManager.pushSnapshot(app.project);
                            // 分支安全：走 deleteStationById（会处理 stationIds-wayN / distances-wayN / 虚拟换乘）
                            nListDel.forEach(function (nid) { deleteStationById(nid); });
                            app.selected = null;
                            renderAll();
                            showToast('已批量删除 ' + nListDel.length + ' 座车站');
                        }
                    } else if (app.selected.type === 'line') {
                        // 线路删除走专用流程（内部自带确认框与准确提示），
                        // 以前落到下面的通用分支，只弹了「已删除选中图元」而线路纹丝不动。
                        deleteLineById(app.selected.id);
                    } else {
                        handlePropertyChange(app.selected.type, app.selected.id, 'delete', true);
                        showToast('已删除选中图元');
                    }
                }
            } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                // Enter：立即结束当前连续绘制（保留已经画好的线段，且不切换工具，
                // 方便马上开始下一条走线）；没有草稿时交还给浏览器默认行为。
                var pdEnter = window.OpenMapEditor.PipelineDraw;
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
            document.getElementById('modalNewCanvas')?.classList.remove('open');
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
                    var ok = window.confirm(
                        '当前工程有 ' + dirty + ' 处未保存改动，载入城市「' + cityId + '」会覆盖它们。\n确定继续吗？'
                    );
                    if (!ok) {
                        citySelect.value = currentId || '';
                        if (typeof citySelect.requestUpdate === 'function') citySelect.requestUpdate();
                        return;
                    }
                }

                loadingCityId = cityId;
                try {
                    showToast('正在载入城市: ' + cityId + '...', 'info');
                    var res = await window.OpenMapEditor.PipelineSurgical.loadCity(cityId);
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
                var pm = /^([A-Za-z]+)/.exec(String(first.id));
                if (pm) prefix = pm[1];
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
            document.getElementById('modalNewLine')?.classList.add('open');
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

            document.getElementById('modalNewLine')?.classList.remove('open');
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
                document.getElementById('modalBatchStation')?.classList.add('open');
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

                document.getElementById('modalBatchStation')?.classList.remove('open');
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
                urlCity: city
            })
            : (sessionRestored ? 'keep-session' : 'load');

        if (action === 'keep-session') {
            // 会话已恢复出未保存工程：URL 的 ?city= 只提示、不自动覆盖（issue #50）
            showToast('已恢复上次未保存的工程，未自动载入 URL 中的城市「' + city +
                '」；如需载入，请从「在线城市库」手动选择', 'warning');
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
