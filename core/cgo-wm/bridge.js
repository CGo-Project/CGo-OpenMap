export const CGOWM_BRIDGE_PROTOCOL = 'cgowm-bridge/v1';

function isSafeMessage(data) {
  return Boolean(
    data
    && data.protocol === CGOWM_BRIDGE_PROTOCOL
    && typeof data.type === 'string'
    && typeof data.requestId === 'string'
    && data.requestId.length <= 128
    && typeof data.sourceProgramId === 'string'
    && data.sourceProgramId.length <= 128,
  );
}

export class DesktopBridgeBroker {
  constructor(options = {}) {
    this.windowRef = options.window || globalThis.window;
    this.enabled = options.enabled === true;
    this.protocolVersion = options.protocolVersion || 1;
    this.programs = new Map();
    for (const program of options.programs || []) this.registerProgram(program);
    this.onMessage = this.onMessage.bind(this);
  }

  registerProgram(program) {
    if (!program?.programId || !program.origin || !program.windowRef) throw new TypeError('程序登记缺少 programId、origin 或 windowRef');
    this.programs.set(program.programId, {
      programId: program.programId,
      origin: new URL(program.origin).origin,
      windowRef: program.windowRef,
      panels: new Set(program.panels || []),
    });
  }

  start() {
    this.windowRef.addEventListener('message', this.onMessage);
  }

  stop() {
    this.windowRef.removeEventListener('message', this.onMessage);
  }

  onMessage(event) {
    const message = event.data;
    if (!isSafeMessage(message)) return;
    const source = this.programs.get(message.sourceProgramId);
    if (!source || source.origin !== event.origin || source.windowRef !== event.source) return;
    if (!this.enabled) return this.reply(source, message, 'response', { ok: false, error: 'remote_disabled' });
    if (message.type === 'capabilities') {
      return this.reply(source, message, 'capabilities_response', {
        ok: true,
        programs: [...this.programs.values()].map((program) => ({ programId: program.programId, panels: [...program.panels] })),
      });
    }
    if (message.type !== 'open') return this.reply(source, message, 'response', { ok: false, error: 'unsupported_message' });
    const target = this.programs.get(message.targetProgramId);
    if (!target) return this.reply(source, message, 'response', { ok: false, error: 'unknown_program' });
    if (!target.panels.has(message.panelId)) return this.reply(source, message, 'response', { ok: false, error: 'unknown_panel' });
    target.windowRef.postMessage({ ...message, type: 'open_request' }, target.origin);
    return this.reply(source, message, 'response', { ok: true, accepted: true });
  }

  reply(target, request, type, detail) {
    target.windowRef.postMessage({
      protocol: CGOWM_BRIDGE_PROTOCOL,
      protocolVersion: this.protocolVersion,
      type,
      requestId: request.requestId,
      sourceProgramId: 'desktop',
      targetProgramId: request.sourceProgramId,
      ...detail,
    }, target.origin);
  }
}

export function createBridgeClient(options = {}) {
  const windowRef = options.window || globalThis.window;
  const targetWindow = options.targetWindow || windowRef.parent;
  const targetOrigin = new URL(options.targetOrigin, windowRef.location?.href).origin;
  const programId = options.programId;
  const timeoutMs = options.timeoutMs || 3000;
  let sequence = 0;
  const pending = new Map();

  const onMessage = (event) => {
    const message = event.data;
    if (event.origin !== targetOrigin || event.source !== targetWindow || !isSafeMessage(message)) return;
    const request = pending.get(message.requestId);
    if (!request) return;
    pending.delete(message.requestId);
    windowRef.clearTimeout(request.timer);
    request.resolve(message);
  };
  windowRef.addEventListener('message', onMessage);

  const request = (type, detail = {}) => new Promise((resolve) => {
    const requestId = `${programId}-${Date.now()}-${++sequence}`;
    const timer = windowRef.setTimeout(() => {
      pending.delete(requestId);
      resolve({ ok: false, error: 'timeout', requestId });
    }, timeoutMs);
    pending.set(requestId, { resolve, timer });
    targetWindow.postMessage({
      protocol: CGOWM_BRIDGE_PROTOCOL,
      protocolVersion: 1,
      type,
      requestId,
      sourceProgramId: programId,
      ...detail,
    }, targetOrigin);
  });

  return {
    getCapabilities: () => request('capabilities'),
    openRemote: (targetProgramId, panelId) => request('open', { targetProgramId, panelId }),
    dispose() {
      windowRef.removeEventListener('message', onMessage);
      for (const { timer, resolve } of pending.values()) {
        windowRef.clearTimeout(timer);
        resolve({ ok: false, error: 'disposed' });
      }
      pending.clear();
    },
  };
}
