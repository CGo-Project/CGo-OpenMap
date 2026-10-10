/**
 * CGo OpenMap - 福州行程规划链端到端核对 (city/fuzhou/tools/fuzhou_network_check.js)
 *
 * `fuzhou_check.js` 守的是「城市数据 ↔ 城市配置」两侧的契约（快、不依赖共享层）；
 * 本文件多走一步：**真的把共享层拉起来建一次网络**，验证城市配置里那些
 * 「只有内核读得懂」的字段确实生效 —— 这类配置写错了不会报错，只会静默回落成默认值：
 *
 *   1. 站外换乘步行时间（walkMinutes）：逐对打印网络里实际的分钟数；
 *   2. 站内换乘方式与用时（transferAt）：逐站逐线路对、并区分方向打印；
 *   3. 区间用时来源：哪些区间来自时刻表实测、哪些走了距离模型兜底；
 *   4. 抽样实算几条路径，确认换乘方式与用时进了结果步骤。
 *
 * 用法（在仓库根目录执行）：
 *     node city/fuzhou/tools/fuzhou_network_check.js
 *
 * 它只加载 `city/fuzhou/` 与 `city/shenyang/shared/` 下的 classic script，
 * 在 Node 的 vm 里按浏览器同构的方式执行，不需要浏览器、不联网
 * （坐标索引的 fetch 被替换为立即返回的空响应）。
 */
"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const CITY_DIR = path.resolve(__dirname, "..");
const SHARED_DIR = path.resolve(CITY_DIR, "..", "shenyang", "shared");

const readCity = (n) => fs.readFileSync(path.join(CITY_DIR, n), "utf8");
const readShared = (n) => fs.readFileSync(path.join(SHARED_DIR, n), "utf8");

/* ── 浏览器环境最小桩 ─────────────────────────────────────────────── */
const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.document = { write() { }, addEventListener() { }, getElementById: () => null };
sandbox.CityDataManager = { registerCity() { } };
// 坐标索引仅用于「官方站距缺失」的区间兜底；福州站距已补全，这里给个空响应即可
sandbox.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
vm.createContext(sandbox);

const run = (code, name) => vm.runInContext(code, sandbox, { filename: name });
const expose = (e) => vm.runInContext(`globalThis.${e} = ${e}`, sandbox);

/* ── 按 main.html 的顺序加载城市数据 + 共享层 ─────────────────────── */
run(readCity("data_stations.js"), "data_stations.js"); expose("stationsData");
run(readCity("data_lines.js"), "data_lines.js"); expose("linesData");
run(readCity("data_timetable.js"), "data_timetable.js"); expose("GLOBAL_SCHEDULE_DATA");
run(readCity("data_official_fare.js"), "data_official_fare.js"); expose("FUZHOU_OFFICIAL_FARE");
run(readCity("data_virtual_transfers.js"), "data_virtual_transfers.js");
expose("VIRTUAL_TRANSFER_MAP"); expose("VIRTUAL_FREE_TRANSFER_MAP");
run(readCity("data_notopen.js"), "data_notopen.js"); expose("NOT_OPEN_LINES");
// reader() 运行时才取 hourSlots，这里给一份与共享层同形的实现
sandbox.CGoRouteData = {
    hourSlots: (dest, entries) => (entries || [])
        .filter((e) => e[2])
        .map(([period, label, time]) => ({ dest, period, label, time }))
};
run(readShared("route-data.js"), "route-data.js");
run(readShared("route-planner.js"), "route-planner.js");
run(readCity("fuzhou.js"), "fuzhou.js");

const nameOf = (sid) => sandbox.stationsData[sid]?.cn || sid;
let problems = 0;
const fail = (msg) => { problems += 1; process.stdout.write(`  ✗ ${msg}\n`); };

(async () => {
    const cfg = sandbox.CGO_ROUTE_CONFIG;
    if (!cfg) {
        process.stdout.write("✗ 未能取到 window.CGO_ROUTE_CONFIG\n");
        process.exit(1);
    }
    const { network, stats } = await sandbox.CGoRouteData.build({
        linesData: sandbox.linesData,
        stationsData: sandbox.stationsData,
        coords: cfg.coords,
        coordOf: cfg.coordOf,
        reader: cfg.reader,
        virtualTransfers: cfg.virtualTransfers,
        fareSystems: cfg.fareSystems,
        bend: cfg.bend,
        walkMinutes: cfg.walkMinutes,
        xferMinutes: cfg.xferMinutes,
        transferAt: cfg.transferAt,
        fare: cfg.fare
    });

    /* ① 站外换乘步行时间 ─────────────────────────────────────────── */
    process.stdout.write("\n① 站外换乘（walkMinutes）\n");
    const walkSeen = new Map();
    Object.entries(network.walk).forEach(([from, list]) => {
        list.forEach((l) => walkSeen.set(`${from}|${l.to}`, l.minutes));
    });
    Object.entries(cfg.walkMinutes || {}).forEach(([key, want]) => {
        const got = walkSeen.get(key);
        const mark = got === want ? "ok" : "✗";
        if (got !== want) fail(`${key} 期望 ${want} 分，网络里是 ${got}`);
        const [a, b] = key.split("|");
        process.stdout.write(`  ${mark} ${nameOf(a)} → ${nameOf(b)}  ${got} 分\n`);
    });

    /* ② 站内换乘方式与用时 ───────────────────────────────────────── */
    process.stdout.write("\n② 站内换乘（transferAt，区分方向）\n");
    const netLine = (id) => network.lines.find((l) => l.id === id);
    Object.keys(cfg.transferAt || {}).forEach((sid) => {
        const ids = sandbox.linesData
            .filter((l) => (l.stationIds || []).includes(sid))
            .map((l) => l.id)
            .filter((id) => netLine(id));
        for (let i = 0; i < ids.length; i += 1) {
            for (let j = i + 1; j < ids.length; j += 1) {
                const to = netLine(ids[j]);
                // 四个方向组合都要探：「同向同台」这类配置里，同向的那一对方向
                // 未必落在 (1,1) / (-1,-1)（如梁厝是 (+1,-1) 与 (-1,+1)），
                // 只探两组对角会误判成「未生效」。
                const combos = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([d1, d2]) => {
                    const m = to.xfer(sid, ids[i], ids[j], d1, d2);
                    const mode = to.xferMode(sid, ids[i], ids[j], d1, d2);
                    return { d1, d2, m, mode };
                });
                const miss = combos.some((c) => c.m === null);
                if (miss) fail(`${nameOf(sid)} ${ids[i]}×${ids[j]} 未命中 transferAt`);
                const byMinutes = new Map();
                combos.forEach((c) => {
                    const key = `${c.m}分/${c.mode || "—"}`;
                    byMinutes.set(key, (byMinutes.get(key) || []).concat(`(${c.d1},${c.d2})`));
                });
                const summary = [...byMinutes.entries()]
                    .map(([k, ds]) => `${k} ${ds.join("")}`).join("   ");
                process.stdout.write(`  ${miss ? "✗" : "ok"} ${nameOf(sid).padEnd(12)} ${ids[i]}×${ids[j]}  `
                    + `${summary}\n`);
            }
        }
    });

    /* ③ 区间用时来源 ─────────────────────────────────────────────── */
    process.stdout.write("\n③ 区间用时来源（时刻表实测 / 距离模型兜底）\n");
    let fallbackTotal = 0;
    network.lines.forEach((nl) => {
        const ids = nl.ways[0];
        const missing = [];
        for (let i = 0; i + 1 < ids.length; i += 1) {
            if (nl.hop(ids[i], ids[i + 1]) === null) missing.push(`${nameOf(ids[i])}→${nameOf(ids[i + 1])}`);
        }
        fallbackTotal += missing.length;
        const stat = stats.find((s) => s.id === nl.id);
        process.stdout.write(`  ${nl.id}（${stat ? stat.name : ""}）${ids.length} 站：`
            + `实测 ${stat ? stat.measured : "?"}/${stat ? stat.total : "?"} 段`
            + (missing.length ? `，无值 ${missing.length} 段：${missing.join("、")}` : "，全部有值") + "\n");
    });
    if (fallbackTotal) {
        process.stdout.write(`  注：${fallbackTotal} 个区间连兜底值都算不出（多为未开通站相邻段），"
            + "等时圈会视作不可通行。\n`);
    }

    /* ④ 抽样实算 ─────────────────────────────────────────────────── */
    process.stdout.write("\n④ 抽样实算（确认换乘方式与用时进了结果步骤）\n");
    const planner = sandbox.CGoRoutePlanner.create(network);
    const samples = [
        ["M101", "M516", "象峰 → 万寿（1 号线 → … → 6 号线）"],
        ["M403", "M221", "洪塘 → 鼓山（4 号线 → 5 号线 → 2 号线）"],
        ["M104", "M615", "福州火车站 → 文岭（滨海快线直乘）"]
    ];
    samples.forEach(([a, b, label]) => {
        const r = planner.plan(a, b, "time");
        if (!r) { fail(`${label}：无路径`); return; }
        process.stdout.write(`  ${label}：${r.minutes} 分，换乘 ${r.transfers} 次\n`);
        r.steps.filter((s) => s.t === "xfer").forEach((s) => {
            process.stdout.write(`      于 ${nameOf(s.at)} ${s.fromLine}→${s.toLine}`
                + `  ${s.minutes} 分  方式=${s.mode || "未配置"}\n`);
            if (s.fromLine && s.toLine && !s.mode) {
                fail(`${nameOf(s.at)} 的换乘方式为空（transferAt 未覆盖该线路对）`);
            }
        });
    });

    /* ⑤ 换乘时间说明 ─────────────────────────────────────────────── */
    // 有换乘时结果末尾会附一条「仅供参考」说明（渲染在 shared/route/route-panel.js）。
    // 这里只做源码级守门：确认说明与「有换乘才显示」的判定都还在，
    // 免得日后重构把它连判定一起删掉而无人察觉。
    process.stdout.write("\n⑤ 换乘时间说明（结果面板）\n");
    const panelSrc = readShared("route-panel.js");
    const gateOk = /route\.steps\.some\(\(s\) => s\.t === "xfer" && !s\.through\)/.test(panelSrc);
    const noteOk = panelSrc.includes("换乘时间因步行速度和车站人流量不同，仅供参考");
    const noteClassOk = panelSrc.includes('class="cgo-rt-leg note"');
    if (!gateOk) fail("结果面板缺少「有换乘才显示说明」的判定");
    if (!noteOk) fail("结果面板缺少换乘时间说明文案");
    if (!noteClassOk) fail("结果面板缺少说明行的样式类 cgo-rt-leg note");
    process.stdout.write(`  ${gateOk ? "ok" : "✗"} 仅在行程含换乘时显示\n`
        + `  ${noteOk ? "ok" : "✗"} 说明文案就位\n`
        + `  ${noteClassOk ? "ok" : "✗"} 说明行样式类就位\n`);

    /* ⑥ 规划优先级（全城统一：没有「距离最短」） ────────────────────── */
    process.stdout.write("\n⑥ 规划优先级\n");
    // 需求：所有城市都不再计算「距离最短」方案。该目标已从内核 OBJECTIVES 移除，
    // 故候选里不可能出现该标签；这条断言防止它被重新加回来。
    const labelSeen = new Set();
    [["M101", "M516"], ["M403", "M221"], ["M104", "M615"], ["M101", "M125"]].forEach(([a, b]) => {
        (planner.planAll(a, b) || []).forEach((r) => (r.labels || []).forEach((l) => labelSeen.add(l)));
    });
    const distanceLeaked = [...labelSeen].some((l) => l.includes("距离最短"));
    if (distanceLeaked) fail(`候选列表里出现「距离最短」：${[...labelSeen].join("、")}`);
    // 该目标必须真的从内核移除 —— 不能靠 `plan(A,B,"distance")` 判断：
    // plan 对未知 key 会**回落到 OBJECTIVES.time**，照样返回结果。故直接查 OBJECTIVES。
    const stillPlans = Object.keys(planner.OBJECTIVES || {}).includes("distance");
    if (stillPlans) fail("内核 OBJECTIVES 仍含 distance 目标（应已整体移除）");
    const ex = planner.extremes();
    const exOk = ex && Number.isFinite(ex.minutes.max) && Number.isFinite(ex.fare.max);
    if (!exOk) fail("extremes() 取不到极值（票价图色标会锚不住）");
    process.stdout.write(`  ${!distanceLeaked ? "ok" : "✗"} 候选列表无「距离最短」标签`
        + `（出现过的标签：${[...labelSeen].join("、")}）\n`
        + `  ${!stillPlans ? "ok" : "✗"} 内核 OBJECTIVES 已移除 distance`
        + `（现有：${Object.keys(planner.OBJECTIVES || {}).join("、")}）\n`
        + `  ${exOk ? "ok" : "✗"} extremes() 正常：用时 ${ex.minutes.min}~${ex.minutes.max} 分，`
        + `票价 ${ex.fare.min}~${ex.fare.max} 元\n`);

    /* ⑦⑧ 候选标签：非空 + 「票价最低」归属（合并为**一轮**遍历全网站对） ──── */
    // 合并的理由：两轮各遍历一次 10302 个站对要跑 6 万次寻路（约 50 秒），
    // 而两者用的是同一份 planAll 结果，跑一轮核对两件事即可省一半。
    //
    // 守的是两个**真实出现过**的缺陷：
    //   · 候选标签被摘空 → 页签渲染 labels[0] 显示 "undefined"；
    //   · 「票价最低」标签挂到更贵的那条上 → 页签写着最低价、票价却不是最低。
    // 两处都曾只抽查几个站对而漏掉（抽查的那几对恰好没触发），故必须**穷举**。
    process.stdout.write("\n⑦⑧ 候选标签：非空 +「票价最低」归属（遍历全网站对）\n");
    const boardableIds = Object.keys(sandbox.stationsData)
        .filter((sid) => String(sandbox.stationsData[sid].type) !== "no");
    let pairs = 0, routes = 0, multiGroups = 0;
    const emptyLabel = [];
    const weirdLabel = [];
    const wrongFareLabel = [];
    for (let i = 0; i < boardableIds.length; i += 1) {
        for (let j = 0; j < boardableIds.length; j += 1) {
            if (i === j) continue;
            const list = planner.planAll(boardableIds[i], boardableIds[j]);
            if (!list || !list.length) continue;
            pairs += 1;
            const tag = `${nameOf(boardableIds[i])}→${nameOf(boardableIds[j])}`;

            // ① 每条候选至少有一枚非空字符串标签
            list.forEach((r) => {
                routes += 1;
                const labels = r.labels || [];
                if (!labels.length) emptyLabel.push(tag);
                else if (labels.some((x) => typeof x !== "string" || !x.trim())) {
                    weirdLabel.push(`${tag} ${JSON.stringify(labels)}`);
                }
            });

            // ②「票价最低」只能挂在真正最便宜的那条上（单条候选无需横比）
            if (list.length < 2) continue;
            const fares = list.map((r) => r.fare).filter((f) => Number.isFinite(f));
            if (!fares.length) continue;
            multiGroups += 1;
            const cheapest = Math.min(...fares);
            list.forEach((r) => {
                if (!(r.labels || []).includes("票价最低")) return;
                if (!Number.isFinite(r.fare) || r.fare > cheapest) {
                    wrongFareLabel.push(`${tag} 标签在 ${r.fare} 元、最便宜 ${cheapest} 元`);
                }
            });
        }
    }
    if (emptyLabel.length) {
        fail(`${emptyLabel.length} 条候选无标签（页签会显示 undefined），如 ${emptyLabel.slice(0, 3).join("、")}`);
    }
    if (weirdLabel.length) {
        fail(`${weirdLabel.length} 条候选含空/非字符串标签：${weirdLabel.slice(0, 3).join("、")}`);
    }
    if (wrongFareLabel.length) {
        fail(`${wrongFareLabel.length} 处「票价最低」标签挂错：${wrongFareLabel.slice(0, 3).join("；")}`);
    }
    process.stdout.write(
        `  ${emptyLabel.length === 0 && weirdLabel.length === 0 ? "ok" : "✗"} ${pairs} 个站对、${routes} 条候选，`
        + `全部至少有一枚非空标签\n`
        + `  ${wrongFareLabel.length === 0 ? "ok" : "✗"} ${multiGroups} 个多候选站对，`
        + `「票价最低」均落在最便宜的那条上\n`);


    process.stdout.write(`\n${"─".repeat(60)}\n`);
    if (problems === 0) {
        process.stdout.write("端到端核对通过：城市配置里的换乘与步行时间均已生效\n");
        process.exit(0);
    }
    process.stdout.write(`发现 ${problems} 个问题\n`);
    process.exit(1);
})();
