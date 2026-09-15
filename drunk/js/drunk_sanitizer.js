/**
 * CGo OpenMap - Drunk 识别结果净化与几何校正器 (drunk/js/drunk_sanitizer.js)
 *
 * ==============================================================================
 * 为什么需要这一层 (Why)
 * ==============================================================================
 * Drunk 的两条入料链路（DeepSeek 视觉大模型 / PDF·AI 矢量直通）都存在典型的脏数据：
 *
 * 1. **噪点当车站**：底图上肉眼不可见的压缩噪点、图例色块、注记文字被当成站点，
 *    极端情况下一张图能「识别」出五六千个车站并互相乱连线；
 * 2. **站名脏**：带全角空格、换行、括注、孤立标点或纯数字序号；
 * 3. **同名重复**：同一换乘站被每条线各报一次，坐标还略有偏差；
 * 4. **坐标歪**：大模型给出的归一化坐标存在系统性偏移/缩放，整张图相对底图
 *    整体「歪」一截（这是会上反复提到的现象）；
 * 5. **退化线路**：只有 0~1 个站、或与另一条线完全重复的线路。
 *
 * 本模块把这些清理动作从 `drunk_pipeline.js` 中抽出来，做成**纯函数**，
 * 既可在两条链路上复用，也便于用 Node 直接跑回归自检（见 tools/ 目录说明）。
 *
 * ==============================================================================
 * 对外 API
 * ==============================================================================
 * - sanitize({ stations, lines, width, height, options })  →  净化后的 { stations, lines, report }
 * - fitSimilarity(pairs)                                   →  最小二乘相似变换 (缩放+旋转+平移)
 * - applyTransform(stations, transform)                    →  对站点整体施加变换
 * - snapToInk(stations, lines, imageEl, size, options)     →  把站点吸附到底图线条墨迹上（需要 DOM）
 * ==============================================================================
 */

(function (root, factory) {
    const api = factory();
    root.DrunkSanitizer = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    // ==========================================================================
    // 一、站名清洗
    // ==========================================================================

    /** 视觉模型常吐出的无意义装饰字符 */
    function stripJunkChars(s) {
        let out = '';
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            if (c <= 0x1F || c === 0x7F) continue;                    // C0 控制字符
            if (c >= 0x200B && c <= 0x200F) continue;                 // 零宽空格与书写方向标记
            if (c === 0x2028 || c === 0x2029 || c === 0xFEFF) continue; // 行/段分隔符与 BOM
            out += s[i];
        }
        return out;
    }

    /**
     * 全角字母数字 → 半角。OCR 与视觉模型常把线路图上的 "4号线" 读成 "４号线"，
     * 不归一化会导致同一座车站在去重时被当成两个。
     */
    function toHalfWidth(s) {
        let out = '';
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            out += (c >= 0xFF01 && c <= 0xFF5E) ? String.fromCharCode(c - 0xFEE0) : s[i];
        }
        return out;
    }

    function cleanName(raw) {
        if (raw == null) return '';
        let s = String(raw);
        s = stripJunkChars(s);
        s = toHalfWidth(s);
        s = s.replace(/[　\s]+/g, ' ');       // 全角空格与换行统一成半角空格
        s = s.trim();
        s = s.replace(/^[·・\-—–_.,:;'"“”‘’()（）\[\]【】]+/, '');
        s = s.replace(/[·・\-—–_.,:;'"“”‘’]+$/, '');
        return s.trim();
    }

    /**
     * 判定一个站名是否属于「一望即知不是车站」的噪点。
     * 注意：架空/原创线路图的站名可以很怪，所以这里只拦截结构性垃圾，
     * 绝不按现实城市词典做白名单过滤。
     */
    function isJunkName(name) {
        if (!name) return true;
        if (name.length > 24) return true;                  // 整段注记被当成站名
        if (/^[0-9]+$/.test(name)) return true;             // 纯数字（图例序号/里程）
        if (/^[A-Za-z]$/.test(name)) return true;           // 单个拉丁字母
        if (!/[一-龥A-Za-z0-9]/.test(name)) return true; // 全是标点/符号
        return false;
    }

    // ==========================================================================
    // 二、颜色规范化
    // ==========================================================================

    const FALLBACK_PALETTE = [
        '#E4002B', '#0072CE', '#F5A800', '#00A94F', '#8E44AD',
        '#00B2A9', '#E87722', '#C8102E', '#6D6E71', '#7C4D9B',
        '#009CDE', '#B5BD00', '#D4007F', '#5B6770', '#FF8200'
    ];

    function normalizeColor(raw, fallbackIndex) {
        const fallback = FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
        if (!raw) return fallback;
        let s = String(raw).trim();
        const rgb = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (rgb) {
            const hex = [rgb[1], rgb[2], rgb[3]]
                .map(n => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0'))
                .join('');
            return `#${hex}`.toUpperCase();
        }
        if (!s.startsWith('#')) s = `#${s}`;
        if (/^#[0-9a-f]{3}$/i.test(s)) {
            return ('#' + s.slice(1).split('').map(c => c + c).join('')).toUpperCase();
        }
        if (/^#[0-9a-f]{6}$/i.test(s)) return s.toUpperCase();
        return fallback;
    }

    // ==========================================================================
    // 三、主净化流程
    // ==========================================================================

    /**
     * @param {object} input
     *   - stations: [{ name|cn, en, x, y, isTransfer, align, ...透传字段 }]
     *               坐标与 width/height 处于同一坐标系
     *   - lines:    [{ id, name, color, stations: [站名], ...透传字段 }]
     *   - width / height: 坐标系尺寸
     *   - options:
     *       mergeRatio     同名站合并半径（占对角线比例，默认 0.04）
     *       marginRatio    允许超出画布的比例（默认 0.03）
     *       explosionBase  噪点爆炸判定基线站数（默认 400）
     * @returns {{ stations, lines, report }}
     */
    function sanitize(input) {
        const opts = input.options || {};
        const width = input.width || 1000;
        const height = input.height || 1000;
        const diag = Math.hypot(width, height);
        const mergeRadius = diag * (opts.mergeRatio != null ? opts.mergeRatio : 0.04);
        const margin = (opts.marginRatio != null ? opts.marginRatio : 0.03);
        const explosionBase = opts.explosionBase != null ? opts.explosionBase : 400;

        const report = {
            input: { stations: (input.stations || []).length, lines: (input.lines || []).length },
            dropped: { junkName: 0, offCanvas: 0, duplicate: 0, unreferenced: 0, badGeometry: 0 },
            merged: 0,
            renamedLines: 0,
            recoloredLines: 0,
            droppedLines: { tooShort: 0, duplicate: 0 },
            explosionGuard: false,
            warnings: []
        };

        // ---- 3.1 线路侧先行清洗：拿到权威的「被引用站名」集合 -------------------
        const rawLines = Array.isArray(input.lines) ? input.lines : [];
        const usedColors = new Set();
        const cleanedLines = [];

        rawLines.forEach((line, idx) => {
            const nameList = Array.isArray(line.stations) ? line.stations : [];
            const names = [];
            nameList.forEach(n => {
                const c = cleanName(n);
                if (!c || isJunkName(c)) return;
                // 连续重复（模型复读）折叠掉，非连续重复（环线回到起点）保留
                if (names.length && names[names.length - 1] === c) return;
                names.push(c);
            });

            let color = normalizeColor(line.color, idx);
            if (usedColors.has(color)) {
                // 两条线撞色会让图例完全失效，改判到调色板上未占用的颜色
                let k = 0;
                while (usedColors.has(FALLBACK_PALETTE[(idx + k) % FALLBACK_PALETTE.length]) && k < FALLBACK_PALETTE.length) k++;
                color = FALLBACK_PALETTE[(idx + k) % FALLBACK_PALETTE.length];
                report.recoloredLines++;
            }
            usedColors.add(color);

            let name = cleanName(line.name);
            if (!name) { name = `${idx + 1}号线`; report.renamedLines++; }

            cleanedLines.push(Object.assign({}, line, {
                id: line.id || `L${idx + 1}`,
                name,
                color,
                stations: names
            }));
        });

        const referenced = new Set();
        cleanedLines.forEach(l => l.stations.forEach(n => referenced.add(n)));

        // ---- 3.2 站点侧清洗 ----------------------------------------------------
        const rawStations = Array.isArray(input.stations) ? input.stations : [];
        const kept = [];
        const byName = new Map();

        rawStations.forEach(st => {
            const name = cleanName(st.name != null ? st.name : st.cn);
            if (isJunkName(name)) { report.dropped.junkName++; return; }

            const x = Number(st.x);
            const y = Number(st.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) { report.dropped.badGeometry++; return; }
            if (x < -width * margin || x > width * (1 + margin) ||
                y < -height * margin || y > height * (1 + margin)) {
                report.dropped.offCanvas++;
                return;
            }

            const existing = byName.get(name);
            if (existing) {
                // 同名：近则合并为质心（换乘站被各线各报一次），远则判为幻觉丢弃
                const dist = Math.hypot(existing.x - x, existing.y - y);
                if (dist <= mergeRadius) {
                    existing.x = (existing.x * existing._n + x) / (existing._n + 1);
                    existing.y = (existing.y * existing._n + y) / (existing._n + 1);
                    existing._n++;
                    if (st.en && !existing.en) existing.en = st.en;
                    report.merged++;
                } else {
                    report.dropped.duplicate++;
                }
                return;
            }

            const entry = Object.assign({}, st, {
                name,
                cn: name,
                en: st.en || '',
                x, y,
                _n: 1
            });
            byName.set(name, entry);
            kept.push(entry);
        });

        // ---- 3.3 噪点爆炸兜底 ---------------------------------------------------
        // 站点数远超「线路数所能承载的合理规模」时，只信任被线路拓扑引用到的站点。
        const sane = Math.max(explosionBase, cleanedLines.length * 60);
        let stations = kept;
        if (kept.length > sane && referenced.size > 0) {
            const filtered = kept.filter(s => referenced.has(s.name));
            report.dropped.unreferenced += kept.length - filtered.length;
            report.explosionGuard = true;
            report.warnings.push(
                `站点数 ${kept.length} 远超 ${cleanedLines.length} 条线路的合理规模，` +
                `已只保留被线路走向引用到的 ${filtered.length} 座车站（疑为底图噪点被识别成车站）。`
            );
            stations = filtered;
        } else {
            const orphan = kept.filter(s => !referenced.has(s.name)).length;
            if (orphan > 0 && referenced.size > 0) {
                report.warnings.push(`有 ${orphan} 座车站未被任何线路走向引用，导出前请人工确认。`);
            }
        }

        // ---- 3.4 线路终检：剔除退化与完全重复的线路 ------------------------------
        const presentNames = new Set(stations.map(s => s.name));
        const signatures = new Set();
        // 站序签名的分隔符：取一个绝不会出现在站名里的控制字符
        const SEP = String.fromCharCode(1);
        const finalLines = [];

        cleanedLines.forEach(line => {
            const names = line.stations.filter(n => presentNames.has(n));
            if (names.length < 2) {
                // 带原生矢量走向的线路即使站点没对上也要保留，否则会丢失 PDF 直通的线形
                if (line.svgPath || (line.pathPoints && line.pathPoints.length >= 2)) {
                    finalLines.push(Object.assign({}, line, { stations: names }));
                    return;
                }
                report.droppedLines.tooShort++;
                return;
            }
            const sig = names.join(SEP);
            const revSig = names.slice().reverse().join(SEP);
            if (signatures.has(sig) || signatures.has(revSig)) {
                report.droppedLines.duplicate++;
                return;
            }
            signatures.add(sig);
            finalLines.push(Object.assign({}, line, { stations: names }));
        });

        stations.forEach(s => { delete s._n; });

        report.output = { stations: stations.length, lines: finalLines.length };
        return { stations, lines: finalLines, report };
    }

    // ==========================================================================
    // 四、整体几何校正：最小二乘相似变换
    // ==========================================================================

    /**
     * 由若干 { from: {x,y}, to: {x,y} } 对解算相似变换 (等比缩放 + 旋转 + 平移)。
     * 用于修正「识别出来的整张图相对底图整体歪了一截」——这是单点微调解决不了、
     * 但只要有少量可靠锚点就能一次性纠正的系统性误差。
     *
     * 采用闭式解：设 to = s·R·from + t，令 a = s·cosθ、b = s·sinθ，则
     *   [dx']   [a  -b][dx]
     *   [dy'] = [b   a][dy]
     * 对去心坐标做最小二乘即可。
     *
     * @returns {{a,b,tx,ty,scale,rotationDeg,rmse,count}|null}
     */
    function fitSimilarity(pairs) {
        const pts = (pairs || []).filter(p =>
            p && p.from && p.to &&
            Number.isFinite(p.from.x) && Number.isFinite(p.from.y) &&
            Number.isFinite(p.to.x) && Number.isFinite(p.to.y));
        if (pts.length < 2) return null;

        const n = pts.length;
        const cFrom = pts.reduce((a, p) => ({ x: a.x + p.from.x / n, y: a.y + p.from.y / n }), { x: 0, y: 0 });
        const cTo = pts.reduce((a, p) => ({ x: a.x + p.to.x / n, y: a.y + p.to.y / n }), { x: 0, y: 0 });

        let sxx = 0, syy = 0, sxy = 0, syx = 0, norm = 0;
        pts.forEach(p => {
            const dx = p.from.x - cFrom.x, dy = p.from.y - cFrom.y;
            const ex = p.to.x - cTo.x, ey = p.to.y - cTo.y;
            sxx += dx * ex; syy += dy * ey;
            sxy += dx * ey; syx += dy * ex;
            norm += dx * dx + dy * dy;
        });
        if (norm < 1e-9) return null;

        const a = (sxx + syy) / norm;
        const b = (sxy - syx) / norm;
        const tx = cTo.x - (a * cFrom.x - b * cFrom.y);
        const ty = cTo.y - (b * cFrom.x + a * cFrom.y);

        let sq = 0;
        pts.forEach(p => {
            const px = a * p.from.x - b * p.from.y + tx;
            const py = b * p.from.x + a * p.from.y + ty;
            sq += (px - p.to.x) ** 2 + (py - p.to.y) ** 2;
        });

        return {
            a, b, tx, ty,
            scale: Math.hypot(a, b),
            rotationDeg: Math.atan2(b, a) * 180 / Math.PI,
            rmse: Math.sqrt(sq / n),
            count: n
        };
    }

    function transformPoint(pt, t) {
        return {
            x: t.a * pt.x - t.b * pt.y + t.tx,
            y: t.b * pt.x + t.a * pt.y + t.ty
        };
    }

    /** 对站点数组整体施加相似变换（返回新数组，不改动入参） */
    function applyTransform(stations, t) {
        if (!t) return stations;
        return stations.map(s => Object.assign({}, s, transformPoint(s, t)));
    }

    // ==========================================================================
    // 五、墨迹吸附：把站点拉回底图真正的线条上（需要 DOM / Canvas）
    // ==========================================================================

    function hexToRgb(hex) {
        const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
        if (!m) return null;
        const n = parseInt(m[1], 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function colorDist(r1, g1, b1, r2, g2, b2) {
        // 加权欧氏距离，近似人眼敏感度，比裸 RGB 距离稳
        const rm = (r1 + r2) / 2;
        const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
        return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
    }

    /**
     * 把每个站点吸附到底图上「离它最近的、颜色与其所属线路相符的墨迹像素」。
     *
     * 这是对大模型坐标精度不足的直接补偿：模型能认对站名与拓扑顺序，
     * 但给不出像素级坐标；而底图上线条的颜色是确定无疑的锚点。
     * 吸附成功的站点同时作为锚点对参与整体相似变换解算，
     * 用于把吸附失败（被站名文字遮挡等）的站点一起拉正。
     *
     * @param {object[]} stations  含 { name, x, y } 的站点数组（坐标空间 = size）
     * @param {object[]} lines     含 { color, stations: [站名] } 的线路数组
     * @param {HTMLImageElement} imageEl 底图
     * @param {{width:number,height:number}} size 站点坐标所在的画布尺寸
     * @param {object} options { searchRatio, tolerance }
     * @returns {{ stations, report }}
     */
    function snapToInk(stations, lines, imageEl, size, options) {
        const opts = options || {};
        const report = { snapped: 0, total: stations.length, transform: null, skipped: 0 };
        if (!imageEl || typeof document === 'undefined') return { stations, report };

        const iw = imageEl.naturalWidth || imageEl.width;
        const ih = imageEl.naturalHeight || imageEl.height;
        if (!iw || !ih) return { stations, report };

        // 采样分辨率封顶，保证超大底图也能秒级完成
        const maxDim = opts.maxSample || 2000;
        const scale = Math.min(1, maxDim / Math.max(iw, ih));
        const sw = Math.max(1, Math.round(iw * scale));
        const sh = Math.max(1, Math.round(ih * scale));

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(imageEl, 0, 0, sw, sh);

        let pixels;
        try {
            pixels = ctx.getImageData(0, 0, sw, sh).data;
        } catch (err) {
            // 跨域底图会污染画布，直接放弃吸附而不是抛错
            report.skipped = stations.length;
            return { stations, report };
        }

        // 站名 → 所属线路颜色
        const colorOf = new Map();
        (lines || []).forEach(l => {
            const rgb = hexToRgb(l.color);
            if (!rgb) return;
            (l.stations || []).forEach(n => { if (!colorOf.has(n)) colorOf.set(n, rgb); });
        });

        const searchRadius = Math.max(4, Math.round(Math.hypot(sw, sh) * (opts.searchRatio || 0.012)));
        const tolerance = opts.tolerance || 120;
        const kx = sw / (size.width || sw);
        const ky = sh / (size.height || sh);

        const pairs = [];
        const snappedPos = new Array(stations.length).fill(null);

        stations.forEach((st, idx) => {
            const target = colorOf.get(st.name);
            if (!target) return;

            const cx = Math.round(st.x * kx);
            const cy = Math.round(st.y * ky);
            let best = null;
            let bestScore = Infinity;

            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                const py = cy + dy;
                if (py < 0 || py >= sh) continue;
                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                    const px = cx + dx;
                    if (px < 0 || px >= sw) continue;
                    const r2 = dx * dx + dy * dy;
                    if (r2 > searchRadius * searchRadius) continue;
                    const o = (py * sw + px) * 4;
                    const cd = colorDist(pixels[o], pixels[o + 1], pixels[o + 2], target.r, target.g, target.b);
                    if (cd > tolerance) continue;
                    // 颜色越准、离原位置越近越好
                    const score = cd + Math.sqrt(r2) * 6;
                    if (score < bestScore) { bestScore = score; best = { x: px, y: py }; }
                }
            }

            if (best) {
                const to = { x: best.x / kx, y: best.y / ky };
                pairs.push({ from: { x: st.x, y: st.y }, to });
                snappedPos[idx] = to;
                report.snapped++;
            }
        });

        // 吸附命中率太低时不要相信它，原样返回，避免把好数据搅坏
        if (report.snapped < Math.max(3, stations.length * 0.15)) {
            return { stations, report };
        }

        const transform = fitSimilarity(pairs);
        report.transform = transform;

        const out = stations.map((st, idx) => {
            const hit = snappedPos[idx];
            if (hit) return Object.assign({}, st, { x: hit.x, y: hit.y });
            // 吸附失败（多半被站名文字压住）的站点，用整体变换一并拉正
            if (transform) return Object.assign({}, st, transformPoint(st, transform));
            return st;
        });

        return { stations: out, report };
    }

    return {
        cleanName,
        isJunkName,
        normalizeColor,
        sanitize,
        fitSimilarity,
        applyTransform,
        transformPoint,
        snapToInk,
        FALLBACK_PALETTE
    };
});
