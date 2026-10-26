(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.OpenMapEditor = root.OpenMapEditor || {};
        root.OpenMapEditor.PipelineDraw = factory();
        root.PipelineDraw = root.OpenMapEditor.PipelineDraw;
    }
})(typeof window !== 'undefined' ? window : globalThis, function () {
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
     * 计算点到线段的最近投影点与平方距离
     * @param {{x:number, y:number}} pt 目标点
     * @param {{x:number, y:number}} p1 线段起点
     * @param {{x:number, y:number}} p2 线段终点
     * @returns {{ projection: {x:number, y:number}, t: number, distSq: number }}
     */
    function projectPointToSegment(pt, p1, p2) {
        var vx = p2.x - p1.x;
        var vy = p2.y - p1.y;
        var wx = pt.x - p1.x;
        var wy = pt.y - p1.y;
        var lenSq = vx * vx + vy * vy;
        if (lenSq < 1e-6) {
            var d2 = wx * wx + wy * wy;
            return { projection: { x: p1.x, y: p1.y }, t: 0, distSq: d2 };
        }
        var t = (wx * vx + wy * vy) / lenSq;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        var projX = p1.x + t * vx;
        var projY = p1.y + t * vy;
        var dx = pt.x - projX;
        var dy = pt.y - projY;
        return {
            projection: { x: projX, y: projY },
            t: t,
            distSq: dx * dx + dy * dy
        };
    }

    /**
     * 查找距离指定世界坐标最近的线路折线及其投影吸附点
     * @param {Object} project 工程模型
     * @param {{x:number, y:number}} worldPos 目标坐标
     * @param {number} [maxDistance=22] 最大吸附像素阈值
     * @returns {Object|null} 命中信息或 null
     */
    function findNearestLineProjection(project, worldPos, maxDistance) {
        if (!project || !project.segments || !worldPos) return null;
        var maxDist = typeof maxDistance === 'number' ? maxDistance : 22;
        var maxDistSq = maxDist * maxDist;

        var best = null;
        var minDistanceSq = maxDistSq;

        for (var sIdx = 0; sIdx < project.segments.length; sIdx++) {
            var seg = project.segments[sIdx];
            var pts = seg.points || [];
            if (pts.length < 2) continue;

            for (var i = 0; i < pts.length - 1; i++) {
                var p1 = pts[i];
                var p2 = pts[i + 1];
                var res = projectPointToSegment(worldPos, p1, p2);
                if (res.distSq <= minDistanceSq) {
                    minDistanceSq = res.distSq;
                    best = {
                        segment: seg,
                        lineId: seg.lineId,
                        branchKey: seg.branchKey,
                        pointIndex: i,
                        p1: p1,
                        p2: p2,
                        projection: {
                            x: Math.round(res.projection.x),
                            y: Math.round(res.projection.y)
                        },
                        t: res.t,
                        distance: Math.sqrt(res.distSq)
                    };
                }
            }
        }
        return best;
    }

    /**
     * 在已有线路上在线智能插入车站节点并完成拓扑站序与折线切分
     * @param {Object} project 工程模型
     * @param {Object} snapInfo 由 findNearestLineProjection 返回的投影信息
     * @param {Object} [customStationData] 自定义车站属性 (可选)
     * @returns {{ createdId: string, node: Object, lineId: string, groupKey: string }|null}
     */
    function insertStationOnLine(project, snapInfo, customStationData) {
        if (!project || !snapInfo || !snapInfo.segment) return null;

        var pModel = (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.ProjectModel) ||
            (typeof ProjectModel !== 'undefined' ? ProjectModel : null);

        var seg = snapInfo.segment;
        var ptIdx = snapInfo.pointIndex;
        var t = snapInfo.t;
        var projX = snapInfo.projection.x;
        var projY = snapInfo.projection.y;

        // 1. 生成唯一车站 ID 与节点对象
        var stId = pModel ? pModel.nextId(project, 'station_') : ('station_' + (++project.idSeq || 1));
        var defaultStation = {
            id: stId,
            x: projX,
            y: projY,
            cn: '新站 ' + (project.idSeq || stId),
            en: 'Station ' + (project.idSeq || stId),
            type: 'dot',
            align: 'top',
            offset: { x: 0, y: 0 }
        };
        var node = Object.assign(defaultStation, customStationData || {});
        project.nodes[stId] = node;

        // 2. 找到线路上前后最近的有 nid 的车站（用于精准拓扑站序插入）
        var prevNid = null;
        for (var bi = ptIdx; bi >= 0; bi--) {
            if (seg.points[bi] && seg.points[bi].nid && project.nodes[seg.points[bi].nid]) {
                prevNid = seg.points[bi].nid;
                break;
            }
        }
        var nextNid = null;
        for (var fi = ptIdx + 1; fi < seg.points.length; fi++) {
            if (seg.points[fi] && seg.points[fi].nid && project.nodes[seg.points[fi].nid]) {
                nextNid = seg.points[fi].nid;
                break;
            }
        }

        // 3. 在 seg.points 中切分或插入新折点（保持折线走向完全连贯）
        if (t < 0.05 && ptIdx === 0) {
            seg.points[0].nid = stId;
            seg.points[0].x = projX;
            seg.points[0].y = projY;
        } else if (t > 0.95 && ptIdx === seg.points.length - 2) {
            seg.points[seg.points.length - 1].nid = stId;
            seg.points[seg.points.length - 1].x = projX;
            seg.points[seg.points.length - 1].y = projY;
        } else {
            var newPt = { x: projX, y: projY, nid: stId };
            seg.points.splice(ptIdx + 1, 0, newPt);
        }

        // 4. 更新对应线路的 stationIds 与 distances
        var targetLine = (project.lines || []).find(function (l) { return l.id === seg.lineId; });
        var targetGroupKey = 'stationIds';

        if (targetLine) {
            // 查找最佳目标站序分组（支持多分支线路）
            var candidateKeys = [];
            if (seg.branchKey) {
                var simplifiedKey = seg.branchKey.replace('pathPoints-', '').replace('seg-', '');
                candidateKeys.push('stationIds-' + simplifiedKey);
                if (simplifiedKey === 'main') candidateKeys.push('stationIds', 'stationIds-way1');
                if (simplifiedKey === 'branch1') candidateKeys.push('stationIds-way1');
                if (simplifiedKey === 'branch2') candidateKeys.push('stationIds-way2');
            }
            candidateKeys.push('stationIds');
            Object.keys(targetLine).forEach(function (k) {
                if (/^stationIds-/.test(k) && candidateKeys.indexOf(k) === -1) {
                    candidateKeys.push(k);
                }
            });

            // 优先选取包含 prevNid 或 nextNid 的分组
            var chosenKey = null;
            for (var k = 0; k < candidateKeys.length; k++) {
                var testKey = candidateKeys[k];
                var arr = targetLine[testKey];
                if (Array.isArray(arr)) {
                    var hasPrev = prevNid && arr.indexOf(prevNid) !== -1;
                    var hasNext = nextNid && arr.indexOf(nextNid) !== -1;
                    if (hasPrev && hasNext) {
                        chosenKey = testKey;
                        break;
                    }
                    if (!chosenKey && (hasPrev || hasNext)) {
                        chosenKey = testKey;
                    }
                }
            }
            if (!chosenKey) {
                chosenKey = targetLine.hasbranch ? (candidateKeys[0] || 'stationIds-way1') : 'stationIds';
                if (!Array.isArray(targetLine[chosenKey])) {
                    targetLine[chosenKey] = [];
                }
            }
            targetGroupKey = chosenKey;

            var stList = targetLine[targetGroupKey];
            if (Array.isArray(stList)) {
                var pIdxInLine = prevNid ? stList.indexOf(prevNid) : -1;
                var nIdxInLine = nextNid ? stList.indexOf(nextNid) : -1;

                var insertIdx = stList.length;
                if (pIdxInLine !== -1 && nIdxInLine !== -1) {
                    insertIdx = Math.max(pIdxInLine, nIdxInLine);
                } else if (pIdxInLine !== -1) {
                    insertIdx = pIdxInLine + 1;
                } else if (nIdxInLine !== -1) {
                    insertIdx = Math.max(0, nIdxInLine);
                }
                stList.splice(insertIdx, 0, stId);

                // 维护 distances 数组长度保持 stationIds.length - 1
                var distKey = targetGroupKey === 'stationIds' ? 'distances' : ('distances-' + targetGroupKey.replace('stationIds-', ''));
                if (Array.isArray(targetLine[distKey])) {
                    targetLine[distKey].splice(Math.max(0, insertIdx - 1), 0, null);
                }
            }
        }

        return {
            createdId: stId,
            node: node,
            lineId: seg.lineId,
            groupKey: targetGroupKey
        };
    }

    /**
     * 处理画布点击事件 (创建节点、连线首尾点、水域多边形)
     * @param {Object} project
     * @param {{x:number, y:number}} worldPos
     * @param {string|null} targetNodeId 点击命中的已有节点 ID (若有)
     * @returns {{ updated: boolean, action: string, createdId?: string, lineId?: string }}
     */
    /**
     * 把「起点 → 指针」约束到 45° 的整数倍方向（0/45/90/135…，含水平与垂直）。
     * 做法是把指针**投影到约束射线**上，所以拖动时距离仍然跟手，方向被锁死。
     * @returns {{x:number,y:number}} 约束后的点（未给起点时原样返回）
     */
    function constrainTo45(start, point, gridSize) {
        if (!start || !point) return point;
        var dx = point.x - start.x;
        var dy = point.y - start.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (!len) return { x: point.x, y: point.y };
        var step = Math.PI / 4;
        var ang = Math.round(Math.atan2(dy, dx) / step) * step;
        var ux = Math.cos(ang), uy = Math.sin(ang);
        var proj = dx * ux + dy * uy;
        if (proj < 0) proj = 0;

        // 同时开着网格吸附时，长度也要量化，才能"既锁方向又落在网格线上"：
        //   水平/垂直 → 长度取网格倍数；
        //   45° 对角 → 让 dx、dy 同时是网格倍数（沿对角线的步长是 g·√2）。
        var g = Number(gridSize) || 0;
        if (g > 0) {
            var axisAligned = Math.abs(ux) < 1e-6 || Math.abs(uy) < 1e-6;
            if (axisAligned) {
                proj = Math.round(proj / g) * g;
            } else {
                proj = Math.round(proj / (g * Math.SQRT2)) * g * Math.SQRT2;
            }
        }

        return {
            x: Math.round((start.x + ux * proj) * 100) / 100,
            y: Math.round((start.y + uy * proj) * 100) / 100
        };
    }

    /**
     * 草稿状态查询：编辑器据此实时画出"还没落定"的那一段。
     * @returns {{toolType:string, startNodeId:string|null, startPoint:{x,y}, currentPoint:{x,y}}|null}
     */
    function getDraft() {
        if (!draftSegment) return null;
        return {
            toolType: draftSegment.toolType,
            startNodeId: draftSegment.startNodeId || null,
            startPoint: { x: draftSegment.startPoint.x, y: draftSegment.startPoint.y },
            currentPoint: { x: draftSegment.currentPoint.x, y: draftSegment.currentPoint.y }
        };
    }

    /** 鼠标移动时更新草稿终点（只动内存，不含渲染） */
    function updateDraftPointer(worldPos) {
        if (!draftSegment || !worldPos) return false;
        draftSegment.currentPoint = { x: worldPos.x, y: worldPos.y };
        return true;
    }

    /**
     * 按当前折角类型把「起点 → 指针」路由成预览折点，与最终落笔用的是**同一个路由函数**，
     * 因此预览所见即所得。
     * @returns {Array<{x:number,y:number}>}
     */
    function getDraftPreviewPoints(project, slope) {
        if (!draftSegment) return [];
        var router = (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.SegmentRouter) ||
            (typeof SegmentRouter !== 'undefined' ? SegmentRouter : null);
        var p1 = draftSegment.startNodeId && project && project.nodes[draftSegment.startNodeId]
            ? project.nodes[draftSegment.startNodeId]
            : draftSegment.startPoint;
        var p2 = draftSegment.currentPoint;
        if (!p1 || !p2) return [];
        var segSlope = slope || (project && project.slope) || null;
        var pts = (router && typeof router.routeBetweenByType === 'function')
            ? router.routeBetweenByType(p1, p2, draftSegment.toolType, false, segSlope)
            : [p1, p2];
        return (pts || []).map(function (p) { return { x: p.x, y: p.y }; });
    }

    function hasDraft() {
        return !!draftSegment;
    }

    /**
     * @param {object} [opts]
     * @param {number} [opts.button] 触发本次点击的鼠标键：只有左键（0）才会落笔。
     *        中键是漫游键、右键是菜单/结束绘制，绝不能在画布上留下点或线段。
     */
    function handleCanvasClick(project, worldPos, targetNodeId, opts) {
        if (!project) return { updated: false, action: 'none' };
        // 双重保险：即便上层事件守卫被绕过，这里也不让中键/右键落笔
        if (opts && opts.button !== undefined && opts.button !== null && opts.button !== 0) {
            return { updated: false, action: 'ignored_button' };
        }
        var router = (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.SegmentRouter) ||
            (typeof SegmentRouter !== 'undefined' ? SegmentRouter : null);
        var pModel = (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.ProjectModel) ||
            (typeof ProjectModel !== 'undefined' ? ProjectModel : null);

        // 1. 放置车站 (station)
        if (activeTool === 'station') {
            // 优先检查是否命中线路吸附插站
            var snap = findNearestLineProjection(project, worldPos, 22);
            if (snap) {
                var inserted = insertStationOnLine(project, snap);
                if (inserted) {
                    return {
                        updated: true,
                        action: 'insert_station_on_line',
                        createdId: inserted.createdId,
                        lineId: inserted.lineId
                    };
                }
            }

            // 空白区域落点生成普通车站
            var stId = pModel ? pModel.nextId(project, 'station_') : ('station_' + (++project.idSeq || 1));
            project.nodes[stId] = {
                id: stId,
                x: worldPos.x,
                y: worldPos.y,
                cn: '新站 ' + (project.idSeq || stId),
                en: 'Station ' + (project.idSeq || stId),
                type: 'dot',
                align: 'top',
                offset: { x: 0, y: 0 }
            };
            return { updated: true, action: 'create_node', createdId: stId };
        }

        // 2. 放置临时节点 (temp)
        if (activeTool === 'temp') {
            var tempId = pModel ? pModel.nextId(project, 'temp_') : ('temp_' + (++project.idSeq || 1));
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

                // 零长度守卫：原地再点一次不算画线，也不打断连续绘制
                var sameNode = draftSegment.startNodeId && targetNodeId && draftSegment.startNodeId === targetNodeId;
                var samePoint = Math.hypot((p2.x || 0) - (p1.x || 0), (p2.y || 0) - (p1.y || 0)) < 1;
                if (sameNode || samePoint) {
                    return { updated: false, action: 'draft_same_point' };
                }

                var lineId = activeLineId || (project.lines[0] && project.lines[0].id) || 'L1';
                var targetLine = (project.lines || []).find(function (l) { return l.id === lineId; });
                var addStationToLine = function (nid) {
                    if (!nid || !project.nodes[nid] || project.nodes[nid].type === 'temp') return;
                    if (!targetLine) return;
                    if (!Array.isArray(targetLine.stationIds)) targetLine.stationIds = [];
                    if (targetLine.stationIds.indexOf(nid) === -1) targetLine.stationIds.push(nid);
                };

                // ---- 自由折线（segaxis）：把新点**追加到当前这条折线**，而不是另起一段 ----
                // 另起一段时两段只在端点处相切，拐角外侧会留出楔形缺口，看起来就是"端点没连起来"。
                if (activeTool === 'segaxis' && draftSegment.segmentId) {
                    var liveSeg = (project.segments || []).find(function (sg) { return sg.id === draftSegment.segmentId; });
                    if (liveSeg && Array.isArray(liveSeg.points) && liveSeg.points.length >= 2) {
                        var tail = { x: p2.x, y: p2.y };
                        if (targetNodeId) tail.nid = targetNodeId;
                        liveSeg.points.push(tail);
                        addStationToLine(targetNodeId);
                        draftSegment.startNodeId = targetNodeId || null;
                        draftSegment.startPoint = { x: p2.x, y: p2.y };
                        draftSegment.currentPoint = { x: p2.x, y: p2.y };
                        return { updated: true, action: 'extend_segment', createdId: liveSeg.id, chained: true };
                    }
                }

                // ---- 其余折角类型：按类型路由出一段，再链式继续 ----
                var routeResult = (router && typeof router.routeBetweenByType === 'function')
                    ? router.routeBetweenByType(p1, p2, activeTool, false, project.slope)
                    : [p1, p2];
                var segPts = routeResult.map(function (p) { return { x: p.x, y: p.y }; });

                if (draftSegment.startNodeId) segPts[0].nid = draftSegment.startNodeId;
                if (targetNodeId) segPts[segPts.length - 1].nid = targetNodeId;

                var segId = pModel ? pModel.nextId(project, 'seg_') : ('seg_' + (++project.idSeq || 1));

                project.segments.push({
                    id: segId,
                    lineId: lineId,
                    type: activeTool,
                    points: segPts,
                    routed: true
                });

                // 若首尾为车站节点，自动同步进线路站序
                addStationToLine(draftSegment.startNodeId);
                addStationToLine(targetNodeId);

                // 连续绘制（CAD 习惯）：不清空草稿，把刚画到的终点当作下一段的起点，
                // 于是可以一路点下去不断线；要结束就按 Esc 或右键。
                draftSegment = {
                    startNodeId: targetNodeId || null,
                    startPoint: { x: p2.x, y: p2.y },
                    currentPoint: { x: p2.x, y: p2.y },
                    toolType: activeTool,
                    // 自由折线记住这条折线，后续点击就能继续延长它
                    segmentId: (activeTool === 'segaxis') ? segId : null
                };
                return { updated: true, action: 'create_segment', createdId: segId, chained: true };
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
                    var wid = pModel ? pModel.nextId(project, 'water_') : ('water_' + (++project.idSeq || 1));
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
            var txtId = pModel ? pModel.nextId(project, 'text_') : ('text_' + (++project.idSeq || 1));
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
        findNearestLineProjection: findNearestLineProjection,
        insertStationOnLine: insertStationOnLine,
        constrainTo45: constrainTo45,
        getDraft: getDraft,
        hasDraft: hasDraft,
        updateDraftPointer: updateDraftPointer,
        getDraftPreviewPoints: getDraftPreviewPoints,
        handleCanvasClick: handleCanvasClick,
        cancelDraft: cancelDraft,
        getActiveTool: function () { return activeTool; },
        getDraftSegment: function () { return draftSegment; }
    };
});
