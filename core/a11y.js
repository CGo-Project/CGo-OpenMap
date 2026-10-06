/**
 * CGo OpenMap - 无障碍与通用文本安全工具 (core/a11y.js)
 *
 * ==============================================================================
 * 作用：为核心引擎与各面板提供与城市无关的公共能力，统一挂在 window.CGoA11y：
 * 1. escapeHtml / safeNameHtml：把站名、线路名拼进 innerHTML 前的转义；
 * 2. announce：向常驻的 role="status" 隐藏区域写入一条读屏播报；
 * 3. prefersReducedMotion：读取系统「减少动态效果」偏好；
 * 4. 键盘激活：让 role="button" / role="tab" 的非原生元素响应 Enter / Space；
 * 5. 选项卡 (tablist)、折叠头 (aria-expanded)、下拉菜单状态同步；
 * 6. Service Worker 换代提示（只提示，不自动刷新）。
 *
 * 本文件为普通脚本（非 module），须早于 core/station-board.js 与 core/script.js 加载。
 * ==============================================================================
 */
(function () {
    'use strict';

    const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

    /**
     * 转义 HTML 特殊字符，可安全用于元素内容与双引号 / 单引号属性值
     */
    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => HTML_ESCAPE_MAP[ch]);
    }

    /**
     * 站名专用：先整体转义，再放行城市数据里实际在用的纯排版标签
     * （<br> 换行、<sup>/<sub> 序数上下标，均不带属性），其余标签一律按文本显示。
     */
    function safeNameHtml(value) {
        return escapeHtml(value)
            .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
            .replace(/&lt;(\/?)(sup|sub)&gt;/gi, '<$1$2>');
    }

    /** 去掉站名里的排版标签，得到适合 aria-label / title 的纯文本 */
    function plainName(value) {
        return String(value == null ? '' : value)
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // --------------------------------------------------------------------------
    // 读屏播报区
    // --------------------------------------------------------------------------
    let announceTimer = null;
    function getStatusRegion() {
        let region = document.getElementById('cgo-a11y-status');
        if (!region && document.body) {
            region = document.createElement('div');
            region.id = 'cgo-a11y-status';
            region.className = 'sr-only';
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            document.body.appendChild(region);
        }
        return region;
    }

    /**
     * 播报一条状态消息。先清空再写入，保证连续两次相同文案也会被读出。
     */
    function announce(message) {
        const region = getStatusRegion();
        if (!region) return;
        const text = plainName(message);
        region.textContent = '';
        if (announceTimer) clearTimeout(announceTimer);
        if (!text) return;
        announceTimer = setTimeout(() => { region.textContent = text; }, 60);
    }

    // --------------------------------------------------------------------------
    // 动效偏好
    // --------------------------------------------------------------------------
    const reducedMotionQuery = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    function prefersReducedMotion() {
        return Boolean(reducedMotionQuery && reducedMotionQuery.matches);
    }

    // --------------------------------------------------------------------------
    // 焦点工具
    // --------------------------------------------------------------------------
    function isVisible(el) {
        return Boolean(el && el.isConnected && el.getClientRects().length > 0);
    }

    function focusElement(el) {
        if (!isVisible(el)) return false;
        try {
            el.focus({ preventScroll: true });
        } catch (_) {
            el.focus();
        }
        return document.activeElement === el;
    }

    // --------------------------------------------------------------------------
    // 非原生控件的键盘激活：Enter / Space 等价于点击
    // --------------------------------------------------------------------------
    const KEY_ACTIVATABLE = '[role="button"], [role="tab"], [role="link"]';
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
        const target = e.target;
        if (!target || typeof target.matches !== 'function') return;
        // 原生 button / a / 表单控件自带键盘激活，这里只补手写角色的元素
        if (target.matches('button, a[href], input, select, textarea, summary')) return;
        if (!target.matches(KEY_ACTIVATABLE)) return;
        if (target.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();
        target.click();
    });

    // --------------------------------------------------------------------------
    // 选项卡：tablist / tab / tabpanel + 方向键
    // --------------------------------------------------------------------------
    function syncTabs(root) {
        const tabs = Array.from(root.querySelectorAll('.panel-tabs-nav .tab-item'));
        tabs.forEach(tab => {
            const selected = tab.classList.contains('active');
            tab.setAttribute('aria-selected', selected ? 'true' : 'false');
            tab.setAttribute('tabindex', selected ? '0' : '-1');
        });
        // 没有任何选中项时仍保留一个 Tab 停靠点
        if (tabs.length && !tabs.some(tab => tab.classList.contains('active'))) {
            tabs[0].setAttribute('tabindex', '0');
        }
    }

    /**
     * 为信息板内的选项卡补 ARIA 语义与方向键切换。
     * 须在选项卡自身的 click 监听绑定之后调用：状态同步依赖同一元素上监听的先后顺序。
     */
    function enhanceTabs(root) {
        if (!root) return;
        const nav = root.querySelector('.panel-tabs-nav');
        if (!nav) return;
        const tabs = Array.from(nav.querySelectorAll('.tab-item'));
        if (!tabs.length) return;
        nav.setAttribute('role', 'tablist');
        if (!nav.hasAttribute('aria-label')) nav.setAttribute('aria-label', '线路与车站信息');
        tabs.forEach(tab => {
            const key = String(tab.dataset.tabIndex);
            const tabId = `cgo-sb-tab-${key}`;
            const paneId = `cgo-sb-pane-${key}`;
            tab.id = tabId;
            tab.setAttribute('role', 'tab');
            const pane = Array.from(root.querySelectorAll('.tab-pane'))
                .find(p => String(p.dataset.tabIndex) === key);
            if (pane) {
                pane.id = paneId;
                pane.setAttribute('role', 'tabpanel');
                pane.setAttribute('aria-labelledby', tabId);
                tab.setAttribute('aria-controls', paneId);
            }
            tab.addEventListener('click', () => syncTabs(root));
            tab.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                const current = Array.from(nav.querySelectorAll('.tab-item'))
                    .filter(item => item.getClientRects().length > 0);
                const index = current.indexOf(tab);
                if (index === -1) return;
                let next = -1;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % current.length;
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + current.length) % current.length;
                else if (e.key === 'Home') next = 0;
                else if (e.key === 'End') next = current.length - 1;
                if (next === -1) return;
                e.preventDefault();
                e.stopPropagation();
                current[next].click();
                focusElement(current[next]);
            });
        });
        syncTabs(root);
    }

    // --------------------------------------------------------------------------
    // 折叠头：按容器 class 同步 aria-expanded
    // --------------------------------------------------------------------------
    function syncDisclosures(root) {
        if (!root) return;
        root.querySelectorAll('.panel-section > .section-header').forEach(header => {
            // 默认图例形态下折叠头由样式隐藏 (display:none)，不会进入 Tab 序列
            if (!header.hasAttribute('role')) header.setAttribute('role', 'button');
            if (!header.hasAttribute('tabindex')) header.setAttribute('tabindex', '0');
            const expanded = !header.parentElement.classList.contains('collapsed');
            header.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
        root.querySelectorAll('.tree-line-group > .tree-line-header').forEach(header => {
            const expanded = header.parentElement.classList.contains('expanded');
            header.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
        root.querySelectorAll('.tree-station-item').forEach(item => {
            if (item.classList.contains('active')) item.setAttribute('aria-current', 'true');
            else item.removeAttribute('aria-current');
        });
    }

    /**
     * 监听容器内 class 与结构变化，持续同步折叠头状态。
     * 折叠 / 展开的入口很多（核心多处、共享层面板也会改），统一靠观察结果而不是逐处改调用方。
     */
    function observeDisclosures(root) {
        if (!root || root._cgoA11yDisclosureObserver || typeof MutationObserver === 'undefined') return;
        let scheduled = false;
        const run = () => { scheduled = false; syncDisclosures(root); };
        const observer = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            Promise.resolve().then(run);
        });
        observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
        root._cgoA11yDisclosureObserver = observer;
        syncDisclosures(root);
    }

    // --------------------------------------------------------------------------
    // 顶栏「更多」下拉：按菜单的 show 状态同步 aria-expanded
    // --------------------------------------------------------------------------
    function initDropdownState() {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const btn = dropdown.querySelector('.dropbtn');
            const menu = dropdown.querySelector('.dropdown-content');
            if (!btn || !menu || btn._cgoA11yBound) return;
            btn._cgoA11yBound = true;
            btn.setAttribute('aria-haspopup', 'true');
            const sync = () => btn.setAttribute('aria-expanded', menu.classList.contains('show') ? 'true' : 'false');
            sync();
            if (typeof MutationObserver !== 'undefined') {
                new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class'] });
            }
            // Esc 收起菜单并把焦点还给触发按钮（仅当焦点在下拉内部时）
            dropdown.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape' || !menu.classList.contains('show')) return;
                e.stopPropagation();
                menu.classList.remove('show');
                focusElement(btn);
            });
        });
    }

    // --------------------------------------------------------------------------
    // Toast：CGoUI 的 showToast 不带 live region，这里在调用时同步写入播报区
    // --------------------------------------------------------------------------
    function wrapToast() {
        const cgo = window.CGO;
        if (!cgo || typeof cgo.showToast !== 'function' || cgo.showToast._cgoA11yWrapped) return;
        const original = cgo.showToast;
        const wrapped = function (message) {
            try { announce(message); } catch (_) { }
            return original.apply(this, arguments);
        };
        wrapped._cgoA11yWrapped = true;
        cgo.showToast = wrapped;
    }

    function showToast(message, type) {
        wrapToast();
        if (window.CGO && typeof window.CGO.showToast === 'function') {
            window.CGO.showToast(message, type || 'info');
        } else {
            announce(message);
        }
    }

    // --------------------------------------------------------------------------
    // Service Worker 换代提示：已打开的页面仍在用旧资源，提示用户自行刷新
    // --------------------------------------------------------------------------
    function initServiceWorkerNotice() {
        if (!('serviceWorker' in navigator)) return;
        // 首次安装时 clients.claim 也会触发 controllerchange，此时没有「旧版本」可言，不提示
        let hadController = Boolean(navigator.serviceWorker.controller);
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!hadController) {
                hadController = true;
                return;
            }
            showToast('已更新，刷新后生效', 'info');
        });
    }

    function onReady() {
        getStatusRegion();
        wrapToast();
        initDropdownState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
    // CGoUI 以 module 方式加载，兜底在 load 后再包一次
    window.addEventListener('load', wrapToast);
    initServiceWorkerNotice();

    window.CGoA11y = {
        escapeHtml,
        safeNameHtml,
        plainName,
        announce,
        prefersReducedMotion,
        isVisible,
        focusElement,
        enhanceTabs,
        syncTabs,
        syncDisclosures,
        observeDisclosures,
        showToast
    };
})();
