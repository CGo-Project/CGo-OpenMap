/**
 * CGo OpenMap - 兰州城市专属模块：工程名 / 曾用名
 * (city/lanzhou/modules/lanzhou_station_names.js)
 *
 * ==============================================================================
 * 模块作用 (Overview)
 * ==============================================================================
 * 在车站卡片「车站信息」选项卡中，紧随「车站类型」之后、先于「运营单位」之前，
 * 按资料逐行展示：「工程名」一行、「曾用名」一行，两行各自独立、绝不合并。
 * 没有工程名或曾用名的车站，对应行不显示；两项均无的车站，本模块整块不显示。
 *
 * ==============================================================================
 * 只读展示，资料全部由数据层维护 (Read-only, data-driven)
 * ==============================================================================
 * 本模块不在前端提供任何编辑入口，也不提供任何显示 / 隐藏开关，
 * 资料与是否显示**完全**由数据层决定：
 *   1. data_stations.js 中车站对象自带字段（逐站覆写，优先级最高）：
 *        engineeringName / engineering
 *        formerName / formerNames / former / oldName
 *   2. data_station_names.js 中的 window.LANZHOU_STATION_NAMES.stations[车站ID] 资料表；
 *      - 某项留空（未填写 / 空串 / 空数组）→ 该行不渲染；
 *      - 某项写 { value: "文本", visible: false } → 该行不渲染（有资料但后端关闭）；
 *      - 条目写 { hidden: true } → 该站两行都不渲染；
 *      - 两行都不渲染时，整块（含底部虚线分隔）一并省略。
 * 前端不写入任何本地存储，刷新即完全以数据文件为准。
 *
 * ==============================================================================
 * 版式协调 (Visual consistency) —— 与「车站类型」「运营单位」保持一致
 * ==============================================================================
 *   - 外层容器：与「车站类型」相同的 13px 字号 + 底部 1px 虚线分隔
 *               （margin-bottom:15px / padding-bottom:10px / border-bottom:1px dashed var(--divider)）；
 *   - 每一行：  复用核心引擎的 .info-row + .info-label + .info-value 三个类，
 *               即行名颜色为 var(--text-light)、取值颜色为 var(--text-main) 加粗，
 *               与「车站类型」「运营单位」的字体、字号（13px）、行高、间距、亮暗主题完全一致；
 *   - 本模块不引入任何自定义配色，天然适配亮色 / 暗色主题与移动端。
 *
 * ==============================================================================
 * 挂载位置 (Slot & Order)
 * ==============================================================================
 *   targetTab: 'station-info' → 挂载于「车站信息」选项卡；
 *   order: 15                 → 排在 出行指引(5) / 车站类型(10) 之后，运营单位(20) 之前。
 *
 * ==============================================================================
 * 工程约束 (Project rules)
 * ==============================================================================
 *   - 纯原生 JS，零第三方依赖，无 Emoji；
 *   - 仅读取 context 上下文（station），不硬编码任何车站坐标或线路业务逻辑。
 * ==============================================================================
 */

(function () {
    /** 模块 ID（与 lanzhou.js 中 stationBoard.modules 的键名一致） */
    const MODULE_ID = "lanzhou-station-names";
    /** 版本号（与 lanzhou.js 中 document.write 的 ?v= 保持一致） */
    const VERSION = "260930.233001";

    /**
     * 两个字段定义（顺序即卡片中的行顺序）
     *   label          —— 行名
     *   stationFields  —— data_stations.js 中可覆写该字段的站对象属性名（按顺序命中即停）
     */
    const FIELD_DEFS = [
        {
            key: "engineering",
            label: "工程名",
            stationFields: ["engineeringName", "engineering"]
        },
        {
            key: "former",
            label: "曾用名",
            stationFields: ["formerName", "formerNames", "former", "oldName"]
        }
    ];

    /* ===================================================================== */
    /* ========================== 基础工具 (utils) ========================= */
    /* ===================================================================== */

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function toText(value) {
        return value == null ? "" : String(value).trim();
    }

    /* ===================================================================== */
    /* ========================= 取值与归一化 ============================== */
    /* ===================================================================== */

    /**
     * 归一化单个字段的配置 → { value: string, visible: boolean } | null
     * 支持写法：字符串 / 字符串数组 / { value|text|name, visible|show, hidden, enabled }
     * 返回 null 表示「该来源没有资料」，调用方继续向下匹配。
     */
    function normalizeField(raw) {
        if (raw == null || raw === false) return null;

        if (Array.isArray(raw)) {
            const text = raw.map(toText).filter(Boolean).join("、");
            return text ? { value: text, visible: true } : null;
        }

        if (typeof raw === "object") {
            const rawValue = raw.value !== undefined ? raw.value
                : (raw.text !== undefined ? raw.text
                    : (raw.name !== undefined ? raw.name : ""));
            const text = Array.isArray(rawValue)
                ? rawValue.map(toText).filter(Boolean).join("、")
                : toText(rawValue);
            const visible = !(raw.visible === false || raw.show === false || raw.hidden === true || raw.enabled === false);
            return { value: text, visible };
        }

        const text = toText(raw);
        return text ? { value: text, visible: true } : null;
    }

    /** 读取全局资料表（缺失时按空表处理） */
    function readTable() {
        const table = (window.LANZHOU_STATION_NAMES && typeof window.LANZHOU_STATION_NAMES === "object")
            ? window.LANZHOU_STATION_NAMES
            : {};
        return {
            enabled: table.enabled !== false,
            stations: (table.stations && typeof table.stations === "object") ? table.stations : {}
        };
    }

    /**
     * 汇总某车站的两项资料（只读，无任何本地覆盖）
     * @param {Object} station 车站对象
     * @returns {Object} { stationId, enabled, hidden, fields: { engineering, former } }
     */
    function resolveStationFields(station) {
        const stationId = station && station.id ? String(station.id) : "";
        const table = readTable();
        const tableEntry = stationId ? table.stations[stationId] : null;

        const result = {
            stationId,
            enabled: table.enabled,
            hidden: false,
            fields: {}
        };

        if (tableEntry && typeof tableEntry === "object" && !Array.isArray(tableEntry) && tableEntry.hidden === true) {
            result.hidden = true;
        }

        FIELD_DEFS.forEach((def) => {
            let item = null;

            // 1) data_stations.js 车站对象字段（逐站覆写，优先级最高）
            if (station) {
                for (let i = 0; i < def.stationFields.length; i += 1) {
                    const raw = station[def.stationFields[i]];
                    if (raw === undefined || raw === null) continue;
                    item = normalizeField(raw);
                    if (item) break;
                }
            }

            // 2) data_station_names.js 资料表
            if (!item && tableEntry && typeof tableEntry === "object" && !Array.isArray(tableEntry)) {
                if (tableEntry[def.key] !== undefined) item = normalizeField(tableEntry[def.key]);
            }

            result.fields[def.key] = item || { value: "", visible: true };
        });

        return result;
    }

    /* ===================================================================== */
    /* =========================== 视图渲染 ================================ */
    /* ===================================================================== */

    /** 容器样式：与核心「车站类型」行完全一致的字号、间距与虚线分隔 */
    const ROOT_STYLE = "margin:0 0 15px 0; padding:0 0 10px 0; border-bottom:1px dashed var(--divider); font-size:13px;";

    /**
     * 逐行渲染：工程名 / 曾用名
     * 仅当该行「有资料」且「数据层未显式关闭（visible: false）」时才渲染；
     * 没有工程名或曾用名的车站，对应行直接不显示。
     */
    function buildRowsHtml(cfg) {
        return FIELD_DEFS.map((def) => {
            const field = cfg.fields[def.key];
            if (field.visible === false) return "";

            const value = toText(field.value);
            if (!value) return "";

            return `
                <div class="info-row" style="margin-bottom:10px;">
                    <span class="info-label">${escapeHtml(def.label)}</span>
                    <span class="info-value" style="line-height:1.45; white-space:normal; overflow-wrap:anywhere;">${escapeHtml(value)}</span>
                </div>
            `;
        }).join("");
    }

    /* ===================================================================== */
    /* ============================ 模块注册 =============================== */
    /* ===================================================================== */

    function registerStationNamesModule() {
        if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") {
            console.warn("[lanzhou_station_names] StationBoard 尚未加载，延迟等待注册...");
            setTimeout(registerStationNamesModule, 50);
            return;
        }

        window.StationBoard.registerModule({
            id: MODULE_ID,
            name: "工程名与曾用名",
            targetTab: "station-info", // 挂载于「车站信息」选项卡
            order: 15,                 // 车站类型(10) 之后，运营单位(20) 之前
            enabled: true,

            shouldRender(context) {
                const cfg = resolveStationFields(context && context.station);
                if (!cfg.enabled || cfg.hidden) return false;
                // 没有工程名也没有曾用名的车站 → 本模块整块不显示
                return FIELD_DEFS.some((def) => {
                    const field = cfg.fields[def.key];
                    return field.visible !== false && toText(field.value) !== "";
                });
            },

            render(context) {
                const station = (context && context.station) || {};
                const cfg = resolveStationFields(station);
                const rowsHtml = buildRowsHtml(cfg);
                if (!rowsHtml) return "";

                return `
                    <div class="lanzhou-station-names" data-lanzhou-station-names="${escapeHtml(MODULE_ID)}"
                         data-lanzhou-station-names-version="${escapeHtml(VERSION)}"
                         data-station-id="${escapeHtml(cfg.stationId)}"
                         style="${ROOT_STYLE}">
                        ${rowsHtml}
                    </div>
                `;
            }
        });

        console.log(`[lanzhou_station_names] 兰州「工程名 / 曾用名」模块已挂载 (v${VERSION})。`);
    }

    /** 对外暴露只读解析函数，便于其他模块复用同一份资料解析逻辑 */
    window.LanzhouStationNames = {
        version: VERSION,
        resolve: resolveStationFields
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", registerStationNamesModule, { once: true });
    } else {
        registerStationNamesModule();
    }
})();
