const LEGEND_CONFIG = [
    { type: 'title', title: '평양 도시철도', subtitle: 'Pyongyang Urban Rail', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['PY-CL'], name: '천리마선（千里马线）' },
        { targets: ['PY-HK'], name: '혁신선（革新线）' },
        { targets: ['PY-T1'], name: '1호선（有轨电车 1 号线）' },
        { targets: ['PY-T2'], name: '2호선（有轨电车 2 号线）' },
        { targets: ['PY-T3'], name: '3호선（有轨电车 3 号线）' },
        { targets: ['PY-KS'], name: '금수산선（锦绣山线）' },
    ] }
];
window.LEGEND_CONFIG = LEGEND_CONFIG;
