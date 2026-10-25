/**
 * CGo OpenMap - 天水 线路数据库 (city/tianshui/data_lines.js)
 * way1（主线）：景坤西郡三中 — 分路口（经天水南站 / 天水机场）
 * way2（支线）：景坤西郡三中 — 天水火车站
 */

const LINE_META = {
    "TIANSHUI-L1": { svg: "icon@01.svg", company: "天水市轨道交通" },
};

const linesData = [
    {
        id: "TIANSHUI-L1",
        name: "1号线",
        color: "#CC2D46",
        svg: "icon@01.svg",
        svgclr: "#CC2D46",
        svgtext: "#ffffff",
        company: "天水市轨道交通",
        overlayStyle: { color: "white", width: 1.6, opacity: 1, dashArray: "0, 0" },
        hasbranch: true,
        "stationIds-way1": ["TI01", "TI02", "TI03", "TI04", "TI05", "TI06", "TI07", "TI08", "TI09", "TI10", "TI11", "TI12", "TI13", "TI14", "TI15", "TI16", "TI17", "TI29", "TI28", "TI27", "TI26", "TI25", "TI24", "TI23"],
        "distances-way1": ["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??"],
        "stationIds-way2": ["TI01", "TI02", "TI03", "TI04", "TI05", "TI06", "TI07", "TI08", "TI09", "TI10", "TI11", "TI12", "TI13", "TI14", "TI15", "TI16", "TI17", "TI18", "TI19", "TI20", "TI21", "TI22"],
        "distances-way2": ["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??"],
        "pathPoints-main": [{x:115.6,y:84.2}, {x:771.6,y:84.2}],
        "pathPoints-branch1": [{x:771.6,y:84.2}, {x:784.7,y:84.2}, {x:787.8,y:84.5}, {x:790.7,y:85.4}, {x:793.3,y:86.8}, {x:795.5,y:88.7}, {x:797.4,y:91.0}, {x:798.8,y:93.6}, {x:799.7,y:96.5}, {x:800.0,y:99.6}, {x:800.0,y:125.9}, {x:800.3,y:129.0}, {x:801.2,y:131.9}, {x:802.6,y:134.5}, {x:804.5,y:136.8}, {x:806.8,y:138.7}, {x:809.4,y:140.1}, {x:812.3,y:141.0}, {x:815.4,y:141.3}, {x:1080.5,y:141.3}],
        "pathPoints-branch2": [{x:771.6,y:84.2}, {x:1080.5,y:84.2}],
        distances: []
    },
];
