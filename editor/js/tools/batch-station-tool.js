/**
 * 开放地图编辑器 (OpenMap Editor) - 百科表格与站名批量放站工具
 * 提取自原 city-editor 第 17 节：从维基百科/百度百科表格提取中英文站名并批量排入画布
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.BatchStationTool = (function () {
    'use strict';

    function decodeHtmlEntities(text) {
        return String(text || '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
            .replace(/&amp;/gi, '&')
            .replace(/&#x([0-9a-f]+);/gi, function (m, hex) { return String.fromCharCode(parseInt(hex, 16)); })
            .replace(/&#(\d+);/g, function (m, dec) { return String.fromCharCode(parseInt(dec, 10)); });
    }

    function htmlToPlainText(html) {
        var text = String(html == null ? '' : html)
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/<[^>]*>/g, ' ');
        return decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();
    }

    function cellHtmlToParts(html) {
        var text = String(html == null ? '' : html)
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<!--[\s\S]*?-->/g, ' ')
            .replace(/<\s*br\s*\/?>/gi, '\n')
            .replace(/<\s*\/\s*(div|p|li|tr|td|th|h[1-6]|section|article|figcaption)\s*>/gi, '\n');
        return decodeHtmlEntities(text.replace(/<[^>]*>/g, ''))
            .split('\n')
            .map(function (s) { return s.replace(/\s+/g, ' ').trim(); })
            .filter(Boolean);
    }

    function splitStationName(text) {
        var s = String(text == null ? '' : text).trim();
        if (!s) return { cn: '', en: '' };
        var m = /^(.+?)\s*[（(]\s*([A-Za-z][^（()）]*)\s*[)）]\s*$/.exec(s);
        if (m) return { cn: m[1].trim(), en: m[2].trim() };
        var m2 = /^([^\x00-\x7F][^A-Za-z]*?)\s+([A-Za-z][A-Za-z0-9'’\-.\s]*)$/.exec(s);
        if (m2) return { cn: m2[1].trim(), en: m2[2].trim() };
        if (/^[A-Za-z]/.test(s)) return { cn: '', en: s };
        return { cn: s, en: '' };
    }

    function normalizeStationName(name) {
        var s = String(name == null ? '' : name).trim();
        if (!s) return '';
        if (/站站$/.test(s)) {
            while (/站站$/.test(s)) s = s.slice(0, -1);
            return s;
        }
        if (/(火车站|汽车站|客运站|枢纽站)$/.test(s)) return s;
        if (/^..+?[东南西北]站$/.test(s)) return s;
        if (/站$/.test(s)) {
            var trimmed = s.slice(0, -1);
            if (trimmed.length >= 2) return trimmed;
        }
        return s;
    }

    function normalizeStationEnglish(name) {
        var s = String(name == null ? '' : name).replace(/\s+/g, ' ').trim();
        if (!s) return '';
        if (/\b(Railway|Railroad|Coach|Bus|Subway|Metro|Tram)\s+Stations?$/i.test(s)) return s;
        var trimmed = s.replace(/\s+Stations?$/i, '').trim();
        return trimmed || s;
    }

    function stripStationCellNoise(text) {
        return String(text == null ? '' : text)
            .replace(/\[\s*\d+(?:\s*[-–~—]\s*\d+)?\s*\]/g, ' ')
            .replace(/[〔【]\s*\d+(?:\s*[-–~—]\s*\d+)?\s*[〕】]/g, ' ')
            .replace(/[（(]\s*\d+(?:\s*[-–~—]\s*\d+)?\s*[)）]/g, ' ')
            .replace(/\s*\*+\s*$/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    var STATION_STOP_WORDS = new RegExp('^(' + [
        '目录', '编辑', '播报', '订阅更新', '手机版', '举报', '反馈', '分享', '收藏', '点赞', '展开', '收起',
        '车站列表', '站点列表', '沿线站点', '沿线车站', '线路站点', '线路走向', '历史沿革', '车站名称', '车站名', '站名',
        '所属行政区', '换乘线路', '车站形式', '车站结构', '序号', '里程', '站间距', '开通日期', '标志色'
    ].join('|') + ')$');

    function stationNameCandidate(line) {
        var s = stripStationCellNoise(String(line == null ? '' : line).trim());
        if (!s) return '';
        s = s.replace(/^[-*•·—–]+\s*/, '');
        s = s.replace(/^\d+\s*[.、)．）:：]?\s*/, '');
        s = s.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '');
        s = s.replace(/[（(][^（()）]*[)）]$/, '');
        s = s.trim();
        if (STATION_STOP_WORDS.test(s)) return '';
        if (/(号线|快线|地铁|城际)$/.test(s)) return '';
        if (/(岛式|侧式|地下|高架|地面)/.test(s)) return '';
        if (s.length < 2 || s.length > 14) return '';
        if (!/^[\u4e00-\u9fa5·0-9A-Za-z()（）]+$/.test(s)) return '';
        if ((s.match(/[\u4e00-\u9fa5]/g) || []).length < 2) return '';
        return normalizeStationName(s);
    }

    /**
     * 把 HTML 表格解析成「行 × 列」的网格，正确处理 rowspan / colspan。
     *
     * 这一步是提取正确与否的关键：百科表格大量使用 rowspan（例如「站台形式」跨 3 行、
     * 「所属区域」跨 7 行），只按 <td> 出现顺序取文本会让后面的列整体错位，
     * 于是「瑶海区」「左侧」这类格子会被误当成站名。
     *
     * @param {string} html
     * @returns {Array<{cells: Array<{text:string, tag:string}>, isHeaderRow: boolean}>}
     */
    function parseTableGrid(html) {
        var text = String(html || '');
        var trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
        var cellRe = /<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
        var rows = [];
        var carried = [];   // 上方 rowspan 遗留下来、仍需向下延伸的格子：{ col, left, cell }
        var tr;
        var guard = 0;

        while ((tr = trRe.exec(text))) {
            if (guard++ > 4000) break;
            var inner = tr[1];
            var raw = [];
            var cm;
            cellRe.lastIndex = 0;
            while ((cm = cellRe.exec(inner))) {
                var attrs = cm[2] || '';
                var parts = cellHtmlToParts(cm[3]);
                raw.push({
                    tag: cm[1].toLowerCase(),
                    text: parts.join(' ').trim(),
                    parts: parts,          // 同一格内可能「中文一行、英文一行」
                    rowspan: Math.max(1, parseInt((/rowspan\s*=\s*["']?(\d+)/i.exec(attrs) || [])[1], 10) || 1),
                    colspan: Math.max(1, parseInt((/colspan\s*=\s*["']?(\d+)/i.exec(attrs) || [])[1], 10) || 1)
                });
            }
            if (!raw.length) continue;

            var line = [];
            var ci = 0;
            var isHeaderRow = false;
            var step = 0;
            while ((raw.length || carried.length) && step++ < 400) {
                var hit = null;
                for (var k = 0; k < carried.length; k++) {
                    if (carried[k].col === ci && carried[k].left > 0) { hit = carried[k]; break; }
                }
                if (hit) {
                    line[ci] = hit.cell;
                    hit.left--;
                    if (hit.left <= 0) carried.splice(carried.indexOf(hit), 1);
                    ci++;
                    continue;
                }
                if (!raw.length) break;
                var cell = raw.shift();
                if (cell.tag === 'th') isHeaderRow = true;
                for (var c = 0; c < cell.colspan; c++) {
                    line[ci + c] = { text: cell.text, parts: cell.parts, tag: cell.tag };
                    if (cell.rowspan > 1) carried.push({ col: ci + c, left: cell.rowspan - 1, cell: { text: cell.text, parts: cell.parts, tag: cell.tag } });
                }
                ci += cell.colspan;
            }
            // 补齐空洞，保证列下标稳定
            for (var f = 0; f < line.length; f++) {
                if (!line[f]) line[f] = { text: '', parts: [], tag: 'td' };
            }
            rows.push({ cells: line, isHeaderRow: isHeaderRow });
        }
        return rows;
    }

    var CN_HEADER_RE = /^(车站名称|车站名|站名|车站|中文名|中文名称|名称|站台名称)$/;
    var EN_HEADER_RE = /^(英文名称|英文名|英文|english\s*name|station\s*name\s*in\s*english|english)$/i;
    var FOOTER_RE = /^(截至|注[：:]|资料来源|参考资料|参考来源|备注|注$)/;

    /**
     * 解析百科表格源码 → 车站候选行（带中英文、行序号、被跳过的行数）
     *
     * @param {string} html
     * @returns {{ rows: Array<{cn:string,en:string,raw:string,rowNo:number}>, skipped: number, headers: string[], cnCol: number, enCol: number }}
     */
    function parseStationTable(html) {
        var grid = parseTableGrid(html);
        var result = { rows: [], skipped: 0, headers: [], cnCol: -1, enCol: -1 };
        if (!grid.length) return result;

        // 1. 定位表头（取前 6 行里第一行含「车站名称 / 英文名称」的）
        var headerRowIdx = -1;
        for (var r = 0; r < Math.min(grid.length, 6); r++) {
            var cells = grid[r].cells;
            var hitCn = -1, hitEn = -1;
            for (var c = 0; c < cells.length; c++) {
                var t = (cells[c] && cells[c].text || '').trim();
                if (!t) continue;
                if (hitCn < 0 && CN_HEADER_RE.test(t)) hitCn = c;
                if (hitEn < 0 && EN_HEADER_RE.test(t)) hitEn = c;
            }
            if (hitCn >= 0 || hitEn >= 0) {
                headerRowIdx = r;
                result.cnCol = hitCn;
                result.enCol = hitEn;
                result.headers = cells.map(function (cc) { return (cc && cc.text || '').trim(); });
                break;
            }
        }

        // 2. 逐行取值
        var start = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
        var seen = {};
        for (var i = start; i < grid.length; i++) {
            var rowCells = grid[i].cells;
            if (!rowCells || !rowCells.length) continue;

            var cnCell = result.cnCol >= 0 ? rowCells[result.cnCol] : null;
            var enCell = result.enCol >= 0 ? rowCells[result.enCol] : null;
            var cnRaw = cnCell ? cnCell.text : '';
            var enRaw = enCell ? enCell.text : '';
            var inlineEn = '';

            // 常见变体：中英文挤在同一格的不同行（<div>西直门站</div><div>Xizhimen Station</div>）
            if (cnCell && cnCell.parts && cnCell.parts.length > 1 && !stationNameCandidate(cnRaw)) {
                for (var pi = 0; pi < cnCell.parts.length; pi++) {
                    var partCn = stationNameCandidate(cnCell.parts[pi]);
                    if (!partCn) continue;
                    cnRaw = cnCell.parts[pi];
                    for (var qi = pi + 1; qi < cnCell.parts.length; qi++) {
                        if (/^[A-Za-z][A-Za-z0-9'’\-.\s]*$/.test(cnCell.parts[qi]) && cnCell.parts[qi].length > 2) {
                            inlineEn = cnCell.parts[qi];
                            break;
                        }
                    }
                    break;
                }
            }

            if (!cnRaw) {
                // 没有表头（或该列空）：退化为整行扫描，取第一个像站名的格子
                for (var j = 0; j < rowCells.length; j++) {
                    var cand = stationNameCandidate(rowCells[j].text);
                    if (cand) { cnRaw = rowCells[j].text; break; }
                }
                if (cnRaw) {
                    for (var k2 = 0; k2 < rowCells.length; k2++) {
                        if (rowCells[k2].text === cnRaw) continue;
                        if (/^[A-Za-z][A-Za-z0-9'’\-.\s]*$/.test(rowCells[k2].text || '') && (rowCells[k2].text || '').length > 2) {
                            enRaw = rowCells[k2].text;
                            break;
                        }
                    }
                }
            }

            var cn = stationNameCandidate(cnRaw);
            if (!cn || FOOTER_RE.test(cn) || FOOTER_RE.test(String(cnRaw || '').trim())) {
                result.skipped++;
                continue;
            }
            if (seen[cn]) { result.skipped++; continue; }
            seen[cn] = true;

            var en = normalizeStationEnglish(enRaw || inlineEn);
            if (!en) {
                var pair = splitStationName(cnRaw);
                en = normalizeStationEnglish(pair.en);
            }
            result.rows.push({ cn: cn, en: en, raw: String(cnRaw || '').trim(), rowNo: i + 1 });
        }
        return result;
    }

    /**
     * 从 HTML 表格源码中抽取车站列表（旧接口，返回 [{cn, en}]）
     * @param {string} html
     * @returns {Array<{cn:string, en:string}>}
     */
    function extractStationsFromHtml(html) {
        return parseStationTable(html).rows.map(function (r) {
            return { cn: r.cn, en: r.en };
        });
    }

    /**
     * 解析纯文本站名列表（每行一个）
     */
    function parseStationList(text) {
        var raw = String(text || '').replace(/\r\n?/g, '\n');
        var seen = new Set();
        var out = [];
        raw.split('\n').forEach(function (line) {
            var s = line.trim();
            if (!s) return;
            var parts = splitStationName(s);
            var cn = stationNameCandidate(parts.cn || s);
            if (!cn || seen.has(cn)) return;
            seen.add(cn);
            out.push({ cn: cn, en: normalizeStationEnglish(parts.en) });
        });
        return out;
    }

    /**
     * 批量创建车站节点并按步长与方向排列连线
     * @param {Object} project
     * @param {string} lineId
     * @param {Array} stations [{ cn, en }]
     * @param {Object} opts { startX, startY, step, direction: 'horizontal'|'vertical'|'diagonal', autoConnect }
     */
    function batchCreateStations(project, lineId, stations, opts) {
        if (!project || !stations || !stations.length) return [];
        var o = opts || {};
        var startX = Number(o.startX) || 200;
        var startY = Number(o.startY) || 200;
        var step = Number(o.step) || 60;
        var dir = o.direction || 'horizontal';

        var dx = (dir === 'vertical') ? 0 : step;
        var dy = (dir === 'horizontal') ? 0 : step;

        var createdNodeIds = [];
        stations.forEach(function (st, idx) {
            var nid = 'node_' + (++project.idSeq);
            var x = startX + idx * dx;
            var y = startY + idx * dy;

            project.nodes[nid] = {
                id: nid,
                x: x,
                y: y,
                cn: st.cn,
                en: st.en || '',
                type: 'dot',
                align: (dir === 'vertical') ? 'right' : 'top',
                offset: { x: 0, y: 0 }
            };
            createdNodeIds.push(nid);
        });

        // 自动连线（同时把站序写进线路，否则这些车站只是"画在图上"、不在任何线路站序里）
        if (o.autoConnect && createdNodeIds.length >= 2 && lineId) {
            for (var i = 1; i < createdNodeIds.length; i++) {
                var prevId = createdNodeIds[i - 1];
                var currId = createdNodeIds[i];
                var p1 = project.nodes[prevId];
                var p2 = project.nodes[currId];
                var segId = 'seg_' + (++project.idSeq);

                project.segments.push({
                    id: segId,
                    lineId: lineId,
                    type: 'segaxis',
                    points: [
                        { x: p1.x, y: p1.y, nid: prevId },
                        { x: p2.x, y: p2.y, nid: currId }
                    ],
                    routed: true
                });
            }

            var line = (project.lines || []).find(function (l) { return l.id === lineId; });
            if (line) {
                var idsKey = line.hasbranch ? 'stationIds-way1' : 'stationIds';
                if (!Array.isArray(line[idsKey])) line[idsKey] = [];
                var distKey = line.hasbranch ? 'distances-way1' : 'distances';
                var idsBefore = line[idsKey].length;
                var distBefore = Array.isArray(line[distKey]) ? line[distKey].length : -1;

                createdNodeIds.forEach(function (nid) {
                    if (line[idsKey].indexOf(nid) === -1) line[idsKey].push(nid);
                });

                // 站距必须与站数配套（否则触发硬性校验错误）：原本规整的数组补 0 占位，
                // 由「里程管理」再补齐真实里程；原本就缺失/为空的继续留空（属于合法待补状态）。
                if (distBefore >= 0 && distBefore === idsBefore - 1) {
                    if (!Array.isArray(line[distKey])) line[distKey] = [];
                    var need = line[idsKey].length - 1 - line[distKey].length;
                    for (var d = 0; d < need; d++) line[distKey].push(0);
                }
            }
        }

        return createdNodeIds;
    }

    return {
        parseTableGrid: parseTableGrid,
        parseStationTable: parseStationTable,
        extractStationsFromHtml: extractStationsFromHtml,
        parseStationList: parseStationList,
        batchCreateStations: batchCreateStations,
        normalizeStationName: normalizeStationName
    };
})();

// 保留全局别名兼容
window.BatchStationTool = window.OpenMapEditor.BatchStationTool;
