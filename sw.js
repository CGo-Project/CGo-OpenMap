/**
 * CGo OpenMap - PWA 渐进式离线缓存 Service Worker (sw.js)
 * 
 * ==============================================================================
 * 离线缓存与瓦片拦截策略说明 (PWA Service Worker Strategy)
 * ==============================================================================
 * 1. 静态资源预缓存 (Cache-First):
 *    - 安装时预拉取 HTML、CSS、核心 JS 引擎及当前城市基础数据包并缓存至 `CACHE_NAME`；
 *    - 更新版本时修改 `CACHE_NAME` 版本号，激活时自动清理旧版本缓存。
 * 
 * 2. 高德切片网络缓存 (Stale-While-Revalidate / Cache-First for Tiles):
 *    - 拦截所有发往 `autonavi.com` 的地图瓦片请求，保存至 `map-tiles-cache`，加速二次浏览。
 * 
 * 移植与开发维护指南 (Developer & Porting Guide):
 * 1. 当制作了新城市（如 `shanghai`）或新增静态资源时，请在下方 `ASSETS_TO_CACHE` 中补充对应资源路径；
 * 2. ⚠️ 务必更新 Service Worker：修改任何业务数据或代码后，必须同步递增 `CACHE_NAME` 版本号，否则更改可能无法生效！
 *    若在调试开发过程中遇到“怎么修改代码都不起作用、刷新无反应”的情况，请务必优先排查是否是 Service Worker 强缓存导致。
 * ==============================================================================
 */

const CACHE_NAME = 'cgo-openmap-v260926.1650';
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
    // 注：drunk/tools/selfcheck.js 是 Node 端自检脚本，浏览器不会请求，故不预缓存
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
    './core/help.js',
    './core/path-geometry.js',
    './core/station-icons.js',
    './core/settings.js',
    './core/notice.js',

    // 城市配置与业务数据 (示例：北京)
    './city/data.js',
    './city/beijing/beijing.js',
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
    './city/shenyang/stacard/script.js',
    './city/shenyang/stacard/data.js',
    './city/shenyang/data_calligraphy.js',
    './city/shenyang/data_stations.js',
    './city/shenyang/data_lines.js',
    './city/shenyang/data_virtual_transfers.js',
    './city/shenyang/data_scattered.js',
    './city/shenyang/data_notopen.js',
    './city/shenyang/data_opening.js',
    './city/shenyang/data_legend.js',
    './city/shenyang/data_timetable.js',
    './city/shenyang/shared/timetable-renderer.js',
    './city/shenyang/shared/stacard-engine.js',
    './city/shenyang/shared/station-title.js',
    './city/shenyang/shared/tip-card.js',
    './city/shenyang/shared/calligraphy.js',
    './city/shenyang/shared/calligraphy.css',
    './city/shenyang/shared/opening-schedule.js',
    './city/shenyang/shared/opening-schedule.css',
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

    // 1号线主线站名题字（书法家题写）
    './city/shenyang/assets/calligraphy/qihaojie.png',
    './city/shenyang/assets/calligraphy/sihaojie.png',
    './city/shenyang/assets/calligraphy/shenyangzhan.png',
    './city/shenyang/assets/calligraphy/taiyuanjie.png',
    './city/shenyang/assets/calligraphy/yunfengbeijie.png',
    './city/shenyang/assets/calligraphy/zhongjie.png',
    './city/shenyang/assets/calligraphy/dongzhongjie.png',
    './city/shenyang/assets/calligraphy/pangjiangjie.png',
    './city/shenyang/assets/calligraphy/limingguangchang.png',

    // 1号线东延段站名题字（辽宁 / 沈阳书法界名家题写）
    './city/shenyang/assets/calligraphy/xinhuijie.png',
    './city/shenyang/assets/calligraphy/xinningjie.png',
    './city/shenyang/assets/calligraphy/dongdayingjie.png',
    './city/shenyang/assets/calligraphy/nongyedaxue.png',
    './city/shenyang/assets/calligraphy/qianling.png',
    './city/shenyang/assets/calligraphy/donglinggongyuan.png',
    './city/shenyang/assets/calligraphy/shuiquan.png',
    './city/shenyang/assets/calligraphy/boguanbeidajie.png',
    './city/shenyang/assets/calligraphy/zhiwuyuan.png',
    './city/shenyang/assets/calligraphy/shuangma.png',

    // 2号线站名题字（作家 / 诗人题写，逐站实拍采集中）
    './city/shenyang/assets/calligraphy/aotizhongxin.png',
    './city/shenyang/assets/calligraphy/gongyezhanlanguan.png',
    './city/shenyang/assets/calligraphy/hangkonghangtiandaxue.png',
    './city/shenyang/assets/calligraphy/jinrongzhongxin.png',
    './city/shenyang/assets/calligraphy/qingniangongyuan.png',
    './city/shenyang/assets/calligraphy/quanyunlu.png',
    './city/shenyang/assets/calligraphy/renminguangchang.png',
    './city/shenyang/assets/calligraphy/shenyangbeizhan.png',
    './city/shenyang/assets/calligraphy/shijidasha.png',
    './city/shenyang/assets/calligraphy/shitushuguan.png',
    './city/shenyang/assets/calligraphy/wulihe.png',
    './city/shenyang/assets/calligraphy/zhongyiyaodaxue.png',

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

    // 城市配置与业务数据 (青岛)
    './city/qingdao/qingdao.js',
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
    './city/qingdao/modules/qingdao_engineering_name_notice.js',
    './city/qingdao/modules/qingdao_timetable.js',
    './city/qingdao/modules/qingdao_construction.js',
    './city/qingdao/amap_data.json',
    './city/qingdao/staname.csv',
    './city/qingdao/assets/qingdao_sea.svg',
    './city/qingdao/assets/Aircraft.svg',
    './city/qingdao/assets/China_Railway.svg',
    './city/qingdao/assets/Long_Distance_Bus.svg',
    './city/qingdao/assets/Ship.svg',
    './city/qingdao/assets/Streetcar.svg',

    // 城市配置与业务数据 (大连)
    './city/dalian/dalian.js',
    './city/dalian/modules/dalian_map.js',
    './city/dalian/modules/dalian_timetable.js',
    './city/dalian/modules/dalian_transfers.js',
    './city/dalian/modules/dalian_station_title.js',
    './city/dalian/stacard/script.js',
    './city/dalian/data_stations.js',
    './city/dalian/data_lines.js',
    './city/dalian/data_virtual_transfers.js',
    './city/dalian/data_scattered.js',
    './city/dalian/data_notopen.js',
    './city/dalian/data_opening.js',
    './city/dalian/data_legend.js',
    './city/dalian/data_timetable.js',
    './city/dalian/amap_data.json',
    './city/dalian/assets/airport.svg',
    './city/dalian/assets/compass.svg',
    './city/dalian/assets/dalian_sea.svg',
    './city/dalian/assets/railway.svg',
    './city/dalian/assets/tram-201-interval.svg',
    './city/dalian/assets/tram-201.svg',
    './city/dalian/assets/tram-202.svg',

    // 城市配置与业务数据 (长春)
    './city/changchun/changchun.js',
    './city/changchun/modules/changchun_service_info.js',
    './city/changchun/modules/changchun_station_title.js',
    './city/changchun/stacard/script.js',
    './city/changchun/data_stations.js',
    './city/changchun/data_lines.js',
    './city/changchun/data_virtual_transfers.js',
    './city/changchun/data_scattered.js',
    './city/changchun/data_notopen.js',
    './city/changchun/data_opening.js',
    './city/changchun/data_legend.js',
    './city/changchun/data_timetable.js',
    './city/changchun/amap_data.json',
    './city/changchun/assets/railway.svg',
    './city/changchun/assets/transfer-badge.svg',
    './city/changchun/assets/tram-54.svg',
    './city/changchun/assets/tram-55.svg',

    // 城市配置与业务数据 (福州)
    './city/fuzhou/fuzhou.js',
    './city/fuzhou/modules/fuzhou_timetable.js',
    './city/fuzhou/modules/fuzhou_cultural.js',
    './city/fuzhou/stacard/script.js',
    './city/fuzhou/data_stations.js',
    './city/fuzhou/data_lines.js',
    './city/fuzhou/data_virtual_transfers.js',
    './city/fuzhou/data_scattered.js',
    './city/fuzhou/data_notopen.js',
    './city/fuzhou/data_legend.js',
    './city/fuzhou/data_timetable.js',
    './city/fuzhou/staname.csv',
    './city/fuzhou/assets/fuzhou_sea.svg',

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

    // 福州线路徽标
    './assets/svg/icon@fz_BE.svg',

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

// 1. Service Worker 安装：预缓存核心资产（容错机制：单个非核心文件失败不阻断 SW 激活）
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                await Promise.allSettled(
                    ASSETS_TO_CACHE.map(async (url) => {
                        try {
                            await cache.add(url);
                        } catch (err) {
                            console.warn('[SW] 预缓存单项跳过:', url, err);
                        }
                    })
                );
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] 缓存安装异常:', err))
    );
});

// 2. Service Worker 激活：清理陈旧缓存并立即接管页面
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// 3. 网络请求拦截与缓存调度
self.addEventListener('fetch', (event) => {
    const { url } = event.request;
    if (!url.startsWith('http')) return;

    // 地图切片瓦片拦截与专用缓存
    if (url.includes('autonavi.com') || url.includes('cartocdn.com')) {
        event.respondWith((async () => {
            const cache = await caches.open('map-tiles-cache');
            const cached = await cache.match(event.request);
            if (cached) return cached;
            const res = await fetch(event.request);
            cache.put(event.request, res.clone());
            return res;
        })());
        return;
    }

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
        }
    })());
});
