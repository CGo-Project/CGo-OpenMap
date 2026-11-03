/**
 * CGo OpenMap - 川西轨道交通 图例配置 (city/chuanxi/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '川西轨道交通', subtitle: 'Western Sichuan Rail', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['CX-MTR-G', 'CX-MTR-T', 'CX-MTR-B'], name: 'M-TR专线' },
        { targets: ['CX-DUSI'], name: '都四山地轨道' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
