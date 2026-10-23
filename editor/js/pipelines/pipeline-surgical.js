/**
 * 开放地图编辑器 (OpenMap Editor) - 存量城市维护工作流流水线
 * 负责拉取 city/{city_id}/ 原文、条目级外科手术式回写 (Surgical Patch) 与 8 方向文字避让
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.PipelineSurgical = (function () {
    'use strict';

    var currentLoadedCity = null;
    var rawSources = {};
    var originalSnapshot = null;

    function getCityProjectIO() {
        return window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
    }

    /**
     * 载入在线存量城市数据
     * @param {string} cityId 城市 ID (例如 'fuzhou', 'sydney')
     * @returns {Promise<Object>} 转换后的 Project 模型对象
     */
    async function loadCity(cityId) {
        var io = getCityProjectIO();
        if (!io) throw new Error('CityProjectIO 模块未就绪');

        var result = await io.loadCity(cityId);
        currentLoadedCity = {
            id: result.id || cityId,
            name: result.name || (result.meta && result.meta.name) || result.id || cityId,
            meta: result.meta || null,
            base: result.base || ''
        };
        rawSources = result.sources || {};

        var stations = result.data.stationsData || {};
        var lines = result.data.linesData || [];

        // 估算画布尺寸
        var maxX = 1000, maxY = 800;
        Object.keys(stations).forEach(function (sid) {
            var s = stations[sid];
            if (s.x > maxX) maxX = s.x;
            if (s.y > maxY) maxY = s.y;
        });

        var canvasWidth = Math.max(2000, Math.ceil((maxX + 200) / 100) * 100);
        var canvasHeight = Math.max(1500, Math.ceil((maxY + 200) / 100) * 100);

        var project = window.OpenMapEditor.ProjectModel.createProject(canvasWidth, canvasHeight);

        // 1. 载入车站 (完整保留 hideLabel, textScale, offset 及扩展字段)
        Object.keys(stations).forEach(function (sid) {
            var st = stations[sid];
            var nodeObj = Object.assign({}, st, {
                id: sid,
                x: st.x,
                y: st.y,
                cn: st.cn || '',
                en: st.en || '',
                type: st.type || 'dot',
                align: st.align || 'top',
                offset: st.offset ? { x: st.offset.x || 0, y: st.offset.y || 0 } : { x: 0, y: 0 },
                hideLabel: !!st.hideLabel,
                textScale: st.textScale ? { cn: st.textScale.cn || 1, en: st.textScale.en || 1 } : null,
                notOpen: (st.type === 'no')
            });
            project.nodes[sid] = nodeObj;
        });

        // 2. 载入虚拟换乘与连接虚线
        var vtBundle = result.data.VIRTUAL_TRANSFERS_BUNDLE || {};
        var paidConns = vtBundle.paidConns || [];
        var freeConns = vtBundle.freeConns || [];
        project.virtualConnectors = [];
        paidConns.forEach(function (c) {
            project.virtualConnectors.push({
                from: c.from, to: c.to,
                offsetFrom: c.offsetFrom || { x: 0, y: 0 },
                offsetTo: c.offsetTo || { x: 0, y: 0 },
                free: false
            });
        });
        freeConns.forEach(function (c) {
            project.virtualConnectors.push({
                from: c.from, to: c.to,
                offsetFrom: c.offsetFrom || { x: 0, y: 0 },
                offsetTo: c.offsetTo || { x: 0, y: 0 },
                free: true
            });
        });
        project.virtualTransfers = vtBundle;

        // 3. 载入在建/规划未开通线路 (包含白线描边等样式)
        project.notOpenLines = result.data.NOT_OPEN_LINES || [];

        // 4. 载入地理地标与城门散点装饰
        project.scattered = result.data.SCATTERED_DATA || [];

        // 5. 载入图例配置
        project.legend = result.data.LEGEND_CONFIG || [];

        // 6. 载入线路与走线
        lines.forEach(function (line, lIdx) {
            var lid = line.id || ('L' + (lIdx + 1));
            var lineObj = Object.assign({}, line, {
                id: lid,
                name: line.name || lid,
                color: line.color || '#00263b',
                useStrictRounding: !!line.useStrictRounding
            });
            project.lines.push(lineObj);

            // 提取走向折线段（无损兼容分支线路 pathPoints-main / -branch1 / -branch2 及普通折线）
            var geom = (typeof window !== 'undefined' && window.CGoPathGeometry)
                ? window.CGoPathGeometry
                : (typeof CGoPathGeometry !== 'undefined' ? CGoPathGeometry : null);

            var segmentsToCreate = [];

            if (geom && typeof geom.lineSegments === 'function') {
                var rawSegs = geom.lineSegments(line, project.nodes);
                (rawSegs || []).forEach(function (s, sIdx) {
                    segmentsToCreate.push({
                        points: s.points,
                        branchKey: s.key || (line.hasbranch ? ('branch_' + (sIdx + 1)) : 'main')
                    });
                });
            } else {
                if (line.hasbranch) {
                    ['pathPoints-main', 'pathPoints-branch1', 'pathPoints-branch2'].forEach(function (k) {
                        if (Array.isArray(line[k]) && line[k].length >= 2) {
                            segmentsToCreate.push({ points: line[k], branchKey: k });
                        }
                    });
                    Object.keys(line).forEach(function (k) {
                        if (/^pathPoints-/.test(k) && k !== 'pathPoints-main' && k !== 'pathPoints-branch1' && k !== 'pathPoints-branch2') {
                            if (Array.isArray(line[k]) && line[k].length >= 2) {
                                segmentsToCreate.push({ points: line[k], branchKey: k });
                            }
                        }
                    });
                } else if (!line.isPointOnly) {
                    var pts = line.pathPoints;
                    if (!pts && Array.isArray(line.stationIds) && line.stationIds.length >= 2) {
                        pts = line.stationIds.map(function (sid) {
                            var n = project.nodes[sid];
                            return n ? { x: n.x, y: n.y, nid: sid } : null;
                        }).filter(Boolean);
                    }
                    if (pts && pts.length >= 2) {
                        segmentsToCreate.push({ points: pts, branchKey: 'main' });
                    }
                }
            }

            segmentsToCreate.forEach(function (segItem) {
                var segId = 'seg_' + (++project.idSeq);
                project.segments.push({
                    id: segId,
                    lineId: lid,
                    branchKey: segItem.branchKey,
                    type: 'segaxis',
                    points: (segItem.points || []).map(function (p) {
                        var pt = { x: p.x, y: p.y };
                        if (p.nid) pt.nid = p.nid;
                        if (p.r !== undefined) pt.r = p.r;
                        return pt;
                    }),
                    routed: true
                });
            });
        });

        // 缓存原始快照以便比较计算改动
        originalSnapshot = JSON.parse(JSON.stringify(project));

        return {
            city: currentLoadedCity,
            project: project
        };
    }

    /**
     * 计算车站改动条目字典 (用于外科手术回写)
     */
    function computeDirtyStations(currentProject) {
        if (!originalSnapshot || !currentProject) return {};
        var dirty = {};
        var origNodes = originalSnapshot.nodes || {};
        var currNodes = currentProject.nodes || {};

        Object.keys(currNodes).forEach(function (nid) {
            var curr = currNodes[nid];
            var orig = origNodes[nid];
            if (!orig) {
                // 新增车站
                var item = {
                    x: curr.x, y: curr.y,
                    cn: curr.cn, en: curr.en,
                    align: curr.align, offset: curr.offset || { x: 0, y: 0 },
                    type: curr.type
                };
                if (curr.hideLabel) item.hideLabel = true;
                if (curr.textScale) item.textScale = curr.textScale;
                dirty[nid] = item;
                return;
            }

            // 对比字段 (全面覆盖坐标、名称、对齐、偏移、hideLabel与textScale)
            var offsetChanged = (((curr.offset && curr.offset.x) || 0) !== ((orig.offset && orig.offset.x) || 0) ||
                ((curr.offset && curr.offset.y) || 0) !== ((orig.offset && orig.offset.y) || 0));
            var hideLabelChanged = (!!curr.hideLabel !== !!orig.hideLabel);
            var textScaleChanged = (JSON.stringify(curr.textScale || null) !== JSON.stringify(orig.textScale || null));

            var changed = (curr.x !== orig.x || curr.y !== orig.y ||
                curr.cn !== orig.cn || curr.en !== orig.en ||
                curr.align !== orig.align || curr.type !== orig.type ||
                offsetChanged || hideLabelChanged || textScaleChanged);

            if (changed) {
                var patch = {
                    x: curr.x, y: curr.y,
                    cn: curr.cn, en: curr.en,
                    align: curr.align,
                    offset: curr.offset || { x: 0, y: 0 },
                    type: curr.type
                };
                if (curr.hideLabel) patch.hideLabel = true;
                if (curr.textScale) patch.textScale = curr.textScale;
                dirty[nid] = patch;
            }
        });

        return dirty;
    }

    /**
     * 执行外科手术式回写并触发文件下载
     */
    function patchStationsSource(currentProject) {
        var io = getCityProjectIO();
        if (!io) throw new Error('CityProjectIO 模块未就绪');
        var dirty = computeDirtyStations(currentProject);
        var dirtyCount = Object.keys(dirty).length;

        if (dirtyCount === 0) {
            return { dirtyCount: 0, patchedSource: rawSources['data_stations.js'] };
        }

        var origSrc = rawSources['data_stations.js'] || '';
        var patched = io.patchEntries(origSrc, 'stationsData', dirty);
        return {
            dirtyCount: dirtyCount,
            patchedSource: patched
        };
    }

    return {
        loadCity: loadCity,
        computeDirtyStations: computeDirtyStations,
        patchStationsSource: patchStationsSource,
        getCurrentLoadedCity: function () { return currentLoadedCity; }
    };
})();

// 保留全局别名兼容
window.PipelineSurgical = window.OpenMapEditor.PipelineSurgical;
