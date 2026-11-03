/**
 * CGo OpenMap - 地图背景装饰物与示意图素材配置 (city/fuzhou/data_scattered.js)
 *
 * 水域已合并导出为 assets/fuzhou_sea.svg（亮/暗填充写在 SVG 内），随画布同比缩放。
 * 国铁 / 机场徽标放在水域层（zIndex 2），坐标 = 站心向站名反侧偏移 32px，
 * 图标尺寸不随排版缩放，故 scripts/rescale-city.js 不处理这些坐标、不能直接乘倍数。
 */

const SCATTERED_DATA = [
    {
        id: "fuzhou-sea",
        file: "./city/fuzhou/assets/fuzhou_sea.svg",
        x: 1062.5,
        y: 680,
        width: 2125,
        height: 1360,
        opacity: 0.5,
        zIndex: 1
    },
    /* 国铁福州站：站心 (811.8,212.5)（锁紧 0.85 后），站名朝左 → 徽标放右侧。
       本站 1 号线(x=807.5) 与滨海快线(x=825.4) 平行，徽标夹在两者右侧，
       故位置由**滨海快线**的净空决定：取中心 27px，盒边距滨海快线 5px、距 1 号线 16px。 */
    {
        id: "fuzhou-railway-main",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 833.8,
        y: 212.5,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    },
    /* 国铁福州南站：站心 (1177.3,977.5)，站名朝上 → 徽标放下侧 (1177.3, 977.5+32) */
    {
        id: "fuzhou-railway-south",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 1177.3,
        y: 1009.5,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    },
    /* 福州长乐国际机场（机场 BE02，站心 1887,1113.5）：站名 align:right → 徽标放左侧。
       中心 22px，盒边距滨海快线（x=1887 竖直段）11px。 */
    {
        id: "fuzhou-airport",
        file: "./city/fuzhou/assets/fuzhou_airport.svg",
        x: 1865,
        y: 1113.5,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    },
    /* 长乐站（福平铁路）：无地铁站节点，按其最近车站 首占(BE06，站心 1507.9,1211.3) 贴放。
       站名 align:top → 徽标放下侧，中心 22px，盒边距滨海快线（y=1211.3 水平段）11px。 */
    {
        id: "fuzhou-railway-changle",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 1507.9,
        y: 1233.3,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    }
];
