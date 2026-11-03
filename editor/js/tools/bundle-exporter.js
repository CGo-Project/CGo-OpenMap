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

        var linesData = project.lines || [];

        var metaHeader = '/* CGo OpenMap City Pack: ' + cityId + ' (' + cityName + ') */\n' +
            '/* Generated by OpenMap Editor at ' + new Date().toISOString() + ' */\n\n';

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
        var legendJs = metaHeader + 'const LEGEND_CONFIG = ' + JSON.stringify(legendConfig, null, 2) + ';\n';

        return {
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

    /**
     * 准备纯净的独立矢量 SVG DOM（移除 UI 辅助层、复位视口平移缩放、设置 viewBox）
     */
    function prepareCleanSvgClone(svgEl, project, options) {
        if (!svgEl) return null;
        var opt = options || {};
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
            bgRect.setAttribute('fill', opt.backgroundColor || '#ffffff');
            clone.insertBefore(bgRect, clone.firstChild);
        }

        return { clone: clone, width: w, height: h };
    }

    function exportSvgElement(svgEl, filename, project, options) {
        if (!svgEl) return;
        var prep = prepareCleanSvgClone(svgEl, project, options);
        if (!prep) return;
        var xml = new XMLSerializer().serializeToString(prep.clone);
        var src = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
        download(filename || 'openmap-canvas.svg', src, 'image/svg+xml;charset=utf-8');
    }

    /**
     * 将 SVG 矢量地图高清光栅化并导出为 PNG 位图
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
        var scale = Number(opt.scale) || 2; // 默认 2x 超采样 (Retina / 300DPI 级别清晰度)
        var prep = prepareCleanSvgClone(svgEl, project, opt);
        if (!prep) {
            if (typeof opt.onError === 'function') opt.onError(new Error('SVG 准备失败'));
            return;
        }

        var xml = new XMLSerializer().serializeToString(prep.clone);
        var blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(blob);

        var img = new Image();
        img.onload = function () {
            URL.revokeObjectURL(url);
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(prep.width * scale);
            canvas.height = Math.round(prep.height * scale);

            var ctx = canvas.getContext('2d');
            if (ctx) {
                try {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
