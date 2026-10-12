/** CGo OpenMap - 大连示意图装饰物配置 */
const SCATTERED_DATA = [
    {
        // 海域底图：铺满画布（尺寸与 city.mapSize 一致），锚点是元素中心，故取画布中心；
        // 原图直出、不做主题染色 —— SVG 自带「极淡浅蓝填充 + 蓝色内阴影海岸线」，
        // 亮暗两种底色上都成立。曾试过内联后用 CSS 变量改填充，暗色下要么淡到看不见、
        // 要么铺实后与背景几乎同色且丢掉海岸线，反而更差，故弃用（详见提交说明）。
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
