import { registerBuiltinAddons } from './builtin-addons.js';
import { CGOWM_VERSION } from './constants.js';
import { resolveCgoWmFlag, runWithCgoWmFallback } from './flags.js';
import { getDefaultManager } from './index.js';

export function installGlobalCgoWm(windowRef = globalThis.window) {
  if (!windowRef) return null;
  if (windowRef.CGoWM?.version === CGOWM_VERSION) return windowRef.CGoWM;
  const manager = getDefaultManager(windowRef);
  const requireApi = () => {
    if (!manager.initialized) throw new Error('请先调用 CGoWM.init(hostConfig)');
    return manager.publicApi;
  };
  const facade = {
    version: CGOWM_VERSION,
    init: (hostConfig) => manager.init(hostConfig),
    configureHost: (patch) => manager.configureHost(patch),
    register: (...args) => requireApi().register(...args),
    update: (...args) => requireApi().update(...args),
    open: (...args) => requireApi().open(...args),
    close: (...args) => requireApi().close(...args),
    destroy: (...args) => requireApi().destroy(...args),
    minimize: (...args) => requireApi().minimize(...args),
    restore: (...args) => requireApi().restore(...args),
    isMinimized: (...args) => requireApi().isMinimized(...args),
    setMode: (...args) => requireApi().setMode(...args),
    get: (...args) => requireApi().get(...args),
    list: () => requireApi().list(),
    bringToFront: (...args) => requireApi().bringToFront(...args),
    setMobileDetent: (...args) => requireApi().setMobileDetent(...args),
    getMobileDetent: (...args) => requireApi().getMobileDetent(...args),
    setMobileDockDucking: (...args) => requireApi().setMobileDockDucking(...args),
    setActiveMobilePanel: (...args) => requireApi().setActiveMobilePanel(...args),
    getMobileWorkspaceState: () => requireApi().getMobileWorkspaceState(),
    on: (...args) => requireApi().on(...args),
    off: (...args) => requireApi().off(...args),
    alert: (...args) => requireApi().alert(...args),
    confirm: (...args) => requireApi().confirm(...args),
    prompt: (...args) => requireApi().prompt(...args),
    dialog: (...args) => requireApi().dialog(...args),
    openRemote: (...args) => requireApi().openRemote(...args),
    destroyAll: (...args) => requireApi().destroyAll(...args),
    getWorkArea: () => requireApi().getWorkArea(),
    getSidebarWidth: (...args) => requireApi().getSidebarWidth(...args),
    setSidebarWidth: (...args) => requireApi().setSidebarWidth(...args),
    groupWindows: (...args) => requireApi().groupWindows(...args),
    ungroupWindow: (...args) => requireApi().ungroupWindow(...args),
    setActiveTab: (...args) => requireApi().setActiveTab(...args),
    hasPersistedState: (...args) => requireApi().hasPersistedState(...args),
    isWorkspaceInitialized: () => requireApi().isWorkspaceInitialized(),
    markWorkspaceInitialized: () => requireApi().markWorkspaceInitialized(),
    resetWorkspace: (...args) => requireApi().resetWorkspace(...args),
    getWorkspaceSnapshot: () => requireApi().getWorkspaceSnapshot(),
    get addons() {
      return manager.addons;
    },
    registerAddon: (manifest) => manager.addons.registerAddon(manifest),
    registerAddons: (list) => manager.addons.registerAddons(list),
    registerBuiltinAddons: (options) => registerBuiltinAddons(manager, options),
    openAddonManager: (options) => requireApi().openAddonManager(options),
    registerCapability: (name, handler) => manager.addons.registerCapability(name, handler),
    invokeCapability: (name, payload) => manager.addons.invokeCapability(name, payload),
    resolveFlag: (componentId, options = {}) => resolveCgoWmFlag(componentId, { window: windowRef, ...options }),
    runWithFallback: (options) => runWithCgoWmFallback({ ...options, options: { window: windowRef, ...options?.options } }),
    __manager: manager,
  };
  Object.freeze(facade);
  windowRef.CGoWM = facade;
  windowRef.dispatchEvent(new windowRef.CustomEvent('cgowm:loaded', { detail: { version: CGOWM_VERSION } }));
  return facade;
}

installGlobalCgoWm();
