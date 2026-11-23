import { DEFAULT_SIDEBAR_WIDTH, MOBILE_DETENTS, STORAGE_SCHEMA_VERSION } from './constants.js';
import { clamp } from './utils.js';

const PANEL_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,255}$/;

export function makeStorageKey(hostId, key) {
  return `cgowm:v${STORAGE_SCHEMA_VERSION}:${hostId}:${key}:state`;
}

export function makeWorkspaceStorageKey(hostId, programId = hostId) {
  return `cgowm:v${STORAGE_SCHEMA_VERSION}:${hostId}:${programId}:workspace:state`;
}

export function makeMobileWorkspaceStorageKey(hostId, programId = hostId) {
  return `cgowm:v${STORAGE_SCHEMA_VERSION}:${hostId}:${programId}:mobile:state`;
}

export function sanitizeMobileWorkspaceState(value, defaults = {}) {
  const defaultDetent = MOBILE_DETENTS.includes(defaults.detent) ? defaults.detent : 'half';
  const rawKey = typeof value?.activeKey === 'string' && PANEL_KEY_PATTERN.test(value.activeKey)
    ? value.activeKey
    : null;
  const fallbackKey = typeof defaults.activeKey === 'string' && PANEL_KEY_PATTERN.test(defaults.activeKey)
    ? defaults.activeKey
    : null;
  const detent = MOBILE_DETENTS.includes(value?.detent) ? value.detent : defaultDetent;
  return {
    schema: STORAGE_SCHEMA_VERSION,
    activeKey: rawKey || fallbackKey,
    detent,
  };
}

export function readMobileWorkspaceState(storage, storageKey, defaults = {}) {
  if (!storage) return sanitizeMobileWorkspaceState(null, defaults);
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return sanitizeMobileWorkspaceState(null, defaults);
    const parsed = JSON.parse(raw);
    if (parsed?.schema !== STORAGE_SCHEMA_VERSION) return sanitizeMobileWorkspaceState(null, defaults);
    return sanitizeMobileWorkspaceState(parsed, defaults);
  } catch {
    return sanitizeMobileWorkspaceState(null, defaults);
  }
}

export function writeMobileWorkspaceState(storage, storageKey, state) {
  if (!storage) return false;
  try {
    const clean = sanitizeMobileWorkspaceState(state);
    storage.setItem(storageKey, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}

export function sanitizePersistedState(value, config, viewport = {}) {
  if (!value || value.schema !== STORAGE_SCHEMA_VERSION) return null;
  const width = clamp(value.width ?? config.defaultWidth, config.minWidth, Math.max(config.minWidth, viewport.width || 4000));
  const rawHeight = value.height ?? config.defaultHeight;
  const height = rawHeight === 'auto' || !Number.isFinite(Number(rawHeight))
    ? 'auto'
    : clamp(rawHeight, config.minHeight, Math.max(config.minHeight, viewport.height || 4000));
  const dockHeight = value.dockHeight === 'auto' || value.dockHeight === undefined || value.dockHeight === null
    ? (config.dockHeight ?? 'auto')
    : clamp(value.dockHeight, config.minHeight, Math.max(config.minHeight, viewport.height || 4000));
  const maxX = Math.max(0, (viewport.width || 4000) - Math.min(width, viewport.width || width));
  const numericHeight = height === 'auto' ? config.minHeight : height;
  const maxY = Math.max(0, (viewport.height || 4000) - Math.min(numericHeight, viewport.height || numericHeight));

  return {
    schema: STORAGE_SCHEMA_VERSION,
    lifecycle: ['visible', 'minimized', 'hidden'].includes(value.lifecycle) ? value.lifecycle : 'hidden',
    mode: config.allowModes.includes(value.mode) ? value.mode : config.mode,
    sidebarSide: value.sidebarSide === 'right' ? 'right' : 'left',
    mobileDetent: config.mobileDetents.includes(value.mobileDetent) ? value.mobileDetent : config.mobileDefaultDetent,
    x: clamp(value.x ?? 0, 0, maxX),
    y: clamp(value.y ?? 0, 0, maxY),
    width,
    height,
    dockHeight,
    maximized: Boolean(value.maximized),
  };
}

export function readWindowState(storage, storageKey, config, viewport) {
  if (!storage || !config.rememberPosition) return null;
  try {
    const raw = storage.getItem(storageKey);
    return raw ? sanitizePersistedState(JSON.parse(raw), config, viewport) : null;
  } catch {
    return null;
  }
}

export function hasWindowState(storage, storageKey) {
  if (!storage) return false;
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.schema === STORAGE_SCHEMA_VERSION);
  } catch {
    return false;
  }
}

export function writeWindowState(storage, storageKey, state, config) {
  if (!storage || !config.rememberPosition) return false;
  try {
    storage.setItem(storageKey, JSON.stringify({
      schema: STORAGE_SCHEMA_VERSION,
      lifecycle: state.lifecycle,
      mode: state.mode,
      sidebarSide: state.sidebarSide,
      mobileDetent: state.mobileDetent,
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      dockHeight: state.dockHeight ?? 'auto',
      maximized: Boolean(state.maximized),
    }));
    return true;
  } catch {
    return false;
  }
}

function uniquePanelKeys(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((item) => typeof item === 'string' && PANEL_KEY_PATTERN.test(item)))];
}

function sanitizeGroups(groups) {
  if (!Array.isArray(groups)) return [];
  const usedKeys = new Set();
  const result = [];
  for (const group of groups) {
    if (!group || typeof group !== 'object') continue;
    const keys = uniquePanelKeys(group.keys).filter((key) => !usedKeys.has(key));
    if (keys.length < 2) continue;
    keys.forEach((key) => usedKeys.add(key));
    const activeKey = keys.includes(group.activeKey) ? group.activeKey : keys[0];
    const id = typeof group.id === 'string' && PANEL_KEY_PATTERN.test(group.id)
      ? group.id
      : `group-${result.length + 1}`;
    result.push({ id, keys, activeKey });
  }
  return result;
}

function sanitizeStacks(stacks) {
  if (!Array.isArray(stacks)) return [];
  const usedKeys = new Set();
  const result = [];
  for (const stack of stacks) {
    if (!stack || typeof stack !== 'object') continue;
    const keys = uniquePanelKeys(stack.keys).filter((key) => !usedKeys.has(key));
    if (keys.length < 2) continue;
    keys.forEach((key) => usedKeys.add(key));
    const id = typeof stack.id === 'string' && PANEL_KEY_PATTERN.test(stack.id)
      ? stack.id
      : `stack-${result.length + 1}`;
    result.push({ id, keys });
  }
  return result;
}

export function sanitizeWorkspaceState(value, defaults = {}) {
  const defaultWidths = defaults.widths || {};
  const minW = Number.isFinite(defaults.minSidebarWidth) ? defaults.minSidebarWidth : 120;
  const maxW = Number.isFinite(defaults.maxSidebarWidth) ? defaults.maxSidebarWidth : 960;
  const baseLeftW = Number.isFinite(defaultWidths.left) ? defaultWidths.left : DEFAULT_SIDEBAR_WIDTH;
  const baseRightW = Number.isFinite(defaultWidths.right) ? defaultWidths.right : DEFAULT_SIDEBAR_WIDTH;

  const rawLeftOrder = value?.order?.left ?? defaults.order?.left ?? [];
  const rawRightOrder = value?.order?.right ?? defaults.order?.right ?? [];
  const leftOrder = uniquePanelKeys(rawLeftOrder);
  const rightOrder = uniquePanelKeys(rawRightOrder).filter((key) => !leftOrder.includes(key));

  const dockHeights = {};
  for (const [key, height] of Object.entries(value?.dockHeights || {})) {
    if (PANEL_KEY_PATTERN.test(key) && Number.isFinite(Number(height)) && Number(height) >= 48) {
      dockHeights[key] = clamp(Number(height), 48, 4000);
    }
  }

  return {
    schema: STORAGE_SCHEMA_VERSION,
    initialized: Boolean(value?.initialized),
    activeSidebarSide: value?.activeSidebarSide === 'right' ? 'right' : 'left',
    railCollapsed: Boolean(value?.railCollapsed),
    widths: {
      left: clamp(value?.widths?.left ?? baseLeftW, minW, maxW),
      right: clamp(value?.widths?.right ?? baseRightW, minW, maxW),
    },
    order: {
      left: leftOrder,
      right: rightOrder,
    },
    dockHeights,
    groups: sanitizeGroups(value?.groups),
    stacks: sanitizeStacks(value?.stacks),
  };
}

export function readWorkspaceState(storage, storageKey, defaults = {}) {
  if (!storage) return sanitizeWorkspaceState(null, defaults);
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return sanitizeWorkspaceState(null, defaults);
    const parsed = JSON.parse(raw);
    if (parsed?.schema !== STORAGE_SCHEMA_VERSION) return sanitizeWorkspaceState(null, defaults);
    return sanitizeWorkspaceState(parsed, defaults);
  } catch {
    return sanitizeWorkspaceState(null, defaults);
  }
}

export function writeWorkspaceState(storage, storageKey, state) {
  if (!storage) return false;
  try {
    storage.setItem(storageKey, JSON.stringify({
      schema: STORAGE_SCHEMA_VERSION,
      initialized: Boolean(state.initialized),
      activeSidebarSide: state.activeSidebarSide === 'right' ? 'right' : 'left',
      railCollapsed: Boolean(state.railCollapsed),
      widths: {
        left: Math.round(Number(state.widths?.left) || DEFAULT_SIDEBAR_WIDTH),
        right: Math.round(Number(state.widths?.right) || DEFAULT_SIDEBAR_WIDTH),
      },
      order: {
        left: uniquePanelKeys(state.order?.left),
        right: uniquePanelKeys(state.order?.right),
      },
      dockHeights: state.dockHeights || {},
      groups: sanitizeGroups(state.groups),
      stacks: sanitizeStacks(state.stacks),
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearHostStorage(storage, hostId) {
  if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') return 0;
  const prefix = `cgowm:v${STORAGE_SCHEMA_VERSION}:${hostId}:`;
  const keys = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(prefix)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
  return keys.length;
}
