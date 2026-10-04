/**
 * CGo OpenMap - 地图背景装饰物与示意图素材配置 (city/fuzhou/data_scattered.js)
 *
 * 编辑器中的水域已合并导出为 assets/fuzhou_sea.svg，作为底层地理底图注入（亮/暗两套填充色写在 SVG 内部）。
 * 字段：id、file、x、y（素材中心点，核心以 translate(-50%,-50%) 居中定位）、width、height、opacity、zIndex。
 * 水域底图建议 x/y 取画布中心、width/height 取画布尺寸、zIndex 1，与 city/qingdao、city/dalian 一致。
 *
 * 本文件由 CGo OpenMap 线路图在线编辑器自动生成（2026-09-16）。
 * 坐标系：原点位于画布左上角顶点，X 轴向右为正，Y 轴向下为正，与核心渲染引擎完全一致。
 *
 * 2026-10 增补：国铁车站与机场的枢纽徽标。
 *   · 素材为官方线路图图例中的图标（主理人提供 SVG）：底色 #002E64、白色前景、圆角方块。
 *   · 放在**水域层**：它们是交通枢纽的地理注记，不属于站点图元、也不是站名的一部分；
 *     水域层在站名与站点之下、线网之上，不必碰站名排版，也不会与站名重叠。
 *   · zIndex 取 2 —— 高于水域底图（1），低于线网与站点/站名（核心图层自带更高层序）。
 *   · 坐标 = 站心沿「站名反侧」偏移 (图标边长/2 + 间隔) = 30/2 + 17 = 32px，
 *     即放在站名对面，避免压住站名与站点图元。若日后调整站名 align，此处需同步。
 */

const SCATTERED_DATA = [
    {
        id: "fuzhou-sea",
        file: "./city/fuzhou/assets/fuzhou_sea.svg",
        x: 1250,
        y: 800,
        width: 2500,
        height: 1600,
        opacity: 0.5,
        zIndex: 1
    },
    /* 国铁福州站：站心 (955,250)，站名朝左 → 徽标放右侧 (955+32, 250) */
    {
        id: "fuzhou-railway-main",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 987,
        y: 250,
        width: 30,
        height: 30,
        opacity: 1,
        zIndex: 2
    },
    /* 国铁福州南站：站心 (1385,1150)，站名朝上 → 徽标放下侧 (1385, 1150+32) */
    {
        id: "fuzhou-railway-south",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 1385,
        y: 1182,
        width: 30,
        height: 30,
        opacity: 1,
        zIndex: 2
    },
    /* 福州长乐国际机场：站心 (2310,1325)，站名朝右 → 徽标放左侧 (2310-32, 1325) */
    {
        id: "fuzhou-airport",
        file: "./city/fuzhou/assets/fuzhou_airport.svg",
        x: 2278,
        y: 1325,
        width: 30,
        height: 30,
        opacity: 1,
        zIndex: 2
    }
];
