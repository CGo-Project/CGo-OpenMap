/**
 * CGo OpenMap - 青岛「建设进度示意」专题图层
 *
 * 展示所有存在建设进度数据的线路。
 * 数据和状态判定统一读取 qingdao_construction.js 暴露的
 * window.QingdaoConstructionProgress，确保与车站信息卡一致。
 */
(function () {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";
    const BUTTON_ID = "qd-construction-progress-btn";
    const LAYER_ID = "qd-construction-progress-layer";
    const LABEL_LAYER_ID = "qd-construction-label-layer";
    const BADGE_LAYER_ID = "qd-construction-badge-layer";
    const LEGEND_ID = "qd-construction-legend";
    const SEGMENT_POPUP_ID = "qd-construction-segment-popup";
    const LATEST_LAYER_ID = "qd-construction-latest-marker-layer";

    // 最近一个月内有进度日期的车站 / 区间自动显示“新”。

    // 进度模式只把真正连接在建段的线路号提到蒙版上方。
    // 6 号线二期接在 QDM06 的 end 端，北侧 start 端仍属于既有运营段。
    const CONSTRUCTION_BADGE_ENDPOINTS = {
        QDM06: new Set(["end"])
    };

    const TRACK_OFFSET = 4.4;
    const TRACK_WIDTH = 6.0;
    const TRACK_WIDTH_PROGRESS_INNER = 2.8;
    const NOT_STARTED_COLOR = "#7d7d7d";
    const MASK_FILL = "rgba(112, 112, 112, 0.32)";

    const STATION_OUTER_R = 8.75;
    const STATION_CORE_R = 6.85;

    const FADE_MS = 320;
    const LABEL_EXTRA_OFFSET = 5.5;

    // 进度模式站名只调整专题克隆，不影响普通地图站名。
    // 振华路只向右；胜利桥只向上，不再沿各自斜向 align 外推。
    const PROGRESS_LABEL_DIRECTION_OVERRIDES = {
        M0303: { x: 1, y: 0 },   // 振华路
        M0117: { x: 0, y: -1 }   // 胜利桥(纺织谷)
    };

    // 进度模式专用微调，直接相对普通模式站名位置做二维位移。
    // 这四站统一：右 2px、上 3px。
    const PROGRESS_LABEL_VECTOR_OVERRIDES = {
        M0713: { x: 2, y: -3 }, // 沟岔
        M0412: { x: 2, y: -3 }, // 大埠东
        M0308: { x: 2, y: -3 }, // 地铁大厦
        M0217: { x: 2, y: -3 }  // 石老人浴场
    };

    // 这些车站在普通模式下存在基于 DOM id 的专用排版规则。
    // 专题层克隆站名后会移除 id，因此必须显式保留原始计算样式与位置，
    // 同时不再叠加专题站名外推或中心线吸附位移。
    const PROGRESS_LABEL_PRESERVE_SOURCE_LAYOUT = new Set([
        "M0208" // 下王埠(外贸学院)
    ]);

    // 左右线唯一规则：以每个区间自身的 A → B 顺序为准；从 A 看向 B，左为左线、右为右线。
    // 上下行和 line.stationIds 顺序都不参与左右线判定。

    let visible = false;
    let built = false;
    let hideTimer = null;
    let overlayStationIds = new Set();
    let overlayLineIds = new Set();
    let overlayStationDeltas = new Map();
    let highlightGuardInstalled = false;
    let popupDismissInstalled = false;

    // 这两个未开通车站的基础坐标与线路中心线存在视觉偏差；
    // 进度模式下将专题车站吸附到左右施工线的中线，同时让专题站名跟随同样位移。
    const CENTERLINE_STATION_IDS = new Set(["M0812", "M0208"]); // 东南山、下王埠

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

    function getProgressApi() {
        return window.QingdaoConstructionProgress || null;
    }

    function ensureLayer() {
        const content = document.getElementById("map-content");
        if (!content) return null;

        let layer = document.getElementById(LAYER_ID);
        if (!layer) {
            layer = document.createElementNS(SVG_NS, "svg");
            layer.id = LAYER_ID;
            layer.setAttribute("aria-hidden", "true");
            layer.style.display = "none";
            content.appendChild(layer);
        }
        return layer;
    }

    function ensureLabelLayer() {
        const content = document.getElementById("map-content");
        if (!content) return null;

        let layer = document.getElementById(LABEL_LAYER_ID);
        if (!layer) {
            layer = document.createElement("div");
            layer.id = LABEL_LAYER_ID;
            layer.setAttribute("aria-hidden", "true");
            layer.style.display = "none";
            content.appendChild(layer);
        }
        return layer;
    }

    function ensureBadgeLayer() {
        const content = document.getElementById("map-content");
        if (!content) return null;

        let layer = document.getElementById(BADGE_LAYER_ID);
        if (!layer) {
            layer = document.createElement("div");
            layer.id = BADGE_LAYER_ID;
            layer.setAttribute("aria-hidden", "true");
            layer.style.display = "none";
            content.appendChild(layer);
        }
        return layer;
    }

    function ensureLatestMarkerLayer() {
        const content = document.getElementById("map-content");
        if (!content) return null;

        let layer = document.getElementById(LATEST_LAYER_ID);
        if (!layer) {
            layer = document.createElement("div");
            layer.id = LATEST_LAYER_ID;
            layer.setAttribute("aria-hidden", "true");
            layer.style.display = "none";
            content.appendChild(layer);
        }
        return layer;
    }

    function ensureLegend() {
        let legend = document.getElementById(LEGEND_ID);
        if (legend) return legend;

        legend = document.createElement("div");
        legend.id = LEGEND_ID;
        legend.setAttribute("aria-hidden", "true");
        legend.style.display = "none";
        legend.innerHTML = `
            <div class="qd-construction-legend-title">图例</div>
            <div class="qd-construction-legend-grid">
                <div class="qd-construction-legend-item">
                    <span class="qd-construction-legend-station qd-construction-legend-station-not-started"></span>
                    <span class="qd-construction-legend-text">未开工车站</span>
                </div>
                <div class="qd-construction-legend-item">
                    <span class="qd-construction-legend-track qd-construction-legend-track-not-started"></span>
                    <span class="qd-construction-legend-text">未掘进区间</span>
                </div>
                <div class="qd-construction-legend-item">
                    <span class="qd-construction-legend-station qd-construction-legend-station-building"></span>
                    <span class="qd-construction-legend-text">在建车站</span>
                </div>
                <div class="qd-construction-legend-item">
                    <span class="qd-construction-legend-track qd-construction-legend-track-progress"></span>
                    <span class="qd-construction-legend-text">掘进中区间</span>
                </div>
                <div class="qd-construction-legend-item">
                    <span class="qd-construction-legend-station qd-construction-legend-station-topped"></span>
                    <span class="qd-construction-legend-text">封顶车站</span>
                </div>
                <div class="qd-construction-legend-item">
                    <span class="qd-construction-legend-track qd-construction-legend-track-complete"></span>
                    <span class="qd-construction-legend-text">贯通区间</span>
                </div>
            </div>`;
        document.body.appendChild(legend);
        return legend;
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[ch]));
    }

    function ensureSegmentPopup() {
        let popup = document.getElementById(SEGMENT_POPUP_ID);
        if (popup) return popup;

        popup = document.createElement("div");
        popup.id = SEGMENT_POPUP_ID;
        popup.setAttribute("role", "dialog");
        popup.setAttribute("aria-live", "polite");
        popup.style.display = "none";
        // 外壳直接沿用 StationBoard 的 panel-header / panel-body / panel-close-btn。
        popup.innerHTML = `
            <div class="panel-header">
                <div class="header-name-group">
                    <div class="panel-cn-name qd-construction-segment-panel-title"></div>
                    <div class="panel-en-name qd-construction-segment-panel-subtitle"></div>
                </div>
                <button type="button" class="panel-close-btn" title="关闭面板" aria-label="关闭面板">
                    <cgo-icon name="close" size="24"></cgo-icon>
                </button>
            </div>
            <div class="panel-body">
                <div class="qd-construction-segment-card-slot"></div>
            </div>`;
        popup.querySelector(".panel-close-btn")?.addEventListener("click", (event) => {
            event.stopPropagation();
            closeSegmentPopup();
        });
        document.body.appendChild(popup);
        return popup;
    }

    function closeSegmentPopup() {
        const popup = document.getElementById(SEGMENT_POPUP_ID);
        if (!popup) return;
        popup.classList.remove("show");
        window.setTimeout(() => {
            if (!popup.classList.contains("show")) popup.style.display = "none";
        }, 180);
    }

    function positionSegmentPopup(popup, clientX, clientY) {
        const gap = 12;
        const pad = 10;
        const rect = popup.getBoundingClientRect();
        let left = clientX + gap;
        let top = clientY + gap;
        if (left + rect.width > window.innerWidth - pad) left = clientX - rect.width - gap;
        if (top + rect.height > window.innerHeight - pad) top = clientY - rect.height - gap;
        left = Math.max(pad, Math.min(left, window.innerWidth - rect.width - pad));
        top = Math.max(pad, Math.min(top, window.innerHeight - rect.height - pad));
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    function showSegmentPopup(segment, api, clientX, clientY) {
        if (!segment) return;
        const popup = ensureSegmentPopup();
        const title = popup.querySelector(".qd-construction-segment-panel-title");
        const subtitle = popup.querySelector(".qd-construction-segment-panel-subtitle");
        const slot = popup.querySelector(".qd-construction-segment-card-slot");

        if (title) title.textContent = segment.name || "区间";

        if (subtitle) {
            const stations = getStations();
            const fromName = stations?.[segment.from]?.cn || "";
            const toName = stations?.[segment.to]?.cn || "";
            subtitle.textContent = fromName && toName ? `${fromName}~${toName}区间` : "";
            subtitle.style.display = subtitle.textContent ? "block" : "none";
        }

        if (slot) {
            slot.innerHTML = typeof api.renderSegmentProgressCard === "function"
                ? api.renderSegmentProgressCard(segment)
                : "";
        }
        popup.style.display = "block";
        popup.classList.remove("show");
        positionSegmentPopup(popup, clientX, clientY);
        requestAnimationFrame(() => popup.classList.add("show"));
    }

    function installPopupDismissHandlers() {
        if (popupDismissInstalled) return;
        popupDismissInstalled = true;
        document.addEventListener("pointerdown", (event) => {
            if (!visible) return;
            if (event.target.closest?.(`#${SEGMENT_POPUP_ID}`)) return;
            if (event.target.closest?.(".qd-construction-segment-hit")) return;
            closeSegmentPopup();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeSegmentPopup();
        });
    }

    function appendSegmentHit(layer, path, startLength, endLength, segment, api, lineId) {
        const signedSpan = endLength - startLength;
        const span = Math.abs(signedSpan);
        if (!segment || span < 1) return;
        const direction = signedSpan >= 0 ? 1 : -1;
        const inset = Math.min(11, span * 0.18);
        const a = startLength + inset * direction;
        const b = endLength - inset * direction;
        const d = makeSampledOffsetPathData(path, a, b, 0);
        if (!d) return;

        const hit = document.createElementNS(SVG_NS, "path");
        hit.setAttribute("d", d);
        hit.setAttribute("class", "qd-construction-segment-hit");
        hit.setAttribute("fill", "none");
        hit.setAttribute("stroke", "rgba(0,0,0,0.001)");
        hit.setAttribute("stroke-width", "18");
        hit.setAttribute("stroke-linecap", "butt");
        hit.dataset.lineId = lineId || "";
        hit.dataset.from = segment.from || "";
        hit.dataset.to = segment.to || "";
        hit.setAttribute("focusable", "false");
        hit.setAttribute("aria-label", `${segment.name || "区间"}建设进度`);
        const open = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const x = Number.isFinite(event.clientX) ? event.clientX : window.innerWidth / 2;
            const y = Number.isFinite(event.clientY) ? event.clientY : window.innerHeight / 2;
            showSegmentPopup(segment, api, x, y);
        };
        hit.addEventListener("click", open);
        layer.appendChild(hit);
    }

    function labelDirection(align) {
        const invSqrt2 = Math.SQRT1_2;
        switch (align) {
            case "top": return { x: 0, y: -1 };
            case "bottom": return { x: 0, y: 1 };
            case "left": return { x: -1, y: 0 };
            case "right": return { x: 1, y: 0 };
            case "top-left": return { x: -invSqrt2, y: -invSqrt2 };
            case "top-right": return { x: invSqrt2, y: -invSqrt2 };
            case "bottom-left": return { x: -invSqrt2, y: invSqrt2 };
            case "bottom-right": return { x: invSqrt2, y: invSqrt2 };
            default: return { x: 0, y: 1 };
        }
    }

    function samplePointAndNormal(path, startLength, endLength) {
        const total = path.getTotalLength();
        const signedSpan = endLength - startLength;
        const mid = startLength + signedSpan * 0.5;
        const clamped = Math.max(0, Math.min(total, mid));
        const p = path.getPointAtLength(clamped);
        const direction = signedSpan >= 0 ? 1 : -1;
        const delta = Math.max(0.75, Math.min(2.5, Math.abs(signedSpan) / 12));
        const p0 = path.getPointAtLength(Math.max(0, Math.min(total, clamped - delta * direction)));
        const p1 = path.getPointAtLength(Math.max(0, Math.min(total, clamped + delta * direction)));
        let dx = p1.x - p0.x;
        let dy = p1.y - p0.y;
        let mag = Math.hypot(dx, dy);
        if (mag < 1e-6) {
            dx = 1; dy = 0; mag = 1;
        }
        return {
            x: p.x, y: p.y,
            tx: dx / mag, ty: dy / mag,
            nx: -dy / mag, ny: dx / mag
        };
    }

    function parseProgressDateRange(value) {
        const text = String(value || "").trim();
        let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const y = Number(match[1]);
            const m = Number(match[2]) - 1;
            const d = Number(match[3]);
            const start = new Date(y, m, d, 0, 0, 0, 0);
            const end = new Date(y, m, d, 23, 59, 59, 999);
            return { start, end };
        }

        match = text.match(/^(\d{4})-(\d{2})$/);
        if (match) {
            const y = Number(match[1]);
            const m = Number(match[2]) - 1;
            const start = new Date(y, m, 1, 0, 0, 0, 0);
            const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
            return { start, end };
        }
        return null;
    }

    function isRecentProgressDate(value, now = new Date()) {
        const range = parseProgressDateRange(value);
        if (!range) return false;
        const windowStart = new Date(now);
        windowStart.setMonth(windowStart.getMonth() - 1);
        return range.end >= windowStart && range.start <= now;
    }

    function segmentHasRecentProgress(segment, now) {
        if (!segment) return false;
        if (Array.isArray(segment.parts) && segment.parts.length) {
            return segment.parts.some((part) =>
                (part.details || []).some((detail) => isRecentProgressDate(detail?.date, now))
            );
        }
        return (segment.details || []).some((detail) => isRecentProgressDate(detail?.date, now));
    }

    function recentSegmentSides(segment, now) {
        const details = Array.isArray(segment?.parts) && segment.parts.length
            ? segment.parts.flatMap((part) => part.details || [])
            : (segment?.details || []);

        const sides = new Set();
        details.forEach((detail) => {
            if (!isRecentProgressDate(detail?.date, now)) return;
            if (detail?.side === "左线" || detail?.side === "右线") {
                sides.add(detail.side);
            }
        });
        return sides;
    }

    function buildLatestMarkers(stations, lines) {
        const layer = ensureLatestMarkerLayer();
        const api = getProgressApi();
        if (!layer || !api) return;
        layer.replaceChildren();

        const now = new Date();
        const addMarker = (x, y, avoidX = 0, avoidY = 0, tangentX = 0, tangentY = 0, meta = null) => {
            const el = document.createElement("div");
            el.className = "qd-construction-latest-marker is-solid";
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.dataset.baseX = String(x);
            el.dataset.baseY = String(y);
            el.dataset.avoidX = String(avoidX);
            el.dataset.avoidY = String(avoidY);
            el.dataset.tangentX = String(tangentX);
            el.dataset.tangentY = String(tangentY);
            if (meta?.kind) el.dataset.markerKind = meta.kind;
            if (meta?.fromId) el.dataset.fromId = meta.fromId;
            if (meta?.toId) el.dataset.toId = meta.toId;
            el.innerHTML = `
                <span class="qd-construction-latest-marker-icon">
                    <svg class="qd-construction-latest-marker-star" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                        <path d="M16.66,14.35c-.06.04-.08.12-.07.19l1.51,6.46c.04.18-.15.31-.3.22l-5.7-3.43c-.06-.04-.14-.04-.2,0l-5.7,3.43c-.15.09-.34-.04-.3-.22l1.51-6.46c.02-.07,0-.15-.06-.19l-5.03-4.35c-.13-.12-.06-.34.11-.35l6.63-.56c.07-.01.14-.06.17-.12l2.58-6.1c.07-.16.31-.16.37,0l2.59,6.09c.03.06.1.11.17.12l6.63.57c.17.01.24.23.11.35l-5.02,4.35Z"></path>
                    </svg>
                    <span class="qd-construction-latest-marker-char">新</span>
                </span>`;
            layer.appendChild(el);
        };

        (lines || []).forEach((line) => {
            if (!line) return;
            const lineData = api.getLine(line.id);
            if (!lineData) return;

            Object.entries(lineData.stations || {}).forEach(([stationId, detail]) => {
                if (!isRecentProgressDate(detail?.date, now)) return;
                const station = stations[stationId];
                if (!station) return;
                const delta = overlayStationDeltas.get(stationId) || { x: 0, y: 0 };
                const dir = labelDirection(station.align);
                // “新”标记优先放在站名的反方向，避免天然与站名叠在同一侧。
                const mx = -dir.x || 0;
                const my = -dir.y || 1;
                addMarker(
                    station.x + delta.x + mx * 22,
                    station.y + delta.y + my * 22,
                    mx, my, -my, mx, { kind: "station", stationId }
                );
            });

            const path = document.querySelector(
                `#lines-layer .line-visual-group[data-visual-id="${line.id}"] .line-visual-inner`
            );
            if (!path || typeof path.getTotalLength !== "function") return;

            Object.values(lineData.segments || {}).forEach((segment) => {
                if (!segmentHasRecentProgress(segment, now)) return;
                const from = stations[segment.from];
                const to = stations[segment.to];
                if (!from || !to) return;

                const startLength = closestLengthOnPath(path, from);
                const endLength = closestLengthOnPath(path, to);
                const pt = samplePointAndNormal(path, startLength, endLength);
                const recentSides = recentSegmentSides(segment, now);
                const outward = 21;

                // 左右线分别判断最近一个月的进度。
                // 如果两边都有新进度，就在线路两侧各显示一个“新”星标。
                if (recentSides.has("左线")) {
                    addMarker(
                        pt.x - pt.nx * outward, pt.y - pt.ny * outward,
                        -pt.nx, -pt.ny, pt.tx, pt.ty,
                        { kind: "segment", fromId: segment.from, toId: segment.to }
                    );
                }
                if (recentSides.has("右线")) {
                    addMarker(
                        pt.x + pt.nx * outward, pt.y + pt.ny * outward,
                        pt.nx, pt.ny, pt.tx, pt.ty,
                        { kind: "segment", fromId: segment.from, toId: segment.to }
                    );
                }
            });
        });
    }

    function rectsOverlap(a, b, pad = 3) {
        return !(
            a.right + pad < b.left ||
            a.left - pad > b.right ||
            a.bottom + pad < b.top ||
            a.top - pad > b.bottom
        );
    }

    function resolveLatestMarkerLabelCollisions() {
        const markerLayer = document.getElementById(LATEST_LAYER_ID);
        const labelLayer = document.getElementById(LABEL_LAYER_ID);
        if (!markerLayer || !labelLayer) return;

        const labels = [...labelLayer.querySelectorAll(".qd-construction-label")];
        const markers = [...markerLayer.querySelectorAll(".qd-construction-latest-marker")];
        if (!labels.length || !markers.length) return;

        const labelEntries = labels.map((el) => ({
            sid: el.dataset.sid || "",
            rect: el.getBoundingClientRect()
        })).filter((item) => item.rect.width > 0 && item.rect.height > 0);
        const labelRects = labelEntries.map((item) => item.rect);
        const labelRectBySid = new Map(labelEntries.map((item) => [item.sid, item.rect]));

        const overlapsAnyLabel = (marker) => {
            const rect = marker.getBoundingClientRect();
            return labelRects.some((labelRect) => rectsOverlap(rect, labelRect, 2));
        };

        markers.forEach((marker) => {
            const baseX = Number(marker.dataset.baseX);
            const baseY = Number(marker.dataset.baseY);
            let tx = Number(marker.dataset.tangentX) || 0;
            let ty = Number(marker.dataset.tangentY) || 0;
            if (!Number.isFinite(baseX) || !Number.isFinite(baseY)) return;

            marker.style.left = `${baseX}px`;
            marker.style.top = `${baseY}px`;
            if (!overlapsAnyLabel(marker)) return;

            const tangentLength = Math.hypot(tx, ty);
            if (tangentLength < 0.001) return;
            tx /= tangentLength;
            ty /= tangentLength;

            // 区间标记只做一次避让：
            // 1. 默认保持区间中心位置；
            // 2. 若与站名重叠，移动到该区间两端站名在切线方向上的“空位中点”；
            // 3. 移动后不再继续搜索，即使仍有重叠也保持该位置。
            if (marker.dataset.markerKind === "segment") {
                const fromRect = labelRectBySid.get(marker.dataset.fromId || "");
                const toRect = labelRectBySid.get(marker.dataset.toId || "");
                if (fromRect && toRect) {
                    const mapContent = document.getElementById("map-content");

                    let screenTx = tx;
                    let screenTy = ty;
                    let screenPerMapUnit = 1;
                    if (mapContent) {
                        const transform = getComputedStyle(mapContent).transform;
                        if (transform && transform !== "none") {
                            try {
                                const matrix = new DOMMatrixReadOnly(transform);
                                const sx = matrix.a * tx + matrix.c * ty;
                                const sy = matrix.b * tx + matrix.d * ty;
                                const measured = Math.hypot(sx, sy);
                                if (Number.isFinite(measured) && measured > 0.001) {
                                    screenTx = sx / measured;
                                    screenTy = sy / measured;
                                    screenPerMapUnit = measured;
                                }
                            } catch (_) { /* 保持 1:1 回退 */ }
                        }
                    }

                    const projectRect = (rect) => {
                        const values = [
                            rect.left * screenTx + rect.top * screenTy,
                            rect.right * screenTx + rect.top * screenTy,
                            rect.left * screenTx + rect.bottom * screenTy,
                            rect.right * screenTx + rect.bottom * screenTy
                        ];
                        return { min: Math.min(...values), max: Math.max(...values) };
                    };

                    const fromRange = projectRect(fromRect);
                    const toRange = projectRect(toRect);
                    const fromCenter = (fromRange.min + fromRange.max) / 2;
                    const toCenter = (toRange.min + toRange.max) / 2;
                    const first = fromCenter <= toCenter ? fromRange : toRange;
                    const second = first === fromRange ? toRange : fromRange;

                    // 取两端站名之间的空位中点；如果两段站名在切线方向已经互相覆盖，
                    // 仍按两段相邻边界的中点计算，不做额外智能搜索。
                    const gapStart = first.max + 2;
                    const gapEnd = second.min - 2;
                    const targetProjection = (gapStart + gapEnd) / 2;

                    // 星标定位点已经按五角星面积重心校正，避让也必须使用同一个视觉重心，
                    // 不能再拿外接框中心当定位点，否则重心校正后会产生新的切线方向误差。
                    const star = marker.querySelector(".qd-construction-latest-marker-star");
                    const starRect = star?.getBoundingClientRect();
                    const baseRect = marker.getBoundingClientRect();
                    const baseScreenX = starRect
                        ? starRect.left + starRect.width * (12.0 / 24.0)
                        : (baseRect.left + baseRect.right) / 2;
                    const baseScreenY = starRect
                        ? starRect.top + starRect.height * (12.95 / 24.0)
                        : (baseRect.top + baseRect.bottom) / 2;
                    const baseProjection = baseScreenX * screenTx + baseScreenY * screenTy;
                    const tangentOffset = (targetProjection - baseProjection) / screenPerMapUnit;

                    marker.style.left = `${baseX + tx * tangentOffset}px`;
                    marker.style.top = `${baseY + ty * tangentOffset}px`;
                    return;
                }
            }

            // 车站标记不使用区间避让逻辑，保持默认位置。
        });
    }

    function buildConstructionLabels(stations) {
        const layer = ensureLabelLayer();
        if (!layer) return;
        layer.replaceChildren();

        overlayStationIds.forEach((stationId) => {
            const station = stations[stationId];
            const source = document.getElementById(`label_${stationId}`);
            if (!station || !source) return;

            const clone = source.cloneNode(true);
            clone.removeAttribute("id");
            clone.classList.remove("active");
            clone.classList.add("qd-construction-label");
            clone.dataset.sid = stationId;
            clone.setAttribute("aria-hidden", "true");

            const left = parseFloat(source.style.left) || station.x || 0;
            const top = parseFloat(source.style.top) || station.y || 0;

            if (PROGRESS_LABEL_PRESERVE_SOURCE_LAYOUT.has(stationId)) {
                const computed = window.getComputedStyle(source);
                clone.style.left = `${left}px`;
                clone.style.top = `${top}px`;
                clone.style.textAlign = computed.textAlign;
                clone.style.marginLeft = computed.marginLeft;
                clone.style.marginRight = computed.marginRight;
                clone.style.marginTop = computed.marginTop;
                clone.style.marginBottom = computed.marginBottom;
                layer.appendChild(clone);
                return;
            }

            const dir = PROGRESS_LABEL_DIRECTION_OVERRIDES[stationId] || labelDirection(station.align);
            const delta = overlayStationDeltas.get(stationId) || { x: 0, y: 0 };
            // 原站名若已经沿专题移动方向做了特殊外移，通常不再完整叠加 5.5px。
            // 东南山因此不会重复叠加原 offset 与专题 offset。
            const stationOffset = station.offset || { x: 0, y: 0 };
            const existingOutward = Math.max(0,
                (Number(stationOffset.x) || 0) * dir.x +
                (Number(stationOffset.y) || 0) * dir.y
            );
            const defaultExtra = Math.max(0, LABEL_EXTRA_OFFSET - existingOutward);
            const vectorOverride = PROGRESS_LABEL_VECTOR_OVERRIDES[stationId] || null;
            if (vectorOverride) {
                clone.style.left = `${left + delta.x + vectorOverride.x}px`;
                clone.style.top = `${top + delta.y + vectorOverride.y}px`;
            } else {
                clone.style.left = `${left + delta.x + dir.x * defaultExtra}px`;
                clone.style.top = `${top + delta.y + dir.y * defaultExtra}px`;
            }
            layer.appendChild(clone);
        });
    }

    function setOriginalLabelsHidden(hidden) {
        overlayStationIds.forEach((stationId) => {
            const source = document.getElementById(`label_${stationId}`);
            if (source) source.classList.toggle("qd-construction-source-label-hidden", hidden);
        });
    }

    function buildConstructionBadges() {
        const layer = ensureBadgeLayer();
        const sourceLayer = document.getElementById("qingdao-map-line-badges-layer");
        if (!layer || !sourceLayer) return;
        layer.replaceChildren();

        const placementApi = window.QingdaoLineBadges?.mapPlacements || [];
        overlayLineIds.forEach((lineId) => {
            const badges = [...sourceLayer.querySelectorAll(`.qingdao-map-line-badge[data-line-id="${lineId}"]`)];
            const placements = placementApi.filter((item) => item?.lineId === lineId);
            const allowedEndpoints = CONSTRUCTION_BADGE_ENDPOINTS[lineId] || null;

            badges.forEach((source, index) => {
                const endpoint = source.dataset.at || placements[index]?.at || "";
                if (allowedEndpoints && !allowedEndpoints.has(endpoint)) return;

                const clone = source.cloneNode(true);
                clone.classList.add("qd-construction-line-badge");
                layer.appendChild(clone);
            });
        });
    }

    function setOriginalBadgesHidden(hidden) {
        const sourceLayer = document.getElementById("qingdao-map-line-badges-layer");
        if (!sourceLayer) return;

        const placementApi = window.QingdaoLineBadges?.mapPlacements || [];
        overlayLineIds.forEach((lineId) => {
            const badges = [...sourceLayer.querySelectorAll(`.qingdao-map-line-badge[data-line-id="${lineId}"]`)];
            const placements = placementApi.filter((item) => item?.lineId === lineId);
            const allowedEndpoints = CONSTRUCTION_BADGE_ENDPOINTS[lineId] || null;

            badges.forEach((el, index) => {
                const endpoint = el.dataset.at || placements[index]?.at || "";
                const shouldLift = !allowedEndpoints || allowedEndpoints.has(endpoint);
                el.classList.toggle("qd-construction-source-badge-hidden", hidden && shouldLift);
            });
        });
    }

    function suppressBaseLineHighlight() {
        document.querySelectorAll("#lines-layer .line-visual-group.active").forEach((el) => el.classList.remove("active"));
        const highlightLayer = document.getElementById("highlight-layer");
        if (highlightLayer) highlightLayer.replaceChildren();
        document.querySelectorAll("#lines-layer .line-visual-inner, #lines-layer .line-visual-outer, #lines-layer .line-visual-overlay").forEach((el) => {
            el.style.opacity = "";
        });
        document.querySelectorAll("#stations-layer .station[style*='opacity'], #labels-layer .label-group[style*='opacity']").forEach((el) => {
            el.style.opacity = "";
        });
        window.hideLineTooltipNow?.();
    }

    function installHighlightGuard() {
        if (highlightGuardInstalled) return;
        highlightGuardInstalled = true;
        document.addEventListener("click", (event) => {
            if (!visible) return;
            if (!event.target.closest(".station, .label-group")) return;
            // 核心点击逻辑已在 stations/labels 层完成；冒泡到 document 后，仅清除线路高亮视觉。
            suppressBaseLineHighlight();
        });
    }

    /** 在 SVG path 上寻找离地图坐标最近的弧长位置。 */
    function closestLengthOnPath(path, point) {
        const total = path.getTotalLength();
        if (!Number.isFinite(total) || total <= 0) return 0;

        const sampleCount = Math.max(24, Math.ceil(total / 24));
        let step = total / sampleCount;
        let bestLength = 0;
        let bestDistance2 = Infinity;

        const test = (length) => {
            const clamped = Math.max(0, Math.min(total, length));
            const p = path.getPointAtLength(clamped);
            const dx = p.x - point.x;
            const dy = p.y - point.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestDistance2) {
                bestDistance2 = d2;
                bestLength = clamped;
            }
        };

        for (let i = 0; i <= sampleCount; i++) test(i * step);
        for (let round = 0; round < 6; round++) {
            const start = Math.max(0, bestLength - step);
            const end = Math.min(total, bestLength + step);
            const localStep = (end - start) / 8 || step / 8;
            for (let i = 0; i <= 8; i++) test(start + localStep * i);
            step = localStep;
        }
        return bestLength;
    }

    /** 把地图坐标投影到原始折线，并返回沿折线的累计距离。 */
    function projectPointToPolyline(points, point) {
        if (!Array.isArray(points) || points.length < 2 || !point) return null;

        let accumulated = 0;
        let best = null;
        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i];
            const b = points[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len2 = dx * dx + dy * dy;
            const len = Math.sqrt(len2);
            if (len < 1e-6) continue;

            const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2));
            const x = a.x + dx * t;
            const y = a.y + dy * t;
            const ex = x - point.x;
            const ey = y - point.y;
            const distance2 = ex * ex + ey * ey;
            if (!best || distance2 < best.distance2) {
                best = {
                    x, y,
                    distance2,
                    along: accumulated + len * t,
                    segmentIndex: i,
                    segmentT: t
                };
            }
            accumulated += len;
        }
        return best;
    }

    /** 原始折线每个顶点对应的累计距离。 */
    function polylineVertexLengths(points) {
        const out = [0];
        for (let i = 1; i < points.length; i++) {
            out.push(out[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
        }
        return out;
    }

    /**
     * 从线路 pathPoints 中截取 A -> B 的原始折线控制点。
     * 端点取车站在折线上的正投影，中间只保留真正的转角控制点，
     * 不再从已渲染 SVG 曲线上高密度采样。
     */
    function extractControlledPolyline(line, stations, fromId, toId) {
        const points = Array.isArray(line?.pathPoints) ? line.pathPoints : null;
        const fromStation = stations?.[fromId];
        const toStation = stations?.[toId];
        if (!points || points.length < 2 || !fromStation || !toStation) return null;

        const from = projectPointToPolyline(points, fromStation);
        const to = projectPointToPolyline(points, toStation);
        if (!from || !to || Math.abs(to.along - from.along) < 0.01) return null;

        const lengths = polylineVertexLengths(points);
        const forward = to.along > from.along;
        const min = Math.min(from.along, to.along);
        const max = Math.max(from.along, to.along);
        const middle = [];

        for (let i = 1; i < points.length - 1; i++) {
            if (lengths[i] <= min + 1e-6 || lengths[i] >= max - 1e-6) continue;
            middle.push({
                x: points[i].x,
                y: points[i].y,
                ...(points[i].r !== undefined ? { r: points[i].r } : {})
            });
        }
        if (!forward) middle.reverse();

        return [
            { x: from.x, y: from.y },
            ...middle,
            { x: to.x, y: to.y }
        ];
    }

    function cross2(ax, ay, bx, by) {
        return ax * by - ay * bx;
    }

    /**
     * 对原始折线做真正的平行偏移：直线段保持直线，转角取相邻偏移线交点。
     * 屏幕坐标 y 轴向下，因此 (-dy, dx) 是沿 A -> B 前进时的右侧法线。
     */
    function offsetControlledPolyline(points, offset) {
        if (!Array.isArray(points) || points.length < 2) return null;
        const out = [];

        const unit = (a, b) => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const mag = Math.hypot(dx, dy);
            if (mag < 1e-6) return null;
            return { x: dx / mag, y: dy / mag };
        };
        const normal = (u) => ({ x: -u.y, y: u.x });

        const firstU = unit(points[0], points[1]);
        const lastU = unit(points[points.length - 2], points[points.length - 1]);
        if (!firstU || !lastU) return null;

        const firstN = normal(firstU);
        out.push({
            x: points[0].x + firstN.x * offset,
            y: points[0].y + firstN.y * offset
        });

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            const u1 = unit(prev, curr);
            const u2 = unit(curr, next);
            if (!u1 || !u2) continue;

            const n1 = normal(u1);
            const n2 = normal(u2);
            const a = { x: curr.x + n1.x * offset, y: curr.y + n1.y * offset };
            const b = { x: curr.x + n2.x * offset, y: curr.y + n2.y * offset };
            const denom = cross2(u1.x, u1.y, u2.x, u2.y);

            let x;
            let y;
            if (Math.abs(denom) < 1e-6) {
                // 共线时两条偏移线重合，取两法线平均即可。
                x = curr.x + (n1.x + n2.x) * offset * 0.5;
                y = curr.y + (n1.y + n2.y) * offset * 0.5;
            } else {
                const bax = b.x - a.x;
                const bay = b.y - a.y;
                const t = cross2(bax, bay, u2.x, u2.y) / denom;
                x = a.x + u1.x * t;
                y = a.y + u1.y * t;
            }

            const dotRaw = u1.x * u2.x + u1.y * u2.y;
            const dot = Math.max(-1, Math.min(1, dotRaw));
            const autoRadius = Math.abs(dot) < 0.1 ? 18 : 8;
            const requestedRadius = curr.r !== undefined ? curr.r : autoRadius;
            const turn = Math.sign(denom);

            // core/path-geometry.js 里的 r 实际表示“从转角顶点沿两条线段各退多少”
            // （即圆角切点距离），并不是圆弧的几何半径。对于平行偏移线：
            //   切点距离变化量 = 偏移距离 × tan(转角 / 2)
            // 只有 90° 时 tan(45°)=1，才能直接按 ±offset 增减。上一版把所有
            // 斜角也按 ±offset 处理，因此 45° 等转角会出现内侧过小、外侧过大。
            // r:0 是显式直角，必须原样保留。
            let radius = 0;
            if (requestedRadius !== 0) {
                const halfAngleTan = Math.sqrt(
                    Math.max(0, 1 - dot) / Math.max(1e-6, 1 + dot)
                );
                const radiusDelta = turn * offset * halfAngleTan;
                radius = Math.max(0, requestedRadius - radiusDelta);
            }

            out.push({ x, y, r: radius });
        }

        const lastN = normal(lastU);
        out.push({
            x: points[points.length - 1].x + lastN.x * offset,
            y: points[points.length - 1].y + lastN.y * offset
        });
        return out;
    }

    /**
     * 进度轨道的正式几何：使用线路原始控制点 + 与主图相同的 Q 圆角算法。
     * 这样转角由圆角半径直接控制，而不是把曲线采样成大量短 L 线段。
     */
    function makeControlledOffsetPathData(line, stations, fromId, toId, offset) {
        const centerPoints = extractControlledPolyline(line, stations, fromId, toId);
        if (!centerPoints) return "";
        const offsetPoints = offsetControlledPolyline(centerPoints, offset);
        if (!offsetPoints || offsetPoints.length < 2) return "";

        const geometry = window.CGoPathGeometry;
        if (!geometry || typeof geometry.generateRoundedPath !== "function") return "";
        return geometry.generateRoundedPath(offsetPoints, !!line.useStrictRounding);
    }

    /**
     * 仅作为兼容回退：极少数没有 pathPoints 的线路才沿已渲染 path 采样。
     * 青岛当前建设线路均会走上面的“控制点 + Q 圆角”路径。
     */
    function makeSampledOffsetPathData(path, startLength, endLength, offset) {
        const total = path.getTotalLength();
        const signedSpan = endLength - startLength;
        const span = Math.abs(signedSpan);
        if (!Number.isFinite(span) || span < 0.01) return "";

        const direction = signedSpan >= 0 ? 1 : -1;
        const count = Math.max(3, Math.ceil(span / 3));
        const parts = [];

        for (let i = 0; i <= count; i++) {
            const t = i / count;
            const length = startLength + signedSpan * t;
            const p = path.getPointAtLength(Math.max(0, Math.min(total, length)));
            const delta = Math.max(1, Math.min(3, span / 12));
            const before = Math.max(0, Math.min(total, length - delta * direction));
            const after = Math.max(0, Math.min(total, length + delta * direction));
            const p0 = path.getPointAtLength(before);
            const p1 = path.getPointAtLength(after);

            let dx = p1.x - p0.x;
            let dy = p1.y - p0.y;
            let mag = Math.hypot(dx, dy);
            if (mag < 1e-6) {
                dx = direction;
                dy = 0;
                mag = 1;
            }

            const nx = -dy / mag;
            const ny = dx / mag;
            const x = p.x + nx * offset;
            const y = p.y + ny * offset;
            parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
        }
        return parts.join(" ");
    }

    function segmentStyle(detail, lineColor, api) {
        const kind = api.classifyStatus(detail?.status, detail?.date);
        if (kind === "complete") {
            return { color: lineColor, state: "complete", inner: false };
        }
        if (kind === "building") {
            return { color: lineColor, state: "progress", inner: true };
        }
        return { color: NOT_STARTED_COLOR, state: "not-started", inner: false };
    }

    function appendTrack(layer, path, startLength, endLength, detail, line, api, stations, fromId, toId) {
        if (!detail || (detail.side !== "左线" && detail.side !== "右线")) return 0;

        const sign = detail.side === "右线" ? 1 : -1;
        const offset = TRACK_OFFSET * sign;
        const d = makeControlledOffsetPathData(line, stations, fromId, toId, offset)
            || makeSampledOffsetPathData(path, startLength, endLength, offset);
        if (!d) return 0;

        const style = segmentStyle(detail, line.color || "#888", api);
        const base = document.createElementNS(SVG_NS, "path");
        base.setAttribute("d", d);
        base.setAttribute("class", `qd-construction-track qd-construction-track-${style.state}`);
        base.setAttribute("fill", "none");
        base.setAttribute("stroke", style.color);
        base.setAttribute("stroke-width", String(TRACK_WIDTH));
        base.setAttribute("stroke-linecap", "butt");
        base.setAttribute("stroke-linejoin", "round");
        base.dataset.side = detail.side || "";
        base.dataset.status = detail.status || "";
        layer.appendChild(base);

        if (style.inner) {
            const inner = document.createElementNS(SVG_NS, "path");
            inner.setAttribute("d", d);
            inner.setAttribute("class", "qd-construction-track qd-construction-track-progress-inner");
            inner.setAttribute("fill", "none");
            inner.setAttribute("stroke", "#fff");
            inner.setAttribute("stroke-width", String(TRACK_WIDTH_PROGRESS_INNER));
            inner.setAttribute("stroke-linecap", "butt");
            inner.setAttribute("stroke-linejoin", "round");
            layer.appendChild(inner);
        }
        return 1;
    }

    function appendStation(layer, stationId, stationInfo, progressInfo, line, api) {
        if (!stationInfo || !progressInfo) return 0;

        const kind = api.classifyStatus(progressInfo.status, progressInfo.date);
        const state = kind === "complete" ? "topped" : kind === "building" ? "building" : "not-started";
        const color = line.color || "#888";

        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", `qd-construction-station qd-construction-station-${state}`);
        group.setAttribute("transform", `translate(${stationInfo.x} ${stationInfo.y})`);
        group.dataset.stationId = stationId;
        group.dataset.status = progressInfo.status || "";

        // 封顶：白色外圈 + 线路色实心。
        // 在建：两种颜色完全互换 -> 线路色外圈 + 白色实心。
        // 未开工：白色外圈 + 灰色实心。
        const halo = document.createElementNS(SVG_NS, "circle");
        halo.setAttribute("r", String(STATION_OUTER_R));
        halo.setAttribute("fill", state === "building" ? color : "#fff");
        group.appendChild(halo);

        const core = document.createElementNS(SVG_NS, "circle");
        core.setAttribute("r", String(STATION_CORE_R));
        if (state === "building") core.setAttribute("fill", "#fff");
        else if (state === "not-started") core.setAttribute("fill", NOT_STARTED_COLOR);
        else core.setAttribute("fill", color);
        group.appendChild(core);

        layer.appendChild(group);
        overlayStationIds.add(stationId);
        return 1;
    }

    // 在建段与既有运营段衔接处，信息卡数据通常不会给既有车站再录一份建设状态。
    // 专题图为这些“区间端点但无车站进度”的站补一个建成样式，避免粗轨道裸露收头。
    function appendBuiltJunctionStation(layer, stationId, stationInfo, line) {
        if (!stationInfo) return 0;
        const color = line.color || "#888";

        const group = document.createElementNS(SVG_NS, "g");
        group.setAttribute("class", "qd-construction-station qd-construction-station-topped qd-construction-station-junction");
        group.setAttribute("transform", `translate(${stationInfo.x} ${stationInfo.y})`);
        group.dataset.stationId = stationId;
        group.dataset.status = "既有运营衔接站";

        const halo = document.createElementNS(SVG_NS, "circle");
        halo.setAttribute("r", String(STATION_OUTER_R));
        halo.setAttribute("fill", "#fff");
        group.appendChild(halo);

        const core = document.createElementNS(SVG_NS, "circle");
        core.setAttribute("r", String(STATION_CORE_R));
        core.setAttribute("fill", color);
        group.appendChild(core);

        layer.appendChild(group);
        overlayStationIds.add(stationId);
        return 1;
    }

    function buildLine(layer, line, stations, api) {
        const ids = Array.isArray(line.stationIds) ? line.stationIds : [];
        if (ids.length < 2 || !api.getLine(line.id)) return 0;

        const path = document.querySelector(
            `#lines-layer .line-visual-group[data-visual-id="${line.id}"] .line-visual-inner`
        );
        if (!path || typeof path.getTotalLength !== "function") return 0;

        const lengthCache = new Map();
        const lengthOf = (stationId) => {
            if (lengthCache.has(stationId)) return lengthCache.get(stationId);
            const station = stations[stationId];
            if (!station) return null;
            const value = closestLengthOnPath(path, station);
            lengthCache.set(stationId, value);
            return value;
        };

        let count = 0;
        const segmentEndpoints = new Set();

        // 与车站信息卡完全相同：按 stationIds 的相邻关系，用 getSegment(a,b) 双向查找。
        for (let i = 0; i < ids.length - 1; i++) {
            const fromId = ids[i];
            const toId = ids[i + 1];
            const segment = api.getSegment(line.id, fromId, toId);
            if (!segment) continue;

            const orderedFromId = segment.from || fromId;
            const orderedToId = segment.to || toId;
            const fromLength = lengthOf(orderedFromId);
            const toLength = lengthOf(orderedToId);
            if (fromLength === null || toLength === null) continue;

            const details = api.getSegmentDetails(line.id, fromId, toId);
            if (!details.length) continue;

            segmentEndpoints.add(orderedFromId);
            segmentEndpoints.add(orderedToId);
            details.forEach((detail) => {
                count += appendTrack(layer, path, fromLength, toLength, detail, line, api, stations, orderedFromId, orderedToId);
            });
            appendSegmentHit(layer, path, fromLength, toLength, segment, api, line.id);
        }

        // 同样按信息卡接口逐站读取，避免专题层自行解释状态文本。
        const renderedStations = new Set();
        ids.forEach((stationId) => {
            const progressInfo = api.getStation(line.id, stationId);
            if (!progressInfo) return;

            const sourceStation = stations[stationId];
            let displayStation = sourceStation;
            if (sourceStation && CENTERLINE_STATION_IDS.has(stationId)) {
                const stationLength = lengthOf(stationId);
                if (stationLength !== null) {
                    const point = path.getPointAtLength(stationLength);
                    if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
                        overlayStationDeltas.set(stationId, {
                            x: point.x - sourceStation.x,
                            y: point.y - sourceStation.y
                        });
                        displayStation = Object.assign({}, sourceStation, { x: point.x, y: point.y });
                    }
                }
            }

            count += appendStation(layer, stationId, displayStation, progressInfo, line, api);
            renderedStations.add(stationId);
        });

        // 建设数据会保留在建段与既有运营段相接的边界区间，但既有站本身不会录入建设状态。
        // 把这些缺失车站状态的区间端点按“建成车站”补画出来。
        segmentEndpoints.forEach((stationId) => {
            if (renderedStations.has(stationId)) return;
            count += appendBuiltJunctionStation(layer, stationId, stations[stationId], line);
        });

        return count;
    }

    function buildLayer() {
        const layer = ensureLayer();
        const lines = getLines();
        const stations = getStations();
        const api = getProgressApi();
        if (!layer || !api || !lines.length || !Object.keys(stations).length) return false;

        layer.replaceChildren();
        overlayStationIds = new Set();
        overlayLineIds = new Set();
        overlayStationDeltas = new Map();

        const maskGroup = document.createElementNS(SVG_NS, "g");
        maskGroup.setAttribute("class", "qd-construction-mask-group");
        const mask = document.createElementNS(SVG_NS, "rect");
        mask.setAttribute("class", "qd-construction-progress-mask-shape");
        mask.setAttribute("x", "-50000");
        mask.setAttribute("y", "-50000");
        mask.setAttribute("width", "100000");
        mask.setAttribute("height", "100000");
        mask.setAttribute("fill", MASK_FILL);
        maskGroup.appendChild(mask);
        layer.appendChild(maskGroup);

        const progressGroup = document.createElementNS(SVG_NS, "g");
        progressGroup.setAttribute("class", "qd-construction-progress-group");
        layer.appendChild(progressGroup);

        let count = 0;
        lines.forEach((line) => {
            if (!line || !api.getLine(line.id)) return;
            overlayLineIds.add(line.id);
            count += buildLine(progressGroup, line, stations, api);
        });

        buildConstructionLabels(stations);
        buildConstructionBadges();
        buildLatestMarkers(stations, lines);
        ensureLegend();
        built = count > 0;
        return built;
    }

    function syncButton() {
        const btn = document.getElementById(BUTTON_ID);
        if (!btn) return;
        btn.classList.toggle("on", visible);
        btn.setAttribute("aria-pressed", visible ? "true" : "false");
        btn.title = "建设进度";
    }

    function showLayer(layer) {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        const labelLayer = ensureLabelLayer();
        const badgeLayer = ensureBadgeLayer();
        const latestLayer = ensureLatestMarkerLayer();
        const legend = ensureLegend();
        buildLatestMarkers(getStations(), getLines());
        layer.style.display = "block";
        layer.classList.remove("show");
        if (labelLayer) {
            labelLayer.style.display = "block";
            labelLayer.classList.remove("show");
        }
        if (badgeLayer) {
            badgeLayer.style.display = "block";
            badgeLayer.classList.remove("show");
        }
        if (latestLayer) {
            latestLayer.style.display = "block";
            latestLayer.classList.remove("show");
        }
        if (legend) {
            legend.style.display = "block";
            legend.classList.remove("show");
        }
        setOriginalLabelsHidden(true);
        setOriginalBadgesHidden(true);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (!visible) return;
            resolveLatestMarkerLabelCollisions();
            layer.classList.add("show");
            labelLayer?.classList.add("show");
            badgeLayer?.classList.add("show");
            latestLayer?.classList.add("show");
            legend?.classList.add("show");
        }));
    }

    function hideLayer(layer) {
        const labelLayer = ensureLabelLayer();
        const badgeLayer = ensureBadgeLayer();
        const latestLayer = ensureLatestMarkerLayer();
        const legend = ensureLegend();
        layer.classList.remove("show");
        labelLayer?.classList.remove("show");
        badgeLayer?.classList.remove("show");
        latestLayer?.classList.remove("show");
        legend?.classList.remove("show");
        hideTimer = setTimeout(() => {
            if (!visible) {
                layer.style.display = "none";
                if (labelLayer) labelLayer.style.display = "none";
                if (badgeLayer) badgeLayer.style.display = "none";
                if (legend) legend.style.display = "none";
                setOriginalLabelsHidden(false);
                setOriginalBadgesHidden(false);
            }
            hideTimer = null;
        }, FADE_MS + 80);
    }

    function setVisible(force) {
        const next = typeof force === "boolean" ? force : !visible;

        if (next && window.QingdaoIntervalTimes?.visible) {
            window.QingdaoIntervalTimes.hide();
        }

        visible = next;
        const layer = ensureLayer();
        if (!layer) return;

        if (visible && !built) {
            if (!buildLayer()) {
                requestAnimationFrame(() => {
                    if (!visible || !buildLayer()) return;
                    const readyLayer = document.getElementById(LAYER_ID);
                    if (readyLayer) showLayer(readyLayer);
                });
            }
        }

        if (visible) {
            suppressBaseLineHighlight();
            showLayer(layer);
        } else {
            closeSegmentPopup();
            hideLayer(layer);
        }

        document.body.classList.toggle("qd-construction-progress-on", visible);
        syncButton();
    }

    function installControl() {
        const ctrl = document.getElementById("modern-zoom-control");
        if (!ctrl || document.getElementById(BUTTON_ID)) return false;

        const btn = document.createElement("button");
        btn.id = BUTTON_ID;
        btn.type = "button";
        btn.title = "建设进度";
        btn.setAttribute("aria-label", "建设进度");
        btn.setAttribute("aria-pressed", "false");
        btn.innerHTML = '<cgo-icon name="layer" size="20"></cgo-icon>';
        btn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            setVisible();
        });

        ctrl.appendChild(btn);
        return true;
    }

    function init() {
        installHighlightGuard();
        installPopupDismissHandlers();
        if (!installControl()) {
            let tries = 0;
            const timer = setInterval(() => {
                tries++;
                if (installControl() || tries >= 30) clearInterval(timer);
            }, 100);
        }
    }

    window.QingdaoConstructionProgressMap = {
        show: () => setVisible(true),
        hide: () => setVisible(false),
        toggle: () => setVisible(),
        rebuild: () => {
            built = false;
            const ok = buildLayer();
            const layer = ensureLayer();
            if (layer) {
                layer.style.display = visible ? "block" : "none";
                layer.classList.toggle("show", visible);
            }
            const labelLayer = ensureLabelLayer();
            if (labelLayer) {
                labelLayer.style.display = visible ? "block" : "none";
                labelLayer.classList.toggle("show", visible);
            }
            const badgeLayer = ensureBadgeLayer();
            if (badgeLayer) {
                badgeLayer.style.display = visible ? "block" : "none";
                badgeLayer.classList.toggle("show", visible);
            }
            const latestLayer = ensureLatestMarkerLayer();
            if (latestLayer) {
                latestLayer.style.display = visible ? "block" : "none";
                latestLayer.classList.toggle("show", visible);
            }
            const legend = ensureLegend();
            if (legend) {
                legend.style.display = visible ? "block" : "none";
                legend.classList.toggle("show", visible);
            }
            setOriginalLabelsHidden(visible);
            setOriginalBadgesHidden(visible);
            if (visible) requestAnimationFrame(() => resolveLatestMarkerLabelCollisions());
            return ok;
        },
        get visible() { return visible; }
    };

    if (document.readyState === "complete") init();
    else window.addEventListener("load", init, { once: true });
})();
