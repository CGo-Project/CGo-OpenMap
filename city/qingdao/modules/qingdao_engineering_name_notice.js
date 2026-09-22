/**
 * 青岛车站信息板：工程暂用站名提示
 * 约定：工程阶段暂用英文站名在 data_stations.js 中以全大写拼音标识。
 */
(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    function isAllCapsEngineeringName(en) {
        if (!en) return false;

        // 去除 <br> 等 HTML，仅判断英文字符本身。
        const plain = String(en).replace(/<[^>]*>/g, " ");
        const letters = Array.from(plain).filter((ch) => /[A-Za-z]/.test(ch)).join("");

        return Boolean(letters) && letters === letters.toUpperCase();
    }

    window.StationBoard.registerModule({
        id: "qingdao-engineering-name-notice",
        name: "工程站名提示",
        targetTab: "line-tab",
        order: 21,

        shouldRender(context) {
            const station = context.station || {};
            return station.type === "no" && isAllCapsEngineeringName(station.en);
        },

        render() {
            return `
                <div class="info-row" data-qingdao-engineering-name-notice-version="62">
                    <span class="info-label">提示</span>
                    <span class="info-value" style="
                        line-height:1.5;
                        text-align:left;
                        white-space:normal;
                    ">本站站名为工程暂用名，英文名称暂按汉语拼音转写，正式站名以官方公布为准。</span>
                </div>
            `;
        }
    });

    console.log("[QingdaoEngineeringNameNotice] v62 loaded");
})();
