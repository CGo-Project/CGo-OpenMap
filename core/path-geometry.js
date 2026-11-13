/**
 * CGo OpenMap - 折线倒角几何算法 (core/path-geometry.js)
 * 线路折线倒角唯一真源，供地图引擎与编辑器共用
 */

(function (root, factory) {
    const api = factory(root);
    root.CGoPathGeometry = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
    'use strict';

    // 默认圆角半径常量 (px)
    const RADIUS_90 = 18; // 90 度拐角圆角半径
    const RADIUS_45 = 8;  // 45 度及其它斜角圆角半径

    /** 把 roundingParam 归一化为 limitFactor */
    function resolveLimitFactor(roundingParam) {
        if (typeof roundingParam === 'number') return roundingParam;
        return roundingParam === true ? 0.5 : 0.9;
    }

    /**
     * 计算某个拐角实际生效的圆角半径。
     * 抽出来单独导出，是为了让编辑器能告诉用户「这里自动算出来是 18px」
     * 以及「你填的 40px 因线段太短被限制成了 12px」。
     *
     * @returns {{ auto:number, requested:number, effective:number, limited:boolean, isCorner:boolean }}
     */
    function cornerRadiusAt(points, i) {
        const blank = { auto: 0, requested: 0, effective: 0, limited: false, isCorner: false };
        if (!points || i <= 0 || i >= points.length - 1) return blank;

        const pPrev = points[i - 1], pCurr = points[i], pNext = points[i + 1];
        const v1 = { x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y };
        const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };
        const len1 = Math.hypot(v1.x, v1.y);
        const len2 = Math.hypot(v2.x, v2.y);
        if (len1 < 0.01 || len2 < 0.01) return blank;

        const u1 = { x: v1.x / len1, y: v1.y / len1 };
        const u2 = { x: v2.x / len2, y: v2.y / len2 };
        const auto = Math.abs(u1.x * u2.x + u1.y * u2.y) < 0.1 ? RADIUS_90 : RADIUS_45;
        const requested = pCurr.r !== undefined ? pCurr.r : auto;
        const limitFactor = 0.9;
        const effective = Math.min(requested, len1 * limitFactor, len2 * limitFactor);

        return {
            auto,
            requested,
            effective,
            limited: effective < requested - 1e-9,
            isCorner: true
        };
    }

    /**
     * 折线点阵 → 带圆角的 SVG Path 指令。
     *
     * @param {Array<{x:number, y:number, r?:number}>} points 折线点阵
     * @param {boolean|number} [roundingParam=false] true 收紧倒角限制；数值则直接作为 limitFactor
     * @returns {string} 如 "M 10 10 L 20 20 Q 30 20 30 30 ..."
     */
    function generateRoundedPath(points, roundingParam = false) {
        if (!points || points.length < 2) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        const limitFactor = resolveLimitFactor(roundingParam);

        for (let i = 1; i < points.length - 1; i++) {
            const pPrev = points[i - 1], pCurr = points[i], pNext = points[i + 1];
            const v1 = { x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y };
            const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };
            const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            if (len1 < 0.01 || len2 < 0.01) continue;
            const u1 = { x: v1.x / len1, y: v1.y / len1 };
            const u2 = { x: v2.x / len2, y: v2.y / len2 };
            const targetRadius = pCurr.r !== undefined ? pCurr.r :
                (Math.abs(u1.x * u2.x + u1.y * u2.y) < 0.1 ? RADIUS_90 : RADIUS_45);
            const r = Math.min(targetRadius, len1 * limitFactor, len2 * limitFactor);
            const startX = pCurr.x - u1.x * r, startY = pCurr.y - u1.y * r;
            const endX = pCurr.x + u2.x * r, endY = pCurr.y + u2.y * r;
            d += ` L ${startX} ${startY} Q ${pCurr.x} ${pCurr.y} ${endX} ${endY}`;
        }

        const last = points[points.length - 1];
        d += ` L ${last.x} ${last.y}`;
        return d;
    }

    /** 取交路模型模块：浏览器里由 core/line-routing.js 挂到 window，Node 自检里按相对路径兜底 require */
    function resolveRouting() {
        if (root && root.CGoLineRouting) return root.CGoLineRouting;
        if (typeof require === 'function') {
            try {
                const mod = require('./line-routing.js');
                if (mod && typeof mod.segments === 'function') {
                    if (root) root.CGoLineRouting = mod;
                    return mod;
                }
            } catch (err) { /* 非 CommonJS 环境，忽略 */ }
        }
        return null;
    }

    /**
     * 决定一条线路该画哪几段折线——**线路走向来源的唯一判定处**。
     *
     * 判定链（顺序即优先级）：
     * 1. `isPointOnly` → 不画走向，只在图上落站点图元（国铁等散布车站）；
     * 2. 有 `pathPoints*`   → 画显式点阵：主干预设所有交路共用，`pathPoints-branchN`
     *                         / `pathPoints-wayN` 归 wayN；点阵写成 `{points, ways}`
     *                         时可显式声明被部分交路共用的区段；
     * 3. 都没有              → 按各交路站序取站点坐标连线（共用区段按边去重）。
     *
     * 「交路（way）」的枚举、走向与交路的归属、以及同一点阵写两遍的合并，
     * 全部下沉到 core/line-routing.js —— 那里才是交路模型的唯一真源。
     * 本函数保留为渲染侧的统一入口，因此引擎、编辑器、邻城影子与城市模块
     * 都会自动拿到同一份、支持 way1…way99 的走向判定。
     *
     * @param {object} line 线路对象
     * @param {object} [stations] 车站字典，仅第 3 条兜底分支需要
     * @returns {Array<{cls: string, points: Array<{x,y,r?}>, key: string, ways: Set<string>}>}
     */
    function lineSegments(line, stations) {
        if (!line || line.isPointOnly) return [];
        const routing = resolveRouting();
        if (routing && typeof routing.segments === 'function') {
            return routing.segments(line, stations);
        }
        // 降级：线交路模块缺失时仍按老规则画（不应发生，仅防御）
        let points = line.pathPoints;
        if (!points || points.length === 0) {
            points = (line.stationIds || [])
                .map(sid => {
                    const s = stations && stations[sid];
                    return s ? { x: s.x, y: s.y, nid: sid } : null;
                })
                .filter(Boolean);
        }
        return (points && points.length >= 2) ? [{ cls: 'seg-main', points, key: 'pathPoints', ways: new Set(['way1']) }] : [];
    }

    return { RADIUS_90, RADIUS_45, generateRoundedPath, cornerRadiusAt, lineSegments };
});
