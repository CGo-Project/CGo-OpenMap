/**
 * CGo OpenMap - 上海城市业务逻辑与数据关系接口 (city/shanghai/shanghai.js)
 * 
 * ==============================================================================
 * ️ 上海轨道交通业务规则说明
 * ==============================================================================
 */

(function () {
    const ShanghaiCity = {
        /** 城市唯一标识符 */
        id: "shanghai",
        /** 城市名称 */
        name: "上海",
        officialMapUrl: "http://service.shmetro.com/yxxp/index.htm",

        /** 城市主理人与维护者 */
        maintainers: [
            { name: "待认领", role: "城市主理人招募中", isRecruiting: true }
        ],

        dataFiles: {
            stanameCsvUrl: './city/shanghai/staname.csv',
            amapDataUrl: './city/shanghai/amap_data.json'
        },

        /** 线路元数据字典 (LINE_META) */
        LINE_META: {},

        /**
         * 线路排序权重表 (LINE_SORT_ORDER)
         * 控制车站详情面板、多线换乘图标、图例列表中的线路显示顺序
         */
        LINE_SORT_ORDER: [
            "SH1", "SH2", "SH3", "SH4", "SH5", "SH6", "SH7", "SH8", "SH9", "SH10",
            "SH11", "SH12", "SH13", "SH14", "SH15", "SH16", "SH17", "SH18",
            "SHAPMR", "SHMaglev", "SHAPT", "Rwy", "Rwy2"
        ],

        /** 线路同步联动高亮组 */
        LINE_SYNC_GROUPS: [
            ['SH3', 'SH4']
        ],

        /** 市郊铁路与国铁干线标识列表 */
        SUBURBAN_LINES: ['SHMaglev', 'SHAPT', 'Rwy', 'Rwy2', '中国铁路', '金山铁路', '市域铁路'],

        /** 同名合并车站列表 */
        MERGE_STATIONS: [],

        /** 同台换乘车站列表 */
        CROSS_PLATFORM_STATIONS: [],

        /** 国铁火车站 12306 购票检索站名映射 */
        MAP_12306: {
            "上海火车站": "上海",
            "上海虹桥": "上海虹桥",
            "上海南站": "上海南",
            "上海西站": "上海西"
        },

        /**
         * 生成高德地图外链
         * @param {string} stationName - 车站中文名称
         * @param {boolean} [isRailway=false] - 是否为火车站
         * @returns {string} 导航 URI
         */
        getNavigationUrl(stationName, isRailway = false) {
            const query = isRailway ? `${stationName}` : `${stationName}地铁站`;
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&city=${encodeURIComponent('上海')}`;
        },

        /**
         * 生成中国铁路 12306 购票外链
         * @param {string} stationName - 车站名称
         * @returns {string} 12306 购票查询链接
         */
        getRailway12306Url(stationName) {
            const cleanName = stationName.replace(/站$/, '');
            const mappedName = this.MAP_12306[stationName] || this.MAP_12306[cleanName] || cleanName;
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(mappedName)}`;
        },

        /** 市郊铁路票务外链 */
        getSuburbanLinks() {
            return {
                timetableUrl: "http://service.shmetro.com/yxxp/index.htm",
                ticketUrl: "http://service.shmetro.com/"
            };
        },

        /**
         * 格式化所属运营公司名称
         * @param {string} rawOwnerName - 原始运营单位名称
         * @returns {string} 规范化单位名称
         */
        formatOwnerName(rawOwnerName) {
            return rawOwnerName || "上海申通地铁集团有限公司";
        },

        /**
         * 格式化多个运营公司合并字符串
         */
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，");
        },

        // 车站卡片与微缩视窗系统接口 (StaCard API)
        stacard: {
            script: './city/shanghai/stacard/script.js',
            geoDataUrl: './city/shanghai/amap_data.json',
            basePath: './city/shanghai/stacard/',
            getRenderer: () => window.ShanghaiStaCard || window.StaCard || null
        },

        /** 初始化车站卡片系统 */
        async initStaCard(options = {}) {
            return await this.stacard.getRenderer()?.init?.({
                basePath: this.stacard.basePath,
                geoDataUrl: this.stacard.geoDataUrl,
                ...options
            });
        },

        /** 检查指定车站是否具有可展示的卡片/微缩视窗 */
        hasStaCard(stationId, lineId, stationInfo) {
            return Boolean(this.stacard.getRenderer()?.hasCard?.(stationId, lineId, stationInfo));
        },

        /** 获取车站卡片占位 HTML */
        getStaCardHtml(station, lineInfo, isCrossPlatform = false) {
            return this.stacard.getRenderer()?.getCardPlaceholderHtml?.(station, lineInfo, isCrossPlatform) || '';
        },

        /** 渲染车站详情面板内的全部卡片 */
        async renderStaCards(infoPanel, station) {
            return await this.stacard.getRenderer()?.renderPanelCards?.(infoPanel, station);
        }
    };

    // 全局导出与城市注册
    window.SHANGHAI_CITY = ShanghaiCity;
    window.CityDataManager?.registerCity?.({
        id: ShanghaiCity.id,
        name: ShanghaiCity.name,
        folder: "./city/shanghai",
        mainLogic: "./city/shanghai/shanghai.js",
        center: { x: 1415, y: 1459 },
        defaultScale: 0.6,
        mapSize: { width: 2639, height: 3693 },
        searchCity: "上海",
        title: "CGo OpenMap - 上海轨道交通线路图",
        keywords: "CGo OpenMap, 上海地铁, 申通地铁, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的上海轨道交通智能交互线路图",
        officialMapUrl: "http://service.shmetro.com/yxxp/index.htm",
        isDefault: false,
        ...ShanghaiCity
    });

    console.log("[ShanghaiCity] 上海城市专属业务逻辑与数据关系模块加载完成。");
})();
