/**
 * CGo OpenMap - 厦门城市专属模块：快速公交快线路查询
 * (city/xiamen/modules/xiamen_brt_routes.js)
 *
 * 厦门快速公交实际营运快1/2/3/5/6/7/8/9 八条线路：它们共用专用道与车站，只是起讫点与
 * 经由走廊不同。线路图上 BRT 是**一条线 + 8 条交路**（见 city/xiamen/data_lines.js 的 BRT
 * 条目：way1…way8 = 快1…快9 路，站序与站距全部写在交路上），因此
 * 「本站能坐哪几条快线路、本站是起点/终点/途经、相邻站隔多少米」完全由交路模型
 * （core/line-routing.js）推导，本模块不另存第二份快线路数据。
 *
 * 本模块做两件事：
 *   1. 「运营单位」按公司合并（同属一家公司时只显示一行一个徽标）；
 *   2. 车站信息页签汇总经停本站的快X路，标出本站是起点 / 终点 / 途经与相邻站站距。
 *
 * 说明：BRT 各站在 data_stations.js 中一律为 type: "dot"，核心按车站类型判定换乘站，
 * 因此所有 BRT 车站都不会被画成换乘站；地图上点某个 BRT 车站时，核心会按交路模型
 * 只点亮经停本站的那几条快线路（见 core/script.js 的 highlightLine）。
 */

(function () {
    "use strict";

    var BRT_LINE_ID = "BRT";

    /** BRT 线路条目（data_lines.js 在核心引擎执行前已同步加载） */
    function brtLine() {
        var list = null;
        if (typeof linesData !== "undefined" && Array.isArray(linesData)) list = linesData;
        else if (typeof window !== "undefined" && Array.isArray(window.linesData)) list = window.linesData;
        if (!list) return null;
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === BRT_LINE_ID) return list[i];
        }
        return null;
    }

    /** 交路模型（core/line-routing.js） */
    function routing() {
        return (typeof window !== "undefined" && window.CGoLineRouting) || null;
    }

    function allStations() {
        if (typeof stationsData !== "undefined" && stationsData) return stationsData;
        if (typeof window !== "undefined" && window.stationsData) return window.stationsData;
        return null;
    }

    function stationName(id) {
        var dict = allStations();
        var s = dict && dict[id];
        return (s && (s.cn || s.en)) || id;
    }

    /**
     * 站键 → [{ name, from, to, role, prev, prevDist, next, nextDist }]
     * 首次计算后缓存；交路数据是静态的，加载完成后不会再变。
     */
    var stationIndex = null;
    function index() {
        if (stationIndex) return stationIndex;
        var line = brtLine();
        var R = routing();
        if (!line || !R) return null;               // 数据或交路模块还没就绪：下次再试
        var ways = R.ways(line);
        if (!ways.length) return null;

        var dict = allStations() || {};
        var map = {};
        ways.forEach(function (way, wi) {
            var ids = way.ids || [];
            if (!ids.length) return;
            var name = R.wayLabel(line, way, dict) || ("交路" + (wi + 1));
            var dists = way.distances || [];
            var from = stationName(ids[0]);
            var to = stationName(ids[ids.length - 1]);
            ids.forEach(function (sid, i) {
                if (!map[sid]) map[sid] = [];
                map[sid].push({
                    name: name,
                    from: from,
                    to: to,
                    role: i === 0 ? "起点" : (i === ids.length - 1 ? "终点" : "途经"),
                    prev: i > 0 ? stationName(ids[i - 1]) : "",
                    prevDist: i > 0 ? dists[i - 1] : null,
                    next: i < ids.length - 1 ? stationName(ids[i + 1]) : "",
                    nextDist: i < ids.length - 1 ? dists[i] : null
                });
            });
        });
        stationIndex = map;
        return stationIndex;
    }

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function distText(d) {
        if (d === null || d === undefined || d === "") return "";
        var n = Number(d);
        return isFinite(n) ? "（" + n + "米）" : "（" + esc(d) + "）";
    }

    function routeBlock(r) {
        var accent = (brtLine() && brtLine().color) || "#00afad";
        var ends = r.from + " ⇄ " + r.to;
        var adj = [];
        if (r.prev) adj.push("上一站 " + esc(r.prev) + " " + distText(r.prevDist));
        if (r.next) adj.push("下一站 " + esc(r.next) + " " + distText(r.nextDist));
        return '<div style="padding:4px 0; border-top:1px dashed var(--divider);">' +
            '<div style="display:flex; align-items:baseline; gap:6px;">' +
            '<span style="flex:0 0 auto; font-weight:700; color:' + accent + ';">' + esc(r.name) + '</span>' +
            '<span style="flex:1 1 auto; color:var(--text-light); font-size:11px;">' + esc(ends) + '</span>' +
            '<span style="flex:0 0 auto; font-size:10.5px; color:var(--text-light);">' + esc(r.role) + '</span>' +
            '</div>' +
            (adj.length ? '<div style="margin-top:2px; color:var(--text-main); font-size:11px;">' + adj.join('　·　') + '</div>' : '') +
            '</div>';
    }

    // ---------------------------------------------------------------------
    // 1. 「运营单位」按公司合并：同属一家公司时只显示一行一个徽标
    //    （同 id 覆盖核心内置模块 operators；核心先加载，城市脚本后加载生效）
    // ---------------------------------------------------------------------
    if (window.StationBoard && typeof window.StationBoard.registerModule === "function") {
        window.StationBoard.registerModule({
            id: "operators",
            name: "运营单位（厦门：按公司合并）",
            targetTab: "station-info",
            order: 20,
            render: function (context) {
                var list = (context && context.relatedLinesInfo) || [];
                var groups = [];
                list.forEach(function (info) {
                    var company = info.company || "未知运营";
                    var group = null;
                    groups.forEach(function (g) { if (g.company === company) group = g; });
                    if (!group) { group = { company: company, badges: [], seen: {} }; groups.push(group); }
                    var key = info.svg || info.name || info.id;
                    if (group.seen[key]) return;          // 同一家公司下的相同徽标只留一个
                    group.seen[key] = true;
                    group.badges.push(info);
                });
                var rows = groups.map(function (group) {
                    var icons = group.badges.map(function (info) {
                        var styleStr = info.svgclr
                            ? "height:28px; width:auto; vertical-align:middle; margin-right:10px; margin-top:3px; --svgclr:" + info.svgclr + "; --svgtext:" + info.svgtext + ";"
                            : "height:28px; width:auto; vertical-align:middle; margin-right:10px; margin-top:3px;";
                        return info.svg
                            ? '<span class="svg-icon-placeholder line-badge" data-src="' + info.svg + '" style="' + styleStr + '"></span>'
                            : '<span class="text-badge" style="font-size:10px; margin-right:10px; vertical-align:middle;">' + esc(info.name) + '</span>';
                    }).join("");
                    return '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; padding-left:10px;">' +
                        icons +
                        '<span style="font-size:13px; color:var(--text-main); font-weight:bold; text-align:right;">' + esc(group.company) + '</span>' +
                        '</div>';
                }).join("");
                return '<div style="margin-bottom:5px; font-size: 13px;">' +
                    '<div class="info-label" style="margin-bottom:8px;">运营单位</div>' +
                    rows +
                    '</div>';
            }
        });
    }

    // ---------------------------------------------------------------------
    // 2. 车站信息板模块：经停本站的快速公交快线路（含本站角色与相邻站站距）
    // ---------------------------------------------------------------------
    if (window.StationBoard && typeof window.StationBoard.registerModule === "function") {
        window.StationBoard.registerModule({
            id: "xiamen-brt-routes",
            name: "快速公交快线路",
            targetTab: "station-info",
            order: 14,
            shouldRender: function (context) {
                var id = context && context.station && context.station.id;
                var idx = index();
                return Boolean(id && idx && idx[id]);
            },
            render: function (context) {
                var id = context && context.station && context.station.id;
                var idx = index();
                var list = (id && idx && idx[id]) || [];
                if (!list.length) return "";
                list = list.slice().sort(function (a, b) {
                    return String(a.name).localeCompare(String(b.name), "zh-Hans-CN", { numeric: true });
                });
                return '<div style="margin:0 0 15px; padding:8px 10px; background:var(--card-sub-bg); border-radius:6px; font-size:11.5px; line-height:1.5;">' +
                    '<div style="font-weight:600; color:var(--text-main); display:inline-flex; align-items:center; gap:4px; margin-bottom:2px;">' +
                    '<cgo-icon name="bus" size="13"></cgo-icon><span>经停快速公交线路（' + list.length + ' 条）</span>' +
                    '</div>' +
                    list.map(routeBlock).join("") +
                    '<div style="margin-top:5px; color:var(--text-light); font-size:10px;">' +
                    '快速公交在图上是同一条线（共用专用道与车站）；点本站只会点亮经停本站的快线路。' +
                    '站序按专用道网络推算，如与现场站牌不一致以厦门公交集团公告为准。</div>' +
                    '</div>';
            }
        });
    }

    console.log("[XiamenBRT] 快速公交快线路模块加载完成（站序来自 data_lines.js 的 BRT 交路）");
})();
