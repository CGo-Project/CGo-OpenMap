/**
 * CGo OpenMap - 北京城市专属自定义模块：历史文化与名胜古迹指引 (city/beijing/modules/beijing_cultural.js)
 * 
 * ==============================================================================
 * 模块设计示范 (Custom Module Best Practice Example)
 * ==============================================================================
 * 本模块为 CGo OpenMap 车站信息板模块注册化规范的官方模板示范：
 * 1. 使用 `window.StationBoard.registerModule` 进行模块注册；
 * 2. 挂载到 'station-info' (车站信息选项卡)，也可由城市主理人在 beijing.js 中覆写调整；
 * 3. 实现 `shouldRender` 精准筛选命中车站；
 * 4. 采用响应式设计与系统 CSS 变量，完美适配暗色/亮色主题。
 * ==============================================================================
 */

(function () {
    /**
     * 北京重点车站历史文化、地标与古迹名胜知识字典
     */
    const BEIJING_CULTURAL_TIPS = {
        "天安门东": "毗邻故宫博物院（午门）、中国国家博物馆、劳动人民文化宫（太庙）及菖蒲河公园。",
        "天安门西": "毗邻国家大剧院、中山公园（社稷坛），步行可达人民大会堂与西交民巷近代银行建筑群。",
        "前门": "直通正阳门城楼与箭楼、前门大街历史文化街区、大栅栏、中国铁道博物馆（正阳门展馆）。",
        "什刹海": "地处什刹海历史文化风貌保护区核心，近烟袋斜街、银锭桥、恭王府及钟鼓楼。",
        "天坛东门": "直达世界文化遗产【天坛公园】东门，便捷游览祈年殿、回音壁、圜丘坛及七星石。",
        "雍和宫": "直达北京现存规模最大的藏传佛教寺院【雍和宫】，毗邻北京孔庙与国子监博物馆、五道营胡同。",
        "圆明园": "直通清代大型皇家园林【圆明园遗址公园】（近南门），可游览正觉寺、长春园西洋楼与大水法遗址。",
        "颐和园": "通达世界文化遗产【颐和园】，近东宫门、十七孔桥、佛香阁、长廊与昆明湖。",
        "北海北": "直达北海公园北门（紧邻九龙壁、阐福寺、白塔），步行可至恭王府及什刹海前海景区。",
        "王府井": "北京著名百年商业金街，汇聚王府井百货大楼、王府井天主堂（东堂）及东华门故宫角楼景观。",
        "奥林匹克公园": "北京双奥核心景观带，近国家体育场（鸟巢）、国家游泳中心（水立方/冰立方）与中国共产党历史展览馆。",
        "首钢": "百年工业遗产向现代科技园区转型典范，近首钢滑雪大跳台、三高炉文博空间与群明湖风景区。",
        "南锣鼓巷": "北京最富声誉的传统胡同肌理保护区之一，保留了完整的元代棋盘式胡同格局，辐射中戏与帽儿胡同。",
        "东直门": "近东外东直门内簋街餐饮文化街，北京核心综合客运枢纽与首都机场线始发地。"
    };

    /**
     * 注册北京历史文化地标指引模块
     */
    function registerCulturalModule() {
        if (!window.StationBoard) {
            console.warn("[beijing_cultural] StationBoard 尚未加载，延迟等待注册...");
            setTimeout(registerCulturalModule, 50);
            return;
        }

        window.StationBoard.registerModule({
            id: 'beijing-cultural-tip',
            name: '北京文化名胜指引',
            targetTab: 'station-info', // 默认挂载于车站信息选项卡
            order: 15,                 // 排序在车站类型(10)之后，运营单位(20)之前
            enabled: true,

            /**
             * 仅当车站包含文化名胜词条或自定义 culturalTip 时渲染
             */
            shouldRender(context) {
                const station = context.station;
                if (!station) return false;
                const name = (station.cn || station.name || '').replace(/站$/, '');
                return Boolean(station.culturalTip || BEIJING_CULTURAL_TIPS[name] || BEIJING_CULTURAL_TIPS[station.cn]);
            },

            /**
             * 渲染文化指引卡片
             */
            render(context) {
                const station = context.station;
                const name = (station.cn || station.name || '').replace(/站$/, '');
                const tip = station.culturalTip || BEIJING_CULTURAL_TIPS[name] || BEIJING_CULTURAL_TIPS[station.cn] || '';

                return `
                    <div class="beijing-cultural-tip-card" style="
                        margin: 0 0 14px 0;
                        padding: 10px 12px;
                        background: var(--card-sub-bg, rgba(0, 0, 0, 0.03));
                        border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
                        border-left: 3px solid var(--primary-color, #1a73e8);
                        border-radius: 6px;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 12px;
                            font-weight: bold;
                            color: var(--text-main);
                        ">
                            <span style="font-size: 14px;">🏛️</span>
                            <span>历史文化与名胜指引</span>
                        </div>
                        <div style="
                            font-size: 12px;
                            color: var(--text-light);
                            line-height: 1.5;
                        ">
                            ${tip}
                        </div>
                    </div>
                `;
            }
        });

        console.log("[beijing_cultural] 北京历史文化名胜指引模块已成功挂载到 StationBoard。");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerCulturalModule, { once: true });
    } else {
        registerCulturalModule();
    }
})();
