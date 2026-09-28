/**
 * CGo OpenMap - 沈阳车站层级图（剖面图）模块
 *
 * 以沈阳地铁官网刊载的「车站层级图」作为纯图片卡片，挂载于「车站信息」页签置顶。
 * 图片不落本地仓库，直接热链官网：
 *   https://www.symtc.com/wwmhm/icons//czcjt/{官网编号}.png
 * 官网编号由 data_timetable.js 按 SYMTC_OFFICIAL_STATION_ID_RULES 推导，与信息板的
 * 「官网查询」按钮同源；未能解析出编号的车站（有轨电车、国铁、未纳入官网编号体系的
 * 在建站）不渲染卡片。
 *
 * 时序注意：data_timetable.js 在本模块之后才加载（见 main.html 的脚本加载链），
 * 因此映射必须惰性读取，不能在 IIFE 顶层缓存。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const escapeAttribute = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

    function getLevelMapUrl(stationId) {
        const id = String(stationId || "");
        if (!id) return "";
        return window.SHENYANG_STATION_LEVEL_MAP?.[id] || "";
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "shenyang-station-level-map",
            name: "沈阳车站层级图",
            targetTab: "station-info",
            order: 5,
            shouldRender({ station }) {
                return Boolean(getLevelMapUrl(station?.id));
            },
            render({ station }) {
                const url = getLevelMapUrl(station?.id);
                if (!url) return "";

                const stationName = station?.cn || "";
                const altText = stationName ? `${stationName}车站层级图` : "车站层级图";

                return `
                    <a class="shenyang-level-map-card" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer" title="点击查看官网原图">
                        <span class="shenyang-level-map-head">
                            <cgo-icon name="layer" size="14"></cgo-icon>
                            <span class="shenyang-level-map-title">车站层级图</span>
                            <span class="shenyang-level-map-jump">查看原图</span>
                        </span>
                        <img class="shenyang-level-map-img" src="${escapeAttribute(url)}" alt="${escapeAttribute(altText)}" loading="lazy" draggable="false">
                    </a>
                `;
            },
            /**
             * 图片就位后给卡片打上 is-loaded：标题行随之去掉分隔线与下内边距，与图连成一体。
             * 官网图属外部资源，个别编号可能尚未刊载或被撤下，加载失败则整卡移除，
             * 避免留下破图占位（与「无编号不渲染」同一口径）。
             */
            onMounted(container) {
                container.querySelectorAll(".shenyang-level-map-card").forEach((card) => {
                    const img = card.querySelector(".shenyang-level-map-img");
                    if (!img) return;

                    const markLoaded = () => card.classList.add("is-loaded");
                    const dropCard = () => card.remove();

                    // 命中缓存时 complete 已为真，load 不会再触发，须当场判定
                    if (img.complete) {
                        if (img.naturalWidth > 0) markLoaded();
                        else dropCard();
                        return;
                    }
                    img.addEventListener("load", markLoaded, { once: true });
                    img.addEventListener("error", dropCard, { once: true });
                });
            }
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "shenyang", moduleId: "shenyang-station-level-map" }
    }));
})();
