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
 *   · 坐标 = 站心沿「站名反侧」偏移 (图标边长/2 + 间隔) = 22/2 + 21 = 32px，
 *     即放在站名对面，避免压住站名与站点图元。若日后调整站名 align 或图标尺寸，此处需同步。
 *
 * ⚠️ 水域底图的 width/height 应覆盖整张画布（city/data.js 的 mapSize）：
 *    当前画布 2200×1800，而下方水域仍为 2500×1600（源 SVG 的 viewBox 原尺寸），
 *    纵向只覆盖 0~1600，**底部 200px 没有水域底衬**，而长乐/滨海片区 8 座车站
 *    （下吴 / 壶井 / 万寿 / 祥谦 / 首占 / 滨海西 / 大数据 / 滨海中央商务区）
 *    正落在 y=1610~1695。画布调高后需把水域 height 一并调到 ≥1800。
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
    /* 国铁福州站：站心 (955,250)，站名朝左 → 徽标放右侧。
       本站 1 号线(x=950) 与滨海快线(x=971) 平行，徽标夹在两者右侧，
       故位置由**滨海快线**的净空决定：取中心 27px，盒边距滨海快线 5px、距 1 号线 16px。 */
    {
        id: "fuzhou-railway-main",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 977,
        y: 250,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    },
    /* 国铁福州南站：站心 (1385,1150)，站名朝上 → 徽标放下侧 (1385, 1150+32) */
    {
        id: "fuzhou-railway-south",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 1385,
        y: 1182,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    },
    /* 福州长乐国际机场（机场 BE02，站心 2130,1595）：站名朝右 → 徽标放左侧。
       往线路拉近到中心 22px，盒边距滨海快线 11px。 */
    {
        id: "fuzhou-airport",
        file: "./city/fuzhou/assets/fuzhou_airport.svg",
        x: 2108,
        y: 1595,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    },
    /* 长乐站（福平铁路）：无地铁站节点，按其最近车站 首占(BE06，站心 1450,1695) 贴放。
       站名朝上 → 徽标放下侧，往线路拉近到中心 22px，盒边距滨海快线 11px。 */
    {
        id: "fuzhou-railway-changle",
        file: "./city/fuzhou/assets/fuzhou_railway.svg",
        x: 1450,
        y: 1717,
        width: 22,
        height: 22,
        opacity: 1,
        zIndex: 2
    }
];
