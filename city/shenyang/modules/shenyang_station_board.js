/**
 * CGo OpenMap - 沈阳车站信息板品牌模块
 *
 * 本模块负责紧凑线路徽标同步、同名站点击处理与方城标识；
 * 侧栏站名标题归一化已拆到 modules/shenyang_station_title.js（走共享层）。
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

    /** 解析 #RRGGBB / rgb() 为 [r, g, b]（0-255），无法解析返回 null */
    function parseColorChannels(color) {
        const raw = String(color || "").trim();
        const hex = raw.match(/^#([0-9a-f]{6})$/i);
        const rgb = raw.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
        if (hex) {
            const value = hex[1];
            return [
                parseInt(value.slice(0, 2), 16),
                parseInt(value.slice(2, 4), 16),
                parseInt(value.slice(4, 6), 16)
            ];
        }
        if (rgb) return rgb.slice(1, 4).map(Number);
        return null;
    }

    function getReadableCircleTextColor(color) {
        const channels = parseColorChannels(color);
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

    /**
     * 判定两个颜色是否视觉接近（RGB 欧氏距离，0-441 空间）。
     * 用于题字 header 染色：徽标圆底与 header 底色接近时徽标会「融」进背景，
     * 需把该徽标的圆底与数字颜色对调。阈值 80 约为人眼明显可辨的下限留余量。
     */
    function colorsClose(colorA, colorB) {
        const a = parseColorChannels(colorA);
        const b = parseColorChannels(colorB);
        if (!a || !b) return false;
        const distance = Math.sqrt(
            (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
        );
        return distance < 80;
    }

    // 暴露底色可读文字色等口径，供沈阳其他城市模块复用（如题字标题栏线路色染色），
    // 避免亮度阈值在各模块各抄一份、日后调整时漏改。
    window.ShenyangUi = Object.assign(window.ShenyangUi || {}, {
        getReadableTextColor: getReadableCircleTextColor,
        colorsClose
    });

    /**
     * @param {Array} lines 线路数组
     * @param {null|{color:string,onColor:string}} headerTint
     *        徽标所在题字 header 的染色信息（底色 / 可读文字色）；
     *        某条线路色与 header 底色接近时，该线路圆底与数字颜色对调防融合
     */
    function createCompactLineBadgeSvg(lines, headerTint = null) {
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
            // 圆底与题字 header 底色接近 → 圆底/数字颜色对调（onColor 底 + 线路色数字）
            const inverted = Boolean(headerTint && colorsClose(line.color, headerTint.color));
            const circleFill = inverted ? headerTint.onColor : line.color;
            const numberFill = inverted ? line.color : getBadgeNumberTextColor(line);
            return `
                <circle cx="${centerX}" cy="${centerY}" r="${circleRadius}" fill="${circleFill}" />
                <text x="${centerX}" y="${centerY + numberVerticalOffset}" text-anchor="middle" dominant-baseline="middle" fill="${numberFill}" font-family="var(--font-en, 'Arimo', 'Arial', sans-serif)" font-size="${fontSize}" font-weight="400"${transform}>${number}</text>
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

    /**
     * 读取徽标所在 header 的题字染色信息（底色 / 可读文字色）。
     * 徽标同步在 rAF 中执行，晚于题字模块 onMounted 给 .panel-header 加类与变量，
     * 故此处可直接读到。非题字 header 返回 null，徽标按常规线路色渲染。
     */
    function getHeaderTintForBadge(badge) {
        const header = typeof badge.closest === "function"
            ? badge.closest(".sy-calligraphy-header")
            : null;
        if (!header) return null;
        const color = window.getComputedStyle(header)
            .getPropertyValue("--sy-cali-line-color").trim();
        if (!color) return null;
        const onColor = window.getComputedStyle(header)
            .getPropertyValue("--sy-cali-on-color").trim() || "#ffffff";
        return { color, onColor };
    }

    function renderCompactLineBadge(badge, lines) {
        const isSingleTram = lines.length === 1 && isTramLine(lines[0]);
        // 有轨矩形徽标反色规则不同（带白描边），题字取色也仅限地铁线，保持原样
        const headerTint = isSingleTram ? null : getHeaderTintForBadge(badge);
        const compactBadge = isSingleTram
            ? createTramwayBadgeSvg(lines[0])
            : createCompactLineBadgeSvg(lines, headerTint);
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

        // 搜索结果与行程规划候选项：同一行内多条线路合并为一个紧凑徽标；只有一条线路时
        // 同样使用本城的定制圆标（与车站信息板保持一致）。
        // 时序注意：core 的 SVG 注入是逐个 await fetch 的，可能在只注入一半时就被本函数扫到；
        // 故必须等整行徽标都注入完成再处理，否则会被先固化成不完整的结果
        // （冷启动首渲染的竞态即源于此）。
        document.querySelectorAll(".search-item, .cgo-rt-item").forEach((item) => {
            const badges = [...item.querySelectorAll(":scope > .search-line-icon")]
                .filter((badge) => !badge.dataset.shenyangBadge);
            if (!badges.length) return;
            // 必须等整行徽标都注入完成，否则会被先固化成不完整的结果
            if (!badges.every((badge) => badge.classList.contains("svg-icon-inlined"))) return;
            if (badges.length >= 2) {
                renderBadgeGroup(badges);
                return;
            }
            // 单线路同样走定制圆标（此前整行只有一条线路时被跳过，导致显示核心默认图标）
            const line = getLineForBadge(badges[0]);
            if (line) renderCompactLineBadge(badges[0], [line]);
        });

        // 搜索结果使用 .search-line-icon，仍复用同一套沈阳自定义线路徽标。
        document.querySelectorAll(
            ".line-badge.svg-icon-inlined:not([data-shenyang-badge]), "
            + ".search-line-icon.svg-icon-inlined:not([data-shenyang-badge])"
        ).forEach((badge) => {
            // 位于多徽标行内的，交由上面的整行合并处理，此处不单独处理
            if (badge.closest(".search-item, .cgo-rt-item")) return;
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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installCompactLineBadgeObserver, { once: true });
    } else {
        installCompactLineBadgeObserver();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-station-board" }
    }));
})();
