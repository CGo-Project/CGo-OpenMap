/**
 * CGo OpenMap - 深圳城市业务逻辑与线网画法 (city/shenzhen/shenzhen.js)
 *
 * ==============================================================================
 * 深圳轨道交通线网图说明
 * ==============================================================================
 * 1. 线路走向、车站位置、换乘胶囊图元与站名排布，按《深圳市轨道交通运营线路网络图》
 *    （深圳市交通运输局 2026 年 1 月公布的 2025 年 12 月版矢量图）逐点量取后重新绘制，
 *    画布 = PDF 坐标 × 0.4235（12.75 pt 线宽对齐引擎 5.4 px），详见 data_lines.js；
 * 2. 版权规避：不收录原图标题、深圳地铁标志、铁路路徽与二维码，图标方块改用 CGoUI 通用图标；
 *    站名不使用原图字形轮廓，而以开源字体 Noto Sans SC / Arimo（SIL OFL 1.1 / Apache 2.0）
 *    按原图墨迹包围盒逐行贴合排版；本图为非官方同人作品，与深圳市地铁集团有限公司无关；
 * 3. 与香港衔接：注册表里声明了 neighbors，由 core/city-neighbors.js 统一处理影子与切换；
 *    本文件只负责图上港铁车站（罗湖 / 上水 / 落马洲）跳转香港线路图，以及口岸车站的通关信息；
 * 4. 导航：按用户所在位置选择地图服务（中国内地用高德，其它地区用 Google 地图）。
 *
 * 本文件不修改 core/，深圳专属逻辑只放在本目录。
 */

(function () {
    "use strict";

    const VER = window.CGO_ASSET_VERSION;
    function addStylesheet(href, versioned) {
        if (document.querySelector(`link[href^="${href}"]`)) return Promise.resolve();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = versioned && VER ? `${href}?v=${VER}` : href;
        const done = new Promise((res) => { link.onload = res; link.onerror = res; });
        document.head.appendChild(link);
        return done;
    }
    addStylesheet("./city/shenzhen/style.css", true);
    document.documentElement.classList.add("map-shenzhen");

    // 站名直接用系统黑体（苹方 / 微软雅黑 / 思源黑体），与官方线网图风格一致。
    // 不再加载网页字体：Noto Sans SC 拆成上百个分片，下载期间要以回退字体先排一遍、到达后再整体重排，
    // 深圳刚打开时的卡顿主要就来自这次重排与分片字体的逐行量字。
    const FONT_CJK = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif';
    const FONT_LAT = '"Helvetica Neue", Arial, "Liberation Sans", sans-serif';

    function stationMap() {
        return window.processedStations && Object.keys(window.processedStations).length
            ? window.processedStations
            : (typeof stationsData !== "undefined" ? stationsData : {});
    }
    function allLines() {
        return (typeof linesData !== "undefined" && Array.isArray(linesData)) ? linesData : (window.linesData || []);
    }
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

    // ==========================================================================
    // 1. 车站图元：普通站为线路色圆环，换乘站为深色描边的白色胶囊
    // ==========================================================================
    const RING_W = 1.2;       // 2.83 pt × 0.4235
    const CAP_W = 1.68;       // 3.97 pt × 0.4235
    function renderStationIcon(station) {
        const mk = station.mk;
        if (!mk || !mk.p) return null;
        const w = mk.w + 2, h = mk.h + 2;
        const body = mk.p.map((p) => {
            const dark = p.c === "#231916";
            const cls = station.hk ? "sz-mk sz-mk-hk" : dark ? "sz-mk sz-mk-ic" : "sz-mk";
            return `<path class="${cls}" d="${p.d}" style="--c:${p.c}" stroke-width="${dark ? CAP_W : RING_W}"/>`;
        }).join("");
        const pair = mk.p.length > 1 ? "sz-marker-pair" : "";
        return {
            html: `<svg viewBox="${(-w / 2).toFixed(2)} ${(-h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
            width: w, height: h,
            className: `sz-marker ${pair} ${mk.p.some((p) => p.c === "#231916") ? "sz-ic" : ""}`.trim()
        };
    }

    // ==========================================================================
    // 2. 按墨迹包围盒逐行贴合排版（站名与装饰文字共用）
    // ==========================================================================
    const measureCtx = document.createElement("canvas").getContext("2d");
    let ctxFont = "";
    /** 量字结果按「字体 + 文本」缓存；ctx.font 只在变化时才设置（每次设置都要重新解析字体） */
    const metricCache = new Map();
    function measure(font, text) {
        const key = font + "\u0000" + text;
        let r = metricCache.get(key);
        if (r) return r;
        if (ctxFont !== font) { measureCtx.font = font; ctxFont = font; }
        const m = measureCtx.measureText(text);
        r = {
            w: m.width, left: m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight,
            asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent,
            fa: m.fontBoundingBoxAscent, fd: m.fontBoundingBoxDescent
        };
        metricCache.set(key, r);
        return r;
    }
    const ALL_CJK = /^[\u3400-\u9fff\uf900-\ufaff]+$/;
    /**
     * 文字墨迹度量。纯汉字串不必逐行量：汉字等宽，整串墨迹 = (字数 − 1) × 字宽 + 单字墨迹宽，
     * 墨迹上沿也基本一致，用一个样字的度量推算即可（几百个站名只量一次）。
     */
    function inkOf(font, text) {
        const n = [...text].length;
        if (n > 1 && ALL_CJK.test(text)) {
            const g = measure(font, "国");
            return { iw: (n - 1) * g.w + g.left + g.right, left: g.left, asc: g.asc, desc: g.desc, fa: g.fa, fd: g.fd };
        }
        const m = measure(font, text);
        return { iw: m.left + m.right, left: m.left, asc: m.asc, desc: m.desc, fa: m.fa, fd: m.fd };
    }

    function fitSize(cfg, fam, text, box) {
        const m = inkOf(`${cfg.weight} ${cfg.size}px ${fam}`, text);
        const ih = m.asc + m.desc;
        if (!(ih > 0)) return cfg.size;
        return Math.max(cfg.size * 0.82, Math.min(cfg.size * 1.18, cfg.size * (box[3] - box[1]) / ih));
    }
    /** 按全部站名墨迹高度的中位数求出该类文字的统一字号（保留 0.1px 精度），按字体缓存 */
    const fixedCache = new Map();
    function fixedSize(cfg, fam) {
        const key = `${cfg.kind}|${cfg.weight}|${fam}`;
        if (fixedCache.has(key)) return fixedCache.get(key);
        const m = measure(`${cfg.weight} ${cfg.size}px ${fam}`, cfg.probe);
        const ih = m.asc + m.desc;
        // 英文只统计不含下伸字母的行，墨迹高度才与样字可比
        const hs = Object.values(typeof stationsData !== "undefined" ? stationsData : {})
            .filter((s) => s.lab && !s.hk)
            .map((s) => {
                if (cfg.kind === "cn") return s.lab.cn;
                const first = (s.lab.enl || [s.en])[0] || "";
                return /[gjpqyQ(),]/.test(first) ? null : (s.lab.en || [])[0];
            })
            .filter(Boolean).map((b) => b[3] - b[1]).sort((a, b) => a - b);
        const target = hs.length ? hs[hs.length >> 1] : 0;
        const fs = ih > 0 && target > 0 ? Math.round(cfg.size * target / ih * 10) / 10 : cfg.size;
        fixedCache.set(key, fs);
        return fs;
    }

    /**
     * 让一行文字的墨迹恰好落在 box 内：字号按墨迹高度求得（限制在基准字号 ±18%），
     * 中文以字距补足宽度，西文以水平缩放补足宽度。
     */
    function fitLine(span, text, box, cfg, origin) {
        const fam = cfg.cjk ? FONT_CJK : FONT_LAT;
        // 同类文字统一字号（原图同类站名本就同字号，逐行按墨迹高度求字号只会引入测量误差，
        // 而几百种略有差别的小数字号会让浏览器在缩放时反复重新光栅化字形，拖动明显变卡）
        const fs = cfg.fixed ? fixedSize(cfg, fam) : fitSize(cfg, fam, text, box);
        const m = inkOf(`${cfg.weight} ${fs}px ${fam}`, text);
        const iw = m.iw;
        const tw = box[2] - box[0];
        const n = [...text].length;
        let sx = 1, ls = 0;
        if (cfg.cjk && n > 1) {
            ls = (tw - iw) / (n - 1);
            if (ls < -fs * 0.12) { ls = 0; sx = tw / iw; }
        } else if (iw > 0) {
            sx = Math.max(0.72, Math.min(1.3, tw / iw));
        }
        const fa = m.fa, fd = m.fd;
        const top = box[1] + m.asc - fa;
        const left = box[0] + m.left * sx;
        span.style.cssText =
            `position:absolute;left:${(left - origin[0]).toFixed(2)}px;top:${(top - origin[1]).toFixed(2)}px;` +
            `font-family:${fam};font-weight:${cfg.weight};font-size:${fs.toFixed(2)}px;line-height:${(fa + fd).toFixed(2)}px;` +
            `letter-spacing:${ls.toFixed(2)}px;transform:scaleX(${sx.toFixed(4)});transform-origin:0 0;white-space:nowrap;margin:0;`;
    }

    // probe 为量取统一字号的样字：中文取常见字的墨迹高度；英文取「首字母大写 + 无下伸部」的典型站名
    const LABEL_CN = { cjk: true, weight: 400, size: 12.4, fixed: true, kind: "cn", probe: "深圳湾口岸" };
    const LABEL_EN = { cjk: false, weight: 400, size: 6.2, fixed: true, kind: "en", probe: "Shenzhen" };
    const LABEL_HK_CN = { cjk: true, weight: 400, size: 7.5 };
    const LABEL_HK_EN = { cjk: false, weight: 400, size: 3.4 };

    function layoutStationLabel(el, s) {
        const lab = s.lab;
        if (!lab || !lab.cn) return;
        const ens = lab.en || [];
        const u = [
            Math.min(lab.cn[0], ...ens.map((b) => b[0])), lab.cn[1],
            Math.max(lab.cn[2], ...ens.map((b) => b[2])), Math.max(lab.cn[3], ...ens.map((b) => b[3]))
        ];
        el.classList.add("sz-label");
        el.style.left = u[0] + "px";
        el.style.top = u[1] + "px";
        el.style.width = (u[2] - u[0]) + "px";
        el.style.height = (u[3] - u[1]) + "px";
        el.style.transform = "none";
        el.style.textAlign = "left";
        // 图上港铁站名（灰色小字）字号与深圳站名不同，单独按墨迹高度求字号
        const cfgCn = s.hk ? LABEL_HK_CN : LABEL_CN, cfgEn = s.hk ? LABEL_HK_EN : LABEL_EN;
        const cnEl = el.querySelector(".stacn");
        if (cnEl) fitLine(cnEl, s.cn, lab.cn, cfgCn, u);
        const lines = lab.enl || [s.en];
        let enEls = [...el.querySelectorAll(".staen")];
        while (enEls.length < ens.length) {
            const sp = document.createElement("span");
            sp.className = "staen sz-en-extra";
            el.appendChild(sp);
            enEls = [...el.querySelectorAll(".staen")];
        }
        ens.forEach((b, i) => {
            enEls[i].textContent = lines[i] || "";
            fitLine(enEls[i], lines[i] || "", b, cfgEn, u);
        });
        if (s.hk) el.classList.add("sz-label-hk");
    }

    function layoutAllLabels() {
        const layer = document.getElementById("labels-layer");
        if (!layer || typeof stationsData === "undefined") return;
        layer.querySelectorAll(".label-group").forEach((el) => {
            const s = stationsData[el.dataset.sid];
            if (s) layoutStationLabel(el, s);
        });
        document.documentElement.classList.add("sz-labels-ready");
    }

    // 区域名、国铁站名、有轨电车 / 云巴站名与注记
    const DECO_CFG = {
        region: [{ cjk: true, weight: 500, size: 30 }, { cjk: false, weight: 600, size: 12 }],
        rail: [{ cjk: true, weight: 400, size: 9 }, { cjk: false, weight: 400, size: 3.6 }],
        tram: [{ cjk: true, weight: 400, size: 7.2 }, { cjk: false, weight: 400, size: 3.6 }],
        hk: [{ cjk: true, weight: 400, size: 5 }, { cjk: false, weight: 400, size: 2.6 }],
        badge: [{ cjk: true, weight: 500, size: 8 }, { cjk: false, weight: 600, size: 4 }],
        note: [{ cjk: true, weight: 400, size: 8 }, { cjk: false, weight: 400, size: 4 }],
        warn: [{ cjk: true, weight: 700, size: 9.5 }, { cjk: false, weight: 600, size: 4.4 }]
    };
    function buildDecoText() {
        const content = document.getElementById("map-content");
        if (!content || typeof SZ_DECO_TEXT === "undefined") return;
        let layer = document.getElementById("sz-text-layer");
        if (!layer) {
            layer = document.createElement("div");
            layer.id = "sz-text-layer";
            content.insertBefore(layer, document.getElementById("lines-layer"));
        }
        layer.innerHTML = "";
        SZ_DECO_TEXT.forEach((t) => {
            const boxes = [t.bcn, t.ben, t.ben2].filter(Boolean);
            const u = [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])),
                Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))];
            const g = document.createElement("div");
            g.className = `sz-deco-text sz-dt-${t.cls}`;
            g.style.cssText = `left:${u[0]}px;top:${u[1]}px;width:${u[2] - u[0]}px;height:${u[3] - u[1]}px;` + (t.color ? `color:${t.color};` : "");
            layer.appendChild(g);
            const cfg = DECO_CFG[t.cls] || DECO_CFG.note;
            [[t.cn, t.bcn, cfg[0]], [t.en, t.ben, cfg[1]], [t.en2, t.ben2, cfg[1]]].forEach(([txt, b, c]) => {
                if (!txt || !b) return;
                const sp = document.createElement("span");
                sp.textContent = txt;
                g.appendChild(sp);
                fitLine(sp, txt, b, c, u);
            });
        });
    }

    /** 引擎每次重建标签层后（如切换主题）重新排版 */
    function installLabelObserver() {
        const layer = document.getElementById("labels-layer");
        if (!layer || layer.dataset.szObs) return;
        layer.dataset.szObs = "1";
        let t = 0;
        new MutationObserver((muts) => {
            if (!muts.some((m) => m.addedNodes.length)) return;
            clearTimeout(t);
            t = setTimeout(layoutAllLabels, 30);
        }).observe(layer, { childList: true });
    }

    // 装饰底图在脚本加载时就开始预取，不等 <img> 加载完再二次请求
    const DECO_URL = "./city/shenzhen/assets/shenzhen_deco.svg" + (VER ? `?v=${VER}` : "");
    const decoText = fetch(DECO_URL).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    /** 把装饰层 <img> 换成内联 SVG（深色模式按 class 重新着色）；<img> 本身由样式表隐藏，避免先闪一帧浅色底图 */
    function inlineDeco() {
        const layer = document.getElementById("scattered-layer");
        if (layer && !layer.dataset.szObs) {
            layer.dataset.szObs = "1";
            new MutationObserver(inlineDeco).observe(layer, { childList: true, subtree: true });
        }
        const img = document.querySelector('#scattered-layer img[src*="shenzhen_deco.svg"]');
        if (!img || img.dataset.szInline) return;
        img.dataset.szInline = "1";
        decoText.then((txt) => {
            if (!txt) { img.classList.add("sz-deco-fallback"); return; }
            const wrap = document.createElement("div");
            wrap.className = "sz-deco-svg";
            wrap.innerHTML = txt;
            const svg = wrap.querySelector("svg");
            if (!svg) return;
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            img.replaceWith(wrap);
        });
    }

    // ==========================================================================
    // 3. 导航：中国内地用高德，其它地区用 Google 地图
    // ==========================================================================
    // 只在用户早已授权定位时读取位置（不主动弹出授权）；未知时按城市所在地默认高德
    let userInMainland = null;
    /** 深港边界的分段近似（自西向东：后海湾、落马洲、罗湖、沙头角），只用于挑选地图服务 */
    function hkBorderLat(lng) {
        if (lng < 113.95) return 22.43;
        if (lng < 114.05) return 22.50;
        if (lng < 114.12) return 22.515;
        if (lng < 114.25) return 22.535;
        return 22.56;
    }
    function outOfMainland(lat, lng) {
        if (lng < 73.5 || lng > 135.1 || lat < 3.8 || lat > 53.6) return true;
        if (lat > 22.13 && lng > 113.82 && lng < 114.45 && lat < hkBorderLat(lng)) return true;  // 香港
        if (lat > 22.1 && lat < 22.22 && lng > 113.52 && lng < 113.6) return true;               // 澳门
        if (lat > 21.8 && lat < 25.4 && lng > 119.9 && lng < 122.1) return true;                 // 台湾
        return false;
    }
    (async function detectRegion() {
        try {
            if (!navigator.permissions || !navigator.geolocation) return;
            const st = await navigator.permissions.query({ name: "geolocation" });
            if (st.state !== "granted") return;
            navigator.geolocation.getCurrentPosition((pos) => {
                userInMainland = !outOfMainland(pos.coords.latitude, pos.coords.longitude);
            }, () => { }, { maximumAge: 30 * 60 * 1000, timeout: 8000 });
        } catch (_) { /* 忽略 */ }
    })();
    function navUrl(station) {
        const name = station.cn;
        if (userInMainland === false) {
            const q = station.hk ? `${station.en} Station, Hong Kong` : `${station.en} Station, Shenzhen Metro`;
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
        }
        const kw = station.hk ? `港铁${name}站` : `${name}(地铁站)`;
        return `https://uri.amap.com/search?keyword=${encodeURIComponent(kw)}&city=${encodeURIComponent(station.hk ? "香港" : "深圳")}`;
    }

    // ==========================================================================
    // 4. 口岸车站与港铁车站
    // ==========================================================================
    // 旅检开放时间为口岸对外公布的常态时间；节假日可能延长，出行前请以口岸公告为准
    const PORTS = {
        luohu: { name: "罗湖口岸", open: "06:30", close: "24:00", hk: "HK_LOW", hkName: "港铁东铁线罗湖站", hkId: "LOW",
            tip: "过关后即为港铁东铁线罗湖站（香港侧）。" },
        futian_checkpoint: { name: "福田口岸", open: "06:30", close: "22:30", hk: "HK_LMC", hkName: "港铁东铁线落马洲站", hkId: "LMC",
            tip: "福田口岸与香港落马洲支线管制站相连，过关后即为港铁落马洲站。" },
        shenzhen_bay_checkpoint: { name: "深圳湾口岸", open: "06:30", close: "24:00",
            tip: "「一地两检」口岸，香港侧无港铁站，过关后可换乘巴士等道路交通。" },
        liantang_checkpoint: { name: "莲塘口岸", open: "07:00", close: "22:00",
            tip: "对岸为香港香园围口岸，香港侧无港铁站，过关后可换乘巴士等道路交通。" },
        huanggang_checkpoint: { name: "皇岗口岸", open: null, close: null,
            tip: "皇岗口岸正进行重建，旅客通关安排请以口岸最新公告为准。" }
    };
    function bjNow() {
        const d = new Date();
        return new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000);
    }
    function mins(hm) { const [h, m] = hm.split(":").map(Number); return h * 60 + m; }
    function portStatus(p) {
        if (!p.open) return null;
        const n = bjNow(), now = n.getHours() * 60 + n.getMinutes();
        const o = mins(p.open), c = mins(p.close);
        if (now < o) return { cls: "closed", text: `未开放 · ${p.open} 开关`, left: null };
        if (now >= c) return { cls: "closed", text: `已闭关 · 明日 ${p.open} 开关`, left: null };
        const left = c - now;
        return { cls: left <= 60 ? "soon" : "open", text: left <= 60 ? `即将闭关 · 还有 ${left} 分钟` : "旅检通道开放中", left };
    }

    const HK_IDS = { HK_LOW: "LOW", HK_SHS: "SHS", HK_LMC: "LMC" };
    function gotoHK(hkId) {
        if (window.CGoNeighbors && window.CGoNeighbors.go) {
            // 用香港图上该站的坐标作为落点
            const at = hkId && HK_STATION_POS[hkId];
            window.CGoNeighbors.go("hongkong", at ? { at: { x: at[0], y: at[1], s: 1.1 }, sel: hkId } : {});
        } else {
            location.href = `main.html?city=hongkong`;
        }
    }
    // 香港图上三座边境站的画布坐标（取自 city/hongkong/data_stations.js，只读引用）
    const HK_STATION_POS = { LOW: [719.71, 112.3], LMC: [659.38, 146.21], SHS: [809.41, 116.31] };

    const PortModule = {
        id: "sz-port",
        name: "口岸通关",
        slot: "body-top",
        order: 20,
        shouldRender(ctx) { return Boolean(ctx.station && PORTS[ctx.station.id]); },
        render(ctx) {
            const p = PORTS[ctx.station.id];
            const st = portStatus(p);
            const hours = p.open ? `<div class="sz-port-row"><cgo-icon name="time" size="14"></cgo-icon><span>旅检开放 ${p.open}–${p.close === "24:00" ? "24:00" : p.close}</span>${st ? `<b class="sz-port-st ${st.cls}">${st.text}</b>` : ""}</div>` : "";
            const hk = p.hk ? `<button class="sz-port-hk" data-hk="${p.hkId}"><cgo-icon name="transfer" size="14"></cgo-icon><span>对岸：${p.hkName}</span><small>在香港线路图中查看 · 港铁实时班次</small><cgo-icon name="arrow-right" size="12"></cgo-icon></button>` : "";
            return `<div class="sz-port-card">
                <div class="sz-port-title"><cgo-icon name="gate" size="16"></cgo-icon>${p.name}<span>Boundary Control Point</span></div>
                ${hours}
                <div class="sz-port-row"><cgo-icon name="info" size="14"></cgo-icon><span>${esc(p.tip)}</span></div>
                <div class="sz-port-row sz-port-muted"><cgo-icon name="warning" size="14"></cgo-icon><span>过关排队时间视客流而定，节假日高峰请预留充足时间；地铁首末班车请以车站公告及深圳地铁官方渠道为准。</span></div>
                ${hk}
            </div>`;
        },
        onMounted(panel) {
            panel.querySelectorAll(".sz-port-hk").forEach((b) => b.addEventListener("click", (e) => {
                e.stopPropagation(); gotoHK(b.dataset.hk);
            }));
        }
    };

    const HkStationModule = {
        id: "sz-hk-station",
        name: "港铁车站",
        slot: "body-top",
        order: 10,
        shouldRender(ctx) { return Boolean(ctx.station && HK_IDS[ctx.station.id]); },
        render(ctx) {
            const sid = ctx.station.id;
            const note = sid === "HK_SHS" ? "东铁线列车往返罗湖 / 落马洲与九龙、金钟方向。" : "港铁东铁线过境站，出闸即进入出入境管制范围，须持有效旅行证件。";
            return `<div class="sz-port-card sz-hk-card">
                <div class="sz-port-title"><cgo-icon name="train" size="16"></cgo-icon>港铁东铁线<span>MTR East Rail Line · 香港</span></div>
                <div class="sz-port-row"><cgo-icon name="info" size="14"></cgo-icon><span>${note}</span></div>
                <button class="sz-port-hk" data-hk="${HK_IDS[sid]}"><cgo-icon name="map" size="14"></cgo-icon><span>在香港线路图中查看</span><small>同台换乘指南 · 港铁实时班次</small><cgo-icon name="arrow-right" size="12"></cgo-icon></button>
            </div>`;
        },
        onMounted(panel) {
            panel.querySelectorAll(".sz-hk-card .sz-port-hk").forEach((b) => b.addEventListener("click", (e) => {
                e.stopPropagation(); gotoHK(b.dataset.hk);
            }));
        }
    };

    // ==========================================================================
    // 5. 启动
    // ==========================================================================
    function boot() {
        installLabelObserver();
        inlineDeco();
        layoutAllLabels();
        buildDecoText();
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
    } else {
        setTimeout(boot, 0);
    }
    // 引擎在 DOMContentLoaded 之后才异步画出车站与站名，届时由 installLabelObserver 触发排版；
    // load 时只补一次装饰层内联（不再重复排版）
    window.addEventListener("load", inlineDeco);

    // ── 线路徽标元数据 ───────────────────────────────────────────────────────────
    const LINE_ORDER = ["L1", "L2", "L3", "L4", "L5", "L6", "L6B", "L7", "L8", "L9", "L10", "L11", "L12", "L13", "L14", "L16", "L20", "EAL"];

    const ShenzhenCity = {
        id: "shenzhen",
        name: "深圳",
        searchCity: "深圳",
        center: { x: 960, y: 760 },
        defaultScale: 0.62,
        mapSize: { width: 1921, height: 1586 },
        officialMapUrl: "https://www.szmc.net/map/",

        // 定位最近车站用的 GCJ-02 坐标；不设 stanameCsvUrl，避免引擎回落到北京的旧站名库
        dataFiles: { amapDataUrl: "./city/shenzhen/amap_data.json" },

        LINE_SORT_ORDER: LINE_ORDER,
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],

        renderStationIcon,
        getStationLabelStyle() { return null; },

        stationBoard: {
            modules: {
                "sz-hk-station": HkStationModule,
                "sz-port": PortModule
            }
        },

        getNavigationUrl(stationName) {
            const S = stationMap();
            const sid = Object.keys(S).find((k) => S[k].cn === stationName && !S[k].hk) || Object.keys(S).find((k) => S[k].cn === stationName);
            return navUrl(sid ? S[sid] : { cn: stationName, en: stationName });
        },
        getRailway12306Url(stationName) {
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(stationName.replace(/站$/, ""))}`;
        },
        getSuburbanLinks() { return null; },
        formatOwnerName(raw) { return raw || "深圳市地铁集团有限公司"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },

        stacard: { getRenderer: () => null },
        async initStaCard() { return null; },
        hasStaCard() { return false; },
        getStaCardHtml() { return ""; },
        async renderStaCards() { return null; },

        sz: { PORTS, portStatus, layoutAllLabels, gotoHK }
    };

    window.SHENZHEN_CITY = ShenzhenCity;
    window.CURRENT_CITY = ShenzhenCity;
    window.CityDataManager?.registerCity?.({
        folder: "./city/shenzhen",
        mainLogic: "./city/shenzhen/shenzhen.js",
        title: "CGo OpenMap - 深圳轨道交通线路图",
        isDefault: false,
        ...ShenzhenCity
    });

    console.log("[ShenzhenCity] 深圳城市模块加载完成。");
})();
