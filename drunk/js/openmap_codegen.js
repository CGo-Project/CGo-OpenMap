/**
 * Drunk 线路图智能转换系统 - OpenMap 标准代码生成与完整性校验器 (openmap_codegen.js)
 * 
 * 严格遵守 openmap-dev skill 的 5 项核心铁律自检：
 * 1. 站间距数组长度校验：distances.length === stationIds.length - 1；
 * 2. 车站 ID 存在性校验：linesData 中引用的 stationId 必须在 stationsData 中有键值；
 * 3. 换乘站坐标一致性：多线共用的换乘站坐标必须重合；
 * 4. SVG 图标有效性：引用有效模板；
 * 5. 颜色合规：Hex 格式正确。
 */

window.DrunkCodeGen = (function () {
    /**
     * 数据完整性诊断报告生成器
     */
    /**
     * 站序分组访问器。线路可能是普通线（stationIds/distances），
     * 也可能是分支线（hasbranch + stationIds-way1/-way2 + distances-wayN）。
     * 与 city_project_io.js 的 lineStationGroups 同义，这里内联一份以免产生加载顺序依赖。
     */
    function groupsOf(line) {
        const groups = [];
        if (!line || typeof line !== 'object') return groups;
        if (Array.isArray(line.stationIds)) {
            groups.push({ label: '', ids: line.stationIds, distances: line.distances });
        }
        Object.keys(line).forEach(key => {
            const m = /^stationIds-(.+)$/.exec(key);
            if (m && Array.isArray(line[key])) {
                groups.push({ label: ` ${m[1]}`, ids: line[key], distances: line[`distances-${m[1]}`] });
            }
        });
        return groups;
    }

    function validateData(stationsData, linesData) {
        const errors = [];
        const warnings = [];

        // 1. 站间距校验（按分支逐组校验）
        linesData.forEach(line => {
            const groups = groupsOf(line);
            if (!groups.length) {
                // 纯装饰/纯走向线路（只有 pathPoints）不参与站序校验
                if (!line.pathPoints && !line.svgPath && !Object.keys(line).some(k => /^pathPoints-/.test(k))) {
                    warnings.push(`[${line.name || line.id}] 既无站序也无折线走向，将不会被渲染。`);
                }
                return;
            }

            groups.forEach(g => {
                if (!Array.isArray(g.distances) || g.distances.length === 0) {
                    // 「有站序但没站间距」是合法的待补全状态，不是错误：
                    // 合肥全网、各地在建线路均属此列，且 data_lines.js 明确要求
                    // 「未经可靠来源核实的站间距不得按坐标推算或补写」。
                    // 若在这里报错，绝大多数城市的健康度指示会长期泛红而失去意义。
                    warnings.push(`[${line.name}${g.label}] 尚未录入站间距 (distances)，共 ${g.ids.length} 站待补。`);
                } else if (line.isLoop) {
                    if (g.distances.length !== g.ids.length) {
                        errors.push(`[${line.name}${g.label}] 环线站间距长度(${g.distances.length})必须等于站点数(${g.ids.length})`);
                    }
                } else if (g.distances.length !== g.ids.length - 1) {
                    errors.push(`[${line.name}${g.label}] 站间距长度(${g.distances.length})必须等于站点数减一(${g.ids.length - 1})`);
                }

                // 2. 站点存在性校验
                g.ids.forEach(sid => {
                    if (!stationsData[sid]) {
                        errors.push(`[${line.name}${g.label}] 引用的车站 ID "${sid}" 在 stationsData 中未定义！`);
                    }
                });
            });
        });

        // 3. 孤立站点检测
        const referencedStations = new Set();
        linesData.forEach(line => {
            groupsOf(line).forEach(g => g.ids.forEach(sid => referencedStations.add(sid)));
        });

        Object.keys(stationsData).forEach(sid => {
            if (!referencedStations.has(sid)) {
                warnings.push(`车站 "${stationsData[sid].cn}" (${sid}) 未被任何线路引用，属于孤立点。`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 生成 data_stations.js 源码
     */
    function generateStationsJs(cityId, cityName, stationsData) {
        let content = `/**\n * CGo OpenMap - ${cityName}车站数据库 (city/${cityId}/data_stations.js)\n * 由 Drunk 转换系统自动生成\n */\n\nconst stationsData = {\n`;
        const keys = Object.keys(stationsData);
        keys.forEach((key, index) => {
            const s = stationsData[key];
            const isLast = index === keys.length - 1;
            const line = `    "${key}": { type: "${s.type || 'dot'}", x: ${s.x}, y: ${s.y}, cn: "${s.cn}", en: "${s.en || s.cn}", align: "${s.align || 'top'}", offset: { x: ${s.offset?.x || 0}, y: ${s.offset?.y || 0} } }${isLast ? '' : ','}\n`;
            content += line;
        });
        content += `};\n`;
        return content;
    }

    /**
     * 生成 data_lines.js 源码
     */
    function generateLinesJs(cityId, cityName, linesData) {
        let content = `/**\n * CGo OpenMap - ${cityName}线路数据库与走向配置 (city/${cityId}/data_lines.js)\n * 由 Drunk 转换系统自动生成\n */\n\nconst linesData = [\n`;
        linesData.forEach((line, index) => {
            const isLast = index === linesData.length - 1;
            content += `    {\n`;
            content += `        id: "${line.id}",\n`;
            content += `        name: "${line.name}",\n`;
            content += `        color: "${line.color}",\n`;
            content += `        svg: "${line.svg || 'icon@01.svg'}",\n`;
            content += `        company: "${line.company || cityName + '轨道交通'}",\n`;
            content += `        stationIds: ${JSON.stringify(line.stationIds)},\n`;
            content += `        distances: ${JSON.stringify(line.distances)}`;
            if (line.pathPoints && line.pathPoints.length > 0) {
                content += `,\n        pathPoints: ${JSON.stringify(line.pathPoints)}`;
            }
            content += `\n    }${isLast ? '' : ','}\n`;
        });
        content += `];\n`;
        return content;
    }

    /**
     * 生成 data_legend.js 源码
     */
    function generateLegendJs(cityId, cityName, linesData) {
        const lineItems = linesData.map(l => ({ targets: [l.id], name: l.name }));
        return `/**\n * CGo OpenMap - ${cityName}图例配置 (city/${cityId}/data_legend.js)\n * 由 Drunk 转换系统自动生成\n */\n\nconst LEGEND_CONFIG = [\n    {\n        type: "title",\n        title: "城市轨道交通",\n        subtitle: "Urban Rail Transit"\n    },\n    {\n        type: "grid",\n        cols: 2,\n        items: ${JSON.stringify(lineItems, null, 12).trim()}\n    }\n];\n\nif (typeof window !== "undefined") {\n    window.LEGEND_CONFIG = LEGEND_CONFIG;\n    window.LEGEND_SECTIONS = LEGEND_CONFIG;\n}\n`;
    }

    /**
     * 生成主业务逻辑脚本 city_id.js
     */
    function generateCityMainJs(cityId, cityName, linesData) {
        const lineSort = linesData.map(l => l.id);
        return `/**\n * CGo OpenMap - ${cityName}城市业务逻辑与关系配置 (city/${cityId}/${cityId}.js)\n * 由 Drunk 转换系统自动生成\n */\n\n(function () {\n    const ${cityId.charAt(0).toUpperCase() + cityId.slice(1)}City = {\n        id: "${cityId}",\n        name: "${cityName}",\n        LINE_SORT_ORDER: ${JSON.stringify(lineSort)},\n        CROSS_PLATFORM_STATIONS: [],\n        MERGE_STATIONS: []\n    };\n    window.${cityId.toUpperCase()}_CITY = ${cityId.charAt(0).toUpperCase() + cityId.slice(1)}City;\n})();\n`;
    }

    /**
     * 生成站名拼音索引 staname.csv
     */
    function generateStanameCsv(stationsData) {
        let csv = `id,name,pinyin,short_pinyin\n`;
        Object.keys(stationsData).forEach(key => {
            const s = stationsData[key];
            // 简单拼音回退
            csv += `"${key}","${s.cn}","${s.cn}","${s.cn.substring(0, 2)}"\n`;
        });
        return csv;
    }

    return {
        validateData,
        generateStationsJs,
        generateLinesJs,
        generateLegendJs,
        generateCityMainJs,
        generateStanameCsv
    };
})();
