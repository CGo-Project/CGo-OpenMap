/**
 * CGo OpenMap - 行程规划面板：搜索（共享层）
 *
 * 对外接口（window.CGoRoutePanelSearch）：
 *   create(deps) → { searchStations, badgesHtml, searchExitsForKeyword, exitItemHtml, renderSuggest }
 *
 * deps（全部以**函数**传入，模块只在使用时读，故不依赖宿主的初始化顺序）：
 *   allStations()        → { [sid]: station }      本站可用车站表
 *   pickable(sid)        → boolean                 是否可参与规划（与车站项同一口径）
 *   linesAt(sid)         → line[]                  经停线路（线路徽标用）
 *   exitsApi()           → window.CGoExitSearch    出入口检索接口（城市未接入时为 undefined）
 *   escAttr(value)       → string                  属性转义
 *   injectSvgs(root)     → Promise                 把徽标占位符换成内联 SVG
 *   maxSuggest()         → number                  建议条数上限
 *
 * 从 route/route-panel.js 的「搜索」章节抽出 —— 拆巨石第 3 步。
 * 本模块**不持有任何状态**（状态全由 deps 提供），故可与宿主的闭包安全分离。
 *
 * 载入时机：须早于 route/route-panel.js。
 */
(function () {
    "use strict";

    function create(deps) {
        const d = deps;

        function searchStations(keyword) {
            const kw = String(keyword || "").trim().toLowerCase();
            if (!kw) return [];
            const hits = [];
            Object.entries(d.allStations()).forEach(([sid, station]) => {
                if (!d.pickable(sid) || !station.cn) return;
                const cn = String(station.cn), en = String(station.en || "");
                // 旧名 / 历史站名 / 拼音缩写别名：核心载入 staname.csv 后把结果挂在
                // **processedStations** 上（core/script.js 的 loadStationAliases）—— 注意它与本模块
                // allStations() 拿到的城市原始数据 stationsData 是**两个不同对象**，故必须显式从
                // window.processedStations 取（核心在 script.js:4328 导出）。核心检索让别名与中英文名
                // **同等**参与打分，这里沿用同一口径，否则「搜旧名搜不到」（用户反馈）。
                const aliases = window.processedStations?.[sid]?.aliases || station.aliases;
                const names = [cn, en, ...(Array.isArray(aliases) ? aliases : [])]
                    .map((name) => String(name).toLowerCase())
                    .filter(Boolean);
                let score = -1;
                if (sid.toLowerCase() === kw || names.includes(kw)) score = 0;
                else if (names.some((name) => name.startsWith(kw))) score = 1;
                else if (names.some((name) => name.includes(kw))) score = 2;
                if (score >= 0) hits.push({ sid, cn, en, score });
            });
            return hits
                .sort((a, b) => a.score - b.score || a.cn.length - b.cn.length)
                .slice(0, d.maxSuggest());
        }

        /**
         * 线路徽标占位符：与核心检索面板使用同一套结构与类名。
         * 由 core 注入 SVG 后，城市模块会把同一行内的多条线路合并为单个紧凑徽标；
         * 未实现该能力的城市自动退化为并列的单线路图标，与检索面板表现一致。
         */
        function badgesHtml(sid) {
            const sorted = d.linesAt(sid).slice().sort((a, b) =>
                (window.getLineSortIndex?.(a.id) ?? 0) - (window.getLineSortIndex?.(b.id) ?? 0));
            return sorted.map((line) => {
                if (!line.svg) return "";
                const meta = window.getLineSvgMeta?.(line.svg || line.id);
                const style = meta ? `--svgclr:${meta.svgclr};--svgtext:${meta.svgtext};` : "";
                const src = window.getSvgPath?.(line.svg) || "";
                return `<span class="svg-icon-placeholder search-line-icon" data-src="${src}" style="${style}"></span>`;
            }).join("");
        }

        /**
         * 出入口命中项：站名 + 口 + 匹配到的地标 / 出口指示，选中即把口写进端点状态。
         * 只收可参与规划的车站（pickable 口径与车站项一致），城市未接入出入口数据时返回空。
         */
        function searchExitsForKeyword(keyword) {
            const api = d.exitsApi();
            if (typeof api?.search !== "function") return [];
            return (api.search(keyword) || []).filter((hit) => d.pickable(hit.sid)).slice(0, 5);
        }

        function exitItemHtml(hit) {
            const label = d.exitsApi()?.exitLabel?.(hit.code) || `${hit.code} 口`;
            // 主次对调：地标 / 出口指示（用户搜的东西）当主标题，站名 + 口退为次行；
            // 没有 context 的口回落成「站名 A 口」主标题
            const main = hit.context || `${hit.cn} ${label}`;
            const sub = hit.context ? `${hit.cn} ${label}` : "";
            const subHtml = sub
                ? `<span style="font-size:12px;color:var(--text-light);">${sub}</span>`
                : "";
            return `
            <div class="search-item cgo-rt-exit-item" data-sid="${hit.sid}" data-exit="${hit.code}" data-landmark="${d.escAttr(hit.context || "")}">
                <cgo-icon name="location" size="14"></cgo-icon>
                <span class="search-item-text">${main} ${subHtml}</span>
            </div>
        `;
        }

        function renderSuggest(field, panel, keyword) {
            const hits = searchStations(keyword);
            const exitHits = searchExitsForKeyword(keyword);
            if (!hits.length && !exitHits.length) {
                panel.innerHTML = `<div class="cgo-rt-empty">没有匹配的车站或出入口</div>`;
                panel.classList.add("show");
                return;
            }
            panel.innerHTML = hits.map((hit) => `
            <div class="search-item" data-sid="${hit.sid}">
                ${badgesHtml(hit.sid)}
                <span class="search-item-text">${hit.cn}
                    <span style="font-size:12px;color:var(--text-light);">${hit.en}</span>
                </span>
            </div>
        `).join("") + exitHits.map(exitItemHtml).join("");
            panel.classList.add("show");
            d.injectSvgs(panel);
        }

        return { searchStations, badgesHtml, searchExitsForKeyword, exitItemHtml, renderSuggest };
    }

    window.CGoRoutePanelSearch = { create };
})();
