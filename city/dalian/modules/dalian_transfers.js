/**
 * CGo OpenMap - 大连换乘文案定制模块
 *
 * 仅覆盖大连项目的免费站外换乘提示，换乘关系与线路徽标仍由核心引擎统一生成。
 *
 * @event cgo:city-module-ready
 * @property {{ cityId: string, moduleId: string }} detail
 */
(function () {
    const DALIAN_FREE_TRANSFER_LABEL = "可免费站外换乘";
    const DEFAULT_FREE_TRANSFER_LABEL = "电子客票可免费站外换乘";

    function renderDalianTransfers(context) {
        const generateTransferHtml = context?.helpers?.generateTransferHtml
            || (typeof window !== "undefined" ? window.generateTransferHtml : null);
        const stationId = context?.station?.id;
        if (typeof generateTransferHtml !== "function" || !stationId) return "";

        return String(generateTransferHtml(stationId) || "")
            .replaceAll(DEFAULT_FREE_TRANSFER_LABEL, DALIAN_FREE_TRANSFER_LABEL);
    }

    if (window.StationBoard?.registerModule) {
        window.StationBoard.registerModule({
            id: "transfers",
            name: "换乘线路走向",
            targetTab: "line-tab",
            order: 30,
            render: renderDalianTransfers
        });
    }

    document.dispatchEvent(new CustomEvent("cgo:city-module-ready", {
        detail: { cityId: "dalian", moduleId: "dalian-transfers" }
    }));
})();
