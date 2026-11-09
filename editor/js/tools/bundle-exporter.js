/**
 * 开放地图编辑器 (OpenMap Editor) - 统一代码生成、完整性校验与 ZIP 打包器
 * 提供开箱即用的规范数据导出与标准城市资产打包能力
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.BundleExporter = (function () {
    'use strict';

    // ──────────────────────────────────────────────────────────────
    // 1. 数据完整性自检 (5 项铁律校验)
    // ──────────────────────────────────────────────────────────────

    function groupsOf(line) {
        var groups = [];
        if (!line || typeof line !== 'object') return groups;
        if (Array.isArray(line.stationIds)) {
            groups.push({ label: '', ids: line.stationIds, distances: line.distances });
        }
        Object.keys(line).forEach(function (key) {
            var m = /^stationIds-(.+)$/.exec(key);
            if (m && Array.isArray(line[key])) {
                groups.push({ label: ' ' + m[1], ids: line[key], distances: line['distances-' + m[1]] });
            }
        });
        return groups;
    }

    function validateData(stationsData, linesData) {
        var errors = [];
        var warnings = [];

        (linesData || []).forEach(function (line) {
            var groups = groupsOf(line);
            if (!groups.length) {
                if (!line.pathPoints && !line.svgPath && !Object.keys(line).some(function (k) { return /^pathPoints-/.test(k); })) {
                    warnings.push('[' + (line.name || line.id) + '] 既无站序也无折线走向，将不会被渲染。');
                }
                return;
            }

            groups.forEach(function (g) {
                if (!Array.isArray(g.distances) || g.distances.length === 0) {
                    warnings.push('[' + line.name + g.label + '] 尚未录入站间距 (distances)，共 ' + g.ids.length + ' 站待补。');
                } else if (line.isLoop) {
                    if (g.distances.length !== g.ids.length) {
                        errors.push('[' + line.name + g.label + '] 环线站间距长度(' + g.distances.length + ')必须等于站点数(' + g.ids.length + ')');
                    }
                } else if (g.distances.length !== g.ids.length - 1) {
                    errors.push('[' + line.name + g.label + '] 站间距长度(' + g.distances.length + ')必须等于站点数减一(' + (g.ids.length - 1) + ')');
                }

                g.ids.forEach(function (sid) {
                    if (!stationsData || !stationsData[sid]) {
                        errors.push('[' + line.name + g.label + '] 引用的车站 ID "' + sid + '" 在 stationsData 中未定义！');
                    }
                });
            });

            if (line.color && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(line.color)) {
                warnings.push('[' + line.name + '] 颜色格式非十六进制 Hex: ' + line.color);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    // ──────────────────────────────────────────────────────────────
    // 2. 纯 JS ZIP 二进制字节流生成器 (无任何外部依赖)
    // ──────────────────────────────────────────────────────────────

    function crc32(bytes) {
        var table = crc32.table || (crc32.table = (function () {
            var t = new Uint32Array(256);
            for (var i = 0; i < 256; i++) {
                var c = i;
                for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                t[i] = c;
            }
            return t;
        })());
        var crc = 0 ^ (-1);
        for (var i = 0; i < bytes.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
        }
        return (crc ^ (-1)) >>> 0;
    }

    function ByteBuilder(capacity) {
        this.buf = new Uint8Array(capacity || 256);
        this.pos = 0;
    }
    ByteBuilder.prototype.ensure = function (size) {
        if (this.pos + size <= this.buf.length) return;
        var next = new Uint8Array(Math.max(this.buf.length * 2, this.pos + size));
        next.set(this.buf);
        this.buf = next;
    };
    ByteBuilder.prototype.u16 = function (v) {
        this.ensure(2);
        this.buf[this.pos++] = v & 0xFF;
        this.buf[this.pos++] = (v >> 8) & 0xFF;
        return this;
    };
    ByteBuilder.prototype.u32 = function (v) {
        this.ensure(4);
        this.buf[this.pos++] = v & 0xFF;
        this.buf[this.pos++] = (v >> 8) & 0xFF;
        this.buf[this.pos++] = (v >> 16) & 0xFF;
        this.buf[this.pos++] = (v >> 24) & 0xFF;
        return this;
    };
    ByteBuilder.prototype.bytes = function (arr) {
        if (!arr || !arr.length) return this;
        this.ensure(arr.length);
        this.buf.set(arr, this.pos);
        this.pos += arr.length;
        return this;
    };
    ByteBuilder.prototype.done = function () {
        return this.buf.subarray(0, this.pos);
    };

    function buildZipBytes(entries) {
        var encoder = new TextEncoder();
        var localParts = [];
        var centralParts = [];
        var offset = 0;
        var now = new Date();
        var dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) & 0xFFFF;
        var dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var nameBytes = encoder.encode(entry.name);
            var data = (entry.data instanceof Uint8Array) ? entry.data : encoder.encode(entry.text == null ? '' : entry.text);
            var crc = crc32(data);
            var method = 0; // Store 模式兼容性最好且零开销
            var payload = data;

            var local = new ByteBuilder(30 + nameBytes.length + payload.length);
            local.u32(0x04034B50).u16(20).u16(0x0800).u16(method);
            local.u16(dosTime).u16(dosDate).u32(crc).u32(payload.length).u32(data.length);
            local.u16(nameBytes.length).u16(0);
            local.bytes(nameBytes).bytes(payload);
            var localBytes = local.done();
            localParts.push(localBytes);

            var central = new ByteBuilder(46 + nameBytes.length);
            central.u32(0x02014B50).u16(20).u16(20).u16(0x0800).u16(method);
            central.u16(dosTime).u16(dosDate).u32(crc).u32(payload.length).u32(data.length);
            central.u16(nameBytes.length).u16(0).u16(0).u16(0).u16(0).u32(0);
            central.u32(offset).bytes(nameBytes);
            centralParts.push(central.done());

            offset += localBytes.length;
        }

        var centralSize = centralParts.reduce(function (sum, part) { return sum + part.length; }, 0);
        var tail = new ByteBuilder(22);
        tail.u32(0x06054B50).u16(0).u16(0).u16(entries.length).u16(entries.length);
        tail.u32(centralSize).u32(offset).u16(0);

        var total = offset + centralSize + 22;
        var out = new Uint8Array(total);
        var pos = 0;
        localParts.concat(centralParts, [tail.done()]).forEach(function (part) {
            out.set(part, pos);
            pos += part.length;
        });
        return out;
    }

    // ──────────────────────────────────────────────────────────────
    // 3. 文件下载与代码生成 (保持 align, offset, textScale, hideLabel 等全要素保真)
    // ──────────────────────────────────────────────────────────────

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
        return null;
    }

    function formatStationValue(st) {
        var io = getCityProjectIO();
        if (io && typeof io.formatEntryValue === 'function') {
            return io.formatEntryValue(st, { multiline: false, quoteKeys: true });
        }
        return JSON.stringify(st);
    }

    function formatStationsData(stationsData) {
        var lines = ['const stationsData = {'];
        var sids = Object.keys(stationsData || {});
        sids.forEach(function (sid, idx) {
            var st = stationsData[sid];
            var trailing = (idx < sids.length - 1) ? ',' : '';
            lines.push('    ' + JSON.stringify(sid) + ': ' + formatStationValue(st) + trailing);
        });
        lines.push('};\n');
        return lines.join('\n');
    }

    function formatLinesData(linesData) {
        var io = getCityProjectIO();
        if (io && typeof io.formatEntryValue === 'function') {
            var parts = ['const linesData = ['];
            (linesData || []).forEach(function (line, idx) {
                var trailing = (idx < linesData.length - 1) ? ',' : '';
                parts.push('    ' + io.formatEntryValue(line, { multiline: true, quoteKeys: false, indent: '    ' }) + trailing);
            });
            parts.push('];\n');
            return parts.join('\n');
        }
        return 'const linesData = ' + JSON.stringify(linesData || [], null, 4) + ';\n';
    }

    /**
     * 把编辑器工程里的线路整理成可交付的 linesData。
     *
     * 关键（曾导致导出乱网的严重 bug）：
     *   · line.stationIds 是"点击/建站顺序"，画线时接到已有车站会被追加到末尾，
     *     引擎按这个顺序连点成线就会拉出横跨全图的长斜线；
     *   · 因此这里按【线段拓扑】重建站序，并把画布上真正画出来的走向写成 pathPoints
     *     （引擎优先按 pathPoints 渲染，于是导出结果 = 编辑器画面）；
     *   · 没被任何线段覆盖的车站从站序里剔除（它们不在画布这条线上），
     *     车站条目本身保留，并在返回值里报告，提示用户补画走向。
     *
     * @returns {[Array, Array]} [linesData, uncoveredReport]
     */
    function deriveCityLines(project) {
        var SO = (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.StationOrder) || null;
        var io = (typeof window !== 'undefined' && window.OpenMapEditor && window.OpenMapEditor.CityProjectIO) || null;
        var uncoveredReport = [];
        var lines = (project && project.lines) || [];

        var out = lines.map(function (line) {
            var copy = {};
            Object.keys(line).forEach(function (k) {
                if (k.charAt(0) === '_') return;               // 运行期派生字段不进数据文件
                copy[k] = line[k];
            });
            if (!SO) return copy;

            var segs = ((project && project.segments) || []).filter(function (sg) {
                return sg && sg.lineId === line.id;
            });
            if (!segs.length) return copy;

            // 1) 真实走向
            var path = SO.buildPathPoints(segs);
            if (path && path.points && path.points.length >= 2) {
                copy.pathPoints = path.points;
            }

            // 2) 站序：以【路径】为准 ——
            //    线段与车站不强绑定，只要站心落在路径上就算这条线的站，
            //    顺序按投影弧长排；换乘站允许偏离（画图时为了避让会挪站心）。
            var nodesAll = (project && project.nodes) || {};
            var tol = 6;
            var baseIds = (io && typeof io.lineAllStationIds === "function")
                ? io.lineAllStationIds(line)
                : (line.stationIds || []);
            if (path && path.points && path.points.length >= 2 && SO.stationsOnPath) {
                // 路径自动发现的站 + 线路原有站序，合并后统一按投影排序
                var discovered = SO.stationsOnPath(nodesAll, path.points, { tolerance: tol });
                var merged = baseIds.slice();
                discovered.forEach(function (id) { if (merged.indexOf(id) === -1) merged.push(id); });
                var byPath = SO.orderStationsByPath(merged, path.points, nodesAll, { tolerance: tol });
                if (byPath && byPath.ids && byPath.ids.length) copy.stationIds = byPath.ids;

                // 偏离路径的站：换乘站属正常（避让画法），只有非换乘站才提醒
                var offNonTransfer = (byPath.offPath || []).filter(function (o) {
                    var nd = nodesAll[o.id];
                    return !nd || nd.type !== "tsf";
                });
                if (offNonTransfer.length) {
                    uncoveredReport.push({
                        lineId: line.id,
                        lineName: line.name || line.id,
                        ids: offNonTransfer.map(function (o) { return o.id; }),
                        names: offNonTransfer.map(function (o) {
                            var nd = nodesAll[o.id];
                            return ((nd && nd.cn) ? nd.cn : o.id) + "(" + o.dist + "px)";
                        })
                    });
                }
            } else {
                var ordered = SO.orderFromSegments(baseIds, segs, nodesAll);
                if (ordered && ordered.ids && ordered.ids.length) copy.stationIds = ordered.ids;
            }

            // 3) 站距：站序变了就重排长度；未知用 "??" 合规占位（严禁伪造里程）
            var need = Math.max(0, (copy.stationIds || []).length - 1);
            if (!Array.isArray(copy.distances) || copy.distances.length !== need) {
                copy.distances = need > 0 ? new Array(need).fill('??') : [];
            }

            return copy;
        });

        return [out, uncoveredReport];
    }

    /**
     * 把"未开通 / 在建 / 规划"的走向整理成 data_notopen.js 的内容。
     *
     * 编辑器里未开通的线段带 notOpen: true（画布上画成灰虚线），
     * 它们**必须**单独交付到 NOT_OPEN_LINES，否则导出后会被当成已开通线路画成实线。
     * 样式沿用编辑器画布的观感（灰虚线），与引擎默认的"白线遮罩"区分开。
     */
    function buildNotOpenData(project) {
        var out = [];
        var NOT_OPEN_STYLE = { color: "#94a3b8", width: "3.4", opacity: 1, dashArray: "6,6" };

        // 1) 线段上标记为未开通的走向
        ((project && project.segments) || []).forEach(function (seg) {
            if (!seg || !seg.notOpen) return;
            var pts = (seg.points || []).filter(function (p) {
                return p && p.x !== undefined && p.y !== undefined;
            }).map(function (p) {
                return { x: Math.round(Number(p.x) * 100) / 100, y: Math.round(Number(p.y) * 100) / 100 };
            });
            if (pts.length < 2) return;
            out.push({ points: pts, style: Object.assign({}, NOT_OPEN_STYLE) });
        });

        // 2) 工程里单独维护的在建/规划走向
        ((project && project.notOpenLines) || []).forEach(function (ln) {
            if (!ln || !Array.isArray(ln.points) || ln.points.length < 2) return;
            out.push(Object.assign({}, ln));
        });

        return out;
    }

    function formatCityPackage(project, meta) {
        meta = meta || {};
        var cityId = meta.cityId || meta.id || 'unnamed';
        var cityName = meta.cityName || meta.name || cityId;

        // 从 project 提取 stationsData，严密保留全部全要素属性
        var stationsData = {};
        Object.keys(project.nodes || {}).forEach(function (nid) {
            var n = project.nodes[nid];
            var st = {
                x: n.x,
                y: n.y,
                type: n.type || 'dot',
                cn: n.cn || '',
                en: n.en || ''
            };
            if (n.align) st.align = n.align;
            if (n.offset && (n.offset.x !== 0 || n.offset.y !== 0)) st.offset = { x: n.offset.x, y: n.offset.y };
            if (n.hideLabel) st.hideLabel = true;
            if (n.textScale) st.textScale = n.textScale;
            if (n.marker) st.marker = n.marker;
            if (n.halo) st.halo = n.halo;
            if (n.notOpen) st.type = 'no';
            stationsData[nid] = st;
        });

        // 站序按线段拓扑重建 + 写出真实走向（否则导出会与画布不一致）
        var derived = deriveCityLines(project);
        var linesData = derived[0];
        var uncoveredReport = derived[1] || [];

        var metaHeader = '/* CGo OpenMap City Pack: ' + cityId + ' (' + cityName + ') */\n' +
            '/* Generated by OpenMap Editor at ' + new Date().toISOString() + ' */\n\n';

        var notOpenData = buildNotOpenData(project);
        var stationsJs = metaHeader + formatStationsData(stationsData);
        var linesJs = metaHeader + formatLinesData(linesData);

        var legendConfig = {
            cityId: cityId,
            cityName: cityName,
            themeColor: meta.themeColor || '#00263b',
            themeColorDark: meta.themeColorDark || '#ffffff',
            linePrefix: meta.linePrefix || 'M',
            company: meta.company || '',
            pixelsPerMeter: meta.pixelsPerMeter || 25
        };
        // 城市图例文件：必须同时挂到 window 上（Issue #61 的引擎约定），
        // 否则引擎读不到 LEGEND_CONFIG，只好兜底，图例/侧栏会不完整。
        var legendJs = metaHeader + 'const LEGEND_CONFIG = ' + JSON.stringify(legendConfig, null, 2) + ';\n' +
            'window.LEGEND_CONFIG = LEGEND_CONFIG;\n';

        return {
            uncoveredReport: uncoveredReport,
            notOpenData: notOpenData,
            notOpenJs: metaHeader + "const NOT_OPEN_LINES = " + JSON.stringify(notOpenData, null, 4) + ";\n" +
                "window.NOT_OPEN_LINES = NOT_OPEN_LINES;\n",
            stationsJs: stationsJs,
            linesJs: linesJs,
            legendJs: legendJs,
            stationsData: stationsData,
            linesData: linesData,
            legendConfig: legendConfig
        };
    }

    function download(filename, data, mime) {
        var blob = (data instanceof Blob) ? data : new Blob([data], { type: mime || 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    var DEFAULT_PALETTE_LIGHT = {
        mapBg: '#ffffff',
        stationStroke: '#00263b',
        notOpenColor: '#bdcbd2',
        notOpenText: '#889096',
        textMain: '#00263b',
        staStrokeWidthCn: '2px',
        staStrokeWidthEn: '1.75px',
        panelHeaderBg: '#00263b'
    };

    var DEFAULT_PALETTE_DARK = {
        mapBg: '#1a1a1a',
        stationStroke: '#bdcbd2',
        notOpenColor: '#4e4e4e',
        notOpenText: '#78848b',
        textMain: '#e5e8ea',
        staStrokeWidthCn: '2px',
        staStrokeWidthEn: '1.75px',
        panelHeaderBg: '#373838'
    };

    function resolvePalette(themeOrPalette) {
        if (themeOrPalette && typeof themeOrPalette === 'object') {
            var base = (themeOrPalette.isDark || themeOrPalette.theme === 'dark') ? DEFAULT_PALETTE_DARK : DEFAULT_PALETTE_LIGHT;
            return Object.assign({}, base, themeOrPalette);
        }
        return (themeOrPalette === 'dark') ? Object.assign({}, DEFAULT_PALETTE_DARK) : Object.assign({}, DEFAULT_PALETTE_LIGHT);
    }

    /**
     * 将 SVG 字符串或元素内依赖的 CSS 变量固化替换为具体的 Hex/RGB 色值（印刷与外部矢量工具兼容）
     * @param {string|SVGElement} target
     * @param {string|Object} [themeOrPalette]
     * @returns {string}
     */
    function resolveCssVariables(target, themeOrPalette) {
        if (!target) return '';
        var pal = resolvePalette(themeOrPalette);
        var str = (typeof target === 'string')
            ? target
            : ((typeof XMLSerializer !== 'undefined') ? new XMLSerializer().serializeToString(target) : '');
        if (!str) return '';

        var res = str;
        res = res.replace(/var\(--map-bg(?:,\s*[^)]+)?\)/g, pal.mapBg);
        res = res.replace(/var\(--station-stroke(?:,\s*[^)]+)?\)/g, pal.stationStroke);
        res = res.replace(/var\(--not-open-color(?:,\s*[^)]+)?\)/g, pal.notOpenColor);
        res = res.replace(/var\(--not-open-text(?:,\s*[^)]+)?\)/g, pal.notOpenText);
        res = res.replace(/var\(--text-main(?:,\s*[^)]+)?\)/g, pal.textMain);
        res = res.replace(/var\(--sta-stroke-width-cn(?:,\s*[^)]+)?\)/g, pal.staStrokeWidthCn || '2px');
        res = res.replace(/var\(--sta-stroke-width-en(?:,\s*[^)]+)?\)/g, pal.staStrokeWidthEn || '1.75px');
        res = res.replace(/var\(--panel-header-bg(?:,\s*[^)]+)?\)/g, pal.panelHeaderBg || pal.stationStroke);
        // 通用兜底：var(--foo, fallback) -> fallback
        res = res.replace(/var\(--[a-zA-Z0-9_-]+,\s*([^)]+)\)/g, '$1');
        return res;
    }

    /**
     * 将 HTML 外衬与 foreignObject 转换为 100% 纯矢量 SVG 车站与站名元素
     */
    function synthesizePureVectorLayers(clone, project, options) {
        if (!clone || !project || !project.nodes) return;
        var opt = options || {};
        var pal = resolvePalette(opt.palette || opt.theme);
        var icons = window.CGoStationIcons || (typeof require !== 'undefined' ? (function () {
            try { return require('../../../core/station-icons.js'); } catch (e) { return null; }
        })() : null);

        // 收集站点经停线色
        var colorsMap = {};
        (project.lines || []).forEach(function (line) {
            if (!line || !line.color) return;
            (line.stationIds || []).forEach(function (sid) {
                if (!colorsMap[sid]) colorsMap[sid] = [];
                if (colorsMap[sid].indexOf(line.color) === -1) colorsMap[sid].push(line.color);
            });
        });
        (project.segments || []).forEach(function (seg) {
            var l = (project.lines || []).find(function (item) { return item.id === seg.lineId; });
            var col = l ? l.color : null;
            if (!col) return;
            (seg.points || []).forEach(function (p) {
                if (p && p.nid) {
                    if (!colorsMap[p.nid]) colorsMap[p.nid] = [];
                    if (colorsMap[p.nid].indexOf(col) === -1) colorsMap[p.nid].push(col);
                }
            });
        });

        var SVG_NS = 'http://www.w3.org/2000/svg';

        // 1. 替换车站层
        var stLayer = clone.querySelector('#stationLayer');
        if (stLayer) {
            // 清理原 foreignObject 底板
            var fos = stLayer.querySelectorAll('foreignObject, .cgo-map-replica-host');
            fos.forEach(function (fo) { fo.remove(); });

            var stVectorGroup = document.createElementNS(SVG_NS, 'g');
            stVectorGroup.setAttribute('id', 'vectorStationGlyphs');
            stVectorGroup.setAttribute('class', 'cgo-vector-stations');

            Object.keys(project.nodes).forEach(function (id) {
                var n = project.nodes[id];
                if (!n || n.type === 'temp') return;
                var s = Object.assign({}, n);
                s.type = n.notOpen ? 'no' : (n.type || 'dot');
                var cList = colorsMap[id] || [];
                var col = cList[0] || pal.stationStroke;
                s.lineColors = cList.length ? cList : [col];

                var dims = (icons && typeof icons.dimensionsFor === 'function')
                    ? icons.dimensionsFor(s.type)
                    : { width: 10, height: 10 };
                var iconHtml = (icons && typeof icons.iconHtmlFor === 'function')
                    ? icons.iconHtmlFor(s)
                    : '';
                if (!iconHtml) return;

                var inner = iconHtml.replace(/^<svg[^>]*>/i, '').replace(/<\/svg>$/i, '');
                inner = inner.replace(/\{\{COLOR\}\}/g, col);
                inner = resolveCssVariables(inner, pal);

                var g = document.createElementNS(SVG_NS, 'g');
                g.setAttribute('class', 'station-glyph station-' + s.type);
                g.setAttribute('data-node-id', id);
                var tx = s.x - (dims.width || 10) / 2;
                var ty = s.y - (dims.height || 10) / 2;
                g.setAttribute('transform', 'translate(' + tx.toFixed(2) + ',' + ty.toFixed(2) + ')');
                g.innerHTML = inner;
                stVectorGroup.appendChild(g);
            });
            stLayer.appendChild(stVectorGroup);
        }

        // 2. 替换站名层
        var lbLayer = clone.querySelector('#labelLayer') || stLayer;
        if (lbLayer) {
            var lbfos = lbLayer.querySelectorAll('foreignObject, .cgo-map-replica-host');
            lbfos.forEach(function (fo) { fo.remove(); });

            var lbVectorGroup = document.createElementNS(SVG_NS, 'g');
            lbVectorGroup.setAttribute('id', 'vectorStationLabels');
            lbVectorGroup.setAttribute('class', 'cgo-vector-labels');

            var calcLayout = (window.OpenMapEditor.StationLayer && window.OpenMapEditor.StationLayer.calculateLabelLayout)
                ? window.OpenMapEditor.StationLayer.calculateLabelLayout
                : function (node) {
                    var distV = 5.2, distH = 6, distD = 6;
                    var left = node.x || 0, top = node.y || 0;
                    var transform = '', textAlign = 'center';
                    switch (node.align) {
                        case 'top': top -= distV; transform = 'translate(-50%, -100%)'; break;
                        case 'bottom': top += distV; transform = 'translate(-50%, 0)'; break;
                        case 'left': left -= distH; transform = 'translate(-100%, -50%)'; textAlign = 'right'; break;
                        case 'right': left += distH; transform = 'translate(0, -50%)'; textAlign = 'left'; break;
                        case 'top-left': left -= distD; top -= distD; transform = 'translate(-100%, -100%)'; textAlign = 'right'; break;
                        case 'top-right': left += distD; top -= distD; transform = 'translate(0, -100%)'; textAlign = 'left'; break;
                        case 'bottom-left': left -= distD; top += distD; transform = 'translate(-100%, 0)'; textAlign = 'right'; break;
                        case 'bottom-right': left += distD; top += distD; transform = 'translate(0, 0)'; textAlign = 'left'; break;
                        default: top += distV; transform = 'translate(-50%, 0)';
                    }
                    if (node.offset) {
                        if (node.offset.x) left += node.offset.x;
                        if (node.offset.y) top += node.offset.y;
                    }
                    return { x: left, y: top, transform: transform, textAlign: textAlign };
                };

            Object.keys(project.nodes).forEach(function (id) {
                var s = project.nodes[id];
                if (!s || s.type === 'temp' || s.hideLabel === true) return;
                var rawCn = (s.cn || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                var rawEn = (s.en || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (!rawCn && !rawEn) return;

                var layout = calcLayout(s);
                var anchor = layout.textAlign === 'right' ? 'end' : (layout.textAlign === 'left' ? 'start' : 'middle');
                var hasCn = !!rawCn;
                var hasEn = !!rawEn;
                var totalH = (hasCn ? 13.8 : 0) + (hasEn ? 7.5 : 0);

                var baseY = layout.y;
                if (layout.transform.indexOf('-100%') !== -1) {
                    baseY = layout.y - totalH;
                } else if (layout.transform.indexOf('-50%') !== -1) {
                    baseY = layout.y - totalH / 2;
                }
                var cnBaselineY = baseY + 10.2;
                var enBaselineY = baseY + (hasCn ? 13.8 : 0) + 5.5;
                var labelColor = (s.notOpen || s.type === 'no') ? pal.notOpenText : (s.color || pal.textMain);

                var labelItem = document.createElementNS(SVG_NS, 'g');
                labelItem.setAttribute('class', 'label-group label-' + id);
                labelItem.setAttribute('data-node-id', id);

                if (hasCn) {
                    var txtCn = document.createElementNS(SVG_NS, 'text');
                    txtCn.setAttribute('x', layout.x.toFixed(2));
                    txtCn.setAttribute('y', cnBaselineY.toFixed(2));
                    txtCn.setAttribute('text-anchor', anchor);
                    txtCn.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif');
                    txtCn.setAttribute('font-size', '11.5');
                    txtCn.setAttribute('font-weight', '500');
                    txtCn.setAttribute('paint-order', 'stroke fill');
                    txtCn.setAttribute('stroke', pal.mapBg);
                    txtCn.setAttribute('stroke-width', '2.5');
                    txtCn.setAttribute('stroke-linejoin', 'round');
                    txtCn.setAttribute('stroke-linecap', 'round');
                    txtCn.setAttribute('fill', labelColor);
                    txtCn.textContent = rawCn;
                    labelItem.appendChild(txtCn);
                }

                if (hasEn) {
                    var txtEn = document.createElementNS(SVG_NS, 'text');
                    txtEn.setAttribute('x', layout.x.toFixed(2));
                    txtEn.setAttribute('y', enBaselineY.toFixed(2));
                    txtEn.setAttribute('text-anchor', anchor);
                    txtEn.setAttribute('font-family', "'Arimo', 'Arial', sans-serif");
                    txtEn.setAttribute('font-size', '6.65');
                    txtEn.setAttribute('font-weight', '500');
                    txtEn.setAttribute('paint-order', 'stroke fill');
                    txtEn.setAttribute('stroke', pal.mapBg);
                    txtEn.setAttribute('stroke-width', '2');
                    txtEn.setAttribute('stroke-linejoin', 'round');
                    txtEn.setAttribute('stroke-linecap', 'round');
                    txtEn.setAttribute('fill', labelColor);
                    txtEn.textContent = rawEn;
                    labelItem.appendChild(txtEn);
                }
                lbVectorGroup.appendChild(labelItem);
            });
            lbLayer.appendChild(lbVectorGroup);
        }
    }

    /**
     * 准备纯净的独立矢量 SVG DOM（移除 UI 辅助层、复位视口平移缩放、固化 CSS 变量、合成纯矢量车站/站名）
     */
    function prepareCleanSvgClone(svgEl, project, options) {
        if (!svgEl) return null;
        var opt = options || {};
        var pal = resolvePalette(opt.palette || opt.theme);
        var clone = svgEl.cloneNode(true);
        clone.removeAttribute('style');

        // 移除网格、底图（除非指定保留）、草稿线、手柄、框选框等编辑辅助图元
        var removeSelectors = ['#gridLayer', '#draftLayer', '#handleLayer', '#editorRubberBand', '.viewport-hud'];
        if (!opt.includeGhost) removeSelectors.push('#ghostLayer');
        removeSelectors.forEach(function (sel) {
            var el = clone.querySelector(sel);
            if (el) el.remove();
        });

        // 视口复位：移除 viewLayer 漫游缩放矩阵，回归世界坐标系原点
        var viewLayer = clone.querySelector('#viewLayer');
        if (viewLayer) {
            viewLayer.removeAttribute('transform');
        }

        var w = (project && project.canvas && project.canvas.width) || parseInt(svgEl.getAttribute('width'), 10) || 2000;
        var h = (project && project.canvas && project.canvas.height) || parseInt(svgEl.getAttribute('height'), 10) || 1500;

        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', String(w));
        clone.setAttribute('height', String(h));
        clone.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        // 如果需要背景底色（默认导出纯白底色，避免透明背景在某些查看器中变黑）
        if (opt.backgroundColor !== false) {
            var bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('width', String(w));
            bgRect.setAttribute('height', String(h));
            bgRect.setAttribute('fill', opt.backgroundColor || pal.mapBg);
            clone.insertBefore(bgRect, clone.firstChild);
        }

        // 合成纯矢量车站与站名（替换 foreignObject，确保 Illustrator/Canvas 兼容）
        if (project && project.nodes && typeof document !== 'undefined') {
            synthesizePureVectorLayers(clone, project, opt);
        }

        return { clone: clone, width: w, height: h, palette: pal };
    }

    /**
     * 构建独立的印刷级纯矢量 SVG 源码字符串（无外部样式依赖）
     */
    function compileStandalonePrintSvg(project, options) {
        var opt = options || {};
        var pal = resolvePalette(opt.palette || opt.theme);
        if (opt.svgEl) {
            var prep = prepareCleanSvgClone(opt.svgEl, project, opt);
            if (!prep) return '';
            var xml = (typeof XMLSerializer !== 'undefined') ? new XMLSerializer().serializeToString(prep.clone) : '';
            xml = resolveCssVariables(xml, pal);
            return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
        }

        var w = (project && project.canvas && project.canvas.width) || 2000;
        var h = (project && project.canvas && project.canvas.height) || 1500;
        var bg = opt.backgroundColor !== false ? (opt.backgroundColor || pal.mapBg) : 'transparent';

        var xmlParts = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">',
            bg !== 'transparent' ? '<rect width="' + w + '" height="' + h + '" fill="' + bg + '"/>' : '',
            '<g id="viewLayer">'
        ];

        // 线路折线层
        xmlParts.push('<g id="lineLayer">');
        (project.segments || []).forEach(function (seg) {
            if (!seg || !Array.isArray(seg.points) || seg.points.length < 2) return;
            var l = (project.lines || []).find(function (item) { return item.id === seg.lineId; }) || {};
            var strokeColor = l.color || '#00263b';
            var strokeWidth = l.strokeWidth || 5.4;
            var d = seg.points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x + ',' + p.y; }).join(' ');
            xmlParts.push('<path d="' + d + '" fill="none" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round"/>');
        });
        xmlParts.push('</g>');

        // 车站层
        xmlParts.push('<g id="stationLayer">');
        var icons = window.CGoStationIcons;
        Object.keys((project && project.nodes) || {}).forEach(function (id) {
            var n = project.nodes[id];
            if (!n || n.type === 'temp') return;
            var sType = n.notOpen ? 'no' : (n.type || 'dot');
            var dims = (icons && typeof icons.dimensionsFor === 'function') ? icons.dimensionsFor(sType) : { width: 10, height: 10 };
            var rawIcon = (icons && typeof icons.iconHtmlFor === 'function') ? icons.iconHtmlFor({ type: sType, lineColors: [pal.stationStroke] }) : '';
            var inner = rawIcon.replace(/^<svg[^>]*>/i, '').replace(/<\/svg>$/i, '');
            inner = resolveCssVariables(inner, pal);
            var tx = n.x - dims.width / 2;
            var ty = n.y - dims.height / 2;
            xmlParts.push('<g class="station-glyph" transform="translate(' + tx.toFixed(2) + ',' + ty.toFixed(2) + ')">' + inner + '</g>');
        });
        xmlParts.push('</g>');

        // 站名文字层
        xmlParts.push('<g id="labelLayer">');
        Object.keys((project && project.nodes) || {}).forEach(function (id) {
            var n = project.nodes[id];
            if (!n || n.type === 'temp' || n.hideLabel || (!n.cn && !n.en)) return;
            var cn = (n.cn || '').replace(/<[^>]*>/g, '').trim();
            var en = (n.en || '').replace(/<[^>]*>/g, '').trim();
            if (cn) {
                xmlParts.push('<text x="' + n.x + '" y="' + (n.y + 16) + '" text-anchor="middle" font-size="11.5" font-family="sans-serif" fill="' + pal.textMain + '" stroke="' + pal.mapBg + '" stroke-width="2" paint-order="stroke fill">' + cn + '</text>');
            }
            if (en) {
                xmlParts.push('<text x="' + n.x + '" y="' + (n.y + 24) + '" text-anchor="middle" font-size="6.65" font-family="sans-serif" fill="' + pal.textMain + '" stroke="' + pal.mapBg + '" stroke-width="1.5" paint-order="stroke fill">' + en + '</text>');
            }
        });
        xmlParts.push('</g>');

        xmlParts.push('</g>'); // viewLayer
        xmlParts.push('</svg>');
        return resolveCssVariables(xmlParts.join('\n'), pal);
    }

    function exportSvgElement(svgEl, filename, project, options) {
        if (!svgEl) return;
        var prep = prepareCleanSvgClone(svgEl, project, options);
        if (!prep) return;
        var xml = new XMLSerializer().serializeToString(prep.clone);
        xml = resolveCssVariables(xml, prep.palette);
        var src = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
        download(filename || 'openmap-canvas.svg', src, 'image/svg+xml;charset=utf-8');
    }

    /**
     * 将 SVG 矢量地图高清光栅化并导出为 PNG 位图（支持 1x, 2x, 4x, 8x 超采样并防内存溢出）
     * @param {SVGElement} svgEl
     * @param {string} filename
     * @param {Object} project
     * @param {Object} [options] { scale: 2, backgroundColor: '#ffffff', includeGhost: false }
     */
    function exportPngElement(svgEl, filename, project, options) {
        var opt = options || {};
        if (!svgEl) {
            if (typeof opt.onError === 'function') opt.onError(new Error('SVG 元素不存在'));
            return;
        }
        var rawScale = Number(opt.scale) || 2; // 默认 2x (Retina)；支持 4x (300DPI 印刷)、8x (大幅海报)
        var prep = prepareCleanSvgClone(svgEl, project, opt);
        if (!prep) {
            if (typeof opt.onError === 'function') opt.onError(new Error('SVG 准备失败'));
            return;
        }

        // 安全限制保护：防止 Canvas 超出浏览器最大纹理尺寸 (16384px) 或导致 OOM 崩溃
        var MAX_CANVAS_SIDE = 16384;
        var targetW = Math.round(prep.width * rawScale);
        var targetH = Math.round(prep.height * rawScale);
        var scale = rawScale;
        if (targetW > MAX_CANVAS_SIDE || targetH > MAX_CANVAS_SIDE) {
            var clampRatio = Math.min(MAX_CANVAS_SIDE / targetW, MAX_CANVAS_SIDE / targetH);
            scale = rawScale * clampRatio;
            targetW = Math.round(prep.width * scale);
            targetH = Math.round(prep.height * scale);
            console.warn('[BundleExporter] Canvas 尺寸超出安全极限 ' + MAX_CANVAS_SIDE + 'px，已智能约束缩放比至 ' + scale.toFixed(2));
        }

        var xml = new XMLSerializer().serializeToString(prep.clone);
        xml = resolveCssVariables(xml, prep.palette);
        var blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(blob);

        var img = new Image();
        img.onload = function () {
            URL.revokeObjectURL(url);
            var canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;

            var ctx = canvas.getContext('2d');
            if (ctx) {
                try {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, targetW, targetH);
                    canvas.toBlob(function (pngBlob) {
                        if (pngBlob) {
                            download(filename || 'openmap-export.png', pngBlob, 'image/png');
                            if (typeof opt.onSuccess === 'function') opt.onSuccess(pngBlob);
                        } else if (typeof opt.onError === 'function') {
                            opt.onError(new Error('PNG 编码返回空结果'));
                        }
                    }, 'image/png');
                } catch (err) {
                    console.error('[BundleExporter] Canvas 光栅化异常:', err);
                    if (typeof opt.onError === 'function') opt.onError(err);
                }
            } else if (typeof opt.onError === 'function') {
                opt.onError(new Error('无法创建 2D Canvas 上下文'));
            }
        };
        img.onerror = function (err) {
            URL.revokeObjectURL(url);
            console.error('[BundleExporter] SVG 转换为图片失败');
            if (typeof opt.onError === 'function') opt.onError(err || new Error('SVG 转换为图片失败'));
        };
        img.src = url;
    }

    return {
        validateData: validateData,
        buildZipBytes: buildZipBytes,
        download: download,
        resolvePalette: resolvePalette,
        resolveCssVariables: resolveCssVariables,
        synthesizePureVectorLayers: synthesizePureVectorLayers,
        compileStandalonePrintSvg: compileStandalonePrintSvg,
        prepareCleanSvgClone: prepareCleanSvgClone,
        exportSvgElement: exportSvgElement,
        exportPngElement: exportPngElement,
        formatStationValue: formatStationValue,
        formatStationsData: formatStationsData,
        formatLineValue: function (line) {
            var io = getCityProjectIO();
            return io ? io.formatEntryValue(line, { multiline: true, quoteKeys: false }) : JSON.stringify(line);
        },
        formatLinesData: formatLinesData,
        formatCityPackage: formatCityPackage
    };
})();

// 保留全局别名兼容
window.BundleExporter = window.OpenMapEditor.BundleExporter;
window.DrunkCodeGen = window.OpenMapEditor.BundleExporter;
