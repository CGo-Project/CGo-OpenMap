/**
 * 青岛建设进度模块
 * 显示：上一区间 / 本站 / 下一区间的最新建设状态。
 *
 * 同时向城市侧专题图暴露统一的数据读取/状态判定接口，确保信息卡与“建设进度示意”
 * 使用完全相同的数据源、区间查找规则和状态语义。
 */
(function () {
    const DATA = window.QINGDAO_CONSTRUCTION_DATA || {};

    function statusKind(status, date) {
        const s = String(status || "");
        if (/暂未|未开|未施工|未掘进/.test(s)) return "not-started";
        if (/掘进中|施工中|主体结构施工|开挖中|建设中/.test(s)) return "building";
        if (/封顶|贯通|完成|验收|已预留/.test(s)) return "complete";
        return date ? "complete" : "not-started";
    }

    function statusColor(status, date) {
        const kind = statusKind(status, date);
        if (kind === "building") return "#e3a62f";
        if (kind === "complete") return "#2f9d63";
        return "#9aa0a6";
    }

    function stationName(id) {
        return window.stationsData?.[id]?.cn?.replace(/<br\s*\/?>/gi, "") || id;
    }

    function findSegment(lineData, a, b) {
        if (!lineData || !a || !b) return null;
        return lineData.segments?.[`${a}-${b}`] || lineData.segments?.[`${b}-${a}`] || null;
    }

    function flattenSegmentDetails(segment) {
        if (!segment) return [];
        if (Array.isArray(segment.parts) && segment.parts.length) {
            return segment.parts.flatMap((part) =>
                (part.details || []).map((detail) => ({
                    ...detail,
                    partName: part.name || segment.name || ""
                }))
            );
        }
        return (segment.details || []).map((detail) => ({ ...detail }));
    }

    // 统一接口：专题图不再自行解释 data_construction.js。
    window.QingdaoConstructionProgress = {
        data: DATA,
        getLine(lineId) {
            return DATA[lineId] || null;
        },
        getStation(lineId, stationId) {
            return DATA[lineId]?.stations?.[stationId] || null;
        },
        getSegment(lineId, a, b) {
            return findSegment(DATA[lineId], a, b);
        },
        getSegmentDetails(lineId, a, b) {
            return flattenSegmentDetails(findSegment(DATA[lineId], a, b));
        },
        classifyStatus(status, date) {
            return statusKind(status, date);
        },
        statusColor(status, date) {
            return statusColor(status, date);
        }
    };

    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    function renderStatusMark(status, date) {
        return `<span style="
            display:inline-block;
            width:9px;
            height:9px;
            min-width:9px;
            border-radius:2px;
            background:${statusColor(status, date)};
        "></span>`;
    }

    function renderProgressItem(detail, showSide) {
        if (!detail) return "";

        const side = showSide ? (detail.side || "—") : "";
        const date = detail.date || "—";
        const status = detail.status || "暂无更新";

        return `
            <div style="
                display:grid;
                grid-template-columns:${showSide ? '42px 78px minmax(0,1fr)' : '78px minmax(0,1fr)'};
                align-items:center;
                column-gap:8px;
                min-height:28px;
                width:100%;
                box-sizing:border-box;
            ">
                ${showSide ? `
                    <div style="
                        font-size:12.25px;
                        color:var(--text-light);
                        white-space:nowrap;
                        text-align:left;
                    ">${side}</div>
                ` : ""}
                <div style="
                    font-size:12.25px;
                    color:var(--text-light);
                    white-space:nowrap;
                    font-variant-numeric:tabular-nums;
                    text-align:left;
                ">${date}</div>
                <div style="
                    display:grid;
                    grid-template-columns:9px minmax(0,1fr);
                    align-items:center;
                    column-gap:7px;
                    min-width:0;
                    font-size:13.25px;
                    color:var(--text-main);
                    line-height:1.35;
                ">
                    ${renderStatusMark(status, date)}
                    <span style="min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${status}</span>
                </div>
            </div>
        `;
    }

    function renderStationRow(id, detail) {
        if (!detail) return "";
        return `
            <div style="padding:9px 0;">
                <div style="
                    font-size:13px;
                    font-weight:700;
                    color:var(--text-main);
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    margin-bottom:5px;
                ">${stationName(id)}</div>
                ${renderProgressItem(detail, false)}
            </div>
        `;
    }

    function renderSegmentPart(name, details) {
        return `
            <div style="padding:9px 0;">
                <div style="
                    font-size:13px;
                    font-weight:700;
                    color:var(--text-main);
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    margin-bottom:5px;
                ">${name}</div>
                <div style="display:flex; flex-direction:column; gap:3px;">
                    ${(details || []).map(d => renderProgressItem(d, true)).join("")}
                </div>
            </div>
        `;
    }

    function renderSegmentRow(segment) {
        if (!segment) return "";
        if (Array.isArray(segment.parts) && segment.parts.length) {
            return segment.parts
                .map(part => renderSegmentPart(part.name || segment.name, part.details || []))
                .join("");
        }
        return renderSegmentPart(segment.name, segment.details || []);
    }

    // 专题图区间信息卡直接复用 StationBoard 中“建设进度”模块的同一套渲染结构。
    // 标题“XX区间”由外层 StationBoard 风格 header 展示，因此这里不重复显示区间名称。
    window.QingdaoConstructionProgress.renderSegmentProgressCard = function (segment) {
        if (!segment) return "";

        let rows = "";
        if (Array.isArray(segment.parts) && segment.parts.length) {
            rows = segment.parts.map((part, index) => `
                <div style="${index ? 'border-top:1px solid var(--border-color);' : ''}">
                    ${renderSegmentPart(part.name || segment.name, part.details || [])}
                </div>
            `).join("");
        } else {
            // 普通区间：外层 header 已经显示区间名，卡片内只保留左/右线进度。
            rows = `<div style="padding:9px 0;display:flex;flex-direction:column;gap:3px;">
                ${(segment.details || []).map(d => renderProgressItem(d, true)).join("")}
            </div>`;
        }

        return `
            <div data-qingdao-construction-segment-card="1" style="
                width:100%;
                box-sizing:border-box;
                margin:8px 0;
                padding:10px 12px 9px;
                background:var(--card-sub-bg);
                border:1px solid var(--border-color);
                border-radius:7px;
                overflow:hidden;
            ">
                <div style="
                    font-size:13.5px;
                    font-weight:700;
                    color:var(--text-main);
                    margin-bottom:2px;
                    display:flex;
                    align-items:center;
                    gap:6px;
                "><span>建设进度</span></div>

                <div style="width:100%;box-sizing:border-box;">${rows}</div>

                <div style="
                    display:flex;
                    gap:12px;
                    align-items:center;
                    margin-top:6px;
                    padding-top:6px;
                    border-top:1px solid var(--border-color);
                    font-size:10px;
                    color:var(--text-light);
                    white-space:nowrap;
                ">
                    <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#2f9d63;margin-right:4px;"></i>已完成</span>
                    <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#e3a62f;margin-right:4px;"></i>建设中</span>
                    <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#9aa0a6;margin-right:4px;"></i>未开始/待更新</span>
                </div>
            </div>
        `;
    };

    window.StationBoard.registerModule({
        id: "qingdao-construction-progress",
        name: "建设进度",
        targetTab: "line-tab",
        order: 24,

        shouldRender(context) {
            const lineId = context.lineInfo?.id;
            const stationId = context.station?.id;
            return Boolean(window.QingdaoConstructionProgress.getStation(lineId, stationId));
        },

        render(context) {
            const lineId = context.lineInfo.id;
            const stationId = context.station.id;
            const lineData = window.QingdaoConstructionProgress.getLine(lineId);
            if (!lineData) return "";

            const ids = context.lineInfo?.stationIds || window.linesData?.find?.(l => l.id === lineId)?.stationIds || [];
            const idx = ids.indexOf(stationId);
            const prevId = idx > 0 ? ids[idx - 1] : null;
            const nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;

            const prevSegment = window.QingdaoConstructionProgress.getSegment(lineId, prevId, stationId);
            const nextSegment = window.QingdaoConstructionProgress.getSegment(lineId, stationId, nextId);
            const stationDetail = window.QingdaoConstructionProgress.getStation(lineId, stationId);

            const rows = [
                renderSegmentRow(prevSegment),
                renderStationRow(stationId, stationDetail),
                renderSegmentRow(nextSegment)
            ].filter(Boolean);

            if (!rows.length) return "";

            return `
                <div data-qingdao-construction-version="65" style="
                    width:100%;
                    box-sizing:border-box;
                    margin:8px 0;
                    padding:10px 12px 9px;
                    background:var(--card-sub-bg);
                    border:1px solid var(--border-color);
                    border-radius:7px;
                    overflow:hidden;
                ">
                    <div style="
                        font-size:13.5px;
                        font-weight:700;
                        color:var(--text-main);
                        margin-bottom:2px;
                        display:flex;
                        align-items:center;
                        gap:6px;
                    "><span>建设进度</span></div>

                    <div style="width:100%; box-sizing:border-box;">
                        ${rows.map((row, i) => `
                            <div style="${i ? 'border-top:1px solid var(--border-color);' : ''}">
                                ${row}
                            </div>
                        `).join("")}
                    </div>

                    <div style="
                        display:flex;
                        gap:12px;
                        align-items:center;
                        margin-top:6px;
                        padding-top:6px;
                        border-top:1px solid var(--border-color);
                        font-size:10px;
                        color:var(--text-light);
                        white-space:nowrap;
                    ">
                        <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#2f9d63;margin-right:4px;"></i>已完成</span>
                        <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#e3a62f;margin-right:4px;"></i>建设中</span>
                        <span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#9aa0a6;margin-right:4px;"></i>未开始/待更新</span>
                    </div>
                </div>
            `;
        }
    });

    console.log("[QingdaoConstruction] v66 loaded");
})();
