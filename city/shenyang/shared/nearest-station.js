/**
 * CGo OpenMap - 跨城市「查找最近车站」（共享层）
 *
 * ⚠️ 临时共享位置：与 route-panel.js 同处 city/shenyang/shared/，计划随共享层整体迁入 core/。
 *
 * 背景：核心的 findNearestStation() 只认当前城市的站点。人出了本市之后，它会算出
 * 几百公里外的「最近车站」，再弹一个同步 confirm 问「距离较远，是否跳转？」——
 * confirm 是阻塞式的，既没法让用户改选别的城市，也塞不进 cgo-modal。
 *
 * 本模块在 #locate-btn 上以**捕获阶段**监听抢先接管（捕获总是先于核心注册在冒泡阶段的
 * 监听触发，与脚本先后顺序无关），随后：
 *   1. 定位并算出当前城市的最近车站（走核心已暴露的 processedStations，拿到的 sid 能直接选中）；
 *   2. 距离在 FAR_THRESHOLD 以内 → 与核心行为一致，直接跳转过去；
 *   3. 超出阈值 → 并发拉取其余城市的 amap_data.json，找出真正更近的城市；
 *   4. 有更近的城市 → cgo-modal 三选一（切换到该城 / 查看当前城市最近车站 / 取消）；
 *      没有则退化为两选一，彻底替掉那个 confirm。
 *
 * 刻意不动 core：接管点、坐标换算、距离计算都在此自足。等本模块并入 core 时，
 * 应与 makeLineSegments / wgs2gcj / getDistance 等核心实现合并，删掉这里的副本。
 *
 * @event cgo:nearest-resolved { lat, lng, cityId, station, distance, better }
 * @event cgo:nearest-jump     { cityId, stationId, distance }
 * @event cgo:nearest-cancel   {}
 */
(function () {
    "use strict";

    // 共享层可能被多个城市脚本各引一次，重复执行时只保留首份接管，
    // 否则会出现多份监听与多个 busy 标志互相干扰
    if (window.__cgoNearestStationBound) return;
    window.__cgoNearestStationBound = true;

    const BTN_ID = "locate-btn";
    const MODAL_ID = "cgo-nearest-city-modal";
    const STYLE_ID = "cgo-nearest-style";
    const FAR_THRESHOLD = 50000;        // 「距离较远」的口径与核心 findNearestStation 保持一致
    // 地铁线网的合理覆盖半径。全局最近的城市仍超出这个范围，基本可断定当前位置
    // 就没有已收录的线路图（而不是「本市有点远」），此时要明确说出来
    const COVERAGE_THRESHOLD = 50000;

    const geoCache = new Map();    // 城市 ID → Promise<点列表 | null>，避免并发重复拉取
    let busy = false;

    /* ======================================================================
     * 坐标与几何
     * 核心的 wgs2gcj / getDistance 都在模块作用域内、没挂到 window，城市层取不到，
     * 故按同一算法复刻一份，保证两端算出的距离口径一致。
     * ==================================================================== */

    const PI = 3.1415926535897932384626;
    const SEMI_MAJOR = 6378245.0;          // 克拉索夫斯基椭球长半轴
    const EE = 0.00669342162296594323;     // 第一偏心率平方
    const EARTH_R = 6378137;

    function outOfChina(lon, lat) {
        return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
    }

    function transformLat(x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transformLon(x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
        return ret;
    }

    /** WGS-84（GPS 原始）→ GCJ-02（高德），与 amap_data.json 的坐标系对齐 */
    function wgs2gcj(lon, lat) {
        if (outOfChina(lon, lat)) return [lon, lat];
        let dLat = transformLat(lon - 105.0, lat - 35.0);
        let dLon = transformLon(lon - 105.0, lat - 35.0);
        const radLat = lat / 180.0 * PI;
        let magic = Math.sin(radLat);
        magic = 1 - EE * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((SEMI_MAJOR * (1 - EE)) / (magic * sqrtMagic) * PI);
        dLon = (dLon * 180.0) / (SEMI_MAJOR / sqrtMagic * Math.cos(radLat) * PI);
        return [lon + dLon, lat + dLat];
    }

    /** 球面距离（米）。参数序与核心 getDistance 一致：先纬度后经度 */
    function distance(lat1, lng1, lat2, lng2) {
        const r1 = lat1 * Math.PI / 180.0;
        const r2 = lat2 * Math.PI / 180.0;
        const a = r1 - r2;
        const b = (lng1 * Math.PI / 180.0) - (lng2 * Math.PI / 180.0);
        const s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2)
            + Math.cos(r1) * Math.cos(r2) * Math.pow(Math.sin(b / 2), 2)));
        return Math.round(s * EARTH_R);
    }

    /* ======================================================================
     * 城市与坐标数据
     * ==================================================================== */

    function activeCity() {
        if (window.CityDataManager?.getCurrentCity) return window.CityDataManager.getCurrentCity();
        return typeof window.getActiveCity === "function" ? window.getActiveCity() : null;
    }

    function allCities() {
        if (window.CityDataManager?.getAllCities) return window.CityDataManager.getAllCities() || [];
        return Object.values(window.CITY_REGISTRY || {});
    }

    function amapUrlOf(city) {
        if (!city || !city.id) return null;
        // 优先用注册表里的显式配置。⚠️ 但 main.html 只加载**当前城市**的主脚本，
        // 其余城市的 dataFiles 并未经 registerCity 合并进注册表（实测 allCities() 里
        // 只有当前城市带 amapDataUrl），所以必须退回按项目约定拼路径 ——
        // 各城坐标数据一律位于 city/{id}/amap_data.json。没有该文件的城市 fetch 会 404，
        // 由 loadCityGeo 的 catch 吞掉并记为 null，不影响比对。
        return (city.dataFiles && city.dataFiles.amapDataUrl)
            || `./city/${city.id}/amap_data.json`;
    }

    /**
     * 取某城市的站点坐标表（带缓存）。返回 [{ name, lng, lat }]，按站名去重 ——
     * 换乘站会在多条线里各出现一次，同名站在本站内只可能对应同一个物理位置。
     */
    function loadCityGeo(city) {
        const key = city.id;
        if (geoCache.has(key)) return geoCache.get(key);
        const url = amapUrlOf(city);
        if (!url) {
            geoCache.set(key, Promise.resolve(null));
            return geoCache.get(key);
        }
        const task = fetch(url)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data || !Array.isArray(data.l)) return null;
                const seen = new Set();
                const points = [];
                data.l.forEach((line) => {
                    (line.st || []).forEach((sta) => {
                        if (!sta || !sta.n || !sta.sl || seen.has(sta.n)) return;
                        const parts = String(sta.sl).split(",");
                        const lng = Number(parts[0]);
                        const lat = Number(parts[1]);
                        if (!isFinite(lng) || !isFinite(lat)) return;
                        seen.add(sta.n);
                        points.push({ name: sta.n, lng, lat });
                    });
                });
                return points.length ? points : null;
            })
            .catch(() => null);
        geoCache.set(key, task);
        return task;
    }

    function nameIndex(points) {
        const map = new Map();
        points.forEach((p) => { if (!map.has(p.name)) map.set(p.name, p); });
        return map;
    }

    /** 站名匹配规则与核心 lookupStationLngLat 一致（原样 → 补「站」→ 去「站」） */
    function lookupGeo(index, cn) {
        if (!cn) return null;
        return index.get(cn) || index.get(cn + "站") || index.get(String(cn).replace(/站$/, "")) || null;
    }

    function nearestIn(points, lat, lng) {
        let best = null;
        points.forEach((p) => {
            const d = distance(lat, lng, p.lat, p.lng);
            if (!best || d < best.distance) best = { name: p.name, distance: d };
        });
        return best;
    }

    /**
     * 当前城市的最近车站。刻意走核心暴露的 processedStations 而不是坐标表本身：
     * 只有线路图上真实渲染的车站才有 sid，能直接交给 selectStation；
     * 坐标表里可能含未开通或非本图的站点，选中它们会没有落点。
     */
    function nearestOfActiveCity(points, lat, lng) {
        const stations = window.processedStations || {};
        const index = nameIndex(points);
        let best = null;
        for (const sid in stations) {
            const s = stations[sid];
            const p = lookupGeo(index, s && s.cn);
            if (!p) continue;
            const d = distance(lat, lng, p.lat, p.lng);
            if (!best || d < best.distance) best = { sid, name: s.cn, distance: d };
        }
        return best;
    }

    /**
     * 并发比对其余城市，返回**全局最近**的那个（当前城市也参与比较）。
     * 刻意不只在「比当前城市更近」时才返回：当全局最近都还很远时，
     * 恰恰是最需要告知用户「这里没有收录的线路图」的情况。
     */
    async function nearestCityOverall(current, lat, lng, local) {
        const others = allCities().filter((c) => c && c.id && c.id !== current.id);
        const results = await Promise.all(others.map(async (c) => {
            const points = await loadCityGeo(c);
            if (!points) return null;
            const hit = nearestIn(points, lat, lng);
            return hit ? { city: c, station: hit } : null;
        }));
        let best = { city: current, station: { name: local.name, distance: local.distance } };
        results.forEach((r) => {
            if (r && r.station.distance < best.station.distance) best = r;
        });
        return best;
    }

    /* ======================================================================
     * 定位
     * ==================================================================== */

    function getFix() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("您的浏览器不支持定位功能"));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const [lng, lat] = wgs2gcj(pos.coords.longitude, pos.coords.latitude);
                    resolve({ lat, lng });
                },
                (err) => {
                    let msg = "定位失败";
                    if (err.code === 1) msg = "定位权限被拒绝，请在系统设置中允许浏览器使用位置信息。";
                    else if (err.code === 2) msg = "位置不可用（请检查 GPS 或网络）";
                    else if (err.code === 3) msg = "定位请求超时（请在开阔地带重试）";
                    reject(new Error(msg));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    /**
     * 对外统一的「定位 → 本市最近车站」入口，供行程规划等其他模块复用。
     *
     * 之所以必须收敛到这一处：按坐标找站很容易各自走偏，而这里有三件容易各写一份的事——
     *   1. 定位拿回的是 WGS-84，站点坐标表却是高德 GCJ-02（国内差数百米，足以换一个站）；
     *   2. 距离要用球面 distance，而不是经纬度的直角距离（经度在高纬度要按 cos 折算，
     *      沈阳一带 1° 经度只相当于 0.75° 纬度，直角距离会系统性偏向东西方向）；
     *   3. 候选集必须是图上真实渲染的车站（processedStations），否则选出没有 sid 的站点无法落点。
     *
     * 只做「定位 + 算最近站」，不弹选择器、不跨城跳转——那是查找按钮自己的交互。
     * @returns {Promise<{sid:string,name:string,distance:number}>} 本市最近的车站与球面距离（米）
     * @throws {Error} 消息可直接展示给用户（不支持定位 / 定位失败 / 无坐标数据 / 匹配失败）
     */
    async function find() {
        const city = activeCity();
        if (!city || !amapUrlOf(city)) throw new Error("该城市暂无坐标数据");
        const fix = await getFix();
        const points = await loadCityGeo(city);
        if (!points) throw new Error("站点坐标数据加载失败");
        const local = nearestOfActiveCity(points, fix.lat, fix.lng);
        if (!local) throw new Error("无法定位最近车站（数据匹配失败）");
        return local;
    }

    /* ======================================================================
     * 选择弹窗
     * ==================================================================== */

    function emit(name, detail) {
        document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
    }

    function formatDistance(m) {
        return m < 1000 ? `${m} 米` : `${(m / 1000).toFixed(1)} 公里`;
    }

    function modalEl() {
        let el = document.getElementById(MODAL_ID);
        if (!el) {
            el = document.createElement("cgo-modal");
            el.id = MODAL_ID;
            el.setAttribute("max-width", "420px");
            document.body.appendChild(el);
        }
        return el;
    }

    function openChooser({ city, local, overall }) {
        const modal = modalEl();
        const cityName = (city && city.name) || "当前城市";
        const better = overall && overall.city.id !== city.id ? overall : null;
        // 全局最近的城市都还在覆盖半径之外：这时真正该说清的是「这儿没有收录的线路图」，
        // 而不是含糊的「本市有点远」——用户据此才能判断是不是该换个城市看
        const uncovered = Boolean(overall && overall.station.distance > COVERAGE_THRESHOLD);

        const blocks = [];
        if (uncovered) {
            const elsewhere = better ? `，最近的是${better.city.name}的 ${better.station.name}` : "";
            blocks.push(`<p class="cgo-near-alert">
                <cgo-icon name="warning" size="14"></cgo-icon>
                <span>您当前位置附近没有已收录的线路图${elsewhere}。</span>
            </p>`);
        }
        if (better) {
            blocks.push(`<p class="cgo-near-lead">离您更近的是<b>${better.city.name}</b>：${better.station.name}，约
                   <b>${formatDistance(better.station.distance)}</b>。</p>`);
            blocks.push(`<p class="cgo-near-sub">${cityName}最近的是 ${local.name}，约 ${formatDistance(local.distance)}。</p>`);
        } else {
            blocks.push(`<p class="cgo-near-lead">${cityName}最近的车站是<b>${local.name}</b>，约
                   <b>${formatDistance(local.distance)}</b>，离您较远。</p>`);
        }

        modal.title = "查找最近车站";
        modal.innerHTML = `
            <div class="cgo-near-body">
                ${blocks.join("\n")}
            </div>
            <div class="cgo-near-actions">
                ${better ? `<button type="button" class="cgo-near-btn primary" data-act="switch">
                    <cgo-icon name="map" size="14"></cgo-icon>切换到${better.city.name}
                </button>` : ""}
                <button type="button" class="cgo-near-btn${better ? "" : " primary"}" data-act="local">
                    <cgo-icon name="location" size="14"></cgo-icon>查看${cityName}最近车站
                </button>
                <button type="button" class="cgo-near-btn ghost" data-act="cancel">
                    <cgo-icon name="close" size="14"></cgo-icon>取消
                </button>
            </div>
        `;

        modal.querySelectorAll("[data-act]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const act = btn.dataset.act;
                modal.open = false;
                if (act === "switch" && better) {
                    emit("cgo:nearest-jump", { cityId: better.city.id, stationId: null, distance: better.station.distance });
                    jumpTo(better.city.id);
                } else if (act === "local") {
                    emit("cgo:nearest-jump", { cityId: city && city.id, stationId: local.sid, distance: local.distance });
                    window.selectStation?.(local.sid);
                } else {
                    emit("cgo:nearest-cancel", {});
                }
            });
        });
        modal.open = true;
    }

    /* ======================================================================
     * 跳转
     * ==================================================================== */

    /** 与 city-neighbors.js 同一套 URL 处理：只改 ?city=，并带上落地自动定位的标记 */
    function jumpTo(cityId) {
        const q = new URLSearchParams(location.search);
        q.set("city", cityId);
        q.set("locate", "1");
        location.href = `${location.pathname}?${q.toString()}`;
    }

    function waitFor(test, timeout = 6000, step = 200) {
        return new Promise((resolve) => {
            const started = Date.now();
            const tick = () => {
                if (test() || Date.now() - started > timeout) resolve();
                else setTimeout(tick, step);
            };
            tick();
        });
    }

    /** 从别的城市切过来的落地动作：自动查一次，省得用户再点一遍定位按钮 */
    async function autoLocateOnArrival() {
        const params = new URLSearchParams(location.search);
        if (params.get("locate") !== "1") return;
        params.delete("locate");   // 地址栏只留 ?city=，刷新或分享时不会重复触发
        history.replaceState(null, "", `${location.pathname}${params.toString() ? "?" + params : ""}${location.hash}`);
        await waitFor(() => window.processedStations && Object.keys(window.processedStations).length);
        document.getElementById(BTN_ID)?.click();
    }

    /* ======================================================================
     * 接管入口
     * ==================================================================== */

    const BUSY_ICON = `<svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor;animation:spin 1s linear infinite;"><path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>`;

    function setBusy(on) {
        const btn = document.getElementById(BTN_ID);
        if (!btn) return;
        if (on) {
            btn.dataset.cgoOriginalIcon = btn.innerHTML;
            btn.innerHTML = BUSY_ICON;
            btn.style.opacity = "0.7";
        } else {
            if (btn.dataset.cgoOriginalIcon) btn.innerHTML = btn.dataset.cgoOriginalIcon;
            delete btn.dataset.cgoOriginalIcon;
            btn.style.opacity = "";
        }
    }

    async function onLocateClick(event) {
        // 捕获阶段先把这次点击扣下：核心的 findNearestStation 注册在冒泡阶段，
        // 不拦的话它会照旧弹那个同步 confirm
        event.preventDefault();
        event.stopImmediatePropagation();
        if (busy) return;
        busy = true;
        setBusy(true);
        try {
            const city = activeCity();
            if (!city || !amapUrlOf(city)) { alert("当前城市未配置站点坐标，无法查找最近车站。"); return; }
            const fix = await getFix();
            const points = await loadCityGeo(city);
            if (!points) { alert("站点坐标数据加载失败，无法查找最近车站。"); return; }
            const local = nearestOfActiveCity(points, fix.lat, fix.lng);
            if (!local) { alert("无法定位最近车站（数据匹配失败）"); return; }

            const overall = local.distance > FAR_THRESHOLD
                ? await nearestCityOverall(city, fix.lat, fix.lng, local)
                : null;
            const better = overall && overall.city.id !== city.id ? overall : null;
            emit("cgo:nearest-resolved", {
                lat: fix.lat, lng: fix.lng, cityId: city.id,
                station: { sid: local.sid, name: local.name, distance: local.distance },
                better: better ? { cityId: better.city.id, station: better.station } : null,
                uncovered: Boolean(overall && overall.station.distance > COVERAGE_THRESHOLD)
            });

            if (local.distance <= FAR_THRESHOLD) {
                window.selectStation?.(local.sid);   // 在本市范围内，行为与核心完全一致
                return;
            }
            openChooser({ city, local, overall });
        } catch (err) {
            alert((err && err.message) || "定位失败");
        } finally {
            busy = false;
            setBusy(false);
        }
    }

    /* ── 样式注入：按脚本自身 URL 找同名 css，调用方无需手工引用 ── */
    (function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const self = document.currentScript && document.currentScript.src;
        if (!self) return;
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = self.replace(/\.js(\?.*)?$/, ".css$1");
        document.head.appendChild(link);
    })();

    /** 对外接口：各模块取「最近车站」一律走这里，别再自建一份坐标比对 */
    window.CGoNearestStation = { find };

    function init() {
        document.getElementById(BTN_ID)?.addEventListener("click", onLocateClick, true);
        autoLocateOnArrival();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
