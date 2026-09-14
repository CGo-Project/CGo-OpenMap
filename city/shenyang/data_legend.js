/** CGo OpenMap - 沈阳图例配置 (city/shenyang/data_legend.js) */
const LEGEND_CONFIG = [
    {
        type: 'title',
        title: '地铁线路',
        subtitle: 'Metro Lines'
    },
    {
        type: 'grid',
        cols: 2,
        items: [
            { targets: ['SYM01'], name: '1号线' },
            { targets: ['SYM02'], name: '2号线' },
            { targets: ['SYM03'], name: '3号线' },
            { targets: ['SYM04'], name: '4号线' },
            //{ targets: ['SYM06'], name: '6号线' },
            { targets: ['SYM09'], name: '9号线' },
            { targets: ['SYM10'], name: '10号线' },
        ]
    },
    {
        type: 'title',
        title: '有轨线路',
        subtitle: 'Tramway Lines'
    },
    {
        type: 'grid',
        cols: 2,
        items: [
            { targets: ['HNT5'], name: '5号线' },
        ]
    },
];

if (typeof window !== "undefined") {
    window.LEGEND_CONFIG = LEGEND_CONFIG;
    window.LEGEND_SECTIONS = LEGEND_CONFIG;
    if (window.SHENYANG_CITY) window.SHENYANG_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LEGEND_CONFIG = LEGEND_CONFIG;
}
