/**
 * CGo OpenMap - 宜宾智轨 图例配置 (city/yibin/data_legend.js)
 */

const LEGEND_CONFIG = [
    { type: 'title', title: '宜宾智轨', subtitle: 'Yibin ART', marginTop: 8 },
    { type: 'grid', cols: 2, items: [
        { targets: ['YB-T1'], name: 'T1线（牌坊路）' },
        { targets: ['YB-T1B'], name: 'T1线（成都工业学院）' },
        { targets: ['YB-T1C'], name: 'T1线（高铁宜宾）' },
        { targets: ['YB-T2B'], name: 'T2线' },
        { targets: ['YB-T2'], name: 'T2线支线' },
        { targets: ['YB-T4'], name: 'T4线（南溪经开区）' },
        { targets: ['YB-T4B'], name: 'T4线（文体中心）' },
    ] }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;
