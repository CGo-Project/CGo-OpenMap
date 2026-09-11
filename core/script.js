/**
 * CGo OpenMap - 核心矢量渲染与交互引擎 (core/script.js)
 * 
 * ==============================================================================
 * 核心架构与引擎工作流 (Engine Architecture & Workflow)
 * ==============================================================================
 * 本脚本为 CGo OpenMap 的核心中枢，负责：
 * 1. 【城市上下文解耦】读取当前激活城市配置 (getActiveCity)；
 * 2. 【数据解析与拓扑构建】合并重复物理点位、统计换乘关系 (processData)；
 * 3. 【SVG 矢量图形渲染】自动将折线点阵倒角生成 45°/90° 平滑圆角路径 (renderLines, generateRoundedPath)；
 * 4. 【站点与标签布局】根据 align 对齐方式渲染站点圆环与双语标签 (renderStations)；
 * 5. 【手势与漫游系统】支持滚轮缩放、触控板手势、双指捏合缩放、鼠标平移拖拽 (initInputControls)；
 * 6. 【多维车站检索】拼音/汉字/英文/历史别名模糊索引与快速飞跃居中 (bindSearchAndLegendEvents)；
 * 7. 【车站卡片与微缩视窗】StaCard API 动态接入高德切片与立体站台结构 (renderUserModePanel, StaCard)；
 * 8. 【LBS 地理定位】WGS-84 转 GCJ-02 加密坐标算法与最近车站计算 (findNearestStation, wgs2gcj)；
 * 9. 【侧边栏吸附与响应式】移动端底部抽屉与桌面端常驻侧边栏自动切换适配 (dockStationPanel, handleResponsiveSwitch)。
 * 
 * 开发者移植说明：
 * 核心引擎完全通用，制作新城市无需修改本文件任何核心逻辑！
 * ==============================================================================
 */

const APP_VERSION = "260903.220000";
const originalTitle = document.title;
const originalDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || "CGo OpenMap";

// 用户最近点击查看的车站历史 ID 队列 (用于侧边栏吸附历史记录)
window.STATION_HISTORY = [];

/**
 * 从 GLOBAL_SCHEDULE_DATA 条目取出可点击的官网 URL。
 * 兼容字符串外链，以及带 url 字段的官方首末班结构对象。
 */
function resolveScheduleHref(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    if (typeof entry === 'object' && typeof entry.url === 'string' && entry.url) return entry.url;
    return null;
}

/**
 * 重建常驻侧边栏中的历史车站折叠面板列表
 */
function rebuildSidebarHistory() {
    const container = document.getElementById('sidebar-dynamic-content');
    if (!container) return;
    const panel = document.getElementById('info-panel');
    if (panel && container.contains(panel)) {
        document.body.appendChild(panel);
        panel.style.display = 'none';
    }
    container.innerHTML = '';
    if (!document.body.classList.contains('legend-pinned')) return;
    window.STATION_HISTORY.forEach(sid => {
        const station = processedStations[sid];
        if (!station) return;
        const sectionId = `station-section-${sid}`;
        const div = document.createElement('div');
        div.id = sectionId;
        div.className = 'panel-section station-history-section collapsed'; // 默认折叠
        div.dataset.sid = sid;
        let sectionTitle = station.cn + '站';
        if (sectionTitle.includes('站站')) {
            const isRail = station.relatedLines && station.relatedLines.some(lid => isSuburbanLine(lid));
            sectionTitle = isRail ? sectionTitle.replace('站站', '站 (火车站)') : sectionTitle.replace('站站', '站 (地铁站)');
        }
        div.innerHTML = `
            <div class="section-header">
                <span>${sectionTitle}</span>
                <span class="header-color-squares">
                ${(station.relatedLines || []).slice().sort((a, b) => window.getLineSortIndex(a) - window.getLineSortIndex(b)).map(lid => {
            const line = linesData.find(l => l.id === lid);
            return line ? `<span class="header-color-square" style="background:${line.color};" title="${line.name}"></span>` : '';
        }).join('')}
                </span>
                <cgo-icon name="expand-more" class="section-arrow"></cgo-icon>
            </div>
            <div class="section-body">
                <div style="padding:20px;text-align:center;color:var(--text-light);font-size:12px;cursor:pointer;border:1px dashed var(--divider);margin:10px;border-radius:6px;" onclick="selectStation('${sid}')">点击此处查看详情</div>
            </div>
        `;
        container.appendChild(div);
    });
}

/**
 * 获取当前处于激活状态的城市配置与业务对象
 * @returns {Object} 激活城市对象（包含排序、连通关系、外链生成器等）
 */
function getActiveCity() {
    let registryData = null;
    if (typeof window.getCurrentCityData === 'function') {
        registryData = window.getCurrentCityData();
    }
    const runtimeCity = window.CURRENT_CITY || (registryData?.id === 'shanghai' ? window.SHANGHAI_CITY : window.BEIJING_CITY) || {};

    let currentMeta = {};
    if (typeof window !== 'undefined' && window._GLOBAL_LINE_META) {
        currentMeta = window._GLOBAL_LINE_META;
    } else if (typeof linesData !== 'undefined' && Array.isArray(linesData)) {
        currentMeta = linesData.reduce((acc, l) => {
            if (l.name && !acc[l.name]) {
                acc[l.name] = { id: l.id, svg: l.svg, svgclr: l.svgclr, svgtext: l.svgtext, company: l.company, color: l.color };
            }
            return acc;
        }, {});
    }

    const defaultFallback = {
        id: 'beijing',
        name: '北京',
        center: { x: 900, y: 640 },
        defaultScale: 1.1,
        mapSize: { width: 1850, height: 1300 },
        searchCity: '北京',
        maintainers: [
            { name: "NaL - CentralGo", role: "城市主理人" },
            { name: "SierraQin", role: "运营数据支持" },
            { name: "Freedom Space", role: "市郊铁路校对" }
        ],
        LINE_META: currentMeta,
        LINE_SORT_ORDER: [],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        getNavigationUrl: (name, isR) => `https://uri.amap.com/search?keyword=${encodeURIComponent(name + (isR ? '' : '地铁站'))}&city=${encodeURIComponent(registryData?.searchCity || '北京')}`,
        getRailway12306Url: (name) => `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(name.replace(/站$/, ''))}`,
        getSuburbanLinks: () => null,
        dataFiles: {
            stanameCsvUrl: './city/beijing/staname.csv',
            amapDataUrl: './city/beijing/amap_data.json'
        },
        formatOwnerName: (name) => name,
        formatCompanyString: (list) => [...new Set(list)].join('，')
    };

    const merged = Object.assign({}, defaultFallback, registryData || {}, runtimeCity);
    if (!merged.LINE_META || Object.keys(merged.LINE_META).length === 0) {
        merged.LINE_META = currentMeta;
    }
    return merged;
}

window.getActiveCity = getActiveCity;

/**
 * 获取指定线路在当前城市中的展示排序索引
 * @param {string} lineId - 线路 ID
 * @returns {number} 排序序号 (数值越小越靠前)
 */
window.getLineSortIndex = function (lineId) {
    const city = getActiveCity();
    if (typeof city.getLineSortIndex === 'function') {
        return city.getLineSortIndex(lineId);
    }
    const sortOrder = city.LINE_SORT_ORDER || [];
    const index = sortOrder.indexOf(lineId);
    return index === -1 ? 9999 : index;
};

// 全局响应式属性代理
Object.defineProperty(window, 'LINE_SORT_ORDER', {
    get() { return getActiveCity().LINE_SORT_ORDER || []; },
    set(val) { const c = getActiveCity(); if (c) c.LINE_SORT_ORDER = val; },
    configurable: true
});
let _manualLineMeta = null;
Object.defineProperty(window, 'LINE_META', {
    get() {
        if (_manualLineMeta) return _manualLineMeta;
        if (typeof window !== 'undefined' && window._GLOBAL_LINE_META) return window._GLOBAL_LINE_META;
        return getActiveCity().LINE_META || {};
    },
    set(val) {
        _manualLineMeta = val;
        const c = getActiveCity();
        if (c) c.LINE_META = val;
    },
    configurable: true
});
Object.defineProperty(window, 'LINE_SYNC_GROUPS', {
    get() { return getActiveCity().LINE_SYNC_GROUPS || []; },
    set(val) { const c = getActiveCity(); if (c) c.LINE_SYNC_GROUPS = val; },
    configurable: true
});

/**
 * 车站 SVG 图标模板字典
 * 包括：换乘站(tsf)、虚拟换乘站(tsfo)、普通站(dot)、暂缓开通站(no)、国铁火车站(rdot)
 */
const SVGTemplates = {
    tsf: `<svg viewBox="0 0 17.5 17.5"><circle cx="8.75" cy="8.75" r="8.75" style="fill: var(--map-bg);"/><circle cx="8.75" cy="8.75" r="8" style="fill: var(--station-stroke);"/><circle cx="8.75" cy="8.75" r="7.1" style="fill: var(--map-bg);"/><path d="M6.21,8.01c.12-2.35,2.26-4.22,4.88-4.22.23,0,.46.01.68.04-.55-.18-1.15-.27-1.77-.27-2.8,0-5.09,1.96-5.3,4.45h-1.4l2.34,2.47c.78-.82,1.56-1.65,2.34-2.47h-1.78.01Z" style="fill: var(--station-stroke);"/><path d="M11.85,7.02c-.78.82-1.56,1.65-2.34,2.47h1.78c-.12,2.35-2.26,4.22-4.88,4.22-.23,0-.46-.01-.68-.04.55.18,1.15.27,1.77.27,2.8,0,5.09-1.96,5.3-4.45h1.4l-2.34-2.47h0Z" style="fill: var(--station-stroke);"/></svg>`,
    tsfo: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:{{COLOR}};"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
    dot: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:{{COLOR}};"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
    no: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><path d="M7.5,5c0-.1-.02-.19-.03-.29l1.7-.13c-.05-.46-.15-.9-.33-1.3l-1.54.73c-.08-.18-.18-.34-.3-.5l1.41-.96c-.26-.37-.59-.69-.95-.95l-.97,1.41c-.15-.12-.32-.22-.5-.3l.74-1.54c-.4-.18-.84-.29-1.3-.34l-.14,1.7c-.1-.01-.19-.03-.29-.03s-.19.02-.29.03l-.13-1.7c-.46.05-.9.15-1.3.33l.73,1.54c-.18.08-.34.18-.5.3l-.96-1.41c-.37.26-.69.59-.95.95l1.41.97c-.12.15-.22.32-.3.5l-1.54-.74c-.18.4-.29.84-.34,1.3l1.7.14c-.01.1-.03.19-.03.29s.02.19.03.29l-1.7.13c.05.46.15.9.33,1.3l1.54-.73c.08.18.18.34.3.5l-1.41.96c.26.37.59.69.95.95l.97-1.41c.15.12.32.22.5.3l-.74,1.54c.4.18.84.29,1.3.34l.14-1.7c.1.01.19.03.29.03s.19-.02.29-.03l.13,1.7c.46-.05.9-.15,1.3-.33l-.73-1.54c.18-.08.34-.18.5-.3l.96,1.41c.37-.26.69-.58.95-.95l-1.41-.97c.12-.15.22-.32.3-.5l1.54.74c.18-.4.29-.84.34-1.3l-1.7-.14c.01-.1.03-.19.03-.29Z" style="fill: var(--not-open-color);"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
    rdot: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:#78848b;"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`
};

// 默认圆角半径常量 (px)
const RADIUS_90 = 18; // 90度拐角圆角半径
const RADIUS_45 = 8;  // 45度拐角圆角半径

/**
 * 规范化 SVG 徽标文件路径
 * @param {string} filename - 文件名或路径
 * @returns {string} 统一格式后的 assets 路径
 */
const getSvgPath = (filename) => {
    if (!filename) return '';
    if (/^(https?:|\/|\.\/)/.test(filename)) {
        return filename;
    }
    const clean = filename.replace(/^(\.\/)?(assets\/svg\/|svg\/)/, '');
    return `./assets/svg/${clean}`;
};
window.getSvgPath = getSvgPath;

// DOM 核心容器元素引用
const mapContainer = document.getElementById('map-container');
const mapContent = document.getElementById('map-content');
const svgLayer = document.getElementById('lines-layer');
const stationsLayer = document.getElementById('stations-layer');
const labelsLayer = document.getElementById('labels-layer');
const infoPanel = document.getElementById('info-panel');
const lineTooltip = document.getElementById('line-tooltip');
const lineTooltipImg = document.getElementById('line-tooltip-img');

// 运行时状态变量
let processedStations = {};      // 归并拓扑后的车站字典 (Key: sid)
let currentScale = 1.1;           // 当前缩放比例
let currentX = 0;                 // 当前画布 X 轴平移像素
let currentY = 0;                 // 当前画布 Y 轴平移像素
let tooltipTimer = null;          // 悬停线路徽标隐藏定时器
let lastSelectedStationId = null; // 当前选中的车站 ID
let HeadlessSvgRenderer = null;
let isMapDragging = false;        // 地图是否处于拖拽状态

/**
 * 初始化车站卡片系统 (StaCard API)
 */
async function initStaCardSystem() {
    const city = getActiveCity();
    if (typeof city.initStaCard === 'function') {
        try {
            await city.initStaCard();
        } catch (e) {
            console.warn("[StaCard] 城市车站卡片初始化异常:", e);
        }
    }
}

/**
 * 地图总入口初始化函数 (Main Initialization)
 */
async function init() {
    await initStaCardSystem();
    initGeoSystem();
    processData();
    await loadStationAliases();

    renderScatteredObjects();
    renderLines();
    renderNotOpenLines();
    renderVirtualConnectors();
    renderStations();

    renderLegend();
    bindEvents();
    initInputControls()
    initTheme();
    centerMap();
    handleUrlParams();
}

/**
 * 解析并处理 URL 中的快捷定位与激活参数
 * 支持格式: ?=nmlsta&{lineId}&{stationId} 或 ?=nmlsta&{lineId}&{stationId}tab2
 */
function handleUrlParams() {
    const search = window.location.search;
    if (!search.startsWith('?=')) return;

    // 格式: ?=属性&lineid&stationid
    const params = search.substring(2).split('&');
    if (params.length < 3) return;

    const attr = params[0]; // nmlsta
    const lineId = params[1];
    let stationId = params[2];
    let tabIndex = 0;

    // 解析 tab 后缀 (例如 M123tab2 代表直接打开第2个选项卡)
    const tabMatch = stationId.match(/^(.*?)(tab(\d+))?$/);
    if (tabMatch) {
        stationId = tabMatch[1];
        if (tabMatch[3]) {
            // URL 中是 1-based index (tab1, tab2...), 转换为 0-based
            tabIndex = parseInt(tabMatch[3]) - 1;
        }
    }

    // 验证车站是否存在并延时触发平滑飞跃居中
    if (processedStations && processedStations[stationId]) {
        console.log(`URL Activation: Activating station ${stationId} on ${attr} with tab index ${tabIndex}`);
        setTimeout(() => {
            selectStation(stationId, undefined, undefined, tabIndex);
        }, 100);
    } else {
        console.warn(`URL Activation: Station ${stationId} not found, ignoring.`);
    }
}

/**
 * 立即隐藏悬停线路徽标的气泡提示
 */
function hideLineTooltipNow() {
    if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
    }
    if (lineTooltip) {
        lineTooltip.style.display = 'none';
    }
}

/**
 * 异步加载并解析历史曾用站名与拼音别名库 (staname.csv)
 * 作用：建立旧站名、别名、历史更名与当前标准站名的多对一映射，增强搜索识别度
 */
async function loadStationAliases() {
    const csvUrl = getActiveCity()?.dataFiles?.stanameCsvUrl;
    if (!csvUrl) return;
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error("CSV load failed");
        const [headerLine, ...rows] = (await response.text()).split(/\r?\n/);
        if (!headerLine || !rows.length) return;

        const headers = headerLine.split(',').map(h => h.trim());
        const chIndex = headers.indexOf('ch');
        const yearIndexes = headers.map((h, i) => /^20\d{2}$/.test(h) ? i : -1).filter(i => i !== -1);
        if (chIndex === -1 || !yearIndexes.length) return;

        const aliasMap = {};
        for (const row of rows) {
            const cols = row.split(',');
            const cnName = cols[chIndex]?.trim();
            if (!cnName) continue;
            const aliases = (aliasMap[cnName] ||= new Set());
            yearIndexes.forEach(idx => {
                const val = cols[idx]?.trim();
                if (val && val !== '\\') aliases.add(val);
            });
        }

        Object.values(processedStations).forEach(s => {
            if (aliasMap[s.cn]) s.aliases = Array.from(aliasMap[s.cn]);
        });
        console.log("成功加载车站旧名数据库。");
    } catch (e) {
        console.warn("历史站名数据加载失败:", e);
    }
}

/**
 * 绑定搜索栏输入事件与图例面板交互
 * 包含：拼音音调剥离、常用缩写标准化、模糊匹配打分与高亮列表生成
 */
function bindSearchAndLegendEvents() {
    const searchInput = document.getElementById('station-search-input');
    const searchResults = document.getElementById('search-results-list');
    const clearBtn = document.getElementById('search-clear-btn');
    const legendContent = document.getElementById('legend-content');
    if (searchInput && searchResults && clearBtn) {
        /**
         * 标准化搜索文本：统一转小写、剥离音调、替换常见英文缩写
         */
        const normalizeSearchText = (input) => {
            if (!input) return "";
            let s = input.toLowerCase();
            s = s.replace(/[ɑɑ̌ɑ̄]/g, 'a');
            s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            s = s.replace(/railway|rail/g, 'rwy');
            s = s.replace(/station/g, 'sta');
            s = s.replace(/international/g, "int'l");
            s = s.replace(/university/g, 'univ');
            s = s.replace(/technology/g, 'tech');
            return s.replace(/[\s\.\'\(\)\-]/g, '');
        };
        /**
         * 模糊搜索打分算法：完全包含得 100 分，子序列顺序包含得 50 分，否则得 0 分
         */
        const calculateScore = (search, target) => {
            if (!search || !target) return 0;
            if (target.includes(search)) return 100;
            let searchIdx = 0;
            let targetIdx = 0;
            while (searchIdx < search.length && targetIdx < target.length) {
                if (search[searchIdx] === target[targetIdx]) {
                    searchIdx++;
                }
                targetIdx++;
            }
            return searchIdx === search.length ? 50 : 0;
        };
        searchInput.oninput = (e) => {
            const rawVal = e.target.value;
            const cleanVal = normalizeSearchText(rawVal);
            searchResults.innerHTML = '';
            if (rawVal.trim().length > 0) {
                clearBtn.style.display = 'block';
                searchResults.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
                searchResults.style.display = 'none';
                return;
            }
            const matchResults = [];
            for (let sid in processedStations) {
                const s = processedStations[sid];
                let maxScore = 0;
                if (s.cn && s.cn.includes(rawVal.trim())) maxScore = 100;
                if (s.en) {
                    const stationEnClean = normalizeSearchText(s.en);
                    maxScore = Math.max(maxScore, calculateScore(cleanVal, stationEnClean));
                }
                if (maxScore < 100 && s.aliases) {
                    for (let alias of s.aliases) {
                        const aliasClean = normalizeSearchText(alias);
                        maxScore = Math.max(maxScore, calculateScore(cleanVal, aliasClean));
                        if (maxScore === 100) break;
                    }
                }
                if (maxScore > 0) {
                    matchResults.push({ station: s, score: maxScore });
                }
            }
            if (matchResults.length === 0) {
                searchResults.innerHTML = '<div style="padding:10px;color:var(--text-light);font-size:12px;text-align:center">未找到相关车站</div>';
                return;
            }
            matchResults.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.station.cn.length - b.station.cn.length;
            });
            let listHtml = '';
            matchResults.forEach(item => {
                const s = item.station;
                let svgsHtml = '';
                if (s.relatedLines) {
                    const sortedLines = [...s.relatedLines].sort((a, b) => window.getLineSortIndex(a) - window.getLineSortIndex(b));
                    sortedLines.forEach(lid => {
                        const lineInfo = linesData.find(l => l.id === lid);
                        if (lineInfo) {
                            const svgFile = lineInfo.svg || (LINE_META[lineInfo.name] && LINE_META[lineInfo.name].svg);
                            if (svgFile) {
                                const meta = getLineSvgMeta(svgFile || lineInfo.id);
                                const styleStr = meta ? `--svgclr:${meta.svgclr};--svgtext:${meta.svgtext};` : '';
                                svgsHtml += `<span class="svg-icon-placeholder search-line-icon" data-src="${getSvgPath(svgFile)}" style="${styleStr}"></span>`;
                            }
                        }
                    });
                }
                let nameHtml = s.cn;
                if (s.en) nameHtml += ` <span style="font-size:12px;color:var(--text-light);">${s.en.replace(/<br>/gi, ' ')}</span>`;
                let itemClass = 'search-item';
                if (s.type === 'no') {
                    nameHtml += ' <span style="font-size:12px;color:var(--not-open-color);">(暂未开通)</span>';
                    itemClass += ' pending';
                }
                listHtml += `
                    <div class="${itemClass}" data-sid="${s.id}">
                        ${svgsHtml}
                        <span class="search-item-text">${nameHtml}</span>
                    </div>
                `;
            });
            searchResults.innerHTML = listHtml;
            injectInlineSvgs(searchResults);
        };
        clearBtn.onclick = () => {
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchResults.style.display = 'none';
            clearBtn.style.display = 'none';
            searchInput.focus();
        };
        searchResults.onclick = (e) => {
            const item = e.target.closest('.search-item');
            if (item) {
                const sid = item.dataset.sid;
                selectStation(sid);
                if (document.body.classList.contains('legend-pinned')) {
                    searchInput.value = '';
                    searchResults.style.display = 'none';
                    clearBtn.style.display = 'none';
                } else {
                    document.getElementById('legend-overlay').style.display = 'none';
                    if (document.activeElement) document.activeElement.blur();
                }
            }
        };
    }
    if (legendContent) {
        const gridItems = legendContent.querySelectorAll('.legend-item');
        gridItems.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                try {
                    const targets = JSON.parse(item.dataset.targets);
                    clearHighlights();
                    let targetX = null;
                    let targetY = null;
                    if (targets && targets.length > 0) {
                        let foundAny = false;
                        targets.forEach((lineId, index) => {
                            const success = highlightLine(lineId);
                            if (success) foundAny = true;
                            if (index === 0) {
                                const lineData = linesData.find(l => l.id === lineId);
                                if (lineData) {
                                    let firstStationId = lineData.hasbranch ? lineData['stationIds-way1'][0] : lineData.stationIds[0];
                                    if (firstStationId) {
                                        const s = processedStations[firstStationId];
                                        if (s) {
                                            targetX = s.x;
                                            targetY = s.y;
                                        }
                                    }
                                }
                            }
                        });
                        if (targetX !== null && targetY !== null) {
                            const viewportW = mapContainer.clientWidth;
                            const viewportH = mapContainer.clientHeight;
                            currentX = (viewportW / 2) - (targetX * currentScale);
                            currentY = (viewportH / 2) - (targetY * currentScale);
                            mapContent.classList.add('animate-zoom');
                            enforceBoundaries();
                            updateMapTransform();
                            setTimeout(() => mapContent.classList.remove('animate-zoom'), 300);
                        }
                    }
                } catch (err) {
                    console.error("Legend interaction error", err);
                } finally {
                    if (!document.body.classList.contains('legend-pinned')) {
                        document.getElementById('legend-overlay').style.display = 'none';
                    }
                }
            };
        });
        const fixedHeaders = legendContent.querySelectorAll('.panel-section:not(.station-history-section) .section-header');
        fixedHeaders.forEach(header => {
            header.onclick = (e) => {
                const section = header.parentElement;
                section.classList.toggle('collapsed');
            };
        });
        const dynamicContainer = document.getElementById('sidebar-dynamic-content');
        if (dynamicContainer) {
            dynamicContainer.onclick = (e) => {
                const header = e.target.closest('.section-header');
                if (!header) return;
                const section = header.closest('.station-history-section');
                if (!section) return;
                e.stopPropagation();
                const sid = section.dataset.sid;
                if (section.classList.contains('collapsed')) {
                    if (sid) selectStation(sid);
                } else {
                    resetMapState();
                }
            };
        }
    }
}
const SEARCH_BAR_HTML = `
    <div class="search-container">
        <div class="search-input-wrapper">
            <input type="text" id="station-search-input" placeholder="请输入需要查找的站名" autocomplete="off">
            <button id="search-clear-btn" title="清空" style="display:none;">
                <cgo-icon name="close" size="16"></cgo-icon>
            </button>
        </div>
    </div>
    <div id="search-results-list"></div>
`;
function renderPinModeTree() {
    const container = document.getElementById('legend-content');
    if (!container) return;
    const panel = document.getElementById('info-panel');
    if (panel && panel.parentElement !== document.body) {
        document.body.appendChild(panel);
        panel.style.display = 'none';
    }
    const sortedLines = [...linesData].sort((a, b) => {
        return window.getLineSortIndex(a.id) - window.getLineSortIndex(b.id);
    });
    let treeInnerHtml = '<div class="pin-tree-container">';
    sortedLines.forEach(line => {
        if (line.isVirtual || line.name === '中国铁路') return;
        let stationIds = [];
        if (line.hasbranch) {
            const set = new Set([...(line['stationIds-way1'] || []), ...(line['stationIds-way2'] || [])]);
            stationIds = Array.from(set);
        } else {
            stationIds = line.stationIds || [];
        }
        if (stationIds.length === 0) return;
        let stationsHtml = '';
        stationIds.forEach(sid => {
            const s = processedStations[sid];
            if (s) {
                const pendingClass = s.type === 'no' ? 'pending' : '';
                const extraText = s.type === 'no' ? ' <span style="font-size:10px;opacity:0.7">(未开通)</span>' : '';
                stationsHtml += `
                    <div class="tree-station-item ${pendingClass}" data-sid="${sid}">
                        <div class="tree-station-dot" style="background-color:${s.type === 'no' ? 'var(--not-open-color)' : ''}"></div>
                        <span>${s.cn}${extraText}</span>
                    </div>
                `;
            }
        });
        treeInnerHtml += `
            <div class="tree-line-group" data-line-id="${line.id}">
                <div class="tree-line-header">
                    <div class="tree-line-color" style="background-color: ${line.color}"></div>
                    <span class="tree-line-name">${line.name}</span>
                    <cgo-icon name="expand-more" class="tree-arrow"></cgo-icon>
                </div>
                <div class="tree-station-list">${stationsHtml}</div>
            </div>
        `;
    });
    treeInnerHtml += '</div>';
    let finalHtml = '';
    finalHtml += createPanelSection('搜索', SEARCH_BAR_HTML, true);
    finalHtml += createPanelSection('图例', treeInnerHtml, true);
    finalHtml += '<div id="sidebar-dynamic-content"></div>';
    container.innerHTML = finalHtml;
    rebuildSidebarHistory();
    container.querySelectorAll('.tree-line-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const group = e.target.closest('.tree-line-group');
            group.classList.toggle('expanded');
            const isExpanded = group.classList.contains('expanded');
            const lineId = group.dataset.lineId;
            if (lineId) {
                clearHighlights();
                lastSelectedStationId = null;
                const infoPanel = document.getElementById('info-panel');
                if (infoPanel) infoPanel.style.display = 'none';
                const dynamicContainer = document.getElementById('sidebar-dynamic-content');
                if (dynamicContainer) {
                    const sections = dynamicContainer.querySelectorAll('.station-history-section');
                    sections.forEach(sec => sec.classList.add('collapsed'));
                }
                if (isExpanded) {
                    if (highlightLine(lineId)) {
                        const lineData = linesData.find(l => l.id === lineId);
                        if (lineData) {
                            let firstStationId = lineData.hasbranch ? lineData['stationIds-way1'][0] : lineData.stationIds[0];
                            if (firstStationId && processedStations[firstStationId]) {
                                const s = processedStations[firstStationId];
                                currentX = (mapContainer.clientWidth / 2) - (s.x * currentScale);
                                currentY = (mapContainer.clientHeight / 2) - (s.y * currentScale);
                                mapContent.classList.add('animate-zoom');
                                enforceBoundaries();
                                updateMapTransform();
                                setTimeout(() => mapContent.classList.remove('animate-zoom'), 300);
                            }
                        }
                    }
                }
            }
        });
    });
    container.querySelectorAll('.tree-station-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const sid = item.dataset.sid;
            if (sid) {
                container.querySelectorAll('.tree-station-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                selectStation(sid);
            }
        });
    });
    if (typeof bindSearchAndLegendEvents === 'function') {
        bindSearchAndLegendEvents();
    }
}
function renderDefaultLegend() {
    const container = document.getElementById('legend-content');
    const activeLegendConfig = (typeof window !== 'undefined' && window.LEGEND_CONFIG)
        || (typeof LEGEND_CONFIG !== 'undefined' ? LEGEND_CONFIG : null)
        || (typeof window !== 'undefined' && window.LEGEND_SECTIONS)
        || (typeof LEGEND_SECTIONS !== 'undefined' ? LEGEND_SECTIONS : null)
        || (getActiveCity().LEGEND_CONFIG)
        || [];
    if (!container || !Array.isArray(activeLegendConfig) || activeLegendConfig.length === 0) return;
    const panel = document.getElementById('info-panel');
    if (panel && panel.parentElement !== document.body) {
        document.body.appendChild(panel);
        panel.style.display = 'none';
    }
    let legendInnerHtml = '';
    activeLegendConfig.forEach(section => {
        if (section.type === 'title') {
            const titleCn = section.title || section.name || '';
            const titleEn = section.subtitle || '';
            const mt = section.marginTop ? `margin-top:${section.marginTop}px;` : '';
            legendInnerHtml += `
                <div class="legend-section-title" style="${mt}">
                    <div class="legend-section-heading">
                        <span class="legend-section-title-cn">${titleCn}</span>
                        ${titleEn ? `<span class="legend-section-title-en">${titleEn}</span>` : ''}
                    </div>
                    ${section.desc ? `<div class="legend-section-desc">${section.desc}</div>` : ''}
                </div>
            `;
            if (section.items && Array.isArray(section.items)) {
                legendInnerHtml += `<div class="legend-tree-content">`;
                section.items.forEach(item => {
                    const colorStyle = item.color ? `background-color:${item.color};` : '';
                    legendInnerHtml += `
                    <div class="legend-tree-item">
                        ${item.color ? `<span class="legend-color-block" style="${colorStyle}"></span>` : ''}
                        <span class="legend-tree-text">${item.text || item.name || ''}</span>
                    </div>`;
                });
                legendInnerHtml += `</div>`;
            }
        } else if (section.type === 'grid') {
            const cols = section.cols || 2;
            const gridStyle = `grid-template-columns: repeat(${cols}, minmax(0, 1fr));`;
            legendInnerHtml += `<div class="legend-grid" style="${gridStyle}">`;
            section.items.forEach(item => {
                const targets = item.targets || [];
                const targetStr = JSON.stringify(targets).replace(/"/g, '&quot;');
                
                let colors = [];
                let names = [];
                targets.forEach(lineId => {
                    const lineInfo = (typeof linesData !== 'undefined' && Array.isArray(linesData)) ? linesData.find(l => l.id === lineId) : null;
                    if (lineInfo) {
                        const clr = lineInfo.color || (typeof LINE_META !== 'undefined' && LINE_META[lineInfo.name] && LINE_META[lineInfo.name].color) || '#0c598b';
                        if (!colors.includes(clr)) colors.push(clr);
                        names.push(lineInfo.name);
                    }
                });
                
                let colorBlocksHtml = '';
                if (colors.length > 0) {
                    colorBlocksHtml = `<div class="legend-color-blocks">${colors.map(c => `<span class="legend-color-block" style="background-color:${c};"></span>`).join('')}</div>`;
                } else if (item.color) {
                    colorBlocksHtml = `<div class="legend-color-blocks"><span class="legend-color-block" style="background-color:${item.color};"></span></div>`;
                }
                
                const displayName = item.name || names.join(' / ') || (targets[0] || '');
                
                legendInnerHtml += `
                    <div class="legend-item" data-targets="${targetStr}">
                        ${colorBlocksHtml}
                        <span class="legend-item-name">${displayName}</span>
                    </div>
                `;
            });
            legendInnerHtml += `</div>`;
        }
    });
    let finalHtml = '';
    finalHtml += createPanelSection('搜索', SEARCH_BAR_HTML, true);
    finalHtml += createPanelSection('图例', legendInnerHtml, true);
    finalHtml += '<div id="sidebar-dynamic-content"></div>';
    container.innerHTML = finalHtml;
    injectInlineSvgs(container);
    bindSearchAndLegendEvents();
}
function createPanelSection(title, content, isExpanded = true) {
    const idStr = title === '搜索' ? 'id="section-search"' : '';
    const sectionId = (title === '图例' || title === '线路') ? 'id="section-legend-tree"' : '';
    const collapsedClass = isExpanded ? '' : 'collapsed';
    return `
        <div class="panel-section ${collapsedClass}" ${idStr} ${sectionId}>
            <div class="section-header">
                <span>${title}</span>
                <cgo-icon name="expand-more" class="section-arrow"></cgo-icon>
            </div>
            <div class="section-body">
                ${content}
            </div>
        </div>
    `;
}
/**
 * 渲染图例面板 (根据是否固定侧边栏自动选择平铺或树状树状结构)
 */
function renderLegend() {
    const isPinned = document.body.classList.contains('legend-pinned');
    const isDesktop = window.innerWidth > 640;
    if (isPinned && isDesktop) {
        renderPinModeTree();
    } else {
        renderDefaultLegend();
    }
}

/**
 * 数据预处理与拓扑构建 (Data Processing & Station Topology)
 * 作用：
 * 1. 拷贝原始车站坐标字典；
 * 2. 遍历各线路，为车站统计经停该站的所有线路 ID (`relatedLines`) 与标志色 (`lineColors`)；
 * 3. 统计各站在线路中的站序编码 (`codes`, 如 "1号线#5")。
 */
function processData() {
    if (typeof stationsData === 'undefined' || typeof linesData === 'undefined') {
        alert("数据加载失败");
        return;
    }
    for (let key in stationsData) {
        processedStations[key] = {
            ...stationsData[key],
            id: key, codes: [], lineColors: [], relatedLines: []
        };
    }
    linesData.forEach(line => {
        let allStationIds = [];
        if (line.hasbranch) {
            const set = new Set([...line['stationIds-way1'], ...line['stationIds-way2']]);
            allStationIds = Array.from(set);
        } else {
            allStationIds = line.stationIds || [];
        }
        allStationIds.forEach((sid, index) => {
            if (processedStations[sid]) {
                const s = processedStations[sid];
                s.codes.push(`${line.name}#${index + 1}`);
                if (line.isPointOnly) {
                    s.lineColors.push(line.color);
                } else {
                    s.lineColors.unshift(line.color);
                }
                if (!s.relatedLines.includes(line.id)) {
                    s.relatedLines.push(line.id);
                }
            }
        });
    });
}

/**
 * 矢量线路绘制引擎 (SVG Lines Renderer)
 * 作用：
 * 1. 遍历 linesData 中的折线点阵 points；
 * 2. 调用 generateRoundedPath 自动倒角生成双层平滑矢量路径（外描边防粘连 + 内主色实线）；
 * 3. 如配置 overlayStyle 则叠加虚线纹理（常用于国铁/市郊铁路）；
 * 4. 生成不可见的宽描边交互路径 (`pathInteraction`)，提供高灵敏度的鼠标悬停徽标气泡与点击反馈。
 */
function renderLines() {
    const isMouseDevice = () => window.matchMedia('(hover: hover)').matches;
    linesData.forEach(line => {
        if (line.isPointOnly) return;
        const isStrict = line.useStrictRounding || false;
        const visualGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        visualGroup.setAttribute("class", "line-visual-group");
        visualGroup.setAttribute("data-visual-id", line.id);
        const drawSegment = (points, segmentClass) => {
            if (!points || points.length < 2) return;
            const d = generateRoundedPath(points, isStrict);
            // 外描边底色（隔离不同相交线路，增强立体可读性）
            const pathOuter = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathOuter.setAttribute("d", d);
            pathOuter.setAttribute("class", `line-visual-outer ${segmentClass}`);
            pathOuter.setAttribute("stroke", "var(--map-bg)");
            pathOuter.setAttribute("stroke-width", "7");
            // 内描边（线路实体主题色）
            const pathInner = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathInner.setAttribute("d", d);
            pathInner.setAttribute("class", `line-visual-inner ${segmentClass}`);
            pathInner.setAttribute("stroke", line.color);
            pathInner.setAttribute("stroke-width", "5.4");
            visualGroup.appendChild(pathOuter);
            visualGroup.appendChild(pathInner);
            // 叠加虚线/市郊纹理
            if (line.overlayStyle) {
                const pathOverlay = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathOverlay.setAttribute("d", d);
                pathOverlay.setAttribute("class", `line-visual-overlay ${segmentClass}`);
                pathOverlay.setAttribute("stroke", line.overlayStyle.color);
                pathOverlay.setAttribute("stroke-width", line.overlayStyle.width);
                pathOverlay.setAttribute("stroke-opacity", line.overlayStyle.opacity);
                pathOverlay.setAttribute("stroke-dasharray", line.overlayStyle.dashArray);
                pathOverlay.setAttribute("fill", "none");
                pathOverlay.setAttribute("stroke-linecap", "butt");
                visualGroup.appendChild(pathOverlay);
            }
            // 交互判定层 (透明加宽热区)
            const pathInteraction = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathInteraction.setAttribute("d", d);
            pathInteraction.setAttribute("class", "line-interaction");
            pathInteraction.setAttribute("data-line-id", line.id);
            pathInteraction.setAttribute("stroke", "transparent");
            pathInteraction.setAttribute("stroke-width", "15");
            pathInteraction.setAttribute("fill", "none");
            pathInteraction.style.cursor = "pointer";
            pathInteraction.addEventListener('mouseenter', (e) => {
                if (isMapDragging || e.buttons === 1) return;
                handleTooltipShow(line.name);
                updateTooltipPos(e.clientX, e.clientY);
            });
            pathInteraction.addEventListener('mousemove', (e) => {
                if (isMapDragging || e.buttons === 1) return;
                updateTooltipPos(e.clientX, e.clientY);
            });
            pathInteraction.addEventListener('mouseleave', () => {
                if (isMouseDevice()) {
                    hideLineTooltipNow();
                } else {
                    if (!tooltipTimer) {
                        hideLineTooltipNow();
                    }
                }
            });
            pathInteraction.addEventListener('click', (e) => {
                if (isMapDragging) return;
                if (isMouseDevice()) return;
                e.stopPropagation();
                handleTooltipShow(line.name);
                updateTooltipPos(e.clientX, e.clientY);
                if (tooltipTimer) clearTimeout(tooltipTimer);
                tooltipTimer = setTimeout(() => {
                    hideLineTooltipNow();
                }, 3000);
            });
            visualGroup.appendChild(pathInteraction);
        };
        if (line.hasbranch) {
            drawSegment(line['pathPoints-main'], 'seg-main');
            drawSegment(line['pathPoints-branch1'], 'seg-way1');
            drawSegment(line['pathPoints-branch2'], 'seg-way2');
        } else {
            let points = line.pathPoints;
            if (!points || points.length === 0) {
                points = line.stationIds.map(sid => {
                    const s = processedStations[sid];
                    return s ? { x: s.x, y: s.y } : null;
                }).filter(p => p !== null);
            }
            drawSegment(points, 'seg-main');
        }
        svgLayer.appendChild(visualGroup);
    });
}

/**
 * 绘制在建/规划未开通线路的平滑虚线走向
 */
function renderNotOpenLines() {
    const layer = document.getElementById('not-open-layer');
    if (!layer || typeof NOT_OPEN_LINES === 'undefined') return;
    NOT_OPEN_LINES.forEach(item => {
        const d = generateRoundedPath(item.points, 0.99);
        if (d) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            const style = item.style || {};
            const color = style.color || "var(--map-bg)";
            const width = style.width || "3.4";
            const opacity = style.opacity !== undefined ? style.opacity : 1;
            const dashArray = style.dashArray || "none";
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", width);
            path.setAttribute("stroke-opacity", opacity);
            if (dashArray !== "none") {
                path.setAttribute("stroke-dasharray", dashArray);
            }
            path.setAttribute("fill", "none");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");
            layer.appendChild(path);
        }
    });
}

/**
 * 绘制虚拟换乘与出站连通虚线连接器
 */
function renderVirtualConnectors() {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "virtual-connectors");
    if (typeof VIRTUAL_CONNECT_LINES !== 'undefined') {
        VIRTUAL_CONNECT_LINES.forEach(conn => {
            const pathD = getConnectorPath(conn);
            if (pathD) {
                group.appendChild(createSvgPath(pathD, "var(--map-bg)", "3.25"));
                group.appendChild(createSvgPath(pathD, "#78848b", "2.25"));
                group.appendChild(createSvgPath(pathD, "var(--map-bg)", "0.85"));
            }
        });
    }
    if (typeof VIRTUAL_FREE_CONNECT_LINES !== 'undefined') {
        VIRTUAL_FREE_CONNECT_LINES.forEach(conn => {
            const pathD = getConnectorPath(conn);
            if (pathD) {
                group.appendChild(createSvgPath(pathD, "var(--map-bg)", "2.75"));
                group.appendChild(createSvgPath(pathD, "#78848b", "1.5"));
            }
        });
    }
    svgLayer.appendChild(group);
}

/**
 * 渲染全图车站节点图标与中英文双语站名文本
 * 包含：精准锚点偏移算法 (8 方向对齐)、字体 X 轴微调拉伸 (textScale)
 */
function renderStations() {
    const getDomId = (type, id) => `${type}_${id}`;
    for (let id in processedStations) {
        const s = processedStations[id];
        const stationDiv = document.createElement('div');
        stationDiv.className = `station ${s.type}`;
        stationDiv.id = getDomId('node', id);
        stationDiv.style.left = s.x + 'px';
        stationDiv.style.top = s.y + 'px';
        stationDiv.dataset.sid = id;
        if (s.type === 'dot' || s.type === 'tsfo') {
            const stationColor = s.lineColors.length > 0 ? s.lineColors[0] : 'var(--station-stroke)';
            stationDiv.innerHTML = SVGTemplates.dot.replace('{{COLOR}}', stationColor);
        } else if (SVGTemplates[s.type]) {
            stationDiv.innerHTML = SVGTemplates[s.type];
        } else {
            const stationColor = s.lineColors.length > 0 ? s.lineColors[0] : 'var(--station-stroke)';
            stationDiv.innerHTML = SVGTemplates.dot.replace('{{COLOR}}', stationColor);
        }
        stationsLayer.appendChild(stationDiv);
        if (s.hideLabel === true) continue;
        const labelDiv = document.createElement('div');
        labelDiv.className = `label-group type-${s.type}`;
        labelDiv.id = getDomId('label', id);
        labelDiv.dataset.sid = id;
        const distV = 5.2, distH = 6, distD = 6;
        let left = s.x, top = s.y, transform = "", textAlign = "center", transformOriginX = "50%";
        switch (s.align) {
            case 'top': top -= distV; transform = "translate(-50%, -100%)"; break;
            case 'bottom': top += distV; transform = "translate(-50%, 0)"; break;
            case 'left': left -= distH; transform = "translate(-100%, -50%)"; textAlign = "right"; transformOriginX = "100%"; break;
            case 'right': left += distH; transform = "translate(0, -50%)"; textAlign = "left"; transformOriginX = "0%"; break;
            case 'top-left': left -= distD; top -= distD; transform = "translate(-100%, -100%)"; textAlign = "right"; transformOriginX = "100%"; break;
            case 'top-right': left += distD; top -= distD; transform = "translate(0, -100%)"; textAlign = "left"; transformOriginX = "0%"; break;
            case 'bottom-left': left -= distD; top += distD; transform = "translate(-100%, 0)"; textAlign = "right"; transformOriginX = "100%"; break;
            case 'bottom-right': left += distD; top += distD; transform = "translate(0, 0)"; textAlign = "left"; transformOriginX = "0%"; break;
            default: top += distV; transform = "translate(-50%, 0)";
        }
        if (s.offset) {
            if (s.offset.x) left += s.offset.x;
            if (s.offset.y) top += s.offset.y;
        }
        labelDiv.style.left = left + 'px';
        labelDiv.style.top = top + 'px';
        labelDiv.style.transform = transform;
        labelDiv.style.textAlign = textAlign;
        let scaleCn = s.textScale?.cn || 1;
        let scaleEn = s.textScale?.en || 1;
        labelDiv.innerHTML = `
            <span class="stacn" style="transform:scaleX(${scaleCn});transform-origin:${transformOriginX} center;">${s.cn}</span>
            <span class="staen" style="transform:scaleX(${scaleEn});transform-origin:${transformOriginX} center;">${s.en}</span>
        `;
        labelsLayer.appendChild(labelDiv);
    }
}

/**
 * 渲染地图背景装饰物 (指南针、城门、文化图腾)
 */
function renderScatteredObjects() {
    const layer = document.getElementById('scattered-layer');
    if (!layer || typeof SCATTERED_DATA === 'undefined') return;
    SCATTERED_DATA.forEach(item => {
        const div = document.createElement('div');
        div.className = 'scattered-item';
        div.style.left = item.x + 'px';
        div.style.top = item.y + 'px';
        div.style.zIndex = item.zIndex || 5;
        if (item.width) div.style.width = item.width + 'px';
        else div.style.width = 'auto';
        if (item.height) div.style.height = item.height + 'px';
        else div.style.height = 'auto';
        if (item.opacity !== undefined) div.style.opacity = item.opacity;
        if (item.rotation) {
            div.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
        }
        if (item.file) {
            const img = document.createElement('img');
            img.src = getSvgPath(item.file);
            img.style.cssText = "width:100%; height:100%; display:block;";
            img.draggable = false;
            div.appendChild(img);
        }
        layer.appendChild(div);
    });
}

/**
 * 选中指定车站 (Select & Fly-to Station)
 * 作用：
 * 1. 在视口中高亮选中车站圆点；
 * 2. 计算视口目标位置并平滑过渡飞跃居中；
 * 3. 展开或呼出车站详情面板 / 卡片；
 * 4. 自动高亮经停该站的所有线路。
 * @param {string} sid - 车站 ID
 * @param {number} [pageX] - 触发坐标 X
 * @param {number} [pageY] - 触发坐标 Y
 * @param {number} [initialTabIndex=0] - 默认激活的线路选项卡索引
 */
function selectStation(sid, pageX, pageY, initialTabIndex = 0) {
    hideLineTooltipNow();
    const s = processedStations[sid];
    if (!s) return;
    lastSelectedStationId = sid;
    clearHighlights();
    const activate = (targetSid) => {
        const targetS = processedStations[targetSid];
        if (!targetS) return;
        const nodeEl = document.getElementById(`node_${targetSid}`);
        if (nodeEl) nodeEl.classList.add('active');
        const labelEl = document.getElementById(`label_${targetSid}`);
        if (labelEl) labelEl.classList.add('active');
        if (targetS.relatedLines) targetS.relatedLines.forEach(lineId => highlightLine(lineId, sid));
    };
    activate(sid);
    if (typeof VIRTUAL_TRANSFER_MAP !== 'undefined' && VIRTUAL_TRANSFER_MAP[sid]) {
        VIRTUAL_TRANSFER_MAP[sid].forEach(partnerSid => activate(partnerSid));
    }
    if (typeof VIRTUAL_FREE_TRANSFER_MAP !== 'undefined' && VIRTUAL_FREE_TRANSFER_MAP[sid]) {
        VIRTUAL_FREE_TRANSFER_MAP[sid].forEach(partnerSid => activate(partnerSid));
    }
    renderUserModePanel(s, initialTabIndex);
    const isPinned = document.body.classList.contains('legend-pinned');
    const panel = document.getElementById('info-panel');
    const dynamicContainer = document.getElementById('sidebar-dynamic-content');
    const viewportW = mapContainer.clientWidth;
    const viewportH = mapContainer.clientHeight;
    if (window.innerWidth > 640 && isPinned && dynamicContainer) {
        document.body.classList.remove('pinned-hidden');
        const overlay = document.getElementById('legend-overlay');
        if (overlay) overlay.style.display = 'block';
        dockStationPanel(s);
        panel.style.display = 'block';
        panel.style.opacity = '1';
        mapContent.classList.add('animate-zoom');
        currentX = (viewportW / 2) - (s.x * currentScale);
        currentY = (viewportH / 2) - (s.y * currentScale);
        enforceBoundaries();
        updateMapTransform();
    } else {
        if (dynamicContainer) {
            dockStationPanel(s);
        }
        if (panel.parentElement !== document.body) {
            document.body.appendChild(panel);
        }
        const isMobile = window.innerWidth <= 640;
        if (isMobile) {
            mapContent.classList.add('animate-zoom');
            document.body.classList.add('mobile-split-active');
            infoPanel.style.display = 'flex';
            currentScale = 1.4;
            const targetVisualX = viewportW / 2;
            const targetVisualY = viewportH * 0.2;
            currentX = targetVisualX - (s.x * currentScale);
            currentY = targetVisualY - (s.y * currentScale);
        } else {
            document.body.classList.remove('mobile-split-active');
            if (pageX === undefined || pageY === undefined) {
                mapContent.classList.add('animate-zoom');
                currentX = (viewportW / 2) - (s.x * currentScale);
                currentY = (viewportH / 2) - (s.y * currentScale);
                showPanelAt(viewportW / 2 - 160, viewportH / 2 - 100);
            } else {
                showPanelAt(pageX, pageY);
            }
        }
        const zoomVal = document.getElementById('zoom-val');
        const mzSlider = document.getElementById('mz-slider');
        if (mzSlider) mzSlider.value = currentScale;
        if (zoomVal) zoomVal.innerText = Math.round(currentScale * 100) + '%';
        enforceBoundaries();
        updateMapTransform();
    }
}
function bindEvents() {
    initLegendPin();
    const menuBtn = document.getElementById('mz-menu');
    const legendOverlay = document.getElementById('legend-overlay');
    const legendModal = document.querySelector('.legend-modal');
    const legendClose = document.querySelector('.legend-close-btn');
    if (menuBtn && legendOverlay && legendModal) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideLineTooltipNow();
            const isPinned = document.body.classList.contains('legend-pinned');
            const isHidden = document.body.classList.contains('pinned-hidden');
            if (isPinned) {
                document.body.classList.remove('pinned-hidden');
                const dynamicContainer = document.getElementById('sidebar-dynamic-content');
                if (dynamicContainer) {
                    const historySections = dynamicContainer.querySelectorAll('.station-history-section');
                    historySections.forEach(sec => sec.classList.add('collapsed'));
                }
                const fixedSections = document.querySelectorAll('.panel-section:not(.station-history-section)');
                fixedSections.forEach(sec => sec.classList.remove('collapsed'));
                if (typeof enforceBoundaries === 'function') setTimeout(enforceBoundaries, 300);
                if (isHidden) {
                    legendOverlay.style.display = 'block';
                    return;
                }
            }
            legendOverlay.style.display = 'block';
            if (isPinned && window.innerWidth > 640) {
            } else {
                document.body.classList.remove('legend-pinned');
                const rect = menuBtn.getBoundingClientRect();
                const availableHeight = window.innerHeight - rect.top - 30;
                let topPos = rect.top;
                if (availableHeight < 280) {
                    topPos = Math.max(10, window.innerHeight - 520);
                }
                legendModal.style.top = topPos + 'px';
                legendModal.style.left = rect.left + 'px';
            }
            const searchInput = document.getElementById('station-search-input');
            if (searchInput) setTimeout(() => searchInput.focus(), 100);
        });
    }
    const closeLegend = () => {
        resetMapState();
        if (document.body.classList.contains('legend-pinned')) {
            document.body.classList.add('pinned-hidden');
        } else {
            if (legendOverlay) legendOverlay.style.display = 'none';
            document.body.classList.remove('legend-pinned');
            document.body.classList.remove('pinned-hidden');
        }
        if (typeof enforceBoundaries === 'function') setTimeout(enforceBoundaries, 300);
    };
    if (legendClose) legendClose.addEventListener('click', (e) => { e.stopPropagation(); closeLegend(); });
    if (legendOverlay) legendOverlay.addEventListener('click', (e) => { if (e.target === legendOverlay) closeLegend(); });
    if (document.getElementById('station-search-input')) {
        bindSearchAndLegendEvents();
    }

    const zoomVal = document.getElementById('zoom-val');
    const mzSlider = document.getElementById('mz-slider');
    const btnIn = document.getElementById('mz-in');
    const btnOut = document.getElementById('mz-out');
    const updateZoom = (val) => {
        hideLineTooltipNow();
        let newScale = parseFloat(val);
        if (newScale < 0.5) newScale = 0.5;
        if (newScale > 3.0) newScale = 3.0;
        mapContent.classList.add('animate-zoom');
        const containerW = mapContainer.clientWidth;
        const containerH = mapContainer.clientHeight;
        const oldOffsetX = (containerW / 2) - currentX;
        const oldOffsetY = (containerH / 2) - currentY;
        const scaleRatio = newScale / currentScale;
        currentX = (containerW / 2) - (oldOffsetX * scaleRatio);
        currentY = (containerH / 2) - (oldOffsetY * scaleRatio);
        currentScale = newScale;
        enforceBoundaries();
        if (mzSlider) mzSlider.value = newScale;
        if (zoomVal) zoomVal.innerText = Math.round(newScale * 100) + '%';
        updateMapTransform();
    };
    if (mzSlider) mzSlider.addEventListener('input', (e) => updateZoom(e.target.value));
    if (btnIn) btnIn.addEventListener('click', () => updateZoom(currentScale + 0.1));
    if (btnOut) btnOut.addEventListener('click', () => updateZoom(currentScale - 0.1));
    const stationClickHandler = (e) => {
        const nodeTarget = e.target.closest('.station');
        const labelTarget = e.target.closest('.label-group');
        const target = nodeTarget || labelTarget;
        if (!target) return;
        e.stopPropagation();
        const clickedSid = target.dataset.sid;
        if (nodeTarget) {
            const oldSelector = document.getElementById('station-selector');
            if (oldSelector) oldSelector.remove();
            selectStation(clickedSid, e.pageX, e.pageY);
            return;
        }
        if (labelTarget) {
            const currentStation = processedStations[clickedSid];
            if (!currentStation) return;
            const name = currentStation.cn;
            let candidates = [];
            for (let sid in processedStations) {
                const s = processedStations[sid];
                if (s.cn === name) {
                    candidates.push(s);
                }
            }
            const activeCandidates = candidates.filter(s => s.type !== 'no');
            if (activeCandidates.length === 0) {
                selectStation(clickedSid, e.pageX, e.pageY);
            }
            else if (activeCandidates.length === 1) {
                selectStation(activeCandidates[0].id, e.pageX, e.pageY);
            }
            else {
                const oldSelector = document.getElementById('station-selector');
                if (oldSelector) oldSelector.remove();
                showStationSelector(labelTarget, activeCandidates);
            }
        }
    };
    stationsLayer.addEventListener('click', stationClickHandler);
    labelsLayer.addEventListener('click', stationClickHandler);
    mapContainer.addEventListener('click', (e) => {
        if (isMapDragging) { isMapDragging = false; return; }
        resetMapState();
    });
    const stopPropagation = (e) => { e.stopPropagation(); };
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
        infoPanel.addEventListener('touchstart', stopPropagation, { passive: true });
        infoPanel.addEventListener('touchmove', stopPropagation, { passive: true });
        infoPanel.addEventListener('touchend', stopPropagation, { passive: true });
        infoPanel.addEventListener('wheel', stopPropagation, { passive: true });
    }
    const legendModalEl = document.querySelector('.legend-modal');
    if (legendModalEl) {
        legendModalEl.addEventListener('touchstart', stopPropagation, { passive: true });
        legendModalEl.addEventListener('touchmove', stopPropagation, { passive: true });
        legendModalEl.addEventListener('touchend', stopPropagation, { passive: true });
        legendModalEl.addEventListener('wheel', stopPropagation, { passive: true });
    }
}
function initLegendPin() {
    const pinBtn = document.getElementById('legend-pin-btn');
    const overlay = document.getElementById('legend-overlay');
    if (!pinBtn || !overlay) return;

    // Attach listener unconditionally so it works after resize
    pinBtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 640) return;
        e.stopPropagation();
        const currentState = localStorage.getItem('nal_legend_pinned') === 'true';
        const isPinned = !currentState;
        localStorage.setItem('nal_legend_pinned', isPinned);
        updateBtnUI(isPinned);
        if (isPinned) {
            document.body.classList.add('legend-pinned');
            document.body.classList.remove('pinned-hidden');
            if (overlay) overlay.style.display = 'block';
            renderLegend();
            const container = document.getElementById('legend-content');
            if (container && !document.getElementById('sidebar-dynamic-content')) {
                const dynamicDiv = document.createElement('div');
                dynamicDiv.id = 'sidebar-dynamic-content';
                container.appendChild(dynamicDiv);
            }
            if (typeof lastSelectedStationId !== 'undefined' && lastSelectedStationId && processedStations[lastSelectedStationId]) {
                dockStationPanel(processedStations[lastSelectedStationId]);
            } else {
                const fixedSections = document.querySelectorAll('.panel-section:not(.station-history-section)');
                fixedSections.forEach(sec => sec.classList.remove('collapsed'));
                const infoPanel = document.getElementById('info-panel');
                if (infoPanel && infoPanel.parentElement === document.body) {
                    infoPanel.style.display = 'none';
                }
            }
        } else {
            document.body.classList.remove('legend-pinned');
            document.body.classList.remove('pinned-hidden');
            if (overlay) overlay.style.display = 'none';
            let activeStation = null;
            if (typeof lastSelectedStationId !== 'undefined' && lastSelectedStationId && processedStations[lastSelectedStationId]) {
                activeStation = processedStations[lastSelectedStationId];
            }
            renderLegend();
            if (typeof undockStationPanel === 'function') {
                undockStationPanel(activeStation);
            }
            const dynamicContainer = document.getElementById('sidebar-dynamic-content');
            if (dynamicContainer) {
                dynamicContainer.innerHTML = '';
            }
            if (!activeStation) {
                clearHighlights();
            }
            if (typeof enforceBoundaries === 'function') enforceBoundaries();
            setTimeout(() => {
                if (typeof updateMapTransform === 'function') updateMapTransform();
            }, 300);
        }
    });

    const updateBtnUI = (pinned) => {
        if (pinned) {
            pinBtn.classList.add('active');
            pinBtn.innerHTML = `<cgo-icon name="unpin-angle" size="18"></cgo-icon>`;
            pinBtn.title = "取消固定";
        } else {
            pinBtn.classList.remove('active');
            pinBtn.innerHTML = `<cgo-icon name="pin-angle" size="18"></cgo-icon>`;
            pinBtn.title = "固定面板";
        }
    };

    // Initial state setup
    if (window.innerWidth <= 640) {
        document.body.classList.remove('legend-pinned');
        document.body.classList.remove('pinned-hidden');
        pinBtn.style.display = 'none';
        updateBtnUI(localStorage.getItem('nal_legend_pinned') === 'true');
        return;
    }

    const startPinned = localStorage.getItem('nal_legend_pinned') === 'true';
    updateBtnUI(startPinned);
    if (startPinned) {
        document.body.classList.add('legend-pinned');
        // Removed automatic pinned-hidden to reduce confusion
        document.body.classList.remove('pinned-hidden');
        if (overlay) overlay.style.display = 'block';
        renderLegend();
    } else {
        document.body.classList.remove('legend-pinned');
        document.body.classList.remove('pinned-hidden');
        if (overlay) overlay.style.display = 'none';
        renderLegend();
    }
}
/**
 * 地图初始居中 (根据城市配置 center 与默认缩放等级重置视口中心)
 */
function centerMap() {
    const city = getActiveCity();
    const containerW = mapContainer.clientWidth;
    const containerH = mapContainer.clientHeight;
    const targetX = city.center ? city.center.x : 900;
    const targetY = city.center ? city.center.y : 640;
    currentX = (containerW / 2) - (targetX * currentScale);
    currentY = (containerH / 2) - (targetY * currentScale);
    updateMapTransform();
}

/**
 * 应用 CSS Transform 将平移和缩放属性同步到 mapContent DOM
 */
function localUpdateMapTransform() {
    mapContent.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
}

/**
 * 地图边界限制算法 (防止用户将地图完全拖出可视视口外)
 */
function localEnforceBoundaries() {
    const city = getActiveCity();
    const containerW = mapContainer.clientWidth;
    const containerH = mapContainer.clientHeight;
    const defaultW = city.mapSize ? city.mapSize.width : 1850;
    const defaultH = city.mapSize ? city.mapSize.height : 1300;
    const mapW = defaultW * currentScale;
    const mapH = defaultH * currentScale;

    // 移动端分屏模式下底栏高度偏移补偿 (60% 高度抽屉)
    const isSplitMode = document.body.classList.contains('mobile-split-active');
    const bottomOffset = isSplitMode ? containerH * 0.62 : 0;

    if (mapW >= containerW) {
        if (currentX > 0) currentX = 0;
        if (currentX < containerW - mapW) currentX = containerW - mapW;
    } else {
        currentX = (containerW - mapW) / 2;
    }
    if (mapH >= containerH) {
        if (currentY > 0) currentY = 0;
        const minY = containerH - mapH - bottomOffset;
        if (currentY < minY) currentY = minY;
    } else {
        if (isSplitMode) {
            currentY = (containerH * 0.4 - mapH) / 2;
        } else {
            currentY = (containerH - mapH) / 2;
        }
    }
}

function updateMapTransform() {
    localUpdateMapTransform();
}

function enforceBoundaries() {
    if (window.enforceBoundaries && window.enforceBoundaries !== enforceBoundaries) {
        window.enforceBoundaries();
    } else {
        localEnforceBoundaries();
    }
}

/**
 * 在指定屏幕坐标处悬浮弹出车站详情卡片
 */
function showPanelAt(pageX, pageY) {
    infoPanel.style.opacity = '0';
    infoPanel.style.display = 'flex';
    infoPanel.classList.remove('docked'); // 移除 docked 样式，确保是悬浮卡片
    // 重置可能被 docked 强制覆盖的样式
    infoPanel.style.position = 'fixed';
    infoPanel.style.width = '360px';
    infoPanel.style.height = '';
    infoPanel.style.maxHeight = '80vh';
    infoPanel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    infoPanel.style.borderRadius = '8px';
    const pW = infoPanel.offsetWidth;
    const pH = infoPanel.offsetHeight;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;
    let left = pageX + 15;
    let top = pageY + 15;
    if (left + pW > viewportW + scrollX) left = pageX - pW - 15;
    if (left < scrollX) left = scrollX + 10;
    if (top + pH > viewportH + scrollY) top = pageY - pH - 15;
    if (top < scrollY) top = scrollY + 10;
    infoPanel.style.left = left + 'px';
    infoPanel.style.top = top + 'px';
    infoPanel.style.opacity = '1';
}

/**
 * 高亮指定线路及其关联同组线路 (Line Highlighting)
 * 作用：克隆线路矢量至 highlight-layer 图层并使其他线路淡化；处理 Y 型支线分支淡化。
 * @param {string} lineId - 线路 ID
 * @param {string} [currentStationId=null] - 当前选中车站 ID
 * @param {boolean} [fromSync=false] - 是否由同组联动发起
 */
function highlightLine(lineId, currentStationId = null, fromSync = false) {
    const el = document.querySelector(`.line-visual-group[data-visual-id="${lineId}"]`);
    if (el) {
        el.classList.add('active');
        const lineData = linesData.find(l => l.id === lineId);
        if (lineData && lineData.hasbranch && currentStationId) {
            const inWay1 = lineData['stationIds-way1'].includes(currentStationId);
            const inWay2 = lineData['stationIds-way2'].includes(currentStationId);
            const segWay1 = el.querySelectorAll('.seg-way1');
            const segWay2 = el.querySelectorAll('.seg-way2');
            segWay1.forEach(p => p.style.opacity = '1');
            segWay2.forEach(p => p.style.opacity = '1');
            if (inWay1 && !inWay2) {
                segWay2.forEach(p => p.style.opacity = '0.1');
            } else if (!inWay1 && inWay2) {
                segWay1.forEach(p => p.style.opacity = '0.1');
            }
        }
        const highlightLayer = document.getElementById('highlight-layer');
        if (highlightLayer) {
            if (!highlightLayer.querySelector(`[data-visual-id="${lineId}"]`)) {
                const clone = el.cloneNode(true);
                const interactPath = clone.querySelector('.line-interaction');
                if (interactPath) interactPath.remove();
                highlightLayer.appendChild(clone);
            }
        }
        if (!fromSync) {
            const group = LINE_SYNC_GROUPS.find(g => g.includes(lineId));
            if (group) {
                group.forEach(partnerId => {
                    if (partnerId !== lineId) {
                        highlightLine(partnerId, currentStationId, true);
                    }
                });
            }
        }
        return true;
    } else {
        if (!fromSync) {
            console.warn(`未找到线路 ID: ${lineId}`);
        }
        return false;
    }
}

/**
 * 清除全图所有激活高亮状态
 */
function clearHighlights() {
    document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    const highlightLayer = document.getElementById('highlight-layer');
    if (highlightLayer) {
        highlightLayer.innerHTML = '';
    }
    const segments = document.querySelectorAll('.line-visual-inner, .line-visual-outer, .line-visual-overlay');
    segments.forEach(el => {
        el.style.opacity = '';
    });
}

/**
 * 组装虚拟换乘/出站连通与国铁接驳提示 HTML 模块
 * @param {string} stationId - 车站 ID
 * @returns {string} 换乘指引 HTML 字符串
 */
function generateTransferHtml(stationId) {
    let html = '';
    const getSortedLineIcons = (targetSids) => {
        const uniqueLines = new Map();
        targetSids.forEach(tid => {
            const tStation = processedStations[tid];
            if (tStation?.relatedLines) {
                tStation.relatedLines.forEach(lid => {
                    if (uniqueLines.has(lid)) return;
                    const line = linesData.find(l => l.id === lid);
                    if (line) {
                        const meta = getLineSvgMeta(line.id) || LINE_META[line.name] || {};
                        uniqueLines.set(lid, {
                            id: line.id,
                            name: line.name,
                            svg: meta.svg ? getSvgPath(meta.svg) : null,
                            svgclr: meta.svgclr || line.color,
                            svgtext: meta.svgtext || '#ffffff',
                            targetSid: tid
                        });
                    }
                });
            }
        });
        const sortedList = Array.from(uniqueLines.values()).sort((a, b) => {
            return window.getLineSortIndex(a.id) - window.getLineSortIndex(b.id);
        });
        return sortedList.map(item => {
            const styleStr = item.svgclr ? `--svgclr:${item.svgclr}; --svgtext:${item.svgtext};` : '';
            return item.svg ?
                `<span class="svg-icon-placeholder line-badge transfer-link" data-jump-sid="${item.targetSid}" data-src="${item.svg}" style="display:inline-block; margin-left:2px; margin-top:6px; vertical-align:middle; cursor:pointer; ${styleStr}"></span>` :
                `<span class="text-badge" style="display:inline-block; margin-left:2px; margin-top:6px;">${item.name}</span>`;
        }).join('');
    };
    if (typeof VIRTUAL_TRANSFER_MAP !== 'undefined' && VIRTUAL_TRANSFER_MAP[stationId]) {
        const icons = getSortedLineIcons(VIRTUAL_TRANSFER_MAP[stationId]);
        if (icons) html += `<div class="transfer-section"><div class="info-row" style="align-items:center;"><span class="info-label">可接驳或付费换乘至</span><div style="flex:1;text-align:right;">${icons}</div></div></div>`;
    }
    if (typeof VIRTUAL_FREE_TRANSFER_MAP !== 'undefined' && VIRTUAL_FREE_TRANSFER_MAP[stationId]) {
        const icons = getSortedLineIcons(VIRTUAL_FREE_TRANSFER_MAP[stationId]);
        if (icons) html += `<div class="transfer-section"><div class="info-row" style="align-items:center;"><span class="info-label" style="font-size:12px;">电子客票可免费站外换乘</span><div style="flex:1;text-align:right;">${icons}</div></div></div>`;
    }
    return html;
}

/**
 * 渲染车站详情主面板 (Station Detail Modal / Drawer)
 * 包含：
 * 1. 顶部中英文站名、换乘/同台换乘徽章、曾用名气泡；
 * 2. 多线路选项卡切换 (多线换乘站时可查看各线路上一站/下一站/间距及首末班车)；
 * 3. 车站卡片系统 (StaCard) 微缩视窗嵌入（高德地图瓦片/立体车站结构）；
 * 4. 底部外部导航链接（高德地图导航、12306 购票外链、时刻表直达）。
 * @param {Object} station - 车站对象
 * @param {number} [initialTabIndex=0] - 默认激活选项卡索引
 */
function renderUserModePanel(station, initialTabIndex = 0) {
    const city = getActiveCity();
    const CROSS_PLATFORM_STATIONS = city.CROSS_PLATFORM_STATIONS || [];
    const relatedLinesInfo = [];
    const companyList = [];
    const MERGE_STATIONS = city.MERGE_STATIONS || [];
    const isMergeStation = MERGE_STATIONS.includes(station.id);
    const isSuburbanStation = station.relatedLines && station.relatedLines.some(id => isSuburbanLine(id));
    const isRwyStation = station.relatedLines && (station.relatedLines.includes('Rwy') || station.relatedLines.includes('Rwy2'));
    const isNoStation = station.type === 'no';
    const isTsfMode = station.type === 'tsf' && !isSuburbanStation;
    const isCrossPlatformDisplay = isTsfMode && CROSS_PLATFORM_STATIONS.includes(station.id);
    const findScheduleUrl = (lineId, stationId) => {
        if (typeof GLOBAL_SCHEDULE_DATA === 'undefined' || !GLOBAL_SCHEDULE_DATA) return null;
        const lineData = GLOBAL_SCHEDULE_DATA[lineId];
        if (!lineData) return null;
        return resolveScheduleHref(lineData[stationId]);
    };
    const getInfoStr = (sid, dist, fromSid) => {
        const sName = processedStations[sid]?.cn || "未知";
        const strDist = (dist === undefined || dist === null) ? "" : String(dist).trim();
        if (strDist && strDist !== "0" && strDist !== "?" && strDist !== "??") {
            return `${sName} <span style="color:var(--text-light);font-size:10px;">(${strDist}米)</span>`;
        }
        if (fromSid) {
            const estimated = estimateSchematicMeters(fromSid, sid);
            if (estimated != null) {
                return `${sName} <span style="color:var(--text-light);font-size:10px;">(约${estimated}米)</span>`;
            }
        }
        return sName;
    };
    linesData.forEach(line => {
        let isStationOnLine = false;
        if (line.isPointOnly) {
            isStationOnLine = line.stationIds.includes(station.id);
        } else if (line.hasbranch) {
            isStationOnLine = line['stationIds-way1'].includes(station.id) || line['stationIds-way2'].includes(station.id);
        } else {
            isStationOnLine = line.stationIds.includes(station.id);
        }
        if (isStationOnLine) {
            const lineMeta = getLineSvgMeta(line.id) || {};
            const defaultMeta = {
                svg: line.svg || lineMeta.svg || null,
                svgclr: line.svgclr || lineMeta.svgclr || line.color,
                svgtext: line.svgtext || lineMeta.svgtext || '#ffffff',
                company: line.company || lineMeta.company || (city.LINE_META && city.LINE_META[line.name]?.company) || "未知运营"
            };
            const finalCompany = defaultMeta.company;
            companyList.push(finalCompany);
            let staConfig = null;
            if (window.STA_DATA) {
                staConfig = window.STA_DATA.find(d => d.stationId === station.id && d.lineId === line.id);
            }
            const isRwyLine = line.id === 'Rwy' || line.id === 'Rwy2';
            const hasDistanceData = (line.distances && line.distances.length > 0) ||
                (line.distances2 && line.distances2.length > 0) ||
                (line['distances-way1'] && line['distances-way1'].length > 0);
            if (line.isPointOnly && !hasDistanceData) {
                relatedLinesInfo.push({
                    name: line.name,
                    id: line.id,
                    svg: defaultMeta.svg ? getSvgPath(defaultMeta.svg) : null,
                    svgclr: defaultMeta.svgclr,
                    svgtext: defaultMeta.svgtext,
                    isPointOnly: true,
                    prev: null,
                    next: null,
                    company: finalCompany,
                    isRwy: isRwyLine,
                    lineColor: line.color,
                    staConfig: staConfig
                });
                return;
            }
            let prevInfo = "无";
            let nextInfo = "无";
            const isLoop = line.isLoop === true;
            if (line.hasbranch) {
                const dists1 = line['distances-way1'] || line.distances || [];
                const ids1 = line['stationIds-way1'] || [];
                let idx = ids1.indexOf(station.id);
                if (idx !== -1) {
                    if (idx > 0) prevInfo = getInfoStr(ids1[idx - 1], dists1[idx - 1], station.id);
                    if (idx < ids1.length - 1) nextInfo = getInfoStr(ids1[idx + 1], dists1[idx], station.id);
                } else {
                    const dists2 = line['distances-way2'] || [];
                    const ids2 = line['stationIds-way2'] || [];
                    idx = ids2.indexOf(station.id);
                    if (idx !== -1) {
                        if (idx > 0) prevInfo = getInfoStr(ids2[idx - 1], dists2[idx - 1], station.id);
                        if (idx < ids2.length - 1) nextInfo = getInfoStr(ids2[idx + 1], dists2[idx], station.id);
                    }
                }
            } else {
                const ids = line.stationIds;
                const dists = line.distances || [];
                const distsReverse = line.distances2;
                const idx = ids.indexOf(station.id);
                const len = ids.length;
                if (idx !== -1) {
                    if (isLoop) {
                        const prevIdx = (idx - 1 + len) % len;
                        const nextIdx = (idx + 1) % len;
                        const prevDistVal = (distsReverse && distsReverse[prevIdx] !== undefined)
                            ? distsReverse[prevIdx] : dists[prevIdx];
                        const nextDistVal = dists[idx];
                        prevInfo = getInfoStr(ids[prevIdx], prevDistVal, station.id);
                        nextInfo = getInfoStr(ids[nextIdx], nextDistVal, station.id);
                    } else {
                        if (idx > 0) {
                            const prevDistVal = (distsReverse && distsReverse[idx - 1] !== undefined)
                                ? distsReverse[idx - 1] : dists[idx - 1];
                            prevInfo = getInfoStr(ids[idx - 1], prevDistVal, station.id);
                        }
                        if (idx < len - 1) {
                            nextInfo = getInfoStr(ids[idx + 1], dists[idx], station.id);
                        }
                    }
                }
            }
            const timeUrl = findScheduleUrl(line.id, station.id);
            relatedLinesInfo.push({
                name: line.name,
                id: line.id,
                svg: defaultMeta.svg ? getSvgPath(defaultMeta.svg) : null,
                svgclr: defaultMeta.svgclr,
                svgtext: defaultMeta.svgtext,
                isPointOnly: false,
                prev: prevInfo, next: nextInfo, company: finalCompany,
                lineColor: line.color, staConfig: staConfig, scheduleUrl: timeUrl
            });
        }
    });
    if (typeof city.handleLineMerge === 'function') {
        city.handleLineMerge(station, relatedLinesInfo);
    }
    relatedLinesInfo.sort((a, b) => {
        const idxA = window.getLineSortIndex(a.id);
        const idxB = window.getLineSortIndex(b.id);
        if (idxA !== idxB) return idxA - idxB;
        if (a.isPointOnly !== b.isPointOnly) {
            return a.isPointOnly ? 1 : -1;
        }
        return 0;
    });
    let companyStr = city.formatCompanyString ? city.formatCompanyString(companyList) : [...new Set(companyList)].join("，");
    const typeMap = { 'dot': '普通站', 'tsf': '换乘站', 'tsfo': '站外换乘站', 'diy': '换乘和接驳站', 'no': '未开通车站', 'rdot': '中国铁路车站' };
    const stationTypeStr = typeMap[station.type] || '普通站';
    const badgesHtml = relatedLinesInfo.map(info => {
        const styleStr = info.svgclr ? `--svgclr:${info.svgclr}; --svgtext:${info.svgtext};` : '';
        return info.svg ? `<span class="svg-icon-placeholder line-badge" data-src="${info.svg}" style="${styleStr}"></span>` : `<span class="text-badge">${info.name}</span>`;
    }).join('');
    const createRow = (label, value) => {
        if (isMergeStation && value === "无") return "";
        return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value" style="line-height:1.4;">${value}</span></div>`;
    };
    const getStaCardAreaHtml = (info, isHoisted = false) => {
        if (typeof city.getStaCardHtml === 'function') {
            return city.getStaCardHtml(station, info, isHoisted);
        }
        return '';
    };
    let commonStaCardHtml = '';
    if (isCrossPlatformDisplay) {
        const mainLine = relatedLinesInfo.find(info => typeof city.hasStaCard === 'function' && city.hasStaCard(station.id, info.id, info)) || relatedLinesInfo[0] || {};
        commonStaCardHtml = getStaCardAreaHtml(mainLine, true);
    }
    let transferHtml = '';
    if (typeof generateTransferHtml === 'function') {
        transferHtml = generateTransferHtml(station.id);
    }
    let tabsNavHtml = '<div class="panel-tabs-nav">';
    let tabsContentHtml = '<div class="panel-tabs-body">';
    const displayLines = relatedLinesInfo.filter(info => !info.isPointOnly || info.id === 'Rwy');
    const infoPanel = document.getElementById('info-panel');
    if (!infoPanel) return;

    // 构建模块化渲染上下文
    const context = {
        station,
        initialTabIndex,
        city,
        CROSS_PLATFORM_STATIONS,
        MERGE_STATIONS,
        isMergeStation,
        isSuburbanStation,
        isRwyStation,
        isNoStation,
        isTsfMode,
        isCrossPlatformDisplay,
        relatedLinesInfo,
        companyList,
        displayLines,
        helpers: {
            findScheduleUrl,
            getInfoStr,
            generateTransferHtml,
            updateStationSectionTitle,
            handleShare,
            updateShareMeta,
            resetMapState,
            toggleMobilePanelSize,
            updateExpandIcon,
            renderStationCardsInPanel,
            selectStation,
            injectInlineSvgs,
            initPanelDrag,
            adjustPanelPosition
        }
    };

    // 优先调用 StationBoard 模块化渲染引擎
    if (window.StationBoard && typeof window.StationBoard.render === 'function') {
        window.StationBoard.render(infoPanel, context);
        return;
    }

    // 兜底：若 StationBoard 引擎未就绪，使用内联基础渲染流程
    let enNameDisplay = station.en.replace(/<br>/gi, ' ');
    if (station.cn === '首经贸') enNameDisplay = station.en.replace(/<br>/gi, '<span class="special-br"></span>');
    const headerLeftHtml = `<div class="header-name-group"><div class="panel-cn-name">${station.cn}</div><div class="panel-en-name">${enNameDisplay}</div></div>`;
    infoPanel.style.height = '';
    const expandBtnHtml = (window.innerWidth <= 640)
        ? `<button class="panel-expand-btn" title="展开/收起">
                 <cgo-icon name="expand-less" size="18"></cgo-icon>
               </button>`
        : '';
    infoPanel.innerHTML = `
        <div class="panel-header">
            <button class="panel-close-btn" title="关闭面板">
                <cgo-icon name="close" size="24"></cgo-icon>
            </button>
            ${expandBtnHtml}
            ${headerLeftHtml}
            <div class="panel-badges">${badgesHtml}</div>
        </div>
        
        <div class="panel-tabs-container">
            ${tabsNavHtml}
            <button class="panel-share-btn" title="分享车站信息">
                <cgo-icon name="external" size="20"></cgo-icon>
            </button>
        </div>
        
        <div class="panel-body">
            ${commonStaCardHtml}
            ${tabsContentHtml}
        </div>
        <div class="panel-footer">${footerContent}</div>
    `;
    if (document.body.classList.contains('legend-pinned')) {
        updateStationSectionTitle(station.cn);
    }
    const tabItems = infoPanel.querySelectorAll('.tab-item');
    const tabPanes = infoPanel.querySelectorAll('.tab-pane');
    tabItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            tabItems.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const targetIndex = item.dataset.tabIndex;
            const targetPane = infoPanel.querySelector(`.tab-pane[data-tab-index="${targetIndex}"]`);
            if (targetPane) targetPane.classList.add('active');

            const footerScheduleBtn = infoPanel.querySelector('#footer-schedule-btn');
            if (footerScheduleBtn) {
                let targetUrl = null;
                if (targetIndex !== 'station-info') {
                    const idx = parseInt(targetIndex, 10);
                    if (displayLines && displayLines[idx] && displayLines[idx].scheduleUrl) {
                        targetUrl = displayLines[idx].scheduleUrl;
                    }
                }
                if (!targetUrl) {
                    targetUrl = displayLines.find(l => l.scheduleUrl)?.scheduleUrl || null;
                }
                if (targetUrl) {
                    footerScheduleBtn.href = targetUrl;
                    footerScheduleBtn.style.display = 'flex';
                } else {
                    footerScheduleBtn.style.display = 'none';
                }
            }

            if (typeof adjustPanelPosition === 'function') {
                setTimeout(adjustPanelPosition, 50);
            }
        });
    });
    const shareBtn = infoPanel.querySelector('.panel-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const activeTab = infoPanel.querySelector('.tab-item.active');
            let lineId = '';
            if (activeTab && activeTab.dataset.tabIndex !== 'station-info') {
                const idx = parseInt(activeTab.dataset.tabIndex);
                if (displayLines && displayLines[idx]) lineId = displayLines[idx].id;
            }
            handleShare(station, lineId);
        });
    }
    updateShareMeta(station);
    const closeBtn = infoPanel.querySelector('.panel-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); resetMapState(); });
    const expandBtn = infoPanel.querySelector('.panel-expand-btn');
    if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobilePanelSize(station);
        });
        if (document.body.classList.contains('mobile-panel-expanded')) {
            updateExpandIcon(expandBtn, true);
        }
    }
    renderStationCardsInPanel(infoPanel, station);
    const transferLinks = infoPanel.querySelectorAll('.transfer-link');
    transferLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetSid = link.dataset.jumpSid;
            if (targetSid && typeof selectStation === 'function') {
                selectStation(targetSid);
            }
        });
    });
    injectInlineSvgs(infoPanel);
    initPanelDrag();

    if (initialTabIndex > 0) {
        const allTabs = infoPanel.querySelectorAll('.tab-item');
        if (allTabs[initialTabIndex]) {
            allTabs[initialTabIndex].click();
        }
    }
}
function toggleMobilePanelSize(station) {
    const isExpanded = document.body.classList.toggle('mobile-panel-expanded');
    const btn = document.querySelector('.panel-expand-btn');
    updateExpandIcon(btn, isExpanded);
    if (typeof mapContainer !== 'undefined' && typeof currentScale !== 'undefined') {
        const viewportW = mapContainer.clientWidth;
        const viewportH = mapContainer.clientHeight;
        const targetVisualY = isExpanded ? (viewportH * 0.2) : (viewportH * 0.2);
        const targetVisualX = viewportW / 2;
        currentX = targetVisualX - (station.x * currentScale);
        currentY = targetVisualY - (station.y * currentScale);
        if (typeof enforceBoundaries === 'function') enforceBoundaries();
        if (typeof updateMapTransform === 'function') updateMapTransform();
    }
}
function updateExpandIcon(btn, isExpanded) {
    if (!btn) return;
    if (isExpanded) {
        btn.innerHTML = `<cgo-icon name="expand-more" size="18"></cgo-icon>`;
    } else {
        btn.innerHTML = `<cgo-icon name="expand-less" size="18"></cgo-icon>`;
    }
}
async function renderStationCardsInPanel(panel, targetStation) {
    const infoPanel = panel || document.getElementById('info-panel');
    if (!infoPanel) return;
    const city = getActiveCity();
    if (typeof city.renderStaCards === 'function') {
        try {
            await city.renderStaCards(infoPanel, targetStation);
        } catch (e) {
            console.warn("[StaCard] 渲染车站卡片异常:", e);
        }
    }
    setTimeout(() => {
        if (typeof adjustPanelPosition === 'function') {
            adjustPanelPosition();
        }
    }, 50);
}

function resetMapState() {
    hideLineTooltipNow();
    const infoPanel = document.getElementById('info-panel');
    const dynamicContainer = document.getElementById('sidebar-dynamic-content');
    if (infoPanel && (window.innerWidth <= 640 || !document.body.classList.contains('legend-pinned'))) {
        infoPanel.style.display = 'none';
    }
    const selector = document.getElementById('station-selector');
    if (selector) selector.remove();
    document.body.classList.remove('mobile-split-active');
    document.body.classList.remove('mobile-panel-expanded');
    clearHighlights();
    lastSelectedStationId = null;
    if (window.innerWidth > 640 && document.body.classList.contains('legend-pinned') && dynamicContainer) {
        const sections = dynamicContainer.querySelectorAll('.station-history-section');
        sections.forEach(sec => sec.classList.add('collapsed'));
    }
    enforceBoundaries();
    mapContent.classList.add('animate-zoom');
    updateMapTransform();
    updateShareMeta(null); // Restore original title/meta
    setTimeout(() => mapContent.classList.remove('animate-zoom'), 300);
}

function handleShare(station, lineId = "") {
    const attr = 'nmlsta';

    if (!lineId && station.relatedLines && station.relatedLines.length > 0) {
        lineId = station.relatedLines[0];
    }

    let tabSuffix = "";
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
        const activeTab = infoPanel.querySelector('.tab-item.active');
        const allTabs = infoPanel.querySelectorAll('.tab-item');
        if (activeTab) {
            const idx = Array.from(allTabs).indexOf(activeTab);
            // 选项卡是 tab1, tab2... (1-based)
            tabSuffix = `tab${idx + 1}`;
        }
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?=${attr}&${lineId}&${station.id}${tabSuffix}`;
    const shareTitle = `${station.cn}运营信息`;
    const shareText = shareUrl;

    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareText === shareUrl ? "" : shareText,
            url: shareUrl,
        }).catch(err => {
            console.warn("Share failed:", err);
            copyToClipboard(shareUrl);
        });
    } else {
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try {
        document.execCommand('copy');
        showToast("已复制分享链接");
    } catch (err) {
        console.error("Copy failed", err);
    }
    document.body.removeChild(el);
}

function showToast(message, type = 'success') {
    if (typeof CGO !== 'undefined' && CGO.showToast) {
        CGO.showToast(message, type);
        return;
    }
    let toast = document.getElementById('map-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'map-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            z-index: 10000;
            transition: opacity 0.3s;
            pointer-events: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';

    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}

function updateShareMeta(station) {
    const title = station ? `${station.cn}站详细信息` : originalTitle;
    const desc = station ? "CGo OpenMap" : originalDesc;
    const logo = new URL('./assets/icons/mapicon.png', window.location.href).href;

    document.title = title;

    const metaTags = [
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:image', content: logo },
        { name: 'description', content: desc }
    ];

    metaTags.forEach(tag => {
        let el = tag.property
            ? document.querySelector(`meta[property="${tag.property}"]`)
            : document.querySelector(`meta[name="${tag.name}"]`);

        if (!el) {
            el = document.createElement('meta');
            if (tag.property) el.setAttribute('property', tag.property);
            if (tag.name) el.setAttribute('name', tag.name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', tag.content);
    });
}

/**
 * 平滑贝塞尔曲线折线倒角算法 (Corner Rounding & Smoothing Algorithm)
 * 
 * 核心数学原理：
 * 1. 遍历折线点阵中的每一对前后相邻线段向量 v1 (Prev -> Curr) 与 v2 (Curr -> Next)；
 * 2. 归一化为单位方向向量 u1, u2；
 * 3. 利用点积 (Dot Product) 判断拐角夹角类型：
 *    - 当 dot 接近 0 (|u1 · u2| < 0.1) 时为 90° 直角，默认半径 RADIUS_90 (18px)；
 *    - 否则为 45° 或其它斜角，默认半径 RADIUS_45 (8px)；
 *    - 若点对象显式指定了 `pCurr.r`，则优先采用该自定义圆角半径；
 * 4. 为避免线段过短导致圆角相互重叠畸变，采用 `limitFactor` (默认 0.9) 限制最大半径；
 * 5. 使用二次贝塞尔曲线指令 `Q` 以拐角顶点 pCurr 为控制点，从切点 (startX, startY) 平滑过渡到 (endX, endY)。
 * 
 * @param {Array<{x: number, y: number, r?: number}>} points - 折线点阵坐标数组
 * @param {boolean|number} [roundingParam=false] - 是否启用严格倒角限制或指定限制比例因子
 * @returns {string} SVG Path 数据指令字符串 (如 "M 10 10 L 20 20 Q 30 20 30 30...")
 */
function generateRoundedPath(points, roundingParam = false) {
    if (!points || points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    let limitFactor = 0.9;
    if (typeof roundingParam === 'number') {
        limitFactor = roundingParam;
    } else if (roundingParam === true) {
        limitFactor = 0.5;
    }
    for (let i = 1; i < points.length - 1; i++) {
        const pPrev = points[i - 1], pCurr = points[i], pNext = points[i + 1];
        const v1 = { x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y };
        const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        if (len1 < 0.01 || len2 < 0.01) continue;
        const u1 = { x: v1.x / len1, y: v1.y / len1 };
        const u2 = { x: v2.x / len2, y: v2.y / len2 };
        let targetRadius = pCurr.r !== undefined ? pCurr.r :
            (Math.abs(u1.x * u2.x + u1.y * u2.y) < 0.1 ? RADIUS_90 : RADIUS_45);
        const r = Math.min(targetRadius, len1 * limitFactor, len2 * limitFactor);
        const startX = pCurr.x - u1.x * r, startY = pCurr.y - u1.y * r;
        const endX = pCurr.x + u2.x * r, endY = pCurr.y + u2.y * r;
        d += ` L ${startX} ${startY} Q ${pCurr.x} ${pCurr.y} ${endX} ${endY}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
}

/**
 * 组装连接线 Path 指令
 */
function getConnectorPath(conn) {
    const sFrom = processedStations[conn.from];
    const sTo = processedStations[conn.to];
    if (sFrom && sTo) {
        let x1 = sFrom.x + (conn.offsetFrom?.x || 0);
        let y1 = sFrom.y + (conn.offsetFrom?.y || 0);
        let x2 = sTo.x + (conn.offsetTo?.x || 0);
        let y2 = sTo.y + (conn.offsetTo?.y || 0);
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    return null;
}

function createSvgPath(d, color, width) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", width);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    return path;
}

/**
 * 显示线路悬停徽标提示 (Tooltip)
 */
function handleTooltipShow(lineName) {
    const meta = getLineSvgMeta(lineName);
    if (meta && meta.svg) {
        lineTooltip.innerHTML = '';
        const span = document.createElement('span');
        span.className = 'svg-icon-placeholder';
        span.dataset.src = getSvgPath(meta.svg);
        const styleStr = meta.svgclr ? `display:block; height:34px; width:auto; --svgclr:${meta.svgclr}; --svgtext:${meta.svgtext};` : "display:block; height:34px; width:auto;";
        span.style.cssText = styleStr;
        lineTooltip.appendChild(span);
        lineTooltip.style.display = 'block';
        injectInlineSvgs(lineTooltip);
    } else {
        lineTooltip.style.display = 'none';
    }
}

function updateTooltipPos(x, y) {
    lineTooltip.style.left = x + 'px';
    lineTooltip.style.top = y + 'px';
}

function triggerUpdateZoom(newScale) {
    const slider = document.getElementById('mz-slider');
    if (slider) {
        if (newScale < 0.5) newScale = 0.5;
        if (newScale > 3.0) newScale = 3.0;
        slider.value = newScale;
        slider.dispatchEvent(new Event('input'));
    }
}

function adjustPanelPosition() {
    if (window.innerWidth <= 640) return;
    const infoPanel = document.getElementById('info-panel');
    if (!infoPanel) return;
    const rect = infoPanel.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const padding = 20;
    if (rect.bottom > viewportHeight - padding) {
        const overflow = rect.bottom - (viewportHeight - padding);
        const currentTop = parseInt(infoPanel.style.top || 0);
        let newTop = currentTop - overflow;
        if (newTop < 15) newTop = 15;
        infoPanel.classList.add('panel-adjust-anim');
        infoPanel.style.top = newTop + 'px';
        setTimeout(() => {
            infoPanel.classList.remove('panel-adjust-anim');
        }, 300);
    }
}

/**
 * 判断指定线路 ID 是否属于市郊铁路/城际通勤线路
 */
function isSuburbanLine(lid) {
    const city = getActiveCity();
    if (typeof city.isSuburbanLine === 'function') {
        return city.isSuburbanLine(lid);
    }
    const suburbanLines = city.SUBURBAN_LINES || ['S1', 'S2', 'S5', 'S6', 'Rwy', 'Rwy2'];
    return suburbanLines.includes(lid);
}

// LBS 地理坐标字典与加载状态
let STATION_GEO_MAP = {};
let isGeoLoaded = false;
const GEO_PATCH = {};

/**
 * 初始化 LBS 地理定位系统与车站经纬度数据 (amap_data.json)
 */
async function initGeoSystem() {
    const btn = document.getElementById('locate-btn');
    if (btn) btn.addEventListener('click', findNearestStation);
    const city = getActiveCity();
    const geoDataUrl = (city.dataFiles && city.dataFiles.amapDataUrl) ? city.dataFiles.amapDataUrl : null;
    if (!geoDataUrl) {
        console.log("LBS: 当前城市未配置地理坐标数据文件。");
        if (btn) btn.style.opacity = 0.5;
        return;
    }
    try {
        const response = await fetch(geoDataUrl);
        if (!response.ok) throw new Error("File not found");
        const data = await response.json();
        data.l.forEach(line => {
            line.st.forEach(sta => {
                const coords = sta.sl.split(',').map(Number);
                STATION_GEO_MAP[sta.n] = coords;
            });
        });
        Object.assign(STATION_GEO_MAP, GEO_PATCH);
        isGeoLoaded = true;
        schematicMetersPerPixelCache = undefined;
        console.log(`LBS: Loaded ${Object.keys(STATION_GEO_MAP).length} geo points.`);
    } catch (e) {
        console.warn(`LBS: Failed to load ${geoDataUrl}. Nearest station feature disabled.`);
        if (btn) btn.style.opacity = 0.5;
    }
}

/**
 * 检索距离用户当前地理位置最近的车站 (Find Nearest Station via Geolocation)
 */
function findNearestStation() {
    if (!isGeoLoaded) {
        alert("地图数据加载中，请稍后再试...");
        return;
    }
    const btn = document.getElementById('locate-btn');
    const originalIcon = `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>`;
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;animation:spin 1s linear infinite;"><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>`;
    if (!navigator.geolocation) {
        alert("您的浏览器不支持定位功能");
        btn.innerHTML = originalIcon;
        return;
    }
    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    let watchId;
    const successCallback = (position) => {
        navigator.geolocation.clearWatch(watchId);
        const wgsLat = position.coords.latitude;
        const wgsLng = position.coords.longitude;
        const [gcjLng, gcjLat] = wgs2gcj(wgsLng, wgsLat);
        let minDist = Infinity;
        let nearestSid = null;
        let nearestName = "";
        for (let sid in processedStations) {
            const s = processedStations[sid];
            let coords = STATION_GEO_MAP[s.cn];
            if (!coords) coords = STATION_GEO_MAP[s.cn + "站"];
            if (!coords) coords = STATION_GEO_MAP[s.cn.replace(/站$/, "")];
            if (coords) {
                const dist = getDistance(gcjLat, gcjLng, coords[1], coords[0]);
                if (dist < minDist) {
                    minDist = dist;
                    nearestSid = sid;
                    nearestName = s.cn;
                }
            }
        }
        btn.innerHTML = originalIcon;
        if (nearestSid) {
            let distText = minDist < 1000 ? `${Math.round(minDist)}米` : `${(minDist / 1000).toFixed(1)}公里`;
            if (minDist > 50000) {
                if (!confirm(`离您最近的车站是【${nearestName}】，距离 ${distText}。\n距离较远，是否跳转？`)) return;
            }
            selectStation(nearestSid);
        } else {
            alert("无法定位最近车站 (数据匹配失败)");
        }
    };
    const errorCallback = (error) => {
        navigator.geolocation.clearWatch(watchId);
        btn.innerHTML = originalIcon;
        let msg = "定位失败";
        switch (error.code) {
            case 1: msg = "定位权限被拒绝，请在系统设置中允许浏览器使用位置信息。"; break;
            case 2: msg = "位置不可用 (请检查 GPS 或网络)"; break;
            case 3: msg = "定位请求超时 (请在开阔地带重试)"; break;
        }
        alert(msg);
    };
    watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, geoOptions);
}

/**
 * WGS-84 地球坐标系 转 GCJ-02 火星加密坐标系算法
 * @param {number} wgsLon - WGS84 经度
 * @param {number} wgsLat - WGS84 纬度
 * @returns {[number, number]} [gcjLon, gcjLat]
 */
function wgs2gcj(wgsLon, wgsLat) {
    if (outOfChina(wgsLon, wgsLat)) {
        return [wgsLon, wgsLat];
    }
    const PI = 3.14159265358979324;
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    let dLat = transformLat(wgsLon - 105.0, wgsLat - 35.0);
    let dLon = transformLon(wgsLon - 105.0, wgsLat - 35.0);
    const radLat = wgsLat / 180.0 * PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
    dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
    const mgLat = wgsLat + dLat;
    const mgLon = wgsLon + dLon;
    return [mgLon, mgLat];
}

function transformLat(x, y) {
    const PI = 3.14159265358979324;
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

function transformLon(x, y) {
    const PI = 3.14159265358979324;
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
}

function outOfChina(lon, lat) {
    if (lon < 72.004 || lon > 137.8347) return true;
    if (lat < 0.8293 || lat > 55.8271) return true;
    return false;
}

let schematicMetersPerPixelCache = undefined;

function lookupStationLngLat(cn) {
    if (!cn || !STATION_GEO_MAP) return null;
    return STATION_GEO_MAP[cn] || STATION_GEO_MAP[cn + "站"] || STATION_GEO_MAP[String(cn).replace(/站$/, "")] || null;
}

/**
 * 示意图像素 → 米的比例。优先用城市配置 schematicMetersPerPixel；
 * 否则用已加载的高德点对「球面距离 / 示意图站距」取中位数标定。
 */
function getSchematicMetersPerPixel() {
    if (schematicMetersPerPixelCache !== undefined) return schematicMetersPerPixelCache;
    const city = typeof getActiveCity === "function" ? getActiveCity() : null;
    const configured = Number(city && city.schematicMetersPerPixel);
    if (Number.isFinite(configured) && configured > 0) {
        schematicMetersPerPixelCache = configured;
        return configured;
    }
    const ratios = [];
    if (typeof linesData !== "undefined" && linesData && processedStations) {
        const waysOf = (line) => {
            if (line.hasbranch) return [line["stationIds-way1"], line["stationIds-way2"]];
            return [line.stationIds];
        };
        linesData.forEach((line) => {
            waysOf(line).forEach((ids) => {
                if (!ids) return;
                for (let i = 0; i < ids.length - 1; i++) {
                    const a = processedStations[ids[i]];
                    const b = processedStations[ids[i + 1]];
                    if (!a || !b) continue;
                    const px = Math.hypot(a.x - b.x, a.y - b.y);
                    if (px < 1) continue;
                    const geoA = lookupStationLngLat(a.cn);
                    const geoB = lookupStationLngLat(b.cn);
                    if (!geoA || !geoB) continue;
                    const meters = getDistance(geoA[1], geoA[0], geoB[1], geoB[0]);
                    if (meters > 80) ratios.push(meters / px);
                }
            });
        });
    }
    if (!ratios.length) {
        schematicMetersPerPixelCache = null;
        return null;
    }
    ratios.sort((a, b) => a - b);
    schematicMetersPerPixelCache = ratios[Math.floor(ratios.length / 2)];
    return schematicMetersPerPixelCache;
}

/** 无官方 distances 时，用两站示意图 (x,y) 折算估算米数（取整到 10 米）。 */
function estimateSchematicMeters(fromId, toId) {
    const a = processedStations[fromId];
    const b = processedStations[toId];
    if (!a || !b) return null;
    const px = Math.hypot(a.x - b.x, a.y - b.y);
    if (px < 1) return null;
    const mpp = getSchematicMetersPerPixel();
    if (!mpp) return null;
    return Math.max(10, Math.round((px * mpp) / 10) * 10);
}

/** 根据大圆航线 Haversine 公式计算两个经纬度坐标之间的球面距离 (单位: 米) */
function getDistance(lat1, lng1, lat2, lng2) {
    const radLat1 = lat1 * Math.PI / 180.0;
    const radLat2 = lat2 * Math.PI / 180.0;
    const a = radLat1 - radLat2;
    const b = (lng1 * Math.PI / 180.0) - (lng2 * Math.PI / 180.0);
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378137;
    return Math.round(s);
}
function initTheme() {
    let tooltip = document.getElementById('theme-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'theme-tooltip';
        document.body.appendChild(tooltip);
    }
    let tooltipTimer = null;
    const showTooltip = (text) => {
        tooltip.innerText = text;
        tooltip.classList.add('show');
        if (tooltipTimer) clearTimeout(tooltipTimer);
        tooltipTimer = setTimeout(() => {
            tooltip.classList.remove('show');
        }, 2000);
    };
    const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const getThemeKey = () => (typeof CGO !== 'undefined' && CGO.getThemeColorStorageKey) ? 'app-theme' : (localStorage.getItem('app-theme') !== null ? 'app-theme' : 'scmap_app-theme');
    const getPreferredTheme = () => {
        const savedTheme = localStorage.getItem('app-theme') || localStorage.getItem('scmap_app-theme');
        if (savedTheme) return savedTheme;
        return systemDarkQuery.matches ? 'dark' : 'light';
    };
    applyTheme(getPreferredTheme());
    systemDarkQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('app-theme') && !localStorage.getItem('scmap_app-theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    const btn = document.getElementById('theme-btn');
    if (!btn) return;

    let pressTimer = null;
    let isLongPress = false;
    const performReset = () => {
        isLongPress = true;
        localStorage.removeItem('app-theme');
        localStorage.removeItem('scmap_app-theme');
        const sysTheme = systemDarkQuery.matches ? 'dark' : 'light';
        applyTheme(sysTheme);
        showTooltip("已恢复系统明暗模式");
    };
    btn.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        isLongPress = false;
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = setTimeout(performReset, 800);
    });
    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };
    btn.addEventListener('pointerup', cancelPress);
    btn.addEventListener('pointerleave', cancelPress);
    btn.addEventListener('pointercancel', cancelPress);
    btn.addEventListener('click', (e) => {
        if (isLongPress) {
            isLongPress = false;
            e.stopPropagation();
            e.preventDefault();
            return;
        }
        const current = document.documentElement.getAttribute('data-theme');
        const next = (current === 'dark') ? 'light' : 'dark';
        localStorage.setItem(getThemeKey(), next);
        applyTheme(next);
        showTooltip("长按按钮恢复跟随系统");
    });
    btn.oncontextmenu = function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector('#theme-btn svg');
    if (icon) {
        if (theme === 'dark') {
            icon.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>';
        } else {
            icon.innerHTML = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
        }
    }
}
/**
 * 初始化全局右键/长按快捷操作菜单 (Context Menu)
 * 作用：
 * 1. 空白处右键：快速重置缩放、回到地图中心、刷新地图；
 * 2. 车站处右键/长按：弹出该站的中英文名、经停路线信息、高德地图导航外链、12306 购票查询与市郊时刻表直达。
 */
function initContextMenu() {
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.closest('#theme-btn, .theme-btn')) return false;
        showMenu(e.clientX, e.clientY, e.target);
        return false;
    }, { capture: true });
    let menu = null;
    let longPressTimer = null;
    let isDrag = false;
    let touchStartX = 0;
    let touchStartY = 0;
    const LONG_PRESS_DURATION = 600;
    const getMenuElement = () => {
        let el = document.getElementById('custom-context-menu');
        if (!el) {
            el = document.createElement('div');
            el.id = 'custom-context-menu';
            el.className = 'map-context-menu';
            document.body.appendChild(el);
        }
        return el;
    };
    const closeMenu = () => {
        menu = getMenuElement();
        if (menu && menu.style.display === 'flex') {
            menu.style.display = 'none';
        }
    };
    window.addEventListener('pointerdown', (e) => {
        menu = getMenuElement();
        if (menu && menu.style.display === 'flex' && !menu.contains(e.target)) {
            closeMenu();
        }
    });
    document.addEventListener('click', (e) => {
        if (e.target.closest('#custom-context-menu a, #custom-context-menu button')) {
            closeMenu();
        }
    });
    window.addEventListener('wheel', closeMenu);
    document.addEventListener('touchstart', (e) => {
        menu = getMenuElement();
        if (menu && menu.style.display === 'flex' && !menu.contains(e.target)) {
            closeMenu();
        }
    }, { passive: true });
    const showMenu = (x, y, target) => {
        if (target.closest('#theme-btn, .theme-btn')) return;
        menu = getMenuElement();
        const stationEl = target.closest('.station, .label-group, [data-sid]');
        let htmlContent = '';
        if (stationEl) {
            const sid = stationEl.dataset.sid;
            const station = processedStations[sid];
            if (!station) return;
            htmlContent = generateMergedMenuHtml(station);
        } else {
            const defScale = 1.1;
            htmlContent = `
                <div class="ctx-header">地图操作</div>
                <button type="button" class="ctx-menu-btn" onclick="triggerUpdateZoom(${defScale})">
                    <cgo-icon name="fullscn-exit" size="16"></cgo-icon> 恢复默认缩放
                </button>
                <button type="button" class="ctx-menu-btn" onclick="centerMap()">
                    <cgo-icon name="addone" size="16"></cgo-icon> 回到地图中点
                </button>
                <div class="ctx-divider"></div>
                <button type="button" class="ctx-menu-btn" onclick="location.reload()">
                    <cgo-icon name="refresh" size="16"></cgo-icon> 重新加载地图
                </button>
            `;
        }
        if (htmlContent) {
            menu.innerHTML = htmlContent;
            menu.style.display = 'flex';
            const menuW = 180;
            const menuH = 260;
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            let finalX = x;
            let finalY = y;
            if (finalX + menuW > winW) finalX = winW - menuW - 10;
            if (finalY + menuH > winH) finalY = winH - menuH - 10;
            if (finalX < 10) finalX = 10;
            if (finalY < 10) finalY = 10;
            menu.style.left = finalX + 'px';
            menu.style.top = finalY + 'px';

            requestAnimationFrame(() => {
                const rect = menu.getBoundingClientRect();
                let adjustX = finalX;
                let adjustY = finalY;
                if (adjustX + rect.width > winW - 10) {
                    adjustX = Math.max(10, winW - rect.width - 10);
                }
                if (adjustY + rect.height > winH - 10) {
                    adjustY = Math.max(10, winH - rect.height - 10);
                }
                if (adjustX < 10) adjustX = 10;
                if (adjustY < 10) adjustY = 10;
                if (adjustX !== finalX || adjustY !== finalY) {
                    menu.style.left = adjustX + 'px';
                    menu.style.top = adjustY + 'px';
                }
            });
        }
    };
    const generateMergedMenuHtml = (currentStation) => {
        const city = getActiveCity();
        const name = currentStation.cn;
        const EXCLUDED_MERGE = ['雁栖湖', '怀柔北', '苹果园', '望京西', '广渠门外'];
        let allStations = [currentStation];
        if (!EXCLUDED_MERGE.includes(name)) {
            for (let sid in processedStations) {
                const s = processedStations[sid];
                if (s.cn === name && s.id !== currentStation.id) {
                    allStations.push(s);
                }
            }
        }
        if (allStations.length === 1) {
            return renderSingleStationMenu(allStations[0]);
        }
        const RAIL_LINES = city.SUBURBAN_LINES || ['S1', 'S2', 'S5', 'S6', 'Rwy', 'Rwy2', '中国铁路', '城市副中心线', '通密线', '怀柔-密云线'];
        const subwayGroup = [];
        const railGroup = [];
        allStations.forEach(s => {
            let isRail = false;
            if (s.relatedLines) {
                isRail = s.relatedLines.some(lid => {
                    if (RAIL_LINES.includes(lid)) return true;
                    const lineInfo = linesData.find(l => l.id === lid);
                    return lineInfo && (RAIL_LINES.includes(lineInfo.name) || lineInfo.name.includes('铁路'));
                });
            }
            if (isRail) railGroup.push(s);
            else subwayGroup.push(s);
        });
        let html = `<div class="ctx-header">${name}</div>`;
        if (subwayGroup.length > 0) {
            html += `<div class="ctx-divider">地铁</div>`;
            html += getStationButtons(subwayGroup[0], 'subway');
        }
        if (railGroup.length > 0) {
            html += `<div class="ctx-divider">市郊铁路与中国铁路</div>`;
            html += getStationButtons(railGroup[0], 'rail', railGroup);
        }
        const navStation = subwayGroup.length > 0 ? subwayGroup[0] : railGroup[0];
        if (navStation && navStation.type !== 'no') {
            const isRail = railGroup.length > 0 && subwayGroup.length === 0;
            const mapUrl = city.getNavigationUrl ? city.getNavigationUrl(name, isRail) : `https://uri.amap.com/search?keyword=${encodeURIComponent(name)}`;
            html += `<div class="ctx-divider">导航</div>`;
            html += `<a href="${mapUrl}" target="_blank" rel="noreferrer" class="ctx-menu-btn"><cgo-icon name="map" size="16"></cgo-icon> 高德导航</a>`;
        }
        return html;
    };
    const renderSingleStationMenu = (station) => {
        const city = getActiveCity();
        let html = `<div class="ctx-header">${station.cn}</div>`;
        if (station.type === 'no') {
            return html + `<div class="ctx-menu-btn" style="color:#999;cursor:default;">暂未开通</div>`;
        }
        const RAIL_LINES = city.SUBURBAN_LINES || ['S1', 'S2', 'S5', 'S6', 'Rwy', 'Rwy2'];
        let type = 'subway';
        if (station.relatedLines && station.relatedLines.some(id => RAIL_LINES.includes(id))) {
            type = 'rail';
        }
        html += getStationButtons(station, type);
        const mapUrl = city.getNavigationUrl ? city.getNavigationUrl(station.cn, type === 'rail') : `https://uri.amap.com/search?keyword=${encodeURIComponent(station.cn)}`;
        html += `<a href="${mapUrl}" target="_blank" rel="noreferrer" class="ctx-menu-btn"><cgo-icon name="map" size="16"></cgo-icon> 高德导航</a>`;
        return html;
    };
    const getStationButtons = (station, type, groupArray = []) => {
        if (station.type === 'no') return `<div class="ctx-menu-btn" style="color:#999;cursor:default;">暂未开通</div>`;
        const city = getActiveCity();
        let btns = '';
        const url12306 = city.getRailway12306Url ? city.getRailway12306Url(station.cn) : `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(station.cn.replace(/站$/, ''))}`;
        let hasSuburban = false;
        if (type === 'rail') {
            const checkList = groupArray.length > 0 ? groupArray : [station];
            checkList.forEach(s => {
                if (s.relatedLines) {
                    if (s.relatedLines.some(id => isSuburbanLine(id))) hasSuburban = true;
                }
            });
        }
        if (type === 'rail') {
            if (hasSuburban) {
                const suburbanLinks = (typeof city.getSuburbanLinks === 'function') ? city.getSuburbanLinks() : null;
                if (suburbanLinks) {
                    if (suburbanLinks.timetableUrl) btns += `<a href="${suburbanLinks.timetableUrl}" target="_blank" rel="noreferrer" class="ctx-menu-btn"><cgo-icon name="calendar" size="16"></cgo-icon> 市郊时刻表</a>`;
                    if (suburbanLinks.ticketUrl) btns += `<a href="${suburbanLinks.ticketUrl}" target="_blank" rel="noreferrer" class="ctx-menu-btn"><cgo-icon name="ticket" size="16"></cgo-icon> 市郊票务</a>`;
                }
            }
            btns += `<a href="${url12306}" target="_blank" rel="noreferrer" class="ctx-menu-btn ctx-btn-primary"><cgo-icon name="search" size="16"></cgo-icon> 12306查询</a>`;
        } else {
            let staScheduleUrl = null;
            if (station.relatedLines && typeof GLOBAL_SCHEDULE_DATA !== 'undefined' && GLOBAL_SCHEDULE_DATA) {
                for (const lid of station.relatedLines) {
                    if (GLOBAL_SCHEDULE_DATA[lid] && GLOBAL_SCHEDULE_DATA[lid][station.id]) {
                        staScheduleUrl = resolveScheduleHref(GLOBAL_SCHEDULE_DATA[lid][station.id]);
                        if (staScheduleUrl) break;
                    }
                }
            }
            if (staScheduleUrl) {
                btns += `<a href="${staScheduleUrl}" target="_blank" rel="noreferrer" class="ctx-menu-btn ctx-btn-primary"><cgo-icon name="time" size="16"></cgo-icon> 官网查询</a>`;
            }
            if (station.relatedLines && station.relatedLines.includes('Rwy2')) {
                btns += `<a href="${url12306}" target="_blank" rel="noreferrer" class="ctx-menu-btn"><cgo-icon name="search" size="16"></cgo-icon> 12306查询</a>`;
            }
        }
        return btns;
    };
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) return;
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isDrag = false;
        longPressTimer = setTimeout(() => {
            if (!isDrag) {
                if (e.target.closest('#theme-btn, .theme-btn, button, input, select')) return;
                if (navigator.vibrate) {
                    try { navigator.vibrate(50); } catch (_) {}
                }
                showMenu(touchStartX, touchStartY, e.target);
            }
        }, LONG_PRESS_DURATION);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - touchStartX) > 10 || Math.abs(touch.clientY - touchStartY) > 10) {
            isDrag = true;
            if (longPressTimer) clearTimeout(longPressTimer);
        }
    }, { passive: true });
    document.addEventListener('touchend', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
    }, { passive: true });
}

// 缓存内嵌的 SVG 文本内容
const INLINE_SVG_CACHE = new Map();

function getNormalizedColor(colorStr) {
    if (!colorStr || colorStr === 'none' || colorStr === 'transparent') return '';
    const div = document.createElement('div');
    div.style.color = colorStr;
    document.body.appendChild(div);
    const rgb = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    return rgb;
}

/**
 * 根据城市注册表与当前城市线路数据文件，解析指定 SVG、线路ID 或线路名称对应的元数据与外观颜色
 * @param {string} identifier - svg文件名/路径、线路ID或线路名称
 * @returns {object|null} - 包含 svg, svgclr, svgtext, color, name, id 等属性的对象
 */
function getLineSvgMeta(identifier) {
    if (!identifier) return null;
    const cleanName = typeof identifier === 'string' ? identifier.split('/').pop().split('?')[0] : '';
    const city = getActiveCity();
    const currentLinesData = (typeof linesData !== 'undefined' && Array.isArray(linesData)) ? linesData : (city.linesData || []);
    const currentLineMeta = (typeof window !== 'undefined' && window.LINE_META) ? window.LINE_META : (city.LINE_META || {});

    // 1. 根据 svg 文件名查找
    let lineInfo = currentLinesData.find(l => l.svg === cleanName);

    // 2. 根据 line.id 查找
    if (!lineInfo) {
        lineInfo = currentLinesData.find(l => l.id === identifier);
    }

    // 3. 根据 line.name 查找
    if (!lineInfo) {
        lineInfo = currentLinesData.find(l => l.name === identifier);
    }

    // 4. 从 LINE_META 字典中按键或属性查找
    if (!lineInfo && currentLineMeta) {
        if (currentLineMeta[identifier]) {
            const m = currentLineMeta[identifier];
            return {
                name: identifier,
                id: m.id || '',
                svg: m.svg || '',
                svgclr: m.svgclr || m.color || '#00263b',
                svgtext: m.svgtext || '#ffffff',
                color: m.color || m.svgclr,
                company: m.company || ''
            };
        }
        for (const key in currentLineMeta) {
            const m = currentLineMeta[key];
            if (m && (m.svg === cleanName || m.svg === identifier)) {
                return {
                    name: key,
                    id: m.id || '',
                    svg: m.svg || '',
                    svgclr: m.svgclr || m.color || '#00263b',
                    svgtext: m.svgtext || '#ffffff',
                    color: m.color || m.svgclr,
                    company: m.company || ''
                };
            }
        }
    }

    if (lineInfo) {
        return {
            name: lineInfo.name,
            id: lineInfo.id,
            svg: lineInfo.svg || '',
            svgclr: lineInfo.svgclr || lineInfo.color || '#00263b',
            svgtext: lineInfo.svgtext || '#ffffff',
            color: lineInfo.color,
            company: lineInfo.company || ''
        };
    }
    return null;
}
window.getLineSvgMeta = getLineSvgMeta;

function getLineColorBySvgName(svgFileName) {
    const meta = getLineSvgMeta(svgFileName);
    return meta ? (meta.color || meta.svgclr) : null;
}

const LIGHT_BG_HEXES = ['#fac671', '#abcd03', '#f9e700', '#d5a799', '#d5abce', '#ee87b4', '#a29bbb', '#eebec2'];
const LIGHT_BG_RGBS = LIGHT_BG_HEXES.map(hex => getNormalizedColor(hex));
const TARGET_GREY_RGB = getNormalizedColor('#78848b');

/**
 * 动态加载并内嵌 SVG 图标，自动注入 CSS 颜色变量并执行背景对比度修正
 * @param {HTMLElement} container - 待处理的父容器 DOM 元素
 */
async function injectInlineSvgs(container) {
    const placeholders = container.querySelectorAll('.svg-icon-placeholder');
    for (const el of placeholders) {
        const src = el.dataset.src;
        if (!src) continue;

        // 根据城市线路数据记录读取 svgclr 和 svgtext 并赋予外观
        const lineMeta = getLineSvgMeta(src);
        if (lineMeta) {
            const clr = el.dataset.svgclr || lineMeta.svgclr;
            const txt = el.dataset.svgtext || lineMeta.svgtext;
            if (clr) el.style.setProperty('--svgclr', clr);
            if (txt) el.style.setProperty('--svgtext', txt);
            if (lineMeta.color) el.style.setProperty('--data3', lineMeta.color);
        }

        let svgContent = INLINE_SVG_CACHE.get(src);
        if (!svgContent) {
            try {
                const resp = await fetch(src);
                if (resp.ok) {
                    svgContent = await resp.text();
                    INLINE_SVG_CACHE.set(src, svgContent);
                }
            } catch (e) { console.warn('Icon load failed:', src); }
        }
        if (svgContent) {
            el.innerHTML = svgContent;
            el.classList.remove('svg-icon-placeholder');
            el.classList.add('svg-icon-inlined');
            const svg = el.querySelector('svg');
            if (!svg) continue;

            if (lineMeta) {
                const clr = el.dataset.svgclr || lineMeta.svgclr;
                const txt = el.dataset.svgtext || lineMeta.svgtext;
                if (clr) svg.style.setProperty('--svgclr', clr);
                if (txt) svg.style.setProperty('--svgtext', txt);
            }

            const isLegend = el.closest('.legend-item') || el.closest('.legend-section-title');
            if (isLegend) {
                continue;
            }
            const header = el.closest('.panel-header');
            if (header) {
                const headerBgRaw = header.style.backgroundColor || window.getComputedStyle(header).backgroundColor;

                if (headerBgRaw && headerBgRaw !== 'rgba(0, 0, 0, 0)' && headerBgRaw !== 'transparent') {
                    const bgRgb = getNormalizedColor(headerBgRaw);

                    if (bgRgb) {
                        const isLightBg = LIGHT_BG_RGBS.includes(bgRgb);
                        const replacementColor = isLightBg ? '#00263b' : 'rgba(255, 255, 255, 0.9)';
                        const lineColor = lineMeta ? lineMeta.color : null;

                        const shapes = svg.querySelectorAll('path, rect, circle, polygon, ellipse, g');
                        shapes.forEach(shape => {
                            const fillRaw = shape.style.fill || shape.getAttribute('fill');

                            if (!fillRaw || fillRaw === 'none') return;
                            if (fillRaw.indexOf('var(') !== -1) {
                                if (fillRaw.indexOf('--data3') !== -1 && lineColor) {
                                    const lineRgb = getNormalizedColor(lineColor);
                                    if (lineRgb === bgRgb) {
                                        shape.style.fill = replacementColor;
                                    }
                                    return;
                                }
                                if (isLightBg && fillRaw.indexOf('--data2') !== -1) {
                                    shape.style.fill = '#00263b';
                                    return;
                                }
                                return;
                            }
                            const shapeRgb = getNormalizedColor(fillRaw);
                            if (shapeRgb === TARGET_GREY_RGB || shapeRgb === bgRgb) {
                                shape.style.fill = replacementColor;
                            }
                        });
                    }
                }
            }
        }
    }
}
/**
 * 弹出同名/重叠车站选择器气泡 (Station Disambiguation Popover)
 * 当多个站台点位或不同线路的同名车站物理坐标重叠时，弹出徽标列表供用户选择
 * @param {HTMLElement} targetElement - 被点击的站点或标签 DOM 元素
 * @param {Array<Object>} candidates - 候选车站对象数组
 */
function showStationSelector(targetElement, candidates) {
    const oldSelector = document.getElementById('station-selector');
    if (oldSelector) oldSelector.remove();
    const selector = document.createElement('div');
    selector.id = 'station-selector';
    const labelLeft = parseFloat(targetElement.style.left);
    const labelTop = parseFloat(targetElement.style.top);
    selector.style.left = labelLeft + 'px';
    selector.style.top = (labelTop + 8) + 'px';
    let html = '';
    candidates.sort((a, b) => {
        const getSortKey = (s) => {
            if (s.relatedLines && s.relatedLines.length > 0) return window.getLineSortIndex(s.relatedLines[0]);
            return 9999;
        };
        return getSortKey(a) - getSortKey(b);
    });
    candidates.forEach(s => {
        let iconHtml = '';
        if (s.relatedLines && s.relatedLines.length > 0) {
            let validLines = s.relatedLines
                .map(lid => linesData.find(l => l.id === lid))
                .filter(l => l && (l.svg || (LINE_META[l.name] && LINE_META[l.name].svg)));
            validLines.sort((a, b) => {
                return window.getLineSortIndex(a.id) - window.getLineSortIndex(b.id);
            });
            const hasChinaRail = validLines.some(l => l.name === '中国铁路');
            const hasOthers = validLines.some(l => l.name !== '中国铁路');
            if (hasChinaRail && hasOthers) {
                validLines = validLines.filter(l => l.name !== '中国铁路');
            }
            validLines.forEach(line => {
                const svgFile = line.svg || (LINE_META[line.name] && LINE_META[line.name].svg);
                const meta = getLineSvgMeta(svgFile || line.id || line.name);
                const styleStr = meta ? `--svgclr:${meta.svgclr}; --svgtext:${meta.svgtext};` : '';
                iconHtml += `<span class="svg-icon-placeholder" data-src="${getSvgPath(svgFile)}" style="${styleStr}"></span>`;
            });
        }
        if (!iconHtml) {
            iconHtml = `<span class="selector-text-badge">${s.id}</span>`;
        }
        html += `<div class="selector-item" data-sid="${s.id}" title="${s.cn} (${s.id})">${iconHtml}</div>`;
    });
    selector.innerHTML = html;
    selector.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
    });
    selector.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.selector-item');
        if (item) {
            const sid = item.dataset.sid;
            selectStation(sid);
            selector.remove();
        }
    });
    let layer = document.getElementById('selector-layer');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'selector-layer';
        document.getElementById('map-content').appendChild(layer);
    }
    layer.appendChild(selector);
    injectInlineSvgs(selector);
}

/**
 * 初始化桌面端详情面板拖拽移动与左侧吸附停靠功能 (Panel Drag & Docking)
 */
function initPanelDrag() {
    const panel = document.getElementById('info-panel');
    const header = panel.querySelector('.panel-header');
    const ghost = document.getElementById('drag-ghost');
    if (!panel || !header) return;
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    const canDrag = () => window.innerWidth > 640 && !document.body.classList.contains('legend-pinned');
    header.addEventListener('mousedown', (e) => {
        if (!canDrag()) return;
        if (e.target.closest('button') || e.target.closest('a')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = panel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        panel.classList.remove('panel-adjust-anim');
        document.body.style.cursor = 'move';
        e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const panelW = panel.offsetWidth;
        const panelH = panel.offsetHeight;
        if (newLeft < 0) newLeft = 0;
        if (newLeft + panelW > viewportW) newLeft = viewportW - panelW;
        if (newTop < 0) newTop = 0;
        if (newTop + panelH > viewportH) newTop = viewportH - panelH;
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
        if (e.clientX < 100) {
            ghost.classList.add('active');
        } else {
            ghost.classList.remove('active');
        }
    });
    const stopDrag = (e) => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
            if (ghost.classList.contains('active')) {
                ghost.classList.remove('active');
                if (typeof lastSelectedStationId !== 'undefined' && processedStations[lastSelectedStationId]) {
                    dockStationPanel(processedStations[lastSelectedStationId], true);
                } else {
                    dockStationPanel(null, true);
                }
            }
        }
    };
    document.addEventListener('mouseup', stopDrag);
}

/**
 * 将车站详情面板吸附至常驻左侧边栏 (Dock Station to Sidebar)
 * @param {Object} station - 车站对象
 * @param {boolean} [forcePin=false] - 是否强制固定侧边栏
 */
function dockStationPanel(station, forcePin = false) {
    if (!station && typeof lastSelectedStationId !== 'undefined') {
        station = processedStations[lastSelectedStationId];
    }
    const isDesktop = window.innerWidth > 640;
    const isPinnedNow = document.body.classList.contains('legend-pinned');
    if (isDesktop && forcePin && !isPinnedNow) {
        document.body.classList.add('legend-pinned');
        document.body.classList.remove('pinned-hidden');
        localStorage.setItem('nal_legend_pinned', 'true');
        const pinBtn = document.getElementById('legend-pin-btn');
        if (pinBtn) {
            pinBtn.classList.add('active');
            pinBtn.innerHTML = `<cgo-icon name="unpin-angle" size="18"></cgo-icon>`;
            pinBtn.title = "取消固定";
        }
        const overlay = document.getElementById('legend-overlay');
        if (overlay) overlay.style.display = 'block';
        renderLegend();
    }
    const panel = document.getElementById('info-panel');
    const dynamicContainer = document.getElementById('sidebar-dynamic-content');
    if (!panel || !dynamicContainer || !station) return;
    const savedLimit = localStorage.getItem('nal_sidebar_history_limit');
    const MAX_HISTORY_LIMIT = savedLimit ? parseInt(savedLimit, 10) : 5;
    let delayTime = 0;
    if (!window.STATION_HISTORY.includes(station.id) && window.STATION_HISTORY.length >= MAX_HISTORY_LIMIT) {
        const oldestSid = window.STATION_HISTORY[0];
        const oldSection = document.getElementById(`station-section-${oldestSid}`);
        if (oldSection) {
            oldSection.classList.add('history-item-out');
            delayTime = 300;
        }
    }
    setTimeout(() => {
        window.STATION_HISTORY = window.STATION_HISTORY.filter(id => id !== station.id);
        window.STATION_HISTORY.push(station.id);
        while (window.STATION_HISTORY.length > MAX_HISTORY_LIMIT) {
            window.STATION_HISTORY.shift();
        }
        rebuildSidebarHistory();
        const newSectionId = `station-section-${station.id}`;
        const newSectionDom = document.getElementById(newSectionId);
        if (newSectionDom) {
            newSectionDom.classList.add('history-item-anim');
        }
        const currentPinnedMode = document.body.classList.contains('legend-pinned');
        if (isDesktop && (currentPinnedMode || forcePin)) {
            if (panel.parentElement !== document.body) {
                document.body.appendChild(panel);
            }
            if (newSectionDom) {
                newSectionDom.classList.remove('collapsed');
                const bodyEl = newSectionDom.querySelector('.section-body');
                if (bodyEl) {
                    bodyEl.innerHTML = '';
                    bodyEl.appendChild(panel);
                    panel.classList.add('docked'); // 添加 docked 类
                    panel.style.display = 'flex'; // 确保是 flex
                }
            }
            const allSections = dynamicContainer.querySelectorAll('.station-history-section');
            allSections.forEach(sec => {
                if (sec.id !== newSectionId) sec.classList.add('collapsed');
            });
            const legendTreeSection = document.getElementById('section-legend-tree');
            if (legendTreeSection) legendTreeSection.classList.add('collapsed');
            const cnNameEl = panel.querySelector('.panel-cn-name');
            if (cnNameEl) updateStationSectionTitle(cnNameEl.innerText);
            if (typeof enforceBoundaries === 'function') setTimeout(enforceBoundaries, 300);
        } else {
            if (newSectionDom) {
                newSectionDom.classList.add('collapsed');
            }
        }
    }, delayTime);
}

function updateStationSectionTitle(name) {
    const section = document.getElementById('section-station');
    if (section) {
        const titleEl = section.querySelector('.section-header span');
        if (titleEl) titleEl.innerText = name;
    }
}

/**
 * 将车站详情面板脱离侧边栏恢复为独立浮动窗口
 */
function undockStationPanel(activeStation = null) {
    const panel = document.getElementById('info-panel');
    const section = document.getElementById('section-station');
    if (panel) {
        document.body.appendChild(panel);
        panel.classList.remove('docked'); // 移除 docked 类
        if (activeStation) {
            const rect = mapContainer.getBoundingClientRect();
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            showPanelAt(viewportW / 2 - 180, viewportH / 2 - 150);
        } else {
            panel.style.display = 'none';
        }
    }
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * 漫游输入交互系统 (Input Controls Engine)
 * 包含：
 * 1. 触控板平移 / 滚轮缩放 / 智能兼容模式 (`smart`, `zoom`, `pan`)；
 * 2. 鼠标左键拖拽平移；
 * 3. 移动端双指捏合缩放 (Pinch-to-zoom) 与单指平移；
 * 4. 键盘方向键 (WASD / 箭头) 平移与快捷键 (+ / - / [ / ]) 逐级缩放。
 */
function initInputControls() {
    const slider = document.getElementById('map-container');
    if (!slider) return;
    const zoomToPoint = (targetScale, clientX, clientY) => {
        if (targetScale < 0.5) targetScale = 0.5;
        if (targetScale > 3.0) targetScale = 3.0;
        const rect = slider.getBoundingClientRect();
        const centerX = (clientX !== undefined) ? (clientX - rect.left) : (rect.width / 2);
        const centerY = (clientY !== undefined) ? (clientY - rect.top) : (rect.height / 2);
        const mapX = (centerX - currentX) / currentScale;
        const mapY = (centerY - currentY) / currentScale;
        currentScale = targetScale;
        currentX = centerX - (mapX * currentScale);
        currentY = centerY - (mapY * currentScale);
        if (typeof enforceBoundaries === 'function') enforceBoundaries();
        if (typeof updateMapTransform === 'function') updateMapTransform();
        const mzSlider = document.getElementById('mz-slider');
        if (mzSlider) mzSlider.value = currentScale;
        const zoomVal = document.getElementById('zoom-val');
        if (zoomVal) zoomVal.innerText = Math.round(currentScale * 100) + '%';
    };
    const panMap = (deltaX, deltaY) => {
        currentX += deltaX;
        currentY += deltaY;
        if (typeof enforceBoundaries === 'function') enforceBoundaries();
        if (typeof updateMapTransform === 'function') updateMapTransform();
    };
    slider.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
            const zoomStep = -e.deltaY * 0.01;
            zoomToPoint(currentScale + zoomStep, e.clientX, e.clientY);
            return;
        }
        const wheelMode = localStorage.getItem('nal_pref_wheel_mode') || 'smart';
        const doPan = () => {
            panMap(-e.deltaX * 1.5, -e.deltaY * 1.5);
        };
        const doZoom = () => {
            const zoomStep = -e.deltaY * 0.001 * 1.2;
            const safeStep = Math.max(Math.min(zoomStep, 0.25), -0.25);
            zoomToPoint(currentScale + safeStep, e.clientX, e.clientY);
        };
        if (wheelMode === 'zoom') {
            doZoom();
            return;
        }
        if (wheelMode === 'pan') {
            doPan();
            return;
        }
        if (wheelMode === 'smart') {
            const isTouchpad = (() => {
                if (Math.abs(e.deltaX) > 0) return true;
                if (e.deltaMode === 1) return false;
                if (e.wheelDelta !== undefined) {
                    if (Math.abs(e.wheelDelta) % 120 === 0) return false;
                    if (Math.abs(e.wheelDelta) < 100) return true;
                }
                return Math.abs(e.deltaY) < 40;
            })();

            if (isTouchpad) {
                doPan();
            } else {
                doZoom();
            }
        }
    }, { passive: false });
    let isDragging = false;
    let startDragX, startDragY;
    let startMapX, startMapY;
    slider.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (typeof hideLineTooltipNow === 'function') hideLineTooltipNow();
        mapContent.classList.remove('animate-zoom');
        isDragging = true;
        isMapDragging = false;
        startDragX = e.clientX;
        startDragY = e.clientY;
        startMapX = currentX;
        startMapY = currentY;
        slider.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaX = e.clientX - startDragX;
        const deltaY = e.clientY - startDragY;
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            isMapDragging = true;
        }
        currentX = startMapX + deltaX;
        currentY = startMapY + deltaY;
        if (typeof enforceBoundaries === 'function') enforceBoundaries();
        if (typeof updateMapTransform === 'function') updateMapTransform();
    });
    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            slider.style.cursor = 'grab';
            setTimeout(() => { isMapDragging = false; }, 50);
        }
    });
    let initialPinchDist = 0;
    let initialScale = 1;
    let isPinching = false;
    slider.addEventListener('touchstart', (e) => {
        if (typeof hideLineTooltipNow === 'function') hideLineTooltipNow();
        mapContent.classList.remove('animate-zoom');
        if (e.touches.length === 2) {
            isPinching = true;
            isDragging = false;
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            initialPinchDist = Math.hypot(dx, dy);
            initialScale = currentScale;
        }
        else if (e.touches.length === 1) {
            isPinching = false;
            isDragging = true;
            isMapDragging = false;
            startDragX = e.touches[0].clientX;
            startDragY = e.touches[0].clientY;
            startMapX = currentX;
            startMapY = currentY;
        }
    }, { passive: false });
    slider.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isPinching && e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            const dist = Math.hypot(dx, dy);
            if (initialPinchDist > 0) {
                const scaleFactor = dist / initialPinchDist;
                const newScale = initialScale * scaleFactor;
                const centerX = (t1.clientX + t2.clientX) / 2;
                const centerY = (t1.clientY + t2.clientY) / 2;
                zoomToPoint(newScale, centerX, centerY);
            }
        }
        else if (isDragging && e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - startDragX;
            const deltaY = e.touches[0].clientY - startDragY;
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                isMapDragging = true;
            }
            currentX = startMapX + deltaX;
            currentY = startMapY + deltaY;
            if (typeof enforceBoundaries === 'function') enforceBoundaries();
            if (typeof updateMapTransform === 'function') updateMapTransform();
        }
    }, { passive: false });
    slider.addEventListener('touchend', (e) => {
        if (isPinching && e.touches.length < 2) {
            isPinching = false;
        }
        if (e.touches.length === 0) {
            isDragging = false;
            setTimeout(() => { isMapDragging = false; }, 50);
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const panStep = 50;
        const zoomStep = 0.2;
        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': panMap(0, panStep); break;
            case 'ArrowDown': case 's': case 'S': panMap(0, -panStep); break;
            case 'ArrowLeft': case 'a': case 'A': panMap(panStep, 0); break;
            case 'ArrowRight': case 'd': case 'D': panMap(-panStep, 0); break;
            // 放大
            case '+': case '=': case ']': case '】':
                zoomToPoint(currentScale + zoomStep);
                break;
            // 缩小
            case '-': case '_': case '[': case '【':
                zoomToPoint(currentScale - zoomStep);
                break;
        }
    });
}

initContextMenu();
init();

/**
 * 屏幕断点与响应式布局适配调度器 (Responsive Layout Adapter)
 * 作用：在移动端 (<=640px) 与桌面端 (>640px) 之间自动迁移与同步选中的车站面板状态
 */
(function () {
    let lastWidth = window.innerWidth;
    let resizeTimer = null;
    const BREAKPOINT = 640;
    function handleResponsiveSwitch() {
        const currentWidth = window.innerWidth;
        const wasMobile = lastWidth <= BREAKPOINT;
        const isMobile = currentWidth <= BREAKPOINT;

        if (wasMobile === isMobile) {
            if (typeof enforceBoundaries === 'function') enforceBoundaries();
            if (typeof updateMapTransform === 'function') updateMapTransform();
            lastWidth = currentWidth;
            return;
        }

        const activeStationId = (typeof lastSelectedStationId !== 'undefined') ? lastSelectedStationId : null;
        const domNode = activeStationId ? document.getElementById('node_' + activeStationId) : null;
        const isActuallyActive = activeStationId && domNode && domNode.classList.contains('active');
        const activeStation = isActuallyActive && processedStations ? processedStations[activeStationId] : null;

        const userWantsPin = localStorage.getItem('nal_legend_pinned') === 'true';
        const overlay = document.getElementById('legend-overlay');
        const infoPanel = document.getElementById('info-panel');
        const pinBtn = document.getElementById('legend-pin-btn');

        if (isMobile) {
            document.body.classList.remove('legend-pinned');
            document.body.classList.remove('pinned-hidden');
            document.body.classList.remove('mobile-panel-expanded');
            if (overlay) overlay.style.display = 'none';
            if (pinBtn) pinBtn.style.display = 'none';
            renderLegend(); // Correctly calls renderDefaultLegend via renderLegend check

            if (infoPanel && infoPanel.parentElement !== document.body) {
                document.body.appendChild(infoPanel);
            }
            if (activeStation) {
                renderUserModePanel(activeStation);
                infoPanel.style.display = 'flex';
                document.body.classList.add('mobile-split-active');
                setTimeout(() => {
                    const viewportH = window.innerHeight;
                    const targetVisualY = viewportH * 0.2; // Updated to match our 40/60 split preference
                    const targetVisualX = window.innerWidth / 2;
                    if (typeof currentScale !== 'undefined') {
                        currentX = targetVisualX - (activeStation.x * currentScale);
                        currentY = targetVisualY - (activeStation.y * currentScale);
                        if (typeof updateMapTransform === 'function') updateMapTransform();
                    }
                }, 50);
            } else {
                if (infoPanel) infoPanel.style.display = 'none';
            }
        } else {
            document.body.classList.remove('mobile-split-active');
            document.body.classList.remove('mobile-panel-expanded');
            if (pinBtn) pinBtn.style.display = '';

            if (userWantsPin) {
                document.body.classList.add('legend-pinned');
                document.body.classList.remove('pinned-hidden'); // No auto-hide
                if (overlay) overlay.style.display = 'block';
                renderLegend(); // Correctly calls renderPinModeTree

                const container = document.getElementById('legend-content');
                if (container && !document.getElementById('sidebar-dynamic-content')) {
                    const dynamicDiv = document.createElement('div');
                    dynamicDiv.id = 'sidebar-dynamic-content';
                    container.appendChild(dynamicDiv);
                }

                if (activeStation) {
                    renderUserModePanel(activeStation);
                    if (typeof dockStationPanel === 'function') dockStationPanel(activeStation);
                } else {
                    const fixedSections = document.querySelectorAll('.panel-section:not(.station-history-section)');
                    fixedSections.forEach(sec => sec.classList.remove('collapsed'));
                    if (infoPanel && infoPanel.parentElement === document.body) {
                        infoPanel.style.display = 'none';
                    }
                }
            } else {
                document.body.classList.remove('legend-pinned');
                document.body.classList.remove('pinned-hidden');
                if (overlay) overlay.style.display = 'none';
                renderLegend();

                if (activeStation) {
                    renderUserModePanel(activeStation);
                    if (infoPanel) {
                        if (infoPanel.parentElement !== document.body) document.body.appendChild(infoPanel);
                        infoPanel.style.display = 'flex';
                        infoPanel.style.opacity = '1';
                        const pW = 360;
                        const pH = infoPanel.offsetHeight || 400;
                        infoPanel.style.left = Math.max(20, (currentWidth / 2 - pW / 2)) + 'px';
                        infoPanel.style.top = Math.max(20, (window.innerHeight / 2 - pH / 2)) + 'px';
                        currentX = (currentWidth / 2) - (activeStation.x * currentScale);
                        currentY = (window.innerHeight / 2) - (activeStation.y * currentScale);
                        if (typeof updateMapTransform === 'function') updateMapTransform();
                    }
                } else {
                    if (infoPanel) infoPanel.style.display = 'none';
                }
            }
        }
        document.body.style.overflow = '';
        if (typeof enforceBoundaries === 'function') enforceBoundaries();
        lastWidth = currentWidth;
    }
    window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResponsiveSwitch, 150);
    });

    // CGoUI 升级：将模块化后的核心函数与变量挂载到全局 window 作用域，确保行内 HTML onclick 事件和跨文件交互正常
    window.selectStation = selectStation;
    window.resetMapState = resetMapState;
    window.triggerUpdateZoom = triggerUpdateZoom;
    window.centerMap = centerMap;
    window.highlightLine = highlightLine;
    window.clearHighlights = clearHighlights;
    window.hideLineTooltipNow = hideLineTooltipNow;
    window.applyTheme = applyTheme;
    window.processedStations = processedStations;
    window.linesData = linesData;
    window.enforceBoundaries = enforceBoundaries;
    window.updateMapTransform = updateMapTransform;
    window.stationsData = typeof stationsData !== 'undefined' ? stationsData : undefined;

    // 共享 DOM 常量挂载
    window.mapContainer = mapContainer;
    window.mapContent = mapContent;
    window.svgLayer = svgLayer;
    window.stationsLayer = stationsLayer;
    window.labelsLayer = labelsLayer;
    window.infoPanel = infoPanel;
    window.lineTooltip = lineTooltip;
    window.lineTooltipImg = lineTooltipImg;

    // 共享动态缩放位移变量的双向绑定
    Object.defineProperty(window, 'currentScale', {
        get() { return currentScale; },
        set(val) { currentScale = val; },
        configurable: true
    });
    Object.defineProperty(window, 'currentX', {
        get() { return currentX; },
        set(val) { currentX = val; },
        configurable: true
    });
    Object.defineProperty(window, 'currentY', {
        get() { return currentY; },
        set(val) { currentY = val; },
        configurable: true
    });
    Object.defineProperty(window, 'isMapDragging', {
        get() { return isMapDragging; },
        set(val) { isMapDragging = val; },
        configurable: true
    });
    Object.defineProperty(window, 'tooltipTimer', {
        get() { return tooltipTimer; },
        set(val) { tooltipTimer = val; },
        configurable: true
    });
})();

