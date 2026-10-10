/**
 * CGo OpenMap - 共享层：站距「约X米」估算的经纬度优先实现 (shared/base/geo-estimate.js)
 *
 * 背景：核心在 distances 为 "?" / "??" 时，把相邻站行渲染成「(约X米)」——数值来自
 * `estimateSchematicMeters()`（画布距离 × 全网中位数米/像素），示意图各段比例失真时误差不小。
 *
 * 为什么不能直接覆盖核心函数：`core/script.js` 是 **ES module**（main.html 用
 * `<script type="module">` 引入，且特意让城市数据先 document.write 执行），模块顶层的
 * 函数与 `STATION_GEO_MAP` 都是模块私有作用域，经典脚本拿不到也覆不了 —— 本模块因此
 * 采用「面板就地改写」：观察 `#info-panel`，把命中的「(约X米)」文本按经纬度重算后写回。
 * （青岛曾用正则整体抹掉这句展示，同属事后改写路线；这里保留展示、只换数值。）
 *
 * 判定规则（estimateForPair，纯函数、可单测）：
 *   1. 邻站名 → 车站 id；同城同名多站时按「与当前站处在同一条线站序里的相邻位置」收窄，
 *      仍歧义则不改（宁可保留画布值，不写错站）；
 *   2. 当前站与邻站在 amap_data.json（GCJ-02，站名扁平索引，与核心 LBS 同一份语义）里
 *      都有经纬度 → 球面距离（与核心同口径：四舍五入到 10 米、下限 10 米）；
 *   3. **异常偏离守卫**：球面值 ÷ 面板现值 超出 [0.5, 2] 窗口 → 不改 —— 典型是同名异位站
 *      （扁平按站名只存一份坐标，如沈阳有轨/地铁两个「杨官」，拿到对方坐标会把米数拉爆）；
 *      示意图正常的局部形变不会超出该窗口。
 *
 * 时序：坐标索引异步拉取，ready 后立即补刷一次面板；随后由 MutationObserver 随面板重绘
 * 逐次改写（改写自身触发的重入会因「球面值=现值」自然收敛，不会循环）。
 *
 * 加载：接入城市在 `{city}.js` 的 document.write 列表里引入（与 route-panel 等同为经典脚本）。
 *
 * 对外接口：`window.CGoGeoEstimate = { estimateForPair, applyToPanel, ready }`
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    /** 球面值 ÷ 画布现值 的接受窗口（同名异位站会超出，正常形变不会） */
    const RATIO_MIN = 0.5;
    const RATIO_MAX = 2;
    /** 面板里核心渲染的目标文本形如「(约1230米)」 */
    const SPAN_RE = /^\(约(\d+)米\)$/;

    let coordIndex = null;      // 站名 → [lng, lat]
    let ready = false;

    /** GCJ-02 球面距离（米）；两端同为高德坐标系，直接量算即可 */
    function haversine(lng1, lat1, lng2, lat2) {
        const R = 6371008.8;
        const rad = Math.PI / 180;
        const dLat = (lat2 - lat1) * rad;
        const dLng = (lng2 - lng1) * rad;
        const a = Math.sin(dLat / 2) ** 2
            + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    function parseCoord(str) {
        if (typeof str !== "string") return null;
        const parts = str.split(",");
        if (parts.length !== 2) return null;
        const lng = Number(parts[0]);
        const lat = Number(parts[1]);
        return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
    }

    /**
     * 纯函数：当前站 id + 邻站名 + 面板现值 → 建议米数；任何守卫不过都返回 null（保留现值）。
     * @param {string} activeSid 当前车站 id（地图上 active 的那座）
     * @param {string} neighborName 相邻站中文名（来自同一行 span 之前的文本）
     * @param {number} displayed 面板现值（核心画布推算出的米数）
     * @returns {number|null}
     */
    function estimateForPair(activeSid, neighborName, displayed) {
        if (!coordIndex || !neighborName || !Number.isFinite(displayed) || displayed <= 0) return null;
        const stations = window.stationsData || {};
        const lines = window.linesData || [];
        const active = (window.processedStations || {})[activeSid] || stations[activeSid];
        if (!active) return null;

        let candidates = Object.keys(stations).filter((id) => stations[id] && stations[id].cn === neighborName);
        if (!candidates.length) return null;
        if (candidates.length > 1) {
            // 同城同名（如综合保税区的地铁站与有轨站）：只保留与当前站同线且站序相邻的
            const adjacent = new Set();
            lines.forEach((line) => {
                const groups = line.hasbranch
                    ? [line["stationIds-way1"] || [], line["stationIds-way2"] || []]
                    : [line.stationIds || []];
                groups.forEach((ids) => {
                    const i = ids.indexOf(activeSid);
                    if (i > 0) adjacent.add(ids[i - 1]);
                    if (i >= 0 && i < ids.length - 1) adjacent.add(ids[i + 1]);
                });
            });
            const narrowed = candidates.filter((id) => adjacent.has(id));
            if (narrowed.length !== 1) return null;   // 0 或仍 >1 → 歧义，不改
            candidates = narrowed;
        }

        const a = parseCoord(coordIndex[active.cn]);
        const b = parseCoord(coordIndex[neighborName]);
        if (!a || !b) return null;
        const meters = haversine(a[0], a[1], b[0], b[1]);
        if (!Number.isFinite(meters) || meters <= 0) return null;
        const rounded = Math.max(10, Math.round(meters / 10) * 10);

        const ratio = rounded / displayed;
        if (ratio < RATIO_MIN || ratio > RATIO_MAX) return null;
        return rounded;
    }

    /** 拉取当前城市 amap_data.json，建站名扁平索引（与核心 LBS 同一份数据、同一合并语义：后写覆盖）。
     *  传入 data 时跳过网络请求（单测注入用）。 */
    async function loadCoordIndex(data) {
        try {
            if (!data) {
                const city = window.CURRENT_CITY || {};
                const url = (city.dataFiles && city.dataFiles.amapDataUrl)
                    || (city.stacard && city.stacard.geoDataUrl)
                    || null;
                if (!url) return;
                const sep = url.includes("?") ? "&" : "?";
                const version = window.CGO_ASSET_VERSION;
                const res = await fetch(url + (version ? sep + "v=" + version : ""));
                data = await res.json();
            }
            const index = {};
            (data.l || []).forEach((group) => {
                (group.st || []).forEach((s) => {
                    if (s && s.n && s.sl) index[s.n] = s.sl;
                });
            });
            coordIndex = index;
            ready = true;
            if (typeof document !== 'undefined') applyToPanel(document.getElementById("info-panel"));
        } catch (err) {
            console.warn("[CGoGeoEstimate] 坐标索引加载失败：", err);
        }
    }

    /** 当前站 id：地图 active 站点优先，退回 active 标签（面板打开即有其一） */
    function activeStationId() {
        return document.querySelector("#stations-layer .station.active")?.dataset?.sid
            || document.querySelector("#labels-layer .label-group.active")?.dataset?.sid
            || null;
    }

    /**
     * 扫描面板里所有「(约X米)」并按需改写。改写只动 textContent（样式与其他节点不动）；
     * 已改写过的 span 打标记跳过，杜绝观测器重入。
     */
    function applyToPanel(root) {
        if (!ready || !root) return;
        const activeSid = activeStationId();
        if (!activeSid) return;
        root.querySelectorAll("span").forEach((el) => {
            if (el.dataset.cgoGeoDone) return;
            const m = SPAN_RE.exec((el.textContent || "").trim());
            if (!m) return;
            const nameNode = el.previousSibling;
            const neighborName = nameNode && nameNode.nodeType === 3
                ? nameNode.textContent.replace(/\s+$/, "").trim()
                : "";
            const estimated = estimateForPair(activeSid, neighborName, Number(m[1]));
            if (estimated == null) return;
            el.dataset.cgoGeoDone = "1";
            el.textContent = `(约${estimated}米)`;
        });
    }

    function install() {
        const panel = document.getElementById("info-panel");
        if (!panel) return;
        let frame = 0;
        const schedule = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                applyToPanel(panel);
            });
        };
        new MutationObserver(schedule).observe(panel, { childList: true, subtree: true, characterData: true });
        // 起点：当前站跟着地图 active 走，面板重绘与站点选中都会带动（均在被观察范围内或
        // 会触发子树变更）；地图侧变化由下面这条兜底
        const map = document.getElementById("map-content");
        if (map) {
            new MutationObserver(schedule).observe(map, { attributes: true, attributeFilter: ["class"], subtree: true });
        }
        loadCoordIndex();
    }

    if (typeof document !== "undefined") {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", install, { once: true });
        } else {
            install();
        }
    }

    window.CGoGeoEstimate = { estimateForPair, applyToPanel, loadCoordIndex, get ready() { return ready; } };
})();
