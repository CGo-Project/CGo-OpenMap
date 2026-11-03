/**
 * CGo OpenMap - 南京示意图装饰物 (city/nanjing/data_scattered.js)
 *
 * 国铁 Logo：与站名分列站点两侧，坐标为图标中心（引擎 translate(-50%,-50%)）。
 * 偏移量取值：Logo 半宽 10.5px + tsf 圆点半径 8.75px + 间隙 ≈ 26px，
 * 避免像 16px 那样压住换乘站的大圆点。（参照 city/hefei/data_scattered.js 写法）
 *
 * 注：原先还注入了一份由 .ai 原稿解析出的水域底图（长江 / 秦淮河 / 江心洲），
 *     现已按要求移除，本图不再绘制任何河流水域。
 */

const SCATTERED_DATA = [
    {
        id: "railway-NJZ",
        file: "./city/nanjing/assets/railway.svg",
        x: 1205.4,
        y: 1316,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-NJNZ",
        file: "./city/nanjing/assets/railway.svg",
        // 南京南站：置于站名右上方空位（原为站点左侧，压住了 3号线 与 S1 斜线）
        x: 1347,
        y: 2224,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-JR",
        file: "./city/nanjing/assets/railway.svg",
        // 句容（S6 终点）：南沿江高铁句容站换乘（实测两站相距 239m）。
        // 站名在右，标志取左侧 20px（dot 半径 5 + 标志半宽 10.5 + 间隙）。
        x: 2644.3,
        y: 2057.8,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    }
];
