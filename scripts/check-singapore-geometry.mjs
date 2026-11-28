// Official Chinese map corridors: shared signs must not pull tracks off their centrelines.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = readFileSync(fileURLToPath(new URL('../city/singapore/data_lines.js', import.meta.url)), 'utf8');
const lines = new Function(`${source}; return linesData;`)();
const stations = new Function(readFileSync(new URL('../city/singapore/data_stations.js', import.meta.url), 'utf8') + ';return stationsData;')();
const points = id => lines.find(line => line.id === id).pathPoints;
function xAtY(route, y) {
    for (let i = 1; i < route.length; i++) {
        const a = route[i - 1], b = route[i];
        if (a.y === b.y || y < Math.min(a.y, b.y) || y > Math.max(a.y, b.y)) continue;
        const x = a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y);
        if (x > 1800 && x < 1950) return x;
    }
    throw new Error(`Missing City Hall–Raffles Place track at y=${y}`);
}
for (const y of [1790, 1810, 1830, 1850, 1870]) {
    const ns = xAtY(points('NS'), y), ew = xAtY(points('EW'), y);
    assert(Math.abs(ns - 1855.364) < 0.05, `NS departs its Chinese-reference corridor at y=${y}`);
    assert(Math.abs(ew - 1877.931) < 0.05, `EW departs its Chinese-reference corridor at y=${y}`);
    assert(Math.abs(ew - ns - 22.567) < 0.05, `Parallel track spacing changes at y=${y}`);
}
for (const id of ['EW', 'TE', 'NE']) {
    const route = points(id).filter(p => p.x > 1400 && p.x < 1560 && p.y > 1710 && p.y < 1810);
    assert(route.length >= 3, `Missing Outram Park corridor: ${id}`);
    const a = route[0], b = route.at(-1), dx = b.x - a.x, dy = b.y - a.y;
    const deviations = route.map(p => Math.abs(dx * (p.y - a.y) - dy * (p.x - a.x)) / Math.hypot(dx, dy));
    assert(Math.max(...deviations) < 0.05, `${id} develops an artificial bend at Outram Park`);
}
const dhoby = stations.NS24;
const approach = points('CCE');
const end = approach.at(-1), tangent = approach.at(-2);
assert(Math.abs(end.y - dhoby.y) < 0.01 && Math.abs(tangent.y - dhoby.y) < 0.01, 'CC1 approach must meet the middle of the station plate, not its top edge');
assert(end.x > dhoby.x + 35 && end.x < dhoby.x + 89, 'Circle Line ends inside its yellow CC1 cell');
const arc = approach.filter(p => p.x >= tangent.x && p.x <= 1826 && p.y < 1564);
for (let i = 1; i < arc.length; i++) assert(arc[i].x < arc[i-1].x && arc[i].y <= arc[i-1].y, 'Dhoby terminal arc must not reverse or hook back');
console.log('PASS: City Hall/Raffles and Outram corridors preserved; Dhoby Circle Line enters the CC1 cell from the right at plate mid-height without a hook.');
