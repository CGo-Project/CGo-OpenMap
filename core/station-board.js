/**
 * CGo OpenMap - 车站信息板模块注册与渲染引擎 (core/station-board.js)
 * 
 * ==============================================================================
 * 车站信息板模块化系统架构说明 (Station Board Modular Architecture)
 * ==============================================================================
 * 1. 【模块注册化设计 (Modular Registry)】
 *    车站信息板（#info-panel）的所有功能（中英文标题、经停线路徽标、控制按钮、
 *    各个线路选项卡、高德切片微缩视窗/3D结构图、上一站下一站、换乘走廊、车站详情、
 *    运营商、导航外链等）全面抽象解耦为标准化的“模块 (Module)”。
 * 
 * 2. 【城市主理人高度可配置 (City Maintainer Control)】
 *    城市配置文件 (city/{city_id}/{city_id}.js) 中的 `stationBoard` 字段可按需：
 *    - 开启/关闭任意内置或自定义模块 (enabled: true/false)；
 *    - 自由调节模块显示顺序 (order: 10, 20, ...)；
 *    - 改变模块所挂载的选项卡位置 (targetTab: 'line-tab' / 'station-info' / 自定义tab)；
 *    - 新增城市私有选项卡 (tabs: [{ id: 'xxx', title: 'xxx' }])。
 * 
 * 3. 【零配置默认展示与向下兼容 (Zero-Config Default & 100% Backward Compatibility)】
 *    若城市未配置 `stationBoard`（如已发布的沈阳），系统自动启用全套内置模块与原版
 *    DOM 结构布局，原有的 CSS 类名、DOM 层级、城市私有 MutationObserver 完全无缝兼容。
 * 
 * 4. 【开放式生命周期规范 (Module Lifecycle)】
 *    模块支持 `shouldRender(context)`、`render(context)` 以及 `onMounted(container, context)`。
 * ==============================================================================
 */

(function () {
    /**
     * 模块别名映射字典 (提升城市主理人配置时的便利性与容错度)
     */
    const MODULE_ALIASES = {
        'minimap': 'stacard',
        'station-minimap': 'stacard',
        'prev-next': 'adjacent-stations',
        'stops': 'adjacent-stations',
        'next-prev': 'adjacent-stations',
        'transfer': 'transfers',
        'transfer-lines': 'transfers',
        'station-type': 'station-type',
        'operator': 'operators',
        'operating-companies': 'operators',
        'operators-list': 'operators',
        'station-name': 'header-title',
        'title': 'header-title',
        'line-badges': 'header-badges',
        'badges': 'header-badges',
        'controls': 'header-controls',
        'close-expand': 'header-controls',
        'share': 'share-button',
        'footer': 'footer-actions',
        'action-buttons': 'footer-actions',
        'nav-buttons': 'footer-actions'
    };

    /**
     * 规范化模块 ID
     * @param {string} id 
     * @returns {string}
     */
    function canonicalId(id) {
        if (!id) return '';
        const lower = String(id).trim().toLowerCase();
        return MODULE_ALIASES[lower] || lower;
    }

    /**
     * 车站信息板核心调度器
     */
    const StationBoard = {
        /** 模块注册字典 (键为标准模块 ID) */
        modules: new Map(),

        /** 自定义选项卡注册表 */
        customTabs: new Map(),

        /** 模块注册事件监听回调集合 */
        listeners: [],

        /**
         * 注册一个新模块
         * @param {Object} moduleDef 模块定义对象
         * @returns {StationBoard}
         */
        registerModule(moduleDef) {
            if (!moduleDef || !moduleDef.id) {
                console.error("[StationBoard] 模块注册失败：必须包含有效的 id 字段", moduleDef);
                return this;
            }

            const stdId = canonicalId(moduleDef.id);
            const normalized = {
                id: stdId,
                rawId: moduleDef.id,
                name: moduleDef.name || stdId,
                slot: moduleDef.slot || moduleDef.targetTab || 'line-tab',
                targetTab: moduleDef.targetTab || moduleDef.slot || 'line-tab',
                order: typeof moduleDef.order === 'number' ? moduleDef.order : 100,
                enabled: moduleDef.enabled !== false,
                shouldRender: typeof moduleDef.shouldRender === 'function' ? moduleDef.shouldRender : (() => true),
                render: typeof moduleDef.render === 'function' ? moduleDef.render : (() => ''),
                onMounted: typeof moduleDef.onMounted === 'function' ? moduleDef.onMounted : null,
                ...moduleDef
            };

            this.modules.set(stdId, normalized);
            // 兼容非规范 ID 的索引查找
            if (stdId !== moduleDef.id) {
                this.modules.set(moduleDef.id, normalized);
            }

            this.listeners.forEach(fn => {
                try { fn(normalized); } catch (e) { console.warn("[StationBoard] 监听回调异常:", e); }
            });

            return this;
        },

        /**
         * 获取指定模块定义
         * @param {string} id 
         * @returns {Object|null}
         */
        getModule(id) {
            const stdId = canonicalId(id);
            return this.modules.get(stdId) || this.modules.get(id) || null;
        },

        /**
         * 获取所有已注册的独立模块列表
         * @returns {Array<Object>}
         */
        getAllModules() {
            const seen = new Set();
            const result = [];
            this.modules.forEach(mod => {
                if (!seen.has(mod.id)) {
                    seen.add(mod.id);
                    result.push(mod);
                }
            });
            return result;
        },

        /**
         * 注册自定义全局选项卡
         * @param {Object} tabDef { id, title, icon, order }
         */
        registerTab(tabDef) {
            if (!tabDef || !tabDef.id) return this;
            this.customTabs.set(tabDef.id, {
                id: tabDef.id,
                title: tabDef.title || tabDef.name || tabDef.id,
                icon: tabDef.icon || null,
                order: typeof tabDef.order === 'number' ? tabDef.order : 50,
                ...tabDef
            });
            return this;
        },

        /**
         * 解析城市针对各模块的覆盖配置 (Enabled, Order, TargetTab 等)
         * @param {Object} city 城市上下文
         * @returns {{ modulesConfig: Object, tabsConfig: Array<Object> }}
         */
        resolveCityConfig(city) {
            const config = (city && (city.stationBoard || city.stationPanel)) || {};
            const modulesConfig = {};

            // 1. 如果 modules 是数组形式: modules: ['stacard', 'adjacent-stations', { id: 'custom', ... }]
            if (Array.isArray(config.modules)) {
                config.modules.forEach((item, index) => {
                    if (typeof item === 'string') {
                        modulesConfig[canonicalId(item)] = { enabled: true, order: (index + 1) * 10 };
                    } else if (item && typeof item === 'object' && item.id) {
                        const cid = canonicalId(item.id);
                        modulesConfig[cid] = { enabled: item.enabled !== false, order: item.order ?? (index + 1) * 10, ...item };
                        // 如果传入了动态内联模块实现，立即注册
                        if (typeof item.render === 'function') {
                            this.registerModule(item);
                        }
                    }
                });
            }
            // 2. 如果 modules 是字典形式: modules: { 'stacard': { enabled: false }, 'custom': { ... } }
            else if (config.modules && typeof config.modules === 'object') {
                Object.keys(config.modules).forEach(key => {
                    const cid = canonicalId(key);
                    const val = config.modules[key];
                    if (typeof val === 'boolean') {
                        modulesConfig[cid] = { enabled: val };
                    } else if (val && typeof val === 'object') {
                        modulesConfig[cid] = { ...val };
                        if (typeof val.render === 'function') {
                            this.registerModule({ id: key, ...val });
                        }
                    }
                });
            }

            // 3. 解析城市自定义选项卡声明
            const tabsConfig = Array.isArray(config.tabs) ? config.tabs : [];

            return { modulesConfig, tabsConfig };
        },

        /**
         * 获取当前上下文中有效启用的模块实例列表，并应用城市配置覆盖
         * @param {Object} cityConfig 城市配置解析结果
         * @param {string} targetSlotOrTab 目标槽位或目标选项卡
         * @returns {Array<Object>} 排序后的活动模块列表
         */
        getActiveModulesForSlot(cityConfig, targetSlotOrTab) {
            const all = this.getAllModules();
            const matched = [];

            all.forEach(baseMod => {
                const override = cityConfig.modulesConfig[baseMod.id] || {};
                
                // 判断是否启用：显式覆盖优先，否则取模块自身默认值
                const isEnabled = (override.enabled !== undefined) ? Boolean(override.enabled) : baseMod.enabled;
                if (!isEnabled) return;

                // 槽位/Tab 判定
                const effectiveSlot = override.targetTab || override.slot || baseMod.targetTab || baseMod.slot;
                if (effectiveSlot !== targetSlotOrTab) return;

                // 排序计算
                const effectiveOrder = (override.order !== undefined) ? override.order : baseMod.order;

                matched.push({
                    ...baseMod,
                    ...override,
                    effectiveOrder
                });
            });

            matched.sort((a, b) => a.effectiveOrder - b.effectiveOrder);
            return matched;
        },

        /**
         * 核心渲染主流程：拼装并挂载整个车站信息板
         * @param {HTMLElement} infoPanel 目标信息板 DOM 容器
         * @param {Object} context 上下文数据集合
         */
        render(infoPanel, context) {
            if (!infoPanel) return;

            const city = context.city || (typeof getActiveCity === 'function' ? getActiveCity() : (window.CURRENT_CITY || {}));
            const { modulesConfig, tabsConfig } = this.resolveCityConfig(city);
            const cityConfig = { modulesConfig, tabsConfig };

            const station = context.station;
            const initialTabIndex = typeof context.initialTabIndex === 'number' ? context.initialTabIndex : 0;
            const relatedLinesInfo = context.relatedLinesInfo || [];
            const displayLines = context.displayLines || relatedLinesInfo.filter(info => !info.isPointOnly || info.id === 'Rwy');

            // 收集挂载后需触发的 onMounted 任务队列
            const mountedTasks = [];

            // ==================================================================
            // 1. 渲染 Header 区域 (slot: 'header')
            // ==================================================================
            const headerModules = this.getActiveModulesForSlot(cityConfig, 'header');
            let headerInnerHtml = '';
            headerModules.forEach(mod => {
                if (mod.shouldRender(context)) {
                    const html = mod.render(context);
                    if (html) headerInnerHtml += html;
                    if (mod.onMounted) mountedTasks.push({ mod, context });
                }
            });

            // ==================================================================
            // 2. 渲染 Tabs 结构与 Tab Panes
            // ==================================================================
            // 内置选项卡：各线路选项卡 + 'station-info' 选项卡 + 城市自定义选项卡
            let tabsNavInnerHtml = '<div class="panel-tabs-nav">';
            let tabsPanesInnerHtml = '<div class="panel-tabs-body">';

            // 2.1 线路选项卡构建
            let currentTabIdx = 0;
            displayLines.forEach((lineInfo) => {
                const isActive = currentTabIdx === initialTabIndex ? 'active' : '';
                const lineColorStyle = lineInfo.lineColor ? `style="--line-color: ${lineInfo.lineColor}"` : '';

                tabsNavInnerHtml += `
                    <div class="tab-item ${isActive}" data-tab-index="${currentTabIdx}" ${lineColorStyle}>
                        ${lineInfo.name}
                    </div>
                `;

                // 渲染挂载到 'line-tab' 的模块
                const lineTabModules = this.getActiveModulesForSlot(cityConfig, 'line-tab');
                let linePaneHtml = '';
                const lineContext = {
                    ...context,
                    lineInfo,
                    isLineTab: true,
                    tabIndex: currentTabIdx,
                    tabId: lineInfo.id
                };

                lineTabModules.forEach(mod => {
                    if (mod.shouldRender(lineContext)) {
                        const html = mod.render(lineContext);
                        if (html) linePaneHtml += html;
                        if (mod.onMounted) mountedTasks.push({ mod, context: lineContext, paneIndex: currentTabIdx });
                    }
                });

                tabsPanesInnerHtml += `
                    <div class="tab-pane ${isActive}" data-tab-index="${currentTabIdx}">
                        ${linePaneHtml}
                    </div>
                `;
                currentTabIdx++;
            });

            // 2.2 城市自定义选项卡 (如果有)
            tabsConfig.forEach(cTab => {
                const tabId = cTab.id;
                const tabTitle = cTab.title || tabId;
                const isActive = currentTabIdx === initialTabIndex ? 'active' : '';

                tabsNavInnerHtml += `
                    <div class="tab-item ${isActive}" data-tab-index="${currentTabIdx}" data-custom-tab="${tabId}">
                        ${tabTitle}
                    </div>
                `;

                const customTabModules = this.getActiveModulesForSlot(cityConfig, tabId);
                let customPaneHtml = '';
                const customContext = {
                    ...context,
                    tabId,
                    isCustomTab: true,
                    tabIndex: currentTabIdx
                };

                customTabModules.forEach(mod => {
                    if (mod.shouldRender(customContext)) {
                        const html = mod.render(customContext);
                        if (html) customPaneHtml += html;
                        if (mod.onMounted) mountedTasks.push({ mod, context: customContext, paneIndex: currentTabIdx });
                    }
                });

                tabsPanesInnerHtml += `
                    <div class="tab-pane ${isActive}" data-tab-index="${currentTabIdx}" data-custom-tab="${tabId}">
                        ${customPaneHtml}
                    </div>
                `;
                currentTabIdx++;
            });

            // 2.3 车站信息详情选项卡 ('station-info')
            const isInfoActive = currentTabIdx === initialTabIndex ? 'active' : '';
            const infoTabIndex = 'station-info';

            tabsNavInnerHtml += `
                <div class="tab-item ${isInfoActive}" data-tab-index="${infoTabIndex}" style="--line-color: var(--text-light)">
                    车站信息
                </div>
            `;

            const infoTabModules = this.getActiveModulesForSlot(cityConfig, 'station-info');
            let infoPaneHtml = '';
            const infoContext = {
                ...context,
                tabId: 'station-info',
                isStationInfoTab: true,
                tabIndex: infoTabIndex
            };

            infoTabModules.forEach(mod => {
                if (mod.shouldRender(infoContext)) {
                    const html = mod.render(infoContext);
                    if (html) infoPaneHtml += html;
                    if (mod.onMounted) mountedTasks.push({ mod, context: infoContext, paneIndex: infoTabIndex });
                }
            });

            tabsPanesInnerHtml += `
                <div class="tab-pane ${isInfoActive}" data-tab-index="${infoTabIndex}">
                    ${infoPaneHtml}
                </div>
            `;

            tabsNavInnerHtml += '</div>'; // close .panel-tabs-nav
            tabsPanesInnerHtml += '</div>'; // close .panel-tabs-body

            // 2.4 Tabs 容器额外功能组件 (如右上角分享按钮: slot: 'tabs-nav')
            const tabsNavExtraModules = this.getActiveModulesForSlot(cityConfig, 'tabs-nav');
            let tabsNavExtraHtml = '';
            tabsNavExtraModules.forEach(mod => {
                if (mod.shouldRender(context)) {
                    const html = mod.render(context);
                    if (html) tabsNavExtraHtml += html;
                    if (mod.onMounted) mountedTasks.push({ mod, context });
                }
            });

            // ==================================================================
            // 3. 渲染 Body 顶部置顶区域 (slot: 'body-top')
            // ==================================================================
            const bodyTopModules = this.getActiveModulesForSlot(cityConfig, 'body-top');
            let bodyTopHtml = '';
            bodyTopModules.forEach(mod => {
                if (mod.shouldRender(context)) {
                    const html = mod.render(context);
                    if (html) bodyTopHtml += html;
                    if (mod.onMounted) mountedTasks.push({ mod, context });
                }
            });

            // ==================================================================
            // 4. 渲染 Footer 底部按钮栏 (slot: 'footer')
            // ==================================================================
            const footerModules = this.getActiveModulesForSlot(cityConfig, 'footer');
            let footerInnerHtml = '';
            footerModules.forEach(mod => {
                if (mod.shouldRender(context)) {
                    const html = mod.render(context);
                    if (html) footerInnerHtml += html;
                    if (mod.onMounted) mountedTasks.push({ mod, context });
                }
            });

            // 异常空数据兜底
            if (displayLines.length === 0) {
                tabsNavInnerHtml = '';
                tabsPanesInnerHtml = '<div style="padding:20px;text-align:center;color:#999;">暂无详细运营信息</div>';
            }

            // ==================================================================
            // 5. 整体 DOM 装配与写入
            // ==================================================================
            infoPanel.style.height = '';
            infoPanel.innerHTML = `
                <div class="panel-header">
                    ${headerInnerHtml}
                </div>
                <div class="panel-tabs-container">
                    ${tabsNavInnerHtml}
                    ${tabsNavExtraHtml}
                </div>
                <div class="panel-body">
                    ${bodyTopHtml}
                    ${tabsPanesInnerHtml}
                </div>
                <div class="panel-footer">
                    ${footerInnerHtml}
                </div>
            `;

            // ==================================================================
            // 6. 交互事件绑定与生命周期派发
            // ==================================================================
            this.bindEvents(infoPanel, context, displayLines);

            // 执行各模块 onMounted 钩子
            mountedTasks.forEach(({ mod, context }) => {
                try {
                    mod.onMounted(infoPanel, context);
                } catch (err) {
                    console.error(`[StationBoard] 模块 ${mod.id} onMounted 异常:`, err);
                }
            });

            // 调用外部核心引擎卡片异步渲染器
            if (typeof context.helpers?.renderStationCardsInPanel === 'function') {
                context.helpers.renderStationCardsInPanel(infoPanel, station);
            } else if (typeof window.renderStationCardsInPanel === 'function') {
                window.renderStationCardsInPanel(infoPanel, station);
            }

            // 恢复/定位初始激活 Tab
            if (initialTabIndex > 0) {
                const allTabs = infoPanel.querySelectorAll('.tab-item');
                if (allTabs[initialTabIndex]) {
                    allTabs[initialTabIndex].click();
                }
            }
        },

        /**
         * 绑定车站信息板通用交互事件 (选项卡切换、分享、关闭、展开、换乘跳转等)
         */
        bindEvents(infoPanel, context, displayLines) {
            const station = context.station;
            const helpers = context.helpers || {};

            // 1. 侧边栏吸附时动态标题更新
            if (document.body.classList.contains('legend-pinned') && typeof helpers.updateStationSectionTitle === 'function') {
                helpers.updateStationSectionTitle(station.cn);
            }

            // 2. Tab 选项卡切换交互
            const tabItems = infoPanel.querySelectorAll('.tab-item');
            const tabPanes = infoPanel.querySelectorAll('.tab-pane');

            tabItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tabItems.forEach(t => t.classList.remove('active'));
                    tabPanes.forEach(p => p.classList.remove('active'));

                    item.classList.add('active');
                    const targetIndex = item.dataset.tabIndex;
                    const targetPane = infoPanel.querySelector(`.tab-pane[data-tab-index="${targetIndex}"]`);
                    if (targetPane) targetPane.classList.add('active');

                    // 联动更新底部时刻表外链按钮
                    const footerScheduleBtn = infoPanel.querySelector('#footer-schedule-btn');
                    if (footerScheduleBtn) {
                        let targetUrl = null;
                        if (targetIndex !== 'station-info') {
                            const idx = parseInt(targetIndex, 10);
                            if (displayLines && displayLines[idx] && displayLines[idx].scheduleUrl) {
                                targetUrl = displayLines[idx].scheduleUrl;
                            }
                        }
                        if (!targetUrl && displayLines) {
                            targetUrl = displayLines.find(l => l.scheduleUrl)?.scheduleUrl || null;
                        }
                        if (targetUrl) {
                            footerScheduleBtn.href = targetUrl;
                            footerScheduleBtn.style.display = 'flex';
                        } else {
                            footerScheduleBtn.style.display = 'none';
                        }
                    }

                    if (typeof helpers.adjustPanelPosition === 'function') {
                        setTimeout(helpers.adjustPanelPosition, 50);
                    }
                });
            });

            // 3. 分享按钮
            const shareBtn = infoPanel.querySelector('.panel-share-btn');
            if (shareBtn && typeof helpers.handleShare === 'function') {
                shareBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const activeTab = infoPanel.querySelector('.tab-item.active');
                    let lineId = '';
                    if (activeTab && activeTab.dataset.tabIndex !== 'station-info') {
                        const idx = parseInt(activeTab.dataset.tabIndex, 10);
                        if (displayLines && displayLines[idx]) lineId = displayLines[idx].id;
                    }
                    helpers.handleShare(station, lineId);
                });
            }
            if (typeof helpers.updateShareMeta === 'function') {
                helpers.updateShareMeta(station);
            }

            // 4. 关闭按钮
            const closeBtn = infoPanel.querySelector('.panel-close-btn');
            if (closeBtn && typeof helpers.resetMapState === 'function') {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    helpers.resetMapState();
                });
            }

            // 5. 移动端展开/收起按钮
            const expandBtn = infoPanel.querySelector('.panel-expand-btn');
            if (expandBtn && typeof helpers.toggleMobilePanelSize === 'function') {
                expandBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    helpers.toggleMobilePanelSize(station);
                });
                if (document.body.classList.contains('mobile-panel-expanded') && typeof helpers.updateExpandIcon === 'function') {
                    helpers.updateExpandIcon(expandBtn, true);
                }
            }

            // 6. 换乘线路点击快速飞跃跳转
            const transferLinks = infoPanel.querySelectorAll('.transfer-link');
            transferLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const targetSid = link.dataset.jumpSid;
                    if (targetSid && typeof helpers.selectStation === 'function') {
                        helpers.selectStation(targetSid);
                    }
                });
            });

            // 7. 内联 SVG 样式注入与面板拖拽
            if (typeof helpers.injectInlineSvgs === 'function') {
                helpers.injectInlineSvgs(infoPanel);
            }
            if (typeof helpers.initPanelDrag === 'function') {
                helpers.initPanelDrag();
            }
        }
    };

    // ==========================================================================
    // 7. 注册全套内置标准模块 (Built-in Standard Modules)
    // ==========================================================================

    /**
     * 模块 1: 关闭与移动端展开按钮 (header-controls)
     */
    StationBoard.registerModule({
        id: 'header-controls',
        name: '控制按钮',
        slot: 'header',
        order: 10,
        render(context) {
            const expandBtnHtml = (window.innerWidth <= 640)
                ? `<button class="panel-expand-btn" title="展开/收起">
                     <cgo-icon name="expand-less" size="18"></cgo-icon>
                   </button>`
                : '';
            return `
                <button class="panel-close-btn" title="关闭面板">
                    <cgo-icon name="close" size="24"></cgo-icon>
                </button>
                ${expandBtnHtml}
            `;
        }
    });

    /**
     * 模块 2: 中英文名标题栏 (header-title)
     */
    StationBoard.registerModule({
        id: 'header-title',
        name: '中英文站名标题',
        slot: 'header',
        order: 20,
        render(context) {
            const station = context.station || {};
            let enNameDisplay = (station.en || '').replace(/<br>/gi, ' ');
            if (station.cn === '首经贸') {
                enNameDisplay = (station.en || '').replace(/<br>/gi, '<span class="special-br"></span>');
            }
            return `
                <div class="header-name-group">
                    <div class="panel-cn-name">${station.cn || ''}</div>
                    <div class="panel-en-name">${enNameDisplay}</div>
                </div>
            `;
        }
    });

    /**
     * 模块 3: 经停线路徽标徽章 (header-badges)
     */
    StationBoard.registerModule({
        id: 'header-badges',
        name: '经停线路徽标',
        slot: 'header',
        order: 30,
        render(context) {
            const relatedLinesInfo = context.relatedLinesInfo || [];
            const badgesHtml = relatedLinesInfo.map(info => {
                const styleStr = info.svgclr ? `--svgclr:${info.svgclr}; --svgtext:${info.svgtext};` : '';
                return info.svg
                    ? `<span class="svg-icon-placeholder line-badge" data-src="${info.svg}" style="${styleStr}"></span>`
                    : `<span class="text-badge">${info.name}</span>`;
            }).join('');
            return `<div class="panel-badges">${badgesHtml}</div>`;
        }
    });

    /**
     * 模块 4: 分享按钮 (share-button)
     */
    StationBoard.registerModule({
        id: 'share-button',
        name: '分享按钮',
        slot: 'tabs-nav',
        order: 99,
        render(context) {
            return `
                <button class="panel-share-btn" title="分享车站信息">
                    <cgo-icon name="external" size="20"></cgo-icon>
                </button>
            `;
        }
    });

    /**
     * 模块 5: 同台换乘置顶卡片 (hoisted-stacard)
     */
    StationBoard.registerModule({
        id: 'hoisted-stacard',
        name: '同台换乘置顶卡片',
        slot: 'body-top',
        order: 10,
        shouldRender(context) {
            return Boolean(context.isCrossPlatformDisplay);
        },
        render(context) {
            const city = context.city || {};
            const station = context.station;
            const relatedLinesInfo = context.relatedLinesInfo || [];
            const mainLine = relatedLinesInfo.find(info => typeof city.hasStaCard === 'function' && city.hasStaCard(station.id, info.id, info)) || relatedLinesInfo[0] || {};
            if (typeof city.getStaCardHtml === 'function') {
                return city.getStaCardHtml(station, mainLine, true);
            }
            return '';
        }
    });

    /**
     * 模块 6: 高德地图切片微缩视窗 / 车站卡片系统 (stacard)
     */
    StationBoard.registerModule({
        id: 'stacard',
        name: '高德地图切片与车站卡片',
        targetTab: 'line-tab',
        order: 10,
        shouldRender(context) {
            // 若已作为同台换乘在顶部全局置顶展示，则在子线路选项卡中不重复渲染
            return !context.isCrossPlatformDisplay;
        },
        render(context) {
            const city = context.city || {};
            const station = context.station;
            const lineInfo = context.lineInfo || {};
            if (typeof city.getStaCardHtml === 'function') {
                return city.getStaCardHtml(station, lineInfo, false);
            }
            return '';
        }
    });

    /**
     * 模块 7: 上一站下一站与站间距 (adjacent-stations)
     */
    StationBoard.registerModule({
        id: 'adjacent-stations',
        name: '上一站下一站',
        targetTab: 'line-tab',
        order: 20,
        render(context) {
            const isMergeStation = context.isMergeStation;
            const lineInfo = context.lineInfo || {};
            const isSuburbanStation = context.isSuburbanStation;
            const shouldHideNone = isMergeStation || lineInfo.isRwy;

            const createRow = (label, value) => {
                if (isMergeStation && value === "无") return "";
                return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value" style="line-height:1.4;">${value}</span></div>`;
            };

            let stopsHtml = '';
            if (lineInfo.prev) {
                if (!(shouldHideNone && lineInfo.prev === "无")) {
                    stopsHtml += createRow("上一站", lineInfo.prev);
                }
            }
            if (lineInfo.next) {
                if (!(shouldHideNone && lineInfo.next === "无")) {
                    stopsHtml += createRow(lineInfo.nextLabel || "下一站", lineInfo.next);
                }
            }
            if (isSuburbanStation) {
                stopsHtml += `<div style="font-size:10px; color:var(--text-light); margin-bottom:10px; font-weight:bold;">乘坐市郊铁路请参考线路的列车时刻表出行</div>`;
            }

            return stopsHtml;
        }
    });

    /**
     * 模块 8: 换乘线路信息 (transfers)
     */
    StationBoard.registerModule({
        id: 'transfers',
        name: '换乘线路走向',
        targetTab: 'line-tab',
        order: 30,
        render(context) {
            const station = context.station;
            const helpers = context.helpers || {};
            if (typeof helpers.generateTransferHtml === 'function') {
                return helpers.generateTransferHtml(station.id);
            } else if (typeof window.generateTransferHtml === 'function') {
                return window.generateTransferHtml(station.id);
            }
            return '';
        }
    });

    /**
     * 模块 9: 车站类型 (station-type)
     */
    StationBoard.registerModule({
        id: 'station-type',
        name: '车站类型',
        targetTab: 'station-info',
        order: 10,
        render(context) {
            const station = context.station || {};
            const typeMap = {
                'dot': '普通站',
                'tsf': '换乘站',
                'tsfo': '站外换乘站',
                'diy': '换乘和接驳站',
                'no': '未开通车站',
                'rdot': '中国铁路车站'
            };
            const stationTypeStr = typeMap[station.type] || '普通站';
            return `
                <div class="info-row" style="margin-bottom:15px; border-bottom:1px dashed var(--divider); padding-bottom:10px; font-size: 13px;">
                    <span class="info-label">车站类型</span>
                    <span class="info-value">${stationTypeStr}</span>
                </div>
            `;
        }
    });

    /**
     * 模块 10: 运营商与运营单位 (operators)
     */
    StationBoard.registerModule({
        id: 'operators',
        name: '运营单位',
        targetTab: 'station-info',
        order: 20,
        render(context) {
            const relatedLinesInfo = context.relatedLinesInfo || [];
            let opInfoHtml = '';

            relatedLinesInfo.forEach(info => {
                const styleStr = info.svgclr
                    ? `height:28px; width:auto; vertical-align:middle; margin-right:10px; margin-top:3px; --svgclr:${info.svgclr}; --svgtext:${info.svgtext};`
                    : 'height:28px; width:auto; vertical-align:middle; margin-right:10px; margin-top:3px;';
                const iconHtml = info.svg
                    ? `<span class="svg-icon-placeholder line-badge" data-src="${info.svg}" style="${styleStr}"></span>`
                    : `<span class="text-badge" style="font-size:10px; margin-right:10px; vertical-align:middle;">${info.name}</span>`;

                opInfoHtml += `
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; padding-left:10px;">
                        ${iconHtml}
                        <span style="font-size:13px; color:var(--text-main); font-weight:bold; text-align:right;">${info.company || '未知运营'}</span>
                    </div>
                `;
            });

            return `
                <div style="margin-bottom:5px; font-size: 13px;">
                    <div class="info-label" style="margin-bottom:8px;">运营单位</div>
                    ${opInfoHtml}
                </div>
            `;
        }
    });

    /**
     * 模块 11: 底部操作栏外链按钮 (footer-actions)
     */
    StationBoard.registerModule({
        id: 'footer-actions',
        name: '底部外链与导航操作',
        slot: 'footer',
        order: 10,
        render(context) {
            const station = context.station || {};
            const city = context.city || {};
            const isNoStation = context.isNoStation;
            const isRwyStation = context.isRwyStation;
            const isSuburbanStation = context.isSuburbanStation;
            const displayLines = context.displayLines || [];
            const initialTabIndex = context.initialTabIndex || 0;

            const baseBtnStyle = 'border-radius:6px; text-decoration:none; display:flex; align-items:center; justify-content:center; font-weight:bold; border:none; cursor:pointer; white-space:nowrap; box-shadow:0 2px 5px rgba(0,0,0,0.1); flex:1;';
            const btnDark = `padding:12px 0; background:var(--primary-color); color:var(--btn-text); font-size:14px; ${baseBtnStyle}`;
            const btnDarkTiny = `padding:8px 0; background:var(--primary-color); color:var(--btn-text); font-size:11px; ${baseBtnStyle}`;
            const btnWhite = `padding:12px 0; background:var(--btn-info-bg); color:var(--text-main); border:1px solid var(--border-color); font-size:14px; box-shadow:0 2px 5px rgba(0,0,0,0.05); ${baseBtnStyle}`;
            const btnWhiteTiny = `padding:8px 0; background:var(--btn-info-bg); color:var(--text-main); border:1px solid var(--border-color); font-size:11px; box-shadow:0 2px 5px rgba(0,0,0,0.05); ${baseBtnStyle}`;

            const isSuburbanOrRail = isSuburbanStation || isRwyStation;
            const mapUrl = city.getNavigationUrl ? city.getNavigationUrl(station.cn, isSuburbanOrRail) : `https://uri.amap.com/search?keyword=${encodeURIComponent(station.cn)}`;
            const url12306 = city.getRailway12306Url ? city.getRailway12306Url(station.cn) : `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent((station.cn || '').replace(/站$/, ''))}`;
            const isRwy2Station = station.relatedLines && station.relatedLines.includes('Rwy2');

            const initialLineScheduleUrl = (displayLines[initialTabIndex] && displayLines[initialTabIndex].scheduleUrl)
                || (displayLines[0] && displayLines[0].scheduleUrl)
                || displayLines.find(l => l.scheduleUrl)?.scheduleUrl
                || null;

            if (isNoStation) {
                return '<div style="padding:10px; color:#999;">该车站目前尚未运营</div>';
            }

            if (isRwyStation) {
                const btnsHtml = `
                    <a href="${url12306}" target="_blank" style="${btnDark}">12306查询</a>
                    <a href="${mapUrl}" target="_blank" onclick="resetMapState()" style="${btnWhite}">高德导航</a>
                `;
                return `<div style="display:flex; gap:12px;">${btnsHtml}</div>`;
            }

            if (isSuburbanStation) {
                const suburbanLinks = (typeof city.getSuburbanLinks === 'function') ? city.getSuburbanLinks() : null;
                let subLinksHtml = '';
                if (suburbanLinks) {
                    if (suburbanLinks.timetableUrl) subLinksHtml += `<a href="${suburbanLinks.timetableUrl}" target="_blank" style="${btnDarkTiny}">市郊时刻表</a>`;
                    if (suburbanLinks.ticketUrl) subLinksHtml += `<a href="${suburbanLinks.ticketUrl}" target="_blank" style="${btnDarkTiny}">市郊票务</a>`;
                }
                const btnsHtml = `
                    ${subLinksHtml}
                    <a href="${url12306}" target="_blank" style="${btnDarkTiny}">12306查询</a>
                    <a href="${mapUrl}" target="_blank" onclick="resetMapState()" style="${btnWhiteTiny}">高德导航</a>
                `;
                return `<div style="display:flex; gap:4px;">${btnsHtml}</div>`;
            }

            if (isRwy2Station) {
                const scheduleBtnHtml = initialLineScheduleUrl
                    ? `<a href="${initialLineScheduleUrl}" id="footer-schedule-btn" target="_blank" style="${btnDarkTiny}">官网查询</a>`
                    : `<a href="#" id="footer-schedule-btn" target="_blank" style="${btnDarkTiny}; display:none;">官网查询</a>`;
                const btnsHtml = `
                    ${scheduleBtnHtml}
                    <a href="${url12306}" target="_blank" style="${btnDarkTiny}">12306查询</a>
                    <a href="${mapUrl}" target="_blank" onclick="resetMapState()" style="${btnWhiteTiny}">高德导航</a>
                `;
                return `<div style="display:flex; gap:4px;">${btnsHtml}</div>`;
            }

            // 普通地铁站点
            const scheduleBtnHtml = initialLineScheduleUrl
                ? `<a href="${initialLineScheduleUrl}" id="footer-schedule-btn" target="_blank" style="${btnDark}">官网查询</a>`
                : `<a href="#" id="footer-schedule-btn" target="_blank" style="${btnDark}; display:none;">官网查询</a>`;
            const btnsHtml = `
                ${scheduleBtnHtml}
                <a href="${mapUrl}" target="_blank" onclick="resetMapState()" style="${btnWhite}">高德导航</a>
            `;
            return `<div style="display:flex; gap:12px;">${btnsHtml}</div>`;
        }
    });

    // ==========================================================================
    // 全局挂载导出
    // ==========================================================================
    window.StationBoard = StationBoard;
    console.log("[StationBoard] 车站信息板模块注册与渲染引擎初始化完成，已装载 11 个标准内置模块。");
})();
