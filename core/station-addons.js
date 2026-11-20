/**
 * CGo OpenMap - 车站信息板增强插件 (core/station-addons.js)
 *
 * 将跨城高频需求收敛为声明式、按需启用（opt-in）的核心能力：
 *   1. cgo-station-name-history（order: 12 @ station-info）：工程名 / 曾用名 / 站名沿革只读展示；
 *   2. cgo-station-tips（order: 15 @ station-info）：专题提示卡片（如文旅贴士 / 换乘提醒）；
 *   3. renderTipCardHtml：供各城复用的标准化提示卡片 HTML 渲染器（使用 CGoUI 图标与主题变量）。
 */
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    const NAME_HISTORY_MOD_ID = 'cgo-station-name-history';
    const TIP_CARDS_MOD_ID = 'cgo-station-tips';
    const DEFAULT_PRIMARY_FALLBACK = '#1a73e8';

    const DEFAULT_HISTORY_FIELDS = [
        { label: '工程名', keys: ['engineeringName', 'engineering'] },
        { label: '曾用名', keys: ['formerName', 'formerNames', 'former', 'oldName'] }
    ];

    let activeHistoryConfig = null;
    let activeTipConfig = null;

    function esc(value) {
        if (window.CGoA11y && typeof window.CGoA11y.escapeHtml === 'function') {
            return window.CGoA11y.escapeHtml(value);
        }
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toPlainText(value) {
        if (Array.isArray(value)) {
            return value.map((item) => toPlainText(item)).filter(Boolean).join(' / ');
        }
        if (value == null) return '';
        return String(value).trim();
    }

    function normalizeFieldValue(raw) {
        if (raw == null) return null;
        if (typeof raw === 'object' && !Array.isArray(raw)) {
            if (raw.hidden === true || raw.visible === false || raw.show === false || raw.enabled === false) {
                return { text: '', visible: false };
            }
            const text = toPlainText(raw.value ?? raw.text ?? raw.name ?? '');
            return text ? { text, visible: true } : null;
        }
        const text = toPlainText(raw);
        return text ? { text, visible: true } : null;
    }

    /**
     * 渲染标准化的车站提示卡片（基于 CSS 主题变量与 <cgo-icon>）
     */
    function renderTipCardHtml(options = {}) {
        const {
            title = '',
            icon = 'location',
            iconSize = 14,
            body = '',
            bodyText = '',
            color = ''
        } = options || {};

        const resolvedBody = body || (bodyText ? esc(bodyText) : '');
        if (!resolvedBody) return '';

        const primaryFallback = esc(color || DEFAULT_PRIMARY_FALLBACK);
        const safeIcon = esc(icon || 'location');
        const safeSize = Number(iconSize) > 0 ? Number(iconSize) : 14;
        const safeTitle = options.escapeTitle ? esc(title) : String(title || '');

        const cardStyle = [
            'margin: 0 0 14px 0',
            'padding: 10px 12px',
            'background: var(--card-sub-bg, rgba(0, 0, 0, 0.03))',
            'border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08))',
            `border-left: 3px solid var(--primary-color, ${primaryFallback})`,
            'border-radius: 6px',
            'display: flex',
            'flex-direction: column',
            'gap: 4px'
        ].join('; ');

        const titleStyle = [
            'display: flex',
            'align-items: center',
            'gap: 6px',
            'font-size: 12px',
            'font-weight: bold',
            'color: var(--text-main)'
        ].join('; ');

        const bodyStyle = [
            'font-size: 12px',
            'color: var(--text-light)',
            'line-height: 1.5'
        ].join('; ');

        return `
            <div class="cgo-tip-card" style="${cardStyle}">
                <div style="${titleStyle}">
                    <cgo-icon name="${safeIcon}" size="${safeSize}" style="color: var(--primary-color, ${primaryFallback});"></cgo-icon>
                    <span>${safeTitle}</span>
                </div>
                <div style="${bodyStyle}">
                    ${resolvedBody}
                </div>
            </div>
        `;
    }

    function resolveHistoryRows(context, config) {
        const station = (context && context.station) || {};
        const stationId = station.id;
        if (!stationId) return { rows: [], note: '' };

        const cfg = config || {};
        if (cfg.enabled === false) return { rows: [], note: '' };

        let entry = null;
        if (typeof cfg.getEntry === 'function') {
            entry = cfg.getEntry(station, context);
        } else {
            const table = cfg.data || cfg.stations || cfg.byStationId || {};
            entry = table[stationId] || null;
        }
        if (entry && entry.hidden === true) return { rows: [], note: '' };

        const rows = [];
        if (entry && Array.isArray(entry.rows)) {
            entry.rows.forEach((item) => {
                if (!item || item.visible === false || item.hidden === true) return;
                const val = toPlainText(item.value ?? item.text ?? '');
                const label = toPlainText(item.type ?? item.label ?? '');
                if (label && val) rows.push({ label, value: val });
            });
        }

        if (rows.length === 0) {
            const fields = Array.isArray(cfg.fields) && cfg.fields.length ? cfg.fields : DEFAULT_HISTORY_FIELDS;
            fields.forEach((field) => {
                const keys = Array.isArray(field.keys) ? field.keys : [field.key];
                let picked = null;
                for (let i = 0; i < keys.length; i++) {
                    const candidate = normalizeFieldValue(station[keys[i]]);
                    if (candidate !== null) {
                        picked = candidate;
                        break;
                    }
                }
                if (picked === null && entry && typeof entry === 'object') {
                    for (let i = 0; i < keys.length; i++) {
                        const candidate = normalizeFieldValue(entry[keys[i]]);
                        if (candidate !== null) {
                            picked = candidate;
                            break;
                        }
                    }
                }
                if (picked && picked.visible && picked.text) {
                    rows.push({ label: field.label, value: picked.text });
                }
            });
        }

        const note = entry && entry.note ? toPlainText(entry.note) : '';
        return { rows, note };
    }

    function getCityModuleOverride(context, modId) {
        const board = context && context.city && (context.city.stationBoard || context.city.stationPanel);
        const mods = board && board.modules;
        if (!mods) return null;
        if (Array.isArray(mods)) {
            for (let i = 0; i < mods.length; i++) {
                const item = mods[i];
                if (typeof item === 'string' && item.trim().toLowerCase() === modId) {
                    return { enabled: true };
                }
                if (item && typeof item === 'object' && String(item.id || '').trim().toLowerCase() === modId) {
                    return { enabled: item.enabled !== false, ...item };
                }
            }
            return null;
        }
        if (typeof mods === 'object') {
            const raw = mods[modId];
            if (typeof raw === 'boolean') return { enabled: raw };
            if (raw && typeof raw === 'object') return raw;
        }
        return null;
    }

    function mergeModuleConfig(baseCfg, activeCfg, cityCfg) {
        const enabled = (cityCfg && cityCfg.enabled !== undefined)
            ? cityCfg.enabled
            : (activeCfg && activeCfg.enabled !== undefined ? activeCfg.enabled : undefined);
        return { ...(baseCfg || {}), ...(activeCfg || {}), ...(cityCfg || {}), enabled };
    }

    function buildNameHistoryModule(config) {
        const cfg = config || {};
        return {
            id: cfg.id || NAME_HISTORY_MOD_ID,
            name: cfg.name || '站名沿革与工程名',
            targetTab: cfg.targetTab || 'station-info',
            order: typeof cfg.order === 'number' ? cfg.order : 12,
            enabled: Boolean(cfg.enabled),
            shouldRender(context) {
                const modId = cfg.id || NAME_HISTORY_MOD_ID;
                const cityCfg = getCityModuleOverride(context, modId);
                const mergedCfg = mergeModuleConfig(cfg, activeHistoryConfig, cityCfg);
                const { rows, note } = resolveHistoryRows(context, mergedCfg);
                return rows.length > 0 || Boolean(note);
            },
            render(context) {
                const modId = cfg.id || NAME_HISTORY_MOD_ID;
                const cityCfg = getCityModuleOverride(context, modId);
                const mergedCfg = mergeModuleConfig(cfg, activeHistoryConfig, cityCfg);
                const { rows, note } = resolveHistoryRows(context, mergedCfg);
                if (rows.length === 0 && !note) return '';

                const rowsHtml = rows.map((row) => `
                    <div class="info-row" style="margin-bottom:6px; line-height:1.45; align-items:flex-start;">
                        <span class="info-label" style="text-align:left;">${esc(row.label)}</span>
                        <span class="info-value" style="min-width:0; flex:1; text-align:right; white-space:normal; overflow-wrap:break-word; word-break:normal;">${esc(row.value)}</span>
                    </div>
                `).join('');

                const noteHtml = note
                    ? `<div style="font-size:12px; color:var(--text-light); line-height:1.45; margin-top:6px;">${esc(note)}</div>`
                    : '';

                return `
                    <div class="cgo-station-name-history" style="margin-bottom:15px; border-bottom:1px dashed var(--divider); padding-bottom:10px; font-size:13px;">
                        ${rowsHtml}
                        ${noteHtml}
                    </div>
                `;
            }
        };
    }

    function resolveTipCards(context, config) {
        const cfg = config || {};
        if (cfg.enabled === false) return [];
        const station = (context && context.station) || {};
        const stationId = station.id;

        if (typeof cfg.getCards === 'function') {
            const res = cfg.getCards(context);
            return (Array.isArray(res) ? res : (res ? [res] : [])).filter((c) => c && (c.body || c.bodyText));
        }

        const out = [];
        if (cfg.byStationId && stationId && cfg.byStationId[stationId]) {
            const entry = cfg.byStationId[stationId];
            const list = Array.isArray(entry) ? entry : [entry];
            list.forEach((item) => {
                if (item && (item.body || item.bodyText)) out.push(item);
            });
        }
        if (Array.isArray(cfg.cards)) {
            cfg.cards.forEach((item) => {
                if (!item) return;
                if (typeof item.match === 'function' && !item.match(context)) return;
                if (Array.isArray(item.stationIds) && (!stationId || !item.stationIds.includes(stationId))) return;
                const body = typeof item.getBody === 'function' ? item.getBody(context) : item.body;
                if (body || item.bodyText) {
                    out.push({ ...item, body: body || '' });
                }
            });
        }
        return out;
    }

    function buildTipCardsModule(config) {
        const cfg = config || {};
        return {
            id: cfg.id || TIP_CARDS_MOD_ID,
            name: cfg.name || '车站提示卡片',
            targetTab: cfg.targetTab || 'station-info',
            order: typeof cfg.order === 'number' ? cfg.order : 15,
            enabled: Boolean(cfg.enabled),
            shouldRender(context) {
                const modId = cfg.id || TIP_CARDS_MOD_ID;
                const cityCfg = getCityModuleOverride(context, modId);
                const mergedCfg = mergeModuleConfig(cfg, activeTipConfig, cityCfg);
                return resolveTipCards(context, mergedCfg).length > 0;
            },
            render(context) {
                const modId = cfg.id || TIP_CARDS_MOD_ID;
                const cityCfg = getCityModuleOverride(context, modId);
                const mergedCfg = mergeModuleConfig(cfg, activeTipConfig, cityCfg);
                const list = resolveTipCards(context, mergedCfg);
                if (!list.length) return '';
                return list.map((card) => renderTipCardHtml(card)).join('');
            }
        };
    }

    function registerDefaults() {
        if (!window.StationBoard || typeof window.StationBoard.registerModule !== 'function') return;
        window.StationBoard.registerModule(buildNameHistoryModule({ enabled: false }));
        window.StationBoard.registerModule(buildTipCardsModule({ enabled: false }));
    }

    /** 城市按需接入「工程名 / 曾用名 / 站名沿革」信息板模块 */
    function registerNameHistory(config = {}) {
        activeHistoryConfig = { enabled: config.enabled !== false, ...config };
        if (window.StationBoard && typeof window.StationBoard.registerModule === 'function') {
            window.StationBoard.registerModule(buildNameHistoryModule(activeHistoryConfig));
        }
    }

    /** 城市按需接入「车站专题提示卡片」信息板模块 */
    function registerTipCards(config = {}) {
        activeTipConfig = { enabled: config.enabled !== false, ...config };
        if (window.StationBoard && typeof window.StationBoard.registerModule === 'function') {
            window.StationBoard.registerModule(buildTipCardsModule(activeTipConfig));
        }
    }

    registerDefaults();

    window.CGoStationAddons = {
        registerNameHistory,
        registerTipCards,
        renderTipCardHtml
    };
})();
