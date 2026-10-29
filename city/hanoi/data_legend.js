/**
 * CGo OpenMap - 河内都市铁路 图例配置 (city/hanoi/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '河内都市铁路', subtitle: 'Hanoi Urban Railway', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['HN-2A'], name: 'Tuyến 2A' },
        { targets: ['HN-3'], name: 'Tuyến 3' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
