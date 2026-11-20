/**
 * CGo OpenMap - 车站提示卡片共享渲染层
 *
 * ⚠️ 临时共享位置
 * 本文件与 stacard-engine.js、timetable-renderer.js、station-title.js 目前放在
 * city/shenyang/shared/ 下，供多城共用。计划在开发团队确认共享位置后迁入 core/，
 * 届时只需 git mv 并改各城 {city}.js 的 document.write 路径，零逻辑改动。
 * 迁移步骤见 docs/STACARD_TIMETABLE_UNIFICATION.md 第 4.4 节。
 *
 * 加载方式：classic script。由各城 {city}.js 在加载自身模块**之前** document.write
 * 引入，因此以全局形式暴露，不走 ES module（城市模块本身也是 classic script）。
 *
 * 来源与定位
 * 本渲染器产出与上游「官方模板示范」（city/beijing/modules/beijing_cultural.js）完全
 * 一致的 DOM，只是把标题、图标与正文抽成参数，供各城复用。北京 / 合肥 / 福州三份
 * 逐字复制的模块将来可一并迁移到这里。
 *
 * 主题适配：卡片底色与边框取 var(--card-sub-bg) / var(--border-color)，
 * 标题取 var(--text-main)，正文取 var(--text-light)，左边框与图标取 var(--primary-color)，
 * 均随亮 / 暗主题自动切换。注意 --card-sub-bg 目前没有任何样式表定义它，
 * 故底色实际恒为回退值 rgba(0, 0, 0, 0.03)（上游同样如此），暗色下卡片靠边框成形。
 */
(function () {
    "use strict";

    /** 上游模板的硬编码回退色；--primary-color 在主题中始终有定义，正常情况下不生效 */
    const DEFAULT_PRIMARY_FALLBACK = "#1a73e8";

    const TITLE_STYLE = [
        "display: flex",
        "align-items: center",
        "gap: 6px",
        "font-size: 12px",
        "font-weight: bold",
        "color: var(--text-main)"
    ].join("; ");

    const BODY_STYLE = [
        "font-size: 12px",
        "color: var(--text-light)",
        "line-height: 1.5"
    ].join("; ");

    function cardStyle(primaryFallback) {
        return [
            "margin: 0 0 14px 0",
            "padding: 10px 12px",
            "background: var(--card-sub-bg, rgba(0, 0, 0, 0.03))",
            "border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08))",
            `border-left: 3px solid var(--primary-color, ${primaryFallback})`,
            "border-radius: 6px",
            "display: flex",
            "flex-direction: column",
            "gap: 4px"
        ].join("; ");
    }

    /**
     * 渲染一张车站提示卡片
     *
     * title 与 body 按**可信 HTML** 直接插入，不做转义 —— 城市侧负责在拼装前
     * 转义来自数据文件的内容（如沈阳对目的地名做了 escapeHtml），这样城市既能
     * 用 <strong> 等行内标记强调，又不会引入注入面。
     *
     * @param {object} options
     * @param {string} options.title - 标题行文本（可信 HTML）
     * @param {string} options.icon - CGoUI 图标名（如 "location"）
     * @param {number} [options.iconSize=14] - 图标尺寸 (px)
     * @param {string} options.body - 正文（可信 HTML）
     * @param {string} [options.color] - --primary-color 的回退色，缺省沿用上游模板值
     * @returns {string} 卡片 HTML；body 为空时返回空串（不渲染卡片）
     */
    function render(options = {}) {
        const { title = "", icon = "location", iconSize = 14, body = "", color } = options;
        if (!body) return "";

        const primaryFallback = color || DEFAULT_PRIMARY_FALLBACK;

        return `
            <div class="cgo-tip-card" style="${cardStyle(primaryFallback)}">
                <div style="${TITLE_STYLE}">
                    <cgo-icon name="${icon}" size="${iconSize}" style="color: var(--primary-color, ${primaryFallback});"></cgo-icon>
                    <span>${title}</span>
                </div>
                <div style="${BODY_STYLE}">
                    ${body}
                </div>
            </div>
        `;
    }

    window.CGoTipCard = { render };
})();
