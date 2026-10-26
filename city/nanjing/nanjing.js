/**
 * CGo OpenMap - 南京城市业务逻辑与关系配置 (city/nanjing/nanjing.js)
 * 由 OpenMap Editor 自动生成
 */

(function () {
    const NanjingCity = {
        id: "nanjing",
        name: "南京",
        LINE_SORT_ORDER: ["line-1","line-2","line-3","line-4","line-5","line-6","line-7","line-8","line-9","line-10","line-11","line-12","line-13","line-14","line-15","line-16"],
        /**
         * 贯通运营线路组 (LINE_SYNC_GROUPS)
         * 作用：定义贯通运营的线路，高亮其中一条时同组其余线路同步高亮。
         * S2线（西善桥—铜井）与宁马线（慈湖高新区—太白）实为宁马城际一条线，
         * 仅按分段标注区分，画法参照北京 1号线 / 八通线（同色、不同徽标、图例合并、联动高亮）。
         */
        LINE_SYNC_GROUPS: [["line-14", "line-15"], ["line-9", "line-16"]],
        /**
         * 数据文件声明：必须显式指定，否则引擎会回落到默认的北京数据。
         * - stanameCsvUrl：站名旧名/别名检索库
         * - amapDataUrl：车站 GCJ-02 经纬度，供「最近车站」定位使用
         */
        dataFiles: {
            stanameCsvUrl: "./city/nanjing/staname.csv",
            amapDataUrl: "./city/nanjing/amap_data.json"
        },
        CROSS_PLATFORM_STATIONS: [],
        MERGE_STATIONS: []
    };

    window.NANJING_CITY = NanjingCity;
    window.CURRENT_CITY = NanjingCity;
})();
