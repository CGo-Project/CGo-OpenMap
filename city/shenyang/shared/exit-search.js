/**
 * CGo OpenMap - 出入口检索与搜索栏命中（共享层）
 *
 * 一个关键词既能命中车站，也能命中车站的出入口条目：
 *   - 数据源：各城 data_exits.js（由 CGoExits.register 登记的 dataGlobals 持有），
 *     匹配字段为站名、周边地标（landmarks）、出口指示（desc）与最近道路侧向（roads）；
 *   - 消费方一：核心全局搜索栏（core/script.js 的 #station-search-input）——
 *     本模块**不改 core**：core 对搜索框用的是属性赋值（oninput / onclick），这是天然的
 *     单点包装位。这里等 core 绑定完成后接管 oninput：先跑 core 原逻辑，再把出入口命中项
 *     追加到 #search-results-list（复用 .search-item，天然纳入上下键 / 回车导航）；
 *     点击时 core 的 onclick 先 selectStation，本模块随后切到出入口页签并高亮该口；
 *   - 消费方二：行程规划面板的起点 / 终点候选（shared/route-panel.js）——
 *     直接调 search() 合并进候选列表，exitsById() 供「指定 / 不指定出入口」选择行取数。
 *
 * 出入口只属于可乘行的地铁车站：isPointOnly 线路（国铁散站 / 轻铁 / 在建点线）的
 * 站点即便在数据里被误收了条目也不参与检索（口径同 shared/exits.js 的 onRidableLine）。
 *
 * @event cgo:exit-search-hit      搜索栏点选出入口命中 { cityId, sid, code, keyword }
 * @event cgo:route-endpoint-exit  行程端点出入口变更 { field, sid, code }（由 route-panel 派发）
 */
(function () {
    "use strict";

    /** 追加到搜索栏的出入口命中上限（车站命中之后顺延展示） */
    const MAX_SEARCH_HITS = 6;
    /** 同一座车站最多列出几个出口，给别的车站留位 */
    const MAX_PER_STATION = 4;
    /** 行程规划候选列表里的出入口命中上限 */
    const MAX_SUGGEST_HITS = 5;

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    /**
     * 关键词归一化：与 core 搜索口径对齐（小写、剥离音调），
     * 额外吞掉常见中英文标点与空格——「沈阳北站 A」「沈鼓集团,」都应命中。
     */
    function normalize(text) {
        let s = String(text || "").replace(/<br\s*\/?>/gi, " ").toLowerCase();
        s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return s.replace(/[\s\u3000.''\(\)\-\[\]【】（）·、,，。：；:;!?！？/／]/g, "");
    }

    /** 出口编号的中文口径（字母口「A 口」、数字口「3 号口」），与 shared/exits.js 标题一致 */
    function exitLabel(code) {
        const text = String(code ?? "");
        return `${text}${/^\d/.test(text) ? " 号口" : " 口"}`;
    }

    /* ── 数据访问 ──────────────────────────────────────────────────── */

    function cityId() {
        return window.getActiveCity?.()?.id || window.CURRENT_CITY?.id || "";
    }

    /** 当前城市在共享层登记的出入口配置（CGoExits.register 的那一份） */
    function registeredConfig() {
        const reg = window.CGoExits?.registered;
        if (!(reg instanceof Map) || !reg.size) return null;
        const id = cityId();
        if (id && reg.has(id)) return reg.get(id);
        // 页面同刻只会装载一座城市的出入口数据；拿不准时仅在唯一注册项时才兜底
        return reg.size === 1 ? reg.values().next().value : null;
    }

    function pickData(globals) {
        for (const name of globals || []) {
            const table = window[name];
            if (table && typeof table === "object") return table;
        }
        return null;
    }

    /** 当前城市的出入口总表：站 ID → 出口数组 */
    function exitTable() {
        return pickData(registeredConfig()?.dataGlobals) || null;
    }

    /** 某站的出口数组（行程规划的「指定 / 不指定出入口」选择行用） */
    function exitsById(sid) {
        const list = exitTable()?.[String(sid || "")];
        return Array.isArray(list) ? list : [];
    }

    /**
     * 该站是否属于「有出入口概念的线路」：只被点线（国铁 / 轻铁 / 在建点线）
     * 引用的车站没有出入口概念。线路数据取不到时按「有」处理，退回旧行为。
     */
    function onRidable(sid) {
        const lines = window.linesData;
        if (!Array.isArray(lines)) return true;
        const referenced = lines.some((line) => line && !line.isPointOnly && (
            (line.stationIds || []).includes(sid)
            || (line["stationIds-way1"] || []).includes(sid)
            || (line["stationIds-way2"] || []).includes(sid)
        ));
        return referenced;
    }

    /* ── 检索 ──────────────────────────────────────────────────────── */

    /**
     * 出入口检索：命中字段按优先级给分——
     *   100 周边地标（landmarks，本次功能的主目标）
     *    90 「站名 + 口编号」直查（如「沈阳北站A」）
     *    80 出口指示（desc）与最近道路侧向（roads）
     *    60 单独命中站名（该站各口顺带列出，供指定出入口）
     *
     * @returns {Array<{sid, code, cn, score, context}>} 按分数降序、截前 MAX_SEARCH_HITS
     */
    function search(keyword) {
        const kw = normalize(keyword);
        const table = exitTable();
        if (!kw || !table) return [];
        const stations = window.stationsData || {};
        const hits = [];
        for (const sid in table) {
            const station = stations[sid];
            if (!station?.cn) continue;
            if (!onRidable(sid)) continue;
            const cnNorm = normalize(station.cn);
            const cnHit = cnNorm && (cnNorm.includes(kw) || kw.includes(cnNorm));
            let listed = 0;
            for (const exit of table[sid] || []) {
                const code = String(exit.name ?? "");
                if (!code) continue;
                let score = 0;
                let context = "";
                for (const landmark of exit.landmarks || []) {
                    const norm = normalize(landmark);
                    if (norm.length >= 2 && (norm.includes(kw) || kw.includes(norm))) {
                        score = 100;
                        context = landmark;
                        break;
                    }
                }
                if (!score && cnNorm && kw === cnNorm + normalize(code)) {
                    score = 90;   // 「站名 + 口编号」直查
                    context = exit.desc || "";
                }
                if (!score) {
                    const descNorm = normalize(exit.desc);
                    const roadHit = (exit.roads || []).some((road) => normalize(road).includes(kw));
                    if ((descNorm && descNorm.includes(kw)) || roadHit) {
                        score = 80;
                        context = exit.desc || (exit.roads || []).join("/");
                    }
                }
                if (!score && cnHit) {
                    score = 60;
                    context = exit.desc || (exit.landmarks || [])[0] || (exit.roads || [])[0] || "";
                }
                if (score > 0 && listed < MAX_PER_STATION) {
                    listed++;
                    hits.push({ sid, code, cn: station.cn, score, context });
                }
            }
        }
        return hits
            .sort((a, b) => b.score - a.score || a.cn.length - b.cn.length)
            .slice(0, MAX_SEARCH_HITS);
    }

    /* ── 搜索栏接入（core 零改动） ────────────────────────────────── */

    const wrappedInputs = new WeakMap();   // input 元素 → 我们装上的包装函数
    const hookedResults = new WeakSet();   // 结果列表元素 → 已挂点击监听

    function searchItemHtml(hit, index, keyword) {
        const suffix = /^\d/.test(String(hit.code)) ? "号口" : "口";
        // 主次对调：地标 / 出口指示（用户搜的东西）当主标题，站名 + 口退为次行；
        // 没有 context 的口回落成「站名 A 口」主标题
        const main = hit.context ? escapeHtml(hit.context) : `${escapeHtml(hit.cn)} ${escapeHtml(hit.code)} ${suffix}`;
        const sub = hit.context
            ? `<span style="font-size:12px;color:var(--text-light);">${escapeHtml(hit.cn)} ${escapeHtml(hit.code)} ${suffix}</span>`
            : "";
        return `
            <div class="search-item" data-sid="${escapeHtml(hit.sid)}" data-exit="${escapeHtml(hit.code)}"
                data-kw="${escapeHtml(keyword)}" role="option" id="search-option-exit-${index}" aria-selected="false">
                <cgo-icon name="location" size="14"></cgo-icon>
                <span class="search-item-text">${main} ${sub}</span>
            </div>
        `;
    }

    /** core 跑完自己的检索后，把出入口命中顺延追加（含「未找到相关车站」占位的清理） */
    function appendExitHits(rawVal) {
        const results = document.getElementById("search-results-list");
        if (!results) return;
        const keyword = String(rawVal || "").trim();
        if (!keyword) return;
        const hits = search(keyword);
        if (!hits.length) return;
        const hasStations = Boolean(results.querySelector(".search-item"));
        if (!hasStations) results.innerHTML = "";   // 清掉 core 的「未找到相关车站」占位
        let index = results.querySelectorAll(".search-item").length;
        results.insertAdjacentHTML(
            "beforeend",
            hits.map((hit) => searchItemHtml(hit, index++, keyword)).join("")
        );
        window.CGoA11y?.announce?.(
            hasStations
                ? `另有 ${hits.length} 个出入口命中`
                : `找到 ${hits.length} 个出入口`
        );
    }

    /**
     * 出入口命中兑现：跳站之后把用户搜的那个口摆到眼前——
     * 先登记 requestExitFocus（出入口页签露面时兑现高亮，见 shared/exits.js），
     * 再主动切到出入口页签：搜地标的用户就是要看这个口，不能等他自己翻页签。
     * 页签在 selectStation 渲染信息板之后才进 DOM，故用 rAF 重试到出现为止。
     */
    function revealExit(sid, code) {
        window.CGoExits?.requestExitFocus?.(sid, code);
        const tabId = registeredConfig()?.idPrefix;
        if (!tabId) return;
        let tries = 0;
        const trySwitch = () => {
            const tab = document.querySelector(`#info-panel .tab-item[data-custom-tab="${tabId}-exits"]`);
            if (tab) {
                if (!tab.classList.contains("active")) tab.click();
                return;
            }
            if (++tries < 30) requestAnimationFrame(trySwitch);
        };
        requestAnimationFrame(trySwitch);
    }

    function onResultsClick(event) {
        const item = event.target.closest?.(".search-item[data-exit]");
        if (!item || !event.currentTarget.contains(item)) return;
        const sid = item.dataset.sid;
        const code = item.dataset.exit;
        revealExit(sid, code);
        document.dispatchEvent(new CustomEvent("cgo:exit-search-hit", {
            detail: { cityId: cityId(), sid, code, keyword: item.dataset.kw || "" }
        }));
    }

    /**
     * 装挂（幂等，可反复调用）：
     *   - core 的 oninput 是属性赋值，拿到原函数后由包装函数先跑它、再追加出入口命中；
     *     WeakMap 记录装过的包装，core 若在同名元素上重新绑定（换新函数）会再次包上；
     *   - 结果列表的点击监听与包装同理，按元素去重。
     * 调用方是下方的轮询——core 是 type=module、晚于本脚本执行，搜索框与绑定都要等它就绪；
     * 元素被核心重建（形态切换）后新元素没有记录，下个周期自然补挂。
     */
    function attach() {
        const input = document.getElementById("station-search-input");
        if (input && typeof input.oninput === "function" && wrappedInputs.get(input) !== input.oninput) {
            const coreOninput = input.oninput;
            const wrapped = function (event) {
                const result = coreOninput.call(this, event);
                try {
                    appendExitHits(event?.target?.value ?? input.value);
                } catch (error) {
                    console.warn("[exit-search] 出入口命中追加失败", error);
                }
                return result;
            };
            input.oninput = wrapped;
            wrappedInputs.set(input, wrapped);
        }
        const results = document.getElementById("search-results-list");
        if (results && !hookedResults.has(results)) {
            results.addEventListener("click", onResultsClick);
            hookedResults.add(results);
        }
    }

    // 轮询等待 core 绑定；就绪后每个周期只做两次按 ID 取元素与一次 WeakMap 查表，代价可忽略
    attach();
    setInterval(attach, 800);

    window.CGoExitSearch = { search, exitsById, exitLabel, attach };
})();
