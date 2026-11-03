/**
 * 开放地图编辑器 (OpenMap Editor) - Agent-Native 编程式控制通道 (AgentAPI)
 * 对标 VectorCraft 的 JSON-RPC 与 MCP (Model Context Protocol) 开放设计
 * 为 AI Coding Agent 及外部自动化工作流提供无头状态自省、批量图元操作与交付管道
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.AgentAPI = (function () {
    'use strict';

    function getApp() {
        return window.OpenMapEditor._appContext || null;
    }

    /**
     * 获取当前工程的完整结构化快照 (Deep Clone)
     * @returns {Object|null}
     */
    function getSnapshot() {
        var app = getApp();
        if (!app || !app.project) return null;
        return JSON.parse(JSON.stringify(app.project));
    }

    /**
     * 获取当前激活选区
     * @returns {Object|null} { type, id, ... }
     */
    function getSelection() {
        var app = getApp();
        if (!app) return null;
        return app.selected ? JSON.parse(JSON.stringify(app.selected)) : null;
    }

    /**
     * 编程式选中图元并飞跃居中
     * @param {string} type 'node'|'line'|'segment'|'water'|'text'|'multi'
     * @param {string|Array<string>} idOrIds 
     */
    function select(type, idOrIds) {
        var app = getApp();
        if (!app || !app.project) return false;

        if (type === 'multi' && Array.isArray(idOrIds)) {
            app.selected = { type: 'multi', nodeIds: idOrIds.slice() };
        } else if (typeof idOrIds === 'string') {
            app.selected = { type: type, id: idOrIds };
            if (type === 'node' && app.project.nodes[idOrIds]) {
                var n = app.project.nodes[idOrIds];
                window.OpenMapEditor.ViewportLayer.centerOn(n.x, n.y);
            }
        }
        if (typeof window.OpenMapEditor.renderAll === 'function') {
            window.OpenMapEditor.renderAll();
        }
        return true;
    }

    /**
     * 执行原子命令批处理 (Batch Command Execution)
     * @param {Array<Object>} commands 
     * @returns {{ success: boolean, executedCount: number, error?: string }}
     */
    function execute(commands) {
        var app = getApp();
        if (!app || !app.project || !Array.isArray(commands)) {
            return { success: false, executedCount: 0, error: '画布未就绪或命令非数组' };
        }

        window.OpenMapEditor.HistoryManager.pushSnapshot(app.project, 'Agent 批处理指令');
        var count = 0;

        try {
            for (var i = 0; i < commands.length; i++) {
                var cmd = commands[i];
                if (!cmd || !cmd.type) continue;

                switch (cmd.type) {
                    case 'moveNode':
                        if (app.project.nodes[cmd.id]) {
                            app.project.nodes[cmd.id].x = Math.round(cmd.x);
                            app.project.nodes[cmd.id].y = Math.round(cmd.y);
                            count++;
                        }
                        break;
                    case 'updateLine':
                        var line = (app.project.lines || []).find(function (l) { return l.id === cmd.id; });
                        if (line) {
                            if (cmd.name) line.name = cmd.name;
                            if (cmd.color) line.color = cmd.color;
                            if (cmd.strokeWidth) line.strokeWidth = cmd.strokeWidth;
                            count++;
                        }
                        break;
                    case 'addText':
                        app.project.texts = app.project.texts || [];
                        var newText = {
                            id: window.OpenMapEditor.ProjectModel.nextId(app.project, 'text'),
                            text: cmd.text || '注释文字',
                            x: Math.round(cmd.x || 100),
                            y: Math.round(cmd.y || 100),
                            size: cmd.size || 14,
                            bold: !!cmd.bold,
                            anchor: cmd.anchor || 'start',
                            rotate: cmd.rotate || 0,
                            color: cmd.color || '#0f172a'
                        };
                        app.project.texts.push(newText);
                        count++;
                        break;
                    case 'setTool':
                        if (typeof window.OpenMapEditor.setTool === 'function') {
                            window.OpenMapEditor.setTool(cmd.tool);
                            count++;
                        }
                        break;
                }
            }

            if (typeof window.OpenMapEditor.renderAll === 'function') {
                window.OpenMapEditor.renderAll();
            }
            return { success: true, executedCount: count };
        } catch (err) {
            return { success: false, executedCount: count, error: err.message || String(err) };
        }
    }

    /**
     * 导出纯净 SVG 字符串
     * @returns {string}
     */
    function renderSvgString() {
        var app = getApp();
        if (!app || !app.project) return '';
        var svgEl = document.getElementById('editorSvg');
        if (!svgEl || !window.OpenMapEditor.BundleExporter) return '';
        var cleanSvg = window.OpenMapEditor.BundleExporter.prepareCleanSvgClone(svgEl, app.project);
        return new XMLSerializer().serializeToString(cleanSvg);
    }

    return {
        getSnapshot: getSnapshot,
        getSelection: getSelection,
        select: select,
        execute: execute,
        renderSvgString: renderSvgString
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.AgentAPI;
}

