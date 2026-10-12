/**
 * CGo OpenMap - 兰州城市业务逻辑与数据关系接口 (city/lanzhou/lanzhou.js)
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
 *      - VIRTUAL_FREE_TRANSFER_MAP: 电子客票免费出站换乘（兰州暂无此类关系，保留空表）。
 *      - VIRTUAL_TRANSFER_MAP: 付费站外换乘/火车站接驳（如 兰州火车站-兰州、兰州西站北广场-兰州西、陈官营-陈官营等）。
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
 * 9. data_station_names.js
 *     - 作用：全路网逐站「工程名」与「曾用名」资料表（window.LANZHOU_STATION_NAMES），
 *             由车站卡片「车站信息」选项卡只读展示为两行（工程名 / 曾用名）。
 *     - 结构：stations[车站ID] = { engineering, former }，两项各自支持 visible 显隐标记；
 *             前端不提供编辑与显示开关，资料与显隐一律在本文件维护，详见文件头部说明。
 * 
 * 10. stacard/ (车站卡片与扩展展示模块)
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
    /** 载入兰州城市专属样式表（未选中站名的白色描边等本城专属排版） */
    (function loadCityStylesheet() {
        const href = "./city/lanzhou/style.css";
        if (document.querySelector(`link[href^="${href}"]`)) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";

        // 带上与其余静态资源一致的版本号，否则改样式后浏览器会一直用缓存里的旧表
        const v = window.CGO_ASSET_VERSION;
        link.href = v ? `${href}?v=${v}` : href;
        document.head.appendChild(link);
    })();

    const LanzhouCity = {
        /** 城市唯一标识符 (需与 city/data.js 保持一致) */
        id: "lanzhou",
        /** 城市名称 */
        name: "兰州",

        /** 城市主理人与维护者 */
        maintainers: [
            { name: "Bingcaowan", role: "城市主理人", github: "https://github.com/icegrassbay" }
        ],

        /**
         * 线路元数据字典 (LINE_META)
         */
        LINE_META: {},

        /**
         * 线路排序权重表 (LINE_SORT_ORDER)
         * 作用：控制车站信息面板、多线换乘图标、图例列表中的线路显示先后顺序
         
        LINE_SORT_ORDER: [
            "M1"
        ],*/

        /**
         * 线路同步/联动高亮组 (LINE_SYNC_GROUPS)
         * 作用：定义贯通运营的线路。当高亮其中一条线路时，同组内的其他线路也会同步高亮
         * 兰州当前没有贯通运营的线路组合，故留空（沿用核心默认空数组）。
         */

        /**
         * 市郊铁路与国铁干线标识列表 (SUBURBAN_LINES)
         * 作用：用于区分市区地铁与市郊/国铁，匹配不同的导航链接（火车站 vs 地铁站）与票务查询按钮
        */
        SUBURBAN_LINES: ['S1'],

        /**
         * 贯通连接合并车站 ID 列表 (MERGE_STATIONS)
         * 作用：在这些车站，两条贯通运营线路无缝连接，在详情卡片中将合并为单条贯通线路展示。
         * 兰州当前没有贯通运营的线路组合，故不声明（沿用核心默认空数组）。
         */

        /**
         * 同台换乘（同向/反向跨站台换乘）重点车站 ID 列表 (CROSS_PLATFORM_STATIONS)
         * 作用：用于在车站卡片展示中提升同台换乘线路的展示层级与标识。
         * 兰州当前无同台换乘车站，故不声明（沿用核心默认空数组）。
         */

        // 注：贯通线路在连接站的信息合并（handleLineMerge）兰州暂无适用场景，
        //     核心引擎按「未提供该函数」处理，此处无需声明。

        /** 高德地图检索所属行政区 */
        searchCity: "兰州",

        /** 
         * 12306 购票系统火车站名映射字典 
         * 键为站名，值为 12306 系统标准电报站名
         */
        MAP_12306: {
            "兰州火车站": "兰州",
            "兰州西站北广场": "兰州西",
            "兰州西站南广场": "兰州西"
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
         
        getSuburbanLinks() {
            return {
                timetableUrl: "https://www.lzgdjt.com/lzgd/serve.jsp#timetable",
                ticketUrl: "https://www.lzgdjt.com/lzgd/serve_page.jsp?cId=11105"
            };
        },*/

        /** 官方高清线网图下载外链（与 city/data.js 注册表保持一致） */
        officialMapUrl: "https://www.lzgdjt.com/",
        /** 本地数据文件路径配置 */
        dataFiles: {
            stanameCsvUrl: './city/lanzhou/staname.csv',
            amapDataUrl: './city/lanzhou/amap_data.json'
        },

        /**
         * 格式化所属运营公司名称显示
         * @param {string} rawOwnerName - 原始运营单位名称
         * @returns {string} 规范化后的单位名称
         */
        formatOwnerName(rawOwnerName) {
            return rawOwnerName?.startsWith("运营") ? "兰州地铁" + rawOwnerName : rawOwnerName;
        },

        /**
         * 格式化多个运营公司合并字符串
         * @param {Array<string>} companyList - 运营公司名称数组
         * @returns {string} 逗号连接的去重字符串
         */
        formatCompanyString(companyList) {
            return [...new Set(companyList)].join("，").replace(/分公司，兰州地铁/g, "、");
        },

        // ======================================================================
        // 车站卡片与微缩视窗系统接口 (StaCard API Integration)
        // ======================================================================
        stacard: {
            script: './city/lanzhou/stacard/script.js',
            geoDataUrl: './city/lanzhou/amap_data.json',
            basePath: './city/lanzhou/stacard/',
            getRenderer: () => window.LanzhouStaCard || window.StaCard || null
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
        // 车站信息板模块化配置 (StationBoard Modules)
        // ======================================================================
        // 说明：未在此列出的内置模块（header / stacard / adjacent-stations /
        // transfers / operators / footer-actions 等）继续沿用核心引擎默认行为。
        stationBoard: {
            /** 城市专属模块脚本路径（位于 city/lanzhou/ 下） */
            scripts: [
                "modules/lanzhou_station_names.js",
                "modules/lanzhou_timetable.js",
                "modules/lanzhou_travel_guide.js",
                "modules/lanzhou_operation_status.js",
                "modules/lanzhou_fare_table.js"
            ],

            /** 模块级开关、挂载槽位与排序权重（键名为模块 ID） */
            modules: {
                // 出行指引：挂载于「车站信息」选项卡最上方（先于车站类型 10、运营单位 20）
                "lanzhou-travel-guide": {
                    enabled: true,
                    targetTab: "station-info",
                    order: 5
                },
                // 工程名与曾用名：挂载于「车站信息」选项卡，紧随车站类型(10)、先于运营单位(20)
                // 版式与「车站类型」「运营单位」完全协调（同 13px 字号 / 同 info-label、info-value 配色）
                // 卡片内按资料逐行只读展示「工程名」「曾用名」，两行各自独立；无该项资料则不显示该行，
                // 两项均无的车站整块不显示。前端不提供编辑与显隐开关，
                // 资料与显隐全部由 city/lanzhou/data_station_names.js（以及 data_stations.js 的逐站字段）维护
                // 关闭方式：将 enabled 置为 false 即可全城隐藏
                "lanzhou-station-names": {
                    enabled: true,
                    targetTab: "station-info",
                    order: 15
                },
                // 首末车时刻：挂载于每条经停线路选项卡，排在高德切片与邻站之后
                "lanzhou-line-timetable": {
                    enabled: true,
                    targetTab: "line-tab",
                    order: 22
                },
                // 运营情况：挂载于每条经停线路选项卡最下方（order 90 晚于邻站 20 / 时刻 22 / 换乘 30）
                // 关闭方式：将 enabled 置为 false 即可全城隐藏；文案与精细隐藏见 modules/lanzhou_operation_status.js
                "lanzhou-operation-status": {
                    enabled: true,
                    targetTab: "line-tab",
                    order: 90
                },
                // 票价表：挂载于底部操作栏（slot: footer），order 9 先于核心 footer-actions(10)，
                // 因此位于「官网查询 / 高德导航」按钮行的正上方，宽度与整行等宽。
                // 仅已运营车站（非 type: "no"）显示；点击弹出 lanzhou/assets/pricetable.jpg 并可缩放平移。
                // 关闭方式：将 enabled 置为 false 即可全城隐藏；文案、图片路径与显示范围见 modules/lanzhou_fare_table.js
                "lanzhou-fare-table": {
                    enabled: true,
                    targetTab: "footer",
                    order: 9
                }
            }
        }
    };

    // ==========================================================================
    // 城市专属车站信息板模块同步加载
    // 说明：必须使用 document.write 同步引入，确保核心引擎渲染信息板前模块已注册；
    //       模块内部仅注册定义，GLOBAL_SCHEDULE_DATA 在渲染时惰性读取，
    //       因此位于 main.html 的 data_timetable.js 之后加载也能正确取数。
    //       「工程名 / 曾用名」资料表 (data_station_names.js) 必须在模块之前加载，
    //       但模块同样在渲染时才读取该表，故此处顺序仅作可读性保证。
    // ==========================================================================
    if (typeof document !== "undefined" && typeof document.write === "function") {
        document.write('<scr' + 'ipt src="./city/lanzhou/data_station_names.js?v=261006.120000"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/lanzhou/modules/lanzhou_station_names.js?v=261006.120000"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/lanzhou/modules/lanzhou_timetable.js?v=261006.120000"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/lanzhou/modules/lanzhou_travel_guide.js?v=261006.120000"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/lanzhou/modules/lanzhou_operation_status.js?v=261006.120000"><\/scr' + 'ipt>');
        document.write('<scr' + 'ipt src="./city/lanzhou/modules/lanzhou_fare_table.js?v=261006.120000"><\/scr' + 'ipt>');
    }

    // ==========================================================================
    // 全局导出与城市自动注册
    // ==========================================================================
    window.LANZHOU_CITY = LanzhouCity;
    window.CURRENT_CITY = LanzhouCity;
    window.CityDataManager?.registerCity?.({
        id: LanzhouCity.id,
        name: LanzhouCity.name,
        folder: "./city/lanzhou",
        mainLogic: "./city/lanzhou/lanzhou.js",
        isDefault: false,
        ...LanzhouCity
    });

    console.log("[LanzhouCity] 兰州城市专属业务逻辑与数据关系模块加载完成。");
})();
