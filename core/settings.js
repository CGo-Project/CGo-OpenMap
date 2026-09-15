/**
 * CGo OpenMap - 偏好设置面板管理模块 (core/settings.js)
 * 
 * ==============================================================================
 * 偏好设置系统说明 (User Preference Manager)
 * ==============================================================================
 * 作用：管理用户偏好设置面板与持久化配置，包括：
 * 1. 城市切换 (City Switch)：自动读取 CityDataManager 注册的所有城市列表；
 * 2. 颜色模式 (Theme Mode)：支持跟随系统 (System)、亮色 (Light)、暗色 (Dark)；
 * 3. 滚轮与触控板 (Wheel Mode)：支持智能兼容 (Smart)、缩放 (Zoom)、平移 (Pan)；
 * 4. 侧边栏历史记录条数 (Sidebar History Limit)：控制常驻侧边栏保留的车站卡片数量 (1~9条)。
 * 
 * 存储键 (LocalStorage Keys):
 * - `cgo_openmap_city`: 当前激活的城市 ID
 * - `app-theme`: 用户选定的主题模式
 * - `nal_pref_wheel_mode`: 鼠标滚轮/触控板工作模式
 * - `nal_sidebar_history_limit`: 侧边栏常驻历史条数上限
 * ==============================================================================
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

    overlay.innerHTML = `
        <div class="settings-modal">
            <div class="settings-header">
                <h3>偏好设置</h3>
                <button class="settings-close-btn" title="关闭">
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
                    <div class="settings-row desktop-only">
                        <div>
                            <span class="settings-label">编辑此图</span>
                            <span class="settings-desc">在 Drunk 工作台里拖站、改字、调站名朝向</span>
                        </div>
                        <a class="btn btn-info btn-sm" id="pref-edit-in-drunk"
                            href="./drunk/index.html?city=${currentCityId}" target="_blank" rel="noopener"
                            style="min-width: 120px; justify-content: center; text-decoration: none;">
                            <cgo-icon name="edit" size="14"></cgo-icon>
                            <span>打开编辑模式</span>
                        </a>
                    </div>
                </div>
                <div style="padding: 10px 20px; font-size:11px; color:var(--text-light); text-align:center;">
                    设置更改时将自动生效和保存<br>清除Cookie和其他站点数据会导致设置失效
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const prefCitySwitch = document.getElementById('pref-city-switch');
    const prefTheme = document.getElementById('pref-theme');
    const prefWheel = document.getElementById('pref-wheel-mode');
    const prefHistory = document.getElementById('pref-history-limit');

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
        prefWheel.value = localStorage.getItem('nal_pref_wheel_mode') || 'smart';
        prefWheel.addEventListener('cgo-change', (e) => {
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
        prefHistory.value = localStorage.getItem('nal_sidebar_history_limit') || '5';
        prefHistory.addEventListener('cgo-change', (e) => {
            const newLimit = parseInt(e.detail.value, 10);
            localStorage.setItem('nal_sidebar_history_limit', newLimit);
            if (window.STATION_HISTORY?.length > newLimit) {
                window.STATION_HISTORY.splice(0, window.STATION_HISTORY.length - newLimit);
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

    const toggleSettings = (open) => {
        if (open) {
            window.hideLineTooltipNow?.();
            const legendOverlay = document.getElementById('legend-overlay');
            if (legendOverlay && !document.body.classList.contains('legend-pinned')) {
                legendOverlay.style.display = 'none';
            }
        }
        overlay.style.display = open ? 'block' : 'none';
        document.body.style.overflow = open ? 'hidden' : '';
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettings(true);
    });

    overlay.querySelector('.settings-close-btn')?.addEventListener('click', () => toggleSettings(false));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) toggleSettings(false);
    });
});