/**
 * CGo OpenMap - 兰州城市专属模块：运营情况 (city/lanzhou/modules/lanzhou_operation_status.js)
 *
 * ==============================================================================
 * 模块作用 (Overview)
 * ==============================================================================
 * 在车站卡片的「每一条经停线路」选项卡最下方追加一行「运营情况」。
 * 版式严格沿用核心引擎的「上一站 / 下一站」信息行：
 *   - 外层 .info-row            → 13px，与邻站行同字号、同行高、同间距；
 *   - 左侧 .info-label          → 「运营情况」四字，颜色 var(--text-light)，与「上一站」「下一站」完全一致；
 *   - 右侧 .info-value          → 运营情况正文，颜色 var(--text-main)，随亮/暗主题自适应。
 * 因此本模块不引入任何自定义字号与颜色，天然适配亮色 / 暗色主题与移动端。
 *
 * ==============================================================================
 * 挂载位置 (Slot & Order)
 * ==============================================================================
 * targetTab: 'line-tab'  → 挂在每条线路选项卡内部；
 * order: 90              → 排在 高德切片(10) / 上一站下一站(20) / 首末车时刻(22) / 换乘走向(30) 之后，
 *                          即成为该线路选项卡的「最下方」内容。
 *
 * ==============================================================================
 * 内容如何自由编辑 (How to edit)
 * ==============================================================================
 * 全部文案集中在下方 LANZHOU_OPERATION_STATUS 数据表：
 *   - stations[车站ID]  —— 逐站文案，现网每个车站一条，可单独编辑（即“每个站点均可编辑”）；
 *   - lines[线路ID]     —— 线路级默认，仅作为后续新增车站的兜底。
 * 匹配优先级（自上而下，命中即停）：
 *   1. hidden 名单                 —— 命中即整行不显示
 *                                    （默认已屏蔽 中川城际 S1 与 规划/在建线路 M3/M4/M5/M7/M8）
 *   2. 车站对象自带字段            —— data_stations.js 中该站的 operationStatus / opStatus（逐站临时覆写）
 *   3. stations[车站ID]            —— 逐站文案（写空串 "" / false = 该站不显示）
 *   4. 未开通车站（type: "no"）    —— 统一使用 notOpenText（默认留空 = 不显示）
 *   5. lines[线路ID]               —— 线路级兜底文案
 *   6. default                     —— 全路网兜底文案（默认留空 = 不显示）
 *
 * 显示 / 隐藏（四种粒度，可任选）：
 *   A. 全局总开关：LANZHOU_OPERATION_STATUS.enabled = false   → 全城所有车站都不显示；
 *   B. 模块开关：city/lanzhou/lanzhou.js 中 stationBoard.modules["lanzhou-operation-status"].enabled
 *                = false                                       → 由核心引擎直接屏蔽该模块；
 *   C. 精细隐藏：数据表 hidden 数组，支持三种写法（均命中即隐藏）
 *                "M1:M101"  → 仅隐藏 1号线 东岗
 *                "M2:*"     → 隐藏 2号线全部车站
 *                "*:M105"   → 隐藏 五里铺 的全部线路
 *                ⚠️ 默认已写入 "S1:*" 与 "M3:*"~"M8:*"，
 *                   即中川城际与规划/在建线路一律不显示，删除对应行即可恢复。
 *   D. 逐站隐藏：stations 中把该站写成 "" / false / { hidden: true }；
 *   E. 车站字段（data_stations.js，仅对单个车站生效）
 *                operationStatus: "文案"        → 覆写该站全部线路
 *                operationStatus: { M1: "文案" } → 仅覆写指定线路
 *                operationStatus: "" / false     → 该站不显示
 *                hideOperationStatus: true       → 该站不显示
 *
 * ==============================================================================
 * 视觉与工程约束 (Project rules)
 * ==============================================================================
 * - 纯原生 JS，无任何第三方依赖；
 * - 仅读取 context 上下文（station / lineInfo），不硬编码车站坐标与业务逻辑；
 * - 图标如需扩展，必须使用 <cgo-icon> 组件，严禁使用 Emoji。
 * ==============================================================================
 */

(function () {
    /* ===================================================================== */
    /* ====== 可自由编辑区：兰州运营情况文案表 (EDIT HERE) ================== */
    /* ===================================================================== */
    const LANZHOU_OPERATION_STATUS = {
        /** 总开关：false → 全城车站卡片均不显示「运营情况」 */
        enabled: true,

        /** 未开通车站（data_stations.js 中 type: "no"）统一文案；留空 "" 表示未开通车站不显示 */
        notOpenText: "",

        /** 全路网兜底文案；留空 "" 表示未单独配置的线路不显示该行 */
        default: "",

        /**
         * 线路级运营情况（键为线路 ID）—— 仅作为后续新增车站的兜底，
         * 现网车站一律在下方 stations 中逐站配置。
         * 值可为：字符串 / 字符串数组（数组按行换行展示）/ { text: "文案", hidden: true }
         */
        lines: {
            "M1": "正常运营",
            "M2": "正常运营"
        },

        /**
         * 逐站运营情况（键为车站 ID）—— 现网 1、2 号线全部运营车站，每站一条，可自由编辑。
         * 值可为：
         *   "正常运营"                                   —— 整站通用文案
         *   { "M1": "文案", "M2": "文案" }               —— 换乘站按线路分别编辑
         *   ["第一行", "第二行"]                          —— 多行展示
         *   "" / false / { hidden: true }                —— 该站不显示
         * ⚠️ 中川城际（S1）与规划/在建线路（M3/M4/M5/M7/M8）的车站默认不显示，
         *    若日后需要展示，请先在上方 hidden 名单中移除对应线路，再在此处补条目。
         */
        stations: {
            // ================= 1号线（东岗 → 陈官营，20 站） =================
            "M101": "于2019年6月23日随1号线一期投入运营",                                          // 东岗
            "M102": "于2019年6月23日随1号线一期投入运营",                                          // 焦家湾
            "M103": "于2019年6月23日随1号线一期投入运营",                                          // 拱星墩
            "M104": "于2019年6月23日随1号线一期投入运营",                                          // 省气象局
            "M105": { "M1": "于2019年6月23日随1号线一期投入运营", "M2": "于2023年6月29日随2号线一期投入运营" },               // 五里铺（1、2号线换乘）
            "M106": "于2019年6月23日随1号线一期投入运营",                                          // 兰州大学
            "M107": { "M1": "于2019年6月23日随1号线一期投入运营", "M2": "于2023年6月29日随2号线一期投入运营" },               // 东方红广场（1、2号线换乘）
            "M108": "于2020年9月28日单独投入运营",                                          // 省政府
            "M109": "于2019年6月23日随1号线一期投入运营",                                          // 西关
            "M110": "于2019年6月23日随1号线一期投入运营",                                          // 文化宫
            "M111": "于2019年6月23日随1号线一期投入运营",                                          // 小西湖
            "M112": "于2019年6月23日随1号线一期投入运营",                                          // 七里河
            "M113": "于2019年6月23日随1号线一期投入运营",                                          // 西站什字
            "M114": { "M1": "于2019年6月23日随1号线一期投入运营", "M2": "规划中"},               // 兰州西站北广场（1、2号线换乘）
            "M115": "于2019年6月23日随1号线一期投入运营",                                          // 土门墩
            "M116": "于2019年6月23日随1号线一期投入运营",                                          // 马滩
            "M117": "于2019年6月23日随1号线一期投入运营",                                          // 兰州海关
            "M118": "于2019年6月23日随1号线一期投入运营",                                          // 兰州城市学院（省科技馆）
            "M119": "于2019年6月23日随1号线一期投入运营",                                          // 奥体中心
            "M120": "于2019年6月23日随1号线一期投入运营",                                          // 陈官营

            // ================= 2号线（雁白大桥 → 兰州火车站，6 站；换乘站见上） =====
            "M201": "于2023年6月29日随2号线一期投入运营",                                          // 雁白大桥
            "M202": "于2023年6月29日随2号线一期投入运营",                                          // 均家滩
            "M203": "于2023年6月29日随2号线一期投入运营",                                          // 张苏滩
            "M205": "于2023年6月29日随2号线一期投入运营",                                          // 团结新村
            "M206": "于2023年6月29日随2号线一期投入运营",                                          // 红星巷
            "M207": "于2023年6月29日随2号线一期投入运营"                                           // 兰州火车站

            // 文案示例（按需替换上面的 "正常运营"）：
            // "M109": "正常运营，首班车 06:30，末班车 22:30",
            // "M116": ["正常运营", "节假日视客流延长运营时间"]
        },

        /**
         * 隐藏名单：命中即整行不显示
         * "线路ID:车站ID" / "线路ID:*" / "*:车站ID" / "车站ID"
         * 默认已屏蔽「中川城际」与全部规划/在建线路；如需恢复展示，删除对应行即可。
         */
        hidden: [
            "S1:*",   // 中川城际（市郊铁路 / 国铁车站）不展示运营情况
            "M3:*",   // 3号线（规划）
            "M4:*",   // 4号线（规划）
            "M5:*",   // 5号线（规划）
            "M7:*",   // 7号线（规划）
            "M8:*"    // 8号线（规划）
        ]
    };
    /* ==================== 可自由编辑区结束 (END EDIT) ====================== */

    /** 数据表在 window 上导出，便于外部按需修改（如 LANZHOU_OPERATION_STATUS.lines.M1 = "..."） */
    window.LANZHOU_OPERATION_STATUS = LANZHOU_OPERATION_STATUS;

    /**
     * 归一化配置条目 → { text } | { hidden: true } | null
     */
    function normalizeEntry(entry) {
        if (entry == null || entry === false || entry === "") return null;

        if (Array.isArray(entry)) {
            const text = entry
                .filter((x) => x != null && x !== "")
                .map((x) => String(x).trim())
                .filter(Boolean)
                .join("<br>");
            return text ? { text } : null;
        }

        if (typeof entry === "object") {
            if (entry.hidden === true || entry.enabled === false) return { hidden: true };
            return normalizeEntry(entry.text ?? entry.value ?? entry.status ?? entry.content);
        }

        const text = String(entry).trim();
        return text ? { text } : null;
    }

    /**
     * 命中隐藏名单判定
     */
    function isHiddenByList(lineId, stationId) {
        const list = LANZHOU_OPERATION_STATUS.hidden;
        if (!Array.isArray(list) || !list.length) return false;

        const lid = String(lineId || "");
        const sid = String(stationId || "");

        return list.some((raw) => {
            const key = String(raw == null ? "" : raw).trim();
            if (!key) return false;
            if (key.indexOf(":") === -1) return key === sid; // 仅写车站 ID → 隐藏该站全部线路
            const parts = key.split(":");
            const l = (parts[0] || "").trim();
            const s = (parts[1] || "").trim();
            return (l === "*" || l === lid) && (s === "*" || s === sid);
        });
    }

    /**
     * 由「车站对象 + 线路 ID」解析出运营情况文案
     * @returns {string|null} 命中的文案；null 表示不显示该行
     */
    function resolveOperationStatus(station, lineId) {
        const cfg = LANZHOU_OPERATION_STATUS;
        if (!cfg || cfg.enabled === false) return null;

        const sid = station && station.id;
        const lid = lineId;
        if (!sid || !lid) return null;

        // 逐站硬性关闭
        if (station.hideOperationStatus === true) return null;
        if (isHiddenByList(lid, sid)) return null;

        // 1. 车站对象自带字段逐站覆写（最高优先级，便于临时调整）
        //    注意：显式写空串 / false 表示「该站整站不显示」，与「未写该字段」语义不同。
        const direct = station.operationStatus ?? station.opStatus;
        if (direct != null) {
            if (direct && typeof direct === "object" && !Array.isArray(direct)) {
                if (direct.hidden === true || direct.enabled === false) return null;
                const picked = direct[lid] ?? direct.default ?? direct.text;
                if (picked !== undefined) {
                    const entry = normalizeEntry(picked);
                    return entry && !entry.hidden ? entry.text : null;
                }
                // 该对象未覆写本条线路 → 继续向下匹配
            } else {
                const entry = normalizeEntry(direct);
                return entry && !entry.hidden ? entry.text : null;
            }
        }

        // 2. 车站级配置（数据表）：命中该站即以其为准，写空串 / false / { hidden: true } 表示该站不显示
        const stEntry = cfg.stations ? cfg.stations[sid] : null;
        if (stEntry != null) {
            if (stEntry && typeof stEntry === "object" && !Array.isArray(stEntry)) {
                if (stEntry.hidden === true || stEntry.enabled === false) return null;
                const picked = stEntry[lid] ?? stEntry.default ?? stEntry.text;
                if (picked !== undefined) {
                    const entry = normalizeEntry(picked);
                    return entry && !entry.hidden ? entry.text : null;
                }
                // 该对象未覆写本条线路 → 继续向下匹配（线路级兜底）
            } else {
                const entry = normalizeEntry(stEntry);
                return entry && !entry.hidden ? entry.text : null;
            }
        }

        // 3. 未开通车站（type: "no"）统一文案
        if (station.type === "no") {
            const notOpen = normalizeEntry(cfg.notOpenText);
            return notOpen && !notOpen.hidden ? notOpen.text : null;
        }

        // 4. 线路级配置
        const lineEntry = cfg.lines ? cfg.lines[lid] : null;
        if (lineEntry != null) {
            const entry = normalizeEntry(lineEntry);
            if (entry) return entry.hidden ? null : entry.text;
        }

        // 5. 全路网兜底
        const fallback = normalizeEntry(cfg.default);
        return fallback && !fallback.hidden ? fallback.text : null;
    }

    /** 仅暴露解析函数，方便其他模块（如首末车时刻）复用同一份运营情况文案 */
    window.LanzhouOperationStatus = { resolve: resolveOperationStatus, data: LANZHOU_OPERATION_STATUS };

    function registerOperationStatusModule() {
        if (!window.StationBoard || typeof window.StationBoard.registerModule !== "function") {
            console.warn("[lanzhou_operation_status] StationBoard 尚未加载，延迟等待注册...");
            setTimeout(registerOperationStatusModule, 50);
            return;
        }

        window.StationBoard.registerModule({
            id: "lanzhou-operation-status",
            name: "运营情况",
            targetTab: "line-tab", // 挂在每条经停线路的选项卡内
            order: 90,             // 排在最末 → 即为线路选项卡最下方
            enabled: true,

            shouldRender(context) {
                if (!context || !context.isLineTab) return false;
                return Boolean(resolveOperationStatus(context.station, context.lineInfo && context.lineInfo.id));
            },

            render(context) {
                const text = resolveOperationStatus(context.station, context.lineInfo && context.lineInfo.id);
                if (!text) return "";

                // 严格复用核心引擎「上一站 / 下一站」的类名与行内样式，保证字体、字号、颜色完全一致
                return `
                    <div class="info-row lanzhou-operation-status">
                        <span class="info-label">运营情况</span>
                        <span class="info-value" style="line-height:1.4;">${text}</span>
                    </div>
                `;
            }
        });

        console.log("[lanzhou_operation_status] 兰州「运营情况」模块已成功挂载到 StationBoard。");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", registerOperationStatusModule, { once: true });
    } else {
        registerOperationStatusModule();
    }
})();
