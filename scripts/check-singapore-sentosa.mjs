// Sentosa official Chinese transport guide, April 2026; LTA system-map island silhouette.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const routing = require('../core/line-routing.js');
const read = (file, variable) => new Function(readFileSync(new URL(`../city/singapore/${file}`, import.meta.url), 'utf8') + `;return ${variable};`)();
const stations = read('data_stations.js', 'stationsData');
const lines = read('data_lines.js', 'linesData');
const walking = read('data_virtual_transfers.js', 'VIRTUAL_TRANSFER_MAP');
const free = read('data_virtual_transfers.js', 'VIRTUAL_FREE_TRANSFER_MAP');
const ids = ['SENTOSA_VIVO', 'SENTOSA_RWS', 'SENTOSA_IMBIAH', 'SENTOSA_BEACH'];
const line = lines.find(l => l.id === 'SENTOSA');
assert.deepEqual(line.stationIds, ids);
assert.deepEqual(ids.map(id => stations[id].cn), ['怡丰城', '名胜世界', '英比奥', '海滩']);
assert.equal(line.isLoop, false);
assert.deepEqual(line.distances, ['??', '??', '??']);
assert.deepEqual(routing.neighbors(line, ids[0]).prev, []);
assert.deepEqual(routing.neighbors(line, ids.at(-1)).next, []);
assert.deepEqual(walking.CC29, ['SENTOSA_VIVO']);
assert.deepEqual(walking.SENTOSA_VIVO, ['CC29']);
assert(!free.CC29 && !free.SENTOSA_VIVO, 'Sentosa is not a fare-continuous MRT walking transfer');
for (const id of ids) {
    assert(stations[id].sentosaExpress);
    assert.equal(stations[id].stationCodes, '', 'No invented MRT station codes');
    assert.notEqual(stations[id].physicalHubId, 'CC29', 'Separate ticketed station');
    assert.deepEqual(lines.filter(l => routing.allStationIds(l).includes(id)).map(l => l.id), ['SENTOSA']);
}
for (const theme of ['light', 'dark']) {
    const svg = readFileSync(new URL(`../city/singapore/assets/water-${theme}.svg`, import.meta.url), 'utf8');
    assert(svg.includes('id="sentosa-island"'));
    assert(svg.includes('aria-label="圣淘沙"'));
    assert(svg.includes('viewBox="0 0 3400 2450"'), 'Full island remains inside the expanded viewport');
}
console.log('PASS: Sentosa island restored; four-stop monorail with two terminals; separately ticketed HarbourFront/VivoCity walking access; no invented station codes.');
