// Chinese names: LTA SM_CH_(Ver210726)_CCL6.pdf and Sentosa official Chinese transport guide.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const routing = createRequire(import.meta.url)('../core/line-routing.js');
const read = (file, variable) => new Function(readFileSync(new URL(`../city/singapore/${file}`, import.meta.url), 'utf8') + `;return ${variable};`)();
const stations = read('data_stations.js', 'stationsData');
const lines = read('data_lines.js', 'linesData');
assert.equal(Object.keys(stations).length, 194);
for (const [id, station] of Object.entries(stations)) {
    assert(/^[\u3400-\u9fff]+$/.test(station.cn), `${id}: Chinese primary name`);
    assert(/[A-Za-z]/.test(station.en), `${id}: English search name retained`);
    assert(station.aliases.includes(station.cn) && station.aliases.includes(station.en), `${id}: both name searches resolve`);
    for (const code of station.stationCodes.split(' / ').filter(Boolean)) assert(station.aliases.includes(code), `${id}: code remains searchable`);
}
for (const [id, name] of Object.entries({ NS25: '政府大厦', EW16: '欧南园', DT20: '福康宁', NE5: '克拉码头', DT4: '谦道', CC30: '吉宝', CC31: '广东民', TE31: '双溪勿洛', DT36: '锡林', SE1: '康埔桦', PW4: '山姆' })) assert.equal(stations[id].cn, name);
globalThis.window = {};
globalThis.document = {createElement: () => ({}), head: {appendChild() {}}, documentElement: {classList: {add() {}}}, addEventListener() {}};
new Function(readFileSync(new URL('../city/singapore/singapore.js', import.meta.url), 'utf8'))();
const directions = window.SINGAPORE_CITY.terminalMarkers;
assert.deepEqual(directions.map(m => [m.number, m.code]), [[1,'EW1'],[2,'EW33'],[3,'CG2'],[4,'NS1'],[5,'NS28'],[6,'NE1'],[7,'NE18'],[11,'DT1'],[12,'DT37'],[13,'TE1'],[14,'TE31']]);
for (const marker of directions) {
    const station = stations[marker.stationId];
    assert(station.stationCodes.split(' / ').includes(marker.code), `Direction ${marker.number} belongs to the station code`);
    if (marker.number === 12 || marker.number === 14) assert.equal(station.type, 'no', 'Future terminus stays unopened');
    else assert(lines.some(line => routing.ways(line).some(way => [way.ids[0], way.ids.at(-1)].includes(marker.stationId))), `Direction ${marker.number} is an operational terminus`);
}
for (const station of Object.values(stations)) {
    const html = window.SINGAPORE_CITY.renderStationIcon(station)?.html || '';
    assert(html.includes(station.sentosaExpress ? 'data-symbol="monorail"' : 'Singapore Lato'), 'Chinese names must not break custom station signs');
}
for (const svg of new Set(lines.map(line => line.svg))) {
    const source = readFileSync(new URL('../' + svg.replace(/^\.\//, ''), import.meta.url), 'utf8');
    assert(source.includes(svg.endsWith('sentosa-express.svg') ? 'data-symbol="monorail"' : 'data-font="Lato Bold"'), 'Custom line mark matches the service');
    assert(!source.includes('<text'), 'Line lettering stays outlined');
}
console.log('PASS: 194 Chinese names; searches preserved; custom signs and Lato lettering retained; 11 official terminus numbers match station codes and construction status.');
