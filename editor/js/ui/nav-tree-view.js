/**
 * 开放地图编辑器 (OpenMap Editor) - 统一图层与拓扑大纲树状图控制器 (NavTreeView)
 * 将「图层管理」与「大纲树状图」深度合二为一：
 * 1. 结构统一：图层作为一级大纲分支 (轨道走向、车站图元、水系河流、自由文本、参考底图、辅助网格)；
 * 2. 状态控制：在图层分支行内直观提供「显示/隐藏 (Eye)」、「锁定/解锁 (Lock)」及要素统计；
 * 3. 拓扑下钻：展开图层直达各具体要素 (线路、站点、水体、文本、参考底图)；
 * 4. 排序操作：线路行内自带「上移 ▲ / 下移 ▼」箭头，直接控制图层渲染堆叠顺序；
 * 5. 全要素可选：点击任意图层或下属子要素，双向高亮定位画布，联动右侧属性检视面板。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.NavTreeView = (function () {
    'use strict';

    var dom = {
        container: null,
        searchInput: null,
        clearSearchBtn: null,
        treeBody: null
    };

    var callbacks = {
        onSelect: null,
        onDeleteLine: null,
        onToggleLayerVisibility: null,
        onToggleLayerLock: null,
        onReorderLine: null,
        onToggleGridSnap: null
    };

    // 记录各分类分支的展开状态（默认线路展开，其他可按需展开）
    var expandedState = {
        lines: true,
        stations: false,
        water: false,
        texts: false,
        ghost: false,
        grid: false,
        virtuals: false,
        notopen: false,
        scattered: false
    };

    var currentSearchQuery = '';
    var lastProject = null;
    var lastState = null;

    function init(containerEl, opts) {
        dom.container = containerEl;
        if (!dom.container) return;
        var o = opts || {};
        if (typeof o.onSelect === 'function') callbacks.onSelect = o.onSelect;
        if (typeof o.onDeleteLine === 'function') callbacks.onDeleteLine = o.onDeleteLine;
        if (typeof o.onToggleLayerVisibility === 'function') callbacks.onToggleLayerVisibility = o.onToggleLayerVisibility;
        if (typeof o.onToggleLayerLock === 'function') callbacks.onToggleLayerLock = o.onToggleLayerLock;
        if (typeof o.onReorderLine === 'function') callbacks.onReorderLine = o.onReorderLine;
        if (typeof o.onToggleGridSnap === 'function') callbacks.onToggleGridSnap = o.onToggleGridSnap;

        buildSkeleton();
        bindEvents();
    }

    /**
     * 构建大纲骨架（顶部即时过滤搜索框 + 树状主体容器）
     */
    function buildSkeleton() {
        dom.container.innerHTML = '';

        // 搜索工具栏
        var searchBar = document.createElement('div');
        searchBar.className = 'nav-tree-search-bar';
        searchBar.innerHTML =
            '<span class="tree-search-icon"><cgo-icon name="search" size="12"></cgo-icon></span>' +
            '<input type="text" id="navTreeSearchInput" placeholder="快速筛选大纲要素..." class="tree-search-input" spellcheck="false">' +
            '<button type="button" id="btnClearNavSearch" class="tree-search-clear" title="清空搜索">' +
            '<cgo-icon name="close" size="10"></cgo-icon>' +
            '</button>';
        dom.container.appendChild(searchBar);

        // 快捷折叠/展开工具条
        var quickActions = document.createElement('div');
        quickActions.className = 'nav-tree-quick-bar';
        quickActions.innerHTML =
            '<span class="tree-quick-stat" id="treeQuickSummary">要素加载中...</span>' +
            '<div class="tree-quick-btns">' +
            '<button type="button" class="tree-quick-btn" id="btnTreeExpandAll" title="全部展开">' +
            '<cgo-icon name="unfold" size="11"></cgo-icon>' +
            '</button>' +
            '<button type="button" class="tree-quick-btn" id="btnTreeCollapseAll" title="全部折叠">' +
            '<cgo-icon name="chevron-up" size="11"></cgo-icon>' +
            '</button>' +
            '</div>';
        dom.container.appendChild(quickActions);

        // 树状图渲染根容器
        var treeBody = document.createElement('div');
        treeBody.className = 'nav-tree-body';
        treeBody.id = 'navTreeBranches';
        dom.container.appendChild(treeBody);

        dom.searchInput = searchBar.querySelector('#navTreeSearchInput');
        dom.clearSearchBtn = searchBar.querySelector('#btnClearNavSearch');
        dom.treeBody = treeBody;
    }

    function bindEvents() {
        if (dom.searchInput) {
            dom.searchInput.addEventListener('input', function () {
                currentSearchQuery = (this.value || '').trim().toLowerCase();
                if (dom.clearSearchBtn) {
                    dom.clearSearchBtn.style.display = currentSearchQuery ? 'flex' : 'none';
                }
                renderTree();
            });
        }

        if (dom.clearSearchBtn) {
            dom.clearSearchBtn.addEventListener('click', function () {
                if (dom.searchInput) {
                    dom.searchInput.value = '';
                    currentSearchQuery = '';
                    this.style.display = 'none';
                    renderTree();
                }
            });
        }

        var btnExpandAll = dom.container.querySelector('#btnTreeExpandAll');
        if (btnExpandAll) {
            btnExpandAll.addEventListener('click', function () {
                Object.keys(expandedState).forEach(function (k) { expandedState[k] = true; });
                renderTree();
            });
        }

        var btnCollapseAll = dom.container.querySelector('#btnTreeCollapseAll');
        if (btnCollapseAll) {
            btnCollapseAll.addEventListener('click', function () {
                Object.keys(expandedState).forEach(function (k) { expandedState[k] = false; });
                renderTree();
            });
        }
    }

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function highlightText(text, query) {
        if (!query || !text) return escapeHtml(text);
        var s = String(text);
        var idx = s.toLowerCase().indexOf(query);
        if (idx === -1) return escapeHtml(s);
        return escapeHtml(s.slice(0, idx)) +
            '<mark class="tree-match">' + escapeHtml(s.slice(idx, idx + query.length)) + '</mark>' +
            escapeHtml(s.slice(idx + query.length));
    }

    /**
     * 主渲染入口
     * @param {Object} project
     * @param {Object} [state] { selected, activeLineId, layerState, snapEnabled }
     */
    function render(project, state) {
        lastProject = project;
        lastState = state || lastState || {};
        renderTree();
    }

    function renderTree() {
        if (!dom.treeBody || !lastProject) return;
        var p = lastProject;
        var q = currentSearchQuery;
        var st = lastState || {};
        var layerState = st.layerState || {};

        var nodes = p.nodes || {};
        var stationIds = Object.keys(nodes).filter(function (id) {
            return nodes[id] && nodes[id].type !== 'temp';
        });
        var lines = p.lines || [];
        var virtuals = p.virtualConnectors || [];
        var notOpens = p.notOpenLines || [];
        var scattered = p.scattered || [];
        var waters = p.waters || [];
        var texts = p.texts || [];

        // 更新快速统计
        var totalElements = lines.length + stationIds.length + virtuals.length + notOpens.length + scattered.length + waters.length + texts.length;
        var summaryEl = dom.container.querySelector('#treeQuickSummary');
        if (summaryEl) {
            summaryEl.textContent = '共 ' + lines.length + ' 条线 · ' + stationIds.length + ' 站 · ' + totalElements + ' 要素';
        }

        // 清空树列表并依次构造各大分类分支
        dom.treeBody.innerHTML = '';

        // 1. 轨道走向 (Lines Layer)
        renderLinesBranch(lines, q, layerState.lines);

        // 2. 车站图元 (Stations Layer)
        renderStationsBranch(stationIds, nodes, lines, q, layerState.stations);

        // 3. 水系河流 (Water Layer)
        renderWatersBranch(waters, q, layerState.water);

        // 4. 自由文本 (Texts Layer)
        renderTextsBranch(texts, q, layerState.texts);

        // 5. 参考底图 (Ghost Image Layer)
        renderGhostBranch(p, q, layerState.ghost);

        // 6. 辅助网格与画布 (Grid Layer)
        renderGridBranch(p, q, layerState.grid, st.snapEnabled);

        // 7. 在建规划走向 (Not Open)
        if (notOpens.length > 0 || q) {
            renderNotOpenBranch(notOpens, q);
        }

        // 8. 虚拟换乘走廊 (Virtual Transfers)
        if (virtuals.length > 0 || q) {
            renderVirtualsBranch(virtuals, nodes, q);
        }

        // 9. 地点地标散点 (Scattered)
        if (scattered.length > 0 || q) {
            renderScatteredBranch(scattered, q, layerState.scattered);
        }

        // 同步当前选中态的高亮标记
        syncSelection(st.selected, st.activeLineId, false);
    }

    /**
     * 1. 轨道走向分支 (含行内显隐、锁定、选择、上移/下移排序)
     */
    function renderLinesBranch(lines, query, layerConf) {
        var filtered = lines.filter(function (l) {
            if (!query) return !0;
            return (l.name && l.name.toLowerCase().indexOf(query) !== -1) ||
                (l.id && l.id.toLowerCase().indexOf(query) !== -1);
        });

        var branch = createBranchContainer('lines', '轨道走向', 'route', lines.length, filtered.length, query, layerConf);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (lines.length ? '未找到匹配线路' : '暂无线路线网') + '</div>';
        } else {
            filtered.forEach(function (line, idx) {
                var item = document.createElement('div');
                item.className = 'tree-leaf-item line-leaf';
                item.setAttribute('data-tree-type', 'line');
                item.setAttribute('data-line-id', line.id);
                item.title = line.name + ' (' + line.id + ')\n点击高亮并聚焦此线路走向';

                var swatch = '<span class="tree-line-swatch" style="background:' + (line.color || '#888') + '"></span>';
                var nameHtml = highlightText(line.name || line.id, query);
                var idSub = '<span class="tree-leaf-sub">' + escapeHtml(line.id) + '</span>';

                var stCount = Array.isArray(line.stationIds) ? line.stationIds.length : '';
                var countBadge = stCount ? '<span class="tree-leaf-badge">' + stCount + ' 站</span>' : '';

                var realIdx = lines.indexOf(line);
                if (realIdx === -1) {
                    realIdx = lines.findIndex(function (l) { return l && l.id === line.id; });
                }
                var isFirst = (realIdx === 0);
                var isLast = (realIdx === lines.length - 1);

                item.innerHTML = swatch +
                    '<div class="tree-leaf-text">' + nameHtml + idSub + '</div>' +
                    countBadge +
                    '<div class="tree-leaf-actions" style="display:flex;align-items:center;gap:2px;">' +
                    '<button type="button" class="tree-leaf-btn btn-reorder-up" data-line-id="' + escapeHtml(line.id) + '" title="在图层渲染顺序中上移一位"' + (isFirst ? ' disabled style="opacity:0.25;cursor:not-allowed;"' : '') + '>' +
                    '<cgo-icon name="arrow-up" size="10"></cgo-icon></button>' +
                    '<button type="button" class="tree-leaf-btn btn-reorder-down" data-line-id="' + escapeHtml(line.id) + '" title="在图层渲染顺序中下移一位"' + (isLast ? ' disabled style="opacity:0.25;cursor:not-allowed;"' : '') + '>' +
                    '<cgo-icon name="arrow-down" size="10"></cgo-icon></button>' +
                    '<button type="button" class="tree-leaf-del" data-del-line="' + escapeHtml(line.id) + '" title="删除这条线路">' +
                    '<cgo-icon name="delete" size="11"></cgo-icon></button>' +
                    '</div>';

                // 绑定排序与删除事件
                var upBtn = item.querySelector('.btn-reorder-up');
                if (upBtn && !isFirst) {
                    upBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (callbacks.onReorderLine) callbacks.onReorderLine(line.id, -1);
                    });
                }

                var downBtn = item.querySelector('.btn-reorder-down');
                if (downBtn && !isLast) {
                    downBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (callbacks.onReorderLine) callbacks.onReorderLine(line.id, 1);
                    });
                }

                var delBtn = item.querySelector('[data-del-line]');
                if (delBtn) {
                    delBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (callbacks.onDeleteLine) callbacks.onDeleteLine(line.id, line);
                    });
                }

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('line', line.id, { line: line });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 2. 车站节点分支 (含行内显隐、锁定、选择)
     */
    function renderStationsBranch(stationIds, nodes, lines, query, layerConf) {
        var lineMap = {};
        lines.forEach(function (l) { lineMap[l.id] = l; });

        var filtered = stationIds.filter(function (id) {
            var n = nodes[id];
            if (!n) return !1;
            if (!query) return !0;
            return (n.cn && n.cn.toLowerCase().indexOf(query) !== -1) ||
                (n.en && n.en.toLowerCase().indexOf(query) !== -1) ||
                id.toLowerCase().indexOf(query) !== -1;
        });

        var branch = createBranchContainer('stations', '车站图元', 'location', stationIds.length, filtered.length, query, layerConf);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (stationIds.length ? '未匹配到符合条件的车站' : '当前暂无车站') + '</div>';
        } else {
            var maxRender = query ? 150 : 250;
            var toRender = filtered.slice(0, maxRender);

            toRender.forEach(function (id) {
                var n = nodes[id];
                var item = document.createElement('div');
                item.className = 'tree-leaf-item station-leaf';
                item.setAttribute('data-tree-type', 'station');
                item.setAttribute('data-node-id', id);

                var stType = n.type || 'dot';
                var iconType = (stType === 'tsf' || /^tsf_/.test(stType)) ? 'transfer' : 'dot';
                var iconHtml = '<span class="tree-station-icon-tag"><cgo-icon name="' + iconType + '" size="11"></cgo-icon></span>';

                var nameHtml = highlightText(n.cn || id, query);
                var subText = n.en ? (' · ' + escapeHtml(n.en)) : '';
                var idSub = '<span class="tree-leaf-sub">' + escapeHtml(id) + subText + '</span>';

                var codeBadge = n.code
                    ? '<span class="tree-leaf-badge" style="background:var(--theme-accent,#0284c7);color:#fff;font-weight:700;">' + escapeHtml(n.code) + '</span>'
                    : '';

                var typeBadge = (stType === 'tsf' || /^tsf_/.test(stType))
                    ? '<span class="tree-leaf-badge" style="background:#e0f2fe;color:#0284c7;">换乘</span>'
                    : '';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + nameHtml + idSub + '</div>' +
                    codeBadge +
                    typeBadge;

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('node', id, { node: n });
                    }
                });

                children.appendChild(item);
            });

            if (filtered.length > maxRender) {
                var more = document.createElement('div');
                more.className = 'tree-more-hint';
                more.textContent = '... 另有 ' + (filtered.length - maxRender) + ' 座车站，请使用上方搜索精确筛选';
                children.appendChild(more);
            }
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 3. 水域与河流分支
     */
    function renderWatersBranch(waters, query, layerConf) {
        var filtered = waters.filter(function (w, idx) {
            if (!query) return !0;
            var name = w.name || w.id || ('水体 ' + (idx + 1));
            return name.toLowerCase().indexOf(query) !== -1;
        });

        var branch = createBranchContainer('water', '水系河流', 'map', waters.length, filtered.length, query, layerConf);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (waters.length ? '未找到匹配水域' : '画布无水域图层') + '</div>';
        } else {
            filtered.forEach(function (w, idx) {
                var item = document.createElement('div');
                item.className = 'tree-leaf-item water-leaf';
                item.setAttribute('data-tree-type', 'water');
                item.setAttribute('data-water-id', w.id);

                var isRiver = (w.type === 'path' || w.type === 'river');
                var label = w.name || w.id || ((isRiver ? '河道 #' : '水面 #') + (idx + 1));

                var iconHtml = '<cgo-icon name="map" size="11" style="color:var(--text-light);flex-shrink:0;"></cgo-icon>';
                var nameHtml = highlightText(label, query);
                var typeBadge = isRiver
                    ? '<span class="tree-leaf-badge" style="background:#e8f0fe;color:#1a73e8;">河道</span>'
                    : '<span class="tree-leaf-badge" style="background:#e6f4ea;color:#137333;">水面</span>';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + nameHtml + '</div>' +
                    typeBadge;

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('water', w.id, { water: w });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 4. 自由注释文本分支
     */
    function renderTextsBranch(texts, query, layerConf) {
        var filtered = texts.filter(function (t, idx) {
            if (!query) return !0;
            return (t.text && t.text.toLowerCase().indexOf(query) !== -1);
        });

        var branch = createBranchContainer('texts', '自由文本', 'vi-text', texts.length, filtered.length, query, layerConf);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (texts.length ? '未找到匹配文本' : '画布无自由文本标注') + '</div>';
        } else {
            filtered.forEach(function (t, idx) {
                var item = document.createElement('div');
                item.className = 'tree-leaf-item text-leaf';
                item.setAttribute('data-tree-type', 'text');
                item.setAttribute('data-text-id', t.id);

                var iconHtml = '<cgo-icon name="vi-text" size="11" style="color:var(--text-light);flex-shrink:0;"></cgo-icon>';
                var nameHtml = highlightText(t.text || '空白文本', query);
                var posSub = '<span class="tree-leaf-sub">(' + Math.round(t.x) + ',' + Math.round(t.y) + ')</span>';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + nameHtml + posSub + '</div>';

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('text', t.id, { text: t });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 5. 参考底图分支 (Ghost Layer)
     */
    function renderGhostBranch(project, query, layerConf) {
        var hasGhost = !!(project && project.ghostImage);
        var branch = createBranchContainer('ghost', '参考底图', 'image', hasGhost ? 1 : 0, hasGhost ? 1 : 0, query, layerConf);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        var item = document.createElement('div');
        item.className = 'tree-leaf-item ghost-leaf';
        item.setAttribute('data-tree-type', 'ghost');

        if (hasGhost) {
            var g = project.ghostImage;
            var opacityText = Math.round((g.opacity !== undefined ? g.opacity : 0.4) * 100) + '%';
            item.innerHTML = '<cgo-icon name="image" size="11" style="color:var(--theme-accent);"></cgo-icon>' +
                '<div class="tree-leaf-text"><span>' + escapeHtml(g.name || '参考图纸底图') + '</span>' +
                '<span class="tree-leaf-sub">透明度 ' + opacityText + '</span></div>' +
                '<span class="tree-leaf-badge" style="background:#fef3c7;color:#d97706;">已校准</span>';
        } else {
            item.innerHTML = '<cgo-icon name="image" size="11" style="color:var(--text-light);"></cgo-icon>' +
                '<div class="tree-leaf-text" style="color:var(--text-light);"><span>点击载入/校准参考底图</span></div>' +
                '<span class="tree-leaf-badge">空</span>';
        }

        item.addEventListener('click', function (e) {
            e.stopPropagation();
            if (callbacks.onSelect) {
                callbacks.onSelect('ghost', 'ghost', {});
            }
        });

        children.appendChild(item);
        dom.treeBody.appendChild(branch);
    }

    /**
     * 6. 辅助网格与画布分支 (Grid Layer)
     */
    function renderGridBranch(project, query, layerConf, snapEnabled) {
        var snapText = snapEnabled ? '对齐开' : '对齐关';
        var branch = createBranchContainer('grid', '辅助网格与画布', 'view-grid', 1, 1, query, layerConf);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        var item = document.createElement('div');
        item.className = 'tree-leaf-item grid-leaf';
        item.setAttribute('data-tree-type', 'grid');

        var snapBadge = snapEnabled
            ? '<button type="button" class="tree-leaf-badge btn-toggle-snap" style="background:#e0f2fe;color:#0284c7;font-weight:600;border:none;cursor:pointer;">吸附开</button>'
            : '<button type="button" class="tree-leaf-badge btn-toggle-snap" style="background:var(--bg-subtle);color:var(--text-light);border:none;cursor:pointer;">吸附关</button>';

        var cWidth = (project && project.canvas) ? project.canvas.width : 2000;
        var cHeight = (project && project.canvas) ? project.canvas.height : 1500;

        item.innerHTML = '<cgo-icon name="view-grid" size="11" style="color:var(--theme-accent);"></cgo-icon>' +
            '<div class="tree-leaf-text"><span>画布尺寸 ' + cWidth + ' × ' + cHeight + '</span>' +
            '<span class="tree-leaf-sub">点击切换网格吸附</span></div>' +
            snapBadge;

        var snapBtn = item.querySelector('.btn-toggle-snap');
        if (snapBtn) {
            snapBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (callbacks.onToggleGridSnap) callbacks.onToggleGridSnap();
            });
        }

        item.addEventListener('click', function (e) {
            e.stopPropagation();
            if (callbacks.onSelect) {
                callbacks.onSelect('layer', 'grid', {});
            }
        });

        children.appendChild(item);
        dom.treeBody.appendChild(branch);
    }

    /**
     * 7. 虚拟换乘走廊分支
     */
    function renderVirtualsBranch(virtuals, nodes, query) {
        var filtered = virtuals.filter(function (conn) {
            if (!query) return !0;
            var f = nodes[conn.from], t = nodes[conn.to];
            var fName = f ? (f.cn || conn.from) : conn.from;
            var tName = t ? (t.cn || conn.to) : conn.to;
            return (fName.toLowerCase().indexOf(query) !== -1) ||
                (tName.toLowerCase().indexOf(query) !== -1);
        });

        var branch = createBranchContainer('virtuals', '虚拟换乘走廊', 'walk', virtuals.length, filtered.length, query);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (virtuals.length ? '未匹配到虚拟换乘' : '无出站虚拟换乘') + '</div>';
        } else {
            filtered.forEach(function (conn, idx) {
                var f = nodes[conn.from], t = nodes[conn.to];
                var fName = f ? (f.cn || conn.from) : conn.from;
                var tName = t ? (t.cn || conn.to) : conn.to;

                var item = document.createElement('div');
                item.className = 'tree-leaf-item virtual-leaf';
                item.setAttribute('data-tree-type', 'virtual');
                item.setAttribute('data-virtual-idx', String(idx));

                var iconHtml = '<cgo-icon name="walk" size="11" style="color:var(--text-light);flex-shrink:0;"></cgo-icon>';
                var labelHtml = highlightText(fName, query) + ' ⇄ ' + highlightText(tName, query);
                var subText = (conn.distance ? (conn.distance + 'm') : '') + (conn.time ? (' · ' + conn.time + '分') : '');
                var distSub = subText ? '<span class="tree-leaf-sub">' + escapeHtml(subText) + '</span>' : '';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + labelHtml + distSub + '</div>' +
                    '<span class="tree-leaf-badge">出站换乘</span>';

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('virtual', idx, { conn: conn, sFrom: f, sTo: t });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 8. 在建与规划走向分支
     */
    function renderNotOpenBranch(notOpens, query) {
        var filtered = notOpens.filter(function (line, idx) {
            if (!query) return !0;
            var name = line.name || line.id || ('规划走向 ' + (idx + 1));
            return name.toLowerCase().indexOf(query) !== -1;
        });

        var branch = createBranchContainer('notopen', '在建规划走向', 'design', notOpens.length, filtered.length, query);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (notOpens.length ? '未匹配到规划走向' : '无在建走向数据') + '</div>';
        } else {
            filtered.forEach(function (no, idx) {
                var item = document.createElement('div');
                item.className = 'tree-leaf-item notopen-leaf';
                item.setAttribute('data-tree-type', 'notopen');
                item.setAttribute('data-notopen-idx', String(idx));

                var label = no.name || no.id || ('在建走向 #' + (idx + 1));
                var swatch = '<span class="tree-line-swatch" style="background:#94a3b8;border:1px dashed #475569;"></span>';
                var nameHtml = highlightText(label, query);
                var ptCount = (no.points || []).length;
                var ptSub = '<span class="tree-leaf-sub">' + ptCount + ' 个折点</span>';

                item.innerHTML = swatch +
                    '<div class="tree-leaf-text">' + nameHtml + ptSub + '</div>' +
                    '<span class="tree-leaf-badge" style="background:#f1f5f9;color:#64748b;">虚线</span>';

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('notopen', idx, { notOpenItem: no });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 9. 地点地标图标分支
     */
    function renderScatteredBranch(scattered, query, layerConf) {
        var filtered = scattered.filter(function (sc, idx) {
            if (!query) return !0;
            var name = sc.id || sc.file || ('地标 ' + (idx + 1));
            return name.toLowerCase().indexOf(query) !== -1;
        });

        var branch = createBranchContainer('scattered', '地图装饰', 'tourist', scattered.length, filtered.length, query, layerConf);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (scattered.length ? '未匹配到地点图标' : '无地点地标散点') + '</div>';
        } else {
            filtered.forEach(function (sc, idx) {
                var item = document.createElement('div');
                item.className = 'tree-leaf-item scattered-leaf';
                item.setAttribute('data-tree-type', 'scattered');
                item.setAttribute('data-scattered-idx', String(idx));

                var title = sc.id || (sc.file ? sc.file.split('/').pop() : ('地标 #' + (idx + 1)));
                var iconHtml = '<cgo-icon name="tourist" size="11" style="color:var(--text-light);flex-shrink:0;"></cgo-icon>';
                var nameHtml = highlightText(title, query);
                var posSub = '<span class="tree-leaf-sub">(' + sc.x + ',' + sc.y + ')</span>';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + nameHtml + posSub + '</div>';

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('scattered', idx, { scattered: sc });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 创建通用的百叶窗/树状分类容器 (Branch Container)，整合图层显示/锁定状态
     */
    function createBranchContainer(key, title, iconName, totalCount, filteredCount, query, layerConf) {
        var isExpanded = query ? (filteredCount > 0) : !!expandedState[key];
        var isVisible = layerConf ? (layerConf.visible !== false) : true;
        var isLocked = layerConf ? !!layerConf.locked : false;

        var branch = document.createElement('div');
        branch.className = 'nav-tree-branch' + (isExpanded ? ' expanded' : '') +
            (!isVisible ? ' layer-hidden' : '') + (isLocked ? ' layer-locked' : '');
        branch.setAttribute('data-branch-key', key);

        var header = document.createElement('div');
        header.className = 'nav-tree-branch-header';
        header.setAttribute('data-branch-key', key);
        header.title = '展开/折叠 ' + title;

        var chevron = '<span class="tree-chevron"><cgo-icon name="chevron-right" size="12"></cgo-icon></span>';

        // 图层显隐与锁定动作按钮
        var actionBtns = '';
        if (layerConf) {
            // 图标库没有「闭眼」：隐藏态仍用 eye，由 .is-hidden 样式（划线 + 变淡）区分
            var eyeIcon = 'eye';
            var eyeTitle = isVisible ? '点击隐藏图层' : '点击显示图层';
            var eyeBtn = '<button type="button" class="tree-action-btn tree-btn-eye' + (!isVisible ? ' is-hidden' : '') + '" data-layer-key="' + key + '" title="' + eyeTitle + '">' +
                '<cgo-icon name="' + eyeIcon + '" size="12"></cgo-icon>' +
                '</button>';

            var lockIcon = isLocked ? 'lock' : 'unlock';
            var lockTitle = isLocked ? '点击解锁图层' : '点击锁定图层';
            var lockBtn = '<button type="button" class="tree-action-btn tree-btn-lock' + (isLocked ? ' active-lock' : '') + '" data-layer-key="' + key + '" title="' + lockTitle + '">' +
                '<cgo-icon name="' + lockIcon + '" size="12"></cgo-icon>' +
                '</button>';

            actionBtns = '<div class="tree-branch-actions">' + eyeBtn + lockBtn + '</div>';
        }

        var branchIcon = '<span class="nav-item-icon"><cgo-icon name="' + iconName + '" size="13"></cgo-icon></span>';
        var titleText = '<span class="tree-branch-title">' + branchIcon + '<span>' + title + '</span></span>';

        var badgeText = query
            ? (filteredCount + '/' + totalCount)
            : String(totalCount);
        var badge = '<span class="nav-item-badge">' + badgeText + '</span>';

        header.innerHTML = chevron + actionBtns + titleText + badge;

        // 绑定事件：
        // 1. 点击 Eye 按钮 -> 切换图层显隐
        var eyeBtnEl = header.querySelector('.tree-btn-eye');
        if (eyeBtnEl) {
            eyeBtnEl.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof callbacks.onToggleLayerVisibility === 'function') {
                    callbacks.onToggleLayerVisibility(key);
                }
            });
        }

        // 2. 点击 Lock 按钮 -> 切换图层锁定
        var lockBtnEl = header.querySelector('.tree-btn-lock');
        if (lockBtnEl) {
            lockBtnEl.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof callbacks.onToggleLayerLock === 'function') {
                    callbacks.onToggleLayerLock(key);
                }
            });
        }

        // 3. 点击 Header 头部 -> 展开/折叠，并选中该图层
        header.addEventListener('click', function (e) {
            if (e.target.closest('.tree-action-btn')) return;
            var exp = branch.classList.toggle('expanded');
            expandedState[key] = exp;
            if (typeof callbacks.onSelect === 'function') {
                callbacks.onSelect('layer', key, { layerKey: key });
            }
        });

        branch.appendChild(header);

        var children = document.createElement('div');
        children.className = 'tree-children';
        branch.appendChild(children);

        return branch;
    }

    /**
     * 外部联动：同步高亮选中的大纲树条目
     * @param {Object} selected { type: 'node'|'segment'|'water'|'text'|'virtual'|'notopen'|'scattered'|'line'|'layer', id, idx }
     * @param {string} [activeLineId]
     * @param {boolean} [scrollIntoView=true]
     */
    function syncSelection(selected, activeLineId, scrollIntoView) {
        if (!dom.treeBody) return;

        // 移除所有旧高亮
        var oldActives = dom.treeBody.querySelectorAll('.tree-leaf-item.active, .nav-tree-branch-header.active');
        oldActives.forEach(function (el) { el.classList.remove('active'); });

        var targetSelector = null;
        var parentBranchKey = null;

        if (selected && selected.type) {
            if (selected.type === 'node') {
                targetSelector = '.station-leaf[data-node-id="' + selected.id + '"]';
                parentBranchKey = 'stations';
            } else if (selected.type === 'water') {
                targetSelector = '.water-leaf[data-water-id="' + selected.id + '"]';
                parentBranchKey = 'water';
            } else if (selected.type === 'text') {
                targetSelector = '.text-leaf[data-text-id="' + selected.id + '"]';
                parentBranchKey = 'texts';
            } else if (selected.type === 'virtual') {
                targetSelector = '.virtual-leaf[data-virtual-idx="' + selected.idx + '"]';
                parentBranchKey = 'virtuals';
            } else if (selected.type === 'notopen') {
                targetSelector = '.notopen-leaf[data-notopen-idx="' + selected.idx + '"]';
                parentBranchKey = 'notopen';
            } else if (selected.type === 'scattered') {
                targetSelector = '.scattered-leaf[data-scattered-idx="' + selected.idx + '"]';
                parentBranchKey = 'scattered';
            } else if (selected.type === 'line') {
                targetSelector = '.line-leaf[data-line-id="' + selected.id + '"]';
                parentBranchKey = 'lines';
            } else if (selected.type === 'layer') {
                targetSelector = '.nav-tree-branch-header[data-branch-key="' + selected.id + '"]';
            } else if (selected.type === 'segment' && selected.id) {
                // 如果选中了线段，关联高亮其所属的线路
                if (lastProject && lastProject.segments) {
                    var sg = lastProject.segments.find(function (s) { return s.id === selected.id; });
                    if (sg && sg.lineId) {
                        targetSelector = '.line-leaf[data-line-id="' + sg.lineId + '"]';
                        parentBranchKey = 'lines';
                    }
                }
            }
        } else if (activeLineId) {
            targetSelector = '.line-leaf[data-line-id="' + activeLineId + '"]';
            parentBranchKey = 'lines';
        }

        if (!targetSelector) return;

        // 如果所属分类折叠中，且不是搜索状态，自动展开它以便用户看到选中项
        if (parentBranchKey && !expandedState[parentBranchKey] && !currentSearchQuery) {
            expandedState[parentBranchKey] = true;
            var branchEl = dom.treeBody.querySelector('.nav-tree-branch[data-branch-key="' + parentBranchKey + '"]');
            if (branchEl) branchEl.classList.add('expanded');
        }

        var targetEl = dom.treeBody.querySelector(targetSelector);
        if (targetEl) {
            targetEl.classList.add('active');
            if (scrollIntoView !== false) {
                try {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } catch (e) {
                    targetEl.scrollIntoView(false);
                }
            }
        }
    }

    return {
        init: init,
        render: render,
        syncSelection: syncSelection
    };
})();

// 全局别名兼容
window.NavTreeView = window.OpenMapEditor.NavTreeView;
