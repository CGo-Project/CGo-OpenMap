/**
 * CGo OpenMap - 青岛城市配置
 * 采用用户实测坐标；所有已录入坐标统一扩大 5 倍。
 */
(function () {
    // 青岛地图上的综合交通换乘图标为固定黑色 SVG。
    // 暗色主题下仅对这些图标进行黑白反转，避免在深色底图上辨识度不足。
    if (typeof document !== "undefined" && !document.getElementById("qingdao-transport-icon-theme")) {
        const style = document.createElement("style");
        style.id = "qingdao-transport-icon-theme";
        style.textContent = `
            html[data-theme="dark"] .scattered-item img[src*="China_Railway.svg"],
            html[data-theme="dark"] .scattered-item img[src*="Aircraft.svg"],
            html[data-theme="dark"] .scattered-item img[src*="Long_Distance_Bus.svg"],
            html[data-theme="dark"] .scattered-item img[src*="Ship.svg"],
            html[data-theme="dark"] .scattered-item img[src*="Streetcar.svg"] {
                filter: invert(1);
            }
        `;
        document.head.appendChild(style);
    }

    const QingdaoCity = {
        id: "qingdao",
        name: "青岛",
        searchCity: "青岛",
        center: { x: 1500, y: 1250 },
        defaultScale: 1.45,
        mapSize: { width: 3000, height: 2500 },
        officialMapUrl: "https://www.qd-metro.com/",
        LINE_META: {},
        LINE_SORT_ORDER: ["QDM01", "QDM02", "QDM03", "QDM04", "QDM05", "QDM06", "QDM07N", "QDM07S", "QDM08", "QDM08B", "QDM09", "QDM11", "QDM13", "QDM15"],
        LINE_SYNC_GROUPS: [["QDM07N", "QDM07S"], ["QDM08", "QDM08B"]],
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],
        maintainers: [
            { name: "YoTra青通", role: "城市主理人", github: "https://github.com/YoTraYoungTraffic" }
        ],
        dataFiles: {
            stanameCsvUrl: "./city/qingdao/staname.csv",
            amapDataUrl: "./city/qingdao/amap_data.json"
        },
        getNavigationUrl(stationName, isRailway = false) {
            const query = isRailway ? stationName : `${stationName}(地铁站)`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent("青岛")}`;
        },
        getSuburbanLinks() { return null; },
        formatOwnerName(rawOwnerName) { return rawOwnerName || "青岛地铁集团有限公司"; },
        formatCompanyString(companyList) { return [...new Set(companyList)].join("，"); },
        stacard: {
            script: "./city/qingdao/stacard/script.js",
            geoDataUrl: "./city/qingdao/amap_data.json",
            basePath: "./city/qingdao/stacard/",
            getRenderer: () => window.QingdaoStaCard || window.StaCard || null
        },
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({
                basePath: this.stacard.basePath,
                geoDataUrl: this.stacard.geoDataUrl,
                ...options
            });
        },
        hasStaCard(stationId, lineId, stationInfo) {
            return Boolean(this.stacard.getRenderer()?.hasCard?.(stationId, lineId, stationInfo));
        },
        getStaCardHtml(station, lineInfo, isCrossPlatform = false) {
            return this.stacard.getRenderer()?.getCardPlaceholderHtml?.(station, lineInfo, isCrossPlatform) || "";
        },
        async renderStaCards(infoPanel, station) {
            return await this.stacard.getRenderer()?.renderPanelCards?.(infoPanel, station);
        },
        stationBoard: {
            scripts: [
                "modules/qingdao_station_name_history.js",
                "modules/qingdao_engineering_name_notice.js",
                "modules/qingdao_timetable.js",
                "modules/qingdao_construction.js"
            ],
            modules: {
                'qingdao-station-name-history': { enabled: true, targetTab: 'station-info', order: 15 },
                'operators': {
                    enabled: true,
                    targetTab: 'station-info',
                    order: 20,
                    render(context) {
                        // 仅对换乘站使用站级运营中心覆盖；普通站继续沿用线路 company。
                        const stationOperatorOverrides = {
                            "M0713": "运营一中心", // 沟岔
                            "M0907": "运营二中心", // 靖城路（用户确认）
                            "M0208": "运营二中心", // 下王埠(外贸学院)（用户确认）
                            "M1303": "运营一中心", // 井冈山路
                            "M1308": "运营一中心", // 辛屯
                            "M1312": "运营一中心", // 双珠路
                            "M0216": "运营二中心", // 苗岭路
                            "M1105": "运营二中心", // 张村
                            "M1108": "运营二中心", // 世博园
                            "M0715": "运营一中心", // 正阳中路
                            "M0804": "运营三中心", // 大涧
                            "M0301": "运营三中心", // 青岛北站
                            "M0812": "运营三中心", // 东南山
                            "M0813": "运营三中心", // 闫家山
                            "M0418": "运营三中心", // 西吴家村
                            "M0817": "运营三中心", // 澳柯玛桥
                            "M0316": "运营三中心", // 五四广场
                            "M0712": "运营一中心", // 东郭庄
                            "M0112": "运营一中心", // 兴国路
                            "M0303": "运营三中心", // 振华路
                            "M0141": "运营一中心", // 王家港
                            "M0221": "运营二中心", // 麦岛
                            "M0314": "运营三中心", // 宁夏路
                            "M0421": "运营二中心", // 昌乐路
                            "M0117": "运营一中心", // 胜利桥(纺织谷)
                            "M0308": "运营三中心", // 地铁大厦
                            "M0412": "运营二中心", // 大埠东
                            "M0217": "运营二中心", // 石老人浴场
                            "M0214": "运营二中心", // 辽阳东路
                            "M0312": "运营三中心", // 错埠岭
                            "M0122": "运营一中心", // 海泊桥(海慈医疗)
                            "M0230": "运营二中心", // 泰山路
                            "M0125": "运营一中心", // 观象山(市立医院)
                            "M0321": "运营三中心", // 人民会堂
                            "M0305": "运营二中心", // 李村
                            "M0322": "运营三中心", // 青岛站
                            "M0228": "运营二中心"  // 台东
                        };

                        const relatedLinesInfo = context.relatedLinesInfo || [];
                        const stationId = context.station?.id;
                        const stationOperator = stationOperatorOverrides[stationId];
                        let opInfoHtml = '';

                        relatedLinesInfo.forEach(info => {
                            const styleStr = info.svgclr
                                ? `height:28px; width:auto; vertical-align:middle; margin-right:10px; margin-top:3px; --svgclr:${info.svgclr}; --svgtext:${info.svgtext};`
                                : 'height:28px; width:auto; vertical-align:middle; margin-right:10px; margin-top:3px;';
                            const iconHtml = info.svg
                                ? `<span class="svg-icon-placeholder line-badge" data-src="${info.svg}" style="${styleStr}"></span>`
                                : `<span class="text-badge" style="font-size:10px; margin-right:10px; vertical-align:middle;">${info.name}</span>`;
                            const company = stationOperator || info.company || '未知运营';

                            opInfoHtml += `
                                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; padding-left:10px;">
                                    ${iconHtml}
                                    <span style="font-size:13px; color:var(--text-main); font-weight:bold; text-align:right;">${company}</span>
                                </div>
                            `;
                        });

                        return `
                            <div style="margin-bottom:5px; font-size:13px;">
                                <div class="info-label" style="margin-bottom:8px;">运营单位</div>
                                ${opInfoHtml}
                            </div>
                        `;
                    }
                },
                                'qingdao-engineering-name-notice': { enabled: true, targetTab: 'line-tab', order: 21 },
                'qingdao-line-timetable': { enabled: true, targetTab: 'line-tab', order: 22 },
                'qingdao-construction-progress': { enabled: true, targetTab: 'line-tab', order: 24 },
                'adjacent-stations': {
                    enabled: true,
                    targetTab: 'line-tab',
                    order: 20,
                    render(context) {
                        const isMergeStation = context.isMergeStation;
                        const lineInfo = context.lineInfo || {};
                        const shouldHideNone = isMergeStation || lineInfo.isRwy;
                        const createRow = (label, value) => {
                            if (isMergeStation && value === "无") return "";
                            return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value" style="line-height:1.4;">${value}</span></div>`;
                        };
                        let stopsHtml = '';
                        if (lineInfo.prev && !(shouldHideNone && lineInfo.prev === "无")) {
                            stopsHtml += createRow("上一站", lineInfo.prev);
                        }
                        if (lineInfo.next && !(shouldHideNone && lineInfo.next === "无")) {
                            stopsHtml += createRow(lineInfo.nextLabel || "下一站", lineInfo.next);
                        }
                        return stopsHtml;
                    }
                }
            }
        }
    };

    if (typeof document !== "undefined" && typeof document.write === "function") {
        document.write('<scr' + 'ipt src="./city/qingdao/data_station_names.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_station_name_history.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/data_construction.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_engineering_name_notice.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_timetable.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_construction.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
    }

    window.QINGDAO_CITY = QingdaoCity;
    window.CURRENT_CITY = QingdaoCity;
    window.CityDataManager?.registerCity?.({
        id: QingdaoCity.id,
        name: QingdaoCity.name,
        folder: "./city/qingdao",
        mainLogic: "./city/qingdao/qingdao.js",
        center: QingdaoCity.center,
        defaultScale: QingdaoCity.defaultScale,
        mapSize: QingdaoCity.mapSize,
        searchCity: QingdaoCity.searchCity,
        title: "CGo OpenMap - 青岛轨道交通线路图",
        keywords: "CGo OpenMap, 青岛地铁, 青岛轨道交通, 线路图",
        description: "由 CGo OpenMap 驱动的青岛轨道交通智能交互线路图，包含在运营 8 条线路和在建 8 段线路。",
        officialMapUrl: QingdaoCity.officialMapUrl,
        isDefault: false,
        ...QingdaoCity
    });

    console.log("[QingdaoCity] 青岛城市模块加载完成。");
})();
