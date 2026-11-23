import { STORAGE_SCHEMA_VERSION } from './constants.js';
import { appendSafeVisual } from './sanitize.js';
import { makeWindowKey } from './utils.js';

const CATEGORY_ORDER = ['ref', 'design', 'master', 'support', 'export', 'other'];
const DEFAULT_CATEGORY_NAMES = {
  ref: '参考信息',
  design: '设计增强',
  master: '启元独占',
  support: '获取支持',
  export: '试验功能',
  other: '扩展工具',
};

export function makeAddonEnabledStorageKey(hostId) {
  return `cgowm:v${STORAGE_SCHEMA_VERSION}:${hostId}:addons:enabled`;
}

export function makeGlobalAddonDataStorageKey(addonId) {
  return `cgowm:v${STORAGE_SCHEMA_VERSION}:global:addon:${addonId}:data`;
}

function readJson(storage, key) {
  if (!storage || !key) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  if (!storage || !key) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export class CgoAddonManager {
  constructor(manager) {
    this.manager = manager;
    this.registry = new Map();
    this.enabledIds = new Set();
    this.hasExplicitSavedEnabled = false;
    this.enabledStateLoaded = false;
    this.capabilities = new Map();
    this.scriptPromises = new Map();
    this.windowKeys = new Map();
    this.activeDialog = null;
    this.listenersBound = false;
    this.boundPermUpdate = () => this.handleEnvironmentChange();
    this.boundStorage = (event) => this.handleStorageEvent(event);
  }

  getHostId() {
    return this.manager.host?.hostId || 'cgo';
  }

  getProgramId() {
    return this.manager.host?.programId || this.getHostId();
  }

  bindHostListeners() {
    if (this.listenersBound) return;
    const win = this.manager.windowRef;
    if (!win?.addEventListener) return;
    this.listenersBound = true;
    win.addEventListener('vitool:permissions-updated', this.boundPermUpdate);
    win.addEventListener('storage', this.boundStorage);
  }

  handleStorageEvent(event) {
    const key = event?.key;
    if (!key) return;
    const globalPrefix = `cgowm:v${STORAGE_SCHEMA_VERSION}:global:addon:`;
    if (key.startsWith(globalPrefix) && key.endsWith(':data')) {
      const addonId = key.slice(globalPrefix.length, -':data'.length);
      this.manager.emitter.emit('addonDataChange', { addonId, external: true });
      return;
    }
    if (key === makeAddonEnabledStorageKey(this.getHostId())) {
      this.enabledStateLoaded = false;
      this.loadEnabledState();
      this.syncAll({ openWindows: true });
      this.manager.emitter.emit('addonChange', { external: true });
    }
  }

  async handleEnvironmentChange() {
    await this.syncAll({ openWindows: false });
    this.refreshModalContent();
    this.manager.emitter.emit('addonChange', { permissionsUpdated: true });
  }

  loadEnabledState() {
    if (this.enabledStateLoaded) return this.enabledIds;
    this.enabledStateLoaded = true;
    const storage = this.manager.storage;
    const hostId = this.getHostId();
    const newKey = makeAddonEnabledStorageKey(hostId);
    const saved = readJson(storage, newKey);

    if (Array.isArray(saved)) {
      this.enabledIds = new Set(saved.filter((id) => typeof id === 'string' && id));
      this.hasExplicitSavedEnabled = true;
      return this.enabledIds;
    }

    const legacyPrefix = this.manager.host?.addonLegacyPrefix || `${hostId}_`;
    const legacySaved = readJson(storage, `${legacyPrefix}enabled_plugins`);
    if (Array.isArray(legacySaved)) {
      this.enabledIds = new Set(legacySaved.filter((id) => typeof id === 'string' && id));
      this.hasExplicitSavedEnabled = true;
      writeJson(storage, newKey, [...this.enabledIds]);
      return this.enabledIds;
    }

    this.hasExplicitSavedEnabled = false;
    return this.enabledIds;
  }

  persistEnabledState() {
    if (!this.manager.storage) return false;
    this.hasExplicitSavedEnabled = true;
    return writeJson(this.manager.storage, makeAddonEnabledStorageKey(this.getHostId()), [...this.enabledIds]);
  }

  matchesHost(manifest, targetHostId = this.getHostId()) {
    if (!manifest) return false;
    if (!manifest.hosts || manifest.hosts === 'all') return true;
    if (Array.isArray(manifest.hosts)) {
      if (manifest.hosts.length === 0 || manifest.hosts.includes('*')) return true;
      return manifest.hosts.includes(targetHostId);
    }
    return true;
  }

  canViewAddon(manifest, targetHostId = this.getHostId()) {
    if (!manifest || !this.matchesHost(manifest, targetHostId)) return false;
    const win = this.manager.windowRef;
    const permClient = win?.PermissionClient;
    const permKey = manifest.permissions?.view || `plugin.${manifest.id}.view`;
    if (permClient && typeof permClient.canView === 'function' && !permClient.canView(permKey)) {
      return false;
    }
    if (manifest.primeOnly && !win?.isPrimeMode && !permClient) {
      return false;
    }
    if (typeof manifest.canView === 'function' && !manifest.canView(this.manager)) {
      return false;
    }
    return true;
  }

  canUseAddon(manifest, targetHostId = this.getHostId()) {
    if (!this.canViewAddon(manifest, targetHostId)) return false;
    const win = this.manager.windowRef;
    const permClient = win?.PermissionClient;
    const permKey = manifest.permissions?.use || `plugin.${manifest.id}.use`;
    if (permClient && typeof permClient.canUse === 'function' && !permClient.canUse(permKey)) {
      return false;
    }
    if (manifest.primeOnly && !win?.isPrimeMode && !permClient) {
      return false;
    }
    if (typeof manifest.canUse === 'function' && !manifest.canUse(this.manager)) {
      return false;
    }
    return true;
  }

  isDefaultEnabledForHost(manifest, hostId = this.getHostId()) {
    if (!manifest) return false;
    if (Array.isArray(manifest.defaultEnabledHosts)) {
      return manifest.defaultEnabledHosts.includes(hostId);
    }
    return Boolean(manifest.defaultEnabled);
  }

  normalizeManifest(raw = {}) {
    if (!raw || typeof raw.id !== 'string' || !raw.id.trim()) {
      throw new TypeError('加载项必须包含非空字符串 id');
    }
    const id = raw.id.trim();
    const category = CATEGORY_ORDER.includes(raw.category) ? raw.category : 'other';
    return {
      ...raw,
      id,
      name: raw.name || id,
      shortTitle: raw.shortTitle || raw.name || id,
      description: raw.description || '',
      category,
      categoryName: raw.categoryName || DEFAULT_CATEGORY_NAMES[category] || '扩展工具',
      icon: raw.icon || 'plugin',
      hosts: raw.hosts ?? null,
      defaultEnabled: Boolean(raw.defaultEnabled),
      defaultEnabledHosts: Array.isArray(raw.defaultEnabledHosts) ? [...raw.defaultEnabledHosts] : null,
      primeOnly: Boolean(raw.primeOnly),
      permissions: raw.permissions ? { ...raw.permissions } : null,
      window: raw.window ? { ...raw.window } : {},
    };
  }

  registerAddon(rawManifest) {
    const manifest = this.normalizeManifest(rawManifest);
    const existing = this.registry.get(manifest.id);
    const merged = existing
      ? {
          ...existing,
          ...manifest,
          window: { ...(existing.window || {}), ...(manifest.window || {}) },
        }
      : manifest;
    this.registry.set(merged.id, merged);
    this.bindHostListeners();
    this.loadEnabledState();

    if (
      !this.hasExplicitSavedEnabled &&
      this.matchesHost(merged) &&
      this.isDefaultEnabledForHost(merged)
    ) {
      this.enabledIds.add(merged.id);
    }
    return merged;
  }

  registerAddons(list = []) {
    if (!Array.isArray(list)) return [];
    return list.map((item) => this.registerAddon(item));
  }

  unregisterAddon(id) {
    const key = this.windowKeys.get(id);
    if (key) {
      this.manager.destroy(key);
      this.windowKeys.delete(id);
    }
    this.enabledIds.delete(id);
    return this.registry.delete(id);
  }

  getAddon(id) {
    return this.registry.get(id) || null;
  }

  listAddons({ includeHidden = false, hostId = this.getHostId() } = {}) {
    this.loadEnabledState();
    const items = [];
    for (const manifest of this.registry.values()) {
      if (!this.matchesHost(manifest, hostId)) continue;
      const canView = this.canViewAddon(manifest, hostId);
      if (!includeHidden && !canView) continue;
      const canUse = this.canUseAddon(manifest, hostId);
      items.push({
        ...manifest,
        enabled: this.enabledIds.has(manifest.id),
        canView,
        canUse,
        isCrossApp: !manifest.hosts || (Array.isArray(manifest.hosts) && manifest.hosts.length > 1),
        windowKey: this.getWindowKey(manifest.id),
      });
    }
    return items;
  }

  isEnabled(id) {
    this.loadEnabledState();
    return this.enabledIds.has(id);
  }

  resolveWindowPanelId(manifest) {
    return manifest?.window?.panelId || `addon-${manifest.id}`;
  }

  getWindowKey(id) {
    const known = this.windowKeys.get(id);
    if (known) return known;
    const manifest = this.registry.get(id);
    if (!manifest) return null;
    const programId = manifest.window?.programId || this.getProgramId();
    const panelId = this.resolveWindowPanelId(manifest);
    return makeWindowKey(programId, panelId);
  }

  getWindowInstance(id) {
    const key = this.getWindowKey(id);
    if (key) {
      const inst = this.manager.get(key);
      if (inst) return inst;
    }
    const legacyKey = makeWindowKey(this.getProgramId(), id);
    return this.manager.get(legacyKey) || null;
  }

  listEnabledWindowInstances() {
    this.loadEnabledState();
    const instances = [];
    for (const manifest of this.registry.values()) {
      if (!this.enabledIds.has(manifest.id)) continue;
      if (!this.canViewAddon(manifest) || !this.canUseAddon(manifest)) continue;
      const inst = this.getWindowInstance(manifest.id);
      if (inst && inst.state.lifecycle !== 'destroyed') {
        instances.push({ manifest, instance: inst });
      }
    }
    return instances;
  }

  loadScript(scriptUrl) {
    if (!scriptUrl) return Promise.resolve();
    const doc = this.manager.documentRef;
    const existingScript = [...doc.querySelectorAll('script')].find((el) => {
      const src = el.getAttribute('src') || '';
      return src === scriptUrl || src.includes(scriptUrl);
    });
    if (existingScript) return Promise.resolve();
    if (this.scriptPromises.has(scriptUrl)) return this.scriptPromises.get(scriptUrl);

    const promise = new Promise((resolve, reject) => {
      const script = doc.createElement('script');
      script.src = scriptUrl;
      script.onload = () => resolve();
      script.onerror = (err) => {
        this.scriptPromises.delete(scriptUrl);
        reject(err);
      };
      doc.body.appendChild(script);
    });
    this.scriptPromises.set(scriptUrl, promise);
    return promise;
  }

  computeDefaultFloatPosition(width = 340, height = 420) {
    const workArea = this.manager.getWorkArea();
    const numericW = Number(width) || 340;
    const numericH = Number.isFinite(Number(height)) ? Number(height) : 340;
    const idx = this.windowKeys.size;
    const step = (idx % 5) * 24;
    const rightBound = Math.min(workArea.right, workArea.viewportWidth) - numericW - 18 - step;
    const x = Math.max(workArea.left + 14, rightBound);
    const y = Math.max(workArea.top + 14, Math.min(workArea.top + 20 + step, workArea.bottom - Math.min(numericH, 220)));
    return { x: Math.round(x), y: Math.round(y) };
  }

  ensureAddonWindow(manifest) {
    if (!this.manager.initialized) return null;
    if (manifest.scriptUrl && !manifest.mount && !manifest.iframeSrc) {
      return this.getWindowInstance(manifest.id);
    }

    const panelId = this.resolveWindowPanelId(manifest);
    const programId = manifest.window?.programId || this.getProgramId();
    const key = makeWindowKey(programId, panelId);
    this.windowKeys.set(manifest.id, key);
    const existing = this.manager.get(key);
    if (existing && existing.state.lifecycle !== 'destroyed') return existing;

    let content = null;
    if (manifest.iframeSrc) {
      const rawSrc = typeof manifest.iframeSrc === 'function'
        ? manifest.iframeSrc(this.manager)
        : manifest.iframeSrc;
      content = {
        kind: 'iframe',
        src: rawSrc,
        title: manifest.name,
        loading: 'lazy',
        sandbox: manifest.sandbox || 'allow-forms allow-scripts allow-same-origin allow-downloads allow-popups',
      };
    } else if (typeof manifest.mount === 'function') {
      content = {
        kind: 'factory',
        mount: (container, context) => manifest.mount(container, { ...context, addon: manifest, addonManager: this }),
        unmount: typeof manifest.unmount === 'function'
          ? (container, context) => manifest.unmount(container, { ...context, addon: manifest, addonManager: this })
          : undefined,
      };
    } else if (manifest.window?.content) {
      content = manifest.window.content;
    }

    const winCfg = manifest.window || {};
    const isIframe = Boolean(manifest.iframeSrc || content?.kind === 'iframe');
    const width = winCfg.defaultWidth || winCfg.width || 340;
    const height = winCfg.defaultHeight ?? winCfg.height ?? (isIframe ? 520 : 'auto');
    const defaultPosition = winCfg.defaultPosition || this.computeDefaultFloatPosition(width, height);

    const instance = this.manager.register({
      programId,
      panelId,
      elementId: winCfg.elementId || `cgowm-addon-${manifest.id}`,
      className: ['cgowm-addon-window', winCfg.className || ''].filter(Boolean).join(' '),
      title: winCfg.title || manifest.name,
      shortTitle: winCfg.shortTitle || manifest.shortTitle || manifest.name,
      icon: winCfg.icon || manifest.icon || 'plugin',
      mode: winCfg.mode || 'float',
      allowModes: winCfg.allowModes || ['float', 'sidebar'],
      sidebarSide: winCfg.sidebarSide || 'right',
      minimizeMode: 'collapse',
      mobileMode: winCfg.mobileMode || 'sheet',
      mobileGroup: 'addon',
      mobileAlwaysAvailable: false,
      resizable: winCfg.resizable !== false,
      groupable: winCfg.groupable !== false,
      showClose: winCfg.showClose !== false,
      showMinimize: winCfg.showMinimize !== false,
      defaultWidth: width,
      defaultHeight: height,
      minWidth: winCfg.minWidth || 240,
      minHeight: winCfg.minHeight || 160,
      defaultPosition,
      rememberPosition: winCfg.rememberPosition !== false,
      restoreStateOnRegister: false,
      content,
    });

    return instance;
  }

  async activateAddon(manifest, { openWindow = true, focusMobile = false, interactive = false } = {}) {
    if (!this.manager.initialized || !manifest) return null;
    if (!this.canViewAddon(manifest) || !this.canUseAddon(manifest)) return null;

    if (manifest.scriptUrl) {
      try {
        await this.loadScript(manifest.scriptUrl);
      } catch (error) {
        this.manager.reportError(error, { phase: 'addonScriptLoad', key: manifest.id });
        return null;
      }
    }

    const instance = this.ensureAddonWindow(manifest);
    try {
      await manifest.onEnable?.(this.manager, instance);
    } catch (error) {
      this.manager.reportError(error, { phase: 'addonEnable', key: manifest.id });
    }

    if (openWindow && instance && instance.state.lifecycle !== 'destroyed') {
      const hasSaved = this.manager.hasPersistedState(instance.key);
      const savedLife = hasSaved ? (instance.savedLifecycle || instance.state.lifecycle) : null;
      if (interactive || focusMobile) {
        instance.open({ focusMobile: true });
        if (instance.state.lifecycle === 'minimized') instance.restore();
        if (instance.state.effectiveMode === 'sidebar') {
          this.manager.focusSidebarPanel?.(instance.key, { expandIfMinimized: true });
        }
        instance.bringToFront();
      } else if (!hasSaved) {
        instance.open({ focusMobile: false });
        if (manifest.window?.defaultLifecycle === 'minimized') {
          instance.minimize();
        }
      } else if (['visible', 'minimized'].includes(savedLife)) {
        const isMin = savedLife === 'minimized';
        if (isMin) instance.state.lifecycle = 'minimized';
        instance.open({ restoreLifecycle: true, focusMobile: false });
        if (isMin) instance.minimize({ persist: false });
      }
    }

    this.manager.syncMobileDock?.();
    return instance;
  }

  async syncAll({ openWindows = true } = {}) {
    if (!this.manager.initialized) return;
    this.loadEnabledState();

    for (const manifest of this.registry.values()) {
      if (!this.matchesHost(manifest)) continue;
      if (!this.hasExplicitSavedEnabled && this.isDefaultEnabledForHost(manifest)) {
        this.enabledIds.add(manifest.id);
      }
      const permitted = this.canViewAddon(manifest) && this.canUseAddon(manifest);
      const shouldBeActive = this.enabledIds.has(manifest.id) && permitted;

      if (shouldBeActive) {
        await this.activateAddon(manifest, { openWindow: openWindows, focusMobile: false, interactive: false });
      } else {
        const inst = this.getWindowInstance(manifest.id);
        if (inst && !['hidden', 'destroyed', 'registered'].includes(inst.state.lifecycle)) {
          inst.close();
        }
      }
    }
    this.manager.syncMobileDock?.();
  }

  async restoreEnabledAddons() {
    await this.syncAll({ openWindows: true });
  }

  async enableAddon(id, options = {}) {
    const manifest = this.registry.get(id);
    if (!manifest) return false;
    if (!this.canViewAddon(manifest) || !this.canUseAddon(manifest)) {
      if (options.interactive) {
        await this.manager.dialogApi?.alert?.('当前账号没有使用该加载项的权限。', { title: '权限受限' });
      }
      return false;
    }
    this.loadEnabledState();
    this.enabledIds.add(id);
    this.persistEnabledState();

    const instance = await this.activateAddon(manifest, {
      openWindow: options.openWindow !== false,
      focusMobile: Boolean(options.focusMobile ?? options.interactive),
      interactive: Boolean(options.interactive ?? true),
    });

    this.refreshModalContent();
    this.manager.emitter.emit('addonChange', { id, enabled: true, manifest, instance });
    return Boolean(instance || !manifest.scriptUrl);
  }

  disableAddon(id) {
    this.loadEnabledState();
    const manifest = this.registry.get(id);
    this.enabledIds.delete(id);
    this.persistEnabledState();

    const instance = this.getWindowInstance(id);
    if (instance && instance.state.lifecycle !== 'destroyed') {
      instance.close();
    }
    try {
      manifest?.onDisable?.(this.manager, instance);
    } catch (error) {
      this.manager.reportError(error, { phase: 'addonDisable', key: id });
    }

    this.manager.syncMobileDock?.();
    this.refreshModalContent();
    this.manager.emitter.emit('addonChange', { id, enabled: false, manifest, instance });
    return true;
  }

  toggleAddon(id, forceState, options = {}) {
    this.loadEnabledState();
    const target = typeof forceState === 'boolean' ? forceState : !this.enabledIds.has(id);
    return target ? this.enableAddon(id, { interactive: true, ...options }) : this.disableAddon(id);
  }

  focusAddon(id) {
    const manifest = this.registry.get(id);
    if (!manifest) return false;
    if (!this.isEnabled(id)) {
      return this.enableAddon(id, { interactive: true, focusMobile: true });
    }
    const inst = this.getWindowInstance(id);
    if (!inst) return false;
    if (this.manager.isUnifiedMobileActive?.()) {
      inst.open({ focusMobile: true });
      this.manager.setActiveMobilePanel?.(inst.key, { expandIfCollapsed: true, persist: true });
      return true;
    }
    if (inst.state.effectiveMode === 'sidebar') {
      return this.manager.focusSidebarPanel?.(inst.key, { expandIfMinimized: true }) ?? false;
    }
    inst.open();
    if (inst.state.lifecycle === 'minimized') inst.restore();
    inst.bringToFront();
    return true;
  }

  resetAddonsToDefault() {
    this.loadEnabledState();
    if (this.manager.storage) {
      this.manager.storage.removeItem(makeAddonEnabledStorageKey(this.getHostId()));
      const legacyPrefix = this.manager.host?.addonLegacyPrefix || `${this.getHostId()}_`;
      this.manager.storage.removeItem(`${legacyPrefix}enabled_plugins`);
    }
    this.enabledIds.clear();
    this.hasExplicitSavedEnabled = false;
    this.enabledStateLoaded = true;
    for (const manifest of this.registry.values()) {
      if (this.matchesHost(manifest) && this.isDefaultEnabledForHost(manifest)) {
        this.enabledIds.add(manifest.id);
      }
    }
    return this.syncAll({ openWindows: true });
  }

  // ==================== 能力总线 ====================

  registerCapability(name, handler) {
    if (typeof name !== 'string' || !name || typeof handler !== 'function') {
      throw new TypeError('registerCapability 需要有效的能力名与处理函数');
    }
    this.capabilities.set(name, handler);
    return () => {
      if (this.capabilities.get(name) === handler) {
        this.capabilities.delete(name);
      }
    };
  }

  unregisterCapability(name, handler) {
    if (!handler || this.capabilities.get(name) === handler) {
      return this.capabilities.delete(name);
    }
    return false;
  }

  hasCapability(name) {
    return this.capabilities.has(name);
  }

  async invokeCapability(name, payload = {}) {
    const handler = this.capabilities.get(name);
    if (!handler) return { handled: false, reason: 'no_handler' };
    try {
      const result = await handler(payload, { manager: this.manager, addons: this });
      if (result && typeof result === 'object') {
        return { handled: result.handled !== false, ...result };
      }
      return { handled: result !== false, value: result };
    } catch (error) {
      this.manager.reportError(error, { phase: 'invokeCapability', key: name });
      return { handled: false, error };
    }
  }

  // ==================== 跨软件全局共享存储 ====================

  getSharedData(addonId, fallback = null) {
    const parsed = readJson(this.manager.storage, makeGlobalAddonDataStorageKey(addonId));
    return parsed !== null ? parsed : fallback;
  }

  setSharedData(addonId, value) {
    const ok = writeJson(this.manager.storage, makeGlobalAddonDataStorageKey(addonId), value);
    if (ok) {
      this.manager.emitter.emit('addonDataChange', { addonId, value, external: false });
    }
    return ok;
  }

  // ==================== 统一加载项中心模态窗 ====================

  renderManagerBody(container) {
    const doc = this.manager.documentRef;
    container.replaceChildren();

    const intro = doc.createElement('div');
    intro.className = 'cgowm-addon-intro';
    intro.textContent = '启用或管理跨应用功能加载项，已启用的加载项将以统一 CGoWM 面板或移动端抽屉胶囊呈现。';
    container.appendChild(intro);

    const visibleAddons = this.listAddons({ includeHidden: false });
    if (visibleAddons.length === 0) {
      const empty = doc.createElement('div');
      empty.className = 'cgowm-addon-empty';
      empty.textContent = '当前工作区暂无可用加载项';
      container.appendChild(empty);
      return;
    }

    const grouped = new Map();
    for (const cat of CATEGORY_ORDER) grouped.set(cat, []);
    for (const addon of visibleAddons) {
      const cat = grouped.has(addon.category) ? addon.category : 'other';
      grouped.get(cat).push(addon);
    }

    const listEl = doc.createElement('div');
    listEl.className = 'cgowm-addon-categories';

    for (const cat of CATEGORY_ORDER) {
      const items = grouped.get(cat) || [];
      if (items.length === 0) continue;

      const section = doc.createElement('section');
      section.className = 'cgowm-addon-category';

      const heading = doc.createElement('div');
      heading.className = 'cgowm-addon-category-title';
      heading.textContent = items[0].categoryName || DEFAULT_CATEGORY_NAMES[cat] || '扩展工具';
      section.appendChild(heading);

      const grid = doc.createElement('div');
      grid.className = 'cgowm-addon-list';

      for (const addon of items) {
        const card = doc.createElement('div');
        card.className = `cgowm-addon-card${addon.enabled ? ' is-enabled' : ''}${addon.canUse ? '' : ' is-disabled'}`;
        card.dataset.addonId = addon.id;

        const iconBox = doc.createElement('div');
        iconBox.className = 'cgowm-addon-icon';
        appendSafeVisual(iconBox, addon.icon || 'plugin', {
          iconElementFactory: this.manager.host.iconElementFactory || ((name, documentRef) => {
            const ownerDoc = documentRef || doc;
            const el = ownerDoc.createElement('cgo-icon');
            el.setAttribute('name', name);
            el.setAttribute('size', '18');
            return el;
          }),
        });

        const meta = doc.createElement('div');
        meta.className = 'cgowm-addon-meta';

        const titleRow = doc.createElement('div');
        titleRow.className = 'cgowm-addon-title-row';

        const title = doc.createElement('span');
        title.className = 'cgowm-addon-name';
        title.textContent = addon.name;
        titleRow.appendChild(title);

        if (addon.isCrossApp) {
          const badge = doc.createElement('span');
          badge.className = 'cgowm-addon-badge';
          badge.textContent = '跨软件';
          titleRow.appendChild(badge);
        }
        if (!addon.canUse) {
          const permBadge = doc.createElement('span');
          permBadge.className = 'cgowm-addon-badge is-locked';
          permBadge.textContent = '只读';
          titleRow.appendChild(permBadge);
        }

        const desc = doc.createElement('div');
        desc.className = 'cgowm-addon-desc';
        desc.textContent = addon.description || '扩展工作区功能面板';

        meta.append(titleRow, desc);

        const actions = doc.createElement('div');
        actions.className = 'cgowm-addon-actions';

        if (addon.enabled && addon.canUse) {
          const focusBtn = doc.createElement('button');
          focusBtn.type = 'button';
          focusBtn.className = 'cgowm-addon-focus-btn';
          focusBtn.textContent = '定位';
          focusBtn.title = '显示并聚焦面板';
          focusBtn.addEventListener('click', () => {
            this.focusAddon(addon.id);
            this.activeDialog?.close?.();
          });
          actions.appendChild(focusBtn);
        }

        const toggleBtn = doc.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = `cgowm-addon-toggle${addon.enabled ? ' is-on' : ''}`;
        toggleBtn.setAttribute('role', 'switch');
        toggleBtn.setAttribute('aria-checked', addon.enabled ? 'true' : 'false');
        toggleBtn.setAttribute('aria-label', `${addon.enabled ? '关闭' : '启用'} ${addon.name}`);
        toggleBtn.disabled = !addon.canUse;

        const thumb = doc.createElement('span');
        thumb.className = 'cgowm-addon-toggle-thumb';
        toggleBtn.appendChild(thumb);

        toggleBtn.addEventListener('click', async () => {
          if (!addon.canUse) return;
          toggleBtn.disabled = true;
          try {
            await this.toggleAddon(addon.id, !addon.enabled, { interactive: true, focusMobile: !addon.enabled });
          } finally {
            this.refreshModalContent();
          }
        });

        actions.appendChild(toggleBtn);
        card.append(iconBox, meta, actions);
        grid.appendChild(card);
      }

      section.appendChild(grid);
      listEl.appendChild(section);
    }

    container.appendChild(listEl);
  }

  refreshModalContent() {
    if (!this.activeDialog || this.activeDialog.state.lifecycle === 'destroyed') return;
    const hostEl = this.activeDialog.contentElement.querySelector('.cgowm-addon-manager-body');
    if (hostEl) {
      this.renderManagerBody(hostEl);
    }
  }

  openAddonManager(options = {}) {
    if (!this.manager.initialized) {
      throw new Error('请先调用 CGoWM.init()');
    }
    this.loadEnabledState();
    if (this.activeDialog && this.activeDialog.state.lifecycle !== 'destroyed') {
      this.refreshModalContent();
      this.activeDialog.open();
      this.activeDialog.bringToFront();
      return this.activeDialog;
    }

    const doc = this.manager.documentRef;
    const body = doc.createElement('div');
    body.className = 'cgowm-addon-manager-body';
    this.renderManagerBody(body);

    const dialog = this.manager.dialogApi.dialog({
      panelId: options.panelId || 'cgowm-addon-manager',
      title: options.title || '加载项中心',
      icon: options.icon || 'puzzle',
      className: ['cgowm-addon-manager-window', options.className || ''].filter(Boolean).join(' '),
      width: options.width || 560,
      height: options.height || 'auto',
      modal: options.modal !== false,
      destroyOnClose: true,
      closeOnEscape: true,
      closeOnOverlay: true,
      zGroup: options.zGroup || 'dialog',
      content: body,
      onClose: () => {
        if (this.activeDialog === dialog) {
          this.activeDialog = null;
        }
        options.onClose?.();
      },
    });

    this.activeDialog = dialog;
    return dialog;
  }

  dispose() {
    const win = this.manager.windowRef;
    if (this.listenersBound && win?.removeEventListener) {
      win.removeEventListener('vitool:permissions-updated', this.boundPermUpdate);
      win.removeEventListener('storage', this.boundStorage);
    }
    this.listenersBound = false;
    this.capabilities.clear();
    this.windowKeys.clear();
    this.activeDialog = null;
  }
}
