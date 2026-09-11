/**
 * CGo OpenMap - 大连地理底图、站名与图例交互模块
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 * @event dalian:geography-rendered
 * @property {{ featureIds: string[] }} detail
 */
(function () {
    const DALIAN_LABEL_STYLE_ID = "dalian-label-enhancements";
    const DALIAN_OCEAN_BLEED = 10000;
    const DALIAN_LAND_FEATURES = [
        {
            id: "mainland",
            cornerRadius: 12,
            points: [
                [0, -1600],
                [1750, 150],
                [1750, 170],
                [1300, 170],
                [1100, 370],
                [700, 370],
                [500, 570],
                [400, 570],
                [250, 720],
                [250, 1200],
                [800, 1200],
                [1000, 1000],
                [1100, 1000],
                [1200, 1100],
                [1300, 1100],
                [1450, 950],
                [1450, 750],
                [1230, 750],
                [1205, 710],
                [1080, 710],
                [1080, 670],
                [1200, 670],
                [1250, 615],
                [1250, 530],
                [1600, 530],
                [1600, 450],
                [6000, 450],
                [6000, -1600]
            ]
        }
    ];
    let legendSyncSuppressed = false;

    function getCity() {
        return window.DALIAN_CITY || {};
    }

    function buildLandPath(points, cornerRadius = 18) {
        if (!Array.isArray(points) || points.length < 3) return "";
        const first = points[0];
        const last = points[points.length - 1];
        const normalizedPoints = points.length > 3
            && first?.[0] === last?.[0]
            && first?.[1] === last?.[1]
            ? points.slice(0, -1)
            : points;
        if (normalizedPoints.length < 3) return "";

        const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
        const moveTowards = (from, to, length) => {
            const segmentLength = distance(from, to);
            if (!segmentLength || length <= 0) return [...from];
            const ratio = Math.min(length / segmentLength, 0.5);
            return [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio];
        };
        const radius = Math.max(0, Number(cornerRadius) || 0);
        const corners = normalizedPoints.map((point, index) => {
            const previous = normalizedPoints[(index - 1 + normalizedPoints.length) % normalizedPoints.length];
            const next = normalizedPoints[(index + 1) % normalizedPoints.length];
            const localRadius = Math.min(radius, distance(point, previous) / 2, distance(point, next) / 2);
            return {
                point,
                before: moveTowards(point, previous, localRadius),
                after: moveTowards(point, next, localRadius)
            };
        });

        let path = `M${corners[0].after[0]} ${corners[0].after[1]}`;
        for (let index = 1; index <= corners.length; index += 1) {
            const corner = corners[index % corners.length];
            path += ` L${corner.before[0]} ${corner.before[1]}`;
            path += ` Q${corner.point[0]} ${corner.point[1]} ${corner.after[0]} ${corner.after[1]}`;
        }
        return `${path} Z`;
    }

    function installGeography() {
        const mapContent = document.getElementById("map-content");
        const scatteredLayer = document.getElementById("scattered-layer");
        const mapSize = getCity().mapSize;
        if (!mapContent || !scatteredLayer || !mapSize) return;

        mapContent.style.setProperty("width", `${mapSize.width}px`, "important");
        mapContent.style.setProperty("height", `${mapSize.height}px`, "important");

        const svgNamespace = "http://www.w3.org/2000/svg";
        let layer = document.getElementById("dalian-geography-layer");
        if (!layer) {
            layer = document.createElementNS(svgNamespace, "svg");
            layer.id = "dalian-geography-layer";
            layer.setAttribute("aria-hidden", "true");
            layer.style.cssText = [
                "position:absolute",
                "inset:0",
                "width:100%",
                "height:100%",
                "overflow:visible",
                "pointer-events:none",
                "z-index:1"
            ].join(";");
            mapContent.insertBefore(layer, scatteredLayer);
        }

        layer.setAttribute("viewBox", `0 0 ${mapSize.width} ${mapSize.height}`);
        layer.setAttribute("preserveAspectRatio", "none");
        layer.replaceChildren();

        const defs = document.createElementNS(svgNamespace, "defs");
        const shadowFilter = document.createElementNS(svgNamespace, "filter");
        shadowFilter.setAttribute("id", "dalian-land-shadow");
        shadowFilter.setAttribute("x", "-20%");
        shadowFilter.setAttribute("y", "-20%");
        shadowFilter.setAttribute("width", "140%");
        shadowFilter.setAttribute("height", "150%");
        const dropShadow = document.createElementNS(svgNamespace, "feDropShadow");
        dropShadow.setAttribute("dx", "0");
        dropShadow.setAttribute("dy", "6");
        dropShadow.setAttribute("stdDeviation", "0");
        dropShadow.setAttribute("flood-color", "var(--info-color)");
        dropShadow.setAttribute("flood-opacity", "0.18");
        shadowFilter.appendChild(dropShadow);
        defs.appendChild(shadowFilter);
        layer.appendChild(defs);

        const ocean = document.createElementNS(svgNamespace, "rect");
        ocean.setAttribute("x", String(-DALIAN_OCEAN_BLEED));
        ocean.setAttribute("y", String(-DALIAN_OCEAN_BLEED));
        ocean.setAttribute("width", String(mapSize.width + DALIAN_OCEAN_BLEED * 2));
        ocean.setAttribute("height", String(mapSize.height + DALIAN_OCEAN_BLEED * 2));
        ocean.setAttribute("fill", "var(--info-color)");
        ocean.setAttribute("fill-opacity", "0.14");
        layer.appendChild(ocean);

        DALIAN_LAND_FEATURES.forEach((feature) => {
            const pathData = buildLandPath(feature.points, feature.cornerRadius);
            if (!pathData) return;
            const path = document.createElementNS(svgNamespace, "path");
            path.setAttribute("id", `dalian-land-${feature.id}`);
            path.setAttribute("d", pathData);
            path.setAttribute("fill", "var(--map-bg)");
            path.setAttribute("filter", "url(#dalian-land-shadow)");
            layer.appendChild(path);
        });

        document.dispatchEvent(new CustomEvent("dalian:geography-rendered", {
            detail: { featureIds: DALIAN_LAND_FEATURES.map((feature) => feature.id) }
        }));
    }

    function getStationMap() {
        if (window.stationsData) return window.stationsData;
        if (typeof stationsData !== "undefined") return stationsData;
        return {};
    }

    function getLabelConfig(station) {
        const label = station?.label && typeof station.label === "object" ? station.label : {};
        const text = label.text ?? label.cn ?? station?.labelText ?? station?.cn ?? "";
        const enText = label.en ?? label.enText ?? station?.labelEnText ?? station?.labelEn ?? station?.en ?? "";
        const icon = label.icon ?? station?.labelIcon ?? null;
        return { text: String(text), enText: String(enText), icon };
    }

    function hasLabelBreak(text) {
        return /\r?\n|<br\s*\/?\s*>/i.test(String(text));
    }

    function getPlainStationName(text) {
        return String(text || "")
            .replace(/<br\s*\/?\s*>/gi, "")
            .replace(/\r?\n/g, "")
            .trim();
    }

    function prepareStationNames() {
        Object.values(getStationMap()).forEach((station) => {
            const config = getLabelConfig(station);
            const displayText = station.dalianLabelText ?? config.text;
            const displayEnText = station.dalianLabelEnText ?? config.enText;
            const labelConfig = station?.label && typeof station.label === "object" ? station.label : {};
            const hasCnOverride = station.dalianLabelText != null
                || labelConfig.text != null
                || labelConfig.cn != null
                || station?.labelText != null
                || hasLabelBreak(config.text)
                || Boolean(config.icon);
            const hasEnOverride = station.dalianLabelEnText != null
                || labelConfig.en != null
                || labelConfig.enText != null
                || station?.labelEnText != null
                || station?.labelEn != null
                || hasLabelBreak(config.enText);
            if (!hasCnOverride && !hasEnOverride) return;

            if (station.dalianLabelText == null && hasCnOverride) station.dalianLabelText = config.text;
            if (station.dalianLabelEnText == null && hasEnOverride) station.dalianLabelEnText = config.enText;
            if (hasCnOverride) {
                const plainName = getPlainStationName(displayText);
                if (plainName) station.cn = plainName;
            }
            if (hasEnOverride) {
                const plainEnName = getPlainStationName(displayEnText);
                if (plainEnName) station.en = plainEnName;
            }
        });
    }

    function createLabelLines(text, textClass, lineClass) {
        const textElement = document.createElement("span");
        textElement.className = textClass;
        String(text).replace(/<br\s*\/?\s*>/gi, "\n").split(/\r?\n/).forEach((line) => {
            const lineElement = document.createElement("span");
            lineElement.className = lineClass;
            lineElement.textContent = line;
            textElement.appendChild(lineElement);
        });
        return textElement;
    }

    function ensureLabelStyles() {
        if (document.getElementById(DALIAN_LABEL_STYLE_ID)) return;
        const style = document.createElement("style");
        style.id = DALIAN_LABEL_STYLE_ID;
        style.textContent = `
            #labels-layer .stacn,
            #labels-layer .staen { white-space: pre; }
            #info-panel .panel-cn-name,
            .ctx-header { white-space: pre-line; }
            #labels-layer .dalian-label-icon {
                width: 1em;
                height: 1em;
                margin-right: 2px;
                vertical-align: -0.12em;
                object-fit: contain;
            }
            #labels-layer .dalian-label-cn-text {
                display: inline-block;
                vertical-align: top;
            }
            #labels-layer .dalian-label-content {
                display: inline-flex;
                align-items: flex-start;
            }
            #labels-layer .dalian-label-cn-line,
            #labels-layer .dalian-label-en-line {
                display: block;
                white-space: nowrap;
            }
            #labels-layer .dalian-label-en-text { display: block; }
        `;
        document.head.appendChild(style);
    }

    function enhanceStationLabels() {
        const layer = document.getElementById("labels-layer");
        const stationMap = window.processedStations || getStationMap();
        if (!layer) return;

        layer.querySelectorAll(".label-group[data-sid]").forEach((label) => {
            const station = stationMap[label.dataset.sid];
            const cnLabel = label.querySelector(".stacn");
            const enLabel = label.querySelector(".staen");
            if (!station || !cnLabel) return;

            const config = getLabelConfig(station);
            const cnText = station.dalianLabelText ?? config.text;
            const enText = station.dalianLabelEnText ?? config.enText;
            const hasCnEnhancement = station.dalianLabelText != null || Boolean(config.icon) || hasLabelBreak(cnText);
            const hasEnEnhancement = station.dalianLabelEnText != null || hasLabelBreak(enText);
            if (!hasCnEnhancement && !hasEnEnhancement) return;

            const iconConfig = typeof config.icon === "string" ? { src: config.icon } : (config.icon || {});
            const labelKey = `${cnText}\u0000${iconConfig.src || ""}\u0000${enText}`;
            if (label.dataset.dalianLabelKey === labelKey) return;

            if (hasCnEnhancement) {
                cnLabel.replaceChildren();
                const contentElement = document.createElement("span");
                contentElement.className = "dalian-label-content";
                if (iconConfig.src) {
                    const icon = document.createElement("img");
                    icon.className = "dalian-label-icon";
                    icon.src = iconConfig.src;
                    icon.alt = iconConfig.alt || "";
                    icon.title = iconConfig.title || "";
                    icon.setAttribute("aria-hidden", icon.alt ? "false" : "true");
                    icon.draggable = false;
                    contentElement.appendChild(icon);
                }
                contentElement.appendChild(createLabelLines(cnText, "dalian-label-cn-text", "dalian-label-cn-line"));
                cnLabel.appendChild(contentElement);
            }
            if (hasEnEnhancement && enLabel) {
                enLabel.replaceChildren();
                enLabel.appendChild(createLabelLines(enText, "dalian-label-en-text", "dalian-label-en-line"));
            }
            label.dataset.dalianLabelKey = labelKey;
        });
    }

    function installLabelEnhancements() {
        prepareStationNames();
        ensureLabelStyles();
        const layer = document.getElementById("labels-layer");
        if (!layer) return;
        if (layer.dataset.dalianLabelObserver === "true") {
            enhanceStationLabels();
            return;
        }

        const observer = new MutationObserver(enhanceStationLabels);
        observer.observe(layer, { childList: true, subtree: true });
        layer.dataset.dalianLabelObserver = "true";
        enhanceStationLabels();
    }

    function installLegendSyncIsolation() {
        const legend = document.getElementById("legend-content");
        if (!legend || legend.dataset.dalianLegendSyncObserver === "true") return;

        legend.addEventListener("click", (event) => {
            const item = event.target?.closest?.(".legend-item");
            const lineHeader = event.target?.closest?.(".tree-line-header");
            if (!item && !lineHeader) return;

            let targets = [];
            if (item) {
                try {
                    targets = JSON.parse(item.dataset.targets || "[]");
                } catch (_) {
                    return;
                }
            } else {
                const lineGroup = lineHeader.closest?.(".tree-line-group");
                if (lineGroup?.dataset.lineId) targets = [lineGroup.dataset.lineId];
            }
            if (!Array.isArray(targets) || (!targets.includes("DLM13") && !targets.includes("DLM99"))) return;
            if (legendSyncSuppressed) return;

            const syncGroups = getCity().LINE_SYNC_GROUPS;
            if (!Array.isArray(syncGroups)) return;
            legendSyncSuppressed = true;
            const savedSyncGroups = syncGroups.splice(0);
            window.setTimeout(() => {
                syncGroups.push(...savedSyncGroups);
                legendSyncSuppressed = false;
            }, 0);
        }, true);
        legend.dataset.dalianLegendSyncObserver = "true";
    }

    function install() {
        installGeography();
        installLabelEnhancements();
        installLegendSyncIsolation();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "dalian", moduleId: "dalian-map" }
    }));
})();
