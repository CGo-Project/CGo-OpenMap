/**
 * 开放地图编辑器 (OpenMap Editor) - 车站样式目录 (editor/js/core/station-style-catalog.js)
 *
 * 「车站长什么样」并不只由 type 决定：上海 / 悉尼 / 香港 / 深圳等城市把官方图实测的图元写在
 * marker / mk / halo 这些逐站字段里，type 只是兜底。只改 type 就会出现：
 *   · 改了类型画面不变（marker 优先）；
 *   · 为了让画面变，把 marker 换成标准图元后，原来的官方几何就丢了、再也选不回来；
 *   · 同台换乘（合并胶囊）/ 出站换乘（每线一枚）这类区别，用 type 根本表达不了。
 *
 * 所以样式在这里被当成「外观字段的整体快照」来处理——选择一个样式 = 一次性写入
 * { type, marker, mk, halo …} 这一组字段（值为 undefined 表示删除）。可选项对所有城市一视同仁，共四组：
 *   1. 恢复载入时的样式：从载入城市时的原始快照取回（任何改动都可逆）；
 *   2. 为本站生成：城市钩子 getStationStyleOptions 按经过本站的线路现场计算（如上海的合并胶囊 / 每线一枚）；
 *   3. 本城市现有样式：从当前工程全部车站里自动提取、按形态归类（打开任何人做的城市都能拿到全部画法）；
 *   4. 通用图元：core/station-icons.js 支持的全部类型，任何城市都可选。
 *
 * 本文件是纯函数（不碰 DOM），检视面板的类型选择器与零件盒共用，selfcheck.js 在 Node 下直接测试。
 */

(function (root, factory) {
    var api = factory();
    root.OpenMapEditor = root.OpenMapEditor || {};
    root.OpenMapEditor.StationStyleCatalog = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    /** 决定车站图元外观的字段（城市可用 APPEARANCE_FIELDS 追加自己的私有字段） */
    var BASE_FIELDS = ['type', 'marker', 'mk', 'halo'];

    /** 通用图元目录：core/station-icons.js 的全部类型 */
    var GENERIC_TYPES = [
        { id: 'dot', name: '普通站', desc: '单线停靠站' },
        { id: 'tsf', name: '换乘站', desc: '多线换乘站' },
        { id: 'tsfo', name: '换乘站 · 单环', desc: '按首条线路色描环' },
        { id: 'tsf_pill_h', name: '换乘胶囊 · 水平', desc: '两站台左右并列' },
        { id: 'tsf_pill_v', name: '换乘胶囊 · 垂直', desc: '两站台上下并列' },
        { id: 'tsf_pill_d45', name: '换乘胶囊 · 45°', desc: '沿右上斜向并列' },
        { id: 'tsf_pill_d135', name: '换乘胶囊 · 135°', desc: '沿左上斜向并列' },
        { id: 'tsf_dumbbell', name: '哑铃连杆', desc: '站外通道换乘' },
        { id: 'rdot', name: '国铁车站', desc: '铁路客运站' },
        { id: 'no', name: '暂缓开通', desc: '在建 / 未开通车站' }
    ];

    var TYPE_NAMES = {};
    GENERIC_TYPES.forEach(function (t) { TYPE_NAMES[t.id] = t.name; });
    TYPE_NAMES.terminus = '终点站';
    TYPE_NAMES.scenery = '景区站';
    TYPE_NAMES.railcity = '城际铁路站';

    function fieldsFor(city) {
        var extra = (city && Array.isArray(city.APPEARANCE_FIELDS)) ? city.APPEARANCE_FIELDS : [];
        return BASE_FIELDS.concat(extra.filter(function (f) { return BASE_FIELDS.indexOf(f) === -1; }));
    }

    function typeOf(node) {
        return (node && node.notOpen) ? 'no' : ((node && node.type) || 'dot');
    }

    function clone(v) {
        return (v === undefined) ? undefined : JSON.parse(JSON.stringify(v));
    }

    /** 车站当前的外观快照 { type, marker, … }（缺省字段为 undefined） */
    function appearanceOf(node, fields) {
        var out = {};
        (fields || BASE_FIELDS).forEach(function (f) {
            out[f] = (f === 'type') ? typeOf(node) : clone(node ? node[f] : undefined);
        });
        return out;
    }

    /** 把外观补丁套到车站上（返回新对象，不改原对象）；值为 undefined / null 表示删除该字段 */
    function applyPatch(node, patch) {
        var out = Object.assign({}, node);
        Object.keys(patch || {}).forEach(function (k) {
            var v = patch[k];
            if (v === undefined || v === null) delete out[k];
            else out[k] = clone(v);
        });
        if (patch && patch.type !== undefined) out.notOpen = (patch.type === 'no');
        return out;
    }

    /** 两个车站外观是否一致 */
    function sameAppearance(a, b, fields) {
        return JSON.stringify(appearanceOf(a, fields)) === JSON.stringify(appearanceOf(b, fields));
    }

    /**
     * 外观「形态签名」：用于把全城车站按画法归类。
     * 颜色抹掉（同一画法不同线路色算一类），数字按 4 取整（实测几何的细微差异不拆类），
     * 路径字符串里的数字同样取整。
     */
    function signatureOf(node, fields) {
        var ap = appearanceOf(node, fields);
        var norm = function (v) {
            if (typeof v === 'number') return Math.round(v / 4) * 4;
            if (typeof v === 'string') {
                if (/^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/i.test(v) || /^var\(/.test(v)) return 'C';
                return v.replace(/-?\d+(\.\d+)?/g, function (m) { return String(Math.round(parseFloat(m) / 4) * 4); });
            }
            if (Array.isArray(v)) return v.map(norm);
            if (v && typeof v === 'object') {
                var o = {};
                Object.keys(v).sort().forEach(function (k) {
                    // 线路色、偏移量、朝向角、路径细节不参与归类：同一种画法挂在不同线路、不同方位仍是同一类
                    if (k === 'c' || k === 'color' || k === 'dx' || k === 'dy' || k === 'angle' || k === 'ang' || k === 'd' || k === 'p' || k === 'o') return;
                    o[k] = norm(v[k]);
                });
                return o;
            }
            return v;
        };
        return JSON.stringify(norm(ap));
    }

    /** 外观的人话描述（用于「本城市现有样式」的标题） */
    function describe(node, fields) {
        var ap = appearanceOf(node, fields);
        var name = TYPE_NAMES[ap.type] || ap.type;
        var parts = (ap.marker && Array.isArray(ap.marker.parts)) ? ap.marker.parts
            : (ap.mk && Array.isArray(ap.mk.p)) ? ap.mk.p
            : (ap.mk && Array.isArray(ap.mk.bars)) ? ap.mk.bars : null;
        var bits = [];
        if (parts && parts.length) {
            var shapes = {};
            parts.forEach(function (p) {
                var s = p.shape || p.t || 'part';
                shapes[s] = (shapes[s] || 0) + 1;
            });
            var SHAPE = { tick: '短横', capsule: '胶囊', circle: '圆', tsf: '同心环', metro: 'M 徽标', end: '终点', stop: '圆环', part: '图元' };
            bits.push(Object.keys(shapes).map(function (s) {
                return (SHAPE[s] || s) + (shapes[s] > 1 ? ' ×' + shapes[s] : '');
            }).join(' + '));
            var long = parts.filter(function (p) { return p.long && p.short && p.long > p.short * 1.4; }).length;
            if (long) bits.push('拉长');
        }
        if (ap.halo || (ap.marker && ap.marker.halo)) bits.push('灰色底衬');
        return { name: name, detail: bits.join(' · ') };
    }

    /**
     * 从整个工程提取本城市的全部画法。
     * @returns {Array<{ key, name, detail, count, sampleId, sampleName, patch }>} 按使用数量降序
     */
    function harvest(project, fields) {
        var groups = {};
        var nodes = (project && project.nodes) || {};
        Object.keys(nodes).forEach(function (id) {
            var n = nodes[id];
            if (!n || n.type === 'temp') return;
            var sig = signatureOf(n, fields);
            if (!groups[sig]) groups[sig] = { key: 'h:' + sig, count: 0, sampleId: id, sample: n };
            groups[sig].count++;
        });
        return Object.keys(groups).map(function (sig) {
            var g = groups[sig];
            var d = describe(g.sample, fields);
            var ap = appearanceOf(g.sample, fields);
            return {
                key: g.key,
                name: d.name,
                detail: d.detail,
                count: g.count,
                sampleId: g.sampleId,
                sampleName: String(g.sample.cn || g.sampleId).replace(/<[^>]*>/g, ''),
                patch: ap
            };
        }).sort(function (a, b) { return b.count - a.count; });
    }

    /** 通用图元：去掉城市逐站外观字段，交给类型本身决定画法 */
    function genericOptions(fields) {
        var f = fields || BASE_FIELDS;
        return GENERIC_TYPES.map(function (t) {
            var patch = {};
            f.forEach(function (k) { patch[k] = undefined; });
            patch.type = t.id;
            return { key: 'g:' + t.id, name: t.name, detail: t.desc + ' · ' + t.id, patch: patch };
        });
    }

    /**
     * 组装某座车站的全部可选样式。
     * @param {Object} ctx { node, project, origin, city, cityOptions }
     *   origin      载入时的原始车站（可空）
     *   cityOptions 城市钩子 getStationStyleOptions 的返回值（可空）
     * @returns {Array<{ group, title, items: [{ key, name, detail, count?, patch, current }] }>}
     */
    function optionsFor(ctx) {
        var c = ctx || {};
        var node = c.node;
        var fields = fieldsFor(c.city);
        var groups = [];
        var seen = {};
        var mark = function (item) {
            item.current = sameAppearance(applyPatch(node, item.patch), node, fields);
            return item;
        };
        var push = function (group, title, items) {
            var list = items.filter(function (it) {
                var k = JSON.stringify(appearanceOf(applyPatch(node, it.patch), fields));
                if (seen[k]) return false;
                seen[k] = true;
                return true;
            }).map(mark);
            if (list.length) groups.push({ group: group, title: title, items: list });
        };

        // 0. 当前样式（总是第一项，便于对照）
        push('current', '当前样式', [{
            key: 'current', name: describe(node, fields).name,
            detail: describe(node, fields).detail || '本站现在的画法', patch: appearanceOf(node, fields)
        }]);

        // 1. 恢复载入时的样式
        if (c.origin && !sameAppearance(c.origin, node, fields)) {
            var od = describe(c.origin, fields);
            push('original', '恢复', [{
                key: 'original', name: '恢复载入时的样式',
                detail: od.name + (od.detail ? ' · ' + od.detail : ''), patch: appearanceOf(c.origin, fields)
            }]);
        }

        // 2. 为本站生成（城市按经过本站的线路现场计算）
        if (Array.isArray(c.cityOptions) && c.cityOptions.length) {
            push('generated', '为本站生成', c.cityOptions.map(function (o, i) {
                return { key: 'c:' + (o.key || i), name: o.name, detail: o.desc || '', patch: o.patch || {} };
            }));
        }

        // 3. 本城市现有样式
        push('harvest', '本城市现有样式', harvest(c.project, fields).map(function (h) {
            return {
                key: h.key, name: h.name, detail: (h.detail ? h.detail + ' · ' : '') + '例：' + h.sampleName,
                count: h.count, patch: h.patch
            };
        }));

        // 4. 通用图元
        push('generic', '通用图元', genericOptions(fields));
        return groups;
    }

    return {
        BASE_FIELDS: BASE_FIELDS,
        GENERIC_TYPES: GENERIC_TYPES,
        TYPE_NAMES: TYPE_NAMES,
        fieldsFor: fieldsFor,
        typeOf: typeOf,
        appearanceOf: appearanceOf,
        applyPatch: applyPatch,
        sameAppearance: sameAppearance,
        signatureOf: signatureOf,
        describe: describe,
        harvest: harvest,
        genericOptions: genericOptions,
        optionsFor: optionsFor
    };
});
