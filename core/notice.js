/**
 * CGo OpenMap - 动态运营公告与通知系统 (core/notice.js)
 * 
 * ==============================================================================
 * 公告系统规范说明 (Notice & Announcement System)
 * ==============================================================================
 * 作用：在地图启动时弹出轻量卡片通知，并集成至“帮助与关于”弹窗中展示。
 * 
 * 分类标识 (Categories):
 * - `ops`: 运营调整/新线开通信息 (橙色)
 * - `app`: 地图功能与版本更新说明 (蓝色)
 * - `msg`: 作者留言与公告 (灰色)
 * - `ads`: 推广与社群交流信息 (绿色)
 * 
 * 字段说明：
 * - id: 唯一编号，已读状态记录于 localStorage (`nal_notice_read_ids`)
 * - active: 是否启用该通知 (true/false)
 * - startTime: 可选，开始展示时间 ("YYYY-MM-DD HH:mm:ss" 或 "YYYY-MM-DD")；未到时间不展示，缺省视为立即开始
 * - deadline: 有效期截止时间 ("YYYY-MM-DD HH:mm:ss" / "YYYY-MM-DD" 或 "permanent")，控制帮助弹窗中的展示
 * - 时间按**城市运营时区**解释（取 `city/data.js` 注册项的 `timezone`，为必填城市元数据）；
 *   `utcOffset` 可按条目手工覆盖（如 "+08:30"），用于某国临时调整时区而设备时区库未更新时钉死口径；
 *   填写了但格式不对或日期不存在（如 2 月 30 日）时按「本条公告无效」处理（不展示），
 *   并在控制台给出一次警告——不要指望写错的日期被当成「永久有效」蒙混过关
 * - city: 可选，限定生效城市 ID（如 "shenyang"）；缺省为全城通用
 * - pushWindowDays: 可选，浮动卡片的推送窗口天数，默认 30 天（从 startTime 起算）；
 *   超过窗口后不再弹卡，但仍可在「帮助与关于」中查看，直到 deadline
 * - summary: 浮动卡片展示的简明摘要
 * - detail: 帮助弹窗中展示的详细正文 (支持富文本与详情图片)
 * ==============================================================================
 */

(function () {
    const CAT_CONFIG = {
        'ops': { title: '运营信息', color: '#eb9605', icon: 'train' },
        'app': { title: '地图信息', color: '#00a0e9', icon: 'map' },
        'msg': { title: '作者留言', color: '#78848b', icon: 'chat' },
        'ads': { title: '推广信息', color: '#009f3c', icon: 'notification' }
    };

    /** 浮动卡片默认推送窗口：从 startTime 起 30 天内，与新线开通通知口径一致 */
    const DEFAULT_PUSH_WINDOW_DAYS = 30;

    const currentCityId = () => (
        window.CityDataManager?.getCurrentCityId?.()
        || (typeof window.CURRENT_CITY?.id === 'string' ? window.CURRENT_CITY.id : '')
        || ''
    );

    /* ── 时间解析：严格格式 + 城市运营时区 ── */

    /** 只认 "YYYY-MM-DD" 与 "YYYY-MM-DD HH:mm:ss"（T 分隔也接受） */
    const TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/;

    const formatterCache = new Map();
    const warnedTimeZone = new Set();

    /**
     * 当前城市的运营时区（IANA 名称）。
     *
     * 时区属城市元数据，必须在 `city/data.js` 的注册项里显式声明 `timezone`：
     * 浏览器没有「按城市名 / 经纬度反查时区」的 API，第三方接口需要联网与密钥，
     * 与纯静态离线的目标冲突，故一律由城市主理人手工填写（`selfcheck.js` 会拦截漏配）。
     * 未声明或 IANA 名非法时返回空串，调用方据此把时间判为无效并告警——不猜默认时区。
     */
    function cityTimeZone(cityId) {
        const id = cityId || currentCityId();
        return window.CityDataManager?.getCity?.(id)?.timezone
            || window.CURRENT_CITY?.timezone
            || '';
    }

    /**
     * 解析条目的 `utcOffset` 覆盖值（如 "+08:30"、"-05:00"、"9"）。
     * @returns {undefined} 未填写
     * @returns {null} 填写了但格式不合法
     * @returns {number} 相对 UTC 的偏移分钟数
     */
    function parseOffsetOverride(value) {
        if (value === null || value === undefined) return undefined;
        const raw = String(value).trim();
        if (!raw) return undefined;
        const matched = /^([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(raw);
        if (!matched) return null;
        const hours = Number(matched[2]);
        const minutes = Number(matched[3] || 0);
        if (hours > 14 || minutes > 59) return null;
        return (matched[1] === '-' ? -1 : 1) * (hours * 60 + minutes);
    }

    let warnedInvalidOffset = false;

    function warnInvalidOffset() {
        if (warnedInvalidOffset) return;
        warnedInvalidOffset = true;
        console.warn('[NAL_NOTICE] 公告的 utcOffset 格式不合法，已回退为城市时区；请填写 "+08:30" 这类格式。');
    }

    /**
     * 取目标时区的格式化器。
     * **不设默认时区**：漏配或 IANA 名无效时返回 null，让调用方把时间判为无效——
     * 宁可让带时间的公告不展示并告警，也不猜一个城市时区。
     */
    function tzFormatter(timeZone) {
        if (formatterCache.has(timeZone)) return formatterCache.get(timeZone);
        let formatter = null;
        if (timeZone) {
            try {
                formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone,
                    hour12: false,
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
            } catch (err) {
                formatter = null;
            }
        }
        formatterCache.set(timeZone, formatter);
        return formatter;
    }

    function warnTimeZone(timeZone) {
        const key = timeZone || '(未声明)';
        if (warnedTimeZone.has(key)) return;
        warnedTimeZone.add(key);
        console.warn(timeZone
            ? `[NAL_NOTICE] 城市时区 "${timeZone}" 无效，带时间字段的公告不会展示；请填写合法的 IANA 时区名。`
            : '[NAL_NOTICE] 当前城市未在 city/data.js 声明 timezone，带时间字段的公告不会展示；请补充 IANA 时区名（如 "Asia/Shanghai"）。');
    }

    /**
     * 设备时区库（tzdata）能力探测。
     *
     * 取几个**规则已固定**的时间点核对偏移：历史事件（平壤 2015-2018 的 +8:30、中国 1991 年
     * 夏令时）与已写入 IANA 的未来规则（悉尼 2026 年南半球夏令时 +11）。某些浏览器 / 旧系统会
     * 裁剪时区数据或长期不更新，导致公告时间整体偏移却毫无提示；这里只在首次解析时跑一次，
     * 失配只告警、不阻断解析。
     */
    const TZ_PROBES = [
        ['Asia/Pyongyang', '2017-01-01T00:00:00Z', 510],     // +8:30
        ['Asia/Shanghai', '1991-06-01T00:00:00Z', 540],      // 中国历史夏令时 +9
        ['Australia/Sydney', '2026-11-01T00:00:00Z', 660]    // 南半球夏令时 +11
    ];
    let tzProbeDone = false;

    function probeTimeZoneData() {
        if (tzProbeDone) return;
        tzProbeDone = true;
        const broken = [];
        TZ_PROBES.forEach(([timeZone, iso, expected]) => {
            const formatter = tzFormatter(timeZone);
            if (!formatter) { broken.push(`${timeZone} 缺失`); return; }
            const actual = tzOffsetMs(Date.parse(iso), formatter) / 60000;
            if (actual !== expected) broken.push(`${timeZone} 期望 ${expected / 60}h、实得 ${actual / 60}h`);
        });
        if (broken.length) {
            console.warn(`[NAL_NOTICE] 设备时区数据库疑似不完整或过旧，公告时间可能偏移：${broken.join('；')}`);
        }
    }

    /** 某时刻在目标时区的墙钟分量（小时对 24 取模：hour12:false 下午夜可能输出 24） */
    function zonedParts(timestamp, formatter) {
        const map = {};
        formatter.formatToParts(new Date(timestamp)).forEach((part) => {
            if (part.type !== 'literal') map[part.type] = part.value;
        });
        return {
            year: Number(map.year), month: Number(map.month), day: Number(map.day),
            hour: Number(map.hour) % 24, minute: Number(map.minute), second: Number(map.second)
        };
    }

    /** 目标时区相对 UTC 的偏移（毫秒） */
    function tzOffsetMs(timestamp, formatter) {
        const p = zonedParts(timestamp, formatter);
        return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - timestamp;
    }

    /**
     * 解析公告的时间字段。返回值刻意区分三种情形：
     *   null      —— 字段未填写 / 为 "permanent"，即不设限（历史兼容口径，缺省照旧）
     *   Date      —— 合法时间，按当前城市的运营时区解释
     *   undefined —— 填了但解析不出来（格式不对、日期不存在或城市未声明时区），调用方必须当作「无效」
     *
     * 不能只靠 `getTime()` 是否为 NaN 判定：JS 会把 2026-02-30 进位成 3 月 2 日、
     * 25:00:00 进位成次日 1 点，V8 下都是合法 Date。故解析后必须在目标时区里逐项回核。
     */
    function parseLocalTime(value, utcOffset) {
        if (value === null || value === undefined) return null;
        const raw = String(value).trim();
        if (!raw || raw === 'permanent') return null;

        const matched = TIME_PATTERN.exec(raw);
        if (!matched) return undefined;

        const year = Number(matched[1]);
        const month = Number(matched[2]);
        const day = Number(matched[3]);
        const hour = Number(matched[4] || 0);
        const minute = Number(matched[5] || 0);
        const second = Number(matched[6] || 0);

        const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);

        // 日历回核（与时区无关）：2 月 30 日、13 月、25 时等会被 Date 静默进位，先挡掉
        const wall = new Date(wallClockAsUtc);
        if (wall.getUTCFullYear() !== year || wall.getUTCMonth() !== month - 1
            || wall.getUTCDate() !== day || wall.getUTCHours() !== hour
            || wall.getUTCMinutes() !== minute || wall.getUTCSeconds() !== second) {
            return undefined;
        }

        // 条目手工钉死的偏移优先于城市时区，用于设备时区库落后于政策变更的情况
        const override = parseOffsetOverride(utcOffset);
        if (override === null) warnInvalidOffset();
        if (typeof override === 'number') {
            return new Date(wallClockAsUtc - override * 60000);
        }

        probeTimeZoneData();

        const timeZone = cityTimeZone();
        const formatter = tzFormatter(timeZone);
        if (!formatter) { warnTimeZone(timeZone); return undefined; }

        // 把「墙钟时间」当作 UTC 取一次偏移作为初值，再回代一次收敛。时区规则全部来自
        // Intl 的 IANA tzdata，按**公告所指的那个时刻**取，而非「城市当前偏移」，所以历史
        // 变更（如平壤 2015-2018 的 +8:30）与未来规则都按各自当时的规则解释。
        // 夏令时切换日：被拨快的缺失时刻（如悉尼 02:30 不存在）回核对不上 → 判无效；
        // 被回拨的重复时刻（02:30 出现两次）会稳定收敛到**回拨后**的标准时间那一次。
        const guess = wallClockAsUtc - tzOffsetMs(wallClockAsUtc, formatter);
        const timestamp = wallClockAsUtc - tzOffsetMs(guess, formatter);

        const actual = zonedParts(timestamp, formatter);
        if (actual.year !== year || actual.month !== month || actual.day !== day
            || actual.hour !== hour || actual.minute !== minute || actual.second !== second) {
            return undefined;
        }
        return new Date(timestamp);
    }

    /** 无效时间字段只提示一次，避免每次渲染刷屏 */
    const warnedInvalidTime = new Set();

    function warnInvalidTime(item, field) {
        const key = `${item.id}:${field}`;
        if (warnedInvalidTime.has(key)) return;
        warnedInvalidTime.add(key);
        console.warn(
            `[NAL_NOTICE] 公告 ${item.id} 的 ${field} 无法解析（${item[field]}），本条按无效处理、不会展示；`
            + `请填写 "YYYY-MM-DD HH:mm:ss" 或 "permanent"。`
        );
    }

    function checkValidity(item) {
        if (!item.active) return false;
        // 城市限定：取不到当前城市时不做过滤，避免公告被整体隐藏
        const city = currentCityId();
        if (item.city && city && item.city !== city) return false;

        // 填了却解析不出来的时间一律判为无效公告：宁可漏展，也不能提前放出（startTime 写错）
        // 或永久挂着（deadline 写错）——运营公告的时效性比「尽量都显示」更重要。
        const start = parseLocalTime(item.startTime, item.utcOffset);
        if (start === undefined) { warnInvalidTime(item, 'startTime'); return false; }
        const end = parseLocalTime(item.deadline, item.utcOffset);
        if (end === undefined) { warnInvalidTime(item, 'deadline'); return false; }

        const now = Date.now();
        if (start && now < start.getTime()) return false;
        return !end || now <= end.getTime();
    }

    /**
     * 是否仍在浮动卡片的推送窗口内。
     * 只约束弹卡；帮助弹窗的公告列表仍由 checkValidity（deadline）控制。
     */
    function isWithinPushWindow(item) {
        const start = parseLocalTime(item.startTime, item.utcOffset);
        // 未填写 = 立即进入推送窗口；无效值已在 checkValidity 里拦下，不会走到这里
        if (!start) return true;
        const days = Number(item.pushWindowDays) > 0
            ? Number(item.pushWindowDays)
            : DEFAULT_PUSH_WINDOW_DAYS;
        return Date.now() - start.getTime() <= days * 86400000;
    }

    window.NAL_NOTICE = {
        getDetailsHtml: function () {
            const validItems = this.items.filter(checkValidity);
            if (!validItems.length) return null;
            return validItems.map((item, index) => {
                const cat = CAT_CONFIG[item.category] || { title: '公告', color: '#333' };
                const borderStyle = index === validItems.length - 1 ? '' : 'border-bottom:1px dashed rgba(0,0,0,0.1); margin-bottom:12px; padding-bottom:12px;';
                const detailImg = item.image ? `<img src="${item.image}" class="help-notice-img" alt="详情图片">` : '';
                return `
                    <div style="${borderStyle}">
                        <div style="font-size:13px; font-weight:bold; color:var(--text-main); margin-bottom:4px; display:flex; align-items:center; flex-wrap:wrap;">
                            ${cat.icon ? `<cgo-icon name="${cat.icon}" size="14" style="margin-right:4px; vertical-align:-2px; display:inline-flex;"></cgo-icon>` : ''} ${cat.title}
                        </div>
                        <div style="font-size:11px; line-height:1.5;">${item.detail}${detailImg}</div>
                    </div>
                `;
            }).join('');
        },
        autoDismissDuration: 6000,
        items: [
            {
                id: '20260915_qq',
                active: true,
                category: 'app',
                deadline: 'permanent',
                summary: "欢迎加入 CGo OpenMap 官方交流群",
                detail: "官方 QQ 交流群（群号：619357751）现已开放！欢迎轨道交通爱好者、前端开发者及城市主理人加入交流线网规划与城市移植。<br><a href='https://qm.qq.com/q/nHfgBDS68o' target='_blank' style='color:#12b7f5; text-decoration:underline; font-weight:600; display:inline-flex; align-items:center; gap:4px;'><cgo-icon name='arrow-right' size='12'></cgo-icon><span>点击一键加入官方 QQ 群</span></a>"
            },
            {
                id: '20261022_sy_tram5_last',
                active: true,
                category: 'ops',
                city: 'shenyang',
                startTime: '2026-10-22 00:00:00',
                deadline: '2026-11-25 23:59:59',
                summary: "10月25日起，浑南有轨5号线末班提前",
                detail: "自 2026 年 10 月 25 日起，浑南有轨 5 号线末班车调整为：<b>李石寨 20:00 发车</b>、<b>奥体中心 21:20 发车</b>。请留意出行时间。"
            },
            {
                id: '20261112_hh_baita_close_notice',
                active: true,
                category: 'ops',
                city: 'hohhot',
                startTime: '2026-11-12 00:00:00',
                deadline: '2026-11-25 23:59:59',
                summary: "11月26日起，白塔机场关闭",
                detail: "自 2026 年 11 月 26 日零时起，呼和浩特白塔国际机场关闭，航班整体转至盛乐国际机场。本图将同步移除白塔机场的轨道接驳入口。"
            },
            {
                id: '20261126_hh_baita_closed',
                active: true,
                category: 'ops',
                city: 'hohhot',
                startTime: '2026-11-26 00:00:00',
                deadline: '2026-12-26 23:59:59',
                summary: "白塔机场已关闭，请前往盛乐国际机场",
                detail: "呼和浩特白塔国际机场已于 2026 年 11 月 26 日零时起关闭，航班整体转至盛乐国际机场；盛乐机场暂无轨道接驳。"
            },
        ]
    };

    function injectNoticeStyles() {
        const css = `
            #nal-notice-container {
                position: fixed;
                top: 70px;
                right: 15px;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            }
            .nal-notice-card {
                width: 270px;
                max-width: 75vw;
                min-width: 200px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
                padding: 12px 30px 12px 15px; 
                pointer-events: auto;
                cursor: pointer;
                position: relative;
                transform: translateX(120%);
                opacity: 0;
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out;
                overflow: hidden;
                border-left: 4px solid var(--primary-color, #00263b);
            }
            html[data-theme="dark"] .nal-notice-card {
                background: rgba(40, 40, 40, 0.9);
                color: #fff;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                border-left-color: #78848b;
            }
            .nal-notice-card.show { transform: translateX(0); opacity: 1; }
            .nal-notice-card.hide { transform: translateX(120%); opacity: 0; }
            .nal-notice-content {
                width: 100%; min-width: 0;
                /* 内容区是 button（键盘可达），以下为外观复位，视觉与原先的 div 一致 */
                display: block; margin: 0; padding: 0; border: 0; background: none;
                font: inherit; color: inherit; text-align: left; cursor: pointer;
                -webkit-appearance: none; appearance: none;
            }
            .nal-notice-content:focus-visible,
            .nal-notice-close:focus-visible {
                outline: 2px solid var(--focus-ring, #1a73e8);
                outline-offset: 2px;
            }
            .nal-notice-header {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 4px;
                color: var(--text-light, #666);
                display: flex;
                align-items: center;
                gap: 4px;
            }
            html[data-theme="dark"] .nal-notice-header { color: #aaa; }
            .nal-notice-desc {
                font-size: 12px;
                line-height: 1.4;
                font-weight: 500;
                color: var(--text-main);
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
            }
            html[data-theme="dark"] .nal-notice-desc { color: #fff; }
            .nal-notice-img-wrap {
                margin-top: 8px;
                margin-bottom: 4px;
                width: 100%;
                border-radius: 4px;
                display: none;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .nal-notice-img-wrap.has-img { display: flex; }
            .nal-notice-img {
                display: block;
                border-radius: 4px;
                transition: all 0.2s;
            }
            .help-notice-img {
                max-width: 100%;
                border-radius: 4px;
                margin-top: 8px;
                display: block;
            }
            .nal-notice-close {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 18px;
                height: 18px;
                border-radius: 4px;
                background: transparent;
                color: #999;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: all 0.2s;
            }
            .nal-notice-close:hover {
                background: rgba(0,0,0,0.05);
                color: #333;
            }
            html[data-theme="dark"] .nal-notice-close:hover {
                background: rgba(255,255,255,0.1);
                color: #fff;
            }
        `;
        const style = document.createElement('style');
        style.innerText = css;
        document.head.appendChild(style);
    }

    function initContainer() {
        let container = document.getElementById('nal-notice-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'nal-notice-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function showNotification(item) {
        const container = initContainer();
        const card = document.createElement('div');
        card.className = 'nal-notice-card';
        // 状态消息：出现时由读屏自动播报
        card.setAttribute('role', 'status');
        const cat = CAT_CONFIG[item.category] || { title: '通知', color: '#666' };
        // 强调色：条目自带时优先（如新开通线路用那条线的标志色），否则用分类色
        const accent = item.accentColor || cat.color;
        card.style.borderLeftColor = accent;
        card.innerHTML = `
            <button type="button" class="nal-notice-content" title="查看公告详情">
                <span class="nal-notice-header">
                    ${cat.icon ? `<cgo-icon name="${cat.icon}" size="14" style="margin-right:4px; vertical-align:-2px; display:inline-flex; color:${accent};"></cgo-icon>` : ''} ${cat.title}
                </span>
                <span class="nal-notice-desc">${item.summary}</span>
            </button>
            <button type="button" class="nal-notice-close" title="关闭" aria-label="关闭公告"><cgo-icon name="close" size="12"></cgo-icon></button>
        `;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.nal-notice-close')) return;
            document.getElementById('help-btn')?.click();
            dismissAll();
        });
        card.querySelector('.nal-notice-close').addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss(card);
        });
        container.appendChild(card);
        setTimeout(() => card.classList.add('show'), 50);
        // 自动消失计时：鼠标悬停或键盘焦点在卡片内时暂停，离开后重新计满时长
        let dismissTimer = null;
        const startTimer = () => {
            clearTimeout(dismissTimer);
            dismissTimer = setTimeout(() => dismiss(card), window.NAL_NOTICE.autoDismissDuration);
        };
        const pauseTimer = () => clearTimeout(dismissTimer);
        const resumeTimer = () => {
            if (card.matches(':hover') || card.contains(document.activeElement)) return;
            startTimer();
        };
        card.addEventListener('mouseenter', pauseTimer);
        card.addEventListener('mouseleave', resumeTimer);
        card.addEventListener('focusin', pauseTimer);
        card.addEventListener('focusout', () => setTimeout(resumeTimer, 0));
        startTimer();
    }

    function dismissAll() {
        document.querySelectorAll('.nal-notice-card').forEach(dismiss);
    }

    function dismiss(card) {
        card.classList.remove('show');
        card.classList.add('hide');
        setTimeout(() => card.remove(), 400);
    }

    function getReadIds() {
        try {
            return JSON.parse(localStorage.getItem('nal_notice_read_ids')) || [];
        } catch {
            return [];
        }
    }

    function markAsRead(id) {
        const readIds = getReadIds().filter(i => i !== id);
        readIds.push(id);
        if (readIds.length > 50) readIds.shift();
        try {
            localStorage.setItem('nal_notice_read_ids', JSON.stringify(readIds));
        } catch { }
    }

    function init() {
        injectNoticeStyles();

        // 合并共享层产出的「新开通线路」通知（见 city/shenyang/shared/station/opening-schedule.js）：
        // 并入 items 后既会走下面的一次性推送，也会出现在「帮助与关于」的公告列表里。
        if (typeof window.CGoOpening?.getOpenNotices === 'function') {
            window.NAL_NOTICE.items = window.NAL_NOTICE.items.concat(window.CGoOpening.getOpenNotices());
        }

        const readIds = getReadIds();
        const validItems = window.NAL_NOTICE.items.filter(item => {
            return checkValidity(item)
                && isWithinPushWindow(item)
                && (!readIds.includes(item.id) || item.alwaysShow);
        });

        validItems.forEach((item, index) => {
            setTimeout(() => {
                showNotification(item);
                // 调试参数覆盖下产生的通知只用于看效果，不消费已读记录
                if (!item.skipReadMark) markAsRead(item.id);
            }, 1000 + (index * 300));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();