function readBoolean(value) {
  if (value === true || value === '1' || value === 'true') return true;
  if (value === false || value === '0' || value === 'false') return false;
  return null;
}

export function resolveCgoWmFlag(componentId, options = {}) {
  const windowRef = options.window || globalThis.window;
  const flags = options.flags || windowRef?.__CGOWM_FLAGS__ || {};
  const componentKey = `component:${componentId}`;
  const killSwitch = readBoolean(flags.killSwitch);
  if (killSwitch === true) return false;

  const configured = readBoolean(flags[componentKey] ?? flags.components?.[componentId]);
  if (configured !== null) return configured;

  const isProduction = options.production ?? flags.production ?? false;
  if (!isProduction && windowRef) {
    const query = new URLSearchParams(windowRef.location?.search || '');
    const queryGlobal = readBoolean(query.get('cgowm'));
    const queryComponent = readBoolean(query.get(`cgowm_${componentId}`));
    if (queryComponent !== null) return queryComponent;
    if (queryGlobal === false) return false;
    try {
      const localComponent = readBoolean(windowRef.localStorage?.getItem(`cgowm_component_${componentId}`));
      if (localComponent !== null) return localComponent;
      const localGlobal = readBoolean(windowRef.localStorage?.getItem('cgowm_enabled'));
      if (queryGlobal === true || localGlobal === true) return true;
    } catch {
      return queryGlobal === true;
    }
  }
  return Boolean(options.defaultEnabled ?? flags.defaultEnabled ?? false);
}

export function runWithCgoWmFallback({ componentId, createNew, createLegacy, options }) {
  if (!resolveCgoWmFlag(componentId, options)) return createLegacy();
  try {
    const result = createNew();
    if (!result) throw new Error('CGoWM 新实现未返回实例');
    return result;
  } catch (error) {
    const windowRef = options?.window || globalThis.window;
    try {
      windowRef?.dispatchEvent(new windowRef.CustomEvent('cgowm:error', {
        detail: { componentId, phase: 'fallback', code: 'new_path_failed', message: error.message },
      }));
    } catch {
      // 回退诊断失败时仍继续旧实现。
    }
    return createLegacy(error);
  }
}
