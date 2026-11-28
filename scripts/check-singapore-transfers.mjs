// Official tap-out interchanges: SimplyGo transfer-fare-rules; verified 2026-11-23.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const routing = createRequire(import.meta.url)('../core/line-routing.js');
const read = (file, name) => new Function(readFileSync(new URL(`../city/singapore/${file}`, import.meta.url), 'utf8') + `;return ${name};`)();
const stations = read('data_stations.js', 'stationsData');
const lines = read('data_lines.js', 'linesData');
const peers = read('data_virtual_transfers.js', 'VIRTUAL_FREE_TRANSFER_MAP');
const links = read('data_virtual_transfers.js', 'VIRTUAL_FREE_CONNECT_LINES');
const cases = [['NS21', 'DT11', ['NS'], ['DT']], ['BP6', 'DT1', ['BP'], ['DT']], ['EW2', 'DT32', ['EW'], ['DT']]];
const operatingStations = Object.entries(stations).filter(([, s]) => s.type !== 'no' && !s.sentosaExpress);
assert.equal(operatingStations.length, 187, 'Operating route-side nodes');
assert.equal(new Set(operatingStations.map(([id, s]) => s.physicalHubId || id)).size, 184, 'Operating physical stations');
assert.equal(Object.values(stations).filter(s => s.type === 'tsf').length, 27);
assert.equal(Object.values(stations).filter(s => s.type === 'tsfo').length, 6);
assert.equal(links.length, 3);
assert.equal(Object.keys(peers).length, 6);
for (const [a, b, aLines, bLines] of cases) {
    assert.notEqual(a, b);
    assert.equal(stations[a].physicalHubId, stations[b].physicalHubId);
    assert(Math.hypot(stations[a].x - stations[b].x, stations[a].y - stations[b].y) > 40, `${a}/${b}: signs must be separated`);
    assert(links.some(link => link.from === a && link.to === b));
    for (const [id, peer, expected] of [[a, b, aLines], [b, a, bLines]]) {
        assert.equal(stations[id].type, 'tsfo');
        assert.equal(stations[id].stationCodes, id, `${id}: do not fuse paid areas in one code badge`);
        assert.deepEqual(peers[id], [peer]);
        assert.equal(stations[id].paidAreaTransfer.peerId, peer);
        assert.equal(stations[id].paidAreaTransfer.limitMinutes, 15);
        assert.deepEqual(lines.filter(l => routing.allStationIds(l).includes(id)).map(l => l.id).sort(), expected.sort());
    }
}
const graph = new Map(Object.keys(stations).map(id => [id, new Set()]));
for (const line of lines) {
    if (line.isPointOnly) continue;
    for (const way of routing.ways(line)) {
        const ids = way.ids.concat(line.isLoop ? [way.ids[0]] : []);
        assert.equal(way.distances.length, way.ids.length - (line.isLoop ? 0 : 1));
        for (let i = 1; i < ids.length; i++) { graph.get(ids[i - 1]).add(ids[i]); graph.get(ids[i]).add(ids[i - 1]); }
    }
}
const walking = read('data_virtual_transfers.js', 'VIRTUAL_TRANSFER_MAP');
for (const map of [peers, walking]) for (const [id, targets] of Object.entries(map)) for (const peer of targets) graph.get(id).add(peer);
const seen = new Set(), queue = ['NS1'];
while (queue.length) { const id = queue.pop(); if (seen.has(id)) continue; seen.add(id); queue.push(...graph.get(id)); }
assert.equal(seen.size, 191, 'Complete network including explicitly modelled walking links');
console.log('PASS: Newton, Bukit Panjang and Tampines have separate paid areas and symmetric walking links; 187 route nodes / 184 physical stations; Sentosa access is separately ticketed; all routes and walking edges connected.');
