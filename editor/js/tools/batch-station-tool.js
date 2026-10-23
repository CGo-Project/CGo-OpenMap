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
     * 从 HTML 表格源码中抽取车站列表
     * @param {string} html
     * @returns {Array<{cn:string, en:string}>}
     */
    function extractStationsFromHtml(html) {
        var text = String(html || '');
        var candidates = [];
        var cellMatches = text.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
        if (cellMatches) {
            cellMatches.forEach(function (cell) {
                var parts = cellHtmlToParts(cell);
                var cn = '', en = '';
                parts.forEach(function (p) {
                    var cand = stationNameCandidate(p);
                    if (cand && !cn) {
                        cn = cand;
                        var pair = splitStationName(p);
                        if (pair.en) en = pair.en;
                    } else if (!en && /^[A-Za-z\s'’\-.]+$/.test(p) && p.length > 2) {
                        en = p;
                    }
                });
                if (cn) {
                    candidates.push({ cn: cn, en: normalizeStationEnglish(en) });
                }
            });
        }

        // 去重保持序
        var seen = new Set();
        var out = [];
        candidates.forEach(function (c) {
            if (!seen.has(c.cn)) {
                seen.add(c.cn);
                out.push(c);
            }
        });
        return out;
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

        // 自动连线
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
        }

        return createdNodeIds;
    }

    return {
        extractStationsFromHtml: extractStationsFromHtml,
        parseStationList: parseStationList,
        batchCreateStations: batchCreateStations,
        normalizeStationName: normalizeStationName
    };
})();

// 保留全局别名兼容
window.BatchStationTool = window.OpenMapEditor.BatchStationTool;
