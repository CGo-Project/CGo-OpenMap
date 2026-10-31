/**
 * CGo OpenMap - 图例结构与分组配置 (city/fuzhou/data_legend.js)
 */

const LEGEND_CONFIG = [
    {
        type: 'title',
        title: '城市轨道交通',
        subtitle: 'Urban Rail Transit'
    },
    {
        type: 'grid',
        cols: 2,
        items: [
            { targets: ["M1"], name: "1号线" },
            { targets: ["M2"], name: "2号线" },
            { targets: ["M4"], name: "4号线" },
            { targets: ["M5"], name: "5号线" },
            { targets: ["M6"], name: "6号线" },
            { targets: ["BE"], name: "滨海快线" }
        ]
    }
];
