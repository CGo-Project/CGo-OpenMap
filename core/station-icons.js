/**
 * CGo OpenMap - 车站图元模板与尺寸 (core/station-icons.js)
 *
 * ==============================================================================
 * 模块作用与架构定位 (Architecture Overview)
 * ==============================================================================
 * 车站图元画法的**唯一真源**，被两处共用：
 *
 * 1. `core/script.js`  —— 线路图的实际渲染；
 * 2. `drunk/js/drunk_pipeline.js` —— Drunk 编辑模式的画布预览。
 *
 * 与 `core/path-geometry.js` 同理：Drunk 是所见即所得编辑器，若编辑器自己用
 * 一套 CSS 圆点近似、而引擎渲染的是另一套 SVG 图元，尺寸与配色都对不上——
 * 北京换乘站密集处编辑器里会显得图标过大糊成一片，上海的短横/胶囊图元更是
 * 完全看不出来，也就无从「照着原图调」。
 *
 * ==============================================================================
 * 车站类型 (type)
 * ==============================================================================
 * - `dot`  普通站：白底 + 线路色环（多线经停时取第一条线的标志色）
 * - `tsf`  换乘站：白底黑环双圈，尺寸明显大于普通站
 * - `tsfo` 虚拟换乘站：画法同 dot
 * - `rdot` 国铁车站：固定灰环 #78848b
 * - `no`   暂缓开通站：齿轮状施工图元
 *
 * 城市可通过 `city.renderStationIcon(station, id)` 完全接管画法
 * （上海的短横与换乘胶囊、悉尼的 Interchange 底衬即走这条路）。
 * ==============================================================================
 */

(function (root, factory) {
    const api = factory();
    root.CGoStationIcons = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    /**
     * 各类型图元的边长 (px，画布坐标)。
     *
     * ⚠️ 必须与 `css/style.css` 中 `.dot/.rdot/.tsfo/.tsf/.no` 的 width/height 一致——
     * 引擎靠 CSS 定尺寸，Drunk 画布靠这里的数值定尺寸，两者一旦不同步，
     * 编辑器里看到的图元大小就不是线路图上的真实大小。
     * `selfcheck.js` 会直接解析 css/style.css 比对这张表。
     */
    const STATION_SIZE = { dot: 10, tsfo: 10, rdot: 10, no: 10, tsf: 17.5 };

    /** 车站图元 z 序，同样对齐 css/style.css */
    const STATION_Z = { no: 5, dot: 15, rdot: 15, tsfo: 15, tsf: 20 };

    const SVGTemplates = {
        tsf: `<svg viewBox="0 0 17.5 17.5"><circle cx="8.75" cy="8.75" r="8.75" style="fill: var(--map-bg);"/><circle cx="8.75" cy="8.75" r="8" style="fill: var(--station-stroke);"/><circle cx="8.75" cy="8.75" r="7.1" style="fill: var(--map-bg);"/><path d="M6.21,8.01c.12-2.35,2.26-4.22,4.88-4.22.23,0,.46.01.68.04-.55-.18-1.15-.27-1.77-.27-2.8,0-5.09,1.96-5.3,4.45h-1.4l2.34,2.47c.78-.82,1.56-1.65,2.34-2.47h-1.78.01Z" style="fill: var(--station-stroke);"/><path d="M11.85,7.02c-.78.82-1.56,1.65-2.34,2.47h1.78c-.12,2.35-2.26,4.22-4.88,4.22-.23,0-.46-.01-.68-.04.55.18,1.15.27,1.77.27,2.8,0,5.09-1.96,5.3-4.45h1.4l-2.34-2.47h0Z" style="fill: var(--station-stroke);"/></svg>`,
        tsfo: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:{{COLOR}};"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
        dot: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:{{COLOR}};"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
        no: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><path d="M7.5,5c0-.1-.02-.19-.03-.29l1.7-.13c-.05-.46-.15-.9-.33-1.3l-1.54.73c-.08-.18-.18-.34-.3-.5l1.41-.96c-.26-.37-.59-.69-.95-.95l-.97,1.41c-.15-.12-.32-.22-.5-.3l.74-1.54c-.4-.18-.84-.29-1.3-.34l-.14,1.7c-.1-.01-.19-.03-.29-.03s-.19.02-.29.03l-.13-1.7c-.46.05-.9.15-1.3.33l.73,1.54c-.18.08-.34.18-.5.3l-.96-1.41c-.37.26-.69.59-.95.95l1.41.97c-.12.15-.22.32-.3.5l-1.54-.74c-.18.4-.29.84-.34,1.3l1.7.14c-.01.1-.03.19-.03.29s.02.19.03.29l-1.7.13c.05.46.15.9.33,1.3l1.54-.73c.08.18.18.34.3.5l-1.41.96c.26.37.59.69.95.95l.97-1.41c.15.12.32.22.5.3l-.74,1.54c.4.18.84.29,1.3.34l.14-1.7c.1.01.19.03.29.03s.19-.02.29-.03l.13,1.7c.46-.05.9-.15,1.3-.33l-.73-1.54c.18-.08.34-.18.5-.3l.96,1.41c.37-.26.69-.58.95-.95l-1.41-.97c.12-.15.22-.32.3-.5l1.54.74c.18-.4.29-.84.34-1.3l-1.7-.14c.01-.1.03-.19.03-.29Z" style="fill: var(--not-open-color);"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`,
        rdot: `<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" style="fill: var(--map-bg);"/><circle cx="5" cy="5" r="4.21" style="fill:#78848b;"/><circle cx="5" cy="5" r="3.5" style="fill: var(--map-bg);"/></svg>`
    };
    /**
     * 取某座车站的图元 HTML。
     * @param {object} station 含 type、lineColors 的车站对象
     * @returns {string} SVG 字符串
     */
    function iconHtmlFor(station) {
        const type = station && station.type;
        const color = (station && station.lineColors && station.lineColors.length > 0)
            ? station.lineColors[0]
            : 'var(--station-stroke)';
        if (type === 'dot' || type === 'tsfo') return SVGTemplates.dot.replace('{{COLOR}}', color);
        if (SVGTemplates[type]) return SVGTemplates[type];
        return SVGTemplates.dot.replace('{{COLOR}}', color);
    }

    function sizeFor(type) {
        return STATION_SIZE[type] !== undefined ? STATION_SIZE[type] : STATION_SIZE.dot;
    }

    /**
     * 统计每座车站经停线路的标志色，写入 station.lineColors。
     * 与 core/script.js 的 processData 同义：普通站的环色取第一条经停线路的颜色。
     *
     * @param {object} stations 车站字典（就地写入 lineColors）
     * @param {Array} lines 线路数组
     * @param {function} stationIdsOf 取一条线路全部车站 ID 的函数（分支线安全）
     */
    function computeLineColors(stations, lines, stationIdsOf, key) {
        // 编辑器需要把它写成 `_lineColors` 这类下划线开头的运行期私有字段：
        // 它是由线路数据推导出来的，不是车站数据本身，既不能写回文件，
        // 也不能让「车站被改动过」的判定把它算进去。
        const field = key || 'lineColors';
        Object.keys(stations).forEach(id => { stations[id][field] = []; });
        (lines || []).forEach(line => {
            const ids = stationIdsOf ? stationIdsOf(line) : (line.stationIds || []);
            ids.forEach(sid => {
                const s = stations[sid];
                if (s && line.color && s[field].indexOf(line.color) === -1) {
                    s[field].push(line.color);
                }
            });
        });
        return stations;
    }

    return { SVGTemplates, STATION_SIZE, STATION_Z, iconHtmlFor, sizeFor, computeLineColors };
});
