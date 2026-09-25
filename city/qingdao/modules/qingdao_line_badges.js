/**
 * CGo OpenMap - 青岛线路号徽标模块
 *
 * 设计原则：
 * 1. 仅将“数字线路”替换为青岛自定义的方形徽标；
 * 2. 蓝谷快线、西海岸快线等品牌线路继续沿用原项目 SVG；
 * 3. 多条数字线路在同一组徽标中自动合并，中文共用一次“号线”，英文合并为 “Line 1, 3, 8”；
 * 4. 全部逻辑留在城市侧，不修改 core。
 */
(function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    // 与北京/原项目线路徽标使用同一套 150 高坐标系：
    // 原徽标 viewBox 高 150，实际色块位于 y=25~125（高 100）。
    // 信息卡由核心按 32px 高显示，tooltip 按 34px 高显示；
    // 两个场景只做整体同比缩放，不再针对 tooltip 单独移动内部元素。
    const BADGE_CONFIG = {
        height: 150,
        squareSize: 100,
        squareY: 25,
        squareGap: 9.375,       // 32px 场景约 2px
        strokeWidth: 3,         // 对齐原线路徽标约 3/100 的白边比例
        cornerRadius: 5,        // 对齐 icon@01.svg 的 rx=5
        labelGap: 14.0625,      // 32px 场景约 3px
        chineseLabelOffsetX: -4.6875, // 32px 场景约左移 1px；仅调整“号线”
        numberFontSize: 91.40625,  // 32px 场景约 19.5px
        twoDigitNumberFontSize: 91.40625, // 与个位数同字号；两位数仅做横向压缩
        twoDigitNumberScaleX: 0.90,
        twoDigitNumberLetterSpacing: -4.6875, // 32px 场景约 -1px
        twoDigitNumberOffsetX: -1.875, // 32px 场景约左移 0.4px，修正 15 的视觉中心
        numberVerticalOffset: 7.03125,  // 32px 场景约 1.5px，较上一版微微下移
        labelVerticalOffset: 7.265625,   // 32px 场景约 1.55px
        chineseFontSize: 60.9375,        // 32px 场景约 13px
        englishFontSize: 35.15625,       // 32px 场景约 7.5px
        englishCharWidth: 20.390625,
        chineseLabelWidth: 117.1875
    };

    function getQingdaoLinesData() {
        if (Array.isArray(window.linesData)) return window.linesData;
        if (typeof linesData !== 'undefined' && Array.isArray(linesData)) return linesData;
        return [];
    }

    function getSourceFile(src) {
        return String(src || '').split('?')[0].split('/').pop();
    }

    function getLineForBadge(badge) {
        const sourceFile = getSourceFile(badge?.dataset?.src);
        if (!sourceFile) return null;
        const lineList = getQingdaoLinesData();

        // 数字线路优先按 icon@NN.svg 中的 NN 识别。
        // 青岛 8 号线与 8 号线支线共用 icon@08.svg，而支线在 linesData 中排在主线之前；
        // 若仅按 svg 文件取第一项，会误命中“8号线支线”并被数字线路规则排除。
        const sourceNumber = sourceFile.match(/^icon@(\d+)\.svg$/i)?.[1];
        if (sourceNumber) {
            const normalizedNumber = String(Number(sourceNumber));
            const canonicalNumericLine = lineList.find((line) => (
                !line?.isVirtual && String(line?.name || '') === `${normalizedNumber}号线`
            ));
            if (canonicalNumericLine) return canonicalNumericLine;
        }

        // 品牌快线（蓝谷快线 / 西海岸快线等）仍按原 SVG 精确匹配并保持原徽标。
        return lineList.find((line) => !line?.isVirtual && line?.svg === sourceFile) || null;
    }

    function getDisplayNumber(line) {
        const match = String(line?.name || '').match(/^(\d+)号线$/);
        return match ? match[1] : null;
    }

    function isNumericLine(line) {
        return Boolean(getDisplayNumber(line));
    }

    function dedupeNumericLines(lines) {
        const seen = new Set();
        const result = [];
        (lines || []).forEach((line) => {
            const number = getDisplayNumber(line);
            if (!number || seen.has(number)) return;
            seen.add(number);
            result.push(line);
        });
        return result;
    }

    function estimateEnglishWidth(text) {
        return Math.max(26, Math.ceil(String(text || '').length * BADGE_CONFIG.englishCharWidth));
    }

    function createNumericGroupBadge(lines) {
        const uniqueLines = dedupeNumericLines(lines);
        const numbers = uniqueLines.map(getDisplayNumber).filter(Boolean);
        if (!numbers.length) return null;

        const cfg = BADGE_CONFIG;
        const squareY = cfg.squareY;
        const squaresWidth = numbers.length * cfg.squareSize + Math.max(0, numbers.length - 1) * cfg.squareGap;
        const labelX = squaresWidth + cfg.labelGap;
        const englishLabel = `Line ${numbers.join(', ')}`;
        const labelWidth = Math.max(cfg.chineseLabelWidth, estimateEnglishWidth(englishLabel));
        const totalWidth = Math.ceil(labelX + labelWidth + 1);
        const centerY = cfg.height / 2;
        const numberVerticalOffset = cfg.numberVerticalOffset;

        const squareMarkup = uniqueLines.map((line, index) => {
            const number = getDisplayNumber(line);
            const x = index * (cfg.squareSize + cfg.squareGap);
            const centerX = x + cfg.squareSize / 2;
            const isTwoDigit = number.length > 1;
            const fontSize = isTwoDigit ? cfg.twoDigitNumberFontSize : cfg.numberFontSize;
            const textCenterX = centerX + (isTwoDigit ? cfg.twoDigitNumberOffsetX : 0);
            const numberTransform = isTwoDigit
                ? ` transform="translate(${textCenterX} 0) scale(${cfg.twoDigitNumberScaleX} 1) translate(${-textCenterX} 0)"`
                : "";
            return `
                <rect x="${x + cfg.strokeWidth / 2}" y="${squareY + cfg.strokeWidth / 2}" width="${cfg.squareSize - cfg.strokeWidth}" height="${cfg.squareSize - cfg.strokeWidth}" rx="${cfg.cornerRadius}" ry="${cfg.cornerRadius}" fill="${line.color}" stroke="#ffffff" stroke-width="${cfg.strokeWidth}" />
                <text x="${textCenterX}" y="${centerY + numberVerticalOffset}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="var(--font-en, 'Arimo', 'Arial', sans-serif)" font-size="${fontSize}" font-weight="700"${isTwoDigit ? ` letter-spacing="${cfg.twoDigitNumberLetterSpacing}"` : ""}${numberTransform}>${number}</text>
            `;
        }).join('');

        return {
            width: totalWidth,
            height: cfg.height,
            title: uniqueLines.map((line) => line.name).join(' / '),
            displayIds: uniqueLines.map((line) => line.id).join(','),
            svg: `
                <svg class="qingdao-line-badge-svg" viewBox="0 0 ${totalWidth} ${cfg.height}" aria-hidden="true" focusable="false" xmlns="${SVG_NS}">
                    ${squareMarkup}
                    <g transform="translate(${labelX} ${centerY + cfg.labelVerticalOffset})" fill="currentColor" text-anchor="start">
                        <text x="${cfg.chineseLabelOffsetX}" y="-22.03125" dominant-baseline="middle" font-family="var(--font-sans, 'Noto Sans SC', sans-serif)" font-size="${cfg.chineseFontSize}" font-weight="500" letter-spacing="2.109375">号线</text>
                        <text x="0" y="29.0625" dominant-baseline="middle" font-family="var(--font-en, 'Arimo', 'Arial', sans-serif)" font-size="${cfg.englishFontSize}" font-weight="700">${englishLabel}</text>
                    </g>
                </svg>
            `
        };
    }

    // ── 线网图线路号端牌 ────────────────────────────────────────────────
    // 借鉴 Sydney 的做法：线路端牌属于城市自己的地图装饰，不进入 core 的
    // 线路/车站语义层。青岛这里不直接复制 sydney_deco.svg，而是复用现有
    // 数字线路徽标逻辑：数字线路显示“色块 + 号线”，快线直接复用原 SVG。
    // 青岛火车 / 长途汽车 / 轮渡等散点图标均为 21×21。
    // 完整线路徽标 viewBox 高 150、数字色块高 100，因此整体放大到 31.5，
    // 可让数字色块本体恰好显示为 21×21。快线原 SVG 也沿用同一比例。
    const MAP_REFERENCE_ICON_SIZE = 21;
    const MAP_NUMERIC_BADGE_HEIGHT = BADGE_CONFIG.height * MAP_REFERENCE_ICON_SIZE / BADGE_CONFIG.squareSize; // 31.5
    const MAP_FAST_BADGE_HEIGHT = MAP_NUMERIC_BADGE_HEIGHT;
    const MAP_FAST_SVG_CACHE = new Map();
    const MAP_LINE_BADGE_PLACEMENTS = [
        // 数字线路：原则上两端都放；7 南（QDM07S）按需求只保留一个。
        // 位移单位按视觉口径微调：1 个色块≈21px，半个色块≈10.5px，一行英文高度≈7.5px。
        { lineId: "QDM01", at: "start", dx: -21,    dy: -21 },
        { lineId: "QDM01", at: "end",   dx: -21,    dy:  21.5 },
        { lineId: "QDM02", at: "start", dx: -36.75, dy: -34 },
        { lineId: "QDM02", at: "end",   dx: -35.75, dy:  10.5 },
        { lineId: "QDM03", at: "start", dx:  35,    dy: -42 },
        { lineId: "QDM03", at: "end",   dx: -42,    dy: -26.5 },
        { lineId: "QDM04", at: "start", dx:   0,    dy:  41.5 },
        { lineId: "QDM04", at: "end",   dx:   0,    dy: -34 },
        { lineId: "QDM05", at: "start", dx:  21,    dy:  41.5 },
        { lineId: "QDM05", at: "end",   dx:   0,    dy: -34 },
        { lineId: "QDM06", at: "start", dx:  -8,    dy: -42 },
        { lineId: "QDM06", at: "end",   dx: -34,    dy:  20 },
        { lineId: "QDM07N", at: "start", dx:   0,   dy:  34 },
        { lineId: "QDM07S", at: "start", dx:  34,   dy:  21 },
        { lineId: "QDM08", at: "start", dx:   0,    dy: -42 },
        { lineId: "QDM08", at: "end",   dx:   0,    dy:  44.5 },
        { lineId: "QDM08B", at: "end",  dx: -34,    dy:   0, displayNumber: "8" },
        { lineId: "QDM09", at: "start", dx:   0,    dy:  41.5 },
        { lineId: "QDM09", at: "end",   dx:   0,    dy: -34 },
        { lineId: "QDM15", at: "start", dx:   0,    dy: -34 },
        { lineId: "QDM15", at: "end",   dx:  64.65, dy: -42 },
        // 快线两端也放，直接复用原本线路徽标。
        { lineId: "QDM11", at: "start", dx:  92.4,  dy:   0 },
        { lineId: "QDM11", at: "end",   dx: -56.7,  dy:  34 },
        { lineId: "QDM13", at: "start", dx:   0,    dy: -34 },
        { lineId: "QDM13", at: "end",   dx: -34,    dy:  21 }
    ];

    function createMapNumericLineBadge(line, displayNumber = null) {
        const number = String(displayNumber || getDisplayNumber(line) || "").trim();
        if (!number) return null;

        const syntheticLine = displayNumber
            ? Object.assign({}, line, { name: `${number}号线` })
            : line;
        return createNumericGroupBadge([syntheticLine]);
    }

    function createMapFastLineBadge(line) {
        if (!line?.svg) return null;
        return {
            src: `./assets/svg/${line.svg}`,
            title: line.name,
            height: MAP_FAST_BADGE_HEIGHT,
            // 青岛两款快线原 SVG 均为 270×150。
            width: MAP_FAST_BADGE_HEIGHT * 270 / 150,
            svgclr: line.svgclr || line.color || '#00263b',
            svgtext: line.svgtext || '#ffffff'
        };
    }

    async function hydrateMapFastLineBadge(badge, line) {
        const fastData = createMapFastLineBadge(line);
        if (!fastData) return;

        badge.style.height = `${fastData.height}px`;
        badge.style.width = `${fastData.width}px`;
        badge.title = fastData.title;
        badge.style.setProperty('--svgclr', fastData.svgclr);
        badge.style.setProperty('--svgtext', fastData.svgtext);

        let svgPromise = MAP_FAST_SVG_CACHE.get(fastData.src);
        if (!svgPromise) {
            svgPromise = fetch(fastData.src)
                .then((response) => response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`)))
                .catch((error) => {
                    MAP_FAST_SVG_CACHE.delete(fastData.src);
                    console.warn('Qingdao map fast-line badge load failed:', fastData.src, error);
                    return '';
                });
            MAP_FAST_SVG_CACHE.set(fastData.src, svgPromise);
        }

        const svgContent = await svgPromise;
        if (!svgContent || !badge.isConnected) return;
        badge.innerHTML = svgContent.replace(/<\?xml[\s\S]*?\?>/i, '');
        const svg = badge.querySelector('svg');
        if (!svg) return;
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.display = 'block';
        svg.style.overflow = 'visible';
        svg.style.setProperty('--svgclr', fastData.svgclr);
        svg.style.setProperty('--svgtext', fastData.svgtext);
    }

    function getLinePathPoints(line) {
        if (!line) return [];
        if (Array.isArray(line.pathPoints)) return line.pathPoints;
        if (Array.isArray(line['pathPoints-main'])) return line['pathPoints-main'];
        return [];
    }

    function ensureMapLineBadgeLayer() {
        const mapContent = document.getElementById('map-content');
        if (!mapContent) return null;

        let layer = document.getElementById('qingdao-map-line-badges-layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'qingdao-map-line-badges-layer';
            layer.setAttribute('aria-hidden', 'true');
            Object.assign(layer.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: '15'
            });
            mapContent.appendChild(layer);
        }
        return layer;
    }

    function renderMapLineBadges() {
        const lineList = getQingdaoLinesData();
        if (!lineList.length) return false;
        const layer = ensureMapLineBadgeLayer();
        if (!layer) return false;

        layer.replaceChildren();
        MAP_LINE_BADGE_PLACEMENTS.forEach((placement) => {
            const line = lineList.find((item) => item?.id === placement.lineId && !item?.isVirtual);
            if (!line) return;
            const points = getLinePathPoints(line);
            if (!points.length) return;
            const anchor = placement.at === 'start' ? points[0] : points[points.length - 1];
            if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return;

            const badge = document.createElement('div');
            badge.className = 'qingdao-map-line-badge';
            badge.dataset.lineId = line.id;
            badge.style.position = 'absolute';
            badge.style.left = `${anchor.x + (placement.dx || 0)}px`;
            badge.style.top = `${anchor.y + (placement.dy || 0)}px`;
            badge.style.transform = 'translate(-50%, -50%)';
            badge.style.pointerEvents = 'none';
            badge.style.color = 'var(--text-main)';

            if (isNumericLine(line) || placement.displayNumber) {
                const badgeData = createMapNumericLineBadge(line, placement.displayNumber);
                if (!badgeData) return;
                badge.style.height = `${MAP_NUMERIC_BADGE_HEIGHT}px`;
                badge.style.width = `${badgeData.width * MAP_NUMERIC_BADGE_HEIGHT / badgeData.height}px`;
                badge.innerHTML = badgeData.svg;
                const svg = badge.firstElementChild;
                if (svg) {
                    svg.style.width = '100%';
                    svg.style.height = '100%';
                    svg.style.display = 'block';
                    svg.style.overflow = 'visible';
                }
            } else {
                const fastData = createMapFastLineBadge(line);
                if (!fastData) return;
                badge.style.height = `${fastData.height}px`;
                badge.style.width = `${fastData.width}px`;
            }
            layer.appendChild(badge);
            if (!isNumericLine(line) && !placement.displayNumber) {
                hydrateMapFastLineBadge(badge, line);
            }
        });
        return layer.childElementCount > 0;
    }

    function installMapLineBadges() {
        let attempts = 0;
        const tryRender = () => {
            if (renderMapLineBadges()) return;
            attempts += 1;
            if (attempts < 40) setTimeout(tryRender, 75);
        };
        tryRender();
    }

    function getBadgeHeight(badge) {

        const computedHeight = Number.parseFloat(window.getComputedStyle(badge).height);
        return Number.isFinite(computedHeight) && computedHeight > 0 ? computedHeight : BADGE_CONFIG.height;
    }

    function renderNumericBadge(badge, lines) {
        const badgeData = createNumericGroupBadge(lines);
        if (!badgeData) return false;

        const height = getBadgeHeight(badge);
        const width = badgeData.width * height / badgeData.height;

        badge.innerHTML = badgeData.svg;
        badge.classList.add('qingdao-line-badge');
        badge.dataset.qingdaoBadge = badgeData.displayIds;
        badge.style.width = `${width}px`;
        badge.title = badgeData.title;
        badge.setAttribute('aria-label', badgeData.title);
        return true;
    }

    function collectDirectBadges(container, selector) {
        return [...container.querySelectorAll(selector)]
            .filter((el) => el.parentElement === container);
    }

    function renderNumericBadgeGroups(container, selector) {
        const badges = collectDirectBadges(container, selector);
        if (!badges.length) return;

        // 与沈阳现有实现保持一致：必须等待同一容器里的原始徽标全部内联完成后再合并。
        // core 的 SVG 是逐个异步 fetch/inject 的；若中途先合并，五四广场可能先得到 3/8，
        // 等 2 号线完成时就无法再组成 2/3/8。
        if (!badges.every((badge) => badge.classList.contains('svg-icon-inlined'))) return;

        let currentGroup = [];
        const flush = () => {
            if (!currentGroup.length) return;
            const lines = dedupeNumericLines(currentGroup.map((entry) => entry.line));
            const finalBadge = currentGroup[currentGroup.length - 1].badge;
            if (renderNumericBadge(finalBadge, lines)) {
                currentGroup.slice(0, -1).forEach((entry) => entry.badge.remove());
            }
            currentGroup = [];
        };

        badges.forEach((badge) => {
            // 已经完成青岛数字组渲染的徽标保持原样，不再参与二次拆组。
            if (badge.dataset.qingdaoBadge) {
                flush();
                return;
            }
            const line = getLineForBadge(badge);
            if (line && isNumericLine(line)) {
                currentGroup.push({ badge, line });
            } else {
                // 蓝谷快线 / 西海岸快线等品牌线路保留原 SVG，同时作为数字组边界。
                flush();
            }
        });
        flush();
    }

    function belongsToGroupedBadgeContext(badge) {
        return Boolean(
            badge.closest('.panel-badges')
            || badge.closest('#station-selector .selector-item')
            || badge.closest('.transfer-section .info-row > div:last-child')
        );
    }

    function renderSingleNumericBadges(selector, { excludeGroupedContexts = false } = {}) {
        document.querySelectorAll(selector).forEach((badge) => {
            // 多线区域必须由分组逻辑独占处理，避免 core 逐个异步内联 SVG 时，
            // 已完成的某一条线路被单线路逻辑提前改写，导致首次打开三线换乘站只合并部分线路。
            if (excludeGroupedContexts && belongsToGroupedBadgeContext(badge)) return;
            const line = getLineForBadge(badge);
            if (!line || !isNumericLine(line)) return;
            renderNumericBadge(badge, [line]);
        });
    }

    function syncQingdaoLineBadges() {
        document.querySelectorAll('.panel-badges').forEach((container) => {
            renderNumericBadgeGroups(container, ':scope > .line-badge[data-src]');
        });

        document.querySelectorAll('#station-selector .selector-item').forEach((item) => {
            renderNumericBadgeGroups(item, ':scope > [data-src]');
        });

        document.querySelectorAll('.transfer-section .info-row > div:last-child').forEach((container) => {
            // 同一目标站的 transfer-link 才属于一组；不同目标站不能跨组合并。
            const groups = new Map();
            collectDirectBadges(container, ':scope > .line-badge.transfer-link[data-src]').forEach((badge) => {
                const targetSid = badge.dataset.jumpSid || '';
                if (!groups.has(targetSid)) groups.set(targetSid, []);
                groups.get(targetSid).push(badge);
            });
            groups.forEach((group) => {
                if (!group.length || !group.every((badge) => badge.classList.contains('svg-icon-inlined'))) return;
                if (group.some((badge) => badge.dataset.qingdaoBadge)) return;
                const entries = group.map((badge) => ({ badge, line: getLineForBadge(badge) }));
                if (!entries.every((entry) => entry.line && isNumericLine(entry.line))) return;
                const lines = dedupeNumericLines(entries.map((entry) => entry.line));
                const finalBadge = entries[entries.length - 1].badge;
                if (renderNumericBadge(finalBadge, lines)) {
                    entries.slice(0, -1).forEach((entry) => entry.badge.remove());
                }
            });
        });

        renderSingleNumericBadges('.line-badge.svg-icon-inlined[data-src]:not([data-qingdao-badge])', { excludeGroupedContexts: true });
        renderSingleNumericBadges('.search-line-icon.svg-icon-inlined[data-src]:not([data-qingdao-badge])');
        renderSingleNumericBadges('#line-tooltip > .svg-icon-inlined[data-src]:not([data-qingdao-badge])');
    }

    function installObserver() {
        const root = document.body;
        if (!root || root.dataset.qingdaoLineBadgeObserver === 'true') return;

        let frameId = 0;
        const scheduleSync = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                syncQingdaoLineBadges();
            });
        };

        const observer = new MutationObserver(scheduleSync);
        observer.observe(root, { childList: true, subtree: true });
        root.dataset.qingdaoLineBadgeObserver = 'true';
        scheduleSync();
    }

    window.QingdaoLineBadges = {
        isNumericLine,
        getDisplayNumber,
        createNumericGroupBadge,
        createMapNumericLineBadge,
        mapPlacements: MAP_LINE_BADGE_PLACEMENTS,
        renderMapLineBadges,
        sync: syncQingdaoLineBadges
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installObserver, { once: true });
        document.addEventListener('DOMContentLoaded', installMapLineBadges, { once: true });
    } else {
        installObserver();
        installMapLineBadges();
    }

    document.dispatchEvent(new CustomEvent('cgo:city-module-ready', {
        detail: { cityId: 'qingdao', moduleId: 'qingdao-line-badges' }
    }));
})();
