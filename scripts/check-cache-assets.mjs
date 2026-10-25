#!/usr/bin/env node
/**
 * 校验 sw.js 的 ASSETS_TO_CACHE 中登记的本地资源是否真的存在。
 *
 * 背景：city 目录搬迁或站徽更名后，预缓存清单容易残留指向不存在文件的条目，
 * 安装 SW 时会产生 404 与无效请求（见 issue #38）。此脚本用于提交前自检。
 *
 * 用法：
 *   node scripts/check-cache-assets.mjs            # 校验，缺失即非零退出
 *   node scripts/check-cache-assets.mjs --warn     # 只告警，不失败
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const warnOnly = process.argv.includes('--warn');
const swPath = join(root, 'sw.js');

const source = readFileSync(swPath, 'utf8');
const block = /ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\]/.exec(source);
if (!block) {
    console.error('未在 sw.js 中找到 ASSETS_TO_CACHE 数组');
    process.exit(1);
}

const entries = [...block[1].matchAll(/['"]([^'"]+)['"]/g)]
    .map((m) => m[1])
    .filter((p) => !/^(https?:)?\/\//.test(p) && !p.startsWith('data:'));

const missing = [];
for (const entry of entries) {
    const rel = entry.replace(/^\.\//, '').replace(/[?#].*$/, '');
    if (!existsSync(join(root, rel))) missing.push(entry);
}

const total = entries.length;
if (missing.length === 0) {
    console.log(`✅ ASSETS_TO_CACHE 全部命中：${total} 项本地资源均存在`);
    process.exit(0);
}

console.error(`⚠️  ${missing.length}/${total} 项登记的资源不存在：`);
for (const m of missing) console.error(`   - ${m}`);
console.error('\n请从 sw.js 的 ASSETS_TO_CACHE 中删除，或补齐对应文件。');
process.exit(warnOnly ? 0 : 1);
