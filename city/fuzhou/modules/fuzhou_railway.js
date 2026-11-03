/**
 * CGo OpenMap - 福州城市专属模块：国铁联络提示
 * (city/fuzhou/modules/fuzhou_railway.js)
 *
 * 只挂在有国铁接驳的三站：福州火车站(M104→福州站)、福州火车南站(M121→福州南站)、
 * 首占(BE06→长乐站)。地铁站名与国铁站名不一致，故卡片把两套名称对上并给 12306 查票入口。
 * 挂在 station-info，order 17（紧随机场联络 16）。
 */

(function () {
    /* 国铁联络表：键为地铁站 id，查票链接按国铁站名即时生成 */
    const FUZHOU_RAILWAY_TIPS = {
        "M104": { rail: "福州站", note: "1 号线 / 滨海快线换乘枢纽" },
        "M121": { rail: "福州南站", note: "1 号线 / 5 号线换乘枢纽" },
        "BE06": { rail: "长乐站", note: "福平铁路；滨海快线首占站旁" }
    };

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    /** 12306 余票查询（与北京同口径：只带出发站名，链接仅作跳转） */
    function rail12306Url(railName) {
        return "https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs="
            + encodeURIComponent(String(railName).replace(/站$/, ""));
    }

    window.StationBoard.registerModule({
        id: "fuzhou-railway-tip",
        name: "福州国铁联络",
        targetTab: "station-info",
        order: 17,
        enabled: true,

        shouldRender(context) {
            const station = context.station;
            return Boolean(station && FUZHOU_RAILWAY_TIPS[station.id]);
        },

        render(context) {
            const station = context.station || {};
            const tip = FUZHOU_RAILWAY_TIPS[station.id];
            if (!tip) return "";

            return `
                <div class="fuzhou-railway-tip-card" style="
                    margin: 0 0 14px 0;
                    padding: 10px 12px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
                    border-left: 3px solid var(--primary-color, #0C2340);
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
                        <cgo-icon name="railway" size="14" style="color: var(--primary-color, #0C2340);"></cgo-icon>
                        <span>国铁联络</span>
                    </div>
                    <div style="color:var(--text-main); font-size:12px; line-height:1.5;">
                        本站可前往国铁${esc(tip.rail)}
                    </div>
                    ${tip.note ? `<div style="color:var(--text-light); font-size:11px; line-height:1.5;">
                        ${esc(tip.note)}
                    </div>` : ""}
                    <a href="${esc(rail12306Url(tip.rail))}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-flex; align-items:center; gap:4px; align-self:flex-start;
                              color:var(--primary-color, #0C2340); font-size:11px; text-decoration:none;">
                        <cgo-icon name="external" size="12" style="flex:0 0 auto;"></cgo-icon>
                        <span>12306 余票查询</span>
                    </a>
                    <div style="font-size:10px; color:var(--text-light); margin-top:2px;">
                        票务服务由铁路 12306 提供，本站仅作跳转
                    </div>
                </div>
            `;
        }
    });
})();
