/**
 * CGo OpenMap - 城市门户视图与交互控制模块 (Portal View)
 * 纯原生 ES6 实现，负责首页 4 套视图（时间总览、字母索引、距离最近、最近浏览）的渲染、过滤、定位与交互
 */
(function () {
    'use strict';

    /**
     * 进入指定城市的线路图。
     * 先把选择写入本地偏好再跳转：部分静态服务器（如 npx serve 默认的 cleanUrls）
     * 会把 /main.html?city=xxx 重定向为 /main 并丢掉查询串，
     * 此时 city/data.js 会用本地偏好兜底，仍能打开正确城市而不是回退到北京。
     */
    window.enterCity = function (cityId) {
        if (!cityId) return;
        try {
            localStorage.setItem('cgo_openmap_city', String(cityId));
            if (window.PortalData && typeof window.PortalData.recordCityVisit === 'function') {
                window.PortalData.recordCityVisit(cityId);
            } else if (typeof window.recordCityVisit === 'function') {
                window.recordCityVisit(cityId);
            }
        } catch (e) { /* ignore */ }
        window.location.href = './main.html?city=' + encodeURIComponent(cityId);
    };

    // CGoUI 标准 Toast 统一弹出调度器
    function showToast(message, type = 'info', duration = 2800) {
        if (window.CGO && typeof window.CGO.showToast === 'function') {
            window.CGO.showToast(message, type, duration);
        } else {
            console.log(`[CGoUI Toast (${type})]:`, message);
        }
    }

    // 全局彻底杜绝浏览器原生 alert 与 confirm，统一使用 CGoUI 标准 Toast
    window.alert = function (message) {
        showToast(String(message), 'warning');
    };
    window.confirm = function (message) {
        showToast(String(message), 'info');
        return true;
    };

    // 运行时状态与缓存
    let userLocation = null;
    let locationLoading = false;
    let locationError = null;
    let cachedCitiesList = [];

    // 视图切换模式管理：'time'（卡片网格）| 'alpha'（字母排序）| 'distance'（距离排序）| 'recent'（最近浏览）
    const VIEW_MODE_KEY = 'cgo_openmap_city_sort_mode';
    let currentViewMode = localStorage.getItem(VIEW_MODE_KEY) || 'time';

    // 快捷获取 PortalData 工具方法
    const D = () => window.PortalData || {};

    function updateViewModeUI(mode) {
        currentViewMode = mode;
        try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch (e) { }

        const timeBtn = document.getElementById('view-mode-time');
        const alphaBtn = document.getElementById('view-mode-alpha');
        const distBtn = document.getElementById('view-mode-distance');
        const recentBtn = document.getElementById('view-mode-recent');

        const gridView = document.getElementById('city-grid');
        const alphaView = document.getElementById('city-alpha-container');
        const distView = document.getElementById('city-distance-container');
        const recentView = document.getElementById('city-recent-container');

        const modes = [
            { id: 'time', btn: timeBtn, view: gridView, display: 'grid' },
            { id: 'alpha', btn: alphaBtn, view: alphaView, display: 'flex' },
            { id: 'distance', btn: distBtn, view: distView, display: 'flex' },
            { id: 'recent', btn: recentBtn, view: recentView, display: 'flex' }
        ];

        modes.forEach(item => {
            const isActive = item.id === mode;
            if (item.btn) {
                item.btn.classList.toggle('active', isActive);
                item.btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            }
            if (item.view) {
                item.view.style.display = isActive ? item.display : 'none';
            }
        });

        if (mode === 'distance') {
            if (!userLocation && !locationLoading && !locationError) {
                requestUserLocation();
            } else {
                renderDistanceView();
            }
        } else if (mode === 'recent') {
            renderRecentView();
        }
    }

    function requestUserLocation() {
        if (!navigator.geolocation) {
            locationLoading = false;
            locationError = { code: 0, message: '您的浏览器不支持地理位置定位服务。' };
            renderDistanceView();
            showToast('您的浏览器不支持地理位置定位服务', 'warning');
            return;
        }
        locationLoading = true;
        locationError = null;
        renderDistanceView();

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                locationLoading = false;
                locationError = null;
                renderDistanceView();
                showToast('已获取当前位置，已按距离排序', 'success');
            },
            (err) => {
                locationLoading = false;
                let msg = '无法获取当前位置，请检查浏览器的位置权限设置。';
                if (err.code === 1) {
                    msg = '您已拒绝位置权限。请在浏览器设置中允许位置访问后重试。';
                } else if (err.code === 2) {
                    msg = '网络定位失败，暂时无法确定当前位置信息。';
                } else if (err.code === 3) {
                    msg = '获取位置超时，请检查网络连接后重试。';
                }
                locationError = { code: err.code, message: msg };
                renderDistanceView();
                showToast(msg, 'warning');
            },
            { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
        );
    }

    // 渲染视图 1：按时间排序的卡片网格
    function renderTimeView(cities) {
        const grid = document.getElementById('city-grid');
        if (!grid) return;

        const dataTool = D();
        const formatLogo = dataTool.formatCityLogoSvg || ((c) => '<cgo-icon name="train" size="22"></cgo-icon>');

        // 按 registerDate 升序排序
        const sorted = [...cities].sort((a, b) => {
            const timeA = new Date(a.registerDate || '1970-01-01').getTime();
            const timeB = new Date(b.registerDate || '1970-01-01').getTime();
            return timeA - timeB;
        });

        grid.innerHTML = sorted.map(city => {
            const isRecruiting = city.status === 'recruiting' || (city.maintainers && city.maintainers.some(m => m.isRecruiting));
            const badgeClass = isRecruiting ? 'badge-warning' : 'badge-success';
            const badgeIcon = isRecruiting ? 'sparkle' : 'check-circle';
            const badgeText = isRecruiting ? '招募主理人' : (city.isDefault ? '核心范例 (已上线)' : '已上线');

            // 主理团队展示
            let maintainersHtml = '';
            const maintainers = Array.isArray(city.maintainers) ? city.maintainers : [];

            if (isRecruiting && maintainers.length === 1 && maintainers[0].isRecruiting) {
                maintainersHtml = `
                    <div class="maintainer-recruiting-bar">
                        <div class="recruiting-tag">
                            <cgo-icon name="sparkle" size="13"></cgo-icon>
                            <span>城市主理人虚位以待</span>
                        </div>
                        <a href="${maintainers[0].github || 'https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md'}" target="_blank" class="recruiting-link" onclick="event.stopPropagation()">
                            <span>认领该城市</span>
                            <cgo-icon name="arrow-right" size="11"></cgo-icon>
                        </a>
                    </div>
                `;
            } else {
                maintainersHtml = `
                    <div class="maintainers-list">
                        ${maintainers.map(m => {
                    const ghBtn = m.github ? `
                                <a href="${m.github}" target="_blank" class="maintainer-gh" title="${m.name} 的 GitHub" onclick="event.stopPropagation()">
                                    <cgo-icon name="code" size="12"></cgo-icon>
                                    <span>GitHub</span>
                                </a>
                            ` : '';
                    return `
                                <div class="maintainer-item">
                                    <div class="maintainer-profile">
                                        <span class="maintainer-name">${m.name}</span>
                                        ${m.role ? `<span class="maintainer-role">${m.role}</span>` : ''}
                                    </div>
                                    ${ghBtn}
                                </div>
                            `;
                }).join('')}
                    </div>
                `;
            }

            // 官方参考链接
            const officialLinkHtml = city.officialMapUrl ? `
                <a href="${city.officialMapUrl}" target="_blank" class="city-meta-link" title="官方地铁运营单位线网参考" onclick="event.stopPropagation()">
                    <cgo-icon name="external" size="12"></cgo-icon>
                    <span>官方参考</span>
                </a>
            ` : '';

            const targetUrl = `./main.html?city=${city.id}`;

            return `
                <div class="city-card glass-card" onclick="window.enterCity('${city.id}')" title="进入 ${city.name} 交互线路图">
                    <div class="liquid-glass-effect"></div>
                    <div>
                        <div class="city-card-header">
                            <div class="city-identity">
                                <span class="city-name">${city.name}</span>
                                <span class="city-code-tag">${city.id.toUpperCase()}</span>
                            </div>
                            <div class="city-badges-box">
                                <span class="badge ${badgeClass}">
                                    <cgo-icon name="${badgeIcon}" size="12"></cgo-icon>
                                    <span>${badgeText}</span>
                                </span>
                                <div class="city-emblem">
                                    ${formatLogo(city)}
                                </div>
                            </div>
                        </div>

                        <div class="city-meta">
                            <div class="city-meta-item">
                                <cgo-icon name="calendar" size="13"></cgo-icon>
                                <span>录入时间：${city.registerDate || '近期'}</span>
                            </div>
                            ${officialLinkHtml}
                        </div>

                        <p class="city-desc">${city.description || '暂无城市线网描述。'}</p>
                    </div>

                    <div>
                        <div class="city-maintainers-box">
                            <div class="maintainers-header">
                                <cgo-icon name="user" size="13"></cgo-icon>
                                <span>主理团队</span>
                            </div>
                            ${maintainersHtml}
                        </div>

                        <div class="card-action">
                            <a class="btn btn-primary btn-enter" href="${targetUrl}" onclick="event.preventDefault()"${city.themeColor ? ` style="background-color: ${city.themeColor}; border-color: ${city.themeColor};"` : ''}>
                                <span>探索 ${city.name} 线路图</span>
                                <cgo-icon name="arrow-right" size="15" class="enter-arrow"></cgo-icon>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染视图 2：按字母排序的紧凑列表
    function renderAlphaView(cities) {
        const container = document.getElementById('city-alpha-container');
        if (!container) return;

        const dataTool = D();
        const getMeta = dataTool.getCityMeta || (() => ({ letter: '#', pinyin: '', pyInitials: '' }));
        const formatLogo = dataTool.formatCityLogoSvg || ((c) => '<cgo-icon name="train" size="22"></cgo-icon>');

        // 字母排序：A-Z 首字母优先，同字母按 pinyin/id 排序
        const sorted = [...cities].sort((a, b) => {
            const metaA = getMeta(a);
            const metaB = getMeta(b);
            if (metaA.letter !== metaB.letter) {
                return metaA.letter.localeCompare(metaB.letter);
            }
            return (metaA.pinyin || a.id).localeCompare(metaB.pinyin || b.id);
        });

        // 按首字母分桶归组
        const groups = {};
        sorted.forEach(city => {
            const letter = getMeta(city).letter;
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(city);
        });

        const letters = Object.keys(groups).sort();

        // 1. 顶部快速索引条 (A-Z 导航按钮与实时检索输入框)
        const navButtonsHtml = letters.map(letter => `
            <button type="button" class="alpha-nav-item" data-letter="${letter}" title="跳转到字母 ${letter}">
                ${letter}
            </button>
        `).join('');

        const quickbarHtml = `
            <div class="alpha-quickbar glass-surface">
                <div class="alpha-letter-nav" id="alpha-letter-nav">
                    ${navButtonsHtml}
                </div>
                <div class="search-input-wrapper alpha-search-box">
                    <span class="search-icon">
                        <cgo-icon name="search" size="14"></cgo-icon>
                    </span>
                    <input type="text" id="alpha-search-input" class="form-control" placeholder="输入拼音/缩写/城市名快速查找..." autocomplete="off" spellcheck="false" aria-label="搜索城市">
                    <button type="button" class="search-clear-btn" id="alpha-search-clear" title="清空搜索" style="display: none;" aria-label="清空搜索">
                        <cgo-icon name="close" size="14"></cgo-icon>
                    </button>
                </div>
            </div>
        `;

        // 2. 字母分组及其紧凑条目
        const groupsHtml = letters.map(letter => {
            const groupCities = groups[letter];
            const itemsHtml = groupCities.map(city => {
                const meta = getMeta(city);
                const searchKeys = `${city.name} ${city.id} ${meta.pinyin} ${meta.pyInitials || ''}`.toLowerCase();

                let maintainerSnippet = '';
                if (Array.isArray(city.maintainers) && city.maintainers.length > 0) {
                    if (city.maintainers[0].isRecruiting) {
                        maintainerSnippet = '主理人招募中';
                    } else {
                        maintainerSnippet = `主理: ${city.maintainers[0].name}`;
                    }
                }

                return `
                    <div class="city-compact-item glass-card" onclick="window.enterCity('${city.id}')" title="进入 ${city.name} 线路图" data-city-id="${city.id}" data-search-keys="${searchKeys}" tabindex="0" role="button">
                        <div class="liquid-glass-effect"></div>
                        <div class="compact-main-info">
                            <div class="compact-emblem">
                                ${formatLogo(city)}
                            </div>
                            <div class="compact-text-box">
                                <div class="compact-city-title">
                                    <span class="compact-city-name">${city.name}</span>
                                    <span class="compact-city-code">${city.id.toUpperCase()}</span>
                                </div>
                                ${maintainerSnippet ? `<div class="compact-meta-maintainer">${maintainerSnippet}</div>` : ''}
                            </div>
                        </div>
                        <div class="compact-action">
                            <span class="btn btn-primary compact-enter-btn"${city.themeColor ? ` style="background-color: ${city.themeColor}; border-color: ${city.themeColor};"` : ''}>
                                <span>进入</span>
                                <cgo-icon name="arrow-right" size="12" class="compact-enter-arrow"></cgo-icon>
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

            const isMulti = groupCities.length > 1;
            return `
                <div class="alpha-group${isMulti ? ' alpha-group-multi' : ''}" id="alpha-group-${letter}" data-letter="${letter}">
                    <div class="alpha-group-header">
                        <span class="alpha-letter-badge">${letter}</span>
                        <span class="alpha-group-count">${groupCities.length} 个城市</span>
                    </div>
                    <div class="alpha-group-items">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            ${quickbarHtml}
            <div class="alpha-groups-list" id="alpha-groups-list">
                ${groupsHtml}
            </div>
            <div class="alpha-empty-state" id="alpha-empty-state" style="display: none;">
                <cgo-icon name="help" size="32"></cgo-icon>
                <p>未找到匹配的城市，可尝试搜索其他拼音或中文名</p>
            </div>
        `;

        // 绑定快速跳转事件
        container.querySelectorAll('.alpha-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const letter = btn.dataset.letter;
                const groupEl = document.getElementById('alpha-group-' + letter);
                if (groupEl) {
                    groupEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // 绑定实时过滤搜索
        const searchInput = document.getElementById('alpha-search-input');
        const clearBtn = document.getElementById('alpha-search-clear');
        const emptyState = document.getElementById('alpha-empty-state');
        const groupEls = container.querySelectorAll('.alpha-group');
        const allItems = container.querySelectorAll('.city-compact-item');

        function filterCities() {
            const q = (searchInput.value || '').trim().toLowerCase();
            if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';

            let totalVisible = 0;
            groupEls.forEach(group => {
                const items = group.querySelectorAll('.city-compact-item');
                let groupVisible = 0;
                items.forEach(item => {
                    const keys = item.dataset.searchKeys || '';
                    const match = !q || keys.includes(q);
                    item.style.display = match ? 'flex' : 'none';
                    if (match) groupVisible++;
                });
                group.style.display = groupVisible > 0 ? '' : 'none';
                totalVisible += groupVisible;
            });

            if (emptyState) emptyState.style.display = totalVisible === 0 ? 'flex' : 'none';
        }

        if (searchInput) searchInput.addEventListener('input', filterCities);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                    filterCities();
                }
            });
        }

        // 键盘辅助
        allItems.forEach(item => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const cityId = item.dataset.cityId;
                    if (cityId) window.enterCity(cityId);
                }
            });
        });
    }

    // 渲染视图 3：按距离由近到远排序的紧凑列表
    function renderDistanceView() {
        const container = document.getElementById('city-distance-container');
        if (!container) return;

        const dataTool = D();
        const coordsMap = dataTool.CITY_GEO_COORDS || {};
        const calcDist = dataTool.calculateDistanceKm || (() => Infinity);
        const formatDist = dataTool.formatDistance || (() => '距离未知');
        const getMeta = dataTool.getCityMeta || (() => ({ letter: '#', pinyin: '', pyInitials: '' }));
        const formatLogo = dataTool.formatCityLogoSvg || ((c) => '<cgo-icon name="train" size="22"></cgo-icon>');

        if (locationLoading) {
            container.innerHTML = `
                <div class="distance-state-box glass-card">
                    <div class="liquid-glass-effect"></div>
                    <div class="distance-loading-content">
                        <cgo-icon name="location" size="36" class="location-pulse-icon"></cgo-icon>
                        <div class="distance-state-text">
                            <h4>正在获取您的地理位置...</h4>
                            <p>请在浏览器弹出提示时允许位置访问，系统将自动计算所有入驻城市与您的直线距离并由近到远排序。</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (locationError) {
            container.innerHTML = `
                <div class="distance-state-box glass-card">
                    <div class="liquid-glass-effect"></div>
                    <div class="distance-error-content">
                        <cgo-icon name="warning" size="36" style="color: var(--warning-color, #f59e0b);"></cgo-icon>
                        <div class="distance-state-text">
                            <h4>未能获取地理位置</h4>
                            <p>${locationError.message}</p>
                        </div>
                        <button type="button" class="btn btn-primary" id="retry-location-btn">
                            <cgo-icon name="refresh" size="14"></cgo-icon>
                            <span>重新尝试定位</span>
                        </button>
                    </div>
                </div>
            `;
            const retryBtn = container.querySelector('#retry-location-btn');
            if (retryBtn) retryBtn.addEventListener('click', requestUserLocation);
            return;
        }

        if (!userLocation) {
            requestUserLocation();
            return;
        }

        // 计算各城市与用户位置的距离并升序排序
        const sortedWithDist = cachedCitiesList.map(city => {
            const coords = coordsMap[city.id];
            let dist = Infinity;
            if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
                dist = calcDist(userLocation.lat, userLocation.lng, coords.lat, coords.lng);
            }
            return { city, dist };
        }).sort((a, b) => a.dist - b.dist);

        const quickbarHtml = `
            <div class="alpha-quickbar glass-surface">
                <div class="distance-loc-info">
                    <cgo-icon name="location" size="14"></cgo-icon>
                    <span>已获取您的位置 · 按距您由近到远排序</span>
                    <button type="button" class="btn btn-info btn-xs relocate-btn" id="distance-relocate-btn" title="重新获取最新定位">
                        <cgo-icon name="refresh" size="12"></cgo-icon>
                        <span>重新定位</span>
                    </button>
                </div>
                <div class="search-input-wrapper alpha-search-box">
                    <span class="search-icon">
                        <cgo-icon name="search" size="14"></cgo-icon>
                    </span>
                    <input type="text" id="distance-search-input" class="form-control" placeholder="在距离排序中查找城市..." autocomplete="off" spellcheck="false" aria-label="搜索城市">
                    <button type="button" class="search-clear-btn" id="distance-search-clear" title="清空搜索" style="display: none;" aria-label="清空搜索">
                        <cgo-icon name="close" size="14"></cgo-icon>
                    </button>
                </div>
            </div>
        `;

        const itemsHtml = sortedWithDist.map(({ city, dist }) => {
            const meta = getMeta(city);
            const searchKeys = `${city.name} ${city.id} ${meta.pinyin} ${meta.pyInitials || ''}`.toLowerCase();
            const distFormatted = formatDist(dist);

            let maintainerSnippet = '';
            if (Array.isArray(city.maintainers) && city.maintainers.length > 0) {
                if (city.maintainers[0].isRecruiting) {
                    maintainerSnippet = '主理人招募中';
                } else {
                    maintainerSnippet = `主理: ${city.maintainers[0].name}`;
                }
            }

            return `
                <div class="city-compact-item glass-card" onclick="window.enterCity('${city.id}')" title="进入 ${city.name} 线路图（${distFormatted}）" data-city-id="${city.id}" data-search-keys="${searchKeys}" tabindex="0" role="button">
                    <div class="liquid-glass-effect"></div>
                    <div class="compact-main-info">
                        <div class="compact-emblem">
                            ${formatLogo(city)}
                        </div>
                        <div class="compact-text-box">
                            <div class="compact-city-title">
                                <span class="compact-city-name">${city.name}</span>
                                <span class="compact-city-code">${city.id.toUpperCase()}</span>
                                <span class="compact-meta-badge compact-dist-badge" title="与您的直线距离">
                                    <cgo-icon name="location" size="10"></cgo-icon>
                                    <span>${distFormatted}</span>
                                </span>
                            </div>
                            ${maintainerSnippet ? `<div class="compact-meta-maintainer">${maintainerSnippet}</div>` : ''}
                        </div>
                    </div>
                    <div class="compact-action">
                        <span class="btn btn-primary compact-enter-btn"${city.themeColor ? ` style="background-color: ${city.themeColor}; border-color: ${city.themeColor};"` : ''}>
                            <span>进入</span>
                            <cgo-icon name="arrow-right" size="12" class="compact-enter-arrow"></cgo-icon>
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            ${quickbarHtml}
            <div class="distance-items-grid" id="distance-items-grid">
                ${itemsHtml}
            </div>
            <div class="alpha-empty-state" id="distance-empty-state" style="display: none;">
                <cgo-icon name="help" size="32"></cgo-icon>
                <p>未找到匹配的城市</p>
            </div>
        `;

        // 重新定位按钮
        const relocateBtn = container.querySelector('#distance-relocate-btn');
        if (relocateBtn) {
            relocateBtn.addEventListener('click', () => {
                showToast('正在重新获取位置...', 'info');
                requestUserLocation();
            });
        }

        // 实时搜索过滤
        const searchInput = container.querySelector('#distance-search-input');
        const clearBtn = container.querySelector('#distance-search-clear');
        const emptyState = container.querySelector('#distance-empty-state');
        const allItems = container.querySelectorAll('.city-compact-item');

        function filterDistanceCities() {
            const q = (searchInput.value || '').trim().toLowerCase();
            if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';
            let totalVisible = 0;
            allItems.forEach(item => {
                const keys = item.dataset.searchKeys || '';
                const match = !q || keys.includes(q);
                item.style.display = match ? 'flex' : 'none';
                if (match) totalVisible++;
            });
            if (emptyState) emptyState.style.display = totalVisible === 0 ? 'flex' : 'none';
        }

        if (searchInput) searchInput.addEventListener('input', filterDistanceCities);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                    filterDistanceCities();
                }
            });
        }

        // 键盘支持
        allItems.forEach(item => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const cityId = item.dataset.cityId;
                    if (cityId) window.enterCity(cityId);
                }
            });
        });
    }

    // 渲染视图 4：最近浏览紧凑列表 (按时间区间分类)
    function renderRecentView() {
        const container = document.getElementById('city-recent-container');
        if (!container) return;

        const dataTool = D();
        const visits = (dataTool.getRecentVisits ? dataTool.getRecentVisits() : []);
        const cityMap = new Map(cachedCitiesList.map(c => [c.id, c]));
        const validVisits = visits.filter(v => cityMap.has(v.id));

        if (validVisits.length === 0) {
            container.innerHTML = `
                <div class="alpha-empty-state glass-card" style="padding: 48px 24px; text-align: center;">
                    <div class="liquid-glass-effect"></div>
                    <cgo-icon name="time" size="36"></cgo-icon>
                    <h3 style="font-size: 16px; font-weight: 700; margin: 12px 0 6px 0; color: var(--text-main);">暂无最近浏览记录</h3>
                    <p style="font-size: 13px; color: var(--text-light); max-width: 420px; margin: 0 auto; line-height: 1.5;">
                        在“城市总览”或“字母排序”中点击进入任意城市，即可在此自动收录并分类，方便随时快速重访。
                    </p>
                </div>
            `;
            return;
        }

        // 分类逻辑（1. 最近(<3天)；2. 3天前(3~7天)；3. 一周或更久(>=7天)）
        const now = Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

        const groups = {
            recent: { title: '最近', items: [] },
            days3: { title: '3天前', items: [] },
            week_plus: { title: '一周或更久', items: [] }
        };

        validVisits.forEach(v => {
            const city = cityMap.get(v.id);
            const diff = Math.max(0, now - (v.time || 0));
            if (diff < THREE_DAYS_MS) {
                groups.recent.items.push({ city, time: v.time });
            } else if (diff < SEVEN_DAYS_MS) {
                groups.days3.items.push({ city, time: v.time });
            } else {
                groups.week_plus.items.push({ city, time: v.time });
            }
        });

        const quickbarHtml = `
            <div class="alpha-quickbar glass-surface">
                <div class="recent-bar-info">
                    <cgo-icon name="time" size="14"></cgo-icon>
                    <span>已记录 ${validVisits.length} 个历史浏览城市</span>
                    <button type="button" class="btn btn-info btn-xs recent-clear-all-btn" id="recent-clear-all-btn" title="清空全部浏览历史">
                        <cgo-icon name="delete" size="12"></cgo-icon>
                        <span>清空记录</span>
                    </button>
                </div>
                <div class="search-input-wrapper alpha-search-box">
                    <span class="search-icon">
                        <cgo-icon name="search" size="14"></cgo-icon>
                    </span>
                    <input type="text" id="recent-search-input" class="form-control" placeholder="在最近浏览中查找..." autocomplete="off" spellcheck="false" aria-label="搜索城市">
                    <button type="button" class="search-clear-btn" id="recent-search-clear" title="清空搜索" style="display: none;" aria-label="清空搜索">
                        <cgo-icon name="close" size="14"></cgo-icon>
                    </button>
                </div>
            </div>
        `;

        const getMeta = dataTool.getCityMeta || (() => ({ letter: '#', pinyin: '', pyInitials: '' }));
        const formatLogo = dataTool.formatCityLogoSvg || ((c) => '<cgo-icon name="train" size="22"></cgo-icon>');
        const formatTime = dataTool.formatRelativeTime || (() => '近期');

        const groupKeys = ['recent', 'days3', 'week_plus'];
        let groupsHtml = '';

        groupKeys.forEach(key => {
            const group = groups[key];
            if (group.items.length === 0) return;

            const itemsHtml = group.items.map(({ city, time }) => {
                const meta = getMeta(city);
                const searchKeys = `${city.name} ${city.id} ${meta.pinyin} ${meta.pyInitials || ''}`.toLowerCase();
                const timeFormatted = formatTime(time);

                let maintainerSnippet = '';
                if (Array.isArray(city.maintainers) && city.maintainers.length > 0) {
                    if (city.maintainers[0].isRecruiting) {
                        maintainerSnippet = '主理人招募中';
                    } else {
                        maintainerSnippet = `主理: ${city.maintainers[0].name}`;
                    }
                }

                return `
                    <div class="city-compact-item glass-card" onclick="window.enterCity('${city.id}')" title="进入 ${city.name} 线路图（${timeFormatted}浏览）" data-city-id="${city.id}" data-search-keys="${searchKeys}" tabindex="0" role="button">
                        <div class="liquid-glass-effect"></div>
                        <div class="compact-main-info">
                            <div class="compact-emblem">
                                ${formatLogo(city)}
                            </div>
                            <div class="compact-text-box">
                                <div class="compact-city-title">
                                    <span class="compact-city-name">${city.name}</span>
                                    <span class="compact-city-code">${city.id.toUpperCase()}</span>
                                    <span class="compact-meta-badge compact-time-badge" title="最近访问时间">
                                        <cgo-icon name="time" size="10"></cgo-icon>
                                        <span>${timeFormatted}</span>
                                    </span>
                                </div>
                                ${maintainerSnippet ? `<div class="compact-meta-maintainer">${maintainerSnippet}</div>` : ''}
                            </div>
                        </div>
                        <div class="compact-action">
                            <span class="btn btn-primary compact-enter-btn"${city.themeColor ? ` style="background-color: ${city.themeColor}; border-color: ${city.themeColor};"` : ''}>
                                <span>进入</span>
                                <cgo-icon name="arrow-right" size="12" class="compact-enter-arrow"></cgo-icon>
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

            groupsHtml += `
                <div class="alpha-group alpha-group-multi recent-group" data-group="${key}">
                    <div class="alpha-group-header">
                        <span class="alpha-letter-badge recent-group-badge">
                            <cgo-icon name="time" size="12"></cgo-icon>
                        </span>
                        <span style="font-weight: 700; font-size: 13.5px; color: var(--text-main);">${group.title}</span>
                        <span class="alpha-group-count">${group.items.length} 个城市</span>
                    </div>
                    <div class="alpha-group-items">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            ${quickbarHtml}
            <div class="alpha-groups-list" id="recent-groups-list">
                ${groupsHtml}
            </div>
            <div class="alpha-empty-state" id="recent-empty-state" style="display: none;">
                <cgo-icon name="help" size="32"></cgo-icon>
                <p>未在最近浏览中找到匹配的城市</p>
            </div>
        `;

        // 清空记录按钮
        const clearAllBtn = container.querySelector('#recent-clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                const key = dataTool.RECENT_VIEWS_KEY || 'cgo_openmap_recent_views';
                try { localStorage.removeItem(key); } catch (e) { }
                renderRecentView();
                showToast('已清空全部最近浏览记录', 'info');
            });
        }

        // 实时搜索过滤
        const searchInput = container.querySelector('#recent-search-input');
        const clearBtn = container.querySelector('#recent-search-clear');
        const emptyState = container.querySelector('#recent-empty-state');
        const groupEls = container.querySelectorAll('.recent-group');

        function filterRecentCities() {
            const q = (searchInput.value || '').trim().toLowerCase();
            if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';
            let totalVisible = 0;
            groupEls.forEach(group => {
                const items = group.querySelectorAll('.city-compact-item');
                let groupVisible = 0;
                items.forEach(item => {
                    const keys = item.dataset.searchKeys || '';
                    const match = !q || keys.includes(q);
                    item.style.display = match ? 'flex' : 'none';
                    if (match) groupVisible++;
                });
                group.style.display = groupVisible > 0 ? '' : 'none';
                totalVisible += groupVisible;
            });
            if (emptyState) emptyState.style.display = totalVisible === 0 ? 'flex' : 'none';
        }

        if (searchInput) searchInput.addEventListener('input', filterRecentCities);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                    filterRecentCities();
                }
            });
        }

        // 键盘支持
        container.querySelectorAll('.city-compact-item').forEach(item => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const cityId = item.dataset.cityId;
                    if (cityId) window.enterCity(cityId);
                }
            });
        });
    }

    /**
     * 门户初始化主函数
     */
    function initPortal() {
        const registry = window.CITY_REGISTRY || {};
        // 仅展示有效上线城市；暂未达标下架或标记隐藏的城市（如合肥）不在门户展示，但保留全部底层程序代码与路由
        const cities = Object.values(registry).filter(city => !city.hidden && city.status !== 'delisted' && city.id !== 'hefei');
        cachedCitiesList = cities;

        const countBadge = document.getElementById('city-count-badge');
        if (countBadge) {
            countBadge.textContent = `已收录 ${cities.length} 个城市`;
        }

        // 预先渲染各套视图
        renderTimeView(cities);
        renderAlphaView(cities);

        // 绑定 4 种排序与视图切换按钮
        const timeBtn = document.getElementById('view-mode-time');
        const alphaBtn = document.getElementById('view-mode-alpha');
        const distBtn = document.getElementById('view-mode-distance');
        const recentBtn = document.getElementById('view-mode-recent');

        if (timeBtn) timeBtn.addEventListener('click', () => updateViewModeUI('time'));
        if (alphaBtn) alphaBtn.addEventListener('click', () => updateViewModeUI('alpha'));
        if (distBtn) distBtn.addEventListener('click', () => updateViewModeUI('distance'));
        if (recentBtn) recentBtn.addEventListener('click', () => updateViewModeUI('recent'));

        // 初始化当前选中的视图
        updateViewModeUI(currentViewMode);

        // 为去 viewBox 的自定义 SVG 图标执行边界校准 (自动校准为精确图形外包围盒)
        requestAnimationFrame(() => {
            document.querySelectorAll('.city-emblem svg, .compact-emblem svg').forEach(svg => {
                if (!svg.classList.contains('cgo-icon')) {
                    try {
                        const bbox = svg.getBBox();
                        if (bbox && bbox.width > 0 && bbox.height > 0) {
                            svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                        }
                    } catch (e) { }
                }
            });
        });
    }

    // DOM 就绪后自启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPortal);
    } else {
        initPortal();
    }

    window.PortalView = {
        initPortal,
        updateViewModeUI,
        renderTimeView,
        renderAlphaView,
        renderDistanceView,
        renderRecentView,
        requestUserLocation,
        showToast
    };
})();
