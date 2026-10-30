/**
 * CGo OpenMap - 鹽城SRT 图例配置 (city/yancheng/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '鹽城SRT', subtitle: 'Yancheng SRT', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['YC-SRT1'], name: 'SRT 1号线' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
