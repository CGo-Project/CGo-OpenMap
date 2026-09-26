/**
 * 青岛车站信息板：站名沿革
 */
(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    const DATA = window.QINGDAO_STATION_NAME_HISTORY || {};

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    window.StationBoard.registerModule({
        id: "qingdao-station-name-history",
        name: "站名沿革",
        targetTab: "station-info",
        order: 15,

        shouldRender(context) {
            const stationId = context.station?.id;
            return Boolean(stationId && DATA[stationId]?.rows?.length);
        },

        render(context) {
            const stationId = context.station?.id;
            const rows = DATA[stationId]?.rows || [];
            if (!rows.length) return "";

            const rowsHtml = rows.map((item) => `
                <div class="info-row" style="
                    margin-bottom:6px;
                    line-height:1.45;
                    align-items:flex-start;
                ">
                    <span class="info-label" style="
                        min-width:108px;
                        margin-right:14px;
                        text-align:left;
                        white-space:normal;
                    ">${escapeHtml(item.type)}</span>
                    <span class="info-value" style="
                        min-width:0;
                        flex:1;
                        text-align:right;
                        white-space:normal;
                        overflow-wrap:anywhere;
                    ">${escapeHtml(item.name)}</span>
                </div>
            `).join("");

            return `
                <div data-qingdao-station-name-history-version="67" style="
                    margin:0 0 15px 0;
                    padding:0 0 10px 0;
                    border-bottom:1px dashed var(--divider);
                    font-size:13px;
                ">
                    <div class="info-label" style="margin-bottom:7px; line-height:1.45;">站名沿革</div>
                    ${rowsHtml}
                </div>
            `;
        }
    });

    console.log("[QingdaoStationNameHistory] v68 loaded");
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

