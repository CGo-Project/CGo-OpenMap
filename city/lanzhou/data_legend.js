/**
 * CGo OpenMap - 图例结构与分组配置 (city/beijing/data_legend.js)
 * 
 * ==============================================================================
 * 图例数据结构规范 (Legend Schema Specifications)
 * ==============================================================================
 * `LEGEND_CONFIG` 是一个数组，每个元素表示一个图例分组节点或网格容器：
 * 
 * 1. 分组标题节点 (Section Title Node):
 *    {
 *        type: 'title',             // 类型固定为 'title'
 *        title: '城市轨道交通',       // 中文主标题
 *        subtitle: 'Urban Rail Transit', // 英文副标题
 *        marginTop: 20              // (可选) 距离上方的外边距 (px)
 *    }
 * 
 * 2. 线路网格容器节点 (Grid Container Node):
 *    {
 *        type: 'grid',              // 类型固定为 'grid'
 *        cols: 2,                   // 列数 (推荐 2 列或 3 列)
 *        items: [                   // 网格内的线路单元项列表
 *            { 
 *                targets: ['M1', 'M1E'], // 关联的线路 ID 数组 (点击图例项将高亮 targets 内所有线路)
 *                name: '1号线 / 八通线'   // 图例显示的线路名称
 *            },
 *            { targets: ['M2'], name: '2号线' }
 *        ]
 *    }
 * 
 * ️ 移植指南 (Porting Guide):
 * 为新城市制作图例时，只需按运营分类（如市区地铁、市域铁路、有轨电车、磁浮等）组织标题与 grid，
 * 并确保 targets 里的线路 ID 在该城市的 `data_lines.js` 中存在。
 * ==============================================================================
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