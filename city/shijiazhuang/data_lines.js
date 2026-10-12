/**
 * CGo OpenMap - 线路数据库与矢量走向配置 (city/shijiazhuang/data_lines.js)
 * ==============================================================================
 * 更新内容位于末尾
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

/**
 * CGo OpenMap - 线路数据库与矢量走向配置 (city/shijiazhuang/data_lines.js)
 */

const linesData = [
    {
        id: "M1", name: "1号线", color: "#E4002B", svg: "icon@01.svg",
        company: "石家庄市轨道交通有限责任公司",
        stationIds: ["M1p2","M1p1","M100","M101","M102","M103","M104","M105","M106","M107","M108","M109","M110","M111","M112","M113","M114","M115","M116","M117","M118","M119","M120","M121","M122","M123","M124","M125","M126","M1000"],
        distances: [600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600],
        segmentTimes: [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
        terminus: ["M100", "M1000"],
        pathPoints: [
            { x: 200,  y: 820 },
            { x: 1260, y: 820 },
            { x: 1260, y: 220  }
        ]
    },
    {
        id: "M2", name: "2号线", color: "#C4A35A", svg: "icon@02.svg",
        company: "石家庄市轨道交通有限责任公司",
        stationIds: ["M200","M201","M202","M203","M204","M205","M109","M206","M207","M208","M209","M210","M211","M212","M213","M214","M2000"],
        distances: [600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600],
        segmentTimes: [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
        terminus: ["M200", "M2000"],
        pathPoints: [
            { x: 740, y: 460  },
            { x: 740, y: 1040  },
            { x: 640, y: 1040  },
            { x: 640, y: 1400 }
        ]
    },
    {
        id: "M3", name: "3号线", color: "#4A90D9", svg: "icon@03.svg",
        company: "石家庄市轨道交通有限责任公司",
        stationIds: ["M300","M301","M302","M303","M304","M305","M106","M306","M307","M308","M210","M309","M310","M311","M312","M313","M314","M315","M316","M317","M318","M319","M320","M3000"],
        distances: [600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600],
        segmentTimes: [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
        terminus: ["M300", "M3000"],
        pathPoints: [
            { x: 320,  y: 560  },
            { x: 560,  y: 560  },
            { x: 560,  y: 1100  },
            { x: 1400, y: 1100 }
        ]
    }
];

const sceneryLines = [
    { id: "SC_YUXI", name: "裕西公园", color: "#52C41A", stationIds: ["M101", "S_YUXI"],     badge: "那么近那么美周末到河北" },
    { id: "SC_CHANGAN", name: "长安公园", color: "#52C41A", stationIds: ["M205", "S_CHANGAN"],  badge: "那么近那么美周末到河北" },
    { id: "SC_YUANBO", name: "河北正定园博园", color: "#52C41A", stationIds: ["M121", "S_YUANBO"],   badge: "那么近那么美周末到河北" },
    { id: "SC_OUYUN", name: "欧韵公园", color: "#52C41A", stationIds: ["M208", "S_OUYUN"],    badge: "那么近那么美周末到河北" },
    { id: "SC_SHANSHUI", name: "水上公园", color: "#52C41A", stationIds: ["M302", "S_SHANSHUI"], badge: "那么近那么美周末到河北" },
    { id: "SC_SHIJI", name: "世纪公园", color: "#52C41A", stationIds: ["M312", "S_SHIJI"],    badge: "那么近那么美周末到河北" },
    { id: "SC_BOWUYUAN", name: "河北博物院", color: "#52C41A", stationIds: ["M110", "S_BOWUYUAN"], badge: "那么近那么美周末到河北" },
    { id: "SC_HUITONG", name: "中央绿色体育公园", color: "#52C41A", stationIds: ["M309", "S_HUITONG"],  badge: "那么近那么美周末到河北" },
    { id: "SC_TAZHONG", name: "富强公园", color: "#52C41A", stationIds: ["M311", "S_TAZHONG"],  badge: "那么近那么美周末到河北" }
];

const railCityLines = [];

// 兼容全局 LINE_META 访问 (根据 linesData 自动提取)
const LINE_META = linesData.reduce((acc, l) => {
    if (l.name && !acc[l.name]) {
        acc[l.name] = { id: l.id, svg: l.svg, svgclr: l.svgclr, svgtext: l.svgtext, company: l.company, color: l.color };
    }
    return acc;
}, {});

if (typeof window !== "undefined") {
    window.linesData = linesData;
    window.LINE_META = LINE_META;
    window._GLOBAL_LINE_META = LINE_META;
    if (window.SHIJIAZHUANG_CITY) window.SHIJIAZHUANG_CITY.LINE_META = LINE_META;
    if (window.CURRENT_CITY) window.CURRENT_CITY.LINE_META = LINE_META;
}





/**
 * 更新内容：
 * 	1.修改了 M1 站数、区间数错误（同步 stations ）；
 * 					更新时间：2026.10.06
 */