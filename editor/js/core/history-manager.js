/**
 * 开放地图编辑器 (OpenMap Editor) - 统一撤销与重做历史管理器 (Transactional Undo/Redo)
 * 提供集中、统一的全局撤销与重做历史栈管理，支持：
 *   1. 双阈值预算裁剪（步数上限 + 内存字符上限）；
 *   2. 显式原子事务（beginTransaction / commitTransaction / cancelTransaction / runInTransaction），
 *      嵌套或多步复合操作（批量平移、多线并轨、RMP 导入等）自动合并为单条撤销记录；
 *   3. 连续微操防抖合并（pushDebounced），连续敲字或微调属性不产生碎粒度撤销步；
 *   4. 撤销后选区存活校验（sanitizeSelection），杜绝恢复后指向幽灵节点报错。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.HistoryManager = (function () {
    'use strict';

    var MAX_STEPS = 120;                                  // 步数上限（小工程够用到最初一步）
    var MAX_TOTAL_CHARS = 8 * 1024 * 1024;                 // 总字符预算：大工程按内存裁剪，避免爆内存
    var DEFAULT_DEBOUNCE_MS = 800;                         // 连续微操防抖合并窗口 (ms)

    var undoStack = [];
    var undoMeta = [];
    var redoStack = [];
    var redoMeta = [];
    var listeners = [];
    var dirtyCounter = 0;

    // 显式原子事务状态
    var txDepth = 0;
    var txBaselineJson = null;
    var txLabel = '';

    // 防抖合并状态
    var lastDebounceKey = null;
    var lastDebounceTime = 0;

    function formatTime() {
        var d = new Date();
        var h = ('0' + d.getHours()).slice(-2);
        var m = ('0' + d.getMinutes()).slice(-2);
        var s = ('0' + d.getSeconds()).slice(-2);
        return h + ':' + m + ':' + s;
    }

    /**
     * 按「步数 + 总字符预算」裁剪最旧的历史。
     * 只按步数裁剪时，一个大工程 60 步就够呛、小工程又回退不了太远；
     * 这里改成双阈值：小工程能一直退到最初，大工程内存也不会失控。
     */
    function trimStacks() {
        var total = 0;
        for (var i = 0; i < undoStack.length; i++) total += undoStack[i].length;
        for (var j = 0; j < redoStack.length; j++) total += redoStack[j].length;
        while (undoStack.length > 1 && (undoStack.length > MAX_STEPS || total > MAX_TOTAL_CHARS)) {
            total -= undoStack.shift().length;
            undoMeta.shift();
        }
        while (redoStack.length > MAX_STEPS) {
            total -= redoStack.shift().length;
            redoMeta.shift();
        }
    }

    function notify() {
        var state = {
            canUndo: undoStack.length > 0,
            canRedo: redoStack.length > 0,
            undoCount: undoStack.length,
            redoCount: redoStack.length,
            dirtyCounter: dirtyCounter,
            inTransaction: txDepth > 0
        };
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](state);
            } catch (err) {
                console.error('[HistoryManager] 回调执行失败:', err);
            }
        }
    }

    function commitRawInternal(json, label) {
        if (!json) return false;
        var snapshot = json;
        if (undoStack.length && undoStack[undoStack.length - 1] === snapshot) return false;
        undoStack.push(json);
        undoMeta.push({ label: label || '编辑工程', time: formatTime() });
        trimStacks();
        redoStack = [];
        redoMeta = [];
        dirtyCounter++;
        notify();
        return true;
    }

    /**
     * 压入历史快照（若当前处于显式事务中，则自动被最外层事务吸收合并）
     * @param {Object} data 待保存的数据快照（内部自动深拷贝）
     * @param {string} [label] 操作说明（用于历史记录面板展示）
     */
    function pushSnapshot(data, label) {
        if (!data) return;
        lastDebounceKey = null;
        if (txDepth > 0) {
            if (!txBaselineJson) {
                txBaselineJson = JSON.stringify(data);
            }
            if (label && !txLabel) {
                txLabel = label;
            }
            return;
        }
        var snapshot = JSON.stringify(data);
        commitRawInternal(snapshot, label || '编辑工程');
    }

    /**
     * 压入一个已经序列化好的快照（拖拽类操作在按下时先存基线，释放时才压栈）
     * @param {string} json 由 JSON.stringify 得到的工程快照字符串
     * @param {string} [label] 操作说明
     */
    function pushSnapshotRaw(json, label) {
        if (!json) return;
        lastDebounceKey = null;
        if (txDepth > 0) {
            if (!txBaselineJson) {
                txBaselineJson = json;
            }
            if (label && !txLabel) {
                txLabel = label;
            }
            return;
        }
        commitRawInternal(json, label || '拖拽调整');
    }

    /**
     * 防抖合并压入快照：同一控件/属性在时间窗口内连续修改时只保留首次修改前的基线，
     * 避免输入框逐字输入或滚轮微调产生几十条碎粒度撤销记录。
     * @param {Object} data 修改前的数据对象
     * @param {string} debounceKey 合并标识键（如 'node:M101:cn'）
     * @param {string} [label] 操作描述
     * @param {number} [windowMs=800] 合并时间窗口（毫秒）
     */
    function pushDebounced(data, debounceKey, label, windowMs) {
        if (!data) return;
        var now = Date.now();
        var win = (typeof windowMs === 'number' && windowMs >= 0) ? windowMs : DEFAULT_DEBOUNCE_MS;
        if (debounceKey && debounceKey === lastDebounceKey && (now - lastDebounceTime) <= win && undoStack.length > 0) {
            // 仍在同一防抖窗口内：更新时间戳与栈顶标题即可，不重复压入中间快照
            lastDebounceTime = now;
            if (label && undoMeta.length > 0) {
                undoMeta[undoMeta.length - 1].label = label;
                undoMeta[undoMeta.length - 1].time = formatTime();
            }
            return;
        }
        var snapshot = JSON.stringify(data);
        if (txDepth > 0) {
            if (!txBaselineJson) txBaselineJson = snapshot;
            if (label && !txLabel) txLabel = label;
            return;
        }
        if (commitRawInternal(snapshot, label || '修改属性')) {
            lastDebounceKey = debounceKey || null;
            lastDebounceTime = now;
        }
    }

    /**
     * 开启显式原子事务（支持嵌套调用，仅最外层生效）
     * @param {Object|string} [baselineData] 事务开始前的工程对象或已序列化的 JSON 字符串
     * @param {string} [label] 事务名称
     */
    function beginTransaction(baselineData, label) {
        if (txDepth === 0) {
            if (typeof baselineData === 'string') {
                txBaselineJson = baselineData;
            } else if (baselineData && typeof baselineData === 'object') {
                txBaselineJson = JSON.stringify(baselineData);
            } else {
                txBaselineJson = null;
            }
            txLabel = label || '';
            lastDebounceKey = null;
        } else if (label && !txLabel) {
            txLabel = label;
        }
        txDepth++;
    }

    /**
     * 提交显式原子事务：比对事务开启前基线与当前最新状态，若发生了实质变化则压入单条撤销记录
     * @param {Object|string} [currentData] 事务结束后的最新工程对象（可选，传入时会自动比对是否无变化）
     * @param {string} [label] 覆盖事务操作名称
     * @returns {boolean} 是否实际压入了新撤销步
     */
    function commitTransaction(currentData, label) {
        if (txDepth <= 0) return false;
        txDepth--;
        if (label) txLabel = label;
        if (txDepth > 0) return false; // 嵌套内层事务结束，等待最外层提交

        var baseJson = txBaselineJson;
        var finalLabel = txLabel || '批量编辑操作';
        txBaselineJson = null;
        txLabel = '';

        if (!baseJson) return false;

        if (currentData !== undefined && currentData !== null) {
            var curJson = (typeof currentData === 'string') ? currentData : JSON.stringify(currentData);
            if (curJson === baseJson) {
                // 事务期间没有任何实质数据改变，静默丢弃基线，不污染撤销栈
                return false;
            }
        }
        return commitRawInternal(baseJson, finalLabel);
    }

    /**
     * 取消/回滚当前显式事务：丢弃事务基线，不压入撤销栈
     * @returns {Object|null} 返回事务开启前保存的基线数据副本（若有）
     */
    function cancelTransaction() {
        var baseJson = txBaselineJson;
        txDepth = 0;
        txBaselineJson = null;
        txLabel = '';
        return baseJson ? JSON.parse(baseJson) : null;
    }

    function inTransaction() {
        return txDepth > 0;
    }

    /**
     * 在原子事务保护下运行同步函数 fn
     * @param {Object} project 当前工程对象
     * @param {string} label 事务标签
     * @param {Function} fn 执行逻辑
     */
    function runInTransaction(project, label, fn) {
        beginTransaction(project, label);
        try {
            var res = fn();
            commitTransaction(project, label);
            return res;
        } catch (err) {
            cancelTransaction();
            throw err;
        }
    }

    /**
     * 校验并净化撤销/重做后的选区状态，剔除在新工程快照中已不存在的节点/文本/线段 ID
     * @param {Object|null} selected 当前选区对象
     * @param {Object} project 恢复后的工程对象
     * @returns {Object|null} 安全的选区对象
     */
    function sanitizeSelection(selected, project) {
        if (!selected || !project) return null;
        var nodes = project.nodes || {};
        var texts = project.texts || [];
        var segments = project.segments || [];
        var waters = project.waters || [];

        if (selected.type === 'node') {
            return nodes[selected.id] ? selected : null;
        }
        if (selected.type === 'text') {
            var hasT = texts.some(function (t) { return t && t.id === selected.id; });
            return hasT ? selected : null;
        }
        if (selected.type === 'segment') {
            var seg = segments.find(function (s) { return s && s.id === selected.id; });
            if (!seg) return null;
            if (typeof selected.pointIdx === 'number' && (!seg.points || selected.pointIdx >= seg.points.length)) {
                return { type: 'segment', id: selected.id };
            }
            return selected;
        }
        if (selected.type === 'water') {
            var w = waters.find(function (item) { return item && item.id === selected.id; });
            return w ? selected : null;
        }
        if (selected.type === 'multi') {
            var validNodes = (selected.nodeIds || []).filter(function (id) { return !!nodes[id]; });
            var validTexts = (selected.textIds || []).filter(function (id) {
                return texts.some(function (t) { return t && t.id === id; });
            });
            if (validNodes.length === 0 && validTexts.length === 0) return null;
            if (validNodes.length === 1 && validTexts.length === 0) {
                return { type: 'node', id: validNodes[0] };
            }
            if (validNodes.length === 0 && validTexts.length === 1) {
                return { type: 'text', id: validTexts[0] };
            }
            return { type: 'multi', nodeIds: validNodes, textIds: validTexts };
        }
        return selected;
    }

    /**
     * 撤销 (Undo)
     * @param {Object} currentData 当前最新数据（存入 redo 栈）
     * @returns {Object|null} 恢复的历史数据对象
     */
    function undo(currentData) {
        if (txDepth > 0) cancelTransaction();
        lastDebounceKey = null;
        if (!undoStack.length) return null;

        // 跳过与当前状态完全相同的快照：
        // 快照是"改动发生前"压入的，若期间实际没有产生变化（只是点了选中、
        // 拖了但没移动、或者两个守卫各压了一次），恢复它等于什么都没做。
        var currentJson = currentData ? JSON.stringify(currentData) : null;
        var prevStr = null;
        var candidateMeta = null;
        while (undoStack.length) {
            var candidate = undoStack.pop();
            var meta = undoMeta.pop();
            if (currentJson === null || candidate !== currentJson) {
                prevStr = candidate;
                candidateMeta = meta;
                break;
            }
        }
        if (prevStr === null) {
            notify();
            return null;
        }
        if (currentJson !== null) {
            redoStack.push(currentJson);
            redoMeta.push(candidateMeta || { label: '撤销前状态', time: formatTime() });
        }
        dirtyCounter = Math.max(0, dirtyCounter - 1);
        notify();
        return JSON.parse(prevStr);
    }

    /**
     * 重做 (Redo)
     * @param {Object} currentData 当前最新数据（存入 undo 栈）
     * @returns {Object|null} 恢复的重做数据对象
     */
    function redo(currentData) {
        if (txDepth > 0) cancelTransaction();
        lastDebounceKey = null;
        if (!redoStack.length) return null;

        var currentJson = currentData ? JSON.stringify(currentData) : null;
        var nextStr = null;
        var candidateMeta = null;
        while (redoStack.length) {
            var candidate = redoStack.pop();
            var meta = redoMeta.pop();
            if (currentJson === null || candidate !== currentJson) {
                nextStr = candidate;
                candidateMeta = meta;
                break;
            }
        }
        if (nextStr === null) {
            notify();
            return null;
        }
        if (currentJson !== null) {
            undoStack.push(currentJson);
            undoMeta.push(candidateMeta || { label: '重做前状态', time: formatTime() });
        }
        dirtyCounter++;
        notify();
        return JSON.parse(nextStr);
    }

    function canUndo() {
        return undoStack.length > 0;
    }

    function canRedo() {
        return redoStack.length > 0;
    }

    function clear() {
        undoStack = [];
        undoMeta = [];
        redoStack = [];
        redoMeta = [];
        dirtyCounter = 0;
        txDepth = 0;
        txBaselineJson = null;
        txLabel = '';
        lastDebounceKey = null;
        notify();
    }

    function markSaved() {
        dirtyCounter = 0;
        notify();
    }

    function onChange(fn) {
        if (typeof fn === 'function') {
            listeners.push(fn);
        }
    }

    /**
     * 获取完整历史记录列表（供历史面板展示）
     */
    function getHistoryList(currentLabel) {
        var items = [];
        for (var i = 0; i < undoStack.length; i++) {
            var m = undoMeta[i] || {};
            items.push({
                index: i,
                label: m.label || ('步骤 #' + (i + 1)),
                time: m.time || '',
                type: 'undo'
            });
        }
        var curIdx = undoStack.length;
        items.push({
            index: curIdx,
            label: currentLabel || (undoStack.length === 0 ? '初始工程状态' : '当前画布状态'),
            time: '当前',
            type: 'current'
        });
        for (var j = 0; j < redoStack.length; j++) {
            var rm = redoMeta[redoMeta.length - 1 - j] || {};
            items.push({
                index: curIdx + 1 + j,
                label: rm.label || ('重做步骤 #' + (j + 1)),
                time: rm.time || '',
                type: 'redo'
            });
        }
        return {
            items: items,
            currentIndex: curIdx,
            canUndo: undoStack.length > 0,
            canRedo: redoStack.length > 0
        };
    }

    /**
     * 跳转到指定历史步
     */
    function jumpToStep(targetIndex, currentData) {
        if (typeof targetIndex !== 'number') return currentData;
        var curIdx = undoStack.length;
        if (targetIndex === curIdx) return currentData;

        var data = currentData;
        if (targetIndex < curIdx) {
            var undoCount = curIdx - targetIndex;
            for (var u = 0; u < undoCount; u++) {
                var prev = undo(data);
                if (!prev) break;
                data = prev;
            }
            return data;
        } else if (targetIndex > curIdx) {
            var redoCount = targetIndex - curIdx;
            for (var r = 0; r < redoCount; r++) {
                var next = redo(data);
                if (!next) break;
                data = next;
            }
            return data;
        }
        return data;
    }

    return {
        pushSnapshot: pushSnapshot,
        pushSnapshotRaw: pushSnapshotRaw,
        pushDebounced: pushDebounced,
        beginTransaction: beginTransaction,
        startTransaction: beginTransaction,
        commitTransaction: commitTransaction,
        cancelTransaction: cancelTransaction,
        abortTransaction: cancelTransaction,
        inTransaction: inTransaction,
        runInTransaction: runInTransaction,
        sanitizeSelection: sanitizeSelection,
        undo: undo,
        redo: redo,
        canUndo: canUndo,
        canRedo: canRedo,
        clear: clear,
        markSaved: markSaved,
        onChange: onChange,
        getDirtyCount: function () { return dirtyCounter; },
        getHistoryList: getHistoryList,
        jumpToStep: jumpToStep
    };
})();

// 保留全局别名兼容
window.HistoryManager = window.OpenMapEditor.HistoryManager;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.HistoryManager;
}
