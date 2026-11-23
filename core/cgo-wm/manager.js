import {
  DEFAULT_HOT_ZONE,
  DEFAULT_MOBILE_BREAKPOINT,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_SNAP_THRESHOLD,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  SIDEBAR_RAIL_WIDTH,
  Z_GROUP_BASE,
} from './constants.js';
import { CgoAddonManager } from './addons.js';
import { EventEmitter } from './emitter.js';
import { createDialogApi } from './dialogs.js';
import { appendSafeVisual } from './sanitize.js';
import { SheetController } from './sheet-controller.js';
import {
  clearHostStorage,
  hasWindowState,
  makeMobileWorkspaceStorageKey,
  makeStorageKey,
  makeWorkspaceStorageKey,
  readMobileWorkspaceState,
  readWindowState,
  readWorkspaceState,
  writeMobileWorkspaceState,
  writeWindowState,
  writeWorkspaceState,
} from './storage.js';
import {
  clamp,
  getFocusableElements,
  normalizeConfig,
  normalizeContent,
  resolveEffectiveMode,
  safeCssLength,
} from './utils.js';
import {
  attachWindowToStack,
  detachWindowFromStacks,
  mergeWindowIntoGroup,
  removeWindowFromGroups,
  reorderKeyList,
  snapFloatingRect,
} from './workspace.js';

const RESIZE_DIRECTIONS = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];

function renderCgoIcon(manager, target, iconValue, size = 14) {
  if (!target) return;
  target.replaceChildren();
  if (iconValue) {
    appendSafeVisual(target, iconValue, {
      iconElementFactory: manager.host?.iconElementFactory || ((name, documentRef) => {
        const doc = documentRef || manager.documentRef;
        const iconElement = doc.createElement('cgo-icon');
        iconElement.setAttribute('name', name);
        iconElement.setAttribute('size', String(size));
        return iconElement;
      }),
    });
    if (typeof iconValue === 'string' && !iconValue.trim().startsWith('<svg')) {
      target.dataset.iconName = iconValue;
    } else {
      delete target.dataset.iconName;
    }
    target.hidden = target.childNodes.length === 0;
  } else {
    delete target.dataset.iconName;
    target.hidden = true;
  }
}

function createButton(manager, className, label, iconName = '', size = 14) {
  const button = manager.documentRef.createElement('button');
  button.type = 'button';
  button.className = `cgowm-control ${className}`;
  button.setAttribute('aria-label', label);
  button.title = label;
  if (iconName) {
    renderCgoIcon(manager, button, iconName, size);
    button.hidden = false;
  }
  return button;
}

function viewportOf(manager) {
  const win = manager.windowRef;
  const docEl = manager.documentRef?.documentElement;
  return {
    width: win.innerWidth || docEl?.clientWidth || 1024,
    height: win.innerHeight || docEl?.clientHeight || 768,
  };
}

function resolveElement(documentRef, target) {
  if (!target) return null;
  if (typeof target === 'string') return documentRef.querySelector(target);
  return target.nodeType === 1 ? target : null;
}

/**
 * 将节点移动到 parent 的 referenceNode 之前（referenceNode 为 null 时移至末尾）。
 * 若节点已在目标位置则直接跳过；当节点均已连接且浏览器支持原生 moveBefore() 时执行原子移动，
 * 避免传统 insertBefore/appendChild 隐式移除再插入导致 SVG 图标闪烁、滚动位置复位或 iframe 重载。
 */
function moveElementBefore(parent, node, referenceNode = null) {
  if (!parent || !node) return false;
  const ref = referenceNode && referenceNode.parentNode === parent ? referenceNode : null;
  if (node === ref) return false;
  if (node.parentNode === parent && node.nextSibling === ref) return false;
  if (node.isConnected && parent.isConnected && typeof parent.moveBefore === 'function') {
    try {
      parent.moveBefore(node, ref);
      return true;
    } catch {
      // 跨文档或目标不支持时回退到传统插入
    }
  }
  if (ref) parent.insertBefore(node, ref);
  else parent.appendChild(node);
  return true;
}

/**
 * 在不拆装相对顺序已正确节点的前提下，将 container 内的侧栏窗口调和为 orderedElements 顺序。
 */
function reconcileSidebarWindows(container, orderedElements) {
  const currentWindows = [...container.children].filter((child) => child.classList?.contains('cgowm-window'));
  const n = orderedElements.length;
  if (currentWindows.length === n && orderedElements.every((el, idx) => currentWindows[idx] === el)) {
    return;
  }

  const currentIndexMap = new Map();
  currentWindows.forEach((el, idx) => currentIndexMap.set(el, idx));

  const oldIndices = orderedElements.map((el) => currentIndexMap.get(el) ?? -1);
  const dp = new Array(n).fill(0);
  const prev = new Array(n).fill(-1);
  let bestLen = 0;
  let bestEnd = -1;
  for (let i = 0; i < n; i += 1) {
    if (oldIndices[i] < 0) continue;
    dp[i] = 1;
    for (let j = 0; j < i; j += 1) {
      if (oldIndices[j] >= 0 && oldIndices[j] < oldIndices[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
      }
    }
    if (dp[i] > bestLen) {
      bestLen = dp[i];
      bestEnd = i;
    }
  }

  const stationary = new Set();
  for (let cur = bestEnd; cur !== -1; cur = prev[cur]) {
    stationary.add(orderedElements[cur]);
  }

  let anchor = null;
  for (let i = n - 1; i >= 0; i -= 1) {
    const el = orderedElements[i];
    if (!stationary.has(el)) {
      moveElementBefore(container, el, anchor);
    }
    anchor = el;
  }
}

function measureInset(documentRef, inset) {
  if (typeof inset === 'number' && Number.isFinite(inset)) return Math.max(0, inset);
  if (typeof inset === 'string' && inset.trim()) {
    const el = documentRef.querySelector(inset.trim());
    if (el) return Math.max(0, Math.round(el.getBoundingClientRect().height || el.offsetHeight || 0));
  }
  return 0;
}

function rectOf(el) {
  return el.getBoundingClientRect();
}

export class CgoWindowInstance {
  constructor(manager, rawConfig) {
    this.manager = manager;
    this.config = normalizeConfig(rawConfig, manager.host);
    this.key = this.config.key;
    this.content = normalizeContent(this.config.content);
    this.contentCleanup = null;
    this.originalContentLocation = null;
    this.sheetController = null;
    this.dragSession = null;
    this.resizeSession = null;
    this.previousFocus = null;
    this.minimizedItem = null;
    this.modalOverlay = null;
    this.maximizeSnapshot = null;
    this.abortController = new AbortController();

    const viewport = viewportOf(manager);
    const workArea = this.manager.getWorkArea();
    const saved = readWindowState(manager.storage, makeStorageKey(manager.host.hostId, this.key), this.config, viewport);
    this.savedLifecycle = saved?.lifecycle || null;
    const estHeight = Number.isFinite(Number(this.config.defaultHeight))
      ? Number(this.config.defaultHeight)
      : Math.max(this.config.minHeight, 360);
    const defaultPosition = this.config.defaultPosition || {
      x: Math.max(12, Math.round((viewport.width - this.config.defaultWidth) / 2)),
      y: clamp(
        Math.round((viewport.height - estHeight) / 2),
        workArea.top + 8,
        Math.max(workArea.top + 8, workArea.bottom - estHeight - 8),
      ),
    };
    this.state = {
      lifecycle: saved?.lifecycle || 'registered',
      mode: saved?.mode || this.config.mode,
      effectiveMode: this.config.mode,
      sidebarSide: saved?.sidebarSide || this.config.sidebarSide,
      mobileDetent: saved?.mobileDetent || this.config.mobileDefaultDetent,
      x: saved?.x ?? Number(defaultPosition.x ?? defaultPosition.left ?? 24),
      y: saved?.y ?? Number(defaultPosition.y ?? defaultPosition.top ?? 24),
      width: saved?.width ?? this.config.defaultWidth,
      height: saved?.height ?? this.config.defaultHeight,
      dockHeight: saved?.dockHeight ?? this.config.dockHeight ?? 'auto',
      maximized: saved?.maximized || false,
    };

    this.buildDom();
    this.mountContent();
    this.applyResponsiveMode();
    if (['visible', 'minimized'].includes(this.state.lifecycle) && this.config.restoreStateOnRegister !== false) {
      this.open({ restoreLifecycle: true });
      if (this.state.lifecycle === 'minimized') this.minimize({ persist: false });
    } else {
      this.state.lifecycle = (saved?.lifecycle === 'hidden' && this.config.restoreStateOnRegister !== false)
        ? 'hidden'
        : 'registered';
      this.element.hidden = true;
    }
  }

  buildDom() {
    const doc = this.manager.documentRef;
    const element = doc.createElement('section');
    element.className = 'cgowm-window';
    if (this.config.className) {
      const extraClasses = String(this.config.className)
        .split(/\s+/)
        .filter((name) => /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name));
      element.classList.add(...extraClasses);
    }
    if (this.config.elementId) element.id = this.config.elementId;
    element.dataset.cgowmKey = this.key;
    element.dataset.program = this.config.programId;
    element.dataset.panel = this.config.panelId;
    if (this.config.unavailable) element.dataset.unavailable = 'true';
    element.setAttribute('role', this.config.role || 'region');
    element.setAttribute('aria-label', this.config.title || this.config.panelId);
    element.tabIndex = -1;

    const grabber = doc.createElement('div');
    grabber.className = 'cgowm-grabber';
    grabber.setAttribute('aria-hidden', 'true');
    grabber.hidden = !this.config.mobileGrabber;

    const titlebar = doc.createElement('header');
    titlebar.className = 'cgowm-titlebar';
    titlebar.hidden = !this.config.showTitleBar;
    const dragHandle = doc.createElement('div');
    dragHandle.className = 'cgowm-titlebar-drag-handle';

    const icon = doc.createElement('span');
    icon.className = 'cgowm-icon';
    icon.setAttribute('aria-hidden', 'true');
    this.renderIconVisual(icon, this.config.icon);

    const title = doc.createElement('span');
    title.className = 'cgowm-title';
    if (this.config.titleSvg) {
      const visualTitle = doc.createElement('span');
      visualTitle.className = 'cgowm-title-svg';
      if (appendSafeVisual(visualTitle, this.config.titleSvg)) title.replaceChildren(visualTitle);
      else title.textContent = this.config.title || this.config.panelId;
    } else {
      title.textContent = this.config.title || this.config.panelId;
    }
    const badge = doc.createElement('span');
    badge.className = 'cgowm-title-badge';
    badge.textContent = this.config.badge || '';
    badge.hidden = !this.config.badge;
    dragHandle.append(icon, title, badge);

    const tabstrip = doc.createElement('div');
    tabstrip.className = 'cgowm-tabstrip';
    tabstrip.setAttribute('role', 'tablist');
    tabstrip.hidden = true;

    const controls = doc.createElement('div');
    controls.className = 'cgowm-controls';
    const minimizeButton = createButton(this.manager, 'cgowm-btn-minimize', '最小化', 'zoom-out', 13);
    const maximizeButton = createButton(this.manager, 'cgowm-btn-maximize', '最大化', 'fullscn', 13);
    const closeButton = createButton(this.manager, 'cgowm-btn-close', '关闭', 'close', 13);
    minimizeButton.hidden = !this.config.showMinimize;
    maximizeButton.hidden = !this.config.showMaximize;
    closeButton.hidden = !this.config.showClose;
    controls.append(minimizeButton, maximizeButton, closeButton);
    titlebar.append(dragHandle, tabstrip, controls);

    const content = doc.createElement('div');
    content.className = 'cgowm-content';
    content.dataset.cgowmContent = '';
    content.dataset.cgowmOwner = this.key;

    element.append(grabber, titlebar, content);
    for (const direction of RESIZE_DIRECTIONS) {
      const resizer = doc.createElement('div');
      resizer.className = `cgowm-resizer cgowm-resizer-${direction}`;
      resizer.dataset.direction = direction;
      resizer.setAttribute('aria-hidden', 'true');
      resizer.hidden = !this.config.resizable;
      element.append(resizer);
    }

    this.element = element;
    this.titlebar = titlebar;
    this.dragHandle = dragHandle;
    this.tabstrip = tabstrip;
    this.iconElement = icon;
    this.contentElement = content;
    this.titleElement = title;
    this.badgeElement = badge;
    this.minimizeButton = minimizeButton;
    this.maximizeButton = maximizeButton;
    this.closeButton = closeButton;
    this.manager.root.appendChild(element);

    const signal = this.abortController.signal;
    dragHandle.addEventListener('pointerdown', (event) => this.startDrag(event, dragHandle), { signal });
    tabstrip.addEventListener('pointerdown', (event) => this.handleTabstripPointerDown(event), { signal });
    content.addEventListener('pointerdown', (event) => {
      const handle = event.target.closest?.('[data-cgowm-drag-handle]');
      if (!handle || !content.contains(handle)) return;
      if (event.target.closest('button, a, input, select, textarea, [role="button"], [contenteditable="true"]')) return;
      this.startDrag(event, handle);
    }, { signal });
    element.addEventListener('pointerdown', () => this.bringToFront(), { signal });
    minimizeButton.addEventListener('click', () => {
      if (this.state.lifecycle === 'minimized') this.restore();
      else this.minimize();
    }, { signal });
    maximizeButton.addEventListener('click', () => this.toggleMaximize(), { signal });
    closeButton.addEventListener('click', () => this.close(), { signal });
    titlebar.addEventListener('dblclick', (event) => {
      if (event.target.closest('.cgowm-controls, .cgowm-tab')) return;
      if (this.config.showMaximize && this.state.effectiveMode === 'window') {
        this.toggleMaximize();
      } else if (
        this.state.effectiveMode === 'float'
        && this.config.showMinimize
        && this.resolveMinimizeMode() === 'collapse'
      ) {
        if (this.state.lifecycle === 'minimized') this.restore();
        else this.minimize();
      }
    }, { signal });
    element.querySelectorAll('.cgowm-resizer').forEach((resizer) => {
      const dir = resizer.dataset.direction;
      resizer.addEventListener('pointerdown', (event) => this.startResize(event, dir), { signal });
      if (dir === 's' || dir === 'n') {
        resizer.addEventListener('dblclick', (event) => {
          const mode = this.state.effectiveMode;
          if (mode === 'sidebar') {
            if (dir !== 's') return;
            event.stopPropagation();
            this.state.dockHeight = 'auto';
            this.manager.setDockHeight(this.key, null);
            this.applyGeometry();
            this.persist();
            return;
          }
          if (['float', 'window', 'modal'].includes(mode) && this.content.kind !== 'iframe') {
            event.stopPropagation();
            this.state.height = 'auto';
            if (mode === 'modal') {
              this.element.style.removeProperty('--cwm-modal-height');
            } else {
              this.applyGeometry();
              this.manager.reflowStacks();
            }
            this.persist();
            this.manager.emitter.emit('resize', {
              key: this.key,
              width: this.state.width,
              height: 'auto',
              instance: this,
            });
          }
        }, { signal });
      }
    });
  }

  renderIconVisual(target, iconValue, size = 15) {
    renderCgoIcon(this.manager, target, iconValue, size);
  }

  mountContent() {
    if (this.content.kind === 'empty') return;
    if (this.content.kind === 'element') {
      const element = this.content.element;
      this.originalContentLocation = { parent: element.parentNode, nextSibling: element.nextSibling };
      this.contentElement.appendChild(element);
      return;
    }
    if (this.content.kind === 'factory') {
      const cleanup = this.content.mount(this.contentElement, this.publicContext());
      if (typeof cleanup === 'function') this.contentCleanup = cleanup;
      return;
    }
    if (this.content.kind === 'iframe') {
      const sourceUrl = new URL(this.content.src, this.manager.windowRef.location?.href || 'http://localhost/');
      const allowedProtocols = new Set(['http:', 'https:', 'about:']);
      if (this.manager.windowRef.location?.protocol === 'file:') allowedProtocols.add('file:');
      if (!allowedProtocols.has(sourceUrl.protocol)) throw new TypeError(`iframe 不允许使用 ${sourceUrl.protocol} 协议`);
      const iframe = this.manager.documentRef.createElement('iframe');
      iframe.className = 'cgowm-iframe';
      iframe.title = this.content.title || this.config.title || this.config.panelId;
      iframe.src = sourceUrl.href;
      iframe.loading = this.content.loading || 'eager';
      iframe.referrerPolicy = this.content.referrerPolicy || 'strict-origin-when-cross-origin';
      iframe.sandbox.value = this.content.sandbox || 'allow-forms allow-scripts allow-same-origin allow-downloads';
      if (this.content.allow) iframe.allow = this.content.allow;
      const blocker = this.manager.documentRef.createElement('div');
      blocker.className = 'cgowm-iframe-blocker';
      blocker.hidden = true;
      this.contentElement.append(iframe, blocker);
      this.iframe = iframe;
      this.iframeBlocker = blocker;
    }
  }

  publicContext() {
    return {
      key: this.key,
      instance: this,
      manager: this.manager.publicApi,
      contentElement: this.contentElement,
    };
  }

  isEffectivelyVisible() {
    if (this.state.lifecycle === 'destroyed' || this.state.lifecycle === 'hidden') return false;
    const host = this.manager.getGroupHost(this.key);
    if (host && host !== this) {
      return host.isEffectivelyVisible() && this.manager.getGroupActiveKey(host.key) === this.key;
    }
    return !this.element.hidden && this.state.effectiveMode !== 'none';
  }

  update(patch = {}) {
    if (this.state.lifecycle === 'destroyed') return false;
    const prevBadge = this.config.badge;
    const prevUnavailable = this.config.unavailable;
    const next = normalizeConfig({ ...this.config, ...patch, content: this.content }, this.manager.host);
    if (next.key !== this.key) throw new Error('窗口注册后不能修改 programId 或 panelId');
    const previousClassName = this.config.className;
    this.config = next;
    if (Object.hasOwn(patch, 'className') && patch.className !== previousClassName) {
      String(previousClassName || '').split(/\s+/).filter(Boolean).forEach((name) => this.element.classList.remove(name));
      String(this.config.className || '')
        .split(/\s+/)
        .filter((name) => /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name))
        .forEach((name) => this.element.classList.add(name));
    }
    if (Object.hasOwn(patch, 'icon')) {
      this.renderIconVisual(this.iconElement, patch.icon);
    }
    if (patch.titleSvg) {
      const visualTitle = this.manager.documentRef.createElement('span');
      visualTitle.className = 'cgowm-title-svg';
      if (appendSafeVisual(visualTitle, patch.titleSvg)) this.titleElement.replaceChildren(visualTitle);
    } else if (Object.hasOwn(patch, 'title')) {
      this.titleElement.textContent = patch.title || this.config.panelId;
      this.element.setAttribute('aria-label', patch.title || this.config.panelId);
    }
    const badgeChanged = next.badge !== prevBadge;
    const unavailableChanged = next.unavailable !== prevUnavailable;
    if (this.badgeElement && (badgeChanged || Object.hasOwn(patch, 'badge'))) {
      this.badgeElement.textContent = next.badge || '';
      this.badgeElement.hidden = !next.badge;
    }
    if (unavailableChanged || Object.hasOwn(patch, 'unavailable')) {
      if (next.unavailable) this.element.dataset.unavailable = 'true';
      else delete this.element.dataset.unavailable;
    }
    if (Object.hasOwn(patch, 'showClose')) this.closeButton.hidden = !this.config.showClose;
    if (Object.hasOwn(patch, 'showMinimize')) this.minimizeButton.hidden = !this.config.showMinimize;
    if (Object.hasOwn(patch, 'mode') && patch.mode !== this.state.mode) this.setMode(patch.mode);
    this.applyResponsiveMode();
    this.manager.syncTabGroups();
    if (badgeChanged || unavailableChanged) {
      this.manager.syncSidebars();
      this.manager.syncMobileDock();
    }
    return true;
  }

  applyResponsiveMode() {
    if (this.state.lifecycle === 'destroyed') return;
    const viewport = viewportOf(this.manager);
    const effectiveMode = viewport.width > this.config.mobileBreakpoint && this.config.desktopPresentation
      ? this.config.desktopPresentation
      : resolveEffectiveMode({ ...this.config, mode: this.state.mode }, viewport.width);
    if (effectiveMode === 'none') {
      this.state.effectiveMode = 'none';
      this.element.hidden = true;
      this.manager.syncSidebars();
      return;
    }
    if (
      effectiveMode === 'sheet'
      && this.manager.isUnifiedMobileActive()
      && this.manager.isUnifiedMobileEligible(this)
    ) {
      this.sheetController?.disconnect();
      this.sheetController = null;
      this.removeModalOverlay();
      this.state.effectiveMode = 'sheet';
      this.element.dataset.mode = 'sheet';
      this.element.hidden = true;
      this.clearFreeGeometry();
      this.manager.syncSidebars();
      this.manager.syncMobileDock();
      return;
    }
    this.state.effectiveMode = effectiveMode;
    this.applyMode(effectiveMode);
  }

  applyMode(mode) {
    const previousMode = this.element.dataset.mode;
    this.sheetController?.disconnect();
    this.sheetController = null;
    this.removeModalOverlay();
    this.element.dataset.mode = mode;
    this.element.classList.toggle('cgowm-window-maximized', this.state.maximized);
    this.titlebar.hidden = mode === 'sheet'
      ? !this.config.mobileShowTitleBar
      : !this.config.showTitleBar;
    this.element.querySelector('.cgowm-grabber').hidden = mode !== 'sheet' || !this.config.mobileGrabber;

    this.updateResizersVisibility(mode);
    this.maximizeButton.hidden = !this.config.showMaximize || mode !== 'window';
    this.updateMinimizeButtonMeta();

    const host = this.manager.getGroupHost(this.key);
    const isSlaveInGroup = Boolean(host && host !== this);
    const isMinimizedHidden = this.state.lifecycle === 'minimized' && ['hide', 'statusbar'].includes(this.resolveMinimizeMode());

    if (!isSlaveInGroup && ['visible', 'minimized'].includes(this.state.lifecycle) && mode !== 'none' && !isMinimizedHidden) {
      this.element.hidden = false;
    }

    if (mode === 'sidebar') {
      const sidebar = this.manager.ensureSidebar(this.state.sidebarSide);
      if (!isSlaveInGroup && this.element.parentNode !== sidebar.body) {
        moveElementBefore(sidebar.body, this.element, null);
      }
    } else if (mode === 'embedded' && this.config.embeddedTarget) {
      const target = this.manager.documentRef.querySelector(this.config.embeddedTarget) || this.manager.root;
      if (this.element.parentNode !== target) {
        moveElementBefore(target, this.element, null);
      }
    } else if (this.element.parentNode !== this.manager.root) {
      moveElementBefore(this.manager.root, this.element, null);
    }

    if (mode === 'modal') {
      this.element.style.setProperty('--cwm-modal-width', `${this.state.width || this.config.defaultWidth}px`);
      if (this.state.height && this.state.height !== 'auto') {
        this.element.style.setProperty('--cwm-modal-height', `${this.state.height}px`);
      } else {
        this.element.style.removeProperty('--cwm-modal-height');
      }
    } else {
      this.element.style.removeProperty('--cwm-modal-width');
      this.element.style.removeProperty('--cwm-modal-height');
    }

    if (['float', 'window', 'sidebar'].includes(mode)) this.applyGeometry();
    else this.clearFreeGeometry();

    if (mode === 'sheet') {
      this.sheetController = new SheetController(this);
      this.sheetController.connect();
    }
    if (mode === 'modal' && ['visible', 'minimized'].includes(this.state.lifecycle)) this.ensureModalOverlay();
    if (mode === 'fullscreen') this.element.setAttribute('aria-modal', 'true');
    else this.element.removeAttribute('aria-modal');

    this.manager.syncTabGroups();
    this.manager.syncSidebars();

    if (previousMode && previousMode !== mode) {
      this.manager.emitter.emit('modeChange', { key: this.key, mode, previousMode, instance: this });
    }
  }

  updateResizersVisibility(mode = this.state.effectiveMode) {
    const isCollapsed = this.state.lifecycle === 'minimized' && this.resolveMinimizeMode() === 'collapse';
    this.element.querySelectorAll('.cgowm-resizer').forEach((resizer) => {
      if (!this.config.resizable) {
        resizer.hidden = true;
        return;
      }
      const dir = resizer.dataset.direction;
      if (mode === 'sidebar') {
        resizer.hidden = dir !== 's' || this.state.lifecycle === 'minimized';
        return;
      }
      if (isCollapsed) {
        resizer.hidden = !['e', 'w'].includes(dir);
        return;
      }
      resizer.hidden = ['sheet', 'fullscreen', 'embedded'].includes(mode);
    });
  }

  updateMinimizeButtonMeta() {
    if (!this.minimizeButton) return;
    const isCollapsed = this.state.lifecycle === 'minimized';
    const isCollapseMode = this.resolveMinimizeMode() === 'collapse';
    const iconName = isCollapsed ? 'add' : 'zoom-out';
    if (this.minimizeButton.dataset.iconName !== iconName) {
      renderCgoIcon(this.manager, this.minimizeButton, iconName, 13);
    }
    this.minimizeButton.hidden = !this.config.showMinimize || this.state.effectiveMode === 'sheet';
    const label = isCollapseMode
      ? (isCollapsed ? '展开' : '折叠')
      : (isCollapsed ? '还原' : '最小化');
    this.minimizeButton.setAttribute('aria-label', label);
    this.minimizeButton.title = label;
    if (isCollapseMode) {
      this.minimizeButton.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    } else {
      this.minimizeButton.removeAttribute('aria-expanded');
    }
  }

  applyGeometry() {
    if (this.state.effectiveMode === 'sidebar') {
      for (const property of ['left', 'top', 'right', 'bottom', 'width', 'minWidth', 'minHeight', 'maxHeight', 'transform']) {
        this.element.style[property] = '';
      }
      const dockH = this.state.dockHeight;
      if (this.state.lifecycle !== 'minimized' && Number.isFinite(Number(dockH)) && Number(dockH) >= this.config.minHeight) {
        this.element.style.height = `${Math.round(Number(dockH))}px`;
        this.element.classList.add('cgowm-has-dock-height');
      } else {
        this.element.style.height = '';
        this.element.classList.remove('cgowm-has-dock-height');
      }
      return;
    }
    this.element.classList.remove('cgowm-has-dock-height');
    this.element.style.left = `${this.state.x}px`;
    this.element.style.top = `${this.state.y}px`;
    this.element.style.width = safeCssLength(this.state.width, `${this.config.defaultWidth}px`);
    const workArea = this.manager.getWorkArea();
    const maxFloatH = Math.max(this.config.minHeight, (workArea.height || 800) - 16);
    if (this.state.lifecycle === 'minimized' && this.resolveMinimizeMode() === 'collapse') {
      this.element.style.height = 'auto';
      this.element.style.minHeight = '0px';
      this.element.style.maxHeight = '';
    } else {
      this.element.style.height = safeCssLength(this.state.height);
      this.element.style.minHeight = `${this.config.minHeight}px`;
      this.element.style.maxHeight = `${Math.round(maxFloatH)}px`;
    }
    this.element.style.minWidth = `${this.config.minWidth}px`;
  }

  clearFreeGeometry() {
    this.element.classList.remove('cgowm-has-dock-height');
    for (const property of ['left', 'top', 'right', 'bottom', 'width', 'height', 'minWidth', 'minHeight', 'maxHeight', 'transform']) {
      this.element.style[property] = '';
    }
  }

  open(options = {}) {
    if (this.state.lifecycle === 'destroyed') throw new Error(`窗口 ${this.key} 已销毁`);
    this.previousFocus = this.manager.documentRef.activeElement;
    const restoreMinimized = Boolean(options.restoreLifecycle && this.state.lifecycle === 'minimized');
    this.state.lifecycle = restoreMinimized ? 'minimized' : 'visible';

    const host = this.manager.getGroupHost(this.key);
    let groupRevealTarget = null;
    if (host && host !== this && !options.restoreLifecycle) {
      this.manager.setGroupActiveTab(host.key, this.key, { scrollIntoView: false });
      if (host.state.lifecycle === 'minimized') {
        host.restore({ scrollIntoView: false });
      }
      groupRevealTarget = host;
    }

    const handledByUnifiedMobile = this.manager.isUnifiedMobileActive() && this.manager.isUnifiedMobileEligible(this);

    this.element.hidden = handledByUnifiedMobile || this.state.effectiveMode === 'none';
    this.element.classList.toggle('cgowm-minimized', restoreMinimized);
    this.contentElement.hidden = !handledByUnifiedMobile && restoreMinimized && this.resolveMinimizeMode() === 'collapse';
    this.applyResponsiveMode();
    if (!handledByUnifiedMobile && !restoreMinimized && ['float', 'window'].includes(this.state.effectiveMode)) {
      this.keepInBounds({ persist: false });
    }
    if (!handledByUnifiedMobile) {
      this.bringToFront();
    }
    this.updateMinimizeButtonMeta();
    this.updateResizersVisibility();
    this.manager.syncSidebars();
    this.manager.syncTabGroups();
    this.manager.reflowStacks();
    if (groupRevealTarget && !handledByUnifiedMobile && options.scrollIntoView !== false && groupRevealTarget.state.effectiveMode === 'sidebar' && groupRevealTarget.state.lifecycle === 'visible') {
      this.manager.scrollSidebarPanelIntoView(groupRevealTarget, { mode: 'reveal' });
    }
    if (handledByUnifiedMobile) {
      if (options.focusMobile === true) {
        this.manager.setActiveMobilePanel(this.key, { expandIfCollapsed: true, persist: true });
      } else {
        this.manager.syncMobileDock();
      }
    }
    this.persist();
    this.manager.emitter.emit('open', { key: this.key, instance: this });
    if (!handledByUnifiedMobile && ['modal', 'fullscreen'].includes(this.state.effectiveMode)) {
      const focusable = getFocusableElements(this.element);
      (focusable[0] || this.element).focus({ preventScroll: true });
    }
    return this;
  }

  close() {
    if (this.state.lifecycle === 'destroyed') return false;
    this.removeMinimizedItem();
    if (this.manager.mobileDock?.hostedKey === this.key) {
      this.manager.releaseMobileDockHostedContent();
    }

    const wasGrouped = this.manager.isWindowGrouped(this.key);
    if (wasGrouped) {
      this.manager.removeWindowFromGroup(this.key, { sync: false });
    }
    this.manager.detachWindowFromStack(this.key, { sync: false });

    this.state.lifecycle = 'hidden';
    this.element.hidden = true;
    this.removeModalOverlay();
    this.element.classList.remove('cgowm-minimized');
    this.contentElement.hidden = false;
    this.manager.syncTabGroups();
    this.manager.syncSidebars();
    this.manager.syncMobileDock();
    this.manager.reflowStacks();
    this.persist();
    this.manager.emitter.emit('close', { key: this.key, instance: this });
    this.restorePreviousFocus();
    return true;
  }

  destroy() {
    if (this.state.lifecycle === 'destroyed') return false;
    if (this.manager.mobileDock?.hostedKey === this.key) {
      this.manager.releaseMobileDockHostedContent();
    }
    this.sheetController?.disconnect();
    this.abortController.abort();
    this.removeMinimizedItem();
    this.removeModalOverlay();
    this.manager.removeWindowFromGroup(this.key, { sync: false });
    this.manager.detachWindowFromStack(this.key, { sync: false });
    try {
      this.contentCleanup?.();
      this.content.unmount?.(this.contentElement, this.publicContext());
    } catch (error) {
      this.manager.reportError(error, { phase: 'unmount', key: this.key });
    }
    if (this.content.kind === 'element' && this.originalContentLocation?.parent?.isConnected) {
      const { parent, nextSibling } = this.originalContentLocation;
      if (nextSibling?.parentNode === parent) parent.insertBefore(this.content.element, nextSibling);
      else parent.appendChild(this.content.element);
    }
    this.element.remove();
    this.state.lifecycle = 'destroyed';
    this.manager.instances.delete(this.key);
    if (this.config.rememberPosition === false && this.manager.workspaceState) {
      const ws = this.manager.workspaceState;
      let workspaceDirty = false;
      if (ws.order?.left?.includes(this.key)) {
        ws.order.left = ws.order.left.filter((item) => item !== this.key);
        workspaceDirty = true;
      }
      if (ws.order?.right?.includes(this.key)) {
        ws.order.right = ws.order.right.filter((item) => item !== this.key);
        workspaceDirty = true;
      }
      if (ws.dockHeights && Object.hasOwn(ws.dockHeights, this.key)) {
        delete ws.dockHeights[this.key];
        workspaceDirty = true;
      }
      if (workspaceDirty) {
        this.manager.persistWorkspace();
      }
    }
    this.manager.syncTabGroups();
    this.manager.syncSidebars();
    this.manager.syncMobileDock();
    this.manager.reflowStacks();
    this.manager.emitter.emit('destroy', { key: this.key });
    this.restorePreviousFocus();
    return true;
  }

  resolveMinimizeMode() {
    const mode = this.state.effectiveMode;
    if (mode === 'sidebar') return 'collapse';
    if (this.config.minimizeMode === 'statusbar') {
      return this.manager.documentRef.querySelector(this.config.statusBarTarget) ? 'statusbar' : 'collapse';
    }
    return this.config.minimizeMode;
  }

  minimize(options = {}) {
    if (this.state.lifecycle === 'destroyed') return false;
    const minimizeMode = this.resolveMinimizeMode();
    this.state.lifecycle = 'minimized';
    this.element.classList.add('cgowm-minimized');
    if (minimizeMode === 'hide') this.element.hidden = true;
    if (minimizeMode === 'collapse') {
      this.contentElement.hidden = true;
      for (const child of this.element.querySelectorAll(':scope > .cgowm-content')) {
        child.hidden = true;
      }
    }
    if (minimizeMode === 'statusbar') {
      this.element.hidden = true;
      this.createMinimizedItem();
    }
    this.updateMinimizeButtonMeta();
    this.updateResizersVisibility();
    this.applyGeometry();
    this.manager.syncSidebars();
    this.manager.reflowStacks();
    if (options.persist !== false) this.persist();
    this.manager.emitter.emit('minimizedChange', { key: this.key, minimized: true, minimizeMode, instance: this });
    return true;
  }

  restore(options = {}) {
    if (this.state.lifecycle !== 'minimized') return this.open(options);
    this.removeMinimizedItem();
    this.state.lifecycle = 'visible';
    this.element.hidden = this.state.effectiveMode === 'none';
    this.element.classList.remove('cgowm-minimized');
    this.contentElement.hidden = false;
    if (this.state.effectiveMode === 'modal') this.ensureModalOverlay();
    this.updateMinimizeButtonMeta();
    this.updateResizersVisibility();
    this.applyGeometry();
    this.manager.syncTabGroups();
    this.manager.syncSidebars();
    this.keepInBounds();
    this.manager.reflowStacks();
    this.bringToFront();
    this.persist();
    this.manager.emitter.emit('minimizedChange', { key: this.key, minimized: false, instance: this });
    if (options.scrollIntoView !== false && this.state.effectiveMode === 'sidebar') {
      this.manager.scrollSidebarPanelIntoView(this, { mode: 'reveal' });
    }
    return true;
  }

  createMinimizedItem() {
    if (this.minimizedItem) return;
    const target = this.manager.documentRef.querySelector(this.config.statusBarTarget);
    if (!target) return;
    const item = this.manager.documentRef.createElement('button');
    item.type = 'button';
    item.className = 'cgowm-minimized-item';
    item.dataset.cgowmKey = this.key;
    item.textContent = this.config.shortTitle || this.config.title || this.config.panelId;
    item.addEventListener('click', () => this.restore());
    target.appendChild(item);
    this.minimizedItem = item;
  }

  removeMinimizedItem() {
    this.minimizedItem?.remove();
    this.minimizedItem = null;
  }

  setMode(mode, options = {}) {
    if (this.state.lifecycle === 'destroyed') return false;
    if (!this.config.allowModes.includes(mode)) return false;
    if (mode === 'window' && this.manager.host.environment !== 'desktop') return false;
    const previousMode = this.state.mode;
    const previousSide = this.state.sidebarSide;
    this.state.mode = mode;
    if (options.side === 'left' || options.side === 'right') this.state.sidebarSide = options.side;

    if (mode === 'sidebar') {
      this.manager.detachWindowFromStack(this.key, { sync: false });
      this.manager.moveGroupMembersMode(this.key, 'sidebar', this.state.sidebarSide);
      if (Number.isFinite(options.insertIndex)) {
        this.manager.insertInSidebarOrder(this.state.sidebarSide, this.key, options.insertIndex);
      } else if (previousMode !== 'sidebar' || previousSide !== this.state.sidebarSide) {
        this.manager.ensureInSidebarOrder(this.state.sidebarSide, this.key);
      }
      if (previousSide !== this.state.sidebarSide) {
        this.manager.removeFromSidebarOrder(previousSide, this.key);
      }
    } else if (previousMode === 'sidebar') {
      this.manager.removeFromSidebarOrder(previousSide, this.key);
      this.manager.moveGroupMembersMode(this.key, mode, this.state.sidebarSide);
    }

    this.applyResponsiveMode();
    if (mode === 'float') this.keepInBounds({ persist: false });
    this.manager.reflowStacks();
    this.persist();
    if (previousMode !== mode || (mode === 'sidebar' && previousSide !== this.state.sidebarSide)) {
      this.manager.emitter.emit('modeChange', { key: this.key, mode, previousMode, side: this.state.sidebarSide, instance: this });
    }
    return true;
  }

  setMobileDetent(detent) {
    if (!this.config.mobileDetents.includes(detent)) return false;
    const previousDetent = this.state.mobileDetent;
    this.state.mobileDetent = detent;
    this.sheetController?.apply(detent, true);
    this.persist();
    if (previousDetent !== detent) {
      this.manager.emitter.emit('detentChange', { key: this.key, detent, previousDetent, dragging: false, instance: this });
    }
    return true;
  }

  bringToFront() {
    if (this.state.lifecycle === 'destroyed') return false;
    const prevKey = this.manager.activeKey;
    if (prevKey && prevKey !== this.key) {
      const prevInst = this.manager.get(prevKey);
      if (prevInst?.element?.dataset) delete prevInst.element.dataset.active;
      const prevHost = this.manager.getGroupHost(prevKey);
      if (prevHost?.element?.dataset) delete prevHost.element.dataset.active;
    }
    const zIndex = this.manager.nextZ(this.config.zGroup);
    this.element.style.zIndex = String(zIndex);
    if (this.modalOverlay) this.modalOverlay.style.zIndex = String(Math.max(0, zIndex - 1));
    const activeHost = this.manager.getGroupHost(this.key) || this;
    if (activeHost.element?.dataset) activeHost.element.dataset.active = 'true';
    this.manager.activeKey = this.key;
    this.manager.emitter.emit('focus', { key: this.key, instance: this });
    return true;
  }

  keepInBounds(options = {}) {
    if (!['float', 'window'].includes(this.state.effectiveMode) || this.state.maximized) return;
    const workArea = this.manager.getWorkArea();
    const rect = this.element.getBoundingClientRect();
    const measuredW = rect.width || Number(this.state.width) || this.config.defaultWidth;
    const titleH = this.titlebar.offsetHeight || 32;
    const maxX = Math.max(0, workArea.viewportWidth - Math.min(measuredW, workArea.viewportWidth));
    const minY = workArea.top;
    const maxY = Math.max(minY, workArea.bottom - Math.min(titleH, Math.max(32, workArea.bottom - minY)));
    this.state.x = clamp(this.state.x, 0, maxX);
    this.state.y = clamp(this.state.y, minY, maxY);
    this.applyGeometry();
    if (options.persist !== false) this.persist();
  }

  handleTabstripPointerDown(event) {
    const closeEl = event.target.closest('.cgowm-tab-close');
    if (closeEl) {
      event.stopPropagation();
      event.preventDefault();
      const tabKey = closeEl.closest('.cgowm-tab')?.dataset.tabKey;
      if (tabKey) this.manager.get(tabKey)?.close();
      return;
    }
    const tabBtn = event.target.closest('.cgowm-tab');
    if (tabBtn) {
      const tabKey = tabBtn.dataset.tabKey;
      if (tabKey && event.button === 0) {
        this.startTabInteraction(event, tabBtn, tabKey);
        return;
      }
    }
    this.startDrag(event, this.tabstrip);
  }

  startTabInteraction(event, tabBtn, tabKey) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.bringToFront();
    const titleRect = rectOf(this.titlebar);
    const startX = event.clientX;
    const startY = event.clientY;
    const wasActive = this.manager.getGroupActiveKey(this.key) === tabKey;
    let moved = false;
    let detached = false;

    const doc = this.manager.documentRef;
    const cleanup = () => {
      doc.removeEventListener('pointermove', onMove);
      doc.removeEventListener('pointerup', onUp);
      doc.removeEventListener('pointercancel', onUp);
    };

    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true;
      const outsideTitlebar = (
        moveEvent.clientY < titleRect.top - 16
        || moveEvent.clientY > titleRect.bottom + 16
        || moveEvent.clientX < titleRect.left - 18
        || moveEvent.clientX > titleRect.right + 18
      );
      if (outsideTitlebar && !detached) {
        detached = true;
        cleanup();
        const detachedWin = this.manager.detachTabWindow(tabKey, moveEvent.clientX, moveEvent.clientY);
        if (detachedWin) {
          detachedWin.beginDetachedDrag(moveEvent);
        }
      }
    };

    const onUp = () => {
      cleanup();
      if (!moved) {
        if (this.state.lifecycle === 'minimized') {
          this.manager.setGroupActiveTab(this.key, tabKey, { scrollIntoView: false });
          this.restore();
        } else if (!wasActive) {
          this.manager.setGroupActiveTab(this.key, tabKey);
        } else if (this.state.effectiveMode === 'sidebar') {
          this.minimize();
        }
      }
    };

    tabBtn.setPointerCapture?.(event.pointerId);
    doc.addEventListener('pointermove', onMove, { passive: false });
    doc.addEventListener('pointerup', onUp);
    doc.addEventListener('pointercancel', onUp);
  }

  beginDetachedDrag(event) {
    const rect = this.element.getBoundingClientRect();
    this.dragSession = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWinX: this.state.x,
      startWinY: this.state.y,
      offsetX: Math.min(Math.max(40, Math.round(rect.width / 2)), Math.max(40, rect.width - 20)),
      offsetY: 14,
      startedInSidebar: false,
      sidebarSide: this.state.sidebarSide,
      sidebarRect: null,
      detached: true,
      hasMoved: true,
      stackKeys: [this.key],
      stackStartOffsets: [],
      groupDropTarget: null,
      stackDropTarget: null,
      sidebarInsertIndex: -1,
    };
    this.manager.setAllIframeBlockers(true);
    this.element.dataset.dragging = 'true';
    this.bringToFront();
    const doc = this.manager.documentRef;
    this.boundDragMove = (moveEvent) => this.onDrag(moveEvent);
    this.boundDragEnd = (endEvent) => this.endDrag(endEvent);
    doc.addEventListener('pointermove', this.boundDragMove, { passive: false });
    doc.addEventListener('pointerup', this.boundDragEnd);
    doc.addEventListener('pointercancel', this.boundDragEnd);
    this.manager.emitter.emit('dragStart', { key: this.key, instance: this });
  }

  startDrag(event, captureTarget = this.dragHandle) {
    if (event.button !== 0 || event.target.closest('.cgowm-controls')) return;
    if (!['float', 'window', 'sidebar'].includes(this.state.effectiveMode) || this.state.maximized) return;
    event.preventDefault();
    const rect = this.element.getBoundingClientRect();
    const startedInSidebar = this.state.effectiveMode === 'sidebar';
    const sidebarObj = startedInSidebar ? this.manager.sidebars.get(this.state.sidebarSide) : null;
    const sidebarRect = sidebarObj ? sidebarObj.element.getBoundingClientRect() : null;

    const stack = this.state.effectiveMode === 'float' ? this.manager.getStackForWindow(this.key) : null;
    const isStackHead = stack && stack.keys[0] === this.key;
    const stackKeys = isStackHead ? [...stack.keys] : [this.key];
    const stackStartOffsets = stackKeys.slice(1).map((memberKey) => {
      const member = this.manager.get(memberKey);
      return { key: memberKey, dx: (member?.state.x ?? this.state.x) - this.state.x, dy: (member?.state.y ?? this.state.y) - this.state.y };
    });

    this.dragSession = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWinX: this.state.x,
      startWinY: this.state.y,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startedInSidebar,
      sidebarSide: this.state.sidebarSide,
      sidebarRect,
      detached: false,
      hasMoved: false,
      stackKeys,
      stackStartOffsets,
      groupDropTarget: null,
      stackDropTarget: null,
      sidebarInsertIndex: -1,
    };

    this.bringToFront();
    captureTarget.setPointerCapture?.(event.pointerId);
    const doc = this.manager.documentRef;
    this.boundDragMove = (moveEvent) => this.onDrag(moveEvent);
    this.boundDragEnd = (endEvent) => this.endDrag(endEvent);
    doc.addEventListener('pointermove', this.boundDragMove, { passive: false });
    doc.addEventListener('pointerup', this.boundDragEnd);
    doc.addEventListener('pointercancel', this.boundDragEnd);
  }

  onDrag(event) {
    const session = this.dragSession;
    if (!session) return;
    event.preventDefault();
    const moveDist = Math.hypot(event.clientX - session.startClientX, event.clientY - session.startClientY);
    if (!session.hasMoved) {
      if (moveDist < 5) return;
      session.hasMoved = true;
      this.manager.setAllIframeBlockers(true);
      this.element.dataset.dragging = 'true';
      this.manager.emitter.emit('dragStart', { key: this.key, instance: this });

      // 拖动堆栈非首节窗口时自动从串联栈分离
      if (!session.startedInSidebar && this.manager.getStackForWindow(this.key) && session.stackKeys.length === 1) {
        this.manager.detachWindowFromStack(this.key);
      }
    }

    if (session.startedInSidebar && !session.detached) {
      const sr = session.sidebarRect;
      const leaveMargin = 28;
      const outOfSidebar = sr
        ? (session.sidebarSide === 'left' ? event.clientX > sr.right + leaveMargin : event.clientX < sr.left - leaveMargin)
        : Math.abs(event.clientX - session.startClientX) > 36;

      if (!outOfSidebar) {
        this.manager.clearDropTargets();
        const dropTarget = this.manager.findSidebarDropTarget(this, session.sidebarSide, event.clientX, event.clientY);
        session.groupDropTarget = dropTarget.groupTargetKey || null;
        session.sidebarInsertIndex = dropTarget.insertIndex;
        return;
      }

      session.detached = true;
      this.manager.hideSidebarDropIndicator();
      this.manager.clearDropTargets();
      const workArea = this.manager.getWorkArea();
      const targetWidth = this.state.width || this.config.defaultWidth;
      this.state.x = clamp(event.clientX - Math.round(targetWidth / 2), 0, Math.max(0, workArea.viewportWidth - targetWidth));
      this.state.y = clamp(event.clientY - 16, workArea.top, Math.max(workArea.top, workArea.bottom - 36));
      session.offsetX = Math.min(Math.round(targetWidth / 2), Math.max(20, targetWidth - 20));
      session.offsetY = 16;
      this.setMode('float');
    }

    if (!['float', 'window'].includes(this.state.effectiveMode)) return;

    const workArea = this.manager.getWorkArea();
    const rawX = event.clientX - session.offsetX;
    const rawY = Math.max(workArea.top, event.clientY - session.offsetY);
    const rect = this.element.getBoundingClientRect();
    const excludeKeys = new Set(session.stackKeys);

    const disableSnap = event.ctrlKey || event.altKey;
    let nextX = rawX;
    let nextY = rawY;
    let snapped = false;

    if (!disableSnap && this.state.effectiveMode === 'float') {
      const otherRects = this.manager.getVisibleFloatingRects(excludeKeys);
      const snapResult = snapFloatingRect(
        { x: rawX, y: rawY, width: rect.width || this.state.width, height: rect.height || 120 },
        otherRects,
        workArea,
        this.manager.host.snapThreshold ?? DEFAULT_SNAP_THRESHOLD,
      );
      nextX = snapResult.x;
      nextY = snapResult.y;
      snapped = snapResult.snapped;
    } else {
      nextX = clamp(rawX, 0, Math.max(0, workArea.viewportWidth - (rect.width || this.state.width)));
      nextY = clamp(rawY, workArea.top, Math.max(workArea.top, workArea.bottom - 32));
    }

    this.state.x = nextX;
    this.state.y = nextY;
    this.element.dataset.snapped = snapped ? 'true' : 'false';
    this.applyGeometry();

    // 同步移动串联栈内的下游窗口
    for (const follower of session.stackStartOffsets) {
      const member = this.manager.get(follower.key);
      if (!member) continue;
      member.state.x = nextX + follower.dx;
      member.state.y = nextY + follower.dy;
      member.applyGeometry();
    }

    // 检查侧边栏停靠热区及 Tab/栈合并热区
    const sideDrop = this.manager.updateHotZonePreview(event.clientX, event.clientY, this);
    if (sideDrop) {
      this.manager.clearDropTargets();
      session.groupDropTarget = null;
      session.stackDropTarget = null;
      session.sidebarInsertIndex = sideDrop.insertIndex;
    } else {
      const dropInfo = this.manager.updateFloatingDropTargets(this, event.clientX, event.clientY, excludeKeys);
      session.groupDropTarget = dropInfo.groupTargetKey;
      session.stackDropTarget = dropInfo.stackTargetKey;
      session.sidebarInsertIndex = -1;
    }

    this.manager.emitter.emit('drag', { key: this.key, x: this.state.x, y: this.state.y, clientX: event.clientX, clientY: event.clientY, instance: this });
  }

  endDrag(event) {
    const session = this.dragSession;
    if (!session) return;
    const doc = this.manager.documentRef;
    doc.removeEventListener('pointermove', this.boundDragMove);
    doc.removeEventListener('pointerup', this.boundDragEnd);
    doc.removeEventListener('pointercancel', this.boundDragEnd);
    this.dragSession = null;
    delete this.element.dataset.dragging;
    delete this.element.dataset.snapped;
    this.manager.setAllIframeBlockers(false);
    this.manager.hideHotZonePreview();
    this.manager.hideSidebarDropIndicator();
    this.manager.clearDropTargets();

    // 若只是轻点标题栏而未拖拽：在 sidebar 模式下原地切换百叶窗折叠/展开
    if (!session.hasMoved) {
      if (session.startedInSidebar && this.config.showMinimize && this.resolveMinimizeMode() === 'collapse') {
        if (this.state.lifecycle === 'minimized') this.restore();
        else this.minimize();
      }
      return;
    }

    if (event.type !== 'pointercancel') {
      if (session.groupDropTarget) {
        const target = this.manager.get(session.groupDropTarget);
        if (target) {
          this.manager.groupWindows(target.key, this.key);
          this.manager.emitter.emit('dragEnd', { key: this.key, clientX: event.clientX, clientY: event.clientY, instance: this });
          return;
        }
      }

      if (session.startedInSidebar && !session.detached) {
        this.manager.insertInSidebarOrder(session.sidebarSide, this.key, session.sidebarInsertIndex);
        this.manager.syncSidebars();
        this.persist();
        this.manager.emitter.emit('dragEnd', { key: this.key, clientX: event.clientX, clientY: event.clientY, instance: this });
        return;
      }

      const sideDrop = this.config.allowModes.includes('sidebar')
        ? this.manager.detectSidebarDropZone(event.clientX, event.clientY, this)
        : null;

      if (sideDrop) {
        this.setMode('sidebar', { side: sideDrop.side, insertIndex: sideDrop.insertIndex });
        if (this.manager.isSingleSidebarActive()) {
          this.manager.activateSidebar(sideDrop.side, { persist: true });
        }
        this.manager.emitter.emit('dragEnd', { key: this.key, clientX: event.clientX, clientY: event.clientY, instance: this });
        return;
      }

      if (session.stackDropTarget && this.state.effectiveMode === 'float') {
        this.manager.attachWindowToStack(session.stackDropTarget, this.key);
        this.manager.emitter.emit('dragEnd', { key: this.key, clientX: event.clientX, clientY: event.clientY, instance: this });
        return;
      }
    }

    this.keepInBounds();
    for (const follower of session.stackStartOffsets) {
      this.manager.get(follower.key)?.keepInBounds();
    }
    this.persist();
    this.manager.emitter.emit('dragEnd', { key: this.key, clientX: event.clientX, clientY: event.clientY, instance: this });
  }

  startResize(event, direction) {
    const mode = this.state.effectiveMode;
    if (event.button !== 0 || !this.config.resizable) return;
    if (!['float', 'window', 'sidebar', 'modal'].includes(mode)) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = this.element.getBoundingClientRect();
    this.resizeSession = { direction, mode, startX: event.clientX, startY: event.clientY, rect };
    this.manager.setAllIframeBlockers(true);
    this.element.dataset.resizing = direction;
    const doc = this.manager.documentRef;
    this.boundResizeMove = (moveEvent) => this.onResize(moveEvent);
    this.boundResizeEnd = () => this.endResize();
    doc.addEventListener('pointermove', this.boundResizeMove, { passive: false });
    doc.addEventListener('pointerup', this.boundResizeEnd);
    doc.addEventListener('pointercancel', this.boundResizeEnd);
  }

  onResize(event) {
    const session = this.resizeSession;
    if (!session) return;
    event.preventDefault();
    const viewport = viewportOf(this.manager);
    const workArea = this.manager.getWorkArea();
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;

    if (session.mode === 'sidebar') {
      const nextHeight = clamp(Math.round(session.rect.height + dy), this.config.minHeight, Math.max(this.config.minHeight, workArea.height));
      this.state.dockHeight = nextHeight;
      this.manager.setDockHeight(this.key, nextHeight);
      this.applyGeometry();
      this.manager.emitter.emit('resize', { key: this.key, dockHeight: nextHeight, instance: this });
      return;
    }

    if (session.mode === 'modal') {
      const hasVertical = session.direction.includes('s') || session.direction.includes('n');
      const hasHorizontal = session.direction.includes('e') || session.direction.includes('w');
      let nextW = Number(session.rect.width);
      let nextH = Number(session.rect.height);
      if (session.direction.includes('e')) nextW = session.rect.width + dx * 2;
      if (session.direction.includes('w')) nextW = session.rect.width - dx * 2;
      if (session.direction.includes('s')) nextH = session.rect.height + dy * 2;
      if (session.direction.includes('n')) nextH = session.rect.height - dy * 2;
      nextW = clamp(Math.round(nextW), this.config.minWidth, Math.floor(viewport.width * 0.94));
      nextH = clamp(Math.round(nextH), this.config.minHeight, Math.floor(viewport.height * 0.9));
      this.state.width = nextW;
      this.element.style.setProperty('--cwm-modal-width', `${nextW}px`);
      if (hasVertical) {
        this.state.height = nextH;
        this.element.style.setProperty('--cwm-modal-height', `${nextH}px`);
      } else if (hasHorizontal && this.content.kind !== 'iframe' && this.config.autoHeight !== false) {
        this.state.height = 'auto';
        this.element.style.removeProperty('--cwm-modal-height');
      }
      this.manager.emitter.emit('resize', { key: this.key, width: nextW, height: this.state.height, instance: this });
      return;
    }

    const hasVertical = session.direction.includes('s') || session.direction.includes('n');
    const hasHorizontal = session.direction.includes('e') || session.direction.includes('w');
    let { left: x, top: y, width, height } = session.rect;
    if (session.direction.includes('e')) width = clamp(session.rect.width + dx, this.config.minWidth, viewport.width - x);
    if (session.direction.includes('s')) height = clamp(session.rect.height + dy, this.config.minHeight, workArea.bottom - y);
    if (session.direction.includes('w')) {
      width = clamp(session.rect.width - dx, this.config.minWidth, session.rect.right);
      x = session.rect.right - width;
    }
    if (session.direction.includes('n')) {
      const maxH = Math.max(this.config.minHeight, session.rect.bottom - workArea.top);
      height = clamp(session.rect.height - dy, this.config.minHeight, maxH);
      y = session.rect.bottom - height;
    }
    this.state.x = Math.round(x);
    this.state.y = Math.round(y);
    this.state.width = Math.round(width);
    if (hasVertical) {
      this.state.height = Math.round(height);
    } else if (hasHorizontal && this.content.kind !== 'iframe' && this.config.autoHeight !== false) {
      this.state.height = 'auto';
    }
    this.applyGeometry();
    if (this.state.height === 'auto' && !hasVertical) {
      const actualRect = this.element.getBoundingClientRect();
      if (actualRect.height > 0 && actualRect.bottom > workArea.bottom - 8 && this.state.y > workArea.top + 8) {
        this.state.y = Math.max(
          Math.round(workArea.top + 8),
          Math.round(workArea.bottom - 8 - actualRect.height),
        );
        this.element.style.top = `${this.state.y}px`;
      }
    }
    this.manager.reflowStacks();
    this.manager.emitter.emit('resize', { key: this.key, x: this.state.x, y: this.state.y, width: this.state.width, height: this.state.height, instance: this });
  }

  endResize() {
    if (!this.resizeSession) return;
    const doc = this.manager.documentRef;
    doc.removeEventListener('pointermove', this.boundResizeMove);
    doc.removeEventListener('pointerup', this.boundResizeEnd);
    doc.removeEventListener('pointercancel', this.boundResizeEnd);
    this.resizeSession = null;
    delete this.element.dataset.resizing;
    this.manager.setAllIframeBlockers(false);
    this.persist();
    this.manager.emitter.emit('resizeEnd', { key: this.key, instance: this });
  }

  toggleMaximize() {
    if (this.state.effectiveMode !== 'window') return false;
    if (!this.state.maximized) {
      this.maximizeSnapshot = {
        x: this.state.x,
        y: this.state.y,
        width: this.state.width,
        height: this.state.height,
      };
      this.state.maximized = true;
      this.element.classList.add('cgowm-window-maximized');
      this.clearFreeGeometry();
      renderCgoIcon(this.manager, this.maximizeButton, 'fullscn-exit', 13);
      this.maximizeButton.hidden = !this.config.showMaximize || this.state.effectiveMode !== 'window';
      this.maximizeButton.setAttribute('aria-label', '还原');
      this.maximizeButton.title = '还原';
    } else {
      Object.assign(this.state, this.maximizeSnapshot || {});
      this.state.maximized = false;
      this.element.classList.remove('cgowm-window-maximized');
      this.applyGeometry();
      renderCgoIcon(this.manager, this.maximizeButton, 'fullscn', 13);
      this.maximizeButton.hidden = !this.config.showMaximize || this.state.effectiveMode !== 'window';
      this.maximizeButton.setAttribute('aria-label', '最大化');
      this.maximizeButton.title = '最大化';
    }
    this.persist();
    this.manager.emitter.emit('maximizeChange', { key: this.key, maximized: this.state.maximized, instance: this });
    return true;
  }

  ensureModalOverlay() {
    if (this.modalOverlay) return;
    const overlay = this.manager.documentRef.createElement('div');
    overlay.className = 'cgowm-modal-overlay';
    overlay.dataset.cgowmKey = this.key;
    overlay.addEventListener('pointerdown', () => {
      if (this.config.closeOnOverlay) this.close();
    });
    this.manager.root.insertBefore(overlay, this.element);
    this.modalOverlay = overlay;
    const zIndex = Number.parseInt(this.element.style.zIndex, 10);
    if (Number.isFinite(zIndex)) overlay.style.zIndex = String(Math.max(0, zIndex - 1));
  }

  removeModalOverlay() {
    this.modalOverlay?.remove();
    this.modalOverlay = null;
  }

  trapFocus(event) {
    if (event.key !== 'Tab' || !['modal', 'fullscreen'].includes(this.state.effectiveMode)) return;
    const focusable = getFocusableElements(this.element);
    if (!focusable.length) {
      event.preventDefault();
      this.element.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.manager.documentRef.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.manager.documentRef.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  restorePreviousFocus() {
    if (this.previousFocus?.isConnected && typeof this.previousFocus.focus === 'function') {
      this.previousFocus.focus({ preventScroll: true });
    }
    this.previousFocus = null;
  }

  persist() {
    writeWindowState(this.manager.storage, makeStorageKey(this.manager.host.hostId, this.key), this.state, this.config);
  }

  snapshot() {
    return {
      key: this.key,
      config: this.config,
      state: { ...this.state },
      element: this.element,
      contentElement: this.contentElement,
    };
  }
}

export class CgoWindowManager {
  constructor(options = {}) {
    const windowRef = options.window || globalThis.window;
    const documentRef = options.document || windowRef?.document || globalThis.document;
    if (!windowRef || !documentRef) throw new Error('CGoWM 需要浏览器 window 和 document');
    this.windowRef = windowRef;
    this.documentRef = documentRef;
    this.storage = options.storage === null ? null : options.storage || windowRef.localStorage;
    this.instances = new Map();
    this.sidebars = new Map();
    this.zCounters = new Map(Object.entries(Z_GROUP_BASE));
    this.activeKey = null;
    this.initialized = false;
    this.emitter = new EventEmitter((error, context) => this.reportError(error, { phase: 'event', ...context }));
    this.remoteHandler = null;
    this.workspaceState = null;
    this.workspaceStorageKey = null;
    this.mobileWorkspaceState = null;
    this.mobileWorkspaceStorageKey = null;
    this.mobileDock = null;
    this.userSelectedMobilePanel = false;
    this.addons = new CgoAddonManager(this);
    this.sidebarResizeSession = null;
    this.sidebarDropIndicator = null;
    this.railTooltip = null;
    this.railFlashTimer = null;
    this.railFlashEl = null;
    this.sidebarScrollSeq = 0;
    this.lastViewportSize = { width: 0, height: 0 };
    this.lastViewportTier = null;
    this.viewportCleanups = [];
    this.mobileDockSettleRaf = null;
    this.boundResize = () => this.handleViewportResize();
    this.boundKeydown = (event) => this.handleKeydown(event);
  }

  init(hostConfig = {}) {
    if (this.initialized) {
      if (hostConfig && Object.keys(hostConfig).length > 0) {
        this.configureHost(hostConfig);
      }
      return this.publicApi;
    }
    const rawWidths = hostConfig.defaultSidebarWidth;
    const defaultLeftW = typeof rawWidths === 'object' ? (rawWidths?.left ?? DEFAULT_SIDEBAR_WIDTH) : (rawWidths ?? DEFAULT_SIDEBAR_WIDTH);
    const defaultRightW = typeof rawWidths === 'object' ? (rawWidths?.right ?? DEFAULT_SIDEBAR_WIDTH) : (rawWidths ?? DEFAULT_SIDEBAR_WIDTH);

    this.host = {
      hostId: hostConfig.hostId || hostConfig.programId || 'cgo',
      programId: hostConfig.programId || hostConfig.hostId || 'cgo',
      environment: hostConfig.environment || 'web',
      mobileBreakpoint: hostConfig.mobileBreakpoint || DEFAULT_MOBILE_BREAKPOINT,
      singleSidebarMaxWidth: Number(hostConfig.singleSidebarMaxWidth) || 0,
      mobileWorkspace: hostConfig.mobileWorkspace || 'individual',
      mobileDefaultDetent: hostConfig.mobileDefaultDetent || 'half',
      mobileDefaultPanel: hostConfig.mobileDefaultPanel || null,
      hotZone: hostConfig.hotZone ?? DEFAULT_HOT_ZONE,
      snapThreshold: hostConfig.snapThreshold ?? DEFAULT_SNAP_THRESHOLD,
      minSidebarWidth: hostConfig.minSidebarWidth ?? MIN_SIDEBAR_WIDTH,
      maxSidebarWidth: hostConfig.maxSidebarWidth ?? MAX_SIDEBAR_WIDTH,
      sidebarResizable: hostConfig.sidebarResizable ?? Boolean(hostConfig.sidebarTargets),
      sidebarTargets: hostConfig.sidebarTargets || null,
      defaultSidebarOrder: hostConfig.defaultSidebarOrder || { left: [], right: [] },
      workAreaInsets: hostConfig.workAreaInsets || { top: 0, bottom: 0 },
      remoteEnabled: false,
      ...hostConfig,
      defaultSidebarWidth: { left: defaultLeftW, right: defaultRightW },
    };
    this.applyZBase(this.host.zBase);
    this.root = typeof hostConfig.root === 'string'
      ? this.documentRef.querySelector(hostConfig.root)
      : hostConfig.root || this.documentRef.body;
    if (!this.root) throw new Error('找不到 CGoWM root 容器');
    this.root.classList.add('cgowm-host');

    this.workspaceStorageKey = makeWorkspaceStorageKey(this.host.hostId, this.host.programId);
    this.workspaceState = readWorkspaceState(this.storage, this.workspaceStorageKey, {
      widths: this.host.defaultSidebarWidth,
      minSidebarWidth: this.host.minSidebarWidth,
      maxSidebarWidth: this.host.maxSidebarWidth,
      order: this.host.defaultSidebarOrder,
    });
    this.mobileWorkspaceStorageKey = makeMobileWorkspaceStorageKey(this.host.hostId, this.host.programId);
    this.mobileWorkspaceState = readMobileWorkspaceState(this.storage, this.mobileWorkspaceStorageKey, {
      activeKey: this.host.mobileDefaultPanel || null,
      detent: this.host.mobileDefaultDetent || 'half',
    });

    this.documentRef.addEventListener('keydown', this.boundKeydown);
    this.initialized = true;
    this.bindViewportListeners();
    this.dialogApi = createDialogApi(this);
    this.publicApi = this.createPublicApi();
    const initialVp = viewportOf(this);
    this.lastViewportSize = { width: initialVp.width, height: initialVp.height };
    this.syncSidebars();
    this.syncMobileDock();
    this.emitter.emit('ready', { host: this.host });
    return this.publicApi;
  }

  unbindViewportListeners() {
    while (this.viewportCleanups.length > 0) {
      const fn = this.viewportCleanups.pop();
      try {
        fn();
      } catch {
        // 忽略清理异常
      }
    }
  }

  bindViewportListeners() {
    this.unbindViewportListeners();
    const win = this.windowRef;
    const doc = this.documentRef;

    win.addEventListener('resize', this.boundResize);
    this.viewportCleanups.push(() => win.removeEventListener('resize', this.boundResize));

    win.addEventListener('orientationchange', this.boundResize);
    this.viewportCleanups.push(() => win.removeEventListener('orientationchange', this.boundResize));

    const orient = win.screen?.orientation;
    if (orient?.addEventListener) {
      orient.addEventListener('change', this.boundResize);
      this.viewportCleanups.push(() => orient.removeEventListener('change', this.boundResize));
    }

    const vv = win.visualViewport;
    if (vv?.addEventListener) {
      vv.addEventListener('resize', this.boundResize);
      this.viewportCleanups.push(() => vv.removeEventListener('resize', this.boundResize));
    }

    const breakpoints = new Set([Number(this.host?.mobileBreakpoint) || DEFAULT_MOBILE_BREAKPOINT]);
    const singleMax = Number(this.host?.singleSidebarMaxWidth) || 0;
    if (singleMax > 0) breakpoints.add(singleMax);

    for (const bp of breakpoints) {
      const mql = win.matchMedia?.(`(max-width: ${bp}px)`);
      if (mql?.addEventListener) {
        mql.addEventListener('change', this.boundResize);
        this.viewportCleanups.push(() => mql.removeEventListener('change', this.boundResize));
      } else if (mql?.addListener) {
        mql.addListener(this.boundResize);
        this.viewportCleanups.push(() => mql.removeListener(this.boundResize));
      }
    }

    const docEl = doc?.documentElement;
    if (typeof win.ResizeObserver === 'function' && docEl && typeof docEl.addEventListener === 'function') {
      const ro = new win.ResizeObserver(() => {
        if (!this.initialized) return;
        const vp = viewportOf(this);
        if (vp.width !== this.lastViewportSize.width || vp.height !== this.lastViewportSize.height) {
          this.handleViewportResize();
        }
      });
      ro.observe(docEl);
      this.viewportCleanups.push(() => ro.disconnect());
    }
  }

  applyZBase(zBase) {
    if (!zBase || typeof zBase !== 'object') return;
    for (const [group, baseValue] of Object.entries(zBase)) {
      const numeric = Number(baseValue);
      if (!Number.isFinite(numeric)) continue;
      this.zCounters.set(group, Math.max(numeric, this.zCounters.get(group) || 0));
    }
  }

  configureHost(patch = {}) {
    if (!this.initialized) return this.init(patch);
    if (!patch || typeof patch !== 'object') return this.publicApi;
    const rawWidths = patch.defaultSidebarWidth;
    const nextWidths = rawWidths
      ? {
        left: typeof rawWidths === 'object' ? (rawWidths.left ?? this.host.defaultSidebarWidth.left) : rawWidths,
        right: typeof rawWidths === 'object' ? (rawWidths.right ?? this.host.defaultSidebarWidth.right) : rawWidths,
      }
      : this.host.defaultSidebarWidth;

    const mergedWorkInsets = patch.workAreaInsets
      ? { ...(this.host.workAreaInsets || {}), ...patch.workAreaInsets }
      : this.host.workAreaInsets;
    const mergedZBase = patch.zBase
      ? { ...(this.host.zBase || {}), ...patch.zBase }
      : this.host.zBase;

    this.host = {
      ...this.host,
      ...patch,
      defaultSidebarWidth: nextWidths,
      workAreaInsets: mergedWorkInsets,
      zBase: mergedZBase,
    };
    this.applyZBase(mergedZBase);
    if (Object.hasOwn(patch, 'mobileBreakpoint') || Object.hasOwn(patch, 'singleSidebarMaxWidth')) {
      this.bindViewportListeners();
    }
    this.emitter.emit('hostConfigChange', { host: this.host });
    this.handleViewportResize();
    return this.publicApi;
  }

  createPublicApi() {
    return Object.freeze({
      version: '0.1.0',
      register: (config) => this.register(config),
      update: (key, patch) => this.update(key, patch),
      open: (key, options) => this.open(key, options),
      close: (key) => this.close(key),
      destroy: (key) => this.destroy(key),
      minimize: (key) => this.minimize(key),
      restore: (key, options) => this.restore(key, options),
      isMinimized: (key) => this.isMinimized(key),
      setMode: (key, mode, options) => this.setMode(key, mode, options),
      get: (key) => this.get(key),
      list: () => [...this.instances.values()],
      bringToFront: (key) => this.bringToFront(key),
      setMobileDetent: (key, detent) => this.setMobileDetent(key, detent),
      getMobileDetent: (key) => this.getMobileDetent(key),
      on: (event, handler) => this.emitter.on(event, handler),
      off: (event, handler) => this.emitter.off(event, handler),
      destroyAll: () => this.destroyAll(),
      alert: (message, options) => this.dialogApi.alert(message, options),
      confirm: (message, options) => this.dialogApi.confirm(message, options),
      prompt: (message, options) => this.dialogApi.prompt(message, options),
      dialog: (options) => this.dialogApi.dialog(options),
      openRemote: (...args) => this.openRemote(...args),
      getWorkArea: () => this.getWorkArea(),
      getSidebarWidth: (side) => this.getSidebarWidth(side),
      setSidebarWidth: (side, width) => this.setSidebarWidth(side, width),
      isSingleSidebarActive: () => this.isSingleSidebarActive(),
      getSidebarDisplayState: (side) => this.getSidebarDisplayState(side),
      activateSidebar: (side, options) => this.activateSidebar(side, options),
      collapseSidebarToRail: (side) => this.collapseSidebarToRail(side),
      focusSidebarPanel: (key, options) => this.focusSidebarPanel(key, options),
      groupWindows: (targetKey, incomingKey) => this.groupWindows(targetKey, incomingKey),
      ungroupWindow: (key) => this.ungroupWindow(key),
      setActiveTab: (hostKey, tabKey, options) => this.setGroupActiveTab(hostKey, tabKey, options),
      hasPersistedState: (key) => this.hasPersistedState(key),
      isWorkspaceInitialized: () => Boolean(this.workspaceState?.initialized),
      markWorkspaceInitialized: () => this.markWorkspaceInitialized(),
      resetWorkspace: (options) => this.resetWorkspace(options),
      getWorkspaceSnapshot: () => this.getWorkspaceSnapshot(),
      configureHost: (patch) => this.configureHost(patch),
      setMobileDockDucking: (active) => this.setMobileDockDucking(active),
      setActiveMobilePanel: (key, options) => this.setActiveMobilePanel(key, options),
      getMobileWorkspaceState: () => (this.mobileWorkspaceState ? { ...this.mobileWorkspaceState } : null),
      addons: this.addons,
      registerAddon: (manifest) => this.addons.registerAddon(manifest),
      registerAddons: (list) => this.addons.registerAddons(list),
      openAddonManager: (options) => this.addons.openAddonManager(options),
      registerCapability: (name, handler) => this.addons.registerCapability(name, handler),
      invokeCapability: (name, payload) => this.addons.invokeCapability(name, payload),
    });
  }

  register(config) {
    if (!this.initialized) throw new Error('请先调用 CGoWM.init()');
    const normalized = normalizeConfig(config, this.host);
    if (this.instances.has(normalized.key)) return this.instances.get(normalized.key);
    try {
      const instance = new CgoWindowInstance(this, normalized);
      this.instances.set(instance.key, instance);
      if (instance.state.mode === 'sidebar') {
        this.ensureInSidebarOrder(instance.state.sidebarSide, instance.key);
      }
      const savedDockH = this.workspaceState?.dockHeights?.[instance.key];
      if (savedDockH && instance.state.dockHeight === 'auto') {
        instance.state.dockHeight = savedDockH;
      }
      this.emitter.emit('register', { key: instance.key, instance });
      if (config.openOnRegister) instance.open();
      this.syncTabGroups();
      this.syncSidebars();
      this.syncMobileDock();
      return instance;
    } catch (error) {
      this.reportError(error, { phase: 'register', key: normalized.key });
      throw error;
    }
  }

  resolve(key) {
    if (key instanceof CgoWindowInstance) return key;
    if (this.instances.has(key)) return this.instances.get(key);
    const matches = [...this.instances.values()].filter((instance) => instance.config.panelId === key);
    return matches.length === 1 ? matches[0] : null;
  }

  get(key) {
    return this.resolve(key) || null;
  }

  open(key, options) {
    return this.resolve(key)?.open(options) || null;
  }

  update(key, patch) {
    return this.resolve(key)?.update(patch) || false;
  }

  close(key) {
    return this.resolve(key)?.close() || false;
  }

  destroy(key) {
    return this.resolve(key)?.destroy() || false;
  }

  minimize(key) {
    return this.resolve(key)?.minimize() || false;
  }

  restore(key, options) {
    return this.resolve(key)?.restore(options) || false;
  }

  isMinimized(key) {
    return this.resolve(key)?.state.lifecycle === 'minimized';
  }

  setMode(key, mode, options) {
    return this.resolve(key)?.setMode(mode, options) || false;
  }

  bringToFront(key) {
    const inst = this.resolve(key);
    if (!inst) return false;
    const host = this.getGroupHost(inst.key);
    if (host && host !== inst) {
      this.setGroupActiveTab(host.key, inst.key);
      return host.bringToFront();
    }
    return inst.bringToFront();
  }

  setMobileDetent(key, detent) {
    return this.resolve(key)?.setMobileDetent(detent) || false;
  }

  getMobileDetent(key) {
    return this.resolve(key)?.state.mobileDetent || null;
  }

  destroyAll() {
    for (const instance of [...this.instances.values()]) instance.destroy();
  }

  configureRemote(handler) {
    this.remoteHandler = typeof handler === 'function' ? handler : null;
  }

  async openRemote(...args) {
    if (!this.host.remoteEnabled || !this.remoteHandler) return { ok: false, error: 'remote_disabled' };
    try {
      return await this.remoteHandler(...args);
    } catch (error) {
      this.reportError(error, { phase: 'openRemote', code: 'remote_failed' });
      return { ok: false, error: 'remote_failed' };
    }
  }

  nextZ(group = 'panel') {
    const hostBase = Number(this.host?.zBase?.[group]);
    const base = Number.isFinite(hostBase) ? hostBase : (Z_GROUP_BASE[group] ?? Z_GROUP_BASE.panel);
    const current = Math.max(base, this.zCounters.get(group) || base) + 1;
    this.zCounters.set(group, current);
    return current;
  }

  hasPersistedState(key) {
    const targetKey = this.resolve(key)?.key || key;
    return hasWindowState(this.storage, makeStorageKey(this.host.hostId, targetKey));
  }

  markWorkspaceInitialized() {
    if (!this.workspaceState) return;
    this.workspaceState.initialized = true;
    this.persistWorkspace();
  }

  persistWorkspace() {
    if (!this.workspaceState || !this.workspaceStorageKey) return;
    writeWorkspaceState(this.storage, this.workspaceStorageKey, this.workspaceState);
  }

  getWorkspaceSnapshot() {
    if (!this.workspaceState) return null;
    return {
      ...this.workspaceState,
      widths: { ...this.workspaceState.widths },
      order: { left: [...this.workspaceState.order.left], right: [...this.workspaceState.order.right] },
      dockHeights: { ...this.workspaceState.dockHeights },
      groups: this.workspaceState.groups.map((g) => ({ ...g, keys: [...g.keys] })),
      stacks: this.workspaceState.stacks.map((s) => ({ ...s, keys: [...s.keys] })),
    };
  }

  getMobileWorkspaceState() {
    return this.mobileWorkspaceState ? { ...this.mobileWorkspaceState } : null;
  }

  resetWorkspace(options = {}) {
    const preserveAddons = options.preserveAddons !== false;
    const hadExplicitAddons = this.addons?.hasExplicitSavedEnabled;
    this.workspaceState = readWorkspaceState(null, this.workspaceStorageKey, {
      widths: this.host.defaultSidebarWidth,
      minSidebarWidth: this.host.minSidebarWidth,
      maxSidebarWidth: this.host.maxSidebarWidth,
      order: this.host.defaultSidebarOrder,
    });
    this.userSelectedMobilePanel = false;
    this.mobileWorkspaceState = readMobileWorkspaceState(null, this.mobileWorkspaceStorageKey, {
      activeKey: this.host.mobileDefaultPanel || null,
      detent: this.host.mobileDefaultDetent || 'half',
    });
    clearHostStorage(this.storage, this.host.hostId);
    for (const inst of this.instances.values()) {
      inst.savedLifecycle = null;
    }
    if (preserveAddons && hadExplicitAddons) {
      this.addons.persistEnabledState();
    }
    this.syncTabGroups();
    this.syncSidebars();
    this.syncMobileDock();
    this.emitter.emit('workspaceReset', { hostId: this.host.hostId });
  }

  getWorkArea() {
    const viewport = viewportOf(this);
    const topInset = measureInset(this.documentRef, this.host?.workAreaInsets?.top);
    const bottomInset = measureInset(this.documentRef, this.host?.workAreaInsets?.bottom);
    const top = clamp(topInset, 0, Math.max(0, viewport.height - 64));
    const bottom = clamp(viewport.height - bottomInset, top + 64, viewport.height);
    const isDesktop = viewport.width > this.host.mobileBreakpoint;

    let left = 0;
    let right = viewport.width;
    if (isDesktop) {
      const leftSb = this.sidebars.get('left');
      if (leftSb?.slot && !leftSb.element.hidden && !leftSb.slot.hidden) {
        const lw = Math.round(
          leftSb.slot.getBoundingClientRect().right
          || leftSb.slot.offsetWidth
          || Number.parseFloat(leftSb.slot.style.width)
          || 0,
        );
        left = lw;
      }
      const rightSb = this.sidebars.get('right');
      if (rightSb?.slot && !rightSb.element.hidden && !rightSb.slot.hidden) {
        const rw = Math.round(
          rightSb.slot.offsetWidth
          || Number.parseFloat(rightSb.slot.style.width)
          || 0,
        );
        right = Math.max(left, viewport.width - rw);
      }
    }

    return {
      top,
      bottom,
      left,
      right,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    };
  }

  getSidebarWidth(side) {
    const safeSide = side === 'right' ? 'right' : 'left';
    return this.workspaceState?.widths?.[safeSide] ?? this.host.defaultSidebarWidth[safeSide];
  }

  setSidebarWidth(side, width) {
    const safeSide = side === 'right' ? 'right' : 'left';
    const viewport = viewportOf(this);
    const maxCap = Math.min(this.host.maxSidebarWidth, Math.max(this.host.minSidebarWidth, Math.floor(viewport.width * 0.45)));
    const nextWidth = Math.round(clamp(width, this.host.minSidebarWidth, maxCap));
    if (this.workspaceState) {
      this.workspaceState.widths[safeSide] = nextWidth;
    }
    const sb = this.sidebars.get(safeSide);
    if (sb) {
      if (sb.slot && !sb.slot.hidden) {
        sb.slot.style.width = `${nextWidth}px`;
      } else if (!sb.slot) {
        sb.element.style.width = `${nextWidth}px`;
      }
      this.root.style.setProperty(`--cwm-sidebar-${safeSide}-width`, `${nextWidth}px`);
    }
    this.emitter.emit('sidebarResize', { side: safeSide, width: nextWidth });
    return nextWidth;
  }

  setDockHeight(key, height) {
    if (!this.workspaceState) return;
    if (height === null || height === 'auto') {
      delete this.workspaceState.dockHeights[key];
    } else {
      this.workspaceState.dockHeights[key] = Math.round(Number(height));
    }
    this.persistWorkspace();
  }

  ensureInSidebarOrder(side, key) {
    if (!this.workspaceState) return;
    const safeSide = side === 'right' ? 'right' : 'left';
    const otherSide = safeSide === 'left' ? 'right' : 'left';
    this.workspaceState.order[otherSide] = this.workspaceState.order[otherSide].filter((item) => item !== key);
    if (!this.workspaceState.order[safeSide].includes(key)) {
      this.workspaceState.order[safeSide].push(key);
    }
    this.persistWorkspace();
  }

  removeFromSidebarOrder(side, key) {
    if (!this.workspaceState) return;
    const safeSide = side === 'right' ? 'right' : 'left';
    this.workspaceState.order[safeSide] = this.workspaceState.order[safeSide].filter((item) => item !== key);
    this.persistWorkspace();
  }

  insertInSidebarOrder(side, key, index = -1) {
    if (!this.workspaceState) return;
    const safeSide = side === 'right' ? 'right' : 'left';
    const otherSide = safeSide === 'left' ? 'right' : 'left';
    this.workspaceState.order[otherSide] = this.workspaceState.order[otherSide].filter((item) => item !== key);
    this.workspaceState.order[safeSide] = reorderKeyList(this.workspaceState.order[safeSide], key, index);
    this.persistWorkspace();
  }

  isSingleSidebarActive() {
    if (!this.initialized) return false;
    const maxW = Number(this.host?.singleSidebarMaxWidth) || 0;
    if (maxW <= 0) return false;
    const width = viewportOf(this).width;
    return width > this.host.mobileBreakpoint && width <= maxW;
  }

  getSidebarActiveWindows(side) {
    const safeSide = side === 'right' ? 'right' : 'left';
    const activeWindows = [...this.instances.values()].filter((inst) => {
      if (!['visible', 'minimized'].includes(inst.state.lifecycle)) return false;
      if (inst.state.effectiveMode !== 'sidebar' || inst.state.sidebarSide !== safeSide) return false;
      const host = this.getGroupHost(inst.key);
      return !host || host === inst;
    });

    const order = this.workspaceState?.order?.[safeSide] || [];
    activeWindows.sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return activeWindows;
  }

  getSidebarDisplayState(side) {
    const safeSide = side === 'right' ? 'right' : 'left';
    const sb = this.sidebars.get(safeSide);
    if (!sb || sb.element.hidden) return 'hidden';
    return sb.element.dataset.collapsed === 'rail' ? 'rail' : 'expanded';
  }

  activateSidebar(side, { persist = true } = {}) {
    if (!this.workspaceState) return false;
    const safeSide = side === 'right' ? 'right' : 'left';
    const otherSide = safeSide === 'left' ? 'right' : 'left';
    const prevSide = this.workspaceState.activeSidebarSide;
    const prevCollapsed = this.workspaceState.railCollapsed;
    this.workspaceState.activeSidebarSide = safeSide;
    this.workspaceState.railCollapsed = false;
    if (persist) this.persistWorkspace();
    this.hideRailTooltip();
    this.syncSidebars();
    this.emitter.emit('sidebarModeChange', {
      side: safeSide,
      previousSide: prevSide,
      otherSide,
      collapsed: false,
      previousCollapsed: prevCollapsed,
    });
    return true;
  }

  collapseSidebarToRail(side) {
    if (!this.workspaceState || !this.isSingleSidebarActive()) return false;
    const safeSide = side === 'right' ? 'right' : 'left';
    const prevCollapsed = this.workspaceState.railCollapsed;
    this.workspaceState.activeSidebarSide = safeSide;
    this.workspaceState.railCollapsed = true;
    this.persistWorkspace();
    this.hideRailTooltip();
    this.syncSidebars();
    this.emitter.emit('sidebarModeChange', {
      side: safeSide,
      collapsed: true,
      previousCollapsed: prevCollapsed,
    });
    return true;
  }

  focusSidebarPanel(key, { expandIfMinimized = true, scrollIntoView = true } = {}) {
    const inst = this.resolve(key);
    if (!inst || inst.state.lifecycle === 'destroyed') return false;

    const host = this.getGroupHost(inst.key) || inst;
    const side = host.state.sidebarSide === 'right' ? 'right' : 'left';
    if (host.state.mode !== 'sidebar') {
      host.setMode('sidebar', { side });
    }
    this.activateSidebar(side, { persist: true });

    if (host !== inst) {
      this.setGroupActiveTab(host.key, inst.key, { scrollIntoView: false });
    }
    if (['hidden', 'registered'].includes(host.state.lifecycle)) {
      host.open({ scrollIntoView: false });
    }
    if (expandIfMinimized && host.state.lifecycle === 'minimized') {
      host.restore({ scrollIntoView: false });
    } else if (expandIfMinimized && inst.state.lifecycle === 'minimized') {
      inst.restore({ scrollIntoView: false });
    }
    host.bringToFront();

    if (scrollIntoView) {
      this.scrollSidebarPanelIntoView(host, { mode: 'focus', highlight: true });
    }
    return true;
  }

  triggerRailFlash(targetEl) {
    if (!targetEl) return;
    if (this.railFlashTimer) {
      this.windowRef.clearTimeout?.(this.railFlashTimer);
      this.railFlashTimer = null;
    }
    if (this.railFlashEl && this.railFlashEl !== targetEl) {
      delete this.railFlashEl.dataset.railFlash;
    }
    this.railFlashEl = targetEl;
    delete targetEl.dataset.railFlash;
    void targetEl.offsetWidth;
    targetEl.dataset.railFlash = 'true';
    this.railFlashTimer = this.windowRef.setTimeout?.(() => {
      delete targetEl.dataset.railFlash;
      if (this.railFlashEl === targetEl) this.railFlashEl = null;
      this.railFlashTimer = null;
    }, 900);
  }

  waitForScrollFinish(scroller, scrollResult, seq) {
    if (scrollResult && typeof scrollResult.then === 'function') {
      return Promise.resolve(scrollResult).then(() => this.sidebarScrollSeq === seq);
    }
    if (!scroller || typeof scroller.addEventListener !== 'function') {
      return Promise.resolve(this.sidebarScrollSeq === seq);
    }
    const setTimer = this.windowRef.setTimeout?.bind(this.windowRef) || setTimeout;
    const clearTimer = this.windowRef.clearTimeout?.bind(this.windowRef) || clearTimeout;
    return new Promise((resolve) => {
      let settled = false;
      let timerId = null;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (timerId !== null) clearTimer(timerId);
        scroller.removeEventListener('scrollend', onScrollEnd);
        scroller.removeEventListener('scroll', onScroll);
        resolve(this.sidebarScrollSeq === seq);
      };
      const bumpIdleTimer = () => {
        if (timerId !== null) clearTimer(timerId);
        timerId = setTimer(finish, 120);
      };
      const onScrollEnd = () => finish();
      const onScroll = () => {
        if (this.sidebarScrollSeq !== seq) {
          finish();
          return;
        }
        bumpIdleTimer();
      };
      scroller.addEventListener('scrollend', onScrollEnd, { once: true });
      scroller.addEventListener('scroll', onScroll, { passive: true });
      bumpIdleTimer();
    });
  }

  scrollSidebarPanelIntoView(keyOrInst, { mode = 'reveal', highlight = false, animate = true } = {}) {
    const inst = typeof keyOrInst === 'string' ? this.resolve(keyOrInst) : keyOrInst;
    if (!inst || inst.state.lifecycle === 'destroyed') return false;
    const host = this.getGroupHost(inst.key) || inst;
    if (!host || host.element.hidden || host.state.effectiveMode !== 'sidebar' || host.state.lifecycle === 'hidden') {
      return false;
    }

    const side = host.state.sidebarSide === 'right' ? 'right' : 'left';
    const sb = this.sidebars.get(side);
    const body = sb?.body;
    if (!sb || !body || body.hidden || sb.element.hidden) return false;

    const bodyRect = body.getBoundingClientRect();
    const hostRect = host.element.getBoundingClientRect();
    const currentTop = Number(body.scrollTop) || 0;
    const viewHeight = body.clientHeight || bodyRect.height || 0;
    const maxScroll = Math.max(0, (body.scrollHeight || 0) - viewHeight);
    if (viewHeight <= 0) return false;

    const itemTop = hostRect.top - bodyRect.top + currentTop;
    const itemHeight = hostRect.height || 0;
    const itemBottom = itemTop + itemHeight;
    const margin = 6;

    let targetTop = currentTop;
    if (mode === 'focus') {
      if (itemTop < currentTop + margin || itemBottom > currentTop + viewHeight - margin) {
        targetTop = clamp(Math.round(itemTop - margin), 0, maxScroll);
      }
    } else if (itemTop < currentTop + margin) {
      targetTop = clamp(Math.round(itemTop - margin), 0, maxScroll);
    } else if (itemBottom + margin > currentTop + viewHeight) {
      const neededForBottom = itemBottom + margin - viewHeight;
      const maxTopKeepingHeader = Math.max(0, itemTop - margin);
      targetTop = clamp(Math.round(Math.min(neededForBottom, maxTopKeepingHeader)), 0, maxScroll);
    }

    const seq = ++this.sidebarScrollSeq;
    const reducedMotion = this.windowRef.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
    const behavior = animate !== false && !reducedMotion ? 'smooth' : 'auto';
    const needsScroll = Math.abs(targetTop - currentTop) >= 1;
    let scrollResult = null;
    if (needsScroll) {
      if (typeof body.scrollTo === 'function') {
        scrollResult = body.scrollTo({ top: targetTop, behavior });
      } else {
        body.scrollTop = targetTop;
      }
    }

    if (highlight) {
      if (needsScroll && behavior === 'smooth') {
        this.waitForScrollFinish(body, scrollResult, seq).then((stillLatest) => {
          if (stillLatest && !host.element.hidden && host.state.effectiveMode === 'sidebar') {
            this.triggerRailFlash(host.element);
          }
        });
      } else {
        this.triggerRailFlash(host.element);
      }
    }
    return true;
  }

  handleSidebarBodyWheel(event, side) {
    if (!event || event.defaultPrevented || event.ctrlKey) return;
    const rawY = Number(event.deltaY) || 0;
    const rawX = Number(event.deltaX) || 0;
    if (rawY === 0 || Math.abs(rawX) > Math.abs(rawY)) return;

    const sb = this.sidebars.get(side === 'right' ? 'right' : 'left');
    const body = sb?.body;
    if (!sb || !body || body.hidden || (body.scrollHeight || 0) <= (body.clientHeight || 0) + 1) return;

    let deltaPx = rawY;
    if (event.deltaMode === 1) deltaPx *= 16;
    else if (event.deltaMode === 2) deltaPx *= body.clientHeight || 400;
    if (!Number.isFinite(deltaPx) || Math.abs(deltaPx) < 0.1) return;

    let innerScroller = null;
    let node = event.target;
    while (node && node !== body) {
      if (node.nodeType === 1 && (node.scrollHeight || 0) > (node.clientHeight || 0) + 1) {
        let overflowY = node.style?.overflowY || '';
        if (!overflowY && typeof this.windowRef.getComputedStyle === 'function') {
          try {
            const computed = this.windowRef.getComputedStyle(node);
            overflowY = computed?.overflowY || computed?.getPropertyValue?.('overflow-y') || '';
          } catch {
            overflowY = '';
          }
        }
        if (/(auto|scroll|overlay)/.test(overflowY) || (!overflowY && node.classList?.contains?.('cgowm-content'))) {
          innerScroller = node;
          break;
        }
      }
      node = node.parentElement || node.parentNode;
    }

    if (!innerScroller) return;

    const dir = deltaPx > 0 ? 1 : -1;
    const mag = Math.abs(deltaPx);
    const innerMax = Math.max(0, (innerScroller.scrollHeight || 0) - (innerScroller.clientHeight || 0));
    const innerCur = clamp(Number(innerScroller.scrollTop) || 0, 0, innerMax);
    const innerRemain = dir > 0 ? Math.max(0, innerMax - innerCur) : Math.max(0, innerCur);
    if (innerRemain >= mag - 0.5) return;

    const outerMax = Math.max(0, (body.scrollHeight || 0) - (body.clientHeight || 0));
    const outerCur = clamp(Number(body.scrollTop) || 0, 0, outerMax);
    const outerRemain = dir > 0 ? Math.max(0, outerMax - outerCur) : Math.max(0, outerCur);
    if (outerRemain <= 0.5) return;

    if (innerRemain > 0) {
      innerScroller.scrollTop = clamp(innerCur + dir * innerRemain, 0, innerMax);
    }
    const spillover = mag - innerRemain;
    if (spillover > 0) {
      body.scrollTop = clamp(outerCur + dir * spillover, 0, outerMax);
    }
    event.preventDefault?.();
  }

  ensureRailTooltip() {
    if (this.railTooltip?.isConnected) return this.railTooltip;
    const tip = this.documentRef.createElement('div');
    tip.className = 'cgowm-rail-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    this.root.appendChild(tip);
    this.railTooltip = tip;
    return tip;
  }

  showRailTooltip(targetEl, label, side) {
    if (!targetEl || !label) return;
    const tip = this.ensureRailTooltip();
    tip.textContent = label;
    tip.dataset.side = side === 'right' ? 'right' : 'left';
    tip.hidden = false;

    const rect = targetEl.getBoundingClientRect();
    const viewport = viewportOf(this);
    const centerY = Math.round(rect.top + rect.height / 2);
    tip.style.top = `${clamp(centerY, 24, Math.max(24, viewport.height - 24))}px`;
    if (side === 'right') {
      tip.style.left = '';
      tip.style.right = `${Math.max(SIDEBAR_RAIL_WIDTH + 8, Math.round(viewport.width - rect.left + 8))}px`;
    } else {
      tip.style.right = '';
      tip.style.left = `${Math.max(SIDEBAR_RAIL_WIDTH + 8, Math.round(rect.right + 8))}px`;
    }
  }

  hideRailTooltip() {
    if (this.railTooltip) {
      this.railTooltip.hidden = true;
    }
  }

  ensureSidebar(side) {
    const safeSide = side === 'right' ? 'right' : 'left';
    if (this.sidebars.has(safeSide)) return this.sidebars.get(safeSide);

    const doc = this.documentRef;
    const slot = resolveElement(doc, this.host.sidebarTargets?.[safeSide]);
    const element = doc.createElement('aside');
    element.id = `cgowm-sidebar-${safeSide}`;
    element.className = 'cgowm-sidebar';
    element.dataset.side = safeSide;
    element.dataset.mount = slot ? 'flow' : 'fixed';
    element.dataset.collapsed = 'false';
    element.setAttribute('aria-label', `${safeSide === 'left' ? '左侧' : '右侧'}窗口栏`);

    const topbar = doc.createElement('div');
    topbar.className = 'cgowm-sidebar-topbar';
    topbar.hidden = true;

    const topbarTitle = doc.createElement('span');
    topbarTitle.className = 'cgowm-sidebar-topbar-title';
    topbarTitle.textContent = safeSide === 'left' ? '工具面板' : '加载项栏';

    const topbarActions = doc.createElement('div');
    topbarActions.className = 'cgowm-sidebar-topbar-actions';

    const switchBtn = createButton(
      this,
      'cgowm-sidebar-switch-btn',
      safeSide === 'left' ? '切换至右侧栏' : '切换至左侧栏',
      'reverse',
      13,
    );
    switchBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.activateSidebar(safeSide === 'left' ? 'right' : 'left', { persist: true });
    });

    const collapseBtn = createButton(
      this,
      'cgowm-sidebar-collapse-btn',
      '收起为图标栏',
      safeSide === 'left' ? 'chevron-left' : 'chevron-right',
      14,
    );
    collapseBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.collapseSidebarToRail(safeSide);
    });

    topbarActions.append(switchBtn, collapseBtn);
    topbar.append(topbarTitle, topbarActions);

    const body = doc.createElement('div');
    body.className = 'cgowm-sidebar-body';
    body.addEventListener('wheel', (event) => this.handleSidebarBodyWheel(event, safeSide), { passive: false });

    const rail = doc.createElement('div');
    rail.className = 'cgowm-sidebar-rail';
    rail.dataset.side = safeSide;
    rail.hidden = true;

    const railExpandBtn = createButton(
      this,
      'cgowm-rail-toggle',
      safeSide === 'left' ? '展开左侧工具栏' : '展开右侧工具栏',
      safeSide === 'left' ? 'chevron-right' : 'chevron-left',
      14,
    );
    railExpandBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.activateSidebar(safeSide, { persist: true });
    });

    const railItems = doc.createElement('div');
    railItems.className = 'cgowm-rail-items';
    railItems.setAttribute('role', 'toolbar');
    railItems.setAttribute('aria-label', `${safeSide === 'left' ? '左侧' : '右侧'}已收起面板快捷图标`);

    rail.append(railExpandBtn, railItems);
    element.append(topbar, body, rail);

    let resizer = null;
    if (this.host.sidebarResizable) {
      resizer = doc.createElement('div');
      resizer.className = 'cgowm-sidebar-resizer';
      resizer.dataset.side = safeSide;
      resizer.setAttribute('role', 'separator');
      resizer.setAttribute('aria-orientation', 'vertical');
      resizer.setAttribute('aria-label', `调节${safeSide === 'left' ? '左' : '右'}侧边栏宽度`);
      resizer.addEventListener('pointerdown', (event) => this.startSidebarResize(event, safeSide));
      element.appendChild(resizer);
    }

    if (slot) {
      slot.classList.add('cgowm-dock-slot');
      slot.dataset.side = safeSide;
      slot.appendChild(element);
    } else {
      this.root.appendChild(element);
    }

    const result = {
      element,
      topbar,
      switchBtn,
      collapseBtn,
      body,
      rail,
      railExpandBtn,
      railItems,
      slot,
      resizer,
    };
    this.sidebars.set(safeSide, result);
    return result;
  }

  startSidebarResize(event, side) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const sb = this.sidebars.get(side);
    if (!sb) return;
    const startWidth = (sb.slot || sb.element).getBoundingClientRect().width || this.getSidebarWidth(side);
    this.sidebarResizeSession = { side, startX: event.clientX, startWidth };
    this.setAllIframeBlockers(true);
    sb.element.dataset.resizing = 'true';
    this.documentRef.body.dataset.cgowmResizingSidebar = side;

    const doc = this.documentRef;
    this.boundSidebarResizeMove = (moveEvent) => {
      const session = this.sidebarResizeSession;
      if (!session) return;
      moveEvent.preventDefault();
      const delta = moveEvent.clientX - session.startX;
      const rawWidth = session.side === 'left' ? session.startWidth + delta : session.startWidth - delta;
      this.setSidebarWidth(session.side, rawWidth);
    };
    this.boundSidebarResizeEnd = () => {
      if (!this.sidebarResizeSession) return;
      const doneSide = this.sidebarResizeSession.side;
      doc.removeEventListener('pointermove', this.boundSidebarResizeMove);
      doc.removeEventListener('pointerup', this.boundSidebarResizeEnd);
      doc.removeEventListener('pointercancel', this.boundSidebarResizeEnd);
      this.sidebarResizeSession = null;
      delete sb.element.dataset.resizing;
      delete this.documentRef.body.dataset.cgowmResizingSidebar;
      this.setAllIframeBlockers(false);
      this.persistWorkspace();
      this.emitter.emit('layoutChange', { side: doneSide, width: this.getSidebarWidth(doneSide) });
    };
    doc.addEventListener('pointermove', this.boundSidebarResizeMove, { passive: false });
    doc.addEventListener('pointerup', this.boundSidebarResizeEnd);
    doc.addEventListener('pointercancel', this.boundSidebarResizeEnd);
  }

  renderSidebarRailItems(side, sb, activeWindows) {
    const doc = this.documentRef;
    const buttons = [];

    const appendMemberButton = (member, host) => {
      const isExpanded = host.state.lifecycle === 'visible'
        && (host === member || this.getGroupActiveKey(host.key) === member.key);
      const isUnavailable = Boolean(member.config.unavailable);
      const label = member.config.title || member.config.shortTitle || member.config.panelId;
      const unavailableSuffix = isUnavailable ? `（${member.config.badge || '当前不可用'}）` : '';
      const statusSuffix = isExpanded ? '（已展开，点击切换并滚动定位）' : '（已折叠，点击切出并展开）';

      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = `cgowm-rail-btn${isExpanded ? ' is-expanded' : ''}${isUnavailable ? ' is-unavailable' : ''}`;
      btn.dataset.cgowmKey = member.key;
      btn.setAttribute('aria-label', `${label}${unavailableSuffix}${statusSuffix}`);
      btn.title = `${label}${unavailableSuffix}`;

      const iconWrap = doc.createElement('span');
      iconWrap.className = 'cgowm-rail-btn-icon';
      member.renderIconVisual(iconWrap, member.config.icon || 'plugin', 16);
      btn.appendChild(iconWrap);

      btn.addEventListener('mouseenter', () => this.showRailTooltip(btn, `${label}${unavailableSuffix}`, side));
      btn.addEventListener('focus', () => this.showRailTooltip(btn, `${label}${unavailableSuffix}`, side));
      btn.addEventListener('mouseleave', () => this.hideRailTooltip());
      btn.addEventListener('blur', () => this.hideRailTooltip());
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        this.hideRailTooltip();
        this.focusSidebarPanel(member.key, { expandIfMinimized: true, scrollIntoView: true });
      });

      buttons.push(btn);
    };

    for (const host of activeWindows) {
      const group = this.getGroupForWindow(host.key);
      if (group) {
        const members = group.keys
          .map((itemKey) => this.get(itemKey))
          .filter((inst) => inst && ['visible', 'minimized'].includes(inst.state.lifecycle));
        if (members.length >= 2) {
          members.forEach((member) => appendMemberButton(member, host));
          continue;
        }
      }
      appendMemberButton(host, host);
    }

    sb.railItems.replaceChildren(...buttons);
  }

  syncSidebars() {
    if (!this.initialized) return;
    const viewport = viewportOf(this);
    const isMobile = viewport.width <= this.host.mobileBreakpoint;
    const singleMode = !isMobile && this.isSingleSidebarActive();

    const sideData = {};
    for (const side of ['left', 'right']) {
      const hasTarget = Boolean(this.host.sidebarTargets?.[side]);
      if (!this.sidebars.has(side) && !hasTarget) {
        sideData[side] = null;
        continue;
      }
      const sb = this.ensureSidebar(side);
      const activeWindows = this.getSidebarActiveWindows(side);

      const orderedElements = activeWindows.map((inst) => inst.element);
      const activeElements = new Set(orderedElements);
      for (const child of [...sb.body.children]) {
        if (child.classList?.contains('cgowm-window') && !activeElements.has(child)) {
          moveElementBefore(this.root, child, null);
        }
      }

      reconcileSidebarWindows(sb.body, orderedElements);

      sideData[side] = { sb, activeWindows };
    }

    const leftCount = sideData.left?.activeWindows.length || 0;
    const rightCount = sideData.right?.activeWindows.length || 0;
    const activeSide = this.workspaceState?.activeSidebarSide === 'right' ? 'right' : 'left';
    const userRailCollapsed = Boolean(this.workspaceState?.railCollapsed);

    const resolvedState = { left: 'hidden', right: 'hidden' };
    if (!isMobile) {
      if (!singleMode) {
        resolvedState.left = leftCount > 0 ? 'expanded' : 'hidden';
        resolvedState.right = rightCount > 0 ? 'expanded' : 'hidden';
      } else {
        if (leftCount > 0 && rightCount > 0) {
          if (userRailCollapsed) {
            resolvedState.left = 'rail';
            resolvedState.right = 'rail';
          } else {
            resolvedState[activeSide] = 'expanded';
            resolvedState[activeSide === 'left' ? 'right' : 'left'] = 'rail';
          }
        } else if (leftCount > 0) {
          resolvedState.left = (userRailCollapsed && activeSide === 'left') ? 'rail' : 'expanded';
        } else if (rightCount > 0) {
          resolvedState.right = (userRailCollapsed && activeSide === 'right') ? 'rail' : 'expanded';
        }
      }
    }

    for (const side of ['left', 'right']) {
      const data = sideData[side];
      if (!data) continue;
      const { sb, activeWindows } = data;
      const otherSide = side === 'left' ? 'right' : 'left';
      const otherCount = otherSide === 'left' ? leftCount : rightCount;
      const displayState = resolvedState[side];

      if (displayState === 'hidden') {
        sb.element.hidden = true;
        delete sb.element.dataset.collapsed;
        sb.topbar.hidden = true;
        sb.rail.hidden = true;
        sb.body.hidden = false;
        if (sb.resizer) sb.resizer.hidden = true;
        if (sb.slot) {
          sb.slot.hidden = true;
          sb.slot.dataset.empty = 'true';
          sb.slot.dataset.collapsed = 'false';
          sb.slot.style.width = '';
        }
        this.root.style.removeProperty(`--cwm-sidebar-${side}-width`);
        continue;
      }

      sb.element.hidden = false;
      if (sb.slot) {
        sb.slot.hidden = false;
        sb.slot.dataset.empty = 'false';
      }

      if (displayState === 'rail') {
        sb.element.dataset.collapsed = 'rail';
        if (sb.slot) sb.slot.dataset.collapsed = 'rail';
        sb.topbar.hidden = true;
        sb.body.hidden = true;
        sb.rail.hidden = false;
        if (sb.resizer) sb.resizer.hidden = true;
        this.renderSidebarRailItems(side, sb, activeWindows);

        const railW = `${SIDEBAR_RAIL_WIDTH}px`;
        if (sb.slot) {
          sb.slot.style.width = railW;
        } else {
          sb.element.style.width = railW;
        }
        this.root.style.setProperty(`--cwm-sidebar-${side}-width`, railW);
        continue;
      }

      // displayState === 'expanded'
      sb.element.dataset.collapsed = 'false';
      if (sb.slot) sb.slot.dataset.collapsed = 'false';
      sb.body.hidden = false;
      sb.rail.hidden = true;
      sb.topbar.hidden = !singleMode;
      sb.switchBtn.hidden = otherCount === 0;
      if (sb.resizer) sb.resizer.hidden = !this.host.sidebarResizable;

      const baseWidth = this.getSidebarWidth(side);
      const effectiveWidth = singleMode
        ? Math.min(baseWidth, Math.max(this.host.minSidebarWidth, Math.floor(viewport.width * 0.44)))
        : baseWidth;

      if (sb.slot) {
        sb.slot.style.width = `${effectiveWidth}px`;
        this.root.style.setProperty(`--cwm-sidebar-${side}-width`, `${effectiveWidth}px`);
      } else if (this.host.sidebarResizable) {
        sb.element.style.width = `${effectiveWidth}px`;
        this.root.style.setProperty(`--cwm-sidebar-${side}-width`, `${effectiveWidth}px`);
      }
    }

    const nextTier = isMobile ? 'mobile' : (singleMode ? 'single-sidebar' : 'desktop');
    const prevTier = this.lastViewportTier;
    this.lastViewportTier = nextTier;
    if (this.root?.dataset) {
      this.root.dataset.cgowmViewport = nextTier;
      this.root.dataset.unifiedMobile = this.isUnifiedMobileActive() ? 'true' : 'false';
    }
    this.documentRef?.documentElement?.setAttribute?.('data-cgowm-mobile', isMobile ? 'true' : 'false');

    if (isMobile || (!sideData.left && !sideData.right)) {
      this.hideRailTooltip();
    }
    if (prevTier && prevTier !== nextTier) {
      this.emitter.emit('viewportModeChange', {
        tier: nextTier,
        previousTier: prevTier,
        isMobile,
        singleSidebarMode: singleMode,
        viewport,
      });
    }
    this.emitter.emit('layoutChange', {
      sidebars: true,
      singleSidebarMode: singleMode,
      leftState: resolvedState.left,
      rightState: resolvedState.right,
    });
  }

  setAllIframeBlockers(blocked) {
    if (blocked) {
      this.documentRef.body?.setAttribute?.('data-cgowm-dragging', 'true');
    } else {
      this.documentRef.body?.removeAttribute?.('data-cgowm-dragging');
    }
    for (const inst of this.instances.values()) {
      if (inst.iframeBlocker) inst.iframeBlocker.hidden = !blocked;
    }
  }

  getVisibleFloatingRects(excludeKeys = new Set()) {
    const rects = [];
    for (const inst of this.instances.values()) {
      if (excludeKeys.has(inst.key)) continue;
      if (inst.state.effectiveMode !== 'float' || inst.element.hidden || ['hidden', 'destroyed'].includes(inst.state.lifecycle)) continue;
      const rect = inst.element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        rects.push({ key: inst.key, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height });
      }
    }
    return rects;
  }

  // ==================== 多标签组合（Tab Group） ====================

  getGroupForWindow(key) {
    return this.workspaceState?.groups?.find((group) => group.keys.includes(key)) || null;
  }

  isWindowGrouped(key) {
    return Boolean(this.getGroupForWindow(key));
  }

  getGroupHost(key) {
    const group = this.getGroupForWindow(key);
    if (!group) return null;
    const members = group.keys
      .map((itemKey) => this.get(itemKey))
      .filter((inst) => inst && !['hidden', 'destroyed', 'registered'].includes(inst.state.lifecycle));
    return members.length >= 2 ? members[0] : null;
  }

  getGroupActiveKey(hostKey) {
    const group = this.getGroupForWindow(hostKey);
    if (!group) return hostKey;
    return group.activeKey;
  }

  groupWindows(targetKey, incomingKey) {
    const target = this.get(targetKey);
    const incoming = this.get(incomingKey);
    if (!target || !incoming || target === incoming) return false;
    if (!target.config.groupable || !incoming.config.groupable) return false;
    if (!this.workspaceState) return false;

    const targetHost = this.getGroupHost(target.key) || target;
    const desiredMode = targetHost.state.mode;
    const desiredSide = targetHost.state.sidebarSide;

    // 从原本所在串联栈移除待合入窗口
    this.detachWindowFromStack(incoming.key, { sync: false });

    this.workspaceState.groups = mergeWindowIntoGroup(
      this.workspaceState.groups,
      targetHost.key,
      incoming.key,
      () => `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    );

    if (incoming.state.mode !== desiredMode || incoming.state.sidebarSide !== desiredSide) {
      incoming.state.mode = desiredMode;
      incoming.state.sidebarSide = desiredSide;
      if (desiredMode === 'sidebar') this.ensureInSidebarOrder(desiredSide, incoming.key);
      else this.removeFromSidebarOrder(incoming.state.sidebarSide, incoming.key);
      incoming.applyResponsiveMode();
    }
    if (targetHost.state.lifecycle === 'minimized') {
      targetHost.restore();
    }

    this.syncTabGroups();
    this.syncSidebars();
    this.reflowStacks();
    this.persistWorkspace();
    targetHost.persist();
    incoming.persist();
    targetHost.bringToFront();
    this.emitter.emit('groupChange', { groups: this.workspaceState.groups });
    return true;
  }

  ungroupWindow(key) {
    return this.removeWindowFromGroup(key, { sync: true });
  }

  removeWindowFromGroup(key, { sync = true } = {}) {
    if (!this.workspaceState) return false;
    const had = this.isWindowGrouped(key);
    if (!had) return false;
    this.workspaceState.groups = removeWindowFromGroups(this.workspaceState.groups, key);
    if (sync) {
      this.syncTabGroups();
      this.syncSidebars();
      this.persistWorkspace();
      this.emitter.emit('groupChange', { groups: this.workspaceState.groups });
    }
    return true;
  }

  detachTabWindow(tabKey, clientX, clientY) {
    const inst = this.get(tabKey);
    if (!inst) return null;
    const host = this.getGroupHost(tabKey);
    const hostRect = host?.element.getBoundingClientRect();

    this.removeWindowFromGroup(tabKey, { sync: false });

    const workArea = this.getWorkArea();
    const width = inst.state.width || inst.config.defaultWidth;
    inst.state.mode = 'float';
    inst.state.lifecycle = 'visible';
    inst.state.x = clamp(Math.round(clientX - width / 2), 0, Math.max(0, workArea.viewportWidth - width));
    inst.state.y = clamp(Math.round(clientY - 14), workArea.top, Math.max(workArea.top, workArea.bottom - 48));
    if (hostRect && hostRect.width >= inst.config.minWidth && host?.state.effectiveMode === 'float') {
      inst.state.width = Math.round(hostRect.width);
    }

    inst.element.hidden = false;
    inst.element.classList.remove('cgowm-minimized');
    inst.contentElement.hidden = false;
    this.restoreOwnContentShell(inst);
    inst.applyResponsiveMode();
    this.syncTabGroups();
    this.syncSidebars();
    this.persistWorkspace();
    inst.persist();
    this.emitter.emit('groupChange', { groups: this.workspaceState.groups });
    return inst;
  }

  setGroupActiveTab(hostKey, tabKey, options = {}) {
    const group = this.getGroupForWindow(hostKey) || this.getGroupForWindow(tabKey);
    if (!group || !group.keys.includes(tabKey)) return false;
    group.activeKey = tabKey;
    this.syncTabGroups();
    this.reflowStacks();
    this.persistWorkspace();
    this.emitter.emit('tabChange', { groupId: group.id, activeKey: tabKey });
    if (options.scrollIntoView !== false) {
      const host = this.getGroupHost(hostKey) || this.get(hostKey);
      if (host?.state.effectiveMode === 'sidebar' && host.state.lifecycle === 'visible') {
        this.scrollSidebarPanelIntoView(host, { mode: 'reveal' });
      }
    }
    return true;
  }

  moveGroupMembersMode(hostKey, mode, side) {
    const group = this.getGroupForWindow(hostKey);
    if (!group) return;
    for (const memberKey of group.keys) {
      if (memberKey === hostKey) continue;
      const member = this.get(memberKey);
      if (!member) continue;
      const prevSide = member.state.sidebarSide;
      member.state.mode = mode;
      if (side === 'left' || side === 'right') member.state.sidebarSide = side;
      if (mode === 'sidebar') {
        this.ensureInSidebarOrder(member.state.sidebarSide, member.key);
        if (prevSide && prevSide !== member.state.sidebarSide) {
          this.removeFromSidebarOrder(prevSide, member.key);
        }
      } else {
        this.removeFromSidebarOrder(prevSide, member.key);
      }
      member.applyResponsiveMode();
      member.persist();
    }
  }

  restoreOwnContentShell(inst) {
    if (!inst || inst.state.lifecycle === 'destroyed') return;
    if (this.mobileDock?.hostedKey === inst.key && this.isUnifiedMobileActive()) return;
    const firstResizer = inst.element.querySelector(':scope > .cgowm-resizer');
    if (inst.contentElement.parentNode !== inst.element) {
      moveElementBefore(inst.element, inst.contentElement, firstResizer);
    }
    delete inst.element.dataset.grouped;
    delete inst.element.dataset.groupedHost;
    inst.dragHandle.hidden = false;
    inst.tabstrip.hidden = true;
    if (inst.tabstrip.childNodes.length > 0) inst.tabstrip.replaceChildren();
    inst.contentElement.hidden = inst.state.lifecycle === 'minimized' && inst.resolveMinimizeMode() === 'collapse';
    if (!['hidden', 'destroyed', 'registered'].includes(inst.state.lifecycle) && inst.state.effectiveMode !== 'none') {
      inst.element.hidden = false;
    }
  }

  syncTabGroups() {
    if (!this.workspaceState || this.isUnifiedMobileActive()) return;
    const activeHostedContentOwners = new Set();

    for (const group of this.workspaceState.groups) {
      const members = group.keys
        .map((key) => this.get(key))
        .filter((inst) => inst && !['hidden', 'destroyed', 'registered'].includes(inst.state.lifecycle));
      if (members.length < 2) continue;

      const host = members[0];
      if (!members.some((m) => m.key === group.activeKey)) {
        group.activeKey = host.key;
      }
      const collapsed = host.state.lifecycle === 'minimized';
      host.element.dataset.grouped = 'true';
      delete host.element.dataset.groupedHost;
      if (host.state.effectiveMode !== 'none') host.element.hidden = false;
      host.dragHandle.hidden = true;
      host.tabstrip.hidden = false;

      const doc = this.documentRef;
      const tabs = [];

      const firstResizer = host.element.querySelector(':scope > .cgowm-resizer');
      for (const member of members) {
        activeHostedContentOwners.add(member.key);
        const isActive = member.key === group.activeKey;
        if (member !== host) {
          member.element.hidden = true;
          member.element.dataset.groupedHost = host.key;
          delete member.element.dataset.grouped;
        }
        if (member.contentElement.parentNode !== host.element) {
          moveElementBefore(host.element, member.contentElement, firstResizer);
        }
        member.contentElement.hidden = collapsed || !isActive;

        const tab = doc.createElement('button');
        tab.type = 'button';
        const isUnavailable = Boolean(member.config.unavailable);
        tab.className = `cgowm-tab${isActive ? ' is-active' : ''}${isUnavailable ? ' is-unavailable' : ''}`;
        tab.dataset.tabKey = member.key;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        const baseTitle = member.config.title || member.config.panelId;
        tab.title = isUnavailable && member.config.badge ? `${baseTitle}（${member.config.badge}）` : baseTitle;

        if (member.config.icon) {
          const iconSpan = doc.createElement('span');
          iconSpan.className = 'cgowm-tab-icon';
          member.renderIconVisual(iconSpan, member.config.icon, 13);
          if (!iconSpan.hidden) tab.appendChild(iconSpan);
        }
        const label = doc.createElement('span');
        label.className = 'cgowm-tab-label';
        label.textContent = member.config.shortTitle || member.config.title || member.config.panelId;
        tab.appendChild(label);

        if (member.config.showClose) {
          const closeIcon = doc.createElement('span');
          closeIcon.className = 'cgowm-tab-close';
          closeIcon.setAttribute('role', 'button');
          closeIcon.setAttribute('aria-label', `关闭 ${label.textContent}`);
          renderCgoIcon(this, closeIcon, 'close', 11);
          closeIcon.hidden = false;
          tab.appendChild(closeIcon);
        }
        tabs.push(tab);
      }
      host.tabstrip.replaceChildren(...tabs);
    }

    for (const inst of this.instances.values()) {
      if (!activeHostedContentOwners.has(inst.key)) {
        this.restoreOwnContentShell(inst);
      }
    }
  }

  // ==================== 纵向串联吸附栈（Floating Stack） ====================

  getStackForWindow(key) {
    return this.workspaceState?.stacks?.find((stack) => stack.keys.includes(key)) || null;
  }

  attachWindowToStack(topKey, bottomKey) {
    const topInst = this.get(topKey);
    const bottomInst = this.get(bottomKey);
    if (!topInst || !bottomInst || !this.workspaceState) return false;
    if (!topInst.config.groupable || !bottomInst.config.groupable) return false;
    this.workspaceState.stacks = attachWindowToStack(
      this.workspaceState.stacks,
      topKey,
      bottomKey,
      () => `stack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    );
    bottomInst.state.x = topInst.state.x;
    bottomInst.state.width = topInst.state.width;
    bottomInst.applyGeometry();
    this.reflowStacks();
    this.persistWorkspace();
    this.emitter.emit('stackChange', { stacks: this.workspaceState.stacks });
    return true;
  }

  detachWindowFromStack(key, { sync = true } = {}) {
    if (!this.workspaceState) return false;
    const had = Boolean(this.getStackForWindow(key));
    if (!had) return false;
    this.workspaceState.stacks = detachWindowFromStacks(this.workspaceState.stacks, key);
    if (sync) {
      this.reflowStacks();
      this.persistWorkspace();
      this.emitter.emit('stackChange', { stacks: this.workspaceState.stacks });
    }
    return true;
  }

  reflowStacks() {
    if (!this.workspaceState) return;
    for (const stack of this.workspaceState.stacks) {
      const members = stack.keys
        .map((key) => this.get(key))
        .filter((inst) => inst && inst.state.effectiveMode === 'float' && !inst.element.hidden && !['hidden', 'destroyed'].includes(inst.state.lifecycle));
      if (members.length < 2) continue;
      let cursorY = members[0].state.y + members[0].element.getBoundingClientRect().height;
      const baseX = members[0].state.x;
      const baseW = members[0].state.width;
      for (let i = 1; i < members.length; i += 1) {
        const inst = members[i];
        inst.state.x = baseX;
        inst.state.y = Math.round(cursorY);
        inst.state.width = baseW;
        inst.applyGeometry();
        cursorY = inst.state.y + inst.element.getBoundingClientRect().height;
      }
    }
  }

  // ==================== 拖拽热区、插入线与组合提示 ====================

  detectSidebarDropZone(clientX, clientY, draggingInstance) {
    if (!draggingInstance?.config.allowModes.includes('sidebar')) return null;
    const viewport = viewportOf(this);
    if (viewport.width <= this.host.mobileBreakpoint) return null;
    const hotZone = Math.max(this.host.hotZone ?? DEFAULT_HOT_ZONE, 28);

    const leftSb = this.sidebars.get('left');
    const leftVisible = Boolean(leftSb && !leftSb.element.hidden);
    const leftRect = leftVisible ? leftSb.element.getBoundingClientRect() : null;

    if (leftVisible && leftRect && clientX <= leftRect.right) {
      const insertIndex = this.computeSidebarInsertIndex('left', clientY, draggingInstance.key);
      return { side: 'left', insertIndex, rect: leftRect };
    }
    if (!leftVisible && clientX <= hotZone) {
      return { side: 'left', insertIndex: -1, rect: null };
    }

    const rightSb = this.sidebars.get('right');
    const rightVisible = Boolean(rightSb && !rightSb.element.hidden);
    const rightRect = rightVisible ? rightSb.element.getBoundingClientRect() : null;

    if (rightVisible && rightRect && clientX >= rightRect.left) {
      const insertIndex = this.computeSidebarInsertIndex('right', clientY, draggingInstance.key);
      return { side: 'right', insertIndex, rect: rightRect };
    }
    if (!rightVisible && clientX >= viewport.width - hotZone) {
      return { side: 'right', insertIndex: -1, rect: null };
    }
    return null;
  }

  computeSidebarInsertIndex(side, clientY, excludeKey) {
    const sb = this.sidebars.get(side);
    if (!sb) return -1;
    if (sb.element.dataset.collapsed === 'rail') {
      const items = [...sb.railItems.querySelectorAll('.cgowm-rail-btn')]
        .filter((el) => el.dataset.cgowmKey !== excludeKey);
      for (let i = 0; i < items.length; i += 1) {
        const rect = items[i].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
          return i;
        }
      }
      return items.length;
    }
    const children = [...sb.body.querySelectorAll(':scope > .cgowm-window')]
      .filter((el) => el.dataset.cgowmKey !== excludeKey && !el.hidden);
    for (let i = 0; i < children.length; i += 1) {
      const rect = children[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return i;
      }
    }
    return children.length;
  }

  findSidebarDropTarget(draggingInstance, side, clientX, clientY) {
    const sb = this.sidebars.get(side);
    if (!sb) return { groupTargetKey: null, insertIndex: -1 };
    const children = [...sb.body.querySelectorAll(':scope > .cgowm-window')]
      .filter((el) => el.dataset.cgowmKey !== draggingInstance.key && !el.hidden);

    // 若悬停在另一个可组合百叶窗的标题栏中心区域，提示标签合并
    if (draggingInstance.config.groupable) {
      for (const el of children) {
        const target = this.get(el.dataset.cgowmKey);
        if (!target || !target.config.groupable) continue;
        const titleRect = target.titlebar.getBoundingClientRect();
        if (
          clientX >= titleRect.left + 8 && clientX <= titleRect.right - 8
          && clientY >= titleRect.top + 4 && clientY <= titleRect.bottom - 4
        ) {
          target.element.dataset.groupDrop = 'tab';
          this.hideSidebarDropIndicator();
          return { groupTargetKey: target.key, insertIndex: -1 };
        }
      }
    }

    const insertIndex = this.computeSidebarInsertIndex(side, clientY, draggingInstance.key);
    this.showSidebarDropIndicator(sb, children, insertIndex);
    return { groupTargetKey: null, insertIndex };
  }

  showSidebarDropIndicator(sb, children, insertIndex) {
    if (!this.sidebarDropIndicator) {
      this.sidebarDropIndicator = this.documentRef.createElement('div');
      this.sidebarDropIndicator.className = 'cgowm-dock-drop-indicator';
    }
    const indicator = this.sidebarDropIndicator;
    indicator.hidden = false;
    if (insertIndex >= 0 && insertIndex < children.length) {
      sb.body.insertBefore(indicator, children[insertIndex]);
    } else {
      sb.body.appendChild(indicator);
    }
  }

  hideSidebarDropIndicator() {
    if (this.sidebarDropIndicator) {
      this.sidebarDropIndicator.hidden = true;
      this.sidebarDropIndicator.remove();
    }
  }

  updateFloatingDropTargets(draggingInstance, clientX, clientY, excludeKeys = new Set()) {
    this.clearDropTargets();
    if (!draggingInstance.config.groupable) return { groupTargetKey: null, stackTargetKey: null };

    const candidates = [...this.instances.values()].filter((inst) => (
      !excludeKeys.has(inst.key)
      && inst.config.groupable
      && !inst.element.hidden
      && ['visible', 'minimized'].includes(inst.state.lifecycle)
      && ['float', 'sidebar'].includes(inst.state.effectiveMode)
    ));

    // 1) 检查是否悬停在某面板标题栏上准备合并 Tab
    for (const target of candidates) {
      const titleRect = target.titlebar.getBoundingClientRect();
      if (
        clientX >= titleRect.left && clientX <= titleRect.right
        && clientY >= titleRect.top - 4 && clientY <= titleRect.bottom + 4
      ) {
        target.element.dataset.groupDrop = 'tab';
        return { groupTargetKey: target.key, stackTargetKey: null };
      }
    }

    // 2) 检查是否贴近某个浮动面板底边准备纵向串联吸附
    if (draggingInstance.state.effectiveMode === 'float') {
      const dragRect = draggingInstance.element.getBoundingClientRect();
      const threshold = this.host.snapThreshold ?? DEFAULT_SNAP_THRESHOLD;
      for (const target of candidates) {
        if (target.state.effectiveMode !== 'float') continue;
        const targetRect = target.element.getBoundingClientRect();
        const overlapX = Math.min(dragRect.right, targetRect.right) - Math.max(dragRect.left, targetRect.left);
        const minW = Math.min(dragRect.width, targetRect.width);
        if (overlapX >= minW * 0.45 && Math.abs(dragRect.top - targetRect.bottom) <= threshold) {
          target.element.dataset.groupDrop = 'stack';
          return { groupTargetKey: null, stackTargetKey: target.key };
        }
      }
    }

    return { groupTargetKey: null, stackTargetKey: null };
  }

  clearDropTargets() {
    for (const inst of this.instances.values()) {
      delete inst.element.dataset.groupDrop;
    }
  }

  updateHotZonePreview(clientX, clientY, instance) {
    const drop = this.detectSidebarDropZone(clientX, clientY, instance);
    if (!drop) {
      this.hideHotZonePreview();
      return null;
    }
    if (!this.hotZonePreview) {
      this.hotZonePreview = this.documentRef.createElement('div');
      this.hotZonePreview.className = 'cgowm-hot-zone-preview';
      this.root.appendChild(this.hotZonePreview);
    }
    const workArea = this.getWorkArea();
    this.hotZonePreview.dataset.side = drop.side;
    this.hotZonePreview.style.top = `${workArea.top}px`;
    this.hotZonePreview.style.bottom = `${Math.max(0, workArea.viewportHeight - workArea.bottom)}px`;
    if (drop.rect) {
      const sb = this.sidebars.get(drop.side);
      const isRail = sb?.element.dataset.collapsed === 'rail';
      if (isRail) {
        this.hotZonePreview.style.width = `${Math.round(this.getSidebarWidth(drop.side))}px`;
        this.hideSidebarDropIndicator();
      } else {
        this.hotZonePreview.style.width = `${Math.round(drop.rect.width)}px`;
        if (sb) {
          const children = [...sb.body.querySelectorAll(':scope > .cgowm-window')].filter((el) => !el.hidden);
          this.showSidebarDropIndicator(sb, children, drop.insertIndex);
        }
      }
    } else {
      this.hotZonePreview.style.width = '';
      this.hideSidebarDropIndicator();
    }
    this.hotZonePreview.hidden = false;
    return drop;
  }

  hideHotZonePreview() {
    if (this.hotZonePreview) this.hotZonePreview.hidden = true;
    this.hideSidebarDropIndicator();
  }

  // ==================== 移动端统一单底栏抽屉（Scheme A） ====================

  isUnifiedMobileActive() {
    if (!this.initialized || this.host?.mobileWorkspace !== 'unified-sheet') return false;
    return viewportOf(this).width <= (this.host?.mobileBreakpoint ?? DEFAULT_MOBILE_BREAKPOINT);
  }

  isUnifiedMobileEligible(instance) {
    if (!instance || instance.state.lifecycle === 'destroyed') return false;
    if (instance.config.desktopPresentation) return false;
    if (instance.config.mobileMode !== 'sheet') return false;
    if (['dialog', 'alertdialog'].includes(instance.config.role)) return false;
    return true;
  }

  getMobileDockCandidates() {
    const primary = [];
    const addon = [];
    for (const inst of this.instances.values()) {
      if (!this.isUnifiedMobileEligible(inst)) continue;
      if (!inst.config.mobileAlwaysAvailable && !['visible', 'minimized'].includes(inst.state.lifecycle)) {
        continue;
      }
      if (inst.config.mobileGroup === 'addon') addon.push(inst);
      else primary.push(inst);
    }
    const order = this.host?.defaultSidebarOrder?.left || [];
    if (order.length > 0) {
      primary.sort((a, b) => {
        const ia = order.indexOf(a.key);
        const ib = order.indexOf(b.key);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    return [...primary, ...addon];
  }

  ensureMobileDock() {
    if (this.mobileDock?.element?.isConnected) return this.mobileDock;
    const doc = this.documentRef;
    const element = doc.createElement('section');
    element.className = 'cgowm-window cgowm-mobile-dock';
    element.dataset.mode = 'sheet';
    element.setAttribute('role', 'region');
    element.setAttribute('aria-label', '移动端工具抽屉');
    element.hidden = true;

    const grabberZone = doc.createElement('div');
    grabberZone.className = 'cgowm-mobile-grabber-zone cgowm-titlebar-drag-handle';
    const grabber = doc.createElement('div');
    grabber.className = 'cgowm-grabber';
    grabber.setAttribute('aria-hidden', 'true');
    grabberZone.appendChild(grabber);

    const bar = doc.createElement('header');
    bar.className = 'cgowm-titlebar cgowm-mobile-dock-bar';
    const pillbar = doc.createElement('div');
    pillbar.className = 'cgowm-mobile-pillbar';
    pillbar.setAttribute('role', 'tablist');
    pillbar.setAttribute('aria-label', '工具与加载项切换');

    const actionBtn = doc.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'cgowm-control cgowm-mobile-action-btn';
    actionBtn.hidden = true;

    bar.append(pillbar, actionBtn);

    const body = doc.createElement('div');
    body.className = 'cgowm-content cgowm-mobile-dock-body';

    element.append(grabberZone, bar, body);
    this.root.appendChild(element);

    const dockState = {
      key: '__mobile_dock__',
      manager: this,
      element,
      grabberZone,
      bar,
      pillbar,
      actionBtn,
      actionKey: null,
      lastPillKey: null,
      body,
      hostedKey: null,
      ducking: false,
      controller: null,
      connected: false,
      config: {
        mobileDetents: ['collapsed', 'half', 'full'],
        mobileResizable: true,
        mobileFooterHeight: this.host?.mobileFooterHeight,
      },
      state: {
        mobileDetent: this.mobileWorkspaceState?.detent || this.host?.mobileDefaultDetent || 'half',
      },
      setMobileDetent: (detent) => this.setMobileDockDetent(detent),
    };

    actionBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.handleMobileActionClick();
    });

    dockState.controller = new SheetController(dockState);
    this.mobileDock = dockState;
    return dockState;
  }

  persistMobileWorkspaceState() {
    if (!this.mobileWorkspaceState || !this.mobileWorkspaceStorageKey) return;
    writeMobileWorkspaceState(this.storage, this.mobileWorkspaceStorageKey, this.mobileWorkspaceState);
  }

  setMobileDockDetent(detent, { animate = true } = {}) {
    if (!['collapsed', 'half', 'full'].includes(detent)) return false;
    const dock = this.mobileDock;
    const prev = this.mobileWorkspaceState?.detent || 'half';
    if (this.mobileWorkspaceState) {
      this.mobileWorkspaceState.detent = detent;
      this.persistMobileWorkspaceState();
    }
    if (dock) {
      dock.state.mobileDetent = detent;
      dock.element.dataset.detent = detent;
      dock.ducking = false;
      delete dock.element.dataset.ducking;
      dock.controller?.recalculate?.();
      dock.controller?.apply?.(detent, animate);
    }
    if (prev !== detent) {
      this.emitter.emit('detentChange', { key: '__mobile_dock__', detent, previousDetent: prev, dragging: false });
    }
    return true;
  }

  setActiveMobilePanel(key, { expandIfCollapsed = true, persist = true } = {}) {
    const target = this.resolve(key);
    if (!target || !this.mobileWorkspaceState) return false;
    this.userSelectedMobilePanel = true;
    this.mobileWorkspaceState.activeKey = target.key;
    if (target.config.mobileSlot !== 'action' && this.mobileDock) {
      this.mobileDock.lastPillKey = target.key;
    }
    if (expandIfCollapsed && this.mobileWorkspaceState.detent === 'collapsed') {
      this.mobileWorkspaceState.detent = 'half';
      if (this.mobileDock) this.mobileDock.state.mobileDetent = 'half';
    }
    if (persist) this.persistMobileWorkspaceState();
    this.syncMobileDock();
    return true;
  }

  handleMobilePillClick(key) {
    const prevDetent = this.mobileDock?.state.mobileDetent || this.mobileWorkspaceState?.detent || 'half';
    this.setActiveMobilePanel(key, { expandIfCollapsed: true, persist: true });
    if (prevDetent === 'collapsed' && this.mobileDock && !this.mobileDock.ducking) {
      this.mobileDock.controller?.apply?.(this.mobileDock.state.mobileDetent, true);
    }
  }

  handleMobileActionClick() {
    const dock = this.mobileDock;
    const actionKey = dock?.actionKey;
    if (!actionKey) return;
    const prevDetent = dock.state.mobileDetent || this.mobileWorkspaceState?.detent || 'half';
    const curActive = dock.hostedKey || this.mobileWorkspaceState?.activeKey;
    if (curActive === actionKey && prevDetent !== 'collapsed') {
      const candidates = this.getMobileDockCandidates().filter((inst) => inst.config.mobileSlot !== 'action');
      const fallback = candidates.find((inst) => inst.key === dock.lastPillKey)
        || candidates.find((inst) => inst.key === this.host?.mobileDefaultPanel)
        || candidates[0];
      if (fallback) {
        this.setActiveMobilePanel(fallback.key, { expandIfCollapsed: true, persist: true });
      }
      return;
    }
    if (curActive && curActive !== actionKey) {
      dock.lastPillKey = curActive;
    }
    this.setActiveMobilePanel(actionKey, { expandIfCollapsed: true, persist: true });
    if (prevDetent === 'collapsed' && !dock.ducking) {
      dock.controller?.apply?.(dock.state.mobileDetent, true);
    }
  }

  releaseMobileDockHostedContent() {
    const dock = this.mobileDock;
    if (!dock?.hostedKey) return;
    const prev = this.get(dock.hostedKey);
    dock.hostedKey = null;
    if (!prev || prev.state.lifecycle === 'destroyed') return;
    const firstResizer = prev.element.querySelector(':scope > .cgowm-resizer');
    if (prev.contentElement.parentNode !== prev.element) {
      moveElementBefore(prev.element, prev.contentElement, firstResizer);
    }
  }

  teardownMobileDock() {
    const dock = this.mobileDock;
    if (!dock) return;
    this.releaseMobileDockHostedContent();
    dock.ducking = false;
    delete dock.element.dataset.ducking;
    if (dock.connected) {
      dock.controller?.disconnect();
      dock.connected = false;
    }
    dock.element.hidden = true;
  }

  setMobileDockDucking(active) {
    const dock = this.mobileDock;
    if (!this.isUnifiedMobileActive() || !dock || dock.element.hidden) {
      if (dock) {
        dock.ducking = false;
        delete dock.element.dataset.ducking;
      }
      return false;
    }
    if (active) {
      dock.ducking = true;
      dock.element.dataset.ducking = 'true';
      dock.controller?.recalculate?.();
      dock.controller?.apply?.('collapsed', true);
    } else if (dock.ducking) {
      dock.ducking = false;
      delete dock.element.dataset.ducking;
      dock.controller?.recalculate?.();
      dock.controller?.apply?.(dock.state.mobileDetent || 'half', true);
    }
    return true;
  }

  syncMobileDock() {
    if (!this.initialized) return;
    if (!this.isUnifiedMobileActive()) {
      this.teardownMobileDock();
      return;
    }
    const candidates = this.getMobileDockCandidates();
    if (candidates.length === 0) {
      this.teardownMobileDock();
      return;
    }

    const dock = this.ensureMobileDock();
    dock.element.hidden = false;
    dock.state.mobileDetent = this.mobileWorkspaceState?.detent || dock.state.mobileDetent || 'half';
    dock.element.dataset.detent = dock.state.mobileDetent;
    const minZ = (Number(this.host?.zBase?.panel) || Z_GROUP_BASE.panel) + 20;
    if ((Number.parseInt(dock.element.style.zIndex, 10) || 0) < minZ) {
      dock.element.style.zIndex = String(Math.max(minZ, this.nextZ('panel')));
    }

    const actionInst = candidates.find((inst) => inst.config.mobileSlot === 'action') || null;
    const pillCandidates = actionInst ? candidates.filter((inst) => inst !== actionInst) : candidates;
    const availablePillCandidates = pillCandidates.filter((inst) => !inst.config.unavailable);
    const defaultActiveInst = availablePillCandidates.find((inst) => inst.key === this.host?.mobileDefaultPanel)
      || availablePillCandidates[0]
      || pillCandidates.find((inst) => inst.key === this.host?.mobileDefaultPanel)
      || pillCandidates[0]
      || candidates[0];

    let savedActive = candidates.find((inst) => inst.key === this.mobileWorkspaceState?.activeKey) || null;
    if (!this.userSelectedMobilePanel && savedActive && savedActive === actionInst && pillCandidates.length > 0) {
      savedActive = null;
    }
    if (!this.userSelectedMobilePanel && savedActive?.config?.unavailable && availablePillCandidates.length > 0) {
      savedActive = null;
    }
    const activeInst = savedActive || defaultActiveInst;
    if (activeInst !== actionInst) {
      dock.lastPillKey = activeInst.key;
    }
    if (
      this.mobileWorkspaceState
      && this.mobileWorkspaceState.activeKey !== activeInst.key
      && (
        this.userSelectedMobilePanel
        || activeInst.key === this.host?.mobileDefaultPanel
        || (!this.host?.mobileDefaultPanel && activeInst !== actionInst)
      )
    ) {
      this.mobileWorkspaceState.activeKey = activeInst.key;
      this.persistMobileWorkspaceState();
    }

    const prevHosted = dock.hostedKey;
    if (prevHosted !== activeInst.key || activeInst.contentElement.parentNode !== dock.body) {
      this.releaseMobileDockHostedContent();
      moveElementBefore(dock.body, activeInst.contentElement, null);
      activeInst.contentElement.hidden = false;
      dock.hostedKey = activeInst.key;
      if (prevHosted !== activeInst.key) {
        this.emitter.emit('mobileTabChange', { key: activeInst.key, previousKey: prevHosted, instance: activeInst });
      }
    }

    const doc = this.documentRef;
    const pillNodes = [];
    let insertedDivider = false;
    for (const inst of pillCandidates) {
      const isAddon = inst.config.mobileGroup === 'addon';
      if (isAddon && !insertedDivider && pillNodes.length > 0) {
        const div = doc.createElement('span');
        div.className = 'cgowm-mobile-pill-divider';
        div.setAttribute('aria-hidden', 'true');
        pillNodes.push(div);
        insertedDivider = true;
      }

      const isActive = inst.key === activeInst.key;
      const isUnavailable = Boolean(inst.config.unavailable);
      const pill = doc.createElement('button');
      pill.type = 'button';
      pill.className = `cgowm-mobile-pill${isActive ? ' is-active' : ''}${isAddon ? ' is-addon' : ''}${isUnavailable ? ' is-unavailable' : ''}`;
      pill.dataset.cgowmKey = inst.key;
      pill.setAttribute('role', 'tab');
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
      const pillLabelText = inst.config.title || inst.config.shortTitle || inst.config.panelId;
      pill.title = isUnavailable ? `${pillLabelText}（${inst.config.badge || '当前不可用'}）` : pillLabelText;

      if (inst.config.icon) {
        const iconSpan = doc.createElement('span');
        iconSpan.className = 'cgowm-mobile-pill-icon';
        inst.renderIconVisual(iconSpan, inst.config.icon);
        if (!iconSpan.hidden) pill.appendChild(iconSpan);
      }

      const labelSpan = doc.createElement('span');
      labelSpan.className = 'cgowm-mobile-pill-label';
      labelSpan.textContent = inst.config.title || inst.config.shortTitle || inst.config.panelId;
      pill.appendChild(labelSpan);

      pill.addEventListener('click', (event) => {
        event.stopPropagation();
        this.handleMobilePillClick(inst.key);
      });

      pillNodes.push(pill);
    }
    dock.pillbar.replaceChildren(...pillNodes);

    if (actionInst) {
      const isActionActive = activeInst.key === actionInst.key;
      const actionIcon = actionInst.config.icon || 'search';
      const actionLabel = actionInst.config.title || actionInst.config.shortTitle || '搜索';
      dock.actionKey = actionInst.key;
      dock.actionBtn.dataset.cgowmKey = actionInst.key;
      if (dock.actionBtn.dataset.iconName !== actionIcon) {
        renderCgoIcon(this, dock.actionBtn, actionIcon, 15);
      }
      dock.actionBtn.hidden = false;
      dock.actionBtn.classList.toggle('is-active', isActionActive);
      dock.actionBtn.setAttribute('aria-pressed', isActionActive ? 'true' : 'false');
      dock.actionBtn.title = actionLabel;
      dock.actionBtn.setAttribute('aria-label', actionLabel);
    } else {
      dock.actionKey = null;
      delete dock.actionBtn.dataset.cgowmKey;
      dock.actionBtn.hidden = true;
      dock.actionBtn.classList.remove('is-active');
      dock.actionBtn.setAttribute('aria-pressed', 'false');
    }

    const activePill = dock.pillbar.querySelector('.cgowm-mobile-pill[aria-selected="true"]');
    if (activePill && prevHosted !== activeInst.key) {
      activePill.scrollIntoView?.({
        behavior: prevHosted ? 'smooth' : 'auto',
        block: 'nearest',
        inline: 'nearest',
        container: 'nearest',
      });
    }

    if (!dock.connected) {
      dock.connected = true;
      dock.controller.connect();
    } else {
      dock.controller.recalculate();
      const targetDetent = dock.ducking ? 'collapsed' : dock.state.mobileDetent;
      dock.controller.apply(targetDetent, false);
    }
  }

  handleViewportResize() {
    if (!this.initialized) return;
    const vp = viewportOf(this);
    this.lastViewportSize = { width: vp.width, height: vp.height };
    const wasUnified = Boolean(this.mobileDock && !this.mobileDock.element.hidden);
    const nowUnified = this.isUnifiedMobileActive();
    if (!nowUnified) {
      if (this.mobileDockSettleRaf) {
        this.windowRef.cancelAnimationFrame?.(this.mobileDockSettleRaf);
        this.mobileDockSettleRaf = null;
      }
      this.teardownMobileDock();
    }
    for (const instance of this.instances.values()) {
      instance.applyResponsiveMode();
      instance.keepInBounds();
    }
    this.syncSidebars();
    this.syncTabGroups();
    this.reflowStacks();
    if (nowUnified) {
      this.syncMobileDock();
      // 从桌面切入移动端时，顶栏可能在下一帧才完成双行高度重排，补一次无动画校准
      if (!wasUnified && typeof this.windowRef.requestAnimationFrame === 'function') {
        if (this.mobileDockSettleRaf) {
          this.windowRef.cancelAnimationFrame?.(this.mobileDockSettleRaf);
        }
        this.mobileDockSettleRaf = this.windowRef.requestAnimationFrame(() => {
          this.mobileDockSettleRaf = null;
          if (!this.initialized || !this.isUnifiedMobileActive()) return;
          const dock = this.mobileDock;
          if (!dock || dock.element.hidden || dock.controller?.dragging) return;
          dock.controller?.recalculate?.();
          const targetDetent = dock.ducking ? 'collapsed' : dock.state.mobileDetent;
          dock.controller?.apply?.(targetDetent, false);
        });
      }
    }
  }

  handleKeydown(event) {
    const active = this.resolve(this.activeKey);
    active?.trapFocus(event);
    if (event.key !== 'Escape' || !active) return;
    if (['modal', 'fullscreen'].includes(active.state.effectiveMode) && active.config.closeOnEscape !== false) {
      event.preventDefault();
      active.close();
    }
  }

  reportError(error, context = {}) {
    const detail = {
      hostId: this.host?.hostId || 'uninitialized',
      key: context.key || null,
      phase: context.phase || 'unknown',
      code: context.code || 'cgowm_error',
      message: error instanceof Error ? error.message : String(error),
    };
    try {
      this.windowRef.dispatchEvent(new this.windowRef.CustomEvent('cgowm:error', { detail }));
    } catch {
      // 不让诊断事件本身影响旧系统回退。
    }
    this.host?.onError?.(error, detail);
  }

  dispose() {
    if (this.mobileDockSettleRaf) {
      this.windowRef.cancelAnimationFrame?.(this.mobileDockSettleRaf);
      this.mobileDockSettleRaf = null;
    }
    this.teardownMobileDock();
    this.mobileDock?.element?.remove();
    this.mobileDock = null;
    this.addons?.dispose?.();
    this.destroyAll();
    this.unbindViewportListeners();
    this.documentRef.removeEventListener('keydown', this.boundKeydown);
    this.documentRef?.documentElement?.removeAttribute?.('data-cgowm-mobile');
    this.sidebars.forEach(({ element }) => element.remove());
    this.sidebars.clear();
    this.hotZonePreview?.remove();
    this.sidebarDropIndicator?.remove();
    this.railTooltip?.remove();
    if (this.railFlashTimer) {
      this.windowRef.clearTimeout?.(this.railFlashTimer);
      this.railFlashTimer = null;
    }
    this.emitter.clear();
    this.initialized = false;
  }
}
