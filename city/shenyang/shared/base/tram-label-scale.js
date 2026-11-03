/**
 * CGo OpenMap - 有轨车站站名标签缩字号（共享层）
 *
 * (shared/base/tram-label-scale.js)
 *
 * 有轨电车线路站距短、站名密（沈阳有轨 5 号线单线 29 站），与地铁共用同一套站名
 * 字号时，在整图概览（Zoom-out）下更容易与相邻站名挤在一起。本模块把「有轨车站」
 * 的站名标签字号（中英文两行连同行高）统一缩到基准的 80%，其余车站保持原样。
 *
 * 只改字号与行高，不动颜色、描边、对齐锚点与相对站点的偏移：
 *   - 标签定位用的是 left/top + transform 锚点，字号缩小后仍贴着原锚点，不会跑位；
 *   - 中英文两行按同一比例缩，行距随之收紧，整体高度按比例下降。
 *
 * 判定口径（由通用到城市私有，依次尝试）：
 *   1. 城市实现 `CURRENT_CITY.isTramStation(station)` 时以它为准（沈阳已实现，
 *      可覆盖「有轨与地铁共站」这类只靠线路 ID 判断会漏掉的情况）；
 *   2. 否则按 `linesData` 里线路 ID 以 `HNT` 开头 / 线路名含「有轨」收集其站序；
 *   3. 仍无法判定时再看 `processedStations[sid].relatedLines`。
 *
 * 缩放比例：`window.CGO_TRAM_LABEL_SCALE` → `CURRENT_CITY.tramLabelScale` → 0.8。
 * 设为 1 或非正数即停用（不做任何 DOM 改动）。
 *
 * 标签由核心 `renderStations()` 一次性生成，本模块启动时通常尚未存在，故先等
 * `#labels-layer` 出现，再用 MutationObserver 盯 childList：站名整体重建后对新节点补做。
 * 已处理的标签带类名 `cgo-tram-label` 与 data 标记，重复扫描不会二次缩小。
 *
 * 对外接口：window.CGoTramLabelScale = { apply }
 */
(function () {
    "use strict";

    const LABELS_LAYER_ID = "labels-layer";
    const TRAM_CLASS = "cgo-tram-label";
    const MARK_ATTR = "data-cgo-tram-label";
    const DEFAULT_SCALE = 0.8;

    function currentScale() {
        const city = window.CURRENT_CITY;
        const raw = window.CGO_TRAM_LABEL_SCALE !== undefined
            ? window.CGO_TRAM_LABEL_SCALE
            : city?.tramLabelScale;
        const scale = Number(raw);
        if (!Number.isFinite(scale) || scale <= 0) return DEFAULT_SCALE;
        return scale;
    }

    /**
     * 线路是否为有轨。各城的命名并不统一，按以下几种线索任一命中即算：
     *   - 线路 ID 以 HNT 开头（沈阳有轨）；
     *   - 线路名含「有轨 / 轻轨」（如「有轨5号线」）；
     *   - 矢量徽标路径带 tram（大连 201 / 202、长春 G54 / G55 均用 tram-*.svg）；
     *   - 运营公司含「有轨电车」（北京亦庄 T1 / 西郊线、黄石 / 嘉兴 / 淮安 / 南平 / 文山等）。
     */
    function isTramLine(line) {
        if (!line) return false;
        return /^HNT/i.test(String(line.id || ""))
            || /有轨|轻轨/.test(String(line.name || ""))
            || /tram/i.test(String(line.svg || ""))
            || /有轨电车/.test(String(line.company || ""));
    }

    /** 从线路站序中收集有轨车站 ID（兼容分支线路的 way1 / way2 写法） */
    function collectTramStationIds() {
        const ids = new Set();
        const lines = (typeof linesData !== "undefined" && Array.isArray(linesData))
            ? linesData
            : window.linesData;
        if (!Array.isArray(lines)) return ids;
        lines.filter(isTramLine).forEach((line) => {
            const groups = line.hasbranch
                ? [line["stationIds-way1"], line["stationIds-way2"]]
                : [line.stationIds];
            groups.forEach((group) => {
                if (Array.isArray(group)) group.forEach((sid) => ids.add(sid));
            });
        });
        return ids;
    }

    /** 某站是否属于有轨车站：优先城市口径，其次线路站序，最后经停线路 */
    function isTramStation(sid, tramIds) {
        const city = window.CURRENT_CITY;
        const station = window.processedStations?.[sid];
        if (station && typeof city?.isTramStation === "function") {
            return Boolean(city.isTramStation(station));
        }
        if (tramIds.has(sid)) return true;
        if (!station) return false;
        return (station.relatedLines || []).some((lineId) => {
            const lines = window.linesData || (typeof linesData !== "undefined" ? linesData : []);
            const line = Array.isArray(lines) ? lines.find((item) => item.id === lineId) : null;
            return isTramLine(line) || /^HNT/i.test(lineId);
        });
    }

    /** 按比例缩小一个文本行；只缩字号与行高，保留颜色 / 描边 / 对齐 */
    function shrinkText(el, scale) {
        if (!el) return;
        const style = window.getComputedStyle(el);
        const size = parseFloat(style.fontSize);
        if (!(size > 0)) return;
        el.style.fontSize = (size * scale).toFixed(2) + "px";
        const lineHeight = parseFloat(style.lineHeight);
        if (lineHeight > 0) el.style.lineHeight = (lineHeight * scale).toFixed(2) + "px";
    }

    /** 全量扫描一遍：只处理带站 ID、尚未标记过、且判定为有轨车站的标签 */
    function apply() {
        const scale = currentScale();
        if (scale === 1) return;
        const labels = document.querySelectorAll(`#${LABELS_LAYER_ID} .label-group[data-sid]`);
        if (!labels.length) return;
        const tramIds = collectTramStationIds();
        labels.forEach((label) => {
            if (label.classList.contains(TRAM_CLASS)) return;
            const sid = label.getAttribute("data-sid");
            if (!sid || !isTramStation(sid, tramIds)) return;
            const cn = label.querySelector(".stacn");
            const en = label.querySelector(".staen");
            if (!cn && !en) return;
            label.classList.add(TRAM_CLASS);
            label.setAttribute(MARK_ATTR, "1");
            shrinkText(cn, scale);
            shrinkText(en, scale);
        });
    }

    let scheduled = false;
    function schedule() {
        if (scheduled) return;
        scheduled = true;
        // 标签重建与核心的批量 DOM 写入同处一个任务，microtask 里再统一扫一遍
        queueMicrotask(() => {
            scheduled = false;
            apply();
        });
    }

    let labelsObserver = null;

    function watch(layer) {
        if (labelsObserver) return;
        labelsObserver = new MutationObserver(schedule);
        labelsObserver.observe(layer, { childList: true });
    }

    function start() {
        const layer = document.getElementById(LABELS_LAYER_ID);
        if (layer) {
            watch(layer);
            apply();
            return;
        }
        // 标签层由核心在初始化时创建，本模块启动时通常还没有
        const waiter = new MutationObserver(() => {
            const ready = document.getElementById(LABELS_LAYER_ID);
            if (!ready) return;
            waiter.disconnect();
            watch(ready);
            apply();
        });
        waiter.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    window.CGoTramLabelScale = { apply };
})();
