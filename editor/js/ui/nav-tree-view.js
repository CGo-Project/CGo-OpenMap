/**
 * 开放地图编辑器 (OpenMap Editor) - 图层与拓扑大纲树状图控制器 (NavTreeView)
 * 采用文件资源管理器风格的树状结构 (File Explorer Tree / Accordion)
 * 支持逐级展开、关键词即时过滤、节点/线路/地标/水域/文本点击定位与双向高亮联动
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
    onDeleteLine: null
    };

    // 记录各分类分支的展开状态（默认线路展开，其他可按需展开）
    var expandedState = {
        lines: true,
        stations: false,
        virtuals: false,
        notopen: false,
        scattered: false,
        waters: false,
        texts: false
    };

    var currentSearchQuery = '';
    var lastProject = null;
    var lastSelected = null;
    var lastActiveLineId = null;

    function init(containerEl, opts) {
        dom.container = containerEl;
        if (!dom.container) return;
        if (opts && typeof opts.onDeleteLine === 'function') {
            callbacks.onDeleteLine = opts.onDeleteLine;
        }
        if (opts && typeof opts.onSelect === 'function') {
            callbacks.onSelect = opts.onSelect;
        }

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
            '<cgo-icon name="chevron-down" size="11"></cgo-icon>' +
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
     * @param {Object} [state] { selected, activeLineId }
     */
    function render(project, state) {
        lastProject = project;
        if (state) {
            if (state.selected !== undefined) lastSelected = state.selected;
            if (state.activeLineId !== undefined) lastActiveLineId = state.activeLineId;
        }
        renderTree();
    }

    function renderTree() {
        if (!dom.treeBody || !lastProject) return;
        var p = lastProject;
        var q = currentSearchQuery;

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

        // 1. 线路分支
        renderLinesBranch(lines, q);

        // 2. 车站节点分支
        renderStationsBranch(stationIds, nodes, lines, q);

        // 3. 虚拟换乘分支
        renderVirtualsBranch(virtuals, nodes, q);

        // 4. 在建规划走向分支
        renderNotOpenBranch(notOpens, q);

        // 5. 地点地标图标分支
        renderScatteredBranch(scattered, q);

        // 6. 水域与河流分支
        renderWatersBranch(waters, q);

        // 7. 自由注释文本分支
        renderTextsBranch(texts, q);

        // 同步当前选中态的高亮标记
        syncSelection(lastSelected, lastActiveLineId, false);
    }

    /**
     * 1. 线路列表分支
     */
    function renderLinesBranch(lines, query) {
        var filtered = lines.filter(function (l) {
            if (!query) return !0;
            return (l.name && l.name.toLowerCase().indexOf(query) !== -1) ||
                (l.id && l.id.toLowerCase().indexOf(query) !== -1);
        });

        var branch = createBranchContainer('lines', '线路列表', 'route', lines.length, filtered.length, query);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (lines.length ? '未找到匹配线路' : '暂无线路线网') + '</div>';
        } else {
            filtered.forEach(function (line) {
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

                item.innerHTML = swatch +
                    '<div class="tree-leaf-text">' + nameHtml + idSub + '</div>' +
                    countBadge +
                    '<button type="button" class="tree-leaf-del" data-del-line="' + escapeHtml(line.id) + '" ' +
                    'title="删除这条线路"><cgo-icon name="delete" size="12"></cgo-icon></button>';

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
     * 2. 车站节点分支
     */
    function renderStationsBranch(stationIds, nodes, lines, query) {
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

        var branch = createBranchContainer('stations', '车站节点', 'addone', stationIds.length, filtered.length, query);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (stationIds.length ? '未匹配到符合条件的车站' : '当前暂无车站') + '</div>';
        } else {
            // 搜索或展开时展示列表（限制最多渲染 300 条避免长列表卡顿，超出时提示）
            var maxRender = query ? 150 : 250;
            var toRender = filtered.slice(0, maxRender);

            toRender.forEach(function (sid) {
                var node = nodes[sid];
                var item = document.createElement('div');
                item.className = 'tree-leaf-item station-leaf';
                item.setAttribute('data-tree-type', 'node');
                item.setAttribute('data-node-id', sid);
                item.title = (node.cn || sid) + ' ' + (node.en || '') + '\n坐标: (' + Math.round(node.x) + ', ' + Math.round(node.y) + ')\n点击居中并展开属性检视';

                var isTsf = node.type === 'tsf' || node.type === 'tsfo';
                var iconType = isTsf ? 'transfer' : 'place';
                var iconHtml = '<cgo-icon name="' + (isTsf ? 'transfer' : 'addone') + '" size="11" style="color:var(--text-light);flex-shrink:0;"></cgo-icon>';

                var cnHtml = highlightText(node.cn || sid, query);
                var enSub = node.en ? '<span class="tree-leaf-sub">' + highlightText(node.en, query) + '</span>' : '';
                var typeBadge = isTsf ? '<span class="tree-leaf-badge" style="background:rgba(0,120,212,0.12);color:var(--office-primary);">换乘</span>' : '';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + cnHtml + enSub + '</div>' +
                    typeBadge;

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('node', sid, { node: node });
                    }
                });

                children.appendChild(item);
            });

            if (filtered.length > maxRender) {
                var moreHint = document.createElement('div');
                moreHint.className = 'tree-empty-hint';
                moreHint.textContent = '... 还有 ' + (filtered.length - maxRender) + ' 座车站，输入站名快速过滤';
                children.appendChild(moreHint);
            }
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 3. 虚拟换乘连线分支
     */
    function renderVirtualsBranch(virtuals, nodes, query) {
        var filtered = virtuals.filter(function (conn, idx) {
            if (!query) return !0;
            var sF = nodes[conn.from], sT = nodes[conn.to];
            var fName = sF ? (sF.cn || conn.from) : conn.from;
            var tName = sT ? (sT.cn || conn.to) : conn.to;
            return fName.toLowerCase().indexOf(query) !== -1 ||
                tName.toLowerCase().indexOf(query) !== -1 ||
                String(idx).indexOf(query) !== -1;
        });

        var branch = createBranchContainer('virtuals', '虚拟换乘连线', 'transfer', virtuals.length, filtered.length, query);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (virtuals.length ? '未找到匹配的连线' : '当前城市无出闸换乘连线') + '</div>';
        } else {
            filtered.forEach(function (conn, idx) {
                var sF = nodes[conn.from], sT = nodes[conn.to];
                var fName = sF ? (sF.cn || conn.from) : conn.from;
                var tName = sT ? (sT.cn || conn.to) : conn.to;

                var item = document.createElement('div');
                item.className = 'tree-leaf-item virtual-leaf';
                item.setAttribute('data-tree-type', 'virtual');
                item.setAttribute('data-virtual-idx', String(idx));
                item.title = fName + ' ⇄ ' + tName + (conn.free ? ' (免费出闸)' : ' (付费通道)');

                var iconHtml = '<cgo-icon name="transfer" size="11" style="color:var(--text-light);flex-shrink:0;"></cgo-icon>';
                var nameHtml = highlightText(fName, query) + ' ⇄ ' + highlightText(tName, query);
                var badge = conn.free
                    ? '<span class="tree-leaf-badge" style="background:#e6f4ea;color:#137333;">免费</span>'
                    : '<span class="tree-leaf-badge">付费</span>';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + nameHtml + '</div>' +
                    badge;

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('virtual', idx, { conn: conn, sFrom: sF, sTo: sT });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 4. 在建规划走向分支
     */
    function renderNotOpenBranch(notOpens, query) {
        var filtered = notOpens.filter(function (line, idx) {
            if (!query) return !0;
            var name = line.name || ('在建走向 ' + (idx + 1));
            return name.toLowerCase().indexOf(query) !== -1;
        });

        var branch = createBranchContainer('notopen', '在建规划走向', 'time', notOpens.length, filtered.length, query);
        if (!branch) return;

        var children = branch.querySelector('.tree-children');
        if (filtered.length === 0) {
            children.innerHTML = '<div class="tree-empty-hint">' + (notOpens.length ? '未匹配到在建走向' : '无在建规划走向') + '</div>';
        } else {
            filtered.forEach(function (itemData, idx) {
                var item = document.createElement('div');
                item.className = 'tree-leaf-item notopen-leaf';
                item.setAttribute('data-tree-type', 'notopen');
                item.setAttribute('data-notopen-idx', String(idx));

                var ptCount = (itemData.points || []).length;
                var label = itemData.name || ('规划段 #' + (idx + 1));
                item.title = label + ' (' + ptCount + ' 个控制点)';

                var iconHtml = '<cgo-icon name="time" size="11" style="color:var(--text-light);flex-shrink:0;"></cgo-icon>';
                var nameHtml = highlightText(label, query);
                var countBadge = '<span class="tree-leaf-badge">' + ptCount + ' 点</span>';

                item.innerHTML = iconHtml +
                    '<div class="tree-leaf-text">' + nameHtml + '</div>' +
                    countBadge;

                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (callbacks.onSelect) {
                        callbacks.onSelect('notopen', idx, { notOpenItem: itemData });
                    }
                });

                children.appendChild(item);
            });
        }

        dom.treeBody.appendChild(branch);
    }

    /**
     * 5. 地点地标与散点图标分支
     */
    function renderScatteredBranch(scattered, query) {
        var filtered = scattered.filter(function (sc, idx) {
            if (!query) return !0;
            var name = sc.id || sc.file || ('地标 ' + (idx + 1));
            return name.toLowerCase().indexOf(query) !== -1;
        });

        var branch = createBranchContainer('scattered', '地点图标与地标', 'tourist', scattered.length, filtered.length, query);
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
                item.title = title + ' 坐标: (' + sc.x + ', ' + sc.y + ')';

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
     * 6. 水域与河流分支
     */
    function renderWatersBranch(waters, query) {
        var filtered = waters.filter(function (w, idx) {
            if (!query) return !0;
            var name = w.name || w.id || ('水体 ' + (idx + 1));
            return name.toLowerCase().indexOf(query) !== -1;
        });

        var branch = createBranchContainer('waters', '水域与河流', 'map', waters.length, filtered.length, query);
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
                var ptCount = (w.points || []).length;

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
     * 7. 自由注释文本分支
     */
    function renderTextsBranch(texts, query) {
        var filtered = texts.filter(function (t, idx) {
            if (!query) return !0;
            return (t.text && t.text.toLowerCase().indexOf(query) !== -1);
        });

        var branch = createBranchContainer('texts', '自由注释文本', 'vi-text', texts.length, filtered.length, query);
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
     * 创建通用的百叶窗/树状分类容器 (Branch Container)
     */
    function createBranchContainer(key, title, iconName, totalCount, filteredCount, query) {
        var isExpanded = query ? (filteredCount > 0) : !!expandedState[key];

        var branch = document.createElement('div');
        branch.className = 'nav-tree-branch' + (isExpanded ? ' expanded' : '');
        branch.setAttribute('data-branch-key', key);

        var header = document.createElement('div');
        header.className = 'nav-tree-branch-header';
        header.title = '点击展开/折叠 ' + title;

        var chevron = '<span class="tree-chevron"><cgo-icon name="chevron-right" size="12"></cgo-icon></span>';
        var branchIcon = '<span class="nav-item-icon"><cgo-icon name="' + iconName + '" size="13"></cgo-icon></span>';
        var titleText = '<span class="tree-branch-title">' + branchIcon + '<span>' + title + '</span></span>';

        var badgeText = query
            ? (filteredCount + '/' + totalCount)
            : String(totalCount);
        var badge = '<span class="nav-item-badge">' + badgeText + '</span>';

        header.innerHTML = chevron + titleText + badge;

        header.addEventListener('click', function () {
            var exp = branch.classList.toggle('expanded');
            expandedState[key] = exp;
        });

        branch.appendChild(header);

        var children = document.createElement('div');
        children.className = 'tree-children';
        branch.appendChild(children);

        return branch;
    }

    /**
     * 外部联动：同步高亮选中的大纲树条目
     * @param {Object} selected { type: 'node'|'segment'|'water'|'text'|'virtual'|'notopen'|'scattered', id, idx }
     * @param {string} [activeLineId]
     * @param {boolean} [scrollIntoView=true]
     */
    function syncSelection(selected, activeLineId, scrollIntoView) {
        if (!dom.treeBody) return;
        lastSelected = selected;
        lastActiveLineId = activeLineId;

        // 移除所有旧高亮
        var oldActives = dom.treeBody.querySelectorAll('.tree-leaf-item.active');
        oldActives.forEach(function (el) { el.classList.remove('active'); });

        var targetSelector = null;
        var parentBranchKey = null;

        if (selected && selected.type) {
            if (selected.type === 'node') {
                targetSelector = '.station-leaf[data-node-id="' + selected.id + '"]';
                parentBranchKey = 'stations';
            } else if (selected.type === 'water') {
                targetSelector = '.water-leaf[data-water-id="' + selected.id + '"]';
                parentBranchKey = 'waters';
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
            }
        } else if (activeLineId) {
            targetSelector = '.line-leaf[data-line-id="' + activeLineId + '"]';
            parentBranchKey = 'lines';
        }

        if (targetSelector) {
            var targetEl = dom.treeBody.querySelector(targetSelector);
            if (targetEl) {
                targetEl.classList.add('active');

                // 自动展开其父分支
                if (parentBranchKey) {
                    var branch = dom.treeBody.querySelector('.nav-tree-branch[data-branch-key="' + parentBranchKey + '"]');
                    if (branch && !branch.classList.contains('expanded')) {
                        branch.classList.add('expanded');
                        expandedState[parentBranchKey] = true;
                    }
                }

                if (scrollIntoView !== false) {
                    try {
                        targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    } catch (_) { }
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

window.NavTreeView = window.OpenMapEditor.NavTreeView;
