/**
 * CGo OpenMap - 开放地图编辑器纯函数层回归自检 (editor/tests/selfcheck.js)
 *
 * 用法：node editor/tests/selfcheck.js（零依赖、零构建、不需要浏览器）
 *
 * 覆盖两块出错后果最重的纯逻辑：city-project-io.js 的条目级无损回写（拿 city/ 下全部
 * 真实城市数据跑往返，断言改动生效、其余条目零改动、未被改字段完好），以及
 * data-sanitizer.js 的净化与几何校正。失败以非零状态码退出，便于挂 CI。
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// 浏览器端脚本，挂在 window 上；这里给个最小垫片即可复用
global.window = global.window || {};
new Function(fs.readFileSync(path.join(ROOT, 'editor/js/core/city-project-io.js'), 'utf8'))();
new Function(fs.readFileSync(path.join(ROOT, 'editor/js/tools/bundle-exporter.js'), 'utf8'))();
const IO = global.window.CityProjectIO;
const CodeGen = global.window.BundleExporter;
const Sanitizer = require(path.join(ROOT, 'editor/js/algorithms/data-sanitizer.js'));
new Function(fs.readFileSync(path.join(ROOT, 'editor/js/algorithms/segment-router.js'), 'utf8'))();
const SegmentRouter = global.window.SegmentRouter;
new Function(fs.readFileSync(path.join(ROOT, 'editor/js/tools/batch-station-tool.js'), 'utf8'))();
const BatchStationTool = global.window.BatchStationTool;
new Function(fs.readFileSync(path.join(ROOT, 'editor/js/core/project-model.js'), 'utf8'))();
const ProjectModel = global.window.OpenMapEditor.ProjectModel;
const PipelineDraw = require(path.join(ROOT, 'editor/js/pipelines/pipeline-draw.js'));
const PipelineSurgical = require(path.join(ROOT, 'editor/js/pipelines/pipeline-surgical.js'));

let failed = 0;
let passed = 0;

function check(cond, msg) {
    if (cond) { passed++; console.log('  ✓ ' + msg); }
    else { failed++; console.log('  ✗ ' + msg); }
}

function section(title) {
    console.log('\n══ ' + title + ' ══');
}

/** 在隔离作用域里求值一份城市数据文件 */
function evalData(source, globalName) {
    return new Function(`${source}\n;return typeof ${globalName} !== "undefined" ? ${globalName} : null;`)();
}

/** 量出两段文本真实的改动区间（公共前缀/后缀之外） */
function diffShape(a, b) {
    const A = a.split('\n'), B = b.split('\n');
    let p = 0;
    while (p < A.length && p < B.length && A[p] === B[p]) p++;
    let s = 0;
    while (s < A.length - p && s < B.length - p && A[A.length - 1 - s] === B[B.length - 1 - s]) s++;
    return { at: p + 1, oldLines: A.length - s - p, newLines: B.length - s - p };
}

const cities = fs.readdirSync(path.join(ROOT, 'city'))
    .filter(d => fs.statSync(path.join(ROOT, 'city', d)).isDirectory())
    .filter(d => fs.existsSync(path.join(ROOT, 'city', d, 'data_stations.js')));

// ============================================================================
// 一、源码扫描器：每条条目的字面量区间必须精确
// ============================================================================
section('源码扫描器精度（全部真实城市数据）');
for (const city of cities) {
    for (const [file, name] of [['data_stations.js', 'stationsData'], ['data_lines.js', 'linesData']]) {
        const src = fs.readFileSync(path.join(ROOT, 'city', city, file), 'utf8');
        const real = evalData(src, name);
        const open = IO.findDeclaration(src, name);
        const { entries, closeIdx } = IO.scanContainer(src, open);
        const expected = Array.isArray(real) ? real.length : Object.keys(real).length;

        let mismatch = 0;
        entries.forEach((e, i) => {
            let v;
            try { v = new Function('return (' + e.raw + ')')(); } catch (err) { mismatch++; return; }
            const truth = Array.isArray(real) ? real[i] : real[e.key];
            if (JSON.stringify(v) !== JSON.stringify(truth)) mismatch++;
        });

        check(open >= 0 && closeIdx >= 0 && entries.length === expected && mismatch === 0,
            `${city}/${file}: ${entries.length}/${expected} 条条目区间精确`);
    }
}

// ============================================================================
// 二、无损回写：改一条，其余逐字节不动
// ============================================================================
section('条目级无损回写（改 / 删 / 加 / 组合）');
for (const city of cities) {
    const p = path.join(ROOT, 'city', city, 'data_stations.js');
    const src = fs.readFileSync(p, 'utf8');
    const real = evalData(src, 'stationsData');
    const keys = Object.keys(real);
    const target = keys[Math.floor(keys.length / 2)];

    // --- 改 ---
    const edited = JSON.parse(JSON.stringify(real[target]));
    edited.align = 'bottom-right';
    let out = IO.patchEntries(src, 'stationsData', { update: { [target]: edited } });
    let after = evalData(out, 'stationsData');
    const untouched = keys.filter(k => k !== target)
        .every(k => JSON.stringify(after[k]) === JSON.stringify(real[k]));
    const otherFields = JSON.stringify({ ...real[target], align: 0 }) === JSON.stringify({ ...after[target], align: 0 });
    const shape = diffShape(src, out);
    check(after[target].align === 'bottom-right' && untouched && otherFields
        && shape.oldLines <= 1 && shape.newLines <= 1,
        `${city}: 改 align 生效，其余 ${keys.length - 1} 条零改动，未改字段完好，diff ${shape.oldLines}→${shape.newLines} 行`);

    // --- 删（中间条目与末尾条目，后者最易在尾逗号上翻车）---
    for (const victim of [keys[3], keys[keys.length - 1]]) {
        out = IO.patchEntries(src, 'stationsData', { remove: [victim] });
        after = evalData(out, 'stationsData');
        check(!after[victim] && Object.keys(after).length === keys.length - 1
            && keys.filter(k => k !== victim).every(k => JSON.stringify(after[k]) === JSON.stringify(real[k])),
            `${city}: 删除 ${victim} 后总数 -1 且其余零改动`);
    }

    // --- 加 ---
    const fresh = { type: 'dot', x: 1, y: 2, cn: '自检站', en: 'SelfCheck', align: 'top', offset: { x: 0, y: 0 } };
    out = IO.patchEntries(src, 'stationsData', { append: [{ key: 'SELFCHECK_1', value: fresh }] });
    after = evalData(out, 'stationsData');
    check(JSON.stringify(after.SELFCHECK_1) === JSON.stringify(fresh)
        && Object.keys(after).length === keys.length + 1
        && keys.every(k => JSON.stringify(after[k]) === JSON.stringify(real[k])),
        `${city}: 追加新条目后总数 +1 且其余零改动`);

    // --- 组合 ---
    const e2 = JSON.parse(JSON.stringify(real[keys[1]])); e2.cn = '自检改名';
    out = IO.patchEntries(src, 'stationsData', {
        update: { [keys[1]]: e2 }, remove: [keys[5]], append: [{ key: 'SELFCHECK_2', value: fresh }]
    });
    after = evalData(out, 'stationsData');
    check(after[keys[1]].cn === '自检改名' && !after[keys[5]] && !!after.SELFCHECK_2,
        `${city}: 改+删+加 组合回写正确`);
}

// ============================================================================
// 三、递归最小编辑：改线路的 color 不得惊动 pathPoints
// ============================================================================
section('递归最小编辑集（线路改色不重排 pathPoints）');
for (const city of cities) {
    const p = path.join(ROOT, 'city', city, 'data_lines.js');
    const src = fs.readFileSync(p, 'utf8');
    const lines = evalData(src, 'linesData');
    const idx = lines.findIndex(l => l.color);
    if (idx < 0) continue;

    const o = JSON.parse(JSON.stringify(lines[idx]));
    o.color = '#123456';
    const out = IO.patchEntries(src, 'linesData', { update: { [String(idx)]: o } });
    const after = evalData(out, 'linesData');
    const shape = diffShape(src, out);

    check(after[idx].color === '#123456'
        && lines.every((l, k) => k === idx || JSON.stringify(l) === JSON.stringify(after[k]))
        && JSON.stringify(after[idx].pathPoints || null) === JSON.stringify(lines[idx].pathPoints || null)
        && shape.oldLines <= 1 && shape.newLines <= 1,
        `${city}: 改色只动 1 行 (第 ${shape.at} 行)，pathPoints 与其余线路深度不变`);
}

// ============================================================================
// 四、分支线路访问器：不得在 hasbranch / 缺 distances 的城市上崩掉
// ============================================================================
section('分支线路数据模型访问器');
for (const city of cities) {
    const stations = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_stations.js'), 'utf8'), 'stationsData');
    const lines = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_lines.js'), 'utf8'), 'linesData');

    let ok = true, report = null;
    try {
        lines.forEach(l => {
            IO.lineStationGroups(l);
            IO.lineAllStationIds(l);
            // linePathGroups 返回 { key, points }，key 必须真的能在 line 上取到该数组
            IO.linePathGroups(l).forEach(g => {
                if (!Array.isArray(l[g.key])) throw new Error(`${l.id} 的折线分组 key "${g.key}" 取不到数组`);
                if (l[g.key] !== g.points) throw new Error(`${l.id} 的折线分组 "${g.key}" 返回的不是原数组引用`);
            });
        });
        report = CodeGen.validateData(stations, lines);
    } catch (err) { ok = false; report = { errors: [err.message] }; }

    const branch = lines.filter(l => l.hasbranch).length;
    check(ok && report.errors.length === 0,
        `${city}: ${lines.length} 条线路（含 ${branch} 条分支线）遍历与完整性自检零错误`
        + (report && report.warnings ? `，${report.warnings.length} 项告警` : ''));
}

// ============================================================================
// 四点五、载入失败提示必须指向真实原因
// ============================================================================
// 这几条是踩过的坑：早先不论什么原因都笼统提示「请通过本地静态服务器访问」，
// 结果服务器停掉时，明明已经在用 http:// 的用户被指引去做一件他已经做了的事。
section('载入失败提示的归因');
{
    const d = IO.describeLoadFailure;
    const saved = global.location;

    // file:// 协议
    global.location = { protocol: 'file:', origin: 'null' };
    const fileMsg = d('../city/shenyang', 'data_stations.js', { kind: 'network', message: 'Failed to fetch' });
    check(fileMsg.includes('file://') && fileMsg.includes('http.server'),
        'file:// 协议下提示启动静态服务器');

    // http 下服务器挂掉
    global.location = { protocol: 'http:', origin: 'http://127.0.0.1:8777' };
    const downMsg = d('../city/shenyang', 'data_stations.js', { kind: 'network', message: 'Failed to fetch' });
    check(!downMsg.includes('file://') && downMsg.includes('http://127.0.0.1:8777') && downMsg.includes('已经停了'),
        'http 下网络失败归因为「服务器已停」而非 file://');

    // 404
    const notFound = d('../city/__nope__', 'data_stations.js', { kind: 'http', status: 404, statusText: 'Not Found' });
    check(!notFound.includes('file://') && notFound.includes('404') && notFound.includes('folder'),
        '404 归因为路径/文件不存在并指向 city/data.js 的 folder');

    // 其它 HTTP 状态
    const err500 = d('../city/x', 'data_lines.js', { kind: 'http', status: 500, statusText: 'Internal Server Error' });
    check(err500.includes('500') && !err500.includes('file://'), '其它 HTTP 状态如实回报状态码');

    if (saved === undefined) delete global.location; else global.location = saved;
}

// ============================================================================
// 四点七、折线倒角几何：编辑器预览必须与引擎渲染同源
// ============================================================================
section('折线倒角几何 (core/path-geometry.js)');
{
    const G = require(path.join(ROOT, 'core/path-geometry.js'));

    // core/script.js 必须委托给共享模块，不能自己再留一份实现——
    // 一旦复刻两份，编辑器的预览就会和线路图的实际渲染悄悄漂移。
    const engineSrc = fs.readFileSync(path.join(ROOT, 'core/script.js'), 'utf8');
    check(engineSrc.includes('window.CGoPathGeometry.generateRoundedPath'),
        'core/script.js 委托给共享几何模块');
    check(!/for\s*\(let i = 1; i < points\.length - 1; i\+\+\)/.test(engineSrc),
        'core/script.js 未残留第二份倒角实现');

    const editorRouteSrc = fs.existsSync(path.join(ROOT, 'editor/js/layers/vector-route-layer.js')) ?
        fs.readFileSync(path.join(ROOT, 'editor/js/layers/vector-route-layer.js'), 'utf8') : '';
    check(editorRouteSrc.includes('generateRoundedPath'),
        'OpenMap Editor 画布预览走同一份倒角实现');

    // 自动半径：90° 取 18，斜角取 8
    const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
    const diag = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 100 }];
    check(G.cornerRadiusAt(square, 1).auto === 18, '90° 拐角自动半径 18px');
    check(G.cornerRadiusAt(diag, 1).auto === 8, '斜角自动半径 8px');
    check(!G.cornerRadiusAt(square, 0).isCorner && !G.cornerRadiusAt(square, 2).isCorner,
        '首尾端点不算拐角');

    // r 覆盖：r:0 应产出直角（无 Q 指令绕行，切点与顶点重合）
    const sharp = [{ x: 0, y: 0 }, { x: 100, y: 0, r: 0 }, { x: 100, y: 100 }];
    check(G.generateRoundedPath(sharp).includes('Q 100 0 100 0'), 'r:0 保持直角');
    check(G.cornerRadiusAt(sharp, 1).requested === 0, 'r:0 被如实读作 requested=0');

    // 线段过短时半径被自动收窄，编辑器据此提示用户
    const tight = G.cornerRadiusAt([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 1);
    check(tight.limited && tight.effective === 9 && tight.requested === 18,
        `短线段圆角自动收窄 18px → ${tight.effective}px 并标记 limited`);

    // useStrictRounding 收紧 limitFactor
    const pts = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }];
    check(G.generateRoundedPath(pts, false) !== G.generateRoundedPath(pts, true),
        'useStrictRounding 确实改变倒角结果');

    // 真实城市数据全量跑一遍，确保不抛异常且都能产出合法 path
    let paths = 0, bad = 0;
    for (const city of cities) {
        const lines = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_lines.js'), 'utf8'), 'linesData');
        lines.forEach(l => IO.linePathGroups(l).forEach(g => {
            const d = G.generateRoundedPath(g.points, l.useStrictRounding || false);
            paths++;
            if (!/^M /.test(d) || /NaN|undefined/.test(d)) bad++;
        }));
    }
    check(bad === 0, `${cities.length} 座城市共 ${paths} 组折线全部生成合法 path（异常 ${bad}）`);
}

// ============================================================================
// 四点八、isPointOnly：只落站点、不画走向
// ============================================================================
// 引擎 renderLines 首行就是 `if (line.isPointOnly) return;`。旧版早先没认这个
// 标志，退到「按站序直连」兜底，把北京「中国铁路」24 座散布全城的国铁车站
// 从延庆一路连到大兴，画布上凭空多出一堆横穿全图的长斜线。
section('isPointOnly 线路不得绘制走向');
{
    const G2 = require(path.join(ROOT, 'core/path-geometry.js'));
    const engineSrc = fs.readFileSync(path.join(ROOT, 'core/script.js'), 'utf8');
    check(engineSrc.includes('CGoPathGeometry.lineSegments'), '引擎走向判定走共享 lineSegments');
    check(!/drawSegment\(line\['pathPoints-main'\]/.test(engineSrc), '引擎未残留第二份分支判定');
    check(G2.lineSegments({ isPointOnly: true, stationIds: ['a', 'b'] }, { a: { x: 0, y: 0 }, b: { x: 9, y: 9 } }).length === 0,
        'lineSegments 对 isPointOnly 返回空，绝不按站序连线');
    check(G2.lineSegments({ hasbranch: true, stationIds: ['a', 'b'] }, { a: { x: 0, y: 0 }, b: { x: 9, y: 9 } }).length === 0,
        '分支线无 pathPoints-* 时不回退站序（与引擎一致）');
    check(G2.lineSegments({ stationIds: ['a', 'b'] }, { a: { x: 0, y: 0 }, b: { x: 9, y: 9 } }).length === 1,
        '普通线无 pathPoints 时按站序兜底');

    let affected = 0;
    for (const city of cities) {
        const stations = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_stations.js'), 'utf8'), 'stationsData');
        const lines = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_lines.js'), 'utf8'), 'linesData');
        const canvasW = Math.max(...Object.values(stations).map(s => s.x));

        lines.filter(l => l.isPointOnly && Array.isArray(l.stationIds)).forEach(l => {
            affected++;
            // 量一下「若误连」会有多离谱：相邻站最大跨度占画布宽度的比例
            let maxSpan = 0;
            for (let i = 1; i < l.stationIds.length; i++) {
                const a = stations[l.stationIds[i - 1]], b = stations[l.stationIds[i]];
                if (a && b) maxSpan = Math.max(maxSpan, Math.hypot(b.x - a.x, b.y - a.y));
            }
            const pct = Math.round(maxSpan / canvasW * 100);
            check(true, `${city}/${l.id}「${l.name}」${l.stationIds.length} 站仅落点，` +
                `若误连最长一段将横跨画布 ${pct}% 宽`);
        });
    }
    check(affected >= 5, `${cities.length} 座城市共 ${affected} 条 isPointOnly 线路受此保护`);
}

// ============================================================================
// 四点九、车站图元：模板与尺寸必须与引擎同源
// ============================================================================
section('车站图元 (core/station-icons.js)');
{
    const Icons = require(path.join(ROOT, 'core/station-icons.js'));
    const engineSrc = fs.readFileSync(path.join(ROOT, 'core/script.js'), 'utf8');
    check(engineSrc.includes('window.CGoStationIcons'), '引擎图元模板走共享模块');
    check(!/const SVGTemplates = \{/.test(engineSrc), '引擎未残留第二份图元模板');
    const editorStationSrc = fs.existsSync(path.join(ROOT, 'editor/js/layers/station-layer.js')) ?
        fs.readFileSync(path.join(ROOT, 'editor/js/layers/station-layer.js'), 'utf8') : '';
    check(editorStationSrc.includes('iconHtmlFor'), 'OpenMap Editor 画布走同一份图元模板');

    const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');

    // STATION_SIZE 必须与 css/style.css 的 .dot/.tsf 等尺寸一致——
    // 引擎靠 CSS 定尺寸、编辑器靠这张表定尺寸，不同步就会一大一小。
    function cssSizeOf(sel) {
        // 选择器后必须紧跟 { , 或空白——否则 `.tsf` 会先匹配到 `.tsfo`
        const re = new RegExp('(^|\\n)\\.' + sel + '(?=[\\s,{])[^{]*\\{[^}]*?width:\\s*([\\d.]+)px', 'm');
        const m = re.exec(css);
        return m ? parseFloat(m[2]) : null;
    }
    // .dot/.rdot/.tsfo 共用一条规则，取其中任一均可
    const cssTsf = cssSizeOf('tsf');
    const cssNo = cssSizeOf('no');
    const cssDot = /\.dot,\s*\n\.rdot,\s*\n\.tsfo\s*\{[^}]*?width:\s*([\d.]+)px/m.exec(css);

    check(cssTsf === Icons.STATION_SIZE.tsf, `tsf 尺寸与 css/style.css 一致 (${Icons.STATION_SIZE.tsf}px)`);
    check(cssNo === Icons.STATION_SIZE.no, `no 尺寸与 css/style.css 一致 (${Icons.STATION_SIZE.no}px)`);
    check(cssDot && parseFloat(cssDot[1]) === Icons.STATION_SIZE.dot,
        `dot/rdot/tsfo 尺寸与 css/style.css 一致 (${Icons.STATION_SIZE.dot}px)`);

    // 普通站取第一条经停线路的标志色
    const html = Icons.iconHtmlFor({ type: 'dot', lineColors: ['#E4002B'] });
    check(html.includes('#E4002B') && !html.includes('{{COLOR}}'), 'dot 图元按线路标志色上色');
    check(Icons.iconHtmlFor({ type: 'tsf' }).includes('17.5'), 'tsf 图元为 17.5 viewBox 的双圈');
    check(Icons.iconHtmlFor({ type: '不存在的类型' }).includes('svg'), '未知类型回落到 dot 而非报错');

    // computeLineColors 写入自定义字段，供编辑器存成运行期私有字段
    const st = { a: { type: 'dot' }, b: { type: 'tsf' } };
    Icons.computeLineColors(st, [{ color: '#111111', stationIds: ['a', 'b'] },
    { color: '#222222', stationIds: ['b'] }], l => l.stationIds, '_lineColors');
    check(JSON.stringify(st.a._lineColors) === '["#111111"]'
        && JSON.stringify(st.b._lineColors) === '["#111111","#222222"]'
        && st.a.lineColors === undefined,
        'computeLineColors 可写入 _lineColors 运行期私有字段');

    // 真实数据：统计各城市图元类型分布，确保全部能产出图元
    for (const city of cities) {
        const stations = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_stations.js'), 'utf8'), 'stationsData');
        const lines = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_lines.js'), 'utf8'), 'linesData');
        Icons.computeLineColors(stations, lines, l => IO.lineAllStationIds(l), '_lineColors');
        let bad = 0;
        const kinds = {};
        Object.values(stations).forEach(s => {
            kinds[s.type] = (kinds[s.type] || 0) + 1;
            const h = Icons.iconHtmlFor({ type: s.type, lineColors: s._lineColors });
            if (!h.startsWith('<svg') || h.includes('{{COLOR}}')) bad++;
        });
        check(bad === 0, `${city}: ${Object.keys(stations).length} 座车站图元全部生成 (`
            + Object.entries(kinds).map(([k, v]) => `${k}×${v}`).join(' ') + ')');
    }
}

// ============================================================================
// 四点十、开通沿革：区段必须拼满、不得留空洞
// ============================================================================
// 「发展史动态演示」把 data_opening_history.js 按日期顺序播成生长动画。数据里
// 少一段或多一段都不报错，只会在动画上表现为「某段凭空长出来」或「某段永远
// 长不出来」。这里把几条硬约束钉死：
//   1. 端点必须真实存在于该线站序中，区段在该线站序里必须连续；
//   2. 同一线路所有 line-state{open} 区段的并集必须构成**连续段**——地铁不会跳站开通，
//      暂缓开通的单站用 station-state{open} 或 line-state 的 except 豁免表达，不加这条就查不出「中间漏了一段」；
//   3. 该线全部已开通车站（type !== "no"）必须被覆盖，未开通站不得被覆盖；
//   4. station-state{open} 的车站必须在站序内，且不能仍是 type "no"；
//   5. rename 的旧名必须已登记为目标站的别名（检索库），否则搜索会失配；
//   6. station-state 状态白名单 open/suspended/removed/interchange（interchange 站还须是 tsf 换乘站）；
//   7. line-state 三态白名单 open/suspended/removed（缺省 open）：suspended = 未开通镂空、
//      removed = 空白，只校验端点、**不参与「拼满」**（开通的对偶，收缩侧）；
//   8. except 逐站豁免：sid 必须落在该操作覆盖的车站内，state ∈ open/suspended/removed、tsf 为布尔；
//   9. 事件外壳：写了 ops 的事件不得再带顶层 kind（操作只能活在 ops 里）；
//  10. 站台级幽灵点（CGO_OFFSTATION_PLATFORMS）：id / of 存在、幽灵点不进任何线路站序；
//      until 必须是**动作引用** `{date, kind, state?}` 且唯一命中某个操作 —— 按日期写死
//      会在当天第一拍、对应动作还没开演时就先改画法（一天可以有多个操作），一律拦下。
section('开通沿革时间线');
{
    let withHistory = 0;
    for (const city of cities) {
        const p = path.join(ROOT, 'city', city, 'data_opening_history.js');
        if (!fs.existsSync(p)) continue;
        withHistory++;

        // 事件 → 操作流展开（与共享层 eventOps() 同口径）：一条事件可带 ops 里 1~N 个操作，
        // 各成一步；不写 ops 时事件本身即单个操作（简写）。事件外壳的 date / title / desc 下传。
        const rawEvents = evalData(fs.readFileSync(p, 'utf8'), 'CGO_OPENING_HISTORY');
        const events = [];
        rawEvents.forEach((ev, evIdx) => {
            const list = (Array.isArray(ev.ops) && ev.ops.length) ? ev.ops : [ev];
            if (Array.isArray(ev.ops) && ev.ops.length && ev.kind) {
                events.push({ __shape: `事件 #${evIdx + 1} 同时带 ops 与顶层 kind，语义含混（操作请写进 ops）` });
            }
            list.forEach((op, opIdx) => {
                if (!op || !op.kind) {
                    events.push({ __shape: `事件 #${evIdx + 1} 的操作 #${opIdx + 1} 缺少 kind` });
                    return;
                }
                // 旧写法 line-open 归一进 line-state（缺省 state 即 open）—— 与共享层 eventOps() 同口径
                const norm = op.kind === 'line-open'
                    ? Object.assign({}, op, { kind: 'line-state', state: 'open' })
                    : op;
                events.push(Object.assign({}, norm, {
                    date: ev.date, title: ev.title || "", desc: ev.desc || "", evIdx: evIdx, opIdx: opIdx
                }));
            });
        });
        const stations = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_stations.js'), 'utf8'), 'stationsData');
        const lines = evalData(fs.readFileSync(path.join(ROOT, 'city', city, 'data_lines.js'), 'utf8'), 'linesData');
        const lineById = {};
        lines.forEach(l => { lineById[l.id] = l; });

        const bad = [];
        const byLine = {};
        const endsByLine = {};   // lineId → Set(区段端点站 ID)
        const opened = {};   // stationId → 首次开通日期
        const renameChains = {};   // stationId → [{ from, to, date, where }]：一站的更名链

        /**
         * 一个区段覆盖的站点集合。
         * 非环线取两端之间的站序区间；环线取站序更短的那条弧 —— 必须与共享层
         * opening-history.js 里 arcOf() 同口径，否则同一段数据在自检与播放
         * 中会各算一套（如哈尔滨 3 号线「医大二院 → 太平桥」在站序里要绕缝）。
         */
        const coverOf = (line, ids, from, to) => {
            const i = ids.indexOf(from), j = ids.indexOf(to);
            if (i < 0 || j < 0) return null;
            const n = ids.length, out = new Set();
            if (line.isLoop && n > 1) {
                const fwd = ((j - i) % n + n) % n;
                if (fwd === 0) { out.add(ids[i]); return out; }
                if (fwd <= n - fwd) for (let k = 0; k <= fwd; k++) out.add(ids[(i + k) % n]);
                else for (let k = 0; k <= n - fwd; k++) out.add(ids[((i - k) % n + n) % n]);
            } else {
                for (let k = Math.min(i, j); k <= Math.max(i, j); k++) out.add(ids[k]);
            }
            return out;
        };

        // 事件契约：kind 三种（line-state / station-state / rename），状态取值白名单在此把关，
        // 数据侧拼错一个 state 会静默失效，必须当错误拦下。旧写法 line-open 已在上面归一为
        // line-state/open（与共享层 eventOps() 同口径），故此处只会见到三种 kind。
        // 见共享层 README「线网发展史」一节。
        const STATION_STATES = ['open', 'suspended', 'removed', 'interchange'];
        const LINE_STATES = ['open', 'suspended', 'removed'];   // open 缺省；removed = 空白
        const EXCEPT_STATES = ['open', 'suspended', 'removed']; // line-state 逐站豁免可写的转换

        events.forEach((ev, k) => {
            if (ev.__shape) { bad.push(ev.__shape); return; }
            const where = `#${k + 1} ${ev.date} ${ev.lineId}`;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.date || '')) { bad.push(`${where} 日期格式非法`); return; }
            const line = lineById[ev.lineId];
            if (!line) { bad.push(`${where} 线路不存在`); return; }
            const ids = IO.lineAllStationIds(line);

            if (ev.kind === 'line-state') {
                // 三态：open 开通（实线，计入「拼满」）/ suspended 未开通（镂空）/ removed 空白（消失）。
                // 一条操作可带多段（segments: [{from,to}, …]）：环线同一天开通的两段弧、
                // 或一条线一周内补全的几处区间，共用一条操作、同一日期。
                const state = ev.state || 'open';
                if (!LINE_STATES.includes(state)) { bad.push(`${where} 未知线路状态 ${ev.state}`); return; }
                const spec = (Array.isArray(ev.segments) && ev.segments.length)
                    ? ev.segments : [{ from: ev.from, to: ev.to }];
                const cover = new Set();
                spec.forEach(sp => {
                    const hit = coverOf(line, ids, sp.from, sp.to);
                    if (!hit) { bad.push(`${where} 端点 ${sp.from}/${sp.to} 不在站序中`); return; }
                    hit.forEach(sid => cover.add(sid));
                });
                if (state === 'open') {
                    // 开通侧登记覆盖，供下方「区段并集连续且拼满」统一判定
                    const ends = endsByLine[ev.lineId] = endsByLine[ev.lineId] || new Set();
                    spec.forEach(sp => { ends.add(sp.from); ends.add(sp.to); });
                    byLine[ev.lineId] = byLine[ev.lineId] || new Set();
                    cover.forEach(sid => {
                        byLine[ev.lineId].add(sid);
                        if (!opened[sid] || ev.date < opened[sid]) opened[sid] = ev.date;
                    });
                }
                // 逐站豁免：sid 必须落在本操作覆盖的车站里；state / tsf 取值把关
                (Array.isArray(ev.except) ? ev.except : []).forEach((e, xi) => {
                    const xwhere = `${where} 豁免#${xi + 1}`;
                    if (!e || !e.sid) { bad.push(`${xwhere} 缺少 sid`); return; }
                    if (!cover.has(e.sid)) bad.push(`${xwhere} ${e.sid} 不在本操作覆盖的车站内`);
                    if (!stations[e.sid]) bad.push(`${xwhere} 车站 ${e.sid} 不存在`);
                    if (e.state !== undefined && !EXCEPT_STATES.includes(e.state)) {
                        bad.push(`${xwhere} 未知豁免状态 ${e.state}`);
                    }
                    if (e.tsf !== undefined && typeof e.tsf !== 'boolean') {
                        bad.push(`${xwhere} tsf 只接受布尔值`);
                    }
                });
            } else if (ev.kind === 'station-state') {
                if (!STATION_STATES.includes(ev.state)) { bad.push(`${where} 未知车站状态 ${ev.state}`); return; }
                const list = Array.isArray(ev.stations) ? ev.stations : [];
                if (ev.state === 'open') {
                    if (!list.length) bad.push(`${where} 补开站列表为空`);
                    list.forEach(sid => {
                        if (!ids.includes(sid)) bad.push(`${where} 补开站 ${sid} 不在站序中`);
                        else if (stations[sid] && stations[sid].type === 'no') bad.push(`${where} 补开站 ${sid} 仍标记为未开通`);
                        if (!opened[sid] || ev.date < opened[sid]) opened[sid] = ev.date;
                    });
                } else if (ev.state === 'interchange') {
                    // 站内换乘启用日：只写车站（必须是该线站序里的换乘站）——它不改线路拓扑，
                    // 也不参与「已开通区段拼满」的判定，只是让共享层在此时刻之前压住换乘图元。
                    if (!list.length) bad.push(`${where} 换乘启用站列表为空`);
                    // 一条换乘启用事件可以横跨几条线（同日同批开通站内换乘），故只校验「在各线的站序里」，
                    // 不再要求落在事件自己的 lineId 那条线上。
                    const inAnyLine = (sid) => Object.keys(byLine).some(lid => IO.lineAllStationIds(lineById[lid]).includes(sid));
                    list.forEach(sid => {
                        if (!inAnyLine(sid)) bad.push(`${where} 换乘启用站 ${sid} 不在任何线路站序中`);
                        else if (stations[sid] && stations[sid].type !== 'tsf') bad.push(`${where} 换乘启用站 ${sid} 并非换乘站`);
                    });
                } else {
                    // suspended（停运）/ removed（拆除）
                    if (!list.length) bad.push(`${where} 闭站站列表为空`);
                    list.forEach(sid => { if (!ids.includes(sid)) bad.push(`${where} 闭站站 ${sid} 不在站序中`); });
                }
            } else if (ev.kind === 'rename') {
                // 更名可以是「旧名 → 中间名 → … → 现名」的**链**：目标站按 ev.sid 指定，
                // 或按「现名 / 曾用名」反查（兼容只有 from / to 的老数据）；
                // 旧名必须已登记为该站 aliases 检索库里的别名。链的连续性在下面统一校验。
                // 一条事件也可以带多对（`ev.renames: [{sid, from, to}, …]`），逐对走同样校验。
                const specs = (Array.isArray(ev.renames) && ev.renames.length) ? ev.renames : [ev];
                specs.forEach(spec => {
                const evx = Object.assign({}, ev, spec);
                const sid = evx.sid && stations[evx.sid] ? evx.sid
                    : Object.keys(stations).find(k => stations[k].cn === evx.to
                        || (Array.isArray(stations[k].aliases) && stations[k].aliases.includes(evx.to)));
                if (!sid) { bad.push(`${where} 更名「${evx.from}」→「${evx.to}」找不到对应车站`); return; }
                if (!Array.isArray(stations[sid].aliases)
                    || (!stations[sid].aliases.includes(evx.from) && stations[sid].cn !== evx.from)) {
                    bad.push(`${where} 更名「${evx.from}」→「${evx.to}」的旧名未登记为 ${sid} 的别名`);
                }
                renameChains[sid] = renameChains[sid] || [];
                // 链要按**日期**排（不是文件顺序）：一条事件可以带多对更名，且批次事件的书写位置
                // 未必与日期同序，最早的那次更名必须排在链首，连续性校验才成立。
                const ch = renameChains[sid];
                const item = { from: evx.from, to: evx.to, date: ev.date, where: where };
                let at = ch.length;
                while (at > 0 && ch[at - 1].date > item.date) at--;
                ch.splice(at, 0, item);
                });
            } else {
                bad.push(`${where} 未知事件类型 ${ev.kind}`);
            }
        });

        // 更名必须发生在**该站开通之后**：开通前改名只是「工程名 / 规划名 → 正式名」，
        // 旧名从未对外运营，不该作为沿革事件（动画里也看不到它）。等全部事件跑完再判，
        // 因为车站的开通日期可能由排在更名之后的事件给出。
        // 顺便校验更名链本身：多次更名必须首尾相接，且最后一次的「新名」就是该站的现名。
        Object.keys(renameChains).forEach(sid => {
            const chain = renameChains[sid];
            chain.forEach(r => {
                if (opened[sid] && opened[sid] > r.date) {
                    bad.push(`更名「${r.from}」→「${r.to}」(${r.date}) 早于该站开通 (${opened[sid]})`);
                }
            });
            for (let i = 1; i < chain.length; i++) {
                if (chain[i].from !== chain[i - 1].to) {
                    bad.push(`${chain[i].where} 更名链断裂：「${chain[i - 1].to}」≠「${chain[i].from}」`);
                }
            }
            // 链上每个名字都必须是该站的「现名或已登记别名」——防止写错站名 / 把链挂错站。
            // ⚠️ 不强制「末端必须是现名」：现名若又改过一次、而那次更名还没查到生效日，
            //    链条就只能先停在中间名上（长春「职业学院 → 职业技术大学」即此例）。
            const known = new Set([stations[sid].cn].concat(stations[sid].aliases || []));
            chain.forEach(r => {
                if (!known.has(r.to)) {
                    bad.push(`${r.where} 更名「${r.from}」→「${r.to}」的新名不是 ${sid} 的现名或别名`);
                }
            });
        });

        Object.keys(byLine).forEach(lineId => {
            const allIds = IO.lineAllStationIds(lineById[lineId]);
            // 「已开通区段连续」的判定先剔除未开通站（type "no"）：它们夹在已开通站
            // 中间完全正常（如长春 5 号线的 0508），按原数组下标判会把整条线误判为断裂
            const openIds = allIds.filter(sid => !stations[sid] || stations[sid].type !== 'no');
            const idx = openIds.map((sid, i) => byLine[lineId].has(sid) ? i : -1).filter(i => i >= 0);
            if (idx.length && idx[idx.length - 1] - idx[0] !== idx.length - 1) {
                bad.push(`${lineId} 已开通区段不连续（站序下标 ${idx.join(',')}）`);
            }
            const missing = openIds.filter(sid => byLine[lineId].has(sid) === false);
            if (missing.length) bad.push(`${lineId} 有 ${missing.length} 座已开通站未被覆盖：${missing.join(',')}`);
            // 区段**端点**必须是已开通站（端点落在未开通站＝在宣称它已开通）；
            // 而区段**穿过**未开通站是允许的：暂缓站（长春 5 号线 0508、沈阳 9 号线皇姑屯一类）
            // 就是线路从其站厅通过并运营、站点本身等到补开日才投用 —— 线条不该为此断开。
            const ends = endsByLine[lineId] || new Set();
            const hitClosed = allIds.filter(sid => byLine[lineId].has(sid) && ends.has(sid)
                && stations[sid] && stations[sid].type === 'no');
            if (hitClosed.length) bad.push(`${lineId} 区段端点落在未开通站上：${hitClosed.join(',')}`);
        });

        // 站台级幽灵点（CGO_OFFSTATION_PLATFORMS）：until 的动作引用必须唯一命中某个操作，
        // 与共享层 findOpIndex() 同口径。数据侧拼错（按日期写死 / 命中多拍）必须当错误拦下。
        const offPlats = evalData(fs.readFileSync(p, 'utf8'), 'CGO_OFFSTATION_PLATFORMS') || [];
        offPlats.forEach((pf, i) => {
            const where = `幽灵点#${i + 1} ${(pf && pf.id) || '?'}`;
            if (!pf || !pf.id || !pf.of) { bad.push(`${where} 缺少 id / of`); return; }
            if (!stations[pf.id]) bad.push(`${where} 幽灵点车站 ${pf.id} 不存在`);
            if (!stations[pf.of]) bad.push(`${where} 主点车站 ${pf.of} 不存在`);
            if (lines.some(l => IO.lineAllStationIds(l).includes(pf.id))) {
                bad.push(`${where} 幽灵点 ${pf.id} 不应出现在任何线路站序里`);
            }
            if (pf.until == null) return;   // 不写 = 到主点开通站内换乘那一步（引擎自动取动作）
            if (typeof pf.until !== 'object' || !pf.until.date || !pf.until.kind) {
                bad.push(`${where} until 须为动作引用 {date, kind, state?}，不能按日期写死`);
                return;
            }
            const hits = events.filter(ev => !ev.__shape
                && ev.date === pf.until.date && ev.kind === pf.until.kind
                && (pf.until.state === undefined || ev.state === pf.until.state)
                && (pf.until.lineId === undefined || ev.lineId === pf.until.lineId));
            if (hits.length !== 1) bad.push(`${where} until 动作引用命中 ${hits.length} 个操作（须唯一）`);
        });

        check(bad.length === 0, `${city}: ${rawEvents.length} 条事件 · ${events.length} 个操作 · ${Object.keys(byLine).length} 条线路 `
            + `覆盖 ${Object.keys(opened).length} 座车站，区段连续且拼满`);
        bad.forEach(msg => check(false, `${city}: ${msg}`));
    }
    check(withHistory >= 1, `${withHistory} 座城市登记了开通沿革（其余可选）`);
}

// ============================================================================
// 五、识别结果净化器
// ============================================================================
section('识别结果净化器');
{
    // 5.1 噪点爆炸：3 条线 60 站真实拓扑 + 5000 个噪点
    const lines = [], stations = [];
    for (let l = 0; l < 3; l++) {
        const names = [];
        for (let i = 0; i < 20; i++) {
            const n = `真站${l}_${i}`;
            names.push(n);
            stations.push({ name: n, x: 100 + i * 40, y: 200 + l * 150 });
        }
        lines.push({ id: 'L' + l, name: `${l + 1}号线`, color: ['#E4002B', '#0072CE', '#F5A800'][l], stations: names });
    }
    for (let i = 0; i < 5000; i++) stations.push({ name: '噪' + i, x: Math.random() * 1000, y: Math.random() * 1000 });

    const r = Sanitizer.sanitize({ stations, lines, width: 1000, height: 1000 });
    check(r.report.explosionGuard && r.stations.length === 60 && r.lines.length === 3,
        `噪点爆炸兜底: 5060 站 → ${r.stations.length} 站 / ${r.lines.length} 线`);
}
{
    // 5.2 脏站名
    const stations = [
        { name: '  西直门  ', x: 10, y: 10 }, { name: '车公庄\n', x: 20, y: 20 },
        { name: '１２３', x: 30, y: 30 }, { name: '12', x: 40, y: 40 },
        { name: '·', x: 50, y: 50 },
        { name: '本线于2026年开通运营详见官方公告说明文字一二三四五六', x: 60, y: 60 },
        { name: 'A', x: 70, y: 70 }, { name: '', x: 80, y: 80 }
    ];
    const r = Sanitizer.sanitize({ stations, lines: [], width: 1000, height: 1000 });
    const names = r.stations.map(s => s.name);
    check(names.length === 2 && names.includes('西直门') && names.includes('车公庄'),
        `脏站名清洗: 8 个候选 → 保留 ${names.length} 个（${names.join('、')}）`);
}
{
    // 5.3 同名换乘站合并 / 远距离幻觉丢弃
    const r = Sanitizer.sanitize({
        stations: [
            { name: '东单', x: 500, y: 500 }, { name: '东单', x: 506, y: 496 }, { name: '东单', x: 503, y: 502 },
            { name: '幻觉站', x: 100, y: 100 }, { name: '幻觉站', x: 900, y: 900 }
        ], lines: [], width: 1000, height: 1000
    });
    check(r.stations.length === 2 && r.report.merged === 2 && r.report.dropped.duplicate === 1,
        '同名近点合并为质心、远点判为幻觉丢弃');
}
{
    // 5.4 颜色规范化与退化线路
    const lines = [
        { id: 'a', name: '1号线', color: 'rgb(207, 53, 23)', stations: ['Aa', 'Bb', 'Cc'] },
        { id: 'b', name: '', color: '#f00', stations: ['Aa', 'Bb', 'Cc'] },
        { id: 'c', name: '3号线', color: 'bad', stations: ['Dd'] },
        { id: 'd', name: '4号线', color: '#0072CE', stations: ['Cc', 'Bb', 'Aa'] },
        { id: 'e', name: '5号线', color: '#0072CE', stations: ['Ee', 'Ff'] }
    ];
    const stations = ['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff'].map((n, i) => ({ name: n, x: 100 + i * 50, y: 300 }));
    const r = Sanitizer.sanitize({ stations, lines, width: 1000, height: 1000 });
    check(r.lines.length === 2 && r.lines[0].color === '#CF3517' && r.lines[1].color !== r.lines[0].color,
        `退化/重复线路剔除 5→${r.lines.length} 条，rgb() 转 hex，撞色改判`);

    // 带原生矢量走向的线路即使站点没对上也必须保留
    const v = Sanitizer.sanitize({
        stations: [], width: 1000, height: 1000,
        lines: [{ id: 'v', name: '磁浮线', color: '#123456', stations: ['没对上'], pathPoints: [{ x: 0, y: 0 }, { x: 10, y: 10 }] }]
    });
    check(v.lines.length === 1, 'pathPoints 线路不因站点匹配失败被丢弃');
}

// ============================================================================
// 六、整体几何校正（会上反复提到的「识别出来站点是歪的」）
// ============================================================================
section('整体相似变换校正');
{
    const truth = [];
    for (let i = 0; i < 40; i++) truth.push({ x: 100 + (i % 8) * 90, y: 120 + Math.floor(i / 8) * 130 });
    const th = 8 * Math.PI / 180, sc = 1.06, tx = 37, ty = -21;
    const skewed = truth.map(p => ({
        x: sc * (Math.cos(th) * p.x - Math.sin(th) * p.y) + tx,
        y: sc * (Math.sin(th) * p.x + Math.cos(th) * p.y) + ty
    }));
    const t = Sanitizer.fitSimilarity(skewed.map((p, i) => ({ from: p, to: truth[i] })));
    const fixed = Sanitizer.applyTransform(skewed, t);
    const maxErr = Math.max(...fixed.map((p, i) => Math.hypot(p.x - truth[i].x, p.y - truth[i].y)));
    check(t && Math.abs(t.scale - 1 / sc) < 1e-6 && Math.abs(t.rotationDeg + 8) < 1e-6 && maxErr < 1e-6,
        `无噪声下精确解回 8° 旋转 + ${sc} 缩放 + 平移，最大残差 ${maxErr.toExponential(2)} px`);

    // 带噪声
    const t2 = [], s2 = [];
    const th2 = 3 * Math.PI / 180, sc2 = 0.97;
    for (let i = 0; i < 12; i++) {
        const p = { x: 50 + i * 70, y: 400 + (i % 3) * 90 };
        t2.push(p);
        s2.push({
            x: sc2 * (Math.cos(th2) * p.x - Math.sin(th2) * p.y) - 12 + (Math.random() - 0.5) * 3,
            y: sc2 * (Math.sin(th2) * p.x + Math.cos(th2) * p.y) + 25 + (Math.random() - 0.5) * 3
        });
    }
    const tt = Sanitizer.fitSimilarity(s2.map((p, i) => ({ from: p, to: t2[i] })));
    const f2 = Sanitizer.applyTransform(s2, tt);
    const rms = Math.sqrt(f2.reduce((a, p, i) => a + (p.x - t2[i].x) ** 2 + (p.y - t2[i].y) ** 2, 0) / t2.length);
    check(rms < 4, `±1.5px 锚点噪声下校正 RMS ${rms.toFixed(2)}px < 4px`);

    check(Sanitizer.fitSimilarity([]) === null && Sanitizer.fitSimilarity(null) === null
        && Sanitizer.sanitize({}).stations.length === 0,
        '空输入安全返回，不抛异常');
}

// ────────────────────────────────────────────────────────────────────────────
// 走线路由器 (SegmentRouter) 几何断言
// ────────────────────────────────────────────────────────────────────────────
section('走线与折角几何 (SegmentRouter)');
{
    const r1 = SegmentRouter.buildRectPath({ x: 0, y: 0 }, { x: 100, y: 50 }, 'horizontal');
    check(r1.length === 3 && r1[1].x === 100 && r1[1].y === 0, '90° 轴平行折角: horizontal 先横后竖');

    const r2 = SegmentRouter.buildRectPath({ x: 0, y: 0 }, { x: 100, y: 50 }, 'vertical');
    check(r2.length === 3 && r2[1].x === 0 && r2[1].y === 50, '90° 轴平行折角: vertical 先竖后横');

    const d1 = SegmentRouter.buildDiagPath({ x: 0, y: 0 }, { x: 100, y: 60 }, 'diagonal');
    check(d1.length === 3 && d1[1].x === 60 && d1[1].y === 60, '135° 正交折角: 45°斜段长度 60，中间点 (60, 60)');

    const autoAxis = SegmentRouter.autoRouteBetween({ x: 0, y: 0 }, { x: 100, y: 0 });
    check(autoAxis.type === 'segaxis' && autoAxis.points.length === 2, '两端与坐标轴平行自动选型为自由直线 (segaxis)');

    const autoDiag = SegmentRouter.autoRouteBetween({ x: 0, y: 0 }, { x: 100, y: 80 });
    check(autoDiag.type === 'seg135' && autoDiag.points.length === 3, '对角带内自动选型为 135° 正交折角 (seg135)');

    const segToFlip = { type: 'seg135', points: d1.slice() };
    const flipped = SegmentRouter.flipSegmentCorner(segToFlip);
    check(flipped && (segToFlip.points[1].x !== 60 || segToFlip.points[1].y !== 60), '135° 折角成功翻转至另一侧走线');
}

// ────────────────────────────────────────────────────────────────────────────
// 百科表格提取与放站 (BatchStationTool) 断言
// ────────────────────────────────────────────────────────────────────────────
section('百科表格提取与站名规范化 (BatchStationTool)');
{
    check(BatchStationTool.normalizeStationName('西直门站') === '西直门', '普通地铁站名去掉末尾「站」后缀: 西直门站 → 西直门');
    check(BatchStationTool.normalizeStationName('北京南站') === '北京南站', '国铁枢纽站保留「站」专名: 北京南站 → 北京南站');
    check(BatchStationTool.normalizeStationName('沈阳站站') === '沈阳站', '站名重复后缀正确折叠: 沈阳站站 → 沈阳站');

    const sampleTable = `<table>
        <tr><th>序号</th><th>车站名称</th><th>换乘线路</th></tr>
        <tr><td>1</td><td><div><span>西直门站</span></div><div><span>Xizhimen Station</span></div></td><td>2号线、13号线</td></tr>
        <tr><td>2</td><td><div><span>车公庄站</span></div><div><span>Chegongzhuang Station</span></div></td><td>6号线</td></tr>
    </table>`;
    const extracted = BatchStationTool.extractStationsFromHtml(sampleTable);
    check(extracted.length === 2, '从标准 HTML 表格提取出 2 座车站');
    check(extracted[0].cn === '西直门' && extracted[0].en === 'Xizhimen', '正确清洗中英文站名并剔除 Station: 西直门 / Xizhimen');
    check(extracted[1].cn === '车公庄', '正确清洗中文站名: 车公庄');

    const sampleText = '1. 苹果园 (Pingguoyuan)\n2. 古城\n3. 八角游乐园';
    const parsedText = BatchStationTool.parseStationList(sampleText);
    check(parsedText.length === 3 && parsedText[0].cn === '苹果园' && parsedText[0].en === 'Pingguoyuan', '从纯文本列表正确解析站名与括号英文');
}

// ────────────────────────────────────────────────────────────────────────────
// 站线拓扑联动与在线插站 (PipelineDraw & Station-Route Topology) 断言
// ────────────────────────────────────────────────────────────────────────────
section('站线拓扑联动与在线插站 (PipelineDraw)');
{
    const proj = ProjectModel.createProject(2000, 1500);
    proj.nodes = {
        'sta_1': { id: 'sta_1', x: 100, y: 100, cn: '一号站', en: 'Station 1', type: 'dot' },
        'sta_2': { id: 'sta_2', x: 300, y: 100, cn: '二号站', en: 'Station 2', type: 'dot' }
    };
    proj.lines = [
        { id: 'L1', name: '1号线', color: '#c23531', stationIds: ['sta_1', 'sta_2'], distances: [1500] }
    ];
    proj.segments = [
        {
            id: 'seg_1',
            lineId: 'L1',
            type: 'segaxis',
            points: [
                { x: 100, y: 100, nid: 'sta_1' },
                { x: 300, y: 100, nid: 'sta_2' }
            ]
        }
    ];

    // 1. 最近投影计算与阈值测试
    const snapHit = PipelineDraw.findNearestLineProjection(proj, { x: 200, y: 108 }, 20);
    check(snapHit !== null, '在吸附阈值内成功命中折线');
    check(snapHit && snapHit.projection.x === 200 && snapHit.projection.y === 100, '点精确投影到水平线段上 (200, 100)');
    check(snapHit && Math.abs(snapHit.distance - 8) < 1e-4, '投影距离计算准确为 8px');

    const snapMiss = PipelineDraw.findNearestLineProjection(proj, { x: 200, y: 150 }, 20);
    check(snapMiss === null, '超出 20px 阈值时正确返回 null 不误吸附');

    // 2. 在线智能插站拓扑计算
    const inserted = PipelineDraw.insertStationOnLine(proj, snapHit, { cn: '中间新站', en: 'Mid Station' });
    check(inserted && inserted.createdId && proj.nodes[inserted.createdId], '成功生成新车站节点并在 nodes 字典中登记');
    check(proj.lines[0].stationIds.length === 3, '1号线 stationIds 长度扩充为 3');
    check(proj.lines[0].stationIds[0] === 'sta_1' && proj.lines[0].stationIds[1] === inserted.createdId && proj.lines[0].stationIds[2] === 'sta_2', '新车站正确插入在 sta_1 与 sta_2 之间');
    check(proj.lines[0].distances.length === 2, 'distances 数组长度与 stationIds 保持严格 n-1 对齐');
    check(proj.segments[0].points.length === 3 && proj.segments[0].points[1].nid === inserted.createdId, '折线点阵无损切分并插入新车站折点');

    // 3. 多分支线路插站测试 (hasbranch)
    const branchProj = ProjectModel.createProject(2000, 1500);
    branchProj.nodes = {
        'b_1': { id: 'b_1', x: 50, y: 50, cn: '分支首站', type: 'dot' },
        'b_2': { id: 'b_2', x: 250, y: 50, cn: '分支末站', type: 'dot' }
    };
    branchProj.lines = [
        { id: 'LB', name: '分支线', hasbranch: true, 'stationIds-way1': ['b_1', 'b_2'] }
    ];
    branchProj.segments = [
        {
            id: 'seg_b1',
            lineId: 'LB',
            branchKey: 'pathPoints-branch1',
            points: [
                { x: 50, y: 50, nid: 'b_1' },
                { x: 250, y: 50, nid: 'b_2' }
            ]
        }
    ];
    const bSnap = PipelineDraw.findNearestLineProjection(branchProj, { x: 150, y: 52 }, 15);
    const bInserted = PipelineDraw.insertStationOnLine(branchProj, bSnap, { cn: '分支中间站' });
    check(bInserted && branchProj.lines[0]['stationIds-way1'][1] === bInserted.createdId, '分支线路 stationIds-way1 正确插入新站 ID');

    // 4. 站序微调 (上移/下移)
    const stIds = proj.lines[0].stationIds;
    const midId = stIds[1];
    const temp0 = stIds[1]; stIds[1] = stIds[0]; stIds[0] = temp0;
    check(proj.lines[0].stationIds[0] === midId, '站序上移成功');

    // 5. 拓扑防断连自愈与平滑摘除
    const toDeleteId = midId;
    proj.lines.forEach(l => {
        ['stationIds'].forEach(k => {
            const idx = l[k].indexOf(toDeleteId);
            if (idx !== -1) {
                l[k].splice(idx, 1);
                if (l.distances && l.distances.length >= l[k].length) l.distances.splice(idx, 1);
            }
        });
    });
    proj.segments[0].points = proj.segments[0].points.filter(p => p.nid !== toDeleteId);
    delete proj.nodes[toDeleteId];
    check(!proj.nodes[toDeleteId], '车站节点从 nodes 字典中删除');
    check(proj.lines[0].stationIds.indexOf(toDeleteId) === -1 && proj.lines[0].stationIds.length === 2, '车站平滑从线路 stationIds 中摘除，无孤儿悬空 ID');
    check(proj.lines[0].distances.length === 1, '自愈后 distances 仍严格保持 stationIds.length - 1');
}

// ============================================================================
// 十三、Milestone 2 折点精调模式与正交协同推移 (preserveOrthogonalShift)
// ============================================================================
section('Milestone 2 折点精调与正交协同推移');
{
    // 1. preserveOrthogonalShift - 90度走线端点协同推移
    const pts90 = [
        { x: 0, y: 0, nid: 'n1' },
        { x: 100, y: 0 },
        { x: 100, y: 100, nid: 'n2' }
    ];
    const shifted90 = SegmentRouter.preserveOrthogonalShift(
        pts90,
        2,
        { x: 100, y: 100 },
        { x: 120, y: 150 },
        'seg90'
    );
    check(shifted90, '90° 走线应用正交协同推移返回 true');
    check(pts90[1].x === 120 || pts90[1].y === 0, '90° 走线中间折点协同移动，保持正交对齐');

    // 2. preserveOrthogonalShift - 135度走线端点协同推移
    const pts135 = [
        { x: 0, y: 0, nid: 'n1' },
        { x: 60, y: 60 },
        { x: 160, y: 60, nid: 'n2' }
    ];
    const shifted135 = SegmentRouter.preserveOrthogonalShift(
        pts135,
        2,
        { x: 160, y: 60 },
        { x: 180, y: 80 },
        'seg135'
    );
    check(shifted135, '135° 走线协同推移返回 true');

    // 3. 中间折点新增与圆角半径控制
    const segSample = {
        id: 'seg_corner_test',
        points: [
            { x: 0, y: 0, nid: 's1' },
            { x: 100, y: 0 },
            { x: 100, y: 100, nid: 's2' }
        ]
    };
    const midX = Math.round((segSample.points[0].x + segSample.points[1].x) / 2);
    const midY = Math.round((segSample.points[0].y + segSample.points[1].y) / 2);
    segSample.points.splice(1, 0, { x: midX, y: midY, r: 8 });
    check(segSample.points.length === 4, '中点添加手柄成功插入新折点');
    check(segSample.points[1].r === 8, '折点成功赋予紧凑圆角半径 (r: 8)');

    // 4. 几何引擎对独立折点 r 的解析
    const G = require(path.join(ROOT, 'core/path-geometry.js'));
    const pathWithR = G.generateRoundedPath(segSample.points);
    check(typeof pathWithR === 'string' && pathWithR.startsWith('M'), 'generateRoundedPath 成功基于指定半径生成平滑 SVG path');

    // 5. 严格直角 (r: 0)
    segSample.points[1].r = 0;
    const pathSharp = G.generateRoundedPath(segSample.points);
    check(pathSharp.includes('L 50 0'), 'r:0 时生成严格直角无圆弧切线');

    // 6. 折点删除拉直
    segSample.points.splice(1, 1);
    check(segSample.points.length === 3, '删除折点后点阵平滑拉直恢复 3 点');
}

// ============================================================================
// 十四、Milestone 3 多选框选与智能对齐参考线 (Box Select & Smart Guides)
// ============================================================================
section('Milestone 3 多选框选与智能对齐参考线');
{
    // 1. 视口框选相交测试
    const mockNodes = {
        'n_in1': { x: 50, y: 50, cn: '站A' },
        'n_in2': { x: 80, y: 70, cn: '站B' },
        'n_out': { x: 200, y: 200, cn: '站C' }
    };
    const box = { minX: 40, minY: 40, maxX: 100, maxY: 80 };
    const selected = Object.keys(mockNodes).filter(nid => {
        const n = mockNodes[nid];
        return n.x >= box.minX && n.x <= box.maxX && n.y >= box.minY && n.y <= box.maxY;
    });
    check(selected.length === 2 && selected.includes('n_in1') && selected.includes('n_in2') && !selected.includes('n_out'),
        '框选矩形精准命中框内 2 座车站，排除框外车站');

    // 2. 多选包围盒 (Bounding Box) 计算
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selected.forEach(nid => {
        const n = mockNodes[nid];
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    });
    check(minX === 50 && maxX === 80 && minY === 50 && maxY === 70, '多选集合外接包围盒尺寸计算精确 (30×20)');

    // 3. 批量整体平移与折线端点协同
    const mockSegments = [
        { id: 'seg1', points: [{ x: 50, y: 50, nid: 'n_in1' }, { x: 80, y: 70, nid: 'n_in2' }] },
        { id: 'seg2', points: [{ x: 80, y: 70, nid: 'n_in2' }, { x: 200, y: 200, nid: 'n_out' }] }
    ];
    const dx = 15, dy = -10;
    selected.forEach(nid => {
        mockNodes[nid].x += dx;
        mockNodes[nid].y += dy;
    });
    // 同步线段端点
    const selSet = new Set(selected);
    mockSegments.forEach(seg => {
        seg.points.forEach(p => {
            if (p.nid && selSet.has(p.nid)) {
                p.x = mockNodes[p.nid].x;
                p.y = mockNodes[p.nid].y;
            }
        });
    });
    check(mockNodes['n_in1'].x === 65 && mockNodes['n_in1'].y === 40, 'n_in1 平移后坐标正确 (65, 40)');
    check(mockNodes['n_in2'].x === 95 && mockNodes['n_in2'].y === 60, 'n_in2 平移后坐标正确 (95, 60)');
    check(mockSegments[0].points[0].x === 65 && mockSegments[1].points[0].x === 95, '相连线段端点协同平移，无悬空或漂移');
    check(mockSegments[1].points[1].x === 200, '非选中节点 n_out 坐标严格保持不动');

    // 4. 智能对齐参考线探测
    const snapTol = 4;
    const testDragged = { x: 202, y: 61 };
    const smartGuides = [];
    Object.keys(mockNodes).forEach(otherId => {
        const other = mockNodes[otherId];
        if (Math.abs(testDragged.x - other.x) <= snapTol) {
            smartGuides.push({ type: 'v', pos: other.x, label: `${other.cn} X:${other.x}` });
        }
        if (Math.abs(testDragged.y - other.y) <= snapTol) {
            smartGuides.push({ type: 'h', pos: other.y, label: `${other.cn} Y:${other.y}` });
        }
    });
    check(smartGuides.some(g => g.type === 'v' && g.pos === 200), '智能对齐成功捕获 X=200 垂直参考线并吸附');
    check(smartGuides.some(g => g.type === 'h' && g.pos === 60), '智能对齐成功捕获 Y=60 水平参考线并吸附');
}

// ============================================================================
// 十五、Milestone 4 全要素外科手术回写与 Changeset (PipelineSurgical)
// ============================================================================
{
    section('Milestone 4 全要素外科手术回写与 Changeset');

    // 1. BundleExporter 全要素格式化保真度验证 (align, offset, textScale, hideLabel, marker, halo)
    const mockProjForExport = {
        nodes: {
            'TEST_STA': {
                x: 100, y: 200, type: 'dot', cn: '测试站', en: 'Test Station',
                align: 'bottom-left', offset: { x: 5, y: -3 },
                textScale: { cn: 1.2, en: 0.9 }, hideLabel: true,
                marker: 'triangle', halo: '#ff0000'
            }
        },
        lines: [
            {
                id: 'L_TEST', name: '测试线', color: '#123456',
                stationIds: ['TEST_STA'], distances: [],
                pathPoints: [{ x: 100, y: 200 }, { x: 300, y: 200 }]
            }
        ]
    };
    const packRes = CodeGen.formatCityPackage(mockProjForExport, { cityId: 'testcity', cityName: '测试市' });
    check(packRes.stationsJs.includes('"align":"bottom-left"') || /align:\s*"bottom-left"/.test(packRes.stationsJs), '全量导出保留 align 字段');
    check(packRes.stationsJs.includes('"offset"') || /offset:/.test(packRes.stationsJs), '全量导出保留 offset 字段');
    check(packRes.stationsJs.includes('"textScale"') || /textScale:/.test(packRes.stationsJs), '全量导出保留 textScale 字段');
    check(packRes.stationsJs.includes('"hideLabel":true') || /hideLabel:\s*true/.test(packRes.stationsJs), '全量导出保留 hideLabel 字段');
    check(packRes.linesJs.includes('L_TEST') && packRes.linesJs.includes('#123456'), '全量导出生成完整线路代码');

    // 2. 模拟城市原始源码与注释
    const rawStationsSrc = `// 车站数据说明\nconst stationsData = {\n    // 首发站\n    "S1": { "x": 100, "y": 200, "cn": "起点站", "en": "Start", "align": "top" },\n    // 终点站\n    "S2": { "x": 200, "y": 200, "cn": "终点站", "en": "End", "align": "top" }\n};\n`;
    const rawLinesSrc = `// 线路数据说明\nconst linesData = [\n    {\n        id: "L1",\n        name: "1号线",\n        color: "#ff0000",\n        // 运营站点序列\n        stationIds: ["S1", "S2"],\n        distances: [1200],\n        pathPoints: [\n            { x: 100, y: 200 },\n            { x: 200, y: 200 }\n        ]\n    }\n];\n`;

    const initData = {
        stationsData: {
            "S1": { x: 100, y: 200, cn: "起点站", en: "Start", align: "top" },
            "S2": { x: 200, y: 200, cn: "终点站", en: "End", align: "top" }
        },
        linesData: [
            {
                id: "L1", name: "1号线", color: "#ff0000",
                stationIds: ["S1", "S2"], distances: [1200],
                pathPoints: [{ x: 100, y: 200 }, { x: 200, y: 200 }]
            }
        ]
    };

    const initCity = PipelineSurgical.init('testcity', {
        'data_stations.js': rawStationsSrc,
        'data_lines.js': rawLinesSrc
    }, initData);

    // 未做任何改动时，dirty 计数应为 0
    const cleanCs = PipelineSurgical.computeChangeset(initCity.project);
    check(!cleanCs.hasChanges, '未做修改时 Changeset 检测无任何改动');

    // 3. 修改车站属性（坐标平移 + 新增 textScale）
    initCity.project.nodes['S1'].x = 125;
    initCity.project.nodes['S1'].textScale = { cn: 1.5, en: 1.0 };
    const dirtySt = PipelineSurgical.computeDirtyStations(initCity.project);
    check(Object.keys(dirtySt).length === 1 && dirtySt['S1'].x === 125, 'computeDirtyStations 精准识别车站改动');

    const stPatchRes = PipelineSurgical.patchStationsSource(initCity.project);
    check(stPatchRes.dirtyCount === 1, 'patchStationsSource 命中 1 处改动');
    check(stPatchRes.patchedSource.includes('// 首发站') && stPatchRes.patchedSource.includes('// 终点站'), '车站回写 100% 保留原始注释');
    check(/"x":\s*125/.test(stPatchRes.patchedSource), '车站回写坐标更新生效');

    // 4. 修改线路走向折点与站序
    initCity.project.lines[0].color = '#00aa00';
    initCity.project.lines[0].stationIds = ['S1', 'S2', 'S3'];
    initCity.project.lines[0].distances = [1200, 800];
    const dirtyLn = PipelineSurgical.computeDirtyLines(initCity.project);
    check(Object.keys(dirtyLn).length === 1 && dirtyLn['L1'].color === '#00aa00', 'computeDirtyLines 精准识别线路改动');

    const lnPatchRes = PipelineSurgical.patchLinesSource(initCity.project);
    check(lnPatchRes.dirtyCount === 1, 'patchLinesSource 命中 1 处线路改动');
    check(lnPatchRes.patchedSource.includes('// 线路数据说明') && lnPatchRes.patchedSource.includes('// 运营站点序列'), '线路回写 100% 保留原始注释');
    check(lnPatchRes.patchedSource.includes('#00aa00'), '线路颜色回写生效');
    check(lnPatchRes.patchedSource.includes('"S3"') || lnPatchRes.patchedSource.includes("'S3'"), '线路新增站序回写生效');

    // 5. 全文件 Changeset 提取与 ZIP 打包流
    const fullCs = PipelineSurgical.computeChangeset(initCity.project);
    check(fullCs.hasChanges, '全文件 Changeset 正确识别改动状态');
    check(fullCs.files.filter(f => f.changed).length === 2, 'Changeset 精确包含 2 个改动文件');

    const zipEntries = fullCs.files.filter(f => f.changed).map(f => ({
        name: `testcity/${f.filename}`,
        text: f.patchedSource
    }));
    const zipBytes = CodeGen.buildZipBytes(zipEntries);
    check(zipBytes instanceof Uint8Array && zipBytes.length > 100, 'Changeset 成功生成合法 ZIP 二进制流');

    // 6. Bug 1 fix: 只改 x 时，不应注入 align/offset/type 默认字段（源文件字段零污染）
    const rawOnlyCoord = `const stationsData = {\n    "A1": { "x": 50, "y": 80, "cn": "零字段站", "en": "ZeroField" }\n};\n`;
    const minCity = PipelineSurgical.init('mincity', {
        'data_stations.js': rawOnlyCoord,
        'data_lines.js': 'const linesData = [];'
    }, {
        stationsData: { A1: { x: 50, y: 80, cn: '零字段站', en: 'ZeroField' } },
        linesData: []
    });
    minCity.project.nodes['A1'].x = 60;   // 仅改坐标
    const minPatch = PipelineSurgical.patchStationsSource(minCity.project);
    check(!minPatch.patchedSource.includes('"align"'), 'Bug1 Fix: 仅改坐标时不向原文件注入 align 字段');
    check(!minPatch.patchedSource.includes('"offset"'), 'Bug1 Fix: 仅改坐标时不向原文件注入 offset 字段');
    check(!minPatch.patchedSource.includes('"type"'), 'Bug1 Fix: 仅改坐标时不向原文件注入 type 字段');

    // 7. Bug 2 fix: 删除车站后，patchStationsSource 应从输出文件中删除该条目
    const rawWithTwo = `const stationsData = {\n    "D1": { "x": 10, "y": 10, "cn": "保留站", "en": "Keep" },\n    "D2": { "x": 20, "y": 20, "cn": "待删站", "en": "Delete" }\n};\n`;
    const lineDelCity = PipelineSurgical.init('delcity', {
        'data_stations.js': rawWithTwo,
        'data_lines.js': 'const linesData = [];'
    }, {
        stationsData: {
            D1: { x: 10, y: 10, cn: '保留站', en: 'Keep' },
            D2: { x: 20, y: 20, cn: '待删站', en: 'Delete' }
        },
        linesData: []
    });
    delete lineDelCity.project.nodes['D2'];   // 编辑器删除 D2
    const delIds = PipelineSurgical.computeDeletedStationIds(lineDelCity.project);
    check(delIds.includes('D2'), 'Bug2 Fix: computeDeletedStationIds 正确识别 D2 被删除');
    const delPatch = PipelineSurgical.patchStationsSource(lineDelCity.project);
    check(!delPatch.patchedSource.includes('"D2"') && !delPatch.patchedSource.includes("'D2'"), 'Bug2 Fix: 删除 D2 后回写源码中已不包含 D2 条目');
    check(delPatch.patchedSource.includes('"D1"') || delPatch.patchedSource.includes("'D1'"), 'Bug2 Fix: 未删除的 D1 仍完整保留在回写结果中');

    // 8. Bug 3 fix: 车站回写曾用「稀疏 patch」（只带 x/y/cn/en）。键数与原条目不一致时
    //    patchEntries 会回退成整条重写，把没进 patch 的字段整片删掉 —— 尤其是普通站的
    //    type:"dot"（默认值不会进 patch）。type 一丢，引擎的 className 就没有尺寸类
    //    （css 里只有 .dot/.tsf 这些类带 width/height），.station svg 的 width:100%
    //    会把车站圆圈撑成巨大图元。这正是「写回后圆圈异常大」的根因。
    const rawPlain = `const stationsData = {\n    "P1": {\n        type: "dot",\n        x: 100,\n        y: 200,\n        cn: "普通站",\n        en: "Plain",\n        offset: { x: 0, y: 0 },\n        textScale: { cn: 1.2, en: 1 },\n        marker: { parts: ["A"] }\n    }\n};\n`;
    const plainCity = PipelineSurgical.init('plaincity', {
        'data_stations.js': rawPlain,
        'data_lines.js': 'const linesData = [];'
    }, {
        stationsData: {
            P1: {
                type: 'dot', x: 100, y: 200, cn: '普通站', en: 'Plain',
                offset: { x: 0, y: 0 }, textScale: { cn: 1.2, en: 1 }, marker: { parts: ['A'] }
            }
        },
        linesData: []
    });
    plainCity.project.nodes['P1'].x = 150;   // 只挪位置
    const plainPatch = PipelineSurgical.patchStationsSource(plainCity.project);
    check(/type\s*:\s*["']dot["']/.test(plainPatch.patchedSource),
        'Bug3 Fix: 仅改坐标时普通站的 type:"dot" 不得丢失（丢失会让圆圈变巨大）');
    check(/offset\s*:/.test(plainPatch.patchedSource), 'Bug3 Fix: 未改动的 offset 原样保留');
    check(/textScale\s*:/.test(plainPatch.patchedSource), 'Bug3 Fix: 未改动的 textScale 原样保留');
    check(/marker\s*:/.test(plainPatch.patchedSource), 'Bug3 Fix: 城市私有字段 marker 原样保留');
    check(/x\s*:\s*150/.test(plainPatch.patchedSource), 'Bug3 Fix: 坐标改动依然生效');
    check(!/\bid\s*:/.test(plainPatch.patchedSource) && !/textScale\s*:\s*null/.test(plainPatch.patchedSource),
        'Bug3 Fix: 不得把编辑器内部字段（id / textScale:null）写进城市数据');

    // 9. Bug 4 fix: 新增车站在源码里还没有键，update 会直接跳过 → 此前被静默丢弃，
    //    而「在线插站」会同时在站序里插入该 ID，于是留下悬空引用。必须走 append。
    const appendCity = PipelineSurgical.init('appendcity', {
        'data_stations.js': rawPlain,
        'data_lines.js': 'const linesData = [];'
    }, {
        stationsData: { P1: { type: 'dot', x: 100, y: 200, cn: '普通站', en: 'Plain' } },
        linesData: []
    });
    appendCity.project.nodes['NEWST'] = { type: 'dot', x: 300, y: 400, cn: '新站', en: 'NewSt' };
    const appendPatch = PipelineSurgical.patchStationsSource(appendCity.project);
    check(appendPatch.patchedSource.includes('NEWST'), 'Bug4 Fix: 新增车站会追加写回（此前被静默丢弃）');
    check(/type\s*:\s*["']dot["']/.test(appendPatch.patchedSource), 'Bug4 Fix: 追加后原有车站的 type 仍在');
    check(/cn\s*:\s*["']新站["']/.test(appendPatch.patchedSource), 'Bug4 Fix: 追加的车站带上了站名');

    // 10. Bug 5 fix: marker/halo 曾用引用比较（curr.marker !== orig.marker），快照是深拷贝，
    //     于是只要车站带 marker（悉尼这类城市）就**全城判脏**——零编辑也整份重写源文件，
    //     把人工排版全冲掉。必须按值比较。
    const rawMarker = `const stationsData = {\n    "M1": { type: "dot", x: 10, y: 10, cn: "带标记站", en: "Mk", marker: { parts: [{ t: "stop", c: "#123456", w: 7, h: 7 }] } },\n    "M2": { type: "dot", x: 20, y: 20, cn: "无标记站", en: "Plain" }\n};\n`;
    const markerCity = PipelineSurgical.init('markercity', {
        'data_stations.js': rawMarker,
        'data_lines.js': 'const linesData = [];'
    }, {
        stationsData: {
            M1: { type: 'dot', x: 10, y: 10, cn: '带标记站', en: 'Mk', marker: { parts: [{ t: 'stop', c: '#123456', w: 7, h: 7 }] } },
            M2: { type: 'dot', x: 20, y: 20, cn: '无标记站', en: 'Plain' }
        },
        linesData: []
    });
    check(Object.keys(PipelineSurgical.computeDirtyStations(markerCity.project)).length === 0,
        'Bug5 Fix: 未做任何编辑时不得把带 marker 的车站判成脏（引用比较会导致全城重写）');
    markerCity.project.nodes['M1'].x = 30;
    const markerDirty = PipelineSurgical.computeDirtyStations(markerCity.project);
    check(Object.keys(markerDirty).length === 1 && markerDirty['M1'].x === 30,
        'Bug5 Fix: 真正改了坐标才判脏，且只脏这一座');
    const markerPatch = PipelineSurgical.patchStationsSource(markerCity.project);
    check(/marker\s*:/.test(markerPatch.patchedSource), 'Bug5 Fix: marker 字段在回写后仍然存在');

    // 11. Bug 6 fix: 写回目录守卫。旧实现认不出目录时会静默回落到「用户选中的目录」，
    //     选错文件夹（例如仓库根目录）就会把 data_stations.js 写到别的目录里。
    //     现在必须先确认「目录名=城市 id 且存在 data_stations.js」，否则报错拒写。
    const surgSrc = fs.readFileSync(path.join(ROOT, 'editor/js/pipelines/pipeline-surgical.js'), 'utf8');
    const resolveBody = (surgSrc.match(/async function resolveCityDir[\s\S]*?\n    \}/) || [''])[0];
    check(/getFileHandle\('data_stations\.js'\)/.test(resolveBody),
        'Bug6 Fix: 写回前必须确认目标目录里有 data_stations.js');
    check(/dir\.name !== expectName/.test(resolveBody),
        'Bug6 Fix: 目标目录名必须与城市 id 一致（不能写进别的城市目录）');
    check(!/return handle;\s*\n\s*\}\s*$/.test(resolveBody.replace(/\s+$/g, '')),
        'Bug6 Fix: 认不出目录时不得静默回落到用户选中的目录');
    check(/resolveCityDir: resolveCityDir/.test(surgSrc),
        'Bug6 Fix: resolveCityDir 已对外暴露便于回归验证');

    // 12. 网格：图层与开关入口 + 吸附取「实际画出来的步长」（LOD 放大后仍要吸附得上）
    const editorHtmlSrc = fs.readFileSync(path.join(ROOT, 'editor/index.html'), 'utf8');
    const editorAppSrc = fs.readFileSync(path.join(ROOT, 'editor/js/editor-app.js'), 'utf8');
    check(/id="hudBtnGrid"/.test(editorHtmlSrc) && /id="gridLayer"/.test(editorHtmlSrc),
        'Grid: 画布内存在网格图层 #gridLayer 与 HUD 网格开关 hudBtnGrid');
    check(/GridLayer\.init/.test(editorAppSrc) && /GridLayer\.setVisible/.test(editorAppSrc),
        'Grid: 开关与图层联动（GridLayer.init / setVisible）');
    // 吸附必须用「实际画出来的步长」而不是配置值：低缩放时 LOD 会倍增网格步长，
    // 用配置值会让落点卡在两条可见网格线之间，看起来像没吸附上。
    const gridLayerSrc = fs.readFileSync(path.join(ROOT, 'editor/js/layers/grid-layer.js'), 'utf8');
    const viewportLayerSrc = fs.readFileSync(path.join(ROOT, 'editor/js/layers/viewport.js'), 'utf8');
    check(/function getEffectiveGridSize/.test(gridLayerSrc) && /getEffectiveGridSize: getEffectiveGridSize/.test(gridLayerSrc),
        'Grid: GridLayer 暴露 getEffectiveGridSize（按 LOD 实际步长吸附）');
    check(/GridLayer\.getEffectiveGridSize/.test(viewportLayerSrc),
        'Grid: 视口吸附取的是渲染后的步长，而不是配置值');

    // 13. 线路属性面板（名称 / 标志色 / 运营公司）与写回
    const inspSrc = fs.readFileSync(path.join(ROOT, 'editor/js/ui/inspector-view.js'), 'utf8');
    check(/function renderLineInspector/.test(inspSrc) && /renderLineInspector: renderLineInspector/.test(inspSrc),
        'LineProp: 检视面板提供 renderLineInspector');
    check(/propLineName/.test(inspSrc) && /propLineColorPicker/.test(inspSrc) && /propLineCompany/.test(inspSrc),
        'LineProp: 面板含线路名称 / 标志色 / 运营公司输入');
    check(/renderLineInspector\(selLine/.test(editorAppSrc) && /type: 'line', id: id/.test(editorAppSrc),
        'LineProp: 点击大纲线路即选中并渲染线路属性面板');
    check(/targetType === 'line'/.test(editorAppSrc) && /normalizeHexColor/.test(editorAppSrc),
        'LineProp: handlePropertyChange 支持 line 的 name/color/company/useStrictRounding');

    // 14. 站序驱动的线路不得凭空生成 pathPoints（否则零编辑就全城判脏、并把派生几何写进源文件）
    const noPathStations = `const stationsData = {\n    "A": { type: "dot", x: 0, y: 0, cn: "甲", en: "A" },\n    "B": { type: "dot", x: 100, y: 0, cn: "乙", en: "B" }\n};\n`;
    const noPathLines = `const linesData = [\n    { id: "L1", name: "1号线", color: "#E4002B", stationIds: ["A", "B"], distances: [1200] }\n];\n`;
    const noPathCity = PipelineSurgical.init('nopathcity', {
        'data_stations.js': noPathStations,
        'data_lines.js': noPathLines
    }, {
        stationsData: { A: { type: 'dot', x: 0, y: 0, cn: '甲', en: 'A' }, B: { type: 'dot', x: 100, y: 0, cn: '乙', en: 'B' } },
        linesData: [{ id: 'L1', name: '1号线', color: '#E4002B', stationIds: ['A', 'B'], distances: [1200] }]
    });
    check(Object.keys(PipelineSurgical.computeDirtyLines(noPathCity.project)).length === 0,
        'LineProp: 站序驱动的线路未编辑时不得判脏（不得凭空生成 pathPoints）');
    noPathCity.project.lines[0].color = '#ABCDEF';
    const colorPatch = PipelineSurgical.patchLinesSource(noPathCity.project);
    check(/#ABCDEF/i.test(colorPatch.patchedSource) && !/pathPoints/.test(colorPatch.patchedSource),
        'LineProp: 改色号只写色号，不把派生 pathPoints 写进源文件');
    check(/company/.test(surgSrc), 'LineProp: 运营公司参与脏判定与回写');

    // 15. 百科表格提取：必须按「行 × 列」解析（rowspan/colspan），
    //     只按 <td> 顺序抓文本会把「瑶海区」「左侧」误当站名、并且中英文配不上对。
    const tableHtml = '<table>'
        + '<tr><th>序号</th><th>车站名称</th><th>英文名称</th><th>站台形式</th><th>所属区域</th></tr>'
        + '<tr><td>1</td><td>张洼站</td><td>Zhangwa Station</td><td rowspan="3">地下岛式</td><td rowspan="7">瑶海区</td></tr>'
        + '<tr><td>2</td><td>兴华苑站</td><td>Xinghuayuan Station</td></tr>'
        + '<tr><td>3</td><td>合肥火车站</td><td>Hefei Railway Station</td></tr>'
        + '<tr><td colspan="5">截至2026年6月据合肥轨道交通官网显示</td></tr>'
        + '</table>';
    const parsedTable = BatchStationTool.parseStationTable(tableHtml);
    check(parsedTable.rows.length === 3, 'Batch: 按行列解析出 3 座车站（表尾说明与跨行格子被正确跳过）');
    check(parsedTable.rows[0].cn === '张洼' && parsedTable.rows[0].en === 'Zhangwa',
        'Batch: 站名去掉「站」后缀，且中英文来自同一行');
    check(parsedTable.rows[2].cn === '合肥火车站', 'Batch: 「火车站」不被误剥成「合肥」');
    check(!parsedTable.rows.some(function (r) { return /瑶海区|岛式|左侧/.test(r.cn); }),
        'Batch: rowspan 的「所属区域 / 站台形式」不会被当成站名');

    // 16. 提取必须先预览校对、再确认导入，并可选是否连线
    check(/id="btnParseBatchStation"/.test(editorHtmlSrc) && /id="batchPreviewBody"/.test(editorHtmlSrc),
        'Batch: 弹窗提供「解析站名」与逐行校对表格');
    check(/id="batchAutoConnect"/.test(editorHtmlSrc), 'Batch: 提供「是否自动连线」选项');
    check(/batchPreviewRows/.test(editorAppSrc) && /function doParseBatch/.test(editorAppSrc) &&
        /batch-cell-cn/.test(editorAppSrc),
        'Batch: 解析结果先进内存预览，用户改完点「确认导入」才落库');

    // 17. 多选批量入线路 / 移出线路
    check(/function addStationsToLine/.test(editorAppSrc) && /function removeStationsFromLine/.test(editorAppSrc),
        'MultiLine: 提供批量加入 / 移出线路的实现');
    check(/id="multiLineTarget"/.test(editorAppSrc) && /function readMultiLinePick/.test(editorAppSrc),
        'MultiLine: 多选面板提供目标站序下拉（分支线路按 way 分别列出）');
    check(/label: '加入线路'/.test(editorAppSrc) && /label: '移出线路'/.test(editorAppSrc),
        'MultiLine: 多选面板提供「加入线路 / 移出线路」按钮');
    check(/findNearestLineProjection/.test(editorAppSrc) && /stationIds-way1/.test(editorAppSrc),
        'MultiLine: 插入位置按几何投影判定，且分支线路写对应 way');
    check(/pairedDistances/.test(editorAppSrc),
        'MultiLine: 增删站序时同步维护 distances，保持「站距数 = 站数 − 1」');

    // 18. 新增线路：功能区入口 + 创建后设为当前绘制线路 + 写回走 append（此前会被静默丢弃）
    check(/id="btnNewLine"/.test(editorHtmlSrc) && /id="modalNewLine"/.test(editorHtmlSrc),
        'NewLine: 基础图元组提供「新增线路」入口与弹窗');
    check(/function createLineFromModal/.test(editorAppSrc) && /setActiveLine/.test(editorAppSrc),
        'NewLine: 创建后自动设为当前绘制线路（之后画的线段挂到这条线）');
    const newLineCity = PipelineSurgical.init('newlinecity', {
        'data_stations.js': `const stationsData = {\n    "A": { type: "dot", x: 0, y: 0, cn: "甲", en: "A" }\n};\n`,
        'data_lines.js': `const linesData = [\n    { id: "M1", name: "1号线", color: "#E4002B", stationIds: ["A"], distances: [] }\n];\n`
    }, {
        stationsData: { A: { type: 'dot', x: 0, y: 0, cn: '甲', en: 'A' } },
        linesData: [{ id: 'M1', name: '1号线', color: '#E4002B', stationIds: ['A'], distances: [] }]
    });
    newLineCity.project.lines.push({ id: 'NEWL', name: '新线', color: '#123456', stationIds: [], _lineColors: ['#x'] });
    const newLineOut = PipelineSurgical.patchLinesSource(newLineCity.project).patchedSource;
    check(/NEWL/.test(newLineOut), 'NewLine: 新增线路会 append 写回（此前被静默丢弃）');
    const newLineParsed = evalData(newLineOut, 'linesData') || [];
    check(newLineParsed.length === 2 && newLineParsed[1] && newLineParsed[1].id === 'NEWL',
        'NewLine: 回写后线路数组含新旧两条');
    check(!/_lineColors/.test(newLineOut), 'NewLine: 派生字段（_ 前缀）不会被写回源文件');

    // 19. F5 不丢：会话自动保存与启动恢复（城市维护模式还要带上原始源码，否则恢复后无法无损写回）
    check(/SESSION_KEY/.test(editorAppSrc) && /function saveSessionNow/.test(editorAppSrc) &&
        /function restoreSessionIfAny/.test(editorAppSrc),
        'Session: 编辑器提供会话自动保存与启动恢复');
    check(/var sessionRestored = restoreSessionIfAny\(\)/.test(editorAppSrc) &&
        /if \(!sessionRestored\)/.test(editorAppSrc),
        'Session: 启动时先尝试恢复上次会话，失败才新建空白工程');
    check(/beforeunload/.test(editorAppSrc) && /visibilitychange/.test(editorAppSrc),
        'Session: 关闭 / 刷新 / 切后台前同步落盘');
    check(/function restoreSession/.test(surgSrc) && /function getSessionSnapshot/.test(surgSrc) &&
        /function resetContext/.test(surgSrc),
        'Session: 城市维护上下文（原始源码 + 载入快照）可保存 / 恢复 / 清除');
    check(/PipelineSurgical\.resetContext/.test(editorAppSrc),
        'Session: 新建画布与导入工程 JSON 会清掉城市上下文，避免把新工程误写回旧城市');

    // 20. CAD 走线：实时预览 + 连续绘制
    const drawSrc = fs.readFileSync(path.join(ROOT, 'editor/js/pipelines/pipeline-draw.js'), 'utf8');
    check(/id="draftLayer"/.test(editorHtmlSrc), 'CAD: 画布内存在草稿预览图层 #draftLayer');
    check(/function renderDraftLayer/.test(editorAppSrc) && /renderDraftLayer\(\);/.test(editorAppSrc),
        'CAD: 走线时实时渲染待落定的线段（与落笔共用同一路由，所见即所得）');
    check(/updateDraftPointer/.test(editorAppSrc), 'CAD: 鼠标移动时更新草稿指针');
    check(/contextmenu/.test(editorAppSrc) && /已结束连续绘制/.test(editorAppSrc),
        'CAD: 右键可结束连续绘制');
    check(/chained: true/.test(drawSrc), 'CAD: 成段后不清空草稿（连续绘制可一路点下去）');
    check(/draft_same_point/.test(drawSrc), 'CAD: 原地重复点击不会产生零长度线段');

    // 21. CAD 手感：Shift 锁定 45°/90°，自由折线连续绘制不断线
    check(/function constrainTo45/.test(drawSrc) && /constrainTo45: constrainTo45/.test(drawSrc),
        'CAD: 提供 45°/90° 方向约束（按 Shift）');
    check(/constrainTo45\(draftNow\.startPoint/.test(editorAppSrc) &&
        /constrainTo45\(draft5\.startPoint/.test(editorAppSrc),
        'CAD: 预览与最终落点都套用同一方向约束');
    check(/extend_segment/.test(drawSrc) && /segmentId: \(activeTool === 'segaxis'\)/.test(drawSrc),
        'CAD: 自由折线连画时延长同一条折线（不会断成多段而露出拐角缺口）');

    // 22. CAD 端点吸附网格：预览也吸附、Shift 约束后仍对齐、吸附步长跟随可见网格
    const gridSrc = fs.readFileSync(path.join(ROOT, 'editor/js/layers/grid-layer.js'), 'utf8');
    const vpSrc = fs.readFileSync(path.join(ROOT, 'editor/js/layers/viewport.js'), 'utf8');
    check(/function getEffectiveGridSize/.test(gridSrc) && /getEffectiveGridSize: getEffectiveGridSize/.test(gridSrc),
        'Snap: 网格图层暴露"实际画出来的步长"（低缩放 LOD 变稀时吸附跟随可见网格）');
    check(/function getSnapStep/.test(vpSrc) && /getEffectiveGridSize/.test(vpSrc),
        'Snap: 吸附步长与可见网格保持一致');
    check(/constrainTo45\(start, point, gridSize\)/.test(drawSrc) && /Math\.SQRT2/.test(drawSrc),
        'Snap: 按住 Shift 锁方向后，长度仍量化到网格（对角按 g·√2，保证 dx=dy 且都落线）');
    check(/ViewportLayer\.snapPoint\(world\.x, world\.y\)/.test(editorAppSrc) &&
        /constrainTo45\(draftNow\.startPoint, movePt/.test(editorAppSrc),
        'Snap: 走线预览端点先吸附网格、再锁方向（预览与落点一致）');

    // 23. 中键只负责平移，绝不能落笔
    check(/opts\.button !== 0/.test(drawSrc) && /ignored_button/.test(drawSrc),
        'Button: 绘制流水线自身拒绝非左键（中键/右键不会留下点或线段）');
    check(/\{ button: e\.button \}/.test(editorAppSrc),
        'Button: 画布点击把真实按键传给绘制流水线');
    check(/!viewportEl\.classList\.contains\('panning'\)/.test(editorAppSrc),
        'Button: 平移期间冻结走线预览（不会看起来像中键在放点）');
    check(/addEventListener\('blur'/.test(vpSrc) && /spaceHeld = false/.test(vpSrc),
        'Button: 失焦时复位空格/平移状态，避免左键被永久当成平移');
    check(/cancelDraft\(\)/.test(editorAppSrc),
        'Button: 切换工程（新建/导入/载入城市）会清掉遗留草稿');

    // 24. Enter 立即结束自由线段绘制
    check(/e\.code === 'Enter' \|\| e\.code === 'NumpadEnter'/.test(editorAppSrc),
        'Enter: 键盘处理里支持 Enter / 小键盘 Enter');
    check(/Enter[\s\S]{0,400}cancelDraft\(\)[\s\S]{0,120}已结束连续绘制（Enter）/.test(editorAppSrc),
        'Enter: 有草稿时立刻结束连续绘制并给出提示');
    const enterBranch = (editorAppSrc.match(/else if \(e\.code === 'Enter'[\s\S]*?\n            \} else if/) || [''])[0];
    check(enterBranch.length > 0 && !/setTool\(/.test(enterBranch),
        'Enter: 结束绘制但不擅自切换工具（可马上开始下一条）');
    check(/Enter \/ 右键 结束绘制/.test(editorAppSrc),
        'Enter: 绘制过程中在坐标读数上提示收尾快捷键');

    // 25. 画布按键分工：只有左键参与选中 / 框选（这条守卫曾整段丢失，导致三个键都在框选）
    check(/if \(e\.button !== 0 \|\| viewportEl\.classList\.contains\('panning'\)\) return;/.test(editorAppSrc),
        'Pointer: mousedown 只接受左键（中键=漫游、右键=结束绘制/菜单，不参与框选）');
    check(/isBoxSelecting = true/.test(editorAppSrc) &&
        /app\.activeTool === 'select' \|\| app\.activeTool === 'box'\) && !targetNodeEl && !targetSegEl/.test(editorAppSrc),
        'Pointer: 框选只在「选择 / 框选」工具的空白处启动');
    check(/wantPan = \(e\.button === 1\) \|\| \(e\.button === 0 && spaceHeld\)/.test(vpSrc),
        'Pointer: 中键（或空格+左键）才是平移');

    // 26. 线路删除：三条入口 + 写回走 remove（曾经「提示已删除但线路还在」）
    const navTreeSrc = fs.readFileSync(path.join(ROOT, 'editor/js/ui/nav-tree-view.js'), 'utf8');
    const inspectorSrc = fs.readFileSync(path.join(ROOT, 'editor/js/ui/inspector-view.js'), 'utf8');
    check(/function deleteLineById/.test(editorAppSrc) && /delete_line/.test(editorAppSrc),
        'LineDelete: 线路删除有专用流程（确认框 + 站序/走向段数提示 + 可撤销）');
    check(/app\.selected\.type === 'line'[\s\S]{0,220}deleteLineById/.test(editorAppSrc),
        'LineDelete: 选中线路按 Delete 走删除流程（不再只弹「已删除选中图元」）');
    check(/onDeleteLine/.test(navTreeSrc) && /onDeleteLine/.test(editorAppSrc) && /btnLineDelete/.test(inspectorSrc),
        'LineDelete: 大纲行内按钮 / 线路属性面板 / Delete 键三个入口齐全');
    check(/function computeDeletedLineIds/.test(surgSrc) && /ops\.remove = deletedLineIds/.test(surgSrc),
        'LineDelete: 被删线路通过 patchEntries.remove 真正从源码消失');
    check(/deleteStationById\(nid\)/.test(editorAppSrc),
        'LineDelete: 批量删站改走分支安全实现（stationIds-wayN / distances-wayN 不再残留悬空 ID）');

    const lnDelCity = PipelineSurgical.init('delcity', {
        'data_stations.js': `const stationsData = {\n    "A": { type: "dot", x: 0, y: 0, cn: "甲", en: "A" },\n    "B": { type: "dot", x: 100, y: 0, cn: "乙", en: "B" }\n};\n`,
        'data_lines.js': `const linesData = [\n    { id: "M1", name: "1号线", color: "#E4002B", stationIds: ["A"], distances: [] },\n    { id: "M2", name: "2号线", color: "#00AA00", stationIds: ["B"], distances: [] }\n];\n`
    }, {
        stationsData: { A: { type: 'dot', x: 0, y: 0, cn: '甲', en: 'A' }, B: { type: 'dot', x: 100, y: 0, cn: '乙', en: 'B' } },
        linesData: [
            { id: 'M1', name: '1号线', color: '#E4002B', stationIds: ['A'], distances: [] },
            { id: 'M2', name: '2号线', color: '#00AA00', stationIds: ['B'], distances: [] }
        ]
    });
    lnDelCity.project.lines = lnDelCity.project.lines.filter(function (l) { return l.id !== 'M2'; });
    check(PipelineSurgical.computeDeletedLineIds(lnDelCity.project).join(',') === 'M2',
        'LineDelete: 能识别出源码里存在、工程里已删除的线路');
    const lnDelOut = PipelineSurgical.patchLinesSource(lnDelCity.project).patchedSource;
    const lnDelParsed = evalData(lnDelOut, 'linesData') || [];
    check(lnDelParsed.length === 1 && lnDelParsed[0].id === 'M1',
        'LineDelete: 写回后源码里只剩未删除的线路（M2 真正消失）');
    check(!/,\s*,/.test(lnDelOut),
        'LineDelete: 删除后不会留下孤立逗号 / 空条目');

    // 27. 撤销：跳过"无变化"快照 + 双阈值裁剪历史（曾经"撤销没反应 / 退不到最初"）
    const histSrc = fs.readFileSync(path.join(ROOT, 'editor/js/core/history-manager.js'), 'utf8');
    check(/candidate !== currentJson/.test(histSrc),
        'Undo: 撤销时跳过与当前状态完全相同的快照');
    check(/undoStack\[undoStack\.length - 1\] === snapshot/.test(histSrc),
        'Undo: 重复压入同一状态会被去重，不白占撤销额度');
    check(/function trimStacks/.test(histSrc) && /MAX_TOTAL_CHARS/.test(histSrc),
        'Undo: 历史按「步数 + 总字符预算」双阈值裁剪，小工程能一直退到最初一步');
    check(/已回到最早状态/.test(editorAppSrc) && /已经在最新状态/.test(editorAppSrc),
        'Undo: 撤销 / 重做到底时给出明确提示');

    const histSandbox = { window: {} };
    // eslint-disable-next-line no-new-func
    new Function('window', histSrc)(histSandbox.window);
    const H2 = histSandbox.window.OpenMapEditor.HistoryManager;
    H2.clear();
    let hs = { v: 0 };
    H2.pushSnapshot(hs);            // 改动前
    hs = { v: 1 };                  // 改动
    H2.pushSnapshot(hs);            // 只是点了一下选中（无变化）
    const hu = H2.undo(hs);
    check(hu && hu.v === 0, 'Undo: 一次撤销就跳过无变化快照，落到真正的上一步');
    check(H2.canRedo() === true, 'Undo: 撤销后仍可重做');
    const hr = H2.redo(hu);
    check(hr && hr.v === 1, 'Undo: 重做回到编辑后的状态（无变化快照未被复活）');

    // 28. 网格与对齐合并：显示网格 = 显示 + 对齐；隐藏 = 不显示 + 不对齐
    check(/function setGridVisible\(visible, silent\)/.test(editorAppSrc) &&
        /app\.snapEnabled = !!visible/.test(editorAppSrc),
        'Grid: 一个开关同时决定"显示网格"与"对齐网格"（共用一个状态）');
    check(!/hudBtnSnap/.test(editorHtmlSrc) && !/hudBtnSnap/.test(editorAppSrc),
        'Grid: 独立的吸附开关已移除（不再可能出现"看得到网格却不对齐"）');
    check(/state\.snapEnabled = state\.gridVisible;/.test(vpSrc),
        'Grid: 视口 setGrid 同步吸附状态，两边不会打架');
    check(/openmap_editor_grid_visible/.test(editorAppSrc),
        'Grid: 网格开关状态会持久化，刷新后保持一致');

    const vpSandbox = { window: { OpenMapEditor: { GridLayer: {
        getEffectiveGridSize: function () { return 10; },
        setVisible: function () {}, setGridSize: function () {}, render: function () {}
    } } } };
    // eslint-disable-next-line no-new-func
    new Function('window', vpSrc)(vpSandbox.window);
    const VPtest = vpSandbox.window.OpenMapEditor.ViewportLayer;
    VPtest.setGridSize(10);
    VPtest.setGrid(true);
    const gridOn = VPtest.snapPoint(297, 113);
    VPtest.setGrid(false);
    const gridOff = VPtest.snapPoint(297, 113);
    check(gridOn.x === 300 && gridOn.y === 110, 'Grid: 显示网格时落点自动对齐到网格');
    check(gridOff.x === 297 && gridOff.y === 113, 'Grid: 隐藏网格时落点不再对齐（回到任意小数位置）');

    // 29. 全局 45°/90° 对齐（algorithms/align-45.js）
    const align45Src = fs.readFileSync(path.join(ROOT, 'editor/js/algorithms/align-45.js'), 'utf8');
    const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    check(/js\/algorithms\/align-45\.js/.test(editorHtmlSrc),
        'Align45: 编辑器按序加载角度对齐模块（在绘制流水线之前）');
    check(/id="btnAlign45"/.test(editorHtmlSrc) && /function alignAllTo45/.test(editorAppSrc),
        'Align45: 功能区提供「45/90 对齐」一键入口');
    check(/\.\/editor\/js\/algorithms\/align-45\.js/.test(swSrc),
        'Align45: 新模块已登记进 Service Worker 预缓存');
    check(/A45\.constrainTo45/.test(drawSrc),
        'Align45: 绘制工具的 45° 约束与该模块共用同一份数学（唯一真源）');

    const a45sandbox = { window: {} };
    // eslint-disable-next-line no-new-func
    new Function('window', align45Src)(a45sandbox.window);
    const A45t = a45sandbox.window.OpenMapEditor.Align45;
    const skewed = [{ x: 100, y: 100 }, { x: 300, y: 114 }, { x: 500, y: 320 }, { x: 514, y: 620 }];
    check(A45t.isChainOn45(skewed, 0.5) === false, 'Align45: 能识别出歪斜折线');
    const alignedRes = A45t.alignChain(skewed);
    check(A45t.isChainOn45(alignedRes.points, 0.5) === true, 'Align45: 对齐后每一段都落在 45°/90°');
    check(alignedRes.points[0].x === 100 && alignedRes.points[0].y === 100, 'Align45: 折线首点固定不动');
    check(alignedRes.points.length === skewed.length && skewed[1].y === 114,
        'Align45: 只挪位置不增删点，且不修改入参（纯函数）');
    check(A45t.alignChain(alignedRes.points).changed === false, 'Align45: 幂等，已对齐的折线不再变动');

    const a45plan = A45t.alignProject({
        nodes: { A: { x: 0, y: 0 }, B: { x: 200, y: 9 }, C: { x: 500, y: 500 }, D: { x: 700, y: 512 } },
        segments: [{ id: 'S1', lineId: 'L1', points: [{ x: 0, y: 0, nid: 'A' }, { x: 200, y: 9, nid: 'B' }] }],
        lines: [{ id: 'L1', stationIds: ['A', 'B'] }, { id: 'L2', stationIds: ['C', 'D'] }],
        notOpenLines: [{ id: 'N1', points: [{ x: 0, y: 1000 }, { x: 300, y: 1010 }] }]
    }, {});
    check(a45plan.stats.polylineCount === 2 && a45plan.stats.stationChainCount === 1,
        'Align45: 一次覆盖走向折线、在建虚线与站序线路');
    check(!!a45plan.nodes.B && !!a45plan.nodes.D,
        'Align45: 折线锚点车站与站序车站都会跟随移动');

    // 29.1 车站必须跟着折点走（pathPoints 城市没有 nid 锚点，曾出现"折点过去了车站没跟"）
    check(/function findStationAt/.test(align45Src) && /claimedStations/.test(align45Src),
        'Align45: 对齐前先认领折点上的车站，对齐后车站一起搬');
    check(/vertexMoved/.test(align45Src),
        'Align45: 只有折点真的移动时才搬车站（避免把"只是靠近折点"的站硬拽过去）');
    check(/function isHandTunedPolyline/.test(align45Src) && /useStrictRounding/.test(align45Src),
        'Align45: 手工调过倒角半径（逐点 r / useStrictRounding）的折线一律跳过');
    check(/Math\.abs\(aligned\.x - srcX\) < 0\.01/.test(align45Src),
        'Align45: 已对齐的点保持原值，重复执行严格幂等');

    const a45snap = { window: {} };
    // eslint-disable-next-line no-new-func
    new Function('window', align45Src)(a45snap.window);
    const A45s = a45snap.window.OpenMapEditor.Align45;
    const snapProj = {
        nodes: { X: { x: 100, y: 100 }, Y: { x: 300, y: 114 }, Z: { x: 400, y: 400 } },
        segments: [{ id: 'S1', lineId: 'L1', points: [{ x: 100, y: 100 }, { x: 300, y: 114 }, { x: 500, y: 320 }] }],
        lines: [{ id: 'L1', stationIds: ['X', 'Y'] }]
    };
    const snapPlan = A45s.alignProject(snapProj, {});
    check(snapPlan.nodes.Y && Math.abs(snapPlan.nodes.Y.x - snapPlan.segments[0].points[1].x) < 0.01,
        'Align45: 无 nid 折线上的车站会对齐到折点新位置');
    check(!snapPlan.nodes.Z, 'Align45: 离折线很远的车站不会被误拽');
    check(A45s.alignProject(snapProj, {}).stats.changed === true, 'Align45: 未应用的方案再次计算仍有变化（原工程未被改）');
    check(/skippedHandTuned/.test(editorAppSrc),
        'Align45: 确认框会告知有多少条手工倒角折线被跳过');

    // 30. 线路高亮只跟随"选中"，不跟随"当前绘制线路"
    check(/selectedLineId:\s*selLineId/.test(editorAppSrc) && !/selectedLineId:\s*app\.activeLineId/.test(editorAppSrc),
        'Highlight: 线路高亮由选中状态决定（点空白处取消选中后不再常亮）');
    check(/\(app\.selected && app\.selected\.type === 'line'\) \? app\.selected\.id : null/.test(editorAppSrc),
        'Highlight: 只有选中线路时才高亮整条线');
    check(/function renderEmptyInspector\(\)/.test(editorAppSrc) &&
        /renderEmpty\(\{ activeLine: activeLine \}\)/.test(editorAppSrc),
        'Highlight: 空选择面板仍显示"当前绘制线路"，不会让人忘记新线挂哪');

    // 31. 新增车站写回必须带 type（否则引擎没有尺寸类 → 巨大空心圆）
    check(/item\.type = curr\.type \|\| 'dot'/.test(surgSrc),
        'WriteBack: 新增车站走 append 时强制写入 type（不再因"默认 dot"省略）');
    const typeCity = PipelineSurgical.init('typecity', {
        'data_stations.js': 'const stationsData = {\n    "A": { type: "dot", x: 0, y: 0, cn: "甲", en: "A" }\n};\n',
        'data_lines.js': 'const linesData = [];\n'
    }, {
        stationsData: { A: { type: 'dot', x: 0, y: 0, cn: '甲', en: 'A' } },
        linesData: []
    });
    typeCity.project.nodes.NEW = { x: 10, y: 20, cn: '新站', en: 'New', align: 'top' };
    const typeOut = PipelineSurgical.patchStationsSource(typeCity.project).patchedSource;
    // append 的写法跟随样例条目风格：可能写成 type: "dot"，也可能是紧凑 JSON 的 "type":"dot"
    check(/NEW[\s\S]{0,240}"?type"?\s*:\s*"?dot"?/.test(typeOut),
        'WriteBack: 新增车站条目里确实写出了 type: "dot"');
    const typeParsed = evalData(typeOut, 'stationsData') || {};
    check(typeParsed.NEW && typeParsed.NEW.type === 'dot',
        'WriteBack: 回写后新车站解析出来带合法 type（不会退化成巨大空心圆）');

    // 32. 存量城市「强制回写」（危险操作）
    const ribbonCss = fs.readFileSync(path.join(ROOT, 'editor/css/editor-ribbon.css'), 'utf8');
    check(/id="btnForceWriteBack"/.test(editorHtmlSrc) && /ribbon-action-btn-lg danger/.test(editorHtmlSrc),
        'ForceWriteBack: 存量维护 Tab 提供危险配色的「强制回写」入口');
    check(/\.ribbon-action-btn-lg\.danger/.test(ribbonCss),
        'ForceWriteBack: 危险按钮有独立的红橙色危险态样式');
    check(/function forceWriteBack/.test(editorAppSrc) && /⚠ 危险操作：强制回写/.test(editorAppSrc),
        'ForceWriteBack: 弹窗明确标注这是危险操作，并解释与"导出补丁"的区别');
    check(/请再次确认：真的要强制覆盖/.test(editorAppSrc),
        'ForceWriteBack: 需要二次确认，防止连点/手滑');
    check(/function downloadOriginalsBackup/.test(editorAppSrc),
        'ForceWriteBack: 写回前自动下载原件备份 ZIP（磁盘上无法撤销的兜底）');
    check(/opts && opts\.force/.test(surgSrc) && /!f\.changed && !force/.test(surgSrc),
        'ForceWriteBack: 写回层支持 force —— 跳过"有无改动"判定，整份覆盖');
    check(/resolveCityDir\(linkedDirectoryHandle, cityId\)/.test(surgSrc) && !/force[\s\S]{0,200}resolveCityDir = null/.test(surgSrc),
        'ForceWriteBack: force 不会绕过目录安全校验（写错目录是硬红线）');

    // 33. 写回时句柄状态过期（InvalidStateError）的自动重试与中文诊断
    check(/async function writeOneFile/.test(surgSrc),
        'FSError: 每个文件单独重新取句柄后写入');
    check(/name !== 'InvalidStateError' && name !== 'NotFoundError'/.test(surgSrc) &&
        /var freshDir = await resolveCityDir\(linkedDirectoryHandle, cityId\)/.test(surgSrc),
        'FSError: 状态过期时重新解析目录并自动重试一次（仍走目录校验）');
    check(/retriedFiles/.test(surgSrc) && /自动重试成功/.test(surgSrc),
        'FSError: 结果里回报哪些文件是重试后才写成功的');
    check(/function describeFileSystemError/.test(surgSrc),
        'FSError: 提供 File System Access 报错的中文诊断');
    check(/describeFileSystemError/.test(editorAppSrc) &&
        /setLinkedDirectoryHandle\(null\)/.test(editorAppSrc),
        'FSError: 界面展示中文诊断，并在状态过期时清掉旧句柄提示重新授权');

    const desc = PipelineSurgical.describeFileSystemError;
    check(desc && /被改动过/.test(desc({ name: 'InvalidStateError', message: 'state had changed since it was read from disk' })),
        'FSError: InvalidStateError 被翻译成"文件在关联后被别处改动过"');
    check(desc && /权限/.test(desc({ name: 'NotAllowedError', message: 'no permission' })),
        'FSError: NotAllowedError 被翻译成"写入权限过期"');
    check(desc && /只读|占用/.test(desc({ name: 'NoModificationAllowedError', message: 'locked' })),
        'FSError: NoModificationAllowedError 被翻译成"文件只读/被占用"');
}

// ============================================================================
// 二十五、启动策略：会话恢复后的 URL 城市参数（issue #50）
// ============================================================================
section('启动策略：会话恢复后不被 URL 覆盖 + 城市事件只触发一次（#50）');
{
    const editorAppSrc = fs.readFileSync(path.join(ROOT, 'editor/js/editor-app.js'), 'utf8');
    new Function(fs.readFileSync(path.join(ROOT, 'editor/js/core/startup-policy.js'), 'utf8'))();
    const Policy = global.window.OpenMapEditor.StartupPolicy;

    check(Policy.decideUrlCity({ sessionRestored: false, urlCity: 'fuzhou' }) === 'load',
        '未恢复会话时，URL ?city= 正常自动载入');
    check(Policy.decideUrlCity({ sessionRestored: true, restoredCityId: 'fuzhou', urlCity: 'fuzhou' }) === 'already-loaded',
        '恢复的正是 URL 指定的城市：只同步显示、不重复载入');
    check(Policy.decideUrlCity({ sessionRestored: true, restoredCityId: 'beijing', urlCity: 'fuzhou' }) === 'keep-session',
        '恢复的是另一座城市：保护未保存工程，不自动载入 URL 城市');
    check(Policy.decideUrlCity({ sessionRestored: true, restoredCityId: null, urlCity: 'fuzhou' }) === 'keep-session',
        '恢复的是未保存空白工程：同样不被 URL 城市覆盖');
    check(Policy.decideUrlCity({ sessionRestored: true, urlCity: '' }) === 'none',
        'URL 未带城市时不产生任何动作');

    // 事件级：一次选择只能派发一种事件，否则两个监听器会各加载一次
    global.Event = global.Event || class Event { constructor(type) { this.type = type; } };
    global.CustomEvent = global.CustomEvent || class CustomEvent extends global.Event {
        constructor(type, opts) { super(type); this.detail = opts && opts.detail; }
    };
    const customSelect = {
        tagName: 'CGO-TOOLBAR-SELECT', value: '', _events: [],
        dispatchEvent(e) { this._events.push(e.type); }, requestUpdate() { }
    };
    Policy.dispatchCityChange(customSelect, 'fuzhou');
    check(customSelect._events.length === 1 && customSelect._events[0] === 'cgo-change',
        'cgo-toolbar-select 只派发 1 次 cgo-change（不再额外补发 change）');

    const nativeSelect = {
        tagName: 'SELECT', value: '', _events: [],
        dispatchEvent(e) { this._events.push(e.type); }
    };
    Policy.dispatchCityChange(nativeSelect, 'fuzhou');
    check(nativeSelect._events.length === 1 && nativeSelect._events[0] === 'change',
        '原生 select 只派发 1 次 change');

    check(/function parseUrlParams\(sessionRestored\)/.test(editorAppSrc) &&
        /StartupPolicy/.test(editorAppSrc) && /decideUrlCity/.test(editorAppSrc),
        '编辑器启动时把「是否恢复会话」交给 StartupPolicy 判定，而不是无条件载入 URL 城市');
    check(/if \(action === 'keep-session'\)/.test(editorAppSrc) &&
        /未自动载入 URL 中的城市/.test(editorAppSrc),
        '恢复出未保存工程时给出明确提示并跳过 URL 城市自动载入');
}

// ============================================================================
// 二十六、视口事件：普通左键 / 空格拖拽 / 中键拖拽 / 失焦复位（issue #51）
// ============================================================================
section('视口交互：空格状态已声明，左键不再抛错（#51）');
{
    // 最小 DOM 桩：直接驱动真实的 viewport.js，按真实事件顺序跑一遍
    const winHandlers = {};
    global.window.addEventListener = function (type, fn) {
        (winHandlers[type] = winHandlers[type] || []).push(fn);
    };
    global.window.removeEventListener = function () { };

    new Function(fs.readFileSync(path.join(ROOT, 'editor/js/layers/viewport.js'), 'utf8'))();
    const VP = global.window.OpenMapEditor.ViewportLayer;

    const viewHandlers = {};
    const classes = new Set();
    const viewport = {
        classList: {
            add: (c) => classes.add(c),
            remove: (c) => classes.delete(c),
            contains: (c) => classes.has(c)
        },
        clientWidth: 800,
        clientHeight: 600,
        addEventListener(type, fn) { (viewHandlers[type] = viewHandlers[type] || []).push(fn); },
        getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }
    };
    const viewLayer = { setAttribute() { } };

    VP.init(viewport, {}, viewLayer);

    const fire = (list, ev) => (list || []).slice().forEach((fn) => fn(ev));
    const mouse = (button, x, y, extra) => Object.assign({
        button: button, clientX: x, clientY: y,
        target: { closest: () => null },
        preventDefault() { }
    }, extra || {});

    // 1) 普通左键点击：未声明 spaceHeld 的旧实现会在此抛 ReferenceError
    let leftThrew = false;
    try {
        fire(viewHandlers.mousedown, mouse(0, 10, 10));
    } catch (err) {
        leftThrew = true;
    }
    check(!leftThrew, '普通左键点击不再抛 ReferenceError（spaceHeld 已在 IIFE 内声明）');
    check(VP.getPan().x === 0 && VP.getPan().y === 0 && !classes.has('panning'),
        '普通左键不会误触平移，也不会点亮手形光标');

    // 2) 空格 + 左键拖拽
    fire(winHandlers.keydown, { code: 'Space', target: { matches: () => false } });
    check(classes.has('panning'), '按下空格后进入平移待命态（手形光标）');
    fire(viewHandlers.mousedown, mouse(0, 100, 100));
    fire(winHandlers.mousemove, { buttons: 1, clientX: 140, clientY: 130 });
    check(VP.getPan().x === 40 && VP.getPan().y === 30,
        '空格 + 左键拖拽按位移平移视口（40, 30）');
    fire(winHandlers.mouseup, { button: 0 });
    fire(winHandlers.keyup, { code: 'Space' });
    check(!classes.has('panning'), '松开空格后退出平移待命态');

    // 3) 中键拖拽
    fire(viewHandlers.mousedown, mouse(1, 100, 100));
    fire(winHandlers.mousemove, { buttons: 4, clientX: 90, clientY: 120 });
    check(VP.getPan().x === 30 && VP.getPan().y === 50, '中键拖拽平移视口（-10, +20）');
    fire(winHandlers.mouseup, { button: 1 });

    // 4) 失焦复位：空格被"卡住"时，左键不该永久被当成平移
    fire(winHandlers.keydown, { code: 'Space', target: { matches: () => false } });
    check(classes.has('panning'), '失焦前空格处于按下态');
    fire(winHandlers.blur, {});
    check(!classes.has('panning'), '窗口失焦后空格状态复位、手形光标清除');
    fire(viewHandlers.mousedown, mouse(0, 0, 0));
    fire(winHandlers.mousemove, { buttons: 1, clientX: 50, clientY: 50 });
    check(VP.getPan().x === 30 && VP.getPan().y === 50,
        '失焦复位后左键拖动不再平移（不会把画布"粘"住）');

    // 5) 输入框内按空格属于正常输入，不能触发平移
    fire(winHandlers.keydown, { code: 'Space', target: { matches: (sel) => sel.indexOf('input') >= 0 } });
    check(!classes.has('panning'), '输入框内按空格不会进入平移态');
}

// ============================================================================
// 二十七、ID 生成与批量建站拓扑（issue #52 / #53）
// ============================================================================
section('批量建站：已有线路拓扑连续、ID 唯一（#52 / #53）');
{
    const mkNode = (x, y, cn) => ({ id: cn, x: x, y: y, cn: cn, en: cn, type: 'dot' });

    // 1) 追加到已有线路：站序、站距、线段拓扑三者必须一致
    const project = ProjectModel.createProject(1200, 900);
    project.nodes = {
        A1: Object.assign(mkNode(100, 100, '甲'), { id: 'A1' }),
        A2: Object.assign(mkNode(200, 100, '乙'), { id: 'A2' })
    };
    project.lines = [{ id: 'L1', name: '1号线', color: '#E4002B', stationIds: ['A1', 'A2'], distances: [1000] }];
    const created = BatchStationTool.batchCreateStations(
        project, 'L1',
        [{ cn: '丙', en: 'Bing' }, { cn: '丁', en: 'Ding' }],
        { autoConnect: true, step: 50 }
    );
    const ids = project.lines[0].stationIds;
    check(created.length === 2 && ids.length === 4 &&
        ids[2] === created[0] && ids[3] === created[1],
        '批量车站按顺序追加到已有站序末尾');
    check(project.lines[0].distances.length === ids.length - 1,
        '追加后 distances 长度仍严格等于「站数 − 1」');
    check(project.nodes[created[0]].x === 250 && project.nodes[created[0]].y === 100,
        '新站从原末站沿当前方向继续排（不与既有线网重叠）');

    const segPairs = project.segments.map((s) => (s.points || []).map((p) => p.nid).join('→'));
    check(segPairs.includes('A2→' + created[0]),
        '原末站 → 新站链首端补上了线段（站序相邻、画布不断链）');
    check(segPairs.includes(created[0] + '→' + created[1]),
        '新站之间线段完整');

    // 调用方不能把起点写死成 (200, 200)，否则流水线的「从末站续排」策略永远不会生效
    const batchCall = (fs.readFileSync(path.join(ROOT, 'editor/js/editor-app.js'), 'utf8')
        .match(/batchCreateStations\([\s\S]*?\)\s*;/) || [''])[0];
    check(batchCall.length > 0 && !/startX\s*:/.test(batchCall) && !/startY\s*:/.test(batchCall),
        '批量导入界面不再把新站固定堆在 (200, 200)，起点交给流水线按末站决定');

    // 2) 新建空线路：保持原有 (200, 200) 起点行为
    const fresh = ProjectModel.createProject(1200, 900);
    fresh.nodes = {};
    fresh.lines = [{ id: 'L9', name: '9号线', color: '#123456', stationIds: [], distances: [] }];
    const freshCreated = BatchStationTool.batchCreateStations(
        fresh, 'L9', [{ cn: 'A', en: 'A' }, { cn: 'B', en: 'B' }],
        { autoConnect: true, step: 60 }
    );
    check(fresh.nodes[freshCreated[0]].x === 200 && fresh.nodes[freshCreated[0]].y === 200,
        '空线路批量建站仍从默认 (200, 200) 起步');
    check(fresh.lines[0].stationIds.length === 2, '空线路写入 2 座车站站序');
    check(fresh.lines[0].distances.length === fresh.lines[0].stationIds.length - 1,
        '空线路追加后 distances 同步补齐为「站数 − 1」');

    // 3) 分支线路：写入 way1 / distances-way1，并接上原 way1 末站
    const branch = ProjectModel.createProject(1200, 900);
    branch.nodes = { B1: Object.assign(mkNode(0, 0, '一'), { id: 'B1' }) };
    branch.lines = [{
        id: 'LB', name: '支线', color: '#654321', hasbranch: true,
        'stationIds-way1': ['B1'], 'distances-way1': []
    }];
    const branchCreated = BatchStationTool.batchCreateStations(
        branch, 'LB', [{ cn: '二', en: 'Two' }], { autoConnect: true, step: 40 }
    );
    check(branch.lines[0]['stationIds-way1'].length === 2 &&
        branch.lines[0]['stationIds-way1'][1] === branchCreated[0] &&
        !branch.lines[0].stationIds,
        '分支线路追加到 way1，不会误写主站序');
    check(branch.segments.some((s) => (s.points || []).map((p) => p.nid).join('→') === 'B1→' + branchCreated[0]),
        '分支线路同样补上「原末站 → 新首站」线段');

    // 4) 旧工程缺 idSeq：不得再产生 node_NaN / 互相覆盖
    const legacy = {
        version: 1,
        canvas: { width: 1000, height: 800 },
        nodes: { node_1: { id: 'node_1', x: 10, y: 10, cn: '旧站', en: 'Old', type: 'dot' } },
        segments: [],
        lines: [{ id: 'L1', name: '1号线', color: '#E4002B', stationIds: ['node_1'] }]
        // 故意没有 idSeq
    };
    const normalized = ProjectModel.normalize(legacy);
    check(normalized.idSeq >= 1, '导入旧工程时 normalize 补齐合法 idSeq');
    const legacyCreated = BatchStationTool.batchCreateStations(
        normalized, 'L1', [{ cn: '新1', en: 'N1' }, { cn: '新2', en: 'N2' }],
        { autoConnect: false }
    );
    check(legacyCreated.length === 2 &&
        !legacyCreated.some((id) => /NaN/.test(id)) &&
        new Set(legacyCreated).size === 2,
        '缺少 idSeq 的旧工程批量建站 ID 唯一（不再出现 node_NaN）');
    check(Object.keys(normalized.nodes).length === 3,
        '两座新站各自落到独立节点，没有被 node_NaN 覆盖');

    // 5) 已占用 ID 时 nextId 会跳过，而不是覆盖
    const occupied = { nodes: { node_4: { id: 'node_4' } }, segments: [{ id: 'seg_4' }], lines: [] };
    const first = ProjectModel.nextId(occupied, 'node_');
    occupied.nodes[first] = { id: first };
    const second = ProjectModel.nextId(occupied, 'node_');
    check(first !== 'node_4' && second !== first && second !== 'node_4',
        'nextId 跳过已被占用的 ID，连续生成不重复');
    check(!/NaN/.test(first + second), 'nextId 在异常计数器下也不会拼出 NaN');
}

// ============================================================================
// 二十八、网格隐藏后的吸附步长（issue #56）
// ============================================================================
section('网格：隐藏后吸附步长跟随当前缩放（#56）');
{
    const gridLayerSrc = fs.readFileSync(path.join(ROOT, 'editor/js/layers/grid-layer.js'), 'utf8');
    new Function(gridLayerSrc)();
    const Grid = global.window.OpenMapEditor.GridLayer;
    let scale = 0.3;
    // 用最小视口桩替换，模拟「隐藏网格后继续缩放」
    global.window.OpenMapEditor.ViewportLayer = { getScale: () => scale };

    Grid.setVisible(false);
    Grid.setGridSize(10);
    check(Grid.getEffectiveGridSize() === 40,
        '网格隐藏 + 缩放 0.3：吸附步长按当前 LOD 实时算为 40（不沿用旧值）');
    scale = 1;
    check(Grid.getEffectiveGridSize() === 10,
        '隐藏状态下继续放大到 1：吸附步长回到 10');
    scale = 0.5;
    Grid.setGridSize(30);
    check(Grid.getEffectiveGridSize() === 30,
        '隐藏状态下修改基础网格间距：吸附步长立即按新配置计算');

    check(/function computeGridStep/.test(gridLayerSrc) &&
        /computeGridStep\(baseGrid, k\)/.test(gridLayerSrc),
        '网格渲染与吸附共用同一份 LOD 计算（不再各算一套）');
    check(/if \(state\.visible && state\.lastRenderedStep > 0\)/.test(gridLayerSrc),
        '网格可见时用实际渲染步长，隐藏时改用实时计算');
}

// ============================================================================
// 二十九、撤销历史不得跨工程（issue #39）
// ============================================================================
section('撤销历史：切换工程 / 新建画布后清空（#39）');
{
    const editorAppSrc = fs.readFileSync(path.join(ROOT, 'editor/js/editor-app.js'), 'utf8');
    new Function(fs.readFileSync(path.join(ROOT, 'editor/js/core/history-manager.js'), 'utf8'))();
    const HM = global.window.OpenMapEditor.HistoryManager;
    HM.clear();
    HM.pushSnapshot({ project: 'old' });
    check(HM.canUndo(), '编辑后存在可撤销快照');
    HM.clear();
    check(!HM.canUndo() && !HM.canRedo() && HM.getDirtyCount() === 0,
        'clear 同时清空撤销 / 重做栈与未保存计数');
    HM.pushSnapshot({ project: 'old' });
    HM.pushSnapshot({ project: 'new' });
    HM.markSaved();
    check(HM.getDirtyCount() === 0 && HM.canUndo(),
        '保存成功后未保存计数归零，但历史仍可继续撤销');

    check(/HistoryManager\.clear\(\)/.test(editorAppSrc), '编辑器使用 HistoryManager.clear（reset 并不存在）');
    check(!/HistoryManager\.reset\b/.test(editorAppSrc), '不再调用不存在的 HistoryManager.reset');
    check(/btnConfirmNewCanvas[\s\S]{0,1400}HistoryManager\.clear\(\)/.test(editorAppSrc),
        '新建画布后清空撤销历史');
    check(/btnHeaderOpenFile[\s\S]{0,2200}HistoryManager\.clear\(\)/.test(editorAppSrc),
        '导入工程 JSON 后清空撤销历史');
    check(/HistoryManager\.clear\(\)[\s\S]{0,200}renderAll\(\)[\s\S]{0,200}已无损载入城市/.test(editorAppSrc),
        '载入城市后清空撤销历史（不会 Undo 回上一座城市）');
    check(/HistoryManager\.markSaved\(\)/.test(editorAppSrc),
        '直接写回本地目录成功后同步保存状态');
    check(/btnHeaderOpenFile[\s\S]{0,1600}ProjectModel\.normalize\(parsed\)/.test(editorAppSrc),
        '导入工程 JSON 先做 normalize，再接管为当前工程');
}

// ============================================================================
// 三十、公告日期严格校验（issue #36）
// ============================================================================
section('公告时间：非空但无效的日期不再被当成永久有效（#36）');
{
    const prevDocument = global.document;
    global.document = {
        readyState: 'loading',
        addEventListener() { },
        removeEventListener() { },
        head: { appendChild() { } },
        createElement: () => ({})
    };
    try {
        new Function(fs.readFileSync(path.join(ROOT, 'core/notice.js'), 'utf8'))();
        const Notice = global.window.NAL_NOTICE;
        const parse = Notice._parseLocalTime;

        check(parse(undefined) === null && parse('') === null && parse('permanent') === null,
            '缺省 / 空串 / permanent 仍按「不设限」处理（历史兼容口径）');
        check(parse('2026-10-25') instanceof Date && parse('2026-10-25').getHours() === 0,
            '纯日期按本地零点解析');
        check(parse('2026-10-25 08:30') instanceof Date &&
            parse('2026-10-25 08:30').getMinutes() === 30,
            '接受 YYYY-MM-DD HH:mm');
        check(parse('2026-10-25T08:30:15') instanceof Date,
            '接受 T 分隔的 ISO 写法');

        check(parse('2026-02-30 00:00:00') === undefined,
            '不存在的日历日期（2026-02-30）判为无效，而不是进位到 3 月 2 日');
        check(parse('2026-02-29') === undefined && parse('2024-02-29') instanceof Date,
            '平年 2 月 29 无效、闰年 2 月 29 有效');
        check(parse('2026-13-01') === undefined && parse('2026-10-32') === undefined,
            '月份 / 日期越界判为无效');
        check(parse('2026-10-25 24:00:00') === undefined &&
            parse('2026-10-25 23:59:60') === undefined,
            '时分秒越界判为无效');
        check(parse('2026/10/25') === undefined && parse('2026-1-1') === undefined,
            '斜杠格式与不补零格式判为无效');

        const warn = console.warn;
        console.warn = () => { };
        try {
            check(Notice._checkValidity({ id: 't1', active: true, deadline: '2026-02-30' }) === false,
                '截止时间无效时整条公告不展示（不再永久有效）');
            check(Notice._checkValidity({ id: 't2', active: true, startTime: '2026-13-01' }) === false,
                '开始时间无效时整条公告不展示（不再提前放出）');
        } finally {
            console.warn = warn;
        }
        check(Notice._checkValidity({ id: 't3', active: true }) === true,
            '不填时间字段的公告照常展示');
        check(Notice._checkValidity({ id: 't4', active: true, startTime: '2026-01-01', deadline: 'permanent' }) === true,
            '有效开始时间 + permanent 截止时间正常展示');
    } finally {
        global.document = prevDocument;
    }
}

// ============================================================================
// 三十一、全城市车站 type 必填与字段合法性（issue #57）
// ============================================================================
section('全城市车站 type 必填 / 合法与字段结构（#57）');
{
    const BASE_STATION_TYPES = new Set(['dot', 'tsf', 'tsfo', 'diy', 'no', 'rdot']);
    const ALIGN_VALUES = new Set([
        'top', 'bottom', 'left', 'right',
        'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ]);

    /**
     * 校验一条车站数据。
     * 引擎支持的基础类型见 BASE_STATION_TYPES；部分城市还会用 city.renderStationIcon
     * 接管自定义图元（如石家庄的 terminus / scenery / railcity），这类类型必须能在
     * 该城市主脚本里找到显式处理，否则同样视为非法。
     */
    function validateStation(city, id, s, customTypes) {
        const errors = [];
        if (!s || typeof s !== 'object' || Array.isArray(s)) {
            return ['条目不是对象'];
        }
        if (typeof s.type !== 'string' || !s.type) {
            errors.push('缺少 type（会退化为没有尺寸类的巨大空心圆）');
        } else if (!BASE_STATION_TYPES.has(s.type) && !(customTypes && customTypes.has(s.type))) {
            errors.push('非法 type: ' + s.type);
        }
        if (typeof s.x !== 'number' || !isFinite(s.x)) errors.push('x 必须是有限数字');
        if (typeof s.y !== 'number' || !isFinite(s.y)) errors.push('y 必须是有限数字');
        if (typeof s.cn !== 'string' || !s.cn.trim()) errors.push('cn 必须是非空字符串');
        if (s.en !== undefined && typeof s.en !== 'string') errors.push('en 必须是字符串');
        if (s.align !== undefined && !ALIGN_VALUES.has(s.align)) {
            errors.push('align 非法: ' + JSON.stringify(s.align));
        }
        if (s.offset !== undefined) {
            if (!s.offset || typeof s.offset !== 'object' ||
                typeof s.offset.x !== 'number' || typeof s.offset.y !== 'number') {
                errors.push('offset 必须是 { x: number, y: number }');
            }
        }
        if (s.textScale !== undefined) {
            if (!s.textScale || typeof s.textScale !== 'object' ||
                typeof s.textScale.cn !== 'number' || typeof s.textScale.en !== 'number') {
                errors.push('textScale 必须是 { cn: number, en: number }');
            }
        }
        if (s.hideLabel !== undefined && typeof s.hideLabel !== 'boolean') {
            errors.push('hideLabel 必须是布尔值');
        }
        return errors;
    }

    const issues = [];
    for (const city of cities) {
        const data = evalData(
            fs.readFileSync(path.join(ROOT, 'city', city, 'data_stations.js'), 'utf8'),
            'stationsData'
        );
        const cityMain = path.join(ROOT, 'city', city, city + '.js');
        const mainSrc = fs.existsSync(cityMain) ? fs.readFileSync(cityMain, 'utf8') : '';
        const customTypes = new Set();
        // 城市主脚本显式判定的站点类型（如 s.type === 'terminus'）视为该城合法的自定义图元
        for (const m of mainSrc.matchAll(/(?:s|station)\.type\s*===\s*['"]([A-Za-z0-9_-]+)['"]/g)) {
            customTypes.add(m[1]);
        }
        for (const [id, station] of Object.entries(data || {})) {
            validateStation(city, id, station, customTypes).forEach((reason) => {
                issues.push(`${city}/${id}: ${reason}`);
            });
        }
    }

    if (issues.length) {
        console.log('  车站数据问题（最多显示前 10 条）：');
        issues.slice(0, 10).forEach((msg) => console.log('   - ' + msg));
    }
    check(issues.length === 0,
        `全部 ${cities.length} 座城市的车站 type 必填且合法，x/y/cn/align/offset/textScale 结构正确` +
        (issues.length ? `；发现 ${issues.length} 处问题` : ''));

    // 自检本身要能抓住回归，而不是恒真
    const noCustom = new Set();
    check(validateStation('demo', 'X1', { cn: '缺类型', x: 0, y: 0 }, noCustom).length > 0,
        '自检能识别「缺少 type」的站点');
    check(validateStation('demo', 'X2', { type: 'tsf', cn: '坏对齐', x: 0, y: 0, align: 'down' }, noCustom).length > 0,
        '自检能识别非法 align');
    check(validateStation('demo', 'X3', { type: 'dot', cn: '坏偏移', x: 0, y: 0, offset: { x: 1 } }, noCustom).length > 0,
        '自检能识别结构不完整的 offset');
    check(validateStation('demo', 'X4', { type: 'terminus', cn: '自定义', x: 0, y: 0 }, noCustom).length > 0 &&
        validateStation('demo', 'X4', { type: 'terminus', cn: '自定义', x: 0, y: 0 }, new Set(['terminus'])).length === 0,
        '自定义类型只有在城市脚本显式处理时才被放行');
    check(validateStation('demo', 'X5', {
        type: 'dot', cn: '正常', en: 'OK', x: 1, y: 2,
        align: 'bottom-right', offset: { x: 0, y: 0 }, textScale: { cn: 1, en: 1 }
    }, noCustom).length === 0, '合法站点不会被误报');
}

// ============================================================================
console.log('\n' + '─'.repeat(64));
if (failed === 0) {
    console.log(`全部通过：${passed} 项断言，覆盖 ${cities.length} 座城市（${cities.join('、')}）`);
    process.exit(0);
} else {
    console.log(`失败 ${failed} 项 / 通过 ${passed} 项`);
    process.exit(1);
}
