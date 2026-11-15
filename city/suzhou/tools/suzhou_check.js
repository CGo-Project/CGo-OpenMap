/**
 * 苏州线网数据自检（零依赖，node city/suzhou/tools/suzhou_check.js）
 *
 * 覆盖：线路站序与站间距长度、车站引用、换乘站图元与所属线路一致性、
 * 站心是否落在本线走向上、站序是否沿走向单调前进、
 * 坐标重合（漏合并的换乘站）、站名框重叠、图例引用、字段完整性。
 * 改完 data_stations.js / data_lines.js 后跑一遍，0 错误 0 告警再提交。
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
// 车站图元的真实尺寸（与 css/style.css 同源），换乘站的走向容差由它推导
const { STATION_SIZE } = require(path.join(__dirname, '../../../core/station-icons.js'));
// 交路（way）模型与走向判定的唯一真源，与浏览器里 window.CGoLineRouting / CGoPathGeometry 同一份
const Routing = require(path.join(__dirname, '../../../core/line-routing.js'));
const { lineSegments } = require(path.join(__dirname, '../../../core/path-geometry.js'));

const ctx = { window: {}, console };
vm.createContext(ctx);
const epilogue = '\n;globalThis.__ex = { stationsData: typeof stationsData !== "undefined" ? stationsData : null, linesData: typeof linesData !== "undefined" ? linesData : null, LEGEND_CONFIG: typeof LEGEND_CONFIG !== "undefined" ? LEGEND_CONFIG : null };';
for (const f of ['data_stations.js', 'data_lines.js', 'data_legend.js']) {
  vm.runInContext(read(f) + epilogue, ctx, { filename: f });
}
const { stationsData: stations, linesData: lines, LEGEND_CONFIG: legend } = ctx.__ex;

const err = [];
const warn = [];
const used = new Map();

/* 交路安全访问器：站序按交路枚举（way1…wayN，不再假定只有两条），走向走核心的 lineSegments()。
   两者都以行 [标签, 站序, 站距] / [点阵] 的形式返回，便于下方循环继续用解构写法。 */
const stationGroups = (line) => Routing.stationGroups(line)
  .filter((group) => Array.isArray(group.ids) && group.ids.length)
  .map((group) => [group.idsKey === 'stationIds' ? '' : group.wayKey, group.ids, group.distances]);
const pathGroups = (line) => lineSegments(line, stations)
  .map((segment) => segment.points)
  .filter((points) => Array.isArray(points) && points.length >= 2);

for (const line of lines) {
  const groups = stationGroups(line);
  if (!groups.length) err.push(`${line.id} 无站序`);
  if (!pathGroups(line).length) err.push(`${line.id} 缺走向`);
  for (const [way, ids, dists] of groups) {
    const tag = line.id + (way ? ` ${way}` : '');
    const need = line.isLoop ? ids.length : ids.length - 1;
    if ((dists || []).length !== need) {
      err.push(`${tag} 站间距长度 ${(dists || []).length} != ${need}`);
    }
    for (const id of ids) {
      if (!stations[id]) err.push(`${tag} 引用了不存在的车站 ${id}`);
      if (!used.has(id)) used.set(id, []);
      if (!used.get(id).includes(line.id)) used.get(id).push(line.id); // 两 way 共线的车站只记一次
    }
  }
}

// 换乘站类型核对（foreign 邻城线只是换乘示意，不计入本城线路成员关系）
// 在建站（type: "no"）不参与该规则：它们在图上按普通灰点绘制，落在 data_notopen.js 的虚线层上，
// 两条在建线在图上交叉（如 莫阳 = 4 号线北延 × 7 号线北延）也不必升级为换乘图元。
const foreignIds = new Set(lines.filter((l) => l.foreign).map((l) => l.id));
for (const [id, s] of Object.entries(stations)) {
  const ls = used.get(id) || [];
  const local = ls.filter((lid) => !foreignIds.has(lid));
  if (!ls.length) warn.push(`${id} ${s.cn} 未被任何线路引用`);
  if (s.type === 'no') continue;
  if (local.length > 1 && s.type !== 'tsf') err.push(`${id} ${s.cn} 属于 ${local.join('/')} 但类型是 ${s.type}`);
  // 跨省换乘（花桥 × 上海 11 号线）也算一条线：ls 含 foreign 线，只有全城仅一条时才提示
  if (ls.length === 1 && s.type === 'tsf') warn.push(`${id} ${s.cn} 只有一条线却是换乘图元`);
}

// 坐标重合但未合并的换乘
const list = Object.entries(stations).map(([id, s]) => ({ id, ...s }));
for (let i = 0; i < list.length; i++) {
  for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 6) err.push(`${a.id} ${a.cn} 与 ${b.id} ${b.cn} 相距 ${d.toFixed(1)}px，疑似应合并`);
    else if (d < 12 && (used.get(a.id) || []).some((l) => (used.get(b.id) || []).includes(l))) {
      warn.push(`${a.id} ${a.cn} 与 ${b.id} ${b.cn} 同线且仅距 ${d.toFixed(1)}px`);
    }
  }
}

// 站名碰撞复核（与 css/style.css 同口径的保守字号）
const w = (s) => {
  let n = 0;
  for (const ch of s) n += ch.charCodeAt(0) > 0x2e7f ? 11.5 : 6.6;
  return n;
};
const boxes = [];
for (const [id, s] of Object.entries(stations)) {
  // hideLabel 的站（同名站外换乘的副站）引擎根本不画站名，不参与碰撞与外包框统计
  if (s.hideLabel === true) continue;
  const W = Math.max(w(s.cn), w(s.en) * 0.62) + 2;
  const H = 20.2 + 2;
  const dx = { top: 0, bottom: 0, left: -6, right: 6, 'top-left': -6, 'top-right': 6, 'bottom-left': -6, 'bottom-right': 6 }[s.align] ?? 0;
  const dy = { top: -5.2, bottom: 5.2, left: 0, right: 0, 'top-left': -6, 'top-right': -6, 'bottom-left': 6, 'bottom-right': 6 }[s.align] ?? 5.2;
  const px = s.x + dx + (s.offset?.x || 0);
  const py = s.y + dy + (s.offset?.y || 0);
  let box;
  if (s.align === 'top') box = [px - W / 2, py - H, px + W / 2, py];
  else if (s.align === 'bottom') box = [px - W / 2, py, px + W / 2, py + H];
  else if (s.align === 'left') box = [px - W, py - H / 2, px, py + H / 2];
  else if (s.align === 'right') box = [px, py - H / 2, px + W, py + H / 2];
  else if (s.align === 'top-left') box = [px - W, py - H, px, py];
  else if (s.align === 'top-right') box = [px, py - H, px + W, py];
  else if (s.align === 'bottom-left') box = [px - W, py, px, py + H];
  else box = [px, py, px + W, py + H];
  boxes.push({ id, cn: s.cn, box });
}
const hit = (a, b) => !(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]);
let overlaps = 0;
for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    if (hit(boxes[i].box, boxes[j].box)) {
      overlaps++;
      if (overlaps <= 10) warn.push(`站名重叠: ${boxes[i].cn}(${boxes[i].id}) / ${boxes[j].cn}(${boxes[j].id})`);
    }
  }
}

// 图例引用核对
const legendIds = [];
for (const sec of legend) for (const it of sec.items || []) legendIds.push(...it.targets);
for (const lid of legendIds) if (!lines.some((l) => l.id === lid)) err.push(`图例引用了不存在的线路 ${lid}`);
for (const l of lines) if (!legendIds.includes(l.id)) warn.push(`线路 ${l.id} 未出现在图例`);

for (const [id, s] of Object.entries(stations)) {
  if (!s.cn || !s.en) err.push(`${id} 缺中英文站名`);
  if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) err.push(`${id} 坐标非法`);
  if (/[/\\]/.test(s.cn)) warn.push(`${id} 站名含斜杠: ${s.cn}`);
}

// 坐标网格：站心与走向折点一律落在 5px 网格上（整理后以 10 为主、几何必须处保留 5），便于人工核对与增删站
// 例外：邻城示意线（foreign，如 SH11 上海 11 号线）必须与邻城影子的映射点逐点重合，用整数/一位小数坐标，
// 不适用本城网格规则。
const GRID = 5;
for (const [id, s] of Object.entries(stations)) {
  if (s.x % GRID || s.y % GRID) err.push(`${id} ${s.cn} 坐标未对齐 ${GRID}px 网格: (${s.x}, ${s.y})`);
}
for (const line of lines) {
  if (line.foreign) continue;
  for (const pts of pathGroups(line)) {
    for (const p of pts) {
      if (p.x % GRID || p.y % GRID) err.push(`${line.id} 折点未对齐 ${GRID}px 网格: (${p.x}, ${p.y})`);
    }
  }
}
// 站心到折线的最近投影：d = 垂直距离，s = 沿走向累计长度
function projectOnPolyline(p, pts) {
  let best = { d: Infinity, s: 0 };
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    let t = len ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len) : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    if (d < best.d) best = { d, s: acc + t * len };
    acc += len;
  }
  return best;
}

// 站心必须落在本线走向上（作折点，或落在两折点连线上），线路才会穿过站点图元。
// 不要求每站一个独立折点：北京、南京等城市过半的车站都直接落在线段中间，
// 苏州的乐桥、南门、索山桥西同理；要求「一站一折点」会把正确排版大量误判成错误。
const ON_LINE_TOLERANCE = 0.75; // 半个像素以内，肉眼不可辨
// 换乘图元是 17.5px 的圆：苏州把并行线路从图元两侧引入（唐庄、西津桥、金尚路、
// 桑田岛），或让两条线在换乘站两侧各留 5px（苏州新区火车站）；站心落在图元覆盖
// 范围内即可，属排版手法而非走向错误。
const TSF_RADIUS = STATION_SIZE.tsf / 2;
// 在建站（type: "no"）不参与「站心落在走向上」与「站序单调」两条校验：
// 它们按官方图排在所属线路站序的端部/交叉处，实际几何画在 data_notopen.js 的虚线层上，
// 并不落在该线运营段的实线走向里（editor 导出即如此）。运营段仍按 0.75px / 8.75px 严检。
for (const line of lines) {
  const groups = pathGroups(line);
  for (const [, ids] of stationGroups(line)) {
    for (const id of ids || []) {
      const s = stations[id];
      if (!s || s.type === 'no') continue;
      const d = Math.min(...groups.map((pts) => projectOnPolyline(s, pts).d));
      const limit = s.type === 'tsf' ? TSF_RADIUS : ON_LINE_TOLERANCE;
      if (d > limit) err.push(`${line.id} 的走向未经过 ${id} ${s.cn}(${s.x},${s.y})，距折线 ${d.toFixed(1)}px`);
    }
  }
}

// 站序必须沿走向单调前进，否则图面走向与 stationIds 顺序脱节（前/后一站会指错方向）。
// 例：M7 白荡南实际位置在白荡北—板泾之间，站序却曾排在木里之后。
// 分支线按「每个站归到最近的那段走向」分开校验：文昌路只落在 pathPoints-branch1 上，
// 与主线站序各自单调即可。
for (const line of lines) {
  if (line.isLoop) continue;
  const groups = pathGroups(line);
  for (const [, ids] of stationGroups(line)) {
    const seq = new Map(); // 走向段下标 → [{ id, s }]
    for (const id of ids || []) {
      const s = stations[id];
      if (!s || s.type === 'no') continue;
      let bestIdx = 0, best = null;
      groups.forEach((pts, gi) => {
        const pos = projectOnPolyline(s, pts);
        if (!best || pos.d < best.d) { best = pos; bestIdx = gi; }
      });
      if (!seq.has(bestIdx)) seq.set(bestIdx, []);
      seq.get(bestIdx).push({ id, s: best.s });
    }
    for (const list of seq.values()) {
      let prevS = null, prevLabel = '';
      for (const { id, s } of list) {
        if (prevS !== null && s <= prevS) {
          err.push(`${line.id} 站序与走向不一致：${prevLabel}(${prevS.toFixed(0)}px) 之后是 ${id} ${s.cn}(${s.toFixed(0)}px)`);
        }
        prevS = s; prevLabel = `${id} ${s.cn}`;
      }
    }
  }
}

// 内容外接盒（含站名框），供核对 mapSize / center
const minX = Math.min(...boxes.map((b) => b.box[0]));
const minY = Math.min(...boxes.map((b) => b.box[1]));
const maxX = Math.max(...boxes.map((b) => b.box[2]));
const maxY = Math.max(...boxes.map((b) => b.box[3]));
console.log('内容外接盒 x', minX.toFixed(1), '..', maxX.toFixed(1), ' y', minY.toFixed(1), '..', maxY.toFixed(1));

const on10 = (v) => v % 10 === 0;
const st10 = Object.values(stations).filter((s) => on10(s.x) && on10(s.y)).length;
const ptAll = lines.reduce((n, l) => n + (l.pathPoints || []).length, 0);
const pt10 = lines.reduce((n, l) => n + (l.pathPoints || []).filter((p) => on10(p.x) && on10(p.y)).length, 0);
console.log(`整10 占比：站心 ${st10}/${Object.keys(stations).length}，折点 ${pt10}/${ptAll}（其余为几何必须的 5 的倍数）`);

console.log('车站', Object.keys(stations).length, '线路', lines.length, '换乘站', list.filter((s) => s.type === 'tsf').length);
console.log('站名重叠对数:', overlaps);
console.log('错误', err.length, '告警', warn.length);
err.slice(0, 20).forEach((e) => console.log('  [E]', e));
warn.slice(0, 20).forEach((e) => console.log('  [W]', e));
process.exit(err.length ? 1 : 0);
