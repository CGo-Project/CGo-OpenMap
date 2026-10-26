#!/usr/bin/env node
/**
 * CGo OpenMap - 全局线网物理尺度与站距等比缩放工具 (scripts/rescale-city.js)
 *
 * 用途:
 *   用于调整目标城市线路图的全局物理坐标跨度与车站间距，轻松控制整张地图的疏密程度。
 *   不同于前端视口/SVG的单纯放大缩小（视口放大后图标和文字也会跟着变大，依然无法解决文字拥挤），
 *   本工具是等比例缩放车站和线路的物理坐标间距，而保持车站图标、文字字号、轨道线宽与控件大小恒定！
 *
 * 用法:
 *   node scripts/rescale-city.js <city_id> <scaleFactor> [--dry-run]
 *
 * 参数说明:
 *   city_id      城市英文标识（如 beijing, shanghai, shenzhen, beijing_plan 等）
 *   scaleFactor  间距缩放倍数（如 1.5 表示站距拉大50%解决文字挤压；0.8 表示站距收拢20%消除空旷）
 *   --dry-run    预览计算结果与统计，不实际写入文件
 *
 * 示例:
 *   node scripts/rescale-city.js beijing_plan 1.5   # 站间距拉大 1.5 倍
 *   node scripts/rescale-city.js shanghai 0.8        # 站间距收拢至 0.8 倍
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 命令行参数解析
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const cleanArgs = args.filter(a => a !== '--dry-run');

if (cleanArgs.length < 2) {
    console.error('用法: node scripts/rescale-city.js <city_id> <scaleFactor> [--dry-run]');
    console.error('示例: node scripts/rescale-city.js beijing_plan 1.5');
    process.exit(1);
}

const cityId = cleanArgs[0];
const scaleFactor = parseFloat(cleanArgs[1]);

if (isNaN(scaleFactor) || scaleFactor <= 0) {
    console.error('错误: scaleFactor 必须是大于 0 的有效浮点数 (例如 1.5 或 0.8)');
    process.exit(1);
}

console.log('\n🚀 [CGo OpenMap] 全局尺度调整工具启动');
console.log('  城市 ID:        ' + cityId);
console.log('  间距缩放倍数:   ' + scaleFactor + 'x (' + (scaleFactor > 1 ? '拉大站间距 / 舒展排版' : '收缩站间距 / 紧凑线网') + ')');
console.log('  运行模式:       ' + (isDryRun ? 'DRY RUN (仅预览，不写盘)' : 'LIVE (写回文件并更新缓存)') + '\n');

// 1. 读取 city/data.js 获取城市注册信息
const cityDataPath = path.join(ROOT, 'city', 'data.js');
if (!fs.existsSync(cityDataPath)) {
    console.error('错误: 找不到城市注册表 ' + cityDataPath);
    process.exit(1);
}

const cityDataCode = fs.readFileSync(cityDataPath, 'utf8');
let registry = null;
try {
    const mockWindow = {
        location: { search: '', href: '', pathname: '' },
        localStorage: { getItem: () => null, setItem: () => {} },
        document: { getElementById: () => null }
    };
    const fn = new Function('window', 'document', 'location', 'localStorage', cityDataCode + '\n;return window.CITY_REGISTRY || (typeof CITY_REGISTRY !== "undefined" ? CITY_REGISTRY : null);');
    registry = fn(mockWindow, mockWindow.document, mockWindow.location, mockWindow.localStorage);
} catch (err) {
    console.error('解析 city/data.js 失败:', err.message);
    process.exit(1);
}

const cityConfig = registry ? registry[cityId] : null;
if (!cityConfig) {
    console.error('错误: 城市 ID "' + cityId + '" 未在 city/data.js 中注册！');
    process.exit(1);
}

const cityDir = path.resolve(ROOT, cityConfig.folder || ('./city/' + cityId));
if (!fs.existsSync(cityDir)) {
    console.error('错误: 城市目录不存在: ' + cityDir);
    process.exit(1);
}

console.log('  定位城市目录:   ' + path.relative(ROOT, cityDir));

// 辅助：安全求值数据文件
function evalDataFile(source, globalName) {
    const body = source + '\n;return (typeof ' + globalName + ' !== "undefined") ? ' + globalName + ' : null;';
    return new Function(body)();
}

// 2. 处理 data_stations.js
const stationsFile = path.join(cityDir, 'data_stations.js');
let stationsProcessed = 0;
if (fs.existsSync(stationsFile)) {
    const origStationsText = fs.readFileSync(stationsFile, 'utf8');
    const stationsData = evalDataFile(origStationsText, 'stationsData');

    if (stationsData && typeof stationsData === 'object') {
        const stationKeys = Object.keys(stationsData);
        stationsProcessed = stationKeys.length;

        // 计算缩放前后的核心区站间距统计
        let totalDist = 0, distCount = 0;
        const coords = [];
        for (const id of stationKeys) {
            const s = stationsData[id];
            coords.push({ x: s.x, y: s.y });
            s.x = Math.round(s.x * scaleFactor * 10) / 10;
            s.y = Math.round(s.y * scaleFactor * 10) / 10;
            // offset, textScale, align, type 严格保持不变
        }

        // 提取原头部注释
        const headerMatch = origStationsText.match(/^([\s\S]*?)(const\s+stationsData\s*=|var\s+stationsData\s*=)/);
        const header = headerMatch ? headerMatch[1].trim() : '/**\n * CGo OpenMap - 车站数据库\n */';

        // 格式化输出 (保持紧凑单行格式，易读且便于 git diff)
        const entriesLines = stationKeys.map((id, idx) => {
            const isLast = idx === stationKeys.length - 1;
            return '    "' + id + '": ' + JSON.stringify(stationsData[id]) + (isLast ? '' : ',');
        });

        const newStationsContent = header + '\n\nconst stationsData = {\n' +
            entriesLines.join('\n') +
            '\n};\n\nif (typeof module !== "undefined" && module.exports) {\n    module.exports = stationsData;\n}\n';

        if (!isDryRun) {
            fs.writeFileSync(stationsFile, newStationsContent, 'utf8');
        }
        console.log('  ✓ 车站坐标已缩放:   ' + stationsProcessed + ' 座车站 (data_stations.js)');
    } else {
        console.warn('  ⚠️ 无法解析 data_stations.js 中的 stationsData');
    }
} else {
    console.warn('  ⚠️ 找不到 data_stations.js，跳过车站缩放');
}

// 3. 处理 data_lines.js (缩放走向折点 pathPoints 及各分支点阵)
const linesFile = path.join(cityDir, 'data_lines.js');
let pointsScaled = 0;
let linesCount = 0;
if (fs.existsSync(linesFile)) {
    const origLinesText = fs.readFileSync(linesFile, 'utf8');
    const linesData = evalDataFile(origLinesText, 'linesData');

    if (Array.isArray(linesData)) {
        linesCount = linesData.length;
        for (const line of linesData) {
            if (Array.isArray(line.pathPoints)) {
                for (const pt of line.pathPoints) {
                    pt.x = Math.round(pt.x * scaleFactor * 10) / 10;
                    pt.y = Math.round(pt.y * scaleFactor * 10) / 10;
                    if (typeof pt.r === 'number') {
                        pt.r = Math.round(pt.r * scaleFactor * 10) / 10;
                    }
                    pointsScaled++;
                }
            }
            ['pathPoints-main', 'pathPoints-branch1', 'pathPoints-branch2'].forEach(key => {
                if (Array.isArray(line[key])) {
                    for (const pt of line[key]) {
                        pt.x = Math.round(pt.x * scaleFactor * 10) / 10;
                        pt.y = Math.round(pt.y * scaleFactor * 10) / 10;
                        if (typeof pt.r === 'number') {
                            pt.r = Math.round(pt.r * scaleFactor * 10) / 10;
                        }
                        pointsScaled++;
                    }
                }
            });
        }

        const headerMatch = origLinesText.match(/^([\s\S]*?)(const\s+linesData\s*=|var\s+linesData\s*=)/);
        const header = headerMatch ? headerMatch[1].trim() : '/**\n * CGo OpenMap - 线路走向数据库\n */';

        const newLinesContent = header + '\n\nconst linesData = ' + JSON.stringify(linesData, null, 4) + ';\n\nif (typeof module !== "undefined" && module.exports) {\n    module.exports = linesData;\n}\n';

        if (!isDryRun) {
            fs.writeFileSync(linesFile, newLinesContent, 'utf8');
        }
        console.log('  ✓ 线路走向折点缩放: ' + pointsScaled + ' 个走向折点，覆盖 ' + linesCount + ' 条线路 (data_lines.js)');
    } else {
        console.warn('  ⚠️ 无法解析 data_lines.js 中的 linesData');
    }
} else {
    console.warn('  ⚠️ 找不到 data_lines.js，跳过线路折点缩放');
}

// 4. 处理 data_notopen.js (在建规划线折点)
const notopenFile = path.join(cityDir, 'data_notopen.js');
if (fs.existsSync(notopenFile)) {
    const origNotopenText = fs.readFileSync(notopenFile, 'utf8');
    const notopenData = evalDataFile(origNotopenText, 'NOT_OPEN_LINES');
    let notopenPoints = 0;
    if (Array.isArray(notopenData)) {
        for (const item of notopenData) {
            if (Array.isArray(item.points)) {
                for (const pt of item.points) {
                    pt.x = Math.round(pt.x * scaleFactor * 10) / 10;
                    pt.y = Math.round(pt.y * scaleFactor * 10) / 10;
                    notopenPoints++;
                }
            }
        }
        const newNotopenContent = '/**\n * CGo OpenMap - 未开通线路规划虚线数据库\n */\n\nconst NOT_OPEN_LINES = ' +
            JSON.stringify(notopenData, null, 4) + ';\n\nif (typeof module !== "undefined" && module.exports) {\n    module.exports = NOT_OPEN_LINES;\n}\n';
        if (!isDryRun) {
            fs.writeFileSync(notopenFile, newNotopenContent, 'utf8');
        }
        console.log('  ✓ 在建虚线折点缩放: ' + notopenPoints + ' 个折点 (data_notopen.js)');
    }
}

// 5. 更新 city/data.js (画布尺寸 mapSize 与中心点 center)
const oldW = cityConfig.mapSize?.width || 2000;
const oldH = cityConfig.mapSize?.height || 1600;
const oldCx = cityConfig.center?.x || oldW / 2;
const oldCy = cityConfig.center?.y || oldH / 2;

const newW = Math.round(oldW * scaleFactor);
const newH = Math.round(oldH * scaleFactor);
const newCx = Math.round(oldCx * scaleFactor * 10) / 10;
const newCy = Math.round(oldCy * scaleFactor * 10) / 10;

console.log('\n  📏 画布与视口更新:');
console.log('     画布尺寸 mapSize: ' + oldW + ' × ' + oldH + '  →  ' + newW + ' × ' + newH + ' px');
console.log('     视口中心 center:  (' + oldCx + ', ' + oldCy + ')  →  (' + newCx + ', ' + newCy + ')');

if (!isDryRun) {
    const cityRegex = new RegExp('([\\\"\\\']' + cityId + '[\\\"\\\']\\s*:\\s*\\{[\\s\\S]*?\\n\\s*\\})', 'm');
    const cityMatch = cityDataCode.match(cityRegex);
    if (cityMatch) {
        let cityBlock = cityMatch[1];
        cityBlock = cityBlock.replace(/mapSize\s*:\s*\{\s*width\s*:\s*[0-9\.]+\s*,\s*height\s*:\s*[0-9\.]+\s*\}/, 
            'mapSize: { width: ' + newW + ', height: ' + newH + ' }');
        cityBlock = cityBlock.replace(/center\s*:\s*\{\s*x\s*:\s*[0-9\.]+\s*,\s*y\s*:\s*[0-9\.]+\s*\}/,
            'center: { x: ' + newCx + ', y: ' + newCy + ' }');

        const newCityDataCode = cityDataCode.replace(cityMatch[1], cityBlock);
        fs.writeFileSync(cityDataPath, newCityDataCode, 'utf8');
        console.log('  ✓ city/data.js 已同步写入新画布与视口配置');
    } else {
        console.warn('  ⚠️ 未能在 city/data.js 中精确定位到 ' + cityId + ' 的代码块，请手动核对 mapSize 和 center');
    }
}

// 6. 更新 sw.js 缓存版本号
const swPath = path.join(ROOT, 'sw.js');
if (!isDryRun && fs.existsSync(swPath)) {
    const swCode = fs.readFileSync(swPath, 'utf8');
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const newVersion = yy + mm + dd + '.' + hh + min + ss;

    const newSwCode = swCode.replace(
        /const CACHE_NAME = 'cgo-openmap-v[0-9]{6}\.[0-9]{6}';/,
        "const CACHE_NAME = 'cgo-openmap-v" + newVersion + "';"
    );

    if (newSwCode !== swCode) {
        fs.writeFileSync(swPath, newSwCode, 'utf8');
        console.log('  ✓ sw.js 缓存版本号已更新为: v' + newVersion);
    }
}

console.log('\n🎉 全局尺度缩放调整完成！');
if (isDryRun) {
    console.log('  [提示] 当前为 DRY RUN 模式，未实际修改任何文件。确认无误后去掉 --dry-run 执行正式缩放。');
} else {
    console.log('  [提示] 建议刷新浏览器或按 Ctrl+F5 强制刷新查看全新的站间距排版效果。');
}
