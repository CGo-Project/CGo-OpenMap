/**
 * CGo OpenMap - 悉尼城市业务逻辑与线网画法 (city/sydney/sydney.js)
 *
 * ==============================================================================
 * 悉尼轨道交通（Sydney Trains / Sydney Metro）线网图复刻说明
 * ==============================================================================
 * 1. 全部几何数据（线路折线、站点图元、站名锚点、装饰图形）逐点提取自 Transport for NSW
 *    官方矢量线网图 "Sydney rail network"（APXP_SRM_20240701，A4 595.276 × 841.89 pt）；
 * 2. 画布坐标 = PDF 点坐标 × 200/72 − (15, 92)，即与官方图 200dpi 位图逐像素对齐；
 * 3. 站点图元按官方画法逐站下发（普通站白心圆环、终点站色心白环、换乘站同心三环、
 *    地铁站 M 徽标）由 renderStationIcon 生成；多线换乘的灰色底衬（Interchange 胶囊）
 *    需要正片叠底压在线路之上，由 syncHalos() 单独成层绘制；
 * 4. 官方图站名为纯英文，且换乘站加粗、主要枢纽放大、45° 斜排，
 *    由 syncLabels() 按 data_stations.js 中的 align / rotate / labelSize / labelBold 还原。
 *
 * 本文件不修改 core/，悉尼专属逻辑只放在本目录。
 */

(function () {
    "use strict";

    /** 载入悉尼城市专属样式表（背景色、线宽、站名排版） */
    (function loadCityStylesheet() {
        const href = "./city/sydney/style.css";
        if (document.querySelector(`link[href^="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        const v = window.CGO_ASSET_VERSION;
        link.href = v ? `${href}?v=${v}` : href;
        document.head.appendChild(link);
    })();
    document.documentElement.classList.add("map-sydney");

    // ── 官方图实测常量（PDF 点 × 200/72 = 画布像素）────────────────────────────
    const RING = 1.36;          // 站点圆环描边宽度 0.49pt
    const METRO_RING = 1.47;    // 地铁 M 徽标描边宽度 0.53pt
    const STEP = 1.5;           // 换乘站同心环每层收缩 0.54pt
    const EOL_W = 12.0;     // 终点渐变端块宽度 4.3pt
    const EOL_L = 18.0;     // 端块沿线路方向长度 6.5pt
    let eolSeq = 0;

    /** 旋转后的换乘底衬在水平/垂直方向上的半宽半高（用于算图元包围盒与站名留白） */
    function haloHalfExtent(halo) {
        const t = (halo.ang || 0) * Math.PI / 180;
        const co = Math.abs(Math.cos(t)), si = Math.abs(Math.sin(t));
        return { hw: (halo.w * co + halo.h * si) / 2, hh: (halo.w * si + halo.h * co) / 2 };
    }

    /** 站点图元：按 data_stations.js 中逐站记录的官方图元参数绘制 */
    function renderStationIcon(station) {
        const mk = station.marker;
        if (!mk || !mk.parts || !mk.parts.length) return null;

        let half = 0;
        mk.parts.forEach((q) => {
            half = Math.max(half, Math.abs(q.dx) + q.w / 2 + RING, Math.abs(q.dy) + q.h / 2 + RING);
            if (q.t === "end") half = Math.max(half, Math.abs(q.dx) + 13, Math.abs(q.dy) + 13);
        });
        const box = Math.ceil(half * 2) + 2;
        const c = box / 2;

        const shape = (cx, cy, w, h, attrs) =>
            `<rect x="${(cx - w / 2).toFixed(2)}" y="${(cy - h / 2).toFixed(2)}"` +
            ` width="${w.toFixed(2)}" height="${h.toFixed(2)}"` +
            ` rx="${(Math.min(w, h) / 2).toFixed(2)}" ry="${(Math.min(w, h) / 2).toFixed(2)}" ${attrs}/>`;

        let html = "", defs = "";
        // 终点站的线路色渐变端块（官方图 "End of line" 标记）
        mk.parts.forEach((q) => {
            if (q.t !== "end") return;
            const gid = "sydeol" + (eolSeq++);
            defs += `<linearGradient id="${gid}" x1="0" y1="1" x2="0" y2="0">` +
                    `<stop offset="0" stop-color="${q.c}" stop-opacity="0.42"/>` +
                    `<stop offset="1" stop-color="${q.c}" stop-opacity="0"/></linearGradient>`;
            const cx = c + q.dx + Math.cos((q.ang || 0) * Math.PI / 180) * (EOL_L / 2 - q.w / 2);
            const cy = c + q.dy + Math.sin((q.ang || 0) * Math.PI / 180) * (EOL_L / 2 - q.w / 2);
            html += `<g transform="translate(${cx.toFixed(2)},${cy.toFixed(2)})` +
                    ` rotate(${((q.ang || 0) + 90).toFixed(1)})" class="syd-eol">` +
                    `<rect x="${(-EOL_W / 2).toFixed(2)}" y="${(-EOL_L / 2).toFixed(2)}"` +
                    ` width="${EOL_W}" height="${EOL_L}" rx="3" fill="url(#${gid})"/></g>`;
        });
        mk.parts.forEach((q) => {
            const cx = c + q.dx, cy = c + q.dy;
            if (q.t === "metro" || q.t === "metroC") {
                html += shape(cx, cy, q.w, q.h,
                    `fill="#FFFFFF" stroke="${q.c}" stroke-width="${METRO_RING}"`);
                html += `<text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" fill="${q.c}"` +
                        ` class="syd-m" font-size="${(q.w * 0.68).toFixed(2)}"` +
                        ` text-anchor="middle" dominant-baseline="central">M</text>`;
            } else if (q.t === "tsf") {
                html += shape(cx, cy, q.w, q.h, `fill="${q.c}"`);
                html += shape(cx, cy, q.w - STEP, q.h - STEP, `fill="#FFFFFF"`);
                html += shape(cx, cy, q.w - STEP * 2, q.h - STEP * 2, `fill="${q.c}"`);
            } else if (q.t === "end") {
                html += shape(cx, cy, q.w, q.h, `fill="${q.c}" stroke="#FFFFFF" stroke-width="${RING}"`);
            } else {
                html += shape(cx, cy, q.w, q.h, `fill="#FFFFFF" stroke="${q.c}" stroke-width="${RING}"`);
            }
        });

        return {
            html: `<svg viewBox="0 0 ${box} ${box}" xmlns="http://www.w3.org/2000/svg">` +
                  (defs ? `<defs>${defs}</defs>` : "") + `${html}</svg>`,
            width: box, height: box,
            className: mk.halo ? "syd-marker syd-interchange" : "syd-marker"
        };
    }

    // ── 站名排版还原（锚点距站点图元边缘 2.7pt，45° 斜排，加粗与枢纽放大）──────
    // 官方图实测：站名墨迹边缘距站点图元外缘 2.7pt ≈ 7.5px；
    // 竖向（上/下方站名）留白略紧，为 1.6pt ≈ 4.4px；斜角方向为 1.5pt ≈ 4.2px。
    const GAP_H = 7.5;      // 左右向留白
    const GAP_V = 4.4;      // 上下向留白
    const GAP_D = 4.2;      // 斜角向留白
    // 行高盒与文字墨迹的垂直差（字号 13.8px / 行高 14.6px 实测）
    const INK_MID = 0.6;    // 垂直居中时墨迹中心相对行盒中心的偏移
    const INK_BOT = 1.6;    // 贴下缘时基线距行盒底的距离
    const INK_TOP = 1.4;    // 贴上缘时字冠距行盒顶的距离

    const PLACE = {
        "right":        { ax: "R", ay: "C", tf: "translate(0, -50%)",     o: "0% 50%" },
        "left":         { ax: "L", ay: "C", tf: "translate(-100%, -50%)", o: "100% 50%" },
        "top":          { ax: "C", ay: "T", tf: "translate(-50%, -100%)", o: "50% 100%" },
        "bottom":       { ax: "C", ay: "B", tf: "translate(-50%, 0)",     o: "50% 0%" },
        "top-right":    { ax: "R", ay: "T", tf: "translate(0, -100%)",    o: "0% 100%" },
        "top-left":     { ax: "L", ay: "T", tf: "translate(-100%, -100%)", o: "100% 100%" },
        "bottom-right": { ax: "R", ay: "B", tf: "translate(0, 0)",        o: "0% 0%" },
        "bottom-left":  { ax: "L", ay: "B", tf: "translate(-100%, 0)",    o: "100% 0%" }
    };

    /** 站点图元（含换乘底衬）在四个方向上的外缘偏移量 */
    function markerExtent(s) {
        let L = 0, R = 0, T = 0, B = 0;
        const acc = (dx, dy, w, h) => {
            L = Math.min(L, dx - w / 2); R = Math.max(R, dx + w / 2);
            T = Math.min(T, dy - h / 2); B = Math.max(B, dy + h / 2);
        };
        const mk = s.marker;
        if (mk && mk.parts) mk.parts.forEach((q) => acc(q.dx, q.dy, q.w, q.h));
        if (mk && mk.halo) {
            const he = haloHalfExtent(mk.halo);
            acc(mk.halo.dx, mk.halo.dy, he.hw * 2, he.hh * 2);
        }
        return { L, R, T, B };
    }

    function placeLabel(el, s) {
        const p = PLACE[s.align] || PLACE.right;
        const e = markerExtent(s);
        const diag = !!s.rotate || (p.ax !== "C" && p.ay !== "C");
        const gh = diag ? GAP_D : GAP_H;
        const gv = diag ? GAP_D : GAP_V;
        let left = s.x, top = s.y;
        if (p.ax === "R") left = s.x + e.R + gh;
        else if (p.ax === "L") left = s.x + e.L - gh;
        if (p.ay === "T") top = s.y + e.T - gv + INK_BOT;
        else if (p.ay === "B") top = s.y + e.B + gv - INK_TOP;
        else top = s.y + INK_MID;
        if (s.offset) { left += s.offset.x || 0; top += s.offset.y || 0; }
        el.style.left = left + "px";
        el.style.top = top + "px";
        el.style.transformOrigin = p.o;
        el.style.transform = s.rotate ? `${p.tf} rotate(${s.rotate}deg)` : p.tf;
        el.style.textAlign = (p.ax === "L") ? "right" : (p.ax === "R" ? "left" : "center");
    }

    function syncLabels() {
        const layer = document.getElementById("labels-layer");
        if (!layer || typeof stationsData === "undefined") return;
        layer.querySelectorAll(".label-group").forEach((el) => {
            const s = stationsData[el.dataset.sid];
            if (!s || el.dataset.sydDone === "1") return;
            el.dataset.sydDone = "1";
            if (s.labelSize === "big") el.classList.add("syd-big");
            if (s.labelBold) el.classList.add("syd-bold");
            if (s.labelTone === "grey") el.classList.add("syd-grey");
            if (s.labelTone === "pink") el.classList.add("syd-pink");
            if (s.rotate) el.classList.add("syd-rot");
            if (s.labelLines) {
                const sp = el.querySelector(".stacn");
                if (sp) sp.innerHTML = s.labelLines.join("<br>");
            }
            placeLabel(el, s);
        });
    }

    // 官方图 CBD 的 "City" 浅色底板：叠在线路之上的半透明色块，线路会被压深一档。
    // 几何实测自官方 PDF（画布像素），与换乘底衬共用同一个正片叠底图层。
    const CITY_TINT = { x: 1141.7, y: 659.5, w: 184.5, h: 193.3, r: 30 };

    /**
     * 正片叠底叠加层：换乘站灰色底衬（Interchange）与 CBD 的 "City" 底板。
     * 两者在官方图上都是压在线路之上、把线路压深一档的半透明色块；
     * 挂在站点图元里没用（图元自身的 transform 会形成隔离组），因此单独成层。
     */
    function syncHalos() {
        const content = document.getElementById("map-content");
        if (!content || typeof stationsData === "undefined") return;
        let layer = document.getElementById("syd-halo-layer");
        if (!layer) {
            layer = document.createElement("div");
            layer.id = "syd-halo-layer";
            content.insertBefore(layer, document.getElementById("lines-layer"));
        }
        if (layer.dataset.built === "1") return;
        layer.dataset.built = "1";
        const frag = document.createDocumentFragment();
        const city = document.createElement("div");
        city.className = "syd-city-tint";
        city.style.left = CITY_TINT.x + "px";
        city.style.top = CITY_TINT.y + "px";
        city.style.width = CITY_TINT.w + "px";
        city.style.height = CITY_TINT.h + "px";
        city.style.borderRadius = CITY_TINT.r + "px";
        frag.appendChild(city);
        Object.keys(stationsData).forEach((sid) => {
            const s = stationsData[sid];
            const h = s.marker && s.marker.halo;
            if (!h) return;
            const pill = document.createElement("div");
            pill.className = "syd-halo";
            pill.style.left = (s.x + h.dx) + "px";
            pill.style.top = (s.y + h.dy) + "px";
            pill.style.width = h.w + "px";
            pill.style.height = h.h + "px";
            pill.style.transform = `translate(-50%, -50%) rotate(${h.ang || 0}deg)`;
            frag.appendChild(pill);
        });
        layer.appendChild(frag);
    }

    function installLabelObserver() {
        const layer = document.getElementById("labels-layer");
        if (!layer || layer.dataset.sydObserver === "1") return false;
        layer.dataset.sydObserver = "1";
        let frame = 0;
        const mo = new MutationObserver(() => {
            if (frame) return;
            frame = requestAnimationFrame(() => { frame = 0; syncLabels(); });
        });
        mo.observe(layer, { childList: true });
        syncLabels();
        syncHalos();
        return true;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            if (!installLabelObserver()) setTimeout(installLabelObserver, 60);
            setTimeout(() => { syncLabels(); syncHalos(); }, 150);
        });
    } else {
        installLabelObserver();
        setTimeout(() => { syncLabels(); syncHalos(); }, 150);
    }

    // ── 线路徽标元数据（与 data_lines.js、assets/line/*.svg 一一对应）──────────
    const LINE_BADGE_META = {};
    [
        ["T1", "T1 North Shore & Western Line", "#F79210"],
        ["T2", "T2 Leppington & Inner West Line", "#0897D2"],
        ["T3", "T3 Liverpool & Inner West Line", "#F1511B"],
        ["T4", "T4 Eastern Suburbs & Illawarra Line", "#2057A9"],
        ["T5", "T5 Cumberland Line", "#C41191"],
        ["T6", "T6 Lidcombe & Bankstown Line", "#77351D"],
        ["T7", "T7 Olympic Park Line", "#6A7D8B"],
        ["T8", "T8 Airport & South Line", "#0B974A"],
        ["T9", "T9 Northern Line", "#D31C2E"],
        ["M1", "M1 Metro North West & Bankstown Line", "#06969F"],
        ["CONV", "Line under conversion - bus services", "#F033A3"],
        ["MW", "Sydney Metro West (under construction)", "#9B9792"],
        ["WSA", "Sydney Metro - Western Sydney Airport (under construction)", "#9B9792"]
    ].forEach(([id, name, color]) => {
        LINE_BADGE_META[name] = {
            id, color, svgclr: color, svgtext: "#ffffff",
            svg: `./city/sydney/assets/line/${id}.svg`,
            company: "Transport for NSW"
        };
    });

    const SydneyCity = {
        id: "sydney",
        name: "悉尼",
        searchCity: "悉尼",
        center: { x: 780, y: 830 },
        defaultScale: 0.62,
        mapSize: { width: 1542, height: 1706 },
        officialMapUrl: "https://transportnsw.info/routes/train",
        // 官方线网图是示意图（CBD 被放大、郊区被压缩），也不含逐站区间里程；
        // data_lines.js 里的 distances 一律按「PDF 点距 × 70 米」折算，即画布像素 × 25.2，
        // 这里保持同一口径，站间距仅作示意估算，不代表实际营业里程。
        schematicMetersPerPixel: 25.2,

        maintainers: [
            { name: "待认领", role: "城市主理人招募中", isRecruiting: true,
              github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md" }
        ],

        // 线路徽标放在本城市目录下（assets/line/*.svg），引擎按 svg 文件名反查线路时
        // 匹配的是不带路径的文件名，查不到本城市的线路；这里补一份按线名索引的元数据，
        // 让徽标注入时仍能拿到线路标志色。
        LINE_META: LINE_BADGE_META,
        LINE_SORT_ORDER: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "M1", "CONV",
                          "MW", "WSA"],
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        MAP_12306: {},

        dataFiles: { stanameCsvUrl: "./city/sydney/staname.csv" },

        /** 悉尼站点画法：官方图元逐站还原 */
        renderStationIcon,

        /** 站名排版由 syncLabels() 统一处理，这里不再额外下发样式 */
        getStationLabelStyle(station) {
            return station && station.labelStyle ? station.labelStyle : null;
        },

        getNavigationUrl(stationName) {
            return `https://transportnsw.info/stop?q=${encodeURIComponent(stationName + " Station")}`;
        },
        getRailway12306Url(stationName) {
            return `https://transportnsw.info/stop?q=${encodeURIComponent(stationName + " Station")}`;
        },
        getSuburbanLinks() { return null; },
        formatOwnerName(raw) { return raw || "Transport for NSW"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },

        stacard: { getRenderer: () => null },
        async initStaCard() { return null; },
        hasStaCard() { return false; },
        getStaCardHtml() { return ""; },
        async renderStaCards() { return null; }
    };

    window.SYDNEY_CITY = SydneyCity;
    window.CURRENT_CITY = SydneyCity;
    window.CityDataManager?.registerCity?.({
        id: SydneyCity.id,
        name: SydneyCity.name,
        folder: "./city/sydney",
        mainLogic: "./city/sydney/sydney.js",
        center: SydneyCity.center,
        defaultScale: SydneyCity.defaultScale,
        mapSize: SydneyCity.mapSize,
        searchCity: SydneyCity.searchCity,
        title: "CGo OpenMap - 悉尼轨道交通线路图",
        keywords: "CGo OpenMap, Sydney Trains, Sydney Metro, 悉尼地铁, 悉尼轨道交通, 线路图",
        description: "由 CGo OpenMap 驱动的悉尼轨道交通交互线路图，逐像素复刻 Transport for NSW 官方 Sydney rail network 线网图。",
        officialMapUrl: SydneyCity.officialMapUrl,
        isDefault: false,
        ...SydneyCity
    });

    console.log("[SydneyCity] 悉尼城市模块加载完成。");
})();
