// One BPLRT line, with complete A/B round trips verified against LTA/SMRT sources.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const routing = createRequire(import.meta.url)('../core/line-routing.js');
const read = (file, name) => new Function(readFileSync(new URL('../city/singapore/' + file, import.meta.url), 'utf8') + ';return ' + name + ';')();
const lines = read('data_lines.js', 'linesData');
const line = lines.find(l => l.id === 'BP');
const trunk = ['NS4','BP2','BP3','BP4','BP5','BP6'];
const loop = ['BP7','BP8','BP9','BP10','BP11','BP12','BP13'];
assert(!lines.some(l => l.id === 'BPL'), 'The loop must not remain a second passenger line');
const ways = routing.ways(line);
assert.equal(ways.length, 2);
assert.deepEqual(ways[0].ids, [...trunk, ...loop.toReversed(), ...trunk.toReversed()]);
assert.deepEqual(ways[1].ids, [...trunk, ...loop, ...trunk.toReversed()]);
for (const way of ways) {
    assert.equal(way.distances.length, way.ids.length - 1);
    assert(!way.ids.includes('BP14'));
}
assert.equal(routing.allStationIds(line).length, 13);
assert.deepEqual(line.geometrySources, ['BP','BPL']);
assert(routing.segments(line, {}).every(segment => segment.ways.size === 2), 'Both services use the trunk and loop, drawn only once');
for (const id of routing.allStationIds(line)) assert(routing.plan(line, id, {}).allLit, 'Every stop belongs to the same complete line');
const legend = read('data_legend.js', 'LEGEND_CONFIG');
const entries = legend.flatMap(group => group.items || []);
assert.equal(entries.filter(entry => entry.targets?.includes('BP')).length, 1);
assert(!entries.some(entry => entry.targets?.includes('BPL')));
globalThis.window = { StationBoard: { registerModule() {} } };
new Function(readFileSync(new URL('../city/singapore/modules/service-patterns.js', import.meta.url), 'utf8'))();
const visits = window.SingaporeServicePatterns.visits;
assert.deepEqual(visits(ways[0], 'BP6').map(v => [v.prev,v.next]), [['BP5','BP13'],['BP7','BP5']]);
assert.deepEqual(visits(ways[1], 'BP6').map(v => [v.prev,v.next]), [['BP5','BP7'],['BP13','BP5']]);
assert.deepEqual(visits(ways[0], 'NS4').map(v => [v.prev,v.next]), [['BP2','BP2']]);
assert.deepEqual(visits(ways[0], 'BP13').map(v => [v.prev,v.next]), [['BP6','BP12']]);
console.log('PASS: one 13-station BPLRT line; continuous A/B round trips; correct return calls; one legend entry; original stem/loop geometry combined without duplicate tracks.');
