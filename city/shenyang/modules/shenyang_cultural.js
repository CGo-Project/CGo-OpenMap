/**
 * CGo OpenMap - 沈阳报站目的地指引模块
 *
 * 只展示已整理的报站提示目的地，不补充出口、距离或步行时间等未确认信息。
 * 外观为模块自带的 .sy-report-card（样式在同目录 style.css）：均匀细线框 + 填色，
 * 结构为「speaker 图标 + 报站正文」；排在「车站信息」选项卡最前，紧挨标签栏。
 */
(function () {
    const SHENYANG_DESTINATION_GUIDE = {
        "中科院金属所": ["北部战区总医院", "沈阳药科大学", "沈阳二中"],
        "万莲": ["小河沿早市"],
        "怀远门": ["沈阳故宫"],
        "皇寺路": ["老北市"],
        "合作街": ["胸科医院", "“九·一八”历史博物馆"],
        "蒲河路": ["盛京医院沈北院区"],
        "三好街": ["盛京医院南湖院区"],
        "滑翔": ["盛京医院滑翔院区"],
        "师范大学": ["辽宁古生物博物馆"],
        "人民广场": ["沈阳博物馆"],
        "市府大路": ["西塔"],
        "文官街": ["沈阳职业技术学院"]
    };

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    function getDestinations(station) {
        const stationName = String(station?.cn || "").trim();
        if (!stationName) return [];
        return SHENYANG_DESTINATION_GUIDE[stationName]
            || SHENYANG_DESTINATION_GUIDE[stationName.replace(/站$/, "")]
            || [];
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "shenyang-cultural-destinations",
            name: "沈阳报站目的地指引",
            targetTab: "station-info",
            // 1 = 排在「车站信息」选项卡最前，紧挨标签栏（内置的车站类型 / 运营单位分别占 10 / 20）
            order: 1,
            shouldRender({ station }) {
                return getDestinations(station).length > 0;
            },
            render({ station }) {
                const destinations = getDestinations(station);
                if (!destinations.length) return "";
                const destinationHtml = destinations
                    .map((destination) => escapeHtml(destination))
                    .join("、");

                return `
                    <div class="sy-report-card">
                        <cgo-icon name="speaker" size="14"></cgo-icon>
                        <div class="sy-report-text">去往<strong>${destinationHtml}</strong>的乘客，请从该站下车</div>
                    </div>
                `;
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-cultural-destinations" }
    }));
})();
