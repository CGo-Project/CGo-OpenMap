/**
 * CGo OpenMap - 北京城市业务逻辑与数据关系接口 (city/beijing/beijing.js)
 * 
 * ==============================================================================
 * 城市数据库文件作用与依赖关系说明 (Database & Data Files Relationship)
 * ==============================================================================
 * 1. data_stations.js
 *    - 作用：定义本城市所有车站的基础点位数据（Station Nodes）。
 *    - 结构：键为 Station ID (如 "M101", "M201")，包含 x, y 坐标、类型 (dot/tsf/no/rdot)、中英文站名、文字对齐 (align)、微调 (offset)、字宽比例 (textScale) 等。
 * 
 * 2. data_lines.js
 *    - 作用：定义本城市各条地铁、市郊铁路、有轨电车线路的基础结构（linesData）与线路元数据配置（LINE_META，包含线路图标与运营单位）。
 *    - 结构：LINE_META 包含各线路对应的 SVG 图标文件名与运营分公司；linesData 包含线路 ID、颜色 (color)、途经车站 ID (stationIds)、站间距 (distances) 等。
 * 
 * 3. data_virtual_transfers.js
 *    - 作用：定义地铁线网中的站外虚拟换乘与出站连通关系。
 *    - 结构：
 *      - VIRTUAL_FREE_TRANSFER_MAP: 电子客票免费出站换乘（如木樨地 1号线/16号线、复兴门-太平桥等）。
 *      - VIRTUAL_TRANSFER_MAP: 付费站外换乘/火车站接驳（如巴沟西郊线、北京西站国铁/地铁、东直门机场线等）。
 *      - VIRTUAL_FREE_CONNECT_LINES / VIRTUAL_CONNECT_LINES: 地图渲染换乘虚线连接的端点与偏移。
 * 
 * 4. data_legend.js
 *    - 作用：定义线路图的图例（Legend）结构与线路分组。
 *    - 结构：分网展示（城市轨道交通线网、市郊铁路等），指定图例中各线路对应的 SVG 图标与目标线路 ID。
 * 
 * 5. data_timetable.js
 *    - 作用：全路网各线路、各车站的首末班车发车时刻表（Timetable Data）。
 * 
 * 6. data_notopen.js
 *    - 作用：目前处于规划、在建或暂缓开通状态的线路走向折线点阵（NOT_OPEN_LINES）。
 * 
 * 7. amap_data.json
 *    - 作用：高德地图提取的本城市所有地铁站实际地理经纬度坐标，用于用户定位查找最近车站（LBS）。
 * 
 * 8. staname.csv
 *     - 作用：地铁历史站名沿革及多版本拼音库，用于车站搜索框的智能别名索引。
 * 
 * 9. stacard/ (车站卡片与扩展展示模块)
 *     - 作用：车站卡片系统（StaCard API），可以自定义显示内容，可显示地图切片、或设计车站结构显示接口。
 *     - 文件：stacard/script.js (地图切片与卡片展示引擎、StaCard API)。
 * ==============================================================================
 * 
 * ️ 开发者移植指南 (Porting Guide):
 * 当为新城市创建业务逻辑文件（如 `city/shanghai/shanghai.js`）时，只需复制此模板，修改对象中的：
 * - id: "shanghai", name: "上海"
 * - LINE_SORT_ORDER: 目标城市的线路展示排序（数字顺序/字母顺序）
 * - LINE_SYNC_GROUPS: 目标城市的贯通运行线路组
 * - SUBURBAN_LINES: 目标城市的市域/市郊铁路线路 ID 列表
 * - MERGE_STATIONS: 跨线合并车站 ID
 * - CROSS_PLATFORM_STATIONS: 同台换乘车站 ID
 * - MAP_12306: 火车站 12306 购票站名映射字典
 * ==============================================================================
 */

(function () {
    const BeijingCity = {
        /** 城市唯一标识符 (需与 city/data.js 保持一致) */
        id: "beijing",
        /** 城市名称 */
        name: "北京",

        /** 城市主理人与维护者 */
        maintainers: [
            { name: "NaL - CentralGo", role: "城市主理人" },
            { name: "SierraQin", role: "运营数据支持" },
            { name: "Freedom Space", role: "市郊铁路校对" }
        ],

        /**
         * 线路元数据字典 (LINE_META)
         */
        LINE_META: {},

        /**
         * 线路排序权重表 (LINE_SORT_ORDER)
         * 作用：控制车站信息面板、多线换乘图标、图例列表中的线路显示先后顺序
         */
        LINE_SORT_ORDER: [
            "M1", "M1E", "M2", "M3", "M4", "M4S",
            "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18", "M19",
            "M24", "M25", "M25W", "M26", "M27",
            "XJ", "T1", "CAE", "DAE", "JX",
            "S1", "S2", "S5", "S6",
            "Rwy", "Rwy2"
        ],

        /**
         * 线路同步/联动高亮组 (LINE_SYNC_GROUPS)
         * 作用：定义贯通运营的线路。当高亮其中一条线路时，同组内的其他线路也会同步高亮
         * 示例：1号线与八通线贯通运营、4号线与大兴线贯通运营
         */
        LINE_SYNC_GROUPS: [
            ['M1', 'M1E'],
            ['M4', 'M4S']
        ],

        /**
         * 市郊铁路与国铁干线标识列表 (SUBURBAN_LINES)
         * 作用：用于区分市区地铁与市郊/国铁，匹配不同的导航链接（火车站 vs 地铁站）与票务查询按钮
         */
        SUBURBAN_LINES: ['S1', 'S2', 'S5', 'S6', 'Rwy', 'Rwy2', '中国铁路', '城市副中心线', '通密线', '怀柔-密云线'],

        /**
         * 贯通连接合并车站 ID 列表 (MERGE_STATIONS)
         * 作用：在这些车站，两条贯通运营线路无缝连接，在详情卡片中将合并为单条贯通线路展示
         */
        MERGE_STATIONS: ['M124', 'M425', 'DAE4'],

        /**
         * 同台换乘（同向/反向跨站台换乘）重点车站 ID 列表 (CROSS_PLATFORM_STATIONS)
         * 作用：用于在车站卡片展示中提升同台换乘线路的展示层级与标识
         */
        CROSS_PLATFORM_STATIONS: ['M701', 'M310', 'M801', 'M2516', 'M913'],

        /**
         * 贯通运行线路在连接站的信息合并处理函数
         * @param {Object} station - 车站对象
         * @param {Array<Object>} relatedLinesInfo - 经停该站的线路信息列表
         */
        handleLineMerge(station, relatedLinesInfo) {
            const mergeMap = {
                'M425': { mainId: 'M4', subId: 'M4S', name: '4号线-大兴线' },
                'M124': { mainId: 'M1', subId: 'M1E', name: '1号线-八通线' }
            };
            const cfg = mergeMap[station?.id];
            if (!cfg) return;

            const mainIdx = relatedLinesInfo.findIndex(i => i.id === cfg.mainId || i.name.includes(cfg.mainId === 'M1' ? '1号线' : '4号线'));
            const subIdx = relatedLinesInfo.findIndex(i => i.id === cfg.subId || i.name.includes(cfg.subId === 'M1E' ? '八通线' : '大兴线'));

            if (mainIdx !== -1 && subIdx !== -1) {
                const main = relatedLinesInfo[mainIdx];
                const sub = relatedLinesInfo[subIdx];
                if (!sub.prev || sub.prev === "无") sub.prev = main.prev;
                if (!sub.next || sub.next === "无") sub.next = main.next;
                sub.staConfig ||= main.staConfig;
                sub.name = cfg.name;
                sub.id = main.id;
                sub.svg = main.svg;
                sub.svgclr = main.svgclr;
                sub.svgtext = main.svgtext;
                sub.scheduleUrl = main.scheduleUrl || sub.scheduleUrl;
                relatedLinesInfo.splice(mainIdx, 1);
            }
        },

        /** 高德地图检索所属行政区 */
        searchCity: "北京",

        /** 
         * 12306 购票系统火车站名映射字典 
         * 键为站名，值为 12306 系统标准电报站名
         */
        MAP_12306: {
            "丰台站": "北京丰台",
            "朝阳站": "北京朝阳",
            "亦庄火车站": "亦庄"
        },

        /**
         * 生成第三方高德地图导航搜索外链
         * @param {string} stationName - 车站中文名称
         * @param {boolean} isSuburbanOrRail - 是否为火车站/市郊铁路
         * @returns {string} 高德 URI 协议链接
         */
        getNavigationUrl(stationName, isSuburbanOrRail) {
            const mapSearchName = isSuburbanOrRail
                ? stationName.replace(/站$/, '') + "火车站"
                : stationName + "地铁站";
            return `https://uri.amap.com/search?keyword=${encodeURIComponent(mapSearchName)}&city=${encodeURIComponent(this.searchCity)}`;
        },

        /**
         * 生成 12306 官方火车票余票查询链接
         * @param {string} stationName - 车站中文名称
         * @returns {string} 12306 余票查询 URL
         */
        getRailway12306Url(stationName) {
            const nameFor12306 = this.MAP_12306[stationName] || stationName.replace(/站$/, '');
            return `https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=${encodeURIComponent(nameFor12306)}`;
        },

        /**
         * 获取市郊铁路官方时刻表与票务服务链接
         * @returns {Object|null} 包含 timetableUrl 与 ticketUrl 的对象
         */
        getSuburbanLinks() {
            return {
                timetableUrl: "http://m.bjsjtl.com.cn/col.jsp?id=119",
                ticketUrl: "http://m.bjsjtl.com.cn/col.jsp?id=112"
            };
        },

        /** 官方高清线网图下载外链 */
        officialMapUrl: "https://96123.ruubypay.com/linemapR.jpg",

        /** 本地数据文件路径配置 */
        dataFiles: {
            stanameCsvUrl: './city/beijing/staname.csv',
            amapDataUrl: './city/beijing/amap_data.json'
        },

        /**
         * 格式化所属运营公司名称显示
         * @param {string} rawOwnerName - 原始运营单位名称
         * @returns {string} 规范化后的单位名称
         */
        formatOwnerName(rawOwnerName) {
            return rawOwnerName?.startsWith("运营") ? "北京地铁" + rawOwnerName : rawOwnerName;
        },

        /**
         * 格式化多个运营公司合并字符串
         * @param {Array<string>} companyList - 运营公司名称数组
         * @returns {string} 逗号连接的去重字符串
         */
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，").replace(/分公司，北京地铁/g, "、");
        },

        // ======================================================================
        // 车站卡片与微缩视窗系统接口 (StaCard API Integration)
        // ======================================================================
        stacard: {
            script: './city/beijing/stacard/script.js',
            geoDataUrl: './city/beijing/amap_data.json',
            basePath: './city/beijing/stacard/',
            getRenderer: () => window.BeijingStaCard || window.StaCard || null
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
        },

        // ======================================================================
        // 车站信息板模块注册化配置 (StationBoard Modular Configuration)
        // ======================================================================
        stationBoard: {
            // 声明引入的城市自定义模块脚本列表
            scripts: [
                'modules/beijing_cultural.js'
            ],
            // 模块启用状态、排序权重与挂载选项卡配置
            modules: {
                'header-controls': { enabled: true, order: 10 },
                'header-title': { enabled: true, order: 20 },
                'header-badges': { enabled: true, order: 30 },
                'stacard': { enabled: true, targetTab: 'line-tab', order: 10 },
                'adjacent-stations': { enabled: true, targetTab: 'line-tab', order: 20 },
                'transfers': { enabled: true, targetTab: 'line-tab', order: 30 },
                'station-type': { enabled: true, targetTab: 'station-info', order: 10 },
                // 北京专属历史文化与古迹名胜指引模块
                'beijing-cultural-tip': { enabled: true, targetTab: 'station-info', order: 15 },
                'operators': { enabled: true, targetTab: 'station-info', order: 20 },
                'footer-actions': { enabled: true, order: 10 }
            }
        }
    };

    // 同步写入城市专属自定义模块脚本（与 document.write 城市数据脚本同批执行，确保早于 type=module 的 core/script.js）
    if (typeof document !== 'undefined' && typeof document.write === 'function') {
        document.write('<scr' + 'ipt src="./city/beijing/modules/beijing_cultural.js?v=260908.093000"><\/scr' + 'ipt>');
    }

    // ==========================================================================
    // 全局导出与城市自动注册
    // ==========================================================================
    window.BEIJING_CITY = BeijingCity;
    window.CURRENT_CITY = BeijingCity;
    window.CityDataManager?.registerCity?.({
        id: BeijingCity.id,
        name: BeijingCity.name,
        folder: "./city/beijing",
        mainLogic: "./city/beijing/beijing.js",
        isDefault: true,
        ...BeijingCity
    });

    console.log("[BeijingCity] 北京城市专属业务逻辑与数据关系模块加载完成。");
})();
