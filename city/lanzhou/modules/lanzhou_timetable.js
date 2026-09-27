/**
 * CGo OpenMap - 兰州车站信息板：首末车时刻
 * 移植自 city/qingdao/modules/qingdao_timetable.js（视觉与列宽自适应算法保持一致）。
 *
 * 数据源：city/lanzhou/data_timetable.js 的 GLOBAL_SCHEDULE_DATA
 *   GLOBAL_SCHEDULE_DATA[线路ID][车站ID] = {
 *       url, source, items: [
 *           { label: "首班车-往<终点站>",            value: "06:30" },
 *           { label: "末班车-往<终点站>",            value: "23:03" },
 *           { label: "末班车-往<终点站>-全程",       value: "22:00" },  // 可选：同方向多个末班车版本
 *           { label: "末班车-往<终点站>-终到<站名>", value: "22:15" }   // 可选
 *       ]
 *   }
 *
 * 约定说明：
 * 1. label 兼容“首车/首班车”“末车/末班车”两种写法；
 * 2. 末班车 label 中的第二段（如“全程”“终到某站”）会渲染为独立小标签；
 * 3. value 以“到达”结尾时表示该时刻为列车到达时刻，统一展示为 “HH:MM(到达)”；
 * 4. 与青岛实现一致：模块仅读取上下文与全局时刻数据，不硬编码任何车站坐标与线路私有逻辑。
 * 5. 版式（兰州本地调整）：卡片标题「首末班车时刻」居中；表头「首班车 / 末班车」与方向名同字体字号
 *    （12px / 650 / var(--text-main)）；方向行仅显示「往 X」，不再重复「方向」副标题；行高已收紧。
 */
(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    function getEntry(lineId, stationId) {
        if (typeof GLOBAL_SCHEDULE_DATA === "undefined" || !GLOBAL_SCHEDULE_DATA) return null;
        if (!lineId || !stationId) return null;
        const lineData = GLOBAL_SCHEDULE_DATA[lineId];
        return (lineData && lineData[stationId]) || null;
    }

    /**
     * 时刻值标准化：空值兜底 + “到达”后缀中文化
     */
    function cleanTime(v) {
        if (v == null || v === "" || v === "-") return "—";

        const raw = String(v).trim();
        if (!raw || raw === "-") return "—";

        // 形如 “06:36到达” / “23:20(到达)” 统一为 “06:36(到达)”
        const m = raw.match(/^(\d{1,2}:\d{2})\s*[（(]?\s*到达\s*[)）]?$/);
        if (m) return `${m[1]}(到达)`;

        return raw;
    }

    /**
     * 解析常规首末班车条目 → { 终点站: { first, lasts: [{label, value}] } }
     */
    function parseRegular(items) {
        const dirs = {};
        (items || []).forEach((item) => {
            const label = item.label || "";
            let m = label.match(/^(?:首班车|首车)-往(.+)$/);
            if (m) {
                const dest = m[1];
                dirs[dest] ||= { first: "—", lasts: [] };
                dirs[dest].first = cleanTime(item.value);
                return;
            }
            m = label.match(/^(?:末班车|末车)-往([^-]+)(?:-(.+))?$/);
            if (m) {
                const dest = m[1];
                dirs[dest] ||= { first: "—", lasts: [] };
                dirs[dest].lasts.push({ label: m[2] || "", value: cleanTime(item.value) });
            }
        });
        return dirs;
    }

    function renderLastsCell(lasts) {
        const validLasts = (lasts || []).filter((x) => x.value && x.value !== "—");
        if (!validLasts.length) {
            return '<span style="font-size:14px; font-weight:650; color:var(--text-light); font-variant-numeric:tabular-nums; white-space:nowrap;">—</span>';
        }

        if (validLasts.length === 1) {
            return `<span style="font-size:14px; font-weight:650; color:var(--text-main); font-variant-numeric:tabular-nums; white-space:nowrap;">${validLasts[0].value}</span>`;
        }

        return `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; width:100%; box-sizing:border-box;">
                ${validLasts.map((x) => {
                    const chip = x.label
                        ? `<span style="display:inline-flex; align-items:center; justify-content:center; padding:2px 5px; border:1px solid var(--border-color); border-radius:4px; background:rgba(127,127,127,.08); font-size:9.5px; line-height:1.2; color:var(--text-light); white-space:nowrap; flex:0 0 auto;">${x.label}</span>`
                        : "";
                    return `
                        <div style="display:inline-flex; align-items:center; justify-content:center; gap:5px; max-width:100%; white-space:nowrap;">
                            ${chip}
                            <span style="font-size:13.5px; font-weight:650; color:var(--text-main); font-variant-numeric:tabular-nums; flex:0 0 auto;">${x.value}</span>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    /**
     * 可见文本宽度估算：中日韩全角字符约 1 个单位，ASCII 约 0.55 个单位。
     */
    function visibleTextUnits(text) {
        if (!text) return 0;
        return Array.from(String(text)).reduce((sum, ch) => {
            return sum + (/[\u0000-\u00ff]/.test(ch) ? 0.55 : 1);
        }, 0);
    }

    /**
     * 根据实际内容自适应计算 “方向 / 首车 / 末车” 三列宽度（百分比）。
     */
    function getAdaptiveColumns(dirs) {
        const entries = Object.entries(dirs || {});
        if (!entries.length) return "34% 22% 44%";

        // 方向列宽度跟随最长的终点站名
        const longestDest = Math.max(
            ...entries.map(([dest]) => visibleTextUnits(`往${dest}`)),
            4
        );

        // 首车列几乎固定为 HH:MM，保持紧凑
        const firstUnits = 5.4;

        // 末车列仅在真实内容需要时扩张：单车次时与首车列相当；
        // 多车次时取最长的“标签 + 时刻”组合。
        let lastUnits = 5.6;
        entries.forEach(([, d]) => {
            const validLasts = (d.lasts || []).filter(x => x.value && x.value !== "—");
            if (validLasts.length <= 1) {
                lastUnits = Math.max(lastUnits, 5.6);
                return;
            }
            validLasts.forEach(x => {
                const labelUnits = visibleTextUnits(x.label || "");
                const timeUnits = visibleTextUnits(x.value || "");
                lastUnits = Math.max(lastUnits, labelUnits + timeUnits + 1.8);
            });
        });

        // 内容需求量转换为权重；上限避免单个超长标签挤占其他列
        let dirWeight = Math.min(46, Math.max(30, 25 + longestDest * 1.9));
        let firstWeight = 20;
        let lastWeight = Math.min(50, Math.max(26, 23 + lastUnits * 2.2));

        // 末车内容简单时，释放的空间主要给方向列
        const total = dirWeight + firstWeight + lastWeight;
        dirWeight = dirWeight / total * 100;
        firstWeight = firstWeight / total * 100;
        lastWeight = 100 - dirWeight - firstWeight;

        return `${dirWeight.toFixed(2)}% ${firstWeight.toFixed(2)}% ${lastWeight.toFixed(2)}%`;
    }

    window.StationBoard.registerModule({
        id: "lanzhou-line-timetable",
        name: "首末车时刻",
        targetTab: "line-tab",
        order: 22,

        shouldRender(context) {
            const entry = getEntry(context.lineInfo?.id, context.station?.id);
            return Boolean(entry && Array.isArray(entry.items) && entry.items.length);
        },

        render(context) {
            const entry = getEntry(context.lineInfo?.id, context.station?.id);
            if (!entry || !entry.items) return "";

            const dirs = parseRegular(entry.items);
            if (!Object.keys(dirs).length) return "";

            const columnTemplate = getAdaptiveColumns(dirs);

            const directionRows = Object.keys(dirs).map((dest, index, arr) => {
                const d = dirs[dest];
                const border = index === arr.length - 1 ? "none" : "1px solid var(--border-color)";
                return `
                    <div style="
                        display:grid;
                        grid-template-columns:${columnTemplate};
                        width:100%;
                        box-sizing:border-box;
                        align-items:stretch;
                        border-bottom:${border};
                        min-height:48px;
                    ">
                        <div style="
                            display:flex;
                            flex-direction:column;
                            align-items:flex-start;
                            justify-content:center;
                            box-sizing:border-box;
                            min-width:0;
                            padding:8px 8px 8px 14px;
                            overflow:hidden;
                        ">
                            <span style="
                                display:block;
                                max-width:100%;
                                font-size:12px;
                                font-weight:650;
                                color:var(--text-main);
                                line-height:1.2;
                                white-space:nowrap;
                                overflow:hidden;
                                text-overflow:clip;
                            ">往&nbsp;${dest}</span>
                        </div>

                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            box-sizing:border-box;
                            min-width:0;
                            padding:8px 4px;
                            overflow:hidden;
                            text-align:center;
                        ">
                            <span style="
                                font-size:14px;
                                font-weight:650;
                                color:${d.first === "—" ? "var(--text-light)" : "var(--text-main)"};
                                font-variant-numeric:tabular-nums;
                                white-space:nowrap;
                            ">${d.first}</span>
                        </div>

                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            box-sizing:border-box;
                            min-width:0;
                            max-width:100%;
                            padding:6px 8px 6px 4px;
                            overflow:hidden;
                            text-align:center;
                        ">
                            ${renderLastsCell(d.lasts)}
                        </div>
                    </div>
                `;
            }).join("");

            return `
                <div data-lanzhou-timetable-version="2" style="
                    width:100%;
                    box-sizing:border-box;
                    margin:8px 0;
                    padding:0;
                    background:var(--card-sub-bg);
                    border:1px solid var(--border-color);
                    border-radius:7px;
                    line-height:1.45;
                    overflow:hidden;
                ">
                    <div style="
                        padding:10px 14px 9px;
                        font-size:13.5px;
                        font-weight:700;
                        color:var(--text-main);
                        text-align:center;
                    ">首末班车时刻</div>

                    <div style="
                        display:grid;
                        grid-template-columns:${columnTemplate};
                        width:100%;
                        box-sizing:border-box;
                        align-items:center;
                        min-height:32px;
                        border-top:1px solid var(--border-color);
                        border-bottom:1px solid var(--border-color);
                        background:rgba(127,127,127,.055);
                    ">
                        <div></div>
                        <div style="text-align:center; font-size:12px; font-weight:650; color:var(--text-main); line-height:1.2; white-space:nowrap;">首班车</div>
                        <div style="text-align:center; font-size:12px; font-weight:650; color:var(--text-main); line-height:1.2; white-space:nowrap;">末班车</div>
                    </div>

                    <div style="width:100%; box-sizing:border-box;">
                        ${directionRows}
                    </div>
                </div>
            `;
        }
    });

    console.log("[LanzhouTimetable] v2 loaded");
})();
