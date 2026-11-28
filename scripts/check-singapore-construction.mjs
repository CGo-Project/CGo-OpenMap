// LTA official Chinese map and 2026-11-04 TEL5 / DTL3e opening announcement.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const routing = createRequire(import.meta.url)('../core/line-routing.js');
const read = (file, variable) => new Function(readFileSync(new URL(`../city/singapore/${file}`, import.meta.url), 'utf8') + `;return ${variable};`)();
const stations = read('data_stations.js', 'stationsData');
const lines = read('data_lines.js', 'linesData');
const tracks = read('data_notopen.js', 'NOT_OPEN_LINES');
const annotation = read('data_construction.js', 'SG_CONSTRUCTION_ANNOTATION');
const futureIds = ['TE30', 'TE31', 'DT36'];
assert.deepEqual(Object.keys(stations).filter(id => stations[id].type === 'no').sort(), futureIds.slice().sort());
assert.equal(stations.TE31.stationCodes, 'TE31 / DT37');
for (const id of futureIds) {
    assert.equal(stations[id].construction.plannedOpening, '2026-12-26');
    assert(!lines.some(line => !line.isPointOnly && routing.allStationIds(line).includes(id)), `${id}: unopened station must not become an operating stop`);
    assert(lines.some(line => line.isPointOnly && routing.allStationIds(line).includes(id)), `${id}: construction metadata exists`);
}
for (const [trackId, lineId, colour] of [['TEL5', 'TE', '#9d5918'], ['DTL3e', 'DT', '#0055b8']]) {
    const track = tracks.find(item => item.id === trackId);
    assert.equal(track.style.color, colour);
    assert.equal(track.style.width, 9.52978);
    assert(!track.style.dashArray, 'Reference construction railway stays solid');
    assert.deepEqual(track.points[0], lines.find(line => line.id === lineId).pathPoints.at(-1), 'Extension joins actual route end without a gap');
}
assert.equal(lines.find(line => line.id === 'TE').stationIds.at(-1), 'TE29');
assert.equal(lines.find(line => line.id === 'DT').stationIds.at(-1), 'CG1');
const tel = tracks.find(track => track.id === 'TEL5');
const dtl = tracks.find(track => track.id === 'DTL3e');
assert(dtl.svgPath.includes('C'), 'DTL extension keeps the official curve before Xilin');
assert(!tel.svgPath.includes('C'), 'TEL approaches Sungei Bedok on the official straight diagonal');
const joint = stations.TE31;
function entryX(track, y) {
    const [a, b] = track.points.slice(-2);
    return a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y);
}
assert(entryX(dtl, joint.y - 16) > joint.x, 'DTL enters the top of the blue DT37 plate');
assert(entryX(tel, joint.y + 16) < joint.x, 'TEL enters the bottom of the brown TE31 plate');
assert(stations.DT36.x < dtl.points[0].x && stations.DT36.y < joint.y, 'Xilin follows the southwest bend before Sungei Bedok');
assert.equal(annotation.filter(item => item['stroke-dasharray']).length, 2, 'Dotted top and bottom boundary');
assert(annotation.some(item => item.tag === 'path' && !item['stroke-dasharray'] && item.d.includes('C')), 'Solid curved left bracket');
assert(annotation.some(item => item.tag === 'rect' && item.fill === '#231f20'), 'Dark construction callout');
assert.deepEqual(annotation.filter(item => item.tag === 'text').map(item => item.text), ['施工中']);
console.log('PASS: 3 unopened stations; official DTL curve before Xilin and separate coloured Sungei Bedok plate entries; dotted enclosure and dark callout; no operating-route leakage.');
