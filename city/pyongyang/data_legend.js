/**
 * CGo OpenMap - 평양 도시철도 图例配置 (city/pyongyang/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '평양 도시철도', subtitle: 'Pyongyang Urban Rail', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['PY-T1'], name: '1호선' },
        { targets: ['PY-T2'], name: '2호선' },
        { targets: ['PY-T3'], name: '3호선' },
        { targets: ['PY-KS'], name: '금수산선' },
        { targets: ['PY-CL'], name: '천리마선' },
        { targets: ['PY-HK'], name: '혁신선' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
