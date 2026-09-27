/**
 * CGo OpenMap - 车站卡片系统与展示引擎 (city/beijing/stacard/script.js)
 * 
 * ==============================================================================
 * ️ StaCard 系统架构与多模式展示规范 (StaCard API & Architecture)
 * ==============================================================================
 * 作用：在车站详情面板中提供多样化的高清微缩视窗。支持 4 种展示模式：
 * 
 * 【模式 A：车站立体结构渲染接口 (Structure Renderer)】
 *   若 station 对象包含 `structure: { type: '3d-layout' }`，引擎会调用已注册的结构渲染器
 *   通过 `BeijingStaCard.registerStructureRenderer(type, fn)` 即可无缝接入自定义站台结构图。
 * 
 * 【模式 B：自定义富文本 HTML 展示 (Custom HTML)】
 *   若 station 对象包含 `cardHtml` 或 `customHtml`，直接嵌入渲染自定义 HTML。
 * 
 * 【模式 C：实景照片/示意图片展示 (Custom Image)】
 *   若 station 对象包含 `cardImg` 或 `image`，自动生成图片自适应卡片。
 * 
 * 【模式 D：高德切片微缩地图视窗 (Amap Slippy Minimap)】
 *   默认根据车站名称从 `amap_data.json` 检索真实地理经纬度，
 *   使用 Web 墨卡托投影算法即时渲染高德全要素矢量切片，支持多级原地缩放。
 * 
 * ️ 移植指南 (Porting Guide):
 * 1. 移植新城市时，只需替换 `geoDataUrl` 为该城市的 `amap_data.json`；
 * 2. 如需扩展车站结构图，使用 `registerStructureRenderer` 注册渲染函数。
 * ==============================================================================
 */

// ==========================================
// 1. Web 墨卡托投影算法工具 (EPSG:3857)
// ==========================================
export const Mercator = {
    /**
     * WGS84/GCJ02 经纬度转世界像素坐标 (256px 标准瓦片)
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @param {number} zoom - 缩放等级 (13 ~ 18)
     * @returns {{x: number, y: number}} 世界像素坐标
     */
    lngLatToPoint(lng, lat, zoom) {
        const size = 256 * Math.pow(2, zoom);
        const d = size / 2;
        const bc = size / 360;
        const cc = size / (2 * Math.PI);
        const f = Math.min(Math.max(Math.sin((Math.PI / 180) * lat), -0.9999), 0.9999);
        const x = d + lng * bc;
        const y = d + 0.5 * Math.log((1 + f) / (1 - f)) * -cc;
        return { x, y };
    },

    /**
     * 世界像素坐标转回经纬度
     * @param {number} x - 世界X坐标
     * @param {number} y - 世界Y坐标
     * @param {number} zoom - 缩放等级
     * @returns {{lng: number, lat: number}} 经纬度对象
     */
    pointToLngLat(x, y, zoom) {
        const size = 256 * Math.pow(2, zoom);
        const d = size / 2;
        const bc = size / 360;
        const cc = size / (2 * Math.PI);
        const lng = (x - d) / bc;
        const g = (y - d) / -cc;
        const lat = (2 * Math.atan(Math.exp(g)) - Math.PI / 2) * (180 / Math.PI);
        return { lng, lat };
    }
};

// ==========================================
// 2. 高德瓦片切片管理 (AMap Slippy Tiles)
// ==========================================
export const AMapTile = {
    /**
     * 获取高德地图切片 URL
     * style 8: 高德全要素街道与公共交通地图（含地铁线路名称、站点图标、换乘标识、出入口A/B/C/D、火车站等）
     * style 7: 基础道路几何地图
     */
    getTileUrl(x, y, z, style = 8) {
        const hostIndex = (Math.abs(x + y) % 4) + 1;
        return `https://wprd0${hostIndex}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=${style}&x=${x}&y=${y}&z=${z}`;
    }
};

// ==========================================
// 3. BeijingStaCard 核心实现
// ==========================================
export const BeijingStaCard = {
    name: "BeijingStaCard",
    basePath: "./city/lanzhou/stacard/",
    geoDataUrl: "./city/lanzhou/amap_data.json",
    geoMapByName: {},
    geoMapById: {},
    isInitialized: false,
    initPromise: null,
    defaultZoom: 16,
    minZoom: 13,
    maxZoom: 18,

    /**
     * 初始化 StaCard 系统，加载并索引 amap 坐标数据
     */
    async init(options = {}) {
        if (this.isInitialized) return this;
        if (this.initPromise) return this.initPromise;

        if (options.basePath) this.basePath = options.basePath;
        if (options.geoDataUrl) this.geoDataUrl = options.geoDataUrl;

        this.initPromise = (async () => {
            try {
                // 1. 尝试从传入选项、全局数据或本地文件加载
                let data = options.data || null;
                if (!data && typeof window !== 'undefined' && window.BEIJING_AMAP_DATA) {
                    data = window.BEIJING_AMAP_DATA;
                } else if (!data && typeof globalThis !== 'undefined' && globalThis.BEIJING_AMAP_DATA) {
                    data = globalThis.BEIJING_AMAP_DATA;
                } else if (!data && this.geoDataUrl && typeof fetch === 'function') {
                    try {
                        const res = await fetch(this.geoDataUrl);
                        if (res.ok) {
                            data = await res.json();
                            if (typeof window !== 'undefined') {
                                window.BEIJING_AMAP_DATA = data;
                            }
                        }
                    } catch (fetchErr) {
                        // 浏览器环境下通常正常，非浏览器环境如果报错则继续向下 fallback
                        console.warn("[BeijingStaCard] fetch 坐标文件提示:", fetchErr.message);
                    }
                }

                // 2. 建立站名与 ID 的双向坐标字典
                if (data && Array.isArray(data.l)) {
                    data.l.forEach(line => {
                        if (!line.st || !Array.isArray(line.st)) return;
                        line.st.forEach(sta => {
                            if (!sta.sl) return;
                            const coords = sta.sl.split(',').map(Number);
                            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                                const pt = [coords[0], coords[1]];
                                if (sta.n) {
                                    this.geoMapByName[sta.n] = pt;
                                    // 别名/去后缀索引
                                    const cleanName = sta.n.replace(/(火车站|站)$/, '');
                                    if (cleanName && !this.geoMapByName[cleanName]) {
                                        this.geoMapByName[cleanName] = pt;
                                    }
                                }
                                if (sta.sid) this.geoMapById[sta.sid] = pt;
                                if (sta.si) this.geoMapById[sta.si] = pt;
                                if (sta.poiid) this.geoMapById[sta.poiid] = pt;
                            }
                        });
                    });
                }

                this.isInitialized = true;
                const pointCount = Object.keys(this.geoMapByName).length;
                console.log(`[BeijingStaCard] 高德切片地图卡片模块加载成功，共索引 ${pointCount} 个车站坐标。`);
            } catch (err) {
                console.warn("[BeijingStaCard] 地理坐标数据索引加载异常:", err);
                this.isInitialized = true;
            }
            return this;
        })();

        return this.initPromise;
    },

    /**
     * 获取指定车站的经纬度坐标 [lng, lat]
     */
    getStationCoords(station) {
        if (!station) return null;

        // 1. 如果 station 本身含有 lng, lat
        if (typeof station.lng === 'number' && typeof station.lat === 'number') {
            return [station.lng, station.lat];
        }
        if (typeof station.longitude === 'number' && typeof station.latitude === 'number') {
            return [station.longitude, station.latitude];
        }

        const sid = station.id || '';
        const name = (station.cn || station.name || '').trim();

        // 2. 查本模块维护的索引表
        if (sid && this.geoMapById[sid]) return this.geoMapById[sid];
        if (name && this.geoMapByName[name]) return this.geoMapByName[name];

        const cleanName = name.replace(/(火车站|站)$/, '');
        if (cleanName && this.geoMapByName[cleanName]) return this.geoMapByName[cleanName];

        // 3. 查全局 STATION_GEO_MAP (由 core/script.js 加载)
        if (typeof STATION_GEO_MAP !== 'undefined') {
            if (name && STATION_GEO_MAP[name]) return STATION_GEO_MAP[name];
            if (cleanName && STATION_GEO_MAP[cleanName]) return STATION_GEO_MAP[cleanName];
            if (STATION_GEO_MAP[`${name}站`]) return STATION_GEO_MAP[`${name}站`];
        }

        return null;
    },

    /**
     * 自定义车站结构渲染器注册表
     */
    structureRenderers: {},

    /**
     * 注册车站结构显示渲染器 (提供开放的车站结构显示扩展接口)
     * @param {string} type 结构类型标识 (如 'svg-structure', '3d-model', 'cross-section')
     * @param {Function} renderer 渲染函数 (container, context) => Promise<void> | void
     */
    registerStructureRenderer(type, renderer) {
        if (typeof renderer === 'function') {
            this.structureRenderers[type] = renderer;
            console.log(`[BeijingStaCard] 注册车站结构渲染器: ${type}`);
        }
    },

    /**
     * 判断车站是否可展示卡片内容 (支持地图切片、自定义图片/HTML、或车站结构接口)
     */
    hasCard(stationId, lineId, stationInfo) {
        const sid = stationId || stationInfo?.id;
        const stationObj = stationInfo || (typeof stationsData !== 'undefined' ? stationsData[sid] : { id: sid });
        if (!stationObj) return false;

        // 1. 检查是否具备自定义内容或车站结构配置
        if (stationObj.structure || stationObj.cardHtml || stationObj.customHtml || stationObj.cardImg || stationObj.image) {
            return true;
        }

        // 2. 检查是否具备可识别的 amap 地理坐标
        const coords = this.getStationCoords(stationObj);
        return Boolean(coords);
    },

    /**
     * 生成卡片容器的占位 HTML
     */
    getCardPlaceholderHtml(station, lineInfo = {}, isCrossPlatform = false) {
        const lineId = lineInfo?.id || '';
        const lineColor = lineInfo?.lineColor || lineInfo?.color || 'var(--primary-color)';
        const stationName = station.cn || station.name || '';
        const sid = station.id || '';

        const extraClass = isCrossPlatform ? 'hoisted-stacard' : '';
        const extraStyle = isCrossPlatform
            ? 'margin: 0 0 12px 0;'
            : 'margin: 8px 0 14px 0;';

        const coords = this.getStationCoords(station);
        const coordsAttr = coords ? `${coords[0]},${coords[1]}` : '';

        return `
            <div class="stacard-container stacard-minimap-box ${extraClass}"
                 data-sid="${sid}"
                 data-sname="${stationName}"
                 data-lid="${lineId}"
                 data-color="${lineColor}"
                 data-coords="${coordsAttr}"
                 style="${extraStyle}">
                <div class="stacard-loading-tip">
                    <svg class="stacard-spin" viewBox="0 0 24 24" width="16" height="16">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"/>
                    </svg>
                    <span>正在加载车站卡片...</span>
                </div>
            </div>
        `;
    },

    /**
     * 在指定 DOM 容器中渲染卡片内容 (支持自定义内容、车站结构接口或高德地图切片)
     * @param {HTMLElement} container 卡片容器元素
     * @param {Object} context 上下文信息
     */
    async renderCard(container, context = {}) {
        if (!container) return;
        if (!this.isInitialized) await this.init();

        try {
            const sid = context.stationId || container.dataset.sid || '';
            const stationName = context.stationName || container.dataset.sname || '';
            const lineColor = context.color || container.dataset.color || 'var(--primary-color)';
            const stationObj = context.station || (typeof stationsData !== 'undefined' ? stationsData[sid] : { id: sid, cn: stationName });

            // 模式 A: 车站结构显示接口 (Structure Renderer)
            if (stationObj && stationObj.structure) {
                const structType = stationObj.structure.type || 'default';
                const customRenderer = this.structureRenderers[structType];
                if (typeof customRenderer === 'function') {
                    await customRenderer(container, { station: stationObj, lineColor, context });
                    return;
                }
            }

            // 模式 B: 自定义 HTML 内容显示
            if (stationObj && (stationObj.cardHtml || stationObj.customHtml)) {
                container.innerHTML = stationObj.cardHtml || stationObj.customHtml;
                container.style.backgroundColor = 'transparent';
                return;
            }

            // 模式 C: 自定义图片/实景展示
            if (stationObj && (stationObj.cardImg || stationObj.image)) {
                const imgSrc = stationObj.cardImg || stationObj.image;
                container.innerHTML = `
                    <div style="width:100%; border-radius:8px; overflow:hidden;">
                        <img src="${imgSrc}" alt="${stationName}" style="width:100%; height:auto; display:block;" />
                    </div>
                `;
                return;
            }

            // 模式 D: 默认识别 amap 坐标并加载高德地图切片视窗
            let coords = null;
            if (context.coords && Array.isArray(context.coords)) {
                coords = context.coords;
            } else if (container.dataset.coords) {
                const parts = container.dataset.coords.split(',').map(Number);
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    coords = parts;
                }
            }

            if (!coords) {
                coords = this.getStationCoords(stationObj);
            }

            if (!coords) {
                container.innerHTML = `
                    <div class="stacard-empty-box">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                        </svg>
                        <span>暂无该站点地理坐标数据</span>
                    </div>
                `;
                return;
            }

            // 初始化切片微缩地图实例
            this.createMinimapInstance(container, {
                lng: coords[0],
                lat: coords[1],
                name: stationName,
                sid: sid,
                lineColor: lineColor
            });

        } catch (err) {
            console.error("[BeijingStaCard] 渲染车站卡片失败:", err);
            container.innerHTML = `
                <div class="stacard-empty-box" style="color:var(--text-light, #999);">
                    <span>卡片内容加载失败</span>
                </div>
            `;
        }
    },

    /**
     * 创建交互式切片微缩地图实例
     */
    createMinimapInstance(container, options) {
        const { lng, lat, name, lineColor } = options;
        let currentZoom = this.defaultZoom;
        let centerLng = lng;
        let centerLat = lat;

        // 构建视窗 DOM 结构
        container.innerHTML = `
            <div class="stacard-minimap-viewport" tabindex="0">
                <div class="stacard-tiles-wrapper"></div>
                
                <!-- 中心定位 Pin -->
                <div class="stacard-pin-marker" style="--marker-color: ${lineColor};">
                    <div class="stacard-pin-pulse"></div>
                    <div class="stacard-pin-dot"></div>
                    <div class="stacard-pin-label">${name}</div>
                </div>

                <!-- 缩放控制按钮 (不包含分享外链按钮) -->
                <div class="stacard-controls">
                    <button class="stacard-ctrl-btn zoom-in" title="放大地图">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </button>
                    <button class="stacard-ctrl-btn zoom-out" title="缩小地图">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>
                    </button>
                </div>
            </div>
        `;

        const viewport = container.querySelector('.stacard-minimap-viewport');
        const tilesWrapper = container.querySelector('.stacard-tiles-wrapper');
        const btnZoomIn = container.querySelector('.zoom-in');
        const btnZoomOut = container.querySelector('.zoom-out');

        /**
         * 渲染切片网格
         */
        const renderTiles = () => {
            if (!tilesWrapper || !viewport) return;
            const width = viewport.clientWidth || 300;
            const height = viewport.clientHeight || 150;

            const centerPt = Mercator.lngLatToPoint(centerLng, centerLat, currentZoom);
            const minX = centerPt.x - width / 2;
            const minY = centerPt.y - height / 2;
            const maxX = centerPt.x + width / 2;
            const maxY = centerPt.y + height / 2;

            const startTileX = Math.floor(minX / 256);
            const endTileX = Math.floor(maxX / 256);
            const startTileY = Math.floor(minY / 256);
            const endTileY = Math.floor(maxY / 256);

            tilesWrapper.innerHTML = '';

            for (let x = startTileX; x <= endTileX; x++) {
                for (let y = startTileY; y <= endTileY; y++) {
                    const img = document.createElement('img');
                    img.className = 'stacard-tile-img';
                    img.draggable = false;
                    img.src = AMapTile.getTileUrl(x, y, currentZoom, 8);
                    
                    const offsetX = x * 256 - minX;
                    const offsetY = y * 256 - minY;
                    img.style.left = `${offsetX}px`;
                    img.style.top = `${offsetY}px`;

                    img.onerror = () => {
                        img.style.opacity = '0';
                    };

                    tilesWrapper.appendChild(img);
                }
            }
        };

        // 初始渲染切片
        renderTiles();

        // 缩放事件绑定
        if (btnZoomIn) {
            btnZoomIn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentZoom < this.maxZoom) {
                    currentZoom++;
                    renderTiles();
                }
            });
        }
        if (btnZoomOut) {
            btnZoomOut.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentZoom > this.minZoom) {
                    currentZoom--;
                    renderTiles();
                }
            });
        }

        // 双击重置回默认缩放
        viewport.addEventListener('dblclick', (e) => {
            if (e.target.closest('.stacard-controls')) return;
            currentZoom = this.defaultZoom;
            renderTiles();
        });

        // 监听容器尺寸变化（例如切换 Tab 显示时自动补全渲染切片）
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                        renderTiles();
                    }
                }
            });
            ro.observe(viewport);
        }
    },

    /**
     * 批量渲染面板内部所有的卡片容器
     */
    async renderPanelCards(panelElement, station) {
        const containers = panelElement?.querySelectorAll('.stacard-container') || [];
        for (const container of containers) {
            await this.renderCard(container, { station });
        }
    }
};

window.BeijingStaCard = BeijingStaCard;
window.StaCard = BeijingStaCard;