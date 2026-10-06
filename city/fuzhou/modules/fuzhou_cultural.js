/**
 * CGo OpenMap - 福州城市专属模块：历史文化与名胜指引
 * (city/fuzhou/modules/fuzhou_cultural.js)
 *
 * 数据源：data_attractions.js 的 FUZHOU_ATTRACTIONS。
 *
 * **卡片只挂在有 A 级景区或大型公园的车站上** —— 判定依据是数据里的 `tier` 字段
 * （"5A" / "4A" / "3A" / "公园"，见该文件头部），**不给每座车站都硬加指引**。
 * 没有 tier 条目的车站不出卡片。当前生效的有：东街口（三坊七巷 5A）、
 * 南门兜（于山 4A）、鼓山（鼓山·涌泉寺 4A）。
 *
 * 卡片内容：该站 A 级景区 / 大型公园的清单，每条给出评级、简介与直线距离，
 * 点任意一条即**飞跃并选中服务它的车站**（景点级「最近车站」查询）。
 *
 * 距离：建库时按坐标算好写在数据里的**直线距离**，卡片上明确标注「直线」，
 * 不与步行距离混淆。口径与「查找最近车站」一致。
 *
 * 挂载于「车站信息」选项卡（station-info），order 14，排在「车站空间示意图」之前。
 * 图标严格使用 CGoUI 矢量组件，禁用 Emoji。
 */

(function () {
    if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") return;

    /**
     * 只取**有评级**（tier）的景点，按它绑定的每个车站分别登记，站内按距离升序。
     * 这就是「只给 A 级以上景点或大型公园的车站加卡片」的落点：
     * 没有 tier 的景点再近也不出卡片。
     *
     * **不按距离过滤** —— 站名关系由城市指定，距离只作展示。
     * 有些景点要靠接驳才到得了（如鼓岭：鼓山站 B 口出站转旅游专线公交），
     * 直线距离动辄数公里，按距离设门槛会把这类正当关系误删。
     *
     * 一处景点可绑多个车站（见 data_attractions.js 的 stations 数组）——
     * 屏山与西门都对应左海公园、西湖公园，故两站的卡片上都会出现，
     * 且各自显示到本站的距离。
     */
    let cardIndex = null;
    function tieredByStation(stationId) {
        if (!cardIndex) {
            cardIndex = new Map();
            const list = (typeof FUZHOU_ATTRACTIONS !== "undefined" && Array.isArray(FUZHOU_ATTRACTIONS))
                ? FUZHOU_ATTRACTIONS : [];
            list.forEach((a) => {
                if (!a.tier) return;                                    // 无评级 → 不挂卡片
                (a.stations || []).forEach((s) => {
                    if (!s || !s.id || !Number.isFinite(s.meters)) return;
                    if (!cardIndex.has(s.id)) cardIndex.set(s.id, []);
                    // note 是**该绑定**的接驳说明（如「B 口出站乘坐…接驳环线」），
                    // 与景点简介分开存，故随绑定一起带出来
                    cardIndex.get(s.id).push({ attraction: a, meters: s.meters, note: s.note || "" });
                });
            });
            cardIndex.forEach((arr) => arr.sort((x, y) => x.meters - y.meters));
        }
        return (stationId && cardIndex.get(stationId)) || [];
    }

    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function formatMeters(m) {
        return m < 1000 ? `${Math.round(m)} 米` : `${(m / 1000).toFixed(1)} 公里`;
    }

    /** 点景点 → 选中并飞跃到服务它的车站 */
    function jumpToStation(stationId) {
        if (!stationId) return;
        if (typeof window.selectStation === "function") {
            window.selectStation(stationId, null, null, 0);
            return;
        }
        const node = document.getElementById(`node-${stationId}`)
            || document.querySelector(`.station[data-sid="${stationId}"]`);
        if (node) node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }

    if (!window.__fuzhouCulturalBound) {
        window.__fuzhouCulturalBound = true;
        // 委托到 document：卡片随车站切换反复重建，逐个绑定会失效
        document.addEventListener("click", (event) => {
            const btn = event.target?.closest?.("[data-fz-attraction-station]");
            if (!btn) return;
            event.preventDefault();
            jumpToStation(btn.getAttribute("data-fz-attraction-station"));
        });
    }

    function renderList(items, currentStationId) {
        return items.map(({ attraction: a, meters, note }) => {
            const bound = (a.stations || []).map((s) => s.id);
            const same = bound.length === 1 && bound[0] === currentStationId;
            return `
                <button type="button" data-fz-attraction-station="${esc(bound[0] || "")}"
                        title="${same ? "本站" : "前往服务该景点的车站"}"
                        style="display:flex; width:100%; gap:6px; padding:4px 0; border:0; background:none;
                               cursor:pointer; font:inherit; text-align:left; line-height:1.45;">
                    <span style="flex:0 0 auto; color:var(--primary-color, #006098); font-weight:700; font-size:10px;
                                 border:1px solid currentColor; border-radius:3px; padding:0 3px; height:14px; line-height:13px;">
                        ${esc(a.tier)}
                    </span>
                    <span style="flex:1 1 auto; min-width:0;">
                        <span style="display:block; color:var(--text-main); font-weight:600; font-size:12px;">
                            ${esc(a.name)}
                        </span>
                        <span style="display:block; color:var(--text-light); font-size:11px;">
                            ${esc(a.cn || "")}
                        </span>
                        ${note ? `<span style="display:flex; align-items:flex-start; gap:4px; margin-top:2px;
                                            color:var(--primary-color, #006098); font-size:11px;">
                            <cgo-icon name="bus" size="12" style="flex:0 0 auto; margin-top:1px;"></cgo-icon>
                            <span>${esc(note)}</span>
                        </span>` : ""}
                    </span>
                    <span style="flex:0 0 auto; color:var(--text-light); font-size:11px; white-space:nowrap;">
                        直线 ${formatMeters(meters)}
                    </span>
                </button>
            `;
        }).join("");
    }


    window.StationBoard.registerModule({
        id: "fuzhou-cultural-tip",
        name: "福州文化名胜指引",
        targetTab: "station-info",
        order: 14,
        enabled: true,

        shouldRender(context) {
            const station = context.station;
            return Boolean(station && tieredByStation(station.id).length);
        },

        render(context) {
            const station = context.station || {};
            const items = tieredByStation(station.id);
            if (!items.length) return "";

            return `
                <div class="fuzhou-cultural-tip-card" style="
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
                        <cgo-icon name="tourist" size="14" style="color: var(--primary-color, #0C2340);"></cgo-icon>
                        <span>历史文化与名胜指引</span>
                    </div>
                    ${renderList(items, station.id)}
                    <div style="font-size:10px; color:var(--text-light); margin-top:2px;">
                        直线距离（非步行距离）· 点景点即前往服务它的车站
                    </div>
                </div>
            `;
        }
    });
})();
