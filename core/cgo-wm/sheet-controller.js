import { clamp } from './utils.js';

const STAGE_ORDER = ['collapsed', 'half', 'full'];

export function calculateSheetDetents({ viewportHeight, safeTop = 0, headerHeight = 64, footerHeight = 0, detents }) {
  const full = Math.max(0, safeTop);
  const half = Math.max(full + 160, Math.round(viewportHeight * 0.46));
  const collapsed = Math.max(half + 72, viewportHeight - Math.max(48, headerHeight) - footerHeight);
  const all = { full, half: Math.min(half, viewportHeight - 96), collapsed: Math.min(collapsed, viewportHeight - 40) };
  return Object.fromEntries((detents || STAGE_ORDER).map((stage) => [stage, all[stage]]));
}

export function chooseSheetDetent({ current, startTop, endTop, velocity = 0, detents }) {
  const available = STAGE_ORDER.filter((stage) => Number.isFinite(detents[stage]));
  if (!available.length) return null;
  const currentIndex = Math.max(0, available.indexOf(current));
  const delta = endTop - startTop;
  const fast = Math.abs(velocity) >= 1.8;
  if (fast) return velocity < 0 ? available[available.length - 1] : available[0];
  if (Math.abs(delta) < 8) return current;
  return available[clamp(currentIndex + (delta < 0 ? 1 : -1), 0, available.length - 1)];
}

export class SheetController {
  constructor(instance) {
    this.instance = instance;
    this.element = instance.element;
    this.dragging = false;
    this.raf = null;
    this.onViewportResize = this.onViewportResize.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  connect() {
    this.grabber = this.element.querySelector('.cgowm-grabber');
    this.handle = this.element.querySelector('.cgowm-titlebar-drag-handle');
    this.grabber?.addEventListener('pointerdown', this.onPointerDown);
    this.handle?.addEventListener('pointerdown', this.onPointerDown);
    const viewport = this.instance.manager.windowRef.visualViewport;
    viewport?.addEventListener('resize', this.onViewportResize);
    this.recalculate();
    this.apply(this.instance.state.mobileDetent, false);
  }

  disconnect() {
    this.grabber?.removeEventListener('pointerdown', this.onPointerDown);
    this.handle?.removeEventListener('pointerdown', this.onPointerDown);
    this.removePointerListeners();
    this.instance.manager.windowRef.visualViewport?.removeEventListener('resize', this.onViewportResize);
    if (this.raf) this.instance.manager.windowRef.cancelAnimationFrame(this.raf);
  }

  onViewportResize() {
    if (this.dragging) return;
    this.recalculate();
    const targetDetent = this.element.dataset.ducking === 'true' ? 'collapsed' : this.instance.state.mobileDetent;
    this.apply(targetDetent, false);
  }

  recalculate() {
    const win = this.instance.manager.windowRef;
    const viewportHeight = win.visualViewport?.height || win.innerHeight;
    const workArea = typeof this.instance.manager.getWorkArea === 'function'
      ? this.instance.manager.getWorkArea()
      : null;

    let headerHeight = Number(this.instance.config.mobileCollapsedHeaderHeight || 0);
    if (!headerHeight) {
      const titlebar = this.element.querySelector('.cgowm-titlebar');
      const elRect = this.element.getBoundingClientRect?.();
      const tbRect = titlebar?.getBoundingClientRect?.();
      if (tbRect && tbRect.height > 0 && elRect && tbRect.bottom > elRect.top) {
        headerHeight = Math.max(48, Math.round(tbRect.bottom - elRect.top));
      } else {
        const grabberH = this.grabber?.getBoundingClientRect?.().height || 17;
        headerHeight = Math.max(48, Math.round(grabberH + (tbRect?.height || 47)));
      }
    }

    const explicitSafeTop = this.instance.manager.host?.mobileSafeTop;
    const safeTop = Number.isFinite(Number(explicitSafeTop))
      ? Number(explicitSafeTop)
      : Number(workArea?.top || 0);

    const explicitFooter = this.instance.config.mobileFooterHeight;
    const footerHeight = Number.isFinite(Number(explicitFooter))
      ? Number(explicitFooter)
      : (workArea ? Math.max(0, Math.round((workArea.viewportHeight || viewportHeight) - workArea.bottom)) : 0);

    this.detents = calculateSheetDetents({
      viewportHeight,
      safeTop,
      headerHeight,
      footerHeight,
      detents: this.instance.config.mobileDetents,
    });
    this.element.style.setProperty('--cgowm-sheet-full-top', `${this.detents.full ?? 0}px`);
    this.element.style.setProperty('--cgowm-sheet-bottom', `${footerHeight}px`);
    this.element.style.setProperty('--cgowm-sheet-safe-bottom', footerHeight > 0 ? '0px' : 'var(--cwm-safe-bottom)');
  }

  onPointerDown(event) {
    if (this.dragging || !this.instance.config.mobileResizable || event.button !== 0) return;
    if (event.target?.closest?.('button, a, input, select, textarea, .cgowm-mobile-pill, .cgowm-mobile-action-btn')) return;
    event.preventDefault();
    this.dragging = true;
    this.startY = event.clientY;
    this.lastY = event.clientY;
    this.lastAt = event.timeStamp;
    this.velocity = 0;
    this.startTop = this.detents[this.instance.state.mobileDetent] ?? this.detents.half ?? 0;
    this.element.dataset.sheetDragging = 'true';
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    this.pointerId = event.pointerId;
    this.instance.manager.documentRef.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.instance.manager.documentRef.addEventListener('pointerup', this.onPointerUp);
    this.instance.manager.documentRef.addEventListener('pointercancel', this.onPointerUp);
  }

  onPointerMove(event) {
    if (!this.dragging) return;
    event.preventDefault();
    const now = event.timeStamp;
    const elapsed = Math.max(1, now - this.lastAt);
    this.velocity = (event.clientY - this.lastY) / elapsed;
    this.lastY = event.clientY;
    this.lastAt = now;
    const values = Object.values(this.detents);
    const top = clamp(this.startTop + event.clientY - this.startY, Math.min(...values), Math.max(...values));
    this.setTop(top);
    this.instance.manager.emitter.emit('detentChange', {
      key: this.instance.key,
      detent: this.instance.state.mobileDetent,
      dragging: true,
      top,
    });
  }

  onPointerUp(event) {
    if (!this.dragging) return;
    this.dragging = false;
    delete this.element.dataset.sheetDragging;
    const next = chooseSheetDetent({
      current: this.instance.state.mobileDetent,
      startTop: this.startY,
      endTop: event.clientY ?? this.lastY,
      velocity: this.velocity,
      detents: this.detents,
    });
    this.removePointerListeners();
    if (next) this.instance.setMobileDetent(next);
  }

  removePointerListeners() {
    const doc = this.instance.manager.documentRef;
    doc.removeEventListener('pointermove', this.onPointerMove);
    doc.removeEventListener('pointerup', this.onPointerUp);
    doc.removeEventListener('pointercancel', this.onPointerUp);
  }

  setTop(top) {
    const full = this.detents.full ?? 0;
    this.element.style.setProperty('--cgowm-sheet-offset', `${top - full}px`);
  }

  apply(detent, animate = true) {
    if (!this.detents?.[detent] && this.detents?.[detent] !== 0) return false;
    const targetTop = this.detents[detent];
    const win = this.instance.manager.windowRef;
    if (!animate || win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.setTop(targetTop);
      return true;
    }
    const full = this.detents.full ?? 0;
    const computed = win.getComputedStyle(this.element);
    const startOffset = Number.parseFloat(computed.getPropertyValue('--cgowm-sheet-offset')) || 0;
    const targetOffset = targetTop - full;
    const duration = Math.min(360, Math.max(180, Math.abs(targetOffset - startOffset) * 0.75));
    const startedAt = win.performance.now();
    this.element.dataset.sheetSettling = 'true';

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.element.style.setProperty('--cgowm-sheet-offset', `${startOffset + (targetOffset - startOffset) * eased}px`);
      if (progress < 1) {
        this.raf = win.requestAnimationFrame(tick);
        return;
      }
      this.raf = null;
      delete this.element.dataset.sheetSettling;
    };
    this.raf = win.requestAnimationFrame(tick);
    return true;
  }
}
