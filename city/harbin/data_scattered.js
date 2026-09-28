/**
 * CGo OpenMap - 哈尔滨示意图装饰物配置 (city/harbin/data_scattered.js)
 *
 * 水域底图：松花江河道。SVG 画布尺寸与本市地图一致（1290×1590），
 * 河道由西南向东北斜贯、两端渐隐，颜色为 #40B5FF 线性渐变。
 *
 * 坐标口径：散点元素的 (x, y) 是元素**中心**（`.scattered-item` 自带
 * translate(-50%, -50%)），因此取画布中心 (mapSize.width / 2, mapSize.height / 2)
 * 即可让整张水域与画布严丝合缝。
 */
const SCATTERED_DATA = [
    {
        id: "harbin-songhuajiang",
        file: "./city/harbin/assets/songhuajiang.svg",
        x: 645,           // 1290 / 2
        y: 795,           // 1590 / 2
        width: 1290,
        height: 1590,
        opacity: 1,
        zIndex: 1
    }
];
