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
    function syncSegmentsToLines(currentProject) {
        if (!currentProject || !currentProject.lines) return;
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

            lineSegs.forEach(function (s) {
                var cleanPts = (s.points || []).map(function (p) {
                    var pt = {
                        x: Math.round(Number(p.x) * 10) / 10,
                        y: Math.round(Number(p.y) * 10) / 10
                    };
                    if (p.nid) pt.nid = p.nid;
                    if (p.r !== undefined && p.r !== 18) pt.r = p.r;
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
                var item = { x: curr.x, y: curr.y, cn: curr.cn, en: curr.en };
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
            var markerChanged = (curr.marker !== orig.marker);
            var haloChanged = (curr.halo !== orig.halo);

            var changed = (curr.x !== orig.x || curr.y !== orig.y ||
                curr.cn !== orig.cn || curr.en !== orig.en ||
                curr.align !== orig.align || curr.type !== orig.type ||
                offsetChanged || hideLabelChanged || textScaleChanged ||
                markerChanged || haloChanged);

            if (changed) {
                // 从必须字段开始
                var patch = { x: curr.x, y: curr.y, cn: curr.cn, en: curr.en };

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
        var ops = { update: dirty };
        if (deleted.length) ops.remove = deleted;
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
        syncSegmentsToLines(currentProject);

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
            if (curr.color !== orig.color || curr.name !== orig.name ||
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
                if (curr.color !== orig.color) patch.color = curr.color;
                if (curr.name !== orig.name) patch.name = curr.name;
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
        var patched = io.patchEntries(origSrc, 'linesData', { update: dirty });
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

    function getLinkedDirectoryHandle() {
        return linkedDirectoryHandle;
    }

    function setLinkedDirectoryHandle(handle) {
        linkedDirectoryHandle = handle;
    }

    /**
     * 智能定位目标城市的根目录（无论用户选择的是 CGo-OpenMap/ 根目录还是 city/ 或 city/<id>/）
     */
    async function resolveCityDir(handle, cityId) {
        if (!handle) return null;
        if (handle.name === cityId) return handle;

        // 尝试检测是否存在子目录 city/
        try {
            var citySubdir = await handle.getDirectoryHandle('city');
            if (citySubdir && cityId) {
                try {
                    return await citySubdir.getDirectoryHandle(cityId);
                } catch (e) { }
            }
        } catch (e) { }

        // 尝试检测根目录下是否存在以 cityId 命名的子目录
        if (cityId) {
            try {
                return await handle.getDirectoryHandle(cityId);
            } catch (e) { }
        }

        return handle;
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
        getCurrentLoadedCity: function () { return currentLoadedCity; },
        getRawSources: function () { return rawSources; },
        getOriginalSnapshot: function () { return originalSnapshot; }
    };
});
