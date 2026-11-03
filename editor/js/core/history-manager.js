/**
 * 开放地图编辑器 (OpenMap Editor) - 统一撤销与重做历史管理器
 * 提供集中、统一的全局撤销与重做历史栈管理
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.HistoryManager = (function () {
    'use strict';

    var MAX_STEPS = 120;                                  // 步数上限（小工程够用到最初一步）
    var MAX_TOTAL_CHARS = 8 * 1024 * 1024;                 // 总字符预算：大工程按内存裁剪，避免爆内存
    var undoStack = [];
    var undoMeta = [];
    var redoStack = [];
    var redoMeta = [];
    var listeners = [];
    var dirtyCounter = 0;

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
            dirtyCounter: dirtyCounter
        };
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](state);
            } catch (err) {
                console.error('[HistoryManager] 回调执行失败:', err);
            }
        }
    }

    /**
     * 压入历史快照
     * @param {Object} data 待保存的数据快照（内部自动深拷贝）
     * @param {string} [label] 操作说明（用于历史记录面板展示）
     */
    function pushSnapshot(data, label) {
        if (!data) return;
        var snapshot = JSON.stringify(data);
        // 与栈顶重复：说明自上一步以来什么都没变（常见于"只点了一下选中"、
        // 拖拽没真正移动、连续两次守卫都压栈等），压进去只会浪费一步撤销额度。
        if (undoStack.length && undoStack[undoStack.length - 1] === snapshot) return;
        undoStack.push(snapshot);
        undoMeta.push({ label: label || '编辑工程', time: formatTime() });
        trimStacks();
        // 新改动触发时清空 redo 栈
        redoStack = [];
        redoMeta = [];
        dirtyCounter++;
        notify();
    }

    /**
     * 压入一个已经序列化好的快照（拖拽类操作在按下时先存基线，释放时才压栈）
     * @param {string} json 由 JSON.stringify 得到的工程快照字符串
     * @param {string} [label] 操作说明
     */
    function pushSnapshotRaw(json, label) {
        if (!json) return;
        if (undoStack.length && undoStack[undoStack.length - 1] === json) return;
        undoStack.push(json);
        undoMeta.push({ label: label || '拖拽调整', time: formatTime() });
        trimStacks();
        redoStack = [];
        redoMeta = [];
        dirtyCounter++;
        notify();
    }

    /**
     * 撤销 (Undo)
     * @param {Object} currentData 当前最新数据（存入 redo 栈）
     * @returns {Object|null} 恢复的历史数据对象
     */
    function undo(currentData) {
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
