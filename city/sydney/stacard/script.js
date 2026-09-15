/**
 * CGo OpenMap - 悉尼车站卡片占位 (city/sydney/stacard/script.js)
 *
 * 悉尼暂未收录站台结构图与出入口切片，此处仅提供空实现，
 * 避免核心引擎按约定路径加载时产生 404。
 */

export const SydneyStaCard = {
    async init() { return null; },
    hasCard() { return false; },
    getCardPlaceholderHtml() { return ""; },
    async renderPanelCards() { return null; }
};

if (typeof window !== "undefined") {
    window.SydneyStaCard = SydneyStaCard;
}
