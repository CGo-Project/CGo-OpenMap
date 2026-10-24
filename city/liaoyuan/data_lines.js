/**
 * CGo OpenMap - 辽源 线路数据库 (city/liaoyuan/data_lines.js)
 */

const LINE_META = {
    "LY-M1": { svg: "icon@01.svg", company: "辽源交发集团" },
    "LY-M2": { svg: "icon@02.svg", company: "辽源交发集团" },
};

const linesData = [
    {
        id: "LY-M1",
        name: "1号线",
        color: "#1359A9",
        svg: "icon@01.svg",
        svgclr: "#1359A9",
        svgtext: "#ffffff",
        company: "辽源交发集团",
        stationIds: ["LY01", "LY02", "LY03", "LY04", "LY05"],
        distances: [],
        pathPoints: [{x:307.7,y:41.2}, {x:352.4,y:85.9}, {x:354.4,y:88.2}, {x:356.2,y:90.6}, {x:357.8,y:93.2}, {x:359.1,y:95.9}, {x:360.1,y:98.7}, {x:360.8,y:101.6}, {x:361.2,y:104.6}, {x:361.4,y:107.6}, {x:361.4,y:333.4}, {x:361.2,y:336.4}, {x:360.8,y:339.4}, {x:360.1,y:342.3}, {x:359.1,y:345.1}, {x:357.8,y:347.8}, {x:356.2,y:350.4}, {x:354.4,y:352.8}, {x:352.4,y:355.1}, {x:320.1,y:387.3}, {x:317.9,y:389.4}, {x:315.5,y:391.2}, {x:312.9,y:392.7}, {x:310.2,y:394.0}, {x:307.4,y:395.0}, {x:304.5,y:395.7}, {x:301.5,y:396.2}, {x:298.5,y:396.3}, {x:270.5,y:396.3}]
    },
    {
        id: "LY-M2",
        name: "2号线",
        color: "#006837",
        svg: "icon@02.svg",
        svgclr: "#006837",
        svgtext: "#ffffff",
        company: "辽源交发集团",
        overlayStyle: { color: "white", width: 1.6, opacity: 1, dashArray: "0, 0" },
        stationIds: ["LY02", "LY06", "LY07", "LY08"],
        distances: [],
        pathPoints: [{x:351.5,y:189.0}, {x:351.5,y:218.0}, {x:351.2,y:221.1}, {x:350.3,y:224.0}, {x:348.9,y:226.6}, {x:347.0,y:228.9}, {x:344.8,y:230.7}, {x:342.2,y:232.2}, {x:339.3,y:233.0}, {x:336.2,y:233.4}, {x:163.7,y:233.4}]
    },
];
