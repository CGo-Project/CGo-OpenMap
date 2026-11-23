/**
 * CGo OpenMap - 通用车站/线路高清图片预览器 (core/image-viewer.js)
 *
 * 桌面端使用 <cgo-modal> 原生浮层呈现；
 * 触屏设备（pointer: coarse 或无悬停窄屏）切换为全屏画布看图器，
 * 支持单指平移、双指捏合缩放与双击还原。
 */
(function () {
    'use strict';
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const MODAL_ID = 'cgo-image-viewer-modal';
    const TOUCH_ID = 'cgo-image-viewer-touch';
    const STYLE_ID = 'cgo-image-viewer-style';
    const MIN_SCALE = 1;
    const MAX_SCALE = 5;

    let activeState = null;

    function esc(value) {
        if (window.CGoA11y && typeof window.CGoA11y.escapeHtml === 'function') {
            return window.CGoA11y.escapeHtml(value);
        }
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /** 判断是否应启用触屏优先全屏看图器 */
    function isTouchFirst() {
        if (typeof window.matchMedia !== 'function') return false;
        if (window.matchMedia('(pointer: coarse)').matches) return true;
        return window.matchMedia('(hover: none)').matches && window.innerWidth <= 900;
    }

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${TOUCH_ID} {
                position: fixed;
                inset: 0;
                z-index: 110500;
                background: rgba(10, 12, 16, 0.94);
                color: #f5f7fa;
                display: none;
                flex-direction: column;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
            }
            #${TOUCH_ID}.is-open {
                display: flex;
            }
            #${TOUCH_ID} .cgo-iv-topbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px;
                background: linear-gradient(to bottom, rgba(0, 0, 0, 0.56), transparent);
                z-index: 2;
                flex-shrink: 0;
            }
            #${TOUCH_ID} .cgo-iv-title {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            #${TOUCH_ID} .cgo-iv-close {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid rgba(255, 255, 255, 0.22);
                background: rgba(255, 255, 255, 0.14);
                color: #ffffff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;
            }
            #${TOUCH_ID} .cgo-iv-stage {
                position: relative;
                flex: 1 1 auto;
                min-height: 0;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #${TOUCH_ID} canvas {
                display: block;
                width: 100%;
                height: 100%;
                touch-action: none;
            }
            #${TOUCH_ID} .cgo-iv-status {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                font-size: 13px;
                color: rgba(255, 255, 255, 0.8);
                pointer-events: none;
                text-align: center;
                padding: 8px 14px;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.45);
            }
            #${TOUCH_ID} .cgo-iv-hint {
                padding: 8px 14px calc(10px + env(safe-area-inset-bottom, 0px));
                font-size: 12px;
                color: rgba(255, 255, 255, 0.72);
                text-align: center;
                flex-shrink: 0;
            }
            .cgo-iv-desktop-wrap {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            .cgo-iv-desktop-img {
                max-width: 100%;
                max-height: 72dvh;
                width: auto;
                height: auto;
                display: block;
                border-radius: 8px;
                object-fit: contain;
                background: var(--card-sub-bg, rgba(0, 0, 0, 0.04));
            }
            .cgo-iv-desktop-caption {
                font-size: 12px;
                line-height: 1.5;
                color: var(--text-light);
                text-align: center;
            }
            .cgo-iv-desktop-error {
                font-size: 13px;
                color: var(--text-light);
                padding: 24px 12px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    function normalizeOptions(optionsOrUrl, maybeTitle) {
        if (typeof optionsOrUrl === 'string') {
            return { url: optionsOrUrl, title: maybeTitle || '' };
        }
        return optionsOrUrl && typeof optionsOrUrl === 'object' ? optionsOrUrl : {};
    }

    function ensureDesktopModal() {
        let modal = document.getElementById(MODAL_ID);
        if (!modal) {
            modal = document.createElement('cgo-modal');
            modal.id = MODAL_ID;
            modal.addEventListener('cgo-close', () => {
                if (activeState && activeState.mode === 'desktop') {
                    const onClose = activeState.onClose;
                    activeState = null;
                    if (typeof onClose === 'function') onClose();
                }
            });
            document.body.appendChild(modal);
        }
        return modal;
    }

    function openDesktop(opts) {
        ensureStyles();
        const wrap = document.createElement('div');
        wrap.className = 'cgo-iv-desktop-wrap';

        const img = document.createElement('img');
        img.className = 'cgo-iv-desktop-img';
        img.alt = opts.alt || opts.title || '图片预览';
        img.src = opts.url;
        img.addEventListener('error', () => {
            if (!wrap.isConnected) return;
            wrap.innerHTML = `<div class="cgo-iv-desktop-error">图片加载失败：${esc(opts.alt || opts.title || opts.url)}</div>`;
        }, { once: true });
        wrap.appendChild(img);

        if (opts.caption) {
            const cap = document.createElement('div');
            cap.className = 'cgo-iv-desktop-caption';
            cap.textContent = opts.caption;
            wrap.appendChild(cap);
        }

        if (window.CGoDialogs?.dialog) {
            const wmInstance = window.CGoDialogs.dialog({
                panelId: 'image-viewer',
                title: opts.title || opts.alt || '图片预览',
                icon: 'image',
                className: 'openmap-image-dialog',
                content: wrap,
                modal: true,
                width: 900,
                maxWidth: opts.maxWidth || 'min(920px, 92vw)',
                resizable: true,
                closeOnOverlay: true,
                destroyOnClose: true,
                onClose: () => {
                    if (activeState && activeState.mode === 'desktop' && activeState.wmInstance === wmInstance) {
                        const onClose = activeState.onClose;
                        activeState = null;
                        if (typeof onClose === 'function') onClose();
                    }
                }
            });
            if (wmInstance) {
                activeState = { mode: 'desktop', wmInstance, onClose: opts.onClose };
                return;
            }
        }

        const modal = ensureDesktopModal();
        modal.title = opts.title || opts.alt || '图片预览';
        modal.maxWidth = opts.maxWidth || '880px';
        modal.innerHTML = '';
        modal.appendChild(wrap);
        activeState = { mode: 'desktop', modal, onClose: opts.onClose };
        if (typeof modal.show === 'function') modal.show();
        else modal.open = true;
    }

    function clampOffset(state, cssW, cssH, drawW, drawH) {
        const scaledW = drawW * state.scale;
        const scaledH = drawH * state.scale;
        const maxX = Math.max(0, (scaledW - cssW) / 2);
        const maxY = Math.max(0, (scaledH - cssH) / 2);
        state.tx = Math.max(-maxX, Math.min(maxX, state.tx));
        state.ty = Math.max(-maxY, Math.min(maxY, state.ty));
    }

    function openTouch(opts) {
        ensureStyles();
        let root = document.getElementById(TOUCH_ID);
        if (!root) {
            root = document.createElement('div');
            root.id = TOUCH_ID;
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-modal', 'true');
            root.innerHTML = `
                <div class="cgo-iv-topbar">
                    <h3 class="cgo-iv-title"></h3>
                    <button type="button" class="cgo-iv-close" aria-label="关闭图片预览">
                        <cgo-icon name="close" size="18"></cgo-icon>
                    </button>
                </div>
                <div class="cgo-iv-stage">
                    <canvas></canvas>
                    <div class="cgo-iv-status">正在加载图片...</div>
                </div>
                <div class="cgo-iv-hint">双指捏合缩放 · 单指拖动 · 双击还原</div>
            `;
            document.body.appendChild(root);
        }

        const titleEl = root.querySelector('.cgo-iv-title');
        const closeBtn = root.querySelector('.cgo-iv-close');
        const stage = root.querySelector('.cgo-iv-stage');
        const canvas = root.querySelector('canvas');
        const statusEl = root.querySelector('.cgo-iv-status');
        const hintEl = root.querySelector('.cgo-iv-hint');

        titleEl.textContent = opts.title || opts.alt || '图片预览';
        hintEl.textContent = opts.caption ? `${opts.caption} · 双指缩放 / 双击还原` : '双指捏合缩放 · 单指拖动 · 双击还原';
        statusEl.textContent = '正在加载图片...';
        statusEl.style.display = 'block';

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        root.classList.add('is-open');

        const state = {
            mode: 'touch',
            root,
            onClose: opts.onClose,
            prevOverflow,
            scale: 1,
            tx: 0,
            ty: 0,
            img: null,
            loaded: false,
            lastTapTime: 0,
            gesture: null,
            cleanup: null
        };

        function draw() {
            if (!state.loaded || !state.img) return;
            const rect = stage.getBoundingClientRect();
            const cssW = Math.max(1, rect.width);
            const cssH = Math.max(1, rect.height);
            const dpr = Math.min(3, window.devicePixelRatio || 1);
            const targetW = Math.round(cssW * dpr);
            const targetH = Math.round(cssH * dpr);
            if (canvas.width !== targetW || canvas.height !== targetH) {
                canvas.width = targetW;
                canvas.height = targetH;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cssW, cssH);

            const natW = Math.max(1, state.img.naturalWidth || cssW);
            const natH = Math.max(1, state.img.naturalHeight || cssH);
            const fit = Math.min(cssW / natW, cssH / natH);
            const drawW = natW * fit;
            const drawH = natH * fit;
            clampOffset(state, cssW, cssH, drawW, drawH);

            ctx.save();
            ctx.translate(cssW / 2 + state.tx, cssH / 2 + state.ty);
            ctx.scale(state.scale, state.scale);
            ctx.drawImage(state.img, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }

        function touchDist(t1, t2) {
            return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY) || 1;
        }

        function onTouchStart(e) {
            if (!state.loaded) return;
            if (e.touches.length === 1) {
                const now = Date.now();
                if (now - state.lastTapTime < 280) {
                    state.lastTapTime = 0;
                    if (state.scale > 1.05) {
                        state.scale = 1;
                        state.tx = 0;
                        state.ty = 0;
                    } else {
                        state.scale = 2.2;
                    }
                    draw();
                    return;
                }
                state.lastTapTime = now;
                state.gesture = {
                    type: 'pan',
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    tx: state.tx,
                    ty: state.ty
                };
            } else if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                state.gesture = {
                    type: 'pinch',
                    dist: touchDist(t1, t2),
                    scale: state.scale,
                    mx: (t1.clientX + t2.clientX) / 2,
                    my: (t1.clientY + t2.clientY) / 2,
                    tx: state.tx,
                    ty: state.ty
                };
            }
        }

        function onTouchMove(e) {
            if (!state.gesture || !state.loaded) return;
            if (e.cancelable) e.preventDefault();
            if (state.gesture.type === 'pan' && e.touches.length === 1) {
                state.tx = state.gesture.tx + (e.touches[0].clientX - state.gesture.x);
                state.ty = state.gesture.ty + (e.touches[0].clientY - state.gesture.y);
                draw();
            } else if (state.gesture.type === 'pinch' && e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const nextDist = touchDist(t1, t2);
                const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, state.gesture.scale * (nextDist / state.gesture.dist)));
                const mx = (t1.clientX + t2.clientX) / 2;
                const my = (t1.clientY + t2.clientY) / 2;
                state.scale = nextScale;
                state.tx = state.gesture.tx + (mx - state.gesture.mx);
                state.ty = state.gesture.ty + (my - state.gesture.my);
                if (state.scale <= 1.01) {
                    state.scale = 1;
                    state.tx = 0;
                    state.ty = 0;
                }
                draw();
            }
        }

        function onTouchEnd(e) {
            if (e.touches.length === 0) {
                state.gesture = null;
            } else if (e.touches.length === 1 && state.gesture && state.gesture.type === 'pinch') {
                state.gesture = {
                    type: 'pan',
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    tx: state.tx,
                    ty: state.ty
                };
            }
        }

        function onKeyDown(e) {
            if (e.key === 'Escape') close();
        }

        const onCloseClick = (e) => {
            e.stopPropagation();
            close();
        };

        closeBtn.addEventListener('click', onCloseClick);
        stage.addEventListener('touchstart', onTouchStart, { passive: true });
        stage.addEventListener('touchmove', onTouchMove, { passive: false });
        stage.addEventListener('touchend', onTouchEnd, { passive: true });
        stage.addEventListener('touchcancel', onTouchEnd, { passive: true });
        window.addEventListener('resize', draw);
        document.addEventListener('keydown', onKeyDown);

        state.cleanup = () => {
            closeBtn.removeEventListener('click', onCloseClick);
            stage.removeEventListener('touchstart', onTouchStart);
            stage.removeEventListener('touchmove', onTouchMove);
            stage.removeEventListener('touchend', onTouchEnd);
            stage.removeEventListener('touchcancel', onTouchEnd);
            window.removeEventListener('resize', draw);
            document.removeEventListener('keydown', onKeyDown);
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        activeState = state;

        const img = new Image();
        img.onload = () => {
            if (activeState !== state) return;
            state.img = img;
            state.loaded = true;
            statusEl.style.display = 'none';
            draw();
        };
        img.onerror = () => {
            if (activeState !== state) return;
            statusEl.textContent = `图片加载失败：${opts.alt || opts.title || opts.url}`;
            statusEl.style.display = 'block';
        };
        img.src = opts.url;
    }

    /** 打开图片预览（自动识别桌面弹窗或触屏全屏画布模式） */
    function open(optionsOrUrl, maybeTitle) {
        const opts = normalizeOptions(optionsOrUrl, maybeTitle);
        if (!opts.url) return;
        close(true);
        if (isTouchFirst()) {
            openTouch(opts);
        } else {
            openDesktop(opts);
        }
    }

    /** 关闭当前活跃的图片预览 */
    function close(immediate) {
        const cur = activeState;
        if (!cur) return;
        activeState = null;

        if (cur.mode === 'desktop') {
            if (cur.wmInstance) {
                cur.wmInstance.close();
            } else if (cur.modal) {
                if (!immediate && typeof cur.modal._close === 'function' && cur.modal.open) {
                    cur.modal._close();
                } else {
                    cur.modal._closing = false;
                    cur.modal.open = false;
                }
            }
        } else if (cur.mode === 'touch') {
            if (typeof cur.cleanup === 'function') cur.cleanup();
            if (cur.root) cur.root.classList.remove('is-open');
            document.body.style.overflow = cur.prevOverflow || '';
        }
        if (typeof cur.onClose === 'function') cur.onClose();
    }

    window.CGoImageViewer = { open, close, isTouchFirst };
})();
