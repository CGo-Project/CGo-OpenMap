/**
 * CGo OpenMap - 兰州城市专属模块：出行指引
 * (city/lanzhou/modules/lanzhou_travel_guide.js)
 *
 * 版式要求：
 *   - 挂载于「车站信息」选项卡，且排在最上方（order 5，先于 station-type(10) / operators(20)）；
 *   - 方框圈起整块指引内容；
 *   - 第一行「出行指引」加粗，颜色 #19A7FD，字号与「车站类型」「运营单位」保持一致（13px）；
 *   - 第二行为具体出口指引文本，词条内的逗号统一渲染为换行。
 *
 * 仅收录站名本身即可对应出口地标的站点；未命中词条的车站不渲染该模块。
 */

(function () {
    const LANZHOU_TRAVEL_GUIDE = {
        "兰州火车站": "A出口可达兰州客运中心",
        "东岗": "B出口可达兰州汽车东站，C出口可达轨道·城市曙光",
        "西关": "B出口步行约700米可达中山桥，B出口步行约1.2km可达白塔山公园，D出口可达张掖路步行街",
        "西站什字": "A出口步行约400米甘肃省博物馆",
        "兰州城市学院（省科技馆）": "A出口步行约200米甘肃省科技馆",
        "小西湖": "A出口步行约200米可达小西湖公园，A出口步行约800米可达黄河母亲雕塑",
        "马滩": "A出口步行约800米可达甘肃简牍博物馆，D出口步行约1km可达兰州老街",
        "奥体中心": "C出口步行约800米可达兰州奥体中心"
    };

    /**
     * 解析车站对应的出行指引文本：
     * 1. 优先读取车站对象上的 guideTip / travelGuide 字段（逐站覆写）；
     * 2. 其次按站名整名匹配；
     * 3. 最后按去掉末尾「站」字的站名匹配。
     */
    function findGuide(station) {
        if (!station) return "";
        if (station.guideTip) return station.guideTip;
        if (station.travelGuide) return station.travelGuide;

        const raw = station.cn || station.name || "";
        if (!raw) return "";
        return LANZHOU_TRAVEL_GUIDE[raw] || LANZHOU_TRAVEL_GUIDE[raw.replace(/站$/, "")] || "";
    }

    function registerTravelGuideModule() {
        if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") {
            console.warn("[lanzhou_travel_guide] StationBoard 尚未加载，延迟等待注册...");
            setTimeout(registerTravelGuideModule, 50);
            return;
        }

        window.StationBoard.registerModule({
            id: "lanzhou-travel-guide",
            name: "出行指引",
            targetTab: "station-info", // 挂载于「车站信息」选项卡
            order: 5,                  // 排在最上方（先于车站类型 10、运营单位 20）
            enabled: true,

            shouldRender(context) {
                return Boolean(findGuide(context.station));
            },

            render(context) {
                const guide = findGuide(context.station);
                if (!guide) return "";

                // 词条内的中英文逗号统一转为换行（保留原文措辞，仅改分行）
                const guideLines = String(guide)
                    .split(/[，,]\s*/)
                    .map(line => line.trim())
                    .filter(Boolean)
                    .join("<br>");

                return `
                    <div class="lanzhou-travel-guide-card" style="
                        margin: 0 0 14px 0;
                        padding: 10px 12px;
                        background: var(--card-sub-bg, rgba(0, 0, 0, 0.03));
                        border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
                        border-radius: 6px;
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        box-sizing: border-box;
                    ">
                        <div style="
                            font-size: 13px;
                            font-weight: bold;
                            color: #19A7FD;
                            line-height: 1.5;
                        ">出行指引</div>
                        <div style="
                            font-size: 12px;
                            color: var(--text-main);
                            line-height: 1.6;
                            word-break: break-word;
                        ">${guideLines}</div>
                    </div>
                `;
            }
        });

        console.log("[lanzhou_travel_guide] 兰州出行指引模块已成功挂载到 StationBoard。");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", registerTravelGuideModule, { once: true });
    } else {
        registerTravelGuideModule();
    }
})();
