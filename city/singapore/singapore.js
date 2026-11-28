(function () {
    "use strict";
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './city/singapore/style.css' + (window.CGO_ASSET_VERSION ? '?v=' + window.CGO_ASSET_VERSION : '');
    document.head.appendChild(link);
    document.documentElement.classList.add('map-singapore');
    const City = {
    "id": "singapore",
    "name": "新加坡",
    "officialMapUrl": "https://www.lta.gov.sg/content/dam/ltagov/getting_around/public_transport/rail_network/pdf/SM_CH_(Ver210726)_CCL6.pdf",
    "center": {
        "x": 1680,
        "y": 1250
    },
    "defaultScale": 0.37,
    "mapSize": {
        "width": 3400,
        "height": 2450
    },
    "maintainers": [
        {
            "name": "Deming ZHOU",
            "role": "城市主理人（申请中）",
            "github": "https://github.com/betaxiaozhou/"
        }
    ],
    "LINE_META": {},
    "LINE_SORT_ORDER": ["NS", "EW", "CG", "NE", "CC", "CCE", "DT", "TE", "BP", "SE", "SW", "PE", "PW", "SENTOSA", "TE-UC", "DT-UC"],
    "LINE_SYNC_GROUPS": [
        [
            "CC",
            "CCE"
        ],
        ["SE", "SW"],
        ["PE", "PW"]
    ],
    "SUBURBAN_LINES": [],
    "MERGE_STATIONS": [],
    "CROSS_PLATFORM_STATIONS": [],
    "TRAM_LINES": ["BP","SE","SW","PE","PW"],
    "dataFiles": {}
};
    City.svglogo = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"-3 -3 106 60.45311\" class=\"sg-public-transport-logo\" role=\"img\" aria-label=\"新加坡公共交通标志\"><style>.sg-public-transport-logo{color:#00843d}[data-theme=\"dark\"] .sg-public-transport-logo{color:#69c395}</style><title>Singapore Public Transport Symbol</title><metadata>Source: https://www.lta.gov.sg/content/dam/ltagov/industry_innovations/industry_matters/development_construction_resources/pdf/TransportInfrastructure/Jwalk/20150209%20j%20walk%20signage%20guidelines.pdf ; PDF page 9 (printed page 7), original vector drawing. Rights: LTA; redistribution permission pending. Monochrome adaptation for city header.</metadata><path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M50.24527 54.45311C49.64863 54.45311 49.03763 54.42729 48.40948 54.37275C38.06627 53.4721 33.92706 46.25242 29.16845 42.38011C24.04849 38.21525 17.04686 33.84679 0 32.51581C0 32.51581 8.65675 18.92835 10.48677 15.96247C12.90485 12.04718 15.38316 6.5313 24.75402 6.5313C25.61468 6.5313 26.53818 6.58005 27.52208 6.67757L16.12896 24.64215C16.12896 24.64215 29.15987 26.7705 36.82991 33.85826C41.61444 38.27548 42.1421 38.72585 43.98368 40.60463C48.03097 44.55441 51.6651 45.92259 54.75441 45.92259C61.68145 45.92259 65.87791 39.04999 65.87791 39.04999C65.87791 39.04999 62.98083 40.32644 59.51582 40.32644C57.08636 40.32644 54.37853 39.69819 52.19574 37.55559C46.80898 32.27491 45.38915 30.88091 45.38915 30.88091C45.38915 30.88091 39.27951 24.14591 25.81828 20.10151L31.41444 11.31284C33.2961 8.1634 39.1848 0.0344 49.68592 0L49.82073 0C50.39724 0 50.9853 0.02871 51.58772 0.08036C61.93391 0.9839 66.07014 8.20069 70.83155 12.073C75.95151 16.23786 82.95331 20.60641 100 21.9373C99.96271 21.99753 91.33747 35.53045 89.51043 38.49064C87.09515 42.40593 84.61684 47.92182 75.24598 47.92182C74.38252 47.92182 73.46182 47.87306 72.47512 47.77554L83.87121 29.81096C83.87121 29.81096 70.84013 27.67973 63.17009 20.59494C58.38574 16.17475 57.8551 15.72726 56.0165 13.84849C51.9692 9.8959 48.3349 8.53052 45.24577 8.53052C38.31855 8.53052 34.12226 15.40312 34.12226 15.40312C34.12226 15.40312 37.01917 14.12676 40.48138 14.12676C42.91364 14.12676 45.62147 14.75492 47.80426 16.89473C53.18822 22.1782 54.61085 23.57229 54.61085 23.57229C54.61085 23.57229 60.71769 30.30431 74.18172 34.35161L68.58276 43.14027C66.6983 46.29549 60.78947 54.45311 50.24527 54.45311\"/></svg>";
    // Direction numbers from LTA SM_CH_(Ver210726)_CCL6; CCL is now a closed loop.
    City.terminalMarkers = [
        { stationId: 'EW1', code: 'EW1', number: 1, color: '#009645', dx: 0, dy: -34 },
        { stationId: 'EW33', code: 'EW33', number: 2, color: '#009645', dx: 0, dy: -34 },
        { stationId: 'CG2', code: 'CG2', number: 3, color: '#009645', dx: 46, dy: 0 },
        { stationId: 'NS1', code: 'NS1', number: 4, color: '#e1251b', dx: -33, dy: -36 },
        { stationId: 'NS28', code: 'NS28', number: 5, color: '#e1251b', dx: 0, dy: 34 },
        { stationId: 'CC29', code: 'NE1', number: 6, color: '#9e28b5', dx: 84, dy: 0 },
        { stationId: 'NE18', code: 'NE18', number: 7, color: '#9e28b5', dx: 0, dy: -34 },
        { stationId: 'DT1', code: 'DT1', number: 11, color: '#0055b8', dx: 0, dy: 40 },
        { stationId: 'TE31', code: 'DT37', number: 12, color: '#0055b8', dx: 86, dy: 0 },
        { stationId: 'TE1', code: 'TE1', number: 13, color: '#9d5918', dx: 0, dy: -34 },
        { stationId: 'TE31', code: 'TE31', number: 14, color: '#9d5918', dx: -86, dy: 0 }
    ];
    City.terminalMarkerSvg = function ({ number, color }) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13.7" fill="${color}"/><text x="14" y="14" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Singapore Lato, sans-serif" font-size="16" font-weight="700">${number}</text></svg>`;
    };
    City.renderTerminalMarkers = function () {
        const layer = document.getElementById('stations-layer');
        if (!layer) return;
        layer.querySelectorAll('.sg-terminal-marker').forEach(el => el.remove());
        this.terminalMarkers.forEach(marker => {
            const station = stationsData[marker.stationId];
            const el = document.createElement('div');
            el.className = 'sg-terminal-marker';
            el.dataset.stationId = marker.stationId;
            el.dataset.terminalNumber = marker.number;
            el.style.left = (station.x + marker.dx) + 'px';
            el.style.top = (station.y + marker.dy) + 'px';
            el.setAttribute('role', 'img');
            el.setAttribute('aria-label', `${station.cn}，终点方向编号${marker.number}${station.type === 'no' ? '（施工中）' : ''}`);
            el.innerHTML = this.terminalMarkerSvg(marker);
            layer.appendChild(el);
        });
    };
    // Bow-sided station codes; interchange segments share one continuous silhouette.
    City.renderStationIcon = function (station, { compact = false, idPrefix = 'sg-code-' } = {}) {
        if (station.sentosaExpress) {
            return {
                html: '<img class="sg-sentosa-mark" data-symbol="monorail" data-source="lta-system-map" src="./city/singapore/assets/line/sentosa-express.svg' + (window.CGO_ASSET_VERSION ? '?v=' + window.CGO_ASSET_VERSION : '') + '" alt="" width="36" height="34">',
                width: 36, height: 34, className: 'sg-station-sign sg-sentosa-sign', zIndex: 18
            };
        }
        const codes = (station.stationCodes || station.en || '').split(' / ').filter(code => /^(?:(NS|EW|CG|CC|TE|BP|NE|DT|SE|SW|PE|PW)\d+|STC|PTC|CG)$/.test(code));
        if (!codes.length) return null;
        const palette = { NS: '#e1251b', EW: '#009645', CG: '#009645', CC: '#fa9e0d', TE: '#9d5918', BP: '#718472', NE: '#9e28b5', DT: '#0055b8', SE: '#718472', SW: '#718472', PE: '#718472', PW: '#718472', STC: '#718472', PTC: '#718472' };
        const transfer = codes.length > 1 || station.type === 'tsfo';
        const lightRail = !transfer && /^(BP|SE|SW|PE|PW)/.test(codes[0]);
        const factor = !compact && lightRail ? 0.72 : 1;
        const height = (!compact && transfer ? 32 : 25) * factor;
        const cells = codes.map(code => ((code.match(/\d+$/)?.[0].length || 2) === 1 ? 44 : 51) * (!compact && transfer ? 1.28 : 1) * factor);
        const width = cells.reduce((sum, cell) => sum + cell, 0);
        // Coordinates normalized from the characteristic bowed sides, not rounded rectangles.
        const h = height, w = width, n = v => Number(v.toFixed(2));
        const shape = `M${n(.276*h)} 0 H${n(w-.276*h)}
            C${n(w-.165*h)} 0 ${n(w-.102*h)} ${n(.1075*h)} ${n(w-.0854*h)} ${n(.1402*h)}
            C${n(w-.02875*h)} ${n(.2526*h)} ${w} ${n(.3733*h)} ${w} ${n(.5*h)}
            C${w} ${n(.6267*h)} ${n(w-.02875*h)} ${n(.7474*h)} ${n(w-.0854*h)} ${n(.86*h)}
            C${n(w-.102*h)} ${n(.8925*h)} ${n(w-.165*h)} ${h} ${n(w-.276*h)} ${h}
            H${n(.276*h)} C${n(.165*h)} ${h} ${n(.102*h)} ${n(.8925*h)} ${n(.0854*h)} ${n(.86*h)}
            C${n(.02875*h)} ${n(.7474*h)} 0 ${n(.6267*h)} 0 ${n(.5*h)}
            C0 ${n(.3733*h)} ${n(.02875*h)} ${n(.2526*h)} ${n(.0854*h)} ${n(.1402*h)}
            C${n(.102*h)} ${n(.1075*h)} ${n(.165*h)} 0 ${n(.276*h)} 0 Z`;
        const clipId = idPrefix + codes.join('-');
        let x = 0;
        const plates = codes.map((code, index) => {
            const [, prefix, number = ''] = code.match(/^([A-Z]+)(\d*)$/);
            const cell = cells[index], center = x + cell / 2;
            const ink = prefix === 'CC' ? '#2d2a26' : '#ffffff';
            const separator = code === 'CG' && index > 0 ? `<path d="M${x} 0 V${height}" stroke="#ffffff" stroke-width="1.5"/>` : '';
            const plate = `<rect x="${x}" y="0" width="${cell + 0.1}" height="${height}" fill="${palette[prefix]}"/>
                <text x="${center}" y="${height/2}" dominant-baseline="central" text-anchor="middle" fill="${ink}" font-family="Singapore Lato, sans-serif" font-size="${(!compact && transfer ? 18.5 : 14.5) * factor}" font-weight="700">${prefix}${number ? ' ' + number : ''}</text>${separator}`;
            x += cell;
            return plate;
        }).join('');
        return {
            html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${width+2} ${height+2}" aria-hidden="true"><defs><clipPath id="${clipId}"><path d="${shape}"/></clipPath></defs><g clip-path="url(#${clipId})">${plates}</g><path d="${shape}" fill="none" stroke="#ffffff" stroke-width="1.2"/></svg>`,
            width: width + 2, height: height + 2, color: palette[codes[0].match(/^[A-Z]+/)[0]],
            className: station.type === 'tsfo' ? 'sg-station-sign sg-transfer-sign sg-tap-out-sign' : transfer ? 'sg-station-sign sg-transfer-sign' : 'sg-station-sign', zIndex: transfer ? 22 : 18
        };
    };
    // The generic 'free interchange' wording does not describe Singapore distance fares.
    City.stationBoard = { modules: { transfers: { enabled: false } } };
    City.stationBoard.modules['adjacent-stations'] = {
        shouldRender: ({ lineInfo }) => !linesData.find(line => line.id === lineInfo?.id)?.serviceSelector
    };
    City.stationBoard.modules['header-title'] = {
        slot: 'header', order: 20,
        render({ station }) {
            const escape = window.CGoA11y.escapeHtml;
            return `<div class="header-name-group"><div class="panel-cn-name" role="heading" aria-level="2" tabindex="-1">${escape(station.cn)}</div><div class="panel-en-name" lang="en">${escape(station.en || '')}</div></div>`;
        }
    };
    City.stationBoard.modules['header-badges'] = {
        slot: 'header', order: 30,
        render({ station }) {
            if (station.sentosaExpress) {
                return '<div class="panel-badges sg-line-badges sg-station-badges"><span class="svg-icon-placeholder line-badge sg-sentosa-brand" data-src="./city/singapore/assets/brand/sentosa.svg" title="Sentosa 圣淘沙"></span></div>';
            }
            const escape = window.CGoA11y.escapeHtml;
            // Card signs share the map silhouette, with a single size for all code cells.
            const sign = item => City.renderStationIcon(item, { compact: true, idPrefix: 'sg-card-code-' });
            const peer = station.paidAreaTransfer && stationsData[station.paidAreaTransfer.peerId];
            const items = peer ? [station, peer] : [station];
            const signs = items.map(sign);
            if (signs.some(item => !item)) return '';
            const plates = signs.map((item, index) => {
                // LTA Chinese legend paths 1371/1372: solid two-colour neck with an oblique join.
                const connector = index ? `<svg class="sg-card-transfer-connector" viewBox="0 0 52.186 24.134" aria-hidden="true"><path d="M0 0 H52.186 V24.134 H0 Z" fill="${item.color}"/><path d="M0 0 H30.766 L21.406 24.134 H0 Z" fill="${signs[index - 1].color}"/></svg>` : '';
                return connector + `<span class="sg-card-station-sign" data-codes="${escape(items[index].stationCodes)}" style="--sg-card-sign-ratio:${item.width / item.height}">${item.html}</span>`;
            }).join('');
            const description = items.map(item => item.stationCodes).join('，出闸换乘，');
            return `<div class="panel-badges sg-station-badges${items.length > 1 ? ' sg-card-tap-out' : ''}" role="img" aria-label="${escape(description)}">${plates}</div>`;
        }
    };
    if (typeof document !== 'undefined' && document.write) {
        const v = window.CGO_ASSET_VERSION;
        document.write('<script src="./city/singapore/data_reference_geometry.js' + (v ? '?v=' + v : '') + '"><\/script>');
        document.write('<script src="./city/singapore/data_construction.js' + (v ? '?v=' + v : '') + '"><\/script>');
        document.write('<script src="./city/singapore/modules/construction.js' + (v ? '?v=' + v : '') + '"><\/script>');
        document.write('<script src="./city/singapore/modules/airport-shuttle.js' + (v ? '?v=' + v : '') + '"><\/script>');
        document.write('<script src="./city/singapore/modules/unpaid-transfer.js' + (v ? '?v=' + v : '') + '"><\/script>');
        document.write('<script src="./city/singapore/modules/sentosa-express.js' + (v ? '?v=' + v : '') + '"><\/script>');
        document.write('<script src="./city/singapore/modules/service-patterns.js' + (v ? '?v=' + v : '') + '"><\/script>');
    }
    const stationIdsOf = line => window.CGoLineRouting?.allStationIds(line) || line.stationIds || [];
    City.routeCasingWidths = { mrt: 8.272, lrt: 2.4, monorail: 3 };
    City.renderReferenceGeometry = async function () {
        const layer = document.getElementById('lines-layer');
        if (!layer) return;
        const native = typeof SG_VISIBLE_ROUTE_GEOMETRY === 'undefined' ? {} : SG_VISIBLE_ROUTE_GEOMETRY;
        const ns = 'http://www.w3.org/2000/svg';
        const element = (tag, attributes = {}) => {
            const node = document.createElementNS(ns, tag);
            for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
            return node;
        };
        // Unwrap existing families before rebuilding; retain core hit paths and selection state.
        layer.querySelectorAll('.sg-route-family .line-visual-group').forEach(group => layer.appendChild(group));
        layer.querySelectorAll('.sg-route-family').forEach(group => group.remove());
        const order = ['BP','SE','SW','PE','PW','TE','DT','NE','CCE','CC','EW','CG','NS','SENTOSA'];
        const records = linesData.flatMap(line => {
            if (line.isPointOnly) return [];
            const group = layer.querySelector(`.line-visual-group[data-visual-id="${line.id}"]`);
            if (!group) return [];
            const sentosa = line.id === 'SENTOSA';
            const edge = City.routeCasingWidths[sentosa ? 'monorail' : City.TRAM_LINES.includes(line.id) ? 'lrt' : 'mrt'];
            const colour = sentosa ? 'var(--sg-sentosa-track)' : line.color;
            // Every rendered route gets a casing, including future routes without baked geometry.
            const shapes = native[line.id] ? [{ d: native[line.id], fill: colour }] :
                [...group.querySelectorAll('.line-visual-inner')].map(path => ({
                    d: path.getAttribute('d'), fill: 'none', stroke: colour,
                    'stroke-width': Number.parseFloat(getComputedStyle(path).strokeWidth),
                    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
                })).filter(path => path.d);
            if (!shapes.length) return [];
            group.querySelectorAll('.sg-reference-geometry, .sg-route-casing').forEach(node => node.remove());
            group.classList.add('sg-official-geometry');
            const casing = element('g', { class: 'sg-route-casing', 'data-route-id': line.id });
            const ink = element('g', { class: 'sg-reference-geometry', 'data-source': sentosa ? 'community-sentosa' : 'lta-chinese' });
            for (const shape of shapes) {
                casing.appendChild(element('path', { ...shape,
                    fill: shape.fill === 'none' ? 'none' : 'var(--map-bg)', stroke: 'var(--map-bg)',
                    'stroke-width': (shape['stroke-width'] || 0) + edge,
                    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
                }));
                ink.appendChild(element('path', shape));
            }
            group.appendChild(ink);
            return [{ line, group, casing, rank: order.includes(line.id) ? order.indexOf(line.id) : order.length }];
        });
        // Same-colour routes sharing a station form a paint family. Their casings must never
        // sit between their coloured paths: a branch junction belongs to one continuous service.
        const parent = records.map((_, index) => index);
        const root = index => parent[index] === index ? index : (parent[index] = root(parent[index]));
        records.forEach((a, i) => records.slice(i + 1).forEach((b, offset) => {
            if (a.line.color.toLowerCase() === b.line.color.toLowerCase() &&
                stationIdsOf(a.line).some(id => stationIdsOf(b.line).includes(id))) parent[root(i + offset + 1)] = root(i);
        }));
        const families = new Map();
        records.forEach((record, index) => {
            const key = root(index);
            if (!families.has(key)) families.set(key, []);
            families.get(key).push(record);
        });
        const connectors = layer.querySelector('.virtual-connectors');
        [...families.values()].sort((a, b) => Math.max(...a.map(r => r.rank)) - Math.max(...b.map(r => r.rank))).forEach(members => {
            members.sort((a, b) => a.rank - b.rank);
            const family = element('g', { class: 'sg-route-family', 'data-route-ids': members.map(r => r.line.id).join(' ') });
            const casings = element('g', { class: 'sg-family-casings' });
            const ink = element('g', { class: 'sg-family-ink' });
            members.forEach(record => { casings.appendChild(record.casing); ink.appendChild(record.group); });
            family.append(casings, ink);
            layer.insertBefore(family, connectors);
        });
    };
    City.renderConstruction = function () {
        const layer = document.getElementById('not-open-layer');
        if (!layer || typeof SG_CONSTRUCTION_ANNOTATION === 'undefined') return;
        layer.querySelectorAll('.sg-construction-casing').forEach(el => el.remove());
        const tracks = layer.querySelectorAll(':scope > path');
        NOT_OPEN_LINES.forEach((track, index) => {
            const path = tracks[index];
            if (!path) return;
            if (track.svgPath) path.setAttribute('d', track.svgPath);
            path.dataset.trackId = track.id;
            const casing = path.cloneNode(false);
            casing.setAttribute('class', 'sg-construction-casing');
            casing.setAttribute('stroke', 'var(--map-bg)');
            casing.setAttribute('stroke-width', Number(track.style.width) + City.routeCasingWidths.mrt);
            layer.insertBefore(casing, path);
        });
        layer.querySelector('.sg-construction-annotation')?.remove();
        const ns = 'http://www.w3.org/2000/svg';
        const group = document.createElementNS(ns, 'g');
        group.setAttribute('class', 'sg-construction-annotation');
        group.setAttribute('role', 'img');
        group.setAttribute('aria-label', 'Under Construction: TEL5 / DTL3e，施工中，尚未开放乘车');
        for (const { tag, text, ...attributes } of SG_CONSTRUCTION_ANNOTATION) {
            const element = document.createElementNS(ns, tag);
            for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
            if (text) element.textContent = text;
            group.appendChild(element);
        }
        layer.appendChild(group);
    };
    City.renderTapOutBridges = function () {
        const layer = document.querySelector('#lines-layer .virtual-connectors');
        if (!layer || typeof VIRTUAL_FREE_CONNECT_LINES === 'undefined') return;
        layer.querySelectorAll('.sg-tap-out-bridge').forEach(element => element.remove());
        const svgNS = 'http://www.w3.org/2000/svg';
        for (const { from, to } of VIRTUAL_FREE_CONNECT_LINES) {
            const a = stationsData[from], b = stationsData[to];
            if (!a?.paidAreaTransfer || !b?.paidAreaTransfer) continue;
            const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
            const height = 10.5, midpoint = length / 2, bevel = 2.2;
            const group = document.createElementNS(svgNS, 'g');
            group.setAttribute('class', 'sg-tap-out-bridge');
            group.dataset.from = from;
            group.dataset.to = to;
            group.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})`);
            const shapes = [
                [`0,${-height/2} ${midpoint+bevel},${-height/2} ${midpoint-bevel},${height/2} 0,${height/2}`, from],
                [`${midpoint+bevel},${-height/2} ${length},${-height/2} ${length},${height/2} ${midpoint-bevel},${height/2}`, to]
            ];
            for (const [points, id] of shapes) {
                const polygon = document.createElementNS(svgNS, 'polygon');
                polygon.setAttribute('points', points);
                polygon.setAttribute('fill', linesData.find(line => stationIdsOf(line).includes(id)).color);
                polygon.setAttribute('stroke', 'none');
                group.appendChild(polygon);
            }
            layer.appendChild(group);
        }
    };
    City.minScale = 0.1;
    City.isTramLine = function (id) { return this.TRAM_LINES.includes(id); };
    City.isTramStation = function (s) { return Boolean(s?.relatedLines?.some(id => this.isTramLine(id))); };
    City.formatOwnerName = raw => raw || 'SMRT / 新捷运';
    City.formatCompanyString = list => [...new Set(list)].join(' / ');
    City.getNavigationUrl = (name, rail, { station } = {}) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((station?.en || name) + (station?.sentosaExpress ? ' Sentosa Express station Singapore' : ' MRT station Singapore'));
    document.addEventListener('DOMContentLoaded', async () => {
        await City.renderReferenceGeometry();
        City.renderTapOutBridges();
        City.renderConstruction();
        City.renderTerminalMarkers();
        const mobile = innerWidth < 600;
        const scale = mobile ? 0.65 : Math.max(0.1, Math.min((innerWidth - 100) / 3400, (innerHeight - 130) / 2450, 0.7));
        window.setMapView?.({ scale, x: innerWidth / 2 - (mobile ? 1750 : 1680) * scale, y: innerHeight / 2 - (mobile ? 1500 : 1250) * scale });
    }, { once: true });
    window.CURRENT_CITY = City;
    window.SINGAPORE_CITY = City;
})();
