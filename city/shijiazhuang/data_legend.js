/**
 * CGo OpenMap - 图例结构与分组配置 (city/shijiazhuang/data_legend.js)
 * 
 * ==============================================================================
 */


const LEGEND_CONFIG = [
    { type: 'title', title: '城市轨道交通', subtitle: 'Urban Rail Transit' },
    {
        type: 'grid', cols: 2,
        items: [
            { targets: ['M1'], name: '1号线' },
            { targets: ['M2'], name: '2号线' },
            { targets: ['M3'], name: '3号线' }
        ]
    },
    // { type: 'title', title: '铁路连接', subtitle: 'Intercity Rail', marginTop: 20 },
    // {
    //     type: 'grid', cols: 2,
    //     items: [
    //         { targets: ['RC_JINGGUANG'],     name: '京广铁路' },
    //         { targets: ['RC_JINGGUANG_HSR'], name: '京广高速铁路' },
    //         { targets: ['RC_SHIJI_HSR'],     name: '石济高速铁路' }
    //     ]
    // },
];

window.LEGEND_CONFIG = LEGEND_CONFIG;