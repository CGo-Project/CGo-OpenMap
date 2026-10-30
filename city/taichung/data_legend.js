/**
 * CGo OpenMap - 台中捷運 图例配置 (city/taichung/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '台中捷運', subtitle: 'Taichung Metro', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['TC-G'], name: '綠線' },
        { targets: ['TC-B'], name: '捷運藍線' },
        { targets: ['TC-R'], name: '台鐵紅線' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
