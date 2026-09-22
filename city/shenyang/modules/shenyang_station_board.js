/**
 * CGo OpenMap - 沈阳车站信息板品牌模块
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const LINE_BADGE_CONFIG = {
        height: 32,
        circleHeight: 24,
        circleGap: 2,
        numberFontSize: 18,
        twoDigitNumberFontSize: 15,
        numberVerticalOffset: 1,
        labelGap: 3
    };
    const LINE_BADGE_OVERRIDES = {
        SYM10: {
            numberTextColor: "#ffffff",
            numberFontSize: 18,
            numberScaleX: 0.8
        }
    };
    const FANGCHENG_DECORATION = {
        src: "./city/shenyang/assets/fangcheng.svg",
        title: "本站位于沈阳方城文化旅游区"
    };
    const FANGCHENG_STATIONS = new Set(["怀远门", "中街", "大南门"]);

    const escapeAttribute = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    function getShenyangLinesData() {
        if (Array.isArray(window.linesData)) return window.linesData;
        if (typeof linesData !== "undefined" && Array.isArray(linesData)) return linesData;
        return [];
    }

    function getLineNumber(line) {
        const match = String(line?.name || "").match(/(\d+)号线$/);
        return match ? match[1] : null;
    }

    function isTramLine(line) {
        return Boolean(line && (
            String(line.id || "").toUpperCase().startsWith("HNT")
            || String(line.name || "").includes("有轨")
        ));
    }

    function isTramStation(station) {
        const lineList = getShenyangLinesData();
        return Boolean(station?.relatedLines?.some((lineId) => {
            const line = lineList.find((item) => item?.id === lineId);
            return isTramLine(line || { id: lineId });
        }));
    }

    function getLineForBadge(badge) {
        const source = String(badge?.dataset?.src || "");
        const sourceFile = source.split("?")[0].split("/").pop();
        const sourceNumber = sourceFile?.match(/icon@(\d+)\.svg$/i)?.[1];
        const lineList = getShenyangLinesData();

        return lineList.find((line) => line.svg === sourceFile)
            || lineList.find((line) => getLineNumber(line) === String(Number(sourceNumber)))
            || null;
    }

    function getBadgeLines(badge) {
        const lineList = getShenyangLinesData();
        const mergedIds = String(badge?.dataset?.shenyangBadge || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        if (mergedIds.length > 0) {
            const mergedLines = mergedIds.map((id) => lineList.find((line) => line.id === id));
            return mergedLines.every(Boolean) ? mergedLines : null;
        }
        const line = getLineForBadge(badge);
        return line ? [line] : null;
    }

    function getReadableCircleTextColor(color) {
        const hex = String(color || "").trim().match(/^#([0-9a-f]{6})$/i);
        const rgb = String(color || "").match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
        let channels = null;

        if (hex) {
            const value = hex[1];
            channels = [
                parseInt(value.slice(0, 2), 16),
                parseInt(value.slice(2, 4), 16),
                parseInt(value.slice(4, 6), 16)
            ];
        } else if (rgb) {
            channels = rgb.slice(1, 4).map(Number);
        }
        if (!channels) return "#ffffff";

        const [red, green, blue] = channels.map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.04045
                ? normalized / 12.92
                : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        return luminance > 0.34 ? "#00263b" : "#ffffff";
    }

    function getBadgeNumberTextColor(line) {
        return LINE_BADGE_OVERRIDES[line?.id]?.numberTextColor
            || getReadableCircleTextColor(line?.color);
    }

    function createCompactLineBadgeSvg(lines) {
        const lineNumbers = lines.map(getLineNumber).filter(Boolean);
        if (!lineNumbers.length) return null;

        const {
            height,
            circleHeight,
            circleGap,
            numberFontSize,
            twoDigitNumberFontSize,
            numberVerticalOffset,
            labelGap
        } = LINE_BADGE_CONFIG;
        const circleRadius = circleHeight / 2;
        const centerY = height / 2;
        const circlesWidth = lineNumbers.length * circleHeight + Math.max(0, lineNumbers.length - 1) * circleGap;
        const labelX = circlesWidth + labelGap;
        const englishLabel = `Line ${lineNumbers.join("/")}`;
        const englishWidth = Math.max(23, englishLabel.length * 4.2);
        const labelWidth = Math.max(22, englishWidth);
        const totalWidth = Math.ceil(labelX + labelWidth + 1);
        const circleMarkup = lines.map((line, index) => {
            const number = getLineNumber(line);
            if (!number) return "";
            const centerX = circleRadius + index * (circleHeight + circleGap);
            const override = LINE_BADGE_OVERRIDES[line.id] || {};
            const fontSize = override.numberFontSize || (number.length > 1 ? twoDigitNumberFontSize : numberFontSize);
            const scaleX = override.numberScaleX || 1;
            const transform = scaleX === 1
                ? ""
                : ` transform="translate(${centerX} 0) scale(${scaleX} 1) translate(${-centerX} 0)"`;
            return `
                <circle cx="${centerX}" cy="${centerY}" r="${circleRadius}" fill="${line.color}" />
                <text x="${centerX}" y="${centerY + numberVerticalOffset}" text-anchor="middle" dominant-baseline="middle" fill="${getBadgeNumberTextColor(line)}" font-family="var(--font-en, 'Arimo', 'Arial', sans-serif)" font-size="${fontSize}" font-weight="400"${transform}>${number}</text>
            `;
        }).join("");

        return {
            width: totalWidth,
            svg: `
                <svg class="shenyang-line-badge-svg" viewBox="0 0 ${totalWidth} ${height}" aria-hidden="true" focusable="false" xmlns="${SVG_NS}">
                    ${circleMarkup}
                    <g transform="translate(${labelX} ${centerY})" fill="currentColor" text-anchor="start">
                        <text x="0" y="-5.2" dominant-baseline="middle" font-family="var(--font-sans, 'Noto Sans SC', sans-serif)" font-size="11" font-weight="700">号线</text>
                        <text x="0" y="6.2" dominant-baseline="middle" font-family="var(--font-en, 'Arimo', 'Arial', sans-serif)" font-size="8.5" font-weight="700">${englishLabel}</text>
                    </g>
                </svg>
            `
        };
    }

    function createTramwayBadgeSvg(line) {
        const number = getLineNumber(line);
        if (!number) return null;
        const width = number.length > 1 ? 78 : 70;
        const centerX = width / 2;

        return {
            width,
            height: 32,
            svg: `
                <svg class="shenyang-line-badge-svg shenyang-tramway-badge-svg" viewBox="0 0 ${width} 32" aria-hidden="true" focusable="false" xmlns="${SVG_NS}">
                    <rect x="1" y="1" width="${width - 2}" height="30" rx="2" fill="${line.color}" stroke="#ffffff" stroke-width="2" />
                    <text x="${centerX}" y="11" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="var(--font-sans, 'Noto Sans SC', sans-serif)" font-size="11" font-weight="400">有轨${number}号线</text>
                    <text x="${centerX}" y="22" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="var(--font-en, 'Arimo', 'Arial', sans-serif)" font-size="8.5" font-weight="400">Tramway Line ${number}</text>
                </svg>
            `
        };
    }

    function getBadgeHeight(badge) {
        const computedHeight = Number.parseFloat(window.getComputedStyle(badge).height);
        return Number.isFinite(computedHeight) && computedHeight > 0
            ? computedHeight
            : LINE_BADGE_CONFIG.height;
    }

    function renderCompactLineBadge(badge, lines) {
        const compactBadge = lines.length === 1 && isTramLine(lines[0])
            ? createTramwayBadgeSvg(lines[0])
            : createCompactLineBadgeSvg(lines);
        if (!compactBadge) return false;

        const height = getBadgeHeight(badge);
        const width = compactBadge.width * height / compactBadge.height;
        const lineNames = lines.map((line) => line.name).join(" / ");

        badge.innerHTML = compactBadge.svg;
        badge.classList.remove("svg-icon-placeholder");
        badge.classList.add("svg-icon-inlined", "shenyang-line-badge");
        badge.dataset.shenyangBadge = lines.map((line) => line.id).join(",");
        badge.style.width = `${width}px`;
        badge.title = lineNames;
        badge.setAttribute("aria-label", lineNames);
        return true;
    }

    function getDistinctBadgeLines(badges) {
        const seen = new Set();
        const lines = [];
        for (const badge of badges) {
            const badgeLines = getBadgeLines(badge);
            if (!badgeLines) return null;
            for (const line of badgeLines) {
                if (!getLineNumber(line)) return null;
                if (seen.has(line.id)) continue;
                seen.add(line.id);
                lines.push(line);
            }
        }
        return lines;
    }

    function renderBadgeGroup(badges) {
        if (!badges.length || !badges.every((badge) => badge.classList.contains("svg-icon-inlined"))) return;
        if (badges.length === 1 && badges[0].dataset.shenyangBadge) return;

        const lines = getDistinctBadgeLines(badges);
        if (!lines?.length) return;

        // 有轨徽标必须保留各自的双语文字与线路色底条，避免合并后丢失线路类型。
        if (lines.some(isTramLine)) {
            if (lines.length === 1) renderCompactLineBadge(badges[badges.length - 1], lines);
            return;
        }

        const finalBadge = badges[badges.length - 1];
        if (!renderCompactLineBadge(finalBadge, lines)) return;
        badges.slice(0, -1).forEach((badge) => badge.remove());
    }

    /**
     * 强制标注「（有轨站）」的有轨站名。
     * 用于「字面不同名、语义却高度混淆」的情况 —— 同名判定抓不到，需人工列出。
     * 沈阳目前为空，如有此类站名再补。
     */
    const TRAM_FORCE_SUFFIX_NAMES = [];

    /**
     * 侧栏历史车站标题归一化（沈阳规则）
     *   - 地铁站：站名以「站」结尾时**保留双写**（沈阳站 → 沈阳站站，与地铁官方站名一致）
     *   - 有轨站：与地铁站同名时 → 「XX站（有轨站）」
     *   - 国铁车站 → 「XX站（火车站）」
     *   - 与国铁站同名的地铁站：沈阳不做特殊化，仍为「XX站站」
     */
    function buildSidebarStationTitle(station, stations) {
        const name = String(station?.cn || "");
        if (!name) return "";

        const isTram = isTramStation(station);
        const isRail = station.type === "rdot";
        const isMetro = !isTram && !isRail;

        // 末尾「站」去重：沈阳仅地铁站保留「XX站站」，其余去重为「XX站」
        const base = (name.endsWith("站") && !isMetro) ? name : name + "站";

        const others = Object.keys(stations)
            .map((id) => stations[id])
            .filter((other) => other && other.id !== station.id && other.cn === station.cn);
        const hasMetro = others.some((other) => !isTramStation(other) && other.type !== "rdot");
        const hasRail = others.some((other) => other.type === "rdot");

        if (isTram) {
            return (hasMetro || TRAM_FORCE_SUFFIX_NAMES.includes(name)) ? `${base}（有轨站）` : base;
        }
        if (isRail) return `${base}（火车站）`;
        return base;
    }

    function normalizeSidebarHistoryTitles() {
        const stations = window.processedStations || window.stationsData || {};
        document.querySelectorAll(".station-history-section").forEach((section) => {
            const sid = section.dataset?.sid;
            const station = sid ? stations[sid] : null;
            if (!station) return;
            const titleEl = section.querySelector(".section-title-text")
                || section.querySelector(".section-header > span:first-child");
            if (!titleEl) return;
            const next = buildSidebarStationTitle(station, stations);
            // 仅在确有差异时写入，避免 MutationObserver 自触发死循环
            if (next && titleEl.textContent !== next) titleEl.textContent = next;
        });
    }

    function rewriteTramwayNavigation(infoPanel, context) {
        const station = context?.station;
        if (!infoPanel || !isTramStation(station)) return;

        const city = context?.city || window.SHENYANG_CITY || window.CURRENT_CITY;
        const mapUrl = city?.getNavigationUrl?.(station.cn, false, { station, isTram: true });
        if (!mapUrl) return;

        infoPanel.querySelectorAll('a[href*="uri.amap.com/search"]').forEach((link) => {
            if (String(link.textContent || '').includes('高德导航')) link.href = mapUrl;
        });
    }

    function hasVirtualTransferBetween(candidates) {
        const candidateIds = new Set(candidates.map((station) => station.id));
        return candidates.some((station) => {
            const paidTargets = window.VIRTUAL_TRANSFER_MAP?.[station.id]
                || (typeof VIRTUAL_TRANSFER_MAP !== "undefined" ? VIRTUAL_TRANSFER_MAP[station.id] : null)
                || [];
            const freeTargets = window.VIRTUAL_FREE_TRANSFER_MAP?.[station.id]
                || (typeof VIRTUAL_FREE_TRANSFER_MAP !== "undefined" ? VIRTUAL_FREE_TRANSFER_MAP[station.id] : null)
                || [];
            return [...paidTargets, ...freeTargets].some((targetId) => candidateIds.has(targetId));
        });
    }

    function installSameNameStationClickHandler() {
        const labelsLayer = document.getElementById("labels-layer");
        if (!labelsLayer || labelsLayer.dataset.shenyangSameNameHandler === "true") return;

        labelsLayer.addEventListener("click", (event) => {
            const label = event.target.closest(".label-group");
            if (!label || !labelsLayer.contains(label)) return;

            const clickedId = label.dataset.sid;
            const stationMap = window.processedStations || {};
            const clickedStation = stationMap[clickedId];
            if (!clickedStation) return;

            const candidates = Object.values(stationMap).filter((station) => (
                station?.cn === clickedStation.cn && station.type !== "no"
            ));
            if (candidates.length <= 1 || hasVirtualTransferBetween(candidates)) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            document.getElementById("station-selector")?.remove();
            window.selectStation?.(clickedId, event.pageX, event.pageY);
        }, true);

        labelsLayer.dataset.shenyangSameNameHandler = "true";
    }

    function syncCompactLineBadges() {
        document.querySelectorAll(".panel-badges").forEach((container) => {
            const badges = [...container.querySelectorAll(":scope > .line-badge")];
            if (badges.length >= 2) renderBadgeGroup(badges);
        });

        document.querySelectorAll("#station-selector .selector-item").forEach((item) => {
            const badges = [...item.querySelectorAll(":scope > .svg-icon-inlined")];
            renderBadgeGroup(badges);
        });

        document.querySelectorAll(".transfer-section .info-row > div:last-child").forEach((container) => {
            const groups = new Map();
            const badges = [...container.querySelectorAll(":scope > .line-badge.transfer-link")];
            badges.forEach((badge) => {
                const targetSid = badge.dataset.jumpSid || "";
                if (!groups.has(targetSid)) groups.set(targetSid, []);
                groups.get(targetSid).push(badge);
            });
            groups.forEach(renderBadgeGroup);
        });

        // 搜索结果使用 .search-line-icon，仍复用同一套沈阳自定义线路徽标。
        document.querySelectorAll(
            ".line-badge.svg-icon-inlined:not([data-shenyang-badge]), "
            + ".search-line-icon.svg-icon-inlined:not([data-shenyang-badge])"
        ).forEach((badge) => {
            const line = getLineForBadge(badge);
            if (line) renderCompactLineBadge(badge, [line]);
        });

        document.querySelectorAll("#line-tooltip > .svg-icon-inlined[data-src]:not([data-shenyang-badge])").forEach((badge) => {
            const line = getLineForBadge(badge);
            if (line) renderCompactLineBadge(badge, [line]);
        });
    }

    function installCompactLineBadgeObserver() {
        const root = document.body;
        if (!root || root.dataset.shenyangLineBadgeObserver === "true") return;

        installSameNameStationClickHandler();

        let frameId = 0;
        const scheduleSync = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                normalizeSidebarHistoryTitles();
                syncCompactLineBadges();
            });
        };
        const observer = new MutationObserver(scheduleSync);
        observer.observe(root, { childList: true, subtree: true });
        root.dataset.shenyangLineBadgeObserver = "true";
        scheduleSync();
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "shenyang-tramway-navigation",
            name: "沈阳有轨电车导航",
            slot: "footer",
            order: 11,
            shouldRender: ({ station }) => isTramStation(station),
            render: () => "",
            onMounted: rewriteTramwayNavigation
        });

        window.StationBoard.registerModule({
            id: "shenyang-fangcheng-decoration",
            name: "沈阳方城标识",
            slot: "header",
            order: 15,
            shouldRender({ station }) {
                return FANGCHENG_STATIONS.has(station?.cn);
            },
            render() {
                return `<img class="shenyang-station-header-decoration" src="${escapeAttribute(FANGCHENG_DECORATION.src)}" title="${escapeAttribute(FANGCHENG_DECORATION.title)}" alt="" aria-hidden="true" draggable="false">`;
            }
        });
    }

    // 导出标题归一化能力，便于复用与自测
    window.ShenyangStationTitle = {
        buildTitle: buildSidebarStationTitle,
        normalizeTitles: normalizeSidebarHistoryTitles
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installCompactLineBadgeObserver, { once: true });
    } else {
        installCompactLineBadgeObserver();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-station-board" }
    }));
})();
