/**
 * CGo OpenMap - 路线规划数据构建（共享层）
 *
 * ⚠️ 临时共享位置：与 route-planner.js、stacard-engine.js 等同处 city/shenyang/shared/，
 * 计划随共享层整体迁入 core/。
 *
 * 职责边界
 * - 本文件负责：把「城市时刻表 + 线路站序 + 坐标」整理成规划内核所需的 network。
 *   含区间用时推算（多链逐站差值聚合、末班优先、距离模型兜底）与虚拟换乘映射。
 * - 城市侧负责：用 reader 把自家时刻表字段喂进来（各城结构不同），以及季节阈值等参数。
 *
 * 区间用时口径（三城已验证）
 *   1) 成链：按 (终点站/方向, 时间带, 采样) 分组，同组内逐站取时刻差 Δ = 后站 − 前站；
 *      仅保留 Δ ∈ (0, HOP_MAX] —— 超出即「两端不属于同一趟车」（多点始发线路上，
 *      始发点上游一站的差值必然失真），该链在该区间作废。
 *   2) 聚合：末班链优先（末班车中途始发少、链路干净）；首末两期一致时取均值（互相降噪），
 *      分歧过大则只信末班；单期可用时直接用该期。
 *   3) 兜底：无实测的区间用距离模型 k × (0.5 + km / MODEL_SPEED) 补足，
 *      k 由该线实测全程反推（城市间 k 差异达 50%，不可用全局常数）。
 *   4) 里程：官方 distances 优先；缺失时用坐标直线 × bend 修正。
 *
 * 配置契约（由城市侧提供）
 * {
 *   linesData, stationsData,                    // 本站全局数据
 *   coords: "./city/{city}/amap_data.json",     // 坐标兜底；也可用 coordOf({ready, coordOf}) 自备
 *   reader(line, sid) -> [{ dest, period, label, time }],
 *        dest   : 该方向的终点站 ID 或 "line-first" / "line-last" 代号
 *        period : "first" | "last"
 *        label  : 采样标签（如 "夏首"，仅用于链内分组）
 *        time   : "HH:MM"
 *   virtualTransfers: { paid, free },           // 可选，默认取全局 VIRTUAL_*_TRANSFER_MAP
 *   fareSystems: { "线路ID": "计费系统名" },     // 可选，把各自购票的线路拆成独立计费系统
 *   fare: { 计费系统名(km, { entry, exit, stops }) -> 元 },   // 可选，不配则该城不显示票价
 *   walkMinutes, xferMinutes, bend              // 可选，覆盖 DEFAULTS
 *       其中 walkMinutes 可以是数字（全城统一，默认 6），也可以是
 *       { "起点ID|终点ID": 分钟 } 逐对覆盖站外换乘的步行时间
 * }
 *
 * 贯通运行不带在 config 里：它由城市侧的 lineLinks 声明，经 CGoLineLink 解析后
 * 直接作为 network.through 下发（见 build 末尾），城市配置无需重复传参。
 *
 * 构建网络
 * async build(config) -> { network, stats }
 *   内部会先等坐标索引就绪再建图——官方站距并非每条区间都有（推算值一律写 "?" 占位），
 *   缺失区间由坐标推算里程，若在索引就绪前构建，那些区间都会算不出里程而不可通行。
 */
(function () {
    "use strict";

    const HOP_MAX = 8;                // 单区间用时物理上限（分钟）
    const SPREAD_MAX = 1;             // 多链允许的最大分歧（分钟）
    const MODEL_SPEED = 0.9;          // 距离模型纯运行速度（km / 分钟）
    const DEFAULTS = { bend: 1.05, walkMinutes: 6, xferMinutes: 2 };
    /** 未开通车站与未开通区段「重叠」判定的画布像素容差（编辑器画的折线未必逐点压准站心） */
    const NOT_OPEN_OVERLAP_TOLERANCE = 10;

    const toMinutes = (value) => {
        const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? "").trim());
        return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    const mean = (list) => list.reduce((s, v) => s + v, 0) / list.length;
    const sum = (list) => list.reduce((s, v) => s + v, 0);

    /* ======================================================================
     * 站内换乘方式与换乘时间（transferAt）
     *
     * 城市可用 config.transferAt 描述「每个换乘站怎么换、要多久」：
     *   transferAt: {
     *     "M104": { mode: "通道换乘", minutes: 5 },
     *     "M108": { mode: "十字节点换乘", minutes: 1 },
     *     "M423": { mode: "同台换乘", minutes: 1,           // 默认（不分线路对）
     *               pairs: { "M3|M6": { mode: "通道换乘", minutes: 4 } } }
     *   }
     * 规格：
     *   · 键为换乘站 ID；pairs 的键是「线路A|线路B」，两条线的顺序无关，内部会归一化；
     *   · pairs 命中时覆盖本站的默认 mode / minutes，故「同站不同线路对换乘方式不同」
     *     （如帝封江：4/5 号线同台 1 分钟、换滨海快线通道 4 分钟）可以直接表达；
     *   · `sameDirMinutes` 可选：只给**两列车同向**的那一对方向用这个时长，
     *     反向仍用 minutes —— 用于「同向同台」这类方向不对称的换乘
     *     （同向恰好同台、反向要绕对面站台）。
     *   · `sameDir` 可选：**显式指定哪一对方向是同台**，形如
     *     `{ "M1+M5-": 1, "M1-M5+": 1 }`（键为「线A+dir」+「线B+dir」，dir 取 + / -），
     *     值为该组合的分钟数。给了 sameDir 就以它为准，**不再用几何判定** ——
     *     站台实际布置以现场为准，几何推算只能当兜底（曾与实测不一致）。
     *     没有 sameDir 时，才退回按站序几何判方向：
     *     取该站沿站序前后各 span 站算单位位移向量（span 由大到小回退），
     *     两线向量夹角 < 90° 即视为同向。
     *   · 未配置的车站 → 内核用 DEFAULTS.xferMinutes（同站换乘默认 2 分钟）。
     * 城市未配置 transferAt 时本机制完全不生效，与不加完全一致。
     * ====================================================================== */

    /** 判定「同向」时优先尝试的前后跨度（站数）；越靠近线路端头越取不到，故逐级回退 */
    const SAME_DIR_SPANS = [3, 2, 1];
    const SAME_DIR_MAX_ANGLE = 90;

    /**
     * 某线在某站沿某方向的单位位移向量。
     *
     * 跨度必须逐级回退：靠近线路端头的站（如梁厝在 1 号线上距终点只剩 2 站）
     * 按 3 站去取会越界，若直接返回 null，同向判定就永远不成立、
     * 「同向同台」会静默退化成一律用较长的那档时间。
     */
    function headingVector(line, sid, dir, stations) {
        const ids = line?.stationIds || line?.ways?.[0] || [];
        const i = ids.indexOf(sid);
        if (i < 0) return null;
        for (const span of SAME_DIR_SPANS) {
            const j = i + dir * span;
            if (j < 0 || j >= ids.length) continue;
            const a = stations?.[ids[i]];
            const b = stations?.[ids[j]];
            if (!a || !b) continue;
            const dx = Number(b.x) - Number(a.x);
            const dy = Number(b.y) - Number(a.y);
            const len = Math.hypot(dx, dy);
            if (!len) continue;
            return { x: dx / len, y: dy / len };
        }
        return null;
    }

    /** 两个方向向量是否同向（夹角 < 阈值即视为同向） */
    function isSameDirection(v1, v2) {
        if (!v1 || !v2) return false;
        const dot = Math.max(-1, Math.min(1, v1.x * v2.x + v1.y * v2.y));
        // 画布 Y 轴向下，但这里只比较两向量的夹角，与坐标系朝向无关
        const angle = Math.acos(dot) * 180 / Math.PI;
        return angle < SAME_DIR_MAX_ANGLE;
    }

    /** 归一化线路对键（两条线顺序无关） */
    const pairKey = (a, b) => {
        const x = String(a).split("#")[0];
        const y = String(b).split("#")[0];
        return x <= y ? `${x}|${y}` : `${y}|${x}`;
    };

    /**
     * 生成一个「按站 + 按线路对 + 按方向」查换乘时间的函数。
     * 返回 null 表示该站未配置，交由内核用默认换乘时间。
     */
    function makeTransferLookup(config) {
        const table = config?.transferAt;
        if (!table || typeof table !== "object") return () => null;
        const linesById = new Map();
        (config.linesData || []).forEach((l) => linesById.set(l.id, l));
        const stations = config.stationsData || {};

        const lookup = (sid, fromLine, toLine, fromDir, toDir) => {
            const entry = table[String(sid)];
            if (!entry) return null;
            const fromBase = String(fromLine).split("#")[0];
            const toBase = String(toLine).split("#")[0];
            const perPair = entry.pairs?.[pairKey(fromBase, toBase)];
            const spec = perPair || entry;
            let minutes = Number(spec.minutes);
            // 两种表达同台对的方式都算触发：显式 sameDir 优先，其次 sameDirMinutes 走几何
            if (spec.sameDirMinutes !== undefined || spec.sameDir !== undefined) {
                minutes = resolveSameDir(spec, sid, fromBase, toBase, fromDir, toDir, stations, linesById, minutes);
            }
            if (!Number.isFinite(minutes)) return null;
            return { minutes, mode: perPair?.mode || entry.mode || "" };
        };
        return lookup;
    }

    /**
     * 「同向同台」那一档的时长。
     *
     * 两种来源，**显式优先**：
     *   1. spec.sameDir —— 城市直接点明哪一对方向是同台，形如 { "M1+M5-": 1 }；
     *      线对顺序无关，两种写法都认；命中即用其值。
     *   2. spec.sameDirMinutes —— 没点明时按站序几何判定同向（见 headingVector）。
     *
     * 之所以要有第 1 种：站台实际布置以现场为准，几何推算只能当兜底
     * ——实测中出现过几何判定的同台对与城市给的实际同台对不一致的情形。
     */
    function resolveSameDir(spec, sid, fromBase, toBase, fromDir, toDir, stations, linesById, baseMinutes) {
        const dirTag = (id, d) => `${id}${Number(d) > 0 ? "+" : "-"}`;
        const explicit = spec.sameDir;
        if (explicit && typeof explicit === "object") {
            const a = dirTag(fromBase, fromDir);
            const b = dirTag(toBase, toDir);
            const hit = explicit[`${a}${b}`] ?? explicit[`${b}${a}`];
            // 点明了同台对却不在其中 → 用基础时长（反向）
            return hit !== undefined && Number.isFinite(Number(hit)) ? Number(hit) : baseMinutes;
        }
        const v1 = headingVector(linesById.get(fromBase), sid, Number(fromDir), stations);
        const v2 = headingVector(linesById.get(toBase), sid, Number(toDir), stations);
        return isSameDirection(v1, v2) ? Number(spec.sameDirMinutes) : baseMinutes;
    }

    /**
     * 站外换乘表收集器：把各城 data_virtual_transfers.js 的两张表整理成
     * { paid, free } 两组（结果面板据此区分「付费/免费出站换乘」与图标）。
     *
     * 这两张表在各城都是顶层 const，不挂在 window 上，故用 typeof 探测裸标识符；
     * 未声明的城市安全返回空表。
     */
    function collectVirtualTransfers() {
        const gather = (source) => {
            const out = {};
            Object.entries(source || {}).forEach(([sid, list]) => {
                if (Array.isArray(list)) (out[sid] ||= []).push(...list);
            });
            return out;
        };
        return {
            paid: gather(typeof VIRTUAL_TRANSFER_MAP !== "undefined" ? VIRTUAL_TRANSFER_MAP : null),
            free: gather(typeof VIRTUAL_FREE_TRANSFER_MAP !== "undefined" ? VIRTUAL_FREE_TRANSFER_MAP : null)
        };
    }

    /**
     * 高德坐标索引：站名 → "lng,lat"。
     *
     * 只服务于「官方站距缺失」线路的里程兜底。三城之中大连、长春全网没有
     * distances、长春有轨也没有时刻数据，所以坐标覆盖率直接决定这些区间能否通行。
     * 按站名扁平索引，同名站（地铁站与有轨站重名）取首个命中，分组顺序即优先级。
     *
     * @returns {{ ready: Promise, coordOf: (name: string) => string|null }}
     */
    function amapCoordIndex(url) {
        const index = new Map();
        const ready = fetch(url)
            .then((res) => res.json())
            .then((data) => {
                (data?.l || []).forEach((group) => (group.st || []).forEach((station) => {
                    if (station?.n && !index.has(station.n)) index.set(station.n, station.sl);
                }));
            })
            .catch(() => {});   // 坐标仅用于里程兜底，取不到不影响有实测站距的线路
        return { ready, coordOf: (name) => index.get(name) || null };
    }

    /**
     * 把一条时刻记录里的若干时刻摊平成构建器要的条目，自动丢弃空值。
     * 各城时刻表的轴并不相同（沈阳按季节、大连按工作日/周末、长春按日期类型 + 季节），
     * 这里只统一输出形状，字段映射仍由各城 reader 说明。
     *
     * @param {string} dest 终点站 ID 或 "line-first" / "line-last" 代号
     * @param {Array<[string, string, string]>} entries [period, label, time] 三元组
     */
    function hourSlots(dest, entries) {
        return (entries || [])
            .filter((entry) => entry[2])
            .map(([period, label, time]) => ({ dest, period, label, time }));
    }

    /** 站序分组（分支安全访问器） */
    function stationGroups(line) {
        if (line.hasbranch) {
            return ["way1", "way2"].map((way) => ({
                ids: line[`stationIds-${way}`] || [],
                dist: line[`distances-${way}`] || []
            })).filter((group) => group.ids.length);
        }
        return line.stationIds ? [{ ids: line.stationIds, dist: line.distances || [] }] : [];
    }

    /** 制式判定：有轨电车与地铁的计价规则不同，需在图里带上制式 */
    function isTramLine(line) {
        return String(line?.id || "").toUpperCase().startsWith("HNT")
            || String(line?.name || "").includes("有轨");
    }

    /** 该链上的站点下标是否连续；终点站在站序端点，或全部数据站位于终点站同一侧 */
    function chainDirection(line, ids, dest, present) {
        const last = ids.length - 1;
        const destIdx = dest === "line-first" ? 0 : dest === "line-last" ? last : ids.indexOf(dest);
        if (destIdx < 0) return 0;
        const minIdx = Math.min(...present), maxIdx = Math.max(...present);
        if (destIdx >= maxIdx) return 1;
        if (destIdx <= minIdx) return -1;
        return 0;
    }

    /**
     * 逐区间实测用时（聚合后的单一值，null 表示该区间无实测）
     * @returns {Array<number|null>} 长度 = ids.length - 1
     */
    function measuredHops(line, ids, reader) {
        const chains = new Map();          // chainKey → { dest, period, times: Map<idx, minute> }
        ids.forEach((sid, idx) => {
            (reader(line, sid) || []).forEach((item) => {
                const minute = toMinutes(item.time);
                if (minute === null) return;
                const key = `${item.dest}|${item.period}|${item.label}`;
                if (!chains.has(key)) chains.set(key, { dest: item.dest, period: item.period, times: new Map() });
                chains.get(key).times.set(idx, minute);
            });
        });

        // 环线的站序首尾相接，区间数比站数多一条（末站 → 首站），与非环线统一按「完整一圈」展开
        const loop = Boolean(line.isLoop);
        const buckets = Array.from({ length: loop ? ids.length : ids.length - 1 },
            () => ({ first: [], last: [] }));
        chains.forEach((chain) => {
            const present = [...chain.times.keys()].sort((a, b) => a - b);
            if (present.length < 2) return;
            const dir = chainDirection(line, ids, chain.dest, present);
            if (!dir) return;
            const ordered = dir > 0 ? present : present.slice().reverse();
            for (let k = 0; k < ordered.length - 1; k++) {
                const a = ordered[k], b = ordered[k + 1];
                // 环线首尾相接：末站 → 首站也是相邻的一跳
                const wraps = loop && a === ids.length - 1 && b === 0;
                if (!wraps && Math.abs(b - a) !== 1) continue;             // 跨越缺数据站，不强行分摊
                let delta = chain.times.get(b) - chain.times.get(a);
                if (delta < 0) delta += 1440;                    // 跨零点
                if (delta > 0 && delta <= HOP_MAX) {
                    // 跨接缝那一跳记在最后一条区间（末站 → 首站）上
                    const slot = wraps ? ids.length - 1 : Math.min(a, b);
                    buckets[slot][chain.period === "last" ? "last" : "first"].push(delta);
                }
            }
        });

        const usable = (list) => list.length > 0
            && (list.length < 2 || Math.max(...list) - Math.min(...list) <= SPREAD_MAX);

        return buckets.map((bucket) => {
            const okFirst = usable(bucket.first), okLast = usable(bucket.last);
            if (okFirst && okLast) {
                return Math.abs(mean(bucket.first) - mean(bucket.last)) <= SPREAD_MAX
                    ? mean([...bucket.first, ...bucket.last]) : mean(bucket.last);
            }
            if (okLast) return mean(bucket.last);
            if (okFirst) return mean(bucket.first);
            return null;
        });
    }

    /**
     * 区间里程（km）：官方站距优先，缺失时坐标直线 × 弯曲系数。
     * 环线（loop）站距数组比站序多一条（末站 → 首站），按完整一圈展开。
     */
    function intervalKm(group, stationsData, coordOf, bend, loop) {
        const meters = (a, b) => {
            if (!a || !b) return 0;
            const [lo1, la1] = a.split(",").map(Number);
            const [lo2, la2] = b.split(",").map(Number);
            return 6371000 * Math.hypot((la2 - la1) * Math.PI / 180,
                (lo2 - lo1) * Math.PI / 180 * Math.cos(la1 * Math.PI / 180));
        };
        const count = loop ? group.ids.length : group.ids.length - 1;
        return Array.from({ length: count }, (_, i) => {
            const next = group.ids[(i + 1) % group.ids.length];
            // 官方站距优先；"?" / "??" 这类占位（该段没有可靠里程，前端只显示「约XXX米」）
            // 与完全缺失同等对待，一起走坐标兜底
            const official = Number(group.dist[i]);
            if (Number.isFinite(official) && official > 0) return official / 1000;
            const a = coordOf(stationsData[group.ids[i]]?.cn), b = coordOf(stationsData[next]?.cn);
            return a && b ? meters(a, b) / 1000 * bend : 0;
        });
    }

    /**
     * 构建规划网络（异步：先等坐标索引就绪，否则无站距线路的区间算不出里程）
     * @returns {Promise<{network: object, stats: Array}>}
     */
    async function build(config) {
        const linesData = config.linesData || [];
        const stationsData = config.stationsData || {};
        // 坐标来源：给 URL 即由共享层建索引（多城都只需这一行）；
        // 也已支持城市自备 { ready, coordOf } 或裸 coordOf 函数
        const coords = typeof config.coords === "string" ? amapCoordIndex(config.coords)
            : (config.coords && typeof config.coords.coordOf === "function" ? config.coords : null);
        if (coords?.ready) await coords.ready;
        const coordOf = coords?.coordOf || config.coordOf || (() => null);
        const reader = config.reader || (() => []);
        const bend = Number(config.bend) || DEFAULTS.bend;
        const walkMinutes = Number(config.walkMinutes) || DEFAULTS.walkMinutes;
        const fareSystems = config.fareSystems || {};
        /** 站内换乘方式与时间查表（城市未配置 transferAt 时恒返回 null，行为与不加一致） */
        const transferLookup = makeTransferLookup(config);

        const lines = [];
        const stats = [];

        linesData.forEach((line) => {
            if (line.isPointOnly) return;
            stationGroups(line).forEach((group, groupIndex) => {
                if (group.ids.length < 2) return;
                const measured = measuredHops(line, group.ids, reader);
                const loop = Boolean(line.isLoop);
                const km = intervalKm(group, stationsData, coordOf, bend, loop);
                // 逐线校准 k：用有实测且有里程的区间反推
                const sampleIdx = measured.map((v, i) => (v !== null && km[i] > 0 ? i : -1)).filter((i) => i >= 0);
                const weightSum = sum(sampleIdx.map((i) => 0.5 + km[i] / MODEL_SPEED));
                const k = weightSum ? sum(sampleIdx.map((i) => measured[i])) / weightSum : 1;

                const hop = new Map();
                const hopKmMap = new Map();
                // 相邻站对；环线首尾相接，末尾再补一条闭合边（末站 → 首站）。
                // 缺了这条边，规划器算不出「沿环的另一侧走」的去路，只能绕远路：
                // 环线图例上看不出来的那一跳恰恰是最近的一跳。
                const pairs = group.ids.slice(0, -1).map((sid, i) => [sid, group.ids[i + 1], i]);
                if (loop && group.ids.length > 2) {
                    pairs.push([group.ids[group.ids.length - 1], group.ids[0], group.ids.length - 1]);
                }
                pairs.forEach(([from, to, i]) => {
                    const fallback = km[i] > 0 ? Math.round(k * (0.5 + km[i] / MODEL_SPEED) * 10) / 10 : null;
                    const value = measured[i] !== null ? measured[i] : fallback;
                    if (Number.isFinite(km[i]) && km[i] > 0) {
                        hopKmMap.set(`${from}|${to}`, km[i]);
                        hopKmMap.set(`${to}|${from}`, km[i]);
                    }
                    if (value === null) return;
                    hop.set(`${from}|${to}`, value);
                    hop.set(`${to}|${from}`, value);
                });

                const id = groupIndex === 0 ? line.id : `${line.id}#${groupIndex + 1}`;
                // 制式决定图标与「最省」的边际权重；计费系统决定换乘是否重新购票。
                // 默认两者一致（地铁网内换乘免费），城市可用 fareSystems 把同一制式下
                // 各自购票的线路拆开——大连 201 与 202、长春 G54 与 G55 都属此列。
                const mode = isTramLine(line) ? "tram" : "metro";
                /** 该站的换乘方式与基础换乘时间（城市未配置该站时返回 null，内核用默认值） */
                const xferInfoAt = (sid, fromLine, toLine, fromDir, toDir) =>
                    transferLookup(sid, fromLine, toLine, fromDir, toDir);
                lines.push({
                    id,
                    mode,
                    system: fareSystems[line.id] || mode,
                    ways: [group.ids],
                    loop,
                    hop: (a, b) => hop.get(`${a}|${b}`) ?? null,
                    hopKm: (a, b) => hopKmMap.get(`${a}|${b}`) ?? null,
                    // 内核在换乘时调用；带方向参数以支持「同向同台」（见下方 transferLookup）
                    xfer: (sid, fromLine, toLine, fromDir, toDir) => {
                        const info = xferInfoAt(sid, fromLine, toLine, fromDir, toDir);
                        return info ? info.minutes : null;
                    },
                    xferMode: (sid, fromLine, toLine, fromDir, toDir) => {
                        const info = xferInfoAt(sid, fromLine, toLine, fromDir, toDir);
                        return info ? info.mode : null;
                    }
                });
                stats.push({
                    id, name: line.name,
                    total: loop ? group.ids.length : group.ids.length - 1,
                    measured: sampleIdx.length,
                    k
                });
            });
        });

        // 站外换乘：付费出站（VIRTUAL_TRANSFER_MAP）与免费出站（VIRTUAL_FREE_TRANSFER_MAP）
        // 分开标记，结果面板据此显示「免费出站换乘 / 付费出站换乘」与不同图标。
        // 三城数据同构，默认直接取全局表；城市如需另行提供，传 { paid, free } 即可。
        const transfers = (config.virtualTransfers === undefined || config.virtualTransfers === true)
            ? collectVirtualTransfers() : config.virtualTransfers;
        // 步行时间：默认全城同一个 walkMinutes；城市要按站对区分时，传
        // walkMinutes: { "起点ID|终点ID": 分钟 } 逐对覆盖（福州水部→闽都 10 分、
        // 三叉街（滨海快线）→三叉街 6 分即走这条路）。逐对表优先于统一值。
        const walkOverride = (config.walkMinutes && typeof config.walkMinutes === "object")
            ? config.walkMinutes : null;
        const walk = {};
        [[transfers?.paid, false], [transfers?.free, true]].forEach(([source, free]) => {
            Object.entries(source || {}).forEach(([from, partners]) => {
                (partners || []).forEach((to) => {
                    const key = `${from}|${to}`;
                    const minutes = Number(walkOverride?.[key]);
                    (walk[from] ||= []).push({
                        to: String(to),
                        minutes: Number.isFinite(minutes) ? minutes : walkMinutes,
                        free
                    });
                });
            });
        });

        // 贯通运行：同一条走廊上由两条线接续跑同一条交路（如大连 3 号线支线 ⇄ 13 号线在九里贯通）。
        // 声明由城市侧给出（city/{city}.js 的 lineLinks），这里只做转发，
        // 规划内核据此在衔接站把它们视作同一列车——通过时不记换乘、不计换乘耗时。
        const through = window.CGoLineLink?.throughPairs?.() || [];

        // 未开通车站能否「穿过」，取决于它是否与未开通区段重叠：
        //   · 重叠（站点落在 NOT_OPEN_LINES 的虚线上）→ 该站是随区段一起未开通的，
        //     列车根本还没开到这里，连穿过都不行（如长春 5 号线全线）；
        //   · 不重叠 → 线路已在运营，只是这一站暂缓开通（如北京陶然桥、青岛下王埠），
        //     列车照常经过、只是不停车，所以可以穿过。
        //
        // 已开通车站不参与这个判定——它们本来就能上下车，不存在「能否穿过」的问题，
        // 因此下面的循环只对 type "no" 的站做重叠比对。
        //
        // NOT_OPEN_LINES 是城市数据（画布折线点阵），这里只做几何比对，不掺城市业务。
        const notOpenPolylines = (typeof NOT_OPEN_LINES !== "undefined" && Array.isArray(NOT_OPEN_LINES) ? NOT_OPEN_LINES : [])
            .map((item) => (Array.isArray(item?.points) ? item.points : [])
                .map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
                .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)))
            .filter((points) => points.length >= 2);
        /** 点到线段的最短距离（画布像素） */
        const distanceToSegment = (px, py, ax, ay, bx, by) => {
            const dx = bx - ax, dy = by - ay;
            const lengthSq = dx * dx + dy * dy;
            const t = lengthSq ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)) : 0;
            return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
        };
        /** 该站是否落在未开通区段上（容差按画布线宽量级取，编辑器画的折线未必逐点压准站心） */
        const overlapsNotOpenSegment = (station) => {
            const px = Number(station?.x), py = Number(station?.y);
            if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
            return notOpenPolylines.some((points) => points.some((point, i) => {
                if (i === 0) return false;
                const prev = points[i - 1];
                return distanceToSegment(px, py, prev.x, prev.y, point.x, point.y) <= NOT_OPEN_OVERLAP_TOLERANCE;
            }));
        };
        const passThrough = new Set();
        Object.entries(stationsData).forEach(([sid, station]) => {
            // 已开通车站不参与重叠判定：它们无需考虑能否穿过
            if (String(station?.type || "") !== "no") return;
            if (!overlapsNotOpenSegment(station)) passThrough.add(String(sid));
        });

        return {
            network: {
                lines,
                stations: Object.fromEntries(Object.entries(stationsData).map(([sid, s]) => [sid, {
                    type: s.type,
                    passThrough: passThrough.has(String(sid))
                }])),
                walk,
                through,
                xferMinutes: Number(config.xferMinutes) || DEFAULTS.xferMinutes,
                // 城市撤下不摆给乘客看的优先级（如福州去掉「距离最短」）；
                // 内核仍可用 plan(key) 取用，只是不进多优先级候选列表
                disabledObjectives: config.disabledObjectives || [],
                fare: config.fare || null
            },
            stats
        };
    }

    window.CGoRouteData = {
        build, amapCoordIndex, collectVirtualTransfers, hourSlots, HOP_MAX, DEFAULTS
    };
})();
