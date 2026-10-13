/** 车站信息板正文的移动端横滑切页；点击与滑动共用已有 Tab 激活事件。 */
(function () {
    function attach(panel) {
        const body = panel.querySelector('.panel-body');
        if (!body) return () => {};
        let gesture = null, frame = null, animation = null;
        const tabs = () => Array.from(panel.querySelectorAll('.panel-tabs-nav > .tab-item'))
            .filter(tab => !tab.hidden && tab.getClientRects().length && tab.getAttribute('aria-disabled') !== 'true');
        const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const touchFor = (list, id) => Array.from(list).find(touch => touch.identifier === id);
        const animate = (pane, from, to) => {
            animation?.cancel();
            animation = null;
            if (pane && !reduced() && pane.animate) {
                animation = pane.animate([{ transform: `translate3d(${from}px, 0, 0)` },
                    { transform: `translate3d(${to}px, 0, 0)` }],
                { duration: 220, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' });
            }
        };
        function reset(returnToRest = false) {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = null;
            if (gesture?.pane) {
                const { pane, offset, originalTransform, originalWillChange } = gesture;
                pane.style.transform = originalTransform;
                pane.style.willChange = originalWillChange;
                if (returnToRest && gesture.horizontal) animate(pane, offset || 0, 0);
            }
            gesture = null;
        }
        function start(event) {
            reset();
            if (window.innerWidth > 640 || event.touches.length !== 1) return;
            const target = event.target instanceof Element ? event.target : null;
            if (!target || target.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"], [data-card-type="map"], .stacard-minimap-viewport, canvas, iframe, [data-panel-swipe-ignore]')) return;
            // 横向滚动表格、时刻表等先保留自己的手势，不能把横滑变成切页。
            for (let node = target; node && node !== body; node = node.parentElement) {
                const style = getComputedStyle(node);
                if (node.scrollWidth - node.clientWidth > 2 && /auto|scroll/.test(style.overflowX)) return;
            }
            const order = tabs();
            if (order.length < 2) return;
            const index = order.findIndex(tab => tab.classList.contains('active'));
            const pane = panel.querySelector('.panel-tabs-body > .tab-pane.active');
            if (index < 0 || !pane) return;
            animation?.cancel(); animation = null;
            const touch = event.touches[0];
            gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, at: performance.now(),
                order, index, pane, width: body.clientWidth, horizontal: false, offset: 0,
                originalTransform: pane.style.transform, originalWillChange: pane.style.willChange };
        }
        function move(event) {
            if (!gesture) return;
            if (event.touches.length !== 1) { reset(true); return; }
            const touch = touchFor(event.touches, gesture.id);
            if (!touch) return;
            const dx = touch.clientX - gesture.x, dy = touch.clientY - gesture.y;
            if (!gesture.horizontal) {
                if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
                if (Math.abs(dx) <= Math.abs(dy) * 1.15) { reset(); return; }
                // 原生竖向滚动已接管时，不在同一段手势里改成切页。
                if (!event.cancelable) { reset(); return; }
                gesture.horizontal = true;
                gesture.pane.style.willChange = 'transform';
            }
            if (event.cancelable) event.preventDefault();
            const atEdge = dx > 0 ? gesture.index === 0 : gesture.index === gesture.order.length - 1;
            const limit = gesture.width * 0.35;
            gesture.offset = Math.max(-limit, Math.min(limit, dx * (atEdge ? 0.18 : 0.55)));
            if (frame === null) frame = requestAnimationFrame(() => {
                frame = null;
                if (gesture) gesture.pane.style.transform = `translate3d(${gesture.offset}px, 0, 0)`;
            });
        }
        function end(event) {
            if (!gesture) return;
            const touch = touchFor(event.changedTouches, gesture.id);
            if (!touch) return;
            const state = gesture;
            if (!state.horizontal || event.type === 'touchcancel') { reset(true); return; }
            const dx = touch.clientX - state.x;
            const speed = Math.abs(dx) / Math.max(1, performance.now() - state.at);
            const threshold = Math.min(80, Math.max(48, state.width * 0.12));
            const nextIndex = state.index + (dx < 0 ? 1 : -1);
            if ((Math.abs(dx) < threshold && !(Math.abs(dx) >= 24 && speed >= 0.45))
                || nextIndex < 0 || nextIndex >= state.order.length) { reset(true); return; }
            reset();
            const next = state.order[nextIndex];
            next.click();
            next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
            animate(panel.querySelector('.panel-tabs-body > .tab-pane.active'), (dx < 0 ? 1 : -1) * state.width * 0.22, 0);
        }
        body.addEventListener('touchstart', start, { passive: true });
        body.addEventListener('touchmove', move, { passive: false });
        body.addEventListener('touchend', end, { passive: true });
        body.addEventListener('touchcancel', end, { passive: true });
        return () => {
            reset(); animation?.cancel();
            body.removeEventListener('touchstart', start);
            body.removeEventListener('touchmove', move);
            body.removeEventListener('touchend', end);
            body.removeEventListener('touchcancel', end);
        };
    }
    window.CGoPanelTabSwipe = { attach };
}());
