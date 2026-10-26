/**
 * CGo OpenMap - 兰州轨道交通图例结构与分组配置 (city/lanzhou/data_legend.js)
 */


const LEGEND_CONFIG = [
    {
        type: 'title',
        title: '轨道交通',
        subtitle: 'Rail Transit'
    },
    {
        type: 'grid',
        cols: 2,
        items: [
            { targets: ['M1'], name: '1号线' },
            { targets: ['M2'], name: '2号线' },
            { targets: ['M3'], name: '3号线' },
            { targets: ['M4'], name: '4号线' },
            { targets: ['M5'], name: '5号线' },
            { targets: ['M7'], name: '7号线' },
            { targets: ['M8'], name: '8号线' }
        ]
    },
    {
        type: 'title',
        title: '城际',
        subtitle: 'Intercity'
    },
    {
        type: 'grid',
        cols: 2,
        items: [
            { targets: ['S1'], name: '中川城际' }
        ]
    }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;