/**
 * CGo OpenMap - 深圳车站卡片占位 (city/shenzhen/stacard/script.js)
 *
 * 深圳暂未收录站台结构图与出入口切片，此处仅提供空实现，
 * 避免核心引擎按约定路径加载时产生 404。
 */

export const ShenzhenStaCard = {
    async init() { return null; },
    hasCard() { return false; },
    getCardPlaceholderHtml() { return ""; },
    async renderPanelCards() { return null; }
};

if (typeof window !== "undefined") {
    window.ShenzhenStaCard = ShenzhenStaCard;
}
