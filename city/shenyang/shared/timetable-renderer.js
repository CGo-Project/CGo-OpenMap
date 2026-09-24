/**
 * CGo OpenMap - 首末班车共享渲染层
 *
 * ⚠️ 临时共享位置
 * 本文件与 stacard-engine.js 目前放在 city/shenyang/shared/ 下，供沈阳、大连、长春
 * 三城共用。计划在开发团队确认共享位置后迁入 core/，届时只需 git mv 并改 6 处引用
 * 路径（3 处 stacard import + 3 处 {city}.js 的 document.write），零逻辑改动。
 * 迁移步骤见 docs/STACARD_TIMETABLE_UNIFICATION.md 第 4.4 节。
 *
 * 加载方式：classic script。由各城 {city}.js 在加载自身模块**之前** document.write
 * 引入，因此以全局形式暴露，不走 ES module（城市模块本身也是 classic script）。
 *
 * 职责边界
 * - 本文件负责：归一化行 → HTML、日期类型判定、终点站代号解析、标签差异判定。
 * - 城市侧负责：取数逻辑（沈阳的有轨端点表、大连的贯通合并与推算、长春的四维）
 *   与季节阈值（沈阳 4–10 月、长春 5–10 月，属城市数据而非机制）。
 */
(function () {
    "use strict";

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const SHANGHAI_TZ = "Asia/Shanghai";

    /* ======================================================================
     * 日期类型判定
     * ==================================================================== */

    /** 取某字段的日期列表；兼容扁平数组与按年份嵌套两种写法 */
    function dateList(calendar, field, year) {
        const source = calendar?.[field];
        if (Array.isArray(source)) return source;
        if (source && Array.isArray(source[String(year)])) return source[String(year)];
        return [];
    }

    /** 取某日在 Asia/Shanghai 时区下的年 / 月 / 日 / 星期 */
    function shanghaiParts(date) {
        const value = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(value.getTime())) return null;
        const parts = {};
        new Intl.DateTimeFormat("en-US", {
            timeZone: SHANGHAI_TZ,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "short"
        }).formatToParts(value).forEach((part) => {
            if (part.type !== "literal") parts[part.type] = part.value;
        });
        return parts;
    }

    const CGoDayType = {
        /**
         * 判定某日属于工作日还是节假日
         *
         * 顺序：调休上班日 → 法定假日 → 按星期（周一至周五工作日，周六日节假日）。
         * 调休上班日优先，是因为它是对星期的显式覆盖；两个列表按约定互斥，
         * 若数据有误同时命中，以调休上班为准（与原大连实现一致）。
         *
         * @param {Date} date - 待判定日期，缺省为当前时刻
         * @param {{ calendar?: object }} options
         *        calendar 为城市提供的调休日历，`holidayDates` / `workdayDates`
         *        支持扁平数组或按年份嵌套（如 `{ "2026": [...] }`）两种写法；
         *        日期格式 "YYYY-MM-DD"；缺省则纯按星期判定
         * @returns {{ key: "workday"|"restday", label: "工作日"|"节假日", date: string }}
         */
        resolve(date = new Date(), options = {}) {
            const calendar = options.calendar || {};
            const parts = shanghaiParts(date);
            if (!parts) return { key: "workday", label: "工作日", date: "" };

            const iso = `${parts.year}-${parts.month}-${parts.day}`;
            const year = Number(parts.year);
            if (dateList(calendar, "workdayDates", year).includes(iso)) {
                return { key: "workday", label: "工作日", date: iso };
            }
            if (dateList(calendar, "holidayDates", year).includes(iso)) {
                return { key: "restday", label: "节假日", date: iso };
            }
            const isWeekend = parts.weekday === "Sat" || parts.weekday === "Sun";
            return isWeekend
                ? { key: "restday", label: "节假日", date: iso }
                : { key: "workday", label: "工作日", date: iso };
        },

        /**
         * 找出另一日期类型的代表日
         *
         * 用于标签差异判定：需要拿「另一分支」的数据与当前分支比对，而城市的
         * 取数函数多以日期为入参，故需先找一个属于目标日期类型的日期。
         *
         * @param {"workday"|"restday"} targetKey - 目标日期类型
         * @param {Date} from - 起点日期，缺省为今天
         * @param {{ calendar?: object, maxDays?: number }} options
         * @returns {Date|null} 找到的日期；超过 maxDays（默认 15）仍未找到则返回 null
         */
        findDate(targetKey, from = new Date(), options = {}) {
            const maxDays = Number(options.maxDays) || 15;
            const probe = new Date(from.getTime());
            for (let i = 0; i < maxDays; i += 1) {
                probe.setDate(probe.getDate() + 1);
                if (this.resolve(probe, options).key === targetKey) return new Date(probe.getTime());
            }
            return null;
        }
    };

    /* ======================================================================
     * 终点站代号解析
     * ==================================================================== */

    /**
     * 解析终点站为显示名
     *
     * "line-first" / "line-last" 为线路首站 / 末站代号，其余值按站 ID 处理。
     * 两种情况都统一解析为车站中文名；查不到名称时回退为原始值，便于暴露数据问题。
     * 分支线沿用既有行为：取 stationIds-way1，缺省回退主站序。
     *
     * @param {object} line - linesData 中的线路对象
     * @param {string} value - 站 ID 或代号
     * @param {{ stations?: object }} context - 车站字典，缺省取全局 stationsData
     * @returns {string} 终点站显示名
     */
    function resolveDestination(line, value, context = {}) {
        const raw = String(value ?? "");
        let id = raw;

        if (raw === "line-first" || raw === "line-last") {
            if (!line) return "";
            const stationIds = line.hasbranch
                ? (line["stationIds-way1"] || line.stationIds || [])
                : (line.stationIds || []);
            if (!Array.isArray(stationIds) || !stationIds.length) return "";
            id = String(raw === "line-first" ? stationIds[0] : stationIds[stationIds.length - 1]);
        }

        const stations = context.stations
            || (typeof stationsData !== "undefined" ? stationsData : null);
        return stations?.[id]?.cn || id;
    }

    /* ======================================================================
     * 行渲染
     * ==================================================================== */

    /**
     * 归一化行模型
     * @typedef {object} TimetableRow
     * @property {string} destination - 终点站 / 始发站显示名
     * @property {string} [first]     - 首班时刻
     * @property {string} [last]      - 末班时刻
     * @property {"towards"|"origin"} [mode] - 文案形态，缺省 "towards"（开往X）；
     *        "origin" 用于线路端点站的始发时刻（X始发）
     * @property {string} [note]      - 标注文本，note 为「推算」时按推算样式前置
     * @property {boolean} [estimated]- 推算标记，等价于 note === "推算"
     */

    /** 格式化首末时刻："06:30-22:00" / "首班 06:30" / "末班 22:00" */
    function formatTime(row) {
        const first = escapeHtml(row?.first);
        const last = escapeHtml(row?.last);
        if (first && last) return `${first}-${last}`;
        if (first) return `首班 ${first}`;
        if (last) return `末班 ${last}`;
        return "";
    }

    /** 渲染单行为「开往X：06:30-22:00」；mode 为 origin 时渲染为「X始发：06:30-22:00」 */
    function renderRow(row) {
        const time = formatTime(row);
        if (!time) return "";

        const destination = escapeHtml(row?.destination);
        const head = row?.mode === "origin" ? `${destination}始发` : `开往${destination}`;

        // 注释统一以 <small> 降级显示：推算类前置，其余后置
        const note = String(row?.note || "").trim();
        const isEstimate = Boolean(row?.estimated) || note === "推算";
        const leading = isEstimate ? "<small>（推算）</small>" : "";
        const trailing = note && !isEstimate ? `<small>（${escapeHtml(note)}）</small>` : "";
        return `${leading}${head}：${time}${trailing}`;
    }

    /** 渲染整组行，以 <br> 连接 */
    function renderRows(rows) {
        if (!Array.isArray(rows)) return "";
        return rows.map(renderRow).filter(Boolean).join("<br>");
    }

    /**
     * 逐行比对两组行是否等价
     *
     * 用于标签差异判定：某维度取另一分支时若结果完全相同，则该维度标签无需显示。
     * @returns {boolean} 两组行渲染结果完全一致时为 true
     */
    function sameRows(a, b) {
        const listA = (Array.isArray(a) ? a : []).map(renderRow).filter(Boolean);
        const listB = (Array.isArray(b) ? b : []).map(renderRow).filter(Boolean);
        if (listA.length !== listB.length) return false;
        return listA.every((value, index) => value === listB[index]);
    }

    /* ======================================================================
     * 卡片渲染
     * ==================================================================== */

    /** 单个信息行；label 允许含标记（如 <br><small>…</small>），故不转义 */
    function renderInfoRow(label, value) {
        return `
            <div class="info-row">
                <span class="info-label">${label}</span>
                <span class="info-value">${value || "暂无数据"}</span>
            </div>
        `;
    }

    /**
     * 标签：仅当维度确有差异时才显示
     *
     * 标签的作用是区分当前用的是哪一套时刻表，不是装饰。meta 中未给出的维度
     * 视为无差异（由城市侧用 sameRows 判定后决定是否传入）。
     */
    function buildLabel(label, meta) {
        const parts = [];
        if (meta?.seasonLabel) parts.push(escapeHtml(meta.seasonLabel));
        if (meta?.dayTypeLabel) parts.push(escapeHtml(meta.dayTypeLabel));
        const head = escapeHtml(label);
        return parts.length ? `${head}<br><small>${parts.join(" ")}</small>` : head;
    }

    /** 卡片外壳；innerHtml 为若干 renderInfoRow 的拼接 */
    function renderCardShell(innerHtml) {
        if (!innerHtml) return "";
        return `
            <div class="cgo-timetable-card" style="margin:8px 0 14px 0;">
                <div class="stacard-info-content" style="width:100%;box-sizing:border-box;padding:4px 0;border-bottom:1px dashed var(--divider,rgba(0,0,0,.08));">
                    ${innerHtml}
                </div>
            </div>
        `;
    }

    /**
     * 渲染整张首末班车卡片（单行形态，供大连 / 长春使用）
     *
     * 沈阳同时渲染「位置」「出入口」等多行，请改用 renderCardShell + renderInfoRow 组合。
     */
    function renderCard({ rows, meta, label = "首末班车" } = {}) {
        const value = renderRows(rows);
        if (!value) return "";
        return renderCardShell(renderInfoRow(buildLabel(label, meta), value));
    }

    window.CGoDayType = CGoDayType;
    window.CGoTimetable = {
        escapeHtml,
        resolveDestination,
        formatTime,
        renderRow,
        renderRows,
        sameRows,
        buildLabel,
        renderInfoRow,
        renderCardShell,
        renderCard
    };
})();
