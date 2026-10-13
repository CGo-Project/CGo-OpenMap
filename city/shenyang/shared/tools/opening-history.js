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
    const HOST_CLASS = "cgo-oh-host-off";   // 出站换乘期：主点让位（该站此刻只由幽灵点呈现）
    const DUP_LABEL_CLASS = "cgo-oh-dup-label"; // 同一站的两个幽灵点同名：只留一个站名标签
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
    /** 同一站区内「旧的（幽灵点）撤掉」到「新的（主点）入场」之间的空当（ms） */
    const STOP_STAGGER = 250;
    /** 开通站内换乘那拍：镜头到位（headEnd）后**再停一小段**才把站外连线切成免费画法（ms） */
    const FREE_SWITCH_HOLD = 400;
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
        const retired = [];
        const pushIds = (list, isRetired) => (list || []).forEach((sid) => {
            if (ids.indexOf(sid) < 0) ids.push(sid);
            if (isRetired && retired.indexOf(sid) < 0) retired.push(sid);
        });
        eventOps().forEach((ev) => {
            if (ev.kind === "station-state" && ev.state === "removed") { pushIds(ev.stations, true); return; }
            if (ev.kind !== "line-state") return;
            // 区段级移除有两种写法：整段 `state: "removed"`，以及停运段上的站级豁免
            // `except: [{ sid, state: "removed" }]`（长春 3 号线 0323 随段拆除即此例）——
            // 后者的站同样是**终态消失**，底图与非演示态都不该再出现。
            (Array.isArray(ev.except) ? ev.except : []).forEach((ex) => {
                if (ex && ex.sid && ex.state === "removed") pushIds([ex.sid], true);
            });
            if (ev.state !== "removed") return;
            // 线路级移除：按站序展开出该区段的**独占**车站（共站站名要留着，另一条线还在跑）；
            // 此处尚未进演示流程，站点数据若未就绪则跳过
            const line = byLineId(ev.lineId);
            if (!line) return;
            pushIds(stationRangeOf(line, lineStations(line), ev).filter((sid) => soleOnLine(sid, ev.lineId)), true);
        });
        (window.CGO_OFFSTATION_PLATFORMS || []).forEach((pf) => {
            if (pf && pf.id) pushIds([pf.id]);
        });
        // 「已拆除站」对外暴露：上一站/下一站、接驳徽标等后处理模块据此判定「活站」
        // （共享层其它模块读它，见 shared/station/adjacent-jump.js）
        window.CGO_RETIRED_STATIONS = retired;
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
        offPairs: [],           // 站外换乘对 { host, ghost, ghostIn, ghostOut, freeFrom, peer }（见 build）
        renamed: new Map(), // sid → 原文：被本模块改成旧名的标签，退出时还原
        renameMap: new Map(), // sid → [{ from, to, …, i }]：更名链（mount 时按数据重建，升序）
        scaleCity: null,    // 被临时放宽缩放范围的城市
        prevView: null,     // 接管前的取景
        phantomClickEl: null, // 幽灵点点击拦截的挂载点（#map-content），unmount 时摘掉
        modalObserver: null, // 监听导出浮层的 open 变化（关掉浮层即取消导出），unmount 时断开
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

    /**
     * 核心路径采样结果缓存（线路 ID → 折线）。
     * ⚠️ 这层缓存不是锦上添花：camAt 的**波前跟随**要沿路径连续取点，若每帧都重新采样，
     * 就是每帧一次 getTotalLength + 最多 2000 次 getPointAtLength —— 实测每帧 50~66ms，
     * 「停运 / 恢复」这两类转换拍会肉眼可见地卡顿、像被快放。演示期间核心的线路几何不变，
     * 按线路缓存即可（mount / unmount 时清空，换城市后重新采样）。
     * 采样失败（路径尚未渲染）不写缓存，下次重试。
     */
    const pathCache = new Map();

    /** 把核心的线路路径按约 2px 一步采样成折线 —— 这样子段自带倒角，与底图分毫不差 */
    function sampleCorePath(lineId) {
        if (pathCache.has(lineId)) return pathCache.get(lineId);
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
        pathCache.set(lineId, pts);
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

    /**
     * 导出视频能力检测：WebCodecs `VideoEncoder` 是硬性前提（mp4-muxer 是纯 JS、可随时注入，
     * 不构成前提）。设备 / 浏览器不支持时**整个导出入口都不渲染** —— 露一个点了报错的
     * 下载按钮不如不露。
     */
    const canExportVideo = () => typeof window !== "undefined" && typeof window.VideoEncoder === "function";

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
                        // 事件级原文标题另存一份（不掺操作覆盖）：事件清单按**事件**列时用它
                        evTitle: ev.title || "",
                        evIdx: evIdx,
                        opIdx: opIdx
                    });
                    // 向后兼容旧写法 `line-open`：归一进 line-state（state 缺省即 open）。
                    // 这条承诺必须落在运行期，否则旧格式的操作会被 build 的分支静默忽略。
                    if (rec.kind === "line-open") { rec.kind = "line-state"; rec.state = "open"; }
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


    /* ======================================================================
     * 跨文件共享层（本文件 = 内核）：状态计算层与视频导出层两个扩展文件
     * 按加载顺序经 window.CGoOpeningHistoryShared 注入 —— 它们晚于本文件加载，
     * 本文件末尾 Object.assign 之后即可用；本文件只在运行时（mount / 导出）取用。
     * ==================================================================== */
    const SHARED = (window.CGoOpeningHistoryShared = window.CGoOpeningHistoryShared || {});

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
     * rdot 国铁标签「接驳前显示、接驳后藏」（数据意图 `_rdotHideAfterLink`，见 shared/base/rdot-label.js）：
     * 「有没有接驳」带时间维度 —— 接驳对端（轨交站）**已入场**才算接驳开通，此前国铁站名
     * 强制显示（如长春西站 2012 启用、2 号线 2018 才到：2018 前显示、之后收起）。
     * 对端集合与判定表**复用 rdot-label.js 的同一套实现**（peersOf 读三张换乘登记表：
     * 免费 / 付费 / 站外连线），底图与演示因此天然同口径，不再各读一半漏掉付费映射。
     * 用类名控制（`.cgo-oh-rdot-hidden` 只在演示态有样式），退出演示自动还原。
     */
    function syncRdotLabels() {
        const api = window.CGoRdotLabel;
        if (!api) return;   // 该模块未接入（main.html 会全局引入；缺失时退化为「始终显示」）
        const st = stationMap();
        const tables = api.transferTables();
        Object.keys(st).forEach((sid) => {
            const s = st[sid];
            if (!s || s.type !== "rdot" || !s._rdotHideAfterLink) return;
            const linked = api.peersOf(sid, tables).some((p) => {
                const q = st[p];
                // 对端**只要已入场**就算接驳成立 —— 不挑形态（dot / tsf / 连在建的 no 都算）：
                // 那条线的车站已经画在图上，国铁名就该让位给轨交站名
                // （龙嘉 / 九台南的接驳线在建，对端以 no 形态入场后标签即收起）。
                return !!q && q.type !== "rdot" && state.shown.has(p);
            });
            const el = document.getElementById("label_" + sid);
            if (el) el.classList.toggle("cgo-oh-rdot-hidden", linked);
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
     *
     * ⚠️ 为什么**不**把这条线写进 `data_virtual_transfers.js` 的 `VIRTUAL_CONNECT_LINES`：
     *    那张表是「**当前线网**的站外连通」，核心会把它常驻画在底图上，而幽灵点在底图上是
     *    隐藏的（见 rdot 同款的 `:not(.cgo-oh-stage)` 规则族）—— 写进去就会多出一条连到
     *    「看不见的点」的线；它还会被行程规划当作站外换乘边消费，而幽灵点并不是可规划车站。
     *    所以这条线只能由演示层自画、跟着幽灵点的进出走。
     */
    function syncOffStationLinks(stepIdx, tNow, settled) {
        const group = layer()?.querySelector(".cgo-oh-offlink");
        if (!group) return;
        const pairs = state.offPairs || [];
        if (!pairs.length) {
            if (group.childNodes.length) group.replaceChildren();
            group.__links = null;
            group.__sig = "";
            return;
        }
        // 样式随「是否已开通站内换乘」切换：核心对两类连接给了两套画法，
        // 付费出站连通三层（底色 3.25 → #78848b 2.25 → 底色 0.85），
        // 免费换乘两层（底色 2.75 → #78848b 1.5）—— 见 core/script.js 的
        // VIRTUAL_CONNECT_LINES / VIRTUAL_FREE_CONNECT_LINES。
        // ⚠️ 切画法的阈值 = 开通站内换乘那个**动作**的步号（p.freeFrom），不是日期 ——
        //    一条事件有多拍时按日期会在当天第一拍、对应动作还没开演就先改了。
        // ⚠️ 同一拍内还要**等镜头到位**再切：该拍的起笔运镜（到 headEnd 结束）把镜头移到
        //    这座站之前保持付费画法，镜头落定后才收紧成免费画法 —— 早先按拍号一刀切，
        //    拍一开始连线就变了，看上去像画面别处出了什么事（用户验收反馈）。
        // ⚠️ 传进来的必须是**当前拍号**（applyFrame 给 rec.i）与**当前时刻**（t）：
        //    不能用 `state.index`：后者只在暂停 / 跳转时写，播放途中一直是旧值 ——
        //    于是整段播放里画法永远不切，表现就是「开通站内换乘那一拍看不出任何变化」。
        const rec = ((state.timeline && state.timeline.list) || []).find((r) => r.i === stepIdx);
        const free = pairs.map((p) => {
            if (p.freeFrom == null || p.freeFrom < 0) return false;
            if (stepIdx !== p.freeFrom) return stepIdx > p.freeFrom;
            // 同一拍内：镜头到位（headEnd）后**再停一小段**才切 —— 旧状态先停住让人看清，
            // 再收紧成新画法（用户验收反馈：「镜头移到位后在旧状态停住一小段再变新状态」）。
            // ⚠️ 但**跳转 / 落定**（settle）时必须直接切到该步的最终画法：跳转落在 `growEnd`，
            //    而纯形态步没有生长几何（growEnd ≈ headEnd），永远达不到 +FREE_SWITCH_HOLD 的门槛。
            if (settled) return true;
            return rec ? tNow >= rec.headEnd + FREE_SWITCH_HOLD : true;
        });
        const sig = free.join(",");
        // 除 sig 之外还要比对子节点数：clearMarks / 换城市等路径可能只清了 DOM 而没清缓存，
        // 只比 sig 会把「已清空但缓存还在」误判成「不用重建」（表现：连线全都不见）。
        if (group.__sig !== sig || !group.__links || group.childNodes.length !== group.__links.length) {
            group.__sig = sig;
            const st = stationMap();
            const links = [];
            group.replaceChildren();
            pairs.forEach((pair, k) => {
                // 只有**同行还有另一个站台**（peer 是另一个幽灵点）才画连线：只配了一个幽灵点的
                // 车站（双丰 / 长春西站）压根没有「两座站台相望」这回事，回落主点只会画出一条
                // 连到已被隐藏主点的多余接头（两点本就几乎同位）。
                if (!pair.peer) return;
                // 两端都在场（幽灵点 ↔ 同组的另一个幽灵点）才画
                const a = st[pair.ghost], b = st[pair.peer];
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
                links.push({ pair: pair, g: g });   // 与 childNodes 一一对应（跳过的 pair 不占位）
            });
            group.__links = links;
        }
        (group.__links || []).forEach((e) => {
            e.g.style.display = (isOnCanvas(e.pair.ghost) && isOnCanvas(e.pair.peer)) ? "" : "none";
        });
    }

    /**
     * 出站换乘期间**主点让位**：同一座车站的两条线各有站台、只能出站换乘的那段时期，
     * 交叉点上的共用图元（图元 / 站名 / 呼出线）整体隐去 —— 该站此刻的呈现就是幽灵点
     * （它按「避开交叉点」标定，停在各自线路的走向上）。到幽灵点移出那一拍（`ghostOut`），
     * 主点按正式形态回来。只挂类名、样式仅在演示态生效（见 opening-history.css 的
     * `.cgo-oh-host-off`）。
     */
    function syncPhantomHosts(stepIdx) {
        // 同一站可能有多条线的幽灵点（各自的进出步不同）—— 取**并集**：
        // 只要还有一座站台的幽灵点在场上，主点就要让位（不能按后一条线把它提前放回来）。
        const off = new Map();
        (state.offPairs || []).forEach((p) => {
            if (!p.host || p.ghostIn == null || p.ghostOut == null || p.ghostOut < 0) return;
            const inSpan = stepIdx >= p.ghostIn && stepIdx < p.ghostOut;
            off.set(p.host, (off.get(p.host) || false) || inSpan);
        });
        off.forEach((hidden, host) => {
            ["node_", "label_"].forEach((prefix) => {
                document.getElementById(prefix + host)?.classList.toggle(HOST_CLASS, hidden);
            });
            calloutOf(host)?.classList.toggle(HOST_CLASS, hidden);
        });
        // 让位状态一变，**已归档的线路端点**与**已画段落（含镂空双线）**都要跟着挪：让位期端点
        // 落在幽灵点上、让位结束后再挪回主点。**每帧都跑**（内部先比对 d、只在真的不同才写属性）——
        // 早先只用「集合签名」当闸门，结果跳转 / 回拖后签名虽变、视觉却可能错过那一帧的重写。
        realignArchivedPaths(stepIdx);
        realignPiecePaths(stepIdx);
    }

    /**
     * 幽灵点的**形态**跟着它所属那条线在本站的状态走：该线在本站停运（甩站改造 / 整段停运）
     * → 转「未开通」圈，恢复运营 → 转回普通站。两座站台之间的付费换乘线**不受影响**
     * （站台还在、只是列车不停，见 syncOffStationLinks）。解放桥 3 号线侧 2019-06-01 即此例。
     */
    function syncGhostForms(stepIdx, tNow, settled) {
        // ⚠️ 同一拍内要**等镜头到位、再停一小段**才切形态（与 syncOffStationLinks 的免费切换同一手法）：
        //    该拍的起笔运镜把镜头移到这座站之前，先让人看清「旧状态」（站台照常），
        //    镜头落定后再转成未开通圈 —— 否则镜头还在飞、站台已经变了。
        const rec = ((state.timeline && state.timeline.list) || []).find((r) => r.i === stepIdx);
        /** 某个停运区间的**起点步**是否已「到位」：过了该步直接算到位；同一步则等 headEnd + 停顿 */
        const arrived = (startIdx) => {
            if (stepIdx > startIdx) return true;
            if (stepIdx < startIdx) return false;
            // ⚠️ 跳转 / 落定必须直接算到位：跳转落在 `growEnd`，纯形态步（无生长几何）时
            //    growEnd ≈ headEnd，够不到 +FREE_SWITCH_HOLD —— 否则跳过去永远停在旧形态
            if (settled) return true;
            return rec ? tNow >= rec.headEnd + FREE_SWITCH_HOLD : true;
        };
        (state.offPairs || []).forEach((p) => {
            if (!isOnCanvas(p.ghost)) return;
            const down = (p.downSpans || []).some((sp) => arrived(sp[0]) && stepIdx < sp[1]);
            const form = down ? "no" : "dot";
            if (p.__form === form) return;
            p.__form = form;
            const s = stationMap()[p.ghost];
            if (!s) return;
            applyForm({ sid: p.ghost, form: form, dotColor: state.dotColors.get(p.ghost) }, null);
        });
    }

    /**
     * 同一站的两个站台幽灵点带着**同一个站名**（长春站 / 长春站北…）：两个都入场后只留**一个**
     * 站名标签，免得图上并排出现两个一模一样的名字。留先入场的那个（通常即先到线路侧）。
     */
    function syncGhostLabels() {
        const first = new Map();
        (state.offPairs || []).forEach((p) => {
            if (!isOnCanvas(p.ghost)) return;
            const s = stationMap()[p.ghost];
            if (!s) return;
            const key = p.host + "|" + s.cn;   // 同一座站的同名站台才算重复
            if (!first.has(key)) first.set(key, p.ghost);
        });
        (state.offPairs || []).forEach((p) => {
            if (!isOnCanvas(p.ghost)) return;
            const s = stationMap()[p.ghost];
            if (!s) return;
            const dup = first.get(p.host + "|" + s.cn) !== p.ghost;
            document.getElementById("label_" + p.ghost)?.classList.toggle(DUP_LABEL_CLASS, dup);
        });
    }

    /**
     * 某站在**这一步**此刻「可见的图元」坐标：处于让位区间内（该站由幽灵点呈现）时返回幽灵点
     * 坐标，否则返回 null（照旧用主点坐标）。
     * ⚠️ 判据必须是**步号**（ghostIn ≤ stepIdx < ghostOut），不能看 `isOnCanvas(幽灵点)` ——
     *    幽灵点的入场时刻由「笔到人到」定在拍内某处（4 号线地下段的 0124 就在生长**终点**才
     *    入场），按弹出判会让整段生长的端点一直挂在那个已被隐藏的主点上。
     */
    function ghostPointAt(sid, stepIdx) {
        if (!sid || stepIdx == null) return null;
        const p = (state.offPairs || []).find((q) => q.host === sid
            && q.ghostIn != null && q.ghostOut != null
            && stepIdx >= q.ghostIn && stepIdx < q.ghostOut);
        if (!p) return null;
        const s = stationMap()[p.ghost];
        return s && Number.isFinite(s.x) ? s : null;
    }

    /**
     * 该站**此刻实际可见的图元**坐标：出站换乘期主点让位给了幽灵点 —— 线路端点、站外连通线
     * 都该跟着幽灵点走，否则线头悬在（已被隐藏的）主点位置、和幽灵点错开一小段。
     */
    function visiblePointOf(sid, stepIdx) {
        const st = stationMap();
        const s = ghostPointAt(sid, stepIdx) || st[sid];
        return s && Number.isFinite(s.x) ? s : null;
    }

    /**
     * 把折线的**首尾**对齐到「此刻可见的图元」：按**端点站 ID**（`headSid` / `tailSid`）
     * 精确匹配，只有该站此刻正处于让位区间时才动它，中间的点一律不动。
     * ⚠️ 光把首点坐标换成幽灵点是不够的：**下一个点还停在主点附近**，折线会「回头」突刺
     *    一小段 —— 画面上就是用户报的「线头」（实测归档 d：`M202 864 L184.7 864 L186.7 …`）。
     *    故这里按幽灵点在折线上的**投影弧长切开**：幽灵点在折线外侧（「补」的情况）接一段，
     *    在里侧（「剪」的情况）把多出来的裁掉。
     */
    function alignEndsToVisible(pts, headSid, tailSid, stepIdx) {
        if (!pts || pts.length < 2) return pts;
        const a = ghostPointAt(headSid, stepIdx);
        const b = ghostPointAt(tailSid, stepIdx);
        if (!a && !b) return pts;
        let out = pts;
        if (a) out = trimEndToPoint(out, a, true);
        if (b) out = trimEndToPoint(out, b, false);
        return out;
    }

    /**
     * 把折线的**首端**（`isHead`）或**末端**截/接到给定点上：按该点在折线上的投影弧长切开，
     * 投影点由 `slicePath` 插值出来，因此新端点正好落在折线上、不会「回头」。
     * 投影落在端点之外（该点在折线延长方向）时不去切，直接接一段（「补路径」的观感）。
     */
    function trimEndToPoint(pts, at, isHead) {
        const total = segLength(pts);
        if (!(total > 0)) return pts;
        const s = projectOnPath(pts, at);
        if (s == null) return pts;
        const EPS = 0.5;   // 投影落在端点 0.5px 内即视为「在延长方向上」
        if (isHead) {
            if (s <= EPS) return [{ x: at.x, y: at.y }].concat(pts);
            const seg = slicePath(pts, s, total);
            return (seg && seg.length > 1) ? seg : pts;
        }
        if (s >= total - EPS) return pts.concat([{ x: at.x, y: at.y }]);
        const seg = slicePath(pts, 0, s);
        return (seg && seg.length > 1) ? seg : pts;
    }

    /** 已归档段落（done 层）的端点重写：按生成时留存的原始折线与端点站 ID 重算 d */
    function realignArchivedPaths(stepIdx) {
        const g = doneGroup();
        if (!g) return;
        g.querySelectorAll("path[data-no]").forEach((el) => {
            const raw = el.__rawPts;
            if (!raw || raw.length < 2) return;
            const d = toD(alignEndsToVisible(raw, el.__headSid, el.__tailSid, stepIdx));
            if (el.getAttribute("d") !== d) el.setAttribute("d", d);
        });
    }

    /**
     * 「已画段落」注册表（`state.segPieces`）里的节点也要跟着让位状态改端点 —— 这些是段形态转换
     * （镂空双线 / 恢复实线 / 空白）的对象，还可能由 `convertRange` 从原段切出来。早先只重写了
     * 归档层的 `path[data-no]`，镂空盖面与切出来的碎片全被漏掉（用户反馈「未开通的双线两种
     * 情况都没有正确处理」）。这里按各段自己留存的端点站 ID 重算 d，长度变了就让它下次重算。
     */
    function realignPiecePaths(stepIdx) {
        (state.segPieces || []).forEach((pc) => {
            if (!pc.pts || pc.pts.length < 2) return;
            const d = toD(alignEndsToVisible(pc.pts, pc.headSid, pc.tailSid, stepIdx));
            let changed = false;
            pc.nodes.forEach((n) => {
                if (n.getAttribute("d") !== d) { n.setAttribute("d", d); changed = true; }
            });
            if (changed) pc.len = 0;   // 长度可能变了，下次 pieceLen 重算
        });
    }

    /**
     * **生长中**那一段（live 层）的端点也要逐帧对齐到「此刻可见的图元」：幽灵点常常在
     * 生长**途中**才入场（出生时刻绑着主点在当拍的弹出），而 path 节点只在**该拍首次**
     * 创建时对齐过一次 —— 于是端点停在主点坐标上、与幽灵点错开一小段（用户验收反馈
     * 「生长动画用的路径好像还是未经调整的路径」）。
     * 逐段按原折线（`m.pts`）重算 d，只在真的不同时才写属性；长度随之变化时同步 dasharray，
     * 整步的已画长度基准（`__len` 与各段 `start`）一并刷新。
     */
    function realignLiveSegs(g, stepIdx) {
        let acc = 0;
        (g.__segs || []).forEach((m) => {
            if (m.pts && m.pts.length > 1) {
                const d = toD(alignEndsToVisible(m.pts, m.headSid, m.tailSid, stepIdx));
                if (m.node.getAttribute("d") !== d) {
                    m.node.setAttribute("d", d);
                    try { m.len = m.node.getTotalLength() || m.len; } catch (e) { /* 用折线长度兜底 */ }
                    m.node.style.strokeDasharray = m.len + " " + m.len;
                }
            }
            m.start = acc;
            acc += m.len;
        });
        g.__len = acc;
    }

    /**
     * 核心画的**站外连通线**（`.virtual-connectors`，rdot ⇄ 轨交站等）：端点在演示里要跟着
     * 「此刻可见的图元」走 —— 出站换乘期那座站的图元是幽灵点，线就该连到幽灵点上。
     * 核心给的是直线（`M x y L x y`），所以按端点坐标直接重写 d 即可，不必复刻任何曲线算法。
     */
    function syncConnectorEnds(stepIdx) {
        const group = document.querySelector("#lines-layer .virtual-connectors");
        if (!group || !group.children.length) return;
        const conns = typeof VIRTUAL_CONNECT_LINES !== "undefined" && Array.isArray(VIRTUAL_CONNECT_LINES)
            ? VIRTUAL_CONNECT_LINES : [];
        if (!conns.length) return;
        conns.forEach((c, i) => {
            const a = visiblePointOf(c.from, stepIdx);
            const b = visiblePointOf(c.to, stepIdx);
            if (!a || !b) return;
            const d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
            for (let k = 0; k < 3; k++) {
                const el = group.children[i * 3 + k];
                if (el && el.getAttribute("d") !== d) el.setAttribute("d", d);
            }
        });
    }

    /**
     * 演示中点击**幽灵点**（站台级历史图元，如 4 号线侧的「卫星路」站台）：重定向到它在
     * 底图上的对应车站（那座车站今天叫「职业技术大学」）。
     * 幽灵点不在任何线路站序里 —— 核心的选站逻辑拿不到它的线路信息，面板只会渲染出一座
     * 空站台；而用户点它想看的是**那座真实的车站**。故在**捕获阶段**拦下这次点击，
     * 改选 `of` 指向的主点（`state.offPairs` 的 host）。
     */
    function onPhantomClick(e) {
        const el = e.target && e.target.closest ? e.target.closest("[id^='node_'],[id^='label_']") : null;
        if (!el) return;
        const sid = el.id.replace(/^(node_|label_)/, "");
        const pair = (state.offPairs || []).find((p) => p.ghost === sid);
        if (!pair || typeof window.selectStation !== "function") return;
        e.stopPropagation();
        e.preventDefault();
        window.selectStation(pair.host);
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
        const marks = [POP_CLASS, DOT_CLASS, ALWAYS_CLASS, NO_CLASS, NO_SHAPE_CLASS, GONE_CLASS, HOST_CLASS];
        host?.querySelectorAll(marks.map((c) => "." + c).join(", "))
            .forEach((el) => el.classList.remove(...marks));
        host?.querySelectorAll("." + NO_ICON_CLASS + ", ." + DOT_ICON_CLASS).forEach((el) => el.remove());
        host?.querySelectorAll("#lines-layer .virtual-connectors ." + ON_CLASS)
            .forEach((el) => el.classList.remove(ON_CLASS));
        // 站外换乘虚线也一并撤掉（退出演示后底图上不该残留）。
        // ⚠️ 必须**连缓存一起清**：连线组靠 `__sig` / `__links` 做增量更新，只清 DOM 的话，
        //    快进 / 回溯（jumpTo → clearMarks）后 sig 没变 → syncOffStationLinks 以为「不用重建」，
        //    可子节点实际已被清空、`__links` 指向的也是脱离文档的死节点 —— 连线于是全部消失，
        //    直到下一次涉及幽灵站 / 连线的操作把 sig 改掉才恢复。
        const offG = layer()?.querySelector(".cgo-oh-offlink");
        if (offG) { offG.replaceChildren(); offG.__sig = ""; offG.__links = null; }
        // 幽灵点（站台级）的**形态缓存**同理必须失效：上面刚把节点上的形态类摘掉，
        // 缓存还记着旧形态 → syncGhostForms 判「形态没变」而跳过重刷，节点就再也补不回来。
        // 表现：从较晚的状态（幽灵点已移出）回跳到停运期，幽灵点不再回到「未开通圈」
        // （实测 2020-09-06 → 2019-06-01 复现；从更早的步回跳时缓存是 dot、与 no 不同，才没暴露）。
        (state.offPairs || []).forEach((p) => { p.__form = null; });
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
            const k = Math.max(SHARED.export.EXPORT.width / hr.width, SHARED.export.EXPORT.height / hr.height);
            const sw = Math.max(120, SHARED.export.EXPORT.width / k), sh = Math.max(120, SHARED.export.EXPORT.height / k);
            vw = Math.min(vw, sw);
            vh = Math.min(vh, sh);
            left = hr.width / 2 - vw / 2;
            top = hr.height / 2 - vh / 2;
            // 进度卡是**画在导出画面里**的固定浮层，构图必须给它让位：卡在哪一侧，就把那一侧的一个
            // 卡宽从有效取景里扣掉 —— 取景中心随之偏到另一侧，卡面便只压在留白上，不会压住站名。
            // ⚠️ 让位必须做在**取景**这一层（camForPoint / camForBox 都读这里）。早先在画帧时把画面
            //    整体平移，等于把算好的构图推出画外，右侧站名就被裁了（收笔取景与全览都中招）。
            // 卡宽是输出像素，除以 k 换回视口像素。
            const pos = (SHARED.export && SHARED.export.cardPos) ? SHARED.export.cardPos() : state.cardPos;
            if (pos && pos !== "off" && state.cardReserve !== false) {
                // 列表卡面时卡片纵向撑满、贴左或贴右，让位就是「扣掉一条卡宽」（onRight 含列表态的 right）
                const onRight = pos === "tr" || pos === "br" || pos === "right";
                const gap = Math.max(0, SHARED.export.CARD.w / k + 4);
                vw = Math.max(120, vw - gap);
                left += onRight ? 0 : gap;
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
            // ⚠️ 批量更名（`renames` 多对）的站**不在** `stations` 里，早先于是掉到下面的
            //    `camForPoint(step.focus)`（只框一站）—— 收笔只取到第一座更名站
            //    （长春「1号线5站更名」就只取了北环城路一脚），演出末站反而在画外。
            const rnIds = (step.renames || []).map((rn) => rn.sid).filter(Boolean);
            if (rnIds.length > 1) {
                const st = stationMap();
                const list = rnIds.map((sid) => st[sid]).filter((s) => s && Number.isFinite(s.x));
                if (list.length > 1) return camForBox(expandBoxByLabels(bboxOf(list), rnIds), 0.94, state.zoom);
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
            // 多站更名的换字逐站落在各停留窗里（500ms < STOP_HOLD），拍尾不再单开换字段；
            // 单对更名保持原节奏：生长后 500ms 淡出换字。
            const renameMs = (step.rename && !multi) ? 500 : 0;
            // 纯形态转换步：起笔取景在**擦除波前起点**（全局大端 tg=1，如 2021-12-31 的
            // 宽平桥侧），收笔在波前终点（小端）——与 camAt 的波前跟随、站点波前同向。
            // 擦除时长与生长同一速度口径：**转换段画布长度 ÷ 运镜速度**（用户设定的 px/s），
            // 不再是固定兜底窗 —— 拖快运镜速度，擦除同步变快。
            const convOnly = !!(convAnims && convAnims.length && !(step.segs && step.segs.length));
            // 混合拍（既有段形态转换、又有真生长，如长春 2021-12-31「恢复段擦除 + 东延段生长」）：
            // 两者必须**串行** —— 先整段擦除 / 还原（镜头只跟恢复段波前），随后镜头落到生长段
            // 起点，再画新段。并行会「一边擦一边长」，且镜头会提前跑去看新段（用户验收反馈）。
            const mixed = !!(convAnims && convAnims.length && step.segs && step.segs.length);
            let convHeadPt = null, convEndPt = null, convLen = 0;
            if (convAnims && convAnims.length) {
                const c = convAnims[0];
                const lo = Math.min(c.s0, c.s1), hi = Math.max(c.s0, c.s1);
                const pts = sampleCorePath(step.lineId);
                if (pts && pts.length > 1) {
                    convHeadPt = pointAt(pts, hi);
                    convEndPt = pointAt(pts, lo);
                    const sliced = slicePath(pts, lo, hi);
                    if (sliced && sliced.length > 1) convLen = segLength(sliced);
                }
            }
            // 转换时长与生长同一速度口径：转换段画布长度 ÷ 运镜速度（用户设定 px/s）。
            // ⚠️ px ÷ (px/s) 得到的是**秒**，必须 ×1000 才是毫秒 —— 早先漏了这个换算，
            //    结果恒被 CONV_MIN（800ms）兜底：整段擦除 / 还原只用 0.8 秒，肉眼可见地「快放」。
            const convDur = convAnims
                ? (REDUCE ? 1 : Math.max(CONV_MIN, convLen / Math.max(1, state.speed || SPEED.def) * 1000))
                : 0;
            const growDur2 = convOnly ? convDur
                : ((convAnims && growDur < CONV_MIN) ? CONV_MIN : growDur);
            // 混合拍：转换占时序**前段**，生长整体后移一个转换窗
            const convT0 = t + head;
            const convEnd = convT0 + convDur;
            const growT0 = mixed ? convEnd : convT0;
            const rec = {
                i: i, step: step,
                from: t,
                headEnd: convT0,
                convT0: convT0,
                convDur: convDur,
                convEnd: convEnd,
                growT0: growT0,
                growEnd: growT0 + growDur2,
                renameEnd: growT0 + growDur2 + renameMs,
                tailEnd: growT0 + growDur2 + renameMs + head,
                end: growT0 + growDur2 + renameMs + head + hold,
                growDur: growDur2,
                phases: phases,
                stops: multi ? stops : null,
                hop: hop,
                convAnims: convAnims,
                // ⚠️ 纯形态转换 / 多站巡览的步骤没有 phases（growDur 可能仍 > 0），
                //    progAtDt 对空表会取到 undefined 的阶段直接抛错（面板滚数即中招），
                //    故回落成「按拍内时间线性推进」。
                progAt: (dt) => (phases.length ? progAtDt(phases, dt)
                    : (growDur2 > 0 ? Math.max(0, Math.min(1, dt / growDur2)) : 1)),
                camFrom: prevCam,
                camHead: camForPoint(convAnims ? (convHeadPt || brushAt(step, 0)) : brushAt(step, 0), state.zoom),
                camGrowEnd: camForPoint(multi ? stops[stops.length - 1]
                    : (convOnly ? (convEndPt || brushAt(step, 1)) : brushAt(step, 1)), state.zoom),
                camTail: camTailOf(step)
            };
            // 站点弹出时刻：
            //   · 段形态转换的站（`convTo`）绑**擦除波前** —— 线擦到哪、站跟到哪，顺序与
            //     线路擦除方向严格一致（波前自 tg=1 端推进，恢复与反向擦除互逆同向），
            //     满足「车站消失或更改的顺序和擦除方向相同」；
            //   · 有画笔推进的「笔到人到」（末尾留 30ms，别让最后一个站压着收笔）；
            //   · 无走向的多站步骤按「停留 → 平移」逐站弹出（idx × hop），单站步骤就在本拍起点弹出。
            rec.pops = [];
            const convPops = [], flowPops = [];
            step.stations.forEach((x) => (x.convTo ? convPops : flowPops).push(x));
            convPops.forEach((x) => {
                // 波前自 **tg=1 端**（收笔端 / 已开通端，如 2021-12-31 恢复段的宽平桥侧）推进：
                // 恢复（→solid）与反向擦除（→hollow/hidden）互逆、同段同向 —— 「从宽平桥开始擦除」。
                // 时刻绑**转换窗**（convT0 + convDur×f）：混合拍里转换占前段，站点也跟着走前段。
                const f = 1 - (x.tg || 0);
                rec.pops.push({ x: x, step: step, t: rec.convT0 + convDur * Math.max(0, Math.min(1, f)) });
            });
            if (phases.length) {
                flowPops.forEach((x) => {
                    rec.pops.push({
                        x: x, step: step,
                        t: rec.growT0 + Math.max(0, Math.min(growDur2 - 30, timeOfProg(phases, x.t)))
                    });
                });
            } else {
                stops.forEach((st2, idx) => {
                    const at = multi ? idx * hop : 0;
                    // 同一站区里分两批演：**旧的（幽灵点）同时撤掉** → 空一个 STOP_STAGGER →
                    // **新的（主点）随后入场**。早先按登记顺序逐个错峰，看起来是「一个元素一个
                    // 元素地撤掉再加上」，缺了「旧的一起走、站台再亮」的整批感（用户验收反馈）。
                    const hasLeave = st2.pops.some((x) => x.mode === "leave" && !x.convTo);
                    st2.pops.forEach((x) => {
                        if (x.convTo) return;
                        const delay = (hasLeave && x.mode !== "leave") ? STOP_STAGGER : 0;
                        rec.pops.push({ x: x, step: step, t: rec.growT0 + at + delay });
                    });
                });
            }
            rec.pops.sort((a, b) => a.t - b.t);
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
            from: t, headEnd: t + head, convT0: t + head, convDur: 0, convEnd: t + head,
            growT0: t + head, growEnd: t + head,
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
            // 段形态转换（停运 / 移除的反向擦除、恢复的擦除还原）：镜头跟**擦除波前** ——
            // 线擦到哪、镜头跟到哪（波前自全局大端 tg=1 向小端推进，与 applyPieceProgress
            // 与站点波前同一方向），而不是一站一停地巡览。
            // 混合拍（转换+生长一拍）里转换占时序**前段**（[convT0, convEnd]），这段时间
            // 镜头同样只跟恢复段波前；生长段自 convEnd 才起步，镜头再落到它的起点。
            if (r.convAnims && r.convAnims.length && r.convDur > 0 && t < r.convEnd) {
                const e = Math.max(0, Math.min(1, (t - r.convT0) / r.convDur));
                const c0 = r.convAnims[0];
                const lo = Math.min(c0.s0, c0.s1), hi = Math.max(c0.s0, c0.s1);
                const at = hi - (hi - lo) * e;
                const pts = sampleCorePath(r.step.lineId);
                const p = (pts && pts.length > 1) ? pointAt(pts, at) : null;
                return (p && camForPoint(p, state.zoom)) || r.camHead;
            }
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
    function showStation(x, step, stepIdx) {
        if (x.mode === "leave") { leaveStation(x.sid); return; }
        state.shown.set(x.sid, x.form);
        if (x.dotColor) state.dotColors.set(x.sid, x.dotColor);
        applyForm(x, step.color);
        // 旧名不在这里切 —— 统一交给每帧的 syncRenameNames（按步号判，同日多事件也不会错）
        popStation(x.sid);
        state.activePops.push({ sid: x.sid, t0: state.frameT });
        // 让位期这座站由幽灵点呈现（主点图元已隐去）：涟漪是按**图元**位置扩散的，画在那个
        // 已隐藏的主点坐标上会像「有个看不见的站冒出来」（用户验收反馈）。幽灵点自己的涟漪照旧。
        if (!ghostPointAt(x.sid, stepIdx)) {
            // 未开通形态的涟漪用「未开通色」，别拿线路色误导人
            ripple(x, x.form === "no" ? (themeVar("--not-open-color") || step.color) : step.color);
        }
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
                node.setAttribute("d", toD(alignEndsToVisible(sg.pts, sg.headSid, sg.tailSid, step.no)));
                node.setAttribute("stroke", step.color);
                node.setAttribute("stroke-width", "5.4");   // 与核心 .line-visual-inner 同宽
                node.setAttribute("vector-effect", "non-scaling-stroke");
                let len = sg.len;
                try { len = node.getTotalLength() || len; } catch (e) { /* 用折线长度 */ }
                node.style.strokeDasharray = `${len} ${len}`;
                node.style.strokeDashoffset = String(len);
                made.push({ node: node, len: len, start: acc, pts: sg.pts, headSid: sg.headSid, tailSid: sg.tailSid });
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
        // 混合拍的转换阶段（t < growT0）还不该画生长段 —— 生长自 convEnd 才起步
        const growing = rec.growDur > 0 && t >= rec.growT0 && t < rec.growEnd;
        if (live && !growing) live.replaceChildren();
        if (live && growing) {
            const g = ensureGrowPath(rec.step);
            if (g) {
                realignLiveSegs(g, rec.i);   // 端点按步号对齐（让位期连到幽灵点，不受弹出时刻影响）
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
                showStation(p.x, r.step, r.i);
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

        // ── 站外换乘：连线两端都在画布上才画；主点在换乘期让位给幽灵点 ──
        syncOffStationLinks(rec.i, t, settle);   // 连线画法（付费/免费）：跳转时直接按最终画法
        syncPhantomHosts(rec.i);
        syncGhostForms(rec.i, t, settle);   // 幽灵点形态（本线停运 → 未开通圈；播放时等镜头到位 + 停一小段）
        syncGhostLabels();       // 同站同名幽灵点：只留一个站名标签
        // ── 底图的「站外连通」连线（核心画在 #lines-layer .virtual-connectors 里的那批）：
        //    两端车站都入场了才画。⚠️ 必须**逐帧**算 —— jumpTo / replay 走 clearMarks 时会把这些
        //    线的类拔掉，只在站点弹出时调一次的话，回退到前序事件后线就再也不出现（用户实测
        //    到的「点前序事件后虚拟换乘线都不见了」）。成本很低：只对几十个 path 做 class 开关。
        syncVirtualConnectors();
        // 站外连通线的端点跟着「此刻可见的图元」走（出站换乘期连到幽灵点上）
        syncConnectorEnds(rec.i);
        syncRdotLabels();   // rdot 国铁标签：接驳前显示、接驳后藏（按此刻接驳状态）

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
    function makeSegPiece(lineId, s0, s1, pts, style, color, proto, headSid, tailSid) {
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
        return {
            lineId: lineId, s0: s0, s1: s1, pts: pts,
            headSid: headSid, tailSid: tailSid,
            style: style, color: color, nodes: nodes
        };
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
     *   solid → hollow  彩色不动，盖面自**尾端**（tg=1）长出 —— 观感即「实线自尾端起逐渐变镂空」；
     *   hollow → solid  盖面自**尾端**（tg=1）退去 —— 实线自尾端（已开通端）长回，
     *                   与擦除波前同向（如 2021-12-31 从宽平桥方向恢复）；
     *   *    → hidden  整段自**尾端**反向擦除 —— 语义「撤回」，与生长对偶。
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
            // 切片端点站 ID：只有与**原段端点重合**的那一侧才继承（切出来的碎片端点不是车站）
            const cut = (x0, x1, hSid, tSid) => makeSegPiece(lineId, x0, x1,
                slicePath(pc.pts, x0 - pc.s0, x1 - pc.s0), pc.style, pc.color, proto, hSid, tSid);
            const made = [];
            if (a > pc.s0 + 0.05) made.push(cut(pc.s0, a, pc.headSid, null));
            // ⚠️ 切出来的**中段**若贴着原段的某一端（极常见：停运段 / 恢复段正好从原段端点起算），
            //    那一端仍然是**车站**端点，必须继承原段的站 ID —— 早先一律给 null，于是
            //    「未开通的双线」（2021-03-08 停运段）与「恢复的实线」（2021-12-31 还原段）
            //    在让位站的端点永远不跟着幽灵点走、线头悬空（用户验收反馈的正是这两处）。
            const mid = makeSegPiece(lineId, a, b, slicePath(pc.pts, a - pc.s0, b - pc.s0),
                pc.style, pc.color, proto,
                a <= pc.s0 + 0.05 ? pc.headSid : null,
                b >= pc.s1 - 0.05 ? pc.tailSid : null);
            touched.push({ pc: mid, from: pc.style, to: style });
            made.push(mid);
            if (b < pc.s1 - 0.05) made.push(cut(b, pc.s1, null, pc.tailSid));
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
     * 样式按**本拍转换窗**的进度补间 —— 与站巡览并行，镜头逐站停的同时线自收笔端撤回。
     * 混合拍里转换窗（convT0 → convEnd）只占本拍前段，生长段在此之前保持起始态（e=0）。
     */
    function applyConvs(rec, t) {
        const anims = rec.convAnims;
        if (!anims || !anims.length) return;
        const e = rec.convDur > 0 ? Math.max(0, Math.min(1, (t - rec.convT0) / rec.convDur)) : 1;
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
            p.setAttribute("d", toD(alignEndsToVisible(sg.pts, sg.headSid, sg.tailSid, step.no)));
            // 原始折线 + 端点站 ID 留一份：让位状态变化时按它重算端点（见 realignArchivedPaths）
            p.__rawPts = sg.pts;
            p.__headSid = sg.headSid;
            p.__tailSid = sg.tailSid;
            p.setAttribute("stroke", step.color);
            p.setAttribute("stroke-width", "5.4");
            p.setAttribute("fill", "none");
            p.setAttribute("vector-effect", "non-scaling-stroke");
            group.appendChild(p);
            if (Number.isFinite(sg.s0) && Number.isFinite(sg.s1)) {
                // 注册表按全局弧长正向存（flip 的段翻回来），形态转换的切片才对得上；
                // 节点就是刚画的这条 path 本尊（形态转换直接动它）。
                // ⚠️ 端点站 ID 也跟着 flip 翻过来：注册表里的 pts 是正向的（首端对应 lo 端）。
                state.segPieces.push({
                    lineId: step.lineId,
                    s0: Math.min(sg.s0, sg.s1), s1: Math.max(sg.s0, sg.s1),
                    pts: sg.flip ? sg.pts.slice().reverse() : sg.pts,
                    headSid: sg.flip ? sg.tailSid : sg.headSid,
                    tailSid: sg.flip ? sg.headSid : sg.tailSid,
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
            // 四笔计数（两两相对）：新增 ↔ 拆除、升级 ↔ 降级 —— 面板状态行与导出进度卡同源
            counts: isRename ? {} : {
                enter: step.enterCount != null ? step.enterCount : (step.stations ? step.stations.length : 0),
                remove: step.removeCount || 0,
                up: step.upgradeCount || 0,
                down: step.downgradeCount || 0
            }
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
            state.listFollow = true;   // 事件一换，重新开启清单跟随（此前若被手动滚动关掉）
            syncNow(m.i);
            // 清单按**事件**列：高亮当前拍所属的那一条（同一事件的各拍都点亮它）
            const curEv = state.steps[m.i] ? state.steps[m.i].evIdx : -1;
            state.els.list.querySelectorAll(".cgo-oh-item").forEach((li) => {
                li.classList.toggle("is-active", Number(li.dataset.ev) === curEv);
                li.classList.toggle("is-done", Number(li.dataset.go) <= m.i + 1);
            });
            // 正在播放的这一行自己滚进可视区（只滚清单自身，不牵动面板与页面）；
            // 用户手动滚动清单期间暂停跟随（见 list 的 scroll 监听）
            if (state.listFollow !== false) scrollListToActive(true);
        }
    }

    /**
     * 把清单里 `.is-active` 的那一行摆到**可视区中下 1/3**（约 62% 高度处），并平滑滚过去。
     * 这样它下方自然留住 1~2 行「还没发生」的事件 —— 看得出后面还有戏，而不是贴着底边一格一格蹭。
     * 首尾处由浏览器自动夹住滚动量（`scrollTop` 越界会被 clamp）。
     * 用两端的 `getBoundingClientRect` 算相对偏移，**不用 offsetTop** —— 后者的参照是
     * offsetParent（面板里那层定位祖先），拿它跟 `list.scrollTop` 直接比会算错。
     * 清单没露出高度时（面板停在信息区那一态）直接跳过。
     * `smooth` 走平滑滚动（播放跟随），并记一个时间窗把随之而来的 scroll 事件挡掉 ——
     * 否则程序自己的滚动会被当成「用户手动滚动」，把跟随关掉。
     */
    function scrollListToActive(smooth) {
        const list = state.els && state.els.list;
        if (!list || !list.clientHeight) return;
        const li = list.querySelector(".cgo-oh-item.is-active");
        if (!li) return;
        const lr = list.getBoundingClientRect();
        const ar = li.getBoundingClientRect();
        const targetY = lr.top + lr.height * 0.62;   // 中下 1/3
        const anchor = ar.top + ar.height / 2;
        const delta = anchor - targetY;
        if (Math.abs(delta) < 6) return;             // 已在位（容差内）不滚，免得每拍都抖一下
        const to = list.scrollTop + delta;
        if (smooth) {
            state.listAutoScrollUntil = performance.now() + 600;
            list.scrollTo({ top: to, behavior: "smooth" });
        } else {
            list.scrollTop = to;
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
                        <span>运营车站 <b data-oh="stations">0</b> 座</span>
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
                        ${canExportVideo() ? `
                        <button type="button" class="cgo-mt-quick cgo-oh-icon-btn" data-oh="exportToggle" title="导出视频" aria-pressed="false">
                            <cgo-icon name="download" size="14"></cgo-icon>
                        </button>` : ""}
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
                            <label>卡面</label>
                            <div class="cgo-oh-card-modes" data-oh="expMode" role="group" aria-label="进度卡内容（两项可分别开关，都关则不显示卡片）">
                                <button type="button" class="cgo-mt-quick cgo-oh-card-btn is-on" data-face="summary" aria-pressed="true" title="显示当前事件的摘要">
                                    <cgo-icon name="card" size="14"></cgo-icon><span>当前事件</span>
                                </button>
                                <button type="button" class="cgo-mt-quick cgo-oh-card-btn" data-face="list" aria-pressed="false" title="显示事件清单（卡片纵向撑满）">
                                    <cgo-icon name="view-list" size="14"></cgo-icon><span>事件列表</span>
                                </button>
                            </div>
                        </div>
                        <div class="cgo-oh-field" data-oh="expCardField">
                            <label>位置</label>
                            <div class="cgo-rt-need-opts" data-oh="expCard" role="group" aria-label="进度卡位置">
                                <!-- 只开「当前事件」：四角；开了「事件列表」：卡片纵向撑满，只剩左右。
                                     两个开关都关时整行隐藏（不显示卡片，位置也就无从谈起）。 -->
                                <button type="button" class="cgo-rt-need-opt is-on" data-for="summary" data-card="br">右下</button>
                                <button type="button" class="cgo-rt-need-opt" data-for="summary" data-card="bl">左下</button>
                                <button type="button" class="cgo-rt-need-opt" data-for="summary" data-card="tr">右上</button>
                                <button type="button" class="cgo-rt-need-opt" data-for="summary" data-card="tl">左上</button>
                                <button type="button" class="cgo-rt-need-opt" data-for="list" data-card="right">右</button>
                                <button type="button" class="cgo-rt-need-opt" data-for="list" data-card="left">左</button>
                            </div>
                        </div>
                        <div class="cgo-oh-exp-actions">
                            <button type="button" class="cgo-mt-launch" data-oh="expStart">导出 MP4</button>
                        </div>
                    </div>
                </div>
                <ul class="cgo-oh-list"></ul>
                <p class="cgo-oh-note">演示只覆盖有开通记录的区段，底图线网在放映期间由本演示接管，关闭后恢复。</p>
                <!-- 导出进度走 CGoUI 的 <cgo-modal> 浮层：面板本身可被拖动 / 缩放 / 滚动，
                     进度与取消放在浮层里就不会跟着乱动（用户验收反馈）。
                     ⚠️ 不写 close-on-overlay：Boolean 属性「存在即真」，不写才是「点遮罩不关」。 -->
                <cgo-modal data-oh="expModal" title="正在导出视频">
                    <dl class="cgo-oh-exp-meta">
                        <div><dt>事件范围</dt><dd data-oh="expRange">—</dd></div>
                        <div><dt>运镜速度</dt><dd data-oh="expSpeed">—</dd></div>
                        <div><dt>放大倍数</dt><dd data-oh="expZoom">—</dd></div>
                        <div><dt>当前事件</dt><dd data-oh="expNow">—</dd></div>
                    </dl>
                    <div class="cgo-oh-exp-track"><div class="cgo-oh-exp-bar" data-oh="expBar"></div></div>
                    <p class="cgo-oh-exp-status" data-oh="expStatus"></p>
                    <div class="cgo-oh-exp-modal-actions">
                        <button type="button" class="cgo-mt-quick" data-oh="expCancel">取消导出</button>
                    </div>
                </cgo-modal>
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
        // 刚展开清单：等这一帧布局稳定后再把当前拍滚进视野（clientHeight 此刻才有值）
        if (listOn) requestAnimationFrame(scrollListToActive);
    }

    /**
     * 事件清单的分组数据（同一事件的多拍合成一条）：**面板清单与导出进度卡共用**，
     * 保证两处的行序 / 标题 / 计数完全一致（导出层直接读 `state.listGroups`）。
     */
    function buildListGroups() {
        const groups = [];
        state.steps.forEach((s, i) => {
            const last = groups[groups.length - 1];
            if (last && last.evIdx === s.evIdx) {
                last.to = i;
                last.enter += s.enterCount || 0;
                last.remove += s.removeCount || 0;
                last.up += s.upgradeCount || 0;
                last.down += s.downgradeCount || 0;
            } else {
                groups.push({
                    evIdx: s.evIdx, from: i, to: i, step: s,
                    enter: s.enterCount || 0, remove: s.removeCount || 0,
                    up: s.upgradeCount || 0, down: s.downgradeCount || 0
                });
            }
        });
        return groups;
    }

    /**
     * 四笔计数的展示定义（**两两相对**）：新增 ↔ 拆除（站的有无）、升级 ↔ 降级（站的形态）。
     * 清单行、信息区状态行与导出进度卡同源同序；图标一律取 CGoUI（禁用 emoji，见铁律五）。
     */
    const COUNT_CHIPS = [
        { key: "enter", icon: "add", label: "新增车站" },
        { key: "remove", icon: "zoom-out", label: "拆除车站" },
        { key: "up", icon: "sparkle", label: "升级车站" },
        { key: "down", icon: "reverse", label: "降级车站" }
    ];

    /** 计数 chips（按 COUNT_CHIPS 顺序；为 0 的不渲染） */
    function chipsHTML(counts) {
        return COUNT_CHIPS.map((c) => (counts && counts[c.key]
            ? `<span class="cgo-oh-item-add" title="${c.label}"><cgo-icon name="${c.icon}" size="12"></cgo-icon>${counts[c.key]}</span>`
            : "")).join("");
    }

    function renderList() {
        // **每个事件一行**：同一事件的多拍（2019-05-30 先开站内换乘、再演 17 站更名；
        // 2021-12-31 恢复运营 → 站内换乘 → 东延通车）合并成一条，点击跳到该事件的**末拍** ——
        // 时间线上这些拍本来就连着演完，落在末拍即该事件完成后的静态形态，不会停在"半成品"画面。
        // ⚠️ 早先每拍一行，同一事件被拆成几个可点项（用户点到中间拍就会看到演了一半的图）；
        // 标题用**事件级**标题（`evTitle`），各拍自己的操作标题留给面板信息区。
        state.els.list.innerHTML = (state.listGroups || []).map((g) => {
            const text = g.step.evTitle || stepLabel(g.step);
            return `<li class="cgo-oh-item" data-go="${g.to + 1}" data-ev="${g.evIdx}">
                <span class="cgo-oh-item-date">${g.step.date}</span>
                <span class="cgo-oh-item-dot" style="background:${g.step.color}"></span>
                <span class="cgo-oh-item-text">${text}</span>${chipsHTML(g)}
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
            const counts = step.kind === "rename" ? {} : {
                enter: step.enterCount != null ? step.enterCount : (step.stations ? step.stations.length : 0),
                remove: step.removeCount || 0,
                up: step.upgradeCount || 0,
                down: step.downgradeCount || 0
            };
            // 状态：直接放清单里那几颗计数块（新增 / 拆除 / 升级 / 降级），样式与清单一致
            const html = chipsHTML(counts);
            state.els.status.innerHTML = html;
            state.els.status.hidden = !html;
        }
    }

    function syncPlayBtn() {
        state.els.play.innerHTML = state.playing
            ? '<cgo-icon name="pause" size="14"></cgo-icon>'
            : '<cgo-icon name="play" size="14"></cgo-icon>';
        // 播放期间**收起并禁用**「运镜速度 / 特写倍数」：这两项决定整条时间线的步长、取景与
        // 转换窗，中途改必须重建时间线并重新对齐「当前播到哪」，边界极多、画面还会跳变。
        // 干脆播放时锁住，暂停后再调（改完由 input 事件重建时间线，见下方监听）。
        const lock = !!state.playing;
        [state.els.setSpeed, state.els.setZoom].forEach((btn) => {
            if (!btn) return;
            btn.disabled = lock;
            btn.classList.toggle("is-disabled", lock);
        });
        if (lock) {
            if (state.els.speedSet) state.els.speedSet.hidden = true;
            if (state.els.zoomSet) state.els.zoomSet.hidden = true;
        }
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
     * 挂载 / 卸载（由地图小工具的免选站工具机制驱动）
     * ==================================================================== */

    function mount(body) {
        state.body = body;
        pathCache.clear();   // 换城市 / 重进演示：旧的路径采样作废，按需重新采
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
            expMode: q('[data-oh="expMode"]'),
            expCardField: q('[data-oh="expCardField"]'),
            expFrom: q('[data-oh="expFrom"]'),
            expTo: q('[data-oh="expTo"]'),
            expCard: q('[data-oh="expCard"]'),
            expStart: q('[data-oh="expStart"]'),
            expCancel: q('[data-oh="expCancel"]'),
            expBar: q('[data-oh="expBar"]'),
            expStatus: q('[data-oh="expStatus"]'),
            expModal: q('[data-oh="expModal"]'),
            expRange: q('[data-oh="expRange"]'),
            expSpeed: q('[data-oh="expSpeed"]'),
            expZoom: q('[data-oh="expZoom"]'),
            expNow: q('[data-oh="expNow"]'),
            list: q(".cgo-oh-list")
        };
        SHARED.export.mountModal();   // 导出浮层改挂 body + 「关闭浮层即取消」观察器（见导出层）
        state.steps = SHARED.build();
        state.listGroups = buildListGroups();   // 事件清单分组（面板与导出进度卡共用同一份）
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
        state.cardShowSummary = true;   // 卡面「当前事件」开关（默认开）
        state.cardShowList = false;     // 卡面「事件列表」开关（默认关；开了卡片纵向撑满，位置只剩左右）
        state.cardPosList = "right";    // 列表撑满时的位置
        state.listFollow = true;    // 清单是否跟随当前事件自动滚动
        renderList();
        SHARED.export.renderSelects();
        SHARED.export.syncCardOpts();

        state.els.play.addEventListener("click", play);
        state.els.replay.addEventListener("click", replay);
        state.els.back.addEventListener("click", () => window.CGoMapTools?.open?.());
        // 三枚展开按钮各管各的区块：点开的那个显示、另两个收起；再点一次收起来
        state.els.setSpeed.addEventListener("click", () => {
            const show = state.els.speedSet.hidden;
            state.els.speedSet.hidden = !show;
            state.els.zoomSet.hidden = true;
            state.els.exportSet.hidden = true;
            SHARED.export.syncExportUI();
        });
        state.els.setZoom.addEventListener("click", () => {
            const show = state.els.zoomSet.hidden;
            state.els.zoomSet.hidden = !show;
            state.els.speedSet.hidden = true;
            state.els.exportSet.hidden = true;
            SHARED.export.syncExportUI();
        });
        SHARED.export.bindControls();   // 导出控件绑定（按钮 / 起止钳制 / 进度卡 / 开始 / 取消）
        // 信息区 ⟷ 事件清单：二选一，不是「收起 / 展开」
        state.els.toggleInfo.addEventListener("click", () => {
            state.els.root.classList.toggle("is-list");
            // 切到清单视图时把三块浮层一并收起：它们与清单不同时激活
            if (state.els.root.classList.contains("is-list")) {
                state.els.speedSet.hidden = true;
                state.els.zoomSet.hidden = true;
                state.els.exportSet.hidden = true;
                SHARED.export.syncExportUI();
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
        // 用户手动滚动清单 → 暂停自动跟随；下一次事件切换时自动恢复（见 applyPanel）。
        // 程序自己的平滑滚动（scrollListToActive）不算「用户滚动」，靠时间窗挡掉。
        state.els.list.addEventListener("scroll", () => {
            if (performance.now() < (state.listAutoScrollUntil || 0)) return;
            state.listFollow = false;
        });
        // 点幽灵点 → 跳它对应的真实车站（捕获阶段，见 onPhantomClick）
        state.phantomClickEl = document.getElementById("map-content");
        state.phantomClickEl?.addEventListener("click", onPhantomClick, true);
        watchPinned();
    }

    function unmount() {
        state.exportCancelled = true;   // 关面板即中止正在进行的导出
        pathCache.clear();              // 释放采样折线
        state.phantomClickEl?.removeEventListener("click", onPhantomClick, true);
        state.phantomClickEl = null;
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
        state.modalObserver?.disconnect();
        state.modalObserver = null;
        state.els?.expModal?.remove();   // 导出浮层挂在 body 上，得自己摘掉
        state.els = null;
    }

    /** 幽灵车站 ID 集合（`CGO_OFFSTATION_PLATFORMS` 的 id）：演示专用图元，不是可选的「一座真实车站」 */
    function phantomIds() {
        const out = new Set();
        (window.CGO_OFFSTATION_PLATFORMS || []).forEach((pf) => {
            if (pf && pf.id) out.add(pf.id);
        });
        return out;
    }

    /**
     * 幽灵车站不该被**选到 / 搜到**：底图上它们的图元已由 `:not(.cgo-oh-stage)` 规则隐藏，却仍会
     * 出现在两个候选列表里 —— 站名选择器（core 点站名弹出的 `#selector-layer`）与全局搜索框
     * （core 的 `#search-results-list`）。这里做**共享层 DOM 后处理**（core 零改动，装挂手法同
     * shared/station/exit-search.js 的「立即试一次 + 低频轮询」）：命中幽灵站就把那条候选摘掉。
     * ⚠️ 常驻、不随 mount/unmount 走 —— 演示开始前的**底图态**同样要过滤（用户验收反馈：
     *    底图上仍能选到 / 搜到 0125A 这类幽灵站）。
     */
    function watchPhantomNodes() {
        const ids = phantomIds();
        if (!ids.size) return;
        const prune = (host) => {
            host.querySelectorAll("[data-sid]").forEach((el) => {
                if (ids.has(el.dataset.sid)) el.remove();
            });
        };
        ["selector-layer", "search-results-list"].forEach((hostId) => {
            const host = document.getElementById(hostId);
            if (!host || host.__cgoPhantomWatch) return;
            host.__cgoPhantomWatch = true;   // 幂等：轮询只补挂尚未挂过的容器
            prune(host);
            new MutationObserver(() => prune(host)).observe(host, { childList: true, subtree: true });
        });
    }

    function hasData() {
        return Array.isArray(window.CGO_OPENING_HISTORY) && window.CGO_OPENING_HISTORY.length > 0;
    }

    /** 内核符号交给扩展层（函数声明已提升，此处一次性暴露） */
    Object.assign(SHARED, {
        NS: NS,
        LAYER_ID: LAYER_ID,
        STYLE_ID: STYLE_ID,
        TOOL_ID: TOOL_ID,
        STAGE_CLASS: STAGE_CLASS,
        POP_CLASS: POP_CLASS,
        DOT_CLASS: DOT_CLASS,
        NO_CLASS: NO_CLASS,
        NO_SHAPE_CLASS: NO_SHAPE_CLASS,
        NO_ICON_CLASS: NO_ICON_CLASS,
        DOT_ICON_CLASS: DOT_ICON_CLASS,
        ON_CLASS: ON_CLASS,
        ALWAYS_CLASS: ALWAYS_CLASS,
        GONE_CLASS: GONE_CLASS,
        HOST_CLASS: HOST_CLASS,
        DUP_LABEL_CLASS: DUP_LABEL_CLASS,
        BODY_CLASS: BODY_CLASS,
        SPEED: SPEED,
        ZOOM: ZOOM,
        POP_BASE: POP_BASE,
        STOP_HOLD: STOP_HOLD,
        STOP_STAGGER: STOP_STAGGER,
        FREE_SWITCH_HOLD: FREE_SWITCH_HOLD,
        CONV_MIN: CONV_MIN,
        T: T,
        SCALE_FLOOR: SCALE_FLOOR,
        MOBILE_MAX: MOBILE_MAX,
        KIND_LABEL: KIND_LABEL,
        STATE_LABEL: STATE_LABEL,
        badgeOf: badgeOf,
        isWithdrawal: isWithdrawal,
        REDUCE: REDUCE,
        esc: esc,
        state: state,
        clearTimers: clearTimers,
        glideMs: glideMs,
        holdMs: holdMs,
        growDuration: growDuration,
        dist: dist,
        pathCache: pathCache,
        sampleCorePath: sampleCorePath,
        segLength: segLength,
        pointAt: pointAt,
        projectOnPath: projectOnPath,
        slicePath: slicePath,
        toD: toD,
        arcOf: arcOf,
        pointAtMulti: pointAtMulti,
        tOnStep: tOnStep,
        bboxOf: bboxOf,
        stepLabel: stepLabel,
        canExportVideo: canExportVideo,
        stationMap: stationMap,
        linesData: linesData,
        lineStations: lineStations,
        byLineId: byLineId,
        stationRangeOf: stationRangeOf,
        eventOps: eventOps,
        findOpIndex: findOpIndex,
        soleOnLine: soleOnLine,
        pushScaleLimit: pushScaleLimit,
        popScaleLimit: popScaleLimit,
        stageHost: stageHost,
        pinnedObserver: pinnedObserver,
        watchPinned: watchPinned,
        unwatchPinned: unwatchPinned,
        resetMapSelection: resetMapSelection,
        enterStage: enterStage,
        exitStage: exitStage,
        applyAnimDurations: applyAnimDurations,
        reseek: reseek,
        calloutOf: calloutOf,
        dotColorOf: dotColorOf,
        themeVar: themeVar,
        setNoIcon: setNoIcon,
        applyForm: applyForm,
        setDotIcon: setDotIcon,
        popStation: popStation,
        calloutObserver: calloutObserver,
        repaintCallouts: repaintCallouts,
        watchCallouts: watchCallouts,
        unwatchCallouts: unwatchCallouts,
        resyncShown: resyncShown,
        isOnCanvas: isOnCanvas,
        syncVirtualConnectors: syncVirtualConnectors,
        syncRdotLabels: syncRdotLabels,
        syncOffStationLinks: syncOffStationLinks,
        syncPhantomHosts: syncPhantomHosts,
        syncGhostForms: syncGhostForms,
        syncGhostLabels: syncGhostLabels,
        ghostPointAt: ghostPointAt,
        visiblePointOf: visiblePointOf,
        alignEndsToVisible: alignEndsToVisible,
        trimEndToPoint: trimEndToPoint,
        realignArchivedPaths: realignArchivedPaths,
        realignPiecePaths: realignPiecePaths,
        realignLiveSegs: realignLiveSegs,
        syncConnectorEnds: syncConnectorEnds,
        onPhantomClick: onPhantomClick,
        markAlwaysOn: markAlwaysOn,
        clearMarks: clearMarks,
        layer: layer,
        doneGroup: doneGroup,
        liveGroup: liveGroup,
        clearCanvas: clearCanvas,
        viewportBox: viewportBox,
        cnSpanOf: cnSpanOf,
        enSpanOf: enSpanOf,
        MN_LANG: MN_LANG,
        altSpanOf: altSpanOf,
        applyNameAt: applyNameAt,
        restoreNames: restoreNames,
        applyNewName: applyNewName,
        bezier: bezier,
        EASE: EASE,
        EASE_OUT: EASE_OUT,
        EASE_POP: EASE_POP,
        clampZoom: clampZoom,
        camForPoint: camForPoint,
        camForBox: camForBox,
        camLerp: camLerp,
        brushAt: brushAt,
        expandBoxByLabels: expandBoxByLabels,
        camTailOf: camTailOf,
        camWholeOf: camWholeOf,
        growthPhases: growthPhases,
        phaseAtDt: phaseAtDt,
        progAtDt: progAtDt,
        timeOfProg: timeOfProg,
        stepStops: stepStops,
        buildTimeline: buildTimeline,
        recAt: recAt,
        camAt: camAt,
        applyPopProgress: applyPopProgress,
        ripple: ripple,
        leaveStation: leaveStation,
        showStation: showStation,
        ensureGrowPath: ensureGrowPath,
        applyFrame: applyFrame,
        syncRenameNames: syncRenameNames,
        applyRenameAt: applyRenameAt,
        makeHollowMask: makeHollowMask,
        makeSegPiece: makeSegPiece,
        applyPieceStyle: applyPieceStyle,
        pieceLen: pieceLen,
        applyPieceProgress: applyPieceProgress,
        convertRange: convertRange,
        applyConvs: applyConvs,
        commitPath: commitPath,
        pad2: pad2,
        lerpDate: lerpDate,
        setTrack: setTrack,
        lineCountAround: lineCountAround,
        panelModel: panelModel,
        applyPanel: applyPanel,
        scrollListToActive: scrollListToActive,
        renderBody: renderBody,
        syncToggle: syncToggle,
        renderList: renderList,
        trackPercentAt: trackPercentAt,
        syncNow: syncNow,
        syncPlayBtn: syncPlayBtn,
        startPlayback: startPlayback,
        tick: tick,
        play: play,
        pause: pause,
        reset: reset,
        replay: replay,
        jumpTo: jumpTo,
        mount: mount,
        unmount: unmount,
        phantomIds: phantomIds,
        watchPhantomNodes: watchPhantomNodes,
        hasData: hasData,
        register: register,
        // 四笔计数的展示定义（导出层的进度卡状态行与面板清单同源同序）
        COUNT_CHIPS: COUNT_CHIPS,
    });

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

    watchPhantomNodes();                    // 幽灵车站不进选择器 / 搜索候选（底图与演示态都要）
    setInterval(watchPhantomNodes, 800);    // 两个容器可能晚于本脚本进 DOM（core 是 module）

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", register);
    else register();
})();
