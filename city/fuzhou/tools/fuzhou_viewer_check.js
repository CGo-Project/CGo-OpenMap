/**
 * CGo OpenMap - 福州车站空间示意图：设备分派与查看器自检
 * (city/fuzhou/tools/fuzhou_viewer_check.js)
 *
 * 零依赖、零构建、不需要浏览器。用法（在仓库根目录执行）：
 *
 *     node city/fuzhou/tools/fuzhou_viewer_check.js
 *
 * 这个文件为什么存在
 *   看大图有**两条路径**，由 `isTouchFirst()` 按主输入设备分派：
 *     · 桌面（精确指针）→ `<cgo-modal>` 卡片浮层（原有做法，宽屏观感已合适）；
 *     · 触屏（粗指针）  → 自带全屏查看器（缩放 + 平移，解决手机上的三个问题）。
 *
 *   分派走错、或者查看器的几何算法有偏差，浏览器里都**不会报错**：
 *   只是「桌面上多出一个全屏浮层」「手机上还是那个压得扁扁的卡片」「放大后图跑偏」
 *   「拖到底留白」。这些只能靠手感发现，回归时极容易被漏掉。
 *
 *   所以这里用一份最小 DOM 桩直接驱动**真实的 fuzhou_site_space.js**：
 *     ① 静态：两条路径的代码特征都在（桌面保留 84vh / 卡片；触屏段不得再出现 cgo-modal）；
 *     ② 分派：把 matchMedia 分别设成「粗指针」与「精确指针」，看创建的是哪个浮层；
 *     ③ 几何：适应屏幕的 contain 与居中、双指捏合锚点不漂移、拖动钳制、缩放下限、横竖屏切换。
 *
 * 与 fuzhou_check.js 的分工：那个查数据契约与配置一致性，这个查浮层分派与查看器算法。
 * 本文件是 Node 端脚本，浏览器不会请求，故不需要登记进 sw.js 的预缓存清单。
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CITY_DIR = path.resolve(__dirname, "..");
const MODULE_FILE = path.join(CITY_DIR, "modules", "fuzhou_site_space.js");

let passed = 0;
const failures = [];

function check(label, condition, detail) {
    if (condition) { passed += 1; return; }
    failures.push(detail ? `${label} —— ${detail}` : label);
}
function section(title) { process.stdout.write(`\n${title}\n`); }

/* ======================================================================
 * 最小 DOM 桩
 * ==================================================================== */
/** 典型手机舞台尺寸（竖屏） */
const PHONE = { left: 0, top: 0, width: 390, height: 600 };
const IMG_W = 2000;
const IMG_H = 1400;

function makeEl(tag) {
    const el = {
        tagName: String(tag).toUpperCase(),
        id: "",
        className: "",
        style: {},
        attributes: {},
        children: [],
        textContent: "",
        _handlers: {},
        _bySel: new Map(),
        _rect: { left: 0, top: 0, width: 0, height: 0 },
        _html: "",
        classList: (() => {
            const set = new Set();
            return {
                add: (c) => set.add(c),
                remove: (c) => set.delete(c),
                contains: (c) => set.has(c)
            };
        })(),
        addEventListener(type, fn) { (this._handlers[type] = this._handlers[type] || []).push(fn); },
        removeEventListener(type, fn) {
            const list = this._handlers[type] || [];
            const i = list.indexOf(fn);
            if (i >= 0) list.splice(i, 1);
        },
        dispatch(type, event) { (this._handlers[type] || []).slice().forEach((fn) => fn(event)); },
        setAttribute(k, v) { this.attributes[k] = v; },
        getAttribute(k) { return this.attributes[k]; },
        appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
        remove() {
            if (!this.parentNode) return;
            const i = this.parentNode.children.indexOf(this);
            if (i >= 0) this.parentNode.children.splice(i, 1);
            this.parentNode = null;
        },
        querySelector(sel) {
            if (!this._bySel.has(sel)) {
                const child = makeEl("div");
                child.parentNode = this;
                this._bySel.set(sel, child);
            }
            return this._bySel.get(sel);
        },
        focus() { },
        setPointerCapture() { },
        getBoundingClientRect() { return this._rect; }
    };
    Object.defineProperty(el, "innerHTML", {
        get() { return this._html; },
        set(v) { this._html = v; }
    });
    return el;
}

/**
 * 挂载模块。
 * @param {boolean} touchFirst 模拟「粗指针（手机/平板）」还是「精确指针（桌面）」
 * @param {string} [search] 模拟的 URL query（用于测 ?fzviewer= 覆盖）
 */
function mountModule(touchFirst, search) {
    const head = makeEl("head");
    const body = makeEl("body");
    const documentStub = {
        head,
        body,
        documentElement: makeEl("html"),
        _handlers: {},
        createElement: (tag) => makeEl(tag),
        getElementById: () => null,
        addEventListener(type, fn) { (this._handlers[type] = this._handlers[type] || []).push(fn); },
        removeEventListener(type, fn) {
            const list = this._handlers[type] || [];
            const i = list.indexOf(fn);
            if (i >= 0) list.splice(i, 1);
        }
    };

    const state = { registered: null, windowHandlers: {} };
    const sandbox = { console };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.document = documentStub;
    sandbox.matchMedia = (query) => ({ matches: touchFirst && /pointer:\s*coarse/.test(query) });
    // 模块用 new URLSearchParams(window.location.search) 读 ?fzviewer=，vm 上下文里需要显式注入
    sandbox.URLSearchParams = URLSearchParams;
    sandbox.location = { search: search || "" };
    sandbox.addEventListener = (t, f) => { (state.windowHandlers[t] = state.windowHandlers[t] || []).push(f); };
    sandbox.removeEventListener = (t, f) => {
        const list = state.windowHandlers[t] || [];
        const i = list.indexOf(f);
        if (i >= 0) list.splice(i, 1);
    };
    sandbox.StationBoard = { registerModule: (m) => { state.registered = m; } };
    sandbox.FUZHOU_SITE_SPACE_DATA = {};
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(MODULE_FILE, "utf8"), sandbox, { filename: "fuzhou_site_space.js" });

    return { sandbox, documentStub, state };
}

/** 模拟点一次「查看大图」 */
function clickViewBig(documentStub) {
    const handler = (documentStub._handlers.click || [])[0];
    const fakeLink = {
        getAttribute: (k) => (k === "data-fz-space-view" ? "https://example.com/map.jpg"
            : k === "data-fz-space-name" ? "东街口" : null)
    };
    handler({
        preventDefault() { },
        target: { closest: (sel) => (sel === "[data-fz-space-view]" ? fakeLink : null) }
    });
}

const findByProp = (list, key, value) => list.find((el) => el && el[key] === value);

/** 汇总并退出。抽成函数是为了「分派出错」时能立刻汇报，而不是让后续代码抛异常崩掉。 */
function report() {
    process.stdout.write(`\n${"─".repeat(60)}\n`);
    if (failures.length === 0) {
        process.stdout.write(`全部通过：${passed} 项断言\n`);
        process.exit(0);
    }
    process.stdout.write(`通过 ${passed} 项，失败 ${failures.length} 项：\n`);
    failures.forEach((item) => process.stdout.write(`  ✗ ${item}\n`));
    process.exit(1);
}

/* ======================================================================
 * 一、静态：两条路径的代码特征
 * ==================================================================== */
section("① 设备判定与双路径（静态）");
{
    const raw = fs.readFileSync(MODULE_FILE, "utf8");
    /** 去注释，只留代码 */
    const strip = (text) => text
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .split("\n").map((l) => l.replace(/(^|[^:])\/\/.*$/, "$1")).join("\n");

    const code = strip(raw);

    check("按主输入设备判定（pointer: coarse）", /pointer:\s*coarse/.test(code), "未找到能力判定");
    check("有 maxTouchPoints 兜底", /maxTouchPoints/.test(code), "matchMedia 不可用时无回退");
    check("桌面路径保留 cgo-modal 卡片", /createElement\("cgo-modal"\)/.test(code));
    check("桌面路径保留 84vh 原尺寸策略", /84vh/.test(code));

    // 段落标记写在块注释里，必须在**原文**上切分，再各自去注释做断言
    const deskStart = raw.indexOf("桌面：<cgo-modal> 卡片式浮层");
    const touchStart = raw.indexOf("触屏：全屏查看器样式");
    const dispatchStart = raw.indexOf("分派：按设备选路径");
    const deskPart = deskStart >= 0 && touchStart > deskStart ? strip(raw.slice(deskStart, touchStart)) : "";
    const touchPart = touchStart >= 0 && dispatchStart > touchStart ? strip(raw.slice(touchStart, dispatchStart)) : "";

    check("能切出桌面段与触屏段", Boolean(deskPart) && Boolean(touchPart),
        `touch=${touchPart.length} desk=${deskPart.length}`);
    check("桌面段含 cgo-modal", /cgo-modal/.test(deskPart));
    check("触屏段不再出现 cgo-modal", !/cgo-modal/.test(touchPart), "手机路径又回到卡片浮层");
    check("触屏段不再出现 84vh", !/84vh/.test(touchPart), "手机上手大图又被压扁");
    check("触屏段无 backdrop-filter", !/backdrop-filter/.test(touchPart), "全屏高斯模糊是卡顿主因");
    check("触屏查看器全屏（position:fixed + inset:0）",
        /position:\s*fixed/.test(touchPart) && /inset:\s*0/.test(touchPart));
    check("触屏舞台 touch-action:none", /touch-action:\s*none/.test(touchPart), "未接管手势会被浏览器抢走");
    check("只改 transform（合成层，不触发布局）",
        /translate3d/.test(touchPart) && /will-change:\s*transform/.test(touchPart));
    check("图标使用 CGoUI 组件", /<cgo-icon name="/.test(code));
    check("无 Emoji", !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(code));
}

/* ======================================================================
 * 二、分派：桌面 → cgo-modal；触屏 → 全屏查看器
 * ==================================================================== */
section("② 桌面端（精确指针）走原有 cgo-modal 卡片");
{
    const { documentStub, state } = mountModule(false);
    check("模块已注册", Boolean(state.registered));
    clickViewBig(documentStub);

    const modal = findByProp(documentStub.body.children, "id", "fuzhou-space-lightbox");
    const viewer = findByProp(documentStub.body.children, "id", "fuzhou-space-viewer");
    check("创建了 cgo-modal 卡片", Boolean(modal) && modal.tagName === "CGO-MODAL",
        modal ? modal.tagName : "未创建");
    check("没有创建全屏查看器", !viewer, "桌面上不该出现全屏浮层");
    check("卡片宽度上限为 min(1560px, 94vw)",
        Boolean(modal) && modal.attributes["max-width"] === "min(1560px, 94vw)",
        modal && modal.attributes["max-width"]);
    check("卡片内图片仍是 max-height:84vh", Boolean(modal) && /84vh/.test(modal.innerHTML || ""));
    check("已打开浮层", Boolean(modal) && modal.open === true);
    check("未锁页面滚动（卡片浮层不需要）",
        !documentStub.documentElement.style.overflow,
        String(documentStub.documentElement.style.overflow));
}

section("③ 触屏端（粗指针）走全屏查看器");
const touch = mountModule(true);
const { sandbox, documentStub, state } = touch;
clickViewBig(documentStub);
const root = findByProp(documentStub.body.children, "id", "fuzhou-space-viewer");
check("创建了全屏查看器", Boolean(root) && root.className === "fz-lb", root && root.className);
check("没有创建 cgo-modal 卡片",
    !findByProp(documentStub.body.children, "id", "fuzhou-space-lightbox"));
check("已锁页面滚动", documentStub.documentElement.style.overflow === "hidden");
check("声明了对话框语义",
    Boolean(root) && root.attributes["role"] === "dialog" && root.attributes["aria-modal"] === "true");

// 分派走错时这里就没有查看器了：立刻汇报，避免后面的 root.querySelector 抛异常把失败清单吞掉
if (!root) {
    check("触屏端能拿到查看器根节点（后续几何断言已跳过）", false, "分派疑似错误");
    report();
}

/* ======================================================================
 * 三之二、URL 覆盖：?fzviewer=touch|desktop（用于在电脑上比对两条路径）
 * ==================================================================== */
section("④ URL 覆盖参数 ?fzviewer=");
{
    /** 跑一次「挂载 → 点击」，返回创建出来的浮层类型 */
    const runOnce = (touchFirst, search) => {
        const m = mountModule(touchFirst, search);
        clickViewBig(m.documentStub);
        return {
            modal: findByProp(m.documentStub.body.children, "id", "fuzhou-space-lightbox"),
            viewer: findByProp(m.documentStub.body.children, "id", "fuzhou-space-viewer")
        };
    };

    const desktopForcedTouch = runOnce(false, "?city=fuzhou&fzviewer=touch");
    check("桌面 + ?fzviewer=touch → 全屏查看器",
        Boolean(desktopForcedTouch.viewer) && !desktopForcedTouch.modal,
        `viewer=${Boolean(desktopForcedTouch.viewer)} modal=${Boolean(desktopForcedTouch.modal)}`);

    const touchForcedDesktop = runOnce(true, "?fzviewer=desktop");
    check("触屏 + ?fzviewer=desktop → cgo-modal 卡片",
        Boolean(touchForcedDesktop.modal) && !touchForcedDesktop.viewer,
        `modal=${Boolean(touchForcedDesktop.modal)} viewer=${Boolean(touchForcedDesktop.viewer)}`);

    const invalidValue = runOnce(false, "?fzviewer=whatever");
    check("非法值回退到设备判定（桌面 → 卡片）",
        Boolean(invalidValue.modal) && !invalidValue.viewer,
        `modal=${Boolean(invalidValue.modal)} viewer=${Boolean(invalidValue.viewer)}`);

    const noParam = runOnce(true, "");
    check("不带参数时按设备判定（触屏 → 查看器）",
        Boolean(noParam.viewer) && !noParam.modal,
        `viewer=${Boolean(noParam.viewer)} modal=${Boolean(noParam.modal)}`);
}

const stage = root.querySelector(".fz-lb-stage");
const img = root.querySelector(".fz-lb-img");
const zoomLabel = root.querySelector(".fz-lb-zoom");
stage._rect = { ...PHONE };

/* ======================================================================
 * 三至七、触屏查看器的几何算法
 * ==================================================================== */
/** 解析 transform（浮点噪声可能写成 2.84e-14，需接受指数形式） */
function tf() {
    const m = /translate3d\(([-\d.e+]+)px,\s*([-\d.e+]+)px,\s*0\)\s*scale\(([-\d.e+]+)\)/
        .exec(img.style.transform || "");
    return m ? { tx: Number(m[1]), ty: Number(m[2]), s: Number(m[3]) } : null;
}
function imgPointAt(px, py) {
    const t = tf();
    return { x: (px - t.tx) / t.s, y: (py - t.ty) / t.s };
}
function pointer(type, id, x, y) {
    stage.dispatch(type, {
        pointerId: id, pointerType: "touch", button: 0,
        clientX: stage._rect.left + x, clientY: stage._rect.top + y
    });
}
/** 触发一次窗口尺寸变化（模块监听在 window 上） */
function fireResize() {
    (state.windowHandlers.resize || []).slice().forEach((fn) => fn());
}

const minFit = Math.min(PHONE.width / IMG_W, PHONE.height / IMG_H, 1);
const maxFit = Math.max(1, minFit * 2);

section("⑤ 适应屏幕：完整可见且居中");
{
    img.naturalWidth = IMG_W;
    img.naturalHeight = IMG_H;
    img.dispatch("load", {});
    const t = tf();
    check("transform 已设置", Boolean(t), img.style.transform);
    check("初始缩放 = contain", Math.abs(t.s - minFit) < 1e-6, `实际 ${t.s}, 期望 ${minFit}`);
    check("图片整体落在舞台内",
        IMG_W * t.s <= PHONE.width + 0.5 && IMG_H * t.s <= PHONE.height + 0.5,
        `${(IMG_W * t.s).toFixed(0)}×${(IMG_H * t.s).toFixed(0)} > ${PHONE.width}×${PHONE.height}`);
    check("水平居中", Math.abs(t.tx - (PHONE.width - IMG_W * t.s) / 2) < 0.5, `tx=${t.tx}`);
    check("垂直居中", Math.abs(t.ty - (PHONE.height - IMG_H * t.s) / 2) < 0.5, `ty=${t.ty}`);
    check("缩放指示为 100%", zoomLabel.textContent === "100%", zoomLabel.textContent);
    check("图片按原始像素布局（缩放交给 transform）",
        img.style.width === `${IMG_W}px` && img.style.height === `${IMG_H}px`,
        `${img.style.width}×${img.style.height}`);
}

section("⑥ 双指捏合：锚点不跳");
{
    const midX = 200, midY = 300;
    const before = imgPointAt(midX, midY);
    const baseScale = tf().s;
    pointer("pointerdown", 1, 150, 300);
    pointer("pointerdown", 2, 250, 300);            // 相距 100，中点 (200,300)
    pointer("pointermove", 1, 100, 300);
    pointer("pointermove", 2, 300, 300);            // 张开到 200 → 放大 2 倍
    const after = imgPointAt(midX, midY);
    const drift = Math.hypot(after.x - before.x, after.y - before.y);
    const t = tf();
    check("已放大", t.s > baseScale, `${baseScale} → ${t.s}`);
    check("中点下的图片内容未漂移", drift < 1, `漂移 ${drift.toFixed(2)} 图片像素`);
    check("未超出缩放上限", t.s <= maxFit + 1e-6, `${t.s} ≤ ${maxFit}`);
    pointer("pointerup", 1, 100, 300);
    pointer("pointerup", 2, 300, 300);
}

section("⑦ 平移钳制：图边不脱离可视区");
{
    pointer("pointerdown", 3, 200, 300);
    pointer("pointermove", 3, -400, 300);           // 向左拖 600px
    let t = tf();
    const minTx = PHONE.width - IMG_W * t.s;
    check("向左拖到底：右边缘停靠", Math.abs(t.tx - minTx) < 0.5, `tx=${t.tx}, 期望 ${minTx}`);
    check("tx 落在允许区间", t.tx <= 0.5 && t.tx >= minTx - 0.5, `[${minTx}, 0]`);

    pointer("pointermove", 3, 900, 300);            // 反向拖到底
    t = tf();
    check("向右拖到底：左边缘停靠（tx=0）", Math.abs(t.tx) < 0.5, `tx=${t.tx}`);
    pointer("pointerup", 3, 900, 300);
}

section("⑧ 缩放下限：不会比「适应屏幕」更小");
{
    pointer("pointerdown", 4, 150, 300);
    pointer("pointerdown", 5, 250, 300);
    pointer("pointermove", 4, 195, 300);
    pointer("pointermove", 5, 205, 300);            // 收拢到 10px
    const t = tf();
    check("收敛到下限", Math.abs(t.s - minFit) < 1e-6, `实际 ${t.s}, 期望 ${minFit}`);
    check("缩到下限后自动居中",
        Math.abs(t.tx - (PHONE.width - IMG_W * t.s) / 2) < 0.5, `tx=${t.tx}`);
    pointer("pointerup", 4, 195, 300);
    pointer("pointerup", 5, 205, 300);
}

section("⑨ 舞台尺寸变化（横竖屏切换）");
{
    stage._rect = { left: 0, top: 0, width: 700, height: 380 };
    (state.windowHandlers.resize || []).slice().forEach((fn) => fn());
    const t = tf();
    const minLand = Math.min(700 / IMG_W, 380 / IMG_H, 1);
    const maxLand = Math.max(1, minLand * 2);
    check("缩放重新收敛进合法区间",
        t.s >= minLand - 1e-6 && t.s <= maxLand + 1e-6,
        `${t.s} ∉ [${minLand}, ${maxLand}]`);
    check("横屏后图片仍完整可见",
        IMG_W * t.s <= 700 + 0.5 && IMG_H * t.s <= 380 + 0.5,
        `${(IMG_W * t.s).toFixed(0)}×${(IMG_H * t.s).toFixed(0)}`);
}

/* ======================================================================
 * 十、已放大时尺寸变化但最小缩放不变：必须保留放大状态（issue #54）
 * ==================================================================== */
section("⑩ 已放大 + 尺寸变化但 min 不变：保留放大状态（#54）");
{
    // 回到竖屏，让 scale 重新贴合
    stage._rect = { ...PHONE };
    fireResize();
    const minPortrait = Math.min(PHONE.width / IMG_W, PHONE.height / IMG_H, 1);

    // 滚轮放大两档
    stage.dispatch("wheel", { preventDefault() { }, clientX: 195, clientY: 300, deltaY: -100 });
    stage.dispatch("wheel", { preventDefault() { }, clientX: 195, clientY: 300, deltaY: -100 });
    const zoomed = tf().s;
    check("前提：已放大到适应屏幕之上", zoomed > minPortrait + 1e-6,
        `${zoomed} ≤ ${minPortrait}`);

    // 只加高舞台：宽度仍是 390，contain 的 min 不变
    stage._rect = { left: 0, top: 0, width: PHONE.width, height: PHONE.height + 240 };
    fireResize();
    const t = tf();
    const minAfter = Math.min(PHONE.width / IMG_W, (PHONE.height + 240) / IMG_H, 1);
    check("前提：调整前后最小缩放比例相同", Math.abs(minAfter - minPortrait) < 1e-9,
        `${minPortrait} → ${minAfter}`);
    check("放大状态被保留，不再意外缩回适应屏幕", Math.abs(t.s - zoomed) < 1e-6,
        `${zoomed} → ${t.s}`);
    const maxAfter = Math.max(1, minAfter * 2);
    check("保留后的缩放仍在合法区间", t.s >= minAfter - 1e-6 && t.s <= maxAfter + 1e-6,
        `${t.s} ∉ [${minAfter}, ${maxAfter}]`);

    // 对照：原本就贴合屏幕的，尺寸变化后应继续贴合（不能把这条行为改坏）
    root.querySelector('[data-act="reset"]').dispatch("click", {});
    check("对照：点「适应屏幕」后回到 min", Math.abs(tf().s - minAfter) < 1e-6,
        `${tf().s} vs ${minAfter}`);

    stage._rect = { left: 0, top: 0, width: 330, height: PHONE.height };
    fireResize();
    const minNarrow = Math.min(330 / IMG_W, PHONE.height / IMG_H, 1);
    check("原本贴合的图片随新尺寸重新贴合", Math.abs(tf().s - minNarrow) < 1e-6,
        `${tf().s} vs ${minNarrow}`);
}

/* ======================================================================
 * 汇总
 * ==================================================================== */
report();
