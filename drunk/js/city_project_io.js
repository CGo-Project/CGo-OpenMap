/**
 * CGo OpenMap - Drunk 城市工程读写层 (drunk/js/city_project_io.js)
 *
 * ==============================================================================
 * 模块作用与架构定位 (Architecture Overview)
 * ==============================================================================
 * 本模块让 Drunk 工作台可以把 `city/{city_id}/` 下的**已有城市**原样读进来编辑，
 * 编辑完再原样写回去，从而使 Drunk 成为 OpenMap 任意城市线路图的「编辑模式」。
 *
 * 核心设计原则 —— 外科手术式回写 (Surgical Patch)：
 * 1. 读入时保留 `data_stations.js` / `data_lines.js` 的**原始源码文本**；
 * 2. 导出时只替换「用户实际改动过的那几条」条目的字面量文本，未改动的条目
 *    保持逐字节原样（注释、缩进、字段顺序、手写换行全部不动）；
 * 3. 因此像悉尼 `marker.parts` / `halo` / `labelSize`、北京 `textScale` /
 *    `hideLabel` 这类引擎私有或城市私有字段，**绝不会在往返中被抹掉**。
 *
 * 这一点是本模块存在的唯一理由：常规「解析成对象再整体重新序列化」的做法会
 * 静默丢弃所有未被识别的字段，对已经逐像素校准过的城市是灾难性的。
 *
 * ==============================================================================
 * 对外 API
 * ==============================================================================
 * - listCities()                     读取 CITY_REGISTRY 中已注册的城市列表
 * - loadCity(cityId)                 拉取并解析某城市的全套数据文件（含源码原文）
 * - patchEntries(text, name, ops)    对 `const X = {...}` / `[...]` 做条目级回写
 * - formatEntryValue(obj, opts)      按原条目的书写风格序列化一条数据
 * - downloadText(filename, text)     浏览器端另存为文件
 * ==============================================================================
 */

window.CityProjectIO = (function () {
    'use strict';

    /**
     * 城市数据文件清单。顺序与 main.html 的加载链保持一致。
     * required 为 false 的文件缺失时静默跳过（部分城市没有在建线/装饰层）。
     */
    const DATA_FILES = [
        { file: 'data_stations.js', global: 'stationsData', required: true },
        { file: 'data_lines.js', global: 'linesData', required: true },
        { file: 'data_legend.js', global: 'LEGEND_CONFIG', required: false },
        { file: 'data_notopen.js', global: 'NOT_OPEN_LINES', required: false },
        { file: 'data_scattered.js', global: 'SCATTERED_DATA', required: false }
    ];

    // ==========================================================================
    // 一、城市注册表访问
    // ==========================================================================

    function listCities() {
        if (window.CityDataManager && typeof window.CityDataManager.getAllCities === 'function') {
            try {
                const list = window.CityDataManager.getAllCities();
                if (Array.isArray(list) && list.length) return list;
            } catch (err) { /* 落到下面的兜底分支 */ }
        }
        if (window.CITY_REGISTRY) return Object.values(window.CITY_REGISTRY);
        return [];
    }

    function findCity(cityId) {
        return listCities().find(c => c && c.id === cityId) || null;
    }

    /**
     * 城市注册表里的 folder 形如 "./city/beijing"，是相对**站点根目录**的路径；
     * Drunk 工作台自身位于 /drunk/ 子目录，故需要回退一级。
     */
    function resolveFolder(folder, cityId) {
        const raw = folder || `./city/${cityId}`;
        return raw.replace(/^\.\//, '../').replace(/\/+$/, '');
    }

    // ==========================================================================
    // 二、数据文件求值（隔离作用域，避免全局 const 重复声明）
    // ==========================================================================

    /**
     * 城市数据文件是经典脚本，顶层 `const stationsData = {...}` 会占用全局词法名，
     * 直接 <script> 注入时「换一个城市再加载」必然抛 redeclaration。
     * 这里放进 Function 作用域里求值，既可反复加载，也不污染工作台自身的全局环境。
     */
    function evalDataFile(source, globalName) {
        const body = `${source}\n;return (typeof ${globalName} !== "undefined") ? ${globalName} : null;`;
        // eslint-disable-next-line no-new-func
        return new Function(body)();
    }

    /**
     * 按**实际失败原因**给出可执行的提示。
     *
     * 这里必须分情况：以前不论什么原因都笼统归咎于 `file://`，
     * 结果服务器没起、路径写错、文件缺失时全都提示「请通过本地静态服务器访问」，
     * 而用户明明已经在用 http://127.0.0.1 —— 提示把人往错误方向引。
     */
    function describeLoadFailure(base, file, reason) {
        const target = `${base}/${file}`;

        if (typeof location !== 'undefined' && location.protocol === 'file:') {
            return `无法读取 ${target}：当前以 file:// 协议打开，浏览器禁止本地文件 fetch。\n` +
                `请在项目根目录启动静态服务（如 python3 -m http.server 8777），再访问 http://127.0.0.1:8777/drunk/。`;
        }

        if (reason && reason.kind === 'http') {
            if (reason.status === 404) {
                return `无法读取 ${target}：服务器返回 404，文件不存在。\n` +
                    `请确认该城市目录下确有此文件，且 city/data.js 里登记的 folder 路径正确。`;
            }
            return `无法读取 ${target}：服务器返回 ${reason.status} ${reason.statusText || ''}`.trim() + '。';
        }

        const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '当前站点';
        return `无法读取 ${target}：请求未能送达（${(reason && reason.message) || '网络错误'}）。\n` +
            `多半是 ${origin} 的静态服务器已经停了——请重新启动后刷新页面。`;
    }

    /**
     * 拉取某城市的全套数据文件。
     * 返回 { id, name, meta, base, sources: {文件名: 源码}, data: {全局名: 值} }
     */
    async function loadCity(cityId) {
        const meta = findCity(cityId);
        if (!meta) throw new Error(`城市 "${cityId}" 未在 city/data.js 的 CITY_REGISTRY 中注册。`);

        const base = resolveFolder(meta.folder, cityId);
        const project = {
            id: meta.id,
            name: meta.name || meta.id,
            meta,
            base,
            sources: {},
            data: {},
            missing: []
        };

        for (const entry of DATA_FILES) {
            const url = `${base}/${entry.file}?_drunk=${Date.now()}`;
            let text = null;
            let reason = null;
            try {
                const res = await fetch(url, { cache: 'no-store' });
                if (res.ok) text = await res.text();
                else reason = { kind: 'http', status: res.status, statusText: res.statusText };
            } catch (err) {
                reason = { kind: 'network', message: err.message };
            }

            if (text == null) {
                if (entry.required) throw new Error(describeLoadFailure(base, entry.file, reason));
                project.missing.push(entry.file);
                continue;
            }

            project.sources[entry.file] = text;
            try {
                project.data[entry.global] = evalDataFile(text, entry.global);
            } catch (err) {
                if (entry.required) throw new Error(`${entry.file} 解析失败：${err.message}`);
                project.missing.push(entry.file);
            }
        }

        if (!project.data.stationsData || !project.data.linesData) {
            throw new Error(`${cityId} 的 data_stations.js / data_lines.js 未导出预期的 stationsData / linesData。`);
        }

        return project;
    }

    // ==========================================================================
    // 二点五、OpenMap 线路数据模型访问器
    // ==========================================================================
    //
    // 线路的站序有两种写法（见 PORTING.md）：
    //   · 普通线路：stationIds + distances
    //   · 分支线路：hasbranch: true，配 stationIds-way1 / -way2…（及 distances-wayN）
    // 折线点阵同理：pathPoints，或 pathPoints-main / -branch1 / -branch2…
    //
    // 北京 S2/S6/JX、上海 SH5/SH10/SH11、悉尼 T1/T2/T4/T8 都是分支线路；
    // 合肥全网则只有 stationIds 而没有 distances。凡是遍历线路的代码都必须
    // 走这里的访问器，否则一碰到这些城市就会 `undefined.length` 崩掉。

    /** 线路的全部站序分组，统一成 [{ idsKey, distKey, ids, distances }] */
    function lineStationGroups(line) {
        const groups = [];
        if (!line || typeof line !== 'object') return groups;
        if (Array.isArray(line.stationIds)) {
            groups.push({
                idsKey: 'stationIds', distKey: 'distances',
                ids: line.stationIds, distances: line.distances
            });
        }
        Object.keys(line).forEach(key => {
            const m = /^stationIds-(.+)$/.exec(key);
            if (!m || !Array.isArray(line[key])) return;
            const distKey = `distances-${m[1]}`;
            groups.push({ idsKey: key, distKey, ids: line[key], distances: line[distKey] });
        });
        return groups;
    }

    /**
     * 线路的全部折线点阵（主线 + 各分支），统一成 [{ key, points }]。
     * points 是对原数组的**引用**，编辑模式下拖折点即直接改它。
     * 带上 key 是为了让调用方知道该往 line 的哪个字段写回（pathPoints /
     * pathPoints-main / pathPoints-branch1 …）。
     */
    function linePathGroups(line) {
        const out = [];
        if (!line || typeof line !== 'object') return out;
        if (Array.isArray(line.pathPoints) && line.pathPoints.length >= 2) {
            out.push({ key: 'pathPoints', points: line.pathPoints });
        }
        Object.keys(line).forEach(key => {
            if (/^pathPoints-/.test(key) && Array.isArray(line[key]) && line[key].length >= 2) {
                out.push({ key, points: line[key] });
            }
        });
        return out;
    }

    /** 线路涉及的全部车站 ID（跨分支去重，保持首次出现顺序） */
    function lineAllStationIds(line) {
        const seen = new Set();
        lineStationGroups(line).forEach(g => g.ids.forEach(id => seen.add(id)));
        return Array.from(seen);
    }

    // ==========================================================================
    // 三、源码扫描器：定位 `const X = {...}` 中每一条条目的字面量区间
    // ==========================================================================

    const WS = /\s/;
    const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

    function skipString(text, i) {
        const quote = text[i];
        i++;
        while (i < text.length) {
            const ch = text[i];
            if (ch === '\\') { i += 2; continue; }
            if (ch === quote) return i + 1;
            i++;
        }
        return i;
    }

    /** 跳过注释；若当前位置不是注释则返回 -1 */
    function skipComment(text, i) {
        if (text[i] !== '/') return -1;
        if (text[i + 1] === '/') {
            const n = text.indexOf('\n', i);
            return n < 0 ? text.length : n;
        }
        if (text[i + 1] === '*') {
            const n = text.indexOf('*/', i + 2);
            return n < 0 ? text.length : n + 2;
        }
        return -1;
    }

    /**
     * 从 i 开始吃掉一个完整的值字面量，返回其结束下标（不含尾随空白与逗号）。
     */
    function skipValue(text, i) {
        let depth = 0;
        let lastNonWs = i;
        while (i < text.length) {
            const ch = text[i];
            const cmt = skipComment(text, i);
            if (cmt >= 0) { i = cmt; continue; }
            if (ch === '"' || ch === "'" || ch === '`') { i = skipString(text, i); lastNonWs = i; continue; }
            if (ch === '{' || ch === '[' || ch === '(') { depth++; i++; lastNonWs = i; continue; }
            if (ch === '}' || ch === ']' || ch === ')') {
                if (depth === 0) return lastNonWs;
                depth--; i++; lastNonWs = i; continue;
            }
            if (ch === ',' && depth === 0) return lastNonWs;
            i++;
            if (!WS.test(ch)) lastNonWs = i;
        }
        return lastNonWs;
    }

    /**
     * 扫描一个对象/数组容器，返回每条条目的 key 与值区间。
     * @param {string} text 源码
     * @param {number} openIdx 容器起始 '{' 或 '[' 的下标
     */
    function scanContainer(text, openIdx) {
        const open = text[openIdx];
        const isObject = open === '{';
        const close = isObject ? '}' : ']';
        const entries = [];
        let i = openIdx + 1;
        let expectKey = isObject;
        let keyText = null;
        let entryStart = -1;

        while (i < text.length) {
            const ch = text[i];
            if (WS.test(ch)) { i++; continue; }
            const cmt = skipComment(text, i);
            if (cmt >= 0) { i = cmt; continue; }
            if (ch === close) return { entries, closeIdx: i };
            if (ch === ',') { i++; expectKey = isObject; continue; }

            if (expectKey) {
                entryStart = i;
                if (ch === '"' || ch === "'") {
                    const end = skipString(text, i);
                    keyText = text.slice(i + 1, end - 1);
                    i = end;
                } else {
                    let j = i;
                    while (j < text.length && /[A-Za-z0-9_$]/.test(text[j])) j++;
                    keyText = text.slice(i, j);
                    i = j;
                }
                while (i < text.length && text[i] !== ':') i++;
                i++;
                expectKey = false;
                continue;
            }

            if (!isObject) entryStart = i;
            const valueStart = i;
            const valueEnd = skipValue(text, i);
            entries.push({
                key: keyText,
                index: entries.length,
                entryStart,
                valueStart,
                valueEnd,
                raw: text.slice(valueStart, valueEnd)
            });
            i = valueEnd;
            keyText = null;
            expectKey = isObject;
        }

        return { entries, closeIdx: -1 };
    }

    /**
     * 定位 `const X = {` / `let X = [` / `window.X = {` 的容器起始下标。
     */
    function findDeclaration(text, name) {
        const re = new RegExp(`(?:^|[^\\w$.])(?:const|let|var)\\s+${name}\\s*=|window\\s*\\.\\s*${name}\\s*=`, 'm');
        const m = re.exec(text);
        if (!m) return -1;
        let i = m.index + m[0].length;
        while (i < text.length) {
            const ch = text[i];
            if (WS.test(ch)) { i++; continue; }
            const cmt = skipComment(text, i);
            if (cmt >= 0) { i = cmt; continue; }
            if (ch === '{' || ch === '[') return i;
            return -1;
        }
        return -1;
    }

    // ==========================================================================
    // 四、条目序列化：沿用原条目的书写风格
    // ==========================================================================

    function fmtKey(key, quoteKeys) {
        if (quoteKeys) return JSON.stringify(key);
        return IDENT.test(key) ? key : JSON.stringify(key);
    }

    /** 单行内联序列化（用于展开风格里的嵌套小对象，如 offset: { x: 0, y: 0 }） */
    function fmtInline(value, quoteKeys) {
        if (value === null || typeof value !== 'object') return JSON.stringify(value);
        if (Array.isArray(value)) return `[${value.map(v => fmtInline(v, quoteKeys)).join(', ')}]`;
        const keys = Object.keys(value).filter(k => value[k] !== undefined);
        if (!keys.length) return '{}';
        return `{ ${keys.map(k => `${fmtKey(k, quoteKeys)}: ${fmtInline(value[k], quoteKeys)}`).join(', ')} }`;
    }

    /**
     * 探测一条原始条目的书写风格。
     * - 悉尼：`{"type":"dot","x":797.64,...}` → 紧凑 + 引号键
     * - 沈阳：多行展开 + 裸键
     */
    function detectStyle(rawText, entryIndentFallback) {
        const multiline = /\n/.test(rawText || '');
        const quoteKeys = /^\{\s*"/.test((rawText || '').trim());
        let indent = entryIndentFallback != null ? entryIndentFallback : '    ';
        return { multiline, quoteKeys, indent };
    }

    /** 取 text 中 idx 所在行的前导空白，作为条目缩进 */
    function indentAt(text, idx) {
        const lineStart = text.lastIndexOf('\n', idx - 1) + 1;
        const prefix = text.slice(lineStart, idx);
        return /^\s*$/.test(prefix) ? prefix : '    ';
    }

    /**
     * 把一条数据对象序列化为源码字面量。
     * 以 `_` 开头的键被视为 Drunk 运行期私有字段，不会写入文件。
     */
    function formatEntryValue(obj, opts) {
        const { multiline, quoteKeys, indent } = opts || {};
        const keys = Object.keys(obj).filter(k => !k.startsWith('_') && obj[k] !== undefined);
        if (!keys.length) return '{}';

        if (!multiline) {
            // 紧凑风格：与 JSON.stringify 完全一致，便于与逐像素提取的产物对齐
            const out = {};
            keys.forEach(k => { out[k] = obj[k]; });
            return JSON.stringify(out);
        }

        const inner = (indent || '    ') + '    ';
        const body = keys
            .map(k => `${inner}${fmtKey(k, quoteKeys)}: ${fmtInline(obj[k], quoteKeys)}`)
            .join(',\n');
        return `{\n${body}\n${indent || '    '}}`;
    }

    // ==========================================================================
    // 四点五、递归最小编辑集
    // ==========================================================================

    /**
     * 递归比对「原值 / 新值」，对源码中位于 openIdx 的容器产出**最小编辑集**。
     *
     * 只有真正变了的那个叶子会被重写，未变的子树连同其原始换行与缩进逐字节保留。
     * 例如把某条线路的 color 改一个值，diff 里就只有 `color: "..."` 一行，
     * 而不会把该线路几百个 pathPoints 折点重新排版一遍。
     *
     * @returns {boolean} 能否用最小编辑集表达；false 表示结构变动过大，
     *                    调用方应回退为整体重写该容器。
     */
    function diffContainerEdits(text, openIdx, oldVal, newVal, edits) {
        const open = text[openIdx];
        if (open !== '{' && open !== '[') return false;
        const isArray = open === '[';
        if (Array.isArray(oldVal) !== isArray || Array.isArray(newVal) !== isArray) return false;

        const { entries, closeIdx } = scanContainer(text, openIdx);
        if (closeIdx < 0) return false;

        const oldKeys = isArray ? oldVal.map((_, i) => String(i)) : Object.keys(oldVal);
        const newKeys = isArray
            ? newVal.map((_, i) => String(i))
            : Object.keys(newVal).filter(k => !k.startsWith('_') && newVal[k] !== undefined);

        // 键集合或数组长度有变化 → 无法做条目级最小编辑，交回调用方整体重写
        if (oldKeys.length !== newKeys.length) return false;
        for (let i = 0; i < oldKeys.length; i++) {
            if (oldKeys[i] !== newKeys[i]) return false;
        }
        if (entries.length !== oldKeys.length) return false;

        for (const entry of entries) {
            const key = isArray ? String(entry.index) : entry.key;
            const ov = isArray ? oldVal[entry.index] : oldVal[key];
            const nv = isArray ? newVal[entry.index] : newVal[key];
            if (JSON.stringify(ov) === JSON.stringify(nv)) continue;   // 子树未变，原样保留

            const inner = text[entry.valueStart];
            if ((inner === '{' || inner === '[') &&
                ov && nv && typeof ov === 'object' && typeof nv === 'object' &&
                diffContainerEdits(text, entry.valueStart, ov, nv, edits)) {
                continue;                                              // 递归成功，更精细
            }

            const style = detectStyle(entry.raw, indentAt(text, entry.entryStart));
            const rendered = (nv && typeof nv === 'object')
                ? (Array.isArray(nv)
                    ? (style.multiline ? formatArrayValue(nv, style) : JSON.stringify(nv))
                    : formatEntryValue(nv, style))
                : JSON.stringify(nv);
            edits.push({ start: entry.valueStart, end: entry.valueEnd, text: rendered });
        }
        return true;
    }

    /** 多行风格下的数组序列化：每个元素占一行，贴合仓库里 pathPoints 的书写习惯 */
    function formatArrayValue(arr, opts) {
        if (!arr.length) return '[]';
        const indent = opts.indent || '    ';
        const inner = indent + '    ';
        return `[\n${arr.map(v => inner + fmtInline(v, opts.quoteKeys)).join(',\n')}\n${indent}]`;
    }

    // ==========================================================================
    // 五、外科手术式回写
    // ==========================================================================

    /**
     * 对源码中的 `const name = {...}` / `[...]` 执行条目级替换 / 追加 / 删除。
     *
     * @param {string} text   原始源码
     * @param {string} name   容器变量名（stationsData / linesData ...）
     * @param {object} ops
     *        - update: { key: 对象 }        按键替换（数组容器用下标字符串）
     *        - remove: [key]                删除条目
     *        - append: [{ key, value }]     追加到容器末尾
     * @returns {string} 改写后的源码
     */
    function patchEntries(text, name, ops) {
        const openIdx = findDeclaration(text, name);
        if (openIdx < 0) throw new Error(`源码中未找到 ${name} 的声明，无法安全回写。`);

        const { entries, closeIdx } = scanContainer(text, openIdx);
        if (closeIdx < 0) throw new Error(`${name} 的字面量未正确闭合，已中止回写以免破坏源文件。`);

        const update = ops.update || {};
        const remove = new Set(ops.remove || []);
        const append = ops.append || [];

        const byKey = new Map();
        entries.forEach(e => byKey.set(String(e.key != null ? e.key : e.index), e));

        // 参考风格：取第一条既有条目
        const sample = entries.length ? entries[0] : null;
        const sampleStyle = sample
            ? detectStyle(sample.raw, indentAt(text, sample.entryStart))
            : { multiline: false, quoteKeys: true, indent: '    ' };

        /** 自后向前施加编辑，避免下标漂移 */
        const edits = [];

        Object.keys(update).forEach(key => {
            const entry = byKey.get(String(key));
            if (!entry) return;

            // 优先走递归最小编辑：只重写真正变了的那个叶子，其余逐字节保留。
            // 只有当条目里增删了键（结构变动）时才回退为整条重写。
            let original = null;
            try {
                // eslint-disable-next-line no-new-func
                original = new Function(`return (${entry.raw});`)();
            } catch (err) { original = null; }

            if (original && typeof original === 'object') {
                const nested = [];
                if (diffContainerEdits(text, entry.valueStart, original, update[key], nested)) {
                    nested.forEach(e => edits.push(e));
                    return;
                }
            }

            const style = detectStyle(entry.raw, indentAt(text, entry.entryStart));
            edits.push({
                start: entry.valueStart,
                end: entry.valueEnd,
                text: formatEntryValue(update[key], style)
            });
        });

        remove.forEach(key => {
            const entry = byKey.get(String(key));
            if (!entry) return;
            // 连同尾随逗号与该行的前导空白一起删掉，避免留下空行与孤立逗号
            let start = entry.entryStart;
            const lineStart = text.lastIndexOf('\n', start - 1) + 1;
            if (/^\s*$/.test(text.slice(lineStart, start))) start = lineStart;
            let end = entry.valueEnd;
            while (end < text.length && WS.test(text[end]) && text[end] !== '\n') end++;
            if (text[end] === ',') end++;
            while (end < text.length && text[end] !== '\n' && WS.test(text[end])) end++;
            if (text[end] === '\n') end++;
            edits.push({ start, end, text: '' });
        });

        let result = text;
        edits.sort((a, b) => b.start - a.start);
        edits.forEach(e => {
            result = result.slice(0, e.start) + e.text + result.slice(e.end);
        });

        if (append.length) {
            // 追加需要在施加上面的编辑之后重新定位闭合括号
            const freshOpen = findDeclaration(result, name);
            const fresh = scanContainer(result, freshOpen);
            const at = fresh.closeIdx;
            if (at < 0) throw new Error(`${name} 追加条目时定位闭合括号失败。`);

            const last = fresh.entries.length ? fresh.entries[fresh.entries.length - 1] : null;
            const style = last ? detectStyle(last.raw, indentAt(result, last.entryStart)) : sampleStyle;
            const indent = style.indent || '    ';

            const pieces = append.map(item => {
                const value = formatEntryValue(item.value, style);
                const keyPart = item.key != null ? `${fmtKey(String(item.key), style.quoteKeys)}: ` : '';
                return `${indent}${keyPart}${value}`;
            });

            // 末条与闭合括号之间的原文可能是 ",\n"、"\n" 或带注释，需原样保留其非逗号部分，
            // 同时由我们统一补写分隔逗号——否则原本带尾随逗号的文件会在拼接时把逗号吞掉。
            const anchor = last ? last.valueEnd : freshOpen + 1;
            const between = result.slice(anchor, at);
            const hadTrailingComma = /^\s*,/.test(between);
            const rest = hadTrailingComma ? between.replace(/^\s*,/, '') : between;

            result = result.slice(0, anchor)
                + (last ? ',\n' : '\n')
                + pieces.join(',\n')
                + (hadTrailingComma ? ',' : '')
                + (rest.length ? rest : '\n')
                + result.slice(at);
        }

        return result;
    }

    // ==========================================================================
    // 六、浏览器端另存为
    // ==========================================================================

    function downloadText(filename, text) {
        const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    return {
        listCities,
        findCity,
        loadCity,
        resolveFolder,
        // 线路数据模型访问器（分支线路安全）
        lineStationGroups,
        linePathGroups,
        lineAllStationIds,
        // 源码级工具（同时供单元自检使用）
        findDeclaration,
        scanContainer,
        formatEntryValue,
        patchEntries,
        describeLoadFailure,
        downloadText
    };
})();
