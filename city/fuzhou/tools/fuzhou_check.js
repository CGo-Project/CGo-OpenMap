/**
 * CGo OpenMap - 福州城市数据与行程规划配置自检 (city/fuzhou/tools/fuzhou_check.js)
 *
 * 零依赖、零构建、不需要浏览器：直接在 Node 里按浏览器的经典脚本语义加载同目录上的
 * 福州数据文件，断言「城市侧薄配置」与数据对得上。用法（在仓库根目录执行）：
 *
 *     node city/fuzhou/tools/fuzhou_check.js
 *
 * 覆盖内容
 *   1. 车站引用完整性：linesData 引用的车站必须在 stationsData 中有定义，反之不能有孤立站；
 *   2. 站距长度：单线 distances.length === stationIds.length - 1（环线为 stationIds.length）；
 *   3. 终点站解析：window.CGO_ROUTE_CONFIG.reader() 给出的 dest 必须是车站 ID，
 *      或 "line-first" / "line-last" 端点代号 —— 这是共享层 chainDirection 的硬契约，
 *      给错了整条时刻链会被丢弃（区间用时只能退化成坐标模型估算）；
 *   4. 时刻链可用性：按共享层同口径逐链算站间差值，落不到 (0, HOP_MAX] 的差值应为 0；
 *   5. 官方票价表：完整性、双向齐备、站名映射覆盖、规则优先命中官方表；
 *   6. 调色与徽标：color 为合法 Hex、svg 模板存在于 assets/svg/。
 *
 * ⚠️ 站点坐标与折线走向的几何自检不在这里（那是 Drunk 净化器的职责），
 *    本文件只保证「城市侧配置 ↔ 城市数据」两侧的契约不被改坏。
 *
 * 为什么放在 city/fuzhou/tools/ 而不是 drunk/tools/：它只服务福州一座城市，
 * 而 drunk/tools/selfcheck.js 校验的是 Drunk 的纯函数层（跨城市通用）。
 * 同类先例见 city/fuzhou/stacard/、city/shenyang/modules/ —— 城市专属脚本随城市走。
 * 本文件是 Node 端脚本，浏览器不会请求，故 sw.js 的预缓存清单不需要登记它。
 *
 * 官方票价表（同目录的 data_official_fare.js）的重新抓取方式：
 *   官网「票价线路查询」页面本身是前端渲染、不含票价，票价由下面的同源接口给出：
 *     GET https://www.fzmtr.com/api/system/way/list
 *         ?pageNum=1&pageSize=10&startStation={站名}&endStation={站名}
 *   站点清单取自 https://www.fzmtr.com/services/routeQuery 的 Astro SSR props
 *   （component-url 含 RouteQuery 的 astro-island 的 props.lines[].stationList）。
 *   逐对枚举 102 站的两两组合（约 1.03 万次请求，并发 4 约 8 分钟），
 *   把结果写成 "起点ID|终点ID": 票价 即可。抓完请递增 sw.js 的 CACHE_NAME。
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

/** 本文件位于 city/fuzhou/tools/，故仓库根目录要向上三级 */
const CITY_DIR = path.resolve(__dirname, "..");
const ROOT = path.resolve(CITY_DIR, "..", "..");

/** 共享层 route-data.js 的区间用时物理上限（分钟），链判定同口径 */
const HOP_MAX = 8;

let passed = 0;
const failures = [];

function check(label, condition, detail) {
    if (condition) {
        passed += 1;
        return;
    }
    failures.push(detail ? `${label} —— ${detail}` : label);
}

function section(title) {
    process.stdout.write(`\n${title}\n`);
}

/**
 * 按浏览器的经典脚本语义加载一个数据文件：顶层 const 落进全局词法环境，
 * 后续脚本可按裸标识符读取（Node 的 vm 上下文与浏览器同构）。
 */
function loadCity(sandbox) {
    const read = (name) => fs.readFileSync(path.join(CITY_DIR, name), "utf8");
    const run = (name) => vm.runInContext(read(name), sandbox, { filename: name });
    const expose = (expr) => vm.runInContext(`globalThis.${expr} = ${expr}`, sandbox);

    run("data_stations.js");
    expose("stationsData");
    run("data_lines.js");
    expose("linesData");
    run("data_timetable.js");
    expose("GLOBAL_SCHEDULE_DATA");
    expose("FUZHOU_LINE_INTERVALS");
    run("data_official_fare.js");            // 官方站间票价表（须早于 fuzhou.js，票价规则要查它）
    expose("FUZHOU_OFFICIAL_FARE");
    expose("FUZHOU_OFFICIAL_SEGMENT_FARE");
    expose("FUZHOU_OFFICIAL_STATION_IDS");
    run("data_virtual_transfers.js");
    expose("VIRTUAL_TRANSFER_MAP");
    expose("VIRTUAL_FREE_TRANSFER_MAP");
    run("data_attractions.js");              // 文旅景点名录（第 ⑧ 节校验其自洽性）
    expose("FUZHOU_ATTRACTIONS");
    expose("FUZHOU_STATION_BINDINGS");
    run("data_scattered.js");                // 水域层与枢纽徽标（第 ⑧ 节）
    expose("SCATTERED_DATA");
    run("fuzhou.js");

    return {
        stationsData: sandbox.stationsData,
        linesData: sandbox.linesData,
        schedule: sandbox.GLOBAL_SCHEDULE_DATA,
        officialFare: sandbox.FUZHOU_OFFICIAL_FARE,
        officialSegments: sandbox.FUZHOU_OFFICIAL_SEGMENT_FARE,
        officialStationIds: sandbox.FUZHOU_OFFICIAL_STATION_IDS,
        config: sandbox.window.CGO_ROUTE_CONFIG
    };
}

const sandbox = { console };
sandbox.window = sandbox;
sandbox.document = { write() { } };
sandbox.CityDataManager = { registerCity() { } };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
// reader() 运行时才取 hourSlots，这里给一份与共享层同形的实现
sandbox.CGoRouteData = {
    hourSlots: (dest, entries) => (entries || [])
        .filter((entry) => entry[2])
        .map(([period, label, time]) => ({ dest, period, label, time }))
};

const city = loadCity(sandbox);
const { stationsData, linesData, schedule, config, officialFare, officialSegments, officialStationIds } = city;

/* ── 1. 车站引用完整性 ─────────────────────────────────────────────── */
section("① 车站引用完整性");
const stationIds = Object.keys(stationsData);
const groupIds = (line) => (line.hasbranch
    ? ["way1", "way2"].flatMap((way) => line[`stationIds-${way}`] || [])
    : (line.stationIds || []));
const referenced = new Set();
linesData.forEach((line) => groupIds(line).forEach((sid) => referenced.add(sid)));

const missing = [...referenced].filter((sid) => !stationsData[sid]);
check("线路引用的车站均已定义", missing.length === 0, `未定义：${missing.join(", ")}`);
const orphans = stationIds.filter((sid) => !referenced.has(sid));
check("无孤立车站", orphans.length === 0, `孤立：${orphans.join(", ")}`);
process.stdout.write(`  车站 ${stationIds.length} 座，线路 ${linesData.length} 条，引用 ${referenced.size} 座\n`);

/* ── 2. 站距长度 ───────────────────────────────────────────────────── */
section("② 站距长度");
linesData.forEach((line) => {
    if (line.isPointOnly) return;
    const ways = line.hasbranch ? ["way1", "way2"] : [null];
    ways.forEach((way) => {
        const ids = way ? line[`stationIds-${way}`] : line.stationIds;
        const dist = way ? line[`distances-${way}`] : line.distances;
        if (!ids) return;
        const want = line.isLoop ? ids.length : ids.length - 1;
        const got = Array.isArray(dist) ? dist.length : 0;
        check(`${line.id}${way ? "/" + way : ""} 站距长度`,
            got === want, `期望 ${want}，实为 ${got}`);
    });
});

/* ── 3. 终点站解析 ─────────────────────────────────────────────────── */
section("③ 终点站解析（链方向契约）");
const stationNameIndex = (ids) => {
    const byName = new Map();
    ids.forEach((sid) => {
        const cn = stationsData[sid]?.cn;
        if (!cn) return;
        byName.set(cn, byName.has(cn) ? null : sid);
    });
    return byName;
};

const toMinutes = (value) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? "").trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

let chainTotal = 0;
let hopTotal = 0;
let hopBad = 0;
let unresolved = 0;

linesData.forEach((line) => {
    const ids = line.stationIds || [];
    const names = stationNameIndex(ids);
    const chains = new Map();
    const unknownDest = new Set();

    ids.forEach((sid, idx) => {
        (config.reader(line, sid) || []).forEach((item) => {
            const key = `${item.dest}|${item.period}|${item.label}`;
            if (!chains.has(key)) chains.set(key, { dest: item.dest, times: new Map() });
            const minute = toMinutes(item.time);
            if (minute !== null) chains.get(key).times.set(idx, minute);
            const known = item.dest === "line-first" || item.dest === "line-last"
                || ids.includes(item.dest) || names.has(item.dest);
            if (!known) unknownDest.add(item.dest);
        });
    });

    check(`${line.id} 终点站均可解析`, unknownDest.size === 0,
        `无法解析：${[...unknownDest].join(", ")}`);

    // 逐链按共享层口径算站间差值，落不到 (0, HOP_MAX] 的即为失真链
    chains.forEach((chain, key) => {
        chainTotal += 1;
        const present = [...chain.times.keys()].sort((a, b) => a - b);
        if (present.length < 2) return;
        const last = ids.length - 1;
        const destIdx = chain.dest === "line-first" ? 0
            : chain.dest === "line-last" ? last : ids.indexOf(chain.dest);
        const minIdx = Math.min(...present);
        const maxIdx = Math.max(...present);
        const dir = destIdx < 0 ? 0 : destIdx >= maxIdx ? 1 : destIdx <= minIdx ? -1 : 0;
        if (!dir) { unresolved += 1; return; }
        const ordered = dir > 0 ? present : present.slice().reverse();
        for (let k = 0; k < ordered.length - 1; k += 1) {
            const a = ordered[k];
            const b = ordered[k + 1];
            if (Math.abs(b - a) !== 1) continue;
            let delta = chain.times.get(b) - chain.times.get(a);
            if (delta < 0) delta += 1440;
            hopTotal += 1;
            if (!(delta > 0 && delta <= HOP_MAX)) {
                hopBad += 1;
                if (hopBad <= 3) {
                    process.stdout.write(`  ! ${line.id} 链 ${key} ${ids[a]}→${ids[b]} Δ=${delta} 分钟\n`);
                }
            }
        }
    });
});
check("时刻链站间差值均在合理区间", hopBad === 0, `失真 ${hopBad} / ${hopTotal}`);
process.stdout.write(`  ${chainTotal} 条链、${hopTotal} 个站间差值，方向不可判 ${unresolved} 条\n`);

/* ── 4. 里程口径对照（土建 vs 计价） ───────────────────────────────── */
section("④ 里程口径对照（土建站距 vs 官方计价里程）");
/** 官方公布的分段里程（米）：榕发改价格〔2025〕51 号 + 2025-09-24 官方通稿 */
const OFFICIAL = {
    mainMeters: 13910,
    newMeters: 47850,
    totalMeters: 61760,
};
const binhai = linesData.find((line) => line.id === "M6");
if (!binhai) {
    check("滨海快线（M6）存在", false, "未找到 M6");
} else {
    const ids = binhai.stationIds;
    const split = ids.indexOf("M423");                 // 帝封江
    check("滨海快线以帝封江为分段点", split > 0, `帝封江下标 ${split}`);

    let cumulative = 0;
    const cum = new Map();
    for (let i = 0; i < ids.length; i += 1) {
        cum.set(ids[i], cumulative);
        if (i < binhai.distances.length) cumulative += binhai.distances[i];
    }
    // M6 站序自文岭端（索引 0）起算、帝封江在索引 split、福州火车站为末站：
    // distances[i] 是 ids[i] → ids[i+1] 的跳距，故
    //   新区段（帝封江 — 文岭）  = distances[0 .. split-1]
    //   主城区段（帝封江 — 福州火车站）= distances[split .. 末]
    const declaredNew = binhai.distances.slice(0, split).reduce((a, b) => a + b, 0);
    const declaredMain = binhai.distances.slice(split).reduce((a, b) => a + b, 0);

    process.stdout.write(`  站距表逐跳求和（土建/地图口径）：主城区段 ${(declaredMain / 1000).toFixed(2)} km，`
        + `新区段 ${(declaredNew / 1000).toFixed(2)} km，`
        + `合计 ${(cumulative / 1000).toFixed(2)} km\n`);
    process.stdout.write(`  官方公布计价里程：主城区段 ${(OFFICIAL.mainMeters / 1000).toFixed(2)} km，`
        + `新区段 ${(OFFICIAL.newMeters / 1000).toFixed(2)} km，合计 ${(OFFICIAL.totalMeters / 1000).toFixed(2)} km\n`);

    // 两者不要求互等：**计价站距与土建站距本就不同源**（前者是收费依据，后者是地图/轨道
    // 几何量出来的实际站间距），在档位分界附近差 0.2~1.7 km 属正常。故这里只打印对照，
    // 不写成断言 —— 若写成断言，日后有人把站距调去迁就计价里程，反而会毁掉图上里程的真实性。
    // 票价的正确性由第 ⑤ 节的「官方票价表」与「规则优先命中官方表」两项守住。
    const totalGap = Math.abs(cumulative - OFFICIAL.totalMeters) / 1000;
    process.stdout.write(`  两者差值：全线 ${totalGap.toFixed(2)} km`
        + `（计价口径与土建口径不要求相等，票价以官方表为准）\n`);

    // 票价不再由本文件推算：福州只认官网抓取的官方站间票价表。
    // 该表的存在性、完整性与其在规则里的命中情况，统一由第 ⑤ 节校验。
    process.stdout.write("  票价不按里程推算：价格来源为第 ⑤ 节的官方站间票价表\n");
}

/* ── 5. 官方站间票价表 ─────────────────────────────────────────────── */
section("⑤ 官方站间票价表（data_official_fare.js）");
if (!officialFare || !Object.keys(officialFare).length) {
    check("官方票价表已加载", false, "FUZHOU_OFFICIAL_FARE 为空");
} else {
    const keys = Object.keys(officialFare);
    check("官方票价表已加载", keys.length > 10000, `仅 ${keys.length} 组`);

    // 站名映射必须覆盖项目里除未开通站以外的全部车站
    const openIds = Object.entries(stationsData)
        .filter(([, s]) => String(s.type) !== "no")
        .map(([id]) => id)
        .sort();
    const mappedIds = [...new Set(Object.values(officialStationIds || {}))].sort();
    const unmapped = openIds.filter((id) => !mappedIds.includes(id));
    const extra = mappedIds.filter((id) => !openIds.includes(id));
    check("官方站名映射覆盖全部已开通车站", unmapped.length === 0,
        `未映射：${unmapped.join(", ")}`);
    check("官方站名映射无多余车站", extra.length === 0, `多余：${extra.join(", ")}`);

    // 键的形态与票价合理区间
    const badKey = keys.filter((k) => !/^[A-Za-z0-9_]+\|[A-Za-z0-9_]+$/.test(k));
    const badPrice = keys.filter((k) => {
        const v = officialFare[k];
        return !Number.isInteger(v) || v < 2 || v > 30;
    });
    check("票价表键格式均为 起点ID|终点ID", badKey.length === 0, badKey.slice(0, 3).join(", "));
    check("票价表取值均为 2~30 的整数", badPrice.length === 0, badPrice.slice(0, 3).join(", "));

    // 官方表应同时含两个方向
    const oneWay = keys.filter((k) => {
        const [a, b] = k.split("|");
        return a !== b && officialFare[`${b}|${a}`] === undefined;
    });
    check("票价表双向齐备", oneWay.length === 0, `单向 ${oneWay.length} 组，如 ${oneWay[0] || ""}`);

    // 票价规则必须命中官方表；查不到的组合必须返回 null（不猜不估）
    const probes = [
        ["M113", "M605"], ["M111", "M605"], ["M104", "M614"],
        ["M423", "M608"], ["M101", "M125"], ["M101", "M202"]
    ];
    const fareFn = config.fare?.metro;
    let missHit = 0;
    probes.forEach(([a, b]) => {
        const want = officialFare[`${a}|${b}`];
        const got = fareFn(0, { entry: a, exit: b, stops: [] });
        if (want !== undefined && got !== want) missHit += 1;
    });
    check("票价规则优先返回官方表价格", missHit === 0, `${missHit} 组未命中`);
    process.stdout.write(`  官方表 ${keys.length} 组，${mappedIds.length} 座车站；`
        + `区间票价 ${(officialSegments || []).length} 组\n`);

    // 同线相邻站对的官方票价应都能在规则里复现（用于守住里程口径）
    const fareFn2 = config.fare?.metro;
    const segBad = (officialSegments || []).filter((s) => {
        const [a, b] = String(s.key).split("|");
        return fareFn2(0, { entry: a, exit: b, stops: [] }) !== s.price;
    });
    check("同线相邻站对票价与官方一致", segBad.length === 0,
        `${segBad.length} 组不符，如 ${segBad[0] ? segBad[0].key : ""}`);

    // 查不到的组合必须返回 null（不猜不估）：未开通站、同站进出
    const nullCases = [
        ["M101", "M101", "同站进出"],
        ["M611", "M615", "起点为未开通站（滨海西）"],
        ["M513", "M501", "起点为未开通站（莲花）"],
        ["M501", "M515", "终点为未开通站（壶井）"]
    ];
    const badNull = nullCases.filter(([a, b]) => {
        const got = fareFn(0, { entry: a, exit: b, stops: [] });
        return got !== null && got !== undefined;
    });
    check("查不到的组合返回 null（不猜不估）", badNull.length === 0,
        badNull.map(([, , label]) => label).join("、"));
    process.stdout.write(`  未开通站与同站进出共 ${nullCases.length} 组抽查均返回 null\n`);
}

/* ── 6. 站外换乘步行时间 ───────────────────────────────────────────── */
section("⑥ 站外换乘步行时间（walkMinutes）");
{
    const walk = config.walkMinutes;
    check("已配置按站对的步行时间", walk && typeof walk === "object" && !Array.isArray(walk),
        `实际为 ${typeof walk}`);
    if (walk && typeof walk === "object") {
        const keys = Object.keys(walk);

        // 键必须是真实存在的车站对，且确实登记在虚拟换乘表里 —— 否则这个覆盖永远不生效
        const transferPairs = new Set();
        [sandbox.VIRTUAL_TRANSFER_MAP, sandbox.VIRTUAL_FREE_TRANSFER_MAP].forEach((table) => {
            Object.entries(table || {}).forEach(([from, list]) => {
                (list || []).forEach((to) => transferPairs.add(`${from}|${to}`));
            });
        });
        const badKey = keys.filter((k) => !/^[A-Za-z0-9_]+\|[A-Za-z0-9_]+$/.test(k));
        check("步行时间键格式均为 起点ID|终点ID", badKey.length === 0, badKey.join(", "));
        const notTransfer = keys.filter((k) => !transferPairs.has(k));
        check("每个键都对应一条已登记的站外换乘", notTransfer.length === 0,
            `无对应换乘：${notTransfer.join(", ")}`);
        const badStation = keys.filter((k) => k.split("|").some((sid) => !stationsData[sid]));
        check("键里的车站都存在于车站数据", badStation.length === 0, badStation.join(", "));

        const badValue = keys.filter((k) => {
            const v = walk[k];
            return !Number.isFinite(v) || v <= 0 || v > 60;
        });
        check("步行时间为 0~60 的分钟数", badValue.length === 0,
            badValue.map((k) => `${k}=${walk[k]}`).join(", "));

        // 双向必须对称（步行时间和方向无关）
        const oneWay = keys.filter((k) => {
            const [a, b] = k.split("|");
            return a !== b && walk[`${b}|${a}`] === undefined;
        });
        check("步行时间双向对称", oneWay.length === 0, `单向：${oneWay.join(", ")}`);

        process.stdout.write(`  已配置 ${keys.length} 条：`
            + keys.map((k) => {
                const [a, b] = k.split("|");
                return `${stationsData[a].cn}→${stationsData[b].cn} ${walk[k]} 分`;
            }).join("，") + "\n");
    }
}

/* ── 7. 站内换乘方式与用时 ─────────────────────────────────────────── */
section("⑦ 站内换乘方式与用时（transferAt）");
{
    const table = config.transferAt;
    check("已配置站内换乘表", table && typeof table === "object" && !Array.isArray(table),
        `实际为 ${typeof table}`);
    if (table && typeof table === "object") {
        const keys = Object.keys(table);
        // 键必须是真实存在的换乘站，且在该站有两条以上线路 —— 否则这个配置永不生效
        const badStation = keys.filter((sid) => !stationsData[sid]);
        check("换乘站 ID 都存在于车站数据", badStation.length === 0, badStation.join(", "));
        const notInterchange = keys.filter((sid) => {
            const ls = linesData.filter((l) => (l.stationIds || []).includes(sid));
            return ls.length < 2;
        });
        check("每个键都是真实的换乘站（≥2 条线路经停）", notInterchange.length === 0,
            notInterchange.map((sid) => `${sid}(${stationsData[sid]?.cn})`).join(", "));

        // 取值合法
        const badValue = [];
        keys.forEach((sid) => {
            const entry = table[sid];
            const specs = [entry, ...Object.values(entry.pairs || {})];
            specs.forEach((sp, i) => {
                const m = sp?.minutes;
                if (!Number.isFinite(m) || m <= 0 || m > 30) {
                    badValue.push(`${stationsData[sid]?.cn}${i ? "(pairs)" : ""}=${m}`);
                }
                if (sp?.sameDirMinutes !== undefined
                    && (!Number.isFinite(sp.sameDirMinutes) || sp.sameDirMinutes <= 0 || sp.sameDirMinutes > 30)) {
                    badValue.push(`${stationsData[sid]?.cn} sameDirMinutes=${sp.sameDirMinutes}`);
                }
            });
        });
        check("换乘用时为 0~30 的分钟数", badValue.length === 0, badValue.join(", "));

        // pairs 的键必须真的是本站的线路组合，且格式为 A|B
        const badPair = [];
        keys.forEach((sid) => {
            const here = linesData.filter((l) => (l.stationIds || []).includes(sid)).map((l) => l.id);
            Object.keys(table[sid].pairs || {}).forEach((k) => {
                if (!/^[A-Za-z0-9_]+\|[A-Za-z0-9_]+$/.test(k)) { badPair.push(`${sid}:${k} 格式`); return; }
                const [a, b] = k.split("|");
                if (!here.includes(a) || !here.includes(b)) badPair.push(`${sid}:${k} 不在本站线路`);
            });
        });
        check("pairs 的键都是本站真实线路组合", badPair.length === 0, badPair.join(", "));

        // 端到端（内核查表是否真的命中）由共享层自己保证 —— 见
        // drunk/tools/selfcheck.js 与 city/shenyang/shared/README.md 的 transferAt 小节。
        // 本文件只守城市侧的不变量：键、取值、pairs 覆盖是否与线路数据自洽。
        //
        // 帝封江是「同站不同线路对换乘方式不同」的唯一案例，单独钉住：
        // 4/5 号线同台，与滨海快线换乘走通道 —— 漏了任一条都会被静默回落成默认 2 分钟。
        // 同台换乘用 sameDir 显式点明「哪一对方向同台」（几何判定只能当兜底，
        // 实测中帝封江的几何同向对与现场站台并不一致），故这里钉住它的形状。
        const checkSameDir = (sid, label, wantKeys) => {
            const entry = table[sid];
            if (!entry) { check(`${label} 已配置`, false, `transferAt 缺少 ${sid}`); return; }
            check(`${label} 为同台换乘`, entry.mode === "同台换乘",
                `实际 ${entry.mode}`);
            const sameDir = entry.sameDir;
            check(`${label} 用 sameDir 显式指定同台方向对`,
                sameDir && typeof sameDir === "object", "缺 sameDir");
            if (sameDir && typeof sameDir === "object") {
                const keys = Object.keys(sameDir);
                // 同一对方向应有两种写法（线对顺序无关）
                check(`${label} 的 sameDir 含正反两种写法`,
                    wantKeys.every((k) => keys.includes(k)),
                    `期望含 ${wantKeys.join("、")}，实际 ${keys.join("、")}`);
                const badVal = keys.filter((k) => sameDir[k] !== 1);
                check(`${label} 同台方向对用时为 1 分钟`, badVal.length === 0,
                    badVal.map((k) => `${k}=${sameDir[k]}`).join("、"));
                const badFmt = keys.filter((k) => !/^[A-Za-z0-9_]+[+-][A-Za-z0-9_]+[+-]$/.test(k));
                check(`${label} 的 sameDir 键格式为 线+dir线+dir`, badFmt.length === 0,
                    badFmt.join("、"));
            }
        };
        checkSameDir("M123", "梁厝", ["M1+M5-", "M1-M5+"]);
        checkSameDir("M423", "帝封江", ["M3-M4-", "M4-M3-"]);

        if (table.M423) {
            const pairs = table.M423.pairs || {};
            check("帝封江已声明 4 号线 ⇄ 滨海快线 的换乘方式", Boolean(pairs["M3|M6"]),
                "缺 M3|M6");
            check("帝封江已声明 5 号线 ⇄ 滨海快线 的换乘方式", Boolean(pairs["M4|M6"]),
                "缺 M4|M6");
        } else {
            check("帝封江（M423）已配置换乘方式", false, "transferAt 缺少 M423");
        }

        process.stdout.write(`  已配置 ${keys.length} 个换乘站：`
            + keys.map((sid) => {
                const e = table[sid];
                const extra = e.pairs ? `（另有 ${Object.keys(e.pairs).length} 组线路对例外）` : "";
                return `${stationsData[sid].cn} ${e.mode} ${e.minutes}分${extra}`;
            }).join("；") + "\n");
    }
}

/* ── 8. 文旅景点与水域层枢纽徽标 ───────────────────────────────────── */
section("⑧ 文旅景点与水域层枢纽徽标");
{
    // 景点名录：station / meters 是建库时按坐标算好写进数据的，这里守住自洽性
    const attractions = sandbox.FUZHOU_ATTRACTIONS || [];
    check("景点名录已加载", attractions.length > 8, `仅 ${attractions.length} 条`);
    const missing = attractions.filter((a) => !a.name || !a.sl || !a.cn
        || !Array.isArray(a.stations) || !a.stations.length);
    check("每条景点都有 name / sl / cn / stations[]", missing.length === 0,
        missing.map((a) => a.name || "(无名)").join("、"));
    const badCoord = attractions.filter((a) => !/^\d{2,3}\.\d+,\d{2}\.\d+$/.test(String(a.sl)));
    check("景点坐标为 经度,纬度 形式", badCoord.length === 0,
        badCoord.map((a) => `${a.name}=${a.sl}`).join("、"));
    // 一个景点可绑多个车站 —— stations 是 [{ id, meters }] 数组
    const boundStations = (a) => (a.stations || []);
    const noStation = attractions.filter((a) => !boundStations(a).length);
    check("每个景点至少绑定一个车站", noStation.length === 0,
        noStation.map((a) => a.name).join("、"));
    const badStation = attractions.flatMap((a) => boundStations(a)
        .filter((s) => !stationsData[s.id])
        .map((s) => `${a.name}→${s.id}`));
    check("绑定的 station 都指向存在的车站", badStation.length === 0, badStation.join("、"));
    const notOpen = attractions.flatMap((a) => boundStations(a)
        .filter((s) => String(stationsData[s.id]?.type) === "no")
        .map((s) => `${a.name}→${stationsData[s.id]?.cn}`));
    check("景点不绑定未开通车站", notOpen.length === 0, notOpen.join("、"));
    const badMeters = attractions.flatMap((a) => boundStations(a)
        .filter((s) => !Number.isFinite(s.meters) || s.meters <= 0 || s.meters > 20000)
        .map((s) => `${a.name}→${s.id}=${s.meters}`));
    check("各绑定站的直线距离在合理区间", badMeters.length === 0, badMeters.join("、"));
    // 绑定的 note 是该站的接驳说明（如「B 口出站乘坐…接驳环线」），可选但要合法
    const badNote = attractions.flatMap((a) => boundStations(a)
        .filter((s) => s.note !== undefined && (typeof s.note !== "string" || !s.note.trim()))
        .map((s) => `${a.name}→${s.id}`));
    check("绑定的接驳说明非空字符串", badNote.length === 0, badNote.join("、"));
    const dupBind = attractions.filter((a) => {
        const ids = boundStations(a).map((s) => s.id);
        return new Set(ids).size !== ids.length;
    });
    check("同一景点不重复绑定同一车站", dupBind.length === 0,
        dupBind.map((a) => a.name).join("、"));
    const dupName = attractions.map((a) => a.name)
        .filter((n, i, arr) => arr.indexOf(n) !== i);
    check("景点名无重复", dupName.length === 0, dupName.join("、"));

    // 模块不按距离过滤（接驳型景点直线距离可以很远，如鼓岭 3.3 km），
    // 故这里的统计口径也不设距离门槛
    const allBinds = attractions.flatMap((a) => boundStations(a).map((s) => s.id));
    process.stdout.write(`  ${attractions.length} 处景点，`
        + `${allBinds.length} 个「景点—车站」绑定，覆盖 ${new Set(allBinds).size} 座车站\n`);
    const multi = attractions.filter((a) => boundStations(a).length > 1);
    if (multi.length) {
        process.stdout.write("  一景多站（正常，非数据错误）："
            + multi.map((a) => `${a.name}→${boundStations(a).map((s) => stationsData[s.id].cn).join("/")}`).join("；") + "\n");
    }

    // 卡片只挂在有 A 级景区 / 大型公园的车站上 —— 判定依据是 tier
    const tiered = attractions.filter((a) => a.tier);
    check("已标注 A 级景区 / 大型公园（tier）", tiered.length > 0, "没有任何条目带 tier");
    const badTier = tiered.filter((a) => !/^(5A|4A|3A|2A|1A|景区|公园|场馆)$/.test(String(a.tier)));
    check("tier 取值合法（5A/4A/3A/2A/1A/景区/公园/场馆）", badTier.length === 0,
        badTier.map((a) => `${a.name}=${a.tier}`).join("、"));
    const cardStations = new Set(tiered.flatMap((a) => boundStations(a).map((s) => s.id)));
    process.stdout.write(`  带 tier ${tiered.length} 处，实际会出卡片的车站 ${cardStations.size} 座：`
        + [...cardStations].map((sid) => stationsData[sid].cn).join("、") + "\n");

    // 站名关系是唯一权威来源：每个词都必须绑在对应的那一站上，且要能渲染出来
    const announcements = sandbox.FUZHOU_STATION_BINDINGS || {};
    const matchesWord = (a, word) => a.name === word || a.name.startsWith(word)
        || (a.nameAliases || []).includes(word);
    const badAnnounce = [];
    const unrendered = [];
    Object.entries(announcements).forEach(([sid, words]) => {
        (words || []).forEach((word) => {
            const any = attractions.filter((a) => matchesWord(a, word));
            if (!any.length) { badAnnounce.push(`${stationsData[sid]?.cn}「${word}」在名录里找不到对应景点`); return; }
            // 必须绑到该站 —— 这是「全部按点名的站名关系锁定」的落点
            if (!any.some((a) => boundStations(a).some((s) => s.id === sid))) {
                badAnnounce.push(`${stationsData[sid]?.cn}「${word}」没绑到本站`);
            }
            if (!any.some((a) => a.tier && boundStations(a).some((s) => s.id === sid))) {
                unrendered.push(`${stationsData[sid]?.cn}「${word}」`);
            }
        });
    });
    check("站名关系里的景点都绑在对应的站上", badAnnounce.length === 0, badAnnounce.join("；"));
    check("站名关系里的景点都能在卡片上渲染出来（有 tier）", unrendered.length === 0,
        unrendered.join("、"));
    if (Object.keys(announcements).length) {
            }
    // 反向：有绑定但不在站名关系表里的景点（即另行点名加入的），单独列出便于复核
    const announcedIds = new Set(Object.keys(announcements));
    const unclaimed = attractions.filter((a) => !boundStations(a).some((s) => announcedIds.has(s.id)));
    if (unclaimed.length) {
        process.stdout.write("  未经站名关系表认领（另行点名加入）："
            + unclaimed.map((a) => `${a.name}→${boundStations(a).map((s) => stationsData[s.id].cn).join("/")}`).join("；") + "\n");
    }

    // 水域层：底图 + 枢纽徽标（国铁车站 / 机场）
    const scattered = sandbox.SCATTERED_DATA || [];
    const sea = scattered.filter((i) => i.id.includes("sea"));
    const badges = scattered.filter((i) => i.id.startsWith("fuzhou-railway") || i.id === "fuzhou-airport");
    check("水域底图已配置", sea.length === 1, `实际 ${sea.length} 条`);
    check("火车站与机场徽标已配置", badges.length === 3, `实际 ${badges.length} 条`);
    // 水域层里每个条目都应有素材文件
    const noFile = scattered.filter((i) => !fs.existsSync(path.join(ROOT, String(i.file || "").replace(/^\.\//, ""))));
    check("水域层条目的素材文件都存在", noFile.length === 0,
        noFile.map((i) => `${i.id}=${i.file}`).join("、"));
    // 徽标必须是正方形且尺寸一致（素材为官方圆角方块图标）
    const notSquare = badges.filter((i) => i.width !== i.height);
    check("枢纽徽标为正方形", notSquare.length === 0,
        notSquare.map((i) => `${i.id} ${i.width}×${i.height}`).join("、"));
    const sizes = [...new Set(badges.map((i) => i.width))];
    check("枢纽徽标尺寸一致", sizes.length === 1, `出现 ${sizes.join("、")} 三种尺寸`);
    // 徽标必须在水域底图之上，否则会被底图盖住
    const seaZ = sea[0]?.zIndex ?? 0;
    const below = badges.filter((i) => !(i.zIndex > seaZ));
    check("徽标层级高于水域底图", below.length === 0,
        below.map((i) => `${i.id} z=${i.zIndex} ≤ ${seaZ}`).join("、"));
    /**
     * 徽标应贴着自己标注的枢纽站，且**落在站名的反侧**（不压站名与站点图元）。
     * 站位来自 data_scattered.js 的坐标推导约定：偏移 = 边长/2 + 17 = 32px。
     */
    const HUB = {
        "fuzhou-railway-main": "M104",
        "fuzhou-railway-south": "M121",
        "fuzhou-airport": "M614"
    };
    const OPPOSITE = {
        left: "right", right: "left", top: "bottom", bottom: "top",
        "top-left": "bottom-right", "top-right": "bottom-left",
        "bottom-left": "top-right", "bottom-right": "top-left"
    };
    const DIR = {
        right: [1, 0], left: [-1, 0], top: [0, -1], bottom: [0, 1],
        "top-right": [1, -1], "top-left": [-1, -1], "bottom-right": [1, 1], "bottom-left": [-1, 1]
    };
    const strayed = [];
    const wrongSide = [];
    badges.forEach((i) => {
        const hub = stationsData[HUB[i.id]];
        if (!hub) { strayed.push(`${i.id}（无对应车站）`); return; }
        const dx = i.x - hub.x, dy = i.y - hub.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 80) strayed.push(`${i.id} 距 ${hub.cn} ${Math.round(dist)}px`);
        // 方向须与该站 align 的反侧一致
        const side = OPPOSITE[hub.align] || "right";
        const dir = DIR[side];
        const dot = dx * dir[0] + dy * dir[1];
        if (dot <= 0) wrongSide.push(`${i.id} 应在 ${hub.cn} 的${side}（align=${hub.align}）`);
    });
    check("徽标位置贴近所标注的枢纽站（≤80px）", strayed.length === 0, strayed.join("、"));
    check("徽标落在站名反侧（不压站名）", wrongSide.length === 0, wrongSide.join("、"));
    process.stdout.write("  水域层："
        + scattered.map((i) => `${i.id}(z=${i.zIndex})`).join("、") + "\n");
    process.stdout.write("  枢纽徽标："
        + badges.map((i) => `${stationsData[HUB[i.id]].cn} ${i.width}px`).join("、") + "\n");
}

/* ── 9. 徽标与配色 ─────────────────────────────────────────────────── */
section("⑨ 徽标与配色");
linesData.forEach((line) => {
    check(`${line.id} color 为合法 Hex`,
        /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(String(line.color || "")),
        String(line.color));
    if (!line.svg) return;
    const file = path.join(ROOT, "assets", "svg", line.svg);
    check(`${line.id} 徽标模板存在（${line.svg}）`, fs.existsSync(file), "缺少该模板");
});

/* ── 汇总 ─────────────────────────────────────────────────────────── */
process.stdout.write(`\n${"─".repeat(60)}\n`);
if (failures.length === 0) {
    process.stdout.write(`全部通过：${passed} 项断言\n`);
    process.exit(0);
}
process.stdout.write(`通过 ${passed} 项，失败 ${failures.length} 项：\n`);
failures.forEach((item) => process.stdout.write(`  ✗ ${item}\n`));
process.exit(1);
