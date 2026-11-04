/**
 * 开放地图编辑器 (OpenMap Editor) - 画布右键菜单
 *
 * ContextMenu.show(clientX, clientY, items)
 *   items: [
 *     { header: '车站「人民广场」' },
 *     { label: '复制', icon: 'copy', shortcut: 'Ctrl+C', onClick: fn },
 *     { label: '删除', icon: 'delete', danger: true, disabled: false, onClick: fn },
 *     { separator: true }
 *   ]
 * 点击菜单外、按 Esc、滚动或窗口失焦时自动关闭；支持方向键 / 回车键盘操作。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.ContextMenu = (function () {
    'use strict';

    var el = null;
    var cleanup = [];

    function esc(v) {
        return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function hide() {
        if (el) { el.remove(); el = null; }
        cleanup.forEach(function (fn) { fn(); });
        cleanup = [];
    }

    function on(target, type, fn, opts) {
        target.addEventListener(type, fn, opts);
        cleanup.push(function () { target.removeEventListener(type, fn, opts); });
    }

    function show(x, y, items) {
        hide();
        var list = (items || []).filter(Boolean);
        if (!list.length) return;
        el = document.createElement('div');
        el.className = 'cgo-context-menu';
        el.setAttribute('role', 'menu');
        el.innerHTML = list.map(function (it, i) {
            if (it.separator) return '<div class="ctx-sep" role="separator"></div>';
            if (it.header) return '<div class="ctx-header">' + esc(it.header) + '</div>';
            return '<button type="button" class="ctx-item' + (it.danger ? ' danger' : '') + '" role="menuitem" data-i="' + i + '"' +
                (it.disabled ? ' disabled' : '') + '>' +
                '<span class="ctx-icon">' + (it.icon ? '<cgo-icon name="' + esc(it.icon) + '" size="13"></cgo-icon>' : '') + '</span>' +
                '<span class="ctx-label">' + esc(it.label) + '</span>' +
                (it.shortcut ? '<span class="ctx-kbd">' + esc(it.shortcut) + '</span>' : '') +
                '</button>';
        }).join('');
        document.body.appendChild(el);

        // 贴边翻转，保证菜单完整落在窗口内
        var r = el.getBoundingClientRect();
        var left = Math.min(x, window.innerWidth - r.width - 6);
        var top = (y + r.height > window.innerHeight - 6) ? Math.max(6, y - r.height) : y;
        el.style.left = Math.max(6, left) + 'px';
        el.style.top = top + 'px';

        var buttons = Array.prototype.slice.call(el.querySelectorAll('.ctx-item:not([disabled])'));
        el.addEventListener('click', function (e) {
            var b = e.target.closest('.ctx-item');
            if (!b || b.disabled) return;
            var it = list[parseInt(b.getAttribute('data-i'), 10)];
            hide();
            if (it && typeof it.onClick === 'function') it.onClick();
        });
        el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        el.addEventListener('keydown', function (e) {
            var idx = buttons.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') { e.preventDefault(); (buttons[idx + 1] || buttons[0]).focus(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); (buttons[idx - 1] || buttons[buttons.length - 1]).focus(); }
        });
        setTimeout(function () {
            on(document, 'mousedown', function (e) { if (el && !el.contains(e.target)) hide(); }, true);
            on(document, 'keydown', function (e) { if (e.key === 'Escape') hide(); }, true);
            on(window, 'blur', hide);
            on(window, 'resize', hide);
            on(document, 'wheel', hide, { passive: true, capture: true });
        }, 0);
        if (buttons[0]) buttons[0].focus({ preventScroll: true });
    }

    return { show: show, hide: hide };
})();
