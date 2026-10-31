/**
 * CGo OpenMap - 福州城市专属模块：机场联络提示
 * (city/fuzhou/modules/fuzhou_airport.js)
 *
 * 只挂在机场站（BE02）：两座航站楼的距离 / 步行时间与航司分工，走错要多绕 200m。
 * 挂在 station-info，order 16（排在文化名胜 14、车站空间 15 之后）。
 */

(function () {
    /* 机场联络数据：按车站 id 索引，距离为到出发大厅的步行距离（非直线） */
    const FUZHOU_AIRPORT_TIPS = {
        "BE02": {
            airport: "福州长乐国际机场",
            terminals: [
                { name: "1号航站楼", meters: 500, minutes: 6, airlines: "除厦门航空（MF）、河北航空（NS）、江西航空（RY）外所有国内航班" },
                { name: "2号航站楼", meters: 700, minutes: 9, airlines: "厦门航空（MF）、河北航空（NS）、江西航空（RY）及国际港澳台航班" }
            ]
        }
    };

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function renderTerminals(list) {
        return list.map((t) => `
            <div style="display:flex; flex-direction:column; gap:1px; padding:5px 0;
                        border-top:1px dashed var(--divider, rgba(0,0,0,0.08));">
                <div style="display:flex; align-items:baseline; gap:6px; flex-wrap:wrap;">
                    <span style="color:var(--text-main); font-weight:600; font-size:12px;">
                        ${esc(t.name)}出发大厅
                    </span>
                    <span style="display:inline-flex; align-items:center; gap:3px;
                                 color:var(--primary-color, #0C2340); font-size:11px;">
                        <cgo-icon name="walk" size="12" style="flex:0 0 auto;"></cgo-icon>
                        <span>约 ${esc(t.meters)} m · 步行约 ${esc(t.minutes)} 分钟</span>
                    </span>
                </div>
                <div style="color:var(--text-light); font-size:11px; line-height:1.5;">
                    办理：${esc(t.airlines)}
                </div>
            </div>
        `).join("");
    }

    window.StationBoard.registerModule({
        id: "fuzhou-airport-tip",
        name: "福州机场联络",
        targetTab: "station-info",
        order: 16,
        enabled: true,

        shouldRender(context) {
            const station = context.station;
            return Boolean(station && FUZHOU_AIRPORT_TIPS[station.id]);
        },

        render(context) {
            const station = context.station || {};
            const info = FUZHOU_AIRPORT_TIPS[station.id];
            if (!info) return "";

            return `
                <div class="fuzhou-airport-tip-card" style="
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
                        <cgo-icon name="plane" size="14" style="color: var(--primary-color, #0C2340);"></cgo-icon>
                        <span>机场联络</span>
                    </div>
                    <div style="color:var(--text-main); font-size:12px; line-height:1.5;">
                        本站可前往${esc(info.airport)}
                    </div>
                    ${renderTerminals(info.terminals)}
                    <div style="font-size:10px; color:var(--text-light); margin-top:2px;">
                        距离与时间为到各航站楼出发大厅的步行口径，供出行参考
                    </div>
                </div>
            `;
        }
    });
})();
