/**
 * CGo OpenMap - 兰州城市专属模块：票价表 (city/lanzhou/modules/lanzhou_fare_table.js)
 *
 * ==============================================================================
 * 模块作用 (Overview)
 * ==============================================================================
 * 在车站卡片底部操作栏（panel-footer）中，「官网查询 / 高德导航」按钮行的**正上方**
 * 增加一个整行宽度的「票价表」按钮；点击后全屏弹出 city/lanzhou/assets/pricetable.jpg
 * 票价表图片，并支持：
 *   - 放大 / 缩小：鼠标滚轮、触控板捏合、双指捏合、工具栏 +/- 按钮；
 *   - 平移：鼠标 / 单指拖动；
 *   - 复位：工具栏「适应窗口」按钮、在图片上双击 / 双击触屏；
 *   - 关闭：工具栏右上角关闭按钮、Esc 键、点击图片外的空白区域。
 *
 * ==============================================================================
 * 版式约定 (Layout contract —— 与核心 footer-actions 严格对齐)
 * ==============================================================================
 * 核心引擎 (core/station-board.js 模块 footer-actions) 的底部按钮有两种尺寸：
 *   - 常规：padding 12px 0、font-size 14px，所在行 gap 12px（普通地铁站点 / 国铁站）；
 *   - 小号：padding 8px  0、font-size 11px，所在行 gap 4px （市郊铁路站 / Rwy2 混合站）。
 * 本模块按同样的分支判定 data-size，并沿用同样的 padding / font-size / 行间距，
 * 因此按钮高度与「高德导航」完全一致；按钮宽度为 100%（即从「官网查询」左侧到
 * 「高德导航」右侧），配色取「高德导航」同款（--btn-info-bg + --text-main +
 * --border-color），深浅模式随主题变量自动适配。
 *
 * ==============================================================================
 * 挂载位置 (Slot & Order)
 * ==============================================================================
 * slot / targetTab: 'footer'，order: 9 → 排在核心 footer-actions（order 10）之前，
 * 即正好位于「官网查询 / 高德导航」按钮行上方。
 * 未开通车站（type: "no"）不显示，其余已运营车站（含国铁 / 市郊站）均显示。
 *
 * ==============================================================================
 * 内容如何自由编辑 (How to edit)
 * ==============================================================================
 * 全部可调项集中在下方 LANZHOU_FARE_TABLE 数据表：按钮文案、图片路径、提示语、
 * 是否在国铁 / 市郊车站显示、精确排除的车站 ID、缩放范围等。
 * 关闭方式（三选一）：
 *   A. LANZHOU_FARE_TABLE.enabled = false；
 *   B. city/lanzhou/lanzhou.js 中 stationBoard.modules["lanzhou-fare-table"].enabled = false；
 *   C. 在 excludeStations 中登记车站 ID（逐站隐藏）。
 *
 * ==============================================================================
 * 视觉与工程约束 (Project rules)
 * ==============================================================================
 * - 纯原生 JS，零第三方依赖，零构建；
 * - 不修改核心引擎，城市专属内容全部收敛在本文件与 city/lanzhou/style.css；
 * - 按钮与弹层图标一律使用 <cgo-icon> 矢量组件，严禁 Emoji；
 * - 全部颜色取 CSS 主题变量（--card-bg / --text-main / --btn-info-bg / --border-color 等），
 *   亮色与暗色主题自动适配（铁律三）。
 * ==============================================================================
 */

(function () {
    "use strict";

    /** 模块 ID（与 city/lanzhou/lanzhou.js 的 stationBoard.modules 键名一致） */
    const MODULE_ID = "lanzhou-fare-table";
    /** 票价表弹层根节点 ID（全局单例） */
    const VIEWER_ID = "lanzhou-fare-viewer";
    /** 本模块版本号（优先读全局发布号，与 lanzhou.js 中 ?v= 保持一致） */
    const VERSION = (typeof window !== "undefined" && window.CGO_ASSET_VERSION) || "261124.235734";

    /* ===================================================================== */
    /* ====== 可自由编辑区：票价表配置表 (EDIT HERE) ========================= */
    /* ===================================================================== */
    const LANZHOU_FARE_TABLE = {
        /** 总开关：false → 全城车站卡片均不显示「票价表」按钮 */
        enabled: true,

        /** 按钮文案与悬浮提示 */
        buttonText: "票价表",
        buttonTitle: "查看兰州轨道交通票价表",

        /** 票价表图片（相对项目根目录；已登记至 sw.js 的 ASSETS_TO_CACHE） */
        image: "./city/lanzhou/assets/pricetable.jpg",
        imageAlt: "兰州轨道交通票价表",

        /** 弹层标题与底部操作提示 */
        viewerTitle: "票价表",
        hint: "滚轮 / 双指捏合缩放 · 拖动平移 · 图片上双击复位",

        /** 是否在国铁火车站（Rwy）卡片中显示 */
        showOnRailwayStations: false,
        /** 是否在市郊铁路（S1 等）卡片中显示 */
        showOnSuburbanStations: false,
        /** 精确排除的车站 ID 列表（命中即不显示该站按钮） */
        excludeStations: [],

        /** 图片四周留白（px），「适应窗口」时扣除，避免贴边 */
        fitPadding: 14,
        /** 最小缩放 = 适应窗口比例 × 该系数（允许略微缩得比适应窗口更小） */
        minZoomRatio: 0.4,
        /** 最大缩放 = 适应窗口比例 × 该系数 */
        maxZoomRatio: 10,
        /** 绝对放大上限（相对原图像素，防止过度放大成马赛克） */
        maxScaleCap: 8,

        version: VERSION
    };
    /* ==================== 可自由编辑区结束 (END EDIT) ====================== */

    /** 数据表在 window 上导出，便于外部按需修改（如 LANZHOU_FARE_TABLE.image = "..."） */
    window.LANZHOU_FARE_TABLE = LANZHOU_FARE_TABLE;

    /* ===================================================================== */
    /* ============================ 小工具函数 ============================== */
    /* ===================================================================== */

    function escapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * 是否与核心 footer-actions 的「小号按钮」版式一致。
     * 判定链必须与 core/station-board.js 中 footer-actions 的分支顺序保持一致：
     *   1. 国铁站（Rwy）            → 常规尺寸；
     *   2. 市郊铁路站（S1 等）      → 小号尺寸；
     *   3. 含 Rwy2 的混合站         → 小号尺寸；
     *   4. 其余普通地铁站           → 常规尺寸。
     */
    function isTinyLayout(context) {
        if (!context) return false;
        if (context.isRwyStation) return false;
        if (context.isSuburbanStation) return true;
        const related = (context.station && context.station.relatedLines) || [];
        return related.indexOf("Rwy2") !== -1;
    }

    /** 该车站是否展示「票价表」按钮（仅已运营车站） */
    function shouldShowButton(context) {
        const cfg = LANZHOU_FARE_TABLE;
        if (!cfg.enabled) return false;
        if (!context || !context.station) return false;
        // 未开通 / 在建车站（data_stations.js 中 type: "no"）不显示
        if (context.isNoStation) return false;

        const id = context.station.id;
        if (Array.isArray(cfg.excludeStations) && cfg.excludeStations.indexOf(id) !== -1) return false;
        if (context.isRwyStation && !cfg.showOnRailwayStations) return false;
        if (context.isSuburbanStation && !cfg.showOnSuburbanStations) return false;
        return true;
    }

    /* ===================================================================== */
    /* ====================== 票价表弹层（复用 core） ====================== */
    /* ===================================================================== */

    function openViewer() {
        const cfg = LANZHOU_FARE_TABLE;
        if (window.CGoImageViewer && typeof window.CGoImageViewer.open === "function") {
            window.CGoImageViewer.open({
                url: cfg.image,
                alt: cfg.imageAlt,
                title: cfg.viewerTitle || cfg.buttonText,
                caption: cfg.hint,
                maxWidth: "min(960px, 94vw)"
            });
        }
    }

    function closeViewer() {
        if (window.CGoImageViewer && typeof window.CGoImageViewer.close === "function") {
            window.CGoImageViewer.close();
        }
    }

    /** 对外暴露（便于其他模块 / 控制台调试调用） */
    window.LanzhouFareTable = {
        version: VERSION,
        open: openViewer,
        close: closeViewer,
        data: LANZHOU_FARE_TABLE
    };

    /* ===================================================================== */
    /* ============================ 模块注册 =============================== */
    /* ===================================================================== */

    function registerFareTableModule(attempt = 0) {
        if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") {
            if (attempt < 100) setTimeout(() => registerFareTableModule(attempt + 1), 50);
            return;
        }

        window.StationBoard.registerModule({
            id: MODULE_ID,
            name: "票价表",
            slot: "footer",       // 底部操作栏
            targetTab: "footer",
            order: 9,             // 先于核心 footer-actions(10) → 位于「官网查询 / 高德导航」上方
            enabled: true,

            shouldRender(context) {
                return shouldShowButton(context);
            },

            render(context) {
                const cfg = LANZHOU_FARE_TABLE;
                const size = isTinyLayout(context) ? "tiny" : "normal";
                const stationId = (context.station && context.station.id) || "";
                return `
                    <button type="button" id="lanzhou-fare-table-btn" class="lanzhou-fare-table-btn"
                            data-size="${size}" data-station-id="${escapeHtml(stationId)}"
                            title="${escapeHtml(cfg.buttonTitle)}" aria-haspopup="dialog">
                        <cgo-icon name="ticket" size="14"></cgo-icon><span>${escapeHtml(cfg.buttonText)}</span>
                    </button>
                `;
            },

            onMounted(panel) {
                const btn = panel && panel.querySelector("#lanzhou-fare-table-btn");
                if (!btn || btn.dataset.lanzhouFareBound === "1") return;
                btn.dataset.lanzhouFareBound = "1";
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openViewer();
                });
            }
        });

        console.log(`[lanzhou_fare_table] 兰州「票价表」模块已挂载到 StationBoard (v${VERSION})。`);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", registerFareTableModule, { once: true });
    } else {
        registerFareTableModule();
    }
})();
