/**
 * CGo OpenMap - 合肥示意图装饰物 (city/hefei/data_scattered.js)
 *
 * 国铁 Logo：与站名分列站点两侧。坐标为图标中心（引擎 translate(-50%,-50%)）。
 * 站点右侧重置：x += 16；左侧：x -= 16。
 */

const SCATTERED_DATA = [
    {
        id: "compass",
        file: "./city/beijing/assets/compass.svg",
        x: 1960,
        y: 80,
        width: 100,
        height: 100,
        opacity: 1,
        zIndex: 5
    },
    {
        id: "railway-HF",
        file: "./city/hefei/assets/railway.svg",
        x: 1412,
        y: 1194,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-HFX",
        file: "./city/hefei/assets/railway.svg",
        x: 952,
        y: 1192,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-HFN",
        file: "./city/hefei/assets/railway.svg",
        x: 1291,
        y: 1648,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-FD",
        file: "./city/hefei/assets/railway.svg",
        x: 2299,
        y: 1456,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "railway-HFB",
        file: "./city/hefei/assets/railway.svg",
        x: 1176,
        y: 538,
        width: 21,
        height: 21,
        opacity: 1,
        zIndex: 15
    }
];
