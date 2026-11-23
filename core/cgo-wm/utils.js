import {
  ALL_MODES,
  DEFAULT_CONFIG,
  DEFAULT_MOBILE_BREAKPOINT,
  DESKTOP_MODES,
  MINIMIZE_MODES,
  MOBILE_DETENTS,
  MOBILE_MODES,
} from './constants.js';

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

export function assertIdentifier(value, name) {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) {
    throw new TypeError(`${name} 必须是 1-128 位安全标识符`);
  }
  return value;
}

export function makeWindowKey(programId, panelId) {
  return `${assertIdentifier(programId, 'programId')}:${assertIdentifier(panelId, 'panelId')}`;
}

export function clamp(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(Math.max(numeric, min), max);
}

export function normalizeConfig(input = {}, host = {}) {
  const programId = assertIdentifier(input.programId || host.programId || host.hostId || 'cgo', 'programId');
  const panelId = assertIdentifier(input.panelId || input.id, 'panelId');
  const allowModes = Array.isArray(input.allowModes)
    ? [...new Set(input.allowModes.filter((mode) => DESKTOP_MODES.includes(mode)))]
    : [...DEFAULT_CONFIG.allowModes];
  if (!allowModes.length) allowModes.push('float');

  let mode = ALL_MODES.includes(input.mode) ? input.mode : DEFAULT_CONFIG.mode;
  if (!DESKTOP_MODES.includes(mode) || !allowModes.includes(mode)) mode = allowModes[0];
  if (mode === 'window' && host.environment !== 'desktop') mode = allowModes.includes('float') ? 'float' : allowModes[0];

  const mobileMode = MOBILE_MODES.includes(input.mobileMode) ? input.mobileMode : DEFAULT_CONFIG.mobileMode;
  const mobileDetents = Array.isArray(input.mobileDetents)
    ? MOBILE_DETENTS.filter((detent) => input.mobileDetents.includes(detent))
    : [...DEFAULT_CONFIG.mobileDetents];
  if (!mobileDetents.length && mobileMode === 'sheet') mobileDetents.push('half');
  const mobileDefaultDetent = mobileDetents.includes(input.mobileDefaultDetent)
    ? input.mobileDefaultDetent
    : mobileDetents.includes(DEFAULT_CONFIG.mobileDefaultDetent)
      ? DEFAULT_CONFIG.mobileDefaultDetent
      : mobileDetents[0] || null;

  const minimizeMode = MINIMIZE_MODES.includes(input.minimizeMode)
    ? input.minimizeMode
    : DEFAULT_CONFIG.minimizeMode;
  const minHeight = clamp(input.minHeight ?? DEFAULT_CONFIG.minHeight, 48, 2000);
  const rawDefaultHeight = input.defaultHeight ?? DEFAULT_CONFIG.defaultHeight;
  const defaultHeight = rawDefaultHeight === 'auto' || !Number.isFinite(Number(rawDefaultHeight))
    ? 'auto'
    : clamp(rawDefaultHeight, minHeight, 4000);
  const autoHeight = input.autoHeight !== undefined
    ? Boolean(input.autoHeight)
    : defaultHeight === 'auto';
  const rawDockHeight = input.dockHeight ?? DEFAULT_CONFIG.dockHeight;
  const dockHeight = rawDockHeight === 'auto' || !Number.isFinite(Number(rawDockHeight))
    ? 'auto'
    : clamp(rawDockHeight, minHeight, 4000);
  const desktopPresentation = ['modal', 'fullscreen', 'embedded'].includes(input.desktopPresentation)
    ? input.desktopPresentation
    : null;
  const groupable = input.groupable !== false && !desktopPresentation;
  const mobileAlwaysAvailable = Boolean(input.mobileAlwaysAvailable);
  const mobileGroup = input.mobileGroup === 'addon' ? 'addon' : 'primary';
  const mobileSlot = input.mobileSlot === 'action' ? 'action' : 'pill';
  const badge = typeof input.badge === 'string' ? input.badge.trim() : '';
  const unavailable = Boolean(input.unavailable);

  return {
    ...DEFAULT_CONFIG,
    ...input,
    programId,
    panelId,
    key: makeWindowKey(programId, panelId),
    mode,
    allowModes,
    mobileMode,
    mobileDetents,
    mobileDefaultDetent,
    mobileAlwaysAvailable,
    mobileGroup,
    mobileSlot,
    badge,
    unavailable,
    desktopPresentation,
    minimizeMode,
    groupable,
    defaultHeight,
    autoHeight,
    dockHeight,
    defaultWidth: clamp(input.defaultWidth ?? DEFAULT_CONFIG.defaultWidth, 120, 4000),
    minWidth: clamp(input.minWidth ?? DEFAULT_CONFIG.minWidth, 120, 2000),
    minHeight,
    mobileBreakpoint: clamp(host.mobileBreakpoint ?? DEFAULT_MOBILE_BREAKPOINT, 320, 1280),
  };
}

export function resolveEffectiveMode(config, viewportWidth) {
  if (viewportWidth <= config.mobileBreakpoint) return config.mobileMode;
  return config.mode;
}

export function isElement(value) {
  return Boolean(value && typeof value === 'object' && value.nodeType === 1);
}

export function normalizeContent(content) {
  if (!content) return { kind: 'empty' };
  if (isElement(content)) return { kind: 'element', element: content };
  if (typeof content === 'string') return { kind: 'iframe', src: content };
  if (content.kind === 'empty') return content;
  if (content.kind === 'element' && isElement(content.element)) return content;
  if (content.kind === 'factory' && typeof content.mount === 'function') return content;
  if (content.kind === 'iframe' && typeof content.src === 'string') return content;
  throw new TypeError('content 必须是 HTMLElement、iframe 配置或 mount 工厂');
}

export function safeCssLength(value, fallback = 'auto') {
  if (value === 'auto') return 'auto';
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? `${numeric}px` : fallback;
}

export function getFocusableElements(root) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}
