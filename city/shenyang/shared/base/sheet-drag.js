/**
 * CGo OpenMap - 共享层：移动端底部抽屉「手势引擎」(shared/base/sheet-drag.js)
 *
 * 与具体面板解耦：位置空间、档位读写、拖动期的类切换、滚动锁全部由**适配器**提供，
 * 引擎只负责「头部/把手拖拽 + 内容区手势仲裁 + 跟手 + 落位吸附」这套通用行为。
 *
 * 三个面板接入：
 *   · 车站详情  #info-panel      —— panel-sheet-gesture.js 提供适配器（top 空间，接管 core 的拖拽）
 *   · 行程规划  #cgo-route-card  —— route-panel.js 提供适配器（height 空间）
 *   · 路线结果  #cgo-route-result—— 同上
 *
 * 行为（仅移动端 ≤640）：
 *   1. **头部 / 把手**：跟手拖动，松手按速度甩动 / 就近吸附；轻点循环换档（tapTarget 决定循环目标）。
 *   2. **内容区**：首次超过阈值的位移时定档，整段手势不再翻转——
 *        · lockHalfScroll 且「半屏 + 上滑」 → 跟手展开（优先展开，不先滚内容）
 *        · 内容已在顶部 + 下滑              → 跟手收起
 *        · 内容已在底部 + 上滑（非最大档）   → 跟手展开（短内容自然可用）
 *        · 其余                             → 交给原生滚动
 *      滚动中抵达顶部 / 底部会**无缝接管**为跟手（不必松手再划一次）。
 *   3. **滚动锁**：lockHalfScroll 时，半屏把内容区 `touch-action` 内联写死为 `none`——
 *      否则「半屏上滑想展开」会被浏览器先把滚动抢走（我们判定时 touchmove 已不可取消）。
 *
 * ⚠️ 本引擎会接管面板上**所有**抽屉手势，故调用方必须先卸掉原有的拖拽监听
 *    （车站面板卸 core 的 `panel._mobileSheetDragCleanup`；行程面板不再自己绑拖动）。
 *
 * 对外接口：window.CGoSheetDrag = { create(config) -> { refresh, destroy } }。
 * 无样式表；观感类名由适配器在 beginDrag / applyStage 里自行增删。
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    const MOBILE_MAX = 640;
    const MOVE_THRESHOLD = 8;        // px：内容区手势方向判定
    const HEADER_THRESHOLD = 6;      // px：头部拖拽启动阈值
    const TAP_SLOP = 7;              // px：轻点把手/标题栏的判定
    const SETTLE_VELOCITY = 0.6;     // px/ms：松手甩动换档速度阈值
    const VELOCITY_STALE_MS = 90;    // ms：停顿超过此值，速度归零
    /** 表单控件上起手不接管（让输入框内的文本选择等原生行为照常）。
     *  ⚠️ 不能把 `a` / `button` 算进来：车站层级图是整宽 `<a>`，按钮也常占满一行，
     *  在它们上面起手若跳过，用户在那块区域滑动会毫无反应（实测踩过）。 */
    const SKIP_SELECTOR = "input, select, textarea, label";

    const isMobile = () => window.innerWidth <= MOBILE_MAX;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    /**
     * @param {object} cfg 适配器配置
     * @param {HTMLElement} cfg.panel            抽屉元素
     * @param {() => HTMLElement} cfg.getScrollEl 内容滚动容器（可随渲染变化，每次事件时取）
     * @param {string[]} cfg.stages              档位名，按「最小 → 占屏最多」排序
     * @param {() => string} cfg.getStage        读当前档位
     * @param {() => Record<string, number>} cfg.detents 各档位在适配器位置空间里的数值
     * @param {number} [cfg.deltaSign=1]         手指位移 → 位置增量方向（top 空间为 +1，height 空间为 -1）
     * @param {() => number} cfg.readPosition    当前面板位置（跟手起点）
     * @param {(p:number) => void} cfg.writePosition 跟手期间写内联位置
     * @param {() => void} cfg.clearPosition     清内联位置（交回 CSS 档位）
     * @param {() => void} cfg.beginDrag         进入拖动（禁过渡 / 收填色 / 解除 max-height 等）
     * @param {() => void} cfg.endDrag           退出拖动（恢复过渡）
     * @param {(name:string) => void} cfg.applyStage 写档位（类名等）
     * @param {() => void} [cfg.onSettle]        落位后（取景等）
     * @param {(current:string) => string} [cfg.tapTarget] 轻点把手/标题栏的循环目标；不传则不启用轻点换档
     * @param {boolean} [cfg.lockHalfScroll=true] 半屏是否禁掉内容区原生滚动
     * @param {string} [cfg.halfStage="half"]    半屏档名
     * @param {HTMLElement} [cfg.stageObserveEl=document.body] 额外观察 class 变化的元素（档位类所在处）
     * @param {string} [cfg.headerSelector=".panel-header"]
     * @param {string} [cfg.grabberSelector=".sheet-grabber, .cgo-rt-grabber"]
     */
    function create(cfg) {
        const panel = cfg.panel;
        const noop = () => { };
        if (!panel || !cfg.getStage || !cfg.detents || !cfg.readPosition) {
            return { refresh: noop, destroy: noop };
        }
        const getScrollEl = cfg.getScrollEl || (() => panel.querySelector(".panel-body"));
        const stages = cfg.stages && cfg.stages.length ? cfg.stages : ["collapsed", "half", "full"];
        const lastStage = stages[stages.length - 1];
        const deltaSign = cfg.deltaSign == null ? 1 : cfg.deltaSign;
        const halfStage = cfg.halfStage || "half";
        const lockHalfScroll = cfg.lockHalfScroll !== false;
        const headerSelector = cfg.headerSelector || ".panel-header";
        const grabberSelector = cfg.grabberSelector || ".sheet-grabber, .cgo-rt-grabber";
        const onSettle = cfg.onSettle || noop;

        let drag = null;    // 头部 / 把手拖拽
        let touch = null;   // 内容区手势

        // ── 位置 / 档位工具 ────────────────────────────────────────────
        const posValues = () => {
            const d = cfg.detents();
            return stages.map((s) => d[s]);
        };
        const clampPos = (p) => {
            const vals = posValues();
            return clamp(p, Math.min.apply(null, vals), Math.max.apply(null, vals));
        };
        const nearestStage = (p) => {
            const d = cfg.detents();
            let best = stages[0];
            let bestDiff = Infinity;
            stages.forEach((s) => {
                const diff = Math.abs(d[s] - p);
                if (diff < bestDiff) { bestDiff = diff; best = s; }
            });
            return best;
        };
        const stepStage = (from, dir) => stages[clamp(stages.indexOf(from) + dir, 0, stages.length - 1)];

        /** 落位：先退出拖动（恢复过渡）→ 改档位 → 强制重排锁定起点 → 清内联位置，让 CSS 从「拖到的位置」过渡过去 */
        function settle(pos, velocity, fromStage, keepTop) {
            const scrollEl = getScrollEl();
            // 内容区滚动位置：拖动会改内容区高度、浏览器常把 scrollTop 顺手钳掉，
            // 故在**进入跟手态之前**就记下（keepTop），落位后补回去；没传则用当前值。
            const top = keepTop == null ? (scrollEl ? scrollEl.scrollTop : 0) : keepTop;
            const fast = Math.abs(velocity) >= SETTLE_VELOCITY;
            const target = fast ? stepStage(fromStage, velocity < 0 ? 1 : -1) : nearestStage(pos);
            cfg.endDrag();
            cfg.applyStage(target);
            void panel.offsetHeight;
            cfg.clearPosition();
            if (scrollEl && scrollEl.isConnected) {
                const restoreScroll = () => {
                    if (scrollEl.scrollTop !== top) scrollEl.scrollTop = top;
                };
                restoreScroll();
                requestAnimationFrame(restoreScroll);   // 应对浏览器的后置布局钳制
                setTimeout(restoreScroll, 60);
            }
            onSettle();
        }

        // ── 头部 / 把手拖拽 ────────────────────────────────────────────
        function onHeaderDown(e) {
            if (!isMobile()) return;
            const t = e.target;
            if (!t || typeof t.closest !== "function") return;
            if (t.closest(SKIP_SELECTOR) || t.closest("button, a")) return;
            const isGrabber = !!t.closest(grabberSelector);
            if (!isGrabber && !t.closest(headerSelector)) return;
            if (isGrabber) e.preventDefault();
            const now = performance.now();
            drag = {
                y0: e.clientY, basePos: cfg.readPosition(), fromStage: cfg.getStage(),
                started: false, pos: null, pointerId: e.pointerId,
                lastY: e.clientY, lastAt: now, velocity: 0
            };
        }

        function onHeaderMove(e) {
            if (!drag) return;
            const dy = e.clientY - drag.y0;
            if (!drag.started) {
                if (Math.abs(dy) < HEADER_THRESHOLD) return;
                drag.started = true;
                panel.setPointerCapture && panel.setPointerCapture(drag.pointerId);
                // 先钉住当前位置再解除 max-height（同 enterSheet 的道理：反序会让面板瞬间撑到内容高、把 scrollTop 钳成 0）
                cfg.writePosition(drag.basePos);
                cfg.beginDrag();
            }
            const pos = clampPos(drag.basePos + deltaSign * dy);
            drag.pos = pos;
            cfg.writePosition(pos);
            const now = performance.now();
            const dt = Math.max(1, now - drag.lastAt);
            const instant = (e.clientY - drag.lastY) / dt;
            drag.velocity = dt > VELOCITY_STALE_MS ? instant : drag.velocity * 0.6 + instant * 0.4;
            drag.lastY = e.clientY;
            drag.lastAt = now;
        }

        function onHeaderUp(e) {
            if (!drag) return;
            const d = drag;
            drag = null;
            if (d.started) {
                panel.releasePointerCapture && panel.releasePointerCapture(d.pointerId);
                const release = performance.now() - d.lastAt > VELOCITY_STALE_MS ? 0 : d.velocity;
                settle(d.pos == null ? d.basePos : d.pos, release, d.fromStage);
            } else if (cfg.tapTarget) {
                // 轻点把手 / 标题栏：循环换档
                cfg.applyStage(cfg.tapTarget(d.fromStage));
                onSettle();
            }
        }

        // ── 内容区手势 ────────────────────────────────────────────────
        function enterSheet(y, fromStage) {
            touch.mode = "sheet";
            // ⚠️ 必须在改高度之前记下滚动位置：跟手一开始就会改内容区高度，浏览器可能
            //    当场把 scrollTop 钳到 0（长列表在展开途中变得整屏可见时），事后再读就晚了
            const scrollEl = getScrollEl();
            touch.keepTop = scrollEl ? scrollEl.scrollTop : 0;
            touch.basePos = cfg.readPosition();
            touch.baseY = y;
            touch.pos = touch.basePos;
            touch.lastY = y;
            touch.lastAt = performance.now();
            // 先按当前位置钉一个显式高度，再交 beginDrag 解除 max-height —— 顺序不能反：
            // 解除上限后、写下第一帧高度之前会有一次强制布局（detents 读 offsetHeight），
            // 那一瞬间面板高度成 auto、会撑到整份内容那么高，内容区当场无处可滚 → scrollTop 被钳成 0。
            cfg.writePosition(touch.basePos);
            cfg.beginDrag();
        }

        function onTouchStart(e) {
            touch = null;
            if (!isMobile() || e.touches.length !== 1) return;
            const scrollEl = getScrollEl();
            const t = e.target;
            if (!scrollEl || !t || !scrollEl.contains(t)) return;
            if (typeof t.closest === "function" && t.closest(SKIP_SELECTOR)) return;
            const st = cfg.getStage();
            if (st === stages[0]) return;   // 最小档内容不可见，不可能从内容区起手
            const y = e.touches[0].clientY;
            touch = {
                y0: y, baseY: y, basePos: 0, fromStage: st, mode: null,
                pos: null, lastY: y, lastAt: performance.now(), velocity: 0
            };
        }

        function onTouchMove(e) {
            if (!touch) return;
            if (e.touches.length !== 1) { onTouchEnd(); return; }
            const scrollEl = getScrollEl();
            const y = e.touches[0].clientY;
            const dy = y - touch.y0;
            const atTop = !scrollEl || scrollEl.scrollTop <= 0;
            const atBottom = !scrollEl || (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1);
            const canExpand = touch.fromStage !== lastStage;

            if (!touch.mode) {
                if (Math.abs(dy) < MOVE_THRESHOLD) return;
                if (lockHalfScroll && touch.fromStage === halfStage && dy < 0) enterSheet(y, touch.fromStage);
                else if (dy > 0 && atTop) enterSheet(y, touch.fromStage);
                else if (dy < 0 && atBottom && canExpand) enterSheet(y, touch.fromStage);
                else touch.mode = "scroll";
            } else if (touch.mode === "scroll") {
                // 滚动中抵达边界后继续同向滑动 → 无缝接管为跟手
                if (dy > 0 && atTop) enterSheet(y, touch.fromStage);
                else if (dy < 0 && atBottom && canExpand) enterSheet(y, touch.fromStage);
            }

            if (touch.mode !== "sheet") return;
            if (e.cancelable) e.preventDefault();
            const pos = clampPos(touch.basePos + deltaSign * (y - touch.baseY));
            touch.pos = pos;
            cfg.writePosition(pos);
            const now = performance.now();
            const dt = Math.max(1, now - touch.lastAt);
            const instant = (y - touch.lastY) / dt;
            touch.velocity = dt > VELOCITY_STALE_MS ? instant : touch.velocity * 0.6 + instant * 0.4;
            touch.lastY = y;
            touch.lastAt = now;
        }

        function onTouchEnd() {
            const t = touch;
            touch = null;
            if (!t || t.mode !== "sheet") return;
            settle(t.pos == null ? t.basePos : t.pos, t.velocity, t.fromStage, t.keepTop);
        }

        // ── 滚动锁：半屏禁掉内容区原生滚动 ─────────────────────────────
        // 缓存「元素 + 锁定态」，避免被频繁的子树变动（如地图卡片铺瓦片）触发无谓的样式写入
        let lockEl = null;
        let lockState = null;
        function syncScrollLock() {
            const el = getScrollEl();
            if (!el) return;
            const locked = isMobile() && lockHalfScroll && cfg.getStage() === halfStage;
            if (el === lockEl && locked === lockState) return;
            lockEl = el;
            lockState = locked;
            if (locked) el.style.setProperty("touch-action", "none", "important");
            else el.style.removeProperty("touch-action");   // 交回页面样式（全屏时通常是 pan-y）
        }

        // ── 绑定 ─────────────────────────────────────────────────────
        panel.addEventListener("pointerdown", onHeaderDown, { passive: false });
        panel.addEventListener("pointermove", onHeaderMove, { passive: true });
        panel.addEventListener("pointerup", onHeaderUp);
        panel.addEventListener("pointercancel", onHeaderUp);
        panel.addEventListener("touchstart", onTouchStart, { passive: true });
        panel.addEventListener("touchmove", onTouchMove, { passive: false });   // 需 preventDefault
        panel.addEventListener("touchend", onTouchEnd, { passive: true });
        panel.addEventListener("touchcancel", onTouchEnd, { passive: true });

        // 档位可能被本引擎之外的代码切换（车站走 body 类、行程面板走面板自身的类），
        // 故盯住两处的 class，随时校正滚动锁。
        // ⚠️ 行程面板会被整体重建，故 stageObserveEl 传面板自身、不挂 document.body——
        //    挂在 body 上会让观察器从根可达，把已拆除的面板连同引擎一起吊住（内存泄漏）。
        const classObserver = new MutationObserver(syncScrollLock);
        classObserver.observe(panel, { attributes: true, attributeFilter: ["class"] });
        // 内容容器会随渲染 / 异步内容插入而更换，子节点一变就校正一次（有缓存，代价极低）
        classObserver.observe(panel, { childList: true, subtree: true });
        const stageObserveEl = cfg.stageObserveEl === undefined ? document.body : cfg.stageObserveEl;
        if (stageObserveEl && stageObserveEl !== panel) {
            classObserver.observe(stageObserveEl, { attributes: true, attributeFilter: ["class"] });
        }

        syncScrollLock();

        return {
            /** 面板重渲染 / 尺寸变化后调用：重新同步滚动锁（内容容器可能已换新） */
            refresh: () => { syncScrollLock(); },
            destroy: () => {
                panel.removeEventListener("pointerdown", onHeaderDown);
                panel.removeEventListener("pointermove", onHeaderMove);
                panel.removeEventListener("pointerup", onHeaderUp);
                panel.removeEventListener("pointercancel", onHeaderUp);
                panel.removeEventListener("touchstart", onTouchStart);
                panel.removeEventListener("touchmove", onTouchMove);
                panel.removeEventListener("touchend", onTouchEnd);
                panel.removeEventListener("touchcancel", onTouchEnd);
                classObserver.disconnect();
                drag = null;
                touch = null;
            }
        };
    }

    window.CGoSheetDrag = { create };
})();
