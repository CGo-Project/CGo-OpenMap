/**
 * 开放地图编辑器 (OpenMap Editor) - Office Ribbon 选项卡与功能区控制器
 * 接管 Tab 切换、双击折叠与折叠状态本地持久化
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.RibbonController = (function () {
    'use strict';

    var STORAGE_KEY_COLLAPSED = 'openmap-editor-ribbon-collapsed';
    var activeTab = 'home';
    var listeners = [];

    /**
     * 切换 Ribbon 活动选项卡
     * @param {string} tabId 'home' | 'ingest' | 'surgical' | 'tools'
     */
    function switchTab(tabId) {
        if (!tabId) return;
        activeTab = tabId;

        // 切换 Tab 按钮高亮
        var tabBtns = document.querySelectorAll('.ribbon-tab-btn');
        tabBtns.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        // 切换功能区内容组
        var groups = document.querySelectorAll('.ribbon-tab-content-group');
        groups.forEach(function (group) {
            group.classList.toggle('active', group.getAttribute('data-tab') === tabId);
        });

        // 若当前处于折叠状态，点击选项卡自动展开
        var container = document.getElementById('officeRibbonContainer');
        if (container && container.classList.contains('collapsed')) {
            toggleCollapse(false);
        }

        notify(tabId);
    }

    /**
     * 切换 Ribbon 折叠 / 展开状态
     * @param {boolean} [forceState] 可选强制状态 (true 为折叠, false 为展开)
     */
    function toggleCollapse(forceState) {
        var container = document.getElementById('officeRibbonContainer');
        var icon = document.getElementById('ribbonCollapseIcon');
        var label = document.getElementById('ribbonCollapseLabel');
        if (!container) return;

        var isCollapsed = typeof forceState === 'boolean'
            ? forceState
            : !container.classList.contains('collapsed');

        container.classList.toggle('collapsed', isCollapsed);

        if (icon) {
            icon.setAttribute('name', isCollapsed ? 'expand-more' : 'expand-less');
        }
        if (label) {
            label.textContent = isCollapsed ? '展开功能区' : '折叠功能区';
        }

        try {
            localStorage.setItem(STORAGE_KEY_COLLAPSED, isCollapsed ? '1' : '0');
        } catch (e) { /* ignore */ }
    }

    function notify(tabId) {
        for (var i = 0; i < listeners.length; i++) {
            try {
                listeners[i](tabId);
            } catch (err) {
                console.error('[RibbonController] 回调失败:', err);
            }
        }
    }

    function onTabChange(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    /**
     * 初始化事件监听与状态恢复
     */
    function init() {
        var tabBtns = document.querySelectorAll('.ribbon-tab-btn');
        tabBtns.forEach(function (btn) {
            var tabId = btn.getAttribute('data-tab');
            btn.addEventListener('click', function () {
                switchTab(tabId);
            });
            btn.addEventListener('dblclick', function () {
                toggleCollapse();
            });
        });

        var collapseBtn = document.getElementById('ribbonCollapseBtn');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', function () {
                toggleCollapse();
            });
        }

        // 恢复折叠偏好记忆
        try {
            var saved = localStorage.getItem(STORAGE_KEY_COLLAPSED);
            if (saved === '1') {
                toggleCollapse(true);
            }
        } catch (e) { /* ignore */ }
    }

    return {
        init: init,
        switchTab: switchTab,
        toggleCollapse: toggleCollapse,
        getActiveTab: function () { return activeTab; },
        onTabChange: onTabChange
    };
})();

// 保留全局别名兼容
window.RibbonController = window.OpenMapEditor.RibbonController;
