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
    const DOT_ICON_CLASS = "cgo-oh-doticon"; // 换乘站降级为普通站时的图元覆盖层
    const ON_CLASS = "cgo-oh-on";           // 虚拟换乘连线：该条两端都通了，可以画
    const ALWAYS_CLASS = "cgo-oh-always";   // 没有开通记录的国铁站：全程固定显示
    const GONE_CLASS = "cgo-oh-gone";       // 已拆除车站：图元、站名与引线一并隐去（永久闭站）
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
    /** 多站巡览：镜头在每站的停留（ms）与站间平移（ms）——「停一下、直接平移到下一站」 */
    const STOP_HOLD = 900;
    /** 段形态转换补间的最小窗口（ms）：纯转换拍没有站可巡时也得看得见擦除 */
    const CONV_MIN = 800;
    /** 取景移动/段落停顿（ms） */
    const T = { glide: 380, holdBase: 900, tailHold: 1600 };
    /** 演示期间临时放宽的缩放范围：全图取景比城市默认下限还小 */
    const SCALE_FLOOR = 0.2;
    /** 窄屏口径（与全仓 `MOBILE_MAX` 一致）：此宽度下浮层是贴底抽屉，而非贴在角落的浮岛 */
    const MOBILE_MAX = 640;

    /**
     * 类型徽标：几何 / 标签类按 `kind`，状态类按 `state`（两类 `*-state` 各自的取值表）。
     * 事件契约见各城 data_opening_history.js 文件头 —— 新增一种状态只在下表加一行。
     */
    const KIND_LABEL = { rename: "车站更名" };
    const STATE_LABEL = {
        station: { open: "车站开通", suspended: "车站未开通", removed: "车站移除", interchange: "站内换乘启用" },
        line: { open: "区段开通", suspended: "区段停运", removed: "区段移除" }
    };
    const badgeOf = (step) => {
        if (step.kind === "station-state") return STATE_LABEL.station[step.state] || step.state || step.kind;
        if (step.kind === "line-state") return STATE_LABEL.line[step.state] || step.state || step.kind;
        return KIND_LABEL[step.kind] || step.kind;
    };
    /** 撤站类步骤（车站停运 / 拆除、区段停运 / 移除）：既不是「新增」也不是「转乘」，两笔账都不动 */
    const isWithdrawal = (step) => (step.kind === "station-state" || step.kind === "line-state")
        && (step.state === "suspended" || step.state === "removed");

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

    /**
     * 演示专用车站（底图上不该出现的两类）：
     *   1. 已拆除车站（沿革里 `station-state` 的 `state: "removed"`，如长春 3 号线原辽宁路站；
     *      线路级的 `line-state` / `removed` 则按站序展开到独占车站）；
     *   2. 站台级「幽灵点」（`CGO_OFFSTATION_PLATFORMS`：同站不同台、只能付费站外换乘的那段时期
     *      用来多画一个点）。
     * 核心渲染车站时并不知道这些，故这里按沿革数据生成一条**只对非演示态生效**的规则：
     * `:not(.cgo-oh-stage)` 保证演示期间这条规则根本不匹配 —— 拆除那一步由 applyFrame 挂
     * `.cgo-oh-gone` 当场抹掉、幽灵点则由时间轴决定出现/消失；退出演示后又自动回到「不存在」。
     *
     * 选择器按站点 ID 直指节点（`#node_<sid>` / `#label_<sid>` / 呼出线），核心重建站点
     * 节点后依然命中，因此不需要常驻观察器。`!important` 是为了压过核心的 `display: flex`。
     */
    (function hideRetiredStations() {
        const ids = [];
        const pushIds = (list) => (list || []).forEach((sid) => { if (ids.indexOf(sid) < 0) ids.push(sid); });
        eventOps().forEach((ev) => {
            if (ev.kind === "station-state" && ev.state === "removed") { pushIds(ev.stations); return; }
            // 线路级移除：按站序展开出该区段的**独占**车站（共站站名要留着，另一条线还在跑）；
            // 此处尚未进演示流程，站点数据若未就绪则跳过
            if (ev.kind === "line-state" && ev.state === "removed") {
                const line = byLineId(ev.lineId);
                if (!line) return;
                pushIds(stationRangeOf(line, lineStations(line), ev).filter((sid) => soleOnLine(sid, ev.lineId)));
            }
        });
        (window.CGO_OFFSTATION_PLATFORMS || []).forEach((pf) => {
            if (pf && pf.id && ids.indexOf(pf.id) < 0) ids.push(pf.id);
        });
        if (!ids.length) return;
        const css = ids.map((sid) => [
            `#map-content:not(.cgo-oh-stage) #node_${sid}`,
            `#map-content:not(.cgo-oh-stage) #label_${sid}`,
            `#map-content:not(.cgo-oh-stage) [data-cgo-callout="${sid}"]`
        ].join(",")).join(",") + "{display:none !important}";
        const style = document.createElement("style");
        style.id = STYLE_ID + "-retired";
        style.textContent = css;
        document.head.appendChild(style);
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
        exportGen: 0,       // 导出代次：关面板 / 重开时 +1，让在飞的旧导出自行作废
        muxerLoading: null, // mp4-muxer 的按需加载 Promise（同一份只注入一次）
        exportTheme: null,  // 导出用：从 DOM 算好的主题色（画布读不到 CSS 变量）
        exportMark: null,   // 导出用：水印左侧的 CGo 小图标（栅格化后的 <img>，取不到则只留文字）
        exportCardRect: null, // 导出用：上一帧进度卡的矩形（画面让位、裁掉落进卡里的站名）
        cardPos: "br",      // 导出进度卡的角落：tl / tr / bl / br / off
        shown: new Map(),   // sid → form：已经出现在画布上的车站（引线重建后据此补状态）
        segPieces: [],      // 已画段落注册表 [{ lineId, s0, s1, pts, style, color, nodes }]：段形态转换的唯一对象
        dotColors: new Map(), // sid → dot 形态的环色（首条开通线路的颜色）
        alwaysOn: new Set(), // 全程固定显示的车站（国铁散点等，不参与逐个弹出）
        railStations: new Set(), // 国铁散点（type "rdot"）：按时间入场，但不参与全览取景
        demoOnly: new Set(),    // 演示专用车站（站台级幽灵点）：不计入站数统计、也不进全览取景
        offPairs: [],           // 站外换乘对 [主点 sid, 幽灵点 sid, 切免费画法的动作步号]：渲染层据此画那条虚线
        renamed: new Map(), // sid → 原文：被本模块改成旧名的标签，退出时还原
        renameMap: new Map(), // sid → [{ from, to, …, i }]：更名链（mount 时按数据重建，升序）
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

    /**
     * 一段区段（from = i → to = j）在核心路径上的落笔方式：
     *   pieces —— 1~2 段 `[lo, hi, s0, s1]` 切片范围。环线跨采样折线首尾（数组接缝）时
     *             拆成两截，两截沿路径首尾相接，连起来画就是一笔；
     *   flip   —— 切片恒定按路径正方向取，若该段声明的方向与之相反，整段翻过来画；
     *   edges  —— 该弧覆盖的站距下标（环线按**实际走的那条弧**算，含跨接缝那一节站距）。
     * 环线取站序更短的那条弧（与 Drunk / 自检 coverOf 同口径）。
     */
    function arcOf(path, ids, st, line, i, j) {
        const n = ids.length;
        const at = (k) => projectOnPath(path, st[ids[k]]);
        const edges = [];
        if (line.isLoop && n > 1) {
            const fwd = ((j - i) % n + n) % n;
            if (fwd === 0) return null;
            if (fwd <= n - fwd) {
                for (let k = 0; k < fwd; k++) edges.push((i + k) % n);
                if (i + fwd < n) return { pieces: [[i, j, at(i), at(j)]], flip: false, edges: edges };
                const L = segLength(path);
                return { pieces: [[i, n - 1, at(i), L], [0, j, 0, at(j)]], flip: false, edges: edges };
            }
            const bwd = n - fwd;
            for (let k = 0; k < bwd; k++) edges.push(((i - 1 - k) % n + n) % n);
            return { pieces: [[j, i, at(j), at(i)]], flip: true, edges: edges };
        }
        const lo = Math.min(i, j), hi = Math.max(i, j);
        for (let k = lo; k < hi; k++) edges.push(k);
        const lens = [];
        for (let k = lo; k <= hi; k++) {
            const s = at(k);
            if (s !== null) lens.push(s);
        }
        if (!lens.length) return null;
        return {
            pieces: [[lo, hi, Math.min.apply(null, lens), Math.max.apply(null, lens)]],
            flip: i > j, edges: edges
        };
    }

    /** 多段步进：把「整步已画长度」映射到某一段上的点（笔尖位置、取景中心都用它） */
    function pointAtMulti(segs, s) {
        let acc = 0;
        for (let k = 0; k < segs.length; k++) {
            const sg = segs[k];
            if (s <= acc + sg.len || k === segs.length - 1) {
                return pointAt(sg.pts, Math.max(0, Math.min(sg.len, s - acc)));
            }
            acc += sg.len;
        }
        return pointAt(segs[0].pts, 0);
    }

    /**
     * 该点落在某步生长路径上的进度 t（0~1）——站外换乘幽灵点「笔到人到」的弹出时刻要用：
     * 幽灵点不属于任何线路站序（不在 stationIds 里），collect 的沿线定位够不着它，
     * 这里按它到生长折线的最近投影补算。
     */
    function tOnStep(step, s) {
        const segs = step && step.segs;
        if (!segs || !segs.length) return null;
        let total = 0;
        segs.forEach((sg) => { total += sg.len || segLength(sg.pts); });
        if (!(total > 0)) return null;
        let acc = 0, bestAt = null, bestD = Infinity;
        segs.forEach((sg) => {
            const len = sg.len || segLength(sg.pts);
            const at = projectOnPath(sg.pts, s);
            if (at !== null) {
                const d = dist(pointAt(sg.pts, at), s);
                if (d < bestD) { bestD = d; bestAt = acc + at; }
            }
            acc += len;
        });
        return bestAt === null ? null : Math.max(0, Math.min(1, bestAt / total));
    }

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
        if (step.title) return step.title;
        if (step.kind === "rename" && step.rename) return `${step.rename.from} → ${step.rename.to}`;
        return step.lineName;
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

    /** 按 ID 取线路（城市数据尚未就绪时返回 undefined，调用方各自守卫） */
    function byLineId(id) {
        const arr = Array.isArray(window.linesData) ? window.linesData : [];
        for (let k = 0; k < arr.length; k++) if (arr[k] && arr[k].id === id) return arr[k];
        return null;
    }

    /**
     * 一条区段（`from` → `to`，可选 `segments` 多段）覆盖的**站序**（含两端）：
     * 非环线取两站之间，环线取站序更短的那条弧 —— 与自检 coverOf、几何 arcOf 同口径。
     * 供 `line-state`（区段停运 / 移除）把「线上的事」展开成「站上的账」，
     * 也供底图隐藏规则找出被移除区段里的车站。
     */
    function stationRangeOf(line, ids, ev) {
        const spec = (Array.isArray(ev.segments) && ev.segments.length)
            ? ev.segments : [{ from: ev.from, to: ev.to }];
        const n = ids.length, out = [];
        spec.forEach((sp) => {
            const i = ids.indexOf(sp.from), j = ids.indexOf(sp.to);
            if (i < 0 || j < 0 || !n) return;
            const push = (sid) => { if (sid && out.indexOf(sid) < 0) out.push(sid); };
            if (line.isLoop && n > 1) {
                const fwd = ((j - i) % n + n) % n;
                if (fwd === 0) { push(ids[i]); return; }
                if (fwd <= n - fwd) for (let k = 0; k <= fwd; k++) push(ids[(i + k) % n]);
                else for (let k = 0; k <= n - fwd; k++) push(ids[((i - k) % n + n) % n]);
            } else {
                for (let k = Math.min(i, j); k <= Math.max(i, j); k++) push(ids[k]);
            }
        });
        return out;
    }

    /** 事件 → 操作流展开（load 期与 build 期共用同一口径）：`ops` 优先，未写 ops 则事件本身即单个操作 */
    function eventOps() {
        const out = [];
        (window.CGO_OPENING_HISTORY || []).slice()
            .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
            .forEach((ev, evIdx) => {
                const list = (Array.isArray(ev.ops) && ev.ops.length) ? ev.ops : [ev];
                list.forEach((op, opIdx) => {
                    if (!op || !op.kind) return;
                    const rec = Object.assign({}, op, {
                        date: ev.date,
                        // 操作可自带 title / desc 覆盖事件级说明（同一事件各拍说各拍的事）
                        title: op.title || ev.title || "",
                        desc: op.desc || ev.desc || "",
                        evIdx: evIdx,
                        opIdx: opIdx
                    });
                    if (rec.kind === "line-state" && !rec.state) rec.state = "open";   // 缺省 = 开通
                    out.push(rec);
                });
            });
        return out;
    }

    /**
     * `until` 动作引用 → **操作下标**（eventOps 展开后的操作流里）：
     * `{ date, kind, state?, lineId? }` 精确定位到某一个操作。
     *
     * ⚠️ 一切「切画法」的阈值都必须绑**动作**、严禁绑日期：一条事件可以有好几拍
     * （2019-05-30 先开站内换乘、再演 17 站更名），按日期找只会命中当天第一拍 ——
     * 对应动作还没开演，画法就先改了。命中数 ≠ 1 时返回 -1（不猜、不取第一拍），
     * 由 selfcheck「幽灵点 until 动作引用唯一命中」拦截数据侧的歧义。
     */
    function findOpIndex(ops, ref) {
        if (!ref || typeof ref !== "object") return -1;
        let hit = -1, n = 0;
        ops.forEach((ev, k) => {
            if (ev.date !== ref.date || ev.kind !== ref.kind) return;
            if (ref.state !== undefined && ev.state !== ref.state) return;
            if (ref.lineId !== undefined && ev.lineId !== ref.lineId) return;
            hit = k; n++;
        });
        return n === 1 ? hit : -1;
    }

    /** 该站是否**只**在这一条线上（线级移除时判定独占站；共站站要留着，另一条线还在跑） */
    function soleOnLine(sid, lineId) {
        const arr = Array.isArray(window.linesData) ? window.linesData : [];
        for (let k = 0; k < arr.length; k++) {
            const l = arr[k];
            if (!l || l.id === lineId) continue;
            if (lineStations(l).indexOf(sid) >= 0) return false;
        }
        return true;
    }

    /**
     * 把沿革事件解析成可播放的步骤。
     *
     * 播放顺序按日期全局升序（数据文件按线路分组书写便于维护，顺序在这里归一）。
     * **事件 → 操作**先在此展开：一条事件（date / title / desc）可带 `ops` 里 1~N 个操作，
     * 每个操作各成一步、各演一拍、各自取景；不写 `ops` 时事件本身就是单个操作（简写）。
     * 下游一律按「操作流」处理，不需要知道来源是哪种写法。
     *
     * 几处按时间推进的判定都在这里一次算完，播放时只读不算：
     *   · 延伸方向：从**已开通的那一端**起笔（如 2 号线北延二期由航空航天大学往蒲田路画）；
     *   · 站点形态：换乘站在只通了一条线时先按普通站（dot）入场，第二条线开通时才转 tsf；
     *     暂缓开通的车站也在所属线路开通时先以未开通圈出现，到自己的补开事件再转正式形态；
     *   · 更名：有更名记录的车站在更名日期之前一律用旧名入场；
     *   · 里程：逐段累加已开通区间的站距，供面板显示当前运营里程（停运 / 移除为负）。
     */
    function build() {
        const st = stationMap();
        const byId = {};
        linesData().forEach((l) => { byId[l.id] = l; });
        const events = eventOps();   // 事件已按日期归一、展开成操作流

        const delayed = new Map();   // 暂缓开通站 → 补开日期（该站最后一次补开日，供 closedAt 判恢复）
        const delayedBy = new Map(); // sid → Map(lineId → 该线在本站的补开日)：判暂缓要按线路粒度看
        const closed = new Map();    // sid → [{ date, permanent }]（闭站 / 拆除，升序）
        const goneForever = new Set();   // 拆除终态的站（permanent 闭站）：永不复活
        const transferAt = new Map(); // sid → 站内换乘启用日（此前维持单线普通站形态）
        /**
         * 更名事件指向的车站：优先用事件里显式写的 `sid`，没写时按「现名或曾用名」反查
         * （兼容只有 from / to 的老数据）。同一站可以有**多次**更名，串成一条链。
         */
        const renameTarget = (ev) => {
            if (ev.sid && st[ev.sid]) return ev.sid;
            const keys = Object.keys(st);
            for (let k = 0; k < keys.length; k++) {
                const s = st[keys[k]];
                if (s.cn === ev.to) return keys[k];
                if (Array.isArray(s.aliases) && s.aliases.indexOf(ev.to) >= 0) return keys[k];
            }
            return null;
        };
        /**
         * 站台级幽灵点的**存续区间**（先于步骤算好，wantForm 要用）——按**操作下标**计、
         * 不按日期：同一天可以有好几拍，按日期判会在当天第一拍就把画法改了。
         * 出现 =「主点在该线首次通车」与「主点自己的、属于该线的 `station-state/open`（站台投用）」
         *       两个操作里较晚的那一个；
         * 消失 = 配置的 `until` 动作引用（见 findOpIndex），没写就取主点开通站内换乘
         *       （`station-state/interchange`）那一个操作。
         * 配对存在期间主点**不升换乘图元** —— 两座站台各自成点、之间靠连线表达换乘：
         * 临河街/卫星路、解放桥、长春站南站都是这种「同站不同台」，物理上本就是两座站。
         */
        const phantomRange = new Map();   // 主点 sid → [{ fromOp, toOp }]（操作下标，左闭右开）
        (window.CGO_OFFSTATION_PLATFORMS || []).forEach((pf) => {
            if (!pf || !pf.of) return;
            const lineOpen = events.findIndex((ev) => ev.kind === "line-state" && ev.state === "open" && ev.lineId === pf.line);
            const platOpen = events.findIndex((ev) => ev.kind === "station-state" && ev.state === "open"
                && ev.lineId === pf.line && (ev.stations || []).indexOf(pf.of) >= 0);
            const cand = [lineOpen, platOpen].filter((i) => i >= 0);
            if (!cand.length) return;
            const fromOp = Math.max.apply(null, cand);
            const transfer = events.findIndex((ev) => ev.kind === "station-state" && ev.state === "interchange"
                && (ev.stations || []).indexOf(pf.of) >= 0);
            const toOp = pf.until ? findOpIndex(events, pf.until) : transfer;
            if (toOp < 0 || toOp <= fromOp) return;
            const list = phantomRange.get(pf.of) || [];
            list.push({ fromOp: fromOp, toOp: toOp });
            phantomRange.set(pf.of, list);
        });
        /**
         * 状态类事件归纳成三张时间账（`wantForm` / `closedAt` / `closedLinesAt` 只读这里）：
         *   open        → 补开 / 恢复日（暂缓站与闭站复开共用一张 `delayed`，按线路粒度另记）
         *   interchange → 站内换乘启用日（此前不许升 tsf 形态）
         *   suspended / removed → 闭站日（removed 即拆除，`permanent` 置位、永不再开）
         * 线路级的 `line-state` 按站序展开成逐站的账 —— 线上的事落到站上，判定路径与站级完全一致。
         */
        const markClosed = (sid, ev, permanent) => {
            if (!closed.has(sid)) closed.set(sid, []);
            closed.get(sid).push({ date: ev.date, permanent: !!permanent, lineId: ev.lineId });
            if (permanent) goneForever.add(sid);   // 拆除是终态：之后任何操作都不许让它复活
        };
        events.forEach((ev) => {
            if (ev.kind === "station-state") {
                if (ev.state === "open") {
                    (ev.stations || []).forEach((sid) => {
                        delayed.set(sid, ev.date);
                        const per = delayedBy.get(sid) || new Map();
                        per.set(ev.lineId, ev.date);
                        delayedBy.set(sid, per);
                    });
                } else if (ev.state === "interchange") {
                    // 换乘启用日：只登记时刻，形态判定见 wantForm（此刻之前不许升 tsf）
                    (ev.stations || []).forEach((sid) => transferAt.set(sid, ev.date));
                } else {
                    // 闭站：闭站日之后本站不再是「已开通」站；`removed` 表示拆除（永不再开）。
                    // 只通一条线的站闭站即整站停用，故直接按「未开通」图元示意 —— 与暂缓站同一套画法。
                    (ev.stations || []).forEach((sid) => markClosed(sid, ev, ev.state === "removed"));
                }
            } else if (ev.kind === "line-state") {
                // ⚠️ 只有**收缩侧**（suspended / removed）才是闭站账；open 是开通，
                //    记进去会让全网的站在开通当天就被判成「闭站」（图元全变未开通圈）。
                if (ev.state === "open") return;
                const line = byId[ev.lineId];
                if (!line) return;
                const ids = lineStations(line);
                stationRangeOf(line, ids, ev).forEach((sid) => markClosed(sid, ev, ev.state === "removed"));
            }
        });

        const shown = new Set();      // 已经出现在画布上的站
        const lineIdsAt = new Map();  // sid → Set(已开通线路 ID)
        const firstLineOf = new Map(); // sid → 首条开通线路 ID
        const formOf = new Map();     // sid → 当前形态
        const steps = [];

        /**
         * 此刻该站是否处于闭站（拆除视为永久闭站）。
         * 恢复的判据是「闭站日之后还有一次 `station-state/open`」—— 与暂缓站共用 `delayed`，
         * 因此芙蓉桥（闭 2021-11-28 → 复 2023-05-30）、西安桥（→ 复 2022-06-01）都走这一条。
         */
        const closedAt = (sid, date) => {
            const list = closed.get(sid);
            if (!list) return false;
            let last = null;
            for (let k = 0; k < list.length; k++) if (list[k].date <= date) last = list[k];
            if (!last) return false;
            if (last.permanent) return true;
            const re = delayed.get(sid);
            return !(re && re > last.date && re <= date);
        };

        /**
         * 此刻该站应以什么形态出现：
         * 换乘站不满两条线先当普通站画；**暂缓开通**的站哪怕线路已经通过，
         * 本站也先按「未开通」图元示意，直到它自己的补开事件才转正式形态；
         * **闭站 / 拆除**的站同理先按「未开通」示意（拆除的站由渲染层彻底隐去，见 goneAt）。
         */
        /**
         * 某站在 date 时**已停用的线路**集合。逐线判定：该线在本站的最后一次闭站日 ≤ date，
         * 且此后没有该线的补开（`station-state/open`）落在 date 之内；`removed`（拆除）永不再开。
         * 一条线停运不等于整站停用 —— 长春站 2021-11-28 起只剩 1 号线、解放桥 2021-03-08 起
         * 只剩 2 号线，那段时间它们是**那条线的普通站**，不是「未开通」。
         */
        const closedLinesAt = (sid, date) => {
            const out = new Set();
            const list = closed.get(sid);
            if (!list) return out;
            const per = delayedBy.get(sid);
            for (let k = 0; k < list.length; k++) {
                const c = list[k];
                if (c.date > date) continue;
                if (c.permanent) { out.add(c.lineId); continue; }
                const re = per && per.get(c.lineId);
                if (!(re && re > c.date && re <= date)) out.add(c.lineId);
            }
            return out;
        };
        /** 该站在 date 时**仍在服务**的线路（到过站的线路去掉已停用的） */
        const aliveLinesAt = (sid, date) => {
            const closedLines = closedLinesAt(sid, date);
            const out = [];
            (lineIdsAt.get(sid) || new Set()).forEach((lid) => { if (!closedLines.has(lid)) out.push(lid); });
            return out;
        };
        /** 该站此刻的图元配色：优先用仍在服务的第一条线（只剩一条线时尤其重要） */
        const aliveColorOf = (sid, date) => {
            const alive = aliveLinesAt(sid, date);
            if (!alive.length) return null;
            // 优先用**最早到达且仍在跑**的那条线的颜色：站点图元沿用「最先覆盖它的线」，
            // 只有那条线停运时才换成接替它的线（长春站 2021 年只剩 1 号线、解放桥只剩 2 号线）。
            const first = firstLineOf.get(sid);
            if (first && alive.indexOf(first) >= 0) {
                const lf = byId[first];
                if (lf) return lf.color;
            }
            const l = byId[alive[0]];
            return l ? l.color : null;
        };
        const wantForm = (sid, date, opIdx) => {
            const s = st[sid];
            if (!s) return "real";
            // 闭站**按线路**判：全线停用才画「未开通」；只剩一条线在跑时，本站就是那条线的普通站，
            // 图元与配色都归那条线。
            const alive = aliveLinesAt(sid, date);
            if (closedLinesAt(sid, date).size && !alive.length) return "no";
            if (s.type === "no") {
                // 数据里本就标着「未开通」的站（在建 / 规划）：除非它有自己的补开事件（暂缓站），
                // 否则一直按未开通图元示意 —— 线路从它站厅通过，不等于它开通了。
                const re = delayed.get(sid);
                return (re && re <= date) ? "real" : "no";
            }
            // 「暂缓开通」的判定：**必须没有任何一条线真正在服务这座站**，才算整站未开通。
            // 只看「该站自己的补开事件还没到」是不够的 —— 长春站 2002 年就有 3 号线在跑，
            // 1 号线站台 2019-01-26 才投用，那段时间本站是开着的（只是又一条线来得晚），
            // 画成未开通图元就错了。所以**按线路逐个看**：只要有一条线已到站、且它在本站
            // 没有被补开事件压后，本站就是开着的。东新路（4 号线唯一经过、2023-12-31 才停靠）
            // 这种才会被判成暂缓。
            if (!closed.has(sid)) {
                const linesHere = lineIdsAt.get(sid) || new Set();
                const per = delayedBy.get(sid);
                let served = false;
                linesHere.forEach((lid) => {
                    const d = per ? per.get(lid) : null;
                    if (!(d && d > date)) served = true;
                });
                if (linesHere.size && !served) return "no";
            }
            // 站内换乘启用日之前：即便两条线都通过、各自站台也都投用了，只要两站台之间还不能
            // 站内连通，就仍按「先有一条线、后又被另一条线覆盖的同一座站」渲染 —— 维持单线普通站。
            // 长春站即此例：3 号线地面站与 1 号线地下站先后投用，但换乘要出站再进站，
            // 直到 2021-12-31 三号线东延入地，两个站台才站内连通。
            // 站台级幽灵点存续期间，主点保持**单线普通站**形态：两座站台各自成点、以连线表达换乘，
            // 不能提前合成换乘图元（临河街/卫星路、解放桥都是这种）。
            const ph = phantomRange.get(sid);
            // 存续区间按**操作下标**判（左闭右开）：与幽灵点的移出同一拍收掉，
            // 不给「事件第一拍先改了、对应动作还没开演」留口子
            if (opIdx != null && ph && ph.some((r) => opIdx >= r.fromOp && opIdx < r.toOp)) return "dot";
            const tr = transferAt.get(sid);
            if (tr && tr > date && s.type === "tsf") return "dot";
            const n = alive.length;   // 仍**在服务**的线路数（有线路停运时把那条线排除）
            return (s.type === "tsf" && n < 2) ? "dot" : "real";
        };

        const stepOfEvent = [];   // 操作下标 → 步骤下标（有的操作不产生步骤，如无走向的 line-state）
        /** 各线「已画区间」（含镂空态）：line-state{open} 据此判「生长」还是「形态转换」 */
        const buildDrawn = new Map();   // lineId → [{ s0, s1 }]（采样路径弧长坐标）
        events.forEach((ev, evIdx) => {
            const line = byId[ev.lineId];
            if (!line) return;
            const ids = lineStations(line);
            const step = {
                date: ev.date,
                kind: ev.kind,
                state: ev.state,   // 状态类（station-state / line-state）的取值，rename 为 undefined
                evIdx: ev.evIdx,
                // 说明分两块挂在**事件**上（title / desc），同一事件的各拍共享
                title: ev.title || "",
                desc: ev.desc || "",
                lineId: ev.lineId,
                lineName: line.name || ev.lineId,
                color: line.color || "#8a94a6",
                pts: null,
                lengthPx: 0,
                stations: [],
                focus: null,
                rename: null,
                segConv: [],   // 段形态转换 [{ s0, s1, style }]：solid 实线 / hollow 镂空 / hidden 空白
                addedMileage: 0
            };
            /** line-state 的逐站豁免表：sid → { state?, tsf? } */
            const ex = {};
            (Array.isArray(ev.except) ? ev.except : []).forEach((e) => {
                if (e && e.sid) ex[e.sid] = e;
            });

            /**
             * 段内每站登记一次「该线已开通」，再逐个决定是否入场 / 是否换形态。
             * 一条操作可能带**多段**（`segments`），各段共用一步；站的弹出时刻要按**整步**
             * 归一化，故额外收 `base`（本段在整步已画长度里的起点）与 `total`（整步总长）。
             *
             * `ex` 是 line-state 的逐站豁免：`{ sid, state: "suspended"|"removed"|"open", tsf: false }`
             *   · state "suspended"：该站**不随段开通**（列车通过不停车），不记服务账；
             *     从未入场则以「未开通圈」直接入场（暂缓站，不播「开通再倒回」）；
             *   · state "removed"：该站随段移除；
             *   · tsf: false：照常记服务账，但压住本拍的自动升换乘（换乘通道未通）。
             */
            const collect = (segIds, path, s0, s1, reversed, base, total, exMap) => {
                segIds.forEach((sid) => {
                    if (goneForever.has(sid)) return;   // 拆除终态：不复活、不记服务账
                    const e = exMap && exMap[sid];
                    if (e && (e.state === "suspended" || e.state === "removed")) return;   // 豁免：不记服务账
                    if (!lineIdsAt.has(sid)) {
                        lineIdsAt.set(sid, new Set());
                        firstLineOf.set(sid, ev.lineId);   // 首条开通的线路（dot 形态用它上色）
                    }
                    lineIdsAt.get(sid).add(ev.lineId);
                    // 记「该线到本站的日期」：暂缓判定与线路闭站恢复共用这一张账。
                    // 取**较晚**的那次：区段延伸重新经过本站时不能把「本站自己的补开日」
                    // 顶回去（暂缓站一被延伸段扫过就提前开通），闭站恢复也以最近一次为准。
                    const per = delayedBy.get(sid) || new Map();
                    const prev = per.get(ev.lineId);
                    if (!(prev && prev > ev.date)) per.set(ev.lineId, ev.date);
                    delayedBy.set(sid, per);
                });
                segIds.forEach((sid) => {
                    if (goneForever.has(sid)) return;   // 拆除终态：不复活
                    const s = st[sid];
                    if (!s || !Number.isFinite(s.x)) return;
                    const e = exMap && exMap[sid];
                    let want, forceLeave = false;
                    if (e && e.state === "removed") {
                        forceLeave = true; want = "gone";
                    } else if (e && e.state === "suspended") {
                        // 通过不停车：从未入场 → 以未开通圈入场；已入场 → 保持原形态不转换
                        if (shown.has(sid)) return;
                        want = "no";
                    } else {
                        want = wantForm(sid, ev.date, evIdx);
                        if (e && e.tsf === false && want === "real" && s.type === "tsf") want = "dot";
                    }
                    const cur = formOf.get(sid);
                    let mode;
                    if (!shown.has(sid)) {
                        if (forceLeave) return;   // 没入场过就谈不上移除
                        shown.add(sid);
                        formOf.set(sid, want);
                        mode = "enter";
                    } else if (forceLeave) {
                        formOf.set(sid, want);
                        mode = "leave";
                    } else if (cur !== want) {
                        formOf.set(sid, want);
                        mode = "upgrade";   // 已在线网上，这次是「从普通站变成换乘站」等形态转换
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
                    // 多段步：把「本段内的相对位置」换算成整步进度（笔尖是按整步走的）
                    if (Number.isFinite(base) && total > 0) {
                        t = (base + t * Math.abs(s1 - s0)) / total;
                    }
                    const firstLine = byId[firstLineOf.get(sid)];
                    step.stations.push({
                        sid: sid, x: s.x, y: s.y, t: t, form: want, mode: mode,
                        dotColor: aliveColorOf(sid, ev.date) || (firstLine ? firstLine.color : line.color)
                    });
                });
                step.stations.sort((a, b) => a.t - b.t);
            };

            if (ev.kind === "line-state" && ev.state === "open") {
                // 区段开通 / 恢复（state 缺省即 open）。一条操作可带**多段**（`segments: [{from,to}, …]`）：
                // 环线同一天开通的几段弧、或一条线分几处补全。多段**共用一步**，各段按声明方向依次画出；
                // 段与段之间由时间线插一段「把镜头挪到下一段起点」的运镜（见 buildTimeline.growthPhases）。
                const spec = (Array.isArray(ev.segments) && ev.segments.length)
                    ? ev.segments : [{ from: ev.from, to: ev.to }];
                const path = sampleCorePath(ev.lineId)
                    || (Array.isArray(line.pathPoints) && line.pathPoints.length >= 2 ? line.pathPoints : null)
                    || ids.map((sid) => st[sid]).filter((s) => s && Number.isFinite(s.x));
                if (!path || path.length < 2) return;

                const n = ids.length;
                const dists = Array.isArray(line.distances) ? line.distances : [];
                /**
                 * 这一端「已经在网里」的程度：本端已开通记 2、只是有个通着的邻居记 1、都不通记 0。
                 * 延伸段从得分高的那一端起笔。只看邻居会漏掉「本端已通、对端才是本次新站」的情形
                 * （大连 3 号线「大连站 ⇄ 香炉礁」两端邻居都通，按邻居判就会从新站那端起笔，
                 * 看上去像凭空冒出来一段）。
                 */
                const openRank = (k) => {
                    if (shown.has(ids[k])) return 2;
                    const box = [ids[k - 1], ids[k + 1]];
                    if (line.isLoop && n > 1) box.push(ids[(k - 1 + n) % n], ids[(k + 1) % n]);
                    return box.some((sid) => sid && shown.has(sid)) ? 1 : 0;
                };

                const segs = [];
                spec.forEach((sp) => {
                    let i = ids.indexOf(sp.from), j = ids.indexOf(sp.to);
                    if (i < 0 || j < 0) return;
                    // 延伸线从**已开通的那一端**起笔（逐段独立判断）：照声明方向画会从新线的
                    // 远端空落下笔，看上去像脱网生长
                    if (openRank(i) < openRank(j)) { const swap = i; i = j; j = swap; }
                    const arc = arcOf(path, ids, st, line, i, j);
                    if (!arc) return;
                    // 里程：按**实际走的那条弧**取站距（跨接缝那一节也不会漏）
                    arc.edges.forEach((e) => {
                        const d = Number(dists[e]);
                        if (Number.isFinite(d)) step.addedMileage += d;
                    });
                    arc.pieces.forEach(function (pc) {
                        const lo = pc[0], hi = pc[1], s0 = pc[2], s1 = pc[3];
                        if (!(Number.isFinite(s0) && Number.isFinite(s1) && s1 > s0)) return;
                        let pts = slicePath(path, s0, s1);
                        if (!pts || pts.length < 2) return;
                        if (arc.flip) pts = pts.slice().reverse();
                        segs.push({
                            pts: pts, lo: lo, hi: hi, s0: s0, s1: s1, flip: arc.flip,
                            len: Math.max(1, segLength(pts))
                        });
                    });
                });
                if (!segs.length) return;

                // 生长 vs 形态转换：**已画过的区间**（实线或镂空）不再重画，只把样式转回实线
                // （停运段恢复运营即此例，重播生长像「线又长了一遍」）；没画过的才真生长。
                // 移除过的区间已从已画账里销掉（空白 = 从未画过），再开通时照常重新生长。
                const drawn = buildDrawn.get(ev.lineId) || [];
                const grow = [], conv = [];
                segs.forEach((sg) => {
                    const covered = drawn.some((iv) => iv.s0 <= sg.s0 + 0.01 && sg.s1 - 0.01 <= iv.s1);
                    if (covered) conv.push(sg);
                    else grow.push(sg);
                });
                step.segConv = conv.map((sg) => ({ s0: sg.s0, s1: sg.s1, style: "solid" }));
                let total = 0;
                grow.forEach((sg) => { sg.base = total; total += sg.len; });
                step.segs = grow;
                step.pts = grow.length ? grow.reduce((acc, sg) => acc.concat(sg.pts), []) : null;   // 仅供包围盒 / 有无走向判断
                step.lengthPx = total;
                if (grow.length) step.focus = pointAtMulti(grow, total / 2);
                else if (conv.length) step.focus = pointAt(conv[0].pts, segLength(conv[0].pts) / 2);
                // 本步之后整段都在画布上（镂空也算画过）：记进已画账
                segs.forEach((sg) => {
                    drawn.push({ s0: Math.min(sg.s0, sg.s1), s1: Math.max(sg.s0, sg.s1) });
                });
                buildDrawn.set(ev.lineId, drawn);
                segs.forEach((sg) => collect(ids.slice(sg.lo, sg.hi + 1), path, sg.s0, sg.s1, sg.flip, sg.base, total, ex));
            } else if (ev.kind === "station-state"
                && (ev.state === "open" || ev.state === "interchange")) {
                // open = 投用 / 补开 / 恢复运营（暂缓站与闭站复开都走这里，collect 负责入场或转形态）；
                // interchange = 站内换乘启用：这是**形态**事件，不改线路。wantForm 已在此日之后
                // 放行换乘形态，这里把该站真正升为换乘图元即可（启用日与某条线开通同日时，那一步
                // 可能已升过一次，collect 会按「形态没变」自然跳过）。仍单独成一步，是为了让
                // 「换乘启用」本身在时间线上有个交代，也覆盖「换乘晚于两条线开通」的普遍情形。
                const targets = (ev.stations || []).filter((sid) => st[sid] && Number.isFinite(st[sid].x));
                collect(targets, null, NaN, NaN, false);
                if (targets.length) {
                    step.focus = { x: st[targets[0]].x, y: st[targets[0]].y };
                }
            } else if (ev.kind === "line-state" || ev.kind === "station-state") {
                // 撤站：suspended = 该段 / 该站**不通车**（未开通圈，线路段转镂空双线）；
                // removed = 移除（图元、站名与引线一并抹掉，mode: "leave"；线路段转空白）。
                // 只对**已经出现在画布上**的站生效 —— 尚未入场的规划站没有「关」这一说。
                // `line-state` 是「区段」级的事，先按站序展开成站，判定路径与站级完全一致。
                if (ev.kind === "line-state") {
                    // 段的形态转换：suspended → 未开通镂空；removed → 空白（从已画账销掉，
                    // 将来重新开通时重新生长）。停运 / 移除的里程同步倒扣。
                    const path = sampleCorePath(ev.lineId)
                        || (Array.isArray(line.pathPoints) && line.pathPoints.length >= 2 ? line.pathPoints : null)
                        || ids.map((sid) => st[sid]).filter((s) => s && Number.isFinite(s.x));
                    const dists = Array.isArray(line.distances) ? line.distances : [];
                    const spec = (Array.isArray(ev.segments) && ev.segments.length)
                        ? ev.segments : [{ from: ev.from, to: ev.to }];
                    const style = ev.state === "removed" ? "hidden" : "hollow";
                    spec.forEach((sp) => {
                        const i = ids.indexOf(sp.from), j = ids.indexOf(sp.to);
                        if (i < 0 || j < 0) return;
                        const arc = path && path.length >= 2 ? arcOf(path, ids, st, line, i, j) : null;
                        if (!arc) return;
                        arc.edges.forEach((e) => {
                            const d = Number(dists[e]);
                            if (Number.isFinite(d)) step.addedMileage -= d;
                        });
                        arc.pieces.forEach((pc) => {
                            const s0 = Math.min(pc[2], pc[3]), s1 = Math.max(pc[2], pc[3]);
                            if (!(Number.isFinite(s0) && Number.isFinite(s1) && s1 > s0)) return;
                            step.segConv.push({ s0: s0, s1: s1, style: style });
                        });
                    });
                    if (style === "hidden" && step.segConv.length) {
                        // 空白 = 从未画过：整段从已画账销掉，再开通照常重新生长
                        const keep = (buildDrawn.get(ev.lineId) || []).filter((iv) =>
                            !step.segConv.some((c) => iv.s0 >= c.s0 - 0.01 && iv.s1 <= c.s1 + 0.01));
                        buildDrawn.set(ev.lineId, keep);
                    }
                    if (step.segConv.length && path && path.length >= 2) {
                        const mid = step.segConv[0];
                        step.focus = pointAt(path, (mid.s0 + mid.s1) / 2);
                    }
                }
                const range = ev.kind === "line-state" ? stationRangeOf(line, ids, ev) : (ev.stations || []);
                range.forEach((sid) => {
                    const e = ex[sid];
                    if (e && e.state === "open") {
                        collect([sid], null, NaN, NaN, false, NaN, 0, null);   // 豁免：该站照常开通 / 维持
                        return;
                    }
                    const s = st[sid];
                    if (!s || !Number.isFinite(s.x) || !shown.has(sid)) return;
                    // removed：站级 = 整站拆除；线级 = 只移除**未连接任何已开通线路**的独占站
                    // （共站换乘站的另一条线还在跑，站照常保留，见长春站 / 解放桥）。
                    const gone = (e && e.state === "removed")
                        || (ev.state === "removed" && (ev.kind === "station-state" || !aliveLinesAt(sid, ev.date).length));
                    const want = gone ? "gone" : wantForm(sid, ev.date, evIdx);
                    formOf.set(sid, want);
                    if (gone) shown.delete(sid);   // 重新开通时按「再次入场」处理（回放计数也才对）
                    const first = byId[firstLineOf.get(sid)];
                    step.stations.push({
                        sid: sid, x: s.x, y: s.y, t: 0, form: want,
                        mode: gone ? "leave" : "upgrade",
                        dotColor: aliveColorOf(sid, ev.date) || (first ? first.color : line.color)
                    });
                    if (!step.focus) step.focus = { x: s.x, y: s.y };
                });
            } else if (ev.kind === "rename") {
                // 一条事件可带**多对**改名（`ev.renames: [{sid, from, to, fromEn, toEn}, …]`）：
                // 同日同批的更名（如 2019-05-30 长春 3、4 号线十几站调整）合成一步演，
                // 不再一站一拍。只写单对时行为与原来完全一致。
                const specs = (Array.isArray(ev.renames) && ev.renames.length) ? ev.renames : [ev];
                step.renames = [];
                specs.forEach((spec) => {
                    const evx = Object.assign({}, ev, spec);
                    const sid = renameTarget(evx);
                    if (!sid) return;
                    // to* 默认取车站数据里的**现行名**（链上最后一次更名的结果）；
                    // 若这次是链中间的更名，事件里用 `toEn` / `toMn` 写明当时那版名字。
                    step.renames.push({
                        sid: sid, from: evx.from, to: evx.to,
                        fromEn: evx.fromEn, toEn: evx.toEn || st[sid].en,
                        fromMn: evx.fromMn, toMn: evx.toMn || st[sid].mn
                    });
                });
                if (step.renames.length) {
                    step.rename = step.renames[0];   // 兼容：只认单条的老代码仍按原名读
                    step.focus = { x: st[step.renames[0].sid].x, y: st[step.renames[0].sid].y };
                }
            }

            stepOfEvent[evIdx] = steps.length;
            steps.push(step);
        });

        /**
         * 站台级「幽灵点」（`CGO_OFFSTATION_PLATFORMS`）：同一座车站两条线各有站台、却只能
         * **付费站外换乘**的那段时期，在图上多画一个点，并配一条虚线连到主点。
         * 出现时刻 =「主点在该线首次通车」与「主点自己的 `station-state/open`（站台投用）」里**较晚**的那一步；
         * 消失时刻 = 主点 `station-state/interchange`（开通站内换乘）那一步 —— 都从已有事件里取，不必另写日期。
         * 这类点**不属于任何线路（不在 stationIds 里）**，底图上由共享层的样式规则隐藏。
         */
        const demoOnly = new Set();
        const offPairs = [];
        (window.CGO_OFFSTATION_PLATFORMS || []).forEach((pf) => {
            const s = pf && pf.id ? st[pf.id] : null;
            if (!pf || !s || !Number.isFinite(s.x)) return;
            let arr = -1, open = -1, end = -1, endOp = -1;
            // ⚠️ 不能用「某一步的 stations 里有没有 of」来判该线何时到站：车站早已在线网上时，
            //    collect 会按「形态没变」提前返回、那一步的 stations 里根本没有它。
            //    改用「该线首次通车」那一步 —— 幽灵点对应的站台都在各自线路的首通段上。
            for (let k = 0; k < steps.length; k++) {
                if (steps[k].kind === "line-state" && steps[k].state === "open" && steps[k].lineId === pf.line) { arr = k; break; }
            }
            events.forEach((ev, k) => {
                const si = stepOfEvent[k];
                if (si === undefined) return;
                if (open < 0 && ev.kind === "station-state" && ev.state === "open"
                    && (ev.stations || []).indexOf(pf.of) >= 0) open = si;
                if (end < 0 && ev.kind === "station-state" && ev.state === "interchange"
                    && (ev.stations || []).indexOf(pf.of) >= 0) { end = si; endOp = k; }
            });
            const birth = Math.max(arr, open);
            // 幽灵点的「移出」时刻：默认是主点开通站内换乘那一步；配置里给了 `until`
            // （如 3、4 号线站名统一那天，或主点所属那条线自己被停运那天）就以 until 为准 ——
            // 站名已统一、或那条线已不在这座站，就没有「两个同名站台相望」这回事了。
            // ⚠️ until 是**动作引用**（`{ date, kind, state? }`，见 findOpIndex），绑操作步号、
            //    严禁按日期找步：2019-05-30 一条事件有「开站内换乘」「17 站更名」两拍，
            //    按日期只会命中当天第一拍 —— 更名还没开演，两个站台就先合成一个了。
            let endStep = end;
            if (pf.until) {
                const opIdx = findOpIndex(events, pf.until);
                const si = opIdx >= 0 ? stepOfEvent[opIdx] : undefined;
                if (si === undefined) {
                    console.warn("[线网发展史] 幽灵点 " + pf.id + " 的 until 未唯一命中任何操作，已跳过该点");
                    return;
                }
                endStep = si;
                endOp = opIdx;
            }
            if (birth < 0 || endStep <= birth) return;   // 没有「站外换乘」这一段的车站不必插点
            const dotColor = byId[pf.line] ? byId[pf.line].color : null;
            // 「笔到人到」：幽灵点跟着主点 / 沿线位置弹出（优先取主点在本步的 t，
            // 其次按到生长折线的最近投影补算），而不是在生长一开始就冒出来
            const bStep = steps[birth];
            const mainPop = bStep.stations.find((q) => q.sid === pf.of);
            let popT = mainPop ? mainPop.t : tOnStep(bStep, s);
            if (popT === null || popT === undefined) popT = 0.5;
            steps[birth].stations.push({ sid: pf.id, x: s.x, y: s.y, t: popT, form: "dot", mode: "enter", dotColor: dotColor, grp: pf.of });
            steps[endStep].stations.push({ sid: pf.id, x: s.x, y: s.y, t: 0, form: "dot", mode: "leave", dotColor: dotColor, grp: pf.of });
            // 幽灵点移出的同一拍，主点要按「配对已结束」重判形态：rename 拍不 collect 车站，
            // 不补这一下，站名合并后主点会永远停在普通站形态（临河街/卫星路 → 职业学院即此例）。
            // 幂等比较的基准是「回放到本拍为止该站的形态记录」——不能拿 formOf 的最终值比，
            // 后面的拍还可能再改它（0125 在 2021-12-31 又升回换乘），本拍 collect 动过的也不能重复登记。
            const mainS = st[pf.of];
            if (mainS && Number.isFinite(mainS.x) && shown.has(pf.of)) {
                let curMain;
                for (let k = 0; k <= endStep; k++) {
                    steps[k].stations.forEach((q) => { if (q.sid === pf.of) curMain = q.form; });
                }
                const wantMain = wantForm(pf.of, steps[endStep].date, endOp);
                if (wantMain !== curMain) {
                    formOf.set(pf.of, wantMain);
                    const firstLine = byId[firstLineOf.get(pf.of)];
                    steps[endStep].stations.push({
                        sid: pf.of, x: mainS.x, y: mainS.y, t: 0,
                        form: wantMain, mode: "upgrade", grp: pf.of,
                        dotColor: aliveColorOf(pf.of, steps[endStep].date) || (firstLine ? firstLine.color : dotColor)
                    });
                }
            }
            demoOnly.add(pf.id);
            // 第三项 =「主点开通站内换乘」**动作**的步号（绑动作不绑日期，同 until 的口径）：
            // 此前两端是**付费出站**换乘（连线用付费画法），此后是**免费**换乘（连线换成免费画法）。
            // 两套画法见 syncOffStationLinks。找不到该动作时留 -1，连线一直按付费画。
            offPairs.push([pf.of, pf.id, end]);
        });
        state.demoOnly = demoOnly;
        state.offPairs = offPairs;

        // 累计量一次算好：面板每步只读，不必重算
        const lineSet = new Set();
        const seen = new Set();
        let mileage = 0;
        // 国铁车站（`type: "rdot"`）不计入站数统计 —— 它们不是城市轨道交通的车站
        // （市域铁路怎么算待定，目前五城都没有市域铁路线路）。图元与入场动画照旧
        // （首条线路开通后启用的按 `station-state/open` 登记、到时入场），只把「车站 N 座 /
        // 新增 N 站」这两笔账里的它们剔掉，并让**全览取景**也不参与（见 camWholeOf）。
        const railStations = new Set();
        Object.keys(st).forEach((sid) => {
            if (st[sid] && st[sid].type === "rdot") railStations.add(sid);
        });
        state.railStations = railStations;
        steps.forEach((s, i) => {
            if (s.kind === "line-state" && s.state === "open") lineSet.add(s.lineId);
            let added = 0, counted = 0;
            // 撤站（停运 / 拆除 / 区段移除）既不是「新增」也不是「转乘」——它是把站从图上撤下，两笔账都不该动
            const withdraw = isWithdrawal(s);
            s.stations.forEach((x) => {
                if (railStations.has(x.sid)) return;
                if (demoOnly.has(x.sid)) return;   // 站台幽灵点不是「一座车站」，不计入站数
                if (withdraw) return;
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
        // 原样还原接管前的 x / y / scale 三项。早先只还原缩放再 centerMap()，等于回城市默认中心——
        // 用户先拖到某片区域再打开演示，关掉后镜头就丢了（上游审查意见 #3）。
        if (prev && window.setMapView) {
            window.setMapView({ x: prev.x, y: prev.y, scale: prev.scale });
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
        setDotIcon(node, x.sid, isDot, fallbackColor);
    }

    /**
     * 换乘站「还没成为换乘站」时的普通站图元。
     *
     * **必须走核心 / 城市的车站图元真源**：各城普通站的画法并不相同（沈阳是线路色环、
     * 哈尔滨与大连是文字色环、上海是短横与胶囊……），这里若自己画一个圆，降级出来的
     * 图元就会和图上其他普通站对不上。图元 HTML 直接问 `city.renderStationIcon`
     * （把 type 顶成 dot），没有城市接管时回落 `CGoStationIcons.iconHtmlFor`，
     * 与 core/script.js 的取用口径一致。
     * 环色取**首条开通线路**的颜色（不是 linesData 里排第一的那条）。
     */
    function setDotIcon(node, sid, isDot, fallbackColor) {
        const old = node.querySelector("." + DOT_ICON_CLASS);
        if (!isDot) { old?.remove(); return; }
        const st = stationMap()[sid];
        if (!st) return;
        const c = state.dotColors.get(sid) || dotColorOf(sid, fallbackColor) || "#888";
        const fake = Object.assign({}, st, { type: "dot", lineColors: [c] });

        const city = window.CURRENT_CITY;
        const custom = city && typeof city.renderStationIcon === "function"
            ? city.renderStationIcon(fake, sid) : null;
        const api = window.CGoStationIcons;
        const res = (custom && custom.html)
            ? custom
            : (api && typeof api.iconHtmlFor === "function" ? { html: api.iconHtmlFor(fake) } : null);
        if (!res || !res.html) return;
        if (old && old.__cgoOhHtml === res.html) return;   // 同一份图元，不必重建

        const box = old || document.createElement("span");
        box.className = DOT_ICON_CLASS + (res.className ? " " + res.className : "");
        box.__cgoOhHtml = res.html;
        box.innerHTML = res.html;
        if (res.width) box.style.width = res.width + "px";
        if (res.height) box.style.height = res.height + "px";
        if (!old) node.appendChild(box);
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

    /**
     * 站外换乘连线（同站不同台、只能出站换乘的那段时期，把「站台幽灵点」与主点连起来）。
     * ⚠️ 样式**照抄核心那套**（见 core/script.js 的 `renderVirtualConnectors` / `createSvgPath` /
     * `getConnectorPath`）：每条配对画三段叠起来 —— 底色描边 3.25 → `#78848b` 2.25 → 底色 0.85，
     * 实线、`fill:none`、圆头、不加 `vector-effect`（宽度随画布缩放，与旁边那些站外连通线一致）。
     * 同一张图上两种「站外连通」长得一样，才不会让人以为是两种不同的东西。
     *
     * 两端都在画布上才画，任一端消失就收掉 —— 幽灵点本身由时间轴决定出现 / 消失（见 build）。
     * 画在本模块自己的图层里：核心与城市数据都不必知道「这座站还分站台」这件事，
     * 也因此不能挂进 `data_virtual_transfers.js`（那是**当前线网**的站外连通，进去就会常驻底图）。
     */
    function syncOffStationLinks() {
        const group = layer()?.querySelector(".cgo-oh-offlink");
        if (!group) return;
        const pairs = state.offPairs || [];
        if (!pairs.length) { if (group.childNodes.length) group.replaceChildren(); return; }
        // 样式随「是否已开通站内换乘」切换：核心对两类连接给了两套画法，
        // 付费出站连通三层（底色 3.25 → #78848b 2.25 → 底色 0.85），
        // 免费换乘两层（底色 2.75 → #78848b 1.5）—— 见 core/script.js 的
        // VIRTUAL_CONNECT_LINES / VIRTUAL_FREE_CONNECT_LINES。
        // ⚠️ 切画法的阈值 = 开通站内换乘那个**动作**的步号（p[2]），不是日期 ——
        //    一条事件有多拍时按日期会在当天第一拍、对应动作还没开演就先改了。
        const idx = state.index == null ? -1 : state.index;
        const free = pairs.map((p) => p[2] != null && p[2] >= 0 && idx >= p[2]);
        const sig = free.join(",");
        if (group.__sig !== sig) {
            group.__sig = sig;
            const st = stationMap();
            group.replaceChildren();
            pairs.forEach((pair, k) => {
                const a = st[pair[0]], b = st[pair[1]];
                if (!a || !b) return;
                const STROKE = free[k]
                    ? [["var(--map-bg)", "2.75"], ["#78848b", "1.5"]]
                    : [["var(--map-bg)", "3.25"], ["#78848b", "2.25"], ["var(--map-bg)", "0.85"]];
                const g = document.createElementNS(NS, "g");
                STROKE.forEach((layerStyle) => {
                    const el = document.createElementNS(NS, "line");
                    el.setAttribute("x1", String(a.x)); el.setAttribute("y1", String(a.y));
                    el.setAttribute("x2", String(b.x)); el.setAttribute("y2", String(b.y));
                    el.setAttribute("stroke", layerStyle[0]);
                    el.setAttribute("stroke-width", layerStyle[1]);
                    el.setAttribute("fill", "none");
                    el.setAttribute("stroke-linecap", "round");
                    g.appendChild(el);
                });
                group.appendChild(g);
            });
        }
        pairs.forEach((pair, k) => {
            const g = group.childNodes[k];
            if (!g) return;
            g.style.display = (isOnCanvas(pair[0]) && isOnCanvas(pair[1])) ? "" : "none";
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
        const marks = [POP_CLASS, DOT_CLASS, ALWAYS_CLASS, NO_CLASS, NO_SHAPE_CLASS, GONE_CLASS];
        host?.querySelectorAll(marks.map((c) => "." + c).join(", "))
            .forEach((el) => el.classList.remove(...marks));
        host?.querySelectorAll("." + NO_ICON_CLASS + ", ." + DOT_ICON_CLASS).forEach((el) => el.remove());
        host?.querySelectorAll("#lines-layer .virtual-connectors ." + ON_CLASS)
            .forEach((el) => el.classList.remove(ON_CLASS));
        // 站外换乘虚线也一并撤掉（退出演示后底图上不该残留）
        layer()?.querySelector(".cgo-oh-offlink")?.replaceChildren();
        // ⚠️ 弹出进度现在是 CSS 变量写的（站点图元一半形态在 ::before 上，内联够不着），
        //    撤类名**不足以**把站藏回去 —— 变量不清掉，站就停在最后一次的透明度上。
        //    这正是「暂停后点已播完的事件：线藏了、站没藏」的根因。
        const vars = ["--cgo-oh-pop-alpha", "--cgo-oh-pop-scale", "--cgo-oh-pop-blur"];
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
        svg.innerHTML = '<g class="cgo-oh-done"></g><g class="cgo-oh-live"></g><g class="cgo-oh-offlink"></g>';
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
        state.segPieces = [];
        // ⚠️ 只清子节点不够：生长组的「当前画到第几步」记在 dataset.no、段节点引用在 __segs 上。
        //    留着它们，下一次 ensureGrowPath 会以为这一步的组还在，于是复用一组**已脱离文档**的
        //    path 节点 —— 描边偏移设在这些死节点上，那条线路整段不出现。
        //    （表现：导出中途取消后最后一条线消失；再导一次时第一条线消失。）
        const g = liveGroup();
        if (g) {
            delete g.dataset.no;
            g.__segs = null;
            g.__len = 0;
        }
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
        let top = 0;
        let vw = Math.max(120, hr.width - left);
        let vh = Math.max(120, hr.height - bottom);

        // 导出时用「安全区」代替可见区：视频是 16:9，且以**覆盖 + 居中裁剪**出画 —— 真正看得见的
        // 只是居中一块（放大系数 k = max(cw/hostW, ch/hostH)，可见宽 = cw/k、可见高 = ch/k）。
        // 取景按这块算，才不会出现「页面里装得下、导出视频里上下（或左右）被裁掉」的溢出。
        // 图例与贴底浮层在视频里根本不存在，故这里也不扣它们的留白，直接居中。
        if (state.exporting) {
            const k = Math.max(EXPORT.width / hr.width, EXPORT.height / hr.height);
            const sw = Math.max(120, EXPORT.width / k), sh = Math.max(120, EXPORT.height / k);
            vw = Math.min(vw, sw);
            vh = Math.min(vh, sh);
            left = hr.width / 2 - vw / 2;
            top = hr.height / 2 - vh / 2;
            // 进度卡是**画在导出画面里**的固定浮层，构图必须给它让位：卡在哪一侧，就把那一侧的一个
            // 卡宽从有效取景里扣掉 —— 取景中心随之偏到另一侧，卡面便只压在留白上，不会压住站名。
            // ⚠️ 让位必须做在**取景**这一层（camForPoint / camForBox 都读这里）。早先在画帧时把画面
            //    整体平移，等于把算好的构图推出画外，右侧站名就被裁了（收笔取景与全览都中招）。
            // 卡宽是输出像素，除以 k 换回视口像素。
            const pos = state.cardPos;
            if (pos && pos !== "off" && state.cardReserve !== false) {
                const gap = Math.max(0, CARD.w / k + 4);
                vw = Math.max(120, vw - gap);
                left += (pos === "tr" || pos === "br") ? 0 : gap;
            }
            // 角落水印（署名）同样是每帧都画的常驻浮层，底部给它留一条：内容整体上移一点，
            // 免得站名压在水印上（46px 是水印那一行在输出里的高度，图标 30px + 文字余量）。
            vh = Math.max(120, vh - Math.max(0, 46 / k));
        }
        return { left: left, top: top, vw: vw, vh: vh };
    }

    /* 取景的「算」在 camForPoint / camForBox（见时间轴一节）；这里不再有「落位」的取景函数
       —— 落位统一由 applyFrame 每帧调 setMapView 完成。 */

    /* ======================================================================
     * 站名更名
     * ==================================================================== */

    const cnSpanOf = (sid) => document.querySelector(`#label_${esc(sid)} .stacn`);
    const enSpanOf = (sid) => document.querySelector(`#label_${esc(sid)} .staen`);
    /**
     * 标签上的**第三语言行**。核心只画中文（`.stacn`）与英文（`.staen`），其它语言行由
     * 城市模块注入（呼和浩特的蒙文站名行即由 modules/hohhot_mongolian.js 插入，带 BCP-47
     * 的 `lang="mn-Mong"`）。更名时它必须跟着换 —— 否则中文换了、蒙文还停在新名上。
     * 这里按标准语言标签匹配，不认城市名与类名；日后别的城市要用，同样给行加 lang 即可。
     */
    const MN_LANG = "mn-Mong";
    const altSpanOf = (sid) => document.querySelector(`#label_${esc(sid)} [lang="${MN_LANG}"]`);

    /**
     * 把标签切到**某个历史名**（中 / 英 / 蒙文行一起换）。
     * `want` = { cn, en, mn }：此刻该显示的名字，由 `syncRenameNames` 按更名链算好 ——
     * 一站可能改名不止一次（A → B → C），所以这里不自己查表、也不看日期：
     * 同一天可能有好几件事（大连 2017-06-07 就有三段开通 + 一处更名），用日期比会误判。
     */
    function applyNameAt(sid, want) {
        if (!want) return;
        const cn = cnSpanOf(sid);
        const en = enSpanOf(sid);
        const alt = altSpanOf(sid);
        if (!cn && !en && !alt) return;
        if (!state.renamed.has(sid)) {
            state.renamed.set(sid, {
                cn: cn ? cn.textContent : null,
                en: en ? en.textContent : null,
                alt: alt ? alt.textContent : null
            });
        }
        if (cn && want.cn && cn.textContent !== want.cn) cn.textContent = want.cn;
        if (en && want.en && en.textContent !== want.en) en.textContent = want.en;
        if (alt && want.mn && alt.textContent !== want.mn) alt.textContent = want.mn;
    }

    /* 更名的换字动画不在这里 —— 它由时间轴上的 `applyRenameAt` 按 t 逐帧演 */

    function restoreNames() {
        state.renamed.forEach((rec, sid) => {
            const cn = cnSpanOf(sid);
            if (cn && rec.cn != null) cn.textContent = rec.cn;
            const en = enSpanOf(sid);
            if (en && rec.en != null) en.textContent = rec.en;
            const alt = altSpanOf(sid);
            if (alt && rec.alt != null) alt.textContent = rec.alt;
        });
        state.renamed.clear();
        // 换字动画留下的透明度也要撤掉，否则退出后名字会是半透明的
        document.querySelectorAll("#labels-layer .stacn, #labels-layer .staen, #labels-layer [lang]")
            .forEach((el) => el.style.removeProperty("opacity"));
    }

    /** 直接落成新名（跳转用：跳转不是「演」，不播换字动画） */
    function applyNewName(sid, name, enName, mnName) {
        const cn = cnSpanOf(sid);
        if (cn && cn.textContent !== name) cn.textContent = name;
        const en = enSpanOf(sid);
        if (en && enName && en.textContent !== enName) en.textContent = enName;
        const alt = altSpanOf(sid);
        if (alt && mnName && alt.textContent !== mnName) alt.textContent = mnName;
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
        return { scale: s, x: box.left + box.vw / 2 - pt.x * s, y: (box.top || 0) + box.vh / 2 - pt.y * s };
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
        (step.pts && step.pts.length > 1
            ? pointAtMulti(step.segs || [{ pts: step.pts, len: step.lengthPx }], step.lengthPx * p)
            : step.focus);

    /**
     * 把站名标签的**实际占地**并入包围盒 —— 与共享层路线规划的自动取景同一口径
     * （见 route-panel.js 的 routeBounds）：只按站点坐标取景时，边上的站名会被裁掉，
     * 而标签往往比站点本身大得多（长站名 + 英文行会伸出去很远）。
     *
     * 收两类站名：① 调用方指定的（本步涉及的）；② **落在包围盒附近**的其它已渲染站名 ——
     * 后者才是关键：取景框边上常常压着**前几步就已开通**的站名（它们不在本步的站列表里），
     * 不收进来就会被裁。远处的未开通规划站（大连 13 号线二期、4 号线那些）离得远，
     * 不在这个带里，自然不参与，全览也就不会被它们拉小。
     * 标签是**已渲染**的盒子，故按当前地图视图反解回画布坐标（口径同 buildLabelCache：
     * 地图缩放在 #map-content 的 transform 上，它自己的 rect 已吃掉平移与原点，故只除以 scale）。
     */
    function expandBoxByLabels(box, sids) {
        const host = stageHost();
        const mc = document.getElementById("map-content");
        if (!box || !host || !mc) return box;
        const view = window.getMapView ? window.getMapView() : { scale: 1, x: 0, y: 0 };
        if (!(view.scale > 0)) return box;
        const mr = mc.getBoundingClientRect();
        const picked = sids || [];
        // 先按**原始**包围盒定出「附近」的范围：站名一般从站点向外伸出一两百像素
        const BAND = 220;
        const band = {
            minX: box.minX - BAND, minY: box.minY - BAND,
            maxX: box.maxX + BAND, maxY: box.maxY + BAND
        };
        const st = stationMap();
        const grow = (r) => {
            if (r.width < 0.5 || r.height < 0.5) return;
            box.minX = Math.min(box.minX, (r.left - mr.left) / view.scale);
            box.minY = Math.min(box.minY, (r.top - mr.top) / view.scale);
            box.maxX = Math.max(box.maxX, (r.right - mr.left) / view.scale);
            box.maxY = Math.max(box.maxY, (r.bottom - mr.top) / view.scale);
        };
        host.querySelectorAll("#labels-layer .label-group").forEach((g) => {
            const sid = g.dataset.sid || "";
            if (!sid) return;
            if (picked.indexOf(sid) < 0) {
                const s = st[sid];
                if (!s || !Number.isFinite(s.x) || !Number.isFinite(s.y)) return;
                // 只收站点落在包围盒附近那一带的：远处的未开通规划站不参与
                if (s.x < band.minX || s.x > band.maxX || s.y < band.minY || s.y > band.maxY) return;
            }
            g.querySelectorAll(".stacn, .staen").forEach((sp) => {
                const cs = getComputedStyle(sp);
                if (cs.display === "none" || cs.visibility === "hidden") return;
                grow(sp.getBoundingClientRect());
            });
        });
        return box;
    }

    /** 收笔取景：缩到能看该段全貌（长段自动缩小、短段不超过特写倍数），并把该段站名一起框进来。
     *  留边与「收尾全览」同一档（0.94）—— 早先给到 0.72 的宽松留边，加上站名一起入盒后
     *  显得比全览还小，两处策略就分裂了。 */
    const camTailOf = (step) => {
        // 没有走向的多站事件：收笔取景按这几座站的**整体范围**（含站名占地）——
        // 否则会回跳到 step.focus（第一站），刚平移过去的镜头又弹回来。
        if (!(step.pts && step.pts.length > 1)) {
            if (step.stations && step.stations.length > 1) {
                return camForBox(
                    expandBoxByLabels(bboxOf(step.stations), step.stations.map((x) => x.sid)),
                    0.94, state.zoom);
            }
            return camForPoint(step.focus, state.zoom);
        }
        const box = expandBoxByLabels(bboxOf(step.pts), step.stations.map((x) => x.sid));
        return camForBox(box, 0.94, state.zoom);
    };

    /** 收尾取景：缩到全图（按已出现在画布上的车站取范围，未开通的散点与国铁散点不参与），含站名占地 */
    function camWholeOf(to) {
        const seen = [];
        for (let i = 0; i <= to; i++) {
            state.steps[i].stations.forEach((x) => {
                // 国铁散点（rdot）按规则也要按时间入场，但它们分布在整个市域、远离城市轨道交通
                // 线网（长春西站在最西，龙嘉站、九台南站在最东）。让它们参与全览，会把好好一张
                // 线网压得很小，故全览只按轨道交通车站取范围 —— 与站数统计剔除它们同一口径。
                if (state.railStations.has(x.sid)) return;
                if (state.demoOnly.has(x.sid)) return;   // 站外换乘幽灵点与主点几乎同位，不进全览取景
                seen.push(x);
            });
        }
        const st = stationMap();
        const ids = seen.length
            ? seen.map((x) => x.sid)
            : Object.keys(st).filter((k) => st[k] && Number.isFinite(st[k].x) && !state.railStations.has(k));
        if (!ids.length) return null;
        const list = seen.length ? seen : ids.map((k) => st[k]);
        const box = expandBoxByLabels(bboxOf(list), ids);
        return camForBox(box, 0.94, ZOOM.max);
    }

    /* ---- 生长阶段（多段事件：逐段绘制 + 段间运镜）---- */

    /**
     * 把一步的生长拆成阶段表。单段步骤就是「一个 draw 阶段」，与改造前等价；
     * 多段步骤（`step.segs` 多于一段）在每段之间插一个 `glide` 阶段：
     * 笔停在下一段起点不动，只有镜头从上一段**收笔点**平移到下一段**起笔点**，
     * 移到位再继续画 —— 否则笔尖会瞬移，观感像是一段线凭空跳出来。
     *
     * 各阶段都是 [t0, t1] 时间区间 + [p0, p1] 整步进度（0~1，笔尖按整步已画长度算）：
     *   kind: "draw"  —— 画第 k 段，进度 p0 → p1
     *   kind: "glide" —— 不画（p 停住），镜头从第 k-1 段收笔点移到第 k 段起笔点
     */
    function growthPhases(step, drawTotal) {
        const segs = (step.segs && step.segs.length) ? step.segs : null;
        const total = step.lengthPx || 0;
        if (!segs || segs.length < 2 || !(total > 0)) {
            return [{ kind: "draw", k: 0, t0: 0, t1: drawTotal, p0: 0, p1: 1 }];
        }
        const glide = glideMs();
        const out = [];
        let tt = 0;
        segs.forEach((sg, k) => {
            const p0 = sg.base / total, p1 = (sg.base + sg.len) / total;
            // 两段本来就首尾相接（同一笔的两截，如环线跨接缝拆出来的）时不必运镜
            const prev = k > 0 ? segs[k - 1] : null;
            const gap = prev ? dist(pointAt(prev.pts, prev.len), pointAt(sg.pts, 0)) : 0;
            if (k > 0 && glide > 0 && gap > 1) {
                out.push({ kind: "glide", k: k, t0: tt, t1: tt + glide, p0: p0, p1: p0 });
                tt += glide;
            }
            const dur = drawTotal * (sg.len / total);
            out.push({ kind: "draw", k: k, t0: tt, t1: tt + dur, p0: p0, p1: p1 });
            tt += dur;
        });
        return out;
    }

    /** dt（自生长开始起的毫秒）落在哪个阶段 */
    function phaseAtDt(phases, dt) {
        for (let k = 0; k < phases.length; k++) {
            if (dt < phases[k].t1 || k === phases.length - 1) return phases[k];
        }
        return phases[phases.length - 1];
    }

    /** dt 时刻的整步进度（0~1）：draw 阶段线性推进，glide 阶段停在原地 */
    function progAtDt(phases, dt) {
        const ph = phaseAtDt(phases, dt);
        if (ph.kind !== "draw") return ph.p1;
        const span = ph.t1 - ph.t0;
        const e = span > 0 ? Math.max(0, Math.min(1, (dt - ph.t0) / span)) : 1;
        return ph.p0 + (ph.p1 - ph.p0) * e;
    }

    /** 反解：整步进度 p 对应哪个 dt —— 站点「笔到人到」的弹出时刻要用它 */
    function timeOfProg(phases, p) {
        const draws = phases.filter((x) => x.kind === "draw");
        for (let k = 0; k < draws.length; k++) {
            const ph = draws[k];
            if (p <= ph.p1 + 1e-9 || k === draws.length - 1) {
                const span = ph.p1 - ph.p0;
                const e = span > 0 ? Math.max(0, Math.min(1, (p - ph.p0) / span)) : 1;
                return ph.t0 + (ph.t1 - ph.t0) * e;
            }
        }
        return 0;
    }

    /* ---- 时间线 ---- */

    /**
     * 无走向步骤的**巡览站点**：动作对象归一成「站」——站点弹出/形态转换（step.stations）
     * 与更名换字（step.renames）按 `grp`（缺省 sid）并站。一批动作于是**逐站**演：
     * 镜头在每站停一下，本站的弹出 / 形态转换 / 换字都在停留窗开头，再平移去下一站。
     * 站台级幽灵点的移出与主点合并是同一站区的事，幽灵点段给两条记录写了同一个 grp，
     * 于是在同一站同一拍演完，镜头不必在同一点上多停一回。
     */
    function stepStops(step) {
        const stops = [], at = new Map();
        const add = (key, x, y) => {
            if (!Number.isFinite(x) || !Number.isFinite(y) || !key) return -1;
            if (at.has(key)) return at.get(key);
            at.set(key, stops.length);
            stops.push({ x: x, y: y, pops: [], renames: [] });
            return stops.length - 1;
        };
        (step.stations || []).forEach((x) => {
            const k = add(x.grp || x.sid, x.x, x.y);
            if (k >= 0) stops[k].pops.push(x);
        });
        (step.renames || []).forEach((rn) => {
            const s = stationMap()[rn.sid];
            if (!s || !Number.isFinite(s.x)) return;
            const k = add(rn.sid, s.x, s.y);
            if (k >= 0) stops[k].renames.push(rn);
        });
        return stops;
    }

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
            // ⚠️ 只有「有走向」的步骤才生长：单站开通（`station-state/open`）与纯更名步骤没有 pts，
            //    生长时长必须为 0，否则会被 growDuration 的最小值撑出一段空生长，
            //    还会让 ensureGrowPath 拿到 null 的折线点（实测就是这么崩的）。
            const hasPath = !!(step.pts && step.pts.length > 1);
            // 多段步骤：绘制时长按总长算（笔速与单段一致），段间再插运镜，故生长总时长更长
            const phases = hasPath ? growthPhases(step, growDuration(step)) : [];
            // 没有走向的**多站**事件（一次恢复几座站、一批站台投用、批量改名）：逐站
            // 「停留 → 平移」巡览 —— 镜头在每站停 STOP_HOLD（本站的动作在停留窗开头演），
            // 再直接平移到下一站，而不是连续匀速扫过、更不是整步定格在第一站上。
            const stops = hasPath ? [] : stepStops(step);
            const multi = stops.length > 1;
            const hop = STOP_HOLD + glideMs();
            const panDur = multi ? stops.length * STOP_HOLD + (stops.length - 1) * glideMs() : 0;
            const growDur = phases.length ? phases[phases.length - 1].t1 : panDur;
            // 段形态转换（实线⇄镂空⇄空白）占满本拍的生长窗逐帧补间，与站巡览并行；
            // 纯转换拍没有站可巡（growDur 为 0）时给一个最小窗，免得瞬变没得看。
            const convAnims = (step.segConv && step.segConv.length)
                ? step.segConv.map((c) => ({ s0: c.s0, s1: c.s1, style: c.style })) : null;   // 拷贝：touched 挂在副本上，不污染 step
            const growDur2 = (convAnims && growDur < CONV_MIN) ? CONV_MIN : growDur;
            // 多站更名的换字逐站落在各停留窗里（500ms < STOP_HOLD），拍尾不再单开换字段；
            // 单对更名保持原节奏：生长后 500ms 淡出换字。
            const renameMs = (step.rename && !multi) ? 500 : 0;
            const rec = {
                i: i, step: step,
                from: t,
                headEnd: t + head,
                growT0: t + head,
                growEnd: t + head + growDur2,
                renameEnd: t + head + growDur2 + renameMs,
                tailEnd: t + head + growDur2 + renameMs + head,
                end: t + head + growDur2 + renameMs + head + hold,
                growDur: growDur2,
                phases: phases,
                stops: multi ? stops : null,
                hop: hop,
                convAnims: convAnims,
                convDur: growDur2,
                // ⚠️ 纯形态转换 / 多站巡览的步骤没有 phases（growDur 可能仍 > 0），
                //    progAtDt 对空表会取到 undefined 的阶段直接抛错（面板滚数即中招），
                //    故回落成「按拍内时间线性推进」。
                progAt: (dt) => (phases.length ? progAtDt(phases, dt)
                    : (growDur2 > 0 ? Math.max(0, Math.min(1, dt / growDur2)) : 1)),
                camFrom: prevCam,
                camHead: camForPoint(brushAt(step, 0), state.zoom),
                camGrowEnd: camForPoint(multi ? stops[stops.length - 1] : brushAt(step, 1), state.zoom),
                camTail: camTailOf(step)
            };
            // 站点弹出时刻：有画笔推进的「笔到人到」（末尾留 30ms，别让最后一个站压着收笔）；
            // 无走向的多站步骤按「停留 → 平移」逐站弹出（idx × hop），单站步骤就在本拍起点弹出。
            rec.pops = [];
            if (phases.length) {
                rec.pops = step.stations
                    .map((x) => ({
                        x: x, step: step,
                        t: rec.growT0 + Math.max(0, Math.min(growDur2 - 30, timeOfProg(phases, x.t)))
                    }))
                    .sort((a, b) => a.t - b.t);
            } else {
                stops.forEach((st2, idx) => {
                    const at = multi ? idx * hop : 0;
                    st2.pops.forEach((x) => rec.pops.push({ x: x, step: step, t: rec.growT0 + at }));
                });
                rec.pops.sort((a, b) => a.t - b.t);
            }
            // 更名换字逐站挂到各停留窗开头（多站）/ 本拍开头（单对），由 applyRenameAt 逐帧演
            rec.renameStops = [];
            stops.forEach((st2, idx) => {
                const at = multi ? idx * hop : 0;
                st2.renames.forEach((rn) => rec.renameStops.push({ rn: rn, t0: rec.growT0 + at }));
            });
            list.push(rec);
            prevCam = rec.camTail;
            t = rec.end;
        }
        // 收尾全览那一拍：卡此时已淡出（cardAlphaAt 到 0），取景就不必再给卡让位，
        // 否则整幅全图会被无谓地推向一侧（用户实测后提出的）。
        state.cardReserve = false;
        const whole = {
            whole: true, i: to, step: state.steps[to],
            from: t, headEnd: t + head, growT0: t + head, growEnd: t + head,
            renameEnd: t + head, tailEnd: t + head + head, end: t + head + head + T.tailHold,
            growDur: 0, phases: [], progAt: () => 1, camFrom: prevCam, camHead: camWholeOf(to), pops: []
        };
        whole.camGrowEnd = whole.camHead;
        whole.camTail = whole.camHead;
        state.cardReserve = true;
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
        if (t < r.growEnd) {
            const dt = t - r.growT0;
            // 多站巡览：停留窗定格在本站，窗尾直接平移到下一站（「停一下 → 平移」）
            if (r.stops && r.stops.length > 1) {
                const move = glideMs();
                const hop2 = r.hop || (STOP_HOLD + move);
                const k = Math.min(r.stops.length - 1, Math.floor(dt / hop2));
                const off = dt - k * hop2;
                const here = camForPoint(r.stops[k], state.zoom);
                if (off < STOP_HOLD || k >= r.stops.length - 1 || !(move > 0)) return here || r.camHead;
                const next = camForPoint(r.stops[k + 1], state.zoom);
                return camLerp(here, next, EASE((off - STOP_HOLD) / move)) || here || r.camHead;
            }
            const ph = (r.phases && r.phases.length) ? phaseAtDt(r.phases, dt) : null;
            // 段间运镜：笔停着不动，镜头从上一段收笔点平移到下一段起笔点
            if (ph && ph.kind === "glide" && r.step.segs && r.step.segs.length > 1) {
                const a = r.step.segs[ph.k - 1], b = r.step.segs[ph.k];
                const pa = pointAt(a.pts, a.len), pb = pointAt(b.pts, 0);
                const span = ph.t1 - ph.t0;
                const e = span > 0 ? EASE((dt - ph.t0) / span) : 1;
                return camLerp(camForPoint(pa, state.zoom), camForPoint(pb, state.zoom), e) || r.camHead;
            }
            return camForPoint(brushAt(r.step, r.progAt(dt)), state.zoom) || r.camHead;
        }
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

    /**
     * 拆除（永久闭站）：图元、站名与呼出线一并隐去，并从「已出现在画布上」的名册里除名 ——
     * 于是引线重建补状态时不会再补回来，站外连通连线也会跟着收掉。
     * 与「闭站」不同：闭站只是把图元换成未开通圈（将来还会恢复），拆除则直接从图上消失。
     * 重放 / 回拖时由 clearMarks 摘掉 GONE_CLASS，站又会回来（与其它形态同一套还原机制）。
     */
    function leaveStation(sid) {
        state.shown.delete(sid);
        state.dotColors.delete(sid);
        ["node_", "label_"].forEach((prefix) => {
            document.getElementById(prefix + sid)?.classList.add(GONE_CLASS);
        });
        calloutOf(sid)?.classList.add(GONE_CLASS);
        syncVirtualConnectors();
    }

    /** 车站到点了：切形态、弹出、涟漪（`mode: "leave"` 的则是拆除，见 leaveStation） */
    function showStation(x, step) {
        if (x.mode === "leave") { leaveStation(x.sid); return; }
        state.shown.set(x.sid, x.form);
        if (x.dotColor) state.dotColors.set(x.sid, x.dotColor);
        applyForm(x, step.color);
        // 旧名不在这里切 —— 统一交给每帧的 syncRenameNames（按步号判，同日多事件也不会错）
        popStation(x.sid);
        state.activePops.push({ sid: x.sid, t0: state.frameT });
        // 未开通形态的涟漪用「未开通色」，别拿线路色误导人
        ripple(x, x.form === "no" ? (themeVar("--not-open-color") || step.color) : step.color);
        syncVirtualConnectors();   // 站到齐了，站外连通那条虚线可以画了
    }

    /**
     * 生长中的那一段：描边偏移由 t 直接算（原先是 WAAPI fill:forwards）。
     * 一条步可能有**多段**（环线同一天开通的多段弧、或一次补全的多处），故建一组 path，
     * 进度按「整步已画长度」分配到各段 —— 段与段首尾相接时看上去就是连续的一笔。
     */
    function ensureGrowPath(step) {
        // ⚠️ step.segs 是权威：空数组就是「这一步不画」（纯形态转换步），不能回退去画 step.pts
        const segs = Array.isArray(step.segs)
            ? (step.segs.length ? step.segs : null)
            : (step.pts && step.pts.length > 1 ? [{ pts: step.pts, len: step.lengthPx }] : null);
        if (!segs) return null;   // 无走向的步骤没有可画的折线
        const group = liveGroup();
        if (!group) return null;
        // 复用前先自检：段节点还挂在文档上才算数（clearCanvas 清了子节点、dataset.no 也可能留着）
        const stale = !(group.__segs && group.__segs.length)
            || !group.__segs.every((m) => m.node && m.node.isConnected);
        if (group.dataset.no !== String(step.no) || stale) {
            group.dataset.no = String(step.no);
            let acc = 0;
            const made = [];
            segs.forEach((sg) => {
                if (!sg.pts || sg.pts.length < 2) return;
                const node = document.createElementNS(NS, "path");
                node.setAttribute("class", "cgo-oh-grow");
                node.setAttribute("d", toD(sg.pts));
                node.setAttribute("stroke", step.color);
                node.setAttribute("stroke-width", "5.4");   // 与核心 .line-visual-inner 同宽
                node.setAttribute("vector-effect", "non-scaling-stroke");
                let len = sg.len;
                try { len = node.getTotalLength() || len; } catch (e) { /* 用折线长度 */ }
                node.style.strokeDasharray = `${len} ${len}`;
                node.style.strokeDashoffset = String(len);
                made.push({ node: node, len: len, start: acc });
                acc += len;
            });
            if (!made.length) return null;
            group.replaceChildren(...made.map((m) => m.node));
            group.__segs = made;
            group.__len = acc;
        }
        return (group.__segs && group.__segs.length) ? group : null;
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
            const g = ensureGrowPath(rec.step);
            if (g) {
                const p = rec.progAt(t - rec.growT0);   // 逐段绘制 + 段间运镜，由阶段表反算
                const drawn = g.__len * p;   // 整步已画长度 → 按段分摊成各自的描边偏移
                g.__segs.forEach((m) => {
                    m.node.style.strokeDashoffset = String(m.len - Math.max(0, Math.min(m.len, drawn - m.start)));
                });
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

        // ── 站外换乘虚线：两端都在画布上才画 ──
        syncOffStationLinks();

        // ── 更名：**开通后改名的站，从入场那一刻起就用旧名**（回退拖动 / 跳步 /
        //    核心重建过标签节点都要能还原），当前正在演换字的那个站交给 applyRenameAt ──
        syncRenameNames(rec);

        // ── 段形态转换：按帧补间（实线⇄镂空⇄空白，自收笔端撤回 / 自起笔端长回）──
        tl.list.forEach((r) => { if (r.convAnims && r.convAnims.length) applyConvs(r, t); });

        // ── 更名：各站的停留窗里逐站淡出换字 ──
        tl.list.forEach((r) => { if (r.renameStops && r.renameStops.length) applyRenameAt(r, t); });

        // ── 面板 ──
        applyPanel(t, rec);
    }

    /**
     * 把「更名」与时间线对齐：**更名事件还没播到**的站显示该阶段的历史名，播过之后显示新名。
     * 判据是「更名事件排在第几步」（renameMap 里存了步号），**不是日期** —— 同一天可能既有
     * 区段开通又有更名（大连 2017-06-07），按日期比会让当天头几个事件就先跳到新名，
     * 到更名那一步又从新名切回旧名再切新名，看着像来回改名。
     * 一站可以有**多次**更名（如长春 前进西 → 前进 → 前进西）：取「最后一条已播完的更名的 to」，
     * 一条都还没播过就用**首条更名的 from**（也就是入场时该用的那个旧名）。
     * 光靠入场时切一次也不够 —— 拖动回退、跳步、核心重建过标签节点都要能还原。
     */
    function syncRenameNames(rec) {
        if (!state.renameMap || !state.renameMap.size) return;
        state.renameMap.forEach((list, sid) => {
            if (!isOnCanvas(sid)) return;
            for (let k = 0; k < list.length; k++) if (list[k].i === rec.i) return;   // 正在演换字，别抢
            let done = null;
            for (let k = 0; k < list.length; k++) if (list[k].i < rec.i) done = list[k];
            if (done) applyNameAt(sid, { cn: done.to, en: done.toEn, mn: done.toMn });
            else applyNameAt(sid, { cn: list[0].from, en: list[0].fromEn, mn: list[0].fromMn });
        });
    }

    /** 更名的换字动画：0~180ms 淡出旧名 → 换字 → 180~500ms 淡入新名（各站按自己的停留窗逐站换） */
    function applyRenameAt(rec, t) {
        // 一步可以带**多站**更名（`step.renames`）：逐站挂在各自的停留窗上（rec.renameStops），
        // 镜头走到哪站就换哪站的字，不再整批同拍换完。
        const list = rec.renameStops || [];
        list.forEach((item) => {
            const rn = item.rn;
            const p = (t - item.t0) / 500;
            const cn = cnSpanOf(rn.sid), en = enSpanOf(rn.sid), alt = altSpanOf(rn.sid);
            // 没到换字时刻（含回拖到更名前）就把 inline opacity 清掉：它是换字动画的临时值，
            // 留着会让站名一直半透明（导出中途取消、拖着进度条来回走都会踩到）。
            if (p < 0) {
                [cn, en, alt].forEach((el) => { if (el && el.style.opacity) el.style.opacity = ""; });
                return;
            }
            // ⚠️ 只在**真的不一样**时写：本函数每帧都会被调到，无条件写 textContent 会让
            //    依赖「文本变更」的观察者（如呼和浩特蒙文行的 compress 重量）每帧重排。
            const put = (name, enName, mnName) => {
                if (cn && cn.textContent !== name) cn.textContent = name;
                if (en && enName && en.textContent !== enName) en.textContent = enName;
                if (alt && mnName && alt.textContent !== mnName) alt.textContent = mnName;
            };
            let alpha = 1;
            if (p < 0.36) { put(rn.from, rn.fromEn, rn.fromMn); alpha = 1 - EASE_OUT(p / 0.36); }
            else { put(rn.to, rn.toEn, rn.toMn); alpha = EASE_OUT(Math.min(1, (p - 0.36) / 0.64)); }
            if (p >= 1) {
                // 换字演完：清掉临时的 inline opacity，别让站名留在半透明上
                [cn, en, alt].forEach((el) => { if (el && el.style.opacity) el.style.opacity = ""; });
                state.renamed.delete(rn.sid);
                return;
            }
            [cn, en, alt].forEach((el) => { if (el) el.style.opacity = String(alpha); });
        });
    }

    /**
     * 未开通镂空的盖面：彩色 5.4 之上盖一条 `--map-bg` 3.4，露出两条细边 —— 与核心
     * `renderNotOpenLines`（NOT_OPEN_LINES）同款画法，观感与底图在建虚线一致。
     */
    function makeHollowMask(pts) {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", toD(pts));
        p.setAttribute("stroke", "var(--map-bg)");
        p.setAttribute("stroke-width", "3.4");
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("stroke-linejoin", "round");
        p.setAttribute("vector-effect", "non-scaling-stroke");
        return p;
    }

    /** 造一段「已画段落」的节点组（彩色实线，hollow 另带盖面），返回注册表条目 */
    function makeSegPiece(lineId, s0, s1, pts, style, color, proto) {
        const base = document.createElementNS(NS, "path");
        base.setAttribute("d", toD(pts));
        base.setAttribute("stroke", color);
        base.setAttribute("stroke-width", "5.4");
        base.setAttribute("fill", "none");
        base.setAttribute("vector-effect", "non-scaling-stroke");
        if (proto) {   // 拆分而来：沿用原段的 data-no / data-line 标记
            ["data-no", "data-line"].forEach((a) => {
                const v = proto.getAttribute(a);
                if (v !== null) base.setAttribute(a, v);
            });
        }
        const nodes = [base];
        if (style === "hollow") nodes.push(makeHollowMask(pts));
        return { lineId: lineId, s0: s0, s1: s1, pts: pts, style: style, color: color, nodes: nodes };
    }

    /**
     * 单段样式**落定**：solid 摘盖面 / hollow 加盖面 / hidden 整段隐去（空白 = 从未画过，
     * 再开通由生长重新画）。转换动画播完由这里收口，顺手把补间的 dash 影子清干净。
     * ⚠️ hidden 用 display 隐去而不是摘节点 —— 回拖进度条要能还原（随机访问幂等）。
     */
    function applyPieceStyle(pc, style) {
        pc.nodes.forEach((n) => {
            n.style.removeProperty("stroke-dasharray");
            n.style.removeProperty("stroke-dashoffset");
            n.style.removeProperty("display");
        });
        if (style === "hollow") {
            if (!pc.nodes[1]) {
                const mask = makeHollowMask(pc.pts);
                pc.nodes[0].after(mask);
                pc.nodes.push(mask);
            }
            pc.style = "hollow";
        } else if (style === "solid") {
            if (pc.nodes[1]) { pc.nodes[1].remove(); pc.nodes.pop(); }
            pc.style = "solid";
        } else {
            pc.nodes.forEach((n) => { n.style.display = "none"; });
            pc.style = "hidden";
        }
    }

    /** 段的弧长（画布像素）：转换补间的 dash 长度 */
    function pieceLen(pc) {
        if (Number.isFinite(pc.len) && pc.len > 0) return pc.len;
        let l = 0;
        try { l = pc.nodes[0].getTotalLength(); } catch (e) { l = 0; }
        pc.len = l > 0 ? l : (segLength(pc.pts) || 1);
        return pc.len;
    }

    /**
     * 单段样式转换的**逐帧进度**（e: 0 原样式 from → 1 目标样式 to）——与生长同一套
     * stroke-dash 补间（导出逐帧出图要求 applyFrame(t) 幂等可随机访问，不能用 WAAPI /
     * CSS 动画）：
     *   solid → hollow  彩色不动，盖面从**收笔端**长出 —— 观感即「实线自尾端起逐渐变镂空」；
     *   hollow → solid  盖面从**起笔端**退去 —— 实线自头端长出，与生长同向；
     *   *    → hidden  整段自**收笔端**反向擦除 —— 语义「撤回」，与生长对偶。
     * e ≥ 1 落定 to；e ≤ 0 落定回 from（回拖进度条也能还原）。同一 t 写多少次都一样。
     */
    function applyPieceProgress(pc, from, to, e) {
        const p = Math.max(0, Math.min(1, e));
        const L = pieceLen(pc);
        const dash = (node, off) => {
            node.style.strokeDasharray = `${L} ${L}`;
            node.style.strokeDashoffset = String(off);
        };
        const clear = (node) => {
            node.style.removeProperty("stroke-dasharray");
            node.style.removeProperty("stroke-dashoffset");
        };
        if (p >= 1) { applyPieceStyle(pc, to); return; }
        if (p <= 0) { applyPieceStyle(pc, from); return; }
        if (from === "solid" && to === "hollow") {
            let mask = pc.nodes[1];
            if (!mask) { mask = makeHollowMask(pc.pts); pc.nodes[0].after(mask); pc.nodes.push(mask); }
            clear(pc.nodes[0]);
            dash(mask, -L * (1 - p));   // 盖面自收笔端长出
        } else if (from === "hollow" && to === "solid") {
            clear(pc.nodes[0]);
            if (pc.nodes[1]) dash(pc.nodes[1], L * p);   // 盖面自起笔端退去
        } else {
            // → hidden（以及其它收缩）：整段自收笔端反向擦除
            dash(pc.nodes[0], L * p);
            if (pc.nodes[1]) dash(pc.nodes[1], L * p);
        }
        // 中间态一律按「原样式」记账（落定才改），第二次转换才认得出从哪儿转到哪儿
        pc.style = from;
    }

    /**
     * 段形态转换的**结构拆分**：把已画区间 [s0, s1] 从注册表里切出来（左右保原样式，
     * 拆分与生长切片同源 slicePath，几何零误差），返回被切中的段落 [{ pc, from, to }]。
     * 只动结构、**不动样式** —— 补间交给 applyPieceProgress 按帧写、它自己收口落定，
     * 于是「实线→镂空/空白」能演成反向擦除，回拖进度条也能还原。
     */
    function convertRange(lineId, s0, s1, style) {
        const list = state.segPieces;
        const touched = [];
        for (let k = list.length - 1; k >= 0; k--) {
            const pc = list[k];
            if (pc.lineId !== lineId || pc.style === "hidden") continue;
            if (pc.s1 <= s0 + 0.05 || pc.s0 >= s1 - 0.05) continue;   // 不相交
            const a = Math.max(pc.s0, s0), b = Math.min(pc.s1, s1);
            const whole = a <= pc.s0 + 0.05 && b >= pc.s1 - 0.05;
            if (whole) {
                touched.push({ pc: pc, from: pc.style, to: style });
                continue;
            }
            const proto = pc.nodes[0];
            const cut = (x0, x1) => makeSegPiece(lineId, x0, x1,
                slicePath(pc.pts, x0 - pc.s0, x1 - pc.s0), pc.style, pc.color, proto);
            const made = [];
            if (a > pc.s0 + 0.05) made.push(cut(pc.s0, a));
            const mid = makeSegPiece(lineId, a, b, slicePath(pc.pts, a - pc.s0, b - pc.s0), pc.style, pc.color, proto);
            touched.push({ pc: mid, from: pc.style, to: style });
            made.push(mid);
            if (b < pc.s1 - 0.05) made.push(cut(b, pc.s1));
            // 换节点时保持原图层位置（跨线遮挡关系不乱）
            const frag = document.createDocumentFragment();
            made.forEach((mp) => mp.nodes.forEach((n) => frag.appendChild(n)));
            proto.parentNode.insertBefore(frag, proto);
            pc.nodes.forEach((n) => n.remove());
            list.splice(k, 1, ...made);
        }
        return touched;
    }

    /**
     * 段形态转换的逐帧驱动：结构拆分每步只做一次（`__convBuilt`，视觉无损、可重复进入），
     * 样式按「本拍生长窗」的进度补间 —— 与站巡览并行，镜头逐站停的同时线自收笔端撤回。
     */
    function applyConvs(rec, t) {
        const anims = rec.convAnims;
        if (!anims || !anims.length) return;
        const e = rec.convDur > 0 ? (t - rec.growT0) / rec.convDur : 1;
        if (!rec.__convBuilt && e > 0) {
            rec.__convBuilt = true;
            anims.forEach((c) => {
                c.touched = convertRange(rec.step.lineId, c.s0, c.s1, c.style);
            });
        }
        if (!rec.__convBuilt) return;
        anims.forEach((c) => {
            (c.touched || []).forEach((tc) => applyPieceProgress(tc.pc, tc.from, tc.to, e));
        });
    }

    /** 播完的段落归档进「已开通」层，留在线网上才能看出线网在长大（站点由时间轴负责）。
     *  段形态转换（镂空 / 空白 / 恢复实线）不在这里 —— 它由 applyConvs 按帧补间（见上）。 */
    function commitPath(step) {
        const group = doneGroup();
        if (!group) return;
        const segs = Array.isArray(step.segs)
            ? (step.segs.length ? step.segs : null)
            : (step.pts && step.pts.length > 1 ? [{ pts: step.pts }] : null);
        if (!segs) return;
        if (group.querySelector(`[data-no="${step.no}"]`)) return;   // 同一步的多段只归档一次
        segs.forEach((sg, k) => {
            if (!sg.pts || sg.pts.length < 2) return;
            const p = document.createElementNS(NS, "path");
            p.setAttribute("data-no", String(step.no));
            p.setAttribute("data-line", String(step.lineId));   // 供「画布上正在展示的线路数」统计
            if (k) p.setAttribute("data-part", String(k));
            p.setAttribute("d", toD(sg.pts));
            p.setAttribute("stroke", step.color);
            p.setAttribute("stroke-width", "5.4");
            p.setAttribute("fill", "none");
            p.setAttribute("vector-effect", "non-scaling-stroke");
            group.appendChild(p);
            if (Number.isFinite(sg.s0) && Number.isFinite(sg.s1)) {
                // 注册表按全局弧长正向存（flip 的段翻回来），形态转换的切片才对得上；
                // 节点就是刚画的这条 path 本尊（形态转换直接动它）
                state.segPieces.push({
                    lineId: step.lineId,
                    s0: Math.min(sg.s0, sg.s1), s1: Math.max(sg.s0, sg.s1),
                    pts: sg.flip ? sg.pts.slice().reverse() : sg.pts,
                    style: "solid", color: step.color, nodes: [p]
                });
            }
        });
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
     * t 时刻面板上的取值（**唯一真源**）：面板正文与导出视频里的进度卡都读它，
     * 免得两边各算一套、数字对不上。
     * 日期与进度条在起笔运镜期间从上一事件收到本事件；车站 / 里程随生长一起滚；
     * 线路数在段落归档后补上。
     */
    function panelModel(t, rec) {
        const i = rec.i;
        const step = state.steps[i];
        const prev = i > 0 ? state.steps[i - 1] : null;
        const head = state.timeline.head;
        const rolling = !rec.whole && head > 0 && t < rec.headEnd;
        const p = rolling ? (t - rec.from) / head : 1;
        const pctFrom = prev ? trackPercentAt(i - 1) : trackPercentAt(i);

        const gp = rec.growDur > 0 ? rec.progAt(t - rec.growT0) : 1;
        const stFrom = prev ? prev.stationCount : 0, stTo = step.stationCount;
        const miFrom = prev ? prev.mileage : 0, miTo = step.mileage;
        const lc = lineCountAround(i);
        const lp = Math.max(0, Math.min(1, (t - rec.growEnd) / 150));

        const isRename = step.kind === "rename";
        return {
            i: i, step: step,
            date: lerpDate(prev ? prev.date : step.date, step.date, p),
            trackPct: rolling ? pctFrom + (trackPercentAt(i) - pctFrom) * p : trackPercentAt(i),
            stations: Math.round(stFrom + (stTo - stFrom) * gp),
            mileage: miFrom + (miTo - miFrom) * gp,
            lines: Math.round(lc.before + (lc.after - lc.before) * lp),
            badge: badgeOf(step),
            badgeColor: step.color,
            // 说明按两块给（面板与进度卡共用）：**标题**（事件本身）/ **描述**（一句补充）。
            // 两者都由数据显式给出（`title` / `desc`），不再从文字里猜分隔符。
            // 状态则单列：本次新增与转乘的站数（更名不是「新增」）。
            title: step.title || stepLabel(step),
            desc: step.desc || "",
            addCount: isRename ? 0
                : (step.enterCount != null ? step.enterCount : (step.stations ? step.stations.length : 0)),
            upgradeCount: isRename ? 0 : (step.upgradeCount || 0)
        };
    }

    /** 把 panelModel 的取值落到面板 DOM；徽标 / 说明 / 清单高亮只在事件切换时刷一次 */
    function applyPanel(t, rec) {
        if (!state.els) return;
        const m = panelModel(t, rec);
        state.els.date.textContent = m.date;
        setTrack(m.trackPct);
        state.els.stations.textContent = String(m.stations);
        state.els.mileage.textContent = m.mileage.toFixed(1);
        state.els.lines.textContent = String(m.lines);

        if (state.lastPanelI !== m.i) {
            state.lastPanelI = m.i;
            syncNow(m.i);
            state.els.list.querySelectorAll(".cgo-oh-item").forEach((li) => {
                const no = Number(li.dataset.go);
                li.classList.toggle("is-active", no === m.i + 1);
                li.classList.toggle("is-done", no <= m.i);
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
                    <!-- 信息区与导出进度卡同版式：标题 / 描述 / 状态三块 -->
                    <p class="cgo-oh-title">尚未选择事件</p>
                    <p class="cgo-oh-desc">点「播放」从空白画布起笔，镜头跟着画笔把线网逐段画出来；也可用操作行的清单按钮跳到任一年份。</p>
                    <div class="cgo-oh-status" hidden></div>
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
                            <cgo-toolbar-select id="cgo-oh-exp-from" data-oh="expFrom"></cgo-toolbar-select>
                        </div>
                        <div class="cgo-oh-field">
                            <label for="cgo-oh-exp-to">结束</label>
                            <cgo-toolbar-select id="cgo-oh-exp-to" data-oh="expTo"></cgo-toolbar-select>
                        </div>
                        <div class="cgo-oh-field">
                            <label>进度卡</label>
                            <div class="cgo-rt-need-opts" data-oh="expCard" role="group" aria-label="进度卡位置">
                                <button type="button" class="cgo-rt-need-opt is-on" data-card="br">右下</button>
                                <button type="button" class="cgo-rt-need-opt" data-card="bl">左下</button>
                                <button type="button" class="cgo-rt-need-opt" data-card="tr">右上</button>
                                <button type="button" class="cgo-rt-need-opt" data-card="tl">左上</button>
                                <button type="button" class="cgo-rt-need-opt" data-card="off">关</button>
                            </div>
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
        // 同一**事件**的多个操作在清单里只列一行（如 2021-12-31 的恢复运营 / 换乘启用 / 东延
        // 通车是同一次开通动作的三拍）——时间轴上仍是各自的拍，点击跳到该事件第一拍。
        const seen = new Set();
        const rows = state.steps.filter((s) => {
            const key = String(s.evIdx);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        state.els.list.innerHTML = rows.map((s) => {
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

    /**
     * 徽标与说明。日期不在这里设 —— 它由 `applyPanel` 按 t 算。
     * 步号必须**由调用方传进来**：`state.index` 只在暂停 / 跳转时写，播放途中不写，
     * 用它会让徽标与说明一直停在上一次的步号上（播放时看起来「不更新」）。
     */
    function syncNow(i) {
        const step = state.steps[Number.isFinite(i) ? i : state.index];
        if (!step) return;
        const badge = state.els.badge;
        badge.hidden = false;
        badge.textContent = badgeOf(step);
        badge.style.background = step.color;
        // 信息区版式与导出进度卡一致：标题 / 描述 / 状态三块
        const title = step.title || stepLabel(step);
        if (state.els.title) state.els.title.textContent = title;
        if (state.els.desc) state.els.desc.textContent = step.desc || "";
        if (state.els.status) {
            // 与清单同一套判据：更名不是「新增」，故不报计数
            const isRename = step.kind === "rename";
            const add = isRename ? 0
                : (step.enterCount != null ? step.enterCount : (step.stations ? step.stations.length : 0));
            const up = isRename ? 0 : (step.upgradeCount || 0);
            // 状态：直接放清单里那两颗计数块（add / transfer + 数字），样式与清单一致
            const chips = [];
            if (add) chips.push(`<span class="cgo-oh-item-add"><cgo-icon name="add" size="12"></cgo-icon>${add}</span>`);
            if (up) chips.push(`<span class="cgo-oh-item-add"><cgo-icon name="transfer" size="12"></cgo-icon>${up}</span>`);
            state.els.status.innerHTML = chips.join("");
            state.els.status.hidden = !chips.length;
        }
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
        if (r.step.rename) applyNewName(r.step.rename.sid, r.step.rename.to, r.step.rename.toEn, r.step.rename.toMn);
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

    /**
     * 从**当前 DOM** 取某个站名的逐行文字与行宽（与 buildLabelCache 同一套拆行法：按 <br> 拆）。
     * 导出逐帧都用它，不读缓存里的文字 —— 更名事件改写的名字要能立刻出现在视频画面里。
     */
    function liveLabelLines(L, ctx2d) {
        const el = L.el;
        if (!el) return null;
        const raw = [];
        let cur = "";
        el.childNodes.forEach((c) => {
            if (c.nodeName === "BR") { raw.push(cur); cur = ""; }
            else cur += c.textContent || "";
        });
        raw.push(cur);
        if (!raw.some((t) => t)) return null;
        return raw.map((t) => ({ text: t, w: ctx2d.measureText(t).width }));
    }

    /**
     * 更名换字时该站名当前的淡入淡出系数：直接读 DOM 上由 `applyRenameAt` 写在 span 的
     * inline opacity（没有在换字时是空串 → 1）。用 inline style 读，不触发样式计算。
     */
    function renameAlphaOf(L) {
        const v = L.el && L.el.style ? parseFloat(L.el.style.opacity) : NaN;
        return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
    }

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
                const spacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
                probe.font = font;
                if ("letterSpacing" in probe) probe.letterSpacing = spacing;
                // 站名里的 <br> 是数据自带的排版换行（英文长名常有 2~3 行）。canvas 画不到 <br>，
                // 必须自己拆行、逐行落位，否则整串会被画成一行，位置与页面完全对不上。
                const lines = [];
                let cur = "";
                sp.childNodes.forEach((c) => {
                    if (c.nodeName === "BR") { lines.push(cur); cur = ""; }
                    else cur += c.textContent || "";
                });
                lines.push(cur);
                if (!lines.some((t) => t)) return;
                const met = probe.measureText(lines.find((t) => t) || "中");
                // 站名可能带 scaleX（station.textScale），缩放锚点在 transform-origin 上
                const m = /matrix\(([-\d.]+)[, ]+[-\d.]+[, ]+[-\d.]+[, ]+[-\d.]+[, ]+([-\d.]+)/.exec(cs.transform || "");
                const sx = m ? parseFloat(m[1]) : 1;
                const orgPct = parseFloat(cs.transformOrigin) / 100;
                const boxW = r.width / view.scale;
                const boxH = r.height / view.scale;
                out.push({
                    el: sp, sid: sid,
                    // 画布坐标（与相机无关）：把屏幕矩形反解回未变换的画布
                    x: (r.left - mr.left) / view.scale,
                    y: (r.top - mr.top) / view.scale,
                    boxW: boxW,
                    // 行盒高：整块高 ÷ 行数（页面 line-height 由 CSS 统一给，这样最稳）
                    lh: boxH / Math.max(1, lines.length),
                    lines: lines.map((t) => ({ text: t, w: t ? probe.measureText(t).width : 0 })),
                    // 行盒内对齐：页面由 .label-group 的 text-align 决定，canvas 得自己补偏移
                    align: cs.textAlign,
                    ascent: met.fontBoundingBoxAscent || size * 0.8,
                    descent: met.fontBoundingBoxDescent || size * 0.2,
                    font: font,
                    spacing: spacing,
                    color: cs.color,
                    strokeW: parseFloat(cs.webkitTextStrokeWidth) || 0,
                    strokeColor: cs.webkitTextStrokeColor,
                    sx: sx,
                    anchorX: (r.left - mr.left) / view.scale + (Number.isFinite(orgPct) ? orgPct : 0) * boxW
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
        // ⚠️ 内联 CSS 走 CDATA：里面出现 `]]>` 就会提前闭合、把后面的标签名当文本，整份 SVG 直接解析失败。
        //    CSS 里合法出现 `]]>` 的情形很少，但一旦出现，症状就是「导出无声失败」，故宁可分段转义。
        const cssText = String(state.exportCss || "").replace(/]]>/g, "]]]]><![CDATA[>");
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">'
            + '<foreignObject width="' + W + '" height="' + H + '">'
            // ⚠️ 只藏**文字**、不藏整个 #labels-layer：呼出框（如沈阳换乘站的「文本框底部描边」
            //    `border-bottom`）是挂在 .label-group 上的，整层藏掉会连框一起丢；文字本身仍要
            //    由 canvas 画（SVG 里没有页面已加载的 webfont，留下会用回退字体、字形不一致）
            + '<style><![CDATA[' + cssText
            + '#labels-layer .stacn, #labels-layer .staen { visibility: hidden !important }]]></style>'
            + xml + '</foreignObject></svg>';
        if (!(W > 0 && H > 0)) {
            console.warn(`[线网发展史] 导出：地图容器尺寸为 ${W}×${H}，栅格化很可能失败`);
        }
        const img = await imgFromData(sanitizeXml(svg));

        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        ctx2d.fillStyle = "#fff";
        ctx2d.fillRect(0, 0, cw, ch);
        // 进度卡的让位已在**取景**层做掉（见 viewportBox：导出时按卡的所在侧扣掉一个卡宽），
        // 这里直接把图形层贴上去；站名随后按最终分辨率栅格化。
        const tx = ox + cam.x * k, ty = oy + cam.y * k;
        ctx2d.setTransform(s, 0, 0, s, tx, ty);
        ctx2d.drawImage(img, 0, 0, W, H);

        // ── 站名：与图形层同一套变换，于是文字按最终分辨率栅格化 ──
        (labelCache || []).forEach((L) => {
            const a = alphaAt(L.sid, t);
            if (a <= 0.01) return;
            // 更名换字的淡出淡入：DOM 那边由 applyRenameAt 写在 span 的 inline opacity 上（蒙文行
            // 因为整块栅格化，天然跟着变）；canvas 也要乘上同一个 alpha，否则中英文是"啪"地换掉。
            ctx2d.globalAlpha = a * renameAlphaOf(L);
            ctx2d.font = L.font;   // ⚠️ 每个缓存项自带字号（中英蒙三行不同），漏了就用默认字体、全都叠一起
            if ("letterSpacing" in ctx2d) ctx2d.letterSpacing = L.spacing;
            // 与页面一致：淡入时带 blur（页面里是 `--cgo-oh-pop-blur` = 4px × (1 - alpha)，
            // 但那是**地图局部坐标**下的值，会被 map-content 的 scale 放大 —— 导出的输出比例是
            // s = cam.scale × k，故这里也要乘 s 才与页面观感一致）。
            // ⚠️ canvas 的 filter 半径是**输出像素**，不受当前 CTM 缩放影响（实测），所以必须手乘
            const blur = 4 * (1 - a) * s;
            ctx2d.filter = blur > 0.3 ? "blur(" + blur.toFixed(2) + "px)" : "none";
            ctx2d.fillStyle = L.color;
            ctx2d.textAlign = "left";
            ctx2d.textBaseline = "alphabetic";
            // 行盒内对齐：页面里由 .label-group 的 text-align 决定，canvas 默认靠左，得自己补偏移
            const alignDx = (w) => (L.align === "center" ? (L.boxW - w) / 2
                : (L.align === "right" || L.align === "end") ? (L.boxW - w) : 0);
            if (L.sx !== 1) {
                ctx2d.save();
                ctx2d.translate(L.anchorX, 0);
                ctx2d.scale(L.sx, 1);
                ctx2d.translate(-L.anchorX, 0);
            }
            // 逐行落位（数据里的 <br> 换行 canvas 画不到，得自己拆；基线按行盒 + 字体上下缘算）
            // ⚠️ 文字**每帧从 DOM 重取**：更名事件会改写标签里的文字，而缓存那份永远停在导出
            //    开始时的旧文本 —— 于是视频里中英文站名全程都是新名（只有直接栅格化的蒙文行会变）。
            const lines = liveLabelLines(L, ctx2d) || L.lines;
            lines.forEach((line, li) => {
                if (!line.text) return;
                const baseY = L.y + li * L.lh + (L.lh - (L.ascent + L.descent)) / 2 + L.ascent;
                const x = L.x + alignDx(line.w);
                if (L.strokeW > 0) {
                    ctx2d.lineWidth = L.strokeW;
                    ctx2d.strokeStyle = L.strokeColor;
                    ctx2d.strokeText(line.text, x, baseY);
                }
                ctx2d.fillText(line.text, x, baseY);
            });
            if (L.sx !== 1) ctx2d.restore();
            ctx2d.globalAlpha = 1;
        });
        ctx2d.filter = "none";
        if ("letterSpacing" in ctx2d) ctx2d.letterSpacing = "0px";

        // ── 进度卡 / 水印：回到设备坐标单独画，不受相机变换影响 ──
        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        drawCard(ctx2d, cw, ch, t, k);
        drawWatermark(ctx2d, cw, ch);
    }

    /* ---- 进度卡：把面板那套「当前事件 + 说明 + 规模 + 进度」合成进画面 ---- */

    /* 画面浮层（进度卡 / 水印）整体放大一档：视频多在手机或大屏远看，字要比页面里大。
       字号与盒子的尺寸同步放大，版式比例不变。 */
    const OVERLAY_S = 1.5;
    const F = (px) => px * OVERLAY_S;
    const CARD = {
        // 卡面收窄到原设计的 6 成（原 384×1.5）：视频里它只作进度提示，占太多画面会盖住线网
        w: Math.round(384 * OVERLAY_S * 0.6),
        pad: Math.round(16 * OVERLAY_S),
        margin: Math.round(24 * OVERLAY_S),
        radius: Math.round(12 * OVERLAY_S),
        descMax: 3
    };

    /** 圆角矩形（Chrome 已支持 roundRect，留一个手写兜底） */
    function roundRect(ctx2d, x, y, w, h, r) {
        ctx2d.beginPath();
        if (typeof ctx2d.roundRect === "function") { ctx2d.roundRect(x, y, w, h, r); return; }
        ctx2d.moveTo(x + r, y);
        ctx2d.arcTo(x + w, y, x + w, y + h, r);
        ctx2d.arcTo(x + w, y + h, x, y + h, r);
        ctx2d.arcTo(x, y + h, x, y, r);
        ctx2d.arcTo(x, y, x + w, y, r);
        ctx2d.closePath();
    }

    /** 逐字折行（中英混排按实际量测宽度切，够用且无需依赖） */
    function wrapText(ctx2d, text, maxW) {
        const out = [];
        let line = "";
        for (const ch of String(text)) {
            const test = line + ch;
            if (line && ctx2d.measureText(test).width > maxW) { out.push(line); line = ch; }
            else line = test;
        }
        if (line) out.push(line);
        return out;
    }

    /**
     * 画布上的玻璃态卡面：把底下**已经画好的地图**挖一块 → 模糊 + 提饱和 → 贴回圆角矩形，
     * 再叠 CGoUI `.glass-panel` 的那几层（0.82 衬底 / 顶部微光圈 / 0.5px 外圈 / 投影）。
     * canvas 没有 backdrop-filter，只能这样「先糊底、再盖膜」，做出同样的磨砂观感。
     * 底衬按 `GLASS_DS` 降采样后再模糊（半径同比缩），再放大贴回 —— 模糊看不出细节，
     * 代价却掉到约 1/4（大半径模糊尤其明显）。
     */
    const GLASS_DS = 0.5;

    let glassScratch = null;
    function paintGlass(ctx2d, cw, ch, x, y, w, h, r, blur, fade) {
        const P = Math.ceil(blur * 2) + 2;
        const sx = Math.max(0, Math.round(x - P)), sy = Math.max(0, Math.round(y - P));
        const ex = Math.min(cw, Math.round(x + w + P)), ey = Math.min(ch, Math.round(y + h + P));
        const sw = Math.max(1, ex - sx), sh = Math.max(1, ey - sy);
        const tw = Math.max(1, Math.round(sw * GLASS_DS)), th = Math.max(1, Math.round(sh * GLASS_DS));
        if (!glassScratch) glassScratch = document.createElement("canvas");
        const tmp = glassScratch;
        if (tmp.width < tw || tmp.height < th) {
            tmp.width = Math.max(tmp.width, tw);
            tmp.height = Math.max(tmp.height, th);
        }
        const tc = tmp.getContext("2d");
        tc.setTransform(1, 0, 0, 1, 0, 0);
        tc.clearRect(0, 0, tw, th);
        tc.filter = "blur(" + (blur * GLASS_DS).toFixed(1) + "px) saturate(135%)";
        tc.drawImage(ctx2d.canvas, sx, sy, sw, sh, 0, 0, tw, th);
        tc.filter = "none";

        // 投影（对齐 --glass-shadow 的 0 8px 24px；半径收着给，太大很费且看不出差别）
        // ⚠️ 阴影不吃 globalAlpha，淡出时得把 alpha 直接揉进 shadowColor
        ctx2d.save();
        ctx2d.shadowColor = "rgba(0,38,59," + (0.16 * fade).toFixed(3) + ")";
        ctx2d.shadowBlur = Math.max(8, blur * 0.6);
        ctx2d.shadowOffsetY = Math.max(4, blur * 0.25);
        roundRect(ctx2d, x, y, w, h, r);
        ctx2d.fillStyle = "rgba(0,0,0,0.002)";
        ctx2d.fill();
        ctx2d.restore();

        // 糊好的底（放大贴回）+ 衬底（对齐 --glass-bg-panel）
        ctx2d.save();
        ctx2d.globalAlpha = fade;
        roundRect(ctx2d, x, y, w, h, r);
        ctx2d.clip();
        ctx2d.drawImage(tmp, 0, 0, tw, th, sx, sy, sw, sh);
        ctx2d.fillStyle = (state.exportTheme && state.exportTheme.glassPanel) || "rgba(255,255,255,.82)";
        ctx2d.fillRect(x, y, w, h);
        ctx2d.restore();

        // 0.5px 外圈 + 顶部 1px 微光圈（`.glass-panel::before` 的简化）
        ctx2d.save();
        ctx2d.globalAlpha = fade;
        ctx2d.lineWidth = 1;
        ctx2d.strokeStyle = "rgba(0,0,0,0.07)";
        roundRect(ctx2d, x + 0.5, y + 0.5, w - 1, h - 1, r);
        ctx2d.stroke();
        ctx2d.beginPath();
        ctx2d.moveTo(x + r, y + 1.5);
        ctx2d.lineTo(x + w - r, y + 1.5);
        ctx2d.strokeStyle = "rgba(255,255,255,0.55)";
        ctx2d.stroke();
        ctx2d.restore();
    }

    /**
     * 收尾那拍「缩到全图」时把进度卡淡出：全图是主画面，卡再杵着就挡景了。
     * 淡出窗口取全图那一拍的**运镜时长**（`whole.from → whole.headEnd`），镜头缩、卡同步消；
     * 之后的停驻期一直是 0。更名换字那类的中间步骤不受影响（整段都是 1）。
     */
    function cardAlphaAt(t) {
        const tl = state.timeline;
        if (!tl || !tl.whole) return 1;
        const w = tl.whole;
        if (t < w.from) return 1;
        const span = Math.max(1, w.headEnd - w.from);
        return Math.max(0, 1 - (t - w.from) / span);
    }

    /**
     * 把进度卡画到画面指定角落（`state.cardPos` = tl / tr / bl / br / off）。
     * 取值与面板**同源**（panelModel），所以视频里的数字与面板逐帧一致。
     * @param {number} k 可见视口 → 输出画面的放大系数（玻璃模糊半径按它换算）
     */
    function drawCard(ctx2d, cw, ch, t, k) {
        const pos = state.cardPos;
        if (!pos || pos === "off") { state.exportCardRect = null; return; }
        const fade = cardAlphaAt(t);
        if (fade <= 0.01) { state.exportCardRect = null; return; }   // 已淡尽：整块别画（也省掉玻璃那笔开销）
        const th = state.exportTheme || {};
        const fam = th.font || "sans-serif";
        const m = panelModel(t, recAt(t));
        const W = CARD.w, PAD = CARD.pad, innerW = W - PAD * 2;
        const GAP = F(6);

        // 三块内容分开排：**标题**（事件本身）/ **描述**（括注那句人话）/ **状态**（本次新增与转乘）。
        // 不是每件事都有括注、都有新增，缺的块直接跳过。宽度不足时都先缩字号，再谈截断。
        const TITLE_FS = [F(15), F(14), F(13)];
        let titleFont = TITLE_FS[0], titleLines = [];
        for (const fs of TITLE_FS) {
            ctx2d.font = "500 " + fs + "px " + fam;
            titleFont = fs; titleLines = wrapText(ctx2d, m.title, innerW);
            if (titleLines.length <= 2) break;
        }
        if (titleLines.length > 2) titleLines = titleLines.slice(0, 2);

        const DESC_FS = [F(13), F(12), F(11)];
        let descFont = DESC_FS[0], descLines = [];
        if (m.desc) {
            for (const fs of DESC_FS) {
                ctx2d.font = "400 " + fs + "px " + fam;
                descFont = fs; descLines = wrapText(ctx2d, m.desc, innerW);
                if (descLines.length <= CARD.descMax) break;
            }
            if (descLines.length > CARD.descMax) descLines = descLines.slice(0, CARD.descMax);
        }

        // 状态行：与清单同款 —— CGoUI 的 add / transfer 图标 + 数字（不另画「＋」，也不加底衬）
        const chips = [];
        if (m.addCount) chips.push({ icon: "add", n: m.addCount });
        if (m.upgradeCount) chips.push({ icon: "transfer", n: m.upgradeCount });
        const statH = chips.length ? F(20) : 0;

        const titleStep = F(20) * (titleFont / F(15));   // 行距随字号等比收
        const descStep = F(19) * (descFont / F(13));
        let H = PAD + F(26) + GAP;                        // 日期 + 类型徽标
        H += titleLines.length * titleStep + GAP;         // 标题
        if (descLines.length) H += descLines.length * descStep + GAP;
        if (statH) H += statH + GAP;
        H += F(17) + GAP;                                 // 规模行
        H += F(5) + PAD;                                  // 进度条

        const x = (pos === "tr" || pos === "br") ? cw - CARD.margin - W : CARD.margin;
        const y = (pos === "bl" || pos === "br") ? ch - CARD.margin - H : CARD.margin;
        // 记下本帧卡面矩形：下一帧据此裁掉落进卡里的站名（尺寸也让取景知道 —— 见 viewportBox）
        state.exportCardRect = { x: x, y: y, w: W, h: H, pos: pos };

        paintGlass(ctx2d, cw, ch, x, y, W, H, CARD.radius,
            Math.max(6, Math.min(30, (th.glassBlur || 14) * (k || 1))), fade);

        ctx2d.save();
        ctx2d.textAlign = "left";
        ctx2d.textBaseline = "top";
        ctx2d.globalAlpha = fade;   // 卡面已淡出多少，里面的字就跟着淡多少

        let cy = y + PAD;
        // 日期 + 类型徽标
        ctx2d.font = "700 " + F(21) + "px " + fam;
        ctx2d.fillStyle = th.text || "#222";
        ctx2d.fillText(m.date, x + PAD, cy + F(2));
        const bx = x + PAD + ctx2d.measureText(m.date).width + F(12), by = cy + F(4);
        ctx2d.font = "600 " + F(12) + "px " + fam;
        const btw = ctx2d.measureText(m.badge).width + F(16);
        ctx2d.fillStyle = m.badgeColor || th.primary || "#006098";
        roundRect(ctx2d, bx, by, btw, F(18), F(9));
        ctx2d.fill();
        ctx2d.fillStyle = "#fff";
        ctx2d.fillText(m.badge, bx + F(8), by + F(3));
        cy += F(26) + GAP;

        // 标题：比描述重一点即可，不用加粗到跳出来
        ctx2d.font = "500 " + titleFont + "px " + fam;
        ctx2d.fillStyle = th.text || "#222";
        titleLines.forEach((ln) => { ctx2d.fillText(ln, x + PAD, cy); cy += titleStep; });
        cy += GAP;

        // 描述（括注）
        if (descLines.length) {
            ctx2d.font = "400 " + descFont + "px " + fam;
            ctx2d.globalAlpha = 0.75 * fade;
            ctx2d.fillStyle = th.text || "#222";
            descLines.forEach((ln) => { ctx2d.fillText(ln, x + PAD, cy); cy += descStep; });
            ctx2d.globalAlpha = fade;
            cy += GAP;
        }

        // 状态：本次新增 / 转为换乘 —— 与清单同款，图标 + 数字直接并排（不画胶囊底衬）
        if (statH) {
            let cxp = x + PAD;
            chips.forEach((c) => {
                const img = state.cardIcons && state.cardIcons[c.icon];
                if (img) {
                    ctx2d.drawImage(img, cxp, cy + F(3.5), F(13), F(13));
                    cxp += F(16);
                }
                const txt = String(c.n);
                ctx2d.font = "500 " + F(13) + "px " + fam;
                ctx2d.fillStyle = th.text || "#222";
                ctx2d.globalAlpha = 0.7 * fade;
                ctx2d.fillText(txt, cxp, cy + F(3));
                ctx2d.globalAlpha = fade;
                cxp += ctx2d.measureText(txt).width + F(14);
            });
            cy += statH + GAP;
        }

        // 规模行：与说明同样处理 —— 宽度不足时先缩字号（原字号 F(13)），避免顶出卡面
        const statsText = `线路 ${m.lines} 条 · 车站 ${m.stations} 座 · 里程 ${m.mileage.toFixed(1)} km`;
        let statsFont = F(13);
        for (const fs of [F(13), F(12), F(11), F(10)]) {
            ctx2d.font = "400 " + fs + "px " + fam;
            statsFont = fs;
            if (ctx2d.measureText(statsText).width <= innerW) break;
        }
        ctx2d.font = "400 " + statsFont + "px " + fam;
        ctx2d.globalAlpha = 0.62 * fade;
        ctx2d.fillText(statsText, x + PAD, cy);
        ctx2d.globalAlpha = fade;
        cy += F(17) + GAP;

        // 进度条
        ctx2d.fillStyle = th.info || "rgba(0,0,0,.06)";
        roundRect(ctx2d, x + PAD, cy, innerW, F(5), F(2.5));
        ctx2d.fill();
        const pw = Math.max(0, Math.min(1, m.trackPct / 100)) * innerW;
        if (pw > 0.5) {
            ctx2d.fillStyle = th.primary || "#006298";
            roundRect(ctx2d, x + PAD, cy, Math.max(F(5), pw), F(5), F(2.5));
            ctx2d.fill();
        }
        ctx2d.restore();
    }

    /* ---- 角落水印：来源署名（AGPLv3 / ODbL 双轨下，视频出片同样要署名） ---- */

    /** 水印文案：`CGo OpenMap · {城市} 开放地图`（城市名取当前注册城市） */
    function watermarkText() {
        let city = "";
        try {
            const c = window.CityDataManager && window.CityDataManager.getCurrentCity
                ? window.CityDataManager.getCurrentCity() : null;
            city = (c && c.name) || "";
        } catch (e) { /* 取不到就只留项目名 */ }
        return "CGo OpenMap · " + (city ? city + " " : "") + "开放地图";
    }

    /** 水印落在右侧吗：与进度卡**分居左右下角**（卡右下→水印左下；卡左下→水印右下；
        卡在上半屏或关掉→固定右下），这样两者永不重叠 */
    const watermarkOnRight = () => state.cardPos !== "br";

    function drawWatermark(ctx2d, cw, ch) {
        const text = watermarkText();
        if (!text) return;
        const th = state.exportTheme || {};
        const fam = th.font || "sans-serif";
        const pad = CARD.margin;
        const mark = state.exportMark;
        const markSize = F(20), gap = F(8);

        ctx2d.save();
        ctx2d.font = "600 " + F(14) + "px " + fam;
        ctx2d.textBaseline = "middle";
        ctx2d.textAlign = "left";
        const textW = ctx2d.measureText(text).width;
        const totalW = (mark ? markSize + gap : 0) + textW;
        const x = watermarkOnRight() ? cw - pad - totalW : pad;
        const cy = ch - pad - F(13);   // 与进度卡底边同一行
        let cx = x;
        ctx2d.globalAlpha = 0.72;
        if (mark) {
            ctx2d.drawImage(mark, cx, cy - markSize / 2, markSize, markSize);
            cx += markSize + gap;
        }
        // 先描一圈背景色做底衬，压在线上也看得清
        ctx2d.lineWidth = F(3);
        ctx2d.lineJoin = "round";
        ctx2d.strokeStyle = th.mapBg || "#fff";
        ctx2d.strokeText(text, cx, cy);
        ctx2d.fillStyle = th.text || "#222";
        ctx2d.fillText(text, cx, cy);
        ctx2d.restore();
    }

    /**
     * XML 1.0 里**不允许出现**的字符：控制符（除 \t \n \r）、孤立代理项、U+FFFE / U+FFFF。
     * HTML 解析对它们照收不误，但把同一棵 DOM 序列化成 SVG 再交给 XML 解析器就整份失败
     * （实测症状：`invalid attribute value`，指到克隆根节点的 style 属性里）。
     * ⚠️ 正则**不加** `u` 标志：要按 UTF-16 码元匹配，才能抓到孤立代理项。
     */
    const XML_BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g;

    /** 栅格化前净化：剔掉 XML 不允许的字符，并把它是什么报出来（数据问题便于追溯） */
    function sanitizeXml(str) {
        const bad = str.match(XML_BAD_CHARS);
        if (!bad) return str;
        const uniq = Array.from(new Set(bad))
            .map((c) => "U+" + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"));
        console.warn(`[线网发展史] 导出：SVG 里含 ${bad.length} 个 XML 不允许的字符（${uniq.join("、")}）已剔除，`
            + "多半来自某个样式值或站名文本，可作为上游数据问题排查");
        return str.replace(XML_BAD_CHARS, "");
    }

    /**
     * 诊断用：SVG 栅格化失败时把**真正的原因**说出来。
     * `<img>` 的 onerror 不给任何细节，只能自己再判一次：
     *   · XML 不合法 —— DOMParser 会直指出错位置（命名空间缺失、非法字符、CDATA 里的 `]]>` 等），
     *     并把**出错处上下文**（JSON 转义，控制符会显示成 \u00xx）一起带出来；
     *   · XML 合法却仍失败 —— 多半是 data URL 过大或含不受支持的内容，这时把体积报出来便于定位。
     */
    function describeSvgFailure(svgStr) {
        const bytes = new TextEncoder().encode(svgStr).length;
        const parts = [`${bytes} 字节`, `内联 CSS ${(state.exportCss || "").length} 字符`];
        try {
            const doc = new DOMParser().parseFromString(svgStr, "image/svg+xml");
            const err = doc.querySelector("parsererror");
            if (err) {
                const msg = String(err.textContent || "").replace(/\s+/g, " ").trim().slice(0, 240);
                parts.push("XML 解析失败：" + msg + svgErrorContext(svgStr, msg));
            } else {
                parts.push("XML 合法（可能是 data URL 过大或含不受支持的内容）");
            }
        } catch (e) {
            parts.push("无法用 DOMParser 复核");
        }
        return parts.join("；");
    }

    /** 按 parsererror 报的「line L at column C」切一段上下文（±120 字符，JSON 转义） */
    function svgErrorContext(svgStr, errText) {
        const m = /line (\d+) at column (\d+)/i.exec(errText || "");
        if (!m) return "";
        const line = Number(m[1]), col = Number(m[2]);
        const lines = svgStr.split("\n");
        let offset = 0;
        for (let i = 0; i < Math.min(line - 1, lines.length); i++) offset += lines[i].length + 1;
        offset += Math.max(0, col - 1);
        return "；出错处上下文：" + JSON.stringify(svgStr.slice(Math.max(0, offset - 120), offset + 120));
    }

    /** data URL 的 SVG → <img>（decoded ≠ painted，调用方已在外层留出等待） */
    function imgFromData(svgStr) {
        const bytes = new TextEncoder().encode(svgStr);
        let bin = ""; const CH = 0x8000;
        for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = () => rej(new Error("SVG 栅格化失败（" + describeSvgFailure(svgStr) + "）"));
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
        state.exportTheme = readThemeVars();
        state.exportMark = await prepareMark();
        // 进度卡状态行用的两个图标（与清单里的 add / transfer 同款）
        state.cardIcons = {
            add: await prepareIcon("add", (state.exportTheme || {}).text || "#222", false),
            transfer: await prepareIcon("transfer", (state.exportTheme || {}).text || "#222", false)
        };
        state.cardReserve = true;      // 取景给卡让位（全览那一拍除外，见 buildTimeline）
        state.exportCardRect = null;   // 卡面矩形逐帧记，导出开始时清一次（首帧不让位）
    }

    /**
     * 水印左侧的 CGo 小图标：把 CGoUI 的 `<cgo-icon name="cgo">` 临时挂到页面上，取出它
     * shadow DOM 里的 SVG、栅格化一次（拿不到就退化成纯文字水印）。
     * ⚠️ 隔离的 SVG（data URL）里没有页面上的 CSS 变量，品牌渐变（`color-mode="brand"` 的
     * `<stop stop-color="var(--brand-gradient-…)">`）与 `--icon-clr` 都得在根上补好，
     * 否则渐变那两笔会解析不出来、整块不画。
     */
    const MARK_COLOR_MODE = "brand";   // 'mono' 跟随文字色 / 'brand' 用 CGoUI 品牌渐变

    async function prepareMark() {
        return await prepareIcon("cgo", (state.exportTheme || {}).text || "#222", MARK_COLOR_MODE === "brand");
    }

    /**
     * 把一个 `<cgo-icon>` 栅格化成 Image（画布上画图标用）。进度卡状态行的 add / transfer
     * 也走这条 —— 与面板清单里的图标同一套 CGoUI 矢量，避免在视频里另画一套「＋」。
     * 拿不到就返回 null，调用方降级为纯文字。
     */
    async function prepareIcon(name, col, brand) {
        const th = state.exportTheme || {};
        let host = document.querySelector(`cgo-icon[name="${name}"]`);
        let temp = null;
        const wrongMode = brand
            ? !!host && host.getAttribute("color-mode") !== "brand"
            : !!host && !!host.getAttribute("color-mode");
        if (!host || wrongMode) {
            temp = document.createElement("cgo-icon");
            temp.setAttribute("name", name);
            temp.setAttribute("size", "24");
            if (brand) temp.setAttribute("color-mode", "brand");
            temp.style.cssText = "position:absolute;left:-9999px;top:0;";
            document.body.appendChild(temp);
            host = temp;
            await new Promise((r) => requestAnimationFrame(() => r()));   // 等组件渲染出 shadow DOM
        }
        try {
            const svg = host.shadowRoot && host.shadowRoot.querySelector("svg");
            if (!svg) return null;
            const doc = new DOMParser().parseFromString(new XMLSerializer().serializeToString(svg), "image/svg+xml");
            const root = doc.documentElement;
            if (!root || root.nodeName === "parsererror") return null;
            root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            root.setAttribute("width", "72");    // 画布上按 30px 画，栅格化给足余量才不发虚
            root.setAttribute("height", "72");
            const cs = getComputedStyle(host);
            const vars = {
                "--icon-clr": col,
                "--brand-gradient-start-appname": cs.getPropertyValue("--brand-gradient-start-appname").trim() || th.primary || "#006098",
                "--brand-gradient-end-appname": cs.getPropertyValue("--brand-gradient-end-appname").trim() || th.primary || "#006098"
            };
            Object.keys(vars).forEach((k) => root.style.setProperty(k, vars[k]));
            root.style.color = col;   // 其余笔画走 currentColor
            return await imgFromData(new XMLSerializer().serializeToString(root));
        } catch (e) {
            return null;
        } finally {
            if (temp) temp.remove();
        }
    }

    /** 进度卡 / 水印要用的主题色：canvas 读不到 CSS 变量，只能先把算好的值取出来 */
    function readThemeVars() {
        const host = stageHost() || document.body;
        const cs = getComputedStyle(host);
        const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
        // CGoUI 玻璃系统的模糊半径（blur(14px) saturate(135%) 里的那个 14）
        const gm = /blur\(\s*([\d.]+)px/.exec(v("--glass-backdrop-blur-surface", "blur(14px)"));
        return {
            font: getComputedStyle(document.body).fontFamily || "sans-serif",
            text: v("--text-main", "#222"),
            primary: v("--primary-color", "#00263b"),
            border: v("--border-color", "rgba(0,0,0,.12)"),
            info: v("--btn-info-bg", "rgba(0,0,0,.06)"),
            mapBg: v("--map-bg", "#ffffff"),
            glassPanel: v("--glass-bg-panel", "rgba(255,255,255,.82)"),
            glassBlur: gm ? parseFloat(gm[1]) : 14
        };
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

    /** 文件名：`{城市}_线网发展史_{起}_{止}_{导出时间戳}.mp4`（时间戳避免同名导出互相覆盖/看不出先后） */
    const exportFileName = (from, to) => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, "0");
        const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
        const a = state.steps[from] ? state.steps[from].date : "start";
        const b = state.steps[to] ? state.steps[to].date : "end";
        // 文件名带上城市：多城各导一段时不至于混在一起（城市名取当前注册城市）
        let city = "";
        try {
            const c = window.CityDataManager && window.CityDataManager.getCurrentCity
                ? window.CityDataManager.getCurrentCity() : null;
            city = (c && c.name) || "";
        } catch (e) { /* 取不到就不带城市 */ }
        return `${city ? city + "_" : ""}线网发展史_${a}_${b}_${stamp}.mp4`;
    };

    /**
     * 把第 from..to 步导出为 MP4。与播放共用一条时间轴：
     * ① from>0 时先把之前的事件落成「已开通」（jumpTo），画面从 from 起播；
     * ② 逐帧 `applyFrame(t)` → `paintFrame` → `VideoFrame` → `encode`，按背压等队列；
     * ③ flush → finalize → Blob 下载。导出期间停下实时播放并锁住相关控件。
     */
    async function runExport(from, to) {
        if (state.exporting) return;
        // ⚠️ 代次令牌：`state` 是本模块单例，导出期间把面板关掉再打开时，
        //    在飞的旧导出会继续往**新面板**上写状态、还会把画面落位（把新实例的镜头拽走）。
        //    unmount 里 +1 即可让它下一拍自行收手（上游审查意见 #4）。
        const gen = ++state.exportGen;
        const alive = () => gen === state.exportGen;
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
            if (!alive()) return;
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
                if (!alive() || state.exportCancelled) break;
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
                while (encoder.encodeQueueSize > 8 && alive() && !state.exportCancelled && !encError) {
                    await new Promise((r) => setTimeout(r, 4));
                }
                if (!alive()) break;
                setExportProgress(i + 1, frames + 1);
                if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));  // 定期让出主线程
            }
            if (encError) throw encError;
            if (!alive()) return;

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
            if (alive()) setExportStatus("导出失败：" + (e && e.message ? e.message : e), true);
        } finally {
            if (encoder) { try { encoder.close(); } catch (e) { /* 已关闭或未配置 */ } }
            // 面板已被关掉 / 已换新实例（代次变了）时，什么都不碰：旧实例的落位会把新实例的镜头拽走
            if (alive()) {
                // 取消时不要只落最后一帧：先清干净再跳到 to —— 保证生长组的 bookkeeping 与 DOM 一致
                // （只落帧会留下 dataset.no / __segs 与实际子节点不匹配，那条线整段不画）。
                if (state.timeline && state.els) {
                    try {
                        clearCanvas();
                        jumpTo(to);
                    } catch (e) { /* 重建失败也要让流程正常收尾 */ }
                    state.index = to;
                    state.tCur = state.timeline.total;
                }
                state.exporting = false;
                syncExportUI();
            }
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

    /** 起止事件下拉：用 CGoUI 的 `<cgo-toolbar-select>`（自带下拉面板与主题跟随） */
    function renderExportSelects() {
        const e = state.els;
        if (!e || !e.expFrom || !e.expTo) return;
        // 选项左边一颗线路色圆点（`.cgo-toolbar-option-dot`），文字用「日期 + 事件标题」
        const opts = state.steps
            .map((s) => `<cgo-toolbar-option value="${s.no - 1}">`
                + `<span class="cgo-toolbar-option-dot" style="background:${s.color}"></span>`
                + `${s.date} ${s.title || stepLabel(s)}</cgo-toolbar-option>`)
            .join("");
        e.expFrom.innerHTML = opts;
        e.expTo.innerHTML = opts;
        e.expFrom.value = "0";
        e.expTo.value = String(state.steps.length - 1);
        setExportStatus("");
    }

    /** 进度卡位置的分段控件高亮（值存在 state.cardPos，不走 DOM 读值） */
    function syncCardOpts() {
        const box = state.els && state.els.expCard;
        if (!box) return;
        box.querySelectorAll(".cgo-rt-need-opt").forEach((b) => {
            b.classList.toggle("is-on", b.dataset.card === state.cardPos);
        });
    }

    /** 导出期间锁住会干扰时间线的控件，只留「取消」；同时同步导出按钮的按下态 */
    function syncExportUI() {
        const e = state.els;
        if (!e) return;
        const on = state.exporting;
        const open = e.exportSet && !e.exportSet.hidden;
        [e.back, e.play, e.replay, e.setSpeed, e.setZoom, e.toggleInfo].forEach((b) => { if (b) b.disabled = on; });
        // 展开导出区时把「当前事件 / 说明 / 规模 / 进度条」四块藏起来：它们已合成进视频的进度卡，
        // 面板上再放一份既重复又占高度（见 opening-history.css 的 .cgo-oh.is-export）
        if (e.root) e.root.classList.toggle("is-export", open);
        if (e.exportToggle) {
            e.exportToggle.classList.toggle("is-on", open);
            e.exportToggle.setAttribute("aria-pressed", String(open));
        }
        if (e.expFrom) e.expFrom.disabled = on;
        if (e.expTo) e.expTo.disabled = on;
        if (e.expCard) e.expCard.querySelectorAll(".cgo-rt-need-opt").forEach((b) => { b.disabled = on; });
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
            title: q(".cgo-oh-title"),
            desc: q(".cgo-oh-desc"),
            status: q(".cgo-oh-status"),
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
            expCard: q('[data-oh="expCard"]'),
            expStart: q('[data-oh="expStart"]'),
            expCancel: q('[data-oh="expCancel"]'),
            expBar: q('[data-oh="expBar"]'),
            expStatus: q('[data-oh="expStatus"]'),
            list: q(".cgo-oh-list")
        };
        state.steps = build();
        // 更名链：同一站可以有多次更名（旧名 → 中间名 → … → 现名），按步号升序存成数组
        state.renameMap = new Map();
        state.steps.forEach((s, i) => {
            const list = (s.renames && s.renames.length) ? s.renames : (s.rename ? [s.rename] : []);
            list.forEach((r) => {
                if (!r || !r.sid) return;
                if (!state.renameMap.has(r.sid)) state.renameMap.set(r.sid, []);
                state.renameMap.get(r.sid).push({
                    from: r.from, to: r.to,
                    fromEn: r.fromEn, fromMn: r.fromMn,
                    toEn: r.toEn, toMn: r.toMn,
                    i: i   // 更名事件排在第几步：判断「此刻该用哪个名字」的唯一依据
                });
            });
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
        state.cardPos = "br";       // 每次挂载都回到默认角落（与速度 / 倍数一样不记忆）
        renderList();
        renderExportSelects();
        syncCardOpts();

        state.els.play.addEventListener("click", play);
        state.els.replay.addEventListener("click", replay);
        state.els.back.addEventListener("click", () => window.CGoMapTools?.open?.());
        // 三枚展开按钮各管各的区块：点开的那个显示、另两个收起；再点一次收起来
        state.els.setSpeed.addEventListener("click", () => {
            const show = state.els.speedSet.hidden;
            state.els.speedSet.hidden = !show;
            state.els.zoomSet.hidden = true;
            state.els.exportSet.hidden = true;
            syncExportUI();
        });
        state.els.setZoom.addEventListener("click", () => {
            const show = state.els.zoomSet.hidden;
            state.els.zoomSet.hidden = !show;
            state.els.speedSet.hidden = true;
            state.els.exportSet.hidden = true;
            syncExportUI();
        });
        state.els.exportToggle.addEventListener("click", () => {
            if (state.exporting) return;
            const open = state.els.exportSet.hidden;
            state.els.exportSet.hidden = !open;
            state.els.speedSet.hidden = true;
            state.els.zoomSet.hidden = true;
            // 与「事件清单」互斥：两个按钮不同时点亮（清单占的是同一块信息区）
            if (open) { state.els.root.classList.remove("is-list"); syncToggle(); }
            syncExportUI();
        });
        // 起止两个下拉互相钳制，避免选出「起 > 止」的空区间
        state.els.expFrom.addEventListener("cgo-change", () => {
            if (Number(state.els.expTo.value) < Number(state.els.expFrom.value)) {
                state.els.expTo.value = state.els.expFrom.value;
            }
        });
        state.els.expTo.addEventListener("cgo-change", () => {
            if (Number(state.els.expFrom.value) > Number(state.els.expTo.value)) {
                state.els.expFrom.value = state.els.expTo.value;
            }
        });
        // 进度卡位置：分段控件，点哪段就把 state.cardPos 切到哪
        state.els.expCard.addEventListener("click", (ev) => {
            const b = ev.target.closest(".cgo-rt-need-opt");
            if (!b || state.exporting) return;
            state.cardPos = b.dataset.card;
            syncCardOpts();
        });
        state.els.expStart.addEventListener("click", () => {
            runExport(Number(state.els.expFrom.value), Number(state.els.expTo.value));
        });
        state.els.expCancel.addEventListener("click", () => { state.exportCancelled = true; });
        // 信息区 ⟷ 事件清单：二选一，不是「收起 / 展开」
        state.els.toggleInfo.addEventListener("click", () => {
            state.els.root.classList.toggle("is-list");
            // 切到清单视图时把三块浮层一并收起：它们与清单不同时激活
            if (state.els.root.classList.contains("is-list")) {
                state.els.speedSet.hidden = true;
                state.els.zoomSet.hidden = true;
                state.els.exportSet.hidden = true;
                syncExportUI();
            }
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
        // ⚠️ 同时把 exporting 清掉：导出收尾那一段被 `alive()` 挡着（代次已变），不会重置它；
        //    留着 true 会让下一次导出在 runExport 开头就被 `if (state.exporting) return` 挡回去。
        state.exporting = false;
        state.exportGen++;              // 代次 +1：在飞的旧导出彻底作废（不再碰面板、不落位）
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
