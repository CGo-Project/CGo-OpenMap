// Independent checkpoints from LTA's Chinese SM_CH_(Ver210726)_CCL6.pdf.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file, variable) => new Function(readFileSync(new URL(`../city/singapore/${file}`, import.meta.url), 'utf8') + `;return ${variable};`)();
const info = read('data_reference_geometry.js', 'SG_REFERENCE_INFO');
const shapes = read('data_reference_geometry.js', 'SG_REFERENCE_GEOMETRY');
const visible = read('data_reference_geometry.js', 'SG_VISIBLE_ROUTE_GEOMETRY');
const stations = read('data_stations.js', 'stationsData');
const lines = read('data_lines.js', 'linesData');
assert(info.source.includes('SM_CH_(Ver210726)_CCL6.pdf'), 'The Chinese map is the primary geometry source');
assert(/^[a-f0-9]{64}$/.test(info.sha256), 'Source PDF fingerprint retained');
const counts = { NS:2, EW:2, NE:3, CC:1, CCE:2, DT:6, TE:4, CG:2, BP:1, BPL:1, SE:1, SW:1, PE:1, PW:1 };
assert.deepEqual(Object.fromEntries(Object.keys(counts).map(id => [id, shapes[id]?.length])), counts, 'All original Chinese route pieces, including Punggol Coast, must be present');
for (const line of lines.filter(line => !line.isPointOnly && line.id !== 'SENTOSA')) assert((line.geometrySources || [line.id]).every(id => shapes[id]?.length) && visible[line.id], `${line.id}: all source groups combined into visible native geometry`);
// These peripheral checkpoints differed materially from the old English layout.
for (const [id, x, y] of [['NS9',996.690,297.920],['EW33',322.145,764.795],['TE1',900.213,195.446],['NE17',2441.684,400.767],['TE31',2994.223,1269.643]]) {
    assert(Math.hypot(stations[id].x-x,stations[id].y-y)<0.01, `${id}: Chinese station-code position`);
}
assert(shapes.NS.some(path => path.d.includes('C')) && shapes.CC.some(path => path.d.includes('C')), 'Original curves are retained');
assert(shapes.NS.some(path => path.fill==='var(--map-bg)') && shapes.EW.some(path => path.fill==='var(--map-bg)'), 'Original theme-aware background edging retained');
assert(shapes.CG.every(path => path.fill==='line'), 'The airport uses its two original hollow-rail fills');
console.log('PASS: all 14 original Chinese source groups retained and combined into the current MRT/LRT line model, including Punggol Coast; north/west/extension anchors and original background edging verified.');
