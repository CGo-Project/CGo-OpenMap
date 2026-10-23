/**
 * CGo OpenMap - 地图背景装饰物与示意图素材配置 (city/beijing/data_scattered.js)
 * 
 * ==============================================================================
 * 装饰物数据结构规范 (Scattered Elements Schema)
 * ==============================================================================
 * 作用：在地图底图上渲染指南针、历史城门、水系河流、文化地标等静态 SVG 矢量装饰物。
 * 
 * 字段说明：
 * - id {string} 装饰物唯一标识 (如 "compass", "gate", "river")
 * - file {string} 装饰物 SVG/PNG 文件的相对或绝对路径
 * - x {number} 在地图画布上的 X 轴中心/锚点像素坐标
 * - y {number} 在地图画布上的 Y 轴中心/锚点像素坐标
 * - width {number} (可选) 渲染宽度 (px)，不填则保持素材原始宽高
 * - height {number} (可选) 渲染高度 (px)
 * - opacity {number} (可选) 不透明度 (0.0 ~ 1.0，默认 1.0)
 * - zIndex {number} (可选) 图层层级：
 *     - 0 ~ 4: 处于线路与车站下方 (作为地理/背景底图)
 *     - 5 ~ 14: 处于线路中间
 *     - 15+: 处于线路与车站上方
 * - rotation {number} (可选) 顺时针旋转角度 (度数，如 45)
 * 
 * ️ 移植指南 (Porting Guide):
 * 为其他城市配置时，可将城市特色的地标矢量图标放入 `city/{city_id}/assets/` 并在此注册。
 * 若不需要任何装饰物，置为空数组 `const SCATTERED_DATA = [];` 即可。
 * ==============================================================================
 */

// 示意图装饰物数据列表
const SCATTERED_DATA = [
    {
        id: "compass",
        file: "./city/beijing/assets/compass.svg",
        x: 171.8663330078125,
        y: 93.97570037841797,
        width: 100,
        height: 100,
        opacity: 1,
        zIndex: 5
    },
    {
        id: "gate",
        file: "./city/beijing/assets/gate.svg",
        x: 866.2892600657855,
        y: 689.4351551123722,
        width: 63,
        height: 63,
        opacity: 1,
        zIndex: 5
    },
];