/**
 * CGo OpenMap - 反馈面板共享层
 *
 * 站内所有「向维护者反馈数据问题」的地方都走这里：
 *   - 出入口说明缺失 —— exits.js 的「待补充」标（kind: "exit"）
 *   - 题字素材缺失   —— calligraphy.js 的投稿按钮（kind: "calligraphy"）
 *   - 右上角「更多」菜单里的通用入口（本模块自己注册 general / timetable / fare）
 *
 * 面板只做三件事：
 *   1. 把**定位信息**拼成一段可复制的正文（城市 / 车站 ID / 相关数据文件路径）——
 *      维护者据此可直接定位到那一行数据，省一轮来回；
 *   2. 给出出口：复制、新建 GitHub Issue（预填标题与正文）、加入官方 QQ 群；
 *   3. 剪贴板不可用（非 https / localhost）时退回「选中正文 + 提示手抄」。
 *
 * 场景（kind）由使用方注册；本模块只内置通用入口自己要用的三种：
 *
 *   CGoFeedback.registerKind("exit", { label, modalTitle, heading, subject, context, notePlaceholder });
 *   CGoFeedback.open({ kind: "exit", cityId, stationId, stationCn, exitCode, reason, extra });
 *
 * 模板字段（label 之外都必需）：
 *   label           场景选择器里的名字；**不写则不参与场景切换**
 *                   （出口说明、题字投稿都有自己的触发点，不需要出现在通用入口的切换里）
 *   modalTitle      面板标题
 *   heading(ctx)    面板顶部一行
 *   subject(ctx)    Issue 标题
 *   context(ctx)    正文行数组
 *   notePlaceholder 备注框提示
 * 调用方另可传 `reason`（缺失/异常的具体说明）与 `extra`（附加正文行数组）。
 *
 * 仓库地址与 QQ 群是**项目级常量**（不含任何城市私有信息，故不违反共享层的解耦约定），
 * 可用 window.CGO_FEEDBACK_REPO / CGO_FEEDBACK_QQ / CGO_FEEDBACK_QQ_URL 覆盖；
 * 后者置空串则该按钮不出现。
 *
 * 「更多」菜单的入口由本模块在运行时补进 main.html 的下拉里（不侵入 main.html / core），
 * 与 sidebar-refit、map-tools 的做法一致。
 *
 * @event cgo:feedback-opened { kind: string }
 */
(function () {
    "use strict";

    const STYLE_FLAG_ATTR = "data-cgo-feedback-style";

    /** 样式注入：按脚本自身 URL 找同名 css，query（?v=）原样搬过去（同 exits.js 的做法）。
        ⚠️ 必须在**脚本执行期**读 currentScript：registerKind 由城市模块在别的脚本里调用，
        那时 currentScript 已指向城市脚本，据此推导会得到错误的 css 路径。 */
    const SELF_URL = document.currentScript?.src || "";

    function injectStyle() {
        if (!SELF_URL) return;
        if (document.head?.querySelector(`link[${STYLE_FLAG_ATTR}]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = SELF_URL.replace(/feedback\.js(\?|$)/, "feedback.css$1");
        link.setAttribute(STYLE_FLAG_ATTR, "");
        (document.head || document.documentElement).appendChild(link);
    }

    /* ── 项目级常量 ────────────────────────────────────────────── */
    /** 反馈 Issue 的去向：本项目上游仓库；老路径 NokiaimuL/CGo-OpenMap 会 301 到它 */
    const FEEDBACK_REPO = "https://github.com/CGo-Project/CGo-OpenMap";
    /** 官方 QQ 交流群（群号用于 title，分享链接用于点击） */
    const QQ_GROUP = "619357751";
    const QQ_GROUP_URL = "https://qm.qq.com/q/nHfgBDS68o";
    const MODAL_ID = "cgo-feedback-modal";
    const MENU_ENTRY_ID = "cgo-feedback-entry";

    const feedbackRepo = () => window.CGO_FEEDBACK_REPO || FEEDBACK_REPO;
    const qqGroup = () => (window.CGO_FEEDBACK_QQ === undefined ? QQ_GROUP : window.CGO_FEEDBACK_QQ);
    const qqGroupUrl = () => (window.CGO_FEEDBACK_QQ_URL === undefined ? QQ_GROUP_URL : window.CGO_FEEDBACK_QQ_URL);
    /** 城市名取自注册表（与「帮助与关于」同一数据源，不在此硬编码城市名单） */
    const cityNameOf = (cityId) => window.CITY_REGISTRY?.[cityId]?.name || cityId || "";

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    /* ── 场景模板 ─────────────────────────────────────────────── */
    const KINDS = new Map();

    /**
     * 注册 / 覆盖一个场景模板。
     * 早于本模块执行的使用方（罕见）可反复调用，后注册的同名模板覆盖前者。
     */
    function registerKind(id, template) {
        if (!id || !template) return;
        KINDS.set(String(id), template);
    }

    /** 通用反馈的三种场景：没有天然上下文，靠用户在选择器里挑 + 备注里写细节 */
    registerKind("general", {
        label: "其他 / 综合",
        modalTitle: "反馈与纠错",
        heading: ({ cityName }) => `${cityName} 线路图`,
        subject: ({ cityName }) => `【反馈】${cityName} 线路图`,
        notePlaceholder: "请描述你遇到的问题，或想建议的内容（选填）",
        context: ({ cityId, cityName, extra }) => [
            `【线路图反馈】${cityName}`,
            "",
            `- 城市：${cityName}（${cityId}）`,
            "- 反馈对象：线路图（站位 / 线网走向 / 排版 / 功能建议等）",
            ...(extra || [])
        ]
    });
    registerKind("timetable", {
        label: "首末班车时间",
        modalTitle: "反馈首末班车时间",
        heading: ({ cityName, stationCn }) => `${cityName}${stationCn ? ` ${stationCn}` : ""} · 首末班车`,
        subject: ({ cityName, stationCn }) => `【首末班车】${cityName}${stationCn ? ` ${stationCn}` : ""} 时刻疑似有误`,
        notePlaceholder: "请写明：线路、方向（往哪个终点站）、平日/节假日、首班还是末班，以及你看到的实际时刻",
        context: ({ cityId, cityName, stationId, stationCn, extra }) => [
            `【首末班车反馈】${cityName}${stationCn ? ` ${stationCn}` : ""}`,
            "",
            `- 城市：${cityName}（${cityId}）`,
            ...(stationCn ? [`- 车站：${stationCn}${stationId ? `（${stationId}）` : ""}`] : []),
            `- 数据文件：city/${cityId}/data_timetable.js`,
            "- 请写明：线路、方向、平日/节假日、首班或末班，以及实际时刻。",
            ...(extra || [])
        ]
    });
    registerKind("fare", {
        label: "票价",
        modalTitle: "反馈票价",
        heading: ({ cityName }) => `${cityName} · 票价`,
        subject: ({ cityName }) => `【票价】${cityName} 票价疑似有误`,
        notePlaceholder: "请写明：起点站、终点站，以及你实际支付的票价",
        context: ({ cityId, cityName, extra }) => [
            `【票价反馈】${cityName}`,
            "",
            `- 城市：${cityName}（${cityId}）`,
            `- 计费规则：city/${cityId}/${cityId}.js 的 CGO_ROUTE_CONFIG.fare`,
            "- 请写明：起点站、终点站、实际票价（如换乘涉及不同计费系统也请说明）。",
            ...(extra || [])
        ]
    });

    /* ── 面板 ─────────────────────────────────────────────────── */
    function feedbackModal() {
        let el = document.getElementById(MODAL_ID);
        if (!el) {
            el = document.createElement("cgo-modal");
            el.id = MODAL_ID;
            el.setAttribute("max-width", "460px");
            document.body.appendChild(el);
        }
        return el;
    }

    const pickable = () => [...KINDS.entries()].filter(([, t]) => t && t.label);

    /**
     * 打开反馈面板。ctx 里除模板所需的定位信息外，还可带：
     *   switchable  是否显示场景选择器（「更多」菜单的通用入口会打开它）
     *   note        备注初值（切换场景时用于保留用户已输入的内容）
     */
    function open(ctx = {}) {
        const fallback = KINDS.has("general") ? "general" : [...KINDS.keys()][0];
        const kindId = KINDS.has(ctx.kind) ? ctx.kind : fallback;
        const kind = KINDS.get(kindId);
        if (!kind) return;

        const info = { ...ctx, kind: kindId, cityName: cityNameOf(ctx.cityId) };
        const base = `${kind.context(info).join("\n")}\n\n补充说明（选填）：`;
        const scenes = ctx.switchable ? pickable() : [];

        const modal = feedbackModal();
        modal.title = kind.modalTitle;
        modal.innerHTML = `
            <div class="cgo-fb">
                ${scenes.length > 1 ? `<div class="cgo-fb-scene">
                    ${scenes.map(([id, t]) => `<button type="button" class="cgo-fb-scene-btn${id === kindId ? " is-on" : ""}" data-scene="${escapeHtml(id)}">${escapeHtml(t.label)}</button>`).join("")}
                </div>` : ""}
                <p class="cgo-fb-head">${escapeHtml(kind.heading(info))}</p>
                <div class="cgo-fb-context" data-context></div>
                <textarea class="cgo-fb-note" data-note rows="3" placeholder="${escapeHtml(kind.notePlaceholder)}"></textarea>
                <div class="cgo-fb-actions">
                    <button type="button" class="cgo-fb-btn" data-act="copy"><cgo-icon name="copy" size="13"></cgo-icon><span data-copy-label>复制</span></button>
                    <button type="button" class="cgo-fb-btn primary" data-act="issue"><cgo-icon name="external" size="13"></cgo-icon>新建 GitHub Issue</button>
                    ${qqGroupUrl() ? `<button type="button" class="cgo-fb-btn" data-act="qq" title="官方 QQ 交流群 ${escapeHtml(String(qqGroup()))}"><cgo-icon name="chat" size="13"></cgo-icon>加入 QQ 群</button>` : ""}
                    <button type="button" class="cgo-fb-btn ghost" data-act="close"><cgo-icon name="close" size="13"></cgo-icon>关闭</button>
                </div>
            </div>
        `;
        const contextEl = modal.querySelector("[data-context]");
        const noteEl = modal.querySelector("[data-note]");
        const copyLabel = modal.querySelector("[data-copy-label]");
        // 正文用 textContent 落地（不拼 HTML），备注由用户自己填
        contextEl.textContent = base;
        noteEl.value = ctx.note || "";

        const compose = () => {
            const note = noteEl.value.trim();
            return note ? `${base}\n${note}` : base;
        };
        const selectContext = () => {
            const range = document.createRange();
            range.selectNodeContents(contextEl);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        };

        // 场景切换：换一套模板重开面板，把用户已写的备注带过去
        modal.querySelectorAll("[data-scene]").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (btn.dataset.scene === kindId) return;
                open({ ...ctx, kind: btn.dataset.scene, note: noteEl.value });
            });
        });

        modal.querySelectorAll("[data-act]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const act = btn.dataset.act;
                if (act === "close") { modal.open = false; return; }
                if (act === "issue") {
                    const query = new URLSearchParams();
                    query.set("title", kind.subject(info));
                    query.set("body", compose());
                    window.open(`${feedbackRepo()}/issues/new?${query.toString()}`, "_blank", "noopener");
                    modal.open = false;
                    return;
                }
                if (act === "qq") {
                    // 群分享链接（qm.qq.com）：移动端唤起 QQ、桌面端打开加群页
                    window.open(qqGroupUrl(), "_blank", "noopener");
                    modal.open = false;
                    return;
                }
                // 复制：剪贴板 API 需要安全上下文（https / localhost），失败就退回手动选中
                try {
                    await navigator.clipboard.writeText(compose());
                    copyLabel.textContent = "已复制";
                } catch {
                    selectContext();
                    copyLabel.textContent = "请按 Ctrl+C";
                }
                setTimeout(() => { copyLabel.textContent = "复制"; }, 1600);
            });
        });

        modal.open = true;
        document.dispatchEvent(new CustomEvent("cgo:feedback-opened", { detail: { kind: kindId } }));
    }

    /* ── 「更多」菜单入口（运行时补进 main.html 的下拉，不侵入 main.html / core）── */
    function registerMenuEntry() {
        const content = document.querySelector(".options-dropdown .dropdown-content");
        if (!content || content.querySelector(`#${MENU_ENTRY_ID}`)) return Boolean(content);
        const entry = document.createElement("a");
        entry.href = "javascript:void(0)";
        entry.id = MENU_ENTRY_ID;
        entry.innerHTML = `<cgo-icon name="chat"></cgo-icon><span>反馈与纠错</span>`;
        entry.addEventListener("click", () => open({ kind: "general", switchable: true }));
        content.appendChild(entry);
        return true;
    }

    // 城市脚本用 document.write 引入本模块，执行时页头已解析；万一还没到（布局不同），
    // 再等一次 DOMContentLoaded，避免入口静默丢失。
    injectStyle();
    if (!registerMenuEntry()) {
        document.addEventListener("DOMContentLoaded", registerMenuEntry, { once: true });
    }

    window.CGoFeedback = { open, registerKind, kinds: KINDS };
})();
