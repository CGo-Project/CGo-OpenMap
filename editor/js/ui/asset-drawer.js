/**
 * 开放地图编辑器 (OpenMap Editor) - 轨交资产零件盒 (Transit Asset Drawer)
 * 提供现代化所见即所得的轨交专用图元资产抽屉：
 * 1. 车站与换乘图元：普通圆点、同心圆换乘、水平/垂直/斜向跑道圆胶囊、哑铃双联连杆；
 * 2. 综合交通设施徽标 (Amenities)：民航机场、高铁、国铁、轮渡客运、磁浮、有轨电车、P+R 停车、无障碍；
 * 3. 车站编号胶囊 (Station Codes)：标准线路色圆角数字徽标；
 * 4. 出版制图要素 (Carto Elements)：测绘矢量指北针、标准图例卡、测绘标题图框；
 * 5. 双模交互：若画布已选中车站，直接应用图元/挂载设施；若未选中，进入「落子放置模式 (Stamp Mode)」。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.AssetDrawer = (function () {
    'use strict';

    /**
     * 交通设施徽标：优先用 core/station-icons.js 的矢量徽标（与线路图站名旁的徽标同一份），
     * CGoUI 图标库里没有轮渡、P+R 等语义的图标。
     */
    function amenityGlyph(am) {
        var lib = window.CGoStationIcons && window.CGoStationIcons.AMENITY_ICONS;
        if (lib && lib[am.id]) return '<span class="amenity-glyph" aria-hidden="true">' + lib[am.id] + '</span>';
        return '<cgo-icon name="' + am.icon + '" size="14"></cgo-icon>';
    }

    var dom = {
        container: null,
        tabOutlineBtn: null,
        tabAssetsBtn: null,
        outlineContainer: null
    };

    var callbacks = {
        onApplyToSelected: null,  // function(type, payload)
        onEnterStampMode: null,   // function(assetType, payload)
        onExitStampMode: null     // function()
    };

    var currentStamp = null; // 当前落子模式模板

    /**
     * 资产项配置清单
     */
    var ASSET_DEFINITIONS = {
        stations: [
            { id: 'dot', label: '普通圆点', type: 'station', glyph: 'dot', icon: 'dot', desc: '单线常规经停车站' },
            { id: 'tsf', label: '双圈换乘', type: 'station', glyph: 'tsf', icon: 'transfer', desc: '标准同心圆两线换乘' },
            { id: 'tsf_pill_h', label: '水平胶囊', type: 'station', glyph: 'tsf_pill_h', icon: 'flip-h', desc: '水平跑道圆多线换乘' },
            { id: 'tsf_pill_v', label: '垂直胶囊', type: 'station', glyph: 'tsf_pill_v', icon: 'flip-v', desc: '垂直跑道圆多线换乘' },
            { id: 'tsf_pill_d45', label: '45°斜向胶囊', type: 'station', glyph: 'tsf_pill_d45', icon: 'design', desc: '45度倾斜跑道圆换乘' },
            { id: 'tsf_pill_d135', label: '135°斜向胶囊', type: 'station', glyph: 'tsf_pill_d135', icon: 'design', desc: '135度倾斜跑道圆换乘' },
            { id: 'tsf_dumbbell', label: '双联哑铃', type: 'station', glyph: 'tsf_dumbbell', icon: 'route', desc: '长通道/大厅双圆连杆换乘' },
            { id: 'rdot', label: '国铁枢纽', type: 'station', glyph: 'rdot', icon: 'railway', desc: '接入国家铁路客运特大站' },
            { id: 'no', label: '暂缓开通', type: 'station', glyph: 'no', icon: 'warning', desc: '在建或规划暂未开通站' }
        ],
        amenities: [
            { id: 'airport', label: '民航机场', tag: 'AIR', icon: 'plane', desc: '接驳民航客运航站楼' },
            { id: 'crh', label: '高速铁路', tag: 'CRH', icon: 'crh', desc: '接驳国家高速动车组' },
            { id: 'railway', label: '国家铁路', tag: 'RWY', icon: 'railway', desc: '接驳普速旅客列车' },
            { id: 'ferry', label: '客运轮渡', tag: 'SEA', icon: 'ferry', desc: '接驳水上客运码头' },
            { id: 'maglev', label: '磁悬浮专线', tag: 'MAG', icon: 'monorail', desc: '接驳磁悬浮快速列车' },
            { id: 'tram', label: '有轨电车', tag: 'TRM', icon: 'tram', desc: '接驳地面现代有轨电车' },
            { id: 'pr', label: 'P+R 停车', tag: 'P+R', icon: 'pr', desc: '具备驻车换乘停车场' },
            { id: 'accessible', label: '无障碍垂梯', tag: 'ACC', icon: 'elevator', desc: '具备无障碍直通设施' }
        ],
        carto: [
            { id: 'north_arrow', label: '测绘指北针', kind: 'scattered', icon: 'north', desc: '专业测绘标准指北针图元' },
            { id: 'map_legend', label: '动态图例卡', kind: 'layout', icon: 'layer', desc: '根据当前线网自动排版的图例卡' },
            { id: 'title_block', label: '标准标题框', kind: 'layout', icon: 'bookmark', desc: '包含城市徽标与版次的标准标题图框' }
        ]
    };

    function init(containerEl, outlineEl, options) {
        dom.container = containerEl;
        dom.outlineContainer = outlineEl;
        var opt = options || {};
        callbacks.onApplyToSelected = opt.onApplyToSelected;
        callbacks.onEnterStampMode = opt.onEnterStampMode;
        callbacks.onExitStampMode = opt.onExitStampMode;

        bindTabSwitchers();
        renderDrawer();
    }

    function bindTabSwitchers() {
        dom.tabOutlineBtn = document.getElementById('tabNavOutline');
        dom.tabAssetsBtn = document.getElementById('tabNavAssets');

        if (dom.tabOutlineBtn && dom.tabAssetsBtn) {
            dom.tabOutlineBtn.addEventListener('click', function () {
                switchTab('outline');
            });
            dom.tabAssetsBtn.addEventListener('click', function () {
                switchTab('assets');
            });
        }
    }

    function switchTab(target) {
        if (!dom.tabOutlineBtn || !dom.tabAssetsBtn) return;
        if (target === 'assets') {
            dom.tabOutlineBtn.classList.remove('active');
            dom.tabAssetsBtn.classList.add('active');
            if (dom.outlineContainer) dom.outlineContainer.style.display = 'none';
            if (dom.container) dom.container.style.display = 'block';
        } else {
            dom.tabAssetsBtn.classList.remove('active');
            dom.tabOutlineBtn.classList.add('active');
            if (dom.container) dom.container.style.display = 'none';
            if (dom.outlineContainer) dom.outlineContainer.style.display = 'block';
        }
    }

    function renderDrawer() {
        if (!dom.container) return;

        var html = '<div class="asset-drawer-shell" style="padding: 8px 6px;">';

        // 提示横幅
        html += '<div class="asset-drawer-hint" style="background:var(--theme-subtle, rgba(2,132,199,0.08));border:1px solid var(--theme-border, rgba(2,132,199,0.2));border-radius:6px;padding:6px 8px;margin-bottom:10px;font-size:11px;color:var(--text-color, #334155);line-height:1.4;">' +
            '<div style="font-weight:600;display:flex;align-items:center;gap:4px;margin-bottom:2px;color:var(--theme-accent, #0284c7);">' +
            '<cgo-icon name="preset" size="12"></cgo-icon><span>轨交图元零件盒</span>' +
            '</div>' +
            '<span>选中车站点击可直接赋予样式；未选中时点击激活「落子模式」，在画布任意坐标落子。</span>' +
            '</div>';

        // 分组一：车站与换乘图元
        html += '<div class="asset-group-section" style="margin-bottom:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-light, #64748b);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
            '<span>车站与换乘图元</span>' +
            '<span class="cgo-badge" style="font-size:9px;">' + stationAssets().length + ' 种</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:5px;">';

        stationAssets().forEach(function (st) {
            html += '<button type="button" class="asset-tile-btn" data-category="station" data-id="' + st.id + '" data-glyph="' + st.glyph + '" title="' + st.label + ' (' + st.glyph + ')\n' + st.desc + '" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;border:1px solid var(--border-light, rgba(0,0,0,0.08));background:var(--card-bg, #ffffff);border-radius:6px;cursor:pointer;gap:4px;transition:all 0.15s;">' +
                stationAssetPreview(st.glyph) +
                '<span style="font-size:10px;font-weight:500;color:var(--text-color, #334155);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">' + st.label + '</span>' +
                '</button>';
        });

        html += '</div></div>';

        // 分组一点五：本城市现有样式（从已载入城市的全部车站自动提取，含逐站官方图元）
        var cityStyles = cityStyleAssets();
        if (cityStyles.length) {
            html += '<div class="asset-group-section" style="margin-bottom:12px;">' +
                '<div style="font-size:11px;font-weight:700;color:var(--text-light, #64748b);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
                '<span>本城市现有样式</span>' +
                '<span class="cgo-badge" style="font-size:9px;">' + cityStyles.length + ' 种</span>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:5px;">';
            cityStyles.forEach(function (cs) {
                var title = (cs.label + '\n' + cs.desc).replace(/"/g, '&quot;');
                html += '<button type="button" class="asset-tile-btn" data-category="station" data-id="' + cs.key + '" data-glyph="' + (cs.patch.type || 'dot') + '" data-style="' + cs.key + '" title="' + title + '" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;border:1px solid var(--border-light, rgba(0,0,0,0.08));background:var(--card-bg, #ffffff);border-radius:6px;cursor:pointer;gap:4px;transition:all 0.15s;">' +
                    stationAssetPreview(cs.patch.type || 'dot', cs.patch) +
                    '<span style="font-size:10px;font-weight:500;color:var(--text-color, #334155);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">' + cs.label + '</span>' +
                    '</button>';
            });
            html += '</div></div>';
        }

        // 分组二：综合交通枢纽设施徽标
        html += '<div class="asset-group-section" style="margin-bottom:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-light, #64748b);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
            '<span>交通枢纽设施徽标</span>' +
            '<span class="cgo-badge" style="font-size:9px;">' + ASSET_DEFINITIONS.amenities.length + ' 类</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:5px;">';

        ASSET_DEFINITIONS.amenities.forEach(function (am) {
            html += '<button type="button" class="asset-tile-btn" data-category="amenity" data-id="' + am.id + '" title="' + am.label + '\n' + am.desc + '" style="display:flex;align-items:center;padding:6px 8px;border:1px solid var(--border-light, rgba(0,0,0,0.08));background:var(--card-bg, #ffffff);border-radius:6px;cursor:pointer;gap:6px;transition:all 0.15s;">' +
                '<div style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;color:var(--theme-accent, #0284c7);flex-shrink:0;">' +
                amenityGlyph(am) +
                '</div>' +
                '<div style="display:flex;flex-direction:column;min-width:0;text-align:left;">' +
                '<span style="font-size:11px;font-weight:500;color:var(--text-color, #334155);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + am.label + '</span>' +
                '<span style="font-size:9px;color:var(--text-light, #94a3b8);">' + am.tag + '</span>' +
                '</div>' +
                '</button>';
        });

        html += '</div></div>';

        // 分组三：车站编号胶囊快捷放样
        html += '<div class="asset-group-section" style="margin-bottom:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-light, #64748b);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
            '<span>车站编号徽标 (Station Code)</span>' +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">';

        var sampleCodes = ['01', '02', '1-05', 'M01', 'A12', 'S1-01'];
        sampleCodes.forEach(function (code) {
            html += '<button type="button" class="asset-code-btn" data-code="' + code + '" title="填入车站编号: ' + code + '" style="background:#0284c7;color:#fff;border:none;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.2);">' +
                code + '</button>';
        });

        html += '</div></div>';

        // 分组四：地图制图出版要素
        html += '<div class="asset-group-section">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-light, #64748b);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">' +
            '<span>制图出版要素</span>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:5px;">';

        ASSET_DEFINITIONS.carto.forEach(function (c) {
            html += '<button type="button" class="asset-tile-btn" data-category="carto" data-id="' + c.id + '" title="' + c.desc + '" style="display:flex;align-items:center;padding:6px 8px;border:1px solid var(--border-light, rgba(0,0,0,0.08));background:var(--card-bg, #ffffff);border-radius:6px;cursor:pointer;gap:6px;transition:all 0.15s;">' +
                '<cgo-icon name="' + c.icon + '" size="14" style="color:var(--theme-accent, #0284c7);"></cgo-icon>' +
                '<div style="display:flex;flex-direction:column;text-align:left;min-width:0;">' +
                '<span style="font-size:11px;font-weight:600;color:var(--text-color, #1e293b);">' + c.label + '</span>' +
                '<span style="font-size:9.5px;color:var(--text-light, #64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + c.desc + '</span>' +
                '</div>' +
                '</button>';
        });

        html += '</div></div>';
        html += '</div>';

        dom.container.innerHTML = html;
        bindTileEvents();
    }

    /** 通用车站图元：任何城市都全部提供（不按城市裁剪，选择权交给使用者） */
    function stationAssets() {
        return ASSET_DEFINITIONS.stations;
    }

    /** 本城市现有样式（从当前工程全部车站提取，见 StationStyleCatalog.harvest），key → 外观补丁 */
    var harvestedPatches = {};
    function cityStyleAssets() {
        var cat = window.OpenMapEditor.StationStyleCatalog;
        var app = window.OpenMapEditor._getApp ? window.OpenMapEditor._getApp() : null;
        if (!cat || !app || !app.project) return [];
        var rt = window.OpenMapEditor.CityRenderRuntime;
        var fields = cat.fieldsFor(rt && rt.getCity ? rt.getCity() : null);
        harvestedPatches = {};
        return cat.harvest(app.project, fields).slice(0, 18).map(function (h, i) {
            var key = 'h' + i;
            harvestedPatches[key] = h.patch;
            return { key: key, label: h.name, desc: (h.detail ? h.detail + ' · ' : '') + h.count + ' 座 · 例：' + h.sampleName, patch: h.patch };
        });
    }

    function patchFor(key) {
        return harvestedPatches[key] || null;
    }

    /** 零件盒里的图元小样：按当前城市画法生成（与检视面板的类型选择器同一套） */
    function stationAssetPreview(type, patch) {
        var layer = window.OpenMapEditor.StationLayer;
        if (layer && typeof layer.previewTileHtml === 'function') {
            var color = '#0284c7';
            var app = window.OpenMapEditor._getApp ? window.OpenMapEditor._getApp() : null;
            var lines = app && app.project && app.project.lines;
            if (lines && lines.length) {
                var active = lines.filter(function (l) { return l.id === app.activeLineId; })[0] || lines[0];
                if (active && active.color) color = active.color;
            }
            // 小样车站放在远离线网的位置：城市钩子推断朝向时不会吸附到真实线路上
            var st = Object.assign({ x: -1e6, y: -1e6 }, patch || {}, { lineColors: [color] });
            st.type = (patch && patch.type) || type;
            Object.keys(st).forEach(function (k) { if (st[k] === undefined) delete st[k]; });
            return layer.previewTileHtml(st, { id: '__asset_' + type });
        }
        return '<div style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;">' +
            getStationGlyphPreviewSvg(type) + '</div>';
    }

    /** 城市渲染钩子就绪 / 切换城市 / 切换主题后重画零件盒 */
    function refresh() {
        if (!dom.container) return;
        renderDrawer();
        bindTileEvents();
    }

    /**
     * 生成车站图元的精简矢量预览 SVG
     */
    function getStationGlyphPreviewSvg(glyph) {
        var engine = window.CGoStationIcons;
        if (engine && engine.SVGTemplates && engine.SVGTemplates[glyph]) {
            var raw = engine.SVGTemplates[glyph].replace('{{COLOR}}', '#0284c7');
            return raw.replace('<svg', '<svg width="24" height="20" style="display:block;max-width:100%;max-height:100%;"');
        }
        return '<svg viewBox="0 0 10 10" width="10" height="10"><circle cx="5" cy="5" r="4" fill="#0284c7"/></svg>';
    }

    function bindTileEvents() {
        if (!dom.container) return;

        dom.container.querySelectorAll('.asset-tile-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var cat = this.getAttribute('data-category');
                var id = this.getAttribute('data-id');
                var glyph = this.getAttribute('data-glyph');

                // 移除其他激活态
                dom.container.querySelectorAll('.asset-tile-btn').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');

                if (typeof callbacks.onEnterStampMode === 'function') {
                    var styleKey = this.getAttribute('data-style');
                    var payload = { id: id, glyph: glyph };
                    if (cat === 'station') {
                        // 通用图元：去掉城市逐站外观字段、只留类型；本城市样式：整组外观字段
                        var cat2 = window.OpenMapEditor.StationStyleCatalog;
                        if (styleKey && patchFor(styleKey)) payload.patch = patchFor(styleKey);
                        else if (cat2) {
                            var g = cat2.genericOptions().filter(function (o) { return o.patch.type === glyph; })[0];
                            if (g) payload.patch = g.patch;
                        }
                    }
                    callbacks.onEnterStampMode(cat, payload);
                }
            });
        });

        dom.container.querySelectorAll('.asset-code-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var code = this.getAttribute('data-code');
                if (typeof callbacks.onApplyToSelected === 'function') {
                    callbacks.onApplyToSelected('code', code);
                }
            });
        });
    }

    function clearActiveSelection() {
        if (!dom.container) return;
        dom.container.querySelectorAll('.asset-tile-btn').forEach(function (b) {
            b.classList.remove('active');
        });
    }

    return {
        init: init,
        refresh: refresh,
        switchTab: switchTab,
        clearActiveSelection: clearActiveSelection,
        ASSET_DEFINITIONS: ASSET_DEFINITIONS
    };
})();

// 全局别名兼容
window.AssetDrawer = window.OpenMapEditor.AssetDrawer;

