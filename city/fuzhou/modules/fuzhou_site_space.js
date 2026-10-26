/**
 * CGo OpenMap - 福州城市专属模块：车站空间示意图与出入口
 * (city/fuzhou/modules/fuzhou_site_space.js)
 *
 * 数据源：data_site_space.js 的 FUZHOU_SITE_SPACE_DATA（各站 map 外链 + exits 出入口清单）。
 *
 * 看大图的方式**按设备分两套**（`isTouchFirst()` 判定，见下）：
 *
 *   桌面（精确指针 / 鼠标为主）—— 沿用 `<cgo-modal>` 卡片式浮层：
 *     宽度上限 `min(1560px, 94vw)`，图片 `max-height:84vh; object-fit:contain`，
 *     点窗口以外遮罩或按 Esc 退出。宽屏上观感已经很合适，也无需缩放平移。
 *
 *   触屏（粗指针 / 手指操作为主）—— 自带全屏查看器：
 *     手机上 <cgo-modal> 有三个问题：① 图片受卡片内边距 + `max-height:84vh` 双重挤压，
 *     点开只比缩略图大一点；② 它的遮罩是全屏 `backdrop-filter: blur(8px)`，且位于 Shadow DOM，
 *     捏合缩放时浏览器每帧重算整屏高斯模糊，掉帧严重；③ 没有平移能力，放大后看不到图外内容。
 *     故触屏改走本文件的全屏查看器：
 *       · `position:fixed; inset:0` 铺满视口，图片按 contain 贴合后**以 transform 缩放**
 *         （合成层，不触发布局），不再受 84vh 限制；
 *       · `touch-action:none` 接管指针事件 —— 单指拖动平移、双指捏合缩放（以双指中点为锚点）、
 *         双击在「适应屏幕」与「约 3 倍」间切换；平移用 clamp 保证图边不脱离可视区；
 *       · 无 backdrop-filter，只改 transform，`will-change:transform` 预提升；
 *       · 关闭按钮 / Esc 退出，含安全区内边距。
 *
 * 为什么用能力判定而不是 UA：`(pointer: coarse)` 描述的是**主输入设备**，
 *   带触屏的笔记本仍以鼠标为主会判为桌面（正确）；手机/平板判为触屏（正确）。
 *   若浏览器不支持 matchMedia，回退看 `navigator.maxTouchPoints`。
 *
 * 调试与评审：URL 上带 `?fzviewer=touch` 或 `?fzviewer=desktop` 可**强制**走某一条路径，
 *   用于在电脑上直接比对两套浮层（不带该参数时仍按设备自动判定）。
 *   触屏查看器对鼠标同样可用：拖动平移、滚轮缩放、双击切换 —— 因此电脑上强制成 touch
 *   就能完整验证手势链路（只有「双指捏合」需要真机）。
 *
 * 挂载于「车站信息」选项卡（station-info），order 15，排在「文化名胜指引」(14) 之后。
 * 图标严格使用 CGoUI 矢量组件，禁用 Emoji；配色优先使用主题变量。
 */

(function () {
    const SOURCE_LABEL = "福州地铁官网「站点查询」";
    /** 桌面卡片浮层的宿主 id 与宽度上限（宽屏给到 1560px，窄屏留出边距） */
    const MODAL_ID = "fuzhou-space-lightbox";
    const MODAL_MAX_WIDTH = "min(1560px, 94vw)";
    /** 触屏全屏查看器的宿主 id 与样式表 id */
    const VIEWER_ID = "fuzhou-space-viewer";
    const STYLE_ID = "fuzhou-space-viewer-style";
    /** 调试用 URL 参数名：?fzviewer=touch|desktop 强制覆盖设备判定 */
    const MODE_PARAM = "fzviewer";

    /** 当前打开的浮层/查看器的关闭函数（同时只允许一个） */
    let activeClose = null;

    function getEntry(context) {
        if (typeof FUZHOU_SITE_SPACE_DATA === "undefined" || !FUZHOU_SITE_SPACE_DATA) return null;
        const stationId = context.station && context.station.id;
        return (stationId && FUZHOU_SITE_SPACE_DATA[stationId]) || null;
    }

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /**
     * 是否「以触屏为主」的设备 —— 决定用全屏查看器还是卡片浮层。
     *
     * `(pointer: coarse)` 指**主输入设备**：手机/平板为 true；
     * 带触摸屏的笔记本以鼠标/触控板为主时为 false（仍走桌面卡片，正确）。
     * matchMedia 不可用时回退 maxTouchPoints（老浏览器兜底）。
     */
    function isTouchFirst() {
        if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
            try {
                return window.matchMedia("(pointer: coarse)").matches;
            } catch (err) { /* 落到下面的兜底 */ }
        }
        return typeof navigator !== "undefined" && navigator && navigator.maxTouchPoints > 0;
    }

    /**
     * 调试覆盖：读 `?fzviewer=touch|desktop`。
     * 仅用于在电脑上比对两条路径，取不到或值非法时返回空串（走设备自动判定）。
     */
    function forcedMode() {
        try {
            const raw = new URLSearchParams(window.location.search).get(MODE_PARAM);
            const value = String(raw || "").toLowerCase();
            if (value === "touch" || value === "desktop") return value;
        } catch (err) { /* URLSearchParams 不可用时忽略 */ }
        return "";
    }

    /** 最终走哪条路径：URL 强制优先，否则按设备判定 */
    function useTouchViewer() {
        const forced = forcedMode();
        if (forced) return forced === "touch";
        return isTouchFirst();
    }

    /* ======================================================================
     * 桌面：<cgo-modal> 卡片式浮层（原有做法，保持不变）
     * ==================================================================== */

    /** 取（或创建）大图浮层。宿主是 0×0 挂载点，遮罩与布局都由组件自带 */
    function lightboxEl() {
        let el = document.getElementById(MODAL_ID);
        if (el) return el;
        el = document.createElement("cgo-modal");
        el.id = MODAL_ID;
        el.setAttribute("max-width", MODAL_MAX_WIDTH);
        // 遮罩点击关闭是组件默认行为（close-on-overlay 默认 true），这里显式写出来
        el.setAttribute("close-on-overlay", "");
        document.body.appendChild(el);
        // 关掉后清掉内容：大图是几 MB 的外链，留在 DOM 里会一直占着内存与解码结果
        el.addEventListener("cgo-close", () => { el.innerHTML = ""; });
        return el;
    }

    /**
     * 桌面端打开大图。
     * @param {{ map: string, cn?: string }} entry 站点条目
     * @param {string} stationName 站点中文名（用于标题与 alt）
     */
    function openLightboxDesktop(entry, stationName) {
        const modal = lightboxEl();
        const name = stationName || entry.cn || "本站";
        modal.title = `${name} 车站空间示意图`;
        modal.innerHTML = `
            <div class="fuzhou-space-lightbox" style="display:flex; flex-direction:column; gap:8px;">
                <img src="${esc(entry.map)}" alt="${esc(name)}站点空间示意图（大图）"
                     decoding="async" referrerpolicy="no-referrer"
                     style="display:block; width:100%; max-height:84vh; object-fit:contain;
                            border-radius:6px; background:var(--card-bg);">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;
                            flex-wrap:wrap; font-size:11px; color:var(--text-light);">
                    <span style="display:inline-flex; align-items:center; gap:4px;">
                        <cgo-icon name="info" size="12"></cgo-icon>
                        <span>${SOURCE_LABEL} · 点窗口以外区域或按 Esc 退出</span>
                    </span>
                    <a href="${esc(entry.map)}" target="_blank" rel="noreferrer"
                       style="color:var(--primary-color, #006098); text-decoration:none;
                              display:inline-flex; align-items:center; gap:3px; white-space:nowrap;">
                        <span>官网原图</span><cgo-icon name="external" size="11"></cgo-icon>
                    </a>
                </div>
            </div>
        `;
        // 外链可能取不到（离线 / CDN 变动）：给一句可读的提示，而不是留一片空白
        const img = modal.querySelector("img");
        img?.addEventListener("error", () => {
            img.replaceWith(Object.assign(document.createElement("div"), {
                textContent: "大图加载失败，请检查网络后重试，或点下方「官网原图」打开。",
                style: "padding:28px 16px; text-align:center; color:var(--text-light); font-size:12px;"
            }));
        }, { once: true });
        modal.open = true;
        activeClose = () => {
            try { modal.open = false; } catch (err) { /* 忽略 */ }
        };
    }

    /* ======================================================================
     * 触屏：全屏查看器样式（只注入一次；前缀 fz-lb- 避免污染全局）
     *
     * 配色有意用「深色磨砂 + 浅色文字」而不是跟随主题：这是一张图查看器，
     * 深色底能压住图片白边、也避免亮色主题下大面积白底刺眼。变量集中在此处便于改。
     * ==================================================================== */
    const STYLE_TEXT = `
.fz-lb {
    --fz-lb-scrim: rgba(10, 14, 20, 0.96);
    --fz-lb-fg: #eef2f6;
    --fz-lb-muted: rgba(238, 242, 246, 0.62);
    --fz-lb-line: rgba(255, 255, 255, 0.14);
    position: fixed;
    inset: 0;
    z-index: 99995;
    display: flex;
    flex-direction: column;
    background: var(--fz-lb-scrim);
    color: var(--fz-lb-fg);
    overscroll-behavior: contain;
    -webkit-tap-highlight-color: transparent;
}
.fz-lb-top {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: calc(8px + env(safe-area-inset-top, 0px)) 14px 8px;
    border-bottom: 1px solid var(--fz-lb-line);
}
.fz-lb-title {
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.fz-lb-hint {
    margin-left: auto;
    font-size: 11px;
    color: var(--fz-lb-muted);
    white-space: nowrap;
}
.fz-lb-stage {
    flex: 1 1 auto;
    position: relative;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.3);
    /* 交给我们自己处理手势：否则浏览器会做页面滚动/整页捏合，与缩放打架 */
    touch-action: none;
    overscroll-behavior: contain;
    cursor: grab;
}
.fz-lb-stage.is-drag { cursor: grabbing; }
.fz-lb-img {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    will-change: transform;
    max-width: none;
    max-height: none;
    user-select: none;
    -webkit-user-drag: none;
    background: #fff;
    border-radius: 2px;
    box-shadow: 0 10px 48px rgba(0, 0, 0, 0.5);
}
.fz-lb-status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    font-size: 12px;
    line-height: 1.6;
    color: var(--fz-lb-muted);
    pointer-events: none;
}
.fz-lb-bar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px calc(8px + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--fz-lb-line);
}
.fz-lb-zoom {
    margin-right: auto;
    font-size: 12px;
    color: var(--fz-lb-muted);
    font-variant-numeric: tabular-nums;
}
.fz-lb-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 11px;
    border: 1px solid var(--fz-lb-line);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--fz-lb-fg);
    font: inherit;
    font-size: 12px;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
}
.fz-lb-btn:active { background: rgba(255, 255, 255, 0.16); }
.fz-lb-btn-close { background: rgba(255, 255, 255, 0.13); }
@media (max-width: 640px) {
    /* 手机上不要把操作提示藏起来 —— 捏合缩放是这套查看器的核心能力，看不见提示就没人会用 */
    .fz-lb-hint { font-size: 10px; }
    .fz-lb-top { padding: calc(6px + env(safe-area-inset-top, 0px)) 12px 6px; }
    .fz-lb-bar { padding: 6px 12px calc(6px + env(safe-area-inset-bottom, 0px)); gap: 6px; }
    .fz-lb-btn { padding: 9px 12px; }
}
@media (max-width: 360px) {
    .fz-lb-hint { display: none; }
    .fz-lb-btn span { display: none; }
}
`;

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = STYLE_TEXT;
        document.head.appendChild(style);
    }

    /* ======================================================================
     * 触屏：全屏查看器
     * ==================================================================== */

    /**
     * 触屏端打开大图（全屏 + 缩放 + 平移）。
     * @param {{ map: string, cn?: string }} entry 站点条目
     * @param {string} stationName 站点中文名（用于标题与 alt）
     */
    function openLightboxTouch(entry, stationName) {
        if (!entry || !entry.map) return;
        ensureStyle();

        const name = stationName || entry.cn || "本站";
        // 提示文案按**实际有无悬停指针**给，而不是按"是否手机"：
        // 电脑上强制 ?fzviewer=touch 时鼠标可用滚轮/双击，提示双指反而会误导。
        const hasHover = typeof window.matchMedia === "function"
            && (() => { try { return window.matchMedia("(hover: hover)").matches; } catch (e) { return false; } })();
        const hintText = hasHover
            ? "滚轮缩放 · 拖动查看 · 双击放大"
            : "双指放大 · 拖动查看";

        const root = document.createElement("div");
        root.id = VIEWER_ID;
        root.className = "fz-lb";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.setAttribute("aria-label", `${name} 车站空间示意图`);
        root.innerHTML = `
            <div class="fz-lb-top">
                <span class="fz-lb-title">${esc(name)} 车站空间示意图</span>
                <span class="fz-lb-hint">${hintText}</span>
            </div>
            <div class="fz-lb-stage">
                <img class="fz-lb-img" alt="${esc(name)}站点空间示意图（大图）"
                     decoding="async" referrerpolicy="no-referrer">
                <div class="fz-lb-status">正在加载大图…</div>
            </div>
            <div class="fz-lb-bar">
                <span class="fz-lb-zoom">—</span>
                <button type="button" class="fz-lb-btn" data-act="reset"
                        title="回到适应屏幕" aria-label="适应屏幕">
                    <cgo-icon name="refresh" size="14"></cgo-icon><span>适应屏幕</span>
                </button>
                <a class="fz-lb-btn" data-act="origin" href="${esc(entry.map)}"
                   target="_blank" rel="noreferrer"
                   title="在新窗口打开官网原图" aria-label="官网原图">
                    <cgo-icon name="external" size="14"></cgo-icon><span>官网原图</span>
                </a>
                <button type="button" class="fz-lb-btn fz-lb-btn-close" data-act="close"
                        title="关闭" aria-label="关闭">
                    <cgo-icon name="close" size="14"></cgo-icon><span>关闭</span>
                </button>
            </div>
        `;

        /* ── 状态 ─────────────────────────────────────────────────────── */
        const stage = root.querySelector(".fz-lb-stage");
        const img = root.querySelector(".fz-lb-img");
        const statusEl = root.querySelector(".fz-lb-status");
        const zoomLabel = root.querySelector(".fz-lb-zoom");
        const closeBtn = root.querySelector('[data-act="close"]');
        const resetBtn = root.querySelector('[data-act="reset"]');

        const st = { nw: 0, nh: 0, min: 1, max: 1, scale: 1, tx: 0, ty: 0 };
        let box = { w: 0, h: 0 };
        let ready = false;

        const clampNum = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

        function measure() {
            const r = stage.getBoundingClientRect();
            box = { w: r.width || 1, h: r.height || 1 };
        }

        /** 由舞台尺寸与图片原始像素算出缩放上下限：min = 适应屏幕，max = 至少 1:1（小图允许到 2 倍） */
        function computeLimits() {
            if (!st.nw || !st.nh) return;
            st.min = Math.min(box.w / st.nw, box.h / st.nh, 1) || 0.1;
            st.max = Math.max(1, st.min * 2);
        }

        /** 平移钳制：图大于舞台时图边不脱离可视区；小于舞台时居中 */
        function clampPan() {
            const w = st.nw * st.scale;
            const h = st.nh * st.scale;
            st.tx = w <= box.w ? (box.w - w) / 2 : clampNum(st.tx, box.w - w, 0);
            st.ty = h <= box.h ? (box.h - h) / 2 : clampNum(st.ty, box.h - h, 0);
        }

        function apply() {
            img.style.transform = `translate3d(${st.tx}px, ${st.ty}px, 0) scale(${st.scale})`;
            if (zoomLabel && st.min) {
                zoomLabel.textContent = `${Math.round((st.scale / st.min) * 100)}%`;
            }
        }

        /** 适应屏幕 */
        function fit() {
            computeLimits();
            st.scale = st.min;
            clampPan();
            apply();
        }

        /** 以舞台坐标点 (px, py) 为锚点缩放到 next —— 该点下的图片内容保持不动 */
        function zoomAbout(next, px, py) {
            if (!ready) return;
            const target = clampNum(next, st.min, st.max);
            const anchorX = (px - st.tx) / st.scale;
            const anchorY = (py - st.ty) / st.scale;
            st.scale = target;
            st.tx = px - anchorX * target;
            st.ty = py - anchorY * target;
            clampPan();
            apply();
        }

        function toggleZoom(px, py) {
            if (!ready) return;
            if (st.scale > st.min * 1.05) { fit(); return; }
            zoomAbout(Math.max(st.min * 3, st.min + 0.001), px, py);
        }

        /* ── 指针手势 ─────────────────────────────────────────────────── */
        const pointers = new Map();
        let pinch = null;
        let drag = null;
        let lastTapAt = 0;
        let lastTapX = 0;
        let lastTapY = 0;

        function localPoint(e) {
            const r = stage.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
        }

        function onPointerDown(e) {
            if (!ready) return;
            if (e.pointerType === "mouse" && e.button !== 0) return;
            if (stage.setPointerCapture) {
                try { stage.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
            }
            const p = localPoint(e);
            pointers.set(e.pointerId, p);

            if (pointers.size === 2) {
                const [a, b] = [...pointers.values()];
                pinch = {
                    dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                    scale: st.scale,
                    tx: st.tx,
                    ty: st.ty,
                    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
                };
                drag = null;
            } else if (pointers.size === 1) {
                pinch = null;
                drag = { x: p.x, y: p.y, tx: st.tx, ty: st.ty, moved: false };
                stage.classList.add("is-drag");
            }
        }

        function onPointerMove(e) {
            if (!ready || !pointers.has(e.pointerId)) return;
            const p = localPoint(e);
            pointers.set(e.pointerId, p);

            // 双指：捏合缩放 + 双指平移。锚点取「起始时双指中点下的图片坐标」，
            // 让它跟随当前中点 —— 这样缩放与双指拖动可以同时发生，且不会跳。
            if (pinch && pointers.size >= 2) {
                const [a, b] = [...pointers.values()];
                const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
                const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                const anchorX = (pinch.mid.x - pinch.tx) / pinch.scale;
                const anchorY = (pinch.mid.y - pinch.ty) / pinch.scale;
                st.scale = clampNum(pinch.scale * (dist / pinch.dist), st.min, st.max);
                st.tx = mid.x - anchorX * st.scale;
                st.ty = mid.y - anchorY * st.scale;
                clampPan();
                apply();
                return;
            }

            // 单指：拖动平移
            if (drag && pointers.size === 1) {
                const dx = p.x - drag.x;
                const dy = p.y - drag.y;
                if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
                st.tx = drag.tx + dx;
                st.ty = drag.ty + dy;
                clampPan();
                apply();
            }
        }

        function onPointerUp(e) {
            if (!pointers.has(e.pointerId)) return;
            const p = pointers.get(e.pointerId);
            const wasSingle = pointers.size === 1;
            pointers.delete(e.pointerId);

            if (pointers.size < 2) pinch = null;

            if (pointers.size === 1) {
                // 双指松开一指 → 无缝转为单指拖动，避免「跳一下」
                const [q] = [...pointers.values()];
                drag = { x: q.x, y: q.y, tx: st.tx, ty: st.ty, moved: true };
            } else if (pointers.size === 0) {
                stage.classList.remove("is-drag");
                // 双击（双指点按）检测：未发生拖动、且在 320ms / 36px 内
                if (wasSingle && drag && !drag.moved) {
                    const now = Date.now();
                    if (now - lastTapAt < 320
                        && Math.hypot(p.x - lastTapX, p.y - lastTapY) < 36) {
                        toggleZoom(p.x, p.y);
                        lastTapAt = 0;
                    } else {
                        lastTapAt = now;
                        lastTapX = p.x;
                        lastTapY = p.y;
                    }
                }
                drag = null;
            }
        }

        /* ── 滚轮（触屏设备接了鼠标也能用）/ 尺寸变化 / 退出 ──────────── */
        function onWheel(e) {
            if (!ready) return;
            e.preventDefault();
            const p = localPoint(e);
            zoomAbout(st.scale * (e.deltaY < 0 ? 1.18 : 1 / 1.18), p.x, p.y);
        }

        function onResize() {
            if (!ready) return;
            const wasFitted = Math.abs(st.scale - st.min) < 1e-6;
            measure();
            const prevMin = st.min;
            computeLimits();
            // 原本就贴合屏幕的，跟着新的舞台尺寸重新贴合；否则只钳制范围
            st.scale = wasFitted || Math.abs(prevMin - st.min) < 1e-6
                ? st.min
                : clampNum(st.scale, st.min, st.max);
            clampPan();
            apply();
        }

        function onKeyDown(e) {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                close();
            }
        }

        /* ── 关闭 ─────────────────────────────────────────────────────── */
        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;

        function close() {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
            document.removeEventListener("keydown", onKeyDown, true);
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
            root.remove();
            if (activeClose === close) activeClose = null;
        }
        activeClose = close;

        /* ── 图片加载 ─────────────────────────────────────────────────── */
        img.addEventListener("load", () => {
            st.nw = img.naturalWidth || 0;
            st.nh = img.naturalHeight || 0;
            if (!st.nw || !st.nh) return;
            // 用原始像素作为布局尺寸，缩放全部交给 transform（合成层，不触发布局）
            img.style.width = `${st.nw}px`;
            img.style.height = `${st.nh}px`;
            ready = true;
            if (statusEl && statusEl.parentNode) statusEl.remove();
            measure();
            fit();
        }, { once: true });

        img.addEventListener("error", () => {
            ready = false;
            if (statusEl) {
                statusEl.textContent = "大图加载失败，请检查网络后重试，或点下方「官网原图」打开。";
            }
        }, { once: true });

        /* ── 事件绑定 ─────────────────────────────────────────────────── */
        stage.addEventListener("pointerdown", onPointerDown);
        stage.addEventListener("pointermove", onPointerMove);
        stage.addEventListener("pointerup", onPointerUp);
        stage.addEventListener("pointercancel", onPointerUp);
        stage.addEventListener("wheel", onWheel, { passive: false });

        closeBtn.addEventListener("click", close);
        resetBtn.addEventListener("click", () => { if (ready) fit(); });
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);
        document.addEventListener("keydown", onKeyDown, true);

        // 挡住地图的手势（浮层虽在最上层，但地图监听在 window 上，不拦会同时响应）
        ["pointerdown", "pointermove", "pointerup", "pointercancel",
            "wheel", "touchstart", "touchmove", "touchend"].forEach((type) => {
            root.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
        });

        /* ── 挂载并锁滚动 ─────────────────────────────────────────────── */
        document.body.appendChild(root);
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        if (closeBtn.focus) {
            try { closeBtn.focus({ preventScroll: true }); } catch (err) { closeBtn.focus(); }
        }
        measure();
        img.src = entry.map;
    }

    /* ======================================================================
     * 分派：按设备选路径
     * ==================================================================== */
    function openLightbox(entry, stationName) {
        if (!entry || !entry.map) return;
        // 关掉上一个（两侧共用一个 activeClose，避免同时叠两个浮层）
        if (activeClose) {
            const previous = activeClose;
            activeClose = null;
            try { previous(); } catch (err) { /* 忽略 */ }
        }
        if (useTouchViewer()) openLightboxTouch(entry, stationName);
        else openLightboxDesktop(entry, stationName);
    }

    /* ======================================================================
     * 点击接管（委托到 document，故面板反复重建也不需要重新绑定）
     * ==================================================================== */
    if (!window.__fuzhouSpaceLightboxBound) {
        window.__fuzhouSpaceLightboxBound = true;
        document.addEventListener("click", (event) => {
            const link = event.target?.closest?.("[data-fz-space-view]");
            if (!link) return;
            const url = link.getAttribute("data-fz-space-view");
            if (!url) return;
            // 摘掉默认的跳官网：改为本页浮层看大图
            event.preventDefault();
            openLightbox({ map: url, cn: link.getAttribute("data-fz-space-name") || "" },
                link.getAttribute("data-fz-space-name") || "");
        });
    }

    function exitRow(line) {
        const m = /^([^：:]+)[：:]\s*(.*)$/.exec(String(line).trim());
        const name = m ? m[1].trim() : String(line).trim();
        const desc = m ? m[2].trim() : "";
        return `
            <div style="display:flex; gap:6px; padding:1px 0;">
                <span style="flex:0 0 auto; color:var(--text-main); font-weight:600;">${esc(name)}</span>
                <span style="color:var(--text-light);">${esc(desc)}</span>
            </div>
        `;
    }

    window.StationBoard.registerModule({
        id: "fuzhou-station-space",
        name: "福州车站空间示意图",
        targetTab: "station-info",
        order: 15,
        shouldRender(context) {
            const entry = getEntry(context);
            return Boolean(entry && entry.map);
        },
        render(context) {
            const entry = getEntry(context);
            if (!entry || !entry.map) return "";
            const exits = Array.isArray(entry.exits) ? entry.exits : [];
            const cn = entry.cn || (context.station && context.station.cn) || "本站";
            const updated = entry.updatedAt ? " · 更新于 " + entry.updatedAt : "";

            return `
                <div style="margin:0 0 15px; padding:8px 10px; background:var(--card-bg); border-radius:6px; font-size:11px; line-height:1.45;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:6px;">
                        <span style="font-weight:600; color:var(--text-main); display:inline-flex; align-items:center; gap:4px;">
                            <cgo-icon name="map" size="13"></cgo-icon><span>车站空间示意图</span>
                        </span>
                        <button type="button" data-fz-space-view="${esc(entry.map)}" data-fz-space-name="${esc(cn)}"
                           style="border:0; background:none; padding:0; cursor:pointer; font:inherit;
                                  color:var(--primary-color, #006098); display:inline-flex; align-items:center;
                                  gap:3px; white-space:nowrap;">
                            <span>查看大图</span><cgo-icon name="zoom-in" size="12"></cgo-icon>
                        </button>
                    </div>
                    <button type="button" data-fz-space-view="${esc(entry.map)}" data-fz-space-name="${esc(cn)}"
                            title="点开看大图"
                            style="display:block; width:100%; padding:0; border:0; background:none; cursor:zoom-in;">
                        <img src="${esc(entry.map)}" alt="${esc(cn)}站点空间示意图"
                             loading="lazy" decoding="async" referrerpolicy="no-referrer"
                             style="display:block; width:100%; height:auto; border:1px solid var(--border-color); border-radius:6px; background:var(--card-bg);">
                    </button>
                    <div style="margin-top:8px; font-weight:600; color:var(--text-main); display:inline-flex; align-items:center; gap:4px;">
                        <cgo-icon name="gate" size="13"></cgo-icon><span>出入口${exits.length ? "（" + exits.length + "）" : ""}</span>
                    </div>
                    <div style="margin-top:4px;">
                        ${exits.length ? exits.map(exitRow).join("") : `<span style="color:var(--text-light);">官网暂未登记本站出入口信息。</span>`}
                    </div>
                    <div style="margin-top:6px; color:var(--text-light); font-size:10px;">${SOURCE_LABEL}${updated} · 图片为官网外链，需联网加载</div>
                </div>
            `;
        }
    });
})();
