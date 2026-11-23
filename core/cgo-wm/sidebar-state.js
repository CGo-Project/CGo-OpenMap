const SCHEMA_VERSION = 1;
const PANEL_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,255}$/;

function uniqueKeys(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value) => typeof value === 'string' && PANEL_KEY_PATTERN.test(value)))];
}

function normalize(value, defaults) {
  const left = uniqueKeys(value?.left ?? defaults.left);
  const right = uniqueKeys(value?.right ?? defaults.right).filter((key) => !left.includes(key));
  const defaultMinimized = defaults?.minimized || {};
  const minimized = {
    ...Object.fromEntries(
      Object.entries(defaultMinimized)
        .filter(([key, state]) => PANEL_KEY_PATTERN.test(key) && typeof state === 'boolean')
    ),
    ...Object.fromEntries(
      Object.entries(value?.minimized || {})
        .filter(([key, state]) => PANEL_KEY_PATTERN.test(key) && typeof state === 'boolean'),
    ),
  };
  return {
    schema: SCHEMA_VERSION,
    left,
    right,
    pinned: typeof value?.pinned === 'boolean' ? value.pinned : Boolean(defaults.pinned),
    minimized,
  };
}

export function createSidebarStateStore(options = {}) {
  const storage = options.storage || globalThis.localStorage;
  const hostId = options.hostId || 'web';
  const programId = options.programId || hostId;
  const storageKey = options.storageKey || `cgowm:v1:${hostId}:${programId}:sidebar-layout:state`;
  const defaults = normalize(options.defaults || { left: [], right: [], pinned: false }, {});
  let state = defaults;

  try {
    const parsed = JSON.parse(storage?.getItem(storageKey));
    if (parsed?.schema === SCHEMA_VERSION) state = normalize(parsed, defaults);
  } catch {
    state = defaults;
  }

  const persist = () => {
    try {
      storage?.setItem(storageKey, JSON.stringify(state));
    } catch {
      // 无持久化能力时保留当前会话状态。
    }
  };

  return {
    storageKey,
    getSnapshot: () => ({ ...state, left: [...state.left], right: [...state.right], minimized: { ...state.minimized } }),
    setLayout(patch = {}) {
      state = normalize({ ...state, ...patch, minimized: { ...state.minimized, ...patch.minimized } }, defaults);
      persist();
      return this.getSnapshot();
    },
    setMinimized(panelKey, minimized) {
      if (!PANEL_KEY_PATTERN.test(panelKey)) return this.getSnapshot();
      return this.setLayout({ minimized: { [panelKey]: Boolean(minimized) } });
    },
    remove(panelKey) {
      const minimized = { ...state.minimized };
      delete minimized[panelKey];
      state = normalize({
        ...state,
        left: state.left.filter((key) => key !== panelKey),
        right: state.right.filter((key) => key !== panelKey),
        minimized,
      }, defaults);
      persist();
      return this.getSnapshot();
    },
    clear() {
      state = defaults;
      try {
        storage?.removeItem(storageKey);
      } catch {
        // 忽略存储清理失败。
      }
      return this.getSnapshot();
    },
  };
}
