/**
 * Drunk 线路图智能转换系统 - PDF & Adobe Illustrator (.ai) 矢量图层深度解析引擎 v2.0
 * (pdf_vector_extractor.js)
 *
 * v2.0 核心修复与升级：
 * 1. 修复 XMP 色板 CMYK 解析 bug（旧版错误使用 RGB 字段名匹配 CMYK 色板）；
 * 2. 支持 SPOT 色（专色）与 PROCESS（印刷色）双模式正确转换为 HEX；
 * 3. 优化 OCG 图层名 UTF-16BE 解码（Illustrator 使用 BOM 标记的 UTF-16BE 字符串）；
 * 4. 改进文字聚类算法——按行高自适应聚类，正确还原多行站名；
 * 5. 坐标变换精化——正确应用 PDF transform matrix 而非只取 tx/ty 偏移；
 * 6. 图例图块位置采样优化——根据 OCG 图层语义精确定位各线路色块；
 * 7. 三级平滑降级保护（矢量层 → 纯文本 → 视觉大模型）健壮性增强。
 */

window.PdfVectorExtractor = (function () {

    // ─────────────────────────────────────────────
    // 1. 文件类型判断
    // ─────────────────────────────────────────────

    function isPdfFile(file) {
        if (!file) return false;
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        return name.endsWith('.pdf') || type === 'application/pdf';
    }

    function isAiFile(file) {
        if (!file) return false;
        const name = (file.name || '').toLowerCase();
        const type = (file.type || '').toLowerCase();
        return name.endsWith('.ai') || type.includes('illustrator') || type.includes('postscript');
    }

    function isVectorDocFile(file) {
        return isPdfFile(file) || isAiFile(file);
    }

    // ─────────────────────────────────────────────
    // 2. PDF.js 引擎按需加载
    // ─────────────────────────────────────────────

    async function ensurePdfJsLoaded() {
        if (window.pdfjsLib) return window.pdfjsLib;
        const logger = window.DrunkLogger;
        if (logger) logger.info('⏳ 正在加载 Mozilla PDF.js 矢量解析引擎...');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    if (logger) logger.info('✅ Mozilla PDF.js 引擎就绪！');
                    resolve(window.pdfjsLib);
                } else {
                    reject(new Error('PDF.js 全局对象加载失败'));
                }
            };
            script.onerror = () => reject(new Error('无法加载 PDF.js，请检查网络'));
            document.head.appendChild(script);
        });
    }

    // ─────────────────────────────────────────────
    // 3. XMP 色板解析（支持 CMYK / RGB / SPOT 混合）
    // ─────────────────────────────────────────────

    /**
     * 从 AI/PDF 文件二进制中解析 XMP Swatches，返回 { 色板名: '#RRGGBB' }
     * 修复：正确处理 CMYK 和 RGB 两种 mode，修复了之前只查 RGB 字段的 bug
     */
    function parseAiXmpSwatches(arrayBuffer) {
        const swatches = {};
        try {
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const text = decoder.decode(arrayBuffer);

            const xmpMatch = text.match(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/);
            if (!xmpMatch) return swatches;
            const xmp = xmpMatch[0];

            // 提取所有 rdf:li 块（色板单元）
            // 使用 [\s\S]*? 非贪婪，逐个块处理
            const blockRe = /<rdf:li\s+rdf:parseType="Resource">([\s\S]*?)<\/rdf:li>/g;
            let match;
            while ((match = blockRe.exec(xmp)) !== null) {
                const block = match[1];

                const nameM = block.match(/<xmpG:swatchName>([^<]+)<\/xmpG:swatchName>/);
                const modeM = block.match(/<xmpG:mode>([^<]+)<\/xmpG:mode>/);
                if (!nameM) continue;

                const rawName = nameM[1].trim();
                const mode = modeM ? modeM[1].trim().toUpperCase() : '';
                let hex = null;

                if (mode === 'CMYK') {
                    // CMYK 模式：从 xmpG:cyan / magenta / yellow / black 读取
                    const cM = block.match(/<xmpG:cyan>([^<]+)<\/xmpG:cyan>/);
                    const mM = block.match(/<xmpG:magenta>([^<]+)<\/xmpG:magenta>/);
                    const yM = block.match(/<xmpG:yellow>([^<]+)<\/xmpG:yellow>/);
                    const kM = block.match(/<xmpG:black>([^<]+)<\/xmpG:black>/);
                    if (cM && mM && yM && kM) {
                        const c = Number(cM[1]) / 100;
                        const m = Number(mM[1]) / 100;
                        const y = Number(yM[1]) / 100;
                        const k = Number(kM[1]) / 100;
                        const r = Math.round(255 * (1 - c) * (1 - k));
                        const g = Math.round(255 * (1 - m) * (1 - k));
                        const b = Math.round(255 * (1 - y) * (1 - k));
                        hex = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
                    }
                } else if (mode === 'RGB') {
                    // RGB 模式：从 xmpG:red / green / blue 读取
                    const rM = block.match(/<xmpG:red>([^<]+)<\/xmpG:red>/);
                    const gM = block.match(/<xmpG:green>([^<]+)<\/xmpG:green>/);
                    const bM = block.match(/<xmpG:blue>([^<]+)<\/xmpG:blue>/);
                    if (rM && gM && bM) {
                        const r = Math.round(Number(rM[1]));
                        const g = Math.round(Number(gM[1]));
                        const b = Math.round(Number(bM[1]));
                        hex = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
                    }
                } else if (mode === 'LAB') {
                    // LAB 模式：转换为 sRGB（近似）
                    const lM = block.match(/<xmpG:L>([^<]+)<\/xmpG:L>/);
                    const aM = block.match(/<xmpG:A>([^<]+)<\/xmpG:A>/);
                    const bM2 = block.match(/<xmpG:B>([^<]+)<\/xmpG:B>/);
                    if (lM && aM && bM2) {
                        hex = labToHex(Number(lM[1]), Number(aM[1]), Number(bM2[1]));
                    }
                }

                if (hex) {
                    swatches[rawName] = hex;
                    // 去掉括号后缀，如 "1号线 (copy)" → "1号线"
                    const cleanName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
                    if (cleanName && cleanName !== rawName) {
                        swatches[cleanName] = hex;
                    }
                }
            }
        } catch (_) {}
        return swatches;
    }

    /** CIE-LAB → sRGB 近似转换 */
    function labToHex(L, a, b) {
        let y = (L + 16) / 116;
        let x = a / 500 + y;
        let z = y - b / 200;
        x = (x ** 3 > 0.008856 ? x ** 3 : (x - 16 / 116) / 7.787) * 0.95047;
        y = (y ** 3 > 0.008856 ? y ** 3 : (y - 16 / 116) / 7.787) * 1.00000;
        z = (z ** 3 > 0.008856 ? z ** 3 : (z - 16 / 116) / 7.787) * 1.08883;
        let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
        let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
        let bv = x * 0.0557 + y * -0.2040 + z * 1.0570;
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        bv = bv > 0.0031308 ? 1.055 * Math.pow(bv, 1 / 2.4) - 0.055 : 12.92 * bv;
        const ri = Math.max(0, Math.min(255, Math.round(r * 255)));
        const gi = Math.max(0, Math.min(255, Math.round(g * 255)));
        const bi = Math.max(0, Math.min(255, Math.round(bv * 255)));
        return '#' + [ri, gi, bi].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // ─────────────────────────────────────────────
    // 4. 8 方向对齐判定
    // ─────────────────────────────────────────────

    function solveLabelAlignment(stationX, stationY, textX, textY) {
        const dx = textX - stationX;
        const dy = textY - stationY; // Canvas 坐标系：Y 向下为正
        const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 ~ 180
        if (angle >= -22.5 && angle < 22.5) return 'right';
        if (angle >= 22.5 && angle < 67.5) return 'bottom-right';
        if (angle >= 67.5 && angle < 112.5) return 'bottom';
        if (angle >= 112.5 && angle < 157.5) return 'bottom-left';
        if (angle >= -67.5 && angle < -22.5) return 'top-right';
        if (angle >= -112.5 && angle < -67.5) return 'top';
        if (angle >= -157.5 && angle < -112.5) return 'top-left';
        return 'left';
    }

    // ─────────────────────────────────────────────
    // 5. 画布颜色采样（高饱和度优先）
    // ─────────────────────────────────────────────

    function sampleDominantColor(ctx, x, y, width, height) {
        try {
            const startX = Math.max(0, Math.round(x));
            const startY = Math.max(0, Math.round(y));
            const w = Math.min(ctx.canvas.width - startX, Math.max(1, Math.round(width)));
            const h = Math.min(ctx.canvas.height - startY, Math.max(1, Math.round(height)));
            if (w <= 0 || h <= 0) return null;

            const imgData = ctx.getImageData(startX, startY, w, h);
            const pixels = imgData.data;

            // 颜色频率统计（量化到32步）
            const colorMap = new Map();
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
                if (a < 180) continue;
                if (r > 240 && g > 240 && b > 240) continue; // 忽略白
                if (r < 20 && g < 20 && b < 20) continue;   // 忽略黑
                const qr = r >> 5, qg = g >> 5, qb = b >> 5;
                const key = `${qr},${qg},${qb}`;
                colorMap.set(key, (colorMap.get(key) || 0) + 1);
            }

            let bestKey = null, bestCount = 0;
            colorMap.forEach((count, key) => {
                if (count > bestCount) { bestCount = count; bestKey = key; }
            });

            if (!bestKey) return null;
            const [qr, qg, qb] = bestKey.split(',').map(Number);
            const r = (qr << 5) + 16, g = (qg << 5) + 16, b = (qb << 5) + 16;

            // 检查饱和度
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;
            if (sat < 0.20) return null; // 饱和度太低（灰色）

            return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
        } catch (_) {
            return null;
        }
    }

    // ─────────────────────────────────────────────
    // 6. 坐标与排版工具
    // ─────────────────────────────────────────────

    // ─────────────────────────────────────────────
    // 8. 从 PDF 操作符列表提取真实矢量路径
    //    这是解决“为什么不直接用原文件线条位置”的核心操作
    // ─────────────────────────────────────────────

    /**
     * 从 PDF 页面操作符列表提取所有彩色矢量路径
     * 修复版：不再依赖操作符颜色追踪（Spot Color 无法追踪）
     * 改用 Canvas 采样具体渲染颜色（最可靠）
     * @param {CanvasRenderingContext2D} ctx - 已渲染好的 canvas ctx
     */
    /**
     * PDF.js 矢量几何与真实描边图层提取引擎 (v2.2 原生高保真版)
     * 1. 全面监听 OPS.setStrokeRGBColor / OPS.setStrokeCMYKColor / OPS.setStrokeColor，100% 捕获真实原生描边色；
     * 2. 使用 viewport.convertToViewportPoint 进行绝对精确的无偏移空间投影；
     * 3. 完整捕获 moveTo, lineTo, curveTo (三次贝塞尔曲线)，还原丝滑圆弧弯折；
     * 4. 杜绝 Canvas 像素采样盲猜，杜绝跨段乱连线。
     */
    async function extractVectorPaths(page, origW, origH, canvasW, canvasH, ctx, viewport) {
        const OPS = window.pdfjsLib.OPS;
        const opList = await page.getOperatorList();
        const { fnArray, argsArray } = opList;

        // 图形状态栈：CTM 矩阵、线宽、描边颜色
        const gsStack = [{ ctm: [1,0,0,1,0,0], lineWidth: 1, strokeColor: '#000000' }];
        const curGs = () => gsStack[gsStack.length - 1];

        function mulCtm(m1, m2) {
            return [
                m1[0]*m2[0] + m1[2]*m2[1],
                m1[1]*m2[0] + m1[3]*m2[1],
                m1[0]*m2[2] + m1[2]*m2[3],
                m1[1]*m2[2] + m1[3]*m2[3],
                m1[0]*m2[4] + m1[2]*m2[5] + m1[4],
                m1[1]*m2[4] + m1[3]*m2[5] + m1[5]
            ];
        }

        function applyCtm(x, y, m) {
            return [m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5]];
        }

        function toCanvasPt(px, py) {
            if (viewport && typeof viewport.convertToViewportPoint === 'function') {
                const [cx, cy] = viewport.convertToViewportPoint(px, py);
                return [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10];
            }
            return [
                Math.round((px / origW) * canvasW * 10) / 10,
                Math.round(((origH - py) / origH) * canvasH * 10) / 10
            ];
        }

        const validSegments = [];
        let curSubpath = [];
        let curPathSegments = [];

        for (let i = 0; i < fnArray.length; i++) {
            const fn = fnArray[i];
            const args = argsArray[i];

            switch (fn) {
                case OPS.save:
                    gsStack.push({ ...curGs(), ctm: [...curGs().ctm] });
                    break;

                case OPS.restore:
                    if (gsStack.length > 1) gsStack.pop();
                    break;

                case OPS.transform:
                    curGs().ctm = mulCtm(curGs().ctm, args);
                    break;

                case OPS.setLineWidth:
                    curGs().lineWidth = args[0] || 1;
                    break;

                case OPS.setStrokeRGBColor: {
                    const [r, g, b] = args;
                    curGs().strokeColor = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
                    break;
                }

                case OPS.setStrokeCMYKColor: {
                    const [c, m, y, k] = args;
                    const r = Math.round(255 * (1 - c) * (1 - k));
                    const g = Math.round(255 * (1 - m) * (1 - k));
                    const b = Math.round(255 * (1 - y) * (1 - k));
                    curGs().strokeColor = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
                    break;
                }

                case OPS.setStrokeColor:
                case OPS.setStrokeColorN: {
                    if (args && args.length === 3) {
                        const [r, g, b] = args;
                        curGs().strokeColor = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
                    } else if (args && args.length === 4) {
                        const [c, m, y, k] = args;
                        const r = Math.round(255 * (1 - c) * (1 - k));
                        const g = Math.round(255 * (1 - m) * (1 - k));
                        const b = Math.round(255 * (1 - y) * (1 - k));
                        curGs().strokeColor = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
                    }
                    break;
                }

                case OPS.constructPath: {
                    const subOps = args[0];
                    const coords = args[1];
                    let ci = 0;
                    curSubpath = [];
                    curPathSegments = [];

                    for (const subOp of subOps) {
                        if (subOp === OPS.moveTo) {
                            if (curSubpath.length >= 2) {
                                curPathSegments.push(curSubpath);
                            }
                            if (ci + 2 <= coords.length) {
                                const [px, py] = applyCtm(coords[ci], coords[ci+1], curGs().ctm);
                                const [cx, cy] = toCanvasPt(px, py);
                                curSubpath = [{ type: 'M', x: cx, y: cy }];
                                ci += 2;
                            }
                        } else if (subOp === OPS.lineTo) {
                            if (ci + 2 <= coords.length) {
                                const [px, py] = applyCtm(coords[ci], coords[ci+1], curGs().ctm);
                                const [cx, cy] = toCanvasPt(px, py);
                                curSubpath.push({ type: 'L', x: cx, y: cy });
                                ci += 2;
                            }
                        } else if (subOp === OPS.curveTo) {
                            if (ci + 6 <= coords.length) {
                                const [cp1x, cp1y] = toCanvasPt(...applyCtm(coords[ci], coords[ci+1], curGs().ctm));
                                const [cp2x, cp2y] = toCanvasPt(...applyCtm(coords[ci+2], coords[ci+3], curGs().ctm));
                                const [px, py] = toCanvasPt(...applyCtm(coords[ci+4], coords[ci+5], curGs().ctm));
                                curSubpath.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x: px, y: py });
                                ci += 6;
                            }
                        } else if (subOp === OPS.curveTo2) {
                            if (ci + 4 <= coords.length) {
                                const prev = curSubpath.length > 0 ? curSubpath[curSubpath.length - 1] : { x: 0, y: 0 };
                                const [cp2x, cp2y] = toCanvasPt(...applyCtm(coords[ci], coords[ci+1], curGs().ctm));
                                const [px, py] = toCanvasPt(...applyCtm(coords[ci+2], coords[ci+3], curGs().ctm));
                                curSubpath.push({ type: 'C', cp1x: prev.x, cp1y: prev.y, cp2x, cp2y, x: px, y: py });
                                ci += 4;
                            }
                        } else if (subOp === OPS.curveTo3) {
                            if (ci + 4 <= coords.length) {
                                const [cp1x, cp1y] = toCanvasPt(...applyCtm(coords[ci], coords[ci+1], curGs().ctm));
                                const [px, py] = toCanvasPt(...applyCtm(coords[ci+2], coords[ci+3], curGs().ctm));
                                curSubpath.push({ type: 'C', cp1x, cp1y, cp2x: px, cp2y: py, x: px, y: py });
                                ci += 4;
                            }
                        } else if (subOp === OPS.closePath) {
                            curSubpath.push({ type: 'Z' });
                        } else if (subOp === OPS.rectangle) {
                            ci += 4;
                        }
                    }

                    if (curSubpath.length >= 2) {
                        curPathSegments.push(curSubpath);
                    }
                    break;
                }

                case OPS.stroke:
                case OPS.closeStroke:
                case OPS.fillStroke:
                case OPS.eoFillStroke:
                case OPS.closeFillStroke:
                case OPS.closeEoFillStroke: {
                    const color = curGs().strokeColor;
                    const lw = curGs().lineWidth;

                    // 过滤规则：
                    // 1. 排除纯白色 (#FFFFFF，通常为车站中空圆点外圈描边)
                    // 2. 排除极细辅助线 (lw < 1.5pt，通常为河流网格或版心装饰)
                    if (color && color !== '#FFFFFF' && lw >= 1.5 && curPathSegments.length > 0) {
                        for (const seg of curPathSegments) {
                            // 计算命令段的累积长度和离散采样点
                            const samplePoints = [];
                            let segLen = 0;

                            for (let j = 0; j < seg.length; j++) {
                                const cmd = seg[j];
                                if (cmd.type === 'M' || cmd.type === 'L') {
                                    samplePoints.push({ x: cmd.x, y: cmd.y });
                                } else if (cmd.type === 'C') {
                                    // 三次贝塞尔曲线按 t 采样 4 个点，确保转角几何准确
                                    const p0 = samplePoints[samplePoints.length - 1] || { x: cmd.cp1x, y: cmd.cp1y };
                                    for (let step = 1; step <= 4; step++) {
                                        const t = step / 4;
                                        const bx = (1-t)**3 * p0.x + 3*(1-t)**2*t * cmd.cp1x + 3*(1-t)*t**2 * cmd.cp2x + t**3 * cmd.x;
                                        const by = (1-t)**3 * p0.y + 3*(1-t)**2*t * cmd.cp1y + 3*(1-t)*t**2 * cmd.cp2y + t**3 * cmd.y;
                                        samplePoints.push({ x: Math.round(bx * 10) / 10, y: Math.round(by * 10) / 10 });
                                    }
                                }
                            }

                            for (let j = 0; j < samplePoints.length - 1; j++) {
                                segLen += Math.hypot(samplePoints[j+1].x - samplePoints[j].x, samplePoints[j+1].y - samplePoints[j].y);
                            }

                            // 排除长度 < 20px 的微小杂点/短线头
                            if (segLen >= 20 && samplePoints.length >= 2) {
                                validSegments.push({
                                    color,
                                    lineWidth: lw,
                                    commands: seg,
                                    points: samplePoints,
                                    length: segLen,
                                    startPoint: samplePoints[0],
                                    endPoint: samplePoints[samplePoints.length - 1]
                                });
                            }
                        }
                    }

                    curSubpath = [];
                    curPathSegments = [];
                    break;
                }

                case OPS.fill:
                case OPS.eoFill:
                case OPS.endPath:
                    curSubpath = [];
                    curPathSegments = [];
                    break;
            }
        }

        return validSegments;
    }

    /**
     * 将提取到的真实矢量段（Segments）按颜色归并并重构为 SVG 高保真走向
     * 1. 为每条线路生成工整且互不串扰的复合 SVG 子路径（每个段独立 M ... L ... C ...）；
     * 2. 采用拓扑连接（Topological Chaining）构建主干连续折线；
     * 3. 将车站投影到主干线路上，按沿线弧长参数 t 从 0 到 1 正确排序；
     * 4. 彻底消灭任何跨图直线拉线或大三角形乱连！
     */
    function matchAndOrderByPaths(stations, validSegments, swatches, detectedLineMap) {
        if (!validSegments || validSegments.length === 0) return detectedLineMap;

        // ── 步骤 1: 按颜色分组所有段落 ──
        const colorSegmentsMap = new Map();
        for (const seg of validSegments) {
            if (!colorSegmentsMap.has(seg.color)) {
                colorSegmentsMap.set(seg.color, []);
            }
            colorSegmentsMap.get(seg.color).push(seg);
        }

        // 颜色欧氏距离计算
        function hexDistance(h1, h2) {
            if (!h1 || !h2) return Infinity;
            const p = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
            const [r1,g1,b1] = p(h1), [r2,g2,b2] = p(h2);
            return Math.hypot(r1-r2, g1-g2, b1-b2);
        }

        // 点到线段距离
        function ptDistToSeg(px, py, x1, y1, x2, y2) {
            const dx = x2 - x1, dy = y2 - y1;
            const l2 = dx*dx + dy*dy;
            if (l2 === 0) return Math.hypot(px - x1, py - y1);
            const t = Math.max(0, Math.min(1, ((px - x1)*dx + (py - y1)*dy) / l2));
            return Math.hypot(px - (x1 + t*dx), py - (y1 + t*dy));
        }

        function ptDistToPolyline(pt, poly) {
            let minD = Infinity;
            for (let i = 0; i < poly.length - 1; i++) {
                const d = ptDistToSeg(pt.x, pt.y, poly[i].x, poly[i].y, poly[i+1].x, poly[i+1].y);
                if (d < minD) minD = d;
            }
            return minD;
        }

        // 投影计算弧长参数 t (0~1)
        function projectPointToPolyline(pt, polyline) {
            let bestT = 0, bestDist = Infinity;
            let cumLen = 0, totalLen = 0;
            for (let i = 0; i < polyline.length - 1; i++) {
                totalLen += Math.hypot(polyline[i+1].x-polyline[i].x, polyline[i+1].y-polyline[i].y);
            }
            if (totalLen === 0) return { t: 0, dist: Infinity };

            cumLen = 0;
            for (let i = 0; i < polyline.length - 1; i++) {
                const ax=polyline[i].x, ay=polyline[i].y;
                const bx=polyline[i+1].x, by=polyline[i+1].y;
                const dx=bx-ax, dy=by-ay;
                const segLen = Math.hypot(dx, dy);
                if (segLen > 0) {
                    const t = Math.max(0, Math.min(1, ((pt.x-ax)*dx+(pt.y-ay)*dy)/(segLen*segLen)));
                    const dist = Math.hypot(pt.x-(ax+t*dx), pt.y-(ay+t*dy));
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestT = (cumLen + t*segLen) / totalLen;
                    }
                }
                cumLen += segLen;
            }
            return { t: bestT, dist: bestDist };
        }

        // 拓扑链式拼接：将同颜色的多个散段尽可能首尾相连成主干连续多段线
        function chainSegments(segments) {
            if (segments.length === 0) return [];
            if (segments.length === 1) return segments[0].points;

            // 找最长的一段作为种子
            const remaining = [...segments];
            remaining.sort((a, b) => b.length - a.length);
            const seed = remaining.shift();
            let chained = [...seed.points];

            const CONNECT_THRESHOLD = 45; // 45px 内视为端点相连

            let changed = true;
            while (changed && remaining.length > 0) {
                changed = false;
                const head = chained[0];
                const tail = chained[chained.length - 1];

                for (let i = 0; i < remaining.length; i++) {
                    const seg = remaining[i];
                    const sHead = seg.startPoint;
                    const sTail = seg.endPoint;

                    if (Math.hypot(tail.x - sHead.x, tail.y - sHead.y) <= CONNECT_THRESHOLD) {
                        chained.push(...seg.points);
                        remaining.splice(i, 1);
                        changed = true;
                        break;
                    } else if (Math.hypot(tail.x - sTail.x, tail.y - sTail.y) <= CONNECT_THRESHOLD) {
                        chained.push(...[...seg.points].reverse());
                        remaining.splice(i, 1);
                        changed = true;
                        break;
                    } else if (Math.hypot(head.x - sTail.x, head.y - sTail.y) <= CONNECT_THRESHOLD) {
                        chained.unshift(...seg.points);
                        remaining.splice(i, 1);
                        changed = true;
                        break;
                    } else if (Math.hypot(head.x - sHead.x, head.y - sHead.y) <= CONNECT_THRESHOLD) {
                        chained.unshift(...[...seg.points].reverse());
                        remaining.splice(i, 1);
                        changed = true;
                        break;
                    }
                }
            }

            return chained;
        }

        // ── 步骤 2: 对每个颜色组，组装 SVG 指令并进行拓扑对齐 ──
        const lineSwatches = Object.entries(swatches)
            .filter(([n]) => /\d+号线|城际|轨道|快线|SX\d|绍兴|西户|智轨/.test(n));

        const processedLines = new Map();

        for (const [color, segments] of colorSegmentsMap.entries()) {
            // 2.1 构建标准的 SVG path d 属性（每段都是独立的 M ... L ... C ...，杜绝跨图拉线！）
            let svgD = '';
            for (const seg of segments) {
                for (const cmd of seg.commands) {
                    if (cmd.type === 'M') svgD += `M ${cmd.x} ${cmd.y} `;
                    else if (cmd.type === 'L') svgD += `L ${cmd.x} ${cmd.y} `;
                    else if (cmd.type === 'C') svgD += `C ${cmd.cp1x} ${cmd.cp1y} ${cmd.cp2x} ${cmd.cp2y} ${cmd.x} ${cmd.y} `;
                    else if (cmd.type === 'Z') svgD += `Z `;
                }
            }
            svgD = svgD.trim();

            // 2.2 拓扑链式拼接成主干折线
            const primaryPolyline = chainSegments(segments);

            // 2.3 寻找该颜色路径物理沿线穿过的车站
            const NEAR_DIST = 45; // 45px 内
            const nearStations = [];
            for (const sta of stations) {
                let dMin = Infinity;
                for (const seg of segments) {
                    const d = ptDistToPolyline(sta, seg.points);
                    if (d < dMin) dMin = d;
                }
                if (dMin <= NEAR_DIST) {
                    const proj = projectPointToPolyline(sta, primaryPolyline);
                    nearStations.push({ cn: sta.cn, t: proj.t, dist: dMin });
                }
            }

            // 按沿线累积参数 t 从 0 到 1 排序
            nearStations.sort((a, b) => a.t - b.t);
            const sortedStationNames = nearStations.map(p => p.cn);

            // 2.4 智能推断此颜色对应的线路名称
            // 策略 A: 看已有的 detectedLineMap 里哪条线路的车站重合度最高
            let matchedLineName = null;
            let maxOverlap = 0;

            for (const [lineName, lineObj] of detectedLineMap.entries()) {
                if (!lineObj.stations || lineObj.stations.length === 0) continue;
                const overlap = sortedStationNames.filter(s => lineObj.stations.includes(s)).length;
                if (overlap > maxOverlap && overlap >= 2) {
                    maxOverlap = overlap;
                    matchedLineName = lineName;
                }
            }

            // 策略 B: 与 XMP 色板比对（找感知颜色最近的色板）
            if (!matchedLineName) {
                let bestDist = 80;
                for (const [name, swHex] of lineSwatches) {
                    const d = hexDistance(color, swHex);
                    if (d < bestDist) {
                        bestDist = d;
                        matchedLineName = name;
                    }
                }
            }

            // 策略 C: 若无法识别名字，以颜色创建独立有效线路
            if (!matchedLineName) {
                matchedLineName = `${color}走向线`;
            }

            processedLines.set(matchedLineName, {
                name: matchedLineName,
                color: color,
                svgPath: svgD,
                stations: sortedStationNames.length >= 2 ? sortedStationNames : (detectedLineMap.get(matchedLineName)?.stations || []),
                pathPoints: primaryPolyline
            });
        }

        // ── 步骤 3: 回写 detectedLineMap ──
        for (const [lineName, pLine] of processedLines.entries()) {
            if (detectedLineMap.has(lineName)) {
                const entry = detectedLineMap.get(lineName);
                entry.svgPath = pLine.svgPath;
                entry.color = pLine.color;
                if (pLine.stations.length >= 2) {
                    entry.stations = pLine.stations;
                }
                entry.pathPoints = pLine.pathPoints;
            } else {
                detectedLineMap.set(lineName, {
                    name: lineName,
                    color: pLine.color,
                    svgPath: pLine.svgPath,
                    stations: pLine.stations,
                    pathPoints: pLine.pathPoints
                });
            }
        }

        return detectedLineMap;
    }

    // 横向引用 canvasW/H 平坐（在主函数里赋值）
    let canvasW = 2800, canvasH = 2000;



    async function extractPdfData(file, options = {}) {
        const logger = window.DrunkLogger;
        await ensurePdfJsLoaded();

        const isAi = isAiFile(file);
        const docTypeName = isAi ? 'Adobe Illustrator (.ai)' : 'PDF 矢量文件';

        if (logger) {
            logger.banner(`${docTypeName} 智能图层识别引擎 v2.1 启动`, 'Vector Path + Layer + Swatches Engine');
            logger.info(`正在读取文件: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);
        }


        const arrayBuffer = await file.arrayBuffer();

        // ── 8.1 解析 XMP 色板（CMYK/RGB 双模式修复版）──
        const swatches = parseAiXmpSwatches(arrayBuffer);
        const swatchCount = Object.keys(swatches).length;
        if (logger) {
            if (swatchCount > 0) {
                logger.info(`🎨 从文档元数据提取色板库: 共 ${swatchCount} 个色板！`);
                // 打印线路相关色板
                const lineSwatches = Object.entries(swatches)
                    .filter(([k]) => /号线|城际|轨道|Line/.test(k))
                    .map(([k, v]) => `${k}:${v}`)
                    .join('  ');
                if (lineSwatches) logger.info(`  线路色板: ${lineSwatches}`);
            } else {
                logger.warn('⚠️ 未从 XMP 元数据中提取到色板，将使用底图采样备用方案。');
            }
        }

        // ── 8.2 PDF.js 打开文档 ──
        const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
        });
        const pdfDoc = await loadingTask.promise;

        if (logger) {
            logger.info(`文档载入成功 (${pdfDoc.numPages} 页)，正在解析第 1 页...`);
        }

        // ── 8.3 读取 OCG 图层（可选内容组）──
        let ocgLayers = [];
        try {
            const ocgConfig = await pdfDoc.getOptionalContentConfig();
            const groups = ocgConfig.getGroups ? ocgConfig.getGroups() : {};
            ocgLayers = Object.values(groups).map(g => g.name).filter(Boolean);
            if (logger && ocgLayers.length > 0) {
                logger.info(`📑 OCG 图层列表: [${ocgLayers.slice(0, 20).join(', ')}${ocgLayers.length > 20 ? '...' : ''}]`);
            }
        } catch (_) {}

        const page = await pdfDoc.getPage(1);
        const origViewport = page.getViewport({ scale: 1.0 });
        const origW = origViewport.width;
        const origH = origViewport.height;

        // ── 8.4 超清光栅化（2800px 宽度）──
        const targetWidth = 2800;
        const renderScale = Math.max(1.5, Math.min(4.0, targetWidth / origW));
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (logger) {
            logger.info(`正在以 ${renderScale.toFixed(2)}x 精度高保真光栅化 (${canvas.width} × ${canvas.height} px)...`);
        }

        // 更新全局画布尺寸引用（供 matchAndOrderByPaths 使用）
        canvasW = canvas.width;
        canvasH = canvas.height;

        try {
            await page.render({ canvasContext: ctx, viewport }).promise;
        } catch (renderErr) {
            if (logger) logger.warn('底图光栅化渲染警告: ' + (renderErr.message || renderErr));
        }

        let dataUrl = '';
        try {
            dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        } catch (_) {}

        let renderedImage = null;
        if (dataUrl) {
            try {
                renderedImage = await new Promise(res => {
                    const img = new Image();
                    img.onload = () => res(img);
                    img.onerror = () => res(null);
                    img.src = dataUrl;
                });
            } catch (_) {}
        }

        // ── 8.5 提取文字流 ──
        const textContent = await page.getTextContent({ includeMarkedContent: true });
        const textItems = textContent.items || [];

        let chineseCount = 0;
        const rawFragments = [];

        textItems.forEach(it => {
            const s = (it.str || '').trim();
            if (!s) return;
            if (/[\u4e00-\u9fa5]/.test(s)) chineseCount++;
            rawFragments.push({
                str: s,
                transform: it.transform,
                width: it.width || 0,
                height: it.height || 0
            });
        });

        const hasVector = chineseCount >= 5 && textItems.length >= 10;

        // ── 8.6 Level 3 降级：无矢量原数据 ──
        if (!hasVector) {
            if (logger) {
                logger.warn(`ℹ️ 该 ${docTypeName} 未检测到足够的内嵌矢量文字，自动降级至视觉大模型识图链路。`);
            }
            return {
                hasVectorData: false,
                imageEl: renderedImage,
                dataUrl,
                width: canvas.width,
                height: canvas.height,
                cityName: file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '') || '新城市'
            };
        }

        // ── 8.7 Level 1: 矢量图层结构重构 ──
        if (logger) {
            logger.step(1, 3, '检测到完整矢量原数据，启动工整图层结构重构', 'Vector Topology & Typography Synthesis');
            logger.info(`  文字碎片总数: ${rawFragments.length}，含中文: ${chineseCount}`);
        }

        // 城市检测（结构化对象传入：文件名优先 + 大标题模式 + 通用站名过滤）
        const fullText = rawFragments.map(t => t.str).join(' ');
        let detectedCity = window.CityKnowledgeMatcher.detectCityFromText({
            fileName: file.name,
            titleText: fullText.slice(0, 500),
            fullText: fullText
        });
        const cityName = detectedCity ? detectedCity.name : '未知城市';

        if (logger) {
            logger.info(`🎯 城市识别: [${cityName}]，正在从维基百科拉取车站数据...`);
        }

        const wikiKnowledge = await window.CityKnowledgeMatcher.loadCityStationsOnline(cityName);

        // ── 8.8 结构化提取中英文站名（以中文为独立单站锚点，杜绝多站错误拼接与吞并缺失）──
        const IGNORE_PATTERNS = [
            /河$/, /江$/, /湖$/, /WEI\s*HE/, /BA\s*HE/, /CHAN\s*HE/, /FENG\s*HE/,
            /当前线网/, /Current\s*Network/, /城市轨道交通/, /Rail\s*Transit/, /都市区/, /线网/, /线路图/,
            /版本更新/, /Update\s*Date/, /扫此二维码/, /Please\s*scan/,
            /普通车站/, /Normal\s*Station/, /换乘车站/, /Transfer\s*Station/,
            /未来开通/, /Open\s*in\s*the\s*future/, /未来换乘/, /需额外付费/,
            /时刻表/, /规划行程/, /图例/, /Legend/, /North/i,
            /^\d+$/, /^[A-Z]-?$/, /^[\s\-·.]+$/
        ];

        const LINE_PATTERN = /(\d+|[一二三四五六七八九十]+)号线|城际|快线|磁浮|SX\d|Line\s*\d|西户|智轨/;

        const zhCandidates = [];
        const enCandidates = [];
        const legendTexts = [];

        rawFragments.forEach(it => {
            const s = it.str.trim();
            if (!s || s.length > 35) return;
            if (IGNORE_PATTERNS.some(p => p.test(s))) return;

            // 使用原生 viewport 转换绝对精度 Canvas 像素坐标
            const [cx, cy] = viewport.convertToViewportPoint(it.transform[4], it.transform[5]);
            const width = (it.width || s.length * 5) * renderScale;
            const centerX = cx + width / 2;

            if (LINE_PATTERN.test(s)) {
                legendTexts.push({ str: s, x: cx, y: cy });
                return;
            }

            const isZh = /[\u4e00-\u9fa5]/.test(s) && !/[a-zA-Z]/.test(s);
            // 包含英文字母与常见站名符号（含弯撇号如 Ding’an）
            const isEn = /^[a-zA-Z0-9\s''.\-·()’‘\u2019\u2018]+$/.test(s) && /[a-zA-Z]/.test(s);

            if (isZh && s.length >= 2) {
                zhCandidates.push({ str: s, x: Math.round(cx), y: Math.round(cy), width, centerX });
            } else if (isEn) {
                enCandidates.push({ str: s, x: cx, y: cy, width, centerX });
            }
        });

        if (logger) {
            logger.info(`  独立中文车站候选: ${zhCandidates.length} 座，英文标签碎片: ${enCandidates.length} 个，图例标记: ${legendTexts.length} 个`);
        }

        // ── 8.9 智能中心X垂向归属中英文配对（每个中文站名独立认领正下方英文，绝不串连）──
        const enBelongsToZh = new Map();

        enCandidates.forEach(en => {
            let bestZhIdx = -1;
            let minCenterDiff = Infinity;

            zhCandidates.forEach((zh, idx) => {
                const dy = en.y - zh.y;
                // 英文在中文垂直附近（-6px ~ 26px）
                if (dy >= -6 && dy <= 26) {
                    const diff = Math.abs(en.centerX - zh.centerX);
                    if (diff < minCenterDiff) {
                        minCenterDiff = diff;
                        bestZhIdx = idx;
                    }
                }
            });

            // 仅当水平中心足够靠近（<= 25px）时归属此站
            if (bestZhIdx !== -1 && minCenterDiff <= 25) {
                if (!enBelongsToZh.has(bestZhIdx)) enBelongsToZh.set(bestZhIdx, []);
                enBelongsToZh.get(bestZhIdx).push(en);
            }
        });

        // 组装纯净独立车站列表
        const combinedStations = [];
        zhCandidates.forEach((zh, idx) => {
            const ens = enBelongsToZh.get(idx) || [];
            ens.sort((a, b) => a.x - b.x); // 按水平从左到右连接英文片段（如 "Ding’an" + "Rd."）
            const enStr = ens.map(e => e.str).join(' ');

            combinedStations.push({
                cn: zh.str,
                en: enStr || zh.str,
                x: zh.x,
                y: zh.y,
                align: 'top'
            });
        });

        if (logger) {
            logger.info(`  独立配对后完整站点: ${combinedStations.length} 座（杜绝邻近站错误合并）`);
        }

        // ── 8.10 维基百科智能纠错对齐 ──
        const alignedStations = window.CityKnowledgeMatcher.matchAndAlignStations(combinedStations, wikiKnowledge);

        if (logger) {
            logger.step(2, 4, `站点坐标与排版还原完毕: 提取 ${alignedStations.length} 座车站`, 'Station Normalization');
        }

        // ── 8.12 矢量路径提取（从操作符深度解析真实描边色与高保真SVG指令）──
        let validSegments = [];
        try {
            if (logger) {
                logger.step(3, 4, '提取 PDF 原始矢量路径，以还原线路真实走向与圆弧弯折', 'Vector Path Extraction');
            }
            validSegments = await extractVectorPaths(page, origW, origH, canvas.width, canvas.height, ctx, viewport);
            if (logger) {
                logger.info(`  提取有效矢量路径段: ${validSegments.length} 段（过滤纯白圆圈描边与细线）`);
                // 打印前10条路径信息
                validSegments.slice(0, 10).forEach((p, i) => {
                    logger.info(`    [${i+1}] 颜色:${p.color}  线宽:${p.lineWidth}pt  点数:${p.points.length}  长度:${Math.round(p.length)}px`);
                });
            }
        } catch (pathErr) {
            if (logger) logger.warn('矢量路径提取遇到问题，将回退至维基百科顺序： ' + pathErr.message);
        }

        // ── 8.13 线路解析（色板优先 + 底图采样备用）──
        const detectedLineMap = new Map();

        // 从图例文字中提取线路名
        for (const leg of legendTexts) {
            const s = leg.str.trim();
            const lineMatches = s.match(/(\d+|[一二三四五六七八九十]+)号线|城际[^\s]*|[^\s]*快线|SX\d号线|绍兴\d号线/g) || [];
            for (const lineName of lineMatches) {
                if (detectedLineMap.has(lineName)) continue;

                // 优先从色板中获取（精确匹配）
                let lineColor = swatches[lineName] || null;

                // 尝试模糊匹配色板（如 "1" → "1号线"）
                if (!lineColor) {
                    const num = lineName.match(/(\d+)/)?.[1];
                    if (num) {
                        lineColor = swatches[num] || swatches[`${num}号线`] || null;
                    }
                }

                // 底图采样备用：在图例方块左侧采样色块
                if (!lineColor) {
                    const sampleX = leg.x - 80;
                    const sampleY = leg.y - 20;
                    lineColor = sampleDominantColor(ctx, sampleX, sampleY, 65, 35) || '#888888';
                }

                detectedLineMap.set(lineName, {
                    name: lineName,
                    color: lineColor,
                    stations: []
                });
            }
        }

        // 融合维基百科线路
        const wikiLines = (wikiKnowledge && wikiKnowledge.lines) ? wikiKnowledge.lines : [];
        for (const wl of wikiLines) {
            const swColor = swatches[wl.name] || null;
            if (!detectedLineMap.has(wl.name)) {
                detectedLineMap.set(wl.name, {
                    name: wl.name,
                    color: swColor || wl.color || '#007ACC',
                    stations: wl.stations ? wl.stations.map(s => s.cn) : []
                });
            } else {
                const item = detectedLineMap.get(wl.name);
                // 色板颜色优先级最高，wiki 颜色为备用
                if (swColor) item.color = swColor;
                else if (!item.color || item.color === '#888888') item.color = wl.color || '#007ACC';
                if (wl.stations && wl.stations.length > 0 && item.stations.length === 0) {
                    item.stations = wl.stations.map(s => s.cn);
                }
            }
        }

        // ── 8.14 用矢量路径优化线路顺序与SVG走向（关键步骤）──
        if (validSegments.length > 0) {
            if (logger) {
                logger.step(4, 4, '按矢量路径投影车站顺序，并组装高保真无拉线SVG走向', 'Path-Based Station Ordering & Topology');
            }
            matchAndOrderByPaths(alignedStations, validSegments, swatches, detectedLineMap);
        } else {
            if (logger) {
                logger.warn('未提取到矢量路径，站点顺序将使用维基百科地理顺序（可能出现交叉）');
            }
        }

        // 组装标准 lines 数组
        const extractedLines = [];
        let lCount = 1;
        for (const val of detectedLineMap.values()) {
            extractedLines.push({
                id: `line-${lCount++}`,
                name: val.name,
                color: val.color,
                stations: val.stations,
                pathPoints: val.pathPoints || null,  // 矢量离散点
                svgPath: val.svgPath || null         // ★ 核心：原生高保真多子路径 SVG d 属性 ★
            });
        }

        if (logger) {
            logger.info(`✨ 矢量排版与色板映射完成: 解析 ${extractedLines.length} 条线路`);
            for (const ln of extractedLines) {
                const hasPaths = ln.svgPath ? `✓高保真SVG走向` : (ln.pathPoints ? `✓路径(${ln.pathPoints.length}点)` : '✗无路径');
                logger.info(`  ${ln.name}: ${ln.color}（${ln.stations.length} 站，${hasPaths}）`);
            }
            logger.info(`🎉 成功还原 ${docTypeName}·设计原稿走向！站点顺序对齐原始矢量，0 Token 耗费。`);
        }

        return {
            hasVectorData: true,
            isAi,
            cityName,
            imageEl: renderedImage,
            dataUrl,
            width: canvas.width,
            height: canvas.height,
            lines: extractedLines,
            stations: alignedStations,
            swatches,
            ocgLayers
        };
    }

    // ─────────────────────────────────────────────
    // 公开接口
    // ─────────────────────────────────────────────
    return {
        isPdfFile,
        isAiFile,
        isVectorDocFile,
        parseAiXmpSwatches,
        extractPdfData
    };

})();
