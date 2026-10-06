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
        title: '城市轨道交通',
        subtitle: 'Urban Rail Transit'
    },
    {
        type: 'grid',
        cols: 2,
        items: [
            { targets: ['M1', 'M1E'], name: '1号线 / 八通线' },
            { targets: ['M2'], name: '2号线' },
            { targets: ['M3'], name: '3号线' },
            { targets: ['M4', 'M4S'], name: '4号线 / 大兴线' },
            { targets: ['M5'], name: '5号线' },
            { targets: ['M6'], name: '6号线' },
            { targets: ['M7'], name: '7号线' },
            { targets: ['M8'], name: '8号线' },
            { targets: ['M9'], name: '9号线' },
            { targets: ['M10'], name: '10号线' },
            { targets: ['M11'], name: '11号线' },
            { targets: ['M12'], name: '12号线' },
            { targets: ['M13'], name: '13号线' },
            { targets: ['M14'], name: '14号线' },
            { targets: ['M15'], name: '15号线' },
            { targets: ['M16'], name: '16号线' },
            { targets: ['M17'], name: '17号线' },
            { targets: ['M18'], name: '18号线' },
            { targets: ['M19'], name: '19号线' },
            { targets: ['M22'], name: '22号线' },
            { targets: ['M24'], name: '昌平线' },
            { targets: ['M25'], name: '亦庄线' },
            { targets: ['M25W'], name: '房山线' },
            { targets: ['M26'], name: '燕房线' },
            { targets: ['M27'], name: 'S1线' },
            { targets: ['XJ'], name: '西郊线' },
            { targets: ['T1'], name: '亦庄T1线' },
            { targets: ['CAE'], name: '首都机场线' },
            { targets: ['DAE'], name: '大兴机场线' },
            { targets: ['JX'], name: '京雄快线' },
        ]
    },
    {
        type: 'title',
        title: '市郊铁路',
        subtitle: 'Suburban Railway',
        marginTop: 20
    },
    {
        type: 'grid',
        cols: 2,
        items: [
            { targets: ['S1'], name: '城市副中心线' },
            { targets: ['S2'], name: 'S2线' },
            { targets: ['S5'], name: '怀柔-密云线' },
            { targets: ['S6'], name: '通密线' },
        ]
    }
];

window.LEGEND_CONFIG = LEGEND_CONFIG;