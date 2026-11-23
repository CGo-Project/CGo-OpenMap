function createDialogContent(manager, kind, message, options, settle) {
  const doc = manager.documentRef;
  const wrapper = doc.createElement('form');
  wrapper.className = `cgowm-dialog cgowm-dialog-${kind}`;
  wrapper.addEventListener('submit', (event) => event.preventDefault());

  const body = doc.createElement('div');
  body.className = 'cgowm-dialog-message';
  body.textContent = String(message ?? '');
  wrapper.appendChild(body);

  let input = null;
  if (kind === 'prompt') {
    input = doc.createElement(options.multiline ? 'textarea' : 'input');
    input.className = 'cgowm-dialog-input';
    input.value = options.defaultValue ?? '';
    input.placeholder = options.placeholder || '';
    input.setAttribute('aria-label', options.inputLabel || String(message || '请输入内容'));
    wrapper.appendChild(input);
  }

  const actions = doc.createElement('div');
  actions.className = 'cgowm-dialog-actions';
  if (kind !== 'alert') {
    const cancel = doc.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cgowm-dialog-button cgowm-dialog-cancel';
    cancel.textContent = options.cancelText || '取消';
    cancel.addEventListener('click', () => settle(kind === 'prompt' ? null : false));
    actions.appendChild(cancel);
  }
  const confirm = doc.createElement('button');
  confirm.type = 'submit';
  confirm.className = `cgowm-dialog-button cgowm-dialog-confirm${options.danger ? ' is-danger' : ''}`;
  confirm.textContent = options.confirmText || '确定';
  confirm.addEventListener('click', () => settle(kind === 'prompt' ? input.value : true));
  actions.appendChild(confirm);
  wrapper.appendChild(actions);
  wrapper.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (!options.multiline || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      settle(kind === 'prompt' ? input.value : true);
    }
  });
  return { wrapper, input, confirm };
}

export function createDialogApi(manager) {
  let sequence = 0;

  const showSimple = (kind, message, options = {}) => new Promise((resolve) => {
    const panelId = `dialog-${kind}-${Date.now()}-${++sequence}`;
    let instance = null;
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      instance?.destroy();
      resolve(value);
    };
    const { wrapper, input, confirm } = createDialogContent(manager, kind, message, options, settle);
    instance = manager.register({
      programId: manager.host.programId,
      panelId,
      title: options.title || (kind === 'confirm' ? '请确认' : kind === 'prompt' ? '请输入' : '提示'),
      icon: options.icon !== undefined ? options.icon : (kind === 'confirm' ? 'help' : kind === 'prompt' ? 'edit' : 'info'),
      content: wrapper,
      mode: 'float',
      allowModes: ['float'],
      desktopPresentation: 'modal',
      mobileMode: 'modal',
      showMinimize: false,
      showMaximize: false,
      showClose: options.showClose !== false,
      closeOnEscape: true,
      closeOnOverlay: options.closeOnOverlay !== false,
      rememberPosition: false,
      resizable: options.resizable !== false,
      groupable: false,
      defaultWidth: options.width || 400,
      defaultHeight: options.height ?? 'auto',
      minWidth: options.minWidth || 260,
      minHeight: options.minHeight || 120,
      zGroup: 'dialog',
      role: 'alertdialog',
    });
    const originalClose = instance.close.bind(instance);
    instance.close = () => {
      const result = originalClose();
      settle(kind === 'prompt' ? null : kind === 'confirm' ? false : true);
      return result;
    };
    instance.open();
    manager.windowRef.requestAnimationFrame(() => (input || confirm).focus({ preventScroll: true }));
  });

  const showDialog = (options = {}) => {
    const panelId = options.panelId || `dialog-custom-${Date.now()}-${++sequence}`;
    const key = `${manager.host.programId}:${panelId}`;
    const isModal = options.modal !== false;
    const destroyOnClose = options.destroyOnClose !== false;
    const existing = manager.get(key);
    if (existing && existing.state.lifecycle !== 'destroyed') {
      if (options.title) existing.update({ title: options.title });
      existing.__cgowmDialogOnClose = typeof options.onClose === 'function' ? options.onClose : existing.__cgowmDialogOnClose;
      existing.__cgowmDialogClosedNotified = false;
      existing.open();
      existing.bringToFront();
      return existing;
    }

    const viewportW = manager.windowRef.innerWidth || 1024;
    const viewportH = manager.windowRef.innerHeight || 768;
    const width = options.width || 420;
    const height = options.height ?? 'auto';
    const estH = Number.isFinite(Number(height)) ? Number(height) : 320;
    const defaultPosition = options.defaultPosition || (isModal ? null : {
      x: Math.max(16, Math.round((viewportW - width) / 2)),
      y: Math.max(56, Math.round((viewportH - estH) / 2)),
    });

    const instance = manager.register({
      programId: manager.host.programId,
      panelId,
      elementId: options.elementId || undefined,
      title: options.title || '对话框',
      shortTitle: options.shortTitle || options.title || '',
      icon: options.icon !== undefined ? options.icon : 'window',
      className: ['cgowm-custom-dialog', options.className || ''].filter(Boolean).join(' '),
      content: options.content,
      mode: 'float',
      allowModes: ['float'],
      desktopPresentation: isModal ? 'modal' : null,
      mobileMode: isModal ? 'modal' : (options.mobileMode || 'sheet'),
      showMinimize: isModal ? false : options.showMinimize === true,
      showMaximize: false,
      minimizeMode: 'collapse',
      showClose: options.showClose !== false,
      closeOnEscape: options.closeOnEscape !== false,
      closeOnOverlay: isModal ? options.closeOnOverlay !== false : false,
      rememberPosition: options.rememberPosition === true,
      resizable: options.resizable !== false,
      groupable: false,
      defaultWidth: width,
      defaultHeight: height,
      minWidth: options.minWidth || 260,
      minHeight: options.minHeight || 120,
      defaultPosition,
      zGroup: options.zGroup || (isModal ? 'dialog' : 'overlay'),
      role: isModal ? 'dialog' : 'region',
      restoreStateOnRegister: false,
    });

    instance.__cgowmDialogOnClose = typeof options.onClose === 'function' ? options.onClose : null;
    instance.__cgowmDialogClosing = false;
    instance.__cgowmDialogClosedNotified = false;

    const notifyClose = () => {
      if (instance.__cgowmDialogClosedNotified) return;
      instance.__cgowmDialogClosedNotified = true;
      try {
        instance.__cgowmDialogOnClose?.(instance);
      } catch (error) {
        manager.reportError(error, { phase: 'dialogOnClose', key: instance.key });
      }
    };

    const rawOpen = instance.open.bind(instance);
    instance.open = (...args) => {
      instance.__cgowmDialogClosedNotified = false;
      return rawOpen(...args);
    };

    const rawClose = instance.close.bind(instance);
    const rawDestroy = instance.destroy.bind(instance);

    instance.close = () => {
      if (instance.__cgowmDialogClosing) return false;
      instance.__cgowmDialogClosing = true;
      try {
        const result = rawClose();
        notifyClose();
        if (destroyOnClose && instance.state.lifecycle !== 'destroyed') {
          rawDestroy();
        }
        return result;
      } finally {
        instance.__cgowmDialogClosing = false;
      }
    };

    instance.destroy = () => {
      if (instance.__cgowmDialogClosing) return false;
      instance.__cgowmDialogClosing = true;
      try {
        notifyClose();
        return rawDestroy();
      } finally {
        instance.__cgowmDialogClosing = false;
      }
    };

    instance.open();
    return instance;
  };

  return {
    alert: (message, options) => showSimple('alert', message, options),
    confirm: (message, options) => showSimple('confirm', message, options),
    prompt: (message, options) => showSimple('prompt', message, options),
    dialog: (options) => showDialog(options),
  };
}
