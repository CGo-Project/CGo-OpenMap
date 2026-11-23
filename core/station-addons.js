/**
 * CGo OpenMap - 车站信息板增强插件 (core/station-addons.js)
 *
 * 将跨城高频需求收敛为声明式、按需启用（opt-in）的核心能力：
 *   1. cgo-station-name-history（order: 12 @ station-info）：工程名 / 曾用名 / 站名沿革只读展示；
 *   2. cgo-station-tips（order: 15 @ station-info）：专题提示卡片（如文旅贴士 / 换乘提醒）；
 *   3. cgo-station-rename-countdown（order: 13 @ station-info）：更名预告与倒计时——
 *      直接读开通沿革（CGO_OPENING_HISTORY）里的 rename 事件，不另存一份更名时间；
 *   4. renderTipCardHtml：供各城复用的标准化提示卡片 HTML 渲染器（使用 CGoUI 图标与主题变量）。
 */
(function () {
    'use strict';
    if (typeof window === 'undefined') return;

    const NAME_HISTORY_MOD_ID = 'cgo-station-name-history';
    const TIP_CARDS_MOD_ID = 'cgo-station-tips';
    const RENAME_COUNTDOWN_MOD_ID = 'cgo-station-rename-countdown';
    const DEFAULT_PRIMARY_FALLBACK = '#1a73e8';

    /** 更名已发生后，仍展示「已于 … 更名」的天数（与开通通知的推送窗口同口径） */
    const RENAME_NOTICE_WINDOW_DAYS = 30;

    const DEFAULT_HISTORY_FIELDS = [
        { label: '工程名', keys: ['engineeringName', 'engineering'] },
        { label: '曾用名', keys: ['formerName', 'formerNames', 'former', 'oldName'] }
    ];

    let activeHistoryConfig = null;
    let activeTipConfig = null;
    let activeRenameConfig = null;

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
        // context.city 并非所有调用路径都会带（面板渲染时才注入），兜底取当前城市
        const city = (context && context.city) || window.CURRENT_CITY || null;
        const board = city && (city.stationBoard || city.stationPanel);
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

    /* ======================================================================
     * 更名预告与倒计时
     *
     * 数据源只有一个：开通沿革（window.CGO_OPENING_HISTORY）里的 kind === "rename"
     * 事件。倒计时本体复用「未开通车站」那套（CGoOpening.renderCountdown /
     * mountCountdown），不再另存一份更名时间、也不再养第二份定时器。
     * ==================================================================== */

    /** 沿革里的日期写作 YYYY-MM-DD，按东八区当日 00:00 解释 */
    function parseRenameDate(value) {
        if (typeof value !== 'string') return null;
        const text = value.trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
        const date = new Date(`${text}T00:00:00+08:00`);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatRenameDate(date) {
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    function stationRecordOf(stationId) {
        const table = (typeof stationsData !== 'undefined' && stationsData) ? stationsData : null;
        return (table && stationId) ? (table[stationId] || null) : null;
    }

    /**
     * 一对更名是否指向该站：优先认 sid；老数据没有 sid 时按
     * 「新名 = 该站现名或曾用名」反查（与 selfcheck 的更名校验同口径）。
     */
    function renameSpecTargets(spec, stationId) {
        if (!spec) return false;
        if (spec.sid) return String(spec.sid) === String(stationId);
        const station = stationRecordOf(stationId);
        if (!station) return false;
        if (station.cn && station.cn === spec.to) return true;
        return Array.isArray(station.aliases) && station.aliases.includes(spec.to);
    }

    /** 当前站最近的一条更名事件：未来优先；已发生的不超过 noticeWindowDays 天 */
    function resolveRenameNotice(context, config) {
        const cfg = config || {};
        // 引擎已按城市配置过滤过一遍；这里再兜一层，避免别处直接调用时把「未启用」的模块渲染出来
        if (!cfg.enabled) return null;
        const stationId = context && context.station && context.station.id;
        if (!stationId) return null;
        const events = Array.isArray(window.CGO_OPENING_HISTORY) ? window.CGO_OPENING_HISTORY : [];
        if (!events.length) return null;

        const now = Date.now();
        const windowMs = (Number(cfg.noticeWindowDays) > 0 ? Number(cfg.noticeWindowDays) : RENAME_NOTICE_WINDOW_DAYS) * 86400000;
        let upcoming = null;
        let past = null;

        events.forEach((ev) => {
            if (!ev || ev.kind !== 'rename') return;
            const at = parseRenameDate(ev.date);
            if (!at) return;
            const specs = (Array.isArray(ev.renames) && ev.renames.length) ? ev.renames : [ev];
            specs.forEach((spec) => {
                if (!renameSpecTargets(spec, stationId)) return;
                const item = { at, ev, spec };
                if (at.getTime() > now) {
                    if (!upcoming || at < upcoming.at) upcoming = item;
                } else if (now - at.getTime() <= windowMs) {
                    if (!past || at > past.at) past = item;
                }
            });
        });
        return upcoming || past;
    }

    function buildRenameCountdownModule(config) {
        const cfg = config || {};
        return {
            id: cfg.id || RENAME_COUNTDOWN_MOD_ID,
            name: cfg.name || '更名预告',
            // 默认挂在底部操作栏之前：不随选项卡切换而消失，任何时候点开车站都能看到
            targetTab: cfg.targetTab || 'footer',
            order: typeof cfg.order === 'number' ? cfg.order : 5,
            enabled: Boolean(cfg.enabled),
            shouldRender(context) {
                const cityCfg = getCityModuleOverride(context, cfg.id || RENAME_COUNTDOWN_MOD_ID);
                const mergedCfg = mergeModuleConfig(cfg, activeRenameConfig, cityCfg);
                return Boolean(resolveRenameNotice(context, mergedCfg));
            },
            render(context) {
                const cityCfg = getCityModuleOverride(context, cfg.id || RENAME_COUNTDOWN_MOD_ID);
                const mergedCfg = mergeModuleConfig(cfg, activeRenameConfig, cityCfg);
                const notice = resolveRenameNotice(context, mergedCfg);
                if (!notice) return '';
                const { at, spec } = notice;
                const future = at.getTime() > Date.now();
                const fromText = spec.from ? `「${spec.from}」` : '本站';
                const title = future
                    ? `${fromText}将于 ${formatRenameDate(at)} 更名为「${spec.to}」`
                    : `${fromText}已于 ${formatRenameDate(at)} 更名为「${spec.to}」`;

                // 未来事件且城市接入了倒计时（opening-schedule.js）：复用同一套视觉与计时
                const opening = window.CGoOpening;
                if (future && opening && typeof opening.renderCountdown === 'function') {
                    const html = opening.renderCountdown({
                        at: at.toISOString(),
                        title,
                        prefixHtml: '距更名<br>还有'
                    });
                    if (html) return html;
                }

                // 没有倒计时能力（或已过期）：退化为一张纯文案卡片
                return `<div class="cgo-station-rename-notice" style="margin-bottom:15px; padding:10px 12px; border:1px solid var(--divider); border-radius:8px; font-size:13px; line-height:1.5;">
                    <cgo-icon name="info" size="14" style="vertical-align:-2px; margin-right:4px; color:var(--primary-color, ${DEFAULT_PRIMARY_FALLBACK});"></cgo-icon>
                    <span>${esc(title)}</span>
                </div>`;
            },
            onMounted(infoPanel) {
                // ⚠️ 行程规划的底栏入口（core/shared/route/route-panel.js）在挂载时会把
                // .panel-footer 里除自己以外的子节点全部 display:none —— 倒计时块若留在
                // footer 内会被一起藏掉（表现为「闪一下就没了」）。
                // 故这里把它挪到 .panel-footer **之前**当兄弟节点：既仍在操作按钮栏上方，
                // 又不再是 footer 的子节点，躲开那轮隐藏。
                const block = infoPanel.querySelector('.panel-footer > .cgo-opening-pending');
                if (block && block.parentElement) {
                    const footer = block.parentElement;
                    block.style.display = '';
                    block.style.padding = '10px 15px';
                    block.style.borderTop = '1px solid var(--divider)';
                    block.style.background = 'var(--bg-color)';
                    block.style.boxSizing = 'border-box';
                    footer.parentElement.insertBefore(block, footer);
                }
                // 倒计时块由「未开通车站」那套通用实现负责秒级刷新
                const opening = window.CGoOpening;
                if (opening && typeof opening.mountCountdown === 'function') {
                    opening.mountCountdown(infoPanel);
                }
            }
        };
    }

    function registerDefaults() {
        if (!window.StationBoard || typeof window.StationBoard.registerModule !== 'function') return;
        window.StationBoard.registerModule(buildNameHistoryModule({ enabled: false }));
        window.StationBoard.registerModule(buildTipCardsModule({ enabled: false }));
        window.StationBoard.registerModule(buildRenameCountdownModule({ enabled: false }));
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

    /** 城市按需接入「更名预告与倒计时」（数据来自开通沿革的 rename 事件） */
    function registerRenameCountdown(config = {}) {
        activeRenameConfig = { enabled: config.enabled !== false, ...config };
        if (window.StationBoard && typeof window.StationBoard.registerModule === 'function') {
            window.StationBoard.registerModule(buildRenameCountdownModule(activeRenameConfig));
        }
    }

    registerDefaults();

    window.CGoStationAddons = {
        registerNameHistory,
        registerTipCards,
        registerRenameCountdown,
        renderTipCardHtml
    };
})();
