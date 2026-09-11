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

const CACHE_NAME = 'cgo-openmap-v260908.211000';
const ASSETS_TO_CACHE = [
    // 页面与入口
    './',
    './index.html',
    './main.html',
    './readme.html',
    './privacy.html',

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

    // 城市配置与业务数据 (沈阳)
    './city/shenyang/shenyang.js',
    './city/shenyang/stacard/script.js',
    './city/shenyang/data_stations.js',
    './city/shenyang/data_lines.js',
    './city/shenyang/data_virtual_transfers.js',
    './city/shenyang/data_scattered.js',
    './city/shenyang/data_notopen.js',
    './city/shenyang/data_legend.js',
    './city/shenyang/data_timetable.js',
    './city/shenyang/amap_data.json',
    './city/shenyang/staname.csv',
    './city/shenyang/style.css',
    './city/shenyang/assets/airport.svg',
    './city/shenyang/assets/fangcheng.svg',
    './city/shenyang/assets/railway.svg',

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

    // 图标与清单素材
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/location.png',
    './assets/icons/search.png',
    './assets/icons/mapicon.png',
    './assets/icons/mapicon2.png',
    './assets/icons/beian.png',
    './assets/icons/cgowx.png',
    './assets/icons/favicon.ico',
    './manifest.json',
];

// 1. Service Worker 安装：预缓存核心资产
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] 缓存失败:', err))
    );
});

// 2. Service Worker 激活：清理陈旧缓存
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

    // 默认静态资产：优先读取缓存，离线时优雅回退
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(cached => cached || fetch(event.request).catch(() => {}))
    );
});
