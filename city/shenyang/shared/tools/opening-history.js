/**
 * CGo OpenMap - 线网发展史动态演示（city/shenyang/shared/tools/opening-history.js）
 *
 * 按 CGO_OPENING_HISTORY（城市数据文件 data_opening_history.js）的时间线，把线网
 * 从**空白画布**上逐段「画」出来：镜头跟着画笔走，笔到之处线路延伸、车站与站名弹出。
 *
 * 三层分离（与 shared/README.md「线网发展史」一节一致）：
 *   数据层：window.CGO_OPENING_HISTORY（只写端点，区段由 data_lines.js 站序自动切）
 *   时钟层：本模块的 state.index / state.playing（全局唯一播放进度）
 *   表现层：growSegment / showStation / commitSegment（无状态，按当前进度推导画面）
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
    const GLIDE_CLASS = "cgo-oh-glide";     // 取景移动瞬间的过渡
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
        token: 0,           // 每次停/跳/关都 +1，让在飞的异步链路自行作废
        timers: [],
        raf: 0,
        numRafs: [],        // 数字滚动动画的 rAF 句柄
        anims: [],
        popDur: POP_BASE,
        lastLines: null,    // 上一次「画布上正在展示的线路数」，供数字滚动取起点
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

    function clearTimers() {
        state.timers.forEach((id) => clearTimeout(id));
        state.timers = [];
        if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
        state.numRafs.forEach((h) => cancelAnimationFrame(h.id));
        state.numRafs = [];
        state.anims.forEach((a) => { try { a.cancel(); } catch (e) { /* 已结束 */ } });
        state.anims = [];
    }

    function delay(ms) {
        return new Promise((resolve) => {
            const id = setTimeout(() => {
                state.timers = state.timers.filter((t) => t !== id);
                resolve();
            }, ms);
            state.timers.push(id);
        });
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
        const host = stageHost();
        host?.classList.remove(STAGE_CLASS);
        ["--cgo-oh-pop-dur", "--cgo-oh-label-dur", "--cgo-oh-ripple-dur", "--cgo-oh-glide-dur"]
            .forEach((key) => host?.style.removeProperty(key));
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
     */
    function applyAnimDurations() {
        const host = stageHost();
        if (!host) return;
        const k = (SPEED.def / state.speed) * (ZOOM.def / state.zoom);
        const pop = Math.max(80, Math.min(700, Math.round(POP_BASE * k)));
        state.popDur = pop;
        host.style.setProperty("--cgo-oh-pop-dur", pop + "ms");
        // 站名与涟漪压得比站点更紧 —— 镜头是跟着画笔走的，慢一拍就会「还没播完就出画」
        host.style.setProperty("--cgo-oh-label-dur", Math.round(pop * 1.05) + "ms");
        host.style.setProperty("--cgo-oh-ripple-dur", Math.round(pop * 1.6) + "ms");
        host.style.setProperty("--cgo-oh-glide-dur", glideMs() + "ms");
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

    /** 站点元素也可能被核心重建（如切换城市视图），按记录补一次状态 */
    function resyncShown() {
        state.shown.forEach((form, sid) => applyForm({ sid: sid, form: form }));
        state.shown.forEach((form, sid) => popStation(sid));
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
        host?.querySelectorAll("#stations-layer .station").forEach((el) => el.style.removeProperty("--cgo-oh-dot"));
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

    /** 把某点摆到可见区中心 */
    function centerAt(pt, scale) {
        const box = viewportBox();
        if (!box || !pt || !window.setMapView) return;
        const s = Math.max(SCALE_FLOOR, Math.min(ZOOM.max, scale));
        window.setMapView({
            scale: s,
            x: box.left + box.vw / 2 - pt.x * s,
            y: box.vh / 2 - pt.y * s
        });
    }

    /**
     * 把某个画布范围整块摆进可见区。
     * @param {number} pad      该范围占可见区的比例
     * @param {number} maxScale 放大上限（短区段不该一路顶到极限倍数）
     */
    function fitBox(minX, minY, maxX, maxY, pad, maxScale) {
        const box = viewportBox();
        if (!box || !window.setMapView) return;
        const bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
        const s = Math.min(box.vw / bw, box.vh / bh) * pad;
        centerAt({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
            Math.min(maxScale || ZOOM.max, s));
    }

    function withGlide(fn) {
        const content = stageHost();
        if (glideMs() && content) {
            content.classList.add(GLIDE_CLASS);
            setTimeout(() => content.classList.remove(GLIDE_CLASS), glideMs() + 80);
        }
        fn();
    }

    /** 推近到某个点起笔（用当前特写倍数） */
    function frameOn(pt) {
        if (!pt) return;
        withGlide(() => centerAt(pt, state.zoom));
    }

    /** 收笔：缩到能看该事件的全貌（长段自动缩小，短段不超过特写倍数） */
    function frameStep(step) {
        if (!step.pts || step.pts.length < 2) { frameOn(step.focus); return; }
        const b = bboxOf(step.pts);
        withGlide(() => fitBox(b.minX, b.minY, b.maxX, b.maxY, 0.72, state.zoom));
    }

    /** 收尾：缩到全图（按已出现在画布上的车站取范围，未开通的散点不参与） */
    function frameWhole() {
        const st = stationMap();
        const pts = [];
        state.shown.forEach((form, sid) => {
            const s = st[sid];
            if (s && Number.isFinite(s.x)) pts.push(s);
        });
        const list = pts.length ? pts : Object.keys(st).map((k) => st[k]).filter((s) => s && Number.isFinite(s.x));
        if (!list.length) { window.centerMap?.(); return; }
        const b = bboxOf(list);
        withGlide(() => fitBox(b.minX, b.minY, b.maxX, b.maxY, 0.94, ZOOM.max));
    }

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

    /** 更名事件：中英一起淡出 → 换字 → 淡入 */
    async function renameLabel(sid, name, enName) {
        const cn = cnSpanOf(sid);
        const en = enSpanOf(sid);
        const setAll = () => {
            if (cn) cn.textContent = name;
            if (en && enName) en.textContent = enName;
        };
        state.renamed.delete(sid);   // 换成新名之后不再需要还原
        if (REDUCE || (!cn && !en)) { setAll(); return; }
        [cn, en].forEach((el) => el && el.classList.add("cgo-oh-name-out"));
        await delay(180);
        setAll();
        [cn, en].forEach((el) => {
            if (!el) return;
            el.classList.remove("cgo-oh-name-out");
            el.classList.add("cgo-oh-name-in");
        });
        await delay(320);
        [cn, en].forEach((el) => el && el.classList.remove("cgo-oh-name-in"));
    }

    function restoreNames() {
        state.renamed.forEach((rec, sid) => {
            const cn = cnSpanOf(sid);
            if (cn && rec.cn != null) cn.textContent = rec.cn;
            const en = enSpanOf(sid);
            if (en && rec.en != null) en.textContent = rec.en;
        });
        state.renamed.clear();
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
     * 表现层
     * ==================================================================== */

    /** 一路跟着画笔走：生长期间把画笔当前位置持续摆到可见区中心 */
    function followBrush(step, dur, token) {
        if (REDUCE) return;
        const t0 = performance.now();
        const tick = () => {
            if (token !== state.token) return;
            const p = Math.min(1, (performance.now() - t0) / dur);
            centerAt(pointAt(step.pts, step.lengthPx * p), state.zoom);
            if (p < 1) state.raf = requestAnimationFrame(tick);
        };
        state.raf = requestAnimationFrame(tick);
    }

    /** 站点涟漪：笔到人到时那一圈扩散 */
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
        const life = state.popDur * 1.6 + 120;
        const id = setTimeout(() => dot.remove(), life);
        state.timers.push(id);
    }

    /** 车站到点了：切形态、弹出、涟漪 */
    function showStation(x, step) {
        state.shown.set(x.sid, x.form);
        if (x.dotColor) state.dotColors.set(x.sid, x.dotColor);
        applyForm(x, step.color);
        applyOldName(x.sid, step.date);
        popStation(x.sid);
        // 未开通形态的涟漪用「未开通色」，别拿线路色误导人
        ripple(x, x.form === "no" ? (themeVar("--not-open-color") || step.color) : step.color);
        syncVirtualConnectors();   // 站到齐了，站外连通那条虚线可以画了
    }

    /** 沿真实走向把这一段「画」出来（描边偏移，写法同香港的開場動畫） */
    function growSegment(step, token) {
        const group = liveGroup();
        if (!group || !step.pts || step.pts.length < 2) {
            step.stations.forEach((x) => showStation(x, step));
            return delay(0);
        }
        const grow = document.createElementNS(NS, "path");
        grow.setAttribute("class", "cgo-oh-grow");
        grow.setAttribute("d", toD(step.pts));
        grow.setAttribute("stroke", step.color);
        grow.setAttribute("stroke-width", "5.4");   // 与核心 .line-visual-inner 同宽
        grow.setAttribute("vector-effect", "non-scaling-stroke");
        group.replaceChildren(grow);   // 上一段的生长层收掉（它已归档进 done 层）

        let len = step.lengthPx;
        try { len = grow.getTotalLength(); } catch (e) { /* 用折线长度 */ }
        const dur = growDuration(step);

        // 车站按沿线位置同步弹出（笔到人到）
        step.stations.forEach((x) => {
            const at = Math.max(0, Math.min(dur - 30, dur * x.t));
            const id = setTimeout(() => {
                if (token !== state.token) return;
                showStation(x, step);
            }, at);
            state.timers.push(id);
        });

        if (REDUCE) {
            grow.style.strokeDasharray = "";
            step.stations.forEach((x) => showStation(x, step));
            return delay(1);
        }

        grow.style.strokeDasharray = `${len} ${len}`;
        grow.style.strokeDashoffset = String(len);
        followBrush(step, dur, token);
        if (typeof grow.animate === "function") {
            const anim = grow.animate(
                [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
                { duration: dur, easing: "linear", fill: "forwards" }
            );
            state.anims.push(anim);
        } else {
            requestAnimationFrame(() => {
                grow.style.transition = `stroke-dashoffset ${dur}ms linear`;
                grow.style.strokeDashoffset = "0";
            });
        }
        return delay(dur);
    }

    /** 播完的段落进「已开通」层，留在线网上才能看出线网在长大 */
    function commitSegment(step) {
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
        step.stations.forEach((x) => showStation(x, step));
    }

    /* ======================================================================
     * 数字与日期滚动
     * ==================================================================== */

    const pad2 = (n) => String(n).padStart(2, "0");

    /**
     * 把一个数字从 from 滚到 to。句柄存成对象，取消时按对象里的最新 id 处理
     * （rAF 每帧返回新 id，直接存数字会取消错）。
     */
    function rollNumber(el, from, to, ms, digits) {
        if (!el) return;
        // 兜底：任何一端取不到值（新增/缺失字段）都按 0 处理，绝不让 NaN 上屏
        const end = Number.isFinite(to) ? to : 0;
        const start = Number.isFinite(from) ? from : 0;
        // 未给时长（跳转 / 复位）就是「直接落值」——注意不能写 ms <= 0，
        // undefined 与数字比较恒为 false，会带着 undefined 去做除法算出 NaN
        const dur = Number.isFinite(ms) && ms > 0 ? ms : 0;
        const fmt = (v) => (digits > 0 ? v.toFixed(digits) : String(Math.round(v)));
        if (REDUCE || !dur || start === end) { el.textContent = fmt(end); return; }
        const handle = { id: 0 };
        state.numRafs.push(handle);
        const t0 = performance.now();
        const tick = () => {
            const p = Math.min(1, (performance.now() - t0) / dur);
            el.textContent = fmt(start + (end - start) * p);
            if (p < 1) handle.id = requestAnimationFrame(tick);
        };
        handle.id = requestAnimationFrame(tick);
    }

    /** 日期同样可以滚：事件间隙里从上一个事件的日期一天天走到本事件 */
    function rollDate(el, fromStr, toStr, ms) {
        if (!el) return;
        const a = Date.parse(fromStr), b = Date.parse(toStr);
        const dur = Number.isFinite(ms) && ms > 0 ? ms : 0;
        if (REDUCE || !dur || !Number.isFinite(a) || !Number.isFinite(b) || a === b) {
            el.textContent = toStr;
            return;
        }
        const handle = { id: 0 };
        state.numRafs.push(handle);
        const t0 = performance.now();
        const tick = () => {
            const p = Math.min(1, (performance.now() - t0) / dur);
            const d = new Date(a + (b - a) * p);
            el.textContent = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
            if (p < 1) handle.id = requestAnimationFrame(tick);
        };
        handle.id = requestAnimationFrame(tick);
    }

    /**
     * 进度条。`setTrack` 直接落值（跳转 / 复位 / 暂停收尾），`rollTrack` 逐帧补间。
     * 两者与 `rollDate` **同一时长、同一节拍**：事件间隙里「时间在走」时进度条一起长，
     * 而不是在事件开头就一步跳到终点（那样间隙里日期在动、进度却不动，很割裂）。
     */
    function setTrack(pct) {
        const bar = state.els && state.els.bar;
        if (!bar) return;
        bar.style.removeProperty("transition");
        bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    }

    function rollTrack(fromPct, toPct, ms) {
        const bar = state.els && state.els.bar;
        if (!bar) return;
        const dur = Number.isFinite(ms) && ms > 0 ? ms : 0;
        if (REDUCE || !dur || Math.abs(toPct - fromPct) < 0.05) { setTrack(toPct); return; }
        // 逐帧写 width 时得把 CSS 那条 .25s 过渡摘掉：否则每帧都重新起一段过渡，
        // 表现出来是「慢半拍地追」，与日期对不上拍
        bar.style.transition = "none";
        const handle = { id: 0 };
        state.numRafs.push(handle);
        const t0 = performance.now();
        const tick = () => {
            const p = Math.min(1, (performance.now() - t0) / dur);
            bar.style.width = (fromPct + (toPct - fromPct) * p) + "%";
            if (p < 1) handle.id = requestAnimationFrame(tick);
            else bar.style.removeProperty("transition");
        };
        handle.id = requestAnimationFrame(tick);
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

    /** 画布上正在展示的线路数（已画出的区段所属线路去重）—— 与画面严格对应 */
    function linesOnCanvas() {
        const ids = new Set();
        doneGroup()?.querySelectorAll("[data-line]").forEach((el) => ids.add(el.dataset.line));
        return ids.size;
    }

    /**
     * 统计行。传 animMs 就让数字从**上一次的值**滚到当前值（生长期间播）；
     * 不传则直接落值（跳转、复位用）。
     * 进度条不在这里 —— 它由 `setTrack` / `rollTrack` 单独驱动，好与日期滚动同拍。
     */
    function syncStats(animMs) {
        const step = state.steps[state.index];
        const prev = state.index > 0 ? state.steps[state.index - 1] : null;
        // 线路数按「画布所见」：生长中的那条线还没画出来就不算，画完（commitSegment）才 +1
        const shownLines = linesOnCanvas();
        rollNumber(state.els.lines, state.lastLines == null ? shownLines : state.lastLines, shownLines, animMs, 0);
        state.lastLines = shownLines;
        rollNumber(state.els.stations, prev ? prev.stationCount : 0, step ? step.stationCount : 0, animMs, 0);
        rollNumber(state.els.mileage, prev ? prev.mileage : 0, step ? step.mileage : 0, animMs, 1);
        state.els.list.querySelectorAll(".cgo-oh-item").forEach((li) => {
            const no = Number(li.dataset.go);
            li.classList.toggle("is-active", no === state.index + 1);
            li.classList.toggle("is-done", no <= state.index);
        });
    }

    /** 徽标与说明。日期不在这里设 —— 它由事件间隙的滚动动画负责 */
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

    async function runStep(i, token) {
        const step = state.steps[i];
        state.index = i;
        // 日期与进度条都先落在**上一个事件**上（首段即本事件），间隙里再一起走到本事件
        const prevPct = trackPercentAt(Math.max(0, i - 1));
        state.els.date.textContent = i > 0 ? state.steps[i - 1].date : step.date;
        setTrack(prevPct);
        syncNow();
        syncStats(growDuration(step));   // 统计数字随生长一起滚上去
        // 引线可能被核心重画过（它随视口与缩放重算），补一次状态
        resyncShown();
        // 先推近到该段起点起笔，等过渡落地，免得逐帧跟随立刻把它顶掉
        frameOn(step.pts ? pointAt(step.pts, 0) : step.focus);
        if (glideMs()) await delay(glideMs() + 90);
        if (token !== state.token) return;
        await growSegment(step, token);
        if (token !== state.token) return;
        commitSegment(step);
        syncStats(150);   // 这一段画完了，线路数按「画布所见」跟着 +1
        if (step.rename) await renameLabel(step.rename.sid, step.rename.to, step.rename.toEn);
        if (token !== state.token) return;
        // 收笔：缩到能看该事件的全貌，停一会儿再走下一段
        frameStep(step);
        if (glideMs()) await delay(glideMs() + 90);
        if (token !== state.token) return;
        // 事件间隙：日期从上一个事件一天天走到本事件，进度条与它同步一起长
        const prevDate = i > 0 ? state.steps[i - 1].date : step.date;
        rollTrack(prevPct, trackPercentAt(i), holdMs());
        rollDate(state.els.date, prevDate, step.date, holdMs());
    }

    function play() {
        if (!state.steps.length) return;
        if (state.playing) { pause(); return; }
        if (state.index >= state.steps.length - 1) replay();
        state.playing = true;
        enterStage();
        syncPlayBtn();
        const token = ++state.token;
        const from = state.index + 1;
        (async () => {
            for (let i = from; i < state.steps.length; i++) {
                if (token !== state.token) return;
                await runStep(i, token);
                if (token !== state.token) return;
                await delay(holdMs());
            }
            if (token !== state.token) return;
            // 全部播完：缩到全图，多停一会儿
            frameWhole();
            state.playing = false;
            syncPlayBtn();
            await delay(REDUCE ? 0 : T.tailHold);
        })();
    }

    /**
     * 暂停：把当前段**收尾**（画完 + 弹出余下车站 + 归档），再停。
     * 不做「冻在半截」是因为描边偏移动画一旦中断，线条会整段消失，观感反而更差。
     */
    function pause() {
        if (!state.playing) return;
        state.playing = false;
        state.token++;
        clearTimers();
        const step = state.steps[state.index];
        if (step) {
            commitSegment(step);
            // 数字滚动、日期滚动与进度条都可能被打断在半途，落到当前事件的确定值
            state.els.date.textContent = step.date;
            syncStats();
            setTrack(trackPercentAt(state.index));
        }
        syncPlayBtn();
    }

    function reset() {
        state.token++;
        clearTimers();
        state.playing = false;
        state.index = -1;
        clearCanvas();
        clearMarks();
        state.lastLines = null;
        if (state.els) {
            state.els.badge.hidden = true;
            state.els.date.textContent = "尚未开始";
            state.els.desc.textContent = "点「播放」从空白画布起笔，镜头跟着画笔把线网逐段画出来；也可用操作行的清单按钮跳到任一年份。";
            syncStats();
            setTrack(0);
            syncPlayBtn();
        }
    }

    function replay() {
        reset();
        play();
    }

    /** 跳到第 i 步（含之前的全部）：清画布后把 0..i-1 补成「已开通」，不重播生长动画 */
    function jumpTo(i) {
        state.token++;
        clearTimers();
        state.playing = false;
        clearCanvas();
        clearMarks();
        enterStage();
        for (let k = 0; k < i; k++) {
            const s = state.steps[k];
            commitSegment(s);
            // 单站开通（station-open，如皇姑屯补开、沈阳南站启用）没有走向，
            // commitSegment 会直接返回，这里得把车站补上 —— 否则往后跳一步，
            // 那些站就凭空消失了（它们只在该步「跳到自己」时才落图）
            if (!s.pts || s.pts.length < 2) s.stations.forEach((x) => showStation(x, s));
            if (s.rename) applyNewName(s.rename.sid, s.rename.to, s.rename.toEn);
        }
        state.index = i;
        const step = state.steps[i];
        syncNow();
        syncStats();
        setTrack(trackPercentAt(i));
        state.els.date.textContent = step.date;
        if (step.pts && step.pts.length > 1) commitSegment(step);
        else step.stations.forEach((x) => showStation(x, step));
        // 跳到更名这一步：名字直接落成新名（跳转不是「演」，不播换字动画）
        if (step.rename) applyNewName(step.rename.sid, step.rename.to, step.rename.toEn);
        frameStep(step);
        syncPlayBtn();
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
        state.lastLines = null;
        state.els.mileage.textContent = "0.0";
        state.els.root.classList.remove("is-list");   // 每次挂载都回到「信息区」那一态
        syncToggle();
        state.els.speedSet.hidden = true;
        state.els.zoomSet.hidden = true;
        renderList();

        state.els.play.addEventListener("click", play);
        state.els.replay.addEventListener("click", replay);
        state.els.back.addEventListener("click", () => window.CGoMapTools?.open?.());
        // 两枚设置按钮各管各的滑条：点开的那个显示、另一个收起；再点一次收起来
        state.els.setSpeed.addEventListener("click", () => {
            const show = state.els.speedSet.hidden;
            state.els.speedSet.hidden = !show;
            state.els.zoomSet.hidden = true;
        });
        state.els.setZoom.addEventListener("click", () => {
            const show = state.els.zoomSet.hidden;
            state.els.zoomSet.hidden = !show;
            state.els.speedSet.hidden = true;
        });
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
        });
        state.els.zoom.addEventListener("input", () => {
            state.zoom = Number(state.els.zoom.value) || ZOOM.def;
            state.els.zoomOut.textContent = `${state.zoom.toFixed(1)}×`;
            state.els.setZoom.querySelector("span").textContent = `${state.zoom.toFixed(1)}×`;
            applyAnimDurations();     // 倍数也决定画面上的推进速度，进场动画跟着一起调
            // 拖倍数时立刻换景别；播放中不打断当前段，留给下一段生效
            const step = state.steps[state.index];
            if (step && !state.playing) frameStep(step);
        });
        state.els.list.addEventListener("click", (e) => {
            const li = e.target.closest(".cgo-oh-item");
            if (!li) return;
            pause();
            jumpTo(Number(li.dataset.go) - 1);
        });
        watchPinned();
    }

    function unmount() {
        state.token++;
        clearTimers();
        unwatchPinned();
        state.playing = false;
        state.index = -1;
        clearCanvas();
        exitStage();
        if (state.body) {
            state.body.classList.remove(BODY_CLASS);
            state.body.style.removeProperty("--cgo-oh-pop-dur");
        }
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
