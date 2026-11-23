import { CgoWindowManager } from './manager.js';

export { CgoWindowManager, CgoWindowInstance } from './manager.js';
export { CgoAddonManager, makeAddonEnabledStorageKey, makeGlobalAddonDataStorageKey } from './addons.js';
export { registerBuiltinAddons, getBuiltinAddonDefinitions, resolveSiteRoot, resolveVitoolRoot } from './builtin-addons.js';
export { resolveCgoWmFlag, runWithCgoWmFallback } from './flags.js';
export { createSidebarStateStore } from './sidebar-state.js';
export { createSanitizedSvg, appendSafeVisual } from './sanitize.js';
export { calculateSheetDetents, chooseSheetDetent, SheetController } from './sheet-controller.js';
export {
  createLeaf,
  createSplit,
  splitLeaf,
  removeLeaf,
  updateSplitRatio,
  listLeaves,
  calculateLayout,
  validateLayoutTree,
} from './layout-tree.js';
export { DesktopBridgeBroker, createBridgeClient, CGOWM_BRIDGE_PROTOCOL } from './bridge.js';
export {
  snapFloatingRect,
  mergeWindowIntoGroup,
  removeWindowFromGroups,
  attachWindowToStack,
  detachWindowFromStacks,
  reorderKeyList,
} from './workspace.js';
export * from './constants.js';

const defaultManagers = new WeakMap();

export function createCgoWindowManager(options = {}) {
  return new CgoWindowManager(options);
}

export function getDefaultManager(windowRef = globalThis.window) {
  if (!windowRef) throw new Error('当前环境没有 window，无法创建默认 CGoWM');
  if (!defaultManagers.has(windowRef)) defaultManagers.set(windowRef, new CgoWindowManager({ window: windowRef }));
  return defaultManagers.get(windowRef);
}

export function init(hostConfig = {}, windowRef = globalThis.window) {
  return getDefaultManager(windowRef).init(hostConfig);
}
