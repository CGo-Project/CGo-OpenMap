/**
 * ==============================================================================
 * CGo OpenMap - 线路图在线编辑器主逻辑 (city-editor/js/editor.js)
 * ==============================================================================
 * 纯原生 JavaScript + SVG 实现，零第三方依赖，遵循项目最高铁律：
 *   1. 不修改 core/ 通用引擎，编辑器逻辑完全独立于多城市核心引擎；
 *   2. 全部配色复用 css/cgo_clr.css 主题 CSS 变量，自动适配亮/暗主题与多端触控；
 *   3. 界面图标一律使用 <cgo-icon> 矢量组件，严禁 Emoji。
 *
 * 功能清单：
 *   - 画布与直角坐标系：新建任意尺寸画布，原点 O 位于画布左上角顶点，X 向右为正、Y 向下为正；
 *   - 添加元素控件组：车站节点 / 临时节点 / 135°折角线段 / 90°折角线段 / 轴平行直线 / 自由路径 / 水域；
 *   - 网格对齐：对齐网格开关 + 网格大小（5~100px），网格与坐标刻度可独立显隐；
 *   - 属性编辑：左键点击车站节点编辑中英文站名、站名字号、站编号，以及线路色与对齐方式；
 *   - 换乘站自动样式：车站节点被 ≥2 条线路连接时自动切换为换乘站样式，临时节点不受影响；
 *   - 工程管理：本地暂存、工程文件导入导出、城市代码导出、SVG 导出、撤销重做。
 * ==============================================================================
 */
(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var STORAGE_KEY = 'cgo-openmap-editor-project';
    var HISTORY_LIMIT = 60;

    /** 线路色板（自动新建线路时轮换取色） */
    var LINE_PALETTE = [
        '#E4002B', '#0057B8', '#009B77', '#F5A200', '#7B2D8E',
        '#00A0E9', '#D6006F', '#8B5E3C', '#5B6770', '#00B140'
    ];

    /** 水域默认配色（海水蓝） */
    var WATER_DEFAULT = { fill: '#8FC6E8', opacity: 0.55 };

    /** 线段类型元数据 */
    var SEG_META = {
        auto: { label: '自动选型' },
        seg135: { label: '135° 折角' },
        seg90: { label: '90° 折角' },
        segaxis: { label: '轴平行直线' },
        segfree: { label: '自由路径' }
    };

    /** 节点样式尺寸（世界坐标像素） */
    var NODE = {
        rOuter: 9,       // 车站节点外圆半径
        rInner: 6.6,     // 车站节点内圆半径（描边厚度 = rOuter - rInner）
        tsfOuter: 11.6,  // 换乘站外圈半径
        tsfMid: 8.6,     // 换乘站第二圈半径
        tsfOuterW: 3.0,  // 换乘站外圈描边宽度
        tsfMidW: 2.4,    // 换乘站第二圈描边宽度
        tempArm: 7.4     // 临时节点 × 的半臂长
    };

    /** 自动选型判定参数 */
    var AUTO = {
        axisTol: 1.5,    // 轴平行判定容差（像素）
        diagRatio: 2.4,  // 对角带判定：min/max 大于该倒数时视为可 135° 折角
        shortDiag: 26    // 45° 斜边短于该值时退化为 90° 折角
    };

    // ==========================================================================
    // 1. 数据状态
    // ==========================================================================

    /** 空工程数据结构 */
    function createProject(width, height) {
        return {
            version: 1,
            canvas: { width: width || 2000, height: height || 1500 },
            /** 节点：station（车站，圆形，描边线路色）/ temp（临时节点，黑色 ×） */
            nodes: {},
            /** 线段：{ id, lineId, type, points: [{ x, y, nid? }] } */
            segments: [],
            /** 水域：{ id, name, points, fill, opacity } */
            waters: [],
            /** 线路：{ id, name, color } */
            lines: [],
            /** 递增 ID 计数 */
            idSeq: 1
        };
    }

    var project = null;            // 当前工程（未创建画布时为 null）
    var activeLineId = null;       // 当前绘制线路
    var activeTool = 'select';     // select | station | temp | seg135 | seg90 | segaxis | segfree | water
    var autoRoute = true;          // 是否开启线段自动选型（路径编辑模式）
    var selection = null;          // { type: 'node'|'segment'|'water', id }；多选节点时指向其中一个节点
    var selectedNodeIds = [];      // 多选节点集合（Ctrl+A 全选 / Ctrl+C 复制 / Ctrl+V 粘贴 的目标）
    var clipboardNodes = null;     // 节点剪贴板（深拷贝的节点数据）
    var pasteCount = 0;            // 连续粘贴次数，用于逐次递增偏移
    var pointerWorld = null;       // 鼠标指针当前所在的世界坐标（用于 Ctrl+V 落点）
    var draft = null;              // 绘制中的草稿
    var spaceDown = false;
    var undoStack = [];
    var redoStack = [];
    var fileInput = null;

    /**
     * 坐标系（与 CGo OpenMap 数据层完全一致）
     *   原点 O 位于画布左上角顶点，X 轴正方向向右，Y 轴正方向向下，单位为像素。
     *   因此「世界坐标」即「画布用户坐标」，与导出数据零换算。
     *
     * 视口模型：
     *   view.k  —— 缩放倍率（1 = 1 像素对应屏幕 1 像素）
     *   view.cx —— 视口左边缘对应的画布 X
     *   view.cy —— 视口上边缘对应的画布 Y
     *
     * #editor-svg 的显示尺寸由脚本锁定为画布区域的实际像素尺寸（不设置 width/height
     * 属性，避免 SVG 使用 300×150 的固有尺寸撑开 flex 容器），因此 viewBox 与屏幕像素
     * 严格 1:1，坐标换算完全确定，不依赖任何隐式缩放。
     */
    var view = { k: 1, cx: 0, cy: 0 };
    var viewFitted = false;        // 当前工程是否已完成视口自适应
    var dragState = null;
    var pinchState = null;
    var sizeObserver = null;

    // ==========================================================================
    // 2. 通用工具函数
    // ==========================================================================

    function $(id) { return document.getElementById(id); }

    function deepClone(value) { return JSON.parse(JSON.stringify(value)); }

    function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }

    function round2(v) { return Math.round(v * 100) / 100; }

    function escapeHtml(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /** 主题判定：当前是否为亮色主题 */
    function isLightTheme() {
        var attr = document.documentElement.getAttribute('data-theme');
        if (attr === 'dark') return false;
        if (attr === 'light') return true;
        return !(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    var toastTimer = null;
    function toast(message) {
        var el = $('toast');
        if (!el) return;
        el.textContent = message;
        el.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
    }

    function nextId(prefix) {
        var pad = function (n) { return n < 10 ? '0' + n : String(n); };
        return prefix + pad(project.idSeq++);
    }

    // ==========================================================================
    // 3. 视图与坐标系统
    // ==========================================================================

    function svgEl() { return $('editor-svg'); }

    /** 画布舞台可用尺寸（布局尺寸，避免 getBoundingClientRect 的取整误差） */
    function stageSize() {
        var canvas = $('stage-canvas');
        var w = canvas ? canvas.clientWidth : 0;
        var h = canvas ? canvas.clientHeight : 0;
        if (!w || !h) {
            var rect = svgEl().getBoundingClientRect();
            w = rect.width;
            h = rect.height;
        }
        return { w: w || 1, h: h || 1 };
    }

    /** 画布用户坐标 → 世界坐标（原点左上角，X 向右、Y 向下，二者等价、零换算） */
    function userToWorld(ux, uy) { return { x: ux, y: uy }; }

    /** 世界坐标 → 画布用户坐标（同上） */
    function worldToUser(x, y) { return { x: x, y: y }; }

    /** 当前 viewBox：原点即画布左上角，左上角对齐，1:1 无隐式缩放 */
    function viewBoxRect() {
        var size = stageSize();
        var vw = size.w / view.k, vh = size.h / view.k;
        return { x: view.cx, y: view.cy, w: vw, h: vh };
    }

    /** 屏幕 1px 对应的世界坐标长度 */
    function screenPerWorld() { return 1 / (view.k || 1); }

    /** 世界坐标 → 客户端坐标 */
    function worldToClient(x, y) {
        var u = worldToUser(x, y);
        var vb = viewBoxRect();
        var rect = svgEl().getBoundingClientRect();
        return {
            x: rect.left + (u.x - vb.x) * view.k,
            y: rect.top + (u.y - vb.y) * view.k
        };
    }

    /** 客户端坐标 → 世界坐标（worldToClient 的逆变换） */
    function screenToWorld(cx, cy) {
        var vb = viewBoxRect();
        var rect = svgEl().getBoundingClientRect();
        var ux = vb.x + (cx - rect.left) / view.k;
        var uy = vb.y + (cy - rect.top) / view.k;
        return userToWorld(ux, uy);
    }

    /** 可见世界坐标范围（用于裁剪与网格绘制） */
    function visibleWorldBounds() {
        var w = project.canvas.width, h = project.canvas.height;
        var vb = viewBoxRect();
        var a = userToWorld(vb.x, vb.y);
        var b = userToWorld(vb.x + vb.w, vb.y + vb.h);
        var minX = Math.max(0, Math.min(a.x, b.x));
        var maxX = Math.min(w, Math.max(a.x, b.x));
        var minY = Math.max(0, Math.min(a.y, b.y));
        var maxY = Math.min(h, Math.max(a.y, b.y));
        if (maxX <= minX || maxY <= minY) return { minX: 0, maxX: w, minY: 0, maxY: h };
        return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
    }

    /** 网格尺寸（默认 5px 一格） */
    function gridSize() { return parseInt($('sel-grid').value, 10) || 5; }
    function snapEnabled() { return $('chk-snap').checked; }

    /** 按网格吸附坐标 */
    function snapPoint(x, y) {
        if (!snapEnabled()) return { x: round2(x), y: round2(y) };
        var g = gridSize();
        return { x: Math.round(x / g) * g, y: Math.round(y / g) * g };
    }

    function setViewBox() {
        var svg = svgEl();
        var vb = viewBoxRect();
        svg.setAttribute('viewBox', round2(vb.x) + ' ' + round2(vb.y) + ' ' + round2(vb.w) + ' ' + round2(vb.h));
    }

    /** 锁定 SVG 显示尺寸与画布区域一致（不设置 width/height 属性） */
    function syncSvgSize() {
        var svg = svgEl();
        if (!svg) return;
        var size = stageSize();
        svg.style.width = size.w + 'px';
        svg.style.height = size.h + 'px';
    }

    /**
     * 默认缩放：1 = 画布像素与屏幕像素 1:1（保证 5px 网格即真实的 5 像素）；
     * 仅当画布大于画布区域时才缩小以完整展示。
     */
    function fitScale() {
        var w = project.canvas.width, h = project.canvas.height;
        var size = stageSize();
        return clamp(Math.min(1, size.w / w, size.h / h), 0.02, 1);
    }

    /**
     * 视口范围限制（原点左上角，画布外保留一段同尺寸余量）：
     * 缩放到可见整块画布时固定停在原点 O；放大后允许平移到画布边界之外，
     * 便于查看「缩小画布尺寸后」落在画布范围之外的既有元素。
     */
    function clampView() {
        var w = project.canvas.width, h = project.canvas.height;
        var size = stageSize();
        var vw = size.w / view.k, vh = size.h / view.k;
        var maxX = Math.max(0, 2 * w - vw), maxY = Math.max(0, 2 * h - vh);
        view.cx = clamp(view.cx, 0, maxX);
        view.cy = clamp(view.cy, 0, maxY);
    }

    /** 复位视图：回到原点 O（左上角）并按需缩放以完整展示画布 */
    function resetView() {
        if (!project) return;
        syncSvgSize();
        view.k = fitScale();
        view.cx = 0;
        view.cy = 0;
        clampView();
        setViewBox();
        renderAll();
    }

    /** 画布区域尺寸变化：重新锁定 SVG 尺寸并刷新视图 */
    function handleStageResize() {
        if (!project) return;
        syncSvgSize();
        if (!viewFitted) {
            // 首次拿到有效布局尺寸时完成自适应
            resetView();
            viewFitted = true;
            return;
        }
        clampView();
        setViewBox();
        renderAll();
    }

    /** 新建画布 / 载入工程后，等待布局稳定再做一次自适应适配 */
    function scheduleFit() {
        viewFitted = false;
        if (!project) return;
        requestAnimationFrame(function () {
            if (!project) return;
            resetView();
            viewFitted = true;
        });
    }

    /** 以指定客户端坐标为中心缩放（保持光标下的世界坐标不动） */
    function zoomAt(cx, cy, factor) {
        if (!project) return;
        var nextK = clamp(view.k * factor, 0.02, 8);
        // 已完整展示画布时不再继续缩小，避免无意义的空白
        if (Math.abs(nextK - view.k) < 1e-9 || (factor < 1 && view.k <= fitScale() * 1.01)) return;
        var anchor = screenToWorld(cx, cy);
        var rect = svgEl().getBoundingClientRect();
        view.k = nextK;
        // 视口左上角 = 锚点世界坐标 - 光标在视口内的相对位置
        view.cx = anchor.x - (cx - rect.left) / view.k;
        view.cy = anchor.y - (cy - rect.top) / view.k;
        clampView();
        setViewBox();
        renderAll();
    }

    /** 将指定世界坐标居中显示 */
    function centerOn(x, y) {
        var size = stageSize();
        view.cx = x - size.w / (2 * view.k);
        view.cy = y - size.h / (2 * view.k);
        clampView();
        setViewBox();
        renderAll();
    }

    // ==========================================================================
    // 4. 撤销 / 重做
    // ==========================================================================

    /**
     * 记录一步撤销：入栈的是「操作前」的快照。
     * 注意不能与栈顶做去重：操作前后快照恰好相同的场景（如把已归属的线路再移除一次前的状态）
     * 若被跳过，会退化成把「操作后」的状态入栈，表现为撤销一次没有反应。
     */
    function pushHistory() {
        if (!project) return;
        undoStack.push(JSON.stringify(project));
        if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
        redoStack.length = 0;
        syncTopButtons();
    }

    /**
     * 包装一次「可撤销的修改」：先记录快照，再执行修改。
     * 相比在修改之后调用 pushHistory()，这样能保证撤销回到修改前的状态。
     */
    function withHistory(fn) {
        if (!project) return;
        pushHistory();
        fn();
    }

    function undo() {
        if (!project || !undoStack.length) { toast('没有可撤销的操作'); return; }
        redoStack.push(JSON.stringify(project));
        project = JSON.parse(undoStack.pop());
        afterStateRestore('已撤销');
    }

    function redo() {
        if (!project || !redoStack.length) { toast('没有可重做的操作'); return; }
        undoStack.push(JSON.stringify(project));
        project = JSON.parse(redoStack.pop());
        afterStateRestore('已重做');
    }

    function afterStateRestore(message) {
        draft = null;
        selectedNodeIds = selectedNodeIds.filter(function (id) { return !!project.nodes[id]; });
        if (selection) {
            var kind = selection.type;
            var exists = kind === 'node' ? project.nodes[selection.id]
                : (kind === 'segment' ? findSegment(selection.id) : findWater(selection.id));
            if (!exists) selection = null;
        }
        syncSelection(selection ? selection.id : null);
        syncLineSelect();
        renderAll();
        renderInspector();
        syncTopButtons();
        if (message) toast(message);
    }

    function syncTopButtons() {
        var u = $('btn-undo'), r = $('btn-redo');
        if (u) u.classList.toggle('is-disabled', !undoStack.length);
        if (r) r.classList.toggle('is-disabled', !redoStack.length);
    }

    // ==========================================================================
    // 5. 查询辅助
    // ==========================================================================

    function findSegment(id) {
        for (var i = 0; i < project.segments.length; i++) {
            if (project.segments[i].id === id) return project.segments[i];
        }
        return null;
    }

    function findWater(id) {
        for (var i = 0; i < project.waters.length; i++) {
            if (project.waters[i].id === id) return project.waters[i];
        }
        return null;
    }

    function findLine(id) {
        for (var i = 0; i < project.lines.length; i++) {
            if (project.lines[i].id === id) return project.lines[i];
        }
        return null;
    }

    /** 该节点参与的所有线段 */
    function nodeLinkedSegments(nodeId) {
        return project.segments.filter(function (seg) {
            return (seg.points || []).some(function (p) { return p.nid === nodeId; });
        });
    }

    /** 该节点连接的线路 ID 集合 */
    function nodeLineIds(nodeId) {
        var ids = [];
        nodeLinkedSegments(nodeId).forEach(function (seg) {
            if (seg.lineId && ids.indexOf(seg.lineId) === -1) ids.push(seg.lineId);
        });
        return ids;
    }

    /** 车站涉及的线路集合：实际连接到的线路 + 所属线路（并集，供换乘判定使用） */
    function nodeAllLineIds(nodeId) {
        var ids = nodeLineIds(nodeId);
        nodeLineList(project.nodes[nodeId]).forEach(function (id) {
            if (ids.indexOf(id) === -1) ids.push(id);
        });
        return ids;
    }

    /** 车站是否应显示为换乘站：连接或所属的线路达到 ≥2 条 */
    function isTransferNode(nodeId) {
        var node = project.nodes[nodeId];
        if (!node || node.type !== 'station') return false;
        return nodeAllLineIds(nodeId).length >= 2;
    }

    /**
     * 车站主色：优先取实际连接的线路色；尚未连线的孤立车站回退到「所属线路」的首条线路色，
     * 保证新放置的车站立即呈现线路色（符合「描边使用线路色」的要求）。
     */
    function nodeColor(nodeId) {
        var ids = nodeLineIds(nodeId);
        for (var i = 0; i < ids.length; i++) {
            var line = findLine(ids[i]);
            if (line && line.color) return line.color;
        }
        var node = project.nodes[nodeId];
        var primaryId = nodePrimaryLineId(node);
        if (primaryId) {
            var own = findLine(primaryId);
            if (own && own.color) return own.color;
        }
        // 尚未连线的新车站：暂用当前编辑线路的颜色，体现「描边使用线路色」
        var active = activeLineId ? findLine(activeLineId) : null;
        if (active && active.color) return active.color;
        return isLightTheme() ? '#00263b' : '#bdcbd2';
    }

    /** 换乘站次要色（第二条线路色） */
    function nodeSecondaryColor(nodeId) {
        var ids = nodeLineIds(nodeId);
        if (ids.length >= 2) {
            var line = findLine(ids[1]);
            if (line && line.color) return line.color;
        }
        // 未连线时用所属线路的第二条作为次要色
        if (ids.length < 2) {
            var own = nodeLineList(project.nodes[nodeId]);
            if (own.length >= 2) {
                var second = findLine(own[1]);
                if (second && second.color) return second.color;
            }
        }
        return nodeColor(nodeId);
    }

    // ---------------------------- 车站所属线路 ----------------------------

    /** 车站所属线路（车站自身的属性，不论是否已连线都存在） */
    function nodeLineList(node) {
        if (!node || !Array.isArray(node.lineIds)) return [];
        return node.lineIds.filter(function (id) { return !!findLine(id); });
    }

    /** 把车站加入某条线路（避免重复） */
    function addLineToNode(node, lineId) {
        if (!node || !lineId || !findLine(lineId)) return false;
        if (!Array.isArray(node.lineIds)) node.lineIds = [];
        if (node.lineIds.indexOf(lineId) >= 0) return false;
        node.lineIds.push(lineId);
        if (!node.lineId) node.lineId = lineId;   // 首条线路同时作为默认描边色
        return true;
    }

    /** 把车站从某条线路移除，并同步默认描边线路 */
    function removeLineFromNode(node, lineId) {
        if (!node || !Array.isArray(node.lineIds)) return false;
        var idx = node.lineIds.indexOf(lineId);
        if (idx < 0) return false;
        node.lineIds.splice(idx, 1);
        if (node.lineId === lineId) node.lineId = node.lineIds.length ? node.lineIds[0] : null;
        return true;
    }

    /** 车站主色（描边色）取所属线路中的首条 */
    function nodePrimaryLineId(node) {
        var ids = nodeLineList(node);
        if (ids.length) return ids[0];
        return node && node.lineId ? node.lineId : null;
    }

    /**
     * 线段改换线路后同步两端车站的「所属线路」：
     * 把不再被该线路线段连接的旧线路移出，并加入新线路。
     */
    function syncSegmentEndNodeLines(seg, oldLineId) {
        if (!seg || !seg.points || seg.points.length < 2) return;
        [seg.points[0], seg.points[seg.points.length - 1]].forEach(function (p) {
            if (!p || !p.nid) return;
            var node = project.nodes[p.nid];
            if (!node || node.type !== 'station') return;
            if (oldLineId && oldLineId !== seg.lineId) {
                var stillLinked = project.segments.some(function (s) {
                    return s !== seg && s.lineId === oldLineId &&
                        (s.points || []).some(function (q) { return q.nid === node.id; });
                });
                if (!stillLinked) removeLineFromNode(node, oldLineId);
            }
            addLineToNode(node, seg.lineId);
        });
    }

    // ==========================================================================
    // 6. 线路管理
    // ==========================================================================

    function createLine(name, color) {
        var line = {
            id: nextId('L'),
            name: name || ('线路' + (project.lines.length + 1)),
            color: color || LINE_PALETTE[project.lines.length % LINE_PALETTE.length]
        };
        project.lines.push(line);
        return line;
    }

    function ensureActiveLine() {
        if (activeLineId && findLine(activeLineId)) return findLine(activeLineId);
        if (project.lines.length) {
            activeLineId = project.lines[0].id;
            return findLine(activeLineId);
        }
        var line = createLine(null, null);
        activeLineId = line.id;
        return line;
    }

    // ==========================================================================
    // 7. 走线几何算法（自动选型核心）
    // ==========================================================================

    /**
     * 生成 90° 折角路径（轴平行 L 形走线）。
     * @param {string} firstAxis 先走哪个方向：'vertical'（先竖直）| 'horizontal'（先水平）
     */
    function buildRectPath(a, b, firstAxis) {
        if (Math.abs(a.x - b.x) <= AUTO.axisTol || Math.abs(a.y - b.y) <= AUTO.axisTol) {
            return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
        }
        var mid = { x: a.x, y: a.y };
        if (firstAxis === 'horizontal') mid.x = b.x;
        else mid.y = b.y;
        return dedupePoints([{ x: a.x, y: a.y }, mid, { x: b.x, y: b.y }]);
    }

    /** 两种 L 形走线中较短的一种（拐角方向决定先竖还是先横） */
    function pickRectPath(a, b) {
        var rv = buildRectPath(a, b, 'vertical');
        var rh = buildRectPath(a, b, 'horizontal');
        var pick = polylineLength(rv) <= polylineLength(rh) ? rv : rh;
        return { points: pick, firstAxis: pick === rv ? 'vertical' : 'horizontal' };
    }

    /**
     * 生成 135° 折角路径（一段 45° 斜边 + 一段轴平行线段），严格保证拐角夹角为 135°。
     *
     * 设 dx = b.x - a.x、dy = b.y - a.y，len = min(|dx|, |dy|)（即 45° 斜边的长度）。
     * 45° 斜边同时吃掉 x、y 各 len 的位移，因此中间点固定为
     *     mid = (a.x + len·sx, a.y + len·sy)
     * 斜边之后剩余的位移必然只落在位移较大的那个轴上，于是第二段是纯轴平行段：
     *   · |dx| >= |dy| → 竖直段收尾（剩余 |dy| - len 落在 y 方向，可能为 0）；
     *   · |dy| >  |dx| → 水平段收尾（剩余 |dx| - len 落在 x 方向，可能为 0）。
     * 两种形态下斜边都与「剩余位移所在的那个轴平行段」相邻，夹角恒为 135°。
     * @param {string} firstAxis 以哪一段起笔：'diagonal'（斜边先走）| 'axis'（轴段先走）
     */
    function buildDiagPath(a, b, firstAxis) {
        var dx = b.x - a.x, dy = b.y - a.y;
        var len = Math.min(Math.abs(dx), Math.abs(dy));
        if (len <= AUTO.axisTol) return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }];
        var sx = dx >= 0 ? 1 : -1, sy = dy >= 0 ? 1 : -1;
        var diagonalFirst = firstAxis !== 'axis';
        var mid = diagonalFirst
            ? { x: a.x + sx * len, y: a.y + sy * len }   // 斜边先走，轴平行段收尾
            : { x: b.x - sx * len, y: b.y - sy * len };  // 轴平行段先走，斜边收尾
        return dedupePoints([{ x: a.x, y: a.y }, mid, { x: b.x, y: b.y }]);
    }

    function polylineLength(points) {
        var total = 0;
        for (var i = 1; i < points.length; i++) {
            total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        }
        return total;
    }

    function dedupePoints(points) {
        var out = [];
        points.forEach(function (p) {
            var last = out[out.length - 1];
            if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.5) out.push({ x: round2(p.x), y: round2(p.y) });
        });
        return out.length ? out : [{ x: round2(points[0].x), y: round2(points[0].y) }];
    }

    /** 去掉首尾绑定、仅比较坐标，判断两条走线是否等价 */
    function samePolyline(p1, p2) {
        if (!p1 || !p2 || p1.length !== p2.length) return false;
        for (var i = 0; i < p1.length; i++) {
            if (round2(p1[i].x) !== round2(p2[i].x) || round2(p1[i].y) !== round2(p2[i].y)) return false;
        }
        return true;
    }

    /** 该线段是否存在两种不同的折角方向可选（直线或对折角线没有方向可言） */
    function hasCornerDirection(seg) {
        if (!seg || !(seg.points || []).length) return false;
        var flipped = flippedPoints(seg);
        return !!(flipped && !samePolyline(flipped, seg.points));
    }

    /**
     * 计算翻转折角方向后的走线（沿另一个轴先走）。
     * 135° 折角与 90° 折角各对应另一种走线；直角 L 形或直线返回 null（无需翻转）。
     * @returns {Array|null}
     */
    function flippedPoints(seg) {
        var pts = (seg && seg.points) || [];
        if (pts.length < 2) return null;
        var a = pts[0], b = pts[pts.length - 1];
        if (!a || !b) return null;
        var adx = Math.abs(a.x - b.x), ady = Math.abs(a.y - b.y);
        var minor = Math.min(adx, ady);
        if (seg.type === 'seg90' && minor > AUTO.axisTol) {
            // 90° 折角只有两种走线：默认侧（pickRectPath）与另一侧。
            // 若当前已在「另一侧」，则翻转应回到默认侧，保证可以来回切换。
            var picked = pickRectPath(a, b);
            var def = picked.points;
            var alt = buildRectPath(a, b, picked.firstAxis === 'horizontal' ? 'vertical' : 'horizontal');
            if (samePolyline(alt, pts)) return samePolyline(def, pts) ? null : def;
            return alt;
        }
        if (seg.type === 'seg135' && pts.length === 3 && minor > AUTO.axisTol) {
            var d1 = buildDiagPath(a, b, 'diagonal'), d2 = buildDiagPath(a, b, 'axis');
            var target = samePolyline(pts, d1) ? d2 : d1;
            return samePolyline(pts, target) ? null : target;
        }
        return null;
    }

    /** 翻转线段折角方向（写回坐标并保持端点绑定） */
    function flipSegmentCorner(seg) {
        var flipped = flippedPoints(seg);
        if (!flipped) return false;
        var pts = seg.points;
        var first = pts[0], last = pts[pts.length - 1];
        var next = flipped.map(function (p) { return { x: round2(p.x), y: round2(p.y) }; });
        next[0] = { x: first.x, y: first.y };
        next[next.length - 1] = { x: last.x, y: last.y };
        if (first.nid) next[0].nid = first.nid;
        if (last.nid) next[next.length - 1].nid = last.nid;
        seg.points = next;
        return true;
    }

    /** 折角方向的可选性无法从几何直接判定时（直线等）给出提示 */
    function cornerDirectionUnavailable(seg) {
        if (!seg) return '线段不存在';
        if (seg.points.length < 3) return '直线线段没有折角方向可调';
        return '该折角没有另一种走线可选';
    }

    /**
     * 翻转折角方向（Shift+左键点击线段、或属性面板按钮触发）。
     * 同步维护 cornerFlip 标记，使后续重算（节点移动 / 刷新线段配置）沿用同一侧方向。
     */
    function flipCornerDirection(seg) {
        if (!project) return;
        if (!seg) return;
        if (!flipSegmentCorner(seg)) { toast(cornerDirectionUnavailable(seg)); return; }
        // 记录当前方向与默认方向的差异，保证重算时不被重置回默认侧
        var pts = seg.points;
        var a = pts[0], b = pts[pts.length - 1];
        var manualType = !SEG_META[seg.type] || seg.type === 'segfree';
        var routedDefault = (seg.routed === true && autoRoute && !manualType)
            ? autoRouteBetween(a, b, false)
            : { type: seg.type, points: routeBetweenByType(a, b, seg.type, false) };
        if (samePolyline(routedDefault.points, pts)) {
            seg.cornerFlip = false;
        } else {
            seg.cornerFlip = true;   // 与默认不同侧，重算时保持翻转
        }
        renderAll();
        renderInspector();
        toast('已翻转折角方向' + (seg.type === 'seg135' ? '（斜边换到另一侧）' : '（改走另一条 L 形边）'));
    }

    /**
     * 根据两端节点（或任意两点）自动选择线段走线类型（路径编辑模式）：
     *   1. 两端与坐标轴平行        → XY 轴平行直线；
     *   2. 两端位于对角带内        → 135° 折角（45° 斜边 + 轴平行段，夹角严格 135°）；
     *   3. 其余情况                → 90° 折角（取较短的一种 L 形走线）。
     * @param {boolean} flip 是否使用与默认相反的另一侧折角方向
     * @returns {{type:string, points:Array}}
     */
    function autoRouteBetween(a, b, flip) {
        var dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
        var major = Math.max(dx, dy), minor = Math.min(dx, dy);

        // 1. 与坐标轴平行（含完全重合的退化情形）→ 轴平行直线
        if (minor <= AUTO.axisTol) {
            return { type: 'segaxis', points: [{ x: round2(a.x), y: round2(a.y) }, { x: round2(b.x), y: round2(b.y) }] };
        }

        // 2. 对角带内 → 135° 折角
        if (minor >= major / AUTO.diagRatio && minor >= AUTO.shortDiag) {
            return { type: 'seg135', points: buildDiagPath(a, b, flip ? 'axis' : 'diagonal') };
        }

        // 3. 其余 → 90° 折角（默认取较短走线，flip 时取另一侧）
        var picked = pickRectPath(a, b);
        if (!flip) return { type: 'seg90', points: picked.points };
        return { type: 'seg90', points: buildRectPath(a, b, picked.firstAxis === 'horizontal' ? 'vertical' : 'horizontal') };
    }

    /** 按指定类型生成走线（手动模式类型固定，仅自动计算折角位置） */
    function routeBetweenByType(a, b, type, flip) {
        if (type === 'seg135') return buildDiagPath(a, b, flip ? 'axis' : 'diagonal');
        if (type === 'seg90') {
            if (flip) {
                var picked = pickRectPath(a, b);
                return buildRectPath(a, b, picked.firstAxis === 'horizontal' ? 'vertical' : 'horizontal');
            }
            return pickRectPath(a, b).points;
        }
        return [{ x: round2(a.x), y: round2(a.y) }, { x: round2(b.x), y: round2(b.y) }];
    }

    /** 有效线段类型：开启自动选型时由几何自动判定，否则使用手动选择的类型 */
    function resolveSegmentType(a, b, fallbackType) {
        if (autoRoute) return autoRouteBetween(a, b);
        return { type: fallbackType, points: routeBetweenByType(a, b, fallbackType) };
    }

    // --------------------------------------------------------------------------
    // 自动线段批量重算（「刷新线段配置」与车站拖动实时重算共用）
    // --------------------------------------------------------------------------

    /** 判断某个折角是否为自动走线允许的形态：90° 直角（L 形）或 135°/45°（135° 折角斜边与轴段） */
    function isAutoRoutableCorner(prev, curr, next) {
        var v1x = prev.x - curr.x, v1y = prev.y - curr.y;
        var v2x = next.x - curr.x, v2y = next.y - curr.y;
        var n1 = Math.hypot(v1x, v1y), n2 = Math.hypot(v2x, v2y);
        if (n1 < 0.6 || n2 < 0.6) return true; // 退化段忽略
        var cos = Math.abs((v1x * v2x + v1y * v2y) / (n1 * n2));
        return Math.abs(cos - 0) < 0.02 || Math.abs(cos - Math.SQRT1_2) < 0.02;
    }

    /**
     * 线段是否参与自动走线重算。
     *
     * 依据线段自身的「走线意图」（seg.routed）判定，而不是依据当前几何形态：
     *   · routed === true  → 自动走线线段（由自动选型或手动选择折角类型创建），
     *                        节点移动/一键刷新时按折角类型重算，因此 135° 始终严格保持；
     *   · routed === false → 手绘自由路径，保留人工形状，仅端点跟随节点；
     *   · 字段缺省（早期工程/外部导入）→ 回退到几何形态判定：
     *     2 个点视为直线跟随，3 个点且两段为纯轴平行段或严格 45° 斜段且折角为 90°/135° 时跟随，
     *     其余（多转折点或任意角度）视为手绘路径。
     * 车站节点与临时节点在此完全一视同仁。
     */
    function isAutoRoutable(seg) {
        var pts = (seg && seg.points) || [];
        if (pts.length < 2) return false;
        // 端点必须仍然绑定在存在的节点上，才能按节点坐标重算
        var ends = [pts[0], pts[pts.length - 1]];
        for (var i = 0; i < ends.length; i++) {
            var nid = ends[i] && ends[i].nid;
            if (!nid || !project.nodes[nid]) return false;
        }
        if (seg.routed === true) return true;
        if (seg.routed === false) return false;
        // 兼容缺省字段：按几何形态推断
        if (pts.length > 3) return false;
        if (pts.length === 2) return true;
        var kinds = [];
        for (var k = 1; k < pts.length; k++) {
            var dx = Math.abs(pts[k].x - pts[k - 1].x), dy = Math.abs(pts[k].y - pts[k - 1].y);
            if (dx < 0.6 && dy < 0.6) kinds.push('zero');
            else if (dx < 0.6 || dy < 0.6) kinds.push('axis');
            else if (Math.abs(dx - dy) < 0.6) kinds.push('diagonal');
            else kinds.push('free');
        }
        if (kinds.indexOf('free') >= 0) return false;
        if (kinds.every(function (k) { return k === 'axis' || k === 'zero'; })) return true; // 直角 L 形
        if (kinds.filter(function (k) { return k === 'diagonal'; }).length !== 1) return false;
        return isAutoRoutableCorner(pts[0], pts[1], pts[2]);
    }

    /**
     * 按两端节点坐标重算单条线段的走线，保留端点绑定。
     * 折角类型的选取规则：
     *   · 自由路径、或用户手动指定过类型（routed 缺省）→ 沿用 seg.type（手动类型不会被改写）；
     *   · 自动走线线段（routed === true）→ 依据「线段自动选型」开关：
     *       开启时按几何自动判定，关闭时沿用当前类型。
     * 无论走哪种方式，135° 折角都会按两端坐标重新生成严格的 45° 斜边 + 轴平行段。
     * @returns {boolean} 是否发生了类型或走线变化
     */
    function recomputeSegmentRoute(seg) {
        var pts = seg.points || [];
        if (pts.length < 2) return false;
        var a = pts[0], b = pts[pts.length - 1];
        var manualType = !SEG_META[seg.type] || seg.type === 'segfree';
        var flip = seg.cornerFlip === true;
        var routed = (seg.routed === true && autoRoute && !manualType)
            ? autoRouteBetween(a, b, flip)
            : { type: seg.type, points: routeBetweenByType(a, b, seg.type, flip) };
        var newPts = routed.points.map(function (p) { return { x: p.x, y: p.y }; });
        newPts[0] = { x: a.x, y: a.y };
        newPts[newPts.length - 1] = { x: b.x, y: b.y };
        if (a.nid) newPts[0].nid = a.nid;
        if (b.nid) newPts[newPts.length - 1].nid = b.nid;
        var changed = seg.type !== routed.type || JSON.stringify(seg.points) !== JSON.stringify(newPts);
        seg.type = routed.type;
        seg.points = newPts;
        return changed;
    }

    /**
     * 按节点最新坐标重算可自动走线的线段（统一的批量重算入口）。
     * 先把线段端点同步为两端节点的最新坐标，再按自动选型重算走线与折角类型。
     * @param {function} [filter] 可选过滤：仅处理返回 true 的线段
     * @returns {{count:number, changed:number}} 处理数量与走线发生变化的数量
     */
    function refreshAutoSegments(filter) {
        var stat = { count: 0, changed: 0 };
        if (!project) return stat;
        project.segments.forEach(function (seg) {
            if (!isAutoRoutable(seg)) return;
            if (filter && !filter(seg)) return;
            var a = seg.points[0], b = seg.points[seg.points.length - 1];
            a.x = project.nodes[a.nid].x; a.y = project.nodes[a.nid].y;
            b.x = project.nodes[b.nid].x; b.y = project.nodes[b.nid].y;
            if (recomputeSegmentRoute(seg)) stat.changed++;
            stat.count++;
        });
        return stat;
    }

    /** 「刷新线段配置」按钮：记录历史后按当前节点布局重算全部自动走线线段 */
    function refreshSegmentsFromLayout() {
        if (!project) { toast('请先创建画布'); return; }
        var total = project.segments.length;
        var autoCount = project.segments.filter(isAutoRoutable).length;
        if (!autoCount) {
            toast(total ? '没有可自动重算的线段（多转折点的手绘路径保持不变）' : '当前画布还没有线段');
            return;
        }
        pushHistory();
        var stat = refreshAutoSegments(null);
        renderAll();
        renderInspector();
        var skipped = total - stat.count;
        toast('已按当前节点布局刷新 ' + stat.count + ' 条线段' +
            (stat.changed ? '（' + stat.changed + ' 条走线更新）' : '（走线无需调整）') +
            (skipped ? '，' + skipped + ' 条手绘路径保持不变' : ''));
    }

    // ==========================================================================
    // 8. 元素创建
    // ==========================================================================

    function newStationNode(x, y) {
        var id = nextId('S');
        project.nodes[id] = {
            id: id,
            type: 'station',
            x: round2(x),
            y: round2(y),
            code: id,
            cn: '新建车站',
            en: 'New Station',
            cnSize: 13,
            enSize: 10,
            align: 'top',
            offsetX: 9,
            offsetY: -9,
            labelPos: 'align',
            // 所属线路由「连线」自动建立（见 commitSegment），也支持在属性面板中手工增删，
            // 避免仅因放置时选中的线路不同而误判为换乘站
            lineId: null,
            lineIds: []
        };
        return project.nodes[id];
    }

    function newTempNode(x, y) {
        var id = nextId('T');
        project.nodes[id] = { id: id, type: 'temp', x: round2(x), y: round2(y) };
        return project.nodes[id];
    }

    /** 在指定位置创建节点；若附近已有节点则直接复用 */
    function createNodeAt(x, y, type) {
        var p = snapPoint(x, y);
        var existing = findNodeAt(p.x, p.y, 8);
        if (existing) return existing;
        return type === 'temp' ? newTempNode(p.x, p.y) : newStationNode(p.x, p.y);
    }

    /** 查找指定位置附近的节点（容差按屏幕像素换算，便于低缩放下拾取） */
    function findNodeAt(x, y, tolPx) {
        var tol = tolPx / (view.k || 1);
        var best = null, bestDist = Infinity;
        Object.keys(project.nodes).forEach(function (id) {
            var n = project.nodes[id];
            var d = Math.hypot(n.x - x, n.y - y);
            if (d <= tol && d < bestDist) { best = n; bestDist = d; }
        });
        return best;
    }

    /**
     * 提交线段草稿
     * @param {Array} ends 端点节点（至少 2 个）
     * @param {Array} waypoints 自由路径的中间途径点（世界坐标）
     */
    function commitSegment(ends, waypoints) {
        if (!ends || ends.length < 2) { draft = null; renderAll(); return; }
        if (ends[0].id === ends[1].id) { toast('起点与终点不能是同一个节点'); draft = null; renderAll(); return; }
        var line = ensureActiveLine();
        var points, segType;
        if (waypoints && waypoints.length) {
            // 自由路径：保留用户逐个点击产生的转折点
            points = waypoints.map(function (p) { return { x: round2(p.x), y: round2(p.y) }; });
            points[0] = { x: ends[0].x, y: ends[0].y, nid: ends[0].id };
            points[points.length - 1] = { x: ends[1].x, y: ends[1].y, nid: ends[1].id };
            segType = 'segfree';
        } else {
            var fallback = activeTool.indexOf('seg') === 0 ? activeTool : 'segaxis';
            var routed = resolveSegmentType(ends[0], ends[1], fallback);
            points = routed.points.map(function (p) { return { x: p.x, y: p.y }; });
            points[0].nid = ends[0].id;
            points[points.length - 1].nid = ends[1].id;
            segType = routed.type;
        }
        var seg = { id: nextId('G'), lineId: line.id, type: segType, points: points, routed: !(waypoints && waypoints.length) };
        pushHistory();               // 先记录「添加前」的快照，撤销才能回到无此线段的状态
        project.segments.push(seg);
        // 线段所属线路自动并入两端车站的「所属线路」，保持连接关系与属性一致
        addLineToNode(ends[0], line.id);
        addLineToNode(ends[1], line.id);
        draft = null;
        selection = { type: 'segment', id: seg.id };
        renderAll();
        renderInspector();
        syncLineSelect();
        toast('已添加' + (SEG_META[seg.type] ? SEG_META[seg.type].label : '线段'));
    }

    /** 提交水域多边形草稿 */
    function commitWater(points) {
        if (!points || points.length < 3) { toast('水域至少需要 3 个顶点'); return; }
        pushHistory();
        var water = {
            id: nextId('W'),
            name: '水域 ' + (project.waters.length + 1),
            points: points.map(function (p) { return { x: round2(p.x), y: round2(p.y) }; }),
            fill: WATER_DEFAULT.fill,
            opacity: WATER_DEFAULT.opacity
        };
        project.waters.push(water);
        draft = null;
        selection = { type: 'water', id: water.id };
        renderAll();
        renderInspector();
        toast('已添加水域多边形');
    }

    function deleteSelection() {
        if (!project) return;
        // 多选节点时统一走批量删除
        if (selectedNodeIds.length > 1) { deleteSelectedNodes(); return; }
        if (!selection) { toast('请先选中要删除的元素'); return; }
        pushHistory();
        if (selection.type === 'node') {
            var nid = selection.id;
            delete project.nodes[nid];
            project.segments.forEach(function (seg) {
                seg.points = (seg.points || []).filter(function (p) { return p.nid !== nid; });
            });
            project.segments = project.segments.filter(function (seg) { return (seg.points || []).length >= 2; });
        } else if (selection.type === 'segment') {
            project.segments = project.segments.filter(function (s) { return s.id !== selection.id; });
        } else if (selection.type === 'water') {
            project.waters = project.waters.filter(function (w) { return w.id !== selection.id; });
        }
        clearSelection();
        renderAll();
        renderInspector();
        syncLineSelect();
        toast('已删除选中元素');
    }

    /**
     * 节点（车站或临时节点）拖动过程中的实时重算：
     * 被拖动节点所连接的、可自动走线的线段立即按新的两端坐标重新判定折角类型并重算走线，
     * 从而在移动过程中始终保持严格 135°（或 90°）夹角。
     * 操作仍由拖动开始时的单条撤销记录覆盖，因此这里不写入历史。
     */
    function liveRecomputeSegmentsFor(node) {
        if (!node) return;
        refreshAutoSegments(function (seg) {
            return (seg.points || []).some(function (p) { return p.nid === node.id; });
        });
    }

    /** 节点坐标变化后同步与其绑定的线段端点 */
    function syncNodeSegments(node) {
        project.segments.forEach(function (seg) {
            (seg.points || []).forEach(function (p) {
                if (p.nid === node.id) { p.x = node.x; p.y = node.y; }
            });
        });
    }

    // ==========================================================================
    // 9. 渲染
    // ==========================================================================

    function clearChildren(el) { while (el.firstChild) el.removeChild(el.firstChild); }

    function renderAll() {
        updateStageInfo();
        if (!project) return;
        setViewBox();
        renderGrid();
        renderAxes();
        renderWaters();
        renderSegments();
        renderNodes();
        renderLabels();
        renderDraft();
        renderOverlay();
        updateStageInfo();
    }

    /** 屏幕 1px 对应的世界坐标长度 */
    function unitScale() { return 1 / (view.k || 1); }

    function isInView(x, y, margin) {
        var b = visibleWorldBounds();
        var m = margin || 40;
        return x >= b.minX - m && x <= b.maxX + m && y >= b.minY - m && y <= b.maxY + m;
    }

    // ---------------------------- 网格与坐标刻度 ----------------------------

    function renderGrid() {
        var layer = $('grid-layer');
        clearChildren(layer);
        if (!$('chk-grid').checked) return;

        var g = gridSize();
        var w = project.canvas.width, h = project.canvas.height;
        var u = unitScale();
        // 缩放较小时自动稀疏网格，避免绘制过多线条
        while (g * view.k < 6) g *= 2;

        var b = visibleWorldBounds();
        var frag = document.createDocumentFragment();
        var x, y;
        for (x = 0; x <= w + 0.5; x += g) {
            if (x < b.minX - g || x > b.maxX + g) continue;
            var lineX = document.createElementNS(NS, 'line');
            lineX.setAttribute('x1', x); lineX.setAttribute('y1', 0);
            lineX.setAttribute('x2', x); lineX.setAttribute('y2', h);
            var majorX = Math.abs(x % (g * 5)) < 1e-6;
            lineX.setAttribute('stroke', 'currentColor');
            lineX.setAttribute('stroke-width', (majorX ? 1.4 : 1) * u);
            lineX.setAttribute('opacity', majorX ? 0.3 : 0.16);
            frag.appendChild(lineX);
        }
        for (y = 0; y <= h + 0.5; y += g) {
            if (y < b.minY - g || y > b.maxY + g) continue;
            var lineY = document.createElementNS(NS, 'line');
            lineY.setAttribute('x1', 0); lineY.setAttribute('y1', y);
            lineY.setAttribute('x2', w); lineY.setAttribute('y2', y);
            var majorY = Math.abs(y % (g * 5)) < 1e-6;
            lineY.setAttribute('stroke', 'currentColor');
            lineY.setAttribute('stroke-width', (majorY ? 1.4 : 1) * u);
            lineY.setAttribute('opacity', majorY ? 0.3 : 0.16);
            frag.appendChild(lineY);
        }
        layer.appendChild(frag);
        layer.style.color = 'var(--border-color)';
    }

    /**
     * 坐标轴与刻度：原点 O 位于画布左上角顶点，
     * X 轴沿画布上边缘向右为正，Y 轴沿画布左边缘向下为正。
     */
    function renderAxes() {
        var layer = $('axis-layer');
        clearChildren(layer);
        var w = project.canvas.width, h = project.canvas.height;
        var u = unitScale();
        var b = visibleWorldBounds();
        var light = isLightTheme();
        var axisColorX = light ? '#c62828' : '#ff8a80';
        var axisColorY = light ? '#2e7d32' : '#81c995';

        // X 轴：沿上边缘，向右为正
        if (0 >= b.minY - 2 && 0 <= b.maxY + 2) {
            var xa = document.createElementNS(NS, 'line');
            xa.setAttribute('x1', 0); xa.setAttribute('y1', 0);
            xa.setAttribute('x2', w); xa.setAttribute('y2', 0);
            xa.setAttribute('stroke', axisColorX);
            xa.setAttribute('stroke-width', 1.6 * u);
            xa.setAttribute('opacity', 0.85);
            layer.appendChild(xa);
            layer.appendChild(axisText('X (向右为正)', w - 6 * u, 6 * u, 'end', axisColorX, u, 0.9));
        }
        // Y 轴：沿左边缘，向下为正
        if (0 >= b.minX - 2 && 0 <= b.maxX + 2) {
            var ya = document.createElementNS(NS, 'line');
            ya.setAttribute('x1', 0); ya.setAttribute('y1', 0);
            ya.setAttribute('x2', 0); ya.setAttribute('y2', h);
            ya.setAttribute('stroke', axisColorY);
            ya.setAttribute('stroke-width', 1.6 * u);
            ya.setAttribute('opacity', 0.85);
            layer.appendChild(ya);
            layer.appendChild(axisText('Y (向下为正)', 5 * u, h - 6 * u, 'start', axisColorY, u, 0.9));
        }
        // 原点 O（左上角顶点）
        var o = document.createElementNS(NS, 'circle');
        o.setAttribute('cx', 0); o.setAttribute('cy', 0);
        o.setAttribute('r', 3.4 * u);
        o.setAttribute('fill', axisColorX);
        layer.appendChild(o);
        layer.appendChild(axisText('O (0,0)', 8 * u, 14 * u, 'start', 'var(--text-light)', u, 0.9));

        // 坐标刻度：默认每 100 单位一格，缩小时自动加倍
        var tickStep = 100;
        while (tickStep * view.k < 42) tickStep *= 2;
        var tx, ty;
        for (tx = Math.ceil(Math.max(b.minX, 0) / tickStep) * tickStep; tx <= b.maxX; tx += tickStep) {
            if (tx <= 0) continue;
            layer.appendChild(axisText(String(round2(tx)), tx + 2 * u, 13 * u, 'start', 'var(--text-light)', u, 0.75));
        }
        for (ty = Math.ceil(Math.max(b.minY, 0) / tickStep) * tickStep; ty <= b.maxY; ty += tickStep) {
            if (ty <= 0) continue;
            layer.appendChild(axisText(String(round2(ty)), 4 * u, ty - 3 * u, 'start', 'var(--text-light)', u, 0.75));
        }
    }

    function axisText(text, x, y, anchor, fill, u, opacity) {
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('x', round2(x));
        t.setAttribute('y', round2(y));
        t.setAttribute('text-anchor', anchor || 'start');
        t.setAttribute('fill', fill || 'currentColor');
        t.setAttribute('font-size', round2(11 * u));
        t.setAttribute('font-family', 'var(--font-sans, system-ui, sans-serif)');
        t.setAttribute('opacity', opacity == null ? 0.9 : opacity);
        t.setAttribute('pointer-events', 'none');
        t.textContent = text;
        return t;
    }

    // ---------------------------- 水域 ----------------------------

    function renderWaters() {
        var layer = $('water-layer');
        clearChildren(layer);
        project.waters.forEach(function (water) {
            if (!water.points || water.points.length < 3) return;
            var path = document.createElementNS(NS, 'path');
            path.setAttribute('d', polygonPath(water.points));
            path.setAttribute('fill', water.fill || WATER_DEFAULT.fill);
            path.setAttribute('fill-opacity', water.opacity == null ? WATER_DEFAULT.opacity : water.opacity);
            path.setAttribute('stroke', water.fill || WATER_DEFAULT.fill);
            path.setAttribute('stroke-opacity', 0.95);
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('class', 'ed-water' + (isSelected('water', water.id) ? ' ed-selected' : ''));
            path.setAttribute('data-kind', 'water');
            path.setAttribute('data-id', water.id);
            layer.appendChild(path);
        });
    }

    function polygonPath(points) {
        var d = 'M' + round2(points[0].x) + ',' + round2(points[0].y);
        for (var i = 1; i < points.length; i++) d += ' L' + round2(points[i].x) + ',' + round2(points[i].y);
        return d + ' Z';
    }

    /** 判断折角是接近 90° 还是接近 135°（用于取默认圆角半径） */
    function isRightAngleCorner(prev, curr, next) {
        var v1x = prev.x - curr.x, v1y = prev.y - curr.y;
        var v2x = next.x - curr.x, v2y = next.y - curr.y;
        var l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
        var dot = Math.abs((v1x * v2x + v1y * v2y) / (l1 * l2));
        return dot < 0.35;
    }

    /** 线段折角圆角半径：无自定义时按折角形态取默认值（内置 90°=18、135°=8，与核心引擎一致） */
    function cornerRadiusValue(points, index, seg) {
        // 约定：cornerRadii 下标 0 对应第一个折角（points[1]），故此处取 index - 1
        var custom = seg && Array.isArray(seg.cornerRadii) ? seg.cornerRadii[index - 1] : null;
        if (custom != null && isFinite(custom)) return Math.max(0, custom);
        return isRightAngleCorner(points[index - 1], points[index], points[index + 1]) ? 18 : 8;
    }

    /**
     * 生成带圆角的折线路径。
     * @param {number|Array} radii 单个半径值应用到所有折角；数组则逐折角指定
     *                 （索引 0 对应 points[1]，即第一个折角）
     */
    function pathWithRoundedCorners(points, radii) {
        if (!points || points.length < 2) return '';
        if (points.length === 2) {
            return 'M' + round2(points[0].x) + ',' + round2(points[0].y) +
                ' L' + round2(points[1].x) + ',' + round2(points[1].y);
        }
        var d = 'M' + round2(points[0].x) + ',' + round2(points[0].y);
        for (var i = 1; i < points.length - 1; i++) {
            var prev = points[i - 1], curr = points[i], next = points[i + 1];
            var v1x = prev.x - curr.x, v1y = prev.y - curr.y;
            var v2x = next.x - curr.x, v2y = next.y - curr.y;
            var l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
            var u1x = v1x / l1, u1y = v1y / l1, u2x = v2x / l2, u2y = v2y / l2;
            var wanted = Array.isArray(radii) ? radii[i - 1] : radii;
            if (wanted == null || !isFinite(wanted)) wanted = isRightAngleCorner(prev, curr, next) ? 18 : 8;
            var r = Math.max(0, Math.min(wanted, l1 * 0.45, l2 * 0.45));
            if (r < 0.2) {
                // 半径过小：直接作为尖角处理，避免出现无效圆弧
                d += ' L' + round2(curr.x) + ',' + round2(curr.y);
                continue;
            }
            var p1 = { x: curr.x + u1x * r, y: curr.y + u1y * r };
            var p2 = { x: curr.x + u2x * r, y: curr.y + u2y * r };
            d += ' L' + round2(p1.x) + ',' + round2(p1.y);
            d += ' Q' + round2(curr.x) + ',' + round2(curr.y) + ' ' + round2(p2.x) + ',' + round2(p2.y);
        }
        var last = points[points.length - 1];
        d += ' L' + round2(last.x) + ',' + round2(last.y);
        return d;
    }

    /** 线段当前的逐折角半径数组（索引 0 对应 points[1]） */
    function segmentRadii(seg) {
        var pts = (seg && seg.points) || [];
        var out = [];
        for (var i = 1; i < pts.length - 1; i++) out.push(cornerRadiusValue(pts, i, seg));
        return out;
    }

    /** 定位线段的折角控制柄：折角点、当前半径、以及用于拖拽增减半径的角平分线方向 */
    function segmentCornerHandles(seg) {
        var pts = (seg && seg.points) || [];
        var handles = [];
        for (var i = 1; i < pts.length - 1; i++) {
            var prev = pts[i - 1], curr = pts[i], next = pts[i + 1];
            var v1x = prev.x - curr.x, v1y = prev.y - curr.y;
            var v2x = next.x - curr.x, v2y = next.y - curr.y;
            var l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
            var u1x = v1x / l1, u1y = v1y / l1, u2x = v2x / l2, u2y = v2y / l2;
            var bx = u1x + u2x, by = u1y + u2y;
            var bl = Math.hypot(bx, by);
            if (bl < 1e-3) { bx = u1y; by = -u1x; bl = 1; }   // 折角接近平角时取垂线方向
            bx /= bl; by /= bl;
            var radius = cornerRadiusValue(pts, i, seg);
            var grip = Math.max(radius, 10);
            handles.push({
                index: i,
                x: curr.x, y: curr.y,
                radius: radius,
                bisector: { x: bx, y: by },
                hx: curr.x + bx * (radius + grip * 0.22),
                hy: curr.y + by * (radius + grip * 0.22)
            });
        }
        return handles;
    }

    /** 元素是否处于选中状态（节点支持多选集合） */
    function isSelected(kind, id) {
        if (kind === 'node' && selectedNodeIds.length) return selectedNodeIds.indexOf(id) >= 0;
        return !!selection && selection.type === kind && selection.id === id;
    }

    // ---------------------------- 选择集（支持节点多选） ----------------------------

    /**
     * 统一维护「节点多选集合 + 单元素选择对象」：
     *   · 选中多个节点时，selection 指向其中一个节点，供依赖 selection 的逻辑使用；
     *   · 未选中任何节点时，selection 可指向线段或水域。
     */
    function syncSelection(preferredId) {
        if (!project || !selectedNodeIds.length) return;
        var id = (preferredId && selectedNodeIds.indexOf(preferredId) >= 0) ? preferredId : selectedNodeIds[0];
        if (!project.nodes[id]) {
            selectedNodeIds = selectedNodeIds.filter(function (nid) { return !!project.nodes[nid]; });
            if (!selectedNodeIds.length) return;
            id = selectedNodeIds[0];
        }
        selection = { type: 'node', id: id };
    }

    /** 清空全部选择（节点多选集合与单元素选择） */
    function clearSelection() {
        selectedNodeIds = [];
        selection = null;
    }

    /** 以指定节点集合建立选择 */
    function selectNodes(ids, preferredId) {
        selectedNodeIds = (ids || []).filter(function (id) { return !!project.nodes[id]; });
        selection = null;
        if (!selectedNodeIds.length) return;   // 空集合即清空选择
        syncSelection(preferredId);
    }

    /** 全选所有节点（车站 + 临时节点） */
    function selectAllNodes() {
        if (!project) { toast('请先创建画布'); return; }
        var ids = Object.keys(project.nodes);
        if (!ids.length) { toast('画布中还没有节点'); return; }
        selectNodes(ids, ids[0]);
        renderAll();
        renderInspector();
        toast('已选中全部 ' + ids.length + ' 个节点（Ctrl+C 复制 / Ctrl+D 原位复制 / Delete 删除）');
    }

    /** 复制选中节点到内部剪贴板 */
    function copySelectedNodes(silent) {
        if (!project) return null;
        if (!selectedNodeIds.length) {
            if (!silent) toast('请先选中要复制的节点（点击节点，或 Ctrl+A 全选）');
            return null;
        }
        clipboardNodes = selectedNodeIds
            .filter(function (id) { return !!project.nodes[id]; })
            .map(function (id) { return deepClone(project.nodes[id]); });
        pasteCount = 0;
        if (!silent) toast('已复制 ' + clipboardNodes.length + ' 个节点');
        return clipboardNodes;
    }

    /**
     * 摆放剪贴板节点：默认放在鼠标指针所在位置。
     * 以复制内容的包围盒基准点（左上角）对齐目标点，保持多节点之间的相对布局；
     * 指针不在画布上（键盘操作前未移动过鼠标）时退回「相对原位置偏移 10px」的粘贴方式。
     * @param {boolean} atPointer 是否摆放到鼠标指针处
     * @returns {Array<string>} 新建节点 id 列表
     */
    function placeClipboardNodes(atPointer) {
        var base = clipboardNodes[0];
        var usePointer = !!(atPointer && pointerWorld);
        if (!usePointer) {
            // 退回偏移粘贴：相对原位置逐次递增 10px
            pasteCount++;
            var offset = 10 * pasteCount;
            var ids = [];
            clipboardNodes.forEach(function (source) {
                var node = deepClone(source);
                var id = nextId(node.type === 'temp' ? 'T' : 'S');
                node.id = id;
                node.x = round2(source.x + offset);
                node.y = round2(source.y + offset);
                project.nodes[id] = node;
                ids.push(id);
            });
            return { ids: ids, described: pasteCount > 1 ? '（偏移 ' + offset + 'px）' : '（偏移 10px）' };
        }

        // 指针位置对齐到「最靠近指针的那个节点」，符合直觉且便于连续摆放
        var ref = clipboardNodes[0], bestDist = Infinity;
        clipboardNodes.forEach(function (n) {
            var d = Math.hypot(n.x - pointerWorld.x, n.y - pointerWorld.y);
            if (d < bestDist) { bestDist = d; ref = n; }
        });
        var target = snapPoint(pointerWorld.x, pointerWorld.y);
        var dx = target.x - ref.x;
        var dy = target.y - ref.y;
        var newIds = [];
        clipboardNodes.forEach(function (source) {
            var node = deepClone(source);
            var id = nextId(node.type === 'temp' ? 'T' : 'S');
            node.id = id;
            node.x = round2(source.x + dx);
            node.y = round2(source.y + dy);
            project.nodes[id] = node;
            newIds.push(id);
        });
        // 摆放完成后剪贴板整体平移到新位置，便于再次 Ctrl+V 继续放置
        clipboardNodes = newIds.map(function (id) { return deepClone(project.nodes[id]); });
        pasteCount = 0;
        void base;
        return { ids: newIds, described: '（已放置到鼠标位置）' };
    }

    /**
     * 粘贴剪贴板中的节点：默认落在鼠标指针处（保持多节点相对布局）；
     * 新建的节点成为当前选择，可继续拖动或再按 Ctrl+V / Ctrl+D。
     */
    function pasteClipboardNodes(atPointer) {
        if (!project) { toast('请先创建画布'); return; }
        if (!clipboardNodes || !clipboardNodes.length) { toast('剪贴板为空，请先用 Ctrl+C 复制节点'); return; }
        pushHistory();
        var result = placeClipboardNodes(atPointer !== false);
        renderAll();
        selectNodes(result.ids, result.ids[result.ids.length - 1]);
        renderAll();
        renderInspector();
        updateStageInfo();
        toast('已粘贴 ' + result.ids.length + ' 个节点' + result.described);
    }

    /** Ctrl+D：原位复制一份选中节点（落在当前鼠标位置，未移动鼠标时相对原位置偏移一小段） */
    function duplicateSelectedNodes() {
        if (!project) { toast('请先创建画布'); return; }
        if (!selectedNodeIds.length) { toast('请先选中要复制的节点'); return; }
        // 原位复制不做「跟随鼠标」：明确落在原位置附近，避免复制体跳到指针处
        var saved = pointerWorld;
        pointerWorld = null;
        copySelectedNodes(true);
        pasteCount = 0;      // 原位复制每次只偏移一档
        pasteClipboardNodes(false);
        pointerWorld = saved;
    }

    /** 删除当前选中的全部节点（多选时逐个删除） */
    function deleteSelectedNodes() {
        if (!project || !selectedNodeIds.length) return false;
        var ids = selectedNodeIds.slice();
        pushHistory();
        ids.forEach(function (id) {
            delete project.nodes[id];
            project.segments.forEach(function (seg) {
                seg.points = (seg.points || []).filter(function (p) { return p.nid !== id; });
            });
        });
        project.segments = project.segments.filter(function (seg) { return (seg.points || []).length >= 2; });
        clearSelection();
        renderAll();
        renderInspector();
        syncLineSelect();
        toast('已删除 ' + ids.length + ' 个节点');
        return true;
    }

    // ---------------------------- 线段 ----------------------------

    function renderSegments() {
        var layer = $('line-layer');
        clearChildren(layer);
        var u = unitScale();
        project.segments.forEach(function (seg) {
            var line = findLine(seg.lineId);
            var color = (line && line.color) ? line.color : '#006098';
            var d = pathWithRoundedCorners(seg.points, segmentRadii(seg));
            if (!d) return;
            var path = document.createElementNS(NS, 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', round2(6 * u));
            path.setAttribute('class', 'ed-seg' + (isSelected('segment', seg.id) ? ' ed-selected' : ''));
            path.setAttribute('data-kind', 'segment');
            path.setAttribute('data-id', seg.id);
            layer.appendChild(path);
        });
    }

    // ---------------------------- 节点与站名 ----------------------------

    function renderNodes() {
        var layer = $('node-layer');
        clearChildren(layer);
        // 节点视觉尺寸随缩放变化，保证屏幕上始终是固定像素大小
        var scale = view.k || 1;
        Object.keys(project.nodes).forEach(function (id) {
            var node = project.nodes[id];
            if (!isInView(node.x, node.y, 30)) return;
            var g = document.createElementNS(NS, 'g');
            g.setAttribute('data-kind', 'node');
            g.setAttribute('data-id', id);
            g.style.cursor = 'pointer';

            if (node.type === 'temp') {
                // 临时节点：黑色 ×
                g.setAttribute('class', 'ed-node-temp' + (isSelected('node', id) ? ' ed-node-selected' : ''));
                var half = NODE.tempArm / scale;
                var l1 = document.createElementNS(NS, 'line');
                l1.setAttribute('x1', node.x - half); l1.setAttribute('y1', node.y + half);
                l1.setAttribute('x2', node.x + half); l1.setAttribute('y2', node.y - half);
                l1.setAttribute('stroke-width', round2(4 / scale));
                var l2 = document.createElementNS(NS, 'line');
                l2.setAttribute('x1', node.x - half); l2.setAttribute('y1', node.y - half);
                l2.setAttribute('x2', node.x + half); l2.setAttribute('y2', node.y + half);
                l2.setAttribute('stroke-width', round2(4 / scale));
                if (isSelected('node', id)) {
                    l1.setAttribute('stroke', 'var(--info-color)');
                    l2.setAttribute('stroke', 'var(--info-color)');
                }
                g.appendChild(l1);
                g.appendChild(l2);
            } else if (isTransferNode(id)) {
                // 换乘站：双环样式（外圈为站体描边色，内圈为线路色）
                g.setAttribute('class', 'ed-node-tsf' + (isSelected('node', id) ? ' ed-node-selected' : ''));
                var dark = isLightTheme() ? '#00263b' : '#bdcbd2';
                var ring = document.createElementNS(NS, 'circle');
                ring.setAttribute('class', 'ed-node-ring');
                ring.setAttribute('cx', node.x); ring.setAttribute('cy', node.y);
                ring.setAttribute('r', NODE.tsfMid);
                ring.setAttribute('stroke', dark);
                ring.setAttribute('stroke-width', round2(NODE.tsfOuterW));
                g.appendChild(ring);

                var outer = document.createElementNS(NS, 'circle');
                outer.setAttribute('fill', 'none');
                outer.setAttribute('cx', node.x); outer.setAttribute('cy', node.y);
                outer.setAttribute('r', NODE.tsfOuter);
                outer.setAttribute('stroke', dark);
                outer.setAttribute('stroke-width', round2(NODE.tsfOuterW));
                g.appendChild(outer);

                var accent = document.createElementNS(NS, 'circle');
                accent.setAttribute('fill', 'none');
                accent.setAttribute('cx', node.x); accent.setAttribute('cy', node.y);
                accent.setAttribute('r', NODE.tsfMid - NODE.tsfMidW * 0.5 - 1.9);
                accent.setAttribute('stroke', nodeSecondaryColor(id));
                accent.setAttribute('stroke-width', round2(NODE.tsfMidW * 0.7));
                accent.setAttribute('opacity', '0.9');
                g.appendChild(accent);

                var core = document.createElementNS(NS, 'circle');
                core.setAttribute('class', 'ed-node-core');
                core.setAttribute('cx', node.x); core.setAttribute('cy', node.y);
                core.setAttribute('r', NODE.tsfMid - NODE.tsfMidW);
                g.appendChild(core);
            } else {
                // 普通车站：圆形，描边使用线路色
                g.setAttribute('class', 'ed-node-station' + (isSelected('node', id) ? ' ed-node-selected' : ''));
                var circle = document.createElementNS(NS, 'circle');
                circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y);
                circle.setAttribute('r', NODE.rOuter);
                circle.setAttribute('stroke', isSelected('node', id) ? 'var(--info-color)' : nodeColor(id));
                circle.setAttribute('stroke-width', round2(NODE.rOuter - NODE.rInner));
                g.appendChild(circle);

                var inner = document.createElementNS(NS, 'circle');
                inner.setAttribute('cx', node.x); inner.setAttribute('cy', node.y);
                inner.setAttribute('r', NODE.rInner);
                inner.setAttribute('fill', 'var(--map-bg)');
                g.appendChild(inner);
            }
            layer.appendChild(g);
        });
    }

    /**
     * 计算站名文本的排布：把「对齐方式模式」与「指定坐标模式」统一成同一组排布参数。
     *
     * 标签定位有两种互斥的取值方式（由 node.labelPos 决定）：
     *   · 'align'（缺省）：由「站名对齐方式」+ 文本偏移自动排布，随站点位置移动；
     *   · 'free'         ：由显式坐标 (node.labelX, node.labelY) 精确控制，不随站点移动。
     * @returns {{x:number, y:number, anchor:string, vertical:string}}
     */
    function resolveLabelLayout(node) {
        var align = node.align || 'top';
        var anchor = align.indexOf('left') >= 0 ? 'start' : (align.indexOf('right') >= 0 ? 'end' : 'middle');
        var vertical = 'middle';
        if (align.indexOf('top') >= 0) vertical = 'bottom';
        else if (align.indexOf('bottom') >= 0) vertical = 'top';

        if (node.labelPos === 'free') {
            // 指定坐标模式：坐标即标签锚点，行内文本仍沿用对齐方式的水平/垂直基准
            var fx = node.labelX == null ? node.x + (node.offsetX == null ? 0 : node.offsetX) : node.labelX;
            var fy = node.labelY == null ? node.y + (node.offsetY == null ? 0 : node.offsetY) : node.labelY;
            return { x: round2(fx), y: round2(fy), anchor: anchor, vertical: vertical };
        }

        // 对齐方式模式：随站点位置自动排布
        return {
            x: round2(node.x + (node.offsetX == null ? 0 : node.offsetX)),
            y: round2(node.y + (node.offsetY == null ? 0 : node.offsetY)),
            anchor: anchor,
            vertical: vertical
        };
    }

    function renderLabels() {
        var layer = $('label-layer');
        clearChildren(layer);
        var u = unitScale();
        Object.keys(project.nodes).forEach(function (id) {
            var node = project.nodes[id];
            if (node.type !== 'station' || node.hideLabel) return;
            if (!isInView(node.x, node.y, 60)) return;

            var layout = resolveLabelLayout(node);
            var dx = layout.x, dy = layout.y, anchor = layout.anchor, vertical = layout.vertical;

            var text = document.createElementNS(NS, 'text');
            text.setAttribute('class', 'ed-label');
            text.setAttribute('data-kind', 'node');
            text.setAttribute('data-id', id);
            text.setAttribute('text-anchor', anchor);
            text.setAttribute('dominant-baseline', vertical);
            text.setAttribute('font-size', round2(node.cnSize || 13));
            text.setAttribute('x', dx);
            text.setAttribute('y', dy);
            text.setAttribute('style', 'stroke-width:' + round2(3 * u) + 'px');

            var cn = document.createElementNS(NS, 'tspan');
            cn.setAttribute('x', dx);
            cn.setAttribute('dy', '0');
            cn.setAttribute('font-size', round2(node.cnSize || 13));
            cn.textContent = node.cn || '';
            text.appendChild(cn);

            if (node.en) {
                var en = document.createElementNS(NS, 'tspan');
                en.setAttribute('class', 'ed-label-en');
                en.setAttribute('x', dx);
                en.setAttribute('dy', round2(Math.max((node.enSize || 10) * 1.15, 8)));
                en.setAttribute('font-size', round2(node.enSize || 10));
                en.textContent = node.en;
                text.appendChild(en);
            }
            layer.appendChild(text);
        });
    }

    function renderDraft() {
        var layer = $('draft-layer');
        clearChildren(layer);
        if (!draft) return;
        var u = unitScale();

        if (draft.points && draft.points.length) {
            var preview = draft.preview && draft.preview.length > 1 ? draft.preview : draft.points;
            var path = document.createElementNS(NS, 'path');
            path.setAttribute('d', preview.map(function (p, i) {
                return (i === 0 ? 'M' : 'L') + round2(p.x) + ',' + round2(p.y);
            }).join(' '));
            path.setAttribute('class', 'ed-guide');
            path.setAttribute('stroke-width', round2(2 * u));
            path.setAttribute('pointer-events', 'none');
            layer.appendChild(path);
        }

        (draft.points || []).forEach(function (p) {
            var c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
            c.setAttribute('r', round2(4.4 * u));
            c.setAttribute('class', 'ed-draft-point');
            c.setAttribute('stroke-width', round2(1.8 * u));
            c.setAttribute('pointer-events', 'none');
            layer.appendChild(c);
        });
    }

    /**
     * 叠加层：选中元素的控制柄
     *   · 选中节点 → 虚线圈定位提示；
     *   · 选中水域多边形 → 显示全部顶点控制柄（可拖动调整形状），
     *     并在每个顶点标出序号，配合右侧属性面板编辑。
     */
    function renderOverlay() {
        var layer = $('overlay-layer');
        clearChildren(layer);
        if (!selection || !project) return;
        var u = unitScale();

        if (selection.type === 'node') {
            // 多选时逐个绘制定位环（当前编辑的那个用实线加重）
            var ids = selectedNodeIds.length ? selectedNodeIds : [selection.id];
            ids.forEach(function (id) {
                var target = project.nodes[id];
                if (!target) return;
                var isPrimary = id === selection.id;
                var ring = document.createElementNS(NS, 'circle');
                ring.setAttribute('cx', target.x); ring.setAttribute('cy', target.y);
                ring.setAttribute('r', round2((isPrimary ? 16 : 13) * u));
                ring.setAttribute('fill', 'none');
                ring.setAttribute('stroke', 'var(--info-color)');
                ring.setAttribute('stroke-width', round2((isPrimary ? 1.6 : 1.2) * u));
                ring.setAttribute('stroke-dasharray', round2(4 * u) + ' ' + round2(3 * u));
                ring.setAttribute('opacity', isPrimary ? '1' : '0.7');
                ring.setAttribute('pointer-events', 'none');
                layer.appendChild(ring);
            });
            return;
        }

        if (selection.type === 'water') {
            renderWaterHandles(layer, findWater(selection.id), u);
            return;
        }

        if (selection.type === 'segment') {
            renderSegmentHandles(layer, findSegment(selection.id), u);
        }
    }

    /**
     * 线段折角控制柄（选中线段时显示）：
     *   · 拖动圆点沿角平分线移动即可增减该折角的圆角半径（向外→变大，向内→变小）；
     *   · 折角处另有方向指示，可用属性面板按钮或 Shift+左键点击线段翻转折角方向。
     */
    function renderSegmentHandles(layer, seg, u) {
        if (!seg || !seg.points || seg.points.length < 3) return;
        var handles = segmentCornerHandles(seg);
        if (!handles.length) return;

        handles.forEach(function (h) {
            // 折角点到控制柄的引导线
            var guide = document.createElementNS(NS, 'line');
            guide.setAttribute('x1', h.x); guide.setAttribute('y1', h.y);
            guide.setAttribute('x2', h.hx); guide.setAttribute('y2', h.hy);
            guide.setAttribute('stroke', 'var(--info-color)');
            guide.setAttribute('stroke-width', round2(1.2 * u));
            guide.setAttribute('stroke-dasharray', round2(3 * u) + ' ' + round2(3 * u));
            guide.setAttribute('opacity', '0.8');
            guide.setAttribute('pointer-events', 'none');
            layer.appendChild(guide);

            var grip = document.createElementNS(NS, 'circle');
            grip.setAttribute('cx', h.hx); grip.setAttribute('cy', h.hy);
            grip.setAttribute('r', round2(5 * u));
            grip.setAttribute('fill', 'var(--card-bg, #fff)');
            grip.setAttribute('stroke', 'var(--info-color)');
            grip.setAttribute('stroke-width', round2(2 * u));
            grip.setAttribute('class', 'ed-corner-handle');
            grip.setAttribute('data-kind', 'segment-corner');
            grip.setAttribute('data-id', seg.id);
            grip.setAttribute('data-index', h.index);
            layer.appendChild(grip);

            // 半径数值提示
            var label = document.createElementNS(NS, 'text');
            label.setAttribute('x', round2(h.hx + 8 * u));
            label.setAttribute('y', round2(h.hy - 6 * u));
            label.setAttribute('font-size', round2(9.5 * u));
            label.setAttribute('font-family', 'var(--font-sans, system-ui, sans-serif)');
            label.setAttribute('fill', 'var(--info-color)');
            label.setAttribute('pointer-events', 'none');
            label.textContent = 'R' + round2(h.radius);
            layer.appendChild(label);
        });
    }

    /** 水域多边形顶点控制柄（选中时显示，可直接拖动改形） */
    function renderWaterHandles(layer, water, u) {
        if (!water || !water.points || !water.points.length) return;
        var rOuter = 5.5 * u;
        var rInner = 3.4 * u;
        water.points.forEach(function (p, index) {
            // 轮廓虚线圈，突出当前顶点
            var halo = document.createElementNS(NS, 'circle');
            halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y);
            halo.setAttribute('r', round2(9 * u));
            halo.setAttribute('fill', 'none');
            halo.setAttribute('stroke', 'var(--info-color)');
            halo.setAttribute('stroke-width', round2(1.2 * u));
            halo.setAttribute('stroke-dasharray', round2(2.5 * u) + ' ' + round2(2.5 * u));
            halo.setAttribute('opacity', '0.75');
            halo.setAttribute('pointer-events', 'none');
            layer.appendChild(halo);

            var handle = document.createElementNS(NS, 'circle');
            handle.setAttribute('cx', p.x); handle.setAttribute('cy', p.y);
            handle.setAttribute('r', round2(rOuter));
            handle.setAttribute('fill', 'var(--card-bg, #fff)');
            handle.setAttribute('stroke', 'var(--info-color)');
            handle.setAttribute('stroke-width', round2(2 * u));
            handle.setAttribute('class', 'ed-water-handle');
            handle.setAttribute('data-kind', 'water-vertex');
            handle.setAttribute('data-id', water.id);
            handle.setAttribute('data-index', index);
            layer.appendChild(handle);

            var dot = document.createElementNS(NS, 'circle');
            dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
            dot.setAttribute('r', round2(rInner));
            dot.setAttribute('fill', 'var(--info-color)');
            dot.setAttribute('pointer-events', 'none');
            layer.appendChild(dot);

            // 顶点序号，便于与属性面板对照
            var label = document.createElementNS(NS, 'text');
            label.setAttribute('x', round2(p.x + 10 * u));
            label.setAttribute('y', round2(p.y - 7 * u));
            label.setAttribute('font-size', round2(9.5 * u));
            label.setAttribute('font-family', 'var(--font-sans, system-ui, sans-serif)');
            label.setAttribute('fill', 'var(--info-color)');
            label.setAttribute('pointer-events', 'none');
            label.textContent = String(index + 1);
            layer.appendChild(label);
        });
    }

    // ==========================================================================
    // 10. 状态栏与工具切换
    // ==========================================================================

    function toolLabel(tool) {
        switch (tool) {
            case 'select': return '选择模式';
            case 'station': return '添加车站节点';
            case 'temp': return '添加临时节点';
            case 'seg135': return '添加 135° 折角线段';
            case 'seg90': return '添加 90° 折角线段';
            case 'segaxis': return '添加轴平行直线';
            case 'segfree': return '添加自由路径';
            case 'water': return '添加水域多边形';
            default: return '绘制模式';
        }
    }

    function updateStageInfo() {
        var badge = $('canvas-badge');
        var stat = $('stage-stat');
        var mode = $('stage-mode');
        if (!badge || !stat || !mode) return;
        if (!project) {
            badge.textContent = '未创建画布';
            stat.textContent = '节点 0 · 线段 0 · 水域 0';
            mode.textContent = '等待创建画布';
            return;
        }
        badge.textContent = project.canvas.width + ' × ' + project.canvas.height + ' · ' + Math.round(view.k * 100) + '%';
        stat.textContent = '节点 ' + Object.keys(project.nodes).length +
            ' · 线段 ' + project.segments.length +
            ' · 水域 ' + project.waters.length +
            ' · 线路 ' + project.lines.length;
        mode.textContent = toolLabel(activeTool) +
            (autoRoute && activeTool.indexOf('seg') === 0 ? ' · 自动选型' : '');
    }

    function setTool(tool) {
        if (tool !== 'select') draft = null;
        activeTool = tool;
        document.querySelectorAll('.tool-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
        });
        var canvas = $('stage-canvas');
        canvas.classList.toggle('mode-select', tool === 'select');
        canvas.classList.toggle('mode-wait', tool !== 'select');
        if (tool !== 'select' && project) {
            if (tool === 'station' || tool === 'temp') toast('在画布上点击以放置' + (tool === 'station' ? '车站节点' : '临时节点'));
            if (tool === 'water') toast('依次点击添加顶点，双击或按 Enter 闭合水域');
            if (tool.indexOf('seg') === 0) toast('依次点击两个节点绘制线段，Esc 取消');
        }
        updateStageInfo();
        renderDraft();
    }

    // ==========================================================================
    // 11. 几何命中测试（不依赖浏览器 SVG 命中区域，任意缩放/主题下稳定准确）
    // ==========================================================================

    /**
     * 命中测试：依次判定 节点 → 线段 → 水域
     * @returns {{kind:string, id:string}|null}
     */
    function hitTestWorld(world) {
        if (!project) return null;
        var scale = view.k || 1;

        // 1. 节点（车站 / 临时）
        var nodeTol = 16 / scale;
        var bestNode = null, bestNodeDist = Infinity;
        Object.keys(project.nodes).forEach(function (id) {
            var n = project.nodes[id];
            var d = Math.hypot(n.x - world.x, n.y - world.y);
            if (d <= nodeTol && d < bestNodeDist) { bestNode = id; bestNodeDist = d; }
        });
        if (bestNode) return { kind: 'node', id: bestNode };

        // 2. 线段（点到折线的最短距离）
        var segTol = 11 / scale;
        var bestSeg = null, bestSegDist = Infinity;
        project.segments.forEach(function (seg) {
            var d = distanceToPolyline(world, seg.points || []);
            if (d <= segTol && d < bestSegDist) { bestSeg = seg.id; bestSegDist = d; }
        });
        if (bestSeg) return { kind: 'segment', id: bestSeg };

        // 3. 水域多边形（射线法判定内部）
        for (var i = project.waters.length - 1; i >= 0; i--) {
            if (pointInPolygon(world, project.waters[i].points || [])) {
                return { kind: 'water', id: project.waters[i].id };
            }
        }
        return null;
    }

    function distanceToSegment(p, a, b) {
        var vx = b.x - a.x, vy = b.y - a.y;
        var wx = p.x - a.x, wy = p.y - a.y;
        var len2 = vx * vx + vy * vy;
        var t = len2 === 0 ? 0 : clamp((wx * vx + wy * vy) / len2, 0, 1);
        return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
    }

    function distanceToPolyline(p, points) {
        if (!points || !points.length) return Infinity;
        if (points.length === 1) return Math.hypot(p.x - points[0].x, p.y - points[0].y);
        var best = Infinity;
        for (var i = 1; i < points.length; i++) {
            var d = distanceToSegment(p, points[i - 1], points[i]);
            if (d < best) best = d;
        }
        return best;
    }

    function pointInPolygon(p, points) {
        if (!points || points.length < 3) return false;
        var inside = false;
        for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
            var xi = points[i].x, yi = points[i].y, xj = points[j].x, yj = points[j].y;
            if (((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) inside = !inside;
        }
        return inside;
    }

    /**
     * 水域多边形顶点控制柄的命中测试。
     * 仅当该水域处于选中状态（控制柄可见）时才参与拾取，避免遮挡水域本体与其他元素。
     * @returns {{water:Object, index:number}|null}
     */
    function hitWaterVertex(world) {
        if (!project || !selection || selection.type !== 'water') return null;
        var water = findWater(selection.id);
        if (!water || !water.points || !water.points.length) return null;
        var tol = 13 / (view.k || 1);
        var best = null, bestDist = Infinity;
        water.points.forEach(function (p, index) {
            var d = Math.hypot(p.x - world.x, p.y - world.y);
            if (d <= tol && d < bestDist) { best = index; bestDist = d; }
        });
        return best === null ? null : { water: water, index: best };
    }

    /**
     * 线段折角控制柄的命中测试。
     * 仅当该线段处于选中状态（控制柄可见）时才参与拾取，避免遮挡其他元素。
     * @returns {{seg:Object, handle:Object}|null}
     */
    function hitSegmentCorner(world) {
        if (!project || !selection || selection.type !== 'segment') return null;
        var seg = findSegment(selection.id);
        if (!seg || !seg.points || seg.points.length < 3) return null;
        var tol = 14 / (view.k || 1);
        var best = null, bestDist = Infinity;
        segmentCornerHandles(seg).forEach(function (h) {
            var d = Math.hypot(h.hx - world.x, h.hy - world.y);
            if (d <= tol && d < bestDist) { best = h; bestDist = d; }
        });
        return best ? { seg: seg, handle: best } : null;
    }

    /** 查找命中位置附近的节点（绘制线段时复用已有节点） */
    function nodeNear(world, tolPx) {
        if (!project) return null;
        var tol = (tolPx || 16) / (view.k || 1);
        var best = null, bestDist = Infinity;
        Object.keys(project.nodes).forEach(function (id) {
            var n = project.nodes[id];
            var d = Math.hypot(n.x - world.x, n.y - world.y);
            if (d <= tol && d < bestDist) { best = n; bestDist = d; }
        });
        return best;
    }

    // ==========================================================================
    // 12. 交互：指针 / 触控 / 键盘
    // ==========================================================================

    function onPointerDown(ev) {
        if (!project) return;
        var canvas = $('stage-canvas');

        // 平移：中键 / 空格 / 触控双指
        if (ev.button === 1 || spaceDown || (ev.pointerType === 'touch' && pinchState)) {
            startPan(ev);
            return;
        }
        if (ev.button !== 0 && ev.pointerType === 'mouse') return;

        var world = screenToWorld(ev.clientX, ev.clientY);

        if (activeTool === 'select') {
            // Shift + 左键点击线段：快捷翻转折角方向
            if (ev.shiftKey) {
                var flipHit = hitTestWorld(world);
                if (flipHit && flipHit.kind === 'segment') {
                    selection = { type: 'segment', id: flipHit.id };
                    selectedNodeIds = [];
                    flipCornerDirection(findSegment(flipHit.id));
                    renderAll();
                    renderInspector();
                    return;
                }
            }

            // 优先拾取当前选中线段的折角控制柄（拖动即调整折角圆角半径）
            var corner = hitSegmentCorner(world);
            if (corner) {
                selection = { type: 'segment', id: corner.seg.id };
                selectedNodeIds = [];
                dragState = {
                    kind: 'segmentCorner', segId: corner.seg.id, index: corner.handle.index,
                    bisector: corner.handle.bisector,
                    startRadius: corner.handle.radius,
                    startWorld: { x: world.x, y: world.y },
                    moved: false, historyPushed: false
                };
                try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
                canvas.classList.add('resizing-corner');
                renderAll();
                renderInspector();
                return;
            }

            // 优先拾取当前选中水域多边形的顶点控制柄（拖动手柄即调整多边形形状）
            var vertex = hitWaterVertex(world);
            if (vertex) {
                selection = { type: 'water', id: vertex.water.id };
                selectedNodeIds = [];
                dragState = {
                    kind: 'waterVertex', waterId: vertex.water.id, index: vertex.index,
                    moved: false, historyPushed: false
                };
                try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
                canvas.classList.add('resizing-water');
                renderAll();
                renderInspector();
                return;
            }

            var hit = hitTestWorld(world);
            if (hit) {
                var additive = ev.shiftKey || ev.ctrlKey || ev.metaKey;
                if (hit.kind === 'node' && additive) {
                    // Shift/Ctrl + 点击：在节点选择集中增删（多选）
                    var idx = selectedNodeIds.indexOf(hit.id);
                    if (idx >= 0) selectedNodeIds.splice(idx, 1);
                    else selectedNodeIds.push(hit.id);
                    selection = null;
                    syncSelection(hit.id);
                } else {
                    selection = { type: hit.kind, id: hit.id };
                    selectedNodeIds = hit.kind === 'node' ? [hit.id] : [];
                }
                var node = hit.kind === 'node' ? project.nodes[hit.id] : null;
                if (node) {
                    dragState = {
                        kind: 'node', id: hit.id, moved: false,
                        lastX: node.x, lastY: node.y, historyPushed: false
                    };
                    try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
                }
            } else {
                clearSelection();
            }
            renderAll();
            renderInspector();
            return;
        }

        handleDrawClick(world);
    }

    function handleDrawClick(world) {
        if (activeTool === 'station' || activeTool === 'temp') {
            var p = snapPoint(world.x, world.y);
            // 该位置已有节点时仅选中，不重复创建
            var existed = findNodeAt(p.x, p.y, 8);
            if (existed) {
                selection = { type: 'node', id: existed.id };
                renderAll();
                renderInspector();
                return;
            }
            pushHistory();
            var node = createNodeAt(world.x, world.y, activeTool);
            selection = { type: 'node', id: node.id };
            renderAll();
            renderInspector();
            updateStageInfo();
            return;
        }

        if (activeTool === 'water') {
            if (!draft || draft.tool !== 'water') draft = { tool: 'water', points: [] };
            draft.points.push(snapPoint(world.x, world.y));
            renderDraft();
            updateStageInfo();
            return;
        }

        if (activeTool.indexOf('seg') === 0) handleSegmentClick(world);
    }

    function handleSegmentClick(world) {
        var hitNode = nodeNear(world, 18);

        // 自由路径：连续点击添加途径点，双击 / Enter 结束
        if (activeTool === 'segfree') {
            if (!draft || draft.tool !== 'segfree') {
                var startNode = hitNode || createNodeAt(world.x, world.y, 'station');
                if (!hitNode) pushHistory();
                draft = {
                    tool: 'segfree', startId: startNode.id,
                    points: [{ x: startNode.x, y: startNode.y, nid: startNode.id }]
                };
                renderDraft();
                updateStageInfo();
                toast('自由路径：继续点击添加转折点，双击结束');
                return;
            }
            var snapped = snapPoint(world.x, world.y);
            draft.points.push({ x: snapped.x, y: snapped.y });
            renderDraft();
            return;
        }

        if (!draft || draft.tool !== activeTool) {
            var node = hitNode || createNodeAt(world.x, world.y, 'station');
            if (!hitNode) pushHistory();
            draft = { tool: activeTool, startId: node.id, points: [{ x: node.x, y: node.y, nid: node.id }] };
            renderDraft();
            updateStageInfo();
            return;
        }

        // 第二次点击：确定终点并提交
        var endNode = hitNode || createNodeAt(world.x, world.y, 'station');
        if (endNode.id === draft.startId) { toast('起点与终点不能是同一个节点'); return; }
        commitSegment([project.nodes[draft.startId], endNode], null);
        updateStageInfo();
    }

    function handleFreePathFinish() {
        if (!draft || draft.tool !== 'segfree' || draft.points.length < 2) {
            draft = null;
            renderDraft();
            return;
        }
        var startNode = project.nodes[draft.startId];
        var lastPoint = draft.points[draft.points.length - 1];
        if (lastPoint.nid) {
            commitSegment([startNode, project.nodes[lastPoint.nid]], null);
            return;
        }
        // 终点不在已有节点上时新建车站节点承载
        var endNode = newStationNode(lastPoint.x, lastPoint.y);
        draft.points[draft.points.length - 1] = { x: endNode.x, y: endNode.y, nid: endNode.id };
        commitSegment([startNode, endNode], draft.points);
        updateStageInfo();
    }

    function startPan(ev) {
        var canvas = $('stage-canvas');
        dragState = {
            kind: 'pan',
            startX: ev.clientX, startY: ev.clientY,
            startCx: view.cx, startCy: view.cy
        };
        canvas.classList.add('panning');
        try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    }

    function onPointerMove(ev) {
        if (!project) return;
        var world = screenToWorld(ev.clientX, ev.clientY);
        pointerWorld = world;      // 记录指针位置，供 Ctrl+V 决定粘贴落点
        $('stage-coord').textContent = 'x: ' + Math.round(world.x) + ', y: ' + Math.round(world.y);

        if (dragState && dragState.kind === 'pan') {
            view.cx = dragState.startCx - (ev.clientX - dragState.startX) / view.k;
            view.cy = dragState.startCy - (ev.clientY - dragState.startY) / view.k;
            clampView();
            setViewBox();
            renderAll();
            return;
        }

        if (dragState && dragState.kind === 'node') {
            var node = project.nodes[dragState.id];
            if (!node) { dragState = null; return; }
            if (!dragState.historyPushed) { pushHistory(); dragState.historyPushed = true; }
            var snapped = snapPoint(world.x, world.y);
            node.x = snapped.x;
            node.y = snapped.y;
            // 拖动时同步线段端点；相连的自动走线线段按新位置实时重算（夹角始终保持）
            syncNodeSegments(node);
            liveRecomputeSegmentsFor(node);
            dragState.moved = true;
            renderAll();
            renderInspector();
            return;
        }

        if (dragState && dragState.kind === 'segmentCorner') {
            var cseg = findSegment(dragState.segId);
            if (!cseg) { dragState = null; return; }
            var idx = dragState.index;
            if (!cseg.points[idx]) { dragState = null; return; }
            // 沿角平分线方向的位移量即圆角半径增量（向外变大、向内变小）
            var dx2 = world.x - dragState.startWorld.x, dy2 = world.y - dragState.startWorld.y;
            var delta = dx2 * dragState.bisector.x + dy2 * dragState.bisector.y;
            var nextRadius = Math.max(0, Math.min(400, dragState.startRadius + delta));
            // 先记录「拖动前」快照，再落盘半径，撤销才能回到拖动前的圆角设置
            if (!dragState.historyPushed) { pushHistory(); dragState.historyPushed = true; }
            if (!Array.isArray(cseg.cornerRadii)) cseg.cornerRadii = segmentRadii(cseg);
            cseg.cornerRadii[idx - 1] = round2(nextRadius);
            dragState.moved = true;
            $('stage-coord').textContent = '折角 ' + idx + ' 圆角半径 ' + round2(nextRadius) + ' px';
            renderAll();
            renderCornerRadiusField(cseg, idx);
            return;
        }

        if (dragState && dragState.kind === 'waterVertex') {
            var water = findWater(dragState.waterId);
            if (!water || !water.points[dragState.index]) { dragState = null; return; }
            if (!dragState.historyPushed) { pushHistory(); dragState.historyPushed = true; }
            var vp = snapPoint(world.x, world.y);
            water.points[dragState.index].x = vp.x;
            water.points[dragState.index].y = vp.y;
            dragState.moved = true;
            $('stage-coord').textContent = '顶点 ' + (dragState.index + 1) + '：x ' + vp.x + ', y ' + vp.y;
            renderAll();
            renderWaterVertexFields(water, dragState.index);
            return;
        }

        // 绘制中的实时预览
        if (draft) {
            if (draft.tool === 'segfree') {
                var sp = snapPoint(world.x, world.y);
                draft.preview = draft.points.concat([{ x: sp.x, y: sp.y }]);
            } else if (draft.tool === 'water') {
                draft.preview = draft.points.concat([snapPoint(world.x, world.y)]);
            } else {
                var start = project.nodes[draft.startId];
                if (start) {
                    var target = nodeNear(world, 18) || snapPoint(world.x, world.y);
                    draft.preview = resolveSegmentType(start, target, activeTool).points;
                }
            }
            renderDraft();
        }
    }

    function onPointerUp(ev) {
        var canvas = $('stage-canvas');
        canvas.classList.remove('panning');
        canvas.classList.remove('resizing-water');
        if (dragState && dragState.kind === 'node' && dragState.moved) {
            // 节点拖动：把「拖动前」快照补记入历史，撤销才能回到拖动前的位置
            if (!dragState.historyPushed) pushHistory();
            toast('已移动节点');
        }
        if (dragState && dragState.kind === 'segmentCorner' && dragState.moved) {
            toast('已调整折角圆角半径为 ' + round2(segmentRadii(findSegment(dragState.segId))[dragState.index - 1]) + ' px');
            renderInspector();
        }
        if (dragState && dragState.kind === 'waterVertex' && dragState.moved) {
            toast('已调整水域多边形顶点 ' + (dragState.index + 1));
            renderInspector();
        }
        canvas.classList.remove('resizing-corner');
        dragState = null;
        try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    }

    function onDoubleClick() {
        if (!project || !draft) return;
        if (draft.tool === 'segfree') { handleFreePathFinish(); updateStageInfo(); return; }
        if (draft.tool === 'water' && draft.points.length >= 3) { commitWater(draft.points); updateStageInfo(); }
    }

    function onWheel(ev) {
        if (!project) return;
        ev.preventDefault();
        zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.12 : 1 / 1.12);
    }

    /** 触控：双指捏合缩放 */
    function touchDistance(touches) {
        var a = touches[0], b = touches[1];
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    function onTouchStart(ev) {
        if (!project) return;
        if (ev.touches.length === 2) {
            draft = null;
            pinchState = {
                dist: touchDistance(ev.touches),
                center: {
                    x: (ev.touches[0].clientX + ev.touches[1].clientX) / 2,
                    y: (ev.touches[0].clientY + ev.touches[1].clientY) / 2
                }
            };
            dragState = null;
            renderDraft();
        }
    }

    function onTouchMove(ev) {
        if (!project || !pinchState || ev.touches.length !== 2) return;
        ev.preventDefault();
        var dist = touchDistance(ev.touches);
        var factor = dist / (pinchState.dist || dist);
        pinchState.dist = dist;
        zoomAt(pinchState.center.x, pinchState.center.y, factor);
    }

    function onTouchEnd(ev) {
        if (ev.touches.length < 2) pinchState = null;
    }

    function onKeyDown(ev) {
        if (!project) return;
        var tag = (ev.target && ev.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (ev.code === 'Space') { spaceDown = true; ev.preventDefault(); return; }

        var ctrl = ev.ctrlKey || ev.metaKey;
        var key = (ev.key || '').toLowerCase();

        // ---------------- Ctrl 组合键 ----------------
        if (ctrl) {
            if (key === 'z') { ev.preventDefault(); if (ev.shiftKey) redo(); else undo(); return; }
            if (key === 'y') { ev.preventDefault(); redo(); return; }
            if (key === 's') { ev.preventDefault(); saveToLocal(true); return; }
            if (key === 'a') { ev.preventDefault(); selectAllNodes(); return; }
            if (key === 'c') { ev.preventDefault(); copySelectedNodes(false); return; }
            if (key === 'v') { ev.preventDefault(); pasteClipboardNodes(true); return; }
            if (key === 'd') { ev.preventDefault(); duplicateSelectedNodes(); return; }
            return;   // 其余 Ctrl 组合交给浏览器
        }

        if (ev.key === 'Escape') {
            draft = null;
            clearSelection();
            setTool('select');
            renderAll();
            renderInspector();
            return;
        }
        if (ev.key === 'Enter') {
            if (draft && draft.tool === 'water' && draft.points.length >= 3) { commitWater(draft.points); updateStageInfo(); return; }
            if (draft && draft.tool === 'segfree') { handleFreePathFinish(); updateStageInfo(); return; }
        }
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
            if (selectedNodeIds.length || selection) { ev.preventDefault(); deleteSelection(); }
            return;
        }

        // ---------------- 字母工具快捷键 ----------------
        var letter = key;
        if (letter === 'l') {
            // L：以「当前样式」添加线段（自动选型开启时按几何自动判定，否则用当前手动类型）
            ev.preventDefault();
            draft = null;
            var segTool = (activeTool.indexOf('seg') === 0) ? activeTool : (autoRoute ? 'segaxis' : 'seg135');
            setTool(segTool);
            toast(autoRoute
                ? '线段工具：按两端节点坐标自动选择 135°/90°/轴平行直线（Esc 退出）'
                : '线段工具：' + (SEG_META[segTool] ? SEG_META[segTool].label : '线段') + '（Esc 退出）');
            return;
        }
        if (letter === 's') { ev.preventDefault(); setTool('station'); return; }
        if (letter === 'n') { ev.preventDefault(); setTool('temp'); return; }

        // ---------------- 数字快捷键（兼容原有映射） ----------------
        var map = {
            '0': 'select', '1': 'station', '2': 'temp', '3': 'seg135',
            '4': 'seg90', '5': 'segaxis', '6': 'segfree', '7': 'water'
        };
        if (map[ev.key]) setTool(map[ev.key]);
    }

    function onKeyUp(ev) {
        if (ev.code === 'Space') spaceDown = false;
    }

    // ==========================================================================
    // 13. 属性面板与元素列表
    // ==========================================================================

    function renderInspector() {
        renderProps();
        renderList();
    }

    function renderProps() {
        var host = $('props-content');
        if (!project) {
            host.innerHTML = '<div class="prop-empty">请先创建画布。<br>创建后可在此编辑选中元素的属性。</div>';
            return;
        }
        if (!selection) {
            host.innerHTML = '<div class="prop-empty">左键点击画布中的车站节点、临时节点、线段或水域，即可在此编辑其属性。' +
                '<br><br>车站节点支持：中英文站名、站名字号、站编号、对齐方式与文本偏移。</div>';
            return;
        }
        if (selection.type === 'node') {
            // 多选节点：展示选择集摘要（单项属性仍在单选时编辑）
            if (selectedNodeIds.length > 1) return renderMultiNodeProps(host);
            return renderNodeProps(host, project.nodes[selection.id]);
        }
        if (selection.type === 'segment') return renderSegmentProps(host, findSegment(selection.id));
        if (selection.type === 'water') return renderWaterProps(host, findWater(selection.id));
    }

    /** 多选节点时的属性面板摘要 */
    function renderMultiNodeProps(host) {
        var ids = selectedNodeIds.filter(function (id) { return !!project.nodes[id]; });
        var stations = ids.filter(function (id) { return project.nodes[id].type === 'station'; }).length;
        var temps = ids.length - stations;
        var html = '';
        html += '<div class="prop-head"><span class="prop-swatch" style="background:var(--info-color)"></span>已选中 ' +
            ids.length + ' 个节点<span class="prop-tag" style="margin-left:auto">多选</span></div>';
        html += '<div class="prop-note">车站 ' + stations + ' 个，临时节点 ' + temps + ' 个。<br>' +
            'Ctrl+C 复制 · Ctrl+V 粘贴到鼠标位置 · Ctrl+D 原位复制 · Delete 删除 · Esc 取消选择。<br>' +
            '按住 Shift 或 Ctrl 点击节点可增减选择；点击单个节点可编辑其详细属性。</div>';
        html += '<div class="btn-row">' +
            '<button class="side-btn" id="btn-copy-nodes"><cgo-icon name="copy" size="14"></cgo-icon><span>复制</span></button>' +
            '<button class="side-btn" id="btn-dup-nodes"><cgo-icon name="add" size="14"></cgo-icon><span>原位复制</span></button>' +
            '</div>';
        html += '<div class="btn-row" style="margin-top:8px">' +
            '<button class="side-btn side-btn-danger" id="btn-del-nodes"><cgo-icon name="delete" size="14"></cgo-icon><span>删除所选节点</span></button>' +
            '</div>';
        host.innerHTML = html;

        var copyBtn = $('btn-copy-nodes');
        if (copyBtn) copyBtn.addEventListener('click', function () { copySelectedNodes(false); });
        var dupBtn = $('btn-dup-nodes');
        if (dupBtn) dupBtn.addEventListener('click', function () { duplicateSelectedNodes(); });
        var delBtn = $('btn-del-nodes');
        if (delBtn) delBtn.addEventListener('click', function () { deleteSelectedNodes(); });
    }

    function numberField(id, label, value, min, max, step) {
        return '<div class="prop-field"><label for="' + id + '">' + label + '</label>' +
            '<input type="number" id="' + id + '" value="' + escapeHtml(value) + '"' +
            (min == null ? '' : ' min="' + min + '"') +
            (max == null ? '' : ' max="' + max + '"') +
            ' step="' + (step == null ? 1 : step) + '"></div>';
    }

    function renderNodeProps(host, node) {
        if (!node) { host.innerHTML = '<div class="prop-empty">元素已不存在。</div>'; return; }
        var isStation = node.type === 'station';
        var tsf = isStation && isTransferNode(node.id);
        var lineIds = nodeLineIds(node.id);
        var html = '';

        html += '<div class="prop-head"><span class="prop-swatch" style="background:' +
            (isStation ? nodeColor(node.id) : '#1a1a1a') + '"></span>' +
            (isStation ? (tsf ? '换乘站' : '车站节点') : '临时节点') +
            '<span class="prop-tag" style="margin-left:auto">' + escapeHtml(node.id) + '</span></div>';

        if (tsf) {
            html += '<div class="prop-note">该车站已被 <b>' + lineIds.length + '</b> 条线路连接（' +
                escapeHtml(lineIds.map(function (lid) { var l = findLine(lid); return l ? l.name : lid; }).join('、')) +
                '），已自动切换为换乘站样式。临时节点不受此规则影响。</div>';
        }

        html += '<div class="prop-grid2">' +
            numberField('node-x', 'X 坐标', node.x) +
            numberField('node-y', 'Y 坐标', node.y) +
            '</div>';

        if (!isStation) {
            html += '<p class="side-hint">临时节点以黑色 × 表示，不参与站名与换乘站样式判定，可作为自由路径的转折锚点。</p>';
            host.innerHTML = html;
            bindNodeProps(node, false);
            return;
        }

        html += '<div class="prop-field"><label for="node-code">站编号</label>' +
            '<input type="text" id="node-code" value="' + escapeHtml(node.code || '') + '" maxlength="24" placeholder="如 M101"></div>';

        html += '<div class="prop-field"><label for="node-cn">中文站名</label>' +
            '<input type="text" id="node-cn" value="' + escapeHtml(node.cn || '') + '" maxlength="40" placeholder="如 人民广场"></div>';

        html += '<div class="prop-field"><label for="node-en">英文站名</label>' +
            '<input type="text" id="node-en" value="' + escapeHtml(node.en || '') + '" maxlength="60" placeholder="如 People\'s Square"></div>';

        html += '<div class="prop-grid2">' +
            numberField('node-cn-size', '中文字号', node.cnSize || 13, 6, 48, 0.5) +
            numberField('node-en-size', '英文字号', node.enSize || 10, 6, 40, 0.5) +
            '</div>';

        // 所属线路：车站可归属多条线路（列表 + 添加控件），描边色取列表中第一条
        var ownLineIds = nodeLineList(node);
        var ownLines = ownLineIds.map(function (id) { return findLine(id); }).filter(Boolean);
        var connectedLines = nodeLineIds(node.id);
        html += '<div class="prop-field"><label>所属线路（' + ownLines.length + '）</label>';
        if (!ownLines.length) {
            html += '<p class="side-hint">尚未设置所属线路。车站描边色优先取实际连接的线路色，未连线时取所属线路首条的颜色。</p>';
        } else {
            html += '<div class="line-chip-list">';
            ownLines.forEach(function (line, index) {
                html += '<div class="line-chip">' +
                    '<span class="line-chip-color" style="background:' + escapeHtml(line.color) + '"></span>' +
                    '<span class="line-chip-name">' + escapeHtml(line.name) + '</span>' +
                    (index === 0 ? '<span class="line-chip-tag">描边色</span>' : '') +
                    '<button class="line-chip-del" data-remove-line="' + line.id + '" title="移除该线路">' +
                    '<cgo-icon name="close" size="12"></cgo-icon></button>' +
                    '</div>';
            });
            html += '</div>';
        }
        var addable = project.lines.filter(function (l) { return ownLineIds.indexOf(l.id) < 0; });
        html += '<div class="line-add-row">' +
            '<select id="node-line-add"' + (addable.length ? '' : ' disabled') + '>' +
            (addable.length
                ? addable.map(function (l) {
                    return '<option value="' + l.id + '">' + escapeHtml(l.name) + '（' + escapeHtml(l.color) + '）</option>';
                }).join('')
                : '<option value="">（已包含全部线路）</option>') +
            '</select>' +
            '<button class="side-btn" id="btn-node-line-add"' + (addable.length ? '' : ' disabled') + ' title="把该车站加入所选线路">' +
            '<cgo-icon name="add" size="14"></cgo-icon><span>加入</span></button>' +
            '</div>';
        if (connectedLines.length && connectedLines.length > ownLines.length) {
            html += '<p class="side-hint">该车站被 ' + connectedLines.length + ' 条线路的线段连接，已自动并入所属线路。' +
                '换乘站判定取「连接线路 ∪ 所属线路」的并集，达到 2 条即显示换乘站样式。</p>';
        }
        html += '</div>';

        // 站名定位方式：对齐方式（自动排布）/ 指定坐标（精确控制），两种模式互斥
        var freeMode = node.labelPos === 'free';
        html += '<div class="prop-field"><label for="node-label-pos">站名定位方式</label><select id="node-label-pos">' +
            '<option value="align"' + (freeMode ? '' : ' selected') + '>对齐方式（自动排布）</option>' +
            '<option value="free"' + (freeMode ? ' selected' : '') + '>指定坐标（精确控制）</option>' +
            '</select></div>';

        if (!freeMode) {
            // 对齐方式模式：只提供对齐与偏移，不显示坐标控件
            html += '<div class="prop-field"><label for="node-align">站名对齐方式</label><select id="node-align">' +
                ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].map(function (v) {
                    var label = {
                        'top': '上方居中', 'bottom': '下方居中', 'left': '左侧', 'right': '右侧',
                        'top-left': '左上方', 'top-right': '右上方', 'bottom-left': '左下方', 'bottom-right': '右下方'
                    }[v];
                    return '<option value="' + v + '"' + ((node.align || 'top') === v ? ' selected' : '') + '>' + label + '</option>';
                }).join('') + '</select></div>';

            html += '<div class="prop-grid2">' +
                numberField('node-offset-x', '文本偏移 X', node.offsetX == null ? 0 : node.offsetX, -200, 200, 1) +
                numberField('node-offset-y', '文本偏移 Y', node.offsetY == null ? 0 : node.offsetY, -200, 200, 1) +
                '</div>';
        } else {
            // 指定坐标模式：站名位置完全由填入的坐标控制
            var cur = resolveLabelLayout(
                node.labelX == null || node.labelY == null
                    ? Object.assign({}, node, { labelPos: 'align' })
                    : node
            );
            var labelX = node.labelX == null ? cur.x : node.labelX;
            var labelY = node.labelY == null ? cur.y : node.labelY;
            html += '<div class="prop-grid2">' +
                numberField('node-label-x', '站名坐标 X', labelX, -20000, 20000, 1) +
                numberField('node-label-y', '站名坐标 Y', labelY, -20000, 20000, 1) +
                '</div>';
            html += '<p class="side-hint">站名位置由上面填入的坐标直接控制，不再随站点移动而偏移。' +
                '中英文两行仍以该坐标作为基准，可用右侧「基准」调整水平/垂直对齐。</p>';
            html += '<div class="prop-field"><label for="node-align">行内基准</label><select id="node-align">' +
                ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].map(function (v) {
                    var label = {
                        'top': '上方居中', 'bottom': '下方居中', 'left': '左侧', 'right': '右侧',
                        'top-left': '左上方', 'top-right': '右上方', 'bottom-left': '左下方', 'bottom-right': '右下方'
                    }[v];
                    return '<option value="' + v + '"' + ((node.align || 'top') === v ? ' selected' : '') + '>' + label + '</option>';
                }).join('') + '</select></div>';
            html += '<div class="btn-row" style="margin-bottom:10px">' +
                '<button class="side-btn" id="btn-label-from-node">' +
                '<cgo-icon name="location" size="14"></cgo-icon><span>取当前自动位置</span></button></div>';
        }

        html += '<label class="check-row" style="margin:6px 0 12px"><input type="checkbox" id="node-hide-label"' +
            (node.hideLabel ? ' checked' : '') + '><span>隐藏站名标签</span></label>';

        html += '<div class="btn-row">' +
            '<button class="side-btn" id="btn-focus-node"><cgo-icon name="location" size="14"></cgo-icon><span>居中显示</span></button>' +
            '<button class="side-btn side-btn-danger" id="btn-del-node"><cgo-icon name="delete" size="14"></cgo-icon><span>删除节点</span></button>' +
            '</div>';

        host.innerHTML = html;
        bindNodeProps(node, true);
    }

    function bindNodeProps(node, isStation) {
        // 同一输入框的 change 已记录历史后，紧随其后的 input 不应再次记录，
        // 否则会误清空重做栈，导致「撤销后无法重做」。
        var historyPushed = false;
        function onChange(id, handler) {
            var el = $(id);
            if (!el) return;
            el.addEventListener('change', function () {
                withHistory(function () { handler(el.value); });
                historyPushed = true;
                renderAll();
                renderList();
                updateStageInfo();
            });
            el.addEventListener('input', function () {
                if (historyPushed) return;      // 本次编辑已入栈，避免重复记录
                handler(el.value);
                renderAll();
                updateStageInfo();
            });
        }

        onChange('node-x', function (v) { node.x = round2(parseFloat(v) || 0); syncNodeSegments(node); });
        onChange('node-y', function (v) { node.y = round2(parseFloat(v) || 0); syncNodeSegments(node); });

        if (!isStation) return;

        onChange('node-code', function (v) { node.code = v; });
        onChange('node-cn', function (v) { node.cn = v; });
        onChange('node-en', function (v) { node.en = v; });
        onChange('node-cn-size', function (v) { node.cnSize = clamp(parseFloat(v) || 13, 6, 48); });
        onChange('node-en-size', function (v) { node.enSize = clamp(parseFloat(v) || 10, 6, 40); });
        onChange('node-align', function (v) { node.align = v; });
        onChange('node-offset-x', function (v) { node.offsetX = parseFloat(v) || 0; });
        onChange('node-offset-y', function (v) { node.offsetY = parseFloat(v) || 0; });

        // 所属线路：加入 / 移除（车站可归属多条线路，首条决定描边色）
        var addLineBtn = $('btn-node-line-add');
        var addLineSel = $('node-line-add');
        if (addLineBtn && addLineSel) {
            addLineBtn.addEventListener('click', function () {
                var lineId = addLineSel.value;
                if (!lineId) return;
                if (nodeLineList(node).indexOf(lineId) >= 0) { toast('该线路已在此车站的所属线路中'); return; }
                withHistory(function () { addLineToNode(node, lineId); });
                renderAll();
                renderInspector();
                toast('已把「' + (findLine(lineId) ? findLine(lineId).name : lineId) + '」加入所属线路');
            });
        }
        document.querySelectorAll('[data-remove-line]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var lineId = btn.getAttribute('data-remove-line');
                if (nodeLineList(node).indexOf(lineId) < 0) return;
                withHistory(function () { removeLineFromNode(node, lineId); });
                renderAll();
                renderInspector();
                toast('已从所属线路中移除');
            });
        });

        // 站名定位方式切换：切换后立即重建面板，只呈现该模式对应的控件
        var posSel = $('node-label-pos');
        if (posSel) {
            posSel.addEventListener('change', function () {
                pushHistory();
                if (posSel.value === 'free') {
                    // 切到「指定坐标」时，以当前自动排布位置作为初始坐标，避免站名跳动
                    var cur = resolveLabelLayout(Object.assign({}, node, { labelPos: 'align' }));
                    node.labelX = cur.x;
                    node.labelY = cur.y;
                    node.labelPos = 'free';
                } else {
                    node.labelPos = 'align';
                }
                renderAll();
                renderInspector();
            });
        }

        // 指定坐标：直接写入并重绘当前标签，不重建面板（避免打断连续输入）
        function bindLabelCoord(id, axis) {
            var el = $(id);
            if (!el) return;
            function apply() {
                var v = round2(parseFloat(el.value) || 0);
                if (axis === 'x') node.labelX = v; else node.labelY = v;
                renderAll();
            }
            el.addEventListener('input', apply);
            el.addEventListener('change', function () { withHistory(apply); });
        }
        bindLabelCoord('node-label-x', 'x');
        bindLabelCoord('node-label-y', 'y');

        var labelFromNode = $('btn-label-from-node');
        if (labelFromNode) {
            labelFromNode.addEventListener('click', function () {
                pushHistory();
                var cur = resolveLabelLayout(Object.assign({}, node, { labelPos: 'align' }));
                node.labelX = cur.x;
                node.labelY = cur.y;
                renderAll();
                renderInspector();
                toast('已取用当前自动排布位置作为站名坐标');
            });
        }

        var hide = $('node-hide-label');
        if (hide) {
            hide.addEventListener('change', function () {
                pushHistory();
                node.hideLabel = hide.checked;
                renderAll();
            });
        }

        var focusBtn = $('btn-focus-node');
        if (focusBtn) focusBtn.addEventListener('click', function () { centerOn(node.x, node.y); });

        var delBtn = $('btn-del-node');
        if (delBtn) {
            delBtn.addEventListener('click', function () {
                selection = { type: 'node', id: node.id };
                deleteSelection();
            });
        }
    }

    function renderSegmentProps(host, seg) {
        if (!seg) { host.innerHTML = '<div class="prop-empty">元素已不存在。</div>'; return; }
        var line = findLine(seg.lineId);
        var meta = SEG_META[seg.type] || SEG_META.segfree;
        var ends = [seg.points[0], seg.points[seg.points.length - 1]];
        var endNodes = ends.map(function (p) { return p && p.nid ? project.nodes[p.nid] : null; });

        var html = '';
        html += '<div class="prop-head"><span class="prop-swatch" style="background:' + (line ? line.color : '#006098') + '"></span>' +
            escapeHtml(meta.label) + '<span class="prop-tag" style="margin-left:auto">' + escapeHtml(seg.id) + '</span></div>';

        html += '<div class="prop-field"><label for="seg-line">所属线路</label><select id="seg-line">' +
            project.lines.map(function (l) {
                return '<option value="' + l.id + '"' + (l.id === seg.lineId ? ' selected' : '') + '>' +
                    escapeHtml(l.name) + '（' + escapeHtml(l.color) + '）</option>';
            }).join('') + '</select></div>';

        html += '<div class="prop-field"><label for="seg-type">线段类型</label><select id="seg-type">' +
            Object.keys(SEG_META).filter(function (k) { return k !== 'auto'; }).map(function (k) {
                return '<option value="' + k + '"' + (seg.type === k ? ' selected' : '') + '>' + SEG_META[k].label + '</option>';
            }).join('') + '</select></div>';

        html += '<div class="prop-field"><label>端点</label><div class="prop-note">' +
            endNodes.map(function (n) {
                if (!n) return '空';
                if (n.type === 'temp') return '临时节点 ' + escapeHtml(n.id);
                return escapeHtml(n.cn || n.id) + '（' + escapeHtml(n.id) + '）';
            }).join(' → ') + '</div></div>';

        html += '<p class="side-hint">折线共 ' + seg.points.length + ' 个节点，长度约 ' +
            Math.round(polylineLength(seg.points)) + ' px。修改类型会按两端坐标重新生成折角走线。</p>';

        // ---- 折角调整控件：圆角大小 + 折角方向 ----
        var corners = [];
        var ci;
        for (ci = 1; ci < seg.points.length - 1; ci++) corners.push(ci);
        if (corners.length) {
            var radii = segmentRadii(seg);
            html += '<div class="list-group-title">折角调整（' + corners.length + '）</div>';
            var canFlip = hasCornerDirection(seg);
            corners.forEach(function (pointIndex, order) {
                var isRight = isRightAngleCorner(seg.points[pointIndex - 1], seg.points[pointIndex], seg.points[pointIndex + 1]);
                html += '<div class="corner-row">' +
                    '<span class="corner-index">' + (order + 1) + '</span>' +
                    '<span class="corner-kind">' + (isRight ? '90°' : '135°') + '</span>' +
                    '<input type="number" class="corner-radius-input" data-corner="' + pointIndex + '" min="0" max="400" step="1" value="' +
                    round2(radii[order]) + '" title="折角 ' + (order + 1) + ' 的圆角半径（px）">' +
                    '<span class="corner-unit">px</span>' +
                    '</div>';
            });
            html += '<div class="btn-row">' +
                '<button class="side-btn" id="btn-flip-corner"' + (canFlip ? '' : ' disabled') +
                ' title="翻转折角方向（也可 Shift+左键点击线段快捷切换）">' +
                '<cgo-icon name="reverse" size="14"></cgo-icon><span>翻折角方向</span></button>' +
                '<button class="side-btn" id="btn-reset-corner"><cgo-icon name="refresh" size="14"></cgo-icon><span>默认圆角</span></button>' +
                '</div>';
            html += '<p class="side-hint">拖动线段上的折角控制柄可直观调整圆角大小；' +
                (canFlip ? '按 Shift+左键点击线段或点「翻折角方向」可切换折角朝向。' : '当前线段没有另一种折角方向可选（直线或对折角线）。') +
                '</p>';
        }

        html += '<div class="btn-row">' +
            '<button class="side-btn" id="btn-reselect-seg"><cgo-icon name="refresh" size="14"></cgo-icon><span>重算走线</span></button>' +
            '<button class="side-btn side-btn-danger" id="btn-del-seg"><cgo-icon name="delete" size="14"></cgo-icon><span>删除线段</span></button>' +
            '</div>';

        host.innerHTML = html;

        // 折角圆角半径输入：首次编辑即记录「修改前」快照，保证撤销回到修改前
        host.querySelectorAll('.corner-radius-input').forEach(function (input) {
            var pushed = false;
            function apply() {
                var pointIndex = parseInt(input.getAttribute('data-corner'), 10);
                var value = Math.max(0, Math.min(400, parseFloat(input.value) || 0));
                if (!Array.isArray(seg.cornerRadii)) seg.cornerRadii = segmentRadii(seg);
                seg.cornerRadii[pointIndex - 1] = round2(value);
                renderAll();
            }
            input.addEventListener('input', function () {
                if (!pushed) { pushHistory(); pushed = true; }
                apply();
            });
            input.addEventListener('change', function () {
                if (!pushed) pushHistory();
                pushed = false;
                apply();
            });
        });

        var flipBtn = $('btn-flip-corner');
        if (flipBtn) flipBtn.addEventListener('click', function () { withHistory(function () { flipCornerDirection(seg); }); });

        var resetBtn = $('btn-reset-corner');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                withHistory(function () { seg.cornerRadii = null; });
                renderAll();
                renderInspector();
                toast('已恢复默认圆角半径（90° 折角 18px / 135° 折角 8px）');
            });
        }

        var lineSel = $('seg-line');
        if (lineSel) lineSel.addEventListener('change', function () {
            var oldLineId = seg.lineId;
            withHistory(function () {
                seg.lineId = lineSel.value;
                syncSegmentEndNodeLines(seg, oldLineId);
            });
            renderAll();
            renderInspector();
        });

        var typeSel = $('seg-type');
        if (typeSel) typeSel.addEventListener('change', function () {
            withHistory(function () {
                seg.type = typeSel.value;
                applySegmentType(seg);
            });
            renderAll();
            renderInspector();
        });

        var reselect = $('btn-reselect-seg');
        if (reselect) reselect.addEventListener('click', function () {
            withHistory(function () { applySegmentType(seg); });
            renderAll();
            toast('已按当前类型重新生成走线');
        });

        var del = $('btn-del-seg');
        if (del) del.addEventListener('click', function () {
            selection = { type: 'segment', id: seg.id };
            deleteSelection();
        });
    }

    /** 按当前类型重算线段走线（保留两端节点绑定） */
    function applySegmentType(seg) {
        var pts = seg.points || [];
        if (pts.length < 2) return;
        var a = pts[0], b = pts[pts.length - 1];
        var type = (!SEG_META[seg.type] || seg.type === 'segfree') ? 'segaxis' : seg.type;
        seg.type = type;
        // 手动指定折角类型即视为自动走线线段，后续节点移动会持续按该类型重算
        seg.routed = true;
        var routed = routeBetweenByType(a, b, type);
        var newPts = routed.map(function (p) { return { x: p.x, y: p.y }; });
        newPts[0] = { x: a.x, y: a.y };
        newPts[newPts.length - 1] = { x: b.x, y: b.y };
        if (a.nid) newPts[0].nid = a.nid;
        if (b.nid) newPts[newPts.length - 1].nid = b.nid;
        seg.points = newPts;
    }

    /** 拖动折角控制柄过程中同步属性面板中的半径输入框（避免重建面板打断拖动） */
    function renderCornerRadiusField(seg, pointIndex) {
        var host = $('props-content');
        if (!host || !seg) return;
        var input = host.querySelector('.corner-radius-input[data-corner="' + pointIndex + '"]');
        if (!input) return;
        var radii = segmentRadii(seg);
        var value = radii[pointIndex - 1];
        if (value != null) input.value = round2(value);
    }

    function renderWaterProps(host, water) {
        if (!water) { host.innerHTML = '<div class="prop-empty">元素已不存在。</div>'; return; }
        var html = '';
        html += '<div class="prop-head"><span class="prop-swatch" style="background:' + (water.fill || WATER_DEFAULT.fill) + '"></span>水域多边形' +
            '<span class="prop-tag" style="margin-left:auto">' + escapeHtml(water.id) + '</span></div>';
        html += '<div class="prop-field"><label for="water-name">名称</label><input type="text" id="water-name" value="' +
            escapeHtml(water.name || '') + '" maxlength="30"></div>';
        html += '<div class="prop-field"><label for="water-fill">填充色</label><input type="color" id="water-fill" value="' +
            escapeHtml(water.fill || WATER_DEFAULT.fill) + '"></div>';
        html += '<div class="prop-field"><label for="water-opacity">不透明度（0.05 ~ 1）</label><input type="number" id="water-opacity" min="0.05" max="1" step="0.05" value="' +
            (water.opacity == null ? WATER_DEFAULT.opacity : water.opacity) + '"></div>';
        html += '<p class="side-hint">共 ' + water.points.length + ' 个顶点，画布上已显示顶点控制柄，直接拖动即可调整形状；' +
            '也可在下方逐点精确输入坐标。水域作为底图装饰层渲染，建议置于线路与站点之下。</p>';

        // 顶点坐标表：与画布上的控制柄一一对应
        html += '<div class="list-group-title">顶点坐标（' + water.points.length + '）</div>';
        html += '<div class="water-vertex-list">';
        water.points.forEach(function (p, index) {
            html += '<div class="water-vertex-row">' +
                '<span class="vertex-index">' + (index + 1) + '</span>' +
                '<input type="number" class="vertex-input" data-vertex="' + index + '" data-axis="x" value="' + round2(p.x) + '" title="顶点 ' + (index + 1) + ' 的 X 坐标">' +
                '<input type="number" class="vertex-input" data-vertex="' + index + '" data-axis="y" value="' + round2(p.y) + '" title="顶点 ' + (index + 1) + ' 的 Y 坐标">' +
                '</div>';
        });
        html += '</div>';

        html += '<div class="btn-row" style="margin-top:10px">' +
            '<button class="side-btn side-btn-danger" id="btn-del-water">' +
            '<cgo-icon name="delete" size="14"></cgo-icon><span>删除水域</span></button></div>';
        host.innerHTML = html;

        function bind(id, handler) {
            var el = $(id);
            if (!el) return;
            el.addEventListener('input', function () { handler(el.value); renderAll(); });
        }
        bind('water-name', function (v) { water.name = v; });
        bind('water-fill', function (v) { water.fill = v; });
        bind('water-opacity', function (v) { water.opacity = clamp(parseFloat(v) || 0.5, 0.05, 1); });

        // 顶点坐标输入：首次编辑即记录「修改前」快照，改动后立即更新多边形形状
        host.querySelectorAll('.vertex-input').forEach(function (input) {
            var pushed = false;
            function apply() {
                var index = parseInt(input.getAttribute('data-vertex'), 10);
                var axis = input.getAttribute('data-axis');
                var value = round2(parseFloat(input.value) || 0);
                if (!water.points[index]) return;
                water.points[index][axis] = value;
                renderAll();
            }
            input.addEventListener('input', function () {
                if (!pushed) { pushHistory(); pushed = true; }
                apply();
            });
            input.addEventListener('change', function () {
                if (!pushed) pushHistory();
                pushed = false;
                apply();
            });
        });

        var del = $('btn-del-water');
        if (del) del.addEventListener('click', function () {
            selection = { type: 'water', id: water.id };
            deleteSelection();
        });
    }

    /** 拖动顶点过程中同步属性面板中的坐标输入框（避免每次重建面板打断拖动） */
    function renderWaterVertexFields(water, index) {
        if (!water || index == null) return;
        var host = $('props-content');
        if (!host) return;
        var row = host.querySelector('.vertex-input[data-vertex="' + index + '"][data-axis="x"]');
        if (!row) return;
        var p = water.points[index];
        if (!p) return;
        row.value = round2(p.x);
        var rowY = host.querySelector('.vertex-input[data-vertex="' + index + '"][data-axis="y"]');
        if (rowY) rowY.value = round2(p.y);
    }

    function renderList() {
        var host = $('list-content');
        if (!project) { host.innerHTML = '<div class="prop-empty">尚未创建画布。</div>'; return; }
        var html = '';

        html += '<div class="list-group-title">线路（' + project.lines.length + '）</div>';
        if (!project.lines.length) html += '<p class="side-hint">暂无线路，绘制线段时会自动创建。</p>';
        project.lines.forEach(function (line) {
            var count = project.segments.filter(function (s) { return s.lineId === line.id; }).length;
            html += '<button class="list-item" data-jump="line" data-id="' + line.id + '">' +
                '<span class="li-dot" style="background:' + line.color + ';border-color:' + line.color + '"></span>' +
                '<span class="li-name">' + escapeHtml(line.name) + '</span>' +
                '<span class="li-meta">' + count + ' 段</span></button>';
        });

        var nodeIds = Object.keys(project.nodes);
        html += '<div class="list-group-title">节点（' + nodeIds.length + '）</div>';
        if (!nodeIds.length) html += '<p class="side-hint">暂无节点。</p>';
        nodeIds.forEach(function (id) {
            var node = project.nodes[id];
            var isTemp = node.type === 'temp';
            var tsf = !isTemp && isTransferNode(id);
            html += '<button class="list-item' + (isSelected('node', id) ? ' active' : '') + '" data-jump="node" data-id="' + id + '">' +
                (isTemp ? '<span class="li-dot temp">×</span>' :
                    '<span class="li-dot" style="background:' + nodeColor(id) + ';border-color:' + nodeColor(id) + '"></span>') +
                '<span class="li-name">' + (isTemp ? '临时节点' : escapeHtml(node.cn || '车站')) + '</span>' +
                '<span class="li-meta">' + escapeHtml(isTemp ? id : (node.code || id)) + (tsf ? ' · 换乘' : '') + '</span></button>';
        });

        html += '<div class="list-group-title">线段（' + project.segments.length + '）</div>';
        if (!project.segments.length) html += '<p class="side-hint">暂无线段。</p>';
        project.segments.forEach(function (seg) {
            var line = findLine(seg.lineId);
            var meta = SEG_META[seg.type] || SEG_META.segfree;
            var ends = [seg.points[0], seg.points[seg.points.length - 1]];
            var names = ends.map(function (p) {
                var n = p && p.nid ? project.nodes[p.nid] : null;
                if (!n) return '空';
                return n.type === 'temp' ? '临时节点' : (n.cn || n.id);
            });
            html += '<button class="list-item' + (isSelected('segment', seg.id) ? ' active' : '') + '" data-jump="segment" data-id="' + seg.id + '">' +
                '<span class="li-dot" style="background:' + (line ? line.color : '#006098') + ';border-color:' + (line ? line.color : '#006098') + '"></span>' +
                '<span class="li-name">' + escapeHtml(names.join(' → ')) + '</span>' +
                '<span class="li-meta">' + escapeHtml(meta.label) + '</span></button>';
        });

        html += '<div class="list-group-title">水域（' + project.waters.length + '）</div>';
        if (!project.waters.length) html += '<p class="side-hint">暂无水域。</p>';
        project.waters.forEach(function (water) {
            html += '<button class="list-item' + (isSelected('water', water.id) ? ' active' : '') + '" data-jump="water" data-id="' + water.id + '">' +
                '<span class="li-dot" style="background:' + (water.fill || WATER_DEFAULT.fill) + ';border-color:' + (water.fill || WATER_DEFAULT.fill) + '"></span>' +
                '<span class="li-name">' + escapeHtml(water.name || water.id) + '</span>' +
                '<span class="li-meta">' + water.points.length + ' 顶点</span></button>';
        });

        host.innerHTML = html;
        host.querySelectorAll('[data-jump]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var kind = btn.getAttribute('data-jump');
                var id = btn.getAttribute('data-id');
                if (kind === 'line') {
                    activeLineId = id;
                    syncLineSelect();
                    toast('已切换当前线路');
                    return;
                }
                selection = { type: kind, id: id };
                var target = kind === 'node' ? project.nodes[id] : (kind === 'segment' ? findSegment(id) : findWater(id));
                if (target && kind === 'node') centerOn(target.x, target.y);
                if (target && (kind === 'segment' || kind === 'water')) {
                    var cx = 0, cy = 0;
                    target.points.forEach(function (p) { cx += p.x; cy += p.y; });
                    centerOn(cx / target.points.length, cy / target.points.length);
                }
                renderAll();
                renderInspector();
            });
        });
    }

    // ==========================================================================
    // 14. 线路控件
    // ==========================================================================

    function syncLineSelect() {
        var sel = $('sel-line');
        if (!sel || !project) return;
        if (!project.lines.length) {
            var created = createLine(null, null);
            activeLineId = created.id;
        }
        sel.innerHTML = project.lines.map(function (l) {
            return '<option value="' + l.id + '">' + escapeHtml(l.name) + '</option>';
        }).join('');
        if (!activeLineId || !findLine(activeLineId)) activeLineId = project.lines[0].id;
        sel.value = activeLineId;
        var line = findLine(activeLineId);
        if (line) {
            $('line-color').value = line.color;
            $('line-name').value = line.name;
        }
    }

    function bindLineControls() {
        $('sel-line').addEventListener('change', function () {
            activeLineId = this.value;
            var line = findLine(activeLineId);
            if (line) {
                $('line-color').value = line.color;
                $('line-name').value = line.name;
            }
            updateStageInfo();
        });

        $('line-color').addEventListener('input', function () {
            var line = findLine(activeLineId);
            if (!line) return;
            line.color = this.value;
            renderAll();
            renderList();
        });

        $('line-name').addEventListener('input', function () {
            var line = findLine(activeLineId);
            if (!line) return;
            line.name = this.value || '未命名线路';
            syncLineSelect();
            renderList();
        });

        $('btn-add-line').addEventListener('click', function () {
            if (!project) { toast('请先创建画布'); return; }
            pushHistory();
            var line = createLine('线路' + (project.lines.length + 1), LINE_PALETTE[project.lines.length % LINE_PALETTE.length]);
            activeLineId = line.id;
            syncLineSelect();
            renderAll();
            renderList();
            toast('已新建线路：' + line.name);
        });

        $('btn-del-line').addEventListener('click', function () {
            if (!project || !activeLineId) return;
            var line = findLine(activeLineId);
            if (!line) return;
            if (!window.confirm('删除线路「' + line.name + '」将同时移除其全部线段，是否继续？')) return;
            pushHistory();
            project.segments = project.segments.filter(function (s) { return s.lineId !== activeLineId; });
            project.lines = project.lines.filter(function (l) { return l.id !== activeLineId; });
            activeLineId = project.lines.length ? project.lines[0].id : null;
            clearSelection();
            syncLineSelect();
            renderAll();
            renderInspector();
            toast('已删除线路');
        });
    }

    // ==========================================================================
    // 15. 工程管理：新建 / 保存 / 导入 / 导出
    // ==========================================================================

    function createCanvas(width, height, silent) {
        var w = clamp(Math.round(width) || 2000, 200, 20000);
        var h = clamp(Math.round(height) || 1500, 200, 20000);
        project = createProject(w, h);
        $('canvas-width').value = w;
        $('canvas-height').value = h;
        undoStack.length = 0;
        redoStack.length = 0;
        clearSelection();
        draft = null;
        syncLineSelect();
        resetView();
        viewFitted = true;
        renderInspector();
        syncTopButtons();
        $('stage-empty').hidden = true;
        scheduleFit();
        if (!silent) toast('已创建 ' + w + ' × ' + h + ' 画布，原点 O 位于左上角顶点');
    }

    /** 读取并规范化「画布」输入框中的宽高 */
    function canvasInputSize() {
        var w = clamp(Math.round(parseFloat($('canvas-width').value)) || 2000, 200, 20000);
        var h = clamp(Math.round(parseFloat($('canvas-height').value)) || 1500, 200, 20000);
        return { w: w, h: h };
    }

    /**
     * 应用画布尺寸到当前画布：
     *   · 只改画布尺寸，不新建工程、不清空内容；
     *   · 画布上已有元素（节点 / 线段 / 水域）的坐标一律不动，不做缩放、重排或居中；
     *   · 视图也不做任何自动调整（不重新适配、不重置缩放与平移），仅同步新尺寸带来的边界；
     *   · 已在画布内的内容保持原样，超出新边界的部分仍可平移查看。
     */
    function applyCanvasSize(width, height, silent) {
        var size = (width == null || height == null) ? canvasInputSize() : { w: width, h: height };
        var w = clamp(Math.round(size.w) || 2000, 200, 20000);
        var h = clamp(Math.round(size.h) || 1500, 200, 20000);

        if (!project) {
            // 尚无画布时，等同于建立一块空画布
            createCanvas(w, h, silent);
            return;
        }
        if (project.canvas.width === w && project.canvas.height === h) {
            if (!silent) toast('画布尺寸未改变：' + w + ' × ' + h);
            return;
        }

        pushHistory();
        project.canvas.width = w;
        project.canvas.height = h;
        $('canvas-width').value = w;
        $('canvas-height').value = h;

        // 只重绘新尺寸下的画布内容：不调用 clampView/resetView，
        // 不重新锁定 SVG 尺寸，也不调整缩放与平移，因此画布上已有元素与视图完全不动。
        renderAll();
        if (!silent) toast('画布尺寸已更新为 ' + w + ' × ' + h + '（画布内容与视图保持不变）');
    }

    /** 用当前输入框中的尺寸新建一块空画布（会清空工程内容） */
    function newCanvasFromInputs() {
        var size = canvasInputSize();
        if (project && (Object.keys(project.nodes).length || project.segments.length || project.waters.length)) {
            if (!window.confirm('新建空白画布会清空当前工程内容，是否继续？（可先保存到本地）')) return;
        }
        createCanvas(size.w, size.h);
    }

    function saveToLocal(notify) {
        if (!project) { toast('请先创建画布'); return; }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
            if (notify) toast('已保存到浏览器本地');
        } catch (e) {
            toast('保存失败：' + e.message);
        }
    }

    function loadFromLocal() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            var data = JSON.parse(raw);
            if (!data || !data.canvas) return false;
            project = normalizeProject(data);
            activeLineId = project.lines.length ? project.lines[0].id : null;
            syncLineSelect();
            resetView();
            viewFitted = true;
            renderInspector();
            $('stage-empty').hidden = true;
            toast('已恢复上次编辑的工程');
            return true;
        } catch (e) {
            return false;
        }
    }

    /** 工程数据校验与补全，保证导入文件健壮 */
    function normalizeProject(data) {
        var base = createProject(data.canvas.width || 2000, data.canvas.height || 1500);
        base.nodes = (data.nodes && typeof data.nodes === 'object') ? data.nodes : {};
        base.segments = Array.isArray(data.segments) ? data.segments : [];
        base.waters = Array.isArray(data.waters) ? data.waters : [];
        base.lines = Array.isArray(data.lines) ? data.lines : [];
        base.idSeq = data.idSeq || 1;
        if (!base.lines.length && base.segments.length) {
            var line = { id: 'L' + (base.idSeq++), name: '线路1', color: LINE_PALETTE[0] };
            base.lines.push(line);
            base.segments.forEach(function (s) { if (!s.lineId) s.lineId = line.id; });
        }
        Object.keys(base.nodes).forEach(function (id) {
            var n = base.nodes[id];
            n.id = id;
            if (n.x == null) n.x = 0;
            if (n.y == null) n.y = 0;
            if (!n.type) n.type = 'station';
            // 站名定位方式缺省为「对齐方式」，兼容早期工程与外部导入数据
            if (n.labelPos !== 'free' && n.labelPos !== 'align') n.labelPos = 'align';
            // 所属线路：兼容早期只有 lineId 的数据，统一收敛到 lineIds 数组
            if (!Array.isArray(n.lineIds)) n.lineIds = n.lineId ? [n.lineId] : [];
            n.lineIds = n.lineIds.filter(function (lid) { return !!base.lines.filter(function (l) { return l.id === lid; }).length; });
            if (!n.lineId || n.lineIds.indexOf(n.lineId) < 0) n.lineId = n.lineIds.length ? n.lineIds[0] : null;
        });
        base.segments.forEach(function (s) {
            if (!s.id) s.id = 'G' + (base.idSeq++);
            if (!Array.isArray(s.points)) s.points = [];
            if (!s.type) s.type = 'segfree';
            // 缺省 routed 字段时按类型推断：自由路径视为手绘，其余视为自动走线
            if (typeof s.routed !== 'boolean') s.routed = s.type !== 'segfree' && s.points.length <= 3;
            // 折角方向与逐折角圆角半径：非法数据一律回落到默认值
            if (s.cornerFlip !== true) s.cornerFlip = false;
            if (s.cornerRadii != null) {
                if (!Array.isArray(s.cornerRadii)) {
                    s.cornerRadii = null;
                } else {
                    s.cornerRadii = s.cornerRadii.map(function (v) {
                        return (typeof v === 'number' && isFinite(v)) ? Math.max(0, Math.min(400, round2(v))) : null;
                    });
                }
            }
        });
        base.waters.forEach(function (w) {
            if (!w.id) w.id = 'W' + (base.idSeq++);
            if (!Array.isArray(w.points)) w.points = [];
        });
        return base;
    }

    function download(filename, content, mime) {
        var blob = new Blob([content], { type: mime || 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
    }

    function escapeJson(str) {
        return String(str == null ? '' : str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    /**
     * 生成标准 CGo OpenMap 城市数据代码（stationsData / linesData）。
     * 编辑器内部坐标系（原点左上角、X 向右为正、Y 向下为正）与 OpenMap 数据层完全一致，
     * 站点坐标可直接输出，无需任何换算。
     */
    function buildCityCode() {
        var stationIds = Object.keys(project.nodes).filter(function (id) { return project.nodes[id].type === 'station'; });
        var tempCount = Object.keys(project.nodes).filter(function (id) { return project.nodes[id].type === 'temp'; }).length;

        var lines = [];
        project.lines.forEach(function (line) {
            var segs = project.segments.filter(function (s) { return s.lineId === line.id; });
            if (!segs.length) return;
            lines.push({ line: line, topo: traceLinePath(segs), jsId: 'M' + (lines.length + 1) });
        });

        var stationsOut = 'const stationsData = {\n';
        stationIds.forEach(function (id, index) {
            var n = project.nodes[id];
            var tsf = isTransferNode(id);
            stationsOut += '    "' + escapeJson(n.code || id) + '": {\n';
            stationsOut += '        type: "' + (tsf ? 'tsf' : 'dot') + '",\n';
            stationsOut += '        x: ' + round2(n.x) + ',\n';
            stationsOut += '        y: ' + round2(n.y) + ',\n';
            stationsOut += '        cn: "' + escapeJson(n.cn || '') + '",\n';
            stationsOut += '        en: "' + escapeJson(n.en || '') + '",\n';
            stationsOut += '        align: "' + (n.align || 'top') + '"';
            if (n.labelPos === 'free' && n.labelX != null && n.labelY != null) {
                // 指定坐标模式：OpenMap 数据层用 align + offset 表达文本位置，
                // 这里按「站点 → 站名坐标」的相对位移输出等效 offset
                stationsOut += ',\n        /* labelPos: free，站名坐标 ' + round2(n.labelX) + ', ' + round2(n.labelY) + ' */';
                stationsOut += '\n        offset: { x: ' + round2(n.labelX - n.x) + ', y: ' + round2(n.labelY - n.y) + ' }';
            } else if (n.offsetX || n.offsetY) {
                stationsOut += ',\n        offset: { x: ' + round2(n.offsetX || 0) + ', y: ' + round2(n.offsetY || 0) + ' }';
            }
            stationsOut += '\n    }' + (index === stationIds.length - 1 ? '' : ',') + '\n';
        });
        stationsOut += '};\n';

        var linesOut = 'const linesData = [\n';
        lines.forEach(function (entry, index) {
            linesOut += '    {\n';
            linesOut += '        id: "' + entry.jsId + '",\n';
            linesOut += '        name: "' + escapeJson(entry.line.name) + '",\n';
            linesOut += '        color: "' + entry.line.color + '",\n';
            linesOut += '        stationIds: [' + entry.topo.stationCodes.map(function (c) {
                return '"' + escapeJson(c) + '"';
            }).join(', ') + ']\n';
            linesOut += '    }' + (index === lines.length - 1 ? '' : ',') + '\n';
        });
        linesOut += '];\n';

        var header = '/*\n' +
            ' * 由 CGo OpenMap 线路图在线编辑器导出\n' +
            ' * 画布尺寸: ' + project.canvas.width + ' × ' + project.canvas.height + ' px' +
            '（原点 O 位于左上角顶点，X 轴向右为正，Y 轴向下为正）\n' +
            ' * 站点数: ' + stationIds.length + '，线路数: ' + lines.length +
            '，临时节点: ' + tempCount + '，水域: ' + project.waters.length + '\n' +
            ' * 坐标系与 OpenMap 数据层完全一致，坐标可直接使用\n' +
            ' */\n\n';

        var waterNote = '';
        if (project.waters.length) {
            waterNote = '\n/* 水域轮廓（可导出为独立 SVG 放入 city/{city_id}/assets/，\n' +
                '   并参考青岛做法在 data_scattered.js 中以 type: "svg", layer: "background" 注入）：\n' +
                project.waters.map(function (w) {
                    return '   ' + (w.name || w.id) + ': ' + w.points.map(function (p) {
                        return round2(p.x) + ',' + round2(p.y);
                    }).join(' ');
                }).join('\n') + '\n*/\n';
        }

        var warn = segmentConnectivityWarning();
        var connectivity = '\n/* 连通性自检: ' + (warn || '通过') + ' */\n';
        return header + stationsOut + '\n' + linesOut + waterNote + connectivity;
    }

    function segmentConnectivityWarning() {
        var warns = [];
        project.lines.forEach(function (line) {
            var segs = project.segments.filter(function (s) { return s.lineId === line.id; });
            var ends = {};
            segs.forEach(function (s) {
                var first = s.points[0], last = s.points[s.points.length - 1];
                if (first && first.nid) ends[first.nid] = (ends[first.nid] || 0) + 1;
                if (last && last.nid) ends[last.nid] = (ends[last.nid] || 0) + 1;
            });
            var loose = Object.keys(ends).filter(function (id) { return ends[id] === 1; });
            if (loose.length > 2) warns.push(line.name + ' 端点较多（' + loose.length + '）');
        });
        return warns.join('；');
    }

    /** 将线段集合追踪为一条贯通线路（用于生成 stationIds 序列） */
    function traceLinePath(segs) {
        var adjacency = {};
        segs.forEach(function (seg) {
            var a = seg.points[0], b = seg.points[seg.points.length - 1];
            if (!a || !b) return;
            var aid = a.nid || ('@' + a.x + ',' + a.y);
            var bid = b.nid || ('@' + b.x + ',' + b.y);
            (adjacency[aid] = adjacency[aid] || []).push({ to: bid, seg: seg });
            (adjacency[bid] = adjacency[bid] || []).push({ to: aid, seg: seg });
        });
        var ids = Object.keys(adjacency);
        if (!ids.length) return { stationCodes: [], nodeIds: [] };
        var start = ids.filter(function (id) { return adjacency[id].length === 1; })[0] || ids[0];
        var visited = {};
        var order = [start];
        var current = start;
        var guard = 0;
        while (guard++ < segs.length + 2) {
            var options = adjacency[current] || [];
            var next = null;
            for (var i = 0; i < options.length; i++) {
                if (!visited[options[i].seg.id]) { next = options[i]; break; }
            }
            if (!next) break;
            visited[next.seg.id] = true;
            order.push(next.to);
            current = next.to;
        }
        var nodeIds = order.filter(function (id) { return id.charAt(0) !== '@'; });
        return {
            nodeIds: nodeIds,
            stationCodes: nodeIds.map(function (id) {
                var node = project.nodes[id];
                return node ? (node.code || node.id) : id;
            })
        };
    }

    /** 导出 SVG 图片（画布内容，不含网格与坐标轴；坐标系与编辑器一致，原点左上角、Y 向下） */
    function buildSvgExport() {
        var w = project.canvas.width, h = project.canvas.height;
        var light = isLightTheme();
        var bg = light ? '#ffffff' : '#1a1a1a';
        var stroke = light ? '#00263b' : '#bdcbd2';
        var parts = [];
        parts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">');
        parts.push('<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + bg + '"/>');
        parts.push('<g>');

        project.waters.forEach(function (water) {
            if (water.points.length < 3) return;
            parts.push('<path d="' + polygonPath(water.points) + '" fill="' + (water.fill || WATER_DEFAULT.fill) +
                '" fill-opacity="' + (water.opacity == null ? WATER_DEFAULT.opacity : water.opacity) +
                '" stroke="' + (water.fill || WATER_DEFAULT.fill) + '"/>');
        });

        project.segments.forEach(function (seg) {
            var line = findLine(seg.lineId);
            parts.push('<path d="' + pathWithRoundedCorners(seg.points, segmentRadii(seg)) + '" fill="none" stroke="' +
                ((line && line.color) || '#006098') + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>');
        });

        Object.keys(project.nodes).forEach(function (id) {
            var node = project.nodes[id];
            if (node.type === 'temp') {
                parts.push('<g transform="translate(' + node.x + ',' + node.y + ') rotate(45)">' +
                    '<line x1="-7" y1="0" x2="7" y2="0" stroke="' + stroke + '" stroke-width="4"/>' +
                    '<line x1="0" y1="-7" x2="0" y2="7" stroke="' + stroke + '" stroke-width="4"/></g>');
                return;
            }
            if (isTransferNode(id)) {
                parts.push('<circle cx="' + node.x + '" cy="' + node.y + '" r="' + NODE.tsfMid + '" fill="none" stroke="' + stroke +
                    '" stroke-width="' + NODE.tsfOuterW + '"/>' +
                    '<circle cx="' + node.x + '" cy="' + node.y + '" r="' + NODE.tsfOuter + '" fill="none" stroke="' + stroke +
                    '" stroke-width="' + NODE.tsfOuterW + '"/>' +
                    '<circle cx="' + node.x + '" cy="' + node.y + '" r="' + (NODE.tsfMid - NODE.tsfMidW) + '" fill="' + bg + '"/>');
            } else {
                parts.push('<circle cx="' + node.x + '" cy="' + node.y + '" r="' + NODE.rOuter + '" fill="' + bg +
                    '" stroke="' + nodeColor(id) + '" stroke-width="' + (NODE.rOuter - NODE.rInner) + '"/>' +
                    '<circle cx="' + node.x + '" cy="' + node.y + '" r="' + NODE.rInner + '" fill="' + bg + '"/>');
            }
        });
        parts.push('</g>');

        // 站名文本层：坐标系一致（Y 向下），站名用 dy 相对排布，保证英文换行位置正确
        Object.keys(project.nodes).forEach(function (id) {
            var node = project.nodes[id];
            if (node.type !== 'station' || node.hideLabel) return;
            var align = node.align || 'top';
            var anchor = align.indexOf('left') >= 0 ? 'start' : (align.indexOf('right') >= 0 ? 'end' : 'middle');
            var layout = resolveLabelLayout(node);
            // 文本块相对锚点的整体位移：位于上方时整体上移，位于下方时整体下移
            var blockDy = 0;
            if (align.indexOf('top') >= 0) blockDy = -4;
            else if (align.indexOf('bottom') >= 0) blockDy = (node.cnSize || 13) + Math.max((node.enSize || 10) * 1.15, 8) - 2;
            else blockDy = (node.cnSize || 13) / 2 - 3;
            var x = layout.x;
            var y = layout.y + blockDy;
            var enDy = Math.max((node.enSize || 10) * 1.15, 8);
            parts.push('<text x="' + x + '" y="' + y + '" text-anchor="' + anchor +
                '" dominant-baseline="middle" fill="' + (light ? '#00263b' : '#e5e8ea') +
                '" font-family="Noto Sans SC, sans-serif" font-size="' + (node.cnSize || 13) + '" font-weight="700">' +
                escapeHtml(node.cn || '') +
                (node.en ? '<tspan x="' + x + '" dy="' + enDy + '" font-size="' + (node.enSize || 10) +
                    '" fill="' + (light ? '#636f75' : '#a0b0b9') + '" font-family="Arimo, sans-serif">' +
                    escapeHtml(node.en) + '</tspan>' : '') +
                '</text>');
        });

        parts.push('</svg>');
        return parts.join('\n');
    }

    // ==========================================================================
    // 16. CGo OpenMap 城市工程包导出（按项目城市目录规范生成 zip）
    // ==========================================================================

    var OM_PX_METER_DEFAULT = 30;   // 默认站距比例：30 米 / 像素
    var OM_ICON_MAX = 57;           // assets/svg/icon@01.svg ~ icon@57.svg

    /** 规范化城市 ID（小写字母、数字、下划线、连字符） */
    function slugCityId(raw) {
        return String(raw == null ? '' : raw).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    }

    /** 车站「站距比例」等数值的兜底解析 */
    function positiveNumber(value, fallback) {
        var n = parseFloat(value);
        return (isFinite(n) && n > 0) ? n : fallback;
    }

    // ---------------------------- 极简 ZIP 打包器 ----------------------------

    var CRC_TABLE = null;

    /** 标准 CRC-32（IEEE 802.3，ZIP 校验用） */
    function crc32(bytes) {
        if (!CRC_TABLE) {
            CRC_TABLE = new Uint32Array(256);
            for (var n = 0; n < 256; n++) {
                var c = n;
                for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                CRC_TABLE[n] = c >>> 0;
            }
        }
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /** 小端字节写入器 */
    function ByteBuilder(size) {
        this.buf = new Uint8Array(size || 256);
        this.len = 0;
    }
    ByteBuilder.prototype.room = function (n) {
        if (this.len + n <= this.buf.length) return;
        var next = new Uint8Array(Math.max(this.buf.length * 2, this.len + n));
        next.set(this.buf.subarray(0, this.len));
        this.buf = next;
    };
    ByteBuilder.prototype.u16 = function (v) {
        this.room(2);
        this.buf[this.len++] = v & 0xFF;
        this.buf[this.len++] = (v >>> 8) & 0xFF;
        return this;
    };
    ByteBuilder.prototype.u32 = function (v) {
        this.room(4);
        this.buf[this.len++] = v & 0xFF;
        this.buf[this.len++] = (v >>> 8) & 0xFF;
        this.buf[this.len++] = (v >>> 16) & 0xFF;
        this.buf[this.len++] = (v >>> 24) & 0xFF;
        return this;
    };
    ByteBuilder.prototype.bytes = function (arr) {
        this.room(arr.length);
        this.buf.set(arr, this.len);
        this.len += arr.length;
        return this;
    };
    ByteBuilder.prototype.done = function () { return this.buf.slice(0, this.len); };

    /**
     * 用浏览器原生 CompressionStream 做 raw deflate（ZIP method 8）。
     * 不支持或失败时返回 null，调用方自动退化为「存储」（method 0）。
     */
    async function deflateRawBytes(bytes) {
        if (typeof CompressionStream === 'undefined' || typeof Blob === 'undefined' || !bytes.length) return null;
        try {
            // 经 pipeThrough 串联，背压由流内部处理，避免大文件时写端阻塞
            var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
            var buf = await new Response(stream).arrayBuffer();
            return new Uint8Array(buf);
        } catch (e) {
            return null;
        }
    }

    /**
     * 生成 ZIP 压缩包字节流（无第三方依赖）。
     * @param {Array<{name:string, text?:string, data?:Uint8Array}>} entries
     * @returns {Promise<Uint8Array>}
     */
    async function buildZipBytes(entries) {
        var encoder = new TextEncoder();
        var localParts = [];
        var centralParts = [];
        var offset = 0;
        var now = new Date();
        var dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xFFFF;
        var dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var nameBytes = encoder.encode(entry.name);
            var data = (entry.data instanceof Uint8Array) ? entry.data : encoder.encode(entry.text == null ? '' : entry.text);
            var crc = crc32(data);
            var packed = await deflateRawBytes(data);
            var method = 0;
            var payload = data;
            if (packed && packed.length < data.length) { method = 8; payload = packed; }

            var local = new ByteBuilder(30 + nameBytes.length + payload.length);
            local.u32(0x04034B50).u16(20).u16(0x0800).u16(method);
            local.u16(dosTime).u16(dosDate).u32(crc).u32(payload.length).u32(data.length);
            local.u16(nameBytes.length).u16(0);
            local.bytes(nameBytes).bytes(payload);
            var localBytes = local.done();
            localParts.push(localBytes);

            var central = new ByteBuilder(46 + nameBytes.length);
            central.u32(0x02014B50).u16(20).u16(20).u16(0x0800).u16(method);
            central.u16(dosTime).u16(dosDate).u32(crc).u32(payload.length).u32(data.length);
            central.u16(nameBytes.length).u16(0).u16(0).u16(0).u16(0).u32(0);
            central.u32(offset).bytes(nameBytes);
            centralParts.push(central.done());

            offset += localBytes.length;
        }

        var centralSize = centralParts.reduce(function (sum, part) { return sum + part.length; }, 0);
        var tail = new ByteBuilder(22);
        tail.u32(0x06054B50).u16(0).u16(0).u16(entries.length).u16(entries.length);
        tail.u32(centralSize).u32(offset).u16(0);

        var total = offset + centralSize + 22;
        var out = new Uint8Array(total);
        var pos = 0;
        localParts.concat(centralParts, [tail.done()]).forEach(function (part) {
            out.set(part, pos);
            pos += part.length;
        });
        return out;
    }

    /** 字节流转 Base64（调试探针与体积统计用） */
    function bytesToBase64(bytes) {
        var chunk = 0x8000;
        var binary = '';
        for (var i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(binary);
    }

    // ---------------------------- 几何：线路折线与站序 ----------------------------

    function pathPointKey(p) {
        if (!p) return '';
        return p.nid ? ('#' + p.nid) : ('@' + round2(p.x) + ',' + round2(p.y));
    }

    /**
     * 把一条线路的线段集合分解为若干「端点路径」。
     * 每个路径是一串按行进顺序（含反向）排列的线段；纯环线会得到一条闭合路径。
     * @returns {Array<{chain:Array<{seg:Object, reversed:boolean}>, closed:boolean, startKey:string, endKey:string}>}
     */
    function decomposeLinePaths(segs) {
        var adjacency = {};
        function link(key, item) { (adjacency[key] = adjacency[key] || []).push(item); }
        segs.forEach(function (seg) {
            var pts = seg.points || [];
            if (pts.length < 2) return;
            var ak = pathPointKey(pts[0]), bk = pathPointKey(pts[pts.length - 1]);
            if (ak === bk) return;                      // 退化线段，跳过
            link(ak, { seg: seg, from: ak, to: bk });
            link(bk, { seg: seg, from: bk, to: ak });
        });

        var used = {};
        var paths = [];
        function walk(startKey) {
            var chain = [];
            var cur = startKey;
            var guard = 0;
            while (guard++ <= segs.length + 2) {
                var options = adjacency[cur] || [];
                var pick = null;
                for (var i = 0; i < options.length; i++) {
                    if (!used[options[i].seg.id]) { pick = options[i]; break; }
                }
                if (!pick) break;
                used[pick.seg.id] = true;
                var pts = pick.seg.points || [];
                chain.push({ seg: pick.seg, reversed: pick.from !== pathPointKey(pts[0]) });
                cur = pick.to;
            }
            return { chain: chain, closed: chain.length > 1 && cur === startKey, startKey: startKey, endKey: cur };
        }

        Object.keys(adjacency).filter(function (k) { return adjacency[k].length === 1; })
            .forEach(function (k) {
                var p = walk(k);
                if (p.chain.length) paths.push(p);
            });
        // 剩余未被消费的线段：闭合环线或分支内部环
        Object.keys(adjacency).forEach(function (k) {
            var p = walk(k);
            if (p.chain.length) paths.push(p);
        });
        return paths;
    }

    /**
     * 把一条路径的线段串接为一条贯通折线。
     * 返回的每个顶点携带 nid（车站/临时节点）与自定义圆角半径 r（若有）。
     */
    function chainToPolyline(chain) {
        var pts = [];
        function push(entry) {
            var last = pts[pts.length - 1];
            if (last && round2(last.x) === round2(entry.x) && round2(last.y) === round2(entry.y)) {
                if (!last.nid && entry.nid) last.nid = entry.nid;
                return;
            }
            pts.push(entry);
        }
        chain.forEach(function (item) {
            var raw = (item.seg.points || []).slice();
            var radii = segmentRadii(item.seg);
            if (item.reversed) raw.reverse();
            raw.forEach(function (p, i) {
                var origIndex = item.reversed ? (raw.length - 1 - i) : i;
                var entry = { x: round2(p.x), y: round2(p.y) };
                if (p.nid) entry.nid = p.nid;
                if (origIndex > 0 && origIndex < raw.length - 1) {
                    var r = radii[origIndex - 1];
                    var def = isRightAngleCorner(
                        item.seg.points[origIndex - 1], item.seg.points[origIndex], item.seg.points[origIndex + 1]) ? 18 : 8;
                    if (isFinite(r) && Math.abs(r - def) > 0.01) entry.r = round2(r);
                }
                push(entry);
            });
        });
        return simplifyPolyline(pts);
    }

    /** 去掉共线且无绑定、无自定义圆角的中间顶点（保留所有车站锚点与折角） */
    function simplifyPolyline(pts) {
        if (pts.length < 3) return pts;
        var out = [pts[0]];
        for (var i = 1; i < pts.length - 1; i++) {
            var p = pts[i];
            if (p.nid || p.r != null) { out.push(p); continue; }
            var a = out[out.length - 1], b = pts[i + 1];
            var cross = (p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x);
            var len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            if (Math.abs(cross) / len > 0.01) out.push(p);
        }
        out.push(pts[pts.length - 1]);
        return out;
    }

    /** 折线全长 */
    function polylineLength(pts) {
        var sum = 0;
        for (var i = 1; i < pts.length; i++) sum += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        return sum;
    }

    /**
     * 由贯通折线推导站序与站间距（米）。
     * 临时节点不产出车站条目，但仍参与折线走向与里程累加。
     * tail 为「最后一个车站 → 折线终点」的剩余里程（环线闭合段或终点为临时节点时有效）。
     */
    function polylineToStations(pts, keyOf, pxMeter) {
        var positions = [];
        pts.forEach(function (p, index) {
            if (p.nid && keyOf[p.nid]) positions.push({ index: index, key: keyOf[p.nid] });
        });
        // 同一车站重复出现（环线首尾）只保留首次
        var seen = {};
        positions = positions.filter(function (item) {
            if (seen[item.key]) return false;
            seen[item.key] = true;
            return true;
        });
        var cum = [0];
        for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
        var distances = [];
        for (var j = 1; j < positions.length; j++) {
            distances.push(Math.max(1, Math.round((cum[positions[j].index] - cum[positions[j - 1].index]) * pxMeter)));
        }
        var tail = positions.length
            ? Math.max(0, Math.round((cum[pts.length - 1] - cum[positions[positions.length - 1].index]) * pxMeter))
            : 0;
        return {
            stationIds: positions.map(function (p) { return p.key; }),
            distances: distances,
            tail: tail,
            hasUnanchoredEnd: !(pts[0].nid && keyOf[pts[0].nid]) || !(pts[pts.length - 1].nid && keyOf[pts[pts.length - 1].nid])
        };
    }

    /** 反转一条已构建的走线（用于把两条分支串成主干） */
    function reverseWay(way) {
        return {
            points: way.points.slice().reverse(),
            endKeys: [way.endKeys[1], way.endKeys[0]],
            closed: way.closed,
            length: way.length
        };
    }

    /**
     * 把共享同一汇合点的两条走线串接为一条贯通主干（Y 字形线路的主线）。
     * 串接后重新推导站序与站间距，保证站距沿折线严格连续。
     */
    function mergeWays(w1, w2, junctionKey, keyOf, pxMeter) {
        var a = w1.endKeys[1] === junctionKey ? w1 : reverseWay(w1);
        var b = w2.endKeys[0] === junctionKey ? w2 : reverseWay(w2);
        if (a.endKeys[1] !== junctionKey || b.endKeys[0] !== junctionKey) return null;
        var pts = a.points.concat(b.points.slice(1));
        var info = polylineToStations(pts, keyOf, pxMeter);
        return {
            points: pts,
            endKeys: [a.endKeys[0], b.endKeys[1]],
            closed: false,
            length: polylineLength(pts),
            stationIds: info.stationIds,
            distances: info.distances,
            tail: info.tail,
            hasUnanchoredEnd: info.hasUnanchoredEnd,
            merged: true
        };
    }

    /** 两条走线是否共享端点（Y 字形线路的汇合点） */
    function sharedEndKey(w1, w2) {
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                if (w1.endKeys[i] === w2.endKeys[j]) return w1.endKeys[i];
            }
        }
        return null;
    }

    // ---------------------------- 代码文件生成 ----------------------------

    /** 线路图标：线路名中的数字 → assets/svg/icon@NN.svg，否则使用通用徽标 icon@lg.svg */
    function lineIconFile(name, index) {
        var m = /(\d+)/.exec(name || '');
        var n = m ? parseInt(m[1], 10) : (index + 1);
        if (n >= 1 && n <= OM_ICON_MAX) return 'icon@' + (n < 10 ? '0' + n : n) + '.svg';
        return 'icon@lg.svg';
    }

    function jsString(value) {
        return '"' + escapeJson(value == null ? '' : value) + '"';
    }

    function omHeader(title, lines) {
        return '/**\n' +
            ' * CGo OpenMap - ' + title + '\n' +
            ' *\n' +
            (lines || []).map(function (l) { return ' * ' + l; }).join('\n') + '\n' +
            ' *\n' +
            ' * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（' + new Date().toISOString().slice(0, 10) + '）。\n' +
            ' * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。\n' +
            ' */\n\n';
    }

    /**
     * 依据当前工程生成 CGo OpenMap 城市工程包内容。
     * @param {{cityId:string,cityName:string,themeColor:string,linePrefix:string,pxMeter:number,company:string}} opts
     */
    function buildOpenMapPackage(opts) {
        var o = opts || {};
        var cityId = slugCityId(o.cityId) || 'newcity';
        var cityName = String(o.cityName || '').trim() || cityId;
        var prefix = String(o.linePrefix || 'M').trim().replace(/[^A-Za-z0-9_-]/g, '') || 'M';
        var pxMeter = positiveNumber(o.pxMeter, OM_PX_METER_DEFAULT);
        var themeColor = /^#[0-9a-fA-F]{6}$/.test(String(o.themeColor || '')) ? String(o.themeColor) : '#00263b';
        var company = String(o.company || '').trim() || (cityName + '轨道交通');
        var warnings = [];
        var today = new Date().toISOString().slice(0, 10);

        // ---- 车站键（OpenMap Station ID）分配 ----
        var keyOf = {};
        var usedKeys = {};
        var stationOrder = Object.keys(project.nodes).filter(function (id) { return project.nodes[id].type === 'station'; });
        var missingCode = [];
        stationOrder.forEach(function (id) {
            var n = project.nodes[id];
            var base = String(n.code || '').trim();
            if (!base) { base = id; missingCode.push(id); }
            var key = base, k = 2;
            while (usedKeys[key]) { key = base + '_' + (k++); }
            usedKeys[key] = true;
            keyOf[id] = key;
        });
        if (missingCode.length) {
            warnings.push(missingCode.length + ' 个车站未填写「站编号」，已暂用内部节点 ID 作为车站键，请在 data_stations.js 中改为规范编号（如 M101）。');
        }
        var tempCount = Object.keys(project.nodes).filter(function (id) { return project.nodes[id].type === 'temp'; }).length;

        // ---- 线路与折线 ----
        var lineEntries = [];
        project.lines.forEach(function (line, index) {
            var segs = project.segments.filter(function (s) { return s.lineId === line.id; });
            if (!segs.length) {
                warnings.push('线路「' + (line.name || line.id) + '」没有线段，已跳过导出。');
                return;
            }
            var paths = decomposeLinePaths(segs);
            var built = paths.map(function (p) {
                var pts = chainToPolyline(p.chain);
                var info = polylineToStations(pts, keyOf, pxMeter);
                return {
                    points: pts, stationIds: info.stationIds, distances: info.distances,
                    tail: info.tail, hasUnanchoredEnd: info.hasUnanchoredEnd,
                    closed: p.closed, endKeys: [p.startKey, p.endKey], length: polylineLength(pts)
                };
            }).filter(function (p) { return p.points.length >= 2; });

            if (!built.length) {
                warnings.push('线路「' + (line.name || line.id) + '」的线段未形成有效走线，已跳过导出。');
                return;
            }
            built.sort(function (a, b) { return b.length - a.length; });

            // 站点过少的孤立走线不导出
            built = built.filter(function (w, wi) {
                if (w.stationIds.length >= 1) return true;
                warnings.push('线路「' + (line.name || line.id) + '」有一条不含车站的走线（仅临时节点），已跳过。');
                return false;
            });
            if (!built.length) return;

            var ways = [];
            if (built.length >= 2 && !built[0].closed) {
                // Y 字形：把共享汇合点的两条走线串成主干，其余作为支线
                var junction = sharedEndKey(built[0], built[1]);
                if (junction) {
                    var merged = mergeWays(built[0], built[1], junction, keyOf, pxMeter);
                    if (merged) {
                        ways.push(merged);
                        if (built.length > 2) {
                            ways.push(built[2]);
                            warnings.push('线路「' + (line.name || line.id) + '」共有 ' + built.length +
                                ' 条末端走线，OpenMap 标准主线仅支持 way1(主干) + way2(一条支线)，已导出其中最长的两条，' +
                                (built.length - 2) + ' 条较短支线未包含，请手工补充。');
                        }
                    }
                }
                if (!ways.length) {
                    ways = built.slice(0, 2);
                    warnings.push('线路「' + (line.name || line.id) + '」的多条走线不共享汇合点（可能是若干互不相连的区段），' +
                        '已按两条独立走线导出为 way1/way2，请确认结构。');
                }
            } else {
                ways = built.slice(0, built.length > 2 ? 2 : built.length);
                if (built.length > 2) {
                    warnings.push('线路「' + (line.name || line.id) + '」存在 ' + built.length +
                        ' 条走线，已导出前两条，其余请手工补充。');
                }
            }

            var entry = {
                id: prefix + (lineEntries.length + 1),
                name: line.name || ('线路' + (lineEntries.length + 1)),
                color: line.color || LINE_PALETTE[lineEntries.length % LINE_PALETTE.length],
                svg: lineIconFile(line.name, lineEntries.length),
                company: company,
                ways: ways
            };
            if (ways.length === 1 && ways[0].closed) {
                entry.isLoop = true;
                // 环线：末段站距为「最后一座车站回到首站」的闭合里程
                ways[0].distances = ways[0].distances.concat([Math.max(1, ways[0].tail)]);
            } else if (ways.length > 1) {
                entry.hasbranch = true;
            }
            ways.forEach(function (w) {
                if (w.hasUnanchoredEnd) {
                    warnings.push('线路「' + entry.name + '」有一段走线的端点不是车站（临时节点或悬空），' +
                        '导出的 pathPoints 会延伸到该位置，请确认是否需要在端点处补一座车站。');
                }
            });
            lineEntries.push(entry);
        });

        // ---- data_stations.js ----
        var stationsOut = omHeader('车站数据库 (city/' + cityId + '/data_stations.js)', [
            '共 ' + stationOrder.length + ' 座车站（另有 ' + tempCount + ' 个临时节点仅参与画布绘制，不导出为车站）。',
            '字段规范：type dot(普通站) / tsf(换乘站) / no(在建) / rdot(国铁站)、x、y、cn、en、align、offset、textScale、hideLabel。'
        ]) + 'const stationsData = {\n';
        stationOrder.forEach(function (id, index) {
            var n = project.nodes[id];
            var parts = [];
            parts.push('type: ' + jsString(isTransferNode(id) ? 'tsf' : 'dot'));
            parts.push('x: ' + round2(n.x));
            parts.push('y: ' + round2(n.y));
            parts.push('cn: ' + jsString(n.cn || ''));
            parts.push('en: ' + jsString(n.en || ''));
            parts.push('align: ' + jsString(n.align || 'top'));
            var offsetX = n.labelPos === 'free' && n.labelX != null ? n.labelX - n.x : (n.offsetX || 0);
            var offsetY = n.labelPos === 'free' && n.labelY != null ? n.labelY - n.y : (n.offsetY || 0);
            parts.push('offset: { x: ' + round2(offsetX) + ', y: ' + round2(offsetY) + ' }');
            var cnScale = round2((n.cnSize || 13) / 13);
            var enScale = round2((n.enSize || 10) / 10);
            if (Math.abs(cnScale - 1) > 0.001 || Math.abs(enScale - 1) > 0.001) {
                parts.push('textScale: { cn: ' + cnScale + ', en: ' + enScale + ' }');
            }
            if (n.hideLabel) parts.push('hideLabel: true');
            stationsOut += '    ' + jsString(keyOf[id]) + ': { ' + parts.join(', ') + ' }' +
                (index === stationOrder.length - 1 ? '' : ',') + '\n';
        });
        stationsOut += '};\n';

        // ---- data_lines.js ----
        var linesOut = omHeader('线路数据库与矢量走向配置 (city/' + cityId + '/data_lines.js)', [
            'stationsData 中的车站键必须与下方 stationIds 完全对应；',
            'distances 为相邻车站的站间距（米），长度应等于 stationIds.length - 1（环线等于 stationIds.length）；',
            'pathPoints 为线路绘制的折线点阵（引擎自动计算 45°/90° 平滑圆角，点上的 r 可指定自定义圆角半径）。',
            '站间距按导出参数「' + pxMeter + ' 米/像素」由画布几何反算，请按实际里程校正。'
        ]) + 'const linesData = [\n';
        lineEntries.forEach(function (entry, index) {
            var block = [];
            block.push('        id: ' + jsString(entry.id));
            block.push('        name: ' + jsString(entry.name));
            block.push('        color: ' + jsString(entry.color));
            block.push('        svg: ' + jsString(entry.svg));
            block.push('        svgclr: ' + jsString(entry.color));
            block.push('        svgtext: "#ffffff"');
            block.push('        company: ' + jsString(entry.company));
            if (entry.isLoop) block.push('        isLoop: true');
            if (entry.hasbranch) block.push('        hasbranch: true');

            function ptsLiteral(points) {
                var items = points.map(function (p) {
                    return '{ x: ' + round2(p.x) + ', y: ' + round2(p.y) + (p.r != null ? ', r: ' + round2(p.r) : '') + ' }';
                });
                var outStr = '';
                var perLine = 4;
                for (var i = 0; i < items.length; i += perLine) {
                    outStr += '\n            ' + items.slice(i, i + perLine).join(', ') + (i + perLine < items.length ? ',' : '');
                }
                return '[' + outStr + '\n        ]';
            }
            function idLiteral(ids) {
                return '[' + ids.map(function (v) { return jsString(v); }).join(', ') + ']';
            }
            function distLiteral(ds) {
                return '[' + ds.join(', ') + ']';
            }

            if (entry.isLoop) {
                var w = entry.ways[0];
                block.push('        stationIds: ' + idLiteral(w.stationIds));
                block.push('        distances: ' + distLiteral(w.distances));
                block.push('        pathPoints: ' + ptsLiteral(w.points));
            } else if (entry.hasbranch) {
                entry.ways.forEach(function (w, wi) {
                    var tag = wi === 0 ? '-way1' : '-way2';
                    block.push('        ' + jsString('stationIds' + tag) + ': ' + idLiteral(w.stationIds));
                    block.push('        ' + jsString('distances' + tag) + ': ' + distLiteral(w.distances));
                    block.push('        ' + jsString('pathPoints' + (wi === 0 ? '-main' : '-branch' + wi)) + ': ' + ptsLiteral(w.points));
                });
            } else {
                var one = entry.ways[0];
                block.push('        stationIds: ' + idLiteral(one.stationIds));
                block.push('        distances: ' + distLiteral(one.distances));
                block.push('        pathPoints: ' + ptsLiteral(one.points));
            }
            linesOut += '    {\n' + block.join(',\n') + '\n    }' + (index === lineEntries.length - 1 ? '' : ',') + '\n';
        });
        linesOut += '];\n';

        // ---- data_legend.js ----
        var legendOut = omHeader('图例结构与分组配置 (city/' + cityId + '/data_legend.js)', [
            "每个 grid 项通过 targets 关联线路 ID，点击图例项即可高亮对应线路。"
        ]) + 'const LEGEND_CONFIG = [\n' +
            '    {\n        type: \'title\',\n        title: \'城市轨道交通\',\n        subtitle: \'Urban Rail Transit\'\n    },\n' +
            '    {\n        type: \'grid\',\n        cols: 2,\n        items: [\n' +
            lineEntries.map(function (e) {
                return '            { targets: [' + jsString(e.id) + '], name: ' + jsString(e.name) + ' }';
            }).join(',\n') + '\n        ]\n    }\n];\n';

        // ---- data_virtual_transfers.js ----
        var virtualOut = omHeader('虚拟换乘与出站连通配置 (city/' + cityId + '/data_virtual_transfers.js)', [
            '编辑器暂不产出站外虚拟换乘关系，若该城市存在出站限时免费换乘 / 国铁接驳换乘，',
            '请按 city/beijing/data_virtual_transfers.js 的格式在此补充。'
        ]) +
            '// 免费虚拟换乘/站外换乘映射表\nconst VIRTUAL_FREE_TRANSFER_MAP = {};\n\n' +
            '// 免费虚拟换乘连线数组\nconst VIRTUAL_FREE_CONNECT_LINES = [];\n\n' +
            '// 付费/国铁虚拟换乘映射表\nconst VIRTUAL_TRANSFER_MAP = {};\n\n' +
            '// 付费/国铁虚拟换乘连线数组\nconst VIRTUAL_CONNECT_LINES = [];\n';

        // ---- data_notopen.js ----
        var notopenOut = omHeader('未开通/在建线路走向 (city/' + cityId + '/data_notopen.js)', [
            '编辑器暂不产出在建线路，若需要绘制规划或在建走向虚线，请按下列格式补充：',
            'NOT_OPEN_LINES = [{ points: [{ x, y }, ...] }]'
        ]) + 'const NOT_OPEN_LINES = [];\n';

        // ---- data_timetable.js ----
        var timetableOut = omHeader('首末班车时刻表 (city/' + cityId + '/data_timetable.js)', [
            '编辑器暂不产出时刻数据，按 city/qingdao/data_timetable.js 的格式补充后，',
            '车站信息板将自动展示首末班车模块；留空时仅显示官网查询入口。'
        ]) + 'const GLOBAL_SCHEDULE_DATA = {};\n';

        // ---- data_scattered.js（水域底图） ----
        var hasWater = project.waters.some(function (w) { return (w.points || []).length >= 3; });
        var scatteredOut = omHeader('地图背景装饰物与示意图素材配置 (city/' + cityId + '/data_scattered.js)', [
            hasWater
                ? '编辑器中的水域多边形已导出为 assets/' + cityId + '_waters.svg，作为底层地理底图注入。'
                : '编辑器中没有水域多边形，此处保留空数组，可自行加入城市特色地标矢量素材。',
            '字段：id、file、x、y（左上角锚点）、width、height、opacity、zIndex（0~4 位于线路与车站下方）。'
        ]) + 'const SCATTERED_DATA = ' + (hasWater ? '[\n    {\n' +
            '        id: ' + jsString(cityId + '-waters') + ',\n' +
            '        file: ' + jsString('./city/' + cityId + '/assets/' + cityId + '_waters.svg') + ',\n' +
            '        x: 0,\n        y: 0,\n' +
            '        width: ' + project.canvas.width + ',\n' +
            '        height: ' + project.canvas.height + ',\n' +
            '        opacity: 1,\n        zIndex: 1\n    }\n];\n' : '[];\n');

        // ---- 水域 SVG ----
        var waterSvg = '';
        if (hasWater) {
            var svgParts = ['<?xml version="1.0" encoding="UTF-8"?>',
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + project.canvas.width + ' ' + project.canvas.height +
                '" width="' + project.canvas.width + '" height="' + project.canvas.height + '">'];
            project.waters.forEach(function (water) {
                if ((water.points || []).length < 3) return;
                svgParts.push('\t<path d="' + polygonPath(water.points) + '" fill="' + (water.fill || WATER_DEFAULT.fill) +
                    '" fill-opacity="' + (water.opacity == null ? WATER_DEFAULT.opacity : water.opacity) + '" stroke="none"/>');
            });
            svgParts.push('</svg>');
            waterSvg = svgParts.join('\n') + '\n';
        }

        // ---- staname.csv（站名检索别名库） ----
        var csvHead = 'tag1,tag2,tag3,tag4,tag5,tag6,ch,2018,2019,2020,2021,2022,2023,2024,2025';
        var csvRows = stationOrder.map(function (id) {
            var n = project.nodes[id];
            var en = String(n.en || '').replace(/,/g, ' ');
            var initial = (en.match(/[A-Za-z]/) ? en.match(/[A-Za-z]/)[0] : '#').toUpperCase();
            var ownLine = findLine(nodePrimaryLineId(n));
            var lineName = ownLine ? ownLine.name : '';
            var years = [];
            for (var y = 0; y < 8; y++) years.push(en);
            return [initial, lineName, '', '', '', '', String(n.cn || '').replace(/,/g, ' ')].concat(years).join(',');
        });
        var stanameCsv = [csvHead].concat(csvRows).join('\n') + '\n';

        // ---- stacard/script.js（车站卡片占位实现） ----
        var staCardOut = '/**\n' +
            ' * CGo OpenMap - ' + cityName + '车站卡片模块 (city/' + cityId + '/stacard/script.js)\n' +
            ' *\n' +
            ' * 由编辑器生成的占位实现：车站信息板中暂不渲染周边地图卡片。\n' +
            ' * 若需接入高德切片周边地图，请参照 city/qingdao/stacard/script.js 实现\n' +
            ' * window.' + cityName.replace(/\s/g, '') + 'StaCard 的 init / hasCard / getCardPlaceholderHtml / renderPanelCards 方法。\n' +
            ' */\n\n' +
            'const ' + camelId(cityId) + 'StaCard = {\n' +
            '    async init() { return false; },\n' +
            '    hasCard() { return false; },\n' +
            '    getCardPlaceholderHtml() { return ""; },\n' +
            '    async renderPanelCards() { return false; }\n' +
            '};\n\n' +
            'window.' + camelId(cityId) + 'StaCard = ' + camelId(cityId) + 'StaCard;\n';

        // ---- {cityId}.js（城市配置与能力接口） ----
        var sortOrder = lineEntries.map(function (e) { return jsString(e.id); }).join(', ');
        var cityJs = omHeader('城市配置与能力接口 (city/' + cityId + '/' + cityId + '.js)', [
            '线路与站点数据来自 CGo OpenMap 线路图在线编辑器，本文件负责城市运行时元数据。'
        ]) + '(function () {\n' +
            '    const ' + camelId(cityId) + 'City = {\n' +
            '        id: ' + jsString(cityId) + ',\n' +
            '        name: ' + jsString(cityName) + ',\n' +
            '        themeColor: ' + jsString(themeColor) + ',\n' +
            '        searchCity: ' + jsString(cityName) + ',\n' +
            '        center: { x: ' + Math.round(project.canvas.width / 2) + ', y: ' + Math.round(project.canvas.height / 2) + ' },\n' +
            '        defaultScale: 1.0,\n' +
            '        mapSize: { width: ' + project.canvas.width + ', height: ' + project.canvas.height + ' },\n' +
            '        officialMapUrl: "",\n' +
            '        LINE_META: {},\n' +
            '        LINE_SORT_ORDER: [' + sortOrder + '],\n' +
            '        LINE_SYNC_GROUPS: [],\n' +
            '        SUBURBAN_LINES: [],\n' +
            '        MERGE_STATIONS: [],\n' +
            '        CROSS_PLATFORM_STATIONS: [],\n' +
            '        dataFiles: {\n' +
            '            stanameCsvUrl: "./city/' + cityId + '/staname.csv"\n' +
            '        },\n' +
            '        getNavigationUrl(stationName) {\n' +
            '            return `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stationName}(地铁站)`)}&city=${encodeURIComponent(' + jsString(cityName) + ')}`;\n' +
            '        },\n' +
            '        formatOwnerName(rawOwnerName) {\n' +
            '            return rawOwnerName && rawOwnerName !== "未知运营" ? rawOwnerName : ' + jsString(company) + ';\n' +
            '        },\n' +
            '        formatCompanyString(companyList) {\n' +
            '            const normalized = companyList.map((name) => this.formatOwnerName(name));\n' +
            '            return [...new Set(normalized)].join("，") || this.formatOwnerName("");\n' +
            '        },\n' +
            '        stacard: {\n' +
            '            script: "./city/' + cityId + '/stacard/script.js",\n' +
            '            basePath: "./city/' + cityId + '/stacard/",\n' +
            '            getRenderer: () => window.' + camelId(cityId) + 'StaCard || window.StaCard || null\n' +
            '        },\n' +
            '        async initStaCard(options = {}) {\n' +
            '            return await this.stacard.getRenderer()?.init?.({ basePath: this.stacard.basePath, ...options });\n' +
            '        },\n' +
            '        hasStaCard(stationId, lineId, stationInfo) {\n' +
            '            return Boolean(this.stacard.getRenderer()?.hasCard?.(stationId, lineId, stationInfo));\n' +
            '        },\n' +
            '        getStaCardHtml(station, lineInfo, isCrossPlatform = false) {\n' +
            '            return this.stacard.getRenderer()?.getCardPlaceholderHtml?.(station, lineInfo, isCrossPlatform) || "";\n' +
            '        },\n' +
            '        async renderStaCards(infoPanel, station) {\n' +
            '            return await this.stacard.getRenderer()?.renderPanelCards?.(infoPanel, station);\n' +
            '        },\n' +
            '        stationBoard: {\n' +
            '            scripts: [],\n' +
            '            modules: {\n' +
            '                "stacard": { enabled: true, order: 10, targetTab: "line-tab" }\n' +
            '            }\n' +
            '        }\n' +
            '    };\n\n' +
            '    window.' + cityId.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_CITY = ' + camelId(cityId) + 'City;\n' +
            '    window.CURRENT_CITY = ' + camelId(cityId) + 'City;\n' +
            '    window.CityDataManager?.registerCity?.({\n' +
            '        id: ' + camelId(cityId) + 'City.id,\n' +
            '        name: ' + camelId(cityId) + 'City.name,\n' +
            '        folder: "./city/' + cityId + '",\n' +
            '        mainLogic: "./city/' + cityId + '/' + cityId + '.js",\n' +
            '        center: ' + camelId(cityId) + 'City.center,\n' +
            '        defaultScale: ' + camelId(cityId) + 'City.defaultScale,\n' +
            '        mapSize: ' + camelId(cityId) + 'City.mapSize,\n' +
            '        searchCity: ' + camelId(cityId) + 'City.searchCity,\n' +
            '        title: "CGo OpenMap - ' + cityName + '轨道交通线路图",\n' +
            '        keywords: "CGo OpenMap, ' + cityName + ', 轨道交通, 线路图",\n' +
            '        description: "由 CGo OpenMap 线路图在线编辑器生成的' + cityName + '轨道交通线路图。",\n' +
            '        registerDate: "' + today + '",\n' +
            '        status: "active",\n' +
            '        maintainers: [],\n' +
            '        isDefault: false,\n' +
            '        ...' + camelId(cityId) + 'City\n' +
            '    });\n' +
            '})();\n';

        // ---- 集成片段 ----
        var registrySnippet = '/**\n' +
            ' * 集成片段 1/3：把下面的城市配置对象粘贴进 city/data.js 的 CITY_REGISTRY 中。\n' +
            ' * 位置：const CITY_REGISTRY = {  ...已注册城市..., ← 在此新增本条目 };\n' +
            ' * 建议同时为城市准备 themeColor（6 位 Hex）与可选 svglogo（去色去 viewBox 的矢量徽标）。\n' +
            ' */\n\n' +
            '        "' + cityId + '": {\n' +
            '            id: "' + cityId + '",\n' +
            '            name: "' + cityName + '",\n' +
            '            themeColor: "' + themeColor + '",\n' +
            '            svglogo: "",                       // 城市矢量徽标（可选，留空显示默认小火车图标）\n' +
            '            folder: "./city/' + cityId + '",\n' +
            '            mainLogic: "./city/' + cityId + '/' + cityId + '.js",\n' +
            '            center: { x: ' + Math.round(project.canvas.width / 2) + ', y: ' + Math.round(project.canvas.height / 2) + ' },\n' +
            '            defaultScale: 1.0,\n' +
            '            mapSize: { width: ' + project.canvas.width + ', height: ' + project.canvas.height + ' },\n' +
            '            searchCity: "' + cityName + '",\n' +
            '            title: "CGo OpenMap - ' + cityName + '轨道交通线路图",\n' +
            '            keywords: "CGo OpenMap, ' + cityName + ', 轨道交通, 线路图",\n' +
            '            description: "由 CGo OpenMap 线路图在线编辑器生成的' + cityName + '轨道交通线路图。",\n' +
            '            registerDate: "' + today + '",\n' +
            '            status: "active",\n' +
            '            maintainers: [],\n' +
            '            isDefault: false\n' +
            '        },\n';

        var swAssets = '/**\n' +
            ' * 集成片段 2/3：把下列资源路径补充进 sw.js 的 ASSETS_TO_CACHE 数组，\n' +
            ' * 并务必同步递增 CACHE_NAME 版本号，否则离线缓存不会更新。\n' +
            ' */\n\n' +
            '    // 城市配置与业务数据 (' + cityName + ')\n' +
            [
                './city/' + cityId + '/' + cityId + '.js',
                './city/' + cityId + '/stacard/script.js',
                './city/' + cityId + '/data_stations.js',
                './city/' + cityId + '/data_lines.js',
                './city/' + cityId + '/data_virtual_transfers.js',
                './city/' + cityId + '/data_scattered.js',
                './city/' + cityId + '/data_legend.js',
                './city/' + cityId + '/data_timetable.js',
                './city/' + cityId + '/data_notopen.js',
                './city/' + cityId + '/staname.csv'
            ].concat(hasWater ? ['./city/' + cityId + '/assets/' + cityId + '_waters.svg'] : [])
                .map(function (p) { return "    '" + p + "',"; }).join('\n') + '\n';

        var manifestSnippet = JSON.stringify({
            name: cityName + '轨道交通',
            short_name: cityName,
            description: '查看' + cityName + '轨道交通线网图',
            url: './main.html?city=' + cityId,
            icons: [
                { src: './assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' }
            ]
        }, null, 2) + '\n';

        // ---- README ----
        var stats = {
            stations: stationOrder.length,
            temps: tempCount,
            lines: lineEntries.length,
            waters: project.waters.length,
            canvas: project.canvas.width + ' × ' + project.canvas.height
        };
        var lineSummary = lineEntries.map(function (e) {
            return { id: e.id, name: e.name, ways: e.ways.length, loop: !!e.isLoop, branch: !!e.hasbranch };
        });
        var readme = buildOpenMapReadme({
            cityId: cityId, cityName: cityName, themeColor: themeColor,
            company: company, pxMeter: pxMeter, stats: stats,
            lines: lineSummary, warnings: warnings, hasWater: hasWater
        });

        // ---- 文件清单 ----
        var root = 'cgo-openmap-' + cityId + '/';
        var files = [
            { name: root + 'README.md', text: readme },
            { name: root + 'city/' + cityId + '/' + cityId + '.js', text: cityJs },
            { name: root + 'city/' + cityId + '/data_stations.js', text: stationsOut },
            { name: root + 'city/' + cityId + '/data_lines.js', text: linesOut },
            { name: root + 'city/' + cityId + '/data_legend.js', text: legendOut },
            { name: root + 'city/' + cityId + '/data_notopen.js', text: notopenOut },
            { name: root + 'city/' + cityId + '/data_scattered.js', text: scatteredOut },
            { name: root + 'city/' + cityId + '/data_virtual_transfers.js', text: virtualOut },
            { name: root + 'city/' + cityId + '/data_timetable.js', text: timetableOut },
            { name: root + 'city/' + cityId + '/staname.csv', text: stanameCsv },
            { name: root + 'city/' + cityId + '/stacard/script.js', text: staCardOut },
            { name: root + 'snippets/city-registry-entry.js', text: registrySnippet },
            { name: root + 'snippets/sw-assets-to-cache.js', text: swAssets },
            { name: root + 'snippets/manifest-shortcut.json', text: manifestSnippet }
        ];
        if (hasWater) files.splice(11, 0, { name: root + 'city/' + cityId + '/assets/' + cityId + '_waters.svg', text: waterSvg });

        return {
            cityId: cityId, stats: stats, warnings: warnings,
            lines: lineSummary,
            files: files
        };
    }

    /** 城市 ID → 小驼峰前缀（用于生成标识符） */
    function camelId(cityId) {
        return String(cityId || 'city').split(/[-_]/).map(function (part) {
            return part ? part.charAt(0).toUpperCase() + part.slice(1) : '';
        }).join('') || 'City';
    }

    /** 生成 zip 内的 README.md 集成说明 */
    function buildOpenMapReadme(info) {
        var L = [];
        L.push('# ' + info.cityName + ' · CGo OpenMap 城市工程包');
        L.push('');
        L.push('本工程包由 **CGo OpenMap 线路图在线编辑器** 自动生成，已按项目城市目录规范组织，');
        L.push('解压后直接覆盖到仓库根目录即可完成文件落地（其余步骤见下）。');
        L.push('');
        L.push('## 一、工程内容');
        L.push('');
        L.push('| 项目 | 数值 |');
        L.push('| --- | --- |');
        L.push('| 城市 ID | `' + info.cityId + '` |');
        L.push('| 城市名称 | ' + info.cityName + ' |');
        L.push('| 主题色 | `' + info.themeColor + '` |');
        L.push('| 画布尺寸 | ' + info.stats.canvas + ' px |');
        L.push('| 车站数 | ' + info.stats.stations + ' |');
        L.push('| 线路数 | ' + info.stats.lines + ' |');
        L.push('| 水域多边形 | ' + info.stats.waters + ' |');
        L.push('| 站距比例 | ' + info.pxMeter + ' 米/像素（用于反算站间距，需按实际里程校正） |');
        L.push('| 运营公司 | ' + info.company + ' |');
        L.push('');
        L.push('## 二、文件清单');
        L.push('');
        L.push('```text');
        L.push('city/' + info.cityId + '/');
        L.push('├── ' + info.cityId + '.js  # 城市运行时元数据与能力接口');
        L.push('├── data_stations.js  # 车站坐标、中英文站名、对齐方式与字号比例');
        L.push('├── data_lines.js  # 线路颜色、站序、站间距与绘制折线点阵');
        L.push('├── data_legend.js  # 图例分组与线路关联');
        L.push('├── data_virtual_transfers.js  # 站外虚拟换乘（待补充）');
        L.push('├── data_scattered.js  # 背景装饰物（含水域底图）');
        L.push('├── data_notopen.js  # 在建/规划走向（待补充）');
        L.push('├── data_timetable.js  # 首末班车时刻表（待补充）');
        L.push('├── staname.csv  # 站名检索别名库');
        if (info.hasWater) L.push('├── assets/' + info.cityId + '_waters.svg  # 编辑器水域多边形导出的底图');
        L.push('└── stacard/script.js  # 车站卡片占位实现（可替换为高德切片版本）');
        L.push('');
        L.push('snippets/city-registry-entry.js  # 粘贴进 city/data.js 的注册条目');
        L.push('snippets/sw-assets-to-cache.js  # 粘贴进 sw.js 的离线缓存清单');
        L.push('snippets/manifest-shortcut.json  # 粘贴进 manifest.json 的快捷入口');
        L.push('```');
        L.push('');
        L.push('## 三、集成步骤');
        L.push('');
        L.push('1. **落地文件**：把 `city/' + info.cityId + '/` 整个目录复制到仓库 `city/` 下。');
        L.push('2. **注册城市**：打开 `city/data.js`，把 `snippets/city-registry-entry.js` 中的对象粘贴进 `CITY_REGISTRY`。');
        L.push('3. **更新离线缓存**：把 `snippets/sw-assets-to-cache.js` 中的路径补充进 `sw.js` 的 `ASSETS_TO_CACHE`，');
        L.push('   **并递增 `CACHE_NAME` 版本号**（项目铁律：任何文件变更都必须更新 SW 缓存版本）。');
        L.push('4. **登记 PWA 快捷入口**：把 `snippets/manifest-shortcut.json` 追加到 `manifest.json` 的 `shortcuts` 数组。');
        L.push('5. **自检**：访问 `main.html?city=' + info.cityId + '`，核对车站位置、线路颜色、换乘站双环样式与站名排布。');
        L.push('');
        L.push('## 四、线路导出一览');
        L.push('');
        L.push('| 线路 ID | 线路名 | 结构 | 走线条数 |');
        L.push('| --- | --- | --- | --- |');
        info.lines.forEach(function (l) {
            L.push('| `' + l.id + '` | ' + l.name + ' | ' + (l.loop ? '环线' : (l.branch ? '主/支线' : '普通单线')) + ' | ' + l.ways + ' |');
        });
        L.push('');
        L.push('## 五、待人工完善项');
        L.push('');
        L.push('- `distances` 由画布几何按 ' + info.pxMeter + ' 米/像素反算，单位为米，请以实际里程校正；');
        L.push('- `data_timetable.js`、`data_virtual_transfers.js`、`data_notopen.js` 为占位空结构，按需补充；');
        L.push('- `stacard/script.js` 为占位实现，如需周边地图请参照青岛做法替换；');
        L.push('- 车站键取自编辑器中的「站编号」，若为空则暂用内部节点 ID，请整理为 `M{线路号}{序号}` 规范格式；');
        L.push('- `staname.csv` 仅生成基础别名行，可按历史站名沿革补充多版本拼音。');
        if (info.warnings && info.warnings.length) {
            L.push('');
            L.push('## 六、导出时的自检提示');
            L.push('');
            info.warnings.forEach(function (w) { L.push('- ' + w); });
        }
        L.push('');
        L.push('---');
        L.push('');
        L.push('坐标系与 CGo OpenMap 数据层一致：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，坐标可直接使用。');
        return L.join('\n') + '\n';
    }

    // ---------------------------- 导出对话框 ----------------------------

    function currentOpenMapDefaults() {
        var firstLine = project && project.lines.length ? project.lines[0] : null;
        return {
            cityId: '',
            cityName: '',
            themeColor: (firstLine && /^#[0-9a-fA-F]{6}$/.test(firstLine.color || '')) ? firstLine.color : '#00263b',
            linePrefix: 'M',
            pxMeter: OM_PX_METER_DEFAULT,
            company: ''
        };
    }

    function openOpenMapDialog() {
        if (!project) { toast('请先创建画布'); return; }
        var d = currentOpenMapDefaults();
        $('om-city-id').value = d.cityId;
        $('om-city-name').value = d.cityName;
        $('om-theme-color').value = d.themeColor;
        $('om-line-prefix').value = d.linePrefix;
        $('om-px-meter').value = d.pxMeter;
        $('om-company').value = d.company;
        renderOpenMapPreview();
        $('om-modal').classList.add('open');
    }

    function closeOpenMapDialog() { $('om-modal').classList.remove('open'); }

    function openMapOptions() {
        return {
            cityId: $('om-city-id').value,
            cityName: $('om-city-name').value,
            themeColor: $('om-theme-color').value,
            linePrefix: $('om-line-prefix').value,
            pxMeter: $('om-px-meter').value,
            company: $('om-company').value
        };
    }

    function renderOpenMapPreview() {
        var host = $('om-preview');
        var filesHost = $('om-files');
        if (!host) return;
        if (!project) { host.innerHTML = ''; return; }
        var opts = openMapOptions();
        var idError = '';
        if (!slugCityId(opts.cityId)) idError = '请填写城市 ID（仅小写字母、数字、下划线、连字符，如 fuzhou）';
        var pkg;
        try {
            pkg = buildOpenMapPackage(opts);
        } catch (e) {
            host.innerHTML = '<p class="om-error">生成失败：' + escapeHtml(e.message || String(e)) + '</p>';
            return;
        }
        var html = '<div class="om-stat-row">' +
            '<span class="om-stat"><b>' + pkg.stats.stations + '</b> 车站</span>' +
            '<span class="om-stat"><b>' + pkg.stats.lines + '</b> 线路</span>' +
            '<span class="om-stat"><b>' + pkg.stats.waters + '</b> 水域</span>' +
            '<span class="om-stat"><b>' + pkg.files.length + '</b> 文件</span>' +
            '</div>';
        var total = pkg.files.reduce(function (sum, f) { return sum + (f.text ? f.text.length : (f.data ? f.data.length : 0)); }, 0);
        var rawId = String(opts.cityId || '').trim();
        html += '<p class="om-hint">将生成 <b>city/' + escapeHtml(pkg.cityId) + '/</b> 目录，共 ' + pkg.files.length +
            ' 个文件，预计解压体积约 ' + (total / 1024).toFixed(1) + ' KB，压缩为 zip 下载' +
            (rawId && rawId !== pkg.cityId ? '（城市 ID 已规范化为 ' + escapeHtml(pkg.cityId) + '）' : '') + '。</p>';
        if (idError) html += '<p class="om-error">' + escapeHtml(idError) + '</p>';
        if (pkg.warnings.length) {
            html += '<div class="om-warn"><cgo-icon name="warning" size="13"></cgo-icon><div><b>自检提示（' + pkg.warnings.length + '）</b><ul>' +
                pkg.warnings.map(function (w) { return '<li>' + escapeHtml(w) + '</li>'; }).join('') + '</ul></div></div>';
        } else {
            html += '<p class="om-ok"><cgo-icon name="check-circle" size="13"></cgo-icon> 自检通过：站序连续、车站引用完整、线路颜色合法。</p>';
        }
        host.innerHTML = html;
        if (filesHost) {
            filesHost.innerHTML = pkg.files.map(function (f) { return '<div class="om-file">' + escapeHtml(f.name) + '</div>'; }).join('');
        }
        $('om-download').disabled = !!idError;
    }

    async function downloadOpenMapPackage() {
        if (!project) { toast('请先创建画布'); return; }
        var opts = openMapOptions();
        if (!slugCityId(opts.cityId)) { toast('请填写合法的城市 ID'); return; }
        var btn = $('om-download');
        var oldHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<cgo-icon name="loading" size="14"></cgo-icon><span>正在打包…</span>';
        try {
            var pkg = buildOpenMapPackage(opts);
            var bytes = await buildZipBytes(pkg.files);
            download('cgo-openmap-' + pkg.cityId + '.zip', bytes, 'application/zip');
            closeOpenMapDialog();
            toast('已导出 ' + pkg.cityId + ' 城市工程包（' + pkg.files.length + ' 个文件，' + (bytes.length / 1024).toFixed(1) + ' KB）');
        } catch (e) {
            toast('导出失败：' + (e.message || e));
        } finally {
            btn.innerHTML = oldHtml;
            btn.disabled = false;
        }
    }

    // ==========================================================================
    // 17. 模态框与操作说明
    // ==========================================================================

    function openModal(title, tip, content) {
        $('modal-title').textContent = title;
        $('modal-tip').textContent = tip || '';
        $('modal-text').value = content || '';
        $('modal').classList.add('open');
    }

    function closeModal() { $('modal').classList.remove('open'); }

    function helpContent() {
        return [
            'CGo OpenMap 线路图在线编辑器 · 操作说明',
            '================================================',
            '',
            '【一、画布与直角坐标系】',
            '1. 在左侧「画布」中填写宽高，点击「新建画布并建立直角坐标系」；',
            '2. 原点 O 位于画布左上角顶点：X 轴沿上边缘向右为正（红色），Y 轴沿左边缘向下为正（绿色）；',
            '3. 该坐标系与 CGo OpenMap 数据层完全一致，导出的站点坐标无需任何换算；',
            '4. 网格与坐标刻度可在「网格对齐」中独立显隐，默认 5px 一格，缩放较小时网格会自动稀疏。',
            '',
            '【二、添加元素】',
            '1. 车站节点：圆形，描边使用所在线路的颜色；',
            '2. 临时节点：黑色 × 表示，用于自由路径的转折锚点，不参与换乘站判定；',
            '3. 线段：135° 折角 / 90° 折角 / XY 轴平行直线 / 自由路径；',
            '4. 路径编辑模式下开启「线段自动选型」，绘制时按两端节点坐标自动选择走线类型：',
            '   · 两端与坐标轴平行        → XY 轴平行直线',
            '   · 两端位于对角带内        → 135° 折角（45° 斜边 + 轴平行段）',
            '   · 其余情况                → 90° 折角（取较短的一种 L 形走线）',
            '5. 水域：依次点击添加顶点，双击或按 Enter 闭合，Esc 取消。',
            '6. 「刷新线段配置」按钮：一键按当前节点布局重算全部自动走线线段；',
            '   车站节点与临时节点一视同仁，含临时节点的连接同样会重算并保持夹角；',
            '   仅含 3 个以上转折点的手绘自由路径保持不变。',
            '7. 拖动车站节点或临时节点时，与之相连的线段会实时重新计算走线与折角类型，',
            '   135° 折角的夹角始终严格为 135°。',
            '',
            '【三、属性编辑】',
            '1. 左键点击车站节点 → 右侧「属性」面板可编辑站编号、中英文站名、站名字号、',
            '   所属线路与站名定位方式；',
            '   所属线路支持多条：在「加入」下拉中选线路后点击「加入」即可新增，',
            '   点线路条目右侧的 × 可移除；列表首条决定车站描边色（已连线时以连接线路为准）。',
            '   所属线路会随连线自动同步：绘制线段时自动把该线路并入两端车站，线段改换线路时自动移出旧线路；',
            '   所属线路（含连接的线路）达到 2 条即自动视为换乘站。',
            '2. 站名定位方式有两种（互斥）：',
            '   · 对齐方式（自动排布）：只用「站名对齐方式」+ 文本偏移，不显示坐标控件；',
            '   · 指定坐标（精确控制）：只显示站名坐标 X/Y，由填入的坐标直接决定站名位置；',
            '     此时站名不再随站点移动，可用「取当前自动位置」以现状为起点再微调；',
            '3. 点击线段可切换所属线路与折角类型，并「重算走线」；',
            '4. 折角调整（选中线段后显示）：',
            '   · 圆角大小：直接拖动线段上的折角控制柄（圆点）沿角平分线内外移动即可实时增减，',
            '     也可在「折角调整」中输入精确数值（px）；点「默认圆角」恢复内置值',
            '     （90° 折角 18px、135° 折角 8px，与核心引擎一致）；',
            '   · 折角方向：点「翻折角方向」按钮，或按住 Shift 用左键点击线段即可快捷翻转，',
            '     90° 折角在两条 L 形走线之间切换，135° 折角把斜边换到另一侧，端点始终保持不变；',
            '   · 翻转与自定义圆角都会记录在线段数据中，节点移动或「刷新线段配置」后依然保持。',
            '5. 点击临时节点可修改坐标；点击水域多边形后会显示全部顶点控制柄，',
            '   直接拖动控制柄即可调整水域形状，也可在属性面板中逐点输入精确坐标。',
            '',
            '【四、换乘站自动样式】',
            '同一车站被 2 条及以上线路连接（或所属线路达到 2 条）时，自动切换为换乘站样式（双环外圈）；',
            '线路减少到 1 条时会自动恢复为普通站样式，临时节点永远不受影响。',
            '',
            '【五、快捷键】',
            '工具切换：L 线段（按当前样式） / S 车站节点 / N 临时节点 / 0 选择模式',
            '         1 车站节点 / 2 临时节点 / 3 135°折角 / 4 90°折角 /',
            '         5 轴平行直线 / 6 自由路径 / 7 水域',
            '编辑操作：Ctrl+A 选择所有节点 / Ctrl+C 复制选中节点 /',
            '         Ctrl+V 粘贴到鼠标指针位置（多节点保持相对布局）/',
            '         Ctrl+D 原位复制一份选中节点（落在原位置附近）/ Delete 删除选中 /',
            '         Ctrl+Z 撤销 / Ctrl+Y（或 Ctrl+Shift+Z）重做 / Ctrl+S 保存到本地',
            '绘制过程：Esc 取消绘制或返回选择模式 / Enter 结束当前绘制',
            '多选节点：按住 Shift 或 Ctrl 点击节点可增减选择；多选后可整体复制、粘贴与删除',
            '折角快捷调整：Shift+左键点击线段 = 翻转折角方向（选中线段后拖动折角圆点 = 改圆角半径）',
            '视图：滚轮缩放 / 中键或空格拖拽平移 / 触控端双指捏合缩放',
            '',
            '【六、导出】',
            '「更多」菜单可导出工程 JSON（继续编辑）、城市代码（stationsData / linesData，',
            '坐标自动转换为 OpenMap 标准数据层坐标系）以及 SVG 图片。',
            '「导出 OpenMap 工程包」会按项目城市目录规范一键生成 zip 压缩包，内含：',
            '   · city/{city_id}/ 全套数据文件：{city_id}.js、data_stations.js、data_lines.js、',
            '     data_legend.js、data_scattered.js、data_virtual_transfers.js、data_notopen.js、',
            '     data_timetable.js、staname.csv、stacard/script.js；',
            '   · 水域多边形导出的 assets/{city_id}_waters.svg（有水域时）；',
            '   · snippets/ 集成片段：city/data.js 注册条目、sw.js 离线缓存清单、manifest.json 快捷入口；',
            '   · README.md 集成步骤、导出一览与待人工完善项。',
            '对话框可设置城市 ID/名称、主题色、线路 ID 前缀、站距比例（米/像素）与运营公司，',
            '并会实时显示自检结果（站序连续性、车站引用完整性、线路颜色合法性等）。',
            '',
            '提示：工程会自动暂存到浏览器本地，刷新页面后可恢复；若页面表现与修改不符，',
            '请优先排查 Service Worker 缓存（可强制刷新或在偏好设置中清除缓存）。',
            '',
            '快速体验：在「更多」菜单中点击「载入示例工程」，或访问',
            'city-editor/index.html?demo=1 直接载入包含换乘站、四种线段与水域的示例。'
        ].join('\n');
    }

    // ==========================================================================
    // 17. 示例工程（便于快速体验全部元素类型）
    // ==========================================================================

    function seedDemoProject() {
        createCanvas(2000, 1500, true);

        var l1 = createLine('1号线', LINE_PALETTE[0]);
        var l2 = createLine('2号线', LINE_PALETTE[1]);
        activeLineId = l1.id;

        // 1 号线：沿 X 轴水平走行，末端 90° 折角下行（Y 向下为正）
        var a1 = newStationNode(320, 420);
        a1.code = 'M101'; a1.cn = '西客站'; a1.en = 'West Station'; a1.align = 'top';
        var a2 = newStationNode(620, 420);
        a2.code = 'M102'; a2.cn = '中心广场'; a2.en = 'Central Square'; a2.align = 'top';
        var a3 = newStationNode(920, 420);
        a3.code = 'M103'; a3.cn = '东湖'; a3.en = 'East Lake'; a3.align = 'bottom';
        var a4 = newStationNode(1220, 540);
        a4.code = 'M104'; a4.cn = '机场'; a4.en = 'Airport'; a4.align = 'bottom';

        // 2 号线：经过「中心广场」，构成换乘站
        var b1 = newStationNode(620, 900);
        b1.code = 'M201'; b1.cn = '南门'; b1.en = 'South Gate'; b1.align = 'bottom';
        var b2 = newStationNode(920, 720);
        b2.code = 'M202'; b2.cn = '大学城'; b2.en = 'University Town'; b2.align = 'right';
        b2.offsetX = 14; b2.offsetY = 0;
        var b3 = newStationNode(1320, 320);
        b3.code = 'M203'; b3.cn = '北苑'; b3.en = 'North Garden'; b3.align = 'left';
        b3.offsetX = -14; b3.offsetY = 0;

        // 临时节点（黑色 ×）：自由路径的转折锚点
        var t1 = newTempNode(1100, 950);

        // 1 号线线段
        addDemoSegment(l1.id, a1, a2);
        addDemoSegment(l1.id, a2, a3);
        addDemoSegment(l1.id, a3, a4);
        // 2 号线线段（a2「中心广场」被两条线路连接 → 自动换乘站样式）
        addDemoSegment(l2.id, b1, a2);
        addDemoSegment(l2.id, a2, b2);
        addDemoSegment(l2.id, b2, b3);
        // 自由路径：经过临时节点
        addDemoFreeSegment(l2.id, b1, t1, 420, 1120);

        // 水域：贯穿画布底部的示例河道
        project.waters.push({
            id: nextId('W'),
            name: '示例河道',
            points: [
                { x: 120, y: 1200 },
                { x: 900, y: 1230 },
                { x: 1500, y: 1140 },
                { x: 1900, y: 1210 },
                { x: 1900, y: 1450 },
                { x: 120, y: 1450 }
            ],
            fill: WATER_DEFAULT.fill,
            opacity: WATER_DEFAULT.opacity
        });

        activeLineId = l1.id;
        clearSelection();
        draft = null;
        undoStack.length = 0;
        redoStack.length = 0;
        syncLineSelect();
        resetView();
        viewFitted = true;
        renderInspector();
        syncTopButtons();
        $('stage-empty').hidden = true;
        scheduleFit();
        toast('已载入示例工程：可直接体验换乘站自动样式、折角线段与水域');
    }

    function addDemoSegment(lineId, nodeA, nodeB) {
        var routed = autoRouteBetween(nodeA, nodeB);
        var points = routed.points.map(function (p) { return { x: p.x, y: p.y }; });
        points[0].nid = nodeA.id;
        points[points.length - 1].nid = nodeB.id;
        project.segments.push({ id: nextId('G'), lineId: lineId, type: routed.type, points: points, routed: true });
        addLineToNode(nodeA, lineId);
        addLineToNode(nodeB, lineId);
    }

    function addDemoFreeSegment(lineId, nodeA, viaNode, x, y) {
        var end = newTempNode(x, y);
        project.segments.push({
            id: nextId('G'),
            lineId: lineId,
            type: 'segfree',
            routed: false,
            points: [
                { x: nodeA.x, y: nodeA.y, nid: nodeA.id },
                { x: viaNode.x, y: viaNode.y, nid: viaNode.id },
                { x: end.x, y: end.y, nid: end.id }
            ]
        });
        addLineToNode(nodeA, lineId);
    }

    // ==========================================================================
    // 18. 事件绑定与初始化
    // ==========================================================================

    function syncAutoButton() {
        $('btn-auto-route').classList.toggle('active', autoRoute);
        $('chk-auto').checked = autoRoute;
    }

    function bindUI() {
        // 左侧工具按钮
        document.querySelectorAll('.tool-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tool = btn.getAttribute('data-tool');
                if (!project) { toast('请先创建画布'); return; }
                var next = activeTool === tool ? 'select' : tool;
                // 手动选择具体线段类型时退出「自动选型」；点击「自动选型」按钮进入路径编辑模式
                if (next.indexOf('seg') === 0) {
                    autoRoute = false;
                    syncAutoButton();
                }
                setTool(next);
            });
        });

        // 画布
        $('btn-create-canvas').addEventListener('click', function () { applyCanvasSize(); });
        $('btn-empty-create').addEventListener('click', function () { applyCanvasSize(); });
        $('btn-empty-open').addEventListener('click', function () { fileInput.click(); });
        $('btn-new-canvas').addEventListener('click', newCanvasFromInputs);

        // 网格
        $('chk-snap').addEventListener('change', function () {
            toast(this.checked ? '已开启网格对齐（' + gridSize() + ' px）' : '已关闭网格对齐');
        });
        $('sel-grid').addEventListener('change', function () {
            renderAll();
            toast('网格大小已设为 ' + gridSize() + ' px');
        });
        $('chk-grid').addEventListener('change', renderAll);

        // 自动选型
        $('chk-auto').addEventListener('change', function () {
            autoRoute = this.checked;
            syncAutoButton();
            updateStageInfo();
            toast(autoRoute ? '已开启线段自动选型' : '已切换为手动线段类型');
        });
        $('btn-auto-route').addEventListener('click', function () {
            autoRoute = !autoRoute;
            syncAutoButton();
            if (autoRoute) setTool('segaxis'); else setTool('select');
            updateStageInfo();
            toast(autoRoute ? '已进入路径编辑模式：按两端节点自动选择折线类型' : '已退出线段自动选型');
        });

        // 一键刷新：按当前车站布局重算全部自动线段
        $('btn-refresh-segments').addEventListener('click', refreshSegmentsFromLayout);

        // 视图
        $('btn-zoom-in').addEventListener('click', function () {
            var r = svgEl().getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2);
        });
        $('btn-zoom-out').addEventListener('click', function () {
            var r = svgEl().getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.2);
        });
        $('btn-zoom-reset').addEventListener('click', function () { if (project) resetView(); });
        $('btn-toggle-sidebar').addEventListener('click', function () {
            var main = document.querySelector('.editor-main');
            if (window.innerWidth <= 900) main.classList.toggle('sidebar-open');
            else main.classList.toggle('sidebar-collapsed');
        });

        // 顶部操作
        $('btn-undo').addEventListener('click', undo);
        $('btn-redo').addEventListener('click', redo);

        var optionsBtn = $('options-btn');
        optionsBtn.addEventListener('click', function (ev) {
            ev.stopPropagation();
            optionsBtn.parentElement.classList.toggle('open');
        });
        document.addEventListener('click', function () { optionsBtn.parentElement.classList.remove('open'); });

        $('btn-save').addEventListener('click', function () { saveToLocal(true); });
        $('btn-open').addEventListener('click', function () { fileInput.click(); });
        $('btn-export-json').addEventListener('click', function () {
            if (!project) { toast('请先创建画布'); return; }
            download('cgo-openmap-project.json', JSON.stringify(project, null, 2));
            toast('已导出工程 JSON');
        });
        $('btn-export-code').addEventListener('click', function () {
            if (!project) { toast('请先创建画布'); return; }
            openModal('导出城市代码',
                '将以下代码保存为 city/{city_id}/data_stations.js 与 data_lines.js，并按城市移植流程注册与更新 sw.js 缓存版本号。',
                buildCityCode());
        });
        $('btn-export-svg').addEventListener('click', function () {
            if (!project) { toast('请先创建画布'); return; }
            download('cgo-openmap-map.svg', buildSvgExport(), 'image/svg+xml;charset=utf-8');
            toast('已导出 SVG 图片');
        });
        $('btn-export-openmap').addEventListener('click', function () {
            if (!project) { toast('请先创建画布'); return; }
            openOpenMapDialog();
        });
        $('btn-clear').addEventListener('click', function () {
            if (!project) { toast('请先创建画布'); return; }
            if (!window.confirm('确定清空当前画布的全部元素吗？')) return;
            pushHistory();
            project.nodes = {};
            project.segments = [];
            project.waters = [];
            project.lines = [];
            activeLineId = null;
            clearSelection();
            syncLineSelect();
            renderAll();
            renderInspector();
            toast('已清空画布元素');
        });
        $('btn-demo').addEventListener('click', function () {
            if (project && (Object.keys(project.nodes).length || project.segments.length)) {
                if (!window.confirm('载入示例工程会覆盖当前画布内容，是否继续？')) return;
            }
            seedDemoProject();
        });
        $('btn-help').addEventListener('click', function () {
            openModal('编辑器操作说明',
                '坐标系与 CGo OpenMap 数据层一致：原点 O 位于画布左上角，X 轴向右为正，Y 轴向下为正。',
                helpContent());
        });

        // 模态框
        $('modal-close').addEventListener('click', closeModal);
        $('modal-ok').addEventListener('click', closeModal);
        $('modal-copy').addEventListener('click', function () {
            var text = $('modal-text');
            text.select();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text.value).then(function () {
                    toast('已复制到剪贴板');
                }, function () {
                    document.execCommand('copy');
                    toast('已复制到剪贴板');
                });
            } else {
                document.execCommand('copy');
                toast('已复制到剪贴板');
            }
        });
        $('modal').addEventListener('click', function (ev) { if (ev.target === $('modal')) closeModal(); });

        // OpenMap 城市工程包导出对话框
        $('om-close').addEventListener('click', closeOpenMapDialog);
        $('om-cancel').addEventListener('click', closeOpenMapDialog);
        $('om-download').addEventListener('click', function () { downloadOpenMapPackage(); });
        $('om-modal').addEventListener('click', function (ev) { if (ev.target === $('om-modal')) closeOpenMapDialog(); });
        ['om-city-id', 'om-city-name', 'om-theme-color', 'om-line-prefix', 'om-px-meter', 'om-company'].forEach(function (id) {
            var el = $(id);
            if (!el) return;
            el.addEventListener('input', renderOpenMapPreview);
            el.addEventListener('change', renderOpenMapPreview);
        });

        // 属性 / 元素选项卡
        document.querySelectorAll('.inspector-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var name = tab.getAttribute('data-tab');
                document.querySelectorAll('.inspector-tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
                $('panel-props').classList.toggle('active', name === 'props');
                $('panel-list').classList.toggle('active', name === 'list');
                if (window.innerWidth <= 900) document.querySelector('.editor-main').classList.add('inspector-open');
            });
        });

        // 画布舞台事件
        var canvas = $('stage-canvas');
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);
        canvas.addEventListener('dblclick', onDoubleClick);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);
        canvas.addEventListener('contextmenu', function (ev) {
            ev.preventDefault();
            if (draft) { draft = null; renderDraft(); toast('已取消当前绘制'); }
        });

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // 工程文件导入
        fileInput = $('file-input');
        fileInput.addEventListener('change', function () {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
                try {
                    var data = JSON.parse(String(reader.result));
                    if (!data || !data.canvas) throw new Error('缺少 canvas 字段');
                    project = normalizeProject(data);
                    activeLineId = project.lines.length ? project.lines[0].id : null;
                    undoStack.length = 0;
                    redoStack.length = 0;
                    clearSelection();
                    draft = null;
                    syncLineSelect();
                    resetView();
                    viewFitted = true;
                    renderInspector();
                    syncTopButtons();
                    $('stage-empty').hidden = true;
                    scheduleFit();
                    toast('已打开工程文件：' + file.name);
                } catch (err) {
                    toast('打开失败：' + err.message);
                }
                fileInput.value = '';
            };
            reader.readAsText(file, 'utf-8');
        });

        // 主题变化时重绘（颜色由 CSS 变量驱动，部分内联色需重算）
        if (window.matchMedia) {
            var mq = window.matchMedia('(prefers-color-scheme: dark)');
            var onThemeChange = function () { if (project) renderAll(); };
            if (mq.addEventListener) mq.addEventListener('change', onThemeChange);
            else if (mq.addListener) mq.addListener(onThemeChange);
        }
        new MutationObserver(function () {
            if (project) renderAll();
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        window.addEventListener('resize', handleStageResize);
        if (window.ResizeObserver) {
            sizeObserver = new ResizeObserver(handleStageResize);
            sizeObserver.observe($('stage-canvas'));
        }
    }

    function init() {
        syncSvgSize();
        bindUI();
        bindLineControls();
        setTool('select');
        syncAutoButton();
        syncTopButtons();
        updateStageInfo();

        // 调试与自动化测试探针
        window.__cgoEditor = {
            getProject: function () { return project ? deepClone(project) : null; },
            getView: function () { return { k: view.k, cx: view.cx, cy: view.cy }; },
            bounds: function () { return project ? visibleWorldBounds() : null; },
            size: function () { return stageSize(); },
            worldToClient: function (x, y) { return project ? worldToClient(x, y) : null; },
            screenToWorld: function (x, y) { return project ? screenToWorld(x, y) : null; },
            select: function (kind, id) { selection = { type: kind, id: id }; renderAll(); renderInspector(); },
            setTool: setTool,
            isAutoRoutable: function (index) { return isAutoRoutable(project.segments[index || 0]); },
            nodeLines: function (id) {
                var n = project.nodes[id];
                return n ? { lineIds: (n.lineIds || []).slice(), lineId: n.lineId } : null;
            },
            addLine: function (id, lineId) { return addLineToNode(project.nodes[id], lineId); },
            removeLine: function (id, lineId) { return removeLineFromNode(project.nodes[id], lineId); },
            clearPointer: function () { pointerWorld = null; },
            getSelection: function () { return selection ? deepClone(selection) : null; },
            /** 线段折角信息（供自动化测试定位控制柄） */
            cornerInfo: function (index) {
                var seg = project.segments[index || 0];
                if (!seg) return null;
                return {
                    type: seg.type, points: deepClone(seg.points),
                    radii: segmentRadii(seg), canFlip: hasCornerDirection(seg),
                    flip: seg.cornerFlip === true,
                    handles: segmentCornerHandles(seg).map(function (h) { return { x: h.x, y: h.y, hx: h.hx, hy: h.hy, radius: h.radius }; })
                };
            },
            liveRecompute: function (nodeId) { liveRecomputeSegmentsFor(project.nodes[nodeId]); },
            moveNode: function (nodeId, x, y) {
                var n = project.nodes[nodeId];
                if (!n) return null;
                n.x = x; n.y = y;
                syncNodeSegments(n);
                liveRecomputeSegmentsFor(n);
                renderAll();
                return project.segments[0] ? project.segments[0].points : null;
            },
            refreshStats: function () { return refreshAutoSegments(null); },
            segDiag: function (nodeId) {
                var n = project.nodes[nodeId];
                var s = project.segments[0];
                if (!n || !s) return null;
                var p = s.points;
                return {
                    isAutoRoutable: isAutoRoutable(s), nodeType: n.type, nodeId: n.id,
                    pointCount: p.length, endpointNids: [p[0].nid, p[p.length - 1].nid],
                    linked: p.some(function (q) { return q.nid === n.id; })
                };
            },
            refit: function () { resetView(); viewFitted = true; return { size: stageSize(), k: view.k }; },
            clear: function () { draft = null; clearSelection(); },
            /**
             * 调试探针：生成 OpenMap 城市工程包并返回 Base64 字节流，
             * 供自动化测试在 Node 侧解压校验（不触发浏览器下载）。
             */
            buildOpenMapPackage: async function (opts) {
                var pkg = buildOpenMapPackage(opts || {});
                var bytes = await buildZipBytes(pkg.files);
                return {
                    cityId: pkg.cityId, stats: pkg.stats, warnings: pkg.warnings, lines: pkg.lines,
                    files: pkg.files.map(function (f) { return f.name; }),
                    size: bytes.length, base64: bytesToBase64(bytes)
                };
            }
        };

        var params = new URLSearchParams(window.location.search);
        var demoRequested = params.get('demo') === '1';

        // 优先恢复本地工程，其次载入示例工程（?demo=1），最后展示空状态
        if (demoRequested) {
            seedDemoProject();
        } else if (!loadFromLocal()) {
            $('stage-empty').hidden = false;
            renderInspector();
        }

        // 自动暂存
        setInterval(function () { if (project) saveToLocal(false); }, 20000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
