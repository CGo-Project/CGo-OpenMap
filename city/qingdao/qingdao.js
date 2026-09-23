/**
 * CGo OpenMap - 青岛城市配置
 * 采用用户实测坐标；所有已录入坐标统一扩大 5 倍。
 */
(function () {
    "use strict";

    // 青岛地图上的综合交通换乘图标为固定黑色 SVG。
    // 延续基线实现：暗色主题仅做黑白反转；素材本身为纯黑，因此无需 brightness(0) 强制归零。
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

    /** 载入青岛城市专属样式表（线路层级、换乘图元、交通图标主题适配） */
    (function loadCityStylesheet() {
        const href = "./city/qingdao/style.css";
        if (document.querySelector(`link[href^="${href}"]`)) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";

        const v = window.CGO_ASSET_VERSION;
        link.href = v ? `${href}?v=${v}` : href;
        document.head.appendChild(link);
    })();

    document.documentElement.classList.add("map-qingdao");

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

        // 未来换乘站的视觉状态：当前仅开通其中一条线路时，地图上先按普通站绘制。
        // 不修改 stationsData 中的 type，也不修改线路归属，因此点击站点时仍会显示全部线路。
        // 双线均未开通的未来换乘站：保留 no 状态，但将未开通车站图标放大，
        // 以区别于普通未开通站；点击站点时仍按原 relatedLines 显示全部线路。
        FUTURE_TRANSFER_NONE_OPEN: {
            "M0812": true, // 东南山：8号线、7号线均未开通
            "M0208": true  // 下王埠(外贸学院)：2号线二期、15号线均未开通
        },

        FUTURE_TRANSFER_SINGLE_OPEN: {
            "M0112": "QDM01", // 兴国路：1号线已开通，7号线未来
            "M0117": "QDM01", // 胜利桥(纺织谷)：1号线已开通，5号线未来
            "M0217": "QDM02", // 石老人浴场：2号线已开通，5号线未来
            "M0221": "QDM02", // 麦岛：2号线已开通，5号线未来
            "M0303": "QDM03", // 振华路：3号线已开通，7号线未来
            "M0308": "QDM03", // 地铁大厦：3号线已开通，5号线未来
            "M0314": "QDM03", // 宁夏路：3号线已开通，5号线未来
            "M0412": "QDM04", // 大埠东：4号线已开通，5号线未来
            "M0421": "QDM04", // 昌乐路：4号线已开通，5号线未来
            "M0713": "QDM01", // 沟岔：1号线已开通，15号线未来
            "M0715": "QDM01", // 正阳中路：1号线已开通，9号线未来
            "M1312": "QDM06", // 双珠路：6号线已开通，13号线未来
            "M1108": "QDM11", // 世博园：11号线已开通，2号线未来
            "M0813": "QDM08", // 闫家山：8号线已开通，5号线未来
            "M0817": "QDM08"  // 澳柯玛桥：8号线已开通，5号线未来
        },

        renderStationIcon(station) {
            // 青岛统一接管站点图元：彻底绕开核心 tsf 图元中的换乘箭头。
            // 普通未开通站继续回落到 core/station-icons.js 的原生 no 图元。
            // 仅下王埠、东南山两座“全部线路均未开通”的未来换乘站使用 17.5px 专用 no 图元。
            const isNoneOpenTransfer = station && this.FUTURE_TRANSFER_NONE_OPEN?.[station.id];
            if (isNoneOpenTransfer) {
                // 下王埠、东南山：沿用核心 no 图元的三层实现方式：
                // 白色遮线路底圆 → 用户绘制的 17.5px 未开通齿轮 → 白色中心圆。
                // 齿轮 path 保持 Illustrator 原稿，不在代码中二次缩放或重算。
                const gearPath = 'M13.8,8.3l3-0.2c0-0.7-0.2-1.3-0.4-1.9l-2.8,1l-0.3-0.8l2.7-1.3c-0.3-0.6-0.7-1.1-1.1-1.6l-2.2,2L12,4.9l2-2.2 c-0.5-0.4-1-0.8-1.6-1.1l-1.3,2.7L10.3,4l1-2.8C10.6,1,10,0.8,9.3,0.8l-0.2,3H8.3l-0.2-3C7.5,0.8,6.9,1,6.3,1.2l1,2.8L6.4,4.3 L5.1,1.6C4.6,1.9,4,2.3,3.5,2.7l2,2.2L4.9,5.5l-2.2-2C2.3,4,1.9,4.6,1.6,5.1l2.7,1.3L4,7.2l-2.8-1C1,6.9,0.8,7.5,0.8,8.2l3,0.2v0.9 l-3,0.2c0,0.7,0.2,1.3,0.4,1.9l2.8-1l0.3,0.8l-2.7,1.3c0.3,0.6,0.7,1.1,1.1,1.6l2.2-2l0.6,0.6l-2,2.2c0.5,0.4,1,0.8,1.6,1.1l1.3-2.7 l0.8,0.3l-1,2.8c0.6,0.2,1.2,0.3,1.9,0.4l0.2-3h0.9l0.2,3c0.7,0,1.3-0.2,1.9-0.4l-1-2.8l0.8-0.3l1.3,2.7c0.6-0.3,1.1-0.7,1.6-1.1 l-2-2.2l0.6-0.6l2.2,2c0.4-0.5,0.8-1,1.1-1.6l-2.7-1.3l0.3-0.8l2.8,1c0.2-0.6,0.3-1.2,0.4-1.9l-3-0.2V8.3z';
                return {
                    width: 17.5,
                    height: 17.5,
                    html: `<svg viewBox="0 0 17.5 17.5" width="17.5" height="17.5" aria-hidden="true">` +
                        `<circle cx="8.75" cy="8.75" r="8.75" style="fill:var(--map-bg);"/>` +
                        `<path d="${gearPath}" style="fill:var(--not-open-color);"/>` +
                        `<circle cx="8.75" cy="8.75" r="7.1" style="fill:var(--map-bg);"/>` +
                    `</svg>`
                };
            }

            // 未来换乘但当前仅开通一条线路的站点，视觉上按普通站绘制；
            // stationsData.type / relatedLines 不做任何修改，因此点击后仍保留全部线路。
            const openLineId = station && this.FUTURE_TRANSFER_SINGLE_OPEN?.[station.id];
            if (openLineId) {
                const line = (typeof linesData !== "undefined") ? linesData.find(l => l.id === openLineId) : null;
                const color = line?.color || "var(--station-stroke)";
                return {
                    width: 10,
                    height: 10,
                    html: `<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" style="fill:var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:${color};"/><circle cx="5" cy="5" r="3.5" style="fill:var(--map-bg);"/></svg>`
                };
            }

            // 所有真正的换乘站均使用无箭头双圆环。
            if (station?.type === "tsf") {
                return {
                    width: 17.5,
                    height: 17.5,
                    html: `<svg viewBox="0 0 17.5 17.5" aria-hidden="true"><circle cx="8.75" cy="8.75" r="8.75" style="fill:var(--map-bg);"/><circle cx="8.75" cy="8.75" r="8" style="fill:var(--station-stroke);"/><circle cx="8.75" cy="8.75" r="7.1" style="fill:var(--map-bg);"/></svg>`
                };
            }

            return null;
        },
        SUBURBAN_LINES: [],
        MERGE_STATIONS: [],
        CROSS_PLATFORM_STATIONS: [],

        // 青岛不展示由线路示意图坐标推算出的“约 xx 米”。
        // 核心会在调用本城市钩子前组装 relatedLinesInfo，因此只在城市侧
        // 删除估算距离的 span；data_lines.js 中真实 distances 生成的“(xxxx米)”保留。
        handleLineMerge(station, relatedLinesInfo) {
            const stripEstimatedDistance = (html) => {
                if (typeof html !== "string") return html;
                return html.replace(
                    /\s*<span[^>]*>\(约[\d,.]+米\)<\/span>/g,
                    ""
                );
            };

            (relatedLinesInfo || []).forEach((info) => {
                info.prev = stripEstimatedDistance(info.prev);
                info.next = stripEstimatedDistance(info.next);
            });
        },
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
                "modules/qingdao_travel_guide.js",
                "modules/qingdao_engineering_name_notice.js",
                "modules/qingdao_timetable.js",
                "modules/qingdao_construction.js",
                "modules/qingdao_line_badges.js"
            ],
            modules: {
                'qingdao-station-name-history': { enabled: true, targetTab: 'station-info', order: 15 },
                'qingdao-travel-guide': { enabled: true, targetTab: 'station-info', order: 14 },
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
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_travel_guide.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/data_construction.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_engineering_name_notice.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_timetable.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_construction.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/qingdao/modules/qingdao_line_badges.js?v=' + Date.now() + '"><\/scr' + 'ipt>');
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
        description: "包含当前运营的 1、2、3、4、6、8 号线及蓝谷快线、西海岸快线，并涵盖青岛轨道交通三期规划在建线路。",
        officialMapUrl: QingdaoCity.officialMapUrl,
        isDefault: false,
        ...QingdaoCity
    });

    console.log("[QingdaoCity] 青岛城市模块加载完成。");
})();
