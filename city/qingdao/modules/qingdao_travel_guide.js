/**
 * CGo OpenMap - 青岛出行指引
 *
 * 结构与视觉复用北京文化名胜指引模块：StationBoard station-info + location 图标 + 同款提示卡。
 * 数据范围对应青岛线网图 data_scattered.js 中现有的交通换乘图标。
 */
(function () {
    const QINGDAO_TRAVEL_TIPS = {
        "M0322": "可去往铁路青岛站",
        "M0301": "可去往铁路青岛北站",
        "M0805": "可去往铁路红岛站",
        "M0801": "可去往铁路胶州北站",
        "M1323": "可去往铁路董家口站",
        "M0802": "可去往青岛胶东国际机场、铁路青岛机场站",
        "M0214": "可去往青岛汽车东站",
        "M0719": "可去往青岛汽车北站",
        "M0121": "可去往青岛长途汽车站",
        "M0139": "可去往西海岸汽车东站",
        "M1311": "可去往西海岸汽车总站",
        "M0231": "可去往青岛邮轮母港客运中心",
        "M0714": "可去往青岛有轨电车示范线农业大学站"
    };

    function registerTravelGuideModule() {
        if (!window.StationBoard) {
            setTimeout(registerTravelGuideModule, 50);
            return;
        }

        window.StationBoard.registerModule({
            id: "qingdao-travel-guide",
            name: "青岛出行指引",
            targetTab: "station-info",
            order: 14,
            enabled: true,

            shouldRender(context) {
                const station = context.station;
                return Boolean(station && (station.travelTip || QINGDAO_TRAVEL_TIPS[station.id]));
            },

            render(context) {
                const station = context.station;
                const tip = station.travelTip || QINGDAO_TRAVEL_TIPS[station.id] || "";
                const hasNameHistory = Boolean(
                    station?.id
                    && window.QINGDAO_STATION_NAME_HISTORY?.[station.id]?.rows?.length
                );
                const dividerStyle = hasNameHistory
                    ? "padding-bottom:10px; margin-bottom:10px; border-bottom:1px dashed var(--divider);"
                    : "margin-bottom:14px;";

                return `
                    <div data-qingdao-travel-guide style="${dividerStyle}">
                        <div class="qingdao-travel-guide-card" style="
                            margin: 0;
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
                                <cgo-icon name="location" size="14" style="color: var(--primary-color, #1a73e8);"></cgo-icon>
                                <span>出行指引</span>
                            </div>
                            <div style="
                                font-size: 12px;
                                color: var(--text-light);
                                line-height: 1.5;
                            ">${tip}</div>
                        </div>
                    </div>
                `;
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", registerTravelGuideModule, { once: true });
    } else {
        registerTravelGuideModule();
    }
})();
