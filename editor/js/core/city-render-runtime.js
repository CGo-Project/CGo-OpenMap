/**
 * 开放地图编辑器 (OpenMap Editor) - 城市渲染运行时 (editor/js/core/city-render-runtime.js)
 *
 * 让编辑器画布和线路图 main.html「长得一模一样」的关键一层。
 *
 * 线路图的城市外观并不只由 core/ 决定：上海的站点是线路色短横 + 换乘胶囊、
 * 悉尼是逐站官方图元 + 45° 斜排英文站名、香港 / 深圳按官方墨迹框逐行贴合站名……
 * 这些全部写在各城市的 `city/{id}/{id}.js`（renderStationIcon 等钩子）与
 * `city/{id}/style.css` 里。编辑器如果只用 core 的通用模板，画出来的就是另一张图。
 *
 * 本模块把城市主逻辑脚本「借」进编辑器，但只取它的渲染能力：
 *   1. 在隔离的沙箱里执行城市脚本：document / window 都换成代理——
 *      样式表照常注入（并把 ./city/… 改写成编辑器视角的 ../city/…），
 *      <script> 注入、document.write、对 main.html 图层 id 的查询一律落空，
 *      城市脚本为线路图页面安装的观察器、开场动画、信息板模块因此全部不会生效；
 *   2. 城市脚本加到 <html> 上的 map-{city} 等类名被记录下来，切换城市时整体撤下 / 恢复，
 *      城市样式表同理（disabled 开关），多座城市之间互不串味；
 *   3. 对外暴露统一的渲染契约，由车站层调用：
 *        renderStationIcon(station, id)          → 与引擎同一个钩子
 *        decorateStationLabel(el, station, id)   → 城市对站名标签的二次排版（可选）
 *        getStationUnderlays(stations)           → 压在线路之上、车站之下的底衬（可选）
 *        prepareRender()                         → 字体等异步资源就绪（可选，返回 Promise）
 *
 * 城市钩子里读的全局 stationsData / linesData 由本模块在每次渲染前就地刷新，
 * 沙箱拿到的始终是编辑器当前工程的数据。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.CityRenderRuntime = (function () {
    'use strict';

    /** 城市脚本里共享的可变数据：引用不变、内容在每次渲染前就地刷新 */
    var shared = {
        stationsData: {},
        linesData: []
    };

    /** cityId → 运行记录 { id, status, city, classes:Set, links:[], ready:Promise, error } */
    var records = {};
    var activeId = null;
    var listeners = [];

    /** 不应被搬到编辑器里的根类名（开场动画会把图层整体隐藏 5 秒） */
    var ROOT_CLASS_DENY = /intro/;

    // ==========================================================================
    // 一、路径改写：城市脚本按站点根目录书写相对路径，编辑器位于 /editor/ 子目录
    // ==========================================================================
    function rewriteUrl(url) {
        if (typeof url !== 'string') return url;
        if (/^\.\/(city|core|assets|css)\//.test(url)) return '../' + url.slice(2);
        if (/^(city|core|assets|css)\//.test(url)) return '../' + url;
        return url;
    }

    function resolveFolder(meta, cityId) {
        var raw = (meta && meta.folder) || ('./city/' + cityId);
        return raw.replace(/^\.\//, '../').replace(/\/+$/, '');
    }

    function findMeta(cityId) {
        var io = window.OpenMapEditor.CityProjectIO || window.CityProjectIO;
        if (io && typeof io.listCities === 'function') {
            var list = io.listCities() || [];
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].id === cityId) return list[i];
            }
        }
        return (window.CITY_REGISTRY && window.CITY_REGISTRY[cityId]) || null;
    }

    // ==========================================================================
    // 二、沙箱：document / window 代理
    // ==========================================================================
    function bindCache(target) {
        var cache = new Map();
        return function (fn) {
            if (typeof fn !== 'function') return fn;
            if (!cache.has(fn)) cache.set(fn, fn.bind(target));
            return cache.get(fn);
        };
    }

    function createSandbox(rec) {
        var realDoc = document;
        var realRoot = document.documentElement;
        var detachedBody = realDoc.createElement('div');
        var bindDoc = bindCache(realDoc);
        var bindWin = bindCache(window);

        function adoptNode(el) {
            if (!el || !el.tagName) return el;
            var tag = el.tagName.toUpperCase();
            if (tag === 'LINK') {
                var href = el.getAttribute('href');
                if (href) el.setAttribute('href', rewriteUrl(href));
                el.setAttribute('data-editor-city', rec.id);
                if (rec.id !== activeId) el.disabled = true;
                realDoc.head.appendChild(el);
                rec.links.push(el);
                return el;
            }
            if (tag === 'STYLE') {
                // 内联样式里的 url("./city/…") 同样是站点根目录视角
                var fixCss = function () {
                    var css = el.textContent || '';
                    var fixed = css.replace(/url\((['"]?)\.\/(city|assets|core|css)\//g, 'url($1../$2/');
                    if (fixed !== css) el.textContent = fixed;
                };
                fixCss();
                Promise.resolve().then(fixCss);
                el.setAttribute('data-editor-city', rec.id);
                if (rec.id !== activeId) el.disabled = true;
                realDoc.head.appendChild(el);
                rec.links.push(el);
                return el;
            }
            // <script>、<meta> 等页面级注入在编辑器里一律不执行：
            // 城市的信息板模块、开场动画、导航外链都只属于线路图页面。
            return el;
        }

        var headFacade = {
            appendChild: adoptNode,
            insertBefore: function (el) { return adoptNode(el); },
            append: function () { Array.prototype.forEach.call(arguments, adoptNode); },
            prepend: function () { Array.prototype.forEach.call(arguments, adoptNode); },
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; }
        };

        var classListFacade = {
            add: function () {
                Array.prototype.forEach.call(arguments, function (c) {
                    if (!c || ROOT_CLASS_DENY.test(c)) return;
                    rec.classes.add(c);
                    if (rec.id === activeId) realRoot.classList.add(c);
                });
            },
            remove: function () {
                Array.prototype.forEach.call(arguments, function (c) {
                    if (!rec.classes.has(c)) return;
                    rec.classes.delete(c);
                    if (rec.id === activeId) realRoot.classList.remove(c);
                });
            },
            toggle: function (c, force) {
                var on = (force === undefined) ? !rec.classes.has(c) : !!force;
                if (on) classListFacade.add(c); else classListFacade.remove(c);
                return on;
            },
            contains: function (c) { return rec.classes.has(c) || realRoot.classList.contains(c); }
        };

        var rootFacade = {
            classList: classListFacade,
            style: { setProperty: function () { }, removeProperty: function () { }, getPropertyValue: function () { return ''; } },
            dataset: {},
            lang: realRoot.lang,
            getAttribute: function (n) { return realRoot.getAttribute(n); },
            hasAttribute: function (n) { return realRoot.hasAttribute(n); },
            setAttribute: function () { },
            removeAttribute: function () { },
            querySelector: function () { return null; },
            querySelectorAll: function () { return []; },
            appendChild: function (el) { return el; },
            addEventListener: function () { },
            removeEventListener: function () { }
        };

        var NOOP = function () { };
        var docProxy = new Proxy(realDoc, {
            get: function (target, prop) {
                switch (prop) {
                    case 'head': return headFacade;
                    case 'body': return detachedBody;
                    case 'documentElement': return rootFacade;
                    case 'readyState': return 'complete';
                    case 'write':
                    case 'writeln':
                    case 'addEventListener':
                    case 'removeEventListener':
                        return NOOP;
                    case 'getElementById':
                    case 'querySelector':
                        return function () { return null; };
                    case 'querySelectorAll':
                    case 'getElementsByClassName':
                    case 'getElementsByTagName':
                        return function () { return []; };
                    default: {
                        var v = Reflect.get(target, prop, target);
                        return bindDoc(v);
                    }
                }
            },
            set: function () { return true; }
        });

        // window 代理：城市脚本写到 window 上的全局（XX_CITY、CURRENT_CITY…）落在本沙箱的覆盖层里，
        // 不污染编辑器自身的全局环境
        var overlay = Object.create(null);
        var cityDataManagerStub = {
            registerCity: function (cfg) {
                if (cfg && cfg.id) rec.registered = cfg;
                return true;
            },
            getCurrentCity: function () { return findMeta(rec.id); },
            getCurrentCityId: function () { return rec.id; },
            getAllCities: function () {
                var real = window.CityDataManager;
                return (real && typeof real.getAllCities === 'function') ? real.getAllCities() : [];
            },
            getCity: function (id) { return findMeta(id); }
        };
        var winProxy = new Proxy(window, {
            get: function (target, prop) {
                if (prop === 'document') return docProxy;
                if (prop === 'window' || prop === 'self' || prop === 'globalThis') return winProxy;
                if (prop === 'CityDataManager') return cityDataManagerStub;
                if (prop === 'stationsData') return shared.stationsData;
                if (prop === 'linesData') return shared.linesData;
                if (prop === 'processedStations') return shared.stationsData;
                if (prop === 'addEventListener' || prop === 'removeEventListener') return NOOP;
                if (prop === 'fetch') return sandboxFetch;
                if (prop === 'MutationObserver') return SandboxMutationObserver;
                if (prop in overlay) return overlay[prop];
                return bindWin(Reflect.get(target, prop, target));
            },
            set: function (target, prop, value) {
                overlay[prop] = value;
                return true;
            },
            has: function (target, prop) {
                return (prop in overlay) || (prop in target);
            }
        });

        // 城市脚本给线路图页面装的观察器：盯的往往是被代理掉的 documentElement / body，
        // 传进来的不是真实节点时直接忽略，避免 observe() 抛 TypeError 中断整份脚本
        var RealMO = window.MutationObserver;
        function SandboxMutationObserver(cb) {
            var mo = new RealMO(cb);
            return {
                observe: function (target, opts) {
                    if (target instanceof Node && target !== detachedBody) mo.observe(target, opts);
                },
                disconnect: function () { mo.disconnect(); },
                takeRecords: function () { return mo.takeRecords(); }
            };
        }

        function sandboxFetch(input, init) {
            var url = (typeof input === 'string') ? rewriteUrl(input) : input;
            return window.fetch(url, init);
        }

        return { window: winProxy, document: docProxy, fetch: sandboxFetch, MutationObserver: SandboxMutationObserver, overlay: overlay };
    }

    /**
     * 在沙箱里执行一份城市主逻辑脚本。
     * 源码包在块级作用域里，城市脚本顶层的 const / let 不会和沙箱参数撞名。
     */
    function evaluateCityScript(source, rec) {
        var sb = createSandbox(rec);
        var params = ['window', 'self', 'globalThis', 'document', 'fetch', 'MutationObserver', 'CityDataManager', 'stationsData', 'linesData'];
        // eslint-disable-next-line no-new-func
        var fn = new Function(params.join(','), '{\n' + source + '\n}\n//# sourceURL=editor-city-sandbox/' + rec.id + '.js');
        fn.call(sb.window, sb.window, sb.window, sb.window, sb.document, sb.fetch, sb.MutationObserver,
            sb.window.CityDataManager, shared.stationsData, shared.linesData);

        var upper = String(rec.id).toUpperCase();
        // 优先取城市脚本自己持有的对象（XX_CITY / CURRENT_CITY）：registerCity 收到的是展开后的副本，
        // 脚本后续再挂到城市对象上的钩子（如平壤的双站名）只会出现在原对象上
        var city = sb.overlay[upper + '_CITY'] || sb.overlay.CURRENT_CITY || rec.registered || null;
        if (!city) {
            // 少数城市只挂在某个 XX_CITY 全局上，名字和 id 不一致
            Object.keys(sb.overlay).some(function (k) {
                var v = sb.overlay[k];
                if (/_CITY$/.test(k) && v && typeof v === 'object' && v.id === rec.id) { city = v; return true; }
                return false;
            });
        }
        return city;
    }

    // ==========================================================================
    // 三、加载与激活
    // ==========================================================================
    function load(cityId) {
        if (records[cityId]) return records[cityId].ready;
        var rec = {
            id: cityId,
            status: 'loading',
            city: null,
            registered: null,
            classes: new Set(['map-' + cityId]),
            links: [],
            error: null,
            ready: null
        };
        records[cityId] = rec;

        var meta = findMeta(cityId);
        var base = resolveFolder(meta, cityId);
        var scriptUrl = (meta && meta.mainLogic) ? rewriteUrl(meta.mainLogic) : (base + '/' + cityId + '.js');

        rec.ready = fetch(scriptUrl, { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(function (src) {
                try {
                    rec.city = evaluateCityScript(src, rec);
                } catch (err) {
                    rec.error = err;
                    console.warn('[CityRenderRuntime] 城市脚本执行失败，回退到通用图元：' + cityId, err);
                }
                rec.status = 'ready';
                if (rec.id === activeId) applyRecord(rec);
                return rec;
            })
            .catch(function (err) {
                rec.error = err;
                rec.status = 'ready';
                console.warn('[CityRenderRuntime] 无法载入城市脚本 ' + scriptUrl, err);
                return rec;
            })
            .then(function (r) {
                var city = r.city;
                if (city && typeof city.prepareRender === 'function') {
                    var p;
                    try { p = city.prepareRender(); } catch (e) { p = null; }
                    if (p && typeof p.then === 'function') {
                        p.then(function () { if (r.id === activeId) emit(); }, function () { });
                    }
                }
                return r;
            });
        return rec.ready;
    }

    function applyRecord(rec) {
        var root = document.documentElement;
        rec.classes.forEach(function (c) { root.classList.add(c); });
        rec.links.forEach(function (l) { l.disabled = false; });
    }

    function retractRecord(rec) {
        var root = document.documentElement;
        rec.classes.forEach(function (c) { root.classList.remove(c); });
        rec.links.forEach(function (l) { l.disabled = true; });
    }

    /**
     * 切换编辑器画布的城市外观。cityId 为空时回到通用画法（空白画布 / 识图工程）。
     * @returns {Promise} 城市脚本就绪（或确认失败回退）后 resolve
     */
    function activate(cityId) {
        var next = cityId || null;
        if (next === activeId) {
            return next ? load(next).then(function () { return getCity(); }) : Promise.resolve(null);
        }
        if (activeId && records[activeId]) retractRecord(records[activeId]);
        activeId = next;
        if (!next) {
            emit();
            return Promise.resolve(null);
        }
        var rec = records[next];
        if (rec) applyRecord(rec);
        else document.documentElement.classList.add('map-' + next);
        return load(next).then(function (r) {
            if (r.id === activeId) {
                applyRecord(r);
                emit();
            }
            return r.city;
        });
    }

    function emit() {
        listeners.slice().forEach(function (fn) {
            try { fn(activeId); } catch (e) { console.error('[CityRenderRuntime] 回调失败', e); }
        });
    }

    function onChange(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    function getCity() {
        var rec = activeId ? records[activeId] : null;
        return (rec && rec.status === 'ready' && rec.city) ? rec.city : null;
    }

    function isReady() {
        if (!activeId) return true;
        var rec = records[activeId];
        return !!(rec && rec.status === 'ready');
    }

    // ==========================================================================
    // 四、渲染契约
    // ==========================================================================

    /**
     * 每次渲染前刷新城市钩子可见的 stationsData / linesData（就地替换内容、保持引用）。
     * @param {Object} stations 车站字典（已带 lineColors）
     * @param {Array} lines 线路数组（至少含 id / color / pathPoints）
     */
    function syncData(stations, lines) {
        var sd = shared.stationsData;
        Object.keys(sd).forEach(function (k) { delete sd[k]; });
        Object.keys(stations || {}).forEach(function (k) { sd[k] = stations[k]; });
        shared.linesData.length = 0;
        (lines || []).forEach(function (l) { shared.linesData.push(l); });
    }

    function safeCall(name, args) {
        var city = getCity();
        if (!city || typeof city[name] !== 'function') return undefined;
        try {
            return city[name].apply(city, args);
        } catch (err) {
            if (!safeCall._warned) safeCall._warned = {};
            var key = activeId + ':' + name;
            if (!safeCall._warned[key]) {
                safeCall._warned[key] = true;
                console.warn('[CityRenderRuntime] 城市钩子 ' + name + ' 执行出错，已回退通用画法', err);
            }
            return undefined;
        }
    }

    function renderStationIcon(station, id) {
        var out = safeCall('renderStationIcon', [station, id]);
        return (out && out.html) ? out : null;
    }

    function decorateStationLabel(el, station, id) {
        // 站名样式标记（如沈阳换乘站的 callout 呼出标签）：线路图由城市模块加类名，这里同义补上
        var style = safeCall('getStationLabelStyle', [station, id]);
        if (style && typeof style === 'string') el.classList.add('label-' + style);
        safeCall('decorateStationLabel', [el, station, id]);
    }

    function getStationUnderlays(stations) {
        var out = safeCall('getStationUnderlays', [stations]);
        return Array.isArray(out) ? out : [];
    }

    /** 本城市额外声明的站点类型（如石家庄的 terminus / scenery），供类型选择器展示 */
    function getExtraStationTypes() {
        var city = getCity();
        var list = city && Array.isArray(city.STATION_TYPES) ? city.STATION_TYPES : [];
        return list.slice();
    }

    return {
        activate: activate,
        onChange: onChange,
        getCity: getCity,
        getActiveCityId: function () { return activeId; },
        isReady: isReady,
        syncData: syncData,
        renderStationIcon: renderStationIcon,
        decorateStationLabel: decorateStationLabel,
        getStationUnderlays: getStationUnderlays,
        getExtraStationTypes: getExtraStationTypes,
        rewriteUrl: rewriteUrl
    };
})();

window.CityRenderRuntime = window.OpenMapEditor.CityRenderRuntime;
