/**
 * CGo OpenMap - 青岛「区间用时」专题图层
 *
 * - 入口挂载到左侧 #modern-zoom-control，不修改 core/；
 * - 首次打开时惰性生成区间用时图层；
 * - 时间标记沿实际 SVG 线路路径定位到相邻车站之间的路径中点；
 * - 图层 pointer-events:none，打开后仍可正常拖动、缩放、点击车站/线路；
 * - 再次点击按钮即可关闭。
 */
(function () {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";
    const LAYER_ID = "qd-interval-time-layer";
    const BUTTON_ID = "qd-interval-time-btn";
    const HINT_ID = "qd-interval-time-hint";

    // 只给已经开通运营的线路显示区间用时。
    // 对 2/6/11 号线这类“已运营线路 + 在建延伸段”，下面还会通过 station.type === "no"
    // 再过滤尚未开通的区间。
    const OPERATING_LINE_IDS = new Set([
        "QDM01", "QDM02", "QDM03", "QDM04",
        "QDM06", "QDM08", "QDM11", "QDM13"
    ]);

    // 区间用时带圈数字统一使用 12px 圆形；文字尺寸保持不变。
    const BADGE_DIAMETER = 12;
    const OUTER_R = BADGE_DIAMETER / 2;
    const INNER_R = Math.max(0, OUTER_R - 1.35);

    const FADE_MS = 320;

    let visible = false;
    let built = false;
    let hideTimer = null;

    function getLines() {
        try {
            if (typeof linesData !== "undefined" && Array.isArray(linesData)) return linesData;
        } catch (_) { }
        return Array.isArray(window.linesData) ? window.linesData : [];
    }

    function getStations() {
        if (window.processedStations && Object.keys(window.processedStations).length) {
            return window.processedStations;
        }
        try {
            if (typeof stationsData !== "undefined" && stationsData) return stationsData;
        } catch (_) { }
        return {};
    }

    function getConfig() {
        return window.QINGDAO_INTERVAL_TIME_DATA || { defaultMinutes: 2, lines: {} };
    }

    function getMinutes(line, index, fromId, toId) {
        const cfg = getConfig();
        const lineCfg = cfg.lines?.[line.id];
        let value;

        if (Array.isArray(lineCfg)) {
            value = lineCfg[index];
        } else if (lineCfg && typeof lineCfg === "object") {
            value = lineCfg[`${fromId}>${toId}`];
            if (value === undefined) value = lineCfg[`${toId}>${fromId}`];
        }

        return value === undefined || value === null || value === ""
            ? (cfg.defaultMinutes ?? 2)
            : value;
    }

    /** 在 SVG path 上寻找离某个地图坐标最近的弧长位置。 */
    function closestLengthOnPath(path, point) {
        const total = path.getTotalLength();
        if (!Number.isFinite(total) || total <= 0) return 0;

        // 第一轮按约 24px 采样，之后局部细化；线路总量很小，仅首次打开时运行一次。
        const sampleCount = Math.max(24, Math.ceil(total / 24));
        let step = total / sampleCount;
        let bestLength = 0;
        let bestDistance2 = Infinity;

        const test = (length) => {
            const p = path.getPointAtLength(Math.max(0, Math.min(total, length)));
            const dx = p.x - point.x;
            const dy = p.y - point.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDistance2) {
                bestDistance2 = d2;
                bestLength = Math.max(0, Math.min(total, length));
            }
        };

        for (let i = 0; i <= sampleCount; i++) test(i * step);

        // 6 轮局部细化足以把误差压到亚像素级。
        for (let round = 0; round < 6; round++) {
            const start = Math.max(0, bestLength - step);
            const end = Math.min(total, bestLength + step);
            const localStep = (end - start) / 8 || step / 8;
            for (let i = 0; i <= 8; i++) test(start + localStep * i);
            step = localStep;
        }

        return bestLength;
    }

    function createBadge(line, fromId, toId, minutes, point) {
        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", "qd-interval-time-badge");
        group.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
        group.dataset.lineId = line.id;
        group.dataset.from = fromId;
        group.dataset.to = toId;

        // 不使用 stroke：线路色外圆 + 白色内圆形成“带圈数字”。
        const outer = document.createElementNS(SVG_NS, "circle");
        outer.setAttribute("r", OUTER_R.toFixed(3));
        outer.setAttribute("fill", line.color || "var(--station-stroke)");

        const inner = document.createElementNS(SVG_NS, "circle");
        inner.setAttribute("r", INNER_R.toFixed(3));
        inner.setAttribute("fill", "#fff");

        const text = document.createElementNS(SVG_NS, "text");
        const label = String(minutes);
        text.setAttribute("x", "0");
        text.setAttribute("y", "0");
        text.setAttribute("dy", "0.34em");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", line.color || "var(--station-stroke)");
        text.setAttribute("font-size", label.length <= 1 ? "8.4" : label.length === 2 ? "7.4" : "6.4");
        text.setAttribute("font-weight", "700");
        text.setAttribute("font-family", 'Arial, "Helvetica Neue", sans-serif');
        text.textContent = label;

        group.appendChild(outer);
        group.appendChild(inner);
        group.appendChild(text);
        return group;
    }

    function ensureLayer() {
        const content = document.getElementById("map-content");
        if (!content) return null;

        let layer = document.getElementById(LAYER_ID);
        if (layer) return layer;

        layer = document.createElementNS(SVG_NS, "svg");
        layer.id = LAYER_ID;
        layer.setAttribute("aria-hidden", "true");
        layer.style.display = "none";
        content.appendChild(layer);
        return layer;
    }

    function buildLayer() {
        const layer = ensureLayer();
        const stations = getStations();
        const lines = getLines();
        if (!layer || !Object.keys(stations).length || !lines.length) return false;

        layer.replaceChildren();
        let badgeCount = 0;

        lines.forEach((line) => {
            if (!line || line.isVirtual || line.isPointOnly || line.drawOnly) return;
            if (!OPERATING_LINE_IDS.has(line.id)) return;
            const ids = Array.isArray(line.stationIds) ? line.stationIds : [];
            if (ids.length < 2) return;

            const path = document.querySelector(
                `#lines-layer .line-visual-group[data-visual-id="${line.id}"] .line-visual-inner`
            );
            if (!path || typeof path.getTotalLength !== "function") return;

            const lengthCache = new Map();
            const lengthOf = (sid) => {
                if (lengthCache.has(sid)) return lengthCache.get(sid);
                const station = stations[sid];
                if (!station) return null;
                const value = closestLengthOnPath(path, station);
                lengthCache.set(sid, value);
                return value;
            };

            for (let i = 0; i < ids.length - 1; i++) {
                const fromId = ids[i];
                const toId = ids[i + 1];
                const fromStation = stations[fromId];
                const toStation = stations[toId];

                // 任一端尚未开通，则该相邻区间属于在建/未开通区间，不显示用时。
                if (!fromStation || !toStation || fromStation.type === "no" || toStation.type === "no") continue;

                const a = lengthOf(fromId);
                const b = lengthOf(toId);
                if (a === null || b === null) continue;

                const midpointLength = (a + b) / 2;
                const point = path.getPointAtLength(midpointLength);
                const minutes = getMinutes(line, i, fromId, toId);
                layer.appendChild(createBadge(line, fromId, toId, minutes, point));
                badgeCount++;
            }
        });

        built = badgeCount > 0;
        return built;
    }

    function syncButton() {
        const btn = document.getElementById(BUTTON_ID);
        if (!btn) return;
        btn.classList.toggle("on", visible);
        btn.setAttribute("aria-pressed", visible ? "true" : "false");
        // 悬停提示保持固定名称，不随开关状态变化。
        btn.title = "区间用时";
    }

    function showHint() {
        let hint = document.getElementById(HINT_ID);
        if (!hint) {
            hint = document.createElement("div");
            hint.id = HINT_ID;
            hint.setAttribute("role", "status");
            hint.setAttribute("aria-live", "polite");
            hint.setAttribute("aria-label", "带圈数字 2 表示区间用时（分钟），仅供参考");

            // 提示中直接显示一个与地图标记同构的带圈数字示例，而不是写“带圈数字”四个字。
            const badge = document.createElement("span");
            badge.className = "qd-interval-time-hint-badge";
            badge.setAttribute("aria-hidden", "true");

            const badgeText = document.createElement("span");
            badgeText.textContent = "2";
            badge.appendChild(badgeText);

            const message = document.createElement("span");
            message.className = "qd-interval-time-hint-text";
            message.textContent = "表示区间用时（分钟），仅供参考";

            hint.appendChild(badge);
            hint.appendChild(message);
            document.body.appendChild(hint);
        }

        // 示例颜色取一条已运营线路的线路色，使提示中的样例和地图上的标记语义一致。
        const sampleLine = getLines().find((line) => line && OPERATING_LINE_IDS.has(line.id) && line.color);
        if (sampleLine?.color) hint.style.setProperty("--qd-interval-hint-color", sampleLine.color);

        // 专题开启期间常驻显示；关闭专题时由 hideHint() 隐藏。
        hint.classList.add("show");
    }

    function hideHint() {
        const hint = document.getElementById(HINT_ID);
        if (hint) hint.classList.remove("show");
    }

    function showLayer(layer) {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        layer.style.display = "block";
        layer.classList.remove("show");
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (visible) layer.classList.add("show");
        }));
    }

    function hideLayer(layer) {
        layer.classList.remove("show");
        hideTimer = setTimeout(() => {
            if (!visible) layer.style.display = "none";
            hideTimer = null;
        }, FADE_MS + 40);
    }

    function setVisible(force) {
        const next = typeof force === "boolean" ? force : !visible;

        // 专题图层互斥：打开区间用时时关闭建设进度专题。
        if (next && window.QingdaoConstructionProgressMap?.visible) {
            window.QingdaoConstructionProgressMap.hide();
        }

        visible = next;
        const layer = ensureLayer();
        if (!layer) return;

        if (visible && !built) {
            // 正常情况下用户能点击按钮时线路已渲染；若极早触发则下一帧重试。
            if (!buildLayer()) {
                requestAnimationFrame(() => {
                    if (visible && buildLayer()) {
                        const readyLayer = document.getElementById(LAYER_ID);
                        if (readyLayer) showLayer(readyLayer);
                    }
                });
            }
        }

        if (visible) showLayer(layer);
        else hideLayer(layer);

        document.body.classList.toggle("qd-interval-times-on", visible);
        syncButton();
        if (visible) showHint();
        else hideHint();
    }

    function installControl() {
        const ctrl = document.getElementById("modern-zoom-control");
        if (!ctrl || document.getElementById(BUTTON_ID)) return false;

        const sep = document.createElement("div");
        sep.className = "qd-topic-separator";
        sep.setAttribute("aria-hidden", "true");

        const btn = document.createElement("button");
        btn.id = BUTTON_ID;
        btn.type = "button";
        btn.title = "区间用时";
        btn.setAttribute("aria-label", "区间用时");
        btn.setAttribute("aria-pressed", "false");
        btn.innerHTML = '<cgo-icon name="time" size="20"></cgo-icon>';
        btn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            setVisible();
        });

        ctrl.appendChild(sep);
        ctrl.appendChild(btn);
        return true;
    }

    function init() {
        if (!installControl()) {
            // 缩放控件若晚于城市模块出现，短暂重试；成功后立即停止。
            let tries = 0;
            const timer = setInterval(() => {
                tries++;
                if (installControl() || tries >= 30) clearInterval(timer);
            }, 100);
        }
    }

    // 留一个轻量调试/后续数据更新接口，不影响正式交互。
    window.QingdaoIntervalTimes = {
        show: () => setVisible(true),
        hide: () => setVisible(false),
        toggle: () => setVisible(),
        rebuild: () => {
            built = false;
            const ok = buildLayer();
            const layer = document.getElementById(LAYER_ID);
            if (layer) {
                layer.style.display = visible ? "block" : "none";
                layer.classList.toggle("show", visible);
            }
            return ok;
        },
        get visible() { return visible; }
    };

    if (document.readyState === "complete") init();
    else window.addEventListener("load", init, { once: true });
})();
