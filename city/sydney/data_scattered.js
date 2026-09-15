/**
 * CGo OpenMap - 悉尼示意图装饰层 (city/sydney/data_scattered.js)
 *
 * sydney_deco.svg 为官方线网图的"静态家具"图层，逐路径提取自官方 PDF：
 * 海域轮廓、线路端牌（T1 North Shore 等）、City 方框、机场徽标与
 * "Station Access Fee applies"、在建注记文字、指北针、终点站渐变端块。
 * 线路折线、站点图元与站名由引擎按数据动态渲染，不包含在本图层内。
 */

const SCATTERED_DATA = [
    {
        id: "sydney-deco",
        file: "./city/sydney/assets/sydney_deco.svg",
        x: 771,
        y: 853,
        width: 1542,
        height: 1706,
        opacity: 1,
        zIndex: 4
    }
];
