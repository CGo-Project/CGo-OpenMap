/**
 * CGo OpenMap - 胡志明市都市铁路 图例配置 (city/saigon/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '胡志明市都市铁路', subtitle: 'Ho Chi Minh City Metro', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['SAIGON-1'], name: '1号线' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
