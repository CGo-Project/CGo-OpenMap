/**
 * 开放地图编辑器 (OpenMap Editor) - Rail Map Painter (RMP) 原生格式无损导入器
 *
 * 支持直接导入 https://railmapgen.org/?app=rmp 导出的工程 JSON 文件：
 *   1. 原生兼容 RMP Graphology 存档结构 ({ version, graph: { nodes, edges } })；
 *   2. 同时兼容结构化轨交 JSON 结构 ({ stations, lines, paths/segments })；
 *   3. 自动将 RMP 负象限/任意视图坐标平移归一化至 CGo 正象限标准画布并对齐网格；
 *   4. 自动解析 RMP 135° 圆角斜线 (diagonal)、90° 正交折线 (perpendicular) 与直线，生成标准 CGo segments；
 *   5. 自动按线路主题色/编码聚类边集合生成 CGo lines，并通过 StationOrder 重建真实物理行车站序；
 *   6. 自动将各城市车站类型 (shmetro/bjsubway/gzmtr/mtr 等) 与文本偏移映射为 CGo 图元与 8 方向对齐。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.RMPImporter = (function () {
    'use strict';

    var DEFAULT_PADDING = 160;
    var DEFAULT_GRID = 5;

    function roundToGrid(val, step) {
        var g = step > 0 ? step : 1;
        return Math.round((Number(val) || 0) / g) * g;
    }

    function normalizeHex(colorInput) {
        if (!colorInput) return '#0284c7';
        if (Array.isArray(colorInput)) {
            // RMP 颜色四元组: ["shanghai", "sh1", "#E4002B", "#fff"]
            for (var i = 0; i < colorInput.length; i++) {
                if (typeof colorInput[i] === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(colorInput[i].trim())) {
                    return colorInput[i].trim().slice(0, 7);
                }
            }
            return '#0284c7';
        }
        if (typeof colorInput === 'string') {
            var s = colorInput.trim();
            if (/^#[0-9a-fA-F]{3,8}$/.test(s)) {
                if (s.length === 4) {
                    return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
                }
                return s.slice(0, 7);
            }
        }
        return '#0284c7';
    }

    /**
     * 嗅探 JSON 对象是否为 RMP 工程文件
     * @param {Object|string} input
     * @returns {boolean}
     */
    function isRmpJson(input) {
        var data = input;
        if (typeof input === 'string') {
            try {
                data = JSON.parse(input);
            } catch (e) {
                return false;
            }
        }
        if (!data || typeof data !== 'object') return false;

        // 1. 标准 RMP Graphology 结构: { graph: { nodes: [...], edges: [...] } }
        if (data.graph && Array.isArray(data.graph.nodes) && Array.isArray(data.graph.edges)) {
            return true;
        }
        // 2. 结构化 RMP 导出或转换格式: 含 rmpVersion / source === 'rmp'，或 stations 数组含 nameOffsetX / style
        if (data.source === 'rmp' || data.rmpVersion !== undefined || data.svgViewBoxZoom !== undefined) {
            return true;
        }
        if (Array.isArray(data.stations) && data.stations.some(function (s) {
            return s && (s.nameOffsetX || s.nameOffsetY || s.name_zh !== undefined || Array.isArray(s.names));
        })) {
            return true;
        }
        return false;
    }

    /**
     * 将 RMP 的 nameOffsetX + nameOffsetY 映射为 CGo 8 方向 align
     */
    function mapRmpAlign(offsetX, offsetY, fallbackAlign) {
        if (fallbackAlign && /^(top|bottom|left|right|top-left|top-right|bottom-left|bottom-right)$/.test(fallbackAlign)) {
            return fallbackAlign;
        }
        var ox = String(offsetX || 'right').toLowerCase();
        var oy = String(offsetY || 'top').toLowerCase();

        if (ox === 'middle' || ox === 'center') {
            if (oy === 'top' || oy === 'up') return 'top';
            if (oy === 'bottom' || oy === 'down') return 'bottom';
            return 'top';
        }
        if (oy === 'middle' || oy === 'center') {
            if (ox === 'left') return 'left';
            if (ox === 'right') return 'right';
            return 'right';
        }
        if (ox === 'left' && (oy === 'top' || oy === 'up')) return 'top-left';
        if (ox === 'right' && (oy === 'top' || oy === 'up')) return 'top-right';
        if (ox === 'left' && (oy === 'bottom' || oy === 'down')) return 'bottom-left';
        if (ox === 'right' && (oy === 'bottom' || oy === 'down')) return 'bottom-right';
        return 'top';
    }

    /**
     * 将 RMP 车站类型与旋转角映射为 CGo 车站图元类型
     */
    function mapRmpStationType(rmpType, typePayload, degreeCount) {
        var t = String(rmpType || '').toLowerCase();
        var payload = typePayload || {};

        if (t.indexOf('unopened') !== -1 || t.indexOf('not-open') !== -1 || t === 'no' || payload.open === false) {
            return 'no';
        }
        if (t === 'tsf_pill_h' || t === 'tsf_pill_v' || t === 'tsf_pill_d45' || t === 'tsf_pill_d135' || t === 'tsf_dumbbell' || t === 'tsf' || t === 'tsfo' || t === 'rdot' || t === 'dot') {
            return t;
        }
        var isInt = t.indexOf('-int') !== -1 || t.indexOf('int') !== -1 || t.indexOf('transfer') !== -1 || t.indexOf('osi') !== -1 || (degreeCount && degreeCount > 1);
        if (isInt) {
            // 若携带明显旋转角且为跑道圆胶囊风格 (如 shmetro-int / gzmtr-int / mtr)
            if (payload && typeof payload.rotate === 'number' && (t.indexOf('shmetro-int') !== -1 || t.indexOf('mtr') !== -1 || t.indexOf('pill') !== -1)) {
                var rot = ((payload.rotate % 360) + 360) % 360;
                if (rot === 0 || rot === 180) return 'tsf_pill_h';
                if (rot === 90 || rot === 270) return 'tsf_pill_v';
                if (rot === 45 || rot === 225) return 'tsf_pill_d45';
                if (rot === 135 || rot === 315) return 'tsf_pill_d135';
            }
            return 'tsf';
        }
        return 'dot';
    }

    /**
     * 根据 RMP 边类型 (diagonal / perpendicular / simple / straight) 计算折线控制点阵
     */
    function computeRmpEdgePoints(p1, p2, edgeType, edgeProps, srcId, tgtId) {
        var startPt = { x: p1.x, y: p1.y, nid: srcId };
        var endPt = { x: p2.x, y: p2.y, nid: tgtId };
        var dx = p2.x - p1.x;
        var dy = p2.y - p1.y;
        var adx = Math.abs(dx);
        var ady = Math.abs(dy);

        if (adx < 1e-3 || ady < 1e-3 || Math.abs(adx - ady) < 1e-3) {
            return [startPt, endPt];
        }

        var t = String(edgeType || 'diagonal').toLowerCase();
        var props = edgeProps || {};
        var startFrom = props.startFrom || 'from'; // 'from': 先从起点出发走第一段; 'to': 先从终点反向出发

        if (t === 'simple' || t === 'straight') {
            return [startPt, endPt];
        }

        if (t === 'perpendicular' || t === 'orthogonal' || t === '90') {
            var corner90 = (startFrom === 'to')
                ? { x: p1.x, y: p2.y }
                : { x: p2.x, y: p1.y };
            return [startPt, corner90, endPt];
        }

        // 默认为 RMP 经典的 135° 圆角折线 (diagonal = 直段 + 45° 斜段)
        var diagLen = Math.min(adx, ady);
        var sx = dx >= 0 ? 1 : -1;
        var sy = dy >= 0 ? 1 : -1;
        var corner;

        if (startFrom === 'to') {
            // 从起点先走 45° 斜线，再走水平/垂直直线到终点
            if (adx > ady) {
                corner = { x: Math.round((p1.x + sx * diagLen) * 100) / 100, y: p2.y };
            } else {
                corner = { x: p2.x, y: Math.round((p1.y + sy * diagLen) * 100) / 100 };
            }
        } else {
            // startFrom === 'from'：从起点先走水平/垂直直线，再走 45° 斜线到终点
            if (adx > ady) {
                corner = { x: Math.round((p2.x - sx * diagLen) * 100) / 100, y: p1.y };
            } else {
                corner = { x: p1.x, y: Math.round((p2.y - sy * diagLen) * 100) / 100 };
            }
        }

        return [startPt, corner, endPt];
    }

    /**
     * 解析标准 RMP Graphology 存档结构
     */
    function parseGraphologyRmp(data, opts) {
        var graph = data.graph || {};
        var rawNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
        var rawEdges = Array.isArray(graph.edges) ? graph.edges : [];

        var stations = [];
        var texts = [];

        rawNodes.forEach(function (n) {
            if (!n || !n.key) return;
            var attr = n.attributes || {};
            if (attr.visible === false) return;
            var nType = attr.type || 'shmetro-basic';
            var payload = attr[nType] || {};
            var x = Number(attr.x) || 0;
            var y = Number(attr.y) || 0;

            // 识别是否为文本或杂项标签节点
            var isTextNode = n.key.indexOf('misc_node_') === 0 && (nType.indexOf('text') !== -1 || payload.content !== undefined);
            if (isTextNode || nType === 'text' || nType === 'i18n-text') {
                var content = payload.content || (Array.isArray(payload.names) ? payload.names.join(' ') : '') || payload.text || '';
                if (content) {
                    texts.push({
                        id: n.key,
                        x: x,
                        y: y,
                        text: String(content).replace(/\n/g, ' '),
                        size: Number(payload.fontSize) || 14,
                        color: normalizeHex(payload.color || '#334155'),
                        rotate: Number(payload.rotate) || 0
                    });
                }
                return;
            }

            // 设施图标杂项节点若不是车站则跳过或转为装饰
            if (n.key.indexOf('misc_node_') === 0 && !Array.isArray(payload.names)) {
                return;
            }

            var names = Array.isArray(payload.names) ? payload.names : [payload.name || n.key, ''];
            var cn = String(names[0] || '').replace(/\n/g, '<br>').trim();
            var en = String(names[1] || '').replace(/\n/g, '<br>').trim();
            var align = mapRmpAlign(payload.nameOffsetX, payload.nameOffsetY, payload.align);

            stations.push({
                id: n.key,
                x: x,
                y: y,
                cn: cn || n.key,
                en: en,
                rmpType: nType,
                rmpPayload: payload,
                align: align
            });
        });

        var edges = [];
        rawEdges.forEach(function (e) {
            if (!e || !e.source || !e.target) return;
            var attr = e.attributes || {};
            if (attr.visible === false) return;
            var eType = attr.type || 'diagonal';
            var eProps = attr[eType] || {};
            var styleType = attr.style || 'single-color';
            var styleProps = attr[styleType] || {};
            var colorTuple = styleProps.color || attr.color || ['#0284c7'];
            var hex = normalizeHex(colorTuple);
            var lineCode = (Array.isArray(colorTuple) && colorTuple[1]) ? String(colorTuple[1]) : '';
            var isNotOpen = styleType.indexOf('dotted') !== -1 || styleType.indexOf('unopened') !== -1 || styleType.indexOf('under-construction') !== -1;
            var isVirtual = styleType.indexOf('virtual') !== -1 || styleType.indexOf('osi') !== -1;

            edges.push({
                id: e.key || ('edge_' + edges.length),
                source: e.source,
                target: e.target,
                edgeType: eType,
                edgeProps: eProps,
                color: hex,
                lineCode: lineCode,
                lineName: styleProps.lineName || lineCode || '',
                notOpen: isNotOpen,
                isVirtual: isVirtual
            });
        });

        return { stations: stations, edges: edges, texts: texts, explicitLines: [] };
    }

    /**
     * 解析结构化 RMP JSON ({ stations, lines, paths/segments })
     */
    function parseStructuredRmp(data) {
        var stations = [];
        var rawSt = data.stations || data.nodes || [];
        if (Array.isArray(rawSt)) {
            rawSt.forEach(function (s, idx) {
                if (!s) return;
                var id = s.id || s.key || ('stn_' + (idx + 1));
                var names = Array.isArray(s.names) ? s.names : [s.cn || s.name_zh || s.name || id, s.en || s.name_en || ''];
                stations.push({
                    id: id,
                    x: Number(s.x != null ? s.x : (s.position && s.position.x)) || 0,
                    y: Number(s.y != null ? s.y : (s.position && s.position.y)) || 0,
                    cn: String(names[0] || '').trim(),
                    en: String(names[1] || '').trim(),
                    rmpType: s.style || s.type || 'dot',
                    rmpPayload: s,
                    align: mapRmpAlign(s.nameOffsetX || (s.labelOffset && s.labelOffset.x), s.nameOffsetY || (s.labelOffset && s.labelOffset.y), s.align)
                });
            });
        } else if (typeof rawSt === 'object') {
            Object.keys(rawSt).forEach(function (id) {
                var s = rawSt[id];
                if (!s) return;
                var names = Array.isArray(s.names) ? s.names : [s.cn || s.name_zh || s.name || id, s.en || s.name_en || ''];
                stations.push({
                    id: id,
                    x: Number(s.x) || 0,
                    y: Number(s.y) || 0,
                    cn: String(names[0] || '').trim(),
                    en: String(names[1] || '').trim(),
                    rmpType: s.style || s.type || 'dot',
                    rmpPayload: s,
                    align: mapRmpAlign(s.nameOffsetX, s.nameOffsetY, s.align)
                });
            });
        }

        var explicitLines = Array.isArray(data.lines) ? data.lines : [];
        var edges = [];
        var rawPaths = data.paths || data.segments || data.edges || [];
        rawPaths.forEach(function (p, idx) {
            if (!p) return;
            edges.push({
                id: p.id || ('seg_' + (idx + 1)),
                source: p.source || p.from || (Array.isArray(p.points) && p.points[0] && p.points[0].nid) || null,
                target: p.target || p.to || (Array.isArray(p.points) && p.points[p.points.length - 1] && p.points[p.points.length - 1].nid) || null,
                points: Array.isArray(p.points) ? p.points : null,
                edgeType: p.type || 'diagonal',
                edgeProps: p,
                lineId: p.lineId || p.line || '',
                color: normalizeHex(p.color || '#0284c7'),
                lineCode: p.lineCode || p.lineId || '',
                notOpen: !!p.notOpen
            });
        });

        // 若 lines 自带 stationIds 但未单独给 paths，自动按相邻站生成边
        if (!edges.length && explicitLines.length) {
            explicitLines.forEach(function (ln, lIdx) {
                var sids = ln.stationIds || ln.stations || [];
                var lid = ln.id || ('L' + (lIdx + 1));
                var lColor = normalizeHex(ln.color || '#0284c7');
                for (var i = 0; i < sids.length - 1; i++) {
                    edges.push({
                        id: 'edge_' + lid + '_' + i,
                        source: sids[i],
                        target: sids[i + 1],
                        edgeType: ln.routingType || 'diagonal',
                        edgeProps: {},
                        lineId: lid,
                        color: lColor,
                        lineCode: lid,
                        lineName: ln.name || lid,
                        notOpen: !!ln.notOpen
                    });
                }
            });
        }

        var texts = Array.isArray(data.texts) ? data.texts.map(function (t, i) {
            return {
                id: t.id || ('text_' + (i + 1)),
                x: Number(t.x) || 0,
                y: Number(t.y) || 0,
                text: String(t.text || t.content || ''),
                size: Number(t.size || t.fontSize) || 14,
                color: normalizeHex(t.color || '#334155'),
                rotate: Number(t.rotate) || 0
            };
        }) : [];

        return { stations: stations, edges: edges, texts: texts, explicitLines: explicitLines };
    }

    /**
     * 将 RMP JSON 转换为标准 CGo OpenMap Editor Project 对象
     * @param {Object|string} rmpInput RMP JSON 对象或字符串
     * @param {Object} [options] { cityId, cityName, gridStep: 5, padding: 160 }
     * @returns {Object} CGo Project 对象 (附带 stats 统计信息)
     */
    function convert(rmpInput, options) {
        var opt = options || {};
        var data = typeof rmpInput === 'string' ? JSON.parse(rmpInput) : rmpInput;
        if (!data || typeof data !== 'object') {
            throw new Error('无效的 RMP JSON 数据');
        }

        var parsed = (data.graph && Array.isArray(data.graph.nodes))
            ? parseGraphologyRmp(data, opt)
            : parseStructuredRmp(data);

        var gridStep = opt.gridStep !== undefined ? Number(opt.gridStep) : DEFAULT_GRID;
        var padding = opt.padding !== undefined ? Number(opt.padding) : DEFAULT_PADDING;

        // 1. 计算全体坐标外接包围盒并平移归一化到正象限
        var allPts = [];
        parsed.stations.forEach(function (s) { allPts.push({ x: s.x, y: s.y }); });
        parsed.texts.forEach(function (t) { allPts.push({ x: t.x, y: t.y }); });
        parsed.edges.forEach(function (e) {
            if (Array.isArray(e.points)) {
                e.points.forEach(function (p) { allPts.push({ x: Number(p.x) || 0, y: Number(p.y) || 0 }); });
            }
        });

        var minX = 0, minY = 0, maxX = 1200, maxY = 900;
        if (allPts.length > 0) {
            minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
            allPts.forEach(function (p) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
        }

        // 若坐标存在负值或边距过窄，自动平移至 padding 起点
        var shiftX = (minX < padding / 2) ? roundToGrid(padding - minX, gridStep) : 0;
        var shiftY = (minY < padding / 2) ? roundToGrid(padding - minY, gridStep) : 0;

        var canvasWidth = Math.max(1600, roundToGrid(maxX + shiftX + padding, 50));
        var canvasHeight = Math.max(1200, roundToGrid(maxY + shiftY + padding, 50));

        // 2. 构建车站坐标字典并统计每个车站连接的线路数（用于自动判定换乘站）
        var stationLineSets = {};
        var lineMap = {};
        var lines = [];

        // 先注册显式定义的线路
        (parsed.explicitLines || []).forEach(function (ln, idx) {
            var lid = ln.id || ('L' + (idx + 1));
            var lObj = {
                id: lid,
                name: ln.name || lid,
                badge: ln.badge || lid.replace(/^L/i, ''),
                color: normalizeHex(ln.color || '#0284c7'),
                stationIds: Array.isArray(ln.stationIds) ? ln.stationIds.slice() : [],
                distances: []
            };
            lineMap[lid] = lObj;
            lines.push(lObj);
        });

        // 3. 遍历边，按 lineId / lineCode / color 自动聚类生成线路
        var colorToLineId = {};
        lines.forEach(function (l) {
            colorToLineId[l.id] = l.id;
            colorToLineId[l.color.toLowerCase()] = l.id;
        });

        parsed.edges.forEach(function (edge) {
            if (edge.isVirtual) return;
            var key = edge.lineId || edge.lineCode || edge.color.toLowerCase();
            var lid = colorToLineId[key] || colorToLineId[edge.color.toLowerCase()];
            if (!lid) {
                var nextNum = lines.length + 1;
                lid = edge.lineId || (edge.lineCode ? edge.lineCode.toUpperCase() : ('L' + nextNum));
                // 避免 ID 冲突
                if (lineMap[lid]) lid = lid + '_' + nextNum;
                var lName = edge.lineName || (edge.lineCode ? edge.lineCode.toUpperCase() + '线' : (nextNum + '号线'));
                var newLine = {
                    id: lid,
                    name: lName,
                    badge: String(nextNum),
                    color: edge.color || '#0284c7',
                    stationIds: [],
                    distances: []
                };
                lineMap[lid] = newLine;
                lines.push(newLine);
                colorToLineId[key] = lid;
                colorToLineId[newLine.color.toLowerCase()] = lid;
            }
            edge._resolvedLineId = lid;
            if (edge.source) {
                stationLineSets[edge.source] = stationLineSets[edge.source] || {};
                stationLineSets[edge.source][lid] = true;
            }
            if (edge.target) {
                stationLineSets[edge.target] = stationLineSets[edge.target] || {};
                stationLineSets[edge.target][lid] = true;
            }
        });

        // 若没有任何边但有站点，创建一条默认 1 号线
        if (!lines.length) {
            var defaultLine = { id: 'L1', name: '1号线', badge: '1', color: '#e4002b', stationIds: [], distances: [] };
            lineMap.L1 = defaultLine;
            lines.push(defaultLine);
        }

        // 4. 生成 CGo project.nodes
        var nodes = {};
        parsed.stations.forEach(function (s) {
            var deg = stationLineSets[s.id] ? Object.keys(stationLineSets[s.id]).length : 0;
            var stType = mapRmpStationType(s.rmpType, s.rmpPayload, deg);
            var nx = roundToGrid(s.x + shiftX, gridStep);
            var ny = roundToGrid(s.y + shiftY, gridStep);
            nodes[s.id] = {
                id: s.id,
                x: nx,
                y: ny,
                type: stType,
                cn: s.cn || s.id,
                en: s.en || '',
                align: s.align || 'top',
                offset: { x: 0, y: 0 }
            };
            if (stType === 'no') {
                nodes[s.id].notOpen = true;
            }
        });

        // 5. 生成 CGo project.segments
        var segments = [];
        parsed.edges.forEach(function (edge, idx) {
            if (edge.isVirtual) return;
            var lid = edge._resolvedLineId || lines[0].id;
            var pts = null;

            if (Array.isArray(edge.points) && edge.points.length >= 2) {
                pts = edge.points.map(function (p) {
                    var pt = {
                        x: roundToGrid((Number(p.x) || 0) + shiftX, gridStep),
                        y: roundToGrid((Number(p.y) || 0) + shiftY, gridStep)
                    };
                    if (p.nid && nodes[p.nid]) {
                        pt.nid = p.nid;
                        pt.x = nodes[p.nid].x;
                        pt.y = nodes[p.nid].y;
                    }
                    return pt;
                });
            } else if (edge.source && edge.target && nodes[edge.source] && nodes[edge.target]) {
                var nA = nodes[edge.source];
                var nB = nodes[edge.target];
                pts = computeRmpEdgePoints(nA, nB, edge.edgeType, edge.edgeProps, edge.source, edge.target);
            }

            if (pts && pts.length >= 2) {
                var segObj = {
                    id: edge.id || ('seg_rmp_' + (idx + 1)),
                    lineId: lid,
                    type: edge.edgeType === 'perpendicular' ? '90' : (edge.edgeType === 'simple' ? 'line' : '45'),
                    points: pts
                };
                if (edge.notOpen) segObj.notOpen = true;
                segments.push(segObj);

                var lObj = lineMap[lid];
                if (lObj) {
                    pts.forEach(function (p) {
                        if (p.nid && lObj.stationIds.indexOf(p.nid) === -1) {
                            lObj.stationIds.push(p.nid);
                        }
                    });
                }
            }
        });

        // 6. 使用 StationOrder 按线段拓扑自动重建每条线路的真实物理站序
        var SO = (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.StationOrder) || null;
        lines.forEach(function (line) {
            var lineSegs = segments.filter(function (s) { return s.lineId === line.id; });
            if (SO && lineSegs.length > 0 && typeof SO.orderFromSegments === 'function') {
                var ordered = SO.orderFromSegments(line.stationIds, lineSegs, nodes);
                if (ordered && Array.isArray(ordered.ids) && ordered.ids.length > 0) {
                    line.stationIds = ordered.ids;
                }
            }
            var needDist = Math.max(0, (line.stationIds || []).length - 1);
            line.distances = needDist > 0 ? new Array(needDist).fill('??') : [];
        });

        // 7. 自由文本转换
        var texts = parsed.texts.map(function (t) {
            return {
                id: t.id,
                x: roundToGrid(t.x + shiftX, gridStep),
                y: roundToGrid(t.y + shiftY, gridStep),
                text: t.text,
                size: t.size || 14,
                color: t.color || '#334155',
                rotate: t.rotate || 0
            };
        });

        var project = {
            version: '2.0',
            id: opt.cityId || data.cityId || 'rmp_imported',
            name: opt.cityName || data.cityName || data.name || 'RMP 导入工程',
            slope: 45,
            gridSize: gridStep || 5,
            canvas: { width: canvasWidth, height: canvasHeight },
            nodes: nodes,
            lines: lines,
            segments: segments,
            waters: [],
            texts: texts,
            scattered: [],
            notOpenLines: []
        };

        var stats = {
            stationCount: Object.keys(nodes).length,
            lineCount: lines.length,
            segmentCount: segments.length,
            textCount: texts.length,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight
        };
        project.stats = stats;
        return project;
    }

    return {
        isRmpJson: isRmpJson,
        mapRmpAlign: mapRmpAlign,
        mapRmpStationType: mapRmpStationType,
        computeRmpEdgePoints: computeRmpEdgePoints,
        convert: convert
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.OpenMapEditor.RMPImporter;
}

