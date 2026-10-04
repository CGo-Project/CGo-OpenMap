/**
 * CGo OpenMap - 呼和浩特图例配置 (city/hohhot/data_legend.js)
 *
 * 每个 grid 项通过 targets 关联线路 ID，点击图例项即可高亮对应线路。
 * 本城仅运营 1、2 号线两条线路，暂不分组。
 */

const LEGEND_CONFIG = [
    {
        type: "title",
        title: "城市轨道交通",
        subtitle: "Urban Rail Transit"
    },
    {
        type: "grid",
        cols: 2,
        items: [
            { targets: ["M1"], name: "1号线" },
            { targets: ["M2"], name: "2号线" }
        ]
    }
];
