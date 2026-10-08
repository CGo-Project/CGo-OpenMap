/**
 * CGo OpenMap - PWA 渐进式离线缓存 Service Worker (sw.js)
 * 
 * ==============================================================================
 * 离线缓存与瓦片拦截策略说明 (PWA Service Worker Strategy)
 * ==============================================================================
 * 1. 静态资源预缓存 (Cache-First):
 *    - 安装时预拉取 HTML、CSS、核心 JS 引擎及当前城市基础数据包并缓存至 `CACHE_NAME`；
 *    - 体积大又按需可见的城市素材不进预缓存（如沈阳的站名题字图，67 张约 5.7 MB）：
 *      静态资源未命中缓存时会自动网络拉取并回填，等于「看过才下载、之后离线可用」；
 *    - 更新版本时修改 `CACHE_NAME` 版本号，激活时自动清理旧版本缓存。
 * 
 * 2. 高德切片网络缓存 (Stale-While-Revalidate / Cache-First for Tiles):
 *    - 拦截所有发往 `autonavi.com` 的地图瓦片请求，保存至 `map-tiles-cache`，加速二次浏览；
 *    - 该缓存与版本无关，更新 `CACHE_NAME` 时保留，不随发版清空。
 *
 * 3. 缓存范围：只处理 GET 请求；除地图瓦片外只缓存同源资源。
 *    POST（如 Drunk 直连大模型接口）与其他跨域请求（字体、第三方接口）一律不拦截，交给浏览器自行处理。
 * 
 * 移植与开发维护指南 (Developer & Porting Guide):
 * 1. 当制作了新城市（如 `shanghai`）或新增静态资源时，请在下方 `ASSETS_TO_CACHE` 中补充对应资源路径；
 * 2. ⚠️ 务必更新 Service Worker：修改任何业务数据或代码后，必须同步递增 `CACHE_NAME` 版本号，否则更改可能无法生效！
 *    若在调试开发过程中遇到“怎么修改代码都不起作用、刷新无反应”的情况，请务必优先排查是否是 Service Worker 强缓存导致。
 * ==============================================================================
 */

const CACHE_NAME = 'cgo-openmap-v261008.220000';
// 地图瓦片专用缓存：与静态资源版本无关，激活新版本时需保留
const TILE_CACHE_NAME = 'map-tiles-cache';
const ASSETS_TO_CACHE = [
    // 页面与入口
    './',
    './index.html',
    './main.html',
    './readme.html',
    './privacy.html',

    // 线路图在线编辑器 (city-editor)
    './city-editor/index.html',
    './city-editor/css/editor.css',
    './city-editor/js/editor.js',
    // 编辑器示例工程（sample/cityedit_sample.json）引用的线路徽标模板
    './assets/svg/icon@bh.svg',

    // Drunk 转换工作台与城市编辑模式 (drunk)
    // 注：drunk/tools/selfcheck.js 与 city/fuzhou/tools/fuzhou_check.js 是 Node 端自检脚本，
    //     浏览器不会请求，故不预缓存
    './drunk/index.html',
    './drunk/css/drunk.css',
    './drunk/js/drunk_logger.js',
    './drunk/js/drunk_sanitizer.js',
    './drunk/js/city_project_io.js',
    './drunk/js/city_knowledge_matcher.js',
    './drunk/js/pdf_vector_extractor.js',
    './drunk/js/deepseek_vision.js',
    './drunk/js/vision_detector.js',
    './drunk/js/ocr_align_solver.js',
    './drunk/js/topology_tracer.js',
    './drunk/js/openmap_codegen.js',
    './drunk/js/drunk_pipeline.js',

    // 样式表
    './css/style.css',
    './css/tool-style.css',
    './css/cgo_clr.css',
    './css/cgo_element.css',
    './css/cgo_ui.css',
    './css/cgo_components.css',

    // 核心通用 JS 库
    './core/cgo-ui.js',
    './core/tool-theme.js',
    './core/station-board.js',
    './core/script.js',
    './core/city-neighbors.js',
    './core/help.js',
    './core/path-geometry.js',
    './core/station-icons.js',
    './core/a11y.js',
    './core/settings.js',
    './core/notice.js',

    // 城市配置与业务数据 (示例：北京)
    './city/data.js',
    './city/beijing/beijing.js',
    './city/beijing/style.css',
    './city/beijing/modules/beijing_cultural.js',
    './city/beijing/stacard/script.js',
    './city/beijing/data_stations.js',
    './city/beijing/data_lines.js',
    './city/beijing/data_virtual_transfers.js',
    './city/beijing/data_scattered.js',
    './city/beijing/data_notopen.js',
    './city/beijing/data_legend.js',
    './city/beijing/data_timetable.js',
    './city/beijing/amap_data.json',
    './city/beijing/staname.csv',
    './city/beijing/assets/compass.svg',
    './city/beijing/assets/gate.svg',

    // 城市配置与业务数据 (示例：上海)
    './city/shanghai/shanghai.js',
    './city/shanghai/style.css',
    './city/shanghai/stacard/script.js',
    './city/shanghai/data_stations.js',
    './city/shanghai/data_lines.js',
    './city/shanghai/data_virtual_transfers.js',
    './city/shanghai/data_scattered.js',
    './city/shanghai/data_notopen.js',
    './city/shanghai/data_legend.js',
    './city/shanghai/data_timetable.js',
    './city/shanghai/data_urls.js',
    './city/shanghai/amap_data.json',
    './city/shanghai/staname.csv',
    './city/shanghai/assets/icon-railway.svg',
    './city/shanghai/assets/icon-airport.svg',
    './city/shanghai/assets/icon-maglev.svg',

    // 城市配置与业务数据 (沈阳)
    './city/shenyang/shenyang.js',
    './city/shenyang/modules/shenyang_map.js',
    './city/shenyang/modules/shenyang_station_board.js',
    './city/shenyang/modules/shenyang_station_title.js',
    './city/shenyang/modules/shenyang_cultural.js',
    './city/shenyang/modules/shenyang_service_info.js',
    './city/shenyang/modules/shenyang_calligraphy.js',
    './city/shenyang/modules/shenyang_facilities.js',
    './city/shenyang/modules/shenyang_exits.js',
    './city/shenyang/stacard/script.js',
    './city/shenyang/stacard/data.js',
    './city/shenyang/data_calligraphy.js',
    './city/shenyang/data_facilities.js',
    './city/shenyang/data_exits.js',
    './city/shenyang/data_stations.js',
    './city/shenyang/data_lines.js',
    './city/shenyang/data_virtual_transfers.js',
    './city/shenyang/data_scattered.js',
    './city/shenyang/data_notopen.js',
    './city/shenyang/data_opening.js',
    './city/shenyang/data_legend.js',
    './city/shenyang/data_timetable.js',
    './city/shenyang/shared/loop-direction.js',
    './city/shenyang/shared/timetable-renderer.js',
    './city/shenyang/shared/stacard-engine.js',
    './city/shenyang/shared/station-title.js',
    './city/shenyang/shared/viewport-inset.js',
    './city/shenyang/shared/tip-card.js',
    './city/shenyang/shared/label-active.js',
    './city/shenyang/shared/calligraphy.js',
    './city/shenyang/shared/calligraphy.css',
    './city/shenyang/shared/facilities.js',
    './city/shenyang/shared/facilities.css',
    './city/shenyang/shared/exit-vertical.js',
    './city/shenyang/shared/exits.js',
    './city/shenyang/shared/exits.css',
    './city/shenyang/shared/opening-schedule.js',
    './city/shenyang/shared/opening-schedule.css',
    // 行程规划（三城共用）：线路接续声明解析 / 数据构建器 / 规划内核 / 面板
    './city/shenyang/shared/line-link.js',
    './city/shenyang/shared/route-data.js',
    './city/shenyang/shared/route-planner.js',
    './city/shenyang/shared/route-panel.js',
    './city/shenyang/shared/route-panel.css',
    // 跨城市「查找最近车站」（三城共用）：接管核心 LBS 的 confirm，改用 cgo-modal 三选一
    './city/shenyang/shared/nearest-station.js',
    './city/shenyang/shared/nearest-station.css',
    // 固定侧栏「浮岛卡片」改造（三城共用）：几何跟随标题栏浮岛、卡片等距、标题栏线路标
    './city/shenyang/shared/sidebar-refit.js',
    './city/shenyang/shared/sidebar-refit.css',
    // 地图小工具（东北四市共用）：票价图 / 等时圈，入口在「查找最近车站」按钮下方
    './city/shenyang/shared/map-tools.js',
    './city/shenyang/shared/map-tools.css',
    './city/shenyang/amap_data.json',
    './city/shenyang/staname.csv',
    './city/shenyang/style.css',
    './city/shenyang/assets/airport.svg',
    './city/shenyang/assets/compass.svg',
    './city/shenyang/assets/fangcheng.svg',
    './city/shenyang/assets/fangcheng_mono.svg',
    './city/shenyang/assets/railway.svg',
    './city/shenyang/assets/transfer-badge.svg',
    './city/shenyang/assets/tram-5.svg',

    // ── 站名题字图（沈阳，67 张 / 合计约 5.7 MB）刻意「不」预缓存 ─────────────
    // 一次访问通常只会看到 1~2 个题字站，全量预拉等于让首访白白下载几 MB。
    // 静态资源的 fetch 策略本就是「精确命中缓存 → 未命中则网络拉取并回填」，
    // 故把它们从本清单移出即自动变成按需缓存：看过才下载，之后离线可用；
    // 某站没有题字图时模块会回退标准中英文标题，不影响可用性。
    // ⚠️ 替换题字图后仍须递增 CACHE_NAME：旧缓存靠版本号整体作废，
    //    而题字图的 URL 上没有 ?v= 可以穿透缓存。
    // 城市配置与业务数据 (合肥)
    './city/hefei/hefei.js',
    './city/hefei/modules/hefei_timetable.js',
    './city/hefei/modules/hefei_cultural.js',
    './city/hefei/stacard/script.js',
    './city/hefei/data_stations.js',
    './city/hefei/data_lines.js',
    './city/hefei/data_virtual_transfers.js',
    './city/hefei/data_scattered.js',
    './city/hefei/assets/railway.svg',
    './city/hefei/data_notopen.js',
    './city/hefei/data_legend.js',
    './city/hefei/data_timetable.js',
    './city/hefei/amap_data.json',
    './city/hefei/staname.csv',

    // 城市配置与业务数据 (悉尼)
    './city/sydney/sydney.js',
    './city/sydney/style.css',
    './city/sydney/stacard/script.js',
    './city/sydney/data_stations.js',
    './city/sydney/data_lines.js',
    './city/sydney/data_virtual_transfers.js',
    './city/sydney/data_scattered.js',
    './city/sydney/data_notopen.js',
    './city/sydney/data_legend.js',
    './city/sydney/data_timetable.js',
    './city/sydney/staname.csv',
    './city/sydney/assets/sydney_deco.svg',
    './city/sydney/assets/PublicSans-var-latin.woff2',
    './city/sydney/assets/line/T1.svg',
    './city/sydney/assets/line/T2.svg',
    './city/sydney/assets/line/T3.svg',
    './city/sydney/assets/line/T4.svg',
    './city/sydney/assets/line/T5.svg',
    './city/sydney/assets/line/T6.svg',
    './city/sydney/assets/line/T7.svg',
    './city/sydney/assets/line/T8.svg',
    './city/sydney/assets/line/T9.svg',
    './city/sydney/assets/line/M1.svg',
    './city/sydney/assets/line/CONV.svg',
    './city/sydney/assets/line/MW.svg',
    './city/sydney/assets/line/WSA.svg',

    // 城市配置与业务数据 (香港)
    './city/hongkong/hongkong.js',
    './city/hongkong/style.css',
    './city/hongkong/stacard/script.js',
    './city/hongkong/data_stations.js',
    './city/hongkong/data_lines.js',
    './city/hongkong/data_virtual_transfers.js',
    './city/hongkong/data_scattered.js',
    './city/hongkong/data_notopen.js',
    './city/hongkong/data_legend.js',
    './city/hongkong/data_timetable.js',
    './city/hongkong/staname.csv',
    './city/hongkong/data_fares.js',
    './city/hongkong/data_buses.js',
    './city/hongkong/assets/hongkong_deco.svg',
    './city/hongkong/assets/line/AEL.svg',
    './city/hongkong/assets/line/DRL.svg',
    './city/hongkong/assets/line/EAL.svg',
    './city/hongkong/assets/line/ISL.svg',
    './city/hongkong/assets/line/KTL.svg',
    './city/hongkong/assets/line/SIL.svg',
    './city/hongkong/assets/line/TKL.svg',
    './city/hongkong/assets/line/TWL.svg',
    './city/hongkong/assets/line/TML.svg',
    './city/hongkong/assets/line/TCL.svg',
    './city/hongkong/assets/line/LR.svg',
    './city/hongkong/assets/line/HSR.svg',

    // 城市配置与业务数据 (深圳)
    './city/shenzhen/shenzhen.js',
    './city/shenzhen/style.css',
    './city/shenzhen/stacard/script.js',
    './city/shenzhen/data_stations.js',
    './city/shenzhen/data_lines.js',
    './city/shenzhen/data_virtual_transfers.js',
    './city/shenzhen/data_scattered.js',
    './city/shenzhen/data_notopen.js',
    './city/shenzhen/data_legend.js',
    './city/shenzhen/data_timetable.js',
    './city/shenzhen/assets/shenzhen_deco.svg',
    './city/shenzhen/assets/line/L6B.svg',
    './city/shenzhen/amap_data.json',

    // 城市配置与业务数据 (青岛)
    './city/qingdao/qingdao.js',
    './city/qingdao/style.css',
    './city/qingdao/stacard/script.js',
    './city/qingdao/data_stations.js',
    './city/qingdao/data_lines.js',
    './city/qingdao/data_virtual_transfers.js',
    './city/qingdao/data_scattered.js',
    './city/qingdao/data_notopen.js',
    './city/qingdao/data_legend.js',
    './city/qingdao/data_timetable.js',
    './city/qingdao/data_station_names.js',
    './city/qingdao/data_construction.js',
    './city/qingdao/modules/qingdao_station_name_history.js',
    './city/qingdao/modules/qingdao_travel_guide.js',
    './city/qingdao/modules/qingdao_engineering_name_notice.js',
    './city/qingdao/modules/qingdao_timetable.js',
    './city/qingdao/modules/qingdao_construction.js',
    './city/qingdao/modules/qingdao_line_badges.js',
    './city/qingdao/amap_data.json',
    './city/qingdao/staname.csv',
    './city/qingdao/assets/qingdao_sea.svg',
    './city/qingdao/assets/compass.svg',
    './city/qingdao/assets/Aircraft.svg',
    './city/qingdao/assets/China_Railway.svg',
    './city/qingdao/assets/Long_Distance_Bus.svg',
    './city/qingdao/assets/Ship.svg',
    './city/qingdao/assets/Streetcar.svg',

    // 城市配置与业务数据 (大连)
    './city/dalian/dalian.js',
    './city/dalian/modules/dalian_map.js',
    './city/dalian/modules/dalian_sea.js',
    './city/dalian/modules/dalian_timetable.js',
    './city/dalian/modules/dalian_transfers.js',
    './city/dalian/modules/dalian_station_title.js',
    './city/dalian/modules/dalian_facilities.js',
    './city/dalian/modules/dalian_exits.js',
    './city/dalian/stacard/script.js',
    './city/dalian/data_stations.js',
    './city/dalian/data_lines.js',
    './city/dalian/data_virtual_transfers.js',
    './city/dalian/data_scattered.js',
    './city/dalian/data_notopen.js',
    './city/dalian/data_opening.js',
    './city/dalian/data_legend.js',
    './city/dalian/data_timetable.js',
    './city/dalian/data_facilities.js',
    './city/dalian/data_exits.js',
    './city/dalian/amap_data.json',
    './city/dalian/assets/compass.svg',
    './city/dalian/assets/dalian_sea.svg',
    './city/dalian/assets/tram-201-interval.svg',
    './city/dalian/assets/tram-201.svg',
    './city/dalian/assets/tram-202.svg',

    // 城市配置与业务数据 (长春)
    './city/changchun/changchun.js',
    './city/changchun/modules/changchun_service_info.js',
    './city/changchun/modules/changchun_station_title.js',
    './city/changchun/modules/changchun_facilities.js',
    './city/changchun/modules/changchun_exits.js',
    './city/changchun/stacard/script.js',
    './city/changchun/data_stations.js',
    './city/changchun/data_lines.js',
    './city/changchun/data_virtual_transfers.js',
    './city/changchun/data_scattered.js',
    './city/changchun/data_notopen.js',
    './city/changchun/data_opening.js',
    './city/changchun/data_legend.js',
    './city/changchun/data_timetable.js',
    './city/changchun/data_facilities.js',
    './city/changchun/data_exits.js',
    './city/changchun/staname.csv',
    './city/changchun/amap_data.json',
    './city/changchun/assets/ccgj.svg',
    './city/changchun/assets/railway.svg',
    './city/changchun/assets/transfer-badge.svg',
    './city/changchun/assets/tram-54.svg',
    './city/changchun/assets/tram-55.svg',

    // 城市配置与业务数据 (福州)
    './city/fuzhou/fuzhou.js',
    './city/fuzhou/modules/fuzhou_timetable.js',
    './city/fuzhou/modules/fuzhou_site_space.js',
    './city/fuzhou/modules/fuzhou_cultural.js',
    './city/fuzhou/stacard/script.js',
    './city/fuzhou/data_stations.js',
    './city/fuzhou/data_lines.js',
    './city/fuzhou/data_virtual_transfers.js',
    './city/fuzhou/data_scattered.js',
    './city/fuzhou/data_notopen.js',
    './city/fuzhou/data_legend.js',
    './city/fuzhou/data_timetable.js',
    './city/fuzhou/data_site_space.js',
    // 官方站间票价表（官网「票价线路查询」接口抓取，10302 组）
    './city/fuzhou/data_official_fare.js',
    // 文旅景点名录（含建库时算好的最近车站与直线距离）
    './city/fuzhou/data_attractions.js',
    './city/fuzhou/staname.csv',
    './city/fuzhou/amap_data.json',
    './city/fuzhou/assets/fuzhou_sea.svg',
    // 水域层的枢纽徽标（国铁车站 / 机场）：官方线路图图例的图标
    './city/fuzhou/assets/fuzhou_railway.svg',
    './city/fuzhou/assets/fuzhou_airport.svg',

    // 青岛线路徽标（核心统一从根目录 assets/svg/ 读取）
    './assets/svg/icon@01.svg',
    './assets/svg/icon@02.svg',
    './assets/svg/icon@03.svg',
    './assets/svg/icon@04.svg',
    './assets/svg/icon@05.svg',
    './assets/svg/icon@06.svg',
    './assets/svg/icon@07.svg',
    './assets/svg/icon@08.svg',
    './assets/svg/icon@09.svg',
    './assets/svg/icon@15.svg',
    './assets/svg/icon@lg.svg',
    './assets/svg/icon@xha.svg',

    // 城市配置与业务数据 (兰州)
    './city/lanzhou/lanzhou.js',
    './city/lanzhou/style.css',
    './city/lanzhou/stacard/script.js',
    './city/lanzhou/data_stations.js',
    './city/lanzhou/data_lines.js',
    './city/lanzhou/data_virtual_transfers.js',
    './city/lanzhou/data_scattered.js',
    './city/lanzhou/data_notopen.js',
    './city/lanzhou/data_legend.js',
    './city/lanzhou/data_timetable.js',
    './city/lanzhou/data_station_names.js',
    './city/lanzhou/modules/lanzhou_station_names.js',
    './city/lanzhou/modules/lanzhou_timetable.js',
    './city/lanzhou/modules/lanzhou_travel_guide.js',
    './city/lanzhou/modules/lanzhou_operation_status.js',
    './city/lanzhou/modules/lanzhou_fare_table.js',
    './city/lanzhou/staname.csv',
    './city/lanzhou/amap_data.json',
    './city/lanzhou/assets/lanzhou_river.svg',
    './city/lanzhou/assets/pricetable.jpg',

    // 城市配置与业务数据 (哈尔滨)
    './city/harbin/harbin.js',
    './city/harbin/modules/harbin_map.js',
    './city/harbin/modules/harbin_station_title.js',
    './city/harbin/modules/harbin_exits.js',
    './city/harbin/stacard/script.js',
    './city/harbin/data_stations.js',
    './city/harbin/data_lines.js',
    './city/harbin/data_virtual_transfers.js',
    './city/harbin/data_scattered.js',
    './city/harbin/data_legend.js',
    './city/harbin/data_timetable.js',
    './city/harbin/data_exits.js',
    './city/harbin/data_notopen.js',
    './city/harbin/staname.csv',
    './city/harbin/amap_data.json',
    './city/harbin/assets/songhuajiang.svg',

    // 城市配置与业务数据 (呼和浩特)
    './city/hohhot/hohhot.js',
    './city/hohhot/style.css',
    './city/hohhot/modules/hohhot_mongolian.js',
    './city/hohhot/modules/hohhot_station_board.js',
    './city/hohhot/modules/hohhot_timetable.js',
    './city/hohhot/modules/hohhot_facilities.js',
    './city/hohhot/stacard/script.js',
    './city/hohhot/data_stations.js',
    './city/hohhot/data_lines.js',
    './city/hohhot/data_virtual_transfers.js',
    './city/hohhot/data_scattered.js',
    './city/hohhot/data_legend.js',
    './city/hohhot/data_timetable.js',
    './city/hohhot/data_notopen.js',
    './city/hohhot/data_facilities.js',
    './city/hohhot/staname.csv',
    './city/hohhot/amap_data.json',
    // 呼和浩特线路徽标（微圆角方标 + 中文/蒙文/英文三行）
    './city/hohhot/assets/line-1.svg',
    './city/hohhot/assets/line-2.svg',

    // 福州线路徽标
    './assets/svg/icon@fz_BE.svg',

    // 城市配置与业务数据 (石家庄)
    './city/shijiazhuang/shijiazhuang.js',
    './city/shijiazhuang/data_stations.js',
    './city/shijiazhuang/data_lines.js',
    './city/shijiazhuang/data_legend.js',
    './city/shijiazhuang/data_notopen.js',
    './city/shijiazhuang/data_timetable.js',
    './city/shijiazhuang/data_virtual_transfers.js',
    './city/shijiazhuang/data_scattered.js',
    './city/shijiazhuang/staname.csv',
    './city/shijiazhuang/modules/shijiazhuang_cultural.js',
    './city/shijiazhuang/stacard/script.js',
    './city/shijiazhuang/style.css',
    
    // 图标与清单素材
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/mapicon.png',
    './assets/icons/mapicon2.png',
    './assets/icons/beian.png',
    './assets/icons/cgowx.png',
    './assets/icons/favicon.ico',
    './assets/images/qq.png',
    './manifest.json',
];

/**
 * 预缓存并发上限。
 * 清单有 400+ 条（13 座城市的全部资源），一次全甩出去会让静态服务器（本地 `npx serve` 尤其明显）
 * 瞬时堆积几百个文件流，部分请求被浏览器取消后句柄回收不及，直接 EMFILE 打穿服务
 * （2026-10-04 实测：服务端 `Error: EMFILE ... open 'city/hohhot/data_stations.js'` 崩退出，
 *  预缓存随之中断，已 bump 的新资源整批取不到，控制台只留 net::ERR_FAILED）。
 * 故按批推进：批内并行、批间串行并留间隔，瞬时压力从 400+ 降到 4。
 */
const PRECACHE_BATCH_SIZE = 4;
/**
 * 批间隔（ms）：让静态服务来得及回收上一批的文件句柄。
 * 400+ 条清单按 4 条一批推进约需 100 批，即使每批等 60ms 也只多花 6 秒左右，
 * 而预缓存在后台进行、不阻塞页面，这点代价换的是本地服务不再被打崩。
 */
const PRECACHE_BATCH_GAP_MS = 60;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function precacheAll(cache) {
    for (let i = 0; i < ASSETS_TO_CACHE.length; i += PRECACHE_BATCH_SIZE) {
        const batch = ASSETS_TO_CACHE.slice(i, i + PRECACHE_BATCH_SIZE);
        // 容错口径不变：单个非核心文件失败只告警、不阻断 SW 激活
        await Promise.allSettled(batch.map(async (url) => {
            try {
                await cache.add(url);
            } catch (err) {
                console.warn('[SW] 预缓存单项跳过:', url, err);
            }
        }));
        await sleep(PRECACHE_BATCH_GAP_MS);
    }
}

// 1. Service Worker 安装：预缓存核心资产（分批推进，单个非核心文件失败不阻断 SW 激活）
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => precacheAll(cache))
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] 缓存安装异常:', err))
    );
});

// 2. Service Worker 激活：清理陈旧缓存并立即接管页面
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME && k !== TILE_CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// 3. 网络请求拦截与缓存调度
self.addEventListener('fetch', (event) => {
    const { url } = event.request;
    if (!url.startsWith('http')) return;
    // 只缓存 GET：Cache API 不接受其他方法，POST 等请求直接放行
    if (event.request.method !== 'GET') return;

    // 地图切片瓦片拦截与专用缓存
    if (url.includes('autonavi.com') || url.includes('cartocdn.com')) {
        event.respondWith((async () => {
            const cache = await caches.open(TILE_CACHE_NAME);
            const cached = await cache.match(event.request);
            if (cached) return cached;
            const res = await fetch(event.request);
            // 只缓存成功的响应；<img> 跨域加载得到的不透明响应读不到状态码，按原有行为照常缓存
            if (res && (res.ok || res.type === 'opaque')) {
                cache.put(event.request, res.clone()).catch(() => { });
            }
            return res;
        })());
        return;
    }

    // 其余跨域请求（字体样式表、第三方接口等）不拦截、不缓存，避免被永久缓存优先
    if (new URL(url).origin !== self.location.origin) return;

    // 页面导航请求（HTML 页面）：网络优先策略 (Network-First)
    // 确保代码更新后刷新浏览器永远呈现最新页面与样式；离线时优雅降级回退至缓存
    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
        event.respondWith((async () => {
            try {
                const networkRes = await fetch(event.request);
                if (networkRes && networkRes.status === 200) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkRes.clone());
                }
                return networkRes;
            } catch (err) {
                const cached = await caches.match(event.request, { ignoreSearch: true });
                if (cached) return cached;
                return caches.match('./index.html');
            }
        })());
        return;
    }

    // 静态资源（CSS/JS/图片等）：精准匹配优先 -> 网络获取并更新缓存 -> 离线模糊回退
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);

        // 优先精确匹配（如果版本号 query 完全一致且已缓存）
        const exactMatch = await cache.match(event.request);
        if (exactMatch) return exactMatch;

        // 精确未命中（例如资源刚升级了 ?v= 版本号）：网络优先拉取最新版本并写入缓存
        try {
            const networkRes = await fetch(event.request);
            if (networkRes && networkRes.status === 200) {
                cache.put(event.request, networkRes.clone());
            }
            return networkRes;
        } catch (err) {
            // 离线环境：模糊匹配回退
            const fuzzyMatch = await cache.match(event.request, { ignoreSearch: true });
            if (fuzzyMatch) return fuzzyMatch;
            // 缓存与网络都没有：把错误抛出去（等价于不拦截），**不要**落到隐式 `return undefined`
            // —— 那样 respondWith 会收到 undefined，浏览器统一报 net::ERR_FAILED，
            // 控制台只留一条「取不到文件」的错，看不出是 SW 兜底兜空了。
            // 2026-10-04 本地实测：静态服务被 EMFILE 打崩时 line-1.svg 与 amap_data.json
            // 正是走的这条路径，徽标与坐标索引因此双双失效。
            throw err;
        }
    })());
});
