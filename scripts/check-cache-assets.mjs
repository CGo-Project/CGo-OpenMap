#!/usr/bin/env node
/**
 * Service Worker 缓存与静态资源一致性自检。
 *
 * 两件事：
 *   ① ASSETS_TO_CACHE 里登记的本地资源必须真实存在（issue #38）；
 *   ② 全站静态资源版本串必须与 sw.js 的 CACHE_NAME 完全一致，且格式为
 *      `yymmdd.hhmmss`（12 位数字 + 1 个点），避免「只改了 CACHE_NAME、
 *      页面还引用旧 ?v=」导致线上 / 离线混用新旧资源（issue #55）。
 *
 * 用法：
 *   node scripts/check-cache-assets.mjs            # 校验，任一问题即非零退出
 *   node scripts/check-cache-assets.mjs --warn     # 只告警，不失败
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const warnOnly = process.argv.includes('--warn');
const swPath = join(root, 'sw.js');

const VERSION_PATTERN = /^\d{6}\.\d{6}$/;
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const SCAN_EXT = /\.(?:html|js|css|mjs)$/i;

const swSource = readFileSync(swPath, 'utf8');

/** ① 预缓存清单是否存在对应文件 */
function checkAssets() {
    const block = /ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\]/.exec(swSource);
    if (!block) {
        console.error('未在 sw.js 中找到 ASSETS_TO_CACHE 数组');
        return { ok: false, checked: 0, missing: [] };
    }

    const entries = [...block[1].matchAll(/['"]([^'"]+)['"]/g)]
        .map((m) => m[1])
        .filter((p) => !/^(https?:)?\/\//.test(p) && !p.startsWith('data:'));

    const missing = [];
    for (const entry of entries) {
        const rel = entry.replace(/^\.\//, '').replace(/[?#].*$/, '');
        if (!existsSync(join(root, rel))) missing.push(entry);
    }

    if (missing.length === 0) {
        console.log(`✅ ASSETS_TO_CACHE 全部命中：${entries.length} 项本地资源均存在`);
    } else {
        console.error(`⚠️  ${missing.length}/${entries.length} 项登记的资源不存在：`);
        for (const m of missing) console.error(`   - ${m}`);
        console.error('\n请从 sw.js 的 ASSETS_TO_CACHE 中删除，或补齐对应文件。');
    }
    return { ok: missing.length === 0, checked: entries.length, missing };
}

/** 递归收集需要扫描的文本文件 */
function collectFiles(dir, out = []) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
        if (item.isDirectory()) {
            if (SKIP_DIRS.has(item.name)) continue;
            collectFiles(join(dir, item.name), out);
        } else if (SCAN_EXT.test(item.name)) {
            out.push(join(dir, item.name));
        }
    }
    return out;
}

function lineOf(text, index) {
    return text.slice(0, index).split('\n').length;
}

/** ② CACHE_NAME 与全站 ?v= / 版本变量一致性 */
function checkVersions() {
    const cacheMatch = /const\s+CACHE_NAME\s*=\s*['"]cgo-openmap-v([^'"]+)['"]/.exec(swSource);
    if (!cacheMatch) {
        console.error('⚠️  未能在 sw.js 中解析 CACHE_NAME（期望 cgo-openmap-v{yymmdd.hhmmss}）');
        return { ok: false, version: null };
    }
    const version = cacheMatch[1];
    if (!VERSION_PATTERN.test(version)) {
        console.error(`⚠️  CACHE_NAME 版本格式不合法：${version}（必须为 yymmdd.hhmmss）`);
        return { ok: false, version };
    }

    const files = collectFiles(root).filter((file) => file !== fileURLToPath(import.meta.url));
    const mismatches = [];
    const malformed = [];
    const staleTokens = [];
    let references = 0;

    // `?v=` 引用（HTML/CSS/JS 动态加载）。
    // 只接受 ASCII 版本候选，避免把注释/说明里的「?v=）原样搬过去」误判成版本号；
    // `${version}` 这类运行时拼接在下面跳过。
    const queryRe = /[?&]v=([A-Za-z0-9_.${}-]+)/g;
    // 版本变量绑定：CGO_ASSET_VERSION / APP_VERSION = "…" / const version = "…" / var v = "…"
    const bindingRe = /(?:CGO_ASSET_VERSION|APP_VERSION|ASSET_VERSION)\s*=\s*['"]([^'"]+)['"]|(?:const|let|var)\s+(?:v|version|VERSION|VER|APP_VERSION)\s*=\s*['"]([^'"]+)['"]/g;

    const scan = (re, kind) => {
        for (const file of files) {
            const text = readFileSync(file, 'utf8');
            for (const m of text.matchAll(re)) {
                const value = m[1] !== undefined ? m[1] : m[2];
                if (value === undefined || value.includes('${')) continue;   // 模板表达式由运行时拼接，跳过
                references++;
                const where = `${relative(root, file).replace(/\\/g, '/')}:${lineOf(text, m.index)}`;
                if (!VERSION_PATTERN.test(value)) {
                    malformed.push(`${where} ${kind}=${value}`);
                } else if (value !== version) {
                    mismatches.push(`${where} ${kind}=${value}（当前 ${version}）`);
                }
            }
        }
    };
    scan(queryRe, '?v');
    scan(bindingRe, 'version');

    // 兜底：任何形如 yymmdd.hhmmss 的版本 token 都必须是当前版本，
    // 覆盖上面没识别到的变量名（例如新增的 CUSTOM_VERSION）。
    const reportedLines = new Set(
        mismatches.concat(malformed).map((item) => item.split(' ')[0])
    );
    const tokenRe = /\b\d{6}\.\d{6}\b/g;
    for (const file of files) {
        const text = readFileSync(file, 'utf8');
        for (const m of text.matchAll(tokenRe)) {
            if (m[0] === version) continue;
            const where = `${relative(root, file).replace(/\\/g, '/')}:${lineOf(text, m.index)}`;
            if (reportedLines.has(where)) continue;
            staleTokens.push(`${where} 旧版本串 ${m[0]}`);
        }
    }

    const ok = mismatches.length === 0 && malformed.length === 0 && staleTokens.length === 0;
    if (ok) {
        console.log(`✅ 版本串一致：CACHE_NAME = cgo-openmap-v${version}，${references} 处资源引用全部匹配`);
    } else {
        if (mismatches.length) {
            console.error(`⚠️  ${mismatches.length} 处资源版本串与 CACHE_NAME（${version}）不一致：`);
            mismatches.slice(0, 30).forEach((item) => console.error(`   - ${item}`));
            if (mismatches.length > 30) console.error(`   … 另有 ${mismatches.length - 30} 处`);
        }
        if (malformed.length) {
            console.error(`⚠️  ${malformed.length} 处版本串格式不合法（必须 yymmdd.hhmmss）：`);
            malformed.slice(0, 30).forEach((item) => console.error(`   - ${item}`));
        }
        if (staleTokens.length) {
            console.error(`⚠️  ${staleTokens.length} 处残留旧版本串：`);
            staleTokens.slice(0, 30).forEach((item) => console.error(`   - ${item}`));
        }
        console.error('\n请把所有 ?v= 与版本变量统一改成 sw.js 的 CACHE_NAME 版本。');
    }
    return { ok, version, references };
}

const assets = checkAssets();
const versions = checkVersions();

if (assets.ok && versions.ok) process.exit(0);
process.exit(warnOnly ? 0 : 1);
