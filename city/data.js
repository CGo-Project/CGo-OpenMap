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
                { name: "普兰店大鹅", role: "有轨数据支持" },
                { name: "工业大学站", role: "站名题字资源支持" }
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
            description: "包含当前运营的 1、2、3、4、6、8 号线及蓝谷快线、西海岸快线，并包含三期规划在建线路。",
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
            // 站点 y 最大 1980（永春南，在建）。此处仅为注册表兜底，运行时以 changchun.js
            // 的注册值为准，两处需保持一致（站点下边距与沈阳、哈尔滨同口径）
            mapSize: { width: 2300, height: 2100 },
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
        "lanzhou": {
            id: "lanzhou",
            name: "兰州",
            themeColor: "#19A7FD",
            folder: "./city/lanzhou",
            mainLogic: "./city/lanzhou/lanzhou.js",
            center: { x: 1200, y: 1200 },
            defaultScale: 1.0,
            // 画布总尺寸 (根据线网图宽高设定)
            mapSize: { width: 2600, height: 2000 },
            // 高德地图检索所属行政区名称
            searchCity: "兰州",
            officialMapUrl: "https://www.lzgdjt.com/",
            // 网页元数据
            title: "CGo OpenMap - 兰州轨道交通线路图",
            keywords: "兰州地铁, 线路图, 轨道交通",
            description: "包含已运营1、2号线、中川城际以及规划中3-5、7、8号线",
            registerDate: "2026-09-26",
            status: "active",
            maintainers: [
                { name: "Bingcaowan", role: "城市主理人", github: "https://github.com/icegrassbay" }
            ],
            isDefault: false // 设为默认激活
        },
        "harbin": {
            id: "harbin",
            name: "哈尔滨",
            themeColor: "#E60012", // 待定：暂用 1 号线中国红，官方品牌色核实后再替换
            svglogo: null, // 已接入 CGoUI 内置 harbin 官方矢量图标
            folder: "./city/harbin",
            mainLogic: "./city/harbin/harbin.js",
            center: { x: 700, y: 780 },
            defaultScale: 0.55,
            mapSize: { width: 1290, height: 1590 },
            searchCity: "哈尔滨",
            title: "CGo OpenMap - 哈尔滨轨道交通线路图",
            keywords: "CGo OpenMap, 哈尔滨地铁, 哈尔滨轨道交通, 线路图",
            description: "包含 1、2、3 号线全线（3 号线为环线）与 4 座国铁车站。",
            officialMapUrl: "http://www.harbin-metro.com/",
            registerDate: "2026-09-28",
            status: "active",
            // 主理人虚位以待：哈尔滨公开运营信息稀少，本图由提交者代为整理，
            // 不占用主理人身份，面向哈尔滨当地有意长期维护者开放认领。
            // isRecruiting 会被 core/help.js（「关于与帮助」弹窗）、index.html（首页卡片徽标）
            // 与共享层 calligraphy.js（站名题字署名）统一识别为「招募中」。
            maintainers: [
                { name: "待认领", role: "城市主理人招募中", isRecruiting: true,
                  github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md" }
            ],
            isDefault: false
        },
        "hohhot": {
            id: "hohhot",
            name: "呼和浩特",
            themeColor: "#017FCB", // 呼和浩特地铁官方徽标蓝（与下方 svglogo 的原始填充色一致）
            svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M100,50Q100,51.23,99.94,52.45Q99.88,53.68,99.76,54.9Q99.64,56.12,99.46,57.34Q99.28,58.55,99.04,59.75Q98.8,60.96,98.5,62.15Q98.2,63.34,97.85,64.51Q97.49,65.69,97.08,66.84Q96.66,68,96.19,69.13Q95.72,70.27,95.2,71.38Q94.67,72.49,94.1,73.57Q93.52,74.65,92.89,75.71Q92.26,76.76,91.57,77.78Q90.89,78.8,90.16,79.78Q89.43,80.77,88.65,81.72Q87.87,82.67,87.05,83.58Q86.22,84.49,85.36,85.36Q84.49,86.22,83.58,87.05Q82.67,87.87,81.72,88.65Q80.77,89.43,79.78,90.16Q78.8,90.89,77.78,91.57Q76.76,92.26,75.71,92.89Q74.65,93.52,73.57,94.1Q72.49,94.67,71.38,95.2Q70.27,95.72,69.13,96.19Q68,96.66,66.84,97.08Q65.69,97.49,64.51,97.85Q63.34,98.2,62.15,98.5Q60.96,98.8,59.75,99.04Q58.55,99.28,57.34,99.46Q56.12,99.64,54.9,99.76Q53.68,99.88,52.45,99.94Q51.23,100,50,100Q48.98,100,47.95,99.96Q46.93,99.92,45.91,99.83Q44.89,99.75,43.87,99.62Q42.86,99.5,41.85,99.33Q40.84,99.16,39.84,98.96Q38.83,98.75,37.84,98.5Q36.85,98.25,35.87,97.96Q34.88,97.67,33.91,97.34Q32.95,97.01,31.99,96.64Q31.04,96.28,30.1,95.87Q29.16,95.46,28.24,95.01Q27.31,94.57,26.41,94.09Q25.51,93.6,24.63,93.08Q23.74,92.56,22.88,92.01Q22.02,91.45,21.19,90.86Q20.35,90.27,19.54,89.65Q18.73,89.03,17.94,88.37Q17.16,87.71,16.4,87.03Q15.64,86.34,14.91,85.62Q14.18,84.9,13.48,84.15Q12.78,83.41,12.12,82.63Q11.45,81.85,10.81,81.05Q10.18,80.25,9.57,79.42Q8.97,78.59,8.4,77.74Q7.83,76.89,7.3,76.02Q6.77,75.14,6.27,74.25Q5.78,73.35,5.32,72.44Q4.86,71.52,4.44,70.59Q4.01,69.66,3.63,68.71Q3.25,67.76,2.9,66.79Q2.56,65.83,2.26,64.85Q1.95,63.87,1.69,62.89L10.72,53.86Q10.8,54.76,10.93,55.66Q11.06,56.56,11.24,57.45Q11.41,58.35,11.62,59.23Q11.83,60.11,12.09,60.99Q12.34,61.86,12.63,62.72Q12.92,63.58,13.26,64.42Q13.59,65.27,13.96,66.1Q14.33,66.93,14.74,67.74Q15.15,68.55,15.59,69.34Q16.04,70.14,16.52,70.91Q17,71.68,17.52,72.43Q18.03,73.17,18.58,73.9Q19.13,74.62,19.71,75.32Q20.3,76.01,20.91,76.68Q21.53,77.35,22.17,77.99Q22.81,78.63,23.49,79.24Q24.16,79.85,24.86,80.43Q25.56,81.01,26.29,81.56Q27.01,82.1,27.77,82.62Q28.52,83.13,29.29,83.6Q30.06,84.08,30.86,84.52Q31.65,84.96,32.47,85.37Q33.28,85.77,34.11,86.13Q34.94,86.5,35.79,86.83Q36.64,87.15,37.5,87.44Q38.36,87.73,39.24,87.98Q40.11,88.23,41,88.43Q41.88,88.64,42.77,88.81Q43.67,88.97,44.57,89.1Q45.47,89.22,46.37,89.31Q47.28,89.39,48.18,89.43Q49.09,89.47,50,89.47Q50.97,89.47,51.93,89.43Q52.89,89.38,53.86,89.28Q54.82,89.19,55.77,89.05Q56.73,88.91,57.67,88.72Q58.62,88.53,59.56,88.3Q60.5,88.06,61.42,87.79Q62.34,87.51,63.25,87.18Q64.16,86.86,65.06,86.49Q65.95,86.12,66.82,85.71Q67.7,85.3,68.55,84.84Q69.4,84.39,70.23,83.9Q71.06,83.4,71.86,82.87Q72.67,82.33,73.44,81.76Q74.22,81.18,74.97,80.57Q75.72,79.96,76.43,79.32Q77.15,78.67,77.84,77.99Q78.52,77.31,79.17,76.59Q79.82,75.88,80.44,75.14Q81.05,74.39,81.63,73.62Q82.21,72.84,82.75,72.04Q83.29,71.24,83.78,70.41Q84.28,69.59,84.74,68.74Q85.2,67.89,85.62,67.02Q86.03,66.15,86.41,65.25Q86.78,64.36,87.11,63.46Q87.44,62.55,87.72,61.63Q88.01,60.7,88.25,59.77Q88.49,58.83,88.68,57.89Q88.87,56.94,89.02,55.98Q89.16,55.03,89.26,54.07Q89.36,53.11,89.42,52.14Q89.47,51.18,89.47,50.21L100,50L100,50L100,50ZM98.53,37.96Q98.28,36.95,97.99,35.96Q97.7,34.96,97.36,33.98Q97.03,33,96.66,32.03Q96.29,31.06,95.87,30.11Q95.46,29.16,95.01,28.22Q94.56,27.29,94.07,26.37Q93.58,25.46,93.05,24.57Q92.52,23.67,91.96,22.8Q91.39,21.93,90.79,21.09Q90.19,20.24,89.56,19.42Q88.92,18.6,88.26,17.81Q87.59,17.01,86.89,16.25Q86.19,15.48,85.46,14.75Q84.72,14.01,83.96,13.31Q83.2,12.6,82.41,11.93Q81.62,11.26,80.81,10.62Q79.99,9.98,79.15,9.37Q78.3,8.77,77.44,8.2Q76.57,7.63,75.68,7.1Q74.79,6.56,73.88,6.07Q72.97,5.57,72.03,5.12Q71.1,4.66,70.15,4.24Q69.2,3.82,68.24,3.45Q67.27,3.07,66.29,2.73Q65.31,2.39,64.32,2.09Q63.32,1.8,62.32,1.54Q61.31,1.29,60.3,1.07Q59.28,0.86,58.26,0.69Q57.24,0.52,56.21,0.39Q55.18,0.26,54.14,0.17Q53.11,0.09,52.07,0.04Q51.04,0,50,0Q48.77,0,47.55,0.06Q46.32,0.12,45.1,0.24Q43.88,0.36,42.66,0.54Q41.45,0.72,40.25,0.96Q39.04,1.2,37.85,1.5Q36.66,1.8,35.49,2.15Q34.31,2.51,33.16,2.92Q32,3.34,30.87,3.81Q29.73,4.28,28.62,4.8Q27.51,5.33,26.43,5.9Q25.35,6.48,24.29,7.11Q23.24,7.74,22.22,8.43Q21.2,9.11,20.22,9.84Q19.23,10.57,18.28,11.35Q17.33,12.13,16.42,12.95Q15.51,13.78,14.64,14.64Q13.78,15.51,12.95,16.42Q12.13,17.33,11.35,18.28Q10.57,19.23,9.84,20.22Q9.11,21.2,8.43,22.22Q7.74,23.24,7.11,24.29Q6.48,25.35,5.9,26.43Q5.33,27.51,4.8,28.62Q4.28,29.73,3.81,30.87Q3.34,32,2.92,33.16Q2.51,34.31,2.15,35.49Q1.8,36.66,1.5,37.85Q1.2,39.04,0.96,40.25Q0.72,41.45,0.54,42.66Q0.36,43.88,0.24,45.1Q0.12,46.32,0.06,47.55Q0,48.77,0,50Q0,54.82,0.92,59.55L10.53,49.94Q10.53,48.97,10.58,48.01Q10.63,47.04,10.72,46.08Q10.82,45.11,10.96,44.16Q11.1,43.2,11.29,42.25Q11.48,41.3,11.72,40.36Q11.96,39.42,12.24,38.5Q12.52,37.57,12.85,36.66Q13.18,35.75,13.55,34.85Q13.92,33.96,14.33,33.08Q14.75,32.21,15.21,31.36Q15.66,30.5,16.16,29.67Q16.66,28.84,17.2,28.04Q17.74,27.23,18.32,26.46Q18.89,25.68,19.51,24.93Q20.12,24.18,20.77,23.47Q21.42,22.75,22.11,22.07Q22.79,21.38,23.51,20.73Q24.23,20.08,24.98,19.47Q25.73,18.86,26.5,18.28Q27.28,17.7,28.09,17.17Q28.89,16.63,29.72,16.13Q30.55,15.63,31.41,15.18Q32.26,14.72,33.14,14.31Q34.01,13.9,34.91,13.53Q35.8,13.16,36.71,12.83Q37.63,12.5,38.55,12.22Q39.48,11.94,40.42,11.71Q41.36,11.47,42.31,11.28Q43.26,11.09,44.21,10.95Q45.17,10.81,46.13,10.72Q47.1,10.62,48.06,10.57Q49.03,10.53,50,10.53Q50.76,10.53,51.51,10.56Q52.27,10.58,53.03,10.64Q53.78,10.7,54.53,10.79Q55.28,10.87,56.03,10.99Q56.78,11.11,57.52,11.25Q58.27,11.39,59.01,11.57Q59.74,11.74,60.47,11.94Q61.2,12.14,61.92,12.37Q62.65,12.6,63.36,12.86Q64.07,13.11,64.77,13.4Q65.48,13.68,66.17,13.99Q66.86,14.3,67.54,14.64Q68.21,14.97,68.88,15.33Q69.54,15.7,70.19,16.08Q70.85,16.47,71.48,16.88Q72.12,17.29,72.73,17.73Q73.35,18.17,73.96,18.63Q74.56,19.09,75.14,19.57Q75.73,20.05,76.29,20.56Q76.85,21.06,77.4,21.58Q77.94,22.11,78.47,22.66Q78.99,23.2,79.5,23.77Q80,24.33,80.48,24.92Q80.96,25.5,81.42,26.11Q81.88,26.71,82.31,27.33Q82.75,27.95,83.16,28.59Q83.57,29.22,83.96,29.87Q84.34,30.52,84.7,31.19Q85.06,31.86,85.4,32.53Q85.73,33.21,86.04,33.91Q86.35,34.6,86.63,35.3Q86.92,36,87.17,36.71L98.53,37.96Z" fill-rule="evenodd"/><path d="M2.63,62.5L14.74,67.31L24.71,55.13L37.85,55.13L28.85,66.67L43.01,66.67C46.97,66.67,50.66,64.69,52.86,61.4L59.06,52.11C61.01,49.19,64.29,47.43,67.8,47.43L100,47.37L99.34,40.13L63.45,35.78C57.49,35.06,51.59,37.51,47.9,42.24L40.85,51.28L27.86,51.28L35.03,42.52C36.86,40.28,39.23,38.54,41.91,37.46L47.44,35.26L39.03,35.26C32.12,35.26,25.52,38.11,20.8,43.15L2.63,62.5ZM55.13,64.74L97.37,58.55L100,50L69.81,50.57C67.42,50.61,65.17,51.74,63.71,53.64L55.13,64.74Z" fill-rule="evenodd"/></svg>', // 呼和浩特地铁官方徽标（去色、去 viewBox，坐标已归一化至 100×100）
            folder: "./city/hohhot",
            mainLogic: "./city/hohhot/hohhot.js",
            center: { x: 660, y: 490 },
            defaultScale: 1.0,
            mapSize: { width: 1400, height: 1040 },
            searchCity: "呼和浩特",
            title: "CGo OpenMap - 呼和浩特轨道交通线路图",
            keywords: "CGo OpenMap, 呼和浩特地铁, 呼和浩特轨道交通, 线路图",
            description: "包含运营中的 1、2 号线，共 43 座车站（新华广场为换乘站），站序与首末班车取自官方。",
            officialMapUrl: "https://hhhtmetro.com/hsdt/toXlzs",
            registerDate: "2026-10-04",
            status: "active",
            // 主理人虚位以待（写法与哈尔滨一致，详见本文件哈尔滨条目的说明）
            maintainers: [
                { name: "待认领", role: "城市主理人招募中", isRecruiting: true,
                  github: "https://github.com/NokiaimuL/CGo-OpenMap/blob/main/CONTRIBUTING.md" }
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
        const titleFull = document.querySelector('.title-full');
        if (titleFull && activeCityMeta.name) {
            titleFull.textContent = `${activeCityMeta.name} 开放地图`;
        }
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
                const meta = CITY_REGISTRY[cityId];
                if (meta) {
                    if (meta.title) document.title = meta.title;
                    const titleFull = document.querySelector('.title-full');
                    if (titleFull && meta.name) {
                        titleFull.textContent = `${meta.name} 开放地图`;
                    }
                }
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
