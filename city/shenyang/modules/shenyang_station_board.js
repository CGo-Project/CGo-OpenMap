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
        const match = String(line?.name || "").match(/^(\d+)号线$/);
        return match ? match[1] : null;
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
                <text x="${centerX}" y="${centerY + numberVerticalOffset}" text-anchor="middle" dominant-baseline="middle" fill="${getBadgeNumberTextColor(line)}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="400"${transform}>${number}</text>
            `;
        }).join("");

        return {
            width: totalWidth,
            svg: `
                <svg class="shenyang-line-badge-svg" viewBox="0 0 ${totalWidth} ${height}" aria-hidden="true" focusable="false" xmlns="${SVG_NS}">
                    ${circleMarkup}
                    <g transform="translate(${labelX} ${centerY})" fill="currentColor" text-anchor="start">
                        <text x="0" y="-5.2" dominant-baseline="middle" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="11" font-weight="700">号线</text>
                        <text x="0" y="6.2" dominant-baseline="middle" font-family="Arimo, Arial, sans-serif" font-size="8.5" font-weight="700">${englishLabel}</text>
                    </g>
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
        const compactBadge = createCompactLineBadgeSvg(lines);
        if (!compactBadge) return false;

        const height = getBadgeHeight(badge);
        const width = compactBadge.width * height / LINE_BADGE_CONFIG.height;
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
        return badges.map(getLineForBadge).filter((line) => {
            if (!line || !getLineNumber(line) || seen.has(line.id)) return false;
            seen.add(line.id);
            return true;
        });
    }

    function normalizeSidebarHistoryTitles() {
        document.querySelectorAll(".station-history-section .section-header > span:first-child").forEach((title) => {
            const currentTitle = String(title.textContent || "");
            if (/\s*[（(]地铁站[）)]$/.test(currentTitle)) {
                title.textContent = currentTitle.replace(/\s*[（(]地铁站[）)]$/, "站");
            }
        });
    }

    function syncCompactLineBadges() {
        document.querySelectorAll(".panel-badges").forEach((container) => {
            const badges = [...container.querySelectorAll(":scope > .line-badge")];
            if (badges.length < 2 || !badges.every((badge) => badge.classList.contains("svg-icon-inlined"))) return;

            const lines = getDistinctBadgeLines(badges);
            if (lines.length !== badges.length) return;

            const finalBadge = badges[badges.length - 1];
            if (!renderCompactLineBadge(finalBadge, lines)) return;
            badges.slice(0, -1).forEach((badge) => badge.remove());
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
