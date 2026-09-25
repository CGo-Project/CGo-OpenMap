/**
 * CGo OpenMap - 香港城市業務邏輯與綫網畫法 (city/hongkong/hongkong.js)
 *
 * ==============================================================================
 * 香港鐵路綫網圖復刻說明
 * ==============================================================================
 * 1. 綫路走向、車站位置、換乘「連珠」圖元與站名排佈，按香港鐵路系統示意圖
 *    （A1 矢量版，4110 × 2769 pt）逐點量取後重新繪製；畫布 = (x × 0.5, (y − 294) × 0.5)，
 *    即裁去頂部標題欄，其餘與原圖逐像素對齊；
 * 2. 版權規避：不收錄原圖標題欄、港鐵標誌與任何第三方商標（迪士尼、昂坪 360 等），
 *    圖標方塊改用 CGoUI 通用圖標；站名不使用原圖字形輪廓，而以開源字體
 *    Noto Serif TC / Source Sans 3（SIL OFL 1.1）按原圖墨跡包圍盒逐行貼合排版；
 *    本圖為非官方同人作品，與香港鐵路有限公司無關；
 * 3. 交互增強（原紙本圖做不到的功能）：
 *    - 同台換乘指南：太子 / 旺角 / 荔景 / 油塘 / 調景嶺 / 北角 / 金鐘的島式月台示意，
 *      點選「乘坐方向」即標出對面月台可達的綫路與方向；
 *    - 步行換乘說明：中環—香港（付費區通道）、尖沙咀—尖東、九龍—柯士甸—香港西九龍；
 *    - 行程規劃：以最少時間為目標並優先同台換乘，路綫在圖上高亮、其餘淡化，
 *      逐段列出「往某方向、乘幾站、在哪裡同台換乘」；
 *    - 同台換乘站一鍵標示。
 *
 * 本文件不修改 core/，香港專屬邏輯只放在本目錄。
 */

(function () {
    "use strict";

    const VER = window.CGO_ASSET_VERSION;
    /** 插入樣式表，返回其加載完成（或失敗）的 Promise */
    function addStylesheet(href, versioned) {
        const existing = document.querySelector(`link[href^="${href}"]`);
        if (existing) return Promise.resolve();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = versioned && VER ? `${href}?v=${VER}` : href;
        const done = new Promise((res) => { link.onload = res; link.onerror = res; });
        document.head.appendChild(link);
        return done;
    }
    addStylesheet("./city/hongkong/style.css", true);
    // 開源字體（SIL OFL 1.1）：站名中文 Noto Serif TC、英文 Source Sans 3，經 Google Fonts 國內鏡像按需分片加載。
    // 必須等這張樣式表解析完才能 document.fonts.load()，否則會以回退字體度量站名、排版整體偏寬。
    const fontCssReady = addStylesheet("https://fonts.loli.net/css2?family=Noto+Serif+TC:wght@200..900&family=Source+Sans+3:wght@200..900&display=swap", false);
    document.documentElement.classList.add("map-hongkong");
    // 開場動畫：在引擎繪圖前先把圖層隱藏，由 playIntro() 依次淡入；減少動態效果時不隱藏
    const REDUCE_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!REDUCE_MOTION) {
        document.documentElement.classList.add("hk-intro-pending");
        setTimeout(() => document.documentElement.classList.remove("hk-intro-pending"), 5000);   // 保險：任何異常都不會讓地圖一直隱藏
    }

    // 網頁字體到達前以系統自帶的明體 / 宋體排版（macOS 宋體-繁、Windows 新細明體、Android Noto Serif CJK），
    // 風格與綫路圖一致，避免白屏等待；字體到達後再交叉淡入替換
    const SYS_CJK = '"Songti TC", "STSong", "Noto Serif CJK TC", "Source Han Serif TC", "PMingLiU", "MingLiU", "SimSun", serif';
    const SYS_LAT = '"Myriad Pro", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
    const FONT_CJK = `"Noto Serif TC", ${SYS_CJK}`;
    const FONT_LAT = `"Source Sans 3", ${SYS_LAT}`;
    // 過渡期間站名只用系統字體棧：若字體棧裡含正在下載的網頁字體，瀏覽器可能把文字隱藏最多 3 秒
    let useWebFonts = false;

    // ── 綫路與方向工具 ──────────────────────────────────────────────────────────
    const LINE_ORDER = ["EAL", "TML", "TWL", "KTL", "ISL", "TKL", "TCL", "AEL", "SIL", "DRL", "LR", "HSR"];
    const LINE_NAMES = {
        AEL: ["機場快綫", "Airport Express"], DRL: ["迪士尼綫", "Disneyland Resort Line"],
        EAL: ["東鐵綫", "East Rail Line"], ISL: ["港島綫", "Island Line"], KTL: ["觀塘綫", "Kwun Tong Line"],
        SIL: ["南港島綫", "South Island Line"], TKL: ["將軍澳綫", "Tseung Kwan O Line"],
        TWL: ["荃灣綫", "Tsuen Wan Line"], TML: ["屯馬綫", "Tuen Ma Line"], TCL: ["東涌綫", "Tung Chung Line"],
        LR: ["輕鐵", "Light Rail"], HSR: ["高速鐵路", "High Speed Rail"]
    };

    function allLines() {
        return (typeof linesData !== "undefined" && Array.isArray(linesData)) ? linesData : (window.linesData || []);
    }
    function stationMap() {
        return window.processedStations && Object.keys(window.processedStations).length
            ? window.processedStations
            : (typeof stationsData !== "undefined" ? stationsData : {});
    }
    function stName(sid) { const s = stationMap()[sid]; return s ? s.cn : sid; }
    function stEn(sid) { const s = stationMap()[sid]; return s ? s.en : sid; }
    function lineColor(lid) { const l = allLines().find(x => x.id === lid); return l ? l.color : "#888"; }

    /** 可乘坐的綫路（不含只負責繪製的條目與點狀條目） */
    let _routable = null;
    function routableLines() {
        if (_routable) return _routable;
        _routable = {};
        allLines().forEach(l => {
            if (l.isPointOnly || l.drawOnly) return;
            const ways = l.hasbranch ? [l["stationIds-way1"], l["stationIds-way2"]] : [l.stationIds];
            _routable[l.id] = { id: l.id, ways, ref: ways[0], color: l.color };
        });
        return _routable;
    }
    function linesAt(sid) {
        return Object.values(routableLines()).filter(L => L.ways.some(w => w.includes(sid))).map(L => L.id);
    }
    /** 方向以參考站序（主交路 way1）為準：+1 往站序末端，−1 往站序起點 */
    function dirOfTerminus(lid, terminus) {
        const L = routableLines()[lid];
        if (!L) return 0;
        if (L.ref[0] === terminus) return -1;
        return 1;
    }
    function towardsText(lid, dir, toSid) {
        const L = routableLines()[lid];
        if (!L) return "";
        if (dir < 0) return stName(L.ref[0]);
        const ends = [...new Set(L.ways.map(w => w[w.length - 1]))];
        if (ends.length === 1) return stName(ends[0]);
        if (toSid) {
            const hits = L.ways.filter(w => w.includes(toSid));
            if (hits.length === 1) return stName(hits[0][hits[0].length - 1]);
        }
        return ends.map(stName).join("／");
    }
    function towardsEn(lid, dir, toSid) {
        const L = routableLines()[lid];
        if (!L) return "";
        if (dir < 0) return stEn(L.ref[0]);
        const ends = [...new Set(L.ways.map(w => w[w.length - 1]))];
        if (ends.length === 1) return stEn(ends[0]);
        if (toSid) {
            const hits = L.ways.filter(w => w.includes(toSid));
            if (hits.length === 1) return stEn(hits[0][hits[0].length - 1]);
        }
        return ends.map(stEn).join(" / ");
    }

    // ── 同台換乘資料 ─────────────────────────────────────────────────────────────
    // 每站兩個島式月台；每個月台兩側軌道以 [綫路, 列車開往的終點站] 表示。
    // 同一島式月台兩側即可「落車過對面」完成換乘。月台實際編號與佈局以站內指示為準。
    const XP = {
        PRE: { note: "荃灣綫與觀塘綫在太子和旺角兩站並行：太子適合「反方向」換乘（例如荃灣⇄九龍塘），旺角適合「同方向」換乘。",
               islands: [[["TWL", "CEN"], ["KTL", "TIK"]], [["KTL", "WHA"], ["TWL", "TSW"]]] },
        MOK: { note: "旺角的同台換乘為「同方向」：往中環與往黃埔同一月台，往荃灣與往調景嶺同一月台。",
               islands: [[["TWL", "CEN"], ["KTL", "WHA"]], [["TWL", "TSW"], ["KTL", "TIK"]]] },
        LAK: { note: "荃灣綫與東涌綫在荔景同台換乘，方便荃灣、葵涌一帶往返東涌及機場方向。",
               islands: [[["TWL", "CEN"], ["TCL", "TUC"]], [["TCL", "HOK"], ["TWL", "TSW"]]] },
        YAT: { note: "油塘適合九龍東與港島之間的換乘（觀塘綫 ⇄ 將軍澳綫往北角方向）。",
               islands: [[["KTL", "TIK"], ["TKL", "NOP"]], [["TKL", "POA"], ["KTL", "WHA"]]] },
        TIK: { note: "調景嶺適合九龍東與將軍澳之間的換乘；觀塘綫以本站為終點。",
               islands: [[["TKL", "NOP"], ["KTL", "WHA"]], [["KTL", "TIK"], ["TKL", "POA"]]] },
        NOP: { note: "將軍澳綫以北角為終點，與港島綫同台換乘；鰂魚涌兩綫需經通道步行。",
               islands: [[["TKL", "NOP"], ["ISL", "KET"]], [["ISL", "CHW"], ["TKL", "POA"]]] },
        ADM: { note: "金鐘的荃灣綫與港島綫同台換乘：由九龍往港島東、或由港島東往九龍時，在金鐘換乘最便捷。",
               islands: [[["TWL", "CEN"], ["ISL", "CHW"]], [["ISL", "KET"], ["TWL", "TSW"]]] }
    };
    const XP_STATIONS = Object.keys(XP);

    /** 由 (綫, 方向) 下車後轉乘 (綫2, 方向2) 是否同台 */
    function isCrossPlatform(sid, l1, d1, l2, d2) {
        const x = XP[sid];
        if (!x) return false;
        return x.islands.some(isl => {
            const a = isl.map(([l, t]) => [l, dirOfTerminus(l, t)]);
            return (a[0][0] === l1 && a[0][1] === d1 && a[1][0] === l2 && a[1][1] === d2) ||
                   (a[1][0] === l1 && a[1][1] === d1 && a[0][0] === l2 && a[0][1] === d2);
        });
    }

    // ── 步行換乘 ────────────────────────────────────────────────────────────────
    const WALKS = [
        { a: "CEN", b: "HOK", min: 6, paid: true, text: "付費區內行人通道連接，毋須出閘" },
        { a: "TST", b: "ETS", min: 7, paid: false, text: "經地下行人隧道出閘步行換乘" },
        { a: "KOW", b: "AUS", min: 12, paid: false, text: "出閘後經行人天橋步行，需另行計費" },
        { a: "AUS", b: "WEK", min: 7, paid: false, text: "出閘後步行前往高鐵站" },
        { a: "KOW", b: "WEK", min: 9, paid: false, text: "出閘後步行前往高鐵站" }
    ];
    function walksFrom(sid) {
        return WALKS.filter(w => w.a === sid || w.b === sid).map(w => ({ to: w.a === sid ? w.b : w.a, w }));
    }

    // ==========================================================================
    // 1. 車站圖元：普通站單圓環，換乘站為連珠外框 + 各綫色條
    // ==========================================================================
    const RING_R = 6.7;          // 圓環中心綫半徑 13.4pt
    function renderStationIcon(station) {
        const mk = station.mk || {};
        if (mk.o) {
            const bw = mk.w + 4, bh = mk.h + 4;
            const bars = (mk.bars || []).map(b => `<polygon points="${b.p}" fill="${b.c}"/>`).join("");
            return {
                html: `<svg viewBox="${(-bw / 2).toFixed(2)} ${(-bh / 2).toFixed(2)} ${bw.toFixed(2)} ${bh.toFixed(2)}" xmlns="http://www.w3.org/2000/svg">` +
                      `<path class="hk-cap" d="${mk.o}"/>${bars}</svg>`,
                width: bw, height: bh,
                className: "hk-marker hk-ic"
            };
        }
        const b = 2 * RING_R + 4;
        return {
            html: `<svg viewBox="${-b / 2} ${-b / 2} ${b} ${b}" xmlns="http://www.w3.org/2000/svg"><circle class="hk-ring" r="${RING_R}"/></svg>`,
            width: b, height: b,
            className: "hk-marker"
        };
    }

    // ==========================================================================
    // 2. 按墨跡包圍盒逐行貼合排版（站名、區域名、圖例文字共用）
    // ==========================================================================
    const measureCtx = document.createElement("canvas").getContext("2d");
    const isCjk = (t) => /[㐀-鿿]/.test(t);

    /**
     * 讓一行文字的墨跡恰好落在 box 內：
     *   字號按墨跡高度比例求得（限制在基準字號 ±15%），
     *   中文以字距補足寬度，西文以水平縮放補足寬度。
     */
    function fitLine(span, text, box, cfg, origin) {
        const fam = cfg.cjk ? (useWebFonts ? FONT_CJK : SYS_CJK) : (useWebFonts ? FONT_LAT : SYS_LAT);
        const fontAt = (px) => `${cfg.weight} ${px}px ${fam}`;
        measureCtx.font = fontAt(cfg.size);
        let m = measureCtx.measureText(text);
        const ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const th = box[3] - box[1];
        let fs = cfg.size;
        if (ih > 0 && cfg.fitHeight !== false) {
            fs = Math.max(cfg.size * 0.85, Math.min(cfg.size * 1.15, cfg.size * th / ih));
        }
        measureCtx.font = fontAt(fs);
        m = measureCtx.measureText(text);
        const iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        const tw = box[2] - box[0] + (cfg.dw || 0);
        const n = [...text].length;
        let sx = 1, ls = 0;
        if (cfg.cjk && n > 1 && cfg.spacing !== false) {
            ls = (tw - iw) / (n - 1);
            if (ls < -fs * 0.12) { ls = 0; sx = tw / iw; }
        } else if (iw > 0) {
            sx = Math.max(0.78, Math.min(1.25, tw / iw));
        }
        const fa = m.fontBoundingBoxAscent, fd = m.fontBoundingBoxDescent;
        const top = box[1] + m.actualBoundingBoxAscent - fa + (cfg.dy || 0);
        const left = box[0] + m.actualBoundingBoxLeft * sx;
        span.style.cssText =
            `position:absolute;left:${(left - origin[0]).toFixed(2)}px;top:${(top - origin[1]).toFixed(2)}px;` +
            `font-family:${fam};font-weight:${cfg.weight};font-size:${fs.toFixed(2)}px;line-height:${(fa + fd).toFixed(2)}px;` +
            `letter-spacing:${ls.toFixed(2)}px;transform:scaleX(${sx.toFixed(4)});transform-origin:0 0;white-space:nowrap;margin:0;`;
    }

    // dy / dw 為與原圖逐站比對後的系統誤差校正（瀏覽器實際渲染與 canvas 度量之差）
    const LABEL_CN = { cjk: true, weight: 655, size: 17.95, dy: 0.15 };
    const LABEL_EN = { cjk: false, weight: 640, size: 14.0, dy: 0.3, dw: 0.3 };

    function layoutStationLabel(el, s) {
        const lab = s.lab;
        if (!lab) return;
        const u = [Math.min(lab.cn[0], lab.en[0]), lab.cn[1], Math.max(lab.cn[2], lab.en[2]), lab.en[3]];
        el.classList.add("hk-label");
        el.style.left = u[0] + "px";
        el.style.top = u[1] + "px";
        el.style.width = (u[2] - u[0]) + "px";
        el.style.height = (u[3] - u[1]) + "px";
        el.style.transform = "none";
        el.style.textAlign = "left";
        const cnEl = el.querySelector(".stacn");
        const enEl = el.querySelector(".staen");
        if (cnEl) fitLine(cnEl, s.cn, lab.cn, LABEL_CN, u);
        if (enEl) { enEl.textContent = s.en; fitLine(enEl, s.en, lab.en, LABEL_EN, u); }
        if (s.id === "ETS" || el.dataset.sid === "ETS") el.classList.add("hk-halo");
    }

    function layoutAllLabels() {
        const layer = document.getElementById("labels-layer");
        if (!layer || typeof stationsData === "undefined") return;
        layer.querySelectorAll(".label-group").forEach((el) => {
            const s = stationsData[el.dataset.sid];
            if (s) layoutStationLabel(el, s);
        });
    }

    /** 區域名稱、圖例文字與註記 */
    const DECO_CFG = {
        region: [{ cjk: true, weight: 500, size: 29 }, { cjk: false, weight: 400, size: 20 }],
        legend: [{ cjk: true, weight: 600, size: 9.6 }, { cjk: false, weight: 600, size: 7.6 }],
        "legend legend-s": [{ cjk: true, weight: 600, size: 8.8 }, { cjk: false, weight: 600, size: 6.6 }],
        np360: [{ cjk: true, weight: 600, size: 8.8 }, { cjk: false, weight: 600, size: 7.2 }]
    };
    function buildDecoText() {
        const content = document.getElementById("map-content");
        if (!content || typeof HK_DECO_TEXT === "undefined") return;
        let layer = document.getElementById("hk-text-layer");
        if (!layer) {
            layer = document.createElement("div");
            layer.id = "hk-text-layer";
            content.insertBefore(layer, document.getElementById("lines-layer"));
        }
        layer.innerHTML = "";
        HK_DECO_TEXT.forEach((t) => {
            const g = document.createElement("div");
            g.className = "hk-deco-text hk-" + t.cls.split(" ")[0];
            if (t.one) {
                const b = t.b;
                g.style.cssText = `left:${b[0]}px;top:${b[1]}px;width:${b[2] - b[0]}px;height:${b[3] - b[1]}px;`;
                g.innerHTML = `<svg viewBox="-1 -1 2 2" width="100%" height="100%"><path d="M0 -1V1M-0.87 -0.5L0.87 0.5M-0.87 0.5L0.87 -0.5" stroke="currentColor" stroke-width="0.32" stroke-linecap="butt"/></svg>`;
                layer.appendChild(g);
                return;
            }
            const u = [Math.min(t.bcn[0], t.ben[0]), Math.min(t.bcn[1], t.ben[1]), Math.max(t.bcn[2], t.ben[2]), Math.max(t.bcn[3], t.ben[3])];
            g.style.cssText = `left:${u[0]}px;top:${u[1]}px;width:${u[2] - u[0]}px;height:${u[3] - u[1]}px;`;
            const a = document.createElement("span"), b = document.createElement("span");
            g.appendChild(a); g.appendChild(b);
            layer.appendChild(g);
            const cfg = DECO_CFG[t.cls] || DECO_CFG.legend;
            a.textContent = t.cn; b.textContent = t.en;
            fitLine(a, t.cn, t.bcn, cfg[0], u);
            fitLine(b, t.en, t.ben, cfg[1], u);
        });
    }

    // 裝飾文字（區域名、圖例）所需字形；站名字形由 loadFaces 另外從 stationsData 收集
    const FONT_SAMPLE = "天水圍羅湖荃灣金鐘香港九龍新界深圳大嶼山港島機場快綫已付車費區域閘外轉綫站只限賽馬日昂坪";
    let fontsReady = false;
    function whenFontsReady(cb) {
        if (fontsReady) { cb(); return; }
        fontCssReady.then(() => loadFaces(FONT_SAMPLE)).then(finish, finish);
        setTimeout(finish, 6000);
        let done = false;
        function finish() {
            if (done) return;
            done = true; fontsReady = true;
            document.documentElement.classList.add("hk-fonts-ready");
            cb();
        }
    }
    function loadFaces(sample) {
        const loads = [
            [`655 18px ${FONT_CJK}`, sample], [`500 29px ${FONT_CJK}`, sample],
            [`640 14px ${FONT_LAT}`, "Tin Shui Wai Kowloon 360"], [`400 20px ${FONT_LAT}`, "New Territories"]
        ].map(([f, t]) => document.fonts ? document.fonts.load(f, t) : Promise.resolve());
        // 所有站名字符需要的分片都要加載（Noto Serif TC 按 unicode-range 切片）
        const all = typeof stationsData !== "undefined" ? Object.values(stationsData).map(s => s.cn).join("") : "";
        if (document.fonts && all) loads.push(document.fonts.load(`655 18px ${FONT_CJK}`, all));
        return Promise.all(loads).then(() => (document.fonts ? document.fonts.ready : null));
    }
    // 超時先行排版後，若字體分片陸續到達，再按真實字體重排一次
    if (document.fonts && document.fonts.addEventListener) {
        let t = 0;
        document.fonts.addEventListener("loadingdone", () => {
            if (!fontsReady) return;
            clearTimeout(t);
            // 首次替換由 installLabelObserver 在全部字形就緒後觸發；這裡只處理之後零星到達的分片
            if (!fontSwapped) return;
            t = setTimeout(() => { layoutAllLabels(); buildDecoText(); }, 120);
        });
    }

    /**
     * 網頁字體是否真的已載入。注意 document.fonts.check() 在字體樣式表尚未解析時也會回傳 true
     * （沒有登記任何需要載入的字體），所以這裡直接檢查 FontFace 的載入狀態。
     */
    function webFontsAvailable() {
        if (!document.fonts) return false;
        const loaded = (fam) => [...document.fonts].some(f => f.family.replace(/["']/g, "") === fam && f.status === "loaded");
        return loaded("Noto Serif TC") && loaded("Source Sans 3");
    }
    let fontSwapped = false;
    /**
     * 字體交替動畫：先把目前（系統字體）的站名層拍成快照疊在上方，
     * 真實圖層改用網頁字體重新排版後從輕微模糊淡入，快照同時淡出並移除。
     */
    function swapFontsAnimated() {
        if (fontSwapped) { layoutAllLabels(); buildDecoText(); return; }
        if (introRunning) { pendingSwap = true; return; }   // 開場動畫進行中：等它結束再換字體，避免兩段動畫疊在一起
        fontSwapped = true;
        const layers = ["labels-layer", "hk-text-layer"].map(id => document.getElementById(id)).filter(Boolean);
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const ghosts = reduce ? [] : layers.map(layer => {
            const g = layer.cloneNode(true);
            g.removeAttribute("id");
            g.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
            g.classList.add("hk-font-ghost");
            // 圖層的定位樣式寫在 #id 選擇器上，快照去掉 id 後要把定位補回來，否則不會疊在原位
            const cs = getComputedStyle(layer);
            g.style.cssText += `;position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;visibility:visible;` +
                `pointer-events:none;z-index:${cs.zIndex};`;
            layer.parentNode.insertBefore(g, layer.nextSibling);
            return g;
        });
        useWebFonts = true;
        document.documentElement.classList.add("hk-webfonts");
        layoutAllLabels();
        buildDecoText();
        if (reduce) return;
        layers.forEach(l => l.classList.add("hk-font-enter"));
        void document.body.offsetWidth;   // 觸發重排，讓過渡從起始狀態開始
        requestAnimationFrame(() => {
            layers.forEach(l => { l.classList.add("hk-font-in"); });
            ghosts.forEach(g => g.classList.add("hk-font-out"));
            setTimeout(() => {
                ghosts.forEach(g => g.remove());
                layers.forEach(l => l.classList.remove("hk-font-enter", "hk-font-in"));
            }, 700);
        });
    }

    // ==========================================================================
    // 2b. 開場動畫：海陸淡入 → 綫路按原圖繪製次序「畫出」→ 車站由中心向外浮現 → 站名自模糊中清晰
    // ==========================================================================
    let introDone = REDUCE_MOTION, introRunning = false;
    function playIntro() {
        const root = document.documentElement;
        if (introDone || introRunning) { root.classList.remove("hk-intro-pending"); return; }
        introRunning = true;
        const S = stationMap();
        const cx = 1030, cy = 620, maxD = Math.hypot(1030, 640);
        const wave = (x, y) => Math.hypot(x - cx, y - cy) / maxD;      // 0（中心）→ 1（邊緣）
        // 綫路：用描邊虛綫偏移做「畫出」效果，先後次序即 linesData 的繪製次序
        const groups = [...document.querySelectorAll("#lines-layer .line-visual-group")];
        groups.forEach((g, gi) => {
            g.querySelectorAll(".line-visual-inner").forEach(path => {
                let len = 0;
                try { len = path.getTotalLength(); } catch (e) { /* 未渲染的路徑 */ }
                if (!len || !path.animate) return;
                path.style.strokeDasharray = `${len} ${len}`;
                const anim = path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
                    duration: 420 + Math.min(len, 1600) * 0.28, delay: gi * 26,
                    easing: "cubic-bezier(.2,.7,.25,1)", fill: "backwards"
                });
                anim.onfinish = anim.oncancel = () => { path.style.strokeDasharray = ""; };
            });
        });
        // 車站與站名：按離畫面中心的距離設定延遲，形成由內向外的一圈波紋
        document.querySelectorAll("#stations-layer .station").forEach(el => {
            const st = S[el.dataset.sid];
            if (st) el.style.setProperty("--hk-d", `${Math.round(160 + wave(st.x, st.y) * 520)}ms`);
        });
        document.querySelectorAll("#labels-layer .label-group").forEach(el => {
            const st = S[el.dataset.sid];
            if (st) el.style.setProperty("--hk-d", `${Math.round(260 + wave(st.x, st.y) * 560)}ms`);
        });
        root.classList.remove("hk-intro-pending");
        root.classList.add("hk-intro");
        setTimeout(() => {
            root.classList.remove("hk-intro");
            introDone = true; introRunning = false;
            if (pendingSwap) { pendingSwap = false; swapFontsAnimated(); }
        }, 1500);
    }
    let pendingSwap = false;

    function installLabelObserver() {
        const layer = document.getElementById("labels-layer");
        if (!layer || layer.dataset.hkObserver === "1") return false;
        layer.dataset.hkObserver = "1";
        let frame = 0;
        const mo = new MutationObserver(() => {
            if (frame) return;
            frame = requestAnimationFrame(() => { frame = 0; layoutAllLabels(); });
        });
        mo.observe(layer, { childList: true });
        // 字體已在瀏覽器快取時通常 300ms 內就緒：直接用最終字體顯示，不做過渡；
        // 否則先以系統明體 / 宋體排版顯示，網頁字體到達後再交叉淡入替換。
        let shown = false;
        const show = () => {
            layoutAllLabels();
            buildDecoText();
            document.documentElement.classList.add("hk-labels-ready");
        };
        const fallbackTimer = setTimeout(() => { if (!shown) { shown = true; show(); } }, 300);
        // 只在站名所需的全部字形分片都載入後才替換一次，避免半套字體時就開始過渡
        fontCssReady.then(() => loadFaces(FONT_SAMPLE)).then(() => {
            if (!shown) { shown = true; fontSwapped = true; useWebFonts = true; document.documentElement.classList.add("hk-webfonts"); clearTimeout(fallbackTimer); show(); }
            else if (!fontSwapped && webFontsAvailable()) swapFontsAnimated();
            else { layoutAllLabels(); buildDecoText(); }
        }, () => { /* 字體服務不可用：保留系統字體 */ });
        whenFontsReady(() => {});
        return true;
    }

    // ==========================================================================
    // 3. 行程規劃（Dijkstra：乘車每站 2 分、換乘 5 分、同台換乘 1.5 分）
    // ==========================================================================
    const COST_HOP = 2, COST_XFER = 5, COST_XP = 1.5, COST_RAC = 40;
    // 機場快綫另行收費，只在往返機場 / 博覽館時才優先採用
    const COST_AEL = 12, AEL_ONLY = ["AIR", "AWE"];

    function planRoute(from, to) {
        if (!from || !to || from === to) return null;
        const R = routableLines();
        const key = (s, l, d) => `${s}|${l}|${d}`;
        const dist = new Map(), prev = new Map();
        const heap = [];
        const push = (k, c, p, info) => {
            if (dist.has(k) && dist.get(k) <= c) return;
            dist.set(k, c); prev.set(k, { p, info });
            heap.push([c, k]);
        };
        const nextOn = (lid, sid, dir) => {
            const out = new Set();
            R[lid].ways.forEach(w => {
                const i = w.indexOf(sid);
                if (i !== -1 && w[i + dir]) out.add(w[i + dir]);
            });
            return [...out];
        };
        const aelPen = (l) => (l === "AEL" && !AEL_ONLY.includes(from) && !AEL_ONLY.includes(to)) ? COST_AEL : 0;
        const boardAll = (sid, base, p, info) => {
            linesAt(sid).forEach(l => [1, -1].forEach(d => {
                if (nextOn(l, sid, d).length) push(key(sid, l, d), base + aelPen(l), p, info);
            }));
        };
        boardAll(from, 0, null, { t: "start" });
        walksFrom(from).forEach(({ to: t2, w }) => {
            if (t2 === to) push("GOAL", w.min, null, { t: "walk", a: from, b: t2, w });
            boardAll(t2, w.min, "WALK0", { t: "walk", a: from, b: t2, w });
        });
        prev.set("WALK0", { p: null, info: { t: "start" } });
        let goal = null;
        while (heap.length) {
            heap.sort((a, b) => a[0] - b[0]);
            const [c, k] = heap.shift();
            if (c > dist.get(k)) continue;
            if (k === "GOAL") { goal = k; break; }
            const [sid, lid, ds] = k.split("|");
            const dir = +ds;
            // 乘車
            nextOn(lid, sid, dir).forEach(n => {
                const pen = (n === "RAC" && to !== "RAC") || (sid === "RAC" && from !== "RAC") ? COST_RAC : 0;
                const nk = key(n, lid, dir);
                push(nk, c + COST_HOP + pen, k, { t: "ride" });
                if (n === to) push("GOAL", c + COST_HOP + pen, nk, { t: "arrive" });
            });
            // 同站換乘
            linesAt(sid).forEach(l2 => [1, -1].forEach(d2 => {
                if (l2 === lid) return;
                if (!nextOn(l2, sid, d2).length) return;
                const xp = isCrossPlatform(sid, lid, dir, l2, d2);
                push(key(sid, l2, d2), c + (xp ? COST_XP : COST_XFER) + aelPen(l2), k, { t: "xfer", xp });
            }));
            // 步行換乘
            walksFrom(sid).forEach(({ to: t2, w }) => {
                if (t2 === to) push("GOAL", c + w.min, k, { t: "walk", a: sid, b: t2, w });
                linesAt(t2).forEach(l2 => [1, -1].forEach(d2 => {
                    if (nextOn(l2, t2, d2).length) push(key(t2, l2, d2), c + w.min + aelPen(l2), k, { t: "walk", a: sid, b: t2, w });
                }));
            });
        }
        if (!goal) return null;
        // 回溯狀態鏈
        const chain = [];
        let k = "GOAL";
        while (k) {
            const e = prev.get(k);
            chain.unshift({ k, info: e ? e.info : null });
            k = e ? e.p : null;
        }
        // 壓縮為步驟：ride 段 / 換乘 / 步行
        const steps = [];
        let cur = null;
        chain.forEach(({ k: st, info }) => {
            if (st === "GOAL" || st === "WALK0") {
                if (info && info.t === "walk") {
                    if (cur) { steps.push(cur); cur = null; }
                    steps.push({ t: "walk", a: info.a, b: info.b, w: info.w });
                }
                return;
            }
            const [sid, lid, ds] = st.split("|");
            const dir = +ds;
            if (info && info.t === "walk") {
                if (cur) { steps.push(cur); cur = null; }
                steps.push({ t: "walk", a: info.a, b: info.b, w: info.w });
            }
            if (info && info.t === "xfer") {
                if (cur) { steps.push(cur); cur = null; }
                steps.push({ t: "xfer", at: sid, xp: info.xp });
            }
            if (!cur || cur.line !== lid || cur.dir !== dir) {
                if (cur) steps.push(cur);
                cur = { t: "ride", line: lid, dir, stops: [sid] };
            } else {
                cur.stops.push(sid);
            }
        });
        if (cur) steps.push(cur);
        // 清理：去掉只有一站的乘車段（例如起點站換乘前的虛段）
        const clean = [];
        steps.forEach((s) => {
            if (s.t === "ride" && s.stops.length < 2) return;
            if (s.t === "xfer" && (!clean.length || clean[clean.length - 1].t !== "ride")) return;
            clean.push(s);
        });
        for (let i = clean.length - 1; i >= 0; i--) {
            if (clean[i].t === "xfer" && (!clean[i + 1] || clean[i + 1].t !== "ride")) clean.splice(i, 1);
        }
        // 換乘步驟補上前後段資訊
        clean.forEach((s, i) => {
            if (s.t !== "xfer") return;
            const a = clean[i - 1], b = clean[i + 1];
            s.fromLine = a && a.line; s.toLine = b && b.line;
            s.toDir = b && b.dir; s.toTo = b && b.stops ? b.stops[b.stops.length - 1] : null;
        });
        let minutes = 0;
        clean.forEach(st => {
            if (st.t === "ride") minutes += legMinutes(st.stops);
            else if (st.t === "xfer") minutes += st.xp ? COST_XP : COST_XFER;
            else if (st.t === "walk") minutes += st.w.min;
        });
        return { from, to, minutes: Math.round(minutes), steps: clean };
    }

    // ── 路綫幾何：逐站間在綫路折綫上截取 ────────────────────────────────────────
    function polylinesOf(lid) {
        const l = allLines().find(x => x.id === lid);
        if (!l) return [];
        return l.hasbranch ? [l["pathPoints-main"], l["pathPoints-branch1"], l["pathPoints-branch2"]].filter(Boolean) : [l.pathPoints];
    }
    /** 把點投影到折綫上，返回所在綫段序號、段內比例、投影點與距離 */
    function project(pts, p) {
        let best = { d: Infinity };
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1];
            const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy;
            const t = L2 ? Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / L2)) : 0;
            const q = { x: a.x + vx * t, y: a.y + vy * t };
            const d = Math.hypot(q.x - p.x, q.y - p.y);
            if (d < best.d) best = { i, t, q, d };
        }
        return best;
    }
    /**
     * 兩站之間沿綫路折綫截取的一段：站點先投影到綫段上（換乘站圖元中心不在綫上，
     * 長直段也只有首尾兩個頂點），再取兩投影點之間的原始頂點，保證與綫路逐點重合。
     */
    function sliceBetween(lid, A, B) {
        let best = null;
        for (const pts of polylinesOf(lid)) {
            const pa = project(pts, A), pb = project(pts, B);
            const score = pa.d + pb.d;
            if (pa.d < 14 && pb.d < 14 && (!best || score < best.score)) best = { pts, pa, pb, score };
        }
        if (!best) return null;
        const { pts, pa, pb } = best;
        const fwd = pa.i < pb.i || (pa.i === pb.i && pa.t <= pb.t);
        const [s0, s1] = fwd ? [pa, pb] : [pb, pa];
        const seg = [s0.q, ...pts.slice(s0.i + 1, s1.i + 1), s1.q];
        return fwd ? seg : seg.reverse();
    }
    // 馬場站賽馬日支綫（繪於裝飾層）：自東鐵綫北側接駁點繞至馬場站的半環
    const RACE_SPUR = [[1228.35, 179.88], [1235.57, 179.88], [1237.81, 179.99], [1239.98, 180.33], [1242.08, 180.86],
        [1244.08, 181.6], [1246, 182.52], [1247.8, 183.62], [1249.48, 184.87], [1251.04, 186.29], [1252.45, 187.84],
        [1253.71, 189.52], [1254.8, 191.32], [1255.72, 193.24], [1256.46, 195.24], [1257, 197.34], [1257.33, 199.51],
        [1257.44, 201.75], [1257.44, 206.88]].map(([x, y]) => ({ x, y }));
    /**
     * 兩站之間沿綫路折綫截取的一段：站點先投影到綫段上（換乘站圖元中心不在綫上，
     * 長直段也只有首尾兩個頂點），再取兩投影點之間的原始頂點，保證與綫路逐點重合。
     */
    function hopPoints(lid, a, b) {
        const S = stationMap();
        const A = S[a], B = S[b];
        if (a === "RAC" || b === "RAC") {
            const other = a === "RAC" ? B : A;
            const main = sliceBetween(lid, other, RACE_SPUR[0]) || [other, RACE_SPUR[0]];
            const path = main.concat(RACE_SPUR.slice(1));
            return a === "RAC" ? path.reverse() : path;
        }
        return sliceBetween(lid, A, B) || [{ x: A.x, y: A.y }, { x: B.x, y: B.y }];
    }
    const toD = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

    function drawRoute(route) {
        const content = document.getElementById("map-content");
        if (!content) return;
        let svg = document.getElementById("hk-route-layer");
        if (!svg) {
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.id = "hk-route-layer";
            content.insertBefore(svg, document.getElementById("stations-layer"));
        }
        svg.innerHTML = "";
        document.querySelectorAll(".hk-on-route").forEach(el => el.classList.remove("hk-on-route"));
        if (!route) { content.classList.remove("hk-routing"); return; }
        content.classList.add("hk-routing");
        const S = stationMap();
        const mark = (sid) => ["node_", "label_"].forEach(p => { const el = document.getElementById(p + sid); if (el) el.classList.add("hk-on-route"); });
        let html = "";
        route.steps.forEach((s) => {
            if (s.t === "ride") {
                let pts = [];
                for (let i = 0; i < s.stops.length - 1; i++) {
                    const h = hopPoints(s.line, s.stops[i], s.stops[i + 1]);
                    pts = pts.concat(i ? h.slice(1) : h);
                }
                const d = toD(pts), c = lineColor(s.line);
                html += `<path d="${d}" class="hk-rt-case"/><path d="${d}" class="hk-rt-line" stroke="${c}"/><path d="${d}" class="hk-rt-flow"/>`;
                s.stops.forEach(mark);
            } else if (s.t === "walk") {
                const A = S[s.a], B = S[s.b];
                html += `<path d="M${A.x} ${A.y} L${B.x} ${B.y}" class="hk-rt-walk"/>`;
                mark(s.a); mark(s.b);
            }
        });
        [route.from, route.to].forEach(mark);
        const O = S[route.from], D = S[route.to];
        html += `<circle cx="${O.x}" cy="${O.y}" r="11" class="hk-rt-pin hk-rt-o"/><circle cx="${D.x}" cy="${D.y}" r="11" class="hk-rt-pin hk-rt-d"/>`;
        svg.innerHTML = html;
        fitToStations(route.steps.flatMap(st => st.t === "ride" ? st.stops : st.t === "walk" ? [st.a, st.b] : []));
    }

    /** 把視口平移縮放到剛好容納整條路綫（避開右下角行程面板） */
    function fitToStations(ids) {
        const S = stationMap();
        fitToPoints(ids.filter(i => S[i]).map(i => S[i]));
    }
    function fitToPoints(pts) {
        const cont = document.getElementById("map-container");
        const content = document.getElementById("map-content");
        if (!cont || !content || !pts.length || typeof window.updateMapTransform !== "function") return;
        const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
        const pad = 80;
        const card = document.getElementById("hk-route-card");
        const reserveW = card && window.innerWidth > 640 ? card.offsetWidth + 40 : 0;
        const reserveH = card && window.innerWidth <= 640 ? card.offsetHeight + 16 : 0;
        const ctrl = document.getElementById("modern-zoom-control");
        const left = ctrl && window.innerWidth > 640 ? ctrl.getBoundingClientRect().right - cont.getBoundingClientRect().left + 10 : 0;
        const top = 76; // 浮動標題欄
        const chipH = document.getElementById("hk-focus-chip") ? 70 : 0;   // 綫路單獨顯示時底部的提示膠囊
        const vw = cont.clientWidth - reserveW - left, vh = cont.clientHeight - reserveH - top - chipH;
        const bw = Math.max(...xs) - Math.min(...xs) + pad * 2, bh = Math.max(...ys) - Math.min(...ys) + pad * 2;
        const scale = Math.max(0.5, Math.min(1.6, vw / bw, vh / bh));
        const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
        window.currentScale = scale;
        window.currentX = left + vw / 2 - cx * scale;
        window.currentY = top + vh / 2 - cy * scale;
        content.classList.add("animate-zoom");
        window.updateMapTransform();
        const slider = document.getElementById("mz-slider");
        if (slider) slider.value = scale;
        setTimeout(() => content.classList.remove("animate-zoom"), 400);
    }

    // ── 行程規劃面板 ─────────────────────────────────────────────────────────────
    // ==========================================================================
    // 3a. 港鐵實時班次（港鐵「下一班列車」開放數據 API，支援跨域，純前端直連）
    // ==========================================================================
    const NT_API = "https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php";
    const NT_LINES = ["AEL", "TCL", "TML", "TKL", "EAL", "SIL", "TWL", "ISL", "KTL", "DRL"];
    const ntCache = new Map();   // "LINE-STA" -> { at, promise }

    function fetchNextTrains(lid, sid) {
        if (!NT_LINES.includes(lid)) return Promise.resolve(null);
        const key = `${lid}-${sid}`;
        const hit = ntCache.get(key);
        if (hit && Date.now() - hit.at < 20000) return hit.promise;
        const promise = fetch(`${NT_API}?line=${lid}&sta=${sid}&lang=TC`, { cache: "no-store" })
            .then(r => r.ok ? r.json() : null)
            .then(j => {
                if (!j || !j.data || !j.data[key]) return { ok: false, message: (j && j.message) || "暫無班次資料", delay: j && j.isdelay === "Y" };
                const d = j.data[key];
                return { ok: true, trains: [...(d.UP || []), ...(d.DOWN || [])], delay: j.isdelay === "Y" };
            })
            .catch(() => ({ ok: false, message: "未能連接實時班次服務" }));
        ntCache.set(key, { at: Date.now(), promise });
        return promise;
    }
    /** 列車開往 dest 時，相對本站的行車方向（按參考站序 +1 / −1） */
    function dirOfDest(lid, sid, dest) {
        const L = routableLines()[lid];
        if (!L) return 0;
        for (const w of L.ways) {
            const i = w.indexOf(sid), j = w.indexOf(dest);
            if (i !== -1 && j !== -1 && i !== j) return j > i ? 1 : -1;
        }
        return 0;
    }
    /** 某方向（及支綫終點）下一批列車，按到站分鐘排序 */
    function trainsToward(res, lid, sid, dir, end) {
        if (!res || !res.ok) return [];
        const L = routableLines()[lid];
        const endWay = end && L ? L.ways.find(w => w[w.length - 1] === end || w[0] === end) : null;
        return res.trains
            .filter(t => t.valid !== "N" && dirOfDest(lid, sid, t.dest) === dir)
            .filter(t => !endWay || endWay.includes(t.dest))
            .sort((a, b) => (+a.ttnt) - (+b.ttnt));
    }
    function minsText(t) {
        const m = +t.ttnt;
        return m <= 0 ? "即將抵達" : m === 1 ? "1 分鐘" : `${m} 分鐘`;
    }
    /** 渲染實時列車行：「2 號月台 · 即將抵達 · 4 分 · 8 分」 */
    function liveHtml(res, list, end) {
        if (!res) return "";
        if (!res.ok) return `<span class="hk-live-off">${res.message}</span>`;
        if (!list.length) return `<span class="hk-live-off">暫無此方向班次</span>`;
        const plat = list[0].plat ? `<span class="hk-platnum"><span class="hk-plat-no">${list[0].plat}</span>號月台</span>` : "";
        const items = list.slice(0, 3).map((t, i) => {
            const other = end && t.dest !== end ? `<i>往${stName(t.dest)}</i>` : "";
            return `<span class="${i ? "" : "hk-live-first"}">${minsText(t)}${other}</span>`;
        }).join("");
        return `<span class="hk-live-dot"></span>${plat}${items}${res.delay ? `<span class="hk-live-delay">服務延誤</span>` : ""}`;
    }
    /** 為容器內所有 [data-live] 元素填入實時班次，並在元素仍在頁面時每 30 秒刷新 */
    function mountLive(root) {
        const els = [...root.querySelectorAll("[data-live]")];
        if (!els.length) return;
        const run = () => els.forEach(el => {
            const [lid, sid, dir, end] = el.dataset.live.split("|");
            fetchNextTrains(lid, sid).then(res => {
                if (!el.isConnected) return;
                el.innerHTML = liveHtml(res, trainsToward(res, lid, sid, +dir, end || null), end || null);
            });
        });
        run();
        const timer = setInterval(() => {
            if (!els.some(el => el.isConnected)) { clearInterval(timer); return; }
            run();
        }, 30000);
    }

    // ==========================================================================
    // 3a-2. 按需加載的香港專屬數據（車費表、附近巴士）——只在香港頁面、用到時才載入
    // ==========================================================================
    const dataLoads = {};
    function loadHKData(name, globalName) {
        if (window[globalName]) return Promise.resolve(window[globalName]);
        if (!dataLoads[name]) {
            dataLoads[name] = new Promise((res) => {
                const sc = document.createElement("script");
                sc.src = `./city/hongkong/data_${name}.js${VER ? `?v=${VER}` : ""}`;
                sc.onload = () => res(window[globalName] || null);
                sc.onerror = () => { delete dataLoads[name]; res(null); };
                document.head.appendChild(sc);
            });
        }
        return dataLoads[name];
    }

    // ── 站間行車時間：按車站實際距離估算（市區短站距 ≈ 36 km/h，長隧道 / 郊區 ≈ 80 km/h，另加停站時間）
    function geoMeters(a, b) {
        const A = stationMap()[a], B = stationMap()[b];
        if (!A || !B || !A.ll || !B.ll) return null;
        const [la1, lo1] = A.ll, [la2, lo2] = B.ll;
        return 6371000 * Math.hypot((la2 - la1) * Math.PI / 180, (lo2 - lo1) * Math.PI / 180 * Math.cos(la1 * Math.PI / 180));
    }
    function hopMinutes(a, b) {
        const m = geoMeters(a, b);
        if (m == null) return COST_HOP;
        const km = m / 1000;
        const speed = km > 3 ? 1.35 : km > 1.8 ? 0.9 : 0.6;   // 公里 / 分鐘
        return 0.5 + km / speed;
    }
    function legMinutes(stops) {
        let t = 0;
        for (let i = 0; i < stops.length - 1; i++) t += hopMinutes(stops[i], stops[i + 1]);
        return t;
    }

    // ── 車費 ────────────────────────────────────────────────────────────────────
    const FARE_KEY = "hk_fare_type";
    const FARE_TYPES = [["oct", "成人"], ["std", "學生"], ["joy", "樂悠咭"], ["chd", "小童"], ["eld", "長者"], ["sgl", "單程票"]];
    let fareType = (() => { try { return localStorage.getItem(FARE_KEY) || "oct"; } catch (e) { return "oct"; } })();
    function fareBetween(F, a, b, type) {
        if (a === b) return 0;
        const n = F.stations.length;
        let i = F.stations.indexOf(a), j = F.stations.indexOf(b);
        if (i < 0 || j < 0) return null;
        if (i > j) [i, j] = [j, i];
        const k = i * (2 * n - i - 1) / 2 + (j - i - 1);
        const s = F.m[type] || F.m.oct;
        return parseInt(s.substr(k * 2, 2), 36) / 10;
    }
    function aelFare(F, a, b, type) {
        const row = F.ael.find(r => (r[0] === a && r[1] === b) || (r[0] === b && r[1] === a));
        if (!row) return null;
        // [起, 訖, 八達通成人, 八達通小童, 單程成人, 單程小童]；機場快綫無學生 / 樂悠咭優惠，按成人計
        return type === "chd" ? row[3] : type === "sgl" ? row[4] : row[2];
    }
    /**
     * 行程車費：出閘步行（尖沙咀—尖東除外，港鐵按同一程計）把行程拆成多程；
     * 每程內機場快綫段按機場快綫車費，其餘連續路段按起訖站本地綫車費。
     */
    function tripFare(route, F, type) {
        if (!route || !F) return null;
        let total = 0, notes = [];
        const journeys = [[]];
        route.steps.forEach(s => {
            if (s.t === "walk" && !s.w.paid && !((s.a === "TST" && s.b === "ETS") || (s.a === "ETS" && s.b === "TST"))) journeys.push([]);
            else if (s.t === "ride") journeys[journeys.length - 1].push(s);
        });
        for (const legs of journeys) {
            let run = null;
            const flush = () => {
                if (!run) return true;
                const v = fareBetween(F, run.a, run.b, type);
                if (v == null) return false;
                total += v; run = null; return true;
            };
            for (const s of legs) {
                const a = s.stops[0], b = s.stops[s.stops.length - 1];
                if (s.line === "AEL") {
                    if (!flush()) return null;
                    const v = aelFare(F, a, b, type);
                    if (v == null) { notes.push("機場快綫市區段車費請以港鐵公佈為準"); continue; }
                    total += v;
                    if (type !== "oct" && type !== "sgl" && type !== "chd") notes.push("機場快綫無此優惠，按成人八達通計");
                } else if (!run) run = { a, b };
                else run.b = b;
            }
            if (!flush()) return null;
        }
        if (route.steps.some(s => s.t === "ride" && s.line === "EAL")) notes.push("東鐵綫頭等另加收費");
        return { total: Math.round(total * 10) / 10, notes: [...new Set(notes)] };
    }

    // ==========================================================================
    // 3b. 行程流程：選起點 → 地圖上點目的地 → 自動規劃並收起資訊板
    // ==========================================================================
    const routeState = { from: null, to: null };
    function badge(lid) {
        const n = LINE_NAMES[lid] || [lid, ""];
        const tc = lid === "SIL" ? "#1B2A12" : "#fff";
        return `<span class="hk-lbadge" style="background:${lineColor(lid)};color:${tc}">${n[0]}</span>`;
    }
    function routeStats(route) {
        let transfers = 0, xps = 0, stops = 0;
        route.steps.forEach(s => {
            if (s.t === "xfer") { transfers++; if (s.xp) xps++; }
            if (s.t === "ride") stops += s.stops.length - 1;
        });
        return { transfers, xps, stops };
    }
    function renderRouteSteps(route) {
        if (!route) return `<div class="hk-rt-empty">未能找到可行路綫</div>`;
        const st = routeStats(route);
        let html = `<div class="hk-rt-sum"><b>約 ${route.minutes} 分鐘</b><span>${st.stops} 站 · 換乘 ${st.transfers} 次${st.xps ? `（同台 ${st.xps} 次）` : ""}</span></div>
            <div class="hk-fare"><div class="hk-fare-main"><small>車費</small><b class="hk-fare-v">…</b><span class="hk-fare-note"></span></div>
                <div class="hk-fare-types">${FARE_TYPES.map(([k, n]) => `<button data-fare="${k}" class="${k === fareType ? "on" : ""}">${n}</button>`).join("")}</div></div>
            <div class="hk-track"></div><ol class="hk-rt-steps">`;
        route.steps.forEach((s, i) => {
            if (s.t === "ride") {
                const a = s.stops[0], b = s.stops[s.stops.length - 1];
                const L = routableLines()[s.line];
                const endWay = L && s.dir > 0 ? L.ways.find(w => w.includes(b)) : null;
                const end = s.dir > 0 ? (endWay ? endWay[endWay.length - 1] : "") : (L ? L.ref[0] : "");
                html += `<li class="hk-rt-ride" data-step="${i}" style="--lc:${lineColor(s.line)}">` +
                    `<div class="hk-rt-head">${badge(s.line)}<span>往 <b>${towardsText(s.line, s.dir, b)}</b></span><em>${s.stops.length - 1} 站 · 約 ${Math.round(legMinutes(s.stops))} 分</em></div>` +
                    `<div class="hk-rt-body"><a data-jump="${a}">${stName(a)}</a> 上車 → <a data-jump="${b}">${stName(b)}</a> 落車</div>` +
                    (NT_LINES.includes(s.line) ? `<div class="hk-live hk-rt-live" data-live="${s.line}|${a}|${s.dir}|${end}">載入實時班次…</div>` : "") +
                    `</li>`;
            } else if (s.t === "xfer") {
                html += s.xp
                    ? `<li class="hk-rt-x hk-xp"><cgo-icon name="transfer" size="16"></cgo-icon><span>於 <a data-jump="${s.at}">${stName(s.at)}</a> <b>同台換乘</b>：落車後直接步往對面月台</span></li>`
                    : `<li class="hk-rt-x"><cgo-icon name="stairs" size="16"></cgo-icon><span>於 <a data-jump="${s.at}">${stName(s.at)}</a> 換乘，跟隨站內指示前往${(LINE_NAMES[s.toLine] || [""])[0]}月台</span></li>`;
            } else if (s.t === "walk") {
                html += `<li class="hk-rt-x hk-walk"><cgo-icon name="walk" size="16"></cgo-icon><span>由 <a data-jump="${s.a}">${stName(s.a)}</a> 步行至 <a data-jump="${s.b}">${stName(s.b)}</a>（約 ${s.w.min} 分鐘，${s.w.text}）</span></li>`;
            }
        });
        html += `</ol><div class="hk-rt-foot">行車時間按站間實際距離估算，換乘另加 5 分鐘；實時班次與車費來自港鐵開放數據，僅供參考。點選路段可在圖上放大查看。</div>`;
        return html;
    }
    function ensureRouteCard() {
        let card = document.getElementById("hk-route-card");
        if (card) return card;
        card = document.createElement("div");
        card.id = "hk-route-card";
        card.innerHTML = `
            <div class="hk-rt-top">
                <cgo-icon name="route" size="18"></cgo-icon>
                <span class="hk-rt-title">行程規劃</span>
                <button class="hk-rt-close" title="結束行程"><cgo-icon name="close" size="18"></cgo-icon></button>
            </div>
            <div class="hk-rt-fields">
                <button class="hk-rt-field" data-pick="from"></button>
                <button class="hk-rt-field" data-pick="to"></button>
                <button class="hk-rt-swap" title="對調起訖站"><cgo-icon name="reverse" size="16"></cgo-icon></button>
            </div>
            <div class="hk-rt-result"></div>`;
        document.body.appendChild(card);
        card.querySelector(".hk-rt-swap").addEventListener("click", (e) => {
            e.stopPropagation();
            [routeState.from, routeState.to] = [routeState.to, routeState.from];
            updateRoute();
        });
        card.querySelector(".hk-rt-close").addEventListener("click", cancelTrip);
        card.addEventListener("click", (e) => {
            const f = e.target.closest("[data-pick]");
            if (f) { e.stopPropagation(); openStationPicker(f.dataset.pick); return; }
            const a = e.target.closest("[data-jump]");
            if (a) { if (window.selectStation) window.selectStation(a.dataset.jump); return; }
            const leg = e.target.closest(".hk-rt-ride[data-step]");
            if (leg && card._route) {
                const st = card._route.steps[+leg.dataset.step];
                card.querySelectorAll(".hk-rt-ride").forEach(el => el.classList.toggle("focus", el === leg));
                fitToStations(st.stops);
            }
        });
        ["pointerdown", "wheel", "touchstart"].forEach(ev => card.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
        return card;
    }
    /** 起訖站欄位：顯示已選車站（含所屬綫路色點），未選時顯示提示 */
    function syncRouteForm() {
        const card = ensureRouteCard();
        const field = (which) => {
            const sid = routeState[which];
            const label = which === "from" ? "起點" : "目的地";
            const dot = `<i class="hk-dot ${which === "from" ? "hk-o" : "hk-d"}"></i>`;
            if (!sid) return `${dot}<span class="hk-rf-main hk-rf-ph">選擇${label}</span><cgo-icon name="chevron-right" size="15"></cgo-icon>`;
            const lines = linesOfStation(sid).map(l => `<i class="hk-rf-ln" style="background:${lineColor(l)}"></i>`).join("");
            return `${dot}<span class="hk-rf-main"><small>${label}</small><b>${stName(sid)}</b><em>${stEn(sid)}</em></span>` +
                `<span class="hk-rf-lns">${lines}</span><cgo-icon name="chevron-right" size="15"></cgo-icon>`;
        };
        card.querySelector('[data-pick="from"]').innerHTML = field("from");
        card.querySelector('[data-pick="to"]').innerHTML = field("to");
    }

    // ==========================================================================
    // 3c. 車站選擇器：「綫路 → 車站」兩級選擇 + 全網搜索（繁 / 簡 / 英文 / 車站代號）
    // ==========================================================================
    const T2S = (() => {
        const t = "圍羅嶺學門恆馬烏車廟錦顯徑樂灣窩興長龍鑽頭寶啟東觀臺館覽藍奧運機場調軍將紅會環鰂魚鐘營盤島銅鑼堅尖沙咀涌東區",
              z = "围罗岭学门恒马乌车庙锦显径乐湾窝兴长龙钻头宝启东观台馆览蓝奥运机场调军将红会环鲗鱼钟营盘岛铜锣坚尖沙咀涌东区";
        const m = {};
        [...t].forEach((c, i) => { m[c] = [...z][i]; });
        return m;
    })();
    const toSimp = (str) => [...str].map(c => T2S[c] || c).join("");
    /** 車站所屬的全部綫路（含輕鐵 / 高鐵點狀條目），按綫路排序 */
    function linesOfStation(sid) {
        const ids = linesAt(sid);
        allLines().forEach(l => { if (l.isPointOnly && (l.stationIds || []).includes(sid)) ids.push(l.id.replace("_PT", "")); });
        return [...new Set(ids)].sort((a, b) => LINE_ORDER.indexOf(a) - LINE_ORDER.indexOf(b));
    }
    /** 綫路上的車站，按行車順序；支綫車站插在分岔點之後 */
    function orderedStations(lid) {
        const L = routableLines()[lid];
        if (!L) return stationsOfLine(lid);
        const out = L.ways[0].slice();
        L.ways.slice(1).forEach(w => w.forEach((sid, i) => {
            if (out.includes(sid)) return;
            const prev = w[i - 1];
            let at = out.indexOf(prev);
            // 連續的支綫站依次排在前一個支綫站之後
            out.splice(at + 1, 0, sid);
        }));
        return out;
    }
    const PICK_LINES = ["EAL", "TML", "TWL", "KTL", "ISL", "TKL", "TCL", "AEL", "SIL", "DRL", "LR", "HSR"];
    const RECENT_KEY = "hk_recent_stations";
    function recentStations() {
        try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").filter(s => stationMap()[s]); } catch (e) { return []; }
    }
    function pushRecent(sid) {
        try {
            const r = [sid, ...recentStations().filter(x => x !== sid)].slice(0, 6);
            localStorage.setItem(RECENT_KEY, JSON.stringify(r));
        } catch (e) { /* 私隱模式下不可寫入，忽略 */ }
    }

    let pickerState = { which: "from", line: null };
    function openStationPicker(which) {
        pickerState.which = which;
        const other = routeState[which === "from" ? "to" : "from"];
        const cur = routeState[which];
        // 預設打開：已選車站所在綫 → 另一端所在綫 → 東鐵綫
        pickerState.line = (cur && linesAt(cur)[0]) || (other && linesAt(other)[0]) || (cur && linesOfStation(cur)[0]) || "EAL";
        let pk = document.getElementById("hk-picker");
        if (!pk) {
            pk = document.createElement("div");
            pk.id = "hk-picker";
            pk.innerHTML = `<div class="hk-pk-card" role="dialog">
                <div class="hk-pk-top"><i class="hk-dot"></i><b class="hk-pk-title"></b>
                    <button class="hk-pk-close" title="關閉"><cgo-icon name="close" size="18"></cgo-icon></button></div>
                <label class="hk-pk-search"><cgo-icon name="search" size="16"></cgo-icon>
                    <input type="search" placeholder="搜尋站名、English 或車站代號（如 TST）" autocomplete="off" spellcheck="false"></label>
                <div class="hk-pk-recent"></div>
                <div class="hk-pk-body">
                    <div class="hk-pk-lines"></div>
                    <div class="hk-pk-list"></div>
                </div>
            </div>`;
            document.body.appendChild(pk);
            pk.addEventListener("click", (e) => {
                if (e.target === pk || e.target.closest(".hk-pk-close")) { closeStationPicker(); return; }
                const ln = e.target.closest("[data-pline]");
                if (ln) { pickerState.line = ln.dataset.pline; pk.querySelector("input").value = ""; renderPicker(); return; }
                const st = e.target.closest("[data-psid]");
                if (st && !st.classList.contains("disabled")) choosePicked(st.dataset.psid);
            });
            const input = pk.querySelector("input");
            input.addEventListener("input", renderPicker);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    const first = pk.querySelector(".hk-pk-list [data-psid]:not(.disabled)");
                    if (first) choosePicked(first.dataset.psid);
                } else if (e.key === "Escape") closeStationPicker();
            });
            ["pointerdown", "wheel", "touchstart"].forEach(ev => pk.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
        }
        pk.querySelector("input").value = "";
        pk.querySelector(".hk-dot").className = `hk-dot ${which === "from" ? "hk-o" : "hk-d"}`;
        pk.querySelector(".hk-pk-title").textContent = which === "from" ? "選擇起點" : "選擇目的地";
        renderPicker();
        requestAnimationFrame(() => pk.classList.add("show"));
        if (window.innerWidth > 640) setTimeout(() => pk.querySelector("input").focus(), 60);
        document.addEventListener("keydown", pickerEsc);
    }
    function pickerEsc(e) { if (e.key === "Escape") closeStationPicker(); }
    function closeStationPicker() {
        const pk = document.getElementById("hk-picker");
        if (pk) pk.classList.remove("show");
        document.removeEventListener("keydown", pickerEsc);
    }
    function choosePicked(sid) {
        pushRecent(sid);
        closeStationPicker();
        const card = document.getElementById("hk-route-card");
        if (card && card.classList.contains("show")) {
            // 在行程卡內選站：留在卡片裡，缺哪一端就接著提示選哪一端
            const other = pickerState.which === "from" ? "to" : "from";
            routeState[pickerState.which] = sid;
            if (routeState[other] === sid) routeState[other] = null;
            updateRoute();
            if (!routeState[other]) setTimeout(() => openStationPicker(other), 220);
        } else {
            setRouteEnd(pickerState.which, sid);
        }
    }
    function stationRow(sid, opts = {}) {
        const other = routeState[pickerState.which === "from" ? "to" : "from"];
        const lines = linesOfStation(sid);
        const dots = lines.filter(l => l !== opts.line).map(l => `<i class="hk-pk-ln" style="background:${lineColor(l)}" title="${(LINE_NAMES[l] || [l])[0]}"></i>`).join("");
        const tag = sid === other ? `<span class="hk-pk-tag">${pickerState.which === "from" ? "目的地" : "起點"}</span>` : "";
        const cur = sid === routeState[pickerState.which] ? " current" : "";
        return `<button class="hk-pk-st${sid === other ? " disabled" : ""}${cur}" data-psid="${sid}"${opts.line ? ` style="--lc:${lineColor(opts.line)}"` : ""}>
            ${opts.line ? `<span class="hk-pk-rail"><i></i></span>` : ""}
            <span class="hk-pk-name"><b>${stName(sid)}</b><em>${stEn(sid)}</em></span>
            <span class="hk-pk-meta">${dots}${tag}<code>${sid}</code></span>
        </button>`;
    }
    function renderPicker() {
        const pk = document.getElementById("hk-picker");
        if (!pk) return;
        const q = pk.querySelector("input").value.trim();
        const S = stationMap();
        // 最近選過
        const rec = recentStations();
        pk.querySelector(".hk-pk-recent").innerHTML = !q && rec.length
            ? `<span>最近</span>${rec.map(sid => `<button data-psid="${sid}" class="hk-pk-chip">${stName(sid)}</button>`).join("")}` : "";
        // 綫路欄
        pk.querySelector(".hk-pk-lines").innerHTML = PICK_LINES.map(l => {
            const n = LINE_NAMES[l];
            return `<button data-pline="${l}" class="${!q && l === pickerState.line ? "on" : ""}" style="--lc:${lineColor(l)}">
                <i></i><span><b>${n[0]}</b><em>${n[1]}</em></span></button>`;
        }).join("");
        const list = pk.querySelector(".hk-pk-list");
        if (q) {
            const ql = q.toLowerCase(), qs = toSimp(q);
            const hits = Object.keys(S).filter(sid => {
                const s = S[sid];
                return s.cn.includes(q) || toSimp(s.cn).includes(qs) || s.en.toLowerCase().includes(ql) ||
                    sid.toLowerCase() === ql || s.en.toLowerCase().split(/[\s-]+/).map(w => w[0]).join("").startsWith(ql);
            }).sort((a, b) => {
                const ra = S[a].en.toLowerCase().startsWith(ql) || S[a].cn.startsWith(q) || a.toLowerCase() === ql ? 0 : 1;
                const rb = S[b].en.toLowerCase().startsWith(ql) || S[b].cn.startsWith(q) || b.toLowerCase() === ql ? 0 : 1;
                return ra - rb || S[a].en.localeCompare(S[b].en);
            });
            list.innerHTML = hits.length
                ? `<div class="hk-pk-h">搜尋結果 · ${hits.length} 個車站</div>` + hits.map(sid => stationRow(sid)).join("")
                : `<div class="hk-pk-empty">找不到「${q.replace(/[<>&]/g, "")}」，試試英文站名或車站代號</div>`;
        } else {
            const l = pickerState.line;
            const n = LINE_NAMES[l];
            const ids = orderedStations(l);
            list.innerHTML = `<div class="hk-pk-h" style="--lc:${lineColor(l)}"><i></i>${n[0]} · ${ids.length} 站${lineSummary(l) ? `<small>${lineSummary(l)}</small>` : ""}</div>` +
                `<div class="hk-pk-rails">${ids.map(sid => stationRow(sid, { line: l })).join("")}</div>`;
            const cur = list.querySelector(".hk-pk-st.current");
            if (cur) cur.scrollIntoView({ block: "center" });
            else list.scrollTop = 0;
        }
    }

    function fillFare(root, route) {
        const v = root.querySelector(".hk-fare-v"), note = root.querySelector(".hk-fare-note");
        if (!v) return;
        loadHKData("fares", "HK_FARES").then(F => {
            if (!v.isConnected) return;
            const f = F ? tripFare(route, F, fareType) : null;
            v.textContent = f ? `$${f.total.toFixed(1)}` : "—";
            note.textContent = f ? [FARE_TYPES.find(x => x[0] === fareType)[1] + (fareType === "sgl" ? "" : " · 八達通"), ...f.notes].join("；") : "未能取得車費資料";
        });
    }
    document.addEventListener("click", (e) => {
        const b = e.target.closest && e.target.closest(".hk-fare-types [data-fare]");
        if (!b) return;
        e.stopPropagation();
        fareType = b.dataset.fare;
        try { localStorage.setItem(FARE_KEY, fareType); } catch (err) { /* 忽略 */ }
        const root = b.closest(".hk-rt-result"), card = document.getElementById("hk-route-card");
        root.querySelectorAll(".hk-fare-types button").forEach(x => x.classList.toggle("on", x === b));
        if (card && card._route) fillFare(root, card._route);
    }, true);

    function updateRoute() {
        const card = ensureRouteCard();
        syncRouteForm();
        const res = card.querySelector(".hk-rt-result");
        if (routeState.from && routeState.to && routeState.from !== routeState.to) {
            const r = planRoute(routeState.from, routeState.to);
            if (track.on && track.route && (track.route.from !== r?.from || track.route.to !== r?.to)) stopTracking();
            card._route = r;
            res.innerHTML = renderRouteSteps(r);
            mountLive(res);
            fillFare(res, r);
            renderTracking();
            drawRoute(r);
            hideTripBanner();
        } else {
            card._route = null;
            res.innerHTML = `<div class="hk-rt-empty">在上方選擇起點與目的地，或在車站資訊卡中點「由此出發 / 到這裡去」。<br>路綫會優先採用同台換乘，並顯示各段的實時班次。</div>`;
            drawRoute(null);
            drawPins();
        }
    }
    function openRoute() {
        ensureRouteCard().classList.add("show");
        document.body.classList.add("hk-route-open");
        updateRoute();
    }
    /** 結束行程：清空起訖站、收起行程卡與提示條、移除圖上路綫 */
    function cancelTrip() {
        if (track.on) stopTracking();
        const bar = document.getElementById("hk-track-bar");
        if (bar) bar.classList.remove("show");
        const card = document.getElementById("hk-route-card");
        if (card) card.classList.remove("show");
        document.body.classList.remove("hk-route-open", "hk-picking");
        routeState.from = routeState.to = null;
        hideTripBanner();
        drawRoute(null);
        drawPins();
    }
    const closeRoute = cancelTrip;

    /** 只選了一端時，在圖上標出該端（綠 = 起點，紅 = 目的地） */
    function drawPins() {
        const content = document.getElementById("map-content");
        if (!content) return;
        let g = document.getElementById("hk-pin-layer");
        if (!g) {
            g = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            g.id = "hk-pin-layer";
            content.appendChild(g);
        }
        const S = stationMap();
        const one = (sid, cls) => sid && S[sid]
            ? `<circle cx="${S[sid].x}" cy="${S[sid].y}" r="12" class="hk-pin-pulse ${cls}"/><circle cx="${S[sid].x}" cy="${S[sid].y}" r="11" class="hk-rt-pin ${cls}"/>` : "";
        const partial = !(routeState.from && routeState.to);
        g.innerHTML = partial ? one(routeState.from, "hk-rt-o") + one(routeState.to, "hk-rt-d") : "";
    }

    /** 頂部行程提示條：「● 深水埗 → 請在圖上點選目的地」 */
    function showTripBanner() {
        let b = document.getElementById("hk-trip-banner");
        if (!b) {
            b = document.createElement("div");
            b.id = "hk-trip-banner";
            document.body.appendChild(b);
            b.addEventListener("click", (e) => {
                e.stopPropagation();
                if (e.target.closest(".hk-tb-cancel")) cancelTrip();
                else if (e.target.closest(".hk-tb-list")) openStationPicker(routeState.from ? "to" : "from");
            });
        }
        const picking = routeState.from ? "to" : "from";
        const known = routeState.from || routeState.to;
        b.innerHTML = `<i class="hk-dot ${routeState.from ? "hk-o" : "hk-d"}"></i>
            <span class="hk-tb-text">${routeState.from ? "由" : "前往"} <b>${stName(known)}</b>
            <cgo-icon name="arrow-right" size="14"></cgo-icon>
            <em>請在圖上點選${picking === "to" ? "目的地" : "出發站"}</em></span>
            <button class="hk-tb-list" title="從列表選擇"><cgo-icon name="search" size="15"></cgo-icon></button>
            <button class="hk-tb-cancel" title="取消"><cgo-icon name="close" size="15"></cgo-icon></button>`;
        b.classList.add("show");
        document.body.classList.add("hk-picking");
    }
    function hideTripBanner() {
        const b = document.getElementById("hk-trip-banner");
        if (b) b.classList.remove("show");
        document.body.classList.remove("hk-picking");
    }

    /**
     * 設定行程一端：
     *  - 兩端齊備 → 收起車站資訊板，直接規劃並顯示路綫；
     *  - 只有一端 → 收起資訊板，頂部提示「請在圖上點選另一端」，圖上標出已選的一端。
     */
    function setRouteEnd(which, sid) {
        routeState[which] = sid;
        const other = which === "from" ? "to" : "from";
        if (routeState[other] === sid) routeState[other] = null;
        if (typeof window.resetMapState === "function") window.resetMapState();
        if (routeState.from && routeState.to) {
            openRoute();
        } else {
            const card = document.getElementById("hk-route-card");
            if (card) card.classList.remove("show");
            document.body.classList.remove("hk-route-open");
            drawRoute(null);
            drawPins();
            showTripBanner();
        }
    }

    // ==========================================================================
    // 3d. 行程追蹤與到站提醒：按實時班次推算到站時間，下一站落車時震動 / 通知
    // ==========================================================================
    const track = { on: false, route: null, legs: [], idx: 0, phase: "wait", boardAt: 0, eta: 0, alerted: false, timer: 0, refineAt: 0, wake: null };
    const hkTime = (s) => new Date(s.replace(" ", "T") + "+08:00").getTime();
    const hhmm = (t) => new Date(t).toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Hong_Kong" });

    function startTracking(route) {
        track.on = true;
        track.route = route;
        track.legs = route.steps.map((s, i) => ({ s, i })).filter(x => x.s.t === "ride");
        track.idx = 0; track.phase = "wait"; track.alerted = false;
        if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
        if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request("screen").then(w => { track.wake = w; }).catch(() => {});
        clearInterval(track.timer);
        track.timer = setInterval(tickTracking, 5000);
        renderTracking();
    }
    function stopTracking() {
        track.on = false;
        clearInterval(track.timer);
        if (track.wake) { track.wake.release().catch(() => {}); track.wake = null; }
        document.body.classList.remove("hk-track-alert");
        const b = document.getElementById("hk-track-bar");
        if (b) b.classList.remove("show");
        renderTracking();
    }
    function boardNow() {
        const leg = track.legs[track.idx];
        if (!leg) return;
        track.phase = "ride"; track.boardAt = Date.now(); track.alerted = false;
        track.eta = track.boardAt + legMinutes(leg.s.stops) * 60000;
        track.refineAt = 0;
        tickTracking();
    }
    /** 用落車站的實時班次校正：找與推算時間最接近（±4 分鐘內）的同向列車 */
    function refineEta() {
        const leg = track.legs[track.idx];
        if (!leg || track.phase !== "ride") return;
        const s = leg.s, alight = s.stops[s.stops.length - 1];
        fetchNextTrains(s.line, alight).then(res => {
            if (!res || !res.ok || track.phase !== "ride" || track.legs[track.idx] !== leg) return;
            const cands = trainsToward(res, s.line, alight, s.dir, null).map(t => hkTime(t.time));
            // 終點站方向可能沒有「開往」的列車，改用到站列車（dest 即本站）
            if (!cands.length) res.trains.filter(t => t.dest === alight).forEach(t => cands.push(hkTime(t.time)));
            let best = null;
            cands.forEach(t => { if (Math.abs(t - track.eta) < 4 * 60000 && (!best || Math.abs(t - track.eta) < Math.abs(best - track.eta))) best = t; });
            if (best) { track.eta = best; renderTracking(); }
        });
    }
    function notifyNextStop(name) {
        document.body.classList.add("hk-track-alert");
        if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 400]);
        try {
            if ("Notification" in window && Notification.permission === "granted") new Notification("下一站落車", { body: `下一站 ${name}，請準備落車`, tag: "hk-next-stop" });
        } catch (e) { /* 部分瀏覽器只允許在 Service Worker 中發通知，忽略 */ }
    }
    function tickTracking() {
        if (!track.on) return;
        const leg = track.legs[track.idx];
        if (!leg) return;
        if (track.phase === "ride") {
            const now = Date.now();
            if (now - track.refineAt > 30000) { track.refineAt = now; refineEta(); }
            const lastHop = hopMinutes(leg.s.stops[leg.s.stops.length - 2], leg.s.stops[leg.s.stops.length - 1]) * 60000;
            if (!track.alerted && track.eta - now <= lastHop + 15000) {
                track.alerted = true;
                notifyNextStop(stName(leg.s.stops[leg.s.stops.length - 1]));
            }
            if (now > track.eta + 45000) {
                // 視為已到站：進入下一段（換乘）或完成行程
                document.body.classList.remove("hk-track-alert");
                if (track.idx < track.legs.length - 1) { track.idx++; track.phase = "wait"; }
                else track.phase = "done";
            }
        }
        renderTracking();
    }
    /** 目前在第幾站：按已行駛時間在各站間累計時間上插值 */
    function progressOf(leg) {
        const stops = leg.s.stops;
        const total = Math.max(1, track.eta - track.boardAt), el = Date.now() - track.boardAt;
        const cum = [0];
        for (let i = 0; i < stops.length - 1; i++) cum.push(cum[i] + hopMinutes(stops[i], stops[i + 1]));
        const scale = cum[cum.length - 1] ? total / (cum[cum.length - 1] * 60000) : 1;
        let k = 0;
        while (k < cum.length - 1 && cum[k + 1] * 60000 * scale <= el) k++;
        return Math.min(k, stops.length - 1);
    }
    function renderTracking() {
        const card = document.getElementById("hk-route-card");
        const box = card && card.querySelector(".hk-track");
        let bar = document.getElementById("hk-track-bar");
        if (!track.on) { if (box) box.innerHTML = trackIdleHtml(); return; }
        const leg = track.legs[track.idx];
        let html = "", barHtml = "";
        if (track.phase === "done") {
            html = `<div class="hk-tk-done"><cgo-icon name="check-circle" size="20"></cgo-icon>已到達 <b>${stName(track.route.to)}</b></div>
                <button class="hk-tk-btn hk-tk-stop">結束追蹤</button>`;
            barHtml = `<cgo-icon name="check-circle" size="16"></cgo-icon>已到達 ${stName(track.route.to)}`;
        } else if (track.phase === "wait") {
            const s = leg.s, a = s.stops[0];
            const prevX = track.route.steps[leg.i - 1];
            const how = prevX && prevX.t === "xfer" ? (prevX.xp ? "同台換乘：步往對面月台，" : "換乘：跟隨站內指示，") : "";
            html = `<div class="hk-tk-now">${how}在 <b>${stName(a)}</b> 乘 ${badge(s.line)} 往 <b>${towardsText(s.line, s.dir, s.stops[s.stops.length - 1])}</b></div>
                <div class="hk-live" data-live="${s.line}|${a}|${s.dir}|">載入實時班次…</div>
                <button class="hk-tk-btn hk-tk-board"><cgo-icon name="train" size="16"></cgo-icon>我已上車</button>`;
            barHtml = `${badge(s.line)}<span>在 <b>${stName(a)}</b> 上車 · 往${towardsText(s.line, s.dir, s.stops[s.stops.length - 1])}</span>`;
        } else {
            const s = leg.s, stops = s.stops, k = progressOf(leg);
            const left = stops.length - 1 - k, next = stops[Math.min(k + 1, stops.length - 1)];
            const mins = Math.max(0, Math.round((track.eta - Date.now()) / 60000));
            const alert = document.body.classList.contains("hk-track-alert");
            html = `<div class="hk-tk-now">${badge(s.line)} 往 <b>${towardsText(s.line, s.dir, stops[stops.length - 1])}</b></div>
                <div class="hk-tk-eta"><b>${hhmm(track.eta)}</b> 到達 ${stName(stops[stops.length - 1])}<span>約 ${mins} 分鐘 · 還有 ${left} 站</span></div>
                <div class="hk-tk-strip" style="--lc:${lineColor(s.line)}">${stops.map((sid, i) => `<i class="${i < k ? "past" : i === k ? "here" : ""}${i === stops.length - 1 ? " end" : ""}" title="${stName(sid)}"></i>`).join("")}</div>
                ${alert ? `<div class="hk-tk-alert"><cgo-icon name="warning" size="16"></cgo-icon>下一站 <b>${stName(stops[stops.length - 1])}</b> 落車</div>` : `<div class="hk-tk-next">下一站 ${stName(next)}</div>`}
                <div class="hk-tk-row"><button class="hk-tk-btn hk-tk-arrive">已落車</button><button class="hk-tk-link hk-tk-stop">結束追蹤</button></div>`;
            barHtml = alert
                ? `<cgo-icon name="warning" size="16"></cgo-icon><span><b>下一站 ${stName(stops[stops.length - 1])} 落車</b></span>`
                : `${badge(s.line)}<span>下一站 <b>${stName(next)}</b> · 還有 ${left} 站 · ${hhmm(track.eta)} 到</span>`;
        }
        if (box) { box.innerHTML = html; mountLive(box); }
        if (!bar) {
            bar = document.createElement("div");
            bar.id = "hk-track-bar";
            document.body.appendChild(bar);
            bar.addEventListener("click", (e) => { e.stopPropagation(); openRoute(); });
        }
        bar.innerHTML = barHtml;
        bar.classList.add("show");
    }
    function trackIdleHtml() {
        return `<button class="hk-tk-btn hk-tk-start"><cgo-icon name="notification" size="16"></cgo-icon>開始行程 · 到站提醒</button>
            <div class="hk-tk-tip">按實時班次推算到站時間，快到落車站時震動提示（請保持本頁開啟）</div>`;
    }
    document.addEventListener("click", (e) => {
        const t = e.target;
        if (!t.closest) return;
        if (t.closest(".hk-tk-start")) { e.stopPropagation(); const c = document.getElementById("hk-route-card"); if (c && c._route) startTracking(c._route); }
        else if (t.closest(".hk-tk-board")) { e.stopPropagation(); boardNow(); }
        else if (t.closest(".hk-tk-arrive")) { e.stopPropagation(); track.eta = Date.now() - 46000; tickTracking(); }
        else if (t.closest(".hk-tk-stop")) { e.stopPropagation(); stopTracking(); }
    }, true);

    // ── 同台換乘站標示 ─────────────────────────────────────────────────────────
    function toggleXpMarks(force) {
        const content = document.getElementById("map-content");
        if (!content) return;
        let layer = document.getElementById("hk-xp-layer");
        if (!layer) {
            layer = document.createElement("div");
            layer.id = "hk-xp-layer";
            content.appendChild(layer);
            const S = stationMap();
            XP_STATIONS.forEach(sid => {
                const s = S[sid];
                if (!s) return;
                const d = document.createElement("div");
                d.className = "hk-xp-mark";
                d.style.left = s.x + "px";
                d.style.top = s.y + "px";
                d.dataset.sid = sid;
                d.innerHTML = `<span class="hk-xp-pulse"></span><span class="hk-xp-tag"><cgo-icon name="transfer" size="11"></cgo-icon>同台</span>`;
                d.addEventListener("click", (e) => { e.stopPropagation(); window.selectStation && window.selectStation(sid); });
                layer.appendChild(d);
            });
        }
        const on = force !== undefined ? force : !document.body.classList.contains("hk-xp-on");
        document.body.classList.toggle("hk-xp-on", on);
        const btn = document.getElementById("hk-xp-btn");
        if (btn) btn.classList.toggle("on", on);
    }

    function installControls() {
        const ctrl = document.getElementById("modern-zoom-control");
        if (!ctrl || document.getElementById("hk-route-btn")) return;
        const sep = document.createElement("div");
        sep.style.cssText = "width: 20px; height: 1px; background-color: #e0e0e0; margin: 4px 0;";
        const rb = document.createElement("button");
        rb.id = "hk-route-btn"; rb.title = "行程規劃（優先同台換乘）";
        rb.innerHTML = `<cgo-icon name="route" size="20"></cgo-icon>`;
        rb.addEventListener("click", (e) => { e.stopPropagation(); document.body.classList.contains("hk-route-open") ? closeRoute() : openRoute(); });
        const xb = document.createElement("button");
        xb.id = "hk-xp-btn"; xb.title = "標示同台換乘站";
        xb.innerHTML = `<cgo-icon name="transfer" size="20"></cgo-icon>`;
        xb.addEventListener("click", (e) => { e.stopPropagation(); toggleXpMarks(); });
        ctrl.appendChild(sep); ctrl.appendChild(rb); ctrl.appendChild(xb);
    }

    // ==========================================================================
    // 3b. 圖例放大：點擊圖上左下角圖例，彈出可交互的大圖例；點綫路即在圖上單獨高亮
    // ==========================================================================
    const LEGEND_BOX = { x: 98.1, y: 971.1, w: 264, h: 233 };   // 圖例框（畫布像素）
    const LEGEND_LINES = ["AEL", "DRL", "EAL", "ISL", "KTL", "SIL", "TKL", "TWL", "TML", "TCL", "LR", "HSR"];

    /** 某綫在圖上的所有繪製條目（輕鐵由多段組成） */
    function visualIdsOf(lid) {
        return allLines().filter(l => !l.isPointOnly && !l.patch && (l.id === lid || l.id.startsWith(lid + "_"))).map(l => l.id);
    }
    function stationsOfLine(lid) {
        const L = routableLines()[lid];
        if (L) return [...new Set(L.ways.flat())];
        const pt = allLines().find(l => l.id === lid + "_PT");
        return pt ? pt.stationIds.slice() : [];
    }
    function lineSummary(lid) {
        const L = routableLines()[lid];
        const n = stationsOfLine(lid).length;
        if (!L) {
            if (lid === "LR") return `屯門、元朗區內輕便鐵路網絡 · 與屯馬綫 ${n} 站相交`;
            if (lid === "HSR") return "香港西九龍 ⇄ 內地各城市";
            return "";
        }
        const ends = [...new Set(L.ways.map(w => w[w.length - 1]))].map(stName).join("／");
        return `${stName(L.ref[0])} ⇄ ${ends} · ${n} 站`;
    }

    function exitLineFocus(keepHighlights) {
        const content = document.getElementById("map-content");
        if (!content || !content.classList.contains("hk-linefocus")) return;
        content.classList.remove("hk-linefocus");
        document.querySelectorAll(".hk-on-line").forEach(el => el.classList.remove("hk-on-line"));
        const chip = document.getElementById("hk-focus-chip");
        if (chip) chip.remove();
        if (!keepHighlights && typeof window.clearHighlights === "function") window.clearHighlights();
    }
    function focusLine(lid) {
        const content = document.getElementById("map-content");
        if (!content) return;
        if (typeof window.resetMapState === "function") window.resetMapState();
        exitLineFocus();
        visualIdsOf(lid).forEach(id => window.highlightLine && window.highlightLine(id, null, true));
        stationsOfLine(lid).forEach(sid => ["node_", "label_"].forEach(p => {
            const el = document.getElementById(p + sid);
            if (el) el.classList.add("hk-on-line");
        }));
        content.classList.add("hk-linefocus");
        const n = LINE_NAMES[lid] || [lid, ""];
        const chip = document.createElement("button");
        chip.id = "hk-focus-chip";
        chip.innerHTML = `<i style="background:${lineColor(lid)}"></i><b>${n[0]}</b><span>${n[1]}</span><cgo-icon name="close" size="14"></cgo-icon>`;
        chip.title = "顯示全部綫路";
        chip.addEventListener("click", (e) => { e.stopPropagation(); exitLineFocus(); });
        document.body.appendChild(chip);
        const pts = [];
        visualIdsOf(lid).forEach(id => polylinesOf(id).forEach(pl => pl.forEach(q => pts.push(q))));
        fitToPoints(pts.length ? pts : stationsOfLine(lid).map(sid => stationMap()[sid]).filter(Boolean));
    }

    function openLegend() {
        let ov = document.getElementById("hk-legend-modal");
        if (!ov) {
            ov = document.createElement("div");
            ov.id = "hk-legend-modal";
            const rows = LEGEND_LINES.map(lid => {
                const n = LINE_NAMES[lid];
                return `<button class="hk-lg-line" data-l="${lid}">
                    <i class="hk-lg-sw" style="background:${lineColor(lid)}"></i>
                    <span class="hk-lg-name"><b>${n[0]}</b><em>${n[1]}</em><small>${lineSummary(lid)}</small></span>
                    <span class="hk-lg-go"><cgo-icon name="eye" size="15"></cgo-icon>圖上顯示</span>
                </button>`;
            }).join("");
            const sym = (svg, cn, en, extra) => `<div class="hk-lg-sym"><span class="hk-lg-ic">${svg}</span><span class="hk-lg-name"><b>${cn}</b><em>${en}</em>${extra ? `<small>${extra}</small>` : ""}</span></div>`;
            const ring = (x) => `<circle cx="${x}" cy="10" r="6" fill="var(--hk-ring-fill)" stroke="var(--hk-ink)" stroke-width="2"/>`;
            const syms = [
                sym(`<svg viewBox="0 0 44 20">${`<path d="M14 10H30" stroke="var(--hk-ink)" stroke-width="2"/>`}${ring(8)}${ring(36)}</svg>`, "已付車費區域", "Paid area", "毋須出閘即可步行換乘，例如中環 ⇄ 香港"),
                sym(`<svg viewBox="0 0 44 20"><path d="M14 10H30" stroke="var(--hk-ink)" stroke-width="2" stroke-dasharray="3.5 2.2"/>${ring(8)}${ring(36)}</svg>`, "閘外區域", "Unpaid area", "須出閘步行，例如尖沙咀 ⇄ 尖東"),
                sym(`<svg viewBox="0 0 44 20"><path d="M16.6 3.3c-3.7 0-6.7 3-6.7 6.7s3 6.7 6.7 6.7c1.5 0 2.9-.5 4-1.3 1.1.8 2.5 1.3 4 1.3 3.7 0 6.7-3 6.7-6.7s-3-6.7-6.7-6.7c-1.5 0-2.9.5-4 1.3-1.1-.8-2.5-1.3-4-1.3Z" fill="var(--hk-ring-fill)" stroke="var(--hk-ink)" stroke-width="2"/><rect x="12.5" y="8.7" width="8" height="2.7" fill="#E60012"/><rect x="20.6" y="8.7" width="8" height="2.7" fill="#00A040"/></svg>`, "轉綫站", "Interchange", "連珠內的色條代表可換乘的綫路"),
                sym(`<svg viewBox="0 0 44 20"><path d="M22 3V17M15.9 6.5L28.1 13.5M15.9 13.5L28.1 6.5" stroke="var(--hk-ink)" stroke-width="2.4"/></svg>`, "只限賽馬日", "Race days only", "馬場站只在賽馬日開放"),
                sym(`<svg viewBox="0 0 44 20"><circle cx="22" cy="10" r="7" fill="none" stroke="#D0021B" stroke-width="2"/><circle cx="22" cy="10" r="3" fill="#D0021B"/></svg>`, "同台換乘站", "Cross-platform interchange", "互動圖專屬：左側按鈕可在圖上標示")
            ].join("");
            ov.innerHTML = `<div class="hk-lg-card" role="dialog" aria-label="圖例">
                <div class="hk-lg-top"><cgo-icon name="layer" size="18"></cgo-icon><b>圖例</b><span>Legend</span>
                    <button class="hk-lg-close" title="關閉"><cgo-icon name="close" size="18"></cgo-icon></button></div>
                <div class="hk-lg-body">
                    <div class="hk-lg-h">綫路 <span>點擊在圖上單獨顯示</span></div>
                    <div class="hk-lg-lines">${rows}
                        <div class="hk-lg-line hk-lg-static"><i class="hk-lg-sw" style="background:#C1C4C6"></i>
                        <span class="hk-lg-name"><b>深圳地鐵網絡</b><em>Shenzhen Metro Network</em><small>經羅湖、落馬洲口岸銜接</small></span></div>
                    </div>
                    <div class="hk-lg-h">符號</div>
                    <div class="hk-lg-syms">${syms}</div>
                </div></div>`;
            document.body.appendChild(ov);
            ov.addEventListener("click", (e) => {
                const line = e.target.closest(".hk-lg-line[data-l]");
                if (line) { closeLegend(); focusLine(line.dataset.l); return; }
                if (e.target === ov || e.target.closest(".hk-lg-close")) closeLegend();
            });
            ["pointerdown", "wheel", "touchstart"].forEach(ev => ov.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
        }
        requestAnimationFrame(() => ov.classList.add("show"));
        document.addEventListener("keydown", legendEsc);
    }
    function legendEsc(e) { if (e.key === "Escape") closeLegend(); }
    function closeLegend() {
        const ov = document.getElementById("hk-legend-modal");
        if (ov) ov.classList.remove("show");
        document.removeEventListener("keydown", legendEsc);
    }

    /** 圖上圖例框的點擊熱區（拖動地圖時不觸發） */
    function installLegendHotspot() {
        const content = document.getElementById("map-content");
        if (!content || document.getElementById("hk-legend-hot")) return;
        const hot = document.createElement("div");
        hot.id = "hk-legend-hot";
        hot.style.cssText = `left:${LEGEND_BOX.x}px;top:${LEGEND_BOX.y}px;width:${LEGEND_BOX.w}px;height:${LEGEND_BOX.h}px;`;
        hot.innerHTML = `<span class="hk-legend-hint"><cgo-icon name="zoom-in" size="13"></cgo-icon>點擊放大圖例</span>`;
        let down = null;
        hot.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
        hot.addEventListener("click", (e) => {
            const moved = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6;
            down = null;
            if (moved || window.isMapDragging) return;
            e.stopPropagation();
            openLegend();
        });
        content.appendChild(hot);
        // 點地圖空白處時退出綫路單獨顯示。用捕獲階段監聽：引擎的車站點擊處理會 stopPropagation，
        // 冒泡監聽收不到點車站的事件，淡化狀態就會殘留，看起來像仍選中圖例裡的那條綫。
        document.getElementById("map-container")?.addEventListener("click", (e) => {
            if (e.target.closest("#hk-legend-hot")) return;
            // 點車站時引擎會自行重設高亮，這裡只退出淡化狀態
            exitLineFocus(Boolean(e.target.closest(".station, .label-group")));
        }, true);
    }

    // ==========================================================================
    // 4. 車站資訊板模塊
    // ==========================================================================
    function xpIslandHtml(sid, isl, idx) {
        const side = ([lid, term], pos) => {
            const dir = dirOfTerminus(lid, term);
            const arrive = term === sid; // 以本站為終點的列車
            const t = arrive ? `終點站 · 由${towardsText(lid, -dir)}方向抵達` : `往 ${towardsText(lid, dir)}`;
            const te = arrive ? `Terminating` : `to ${towardsEn(lid, dir)}`;
            return `<div class="hk-trk hk-trk-${pos}" style="--lc:${lineColor(lid)}" data-l="${lid}" data-d="${dir}" data-t="${term}">` +
                `${badge(lid)}<span class="hk-trk-dir"><b>${t}</b><i>${te}</i></span>` +
                `<span class="hk-trk-train"></span></div>`;
        };
        return `<div class="hk-island" data-i="${idx}">${side(isl[0], "a")}` +
            `<div class="hk-plat"><cgo-icon name="transfer" size="13"></cgo-icon>島式月台 · 同台換乘</div>${side(isl[1], "b")}</div>`;
    }

    const XpModule = {
        id: "hk-cross-platform",
        name: "同台換乘指南",
        slot: "body-top",
        order: 20,
        shouldRender(ctx) { return Boolean(ctx.station && XP[ctx.station.id]); },
        render(ctx) {
            const sid = ctx.station.id, x = XP[sid];
            const chips = [];
            x.islands.forEach((isl, i) => isl.forEach(([lid, term], j) => {
                const dir = dirOfTerminus(lid, term);
                // 「乘坐 A 往 X 抵達」→ 對面是 isl[1-j]；以本站為終點的列車同樣可以「落車過對面」
                const what = term === sid ? "終點站列車" : `往${towardsText(lid, dir)}`;
                chips.push(`<button class="hk-xp-chip" data-i="${i}" data-j="${j}" style="--lc:${lineColor(lid)}">` +
                    `${(LINE_NAMES[lid] || [lid])[0]} · ${what}</button>`);
            }));
            return `<div class="hk-xp-card">
                <div class="hk-xp-title"><cgo-icon name="transfer" size="16"></cgo-icon>同台換乘指南<span>Cross-platform interchange</span></div>
                <div class="hk-xp-note">${x.note}</div>
                <div class="hk-xp-ask">我乘坐的列車是：</div>
                <div class="hk-xp-chips">${chips.join("")}</div>
                <div class="hk-xp-answer">選擇上方方向，查看落車後對面月台的列車。</div>
                <div class="hk-islands">${x.islands.map((isl, i) => xpIslandHtml(sid, isl, i)).join("")}</div>
                <div class="hk-xp-foot">月台佈局按綫路走向示意，實際月台編號以站內指示為準。</div>
            </div>`;
        },
        onMounted(panel, ctx) {
            const sid = ctx.station.id, x = XP[sid];
            const card = panel.querySelector(".hk-xp-card");
            if (!card) return;
            // 用實時班次資料補上真實月台編號（以本站為終點的一側按該綫其餘月台推斷不了，保持空白）
            card.querySelectorAll(".hk-trk").forEach(tr => {
                const lid = tr.dataset.l, dir = +tr.dataset.d, term = tr.dataset.t;
                if (term === sid) return;
                fetchNextTrains(lid, sid).then(res => {
                    const t = trainsToward(res, lid, sid, dir, null)[0];
                    if (!t || !t.plat || !tr.isConnected) return;
                    const tag = document.createElement("span");
                    tag.className = "hk-trk-plat";
                    tag.innerHTML = `<span class="hk-plat-no">${t.plat}</span>號月台 · ${minsText(t)}`;
                    tr.querySelector(".hk-trk-dir").appendChild(tag);
                });
            });
            card.querySelectorAll(".hk-xp-chip").forEach(btn => btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const i = +btn.dataset.i, j = +btn.dataset.j;
                card.querySelectorAll(".hk-xp-chip").forEach(b => b.classList.toggle("on", b === btn));
                card.querySelectorAll(".hk-island").forEach(el => el.classList.toggle("focus", +el.dataset.i === i));
                card.querySelectorAll(".hk-trk").forEach(el => el.classList.remove("from", "to"));
                const isl = card.querySelector(`.hk-island[data-i="${i}"]`);
                const fromEl = isl.querySelector(j ? ".hk-trk-b" : ".hk-trk-a");
                const toEl = isl.querySelector(j ? ".hk-trk-a" : ".hk-trk-b");
                fromEl.classList.add("from"); toEl.classList.add("to");
                const [tl, tt] = x.islands[i][1 - j];
                const td = dirOfTerminus(tl, tt);
                const dest = tt === sid ? `（該側為以本站為終點的到站列車，不可在此上車）` : `往 <b>${towardsText(tl, td)}</b>`;
                card.querySelector(".hk-xp-answer").innerHTML =
                    `落車後<b>直接步往對面月台</b>，即可轉乘 ${badge(tl)} ${dest}。`;
            }));
        }
    };

    const WalkModule = {
        id: "hk-walk-transfer",
        name: "步行換乘",
        slot: "body-top",
        order: 30,
        shouldRender(ctx) { return Boolean(ctx.station && walksFrom(ctx.station.id).length); },
        render(ctx) {
            const rows = walksFrom(ctx.station.id).map(({ to, w }) => {
                const lines = linesAt(to).concat(to === "WEK" ? ["HSR"] : []);
                return `<div class="hk-walk-row"><cgo-icon name="walk" size="16"></cgo-icon>` +
                    `<div><div><a data-jump="${to}">${stName(to)}</a> ${lines.map(badge).join("")}</div>` +
                    `<small>${w.paid ? "付費區內" : "閘外"} · 約 ${w.min} 分鐘 · ${w.text}</small></div></div>`;
            }).join("");
            return `<div class="hk-walk-card"><div class="hk-xp-title"><cgo-icon name="walk" size="16"></cgo-icon>步行換乘<span>Walking interchange</span></div>${rows}</div>`;
        },
        onMounted(panel) {
            panel.querySelectorAll(".hk-walk-card [data-jump]").forEach(a => a.addEventListener("click", (e) => {
                e.stopPropagation(); window.selectStation && window.selectStation(a.dataset.jump);
            }));
        }
    };

    // ── 香港定制資訊板：月台方向牌、車站資訊與 Google 地圖 ──────────────────────
    // 區域按港島 / 九龍（含新九龍）/ 新界劃分；大嶼山各站另註
    const ISLAND = "KET HKU SYP SHW CEN HOK ADM WAC EXC CAB TIH FOH NOP QUB TAK SWH SKW HFC CHW OCP WCH LET SOH".split(" ");
    const KOWLOON = "TST JOR YMT MOK PRE SSP CSW LCK MEF KOW OLY NAC AUS ETS HUH HOM TKW SUW KAT DIH WHA SKM KOT LOF WTS CHH KOB NTK KWT LAT YAT MKK WEK".split(" ");
    const LANTAU = "TUC SUN DIS AIR AWE".split(" ");
    function regionOf(sid) {
        if (ISLAND.includes(sid)) return ["港島", "Hong Kong Island"];
        if (KOWLOON.includes(sid)) return ["九龍", "Kowloon"];
        if (LANTAU.includes(sid)) return ["新界 · 大嶼山", "New Territories · Lantau"];
        return ["新界", "New Territories"];
    }
    /** 全站通用及個別車站的乘車貼士（只列公開、穩定的服務特點） */
    function tipsOf(sid) {
        const lines = linesAt(sid);
        const t = [];
        if (XP[sid]) t.push(["transfer", "設同台換乘，詳見綫路分頁上方的「同台換乘指南」"]);
        if (sid === "RAC") t.push(["calendar", "只在賽馬日開放，其餘日子列車不停本站"]);
        if (sid === "LOW" || sid === "LMC") t.push(["gate", "過境口岸站：出閘即進入出入境管制範圍，須持有效旅行證件"]);
        if (sid === "WEK") t.push(["crh", "高鐵香港段：往內地須另購高鐵車票，站內辦理「一地兩檢」通關"]);
        if (lines.includes("EAL")) t.push(["ticket", "東鐵綫列車設頭等車廂，乘坐須另付頭等車費"]);
        if (lines.includes("AEL")) t.push(["plane", "機場快綫按專用車費收費" + (sid === "HOK" || sid === "KOW" ? "；本站設市區預辦登機（視乎航空公司）" : "")]);
        if (sid === "SUN") t.push(["tourist", "往迪士尼樂園請在本站轉乘迪士尼綫"]);
        if (sid === "TUC") t.push(["tram", "鄰近昂坪纜車東涌站"]);
        if (["TUM", "SIH", "TIS", "YUL"].includes(sid)) t.push(["tram", "可轉乘輕鐵，前往屯門及元朗區內各站"]);
        return t;
    }
    function gmapsUrl(sid, mode) {
        const q = `${stEn(sid)} Station, Hong Kong`;
        return mode === "dir"
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=transit`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    }

    const HeaderTitleModule = {
        id: "header-title",
        name: "站名標題（香港）",
        slot: "header",
        order: 20,
        render(ctx) {
            const st = ctx.station || {};
            const r = regionOf(st.id);
            return `<div class="header-name-group hk-head">
                <div class="panel-cn-name">${st.cn || ""}</div>
                <div class="panel-en-name">${st.en || ""}</div>
                <div class="hk-head-meta"><span class="hk-code">${st.id}</span><span>${r[0]}</span></div>
            </div>`;
        }
    };

    /**
     * 每次打開車站資訊板都先退出「圖例綫路單獨顯示」：選站的途徑很多（點擊、搜索、
     * 行程卡片跳轉、換乘連結），資訊板渲染是它們的共同出口。只移除淡化狀態，
     * 不清高亮（此時引擎已為新選中的車站設好高亮）。
     */
    const FocusResetModule = {
        id: "hk-focus-reset",
        name: "退出綫路單獨顯示",
        slot: "header",
        order: 1,
        render() { exitLineFocus(true); return ""; }
    };

    /** 標題欄底部的綫路色帶（取自車站所屬各綫） */
    const HeaderStripeModule = {
        id: "hk-header-stripe",
        name: "綫路色帶",
        slot: "header",
        order: 40,
        render(ctx) {
            const ids = linesAt(ctx.station.id).concat((ctx.relatedLinesInfo || []).filter(l => l.isPointOnly).map(l => l.id.replace("_PT", "")));
            const cols = [...new Set(ids)].map(lineColor);
            if (!cols.length) return "";
            const stops = cols.map((c, i) => `${c} ${(i / cols.length * 100).toFixed(2)}% ${((i + 1) / cols.length * 100).toFixed(2)}%`).join(",");
            return `<div class="hk-stripe" style="background:linear-gradient(90deg,${stops})"></div>`;
        }
    };

    /** 綫路分頁：仿月台方向牌，列出兩個行車方向的下一站與距終點站數 */
    const DirectionModule = {
        id: "hk-directions",
        name: "月台方向牌",
        targetTab: "line-tab",
        order: 20,
        render(ctx) {
            const sid = ctx.station.id, lid = ctx.lineInfo && ctx.lineInfo.id;
            const L = routableLines()[lid];
            if (!L) return "";
            const color = lineColor(lid);
            const rows = [];
            [-1, 1].forEach(dir => {
                // 同一方向可能因支綫而有不同終點：按終點分組
                const byEnd = new Map();
                L.ways.forEach(w => {
                    const i = w.indexOf(sid);
                    if (i === -1 || !w[i + dir]) return;
                    const end = dir > 0 ? w[w.length - 1] : w[0];
                    if (!byEnd.has(end)) byEnd.set(end, { next: w[i + dir], left: dir > 0 ? w.length - 1 - i : i });
                });
                byEnd.forEach((v, end) => rows.push({ dir, end, ...v }));
            });
            if (!rows.length) return "";
            const isTerminus = rows.length === 1 && L.ways.every(w => w[0] === sid || w[w.length - 1] === sid);
            const board = rows.map(r => `
                <div class="hk-dir" data-jump="${r.next}">
                    <div class="hk-dir-arrow" style="background:${color}"><cgo-icon name="arrow-${r.dir > 0 ? "right" : "left"}" size="16"></cgo-icon></div>
                    <div class="hk-dir-main">
                        <div class="hk-dir-to">往 <b>${stName(r.end)}</b><i>to ${stEn(r.end)}</i></div>
                        <div class="hk-dir-next">下一站 <b>${stName(r.next)}</b> · 距終點站 ${r.left} 站</div>
                        ${NT_LINES.includes(lid) ? `<div class="hk-live" data-live="${lid}|${sid}|${r.dir}|${r.end}">載入實時班次…</div>` : ""}
                    </div>
                    <cgo-icon class="hk-dir-go" name="chevron-right" size="16"></cgo-icon>
                </div>`).join("");
            return `<div class="hk-dirs">${isTerminus ? `<div class="hk-terminus">本站為${(LINE_NAMES[lid] || [lid])[0]}終點站</div>` : ""}${board}</div>`;
        },
        onMounted(panel, ctx) {
            panel.querySelectorAll(".hk-dir[data-jump]").forEach(el => el.addEventListener("click", (e) => {
                e.stopPropagation();
                window.selectStation && window.selectStation(el.dataset.jump);
            }));
            // 各綫分頁各自掛載；只處理本分頁內的實時班次
            const pane = panel.querySelector(`.tab-pane[data-tab-index="${ctx.tabIndex}"]`) || panel;
            mountLive(pane);
        }
    };

    /** 車站資訊分頁：代號、區域、服務綫路、乘車貼士 */
    const StationInfoModule = {
        id: "hk-station-info",
        name: "車站資訊（香港）",
        targetTab: "station-info",
        order: 10,
        render(ctx) {
            const sid = ctx.station.id;
            const r = regionOf(sid);
            const all = (ctx.relatedLinesInfo || []).map(l => l.id.replace("_PT", ""));
            const kind = XP[sid] ? "同台換乘站" : all.length > 1 ? "轉綫站" :
                (Object.values(routableLines()).some(L => L.ways.some(w => w[0] === sid || w[w.length - 1] === sid)) ? "終點站" : "一般車站");
            const tips = tipsOf(sid).map(([ic, tx]) => `<li><cgo-icon name="${ic}" size="15"></cgo-icon><span>${tx}</span></li>`).join("");
            return `<div class="hk-info">
                <div class="hk-info-grid">
                    <div><small>車站代號</small><b class="hk-mono">${sid}</b></div>
                    <div><small>所屬區域</small><b>${r[0]}</b></div>
                    <div><small>車站類型</small><b>${kind}</b></div>
                </div>
                <div class="hk-info-lines"><small>服務綫路</small><div>${all.map(badge).join("")}</div></div>
                <div class="hk-info-pay"><small>車費支付</small><div><span>八達通</span><span>感應式銀行卡</span><span>乘車二維碼</span></div></div>
                ${tips ? `<ul class="hk-tips">${tips}</ul>` : ""}
                <div class="hk-info-foot">資料僅供參考，實際安排以車站告示為準。</div>
            </div>`;
        },
        onMounted(panel) {
            // 核心分頁名為簡體「车站信息」，香港資訊板改用繁體
            const tab = panel.querySelector('.tab-item[data-tab-index="station-info"]');
            if (tab) tab.textContent = "車站資訊";
        }
    };

    /** 附近巴士 / 小巴：運輸署 GTFS 離綫整理，展開時才加載數據 */
    const OP_NAMES = { KMB: "九巴", CTB: "城巴", "KMB+CTB": "九巴 / 城巴", LWB: "龍運", "LWB+CTB": "龍運 / 城巴", NLB: "新大嶼山巴士",
        LRTFeeder: "港鐵巴士", GMB: "專綫小巴", XB: "過境巴士", DB: "愉景灣巴士", PI: "馬灣巴士", TRAM: "電車", PTRAM: "山頂纜車", FERRY: "渡輪" };
    const OP_KIND = { GMB: "mini", TRAM: "tram", PTRAM: "tram", FERRY: "ferry" };
    function busListHtml(sid, B, opFilter, q) {
        const rows = (B.st[sid] || []).map(([i, d]) => ({ r: B.routes[i], d: d * 10 }));
        if (!rows.length) return `<div class="hk-bus-empty">附近 220 米內沒有登記的巴士 / 小巴站</div>`;
        const ops = [...new Set(rows.map(x => x.r[0]))];
        const counts = {}; rows.forEach(x => { counts[x.r[0]] = (counts[x.r[0]] || 0) + 1; });
        const ql = (q || "").trim().toUpperCase();
        const shown = rows.filter(x => (!opFilter || x.r[0] === opFilter) && (!ql || x.r[1].toUpperCase().startsWith(ql) || x.r[2].includes(q.trim())));
        const chips = `<div class="hk-bus-ops"><button data-op="" class="${!opFilter ? "on" : ""}">全部 ${rows.length}</button>` +
            ops.map(o => `<button data-op="${o}" class="${o === opFilter ? "on" : ""}">${OP_NAMES[o] || o} ${counts[o]}</button>`).join("") + `</div>`;
        const list = shown.slice(0, 60).map(x => `<div class="hk-bus-r hk-k-${OP_KIND[x.r[0]] || "bus"}">
                <b>${x.r[1]}</b><span>往 ${x.r[2]}</span><small>${OP_NAMES[x.r[0]] || x.r[0]} · ${x.d} 米</small></div>`).join("");
        return chips + `<div class="hk-bus-list">${list || `<div class="hk-bus-empty">沒有符合的路綫</div>`}</div>` +
            (shown.length > 60 ? `<div class="hk-bus-more">另有 ${shown.length - 60} 條，請用上方篩選或輸入路綫號碼</div>` : "");
    }
    const BusModule = {
        id: "hk-buses",
        name: "附近巴士 / 小巴",
        targetTab: "station-info",
        order: 20,
        render(ctx) {
            return `<div class="hk-bus" data-sid="${ctx.station.id}">
                <button class="hk-bus-open"><cgo-icon name="bus" size="16"></cgo-icon>附近巴士 · 小巴路綫<cgo-icon name="chevron-down" size="15"></cgo-icon></button>
                <div class="hk-bus-body" hidden>
                    <input class="hk-bus-q" type="search" placeholder="輸入路綫號碼或目的地" autocomplete="off">
                    <div class="hk-bus-out">載入中…</div>
                    <div class="hk-bus-src">資料：運輸署公共交通資料（DATA.GOV.HK）、車站位置 © OpenStreetMap；範圍為車站 220 米內，僅供參考。</div>
                </div>
            </div>`;
        },
        onMounted(panel) {
            panel.querySelectorAll(".hk-bus").forEach(box => {
                if (box.dataset.bound) return;
                box.dataset.bound = "1";
                const sid = box.dataset.sid, body = box.querySelector(".hk-bus-body"), out = box.querySelector(".hk-bus-out"), q = box.querySelector(".hk-bus-q");
                let op = "";
                const draw = () => loadHKData("buses", "HK_BUS").then(B => { out.innerHTML = B ? busListHtml(sid, B, op, q.value) : "未能載入巴士資料"; });
                box.querySelector(".hk-bus-open").addEventListener("click", (e) => {
                    e.stopPropagation();
                    body.hidden = !body.hidden;
                    box.classList.toggle("open", !body.hidden);
                    if (!body.hidden) draw();
                });
                q.addEventListener("input", draw);
                out.addEventListener("click", (e) => {
                    const b = e.target.closest("[data-op]");
                    if (!b) return;
                    e.stopPropagation();
                    op = b.dataset.op; draw();
                });
            });
        }
    };

    /** 沒有港鐵綫路分頁的車站（如只有高鐵的香港西九龍）：直接在正文顯示車站資訊，取代「暂无详细运营信息」 */
    const InfoFallbackModule = {
        id: "hk-info-fallback",
        name: "車站資訊（無綫路分頁時）",
        slot: "body-top",
        order: 90,
        shouldRender(ctx) { return !(ctx.displayLines || []).length; },
        render(ctx) { return StationInfoModule.render(ctx) + BusModule.render(ctx); },
        onMounted(panel) {
            BusModule.onMounted(panel);
            const body = panel.querySelector(".panel-body");
            if (!body) return;
            [...body.children].forEach(el => { if (/暂无详细运营信息/.test(el.textContent) && !el.querySelector(".hk-info")) el.remove(); });
            const nav = panel.querySelector(".panel-tabs-container");
            if (nav && !nav.querySelector(".tab-item")) nav.classList.add("hk-notabs");
        }
    };

    /** 底欄：Google 地圖 + 行程規劃入口（取代高德導航） */
    /**
     * 底欄：按行程狀態切換
     *  1. 未開始：「由此出發」「到這裡去」；
     *  2. 已選起點、正在看另一個站：醒目的「到這裡去」主按鈕，並預覽用時與換乘次數；
     *  3. 已選目的地（未選起點）：醒目的「由此出發」主按鈕；
     *  4. 正在看已選的那一端：提示「請在圖上點選另一端」；
     *  5. 行程進行中：「設為新起點 / 新目的地」。
     * Google 地圖按鈕常駐最下方（取代高德導航）。
     */
    const FooterModule = {
        id: "hk-footer",
        name: "底欄（行程 / Google 地圖）",
        slot: "footer",
        order: 10,
        render(ctx) {
            const sid = ctx.station.id;
            const { from, to } = routeState;
            let trip = "";
            const preview = (a, b) => {
                const r = planRoute(a, b);
                if (!r) return "";
                const st = routeStats(r);
                return `約 ${r.minutes} 分鐘 · ${st.stops} 站 · 換乘 ${st.transfers} 次${st.xps ? `（同台 ${st.xps}）` : ""}`;
            };
            if (from && to) {
                trip = `<div class="hk-trip-now">目前行程：${stName(from)} → ${stName(to)}</div>
                    <div class="hk-route-actions">
                        <button data-end="from"><i class="hk-dot hk-o"></i>設為新起點</button>
                        <button data-end="to"><i class="hk-dot hk-d"></i>設為新目的地</button>
                    </div>`;
            } else if (from && sid === from) {
                trip = `<div class="hk-trip-hint"><i class="hk-dot hk-o"></i>已設為起點，請在圖上點選目的地<button data-cancel>取消</button></div>`;
            } else if (to && sid === to) {
                trip = `<div class="hk-trip-hint"><i class="hk-dot hk-d"></i>已設為目的地，請在圖上點選出發站<button data-cancel>取消</button></div>`;
            } else if (from) {
                trip = `<button class="hk-cta hk-cta-to" data-end="to">
                        <span class="hk-cta-main"><cgo-icon name="route" size="18"></cgo-icon>到這裡去</span>
                        <span class="hk-cta-sub">由 ${stName(from)} 出發 · ${preview(from, sid)}</span></button>
                    <div class="hk-cta-alt"><button data-end="from">改為以本站為起點</button><button data-cancel>取消行程</button></div>`;
            } else if (to) {
                trip = `<button class="hk-cta hk-cta-from" data-end="from">
                        <span class="hk-cta-main"><cgo-icon name="route" size="18"></cgo-icon>由此出發</span>
                        <span class="hk-cta-sub">前往 ${stName(to)} · ${preview(sid, to)}</span></button>
                    <div class="hk-cta-alt"><button data-end="to">改為以本站為目的地</button><button data-cancel>取消行程</button></div>`;
            } else {
                trip = `<div class="hk-route-actions">
                        <button data-end="from"><i class="hk-dot hk-o"></i>由此出發</button>
                        <button data-end="to"><i class="hk-dot hk-d"></i>到這裡去</button>
                    </div>`;
            }
            return `<div class="hk-foot">${trip}
                <div class="hk-gmaps">
                    <a class="hk-gm-main" href="${gmapsUrl(sid, "dir")}" target="_blank" rel="noopener"><cgo-icon name="location" size="16"></cgo-icon>Google 地圖導航至本站</a>
                    <a class="hk-gm-sub" href="${gmapsUrl(sid, "search")}" target="_blank" rel="noopener" title="在 Google 地圖查看車站位置"><cgo-icon name="map" size="16"></cgo-icon></a>
                </div>
            </div>`;
        },
        onMounted(panel, ctx) {
            panel.querySelectorAll(".hk-foot [data-end]").forEach(b => b.addEventListener("click", (e) => {
                e.stopPropagation();
                setRouteEnd(b.dataset.end, ctx.station.id);
            }));
            panel.querySelectorAll(".hk-foot [data-cancel]").forEach(b => b.addEventListener("click", (e) => {
                e.stopPropagation();
                cancelTrip();
                if (typeof window.resetMapState === "function") window.resetMapState();
            }));
        }
    };

    // ==========================================================================
    // 5. 啟動
    // ==========================================================================
    /**
     * 把裝飾層 <img> 換成內聯 SVG：深色模式下只需用 CSS 重新著色海陸底圖，
     * 圖例色塊與綫路色保持原樣（整體 invert 濾鏡會把綫路標誌色一併扭曲）。
     */
    function inlineDeco() {
        const layer = document.getElementById("scattered-layer");
        if (layer && !layer.dataset.hkObs) {
            layer.dataset.hkObs = "1";
            new MutationObserver(inlineDeco).observe(layer, { childList: true, subtree: true });
        }
        const img = document.querySelector('#scattered-layer img[src*="hongkong_deco.svg"]');
        if (!img || img.dataset.hkInline) return;
        img.dataset.hkInline = "1";
        fetch(img.src).then(r => r.text()).then((txt) => {
            const wrap = document.createElement("div");
            wrap.className = "hk-deco-svg";
            wrap.innerHTML = txt;
            const svg = wrap.querySelector("svg");
            if (!svg) return;
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            img.replaceWith(wrap);
        }).catch(() => { /* 保留 <img> 作回退 */ });
    }

    /**
     * 手機底部抽屜：引擎在面板上任何位置按下都會 setPointerCapture，
     * 導致之後的 click 派發給面板本身而非按鈕，資訊板內的按鈕在觸控時點不動。
     * 這裡在捕獲階段攔下「從可點元素開始」的 pointerdown，不讓抽屜拖動接管；
     * 拖動把手、標題欄與空白處仍可正常拖動抽屜。
     */
    function installTapGuard() {
        if (window.__hkTapGuard) return;
        window.__hkTapGuard = true;
        const TAPPABLE = "button, a, select, input, summary, .tab-item, .hk-dir, .hk-rt-ride, .hk-xp-chip, [data-jump]";
        document.addEventListener("pointerdown", (e) => {
            if (window.innerWidth > 640) return;
            const panel = e.target.closest && e.target.closest("#info-panel");
            if (!panel) return;
            if (e.target.closest(".sheet-grabber")) return;
            if (e.target.closest(TAPPABLE)) e.stopPropagation();
        }, true);
    }

    /** 引擎畫出綫路後立刻開始開場動畫（不等站名與字體，避免開頭一段靜止的藍色底） */
    function startIntroWhenReady() {
        const lines = document.getElementById("lines-layer");
        if (!lines) { setTimeout(startIntroWhenReady, 30); return; }
        const go = () => requestAnimationFrame(() => playIntro());
        if (lines.querySelector(".line-visual-group")) { go(); return; }
        const mo = new MutationObserver(() => {
            if (lines.querySelector(".line-visual-group")) { mo.disconnect(); go(); }
        });
        mo.observe(lines, { childList: true });
    }

    function boot() {
        startIntroWhenReady();
        if (!installLabelObserver()) setTimeout(boot, 60);
        installControls();
        inlineDeco();
        installLegendHotspot();
        installTapGuard();
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0));
    } else {
        setTimeout(boot, 0);
    }
    window.addEventListener("load", () => { installControls(); inlineDeco(); if (fontsReady) { layoutAllLabels(); buildDecoText(); } });

    // ── 綫路徽標元數據 ───────────────────────────────────────────────────────────
    const LINE_BADGE_META = {};
    Object.keys(LINE_NAMES).forEach((id) => {
        const color = { AEL: "#00888E", DRL: "#EB6EA5", EAL: "#5EB7E8", ISL: "#0075C2", KTL: "#00A040", SIL: "#CBD300",
                        TKL: "#7E3C93", TWL: "#E60012", TML: "#9C2E00", TCL: "#F3982D", LR: "#DBB400", HSR: "#9C948B" }[id];
        LINE_BADGE_META[LINE_NAMES[id][0]] = {
            id, color, svgclr: color, svgtext: id === "SIL" ? "#1B2A12" : "#ffffff",
            svg: `./city/hongkong/assets/line/${id}.svg`,
            company: id === "HSR" ? "港鐵公司（高鐵香港段）" : "港鐵公司"
        };
    });

    const HongKongCity = {
        id: "hongkong",
        name: "香港",
        searchCity: "香港",
        center: { x: 1030, y: 600 },
        defaultScale: 0.55,
        mapSize: { width: 2055, height: 1238 },
        officialMapUrl: "https://www.mtr.com.hk/ch/customer/services/system_map.html",
        // 示意圖站距按畫布像素 × 20 米估算，僅作參考
        schematicMetersPerPixel: 20,

        maintainers: [
            { name: "待認領", role: "城市主理人招募中", isRecruiting: true,
              github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md" }
        ],

        LINE_META: LINE_BADGE_META,
        LINE_SORT_ORDER: LINE_ORDER.concat(["LR_PT", "HSR_PT"]),
        LINE_SYNC_GROUPS: [],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],

        dataFiles: { stanameCsvUrl: "./city/hongkong/staname.csv" },

        renderStationIcon,
        getStationLabelStyle() { return null; },

        // 資訊板只在香港定制：關閉通用的上一站/下一站、車站類型、運營單位與高德導航，
        // 改用月台方向牌、車站資訊與 Google 地圖；標題模塊換成帶車站代號的版本
        stationBoard: {
            modules: {
                "header-title": HeaderTitleModule,
                "hk-focus-reset": FocusResetModule,
                "hk-header-stripe": HeaderStripeModule,
                "adjacent-stations": { enabled: false },
                "station-type": { enabled: false },
                "operators": { enabled: false },
                "footer-actions": { enabled: false },
                "hk-cross-platform": XpModule,
                "hk-walk-transfer": WalkModule,
                "hk-directions": DirectionModule,
                "hk-station-info": StationInfoModule,
                "hk-buses": BusModule,
                "hk-info-fallback": InfoFallbackModule,
                "hk-footer": FooterModule
            }
        },

        getNavigationUrl(stationName) {
            const sid = Object.keys(stationMap()).find(k => stationMap()[k].cn === stationName);
            const q = sid ? `${stEn(sid)} Station, Hong Kong` : `${stationName}站 香港`;
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
        },
        getRailway12306Url(stationName) {
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent("香港西九龙")}`;
        },
        getSuburbanLinks() { return null; },
        formatOwnerName(raw) { return raw || "港鐵公司"; },
        formatCompanyString(list) { return [...new Set(list)].join("，"); },

        stacard: { getRenderer: () => null },
        async initStaCard() { return null; },
        hasStaCard() { return false; },
        getStaCardHtml() { return ""; },
        async renderStaCards() { return null; },

        // 供調試與其它模塊調用
        hk: { planRoute, hopPoints, isCrossPlatform, tripFare, loadHKData, track, startTracking, boardNow, tickTracking, openLegend, focusLine, exitLineFocus, openRoute, closeRoute, toggleXpMarks, XP, WALKS }
    };

    window.HONGKONG_CITY = HongKongCity;
    window.CURRENT_CITY = HongKongCity;
    window.CityDataManager?.registerCity?.({
        id: HongKongCity.id,
        name: HongKongCity.name,
        folder: "./city/hongkong",
        mainLogic: "./city/hongkong/hongkong.js",
        center: HongKongCity.center,
        defaultScale: HongKongCity.defaultScale,
        mapSize: HongKongCity.mapSize,
        searchCity: HongKongCity.searchCity,
        title: "CGo OpenMap - 香港鐵路綫路圖",
        keywords: "CGo OpenMap, 香港鐵路, 港鐵, 香港地鐵, 綫路圖, 同台換乘",
        description: "由 CGo OpenMap 驅動的香港鐵路交互綫路圖（非官方），支援同台換乘指南與優先同台換乘的行程規劃。",
        officialMapUrl: HongKongCity.officialMapUrl,
        isDefault: false,
        ...HongKongCity
    });

    console.log("[HongKongCity] 香港城市模塊加載完成。");
})();
