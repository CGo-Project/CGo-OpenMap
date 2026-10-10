/**
 * CGo OpenMap - 车站出入口共享层
 *
 * 把一个城市的出入口数组渲染成一个独立页签（挂在车站详情浮层里，排在「车站信息」之前）。
 * 城市侧只声明数据在哪、页签叫什么，其余在这里：
 *
 *   CGoExits.register({
 *       idPrefix: "dalian",
 *       dataGlobals: ["DALIAN_STATION_EXITS"],
 *       facilityGlobals: ["DALIAN_STATION_FACILITIES"],   // 可选：把该口的扶梯 / 电梯挂到出口下
 *       sourceNote: "以上内容摘自大连公共交通建设投资集团官网，与现场可能不一致"
 *   });
 *
 * 编号徽标恒为正方形：多段编号（C1、D1）把第一段连续字母 / 数字之后的部分转下标显示，
 * 仍放不下的在 onMounted 里按实测宽度横向压扁，不把正方形撑成长方形。
 *
 * 数据由各城的离线抓取脚本生成（drunk/tools/facilities/，开发期工具、不入版本库），结构见生成文件头部：
 * 每条出口含 name（出口编号）、lines（所属线路，可选）、buses（公交线路，可选）、
 * desc（出口描述：维基「出口指示」原文，维基没给则以相对所属线路站厅的方位填空，如「西北口」）、
 * geoDesc（高德逆地理的「最近路口方位」，**只留档不渲染**）、roads（最近道路侧向，可选）、
 * landmarks（周边地标，可选）、closed（是否暂停使用，可选）；缺哪个字段就不渲染哪一行。
 * 各源出入口的坐标（pos）并不齐全，没有坐标的口不会在小地图上标点，其余信息照常呈现。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    const STYLE_FLAG_ATTR = "data-cgo-exits-style";

    /** 样式注入：按脚本自身 URL 找同名 css，query（?v=）原样搬过去（同 facilities.js 的做法） */
    const SELF_URL = document.currentScript?.src || "";

    function injectStyle() {
        if (!SELF_URL) return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = SELF_URL.replace(/exits\.js(\?|$)/, "exits.css$1");
        link.setAttribute(STYLE_FLAG_ATTR, "");
        (document.head || document.documentElement).appendChild(link);
    }

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    /* ── 出口说明「待补充」的反馈 ────────────────────────────────────────
       出入口的说明来自人工核定（维基「出口指示」）或「相对站厅方位 + 口」的填空，
       总有还没收录的口。与其只留一句「待补充」，不如把反馈路径直接给到访客——
       点一下标即打开共享层的反馈面板（shared/feedback/feedback.js）：正文自带定位信息
       （城市 / 车站 ID / 出口编号 / 数据文件路径），复制或新建 Issue 都能一键带走。

       面板本身不在这里 —— 反馈要覆盖共享层的多个场景（出口说明 / 题字 / 首末班车 /
       票价 / 综合），故收敛到 `CGoFeedback`；本模块只声明「出口说明」这一种场景的文案。 */

    /**
     * 该出口的说明是否「待补充」。
     *
     * 两种情形都算：`desc` 本身缺失；或 `desc` 只是数据侧统一写成的「相对站厅方位 + 口」填空
     * （形如「西北口」，即 `bearing + "口"`）——它只说明方位，并没有收录该口的出口指示。
     * 维基「出口指示」原文的形态与它不同（多为「XX路（X侧）」「XX路东」），不会误判。
     */
    function isDescPending(exit) {
        if (!exit?.desc) return true;
        return Boolean(exit.bearing) && exit.desc === `${exit.bearing}口`;
    }

    /** 「待补充」标：点开反馈面板；定位信息全放在 data-* 上，由清单做事件委托 */
    function pendingBadgeHtml(exit, ctx) {
        return `<button type="button" class="cgo-exit-pending" data-exit-feedback
            data-station-id="${escapeHtml(ctx.stationId || "")}"
            data-station-cn="${escapeHtml(ctx.stationCn || "")}"
            data-exit-code="${escapeHtml(exit.name || "")}"
            title="该出口的说明尚未收录，点击反馈给我们"
        ><cgo-icon name="info" size="11"></cgo-icon>待补充</button>`;
    }

    /* 出口说明场景的文案：登记进共享层。带 label/order，故会出现在「更多」入口的场景切换里
       ——从那里进来没有车站与出口上下文，模板会退化成「请在补充说明里写明」。 */
    const EXIT_KIND = {
        label: "出口说明",
        order: 10,
        modalTitle: "反馈出口数据",
        heading: ({ cityName, stationCn, exitCode }) => [cityName, stationCn, exitCode && `${exitCode} 口`].filter(Boolean).join(" "),
        subject: ({ cityName, stationCn, exitCode }) => `【出口数据】${cityName}${stationCn ? ` ${stationCn}` : ""}${exitCode ? ` ${exitCode} 口` : ""} 说明待补充`,
        notePlaceholder: "补充说明（选填，比如你看到的实际出口指示）",
        context: ({ cityId, cityName, stationId, stationCn, exitCode, reason }) => [
            `【出口数据反馈】${cityName}${stationCn ? ` ${stationCn}` : ""}${exitCode ? ` ${exitCode} 口` : ""}`,
            "",
            `- 城市：${cityName}（${cityId}）`,
            ...(stationCn ? [`- 车站：${stationCn}${stationId ? `（${stationId}）` : ""}`] : ["- 车站：请在补充说明里写明是哪座车站"]),
            ...(exitCode ? [`- 出口：${exitCode}`] : []),
            `- 数据文件：city/${cityId}/data_exits.js`,
            `- 缺失内容：${reason || "该出口还没有「出口指示」说明，界面目前只按方位显示。"}`
        ]
    };
    // 加载时登记一次，打开面板前再登记一次（幂等）：反馈面板先于本模块加载是约定，
    // 但万一顺序变了，也不至于退化成「综合」场景的文案
    const registerExitKind = () => window.CGoFeedback?.registerKind("exit", EXIT_KIND);
    registerExitKind();

    /**
     * 打开反馈面板（转发到共享层的 CGoFeedback）。
     * 本名保留给城市模块与题字模块调用：ctx 里带 `kind` 即切到别的场景（如题字投稿）。
     */
    function openFeedback(ctx = {}) {
        const feedback = window.CGoFeedback;
        if (typeof feedback?.open !== "function") {
            console.warn("[exits] 共享层 CGoFeedback 未加载，反馈面板暂不可用");
            return;
        }
        registerExitKind();
        feedback.open({ kind: "exit", ...ctx });
    }

    function pickData(globals) {
        for (const name of globals || []) {
            const table = window[name];
            if (table && typeof table === "object") return table;
        }
        return null;
    }

    /* ── 出入口分布小地图 ────────────────────────────────────────────────
       在出口清单之前画一张小地图，标出「各线路的站厅位置」与「全部出入口」。
       瓦片地址与 Web Mercator 投影都取自 stacard-engine 挂出的 window.CGoMapTiles，
       不在本文件复刻（该引擎是 ES module，本文件是 classic script，只能这样共享）。 */

    /** 当前城市的 amap_data.json（含线路级车站坐标），同一会话只取一次 */
    let geoPromise = null;
    function loadGeoData() {
        const url = window.CURRENT_CITY?.stacard?.getRenderer?.()?.geoDataUrl;
        if (!url) return Promise.resolve(null);
        if (!geoPromise) {
            geoPromise = fetch(url).then((res) => (res.ok ? res.json() : null)).catch(() => null);
        }
        return geoPromise;
    }

    /** 线路名 → 该线主色（给站厅标记上色；linesData 是各城 data_lines.js 的词法绑定） */
    function lineColorOf(lineName) {
        if (typeof linesData === "undefined" || !Array.isArray(linesData)) return "";
        return linesData.find((line) => line.name === lineName)?.color || "";
    }

    /** 标记点：每条线一份站厅坐标（amap_data 的线路级坐标）+ 每个有坐标的出口 */
    function collectMarkers(geoData, stationName, exits) {
        const markers = [];
        for (const group of geoData?.l || []) {
            const station = (group.st || []).find((s) => String(s.n || "") === stationName);
            const [lng, lat] = String(station?.sl || "").split(",").map(Number);
            if (!lng) continue;
            const lineName = String(group.ln || "").trim();
            markers.push({ lng, lat, kind: "hall", label: lineName, color: lineColorOf(lineName) });
        }
        for (const exit of exits || []) {
            const [lng, lat] = String(exit.pos || "").split(",").map(Number);
            if (!lng) continue;
            markers.push({ lng, lat, kind: "exit", label: exit.name, color: "" });
        }
        return markers;
    }

    /**
     * 重叠标记外移：挤在同一格里的标记沿「远离簇心」的方向依次散开，
     * 原位留在 item.origin 供画引线（簇内点完全重合时按序号绕圈取方向）。
     * @returns {Array} 被移动过的标记，调用方据此画连接线
     */
    function spreadOverlaps(placed) {
        const GAP = 20;
        const cells = new Map();
        for (const item of placed) {
            const key = `${Math.round(item.x / GAP)},${Math.round(item.y / GAP)}`;
            if (!cells.has(key)) cells.set(key, []);
            cells.get(key).push(item);
        }
        const moved = [];
        for (const group of cells.values()) {
            if (group.length < 2) continue;
            const cx = group.reduce((a, g) => a + g.x, 0) / group.length;
            const cy = group.reduce((a, g) => a + g.y, 0) / group.length;
            group.forEach((item, order) => {
                const dx = item.x - cx;
                const dy = item.y - cy;
                const length = Math.hypot(dx, dy);
                const angle = length > 0.5
                    ? Math.atan2(dy, dx)
                    : (order * (Math.PI * 2 / group.length) - Math.PI / 2);
                const step = 18 + order * 12;
                item.origin = { x: item.x, y: item.y };
                item.x = cx + Math.cos(angle) * step;
                item.y = cy + Math.sin(angle) * step;
                moved.push(item);
            });
        }
        return moved;
    }

    /** 画瓦片与标记；容器还没有尺寸（页签未显示）时返回 false，交给调用方稍后重试 */
    function drawMap(box, markers) {
        const tiles = window.CGoMapTiles;
        const width = box.clientWidth;
        const height = box.clientHeight;
        if (!tiles || !markers.length || width < 40 || height < 40) return false;

        // 中心取站厅点的形心（站厅才是这张图的主角），没有站厅点就退而用全部标记
        const halls = markers.filter((m) => m.kind === "hall");
        const base = halls.length ? halls : markers;
        const centerLng = base.reduce((a, m) => a + m.lng, 0) / base.length;
        const centerLat = base.reduce((a, m) => a + m.lat, 0) / base.length;

        // 从大往小收，直到所有标记都落在可视区内（出口散布通常在几百米内）
        let zoom = 17;
        for (; zoom > 13; zoom--) {
            const c = tiles.lngLatToPoint(centerLng, centerLat, zoom);
            const fits = markers.every((m) => {
                const p = tiles.lngLatToPoint(m.lng, m.lat, zoom);
                return Math.abs(p.x - c.x) < width / 2 - 18 && Math.abs(p.y - c.y) < height / 2 - 18;
            });
            if (fits) break;
        }

        const center = tiles.lngLatToPoint(centerLng, centerLat, zoom);
        const maxTile = Math.pow(2, zoom);
        const frag = document.createDocumentFragment();
        for (let tx = Math.floor((center.x - width / 2) / tiles.TILE_SIZE); tx <= Math.floor((center.x + width / 2) / tiles.TILE_SIZE); tx++) {
            for (let ty = Math.floor((center.y - height / 2) / tiles.TILE_SIZE); ty <= Math.floor((center.y + height / 2) / tiles.TILE_SIZE); ty++) {
                if (tx < 0 || ty < 0 || tx >= maxTile || ty >= maxTile) continue;
                const img = document.createElement("img");
                img.className = "cgo-exit-map-tile";
                img.src = tiles.getTileUrl(tx, ty, zoom);
                img.alt = "";
                img.draggable = false;
                img.style.left = `${tx * tiles.TILE_SIZE - center.x + width / 2}px`;
                img.style.top = `${ty * tiles.TILE_SIZE - center.y + height / 2}px`;
                img.addEventListener("error", () => { img.style.opacity = "0"; }, { once: true });
                frag.appendChild(img);
            }
        }
        // 落位：重叠的沿「远离簇心」方向散开，并用引线连回原位
        const placed = markers.map((marker) => {
            const point = tiles.lngLatToPoint(marker.lng, marker.lat, zoom);
            return { marker, x: point.x - center.x + width / 2, y: point.y - center.y + height / 2 };
        });
        const moved = spreadOverlaps(placed);
        if (moved.length) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "cgo-exit-map-links");
            for (const item of moved) {
                // 原位标明一点：徽标虽然挪开了，但在图上仍要看得出它的真实位置
                const anchor = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                anchor.setAttribute("class", "cgo-exit-map-anchor");
                anchor.setAttribute("cx", item.origin.x.toFixed(1));
                anchor.setAttribute("cy", item.origin.y.toFixed(1));
                anchor.setAttribute("r", "2.5");
                svg.appendChild(anchor);
                // 引线：把挪开的徽标连回原位点
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", item.origin.x.toFixed(1));
                line.setAttribute("y1", item.origin.y.toFixed(1));
                line.setAttribute("x2", item.x.toFixed(1));
                line.setAttribute("y2", item.y.toFixed(1));
                svg.appendChild(line);
            }
            frag.appendChild(svg);
        }
        for (const item of placed) {
            const { marker } = item;
            const pin = document.createElement("span");
            pin.className = `cgo-exit-map-pin cgo-exit-map-pin--${marker.kind}`;
            // 站厅点不带文字（外观即 .stacard-pin-dot 的圆点，颜色区分线路），只有出入口标编号
            if (marker.kind === "exit") {
                pin.textContent = marker.label;
                pin.addEventListener("click", () => focusExit(box, marker.label));
                // 地图上的辅助标记：点它滚到下方清单里对应的那一条。同核心的车站图元取 tabindex="-1"
                // （不进 Tab 序列）—— 键盘用户直接读下方清单即可，那里每条出口都是完整的文字描述。
                pin.setAttribute("role", "button");
                pin.setAttribute("tabindex", "-1");
                pin.setAttribute("aria-label", `出口 ${marker.label}，定位到出口清单`);
            }
            if (marker.color) pin.style.setProperty("--pin-color", marker.color);
            pin.style.left = `${item.x}px`;
            pin.style.top = `${item.y}px`;
            frag.appendChild(pin);
        }
        box.replaceChildren(frag);
        return true;
    }

    /**
     * 待兑现的「滚到最近出口并高亮一次」：由「查找最近车站」在跳站后登记，
     * 等这一站的**出入口页签第一次露面**时兑现（见 onMounted），用的就是 focusExit ——
     * 与用户点小地图徽标完全同一套行为。只兑现一次即清空，免得很久以后再开这一站又被滚一次。
     */
    let pendingExitFocus = null;

    function requestExitFocus(stationId, exitCode) {
        pendingExitFocus = { stationId: String(stationId || ""), exitCode: String(exitCode || "") };
    }

    /** 点小地图上的徽标 → 滚到清单里对应的那条出口，并高亮一下当反馈 */
    function focusExit(box, code) {
        const item = [...(box.parentElement?.querySelectorAll(".cgo-exit-item") || [])]
            .find((el) => el.dataset.exit === code);
        if (!item) return;
        item.scrollIntoView({ behavior: "smooth", block: "center" });
        item.classList.add("is-focused");
        setTimeout(() => item.classList.remove("is-focused"), 1600);
    }

    /** 挂载小地图：取数 → 收集标记 → 容器可见后绘制（页签未展开时用 ResizeObserver 等它露面） */
    function mountMap(box, stationName, exits) {
        loadGeoData().then((geoData) => {
            if (!geoData || !box.isConnected) return;
            const markers = collectMarkers(geoData, stationName, exits);
            if (!markers.length) { box.remove(); return; }
            if (drawMap(box, markers)) return;
            const observer = new ResizeObserver(() => {
                if (drawMap(box, markers)) observer.disconnect();
            });
            observer.observe(box);
        });
    }

    /**
     * 该站各出口命中哪些设施类型（供筛选用）。
     *
     * ⚠️ 必须排掉「涉及站台层」的位置段：出口只存在于地面与站厅之间，
     * 而站内电梯恰恰爱这么写——「站厅-站台 A、D出入口附近（一号线换乘至蒲田路方向）」
     * 只因为文本里带了个 D，就会把青年大街的 D 口误判成「有电梯」，
     * 于是「携带行李」和「无障碍」两种筛选都会高亮一个其实没有地面电梯的口。
     */
    function facilityTypesByExit(stationId, facilityGlobals) {
        const table = pickData(facilityGlobals)?.[String(stationId || "")];
        const map = new Map();
        for (const facility of table || []) {
            for (const segment of facility.location || []) {
                const text = typeof segment === "string" ? segment : (segment?.text || "");
                if (/站台/.test(text)) continue;
                for (const code of window.CGoExitVertical?.codesOf?.(text) || []) {
                    if (!map.has(code)) map.set(code, new Set());
                    map.get(code).add(facility.type);
                }
            }
        }
        return map;
    }

    /** 当前城市声明的筛选模式（window.CGO_EXIT_FILTERS，由各城 {city}.js 配置） */
    function filterConfigs() {
        return Array.isArray(window.CGO_EXIT_FILTERS) ? window.CGO_EXIT_FILTERS : [];
    }

    /** 已注册的城市配置：cityId → register 时那份 config */
    const registered = new Map();

    /**
     * 该车站是否属于「有出入口概念的线路」。
     * 出入口只属于地铁 / 城市轨道车站：国铁散站（`rdot`）、轻铁、在建线都声明
     * `isPointOnly`（只落站点图元、不画走向），它们的站点即便在数据里被误收了条目，
     * 也不该出入口页签 —— 哈尔滨「哈尔滨站 / 哈尔滨北站 / 哈尔滨东站」就是国铁站点
     * 与同名地铁站坐标重合、被抓取脚本按站名把地铁侧出口一并写到国铁 ID 上。
     * 判定只用车站在引擎里已有的 `relatedLines` 与线路的 `isPointOnly`，不引入城市私有规则；
     * 线路数据取不到（引擎未挂 `window.linesData`）时按「有」处理，退回旧行为。
     */
    function onRidableLine(station) {
        const related = station?.relatedLines;
        const lines = window.linesData;
        if (!Array.isArray(related) || !related.length || !Array.isArray(lines)) return true;
        const pointOnlyIds = new Set(lines.filter((line) => line?.isPointOnly).map((line) => line.id));
        return related.some((id) => !pointOnlyIds.has(id));
    }

    /**
     * 该城某站名下的全部出口。
     * 出口数据以**本地车站 ID** 为键，这里用 data_stations 的 cn 反查（同站多 ID 取并集）。
     * 供「查找最近车站」顺带推荐最近出入口用（nearest-station.js）。
     */
    function exitsByStation(cityId, stationName) {
        const config = registered.get(String(cityId || ""));
        const table = config ? pickData(config.dataGlobals) : null;
        if (!table || typeof stationsData === "undefined") return [];
        return Object.entries(stationsData)
            .filter(([, station]) => station.cn === stationName)
            .flatMap(([id]) => table[id] || []);
    }

    /** 按设施类型过滤出口清单；types 传 null 表示恢复全部（同时同步地图上的徽标） */
    function applyFilter(container, types) {
        const matched = new Set();
        const items = [...container.querySelectorAll(".cgo-exit-item")];
        for (const item of items) {
            const own = String(item.dataset.facilities || "").split(" ").filter(Boolean);
            const hit = !types || types.some((type) => own.includes(type));
            item.hidden = !hit;
            if (hit) matched.add(item.dataset.exit);
        }
        // 可见的最后一条不带虚线底线（见 exits.css 的 .is-tail 说明）
        const shown = items.filter((item) => !item.hidden);
        for (const item of items) item.classList.toggle("is-tail", item === shown[shown.length - 1]);
        // 地图同步：命中的徽标跳出来，未命中的淡下去
        for (const pin of container.querySelectorAll(".cgo-exit-map-pin--exit")) {
            const hit = !types || matched.has(pin.textContent);
            pin.classList.toggle("is-hit", Boolean(types) && hit);
            pin.classList.toggle("is-dim", Boolean(types) && !hit);
        }
    }

    /** 当前城市登记的出入口配置（与 shared/station/exit-search.js 同口径解析，防跨城 ID 撞号） */
    function currentConfig() {
        const id = window.getActiveCity?.()?.id || window.CURRENT_CITY?.id || "";
        if (id && registered.has(id)) return registered.get(id);
        return registered.size === 1 ? registered.values().next().value : null;
    }

    /**
     * 该站每个出口命中的设施类型 `Map<口编号, Set<设施类型>>`——给行程规划的
     * 「携带行李 / 无障碍」需求筛选与合规提醒用。判定与页签筛选按钮同源
     * （facilityTypesByExit，含「排掉站台层」的防误判），城市未配 facilityGlobals 时返回空表。
     * ⚠️ 空表语义要区分：Map 里**没有该口** = 该口设施**未收录**；有口但命中为空 = 收录了却没有此类设施。
     */
    function exitFacilities(stationId) {
        const config = currentConfig();
        if (!config?.facilityGlobals) return new Map();
        return facilityTypesByExit(stationId, config.facilityGlobals);
    }

    /**
     * 该站每个出口命中的设施**明细** `Map<口编号, [{type, name, icon, text}]>`——
     * 取自 CGoExitVertical.collect（含城市搬迁前缀判据），供行程结果把「符合需求的
     * 设施 + 位置原文」搬过来展示；城市未接设施层 / 未配 facilityGlobals 时返回空表。
     */
    function exitFacilityRows(stationId) {
        const config = currentConfig();
        const facilities = config?.facilityGlobals ? pickData(config.facilityGlobals)?.[String(stationId || "")] : null;
        if (!Array.isArray(facilities) || !window.CGoExitVertical?.collect) return new Map();
        return window.CGoExitVertical.collect(facilities);
    }

    /**
     * 该站的设施明细（**不按口归组、不排站台层**）`[{type, name, icon, text}]`——
     * 给行程结果的换乘段列出「需求相关设施 + 位置原文」。**只留与换乘 / 乘车有关的位置段**：
     * 先保「站台 / 换乘」（核心链路），再剔「地面 / 出入口」（那是进出站口的链路，
     * 对换乘旅客没用），其余站内段（如「站厅层 站厅中部」= 站厅去站台）保留；
     * 一段都不剩的设施整条不出。展示名与图标取城市 CGO_EXIT_VERTICAL.types；
     * 未配 facilityGlobals 或该声明时返回空数组。
     */
    function stationFacilityRows(stationId) {
        const config = currentConfig();
        const table = config?.facilityGlobals ? pickData(config.facilityGlobals)?.[String(stationId || "")] : null;
        const vtypes = window.CGO_EXIT_VERTICAL?.types;
        if (!Array.isArray(table) || !vtypes) return [];
        const ridesRelated = (text) => {
            if (/站台|换乘/.test(text)) return true;
            if (/地面|出入口/.test(text)) return false;
            return true;
        };
        const rows = [];
        for (const facility of table) {
            const meta = vtypes[facility.type];
            if (!meta) continue;
            // 位置段保留线路归属：多线换乘站的段是 { line, text } 对象（line = 所属线路 ID），
            // 明细区据此加线路名前缀——与车站详情设施板块（facilities.js）同一口径
            const parts = [];
            for (const seg of facility.location || []) {
                const text = typeof seg === "string" ? seg : (seg?.text || "");
                if (!text || !ridesRelated(text)) continue;
                parts.push({ line: (typeof seg === "object" && seg?.line) || null, text });
            }
            if (!parts.length) continue;
            rows.push({
                type: facility.type,
                name: meta.name || facility.type,
                icon: meta.icon || "info",
                parts,
                text: parts.map((p) => p.text).join(" / ")
            });
        }
        return rows;
    }

    /**
     * 行程规划选口的需求联动：该站的出入口页签在场时，按需求把合规口的
     * 小地图徽标挑出来（.is-hit）、其余淡出（.is-dim）——复用页签筛选按钮的
     * applyFilter；types 为空即恢复全部。页签不在场（没开信息板）则静默不动作。
     */
    function highlightFor(stationId, types) {
        const map = [...document.querySelectorAll("#info-panel .cgo-exit-map")]
            .find((el) => el.dataset.stationId === String(stationId || ""));
        const section = map?.closest(".cgo-exit-section");
        if (section) applyFilter(section, Array.isArray(types) && types.length ? types : null);
    }

    /**
     * 出口徽标：方形描边 + 编号。
     * 编号拆成「主字 + 下标」——第一段连续字母或数字作主字，其后部分转下标（C1 → C₁、A2 → A₂），
     * 让多段编号也能塞进正方形；仍放不下的由 onMounted 按实测宽度横向压扁，不撑破外形。
     */
    function badgeHtml(code) {
        const text = String(code ?? "");
        const matched = text.match(/^([A-Za-z]+|\d+)([\s\S]*)$/);
        const main = matched ? matched[1] : text;
        const sub = matched ? matched[2] : "";
        return `<span class="cgo-exit-badge"><span class="cgo-exit-code">${escapeHtml(main)}${sub ? `<sub>${escapeHtml(sub)}</sub>` : ""}</span></span>`;
    }

    /**
     * 一条出口：字母徽标 + 所属线路 + 公交线路 + 周边地标 + 该口的扶梯/电梯；暂停使用的加标记。
     * verticals 由 CGoExitVertical.collect() 给出（城市未接入该层时为空数组）。
     */
    function exitHtml(exit, verticals = [], facilities = null, ctx = {}) {
        const rows = [];
        if (exit.lines?.length) {
            rows.push(`<div class="cgo-exit-row">
                <cgo-icon name="route" size="13"></cgo-icon>
                <span>${exit.lines.map(escapeHtml).join(" · ")}</span>
            </div>`);
        }
        if (exit.buses?.length) {
            rows.push(`<div class="cgo-exit-row">
                <cgo-icon name="bus" size="13"></cgo-icon>
                <span>${exit.buses.map(escapeHtml).join("、")}</span>
            </div>`);
        }
        if (exit.landmarks?.length) {
            rows.push(`<div class="cgo-exit-row">
                <cgo-icon name="location" size="13"></cgo-icon>
                <span>${exit.landmarks.map(escapeHtml).join(" · ")}</span>
            </div>`);
        }
        const verticalHtml = verticals.length && window.CGoExitVertical?.rowHtml
            ? verticals.map((item) => window.CGoExitVertical.rowHtml(item)).join("")
            : "";
        // 标题：`desc`（维基「出口指示」原文，或相对所属线路站厅的方位填空，如「朝阳街路东」「西北口」）
        // 本身就作为出口的**正经标题**展示；只有没有 desc 的口才回落成「A 口 / 1 号口」这样的编号文案
        // ——编号已由左侧方形徽标承载，标题里不再重复一遍。
        const titleText = exit.desc || `${exit.name}${/^\d/.test(String(exit.name ?? "")) ? " 号口" : " 口"}`;
        // 兜底方位：仅在没有 desc 时才显示「最近道路的侧向」（roads），
        // 免得同一个方位在标题与副行里各说一遍。
        const position = exit.desc ? "" : (exit.roads?.length ? exit.roads.join("/") : "");
        const positionHtml = position ? `<span class="cgo-exit-pos">${escapeHtml(position)}</span>` : "";
        return `
            <div class="cgo-exit-item${exit.closed ? " is-closed" : ""}" data-exit="${escapeHtml(exit.name)}" data-facilities="${escapeHtml([...(facilities || [])].join(" "))}">
                ${badgeHtml(exit.name)}
                <div class="cgo-exit-body">
                    <div class="cgo-exit-title">
                        <span>${escapeHtml(titleText)}</span>
                        ${isDescPending(exit) ? pendingBadgeHtml(exit, ctx) : ""}
                        ${positionHtml}
                        ${exit.closed ? `<span class="cgo-exit-closed">暂停使用</span>` : ""}
                    </div>
                    ${rows.join("")}
                    ${verticalHtml}
                </div>
            </div>
        `;
    }

    function register(config) {
        const { idPrefix, dataGlobals, facilityGlobals } = config;
        if (!idPrefix) return;

        const moduleId = `${idPrefix}-exits`;
        registered.set(idPrefix, config);
        injectStyle();
        if (!window.StationBoard?.registerModule) return;

        const getExits = (stationId) => {
            const list = pickData(dataGlobals)?.[String(stationId || "")];
            return Array.isArray(list) ? list : [];
        };

        /**
         * 该站每个出口名下的扶梯 / 电梯：数据取自城市设施表，判定与归组在共享层
         * `exit-vertical.js`（城市用 window.CGO_EXIT_VERTICAL 声明类型与前缀规则）。
         * 未配 facilityGlobals、或该层未加载时返回空表，出口卡片维持原样。
         */
        const getVerticals = (stationId) => {
            const collect = window.CGoExitVertical?.collect;
            const facilities = pickData(facilityGlobals)?.[String(stationId || "")];
            if (!collect || !Array.isArray(facilities)) return new Map();
            return collect(facilities);
        };

        /**
         * 该车站是否有出入口：页签调度与内容模块共用同一条判据。
         * 只被点线（国铁 / 轻铁 / 在建线）引用的车站没有出入口概念 —— 同名地铁站的
         * 出口被误写到国铁站点 ID 上时，这道守卫会拦住它。
         */
        const hasExitsFor = (station) => onRidableLine(station) && getExits(station?.id).length > 0;

        /**
         * 出入口页签按需注入 —— 页签的「有没有」由共享层说了算，core 无需改动。
         *
         * 页签本身由 core 依据城市 `stationBoard.tabs` 的**静态**声明渲染，于是没有
         * 出入口数据的车站（国铁散站、本城未收录出口的站）也会留下一张点开即空白的
         * 页签。core 的渲染顺序恰好给了共享层一个介入点：它先渲染 `header` 槽的模块、
         * 再遍历自定义页签，而 `resolveCityConfig` 取到的正是 `city.stationBoard.tabs`
         * 这个**数组本身**（不是拷贝）—— 故在 header 阶段原地增删那一项，就能决定该
         * 页签出不出现，紧随其后的页签遍历会立刻读到新状态。
         */
        window.StationBoard.registerModule({
            id: `${moduleId}-tab`,
            name: `${config.name || idPrefix}出入口页签`,
            targetTab: "header",
            order: 1,
            render({ station, city }) {
                const tabs = city?.stationBoard?.tabs;
                if (!Array.isArray(tabs)) return "";
                const index = tabs.findIndex((tab) => tab && tab.id === moduleId);
                if (hasExitsFor(station)) {
                    if (index === -1) tabs.push({ id: moduleId, title: config.tabTitle || "出入口", icon: config.tabIcon || "gate" });
                } else if (index !== -1) {
                    tabs.splice(index, 1);
                }
                return "";
            }
        });

        window.StationBoard.registerModule({
            id: moduleId,
            name: config.name || `${idPrefix}出入口`,
            targetTab: `${idPrefix}-exits`,
            order: typeof config.order === "number" ? config.order : 10,
            shouldRender: ({ station }) => hasExitsFor(station),
            render({ station }) {
                const exits = getExits(station?.id);
                if (!exits.length) return "";
                const verticals = getVerticals(station?.id);
                const filters = filterConfigs();
                const typesByExit = filters.length ? facilityTypesByExit(station?.id, facilityGlobals) : new Map();
                // 只列出「本站确有出口命中」的模式，免得点开是一份空清单
                const usable = filters.filter((item) => item.types?.some((type) => [...typesByExit.values()].some((set) => set.has(type))));
                const filtersHtml = usable.length
                    ? `<div class="cgo-exit-filters">${usable.map((item) => `<button type="button" class="cgo-exit-filter" data-filter="${escapeHtml(item.id)}" aria-pressed="false"><cgo-icon name="${escapeHtml(item.icon || "info")}" size="13"></cgo-icon>${escapeHtml(item.name)}</button>`).join("")}</div>`
                    : "";
                return `
                    <div class="cgo-exit-section">
                        <div class="cgo-exit-map" data-station-id="${escapeHtml(station?.id || "")}" data-station-name="${escapeHtml(station?.cn || "")}"></div>
                        ${filtersHtml}
                        <div class="cgo-exit-list">${exits.map((exit) => exitHtml(exit, verticals.get(exit.name) || [], typesByExit.get(exit.name), { stationId: station?.id, stationCn: station?.cn })).join("")}</div>
                        ${config.sourceNote ? `<div class="cgo-exit-source">
                            <cgo-icon name="info" size="12"></cgo-icon>
                            <span>${escapeHtml(config.sourceNote)}</span>
                        </div>` : ""}
                    </div>
                `;
            },
            /**
             * 方形徽标宽度固定，多段编号（C12、D10 之类）未必塞得下：
             * 按实测宽度把内容横向压扁（同 map-tools 标注数值的做法），不把正方形撑成长方形。
             * 监听器不需要解绑——信息板换站会重建整块 DOM，旧节点连同监听一并丢弃。
             */
            onMounted(container) {
                container.querySelectorAll(".cgo-exit-badge").forEach((badge) => {
                    const code = badge.querySelector(".cgo-exit-code");
                    if (!code) return;
                    const available = badge.clientWidth - 2;   // 减去左右各 1px 描边内的余白
                    const needed = code.offsetWidth;
                    if (needed > available && available > 0) {
                        code.style.transform = `scaleX(${(available / needed).toFixed(3)})`;
                    }
                });

                // 分布小地图：数据是异步的、且出口页签可能还没展开，等待与重试都在 mountMap 里
                const mapBox = container.querySelector(".cgo-exit-map");
                if (mapBox) {
                    mountMap(mapBox, mapBox.dataset.stationName || "", getExits(mapBox.dataset.stationId));
                }

                // 「查找最近车站」跳过来的那一站：等出口清单**真正露面**（页签刚切过来时容器还没尺寸），
                // 再把最近那个口滚到眼前并高亮一次 —— 与点小地图徽标同一套行为，不弹任何提示。
                if (pendingExitFocus && mapBox && pendingExitFocus.stationId === mapBox.dataset.stationId) {
                    const { exitCode } = pendingExitFocus;
                    pendingExitFocus = null;   // 只兑现一次
                    const list = container.querySelector(".cgo-exit-list");
                    const reveal = () => {
                        if (!list || !list.clientHeight) return false;
                        focusExit(mapBox, exitCode);
                        return true;
                    };
                    if (!reveal()) {
                        const observer = new ResizeObserver(() => { if (reveal()) observer.disconnect(); });
                        observer.observe(list || container);
                    }
                }

                // 「待补充」标：事件委托在清单上，点开反馈面板（正文、复制与 Issue 都由共享层出）
                const exitList = container.querySelector(".cgo-exit-list");
                exitList?.addEventListener("click", (ev) => {
                    const btn = ev.target.closest?.("[data-exit-feedback]");
                    if (!btn || !exitList.contains(btn)) return;
                    openFeedback({
                        cityId: idPrefix,
                        stationId: btn.dataset.stationId,
                        stationCn: btn.dataset.stationCn,
                        exitCode: btn.dataset.exitCode
                    });
                });

                // 筛选模式：单选，再点一次取消（互斥，避免叠加出空清单）
                const buttons = [...container.querySelectorAll(".cgo-exit-filter")];
                for (const button of buttons) {
                    button.addEventListener("click", () => {
                        const active = button.getAttribute("aria-pressed") === "true";
                        for (const other of buttons) other.setAttribute("aria-pressed", "false");
                        button.setAttribute("aria-pressed", String(!active));
                        const types = active ? null : filterConfigs().find((item) => item.id === button.dataset.filter)?.types;
                        applyFilter(container, types || null);
                    });
                }
            }
        });

        document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
            detail: { cityId: idPrefix, moduleId }
        }));
    }

    // 事件驱动：行程规划面板（route-panel.js）只管广播 cgo:route-exit-filter { sid, types }，
    // 本模块听到就地联动小地图徽标，听不到（页签不在场）就什么都不发生——两侧零耦合
    document.addEventListener("cgo:route-exit-filter", (event) => {
        const { sid, types } = event.detail || {};
        if (sid) highlightFor(sid, types);
    });

    // openFeedback 一并导出：面板实体已迁到 CGoFeedback，这里保留转发入口，
    // 免得城市模块里既有的 `CGoExits.openFeedback(...)` 调用失效
    window.CGoExits = { register, registered, exitsByStation, requestExitFocus, openFeedback, exitFacilities, exitFacilityRows, stationFacilityRows, highlightFor };
})();
