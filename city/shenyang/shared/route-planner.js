/**
 * CGo OpenMap - 路线规划内核（共享层）
 *
 * ⚠️ 临时共享位置：本文件与 stacard-engine.js 等同处 city/shenyang/shared/，
 * 由沈阳、大连、长春三城共用，计划随共享层整体迁入 core/。
 *
 * 职责边界
 * - 本文件负责：网络索引构建、Dijkstra 寻路、步骤压缩。**不含任何城市数据**。
 * - 城市侧负责：把本站数据整理成 network（线路站序、区间用时、换乘代价、出站步行）。
 *
 * 为什么状态必须含「行车方向」
 *   只按站点建图会允许「中途掉头」，算出图上根本不存在的走法。状态取
 *   (站, 线, 支, 方向) 四元组，与香港实现的做法一致。
 *
 * 为什么不做班次时刻匹配
 *   采用频率式图：乘车按区间用时累加、换乘计一次固定代价（等车 + 站内步行），
 *   不逐班次对齐时刻表。需要体现候车时间时，由城市侧在 xfer 钩子里调。
 *
 * network 契约（由城市适配器提供）
 * {
 *   lines: [{
 *     id: "SYM01",
 *     ways: [["0101","0102",...]],   // 站序；分支线多条 way，环线需 loop: true
 *     loop: false,                    // 环线：末站与首站相接，方向取模
 *     hop(a, b) -> number|null,       // a→b 区间用时（分钟）；null 视为不可通行
 *     xfer(sid, fromLine, toLine) -> number|null   // 可选：该站换乘代价覆盖
 *   }],
 *   stations: { "0101": { type: "dot"|"tsf"|"no" } },  // type "no" 一律不可达
 *   walk: { "0101": [{ to: "0201", minutes: 6 }] },     // 出站虚拟换乘，双向须各写一次
 *   xferMinutes: 2                                       // 同站换乘默认代价
 * }
 *
 * plan() 返回
 * {
 *   minutes, stops, transfers,
 *   steps: [
 *     { t: "ride", line, way, dir, stops: [sid...], minutes, km },
 *     { t: "xfer", at, fromLine, toLine, minutes },
 *     { t: "walk", a, b, minutes, free, kind }   // kind: transfer | board | exit
 *   ]
 * }
 *
 * transfers 口径：站内换乘 (xfer) 与「下车 → 出站步行 → 再上车」(walk.kind === "transfer")
 * 各计一次换乘；起点出站步行上车 (board) 与下车后步行直达终点 (exit) 属于进出站步行，不计换乘。
 */
(function () {
    "use strict";

    const DEFAULT_XFER_MINUTES = 2;
    const INF = Infinity;

    /** 最小二叉堆；元素 [cost, key]。避免用数组 sort 冒充堆 */
    function createHeap() {
        const heap = [];
        const swap = (i, j) => { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
        return {
            get size() { return heap.length; },
            push(cost, key) {
                heap.push([cost, key]);
                let i = heap.length - 1;
                while (i > 0) {
                    const parent = (i - 1) >> 1;
                    if (heap[parent][0] <= heap[i][0]) break;
                    swap(parent, i);
                    i = parent;
                }
            },
            pop() {
                if (!heap.length) return null;
                const top = heap[0];
                const last = heap.pop();
                if (heap.length) {
                    heap[0] = last;
                    let i = 0;
                    for (;;) {
                        const l = 2 * i + 1, r = l + 1;
                        let min = i;
                        if (l < heap.length && heap[l][0] < heap[min][0]) min = l;
                        if (r < heap.length && heap[r][0] < heap[min][0]) min = r;
                        if (min === i) break;
                        swap(min, i);
                        i = min;
                    }
                }
                return top;
            }
        };
    }

    /**
     * 建立规划器
     * @param {object} network 见文件头契约
     */
    function create(network) {
        const stations = network?.stations || {};
        const walkMap = network?.walk || {};
        const defaultXfer = Number.isFinite(network?.xferMinutes)
            ? Number(network.xferMinutes) : DEFAULT_XFER_MINUTES;
        const lines = (network?.lines || []).filter((line) => !line.exclude && Array.isArray(line.ways));
        const lineById = new Map(lines.map((line) => [line.id, line]));

        /** 站 → 可乘状态（线路 / 支 / 该支内下标） */
        const boardable = new Map();
        lines.forEach((line) => {
            line.ways.forEach((way, wi) => {
                way.forEach((sid, idx) => {
                    if (!boardable.has(sid)) boardable.set(sid, []);
                    boardable.get(sid).push({ lineId: line.id, wi, idx });
                });
            });
        });

        /** 未开通车站（type "no"）不可达；stations 未收录的站按可用处理，避免数据不全而阻塞 */
        const reachable = (sid) => stations[sid]?.type !== "no";

        const stateKey = (sid, lineId, wi, dir) => `${sid}|${lineId}|${wi}|${dir}`;

        /** 沿当前状态前进一步；越界且非环线则无去路 */
        function step(state) {
            const line = lineById.get(state.lineId);
            if (!line) return null;
            const way = line.ways[state.wi];
            let i = state.idx + state.dir;
            if (i < 0 || i >= way.length) {
                if (!line.loop) return null;
                i = (i + way.length) % way.length;
            }
            if (line.loop && i === state.idx) return null;
            return { sid: way[i], idx: i };
        }

        /** 该方向是否有车可上（非环线时端点站的反向不可上） */
        function hasService(line, wi, idx, dir) {
            if (line.loop) return true;
            const next = idx + dir;
            return next >= 0 && next < line.ways[wi].length;
        }

        function hopMinutes(line, a, b) {
            const value = typeof line.hop === "function" ? line.hop(a, b) : null;
            return Number.isFinite(value) ? value : null;
        }

        function xferMinutes(sid, fromLine, toLine) {
            const line = lineById.get(toLine);
            const value = typeof line?.xfer === "function" ? line.xfer(sid, fromLine, toLine) : null;
            return Number.isFinite(value) ? value : defaultXfer;
        }

        function hopKm(line, a, b) {
            const value = typeof line.hopKm === "function" ? line.hopKm(a, b) : null;
            return Number.isFinite(value) ? value : null;
        }

        /**
         * 计费系统：同一系统内连续乘车合并计费（地铁网内换乘免费），跨系统重新购票。
         * 默认与制式一致；城市用 fareSystems 把同一制式下各自购票的线路拆开
         * ——浑南有轨换乘线路、大连 201 与 202、长春 G54 与 G55 都属此列。
         */
        const lineSystem = (lineId) => {
            const line = lineById.get(String(lineId).split("#")[0]);
            return line?.system || line?.mode || "metro";
        };

        /**
         * 多目标：图结构完全不变，只是每条边取不同权重，因此只需一份 Dijkstra。
         * 「最省」用的是边际票价值近似（有轨单价高于地铁），而非严格票价——
         * 票价不可分解为边权和（分段计价是非线性的），最终票价由 computeFare 按实际里程结算。
         * 步行边分两种：boardingWalk 是「下车 → 出站步行 → 再上车」的出站换乘，
         * walk 是起点步行上车 / 下车后步行直达终点。除「最少换乘」外两者权重一致。
         */
        const OBJECTIVES = {
            time: {
                label: "最快",
                hop: (line, a, b) => hopMinutes(line, a, b),
                xfer: (sid, from, to) => xferMinutes(sid, from, to),
                walk: (minutes) => minutes,
                boardingWalk: (minutes) => minutes
            },
            distance: {
                label: "最短",
                hop: (line, a, b) => hopKm(line, a, b),
                xfer: () => 0.08,
                walk: (minutes) => minutes,
                boardingWalk: (minutes) => minutes
            },
            /**
             * 「最少换乘」：换乘次数是主目标（每次换乘计 1，出站换乘同样计 1），
             * 区间用时缩到远小于 1 作为次目标，使换乘次数相同时仍倾向耗时更短的走法，
             * 避免为了少换乘而绕出任意长的路径。进出站步行不计换乘，只留极小时间项。
             */
            transfers: {
                label: "最少换乘",
                hop: (line, a, b) => {
                    const minutes = hopMinutes(line, a, b);
                    return Number.isFinite(minutes) ? minutes * 1e-4 : null;
                },
                xfer: () => 1,
                walk: (minutes) => minutes * 1e-4,
                boardingWalk: (minutes) => 1 + minutes * 1e-4
            },
            fare: {
                label: "最省",
                hop: (line, a, b) => {
                    const km = hopKm(line, a, b);
                    return km === null ? null : km * (line.mode === "tram" ? 1.6 : 1);
                },
                xfer: () => 0.5,
                walk: (minutes) => minutes,
                boardingWalk: (minutes) => minutes
            }
        };

        /**
         * 规划一条路径
         * @returns {object|null} 不可达或起讫点未开通时返回 null
         */
        function plan(from, to, objectiveKey = "time") {
            const objective = OBJECTIVES[objectiveKey] || OBJECTIVES.time;
            if (!from || !to) return null;
            if (!reachable(from) || !reachable(to)) return null;
            if (from === to) return { minutes: 0, stops: 0, transfers: 0, distance: 0, fare: 0, steps: [] };

            const dist = new Map();
            const prev = new Map();
            const heap = createHeap();

            const relax = (key, cost, fromKey, info) => {
                const known = dist.get(key);
                if (known !== undefined && known <= cost) return;
                dist.set(key, cost);
                prev.set(key, { from: fromKey, info });
                heap.push(cost, key);
            };

            /** 在某站登上所有可乘状态；info 记录这次上车前发生了什么（起点 / 换乘 / 步行） */
            const board = (sid, base, fromKey, info) => {
                if (!reachable(sid)) return;
                (boardable.get(sid) || []).forEach(({ lineId, wi, idx }) => {
                    const line = lineById.get(lineId);
                    [1, -1].forEach((dir) => {
                        if (!hasService(line, wi, idx, dir)) return;
                        relax(stateKey(sid, lineId, wi, dir), base, fromKey, info);
                    });
                });
            };

            board(from, 0, null, null);
            // 起点直接出站步行：属于前往乘车，不计换乘
            (walkMap[from] || []).forEach((link) => {
                const minutes = Number(link.minutes) || 0;
                board(link.to, objective.walk(minutes), null,
                    { t: "walk", a: from, b: link.to, minutes, free: link.free !== false });
            });

            let goalKey = null;
            while (heap.size) {
                const top = heap.pop();
                if (!top) break;
                const [cost, key] = top;
                if (cost > (dist.get(key) ?? INF)) continue;
                const [sid, lineId, wiRaw, dirRaw] = key.split("|");
                const wi = Number(wiRaw), dir = Number(dirRaw);
                if (sid === to) { goalKey = key; break; }

                const line = lineById.get(lineId);
                // ① 乘车：前进一站（idx 由站序反查，故状态键无需携带下标）
                const idx = line.ways[wi].indexOf(sid);
                const next = idx < 0 ? null : step({ lineId, wi, idx, dir });
                if (next && reachable(next.sid)) {
                    const minutes = hopMinutes(line, sid, next.sid);
                    const weight = objective.hop(line, sid, next.sid);
                    // 该目标缺数据（如区间无坐标）时退化为时间口径，保证各目标的连通性一致
                    const stepCost = Number.isFinite(weight) ? weight : minutes;
                    if (stepCost !== null) {
                        relax(stateKey(next.sid, lineId, wi, dir), cost + stepCost, key, { t: "ride", line: lineId });
                    }
                }

                // ② 同站换乘：切到本站其他线路（同线不同支也算换乘）
                (boardable.get(sid) || []).forEach(({ lineId: toLineId, wi: toWi, idx: toIdx }) => {
                    if (toLineId === lineId && toWi === wi) return;
                    if (!lineById.has(toLineId)) return;
                    const minutes = xferMinutes(sid, lineId, toLineId);
                    const toLine = lineById.get(toLineId);
                    [1, -1].forEach((toDir) => {
                        if (!hasService(toLine, toWi, toIdx, toDir)) return;
                        relax(stateKey(sid, toLineId, toWi, toDir), cost + objective.xfer(sid, lineId, toLineId), key,
                            { t: "xfer", at: sid, fromLine: lineId, toLine: toLineId, minutes });
                    });
                });

                // ③ 出站步行换乘；步行落地即终点站时属于出站到达，不计换乘
                (walkMap[sid] || []).forEach((link) => {
                    const minutes = Number(link.minutes) || 0;
                    const toGoal = String(link.to) === String(to);
                    const weight = toGoal ? objective.walk(minutes) : objective.boardingWalk(minutes);
                    board(link.to, cost + weight, key,
                        { t: "walk", a: sid, b: link.to, minutes, free: link.free !== false });
                });
            }

            if (!goalKey) return null;

            // ── 回溯并压缩为步骤 ──────────────────────────────────────────────
            const chain = [];
            for (let key = goalKey; key; ) {
                const entry = prev.get(key);
                chain.unshift({ key, info: entry?.info || null });
                key = entry?.from || null;
            }

            const steps = [];
            let ride = null;
            let cursor = from;   // 当前所在站：用于给 ride 段补上「上车站」
            const flush = () => { if (ride) { steps.push(ride); ride = null; } };

            chain.forEach(({ key, info }) => {
                if (!info) return;                      // 起点状态本身
                if (info.t === "xfer") {
                    flush();
                    steps.push({ t: "xfer", at: info.at, fromLine: info.fromLine, toLine: info.toLine, minutes: info.minutes });
                    cursor = info.at;
                    return;
                }
                if (info.t === "walk") {
                    flush();
                    steps.push({
                        t: "walk", a: info.a, b: info.b,
                        minutes: info.minutes, free: info.free !== false
                    });
                    cursor = info.b;
                    return;
                }
                const [sid, lineId, wiRaw, dirRaw] = key.split("|");
                const wi = Number(wiRaw), dir = Number(dirRaw);
                if (!ride || ride.line !== lineId || ride.wi !== wi || ride.dir !== dir) {
                    flush();
                    ride = { t: "ride", line: lineId, wi, dir, stops: [cursor], minutes: 0, km: 0 };
                }
                const minutes = hopMinutes(lineById.get(lineId), cursor, sid);
                const km = hopKm(lineById.get(lineId), cursor, sid);
                ride.stops.push(sid);
                ride.minutes += minutes === null ? 0 : minutes;
                ride.km += km === null ? 0 : km;
                cursor = sid;
            });
            flush();

            // 出站步行的语义按上下文定位：夹在乘车段之间才是换乘，起点步行上车 / 下车后
            // 步行直达终点都只是进出站步行——这与寻路时 walk / boardingWalk 的权重口径一致
            steps.forEach((step, index) => {
                if (step.t !== "walk") return;
                const riddenBefore = steps.slice(0, index).some((item) => item.t === "ride");
                const riddenAfter = steps.slice(index + 1).some((item) => item.t === "ride");
                step.kind = riddenBefore && riddenAfter ? "transfer" : riddenBefore ? "exit" : "board";
            });

            const stops = steps.filter((s) => s.t === "ride")
                .reduce((sum, s) => sum + Math.max(0, s.stops.length - 1), 0);
            const transfers = steps.filter((s) => s.t === "xfer"
                || (s.t === "walk" && s.kind === "transfer")).length;
            const distance = Math.round(steps.filter((s) => s.t === "ride")
                .reduce((total, s) => total + (s.km || 0), 0) * 10) / 10;
            // 用时/里程/票价一律由实际步骤结算，不能取该目标下的搜索代价：
            // 各目标的代价量纲不同（分钟 / 公里 / 站数），直接当分钟用会算错
            const minutes = Math.round(steps.reduce((total, s) => total + (s.minutes || 0), 0) * 10) / 10;

            return {
                minutes, stops, transfers, distance,
                fare: computeFare(steps),
                steps
            };
        }

        /**
         * 计费系统内最短里程：真实计费不认乘客实际走法，而是按「进站—出站」之间的最短里程定价
         * （同一系统内换乘不重复计费，绕行更远也不会多收）。
         * 故在只含该系统线路的子图上跑一次最短路，权重取区间里程；
         * 状态只用车站——计费口径就是物理最短路，与乘客是否改乘无关。
         */
        function minKmWithin(from, to, system) {
            if (!from || !to) return null;
            if (from === to) return 0;
            const dist = new Map([[from, 0]]);
            const heap = createHeap();
            heap.push(0, from);
            while (heap.size) {
                const top = heap.pop();
                if (!top) break;
                const [cost, sid] = top;
                if (cost > (dist.get(sid) ?? INF)) continue;
                if (sid === to) return cost;
                (boardable.get(sid) || []).forEach(({ lineId, wi, idx }) => {
                    const line = lineById.get(lineId);
                    if (!line || lineSystem(line.id) !== system) return;
                    [1, -1].forEach((dir) => {
                        if (!hasService(line, wi, idx, dir)) return;
                        const next = step({ lineId, wi, idx, dir });
                        if (!next || !reachable(next.sid)) return;
                        const km = hopKm(line, sid, next.sid);
                        if (km === null) return;
                        const nextCost = cost + km;
                        if (nextCost < (dist.get(next.sid) ?? INF)) {
                            dist.set(next.sid, nextCost);
                            heap.push(nextCost, next.sid);
                        }
                    });
                });
            }
            return null;
        }

        /**
         * 票价结算：同一计费系统内连续乘车合并计费，切到别的系统就分别结算
         * ——浑南有轨「换乘线路乘车须重新购票」、大连 201 与 202 各自购票、
         * 长春 G54 与 G55 各自购票，都由城市用 fareSystems 拆成独立系统表达。
         * 出站步行不必单独结算：站外换乘接的多是别家的线，切系统时已重新计费。
         * 每段的计费里程取该段「进站—出站」之间的最短里程，而非所选路线的实际里程；
         * 按段计价的线路（如大连 201 路）改用结算上下文里的实际乘车站序自行判定。
         */
        function computeFare(steps) {
            const rules = network?.fare;
            if (!rules) return null;
            let total = 0, system = null, entry = null, exit = null, riddenKm = 0, stops = [];
            const settle = () => {
                if (!system || !entry) return;
                const rule = rules[system];
                if (typeof rule === "function") {
                    const billed = minKmWithin(entry, exit, system) ?? riddenKm;
                    if (billed > 0) total += rule(billed, { entry, exit, stops });
                }
                system = null; entry = exit = null; riddenKm = 0; stops = [];
            };
            steps.forEach((s) => {
                if (s.t !== "ride") return;
                const next = lineSystem(s.line);
                if (system && next !== system) settle();
                if (!system) entry = s.stops[0];
                system = next;
                exit = s.stops[s.stops.length - 1];
                riddenKm += s.km || 0;
                stops.push(...(s.stops || []));
            });
            settle();
            return total;
        }

        /**
         * 按多种优先级分别寻路，再合并完全相同的路线（labels 记录它赢得的优先级）；
         * 结果按时间升序，第一条即最推荐。
         */
        function planAll(from, to) {
            const found = new Map();
            Object.entries(OBJECTIVES).forEach(([key, objective]) => {
                const result = plan(from, to, key);
                if (!result) return;
                const signature = result.steps.map((s) => (s.t === "ride"
                    ? `R:${String(s.line).split("#")[0]}:${s.dir}`
                    : s.t === "xfer" ? `X:${s.at}` : `W:${s.a}-${s.b}`)).join(">");
                const seen = found.get(signature);
                if (seen) { seen.labels.push(objective.label); return; }
                found.set(signature, { id: key, labels: [objective.label], ...result });
            });
            return [...found.values()].sort((a, b) => a.minutes - b.minutes);
        }

        return {
            plan,
            planAll,
            linesAt: (sid) => (boardable.get(sid) || []).map((item) => item.lineId),
            stationsOfLine: (lineId) => (lineById.get(lineId)?.ways || []).flat()
        };
    }

    window.CGoRoutePlanner = { create, DEFAULT_XFER_MINUTES };
})();
