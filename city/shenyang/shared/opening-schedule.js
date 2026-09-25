/**
 * CGo OpenMap - 未开通区段与车站的开通时刻共享层
 * (city/shenyang/shared/opening-schedule.js)
 *
 * ⚠️ 临时共享位置
 * 本文件与 stacard-engine.js、timetable-renderer.js、tip-card.js、station-title.js
 * 同址，供沈阳、大连、长春三城共用。计划在开发团队确认共享位置后随共享层一并迁入
 * core/，届时只需 git mv 并改各城 {city}.js 的引用路径，零逻辑改动。
 * 详见同目录 README.md。
 *
 * 定位：上游建议「开通时间」由各城自行维护、不设为强制字段，故本层是**可选能力**——
 * 城市没有 data_opening.js、或 CGO_OPENING_SCHEDULE 为空数组时，整条链路不产生任何影响。
 *
 * 加载方式：classic script。由各城 {city}.js 在自身城市数据文件之前 document.write
 * 引入（以全局形式暴露，与城市模块同为 classic script）。真正的状态转换由
 * core/script.js 在 processData() 之前调用 CGoOpening.applySchedule() 触发。
 *
 * 职责边界
 * - 本层负责：时间解析与校验、按时刻转换车站/区段状态、登记待开通车站、
 *   跨过开通时刻后整页刷新，以及未开通车站面板底部的开通文案与倒计时。
 * - 城市侧负责：data_opening.js 中的开通时刻表（线路 ID、开通时刻、合并映射）。
 *
 * 与引擎的接口：core/station-board.js 的 footer-actions 在车站 type 为 "no" 时调用
 * renderPendingNotice() 取 footer 内容（未登记开通时刻则回落到引擎的通用文案），
 * 并在 onMounted 时调用 mountPendingNotice() 启动秒级刷新。
 */
(function () {
    "use strict";

    /** 与 opening-schedule.js 同目录的样式表文件名 */
    const STYLE_FILE = "opening-schedule.css";

    /** 样式表注入标记，避免重复引入 */
    const STYLE_FLAG_ATTR = "data-cgo-opening-style";

    /**
     * 本脚本自身的 URL，用于推导同目录的 opening-schedule.css。
     *
     * ⚠️ 必须在**脚本执行期**读取 currentScript：面板渲染发生在很久之后，
     * 那时 currentScript 已指向别的脚本，据此推导会得到错误路径（样式表 404 后
     * 倒计时框会退化成没有边框底色的裸数字）。
     */
    const SELF_URL = (typeof document !== "undefined" && document.currentScript?.src) || "";

    /** 按自身脚本 URL 推导并注入倒计时样式表（幂等） */
    function injectStyle() {
        if (!SELF_URL || typeof document === "undefined") return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = new URL(STYLE_FILE, SELF_URL).href;
        link.setAttribute(STYLE_FLAG_ATTR, "");
        (document.head || document.documentElement).appendChild(link);
    }

    /** 数据里的开通时刻统一按东八区解释与显示 */
    const SHANGHAI_TZ = "Asia/Shanghai";

    /** 未开通车站开通后的默认站型；可用条目上的 opensAs 覆盖 */
    const DEFAULT_OPEN_TYPE = "dot";

    /** 未开通车站并入既有站后，既有站的默认站型；可用条目上的 mergedAs 覆盖 */
    const DEFAULT_MERGE_TYPE = "tsf";

    /** setTimeout 的上限（约 24.8 天），超过则不设定时器，下次刷新页面时会重新计算 */
    const MAX_TIMEOUT = 2147483647;

    /** 待开通车站：车站 ID → { opensAt, name }，供 footer 倒计时与外部查询 */
    const pendingStations = new Map();

    /** 全部条目（含已生效的），按开通时刻升序 */
    let timeline = [];

    /** 到点整页刷新的定时器 */
    let reloadTimer = null;

    /* ======================================================================
     * 工具
     * ==================================================================== */

    function stationsDataRef() {
        return (typeof stationsData !== "undefined" && stationsData) ? stationsData : null;
    }

    function linesDataRef() {
        return (typeof linesData !== "undefined" && Array.isArray(linesData)) ? linesData : null;
    }

    function notOpenLinesRef() {
        return (typeof NOT_OPEN_LINES !== "undefined" && Array.isArray(NOT_OPEN_LINES)) ? NOT_OPEN_LINES : null;
    }

    /**
     * 解析开通时刻。
     *
     * 数据里必须写成带时区偏移量的 ISO 8601（如 "2026-09-28T07:58+08:00"），
     * 这样"精确到分 + 明确时区"两件事都由同一个字符串说清楚，
     * 且浏览器原生 Date 即可解析，不需要引入任何时区库。
     * 省略偏移量的写法会被系统按本地时区解释，跨时区访问就会算错，故显式拒绝。
     *
     * @param {string|Date} value
     * @returns {Date|null}
     */
    function parseOpensAt(value) {
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }
        if (typeof value !== "string") return null;
        const text = value.trim();
        if (!text) return null;
        if (!/(Z|[+-]\d{2}:?\d{2})$/.test(text)) return null;
        const date = new Date(text);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    /** 按东八区取出 年 / 月 / 日 / 时 / 分（均为 2 位数） */
    function shanghaiDateTimeParts(date) {
        const parts = {};
        new Intl.DateTimeFormat("en-US", {
            timeZone: SHANGHAI_TZ,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).formatToParts(date).forEach((part) => {
            if (part.type !== "literal") parts[part.type] = part.value;
        });
        return parts;
    }

    /** 按东八区格式化为 "YYYY-MM-DD HH:mm" */
    function formatOpensAt(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
        const parts = shanghaiDateTimeParts(date);
        return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
    }

    /**
     * 开通时刻的展示文本。
     * 与当前年份相同时省略年份（「9月28日 07:58」），跨年时带上（「2027年1月1日 00:00」），
     * 免得同一个开通年内多读一遍没有信息量的年份。
     */
    function formatOpensAtText(opensAt) {
        const parts = shanghaiDateTimeParts(opensAt);
        const prefix = parts.year === shanghaiDateTimeParts(new Date()).year ? "" : `${Number(parts.year)}年`;
        return `${prefix}${Number(parts.month)}月${Number(parts.day)}日 ${parts.hour}:${parts.minute}`;
    }

    /**
     * 取某条线路的站序 ID。
     * 分支线（hasbranch）的站序写在 stationIds-way1 / -way2，跨 way 去重后返回。
     */
    function lineStationIds(line) {
        if (!line) return [];
        if (line.hasbranch) {
            const ids = [];
            ["stationIds-way1", "stationIds-way2"].forEach((key) => {
                (Array.isArray(line[key]) ? line[key] : []).forEach((id) => {
                    const value = String(id);
                    if (!ids.includes(value)) ids.push(value);
                });
            });
            return ids;
        }
        return Array.isArray(line.stationIds) ? line.stationIds.map(String) : [];
    }

    /** 取条目涉及的车站 ID：显式 stationIds 优先，否则取该线路的全部站序 */
    function entryStationIds(entry, line) {
        if (Array.isArray(entry.stationIds) && entry.stationIds.length) {
            return entry.stationIds.map(String);
        }
        return lineStationIds(line);
    }

    /**
     * 把线路上对 oldId 的引用整体改指到 newId。
     * 合并后若站序中本就存在 newId，会出现相邻重复站，交给引擎按普通站重复绘制即可，
     * 不影响拓扑正确性（长春各线均不存在这种情况）。
     */
    function rewireStationRefs(oldId, newId) {
        const lines = linesDataRef();
        if (!lines) return;
        lines.forEach((line) => {
            ["stationIds", "stationIds-way1", "stationIds-way2"].forEach((key) => {
                const ids = line?.[key];
                if (!Array.isArray(ids)) return;
                ids.forEach((sid, index) => {
                    if (String(sid) === oldId) ids[index] = newId;
                });
            });
        });
    }

    /** 撤销该条目对应的未开通区段虚线（按 NOT_OPEN_LINES 条目上的 lineId 匹配） */
    function removeNotOpenSegments(entry) {
        const segments = notOpenLinesRef();
        if (!segments) return;
        const keys = (Array.isArray(entry.notOpenLines) ? entry.notOpenLines : []).map(String);
        if (!keys.length) return;
        for (let i = segments.length - 1; i >= 0; i--) {
            if (keys.includes(String(segments[i]?.lineId))) segments.splice(i, 1);
        }
    }

    /**
     * 执行一条已到开通时刻的条目
     *
     * 顺序有意固定：先合并换乘侧站，再开放其余车站，最后撤销区段虚线。
     * 合并映射里出现的车站不再走"开放为普通站"这一步，否则会先被改成 dot、
     * 随即又被合并流程删掉，白白留下一段可疑的中间状态。
     */
    function applyEntry(entry) {
        const stations = stationsDataRef();
        if (!stations) return;

        const line = linesDataRef()?.find((item) => String(item?.id) === String(entry.lineId)) || null;
        // 站序必须在合并之前取快照：合并会就地改写线路上的站序引用，
        // 之后再取就只能拿到合并后的 ID，会把刚升级的既有站又按普通站覆盖掉。
        const stationIds = entryStationIds(entry, line);
        const mergeMap = (entry.merge && typeof entry.merge === "object") ? entry.merge : {};
        const mergeFromIds = Object.keys(mergeMap).map(String);
        const mergeToIds = Object.values(mergeMap).map(String);

        // 1. 未开通车站并入既有站：线路上改指，源站条目移除，目标站升级
        mergeFromIds.forEach((fromId) => {
            const toId = String(mergeMap[fromId]);
            rewireStationRefs(fromId, toId);
            delete stations[fromId];
            const target = stations[toId];
            if (target) target.type = entry.mergedAs || DEFAULT_MERGE_TYPE;
        });

        // 2. 其余未开通车站转为开通后站型
        const openType = entry.opensAs || DEFAULT_OPEN_TYPE;
        stationIds.forEach((sid) => {
            if (mergeFromIds.includes(sid) || mergeToIds.includes(sid)) return;
            const station = stations[sid];
            if (!station) return;
            // 数据里已按开通态写好（未开通期间被本层压成 no）时恢复原站型
            const restored = station._openingRestoreType;
            station.type = entry.opensAs || (restored && restored !== "no" ? restored : openType);
            delete station._openingRestoreType;
        });

        // 3. 撤销对应的未开通区段虚线
        removeNotOpenSegments(entry);
    }

    /**
     * 登记一条尚未到开通时刻的条目
     *
     * 除了记住开通时刻供倒计时使用，还会把涉及的车站压成"未开通"，
     * 这样主理人可以先把开通后的数据提前写好，界面在开通前依旧如实呈现未开通。
     */
    function registerPending(entry, opensAt) {
        const stations = stationsDataRef();
        if (!stations) return;
        const line = linesDataRef()?.find((item) => String(item?.id) === String(entry.lineId)) || null;
        const ids = entryStationIds(entry, line)
            .concat(Object.keys(entry.merge || {}).map(String));

        new Set(ids).forEach((sid) => {
            const station = stations[sid];
            if (!station) return;
            if (station.type !== "no") {
                station._openingRestoreType = station.type;
                station.type = "no";
            }
            pendingStations.set(sid, { opensAt, name: entry.name || "" });
        });
    }

    /** 到点整页刷新；超出定时器上限则等下次打开页面时再判定 */
    function scheduleReload() {
        if (reloadTimer) {
            clearTimeout(reloadTimer);
            reloadTimer = null;
        }
        const next = CGoOpening.getNextEvent();
        if (!next) return;
        // 多留 2 秒余量，避免定时器提前触发时仍被判为未开通
        const delay = next.opensAt.getTime() - Date.now() + 2000;
        if (delay <= 0 || delay > MAX_TIMEOUT) return;
        reloadTimer = setTimeout(() => window.location.reload(), delay);
    }

    /* ======================================================================
     * 调试入口（仅当 URL 带参数时生效，正常访问零影响）
     * ==================================================================== */

    /** URL 参数名 */
    const TEST_PARAM = "openingTest";

    /** 本次是否真的应用了调试覆盖（供通知等能力判断是否要跳过已读写入） */
    let testOverrideApplied = false;

    /**
     * 调试参数的第二道门槛：仅本地 / 内网访问时生效。
     * 线上访客即便照着文档拼出 ?openingTest=… 也不会生效，避免误触发。
     */
    function isLocalDebugHost() {
        const host = (typeof window !== "undefined" && window.location?.hostname) || "";
        if (!host) return false;
        if (host === "localhost" || host === "::1" || host.endsWith(".local")) return true;
        return /^127\./.test(host)                      // 127.0.0.0/8
            || /^10\./.test(host)                       // 10.0.0.0/8
            || /^192\.168\./.test(host)                 // 192.168.0.0/16
            || /^172\.(1[6-9]|2\d|3[01])\./.test(host); // 172.16.0.0/12
    }

    /**
     * 解析调试参数：绝对时刻（ISO 8601 带时区）或相对偏移（30s / -1d / 2m）。
     *
     * ⚠️ URLSearchParams 按 form-urlencoded 规则会把 query 里的 "+" 解码成空格，两种写法都会中招：
     *     ?openingTest=+30s                     → " 30s"
     *     ?openingTest=2026-09-28T07:59+08:00   → "2026-09-28T07:59 08:00"
     * 时刻串本身不含空格，因此这里先把空白还原成 "+" 再解析（符号也设为可选，缺省即正偏移），
     * 于是 "+30s"、"30s"、"-30s" 与带时区的绝对时刻四种写法都能正确解析。
     */
    function parseTestTime(raw) {
        const normalized = raw.trim().replace(/\s+/g, "+");
        const offset = /^([+-]?)(\d+)([smhd])$/.exec(normalized);
        if (!offset) return parseOpensAt(normalized);
        const [, sign, amount, unit] = offset;
        const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
        return new Date(Date.now() + Number(amount) * unitMs * (sign === "-" ? -1 : 1));
    }

    /**
     * 把时刻表里全部条目的开通时刻临时替换为 URL 参数指定的值。
     *
     * 用于在浏览器里直接验证三种状态，**不改城市数据、刷新即失效**：
     *   开通后     ?openingTest=-1d     （一天前就已开通）
     *   开通前     ?openingTest=1d      （一天后才开通；也可写 +1d）
     *   等待跨过   ?openingTest=2m      （停留两分钟，到点应自动整页刷新）
     * 也可直接写绝对时刻（须带时区偏移量），如 ?openingTest=2026-09-28T07:59+08:00。
     */
    function applyTestOverride(entries) {
        const raw = (typeof window !== "undefined" && window.location?.search)
            ? new URLSearchParams(window.location.search).get(TEST_PARAM)
            : null;
        if (!raw) return entries;

        if (!isLocalDebugHost()) {
            console.warn(`[CGoOpening] 调试参数 ${TEST_PARAM} 仅在本地 / 内网访问时生效，已忽略。`);
            return entries;
        }

        const opensAt = parseTestTime(raw);
        if (!opensAt) {
            console.warn(`[CGoOpening] 调试参数 ${TEST_PARAM} 无法解析（须为带时区偏移量的绝对时刻，或 -1d / +2m / +30s）：`, raw);
            return entries;
        }
        testOverrideApplied = true;
        console.info(`[CGoOpening] 调试模式：全部条目的开通时刻已覆盖为 ${opensAt.toISOString()}`);
        return entries.map((entry) => ({ ...entry, opensAt }));
    }

    /**
     * 应用城市开通时刻表（由 core/script.js 在 processData() 之前调用）
     *
     * @param {Array} schedule - 城市 data_opening.js 中的 CGO_OPENING_SCHEDULE
     */
    function applySchedule(schedule) {
        const entries = applyTestOverride(Array.isArray(schedule) ? schedule.filter(Boolean) : []);
        const now = Date.now();

        const events = [];
        entries.forEach((entry) => {
            const opensAt = parseOpensAt(entry.opensAt);
            if (!opensAt) {
                console.warn("[CGoOpening] 开通时刻无法解析，已跳过该条目（需带时区偏移量，如 2026-09-28T07:58+08:00）：", entry.opensAt, entry);
                return;
            }
            events.push({ entry, opensAt, applied: opensAt.getTime() <= now });
        });

        events.filter((event) => event.applied).forEach(({ entry }) => applyEntry(entry));
        events.filter((event) => !event.applied).forEach(({ entry, opensAt }) => registerPending(entry, opensAt));

        timeline = events.sort((a, b) => a.opensAt - b.opensAt);
        scheduleReload();

        if (typeof document !== "undefined" && typeof document.dispatchEvent === "function") {
            document.dispatchEvent(new CustomEvent("cgo:opening-schedule-ready", {
                detail: {
                    total: timeline.length,
                    applied: timeline.filter((event) => event.applied).length,
                    pending: pendingStations.size
                }
            }));
        }
    }

    /* ======================================================================
     * 新开通线路通知（供 core/notice.js 在推送前调用）
     * ==================================================================== */

    /** 默认推送窗口：开通后 30 天内才提示，免得"陈年开通"在很久之后打扰访客 */
    const DEFAULT_NOTICE_WINDOW_DAYS = 30;

    /**
     * 汇总「已开通且仍在推送窗口内」的条目，交给 core/notice.js 生成一次性通知。
     *
     * id 由线路与开通时刻拼成：开通时刻一变就是一条新通知；已读状态沿用 notice
     * 自己的 localStorage（nal_notice_read_ids），因此天然只推一次。
     * 文案默认自动生成，城市可在 data_opening.js 用 noticeSummary / noticeDetail 覆盖，
     * 也可用 noticeWindowDays 单独调整该条目的推送窗口。
     */
    function getOpenNotices() {
        const now = Date.now();
        return timeline
            .filter((event) => event.applied)
            .filter((event) => {
                const days = Number(event.entry.noticeWindowDays) > 0
                    ? Number(event.entry.noticeWindowDays)
                    : DEFAULT_NOTICE_WINDOW_DAYS;
                return now - event.opensAt.getTime() <= days * 86400000;
            })
            .map((event) => {
                const { entry, opensAt } = event;
                const name = entry.name || entry.lineId;
                const text = `${name} 已于 ${formatOpensAtText(opensAt)} 开通运营`;
                // id 带上城市：已读记录是全局一份（localStorage），
                // 不带城市时两座城市万一用了相同 lineId 会互相吃掉对方的通知
                const cityId = (typeof window !== "undefined" && window.CURRENT_CITY?.id) || "";
                // 强调色取该线路的标志色，让通知卡片一眼对得上图上那条线
                const line = linesDataRef()?.find((item) => String(item?.id) === String(entry.lineId)) || null;
                return {
                    id: `opening-${cityId ? `${cityId}-` : ""}${entry.lineId}-${opensAt.getTime()}`,
                    category: "ops",
                    accentColor: line?.color || null,
                    active: true,
                    deadline: "permanent",
                    summary: entry.noticeSummary || text,
                    detail: entry.noticeDetail || `${text}。`,
                    // 调试参数覆盖下的展示只用于看效果，不写已读记录，
                    // 免得退出调试后正式访问时这条一次性通知已经被"消耗"掉
                    skipReadMark: testOverrideApplied
                };
            });
    }

    /* ======================================================================
     * 未开通车站的开通文案与倒计时
     *
     * 供 core/station-board.js 的 footer-actions 调用：登记了开通时刻就输出
     * 「该车站将于 X月X日 XX:XX 开通运营」与「距开通还有 [XX]天 [XX]时 [XX]分 [XX]秒」，
     * 未登记（或城市未接入本能力）时返回空串，由引擎回落到原有文案。
     * ==================================================================== */

    /** 同一时刻只存在一个信息板，保留句柄以便换站时先清掉旧的秒级定时器 */
    let noticeTimer = null;

    /** 倒计时单位，按 天 → 时 → 分 → 秒 的顺序排列 */
    const COUNTDOWN_UNITS = [
        { key: "day", label: "天" },
        { key: "hour", label: "时" },
        { key: "minute", label: "分" },
        { key: "second", label: "秒" }
    ];

    const pad2 = (value) => String(value).padStart(2, "0");

    /** 把剩余毫秒拆成天 / 时 / 分 / 秒 */
    function splitRemain(ms) {
        const total = Math.max(0, Math.floor(ms / 1000));
        return {
            day: Math.floor(total / 86400),
            hour: Math.floor((total % 86400) / 3600),
            minute: Math.floor((total % 3600) / 60),
            second: total % 60
        };
    }

    const countdownItemHtml = ({ key, label }) =>
        `<span class="cgo-opening-countdown-item"><span class="cgo-opening-countdown-num" data-cgo-unit="${key}">00</span>${label}</span>`;

    /**
     * 「距开通 / 还有」这五个字占一个格子、在格子内部换行，四个方块组紧随其后。
     */
    const countdownUnitsHtml = () =>
        `<span class="cgo-opening-countdown-prefix">距开通<br>还有</span>`
        + COUNTDOWN_UNITS.map(countdownItemHtml).join("");

    /**
     * 未开通车站的 footer 内容。
     * 未登记开通时刻（或该城市未接入本能力）时返回空串，交回引擎的通用文案。
     */
    function renderPendingNotice(station) {
        const pending = CGoOpening.getPending(station?.id);
        if (!pending) return "";
        injectStyle();
        return `<div class="cgo-opening-pending" data-cgo-opens-at="${pending.opensAt.toISOString()}">
            <div class="cgo-opening-pending-title">该车站将于 ${formatOpensAtText(pending.opensAt)} 开通运营</div>
            <div class="cgo-opening-countdown">${countdownUnitsHtml()}</div>
        </div>`;
    }

    /** 启动秒级倒计时刷新（由 footer-actions 的 onMounted 调用，未接入时为空操作） */
    function mountPendingNotice(container) {
        if (noticeTimer) {
            clearInterval(noticeTimer);
            noticeTimer = null;
        }
        const root = container?.querySelector(".cgo-opening-pending");
        const opensAt = root ? parseOpensAt(root.dataset.cgoOpensAt) : null;
        if (!root || !opensAt) return;

        const fields = {};
        COUNTDOWN_UNITS.forEach(({ key }) => {
            fields[key] = root.querySelector(`[data-cgo-unit="${key}"]`);
        });

        const tick = () => {
            // 换站或关闭面板后节点会被替换，此时自行退场，避免定时器长期驻留
            if (!root.isConnected) {
                clearInterval(noticeTimer);
                noticeTimer = null;
                return;
            }
            const remainMs = opensAt.getTime() - Date.now();
            const remain = splitRemain(remainMs);
            COUNTDOWN_UNITS.forEach(({ key }) => {
                if (!fields[key]) return;
                // 天不进位补零（"2 天" 比 "02 天" 自然），时 / 分 / 秒固定两位
                fields[key].textContent = key === "day" ? String(remain[key]) : pad2(remain[key]);
            });
            if (remainMs <= 0) {
                clearInterval(noticeTimer);
                noticeTimer = null;
            }
        };
        tick();
        noticeTimer = setInterval(tick, 1000);
    }

    const CGoOpening = {
        applySchedule,

        /** 查询某车站当前是否处于待开通状态；未登记则返回 null */
        getPending(stationId) {
            return pendingStations.get(String(stationId)) || null;
        },

        /** 最近一次尚未到来的开通时刻（含条目与时刻），没有则返回 null */
        getNextEvent() {
            const now = Date.now();
            return timeline.find((event) => !event.applied && event.opensAt.getTime() > now) || null;
        },

        /** 全部条目（含已生效），供调试与文档参考 */
        getTimeline() {
            return timeline.slice();
        },

        formatTime: formatOpensAt,
        formatOpensAtText,
        renderPendingNotice,
        mountPendingNotice,
        getOpenNotices
    };

    window.CGoOpening = CGoOpening;
})();
