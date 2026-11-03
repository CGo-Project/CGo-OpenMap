/**
 * 开放地图编辑器 (OpenMap Editor) - 统一工程数据模型
 * 负责工程初始结构创建、深拷贝、校验与序列化
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.ProjectModel = (function () {
    'use strict';

    var WATER_DEFAULT = {
        fillLight: '#a5d7e8',
        fillDark: '#13354d',
        opacity: 0.6,
        zIndex: 1
    };

    var SLOPE_DEFAULT = { m: 1, n: 1 };

    /**
     * 创建一个初始空白工程
     * @param {number} [width=2000] 画布宽度
     * @param {number} [height=1500] 画布高度
     * @returns {Object}
     */
    function createProject(width, height) {
        return {
            version: 1,
            canvas: {
                width: Number(width) > 0 ? Number(width) : 2000,
                height: Number(height) > 0 ? Number(height) : 1500
            },
            /** 节点字典：station(车站，普通/换乘/在建/国铁) 或 temp(临时辅助节点) */
            nodes: {},
            /** 线段列表：{ id, lineId, type, points: [{ x, y, nid? }], routed?, cornerFlip?, notOpen? } */
            segments: [],
            /** 线路元数据列表：{ id, name, color } */
            lines: [],
            /** 水域几何要素列表：{ id, name, type: 'poly'|'river', points: [{ x, y }], width? } */
            waters: [],
            /** 自由注释文本列表：{ id, text, x, y, size, color, bold, anchor, rotate } */
            texts: [],
            /** 虚拟换乘组：{ id, name, free, stationIds: [...] } */
            virtualTransfers: [],
            /** 虚拟换乘连通虚线：[{ from, to, offsetFrom, offsetTo, free }] */
            virtualConnectors: [],
            /** 在建/规划未开通走向折线：[{ points, style }]（含白线描边等样式） */
            notOpenLines: [],
            /** 地理地标与城门散点装饰物：[{ x, y, file, width, height, opacity, rotation, zIndex }] */
            scattered: [],
            /** 图例分组结构配置：[{ type, title, subtitle, cols, items }] */
            legend: [],
            /** 水域底图全局样式 */
            waterStyle: {
                fillLight: WATER_DEFAULT.fillLight,
                fillDark: WATER_DEFAULT.fillDark,
                opacity: WATER_DEFAULT.opacity,
                zIndex: WATER_DEFAULT.zIndex
            },
            /** 项目统一折角斜率比例 (m:n，默认 1:1 即 45°) */
            slope: { m: SLOPE_DEFAULT.m, n: SLOPE_DEFAULT.n },
            /** 实际站间距录入缓存：{ [lineId]: { source, values: { 'A>B': 1200 }, updatedAt } } */
            lineDistances: {},
            /** 自增 ID 计数器 */
            idSeq: 1
        };
    }

    /**
     * 工程里所有「带 id 的集合」：新增图元必须先在这些集合里查重。
     * 顺序无关，仅用于遍历。
     */
    var ID_COLLECTIONS = ['segments', 'lines', 'waters', 'texts', 'virtualTransfers'];

    /** 转义正则元字符（前缀里含 `-` 等字符时也要安全） */
    function escapeRegExp(text) {
        return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /** 该 ID 是否已被工程占用（节点字典的键就是节点 ID） */
    function idExists(project, id) {
        if (!project || !id) return false;
        if (project.nodes && Object.prototype.hasOwnProperty.call(project.nodes, id)) return true;
        for (var i = 0; i < ID_COLLECTIONS.length; i++) {
            var list = project[ID_COLLECTIONS[i]];
            if (!Array.isArray(list)) continue;
            for (var j = 0; j < list.length; j++) {
                if (list[j] && list[j].id === id) return true;
            }
        }
        return false;
    }

    /**
     * 量出某个前缀当前用到的最大序号。
     * 只统计「前缀 + 纯数字」的 ID，因此 `node_5` 得到 5、`node_NaN` 得到 0，
     * 不会被城市车站 ID（如 `M101`）干扰。
     */
    function maxSeqForPrefix(project, prefix) {
        if (!project) return 0;
        var re = new RegExp('^' + escapeRegExp(prefix) + '(\\d+)$');
        var max = 0;
        var scan = function (id) {
            var m = re.exec(String(id == null ? '' : id));
            if (!m) return;
            var n = parseInt(m[1], 10);
            if (n > max) max = n;
        };
        if (project.nodes) Object.keys(project.nodes).forEach(scan);
        ID_COLLECTIONS.forEach(function (key) {
            var list = project[key];
            if (!Array.isArray(list)) return;
            list.forEach(function (item) { if (item && item.id !== undefined) scan(item.id); });
        });
        return max;
    }

    /**
     * 生成唯一图元 ID。
     *
     * 不能只写 `++project.idSeq`：旧版 / 手改 / 第三方工具产出的工程 JSON 常常
     * 缺少 `idSeq`，自增会从 `undefined` 变成 `NaN`，于是整批新节点都叫
     * `node_NaN` 并互相覆盖。这里同时做三件事：
     *   1. 非法 / 缺失的 idSeq 视为 1；
     *   2. 序号至少从「该前缀已有的最大序号」之后开始，避免与旧 ID 撞车；
     *   3. 逐个查重，已被占用就继续 +1（兜住手工乱写的 ID）。
     *
     * @param {Object} project
     * @param {string} prefix
     * @returns {string}
     */
    function nextId(project, prefix) {
        var p = prefix || 'item_';
        if (!project) return p + Date.now();
        var seq = Math.max(Number(project.idSeq) || 1, maxSeqForPrefix(project, p));
        var id = p + seq;
        // 上界只是防御死循环，正常工程不会走到
        for (var guard = 0; guard < 100000 && idExists(project, id); guard++) {
            seq++;
            id = p + seq;
        }
        project.idSeq = seq;
        return id;
    }

    /**
     * 对工程对象进行深拷贝（用于快照与历史恢复）
     * @param {Object} project
     * @returns {Object|null}
     */
    function clone(project) {
        if (!project) return null;
        return JSON.parse(JSON.stringify(project));
    }

    /**
     * 全工程 ID 的最大数字后缀（不区分前缀）。
     * 用于给缺失 / 偏小的 `idSeq` 兜底，让旧工程导入后的新 ID 尽量单调。
     */
    function maxIdSuffix(project) {
        if (!project) return 0;
        var max = 0;
        var scan = function (id) {
            var m = /(\d+)$/.exec(String(id == null ? '' : id));
            if (!m) return;
            var n = parseInt(m[1], 10);
            if (n > max) max = n;
        };
        if (project.nodes) Object.keys(project.nodes).forEach(scan);
        ID_COLLECTIONS.forEach(function (key) {
            var list = project[key];
            if (!Array.isArray(list)) return;
            list.forEach(function (item) { if (item && item.id !== undefined) scan(item.id); });
        });
        return max;
    }

    /**
     * 校验并补全工程字段
     * @param {Object} p
     * @returns {Object}
     */
    function normalize(p) {
        if (!p || typeof p !== 'object') return createProject();
        p.version = p.version || 1;
        p.canvas = p.canvas || { width: 2000, height: 1500 };
        p.nodes = p.nodes || {};
        p.segments = Array.isArray(p.segments) ? p.segments : [];
        p.lines = Array.isArray(p.lines) ? p.lines : [];
        p.waters = Array.isArray(p.waters) ? p.waters : [];
        p.texts = Array.isArray(p.texts) ? p.texts : [];
        p.virtualTransfers = Array.isArray(p.virtualTransfers) ? p.virtualTransfers : [];
        p.virtualConnectors = Array.isArray(p.virtualConnectors) ? p.virtualConnectors : [];
        p.notOpenLines = Array.isArray(p.notOpenLines) ? p.notOpenLines : [];
        p.scattered = Array.isArray(p.scattered) ? p.scattered : [];
        p.legend = Array.isArray(p.legend) ? p.legend : [];
        p.waterStyle = Object.assign({}, WATER_DEFAULT, p.waterStyle || {});
        p.slope = Object.assign({}, SLOPE_DEFAULT, p.slope || {});
        p.lineDistances = p.lineDistances || {};
        // 缺 idSeq 的旧工程不能直接落到 1：若已有 node_5 / seg_9，会生成重复 ID。
        p.idSeq = Math.max(Number(p.idSeq) || 1, maxIdSuffix(p));
        return p;
    }

    return {
        createProject: createProject,
        nextId: nextId,
        clone: clone,
        normalize: normalize,
        idExists: idExists,
        maxIdSuffix: maxIdSuffix,
        WATER_DEFAULT: WATER_DEFAULT,
        SLOPE_DEFAULT: SLOPE_DEFAULT
    };
})();

// 保留全局别名兼容
window.ProjectModel = window.OpenMapEditor.ProjectModel;
