/**
 * CGo OpenMap - 线网发展史动态演示（city/shenyang/shared/tools/opening-history.js）
 *
 * 按 CGO_OPENING_HISTORY（城市数据文件 data_opening_history.js）的时间线，把线网
 * 从**空白画布**上逐段「画」出来：镜头跟着画笔走，笔到之处线路延伸、车站与站名弹出。
 *
 * 三层分离（与 shared/README.md「线网发展史」一节一致）：
 *   数据层：window.CGO_OPENING_HISTORY（只写端点，区段由 data_lines.js 站序自动切）
 *   时钟层：`buildTimeline` 把 [from, to] 摊成绝对时刻表，`tick` 只负责推进 t
 *   表现层：`applyFrame(t)` —— **幂等**地把 t 时刻的画面落到 DOM（弹出、涟漪、描边、
 *           相机、面板全在里头），播放与「导出视频」共用这一份实现
 *
 * ⚠️ 三套时钟（WAAPI 描边、CSS 动画、rAF 补间）已经统一成这一条时间轴：原先那种写法
 *    时间只活在 setTimeout 里、取不回来，导出就没法逐帧出图。缓动改用同一条贝塞尔的
 *    JS 求值，CSS 侧不再挂任何动画 —— 弹出进度一律用 CSS 变量 + `applyFrame` 写值。
 *
 * 画布接管（手法参考香港的開場動畫，见 city/hongkong/hongkong.js 的 playIntro）：
 *   - 核心的线路本体（#lines-layer .line-visual-group）与在建虚线层让出去；
 *     ⚠️ 不能藏整个 #lines-layer —— 沈阳的呼出线（换乘站引线）就画在那一层里；
 *   - 线路不给自绘——从核心已渲染的 .line-visual-inner 采样出**子段**（形状含倒角，
 *     与底图分毫不差），再用描边偏移把它「画」出来；子段插到 #stations-layer 之前，
 *     于是线条天然压在站点图元与站名之下；
 *   - 车站与站名仍由核心渲染（站名排版没法自绘），只是先藏起来，画笔到位时逐个弹出。
 * 于是「范围」天然由沿革数据决定：没有开通记录的线路（有轨、已停运等）不在演示里出现。
 *
 * 挂载方式：经 window.CGoMapTools.registerTool 注册成免选站工具，面板外壳（浮层 /
 * 固定侧栏两种形态、返回按钮、尺寸观察）全部复用地图小工具那一套。
 */

(function () {
    "use strict";

    const NS = "http://www.w3.org/2000/svg";
    const LAYER_ID = "cgo-oh-layer";
    const STYLE_ID = "cgo-oh-style";
    const TOOL_ID = "history";
    const STAGE_CLASS = "cgo-oh-stage";     // 挂在 #map-content：让出底图线网层
    const POP_CLASS = "cgo-oh-pop";         // 挂在站点 / 站名 / 引线元素：弹出
    const DOT_CLASS = "cgo-oh-dot";         // 换乘站「还没成为换乘站」时的普通站形态
    const NO_CLASS = "cgo-oh-no";           // 暂缓开通：站名转「未开通」文字色
    const NO_SHAPE_CLASS = "cgo-oh-no-shape"; // 暂缓开通：图元改用未开通图元（盖住原生图元）
    const NO_ICON_CLASS = "cgo-oh-noicon";  // 那层覆盖图元本身
    const ON_CLASS = "cgo-oh-on";           // 虚拟换乘连线：该条两端都通了，可以画
    const ALWAYS_CLASS = "cgo-oh-always";   // 没有开通记录的国铁站：全程固定显示
    const BODY_CLASS = "cgo-oh-body";       // 挂到面板正文上：交给本模块管滚动

    /**
     * 运镜速度：画笔沿画布前进的像素/秒。
     * 上限 300 —— 再快就成了「一闪而过」，站名来不及看（原先默认 450 就是这个问题）。
     */
    const SPEED = { min: 60, max: 300, step: 10, def: 150 };
    /** 特写倍数：这类镜头只取「车站」那一级的景，故上限给到 6 倍 */
    const ZOOM = { min: 1, max: 6, step: 0.1, def: 2.6 };
    /** 进场动画基准时长（ms）与时长上限 —— 实际时长按运镜速度反比缩放 */
    const POP_BASE = 300;
    /** 取景移动/段落停顿（ms） */
    const T = { glide: 380, holdBase: 900, tailHold: 1600 };
    /** 演示期间临时放宽的缩放范围：全图取景比城市默认下限还小 */
    const SCALE_FLOOR = 0.2;
    /** 窄屏口径（与全仓 `MOBILE_MAX` 一致）：此宽度下浮层是贴底抽屉，而非贴在角落的浮岛 */
    const MOBILE_MAX = 640;

    const KIND_LABEL = { "line-open": "区段开通", "station-open": "车站开通", rename: "车站更名" };

    const REDUCE = typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** SVG 选择器里的站点 ID 转义（防城市用奇怪字符做 ID） */
    const esc = (v) => (window.CSS && CSS.escape ? CSS.escape(String(v)) : String(v));

    /* ======================================================================
     * 样式注入：按脚本自身 URL 找同名 css
     * ==================================================================== */

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

    /* ======================================================================
     * 运行期状态（时钟层）
     * ==================================================================== */

    const state = {
        steps: [],
        index: -1,
        playing: false,
        speed: SPEED.def,
        zoom: ZOOM.def,
        raf: 0,
        popDur: POP_BASE,   // 站点弹出时长（ms）
        rippleDur: POP_BASE * 1.6,
        timeline: null,     // 当前时间线（buildTimeline 的产物）
        tCur: 0,            // 本次播放已推进到的时刻
        tStart: 0,          // 本次播放的起点（performance.now()）
        frameT: 0,          // 正在应用的帧时刻（涟漪等取用）
        popDone: new Set(), // 「步:站」：已经弹过的站（同一步只弹一次）
        activePops: [],     // 正在弹的站
        ripples: [],        // 正在扩散的涟漪
        lastPanelI: null,   // 上一次刷新面板的事件序号
        lastResyncI: null,  // 上一次补「已出现车站」状态的事件序号
        exportCss: "",      // 导出用：内联进每帧 SVG 的同源 CSS 文本
        exportImgCache: new Map(), // 导出用：外部图片 → data URL
        exporting: false,   // 是否正在导出视频（导出期间锁住实时播放那几枚控件）
        exportCancelled: false,
        muxerLoading: null, // mp4-muxer 的按需加载 Promise（同一份只注入一次）
        shown: new Map(),   // sid → form：已经出现在画布上的车站（引线重建后据此补状态）
        dotColors: new Map(), // sid → dot 形态的环色（首条开通线路的颜色）
        alwaysOn: new Set(), // 全程固定显示的车站（国铁散点等，不参与逐个弹出）
        renamed: new Map(), // sid → 原文：被本模块改成旧名的标签，退出时还原
        renameMap: new Map(), // sid → { from, to, date }：更名规则（mount 时按数据重建）
        scaleCity: null,    // 被临时放宽缩放范围的城市
        prevView: null,     // 接管前的取景
        body: null,
        els: null
    };

    /** 停下所有时钟：只留一个 rAF 句柄 —— 弹出、涟漪、滚动都由 applyFrame 按 t 现算 */
    function clearTimers() {
        if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
        state.activePops = [];
        state.ripples = [];
    }

    const glideMs = () => (REDUCE ? 0 : T.glide);
    const holdMs = () => (REDUCE ? 0 : T.holdBase * (SPEED.def / state.speed));
    /** 该段生长时长：画布像素长度 ÷ 运镜速度 */
    const growDuration = (step) => (REDUCE ? 1 : Math.max(240, step.lengthPx / state.speed * 1000));

    /* ======================================================================
     * 几何：沿核心已渲染的路径取子段
     * ==================================================================== */

    const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

    /** 把核心的线路路径按约 2px 一步采样成折线 —— 这样子段自带倒角，与底图分毫不差 */
    function sampleCorePath(lineId) {
        const group = document.querySelector(`.line-visual-group[data-visual-id="${esc(lineId)}"]`);
        const path = group && group.querySelector(".line-visual-inner");
        if (!path || typeof path.getTotalLength !== "function") return null;
        let total = 0;
        try { total = path.getTotalLength(); } catch (e) { return null; }
        if (!total) return null;
        const n = Math.min(2000, Math.max(2, Math.ceil(total / 2)));
        const pts = [];
        for (let i = 0; i <= n; i++) {
            const p = path.getPointAtLength(total * i / n);
            pts.push({ x: p.x, y: p.y });
        }
        return pts;
    }

    function segLength(pts) {
        let L = 0;
        for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
        return L;
    }

    /** 折线上距起点 s 处的点 */
    function pointAt(pts, s) {
        let acc = 0;
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const len = dist(a, b);
            if (acc + len >= s || i === pts.length - 1) {
                const t = len ? Math.max(0, Math.min(1, (s - acc) / len)) : 0;
                return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
            }
            acc += len;
        }
        return { x: pts[0].x, y: pts[0].y };
    }

    /** 点在折线上的最近点弧长 */
    function projectOnPath(pts, p) {
        let acc = 0, best = Infinity, bestLen = null;
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            if (!len) continue;
            let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
            t = Math.max(0, Math.min(1, t));
            const d = Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
            if (d < best) { best = d; bestLen = acc + len * t; }
            acc += len;
        }
        return bestLen;
    }

    /** 折线上 [s0, s1] 的子折线（含两端插值点，总是从 s0 侧起笔） */
    function slicePath(pts, s0, s1) {
        const out = [pointAt(pts, s0)];
        let acc = 0;
        for (let i = 1; i < pts.length; i++) {
            acc += dist(pts[i - 1], pts[i]);
            if (acc > s0 && acc < s1) out.push({ x: pts[i].x, y: pts[i].y });
        }
        out.push(pointAt(pts, s1));
        return out;
    }

    const toD = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

    function bboxOf(pts) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        pts.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        });
        return { minX, minY, maxX, maxY };
    }

    function stepLabel(step) {
        if (step.kind === "rename" && step.rename) return `${step.rename.from} → ${step.rename.to}`;
        return step.note || step.lineName;
    }

    /* ======================================================================
     * 数据准备
     * ==================================================================== */

    const stationMap = () => window.processedStations || window.stationsData || {};
    const linesData = () => (Array.isArray(window.linesData) ? window.linesData : []);

    /** 线路站序（分支线把各 way 顺序拼接） */
    function lineStations(line) {
        if (Array.isArray(line.stationIds)) return line.stationIds;
        const out = [];
        Object.keys(line).forEach((key) => {
            if (!/^stationIds(-|$)/.test(key) || !Array.isArray(line[key])) return;
            line[key].forEach((sid) => { if (!out.includes(sid)) out.push(sid); });
        });
        return out;
    }

    /**
     * 把沿革事件解析成可播放的步骤。
     *
     * 播放顺序按日期全局升序（数据文件按线路分组书写便于维护，顺序在这里归一）。
     * 几处按时间推进的判定都在这里一次算完，播放时只读不算：
     *   · 延伸方向：从**已开通的那一端**起笔（如 2 号线北延二期由航空航天大学往蒲田路画）；
     *   · 站点形态：换乘站在只通了一条线时先按普通站（dot）入场，第二条线开通时才转 tsf；
     *     暂缓开通的车站也在所属线路开通时先以 dot 出现，到自己的补开事件再转正式形态；
     *   · 更名：有更名记录的车站在更名日期之前一律用旧名入场；
     *   · 里程：逐段累加已开通区间的站距，供面板显示当前运营里程。
     */
    function build() {
        const st = stationMap();
        const byId = {};
        linesData().forEach((l) => { byId[l.id] = l; });
        const events = (window.CGO_OPENING_HISTORY || []).slice()
            .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

        const delayed = new Map();   // 暂缓开通站 → 补开日期
        const renameOf = new Map();  // sid → { from, to, date }
        events.forEach((ev) => {
            if (ev.kind === "station-open") {
                (ev.stations || []).forEach((sid) => delayed.set(sid, ev.date));
            } else if (ev.kind === "rename") {
                const sid = Object.keys(st).find((k) => st[k].cn === ev.to);
                if (sid) renameOf.set(sid, { from: ev.from, to: ev.to, fromEn: ev.fromEn, date: ev.date });
            }
        });

        const shown = new Set();      // 已经出现在画布上的站
        const lineIdsAt = new Map();  // sid → Set(已开通线路 ID)
        const firstLineOf = new Map(); // sid → 首条开通线路 ID
        const formOf = new Map();     // sid → 当前形态
        const steps = [];

        /**
         * 此刻该站应以什么形态出现：
         * 换乘站不满两条线先当普通站画；**暂缓开通**的站哪怕线路已经通过，
         * 本站也先按「未开通」图元示意，直到它自己的补开事件才转正式形态。
         */
        const wantForm = (sid, date) => {
            const s = st[sid];
            if (!s) return "real";
            if (delayed.has(sid) && delayed.get(sid) > date) return "no";
            const n = (lineIdsAt.get(sid) || new Set()).size;
            return (s.type === "tsf" && n < 2) ? "dot" : "real";
        };

        events.forEach((ev) => {
            const line = byId[ev.lineId];
            if (!line) return;
            const ids = lineStations(line);
            const step = {
                date: ev.date,
                kind: ev.kind,
                note: ev.note || "",
                lineId: ev.lineId,
                lineName: line.name || ev.lineId,
                color: line.color || "#8a94a6",
                pts: null,
                lengthPx: 0,
                stations: [],
                focus: null,
                rename: null,
                addedMileage: 0
            };

            /** 段内每站登记一次「该线已开通」，再逐个决定是否入场 / 是否换形态 */
            const collect = (segIds, path, s0, s1, reversed) => {
                segIds.forEach((sid) => {
                    if (!lineIdsAt.has(sid)) {
                        lineIdsAt.set(sid, new Set());
                        firstLineOf.set(sid, ev.lineId);   // 首条开通的线路（dot 形态用它上色）
                    }
                    lineIdsAt.get(sid).add(ev.lineId);
                });
                segIds.forEach((sid) => {
                    const s = st[sid];
                    if (!s || !Number.isFinite(s.x)) return;
                    const want = wantForm(sid, ev.date);
                    const cur = formOf.get(sid);
                    let mode;
                    if (!shown.has(sid)) {
                        shown.add(sid);
                        formOf.set(sid, want);
                        mode = "enter";
                    } else if (cur !== want) {
                        formOf.set(sid, want);
                        mode = "upgrade";   // 已在线网上，这次是「从普通站变成换乘站」
                    } else {
                        return;   // 已在画布上、形态也没变：无事发生
                    }
                    let t = 0.5;
                    if (path && Number.isFinite(s0) && Number.isFinite(s1) && s1 !== s0) {
                        const at = projectOnPath(path, s);
                        // t 是「沿线位置」，必须与画笔的行进方向一致：
                        // 线条从已开通端起笔时子折线是反的，站点的 t 也要跟着翻过来
                        if (at !== null) {
                            t = Math.max(0, Math.min(1, (at - s0) / (s1 - s0)));
                            if (reversed) t = 1 - t;
                        }
                    }
                    const firstLine = byId[firstLineOf.get(sid)];
                    step.stations.push({
                        sid: sid, x: s.x, y: s.y, t: t, form: want, mode: mode,
                        dotColor: firstLine ? firstLine.color : line.color
                    });
                });
                step.stations.sort((a, b) => a.t - b.t);
            };

            if (ev.kind === "line-open") {
                const i = ids.indexOf(ev.from), j = ids.indexOf(ev.to);
                if (i < 0 || j < 0) return;
                const lo = Math.min(i, j), hi = Math.max(i, j);
                const segIds = ids.slice(lo, hi + 1);
                const path = sampleCorePath(ev.lineId)
                    || (Array.isArray(line.pathPoints) && line.pathPoints.length >= 2 ? line.pathPoints : null)
                    || segIds.map((sid) => st[sid]).filter((s) => s && Number.isFinite(s.x));
                if (!path || path.length < 2) return;

                const lens = segIds.map((sid) => (st[sid] && Number.isFinite(st[sid].x)
                    ? projectOnPath(path, st[sid]) : null)).filter((v) => v !== null);
                if (!lens.length) return;
                const s0 = Math.min.apply(null, lens), s1 = Math.max.apply(null, lens);
                let pts = slicePath(path, s0, s1);

                // 延伸线从**已开通的那一端**起笔：看两端的邻居谁已经通了
                const neighborOpen = (k) => {
                    const prev = ids[k - 1], next = ids[k + 1];
                    return Boolean((prev && shown.has(prev)) || (next && shown.has(next)));
                };
                const fromOpen = neighborOpen(i), toOpen = neighborOpen(j);
                const startSid = (fromOpen && !toOpen) ? ids[i] : (!fromOpen && toOpen ? ids[j] : ids[lo]);
                const reversed = ids[lo] !== startSid;
                if (reversed) pts = pts.slice().reverse();

                step.pts = pts;
                step.lengthPx = Math.max(1, segLength(pts));
                step.focus = pointAt(pts, step.lengthPx / 2);

                // 里程：该段各站距之和（未核实的站距按非数值跳过）
                const dists = Array.isArray(line.distances) ? line.distances : [];
                for (let k = lo; k < hi; k++) {
                    const d = Number(dists[k]);
                    if (Number.isFinite(d)) step.addedMileage += d;
                }
                collect(segIds, path, s0, s1, reversed);
            } else if (ev.kind === "station-open") {
                const targets = (ev.stations || []).filter((sid) => st[sid] && Number.isFinite(st[sid].x));
                collect(targets, null, NaN, NaN, false);
                if (targets.length) {
                    step.focus = { x: st[targets[0]].x, y: st[targets[0]].y };
                }
            } else if (ev.kind === "rename") {
                const sid = Object.keys(st).find((k) => st[k].cn === ev.to);
                const hit = sid && renameOf.get(sid);
                if (hit) {
                    // toEn 取车站数据里的 en（更名后就是它），更名前则用 fromEn 顶替
                    step.rename = { sid: sid, from: hit.from, to: hit.to, fromEn: hit.fromEn, toEn: st[sid].en };
                    step.focus = { x: st[sid].x, y: st[sid].y };
                }
            }

            steps.push(step);
        });

        // 累计量一次算好：面板每步只读，不必重算
        const lineSet = new Set();
        const seen = new Set();
        let mileage = 0;
        // 国铁车站（`type: "rdot"`）不计入站数统计 —— 它们不是城市轨道交通的车站
        // （市域铁路怎么算待定，目前五城都没有市域铁路线路）。图元、入场动画与
        // 满图取景都照旧，只把「车站 N 座 / 新增 N 站」这两笔账里的它们剔掉。
        const railStations = new Set();
        Object.keys(st).forEach((sid) => {
            if (st[sid] && st[sid].type === "rdot") railStations.add(sid);
        });
        steps.forEach((s, i) => {
            if (s.kind === "line-open") lineSet.add(s.lineId);
            let added = 0, counted = 0;
            s.stations.forEach((x) => {
                if (railStations.has(x.sid)) return;
                seen.add(x.sid);
                counted++;
                if (x.mode === "enter") added++;
            });
            mileage += s.addedMileage;
            s.no = i + 1;
            s.lines = lineSet.size;
            s.enterCount = added;
            s.upgradeCount = counted - added;
            s.stationCount = seen.size;
            s.mileage = mileage / 1000;   // 米 → 公里
        });
        return steps;
    }

    /* ======================================================================
     * 画布接管
     * ==================================================================== */

    /** 临时放宽当前城市的缩放范围：特写要 6 倍、全图取景比默认下限还小 */
    function pushScaleLimit() {
        const city = window.CURRENT_CITY;
        if (!city || city._cgoOhScale !== undefined) return;
        const max = typeof city.maxScale === "number" ? city.maxScale : 3;
        const min = typeof city.minScale === "number" ? city.minScale : 0.5;
        if (max >= ZOOM.max && min <= SCALE_FLOOR) return;
        city._cgoOhScale = { max: max, min: min };
        city.maxScale = Math.max(max, ZOOM.max);
        city.minScale = Math.min(min, SCALE_FLOOR);
        state.scaleCity = city;
    }

    function popScaleLimit() {
        const city = state.scaleCity;
        state.scaleCity = null;
        if (!city || !city._cgoOhScale) return;
        city.maxScale = city._cgoOhScale.max;
        city.minScale = city._cgoOhScale.min;
        delete city._cgoOhScale;
    }

    const stageHost = () => document.getElementById("map-content");

    /**
     * 侧栏形态下把侧栏收起时，区块会连同面板一起消失 —— 得把面板改挂成浮层重新出现，
     * 顺带结束正在跑的演示（否则留下「窗口没了、线还在长」这种状态）。
     * openTool 会走 closePanel → unmount 把旧实例收干净，再按当前形态重建。
     */
    let pinnedObserver = null;

    function watchPinned() {
        if (pinnedObserver) return;
        let wasPinned = document.body.classList.contains("legend-pinned");
        pinnedObserver = new MutationObserver(() => {
            const pinned = document.body.classList.contains("legend-pinned");
            if (pinned === wasPinned) return;
            wasPinned = pinned;
            if (!pinned && state.body) window.CGoMapTools?.openTool?.(TOOL_ID);
        });
        pinnedObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }

    function unwatchPinned() {
        pinnedObserver?.disconnect();
        pinnedObserver = null;
    }

    /**
     * 接管画布前，把地图上的「选中态」收干净。
     * 否则从车站详情 / 路线结果点进「地图小工具」再进这里时，会留下详情浮窗与
     * 高亮的线路、车站 —— 底图线网都被让出去了，它们还亮在画布上，很突兀。
     *
     * ⚠️ 行程规划那一套不在核心的高亮体系里（底图淡化是 `#map-content.cgo-routing` 的滤镜、
     * 规划路径画在 `#cgo-route-layer`、沿途站带 `.cgo-on-route`），而且它有个 MutationObserver
     * 把起终点的 `active` **保活**：`restoreEndpoints` 是无条件重打标记并补 `active` 的，
     * 只要它的 `endpointIds` 非空就永远补得回来（实测 `clearHighlights()` 清完立刻被补 4 个）。
     * 故这一步必须交给它自己的 `clearHighlight()`（会 disconnect 观察器、摘标记、清路径层与淡化），
     * 而不是在外部复刻 —— 那个观察器引用是它的私有状态。
     */
    function resetMapSelection() {
        const routeApi = window.CGoRoutePanel;
        routeApi?.clearHighlight?.();

        const pinBtn = document.getElementById("legend-pin-btn");
        const pinWasActive = !!pinBtn?.classList.contains("active");
        window.clearHighlights?.();   // 核心那套：清 .active（车站/站名/线路）并清空 #highlight-layer
        // 核心这个函数是全文档扫 .active 的，会顺手把侧栏「固定面板」按钮的激活态也清掉，还回去
        if (pinWasActive) pinBtn.classList.add("active");
        routeApi?.close?.();          // 收起行程规划 / 路线结果面板
        const info = document.getElementById("info-panel");
        // #info-panel 走行内 display；只在它是「浮在地图上的卡片」时收起 ——
        // 固定侧栏形态下它是侧栏里的常驻区块，不算画布残留（口径同核心自身）
        if (info && info.parentElement === document.body) info.style.display = "none";
        ["cgo-route-card", "cgo-route-result"].forEach((id) => {
            document.getElementById(id)?.classList.remove("show");
        });
    }

    function enterStage() {
        // 记下接管前的取景，退出时还原 —— 否则关掉面板会留下「内容回来了、镜头还在特写」的状态
        if (!state.prevView && window.getMapView) state.prevView = window.getMapView();
        resetMapSelection();
        stageHost()?.classList.add(STAGE_CLASS);
        pushScaleLimit();
        applyAnimDurations();
        watchCallouts();
        markAlwaysOn();
    }

    function exitStage() {
        unwatchCallouts();
        stageHost()?.classList.remove(STAGE_CLASS);
        clearMarks();
        popScaleLimit();
        const prev = state.prevView;
        state.prevView = null;
        if (prev && window.setMapView) {
            window.setMapView({ scale: prev.scale });
            window.centerMap?.();   // 回到城市初始取景
        }
    }

    /**
     * 进场动画时长随「画面上的推进速度」走：画笔越快、特写倍数越高，站点越要「弹得快」。
     * 画面速度 = 运镜速度（画布 px/s）× 当前缩放 —— 车头固定在可见区中心，已弹出的站点
     * 是**以这个速度向画外退去**的，故两个因子都要按反比缩时长。只看运镜速度的话，
     * 特写推到 4~6 倍时站点会明显跟不上镜头（「还没弹完就出画」）。
     * 基准点取「默认运镜速度 × 默认特写」，此时系数正好是 1，既有手感不变。
     * 时长只存在 state 里：动画由 `applyFrame` 逐帧应用，不再落成 CSS 变量
     * （CSS 动画没法定位到任意 t，导出时取不回画面）。
     */
    function applyAnimDurations() {
        // 「减少动态效果」下把弹出 / 涟漪时长直接归零：applyFrame 一算就是终值，等于不播动画
        if (REDUCE) { state.popDur = 0; state.rippleDur = 0; return; }
        const k = (SPEED.def / state.speed) * (ZOOM.def / state.zoom);
        state.popDur = Math.max(80, Math.min(700, Math.round(POP_BASE * k)));
        state.rippleDur = Math.round(state.popDur * 1.6);
    }

    /**
     * 改运镜速度 / 特写倍数后**重建时间线**，并按「当前步 + 步内进度」落到等价位置：
     * 各段时长与取景倍数都是建表时算死的，不重建的话新设置不会生效。
     */
    function reseek() {
        const tl = state.timeline;
        if (!tl || state.index < 0 || state.index > tl.to) return;
        const old = tl.list.find((r) => r.i === state.index);
        const prog = old ? Math.max(0, Math.min(1, (state.tCur - old.from) / Math.max(1, old.end - old.from))) : 0;
        state.timeline = buildTimeline(state.index, tl.to);
        const rec = state.timeline.list[0];
        if (!rec) return;
        state.tCur = rec.from + prog * (rec.end - rec.from);
        state.tStart = performance.now() - state.tCur;
        if (!state.playing) applyFrame(state.tCur, true);
    }

    const calloutOf = (sid) =>
        document.querySelector(`[data-cgo-callout-layer] [data-cgo-callout="${esc(sid)}"]`);

    /** 该站第一条已开通线路的颜色，用于 dot 形态的环色 */
    function dotColorOf(sid, fallback) {
        const s = stationMap()[sid];
        const c = s && Array.isArray(s.lineColors) && s.lineColors[0];
        return c || fallback;
    }

    /** 主题色变量取一次即可（涟漪用） */
    const themeVar = (name) =>
        (document.documentElement && getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || "";

    /**
     * 暂缓开通的图元：**直接复用核心的未开通图元模板**（`SVGTemplates.no`，齿轮环），
     * 盖在原生图元上，而不是在这里另描一份 —— 与「车站图元唯一真源」的约定一致。
     */
    function setNoIcon(node, show) {
        const old = node.querySelector("." + NO_ICON_CLASS);
        node.classList.toggle(NO_SHAPE_CLASS, show);
        if (!show) { old?.remove(); return; }
        if (old) return;
        const tpl = window.CGoStationIcons?.SVGTemplates?.no;
        if (!tpl) { node.classList.remove(NO_SHAPE_CLASS); return; }
        const box = document.createElement("div");
        box.className = NO_ICON_CLASS;
        box.innerHTML = tpl;
        node.appendChild(box);
    }

    /** 应用站点形态（未开通 / 普通站 / 换乘站） */
    function applyForm(x, fallbackColor) {
        const form = x.form;
        const isDot = form === "dot";
        const isNo = form === "no";
        const node = document.getElementById("node_" + x.sid);
        const label = document.getElementById("label_" + x.sid);
        const line = calloutOf(x.sid);
        [node, label].forEach((el) => el && el.classList.toggle(DOT_CLASS, isDot));
        if (line) line.classList.toggle(DOT_CLASS, isDot);
        if (label) label.classList.toggle(NO_CLASS, isNo);   // 站名转「未开通」文字色
        if (!node) return;
        setNoIcon(node, isNo);
        if (isDot) {
            // 环色取**首条开通线路**的颜色（不是 linesData 里排第一的那条）
            const c = state.dotColors.get(x.sid) || dotColorOf(x.sid, fallbackColor) || "#888";
            node.style.setProperty("--cgo-oh-dot", c);
        } else {
            node.style.removeProperty("--cgo-oh-dot");
        }
    }

    /** 站点、站名与引线一起弹出 */
    function popStation(sid) {
        ["node_", "label_"].forEach((prefix) => {
            document.getElementById(prefix + sid)?.classList.add(POP_CLASS);
        });
        calloutOf(sid)?.classList.add(POP_CLASS);
    }

    /**
     * 引线的显隐不能只靠弹出时打一次类：呼出线会随视口/缩放变化被城市脚本整层重画，
     * 重画后类全丢。故盯住 #lines-layer 的子树（引线层就在其中），一有风吹草动就按
     * state.shown 重刷一遍 —— 一次遍历几十个 path，代价可忽略。
     */
    let calloutObserver = null;

    function repaintCallouts() {
        const layer = document.querySelector("[data-cgo-callout-layer]");
        if (!layer || !layer.children.length) return;
        Array.prototype.forEach.call(layer.children, (el) => {
            const sid = el.getAttribute("data-cgo-callout");
            const form = sid ? state.shown.get(sid) : undefined;
            if (!form) { el.classList.remove(POP_CLASS, DOT_CLASS); return; }
            el.classList.add(POP_CLASS);
            el.classList.toggle(DOT_CLASS, form === "dot");
        });
    }

    function watchCallouts() {
        const linesLayer = document.getElementById("lines-layer");
        if (!linesLayer || calloutObserver) return;
        calloutObserver = new MutationObserver(() => repaintCallouts());
        calloutObserver.observe(linesLayer, { childList: true, subtree: true });
    }

    function unwatchCallouts() {
        calloutObserver?.disconnect();
        calloutObserver = null;
    }

    /**
     * 站点元素可能被核心重建（它随视口 / 缩放重算），按记录补一次状态。
     * 弹出进度也要补 —— 否则重建出来的站会停在「还没弹出」（CSS 变量默认 0）而看不见；
     * `state.shown` 里只有**已经弹过**的站，所以补 alpha=1 不会让未到点的站提前露头。
     */
    function resyncShown() {
        state.shown.forEach((form, sid) => {
            applyForm({ sid: sid, form: form });
            popStation(sid);
            applyPopProgress(sid, 1);
        });
        markAlwaysOn();
        repaintCallouts();
        syncVirtualConnectors();
    }

    /** 该站此刻是否已出现在画布上（含全程固定显示的那些） */
    const isOnCanvas = (sid) => state.shown.has(sid) || state.alwaysOn.has(sid);

    /**
     * 虚拟换乘（站外连通）连线：**两端车站都还没出现时先不画**。
     * 本体由核心画在 `#lines-layer .virtual-connectors` 里，每条连线占 3 个 path
     * （外描边 / 主色 / 细芯），按 `VIRTUAL_CONNECT_LINES` 的顺序排列，故按索引逐条开关。
     *
     * 若实际 path 数与条目数对不上（有条目取不到坐标被核心跳过了），就整组收起 ——
     * 宁可这条虚线不出，也不能张冠李戴。
     */
    function syncVirtualConnectors() {
        const group = document.querySelector("#lines-layer .virtual-connectors");
        if (!group || !group.children.length) return;
        // ⚠️ 这两个数组是城市脚本里的顶层 `const`，只存在于全局词法环境、**不是 window 属性**，
        //    所以只能用 typeof 守卫后按名字直接读（core/script.js 也是这么取的）
        const conns = typeof VIRTUAL_CONNECT_LINES !== "undefined" && Array.isArray(VIRTUAL_CONNECT_LINES)
            ? VIRTUAL_CONNECT_LINES : [];
        const free = typeof VIRTUAL_FREE_CONNECT_LINES !== "undefined" && Array.isArray(VIRTUAL_FREE_CONNECT_LINES)
            ? VIRTUAL_FREE_CONNECT_LINES : [];
        const setOn = (el, on) => el.classList.toggle(ON_CLASS, on);
        const expected = conns.length * 3 + free.length * 2;
        if (group.children.length !== expected) {
            Array.prototype.forEach.call(group.children, (el) => setOn(el, false));
            return;
        }
        let idx = 0;
        conns.forEach((c) => {
            const on = isOnCanvas(c.from) && isOnCanvas(c.to);
            for (let k = 0; k < 3; k++) setOn(group.children[idx + k], on);
            idx += 3;
        });
        free.forEach((c) => {
            const on = isOnCanvas(c.from) && isOnCanvas(c.to);
            for (let k = 0; k < 2; k++) setOn(group.children[idx + k], on);
            idx += 2;
        });
    }

    /** 给「既有设施」（没有开通记录的国铁站）打上固定显示的标记 */
    function markAlwaysOn() {
        state.alwaysOn.forEach((sid) => {
            document.getElementById("node_" + sid)?.classList.add(ALWAYS_CLASS);
            document.getElementById("label_" + sid)?.classList.add(ALWAYS_CLASS);
            calloutOf(sid)?.classList.add(ALWAYS_CLASS);
        });
    }

    function clearMarks() {
        const host = stageHost();
        const marks = [POP_CLASS, DOT_CLASS, ALWAYS_CLASS, NO_CLASS, NO_SHAPE_CLASS];
        host?.querySelectorAll(marks.map((c) => "." + c).join(", "))
            .forEach((el) => el.classList.remove(...marks));
        host?.querySelectorAll("." + NO_ICON_CLASS).forEach((el) => el.remove());
        host?.querySelectorAll("#lines-layer .virtual-connectors ." + ON_CLASS)
            .forEach((el) => el.classList.remove(ON_CLASS));
        // ⚠️ 弹出进度现在是 CSS 变量写的（站点图元一半形态在 ::before 上，内联够不着），
        //    撤类名**不足以**把站藏回去 —— 变量不清掉，站就停在最后一次的透明度上。
        //    这正是「暂停后点已播完的事件：线藏了、站没藏」的根因。
        const vars = ["--cgo-oh-dot", "--cgo-oh-pop-alpha", "--cgo-oh-pop-scale", "--cgo-oh-pop-blur"];
        host?.querySelectorAll(
            "#stations-layer .station, #labels-layer .label-group, [data-cgo-callout-layer] [data-cgo-callout]"
        ).forEach((el) => vars.forEach((v) => el.style.removeProperty(v)));
        state.shown.clear();
        restoreNames();
    }

    function layer() {
        let svg = document.getElementById(LAYER_ID);
        if (svg && svg.isConnected) return svg;
        const host = stageHost();
        if (!host) return null;
        svg = document.createElementNS(NS, "svg");
        svg.setAttribute("id", LAYER_ID);
        svg.setAttribute("width", "1");
        svg.setAttribute("height", "1");
        svg.innerHTML = '<g class="cgo-oh-done"></g><g class="cgo-oh-live"></g>';
        // 插到站点层之前：线条于是压在站点图元与站名之下（同核心把 #lines-layer 排在站点层前）
        const stationsLayer = document.getElementById("stations-layer");
        if (stationsLayer && stationsLayer.parentNode === host) host.insertBefore(svg, stationsLayer);
        else host.appendChild(svg);
        return svg;
    }

    const doneGroup = () => layer()?.querySelector(".cgo-oh-done");
    const liveGroup = () => layer()?.querySelector(".cgo-oh-live");

    function clearCanvas() {
        doneGroup()?.replaceChildren();
        liveGroup()?.replaceChildren();
    }

    /* ======================================================================
     * 取景
     * ==================================================================== */

    /**
     * 可见区几何：地图容器减去被浮层占掉的那几条。
     * - 固定侧栏（浮在地图之上的 `.legend-modal`）取**在地图容器坐标系里**的右边界 ——
     *   用侧栏自身宽度会在侧栏有外边距/偏移时算偏（「侧栏态特写偏移」就是这么来的）；
     * - **底部**读共享层 `window.CGoViewportInsets.bottom`（由 `viewport-inset.js` 从浮层的
     *   `data-cgo-inset` 汇总，地图小工具面板本尊就是其中一块）。但**只在窄屏口径下扣**：
     *   那里面板是横跨整屏的贴底抽屉，取景中心会整个落在它底下（画面看着整体偏下）；
     *   桌面端同一块面板是贴在右下角的浮岛（320px 宽，同样申报了 `bottom`），只占一角，
     *   扣掉反而把整幅构图无谓上推、收笔取景也白缩小一圈。
     *   横向同理不扣：左侧缩放条与右下角浮岛都只占角落，扣了会把桌面端已经调好的横向构图推偏。
     */
    function viewportBox() {
        const host = document.getElementById("map-container");
        if (!host) return null;
        const hr = host.getBoundingClientRect();
        const insets = window.CGoViewportInsets || {};
        let left = 0;
        const modal = document.querySelector("#legend-overlay .legend-modal");
        if (modal && document.body.classList.contains("legend-pinned")) {
            left = Math.max(0, Math.min(hr.width, modal.getBoundingClientRect().right - hr.left));
        }
        const bottom = window.innerWidth <= MOBILE_MAX ? Math.max(0, Number(insets.bottom) || 0) : 0;
        return {
            left: left,
            vw: Math.max(120, hr.width - left),
            vh: Math.max(120, hr.height - bottom)
        };
    }

    /* 取景的「算」在 camForPoint / camForBox（见时间轴一节）；这里不再有「落位」的取景函数
       —— 落位统一由 applyFrame 每帧调 setMapView 完成。 */

    /* ======================================================================
     * 站名更名
     * ==================================================================== */

    const cnSpanOf = (sid) => document.querySelector(`#label_${esc(sid)} .stacn`);
    const enSpanOf = (sid) => document.querySelector(`#label_${esc(sid)} .staen`);

    /** 更名日期之前一律用旧名入场（中英一起换 —— 更名前的英文名也是旧的那个） */
    function applyOldName(sid, date) {
        const info = state.renameMap?.get(sid);
        if (!info || date >= info.date) return;
        const cn = cnSpanOf(sid);
        const en = enSpanOf(sid);
        if (!cn && !en) return;
        if (!state.renamed.has(sid)) {
            state.renamed.set(sid, { cn: cn ? cn.textContent : null, en: en ? en.textContent : null });
        }
        if (cn && cn.textContent !== info.from) cn.textContent = info.from;
        if (en && info.fromEn && en.textContent !== info.fromEn) en.textContent = info.fromEn;
    }

    /* 更名的换字动画不在这里 —— 它由时间轴上的 `applyRenameAt` 按 t 逐帧演 */

    function restoreNames() {
        state.renamed.forEach((rec, sid) => {
            const cn = cnSpanOf(sid);
            if (cn && rec.cn != null) cn.textContent = rec.cn;
            const en = enSpanOf(sid);
            if (en && rec.en != null) en.textContent = rec.en;
        });
        state.renamed.clear();
        // 换字动画留下的透明度也要撤掉，否则退出后名字会是半透明的
        document.querySelectorAll("#labels-layer .stacn, #labels-layer .staen")
            .forEach((el) => el.style.removeProperty("opacity"));
    }

    /** 直接落成新名（跳转用：跳转不是「演」，不播换字动画） */
    function applyNewName(sid, name, enName) {
        const cn = cnSpanOf(sid);
        if (cn) cn.textContent = name;
        const en = enSpanOf(sid);
        if (en && enName) en.textContent = enName;
        state.renamed.delete(sid);
    }

    /* ======================================================================
     * 时间轴（唯一时钟）
     * ====================================================================
     * 「播放」与「导出」共用同一条时间线：把第 from 步到第 to 步摊成绝对时刻表，
     * 任意 t 都能把画面重算出来（applyFrame）。原先的播放是「一段段 await +
     * setTimeout + WAAPI + CSS 动画」几套时钟并存的异步链 —— 时间只活在定时器里、
     * 取不回来，导出就没法逐帧出图。缓动改为在 JS 里用同一条贝塞尔求值。
     * ==================================================================== */

    /** CSS cubic-bezier(x1,y1,x2,y2) → 求值函数（Newton 迭代；无依赖） */
    function bezier(x1, y1, x2, y2) {
        const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
        const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        const fx = (t) => ((ax * t + bx) * t + cx) * t;
        const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
        const fy = (t) => ((ay * t + by) * t + cy) * t;
        return (x) => {
            if (!(x > 0)) return 0;
            if (x >= 1) return 1;
            let t = x;
            for (let i = 0; i < 6; i++) {
                const d = dx(t);
                if (Math.abs(d) < 1e-6) break;
                t = Math.max(0, Math.min(1, t - (fx(t) - x) / d));
            }
            return fy(t);
        };
    }
    const EASE = bezier(0.25, 0.1, 0.25, 1);        // CSS ease —— 原取景过渡 .cgo-oh-glide
    const EASE_OUT = bezier(0, 0, 0.58, 1);         // CSS ease-out —— 站名淡入、涟漪
    const EASE_POP = bezier(0.2, 0.9, 0.3, 1.35);   // 站点弹出（原 cgo-oh-pop 关键帧）

    /* ---- 取景：只算不落位，这样任意 t 都能重算出相机 ---- */

    const clampZoom = (s) => Math.max(SCALE_FLOOR, Math.min(ZOOM.max, s));

    /** 把某点摆到可见区中心对应的相机参数 */
    function camForPoint(pt, scale) {
        const box = viewportBox();
        if (!box || !pt) return null;
        const s = clampZoom(scale);
        return { scale: s, x: box.left + box.vw / 2 - pt.x * s, y: box.vh / 2 - pt.y * s };
    }

    /** 把某个画布范围整块摆进可见区对应的相机参数 */
    function camForBox(b, pad, maxScale) {
        const box = viewportBox();
        if (!box || !b) return null;
        const bw = Math.max(1, b.maxX - b.minX), bh = Math.max(1, b.maxY - b.minY);
        const s = Math.min(box.vw / bw, box.vh / bh) * pad;
        return camForPoint({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }, Math.min(maxScale || ZOOM.max, s));
    }

    const camLerp = (a, b, e) => (!a ? b : !b ? a
        : { scale: a.scale + (b.scale - a.scale) * e, x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e });

    /** 某一步里画笔停在哪（无走向的单站开通就停在那一站上） */
    const brushAt = (step, p) =>
        (step.pts && step.pts.length > 1 ? pointAt(step.pts, step.lengthPx * p) : step.focus);

    /** 收笔取景：缩到能看该段全貌（长段自动缩小、短段不超过特写倍数） */
    const camTailOf = (step) =>
        (step.pts && step.pts.length > 1
            ? camForBox(bboxOf(step.pts), 0.72, state.zoom)
            : camForPoint(step.focus, state.zoom));

    /** 收尾取景：缩到全图（按已出现在画布上的车站取范围，未开通的散点不参与） */
    function camWholeOf(to) {
        const seen = [];
        for (let i = 0; i <= to; i++) state.steps[i].stations.forEach((x) => seen.push(x));
        const st = stationMap();
        const list = seen.length ? seen : Object.keys(st).map((k) => st[k]).filter((s) => s && Number.isFinite(s.x));
        if (!list.length) return null;
        return camForBox(bboxOf(list), 0.94, ZOOM.max);
    }

    /* ---- 时间线 ---- */

    /**
     * 把 [from, to] 摊成绝对时刻表。每步四拍：
     * 起笔运镜（顺带把日期与进度条从上一事件收口到本事件）→ 生长（含更名换字）
     * → 收笔运镜 → 停顿；末尾再接「缩到全图 + 长停」一段。
     */
    function buildTimeline(from, to) {
        const head = glideMs() ? glideMs() + 90 : 0;
        const hold = holdMs();
        const v0 = window.getMapView ? window.getMapView() : { x: 0, y: 0, scale: 1 };
        let prevCam = { x: v0.x, y: v0.y, scale: v0.scale };
        const list = [];
        let t = 0;
        for (let i = from; i <= to; i++) {
            const step = state.steps[i];
            // ⚠️ 只有「有走向」的步骤才生长：单站开通（station-open）与纯更名步骤没有 pts，
            //    生长时长必须为 0，否则会被 growDuration 的最小值撑出一段空生长，
            //    还会让 ensureGrowPath 拿到 null 的折线点（实测就是这么崩的）。
            const hasPath = !!(step.pts && step.pts.length > 1);
            const growDur = hasPath ? growDuration(step) : 0;
            const renameMs = step.rename ? 500 : 0;
            const rec = {
                i: i, step: step,
                from: t,
                headEnd: t + head,
                growT0: t + head,
                growEnd: t + head + growDur,
                renameEnd: t + head + growDur + renameMs,
                tailEnd: t + head + growDur + renameMs + head,
                end: t + head + growDur + renameMs + head + hold,
                growDur: growDur,
                camFrom: prevCam,
                camHead: camForPoint(brushAt(step, 0), state.zoom),
                camGrowEnd: camForPoint(brushAt(step, 1), state.zoom),
                camTail: camTailOf(step)
            };
            // 站点弹出时刻：笔到人到（末尾留 30ms，别让最后一个站压着收笔）；
            // 无走向的步骤没有「画笔推进」，全部在本拍起点弹出
            rec.pops = step.stations
                .map((x) => ({
                    x: x, step: step,
                    t: rec.growT0 + (growDur > 0 ? Math.max(0, Math.min(growDur - 30, growDur * x.t)) : 0)
                }))
                .sort((a, b) => a.t - b.t);
            list.push(rec);
            prevCam = rec.camTail;
            t = rec.end;
        }
        const whole = {
            whole: true, i: to, step: state.steps[to],
            from: t, headEnd: t + head, growT0: t + head, growEnd: t + head,
            renameEnd: t + head, tailEnd: t + head + head, end: t + head + head + T.tailHold,
            growDur: 0, camFrom: prevCam, camHead: camWholeOf(to), pops: []
        };
        whole.camGrowEnd = whole.camHead;
        whole.camTail = whole.camHead;
        return { list: list, whole: whole, from: from, to: to, total: whole.end, head: head };
    }

    /** t 落在哪一段（段数 ≤ 14，线性扫足够） */
    function recAt(t) {
        const tl = state.timeline;
        for (let k = 0; k < tl.list.length; k++) if (t < tl.list[k].end) return tl.list[k];
        return tl.whole;
    }

    /** t 时刻的相机 */
    function camAt(t) {
        const r = recAt(t);
        const head = state.timeline.head;
        if (t < r.headEnd) return camLerp(r.camFrom, r.camHead, head ? EASE((t - r.from) / head) : 1);
        if (t < r.growEnd) return camForPoint(brushAt(r.step, (t - r.growT0) / r.growDur), state.zoom) || r.camHead;
        if (t < r.renameEnd) return r.camGrowEnd;
        if (t < r.tailEnd) return camLerp(r.camGrowEnd, r.camTail, head ? EASE((t - r.renameEnd) / head) : 1);
        return r.camTail;
    }

    /* ======================================================================
     * 表现层（逐帧应用，唯一实现）
     * ==================================================================== */

    /**
     * 站点 / 站名的弹出：按缓动进度写「缩放 + 透明度」。
     * ⚠️ 一律写成 **CSS 变量**，不写内联 opacity / transform：
     *   · 站点图元的可见形态有一半在 `::before` 伪元素上，内联样式够不着；
     *   · 核心自己会在标签上写内联 opacity（图层避让），用变量才不打架，
     *     退出时把变量一撤即可复原，不留痕。
     */
    function applyPopProgress(sid, e) {
        const alpha = Math.max(0, Math.min(1, e));
        const scale = 0.35 + 0.65 * e;
        const node = document.getElementById("node_" + sid);
        if (node) {
            node.style.setProperty("--cgo-oh-pop-alpha", String(alpha));
            node.style.setProperty("--cgo-oh-pop-scale", String(scale));
        }
        const label = document.getElementById("label_" + sid);
        if (label) {
            label.style.setProperty("--cgo-oh-pop-alpha", String(alpha));
            label.style.setProperty("--cgo-oh-pop-blur", (4 * (1 - alpha)).toFixed(2) + "px");
        }
        const line = calloutOf(sid);
        if (line) line.style.setProperty("--cgo-oh-pop-alpha", String(alpha));
    }

    /** 站点涟漪：笔到人到时那一圈扩散（同一条时间线，散够就收） */
    function ripple(st, color) {
        const group = liveGroup();
        if (!group || REDUCE) return;
        const dot = document.createElementNS(NS, "circle");
        dot.setAttribute("class", "cgo-oh-pulse");
        dot.setAttribute("cx", st.x);
        dot.setAttribute("cy", st.y);
        dot.setAttribute("r", 5);
        dot.setAttribute("stroke", color);
        dot.setAttribute("vector-effect", "non-scaling-stroke");
        group.appendChild(dot);
        state.ripples.push({ el: dot, t0: state.frameT, life: state.rippleDur });
    }

    /** 车站到点了：切形态、弹出、涟漪 */
    function showStation(x, step) {
        state.shown.set(x.sid, x.form);
        if (x.dotColor) state.dotColors.set(x.sid, x.dotColor);
        applyForm(x, step.color);
        applyOldName(x.sid, step.date);
        popStation(x.sid);
        state.activePops.push({ sid: x.sid, t0: state.frameT });
        // 未开通形态的涟漪用「未开通色」，别拿线路色误导人
        ripple(x, x.form === "no" ? (themeVar("--not-open-color") || step.color) : step.color);
        syncVirtualConnectors();   // 站到齐了，站外连通那条虚线可以画了
    }

    /** 生长中的那一段：描边偏移由 t 直接算（原先是 WAAPI fill:forwards） */
    function ensureGrowPath(step) {
        if (!step.pts || step.pts.length < 2) return null;   // 无走向的步骤没有可画的折线
        const group = liveGroup();
        if (!group) return null;
        let node = group.querySelector(".cgo-oh-grow");
        if (!node || node.dataset.no !== String(step.no)) {
            node = document.createElementNS(NS, "path");
            node.setAttribute("class", "cgo-oh-grow");
            node.dataset.no = String(step.no);
            node.setAttribute("d", toD(step.pts));
            node.setAttribute("stroke", step.color);
            node.setAttribute("stroke-width", "5.4");   // 与核心 .line-visual-inner 同宽
            node.setAttribute("vector-effect", "non-scaling-stroke");
            group.replaceChildren(node);
            let len = step.lengthPx;
            try { len = node.getTotalLength(); } catch (e) { /* 用折线长度 */ }
            node.__len = len;
            node.style.strokeDasharray = `${len} ${len}`;
        }
        return node;
    }

    /**
     * 把 t 时刻的画面**幂等**地落到 DOM。播放的每一帧与导出的每一帧都走它。
     * 只做增量：站点弹出沿时间单调推进，每帧只碰「正在弹的那几个」。
     * @param {boolean} [settle] 落定模式：把还在进行中的弹出 / 涟漪直接收尾（跳转、暂停用）
     */
    function applyFrame(t, settle) {
        const tl = state.timeline;
        if (!tl) return;
        state.frameT = t;
        const rec = recAt(t);

        // 换到新的一步时补一次「已出现车站」的状态（核心可能重建过那些节点）
        if (state.lastResyncI !== rec.i) {
            state.lastResyncI = rec.i;
            resyncShown();
        }

        // ── 相机 ──
        const cam = camAt(t);
        if (cam && window.setMapView) window.setMapView({ x: cam.x, y: cam.y, scale: cam.scale });

        // ── 线网：已播完的段落归档进 done 层，当前段在 live 层按 t 拉出描边偏移 ──
        tl.list.forEach((r) => {
            if (r.i < rec.i || (r === rec && t >= r.growEnd)) commitPath(state.steps[r.i]);
        });
        const live = liveGroup();
        const growing = rec.growDur > 0 && t < rec.growEnd;
        if (live && !growing) live.replaceChildren();
        if (live && growing) {
            const node = ensureGrowPath(rec.step);
            if (node) {
                const p = Math.max(0, Math.min(1, (t - rec.growT0) / rec.growDur));
                node.style.strokeDashoffset = String(node.__len * (1 - p));
            }
        }

        // ── 车站：到点的依次弹出（沿时间推进，不回头） ──
        tl.list.forEach((r) => {
            if (r.i > rec.i) return;
            r.pops.forEach((p) => {
                if (p.t > t) return;
                const key = r.i + ":" + p.x.sid;
                if (state.popDone.has(key)) return;
                state.popDone.add(key);
                showStation(p.x, r.step);
            });
        });

        // ── 正在弹的站：更新进度；弹完的落定 ──
        for (let k = state.activePops.length - 1; k >= 0; k--) {
            const ap = state.activePops[k];
            const prog = settle ? 1 : (state.popDur > 0 ? (t - ap.t0) / state.popDur : 1);
            if (prog >= 1) { applyPopProgress(ap.sid, 1); state.activePops.splice(k, 1); }
            else applyPopProgress(ap.sid, EASE_POP(prog));
        }

        // ── 涟漪：散够就收 ──
        for (let k = state.ripples.length - 1; k >= 0; k--) {
            const rp = state.ripples[k];
            const prog = settle ? 1 : (rp.life > 0 ? (t - rp.t0) / rp.life : 1);
            if (prog >= 1) { rp.el.remove(); state.ripples.splice(k, 1); continue; }
            const e = EASE_OUT(prog);
            rp.el.style.transform = "scale(" + (0.5 + 2 * e).toFixed(3) + ")";
            rp.el.style.opacity = String(0.95 * (1 - e));
        }

        // ── 更名：生长之后的那 500ms 里淡出换字 ──
        tl.list.forEach((r) => { if (r.step.rename) applyRenameAt(r, t); });

        // ── 面板 ──
        applyPanel(t, rec);
    }

    /** 更名的换字动画：0~180ms 淡出旧名 → 换字 → 180~500ms 淡入新名 */
    function applyRenameAt(rec, t) {
        const rn = rec.step.rename;
        const p = (t - rec.growEnd) / 500;
        const cn = cnSpanOf(rn.sid), en = enSpanOf(rn.sid);
        if (p < 0) return;
        const put = (name, enName) => {
            if (cn) cn.textContent = name;
            if (en && enName) en.textContent = enName;
        };
        let alpha = 1;
        if (p < 0.36) { put(rn.from, rn.fromEn); alpha = 1 - EASE_OUT(p / 0.36); }
        else { put(rn.to, rn.toEn); alpha = EASE_OUT(Math.min(1, (p - 0.36) / 0.64)); }
        if (p >= 1) { state.renamed.delete(rn.sid); return; }
        [cn, en].forEach((el) => { if (el) el.style.opacity = String(alpha); });
    }

    /** 播完的段落归档进「已开通」层，留在线网上才能看出线网在长大（站点由时间轴负责） */
    function commitPath(step) {
        const group = doneGroup();
        if (!group || !step.pts || step.pts.length < 2) return;
        if (group.querySelector(`[data-no="${step.no}"]`)) return;
        const p = document.createElementNS(NS, "path");
        p.setAttribute("data-no", String(step.no));
        p.setAttribute("data-line", String(step.lineId));   // 供「画布上正在展示的线路数」统计
        p.setAttribute("d", toD(step.pts));
        p.setAttribute("stroke", step.color);
        p.setAttribute("stroke-width", "5.4");
        p.setAttribute("vector-effect", "non-scaling-stroke");
        group.appendChild(p);
    }

    /* ======================================================================
     * 面板（全部按 t 直接算，不再用 rAF 补间）
     * ==================================================================== */

    const pad2 = (n) => String(n).padStart(2, "0");

    /** 日期按比例插值：起笔运镜期间「时间在走」就是它 */
    function lerpDate(a, b, p) {
        const ta = Date.parse(a), tb = Date.parse(b);
        if (!Number.isFinite(ta) || !Number.isFinite(tb) || ta === tb) return b;
        const d = new Date(ta + (tb - ta) * p);
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }

    /** 进度条直接落值。逐帧写 width，得把 CSS 那条 .25s 过渡摘掉，否则每帧重起一段过渡、慢半拍 */
    function setTrack(pct) {
        const bar = state.els && state.els.bar;
        if (!bar) return;
        bar.style.transition = "none";
        bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    }

    /**
     * 该步归档前 / 归档后的「画布所见线路数」：**按已画出走向的段落去重**，
     * 与画面上严格对应（生长中的那条线还没归档就不算）。
     */
    function lineCountAround(i) {
        const set = new Set();
        for (let k = 0; k < i; k++) {
            const s = state.steps[k];
            if (s.pts && s.pts.length > 1) set.add(s.lineId);
        }
        const before = set.size;
        const cur = state.steps[i];
        if (cur.pts && cur.pts.length > 1) set.add(cur.lineId);
        return { before: before, after: set.size };
    }

    /**
     * 面板在 t 时刻的取值：日期与进度条在起笔运镜期间从上一事件收到本事件；车站 / 里程
     * 随生长一起滚；线路数在段落归档后补上；徽标、说明与清单高亮只在事件切换时刷一次。
     */
    function applyPanel(t, rec) {
        if (!state.els) return;
        const i = rec.i;
        const step = state.steps[i];
        const prev = i > 0 ? state.steps[i - 1] : null;
        const head = state.timeline.head;
        const rolling = !rec.whole && head > 0 && t < rec.headEnd;
        const p = rolling ? (t - rec.from) / head : 1;
        state.els.date.textContent = lerpDate(prev ? prev.date : step.date, step.date, p);
        const pctFrom = prev ? trackPercentAt(i - 1) : trackPercentAt(i);
        setTrack(rolling ? pctFrom + (trackPercentAt(i) - pctFrom) * p : trackPercentAt(i));

        const gp = rec.growDur > 0 ? Math.max(0, Math.min(1, (t - rec.growT0) / rec.growDur)) : 1;
        const stFrom = prev ? prev.stationCount : 0, stTo = step.stationCount;
        const miFrom = prev ? prev.mileage : 0, miTo = step.mileage;
        state.els.stations.textContent = String(Math.round(stFrom + (stTo - stFrom) * gp));
        state.els.mileage.textContent = (miFrom + (miTo - miFrom) * gp).toFixed(1);
        const lc = lineCountAround(i);
        const lp = Math.max(0, Math.min(1, (t - rec.growEnd) / 150));
        state.els.lines.textContent = String(Math.round(lc.before + (lc.after - lc.before) * lp));

        // 徽标 / 说明 / 清单高亮：只在事件切换时刷一次
        if (state.lastPanelI !== i) {
            state.lastPanelI = i;
            syncNow();
            state.els.list.querySelectorAll(".cgo-oh-item").forEach((li) => {
                const no = Number(li.dataset.go);
                li.classList.toggle("is-active", no === i + 1);
                li.classList.toggle("is-done", no <= i);
            });
        }
    }

    /* ======================================================================
     * 面板正文
     * ==================================================================== */

    function renderBody() {
        return `
            <div class="cgo-oh">
                <div class="cgo-oh-fixed">
                    <div class="cgo-oh-now">
                        <span class="cgo-oh-date">尚未开始</span>
                        <span class="cgo-oh-badge" hidden></span>
                    </div>
                    <p class="cgo-oh-desc">点「播放」从空白画布起笔，镜头跟着画笔把线网逐段画出来；也可用操作行的清单按钮跳到任一年份。</p>
                    <div class="cgo-oh-sum">
                        <span>线路 <b data-oh="lines">0</b> 条</span>
                        <span>车站 <b data-oh="stations">0</b> 座</span>
                        <span>里程 <b data-oh="mileage">0</b> km</span>
                    </div>
                    <div class="cgo-oh-track"><div class="cgo-oh-bar"></div></div>
                    <div class="cgo-oh-actions cgo-mt-actions">
                        <button type="button" class="cgo-mt-quick cgo-oh-icon-btn" data-oh="back" title="返回工具列表">
                            <cgo-icon name="back" size="14"></cgo-icon>
                        </button>
                        <button type="button" class="cgo-mt-quick cgo-oh-icon-btn" data-oh="play" title="播放 / 暂停">
                            <cgo-icon name="play" size="14"></cgo-icon>
                        </button>
                        <button type="button" class="cgo-mt-quick cgo-oh-icon-btn" data-oh="replay" title="重播">
                            <cgo-icon name="refresh" size="14"></cgo-icon>
                        </button>
                        <button type="button" class="cgo-mt-quick cgo-oh-set-btn" data-oh="setSpeed" title="运镜速度">
                            <span>${SPEED.def} px/s</span>
                        </button>
                        <button type="button" class="cgo-mt-quick cgo-oh-set-btn" data-oh="setZoom" title="特写倍数">
                            <span>${ZOOM.def.toFixed(1)}×</span>
                        </button>
                        <button type="button" class="cgo-mt-quick cgo-oh-icon-btn" data-oh="toggleInfo" title="查看事件清单" aria-pressed="false">
                            <cgo-icon name="view-list" size="14"></cgo-icon>
                        </button>
                        <button type="button" class="cgo-mt-quick cgo-oh-icon-btn" data-oh="exportToggle" title="导出视频" aria-pressed="false">
                            <cgo-icon name="download" size="14"></cgo-icon>
                        </button>
                    </div>
                    <div class="cgo-oh-set" data-oh="speedSet" hidden>
                        <div class="cgo-oh-field">
                            <label for="cgo-oh-speed">运镜速度</label>
                            <input type="range" id="cgo-oh-speed" data-oh="speed"
                                min="${SPEED.min}" max="${SPEED.max}" step="${SPEED.step}" value="${SPEED.def}">
                            <output data-oh="speedOut">${SPEED.def} px/s</output>
                        </div>
                    </div>
                    <div class="cgo-oh-set" data-oh="zoomSet" hidden>
                        <div class="cgo-oh-field">
                            <label for="cgo-oh-zoom">特写</label>
                            <input type="range" id="cgo-oh-zoom" data-oh="zoom"
                                min="${ZOOM.min}" max="${ZOOM.max}" step="${ZOOM.step}" value="${ZOOM.def}">
                            <output data-oh="zoomOut">${ZOOM.def.toFixed(1)}×</output>
                        </div>
                    </div>
                    <div class="cgo-oh-set cgo-oh-export" data-oh="exportSet" hidden>
                        <div class="cgo-oh-field">
                            <label for="cgo-oh-exp-from">起始</label>
                            <select id="cgo-oh-exp-from" data-oh="expFrom"></select>
                        </div>
                        <div class="cgo-oh-field">
                            <label for="cgo-oh-exp-to">结束</label>
                            <select id="cgo-oh-exp-to" data-oh="expTo"></select>
                        </div>
                        <div class="cgo-oh-exp-actions">
                            <button type="button" class="cgo-mt-launch" data-oh="expStart">导出 MP4</button>
                            <button type="button" class="cgo-mt-quick" data-oh="expCancel" hidden>取消</button>
                        </div>
                        <div class="cgo-oh-exp-track"><div class="cgo-oh-exp-bar" data-oh="expBar"></div></div>
                        <p class="cgo-oh-exp-status" data-oh="expStatus"></p>
                    </div>
                </div>
                <ul class="cgo-oh-list"></ul>
                <p class="cgo-oh-note">演示只覆盖有开通记录的区段，底图线网在放映期间由本演示接管，关闭后恢复。</p>
            </div>
        `;
    }

    /**
     * 正文两态：**信息区**（当前事件 + 规模 + 进度）与**事件清单**二选一，
     * 由操作行那枚 `view-list` 按钮切换。默认给信息区 —— 放映时最常看的是它；
     * 想要跳年份再切到清单。两态互斥也就顺手把面板高度压下来了（矮屏上尤其要紧）。
     */
    function syncToggle() {
        const root = state.els && state.els.root;
        const btn = state.els && state.els.toggleInfo;
        if (!root || !btn) return;
        const listOn = root.classList.contains("is-list");
        btn.classList.toggle("is-on", listOn);
        btn.setAttribute("aria-pressed", String(listOn));
        btn.title = listOn ? "返回信息区" : "查看事件清单";
    }

    function renderList() {
        state.els.list.innerHTML = state.steps.map((s) => {
            // 计数用 CGoUI 图标而不是 +/↑ 字符：CGoUI 里没有上箭头，
            // 「转为换乘站」用它的 transfer 图标（语义也比箭头准）
            const add = s.enterCount
                ? `<span class="cgo-oh-item-add"><cgo-icon name="add" size="12"></cgo-icon>${s.enterCount}</span>` : "";
            const up = s.upgradeCount
                ? `<span class="cgo-oh-item-add"><cgo-icon name="transfer" size="12"></cgo-icon>${s.upgradeCount}</span>` : "";
            return `<li class="cgo-oh-item" data-go="${s.no}">
                <span class="cgo-oh-item-date">${s.date}</span>
                <span class="cgo-oh-item-dot" style="background:${s.color}"></span>
                <span class="cgo-oh-item-text">${stepLabel(s)}</span>${add}${up}
            </li>`;
        }).join("");
    }

    /**
     * 第 i 个事件在时间轴上的位置（%）—— 进度条按**时间**推进，不是按事件条数：
     * 事件在时间轴上疏密不均，按条数会骗人。
     */
    function trackPercentAt(i) {
        if (!state.steps.length) return 0;
        const first = Date.parse(state.steps[0].date);
        const last = Date.parse(state.steps[state.steps.length - 1].date);
        const step = state.steps[i];
        const cur = step ? Date.parse(step.date) : first;
        if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) return 0;
        return Math.max(0, Math.min(100, (cur - first) / (last - first) * 100));
    }

    /** 徽标与说明。日期不在这里设 —— 它由 `applyPanel` 按 t 算 */
    function syncNow() {
        const step = state.steps[state.index];
        if (!step) return;
        const badge = state.els.badge;
        badge.hidden = false;
        badge.textContent = KIND_LABEL[step.kind] || step.kind;
        badge.style.background = step.color;
        let desc = stepLabel(step);
        if (step.kind === "line-open") {
            const parts = [];
            if (step.enterCount) parts.push(`新增 ${step.enterCount} 站`);
            if (step.upgradeCount) parts.push(`${step.upgradeCount} 站转为换乘站`);
            if (parts.length) desc += `（${parts.join("，")}）`;
        }
        state.els.desc.textContent = desc;
    }

    function syncPlayBtn() {
        state.els.play.innerHTML = state.playing
            ? '<cgo-icon name="pause" size="14"></cgo-icon>'
            : '<cgo-icon name="play" size="14"></cgo-icon>';
    }

    /* ======================================================================
     * 时钟层：播放 / 暂停 / 重播 / 跳转
     * ==================================================================== */

    /**
     * 从第 from 步播到第 to 步。播放与导出共用这一条路径：导出只是换一种「推进 t 并取帧」的驱动。
     */
    function startPlayback(from, to) {
        state.timeline = buildTimeline(from, to);
        state.popDone = new Set();
        state.activePops = [];
        state.ripples = [];
        state.lastPanelI = null;
        state.lastResyncI = null;
        state.tStart = performance.now();
        state.tCur = 0;
        state.playing = true;
        syncPlayBtn();
        state.raf = requestAnimationFrame(tick);
    }

    /** 播放循环：把「现在」喂给 applyFrame —— 时间轴是唯一时钟，不再有别的定时器 */
    function tick() {
        const tl = state.timeline;
        if (!state.playing || !tl) return;
        const t = performance.now() - state.tStart;
        state.tCur = Math.min(t, tl.total);
        try {
            applyFrame(state.tCur);
        } catch (e) {
            // ⚠️ 一抛异常 rAF 就断了，而 state.playing 还停在 true —— 按钮卡在「暂停」、
            //    时间轴永远不再推进。所以这里必须兜住并把播放收干净。
            console.error("[线网发展史] 帧应用失败，已停止播放：", e);
            state.raf = 0;
            state.playing = false;
            syncPlayBtn();
            return;
        }
        if (t < tl.total) {
            state.raf = requestAnimationFrame(tick);
        } else {
            state.raf = 0;
            state.playing = false;
            state.index = tl.to;
            syncPlayBtn();
        }
    }

    function play() {
        if (!state.steps.length) return;
        if (state.playing) { pause(); return; }
        let from = state.index + 1;
        if (from > state.steps.length - 1) { reset(); from = 0; }
        enterStage();
        startPlayback(from, state.steps.length - 1);
    }

    /**
     * 暂停：把画面**落定在当前这一步**（线画满、站弹完、面板落到本事件），再停。
     * 不做「冻在半截」是因为描边偏移停在中途会缺一段线，观感反而更差。
     */
    function pause() {
        if (!state.playing) return;
        state.playing = false;
        if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
        const tl = state.timeline;
        if (tl) {
            const r = recAt(state.tCur);
            state.index = r.i;
            state.tCur = r.growEnd;
            applyFrame(r.growEnd, true);
        }
        clearTimers();
        syncPlayBtn();
    }

    function reset() {
        clearTimers();
        state.playing = false;
        state.index = -1;
        state.timeline = null;
        state.tCur = 0;
        state.lastPanelI = null;
        state.lastResyncI = null;
        clearCanvas();
        clearMarks();
        if (state.els) {
            state.els.badge.hidden = true;
            state.els.date.textContent = "尚未开始";
            state.els.desc.textContent = "点「播放」从空白画布起笔，镜头跟着画笔把线网逐段画出来；也可用操作行的清单按钮跳到任一年份。";
            state.els.lines.textContent = "0";
            state.els.stations.textContent = "0";
            state.els.mileage.textContent = "0.0";
            setTrack(0);
            state.els.list.querySelectorAll(".cgo-oh-item").forEach((li) => li.classList.remove("is-active", "is-done"));
            syncPlayBtn();
        }
    }

    function replay() {
        reset();
        play();
    }

    /**
     * 跳到第 i 步（含之前的全部）：把 0..i 补成「已开通」，不重播生长动画。
     * 做法就是建一条 0..i 的时间线，再把 t 直接落在第 i 步**生长结束**那一刻并落定收尾。
     */
    function jumpTo(i) {
        clearTimers();
        state.playing = false;
        clearCanvas();
        clearMarks();
        enterStage();
        state.timeline = buildTimeline(0, i);
        state.popDone = new Set();
        state.activePops = [];
        state.ripples = [];
        state.lastPanelI = null;
        state.lastResyncI = null;
        state.index = i;
        const list = state.timeline.list;
        const r = list[list.length - 1];
        state.tCur = r.growEnd;
        applyFrame(r.growEnd, true);
        // 跳到更名这一步：名字直接落成新名（跳转不是「演」，不播换字动画）
        if (r.step.rename) applyNewName(r.step.rename.sid, r.step.rename.to, r.step.rename.toEn);
        // 最后落到「能看该段全貌」的取景（applyFrame 给的是生长结束时的取景）
        if (window.setMapView && r.camTail) window.setMapView({ x: r.camTail.x, y: r.camTail.y, scale: r.camTail.scale });
        syncPlayBtn();
    }

    /* ======================================================================
     * 导出视频：逐帧渲染（与播放共用同一条时间轴）
     * ====================================================================
     * 一帧 = 把 `applyFrame(t)` 之后的**图形层**（去掉站名整层）栅格化，再用 canvas
     * `fillText` 把站名叠上去。之所以把站名从 SVG 里拿出来：内联字体会让每帧的 SVG
     * 涨到 6MB、光序列化就 530ms（实测），而 canvas 文字直接吃页面里已经加载好的 webfont。
     * 相机**不作为 DOM transform** 参与导出 —— 它是渲染时的 canvas 变换，于是文字按最终
     * 分辨率栅格化，比「先渲染再缩放」清晰。
     */

    const EXPORT = {
        width: 1280,
        height: 720,
        fps: 30,
        bitrate: 6000000,
        codec: "avc1.640028",
        muxerSrc: "./city/shenyang/shared/tools/vendor/mp4-muxer.min.js"
    };

    /** 站名的位置与字体样式只量一次 —— 逐帧量 400 个标签的 getComputedStyle 要 60ms */
    let labelCache = null;

    function buildLabelCache() {
        const host = stageHost();
        const mc = document.getElementById("map-content");
        if (!host || !mc) return [];
        const view = window.getMapView ? window.getMapView() : { scale: 1, x: 0, y: 0 };
        const mr = mc.getBoundingClientRect();
        const probe = document.createElement("canvas").getContext("2d");
        const out = [];
        host.querySelectorAll("#labels-layer .label-group").forEach((g) => {
            const sid = g.dataset.sid || "";
            g.querySelectorAll(".stacn, .staen").forEach((sp) => {
                const cs = getComputedStyle(sp);
                if (cs.display === "none" || cs.visibility === "hidden") return;
                const r = sp.getBoundingClientRect();
                if (r.width < 0.5 || r.height < 0.5) return;
                const size = parseFloat(cs.fontSize);
                const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
                probe.font = font;
                const met = probe.measureText(sp.textContent || "中");
                // 站名可能带 scaleX（station.textScale），缩放锚点在 transform-origin 上
                const m = /matrix\(([-\d.]+)[, ]+[-\d.]+[, ]+[-\d.]+[, ]+[-\d.]+[, ]+([-\d.]+)/.exec(cs.transform || "");
                const sx = m ? parseFloat(m[1]) : 1;
                const orgPct = parseFloat(cs.transformOrigin) / 100;
                const w = r.width / view.scale;
                out.push({
                    el: sp, sid: sid,
                    // 画布坐标（与相机无关）：把屏幕矩形反解回未变换的画布
                    x: (r.left - mr.left) / view.scale,
                    y: (r.top - mr.top) / view.scale,
                    h: r.height / view.scale,
                    ascent: met.fontBoundingBoxAscent || size * 0.8,
                    descent: met.fontBoundingBoxDescent || size * 0.2,
                    font: font,
                    spacing: cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing,
                    color: cs.color,
                    strokeW: parseFloat(cs.webkitTextStrokeWidth) || 0,
                    strokeColor: cs.webkitTextStrokeColor,
                    sx: sx,
                    anchorX: (r.left - mr.left) / view.scale + (Number.isFinite(orgPct) ? orgPct : 0) * w
                });
            });
        });
        return out;
    }

    /**
     * 该站此刻的可见度（0~1）。**不读 DOM**：已弹过的站按 `state.shown` 直接判定，
     * 正在弹的用时间轴上的进度算 —— 逐帧 getComputedStyle 正是要避免的开销。
     */
    function alphaAt(sid, t) {
        if (state.alwaysOn.has(sid)) return 1;
        const ap = state.activePops.find((p) => p.sid === sid);
        if (ap) return Math.max(0, Math.min(1, EASE_POP(state.popDur > 0 ? (t - ap.t0) / state.popDur : 1)));
        return state.shown.has(sid) ? 1 : 0;
    }

    /** 把一帧画到 canvas：图形层（栅格化）+ 站名（canvas 文字），相机作为 canvas 变换 */
    async function paintFrame(canvas, t, ctx2d) {
        const mc = document.getElementById("map-content");
        if (!mc) return;
        const W = Math.round(mc.offsetWidth), H = Math.round(mc.offsetHeight);
        const cam = camAt(t) || { x: 0, y: 0, scale: 1 };
        const cw = canvas.width, ch = canvas.height;
        const hostW = mc.parentElement ? mc.parentElement.clientWidth : cw;
        const hostH = mc.parentElement ? mc.parentElement.clientHeight : ch;
        // 「盖住取景」：整体铺满 720p（等比放大到覆盖，超出部分裁掉），内容始终在中央
        const k = Math.max(cw / hostW, ch / hostH);
        const ox = (cw - hostW * k) / 2, oy = (ch - hostH * k) / 2;
        const s = cam.scale * k;

        // ── 图形层：克隆 → 藏站名 → 变量搬到根上 → 外部图片换 data URL → 栅格化 ──
        const clone = mc.cloneNode(true);
        clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        clone.style.transform = "none";
        // ⚠️ foreignObject 里没有 :root，`:root { --x: … }` 一条都匹配不上 → 变量要逐个搬
        [document.documentElement, document.body].forEach((src) => {
            const cs = getComputedStyle(src);
            for (let i = 0; i < cs.length; i++) {
                const name = cs[i];
                if (name.slice(0, 2) === "--") clone.style.setProperty(name, cs.getPropertyValue(name));
            }
        });
        // ⚠️ data URL 的 SVG 没有 base URL，相对图片引用解析不了（静默消失）；
        //    换 blob URL 又会被判跨源加载、污染画布 → 只能先内联成 data URL
        for (const el of clone.querySelectorAll("img, image")) {
            const src = el.getAttribute("src") || el.getAttribute("xlink:href") || el.getAttribute("href");
            const data = src && state.exportImgCache.get(src);
            if (!data) continue;
            if (el.hasAttribute("src")) el.setAttribute("src", data);
            if (el.hasAttribute("xlink:href")) el.setAttribute("xlink:href", data);
            if (el.hasAttribute("href")) el.setAttribute("href", data);
        }
        const xml = new XMLSerializer().serializeToString(clone);
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">'
            + '<foreignObject width="' + W + '" height="' + H + '">'
            + '<style><![CDATA[' + state.exportCss + '#labels-layer{display:none !important}]]></style>'
            + xml + '</foreignObject></svg>';
        const img = await imgFromData(svg);

        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        ctx2d.fillStyle = "#fff";
        ctx2d.fillRect(0, 0, cw, ch);
        ctx2d.setTransform(s, 0, 0, s, ox + cam.x * k, oy + cam.y * k);
        ctx2d.drawImage(img, 0, 0, W, H);

        // ── 站名：与图形层同一套变换，于是文字按最终分辨率栅格化 ──
        (labelCache || []).forEach((L) => {
            const a = alphaAt(L.sid, t);
            if (a <= 0.01) return;
            const txt = L.el.textContent || "";
            if (!txt) return;
            ctx2d.globalAlpha = a;
            ctx2d.font = L.font;
            if ("letterSpacing" in ctx2d) ctx2d.letterSpacing = L.spacing;
            ctx2d.fillStyle = L.color;
            // 基线按 Chrome 的行盒模型算：行盒高 = 上/下半行距 + 字体 ascent/descent
            const baseY = L.y + (L.h - (L.ascent + L.descent)) / 2 + L.ascent;
            ctx2d.textAlign = "left";
            ctx2d.textBaseline = "alphabetic";
            if (L.sx !== 1) {
                ctx2d.save();
                ctx2d.translate(L.anchorX, 0);
                ctx2d.scale(L.sx, 1);
                ctx2d.translate(-L.anchorX, 0);
            }
            if (L.strokeW > 0) {
                ctx2d.lineWidth = L.strokeW;
                ctx2d.strokeStyle = L.strokeColor;
                ctx2d.strokeText(txt, L.x, baseY);
            }
            ctx2d.fillText(txt, L.x, baseY);
            if (L.sx !== 1) ctx2d.restore();
            ctx2d.globalAlpha = 1;
        });
        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
    }

    /** data URL 的 SVG → <img>（decoded ≠ painted，调用方已在外层留出等待） */
    function imgFromData(svgStr) {
        const bytes = new TextEncoder().encode(svgStr);
        let bin = ""; const CH = 0x8000;
        for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = () => rej(new Error("SVG 栅格化失败"));
            img.src = "data:image/svg+xml;base64," + btoa(bin);
        });
    }

    /** 导出前的准备：同源 CSS 文本、外部图片 data URL 缓存、站名度量缓存 */
    async function prepareExport() {
        let css = "";
        const sheets = document.styleSheets;
        for (let i = 0; i < sheets.length; i++) {
            try {
                const rules = sheets[i].cssRules;
                for (let j = 0; j < rules.length; j++) css += rules[j].cssText + "\n";
            } catch (e) { /* 跨域表（远在字体站的，导出用不到）读不到，跳过 */ }
        }
        state.exportCss = css;
        state.exportImgCache = new Map();
        const mc = document.getElementById("map-content");
        for (const el of mc.querySelectorAll("img, image")) {
            const src = el.getAttribute("src") || el.getAttribute("xlink:href") || el.getAttribute("href");
            if (!src || /^(data:|blob:)/.test(src) || state.exportImgCache.has(src)) continue;
            try {
                const r = await fetch(new URL(src, document.baseURI).href);
                const b = await r.arrayBuffer();
                state.exportImgCache.set(src, "data:" + (r.headers.get("content-type") || "image/png") + ";base64," + b64Bytes(b));
            } catch (e) { /* 取不到就保持原样（该图在导出里会缺失，不致命） */ }
        }
        labelCache = buildLabelCache();
    }

    function b64Bytes(buf) {
        const b = new Uint8Array(buf); let s = ""; const CH = 0x8000;
        for (let i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
        return btoa(s);
    }

    /* ---- 编码：WebCodecs `VideoEncoder` + mp4-muxer ----
     * 逐帧循环与播放共用 `applyFrame(t)`：每帧先把它之后的画面落到 DOM，再用
     * `paintFrame` 取图。⚠️ 这里用**非落定**模式（settle 省略）—— 站点弹出、涟漪要逐帧
     * 保留，`paintFrame` 的 `alphaAt` 正是按「正在弹的那几个」算可见度；若传 settle=true，
     * 弹出会在同一帧被立刻收尾，导出里就看不到站「弹」出来了。 */

    const encoderConfig = () => ({
        codec: EXPORT.codec,
        width: EXPORT.width,
        height: EXPORT.height,
        bitrate: EXPORT.bitrate,
        framerate: EXPORT.fps,
        avc: { format: "avc" }   // mp4-muxer 要的是 AVCC 格式的块，缺了它封不出可播的 MP4
    });

    /** 按需注入 mp4-muxer（31KB）：不导出就不加载，同一份只注入一次 */
    function loadMuxer() {
        if (window.Mp4Muxer) return Promise.resolve(window.Mp4Muxer);
        if (state.muxerLoading) return state.muxerLoading;
        state.muxerLoading = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = EXPORT.muxerSrc;
            s.onload = () => (window.Mp4Muxer ? resolve(window.Mp4Muxer) : reject(new Error("mp4-muxer 未挂到全局")));
            s.onerror = () => reject(new Error("mp4-muxer 加载失败"));
            document.head.appendChild(s);
        });
        return state.muxerLoading;
    }

    /** 能力自检：浏览器是否真支持这套编码配置（判 supported 而不是只看构造函数存在） */
    async function canEncode() {
        if (typeof window.VideoEncoder !== "function" || typeof window.VideoFrame !== "function") return false;
        try {
            const r = await window.VideoEncoder.isConfigSupported(encoderConfig());
            return !!(r && r.supported);
        } catch (e) { return false; }
    }

    function downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    const exportFileName = (from, to) => {
        const a = state.steps[from] ? state.steps[from].date : "start";
        const b = state.steps[to] ? state.steps[to].date : "end";
        return `线网发展史_${a}_${b}.mp4`;
    };

    /**
     * 把第 from..to 步导出为 MP4。与播放共用一条时间轴：
     * ① from>0 时先把之前的事件落成「已开通」（jumpTo），画面从 from 起播；
     * ② 逐帧 `applyFrame(t)` → `paintFrame` → `VideoFrame` → `encode`，按背压等队列；
     * ③ flush → finalize → Blob 下载。导出期间停下实时播放并锁住相关控件。
     */
    async function runExport(from, to) {
        if (state.exporting) return;
        state.exporting = true;
        state.exportCancelled = false;
        // 导出与 rAF 会抢同一条时间线：先把实时播放停干净
        clearTimers();
        state.playing = false;
        syncPlayBtn();
        syncExportUI();
        setExportStatus("正在检查编码支持…");
        let encoder = null;
        let muxer = null;
        try {
            if (!(await canEncode())) {
                throw new Error("当前浏览器不支持 WebCodecs H.264 编码，请用较新版 Chrome / Edge");
            }
            setExportStatus("准备资源…");
            // 起点画面：from>0 时先补出「之前已开通」的全部线网与车站
            if (from > 0) jumpTo(from - 1);
            else { clearCanvas(); clearMarks(); enterStage(); }
            state.timeline = buildTimeline(from, to);
            state.popDone = new Set();
            state.activePops = [];
            state.ripples = [];
            state.lastPanelI = null;
            state.lastResyncI = null;
            await prepareExport();

            const Mp4Muxer = await loadMuxer();
            muxer = new Mp4Muxer.Muxer({
                target: new Mp4Muxer.ArrayBufferTarget(),
                video: { codec: "avc", width: EXPORT.width, height: EXPORT.height },
                fastStart: "in-memory"
            });
            let encError = null;
            encoder = new window.VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: (e) => { encError = e; }
            });
            encoder.configure(encoderConfig());

            const canvas = document.createElement("canvas");
            canvas.width = EXPORT.width;
            canvas.height = EXPORT.height;
            const ctx2d = canvas.getContext("2d");
            const total = state.timeline.total;
            const dt = 1000 / EXPORT.fps;
            const frames = Math.max(1, Math.ceil(total / dt));
            for (let i = 0; i <= frames; i++) {
                if (state.exportCancelled) break;
                if (encError) throw encError;
                const t = Math.min(total, i * dt);
                applyFrame(t);
                await paintFrame(canvas, t, ctx2d);
                const frame = new window.VideoFrame(canvas, {
                    timestamp: Math.round(i * 1e6 / EXPORT.fps),
                    duration: Math.round(1e6 / EXPORT.fps)
                });
                encoder.encode(frame, { keyFrame: i % (EXPORT.fps * 2) === 0 });
                frame.close();
                // 背压：待编码帧堆太多会把内存打爆，超阈值就等一会儿
                while (encoder.encodeQueueSize > 8 && !state.exportCancelled && !encError) {
                    await new Promise((r) => setTimeout(r, 4));
                }
                setExportProgress(i + 1, frames + 1);
                if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));  // 定期让出主线程
            }
            if (encError) throw encError;

            if (state.exportCancelled) {
                setExportStatus("已取消");
            } else {
                setExportStatus("正在封装 MP4…");
                await encoder.flush();
                encoder.close();
                encoder = null;
                muxer.finalize();
                const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
                downloadBlob(blob, exportFileName(from, to));
                setExportStatus(`已导出 ${frames + 1} 帧 · ${(total / 1000).toFixed(1)} 秒 · ${(blob.size / 1048576).toFixed(1)} MB`);
            }
            document.dispatchEvent(new CustomEvent("cgo:opening-export-done", {
                detail: { from: from, to: to, cancelled: state.exportCancelled }
            }));
        } catch (e) {
            console.error("[线网发展史] 导出失败：", e);
            setExportStatus("导出失败：" + (e && e.message ? e.message : e), true);
        } finally {
            if (encoder) { try { encoder.close(); } catch (e) { /* 已关闭或未配置 */ } }
            // 取消时画面可能停在半截弹出上：按时间轴末尾落定一次。
            // ⚠️ 面板已被关掉（unmount 已 exitStage 把取景还原）时不能再落位，否则镜头会被重新拽走
            if (state.timeline && state.els) {
                try { applyFrame(state.timeline.total, true); } catch (e) { /* 忽略 */ }
                state.index = to;
                state.tCur = state.timeline.total;
            }
            state.exporting = false;
            syncExportUI();
        }
    }

    function setExportStatus(text, isError) {
        const el = state.els && state.els.expStatus;
        if (!el) return;
        el.textContent = text || "";
        el.classList.toggle("is-error", !!isError);
    }

    function setExportProgress(done, total) {
        const bar = state.els && state.els.expBar;
        if (bar) bar.style.width = (total ? Math.round(done / total * 100) : 0) + "%";
        setExportStatus("导出中 " + (total ? Math.round(done / total * 100) : 0) + "%");
    }

    /** 起止事件下拉：选项即事件清单，默认整段（首 → 末） */
    function renderExportSelects() {
        const e = state.els;
        if (!e || !e.expFrom || !e.expTo) return;
        const opts = state.steps
            .map((s) => `<option value="${s.no - 1}">${s.no}. ${s.date} ${stepLabel(s)}</option>`)
            .join("");
        e.expFrom.innerHTML = opts;
        e.expTo.innerHTML = opts;
        e.expFrom.value = "0";
        e.expTo.value = String(state.steps.length - 1);
        setExportStatus("");
    }

    /** 导出期间锁住会干扰时间线的控件，只留「取消」；同时同步导出按钮的按下态 */
    function syncExportUI() {
        const e = state.els;
        if (!e) return;
        const on = state.exporting;
        const open = e.exportSet && !e.exportSet.hidden;
        [e.back, e.play, e.replay, e.setSpeed, e.setZoom, e.toggleInfo].forEach((b) => { if (b) b.disabled = on; });
        if (e.exportToggle) {
            e.exportToggle.classList.toggle("is-on", open);
            e.exportToggle.setAttribute("aria-pressed", String(open));
        }
        if (e.expFrom) e.expFrom.disabled = on;
        if (e.expTo) e.expTo.disabled = on;
        if (e.expStart) e.expStart.hidden = on;
        if (e.expCancel) e.expCancel.hidden = !on;
        if (e.expBar) e.expBar.style.width = on ? "0%" : e.expBar.style.width;
    }

    /* ======================================================================
     * 挂载 / 卸载（由地图小工具的免选站工具机制驱动）
     * ==================================================================== */

    function mount(body) {
        state.body = body;
        // 一打开就收干净：从车站详情 / 路线结果点进来时，那些浮窗与线路、车站的高亮
        // 会残留在画布上（这个面板本就要接管画布，留着很突兀）
        resetMapSelection();
        body.classList.add(BODY_CLASS);
        body.innerHTML = renderBody();
        const q = (sel) => body.querySelector(sel);
        state.els = {
            root: q(".cgo-oh"),
            date: q(".cgo-oh-date"),
            badge: q(".cgo-oh-badge"),
            desc: q(".cgo-oh-desc"),
            bar: q(".cgo-oh-bar"),
            speedSet: q('[data-oh="speedSet"]'),
            zoomSet: q('[data-oh="zoomSet"]'),
            back: q('[data-oh="back"]'),
            setSpeed: q('[data-oh="setSpeed"]'),
            setZoom: q('[data-oh="setZoom"]'),
            toggleInfo: q('[data-oh="toggleInfo"]'),
            speed: q('[data-oh="speed"]'),
            speedOut: q('[data-oh="speedOut"]'),
            zoom: q('[data-oh="zoom"]'),
            zoomOut: q('[data-oh="zoomOut"]'),
            lines: q('[data-oh="lines"]'),
            stations: q('[data-oh="stations"]'),
            mileage: q('[data-oh="mileage"]'),
            play: q('[data-oh="play"]'),
            replay: q('[data-oh="replay"]'),
            exportToggle: q('[data-oh="exportToggle"]'),
            exportSet: q('[data-oh="exportSet"]'),
            expFrom: q('[data-oh="expFrom"]'),
            expTo: q('[data-oh="expTo"]'),
            expStart: q('[data-oh="expStart"]'),
            expCancel: q('[data-oh="expCancel"]'),
            expBar: q('[data-oh="expBar"]'),
            expStatus: q('[data-oh="expStatus"]'),
            list: q(".cgo-oh-list")
        };
        state.steps = build();
        // 更名表：build 里解析好挂在 steps 上不便查，这里按 rename 步骤重建一份
        state.renameMap = new Map();
        state.steps.forEach((s) => {
            if (s.rename && s.rename.sid) {
                state.renameMap.set(s.rename.sid, {
                    from: s.rename.from, to: s.rename.to,
                    fromEn: s.rename.fromEn, date: s.date
                });
            }
        });
        // 全程固定显示的车站：**没有任何开通沿革记录的**国铁散点。
        // 它们早于本城线网（如沈阳站 1899、沈阳北站 1990）或与线网无关，属于既有设施；
        // 而有开通记录的那些（如沈阳南站 2015-09-01 随沈丹高铁启用）要按时间入场。
        const covered = new Set();
        state.steps.forEach((s) => s.stations.forEach((x) => covered.add(x.sid)));
        state.alwaysOn = new Set();
        Object.keys(stationMap()).forEach((sid) => {
            const s = stationMap()[sid];
            if (s && s.type === "rdot" && !covered.has(sid)) state.alwaysOn.add(sid);
        });
        state.index = -1;
        state.playing = false;
        state.speed = SPEED.def;
        state.zoom = ZOOM.def;
        state.shown.clear();
        state.dotColors.clear();
        state.renamed.clear();
        state.els.mileage.textContent = "0.0";
        state.els.root.classList.remove("is-list");   // 每次挂载都回到「信息区」那一态
        syncToggle();
        state.els.speedSet.hidden = true;
        state.els.zoomSet.hidden = true;
        state.els.exportSet.hidden = true;
        state.exporting = false;
        state.exportCancelled = false;
        renderList();
        renderExportSelects();

        state.els.play.addEventListener("click", play);
        state.els.replay.addEventListener("click", replay);
        state.els.back.addEventListener("click", () => window.CGoMapTools?.open?.());
        // 三枚展开按钮各管各的区块：点开的那个显示、另两个收起；再点一次收起来
        state.els.setSpeed.addEventListener("click", () => {
            const show = state.els.speedSet.hidden;
            state.els.speedSet.hidden = !show;
            state.els.zoomSet.hidden = true;
            state.els.exportSet.hidden = true;
        });
        state.els.setZoom.addEventListener("click", () => {
            const show = state.els.zoomSet.hidden;
            state.els.zoomSet.hidden = !show;
            state.els.speedSet.hidden = true;
            state.els.exportSet.hidden = true;
        });
        state.els.exportToggle.addEventListener("click", () => {
            if (state.exporting) return;
            state.els.exportSet.hidden = !state.els.exportSet.hidden;
            state.els.speedSet.hidden = true;
            state.els.zoomSet.hidden = true;
            syncExportUI();
        });
        // 起止两个下拉互相钳制，避免选出「起 > 止」的空区间
        state.els.expFrom.addEventListener("change", () => {
            if (Number(state.els.expTo.value) < Number(state.els.expFrom.value)) {
                state.els.expTo.value = state.els.expFrom.value;
            }
        });
        state.els.expTo.addEventListener("change", () => {
            if (Number(state.els.expFrom.value) > Number(state.els.expTo.value)) {
                state.els.expFrom.value = state.els.expTo.value;
            }
        });
        state.els.expStart.addEventListener("click", () => {
            runExport(Number(state.els.expFrom.value), Number(state.els.expTo.value));
        });
        state.els.expCancel.addEventListener("click", () => { state.exportCancelled = true; });
        // 信息区 ⟷ 事件清单：二选一，不是「收起 / 展开」
        state.els.toggleInfo.addEventListener("click", () => {
            state.els.root.classList.toggle("is-list");
            syncToggle();
        });
        state.els.speed.addEventListener("input", () => {
            state.speed = Number(state.els.speed.value) || SPEED.def;
            state.els.speedOut.textContent = `${state.speed} px/s`;
            state.els.setSpeed.querySelector("span").textContent = `${state.speed} px/s`;
            applyAnimDurations();     // 进场动画跟着运镜速度走
            reseek();                 // 各段时长是建表时算死的，改速度得重建时间线
        });
        state.els.zoom.addEventListener("input", () => {
            state.zoom = Number(state.els.zoom.value) || ZOOM.def;
            state.els.zoomOut.textContent = `${state.zoom.toFixed(1)}×`;
            state.els.setZoom.querySelector("span").textContent = `${state.zoom.toFixed(1)}×`;
            applyAnimDurations();     // 倍数也决定画面上的推进速度，进场动画跟着一起调
            reseek();                 // 取景倍数同样是建表时算死的
        });
        state.els.list.addEventListener("click", (e) => {
            const li = e.target.closest(".cgo-oh-item");
            if (!li) return;
            if (state.exporting) return;   // 导出期间跳年份会抢走同一条时间线
            pause();
            jumpTo(Number(li.dataset.go) - 1);
        });
        watchPinned();
    }

    function unmount() {
        state.exportCancelled = true;   // 关面板即中止正在进行的导出
        clearTimers();
        unwatchPinned();
        state.playing = false;
        state.index = -1;
        clearCanvas();
        exitStage();
        if (state.body) state.body.classList.remove(BODY_CLASS);
        state.body = null;
        state.els = null;
    }

    function hasData() {
        return Array.isArray(window.CGO_OPENING_HISTORY) && window.CGO_OPENING_HISTORY.length > 0;
    }

    window.CGoOpeningHistory = {
        hasData: hasData,
        mount: mount,
        unmount: unmount,
        open: () => window.CGoMapTools?.openTool?.(TOOL_ID)
    };

    /** 数据要在注册前就位：本脚本须晚于 data_opening_history.js 加载 */
    function register() {
        if (!window.CGoMapTools?.registerTool) return;
        window.CGoMapTools.registerTool({
            id: TOOL_ID,
            icon: "route",
            name: "线网发展史",
            desc: "从空白画布起笔，镜头跟着画笔逐段画出线网，可跳看任一年份的形态",
            when: hasData,
            mount: mount,
            unmount: unmount
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", register);
    else register();
})();
