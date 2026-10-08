/** 通用移动抽屉：合成层平移、三档弹簧、正文滚动交接。无城市业务依赖。 */
(function () {
    const stages = ['collapsed', 'half', 'full'];
    const rubberBand = value => 120 * (1 - 1 / (1 + Math.max(0, value) * 0.55 / 120));

    function attach(panel, options) {
        let drag = null, candidate = null, frame = null, settling = null, currentTop = null;
        let detents = null, footer = null, dock = null, placeholder = null;
        const media = window.matchMedia('(max-width: 640px)');
        const originalStyle = new Map();
        const ownedStyles = ['top', 'bottom', 'height', 'max-height', 'transform', 'transition'];
        const set = (name, value) => panel.style.setProperty(name, value, 'important');
        const stage = () => options.getStage();
        const notify = (top, moving) => options.onGeometry?.({ top, dragging: moving });
        const write = top => {
            currentTop = top;
            set('transform', `translate3d(0, ${top - detents.full}px, 0)`);
            notify(top, true);
        };
        const stopFrames = () => {
            if (frame !== null) cancelAnimationFrame(frame);
            if (settling !== null) cancelAnimationFrame(settling);
            frame = settling = null;
        };
        function refresh() {
            if (!media.matches || drag || settling !== null) return;
            detents = options.getDetents();
            if (dock && !dock.isConnected && panel.isConnected) {
                panel.after(dock);
                dock.style.zIndex = String((Number.parseInt(getComputedStyle(panel).zIndex, 10) || 2000) + 1);
            }
            const vh = window.visualViewport?.height || window.innerHeight;
            if (dock) {
                const style = getComputedStyle(panel);
                dock.hidden = stage() === 'collapsed' || style.display === 'none' || style.visibility === 'hidden' || panel.classList.contains('cgo-rt-stacked-hidden');
            }
            const footerHeight = dock?.getBoundingClientRect().height || 0;
            set('top', `${detents.full}px`);
            set('bottom', 'auto');
            set('height', `${Math.max(0, vh - detents.full - footerHeight)}px`);
            set('max-height', 'none');
            set('transition', 'none');
            currentTop = detents[stage()];
            panel.style.setProperty('--cgo-sheet-resting-offset', `${currentTop - detents.full}px`);
            set('transform', `translate3d(0, ${currentTop - detents.full}px, 0)`);

        }
        function settle(next, velocity = 0) {
            stopFrames();
            const target = detents[next], start = currentTop ?? target;
            const startAt = performance.now();
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            panel.classList.add('cgo-sheet-moving');
            options.onStage(next);
            function tick(now) {
                const t = (now - startAt) / 1000;
                const x = start - target;
                const pos = target + (x + (velocity * 1000 + 14 * x) * t) * Math.exp(-14 * t);
                write(reduced ? target : Math.max(detents.full, pos));
                if (!reduced && t < 0.9 && Math.abs(pos - target) > 0.3) {
                    settling = requestAnimationFrame(tick);
                } else {
                    settling = null;
                    panel.classList.remove('cgo-sheet-moving');
                    refresh();
                    notify(target, false);
                }
            }
            settling = requestAnimationFrame(tick);
        }
        function begin(y, pointerId, toggle) {
            stopFrames();
            detents = options.getDetents();
            currentTop = panel.getBoundingClientRect().top;
            drag = { startY: y, startTop: currentTop, top: currentTop, lastY: y,
                at: performance.now(), velocity: 0, pointerId, toggle, stage: stage() };
            panel.classList.add('cgo-sheet-moving');
            if (pointerId != null && panel.hasPointerCapture && !panel.hasPointerCapture(pointerId)) panel.setPointerCapture?.(pointerId);
            options.onStart?.();
            notify(currentTop, true);
        }
        function move(y) {
            if (!drag) return;
            const raw = drag.startTop + y - drag.startY;
            drag.top = raw > detents.collapsed ? detents.collapsed + rubberBand(raw - detents.collapsed) : Math.max(detents.full, raw);
            const now = performance.now(), elapsed = Math.max(1, now - drag.at);
            const speed = (y - drag.lastY) / elapsed;
            drag.velocity = elapsed > 90 ? speed : drag.velocity * 0.6 + speed * 0.4;
            drag.lastY = y; drag.at = now;
            if (frame === null) frame = requestAnimationFrame(() => {
                frame = null;
                if (drag) write(drag.top);
            });
        }
        function end(y, cancelled = false) {
            if (!drag) return;
            const state = drag, dy = y - state.startY;
            const velocity = performance.now() - state.at > 90 ? 0 : state.velocity;
            stopFrames();
            write(state.top);
            drag = null;
            if (state.pointerId != null && panel.hasPointerCapture?.(state.pointerId)) panel.releasePointerCapture(state.pointerId);
            let next = state.stage;
            if (cancelled) next = stages.reduce((a, b) => Math.abs(detents[a] - state.top) < Math.abs(detents[b] - state.top) ? a : b);
            else if (Math.abs(dy) < 7 && state.toggle) next = state.stage === 'half' ? 'full' : 'half';
            else if (Math.abs(dy) >= 26 || Math.abs(velocity) >= 0.6) {
                const fast = Math.abs(velocity) >= 1.8 && Math.abs(dy) >= Math.max(120, (detents.collapsed - detents.full) * 0.28);
                const up = fast ? velocity < 0 : dy < 0;
                next = fast ? (up ? 'full' : 'collapsed') : stages[Math.max(0, Math.min(2, stages.indexOf(state.stage) + (up ? 1 : -1)))];
            }
            settle(next, cancelled ? 0 : velocity);
        }
        const handles = '.sheet-grabber, .cgo-rt-grabber, .panel-header, [data-panel-drag-handle]';
        const controls = 'button, a, input, select, textarea, label, [role="button"], [role="tab"], [contenteditable="true"]';
        const down = e => {
            if (!media.matches || !e.isPrimary || !e.target.closest(handles) || e.target.closest(controls)) return;
            begin(e.clientY, e.pointerId, true);
        };
        const pointerMove = e => { if (drag?.pointerId === e.pointerId) move(e.clientY); };
        const up = e => { if (drag?.pointerId === e.pointerId) end(e.clientY, e.type === 'pointercancel'); };
        const touchStart = e => {
            candidate = null;
            if (!media.matches || e.touches.length !== 1 || drag || e.target.closest(handles) || e.target.closest(controls)) return;
            let scroller = null;
            for (let node = e.target; node && node !== panel; node = node.parentElement) {
                if (/(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight + 1) { scroller = node; break; }
            }
            const touch = e.touches[0];
            candidate = { id: touch.identifier, x: touch.clientX, y: touch.clientY, scrollTop: scroller?.scrollTop || 0, scroller, active: false };
        };
        const touchMove = e => {
            if (drag?.pointerId != null) { if (e.cancelable) e.preventDefault(); return; }
            if (!candidate) return;
            const touch = Array.from(e.touches).find(t => t.identifier === candidate.id);
            if (!touch) return;
            const dy = touch.clientY - candidate.y, dx = touch.clientX - candidate.x;
            const scroller = candidate.scroller;
            if (!candidate.active) {
                if (Math.abs(dy) < 4 || Math.abs(dy) <= Math.abs(dx)) return;
                if (!(dy < 0 ? stage() === 'half' : (scroller?.scrollTop || 0) <= 1)) return;
                // 原生滚动已经不可取消时留给浏览器，避免回弹与面板同时移动。
                if (!e.cancelable) return;
                const consumed = Math.min(Math.abs(dy), Math.abs((scroller?.scrollTop || 0) - candidate.scrollTop));
                begin(candidate.y + Math.sign(dy) * consumed, null, false);
                candidate.active = true;
                candidate.locked = Math.max(0, scroller?.scrollTop || 0);
                const spacer = scroller?.matches('.panel-body') ? Math.max(0, detents[stage()] - detents.full) : 0;
                candidate.scrollLimit = scroller ? Math.max(candidate.locked, scroller.scrollHeight - scroller.clientHeight - spacer) : 0;
            }
            if (e.cancelable) e.preventDefault();
            move(touch.clientY);
            if (scroller) {
                const overflow = Math.max(0, detents.full - (drag.startTop + touch.clientY - drag.startY));
                scroller.scrollTop = Math.min(candidate.scrollLimit, candidate.locked + overflow);
            }
        };
        const touchEnd = e => {
            const touch = candidate && Array.from(e.changedTouches).find(t => t.identifier === candidate.id);
            if (!touch) return;
            if (candidate.active) end(touch.clientY, e.type === 'touchcancel');
            candidate = null;
        };
        function disable() {
            stopFrames(); drag = candidate = null;
            panel.classList.remove('cgo-mobile-sheet', 'cgo-sheet-moving');
            for (const [key, value] of originalStyle) {
                if (value[0]) panel.style.setProperty(key, ...value); else panel.style.removeProperty(key);
            }
            originalStyle.clear();
            panel.style.removeProperty('--cgo-sheet-resting-offset');
            if (placeholder?.isConnected && footer) placeholder.replaceWith(footer);
            dock?.remove(); dock = footer = placeholder = null;
            panel._cgoSheetFooter = null;
        }
        function configure() {
            if (!media.matches) { disable(); return; }
            if (!panel.classList.contains('cgo-mobile-sheet')) {
                ownedStyles.forEach(key => originalStyle.set(key, [panel.style.getPropertyValue(key), panel.style.getPropertyPriority(key)]));
                panel.classList.add('cgo-mobile-sheet');
                footer = panel.querySelector('.panel-footer');
                panel._cgoSheetFooter = footer;
                if (footer) {
                    placeholder = document.createComment('mobile sheet footer');
                    footer.replaceWith(placeholder);
                    dock = document.createElement('div');
                    dock.className = 'cgo-mobile-sheet-dock';
                    dock.style.zIndex = String((Number.parseInt(getComputedStyle(panel).zIndex, 10) || 2000) + 1);
                    dock.appendChild(footer);
                    panel.after(dock);
                }
            }
            refresh();
        }
        panel.addEventListener('pointerdown', down);
        panel.addEventListener('pointermove', pointerMove);
        panel.addEventListener('pointerup', up);
        panel.addEventListener('pointercancel', up);
        panel.addEventListener('touchstart', touchStart, { passive: true });
        panel.addEventListener('touchmove', touchMove, { passive: false });
        panel.addEventListener('touchend', touchEnd);
        panel.addEventListener('touchcancel', touchEnd);
        media.addEventListener('change', configure);
        window.addEventListener('resize', configure);
        window.visualViewport?.addEventListener('resize', configure);
        // 外部的展开按钮、关闭和面板栈切换仍可按原有类名工作。
        const observer = new MutationObserver(() => {
            if (!media.matches) return;
            if (getComputedStyle(panel).display === 'none') {
                stopFrames();
                const pointerId = drag?.pointerId;
                drag = candidate = null;
                if (pointerId != null && panel.hasPointerCapture?.(pointerId)) panel.releasePointerCapture(pointerId);
                if (panel.classList.contains('cgo-sheet-moving')) panel.classList.remove('cgo-sheet-moving');
            }
            if (!drag && settling === null) refresh();
        });
        observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        configure();
        return () => {
            observer.disconnect();
            panel.removeEventListener('pointerdown', down);
            panel.removeEventListener('pointermove', pointerMove);
            panel.removeEventListener('pointerup', up);
            panel.removeEventListener('pointercancel', up);
            panel.removeEventListener('touchstart', touchStart);
            panel.removeEventListener('touchmove', touchMove);
            panel.removeEventListener('touchend', touchEnd);
            panel.removeEventListener('touchcancel', touchEnd);
            media.removeEventListener('change', configure);
            window.removeEventListener('resize', configure);
            window.visualViewport?.removeEventListener('resize', configure);
            disable();
        };
    }
    window.CGoMobileSheet = { attach, rubberBand };
}());
