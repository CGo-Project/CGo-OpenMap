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
 * - startTime: 可选，开始展示时间 ("YYYY-MM-DD HH:mm:ss")；未到时间不展示，缺省视为立即开始
 * - deadline: 有效期截止时间 ("YYYY-MM-DD HH:mm:ss" 或 "permanent")，控制帮助弹窗中的展示
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

    function parseLocalTime(value) {
        if (!value || value === 'permanent') return null;
        const date = new Date(String(value).replace(' ', 'T'));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function checkValidity(item) {
        if (!item.active) return false;
        // 城市限定：取不到当前城市时不做过滤，避免公告被整体隐藏
        const city = currentCityId();
        if (item.city && city && item.city !== city) return false;

        const now = Date.now();
        const start = parseLocalTime(item.startTime);
        if (start && now < start.getTime()) return false;

        const end = parseLocalTime(item.deadline);
        return !end || now <= end.getTime();
    }

    /**
     * 是否仍在浮动卡片的推送窗口内。
     * 只约束弹卡；帮助弹窗的公告列表仍由 checkValidity（deadline）控制。
     */
    function isWithinPushWindow(item) {
        const start = parseLocalTime(item.startTime);
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
                image: './assets/images/qq.png',
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