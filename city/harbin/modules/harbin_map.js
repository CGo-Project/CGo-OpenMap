/**
 * CGo OpenMap - 哈尔滨画布尺寸模块 (city/harbin/modules/harbin_map.js)
 *
 * 引擎只按 `city.mapSize` 计算平移/居中边界，DOM 上的 `#map-content` **始终是样式表里的
 * 默认尺寸（1850×1300）**，两者不一致就会出现「画布比线网大出一大截、内容还会从底边
 * 溢出」的现象。本模块把 #map-content 对齐到本市实际画布，口径同大连
 * `city/dalian/modules/dalian_map.js`。
 *
 * 画布尺寸取值依据（见 data_stations.js 的坐标）：
 *   线网含站名标签的外接盒为 x 235…1163、y 94…1465，
 *   画布取 1290×1590，即右/下各留约 125px 余量、左/上保留既有的 235/94px 留白。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    "use strict";

    function installMapCanvas() {
        const mapContent = document.getElementById("map-content");
        const mapSize = (window.HARBIN_CITY || {}).mapSize;
        if (!mapContent || !mapSize) return;
        mapContent.style.setProperty("width", `${mapSize.width}px`, "important");
        mapContent.style.setProperty("height", `${mapSize.height}px`, "important");
    }

    function install() {
        installMapCanvas();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "harbin", moduleId: "harbin-map" }
    }));
})();
