/**
 * CGo OpenMap - 呼出线随标签进入 active（共享层）
 *
 * 有些城市把站名画成「呼出框 + 引线」（沈阳的换乘站即如此）：引线是画在画布图层里的
 * 独立 SVG 元素，与标签本身没有 DOM 关系，于是标签进入 active（核心选中、路线起终点、
 * 地图小工具的起点保活等）时，只有标签文字变红，引线仍是原来的颜色——框与线脱节。
 *
 * 本模块把两者接起来。城市只需做三件事：
 *   1. 给引线元素打上 `data-cgo-callout="<车站 ID>"`（引线重建时同样要带上）；
 *   2. 给装引线的那个图层打上 `data-cgo-callout-layer`，让共享层的「路线高亮淡化」规则
 *      放过它（见 route-panel.css：该规则逐个淡化线网图元，正是为此把引线层摘出来）；
 *   3. 在城市样式表里给出 `cgo-callout-active` 的观感（线宽、颜色）。
 * 之后 `label_<车站 ID>` 带 active 时，该站的引线元素也会带上 `cgo-callout-active`，
 * 标签摘掉 active 时同步摘除；标签被淡化时（路线高亮走 filter、支线让位走内联 opacity）
 * 引线抄一份同样的淡化跟着淡。引线重建（城市脚本通常整层重画）后由本模块补回。
 *
 * 本模块只增删这一个类、只写引线自己的 opacity 与 filter，不含任何城市私有数据，也不碰引线之外的元素。
 *
 * 对外接口：window.CGoLabelActive = { sync }
 */
(function () {
    "use strict";

    const LABELS_LAYER_ID = "labels-layer";
    const LINES_LAYER_ID = "lines-layer";
    /** 引线元素上的车站标识属性（城市侧打标，如 data-cgo-callout="M101"） */
    const LINK_ATTR = "data-cgo-callout";
    /** 本模块加到引线上的类名，观感由城市样式表定义 */
    const ACTIVE_CLASS = "cgo-callout-active";

    /**
     * 全量同步一遍：呼出线数量很少（只有呼出标签的站才有），故不做增量，
     * 一次遍历就把「该亮的亮、该灭的灭」都办妥，不必维护站点与引线的对应关系表。
     *
     * 同步两件事——引线在观感上是标签的一部分，这两件都得跟着标签走：
     *   1. active：标签被选中 / 成为路线起终点时，引线一起进入高亮态（类名交给城市样式表）；
     *   2. 淡化：路线高亮时非路线站的标签由 filter 褪色（见 route-panel.css，刻意不用 opacity，
     *      避免半透明叠影），支线高亮时被让位的另一条交路则由核心写内联 opacity: 0.1 ——
     *      两种来源都落在标签自己身上，故这里把它的计算 opacity 与 filter 一并抄过来。
     *      引线无需知道淡化是谁造成的，也就不会漏掉将来新增的第三种来源。
     */
    function sync() {
        document.querySelectorAll(`[${LINK_ATTR}]`).forEach((el) => {
            const sid = el.getAttribute(LINK_ATTR);
            const label = sid ? document.getElementById(`label_${sid}`) : null;
            const active = Boolean(label?.classList.contains("active"));
            el.classList.toggle(ACTIVE_CLASS, active);
            if (!label) return;
            const style = window.getComputedStyle(label);
            if (el.style.opacity !== style.opacity) el.style.opacity = style.opacity;
            const filter = style.filter && style.filter !== "none" ? style.filter : "";
            if (el.style.filter !== filter) el.style.filter = filter;
        });
    }

    let syncing = false;
    function schedule() {
        if (syncing) return;
        syncing = true;
        queueMicrotask(() => {
            syncing = false;
            sync();
        });
    }

    let labelsObserver = null;
    let linesObserver = null;
    let mapObserver = null;
    let themeObserver = null;

    /**
     * 四处都要盯：
     *   - 标签层看 class 与 style——active 的增删落在 class（核心的 clearHighlights 也是直接摘类），
     *     淡化的内联 opacity（核心让位支线时写）落在 style；顺带看 childList，站名整体重建后仍能同步；
     *   - 线网层只 childList——引线是城市脚本整层重画的，重画后要把类补回去。
     *     刻意不盯它的属性：本模块自己就在改引线的 class 与 opacity，盯上会自触发（虽不会死循环，但白跑）；
     *   - 画布层看 class——「路线高亮」这个状态（#map-content.cgo-routing）挂在这里，
     *     它一变，所有非路线站的标签就会集体淡化，而标签层自身没有任何 DOM 变动；
     *   - 根元素看 data-theme——淡化的配方是分主题两套（--cgo-dim-filter），切主题只改根元素属性，
     *     同样不会有任何元素级的 DOM 变动，不盯就会让引线一直停在旧主题的配方上。
     */
    function watch() {
        const labelsLayer = document.getElementById(LABELS_LAYER_ID);
        const linesLayer = document.getElementById(LINES_LAYER_ID);
        if (!labelsLayer || !linesLayer) return false;
        if (!labelsObserver) {
            labelsObserver = new MutationObserver(schedule);
            labelsObserver.observe(labelsLayer, {
                attributes: true, childList: true, subtree: true, attributeFilter: ["class", "style"]
            });
        }
        if (!linesObserver) {
            linesObserver = new MutationObserver(schedule);
            linesObserver.observe(linesLayer, { childList: true, subtree: true });
        }
        const mapContent = document.getElementById("map-content");
        if (mapContent && !mapObserver) {
            mapObserver = new MutationObserver(schedule);
            mapObserver.observe(mapContent, { attributes: true, attributeFilter: ["class"] });
        }
        if (!themeObserver) {
            themeObserver = new MutationObserver(schedule);
            themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        }
        return true;
    }

    function start() {
        if (watch()) {
            sync();
            return;
        }
        // 两层由核心渲染时创建，本模块启动时通常还没有
        const waiter = new MutationObserver(() => {
            if (!watch()) return;
            waiter.disconnect();
            sync();
        });
        waiter.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.CGoLabelActive = { sync };
})();
