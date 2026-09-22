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
 * - deadline: 有效期截止时间 ("YYYY-MM-DD HH:mm:ss" 或 "permanent")
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

    function checkValidity(item) {
        if (!item.active) return false;
        if (!item.deadline || item.deadline === 'permanent') return true;
        return Date.now() <= new Date(item.deadline.replace(' ', 'T')).getTime();
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
                detail: "官方 QQ 交流群（群号：619357751）现已开放！欢迎轨道交通爱好者、前端开发者及城市主理人加入交流线网规划与城市移植。<br><a href='https://qm.qq.com/q/nHfgBDS68o' target='_blank' style='color:#12b7f5; text-decoration:underline; font-weight:600;'>👉 点击一键加入官方 QQ 群</a>"
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
            .nal-notice-content { width: 100%; min-width: 0; }
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
        const cat = CAT_CONFIG[item.category] || { title: '通知', color: '#666' };
        card.style.borderLeftColor = cat.color;
        card.innerHTML = `
            <div class="nal-notice-content">
                <div class="nal-notice-header" style="color:${cat.color}">
                    ${cat.icon ? `<cgo-icon name="${cat.icon}" size="14" style="margin-right:4px; vertical-align:-2px; display:inline-flex;"></cgo-icon>` : ''} ${cat.title}
                </div>
                <div class="nal-notice-desc">${item.summary}</div>
            </div>
            <button class="nal-notice-close" title="关闭"><cgo-icon name="close" size="12"></cgo-icon></button>
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
        setTimeout(() => dismiss(card), window.NAL_NOTICE.autoDismissDuration);
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
        const readIds = getReadIds();
        const validItems = window.NAL_NOTICE.items.filter(item => {
            return checkValidity(item) && (!readIds.includes(item.id) || item.alwaysShow);
        });

        validItems.forEach((item, index) => {
            setTimeout(() => {
                showNotification(item);
                markAsRead(item.id);
            }, 1000 + (index * 300));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();