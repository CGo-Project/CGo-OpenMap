const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

// 1. Read existing beijing dataset for reference
const bjStationsCode = fs.readFileSync(path.join(ROOT, 'city/beijing/data_stations.js'), 'utf8');
const bjStationsFn = new Function(bjStationsCode + '; return stationsData;');
const bjStations = bjStationsFn();

const bjLinesCode = fs.readFileSync(path.join(ROOT, 'city/beijing/data_lines.js'), 'utf8');
const bjLinesFn = new Function(bjLinesCode + '; return linesData;');
const bjLines = bjLinesFn();

const nameToBjStation = new Map();
for (const [id, s] of Object.entries(bjStations)) {
    if (!nameToBjStation.has(s.cn)) {
        nameToBjStation.set(s.cn, { id, ...s });
    }
}

// 2. Read maptable exported data
const mtStationsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'maptable_stations.json'), 'utf8'));
const mtLinesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'maptable_lines.json'), 'utf8'));

// Column choice maps
const staLineCol = mtStationsData.columns.find(c => c.name === '线路');
const choiceMap = new Map();
for (const c of staLineCol.typeOptions.choices) {
    choiceMap.set(c.id, c.name);
}

// 3. Wide-scale Asinh Projection for optimal station spacing
const cLon = 116.402, cLat = 39.912; // Beijing center
const cosLat = Math.cos(cLat * Math.PI / 180);
const S0 = 9200; // Large scale for core transit network (approx 85-120px per station in core)
const r0 = 0.28; // Transition knee (~30km radius)
const cx = 5300, cy = 4460;
const canvasW = 10600, canvasH = 9600;

function projectCoords(lon, lat) {
    const dx = (lon - cLon) * cosLat;
    const dy = (lat - cLat);
    const r = Math.hypot(dx, dy);
    if (r === 0) return { x: cx, y: cy };
    const R = S0 * r0 * Math.asinh(r / r0);
    const ux = dx / r, uy = dy / r;
    return {
        x: Math.round((cx + ux * R) * 10) / 10,
        y: Math.round((cy - uy * R) * 10) / 10 // SVG Y-axis downward
    };
}

// 4. Parse all stations with intelligent layout & alignment
const stationsOutput = {};
const stationRowIdToId = new Map();
const stationNameToId = new Map();
let bpCounter = 1;

// Collect raw projected points first
const rawStationList = [];
for (const row of mtStationsData.rows) {
    const cn = row.cells['6795fe942845beec81369bb1'];
    const coordStr = row.cells['6795fe942845beec81369bb3'];
    if (!coordStr) continue;
    
    const m = coordStr.match(/POINT\s*\(\s*([0-9\.]+)\s+([0-9\.]+)\s*\)/i);
    if (!m) continue;
    
    const lon = parseFloat(m[1]), lat = parseFloat(m[2]);
    const pos = projectCoords(lon, lat);
    rawStationList.push({ row, cn, lon, lat, x: pos.x, y: pos.y });
}

for (const item of rawStationList) {
    const { row, cn, x, y } = item;
    const existing = nameToBjStation.get(cn);
    let id;
    let en = "";
    let type = "dot";
    let align = "top";
    let offset = { x: 0, y: 0 };
    let textScale = { cn: 1, en: 1 };
    
    if (existing) {
        id = existing.id;
        en = existing.en || "";
        type = existing.type || "dot";
        align = existing.align || "top";
        offset = existing.offset || { x: 0, y: 0 };
        textScale = existing.textScale || { cn: 1, en: 1 };
    } else {
        id = "BP" + String(bpCounter++).padStart(3, '0');
        const lineChoices = row.cells['6795fe942845beec81369bb4'] || [];
        if (lineChoices.length > 1) {
            type = "tsf";
        } else if (cn.endsWith("站") && (cn.includes("高铁") || cn.includes("火车站") || cn.length >= 4)) {
            type = "rdot";
        }
        en = ""; // User requested to leave new station English blank for now
    }
    
    // Radial outward alignment around Beijing center for natural, uncrowded label placement
    const dxFromCenter = x - cx;
    const dyFromCenter = y - cy;
    const angle = Math.atan2(dyFromCenter, dxFromCenter); // radians
    
    // Radial quadrant alignment:
    // If predominantly north (dy < 0, angle in [-3pi/4, -pi/4]), label on top
    // If predominantly south (dy > 0, angle in [pi/4, 3pi/4]), label on bottom
    // If east, label on right; if west, label on left
    if (Math.abs(dxFromCenter) < 1800 && Math.abs(dyFromCenter) < 1800) {
        if (angle >= -Math.PI * 0.75 && angle < -Math.PI * 0.25) {
            align = "top";
            offset = { x: 0, y: -2 };
        } else if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) {
            align = "bottom";
            offset = { x: 0, y: 2 };
        } else if (Math.abs(angle) <= Math.PI * 0.25) {
            align = "right";
            offset = { x: 4, y: 0 };
        } else {
            align = "left";
            offset = { x: -4, y: 0 };
        }
    }
    
    stationsOutput[id] = {
        type,
        x,
        y,
        cn,
        en,
        align,
        offset,
        textScale
    };
    
    stationRowIdToId.set(row.id, id);
    stationNameToId.set(cn, id);
}

// Proximity mutual collision resolution
const allStationKeys = Object.keys(stationsOutput);
for (let i = 0; i < allStationKeys.length; i++) {
    const s1 = stationsOutput[allStationKeys[i]];
    for (let j = i + 1; j < allStationKeys.length; j++) {
        const s2 = stationsOutput[allStationKeys[j]];
        const d = Math.hypot(s1.x - s2.x, s1.y - s2.y);
        if (d < 58) {
            // If both align on same side, push them to opposite sides
            if (s1.align === s2.align || s1.align.includes('top') && s2.align.includes('top')) {
                if (s1.y < s2.y) {
                    s1.align = "top";
                    s2.align = "bottom";
                } else {
                    s1.align = "bottom";
                    s2.align = "top";
                }
            } else if (s1.align.includes('left') && s2.align.includes('left') || s1.align.includes('right') && s2.align.includes('right')) {
                if (s1.x < s2.x) {
                    s1.align = "left";
                    s2.align = "right";
                } else {
                    s1.align = "right";
                    s2.align = "left";
                }
            }
        }
    }
}

console.log('Processed stations count:', Object.keys(stationsOutput).length);

// 5. Line color and metadata mapping for 80 lines
const LINE_CONFIG_MAP = {
    "1号线-八通线": { id: "M1", color: "#A4343A", svg: "icon@01.svg", name: "1号线-八通线", company: "北京市地铁运营有限公司" },
    "1号线支线": { id: "M1B", color: "#C93A40", svg: "icon@01.svg", name: "1号线支线", company: "北京市地铁运营有限公司" },
    "2号线": { id: "M2", color: "#006098", svg: "icon@02.svg", name: "2号线", isLoop: true, company: "北京市地铁运营有限公司" },
    "3号线": { id: "M3", color: "#FF5E00", svg: "icon@03.svg", name: "3号线", company: "北京京港地铁有限公司" },
    "3号线一期东段": { id: "M3_EAST", color: "#FF5E00", svg: "icon@03.svg", name: "3号线一期东段", company: "北京京港地铁有限公司" },
    "3号线一期西段": { id: "M3_WEST", color: "#FF5E00", svg: "icon@03.svg", name: "3号线一期西段", company: "北京京港地铁有限公司" },
    "4号线-大兴线": { id: "M4", color: "#008E9C", svg: "icon@04.svg", name: "4号线-大兴线", company: "北京京港地铁有限公司" },
    "5号线": { id: "M5", color: "#A62184", svg: "icon@05.svg", name: "5号线", company: "北京市地铁运营有限公司" },
    "6号线": { id: "M6", color: "#B58500", svg: "icon@06.svg", name: "6号线", company: "北京市地铁运营有限公司" },
    "6号线南延": { id: "M6_SOUTH", color: "#B58500", svg: "icon@06.svg", name: "6号线南延", company: "北京市地铁运营有限公司" },
    "7号线": { id: "M7", color: "#F39800", svg: "icon@07.svg", name: "7号线", company: "北京市地铁运营有限公司" },
    "7号线三期": { id: "M7_P3", color: "#F39800", svg: "icon@07.svg", name: "7号线三期", company: "北京市地铁运营有限公司" },
    "8号线": { id: "M8", color: "#009B6B", svg: "icon@08.svg", name: "8号线", company: "北京市地铁运营有限公司" },
    "8号线南延": { id: "M8_SOUTH", color: "#009B6B", svg: "icon@08.svg", name: "8号线南延", company: "北京市地铁运营有限公司" },
    "9号线": { id: "M9", color: "#8FC400", svg: "icon@09.svg", name: "9号线", company: "北京市地铁运营有限公司" },
    "9号线南延": { id: "M9_SOUTH", color: "#8FC400", svg: "icon@09.svg", name: "9号线南延", company: "北京市地铁运营有限公司" },
    "10号线": { id: "M10", color: "#009BC0", svg: "icon@10.svg", name: "10号线", isLoop: true, company: "北京市地铁运营有限公司" },
    "11号线": { id: "M11", color: "#ED796B", svg: "icon@11.svg", name: "11号线", company: "北京轨道交通路网管理有限公司" },
    "11号线二期西段": { id: "M11_P2W", color: "#ED796B", svg: "icon@11.svg", name: "11号线二期西段", company: "北京轨道交通路网管理有限公司" },
    "11号线二期东段": { id: "M11_P2E", color: "#ED796B", svg: "icon@11.svg", name: "11号线二期东段", company: "北京轨道交通路网管理有限公司" },
    "11号线东段": { id: "M11_EAST", color: "#ED796B", svg: "icon@11.svg", name: "11号线东段", company: "北京轨道交通路网管理有限公司" },
    "12号线": { id: "M12", color: "#007A3D", svg: "icon@12.svg", name: "12号线", company: "北京市地铁运营有限公司" },
    "12号线东延": { id: "M12_EAST", color: "#007A3D", svg: "icon@12.svg", name: "12号线东延", company: "北京市地铁运营有限公司" },
    "12号线南延": { id: "M12_SOUTH", color: "#007A3D", svg: "icon@12.svg", name: "12号线南延", company: "北京市地铁运营有限公司" },
    "13号线": { id: "M13", color: "#F9E700", svg: "icon@13.svg", name: "13号线", company: "北京市地铁运营有限公司" },
    "13号线扩能提升(在建)": { id: "M13_EXP", color: "#F9E700", svg: "icon@13.svg", name: "13号线扩能提升", company: "北京市地铁运营有限公司" },
    "14号线": { id: "M14", color: "#D986BA", svg: "icon@14.svg", name: "14号线", company: "北京京港地铁有限公司" },
    "15号线": { id: "M15", color: "#653279", svg: "icon@15.svg", name: "15号线", company: "北京市地铁运营有限公司" },
    "15号线二期": { id: "M15_P2", color: "#653279", svg: "icon@15.svg", name: "15号线二期", company: "北京市地铁运营有限公司" },
    "15号线西段": { id: "M15_WEST", color: "#653279", svg: "icon@15.svg", name: "15号线西段", company: "北京市地铁运营有限公司" },
    "16号线": { id: "M16", color: "#5B6770", svg: "icon@16.svg", name: "16号线", company: "北京京港地铁有限公司" },
    "17号线": { id: "M17", color: "#00A99D", svg: "icon@17.svg", name: "17号线", company: "北京京港地铁有限公司" },
    "17号线支线/R6线一期": { id: "M17_BR", color: "#00B4A4", svg: "icon@17.svg", name: "17号线支线(R6)", company: "北京京港地铁有限公司" },
    "18号线": { id: "M18", color: "#7B519D", svg: "icon@18.svg", name: "18号线", company: "北京市地铁运营有限公司" },
    "19号线": { id: "M19", color: "#D6A8CC", svg: "icon@19.svg", name: "19号线", company: "北京京港地铁有限公司" },
    "19号线二期北段": { id: "M19_P2N", color: "#D6A8CC", svg: "icon@19.svg", name: "19号线二期北段", company: "北京京港地铁有限公司" },
    "19号线二期南段": { id: "M19_P2S", color: "#D6A8CC", svg: "icon@19.svg", name: "19号线二期南段", company: "北京京港地铁有限公司" },
    "19号线二期南段支线": { id: "M19_P2SB", color: "#D6A8CC", svg: "icon@19.svg", name: "19号线二期南段支线", company: "北京京港地铁有限公司" },
    "28号线/CBD线": { id: "M28", color: "#107C41", svg: "icon@28.svg", name: "28号线(CBD线)", company: "北京市地铁运营有限公司" },
    "28号线/CBD线北延": { id: "M28_NORTH", color: "#107C41", svg: "icon@28.svg", name: "28号线北延", company: "北京市地铁运营有限公司" },
    "平谷线/22号线": { id: "M22", color: "#E37726", svg: "icon@22.svg", name: "平谷线(22号线)", company: "北京市轨道交通建设管理有限公司" },
    "M101线": { id: "M101", color: "#C8102E", svg: "icon@51.svg", name: "M101线", company: "北京城市副中心投资建设集团" },
    "M101北延": { id: "M101_NORTH", color: "#C8102E", svg: "icon@51.svg", name: "M101北延", company: "北京城市副中心投资建设集团" },
    "M101东延": { id: "M101_EAST", color: "#C8102E", svg: "icon@51.svg", name: "M101东延", company: "北京城市副中心投资建设集团" },
    "M102线": { id: "M102", color: "#00857C", svg: "icon@52.svg", name: "M102线", isLoop: true, company: "北京城市副中心投资建设集团" },
    "M103": { id: "M103", color: "#5C2D91", svg: "icon@53.svg", name: "M103线", company: "北京城市副中心投资建设集团" },
    "M104线": { id: "M104", color: "#E87722", svg: "icon@54.svg", name: "M104线", company: "北京城市副中心投资建设集团" },
    "R1线": { id: "R1", color: "#9E1B32", svg: "icon@57.svg", name: "R1线", company: "北京市地铁运营有限公司" },
    "R4线一期": { id: "R4_P1", color: "#005596", svg: "icon@56.svg", name: "R4线一期", company: "北京市地铁运营有限公司" },
    "新城联络线一期": { id: "S_XCLK", color: "#006699", svg: "icon@55.svg", name: "新城联络线一期(S6)", company: "北京市郊铁路运营有限公司" },
    "新城联络线副中心新建路由": { id: "S_XCLK_FZX", color: "#006699", svg: "icon@55.svg", name: "新城联络线副中心段", company: "北京市郊铁路运营有限公司" },
    "丽金线": { id: "LIJIN", color: "#E45300", svg: "icon@50.svg", name: "丽金线", company: "北京市地铁运营有限公司" },
    "亦庄线": { id: "YZ", color: "#D80618", svg: "icon@31.svg", name: "亦庄线", company: "北京市地铁运营有限公司" },
    "亦庄线-5号线联络线": { id: "YZ_M5_LINK", color: "#D80618", svg: "icon@31.svg", name: "亦庄5号线联络线", company: "北京市地铁运营有限公司" },
    "房山线": { id: "FS", color: "#E46022", svg: "icon@32.svg", name: "房山线", company: "北京市地铁运营有限公司" },
    "燕房线": { id: "YF", color: "#E46022", svg: "icon@33.svg", name: "燕房线", company: "北京市地铁运营有限公司" },
    "燕房线支线": { id: "YF_BRANCH", color: "#E46022", svg: "icon@33.svg", name: "燕房线支线", company: "北京市地铁运营有限公司" },
    "S1线": { id: "S1", color: "#A15B35", svg: "icon@34.svg", name: "S1线", company: "北京市地铁运营有限公司" },
    "昌平线": { id: "CP", color: "#DE7A9E", svg: "icon@35.svg", name: "昌平线", company: "北京市地铁运营有限公司" },
    "昌平线南延二期": { id: "CP_SOUTH", color: "#DE7A9E", svg: "icon@35.svg", name: "昌平线南延二期", company: "北京市地铁运营有限公司" },
    "首都机场线": { id: "CAE", color: "#A29BBB", svg: "icon@36.svg", name: "首都机场线", company: "北京市地铁运营有限公司" },
    "大兴机场线": { id: "DAE", color: "#004BA0", svg: "icon@37.svg", name: "大兴机场线", company: "北京市轨道交通运营管理有限公司" },
    "大兴机场线北延": { id: "DAE_NORTH", color: "#004BA0", svg: "icon@37.svg", name: "大兴机场线北延", company: "北京市轨道交通运营管理有限公司" },
    "雄安-大兴机场快线": { id: "XAE", color: "#003366", svg: "icon@37.svg", name: "雄安-大兴机场快线(R1)", company: "河北雄安轨道交通有限公司" },
    "西郊线": { id: "XJ", color: "#D80618", svg: "icon@38.svg", name: "西郊线", company: "北京公交有轨电车有限公司" },
    "亦庄T1线": { id: "YZ_T1", color: "#D80618", svg: "icon@39.svg", name: "亦庄T1线", company: "北京公交有轨电车有限公司" },
    "城市副中心线": { id: "S_FZX", color: "#D93932", svg: "icon@55.svg", name: "城市副中心线", company: "中国铁路北京局集团有限公司" },
    "S2线": { id: "S_S2", color: "#4080B7", svg: "icon@55.svg", name: "S2线", company: "中国铁路北京局集团有限公司" },
    "怀柔－密云线": { id: "S_HRMY", color: "#E98D95", svg: "icon@55.svg", name: "怀柔-密云线", company: "中国铁路北京局集团有限公司" },
    "通密线": { id: "S_TM", color: "#919A47", svg: "icon@55.svg", name: "通密线", company: "中国铁路北京局集团有限公司" },
    "东北环线": { id: "S_DBH", color: "#307040", svg: "icon@55.svg", name: "市郊铁路东北环线", company: "中国铁路北京局集团有限公司" },
    "京哈客运专线": { id: "CR_JINGHA", color: "#34495E", svg: "icon@56.svg", name: "京哈客运专线", company: "中国国家铁路集团有限公司" },
    "京雄城际铁路": { id: "CR_JINGXIONG", color: "#34495E", svg: "icon@56.svg", name: "京雄城际铁路", company: "中国国家铁路集团有限公司" },
    "固安通勤列车": { id: "CR_GUAN", color: "#34495E", svg: "icon@56.svg", name: "固安通勤列车", company: "中国铁路北京局集团有限公司" },
    "京唐城际铁路": { id: "CR_JINGTANG", color: "#34495E", svg: "icon@56.svg", name: "京唐城际铁路", company: "中国国家铁路集团有限公司" },
    "京广高铁": { id: "CR_JINGGUANG_HSR", color: "#34495E", svg: "icon@56.svg", name: "京广高铁", company: "中国国家铁路集团有限公司" },
    "京张高铁": { id: "CR_JINGZHANG", color: "#34495E", svg: "icon@56.svg", name: "京张高铁", company: "中国国家铁路集团有限公司" },
    "京广铁路": { id: "CR_JINGGUANG", color: "#34495E", svg: "icon@56.svg", name: "京广铁路", company: "中国国家铁路集团有限公司" },
    "京沪高铁": { id: "CR_JINGHU", color: "#34495E", svg: "icon@56.svg", name: "京沪高铁", company: "中国国家铁路集团有限公司" },
    "京津城际": { id: "CR_JINGJIN", color: "#34495E", svg: "icon@56.svg", name: "京津城际铁路", company: "中国国家铁路集团有限公司" }
};

// 6. Geometry parsing & Topological station sorting
function parseCoordinates(wkt) {
    const coords = [];
    const re = /([0-9\.]+)\s+([0-9\.]+)/g;
    let m;
    while ((m = re.exec(wkt)) !== null) {
        coords.push([parseFloat(m[1]), parseFloat(m[2])]);
    }
    return coords;
}

function projectPointOnLine(pt, lineCoords) {
    let bestDist = Infinity, bestParam = 0, cumLength = 0;
    for (let i = 0; i < lineCoords.length - 1; i++) {
        const p1 = lineCoords[i], p2 = lineCoords[i+1];
        const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
        const segLen = Math.hypot(dx, dy);
        if (segLen === 0) continue;
        let t = ((pt[0] - p1[0]) * dx + (pt[1] - p1[1]) * dy) / (segLen * segLen);
        t = Math.max(0, Math.min(1, t));
        const projX = p1[0] + t * dx, projY = p1[1] + t * dy;
        const dist = Math.hypot(pt[0] - projX, pt[1] - projY);
        if (dist < bestDist) {
            bestDist = dist;
            bestParam = cumLength + t * segLen;
        }
        cumLength += segLen;
    }
    return { dist: bestDist, param: bestParam };
}

// Build map of stations per line
const lineStationsMap = new Map();
for (const row of mtStationsData.rows) {
    const sId = stationRowIdToId.get(row.id);
    if (!sId) continue;
    const lineChoiceIds = row.cells['6795fe942845beec81369bb4'] || [];
    const m = row.cells['6795fe942845beec81369bb3']?.match(/POINT\s*\(\s*([0-9\.]+)\s+([0-9\.]+)\s*\)/i);
    const lonLat = m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
    
    for (const lChoiceId of lineChoiceIds) {
        const choiceName = choiceMap.get(lChoiceId);
        if (choiceName) {
            if (!lineStationsMap.has(choiceName)) lineStationsMap.set(choiceName, []);
            lineStationsMap.get(choiceName).push({ sId, lonLat, name: row.cells['6795fe942845beec81369bb1'] });
        }
    }
}

// Explicit mapping from line name to station choice names
const LINE_TO_CHOICES = {
    "1号线-八通线": ["1-八通"],
    "1号线支线": ["1支(在建)"],
    "2号线": ["2"],
    "3号线": ["3"],
    "3号线一期东段": ["3(在建)"],
    "3号线一期西段": ["3(远景)"],
    "4号线-大兴线": ["4-大兴"],
    "5号线": ["5"],
    "6号线": ["6"],
    "6号线南延": ["6(远景)"],
    "7号线": ["7"],
    "7号线三期": ["7三(近期)"],
    "8号线": ["8"],
    "8号线南延": ["8南(远景)"],
    "9号线": ["9"],
    "9号线南延": ["9南(远景)"],
    "10号线": ["10"],
    "11号线": ["11"],
    "11号线二期西段": ["11二(近期)"],
    "11号线二期东段": ["11二(近期)"],
    "11号线东段": ["11东(远景)"],
    "12号线": ["12"],
    "12号线东延": ["12东(在建)"],
    "12号线南延": ["12南(近期)"],
    "13号线": ["13"],
    "13号线扩能提升(在建)": ["13扩能(在建)"],
    "14号线": ["14"],
    "15号线": ["15"],
    "15号线二期": ["15二(近期)"],
    "15号线西段": ["15西(远景)"],
    "16号线": ["16"],
    "17号线": ["17", "17(在建)"],
    "17号线支线/R6线一期": ["17支(近期)"],
    "18号线": ["18"],
    "19号线": ["19"],
    "19号线二期北段": ["19二(在建)"],
    "19号线二期南段": ["19二(在建)"],
    "19号线二期南段支线": ["19二(在建)"],
    "28号线/CBD线": ["CBD(在建)"],
    "28号线/CBD线北延": ["CBD(远景)"],
    "平谷线/22号线": ["平谷(在建)"],
    "M101线": ["M101(在建)"],
    "M101北延": ["M101(远景)"],
    "M101东延": ["M101(远景)"],
    "M102线": ["M102(远景)"],
    "M103": ["M103(远景)"],
    "M104线": ["M104(远景)"],
    "R1线": ["R1(远景)"],
    "R4线一期": ["R4一(在建)"],
    "新城联络线一期": ["新城联络线(近期)"],
    "新城联络线副中心新建路由": ["新城联络线(远景)"],
    "丽金线": ["丽金(近期)"],
    "亦庄线": ["亦庄"],
    "亦庄线-5号线联络线": ["亦庄"],
    "房山线": ["房山"],
    "燕房线": ["燕房"],
    "燕房线支线": ["燕房支(远景)"],
    "S1线": ["S1"],
    "昌平线": ["昌平"],
    "昌平线南延二期": ["昌平(远景)"],
    "首都机场线": ["首都机场"],
    "大兴机场线": ["大兴机场"],
    "大兴机场线北延": ["大兴机场(在建)"],
    "雄安-大兴机场快线": ["雄快(在建)"],
    "西郊线": ["西郊"],
    "亦庄T1线": ["亦庄T1"],
    "城市副中心线": ["副中心"],
    "S2线": ["S2"],
    "怀柔－密云线": ["怀密"],
    "通密线": ["通密", "通密(远景)"],
    "东北环线": ["东北环(在建)"],
    "京哈客运专线": ["京哈"],
    "京雄城际铁路": ["京雄"],
    "固安通勤列车": ["固安通勤"],
    "京唐城际铁路": ["京唐"],
    "京广高铁": ["京广"],
    "京张高铁": ["京张"],
    "京广铁路": ["京广"],
    "京沪高铁": ["京沪"],
    "京津城际": ["京津"]
};

// 7. Process all lines
const linesOutput = [];
let autoLineCounter = 1;

for (const row of mtLinesData.rows) {
    const origName = row.cells['6795f6e72845beec81369b26'];
    const wkt = row.cells['6795f6e72845beec81369b28'];
    if (!wkt) continue;
    
    const rawCoords = parseCoordinates(wkt);
    if (rawCoords.length < 2) continue;
    
    // Project vertices
    const pathPoints = [];
    let lastPt = null;
    for (const [lon, lat] of rawCoords) {
        const pt = projectCoords(lon, lat);
        if (!lastPt || Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) >= 2.5) {
            pathPoints.push(pt);
            lastPt = pt;
        }
    }
    
    const config = LINE_CONFIG_MAP[origName] || {
        id: "LINE_" + (autoLineCounter++),
        color: "#244AA3",
        svg: "icon@01.svg",
        name: origName,
        company: "北京轨道交通规划"
    };
    
    // Find stations for this line
    const targetChoices = LINE_TO_CHOICES[origName] || [];
    const associatedStations = [];
    for (const choiceName of targetChoices) {
        const stas = lineStationsMap.get(choiceName) || [];
        for (const s of stas) {
            if (!associatedStations.some(x => x.sId === s.sId)) {
                associatedStations.push(s);
            }
        }
    }
    
    // If still empty or very short, fallback to spatial buffer match (within ~0.008 deg / ~800m)
    if (associatedStations.length === 0) {
        for (const [rowId, sId] of stationRowIdToId.entries()) {
            const staRow = mtStationsData.rows.find(r => r.id === rowId);
            const m = staRow?.cells['6795fe942845beec81369bb3']?.match(/POINT\s*\(\s*([0-9\.]+)\s+([0-9\.]+)\s*\)/i);
            if (m) {
                const pt = [parseFloat(m[1]), parseFloat(m[2])];
                const proj = projectPointOnLine(pt, rawCoords);
                if (proj.dist < 0.008) {
                    associatedStations.push({ sId, lonLat: pt, name: staRow.cells['6795fe942845beec81369bb1'] });
                }
            }
        }
    }
    
    // Sort stations topologically along rawCoords
    const sortedStations = associatedStations.map(s => {
        const proj = s.lonLat ? projectPointOnLine(s.lonLat, rawCoords) : { param: 0 };
        return { sId: s.sId, param: proj.param, name: s.name };
    }).sort((a, b) => a.param - b.param);
    
    const stationIds = sortedStations.map(s => s.sId);
    
    // Calculate distances (loop lines require distance back to start, i.e. length === stationIds.length)
    const distCount = config.isLoop ? stationIds.length : Math.max(0, stationIds.length - 1);
    const distances = [];
    for (let i = 0; i < distCount; i++) {
        distances.push("??"); // Standard placeholder compliant with rule six
    }
    
    const lineObj = {
        id: config.id,
        name: config.name,
        color: config.color,
        svg: config.svg,
        company: config.company,
        stationIds,
        distances,
        pathPoints
    };
    if (config.isLoop) {
        lineObj.isLoop = true;
    }
    
    linesOutput.push(lineObj);
}

console.log('Processed lines count:', linesOutput.length);

// 8. Generate files
const outDir = path.resolve(__dirname, '..');
fs.mkdirSync(outDir, { recursive: true });

// A. data_stations.js
const stationsFileContent = `/**
 * CGo OpenMap - 北京规划 车站数据库 (city/beijing_plan/data_stations.js)
 * 来源: 脑斧地图 - 北京轨道交通规划全网数据
 * 投影: Web Mercator 真实地理流线型映射
 */

const stationsData = ${JSON.stringify(stationsOutput, null, 4)};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = stationsData;
}
`;
fs.writeFileSync(path.join(outDir, 'data_stations.js'), stationsFileContent, 'utf8');
console.log('Saved data_stations.js');

// B. data_lines.js
const linesFileContent = `/**
 * CGo OpenMap - 北京规划 线路与流线走向数据库 (city/beijing_plan/data_lines.js)
 * 包含运营中、建设中、三期规划与远景线网全量线路
 */

const linesData = ${JSON.stringify(linesOutput, null, 4)};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = linesData;
}
`;
fs.writeFileSync(path.join(outDir, 'data_lines.js'), linesFileContent, 'utf8');
console.log('Saved data_lines.js');

// C. data_legend.js
const legendData = {
    groups: [
        {
            title: "城市轨道交通线网",
            lineIds: linesOutput.filter(l => l.id.startsWith("M") && !l.id.includes("EAST") && !l.id.includes("WEST") && !l.id.includes("SOUTH") && !l.id.includes("P2") && !l.id.includes("P3") && !l.id.includes("BR")).map(l => l.id)
        },
        {
            title: "延伸段与规划新建线",
            lineIds: linesOutput.filter(l => l.id.includes("EAST") || l.id.includes("WEST") || l.id.includes("SOUTH") || l.id.includes("P2") || l.id.includes("P3") || l.id.includes("BR") || l.id.startsWith("R") || l.id.startsWith("XAE") || l.id.startsWith("LIJIN")).map(l => l.id)
        },
        {
            title: "郊区快线与有轨电车",
            lineIds: linesOutput.filter(l => ["YZ", "FS", "YF", "S1", "CP", "CAE", "DAE", "XJ", "YZ_T1"].includes(l.id)).map(l => l.id)
        },
        {
            title: "市郊铁路网",
            lineIds: linesOutput.filter(l => l.id.startsWith("S_")).map(l => l.id)
        },
        {
            title: "综合客运高速铁路干线",
            lineIds: linesOutput.filter(l => l.id.startsWith("CR_")).map(l => l.id)
        }
    ]
};

const legendFileContent = `/**
 * CGo OpenMap - 北京规划 图例分类配置 (city/beijing_plan/data_legend.js)
 */

const legendData = ${JSON.stringify(legendData, null, 4)};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = legendData;
}
`;
fs.writeFileSync(path.join(outDir, 'data_legend.js'), legendFileContent, 'utf8');
console.log('Saved data_legend.js');

// D. beijing_plan.js
const beijingPlanLogicContent = `/**
 * CGo OpenMap - 北京规划 城市业务接口与核心调度 (city/beijing_plan/beijing_plan.js)
 */

(function () {
    // 载入本城样式
    (function loadCityStylesheet() {
        if (typeof document === 'undefined') return;
        const href = "./city/beijing_plan/style.css";
        if (document.querySelector('link[href^="' + href + '"]')) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href + "?v=" + (window.CGoVersion || Date.now());
        document.head.appendChild(link);
    })();

    const BeijingPlanCity = {
        id: "beijing_plan",
        name: "北京规划",
        SUBURBAN_LINES: ["S_FZX", "S_S2", "S_HRMY", "S_TM", "S_DBH"],
        MAP_12306: {
            "北京南站": "VNP",
            "北京西站": "BXP",
            "北京站": "BJP",
            "北京北站": "VAP",
            "清河站": "QIP",
            "北京朝阳站": "IFP",
            "北京丰台站": "FTP",
            "北京城市副中心站": "FOP",
            "大兴机场站": "DAP",
            "雄安站": "XAP"
        }
    };

    window.BeijingPlanCity = BeijingPlanCity;
})();
`;
fs.writeFileSync(path.join(outDir, 'beijing_plan.js'), beijingPlanLogicContent, 'utf8');
console.log('Saved beijing_plan.js');

// E. style.css
const styleCssContent = `/* CGo OpenMap - 北京规划 专属样式 */
.city-beijing_plan {
    --theme-color: #244AA3;
}
`;
fs.writeFileSync(path.join(outDir, 'style.css'), styleCssContent, 'utf8');
console.log('Saved style.css');

// F. staname.csv
let csvContent = "StationID,StationName,Pinyin,ShortCode\n";
for (const [id, s] of Object.entries(stationsOutput)) {
    csvContent += id + ',' + s.cn + ',"' + (s.en || '') + '",""\n';
}
fs.writeFileSync(path.join(outDir, 'staname.csv'), csvContent, 'utf8');
console.log('Saved staname.csv');

console.log('All files generated successfully for city/beijing_plan!');
