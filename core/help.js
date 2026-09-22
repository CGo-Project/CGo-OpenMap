/**
 * CGo OpenMap - 帮助与关于弹窗逻辑 (core/help.js)
 * 
 * ==============================================================================
 * 模块作用说明 (Help & About Modal)
 * ==============================================================================
 * 作用：处理顶部导航栏“帮助与关于”按钮的点击事件，整合：
 * 1. 动态运营公告 (window.NAL_NOTICE)；
 * 2. 地图手势与检索操作指南说明；
 * 3. 鸣谢名单、数据来源声明与引擎版本展示。
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    const helpBtn = document.getElementById('help-btn');
    if (!helpBtn) return;

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.hideLineTooltipNow?.();

        const legendOverlay = document.getElementById('legend-overlay');
        if (legendOverlay && !document.body.classList.contains('legend-pinned')) {
            legendOverlay.style.display = 'none';
        }

        const noticeDetails = window.NAL_NOTICE?.getDetailsHtml?.();
        const noticeSectionHtml = noticeDetails ? `<div class="help-data-info2">${noticeDetails}</div>` : '';
        const appVersionText = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.8.3';

        const activeCityId = window.CityDataManager?.getCurrentCityId?.() || 'beijing';
        const registryCity = (window.CITY_REGISTRY && window.CITY_REGISTRY[activeCityId]) || {};
        const activeEngineCity = window.getActiveCity?.() || window.CURRENT_CITY || (activeCityId === 'shanghai' ? window.SHANGHAI_CITY : window.BEIJING_CITY) || {};
        const city = Object.assign({}, registryCity, activeEngineCity);

        const cityName = city.name || (activeCityId === 'beijing' ? '北京' : (activeCityId === 'shanghai' ? '上海' : '当前城市'));
        let maintainers = Array.isArray(city.maintainers) && city.maintainers.length > 0
            ? city.maintainers
            : (Array.isArray(registryCity.maintainers) && registryCity.maintainers.length > 0 ? registryCity.maintainers : []);

        // 北京城市兜底保障
        if (activeCityId === 'beijing' && (!maintainers || maintainers.length === 0)) {
            maintainers = [
                { name: "NaL", role: "城市主理人" },
                { name: "SierraQin", role: "运营数据支持" },
                { name: "Freedom Space", role: "市郊铁路校对" }
            ];
        }

        const validMaintainers = (maintainers || []).filter(m => !m.isRecruiting && m.name && m.name !== '待认领');
        let maintainersHtml = '';

        if (validMaintainers.length > 0) {
            maintainersHtml = validMaintainers.map(m => {
                const link = m.github ? `<a href="${m.github}" target="_blank" style="color: var(--accent-color); text-decoration: none;">${m.name}</a>` : m.name;
                return `• ${m.role ? m.role + '：' : ''}${link}`;
            }).join('<br>');
        } else {
            maintainersHtml = `<span style="color: var(--accent-color); font-weight: 500;"><cgo-icon name="sparkle" size="14" style="vertical-align: -2px; margin-right: 2px;"></cgo-icon> 该城市主理人虚位以待，欢迎提交 PR 认领！</span><br><a href="./CONTRIBUTING.md" target="_blank" style="font-size: 11px; text-decoration: underline; color: var(--accent-color);">查看城市主理人计划与贡献指南 &rarr;</a>`;
        }

        const modalContent = `
            ${noticeSectionHtml}
            <div style="font-size: 13px; color: var(--text-main); line-height: 1.6; margin-bottom: 12px; padding: 10px 12px; background: rgba(0, 122, 255, 0.06); border-radius: 8px; border-left: 3px solid #007aff;">
                <strong>关于 CGo OpenMap：</strong><br>
                轻量现代的城市轨道交通线路图开放平台。引擎与数据彻底解耦，欢迎轨道交通爱好者共建并认领全国各城市线路图。
            </div>
            <div class="help-grid">
                <div class="help-card">
                    <div class="help-card-icon"><cgo-icon name="map" size="24"></cgo-icon></div>
                    <h4>地图操作</h4>
                    <ul>
                        <li>自由缩放与平移漫游</li>
                        <li>深色 / 浅色自适应主题</li>
                        <li>触控板手势与双指缩放</li>
                    </ul>
                </div>
                <div class="help-card">
                    <div class="help-card-icon"><cgo-icon name="route" size="24"></cgo-icon></div>
                    <h4>车站与检索</h4>
                    <ul>
                        <li>中英站名及拼音模糊搜索</li>
                        <li>车站图卡与站台结构示意</li>
                        <li>首末班车时刻与接驳导航</li>
                        <li>同台及出站虚拟换乘支持</li>
                    </ul>
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                <a href="./readme.html" class="help-link-btn" style="flex: 1; min-width: 95px; margin: 0; padding: 7px 6px;">
                    <span>开源说明</span>
                    <span class="btn-arrow"><cgo-icon name="chevron-right" size="12"></cgo-icon></span>
                </a>
                <a href="./CONTRIBUTING.md" target="_blank" class="help-link-btn" style="flex: 1; min-width: 95px; margin: 0; padding: 7px 6px;">
                    <span>贡献指南</span>
                    <span class="btn-arrow"><cgo-icon name="chevron-right" size="12"></cgo-icon></span>
                </a>
                <a href="./PORTING.md" target="_blank" class="help-link-btn" style="flex: 1; min-width: 95px; margin: 0; padding: 7px 6px;">
                    <span>移植手册</span>
                    <span class="btn-arrow"><cgo-icon name="chevron-right" size="12"></cgo-icon></span>
                </a>
            </div>
            <div style="margin-top: 10px; padding: 10px 12px; background: rgba(18, 183, 245, 0.08); border-radius: 8px; border-left: 3px solid #12b7f5; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div>
                    <div style="font-size: 12px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 4px;">
                        <cgo-icon name="chat" size="14" style="color: #12b7f5;"></cgo-icon>
                        <span>官方 QQ 交流群：619357751</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-light); margin-top: 2px;">
                        交流城市移植、线网拓扑与使用反馈
                    </div>
                </div>
                <a href="https://qm.qq.com/q/nHfgBDS68o" target="_blank" style="padding: 5px 10px; font-size: 11px; background: #12b7f5; color: #fff; text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; font-weight: 500; white-space: nowrap;">
                    <span>一键加群</span>
                    <cgo-icon name="chevron-right" size="10"></cgo-icon>
                </a>
            </div>
            <div class="help-data-info" style="margin-top: 12px;">
                <strong>城市数据与主理人：</strong><br>
                当前展示城市：${cityName}<br>
                ${maintainersHtml}<br><br>
                <strong>技术架构信息：</strong><br>
                网页开发：NaL & Ryan · 地理坐标来源：高德开放平台<br>
                开源协议：GNU AGPLv3（代码）/ ODbL 1.0（数据）<br>
            </div>
            <div style="text-align: center; font-size: 11px; color: var(--text-light); margin-top: 12px; margin-bottom: 4px; font-family: var(--font-sans);">
                引擎版本 v${appVersionText} · 双轨开源平台
            </div>
        `;

        if (window.CGO?.showHelpModal) {
            CGO.showHelpModal({
                title: 'CGo OpenMap',
                subtitle: '🍈线路图开放平台 2026.9🍊',
                iconPath: './assets/icons/mapicon.png',
                branding: {
                    copyright: 'Copyright © 2026 Central Go',
                    links: [],
                    beianPath: './assets/icons/beian.png',
                    beianAlt: '备案图标'
                },
                content: modalContent,
                hideTheme: true
            });
        } else {
            console.error("CGO.showHelpModal is not defined.");
        }
    });
});