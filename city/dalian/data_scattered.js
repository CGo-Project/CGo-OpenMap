/** CGo OpenMap - 大连示意图装饰物配置 */
const SCATTERED_DATA = [
    {
        // 海域底图：铺满画布（尺寸与 city.mapSize 一致），锚点是元素中心，故取画布中心；
        // 主题适配见 modules/dalian_sea.js
        id: "dalian-sea",
        file: "./city/dalian/assets/dalian_sea.svg",
        x: 1100,
        y: 700,
        width: 2200,
        height: 1400,
        opacity: 1,
        zIndex: 1
    },
    {
        id: "compass",
        file: "./city/dalian/assets/compass.svg",
        x: 1600,
        y: 100,
        width: 60,
        height: 60,
        opacity: 1,
        zIndex: 4
    },
];
