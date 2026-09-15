/**
 * CGo OpenMap - 大连车站地图卡片
 *
 * 首末班车由 modules/dalian_timetable.js 渲染，本模块只负责车站周边地图。
 */

const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const AMapTile = {
    getTileUrl(x, y, z) {
        const server = (x + y) % 4 + 1;
        return `https://webrd0${server}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${x}&y=${y}&z=${z}`;
    }
};

const WebMercator = {
    lngLatToPoint(lng, lat, zoom) {
        const scale = 256 * 2 ** zoom;
        const safeLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
        const sinLat = Math.sin(safeLat * Math.PI / 180);
        return { x: (lng + 180) / 360 * scale, y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale };
    }
};

const DalianStaCard = {
    initialized: false,
    initPromise: null,
    stationsData: {},
    geoDataUrl: "./city/dalian/amap_data.json",

    async init(options = {}) {
        if (this.initialized) return this;
        if (this.initPromise) return this.initPromise;
        if (options.geoDataUrl) this.geoDataUrl = options.geoDataUrl;
        this.initPromise = fetch(this.geoDataUrl).then((response) => {
            if (!response.ok) throw new Error(`无法加载大连车站坐标数据: ${response.status}`);
            return response.json();
        }).then((data) => {
            const stations = {};
            for (const line of data?.l || []) for (const station of line?.st || []) {
                const [lng, lat] = String(station.sl || "").split(",").map(Number);
                if (station.n && Number.isFinite(lng) && Number.isFinite(lat)) stations[station.n] ||= { name: station.n, lng, lat };
            }
            this.stationsData = stations;
            this.initialized = true;
            return this;
        }).catch((error) => { this.initPromise = null; throw error; });
        return this.initPromise;
    },

    getStationCoords(station) {
        if (Number.isFinite(Number(station?.lng)) && Number.isFinite(Number(station?.lat))) return [Number(station.lng), Number(station.lat)];
        const name = station?.cn || station?.name || station?.stationName || "";
        const item = this.stationsData[name];
        return item ? [item.lng, item.lat] : null;
    },

    hasCard(stationId, lineId, stationInfo) {
        const station = stationInfo || (typeof stationsData !== "undefined" ? stationsData[stationId] : null) || { id: stationId };
        return Boolean(this.getStationCoords(station) || station?.cn || station?.name);
    },

    getCardPlaceholderHtml(station, lineInfo = {}) {
        const stationId = station?.id || "";
        const lineId = lineInfo?.id || "";
        const lineColor = lineInfo?.lineColor || lineInfo?.color || "var(--primary-color)";
        const coordinates = this.getStationCoords(station);
        if (!station) return "";
        return `
            <div class="stacard-container stacard-minimap-box"
                data-card-type="map" data-sid="${escapeHtml(stationId)}"
                data-sname="${escapeHtml(station?.cn || "")}" data-lid="${escapeHtml(lineId)}"
                data-color="${escapeHtml(lineColor)}" data-coords="${coordinates ? coordinates.join(",") : ""}" style="margin: 8px 0 14px 0;">
                <div class="stacard-loading-tip"><span>正在加载车站地图...</span></div>
            </div>
        `;
    },

    async renderCard(container) {
        if (!container) return;
        if (container.dataset.cardType === "map") await this.renderMapCard(container);
    },

    async renderMapCard(container) {
        await this.init();
        const coords = this.getStationCoords({ cn: container.dataset.sname }) || container.dataset.coords?.split(",").map(Number);
        if (!coords || coords.length !== 2 || coords.some((value) => !Number.isFinite(value))) {
            container.innerHTML = "<div class=\"stacard-empty-box\"><span>暂无该站点地理坐标数据</span></div>";
            return;
        }
        let zoom = 15;
        const [centerLng, centerLat] = coords;
        container.innerHTML = `
            <div class="stacard-minimap-viewport" tabindex="0" aria-label="${escapeHtml(container.dataset.sname)}周边地图">
                <div class="stacard-tiles-wrapper"></div>
                <div class="stacard-pin-marker" style="--marker-color: ${escapeHtml(container.dataset.color || "var(--primary-color)")};">
                    <div class="stacard-pin-pulse"></div><div class="stacard-pin-dot"></div>
                    <div class="stacard-pin-label">${escapeHtml(container.dataset.sname)}</div>
                </div>
                <div class="stacard-controls"><button type="button" class="stacard-ctrl-btn zoom-in" aria-label="放大地图">+</button><button type="button" class="stacard-ctrl-btn zoom-out" aria-label="缩小地图">−</button></div>
            </div>`;
        const viewport = container.querySelector(".stacard-minimap-viewport");
        const tiles = container.querySelector(".stacard-tiles-wrapper");
        const renderMap = () => {
            const width = viewport.clientWidth, height = viewport.clientHeight;
            if (!width || !height) return;
            const center = WebMercator.lngLatToPoint(centerLng, centerLat, zoom), maxTile = 2 ** zoom;
            tiles.replaceChildren();
            for (let y = Math.floor((center.y - height / 2) / 256); y <= Math.floor((center.y + height / 2) / 256); y += 1) {
                if (y < 0 || y >= maxTile) continue;
                for (let x = Math.floor((center.x - width / 2) / 256); x <= Math.floor((center.x + width / 2) / 256); x += 1) {
                    const image = document.createElement("img"), wrappedX = ((x % maxTile) + maxTile) % maxTile;
                    image.className = "stacard-tile-img"; image.src = AMapTile.getTileUrl(wrappedX, y, zoom); image.alt = ""; image.draggable = false;
                    image.style.left = `${x * 256 - center.x + width / 2}px`; image.style.top = `${y * 256 - center.y + height / 2}px`;
                    image.onerror = () => { image.style.opacity = "0"; }; tiles.appendChild(image);
                }
            }
        };
        const changeZoom = (delta) => { const next = Math.max(12, Math.min(18, zoom + delta)); if (next !== zoom) { zoom = next; renderMap(); } };
        container.querySelector(".zoom-in").addEventListener("click", () => changeZoom(1));
        container.querySelector(".zoom-out").addEventListener("click", () => changeZoom(-1));
        viewport.addEventListener("wheel", (event) => { event.preventDefault(); changeZoom(event.deltaY < 0 ? 1 : -1); }, { passive: false });
        if (typeof ResizeObserver !== "undefined") { const observer = new ResizeObserver(renderMap); observer.observe(viewport); container._dalianStaCardResizeObserver = observer; }
        renderMap();
    },

    async renderPanelCards(panel) {
        const containers = panel?.querySelectorAll(".stacard-container") || [];
        await Promise.all([...containers].map((container) => this.renderCard(container)));
    }
};

if (typeof window !== "undefined") {
    window.DalianStaCard = DalianStaCard;
    window.DALIAN_STACARD = DalianStaCard;
    window.StaCard = DalianStaCard;
}

export { DalianStaCard };
