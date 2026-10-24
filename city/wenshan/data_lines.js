/**
 * CGo OpenMap - 文山 线路数据库 (city/wenshan/data_lines.js)
 */

const LINE_META = {
    "WS-M4": { svg: "icon@04.svg", company: "文山普者黑有轨电车" },
    "WS-M5": { svg: "icon@05.svg", company: "文山普者黑有轨电车" },
};

const linesData = [
    {
        id: "WS-M5",
        name: "5号线",
        color: "#7CCACF",
        svg: "icon@05.svg",
        svgclr: "#7CCACF",
        svgtext: "#ffffff",
        company: "文山普者黑有轨电车",
        overlayStyle: { color: "white", width: 1.6, opacity: 1, dashArray: "0, 0" },
        stationIds: ["WS09", "WS10", "WS02", "WS03", "WS04", "WS05", "WS06", "WS07", "WS08"],
        distances: [],
        pathPoints: [{x:118.7,y:128.4}, {x:138.5,y:108.6}, {x:140.7,y:106.6}, {x:143.2,y:104.8}, {x:145.7,y:103.2}, {x:148.4,y:102.0}, {x:151.3,y:101.0}, {x:154.2,y:100.2}, {x:157.1,y:99.8}, {x:160.2,y:99.6}, {x:203.4,y:99.6}]
    },
    {
        id: "WS-M4",
        name: "4号线",
        color: "#0071BC",
        svg: "icon@04.svg",
        svgclr: "#0071BC",
        svgtext: "#ffffff",
        company: "文山普者黑有轨电车",
        overlayStyle: { color: "white", width: 1.6, opacity: 1, dashArray: "0, 0" },
        stationIds: ["WS01", "WS02", "WS03", "WS04", "WS05", "WS06", "WS07", "WS08"],
        distances: [],
        pathPoints: [{x:118.7,y:64.2}, {x:118.7,y:264.7}, {x:118.8,y:267.7}, {x:119.3,y:270.7}, {x:120.0,y:273.6}, {x:121.0,y:276.4}, {x:122.3,y:279.1}, {x:123.8,y:281.7}, {x:125.6,y:284.1}, {x:127.6,y:286.4}, {x:173.2,y:331.9}, {x:175.2,y:334.2}, {x:177.0,y:336.6}, {x:178.6,y:339.2}, {x:179.9,y:341.9}, {x:180.9,y:344.7}, {x:181.6,y:347.6}, {x:182.0,y:350.6}, {x:182.2,y:353.6}, {x:182.2,y:581.4}]
    },
];
