#!/usr/bin/env node
/**
 * 全站版本号一致性检查（AGENTS.md 铁律四的执行脚本）
 *
 * 校验内容：
 *   1. 每个页面 / 脚本里出现的 `?v=`、`var v`、`const version` 版本串格式为 yymmdd.hhmmss；
 *   2. 全站所有版本串完全一致（含 sw.js 的 CACHE_NAME）；
 *   3. sw.js 的 CACHE_NAME 与页面版本号相同。
 *
 * 用法：node scripts/check-site-version.mjs
 * 退出码：0 = 通过，1 = 不一致或格式错误
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// 收录全站需要携带版本号的文件（新增页面时在这里登记）
const FILES = [
    'main.html',
    'index.html',
    'editor/index.html',
    'privacy.html',
    'readme.html',
    'sw.js',
];

// 注意：不能加前导 \b —— sw.js 里版本串紧跟在 `v` 后面（cgo-openmap-v261030.212000），
// `v` 与数字都是单词字符，之间不存在单词边界。
const VERSION_RE = /(?<![\d.])(\d{6}\.\d{6})(?![\d.])/g;
const FORMAT_RE = /^\d{6}\.\d{6}$/;

const hits = new Map(); // version -> [file:count]
const problems = [];

for (const rel of FILES) {
    const full = join(ROOT, rel);
    if (!existsSync(full)) {
        problems.push(`缺少文件：${rel}`);
        continue;
    }
    const text = readFileSync(full, 'utf8');
    const found = [...text.matchAll(VERSION_RE)].map((m) => m[1]);
    if (!found.length) {
        problems.push(`${rel}：没有任何 yymmdd.hhmmss 版本串`);
        continue;
    }
    for (const v of found) {
        if (!FORMAT_RE.test(v)) problems.push(`${rel}：格式不合法 ${v}`);
        if (!hits.has(v)) hits.set(v, []);
        hits.get(v).push(rel);
    }
}

// sw.js 的 CACHE_NAME 必须存在且与页面版本一致
const swText = existsSync(join(ROOT, 'sw.js')) ? readFileSync(join(ROOT, 'sw.js'), 'utf8') : '';
const cache = /const CACHE_NAME = 'cgo-openmap-v([^']*)'/.exec(swText);
if (!cache) {
    problems.push("sw.js：未找到 const CACHE_NAME = 'cgo-openmap-v...'");
} else if (!FORMAT_RE.test(cache[1])) {
    problems.push(`sw.js：CACHE_NAME 版本格式不合法 ${cache[1]}`);
}

const versions = [...hits.keys()].sort();
if (versions.length > 1) {
    const detail = versions
        .map((v) => `  ${v}  ←  ${[...new Set(hits.get(v))].join('、')}`)
        .join('\n');
    problems.push(`全站存在 ${versions.length} 个不同版本号：\n${detail}`);
}

if (problems.length) {
    console.error('❌ 版本号检查未通过：\n');
    for (const p of problems) console.error(' - ' + p);
    console.error('\n修复：把下列文件的 ?v= / var v / CACHE_NAME 统一为同一个 yymmdd.hhmmss\n  ' +
        FILES.join('\n  '));
    process.exit(1);
}

const v = versions[0];
const total = [...hits.values()].reduce((a, b) => a + b.length, 0);
console.log(`✅ 全站版本号一致：${v}（${total} 处引用，覆盖 ${FILES.length} 个文件）`);
