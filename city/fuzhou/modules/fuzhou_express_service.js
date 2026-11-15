/**
 * 滨海快线「车种」切换（福州专属）
 *
 * 行程规划结果里，滨海快线的乘车段会出现三颗药丸：普通车 / 大站快车 / 直达快车。
 * 点哪颗就把**这一段**按该车种重算站数、用时、途经车站，并给出该车种在本站的发车时刻。
 * 它不参与寻路、不改路径，纯粹是「这一段还能怎么走」的说明性切换。
 *
 * 数据来源：`data_express.js`（各站首班大站时刻的分钟、区间用时、直达停靠站）。
 * 共享层只留了一个中立扩展位 `CGO_ROUTE_CONFIG.rideExtrasHtml`，与滨海快线无关的
 * 线路与其它城市一律不受影响。
 */
(function () {
    "use strict";

    const PILL_ATTR = "data-fz-svc";

    const serviceTable = () => (typeof window !== "undefined" ? window.FUZHOU_EXPRESS_SERVICE : null);

    const stationName = (sid) => {
        const table = window.stationsData || {};
        return (table[sid] && table[sid].cn) || sid;
    };

    const pad = (n) => String(n).padStart(2, "0");

    /** 该段的方向：两个方向的站序里，上车站必须排在下车站之前 */
    function directionOf(svc, from, to) {
        const keys = ["wenling", "fuzhou"];
        for (let i = 0; i < keys.length; i += 1) {
            const stops = svc.directions[keys[i]].stops;
            const ia = stops.findIndex((x) => x.id === from);
            const ib = stops.findIndex((x) => x.id === to);
            if (ia >= 0 && ib >= 0 && ia < ib) return { key: keys[i], ia, ib, stops };
        }
        return null;
    }

    /**
     * 大站快车在本站的发车时刻。
     *
     * 口径：**该站首班大站时刻的小时**起、到 22 点止，每小时一班，分钟沿用首班。
     * 例：帝封江首班大站 06:11 ⇒ 06:11、07:11 … 22:11 共 17 班。
     * （不能拿「服务时段 7:00 起」当起点——那会漏掉 06:11 这班。）
     */
    function fastDepartText(svc, dirKey, from) {
        const minute = typeof window.fuzhouExpressMinuteOfHour === "function"
            ? window.fuzhouExpressMinuteOfHour(dirKey, from) : null;
        if (minute === null) return "";
        const stops = svc.directions[dirKey].stops;
        const hit = stops.find((x) => x.id === from);
        const firstHour = hit ? Number(String(hit.firstExpress).split(":")[0]) : svc.window.startHour;
        const endHour = svc.window.endHour;
        const list = [];
        for (let h = firstHour; h <= endHour; h += 1) list.push(`${pad(h)}:${pad(minute)}`);
        const short = list.length > 3
            ? `${list[0]}、${list[1]} … ${list[list.length - 1]}`
            : list.join("、");
        return `大站快车 ${short}（每小时一班，共 ${list.length} 班）`;
    }

    /** 可选车种清单（含各自途经站与发车说明） */
    function options(line, from, to, stopsCount, minutes) {
        const svc = serviceTable();
        if (!svc || !line || !Number.isFinite(minutes)) return [];
        const lineId = String(line.id || "");
        if (lineId !== "BE" && lineId !== "BE#2" && lineId !== "BE#3") return [];

        const items = [{
            key: "slow", label: "普通车",
            stops: stopsCount, mins: Math.round(minutes),
            middle: null, depart: ""
        }];

        const dir = directionOf(svc, from, to);
        if (dir) {
            items.push({
                key: "fast", label: "大站快车",
                stops: Math.abs(dir.ib - dir.ia),
                mins: Math.abs(dir.stops[dir.ib].offset - dir.stops[dir.ia].offset),
                middle: dir.stops.slice(dir.ia + 1, dir.ib).map((x) => x.id),
                depart: fastDepartText(svc, dir.key, from)
            });
        }

        const direct = svc.direct && Array.isArray(svc.direct.stops) ? svc.direct.stops : null;
        if (direct) {
            const ia = direct.indexOf(from);
            const ib = direct.indexOf(to);
            if (ia >= 0 && ib >= 0 && ia !== ib) {
                // 直达同样能从时刻表推算：官网 fast.文岭 的「第一列(直达)」在 5 个停靠站都有时刻，
                // 逐站相减即区间用时（4 / 3 / 28 / 4 分，端到端 39 分）。
                const off = svc.direct.directOffsets || {};
                const fromMins = off[from];
                const toMins = off[to];
                const span = Number.isFinite(fromMins) && Number.isFinite(toMins)
                    ? Math.abs(toMins - fromMins) : null;
                items.push({
                    key: "direct", label: "直达快车",
                    stops: Math.abs(ib - ia),
                    mins: span,
                    middle: direct.slice(Math.min(ia, ib) + 1, Math.max(ia, ib)).map((x) => stationName(x)),
                    depart: `直达快车 每日仅 05:55 自福州火车站发一班（单向，全线 ${svc.direct.totalMinutes || 39} 分钟）`
                });
            }
        }
        return items;
    }

    /** 应用某颗药丸：高亮、站数用时、途经车站、发车提示 */
    /** 只取文案里「N 分钟」的那个 N —— 「乘坐 5 站 · 38 分钟」直接剥数字会拼成 538 */
    function readMinutes(text) {
        const hits = String(text || "").match(/(\d+)\s*分钟/g);
        if (!hits || !hits.length) return NaN;
        const last = hits[hits.length - 1].match(/\d+/);
        return last ? Number(last[0]) : NaN;
    }

    function applyPill(button) {
        const box = button.closest(".fz-svc-pills");
        const leg = button.closest(".cgo-rt-leg");
        if (!box || !leg) return;
        const key = button.getAttribute(PILL_ATTR);

        box.querySelectorAll(`[${PILL_ATTR}]`).forEach((el) => {
            const on = el === button;
            el.dataset.active = on ? "1" : "0";
            el.style.background = on ? "var(--primary-color, #006098)" : "transparent";
            el.style.color = on ? "#fff" : "var(--primary-color, #006098)";
        });

        // 站数 / 用时
        const info = leg.querySelector(".cgo-rt-ride-info");
        // 顶部「约 N 分钟」随本段一起变：只按**本段的差值**加减，不猜任何固定开销。
        // 首次点击时先取当前显示值当基线（否则第一次切换拿不到 prev，顶部就不会动）。
        const totalEl = document.querySelector(".cgo-rt-total");
        if (info && totalEl) {
            const rawMins = button.dataset.mins;
            const nextMins = rawMins === "" || rawMins === undefined ? null : Number(rawMins);
            const prevMins = leg.dataset.fzMins !== undefined && leg.dataset.fzMins !== ""
                ? Number(leg.dataset.fzMins)
                : readMinutes(info.textContent);
            if (nextMins !== null && Number.isFinite(prevMins)) {
                const now = readMinutes(totalEl.textContent);
                if (Number.isFinite(now)) {
                    totalEl.textContent = `约 ${Math.round(now + (nextMins - prevMins))} 分钟`;
                }
            }
            if (nextMins !== null) leg.dataset.fzMins = String(nextMins);
        }
        if (info) {
            const mins = button.dataset.mins;
            info.textContent = mins
                ? `乘坐 ${button.dataset.stops} 站 · ${mins} 分钟`
                : `乘坐 ${button.dataset.stops} 站（直达无逐站时刻）`;
        }

        // 途经车站：普通车用原始列表（首次切换时缓存），其余车种用其停靠站重建
        const list = leg.querySelector(".cgo-rt-stoplist");
        if (list) {
            if (list.dataset.slowHtml === undefined) list.dataset.slowHtml = list.innerHTML;
            const stops = String(button.dataset.middle || "");
            list.innerHTML = key === "slow" || !stops
                ? list.dataset.slowHtml
                : stops.split(",").filter(Boolean)
                    .map((sid) => `<span data-jump="${sid}">${stationName(sid)}</span>`).join("");
        }

        // 发车提示
        let hint = leg.querySelector(".fz-svc-depart");
        const text = button.dataset.depart || "";
        if (!text) {
            if (hint) hint.remove();
            return;
        }
        if (!hint) {
            hint = document.createElement("div");
            hint.className = "cgo-rt-leg-line muted fz-svc-depart";
            hint.setAttribute("data-role", "note");
            // 图标占固定一列、文字单独成列：这样折行后第二行与第一行文字左对齐，
            // 而不是缩进到图标底下（之前用 padding-left 只缩进了整块，折行仍贴最左）
            hint.style.paddingLeft = "14px";
            hint.style.display = "flex";
            hint.style.alignItems = "flex-start";
            hint.style.gap = "4px";
            // 位置：紧跟在「滨海快线 开往 文岭」那行之后、「乘坐 N 站」那行之前
            const rideRow = info ? info.closest(".cgo-rt-leg-line") : null;
            if (rideRow && rideRow.parentNode) rideRow.parentNode.insertBefore(hint, rideRow);
            else leg.appendChild(hint);
        }
        hint.innerHTML = `<span style="flex:0 0 auto;display:inline-flex;line-height:16px">`
            + `<cgo-icon name="time" size="12"></cgo-icon></span>`
            + `<span style="flex:1 1 auto;min-width:0">${text}</span>`;
    }

    /** 首次渲染时挂一次委托监听（捕获阶段，压住「展开途经车站」） */
    function bindOnce() {
        if (window.__cgoFuzhouExpressBound) return;
        window.__cgoFuzhouExpressBound = true;
        document.addEventListener("click", (event) => {
            const target = event.target;
            const button = target && typeof target.closest === "function"
                ? target.closest(`[${PILL_ATTR}]`) : null;
            if (!button) return;
            event.preventDefault();
            event.stopPropagation();
            applyPill(button);
        }, true);
    }

    /** 头部扩展位：只对本段的滨海快线生成药丸 */
    function renderPills(line, from, to, stopsCount, minutes) {
        const items = options(line, from, to, stopsCount, minutes);
        if (items.length < 2) return "";          // 只有一种车就不必给控件
        bindOnce();

        const lineId = String(line.id || "");
        const current = lineId === "BE#2" ? "fast" : lineId === "BE#3" ? "direct" : "slow";
        const pill = (item) => {
            const on = item.key === current;
            const meta = [
                `${PILL_ATTR}="${item.key}"`,
                `data-stops="${item.stops}"`,
                `data-mins="${Number.isFinite(item.mins) ? item.mins : ""}"`,
                `data-middle="${(item.middle || []).join(",")}"`,
                `data-depart="${String(item.depart || "").replace(/"/g, "&quot;")}"`,
                `data-active="${on ? 1 : 0}"`
            ].join(" ");
            return `<button type="button" ${meta} style="border:1px solid var(--primary-color,#006098);`
                + `border-radius:999px;padding:1px 8px;font:inherit;font-size:10.5px;font-weight:700;`
                + `line-height:16px;white-space:nowrap;cursor:pointer;`
                + `background:${on ? "var(--primary-color, #006098)" : "transparent"};`
                + `color:${on ? "#fff" : "var(--primary-color, #006098)"}">${item.label}</button>`;
        };
        return `<span class="fz-svc-pills" style="display:inline-flex;gap:4px;margin-left:auto">`
            + items.map(pill).join("") + `</span>`;
    }

    window.CGO_FuzhouExpress = { renderPills, options };
})();
