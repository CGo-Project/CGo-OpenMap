/**
 * CGo OpenMap - 呼和浩特蒙文站名（画布站名标签）
 * (city/hohhot/modules/hohhot_mongolian.js)
 *
 * 城市私有模块：给站名标签注入竖排蒙文，**不改动 core**。
 *
 * 字体策略（两段式）：
 *   1. 先探测**系统能否渲染蒙文**（判据见 fontUsable：同一字体栈下比较蒙文探针串与
 *      等长私用区缺字串的宽度，含 sans-serif 回退 —— 只按字体名逐个比对会误判，
 *      实测把 Windows 与 Android 都判成「没有蒙文字体」，详见该函数注释）；
 *   2. 系统不能时按需从 CDN 加载 Noto Sans Mongolian（fonts.loli.net，与 main.html
 *      引 Arimo / Noto Sans SC 用的是同一个镜像，CN 可达），等字体真正就绪后再注入；
 *   3. 两段都拿不到（离线 / 镜像不可达）时**整体不注入**并在控制台说明 ——
 *      此时浏览器会回落成**不连写的假蒙文**（一个字母一个字母断开，不是方块豆腐，
 *      肉眼很难判断是渲染失败），宁可不显示，也不要给出错的字形。
 *
 * 排版机制：
 *   1. 引擎渲染 labels-layer 后，为每座带 `mn` 的车站注入
 *      `<span class="hohhot-mn" lang="mn-Mong">`，插在**中文行与英文行之间**
 *      （官方标识的次序即「中文 → 蒙文 → 英文」）；它自成一行，左右位置跟随
 *      容器的 text-align（即跟随中文 / 英文的对齐），列首由 `vertical-align: top`
 *      贴住行顶。样式见 city/hohhot/style.css；
 *   2. 高度**固定**为 1.5 个汉字高（17.25px），它同时就是换列上限：超出的部分由
 *      `vertical-lr` 按词换列（块方向即列自左向右，符合蒙文书写习惯，一个词一列即可）；
 *      列比它短的站，多出来的空档用负外边距收回（不留白）；有词仍长于上限、无法再换列时
 *      按实测比例 `scaleY` 上下压缩（压缩比用收敛循环求，见 fitVertical）；
 *   3. 引擎重画标签层时由 MutationObserver 重新补齐（注入幂等，不会重复插入）。
 *
 * 调试入口：URL 挂 `?mnFont=cdn` 可强制走 CDN 分支（Windows 等自带蒙文字体的
 * 平台上，系统分支会抢先命中，无法验证 CDN 路径）；不带参数时行为不受影响。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const LAYER_ID = "labels-layer";
    const PROBE_TEXT = "ᠰᠢᠨᠬᠤᠸᠠ";   // 新华广场：含初 / 中 / 词尾三种字形的连写串
    /** 与探针串等长的私用区字符：任何字体都不覆盖，用来量「缺字字形」的基准宽度 */
    const TOFU_TEXT = "\uE000".repeat(Array.from(PROBE_TEXT).length);
    const CDN_FAMILY = "Noto Sans Mongolian";
    const CDN_HREF = "https://fonts.loli.net/css2?family=Noto+Sans+Mongolian&display=swap";
    const FONT_STACK = ["Mongolian Baiti", CDN_FAMILY, "Menksoft Qagan", "Daicing Xiaokai"];
    const FONT_WARN_MS = 8000;        // 到点仅告警一次，不放弃
    const FONT_GIVE_UP_MS = 60000;    // 真正放弃（此后不再注入蒙文）
    /** 量宽探测用的常驻 2d 上下文（每次新建会重复分配） */
    let measureCtx = null;

    /* ==================================================================
     * 字体探测与加载
     * ================================================================== */

    /**
     * 系统是否能真正渲染蒙文：**同一字体栈下**比较「蒙文探针串」与「等长私用区缺字串」
     * 的宽度 —— 宽度不同，说明确有字体在渲染它（蒙文连写会把总宽压窄）；两者相同则只是
     * 缺字字形（.notdef），即系统确实没有蒙文字体。
     *
     * ⚠️ 不要再改回「逐个字体名与 monospace 比宽度」的老判据：蒙文是**竖排**文字，水平
     * 量宽下各体字形的 advance 都极窄，实测在 Windows（Mongolian Baiti 可用）与
     * Android 10（系统回退可正常连写）上都与 monospace 撞成同一个宽度（桌面 20.51 /
     * 手机 35.84，四个字体名全部「未命中」），于是所有设备一律被判成「没有蒙文字体」、
     * 全被推去走 CDN 分支 —— CDN 通就正常（桌面不易察觉），CDN 不通就整体不显示蒙文
     * （手机实测正是这种：徽标连写正常，站名一行都没有）。
     *
     * 字体栈尾部一律补 sans-serif：浏览器渲染蒙文时允许**字体回退**，家族名对不上也会
     * 落到系统里能覆盖蒙文的字体上 —— 静态徽标 SVG 走的正是这条路，站名必须同一口径。
     * 真正没有蒙文字体的设备上两者宽度一致，仍会被拦住（保留「宁可不显示也不给假蒙文」）。
     */
    function fontUsable(families) {
        try {
            if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
            if (!measureCtx) return true;   // 探测不可用时按「可用」处理
            const stack = families.map((name) => `"${name}"`).concat("sans-serif").join(", ");
            measureCtx.font = `10px ${stack}`;
            const mn = measureCtx.measureText(PROBE_TEXT).width;
            const tofu = measureCtx.measureText(TOFU_TEXT).width;
            return Math.abs(mn - tofu) > 0.5;
        } catch (_) {
            return true;
        }
    }

    function cdnForced() {
        try {
            return new URLSearchParams(window.location.search).get("mnFont") === "cdn";
        } catch (_) {
            return false;
        }
    }

    function injectCdnStylesheet() {
        if (document.querySelector(`link[href^="${CDN_HREF}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = CDN_HREF;
        document.head.appendChild(link);
    }

    /**
     * 等 CDN 字体就绪后就注入。
     *
     * 不设「到点就放弃」的硬超时：镜像首次冷加载可能慢于任何合理阈值，一旦放弃，
     * 访客要刷新一次才看得到蒙文（实测复现过）。故改为轮询 —— 字体一就绪立即注入，
     * 到 WARN_MS 时若仍未就绪只告警一次，随后继续等（最长 GIVE_UP_MS）。
     */
    function injectWhenFontReady() {
        let started = false;
        let warned = false;
        const began = Date.now();
        const tick = () => {
            if (started) return true;
            if (fontUsable([CDN_FAMILY])) {
                started = true;
                startOrWaitLayer();
                return true;
            }
            const elapsed = Date.now() - began;
            if (!warned && elapsed >= FONT_WARN_MS) {
                warned = true;
                console.warn(`[hohhot] CDN 蒙文字体 ${FONT_WARN_MS / 1000}s 内仍未就绪，继续等待……（${CDN_HREF}）`);
            }
            if (elapsed >= FONT_GIVE_UP_MS) {
                console.warn(
                    "[hohhot] 系统与 CDN 均未取得蒙文字体，已跳过蒙文站名渲染。"
                    + "此时浏览器只会渲染成不连写的假蒙文，宁可不显示。"
                );
                return true;
            }
            return false;
        };
        if (tick()) return;
        const timer = setInterval(() => { if (tick()) clearInterval(timer); }, 400);
    }

    /* ==================================================================
     * 标签注入
     * ================================================================== */

    function getStations() {
        return (typeof stationsData !== "undefined" && stationsData) || null;
    }

    /**
     * 量「可见字高」：竖排下 Range 的每个矩形即一列，取其中最大高度。
     * 元素带 transform 时量到的是缩放后的视觉高度（这一点被下面的收敛循环利用）。
     */
    function measureInkHeight(mn) {
        let need = 0;
        try {
            const range = document.createRange();
            range.selectNodeContents(mn);
            Array.from(range.getClientRects()).forEach((rect) => {
                if (rect.height > need) need = rect.height;
            });
            if (typeof range.detach === "function") range.detach();
        } catch (_) {
            return 0;
        }
        return need;
    }

    /**
     * 当前地图缩放。
     *
     * 引擎把缩放做在 `#map-content` 的 transform 上，于是：
     * - `getClientRects()`（Range 量列高）读到的是**视口像素**，已含该缩放；
     * - `clientHeight`（换列上限）是**布局像素**，不含缩放。
     * 两者必须先换算到同一尺度再相除，否则压缩比会被地图缩放除一遍 —— 表现为
     * 默认 scale 1.1 时整体多压 10%，且**缩放一变重跑就换一个比值**（观感像被压了好几次）。
     */
    function mapScale() {
        try {
            const view = typeof window.getMapView === "function" ? window.getMapView() : null;
            const scale = view && Number(view.scale);
            return scale > 0 ? scale : 1;
        } catch (_) {
            return 1;
        }
    }

    /**
     * 让蒙文块贴合：**只在溢出时压缩**，未溢出时一律不动。
     *
     * ⚠️ 判据不能用 scrollHeight：竖排元素的滚动溢出发生在**块轴（横向）**，
     * 行内轴（纵向）的溢出不会被 scrollHeight 反映（实测恒等于 clientHeight）。
     *
     * 为什么未溢出时**不**做「收缩到贴合」：那会让每个站的「中文→蒙文→英文」行距
     * 各按自己的溢出量变化，整排站名看起来参差（主理人实测反馈）。行距预算统一成
     * 固定的 1.5 个汉字高，列短时在盒内居中（见 style.css 的 text-align），
     * 空档左右各分一半、不超过 3px，观感与正常行距一致。
     */
    function fitVertical(mn) {
        mn.style.transform = "";
        mn.style.marginBottom = "";
        // CSS 里高度固定，故 clientHeight 就是换列上限（布局 px）
        const cap = mn.clientHeight;
        if (!cap) return;
        const scale = mapScale();

        let ink = measureInkHeight(mn) / scale;   // 视口 px → 布局 px
        if (!ink) return;
        if (ink <= cap + 0.5) return;   // 未溢出：不再做任何压缩或收拢

        /* 有词长于换列上限、无法再换列时，按比例上下压缩。
           压缩比用收敛循环求：首次按「上限 / 实测列高」压，再复量可见字高，若仍与上限
           有差就按实测回算一次比值。首量会偏大（同一元素不同时机量到的列高可差约 10%），
           靠这一步收敛掉（最多 3 轮），使压缩后的列高正好等于上限。 */
        let ratio = Math.max(0.25, cap / ink);
        for (let round = 0; round < 3; round += 1) {
            mn.style.transform = `scaleY(${ratio.toFixed(3)})`;
            const measured = measureInkHeight(mn) / scale;
            if (!measured || Math.abs(measured - cap) <= 0.5) return;
            const next = Math.min(1, Math.max(0.25, ratio * (cap / measured)));
            if (next >= 0.999) {
                mn.style.transform = "";
                return;
            }
            ratio = next;
        }
    }

    /** 单个标签：确保蒙文块存在并就位（幂等） */
    function decorateLabel(labelEl) {
        const stationId = labelEl.dataset ? labelEl.dataset.sid : null;
        const table = getStations();
        const station = stationId && table ? table[stationId] : null;
        const text = station && station.mn;
        if (!text) return;

        let mn = labelEl.querySelector(":scope > .hohhot-mn");
        if (!mn) {
            mn = document.createElement("span");
            mn.className = "hohhot-mn";
            mn.setAttribute("lang", "mn-Mong");
            mn.textContent = text;
            // 插在中文行与英文行之间（官方标识的次序即「中文 → 蒙文 → 英文」）：
            // .stacn / .staen 都是 display:block，夹在中间的行内块会自成一行，
            // 左右位置跟随容器的 text-align，列首由 vertical-align: top 贴住行顶。
            labelEl.insertBefore(mn, labelEl.querySelector(":scope > .staen"));
            labelEl.classList.add("has-mn");
        }
        fitVertical(mn);
    }

    function decorateAll() {
        const layer = document.getElementById(LAYER_ID);
        if (!layer) return;
        layer.querySelectorAll(".label-group").forEach(decorateLabel);
    }

    function start() {
        const layer = document.getElementById(LAYER_ID);
        if (!layer) return false;

        decorateAll();
        scheduleRefit();
        watchVisibility(layer);
        // 引擎会整体重建标签层（换城市 / 重新渲染），故跟随 childList 重新补齐
        const observer = new MutationObserver(() => {
            observer.disconnect();
            decorateAll();
            scheduleRefit();
            watchVisibility(layer);
            observer.observe(layer, { childList: true });
        });
        observer.observe(layer, { childList: true });
        return true;
    }

    /**
     * 视口内出现时补一次贴合。
     *
     * 首轮装饰时**画面外的标签**量不到几何（此时 clientHeight 为 0 / 量宽为零），闭环收束
     * 会直接返回、不设负外边距；等用户把它平移进视野时又不会再触发任何重跑，于是这批标签
     * 就永久停留在未贴合状态（实测正是 2 号线北段那 12 站，间隙 1.8~6.9px）。
     * IntersectionObserver 的首次回调会覆盖已在视野内的那些，之后平移入视野自动补齐。
     */
    let visibleObserver = null;

    function watchVisibility(layer) {
        if (typeof IntersectionObserver !== "function") return;
        if (!visibleObserver) {
            visibleObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const mn = entry.target.querySelector(":scope > .hohhot-mn");
                    if (mn) fitVertical(mn);
                });
            });
        }
        layer.querySelectorAll(".label-group").forEach((el) => visibleObserver.observe(el));
    }

    /**
     * 补齐「时机不对」的那几拍。
     *
     * 首轮装饰可能早于**城市样式表加载完成**（hohhot.js 注入的 <link> 还在飞）与**字体就绪**，
     * 此时 `.hohhot-mn` 还是普通 span（没有 vertical-lr、没有固定高度），量出来的间隙≈0，
     * 闭环收束会据此直接返回；等样式到位后布局才变成真正的竖排，间隙就留在 1.9~6.9px。
     * 故把「样式表 load → 字体就绪 → 下一帧 → 两拍兜底」都接上，每拍重跑一次（幂等、廉价）。
     */
    function scheduleRefit() {
        const refit = () => decorateAll();
        const link = document.querySelector('link[href*="city/hohhot/style.css"]');
        if (link) {
            if (link.sheet) refit();
            else link.addEventListener("load", refit, { once: true });
        }
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refit).catch(() => { });
        }
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(refit);
        [300, 1000, 2500].forEach((ms) => setTimeout(refit, ms));
    }

    /** labels-layer 由 core/script.js（ES module）稍后创建，轮询等它就位 */
    function startOrWaitLayer() {
        if (start()) return;
        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;
            if (start() || tries > 50) clearInterval(timer);
        }, 200);
    }

    function boot() {
        if (!cdnForced() && fontUsable(FONT_STACK)) {
            startOrWaitLayer();
            return;
        }
        // 系统没有蒙文字体：按需从 CDN 取，字体真正就绪后再注入
        injectCdnStylesheet();
        injectWhenFontReady();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => { boot(); });
    } else {
        boot();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "hohhot", moduleId: "hohhot-mongolian" }
    }));
})();
