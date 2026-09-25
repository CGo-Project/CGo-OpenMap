/**
 * CGo OpenMap - 福州车站地图卡片 (city/fuzhou/stacard/script.js)
 *
 * 车站信息板中的「周边地图」微缩视窗：以高德切片为底图，在该站真实经纬度处落针，
 * 支持按钮与滚轮缩放。首末班车等其它内容由车站信息板模块负责，本文件只做周边地图。
 *
 * 数据来源：city/fuzhou/amap_data.json
 *   - 高德地铁图接口 https://map.amap.com/service/subway?srhdata=3501_drw_fuzhou.json
 *   - 坐标系 GCJ-02（与高德瓦片一致，直接使用，切勿再做 WGS-84 → GCJ-02 转换）；
 *   - 6 条线路 / 119 条站点记录，覆盖福州线路图上全部 105 座车站；
 *   - 站名匹配分四级：精确 → 含线路注释的完整归一化键 → 去注释基名键 → 站名+「站」。
 *     福州存在「同名不同站」：1 号线「三叉街」与滨海快线「三叉街(滨海快线)」相距约 400 m，
 *     必须按完整键匹配，否则滨海快线那站会落到 1 号线的位置上；
 *     其余同名站都是换乘站（两种写法坐标一致，如南门兜、帝封江），基名键兜底即可。
 *   - 高德 POI 里同名站还会带「(地铁站)」后缀（如「三叉街(地铁站)」「三叉街(滨海快线)(地铁站)」），
 *     归一化时已统一去掉该后缀，故两种写法都能命中。
 *
 * 维护提示：更新坐标时请重新抓取上述接口，并保持同一裁剪结构
 * （s / i / coordinateSystem / coordinateSource / l[].{ln,ls,st[].{n,sl}}），
 * 随后递增 sw.js 的 CACHE_NAME，新文件同时登记到 ASSETS_TO_CACHE。
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

/**
 * 站名归一化（完整键）：全角括号转半角、去掉高德 POI 常见的「(地铁站)」后缀与末尾「站」，
 * 但**保留线路注释**——福州存在同名不同站的情形，必须靠注释区分：
 *   1 号线「三叉街」119.326693,26.034785 与 滨海快线「三叉街(滨海快线)」119.322679,26.035376
 *   相距约 400 m，是两个车站。
 */
const normalizeStationKey = (name) => String(name ?? "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/\(地铁站\)/g, "")
    .replace(/站$/, "")
    .replace(/\s+/g, "")
    .trim();

/** 基名键：再去掉括号注释，用于「同名换乘站」的兜底匹配（福州换乘站两种写法坐标一致） */
const baseStationKey = (name) => normalizeStationKey(name).replace(/\([^()]*\)/g, "").trim();

const FuzhouStaCard = {
    initialized: false,
    initPromise: null,
    stationsData: {},          // 精确站名 → "lng,lat"
    fullKeyData: {},           // 完整归一化键（含线路注释）→ "lng,lat"
    baseKeyData: {},           // 基名键 → "lng,lat"（同名换乘站取首个）
    geoDataUrl: "./city/fuzhou/amap_data.json",

    async init(options = {}) {
        if (this.initialized) return this;
        if (this.initPromise) return this.initPromise;
        if (options.geoDataUrl) this.geoDataUrl = options.geoDataUrl;
        this.initPromise = fetch(this.geoDataUrl).then((response) => {
            if (!response.ok) throw new Error(`无法加载福州车站坐标数据: ${response.status}`);
            return response.json();
        }).then((data) => {
            const exact = {};
            const fullKey = {};
            const baseKey = {};
            for (const line of data?.l || []) {
                for (const station of line?.st || []) {
                    const [lng, lat] = String(station.sl || "").split(",").map(Number);
                    if (!station.n || !Number.isFinite(lng) || !Number.isFinite(lat)) continue;
                    const coords = `${lng},${lat}`;
                    const full = normalizeStationKey(station.n);
                    const base = baseStationKey(station.n);
                    if (!exact[station.n]) exact[station.n] = coords;
                    if (full && !fullKey[full]) fullKey[full] = coords;
                    if (base && !baseKey[base]) baseKey[base] = coords;
                }
            }
            this.stationsData = exact;
            this.fullKeyData = fullKey;
            this.baseKeyData = baseKey;
            this.initialized = true;
            return this;
        }).catch((error) => { this.initPromise = null; throw error; });
        return this.initPromise;
    },

    /**
     * 取车站经纬度：优先用站点数据自带的 lng/lat，其次按站名逐级匹配：
     *   1. 站名精确匹配；
     *   2. 完整归一化键（含线路注释）——区分「三叉街」与「三叉街(滨海快线)」；
     *   3. 基名键（去注释）——同名换乘站的兜底；
     *   4. 站名 + 「站」。
     * @returns {[number, number]|null}
     */
    getStationCoords(station) {
        if (Number.isFinite(Number(station?.lng)) && Number.isFinite(Number(station?.lat))) {
            return [Number(station.lng), Number(station.lat)];
        }
        const name = station?.cn || station?.name || station?.stationName || "";
        const raw = this.stationsData[name]
            || this.fullKeyData[normalizeStationKey(name)]
            || this.baseKeyData[baseStationKey(name)]
            || this.stationsData[`${name}站`];
        if (!raw) return null;
        const coords = String(raw).split(",").map(Number);
        return coords.length === 2 && coords.every(Number.isFinite) ? coords : null;
    },

    /** 车站是否展示卡片（有站名即可展示；缺坐标时卡片内会给出提示） */
    hasCard(stationId, lineId, stationInfo) {
        const station = stationInfo || (typeof stationsData !== "undefined" ? stationsData[stationId] : null) || { id: stationId };
        return Boolean(station?.cn || station?.name || station?.stationName || this.getStationCoords(station));
    },

    getCardPlaceholderHtml(station, lineInfo = {}) {
        if (!station) return "";
        const stationId = station?.id || "";
        const lineId = lineInfo?.id || "";
        const lineColor = lineInfo?.lineColor || lineInfo?.color || "var(--primary-color)";
        const coordinates = this.getStationCoords(station);
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
        try {
            await this.init();
        } catch (error) {
            container.innerHTML = "<div class=\"stacard-empty-box\"><span>车站坐标数据加载失败</span></div>";
            return;
        }
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
        if (typeof ResizeObserver !== "undefined") { const observer = new ResizeObserver(renderMap); observer.observe(viewport); container._fuzhouStaCardResizeObserver = observer; }
        renderMap();
    },

    async renderPanelCards(panel) {
        const containers = panel?.querySelectorAll(".stacard-container") || [];
        await Promise.all([...containers].map((container) => this.renderCard(container)));
    }
};

if (typeof window !== "undefined") {
    window.FuzhouStaCard = FuzhouStaCard;
    window.FUZHOU_STACARD = FuzhouStaCard;
    window.StaCard = FuzhouStaCard;
}

export { FuzhouStaCard };
