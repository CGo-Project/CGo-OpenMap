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
for (const line of lines) {
  const ids = line.stationIds || [];
  if (!ids.length) err.push(`${line.id} 无站序`);
  if (!Array.isArray(line.pathPoints) || line.pathPoints.length < 2) err.push(`${line.id} 缺走向`);
  const need = line.isLoop ? ids.length : ids.length - 1;
  if ((line.distances || []).length !== need) {
    err.push(`${line.id} 站间距长度 ${(line.distances || []).length} != ${need}`);
  }
  for (const id of ids) {
    if (!stations[id]) err.push(`${line.id} 引用了不存在的车站 ${id}`);
    if (!used.has(id)) used.set(id, []);
    used.get(id).push(line.id);
  }
}

// 换乘站类型核对
for (const [id, s] of Object.entries(stations)) {
  const ls = used.get(id) || [];
  if (!ls.length) warn.push(`${id} ${s.cn} 未被任何线路引用`);
  if (ls.length > 1 && s.type !== 'tsf') err.push(`${id} ${s.cn} 属于 ${ls.join('/')} 但类型是 ${s.type}`);
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

// 坐标网格：站心与走向折点一律落在 5px 网格上（便于人工核对与增删站）
for (const [id, s] of Object.entries(stations)) {
  if (s.x % 5 || s.y % 5) err.push(`${id} ${s.cn} 坐标未对齐 5px 网格: (${s.x}, ${s.y})`);
}
for (const line of lines) {
  for (const p of line.pathPoints) {
    if (p.x % 5 || p.y % 5) err.push(`${line.id} 折点未对齐 5px 网格: (${p.x}, ${p.y})`);
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
for (const line of lines) {
  const pts = line.pathPoints || [];
  for (const id of line.stationIds || []) {
    const s = stations[id];
    if (!s) continue;
    const { d } = projectOnPolyline(s, pts);
    const limit = s.type === 'tsf' ? TSF_RADIUS : ON_LINE_TOLERANCE;
    if (d > limit) err.push(`${line.id} 的走向未经过 ${id} ${s.cn}(${s.x},${s.y})，距折线 ${d.toFixed(1)}px`);
  }
}

// 站序必须沿走向单调前进，否则图面走向与 stationIds 顺序脱节（前/后一站会指错方向）。
// 例：M7 白荡南实际位置在白荡北—板泾之间，站序却曾排在木里之后。
for (const line of lines) {
  if (line.isLoop || !Array.isArray(line.pathPoints)) continue;
  let prevS = null, prevLabel = '';
  for (const id of line.stationIds || []) {
    const s = stations[id];
    if (!s) continue;
    const pos = projectOnPolyline(s, line.pathPoints).s;
    if (prevS !== null && pos <= prevS) {
      err.push(`${line.id} 站序与走向不一致：${prevLabel}(${prevS.toFixed(0)}px) 之后是 ${id} ${s.cn}(${pos.toFixed(0)}px)`);
    }
    prevS = pos; prevLabel = `${id} ${s.cn}`;
  }
}

// 内容外接盒（含站名框），供核对 mapSize / center
const minX = Math.min(...boxes.map((b) => b.box[0]));
const minY = Math.min(...boxes.map((b) => b.box[1]));
const maxX = Math.max(...boxes.map((b) => b.box[2]));
const maxY = Math.max(...boxes.map((b) => b.box[3]));
console.log('内容外接盒 x', minX.toFixed(1), '..', maxX.toFixed(1), ' y', minY.toFixed(1), '..', maxY.toFixed(1));

console.log('车站', Object.keys(stations).length, '线路', lines.length, '换乘站', list.filter((s) => s.type === 'tsf').length);
console.log('站名重叠对数:', overlaps);
console.log('错误', err.length, '告警', warn.length);
err.slice(0, 20).forEach((e) => console.log('  [E]', e));
warn.slice(0, 20).forEach((e) => console.log('  [W]', e));
process.exit(err.length ? 1 : 0);
