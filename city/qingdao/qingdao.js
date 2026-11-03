/**
 * CGo OpenMap - 青岛城市配置
 * 采用用户实测坐标；所有已录入坐标统一扩大 5 倍。
 */
(function () {
    "use strict";


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

    // Qingdao sea SVG theme adaptation is a rendering behavior, not data.
    if (typeof document !== "undefined") {
        // Sea theme colors. Manual app theme wins; when no data-theme exists yet,
        // follow the operating-system color scheme as a startup fallback.

        // SCATTERED_DATA normally renders external SVG files as <img>. For the sea only,
        // replace that image with an inline SVG after it appears. This lets the SVG use
        // page-level CSS variables, like the project's inline line badges do.
        const inlineQingdaoSea = async () => {
            const img = document.querySelector('#scattered-layer img[src*="qingdao_sea.svg"]');
            if (!img || img.dataset.qingdaoInlining === "1") return false;
            img.dataset.qingdaoInlining = "1";
            try {
                const response = await fetch(img.src);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const text = await response.text();
                const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
                const sourceSvg = parsed.documentElement;
                if (!sourceSvg || sourceSvg.nodeName.toLowerCase() !== "svg") {
                    throw new Error("Invalid SVG");
                }
                const svg = document.importNode(sourceSvg, true);
                svg.classList.add("qingdao-sea-inline");
                svg.setAttribute("aria-hidden", "true");
                svg.removeAttribute("width");
                svg.removeAttribute("height");
                img.replaceWith(svg);
                return true;
            } catch (error) {
                // Keep the original external SVG as a graceful fallback. Its own
                // prefers-color-scheme rule still follows the system theme.
                img.removeAttribute("data-qingdao-inlining");
                console.warn("[Qingdao] Sea SVG inline injection failed:", error);
                return false;
            }
        };

        const startSeaObserver = () => {
            inlineQingdaoSea().then(done => {
                if (done) return;
                const observer = new MutationObserver(async () => {
                    if (await inlineQingdaoSea()) observer.disconnect();
                });
                observer.observe(document.documentElement, { childList: true, subtree: true });
            });
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", startSeaObserver, { once: true });
        } else {
            startSeaObserver();
        }
    }



    // 海域越界补绘由 style.css 作为 map-content 的伪元素绘制，
    // 与地图共用同一个 transform，避免视口层在动画期间错位。

    const QingdaoCity = {
        id: "qingdao",
        name: "青岛",
        searchCity: "青岛",
        center: { x: 1350, y: 1125 },
        defaultScale: 1.45,
        mapSize: { width: 2700, height: 2250 },
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

        // 青岛不展示由线路示意图坐标自动推算出的“约 xx 米”。
        // 但 data_lines.js 允许人工录入“约2700”这类近似站间距；这类数据应保留。
        // 因此先判断相邻区间是否存在有效的显式 distances，再决定是否删除估算 span。
        handleLineMerge(station, relatedLinesInfo) {
            const hasExplicitDistance = (dist) => {
                if (dist === undefined || dist === null) return false;
                const value = String(dist).trim();
                return value !== "" && value !== "0" && value !== "?" && value !== "??";
            };
            const stripEstimatedDistance = (html) => {
                if (typeof html !== "string") return html;
                return html.replace(
                    /\s*<span[^>]*>\(约[\d,.]+米\)<\/span>/g,
                    ""
                );
            };
            const explicitSides = (line, stationId) => {
                const result = { prev: false, next: false };
                if (!line || !stationId) return result;

                if (line.hasbranch) {
                    const groups = [
                        { ids: line["stationIds-way1"] || [], dists: line["distances-way1"] || line.distances || [] },
                        { ids: line["stationIds-way2"] || [], dists: line["distances-way2"] || [] }
                    ];
                    for (const group of groups) {
                        const idx = group.ids.indexOf(stationId);
                        if (idx === -1) continue;
                        if (idx > 0) result.prev = hasExplicitDistance(group.dists[idx - 1]);
                        if (idx < group.ids.length - 1) result.next = hasExplicitDistance(group.dists[idx]);
                        return result;
                    }
                    return result;
                }

                const ids = line.stationIds || [];
                const dists = line.distances || [];
                const distsReverse = line.distances2;
                const idx = ids.indexOf(stationId);
                if (idx === -1) return result;

                if (line.isLoop === true && ids.length) {
                    const prevIdx = (idx - 1 + ids.length) % ids.length;
                    const prevDist = (distsReverse && distsReverse[prevIdx] !== undefined)
                        ? distsReverse[prevIdx] : dists[prevIdx];
                    result.prev = hasExplicitDistance(prevDist);
                    result.next = hasExplicitDistance(dists[idx]);
                    return result;
                }

                if (idx > 0) {
                    const prevDist = (distsReverse && distsReverse[idx - 1] !== undefined)
                        ? distsReverse[idx - 1] : dists[idx - 1];
                    result.prev = hasExplicitDistance(prevDist);
                }
                if (idx < ids.length - 1) result.next = hasExplicitDistance(dists[idx]);
                return result;
            };

            const allLines = (typeof window !== "undefined" && Array.isArray(window.linesData))
                ? window.linesData : [];
            (relatedLinesInfo || []).forEach((info) => {
                const line = allLines.find((item) => item.id === info.id);
                const explicit = explicitSides(line, station?.id);
                if (!explicit.prev) info.prev = stripEstimatedDistance(info.prev);
                if (!explicit.next) info.next = stripEstimatedDistance(info.next);
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
            const cleanStationName = String(stationName || "")
                .replace(/<br\s*\/?\s*>/gi, "")
                .replace(/\s+/g, " ")
                .trim();
            const query = isRailway ? cleanStationName : `${cleanStationName}(地铁站)`;
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
            modules: {
                'header-title': {
                    enabled: true,
                    slot: 'header',
                    order: 20,
                    render(context) {
                        const station = context.station || {};

                        // 仅在更新浏览器标题/分享元数据时转为纯文本；地图与信息卡仍使用原始站名。
                        const updateShareMeta = context.helpers?.updateShareMeta;
                        if (typeof updateShareMeta === "function" && !updateShareMeta.__qingdaoPlainName) {
                            const wrappedUpdateShareMeta = function (targetStation) {
                                if (!targetStation) {
                                    return updateShareMeta.call(this, targetStation);
                                }
                                const plainName = window.CGoA11y?.plainName;
                                // 标题中直接删除地图/信息卡换行标记，不在副站名前插入空格。
                                const titleSource = String(targetStation.cn == null ? "" : targetStation.cn)
                                    .replace(/<br\s*\/?\s*>/gi, "")
                                    .replace(/\r?\n/g, "");
                                const cleanCn = typeof plainName === "function"
                                    ? plainName(titleSource)
                                    : titleSource
                                        .replace(/<[^>]*>/g, "")
                                        .replace(/\s+/g, " ")
                                        .trim();
                                return updateShareMeta.call(this, {
                                    ...targetStation,
                                    cn: cleanCn
                                });
                            };
                            wrappedUpdateShareMeta.__qingdaoPlainName = true;
                            context.helpers.updateShareMeta = wrappedUpdateShareMeta;
                        }

                        const safeNameHtml = (value) => {
                            const helper = window.CGoA11y?.safeNameHtml;
                            if (typeof helper === "function") return helper(value);
                            const escaped = String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
                                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
                            })[ch]);
                            return escaped
                                .replace(/&lt;br\s*\/?&gt;/gi, "<br>")
                                .replace(/&lt;(\/?)(sup|sub)&gt;/gi, "<$1$2>");
                        };

                        // 信息卡统一使用 \n 换行；地图专用 <br> 不产生换行。
                        const renderCardName = (value) => {
                            const source = String(value == null ? "" : value);
                            const normalized = source
                                .replace(/<br\s*\/?\s*>/gi, (tag, offset, whole) => {
                                    const before = whole.slice(0, offset).trimEnd().slice(-1);
                                    const after = whole.slice(offset + tag.length).trimStart().charAt(0);
                                    const isCjk = ch => /[\u3400-\u9fff]/.test(ch || "");
                                    return isCjk(before) || isCjk(after) ? "" : " ";
                                })
                                .replace(/\r?\n/g, "<br>");
                            return safeNameHtml(normalized);
                        };

                        return `
                            <div class="header-name-group">
                                <div class="panel-cn-name" role="heading" aria-level="2" tabindex="-1">${renderCardName(station.cn)}</div>
                                <div class="panel-en-name" lang="en">${renderCardName(station.en)}</div>
                            </div>
                        `;
                    }
                },
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

                        // 上一站/下一站保留距离标注等内联 HTML，但不产生人工换行。
                        // <br> 与 \n 都只作为分隔标记；中文不加空格，英文单词间保留空格。
                        const renderAdjacentName = (value) => {
                            const source = String(value == null ? "" : value);
                            return source.replace(/<br\s*\/?\s*>|\r?\n/gi, (marker, offset, whole) => {
                                const beforeText = whole.slice(0, offset)
                                    .replace(/<[^>]*>/g, "").trimEnd();
                                const afterText = whole.slice(offset + marker.length)
                                    .replace(/<[^>]*>/g, "").trimStart();
                                const before = beforeText.slice(-1);
                                const after = afterText.charAt(0);
                                const isCjk = ch => /[\u3400-\u9fff]/.test(ch || "");
                                if (!before || !after) return "";
                                return isCjk(before) || isCjk(after) ? "" : " ";
                            });
                        };

                        const createRow = (label, value) => {
                            if (isMergeStation && value === "无") return "";
                            return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value" style="line-height:1.4;">${renderAdjacentName(value)}</span></div>`;
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
        const qingdaoResourceVersion = window.CGO_ASSET_VERSION || "";
        const qingdaoVersionedUrl = (path) => qingdaoResourceVersion
            ? `${path}?v=${encodeURIComponent(qingdaoResourceVersion)}`
            : path;
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/data_station_names.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/data_interval_times.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_interval_times.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_station_name_history.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_travel_guide.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/data_construction.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_construction_progress_map.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_engineering_name_notice.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_timetable.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_construction.js") + '"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="' + qingdaoVersionedUrl("./city/qingdao/modules/qingdao_line_badges.js") + '"><\/scr' + 'ipt>');
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
