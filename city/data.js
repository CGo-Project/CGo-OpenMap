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
 * 2. 在下方 `CITY_REGISTRY` 对象中添加一条新城市配置记录（包含 id, name, center, mapSize, registerDate, maintainers 等）；
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
            svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M75.01,49.78c-.51-8.38-3.15-16.19-7.38-22.9H28.81v48.54h40.82c2.22-4.27,3.83-8.91,4.71-13.81h9.7c-4.82,14.16-18.24,24.34-34.03,24.34-19.85,0-35.95-16.1-35.95-35.95S30.15,14.05,50,14.05c16.11,0,29.75,10.6,34.31,25.22h14.53C93.93,16.8,73.92,0,50,0,22.38,0,0,22.38,0,50s22.38,50,50,50,50-22.39,50-50v-.22h-24.99ZM61.36,58.75c0,2.68-.78,5.18-2.12,7.25h-18.38v-29.04h18.38c1.34,2.08,2.12,4.58,2.12,7.26s-.78,5.19-2.12,7.25c1.34,2.08,2.12,4.59,2.12,7.27Z" style="fill-rule:evenodd;"/></svg>',
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
            svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M469.35 1020.885c-88.28-7.894-168.97-36.056-240.563-83.954C157.48 889.206 96.74 820.908 58.277 745.154l-13.77-27.101H221.82l15.29 18.665c39.646 48.398 100.05 89.453 160.953 109.414 41.33 13.535 59.74 16.218 111.188 16.167 53.488-0.051 69.481-2.377 111.413-16.177a359.748 359.748 0 0 0 185.443-140.35c8.771-12.954 32.66-58.067 32.66-61.658 0-0.979-26.081-1.795-57.966-1.795h-57.966l-40.789-45.338c-22.43-24.929-43.604-48.572-47.052-52.53l-6.283-7.2-58.077 51.509c-31.946 28.335-58.619 51.509-59.261 51.509-0.663 0-29.927-23.103-65.034-51.356l-63.851-51.356-4.662 5.212c-2.57 2.876-23.888 25.836-47.378 51.04l-42.696 45.807-81.13 1.357c-44.614 0.734-105.22 1.346-134.678 1.346h-53.57l-3.12-13.82c-6.192-27.204-9.65-51.153-11.985-82.895-6.6-89.83 12.545-183.8 54.1-265.48 25.326-49.776 54.997-90.453 95.674-131.17 34.404-34.414 66.4-58.568 109.831-82.884C334.334 26.066 409.038 5.198 490.84 2.362c90.738-3.131 173.948 15.32 251.508 55.773 135.239 70.542 231.637 196.59 264.032 345.253l3.917 17.932-78.682-0.53-78.67-0.541-7.14-21.318C805.677 279.358 699.09 187.999 572.856 165.029c-32.313-5.886-87.78-6.314-119.888-0.918-98.674 16.554-187.483 74.367-240.992 156.873-28.192 43.472-45.124 88.392-52.824 140.196-6.018 40.422-10.057 35.822 31.497 35.822h35.475l71.561-92.614c39.372-50.938 72.45-92.615 73.52-92.615 1.072 0 32.6 32.232 70.074 71.634 37.463 39.402 68.95 71.633 69.96 71.633 1.01 0 25.877-32.048 55.273-71.215l53.427-71.215 81.272 93.165 81.272 93.175 117.033 0.051c111.932 0.041 117.093 0.204 118.236 3.825 1.428 4.519-1.969 60.77-4.937 81.67-10.77 75.632-40.88 153.232-83.598 215.41-21.317 31.038-34.138 46.328-62.667 74.785-79.202 78.977-179.894 128.61-290.267 143.073-30.477 3.998-80.752 5.467-106.945 3.121z"/></svg>',
            folder: "./city/shanghai",
            mainLogic: "./city/shanghai/shanghai.js",
            center: { x: 900, y: 650 },
            defaultScale: 1.1,
            mapSize: { width: 1850, height: 1300 },
            searchCity: "上海",
            title: "CGo OpenMap - 上海轨道交通线路图",
            keywords: "CGo OpenMap, 上海地铁, 申通地铁, 线路图, 轨道交通",
            description: "由 CGo OpenMap 驱动的上海轨道交通智能交互线路图，主理人虚位以待，欢迎共建！",
            officialMapUrl: "http://service.shmetro.com/yxxp/index.htm",
            registerDate: "2026-09-04",
            status: "recruiting",
            maintainers: [
                { name: "待认领", role: "城市主理人招募中", isRecruiting: true, github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md" }
            ],
            isDefault: false
        },
        "shenyang": {
            id: "shenyang",
            name: "沈阳",
            themeColor: "#c60a16",
            svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M444.598 0h147.509c0 10.214 0.007 20.435-0.008 30.648a495.651 495.651 0 0 1 202.137 78.578c77.966 52.218 140.648 127.067 177.738 213.309a466.285 466.285 0 0 1 19.432 53.515c-51.002 0.014-102.019 0.007-153.021 0.007C814.39 320.53 775.857 271.34 727.56 234.922a346.175 346.175 0 0 0-114.996-57.317c-5.896-1.688-13.287-0.413-16.817 4.996-2.896 5.269-3.965 11.415-3.655 17.384 0.015 58.688 0.015 117.369 0 176.065-49.167 0.014-98.327 0.007-147.502 0.007 0.008-59.285-0.03-118.578 0.015-177.855 0.428-6.028-2.056-11.909-5.6-16.662-1.939-2.203-3.928-4.812-6.898-5.6-2.542-0.038-4.974 0.854-7.391 1.51a346.868 346.868 0 0 0-123.663 63.758c-62.49 50.007-107.11 121.96-123.655 200.28 71.209-0.044 142.417 0 213.618-0.015 19.934-0.11 39.868 0.25 59.801-0.243 27.384 0.037 54.76 0 82.137 0.015 22.02 0.096 44.031-0.243 66.028 0.228 81.864-0.015 163.736 0 245.593-0.007 51.754-0.472 103.508-0.11 155.261-0.243 11.327 0.39 22.66 0.132 33.987 0.324v141.105c-8.924 0.199-17.855 0.03-26.78 0.089a485.887 485.887 0 0 1-79.27 205.74 495.106 495.106 0 0 1-335.666 211.414v24.098h-147.51v-23.751a495.32 495.32 0 0 1-344.98-221.223 486.867 486.867 0 0 1-59.322-131.046c51.348-0.082 102.704-0.03 154.053-0.03 24.045 60.42 65.099 113.98 117.39 152.66a346.69 346.69 0 0 0 110.575 54.864c4.923 1.208 10.855 3.338 15.417 0.051 4.856-4.952 7.207-12.13 6.89-19.005-0.052-62.859-0.015-125.718-0.015-188.577 49.167 0 98.327-0.008 147.494 0.007 0.008 62.852 0.015 125.704 0 188.555-0.154 5.188 0.162 10.796 3.206 15.203 3.169 4.458 9.145 6.264 14.355 4.937 8.777-2.056 17.318-5.018 25.822-7.995 62.365-22.314 117.892-63.058 158.29-115.505a352.564 352.564 0 0 0 67.502-150.397h-252.44c-6.543 0.08-13.102-0.266-19.63 0.427-47.289 0.015-94.577 0.015-141.872 0-5.652-0.641-11.341-0.383-17.008-0.427H200.928c-9.543 0.169-19.115-0.406-28.636 0.434-47.31 0.03-94.628-0.037-141.938 0.03-10.096-0.87-20.236-0.288-30.354-0.457V441.48c9.123 0 18.246-0.008 27.384 0.007 12.402-82.181 46.573-160.862 97.863-226.22a495.408 495.408 0 0 1 319.35-185.091V0z"/></svg>',
            folder: "./city/shenyang",
            mainLogic: "./city/shenyang/shenyang.js",
            center: { x: 1000, y: 1170 },
            defaultScale: 1.0,
            mapSize: { width: 2000, height: 2400 },
            searchCity: "沈阳",
            title: "CGo OpenMap - 沈阳地铁线网图",
            keywords: "CGo OpenMap, 沈阳地铁, 线路图, 轨道交通",
            description: "由 CGo OpenMap 驱动的沈阳轨道交通智能交互线路图，包含沈阳地铁1~4、9、10号线及方城文化地标。",
            officialMapUrl: "https://symtc.com/metro/passenger?menuInfo=IqrtbiWGPusZw4wCih3m2YRNiXJIYT1pjX2pF0/XX30lu1%2BGtOMiaCjsVIw9ivHVzeD8jpj3GuOHd8UqVujd33oHmcuPVsisY9MZemovzQQ=",
            registerDate: "2026-09-05",
            status: "active",
            maintainers: [
                { name: "jrzhang", role: "城市主理人", github: "https://github.com/beepingflijo" },
                { name: "从恒隆到细河", role: "运营数据支持" }
            ],
            isDefault: false
        },
        "hefei": {
            id: "hefei",
            name: "合肥",
            themeColor: "#e71f24", // 合肥轨道交通 1 号线红
            // 官方「隧道+列车」徽标左侧图形，去色；门户按 currentColor 着色
            svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M6,98L6,30Q6,6 30,6L70,6Q94,6 94,30L94,98L83,98L83,32Q83,17 68,17L32,17Q17,17 17,32L17,98Z"/><path d="M24,98L24,36Q24,24 36,24L64,24Q76,24 76,36L76,98L70.5,98L70.5,37Q70.5,29.5 63,29.5L37,29.5Q29.5,29.5 29.5,37L29.5,98Z"/><path d="M33.5,98L33.5,42Q33.5,34 41.5,34L58.5,34Q66.5,34 66.5,42L66.5,98L62,98L62,43Q62,38.5 57.5,38.5L42.5,38.5Q38,38.5 38,43L38,98Z"/><path d="M39,98L39,61Q39,52 47,52L53,52Q61,52 61,61L61,98ZM41.6,87.8a3.2,3.2 0 1,0 6.4,0a3.2,3.2 0 1,0 -6.4,0M52,87.8a3.2,3.2 0 1,0 6.4,0a3.2,3.2 0 1,0 -6.4,0" style="fill-rule:evenodd;"/></svg>',
            folder: "./city/hefei",
            mainLogic: "./city/hefei/hefei.js",
            center: { x: 1200, y: 1400 },
            defaultScale: 0.75,
            mapSize: { width: 2400, height: 3000 },
            searchCity: "合肥",
            title: "CGo OpenMap - 合肥轨道交通线路图",
            keywords: "CGo OpenMap, 合肥地铁, 合肥轨道交通, 线路图",
            description: "由 CGo OpenMap 驱动的合肥轨道交通智能交互线路图，覆盖 1–8 号线及 S1 线示意。",
            officialMapUrl: "https://www.hfgdjt.com/",
            registerDate: "2026-09-07",
            status: "active",
            maintainers: [
                { name: "Evin", role: "城市主理人", github: "https://github.com/walternie" }
            ],
            isDefault: false
        }
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
