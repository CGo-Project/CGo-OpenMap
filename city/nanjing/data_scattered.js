/**
 * CGo OpenMap - 南京示意图装饰物 (city/nanjing/data_scattered.js)
 *
 * ① 水域底图：由南京地铁 .ai 原稿解析出的河流/水域轮廓（原稿中的 #c7e2f7 填充面），
 *    合并为一份 assets/nanjing_sea.svg，作为底层地理底图注入（亮/暗两套填充色写在 SVG 内部）。
 *    字段：id、file、x、y（素材中心点，核心以 translate(-50%,-50%) 居中定位）、width、height、opacity、zIndex。
 *    按项目惯例：x/y 取画布中心、width/height 取画布尺寸、zIndex 1
 *    （与 city/fuzhou、city/qingdao、city/dalian 的水域底图一致）。
 *
 * ② 国铁 Logo：与站名分列站点两侧，坐标为图标中心（引擎 translate(-50%,-50%)）。
 *    偏移量取值：Logo 半宽 10.5px + tsf 圆点半径 8.75px + 间隙 ≈ 26px，
 *    避免像 16px 那样压住换乘站的大圆点。（参照 city/hefei/data_scattered.js 写法）
 */

const SCATTERED_DATA = [
    {
        id: "nanjing-sea",
        file: "./city/nanjing/assets/nanjing_sea.svg",
        x: 1400,
        y: 1950,
        width: 2800,
        height: 3900,
        opacity: 1,
        zIndex: 1
    },
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
