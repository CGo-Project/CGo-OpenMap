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
        lines.forEach(l => { IO.lineStationGroups(l); IO.linePathGroups(l); IO.lineAllStationIds(l); });
        report = CodeGen.validateData(stations, lines);
    } catch (err) { ok = false; report = { errors: [err.message] }; }

    const branch = lines.filter(l => l.hasbranch).length;
    check(ok && report.errors.length === 0,
        `${city}: ${lines.length} 条线路（含 ${branch} 条分支线）遍历与完整性自检零错误`
        + (report && report.warnings ? `，${report.warnings.length} 项告警` : ''));
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
