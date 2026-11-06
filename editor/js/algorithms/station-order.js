/**
 * 开放地图编辑器 (OpenMap Editor) - 站序重建器（纯函数，零依赖）
 *
 * 背景：画布上的线路走向是由 `project.segments`（一段段带 nid 端点的折线）决定的，
 * 而导出给城市引擎的 `data_lines.js` 只有 `stationIds` 顺序 —— 引擎会按这个顺序
 * 依次连点成线。如果 `stationIds` 只是"点击/建站顺序"，导出的线路就会乱成一团
 * （编辑器画面正确、导出结果错误）。
 *
 * 这里的职责：**按线段拓扑把站序重排成真实的行车顺序**，
 * 让导出结果与画布所见一致，同时尽量保留原顺序里无法被拓扑覆盖的站点。
 */
window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.StationOrder = (function () {
    'use strict';

    function uniq(arr) {
        var seen = {};
        return (arr || []).filter(function (v) {
            if (!v || seen[v]) return false;
            seen[v] = true;
            return true;
        });
    }

    /**
     * 由线段拓扑重建站序。
     *
     * @param {string[]} stationIds 当前站序（点击顺序，可能错乱）
     * @param {Array<{points:Array<{x:number,y:number,nid?:string}>}>} segments 该线路的线段
     * @param {Object} [nodes] 车站坐标表（给了就按几何最近来拼接断开的多条链，避免导出时跨图拉长线）
     * @returns {{ids:string[], reordered:boolean, chainCount:number, leftover:string[], reason:string}}
     */
    function orderFromSegments(stationIds, segments, nodes) {
        var original = uniq(stationIds);
        var result = {
            ids: original.slice(),
            reordered: false,
            chainCount: 0,
            leftover: [],
            reason: ''
        };

        var orderIndex = {};
        original.forEach(function (id, i) { orderIndex[id] = i; });

        /* 1. 建立无向邻接表（只认两端都带 nid 的线段） */
        var adj = {};          // id -> [{ to, dir }]
        var nodesInGraph = {};
        var edgeCount = 0;
        (segments || []).forEach(function (seg) {
            var pts = seg && seg.points;
            if (!Array.isArray(pts) || pts.length < 2) return;
            // 逐个折点取它的 nid，把**相邻的两个有 nid 的折点**连成边。
            // 注意要允许"跳过中间没有 nid 的折点"：早期实现只连严格相邻的点，
            // 一旦某段折点的中转点没带 nid，整段就断链，站会被误判成"没有走向"。
            var prevNid = null;
            for (var i = 0; i < pts.length; i++) {
                var curNid = pts[i] && pts[i].nid;
                if (!curNid) continue;
                nodesInGraph[curNid] = true;              // 单独出现也登记为图节点
                if (prevNid && prevNid !== curNid) {
                    edgeCount++;
                    (adj[prevNid] = adj[prevNid] || []).push({ to: curNid, fromDir: true });
                    (adj[curNid] = adj[curNid] || []).push({ to: prevNid, fromDir: false });
                }
                prevNid = curNid;
            }
        });

        if (!edgeCount) {
            result.reason = 'no-segments';
            return result;
        }

        /* 2. 找出所有连通分量 */
        var visited = {};
        var components = [];
        Object.keys(nodesInGraph).forEach(function (start) {
            if (visited[start]) return;
            var stack = [start];
            var comp = [];
            visited[start] = true;
            while (stack.length) {
                var cur = stack.pop();
                comp.push(cur);
                (adj[cur] || []).forEach(function (e) {
                    if (!visited[e.to] && nodesInGraph[e.to]) {
                        visited[e.to] = true;
                        stack.push(e.to);
                    }
                });
            }
            components.push(comp);
        });

        /* 3. 每个分量沿链走一遍（优先从端点出发，环线从原顺序最靠前的点出发） */
        /**
         * 把一个连通分量走成链，**保证分量内的节点零遗漏**。
         *
         * 旧实现只从端点出发走一次，遇到分叉/环就提前 break，剩下的节点明明画了线段
         * 却被判为"没有走向"，进而被误从导出站序里剔除（数据损坏级问题）。
         * 现在：先走一条主链，再从分量里每个尚未走到的节点继续走，直到全部覆盖。
         */
        var chains = [];
        components.forEach(function (comp) {
            var compSet = {};
            comp.forEach(function (id) { compSet[id] = true; });
            var usedEdge = {};
            var visitedNode = {};
            function edgeKey(a, b) { return a < b ? (a + '|' + b) : (b + '|' + a); }
            function idxOf(id) { return orderIndex[id] === undefined ? 1e9 : orderIndex[id]; }

            function walkOne(startNode) {
                var path = [startNode];
                visitedNode[startNode] = true;
                var cur = startNode;
                var guard = 0;
                while (guard++ < comp.length * 4) {
                    var cands = (adj[cur] || []).filter(function (e) {
                        return compSet[e.to] && !usedEdge[edgeKey(cur, e.to)];
                    });
                    if (!cands.length) break;
                    var next = cands[0].to;
                    if (cands.length > 1) {
                        // 分叉（数据异常）：优先走没访问过的节点，再按原顺序接近度
                        var curIdx = idxOf(cur);
                        cands.sort(function (x, y) {
                            var vx = visitedNode[x.to] ? 1 : 0;
                            var vy = visitedNode[y.to] ? 1 : 0;
                            if (vx !== vy) return vx - vy;
                            return Math.abs(idxOf(x.to) - curIdx) - Math.abs(idxOf(y.to) - curIdx);
                        });
                        next = cands[0].to;
                    }
                    usedEdge[edgeKey(cur, next)] = true;
                    visitedNode[next] = true;
                    path.push(next);
                    cur = next;
                }
                return path;
            }

            // 1) 优先从端点起走（端点 = 度数为 1 的节点）
            var endpoints = comp.filter(function (id) { return (adj[id] || []).length === 1; });
            if (endpoints.length) {
                endpoints.sort(function (a, b) { return idxOf(a) - idxOf(b); });
                chains.push(walkOne(endpoints[0]));
            }
            // 2) 把分量内所有还没走到的节点继续走完（零遗漏保证）
            comp.slice().sort(function (a, b) { return idxOf(a) - idxOf(b); }).forEach(function (id) {
                if (visitedNode[id]) return;
                var p = walkOne(id);
                if (p.length > 1) chains.push(p);
            });
        });

        /* 4. 多条链的拼接顺序 */
        function coordOf(id) {
            var nd = nodes && nodes[id];
            return (nd && nd.x !== undefined && nd.y !== undefined) ? { x: nd.x, y: nd.y } : null;
        }
        function distOf(a, b) {
            var pa = coordOf(a), pb = coordOf(b);
            if (!pa || !pb) return Infinity;
            return Math.sqrt(Math.pow(pa.x - pb.x, 2) + Math.pow(pa.y - pb.y, 2));
        }

        if (nodes && chains.length > 1) {
            // 有坐标：按"链尾 → 下一条链头"的最近距离贪心串接，
            // 这样断开的两段在导出时不会跨图拉一条长斜线。
            var orderedChains = [];
            var pool = chains.slice();
            pool.sort(function (a, b) {
                var ia = Math.min.apply(null, a.map(function (id) { return orderIndex[id] === undefined ? 1e9 : orderIndex[id]; }));
                var ib = Math.min.apply(null, b.map(function (id) { return orderIndex[id] === undefined ? 1e9 : orderIndex[id]; }));
                return ia - ib;
            });
            var cur = pool.shift();
            orderedChains.push(cur);
            var curTail = function () { return orderedChains[orderedChains.length - 1].slice(-1)[0]; };
            while (pool.length) {
                var tail = curTail();
                var bestIdx = 0, bestD = Infinity;
                var bestReverse = false;
                for (var i = 0; i < pool.length; i++) {
                    var head = pool[i][0];
                    var last = pool[i][pool[i].length - 1];
                    var dHead = distOf(tail, head);
                    var dLast = distOf(tail, last);
                    if (dHead < bestD) { bestD = dHead; bestIdx = i; bestReverse = false; }
                    if (dLast < bestD) { bestD = dLast; bestIdx = i; bestReverse = true; }
                }
                var pick = pool.splice(bestIdx, 1)[0];
                if (bestReverse) pick = pick.slice().reverse();
                orderedChains.push(pick);
            }
            chains = orderedChains;
        } else {
            chains.sort(function (a, b) {
                var ia = Math.min.apply(null, a.map(function (id) { return orderIndex[id] === undefined ? 1e9 : orderIndex[id]; }));
                var ib = Math.min.apply(null, b.map(function (id) { return orderIndex[id] === undefined ? 1e9 : orderIndex[id]; }));
                return ia - ib;
            });
        }

        /* 5. 拼接：链上的站按拓扑顺序，未进任何链的站按原顺序补在后面 */
        var placed = {};
        var ids = [];
        chains.forEach(function (chain) {
            chain.forEach(function (id) {
                if (placed[id]) return;
                placed[id] = true;
                ids.push(id);
            });
        });
        var leftover = original.filter(function (id) { return !placed[id]; });
        leftover.forEach(function (id) { ids.push(id); });

        /* 6. 原顺序里"线段拓扑没覆盖到的站"插回拓扑位置：按原顺序相对关系插回 */
        //    简化处理：若某站既无线段又不属于该线路，保留在末尾即可（由调用方提示）。

        var changed = ids.length === original.length && ids.some(function (id, i) { return id !== original[i]; });
        result.ids = ids;
        result.reordered = changed;
        result.chainCount = chains.length;
        result.leftover = leftover;
        result.reason = changed ? 'topology-differs' : 'already-ordered';
        return result;
    }

    /**
     * 在站序里插入一个站：优先按"锚点之后"插入，锚点不在则按几何最近邻插入。
     *
     * @param {string[]} ids
     * @param {string} newId
     * @param {Object} [opts]
     * @param {string} [opts.afterId]  插到这个站后面（画线时段的起点/终点）
     * @param {string} [opts.beforeId] 插到这个站前面
     * @returns {{ids:string[], index:number, mode:string}}
     */
    function insertStation(ids, newId, opts) {
        var list = (ids || []).slice();
        var o = opts || {};
        if (!newId) return { ids: list, index: -1, mode: 'invalid' };
        var exist = list.indexOf(newId);
        if (exist !== -1) return { ids: list, index: exist, mode: 'existing' };

        var afterIdx = o.afterId ? list.indexOf(o.afterId) : -1;
        if (afterIdx !== -1) {
            list.splice(afterIdx + 1, 0, newId);
            return { ids: list, index: afterIdx + 1, mode: 'after-anchor' };
        }
        var beforeIdx = o.beforeId ? list.indexOf(o.beforeId) : -1;
        if (beforeIdx !== -1) {
            list.splice(beforeIdx, 0, newId);
            return { ids: list, index: beforeIdx, mode: 'before-anchor' };
        }
        list.push(newId);
        return { ids: list, index: list.length - 1, mode: 'append' };
    }

    /**
     * 把该线路的线段按拓扑顺序拼成一条走向折线（= 导出用的 pathPoints）。
     *
     * 编辑器画布绘制线路用的是 segments，而导出只写 stationIds 时引擎会"按站序连点"，
     * 于是没画线段的车站之间会被拉出一条条直线 —— 这正是"编辑器好看、导出乱掉"的来源。
     * 导出时把真实走向写成 pathPoints，引擎会优先按它画（与站序无关），导出结果即画布。
     *
     * @param {Array<{points:Array}>} segments
     * @returns {{points:Array<{x:number,y:number}>, chains:number, coveredStations:number}}
     */
    function buildPathPoints(segments, opts) {
        // 默认排除未开通（在建/规划）线段：它们属于 data_notopen.js，
        // 若混进 pathPoints，导出时就会被当成"已开通线路"画成实线。
        var includeNotOpen = !!(opts && opts.includeNotOpen);
        var list = (segments || []).filter(function (s) {
            if (!s || !Array.isArray(s.points) || s.points.length < 2) return false;
            if (s.notOpen && !includeNotOpen) return false;
            return true;
        });
        var out = { points: [], chains: 0, coveredStations: 0 };
        if (!list.length) return out;

        function r2(v) { return Math.round((Number(v) || 0) * 100) / 100; }
        function keyOf(p) { return (p && p.nid) ? ('n:' + p.nid) : ('p:' + r2(p.x) + ',' + r2(p.y)); }

        // 端点索引：key -> [{ i, end }]，end=0 表示该线段以这个点为起点
        var at = {};
        list.forEach(function (seg, i) {
            var a = keyOf(seg.points[0]);
            var b = keyOf(seg.points[seg.points.length - 1]);
            (at[a] = at[a] || []).push({ i: i, end: 0 });
            (at[b] = at[b] || []).push({ i: i, end: 1 });
        });

        var used = {};
        var covered = {};
        list.forEach(function (seg) {
            seg.points.forEach(function (p) { if (p && p.nid) covered[p.nid] = true; });
        });
        out.coveredStations = Object.keys(covered).length;

        function findUnused(key) {
            var cands = at[key] || [];
            for (var i = 0; i < cands.length; i++) {
                if (!used[cands[i].i]) return cands[i];
            }
            return null;
        }

        function headKey(link) {
            var seg = list[link.i];
            var p = link.reversed ? seg.points[seg.points.length - 1] : seg.points[0];
            return keyOf(p);
        }
        function tailKey(link) {
            var seg = list[link.i];
            var p = link.reversed ? seg.points[0] : seg.points[seg.points.length - 1];
            return keyOf(p);
        }

        list.forEach(function (seg, seedIdx) {
            if (used[seedIdx]) return;
            used[seedIdx] = true;
            var chain = [{ i: seedIdx, reversed: false }];

            // 向后延伸
            var guard = 0;
            while (guard++ < list.length + 2) {
                var tail = tailKey(chain[chain.length - 1]);
                var hit = findUnused(tail);
                if (!hit) break;
                used[hit.i] = true;
                // 该线段的哪个端点接在 tail 上？接在终点则要反向
                chain.push({ i: hit.i, reversed: hit.end === 1 });
            }

            // 向前延伸
            guard = 0;
            while (guard++ < list.length + 2) {
                var head = headKey(chain[0]);
                var hit2 = findUnused(head);
                if (!hit2) break;
                used[hit2.i] = true;
                // 接在 head 上：若该点正是该线段的起点，则线段需要反向才能接上
                chain.unshift({ i: hit2.i, reversed: hit2.end === 0 });
            }

            // 输出这条链（接头去重）
            var chainPts = [];
            chain.forEach(function (link, li) {
                var seg2 = list[link.i];
                var pts = link.reversed ? seg2.points.slice().reverse() : seg2.points;
                pts.forEach(function (p, pi) {
                    var k = keyOf(p);
                    var prevPt = chainPts.length ? chainPts[chainPts.length - 1] : null;
                    if (prevPt) {
                        if (k === prevPt._k) return;                       // 同一锚点：接头去重
                        // 只对"跨线段的第一个点"做坐标去重：
                        // 线段内部重合坐标要保留（可能是真实的零长度折点），
                        // 否则会把整段折线的中间点误删。
                        if (li > 0 && pi === 0 && r2(p.x) === prevPt.x && r2(p.y) === prevPt.y) return;
                    }
                    chainPts.push({ x: r2(p.x), y: r2(p.y), _k: k });
                });
            });
            if (chainPts.length >= 2) {
                out.chains++;
                chainPts.forEach(function (p) { out.points.push({ x: p.x, y: p.y }); });
            }
        });

        return out;
    }

    /* ── 以"路径"为准的站序模型 ──────────────────────────────────────
     *
     * 数据契约：线段与车站**不强绑定**。线路的几何由 pathPoints（走向折线）决定，
     * 车站只要求"非换乘站的站心落在这条路径上"。因此站序不该依赖
     * "谁在哪条线上画了哪一段"，而应当由**投影**得出：
     *   · 站在路径附近（容差内）→ 属于这条线，按投影弧长排序；
     *   · 换乘站允许偏离（画图时为了避让会挪出站心），不算错误；
     *   · 非换乘站偏离 → 需要提示用户（这是真正的排版问题）。
     */

    /**
     * 点到折线的最近距离与弧长位置。
     * @returns {{dist:number, arc:number}}
     */
    function projectOnPath(path, pt) {
        var best = { dist: Infinity, arc: 0 };
        if (!Array.isArray(path) || path.length < 2 || !pt) return best;
        var acc = 0;
        for (var i = 1; i < path.length; i++) {
            var a = path[i - 1], b = path[i];
            var dx = (Number(b.x) || 0) - (Number(a.x) || 0);
            var dy = (Number(b.y) || 0) - (Number(a.y) || 0);
            var segLen = Math.sqrt(dx * dx + dy * dy);
            if (segLen <= 0) continue;
            var t = (((Number(pt.x) || 0) - (Number(a.x) || 0)) * dx + ((Number(pt.y) || 0) - (Number(a.y) || 0)) * dy) / (segLen * segLen);
            if (t < 0) t = 0;
            if (t > 1) t = 1;
            var cx = (Number(a.x) || 0) + t * dx;
            var cy = (Number(a.y) || 0) + t * dy;
            var d = Math.sqrt(Math.pow((Number(pt.x) || 0) - cx, 2) + Math.pow((Number(pt.y) || 0) - cy, 2));
            if (d < best.dist) best = { dist: d, arc: acc + t * segLen };
            acc += segLen;
        }
        return best;
    }

    /**
     * 按"投影到路径"给出站序（线形为准）。
     * @param {string[]} stationIds 候选站（线路现有站序）
     * @param {Array<{x:number,y:number}>} path 线路走向折线
     * @param {Object} nodes 全部车站坐标表
     * @param {{tolerance?:number}} [opts] 容差（px，默认 6）
     * @returns {{ids:string[], onPath:number, offPath:Array<{id:string,dist:number}>}}
     */
    function orderStationsByPath(stationIds, path, nodes, opts) {
        var tol = (opts && opts.tolerance !== undefined) ? Number(opts.tolerance) : 6;
        var src = uniq(stationIds);
        var placed = [];
        var offPath = [];
        src.forEach(function (id) {
            var nd = nodes && nodes[id];
            if (!nd || nd.x === undefined || nd.y === undefined) { offPath.push({ id: id, dist: Infinity }); return; }
            var pr = projectOnPath(path, nd);
            if (pr.dist <= tol) placed.push({ id: id, arc: pr.arc, dist: pr.dist });
            else offPath.push({ id: id, dist: Math.round(pr.dist * 100) / 100 });
        });
        placed.sort(function (a, b) { return a.arc - b.arc; });
        return {
            ids: placed.map(function (x) { return x.id; }).concat(offPath.map(function (x) { return x.id; })),
            onPath: placed.length,
            offPath: offPath
        };
    }

    /**
     * 找出"站心落在路径上"的全部车站（不限线路现有站序）。
     * 这样即使某段线是在别的线路处于激活状态时画的，只要几何上压在本线路径上，
     * 该站就能被正确归入本线站序。
     *
     * @param {Object} nodes 全部车站坐标表
     * @param {Array<{x:number,y:number}>} path
     * @param {{tolerance?:number}} [opts]
     * @returns {string[]}
     */
    function stationsOnPath(nodes, path, opts) {
        var tol = (opts && opts.tolerance !== undefined) ? Number(opts.tolerance) : 6;
        var out = [];
        if (!nodes || !Array.isArray(path) || path.length < 2) return out;
        Object.keys(nodes).forEach(function (id) {
            var nd = nodes[id];
            if (!nd || nd.type === 'temp') return;
            if (nd.x === undefined || nd.y === undefined) return;
            var pr = projectOnPath(path, nd);
            if (pr.dist <= tol) out.push(id);
        });
        return out;
    }

    return {
        orderFromSegments: orderFromSegments,
        insertStation: insertStation,
        buildPathPoints: buildPathPoints,
        projectOnPath: projectOnPath,
        orderStationsByPath: orderStationsByPath,
        stationsOnPath: stationsOnPath
    };
})();

window.StationOrder = window.OpenMapEditor.StationOrder;
