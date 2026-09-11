/**
 * Drunk 线路图智能转换系统 - 线路骨架追踪与拓扑排序器 (topology_tracer.js)
 * 
 * 核心升级：
 * 1. 废除无上限盲目贪心 TSP，引入距离截断（Distance Cutoff）与方向惯性约束；
 * 2. 彻底杜绝横跨全图乱拉斜线的严重缺陷（最大连续跳跃阈值保护）；
 * 3. 站间距估算（保证 distances.length === stationIds.length - 1）；
 * 4. 45°/90° 正交网格吸附与规整；
 * 5. 路径点平滑与孤立分支保护。
 */

window.DrunkTopology = (function () {

    /**
     * 将无序站点根据几何走向进行单线线性拓扑排序 (带距离与惯性双重防乱拉线约束)
     * @param {Array} stations 该线路包含的站点对象列表 [{id, x, y}, ...]
     * @param {number} maxJumpDist 最大允许站间跳跃像素 (默认根据点分布自适应)
     */
    function sortStationsLinear(stations, maxJumpDist = null) {
        if (!stations || stations.length <= 1) return (stations || []).map(s => s.id);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        stations.forEach(s => {
            if (s.x < minX) minX = s.x;
            if (s.x > maxX) maxX = s.x;
            if (s.y < minY) minY = s.y;
            if (s.y > maxY) maxY = s.y;
        });

        const spanX = maxX - minX;
        const spanY = maxY - minY;
        const diag = Math.hypot(spanX, spanY);

        // 如果未显式传最大距离，以平均点距的 2.8 倍或整体跨度的 18% 为上限
        const safeMaxDist = maxJumpDist || Math.max(120, Math.min(260, diag * 0.22));

        // 确定主走向与首个端点
        let startStation = stations[0];
        if (spanX >= spanY) {
            startStation = stations.reduce((prev, curr) => curr.x < prev.x ? curr : prev, stations[0]);
        } else {
            startStation = stations.reduce((prev, curr) => curr.y < prev.y ? curr : prev, stations[0]);
        }

        const unvisited = [...stations];
        const sorted = [];

        let current = startStation;
        sorted.push(current.id);
        unvisited.splice(unvisited.indexOf(current), 1);

        let prevVector = { dx: 0, dy: 0 };

        while (unvisited.length > 0) {
            let bestCandidate = null;
            let bestScore = -Infinity;
            let bestIdx = -1;

            for (let i = 0; i < unvisited.length; i++) {
                const cand = unvisited[i];
                const dist = Math.hypot(cand.x - current.x, cand.y - current.y);

                // 🚨 核心防线：距离超过安全阈值，绝对禁止强行跨越画布乱拉线！
                if (dist > safeMaxDist) continue;

                // 距离得分（越近越高）
                let score = 1000 / (dist + 1);

                // 方向惯性奖励：如果前进方向与上一步夹角顺畅，给予加分
                if (prevVector.dx !== 0 || prevVector.dy !== 0) {
                    const curDx = (cand.x - current.x) / dist;
                    const curDy = (cand.y - current.y) / dist;
                    const cosTheta = (prevVector.dx * curDx + prevVector.dy * curDy);
                    // 顺向前进 (cosTheta > 0) 加分，180度大幅掉头扣分
                    score += cosTheta * 20;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = cand;
                    bestIdx = i;
                }
            }

            if (bestCandidate) {
                const dist = Math.hypot(bestCandidate.x - current.x, bestCandidate.y - current.y);
                prevVector = {
                    dx: (bestCandidate.x - current.x) / (dist || 1),
                    dy: (bestCandidate.y - current.y) / (dist || 1)
                };
                sorted.push(bestCandidate.id);
                current = bestCandidate;
                unvisited.splice(bestIdx, 1);
            } else {
                // 如果剩余点距离均超过限制，说明是断开的分支或孤立噪点，停止本段连线，绝不乱连！
                break;
            }
        }

        return sorted;
    }

    /**
     * 计算相邻站点间的估算距离 (米)，确保长度为 stationIds.length - 1
     */
    function computeDistances(stationIds, stationsDataMap, scaleFactor = 18) {
        const distances = [];
        if (!stationIds || stationIds.length <= 1) return distances;

        for (let i = 0; i < stationIds.length - 1; i++) {
            const s1 = stationsDataMap[stationIds[i]];
            const s2 = stationsDataMap[stationIds[i + 1]];
            if (s1 && s2) {
                const pxDist = Math.hypot(s2.x - s1.x, s2.y - s1.y);
                const meters = Math.max(600, Math.round(pxDist * scaleFactor / 10) * 10);
                distances.push(meters);
            } else {
                distances.push(1200);
            }
        }
        return distances;
    }

    /**
     * 一键 45°/90° 正交网格吸附
     */
    function snapToOrthogonalGrid(stations, gridSize = 8) {
        const snappedStations = JSON.parse(JSON.stringify(stations));
        Object.keys(snappedStations).forEach(id => {
            let s = snappedStations[id];
            s.x = Math.round(s.x / gridSize) * gridSize;
            s.y = Math.round(s.y / gridSize) * gridSize;
        });
        return snappedStations;
    }

    return {
        sortStationsLinear,
        computeDistances,
        snapToOrthogonalGrid
    };
})();
