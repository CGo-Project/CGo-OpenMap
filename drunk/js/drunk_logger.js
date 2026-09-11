/**
 * Drunk 线路图智能转换系统 - 浏览器 F12 原生控制台诊断与追踪引擎 (drunk_logger.js)
 * 
 * 核心目标：
 * 专供浏览器原生 DevTools (F12) 控制台，输出全流程高颜值、结构化、分阶段、支持折叠与表格的专业排查日志。
 * 严禁在页面内制作拼凑的抽屉或伪终端，一切日志以浏览器原生 console.* 为准。
 */

window.DrunkLogger = (function () {
    // 浏览器 F12 原生高质感 CSS 样式常量
    const STYLES = {
        badgeBanner1: 'background: #d29922; color: #000000; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: 900; font-size: 13px;',
        badgeBanner2: 'background: #006098; color: #ffffff; padding: 4px 10px; font-weight: 700; font-size: 13px;',
        badgeBanner3: 'background: #202226; color: #58a6ff; padding: 4px 10px; border-radius: 0 4px 4px 0; font-size: 12px;',
        
        badgeStep: 'background: #1f6feb; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-family: monospace; font-size: 11px;',
        badgeSuccess: 'background: #238636; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;',
        badgeWarn: 'background: #9e6a03; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;',
        badgeError: 'background: #da3633; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;',
        badgeTime: 'background: #8957e5; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px;',
        
        stepTitle: 'font-weight: 700; color: #58a6ff; font-size: 13px;',
        stepDesc: 'color: #8b949e; font-size: 12px; font-style: italic;',
        groupTitle: 'color: #79c0ff; font-weight: 600; font-size: 12px;',
        infoTitle: 'color: #a5d6ff; font-weight: 500;',
        highlightNum: 'color: #e3b341; font-weight: bold; font-family: monospace;'
    };

    const timers = {};

    /**
     * 格式化当前时间为 HH:mm:ss.SSS
     */
    function getNowTimeStr() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${h}:${m}:${s}.${ms}`;
    }

    /**
     * 打印转换流水线大横幅
     */
    function banner(title = 'Drunk 线路图智能识别引擎', subtitle = 'CGo OpenMap Vectorization Pipeline') {
        console.log(
            `\n%c🍺 Drunk %c ${title} %c ${subtitle} `,
            STYLES.badgeBanner1,
            STYLES.badgeBanner2,
            STYLES.badgeBanner3
        );
        console.log(
            `%c[提示] 正在使用浏览器 F12 原生控制台进行全流程诊断分析。所有几何采样、色彩聚类与拓扑数据均可在下方展开检查。`,
            'color: #8b949e; font-size: 11px; margin-bottom: 4px;'
        );
    }

    /**
     * 识别阶段标识 (例如: 阶段 1/6)
     */
    function step(cur, total, title, description = '') {
        console.log(
            `%c[${getNowTimeStr()}]%c 阶段 ${cur}/${total} %c ${title} %c${description ? `— ${description}` : ''}`,
            'color: #8b949e; font-size: 11px; font-family: monospace;',
            STYLES.badgeStep,
            STYLES.stepTitle,
            STYLES.stepDesc
        );
    }

    /**
     * 创建折叠控制台分组 (保持控制台清爽，支持点击展开深入排查)
     */
    function group(title, collapsed = true) {
        const groupFn = collapsed ? console.groupCollapsed : console.group;
        groupFn(
            `%c📋 ${title}`,
            STYLES.groupTitle
        );
    }

    /**
     * 结束控制台分组
     */
    function groupEnd() {
        console.groupEnd();
    }

    /**
     * 普通信息日志
     */
    function info(message, data = null) {
        if (data !== null && data !== undefined) {
            console.log(
                `%c[${getNowTimeStr()}]%c ℹ️ ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.infoTitle,
                data
            );
        } else {
            console.log(
                `%c[${getNowTimeStr()}]%c ℹ️ ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.infoTitle
            );
        }
    }

    /**
     * 成功通知日志
     */
    function success(message, data = null) {
        if (data !== null && data !== undefined) {
            console.log(
                `%c[${getNowTimeStr()}]%c 成功 %c ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.badgeSuccess,
                'color: #56d364; font-weight: 600;',
                data
            );
        } else {
            console.log(
                `%c[${getNowTimeStr()}]%c 成功 %c ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.badgeSuccess,
                'color: #56d364; font-weight: 600;'
            );
        }
    }

    /**
     * 警告日志
     */
    function warn(message, data = null) {
        if (data !== null && data !== undefined) {
            console.warn(
                `%c[${getNowTimeStr()}]%c 警告 %c ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.badgeWarn,
                'color: #e3b341; font-weight: 600;',
                data
            );
        } else {
            console.warn(
                `%c[${getNowTimeStr()}]%c 警告 %c ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.badgeWarn,
                'color: #e3b341; font-weight: 600;'
            );
        }
    }

    /**
     * 错误日志
     */
    function error(message, err = null) {
        if (err) {
            console.error(
                `%c[${getNowTimeStr()}]%c 错误 %c ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.badgeError,
                'color: #f85149; font-weight: bold;',
                err
            );
        } else {
            console.error(
                `%c[${getNowTimeStr()}]%c 错误 %c ${message}`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.badgeError,
                'color: #f85149; font-weight: bold;'
            );
        }
    }

    /**
     * 结构化表格输出 (原生 console.table)
     */
    function table(data, columns = null) {
        if (console.table && typeof console.table === 'function') {
            if (columns && Array.isArray(columns)) {
                console.table(data, columns);
            } else {
                console.table(data);
            }
        } else {
            console.log(data);
        }
    }

    /**
     * 计时器打点开始
     */
    function time(label) {
        timers[label] = performance.now();
        console.time(`⏱️ ${label}`);
    }

    /**
     * 计时器打点结束并打印耗时
     */
    function timeEnd(label) {
        const start = timers[label];
        const elapsed = start ? (performance.now() - start).toFixed(1) : null;
        delete timers[label];
        
        try {
            console.timeEnd(`⏱️ ${label}`);
        } catch (e) {}

        if (elapsed !== null) {
            console.log(
                `%c[${getNowTimeStr()}]%c 耗时 %c ${label}: %c${elapsed} ms`,
                'color: #8b949e; font-size: 11px; font-family: monospace;',
                STYLES.badgeTime,
                'color: #d2a8ff; font-weight: 500;',
                STYLES.highlightNum
            );
        }
        return elapsed;
    }

    /**
     * 全流程完成后的统计摘要卡片
     */
    function summary(stats = {}) {
        console.log(
            `\n%c🏁 Drunk 识别全流程执行完毕%c`,
            'background: #238636; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 13px;',
            ''
        );
        if (Object.keys(stats).length > 0) {
            table(stats);
        }
    }

    /**
     * 清空控制台
     */
    function clear() {
        console.clear();
        console.log('%c🍺 Drunk 控制台已清空', 'color: #8b949e;');
    }

    // 兼容老调用（空操作或默认安全返回值）
    function subscribe() {}
    function unsubscribe() {}
    function getLogs() { return []; }
    function exportPlainText() { return ''; }

    return {
        STYLES,
        banner,
        step,
        group,
        groupEnd,
        info,
        success,
        warn,
        error,
        table,
        time,
        timeEnd,
        summary,
        clear,
        subscribe,
        unsubscribe,
        getLogs,
        exportPlainText
    };
})();
