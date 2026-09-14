/**
 * CGo OpenMap - 合肥车站卡片模块
 *
 * 读取高德坐标数据，在车站详情中渲染可缩放的周边地图。
 */

const AMapTile = {
    getTileUrl(x, y, z) {
        const server = (x + y) % 4 + 1;
        return `https://webrd0${server}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${x}&y=${y}&z=${z}`;
    }
};

const WebMercator = {
    TILE_SIZE: 256,
    lngLatToPoint(lng, lat, zoom) {
        const scale = this.TILE_SIZE * Math.pow(2, zoom);
        const x = (lng + 180) / 360 * scale;
        const sinLat = Math.sin(lat * Math.PI / 180);
        const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
        return { x, y };
    }
};

const HefeiStaCard = {
    initialized: false,
    initPromise: null,
    stationsData: {},
    geoDataUrl: "./city/hefei/amap_data.json",

    async init(options = {}) {
        if (this.initialized) return this;
        if (this.initPromise) return this.initPromise;

        if (options.geoDataUrl) {
            this.geoDataUrl = options.geoDataUrl;
        }

        this.initPromise = this.loadData(options)
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

    async loadData(options) {
        const geoDataUrl = options.geoDataUrl || this.geoDataUrl;
        const response = await fetch(geoDataUrl);
        if (!response.ok) {
            throw new Error(`无法加载合肥车站坐标数据: ${response.status}`);
        }

        const geoData = await response.json();
        const stationsData = {};

        for (const line of geoData?.l || []) {
            for (const station of line?.st || []) {
                const coordinates = this.parseCoordinates(station.sl);
                if (!coordinates) continue;

                const normalizedStation = {
                    id: String(station.id || ""),
                    name: station.n || "",
                    lng: coordinates.lng,
                    lat: coordinates.lat
                };

                if (normalizedStation.name) {
                    stationsData[normalizedStation.name] = normalizedStation;
                }
                if (normalizedStation.id) {
                    stationsData[normalizedStation.id] = normalizedStation;
                }
            }
        }

        this.stationsData = stationsData;
    },

    parseCoordinates(value) {
        if (typeof value !== "string") return null;

        const [lngRaw, latRaw] = value.split(",");
        const lng = Number(lngRaw);
        const lat = Number(latRaw);
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng === 0 || lat === 0) {
            return null;
        }

        return { lng, lat };
    },

    getStation(stationId, stationInfo = {}) {
        const stationName = stationInfo.cn || stationInfo.name || stationInfo.stationName || "";
        const globalGeo = window.STATION_GEO_MAP?.[stationName];

        if (Array.isArray(globalGeo) && globalGeo.length === 2) {
            const [lng, lat] = globalGeo.map(Number);
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
                return {
                    id: String(stationId || ""),
                    name: stationName,
                    lng,
                    lat
                };
            }
        }

        if (globalGeo?.lng != null && globalGeo?.lat != null) {
            return {
                id: String(stationId || ""),
                name: stationName,
                lng: Number(globalGeo.lng),
                lat: Number(globalGeo.lat)
            };
        }

        return this.stationsData[String(stationId || "")] || this.stationsData[stationName] || null;
    },

    getStationCoords(station) {
        if (!station) return null;

        if (Number.isFinite(station.lng) && Number.isFinite(station.lat)) {
            return [station.lng, station.lat];
        }
        if (Number.isFinite(station.longitude) && Number.isFinite(station.latitude)) {
            return [station.longitude, station.latitude];
        }

        const stationId = station.id || station.stationId || "";
        const stationName = station.cn || station.name || station.stationName || "";
        const matchedStation = this.getStation(stationId, { name: stationName });
        return matchedStation ? [matchedStation.lng, matchedStation.lat] : null;
    },

    hasCard(stationId, lineId, stationInfo) {
        const stationFromData = typeof stationsData !== "undefined" ? stationsData[stationId] : null;
        const station = stationInfo?.cn || stationInfo?.name
            ? stationInfo
            : stationFromData || { id: stationId };
        return Boolean(this.getStationCoords(station));
    },

    getCardPlaceholderHtml(station, lineInfo = {}, isCrossPlatform = false) {
        const stationId = station?.id || "";
        const stationName = station?.cn || station?.name || "";
        const lineId = lineInfo?.id || "";
        const lineColor = lineInfo?.lineColor || lineInfo?.color || "var(--primary-color)";
        const coordinates = this.getStationCoords(station);
        const coordinateValue = coordinates ? coordinates.join(",") : "";
        const extraClass = isCrossPlatform ? "hoisted-stacard" : "";
        const extraStyle = isCrossPlatform ? "margin: 0 0 12px 0;" : "margin: 8px 0 14px 0;";

        return `
            <div class="stacard-container stacard-minimap-box ${extraClass}"
                data-sid="${stationId}"
                data-sname="${stationName}"
                data-lid="${lineId}"
                data-color="${lineColor}"
                data-coords="${coordinateValue}"
                style="${extraStyle}">
                <div class="stacard-loading-tip">
                    <span>正在加载车站地图...</span>
                </div>
            </div>
        `;
    },

    async renderCard(container, context = {}) {
        if (!container) return;
        await this.init();
        this.destroyResizeObserver(container);

        const station = context.station || {
            id: context.stationId || container.dataset.sid || "",
            cn: context.stationName || container.dataset.sname || ""
        };
        const stationName = station.cn || station.name || container.dataset.sname || "";
        const lineColor = context.color || container.dataset.color || "var(--primary-color)";
        let coordinates = this.getStationCoords(station);

        if (!coordinates && container.dataset.coords) {
            const [lngRaw, latRaw] = container.dataset.coords.split(",");
            const lng = Number(lngRaw);
            const lat = Number(latRaw);
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
                coordinates = [lng, lat];
            }
        }

        if (!coordinates) {
            container.innerHTML = "<div class=\"stacard-empty-box\"><span>暂无该站点地理坐标数据</span></div>";
            return;
        }

        const initialZoom = 15;
        let currentZoom = initialZoom;
        const minZoom = 12;
        const maxZoom = 18;
        const centerLng = coordinates[0];
        const centerLat = coordinates[1];

        container.innerHTML = `
            <div class="stacard-minimap-viewport" tabindex="0" aria-label="${stationName}周边地图">
                <div class="stacard-tiles-wrapper"></div>
                <div class="stacard-pin-marker" style="--marker-color: ${lineColor};">
                    <div class="stacard-pin-pulse"></div>
                    <div class="stacard-pin-dot"></div>
                    <div class="stacard-pin-label">${stationName}</div>
                </div>
                <div class="stacard-controls">
                    <button type="button" class="stacard-ctrl-btn zoom-in" aria-label="放大地图">+</button>
                    <button type="button" class="stacard-ctrl-btn zoom-out" aria-label="缩小地图">-</button>
                </div>
            </div>
        `;

        const viewport = container.querySelector(".stacard-minimap-viewport");
        const tilesElement = container.querySelector(".stacard-tiles-wrapper");

        const renderMap = () => {
            const width = viewport.clientWidth;
            const height = viewport.clientHeight;
            if (!width || !height) return;

            const centerPoint = WebMercator.lngLatToPoint(centerLng, centerLat, currentZoom);
            const startTileX = Math.floor((centerPoint.x - width / 2) / WebMercator.TILE_SIZE);
            const endTileX = Math.floor((centerPoint.x + width / 2) / WebMercator.TILE_SIZE);
            const startTileY = Math.floor((centerPoint.y - height / 2) / WebMercator.TILE_SIZE);
            const endTileY = Math.floor((centerPoint.y + height / 2) / WebMercator.TILE_SIZE);
            const maxTile = Math.pow(2, currentZoom);

            tilesElement.replaceChildren();
            for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
                if (tileY < 0 || tileY >= maxTile) continue;

                for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
                    const wrappedTileX = ((tileX % maxTile) + maxTile) % maxTile;
                    const tile = document.createElement("img");
                    tile.className = "stacard-tile-img";
                    tile.src = AMapTile.getTileUrl(wrappedTileX, tileY, currentZoom);
                    tile.alt = "";
                    tile.draggable = false;
                    tile.onerror = () => {
                        tile.style.opacity = "0";
                    };
                    tile.style.left = `${tileX * WebMercator.TILE_SIZE - centerPoint.x + width / 2}px`;
                    tile.style.top = `${tileY * WebMercator.TILE_SIZE - centerPoint.y + height / 2}px`;
                    tilesElement.appendChild(tile);
                }
            }
        };

        const changeZoom = (delta) => {
            const nextZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom + delta));
            if (nextZoom === currentZoom) return;
            currentZoom = nextZoom;
            renderMap();
        };

        container.querySelector(".zoom-in").addEventListener("click", () => changeZoom(1));
        container.querySelector(".zoom-out").addEventListener("click", () => changeZoom(-1));
        viewport.addEventListener("wheel", (event) => {
            event.preventDefault();
            changeZoom(event.deltaY < 0 ? 1 : -1);
        }, { passive: false });
        viewport.addEventListener("dblclick", (event) => {
            event.preventDefault();
            changeZoom(1);
        });

        if (typeof ResizeObserver !== "undefined") {
            const resizeObserver = new ResizeObserver(renderMap);
            resizeObserver.observe(viewport);
            container._hefeiStaCardResizeObserver = resizeObserver;
        }
        renderMap();
    },

    destroyResizeObserver(container) {
        container._hefeiStaCardResizeObserver?.disconnect();
        delete container._hefeiStaCardResizeObserver;
    },

    async renderPanelCards(panel, stationInfo) {
        const containers = panel?.querySelectorAll(".stacard-container") || [];
        await Promise.all([...containers].map((container) => this.renderCard(container, stationInfo)));
    }
};

window.HefeiStaCard = HefeiStaCard;
window.HEFEI_STACARD = HefeiStaCard;
window.StaCard = HefeiStaCard;

export { HefeiStaCard };
