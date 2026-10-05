/**
 * CGo OpenMap - 线路数据库与矢量走向配置 (city/shijiazhuang/data_lines.js)
 * 
 * ==============================================================================
 * 线路数据结构规范与字段说明 (Line Schema & Field Specifications)
 * ==============================================================================
 * linesData 普通线路   sceneryLines 连接景区用   railCityLines 铁路连接城市用
 * ==============================================================================
 * 说明：虚拟终点站已接入 stationIds 首尾，使线路折线穿过端点站。
 */

const linesData = [
    {
        id: "M1", name: "1号线", color: "#E4002B", svg: "icon@01.svg",
        company: "石家庄市轨道交通有限责任公司",
        stationIds: ["M100","M101","M102","M103","M104","M105","M106","M107","M108","M109","M110","M111","M112","M113","M114","M115","M116","M117","M117B","M118","M119","M120","M121","M122","M123","M124","M125","M126","M1000"],
        distances: [120,1100,1050,980,1020,950,880,900,850,920,780,960,890,870,940,830,910,1200,1200,1600,1600,1200,1200,1200,1200,1200,1200,120],
        segmentTimes: [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1],
        terminus: ["M100", "M1000"]
    },
    {
        id: "M2", name: "2号线", color: "#C4A35A", svg: "icon@02.svg",
        company: "石家庄市轨道交通有限责任公司",
        stationIds: ["M200","M201","M202","M203","M204","M205","M109","M206","M207","M208","M209","M210","M211","M212","M213","M2000"],
        distances: [120,950,880,920,850,900,780,870,960,1100,1200,1150,1080,1050,120],
        segmentTimes: [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        terminus: ["M200", "M2000"]
    },
    {
        id: "M3", name: "3号线", color: "#4A90D9", svg: "icon@03.svg",
        company: "石家庄市轨道交通有限责任公司",
        stationIds: ["M300","M301","M302","M303","M304","M305","M106","M306","M307","M308","M210","M309","M310","M311","M312","M313","M314","M315","M316","M316B","M317","M318","M319","M3000"],
        distances: [120,900,850,920,880,950,900,870,960,1100,1050,980,920,890,950,870,910,880,940,600,1000,1000,120],
        segmentTimes: [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,2],
        terminus: ["M300", "M3000"]
    }
];

// 景区线
const sceneryLines = [
    { id: "SC_YUXI",     name: "裕西公园",         color: "#52C41A", stationIds: ["M101", "S_YUXI"],     badge: "那么近那么美周末到河北" },
    { id: "SC_CHANGAN",  name: "长安公园",         color: "#52C41A", stationIds: ["M205", "S_CHANGAN"],  badge: "那么近那么美周末到河北" },
    { id: "SC_YUANBO",   name: "河北正定园博园",   color: "#52C41A", stationIds: ["M121", "S_YUANBO"],   badge: "那么近那么美周末到河北" },
    { id: "SC_OUYUN",    name: "欧韵公园",         color: "#52C41A", stationIds: ["M208", "S_OUYUN"],    badge: "那么近那么美周末到河北" },
    { id: "SC_SHANSHUI", name: "水上公园",         color: "#52C41A", stationIds: ["M302", "S_SHANSHUI"], badge: "那么近那么美周末到河北" },
    { id: "SC_SHIJI",    name: "世纪公园",         color: "#52C41A", stationIds: ["M312", "S_SHIJI"],    badge: "那么近那么美周末到河北" },
    { id: "SC_BOWUYUAN", name: "河北博物院",       color: "#52C41A", stationIds: ["M110", "S_BOWUYUAN"], badge: "那么近那么美周末到河北" },
    { id: "SC_HUITONG",  name: "中央绿色体育公园", color: "#52C41A", stationIds: ["M309", "S_HUITONG"],  badge: "那么近那么美周末到河北" },
    { id: "SC_TAZHONG",  name: "富强公园",         color: "#52C41A", stationIds: ["M311", "S_TAZHONG"],  badge: "那么近那么美周末到河北" }
];

// 铁路连线
// const railCityLines = [
//     { id: "RC_JINGGUANG",     name: "京广铁路",     color: "#888888", lineWidth: 3, stationIds: ["R_SJZ", "C_BEIJING"] },
//     { id: "RC_JINGGUANG_HSR", name: "京广高速铁路", color: "#888888", lineWidth: 5, stationIds: ["R_SJZ", "C_BEIJING"] },
//     { id: "RC_SHIJI_HSR",     name: "石济高速铁路", color: "#888888", lineWidth: 5, stationIds: ["R_SJZ", "R_SJZD", "C_QINGDAO"] }
// ];
const railCityLines = [];