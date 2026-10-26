/**
 * 开放地图编辑器 (OpenMap Editor) - 存量城市维护工作流流水线
 * 负责拉取 city/{city_id}/ 原文、条目级外科手术式回写 (Surgical Patch) 与 File System Access API 原地直存
 */

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.OpenMapEditor = root.OpenMapEditor || {};
        root.OpenMapEditor.PipelineSurgical = factory();
        root.PipelineSurgical = root.OpenMapEditor.PipelineSurgical;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var currentLoadedCity = null;
    var rawSources = {};
    var originalSnapshot = null;
    var linkedDirectoryHandle = null;

    function getCityProjectIO() {
        if (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.CityProjectIO) {
            return window.OpenMapEditor.CityProjectIO;
        }
        if (typeof window !== 'undefined' && window.CityProjectIO) {
            return window.CityProjectIO;
        }
        if (typeof global !== 'undefined' && global.window && global.window.CityProjectIO) {
            return global.window.CityProjectIO;
        }
        try {
            return require('../core/city-project-io');
        } catch (e) {
            return null;
        }
    }

    function getProjectModel() {
        if (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.ProjectModel) {
            return window.OpenMapEditor.ProjectModel;
        }
        if (typeof window !== 'undefined' && window.ProjectModel) {
            return window.ProjectModel;
        }
        if (typeof global !== 'undefined' && global.window && global.window.OpenMapEditor && global.window.OpenMapEditor.ProjectModel) {
            return global.window.OpenMapEditor.ProjectModel;
        }
        try {
            return require('../core/project-model');
        } catch (e) {
            return null;
        }
    }

    /**
     * 将从数据文件加载的原始数据组装为 Project 模型
     */
    function buildProjectFromCityData(cityMeta, sources, data) {
        var stations = (data && data.stationsData) || {};
        var lines = (data && data.linesData) || [];

        // 估算画布尺寸
        var maxX = 1000, maxY = 800;
        Object.keys(stations).forEach(function (sid) {
            var s = stations[sid];
            if (s.x > maxX) maxX = s.x;
            if (s.y > maxY) maxY = s.y;
        });

        var canvasWidth = Math.max(2000, Math.ceil((maxX + 200) / 100) * 100);
        var canvasHeight = Math.max(1500, Math.ceil((maxY + 200) / 100) * 100);

        var pm = getProjectModel();
        var project = (pm && typeof pm.createProject === 'function')
            ? pm.createProject(canvasWidth, canvasHeight)
            : { version: 1, canvas: { width: canvasWidth, height: canvasHeight }, nodes: {}, segments: [], lines: [], idSeq: 0 };

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
        var vtBundle = (data && data.VIRTUAL_TRANSFERS_BUNDLE) || {};
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
        project.notOpenLines = (data && data.NOT_OPEN_LINES) || [];

        // 4. 载入地理地标与城门散点装饰
        project.scattered = (data && data.SCATTERED_DATA) || [];

        // 5. 载入图例配置
        project.legend = (data && data.LEGEND_CONFIG) || [];

        // 6. 载入线路与走线
        lines.forEach(function (line, lIdx) {
            var lid = line.id || ('L' + (lIdx + 1));
            var lineObj = Object.assign({}, line);
            if (!lineObj.id) lineObj.id = lid;
            if (!lineObj.name) lineObj.name = lid;
            if (!lineObj.color) lineObj.color = '#00263b';
            if (line.useStrictRounding) lineObj.useStrictRounding = true;
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
                        segmentsToCreate.push({ points: pts, branchKey: 'pathPoints' });
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

        return project;
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

        var project = buildProjectFromCityData(currentLoadedCity, rawSources, result.data);

        return {
            city: currentLoadedCity,
            project: project
        };
    }

    /**
     * 同步/测试初始注入器（支持离线及自检单元测试）
     */
    function init(cityId, sources, data) {
        currentLoadedCity = {
            id: cityId,
            name: cityId,
            meta: null,
            base: ''
        };
        rawSources = sources || {};
        var project = buildProjectFromCityData(currentLoadedCity, rawSources, data);
        return {
            city: currentLoadedCity,
            project: project
        };
    }

    /**
     * 将 project.segments 的折点最新改动写回对应的 project.lines 属性中
     */
    /**
     * 把编辑用的 segments 回代成线路的 pathPoints（走向点阵）。
     *
     * opts.onlyExistingPath = true 时，**只回代源码里本来就有 pathPoints 的线路**：
     * 站序驱动（只有 stationIds）的线路没有点阵，凭空生成 pathPoints 会把它写进源文件，
     * 并让走向改由点阵决定 —— 那等于悄悄改掉城市数据。
     */
    function syncSegmentsToLines(currentProject, opts) {
        if (!currentProject || !currentProject.lines) return;
        var onlyExistingPath = !!(opts && opts.onlyExistingPath);
        var segs = currentProject.segments || [];
        var segsByLine = {};
        segs.forEach(function (s) {
            if (!s.lineId) return;
            segsByLine[s.lineId] = segsByLine[s.lineId] || [];
            segsByLine[s.lineId].push(s);
        });

        currentProject.lines.forEach(function (line) {
            var lineSegs = segsByLine[line.id];
            if (!lineSegs || !lineSegs.length) return;

            if (onlyExistingPath) {
                var snapLine = null;
                var snapLines = (originalSnapshot && originalSnapshot.lines) || [];
                for (var si = 0; si < snapLines.length; si++) {
                    if (snapLines[si].id === line.id) { snapLine = snapLines[si]; break; }
                }
                if (!snapLine) return;
                var hadPath = Object.keys(snapLine).some(function (k) {
                    return k === 'pathPoints' || /^pathPoints-/.test(k);
                });
                if (!hadPath) return;   // 站序驱动的线路：不生成点阵
            }

            lineSegs.forEach(function (s) {
                var cleanPts = (s.points || []).map(function (p) {
                    var pt = {
                        x: Math.round(Number(p.x) * 100) / 100,
                        y: Math.round(Number(p.y) * 100) / 100
                    };
                    if (p.nid) pt.nid = p.nid;
                    if (p.r !== undefined) pt.r = p.r;
                    return pt;
                });

                var bKey = s.branchKey || 'main';
                if (bKey === 'pathPoints' || bKey.startsWith('pathPoints-')) {
                    line[bKey] = cleanPts;
                } else if (bKey === 'main') {
                    if (line.hasbranch) {
                        line['pathPoints-main'] = cleanPts;
                    } else {
                        line.pathPoints = cleanPts;
                    }
                } else if (bKey.startsWith('branch_') || bKey.startsWith('branch')) {
                    var suffix = bKey.replace('branch_', '').replace('branch', '');
                    line['pathPoints-branch' + suffix] = cleanPts;
                } else {
                    line['pathPoints-' + bKey] = cleanPts;
                }
            });
        });
    }

    /** 写回坐标统一压到 2 位小数：既是城市数据的书写精度，也避免浮点噪声被写进源文件 */
    function r2(v) {
        return Math.round(Number(v) * 100) / 100;
    }

    /**
     * 计算车站改动条目字典 (用于外科手术回写)
     *
     * Fix: patch 对象只包含「与默认值不同」或「实际发生变化」的可选字段（align/offset/type），
     * 避免回写时将 align:"top" / offset:{x:0,y:0} / type:"dot" 注入到原本没有这些字段的条目中，
     * 防止 patchEntries diffContainerEdits 因 key 数量变化而回退为整条重写（源文件字段污染）。
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
                // 新增车站：只写入非默认的可选字段，保持与源码风格一致
                var item = { x: r2(curr.x), y: r2(curr.y), cn: curr.cn, en: curr.en };
                // align：仅在非默认 'top' 时写入
                if (curr.align && curr.align !== 'top') item.align = curr.align;
                // offset：仅在非零时写入
                if (curr.offset && (curr.offset.x !== 0 || curr.offset.y !== 0)) {
                    item.offset = { x: curr.offset.x, y: curr.offset.y };
                }
                // type：仅在非默认 'dot' 时写入
                if (curr.type && curr.type !== 'dot') item.type = curr.type;
                if (curr.hideLabel) item.hideLabel = true;
                if (curr.textScale) item.textScale = curr.textScale;
                if (curr.marker) item.marker = curr.marker;
                if (curr.halo) item.halo = curr.halo;
                dirty[nid] = item;
                return;
            }

            // 对比字段 (全面覆盖坐标、名称、对齐、偏移、hideLabel与textScale、marker、halo)
            var currOffX = (curr.offset && curr.offset.x) || 0;
            var currOffY = (curr.offset && curr.offset.y) || 0;
            var origOffX = (orig.offset && orig.offset.x) || 0;
            var origOffY = (orig.offset && orig.offset.y) || 0;
            var offsetChanged = (currOffX !== origOffX || currOffY !== origOffY);
            var hideLabelChanged = (!!curr.hideLabel !== !!orig.hideLabel);
            var textScaleChanged = (JSON.stringify(curr.textScale || null) !== JSON.stringify(orig.textScale || null));
            // marker / halo 是对象：必须按值比较。用引用比较时，快照是深拷贝，
            // curr.marker !== orig.marker 永远成立 → 只要车站带 marker（如悉尼）就全城判脏，
            // 零编辑也会整份重写源文件，把人工排版全冲掉。
            var markerChanged = (JSON.stringify(curr.marker || null) !== JSON.stringify(orig.marker || null));
            var haloChanged = (JSON.stringify(curr.halo || null) !== JSON.stringify(orig.halo || null));

            var changed = (curr.x !== orig.x || curr.y !== orig.y ||
                curr.cn !== orig.cn || curr.en !== orig.en ||
                curr.align !== orig.align || curr.type !== orig.type ||
                offsetChanged || hideLabelChanged || textScaleChanged ||
                markerChanged || haloChanged);

            if (changed) {
                // 稀疏 patch：只带真正需要的字段，其余交给 patchEntries 以「源码原条目」为底合并。
                // 绝不能在这里以编辑器节点对象为底做全量 patch —— 那是编辑器内部模型，
                // 带着 id / align 默认值 / textScale:null 等不属于城市数据的字段，会污染源文件。
                var patch = { x: r2(curr.x), y: r2(curr.y), cn: curr.cn, en: curr.en };

                // align：若原始有非默认值，或当前是非默认值，或用户实际改动了，则写入
                var origAlignNonDefault = orig.align && orig.align !== 'top';
                var currAlignNonDefault = curr.align && curr.align !== 'top';
                if (origAlignNonDefault || currAlignNonDefault || curr.align !== orig.align) {
                    patch.align = curr.align || 'top';
                }

                // offset：若原始有非零值，或当前是非零值，或用户实际改动了，则写入
                var origOffNonZero = origOffX !== 0 || origOffY !== 0;
                var currOffNonZero = currOffX !== 0 || currOffY !== 0;
                if (origOffNonZero || currOffNonZero || offsetChanged) {
                    patch.offset = { x: currOffX, y: currOffY };
                }

                // type：若原始有非默认值，或当前是非默认值，或用户实际改动了，则写入
                var origTypeNonDefault = orig.type && orig.type !== 'dot';
                var currTypeNonDefault = curr.type && curr.type !== 'dot';
                if (origTypeNonDefault || currTypeNonDefault || curr.type !== orig.type) {
                    patch.type = curr.type || 'dot';
                }

                if (curr.hideLabel) patch.hideLabel = true;
                else patch.hideLabel = null;      // null = 从源码条目里删掉该字段（取消勾选）
                if (curr.textScale) patch.textScale = curr.textScale;
                if (curr.marker) patch.marker = curr.marker;
                if (curr.halo) patch.halo = curr.halo;
                dirty[nid] = patch;
            }
        });

        return dirty;
    }

    /**
     * 计算被删除的车站 ID 列表（仅当车站从编辑器中主动移除时才追踪）
     */
    function computeDeletedStationIds(currentProject) {
        if (!originalSnapshot || !currentProject) return [];
        var origNodes = originalSnapshot.nodes || {};
        var currNodes = currentProject.nodes || {};
        return Object.keys(origNodes).filter(function (nid) { return !currNodes[nid]; });
    }

    /**
     * 执行车站外科手术式回写（含删除追踪）
     */
    function patchStationsSource(currentProject) {
        var io = getCityProjectIO();
        if (!io) throw new Error('CityProjectIO 模块未就绪');
        var dirty = computeDirtyStations(currentProject);
        var deleted = computeDeletedStationIds(currentProject);
        var dirtyCount = Object.keys(dirty).length + deleted.length;

        if (dirtyCount === 0) {
            return { dirtyCount: 0, patchedSource: rawSources['data_stations.js'] || '' };
        }

        var origSrc = rawSources['data_stations.js'] || '';
        // 新增的车站在源码里还没有这个键：patchEntries 的 update 找不到键会直接跳过，
        // 必须改走 append 追加，否则「在线插站」新建的车站会被静默丢弃（站序里留下悬空 ID）。
        var newKeys = Object.keys(dirty).filter(function (nid) {
            return !originalSnapshot.nodes || !originalSnapshot.nodes[nid];
        });
        var updateOnly = {};
        Object.keys(dirty).forEach(function (nid) {
            if (newKeys.indexOf(nid) === -1) updateOnly[nid] = dirty[nid];
        });
        var ops = { update: updateOnly };
        if (deleted.length) ops.remove = deleted;
        if (newKeys.length) {
            ops.append = newKeys.map(function (nid) { return { key: nid, value: dirty[nid] }; });
        }
        var patched = io.patchEntries(origSrc, 'stationsData', ops);
        return {
            dirtyCount: dirtyCount,
            patchedSource: patched
        };
    }

    /**
     * 计算线路改动条目字典 (用于外科手术回写)
     */
    function computeDirtyLines(currentProject) {
        if (!originalSnapshot || !currentProject) return {};
        syncSegmentsToLines(currentProject, { onlyExistingPath: true });

        var dirty = {};
        var origLines = originalSnapshot.lines || [];
        var currLines = currentProject.lines || [];

        var origMap = {};
        origLines.forEach(function (l) { if (l.id) origMap[l.id] = l; });

        currLines.forEach(function (curr) {
            var lid = curr.id;
            var orig = origMap[lid];
            if (!orig) {
                // 新增线路
                dirty[lid] = Object.assign({}, curr);
                return;
            }

            // 比较属性：color, name, useStrictRounding, isLoop
            var changed = false;
            if (String(curr.color || '').toLowerCase() !== String(orig.color || '').toLowerCase() ||
                curr.name !== orig.name ||
                String(curr.company || '') !== String(orig.company || '') ||
                !!curr.useStrictRounding !== !!orig.useStrictRounding ||
                !!curr.isLoop !== !!orig.isLoop) {
                changed = true;
            }

            // 比较 stationIds 及分支 stationIds
            if (!changed) {
                var currStationKeys = Object.keys(curr).filter(function (k) { return k === 'stationIds' || /^stationIds-/.test(k); });
                var origStationKeys = Object.keys(orig).filter(function (k) { return k === 'stationIds' || /^stationIds-/.test(k); });
                if (currStationKeys.length !== origStationKeys.length) {
                    changed = true;
                } else {
                    for (var i = 0; i < currStationKeys.length; i++) {
                        var sk = currStationKeys[i];
                        if (JSON.stringify(curr[sk] || []) !== JSON.stringify(orig[sk] || [])) {
                            changed = true;
                            break;
                        }
                    }
                }
            }

            // 比较 distances 及分支 distances
            if (!changed) {
                var currDistKeys = Object.keys(curr).filter(function (k) { return k === 'distances' || /^distances-/.test(k); });
                for (var j = 0; j < currDistKeys.length; j++) {
                    var dk = currDistKeys[j];
                    if (JSON.stringify(curr[dk] || []) !== JSON.stringify(orig[dk] || [])) {
                        changed = true;
                        break;
                    }
                }
            }

            // 比较 pathPoints 及分支 pathPoints
            if (!changed) {
                var currPathKeys = Object.keys(curr).filter(function (k) { return k === 'pathPoints' || /^pathPoints-/.test(k); });
                var origPathKeys = Object.keys(orig).filter(function (k) { return k === 'pathPoints' || /^pathPoints-/.test(k); });
                if (currPathKeys.length !== origPathKeys.length) {
                    changed = true;
                } else {
                    for (var p = 0; p < currPathKeys.length; p++) {
                        var pk = currPathKeys[p];
                        if (JSON.stringify(curr[pk] || []) !== JSON.stringify(orig[pk] || [])) {
                            changed = true;
                            break;
                        }
                    }
                }
            }

            if (changed) {
                var patch = Object.assign({}, orig);
                // 色号按大小写无关比较：#e4002b 与 #E4002B 视为同一个色，避免无意义的整行 diff
                if (String(curr.color || '').toLowerCase() !== String(orig.color || '').toLowerCase()) patch.color = curr.color;
                if (curr.name !== orig.name) patch.name = curr.name;
                if (String(curr.company || '') !== String(orig.company || '')) patch.company = curr.company;
                if (curr.useStrictRounding !== orig.useStrictRounding) {
                    if (curr.useStrictRounding) patch.useStrictRounding = true;
                    else delete patch.useStrictRounding;
                }
                if (curr.isLoop !== orig.isLoop) {
                    if (curr.isLoop) patch.isLoop = true;
                    else delete patch.isLoop;
                }
                Object.keys(curr).forEach(function (k) {
                    if (k === 'stationIds' || /^stationIds-/.test(k)) patch[k] = curr[k];
                });
                Object.keys(curr).forEach(function (k) {
                    if (k === 'distances' || /^distances-/.test(k)) patch[k] = curr[k];
                });
                Object.keys(curr).forEach(function (k) {
                    if (k === 'pathPoints' || /^pathPoints-/.test(k)) patch[k] = curr[k];
                });
                dirty[lid] = patch;
            }
        });

        return dirty;
    }

    /**
     * 执行线路外科手术式回写
     */
    function patchLinesSource(currentProject) {
        var io = getCityProjectIO();
        if (!io) throw new Error('CityProjectIO 模块未就绪');
        var dirty = computeDirtyLines(currentProject);
        var dirtyCount = Object.keys(dirty).length;

        if (dirtyCount === 0) {
            return { dirtyCount: 0, patchedSource: rawSources['data_lines.js'] || '' };
        }

        var origSrc = rawSources['data_lines.js'] || '';

        // 新增线路在源码里还没有这个下标/键：patchEntries 的 update 找不到会直接跳过，
        // 必须改走 append 追加，否则「新增线路」在写回时会被静默丢弃。
        var origLineIds = {};
        ((originalSnapshot && originalSnapshot.lines) || []).forEach(function (l) {
            if (l && l.id) origLineIds[l.id] = true;
        });
        var newLineKeys = Object.keys(dirty).filter(function (lid) { return !origLineIds[lid]; });
        var updateOnly = {};
        Object.keys(dirty).forEach(function (lid) {
            if (newLineKeys.indexOf(lid) === -1) updateOnly[lid] = dirty[lid];
        });

        var ops = { update: updateOnly };
        if (newLineKeys.length) {
            ops.append = newLineKeys.map(function (lid) {
                var clean = {};
                Object.keys(dirty[lid]).forEach(function (k) {
                    if (k.charAt(0) !== '_') clean[k] = dirty[lid][k];   // 派生字段不写回
                });
                return { value: clean };
            });
        }
        var patched = io.patchEntries(origSrc, 'linesData', ops);
        return {
            dirtyCount: dirtyCount,
            patchedSource: patched
        };
    }

    /**
     * 提取全文件改动集 (Changeset)
     */
    function computeChangeset(currentProject) {
        var stationsRes = patchStationsSource(currentProject);
        var linesRes = patchLinesSource(currentProject);

        var hasChanges = (stationsRes.dirtyCount > 0 || linesRes.dirtyCount > 0);
        var files = [
            {
                filename: 'data_stations.js',
                dirtyCount: stationsRes.dirtyCount,
                patchedSource: stationsRes.patchedSource,
                changed: stationsRes.dirtyCount > 0
            },
            {
                filename: 'data_lines.js',
                dirtyCount: linesRes.dirtyCount,
                patchedSource: linesRes.patchedSource,
                changed: linesRes.dirtyCount > 0
            }
        ];

        return {
            hasChanges: hasChanges,
            city: currentLoadedCity,
            files: files
        };
    }

    // ──────────────────────────────────────────────────────────────
    // File System Access API 本地无感保存通道
    // ──────────────────────────────────────────────────────────────

    async function linkLocalDirectory() {
        if (typeof window === 'undefined' || !window.showDirectoryPicker) {
            throw new Error('当前浏览器不支持 File System Access API (showDirectoryPicker)。请在 Chromium 系浏览器运行，或改用补丁下载。');
        }
        var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        linkedDirectoryHandle = handle;
        return handle;
    }

    /**
     * 从自动保存的会话里恢复「城市维护」上下文。
     *
     * 编辑器 F5 之后，工程本身可以从 localStorage 还原，但**原始源码必须一起还原**：
     * 没有 rawSources 就只能导出新文件，无法再做「条目级无损回写」。
     */
    function restoreSession(state) {
        if (!state || !state.cityId || !state.sources) return false;
        currentLoadedCity = {
            id: state.cityId,
            name: state.cityName || state.cityId,
            meta: state.meta || null,
            base: state.base || ''
        };
        rawSources = state.sources || {};
        originalSnapshot = state.snapshot ? JSON.parse(JSON.stringify(state.snapshot)) : null;
        return true;
    }

    /**
     * 清空「城市维护」上下文。
     * 新建画布 / 导入工程 JSON 之后必须调用：否则后续会把新工程当成旧城市的改动，
     * 一旦 F5 自动恢复或点「写回城市」，就可能把不相干的数据写进那个城市目录。
     */
    function resetContext() {
        currentLoadedCity = null;
        rawSources = {};
        originalSnapshot = null;
    }

    /** 供自动保存使用：拿到"载入时的原始快照"，恢复后脏判定才有基准 */
    function getSessionSnapshot() {
        return originalSnapshot ? JSON.parse(JSON.stringify(originalSnapshot)) : null;
    }

    function getLinkedDirectoryHandle() {
        return linkedDirectoryHandle;
    }

    function setLinkedDirectoryHandle(handle) {
        linkedDirectoryHandle = handle;
    }

    /**
     * 定位写回目标目录：支持用户在 picker 里选 仓库根目录 / city/ / city/<id>/ 三种情况。
     *
     * ⚠️ 只在**能确认**「该目录确实是当前城市目录」时才返回：目录名必须是 cityId，
     * 且里面存在 data_stations.js。绝不能「猜不到就回落到用户选中的目录」——
     * 那会把某个城市的数据文件写到别的目录（甚至别的城市）里。
     */
    async function resolveCityDir(handle, cityId) {
        if (!handle) return null;

        async function isCityDir(dir, expectName) {
            if (!dir) return false;
            if (expectName && dir.name && dir.name !== expectName) return false;
            try {
                await dir.getFileHandle('data_stations.js');
                return true;
            } catch (e) {
                return false;   // 这个目录里没有城市数据文件
            }
        }

        // 1) 直接选中了 city/<id>/
        if (cityId && await isCityDir(handle, cityId)) return handle;

        // 2) 选中了仓库根目录：<root>/city/<id>/
        if (cityId) {
            try {
                var citySubdir = await handle.getDirectoryHandle('city');
                var nested = await citySubdir.getDirectoryHandle(cityId);
                if (await isCityDir(nested, cityId)) return nested;
            } catch (e) { /* 没有 city/<id> 这一层，继续试下一种 */ }
        }

        // 3) 选中了 city/ 目录：<city>/<id>/
        if (cityId) {
            try {
                var direct = await handle.getDirectoryHandle(cityId);
                if (await isCityDir(direct, cityId)) return direct;
            } catch (e) { /* 继续 */ }
        }

        // 4) 认不出来就明确报错，绝不乱写
        var picked = handle.name || '(未命名目录)';
        var expect = cityId ? ('city/' + cityId + '/ 或 city/') : 'city/ 目录';
        throw new Error('无法确认写回目录：你选的是「' + picked + '」，但没在这里找到' +
            (cityId ? '城市「' + cityId + '」的数据' : '城市数据') +
            '。请改为选择 ' + expect + '，以免把数据写到其它目录或其它城市。');
    }

    /**
     * 直接写回本地文件系统
     */
    async function saveDirectToLocal(currentProject) {
        if (!linkedDirectoryHandle) {
            throw new Error('未关联本地城市目录，请先点击「关联本地城市目录」选取本地文件夹。');
        }
        var cs = computeChangeset(currentProject);
        if (!cs.hasChanges) {
            return { savedCount: 0, savedFiles: [], message: '当前无改动条目需要保存' };
        }

        var cityId = (currentLoadedCity && currentLoadedCity.id) || '';
        var targetDir = await resolveCityDir(linkedDirectoryHandle, cityId);

        var savedFiles = [];
        for (var i = 0; i < cs.files.length; i++) {
            var f = cs.files[i];
            if (!f.changed) continue;
            var fileHandle = await targetDir.getFileHandle(f.filename, { create: true });
            var writable = await fileHandle.createWritable();
            await writable.write(f.patchedSource);
            await writable.close();
            savedFiles.push(f.filename);
        }

        return {
            savedCount: savedFiles.length,
            savedFiles: savedFiles,
            city: currentLoadedCity,
            message: '已直接更新本地 ' + savedFiles.join(' 与 ')
        };
    }

    return {
        loadCity: loadCity,
        init: init,
        syncSegmentsToLines: syncSegmentsToLines,
        computeDirtyStations: computeDirtyStations,
        computeDeletedStationIds: computeDeletedStationIds,
        patchStationsSource: patchStationsSource,
        computeDirtyLines: computeDirtyLines,
        patchLinesSource: patchLinesSource,
        computeChangeset: computeChangeset,
        linkLocalDirectory: linkLocalDirectory,
        getLinkedDirectoryHandle: getLinkedDirectoryHandle,
        setLinkedDirectoryHandle: setLinkedDirectoryHandle,
        saveDirectToLocal: saveDirectToLocal,
        resolveCityDir: resolveCityDir,      // 暴露给自检：验证「只会写进确认过的城市目录」
        getCurrentLoadedCity: function () { return currentLoadedCity; },
        getRawSources: function () { return rawSources; },
        restoreSession: restoreSession,
        resetContext: resetContext,
        getSessionSnapshot: getSessionSnapshot,
        getOriginalSnapshot: function () { return originalSnapshot; }
    };
});
