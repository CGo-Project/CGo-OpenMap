/**
 * CGo OpenMap - 偏好设置面板管理模块 (core/settings.js)
 */

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('settings-btn');
    if (!btn) return;

    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'custom-overlay';
    overlay.style.display = 'none';

    // 获取所有已注册城市列表与当前城市
    const cities = window.CityDataManager?.getAllCities?.()
        || (window.CITY_REGISTRY ? Object.values(window.CITY_REGISTRY) : [{ id: 'beijing', name: '北京' }]);

    const currentCityId = window.CityDataManager?.getCurrentCityId?.() || 'beijing';

    const cityOptionsHtml = cities.map(c => `
        <cgo-toolbar-option value="${c.id}">${c.name}</cgo-toolbar-option>
    `).join('');

    const wmActive = () => !!(window.CGoWMAdapter?.isActive?.() && window.CGoDialogs?.showSettings);
    const wmMode = window.CGoWMAdapter?.getDefaultDesktopMode?.() || 'float';

    overlay.innerHTML = `
        <div class="settings-modal" role="dialog" aria-labelledby="settings-modal-title">
            <div class="settings-header">
                <h3 id="settings-modal-title" tabindex="-1">偏好设置</h3>
                <button class="settings-close-btn" title="关闭" aria-label="关闭偏好设置">
                    <cgo-icon name="close" size="20"></cgo-icon>
                </button>
            </div>
            <div class="settings-content">
                <div class="settings-group">
                    <div class="settings-row">
                        <div>
                            <span class="settings-label">城市切换</span>
                            <span class="settings-desc">不同城市的轨道线路图</span>
                        </div>
                        <div style="min-width: 120px;">
                            <cgo-toolbar-select id="pref-city-switch">
                                ${cityOptionsHtml}
                            </cgo-toolbar-select>
                        </div>
                    </div>
                    <div class="settings-row">
                        <div>
                            <span class="settings-label">颜色模式</span>
                            <span class="settings-desc">界面深色或浅色风格</span>
                        </div>
                        <div style="min-width: 120px;">
                            <cgo-toolbar-select id="pref-theme">
                                <cgo-toolbar-option value="system">跟随系统变化</cgo-toolbar-option>
                                <cgo-toolbar-option value="light">亮色</cgo-toolbar-option>
                                <cgo-toolbar-option value="dark">暗色</cgo-toolbar-option>
                            </cgo-toolbar-select>
                        </div>
                    </div>
                    <div class="settings-row desktop-only">
                        <div>
                            <span class="settings-label">滚轮与触控板</span>
                            <span class="settings-desc">定义滚轮滚动时的行为</span>
                        </div>
                        <cgo-toolbar-select id="pref-wheel-mode">
                            <cgo-toolbar-option value="smart">智能兼容 (测试版)</cgo-toolbar-option>
                            <cgo-toolbar-option value="zoom">缩放大小</cgo-toolbar-option>
                            <cgo-toolbar-option value="pan">上下移动</cgo-toolbar-option>
                        </cgo-toolbar-select>
                    </div>
                    <div class="settings-row desktop-only">
                        <div>
                            <span class="settings-label">侧边栏历史记录</span>
                            <span class="settings-desc">保留最近查看的车站数量</span>
                        </div>
                        <cgo-toolbar-select id="pref-history-limit">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<cgo-toolbar-option value="${n}">${n}条${n === 5 ? ' (推荐)' : ''}</cgo-toolbar-option>`).join('')}
                        </cgo-toolbar-select>
                    </div>
                    <div class="settings-row desktop-only" id="pref-wm-mode-row">
                        <div>
                            <span class="settings-label">桌面默认窗口模式</span>
                            <span class="settings-desc">新建桌面面板默认浮窗或停靠侧边栏</span>
                        </div>
                        <div style="min-width: 120px;">
                            <cgo-toolbar-select id="pref-wm-default-mode">
                                <cgo-toolbar-option value="float">自由浮窗</cgo-toolbar-option>
                                <cgo-toolbar-option value="sidebar">侧边栏停靠</cgo-toolbar-option>
                            </cgo-toolbar-select>
                        </div>
                    </div>
                    <div class="settings-row" id="pref-wm-actions-row">
                        <div>
                            <span class="settings-label">工作区布局</span>
                            <span class="settings-desc">恢复面板默认位置、大小与停靠状态</span>
                        </div>
                        <div class="cgowm-settings-actions">
                            <button type="button" class="cgowm-wm-mgr-btn" id="pref-wm-reset-layout">重置布局</button>
                        </div>
                    </div>
                </div>
                <div style="padding: 10px 20px; font-size:11px; color:var(--text-light); text-align:center;">
                    设置更改时将自动生效和保存<br>清除Cookie和其他站点数据会导致设置失效
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const settingsModalEl = overlay.querySelector('.settings-modal');
    const wmModeRow = overlay.querySelector('#pref-wm-mode-row');
    const wmActionsRow = overlay.querySelector('#pref-wm-actions-row');
    if (!window.CGoWMAdapter) {
        if (wmModeRow) wmModeRow.hidden = true;
        if (wmActionsRow) wmActionsRow.hidden = true;
    }

    const prefCitySwitch = document.getElementById('pref-city-switch');
    const prefTheme = document.getElementById('pref-theme');
    const prefWheel = document.getElementById('pref-wheel-mode');
    const prefHistory = document.getElementById('pref-history-limit');
    const prefWmMode = document.getElementById('pref-wm-default-mode');
    if (prefWmMode) {
        prefWmMode.value = wmMode;
        prefWmMode.addEventListener('cgo-change', (e) => {
            const val = e.detail?.value === 'sidebar' ? 'sidebar' : 'float';
            window.CGoWMAdapter?.applyModeToAll?.(val);
        });
    }
    overlay.querySelector('#pref-wm-reset-layout')?.addEventListener('click', () => {
        const ask = window.cgoConfirm
            ? window.cgoConfirm('确定要重置所有面板的位置、大小与停靠布局吗？', {
                title: '重置工作区布局',
                confirmText: '确认重置',
                danger: true
            })
            : Promise.resolve(confirm('确定要重置所有面板的位置、大小与停靠布局吗？'));
        ask.then((ok) => {
            if (!ok) return;
            window.CGoWMAdapter?.resetWorkspace?.();
            if (prefWmMode && window.CGoWMAdapter) {
                prefWmMode.value = window.CGoWMAdapter.getDefaultDesktopMode();
            }
        });
    });

    if (prefCitySwitch) {
        prefCitySwitch.value = currentCityId;
        prefCitySwitch.addEventListener('cgo-change', (e) => {
            const targetCity = e.detail.value;
            if (targetCity && targetCity !== currentCityId) {
                if (window.CityDataManager) {
                    window.CityDataManager.setCurrentCity(targetCity);
                } else {
                    localStorage.setItem('cgo_openmap_city', targetCity);
                }
                const url = new URL(window.location.href);
                url.searchParams.set('city', targetCity);
                window.location.href = url.toString();
            }
        });
    }

    if (prefWheel) {
        prefWheel.value = localStorage.getItem('cgo_openmap_wheel_mode') || localStorage.getItem('nal_pref_wheel_mode') || 'smart';
        prefWheel.addEventListener('cgo-change', (e) => {
            localStorage.setItem('cgo_openmap_wheel_mode', e.detail.value);
            localStorage.setItem('nal_pref_wheel_mode', e.detail.value);
        });
    }

    if (prefTheme) {
        if (typeof CGO !== 'undefined' && CGO.bindThemeSelect) {
            CGO.bindThemeSelect(prefTheme);
        } else {
            prefTheme.value = localStorage.getItem('app-theme') || localStorage.getItem('scmap_app-theme') || 'system';
            prefTheme.addEventListener(prefTheme.tagName.toLowerCase().includes('cgo') ? 'cgo-change' : 'change', (e) => {
                const val = e.detail?.value || e.target?.value;
                if (val === 'system') {
                    localStorage.removeItem('app-theme');
                    localStorage.removeItem('scmap_app-theme');
                    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (typeof applyTheme === 'function') applyTheme(sysDark ? 'dark' : 'light');
                } else {
                    localStorage.setItem('app-theme', val);
                    if (typeof applyTheme === 'function') applyTheme(val);
                }
            });
        }
    }

    if (prefHistory) {
        prefHistory.value = localStorage.getItem('cgo_openmap_history_limit') || localStorage.getItem('nal_sidebar_history_limit') || '5';
        prefHistory.addEventListener('cgo-change', (e) => {
            const newLimit = parseInt(e.detail.value, 10);
            localStorage.setItem('cgo_openmap_history_limit', newLimit);
            localStorage.setItem('nal_sidebar_history_limit', newLimit);
            if (Array.isArray(window.STATION_HISTORY) && window.STATION_HISTORY.length > newLimit) {
                const activeSid = window.CGoWMAdapter?.getActiveStationSid?.();
                const tailCount = (activeSid && window.STATION_HISTORY.includes(activeSid))
                    ? Math.max(0, newLimit - 1)
                    : newLimit;
                const keep = new Set(tailCount > 0 ? window.STATION_HISTORY.slice(-tailCount) : []);
                if (activeSid && window.STATION_HISTORY.includes(activeSid)) keep.add(activeSid);
                while (keep.size < newLimit) {
                    const extra = [...window.STATION_HISTORY].reverse().find(id => !keep.has(id));
                    if (!extra) break;
                    keep.add(extra);
                }
                window.STATION_HISTORY = window.STATION_HISTORY.filter(id => keep.has(id)).slice(-newLimit);
            }
            if (window.CGoWMAdapter?.syncStationHistoryLimit) {
                window.CGoWMAdapter.syncStationHistoryLimit(newLimit);
            }
            const dynamicContainer = document.getElementById('sidebar-dynamic-content');
            if (dynamicContainer) {
                const allSections = Array.from(dynamicContainer.querySelectorAll('.station-history-section'))
                    .filter(sec => !sec.classList.contains('history-item-out'));
                if (allSections.length > newLimit) {
                    allSections.slice(0, allSections.length - newLimit).forEach(item => {
                        item.classList.add('history-item-out');
                        setTimeout(() => item.remove(), 300);
                    });
                }
            }
        });
    }

    let wmSettingsDlg = null;

    const toggleSettings = (open) => {
        if (wmActive()) {
            if (open) {
                window.hideLineTooltipNow?.();
                if (wmModeRow) wmModeRow.hidden = !window.CGoWMAdapter?.isActive?.();
                if (wmActionsRow) wmActionsRow.hidden = !window.CGoWMAdapter?.isActive?.();
                if (prefWmMode && window.CGoWMAdapter) {
                    prefWmMode.value = window.CGoWMAdapter.getDefaultDesktopMode();
                }
                if (wmSettingsDlg && wmSettingsDlg.state?.lifecycle !== 'destroyed') {
                    wmSettingsDlg.open();
                } else if (settingsModalEl) {
                    wmSettingsDlg = window.CGoDialogs.showSettings(settingsModalEl, {
                        title: '偏好设置',
                        destroyOnClose: false
                    });
                }
                if (wmSettingsDlg) return;
            } else if (wmSettingsDlg) {
                wmSettingsDlg.close();
                return;
            }
        }
        if (open) {
            window.hideLineTooltipNow?.();
            const legendOverlay = document.getElementById('legend-overlay');
            if (legendOverlay && !document.body.classList.contains('legend-pinned')) {
                legendOverlay.style.display = 'none';
            }
        }
        // 关闭前记下焦点是否在浮层内：是则归还给顶栏「更多」按钮（设置入口所在的菜单此时已收起）
        const focusWasInside = !open && overlay.contains(document.activeElement);
        overlay.style.display = open ? 'block' : 'none';
        document.body.style.overflow = open ? 'hidden' : '';
        const focusTarget = open
            ? overlay.querySelector('#settings-modal-title')
            : (focusWasInside ? document.getElementById('options-btn') : null);
        if (focusTarget) {
            try { focusTarget.focus({ preventScroll: true }); } catch (_) { focusTarget.focus(); }
        }
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettings(true);
    });

    overlay.querySelector('.settings-close-btn')?.addEventListener('click', () => toggleSettings(false));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) toggleSettings(false);
    });
    // Esc 关闭：监听挂在浮层自身，只有焦点位于其内时才会触发
    overlay.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || e.defaultPrevented) return;
        e.stopPropagation();
        toggleSettings(false);
    });
});