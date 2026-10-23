/**
 * 开放地图编辑器 (OpenMap Editor) - 自由规划与 CAD 式交互绘制流水线
 * 负责空白画布绘制、135°/90° 折角交互放线、临时节点连线与几何吸附
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.PipelineDraw = (function () {
    'use strict';

    var activeTool = 'select';
    var activeLineId = null;
    var draftSegment = null; // { startNodeId, startPoint, currentPoint, toolType }
    var draftWater = null;   // { points: [] }

    function setTool(toolName) {
        activeTool = toolName;
        draftSegment = null;
        draftWater = null;
    }

    function setActiveLine(lineId) {
        activeLineId = lineId;
    }

    /**
     * 处理画布点击事件 (创建节点、连线首尾点、水域多边形)
     * @param {Object} project
     * @param {{x:number, y:number}} worldPos
     * @param {string|null} targetNodeId 点击命中的已有节点 ID (若有)
     * @returns {{ updated: boolean, action: string, createdId?: string }}
     */
    function handleCanvasClick(project, worldPos, targetNodeId) {
        if (!project) return { updated: false, action: 'none' };
        var router = window.OpenMapEditor.SegmentRouter;
        var pModel = window.OpenMapEditor.ProjectModel;

        // 1. 放置车站 (station)
        if (activeTool === 'station') {
            var stId = pModel.nextId(project, 'station_');
            project.nodes[stId] = {
                id: stId,
                x: worldPos.x,
                y: worldPos.y,
                cn: '新站 ' + project.idSeq,
                en: 'Station ' + project.idSeq,
                type: 'dot',
                align: 'top',
                offset: { x: 0, y: 0 }
            };
            return { updated: true, action: 'create_node', createdId: stId };
        }

        // 2. 放置临时节点 (temp)
        if (activeTool === 'temp') {
            var tempId = pModel.nextId(project, 'temp_');
            project.nodes[tempId] = {
                id: tempId,
                x: worldPos.x,
                y: worldPos.y,
                type: 'temp'
            };
            return { updated: true, action: 'create_node', createdId: tempId };
        }

        // 3. 走线连线工具 (seg135, seg90, seg90d, segaxis, segratio)
        if (/^seg/.test(activeTool)) {
            var startNid = targetNodeId;
            if (!draftSegment) {
                // 第一击：记录起点
                draftSegment = {
                    startNodeId: startNid || null,
                    startPoint: { x: worldPos.x, y: worldPos.y },
                    currentPoint: { x: worldPos.x, y: worldPos.y },
                    toolType: activeTool
                };
                return { updated: false, action: 'draft_start' };
            } else {
                // 第二击：完成线段
                var p1 = draftSegment.startNodeId ? project.nodes[draftSegment.startNodeId] : draftSegment.startPoint;
                var p2 = targetNodeId ? project.nodes[targetNodeId] : worldPos;

                var routeResult = router.routeBetweenByType(p1, p2, activeTool, false, project.slope);
                var segPts = routeResult.map(function (p) { return { x: p.x, y: p.y }; });

                if (draftSegment.startNodeId) segPts[0].nid = draftSegment.startNodeId;
                if (targetNodeId) segPts[segPts.length - 1].nid = targetNodeId;

                var segId = pModel.nextId(project, 'seg_');
                var lineId = activeLineId || (project.lines[0] && project.lines[0].id) || 'L1';

                project.segments.push({
                    id: segId,
                    lineId: lineId,
                    type: activeTool,
                    points: segPts,
                    routed: true
                });

                draftSegment = null;
                return { updated: true, action: 'create_segment', createdId: segId };
            }
        }

        // 4. 绘制水域要素 (water)
        if (activeTool === 'water') {
            if (!draftWater) {
                draftWater = { points: [worldPos] };
                return { updated: false, action: 'draft_water_point' };
            } else {
                draftWater.points.push(worldPos);
                // 3 点以上闭合
                if (draftWater.points.length >= 3 && Math.hypot(worldPos.x - draftWater.points[0].x, worldPos.y - draftWater.points[0].y) < 15) {
                    var wid = pModel.nextId(project, 'water_');
                    project.waters.push({
                        id: wid,
                        name: '水域 ' + project.idSeq,
                        type: 'poly',
                        points: draftWater.points.slice(0, -1)
                    });
                    draftWater = null;
                    return { updated: true, action: 'create_water', createdId: wid };
                }
                return { updated: false, action: 'draft_water_point' };
            }
        }

        // 5. 自由文本标注 (text)
        if (activeTool === 'text') {
            var txtId = pModel.nextId(project, 'text_');
            project.texts.push({
                id: txtId,
                text: '标注文本',
                x: worldPos.x,
                y: worldPos.y,
                size: 14,
                color: '',
                anchor: 'start',
                rotate: 0
            });
            return { updated: true, action: 'create_text', createdId: txtId };
        }

        return { updated: false, action: 'none' };
    }

    function cancelDraft() {
        draftSegment = null;
        draftWater = null;
    }

    return {
        setTool: setTool,
        setActiveLine: setActiveLine,
        handleCanvasClick: handleCanvasClick,
        cancelDraft: cancelDraft,
        getActiveTool: function () { return activeTool; },
        getDraftSegment: function () { return draftSegment; }
    };
})();

// 保留全局别名兼容
window.PipelineDraw = window.OpenMapEditor.PipelineDraw;
