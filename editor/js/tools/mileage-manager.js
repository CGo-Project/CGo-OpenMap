/**
 * 开放地图编辑器 (OpenMap Editor) - 实际运营里程与站间距 (distances) 管理器
 * 提取自原 city-editor 第 16b 节：管理实际区间运营里程、几何反算与留空占位
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.MileageManager = (function () {
    'use strict';

    /**
     * 区间键（无方向）：两端车站键按字典序拼接
     */
    function mileagePairKey(a, b) {
        var x = String(a == null ? '' : a);
        var y = String(b == null ? '' : b);
        return x <= y ? x + '>' + y : y + '>' + x;
    }

    /**
     * 站名宽松比对键
     */
    function normalizeStationKey(name) {
        return String(name || '')
            .replace(/[\s\u3000]/g, '')
            .replace(/（/g, '(').replace(/）/g, ')')
            .replace(/站$/, '')
            .toLowerCase();
    }

    /**
     * 解析实际里程文本输入
     * 支持格式：
     * 1.「起点 终点 里程」：如 "苹果园 古城 1470"
     * 2. 纯数字数组/逐站间距
     * @param {string} text
     * @param {Object} [stationNameToIdMap]
     * @returns {{ parsed: Object, count: number, errors: Array }}
     */
    function parseMileageText(text, stationNameToIdMap) {
        var raw = String(text || '').replace(/\r\n?/g, '\n');
        var values = {};
        var errors = [];
        var count = 0;

        var nameMap = stationNameToIdMap || {};

        raw.split('\n').forEach(function (line, lineIdx) {
            var s = line.trim();
            if (!s || s.startsWith('#') || s.startsWith('//')) return;

            // 格式 1: 站A 站B 1234
            var parts = s.split(/[\s,，\t]+/);
            if (parts.length >= 3) {
                var nameA = parts[0];
                var nameB = parts[1];
                var num = parseFloat(parts[2]);

                if (!isNaN(num) && num > 0) {
                    var idA = nameMap[normalizeStationKey(nameA)] || nameA;
                    var idB = nameMap[normalizeStationKey(nameB)] || nameB;
                    var key = mileagePairKey(idA, idB);
                    values[key] = Math.round(num);
                    count++;
                    return;
                }
            }

            // 格式 2: 纯数字列表（按顺序）
            var singleNum = parseFloat(s);
            if (!isNaN(singleNum) && singleNum > 0 && parts.length === 1) {
                values['idx_' + count] = Math.round(singleNum);
                count++;
                return;
            }

            errors.push('第 ' + (lineIdx + 1) + ' 行无法解析: ' + s);
        });

        return {
            values: values,
            count: count,
            errors: errors
        };
    }

    /**
     * 把录入的实际里程写入走线的 distances 数组
     */
    function applyMileageToWays(line, ways, lineDistancesConfig) {
        if (!line || !ways) return { total: 0, real: 0, mode: 'canvas' };

        var config = (lineDistancesConfig && lineDistancesConfig[line.id]) || {};
        var mode = config.mode || 'canvas';
        var table = config.values || {};

        var total = 0, real = 0;

        (ways || []).forEach(function (way) {
            var ids = way.stationIds || [];
            var dists = way.distances || [];

            if (mode === 'none') {
                way.distances = [];
                return;
            }

            for (var i = 0; i < dists.length; i++) {
                total++;
                if (i < ids.length - 1) {
                    var a = ids[i], b = ids[i + 1];
                    var k = mileagePairKey(a, b);
                    if (table[k] != null && table[k] > 0) {
                        dists[i] = Math.round(table[k]);
                        real++;
                    }
                }
            }
        });

        return {
            total: total,
            real: real,
            mode: mode
        };
    }

    return {
        mileagePairKey: mileagePairKey,
        normalizeStationKey: normalizeStationKey,
        parseMileageText: parseMileageText,
        applyMileageToWays: applyMileageToWays
    };
})();

// 保留全局别名兼容
window.MileageManager = window.OpenMapEditor.MileageManager;
