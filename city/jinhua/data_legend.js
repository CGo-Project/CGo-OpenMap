/**
 * CGo OpenMap - 金华轨道交通 图例配置 (city/jinhua/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '金华轨道交通', subtitle: 'Jinhua Rail Transit', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['JH-M1'], name: '金义东线' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
