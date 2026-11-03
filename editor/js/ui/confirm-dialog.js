/**
 * 开放地图编辑器 (OpenMap Editor) - 确认对话框
 *
 * 取代浏览器原生 confirm()：原生框只能放一段纯文本、按钮固定为 OK / Cancel，
 * 标题还是「localhost:8765 says」，用户很难看懂「点了 OK 会发生什么」。
 *
 * 这里基于 CGoUI <cgo-modal>，把一次确认拆成：
 *   标题（要做的事）→ 正文（后果）→ 要点列表 → 补充说明 → 明确写出动作的按钮。
 *
 * 用法：
 *   ConfirmDialog.ask({
 *       title: '切换到「悉尼」？',
 *       message: '当前工程有 6 处修改尚未导出……',
 *       details: ['…', '…'],
 *       note: '如需保留，请先导出改动。',
 *       confirmText: '放弃修改并切换',
 *       cancelText: '留在当前工程',
 *       danger: true,
 *       extra: { text: '导出改动 ZIP', icon: 'export-zip', onClick: fn },   // 不关闭对话框的辅助动作
 *       requireText: 'shanghai'   // 需要手动输入该文字才能确认（高危操作）
 *   }).then(function (ok) { … });
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.ConfirmDialog = (function () {
    'use strict';

    var modal = null;
    var pending = null;

    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function ensureModal() {
        if (modal && document.body.contains(modal)) return modal;
        modal = document.createElement('cgo-modal');
        modal.id = 'modalConfirmDialog';
        modal.setAttribute('max-width', '460px');
        modal.addEventListener('cgo-close', function () { settle(false); });
        document.body.appendChild(modal);
        return modal;
    }

    function settle(result) {
        if (!pending) return;
        var p = pending;
        pending = null;
        p.resolve(result);
    }

    function close() {
        if (!modal) return;
        if (typeof modal._close === 'function' && modal.open) modal._close();
        else modal.open = false;
        modal.classList.remove('open');
    }

    /**
     * @param {Object} opts 见文件头
     * @returns {Promise<boolean>} 点了确认按钮为 true，其余（取消 / Esc / 点遮罩 / 关闭按钮）为 false
     */
    function ask(opts) {
        var o = opts || {};
        // 上一个还没答复的确认框视为取消
        settle(false);
        var m = ensureModal();
        m.setAttribute('title', o.title || '请确认');
        m.title = o.title || '请确认';

        var details = (o.details || []).filter(Boolean);
        var html = '<div class="confirm-dialog' + (o.danger ? ' is-danger' : '') + '">' +
            '<div class="confirm-dialog-icon"><cgo-icon name="' + (o.danger ? 'warning' : (o.icon || 'info')) + '" size="22"></cgo-icon></div>' +
            '<div class="confirm-dialog-body">' +
            (o.message ? '<p class="confirm-dialog-message">' + esc(o.message) + '</p>' : '') +
            (details.length ? '<ul class="confirm-dialog-details">' + details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '') +
            (o.note ? '<p class="confirm-dialog-note">' + esc(o.note) + '</p>' : '') +
            (o.requireText ? '<label class="confirm-dialog-require">请输入 <code>' + esc(o.requireText) + '</code> 以确认' +
                '<input type="text" class="form-input" id="confirmDialogRequire" autocomplete="off" spellcheck="false"></label>' : '') +
            '</div></div>' +
            '<div class="dialog-buttons confirm-dialog-buttons">' +
            (o.extra ? '<button type="button" class="ribbon-btn-sm confirm-dialog-extra" id="confirmDialogExtra">' +
                (o.extra.icon ? '<cgo-icon name="' + esc(o.extra.icon) + '" size="12"></cgo-icon>' : '') +
                '<span>' + esc(o.extra.text) + '</span></button>' : '') +
            '<button type="button" class="ribbon-btn-sm confirm-dialog-cancel" id="confirmDialogCancel">' + esc(o.cancelText || '取消') + '</button>' +
            '<button type="button" class="ribbon-btn-sm confirm-dialog-ok' + (o.danger ? ' danger' : ' primary') + '" id="confirmDialogOk">' +
            esc(o.confirmText || '确定') + '</button>' +
            '</div>';
        m.innerHTML = html;

        var okBtn = m.querySelector('#confirmDialogOk');
        var cancelBtn = m.querySelector('#confirmDialogCancel');
        var extraBtn = m.querySelector('#confirmDialogExtra');
        var reqInput = m.querySelector('#confirmDialogRequire');

        if (reqInput) {
            okBtn.disabled = true;
            reqInput.addEventListener('input', function () {
                okBtn.disabled = reqInput.value.trim() !== String(o.requireText);
            });
            reqInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !okBtn.disabled) okBtn.click();
            });
        }

        var promise = new Promise(function (resolve) { pending = { resolve: resolve }; });

        okBtn.addEventListener('click', function () {
            if (okBtn.disabled) return;
            settle(true);
            close();
        });
        cancelBtn.addEventListener('click', function () {
            settle(false);
            close();
        });
        if (extraBtn && o.extra && typeof o.extra.onClick === 'function') {
            extraBtn.addEventListener('click', function () {
                try { o.extra.onClick(); } catch (err) { console.error('[ConfirmDialog] 辅助动作失败', err); }
            });
        }

        if (typeof m.show === 'function') m.show(); else m.open = true;
        m.classList.add('open');

        // 默认焦点：高危操作落在「取消」上，回车不会误触；普通确认落在主按钮上
        setTimeout(function () {
            var target = reqInput || (o.danger ? cancelBtn : okBtn);
            if (target && typeof target.focus === 'function') target.focus();
        }, 60);
        return promise;
    }

    return { ask: ask };
})();

window.ConfirmDialog = window.OpenMapEditor.ConfirmDialog;
