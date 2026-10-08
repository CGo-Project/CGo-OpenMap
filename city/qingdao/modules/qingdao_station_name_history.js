/**
 * 青岛车站信息板：站名沿革
 */
(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    const DATA = window.QINGDAO_STATION_NAME_HISTORY || {};
    const HISTORICAL_TRANSLATIONS = window.QINGDAO_STATION_HISTORICAL_TRANSLATIONS || {};
    const HISTORICAL_TRANSLATION_META = window.QINGDAO_STATION_HISTORICAL_TRANSLATION_META || {};

    // 当前最长标题为“历史译名(至2018.04)”/“历史译名(至2026.09)”。
    // 统一左栏宽度，保证不同类型的沿革行纵向对齐。
    const HISTORY_LABEL_WIDTH = "130px";

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }


    function renderHistoricalTranslation(textValue, meta = {}) {
        const text = String(textValue ?? "");
        let html;

        if (meta.superscript && text.includes(meta.superscript)) {
            const token = String(meta.superscript);
            const tokenIndex = text.indexOf(token);
            html = `${escapeHtml(text.slice(0, tokenIndex))}<sup style="font-size:0.72em; line-height:0; vertical-align:super;">${escapeHtml(token)}</sup>${escapeHtml(text.slice(tokenIndex + token.length))}`;
        } else {
            // 与最初稳定版本一致：译名按普通纯文本直接转义，不再对右单引号做额外字体/间距处理。
            html = escapeHtml(text);
        }

        if (meta.breakBefore) {
            const escapedBreak = escapeHtml(meta.breakBefore);
            const at = html.indexOf(escapedBreak);
            if (at >= 0) html = `${html.slice(0, at)}<br>${html.slice(at)}`;
        }

        return html;
    }

    window.StationBoard.registerModule({
        id: "qingdao-station-name-history",
        name: "站名沿革",
        targetTab: "station-info",
        order: 15,

        shouldRender(context) {
            const stationId = context.station?.id;
            return Boolean(stationId && (DATA[stationId]?.rows?.length || HISTORICAL_TRANSLATIONS[stationId]));
        },

        render(context) {
            const stationId = context.station?.id;
            const rows = DATA[stationId]?.rows || [];
            const historicalTranslation = HISTORICAL_TRANSLATIONS[stationId] || "";
            const note = DATA[stationId]?.note || "";
            if (!rows.length && !historicalTranslation && !note) return "";

            const rowsHtml = rows.map((item) => `
                <div class="info-row" style="
                    margin-bottom:6px;
                    line-height:1.45;
                    align-items:flex-start;
                ">
                    <span class="info-label" style="
                        width:${HISTORY_LABEL_WIDTH};
                        min-width:${HISTORY_LABEL_WIDTH};
                        flex:0 0 ${HISTORY_LABEL_WIDTH};
                        margin-right:10px;
                        text-align:left;
                        white-space:normal;
                    ">${escapeHtml(item.type)}</span>
                    <span class="info-value" style="
                        min-width:0;
                        flex:1;
                        text-align:right;
                        white-space:normal;
                        overflow-wrap:break-word;
                        word-break:normal;
                    ">${escapeHtml(item.name)}</span>
                </div>
            `).join("");

            // “历史译名”的文本本体始终是纯字符串；类型/有效期/局部排版从独立元数据读取。
            const historicalTranslationEntries = historicalTranslation
                ? (Array.isArray(historicalTranslation) ? historicalTranslation : [historicalTranslation])
                : [];
            const stationTranslationMeta = HISTORICAL_TRANSLATION_META[stationId] || {};
            const historicalTranslationHtml = historicalTranslationEntries.map((text, index) => {
                const meta = Array.isArray(stationTranslationMeta)
                    ? (stationTranslationMeta[index] || {})
                    : (index === 0 ? stationTranslationMeta : {});
                const label = meta.type || "历史译名";
                return `
                <div class="info-row" style="
                    margin-bottom:6px;
                    line-height:1.45;
                    align-items:flex-start;
                ">
                    <span class="info-label" style="
                        width:${HISTORY_LABEL_WIDTH};
                        min-width:${HISTORY_LABEL_WIDTH};
                        flex:0 0 ${HISTORY_LABEL_WIDTH};
                        margin-right:10px;
                        text-align:left;
                        white-space:normal;
                    ">${escapeHtml(label)}</span>
                    <span class="info-value" style="
                        min-width:0;
                        flex:1;
                        text-align:right;
                        white-space:normal;
                        overflow-wrap:break-word;
                        word-break:normal;
                    ">${renderHistoricalTranslation(text, meta)}</span>
                </div>
            `;
            }).join("");

            // 站点自身备注。
            const noteHtml = note ? `
                <div class="info-row" style="
                    margin-bottom:6px;
                    line-height:1.45;
                    justify-content:flex-end;
                ">
                    <span class="info-label" style="
                        min-width:0;
                        flex:1;
                        text-align:right;
                        white-space:normal;
                        overflow-wrap:break-word;
                        word-break:normal;
                    ">${escapeHtml(note)}</span>
                </div>
            ` : "";

            // 仅解释本站实际出现的术语：
            // 备注横跨整个沿革模块宽度，并强制保持单行，便于直接观察完整文案能否容纳。
            const hasAdjustment = rows.some((item) => /调整/.test(String(item?.type || "")));
            const hasRename = rows.some((item) => /更名/.test(String(item?.type || "")));
            let changeTermNoteText = "";
            if (hasAdjustment && hasRename) {
                changeTermNoteText = '注：“调整”为开通前变更站名，“更名”为开通后变更站名。';
            } else if (hasAdjustment) {
                changeTermNoteText = '注：“调整”为开通前变更站名。';
            } else if (hasRename) {
                changeTermNoteText = '注：“更名”为开通后变更站名。';
            }
            const changeTermNoteHtml = changeTermNoteText ? `
                <div class="info-row" style="
                    width:100%;
                    margin-bottom:6px;
                    line-height:1.45;
                    align-items:flex-start;
                ">
                    <span class="info-label" style="
                        width:100%;
                        min-width:0;
                        flex:0 0 100%;
                        box-sizing:border-box;
                        text-align:left;
                        font-size:12px;
                        white-space:nowrap;
                        overflow:visible;
                    ">${escapeHtml(changeTermNoteText)}</span>
                </div>
            ` : "";

            return `
                <div data-qingdao-station-name-history-version="82-full-width-single-line-change-note" style="
                    margin:0 0 15px 0;
                    padding:0 0 10px 0;
                    border-bottom:1px dashed var(--divider);
                    font-size:13px;
                ">
                    <div class="info-label" style="
                        margin-bottom:7px;
                        line-height:1.45;
                    ">站名沿革</div>
                    ${rowsHtml}
                    ${historicalTranslationHtml}
                    ${noteHtml}
                    ${changeTermNoteHtml}
                </div>
            `;
        }
    });

    console.log("[QingdaoStationNameHistory] v82 full-width single-line change note loaded");
})();

/**
 * 青岛信息卡英文站名强制换行。
 *
 * core 的 header-title 默认会把英文站名里的 <br> 转成空格；北京“首经贸”则
 * 通过 special-br 恢复人工指定的断行。青岛复用同一机制，但泛化到所有数据中
 * 主动写有 <br> 的英文站名。断行位置直接取 stationsData，地图与信息卡共用同一真源。
 */
(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    // 英文标题直接读取 stationsData：数据中的 <br> 是唯一断行真源。
    window.StationBoard.registerModule({
        id: "header-title",
        name: "中英文站名标题",
        slot: "header",
        order: 20,
        render(context) {
            const station = context.station || {};
            const enName = station.en || "";
            const hasForcedBreak = /<br\s*\/?\s*>/i.test(enName);
            const enNameDisplay = hasForcedBreak
                ? enName.replace(/<br\s*\/?\s*>/gi, '<span class="special-br"></span>')
                : enName.replace(/<br\s*\/?\s*>/gi, " ");

            return `
                <div class="header-name-group">
                    <div class="panel-cn-name">${station.cn || ""}</div>
                    <div class="panel-en-name">${enNameDisplay}</div>
                </div>
            `;
        }
    });

    console.log("[QingdaoStationTitle] English forced line breaks enabled");
})();

