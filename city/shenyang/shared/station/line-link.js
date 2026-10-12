/**
 * CGo OpenMap - 线路接续声明解析（共享层）
 *
 * ⚠️ 临时共享位置：与 route-data.js、route-planner.js 等同处 city/shenyang/shared/，
 * 计划随共享层整体迁入 core/。
 *
 * 为什么需要它
 *   同一条走廊上由两条线路接续运行（如大连 3 号线支线 ⇄ 13 号线在九里贯通）时，
 *   引擎默认会把「换到另一条线」当成一次换乘。各城原先各自写特例来抹平，
 *   这里把「哪两条线在哪个站接续、是不是贯通运行」收敛成一份声明，
 *   机制（规划不计换乘、车站详情合并展示、时刻表成组）全部由共享层实现，
 *   声明里不出现任何具体线路 ID，本文件也不认任何城市。
 *
 * 声明格式（city/{city}.js 的 lineLinks）
 *   lineLinks: [{
 *       id,            // 声明标识，缺省用 lineIds 拼
 *       lineIds,       // 相接的线路；**第一项为主条目**，其余并入它
 *       at,            // 相接 / 衔接车站 ID
 *       ownerLineId,   // 衔接站归属哪条线，缺省取 lineIds[0]
 *       name,          // 接续后的显示名，缺省沿用主条目原名
 *       keepBadges,    // true：被并入的线路仍以徽标形式保留（如支线标识）
 *       through        // true：贯通运行——同一列车直通，通过衔接站不记换乘
 *   }]
 *
 * 两类声明的分工
 *   through: true  —— 贯通运行。整条贯通区段的站点在详情里统一显示为一个贯通线名，
 *                     且规划内核在衔接站把它们视作同一列车（不计换乘、无换乘耗时）。
 *   through 省略   —— 仅车站级合并展示（如主线与其支线在分叉站合成一行）。
 */
(function () {
    "use strict";

    /** 取当前城市的声明；页面一城一实例，不做缓存以便城市切换后依然正确 */
    function list() {
        const city = window.CURRENT_CITY || window.getCurrentCityData?.() || null;
        const entries = Array.isArray(city?.lineLinks) ? city.lineLinks : [];
        return entries.map(normalize).filter(Boolean);
    }

    function normalize(entry) {
        const lineIds = (entry?.lineIds || []).map(String).filter(Boolean);
        if (lineIds.length < 2 || !entry?.at) return null;
        return {
            id: String(entry.id || lineIds.join("-")),
            lineIds,
            mainLineId: lineIds[0],
            at: String(entry.at),
            ownerLineId: String(entry.ownerLineId || lineIds[0]),
            name: entry.name ? String(entry.name) : "",
            keepBadges: Boolean(entry.keepBadges),
            through: Boolean(entry.through)
        };
    }

    /** 该站上的接续声明（车站级合并用） */
    function atStation(stationId) {
        const sid = String(stationId ?? "");
        return sid ? list().filter((link) => link.at === sid) : [];
    }

    /** 该线路参与的接续声明（时刻表成组、面板判断用） */
    function ofLine(lineId) {
        const lid = String(lineId ?? "");
        return lid ? list().filter((link) => link.lineIds.includes(lid)) : [];
    }

    /**
     * 贯通衔接对，供规划内核建「直通」关系：衔接站上 from / to 两条线互为同一列车。
     * 双向各生成一条——贯通车的两个行驶方向都要能直通。
     */
    function throughPairs() {
        const pairs = [];
        list().filter((link) => link.through).forEach((link) => {
            link.lineIds.forEach((from) => link.lineIds.forEach((to) => {
                if (from !== to) pairs.push({ at: link.at, from, to, name: link.name });
            }));
        });
        return pairs;
    }

    /**
     * 把若干条线路条目并入主条目（在 relatedLinesInfo 上原地改写）
     * @param {Array} lines relatedLinesInfo
     * @param {Object} main 保留的主条目
     * @param {Array} rest 被并入的条目
     * @param {Object} link 声明
     */
    function absorb(lines, main, rest, link) {
        rest.forEach((other) => {
            main.svg ||= other.svg;
            main.svgclr ||= other.svgclr;
            main.svgtext ||= other.svgtext;
            main.company ||= other.company;
            main.scheduleUrl ||= other.scheduleUrl;
            main.lineColor ||= other.lineColor;
        });

        if (link.through) {
            // 贯通是一条跨两线的链，而衔接站的两个邻居分属两条线：主条目那一侧接在链的起点方向，
            // 接续线那一侧接在终点方向。这里必须**重排**而不是「缺省才补」——
            // 两条线都是「从衔接站出发」的站序，邻居都记在各自的 next 上，
            // 沿用补缺逻辑会只认下 main 的 next，把接续线那一侧的邻居整个丢掉
            // （九里站因此看不到十三里）。
            const neighbor = (info) => {
                if (!info) return "";
                return info.prev && info.prev !== "无" ? String(info.prev) : String(info.next || "");
            };
            main.prev = neighbor(main) || "无";
            if (rest.length) main.next = neighbor(rest[0]) || "无";
        } else {
            rest.forEach((other) => {
                if (!main.prev || main.prev === "无") main.prev = other.prev;
                if (!main.next || main.next === "无") main.next = other.next;
            });
        }

        if (link.name) main.name = link.name;
        rest.forEach((other) => {
            if (link.keepBadges) {
                other.isPointOnly = true;      // 仅保留徽标，不再单列上下站
                return;
            }
            const index = lines.indexOf(other);
            if (index >= 0) lines.splice(index, 1);
        });
    }

    /**
     * 车站详情里的线路条目合并（在 relatedLinesInfo 上原地改写）。
     *
     * 两条规则：
     *   ① 命中 at 的车站，按声明把 lineIds[1..] 并入 lineIds[0]；
     *   ② 贯通区段内「只属于贯通线路」的车站，统一显示为贯通线名——
     *      若该站还停靠着别的线（如贯通的一端同时是另一条线的分叉站），则不在此处理，
     *      交给 ① 或它自身的合并声明，免得把不相关的线也卷进来。
     */
    function mergeStationLines(station, relatedLinesInfo) {
        if (!station || !Array.isArray(relatedLinesInfo) || !relatedLinesInfo.length) return;
        const idOf = (info) => String(info?.id ?? "");
        const pick = (lineId) => relatedLinesInfo.find((info) => idOf(info) === String(lineId));
        const at = atStation(station.id);

        at.forEach((link) => {
            const main = pick(link.mainLineId);
            if (!main) return;
            const rest = link.lineIds.slice(1).map(pick).filter(Boolean);
            if (rest.length) absorb(relatedLinesInfo, main, rest, link);
        });

        const presentIds = relatedLinesInfo.map(idOf);
        list().filter((link) => link.through && link.at !== String(station.id)).forEach((link) => {
            // 只在「站上的线全部属于这条贯通」时改名，避免波及换乘站上的其它线路
            if (!presentIds.length || !presentIds.every((id) => link.lineIds.includes(id))) return;
            // 归属线优先取声明的归属，其次主条目，再次站上实际存在的那条贯通线
            // （贯通区段中间站只停靠其中一条，前两者都取不到）
            const owner = pick(link.ownerLineId) || pick(link.mainLineId)
                || relatedLinesInfo.find((info) => link.lineIds.includes(idOf(info)));
            if (!owner) return;
            absorb(relatedLinesInfo, owner, relatedLinesInfo.filter((info) => info !== owner), link);
        });
    }

    window.CGoLineLink = { list, atStation, ofLine, throughPairs, mergeStationLines };
})();
