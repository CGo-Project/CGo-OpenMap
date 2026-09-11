/**
 * CGo OpenMap - 沈阳地图标签与呼出线模块
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const CITY_STYLE_ID = "shenyang-city-style";
    const CALLOUT_LABEL_CLASS = "label-callout";
    const CALLOUT_LINES_ID = "shenyang-label-callout-lines";
    const SVG_NS = "http://www.w3.org/2000/svg";

    function loadCityStylesheet() {
        const existingLink = document.getElementById(CITY_STYLE_ID);
        if (existingLink) return existingLink;

        const link = document.createElement("link");
        link.id = CITY_STYLE_ID;
        link.rel = "stylesheet";
        link.href = "./city/shenyang/style.css";
        document.head.appendChild(link);
        return link;
    }

    const cityStylesheet = loadCityStylesheet();

    function getStationForLabel(label) {
        const stationId = label?.dataset?.sid;
        if (!stationId) return null;

        const processedStation = window.processedStations?.[stationId];
        if (processedStation) return processedStation;

        const rawStation = window.stationsData?.[stationId]
            || (typeof stationsData !== "undefined" ? stationsData[stationId] : null);
        if (rawStation) return rawStation;

        const name = label.querySelector(".stacn")?.textContent?.trim() || "";
        return name ? { type: label.classList.contains("type-tsf") ? "tsf" : "", cn: name } : null;
    }

    function getMapPoint(clientX, clientY, mapRect, scaleX, scaleY) {
        return {
            x: (clientX - mapRect.left) / scaleX,
            y: (clientY - mapRect.top) / scaleY
        };
    }

    function getCalloutEndpoints(label, stationId) {
        const mapContent = document.getElementById("map-content");
        const stationNode = document.getElementById(`node_${stationId}`);
        if (!mapContent || !stationNode) return null;

        const mapRect = mapContent.getBoundingClientRect();
        const mapWidth = mapContent.offsetWidth || mapRect.width;
        const mapHeight = mapContent.offsetHeight || mapRect.height;
        const scaleX = mapWidth ? mapRect.width / mapWidth : 1;
        const scaleY = mapHeight ? mapRect.height / mapHeight : 1;
        if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) return null;

        const stationRect = stationNode.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        if (!labelRect.width || !labelRect.height) return null;

        const stationCenter = {
            x: stationRect.left + stationRect.width / 2,
            y: stationRect.top + stationRect.height / 2
        };
        const candidates = [
            { x: labelRect.left, y: labelRect.bottom },
            { x: labelRect.right, y: labelRect.bottom }
        ];
        const distance = (point) => Math.hypot(point.x - stationCenter.x, point.y - stationCenter.y);
        const target = distance(candidates[0]) <= distance(candidates[1]) ? candidates[0] : candidates[1];

        return {
            start: getMapPoint(stationCenter.x, stationCenter.y, mapRect, scaleX, scaleY),
            end: getMapPoint(target.x, target.y, mapRect, scaleX, scaleY)
        };
    }

    function createCalloutPath(className, endpoints) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("class", className);
        path.setAttribute("d", `M ${endpoints.start.x} ${endpoints.start.y} L ${endpoints.end.x} ${endpoints.end.y}`);
        path.setAttribute("vector-effect", "non-scaling-stroke");
        return path;
    }

    function syncStationCallouts() {
        const labelsLayer = document.getElementById("labels-layer");
        const linesLayer = document.getElementById("lines-layer");
        const city = window.SHENYANG_CITY;
        if (!labelsLayer || !linesLayer || !city) return;

        const labels = [...labelsLayer.querySelectorAll(".label-group")];
        labels.forEach((label) => {
            const station = getStationForLabel(label);
            const labelStyle = city.getStationLabelStyle?.(station, label.dataset.sid);
            label.classList.toggle(CALLOUT_LABEL_CLASS, labelStyle === "callout");
        });

        const calloutLabels = labels.filter((label) => label.classList.contains(CALLOUT_LABEL_CLASS));
        let calloutLayer = document.getElementById(CALLOUT_LINES_ID);
        if (!calloutLabels.length) {
            calloutLayer?.remove();
            return;
        }

        if (!calloutLayer) {
            calloutLayer = document.createElementNS(SVG_NS, "g");
            calloutLayer.id = CALLOUT_LINES_ID;
            calloutLayer.setAttribute("aria-hidden", "true");
            calloutLayer.setAttribute("pointer-events", "none");
            linesLayer.appendChild(calloutLayer);
        }

        calloutLayer.replaceChildren();
        calloutLabels.forEach((label) => {
            const endpoints = getCalloutEndpoints(label, label.dataset.sid);
            if (!endpoints) return;
            calloutLayer.appendChild(createCalloutPath("shenyang-label-callout-line-halo", endpoints));
            calloutLayer.appendChild(createCalloutPath("shenyang-label-callout-line", endpoints));
        });
    }

    function installStationCalloutObserver() {
        const labelsLayer = document.getElementById("labels-layer");
        if (!labelsLayer || labelsLayer.dataset.shenyangCalloutObserver === "true") return;

        let frameId = 0;
        const scheduleSync = () => {
            if (frameId) return;
            frameId = requestAnimationFrame(() => {
                frameId = 0;
                syncStationCallouts();
            });
        };

        const labelsObserver = new MutationObserver(scheduleSync);
        labelsObserver.observe(labelsLayer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"]
        });

        const mapContent = document.getElementById("map-content");
        if (mapContent) {
            const mapObserver = new MutationObserver(scheduleSync);
            mapObserver.observe(mapContent, { attributes: true, attributeFilter: ["class", "style"] });
        }

        window.addEventListener("resize", scheduleSync, { passive: true });
        cityStylesheet?.addEventListener("load", scheduleSync, { once: true });
        document.fonts?.ready?.then(scheduleSync);
        labelsLayer.dataset.shenyangCalloutObserver = "true";
        scheduleSync();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", installStationCalloutObserver, { once: true });
    } else {
        installStationCalloutObserver();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-map" }
    }));
})();
