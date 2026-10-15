/**
 * CGo OpenMap - 线网发展史（状态计算层，city/shenyang/shared/tools/opening-history.model.js）
 *
 * 从 opening-history.js 拆出的「状态计算」：把沿革事件与时间账解析成可播放的步骤（build）。
 * 纯计算、不碰 DOM —— 只读 window 城市数据与共享态 `state`，以及内核暴露的数据准备小工具，
 * 把每一步该画什么算好交给内核。数据准备小工具（lineStations / eventOps / stationRangeOf …）
 * 仍留在内核：内核的「已拆除站样式规则」在顶层就要用它们。
 *
 * ⚠️ 加载顺序：必须晚于 opening-history.js（内核先建好共享层）。改本文件后记得同步递增
 *    缓存版本串（各城 {city}.js 的 const version / main.html 的 var v / sw.js 的 CACHE_NAME）。
 */
(function () {
    const SHARED = window.CGoOpeningHistoryShared;
    if (!SHARED) {
        console.warn("[线网发展史] opening-history.model.js 需在 opening-history.js 之后加载，已跳过");
        return;
    }
    const { NS, LAYER_ID, STYLE_ID, TOOL_ID, STAGE_CLASS, POP_CLASS, DOT_CLASS, NO_CLASS, NO_SHAPE_CLASS, NO_ICON_CLASS, DOT_ICON_CLASS, ON_CLASS, ALWAYS_CLASS, GONE_CLASS, HOST_CLASS, DUP_LABEL_CLASS, BODY_CLASS, SPEED, ZOOM, POP_BASE, STOP_HOLD, STOP_STAGGER, FREE_SWITCH_HOLD, CONV_MIN, T, SCALE_FLOOR, MOBILE_MAX, KIND_LABEL, STATE_LABEL, badgeOf, isWithdrawal, REDUCE, esc, state, clearTimers, glideMs, holdMs, growDuration, dist, pathCache, sampleCorePath, segLength, pointAt, projectOnPath, slicePath, toD, arcOf, pointAtMulti, tOnStep, bboxOf, stepLabel, canExportVideo, stationMap, linesData, lineStations, byLineId, stationRangeOf, eventOps, findOpIndex, soleOnLine, pushScaleLimit, popScaleLimit, stageHost, pinnedObserver, watchPinned, unwatchPinned, resetMapSelection, enterStage, exitStage, applyAnimDurations, reseek, calloutOf, dotColorOf, themeVar, setNoIcon, applyForm, setDotIcon, popStation, calloutObserver, repaintCallouts, watchCallouts, unwatchCallouts, resyncShown, isOnCanvas, syncVirtualConnectors, syncRdotLabels, syncOffStationLinks, syncPhantomHosts, syncGhostForms, syncGhostLabels, ghostPointAt, visiblePointOf, alignEndsToVisible, trimEndToPoint, realignArchivedPaths, realignPiecePaths, realignLiveSegs, syncConnectorEnds, onPhantomClick, markAlwaysOn, clearMarks, layer, doneGroup, liveGroup, clearCanvas, viewportBox, cnSpanOf, enSpanOf, MN_LANG, altSpanOf, applyNameAt, restoreNames, applyNewName, bezier, EASE, EASE_OUT, EASE_POP, clampZoom, camForPoint, camForBox, camLerp, brushAt, expandBoxByLabels, camTailOf, camWholeOf, growthPhases, phaseAtDt, progAtDt, timeOfProg, stepStops, buildTimeline, recAt, camAt, applyPopProgress, ripple, leaveStation, showStation, ensureGrowPath, applyFrame, syncRenameNames, applyRenameAt, makeHollowMask, makeSegPiece, applyPieceStyle, pieceLen, applyPieceProgress, convertRange, applyConvs, commitPath, pad2, lerpDate, setTrack, lineCountAround, panelModel, applyPanel, scrollListToActive, renderBody, syncToggle, renderList, trackPercentAt, syncNow, syncPlayBtn, startPlayback, tick, play, pause, reset, replay, jumpTo, mount, unmount, phantomIds, watchPhantomNodes, hasData, register } = SHARED;

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

        const delayed = new Map();   // sid → [补开 / 恢复日…]（**数组**：同一站可多次停运复运，每一笔恢复都要留）
        const delayedBy = new Map(); // sid → Map(lineId → [该线在本站的到达 / 补开日…])：判暂缓与判停运恢复都按线路粒度看
        const closed = new Map();    // sid → [{ date, permanent }]（闭站 / 拆除，升序）
        /**
         * 拆除终态的站 → 拆除日期（`goneAt`，只记首次）。⚠️ 不是无条件剔除：
         * **拆除日之前**的 step 里它照常入场（长春辽宁路站 2002 年随一期开通、2021 年才拆除），
         * 只有拆除日及之后的操作才不许再让它复活 / 记服务账。
         */
        const goneAt = new Map();
        const transferAt = new Map(); // sid → 站内换乘启用日（此前维持单线普通站形态）
        /**
         * 往「sid / lineId → 日期数组」里记一笔（去重）。
         * ⚠️ 恢复日必须**逐笔留下**，不能只存最后一次：同一站同一条线可以「停 → 复 → 再停 → 再复」
         * （长春解放桥 3 号线即此例），只留最后一次会让早先那次恢复被后来的日期盖掉，
         * 中间那段正常运营的时期被误判成停运。
         */
        const pushDay = (map, key, date) => {
            const arr = map.get(key) || [];
            if (arr.indexOf(date) < 0) arr.push(date);
            map.set(key, arr);
        };
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
            if (permanent && !goneAt.has(sid)) goneAt.set(sid, ev.date);   // 拆除是终态：之后任何操作都不许让它复活（但拆除日之前照常存在）
        };
        events.forEach((ev) => {
            if (ev.kind === "station-state") {
                if (ev.state === "open") {
                    (ev.stations || []).forEach((sid) => {
                        pushDay(delayed, sid, ev.date);
                        const per = delayedBy.get(sid) || new Map();
                        pushDay(per, ev.lineId, ev.date);
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
                // except 的站级 `state: "removed"`（随段拆除）同样是**终态**，要登记 goneAt
                const exRem = {};
                (Array.isArray(ev.except) ? ev.except : []).forEach((e) => {
                    if (e && e.state === "removed") exRem[e.sid] = true;
                });
                stationRangeOf(line, ids, ev).forEach((sid) => markClosed(sid, ev, ev.state === "removed" || !!exRem[sid]));
            }
        });

        const shown = new Set();      // 已经出现在画布上的站
        const lineIdsAt = new Map();  // sid → Set(已开通线路 ID)
        const firstLineOf = new Map(); // sid → 首条开通线路 ID
        const formOf = new Map();     // sid → 当前形态
        const steps = [];

        /**
         * 此刻该站是否处于闭站（拆除视为永久闭站）。
         * 恢复的判据是「该次闭站之后、date 之内**存在任意一次**补开 / 恢复」—— 与暂缓站共用 `delayed`。
         * ⚠️ 不能拿「最后一次恢复日」比：同一站「停 → 复 → 再停 → 再复」时，最后一次会盖掉早先那次，
         * 于是中间那段正常运营的时期被判成停运（长春解放桥 3 号线即此例）。
         * 因此芙蓉桥（闭 2021-11-28 → 复 2023-05-30）、西安桥（→ 复 2022-06-01）都走这一条。
         */
        const closedAt = (sid, date) => {
            const list = closed.get(sid);
            if (!list) return false;
            let last = null;
            for (let k = 0; k < list.length; k++) if (list[k].date <= date) last = list[k];
            if (!last) return false;
            if (last.permanent) return true;
            const days = delayed.get(sid) || [];
            return !days.some((d) => d > last.date && d <= date);
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
                // 同 closedAt：只看「该次停运之后有没有任意一次该线的恢复」，
                // 不取该线最后一次到站日（多次停运复运时它会盖掉早先那次恢复）
                const days = (per && per.get(c.lineId)) || [];
                if (!days.some((d) => d > c.date && d <= date)) out.add(c.lineId);
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
                const days = delayed.get(sid) || [];
                return days.some((d) => d <= date) ? "real" : "no";
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
                    // 取该线在本站的**最晚**到达 / 补开日：不晚于当日才算真正服务本站
                    //（延伸段重新经过不能把本站自己的补开日顶回去）
                    const days = (per && per.get(lid)) || [];
                    const latest = days.length ? Math.max.apply(null, days) : null;
                    if (!(latest && latest > date)) served = true;
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
                // 事件级标题单独留一份：事件清单按**事件**列，标题要用它（各拍自己的 title
                // 是操作级文案，留给面板信息区）
                evTitle: ev.evTitle || ev.title || "",
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
            /** 该站此刻是否已被拆除（终态）：拆除日之前照常，之后不复活 */
            const isGoneAt = (sid, date) => {
                const g = goneAt.get(sid);
                return !!g && date >= g;
            };
            const collect = (segIds, path, s0, s1, reversed, base, total, exMap, convTo) => {
                segIds.forEach((sid) => {
                    if (isGoneAt(sid, ev.date)) return;   // 拆除终态：拆除日之后不复活、不记服务账
                    const e = exMap && exMap[sid];
                    if (e && (e.state === "suspended" || e.state === "removed")) return;   // 豁免：不记服务账
                    if (!lineIdsAt.has(sid)) {
                        lineIdsAt.set(sid, new Set());
                        firstLineOf.set(sid, ev.lineId);   // 首条开通的线路（dot 形态用它上色）
                    }
                    lineIdsAt.get(sid).add(ev.lineId);
                    // 记「该线到本站的日期」：暂缓判定与线路闭站恢复共用这一张账。
                    // **逐笔留下**（不只留较晚的那次）：区段延伸重新经过本站时不能把「本站自己的
                    // 补开日」顶回去（暂缓站一被延伸段扫过就提前开通），而多次停运复运时每一笔
                    // 恢复日又都不能丢 —— 取最晚值只用于「此刻是否已服务」（见 wantForm）。
                    const per = delayedBy.get(sid) || new Map();
                    pushDay(per, ev.lineId, ev.date);
                    delayedBy.set(sid, per);
                });
                segIds.forEach((sid) => {
                    if (isGoneAt(sid, ev.date)) return;   // 拆除终态：拆除日之后不复活
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
                    let tg = 0.5;   // 全局弧长正向占比（不随画笔翻转）：段转换的擦除波前按它定位
                    if (path && Number.isFinite(s0) && Number.isFinite(s1) && s1 !== s0) {
                        const at = projectOnPath(path, s);
                        // t 是「沿线位置」，必须与画笔的行进方向一致：
                        // 线条从已开通端起笔时子折线是反的，站点的 t 也要跟着翻过来
                        if (at !== null) {
                            tg = Math.max(0, Math.min(1, (at - s0) / (s1 - s0)));
                            t = tg;
                            if (reversed) t = 1 - t;
                        }
                    }
                    // 多段步：把「本段内的相对位置」换算成整步进度（笔尖是按整步走的）
                    if (Number.isFinite(base) && total > 0) {
                        t = (base + t * Math.abs(s1 - s0)) / total;
                    }
                    const firstLine = byId[firstLineOf.get(sid)];
                    step.stations.push({
                        sid: sid, x: s.x, y: s.y, t: t, tg: tg, convTo: convTo || null, form: want, mode: mode,
                        prevForm: cur || null,   // 旧形态：统计「升级 / 降级」方向用
                        dotColor: aliveColorOf(sid, ev.date) || (firstLine ? firstLine.color : line.color)
                    });
                });
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
                        // 端点站 ID：生长端点要按它对齐到「此刻可见的图元」（幽灵点让位时连到幽灵点），
                        // 见 alignEndsToVisible。⚠️ pts 已按 arc.flip 翻过，故首端对应 hi 端。
                        segs.push({
                            pts: pts, lo: lo, hi: hi, s0: s0, s1: s1, flip: arc.flip,
                            len: Math.max(1, segLength(pts)),
                            headSid: ids[arc.flip ? hi : lo],
                            tailSid: ids[arc.flip ? lo : hi]
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
                    if (covered) { sg.convTo = "solid"; conv.push(sg); }
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
                segs.forEach((sg) => collect(ids.slice(sg.lo, sg.hi + 1), path, sg.s0, sg.s1, sg.flip, sg.base, total, ex, sg.convTo));
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
                let projPath = null;   // 波前定位用的采样折线（line-state 块内赋值）
                // removed = 移除（图元、站名与引线一并抹掉，mode: "leave"；线路段转空白）。
                // 只对**已经出现在画布上**的站生效 —— 尚未入场的规划站没有「关」这一说。
                // `line-state` 是「区段」级的事，先按站序展开成站，判定路径与站级完全一致。
                if (ev.kind === "line-state") {
                    // 段的形态转换：suspended → 未开通镂空；removed → 空白（从已画账销掉，
                    // 将来重新开通时重新生长）。停运 / 移除的里程同步倒扣。
                    const path = projPath = sampleCorePath(ev.lineId)
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
                    const prevF = formOf.get(sid);   // 旧形态（判「升级 / 降级」方向，formOf 随即被覆盖）
                    const want = gone ? "gone" : wantForm(sid, ev.date, evIdx);
                    formOf.set(sid, want);
                    if (gone) shown.delete(sid);   // 重新开通时按「再次入场」处理（回放计数也才对）
                    const first = byId[firstLineOf.get(sid)];
                    // 站点在擦除方向上的位置：投影到全局弧长、按所属转换段归一（波前逐站驱动用）
                    let tg = 0.5;
                    const at = projPath && projPath.length >= 2 ? projectOnPath(projPath, s) : null;
                    if (at !== null && step.segConv.length) {
                        const seg = step.segConv.find((c) => at >= Math.min(c.s0, c.s1) - 0.01 && at <= Math.max(c.s0, c.s1) + 0.01);
                        if (seg && Math.abs(seg.s1 - seg.s0) > 0.01) {
                            tg = Math.max(0, Math.min(1, (at - Math.min(seg.s0, seg.s1)) / Math.abs(seg.s1 - seg.s0)));
                        }
                    }
                    step.stations.push({
                        sid: sid, x: s.x, y: s.y, t: 0, tg: tg,
                        // 波前绑定只对**线级形态转换**（segConv）成立；单站停运/拆除没有线转换，
                        // 保持 null 走原有巡览逻辑
                        convTo: step.segConv.length ? (gone ? "hidden" : step.segConv[0].style) : null,
                        form: want,
                        prevForm: prevF || null,
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
            // 步标识：live 组的复用键（`dataset.no`）、归档节点的 `data-no`、端点对齐时判定
            // 「该步是否处于让位区间」。⚠️ 早先漏了这一步赋值，`step.no` 恒 undefined，
            // live 组只在节点离线（stale）时才重建 —— 连着两步都生长时会复用旧路径。
            step.no = steps.length;
            // 段形态转换的站按**擦除波前方向**排 —— 车站消失 / 更改的顺序必须与擦除方向一致
            // （波前扫到哪、站跟到哪）：波前自 tg=1 端（收笔端 / 已开通端）推进，
            // 故按 tg 降序；生长 / 入场的站仍按画笔顺序。
            step.stations.sort((a, b) => {
                if (a.convTo || b.convTo) return -((a.tg || 0) - (b.tg || 0));
                return a.t - b.t;
            });
            steps.push(step);
        });

        /**
         * 站台级「幽灵点」（`CGO_OFFSTATION_PLATFORMS`）：同一座车站两条线各有站台、却只能
         * **付费站外换乘**的那段时期，在图上多画一个点，并配一条虚线连到主点。
         * 出现时刻 =「该站**首次出现在画布上**」与「该站**本线**首次投用（`station-state/open`）」
         *            里较晚的那一步 —— 后者用来处理「线路已通过、本站暂缓（列车过站不停）」；
         * 消失时刻 = 主点 `station-state/interchange`（开通站内换乘）那一步，或配置里的 `until`。
         * 都从已有事件里取，不必另写日期。
         * 这类点**不属于任何线路（不在 stationIds 里）**，底图上由共享层的样式规则隐藏。
         */
        const demoOnly = new Set();
        const offPairs = [];
        /**
         * 主点「第一次出现在画布上」的那一步 = 该站第一条线通到它的那一拍。
         * ⚠️ 不能用「某条线的首通步」代替：3 号线分两期（卫星广场在二期 2006-12-26 才通车）、
         *    4 号线也分两期（长春站北在地下段 2012-05-06 才通车），取线首通会把这些站台
         *    幽灵点的出生日提前到与它无关的那一期。
         */
        const firstAppear = new Map();
        steps.forEach((s, k) => s.stations.forEach((x) => {
            if (!firstAppear.has(x.sid)) firstAppear.set(x.sid, k);
        }));
        /**
         * 某站被**某条线**首次服务的那一步 = 该线**覆盖本站**的第一个区段开通拍。
         * 幽灵点是**按线**的站台（3 号线侧、1 号线侧各一个），每侧都要用它自己那条线到站的
         * 时刻：长春站北的 4 号线侧 2012-05-06 出现，1 号线侧要等 2017-06-30。
         * ⚠️ 两个坑都在这里踩过：
         *   · 不能取「该线**全线首通**」—— 3 号线分两期（卫星广场在二期 2006 才通车）、
         *     4 号线也分两期（长春站北在地下段 2012 才通车）；
         *   · 不能取「该步的 `stations` 里有没有本站」—— 车站早已在线网上时，那一步 collect 会
         *     按「形态没变」提前返回、根本不登记它，于是会把「开通站内换乘」那拍（形态变了才登记）
         *     误当成该线到站，birth 与 ghostOut 撞在一起、整条幽灵点被丢掉。
         * 正解：看该线自己那些 `line-state{open}` 拍里，哪一拍的**生长区段站序范围**盖住了本站。
         */
        const lineReach = (sid, lineId) => {
            const line = byId[lineId];
            if (!line) return -1;
            const idx = lineStations(line).indexOf(sid);
            if (idx < 0) return -1;
            for (let k = 0; k < steps.length; k++) {
                const s0 = steps[k];
                if (s0.kind !== "line-state" || s0.state !== "open" || s0.lineId !== lineId) continue;
                if ((s0.segs || []).some((sg) => sg.lo != null && idx >= sg.lo && idx <= sg.hi)) return k;
            }
            return -1;
        };
        (window.CGO_OFFSTATION_PLATFORMS || []).forEach((pf) => {
            const s = pf && pf.id ? st[pf.id] : null;
            if (!pf || !s || !Number.isFinite(s.x)) return;
            let open = -1, end = -1, endOp = -1, sawClose = false;
            events.forEach((ev, k) => {
                const si = stepOfEvent[k];
                if (si === undefined) return;
                const touches = (ev.stations || []).indexOf(pf.of) >= 0;
                // 本站自己的闭站（改造停运 / 拆除）一旦出现，其后所有 open 都只是「恢复运营」
                if (touches && ev.kind === "station-state"
                    && (ev.state === "suspended" || ev.state === "removed")) sawClose = true;
                // ⚠️ 只有「**该线**在本站的首次投用」才算站台投用 —— 两个限定缺一不可：
                //    · 按线（`ev.lineId === pf.line`）：长春站 3 号线的站台 2002 年就有了，
                //      不能拿 2019-01-26「1 号线站台投用」把它拖后；
                //    · 排除闭站之后的 open（`!sawClose`）：解放桥 2019-06-01 封闭改造、
                //      2020-01-01 恢复，后者是**恢复运营**不是首次投用。
                if (open < 0 && !sawClose && ev.kind === "station-state" && ev.state === "open"
                    && ev.lineId === pf.line && touches) open = si;
                if (end < 0 && ev.kind === "station-state" && ev.state === "interchange" && touches) { end = si; endOp = k; }
            });
            // 出生 = 三者较晚：该站首次出现（先到线）· 本幽灵点所属线到站 · 该站本线首次投用
            const birth = Math.max(
                firstAppear.has(pf.of) ? firstAppear.get(pf.of) : -1,
                lineReach(pf.of, pf.line),
                open);
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
                        form: wantMain, prevForm: curMain || null, mode: "upgrade", grp: pf.of,
                        dotColor: aliveColorOf(pf.of, steps[endStep].date) || (firstLine ? firstLine.color : dotColor)
                    });
                }
            }
            demoOnly.add(pf.id);
            /**
             * 三件事的步号各不相同，用**具名字段**记（早先用数组、极易把「切画法」与
             * 「幽灵点移出」当成同一个，出现主点提前归位、与幽灵点并存的重影）：
             *   ghostIn  —— 幽灵点进场（出站换乘开始）：主点自此让位；
             *   ghostOut —— 幽灵点移出（配对结束，取 `until` 覆盖后的值）：主点归位；
             *   freeFrom —— 两端转为**免费**换乘那一步（主点开通站内换乘），此前的
             *               连线用付费画法；找不到该动作时为 -1（连线一直按付费画）。
             * ⚠️ ghostOut 与 freeFrom **常常不是同一步**：卫星路/临河街（0343）2012-09-22
             *    就开通了站内换乘（切免费），但两边站名到 2019-05-30 才统一（幽灵点那时才撤）。
             */
            // 该幽灵点所属线在本站「停运」的步骤区间：运行时据此把它转成「未开通」圈 ——
            // 解放桥 3 号线侧 2019-06-01 甩站改造即此例（**两座站台之间的付费换乘线仍然留着**，
            // 因为站台还在、只是列车不停；到 2020-01-01 恢复运营再转回普通站）。
            const downSpans = [];
            let downFrom = -1;
            steps.forEach((s0, k) => {
                const down = closedLinesAt(pf.of, s0.date).has(pf.line);
                if (down && downFrom < 0) downFrom = k;
                if (!down && downFrom >= 0) { downSpans.push([downFrom, k]); downFrom = -1; }
            });
            if (downFrom >= 0) downSpans.push([downFrom, steps.length]);
            offPairs.push({ host: pf.of, ghost: pf.id, ghostIn: birth, ghostOut: endStep, freeFrom: end, downSpans: downSpans });
        });
        // 同一座车站可以配**多条线**的站台幽灵点（各线一个，如长春站既有 3 号线侧也有 1 号线侧）：
        // 让同组的点互相指认（`peer`），站台之间的连线于是画在**两个幽灵点之间**，
        // 而不是连到那个已被隐藏起来的主点位置上。
        // ⚠️ 只配了一个点的车站（双丰 / 长春西站）`peer` **留空**、不回落主点：回落只会让
        //    那条线去连一个已被隐藏的主点（两点本就几乎同位），图上多出一截没意义的接头。
        const byHost = new Map();
        offPairs.forEach((p) => {
            const arr = byHost.get(p.host) || [];
            arr.push(p);
            byHost.set(p.host, arr);
        });
        byHost.forEach((arr) => arr.forEach((p) => {
            const other = arr.find((q) => q !== p);
            p.peer = other ? other.ghost : null;
        }));
        state.demoOnly = demoOnly;
        state.offPairs = offPairs;

        // 累计量一次算好：面板每步只读，不必重算
        const lineSet = new Set();
        let mileage = 0;
        // 「当前运营站数」口径：随步骤推进维护一份形态表，形态非「未开通」的站才算在运营 ——
        // 历史累计口径会把已拆除（长春辽宁路）、全线停运、尚未开通的站一直挂在账上，
        // 与面板上「车站 N 座」的读法不符。拆除 / 全线停运的站从表中除名，恢复再重新入账。
        const formNow = new Map();   // sid → 该步形态（real / dot / no；拆除即除名）
        // 国铁车站（`type: "rdot"`）不计入站数统计 —— 它们不是城市轨道交通的车站
        // （市域铁路怎么算待定，目前五城都没有市域铁路线路）。图元与入场动画照旧
        // （首条线路开通后启用的按 `station-state/open` 登记、到时入场），只把「车站 N 座 /
        // 新增 N 站」这两笔账里的它们剔掉，并让**全览取景**也不参与（见 camWholeOf）。
        const railStations = new Set();
        Object.keys(st).forEach((sid) => {
            if (st[sid] && st[sid].type === "rdot") railStations.add(sid);
        });
        state.railStations = railStations;
        // 形态等级：拆除 -1 < 未开通 0 < 普通站 1 < 正式站 / 换乘站 2 —— 判「升级 / 降级」方向
        const formLevel = (f) => (f === "gone" ? -1 : f === "no" ? 0 : f === "dot" ? 1
            : (f === "real" || f === "tsf") ? 2 : null);
        steps.forEach((s, i) => {
            if (s.kind === "line-state" && s.state === "open") lineSet.add(s.lineId);
            // 两对计数：**新增 ↔ 拆除**（站的有无）、**升级 ↔ 降级**（站的形态）。
            // 撤站步不再整步跳过 —— 其中的「转未开通 / 拆除」正是降级与拆除两笔账。
            let added = 0, removed = 0, up = 0, down = 0;
            s.stations.forEach((x) => {
                if (railStations.has(x.sid)) return;   // 国铁散点不是城市轨道交通车站
                if (demoOnly.has(x.sid)) return;       // 站台幽灵点不是「一座车站」，不计入站数
                if (x.mode === "enter") { added++; return; }
                if (x.mode === "leave" || x.form === "gone") { removed++; return; }
                const a = formLevel(x.prevForm), b = formLevel(x.form);
                if (a === null || b === null) return;  // 形态不全的历史拍不计
                if (b > a) up++;
                else if (b < a) down++;
                // 同级但形态不同（换乘图元增减，如 real ↔ tsf）算升级；
                // ⚠️ 完全相同的不计 —— 撤站步会把段内**每**站都 push（哪怕形态没变，
                //    波前擦除要靠它们驱动），那些「本来就那样」的站不能算成升级/降级。
                else if (x.prevForm !== x.form) up++;
            });
            // 同步形态表：拆除（gone / leave）除名，其余按本步形态记账
            s.stations.forEach((x) => {
                if (railStations.has(x.sid) || demoOnly.has(x.sid)) return;
                if (x.mode === "leave" || x.form === "gone") formNow.delete(x.sid);
                else if (x.form) formNow.set(x.sid, x.form);
            });
            let active = 0;
            formNow.forEach((f) => { if (f !== "no") active++; });
            mileage += s.addedMileage;
            s.no = i + 1;
            s.lines = lineSet.size;
            s.enterCount = added;         // 新增
            s.removeCount = removed;      // 拆除
            s.upgradeCount = up;          // 升级
            s.downgradeCount = down;      // 降级
            s.stationCount = active;   // 「车站」= 当前在运营车站数（不含已拆除 / 全线停运 / 未开通）
            s.mileage = mileage / 1000;   // 米 → 公里
        });
        return steps;
    }

    SHARED.build = build;
})();
