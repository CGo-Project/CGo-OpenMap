/**
 * CGo OpenMap - 长春示意图装饰物配置 (city/changchun/data_scattered.js)
 *
 * 龙嘉机场徽标：9 号线龙嘉机场T3 旁的飞机装饰（非车站记录，不参与检索/线网）。
 * 着色走遮罩法（changchun.js 尾部注入样式）：底板吃 --text-color、飞机镂空露地图底色，
 * 亮暗主题自动跟随；位置对齐手调版：龙嘉站徽标再往左（2280,720）。
 */
const SCATTERED_DATA = [
    {
        id: "airport",
        file: "./city/changchun/assets/airport.svg",
        x: 2280,
        y: 720,
        width: 20,
        height: 20,
        opacity: 1,
        zIndex: 15
    }
];
