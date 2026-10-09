/**
 * CGo OpenMap - 大连在建与规划线路配置 (city/dalian/data_notopen.js)
 *
 * - 与北京同款双重登记：本文件负责「未开通」的镂空渲染、线路树备注与进度关联，
 *   仍需在 data_lines.js 同步登记线条本身（负责渲染主体与图例/换乘树）。
 * - points 只写折点；不带 style 时，渲染器会补背景色芯线（背景色线、3.4px、位于 z12 层）
 *   压在未开通线路主体（z10）上，镂出两侧边线，形成未开通线路的镂空双线观感。
 *   想要特殊配色时可加 style（含 bg / mask / body / dash / halo 五个开关），北京 22 号线用的是
 *   `style: { bg: false, mask: false, body: '#1076BC', dash: false }`（实心天蓝、无芯线）。
 * - lineId 与 data_lines.js 中的线路 id 对应，用于关联 data_opening.js 的开通进度
 *   （关联到未登记开通时刻的线路即保持「暂未开通」状态）。
 */
const NOT_OPEN_LINES = [
    { lineId: "DLM04", points: [{ x: 1155, y: 625 }, { x: 1100, y: 625 }, { x: 1078, y: 603 }, { x: 413, y: 603 }, { x: 365, y: 651 }] }
];
