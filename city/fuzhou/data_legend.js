/**
 * CGo OpenMap - 图例结构与分组配置 (city/fuzhou/data_legend.js)
 *
 * 每个 grid 项通过 targets 关联线路 ID，点击图例项即可高亮对应线路。
 *
 * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（2026-09-16）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
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
            { targets: ["M3"], name: "4号线" },
            { targets: ["M4"], name: "5号线" },
            { targets: ["M5"], name: "6号线" },
            { targets: ["M6"], name: "滨海快线" }
        ]
    }
];
