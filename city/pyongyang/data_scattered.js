/**
 * CGo OpenMap - 平壤 散点元素
 * 浅蓝水系：作者在 AI 内绘制的河道走向，作为底图装饰（写法对齐青岛水域）
 * 注意：引擎的 x / y 是图片的「中心点」，不是左上角。
 */
const SCATTERED_DATA = [
    {
        id: "py-water",
        file: "./city/pyongyang/assets/py_water.svg",
        x: 370.8,        // viewBox 中心
        y: 377.3,
        width: 746.3,    // viewBox 宽高（已含描边半宽，避免上下被裁）
        height: 331.2,
        opacity: 0.7,
        zIndex: 1
    }
];
