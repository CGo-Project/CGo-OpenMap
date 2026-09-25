/**
 * CGo OpenMap - 车站地图卡片共享引擎
 *
 * ⚠️ 临时共享位置
 * 本文件与 timetable-renderer.js 目前放在 city/shenyang/shared/ 下，供沈阳、大连、
 * 长春三城共用。计划在开发团队确认共享位置后迁入 core/，届时只需 git mv 并改
 * 3 处 stacard import 路径，零逻辑改动。
 * 迁移步骤见 docs/STACARD_TIMETABLE_UNIFICATION.md 第 4.4 节。
 *
 * 加载方式：ES module。由各城 stacard/script.js 相对 import（该文件已由 main.html
 * 以 type="module" 注入），无需改动 main.html。
 *
 * 职责边界
 * - 本引擎负责：坐标装载与索引、坐标查找链、占位 HTML、瓦片网格渲染、缩放交互、
 *   ResizeObserver 生命周期、面板扫描。
 * - 城市侧负责：图源与缩放区间、索引开关、hasCard 松紧、占位变体、署名。
 */

const TILE_SIZE = 256;

/** 统一字段名：各城原先各用 _xxxStaCardResizeObserver，现收敛为一个 */
const OBSERVER_FIELD = "_cgoStaCardResizeObserver";

const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * 高德栅格瓦片地址
 * 三城原先各自复制了一份完全相同的实现（webrd0 子域 + style=8），此处收敛。
 */
function getTileUrl(x, y, z) {
    const server = (x + y) % 4 + 1;
    return `https://webrd0${server}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${x}&y=${y}&z=${z}`;
}

/** Web Mercator 经纬度 → 像素坐标 */
function lngLatToPoint(lng, lat, zoom) {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const x = (lng + 180) / 360 * scale;
    const sinLat = Math.sin(lat * Math.PI / 180);
    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
    return { x, y };
}

/**
 * 创建某城市的车站卡片渲染器
 *
 * @param {object} config
 * @param {string} config.cityName      - 城市名，仅用于错误提示
 * @param {string} config.geoDataUrl    - amap_data.json 路径
 * @param {object} [config.index]       - 索引开关
 * @param {boolean} [config.index.byId=true]        - 是否按站点 ID 建索引
 * @param {boolean} [config.index.stripSuffix=false]- 是否额外索引「去掉尾部站」的站名
 * @param {boolean} [config.index.byPoiid=false]    - 是否按高德 poiid 建索引
 * @param {"strict"|"loose"} [config.hasCard="strict"]
 *        strict 需解析到坐标；loose 只要有站名即认为有卡片
 * @param {"always"|"onlyWithCoords"} [config.placeholder="always"]
 *        无坐标时占位 HTML 的处理：always 仍输出占位（渲染后显示空状态提示），
 *        onlyWithCoords 直接不输出
 * @param {{className:string, margin:string}|null} [config.crossPlatform=null]
 *        同台换乘置顶卡片的外观变体
 * @param {boolean} [config.attribution=false] - 是否在视窗内显示「高德地图」署名
 * @param {{default:number, min:number, max:number}} [config.zoom]
 * @param {{wheel:boolean, dblclick:boolean}} [config.interactions]
 * @returns {object} 渲染器实例（对外接口：init / hasCard / getCardPlaceholderHtml /
 *          renderPanelCards，与 core 的四个钩子对应）
 */
export function createStaCard(config = {}) {
    const cityName = config.cityName || "";
    const index = Object.assign({ byId: true, stripSuffix: false, byPoiid: false }, config.index || {});
    const hasCardMode = config.hasCard || "strict";
    const placeholderMode = config.placeholder || "always";
    const crossPlatform = config.crossPlatform || null;
    const attribution = Boolean(config.attribution);
    const zoomRange = Object.assign({ default: 15, min: 12, max: 18 }, config.zoom || {});
    const interactions = Object.assign({ wheel: true, dblclick: true }, config.interactions || {});

    return {
        initialized: false,
        initPromise: null,
        stationsData: {},
        stationsById: {},
        stationsByLine: {},
        geoDataUrl: config.geoDataUrl,

        async init(options = {}) {
            if (this.initialized) return this;
            if (this.initPromise) return this.initPromise;
            if (options.geoDataUrl) this.geoDataUrl = options.geoDataUrl;

            this.initPromise = this.loadData()
                .then(() => {
                    this.initialized = true;
                    return this;
                })
                .catch((error) => {
                    this.initPromise = null;
                    throw error;
                });
            return this.initPromise;
        },

        async loadData() {
            const response = await fetch(this.geoDataUrl);
            if (!response.ok) {
                throw new Error(`无法加载${cityName}车站坐标数据: ${response.status}`);
            }
            const geoData = await response.json();
            const byName = {};
            const byId = {};
            const byLine = {};

            for (const group of geoData?.l || []) {
                // 分组可用 lines 声明自己属于哪些线路，用于「线路 + 站名」精确命中同名站
                const groupLines = Array.isArray(group?.lines) ? group.lines : [];
                for (const station of group?.st || []) {
                    const coordinates = this.parseCoordinates(station.sl);
                    if (!coordinates) continue;

                    const entry = {
                        id: String(station.id || ""),
                        name: String(station.n || ""),
                        lng: coordinates.lng,
                        lat: coordinates.lat
                    };
                    const shortName = entry.name ? entry.name.replace(/站$/, "") : "";

                    if (entry.name) {
                        // 扁平表：同名站后写覆盖。core 的 STATION_GEO_MAP 也是同一语义，
                        // 因此希望被 LBS（最近车站）采用的分组应写在 amap_data.json 靠后位置
                        byName[entry.name] = entry;
                        if (index.stripSuffix) byName[shortName] = entry;
                    }
                    if (index.byId && entry.id) byId[entry.id] = entry;
                    if (index.byPoiid && station.poiid) byId[String(station.poiid)] = entry;

                    if (entry.name) {
                        for (const lineId of groupLines) {
                            const scoped = byLine[lineId] || (byLine[lineId] = {});
                            scoped[entry.name] = entry;
                            if (index.stripSuffix) scoped[shortName] = entry;
                        }
                    }
                }
            }

            this.stationsData = byName;
            this.stationsById = byId;
            this.stationsByLine = byLine;
        },

        /** 解析 "lng,lat"；同时兼容数组形式，并排除 0,0 这一无效哨兵 */
        parseCoordinates(value) {
            const values = Array.isArray(value) ? value : String(value ?? "").split(",");
            if (values.length < 2) return null;
            const lng = Number(values[0]);
            const lat = Number(values[1]);
            if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng === 0 || lat === 0) return null;
            return { lng, lat };
        },

        /**
         * 坐标查找链
         *
         * 1. station 自带坐标（lng/lat、longitude/latitude、coordinates 数组）
         * 2. 线路 + 站名（同名站精确命中）
         * 3. 站名 → 4. 去掉尾部「站」的站名 → 5. 站点 ID / poiid
         *
         * 原先三城各写一条不同顺序的链（大连那条还会丢掉 ID 回退），此处收敛。
         * 注：旧实现里查 window.STATION_GEO_MAP 的分支恒不成立（core 从未把它挂到
         * window），已删除，不再搬进共享层。
         */
        getStation(stationId, stationInfo = {}, lineId = "") {
            const stationName = stationInfo.cn || stationInfo.name || stationInfo.stationName || "";
            const candidates = [stationName];
            if (stationName && index.stripSuffix) candidates.push(stationName.replace(/站$/, ""));
            candidates.push(String(stationId || ""));

            // 线路作用域优先：有轨与地铁同名时，各自命中自己分组里的坐标
            const scoped = lineId ? this.stationsByLine[String(lineId)] : null;
            if (scoped) {
                for (const key of candidates) {
                    if (key && scoped[key]) return scoped[key];
                }
            }

            for (const key of candidates) {
                if (key && this.stationsData[key]) return this.stationsData[key];
            }
            const id = String(stationId || "");
            if (id && this.stationsById[id]) return this.stationsById[id];
            return null;
        },

        getStationCoords(station, lineId = "") {
            if (!station) return null;

            const direct = this.parseCoordinates(
                Array.isArray(station.coordinates)
                    ? station.coordinates
                    : station.lng != null && station.lat != null
                        ? [station.lng, station.lat]
                        : station.longitude != null && station.latitude != null
                            ? [station.longitude, station.latitude]
                            : null
            );
            if (direct) return [direct.lng, direct.lat];

            const matched = this.getStation(
                station.id || station.stationId || "",
                { cn: station.cn || station.name || station.stationName || "" },
                lineId
            );
            return matched ? [matched.lng, matched.lat] : null;
        },

        /** 解析本次调用应使用的车站对象：优先显式传入，其次全局站点表，最后退化为 ID */
        resolveStation(stationId, stationInfo) {
            if (stationInfo?.cn || stationInfo?.name) return stationInfo;
            const fromData = typeof stationsData !== "undefined" ? stationsData[stationId] : null;
            return fromData || { id: stationId };
        },

        hasCard(stationId, lineId, stationInfo) {
            const station = this.resolveStation(stationId, stationInfo);
            if (hasCardMode === "loose") {
                return Boolean(this.getStationCoords(station, lineId) || station?.cn || station?.name);
            }
            return Boolean(this.getStationCoords(station, lineId));
        },

        getCardPlaceholderHtml(station, lineInfo = {}, isCrossPlatform = false) {
            if (placeholderMode === "onlyWithCoords" && !this.hasCard(station?.id, lineInfo?.id, station)) {
                return "";
            }

            const stationId = station?.id || "";
            const stationName = station?.cn || station?.name || "";
            const lineId = lineInfo?.id || "";
            const lineColor = lineInfo?.lineColor || lineInfo?.color || "var(--primary-color)";
            const coordinates = this.getStationCoords(station, lineInfo?.id || "");

            const useHoisted = Boolean(isCrossPlatform && crossPlatform);
            const extraClass = useHoisted ? ` ${crossPlatform.className}` : "";
            const margin = useHoisted ? crossPlatform.margin : "8px 0 14px 0";

            return `
            <div class="stacard-container stacard-minimap-box${extraClass}"
                data-card-type="map"
                data-sid="${escapeHtml(stationId)}"
                data-sname="${escapeHtml(stationName)}"
                data-lid="${escapeHtml(lineId)}"
                data-color="${escapeHtml(lineColor)}"
                data-coords="${escapeHtml(coordinates ? coordinates.join(",") : "")}"
                style="margin:${margin};">
                <div class="stacard-loading-tip"><span>正在加载车站地图...</span></div>
            </div>
        `;
        },

        async renderCard(container, context = {}) {
            if (!container) return;

            const station = context.station || (context.cn || context.name ? context : {
                id: context.stationId || container.dataset.sid || "",
                cn: context.stationName || container.dataset.sname || ""
            });
            const stationName = station.cn || station.name || container.dataset.sname || "";
            const lineColor = context.color || container.dataset.color || "var(--primary-color)";
            // 线路标识来自调用方或占位卡片的 data-lid，用于同名站按线路精确取坐标
            const lineId = context.lineId || container.dataset.lid || "";

            await this.init();
            this.destroyResizeObserver(container);

            let coordinates = this.getStationCoords(station, lineId);
            if (!coordinates && container.dataset.coords) {
                const parsed = this.parseCoordinates(container.dataset.coords);
                if (parsed) coordinates = [parsed.lng, parsed.lat];
            }
            if (!coordinates) {
                container.innerHTML = '<div class="stacard-empty-box"><span>暂无该站点地理坐标数据</span></div>';
                return;
            }

            const [centerLng, centerLat] = coordinates;
            let currentZoom = zoomRange.default;

            container.innerHTML = `
            <div class="stacard-minimap-viewport" tabindex="0" aria-label="${escapeHtml(stationName)}周边地图">
                <div class="stacard-tiles-wrapper"></div>
                <div class="stacard-pin-marker" style="--marker-color:${escapeHtml(lineColor)};">
                    <div class="stacard-pin-pulse"></div>
                    <div class="stacard-pin-dot"></div>
                    <div class="stacard-pin-label">${escapeHtml(stationName)}</div>
                </div>
                <div class="stacard-controls">
                    <button type="button" class="stacard-ctrl-btn zoom-in" aria-label="放大地图" title="放大地图">+</button>
                    <button type="button" class="stacard-ctrl-btn zoom-out" aria-label="缩小地图" title="缩小地图">−</button>
                </div>
                ${attribution ? '<span class="stacard-map-attribution">高德地图</span>' : ""}
            </div>
        `;

            const viewport = container.querySelector(".stacard-minimap-viewport");
            const tilesElement = container.querySelector(".stacard-tiles-wrapper");

            const renderMap = () => {
                const width = viewport.clientWidth;
                const height = viewport.clientHeight;
                if (!width || !height) return;

                const centerPoint = lngLatToPoint(centerLng, centerLat, currentZoom);
                const startTileX = Math.floor((centerPoint.x - width / 2) / TILE_SIZE);
                const endTileX = Math.floor((centerPoint.x + width / 2) / TILE_SIZE);
                const startTileY = Math.floor((centerPoint.y - height / 2) / TILE_SIZE);
                const endTileY = Math.floor((centerPoint.y + height / 2) / TILE_SIZE);
                const maxTile = Math.pow(2, currentZoom);

                tilesElement.replaceChildren();
                for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
                    if (tileY < 0 || tileY >= maxTile) continue;
                    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
                        const wrappedTileX = ((tileX % maxTile) + maxTile) % maxTile;
                        const tile = document.createElement("img");
                        tile.className = "stacard-tile-img";
                        tile.src = getTileUrl(wrappedTileX, tileY, currentZoom);
                        tile.alt = "";
                        tile.draggable = false;
                        tile.onerror = () => { tile.style.opacity = "0"; };
                        tile.style.left = `${tileX * TILE_SIZE - centerPoint.x + width / 2}px`;
                        tile.style.top = `${tileY * TILE_SIZE - centerPoint.y + height / 2}px`;
                        tilesElement.appendChild(tile);
                    }
                }
            };

            const changeZoom = (delta) => {
                const nextZoom = Math.max(zoomRange.min, Math.min(zoomRange.max, currentZoom + delta));
                if (nextZoom === currentZoom) return;
                currentZoom = nextZoom;
                renderMap();
            };

            container.querySelector(".zoom-in")?.addEventListener("click", () => changeZoom(1));
            container.querySelector(".zoom-out")?.addEventListener("click", () => changeZoom(-1));
            if (interactions.wheel) {
                viewport.addEventListener("wheel", (event) => {
                    event.preventDefault();
                    changeZoom(event.deltaY < 0 ? 1 : -1);
                }, { passive: false });
            }
            if (interactions.dblclick) {
                viewport.addEventListener("dblclick", (event) => {
                    event.preventDefault();
                    changeZoom(1);
                });
            }

            if (typeof ResizeObserver !== "undefined") {
                const resizeObserver = new ResizeObserver(renderMap);
                resizeObserver.observe(viewport);
                container[OBSERVER_FIELD] = resizeObserver;
            }
            renderMap();
        },

        /** 渲染前必须调用：避免同一容器重复渲染时旧 observer 失去引用而泄漏 */
        destroyResizeObserver(container) {
            container?.[OBSERVER_FIELD]?.disconnect();
            if (container) delete container[OBSERVER_FIELD];
        },

        async renderPanelCards(panel, stationInfo) {
            const containers = panel?.querySelectorAll(".stacard-container") || [];
            await Promise.all([...containers].map((container) => this.renderCard(container, {
                station: stationInfo,
                color: container.dataset.color
            })));
        }
    };
}
