/**
 * 开放地图编辑器 (OpenMap Editor) - 启动与 URL 导航策略
 *
 * 把这些「决定要不要动用户当前工程」的纯判断单独收在这里，便于回归测试：
 *   1. 会话恢复成功后，URL 上的 ?city= 不允许默默覆盖未保存工程（issue #50）；
 *   2. 城市下拉框一次选择只派发一种事件，避免 cgo-change 与 change 双触发、重复加载；
 *   3. 部署在线上（非本机 / 局域网）时不提供「在线城市库」，也不响应 URL 的 ?city=：
 *      想维护已有城市必须先克隆仓库，再通过「关联本地目录」载入。
 *
 * 本文件不碰 DOM 状态，只返回动作或派发一次事件。
 */

window.OpenMapEditor = window.OpenMapEditor || {};

window.OpenMapEditor.StartupPolicy = (function () {
    'use strict';

    /**
     * 启动时对 URL `?city=` 的处理动作。
     *   'none'          —— URL 没带城市，不处理
     *   'load'          —— 本次启动没有恢复任何工程，可以安全自动载入
     *   'already-loaded'—— 恢复出来的正是这座城市，只切页签、不再重复加载
     *   'keep-session'  —— 恢复了别的工程（空白画布 / 另一座城市）：保护未保存内容，不自动载入
     *   'blocked-online'—— 线上部署：不从服务器载入已有城市
     */
    var ACTION = {
        NONE: 'none',
        LOAD: 'load',
        ALREADY_LOADED: 'already-loaded',
        KEEP_SESSION: 'keep-session',
        BLOCKED_ONLINE: 'blocked-online'
    };

    /**
     * 是否运行在线上部署（例如 centralgo.site）。
     * 本机（localhost / 127.x / ::1 / *.local）、局域网私有地址和 file:// 视为本地开发环境。
     *
     * @param {{ protocol?: string, hostname?: string }} [loc] 默认取 window.location
     * @returns {boolean}
     */
    function isOnlineDeployment(loc) {
        var l = loc || (typeof window !== 'undefined' && window.location) || {};
        var protocol = String(l.protocol || '').toLowerCase();
        if (protocol === 'file:') return false;
        var host = String(l.hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
        if (!host) return false;
        if (host === 'localhost' || /\.localhost$/.test(host) || /\.local$/.test(host)) return false;
        if (host === '::1' || host === '0.0.0.0') return false;
        if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false;
        if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
        if (/^(fc|fd)[0-9a-f]{2}:/.test(host) || /^fe80:/.test(host)) return false;
        return true;
    }

    /**
     * @param {{ sessionRestored?: boolean, restoredCityId?: string|null, urlCity?: string|null, online?: boolean }} opts
     * @returns {'none'|'load'|'already-loaded'|'keep-session'|'blocked-online'}
     */
    function decideUrlCity(opts) {
        var o = opts || {};
        var urlCity = o.urlCity ? String(o.urlCity) : '';
        if (!urlCity) return ACTION.NONE;
        if (o.online) return ACTION.BLOCKED_ONLINE;
        if (!o.sessionRestored) return ACTION.LOAD;
        var restoredCityId = o.restoredCityId ? String(o.restoredCityId) : '';
        return restoredCityId && restoredCityId === urlCity
            ? ACTION.ALREADY_LOADED
            : ACTION.KEEP_SESSION;
    }

    /**
     * 城市选择控件该派发的事件名。
     * `<cgo-toolbar-select>` 自己派发 cgo-change；原生 <select> 只会派发 change。
     */
    function cityChangeEventName(tagName) {
        return String(tagName || '').toLowerCase() === 'select' ? 'change' : 'cgo-change';
    }

    /**
     * 设置值并**只派发一次**城市选择事件。
     * 之前同时派发 cgo-change 与 change，两个监听器都绑了 handleCityChange，
     * 于是 URL 启动会连着发两次 HTTP 城市加载。
     *
     * @param {Element} selectEl
     * @param {string} cityId
     */
    function dispatchCityChange(selectEl, cityId) {
        if (!selectEl || !cityId) return;
        selectEl.value = cityId;
        if (typeof selectEl.requestUpdate === 'function') selectEl.requestUpdate();

        if (cityChangeEventName(selectEl.tagName) === 'change') {
            selectEl.dispatchEvent(new Event('change'));
            return;
        }
        selectEl.dispatchEvent(new CustomEvent('cgo-change', {
            detail: { value: cityId },
            bubbles: true,
            composed: true
        }));
    }

    return {
        ACTION: ACTION,
        isOnlineDeployment: isOnlineDeployment,
        decideUrlCity: decideUrlCity,
        cityChangeEventName: cityChangeEventName,
        dispatchCityChange: dispatchCityChange
    };
})();

// 保留全局别名兼容
window.StartupPolicy = window.OpenMapEditor.StartupPolicy;
