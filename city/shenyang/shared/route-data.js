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
 * }
 *
 * 构建网络
 * async build(config) -> { network, stats }
 *   内部会先等坐标索引就绪再建图——大连、长春全网缺 distances，里程完全由坐标推算，
 *   若在索引就绪前构建，所有区间都会算不出里程而不可通行。
 */
(function () {
    "use strict";

    const HOP_MAX = 8;                // 单区间用时物理上限（分钟）
    const SPREAD_MAX = 1;             // 多链允许的最大分歧（分钟）
    const MODEL_SPEED = 0.9;          // 距离模型纯运行速度（km / 分钟）
    const DEFAULTS = { bend: 1.05, walkMinutes: 6, xferMinutes: 2 };

    const toMinutes = (value) => {
        const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? "").trim());
        return m ? Number(m[1]) * 60 + Number(m[2]) : null;
    };
    const mean = (list) => list.reduce((s, v) => s + v, 0) / list.length;
    const sum = (list) => list.reduce((s, v) => s + v, 0);

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

        const buckets = ids.slice(0, -1).map(() => ({ first: [], last: [] }));
        chains.forEach((chain) => {
            const present = [...chain.times.keys()].sort((a, b) => a - b);
            if (present.length < 2) return;
            const dir = chainDirection(line, ids, chain.dest, present);
            if (!dir) return;
            const ordered = dir > 0 ? present : present.slice().reverse();
            for (let k = 0; k < ordered.length - 1; k++) {
                const a = ordered[k], b = ordered[k + 1];
                if (Math.abs(b - a) !== 1) continue;             // 跨越缺数据站，不强行分摊
                let delta = chain.times.get(b) - chain.times.get(a);
                if (delta < 0) delta += 1440;                    // 跨零点
                if (delta > 0 && delta <= HOP_MAX) {
                    buckets[Math.min(a, b)][chain.period === "last" ? "last" : "first"].push(delta);
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

    /** 区间里程（km）：官方站距优先，缺失时坐标直线 × 弯曲系数 */
    function intervalKm(group, stationsData, coordOf, bend) {
        const meters = (a, b) => {
            if (!a || !b) return 0;
            const [lo1, la1] = a.split(",").map(Number);
            const [lo2, la2] = b.split(",").map(Number);
            return 6371000 * Math.hypot((la2 - la1) * Math.PI / 180,
                (lo2 - lo1) * Math.PI / 180 * Math.cos(la1 * Math.PI / 180));
        };
        return group.ids.slice(0, -1).map((sid, i) => {
            if (group.dist[i]) return group.dist[i] / 1000;
            const a = coordOf(stationsData[sid]?.cn), b = coordOf(stationsData[group.ids[i + 1]]?.cn);
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

        const lines = [];
        const stats = [];

        linesData.forEach((line) => {
            if (line.isPointOnly) return;
            stationGroups(line).forEach((group, groupIndex) => {
                if (group.ids.length < 2) return;
                const measured = measuredHops(line, group.ids, reader);
                const km = intervalKm(group, stationsData, coordOf, bend);
                // 逐线校准 k：用有实测且有里程的区间反推
                const sampleIdx = measured.map((v, i) => (v !== null && km[i] > 0 ? i : -1)).filter((i) => i >= 0);
                const weightSum = sum(sampleIdx.map((i) => 0.5 + km[i] / MODEL_SPEED));
                const k = weightSum ? sum(sampleIdx.map((i) => measured[i])) / weightSum : 1;

                const hop = new Map();
                const hopKmMap = new Map();
                group.ids.slice(0, -1).forEach((sid, i) => {
                    const fallback = km[i] > 0 ? Math.round(k * (0.5 + km[i] / MODEL_SPEED) * 10) / 10 : null;
                    const value = measured[i] !== null ? measured[i] : fallback;
                    if (Number.isFinite(km[i]) && km[i] > 0) {
                        hopKmMap.set(`${sid}|${group.ids[i + 1]}`, km[i]);
                        hopKmMap.set(`${group.ids[i + 1]}|${sid}`, km[i]);
                    }
                    if (value === null) return;
                    hop.set(`${sid}|${group.ids[i + 1]}`, value);
                    hop.set(`${group.ids[i + 1]}|${sid}`, value);
                });

                const id = groupIndex === 0 ? line.id : `${line.id}#${groupIndex + 1}`;
                // 制式决定图标与「最省」的边际权重；计费系统决定换乘是否重新购票。
                // 默认两者一致（地铁网内换乘免费），城市可用 fareSystems 把同一制式下
                // 各自购票的线路拆开——大连 201 与 202、长春 G54 与 G55 都属此列。
                const mode = isTramLine(line) ? "tram" : "metro";
                lines.push({
                    id,
                    mode,
                    system: fareSystems[line.id] || mode,
                    ways: [group.ids],
                    loop: Boolean(line.isLoop),
                    hop: (a, b) => hop.get(`${a}|${b}`) ?? null,
                    hopKm: (a, b) => hopKmMap.get(`${a}|${b}`) ?? null
                });
                stats.push({
                    id, name: line.name,
                    total: group.ids.length - 1,
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
        const walk = {};
        [[transfers?.paid, false], [transfers?.free, true]].forEach(([source, free]) => {
            Object.entries(source || {}).forEach(([from, partners]) => {
                (partners || []).forEach((to) => {
                    (walk[from] ||= []).push({ to: String(to), minutes: walkMinutes, free });
                });
            });
        });

        return {
            network: {
                lines,
                stations: Object.fromEntries(Object.entries(stationsData).map(([sid, s]) => [sid, { type: s.type }])),
                walk,
                xferMinutes: Number(config.xferMinutes) || DEFAULTS.xferMinutes,
                fare: config.fare || null
            },
            stats
        };
    }

    window.CGoRouteData = {
        build, amapCoordIndex, collectVirtualTransfers, hourSlots, HOP_MAX, DEFAULTS
    };
})();
