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
    /** 本模块版本号（与 lanzhou.js 中 document.write 的 ?v= 保持一致） */
    const VERSION = "260927.160000";

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
        showOnRailwayStations: true,
        /** 是否在市郊铁路（S1 等）卡片中显示 */
        showOnSuburbanStations: true,
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

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

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
    /* ====================== 票价表弹层（图片查看器） ====================== */
    /* ===================================================================== */

    /** 弹层运行期状态（全局单例，随页面存活） */
    const viewer = {
        root: null,
        stage: null,
        img: null,
        loading: null,
        scale: 1,
        x: 0,
        y: 0,
        fitScale: 1,
        minScale: 0.05,
        maxScale: 8,
        pointers: new Map(),
        dragging: null,
        pinch: null,
        lastTap: null,
        suppressClick: false,
        userAdjusted: false,
        transitionTimer: null,
        escHandler: null,
        resizeHandler: null
    };

    /** 图片是否处于「已打开」状态 */
    function isViewerOpen() {
        return Boolean(viewer.root && viewer.root.classList.contains("is-open"));
    }

    function buildViewer() {
        if (viewer.root && document.body.contains(viewer.root)) return viewer.root;

        const cfg = LANZHOU_FARE_TABLE;
        const root = document.createElement("div");
        root.id = VIEWER_ID;
        root.className = "lanzhou-fare-viewer";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.setAttribute("aria-label", cfg.imageAlt || cfg.buttonText || "票价表");

        root.innerHTML = `
            <div class="lanzhou-fare-viewer-bar">
                <span class="lanzhou-fare-viewer-title">
                    <cgo-icon name="ticket" size="14"></cgo-icon><span>${escapeHtml(cfg.viewerTitle || cfg.buttonText)}</span>
                </span>
                <div class="lanzhou-fare-viewer-tools">
                    <button type="button" class="lanzhou-fare-viewer-btn" data-fare-act="zoom-out" title="缩小" aria-label="缩小">
                        <cgo-icon name="zoom-out" size="18"></cgo-icon>
                    </button>
                    <button type="button" class="lanzhou-fare-viewer-btn" data-fare-act="zoom-in" title="放大" aria-label="放大">
                        <cgo-icon name="zoom-in" size="18"></cgo-icon>
                    </button>
                    <button type="button" class="lanzhou-fare-viewer-btn" data-fare-act="reset" title="适应窗口" aria-label="适应窗口">
                        <cgo-icon name="refresh" size="18"></cgo-icon>
                    </button>
                    <button type="button" class="lanzhou-fare-viewer-btn is-close" data-fare-act="close" title="关闭" aria-label="关闭">
                        <cgo-icon name="close" size="18"></cgo-icon>
                    </button>
                </div>
            </div>
            <div class="lanzhou-fare-viewer-stage">
                <div class="lanzhou-fare-viewer-loading">票价表加载中…</div>
                <img class="lanzhou-fare-viewer-img is-loading" src="${escapeHtml(cfg.image)}"
                     alt="${escapeHtml(cfg.imageAlt)}" draggable="false" decoding="async">
            </div>
            <div class="lanzhou-fare-viewer-hint">${escapeHtml(cfg.hint)}</div>
        `;

        document.body.appendChild(root);

        viewer.root = root;
        viewer.stage = root.querySelector(".lanzhou-fare-viewer-stage");
        viewer.img = root.querySelector(".lanzhou-fare-viewer-img");
        viewer.loading = root.querySelector(".lanzhou-fare-viewer-loading");

        // 工具栏按钮（事件委托，弹层只构建一次）
        root.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-fare-act]");
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const act = btn.dataset.fareAct;
            if (act === "close") { closeViewer(); return; }
            if (act === "reset") { resetToFit(true); return; }
            const rect = viewer.stage.getBoundingClientRect();
            zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, act === "zoom-in" ? 1.25 : 1 / 1.25);
        });

        // 图片加载状态：加载完成后再「适应窗口」，避免先以原始尺寸闪一帧
        viewer.img.addEventListener("load", onImageLoaded);
        viewer.img.addEventListener("error", onImageError);
        if (viewer.img.complete && viewer.img.naturalWidth) onImageLoaded();

        // 舞台交互：拖动平移 / 双指捏合 / 双击复位 / 点空白关闭
        const stage = viewer.stage;
        stage.addEventListener("pointerdown", onPointerDown);
        stage.addEventListener("pointermove", onPointerMove);
        stage.addEventListener("pointerup", onPointerUp);
        stage.addEventListener("pointercancel", onPointerUp);
        stage.addEventListener("click", onStageClick);
        stage.addEventListener("dblclick", (e) => {
            if (e.target === viewer.img) { e.preventDefault(); resetToFit(true); }
        });
        stage.addEventListener("wheel", onWheel, { passive: false });

        // 弹层内部事件不向外冒泡，避免触发地图引擎的缩放 / 拖拽 / 站点选择
        ["pointerdown", "touchstart", "touchmove", "click"].forEach((ev) => {
            root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
        });
        // 工具条 / 提示条上的滚轮同样不传给地图层，并阻止页面滚动
        root.addEventListener("wheel", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        return root;
    }

    /* --------------------------- 变换与缩放 --------------------------- */

    function clearTransition() {
        if (!viewer.img) return;
        if (viewer.transitionTimer) { clearTimeout(viewer.transitionTimer); viewer.transitionTimer = null; }
        viewer.img.style.transition = "";
    }

    function applyTransform() {
        if (!viewer.img) return;
        viewer.img.style.transform =
            `translate(-50%, -50%) translate(${viewer.x}px, ${viewer.y}px) scale(${viewer.scale})`;
    }

    /** 平移边界：图片较小时允许露出一点，但不可整体拖出视野 */
    function clampPan() {
        if (!viewer.img || !viewer.stage) return;
        const iw = (viewer.img.naturalWidth || 0) * viewer.scale;
        const ih = (viewer.img.naturalHeight || 0) * viewer.scale;
        const sw = viewer.stage.clientWidth;
        const sh = viewer.stage.clientHeight;
        const marginX = Math.max(0, (iw - sw) / 2) + sw * 0.12;
        const marginY = Math.max(0, (ih - sh) / 2) + sh * 0.12;
        viewer.x = clamp(viewer.x, -marginX, marginX);
        viewer.y = clamp(viewer.y, -marginY, marginY);
    }

    /** 「适应窗口」比例（按原图像素计算，含四周留白） */
    function computeFitScale() {
        if (!viewer.img || !viewer.stage) return 1;
        const iw = viewer.img.naturalWidth || 0;
        const ih = viewer.img.naturalHeight || 0;
        if (!iw || !ih) return 1;
        const pad = Math.max(0, LANZHOU_FARE_TABLE.fitPadding || 0);
        const sw = Math.max(1, viewer.stage.clientWidth - pad * 2);
        const sh = Math.max(1, viewer.stage.clientHeight - pad * 2);
        return Math.min(sw / iw, sh / ih);
    }

    /** 复位为「适应窗口」并居中 */
    function resetToFit(animate) {
        if (!viewer.img || !viewer.stage) return;
        const cfg = LANZHOU_FARE_TABLE;
        const fit = computeFitScale();
        viewer.fitScale = fit;
        viewer.minScale = Math.max(0.02, fit * (cfg.minZoomRatio || 0.4));
        viewer.maxScale = Math.max(fit * (cfg.maxZoomRatio || 10), cfg.maxScaleCap || 8);
        viewer.scale = fit;
        viewer.x = 0;
        viewer.y = 0;
        viewer.userAdjusted = false;

        clearTransition();
        if (animate) {
            viewer.img.style.transition = "transform 0.22s ease-out";
            viewer.transitionTimer = setTimeout(() => {
                if (viewer.img) viewer.img.style.transition = "";
                viewer.transitionTimer = null;
            }, 260);
        }
        applyTransform();
    }

    /** 以屏幕上某点为锚点缩放（滚轮 / 按钮 / 捏合共用） */
    function zoomAt(clientX, clientY, factor) {
        if (!viewer.img || !viewer.stage) return;
        clearTransition();
        const rect = viewer.stage.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const next = clamp(viewer.scale * factor, viewer.minScale, viewer.maxScale);
        if (next === viewer.scale) return;
        const ratio = next / viewer.scale;
        viewer.x = dx - (dx - viewer.x) * ratio;
        viewer.y = dy - (dy - viewer.y) * ratio;
        viewer.scale = next;
        viewer.userAdjusted = true;
        clampPan();
        applyTransform();
    }

    /* --------------------------- 指针交互 --------------------------- */

    function onWheel(e) {
        e.preventDefault();
        e.stopPropagation();
        zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }

    function onPointerDown(e) {
        if (!isViewerOpen()) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;

        clearTransition();
        // 新的按下动作重新开始计：避免上一次拖动残留的「抑制点击」吞掉本次空白点击
        viewer.suppressClick = false;
        viewer.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (viewer.pointers.size === 1) {
            viewer.dragging = {
                id: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                x0: viewer.x,
                y0: viewer.y,
                moved: false
            };
            viewer.stage.classList.add("is-dragging");
        } else if (viewer.pointers.size === 2) {
            startPinch();
        }

        try { viewer.stage.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
    }

    function onPointerMove(e) {
        if (!viewer.pointers.has(e.pointerId)) return;
        viewer.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (viewer.pointers.size >= 2) {
            updatePinch();
            return;
        }

        const drag = viewer.dragging;
        if (!drag || drag.id !== e.pointerId) return;

        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
        viewer.x = drag.x0 + dx;
        viewer.y = drag.y0 + dy;
        clampPan();
        applyTransform();
    }

    function onPointerUp(e) {
        const drag = viewer.dragging && viewer.dragging.id === e.pointerId ? viewer.dragging : null;
        viewer.pointers.delete(e.pointerId);
        try { viewer.stage.releasePointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }

        if (viewer.pointers.size < 2) viewer.pinch = null;

        if (viewer.pointers.size === 0) {
            viewer.dragging = null;
            viewer.stage.classList.remove("is-dragging");
        } else if (viewer.pointers.size === 1) {
            // 双指松开一指：剩下那根手指无缝接管为拖动
            const entry = viewer.pointers.entries().next().value;
            viewer.dragging = {
                id: entry[0],
                startX: entry[1].x,
                startY: entry[1].y,
                x0: viewer.x,
                y0: viewer.y,
                moved: true
            };
        }

        // 拖动结束后的这一次 click 不再用于「点空白关闭」
        viewer.suppressClick = Boolean(drag && drag.moved);

        // 触屏双击复位（移动端 touch-action:none 下 dblclick 不可靠，故自行判定）
        if (drag && !drag.moved && e.pointerType !== "mouse") handlePossibleDoubleTap(e);
    }

    function handlePossibleDoubleTap(e) {
        const now = Date.now();
        const last = viewer.lastTap;
        if (last && now - last.t < 320 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
            viewer.lastTap = null;
            resetToFit(true);
            return;
        }
        viewer.lastTap = { t: now, x: e.clientX, y: e.clientY };
    }

    function onStageClick(e) {
        if (viewer.suppressClick) { viewer.suppressClick = false; return; }
        // 仅点击图片之外的空白区域才关闭（图片上双击用于复位）
        if (e.target !== viewer.stage && e.target !== viewer.loading) return;
        closeViewer();
    }

    /* --------------------------- 双指捏合 --------------------------- */

    function startPinch() {
        const pts = Array.from(viewer.pointers.values());
        if (pts.length < 2) return;
        const [a, b] = pts;
        viewer.pinch = {
            dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
            scale: viewer.scale,
            x: viewer.x,
            y: viewer.y,
            cx: (a.x + b.x) / 2,
            cy: (a.y + b.y) / 2
        };
        viewer.dragging = null;
        viewer.stage.classList.remove("is-dragging");
    }

    function updatePinch() {
        const pts = Array.from(viewer.pointers.values());
        if (pts.length < 2 || !viewer.pinch) return;
        const [a, b] = pts;
        const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        const next = clamp(viewer.pinch.scale * (dist / viewer.pinch.dist), viewer.minScale, viewer.maxScale);
        if (next === viewer.scale) return;

        const rect = viewer.stage.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = viewer.pinch.cx - cx;
        const dy = viewer.pinch.cy - cy;
        const ratio = next / viewer.pinch.scale;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;

        viewer.scale = next;
        viewer.x = dx - (dx - viewer.pinch.x) * ratio + (midX - viewer.pinch.cx);
        viewer.y = dy - (dy - viewer.pinch.y) * ratio + (midY - viewer.pinch.cy);
        viewer.userAdjusted = true;
        clampPan();
        applyTransform();
    }

    /* --------------------------- 图片加载 --------------------------- */

    function onImageLoaded() {
        if (!viewer.img || !viewer.loading) return;
        viewer.img.classList.remove("is-loading");
        viewer.loading.style.display = "none";
        // 弹层尚未显示时（display:none）舞台尺寸为 0，改在 openViewer 里再适应一次
        if (isViewerOpen()) resetToFit(false);
    }

    function onImageError() {
        if (!viewer.loading) return;
        viewer.loading.style.display = "";
        viewer.loading.textContent = "票价表图片加载失败，请检查网络后重试";
    }

    /* --------------------------- 打开 / 关闭 --------------------------- */

    function handleResize() {
        if (!isViewerOpen()) return;
        if (viewer.userAdjusted) { clampPan(); applyTransform(); }
        else resetToFit(false);
    }

    function handleEscape(e) {
        if (e.key === "Escape" || e.key === "Esc") {
            e.stopPropagation();
            closeViewer();
        }
    }

    function openViewer() {
        const root = buildViewer();
        if (isViewerOpen()) return;

        root.classList.add("is-open");
        viewer.userAdjusted = false;
        viewer.lastTap = null;
        viewer.suppressClick = false;

        // 弹层可见后才量得到舞台尺寸
        requestAnimationFrame(() => {
            if (viewer.img && viewer.img.naturalWidth) resetToFit(false);
        });

        if (!viewer.escHandler) viewer.escHandler = handleEscape;
        document.addEventListener("keydown", viewer.escHandler, true);
        if (!viewer.resizeHandler) viewer.resizeHandler = handleResize;
        window.addEventListener("resize", viewer.resizeHandler);

        const closeBtn = root.querySelector('[data-fare-act="close"]');
        if (closeBtn && typeof closeBtn.focus === "function") {
            try { closeBtn.focus({ preventScroll: true }); } catch (err) { closeBtn.focus(); }
        }
    }

    function closeViewer() {
        if (!viewer.root) return;
        viewer.root.classList.remove("is-open");
        viewer.pointers.clear();
        viewer.dragging = null;
        viewer.pinch = null;
        viewer.lastTap = null;
        viewer.suppressClick = false;
        viewer.stage.classList.remove("is-dragging");
        clearTransition();

        if (viewer.escHandler) document.removeEventListener("keydown", viewer.escHandler, true);
        if (viewer.resizeHandler) window.removeEventListener("resize", viewer.resizeHandler);
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

    function registerFareTableModule() {
        if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") {
            console.warn("[lanzhou_fare_table] StationBoard 尚未加载，延迟等待注册...");
            setTimeout(registerFareTableModule, 50);
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
