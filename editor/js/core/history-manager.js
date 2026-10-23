/**
 * 开放地图编辑器 (OpenMap Editor) - 统一撤销与重做历史管理器
 * 消解原 city-editor 与 drunk 两处重复的撤销栈实现
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.HistoryManager = (function () {
    'use strict';

    var MAX_STEPS = 60;
    var undoStack = [];
    var redoStack = [];
    var listeners = [];
    var dirtyCounter = 0;

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
     */
    function pushSnapshot(data) {
        if (!data) return;
        var snapshot = JSON.stringify(data);
        undoStack.push(snapshot);
        if (undoStack.length > MAX_STEPS) {
            undoStack.shift();
        }
        // 新改动触发时清空 redo 栈
        redoStack = [];
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
        if (currentData) {
            redoStack.push(JSON.stringify(currentData));
        }
        var prevStr = undoStack.pop();
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
        if (currentData) {
            undoStack.push(JSON.stringify(currentData));
        }
        var nextStr = redoStack.pop();
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
        redoStack = [];
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

    return {
        pushSnapshot: pushSnapshot,
        undo: undo,
        redo: redo,
        canUndo: canUndo,
        canRedo: canRedo,
        clear: clear,
        markSaved: markSaved,
        onChange: onChange,
        getDirtyCount: function () { return dirtyCounter; }
    };
})();

// 保留全局别名兼容
window.HistoryManager = window.OpenMapEditor.HistoryManager;
