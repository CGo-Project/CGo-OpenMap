/**
 * CGo OpenMap - 多城市注册与元数据中心 (city/data.js)
 * 
 * ==============================================================================
 * 模块作用与架构定位 (Architecture Overview)
 * ==============================================================================
 * 1. 记录系统已注册的所有城市列表 (CITY_REGISTRY) 及对应数据文件路径与主业务逻辑；
 * 2. 存储每个城市的视图元数据（初始画布尺寸、启动中心点、默认缩放比例、高德行政区等）；
 * 3. 提供统一的多城市管理对象 (CityDataManager)，支持动态切换、URL参数解析与持久化存储；
 * 4. 为核心引擎 (core/script.js) 和设置面板 (core/settings.js) 提供统一的城市数据总线。
 * 
 * ==============================================================================
 * ️ 开发者移植指南 (Porting Guide - How to Register a New City)
 * ==============================================================================
 * 当你需要为新城市（如上海、广州、深圳、成都、武汉等）制作线路图时：
 * 1. 在 `city/` 目录下创建以城市拼音/英文命名的新文件夹（例如 `city/shanghai/`）；
 * 2. 在下方 `CITY_REGISTRY` 对象中添加一条新城市配置记录（包含 id, name, center, mapSize, registerDate, maintainers 等；城市图标尽量不使用 SVG，优先使用 CGoUI 内置官方图标并设 `svglogo: null`，未收录时方填自定义 SVG）；
 * 3. 在 `city/{city_id}/` 下编写对应的业务与数据文件（参考 `city/beijing/` 规范）；
 * 4. 在 `main.html` 底部引入新城市脚本，或通过 `main.html?city={city_id}` 动态访问；
 * 5. 在 `manifest.json` 的 `shortcuts` 数组中添加该城市的快捷直达方式；
 * 6. 在 `sw.js` 中将新城市文件加入预缓存列表，并递增 `CACHE_NAME` 版本号。
 * ==============================================================================
 */

(function () {
    /**
     * 城市注册表字典 (City Registry Map)
     * 键名为城市唯一标识符 (cityId,如 "beijing", "shanghai")
     */
    const CITY_REGISTRY = {
        "beijing": {
            id: "beijing",
            name: "北京",
            themeColor: null, // 城市专属主题色 (未设置则使用系统默认蓝色)
            svglogo: null, // 已接入 CGoUI 内置 beijing 官方矢量图标
            folder: "./city/beijing",
            mainLogic: "./city/beijing/beijing.js",
            center: { x: 900, y: 640 },
            defaultScale: 1.1,
            mapSize: { width: 1850, height: 1300 },
            searchCity: "北京",
            title: "CGo OpenMap - 北京轨道交通线路图",
            keywords: "CGo OpenMap, 北京地铁, 线路图, 市郊铁路, 轨道交通",
            description: "由 CGo OpenMap 驱动的北京轨道交通智能交互线路图，全面覆盖北京地铁与市郊铁路线网。",
            officialMapUrl: "https://www.bjsubway.com/station/xltcx/",
            registerDate: "2026-09-03",
            status: "active",
            maintainers: [
                { name: "NaL", role: "城市主理人", github: "https://github.com/NokiaimuL" },
                { name: "SierraQin", role: "运营数据支持" },
                { name: "Freedom Space", role: "市郊铁路校对" }
            ],
            isDefault: true
        },
        "shanghai": {
            id: "shanghai",
            name: "上海",
            themeColor: "#b72626", // 城市专属主题色：上海地铁经典红 (若未设置则使用系统默认蓝色)
            svglogo: null, // 已接入 CGoUI 内置 shanghai 官方矢量图标
            folder: "./city/shanghai",
            mainLogic: "./city/shanghai/shanghai.js",
            center: { x: 1415, y: 1459 },
            defaultScale: 0.6,
            mapSize: { width: 2639, height: 3693 },
            searchCity: "上海",
            title: "CGo OpenMap - 上海轨道交通线路图",
            keywords: "CGo OpenMap, 上海地铁, 申通地铁, 线路图, 轨道交通",
            description: "包含 1~18 号线、浦江线、磁浮线与市域机场线，全网拓扑与几何站点对齐官方 D202512 矢量线网图。",
            officialMapUrl: "http://service.shmetro.com/yxxp/index.htm",
            registerDate: "2026-09-04",
            status: "active",
            maintainers: [
                { name: "Ryan Si", role: "城市主理人", github: "https://github.com/ryan-si" }
            ],
            isDefault: false
        },
        "shenyang": {
            id: "shenyang",
            name: "沈阳",
            themeColor: "#c60a16",
            svglogo: null, // 已接入 CGoUI 内置 shenyang 官方矢量图标
            folder: "./city/shenyang",
            mainLogic: "./city/shenyang/shenyang.js",
            center: { x: 1000, y: 800 },
            defaultScale: 1.0,
            mapSize: { width: 1944, height: 1680 },
            searchCity: "沈阳",
            title: "CGo OpenMap - 沈阳地铁线网图",
            keywords: "CGo OpenMap, 沈阳地铁, 线路图, 轨道交通",
            description: "包含沈阳地铁1~4、9、10号线及方城文化地标。",
            officialMapUrl: "https://www.symtc.com/wwmhm/pathQuery",
            registerDate: "2026-09-05",
            status: "active",
            maintainers: [
                { name: "jrzhang", role: "城市主理人", github: "https://github.com/beepingflijo" },
                { name: "从恒隆到细河", role: "运营数据支持" },
                { name: "普兰店大鹅", role: "有轨数据支持" }
            ],
            isDefault: false
        },
        "qingdao": {
            id: "qingdao",
            name: "青岛",
            themeColor: "#275140",
            svglogo: null, // 已接入 CGoUI 内置 qingdao 官方矢量图标
            folder: "./city/qingdao",
            mainLogic: "./city/qingdao/qingdao.js",
            center: { x: 1500, y: 1250 },
            defaultScale: 1.45,
            mapSize: { width: 3000, height: 2500 },
            searchCity: "青岛",
            title: "CGo OpenMap - 青岛轨道交通线路图",
            keywords: "CGo OpenMap, 青岛地铁, 青岛轨道交通, 线路图",
            description: "包含在运营 8 条线路和在建 8 段线路。",
            officialMapUrl: "https://www.qd-metro.com/",
            registerDate: "2026-09-09",
            status: "active",
            maintainers: [
                { name: "YoTra青通", role: "城市主理人", github: "https://github.com/YoTraYoungTraffic" }
            ],
            isDefault: false
        },
        "hefei": {
            id: "hefei",
            name: "合肥",
            themeColor: "#e71f24", // 合肥轨道交通 1 号线红
            // 官方「隧道+列车」徽标图形，去色；门户按 currentColor 着色
            svglogo: null, // 已接入 CGoUI 内置 hefei 官方矢量图标
            folder: "./city/hefei",
            mainLogic: "./city/hefei/hefei.js",
            center: { x: 1200, y: 1400 },
            defaultScale: 0.75,
            mapSize: { width: 2400, height: 3000 },
            searchCity: "合肥",
            title: "CGo OpenMap - 合肥轨道交通线路图",
            keywords: "CGo OpenMap, 合肥地铁, 合肥轨道交通, 线路图",
            description: "覆盖 1–8 号线及 S1 线示意。",
            officialMapUrl: "https://www.hfgdjt.com/",
            registerDate: "2026-09-07",
            status: "active",
            maintainers: [
                { name: "Evin", role: "城市主理人", github: "https://github.com/walternie" }
            ],
            isDefault: false
        },
        "sydney": {
            id: "sydney",
            name: "悉尼",
            themeColor: "#f7931e", // Transport for NSW 官方橙
            // Transport for NSW "T" 列车模式标识（去色，按 currentColor 着色）
            svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M50,0C22.39,0,0,22.39,0,50s22.39,50,50,50,50-22.39,50-50S77.61,0,50,0ZM50,89.5c-21.82,0-39.5-17.68-39.5-39.5S28.18,10.5,50,10.5s39.5,17.68,39.5,39.5-17.68,39.5-39.5,39.5ZM72.5,25.5H27.5v12h16v37h13v-37h16v-12Z"/></svg>',
            folder: "./city/sydney",
            mainLogic: "./city/sydney/sydney.js",
            center: { x: 780, y: 830 },
            defaultScale: 0.62,
            mapSize: { width: 1542, height: 1706 },
            searchCity: "悉尼",
            title: "CGo OpenMap - 悉尼轨道交通线路图",
            keywords: "CGo OpenMap, Sydney Trains, Sydney Metro, 悉尼地铁, 悉尼轨道交通, 线路图",
            description: "覆盖 T1–T9 铁路干线、M1 地铁及在建的 Sydney Metro West 与西悉尼机场线。",
            officialMapUrl: "https://transportnsw.info/routes/train",
            registerDate: "2026-09-15",
            status: "active",
            maintainers: [
                { name: "Ryan Si", role: "城市主理人", github: "https://github.com/ryan-si" }
            ],
            isDefault: false
        },
        "hongkong": {
            id: "hongkong",
            name: "香港",
            themeColor: "#001F50", // 綫路圖站名深藍
            svglogo: null, // 已接入 CGoUI 内置 hongkong 矢量图标
            folder: "./city/hongkong",
            mainLogic: "./city/hongkong/hongkong.js",
            center: { x: 1030, y: 600 },
            defaultScale: 0.55,
            mapSize: { width: 2055, height: 1238 },
            searchCity: "香港",
            title: "CGo OpenMap - 香港鐵路綫路圖",
            keywords: "CGo OpenMap, 香港鐵路, 港鐵, 香港地铁, 线路图, 同台换乘",
            description: "覆盖港铁十条重铁线路、轻铁与高铁香港段，支持同台换乘指南与优先同台换乘的行程规划（非官方）。",
            officialMapUrl: "https://www.mtr.com.hk/ch/customer/services/system_map.html",
            registerDate: "2026-09-24",
            status: "active",
            maintainers: [
                { name: "Ryan Si", role: "城市主理人", github: "https://github.com/ryan-si" }
            ],
            // 示意图线宽（綫路描邊 8.15px），供邻城绘制香港影子时换算比例
            lineWidth: 8.15,
            shadowDeco: "./city/hongkong/assets/hongkong_deco.svg",
            // 与深圳衔接：往上滑可见深圳线网影子，继续上滑进入深圳；缩到很小时两城并看
            minScale: 0.18,
            neighbors: [{
                id: "shenzhen", edge: "top",
                // 两图线宽之比 8.15 / 5.4 ≈ 1.5；深圳图的深港边界贴香港图顶边，罗湖对准罗湖
                scale: 1.5, offset: { x: -1050.64, y: -2046.9 },
                title: ["深圳", "Shenzhen"]
            }],
            isDefault: false
        },
        "shenzhen": {
            id: "shenzhen",
            name: "深圳",
            themeColor: "#009B4D", // 深圳地铁标识绿
            svglogo: null, // 已接入 CGoUI 内置 shenzhen 官方矢量图标
            folder: "./city/shenzhen",
            mainLogic: "./city/shenzhen/shenzhen.js",
            center: { x: 960, y: 760 },
            defaultScale: 0.62,
            mapSize: { width: 1921, height: 1586 },
            searchCity: "深圳",
            title: "CGo OpenMap - 深圳轨道交通线路图",
            keywords: "CGo OpenMap, 深圳地铁, 深圳轨道交通, 线路图, 口岸, 港铁",
            description: "覆盖深圳地铁 1~14、16、20 号线及 6 号线支线，与香港线路图衔接，口岸车站提供通关信息（非官方）。",
            officialMapUrl: "https://www.szmc.net/map/",
            registerDate: "2026-09-25",
            status: "active",
            maintainers: [
                { name: "Ryan Si", role: "城市主理人", github: "https://github.com/ryan-si" }
            ],
            lineWidth: 5.4,
            shadowDeco: "./city/shenzhen/assets/shenzhen_deco.svg",
            minScale: 0.25,
            neighbors: [{
                id: "hongkong", edge: "bottom",
                // 与香港侧的配置互为逆变换
                scale: 1 / 1.5, offset: { x: 700.43, y: 1364.6 },
                title: ["香港", "Hong Kong"]
            }],
            isDefault: false
        },
        "dalian": {
            id: "dalian",
            name: "大连",
            themeColor: "#0031A8", // 大连地铁官方标识蓝
            svglogo: null, // 已接入 CGoUI 内置 dalian 官方矢量图标
            folder: "./city/dalian",
            mainLogic: "./city/dalian/dalian.js",
            center: { x: 1000, y: 800 },
            defaultScale: 1.0,
            mapSize: { width: 2200, height: 1400 },
            searchCity: "大连",
            title: "CGo OpenMap - 大连地铁线网图",
            keywords: "CGo OpenMap, 大连地铁, 线路图, 轨道交通",
            description: "包含当前运营的 1、2、3、5、12、13 号线及 3 号线支线。",
            officialMapUrl: "https://www.dltransgrp.com/h55/app-h5/metromap/#/?cityId=2102",
            registerDate: "2026-09-08",
            status: "active",
            maintainers: [
                { name: "jrzhang", role: "城市主理人", github: "https://github.com/beepingflijo" },
                { name: "duckinglim", role: "运营数据支持" }
            ],
            isDefault: false
        },
        "changchun": {
            id: "changchun",
            name: "长春",
            themeColor: "#C9062C",
            svglogo: null, // 已接入 CGoUI 内置 changchun 官方矢量图标
            folder: "./city/changchun",
            mainLogic: "./city/changchun/changchun.js",
            center: { x: 1150, y: 950 },
            defaultScale: 0.7,
            mapSize: { width: 2300, height: 1900 },
            searchCity: "长春",
            title: "CGo OpenMap - 长春轨道交通线路图",
            keywords: "CGo OpenMap, 长春地铁, 长春轨道交通, 线路图",
            description: "线路走向依据官方交互线路图整理。",
            officialMapUrl: "http://www.ccqg.com/metro-map/metromap_new/ccSubwayMap1.html",
            registerDate: "2026-09-13",
            status: "active",
            maintainers: [
                { name: "jrzhang", role: "城市主理人", github: "https://github.com/beepingflijo" }
            ],
            isDefault: false
        },
        "fuzhou": {
            id: "fuzhou",
            name: "福州",
            themeColor: "#079445",
            svglogo: null, // 已接入 CGoUI 内置 fuzhou 官方矢量图标
            folder: "./city/fuzhou",
            mainLogic: "./city/fuzhou/fuzhou.js",
            center: { x: 1500, y: 1250 },
            defaultScale: 0.6,
            mapSize: { width: 4000, height: 2500 },
            searchCity: "福州",
            title: "CGo OpenMap - 福州轨道交通线路图",
            keywords: "CGo OpenMap, 福州, 轨道交通, 线路图",
            description: "尝试性的功能，使用线路编辑器直接制作的福州轨道交通线路图。",
            registerDate: "2026-09-16",
            officialMapUrl: "https://www.fzmtr.com/xlcx",
            status: "active",
            maintainers: [
                { name: "福南所CRH1A-A-1186", role: "城市主理人", github: "https://github.com/CRH1A-A-1186" }
            ],
            isDefault: false
        },
    };

    // ==========================================================================
    // 城市激活与状态解析 (City Resolution Logic)
    // 优先级：URL 查询参数 ?city=xxx > 本地 LocalStorage 记忆 > 默认城市 (beijing)
    // ==========================================================================
    const urlParams = new URLSearchParams(window.location.search);
    const rawUrlCity = urlParams.get('city');
    const urlCity = rawUrlCity ? rawUrlCity.toLowerCase().trim() : null;
    const storedCity = localStorage.getItem('cgo_openmap_city');

    let currentCityId = "beijing";
    if (urlCity && CITY_REGISTRY[urlCity]) {
        currentCityId = urlCity;
        // 用户通过 URL 明确指定时，同步更新本地偏好记录
        try { localStorage.setItem('cgo_openmap_city', currentCityId); } catch (_) { }
    } else if (storedCity && CITY_REGISTRY[storedCity]) {
        currentCityId = storedCity;
    }

    // 动态同步网页标题与元数据（仅在线路图核心画布页生效，避免污染门户首页标题）
    const isMapPage = Boolean(window.location.pathname.includes('main.html') || document.getElementById('map-container'));
    const activeCityMeta = CITY_REGISTRY[currentCityId];
    if (isMapPage && activeCityMeta) {
        if (activeCityMeta.title) document.title = activeCityMeta.title;
        const descEl = document.querySelector('meta[name="description"]');
        if (descEl && activeCityMeta.description) descEl.setAttribute('content', activeCityMeta.description);
        const kwEl = document.querySelector('meta[name="keywords"]');
        if (kwEl && activeCityMeta.keywords) kwEl.setAttribute('content', activeCityMeta.keywords);
    }

    /**
     * 城市数据与运行时管理器 (CityDataManager)
     * 提供城市配置的查询、动态注册与激活切换能力
     */
    const CityDataManager = {
        /**
         * 获取所有已在系统注册的城市配置列表
         * @returns {Array<Object>} 城市配置对象数组
         */
        getAllCities() {
            return Object.values(CITY_REGISTRY);
        },

        /**
         * 获取指定城市的基础元数据配置
         * @param {string} cityId - 城市标识 ID (如 'beijing', 'shanghai')
         * @returns {Object|null} 城市配置对象
         */
        getCity(cityId) {
            return CITY_REGISTRY[cityId] || CITY_REGISTRY[currentCityId] || null;
        },

        /**
         * 获取当前处于激活状态的城市配置
         * @returns {Object} 当前城市的配置对象
         */
        getCurrentCity() {
            return this.getCity(currentCityId);
        },

        /**
         * 获取当前激活城市的 ID 字符串
         * @returns {string} 城市 ID (如 'beijing')
         */
        getCurrentCityId() {
            return currentCityId;
        },

        /**
         * 设置并激活当前城市（同步保存至 localStorage）
         * @param {string} cityId - 目标城市 ID
         * @returns {boolean} 设置是否成功
         */
        setCurrentCity(cityId) {
            if (CITY_REGISTRY[cityId]) {
                currentCityId = cityId;
                localStorage.setItem('cgo_openmap_city', cityId);
                // 唤起 CGoUI 主题色同步机制，确保跨城市颜色不互相污染
                if (window.CGO && typeof window.CGO.syncCityTheme === 'function') {
                    window.CGO.syncCityTheme();
                }
                window.dispatchEvent(new CustomEvent('cgo-city-change', { detail: { cityId } }));
                return true;
            }
            console.warn(`[CityDataManager] 未找到城市配置: ${cityId}`);
            return false;
        },

        /**
         * 动态向注册表添加一个新城市配置
         * @param {Object} cityConfig - 城市配置对象（必须包含 id 字段）
         * @returns {boolean} 注册是否成功
         */
        registerCity(cityConfig) {
            if (cityConfig && cityConfig.id) {
                CITY_REGISTRY[cityConfig.id] = Object.assign({}, CITY_REGISTRY[cityConfig.id] || {}, cityConfig);
                if (cityConfig.isDefault && !urlCity && !storedCity) {
                    currentCityId = cityConfig.id;
                }
                return true;
            }
            return false;
        }
    };

    // ==========================================================================
    // 全局导出与挂载 (Global Window Exports)
    // ==========================================================================
    window.CITY_REGISTRY = CITY_REGISTRY;
    window.CityDataManager = CityDataManager;
    window.getCurrentCityData = () => CityDataManager.getCurrentCity();

    console.log("[CityRegistry] 城市注册表加载完毕，当前城市:", currentCityId);
})();
