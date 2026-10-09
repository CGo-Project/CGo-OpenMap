/**
 * CGo OpenMap - 共享层：上一站 / 下一站 点击跳转 (shared/adjacent-jump.js)
 *
 * 车站详情「线路」页签里的「上一站 / 下一站」行（core 的 adjacent-stations 模块渲染）
 * 原本只是纯文本；本模块给它加上「点一下就跳到那座车站详情」的交互，
 * 便于沿线连续浏览——点完下一站，新面板的上下行又能继续点。
 *
 * 为什么不改 core：
 *   - core 里 prev / next 是**渲染好的 HTML 字符串**（站名 + 距离 span），不携带车站 ID，
 *     为可选交互去改核心渲染不符合「core 与业务解耦」的铁律；
 *   - 本模块不改 DOM 结构与渲染结果，只在面板装配完成后（onMounted）给已有的
 *     `.info-value` 补 data 属性、键盘可达性与点击处理，对 core 零侵入，
 *     与 geo-estimate.js 的「面板就地增强」是同一思路。
 *
 * 车站 ID 怎么来（站名反查）：
 *   - 从 info-value 的**首个非空文本子节点**取站名（其后那个 span 是距离，不参与匹配），
 *     再回查 processedStations 的 cn；
 *   - 同城同名多站（如沈阳有轨 / 地铁两个「杨官」）用「与当前站在任一线路站序上相邻」
 *     收窄，仍歧义就不绑——宁可该行不可点，也不跳错站；
 *   - 反查忠实于「显示什么跳什么」：line-link 贯通合并改写过的 prev / next 也能正确解析
 *     （邻站在接续线的站序上与当前站相邻，收窄判据天然覆盖）。
 *
 * 跳转后停在**同一条线路页签**：先 selectStation(sid)，再按线路名点选新面板里的同名
 * tab-item（tab 标题与这里拿到的 lineInfo.name 同源渲染，天然覆盖贯通改名的情形）。
 *
 * 样式表由脚本按自身 URL 注入（同 opening-schedule.js 的做法）。
 *
 * 加载：接入城市在 `{city}.js` 的 document.write 列表里引入。
 * 对外接口：无（纯模块注册；城市可在 stationBoard.modules 里以
 *           `cgo-adjacent-jump: { enabled: false }` 关闭）。
 */
(function () {
    "use strict";
    if (typeof window === "undefined") return;

    /** 样式表注入标记，避免重复引入 */
    const STYLE_FLAG_ATTR = "data-cgo-adjacent-jump-style";

    /**
     * 本脚本自身的 URL，用于推导同目录的 adjacent-jump.css。
     *
     * ⚠️ 必须在**脚本执行期**读取 currentScript：面板渲染发生在很久之后，
     * 那时 currentScript 已指向别的脚本，据此推导会得到错误路径。
     */
    const SELF_URL = (typeof document !== "undefined" && document.currentScript?.src) || "";

    /** 已解析出目标站的 info-value 上的标记属性（也是 CSS 的可点击形态钩子） */
    const JUMP_ATTR = "data-cgo-jump-sid";

    /**
     * 按自身脚本 URL 推导并注入样式表（幂等）。
     * 用字符串替换把脚本 URL 上的 `?v=` 版本串原样搬到 CSS 上——
     * 走 `new URL()` 会丢 query，改了样式也会被缓存一直命中旧版。
     */
    function injectStyle() {
        if (!SELF_URL || typeof document === "undefined") return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = SELF_URL.replace(/adjacent-jump\.js(\?|$)/, "adjacent-jump.css$1");
        link.setAttribute(STYLE_FLAG_ATTR, "");
        (document.head || document.documentElement).appendChild(link);
    }

    /** 归并拓扑后的车站字典（core 在 init 里挂到 window），退回原始站点数据 */
    function stationTable() {
        return window.processedStations || window.stationsData || {};
    }

    /**
     * info-value 里的站名：**首个非空文本子节点**。
     * 结构恒为「站名文本 + <span>(距离)</span>」——距离不在文本节点里，
     * 故取文本节点即可；无距离数据时整行就是一个文本节点，同样命中。
     */
    function stationNameOf(valueEl) {
        const nodes = Array.prototype.slice.call(valueEl.childNodes);
        for (const node of nodes) {
            if (node.nodeType === 3 && node.textContent.trim()) return node.textContent.trim();
        }
        return "";
    }

    /**
     * 与 activeSid 在任一线路站序上相邻的车站 ID 集合（同名歧义时的收窄判据）。
     * 分支线按 way1 / way2 分组各自判相邻，环线首尾相接。
     */
    function adjacentSids(activeSid) {
        const out = new Set();
        const lines = window.linesData || [];
        lines.forEach((line) => {
            const groups = line.hasbranch
                ? [line["stationIds-way1"] || [], line["stationIds-way2"] || []]
                : [line.stationIds || []];
            groups.forEach((ids) => {
                const i = ids.indexOf(activeSid);
                if (i < 0) return;
                if (i > 0) out.add(ids[i - 1]);
                if (i >= 0 && i < ids.length - 1) out.add(ids[i + 1]);
                if (line.isLoop && ids.length > 1) {
                    if (i === 0) out.add(ids[ids.length - 1]);
                    if (i === ids.length - 1) out.add(ids[0]);
                }
            });
        });
        return out;
    }

    /**
     * 站名 → 车站 ID。查不到或同名仍歧义一律返回 null（不绑跳转）。
     * @param {string} name 面板上显示的站名
     * @param {string} activeSid 当前打开的车站 ID（收窄用）
     * @returns {string|null}
     */
    function resolveSid(name, activeSid) {
        if (!name) return null;
        const table = stationTable();
        let candidates = Object.keys(table).filter((id) => table[id] && table[id].cn === name);
        if (candidates.length === 1) return candidates[0];
        if (candidates.length > 1 && activeSid) {
            const adjacent = adjacentSids(activeSid);
            candidates = candidates.filter((id) => adjacent.has(id));
            if (candidates.length === 1) return candidates[0];
        }
        return null;
    }

    /**
     * 跳转到目标车站详情，并停在与当前一致的线路页签上。
     * selectStation 同步完成面板渲染，随后按线路名点选同名页签即可，
     * 不必复刻 core 的 relatedLinesInfo 排序（且天然覆盖贯通改名的线名）。
     */
    function jumpTo(sid, lineName) {
        if (typeof window.selectStation !== "function") return;
        window.selectStation(sid);
        if (!lineName) return;
        const panel = document.getElementById("info-panel");
        if (!panel) return;
        const tabs = Array.prototype.slice.call(panel.querySelectorAll(".tab-item"));
        const target = tabs.find((tab) => (tab.textContent || "").trim() === lineName);
        if (target) target.click();
    }

    /** 给一行「上一站 / 下一站」补交互（幂等：已带标记的行直接跳过） */
    function bindRow(valueEl, lineName, activeSid) {
        if (valueEl.hasAttribute(JUMP_ATTR)) return;
        const name = stationNameOf(valueEl);
        if (!name) return;
        const sid = resolveSid(name, activeSid);
        if (!sid) return;   // 无对应站或同名歧义：保持纯文本，宁缺勿错

        valueEl.setAttribute(JUMP_ATTR, sid);
        valueEl.setAttribute("role", "button");
        valueEl.setAttribute("tabindex", "0");
        valueEl.setAttribute("aria-label", `前往 ${name}`);
        valueEl.title = `前往 ${name}`;

        const fire = (event) => {
            if (event.type === "keydown") {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
            }
            event.stopPropagation();   // 别把点击冒给面板拖拽 / 全局选站逻辑
            jumpTo(sid, lineName);
        };
        valueEl.addEventListener("click", fire);
        valueEl.addEventListener("keydown", fire);
    }

    if (!window.StationBoard?.registerModule) return;
    injectStyle();

    window.StationBoard.registerModule({
        id: "cgo-adjacent-jump",
        name: "上一站下一站跳转",
        targetTab: "line-tab",
        // adjacent-stations 是 20，本模块只做事后增强、无渲染输出，紧跟其后即可
        order: 21,
        render() {
            return "";   // 不产生 DOM，只借 onMounted 在装配完成后增强已有行
        },
        onMounted(infoPanel, context) {
            if (!infoPanel) return;
            const activeSid = context?.station?.id;
            if (!activeSid) return;
            // 每个线路页签各收到一次 onMounted，按 tabIndex 定位各自的 pane，
            // 保证每行恰好被增强一次（DOM 每次重绘都会重建，不存在跨渲染的重复绑定）
            const pane = infoPanel.querySelector(`.tab-pane[data-tab-index="${context.tabIndex}"]`);
            if (!pane) return;

            const lineInfo = context.lineInfo || {};
            const nextLabel = lineInfo.nextLabel || "下一站";
            pane.querySelectorAll(".info-row").forEach((row) => {
                const labelEl = row.querySelector(".info-label");
                const valueEl = row.querySelector(".info-value");
                if (!labelEl || !valueEl) return;
                const label = (labelEl.textContent || "").trim();
                if (label !== "上一站" && label !== nextLabel) return;
                bindRow(valueEl, lineInfo.name || "", activeSid);
            });
        }
    });
})();
