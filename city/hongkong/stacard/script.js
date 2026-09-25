/**
 * CGo OpenMap - 香港車站卡片佔位 (city/hongkong/stacard/script.js)
 *
 * 香港暫未收錄站台結構圖與出入口切片，此處僅提供空實現，
 * 避免核心引擎按約定路徑加載時產生 404。
 */

export const HongKongStaCard = {
    async init() { return null; },
    hasCard() { return false; },
    getCardPlaceholderHtml() { return ""; },
    async renderPanelCards() { return null; }
};

if (typeof window !== "undefined") {
    window.HongKongStaCard = HongKongStaCard;
}
