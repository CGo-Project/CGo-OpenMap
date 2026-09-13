/**
 * 青岛车站信息板：首末车时刻 / 机场直达列车
 */
(function () {
    console.log("[QingdaoTimetable] v35 loaded");
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    function getEntry(lineId, stationId) {
        if (typeof GLOBAL_SCHEDULE_DATA === "undefined" || !GLOBAL_SCHEDULE_DATA) return null;
        return GLOBAL_SCHEDULE_DATA[lineId]?.[stationId] || null;
    }

    function cleanTime(v) {
        if (v == null || v === "" || v === "-") return "—";
        return String(v).trim();
    }

    function parseRegular(items) {
        const dirs = {};
        (items || []).forEach((item) => {
            const label = item.label || "";
            let m = label.match(/^首车-往(.+)$/);
            if (m) {
                const dest = m[1];
                dirs[dest] ||= { first: "—", lasts: [] };
                dirs[dest].first = cleanTime(item.value);
                return;
            }
            m = label.match(/^末车-往([^-]+)(?:-(.+))?$/);
            if (m) {
                const dest = m[1];
                dirs[dest] ||= { first: "—", lasts: [] };
                dirs[dest].lasts.push({ label: m[2] || "", value: cleanTime(item.value) });
            }
        });
        return dirs;
    }

    function parseDirect(items) {
        const routes = {};
        (items || []).forEach((item) => {
            const m = (item.label || "").match(/^直达列车-(.+)-第(\d+)班$/);
            if (!m) return;
            routes[m[1]] ||= [];
            routes[m[1]].push({ no: Number(m[2]), value: cleanTime(item.value) });
        });
        Object.values(routes).forEach(arr => arr.sort((a, b) => a.no - b.no));
        return routes;
    }

    function formatDirectTime(value) {
        if (!value || value === "—") return "—";
        const v = String(value).trim();
        const m = v.match(/^(\d{1,2}:\d{2})(?:\s*\(?到达\)?)?$/);
        if (m) return v.includes("到达") ? `${m[1]}(到达)` : m[1];
        return v.replace(/到达$/, "(到达)");
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


    function visibleTextUnits(text) {
        if (!text) return 0;
        // Chinese/full-width characters count roughly as 1 unit;
        // ASCII characters count roughly as half a unit.
        return Array.from(String(text)).reduce((sum, ch) => {
            return sum + (/[\u0000-\u00ff]/.test(ch) ? 0.55 : 1);
        }, 0);
    }

    function getAdaptiveColumns(dirs) {
        const entries = Object.entries(dirs || {});
        if (!entries.length) return "34% 22% 44%";

        // Direction width follows the longest destination name.
        const longestDest = Math.max(
            ...entries.map(([dest]) => visibleTextUnits(`往${dest}`)),
            4
        );

        // First-train column is almost always just HH:MM, so it stays compact.
        const firstUnits = 5.4;

        // Last-train column expands only when the actual displayed content needs it.
        // For a single last train, it behaves much like the first-train column.
        // For multiple last trains, include the longest label + time combination.
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

        // Convert estimated content demand into weights.
        // The caps prevent one very long label from squeezing another column to unusable width.
        let dirWeight = Math.min(46, Math.max(30, 25 + longestDest * 1.9));
        let firstWeight = 20;
        let lastWeight = Math.min(50, Math.max(26, 23 + lastUnits * 2.2));

        // If the last-train content is simple, give the released space mainly to direction,
        // not to a permanently oversized last-train column.
        const total = dirWeight + firstWeight + lastWeight;
        dirWeight = dirWeight / total * 100;
        firstWeight = firstWeight / total * 100;
        lastWeight = 100 - dirWeight - firstWeight;

        return `${dirWeight.toFixed(2)}% ${firstWeight.toFixed(2)}% ${lastWeight.toFixed(2)}%`;
    }

    window.StationBoard.registerModule({
        id: "qingdao-line-timetable",
        name: "首末车时刻",
        targetTab: "line-tab",
        order: 22,

        shouldRender(context) {
            const entry = getEntry(context.lineInfo?.id, context.station?.id);
            return Boolean(entry && Array.isArray(entry.items) && entry.items.length);
        },

        render(context) {
            const entry = getEntry(context.lineInfo.id, context.station.id);
            if (!entry || !entry.items) return "";

            const dirs = parseRegular(entry.items);
            const columnTemplate = getAdaptiveColumns(dirs);
            const showDirect = context.station.id === "M0301" || context.station.id === "M0802";
            const directs = showDirect ? parseDirect(entry.items) : {};

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
                        min-height:72px;
                    ">
                        <div style="
                            display:flex;
                            flex-direction:column;
                            align-items:flex-start;
                            justify-content:center;
                            box-sizing:border-box;
                            min-width:0;
                            padding:10px 8px 10px 14px;
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
                            <span style="
                                display:block;
                                margin-top:3px;
                                font-size:10.5px;
                                font-weight:500;
                                color:var(--text-light);
                                line-height:1.2;
                                white-space:nowrap;
                            ">方向</span>
                        </div>

                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            box-sizing:border-box;
                            min-width:0;
                            padding:10px 4px;
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
                            padding:8px 8px 8px 4px;
                            overflow:hidden;
                            text-align:center;
                        ">
                            ${renderLastsCell(d.lasts)}
                        </div>
                    </div>
                `;
            }).join("");

            const directRows = Object.keys(directs).map((route) => {
                const trains = directs[route].filter(x => x.value && x.value !== "—");
                if (!trains.length) return "";

                const chips = trains.map(x => `
                    <div style="
                        display:flex;
                        flex-direction:column;
                        align-items:center;
                        justify-content:center;
                        box-sizing:border-box;
                        min-width:0;
                        width:100%;
                        height:62px;
                        padding:5px 3px 6px;
                        border:1px solid var(--border-color);
                        border-radius:6px;
                        background:var(--card-bg);
                        overflow:hidden;
                    ">
                        <span style="font-size:9px; color:var(--text-light); line-height:1.1; white-space:nowrap;">第${x.no}班</span>
                        <span style="
                            margin-top:3px;
                            font-size:11px;
                            font-weight:650;
                            color:var(--text-main);
                            line-height:1.2;
                            white-space:nowrap;
                            font-variant-numeric:tabular-nums;
                        ">${formatDirectTime(x.value)}</span>
                    </div>
                `).join("");

                return `
                    <div style="padding:8px 14px 0; box-sizing:border-box; width:100%;">
                        <div style="font-size:11.5px; font-weight:650; color:var(--text-main); margin-bottom:6px; white-space:nowrap;">${route}</div>
                        <div style="
                            display:grid;
                            grid-template-columns:repeat(3, minmax(0, 1fr));
                            gap:8px;
                            width:100%;
                            box-sizing:border-box;
                        ">
                            ${chips}
                        </div>
                    </div>
                `;
            }).join("");

            return `
                <div data-qingdao-timetable-version="35" style="
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
                        padding:11px 14px 10px;
                        font-size:13.5px;
                        font-weight:700;
                        color:var(--text-main);
                    ">首末车时刻</div>

                    <div style="
                        display:grid;
                        grid-template-columns:${columnTemplate};
                        width:100%;
                        box-sizing:border-box;
                        align-items:center;
                        min-height:38px;
                        border-top:1px solid var(--border-color);
                        border-bottom:1px solid var(--border-color);
                        background:rgba(127,127,127,.055);
                    ">
                        <div></div>
                        <div style="text-align:center; font-size:10px; font-weight:500; color:var(--text-light); white-space:nowrap;">首车</div>
                        <div style="text-align:center; font-size:10px; font-weight:500; color:var(--text-light); white-space:nowrap;">末车</div>
                    </div>

                    <div style="width:100%; box-sizing:border-box;">
                        ${directionRows}
                    </div>

                    ${directRows ? `
                        <div style="
                            width:100%;
                            box-sizing:border-box;
                            margin-top:0;
                            padding:10px 0 12px;
                            border-top:1px solid var(--border-color);
                        ">
                            <div style="padding:0 14px; font-size:12.5px; font-weight:700; color:var(--text-main); margin-bottom:2px;">机场直达列车</div>
                            ${directRows}
                        </div>
                    ` : ""}
                </div>
            `;
        }
    });
})();
