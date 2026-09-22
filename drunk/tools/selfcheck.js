/**
 * CGo OpenMap - Drunk 纯函数层回归自检 (drunk/tools/selfcheck.js)
 *
 * ==============================================================================
 * 用途
 * ==============================================================================
 * 在项目根目录执行：
 *
 *     node drunk/tools/selfcheck.js
 *
 * 零依赖、零构建、不需要浏览器。覆盖 Drunk 中两块**纯逻辑**且一旦出错后果最重的代码：
 *
 * 1. `city_project_io.js` —— 城市工程的条目级无损回写。
 *    这里出错的后果是**静默损毁已经逐像素校准过的城市数据**（悉尼的 marker/halo、
 *    北京的 textScale、线路的 pathPoints 折点等），且往往要等到渲染时才被发现。
 *    因此本脚本会拿 `city/` 下**全部真实城市数据**跑往返验证，逐条断言：
 *    改动生效、其余条目零改动、未被改的字段完好、diff 只有一两行。
 *
 * 2. `drunk_sanitizer.js` —— 识别结果净化与整体几何校正。
 *
 * 任何一项失败都会以非零状态码退出，便于挂进 CI 或提交前手动跑一遍。
 * ==============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// city_project_io.js 是浏览器端脚本，挂在 window 上；这里给个最小垫片即可复用
global.window = global.window || {};
new Function(fs.readFileSync(path.join(ROOT, 'drunk/js/city_project_io.js'), 'utf8'))();
new Function(fs.readFileSync(path.join(ROOT, 'drunk/js/openmap_codegen.js'), 'utf8'))();
const IO = global.window.CityProjectIO;
const CodeGen = global.window.DrunkCodeGen;
const Sanitizer = require(path.join(ROOT, 'drunk/js/drunk_sanitizer.js'));

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
    // 一旦复刻两份，Drunk 的预览就会和线路图的实际渲染悄悄漂移。
    const engineSrc = fs.readFileSync(path.join(ROOT, 'core/script.js'), 'utf8');
    check(engineSrc.includes('window.CGoPathGeometry.generateRoundedPath'),
        'core/script.js 委托给共享几何模块');
    check(!/for\s*\(let i = 1; i < points\.length - 1; i\+\+\)/.test(engineSrc),
        'core/script.js 未残留第二份倒角实现');

    const drunkSrc = fs.readFileSync(path.join(ROOT, 'drunk/js/drunk_pipeline.js'), 'utf8');
    check(drunkSrc.includes('CGoPathGeometry.generateRoundedPath'),
        'Drunk 画布预览走同一份倒角实现');

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
// 引擎 renderLines 首行就是 `if (line.isPointOnly) return;`。Drunk 早先没认这个
// 标志，退到「按站序直连」兜底，把北京「中国铁路」24 座散布全城的国铁车站
// 从延庆一路连到大兴，画布上凭空多出一堆横穿全图的长斜线。
section('isPointOnly 线路不得绘制走向');
{
    const G2 = require(path.join(ROOT, 'core/path-geometry.js'));
    const engineSrc = fs.readFileSync(path.join(ROOT, 'core/script.js'), 'utf8');
    const drunkSrc = fs.readFileSync(path.join(ROOT, 'drunk/js/drunk_pipeline.js'), 'utf8');

    // 走向来源的判定只能有一份：两侧都必须调用共享的 lineSegments
    check(engineSrc.includes('CGoPathGeometry.lineSegments'), '引擎走向判定走共享 lineSegments');
    check(drunkSrc.includes('CGoPathGeometry.lineSegments'), 'Drunk 走向判定走共享 lineSegments');
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
    const drunkSrc = fs.readFileSync(path.join(ROOT, 'drunk/js/drunk_pipeline.js'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');

    check(engineSrc.includes('window.CGoStationIcons'), '引擎图元模板走共享模块');
    check(!/const SVGTemplates = \{/.test(engineSrc), '引擎未残留第二份图元模板');
    check(drunkSrc.includes('Icons.iconHtmlFor'), 'Drunk 画布走同一份图元模板');

    // STATION_SIZE 必须与 css/style.css 的 .dot/.tsf 等尺寸一致——
    // 引擎靠 CSS 定尺寸、Drunk 靠这张表定尺寸，不同步就会一大一小。
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

// ============================================================================
console.log('\n' + '─'.repeat(64));
if (failed === 0) {
    console.log(`全部通过：${passed} 项断言，覆盖 ${cities.length} 座城市（${cities.join('、')}）`);
    process.exit(0);
} else {
    console.log(`失败 ${failed} 项 / 通过 ${passed} 项`);
    process.exit(1);
}
