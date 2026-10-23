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
     * 生成唯一图元 ID
     * @param {Object} project
     * @param {string} prefix
     * @returns {string}
     */
    function nextId(project, prefix) {
        if (!project) return (prefix || 'item_') + Date.now();
        project.idSeq = (project.idSeq || 1) + 1;
        return (prefix || 'item_') + project.idSeq;
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
        p.waterStyle = Object.assign({}, WATER_DEFAULT, p.waterStyle || {});
        p.slope = Object.assign({}, SLOPE_DEFAULT, p.slope || {});
        p.lineDistances = p.lineDistances || {};
        p.idSeq = Number(p.idSeq) || 1;
        return p;
    }

    return {
        createProject: createProject,
        nextId: nextId,
        clone: clone,
        normalize: normalize,
        WATER_DEFAULT: WATER_DEFAULT,
        SLOPE_DEFAULT: SLOPE_DEFAULT
    };
})();

// 保留全局别名兼容
window.ProjectModel = window.OpenMapEditor.ProjectModel;
