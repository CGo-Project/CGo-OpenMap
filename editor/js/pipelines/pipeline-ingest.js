/**
 * 开放地图编辑器 (OpenMap Editor) - 智能转换工作流流水线
 * 串联 PDF/AI 矢量直通提取、DeepSeek 视觉识图、拓扑净化与维基百科知识库对齐
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.PipelineIngest = (function () {
    'use strict';

    function toSanitizerStations(stations) {
        if (Array.isArray(stations)) return stations;
        if (!stations || typeof stations !== 'object') return [];
        return Object.keys(stations).map(function (id) {
            var st = stations[id] || {};
            return Object.assign({}, st, { id: id, name: st.cn || st.name || id });
        });
    }

    function populateIngestedProject(project, cleanResult) {
        var nameToId = {};
        var rawStations = (cleanResult && cleanResult.stations) || [];
        var entries = Array.isArray(rawStations)
            ? rawStations.map(function (st) {
                var id = (st && st.id) || window.OpenMapEditor.ProjectModel.nextId(project, 'station_');
                return { id: id, st: st || {} };
            })
            : Object.keys(rawStations).map(function (id) {
                return { id: id, st: rawStations[id] || {} };
            });

        entries.forEach(function (entry) {
            var id = entry.id;
            var st = entry.st;
            var cn = st.cn || st.name || '';
            project.nodes[id] = {
                id: id,
                x: st.x,
                y: st.y,
                cn: cn,
                en: st.en || '',
                type: st.type || 'dot',
                align: st.align || 'top',
                offset: st.offset || { x: 0, y: 0 }
            };
            if (cn && !nameToId[cn]) nameToId[cn] = id;
        });

        ((cleanResult && cleanResult.lines) || []).forEach(function (line, lineIdx) {
            var lid = line.id || ('L' + (lineIdx + 1));
            var stationIds = Array.isArray(line.stationIds) ? line.stationIds.slice() : [];
            if (!stationIds.length && Array.isArray(line.stations)) {
                stationIds = line.stations.map(function (nameOrId) {
                    return project.nodes[nameOrId] ? nameOrId : (nameToId[nameOrId] || null);
                }).filter(Boolean);
            }
            project.lines.push({
                id: lid,
                name: line.name || ('线路 ' + (lineIdx + 1)),
                color: line.color || '#00263b',
                stationIds: stationIds
            });

            var segs = [];
            // 走向分段统一走交路模型（pathPoints / -main / -branchN / {points,ways}），
            // 不再维护 main / branch1 / branch2 的固定键表，way3…way99 与自定义区段自然生效。
            var geom = (typeof window !== 'undefined' && window.CGoPathGeometry)
                ? window.CGoPathGeometry
                : (typeof CGoPathGeometry !== 'undefined' ? CGoPathGeometry : null);
            if (geom && typeof geom.lineSegments === 'function') {
                (geom.lineSegments(line, project.nodes) || []).forEach(function (s) {
                    segs.push({ points: s.points, branchKey: s.key || 'pathPoints' });
                });
            } else {
                Object.keys(line).forEach(function (k) {
                    if (!/^pathPoints(-|$)/.test(k)) return;
                    var v = line[k];
                    var pts = Array.isArray(v) ? v : ((v && Array.isArray(v.points)) ? v.points : null);
                    if (pts && pts.length >= 2) segs.push({ points: pts, branchKey: k });
                });
            }

            segs.forEach(function (s) {
                // 统一 ID 生成器：不直接自增 idSeq（异常工程会拼出 seg_NaN）
                var segId = window.OpenMapEditor.ProjectModel.nextId(project, 'seg_');
                project.segments.push({
                    id: segId,
                    lineId: lid,
                    branchKey: s.branchKey,
                    type: 'segaxis',
                    points: s.points.map(function (p) {
                        var pt = { x: p.x, y: p.y };
                        if (p.r !== undefined) pt.r = p.r;
                        if (p.nid) pt.nid = p.nid;
                        return pt;
                    }),
                    routed: false
                });
            });
        });
    }

    /**
     * 运行 PDF / AI 矢量直通解析流水线
     * @param {File} file PDF 或 AI 文件
     * @param {Function} onProgress 进度回调 (msg, pct)
     * @returns {Promise<Object>} 转换后的 Project 数据对象
     */
    async function runPdfIngest(file, onProgress) {
        var extractor = window.OpenMapEditor.PdfVectorExtractor || window.PdfVectorExtractor;
        if (!extractor) throw new Error('PdfVectorExtractor 未加载');

        if (onProgress) onProgress('正在解析 PDF/AI 矢量对象...', 20);
        var result = await extractor.extractPdfData(file);

        if (onProgress) onProgress('正在进行拓扑净化与噪点过滤...', 60);
        var sanitizer = window.OpenMapEditor.DataSanitizer || window.DrunkSanitizer;
        var cleanResult = sanitizer ? sanitizer.sanitize({
            stations: toSanitizerStations(result.stations),
            lines: result.lines || [],
            width: result.width,
            height: result.height
        }) : { stations: result.stations, lines: result.lines };

        if (onProgress) onProgress('正在生成 OpenMap 标准工程模型...', 90);
        var project = window.OpenMapEditor.ProjectModel.createProject(result.width, result.height);
        populateIngestedProject(project, cleanResult);
        return project;
    }

    /**
     * 运行 DeepSeek 视觉模型识图流水线
     * @param {File|string} imageFileOrBase64
     * @param {Function} onProgress
     */
    async function runVisionIngest(imageFileOrBase64, onProgress) {
        var vision = window.OpenMapEditor.DeepSeekVision || window.DeepSeekVision;
        if (!vision) throw new Error('DeepSeekVision 模块未就绪');

        if (onProgress) onProgress('正在调用 DeepSeek-Vision 视觉模型...', 30);
        var res = await vision.recognizeTransitMap(imageFileOrBase64);

        if (onProgress) onProgress('模型解析完成，正在净化拓扑...', 70);
        var sanitizer = window.OpenMapEditor.DataSanitizer || window.DrunkSanitizer;
        var cleanResult = sanitizer ? sanitizer.sanitize({
            stations: toSanitizerStations(res.stations),
            lines: res.lines || [],
            width: res.width || 2000,
            height: res.height || 1500
        }) : res;

        var project = window.OpenMapEditor.ProjectModel.createProject(res.width || 2000, res.height || 1500);
        populateIngestedProject(project, cleanResult);
        return project;
    }

    return {
        runPdfIngest: runPdfIngest,
        runVisionIngest: runVisionIngest
    };
})();

// 保留全局别名兼容
window.PipelineIngest = window.OpenMapEditor.PipelineIngest;
