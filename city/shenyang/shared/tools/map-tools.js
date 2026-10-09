/**
 * CGo OpenMap - 地图小工具（共享层）
 *
 * ⚠️ 临时共享位置：与 route-panel.js、nearest-station.js 等同处 city/shenyang/shared/，
 * 计划随共享层整体迁入 core/。
 *
 * 入口是浮动缩放控制条上「查找最近车站」按钮下方的 plugin 按钮：点开是工具列表浮层
 * （与结果小窗同一套外观，不用 cgo-modal），内含三个分析工具：
 *
 *   1. 票价图（payment）：选一个车站，看从该站出发到全网各站的票价；
 *   2. 等时圈（time）：选一个车站，看乘地铁多少分钟能到各站。面板里另有
 *      「范围」分段控件（色带上限 = 选中项，**高于它的地方不填色**，上限处另画一条等级线）
 *      与「最近 10 站」折叠列表（按用时升序，点条目即选中该站）；
 *   3. 多人汇合（meet）：选两个车站，找大家用时接近、都方便到的汇合站。
 *      出图后再点第三座车站即升级为**三点汇合**（C 的语义色为绿，见 MEET_ORIGINS）：
 *      着色量随之从「有符号差值 a−b」换成「三者用时的极差」（三点下没有"离谁更近"），
 *      色标改标注「汇合带 差 ≤10 分 / 外带 ≤20 分」，面板里可用「移除 C」退回两点。
 *
 * 三者共用同一条链路：**选站 → 计算 → 分层设色 → 图上叠加 → 图例**。
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
 *      （半透明 FILL_ALPHA 让底图透出）；跨等级处画「粗背景色描边 + 细文本色内芯」的
 *      双色线，沿线上撒等级数值标签（文本色填充 + 背景色描边），标签会避让站点 / 站名 / 线路。
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
    const PLAN_PANEL_ID = "cgo-route-card";
    const RESULT_PANEL_ID = "cgo-route-result";
    /** 面板按钮的标识类（幂等注入靠它） */
    const TOOL_BTN_CLASS = "cgo-mt-inline-btn";
    /** 右上角「更多」菜单里那条入口的 id（幂等注入靠它） */
    const MENU_ENTRY_ID = "cgo-maptools-entry";

    /** 等时圈档宽（分钟）：每 5 分钟一档，色阶才够细 */
    const ISO_STEP = 5;
    /**
     * 等时圈的档数下限：**没有「范围」控件时**（拿不到全网极值）取值最远只到 40 分钟也画满到
     * 90 分钟，标尺才稳定；有范围控件时色带上限就是选中项，这条下限不再生效。
     */
    const ISO_MIN_BANDS = 18;
    /**
     * 等时圈「范围」分段控件的候选（分钟）：**色带上限即选中项，高于它的地方不填色、不画等级线**。
     * 其中高于本城最长时间（`referenceRange` 给出的全网极值）的常量一律不显示 —— 小城里选
     * 90 分等于整张图都在量程内，那一档没有意义；末位再补上真正的「最长」那一档。
     */
    const ISO_RANGES = [30, 45, 60, 90];
    /** 「范围」默认选中项；本城最长时间比它还小时退到「最长」那一档 */
    const ISO_RANGE_DEFAULT = 60;
    /**
     * 每几档画一条等级线（也就是几档一组）。色带按 ISO_STEP 分档，但等值线若也每档一条，
     * 线上会挤满数字 —— 故线与标签都按 15 分钟一组来画，与图例刻度同一节拍。
     */
    const EDGE_EVERY = Math.round(15 / ISO_STEP);
    /**
     * 等时圈色带「组内明暗」的幅度：两条等级线之间那几格色系相同，靠明暗拉开层次。
     * 以组中那格为基准，首格向白提亮、末格向黑压暗，各偏这么多 ——
     * 幅度太小就看不出"每组还有三档"，太大又会让整条色阶的走向被明暗盖掉。
     */
    const ISO_SHADE = 0.18;
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
    /**
     * 渲染分片：每算这么多行让出一帧，长耗时也不把界面卡死。
     *
     * ⚠️ 这个值直接决定总时长 —— 每让出一帧都要等一次 vsync（约 8~17ms），而两次让出
     * 之间的计算往往只有几毫秒。实测（沈阳、覆盖区 3888×3360、低分辨率 1944×1680）：
     * 上色阶段 52 次让出耗掉约 870ms，与 52 × 16.7ms 几乎吻合，真正的计算量被等待淹没。
     * 取 128（原为 64）：让出次数减半、总时长约降 1/3；代价是单帧计算涨到数十毫秒，
     * 表现为"轻微卡顿"而非假死 —— 换档位本来就是用户主动等待的场合，这个取舍划算。
     * 再往上调就要明显掉帧了；想继续提速得从每像素的计算量下手（等值线那趟扫描）。
     */
    const SLICE_ROWS = 128;
    /** 分层设色的填充与分割线不透明度：色块要透（底图与线网得看得见），线要实 */
    const FILL_ALPHA = 55;
    const EDGE_ALPHA = 205;
    /**
     * bandIndex 的哨兵值（那张表存的是"档位 + 1"，故 0 表示未着色）：该像素的值超出等时圈
     * 「范围」上限，**不填色** —— 但描线那一步要拿它与色块的交界，把上限那条等级线画出来。
     */
    const CLIP_MARK = 255;
    /**
     * 等级分割线的两段半宽（像素）：外圈是**粗的背景色描边**（把色块挖开一条缝），
     * 内芯是**细的文本色线**（缝里勾出来的那一条）——线、线上的数值、色标示意三处
     * 共用同一套配色。线宽 ≈ 1 + 2 × 半宽：外圈约 7px、内芯约 3px，太细缩放后看不见。
     */
    const EDGE_SPAN_OUTER = 3;
    const EDGE_SPAN_CORE = 1;
    /** 等值线数值标签的最小间距（画布坐标 px），同一条线上按此间距撒点 */
    const LABEL_GAP = 260;
    /**
     * 距离蒙版：离最近车站越远，色块越淡。
     * 以「平均站距」为单位 —— 出站半个站距就开始淡，淡到 1.6 倍即完全收干。
     * 两道阈值都贴着线网收：色块只在线网周边铺一小圈，郊区稀疏站点那几根细长的
     * 等值线尖角（"触角"）在显出来之前就已经淡没了。
     */
    const FADE_START_FACTOR = 0.4;
    const FADE_END_FACTOR = 1.6;
    /**
     * 汇合图：差值色标的档宽、量程（分钟）与推荐条数。
     * 量程之内按档上色（0 附近是"汇合带"），超出量程按外带渐隐 —— 上游的汇合图就是这个口径。
     * 量程放宽到 ±30 是为了给"黄 → 淡化 → 浓色"这段过渡留出足够的档位。
     */
    const MEET_STEP = 5;
    const MEET_CAP = 30;
    const MEET_FADE = 20;
    const MEET_PICKS = 3;
    /**
     * 三点汇合的两个分界（分钟）：差值在 MEET3_BAND 以内是**汇合带**（黄、加实），
     * 到 MEET3_OUTER 是**外带**，再往外渐隐直至不画。
     * 三点只有"三者用时差多少"这一个量，没有"离谁更近"，故色标是单向的
     * （0 = 三人同时到）：取汇合色标的右半段，黄 → 浅蓝 → 深蓝。
     */
    const MEET3_BAND = 10;
    const MEET3_OUTER = 20;
    /**
     * 出发点的语义色：与 map-tools.css 里 `.cgo-mt-flag.is-ab / is-ba / is-ca` 一一对应 ——
     * A 粉红、B 蓝、C 绿。图上标记、面板标题、推荐列表与悬停读数共用这一份，
     * 三处必须同色，否则"哪个数是谁的"就串了。只有前两个能出现在两点汇合里。
     */
    const MEET_ORIGINS = [
        { cls: "is-ab", letter: "A", color: "#c2477a" },
        { cls: "is-ba", letter: "B", color: "#3b5bc0" },
        { cls: "is-ca", letter: "C", color: "#22a05b" }
    ];
    /** 「最近 10 站」列表的条数 */
    const NEAR_COUNT = 10;
    /**
     * 紧贴汇合带的那两档（±MEET_STEP 分钟）的填充透明度倍数。
     * 它们就是"两人差不多同时到"的区域，画实一些，一眼能看出汇合点落在哪一带。
     */
    const MEET_BAND_BOOST = 1.7;
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
            name: "多人汇合",
            desc: "选两个车站，找大家用时接近、都方便到的汇合站；出图后再点一座车站可加入第三人",
            title: (name) => `${name} 汇合图`
        }
    };

    /**
     * 汇合色标（**两点**口径：以差值 0 为中心的双向色标；三点汇合取它的右半段，见 buildBands）。
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
        stationId: null,     // 当前小窗的起点车站（汇合图时是 [A, B]，加入第三人后是 [A, B, C]）
        targetKey: null,     // 当前渲染目标的令牌，用来丢弃迟到的结果
        picking: null,       // 正在选站的工具 id
        picks: [],           // 多步选站（多人汇合）已经选好的车站
        planner: null,       // 行程规划内核（懒建，构建一次即复用）
        building: null,      // 建图中的 Promise，避免并发重复建图
        busy: false,         // 正在计算，期间不重复触发
        field: null,         // 本次绘制的值场与档位，供悬停查值
        isoRange: null,      // 等时圈「范围」的选中项（分钟），null = 还没选、按默认档
        nearOpen: false,     // 「最近 10 站」列表是否展开（纯界面状态，重绘时沿用）
        last: null,          // 上一次绘制的输入（换「范围」时只重分档重绘，不再算一遍值）
        view: null,          // 上一次绘制的成品（图例重画直接用它与 picks/bands，见 renderLegend）
        rangeQueued: false   // 重分档期间又点了别的档位：等这一轮画完再补一轮
    };

    const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
    const stations = () => window.processedStations || {};
    const stationName = (sid) => stations()[sid]?.cn || String(sid || "");
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
    /** 站名可能含 & < > 等字符，拼进 HTML 标题前先转义 */
    const esc = (text) => String(text).replace(/[&<>"']/g, (ch) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
    /** 最近一次在地图上点击的车站（站点图元、站名标签、数值图元都算） */
    let lastTappedStationId = null;

    /**
     * 车站详情面板说的是哪一站。
     *
     * 核心把选中的车站标成 `.active`，但**带这个类的不止一站**：虚拟换乘会一次点亮好几座；
     * 地形图展示期间，工具起点还会被 markOrigin 强制保着 `.active`（选中态不许消失是用户
     * 明确要求的）。光取"第一个 .active"就会取错 —— 于是点了未开通车站的详情，入口按钮却
     * 按另一座站判断、照旧挂在那里。故以**最近一次被点击的那一站**为准（它仍带选中态时），
     * 此路不通再回落到原来的取法。
     */
    const activeStationId = () => {
        const tapped = lastTappedStationId;
        if (tapped && document.getElementById(`node_${tapped}`)?.classList.contains("active")) return tapped;
        return document.querySelector("#stations-layer .station.active")?.dataset.sid
            || document.querySelector("#labels-layer .label-group.active")?.dataset.sid
            || null;
    };
    /** 未开通 / 规划中的车站：规划器不接受它，小工具也算不出结果，故不给入口 */
    const isPlanned = (sid) => stations()[sid]?.type === "no";
    /**
     * 选站时能选的车站：未开通（no）与国铁散点（rdot）都不参与规划，选不了。
     * 与 map-tools.css 里撤掉指针事件的那两类同一个口径 —— 那边管真实指针，
     * 这里给事件被直接派发时兜底。
     */
    const isPickable = (sid) => {
        const type = stations()[sid]?.type;
        return Boolean(type) && type !== "no" && type !== "rdot";
    };

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
     * 面板自身的尺寸也在变：从"正在计算…"换成结果小窗、图例随档位变长，高度都会跳一截。
     * 这类变化只改内容、不动 class / style，viewport-inset 那边盯的是 class 与 style，
     * 察觉不到，画布的避让量就会停在按旧高度算出来的值上。故在这里按元素补一个尺寸观察，
     * 一变就请它重算一次。（用 WeakSet 按元素判重：面板元素被重建时 id 不变，按 id 判会漏）
     */
    const sizedPanels = new WeakSet();

    function watchPanelSize(el) {
        if (!el || sizedPanels.has(el) || typeof ResizeObserver !== "function") return;
        sizedPanels.add(el);
        new ResizeObserver(() => window.CGoViewportInset?.refresh?.()).observe(el);
    }

    /* ======================================================================
     * 固定侧栏形态：同一个区块、两个层级
     *
     * 浮层形态下「工具列表」与「结果小窗」是两个贴右下的浮层、同一位置、同时只留一个。
     * 固定侧栏形态下把它们搬进侧栏区块 #cgo-map-tools-section（一个 .panel-section）——
     * 于是「列表 → 点工具 → 结果」就是同一个区块里换层级，与母产品一致（README 第六节 6.4）。
     * 面板元素本身仍在 document.body 上按需创建，只是被 appendChild 进区块里；
     * 核心重渲 #legend-content 会把区块（连同其中的面板）一起清掉，故重渲后补挂区块、
     * 并给当时正开着的工具 closePanel() 收尾（UI 已不复存在，别留一地画布叠加层）。
     * ==================================================================== */
    const SECTION_ID = "cgo-map-tools-section";
    const SIDEBAR_CONTENT_ID = "legend-content";
    /** 区块标题：各层会把当前工具名写进它，收尾时要复位（见 closePanel） */
    const SECTION_TITLE = "地图小工具";
    const inPinnedSidebar = () => window.innerWidth > 640 && document.body.classList.contains("legend-pinned");
    const toolsSection = () => document.getElementById(SECTION_ID);

    /** 取（必要时创建并挂回）侧栏里的「地图小工具」区块：**紧贴搜索栏下方** */
    function ensureToolsSection() {
        let section = toolsSection();
        if (!section) {
            section = document.createElement("div");
            section.id = SECTION_ID;
            section.className = "panel-section cgo-mt-section collapsed";
            // 告诉 sidebar-refit：本区块的展开要走「单展开」规则（README 第六节 6.2）
            section.dataset.cgoHighId = "tools";
            section.innerHTML = `
                <div class="section-header">
                    <span class="section-title-text">${SECTION_TITLE}</span>
                    <cgo-icon name="expand-more" class="section-arrow"></cgo-icon>
                </div>
                <div class="section-body"></div>
            `;
        }
        const content = document.getElementById(SIDEBAR_CONTENT_ID);
        const search = document.getElementById("section-search");
        if (content) {
            const anchored = search
                ? section.previousElementSibling === search
                : section.parentElement === content && section === content.lastElementChild;
            if (!anchored) content.insertBefore(section, search ? search.nextSibling : null);
        }
        watchSectionExpand(section);
        return section;
    }

    /**
     * 侧栏形态：从标题栏**单独展开**本区块时也要有初始内容（工具列表）。
     * 之前只有从「更多」菜单 / 面板按钮进来才会填内容，直接点标题栏展开就是一片空白（实测踩过）。
     */
    function watchSectionExpand(section) {
        if (section.dataset.cgoMtWatched === "true") return;
        section.dataset.cgoMtWatched = "true";
        new MutationObserver(() => {
            // 选站期间绝不动内容：那会把 state.picking 清掉（见 closePanel），
            // 用户随后点的车站就变成普通点站、直接打开详情了（实测踩过）
            if (state.picking) return;
            if (section.classList.contains("collapsed")) return;
            if (section.querySelector(".cgo-mt-panel.show")) return;   // 已有内容（开着某一层）
            openTools(state.preset);
        }).observe(section, { attributes: true, attributeFilter: ["class"] });
    }

    /** 已注入过「返回」的结果面板（WeakSet 防重复挂观察器） */
    const backInjected = new WeakSet();

    /**
     * 侧栏形态的结果层：「返回」按用户要求做成**一枚 .cgo-mt-quick，放进结果的操作行 .cgo-mt-actions**。
     * 操作行是各工具渲染正文时才生成的，故这里盯住面板子树，出现且尚未注入时补一枚。
     */
    function watchResultActions(panel) {
        if (backInjected.has(panel)) return;
        backInjected.add(panel);
        const inject = () => {
            const actions = panel.querySelector(".cgo-mt-actions");
            if (!actions || actions.querySelector(".cgo-mt-back")) return;
            const back = document.createElement("button");
            back.type = "button";
            back.className = "cgo-mt-quick cgo-mt-back";
            back.innerHTML = '<cgo-icon name="arrow-right" size="13"></cgo-icon>返回工具列表';
            back.addEventListener("click", () => openTools(state.preset));
            actions.insertBefore(back, actions.firstChild);
        };
        new MutationObserver(inject).observe(panel, { childList: true, subtree: true });
        inject();
    }

    /** 侧栏形态：展开工具区块（顺带按单展开规则收起其余占高区块） */
    function expandToolsSection() {
        const section = ensureToolsSection();
        window.CGoSidebarRefit?.collapseOthers("tools");
        section.classList.remove("collapsed");
    }

    /** 侧栏形态的「收起 / 关闭工具」：收起区块，并把正在进行的工具连同画布叠加一并关掉 */
    function collapseToolsSection() {
        toolsSection()?.classList.add("collapsed");
        hidePanel(MENU_ID);
        closePanel();
    }

    /** 核心重渲 #legend-content 会连本区块一起清掉：补挂区块（并保持贴在搜索栏下方），并给正在进行的工具收尾 */
    function watchSidebarContent() {
        const content = document.getElementById(SIDEBAR_CONTENT_ID);
        if (!content) return;
        new MutationObserver(() => {
            if (!inPinnedSidebar()) return;
            // 区块被清掉 → 里面的面板也没了，先收尾（清画布叠加与状态）
            if (!toolsSection()) closePanel();
            ensureToolsSection();   // 补挂；已锚在搜索栏下方时为空操作（内部有 anchored 判断）
        }).observe(content, { childList: true });
    }

    // 登记给侧栏布局协调器：别的区块胜出时按这套收起本区块（规则见 sidebar-refit 第 5 节）
    window.CGoSidebarRefit?.registerHighSection("tools", collapseToolsSection);

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
            document.body.appendChild(el);
            watchPanelSize(el);
        }
        const section = inPinnedSidebar() ? ensureToolsSection() : null;
        if (section) {
            // 侧栏形态：标题搬到区块标题栏（不再有层级条），面板只留正文
            el.innerHTML = `<div class="cgo-mt-body"></div>`;
            const titleEl = section.querySelector(".section-title-text");
            if (titleEl) titleEl.textContent = asHtml ? String(title).replace(/<[^>]*>/g, "").trim() : title;
        } else {
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
        }
        // 侧栏形态：把面板搬进工具区块；.cgo-mt-in-section 由 CSS 把它从「贴右下浮层」复位成区块内的普通容器。
        // 同时撤销右下留白声明——它不再吃画布空间了（侧栏自己让位）。
        if (section) {
            const body = section.querySelector(".section-body");
            if (body && el.parentElement !== body) body.appendChild(el);
            el.classList.add("cgo-mt-in-section");
            el.removeAttribute(INSET_ATTR);
            // 结果层：把「返回」补进工具自己的操作行（内容渲染完成后注入）
            if (id === PANEL_ID) watchResultActions(el);
        } else {
            if (el.parentElement !== document.body) document.body.appendChild(el);
            el.classList.remove("cgo-mt-in-section");
            el.setAttribute(INSET_ATTR, "right bottom");
        }
        return el;
    }

    function showPanel(id) {
        const el = document.getElementById(id);
        if (!el) return;
        // 侧栏形态：显示某一层 = 展开区块（并收起其余占高区块）
        if (inPinnedSidebar()) expandToolsSection();
        el.classList.add("show");
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
        state.preset = preset;   // 侧栏形态的「返回」要复用这次进来时带的预设车站
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
     * 多人汇合取**前两个** —— 路线结果进来时正好是"起点当 A、终点当 B"，于是直接出图；
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

    /** 地图最外层舞台（#map-container）：选站监听挂这里，覆盖一切落在地图上的点击
        （init 里记 lastTappedStationId 也挂在它上面，同一层） */
    function mapStage() {
        return document.getElementById("map-container");
    }

    /**
     * 从点击目标解析车站 ID。与核心同口径（`.station` / `.label-group` / `[data-sid]`，
     * 见 script.js 的右键菜单解析），再兜一层 `node_<sid>` / `label_<sid>` 的 id 形式——
     * 站点与标签的 `data-sid` 挂在**外层 div** 上，而城市侧自定义的图元（如呼出框引线、
     * 部分 SVG 图元）并不带它；只认 `[data-sid]` 会让这些点击解析不出车站，
     * 于是选站态被跳过、点击直接落到核心的「打开车站详情」（实测踩过）。
     */
    function pickStationId(target) {
        const el = target?.closest?.(".station, .label-group, [data-sid]");
        if (el?.dataset?.sid) return el.dataset.sid;
        const named = target?.closest?.("[id^='node_'], [id^='label_']");
        const matched = named?.id?.match(/^(?:node|label)_(.+)$/);
        return matched ? matched[1] : "";
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
        // 侧栏形态：点选期间把区块收起——浮层形态这里是 hidePanel 把面板藏起来，
        // 侧栏里若不收，就只剩一张展开的空卡片（实测观感很怪）
        if (inPinnedSidebar()) toolsSection()?.classList.add("collapsed");
        mapStage()?.addEventListener("click", onPickClick, true);
        emit("cgo:map-tools-picking", { tool });
    }

    /** 选站提示文案：多人汇合要连着选两次，得说清现在是第几个 */
    function showPickTip() {
        const tool = state.picking;
        if (!tool) return;
        const tip = pickTip();
        let text = `请在地图上点选一个车站（${TOOLS[tool].name}）`;
        if (tool === "meet") {
            text = state.picks.length === 0
                ? "请点选第一个车站（多人汇合）"
                : `已选 ${stationName(state.picks[0])}，请再点选一个车站`;
        }
        tip.querySelector(".cgo-mt-pick-text").textContent = text;
        tip.classList.add("show");
    }

    function stopPick() {
        if (!state.picking) return;
        state.picking = null;
        mapContent()?.classList.remove("cgo-mt-picking");
        mapStage()?.removeEventListener("click", onPickClick, true);
        document.getElementById(PICK_TIP_ID)?.classList.remove("show");
    }

    function onPickClick(event) {
        const tool = state.picking;
        if (!tool) return;
        const sid = pickStationId(event.target);
        if (!sid) return;
        // 拦下这次点击，避免同时打开车站详情面板
        event.preventDefault();
        event.stopPropagation();
        // 选不了的站（未开通、国铁散点）当没点到：不撤选站态、也不去报"不参与规划"。
        // 真实指针路径上 CSS 已经把这两类的 pointer-events 撤了、事件会穿透过去；
        // 这里兜的是"事件被别处直接派发"或将来类名变动的情形 —— 那种时候不该把选站态弄丢
        if (!isPickable(sid)) return;
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

    /**
     * 两点汇合出图期间，点地图上的第三座车站即升级成三点汇合（用户口径）。
     *
     * 这枚监听**只在"两点汇合结果正在展示"时装上**，而且只拦"加第三个人"这一种点击：
     *   - 已经三点（或换成别的工具）时不装 —— 那时点车站要恢复成核心原本的行为（打开详情）；
     *   - 点在自己身上（A / B）也不拦，那是想看看这站，不是在加人；
     *   - 选站态（state.picking）由 onPickClick 管，这里让开。
     * 拦住的那一下要 stopPropagation：否则车站详情会跟着弹出来，把汇合图顶到一边。
     */
    function onMeetAddClick(event) {
        if (state.tool !== "meet" || state.picking) return;
        const targets = state.stationId;
        if (!Array.isArray(targets) || targets.length !== 2) return;
        const sid = pickStationId(event.target);   // 与 onPickClick 同一套解析（别只认 data-sid）
        if (!sid) return;
        if (targets.includes(sid) || !isPickable(sid)) return;
        event.preventDefault();
        event.stopPropagation();
        emit("cgo:map-tools-picked", { tool: "meet", stationId: sid, stationName: stationName(sid) });
        run("meet", [targets[0], targets[1], sid]);
    }

    /** 两点汇合期间才装着那枚"点第三座车站"的监听（幂等，重复开关只动一次） */
    let meetAddBound = false;

    function syncMeetAdd(on) {
        // 与选站监听挂在同一层（#map-container）：挂在 #map-content 上会漏掉落在其它图层/图元上的点击，
        // 于是这一下既没被拦、又直接落到核心的「打开车站详情」（实测：选站那边就是这个原因）
        const host = mapStage();
        if (!host || on === meetAddBound) return;
        meetAddBound = on;
        if (on) host.addEventListener("click", onMeetAddClick, true);
        else host.removeEventListener("click", onMeetAddClick, true);
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
     * 该城该工具的**全局取值范围**，作为固定色标的锚点：
     * 等时圈的红色永远代表"**任意起终点**里最长的用时"、蓝色代表最短的，
     * 票价图的粉色永远代表"最高的票价"、黄色代表最低的，与当前选的起点无关。
     *
     * 极值由内核的 `planner.extremes()` 给出 —— 它对每座可上车车站各跑一次**跑满的**
     * Dijkstra，因此是全网的字面口径；早先"抽几个起点"的估算会低估极值，色标就锚不住，
     * 换个起点整条色带跟着漂。代价是每城几百次寻路，故按城市 + 工具缓存，同一会话只算这一回。
     */
    function referenceRange(tool, planner) {
        const key = `${activeCityId()}|${tool}`;
        if (rangeCache.has(key)) return rangeCache.get(key);
        const ext = typeof planner.extremes === "function" ? planner.extremes() : null;
        const span = ext ? (tool === "fare" ? ext.fare : ext.minutes) : null;
        const range = span && Number.isFinite(span.max) && span.max > span.min
            ? { min: span.min, max: span.max }
            : null;
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
                transferAt: config.transferAt,
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
     * 逐站取值：以起点为源寻路 —— 用时按「时间最快」，票价按「**票价最低**」
     * （票价图要画的就是最低票价），各自取结算结果。
     * 不可达（返回 null）与未开通车站跳过 —— 它们在图上是空洞，而不是某个错误的档位。
     * @returns {Promise<Map<string, number>|null>} null 表示该城市拿不到这类取值（如未配票价）
     */
    async function computeValues(tool, from, planner) {
        const list = Object.keys(stations());
        const values = new Map();
        let fareMissing = true;
        // 起点自身也要入图 —— 它是**最低档的锚点**。不留它的话，图上起点那一片是由邻站
        // 插值出来的：值被邻站抬高，距离场里它还离"最近站点"有一个站距那么远，正好落进
        // 淡化带被淡掉 —— 于是"最低档填色区"偏偏不含选定的那一站。
        // 取值口径：用时就是 0 分钟；票价按**同站进出**算 —— 刷卡进站又出站里程为 0，
        // 但地铁不会因此免费，收的是起步价（见内核 boardingFare）。
        // 只是放进值场，**不画数值图元**（renderOverlay 里已把出发点排除在叠加之外）。
        const startStation = stations()[from];
        if (startStation && startStation.type !== "no" && planner.linesAt(from).length) {
            if (tool === "fare") {
                const boarding = planner.boardingFare?.(from);
                if (Number.isFinite(boarding)) {
                    values.set(from, boarding);
                    fareMissing = false;
                }
            } else {
                values.set(from, 0);
            }
        }
        for (let i = 0; i < list.length; i += BATCH) {
            list.slice(i, i + BATCH).forEach((sid) => {
                const station = stations()[sid];
                if (!station || station.type === "no") return;
                if (sid === from) return;                       // 起点已按上面的口径单独入图
                if (!planner.linesAt(sid).length) return;       // 国铁散点等不参与规划
                // 票价图要的是**最低票价**：走 cheapestFare（内核把各优先级的候选都算出来、
                // 按实际结算票价横比取小）。只看「票价最低」那个目标是不够的 —— 它的边权是
                // 边际票价的近似（票价按计费里程分段结算、不可分解为边权和），未必真最便宜。
                // 等时圈仍按「时间最快」。
                if (tool === "fare") {
                    const fare = planner.cheapestFare?.(from, sid);
                    if (!Number.isFinite(fare)) return;
                    fareMissing = false;
                    values.set(sid, fare);
                    return;
                }
                const result = planner.plan(from, sid, "time");
                if (result && Number.isFinite(result.minutes)) values.set(sid, result.minutes);
            });
            await nextFrame();
        }
        if (tool === "fare" && fareMissing) return null;
        return values;
    }

    /**
     * 两条路径是否共乘了同一段路（同一条线路的同一区间，方向不计）。
     * 判据是「相邻站对」集合求交：只要有一段区间两人都坐过，就说明他们本可以在该区间的
     * 某一端就碰头 —— 把再往后的那一站当汇合点，等于让两人先各自跑到同一段上再并作一路，
     * 白绕一趟，不该推荐。
     */
    function shareRideSegment(planA, planB) {
        const edges = (plan) => {
            const set = new Set();
            (plan.steps || []).forEach((step) => {
                if (step.t !== "ride" || !Array.isArray(step.stops)) return;
                for (let i = 1; i < step.stops.length; i++) {
                    const x = step.stops[i - 1];
                    const y = step.stops[i];
                    set.add(`${step.line}|${x < y ? `${x}>${y}` : `${y}>${x}`}`);
                }
            });
            return set;
        };
        const first = edges(planA);
        const second = edges(planB);
        if (!first.size || !second.size) return false;
        for (const key of first) if (second.has(key)) return true;
        return false;
    }

    /**
     * 汇合图：对每座车站分别算「到各出发点的用时」，再压成一个用于着色的标量。
     *
     * 两点与三点的口径不同，这是语义上的必然：
     *   - 两点：取**有符号差值** d = tA − tB（负 = 离 A 更近、正 = 离 B 更近），
     *     色标因此是双向的，图上顺带读得出"这片区域归谁"；
     *   - 三点：三个出发点之间没有"哪边更近"可言，改取**极差** max t − min t
     *     （0 = 三人同时到），色标随之变单向（见 buildBands 的 meet3 分支）。
     *
     * 共乘过滤只对两点生效：它本意是"两人本可以在更早那一站碰头，再往后走是白绕"，
     * 这层推理只对同行的两个人成立；三个人的汇合点哪怕其中两人早已同行，对第三个人
     * 仍是实打实的碰头点，一并滤掉只会把大片城区挖空。
     *
     * @returns {Promise<{origins: string[], values: Map<string, number>,
     *   minutes: Map<string, number[]>}|null>} minutes 存各出发点用时数组，顺序同 origins
     */
    async function computeMeetValues(origins, planner) {
        const list = Object.keys(stations());
        const values = new Map();
        const minutes = new Map();
        const originSet = new Set(origins);
        for (let i = 0; i < list.length; i += BATCH) {
            list.slice(i, i + BATCH).forEach((sid) => {
                if (originSet.has(sid)) return;                         // 出发点本身没有"汇合"含义
                const station = stations()[sid];
                if (!station || station.type === "no") return;
                if (!planner.linesAt(sid).length) return;
                const plans = origins.map((from) => planner.plan(from, sid, "time"));
                if (plans.some((plan) => !plan || !Number.isFinite(plan.minutes))) return;
                if (origins.length === 2 && shareRideSegment(plans[0], plans[1])) return;
                const times = plans.map((plan) => plan.minutes);
                values.set(sid, origins.length === 2
                    ? times[0] - times[1]
                    : Math.max(...times) - Math.min(...times));
                minutes.set(sid, times);
            });
            await nextFrame();
        }
        if (!values.size) return null;
        return { origins: origins.slice(), values, minutes };
    }

    /**
     * 汇合推荐：按「最慢一方的用时 + 大家的用时差」由小到大排。
     * 前者是这趟汇合的**总代价**（所有人都得等最慢的那个），后者是**公平性**；
     * 两者相加，正好是"既要快、又要差不多同时到"的折中。
     */
    function meetPicks(meet) {
        return [...meet.minutes.entries()]
            .map(([sid, times]) => {
                const max = Math.max(...times);
                const min = Math.min(...times);
                return {
                    sid, times, max, min,
                    spread: max - min,
                    slowest: times.indexOf(max),    // 最慢的是第几个出发点（0=A / 1=B / 2=C）
                    fastest: times.indexOf(min)     // 最快的那个：三点模式下数值图元按它上色
                };
            })
            .sort((x, y) => (x.max + x.spread) - (y.max + y.spread) || x.spread - y.spread)
            .slice(0, MEET_PICKS);
    }

    /* ======================================================================
     * 色标
     * ==================================================================== */

    /* 颜色与主题墨色（hexToRgb / parseRgb / themeInk / shadeColor / scaleColor）已抽到
       tools/map-tools-color.js —— 拆巨石第 1 步。这里是**别名解构**，调用点一个都不用改；
       这几个函数只在运行期被调用（buildBands / drawMap / 结果小窗），故保留在原位置不影响时序。 */
    const { hexToRgb, parseRgb, themeInk, shadeColor, scaleColor } = window.CGoMapToolsColor;

    /**
     * 由取值集合推出档位与标尺。
     *
     * 色标锚点是**固定**的：有参照范围（`referenceRange` 估出的全城极值）时就以它为准 ——
     * 于是等时圈的红色永远对应"全网最长用时"、票价图的粉色永远对应"全网最高票价"，
     * 换个起点颜色含义不变；只有首帧还没估出参照时才退回本次数据的极值。
     *
     * 四种口径：
     *   - 票价：1 元一档铺满参照范围（金额 → 颜色恒定），每档之间都是等级线；
     *   - 等时圈：ISO_STEP 分钟一档，等级线每 EDGE_EVERY 档一条（15 分钟一组的节拍）；
     *     带「范围」控件时 `range.clip` 就是选中的上限 —— 标尺到此为止，超出部分由
     *     drawMap 直接不画（色带上限与选中项必须**字面对得上**，故这里不再走档数下限）；
     *   - 两点汇合：以差值 0 为中心的双向色标（偏 A 粉红 / 汇合带金 / 偏 B 蓝紫），
     *     量程 ±MEET_CAP，超出量程的"外带"由 drawMap 渐隐；
     *   - 三点汇合：单向色标（0 = 三人同时到 → MEET_CAP），见下面的 meet3 分支。
     *
     * 刻度一律返回 `ticks: [{ text, at }]`（at 是 0~1 的横向位置），由 renderLegend
     * 绝对定位摆放 —— 这样刻度中心能精确压在等级线上，不会各行其是。
     *
     * @param {object|null} range 参照范围 { min, max }，可另带 `clip`（等时圈选中上限）
     * @param {number} [originCount] 汇合图的出发点个数（2 = 两点，3 = 三点）
     */
    function buildBands(tool, values, range, originCount) {
        const list = [...values.values()];
        if (!list.length) return null;
        if (tool === "meet" && originCount >= 3) {
            const count = MEET_CAP / MEET_STEP;                  // 0~30 分钟，每 5 分钟一档
            const band = Math.round(MEET3_BAND / MEET_STEP);     // 汇合带（差 ≤10 分）占前两档
            return {
                kind: "meet3",
                // 色标取汇合色标的右半段（黄 → 浅蓝 → 深蓝），但**前两档钉在纯黄上**：
                // 按档位均分的话第一档就掺进了蓝，汇合带看着不再"黄"，与面板里那枚
                // 黄色图例项也对不上
                colors: Array.from({ length: count }, (_, i) => scaleColor(
                    MEET_SCALE, 0.5 + 0.5 * Math.max(0, (i + 1 - band) / Math.max(1, count - band))
                )),
                ticks: [],                            // 三点不标数值刻度，改在图例里说明两条线的含义
                edgeEvery: 2,                         // 等级线每 2 档（10 分钟）一条
                /** 汇合带那两档画实一些，其余按常规透明度 */
                alphaOf: (b) => (b < band ? MEET_BAND_BOOST : 1),
                /** 第 b 档与第 b+1 档之间的分界值（等值线标签用）：10 分、20 分… */
                cutText: (b) => `${(b + 1) * MEET_STEP}分`,
                bandOf: (v) => Math.max(0, Math.min(count - 1, Math.floor(v / MEET_STEP))),
                /** 线型：10 分那条是虚线、20 分那条是实线（与两点汇合同一套交替规则） */
                cutKind: (group) => meetCutKind(group * 2 * MEET_STEP, 2 * MEET_STEP),
                fadeStart: MEET3_OUTER,               // 外带（≤20 分）之内实画
                fadeSpan: MEET_CAP - MEET3_OUTER      // 20 → 30 渐隐，再远不画
            };
        }
        if (tool === "meet") {
            const count = (MEET_CAP / MEET_STEP) * 2;          // 正负各 MEET_CAP / MEET_STEP 档
            const zeroBand = Math.floor(MEET_CAP / MEET_STEP);  // 差值 0 落在哪一档
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
                /**
                 * 紧贴汇合带那两档（差值 −5~0 与 0~+5）画实一些 —— 那正是"两人差不多同时到"
                 * 的区域，其余档位仍按常规透明度
                 */
                alphaOf: (band) => (band === zeroBand - 1 || band === zeroBand ? MEET_BAND_BOOST : 1),
                cutText: (band) => {
                    const v = -MEET_CAP + (band + 1) * MEET_STEP;
                    return v > 0 ? `+${v}` : String(v);
                },
                bandOf: (v) => Math.max(0, Math.min(count - 1, Math.floor((v + MEET_CAP) / MEET_STEP))),
                /** 线型：0 那条黄实线、±10 白虚线、±20 白实线（线上与色标示意共用这一份） */
                cutKind: (group) => meetCutKind(-MEET_CAP + group * 2 * MEET_STEP, 2 * MEET_STEP),
                fadeStart: MEET_CAP,                           // 量程之内实画
                fadeSpan: MEET_FADE                            // 量程 → 量程 + MEET_FADE 渐隐
            };
        }
        const scale = SCALES[tool] || SCALES.iso;
        // 有锚点时两端**一律以锚点为准**，不再拿当前这张图的实测极值去顶：
        // 顶一次色标就随起点变了，而锚点的全部意义就是"整座城市固定不变"。
        // 个别值若落在锚点之外，分档会被 clamp 到首 / 末档 —— 色标本身仍是对的。
        const low = range ? range.min : Math.min(...list);
        const high = range ? range.max : Math.max(...list);
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
                // 末格必标（它撑着色标右界），但**距末端不足一个 step 的中间标注要跳过**：
                // 票价图的标注对齐在格中心（renderLegend 用 translateX(-50%)），末格与它前面那个
                // 标注的中心距 = 相隔格数 / 总格数，档位一多就可能小于一个标签宽 —— 例如 0~23 元
                // 共 24 格、step=4，「20元」与末格「23元」只隔 3 格（≈26px）而标签宽约 28px，
                // 于是叠在一起。等时圈早有一条同样作用的保护（见下方 iso 的 `i <= steps - tickEvery`），
                // 票价图漏了，此处补上，两边口径对齐。
                ticks: amounts
                    .map((v, i) => (i === last || (i % step === 0 && i <= last - step)
                        ? { text: `${v}元`, at: (i + 0.5) / amounts.length } : null))
                    .filter(Boolean),
                amounts,
                edgeEvery: 1,                 // 票价每档之间都是等级线
                /** 第 band 档与第 band+1 档之间的分界值（等值线标签用） */
                cutText: (band) => (band < amounts.length ? `${amounts[band]}元` : ""),
                bandOf: (v) => Math.max(0, Math.min(last, Math.round(v) - from))
            };
        }
        // 「范围」选中项就是色带的上限；没选过（拿不到全网极值时）才走 ISO_MIN_BANDS 那条下限 ——
        // 下限是为"量程不确定"准备的，抬上去反倒会让色带右端与选中项对不上
        const clipMax = range && Number.isFinite(range.clip) ? range.clip : null;
        const raw = clipMax != null
            ? Math.max(1, Math.ceil(clipMax / ISO_STEP))
            : Math.max(ISO_MIN_BANDS, Math.ceil(high / ISO_STEP));
        const steps = clipMax != null ? raw : Math.ceil(raw / EDGE_EVERY) * EDGE_EVERY;
        // 色系与等级线的**组宽**：默认 15 分钟一组；量程很短的（≤30 分，只有 6 档）改用 10 分钟一组 ——
        // 6 档按 15 分钟分只剩蓝、红两段色系，看着像没分档；10 分钟一组正好三段（蓝 / 绿 / 红）。
        // 组内照样按 5 分钟一档做明暗（见 shadeAt），5 分钟这个粒度没有丢
        const edgeEvery = steps <= 30 / ISO_STEP ? 2 : EDGE_EVERY;
        const cuts = [];
        for (let i = 0; i <= steps; i++) cuts.push(i * ISO_STEP);
        // 每 edgeEvery 格（正好是两条等级线之间）算一组：组内色系相同，只用明暗拉开层次 ——
        // 以组中那格为基准，首格向白提亮、末格向黑压暗。整体色阶仍是「蓝→绿→黄→红」四级大势，
        // 细看每一级里还有几档深浅，5 分钟一格这个粒度就看出来了，离散色表里也不必塞二十个色
        const groupCount = Math.max(1, Math.round(steps / edgeEvery));
        const shadeAt = (i) => (1 - (i % edgeEvery)) * ISO_SHADE;
        /**
         * 刻度间隔：段数少时与等级线同拍（每 10 / 15 分钟标一个），多了才隔一条标 ——
         * 量程被「范围」控件压到 45 / 60 分钟之后标尺只有三四段，
         * 再按"隔一条"跳着标就只剩首末两个数了。
         */
        const tickEvery = groupCount <= 5 ? edgeEvery : edgeEvery * 2;
        return {
            kind: "iso",
            colors: cuts.slice(0, steps).map((_, i) => shadeColor(
                scaleColor(scale, groupCount > 1 ? Math.floor(i / edgeEvery) / (groupCount - 1) : 0.5),
                shadeAt(i)
            )),
            // 刻度标在等级线上，但**隔一条白线**才标一个（15 分钟一条线太密，数字会挤在一起）；
            // 距末端不足一个标注间隔的那个不标，是因为末端的标注是**右对齐**的、会与它撞上；
            // 末端自己反过来要标 —— 它撑着整条色标的右界，少了它右端就没数了
            ticks: cuts
                .map((v, i) => ((i === steps || (i % tickEvery === 0 && i <= steps - tickEvery))
                    ? { text: String(v), at: i / steps } : null))
                .filter(Boolean),
            cuts,
            edgeEvery,                         // 等级线只画在每 edgeEvery 档的组界上
            cutText: (band) => (band + 1 <= steps ? `${cuts[band + 1]}分` : ""),
            bandOf: (v) => Math.min(steps - 1, Math.max(0, Math.floor(v / ISO_STEP))),
            /**
             * 超出选中上限的地方**不填色**（用户明确要求），但上限本身要**画一条等级线**：
             * drawMap 见到高于它的值就打上 CLIP_MARK 哨兵，描线那一步拿哨兵与色块的交界
             * 当一条等级线来落笔（见那里的 edgeClip）
             */
            clipMax
        };
    }

    /**
     * 汇合图的"外带"渐隐系数：1 = 照常画、0 = 不画，中间是渐隐。
     * 两点与三点的分界不同（±30 之外 / 差 >20），但都是"量程之外继续淡出"这一件事，
     * 阈值随档位对象一起给出（见 buildBands 的 fadeStart / fadeSpan）。
     */
    function outerFade(bands, value) {
        if (!Number.isFinite(bands.fadeStart)) return 1;
        const over = Math.abs(value) - bands.fadeStart;
        if (over <= 0) return 1;
        return over >= bands.fadeSpan ? 0 : fadeAt(over, 0, bands.fadeSpan);
    }

    /** 是否汇合图（两点 / 三点共用一套叠加与图例外壳，口径差异都在档位对象里） */
    const meetBands = (bands) => Boolean(bands) && bands.kind.startsWith("meet");

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

        // 等级线用「背景色外圈 + 文本色内芯」，两色得先从主题里取（canvas 读不到 CSS 变量）。
        // 这一对放在缓存判断之外：换档位会走缓存，但主题可能已经换过，两色每次都得重新取。
        const theme = themeInk();
        const inkFg = theme.fg;
        const inkBg = theme.bg;

        // 覆盖区以画布中心对齐向外扩：offset 即覆盖区左上角在画布坐标系里的位置
        const coverW = Math.ceil(width * COVER_SCALE);
        const coverH = Math.ceil(height * COVER_SCALE);
        const offsetX = -(coverW - width) / 2;
        const offsetY = -(coverH - height) / 2;

        /* ── 值场缓存 ──
           换「范围」档位时站点用时 / 票价压根没变，值场必然一模一样，重新插值纯属浪费；
           而 ① 低分辨率 IDW 插值 + ② 平滑正是换档延迟的大头（实测一次整图重绘约 2.8 秒，
           其中这两段约合一半）。命中缓存就整段跳过 ①②，只重跑 ③ 上色 —— 档位变了，
           色块必须重画，那部分省不掉。
           命中条件从严：工具、值表引用（换起点 / 换工具都会换引用）、覆盖区几何
           三者全一致才算命中；任何一项不同都重建，宁可多算一遍也不出错图。
           只缓存 ①② 的产物：fadeStart / fadeEnd 与档位无关，留在 ③ 里随用随算。
           ⚠️ 下方 else 块内的代码沿用原缩进，不再整体缩一级 —— 免得一次改动几百行。
           ⚠️ 用完必须释放（见 clearOverlay），这几个 Float32Array 合起来十几 MB。 */
        const cacheHit = state.fieldCache
            && state.fieldCache.tool === tool
            && state.fieldCache.values === values
            && state.fieldCache.coverW === coverW
            && state.fieldCache.coverH === coverH
            && state.fieldCache.offsetX === offsetX
            && state.fieldCache.offsetY === offsetY
            ? state.fieldCache : null;
        let lowW, lowH, smooth, distance, known, cell, sparseRadius, pointCount;
        if (cacheHit) {
            ({ lowW, lowH, smooth, distance, known, cell, sparseRadius, pointCount } = cacheHit);
        } else {
        const points = [];
        values.forEach((value, sid) => {
            const station = stations()[sid];
            if (!station || !Number.isFinite(station.x) || !Number.isFinite(station.y)) return;
            points.push({ x: station.x, y: station.y, v: value });
        });
        if (!points.length) return null;
        pointCount = points.length;
        lowW = Math.max(2, Math.ceil(coverW / FIELD_CELL));
        lowH = Math.max(2, Math.ceil(coverH / FIELD_CELL));
        const grid = buildGrid(points, coverW, coverH, offsetX, offsetY);
        cell = grid.cell;
        sparseRadius = grid.cell * SPARSE_RING;

        const field = new Float32Array(lowW * lowH);
        known = new Uint8Array(lowW * lowH);
        distance = new Float32Array(lowW * lowH);   // 到最近站点的距离，供距离蒙版用

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
                                    const w = idwWeight(d2, radius2);   // 支撑域外为 0，即"不存在"
                                    if (!w) continue;
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
        smooth = boxBlur(field, known, lowW, lowH, SMOOTH_PASSES);
        // ①② 的产物入缓存：③ 每轮都要读，故必须存全（用完在 clearOverlay 里释放）
        state.fieldCache = {
            tool, values, coverW, coverH, offsetX, offsetY,
            lowW, lowH, smooth, distance, known, cell, sparseRadius, pointCount
        };
        }   // ← 结束「未命中缓存」分支

        // ③ 1:1 输出：双线性上采样 + 分档上色
        const outW = coverW;
        const outH = coverH;
        const off = document.createElement("canvas");
        off.width = outW;
        off.height = outH;
        const ctxOff = off.getContext("2d");
        const image = ctxOff.createImageData(outW, outH);
        const data = image.data;
        // 0 = 未着色、否则档位 + 1、CLIP_MARK = 超出「范围」上限（描线时要当边界用）
        const bandIndex = new Uint8Array(outW * outH);
        // 距离蒙版的两道阈值：以「平均站距」（一个站点平均占多大地方）为单位
        const avgDist = Math.sqrt((coverW * coverH) / Math.max(1, pointCount));
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
                // 等时圈的「范围」上限：高于它的地方整片不填色。这里不直接跳过，而是打一个
                // 哨兵 —— 描线的下一步要把"色块 ⇄ 裁剪区"那条交界画成等级线（量程的右界）
                if (bands.clipMax != null && value > bands.clipMax) {
                    bandIndex[oy * outW + ox] = CLIP_MARK;
                    continue;
                }
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
                const outer = outerFade(bands, value);
                if (!outer) continue;
                if (outer < 1) alpha = Math.round(alpha * outer);
                // 汇合图：紧贴汇合带的那两档画实一些（见 buildBands 的 alphaOf）
                if (bands.alphaOf) alpha = Math.min(255, Math.round(alpha * bands.alphaOf(band)));
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
                // 裁剪区（CLIP_MARK）**也要落笔**：等级线以边界为中心、两侧各铺半宽，
                // 只画内侧就只剩半条（早先这里直接跳过裁剪像素，用户实测反馈"线被裁掉一半"）。
                // 它没有档位可言，只消看邻域里有没有色块
                const clippedSide = band === CLIP_MARK;
                const group = clippedSide ? -1 : groupOf(band);
                // 距组界不超过外圈半宽就落笔（线因此有厚度，缩小时也看得见）。四个方向各看一眼
                // 即可，不必扫整个邻域：两侧都会被判为边界，线自然以真实边界为中心加粗。
                // 未着色像素（bandIndex 0）不算边界 —— 色块的外缘不描线，那圈由距离蒙版自己收边；
                // 但**裁剪区算边界**：那是「范围」上限所在，用户要求这里也画一条线
                let edgeDist = Infinity;
                let edgeGroup = group;
                let edgeGroupHit = false;             // 这条边界是"跨组界"还是"到量程上限"
                for (let d = 1; d <= EDGE_SPAN_OUTER; d++) {
                    let hit = false;
                    for (let s = 0; s < 4; s++) {
                        const near = s === 0 ? (ox >= d ? bandIndex[index - d] : 0)
                            : s === 1 ? (ox + d < outW ? bandIndex[index + d] : 0)
                                : s === 2 ? (oy >= d ? bandIndex[index - d * outW] : 0)
                                    : (oy + d < outH ? bandIndex[index + d * outW] : 0);
                        if (!near) continue;
                        if (near === CLIP_MARK) {
                            // 裁剪区内部彼此不算边界，否则整片裁剪区都会被描一遍
                            if (!clippedSide) hit = true;
                            continue;
                        }
                        if (clippedSide) { hit = true; continue; }
                        const g2 = groupOf(near);
                        if (g2 === group) continue;
                        hit = true;
                        edgeGroupHit = true;
                        if (g2 > edgeGroup) edgeGroup = g2;
                    }
                    // 最近的那一圈说了算（与早先逐圈收窄的口径一致），故一命中就停
                    if (hit) { edgeDist = d; break; }
                }
                if (edgeDist === Infinity) continue;
                // 线也要跟着距离蒙版一起淡出
                const dist = sampleField(distance, lowW, lowH, (ox + 0.5) / ratio - 0.5, (oy + 0.5) / ratio - 0.5);
                if (dist >= fadeEnd) continue;
                // 等级线的线型：汇合图是「黄实线 → 白虚线 → 白实线 …」（两点从 0 往外数、
                // 三点从 0 往右数，各自的口径都在档位对象的 cutKind 里），其余工具一律白实线。
                // 虚线用一个 (ox + oy) 的周期取舍来打散，水平、垂直与斜线上都会呈现断续效果。
                // ⚠️ edgeGroup 是**较大侧**的组号，分界值就是该组的起点，
                // 别再多加一格 —— 加了会把黄线画到 −10 上去（量程一变就错位）
                const cutKind = bands.cutKind ? bands.cutKind(edgeGroup) : "solid";
                if (cutKind === "dash" && ((ox + oy) & 7) < 5) continue;
                const offset = index * 4;
                // 0 那条分界线照旧是黄色（汇合图专有，既有的线型语义）；
                // 其余按「外圈背景色、内芯文本色」两段上色，与色标示意用的是同一套
                const ink = cutKind === "zero" ? MEET_ZERO_EDGE
                    : edgeDist <= EDGE_SPAN_CORE ? inkFg : inkBg;
                data[offset] = ink[0];
                data[offset + 1] = ink[1];
                data[offset + 2] = ink[2];
                let edgeAlpha = dist <= fadeStart
                    ? EDGE_ALPHA
                    : Math.round(EDGE_ALPHA * fadeAt(dist, fadeStart, fadeEnd));
                // 等级线跟着"外带"一起淡出（阈值与填色同一套；非汇合图不取这个值，省一次采样）
                if (Number.isFinite(bands.fadeStart)) {
                    const edgeValue = sampleField(smooth, lowW, lowH, (ox + 0.5) / ratio - 0.5, (oy + 0.5) / ratio - 0.5);
                    const outer = outerFade(bands, edgeValue);
                    if (!outer) continue;
                    if (outer < 1) edgeAlpha = Math.round(edgeAlpha * outer);
                }
                data[offset + 3] = edgeAlpha;
                const x = offsetX + ox + 0.5;
                const key = `${Math.floor(x / LABEL_GAP)},${Math.floor(y / LABEL_GAP)}`;
                if (labelCells.has(key)) continue;
                labelCells.add(key);
                // 分界值：等时圈的组界取「较大的那一组」的起点分钟数（即 10 / 20 / 30 …）；
                // 若这条线是「范围」上限那条（裁剪边界），值就是**上限本身** —— 它不落在
                // 组界上时（如 105 分档里的 105）也照样要标出来
                const text = bands.kind === "iso"
                    ? `${edgeGroupHit ? edgeGroup * edgeEvery * ISO_STEP : bands.clipMax}分`
                    : bands.cutText(band - 1);
                if (!text) continue;
                // 标签只撒在未淡化的实心区：淡化带上的色块本就快看不见了，
                // 数字留在那儿会读成一串悬空的字符
                if (dist > fadeStart) continue;
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
            tool, lowW, lowH, cell, offsetX, offsetY,
            values: smooth, bands, isolines,
            // 现场插值（汇合图的悬停读数）要按与建图同一口径的支撑域来，故把两轮半径一并带出去
            radius: cell,
            sparseRadius
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
     *
     * 汇合图的数值图元标的是**最慢一方的用时**（用户口径）：色块讲的是"差多少"，
     * 而逐站看，决定"这趟汇合要花多久"的正是最慢的那个人 —— 数字与色块各说各的，
     * 互不重复。颜色取**最快一方**的语义色（A 粉 / B 蓝 / C 绿），于是"谁到得最早、
     * 最慢的人要花多久"一眼读全；两人用时相同（差值 0）时仍用汇合带的黄。
     */
    function renderOverlay(targets, values, bands, isolines, picks, meet) {
        const layer = valuesLayer();
        if (!layer) return;
        // 这个类只用来给"地形图展示期间"的样式挂钩（站名文字加背景色描边等）
        mapContent()?.classList.add("cgo-mt-terrain");
        // 先释放上一轮的让位：换起点走的是整块重绘，上一轮被隐藏、这一轮又不在隐藏名单里的
        // 图元若不在这一步还回来，就会一直停在 opacity: 0，再没人管它
        hiddenNodes.forEach((el) => el.classList.remove(HIDDEN_CLASS));
        hiddenNodes = [];
        // 悬停读数先收起来：它是"上一次绘制"的读数（比如三点汇合时那串 A/B/C），
        // 画面已经换了、鼠标还没动，留在那儿就是一句过期的话
        document.getElementById(HOVER_ID)?.classList.remove("show");
        const frag = document.createDocumentFragment();
        const meetish = meetBands(bands);
        const pickSet = new Set((picks || []).map((pick) => pick.sid));
        // 单站工具的出发点不参与让位：它要靠原图元呈现核心的选中态（markOrigin 加 .active），
        // 图元一旦被数值图元顶掉，那个态就永远看不见了 —— 汇合图的出发点另有 A / B / C 标记顶上
        const originSet = new Set(meetish ? [] : targets);
        values.forEach((value, sid) => {
            const station = stations()[sid];
            if (!station || !Number.isFinite(station.x)) return;
            if (originSet.has(sid)) return;
            const node = document.getElementById(`node_${sid}`);
            if (node) {
                node.classList.add(HIDDEN_CLASS);
                hiddenNodes.push(node);
            }
            const badge = document.createElement("span");
            // 推荐汇合站的图元单独着色（黄底深字），不另加徽标 —— 图上直接看得出来
            const classes = ["cgo-mt-badge"];
            const isPick = pickSet.has(sid);
            if (isPick) classes.push("is-pick");
            const times = meetish ? meet?.minutes.get(sid) : null;
            if (times && !isPick) {
                const fastest = times.indexOf(Math.min(...times));
                const slowest = times.indexOf(Math.max(...times));
                classes.push(fastest === slowest ? "is-zero"
                    : fastest === 0 ? "is-near-a" : fastest === 1 ? "is-near-b" : "is-near-c");
            }
            badge.className = classes.join(" ");
            // 与站点图元同口径的 data-sid：选站期间 onPickClick 在捕获阶段就靠它命中的
            badge.dataset.sid = sid;
            badge.style.left = `${station.x}px`;
            badge.style.top = `${station.y}px`;
            // 图元顶掉了原图元，点击的本事也一并接过来 —— 点它等同于点那座车站。
            // 选站期间这枚监听器不会跑到：onPickClick 在捕获阶段已经拦下并处理了
            badge.addEventListener("click", (event) => {
                event.stopPropagation();
                window.selectStation?.(sid);
            });
            // 3 位以上（如 135 分钟）在 20px 的正圆里放不下：把数字横向压扁，
            // 而不是把圆撑成椭圆 —— 图元一律保持正圆。
            // 汇合图标的是最慢一方的用时；其余工具标自身取值（差值、票价、分钟）
            const rounded = Math.round(value);
            const text = times
                ? String(Math.round(Math.max(...times)))
                : String(Math.abs(rounded));
            const inner = document.createElement("span");
            inner.style.transform = `scaleX(${Math.min(1, 2.6 / text.length)})`;
            inner.textContent = text;
            badge.appendChild(inner);
            // 这枚图元把原站点图元顶掉了（上面给它加了 HIDDEN_CLASS），原图元上的可访问名随之离线，
            // 故在同处补回。tabindex 取 -1 而非 0：与核心的车站图元同一口径 —— 等时圈 / 票价图会一次
            // 铺满上百枚图元，让它们全进 Tab 序列等于在图上造一个上百步的 Tab 陷阱；键盘用户改走
            // 车站检索与上一站 / 下一站，这里只保证读屏能念出「哪一站、读数多少」。
            badge.setAttribute("role", "button");
            badge.setAttribute("tabindex", "-1");
            badge.setAttribute("aria-label", `${station.cn || ""} ${text}`);
            frag.appendChild(badge);
        });
        // 汇合图：各出发点的原图元整个让位，位置由 A / B / C 标记顶上；
        // 标记颜色与色标两端的语义色一一对应（A 粉红、B 蓝、C 绿），一眼知道哪边是哪边
        if (meetish) {
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
                const origin = MEET_ORIGINS[i] || MEET_ORIGINS[MEET_ORIGINS.length - 1];
                addFlag(sid, origin.letter, origin.cls);
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
        /* 交叉淡入：旧图元留在原层当快照淡出，新图元在新层淡入 ——
           换范围档位 / 换起点都是整块重绘，硬替换会"啪"地跳一下，两层各 180ms 重叠
           过渡观感就连续了（时长与 map-tools.css 的 .cgo-mt-values 过渡保持一致，
           脚本这边的 240ms 只是"淡完就移除"的兜底阈值）。
           同一时刻最多留两层：连续快速换档时，更早那层立即移除，不等它自然淡完。 */
        const host = mapContent();
        const prevLayer = layer;
        const nextLayer = document.createElement("div");
        nextLayer.id = VALUES_ID;
        nextLayer.className = "cgo-mt-values is-enter";
        nextLayer.appendChild(frag);
        // id 交棒给新层，valuesLayer() 之后返回的就是它
        prevLayer.removeAttribute("id");
        if (prevLayer.childElementCount) {
            prevLayer.classList.add("is-out");
            setTimeout(() => prevLayer.remove(), 240);
        } else {
            prevLayer.remove();   // 首次出图：旧层本来就是空的，不留
        }
        host.querySelectorAll(".cgo-mt-values.is-out").forEach((el) => {
            if (el !== prevLayer) el.remove();
        });
        host.appendChild(nextLayer);
        // 必须等下一帧再摘掉入场态：同一帧内写 "0 → 1" 会被浏览器合并，过渡根本不会发生
        requestAnimationFrame(() => nextLayer.classList.remove("is-enter"));
        markOrigin(targets);
    }

    function clearOverlay() {
        clearOrigin();
        mapContent()?.classList.remove("cgo-mt-terrain");
        hiddenNodes.forEach((el) => el.classList.remove(HIDDEN_CLASS));
        hiddenNodes = [];
        // 值场缓存（几个 Float32Array 合起来十几 MB）随覆盖层一起释放，
        // 否则关掉工具后它还会一直攥着内存
        state.fieldCache = null;
        // 连正在淡出的旧层一起清（交叉淡入期间可能同时存在两层）
        mapContent()?.querySelectorAll(".cgo-mt-values").forEach((el) => el.remove());
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

    /**
     * 反距离加权在支撑域内的窗口权重：`t = 1 − d²/R²`，权重取 `t² / d⁴`
     * （Shepard 的 1/d⁴ 再乘一道在半径处归零的窗口）。返回 0 即"支撑域外、不参与"。
     * 建图的值场与汇合图悬停的现场插值都用这一份 —— 两处口径必须一致，否则读数与色块会对不上。
     */
    function idwWeight(d2, radius2) {
        const t = 1 - d2 / radius2;
        return t <= 0 ? 0 : (t * t) / (d2 * d2 + 1e-6);
    }

    /**
     * 汇合图悬停读数用：在给定画布坐标处现场插一次"到各出发点各多久"。
     *
     * 不只是省事 —— 各出发点的用时是**站点属性**，插值才有"场内大致数值"；
     * 而悬停是逐次单点查询，现场算一遍即可，不必为它单独建一整张场。
     * 支撑域照搬建图的两轮（先一个格子边长，稀疏角落再放宽到两个格子边长），
     * 两轮都取不到站点时退回最近那一站的值，与建图的处理一致。
     *
     * @param {Array<{x:number,y:number,t:number[]}>} points
     * @returns {number[]|null} 各出发点用时的数组，顺序同 points[].t
     */
    function sampleMeetTimes(points, x, y, denseRadius, sparseRadius) {
        for (const radius of [denseRadius, sparseRadius]) {
            const radius2 = radius * radius;
            const sums = new Array(points[0]?.t.length || 0).fill(0);
            let den = 0;
            points.forEach((point) => {
                const dx = point.x - x;
                const dy = point.y - y;
                const w = idwWeight(dx * dx + dy * dy, radius2);
                if (!w) return;
                point.t.forEach((time, i) => { sums[i] += w * time; });
                den += w;
            });
            if (den > 0) return sums.map((sum) => sum / den);
        }
        let nearest = null;
        let nearestD2 = Infinity;
        points.forEach((point) => {
            const dx = point.x - x;
            const dy = point.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < nearestD2) { nearestD2 = d2; nearest = point; }
        });
        return nearest ? nearest.t.slice() : null;
    }

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
        // ⚠️ 分辨率必须用值场格宽 FIELD_CELL：field.cell 是建桶用的分桶格宽（几十上百 px），
        // 拿它换算会把 fx/fy 恒压在值场左上角一格附近，tooltip 于是永远读到同一个值。
        const mapX = (event.clientX - rect.left) / scale;
        const mapY = (event.clientY - rect.top) / scale;
        const fx = (mapX - field.offsetX) / FIELD_CELL - 0.5;
        const fy = (mapY - field.offsetY) / FIELD_CELL - 0.5;
        if (fx < 0 || fy < 0 || fx > field.lowW - 1 || fy > field.lowH - 1) {
            tip.classList.remove("show");
            return;
        }
        const value = sampleField(field.values, field.lowW, field.lowH, fx, fy);
        const band = field.bands.bandOf(value);
        const rgb = field.bands.colors[band] || [255, 255, 255];
        // 读数文案：`main` 自带颜色（各工具的口径不同），`unit` 跟在后面
        const tool = field.tool;
        let main;
        let unit;
        if (tool === "fare") {
            main = `<b style="color:${brighten(rgb)}">${field.bands.amounts[band]}</b>`;
            unit = "元";
        } else if (tool === "meet") {
            // 读数给各出发点的**各自用时** —— 色块那个差值是插出来的连续场，而"到 A / B / C
            // 各多久"是站点属性；故在指针处现场插一次（权重与建图同一套），读数随位置连续变化。
            // 字母按出发点的语义色上色（深色胶囊上要提亮），与图上标记、色标对得上
            const times = field.meetPoints
                ? sampleMeetTimes(field.meetPoints, mapX, mapY, field.radius, field.sparseRadius)
                : null;
            if (times) {
                main = times.map((time, i) => {
                    const origin = MEET_ORIGINS[i] || MEET_ORIGINS[MEET_ORIGINS.length - 1];
                    return `<b style="color:${brighten(hexToRgb(origin.color))}">${origin.letter} ${Math.round(time)}</b>`;
                }).join(" · ");
                unit = "分钟";
            } else {
                // 兜底：没拿到各人的用时（数据缺失等），退回差值读法
                main = `<b style="color:${brighten(rgb)}">${Math.round(Math.abs(value))}</b>`;
                unit = `分钟 · ${field.bands.kind === "meet3" ? "三人用时差"
                    : value < 0 ? "离 A 更近" : "离 B 更近"}`;
            }
        } else {
            main = `<b style="color:${brighten(rgb)}">${Math.round(value)}</b>`;
            unit = "分钟";
        }
        tip.querySelector(".cgo-mt-hover-dot").style.background = `rgb(${rgb.join(",")})`;
        tip.querySelector(".cgo-mt-hover-text").innerHTML =
            `${tool === "fare" ? "预计 " : ""}${main} ${unit}`;
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
     * 结果小窗（标题栏 + 图例 + 重新选站）
     * ==================================================================== */

    function openPanel(tool, name, titleHtml) {
        const el = shell(PANEL_ID, titleHtml || TOOLS[tool].title(name), closePanel, !!titleHtml);
        el.querySelector(".cgo-mt-body").innerHTML =
            '<div class="cgo-mt-loading"><cgo-icon name="loading" size="16"></cgo-icon>正在计算…</div>';
        showPanel(PANEL_ID);
        return el;
    }

    /**
     * 推荐条目右侧的用时说明：两点列 A / B 与差值；三点只列三人的用时 ——
     * 三点排序靠的正是差值，但面板就这么宽，再挤一个"差 N 分"会把站名压没。
     * 字母一律按出发点的语义色上色，与图上标记、色标对得上。
     */
    function pickTimesText(pick) {
        const parts = pick.times.map((time, i) => {
            const origin = MEET_ORIGINS[i] || MEET_ORIGINS[MEET_ORIGINS.length - 1];
            return `<b class="cgo-mt-or ${origin.cls}">${origin.letter}</b> ${Math.round(time)}`;
        });
        if (pick.times.length <= 2) {
            parts.push(`差 ${Math.round(pick.spread)} 分`);
            return parts.join(" · ");
        }
        return `${parts.join(" · ")} 分`;
    }

    /**
     * 汇合图的标题：两点沿用「甲 ⇄ 乙」；三点改成 A / B / C 三个语义色字母打头 ——
     * 字母与图上标记、悬停读数一一对应，站名太长时由标题栏自己省略。
     */
    function meetTitle(targets) {
        if (targets.length <= 2) {
            return `${esc(stationName(targets[0]))}<cgo-icon name="vi-way" size="15" class="cgo-mt-way"></cgo-icon>`
                + `${esc(stationName(targets[1]))} 汇合图`;
        }
        const names = targets.map((sid, i) => {
            const origin = MEET_ORIGINS[i] || MEET_ORIGINS[MEET_ORIGINS.length - 1];
            return `<b class="cgo-mt-or ${origin.cls}">${origin.letter}</b>${esc(stationName(sid))}`;
        });
        return `${names.join('<span class="cgo-mt-or-sep">·</span>')} 汇合图`;
    }

    /**
     * 「最近 10 站」：按**用时**升序取前 NEAR_COUNT 座（起点自身那个 0 分钟不算）。
     * 取用时而不是直线距离 —— 用户问的是"多久能到"，直线距离只在两站相邻时才等于用时。
     */
    function nearestStations(values) {
        return [...values.entries()]
            .filter(([, value]) => value > 0)
            .sort((x, y) => x[1] - y[1])
            .slice(0, NEAR_COUNT)
            .map(([sid, value]) => ({ sid, value }));
    }

    /**
     * 图例：色带 + 刻度，外加各工具自己的补充块（等时圈的「范围」与「最近 10 站」、
     * 汇合图的推荐列表与「移除 C」）。
     * 刻度用绝对定位摆在各等级线的位置上（`tick.at` 是 0~1 的位置），
     * 而不是靠 flex 均分 —— 均分只能让两端的标签贴边，中间那些会与白线错开。
     *
     * 三点汇合**不画色带**：三个出发点之间没有"哪边更近"，色标是单向的，标数值刻度只会
     * 让人误读；改成用两枚图例项说清 10 分（虚线）与 20 分（实线）两条线的含义 ——
     * 线型与图上完全一致（见 buildBands 的 cutKind）。
     *
     * @param {object} [view] 本次绘制的一整套输入（paint 存进 state.view）；
     *   缺省即"重画一遍当前的" —— 折叠最近车站、换范围档位都靠它，不必重算数据。
     */
    function renderLegend(view = state.view) {
        if (!view) return;
        const { panel, bands, meet, targets, picks } = view;
        const body = panel.querySelector(".cgo-mt-body");
        const meetish = meetBands(bands);
        const three = bands.kind === "meet3";
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
                    <div class="cgo-mt-meet-title">推荐汇合站（按较慢用时 + 时间差）</div>
                    ${(picks || []).map((pick, i) => `
                        <button type="button" class="cgo-mt-meet-item" data-meet-sid="${pick.sid}">
                            <span class="cgo-mt-meet-rank">${i + 1}</span>
                            <span class="cgo-mt-meet-name">${stationName(pick.sid)}</span>
                            <span class="cgo-mt-meet-time">${pickTimesText(pick)}</span>
                        </button>
                    `).join("")}
                </div>
            `;
        }

        // 两点汇合：明写"再点一个车站即可加入第三人" —— 那是升级三点汇合的入口，
        // 不说出来没人会知道图上还能再点一下（点了就会加载 A/B/C 三点汇合图）
        const hintHtml = meet && targets.length === 2 ? `
            <p class="cgo-mt-hint">
                <cgo-icon name="location" size="14"></cgo-icon>在地图上再点一个车站，加入第三人一起算
            </p>
        ` : "";

        // 等时圈：范围分段控件（色带上限 = 选中项）。末档是「最长」—— 它是个变量而非常量，
        // 直接标"最长"二字，具体多少分钟放在 title 里，免得一串数字把它混进常量档里
        const iso = view.iso;
        const rangeHtml = iso ? `
            <div class="cgo-mt-range">
                <span class="cgo-mt-range-label">范围</span>
                <div class="cgo-mt-range-opts">
                    ${iso.options.map((v) => {
                        const longest = v === iso.longest;
                        return `
                        <button type="button" class="cgo-mt-range-opt${v === iso.selected ? " is-on" : ""}"
                            data-range="${v}" title="${longest ? `本城最长时间约 ${v} 分` : `范围到 ${v} 分`}"
                            >${longest ? "最长" : `${v} 分`}</button>
                    `;
                    }).join("")}
                </div>
            </div>
        ` : "";

        // 等时圈：最近 10 站（按钮 + 展开后的列表）
        const near = view.tool === "iso" ? view.nearest : null;
        const nearListHtml = near && view.nearestOpen ? `
            <div class="cgo-mt-near">
                ${near.map((item) => `
                    <button type="button" class="cgo-mt-near-item" data-sid="${item.sid}">
                        <span class="cgo-mt-near-name">${esc(stationName(item.sid))}</span>
                        <span class="cgo-mt-near-time">${Math.round(item.value)} 分</span>
                    </button>
                `).join("")}
            </div>
        ` : "";

        // 超范围示意：色带右端那段斜纹说明"高于选中上限的地方不填色"（上限本身仍画等级线）。
        // 选中的就是「最长」那一档时不必画：全网再没有更远的站，斜纹没有可指的东西
        const clipped = Number.isFinite(bands.clipMax) && !(iso && iso.selected >= iso.longest);
        const overHtml = clipped
            ? `<span class="cgo-mt-over" title="高于 ${bands.clipMax} 分：不填色，上限处画一条等级线"></span>`
            : "";
        const legendHtml = three ? `
            <div class="cgo-mt-keys">
                <span class="cgo-mt-key"><i class="cgo-mt-key-mark is-dash"></i>汇合带：差 ≤${MEET3_BAND} 分</span>
                <span class="cgo-mt-key"><i class="cgo-mt-key-mark is-solid"></i>外带：差 ≤${MEET3_OUTER} 分</span>
            </div>
        ` : `
            <div class="cgo-mt-legend">
                <div class="cgo-mt-scale">
                    <div class="cgo-mt-scale-main">
                        <div class="cgo-mt-band">
                            ${bands.colors.map((rgb, i) => {
                                let cls = "";
                                if (i > 0 && i % edgeEvery === 0) {
                                    const kind = bands.cutKind
                                        ? bands.cutKind(i / edgeEvery)
                                        : "solid";
                                    cls = kind === "zero" ? "cgo-mt-cutzero"
                                        : kind === "dash" ? "cgo-mt-cutdash" : "cgo-mt-cut";
                                }
                                return `<i${cls ? ` class="${cls}"` : ""} style="background:rgb(${rgb.join(",")})"></i>`;
                            }).join("")}
                        </div>
                        <div class="cgo-mt-ticks">${ticks}</div>
                    </div>
                    ${overHtml}
                </div>
                ${meetish ? `<div class="cgo-mt-ends"><span>${stationName(targets[0])} 更近</span><span class="cgo-mt-ends-mid">汇合带</span><span>${stationName(targets[1])} 更近</span></div>` : ""}
            </div>
        `;

        body.innerHTML = `
            ${legendHtml}
            ${rangeHtml}
            ${picksHtml}
            ${hintHtml}
            <div class="cgo-mt-actions">
                <button type="button" class="cgo-mt-quick" data-act="repick">
                    <cgo-icon name="location" size="14"></cgo-icon>重新选站
                </button>
                ${near ? `
                    <button type="button" class="cgo-mt-quick" data-act="nearest">
                        <cgo-icon name="${view.nearestOpen ? "chevron-up" : "chevron-down"}" size="14"></cgo-icon>最近 10 站
                    </button>
                ` : ""}
                ${three ? `
                    <button type="button" class="cgo-mt-quick" data-act="drop-c">
                        <cgo-icon name="arrow-left" size="13"></cgo-icon>移除 C
                    </button>
                ` : ""}
            </div>
            ${nearListHtml}
        `;
        body.querySelector('[data-act="repick"]').addEventListener("click", () => {
            if (state.tool) startPick(state.tool);
        });
        body.querySelector('[data-act="nearest"]')?.addEventListener("click", () => {
            // 纯界面折叠，数据没变 —— 重画图例即可，不必再算一遍值场
            view.nearestOpen = !view.nearestOpen;
            state.nearOpen = view.nearestOpen;
            renderLegend(view);
        });
        body.querySelector('[data-act="drop-c"]')?.addEventListener("click", () => {
            // 退回两点：A、B 不动，只把 C 摘掉（与"点第三座车站"进来的路对称）
            const origins = state.last?.targets;
            if (origins && origins.length >= 3) run("meet", origins.slice(0, 2));
        });
        body.querySelectorAll("[data-range]").forEach((btn) => {
            btn.addEventListener("click", () => applyIsoRange(Number(btn.dataset.range)));
        });
        body.querySelectorAll("[data-meet-sid]").forEach((btn) => {
            btn.addEventListener("click", () => window.selectStation?.(btn.dataset.meetSid));
        });
        body.querySelectorAll(".cgo-mt-near-item").forEach((btn) => {
            btn.addEventListener("click", () => window.selectStation?.(btn.dataset.sid));
        });
    }

    function renderNotice(panel, text) {
        panel.querySelector(".cgo-mt-body").innerHTML = `<p class="cgo-mt-notice">${text}</p>`;
    }

    function closePanel() {
        const tool = state.tool;
        stopPick();
        syncMeetAdd(false);
        hidePanel(PANEL_ID);
        clearCanvas();
        clearOverlay();
        state.tool = null;
        state.stationId = null;
        state.targetKey = null;
        state.picks = [];
        state.field = null;
        state.last = null;
        state.view = null;
        state.rangeQueued = false;
        // 本来就没开着（如点工具按钮时顺手收一遍）就不必报一次空事件
        if (tool) emit("cgo:map-tools-closed", { tool });
        // 侧栏形态：关掉工具即收起区块（浮层形态没有区块，此段空操作）。
        // 标题一并复位——它会被各层改写成当前工具名（如「票价图」），画布都清空了还挂着旧名，
        // 会让人以为工具仍在、还能接着展开（用户反馈）。
        if (inPinnedSidebar() && toolsSection()) {
            const section = toolsSection();
            section.classList.add("collapsed");
            const titleEl = section.querySelector(".section-title-text");
            if (titleEl) titleEl.textContent = SECTION_TITLE;
        }
    }

    function clearCanvas() {
        document.getElementById(CANVAS_ID)?.remove();
    }

    /* ======================================================================
     * 一次完整流程
     * ==================================================================== */

    /**
     * 等时圈的「范围」：候选档位与当前选中值。
     * 候选 = 常量档（ISO_RANGES）里**不超过本城最长时间**的那些，末位补上"最长"那一档；
     * 高于最长时间的常量档一律不显示（小城里选 90 分等于整张图都在量程内，那一档没有意义）。
     * 拿不到全网极值时返回 null —— 没有控件，标尺退回旧口径，不凭空造一个档位出来。
     */
    function isoRangeState(span) {
        if (!span || !Number.isFinite(span.max) || span.max <= 0) return null;
        // 「最长」向上取到 5 分钟的整数倍：色带上限 = 末档的上界，两者必须字面对得上
        const longest = Math.max(ISO_STEP, Math.ceil(span.max / ISO_STEP) * ISO_STEP);
        const options = ISO_RANGES.filter((v) => v < longest);
        options.push(longest);
        const selected = options.includes(state.isoRange) ? state.isoRange
            : options.includes(ISO_RANGE_DEFAULT) ? ISO_RANGE_DEFAULT : longest;
        state.isoRange = selected;
        return { options, selected, longest };
    }

    /**
     * 把一整套输入画出来：分档 → 值场 → 图上叠加 → 图例。
     * 换「范围」档位走的是同一条路（值本身没变，只是色带上限变了），
     * 故这里不接受"半成品"输入，画什么全部从 view 里取。
     */
    async function paint(view) {
        const guard = () => state.tool === view.tool && state.targetKey === view.key;
        // 等时圈：范围控件决定色带上限；没有控件（拿不到极值）时退回旧口径
        const iso = view.tool === "iso" ? isoRangeState(view.span) : null;
        const range = view.tool === "iso"
            ? (iso ? { min: 0, max: iso.selected, clip: iso.selected } : view.span)
            : view.span;
        const bands = buildBands(view.tool, view.values, range, view.targets.length);
        if (!bands) { renderNotice(view.panel, "没有可用的分档数据。"); return false; }
        const field = await drawMap(view.tool, view.values, bands, guard);
        if (!field || !guard()) return false;
        // 汇合图的悬停读数要"到 A / B / C 各多久" —— 那是站点属性，插值才有场内的大致数值。
        // 这里把站点连同各人的用时铺成数组，悬停时按与建图同一套权重现场插一次即可，
        // 不必为它单独建一整张场（悬停本来就是逐次单点查询）。
        if (view.meet) {
            field.meetPoints = [];
            view.meet.minutes.forEach((times, sid) => {
                const station = stations()[sid];
                if (!station || !Number.isFinite(station.x) || !Number.isFinite(station.y)) return;
                field.meetPoints.push({ x: station.x, y: station.y, t: times });
            });
        }
        state.field = field;
        const picks = view.meet ? meetPicks(view.meet) : [];
        state.view = {
            ...view,
            bands,
            picks,
            iso,
            nearest: view.tool === "iso" ? nearestStations(view.values) : null,
            nearestOpen: state.nearOpen
        };
        // 两点汇合出图期间才挂"点第三座车站"的监听（见 onMeetAddClick）
        syncMeetAdd(view.tool === "meet" && view.targets.length === 2);
        renderOverlay(view.targets, view.values, bands, field.isolines, picks, view.meet);
        renderLegend();
        return true;
    }

    /**
     * 换「范围」档位：值没变，故只重分档重绘，不再算一遍全网寻路。
     * 正在画的时候又点了一下，就记在 rangeQueued 上等这一轮画完补一轮 ——
     * 直接并发两轮的话，两幅画面会互相盖，先落笔的那幅反而可能把后点的那档顶掉。
     */
    function applyIsoRange(value) {
        if (state.tool !== "iso" || !state.last) return;
        state.isoRange = value;
        if (state.view?.iso) state.view.iso.selected = value;
        renderLegend();                      // 先让选中态跟手，地图随后重绘
        if (state.busy) { state.rangeQueued = true; return; }
        repaint();
    }

    /** 用上一次的输入重绘一遍（换范围档位用） */
    async function repaint() {
        const last = state.last;
        const panel = document.getElementById(PANEL_ID);
        if (!last || !panel) return;
        state.busy = true;
        try {
            await paint({ ...last, panel });
        } catch (err) {
            renderNotice(panel, (err && err.message) || "重绘失败，请稍后重试。");
        } finally {
            state.busy = false;
            drainRangeQueue();
        }
    }

    /** 重绘期间又被点了一下：这里补上那一轮，否则最后那一下会落空 */
    function drainRangeQueue() {
        if (!state.rangeQueued) return;
        state.rangeQueued = false;
        repaint();
    }

    async function run(tool, target) {
        if (state.busy) return;
        state.busy = true;
        state.tool = tool;
        // 单站工具传一段 id，汇合图传 [A, B]（点第三座车站后是 [A, B, C]）
        const targets = Array.isArray(target) ? target.slice() : [target];
        state.stationId = Array.isArray(target) ? targets : target;
        const targetKey = targets.join("|");
        state.targetKey = targetKey;
        const name = targets.map(stationName).join(" ⇄ ");
        const titleHtml = tool === "meet" ? meetTitle(targets) : null;
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
                meet = await computeMeetValues(targets, planner);
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
            const span = tool === "meet" ? null : await referenceRange(tool, planner);
            if (!alive()) return;
            // 记下这一轮的输入：换「范围」档位、折叠最近车站都按它重绘，不必再算一遍值
            state.last = { tool, key: targetKey, targets, values, meet, span };
            const painted = await paint({ ...state.last, panel });
            if (!painted || !alive()) return;
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
            drainRangeQueue();
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
     * 若一并让位就再也看不到色标与「重新选站」了；两者位置不同，共存完全放得下。
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

    /**
     * 面板上的小工具入口按钮：与面板自带的「分享」按钮同款（同一处、同样式）。
     *
     * 参数给的是**宿主面板的 id**，不是当时算好的预设车站 —— 预设必须在点下的那一刻现取：
     * 面板内容常被核心就地重写（换个车站、重新规划），而按钮是复用的、不会跟着重建，
     * 注入时捕获进闭包的那份就会一直拿着旧站不放 —— "偶发没跟上当前车站"就是这么来的。
     */
    function shareLikeButton(hostId) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `panel-share-btn ${TOOL_BTN_CLASS}`;
        btn.title = "地图小工具";
        btn.innerHTML = '<cgo-icon name="plugin" size="20"></cgo-icon>';
        btn.addEventListener("click", (event) => {
            // 拦下这次点击，别让面板把事件当成"点了别处"而收起
            event.preventDefault();
            event.stopPropagation();
            const preset = hostId === INFO_PANEL_ID
                ? activeStationId()
                : [lastRoute.from, lastRoute.to];
            // 窄屏上本模块浮层与其它浮层互斥，故先把宿主面板收起来让位；
            // 桌面端共存，保持面板开着（用户要求侧边栏模式下也能看到色标与「重新选站」）
            if (window.innerWidth <= MOBILE_MAX) closeHostPanel();
            openTools(preset);
        });
        return btn;
    }

    /**
     * 收起移动端在场的宿主浮层：车站详情、路线结果，以及**行程规划面板**。
     *
     * 顺序与轮次都有讲究 —— 行程规划面板在结果面板之下时是被 `cgo-rt-stacked-hidden`
     * 压住的（`display: none`，其关闭按钮 `offsetParent` 为 null，点不着）。若先关它、
     * 后关结果，关掉结果会把规划从栈下还原出来，于是就成了"点小工具反而弹出规划浮窗"。
     * 所以：先关栈上可见的那几块，再补一轮把因此还原出来的收干净。
     * 一律复用它们各自的关闭按钮，不改核心与 route-panel 的代码。
     */
    function closeHostPanel() {
        for (let pass = 0; pass < 2; pass++) {
            [INFO_PANEL_ID, RESULT_PANEL_ID, PLAN_PANEL_ID].forEach((id) => {
                const close = document.querySelector(`#${id} .panel-close-btn`);
                if (close instanceof HTMLElement && close.offsetParent !== null) close.click();
            });
        }
    }

    /**
     * 最近一次行程规划的起讫站。route-panel 在打开面板与规划完成时都会广播，
     * 从路线结果面板开小工具时用它们当预设 —— 单站工具用起点站，多人汇合用起点当 A、终点当 B。
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
            if (!host) return;
            const preset = id === INFO_PANEL_ID
                ? activeStationId()
                : [lastRoute.from, lastRoute.to];
            const exists = host.querySelector(`.${TOOL_BTN_CLASS}`);
            // 车站详情说的是未开通 / 规划中的车站时不给入口：规划器不收它，任何工具点下去
            // 都只会得到一句"不参与规划"，索性别把按钮摆出来（已注入的要收掉，
            // 免得用户在图上换选了未开通站、面板重渲染后旧按钮还赖在那里）
            if (id === INFO_PANEL_ID && isPlanned(preset)) {
                exists?.remove();
                return;
            }
            if (exists) return;
            // 传给按钮的是面板 id 而非算好的站：预设由按钮在点下的那一刻现取（见 shareLikeButton）
            share.insertAdjacentElement("afterend", shareLikeButton(id));
        });
    }

    /* ── 车站右键菜单上的两条入口 ──────────────────────────────────────
       core 的右键菜单每次右键都整体重写 innerHTML，菜单 DOM 里也不记录车站 ID。
       故这里自己记下这次右键落在哪座车站（判定口径与 core 的 showMenu 一致），
       再在菜单内容重建之后补两条入口 —— 不改 core，也不让 core 知道本模块存在。 */
    const CTX_MENU_ID = "custom-context-menu";
    const CTX_BTN_CLASS = "cgo-mt-ctx-btn";
    let ctxObserver = null;
    let ctxStationId = null;

    function decorateContextMenu() {
        const menu = document.getElementById(CTX_MENU_ID);
        // 菜单每次右键都会整块重写，重写后按类名判重即可
        if (!menu || menu.querySelector(`.${CTX_BTN_CLASS}`)) return;
        const sid = ctxStationId;
        if (!sid || !stations()[sid] || isPlanned(sid)) return;
        menu.insertAdjacentHTML("beforeend", `
            <div class="ctx-divider">工具</div>
            <button type="button" class="ctx-menu-btn ${CTX_BTN_CLASS}" data-ctx="to">
                <cgo-icon name="arrive" size="16"></cgo-icon> 设为终点
            </button>
            <button type="button" class="ctx-menu-btn ${CTX_BTN_CLASS}" data-ctx="tools">
                <cgo-icon name="plugin" size="16"></cgo-icon> 地图小工具
            </button>
        `);
        // 行程规划是路线模块的能力，这里只调它的公开入口，不碰它的内部状态
        menu.querySelector('[data-ctx="to"]')?.addEventListener("click", () => {
            window.CGoRoutePanel?.open?.({ to: sid });
        });
        menu.querySelector('[data-ctx="tools"]')?.addEventListener("click", () => openTools(sid));
    }

    /**
     * 菜单元素是 core 懒创建的，等它出现再盯它。除了内容重写（每次右键都会整块重写），
     * 还要盯 style —— 触屏长按那条路是 core 自己起计时器直接调 showMenu，只改 style.display
     * 而不重写内容，只盯 childList 会漏掉，注入就得等到下一次才生效。
     */
    function watchContextMenu() {
        const menu = document.getElementById(CTX_MENU_ID);
        if (!menu || ctxObserver) return;
        ctxObserver = new MutationObserver(decorateContextMenu);
        ctxObserver.observe(menu, { childList: true, attributes: true, attributeFilter: ["style"] });
        decorateContextMenu();
    }

    /**
     * 记住这次点 / 长按落在哪座车站。
     *
     * 不能只听 `contextmenu`：触屏长按在多数浏览器里根本不派发这个事件，core 是自己起
     * 计时器直接调 showMenu 的 —— 只认它就会一直沿用上一次的车站，于是"这次该出现的
     * 入口要等下次右键才生效"。`pointerdown` 是鼠标右键与触屏长按共有的起点，故以它为准，
     * `contextmenu` 留作桌面端的补正。
     */
    function trackContextTarget() {
        const remember = (event) => {
            ctxStationId = event.target.closest?.(".station, .label-group, [data-sid]")?.dataset.sid || null;
        };
        window.addEventListener("pointerdown", remember, true);
        window.addEventListener("contextmenu", remember, true);
    }

    /**
     * 主题（亮/暗）一换，地形图上那些**已经画进 canvas 的东西**就得重来一遍：
     * 色阶本身与主题无关，但等级线是「背景色描边 + 文本色内芯」，两色都在建图时从
     * CSS 变量里取出来写进像素了，不跟着变量走 —— 不重画的话，换了主题线还是旧配色。
     * 色标与站名描边走的是 CSS，自己会跟随，不用管。
     *
     * 重画走的是完整的一遍 `run`（会重算值场），故按一帧节流：切主题常常连着改
     * 好几个属性，没必要每一下都重来一遍。
     */
    function watchTheme() {
        let queued = false;
        new MutationObserver(() => {
            if (queued || !state.tool) return;
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                if (state.tool && state.stationId) run(state.tool, state.stationId);
            });
        }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    /**
     * 盯住三块面板：显隐、被面板栈压到栈下、形态迁移与整块重建都落在 class / style 上。
     * 只为这三块面板绑观察器（不监听 body 全子树）—— 地图自身的节点变动远比这频繁。
     * body 只盯直接子节点，用于在面板新建 / 搬家 / 拆除后重新绑定。
     */
    function onPanelChange() {
        watchPanels();
        watchContextMenu();
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
        // 固定侧栏形态：盯住 #legend-content，核心重渲后把「地图小工具」区块补挂回去
        watchSidebarContent();
        // 悬停读数挂在容器上：画布自身 pointer-events: none，地图的拖拽与缩放照常
        const container = document.getElementById("map-container");
        container?.addEventListener("mousemove", onHover);
        container?.addEventListener("mouseleave", () => document.getElementById(HOVER_ID)?.classList.remove("show"));
        // 缩放后旧位置已不对应新画面，先收起来，等鼠标再动时按新坐标重算
        container?.addEventListener("wheel", () => document.getElementById(HOVER_ID)?.classList.remove("show"));
        // 记住最近点到的车站：详情面板说的是哪一站、要不要给小工具入口，都以此为准
        // （.active 可能同时挂在好几站上，见 activeStationId 的注释）
        container?.addEventListener("click", (event) => {
            const sid = event.target.closest?.("[data-sid]")?.dataset.sid;
            if (sid && stations()[sid]) lastTappedStationId = sid;
        }, true);
        // 与其它浮层的关系：让位、给车站详情 / 路线结果补入口按钮、给右键菜单补两条
        watchRoute();
        trackContextTarget();
        watchTheme();
        onPanelChange();
        // 右上角「更多」菜单里的入口（工具列表面板是固定浮层，不依赖锚点）
        registerMenuEntry();
        bodyObserver.observe(document.body, { childList: true });
        window.addEventListener("resize", scheduleStacking);
    }

    /**
     * 右上角「更多」菜单里的「地图小工具」入口。
     *
     * 工具列表面板本身是贴右下角的固定浮层（`.cgo-mt-panel`），**不依赖锚点元素**，
     * 所以从菜单进来同样可用：没有预设车站，选定工具后在地图上点站即可。
     * 位置对齐母产品的菜单顺序（工具在最前），故插在「偏好设置」之前。
     */
    function registerMenuEntry() {
        const content = document.querySelector(".options-dropdown .dropdown-content");
        if (!content || content.querySelector(`#${MENU_ENTRY_ID}`)) return;
        const entry = document.createElement("a");
        entry.href = "javascript:void(0)";
        entry.id = MENU_ENTRY_ID;
        entry.innerHTML = `<cgo-icon name="plugin"></cgo-icon><span>地图小工具</span>`;
        entry.addEventListener("click", () => openTools());
        const anchor = content.querySelector("#settings-btn");
        if (anchor) anchor.insertAdjacentElement("beforebegin", entry);
        else content.prepend(entry);
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
