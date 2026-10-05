/**
 * CGo OpenMap - 北京城市专属自定义模块：历史文化与名胜古迹指引 (city/shijiazhuang/modules/shijiazhuang_cultural.js)
 * 
 * ==============================================================================
 */

(function () {
    const TIPS = {
        "北国商城": "近石家庄万象城、北国商城购物中心。",
        "博物院": "直达河北博物院，近石家庄市博物馆。",
        "体育场": "近裕彤国际体育中心。",
        "园博园": "直达河北正定园博园。",
        "石家庄站": "石家庄铁路枢纽，京广铁路、石济客专交汇。",
        "石家庄东站": "石济客专主要停靠站。"
    };
    function register() {
        if (!window.StationBoard) { setTimeout(register, 50); return; }
        window.StationBoard.registerModule({
            id: 'shijiazhuang-cultural-tip',
            name: '石家庄文化指引',
            targetTab: 'station-info',
            order: 15,
            enabled: true,
            shouldRender(ctx) {
                const s = ctx.station;
                if (!s) return false;
                const n = (s.cn || s.name || '').replace(/站$/, '');
                return Boolean(s.culturalTip || TIPS[n] || TIPS[s.cn]);
            },
            render(ctx) {
                const s = ctx.station;
                const n = (s.cn || s.name || '').replace(/站$/, '');
                const tip = s.culturalTip || TIPS[n] || TIPS[s.cn] || '';
                return `
                    <div class="shijiazhuang-cultural-tip-card" style="margin:0 0 14px 0;padding:10px 12px;background:var(--card-sub-bg,rgba(0,0,0,.03));border:1px solid var(--border-color,rgba(0,0,0,.08));border-left:3px solid var(--primary-color,#1a73e8);border-radius:6px;">
                        <div style="font-size:12px;font-weight:bold;color:var(--text-main);margin-bottom:4px;">历史文化与名胜指引</div>
                        <div style="font-size:12px;color:var(--text-light);line-height:1.5;">${tip}</div>
                    </div>`;
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register, { once: true });
    else register();
})();

