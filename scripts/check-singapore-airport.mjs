// Airport source: changiairport.com transport-and-directions/getting-to-changi-airport.html.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const routing = require('../core/line-routing.js');
const read = (file, variable) => new Function(readFileSync(new URL(`../city/singapore/${file}`, import.meta.url), 'utf8') + `;return ${variable};`)();
const lines = read('data_lines.js', 'linesData');
const stations = read('data_stations.js', 'stationsData');
const airport = lines.find(line => line.id === 'CG');
assert.deepEqual(airport.stationIds, ['EW4', 'CG1', 'CG2']);
assert.equal(airport.isLoop, false);
assert.equal(airport.distances.length, 2);
assert.deepEqual(routing.neighbors(airport, 'EW4').prev, []);
assert.deepEqual(routing.neighbors(airport, 'EW4').next.map(s => s.id), ['CG1']);
assert.deepEqual(routing.neighbors(airport, 'CG1').prev.map(s => s.id), ['EW4']);
assert.deepEqual(routing.neighbors(airport, 'CG1').next.map(s => s.id), ['CG2']);
assert.deepEqual(routing.neighbors(airport, 'CG2').next, []);
const points = airport.pathPoints;
assert(Math.hypot(points[0].x-points.at(-1).x,points[0].y-points.at(-1).y)>200, 'No closed perimeter masquerading as a route');
for(let i=1;i<points.length;i++){
    assert(points[i].x >= points[i-1].x-0.001,'Forward centreline must not double back');
    assert(points[i].y >= points[i-1].y-0.001,'Forward centreline must not double back');
}
const native = read('data_reference_geometry.js','SG_REFERENCE_GEOMETRY').CG;
assert.equal(native.length,2,'The Chinese map supplies two exact rail ribbons');
assert(native.every(shape=>shape.fill==='line' && shape.d.includes('C')),'Both rail ribbons retain the original curve');
assert.equal(stations.EW4.stationCodes,'EW4 / CG');
assert.equal(stations.CG1.stationCodes,'CG1 / DT35');
assert.equal(stations.CG2.stationCodes,'CG2');
globalThis.window={};
globalThis.document={createElement:()=>({}),head:{appendChild(){}},documentElement:{classList:{add(){}}},addEventListener(){}};
new Function(readFileSync(new URL('../city/singapore/singapore.js',import.meta.url),'utf8'))();
assert(!window.SINGAPORE_CITY.LINE_SYNC_GROUPS.some(ids=>ids.includes('EW')&&ids.includes('CG')),'Shuttle selection must not imply a through train along the EWL main line');
console.log('PASS: CG is an open EW4→CG1→CG2 shuttle; terminal neighbours, forward centreline, hollow style, station codes and independent highlighting verified.');
