/**
 * CGo OpenMap - 澳門 线路数据库 (city/macau/data_lines.js)
 */

const LINE_META = {
    "MC-TAIPA": { svg: "./city/macau/assets/lrt-taipa.svg", company: "澳門輕軌股份有限公司" },
    "MC-SEAC": { svg: "./city/macau/assets/lrt-seacpai.svg", company: "澳門輕軌股份有限公司" },
    "MC-HENGQIN": { svg: "./city/macau/assets/lrt-hengqin.svg", company: "澳門輕軌股份有限公司" },
};

const linesData = [
    {
        id: "MC-TAIPA",
        name: "氹仔線",
        color: "#93D50A",
        svg: "./city/macau/assets/lrt-taipa.svg",
        svgclr: "#93D50A",
        svgtext: "#ffffff",
        company: "澳門輕軌股份有限公司",
        stationIds: ["MC01", "MC02", "MC04", "MC06", "MC08", "MC10", "MC12", "MC13", "MC11", "MC09", "MC07", "MC05", "MC03"],
        distances: [],
        pathPoints: [{x:96.5,y:69.7}, {x:96.5,y:195.2}, {x:96.8,y:198.3}, {x:97.7,y:201.2}, {x:99.1,y:203.8}, {x:101.0,y:206.1}, {x:103.2,y:207.9}, {x:105.8,y:209.3}, {x:108.7,y:210.2}, {x:111.8,y:210.5}, {x:155.6,y:210.5}, {x:158.7,y:210.9}, {x:161.6,y:211.8}, {x:164.2,y:213.2}, {x:166.5,y:215.0}, {x:168.3,y:217.3}, {x:169.7,y:219.9}, {x:170.6,y:222.8}, {x:171.0,y:225.9}, {x:171.0,y:310.2}, {x:171.3,y:313.3}, {x:172.2,y:316.2}, {x:173.6,y:318.8}, {x:175.4,y:321.1}, {x:177.7,y:323.0}, {x:180.3,y:324.4}, {x:183.2,y:325.3}, {x:186.3,y:325.6}, {x:257.3,y:325.6}, {x:260.3,y:325.3}, {x:263.2,y:324.4}, {x:265.8,y:323.0}, {x:268.1,y:321.1}, {x:270.0,y:318.8}, {x:271.4,y:316.2}, {x:272.3,y:313.3}, {x:272.6,y:310.2}, {x:272.6,y:176.5}]
    },
    {
        id: "MC-SEAC",
        name: "石排灣線",
        color: "#8A66C3",
        svg: "./city/macau/assets/lrt-seacpai.svg",
        svgclr: "#8A66C3",
        svgtext: "#ffffff",
        company: "澳門輕軌股份有限公司",
        stationIds: ["MC13", "MC15"],
        distances: [],
        pathPoints: [{x:190.2,y:385.3}, {x:228.2,y:385.3}, {x:231.3,y:385.0}, {x:234.2,y:384.1}, {x:236.8,y:382.7}, {x:239.0,y:380.8}, {x:240.9,y:378.5}, {x:242.3,y:375.9}, {x:243.2,y:373.1}, {x:243.5,y:370.0}, {x:243.5,y:332.3}]
    },
    {
        id: "MC-HENGQIN",
        name: "橫琴線",
        color: "#BD273A",
        svg: "./city/macau/assets/lrt-hengqin.svg",
        svgclr: "#BD273A",
        svgtext: "#ffffff",
        company: "澳門輕軌股份有限公司",
        stationIds: ["MC12", "MC14"],
        distances: [],
        pathPoints: [{x:39.4,y:336.8}, {x:190.2,y:336.8}]
    },
];
