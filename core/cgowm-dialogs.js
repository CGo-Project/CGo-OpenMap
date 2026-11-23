/**
 * CGo OpenMap - CGoWM 统一模态框与系统对话框桥接 (core/cgowm-dialogs.js)
 *
 * 为 core/* 与 core/shared/* 提供统一的 `window.CGoDialogs` 与
 * `window.cgoAlert` / `window.cgoConfirm` / `window.cgoPrompt`：
 *   - 运行时优先接入 CGoWM（Focus Trap、ESC 关闭、防滚动链）；
 *   - 在 headless / Node VM 单元测试（selfcheck / fuzhou_viewer_check）或未加载
 *     CGoWM 时安全返回 null / 回退原生对话框，不破坏原有测试契约。
 */
(function (global) {
    'use strict';

    function getApi() {
        var adapter = global.CGoWMAdapter;
        if (!adapter) return null;
        if (typeof adapter.init === 'function' && !adapter.isActive()) {
            adapter.init();
        }
        return typeof adapter.getApi === 'function' ? adapter.getApi() : null;
    }

    function normalizeContent(content) {
        if (!content) return '';
        if (typeof content === 'string') {
            return {
                kind: 'factory',
                mount: function (target) {
                    target.innerHTML = content;
                }
            };
        }
        if (typeof content === 'function') {
            return { kind: 'factory', mount: content };
        }
        if (content.kind) return content;
        if (content.nodeType === 1 || content.nodeType === 11) {
            return { kind: 'element', element: content };
        }
        return content;
    }

    function dialog(opts) {
        opts = opts || {};
        var api = getApi();
        if (!api || typeof api.dialog !== 'function') return null;

        if (opts.panelId && opts.replace !== false && typeof api.get === 'function') {
            var existing = api.get(opts.panelId) || api.get('openmap:' + opts.panelId);
            if (existing && opts.destroyOnClose !== false) {
                try { existing.destroy(); } catch (_) {}
            }
        }

        var width = Number(opts.width);
        var height = opts.height === 'auto' ? 'auto' : Number(opts.height);
        var inst = api.dialog({
            panelId: opts.panelId || ('dialog-' + Date.now()),
            title: opts.title || '提示',
            icon: opts.icon || '',
            className: opts.className || '',
            content: normalizeContent(opts.content),
            modal: opts.modal !== false,
            width: Number.isFinite(width) && width > 0 ? width : 460,
            height: height === 'auto' || (Number.isFinite(height) && height > 0) ? height : 'auto',
            minWidth: Number(opts.minWidth) > 0 ? Number(opts.minWidth) : 280,
            minHeight: Number(opts.minHeight) > 0 ? Number(opts.minHeight) : 140,
            resizable: opts.resizable === true,
            showMinimize: false,
            showMaximize: false,
            showClose: opts.showClose !== false,
            closeOnEscape: opts.closeOnEscape !== false,
            closeOnOverlay: opts.closeOnOverlay !== false,
            destroyOnClose: opts.destroyOnClose !== false,
            onClose: typeof opts.onClose === 'function' ? opts.onClose : undefined
        });

        if (inst && inst.element) {
            if (Number.isFinite(width) && width > 0) {
                inst.element.style.setProperty('--cwm-modal-width', width + 'px');
            }
            if (opts.maxWidth) {
                inst.element.style.setProperty('--cwm-modal-width', String(opts.maxWidth));
            }
        }
        return inst;
    }

    function alertDialog(message, opts) {
        opts = opts || {};
        var api = getApi();
        if (!api || typeof api.alert !== 'function') {
            try {
                if (typeof global.alert === 'function') global.alert(String(message || ''));
            } catch (_) {}
            return Promise.resolve();
        }
        return api.alert(String(message || ''), {
            title: opts.title || '提示',
            icon: opts.icon || 'info',
            confirmText: opts.confirmText || opts.okText || '确定',
            width: opts.width || 400
        });
    }

    function confirmDialog(message, opts) {
        opts = opts || {};
        var api = getApi();
        if (!api || typeof api.confirm !== 'function') {
            try {
                if (typeof global.confirm === 'function') return Promise.resolve(!!global.confirm(String(message || '')));
            } catch (_) {}
            return Promise.resolve(false);
        }
        return api.confirm(String(message || ''), {
            title: opts.title || '请确认',
            icon: opts.icon || (opts.danger ? 'warning' : 'help'),
            confirmText: opts.confirmText || opts.okText || '确定',
            cancelText: opts.cancelText || '取消',
            danger: !!opts.danger,
            width: opts.width || 420
        });
    }

    function promptDialog(message, opts) {
        opts = opts || {};
        var api = getApi();
        if (!api || typeof api.prompt !== 'function') {
            try {
                if (typeof global.prompt === 'function') {
                    return Promise.resolve(global.prompt(String(message || ''), opts.defaultValue || ''));
                }
            } catch (_) {}
            return Promise.resolve(null);
        }
        return api.prompt(String(message || ''), {
            title: opts.title || '输入',
            icon: opts.icon || 'edit',
            defaultValue: opts.defaultValue != null ? String(opts.defaultValue) : '',
            placeholder: opts.placeholder || '',
            confirmText: opts.confirmText || '确定',
            cancelText: opts.cancelText || '取消',
            width: opts.width || 420
        });
    }

    function showHelp(content, opts) {
        opts = opts || {};
        return dialog({
            panelId: opts.panelId || 'help',
            title: opts.title || '帮助与关于',
            icon: opts.icon || 'help',
            className: ['cgowm-help-dialog', opts.className].filter(Boolean).join(' '),
            content: content,
            modal: true,
            width: opts.width || 560,
            minWidth: 320,
            minHeight: 260,
            resizable: opts.resizable !== false,
            destroyOnClose: true,
            closeOnOverlay: true,
            onClose: opts.onClose
        });
    }

    function showSettings(content, opts) {
        opts = opts || {};
        return dialog({
            panelId: opts.panelId || 'settings',
            title: opts.title || '偏好设置',
            icon: opts.icon || 'settings',
            className: ['openmap-settings-dialog', opts.className].filter(Boolean).join(' '),
            content: content,
            modal: true,
            width: opts.width || 440,
            minWidth: 320,
            minHeight: 240,
            resizable: false,
            destroyOnClose: opts.destroyOnClose === true,
            closeOnOverlay: true,
            onClose: opts.onClose
        });
    }

    global.CGoDialogs = {
        dialog: dialog,
        alert: alertDialog,
        confirm: confirmDialog,
        prompt: promptDialog,
        showHelp: showHelp,
        showSettings: showSettings
    };
    global.cgoAlert = alertDialog;
    global.cgoConfirm = confirmDialog;
    global.cgoPrompt = promptDialog;
})(typeof window !== 'undefined' ? window : globalThis);
