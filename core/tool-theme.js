/**
 * CGo OpenMap - 工具类主题调度与明暗切换器 (core/tool-theme.js)
 */

(function () {
    const BTN_ID = 'theme-toggle-btn';
    const filename = window.location.pathname.split('/').pop().replace('.html', '');
    const validApps = ['vitool', 'wall', 'stasign', 'staline', 'project'];
    const prefix = validApps.includes(filename) ? `${filename}_` : '';
    const STORAGE_KEY = prefix + 'app-theme';
    const TOOLTIP_ID = 'theme-reset-tooltip';

    const ICON_MOON = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>';
    const ICON_SUN = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';

    function initTheme() {
        const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const getPreferredTheme = () => localStorage.getItem(STORAGE_KEY) || (systemDarkQuery.matches ? 'dark' : 'light');

        applyTheme(getPreferredTheme());

        systemDarkQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindEvents);
        } else {
            bindEvents();
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const svg = document.getElementById(BTN_ID)?.querySelector('.btn-icon');
        if (svg) svg.innerHTML = theme === 'dark' ? ICON_MOON : ICON_SUN;

        if (window.self === window.top) {
            document.querySelectorAll('iframe').forEach(iframe => {
                iframe.contentWindow?.postMessage({ type: 'theme-change', theme }, '*');
            });
        }
    }

    function showTooltip(text) {
        let tooltip = document.getElementById(TOOLTIP_ID);
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = TOOLTIP_ID;
            document.body.appendChild(tooltip);
        }
        tooltip.innerText = text;
        tooltip.classList.add('show');
        setTimeout(() => tooltip.classList.remove('show'), 2000);
    }

    function bindEvents() {
        const btn = document.getElementById(BTN_ID);
        if (!btn) return;

        let pressTimer = null;
        let isLongPress = false;

        const startPress = (e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                localStorage.removeItem(STORAGE_KEY);
                const sysTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                applyTheme(sysTheme);
                showTooltip("已恢复系统明暗模式");
                navigator.vibrate?.(50);
            }, 800);
        };

        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        const handleClick = (e) => {
            if (isLongPress) {
                e.preventDefault();
                e.stopPropagation();
                isLongPress = false;
                return;
            }
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            localStorage.setItem(STORAGE_KEY, next);
            applyTheme(next);
        };

        btn.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        ['pointerdown'].forEach(ev => btn.addEventListener(ev, startPress));
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, cancelPress));
        btn.addEventListener('click', handleClick);
    }

    const params = new URLSearchParams(window.location.search);
    const shouldHideHeader = params.get('embed') === 'vitool-hide' || Boolean(window.parent?.isViToolHideHeader);

    if (shouldHideHeader) {
        const style = document.createElement('style');
        style.innerText = '.tool-header, .bottom-bar, .status-bar { display: none !important; }';
        document.head.appendChild(style);
        document.documentElement.classList.add('is-iframe-vitool-hidden');
    }

    window.addEventListener('message', (e) => {
        if (e.data?.type === 'theme-change') {
            applyTheme(e.data.theme);
        }
    });

    try {
        const parentTheme = window.parent.document.documentElement.getAttribute('data-theme');
        if (parentTheme) setTimeout(() => applyTheme(parentTheme), 50);
    } catch {
        window.parent.postMessage({ type: 'theme-request' }, '*');
    }

    initTheme();
    window.ToolTheme = { applyTheme };
})();