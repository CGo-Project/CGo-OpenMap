/**
 * CGo OpenMap - 车站出入口垂直交通共享层
 *
 * 解决什么问题：官网设施数据把「无障碍电梯 / 自动扶梯」按位置逐段列出，
 * 其中一部分其实属于某个出入口（如「地面-站厅 A出入口附近」），
 * 与出入口页签的职责重叠。本层把这类段从车站设施板块搬到对应出口：
 *
 *   - `facilities.js` 渲染前用 `match(type, text)` 把已搬走的段过滤掉；
 *   - `exits.js` 渲染时用 `collect(facilities)` 取到每个出口名下的设施。
 *
 * 城市只声明两件事（写在各自 `{city}.js` 顶层的 `window.CGO_EXIT_VERTICAL`）：
 *
 *   window.CGO_EXIT_VERTICAL = {
 *       types: {
 *           elevator:     { name: "无障碍电梯", icon: "elevator",
 *                           patterns: [/^(地面-站厅|地面-过街通道-站厅|站厅-地面)/] },
 *           escalator_up: { name: "自动扶梯（上行）", icon: "escup",
 *                           patterns: [/^(站厅层|地下一层)/] },
 *           escalator_down: { name: "自动扶梯（下行）", icon: "escdown",
 *                             patterns: [/^地面层/] }
 *       }
 *   };
 *
 * patterns 优先取类型自己的；类型没写则回退到顶层的 patterns（大连即此写法）。
 *
 * ⚠️ 为什么必须「按类型」配前缀：
 * 同一句「站厅层 …出入口」对上行与下行的含义正好相反 ——
 * 上行扶梯在站厅层，是「站厅 → 地面出口」的起点，属于出口；
 * 下行扶梯在站厅层，是「站厅 → 站台层」的向下交通，与出口无关；
 * 真正属于出口的下行扶梯，其位置写的是「地面层」（地面 → 站厅）。
 * 三类共用一组前缀会把后两者混进来，故前缀必须绑定到类型上。
 *
 * ⚠️ 为什么判据是「前缀」而不是「文本里出现出口编号」：
 * 位置文本里既有「地面-站厅 A出入口附近」（出口本身就是起终点，该搬），
 * 也有「站厅-站台 A出入口附近」（站内垂直交通，只是位置靠近出口，不该搬）。
 * 两者都提到出口编号，只有前缀能区分二者。
 * 大连的「站外电梯：A口旁1台，站厅与站台中间位置1台」属站外开头、
 * 按本层设计整条搬走并保留原文（信息不丢，由城市自行取舍）。
 *
 * 配置在**渲染时**读取（而非加载时），故写在城市主脚本里即可，无须关心加载顺序。
 */
(function () {
    "use strict";

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    /** 位置段统一成纯文本（单线站存字符串，换乘站的段是 { line, text }） */
    const segText = (segment) => (typeof segment === "string" ? segment : (segment?.text || ""));

    const getConfig = () => (
        window.CGO_EXIT_VERTICAL && typeof window.CGO_EXIT_VERTICAL === "object"
            ? window.CGO_EXIT_VERTICAL
            : null
    );

    /**
     * 从位置文本解析出口编号。覆盖官网出现过的几种写法：
     *   「A、B出入口」「C1出入口」「A（出入口下段）、B（出入口下段）」「H口」「站外C,D」
     */
    function codesOf(text) {
        const codes = new Set();
        const push = (raw) => {
            for (const piece of String(raw).split(/[、,，和及]/)) {
                const code = piece.trim().toUpperCase();
                if (/^[A-Z]{1,2}\d{0,2}$/.test(code)) codes.add(code);
            }
        };
        const src = String(text || "");
        // 形式一：A、B出入口 / A出入口 / C1出入口
        for (const hit of src.match(/[A-Za-z]{1,2}\d{0,2}(?:\s*[、,，和及]\s*[A-Za-z]{1,2}\d{0,2})*\s*出入口/g) || []) {
            push(hit.replace(/出入口/g, ""));
        }
        // 形式二：A（出入口下段）
        for (const hit of src.match(/[A-Za-z]{1,2}\d{0,2}(?:\s*[、,，和及]\s*[A-Za-z]{1,2}\d{0,2})*\s*[（(]\s*出入口/g) || []) {
            push(hit.split(/[（(]/)[0]);
        }
        // 形式三：A口 / A1口（「出入口」里的「口」因前面不是字母而不会被误取）
        for (const hit of src.match(/[A-Za-z]{1,2}\d{0,2}\s*口/g) || []) push(hit.replace(/口/g, ""));
        // 形式四：站外C,D（整条以「站外」开头却漏写「口」字）
        if (/^站外/.test(src.trim())) {
            for (const hit of src.match(/[A-Za-z]{1,2}\d{0,2}(?:\s*[,，、]\s*[A-Za-z]{1,2}\d{0,2})*/g) || []) push(hit);
        }
        return [...codes].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    }

    /**
     * 该设施段是否属于「某个出入口的垂直交通」。
     * 前缀优先取类型自己的 patterns；类型未配则回退到顶层 patterns（大连即此写法）。
     */
    function match(type, text) {
        const config = getConfig();
        const meta = config?.types?.[type];
        if (!meta) return false;
        const patterns = meta.patterns || config.patterns || [];
        return patterns.some((re) => re.test(String(text || "").trim()));
    }

    /**
     * 汇总一座车站的出口垂直交通。
     * @returns {Map<string, Array<{type, name, icon, text}>>} 出口编号 → 该口名下的设施（按类型稳定排序）
     */
    function collect(facilities) {
        const config = getConfig();
        const byExit = new Map();
        if (!config?.types) return byExit;

        for (const facility of facilities || []) {
            const meta = config.types[facility?.type];
            if (!meta) continue;
            for (const segment of facility.location || []) {
                const text = segText(segment);
                if (!match(facility.type, text)) continue;
                for (const code of codesOf(text)) {
                    if (!byExit.has(code)) byExit.set(code, []);
                    const list = byExit.get(code);
                    if (!list.some((item) => item.type === facility.type && item.text === text)) {
                        list.push({ type: facility.type, name: meta.name, icon: meta.icon || "location", text });
                    }
                }
            }
        }
        // 同一出口下按配置里的类型顺序排列，保证渲染稳定
        const order = Object.keys(config.types);
        for (const list of byExit.values()) {
            list.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
        }
        return byExit;
    }

    /** 出口卡片里的设施行：图标 + 名称 + 原文（原文含运行时段，用 small 降级显示） */
    function rowHtml(item) {
        return `<div class="cgo-exit-row cgo-exit-vertical">
            <cgo-icon name="${escapeHtml(item.icon)}" size="13"></cgo-icon>
            <span>${escapeHtml(item.name)}${item.text ? ` <small>${escapeHtml(item.text)}</small>` : ""}</span>
        </div>`;
    }

    window.CGoExitVertical = { codesOf, match, collect, rowHtml };
})();
