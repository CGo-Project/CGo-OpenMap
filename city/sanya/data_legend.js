/**
 * CGo OpenMap - 三亚 图例 (city/sanya/data_legend.js)
 */
const LEGEND_CONFIG = [
    { type: 'title', title: '城市轨道交通', subtitle: 'Urban Rail Transit', marginTop: 8 },
    { type: 'grid', cols: 2, items: [ { targets: ['SY-T1'], name: '有轨电车 1 号线' } ] },
    { type: 'title', title: '铁路', subtitle: 'Railway', marginTop: 16 },
    { type: 'grid', cols: 2, items: [ { targets: ['SY-SL'], name: '三乐旅游铁路' } ] }
];
window.LEGEND_CONFIG = LEGEND_CONFIG;
