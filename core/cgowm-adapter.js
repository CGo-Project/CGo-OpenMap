/**
 * CGo OpenMap - CGoWM 统一窗口管理适配器 (core/cgowm-adapter.js)
 *
 * 职责：
 *   1. 初始化 `window.CGoWM`（hostId/programId: 'openmap'，mobileWorkspace: 'standalone'）；
 *   2. 桌面端默认浮窗模式；若作为桌面 PWA 独立窗口首次启动，则自动以 sidebar 模式起步；
 *   3. 为允许停靠的面板注入标题栏 `.cgowm-btn-dock` 停靠/浮窗切换按钮；
 *   4. 管理响应式面板（station、route-plan、route-result、map-tools）在 >640px（CGoWM 托管）
 *      与 <=640px（原生 mobile-sheet 抽屉）之间的无缝迁移；
 *   5. 实时同步左侧栏/Icon Rail 对 `#modern-zoom-control` 的避让 CSS 变量，并刷新 `CGoViewportInset`；
 *   6. 提供「面板与窗口」管理器弹窗及工作区重置能力。
 */
(function (global) {
    'use strict';

    var MOBILE_MAX = 640;
    var PROGRAM_ID = 'openmap';
    var DEFAULT_MODE_KEY = 'cgo_openmap_default_panel_mode';
    var STATION_PREF_KEY = 'cgo_openmap_station_wm_pref';
    var LEGACY_STATION_WM_KEY = 'cgowm:v1:' + PROGRAM_ID + ':' + PROGRAM_ID + ':station:state';
    var WORKSPACE_STORAGE_KEY = 'cgowm:v1:' + PROGRAM_ID + ':' + PROGRAM_ID + ':workspace:state';
    var PWA_INIT_KEY = 'cgo_openmap_pwa_sidebar_init';
    var LEGACY_PIN_KEY = 'isLegendPinned';
    var PWA_DISPLAY_MODES = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];

    var PANEL_DISPLAY_ORDER = ['legend', 'station', 'route-plan', 'route-result', 'map-tools'];
    var PANEL_FALLBACK_TITLES = {
        legend: '搜索与线路',
        station: '车站详情',
        'route-plan': '规划行程',
        'route-result': '行程结果',
        'map-tools': '地图小工具'
    };

    var api = null;
    var initialized = false;
    var listenersBound = false;
    var readyCallbacks = [];
    var panels = new Map();
    var suppressCloseKeys = new Set();
    var syncRaf = 0;
    var lastTopInset = -1;
    var lastLeftWidth = -1;
    var lastRightWidth = -1;
    var lastLeftState = '';
    var lastRightState = '';
    var lastIsMobile = null;
    var firstPwaSidebarLaunch = false;
    var legacyPinnedMigrated = false;
    var stationObserver = null;
    var observedSidebars = new WeakSet();

    var stationPref = null;
    var stationPanelEl = null;
    var stationMobileHome = null;
    var stationWindows = new Map();
    var stationKeyToSid = new Map();
    var activeStationSid = null;
    var internalStationOpDepth = 0;
    var stationHandlers = {
        onSelect: null,
        onDeactivate: null,
        onRemoveHistory: null,
        getStationMeta: null,
        getHistoryIds: null,
        getHistoryLimit: null
    };

    function safeGetLS(key) {
        try {
            return global.localStorage ? global.localStorage.getItem(key) : null;
        } catch (_) {
            return null;
        }
    }

    function safeSetLS(key, value) {
        try {
            if (global.localStorage) global.localStorage.setItem(key, value);
        } catch (_) {}
    }

    function hasAnyWmStorage() {
        try {
            if (!global.localStorage) return false;
            var prefix = 'cgowm:v1:' + PROGRAM_ID + ':';
            for (var i = 0; i < global.localStorage.length; i++) {
                var k = global.localStorage.key(i);
                if (k && k.indexOf(prefix) === 0) return true;
            }
        } catch (_) {}
        return false;
    }

    function isMobile() {
        return global.innerWidth <= MOBILE_MAX;
    }

    function isStandalonePwa() {
        if (global.navigator && global.navigator.standalone === true) return true;
        if (typeof global.matchMedia === 'function') {
            for (var i = 0; i < PWA_DISPLAY_MODES.length; i++) {
                try {
                    if (global.matchMedia('(display-mode: ' + PWA_DISPLAY_MODES[i] + ')').matches) {
                        return true;
                    }
                } catch (_) {}
            }
        }
        return false;
    }

    function evaluateInitialModePreference() {
        var saved = safeGetLS(DEFAULT_MODE_KEY);
        if (saved === 'float' || saved === 'sidebar') return;

        if (!isMobile() && isStandalonePwa() && safeGetLS(PWA_INIT_KEY) !== 'true') {
            safeSetLS(PWA_INIT_KEY, 'true');
            safeSetLS(DEFAULT_MODE_KEY, 'sidebar');
            firstPwaSidebarLaunch = true;
            return;
        }

        if (!hasAnyWmStorage() && safeGetLS(LEGACY_PIN_KEY) === 'true') {
            safeSetLS(DEFAULT_MODE_KEY, 'sidebar');
            legacyPinnedMigrated = true;
        }
    }

    function getDefaultDesktopMode() {
        return safeGetLS(DEFAULT_MODE_KEY) === 'sidebar' ? 'sidebar' : 'float';
    }

    function setDefaultDesktopMode(mode) {
        var normalized = mode === 'sidebar' ? 'sidebar' : 'float';
        safeSetLS(DEFAULT_MODE_KEY, normalized);
        return normalized;
    }

    function shouldAutoOpenLegend() {
        if (isMobile()) return false;
        if (firstPwaSidebarLaunch || legacyPinnedMigrated) return true;
        return false;
    }

    function measureTopWorkInset() {
        if (isMobile()) return 0;
        var island = document.querySelector('.tool-header .header-island');
        if (island) {
            var ir = island.getBoundingClientRect();
            if (ir.height > 1) {
                return Math.max(68, Math.min(116, Math.round(ir.bottom + 10)));
            }
        }
        var header = document.getElementById('header-container');
        if (header) {
            var hr = header.getBoundingClientRect();
            if (hr.height > 1) {
                return Math.max(68, Math.min(116, Math.round(hr.bottom + 10)));
            }
        }
        return 76;
    }

    function updateCssTopVar(topInset) {
        if (document.documentElement) {
            document.documentElement.style.setProperty('--cgowm-sidebar-top', (topInset > 0 ? topInset : 12) + 'px');
        }
    }

    function fullKey(id) {
        return String(id).indexOf(':') !== -1 ? String(id) : (PROGRAM_ID + ':' + id);
    }

    function idFromKey(key) {
        var s = String(key || '');
        var prefix = PROGRAM_ID + ':';
        return s.indexOf(prefix) === 0 ? s.slice(prefix.length) : s;
    }

    function getInstance(id) {
        if (!api) return null;
        var norm = idFromKey(id);
        if (norm === 'station') {
            var activeRec = activeStationSid ? stationWindows.get(activeStationSid) : null;
            if (activeRec && activeRec.inst && activeRec.inst.state.lifecycle !== 'destroyed') {
                return activeRec.inst;
            }
            for (var it = stationWindows.values(), step = it.next(); !step.done; step = it.next()) {
                if (step.value && !step.value.evicting && step.value.inst && step.value.inst.state.lifecycle !== 'destroyed') {
                    return step.value.inst;
                }
            }
            return null;
        }
        var rec = panels.get(norm);
        if (rec && rec.inst) return rec.inst;
        return api.get(fullKey(id));
    }

    function isOpen(id) {
        if (idFromKey(id) === 'station') {
            return Boolean(activeStationSid && stationWindows.get(activeStationSid));
        }
        var inst = getInstance(id);
        if (!inst || !inst.state) return false;
        return inst.state.lifecycle === 'visible' || inst.state.lifecycle === 'minimized';
    }

    function isVisible(id) {
        var inst = getInstance(id);
        if (!inst) return false;
        if (typeof inst.isEffectivelyVisible === 'function') return !!inst.isEffectivelyVisible();
        return isOpen(id) && !inst.element.hidden;
    }

    function isSidebar(id) {
        if (idFromKey(id) === 'station') {
            return hasStationSidebar();
        }
        var inst = getInstance(id);
        if (!inst) return false;
        var mode = (inst.state && inst.state.effectiveMode) || (inst.element && inst.element.dataset.mode);
        return mode === 'sidebar';
    }

    function withInternalStationOp(fn) {
        internalStationOpDepth += 1;
        try {
            return fn();
        } finally {
            internalStationOpDepth -= 1;
        }
    }

    function loadStationPref() {
        if (stationPref) return stationPref;
        var fallback = { mode: getDefaultDesktopMode(), side: 'right', floatRect: null };
        try {
            var raw = safeGetLS(STATION_PREF_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    var rect = parsed.floatRect && typeof parsed.floatRect === 'object'
                        ? {
                            x: Number(parsed.floatRect.x),
                            y: Number(parsed.floatRect.y),
                            width: Number(parsed.floatRect.width),
                            height: Number(parsed.floatRect.height)
                        }
                        : null;
                    if (rect && (!Number.isFinite(rect.x) || !Number.isFinite(rect.y) || !Number.isFinite(rect.width) || !Number.isFinite(rect.height))) {
                        rect = null;
                    }
                    stationPref = {
                        mode: parsed.mode === 'sidebar' ? 'sidebar' : 'float',
                        side: parsed.side === 'left' ? 'left' : 'right',
                        floatRect: rect
                    };
                    return stationPref;
                }
            }
            var legacyRaw = safeGetLS(LEGACY_STATION_WM_KEY);
            if (legacyRaw) {
                var legacyParsed = JSON.parse(legacyRaw);
                if (legacyParsed && typeof legacyParsed === 'object') {
                    fallback.mode = legacyParsed.mode === 'sidebar' ? 'sidebar' : 'float';
                    fallback.side = legacyParsed.sidebarSide === 'left' ? 'left' : 'right';
                }
            }
        } catch (_) {}
        stationPref = fallback;
        return stationPref;
    }

    function saveStationPref(patch) {
        var cur = loadStationPref();
        var next = {
            mode: patch && patch.mode ? (patch.mode === 'sidebar' ? 'sidebar' : 'float') : cur.mode,
            side: patch && patch.side ? (patch.side === 'left' ? 'left' : 'right') : cur.side,
            floatRect: (patch && Object.prototype.hasOwnProperty.call(patch, 'floatRect')) ? patch.floatRect : cur.floatRect
        };
        stationPref = next;
        try {
            safeSetLS(STATION_PREF_KEY, JSON.stringify(next));
        } catch (_) {}
        return next;
    }

    function cleanStaleStationWorkspaceState() {
        try {
            var raw = safeGetLS(WORKSPACE_STORAGE_KEY);
            if (!raw) return;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;
            var dirty = false;
            var prefix = PROGRAM_ID + ':station-';
            if (parsed.order && typeof parsed.order === 'object') {
                ['left', 'right'].forEach(function (side) {
                    if (Array.isArray(parsed.order[side])) {
                        var filtered = parsed.order[side].filter(function (k) {
                            return typeof k === 'string' && k.indexOf(prefix) !== 0;
                        });
                        if (filtered.length !== parsed.order[side].length) {
                            parsed.order[side] = filtered;
                            dirty = true;
                        }
                    }
                });
            }
            if (parsed.dockHeights && typeof parsed.dockHeights === 'object') {
                Object.keys(parsed.dockHeights).forEach(function (k) {
                    if (k.indexOf(prefix) === 0 || k === (PROGRAM_ID + ':station')) {
                        delete parsed.dockHeights[k];
                        dirty = true;
                    }
                });
            }
            if (dirty) {
                safeSetLS(WORKSPACE_STORAGE_KEY, JSON.stringify(parsed));
            }
        } catch (_) {}
    }

    function encodeStationPanelId(sid) {
        var raw = String(sid || '');
        if (/^[a-zA-Z0-9._-]+$/.test(raw) && raw.length <= 100) {
            return 'station-' + raw;
        }
        var hex = '';
        if (typeof TextEncoder === 'function') {
            var bytes = new TextEncoder().encode(raw);
            for (var i = 0; i < bytes.length; i++) {
                hex += bytes[i].toString(16).padStart(2, '0');
            }
        } else {
            for (var j = 0; j < raw.length; j++) {
                hex += raw.charCodeAt(j).toString(16).padStart(4, '0');
            }
        }
        return 'station-h' + (hex.slice(0, 100) || '0');
    }

    function getInfoPanelEl() {
        if (stationPanelEl && stationPanelEl.isConnected) return stationPanelEl;
        var el = document.getElementById('info-panel');
        if (el) stationPanelEl = el;
        return stationPanelEl;
    }

    function parkInfoPanel() {
        var panel = getInfoPanelEl();
        if (!panel) return;
        var targetHome = stationMobileHome || document.body;
        if (targetHome && panel.parentElement !== targetHome) {
            targetHome.appendChild(panel);
        }
        panel.style.display = 'none';
        syncStationInlineControls();
    }

    function mountInfoPanelInto(inst) {
        var panel = getInfoPanelEl();
        if (!panel || !inst || !inst.contentElement) return;
        panel.classList.remove('docked');
        panel.style.left = '';
        panel.style.top = '';
        panel.style.right = '';
        panel.style.bottom = '';
        panel.style.width = '';
        panel.style.height = '';
        panel.style.maxHeight = '';
        panel.style.boxShadow = '';
        panel.style.borderRadius = '';
        panel.style.display = 'flex';
        panel.style.opacity = '1';
        if (panel.parentElement !== inst.contentElement) {
            inst.contentElement.appendChild(panel);
        }
    }

    function getStationRecordForInfoPanel(infoPanel) {
        if (!infoPanel) return null;
        var winEl = infoPanel.closest('.cgowm-window.openmap-station-window');
        if (!winEl) return null;
        var sid = stationKeyToSid.get(winEl.dataset.cgowmKey);
        return sid ? stationWindows.get(sid) : null;
    }

    function syncStationInlineControls() {
        var infoPanel = getInfoPanelEl();
        if (!infoPanel) return;
        var panelHeader = infoPanel.querySelector(':scope > .panel-header');
        if (!panelHeader) return;

        if (!panelHeader.hasAttribute('data-cgowm-drag-handle')) {
            panelHeader.setAttribute('data-cgowm-drag-handle', '');
        }

        var existing = panelHeader.querySelector(':scope > .cgowm-inline-controls');
        var ownerRec = getStationRecordForInfoPanel(infoPanel);
        var inst = ownerRec && ownerRec.inst;
        var mode = (inst && inst.state && inst.state.effectiveMode) || (inst && inst.element && inst.element.dataset.mode) || 'float';

        if (isMobile() || !initialized || !inst || mode === 'sidebar') {
            if (existing) existing.hidden = true;
            return;
        }

        if (!existing) {
            existing = document.createElement('div');
            existing.className = 'cgowm-inline-controls';

            var dockBtn = document.createElement('button');
            dockBtn.type = 'button';
            dockBtn.className = 'cgowm-control cgowm-btn-dock';
            var dockIcon = document.createElement('cgo-icon');
            dockIcon.setAttribute('size', '14');
            dockBtn.appendChild(dockIcon);
            dockBtn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                var curRec = getStationRecordForInfoPanel(getInfoPanelEl());
                if (curRec) toggleDock(curRec.panelId);
            });

            var closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'cgowm-control cgowm-btn-close';
            closeBtn.title = '关闭';
            closeBtn.setAttribute('aria-label', '关闭车站详情');
            var closeIcon = document.createElement('cgo-icon');
            closeIcon.setAttribute('name', 'close');
            closeIcon.setAttribute('size', '15');
            closeBtn.appendChild(closeIcon);
            closeBtn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                var curRec = getStationRecordForInfoPanel(getInfoPanelEl());
                if (curRec) close(curRec.panelId);
                else deactivateStation({ clearFloat: true });
            });

            existing.appendChild(dockBtn);
            existing.appendChild(closeBtn);
            panelHeader.appendChild(existing);
        }

        existing.hidden = false;
        var pinBtn = existing.querySelector('.cgowm-btn-dock');
        if (pinBtn) {
            pinBtn.classList.remove('is-docked');
            pinBtn.title = '停靠到侧边栏';
            pinBtn.setAttribute('aria-label', '停靠到侧边栏');
            var pinIcon = pinBtn.querySelector('cgo-icon');
            if (pinIcon) pinIcon.setAttribute('name', 'pin-angle');
        }
    }

    function ensureStationObserver() {
        if (stationObserver) return;
        var infoPanel = getInfoPanelEl();
        if (!infoPanel) return;
        stationObserver = new MutationObserver(function () {
            syncStationInlineControls();
        });
        stationObserver.observe(infoPanel, { childList: true });
        syncStationInlineControls();
    }

    function renderStationTitleLines(inst, meta) {
        if (!inst || !inst.dragHandle) return;
        var wrap = inst.dragHandle.querySelector(':scope > .cgowm-station-title-lines');
        if (!wrap) {
            wrap = document.createElement('span');
            wrap.className = 'cgowm-station-title-lines header-color-squares';
            wrap.setAttribute('aria-hidden', 'true');
            if (inst.badgeElement && inst.badgeElement.parentElement === inst.dragHandle) {
                inst.dragHandle.insertBefore(wrap, inst.badgeElement);
            } else {
                inst.dragHandle.appendChild(wrap);
            }
        }
        wrap.replaceChildren();
        var lines = (meta && Array.isArray(meta.lines)) ? meta.lines : [];
        lines.forEach(function (line) {
            if (!line) return;
            var sq = document.createElement('span');
            sq.className = 'header-color-square';
            sq.style.background = line.color || 'var(--cwm-primary)';
            if (line.name) sq.title = line.name;
            wrap.appendChild(sq);
        });
    }

    function resolveDefaultFloatRect() {
        var pref = loadStationPref();
        var vw = global.innerWidth || 1280;
        var vh = global.innerHeight || 800;
        var topInset = measureTopWorkInset();
        if (pref.floatRect) {
            var fw = Math.max(280, Math.min(vw - 24, Math.round(pref.floatRect.width)));
            var fh = Math.max(280, Math.min(vh - topInset - 16, Math.round(pref.floatRect.height)));
            var fx = Math.max(0, Math.min(Math.max(0, vw - fw), Math.round(pref.floatRect.x)));
            var fy = Math.max(topInset, Math.min(Math.max(topInset, vh - 48), Math.round(pref.floatRect.y)));
            return { x: fx, y: fy, width: fw, height: fh };
        }
        var mapEl = document.getElementById('map-container');
        var mapRect = mapEl ? mapEl.getBoundingClientRect() : null;
        var leftEdge = (mapRect && mapRect.width >= 1) ? mapRect.left : 0;
        var rightEdge = (mapRect && mapRect.width >= 1) ? mapRect.right : vw;
        var w = 350;
        var h = Math.min(540, Math.max(320, vh - topInset - 36));
        var x = Math.max(leftEdge + 16, Math.round(rightEdge - w - 20));
        var y = Math.max(topInset + 8, Math.round(topInset + (vh - topInset - h) / 2));
        return { x: x, y: y, width: w, height: h };
    }

    function captureFloatRect(inst) {
        if (!inst || !inst.state || inst.state.effectiveMode !== 'float' || inst.element.hidden) return;
        var w = Number(inst.state.width);
        var h = Number(inst.state.height);
        var rect = {
            x: Math.round(Number(inst.state.x) || 0),
            y: Math.round(Number(inst.state.y) || 0),
            width: Number.isFinite(w) && w >= 260 ? Math.round(w) : 350,
            height: Number.isFinite(h) && h >= 260 ? Math.round(h) : 540
        };
        saveStationPref({ floatRect: rect });
    }

    function hasStationSidebar() {
        for (var it = stationWindows.values(), step = it.next(); !step.done; step = it.next()) {
            var r = step.value;
            if (!r || r.evicting || !r.inst || r.inst.state.lifecycle === 'destroyed') continue;
            var mode = (r.inst.state && r.inst.state.effectiveMode) || (r.inst.element && r.inst.element.dataset.mode);
            if (mode === 'sidebar') return true;
        }
        return false;
    }

    function getSidebarStationRecords(excludeSid) {
        var list = [];
        stationWindows.forEach(function (r) {
            if (!r || r.evicting || r.sid === excludeSid || !r.inst || r.inst.state.lifecycle === 'destroyed') return;
            if (r.inst.state.mode === 'sidebar') list.push(r);
        });
        return list;
    }

    function getFloatStationRecords(excludeSid) {
        var list = [];
        stationWindows.forEach(function (r) {
            if (!r || r.evicting || r.sid === excludeSid || !r.inst || r.inst.state.lifecycle === 'destroyed') return;
            if (r.inst.state.mode === 'float') list.push(r);
        });
        return list;
    }

    function placeStationInSidebarOrder(inst, side, anchorOptions) {
        if (!api || typeof api.getWorkspaceSnapshot !== 'function') return;
        var snap = api.getWorkspaceSnapshot();
        var rawOrder = (snap && snap.order && Array.isArray(snap.order[side])) ? snap.order[side] : [];
        var filtered = rawOrder.filter(function (k) { return k !== inst.key; });
        var targetIdx = -1;

        if (anchorOptions && anchorOptions.beforeSid) {
            var beforeRec = stationWindows.get(anchorOptions.beforeSid);
            if (beforeRec) {
                var beforeIdx = filtered.indexOf(beforeRec.key);
                if (beforeIdx !== -1) targetIdx = beforeIdx;
            }
        }
        if (targetIdx === -1) {
            var lastStationIdx = -1;
            var stationPrefix = PROGRAM_ID + ':station-';
            for (var i = 0; i < filtered.length; i++) {
                if (filtered[i].indexOf(stationPrefix) === 0 && stationKeyToSid.has(filtered[i])) {
                    lastStationIdx = i;
                }
            }
            if (lastStationIdx !== -1) {
                targetIdx = lastStationIdx + 1;
            } else {
                var anchorIdx = filtered.indexOf(PROGRAM_ID + ':station');
                if (anchorIdx !== -1) {
                    targetIdx = anchorIdx + 1;
                } else {
                    var toolsIdx = filtered.indexOf(PROGRAM_ID + ':map-tools');
                    if (toolsIdx !== -1) targetIdx = toolsIdx;
                }
            }
        }

        if (targetIdx !== -1 && rawOrder.indexOf(inst.key) !== targetIdx) {
            withInternalStationOp(function () {
                inst.setMode('sidebar', { side: side, insertIndex: targetIdx });
            });
        }
    }

    function destroyStationWindowNow(sid, options) {
        var rec = stationWindows.get(sid);
        if (!rec) return;
        if (rec.evictTimer) {
            global.clearTimeout(rec.evictTimer);
            rec.evictTimer = null;
        }
        var infoPanel = getInfoPanelEl();
        if (infoPanel && rec.inst && rec.inst.element && rec.inst.element.contains(infoPanel)) {
            parkInfoPanel();
        }
        if (activeStationSid === sid) {
            activeStationSid = null;
        }
        if (options && options.removeHistory && typeof stationHandlers.onRemoveHistory === 'function') {
            stationHandlers.onRemoveHistory(sid);
        }
        stationWindows.delete(sid);
        stationKeyToSid.delete(rec.key);
        panels.delete(rec.panelId);
        withInternalStationOp(function () {
            if (rec.inst && rec.inst.state.lifecycle !== 'destroyed') {
                rec.inst.destroy();
            }
        });
        scheduleSync(false);
    }

    function evictStationWindow(sid, options) {
        var rec = stationWindows.get(sid);
        if (!rec || rec.evicting) return;
        var animate = !options || options.animate !== false;
        var removeHistory = !options || options.removeHistory !== false;

        if (activeStationSid === sid) {
            parkInfoPanel();
            activeStationSid = null;
        }
        if (removeHistory && typeof stationHandlers.onRemoveHistory === 'function') {
            stationHandlers.onRemoveHistory(sid);
        }
        if (!animate || !rec.inst || rec.inst.element.hidden || rec.inst.state.effectiveMode !== 'sidebar') {
            destroyStationWindowNow(sid, { removeHistory: false });
            return;
        }
        rec.evicting = true;
        rec.inst.element.classList.add('is-pushed-out');
        rec.evictTimer = global.setTimeout(function () {
            rec.evictTimer = null;
            destroyStationWindowNow(sid, { removeHistory: false });
        }, 260);
    }

    function ensureStationWindow(sid, opts) {
        opts = opts || {};
        var meta = opts.meta || (stationHandlers.getStationMeta ? stationHandlers.getStationMeta(sid) : null) || { title: '车站详情', lines: [] };
        var rec = stationWindows.get(sid);
        if (rec && rec.inst && rec.inst.state.lifecycle !== 'destroyed') {
            if (rec.evicting) {
                if (rec.evictTimer) {
                    global.clearTimeout(rec.evictTimer);
                    rec.evictTimer = null;
                }
                rec.evicting = false;
                rec.inst.element.classList.remove('is-pushed-out');
            }
            rec.meta = meta;
            if (meta.title && rec.inst.config.title !== meta.title) {
                withInternalStationOp(function () {
                    rec.inst.update({ title: meta.title });
                });
            }
            renderStationTitleLines(rec.inst, meta);
            return rec;
        }

        var panelId = encodeStationPanelId(sid);
        var floatRect = resolveDefaultFloatRect();
        var isSb = opts.mode === 'sidebar';
        var side = opts.side === 'left' ? 'left' : 'right';

        var inst = registerPanel({
            id: panelId,
            title: meta.title || '车站详情',
            icon: 'location',
            className: 'openmap-station-window',
            content: null,
            mode: isSb ? 'sidebar' : 'float',
            allowModes: ['float', 'sidebar'],
            sidebarSide: side,
            mobileMode: 'none',
            showTitleBar: isSb,
            showMinimize: isSb,
            showMaximize: false,
            showClose: true,
            resizable: true,
            autoHeight: false,
            groupable: false,
            rememberPosition: false,
            restoreStateOnRegister: false,
            persistOpen: false,
            defaultWidth: floatRect.width,
            defaultHeight: floatRect.height,
            defaultPosition: { x: floatRect.x, y: floatRect.y },
            minWidth: 280,
            minHeight: 280,
            onClose: function () {
                handleStationWindowClose(sid);
            },
            onModeChange: function (instArg, payload) {
                handleStationModeChange(sid, instArg, payload);
            },
            onMinimizeChange: function (instArg, payload) {
                handleStationMinimizeChange(sid, instArg, payload);
            },
            onDragEnd: function (instArg, payload) {
                handleStationDragEnd(sid, instArg, payload);
            },
            onResizeEnd: function (instArg) {
                captureFloatRect(instArg);
            },
            onDestroy: function () {
                if (stationWindows.get(sid) && stationWindows.get(sid).inst === inst) {
                    if (activeStationSid === sid) {
                        parkInfoPanel();
                        activeStationSid = null;
                    }
                    stationWindows.delete(sid);
                    stationKeyToSid.delete(inst.key);
                    panels.delete(panelId);
                }
            }
        });
        if (!inst) return null;

        inst.element.dataset.stationId = sid;
        var panelRec = panels.get(panelId);
        if (panelRec) panelRec.isStationWindow = true;

        rec = {
            sid: sid,
            panelId: panelId,
            key: inst.key,
            inst: inst,
            meta: meta,
            evicting: false,
            evictTimer: null
        };
        stationWindows.set(sid, rec);
        stationKeyToSid.set(inst.key, sid);
        renderStationTitleLines(inst, meta);

        if (isSb) {
            placeStationInSidebarOrder(inst, side, opts.anchorOptions);
            if (opts.openAsCollapsed) {
                withInternalStationOp(function () {
                    inst.open();
                    inst.minimize({ persist: false });
                });
            }
        }
        syncDockButton(panelId);
        return rec;
    }

    function syncStationSidebarHistory(targetSide, options) {
        if (!ensureInit() || isMobile()) return;
        options = options || {};
        var side = targetSide === 'left' ? 'left' : (targetSide === 'right' ? 'right' : (loadStationPref().side || 'right'));
        var historyIds = typeof stationHandlers.getHistoryIds === 'function' ? stationHandlers.getHistoryIds() : [];
        var rawLimit = typeof stationHandlers.getHistoryLimit === 'function' ? stationHandlers.getHistoryLimit() : 5;
        var limit = Math.max(1, Math.min(9, Number(rawLimit) || 5));

        var keep = historyIds.filter(function (id) { return !!id; });
        if (activeStationSid && keep.indexOf(activeStationSid) === -1) {
            keep.push(activeStationSid);
        }
        if (keep.length > limit) {
            var trimmed = [];
            for (var i = keep.length - 1; i >= 0 && trimmed.length < limit; i--) {
                trimmed.unshift(keep[i]);
            }
            if (activeStationSid && trimmed.indexOf(activeStationSid) === -1) {
                trimmed.shift();
                trimmed.push(activeStationSid);
            }
            keep = trimmed;
        }

        keep.forEach(function (hSid) {
            if (hSid === activeStationSid) return;
            var existing = stationWindows.get(hSid);
            if (existing && existing.inst && existing.inst.state.lifecycle !== 'destroyed') {
                if (existing.inst.state.mode === 'sidebar') {
                    if (existing.inst.state.lifecycle === 'visible') {
                        withInternalStationOp(function () {
                            existing.inst.minimize({ persist: false });
                        });
                    }
                    return;
                }
                withInternalStationOp(function () {
                    existing.inst.update({ showTitleBar: true, showMinimize: true });
                    existing.inst.setMode('sidebar', { side: side });
                    existing.inst.open();
                    existing.inst.minimize({ persist: false });
                });
                if (options.beforeSid) {
                    placeStationInSidebarOrder(existing.inst, side, { beforeSid: options.beforeSid });
                }
                return;
            }
            ensureStationWindow(hSid, {
                mode: 'sidebar',
                side: side,
                openAsCollapsed: true,
                anchorOptions: options.beforeSid ? { beforeSid: options.beforeSid } : null
            });
        });

        var keepSet = new Set(keep);
        var toEvict = [];
        stationWindows.forEach(function (rec) {
            if (rec && !rec.evicting && rec.sid !== activeStationSid && !keepSet.has(rec.sid)) {
                toEvict.push(rec.sid);
            }
        });
        toEvict.forEach(function (oldSid) {
            evictStationWindow(oldSid, { animate: true, removeHistory: true });
        });
    }

    function finalizeStationDocked(sid, inst) {
        var rec = stationWindows.get(sid);
        if (!rec || !inst || inst.state.lifecycle === 'destroyed') return;
        var targetSide = inst.state.sidebarSide === 'left' ? 'left' : 'right';

        withInternalStationOp(function () {
            if (!inst.config.showTitleBar || !inst.config.showMinimize) {
                inst.update({ showTitleBar: true, showMinimize: true });
            }
            if (sid === activeStationSid) {
                mountInfoPanelInto(inst);
                if (inst.state.lifecycle === 'minimized') {
                    inst.restore({ scrollIntoView: true });
                }
            }
        });

        saveStationPref({ mode: 'sidebar', side: targetSide });
        renderStationTitleLines(inst, rec.meta);
        syncDockButton(rec.panelId);
        syncStationInlineControls();

        if (sid === activeStationSid) {
            stationWindows.forEach(function (other) {
                if (!other || other.sid === sid || other.evicting || !other.inst || other.inst.state.lifecycle === 'destroyed') return;
                if (other.inst.state.mode === 'sidebar' && other.inst.state.lifecycle === 'visible') {
                    withInternalStationOp(function () {
                        other.inst.minimize({ persist: false });
                    });
                }
            });
        }

        syncStationSidebarHistory(targetSide, { beforeSid: sid });
        if (api && typeof api.getSidebarDisplayState === 'function' && api.getSidebarDisplayState(targetSide) === 'rail') {
            api.activateSidebar(targetSide, { persist: true });
        }
        syncInsets();
    }

    function finalizeStationFloated(sid, inst) {
        var rec = stationWindows.get(sid);
        if (!rec || !inst || inst.state.lifecycle === 'destroyed') return;

        saveStationPref({ mode: 'float' });

        getFloatStationRecords(sid).forEach(function (other) {
            captureFloatRect(other.inst);
            destroyStationWindowNow(other.sid, { removeHistory: false });
        });
        getSidebarStationRecords(sid).forEach(function (other) {
            if (other.inst.state.lifecycle === 'visible') {
                withInternalStationOp(function () {
                    other.inst.minimize({ persist: false });
                });
            }
        });

        withInternalStationOp(function () {
            if (inst.state.lifecycle === 'minimized') {
                inst.restore({ scrollIntoView: false });
            }
            if (inst.config.showTitleBar || inst.config.showMinimize) {
                inst.update({ showTitleBar: false, showMinimize: false });
            }
            inst.keepInBounds({ persist: false });
        });

        if (sid !== activeStationSid) {
            if (typeof stationHandlers.onSelect === 'function') {
                parkInfoPanel();
                activeStationSid = null;
                stationHandlers.onSelect(sid);
            } else {
                activeStationSid = sid;
                mountInfoPanelInto(inst);
                syncDockButton(rec.panelId);
                syncStationInlineControls();
            }
        } else {
            mountInfoPanelInto(inst);
            syncDockButton(rec.panelId);
            syncStationInlineControls();
        }
        captureFloatRect(inst);
        syncInsets();
    }

    function handleStationWindowClose(sid) {
        var rec = stationWindows.get(sid);
        var wasActive = (activeStationSid === sid);
        if (wasActive) {
            if (rec && rec.inst && rec.inst.state.effectiveMode === 'float') {
                captureFloatRect(rec.inst);
            }
            parkInfoPanel();
            activeStationSid = null;
        }
        if (typeof stationHandlers.onRemoveHistory === 'function') {
            stationHandlers.onRemoveHistory(sid);
        }
        if (wasActive && typeof stationHandlers.onDeactivate === 'function') {
            stationHandlers.onDeactivate({ fromClose: true, removedSid: sid });
        }
        destroyStationWindowNow(sid, { removeHistory: false });
        syncInsets();
    }

    function handleStationMinimizeChange(sid, inst, payload) {
        if (internalStationOpDepth > 0 || !payload) return;
        var rec = stationWindows.get(sid);
        if (!rec || rec.evicting) return;
        if (!payload.minimized) {
            if (inst.state.mode === 'sidebar') {
                saveStationPref({ mode: 'sidebar', side: inst.state.sidebarSide });
            }
            if (typeof stationHandlers.onSelect === 'function') {
                stationHandlers.onSelect(sid);
            }
        } else if (sid === activeStationSid) {
            activeStationSid = null;
            if (typeof stationHandlers.onDeactivate === 'function') {
                stationHandlers.onDeactivate({ fromMinimize: true });
            }
            syncInsets();
        }
    }

    function handleStationModeChange(sid, inst, payload) {
        if (internalStationOpDepth > 0 || !inst) return;
        if (inst.element && inst.element.dataset.dragging === 'true') return;
        if (payload && payload.previousMode === 'float' && payload.mode === 'sidebar') {
            var w = Number(inst.state.width);
            var h = Number(inst.state.height);
            saveStationPref({
                floatRect: {
                    x: Math.round(Number(inst.state.x) || 0),
                    y: Math.round(Number(inst.state.y) || 0),
                    width: Number.isFinite(w) && w >= 260 ? Math.round(w) : 350,
                    height: Number.isFinite(h) && h >= 260 ? Math.round(h) : 540
                }
            });
        }
        if (inst.state.mode === 'sidebar') {
            finalizeStationDocked(sid, inst);
        } else if (inst.state.mode === 'float') {
            finalizeStationFloated(sid, inst);
        }
    }

    function handleStationDragEnd(sid, inst) {
        if (internalStationOpDepth > 0 || !inst) return;
        var pref = loadStationPref();
        if (inst.state.mode === 'float') {
            if (inst.config.showTitleBar || sid !== activeStationSid || pref.mode !== 'float') {
                finalizeStationFloated(sid, inst);
            } else {
                captureFloatRect(inst);
                syncInsets();
            }
        } else if (inst.state.mode === 'sidebar') {
            if (!inst.config.showTitleBar || pref.mode !== 'sidebar' || pref.side !== inst.state.sidebarSide) {
                finalizeStationDocked(sid, inst);
            }
        }
    }

    function openStation(sid, meta, options) {
        if (!sid || !ensureInit() || isMobile()) return null;
        options = options || {};
        ensureStationObserver();

        var pref = loadStationPref();
        var existingRec = stationWindows.get(sid);
        var existingAlive = existingRec && existingRec.inst && existingRec.inst.state.lifecycle !== 'destroyed';
        var existingMode = existingAlive ? existingRec.inst.state.mode : null;
        var existingSide = existingAlive ? existingRec.inst.state.sidebarSide : null;

        var sidebarPeers = getSidebarStationRecords(sid);
        var floatPeers = getFloatStationRecords(sid);

        var targetMode;
        var targetSide = options.forceSide || pref.side || 'right';
        if (options.forceMode === 'sidebar' || options.forceMode === 'float') {
            targetMode = options.forceMode;
        } else if (existingMode === 'sidebar') {
            targetMode = 'sidebar';
            targetSide = existingSide || pref.side || 'right';
        } else if (existingMode === 'float') {
            targetMode = 'float';
        } else if (pref.mode === 'sidebar' || (sidebarPeers.length > 0 && floatPeers.length === 0)) {
            targetMode = 'sidebar';
            if (sidebarPeers.length > 0) {
                targetSide = sidebarPeers[0].inst.state.sidebarSide || targetSide;
            }
        } else {
            targetMode = 'float';
        }

        if (targetMode === 'sidebar') {
            var historyIds = typeof stationHandlers.getHistoryIds === 'function' ? stationHandlers.getHistoryIds().slice() : [];
            var rawLimit = typeof stationHandlers.getHistoryLimit === 'function' ? stationHandlers.getHistoryLimit() : 5;
            var limit = Math.max(1, Math.min(9, Number(rawLimit) || 5));

            var keepIds = historyIds.filter(function (id) { return !!id; });
            if (keepIds.indexOf(sid) === -1) keepIds.push(sid);
            if (keepIds.length > limit) {
                var trimmed = keepIds.slice(-limit);
                if (trimmed.indexOf(sid) === -1) {
                    trimmed.shift();
                    trimmed.push(sid);
                }
                keepIds = trimmed;
            }
            var keepSet = new Set(keepIds);

            keepIds.forEach(function (hSid) {
                if (hSid === sid) return;
                var peer = stationWindows.get(hSid);
                if (peer && peer.inst && peer.inst.state.lifecycle !== 'destroyed') {
                    if (peer.inst.state.mode === 'float') {
                        captureFloatRect(peer.inst);
                        if (activeStationSid === hSid) parkInfoPanel();
                        withInternalStationOp(function () {
                            peer.inst.update({ showTitleBar: true, showMinimize: true });
                            peer.inst.setMode('sidebar', { side: targetSide });
                            peer.inst.open();
                            peer.inst.minimize({ persist: false });
                        });
                    } else if (peer.inst.state.lifecycle === 'visible') {
                        withInternalStationOp(function () {
                            peer.inst.minimize({ persist: false });
                        });
                    }
                    return;
                }
                ensureStationWindow(hSid, {
                    mode: 'sidebar',
                    side: targetSide,
                    openAsCollapsed: true
                });
            });

            var evictList = [];
            stationWindows.forEach(function (other) {
                if (!other || other.sid === sid || other.evicting) return;
                if (!keepSet.has(other.sid)) {
                    evictList.push(other);
                }
            });
            evictList.forEach(function (other) {
                var isSb = other.inst && other.inst.state.mode === 'sidebar';
                if (!isSb && other.inst) captureFloatRect(other.inst);
                evictStationWindow(other.sid, { animate: isSb, removeHistory: true });
            });

            if (activeStationSid && activeStationSid !== sid) {
                parkInfoPanel();
            }

            var rec = ensureStationWindow(sid, {
                mode: 'sidebar',
                side: targetSide,
                meta: meta,
                openAsCollapsed: false
            });
            if (!rec || !rec.inst) return null;

            withInternalStationOp(function () {
                if (rec.inst.state.mode !== 'sidebar') {
                    captureFloatRect(rec.inst);
                    rec.inst.update({ showTitleBar: true, showMinimize: true });
                    rec.inst.setMode('sidebar', { side: targetSide });
                } else if (!rec.inst.config.showTitleBar || !rec.inst.config.showMinimize) {
                    rec.inst.update({ showTitleBar: true, showMinimize: true });
                }
                mountInfoPanelInto(rec.inst);
                if (rec.inst.state.lifecycle === 'minimized') {
                    rec.inst.restore({ scrollIntoView: true });
                } else if (rec.inst.state.lifecycle !== 'visible') {
                    rec.inst.open();
                } else {
                    rec.inst.bringToFront();
                }
                if (api && typeof api.getSidebarDisplayState === 'function' && api.getSidebarDisplayState(targetSide) === 'rail') {
                    api.activateSidebar(targetSide, { persist: true });
                }
                if (rec.inst.element && typeof rec.inst.element.scrollIntoView === 'function') {
                    try {
                        rec.inst.element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    } catch (_) {}
                }
            });

            activeStationSid = sid;
            renderStationTitleLines(rec.inst, rec.meta);
            syncDockButton(rec.panelId);
            syncStationInlineControls();
            saveStationPref({ mode: 'sidebar', side: rec.inst.state.sidebarSide || targetSide });
            syncInsets();
            return rec.inst;
        }

        // 浮窗模式：仅保留当前激活站点的独立浮窗，侧栏历史车站保持折叠
        if (activeStationSid && activeStationSid !== sid) {
            parkInfoPanel();
        }
        getFloatStationRecords(sid).forEach(function (other) {
            captureFloatRect(other.inst);
            destroyStationWindowNow(other.sid, { removeHistory: false });
        });
        getSidebarStationRecords(sid).forEach(function (other) {
            if (other.inst.state.lifecycle === 'visible') {
                withInternalStationOp(function () {
                    other.inst.minimize({ persist: false });
                });
            }
        });

        var floatRec = ensureStationWindow(sid, {
            mode: 'float',
            side: pref.side || 'right',
            meta: meta,
            openAsCollapsed: false
        });
        if (!floatRec || !floatRec.inst) return null;

        withInternalStationOp(function () {
            if (floatRec.inst.state.mode !== 'float') {
                floatRec.inst.setMode('float');
            }
            if (floatRec.inst.config.showTitleBar || floatRec.inst.config.showMinimize) {
                floatRec.inst.update({ showTitleBar: false, showMinimize: false });
            }
            mountInfoPanelInto(floatRec.inst);
            if (floatRec.inst.state.lifecycle === 'minimized') {
                floatRec.inst.restore({ scrollIntoView: false });
            } else if (floatRec.inst.state.lifecycle !== 'visible') {
                floatRec.inst.open();
            } else {
                floatRec.inst.bringToFront();
            }
            floatRec.inst.keepInBounds({ persist: false });
        });

        activeStationSid = sid;
        syncDockButton(floatRec.panelId);
        syncStationInlineControls();
        syncInsets();
        return floatRec.inst;
    }

    function deactivateStation(options) {
        options = options || {};
        var clearFloat = options.clearFloat !== false;
        if (!initialized) {
            activeStationSid = null;
            return;
        }
        var curSid = activeStationSid;
        if (curSid) {
            var curRec = stationWindows.get(curSid);
            if (curRec && curRec.inst && curRec.inst.state.lifecycle !== 'destroyed') {
                if (curRec.inst.state.mode === 'sidebar') {
                    withInternalStationOp(function () {
                        if (curRec.inst.state.lifecycle === 'visible') {
                            curRec.inst.minimize({ persist: false });
                        }
                    });
                } else if (clearFloat) {
                    captureFloatRect(curRec.inst);
                    destroyStationWindowNow(curSid, { removeHistory: false });
                }
            }
        }
        stationWindows.forEach(function (rec) {
            if (!rec || rec.evicting || !rec.inst || rec.inst.state.lifecycle === 'destroyed') return;
            if (rec.inst.state.mode === 'sidebar' && rec.inst.state.lifecycle === 'visible') {
                withInternalStationOp(function () {
                    rec.inst.minimize({ persist: false });
                });
            } else if (rec.inst.state.mode === 'float' && clearFloat) {
                captureFloatRect(rec.inst);
                destroyStationWindowNow(rec.sid, { removeHistory: false });
            }
        });
        activeStationSid = null;
        syncInsets();
    }

    function syncStationHistoryLimit(newLimit) {
        if (!initialized || isMobile()) return;
        var limit = Math.max(1, Math.min(9, Number(newLimit) || 5));
        var historyIds = typeof stationHandlers.getHistoryIds === 'function' ? stationHandlers.getHistoryIds() : [];
        var keepSet = new Set(historyIds.slice(-limit));
        if (activeStationSid) keepSet.add(activeStationSid);

        var candidates = [];
        stationWindows.forEach(function (rec) {
            if (!rec || rec.evicting || rec.sid === activeStationSid) return;
            if (rec.inst && rec.inst.state.mode === 'sidebar' && !keepSet.has(rec.sid)) {
                candidates.push(rec.sid);
            }
        });
        candidates.forEach(function (sid) {
            evictStationWindow(sid, { animate: true, removeHistory: true });
        });
    }

    function configureStationManager(cfg) {
        if (!cfg || typeof cfg !== 'object') return;
        if (cfg.element) stationPanelEl = cfg.element;
        if (cfg.mobileHome) stationMobileHome = cfg.mobileHome;
        if (typeof cfg.onSelect === 'function') stationHandlers.onSelect = cfg.onSelect;
        if (typeof cfg.onDeactivate === 'function') stationHandlers.onDeactivate = cfg.onDeactivate;
        if (typeof cfg.onRemoveHistory === 'function') stationHandlers.onRemoveHistory = cfg.onRemoveHistory;
        if (typeof cfg.getStationMeta === 'function') stationHandlers.getStationMeta = cfg.getStationMeta;
        if (typeof cfg.getHistoryIds === 'function') stationHandlers.getHistoryIds = cfg.getHistoryIds;
        if (typeof cfg.getHistoryLimit === 'function') stationHandlers.getHistoryLimit = cfg.getHistoryLimit;
        ensureStationObserver();
    }

    function syncDockButton(id) {
        var normId = idFromKey(id);
        var rec = panels.get(normId);
        if (rec && rec.isStationWindow) {
            syncStationInlineControls();
        }
        if (!rec || !rec.inst || !rec.inst.titlebar) return;
        var inst = rec.inst;
        var allow = rec.allowModes || ['float', 'sidebar'];
        var canToggleDock = allow.indexOf('float') !== -1 && allow.indexOf('sidebar') !== -1;
        var btn = inst.titlebar.querySelector('.cgowm-btn-dock');
        if (!canToggleDock) {
            if (btn) btn.hidden = true;
            return;
        }
        if (!btn) {
            var controls = inst.titlebar.querySelector('.cgowm-controls');
            if (!controls) return;
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cgowm-control cgowm-btn-dock';
            var iconEl = document.createElement('cgo-icon');
            iconEl.setAttribute('size', '13');
            btn.appendChild(iconEl);
            btn.addEventListener('click', function (ev) {
                ev.stopPropagation();
                toggleDock(rec.id);
            });
            controls.insertBefore(btn, controls.firstChild);
        }
        var effectiveMode = (inst.state && inst.state.effectiveMode) || (inst.element && inst.element.dataset.mode) || 'float';
        var hideDock = isMobile() || effectiveMode === 'fullscreen' || effectiveMode === 'modal' || effectiveMode === 'none';
        btn.hidden = hideDock;
        var docked = effectiveMode === 'sidebar';
        btn.classList.toggle('is-docked', docked);
        var label = docked ? '取消停靠为浮窗' : '停靠到侧边栏';
        btn.title = label;
        btn.setAttribute('aria-label', label);
        var icon = btn.querySelector('cgo-icon');
        if (icon) icon.setAttribute('name', docked ? 'unpin-angle' : 'pin-angle');
    }

    function syncAllDockButtons() {
        panels.forEach(function (rec) {
            syncDockButton(rec.id);
        });
        syncStationInlineControls();
    }

    function inspectSidebar(side) {
        var el = document.querySelector('.cgowm-sidebar[data-side="' + side + '"]');
        if (!el || el.hidden) return { state: 'none', width: 0 };
        var style = global.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return { state: 'none', width: 0 };
        var rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return { state: 'none', width: 0 };
        var state = el.dataset.collapsed === 'rail' ? 'rail' : 'expanded';
        var width = side === 'left'
            ? Math.max(0, Math.ceil(rect.right))
            : Math.max(0, Math.ceil(global.innerWidth - rect.left));
        return { state: state, width: width };
    }

    function syncInsets() {
        if (!document.body) return;
        if (isMobile() || !initialized) {
            var hadSidebar = lastLeftWidth > 0 || lastRightWidth > 0;
            lastLeftWidth = 0;
            lastRightWidth = 0;
            lastLeftState = 'none';
            lastRightState = 'none';
            document.body.removeAttribute('data-cgowm-left-sidebar');
            document.body.removeAttribute('data-cgowm-right-sidebar');
            document.body.style.removeProperty('--cwm-sidebar-left-width');
            document.body.style.removeProperty('--cwm-sidebar-right-width');
            updateCssTopVar(0);
            if (global.CGoViewportInset && typeof global.CGoViewportInset.refresh === 'function') {
                global.CGoViewportInset.refresh();
            }
            if (hadSidebar) {
                if (typeof global.enforceBoundaries === 'function') global.enforceBoundaries();
                if (typeof global.updateMapTransform === 'function') global.updateMapTransform();
            }
            return;
        }

        var topInset = measureTopWorkInset();
        updateCssTopVar(topInset);
        if (api && topInset !== lastTopInset) {
            lastTopInset = topInset;
            api.configureHost({ workAreaInsets: { top: topInset, bottom: 0 } });
        }

        var leftInfo = inspectSidebar('left');
        var rightInfo = inspectSidebar('right');
        var sizeChanged = (
            leftInfo.width !== lastLeftWidth ||
            rightInfo.width !== lastRightWidth ||
            leftInfo.state !== lastLeftState ||
            rightInfo.state !== lastRightState
        );
        lastLeftWidth = leftInfo.width;
        lastRightWidth = rightInfo.width;
        lastLeftState = leftInfo.state;
        lastRightState = rightInfo.state;

        if (leftInfo.state === 'none') document.body.removeAttribute('data-cgowm-left-sidebar');
        else document.body.dataset.cgowmLeftSidebar = leftInfo.state;

        if (rightInfo.state === 'none') document.body.removeAttribute('data-cgowm-right-sidebar');
        else document.body.dataset.cgowmRightSidebar = rightInfo.state;

        if (leftInfo.width > 0) {
            document.body.style.setProperty('--cwm-sidebar-left-width', leftInfo.width + 'px');
        } else {
            document.body.style.removeProperty('--cwm-sidebar-left-width');
        }
        if (rightInfo.width > 0) {
            document.body.style.setProperty('--cwm-sidebar-right-width', rightInfo.width + 'px');
        } else {
            document.body.style.removeProperty('--cwm-sidebar-right-width');
        }

        if (sizeChanged) {
            global.dispatchEvent(new CustomEvent('cgowm:insets-changed', {
                detail: { top: topInset, left: leftInfo.width, right: rightInfo.width }
            }));
            if (global.CGoViewportInset && typeof global.CGoViewportInset.refresh === 'function') {
                global.CGoViewportInset.refresh();
            }
            if (typeof global.enforceBoundaries === 'function') global.enforceBoundaries();
            if (typeof global.updateMapTransform === 'function') global.updateMapTransform();
        }
    }

    function syncResponsivePanels(force) {
        var nowMobile = isMobile();
        if (!force && lastIsMobile === nowMobile) return;
        lastIsMobile = nowMobile;

        if (nowMobile) {
            parkInfoPanel();
        }

        panels.forEach(function (rec) {
            if (!rec.responsive) return;
            var target = nowMobile ? rec.mobileHome : rec.contentEl;
            if (target && rec.element && rec.element.parentElement !== target) {
                target.appendChild(rec.element);
            }
            if (!nowMobile && rec.element && !isOpen(rec.id)) {
                rec.element.style.removeProperty('height');
                rec.element.style.removeProperty('max-height');
            }
            if (typeof rec.onViewportSwitch === 'function') {
                try {
                    rec.onViewportSwitch(nowMobile, rec.inst);
                } catch (err) {
                    console.error('[CGoWMAdapter] viewport switch error:', err);
                }
            }
        });
    }

    function scheduleSync(viewportCheck) {
        if (viewportCheck) syncResponsivePanels(false);
        if (syncRaf) return;
        syncRaf = global.requestAnimationFrame(function () {
            syncRaf = 0;
            syncAllDockButtons();
            syncInsets();
        });
    }

    function bindHostEvents() {
        if (listenersBound || !api) return;
        listenersBound = true;

        var events = ['open', 'close', 'modeChange', 'minimizedChange', 'dragStart', 'dragEnd', 'resize', 'resizeEnd', 'destroy'];
        events.forEach(function (evtName) {
            api.on(evtName, function (payload) {
                var key = payload && payload.key;
                var rec = key ? panels.get(idFromKey(key)) : null;

                if (evtName === 'close' && rec) {
                    if (suppressCloseKeys.has(rec.key)) {
                        suppressCloseKeys.delete(rec.key);
                    } else if (typeof rec.onClose === 'function') {
                        try {
                            rec.onClose(rec.inst, payload);
                        } catch (err) {
                            console.error('[CGoWMAdapter] onClose error:', err);
                        }
                    }
                } else if (evtName === 'open' && rec && typeof rec.onOpen === 'function') {
                    try {
                        rec.onOpen(rec.inst, payload);
                    } catch (err) {
                        console.error('[CGoWMAdapter] onOpen error:', err);
                    }
                } else if (evtName === 'modeChange' && rec) {
                    syncDockButton(rec.id);
                    if (typeof rec.onModeChange === 'function') {
                        try {
                            rec.onModeChange(rec.inst, payload);
                        } catch (err) {
                            console.error('[CGoWMAdapter] onModeChange error:', err);
                        }
                    }
                } else if (evtName === 'minimizedChange' && rec && typeof rec.onMinimizeChange === 'function') {
                    try {
                        rec.onMinimizeChange(rec.inst, payload);
                    } catch (err) {
                        console.error('[CGoWMAdapter] onMinimizeChange error:', err);
                    }
                } else if (evtName === 'dragStart' && rec && typeof rec.onDragStart === 'function') {
                    try {
                        rec.onDragStart(rec.inst, payload);
                    } catch (err) {
                        console.error('[CGoWMAdapter] onDragStart error:', err);
                    }
                } else if (evtName === 'dragEnd' && rec && typeof rec.onDragEnd === 'function') {
                    try {
                        rec.onDragEnd(rec.inst, payload);
                    } catch (err) {
                        console.error('[CGoWMAdapter] onDragEnd error:', err);
                    }
                } else if (evtName === 'resizeEnd' && rec && typeof rec.onResizeEnd === 'function') {
                    try {
                        rec.onResizeEnd(rec.inst, payload);
                    } catch (err) {
                        console.error('[CGoWMAdapter] onResizeEnd error:', err);
                    }
                } else if (evtName === 'destroy' && rec) {
                    panels.delete(rec.id);
                    if (typeof rec.onDestroy === 'function') {
                        try {
                            rec.onDestroy(rec.inst, payload);
                        } catch (err) {
                            console.error('[CGoWMAdapter] onDestroy error:', err);
                        }
                    }
                }

                scheduleSync(evtName === 'modeChange');
            });
        });

        global.addEventListener('resize', function () {
            scheduleSync(true);
        });

        var sidebarResizeObserver = typeof ResizeObserver === 'function'
            ? new ResizeObserver(function () {
                scheduleSync(false);
            })
            : null;

        function watchSidebar(el) {
            if (!el || observedSidebars.has(el)) return;
            observedSidebars.add(el);
            sidebarObserver.observe(el, {
                attributes: true,
                attributeFilter: ['hidden', 'style', 'data-collapsed', 'class']
            });
            if (sidebarResizeObserver) {
                sidebarResizeObserver.observe(el);
            }
        }

        var sidebarObserver = new MutationObserver(function (records) {
            for (var i = 0; i < records.length; i++) {
                var t = records[i].target;
                if (t && t.classList && t.classList.contains('cgowm-sidebar')) {
                    scheduleSync(false);
                    return;
                }
                if (t === document.body) {
                    var added = records[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                        if (added[j].nodeType === 1 && added[j].classList && added[j].classList.contains('cgowm-sidebar')) {
                            watchSidebar(added[j]);
                            scheduleSync(false);
                        }
                    }
                }
            }
        });
        if (document.body) {
            sidebarObserver.observe(document.body, { childList: true });
            document.querySelectorAll('.cgowm-sidebar').forEach(watchSidebar);
        }
    }

    function init() {
        if (initialized) return api;
        if (!global.CGoWM || typeof global.CGoWM.init !== 'function') return null;

        evaluateInitialModePreference();
        cleanStaleStationWorkspaceState();
        var topInset = measureTopWorkInset();
        lastTopInset = topInset;
        lastIsMobile = isMobile();
        updateCssTopVar(topInset);

        api = global.CGoWM.init({
            hostId: PROGRAM_ID,
            programId: PROGRAM_ID,
            environment: 'web',
            mobileWorkspace: 'standalone',
            mobileBreakpoint: MOBILE_MAX,
            singleSidebarMaxWidth: 960,
            root: document.body,
            hotZone: 44,
            snapThreshold: 10,
            sidebarTargets: null,
            sidebarResizable: true,
            defaultSidebarWidth: { left: 320, right: 360 },
            minSidebarWidth: 260,
            maxSidebarWidth: 520,
            defaultSidebarOrder: {
                left: ['openmap:legend'],
                right: ['openmap:route-plan', 'openmap:route-result', 'openmap:station', 'openmap:map-tools']
            },
            workAreaInsets: { top: topInset, bottom: 0 },
            zBase: { panel: 2200, sidebar: 900, overlay: 20000, dialog: 100500 }
        });

        initialized = true;
        if (document.body) document.body.classList.add('cgowm-active');
        bindHostEvents();
        scheduleSync(false);

        var cbs = readyCallbacks.splice(0, readyCallbacks.length);
        cbs.forEach(function (fn) {
            try {
                fn(api);
            } catch (err) {
                console.error('[CGoWMAdapter] onReady callback error:', err);
            }
        });
        return api;
    }

    function ensureInit() {
        return initialized ? api : init();
    }

    function registerPanel(cfg) {
        var hostApi = ensureInit();
        if (!hostApi || !cfg || !cfg.id) return null;

        var id = String(cfg.id);
        var key = fullKey(id);
        var existing = panels.get(id);
        if (existing && existing.inst) return existing.inst;

        var persistOpen = cfg.persistOpen !== false;
        var restoreState = cfg.restoreStateOnRegister !== false;
        var hasSaved = restoreState && typeof hostApi.hasPersistedState === 'function' ? hostApi.hasPersistedState(key) : false;
        var initialMode = cfg.mode || getDefaultDesktopMode();

        var rec = {
            id: id,
            key: key,
            title: cfg.title || PANEL_FALLBACK_TITLES[id] || id,
            icon: cfg.icon || 'window',
            responsive: !!cfg.responsive,
            element: cfg.element || null,
            mobileHome: cfg.mobileHome || null,
            contentEl: null,
            showTitleBar: cfg.showTitleBar !== false,
            allowModes: cfg.allowModes || ['float', 'sidebar'],
            sidebarSide: cfg.sidebarSide || 'right',
            persistOpen: persistOpen,
            isStationWindow: false,
            onOpen: cfg.onOpen || null,
            onClose: cfg.onClose || null,
            onModeChange: cfg.onModeChange || null,
            onMinimizeChange: cfg.onMinimizeChange || null,
            onDragStart: cfg.onDragStart || null,
            onDragEnd: cfg.onDragEnd || null,
            onResizeEnd: cfg.onResizeEnd || null,
            onDestroy: cfg.onDestroy || null,
            onViewportSwitch: cfg.onViewportSwitch || null,
            inst: null
        };
        panels.set(id, rec);

        var wmContent = cfg.content;
        if (rec.responsive && rec.element) {
            if (isMobile() && rec.mobileHome && rec.element.parentElement !== rec.mobileHome) {
                rec.mobileHome.appendChild(rec.element);
            }
            wmContent = {
                kind: 'factory',
                mount: function (contentEl) {
                    rec.contentEl = contentEl;
                    if (!isMobile() && rec.element) {
                        contentEl.appendChild(rec.element);
                    }
                }
            };
        }

        var openOnReg = persistOpen && !hasSaved && !!cfg.open;
        var defW = cfg.defaultWidth || 340;
        var defH = cfg.defaultHeight || 'auto';
        var mobileMode = cfg.mobileMode !== undefined
            ? cfg.mobileMode
            : (rec.responsive ? 'none' : 'fullscreen');

        var inst = hostApi.register({
            panelId: id,
            title: rec.title,
            icon: rec.icon,
            className: cfg.className || '',
            content: wmContent,
            mode: initialMode,
            allowModes: rec.allowModes,
            sidebarSide: rec.sidebarSide,
            mobileMode: mobileMode,
            showTitleBar: rec.showTitleBar,
            mobileShowTitleBar: cfg.mobileShowTitleBar !== false,
            defaultWidth: defW,
            defaultHeight: defH,
            width: defW,
            height: defH,
            autoHeight: cfg.autoHeight,
            defaultPosition: cfg.defaultPosition || null,
            minWidth: cfg.minWidth || 260,
            minHeight: cfg.minHeight || 220,
            resizable: cfg.resizable !== false,
            groupable: cfg.groupable !== false,
            rememberPosition: cfg.rememberPosition !== false,
            restoreStateOnRegister: restoreState,
            showMinimize: cfg.showMinimize !== false,
            showMaximize: cfg.showMaximize === true,
            showClose: cfg.showClose !== false,
            openOnRegister: openOnReg
        });
        rec.inst = inst;

        if (id === 'station') {
            ensureStationObserver();
        }

        if (!persistOpen && inst && isOpen(id)) {
            suppressCloseKeys.add(key);
            inst.close();
        } else if (persistOpen && hasSaved && inst) {
            if (inst.savedLifecycle === 'visible') inst.open();
            else if (inst.savedLifecycle === 'minimized') {
                inst.open();
                if (typeof inst.minimize === 'function') inst.minimize();
            }
        } else if (persistOpen && !hasSaved && cfg.open && inst && !isOpen(id)) {
            inst.open();
        }

        syncDockButton(id);
        scheduleSync(false);
        return inst;
    }

    function registerResponsivePanel(cfg) {
        if (!cfg) return null;
        return registerPanel(Object.assign({}, cfg, {
            responsive: true,
            persistOpen: cfg.persistOpen === true ? true : false
        }));
    }

    function open(id, opts) {
        var inst = getInstance(id);
        if (!inst) return null;
        var res = inst.open(opts);
        syncDockButton(id);
        scheduleSync(false);
        return res;
    }

    function close(id, opts) {
        if (idFromKey(id) === 'station') {
            deactivateStation({ clearFloat: true });
            return true;
        }
        var inst = getInstance(id);
        if (!inst) return false;
        if (opts && opts.silent) suppressCloseKeys.add(inst.key);
        var ok = inst.close();
        scheduleSync(false);
        return ok;
    }

    function toggle(id) {
        if (isOpen(id)) return close(id);
        return open(id);
    }

    function update(id, patch) {
        var inst = getInstance(id);
        if (!inst) return false;
        if (patch && patch.title) {
            var rec = panels.get(idFromKey(id));
            if (rec) rec.title = patch.title;
        }
        return inst.update(patch);
    }

    function toggleDock(id, preferredSide) {
        var normId = idFromKey(id);
        if (normId === 'station') {
            var activeRec = activeStationSid ? stationWindows.get(activeStationSid) : null;
            if (!activeRec) return false;
            normId = activeRec.panelId;
        }
        var rec = panels.get(normId);
        var inst = getInstance(normId);
        if (!inst) return false;
        var docked = isSidebar(normId);
        if (!docked && rec && rec.isStationWindow) {
            captureFloatRect(inst);
        }
        var targetSide = preferredSide || (rec && rec.isStationWindow ? loadStationPref().side : (rec && rec.sidebarSide)) || 'right';
        var ok = docked
            ? inst.setMode('float')
            : inst.setMode('sidebar', { side: targetSide });
        syncDockButton(normId);
        scheduleSync(false);
        return ok;
    }

    function applyModeToAll(mode) {
        var nextMode = setDefaultDesktopMode(mode);
        var curPref = loadStationPref();
        var stationSide = curPref.side || 'right';
        saveStationPref({ mode: nextMode, side: stationSide });

        panels.forEach(function (rec) {
            if (!rec.inst || rec.isStationWindow) return;
            var allow = rec.allowModes || ['float', 'sidebar'];
            if (allow.indexOf(nextMode) === -1) return;
            var wasOpen = isOpen(rec.id);
            rec.inst.setMode(nextMode, nextMode === 'sidebar' ? { side: rec.sidebarSide || 'right' } : undefined);
            if (!wasOpen && isOpen(rec.id)) {
                suppressCloseKeys.add(rec.key);
                rec.inst.close();
            }
            syncDockButton(rec.id);
        });

        if (!isMobile()) {
            var activeSid = activeStationSid;
            var activeMeta = activeSid && stationHandlers.getStationMeta ? stationHandlers.getStationMeta(activeSid) : null;
            if (nextMode === 'sidebar') {
                if (activeSid) {
                    openStation(activeSid, activeMeta, { forceMode: 'sidebar', forceSide: stationSide });
                } else {
                    syncStationSidebarHistory(stationSide);
                }
            } else {
                var allSids = Array.from(stationWindows.keys());
                allSids.forEach(function (sid) {
                    if (sid !== activeSid) {
                        destroyStationWindowNow(sid, { removeHistory: false });
                    }
                });
                if (activeSid) {
                    openStation(activeSid, activeMeta, { forceMode: 'float' });
                }
            }
        }
        scheduleSync(false);
    }

    function clearWorkspaceStorage() {
        try {
            if (!global.localStorage) return;
            var prefix = 'cgowm:v1:' + PROGRAM_ID + ':';
            var toRemove = [];
            for (var i = 0; i < global.localStorage.length; i++) {
                var k = global.localStorage.key(i);
                if (k && k.indexOf(prefix) === 0) toRemove.push(k);
            }
            toRemove.forEach(function (k) { global.localStorage.removeItem(k); });
            global.localStorage.removeItem(DEFAULT_MODE_KEY);
            global.localStorage.removeItem(STATION_PREF_KEY);
        } catch (_) {}
    }

    function resetWorkspace() {
        if (!api) return false;
        parkInfoPanel();
        var stationSids = Array.from(stationWindows.keys());
        stationSids.forEach(function (sid) {
            destroyStationWindowNow(sid, { removeHistory: false });
        });
        activeStationSid = null;
        stationPref = null;
        if (typeof stationHandlers.onDeactivate === 'function') {
            try {
                stationHandlers.onDeactivate({ fromClose: true });
            } catch (_) {}
        }

        var openIds = [];
        panels.forEach(function (rec) {
            if (!rec.isStationWindow && isOpen(rec.id)) openIds.push(rec.id);
        });
        if (typeof api.resetWorkspace === 'function') {
            api.resetWorkspace({ preserveAddons: false });
        }
        clearWorkspaceStorage();
        var defaultMode = isStandalonePwa() && !isMobile() ? 'sidebar' : 'float';
        setDefaultDesktopMode(defaultMode);
        panels.forEach(function (rec) {
            if (!rec.inst || rec.isStationWindow) return;
            var keepOpen = openIds.indexOf(rec.id) !== -1 && rec.id !== 'route-result';
            rec.inst.setMode(defaultMode, defaultMode === 'sidebar' ? { side: rec.sidebarSide || 'right' } : undefined);
            if (keepOpen) rec.inst.open();
            else {
                suppressCloseKeys.add(rec.key);
                rec.inst.close();
            }
            syncDockButton(rec.id);
        });
        scheduleSync(false);
        return true;
    }

    function onReady(fn) {
        if (typeof fn !== 'function') return;
        if (initialized && api) {
            fn(api);
            return;
        }
        readyCallbacks.push(fn);
        init();
    }

    if (global.CGoWM) {
        init();
    } else {
        global.addEventListener('cgowm:loaded', init, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
        });
    }

    global.CGoWMAdapter = {
        init: init,
        getApi: function () { return ensureInit(); },
        isActive: function () { return initialized && !!api; },
        isMobile: isMobile,
        isDesktopActive: function () { return !isMobile() && initialized && !!api; },
        isStandalonePwa: isStandalonePwa,
        isFirstPwaSidebarLaunch: function () { return firstPwaSidebarLaunch; },
        shouldAutoOpenLegend: shouldAutoOpenLegend,
        getDefaultDesktopMode: getDefaultDesktopMode,
        setDefaultDesktopMode: setDefaultDesktopMode,
        applyModeToAll: applyModeToAll,
        registerPanel: registerPanel,
        registerResponsivePanel: registerResponsivePanel,
        configureStationManager: configureStationManager,
        openStation: openStation,
        deactivateStation: deactivateStation,
        syncStationHistoryLimit: syncStationHistoryLimit,
        syncStationSidebarHistory: function () {
            var pref = loadStationPref();
            if (pref.mode === 'sidebar') syncStationSidebarHistory(pref.side || 'right');
        },
        hasStationSidebar: hasStationSidebar,
        getActiveStationSid: function () { return activeStationSid; },
        get: getInstance,
        open: open,
        close: close,
        toggle: toggle,
        isOpen: isOpen,
        isVisible: isVisible,
        isSidebar: isSidebar,
        toggleDock: toggleDock,
        update: update,
        syncInsets: syncInsets,
        syncViewport: function () { syncResponsivePanels(false); scheduleSync(false); },
        resetWorkspace: resetWorkspace,
        onReady: onReady
    };
})(typeof window !== 'undefined' ? window : globalThis);
