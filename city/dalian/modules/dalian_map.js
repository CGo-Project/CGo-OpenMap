/**
 * CGo OpenMap - 大连地理底图、站名与图例交互模块
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 * @event dalian:geography-rendered
 * @property {{ asset: string }} detail
 */
(function () {
    const DALIAN_LABEL_STYLE_ID = "dalian-label-enhancements";
    const DALIAN_SEA_ASSET = "./city/dalian/assets/dalian_sea.svg";
    let legendSyncSuppressed = false;

    function getCity() {
        return window.DALIAN_CITY || {};
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

        const seaDecoration = document.createElementNS(svgNamespace, "image");
        seaDecoration.setAttribute("x", "0");
        seaDecoration.setAttribute("y", "0");
        seaDecoration.setAttribute("width", String(mapSize.width));
        seaDecoration.setAttribute("height", String(mapSize.height));
        seaDecoration.setAttribute("preserveAspectRatio", "none");
        seaDecoration.setAttribute("aria-hidden", "true");
        seaDecoration.setAttribute("pointer-events", "none");
        seaDecoration.setAttribute("href", DALIAN_SEA_ASSET);
        seaDecoration.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", DALIAN_SEA_ASSET);
        layer.appendChild(seaDecoration);

        document.dispatchEvent(new CustomEvent("dalian:geography-rendered", {
            detail: { asset: DALIAN_SEA_ASSET }
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
