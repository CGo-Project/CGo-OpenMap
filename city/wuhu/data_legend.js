/**
 * CGo OpenMap - 芜湖轨道交通 图例配置 (city/wuhu/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '芜湖轨道交通', subtitle: 'Wuhu Rail Transit', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['WH-1'], name: '1号线' },
        { targets: ['WH-2'], name: '2号线' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
