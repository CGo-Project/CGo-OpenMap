/**
 * Drunk 线路图智能转换系统 - 视觉与几何检测核心 v6 (vision_detector.js)
 * 
 * 核心升级：
 * 1. 深度城市特征指纹库：全面支持【天津】、【长沙】及未来大城市的高精度指纹与版面特征识别；
 * 2. 图例优先 (Legend-First) 智能调度：自动定位图例区，提取权威线路色表与名称；
 * 3. 连通域骨架保护：仅在有实际连续线路色彩支撑的走向上提取站点，杜绝在纯白背景或文字密集区盲目生成假站点；
 * 4. 彻底杜绝杂乱误报，提升检测信噪比。
 */

window.DrunkVision = (function () {

    function rgbToLab(r, g, b) {
        let R = r / 255, G = g / 255, B = b / 255;
        R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
        G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
        B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;
        const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
        const Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.00000;
        const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
        const f = v => v > 0.008856 ? Math.pow(v, 1 / 3) : 7.787 * v + 16 / 116;
        return { L: 116 * f(Y) - 16, a: 500 * (f(X) - f(Y)), b: 200 * (f(Y) - f(Z)) };
    }

    function deltaE(a, b) {
        const dL = a.L - b.L, da = a.a - b.a, db = a.b - b.b;
        return Math.sqrt(dL * dL + da * da + db * db);
    }

    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const n = parseInt(hex, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const h = Math.round(x).toString(16);
            return h.length === 1 ? '0' + h : h;
        }).join('');
    }

    function pixelSaturation(r, g, b) {
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        return max === 0 ? 0 : (max - min) / max;
    }

    /**
     * 智能版面布局分析：自动界定顶部标题栏、底部图例/注释服务栏与绘图活跃区
     */
    function analyzeLayout(imageData) {
        const { width, height, data } = imageData;
        const logger = window.DrunkLogger;

        // 1. 顶部标题横幅
        let headerBottomY = Math.round(height * 0.04);
        for (let y = 5; y < Math.min(Math.round(height * 0.2), 150); y += 4) {
            let dark = 0, total = 0;
            for (let x = 20; x < width - 20; x += 10) {
                const i = (y * width + x) * 4;
                total++;
                if ((data[i] + data[i + 1] + data[i + 2]) / 3 < 130) dark++;
            }
            if (total > 0 && dark / total > 0.6) headerBottomY = y + 10;
        }

        // 2. 底部服务与图例区
        let footerTopY = Math.round(height * 0.95);
        for (let y = height - 8; y > Math.round(height * 0.65); y -= 3) {
            let colored = 0, total = 0;
            for (let x = Math.round(width * 0.04); x < Math.round(width * 0.85); x += 8) {
                const i = (y * width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                total++;
                if (pixelSaturation(r, g, b) > 0.35 && (r + g + b) / 3 > 40 && (r + g + b) / 3 < 220) colored++;
            }
            if (total > 0 && colored / total > 0.05) { footerTopY = y + 6; break; }
        }

        const activeArea = {
            minX: Math.round(width * 0.02),
            maxX: Math.round(width * 0.98),
            minY: headerBottomY + 4,
            maxY: footerTopY
        };

        const legendArea = (footerTopY < height - 12) ? {
            minX: Math.round(width * 0.02),
            maxX: Math.round(width * 0.85),
            minY: footerTopY,
            maxY: height - 2
        } : null;

        if (logger) {
            const activeW = activeArea.maxX - activeArea.minX;
            const activeH = activeArea.maxY - activeArea.minY;
            const activePercent = ((activeW * activeH) / (width * height) * 100).toFixed(1);

            logger.group('版面几何分析详情 (Layout Partition)');
            logger.info(`顶部标题栏检测: 下边界 y = ${headerBottomY} px ${headerBottomY > Math.round(height * 0.04) ? '(检测到深色横幅标题)' : '(默认估算边界)'}`);
            logger.info(`底部图例服务区: 起始 y = ${footerTopY} px (图底边距: ${height - footerTopY} px)`);
            logger.info(`有效绘图活跃区: X[${activeArea.minX} ~ ${activeArea.maxX}] Y[${activeArea.minY} ~ ${activeArea.maxY}] (宽 ${activeW} × 高 ${activeH} px, 占画面 ${activePercent}%)`);
            if (legendArea) {
                logger.info(`独立图例特征区: X[${legendArea.minX} ~ ${legendArea.maxX}] Y[${legendArea.minY} ~ ${legendArea.maxY}] (已成功锁定底栏专属图例层)`);
            } else {
                logger.info('独立图例特征区: 未探测到专属底栏图例，将采用活跃区多点自适应色彩聚类');
            }
            logger.groupEnd();
        }

        return { headerBottomY, footerTopY, activeArea, legendArea };
    }

    /**
     * 城市特征指纹检测器 (全面支持天津与长沙)
     */
    function detectCitySignature(imageData, fileName = '') {
        const logger = window.DrunkLogger;
        const lower = (fileName || '').toLowerCase();

        // 1. 文件名强命中
        if (lower.includes('tianjin') || lower.includes('天津') || lower.includes('tj_') || lower.includes('津轨')) {
            const result = { matched: true, cityId: 'tianjin', cityName: '天津', confidence: 1.0, reason: '文件名关键字命中 ("天津" / "tianjin")' };
            if (logger) {
                logger.info(`城市指纹匹配: ${result.cityName} (${result.cityId}) - 置信度 100% [原因: ${result.reason}]`);
            }
            return result;
        }
        if (lower.includes('changsha') || lower.includes('长沙') || lower.includes('cs_')) {
            const result = { matched: true, cityId: 'changsha', cityName: '长沙', confidence: 1.0, reason: '文件名关键字命中 ("长沙" / "changsha")' };
            if (logger) {
                logger.info(`城市指纹匹配: ${result.cityName} (${result.cityId}) - 置信度 100% [原因: ${result.reason}]`);
            }
            return result;
        }

        const { width, height, data } = imageData;
        const aspectRatio = height / width; // 竖版长图比例

        // 2. 长沙特征指纹检测 (顶部暗灰横幅 + 标志性色彩)
        let darkBanner = 0;
        const bH = Math.min(Math.round(height * 0.15), 100);
        for (let y = 10; y < bH; y += 5) {
            for (let x = 50; x < width - 50; x += 15) {
                const i = (y * width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (Math.abs(r - 95) < 35 && Math.abs(g - 95) < 35 && Math.abs(b - 96) < 35) darkBanner++;
            }
        }

        if (darkBanner > 30) {
            const result = { matched: true, cityId: 'changsha', cityName: '长沙', confidence: 0.95, reason: `顶部暗灰横幅命中 (${darkBanner} 采样点 > 阈值 30)` };
            if (logger) {
                logger.info(`城市指纹匹配: ${result.cityName} (${result.cityId}) - 置信度 95% [原因: ${result.reason}]`);
            }
            return result;
        }

        // 3. 天津特征指纹检测：
        //    特征 A: 竖版大幅长图 (aspectRatio 通常在 1.15 ~ 1.5 之间)
        //    特征 B: 经典九线全网核心色彩同时高频出现 (红色1号线、黄色2号线、天蓝3号线、草绿4号线、橙红5号线、紫红6号线、深蓝9号线)
        //    特征 C: 底部右侧存在天津地铁服务热线框 (青绿色 12328 框：r: 0~30, g: 150~190, b: 120~160)
        let tjRed = 0, tjYellow = 0, tjSkyBlue = 0, tjGreen = 0, tjPurple = 0, tjDeepBlue = 0;
        let tjHotlineTeal = 0;

        // 底部服务热线采样
        const bottomStartY = Math.round(height * 0.85);
        for (let y = bottomStartY; y < height - 10; y += 6) {
            for (let x = Math.round(width * 0.35); x < width - 20; x += 10) {
                const i = (y * width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (r < 60 && g > 130 && b > 100 && b < 180) {
                    tjHotlineTeal++;
                }
            }
        }

        // 全网核心色彩采样
        for (let y = Math.round(height * 0.15); y < Math.round(height * 0.85); y += 10) {
            for (let x = Math.round(width * 0.1); x < Math.round(width * 0.9); x += 10) {
                const i = (y * width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // 1号线红
                if (r > 170 && g < 40 && b < 50) tjRed++;
                // 2号线黄
                else if (r > 210 && g > 180 && b < 40) tjYellow++;
                // 3号线天蓝
                else if (r < 40 && g > 140 && b > 210) tjSkyBlue++;
                // 4号线草绿
                else if (r > 90 && r < 140 && g > 170 && b < 60) tjGreen++;
                // 6号线紫红
                else if (r > 120 && r < 180 && g < 50 && b > 80 && b < 150) tjPurple++;
                // 9号线深蓝
                else if (r < 30 && g > 30 && g < 70 && b > 80 && b < 140) tjDeepBlue++;
            }
        }

        const tjLinesMatched = (tjRed > 3 && tjYellow > 3 && tjSkyBlue > 3 && tjGreen > 3 && (tjPurple > 2 || tjDeepBlue > 2));

        if (logger) {
            logger.group('城市指纹底层特征采样检测 (Signature Inspection)');
            logger.info(`长宽比: ${(aspectRatio).toFixed(3)} (${aspectRatio >= 1.05 ? '竖版长图' : '横版宽图'})`);
            logger.info(`长沙顶部暗灰横幅命中: ${darkBanner} 点 (判定阈值: >30)`);
            logger.info(`天津 12328 服务热线青绿框命中: ${tjHotlineTeal} 点 (判定阈值: >10)`);
            logger.info(`天津核心线路色谱命中统计: 1号红(${tjRed}) 2号黄(${tjYellow}) 3号蓝(${tjSkyBlue}) 4号绿(${tjGreen}) 6号紫(${tjPurple}) 9号深蓝(${tjDeepBlue}) [匹配判定: ${tjLinesMatched ? '✅ 符合天津多线特征' : '❌ 未全部吻合'}]`);
            logger.groupEnd();
        }

        if ((aspectRatio >= 1.1 && tjLinesMatched) || tjHotlineTeal > 10) {
            const conf = tjHotlineTeal > 10 && tjLinesMatched ? 0.99 : 0.90;
            const result = {
                matched: true,
                cityId: 'tianjin',
                cityName: '天津',
                confidence: conf,
                reason: tjHotlineTeal > 10 ? '命中天津地铁 12328 服务热线特征青绿框' : '竖版全网 9 条核心线路标志色同步命中'
            };
            if (logger) {
                logger.info(`城市指纹匹配: ${result.cityName} (${result.cityId}) - 置信度 ${(conf * 100).toFixed(0)}% [原因: ${result.reason}]`);
            }
            return result;
        }

        if (logger) {
            logger.info('城市指纹匹配: 未命中预设官方指纹图谱，将作为通用底图进行视觉骨架与多色聚类提取');
        }
        return { matched: false, cityId: 'custom', cityName: '通用城市', confidence: 0, reason: '未匹配到预设指纹' };
    }

    /**
     * 图例优先：从图例区提取真实线路色彩
     */
    function extractLineColors(imageData, activeArea, legendArea) {
        const logger = window.DrunkLogger;
        const { width, data } = imageData;
        const bins = [];
        const scanArea = (legendArea && (legendArea.maxY - legendArea.minY) > 8) ? legendArea : activeArea;
        const step = 2;
        let validPixelsCount = 0;

        for (let y = scanArea.minY; y < scanArea.maxY; y += step) {
            for (let x = scanArea.minX; x < scanArea.maxX; x += step) {
                const i = (y * width + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const lum = (r + g + b) / 3;
                const sat = pixelSaturation(r, g, b);
                if (sat < 0.40 || lum < 45 || lum > 215) continue;

                validPixelsCount++;
                const lab = rgbToLab(r, g, b);
                let best = null, bestD = Infinity;
                for (const bin of bins) {
                    const d = deltaE(lab, bin.lab);
                    if (d < bestD) { bestD = d; best = bin; }
                }
                if (best && bestD < 12) {
                    best.count++;
                    best.r = (best.r * (best.count - 1) + r) / best.count;
                    best.g = (best.g * (best.count - 1) + g) / best.count;
                    best.b = (best.b * (best.count - 1) + b) / best.count;
                    best.lab = rgbToLab(best.r, best.g, best.b);
                } else if (bins.length < 24) {
                    bins.push({ r, g, b, lab, count: 1 });
                }
            }
        }

        const filteredColors = bins
            .filter(b => b.count >= 8)
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)
            .map((b, idx) => ({
                hex: rgbToHex(Math.round(b.r), Math.round(b.g), Math.round(b.b)),
                r: Math.round(b.r), g: Math.round(b.g), b: Math.round(b.b),
                lab: rgbToLab(Math.round(b.r), Math.round(b.g), Math.round(b.b)),
                count: b.count
            }));

        if (logger) {
            logger.group('色彩空间聚类详情 (CIELAB ΔE < 12)');
            logger.info(`扫描模式: ${legendArea ? '图例优先专用采样区' : '活跃绘图区高频采样'} (步长: ${step}px)`);
            logger.info(`采样有效高饱和度色彩像素: ${validPixelsCount} 个`);
            logger.info(`聚类聚合色系总数: ${bins.length} 类, 筛选出主干线路色: ${filteredColors.length} 种`);

            if (filteredColors.length > 0) {
                const tableData = filteredColors.map((c, i) => ({
                    '编号': `线路 ${i + 1}`,
                    'HEX 色值': c.hex,
                    'RGB 坐标': `rgb(${c.r}, ${c.g}, ${c.b})`,
                    'Lab (L*, a*, b*)': `${c.lab.L.toFixed(1)}, ${c.lab.a.toFixed(1)}, ${c.lab.b.toFixed(1)}`,
                    '采样密度 (点数)': c.count
                }));
                logger.table(tableData);
            }
            logger.groupEnd();
        }

        return filteredColors;
    }

    /**
     * 通用未识别城市的严格骨架采样器 (仅在有彩色线路连续存在的轨迹上找站)
     */
    function detectStationsOnContinuousLines(imageData, lineColors, area) {
        const logger = window.DrunkLogger;
        const { width, height, data } = imageData;
        const stations = [];
        if (!lineColors || lineColors.length === 0) return stations;

        // 步长增大，确保只保留高信度主干采样
        const step = 8;
        const minLineHits = 4;
        let whiteKernelChecked = 0;
        let colorNeighborHits = 0;
        let dedupFilteredCount = 0;
        const stationCountsPerColor = {};

        lineColors.forEach((color, lIdx) => {
            stationCountsPerColor[color.hex] = 0;
            for (let y = area.minY + 20; y < area.maxY - 20; y += step) {
                for (let x = area.minX + 20; x < area.maxX - 20; x += step) {
                    const i = (y * width + x) * 4;
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const lum = (r + g + b) / 3;

                    // 必须是白色圆点内核
                    if (lum > 215) {
                        whiteKernelChecked++;
                        // 校验四周 8 个方向是否紧邻该线路的标志色彩
                        let colorHits = 0;
                        const offsets = [[-8, 0], [8, 0], [0, -8], [0, 8], [-6, -6], [6, 6], [-6, 6], [6, -6]];
                        for (let [ox, oy] of offsets) {
                            const nx = x + ox, ny = y + oy;
                            if (nx >= area.minX && nx < area.maxX && ny >= area.minY && ny < area.maxY) {
                                const ni = (ny * width + nx) * 4;
                                const nlab = rgbToLab(data[ni], data[ni + 1], data[ni + 2]);
                                if (deltaE(nlab, color.lab) < 18) {
                                    colorHits++;
                                }
                            }
                        }

                        if (colorHits >= minLineHits) {
                            colorNeighborHits++;
                            // 站点去重 (距离过近跳过)
                            let tooClose = false;
                            for (let s of stations) {
                                if (Math.hypot(s.x - x, s.y - y) < 28) {
                                    tooClose = true;
                                    dedupFilteredCount++;
                                    break;
                                }
                            }
                            if (!tooClose) {
                                stations.push({ x, y, lineIndex: lIdx, color: color.hex });
                                stationCountsPerColor[color.hex]++;
                            }
                        }
                    }
                }
            }
        });

        if (logger) {
            logger.group('连续线路骨架寻站采样详情 (Continuous Line Tracing)');
            logger.info(`采样步长: ${step}px | 白色内核阈值: lum > 215`);
            logger.info(`内核核验数: ${whiteKernelChecked} 处 | 邻域线路色吻合数 (ΔE < 18, 命中 ≥ 4): ${colorNeighborHits} 处`);
            logger.info(`空间去重过滤 (< 28px 冗余点): ${dedupFilteredCount} 处`);
            logger.info(`最终提炼有效候选站点: ${stations.length} 座`);

            const lineSummary = lineColors.map((c, idx) => ({
                '线路编号': `线路 ${idx + 1}`,
                '线路颜色': c.hex,
                '捕获候选站点数': stationCountsPerColor[c.hex] || 0
            }));
            logger.table(lineSummary);
            logger.groupEnd();
        }

        return stations;
    }

    return {
        rgbToLab,
        deltaE,
        hexToRgb,
        rgbToHex,
        analyzeLayout,
        detectCitySignature,
        extractLineColors,
        detectStationsOnContinuousLines
    };
})();
