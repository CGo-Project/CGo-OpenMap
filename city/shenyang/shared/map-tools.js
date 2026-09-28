/**
 * CGo OpenMap - 地图小工具（共享层）
 *
 * ⚠️ 临时共享位置：与 route-panel.js、nearest-station.js 等同处 city/shenyang/shared/，
 * 计划随共享层整体迁入 core/。
 *
 * 入口是浮动缩放控制条上「查找最近车站」按钮下方的 plugin 按钮：点开是工具列表浮层
 * （与结果小窗同一套外观，不用 cgo-modal），内含两个分析工具：
 *
 *   1. 票价图（payment）：选一个车站，看从该站出发到全网各站的票价；
 *   2. 等时圈（time）：选一个车站，看乘地铁多少分钟能到各站。
 *
 * 两者共用同一条链路：**选站 → 计算 → 分层设色 → 图上叠加 → 图例**。
 *
 * 计算完全复用共享层的行程规划内核（route-data 建图 + route-planner 按「时间最快」寻路），
 * 不对城市新增任何配置字段：票价直接取 plan() 结算出的 fare，用时取 minutes。
 * 因此城市改票价规则、增删车站、拆计费系统都不必动本文件；没配 fare 的城市
 * 只是票价图不可用（面板会明说），等时圈照常。
 *
 * 分层设色的三段式（缺一不可，见各函数注释）：
 *   ① 值场：在低分辨率上逐像素做**反距离加权（IDW）**得到连续的值场 —— 不用「最近站点」
 *      硬分区，正是为了把相邻色块融成一片、边界是平滑等值线而不是多边形棱角。
 *      加权只取**固定支撑域**内的站点（半径 = 一个格网边长，权重在半径处归零），
 *      站点进出加权集合时值是连续的，不会沿网格线留下"方正"的接缝；顺带记下到最近
 *      站点的距离；
 *   ② 平滑：值场再过几遍 3×3 盒式，压掉站点附近被 IDW 顶起来的平台与台阶；
 *   ③ 输出：1:1 画布上双线性上采样 + 分档上色，并按**距离蒙版**让离车站很远处淡出
 *      （半透明 FILL_ALPHA 让底图透出）；跨等级处描白线（EDGE_ALPHA）、沿线上撒等级
 *      数值标签，标签会避让站点 / 站名 / 线路。
 *
 * 覆盖范围比画布大 COVER_SCALE 倍（以画布中心对齐向外扩），缩小时视口不会露出没上色的
 * 空白；画布之外没有站点，靠 IDW 外推的值自然把色带延展出去。
 *
 * 悬停读数不占用画布的指针事件（画布 pointer-events: none，地图照常拖动缩放）：
 * 监听挂在地图容器上，用 #map-content 的实测矩形把屏幕坐标反算回画布坐标后查值场。
 *
 * @event cgo:map-tools-opened   { tool }
 * @event cgo:map-tools-picking  { tool }
 * @event cgo:map-tools-picked   { tool, stationId, stationName }
 * @event cgo:map-tools-rendered { tool, stationId, stationName, stations, min, max, ms }
 * @event cgo:map-tools-closed   { tool }
 */
(function () {
    "use strict";

    // 共享层可能被多个城市脚本各引一次，重复执行时只保留首份接管
    if (window.__cgoMapToolsBound) return;
    window.__cgoMapToolsBound = true;

    const MENU_ID = "cgo-map-tools-menu";
    const PANEL_ID = "cgo-map-tools-panel";
    const PICK_TIP_ID = "cgo-map-tools-pick-tip";
    const HOVER_ID = "cgo-map-tools-hover";
    const CANVAS_ID = "cgo-map-tools-canvas";
    const VALUES_ID = "cgo-map-tools-values";
    const STYLE_ID = "cgo-map-tools-style";
    /** 窄屏口径（与 viewport-inset 一致）：小屏上浮层互斥，不与其它浮层共存 */
    const MOBILE_MAX = 640;
    /** 需要避让的其它浮层：窄屏上它们一出现，本模块的面板先让位，不压在它们上面 */
    const OVERLAY_IDS = ["info-panel", "cgo-route-card", "cgo-route-result"];
    /** 画布遮挡声明（由 viewport-inset 读取）：本模块浮层贴右下角，右侧与底部都要留白 */
    const INSET_ATTR = "data-cgo-inset";
    const INFO_PANEL_ID = "info-panel";
    const RESULT_PANEL_ID = "cgo-route-result";
    /** 面板按钮的标识类（幂等注入靠它） */
    const TOOL_BTN_CLASS = "cgo-mt-inline-btn";

    /** 等时圈档宽（分钟）：每 5 分钟一档，色阶才够细 */
    const ISO_STEP = 5;
    /** 等时圈的档数下限：取值最远只到 40 分钟时仍画满到 90 分钟，标尺才稳定 */
    const ISO_MIN_BANDS = 18;
    /**
     * 每几档画一条等级线（也就是几档一组）。色带按 ISO_STEP 分档，但等值线若也每档一条，
     * 线上会挤满数字 —— 故线与标签都按 15 分钟一组来画，与图例刻度同一节拍。
     */
    const EDGE_EVERY = Math.round(15 / ISO_STEP);
    /**
     * 值场采样倍率：IDW 在低分辨率上求值（每 FIELD_CELL 像素一个采样点），
     * 之后再双线性上采样到 1:1 的输出画布。
     * 「低分辨率求值 + 高分辨率输出」是有意为之：IDW 是逐像素遍历站点的重活，
     * 放在低频上算才跑得动；而填色与等级线在 1:1 上落笔，边界才不会在放大时糊成马赛克。
     * 取 2 而不是更大：上采样后的等值线折点间距就等于这个值（越小越不像马赛克）。
     */
    const FIELD_CELL = 2;
    /** 覆盖范围倍率：以画布中心为基准向外扩一圈，缩小时视口不露白 */
    const COVER_SCALE = 2;
    /** 值场平滑遍数（3×3 盒式，可分离）：压掉站点附近被 IDW 顶起来的平台，并削去细长的尖刺 */
    const SMOOTH_PASSES = 5;
    /**
     * 兜底搜索的环数：第一轮支撑域（一个格子边长）取不到站点时，第二轮把半径放宽到
     * 两个格子边长，覆盖 5×5 邻域再算一遍。只有郊区那种站点稀疏处才会用到第二轮。
     */
    const SPARSE_RING = 2;
    /** 逐批计算的站数：一次算完会让主线程长时间无响应，分片让 loading 能画出来 */
    const BATCH = 24;
    /** 建图超时（毫秒）：超过即放弃本次并允许重试，免得一次挂起把入口钉死 */
    const BUILD_TIMEOUT = 15000;
    /** 渲染分片：每算这么多行让出一帧，长耗时也不把界面卡死 */
    const SLICE_ROWS = 64;
    /** 分层设色的填充与分割线不透明度 */
    const FILL_ALPHA = 110;
    const EDGE_ALPHA = 205;
    /**
     * 等级分割线的半宽（像素）：距边界不超过这个距离的像素都描白，
     * 故线宽 ≈ 1 + 2 × EDGE_SPAN。取 2 即约 5px —— 线太细在缩放后看不见。
     */
    const EDGE_SPAN = 2;
    /** 等值线数值标签的最小间距（画布坐标 px），同一条线上按此间距撒点 */
    const LABEL_GAP = 400;
    /**
     * 距离蒙版：离最近车站越远，色块越淡。
     * 以「平均站距」为单位 —— 刚出一个站距就开始淡，但淡化过程拉得长（一直淡到 3.5 倍），
     * 边缘因此是柔和收掉的，而线网边缘那些细长的等值线尖角（"触角"）也一并被糊掉。
     */
    const FADE_START_FACTOR = 0.7;
    const FADE_END_FACTOR = 3.5;
    /**
     * 两站汇合：差值色标的档宽、量程（分钟）与推荐条数。
     * 量程之内按档上色（0 附近是"汇合带"），超出量程按外带渐隐 —— 上游的汇合图就是这个口径。
     * 量程放宽到 ±30 是为了给"黄 → 淡化 → 浓色"这段过渡留出足够的档位。
     */
    const MEET_STEP = 5;
    const MEET_CAP = 30;
    const MEET_FADE = 20;
    const MEET_PICKS = 3;
    /** 估算固定色标参照范围时抽取的起点个数，以及每个起点最多扫多少座到达站 */
    const RANGE_SAMPLES = 4;
    const RANGE_TARGETS = 48;
    /** 标签避让：与站点、站名标签、线路走向的最小间距（画布坐标 px） */
    const CLEAR_STATION = 16;
    const CLEAR_LABEL = 4;
    const CLEAR_LINE = 14;

    /**
     * 色标（低值 → 高值）。等时圈按上游习惯走蓝→绿→黄→红；
     * 票价图走黄→绿→蓝→紫→粉。锚点之间的档位色由分段线性插值得到，
     * 因此档数变化（各城票价档位不同）不需要另配色表。
     */
    const SCALES = {
        iso: ["#2D7BE5", "#35B96A", "#F2C53D", "#E0524A"],
        fare: ["#F5D33C", "#3FBF6A", "#2E7FE0", "#8A54D6", "#E85FA8"]
    };

    const TOOLS = {
        fare: {
            id: "fare",
            icon: "payment",
            name: "票价图",
            desc: "选一个车站，看从该站出发到各站的票价",
            title: (name) => `${name}到各站票价`
        },
        iso: {
            id: "iso",
            icon: "time",
            name: "等时圈",
            desc: "选一个车站，看乘地铁多少分钟能到各站",
            title: (name) => `从${name}出发`
        },
        meet: {
            id: "meet",
            icon: "user",
            name: "两站汇合",
            desc: "选两个车站，找两人用时接近、都方便到的汇合站",
            title: (name) => `${name} 汇合图`
        }
    };

    /**
     * 两站汇合的色标：以差值 0 为中心的双向色标。
     * 中间的黄是"汇合带"（两人用时相等），往两侧先**淡化**（浅粉 / 浅蓝）再**变浓**
     * （深红 / 深蓝）—— 直接从黄插到红会经过一片很脏的橙，先提亮再压深才有过渡感。
     */
    const MEET_SCALE = ["#C2477A", "#F2C9D8", "#F2D24B", "#B9CCF2", "#3B5BC0"];
    /** 汇合带（差值 0）那条分界线的颜色：黄，与色标中心对应 */
    const MEET_ZERO_EDGE = [242, 210, 75];

    /**
     * 汇合图等级线的线型：从中间往外依次是「黄实线 → 白虚线 → 白实线 → 白虚线 …」。
     * 0 那条分界最要紧，用黄实线；再往外一条用虚线、再一条实线，交替下去，
     * 图例与图上都用这一套判定（`kind` 为 zero / dash / solid）。
     */
    function meetCutKind(cutValue, step) {
        if (cutValue === 0) return "zero";
        const rank = Math.round(Math.abs(cutValue) / step);
        return rank % 2 === 1 ? "dash" : "solid";
    }

    const state = {
        tool: null,          // 当前小窗展示的工具
        stationId: null,     // 当前小窗的起点车站（汇合图时是 [A, B]）
        targetKey: null,     // 当前渲染目标的令牌，用来丢弃迟到的结果
        picking: null,       // 正在选站的工具 id
        picks: [],           // 多步选站（两站汇合）已经选好的车站
        planner: null,       // 行程规划内核（懒建，构建一次即复用）
        building: null,      // 建图中的 Promise，避免并发重复建图
        busy: false,         // 正在计算，期间不重复触发
        field: null          // 本次绘制的值场与档位，供悬停查值
    };

    const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
    const stations = () => window.processedStations || {};
    const stationName = (sid) => stations()[sid]?.cn || String(sid || "");
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
    /** 站名可能含 & < > 等字符，拼进 HTML 标题前先转义 */
    const esc = (text) => String(text).replace(/[&<>"']/g, (ch) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
    /** 核心把当前选中的车站标成 .active，据此知道车站详情面板说的是哪一站 */
    const activeStationId = () => document.querySelector("#stations-layer .station.active")?.dataset.sid
        || document.querySelector("#labels-layer .label-group.active")?.dataset.sid
        || null;

    /* ======================================================================
     * 样式注入：按脚本自身 URL 找同名 css，调用方无需手工引用
     * ==================================================================== */

    (function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const self = document.currentScript && document.currentScript.src;
        if (!self) return;
        const link = document.createElement("link");
        link.id = STYLE_ID;
        link.rel = "stylesheet";
        link.href = self.replace(/\.js(\?.*)?$/, ".css$1");
        document.head.appendChild(link);
    })();

    /* ======================================================================
     * 面板外壳（工具列表与结果小窗共用同一套外观与位置）
     * ==================================================================== */

    /**
     * 面板外壳：工具列表与结果小窗共用同一套外观、位置与标题栏。
     * 关窗动作由调用方给（结果小窗要连画布与叠加层一并清理，不能只藏起面板）。
     */
    function shell(id, title, onClose, asHtml) {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement("div");
            el.id = id;
            el.className = "cgo-mt-panel";
            // 本模块的浮层都贴右下角：向引擎声明右下留白，别让地图内容压在它下面
            el.setAttribute(INSET_ATTR, "right bottom");
            document.body.appendChild(el);
        }
        el.innerHTML = `
            <div class="cgo-mt-head">
                <span class="cgo-mt-head-title"></span>
                <button type="button" class="cgo-mt-close" title="关闭">
                    <cgo-icon name="close" size="14"></cgo-icon>
                </button>
            </div>
            <div class="cgo-mt-body"></div>
        `;
        const headTitle = el.querySelector(".cgo-mt-head-title");
        // 汇合图的标题里带一个矢量箭头图标，故标题允许给 HTML（其余仍走文本）
        if (asHtml) headTitle.innerHTML = title;
        else headTitle.textContent = title;
        el.querySelector(".cgo-mt-close").addEventListener("click", onClose);
        return el;
    }

    function showPanel(id) {
        document.getElementById(id)?.classList.add("show");
    }

    function hidePanel(id) {
        document.getElementById(id)?.classList.remove("show");
    }

    const menuEl = () => document.getElementById(MENU_ID);

    /* ======================================================================
     * 工具列表浮层
     * ==================================================================== */

    /**
     * 开工具列表面板。
     * @param {string|string[]} [preset] 预设车站：从车站详情 / 路线结果面板的按钮进来时带上。
     *   车站详情给的是一个 id，路线结果给的是 `[起点, 终点]`；选定工具后按下面的规则直接用它们，
     *   省掉再点一次地图。
     */
    function openTools(preset) {
        // 工具列表与结果小窗同一位置，故同时只留一个
        closePanel();
        const el = shell(MENU_ID, "地图小工具", () => hidePanel(MENU_ID));
        el.querySelector(".cgo-mt-body").innerHTML = `
            <p class="cgo-mt-lead">可选的地图分析小工具。点「开启」后在地图上点选一个车站即可。</p>
            <p class="cgo-mt-note">受 <a href="https://centralgo.site/map" target="_blank" rel="noreferrer">Central Go 地图本体</a><cgo-icon name="external" size="12"></cgo-icon> 启发</p>
            <div class="cgo-mt-list">
                ${Object.values(TOOLS).map((tool) => `
                    <div class="cgo-mt-item">
                        <span class="cgo-mt-item-icon"><cgo-icon name="${tool.icon}" size="22"></cgo-icon></span>
                        <div class="cgo-mt-item-text">
                            <b>${tool.name}</b>
                            <span>${tool.desc}</span>
                        </div>
                        <button type="button" class="cgo-mt-launch" data-launch="${tool.id}">
                            开启<cgo-icon name="arrow-right" size="12"></cgo-icon>
                        </button>
                    </div>
                `).join("")}
            </div>
        `;
        el.querySelectorAll("[data-launch]").forEach((btn) => {
            btn.addEventListener("click", () => launchTool(btn.dataset.launch, preset));
        });
        showPanel(MENU_ID);
    }

    /**
     * 开启某个工具。
     *
     * 预设车站的用法：单站工具（票价图 / 等时圈）取**第一个** —— 从路线结果进来时它就是**起点站**；
     * 两站汇合取**前两个** —— 路线结果进来时正好是"起点当 A、终点当 B"，于是直接出图；
     * 只预设了一个（如从车站详情进来）时，把它当 A，只需用户再点一个 B。
     */
    function launchTool(tool, preset) {
        if (!TOOLS[tool]) return;
        hidePanel(MENU_ID);
        const picks = presetList(preset);
        if (!picks.length) { startPick(tool); return; }
        if (tool !== "meet") { run(tool, picks[0]); return; }
        if (picks.length >= 2) { run(tool, picks.slice(0, 2)); return; }
        startPick(tool, picks[0]);
    }

    /** 预设车站归一成数组（滤掉空值与本城不存在的站） */
    function presetList(preset) {
        return (Array.isArray(preset) ? preset : [preset])
            .filter((sid) => sid && stations()[sid]);
    }

    /* ======================================================================
     * 地图选站
     * ==================================================================== */

    function pickTip() {
        let el = document.getElementById(PICK_TIP_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = PICK_TIP_ID;
            el.className = "cgo-mt-pick-tip";
            el.innerHTML = '<span class="cgo-mt-pick-dot"></span>'
                + '<span class="cgo-mt-pick-text"></span>'
                + '<button type="button" class="cgo-mt-pick-cancel">取消</button>';
            el.querySelector(".cgo-mt-pick-cancel").addEventListener("click", stopPick);
            document.body.appendChild(el);
        }
        return el;
    }

    function mapContent() {
        return document.getElementById("map-content");
    }

    function startPick(tool, presetStationId) {
        if (!TOOLS[tool]) return;
        if (!Object.keys(stations()).length) { alert("线路图尚未就绪，请稍后再试。"); return; }
        stopPick();
        state.picking = tool;
        // 从面板带过来的预设车站：直接算作已选（汇合图即 A 已定，只差 B）
        state.picks = presetStationId ? [presetStationId] : [];
        // 选点期间站名标签与站点一并成为点击热区，指针样式由 map-tools.css 接管
        mapContent()?.classList.add("cgo-mt-picking");
        showPickTip();
        mapContent()?.addEventListener("click", onPickClick, true);
        emit("cgo:map-tools-picking", { tool });
    }

    /** 选站提示文案：两站汇合要连着选两次，得说清现在是第几个 */
    function showPickTip() {
        const tool = state.picking;
        if (!tool) return;
        const tip = pickTip();
        let text = `请在地图上点选一个车站（${TOOLS[tool].name}）`;
        if (tool === "meet") {
            text = state.picks.length === 0
                ? "请点选第一个车站（两站汇合）"
                : `已选 ${stationName(state.picks[0])}，请再点选一个车站`;
        }
        tip.querySelector(".cgo-mt-pick-text").textContent = text;
        tip.classList.add("show");
    }

    function stopPick() {
        if (!state.picking) return;
        state.picking = null;
        mapContent()?.classList.remove("cgo-mt-picking");
        mapContent()?.removeEventListener("click", onPickClick, true);
        document.getElementById(PICK_TIP_ID)?.classList.remove("show");
    }

    function onPickClick(event) {
        const tool = state.picking;
        if (!tool) return;
        // 站点与站名标签都带 data-sid（与行程规划的选点同口径）
        const node = event.target.closest?.("[data-sid]");
        if (!node) return;
        // 拦下这次点击，避免同时打开车站详情面板
        event.preventDefault();
        event.stopPropagation();
        const sid = node.dataset.sid;
        if (tool === "meet") {
            if (state.picks.includes(sid)) { showPickTip(); return; }   // 两个点必须是不同的站
            state.picks.push(sid);
            emit("cgo:map-tools-picked", { tool, stationId: sid, stationName: stationName(sid) });
            if (state.picks.length < 2) { showPickTip(); return; }      // 还差一个：留在选站态
            const picks = state.picks.slice();
            stopPick();
            run(tool, picks);
            return;
        }
        stopPick();
        emit("cgo:map-tools-picked", { tool, stationId: sid, stationName: stationName(sid) });
        run(tool, sid);
    }

    /* ======================================================================
     * 计算
     * ==================================================================== */

    function activeCityId() {
        const city = window.CityDataManager?.getCurrentCity?.() || window.CURRENT_CITY;
        return (city && city.id) || "unknown";
    }

    /** 色标参照范围缓存：`城市|工具` → { min, max }，让同一城市里色标始终锚在同一组数值上 */
    const rangeCache = new Map();

    /**
     * 估算该城该工具的**全局**取值范围，作为固定色标的锚点：
     * 等时圈的红色永远代表"全网最长用时"，票价图的粉色永远代表"全网最高票价"，
     * 与当前选的起点无关。
     *
     * 精确的「线网最长用时」要跑全站对最短路（N² 次，百来座站的规模也得上万次，不划算），
     * 故均匀抽 RANGE_SAMPLES 个起点、每个起点再均匀抽 RANGE_TARGETS 座到达站来取极值：
     * 会略微低估，但足以让色标稳定，代价从「每城上万次寻路」降到几百次。
     * 结果按城市缓存，同一会话里换多少个起点都只算这一回。
     */
    async function referenceRange(tool, planner) {
        const key = `${activeCityId()}|${tool}`;
        if (rangeCache.has(key)) return rangeCache.get(key);
        const ids = Object.keys(stations()).filter((sid) => {
            const station = stations()[sid];
            return station && station.type !== "no" && planner.linesAt(sid).length;
        });
        let min = Infinity;
        let max = -Infinity;
        const step = Math.max(1, Math.floor(ids.length / RANGE_SAMPLES));
        const innerStep = Math.max(1, Math.floor(ids.length / RANGE_TARGETS));
        for (let s = 0; s < ids.length; s += step) {
            const from = ids[s];
            for (let i = 0; i < ids.length; i += innerStep) {
                if (ids[i] === from) continue;
                const result = planner.plan(from, ids[i], "time");
                if (!result) continue;
                const value = tool === "fare" ? result.fare : result.minutes;
                if (!Number.isFinite(value)) continue;
                if (value < min) min = value;
                if (value > max) max = value;
            }
            await nextFrame();
        }
        const range = Number.isFinite(min) && Number.isFinite(max) && max > min ? { min, max } : null;
        rangeCache.set(key, range);
        return range;
    }

    /**
     * 建图自检：从任意一个能乘车的车站出发抽样若干到达站，看可达比例是否正常。
     * 用来识别"坐标索引尚未就绪就建了图"这种半成品网络 —— 那时缺里程的区间全部不可通行，
     * 整网会碎成几块（典型症状：从端头站出发只能走到邻近几站）。
     * 门槛不能只定"能到 1 个站"：碎网络里同线路内部照样走得通，那样根本拦不住。
     * 数据本身就没有可乘车车站时不算失败（那属于城市数据问题，交给上层按不支持处理）。
     */
    function plannerUsable(planner) {
        const ids = Object.keys(stations());
        const list = stations();
        const from = ids.find((sid) => list[sid]?.type !== "no" && planner.linesAt(sid).length);
        if (!from) return true;
        const step = Math.max(1, Math.floor(ids.length / 24));
        let tested = 0;
        let reachable = 0;
        for (let i = 0; i < ids.length; i += step) {
            if (ids[i] === from) continue;
            tested++;
            if (planner.plan(from, ids[i], "time")) reachable++;
        }
        return tested === 0 || reachable / tested >= 0.3;
    }

    /**
     * 建图与内核同行程规划一份：同一套 CGO_ROUTE_CONFIG，同一条 build → create 链路。
     * 建图是异步的（内部等坐标索引就绪），故按 Promise 缓存，重复开启工具不再重建。
     *
     * 两道保险，都是为了"别把一次失败钉死成永久失败"：
     *   1. 超时：坐标索引的 fetch 万一挂住不返回（网络层 / Service Worker 都可能），
     *      build 会一直 pending，busy 也就一直是真、之后再也点不动。超过 BUILD_TIMEOUT
     *      就放弃这次，报"尚未就绪"并允许下次重试（后台那次若最终成功也无妨，已被忽略）；
     *   2. 自检：半成品网络（建图早于坐标索引就绪）走不通，不能进缓存 ——
     *      否则本会话之后每次分析都会沿用这张坏图。
     */
    function ensurePlanner() {
        if (state.planner) return Promise.resolve(state.planner);
        if (state.building) return state.building;
        const config = window.CGO_ROUTE_CONFIG;
        if (!window.CGoRouteData || !window.CGoRoutePlanner || !config) return Promise.resolve(null);
        const timeout = new Promise((resolve) => setTimeout(() => resolve(null), BUILD_TIMEOUT));
        state.building = Promise.race([
            window.CGoRouteData.build({
                linesData: window.linesData || [],
                stationsData: window.stationsData || {},
                coords: config.coords,
                coordOf: config.coordOf,
                reader: config.reader,
                virtualTransfers: config.virtualTransfers,
                fareSystems: config.fareSystems,
                bend: config.bend,
                walkMinutes: config.walkMinutes,
                xferMinutes: config.xferMinutes,
                fare: config.fare
            }),
            timeout
        ]).then((result) => {
            state.building = null;
            if (!result || !result.network) return null;
            const planner = window.CGoRoutePlanner.create(result.network);
            if (!plannerUsable(planner)) return null;
            state.planner = planner;
            return planner;
        }).catch(() => {
            state.building = null;
            return null;
        });
        return state.building;
    }

    /**
     * 逐站取值：以起点为源、按「时间最快」寻路，票价取结算价、用时取总分钟数。
     * 不可达（返回 null）与未开通车站跳过 —— 它们在图上是空洞，而不是某个错误的档位。
     * @returns {Promise<Map<string, number>|null>} null 表示该城市拿不到这类取值（如未配票价）
     */
    async function computeValues(tool, from, planner) {
        const list = Object.keys(stations());
        const values = new Map();
        let fareMissing = true;
        for (let i = 0; i < list.length; i += BATCH) {
            list.slice(i, i + BATCH).forEach((sid) => {
                const station = stations()[sid];
                if (!station || station.type === "no") return;
                if (sid === from) return;                       // 起点自身：既不收票价也不耗时，不入图
                if (!planner.linesAt(sid).length) return;       // 国铁散点等不参与规划
                const result = planner.plan(from, sid, "time");
                if (!result) return;
                if (tool === "fare") {
                    if (!Number.isFinite(result.fare)) return;
                    fareMissing = false;
                    values.set(sid, result.fare);
                } else if (Number.isFinite(result.minutes)) {
                    values.set(sid, result.minutes);
                }
            });
            await nextFrame();
        }
        if (tool === "fare" && fareMissing) return null;
        return values;
    }

    /**
     * 两站汇合：对每座车站分别算「到 A 的用时」与「到 B 的用时」，
     * 取**有符号差值** d = tA − tB 作为着色值（负 = 离 A 更近、正 = 离 B 更近），
     * 同时留下两人的用时，供推荐列表按"用时差最小、较慢者更快"排序。
     */
    async function computeMeetValues(fromA, fromB, planner) {
        const list = Object.keys(stations());
        const values = new Map();
        const minutes = new Map();
        for (let i = 0; i < list.length; i += BATCH) {
            list.slice(i, i + BATCH).forEach((sid) => {
                if (sid === fromA || sid === fromB) return;             // 两个出发点本身没有"汇合"含义
                const station = stations()[sid];
                if (!station || station.type === "no") return;
                if (!planner.linesAt(sid).length) return;
                const a = planner.plan(fromA, sid, "time");
                const b = planner.plan(fromB, sid, "time");
                if (!a || !b) return;
                if (!Number.isFinite(a.minutes) || !Number.isFinite(b.minutes)) return;
                values.set(sid, a.minutes - b.minutes);
                minutes.set(sid, { a: a.minutes, b: b.minutes });
            });
            await nextFrame();
        }
        if (!values.size) return null;
        return { values, minutes };
    }

    /**
     * 汇合推荐：按**总用时**从短到长排 —— 推荐的是"两人都省时间"的那几站；
     * 总用时相同的，优先用时差更小的（更公平的汇合点）
     */
    function meetPicks(meet) {
        return [...meet.minutes.entries()]
            .map(([sid, m]) => ({ sid, ...m, diff: Math.abs(m.a - m.b) }))
            .sort((x, y) => (x.a + x.b) - (y.a + y.b) || x.diff - y.diff)
            .slice(0, MEET_PICKS);
    }

    /* ======================================================================
     * 色标
     * ==================================================================== */

    const hexToRgb = (hex) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];

    /** 在色标锚点之间分段线性插值：t ∈ [0,1] */
    function scaleColor(scale, t) {
        const stops = scale.map(hexToRgb);
        const pos = Math.max(0, Math.min(1, t)) * (stops.length - 1);
        const i = Math.min(stops.length - 2, Math.floor(pos));
        const f = pos - i;
        const a = stops[i], b = stops[i + 1];
        return [
            Math.round(a[0] + (b[0] - a[0]) * f),
            Math.round(a[1] + (b[1] - a[1]) * f),
            Math.round(a[2] + (b[2] - a[2]) * f)
        ];
    }

    /**
     * 由取值集合推出档位与标尺。
     *
     * 色标锚点是**固定**的：有参照范围（`referenceRange` 估出的全城极值）时就以它为准 ——
     * 于是等时圈的红色永远对应"全网最长用时"、票价图的粉色永远对应"全网最高票价"，
     * 换个起点颜色含义不变；只有首帧还没估出参照时才退回本次数据的极值。
     *
     * 三种工具的口径：
     *   - 票价：1 元一档铺满参照范围（金额 → 颜色恒定），每档之间都是等级线；
     *   - 等时圈：ISO_STEP 分钟一档，等级线每 EDGE_EVERY 档一条（15 分钟一组的节拍）；
     *   - 两站汇合：以差值 0 为中心的双向色标（偏 A 粉红 / 汇合带金 / 偏 B 蓝紫），
     *     量程 ±MEET_CAP，超出量程的"外带"由 drawMap 渐隐。
     *
     * 刻度一律返回 `ticks: [{ text, at }]`（at 是 0~1 的横向位置），由 renderLegend
     * 绝对定位摆放 —— 这样刻度中心能精确压在等级线上，不会各行其是。
     */
    function buildBands(tool, values, range) {
        const list = [...values.values()];
        if (!list.length) return null;
        if (tool === "meet") {
            const count = (MEET_CAP / MEET_STEP) * 2;          // 正负各 MEET_CAP / MEET_STEP 档
            const ticks = [];
            for (let i = 0; i <= count; i += 2) {              // 每 10 分钟标一个
                const v = -MEET_CAP + i * MEET_STEP;
                ticks.push({ text: v > 0 ? `+${v}` : String(v), at: i / count });
            }
            return {
                kind: "meet",
                colors: Array.from({ length: count }, (_, i) => scaleColor(MEET_SCALE, (i + 0.5) / count)),
                ticks,
                edgeEvery: 2,                                  // 等级线每 2 档（10 分钟）一条，与刻度同拍
                cutText: (band) => {
                    const v = -MEET_CAP + (band + 1) * MEET_STEP;
                    return v > 0 ? `+${v}` : String(v);
                },
                bandOf: (v) => Math.max(0, Math.min(count - 1, Math.floor((v + MEET_CAP) / MEET_STEP)))
            };
        }
        const scale = SCALES[tool] || SCALES.iso;
        const low = range ? range.min : Math.min(...list);
        const high = range ? Math.max(range.max, ...list) : Math.max(...list);
        if (tool === "fare") {
            const from = Math.max(0, Math.floor(low));
            const to = Math.max(from + 1, Math.ceil(high));
            const amounts = [];
            for (let v = from; v <= to; v++) amounts.push(v);
            const last = amounts.length - 1;
            // 最多标 6 个：档位多时跳着标，首末一定标（避免标尺挤成一团数字）
            const step = Math.max(1, Math.ceil(amounts.length / 6));
            return {
                kind: "fare",
                colors: amounts.map((_, i) => scaleColor(scale, last > 0 ? i / last : 0.5)),
                ticks: amounts
                    .map((v, i) => (i % step === 0 || i === last
                        ? { text: `${v}元`, at: (i + 0.5) / amounts.length } : null))
                    .filter(Boolean),
                amounts,
                edgeEvery: 1,                 // 票价每档之间都是等级线
                /** 第 band 档与第 band+1 档之间的分界值（等值线标签用） */
                cutText: (band) => (band < amounts.length ? `${amounts[band]}元` : ""),
                bandOf: (v) => Math.max(0, Math.min(last, Math.round(v) - from))
            };
        }
        const raw = Math.max(ISO_MIN_BANDS, Math.ceil(high / ISO_STEP));
        const steps = Math.ceil(raw / EDGE_EVERY) * EDGE_EVERY;
        const cuts = [];
        for (let i = 0; i <= steps; i++) cuts.push(i * ISO_STEP);
        return {
            kind: "iso",
            colors: cuts.slice(0, steps).map((_, i) => scaleColor(scale, steps > 1 ? i / (steps - 1) : 0.5)),
            // 刻度只标在等级线上（每 EDGE_EVERY 档一个），与白线上的数值标签同一节拍
            ticks: cuts
                .map((v, i) => (i % EDGE_EVERY === 0 ? { text: String(v), at: i / steps } : null))
                .filter(Boolean),
            cuts,
            edgeEvery: EDGE_EVERY,             // 等级线只画在每 EDGE_EVERY 档的组界上
            cutText: (band) => (band + 1 <= steps ? `${cuts[band + 1]}分` : ""),
            bandOf: (v) => Math.min(steps - 1, Math.max(0, Math.floor(v / ISO_STEP)))
        };
    }

    /* ======================================================================
     * 分层设色
     * ==================================================================== */

    function mapCanvas() {
        let el = document.getElementById(CANVAS_ID);
        const host = mapContent();
        if (!host) return null;
        if (!el || el.parentElement !== host) {
            el?.remove();
            el = document.createElement("canvas");
            el.id = CANVAS_ID;
            el.className = "cgo-mt-canvas";
            // 垫在散点装饰与线路之间（z-index 见 map-tools.css）：色块当底图，线网与站名仍在其上
            host.insertBefore(el, document.getElementById("lines-layer"));
        }
        return el;
    }

    /**
     * 站点网格桶：前缀和 + 紧凑数组。逐像素查最近站点若每次都遍历全网，代价是
     * 像素数 × 站点数（百万级 × 百级），必然卡顿；分桶后每像素只翻几个格子。
     * 格子索引用整数（gy * cols + gx）而不是字符串键 —— 这里的查询次数以百万计，
     * 字符串拼接会成为新的瓶颈。
     */
    function buildGrid(points, coverW, coverH, offsetX, offsetY) {
        // 格子边长取「平均每站点占地的边长」再放大一点，让支撑域恰好落进 3×3 邻域
        const cell = Math.max(60, Math.sqrt((coverW * coverH) / Math.max(1, points.length)) * 1.6);
        const cols = Math.max(1, Math.ceil(coverW / cell));
        const rows = Math.max(1, Math.ceil(coverH / cell));
        const cellOf = (point) => {
            const gx = Math.min(cols - 1, Math.max(0, Math.floor((point.x - offsetX) / cell)));
            const gy = Math.min(rows - 1, Math.max(0, Math.floor((point.y - offsetY) / cell)));
            return gy * cols + gx;
        };
        const start = new Int32Array(cols * rows + 1);
        for (let i = 0; i < points.length; i++) start[cellOf(points[i]) + 1]++;
        for (let i = 1; i < start.length; i++) start[i] += start[i - 1];
        const items = new Int32Array(points.length);
        const cursor = Int32Array.from(start);
        for (let i = 0; i < points.length; i++) items[cursor[cellOf(points[i])]++] = i;
        return { cell, cols, rows, start, items };
    }

    /** 双线性取样：fx/fy 是连续像素坐标（像素中心落在整数上），越界处夹到边缘 */
    function sampleField(field, w, h, fx, fy) {
        const x = Math.max(0, Math.min(w - 1.001, fx));
        const y = Math.max(0, Math.min(h - 1.001, fy));
        const x0 = Math.floor(x), y0 = Math.floor(y);
        const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
        const dx = x - x0, dy = y - y0;
        const top = field[y0 * w + x0] * (1 - dx) + field[y0 * w + x1] * dx;
        const bottom = field[y1 * w + x0] * (1 - dx) + field[y1 * w + x1] * dx;
        return top * (1 - dy) + bottom * dy;
    }

    /**
     * 值场平滑：3×3 盒式，横向一趟、纵向一趟算一遍，可分离所以代价是 2 × 像素数。
     * 只对已知像素取平均，未知区域不会被 0 拖低。
     */
    function boxBlur(field, known, w, h, passes) {
        let a = field;
        let b = new Float32Array(field.length);
        for (let pass = 0; pass < passes; pass++) {
            for (let y = 0; y < h; y++) {
                const row = y * w;
                for (let x = 0; x < w; x++) {
                    const i = row + x;
                    const kc = known[i];
                    const kl = x > 0 ? known[i - 1] : 0;
                    const kr = x < w - 1 ? known[i + 1] : 0;
                    const sum = a[i] * kc + (x > 0 ? a[i - 1] * kl : 0) + (x < w - 1 ? a[i + 1] * kr : 0);
                    const n = kc + kl + kr;
                    b[i] = n ? sum / n : 0;
                }
            }
            for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) {
                    const i = y * w + x;
                    const kc = known[i];
                    const ku = y > 0 ? known[i - w] : 0;
                    const kd = y < h - 1 ? known[i + w] : 0;
                    const sum = b[i] * kc + (y > 0 ? b[i - w] * ku : 0) + (y < h - 1 ? b[i + w] * kd : 0);
                    const n = kc + ku + kd;
                    a[i] = n ? sum / n : 0;
                }
            }
        }
        return a;
    }

    /**
     * 该点等值线的走向（度）。等值线垂直于值场梯度，故取梯度法向量作切线；
     * 结果归一到 (-90, 90]，免得标签读起来是倒的。
     */
    function lineAngle(field, w, h, fx, fy) {
        const x = Math.max(1, Math.min(w - 2, Math.round(fx)));
        const y = Math.max(1, Math.min(h - 2, Math.round(fy)));
        const gx = field[y * w + x + 1] - field[y * w + x - 1];
        const gy = field[(y + 1) * w + x] - field[(y - 1) * w + x];
        let deg = Math.atan2(-gx, gy) * 180 / Math.PI;
        if (deg > 90) deg -= 180;
        if (deg <= -90) deg += 180;
        return Math.round(deg * 10) / 10;
    }

    /** 距离蒙版曲线：start 以内完全不透明、end 以外完全透明，中间用 smoothstep 过渡 */
    function fadeAt(dist, start, end) {
        const t = (dist - start) / (end - start);
        return 1 - t * t * (3 - 2 * t);
    }

    /**
     * 绘制分层设色图。三段式，缺一不可：
     *   ① 低分辨率 IDW 值场 —— 逐采样像素在固定支撑域内加权（站点网格桶加速），
     *      同时记下到最近站点的距离，供距离蒙版用；
     *   ② 值场平滑（3×3 盒式、SMOOTH_PASSES 遍）—— 抹掉站点附近被 IDW 顶起来的"平台"；
     *   ③ 1:1 输出 —— 双线性上采样值场后分档上色（按距离蒙版让远处淡出），
     *      并在跨等级处描白线、沿线撒等级数值标签。
     *      输出与画布 1:1 是关键：等级线若在低分辨率上画再被放大，必然是糊的。
     * 各段都按 SLICE_ROWS 分片让帧，长耗时也不至于把页面卡住。
     */
    async function drawMap(tool, values, bands, guard) {
        const host = mapContent();
        const canvas = mapCanvas();
        if (!host || !canvas) return null;
        const width = host.clientWidth || host.offsetWidth;
        const height = host.clientHeight || host.offsetHeight;
        if (!width || !height) return null;

        const points = [];
        values.forEach((value, sid) => {
            const station = stations()[sid];
            if (!station || !Number.isFinite(station.x) || !Number.isFinite(station.y)) return;
            points.push({ x: station.x, y: station.y, v: value });
        });
        if (!points.length) return null;

        // 覆盖区以画布中心对齐向外扩：offset 即覆盖区左上角在画布坐标系里的位置
        const coverW = Math.ceil(width * COVER_SCALE);
        const coverH = Math.ceil(height * COVER_SCALE);
        const offsetX = -(coverW - width) / 2;
        const offsetY = -(coverH - height) / 2;
        const lowW = Math.max(2, Math.ceil(coverW / FIELD_CELL));
        const lowH = Math.max(2, Math.ceil(coverH / FIELD_CELL));
        const grid = buildGrid(points, coverW, coverH, offsetX, offsetY);

        const field = new Float32Array(lowW * lowH);
        const known = new Uint8Array(lowW * lowH);
        const distance = new Float32Array(lowW * lowH);   // 到最近站点的距离，供距离蒙版用

        // ① 低分辨率值场。权重在 1/d⁴ 之外再乘一道**在支撑域半径处归零的窗口** —— 这一步是关键：
        //    站点进出加权集合时权重是连续衰减到 0 的，不会沿网格线留下"方正"的接缝
        //    （早先按"最近 K 个"截断，集合成员一变值就跳，画出来正是一个块块方盒子）。
        //
        //    分两轮：第一轮支撑域取一个格子边长、覆盖 3×3 邻域，绝大多数像素一轮就够了；
        //    若一轮下来一个站点都没取到（郊区站点稀疏），第二轮把半径放宽到两个格子边长、
        //    覆盖 5×5 邻域再算一遍。第二轮同样带窗口 —— 不带窗口的话，站点在 5×5 边界处
        //    进出集合仍会跳变，只不过把方盒子放大了一圈。
        const DENSE_RADIUS = grid.cell;
        const SPARSE_RADIUS = grid.cell * SPARSE_RING;
        for (let py = 0; py < lowH; py++) {
            const y = offsetY + (py + 0.5) * FIELD_CELL;
            for (let px = 0; px < lowW; px++) {
                const x = offsetX + (px + 0.5) * FIELD_CELL;
                const gx = Math.min(grid.cols - 1, Math.max(0, Math.floor((x - offsetX) / grid.cell)));
                const gy = Math.min(grid.rows - 1, Math.max(0, Math.floor((y - offsetY) / grid.cell)));
                let num = 0;
                let den = 0;
                let nearestIdx = -1;
                let nearestD2 = Infinity;
                for (let pass = 0; pass < 2 && den === 0; pass++) {
                    const ringMax = pass === 0 ? 1 : SPARSE_RING;
                    const radius = pass === 0 ? DENSE_RADIUS : SPARSE_RADIUS;
                    const radius2 = radius * radius;
                    for (let ring = 0; ring <= ringMax; ring++) {
                        const x0 = gx - ring, x1 = gx + ring, y0 = gy - ring, y1 = gy + ring;
                        for (let yy = y0; yy <= y1; yy++) {
                            if (yy < 0 || yy >= grid.rows) continue;
                            const rowBase = yy * grid.cols;
                            for (let xx = x0; xx <= x1; xx++) {
                                if (xx < 0 || xx >= grid.cols) continue;
                                // ring > 0 时只看这一圈的边框格，内部格在更小的环里已经取过
                                if (ring > 0 && xx !== x0 && xx !== x1 && yy !== y0 && yy !== y1) continue;
                                const ci = rowBase + xx;
                                for (let k = grid.start[ci]; k < grid.start[ci + 1]; k++) {
                                    const idx = grid.items[k];
                                    const point = points[idx];
                                    const dx = point.x - x;
                                    const dy = point.y - y;
                                    const d2 = dx * dx + dy * dy;
                                    if (d2 < nearestD2) { nearestD2 = d2; nearestIdx = idx; }
                                    const t = 1 - d2 / radius2;
                                    if (t <= 0) continue;             // 支撑域外：权重 0，也就是"不存在"
                                    const w = (t * t) / (d2 * d2 + 1e-6);
                                    num += w * point.v;
                                    den += w;
                                }
                            }
                        }
                        // 支撑域落在本轮邻域内：扫完前两圈（ring 0 与 1）拿到站点即可收工
                        if (den > 0 && ring >= 1) break;
                    }
                }
                const index = py * lowW + px;
                if (den === 0) {
                    // 两轮都取不到站点（极稀疏的角落）：只能退回最近那一站的值
                    if (nearestIdx < 0) continue;
                    field[index] = points[nearestIdx].v;
                } else {
                    field[index] = num / den;
                }
                distance[index] = Math.sqrt(nearestD2);
                known[index] = 1;
            }
            if ((py & (SLICE_ROWS - 1)) === SLICE_ROWS - 1) {
                await nextFrame();
                if (guard && !guard()) return null;
            }
        }

        // ② 平滑值场
        const smooth = boxBlur(field, known, lowW, lowH, SMOOTH_PASSES);

        // ③ 1:1 输出：双线性上采样 + 分档上色
        const outW = coverW;
        const outH = coverH;
        const off = document.createElement("canvas");
        off.width = outW;
        off.height = outH;
        const ctxOff = off.getContext("2d");
        const image = ctxOff.createImageData(outW, outH);
        const data = image.data;
        const bandIndex = new Uint8Array(outW * outH);   // 0 = 未着色，否则档位 + 1
        // 距离蒙版的两道阈值：以「平均站距」（一个站点平均占多大地方）为单位
        const avgDist = Math.sqrt((coverW * coverH) / Math.max(1, points.length));
        const fadeStart = avgDist * FADE_START_FACTOR;
        const fadeEnd = avgDist * FADE_END_FACTOR;
        const ratio = FIELD_CELL;
        for (let oy = 0; oy < outH; oy++) {
            const fy = (oy + 0.5) / ratio - 0.5;
            for (let ox = 0; ox < outW; ox++) {
                const fx = (ox + 0.5) / ratio - 0.5;
                // 未算出值的角落保持透明（最近邻查一次 known 就够，不必插值）
                const kx = Math.max(0, Math.min(lowW - 1, Math.round(fx)));
                const ky = Math.max(0, Math.min(lowH - 1, Math.round(fy)));
                if (!known[ky * lowW + kx]) continue;
                // 距离蒙版：离最近车站越远越淡，远离线网的空白处干脆不铺色
                const dist = sampleField(distance, lowW, lowH, fx, fy);
                if (dist >= fadeEnd) continue;
                const value = sampleField(smooth, lowW, lowH, fx, fy);
                const band = bands.bandOf(value);
                const index = oy * outW + ox;
                bandIndex[index] = band + 1;
                const rgb = bands.colors[band] || [128, 128, 128];
                const offset = index * 4;
                data[offset] = rgb[0];
                data[offset + 1] = rgb[1];
                data[offset + 2] = rgb[2];
                let alpha = dist <= fadeStart
                    ? FILL_ALPHA
                    : Math.round(FILL_ALPHA * fadeAt(dist, fadeStart, fadeEnd));
                // 汇合图：超出量程的"外带"继续渐隐（上游口径）—— 边缘那些杂乱色块也就跟着糊掉了
                if (bands.kind === "meet") {
                    const over = Math.abs(value) - MEET_CAP;
                    if (over >= MEET_FADE) continue;
                    if (over > 0) alpha = Math.round(alpha * fadeAt(over, 0, MEET_FADE));
                }
                data[offset + 3] = alpha;
            }
            if ((oy & (SLICE_ROWS - 1)) === SLICE_ROWS - 1) {
                await nextFrame();
                if (guard && !guard()) return null;
            }
        }

        // 等级分割线：跨等级处描白。线在 1:1 的画布上落笔，因此是实打实的屏幕像素，
        // 不会被放大糊掉；标签顺带取该处等值线的走向，好沿线倾斜。
        // 等时圈的色带按 5 分钟分档，但等级线只画在**每 EDGE_EVERY 档的组界**上
        // （5 分钟一条线的话线上会挤满数字）；票价图本身就是离散金额，每档一条线。
        const labelCells = new Set();
        const isolines = [];
        const obstacles = collectObstacles();
        // 组 = 「一条等级线覆盖的档数」：等时圈是 EDGE_EVERY 档一组（15 分钟），票价每档一组
        const edgeEvery = bands.edgeEvery || 1;
        const groupOf = (v) => (((v - 1) / edgeEvery) | 0);
        for (let oy = 0; oy < outH; oy++) {
            const y = offsetY + oy + 0.5;
            for (let ox = 0; ox < outW; ox++) {
                const index = oy * outW + ox;
                const band = bandIndex[index];
                if (!band) continue;
                const group = groupOf(band);
                // 距组界不超过 EDGE_SPAN 像素即描白（线因此有厚度，缩小时也看得见）。
                // 四个方向各看一眼即可，不必扫整个邻域：两侧都会被判为边界，
                // 线自然以真实边界为中心加粗。未着色像素（bandIndex 0）不算边界
                let onEdge = false;
                let edgeGroup = group;
                for (let d = 1; d <= EDGE_SPAN && !onEdge; d++) {
                    for (let s = 0; s < 4; s++) {
                        const near = s === 0 ? (ox >= d ? bandIndex[index - d] : 0)
                            : s === 1 ? (ox + d < outW ? bandIndex[index + d] : 0)
                                : s === 2 ? (oy >= d ? bandIndex[index - d * outW] : 0)
                                    : (oy + d < outH ? bandIndex[index + d * outW] : 0);
                        if (!near) continue;
                        const g2 = groupOf(near);
                        if (g2 === group) continue;
                        onEdge = true;
                        if (g2 > edgeGroup) edgeGroup = g2;
                    }
                }
                if (!onEdge) continue;
                // 线也要跟着距离蒙版一起淡出
                const dist = sampleField(distance, lowW, lowH, (ox + 0.5) / ratio - 0.5, (oy + 0.5) / ratio - 0.5);
                if (dist >= fadeEnd) continue;
                // 等级线的线型：汇合图是「黄实线 → 白虚线 → 白实线 …」，
                // 其余工具一律白实线。虚线用一个 (ox + oy) 的周期取舍来打散，
                // 水平、垂直与斜线上都会呈现断续效果。
                // ⚠️ edgeGroup 是**较大侧**的组号，分界值就是该组的起点，
                // 别再多加一格 —— 加了会把黄线画到 −10 上去（量程一变就错位）
                const cutKind = bands.kind === "meet"
                    ? meetCutKind(-MEET_CAP + edgeGroup * edgeEvery * MEET_STEP, edgeEvery * MEET_STEP)
                    : "solid";
                if (cutKind === "dash" && ((ox + oy) & 7) < 5) continue;
                const offset = index * 4;
                if (cutKind === "zero") {
                    data[offset] = MEET_ZERO_EDGE[0];
                    data[offset + 1] = MEET_ZERO_EDGE[1];
                    data[offset + 2] = MEET_ZERO_EDGE[2];
                } else {
                    data[offset] = 255;
                    data[offset + 1] = 255;
                    data[offset + 2] = 255;
                }
                let edgeAlpha = dist <= fadeStart
                    ? EDGE_ALPHA
                    : Math.round(EDGE_ALPHA * fadeAt(dist, fadeStart, fadeEnd));
                if (bands.kind === "meet") {
                    const edgeValue = sampleField(smooth, lowW, lowH, (ox + 0.5) / ratio - 0.5, (oy + 0.5) / ratio - 0.5);
                    const over = Math.abs(edgeValue) - MEET_CAP;
                    if (over >= MEET_FADE) continue;
                    if (over > 0) edgeAlpha = Math.round(edgeAlpha * fadeAt(over, 0, MEET_FADE));
                }
                data[offset + 3] = edgeAlpha;
                const x = offsetX + ox + 0.5;
                const key = `${Math.floor(x / LABEL_GAP)},${Math.floor(y / LABEL_GAP)}`;
                if (labelCells.has(key)) continue;
                labelCells.add(key);
                // 分界值取「较大的那一组」的起点分钟数（即 15 / 30 / 45 …）
                const text = bands.kind === "iso"
                    ? `${edgeGroup * edgeEvery * ISO_STEP}分`
                    : bands.cutText(band - 1);
                if (!text) continue;
                if (!labelFits(x, y, obstacles)) continue;   // 避让站点、站名标签与线路
                isolines.push({
                    x, y, text,
                    angle: lineAngle(smooth, lowW, lowH, (ox + 0.5) / ratio - 0.5, (oy + 0.5) / ratio - 0.5)
                });
            }
            if ((oy & (SLICE_ROWS - 1)) === SLICE_ROWS - 1) {
                await nextFrame();
                if (guard && !guard()) return null;
            }
        }
        ctxOff.putImageData(image, 0, 0);

        // 画布与覆盖区 1:1，不做任何放大：放大插值正是"边界糊、马赛克"的来源
        canvas.width = outW;
        canvas.height = outH;
        canvas.style.width = `${coverW}px`;
        canvas.style.height = `${coverH}px`;
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(off, 0, 0);

        return {
            tool, lowW, lowH, cell: FIELD_CELL, offsetX, offsetY,
            values: smooth, bands, isolines
        };
    }

    /* ======================================================================
     * 图上叠加：起点选中态 + 各站数值图元 + 等值线数值
     * ==================================================================== */

    function valuesLayer() {
        const host = mapContent();
        if (!host) return null;
        let el = document.getElementById(VALUES_ID);
        if (!el || el.parentElement !== host) {
            el?.remove();
            el = document.createElement("div");
            el.id = VALUES_ID;
            el.className = "cgo-mt-values";
            host.appendChild(el);
        }
        return el;
    }

    /**
     * 起点复用核心的选中态：给车站图元与站名标签挂上 .active，
     * 与点击车站弹窗时的观感完全一致（核心的 selectStation 也是给这两个节点加这个类）。
     * 自己另画一光环会与核心的选中样式打架，也难保两套观感一致。
     *
     * 还有一步防守：核心每次 selectStation 都会 clearHighlights() 把所有 .active 摘掉
     * （连起点这份一起），而地形图展示期间起点的选中态不该消失 —— 故看住这两个节点，
     * 谁被摘了就补回来。只在"当前没有 active"时写，因此不会与观察回调互相触发。
     */
    const HIDDEN_CLASS = "cgo-mt-hidden";
    /** 其它浮层在场时本模块面板的让位类（见 syncStacking） */
    const YIELD_CLASS = "cgo-mt-yield";
    let activeNodes = [];
    let hiddenNodes = [];
    let originObserver = null;

    function markOrigin(stationIds) {
        clearOrigin();
        // 汇合图有两个出发点，单个工具只有一个
        const ids = Array.isArray(stationIds) ? stationIds : [stationIds];
        const nodes = [];
        ids.forEach((sid) => {
            [`node_${sid}`, `label_${sid}`].forEach((id) => {
                const el = document.getElementById(id);
                if (el) nodes.push(el);
            });
        });
        nodes.forEach((el) => {
            el.classList.add("active");
            activeNodes.push(el);
        });
        if (nodes.length && "MutationObserver" in window) {
            originObserver = new MutationObserver(() => {
                nodes.forEach((el) => {
                    if (!el.classList.contains("active")) el.classList.add("active");
                });
            });
            nodes.forEach((el) => originObserver.observe(el, { attributes: true, attributeFilter: ["class"] }));
        }
    }

    function clearOrigin() {
        originObserver?.disconnect();
        originObserver = null;
        activeNodes.forEach((el) => el.classList.remove("active"));
        activeNodes = [];
    }

    /**
     * 避让用的障碍物（画布坐标），等级标签要绕开它们：
     *   - 站点：按一个半径判定；
     *   - 站名标签：直接量 labels-layer 里的实际矩形（字号与对齐方式逐站不同，估不出来）；
     *   - 线路：用「相邻站点连线」近似 —— 拿每条 SVG path 的包围盒会把整张图都算成障碍，
     *     而折线的圆角折点相对站点连线只差几个像素，用作避让足够。
     */
    function collectObstacles() {
        const host = mapContent();
        const rect = host.getBoundingClientRect();
        const scale = rect.width / (host.offsetWidth || rect.width) || 1;
        const toCanvas = (box) => ({
            left: (box.left - rect.left) / scale,
            top: (box.top - rect.top) / scale,
            right: (box.right - rect.left) / scale,
            bottom: (box.bottom - rect.top) / scale
        });
        const list = stations();
        const dots = [];
        Object.values(list).forEach((station) => {
            if (Number.isFinite(station.x) && Number.isFinite(station.y)) dots.push({ x: station.x, y: station.y });
        });
        const labels = [];
        document.querySelectorAll("#labels-layer .label-group").forEach((el) => {
            const box = toCanvas(el.getBoundingClientRect());
            if (box.right - box.left < 1 || box.bottom - box.top < 1) return;
            labels.push(box);
        });
        const segments = [];
        (window.linesData || []).forEach((line) => {
            [line.stationIds, line["stationIds-way1"], line["stationIds-way2"]].forEach((ids) => {
                if (!Array.isArray(ids)) return;
                for (let i = 1; i < ids.length; i++) {
                    const a = list[ids[i - 1]];
                    const b = list[ids[i]];
                    if (!a || !b || !Number.isFinite(a.x) || !Number.isFinite(b.x)) continue;
                    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
                }
            });
        });
        return { dots, labels, segments };
    }

    /** 点到线段的距离（像素） */
    function segmentDistance(px, py, seg) {
        const dx = seg.x2 - seg.x1;
        const dy = seg.y2 - seg.y1;
        const len2 = dx * dx + dy * dy;
        let t = len2 ? ((px - seg.x1) * dx + (py - seg.y1) * dy) / len2 : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (seg.x1 + t * dx), py - (seg.y1 + t * dy));
    }

    /** 该处放等级标签是否清爽（不压站点、不压站名、不压线路） */
    function labelFits(x, y, obstacles) {
        if (!obstacles) return true;
        for (let i = 0; i < obstacles.dots.length; i++) {
            const dx = obstacles.dots[i].x - x;
            const dy = obstacles.dots[i].y - y;
            if (dx * dx + dy * dy < CLEAR_STATION * CLEAR_STATION) return false;
        }
        for (let i = 0; i < obstacles.labels.length; i++) {
            const box = obstacles.labels[i];
            if (x > box.left - CLEAR_LABEL && x < box.right + CLEAR_LABEL
                && y > box.top - CLEAR_LABEL && y < box.bottom + CLEAR_LABEL) return false;
        }
        for (let i = 0; i < obstacles.segments.length; i++) {
            if (segmentDistance(x, y, obstacles.segments[i]) < CLEAR_LINE) return false;
        }
        return true;
    }

    /**
     * 图上叠加：有数值的车站换成「大圆 + 数值」，底色统一取地图背景色（样式表定），
     * 于是它读起来是"图上的一枚标签"，而不是又一层色块；数值取该站自身的取值、
     * 不是插值结果 —— 标注要对得上单站，而不是对得上色块。
     * **只让有数值的站点让位**：未开通站、国铁散点这些没被标注的车站，原图元原样留着。
     * 另在等值线上撒等级数值，标签顺等值线走向倾斜、并避让站点 / 站名 / 线路。
     */
    function renderOverlay(targets, values, bands, isolines, picks) {
        const layer = valuesLayer();
        if (!layer) return;
        // 这个类只用来给"地形图展示期间"的样式挂钩（站名文字加背景色描边等）
        mapContent()?.classList.add("cgo-mt-terrain");
        const frag = document.createDocumentFragment();
        const pickSet = new Set((picks || []).map((pick) => pick.sid));
        values.forEach((value, sid) => {
            const station = stations()[sid];
            if (!station || !Number.isFinite(station.x)) return;
            const node = document.getElementById(`node_${sid}`);
            if (node) {
                node.classList.add(HIDDEN_CLASS);
                hiddenNodes.push(node);
            }
            const badge = document.createElement("span");
            // 推荐汇合站的图元单独着色（黄底深字），不另加徽标 —— 图上直接看得出来
            badge.className = pickSet.has(sid) ? "cgo-mt-badge is-pick" : "cgo-mt-badge";
            badge.style.left = `${station.x}px`;
            badge.style.top = `${station.y}px`;
            // 3 位以上（如 135 分钟）在 20px 的正圆里放不下：把数字横向压扁，
            // 而不是把圆撑成椭圆 —— 图元一律保持正圆。
            // 汇合图的值是有符号差值，圆里只放绝对值（偏向由颜色表达）
            const text = String(Math.round(Math.abs(value)));
            const inner = document.createElement("span");
            inner.style.transform = `scaleX(${Math.min(1, 2.6 / text.length)})`;
            inner.textContent = text;
            badge.appendChild(inner);
            frag.appendChild(badge);
        });
        // 汇合图：两个出发点的原图元整个让位，位置由 A / B 标记顶上；
        // 标记颜色与色标两端一一对应（A 侧粉红、B 侧蓝），一眼知道哪边是哪边
        if (bands.kind === "meet") {
            const addFlag = (sid, text, cls) => {
                const station = stations()[sid];
                if (!station || !Number.isFinite(station.x)) return;
                const tag = document.createElement("span");
                tag.className = `cgo-mt-flag ${cls}`;
                tag.style.left = `${station.x}px`;
                tag.style.top = `${station.y}px`;
                tag.textContent = text;
                frag.appendChild(tag);
            };
            targets.forEach((sid, i) => {
                const node = document.getElementById(`node_${sid}`);
                if (node) {
                    node.classList.add(HIDDEN_CLASS);
                    hiddenNodes.push(node);
                }
                addFlag(sid, i === 0 ? "A" : "B", i === 0 ? "is-ab" : "is-ba");
            });
        }
        (isolines || []).forEach((line) => {
            const tag = document.createElement("span");
            tag.className = "cgo-mt-isoline";
            tag.style.left = `${line.x}px`;
            tag.style.top = `${line.y}px`;
            tag.style.transform = `translate(-50%, -50%) rotate(${line.angle || 0}deg)`;
            tag.textContent = line.text;
            frag.appendChild(tag);
        });
        layer.textContent = "";
        layer.appendChild(frag);
        markOrigin(targets);
    }

    function clearOverlay() {
        clearOrigin();
        mapContent()?.classList.remove("cgo-mt-terrain");
        hiddenNodes.forEach((el) => el.classList.remove(HIDDEN_CLASS));
        hiddenNodes = [];
        document.getElementById(VALUES_ID)?.remove();
        document.getElementById(HOVER_ID)?.classList.remove("show");
    }

    /* ======================================================================
     * 悬停读数
     * ==================================================================== */

    function hoverTip() {
        let el = document.getElementById(HOVER_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = HOVER_ID;
            el.className = "cgo-mt-hover";
            el.innerHTML = '<span class="cgo-mt-hover-dot"></span><span class="cgo-mt-hover-text"></span>';
            document.body.appendChild(el);
        }
        return el;
    }

    /** 分区色在深色胶囊上要够亮：与白色按比例混合后用作数字颜色 */
    const brighten = (rgb) => `rgb(${rgb.map((c) => Math.round(c + (255 - c) * 0.35)).join(",")})`;

    let hoverPending = null;

    function onHoverMove(event) {
        const field = state.field;
        const tip = hoverTip();
        if (!field || !state.tool || document.getElementById("map-container")?.classList.contains("active")) {
            tip.classList.remove("show");
            return;
        }
        const host = mapContent();
        const rect = host.getBoundingClientRect();
        const layoutWidth = host.offsetWidth || rect.width;
        const scale = rect.width / layoutWidth;
        // 屏幕坐标 → 画布坐标 → 值场坐标（覆盖区从 offset 起算）
        const mapX = (event.clientX - rect.left) / scale;
        const mapY = (event.clientY - rect.top) / scale;
        const fx = (mapX - field.offsetX) / field.cell - 0.5;
        const fy = (mapY - field.offsetY) / field.cell - 0.5;
        if (fx < 0 || fy < 0 || fx > field.lowW - 1 || fy > field.lowH - 1) {
            tip.classList.remove("show");
            return;
        }
        const value = sampleField(field.values, field.lowW, field.lowH, fx, fy);
        const band = field.bands.bandOf(value);
        const rgb = field.bands.colors[band] || [255, 255, 255];
        // 汇合图的值是有符号差值：文案说清"哪边更近、差几分钟"
        const tool = field.tool;
        let number;
        let unit;
        if (tool === "fare") {
            number = String(field.bands.amounts[band]);
            unit = "元";
        } else if (tool === "meet") {
            number = String(Math.round(Math.abs(value)));
            unit = `分钟 · ${value < 0 ? "离 A 更近" : "离 B 更近"}`;
        } else {
            number = String(Math.round(value));
            unit = "分钟";
        }
        tip.querySelector(".cgo-mt-hover-dot").style.background = `rgb(${rgb.join(",")})`;
        tip.querySelector(".cgo-mt-hover-text").innerHTML =
            `${tool === "fare" ? "预计 " : ""}<b style="color:${brighten(rgb)}">${number}</b> ${unit}`;
        tip.style.left = `${event.clientX}px`;
        tip.style.top = `${event.clientY - 12}px`;
        tip.classList.add("show");
    }

    function onHover(event) {
        if (hoverPending) return;
        hoverPending = requestAnimationFrame(() => {
            hoverPending = null;
            onHoverMove(event);
        });
    }

    /* ======================================================================
     * 结果小窗（标题栏 + 图例 + 更改车站）
     * ==================================================================== */

    function openPanel(tool, name, titleHtml) {
        const el = shell(PANEL_ID, titleHtml || TOOLS[tool].title(name), closePanel, !!titleHtml);
        el.querySelector(".cgo-mt-body").innerHTML =
            '<div class="cgo-mt-loading"><cgo-icon name="loading" size="16"></cgo-icon>正在计算…</div>';
        showPanel(PANEL_ID);
        return el;
    }

    /**
     * 图例：色带 + 刻度（+ 汇合图的推荐列表）。
     * 刻度用绝对定位摆在各等级线的位置上（`tick.at` 是 0~1 的位置），
     * 而不是靠 flex 均分 —— 均分只能让两端的标签贴边，中间那些会与白线错开。
     */
    function renderLegend(panel, bands, meet, targets, picks) {
        const body = panel.querySelector(".cgo-mt-body");
        const edgeEvery = bands.edgeEvery || 1;
        const ticks = (bands.ticks || []).map((tick) => {
            const pos = Math.max(0, Math.min(1, tick.at)) * 100;
            const align = tick.at <= 0 ? "translateX(0)"
                : tick.at >= 1 ? "translateX(-100%)" : "translateX(-50%)";
            return `<span style="left:${pos.toFixed(3)}%;transform:${align}">${tick.text}</span>`;
        }).join("");

        // 汇合图：推荐三个总用时最短的汇合站
        let picksHtml = "";
        if (meet) {
            picksHtml = `
                <div class="cgo-mt-meet">
                    <div class="cgo-mt-meet-title">推荐汇合站（总用时最短）</div>
                    ${(picks || []).map((pick, i) => `
                        <button type="button" class="cgo-mt-meet-item" data-meet-sid="${pick.sid}">
                            <span class="cgo-mt-meet-rank">${i + 1}</span>
                            <span class="cgo-mt-meet-name">${stationName(pick.sid)}</span>
                            <span class="cgo-mt-meet-time">A ${Math.round(pick.a)} · B ${Math.round(pick.b)} · 差 ${Math.round(pick.diff)} 分</span>
                        </button>
                    `).join("")}
                </div>
            `;
        }

        body.innerHTML = `
            <div class="cgo-mt-legend">
                <div class="cgo-mt-band">
                    ${bands.colors.map((rgb, i) => {
                        let cls = "";
                        if (i > 0 && i % edgeEvery === 0) {
                            const kind = bands.kind === "meet"
                                ? meetCutKind(-MEET_CAP + (i / edgeEvery) * edgeEvery * MEET_STEP, edgeEvery * MEET_STEP)
                                : "solid";
                            cls = kind === "zero" ? "cgo-mt-cutzero"
                                : kind === "dash" ? "cgo-mt-cutdash" : "cgo-mt-cut";
                        }
                        return `<i${cls ? ` class="${cls}"` : ""} style="background:rgb(${rgb.join(",")})"></i>`;
                    }).join("")}
                </div>
                <div class="cgo-mt-ticks">${ticks}</div>
                ${meet ? `<div class="cgo-mt-ends"><span>${stationName(targets[0])} 更近</span><span>汇合带</span><span>${stationName(targets[1])} 更近</span></div>` : ""}
            </div>
            ${picksHtml}
            <div class="cgo-mt-actions">
                <button type="button" class="cgo-mt-quick" data-act="repick">
                    <cgo-icon name="map" size="14"></cgo-icon>${meet ? "重新选站" : "更改车站"}
                </button>
            </div>
        `;
        body.querySelector('[data-act="repick"]').addEventListener("click", () => {
            if (state.tool) startPick(state.tool);
        });
        body.querySelectorAll("[data-meet-sid]").forEach((btn) => {
            btn.addEventListener("click", () => window.selectStation?.(btn.dataset.meetSid));
        });
    }

    function renderNotice(panel, text) {
        panel.querySelector(".cgo-mt-body").innerHTML = `<p class="cgo-mt-notice">${text}</p>`;
    }

    function closePanel() {
        const tool = state.tool;
        stopPick();
        hidePanel(PANEL_ID);
        clearCanvas();
        clearOverlay();
        state.tool = null;
        state.stationId = null;
        state.targetKey = null;
        state.picks = [];
        state.field = null;
        // 本来就没开着（如点工具按钮时顺手收一遍）就不必报一次空事件
        if (tool) emit("cgo:map-tools-closed", { tool });
    }

    function clearCanvas() {
        document.getElementById(CANVAS_ID)?.remove();
    }

    /* ======================================================================
     * 一次完整流程
     * ==================================================================== */

    async function run(tool, target) {
        if (state.busy) return;
        state.busy = true;
        state.tool = tool;
        // 单站工具传一段 id，汇合图传 [A, B]
        const targets = Array.isArray(target) ? target.slice() : [target];
        state.stationId = Array.isArray(target) ? targets : target;
        const targetKey = targets.join("|");
        state.targetKey = targetKey;
        const name = targets.map(stationName).join(" ⇄ ");
        // 汇合图的标题：甲站 ⇄ 乙站 汇合图 —— 箭头用 CGoUI 矢量图标，不用字符
        const titleHtml = tool === "meet"
            ? `${esc(stationName(targets[0]))}<cgo-icon name="vi-way" size="15" class="cgo-mt-way"></cgo-icon>${esc(stationName(targets[1]))} 汇合图`
            : null;
        // 建图、计算、绘制三段都是异步的，期间用户可能已关窗或换了工具：
        // 每段结束都据这枚令牌丢弃迟到的结果，否则它会把已经关掉的小窗与画布重新画回来
        const alive = () => state.tool === tool && state.targetKey === targetKey;
        const panel = openPanel(tool, name, titleHtml);
        const started = performance.now();
        emit("cgo:map-tools-opened", { tool });
        try {
            let planner = await ensurePlanner();
            if (!alive()) return;
            if (!planner) {
                // 多半是建图早于坐标索引就绪（半成品网络已被自检丢弃）：稍等一会儿再试一次，
                // 免得用户还得手动点第二下
                await new Promise((resolve) => setTimeout(resolve, 1500));
                if (!alive()) return;
                planner = await ensurePlanner();
            }
            if (!alive()) return;
            if (!planner) {
                renderNotice(panel, window.CGO_ROUTE_CONFIG
                    ? "线路数据尚未就绪，请稍后重试。"
                    : "当前城市暂不支持该分析。");
                return;
            }
            // 出发点本身就不参与规划（未开通、或不属于任何可规划线路，如国铁散点）：
            // 直接说清，别让它退化成"从该站出发没有可到达的其他车站"这种含糊说法
            const unusable = targets.find((sid) => stations()[sid]?.type === "no"
                || !planner.linesAt(sid).length);
            if (unusable) {
                renderNotice(panel, `${stationName(unusable)} 不参与规划（未开通或不属于可规划线路）。`);
                return;
            }
            let values;
            let meet = null;
            if (tool === "meet") {
                meet = await computeMeetValues(targets[0], targets[1], planner);
                values = meet ? meet.values : null;
            } else {
                values = await computeValues(tool, targets[0], planner);
            }
            if (!alive()) return;
            if (!values) {
                renderNotice(panel, tool === "fare"
                    ? "该城市未配置票价规则，无法生成票价图。"
                    : "没有可用的数据。");
                return;
            }
            if (!values.size) { renderNotice(panel, "没有可比较的车站数据（可能不可达或尚未开通）。"); return; }
            // 固定色标的参照范围（按城市 + 工具缓存，只算一次）；汇合图的量程本身就是固定的
            const range = tool === "meet" ? null : await referenceRange(tool, planner);
            if (!alive()) return;
            const bands = buildBands(tool, values, range);
            if (!bands) { renderNotice(panel, "没有可用的分档数据。"); return; }
            const field = await drawMap(tool, values, bands, alive);
            if (!field) return;
            if (!alive()) return;
            state.field = field;
            const picks = meet ? meetPicks(meet) : [];
            renderOverlay(targets, values, bands, field.isolines, picks);
            renderLegend(panel, bands, meet, targets, picks);
            const list = [...values.values()];
            emit("cgo:map-tools-rendered", {
                tool, stationId: state.stationId, stationName: name, stations: values.size,
                min: Math.min(...list), max: Math.max(...list),
                ms: Math.round(performance.now() - started)
            });
        } catch (err) {
            renderNotice(panel, (err && err.message) || "计算失败，请稍后重试。");
        } finally {
            state.busy = false;
        }
    }

    /* ======================================================================
     * 初始化
     * ==================================================================== */

    /* ======================================================================
     * 与其它浮层的关系：让位、以及给面板补入口按钮
     * ==================================================================== */

    /** 其它浮层（车站详情 / 行程规划 / 路线结果）是否在场 */
    function overlayOpen() {
        return OVERLAY_IDS.some((id) => {
            const el = document.getElementById(id);
            if (!el || !el.isConnected) return false;
            const style = window.getComputedStyle(el);
            return style.display !== "none" && style.visibility !== "hidden" && el.offsetWidth > 0;
        });
    }

    /**
     * 让位：窄屏上其它浮层一出现，本模块的面板先收起来，而不是硬压在车站详情 / 路线结果
     * 上面（它们收起后自动恢复）。桌面端不互斥 —— 侧边栏形态下车站详情是常驻的，
     * 若一并让位就再也看不到色标与「更改车站」了；两者位置不同，共存完全放得下。
     */
    function syncStacking() {
        const yieldToOthers = window.innerWidth <= MOBILE_MAX && overlayOpen();
        [menuEl(), document.getElementById(PANEL_ID)].forEach((el) => {
            el?.classList.toggle(YIELD_CLASS, yieldToOthers);
        });
    }

    /** 窗口跨过窄屏阈值时，互斥 / 共存的口径要跟着变（用一帧节流，resize 会连着来） */
    let stackQueued = false;
    function scheduleStacking() {
        if (stackQueued) return;
        stackQueued = true;
        requestAnimationFrame(() => {
            stackQueued = false;
            syncStacking();
        });
    }

    /** 面板上的小工具入口按钮：与面板自带的「分享」按钮同款（同一处、同样式） */
    function shareLikeButton(preset) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `panel-share-btn ${TOOL_BTN_CLASS}`;
        btn.title = "地图小工具";
        btn.innerHTML = '<cgo-icon name="plugin" size="20"></cgo-icon>';
        btn.addEventListener("click", (event) => {
            // 拦下这次点击，别让面板把事件当成"点了别处"而收起
            event.preventDefault();
            event.stopPropagation();
            // 窄屏上本模块浮层与其它浮层互斥，故先把宿主面板收起来让位；
            // 桌面端共存，保持面板开着（用户要求侧边栏模式下也能看到色标与「更改车站」）
            if (window.innerWidth <= MOBILE_MAX) closeHostPanel();
            openTools(preset);
        });
        return btn;
    }

    /** 收起车站详情 / 路线结果面板（复用它们各自的关闭按钮，不改核心与 route-panel 的代码） */
    function closeHostPanel() {
        [INFO_PANEL_ID, RESULT_PANEL_ID].forEach((id) => {
            const close = document.querySelector(`#${id} .panel-close-btn`);
            if (close instanceof HTMLElement && close.offsetParent !== null) close.click();
        });
    }

    /**
     * 最近一次行程规划的起讫站。route-panel 在打开面板与规划完成时都会广播，
     * 从路线结果面板开小工具时用它们当预设 —— 单站工具用起点站，两站汇合用起点当 A、终点当 B。
     */
    let lastRoute = { from: null, to: null };

    function watchRoute() {
        const remember = (event) => {
            const { from, to } = event.detail || {};
            // 只补非空值：打开面板时可能只填了一半，别把另一半清掉
            if (from) lastRoute.from = from;
            if (to) lastRoute.to = to;
        };
        document.addEventListener("cgo:route-opened", remember);
        document.addEventListener("cgo:route-planned", remember);
        document.addEventListener("cgo:route-closed", () => { lastRoute = { from: null, to: null }; });
    }

    /**
     * 车站详情与路线结果面板上的入口按钮：插在各自页签栏尾部那个「分享」按钮旁边
     * （两块面板都由核心 / route-panel 反复重建，故每次 DOM 变动后补一次，按类名判重）。
     * 车站详情只带当前车站；路线结果带 [起点, 终点]，两者在 launchTool 里按工具取用。
     */
    function decoratePanels() {
        [INFO_PANEL_ID, RESULT_PANEL_ID].forEach((id) => {
            const panel = document.getElementById(id);
            if (!panel || !panel.offsetWidth) return;         // 只为在场的那块面板注入
            const share = panel.querySelector(".panel-share-btn");
            const host = share?.parentElement;
            if (!host || host.querySelector(`.${TOOL_BTN_CLASS}`)) return;
            const preset = id === INFO_PANEL_ID
                ? activeStationId()
                : [lastRoute.from, lastRoute.to];
            share.insertAdjacentElement("afterend", shareLikeButton(preset));
        });
    }

    /**
     * 盯住三块面板：显隐、被面板栈压到栈下、形态迁移与整块重建都落在 class / style 上。
     * 只为这三块面板绑观察器（不监听 body 全子树）—— 地图自身的节点变动远比这频繁。
     * body 只盯直接子节点，用于在面板新建 / 搬家 / 拆除后重新绑定。
     */
    function onPanelChange() {
        watchPanels();
        syncStacking();
        decoratePanels();
    }

    const panelObserver = new MutationObserver(onPanelChange);
    const bodyObserver = new MutationObserver(onPanelChange);
    const watchedPanels = new WeakSet();

    function watchPanels() {
        OVERLAY_IDS.forEach((id) => {
            const el = document.getElementById(id);
            if (!el || watchedPanels.has(el)) return;
            watchedPanels.add(el);
            panelObserver.observe(el, {
                attributes: true,
                attributeFilter: ["class", "style"],
                childList: true,
                subtree: true
            });
        });
    }

    function init() {
        // 悬停读数挂在容器上：画布自身 pointer-events: none，地图的拖拽与缩放照常
        const container = document.getElementById("map-container");
        container?.addEventListener("mousemove", onHover);
        container?.addEventListener("mouseleave", () => document.getElementById(HOVER_ID)?.classList.remove("show"));
        // 缩放后旧位置已不对应新画面，先收起来，等鼠标再动时按新坐标重算
        container?.addEventListener("wheel", () => document.getElementById(HOVER_ID)?.classList.remove("show"));
        // 与其它浮层的关系：让位、以及给车站详情 / 路线结果补小工具入口按钮
        watchRoute();
        onPanelChange();
        bodyObserver.observe(document.body, { childList: true });
        window.addEventListener("resize", scheduleStacking);
    }

    /** 对外接口：供城市侧或后续接入方直接开启某个工具 */
    window.CGoMapTools = {
        open: openTools,
        openTool: (tool, stationId) => {
            if (!TOOLS[tool]) return;
            hidePanel(MENU_ID);
            if (stationId) run(tool, stationId);
            else startPick(tool);
        },
        close: () => {
            hidePanel(MENU_ID);
            closePanel();
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
