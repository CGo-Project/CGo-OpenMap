/**
 * CGo OpenMap - 线网发展史（视频导出层，city/shenyang/shared/tools/opening-history.export.js）
 *
 * 从 opening-history.js 拆出的「导出视频」：逐帧栅格化（paintFrame）、进度卡绘制
 * （drawCard / drawDisclaimer / drawWatermark）、WebCodecs 编码与封装（runExport）、
 * 导出区控件绑定与状态同步。渲染仍走内核的 applyFrame(t)，两者共用同一条时间轴。
 * 由内核经 window.CGoOpeningHistoryShared 注入；导出入口由内核在 mount 时调用。
 * 两个布局常量 EXPORT / CARD 也挂回共享层 —— 内核的 viewportBox 要按它们算导出安全区。
 *
 * ⚠️ 加载顺序：必须晚于 opening-history.js。改本文件后记得同步递增缓存版本串。
 */
(function () {
    const SHARED = window.CGoOpeningHistoryShared;
    if (!SHARED) {
        console.warn("[线网发展史] opening-history.export.js 需在 opening-history.js 之后加载，已跳过");
        return;
    }
    const { NS, LAYER_ID, STYLE_ID, TOOL_ID, STAGE_CLASS, POP_CLASS, DOT_CLASS, NO_CLASS, NO_SHAPE_CLASS, NO_ICON_CLASS, DOT_ICON_CLASS, ON_CLASS, ALWAYS_CLASS, GONE_CLASS, HOST_CLASS, DUP_LABEL_CLASS, BODY_CLASS, SPEED, ZOOM, POP_BASE, STOP_HOLD, STOP_STAGGER, FREE_SWITCH_HOLD, CONV_MIN, T, SCALE_FLOOR, MOBILE_MAX, KIND_LABEL, STATE_LABEL, badgeOf, isWithdrawal, REDUCE, esc, state, clearTimers, glideMs, holdMs, growDuration, dist, pathCache, sampleCorePath, segLength, pointAt, projectOnPath, slicePath, toD, arcOf, pointAtMulti, tOnStep, bboxOf, stepLabel, canExportVideo, stationMap, linesData, lineStations, byLineId, stationRangeOf, eventOps, findOpIndex, soleOnLine, pushScaleLimit, popScaleLimit, stageHost, pinnedObserver, watchPinned, unwatchPinned, resetMapSelection, enterStage, exitStage, applyAnimDurations, reseek, calloutOf, dotColorOf, themeVar, setNoIcon, applyForm, setDotIcon, popStation, calloutObserver, repaintCallouts, watchCallouts, unwatchCallouts, resyncShown, isOnCanvas, syncVirtualConnectors, syncRdotLabels, syncOffStationLinks, syncPhantomHosts, syncGhostForms, syncGhostLabels, ghostPointAt, visiblePointOf, alignEndsToVisible, trimEndToPoint, realignArchivedPaths, realignPiecePaths, realignLiveSegs, syncConnectorEnds, onPhantomClick, markAlwaysOn, clearMarks, layer, doneGroup, liveGroup, clearCanvas, viewportBox, cnSpanOf, enSpanOf, MN_LANG, altSpanOf, applyNameAt, restoreNames, applyNewName, bezier, EASE, EASE_OUT, EASE_POP, clampZoom, camForPoint, camForBox, camLerp, brushAt, expandBoxByLabels, camTailOf, camWholeOf, growthPhases, phaseAtDt, progAtDt, timeOfProg, stepStops, buildTimeline, recAt, camAt, applyPopProgress, ripple, leaveStation, showStation, ensureGrowPath, applyFrame, syncRenameNames, applyRenameAt, makeHollowMask, makeSegPiece, applyPieceStyle, pieceLen, applyPieceProgress, convertRange, applyConvs, commitPath, pad2, lerpDate, setTrack, lineCountAround, panelModel, applyPanel, scrollListToActive, renderBody, syncToggle, renderList, trackPercentAt, syncNow, syncPlayBtn, startPlayback, tick, play, pause, reset, replay, jumpTo, mount, unmount, phantomIds, watchPhantomNodes, hasData, register } = SHARED;
    const { COUNT_CHIPS } = SHARED;   // 四笔计数的展示定义（与面板清单同源同序）

    /* ======================================================================
     * 导出视频：逐帧渲染（与播放共用同一条时间轴）
     * ====================================================================
     * 一帧 = 把 `applyFrame(t)` 之后的**图形层**（去掉站名整层）栅格化，再用 canvas
     * `fillText` 把站名叠上去。之所以把站名从 SVG 里拿出来：内联字体会让每帧的 SVG
     * 涨到 6MB、光序列化就 530ms（实测），而 canvas 文字直接吃页面里已经加载好的 webfont。
     * 相机**不作为 DOM transform** 参与导出 —— 它是渲染时的 canvas 变换，于是文字按最终
     * 分辨率栅格化，比「先渲染再缩放」清晰。
     */

    const EXPORT = {
        width: 1280,
        height: 720,
        fps: 30,
        bitrate: 6000000,
        codec: "avc1.640028",
        muxerSrc: "./city/shenyang/shared/tools/vendor/mp4-muxer.min.js"
    };

    /** 站名的位置与字体样式只量一次 —— 逐帧量 400 个标签的 getComputedStyle 要 60ms */
    let labelCache = null;

    /** 视频清单的**平滑滚动位置**：跨帧保持、向目标缓动 —— 做出「滚动跟随」的过渡，
     *  而不是逐帧瞬移（用户验收：视频里的清单滚动要有动画过渡）。每次导出开始时重置。 */
    let listTopSmooth = null;

    /** 清单里「当前项」高亮块的平滑位置与高度：切换事件时补间滑过去（形状/位置补间）。 */
    let hlSmooth = null;

    /**
     * 从**当前 DOM** 取某个站名的逐行文字与行宽（与 buildLabelCache 同一套拆行法：按 <br> 拆）。
     * 导出逐帧都用它，不读缓存里的文字 —— 更名事件改写的名字要能立刻出现在视频画面里。
     */
    function liveLabelLines(L, ctx2d) {
        const el = L.el;
        if (!el) return null;
        const raw = [];
        let cur = "";
        el.childNodes.forEach((c) => {
            if (c.nodeName === "BR") { raw.push(cur); cur = ""; }
            else cur += c.textContent || "";
        });
        raw.push(cur);
        if (!raw.some((t) => t)) return null;
        return raw.map((t) => ({ text: t, w: ctx2d.measureText(t).width }));
    }

    /**
     * 更名换字时该站名当前的淡入淡出系数：直接读 DOM 上由 `applyRenameAt` 写在 span 的
     * inline opacity（没有在换字时是空串 → 1）。用 inline style 读，不触发样式计算。
     */
    function renameAlphaOf(L) {
        const v = L.el && L.el.style ? parseFloat(L.el.style.opacity) : NaN;
        return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
    }

    function buildLabelCache() {
        const host = stageHost();
        const mc = document.getElementById("map-content");
        if (!host || !mc) return [];
        const view = window.getMapView ? window.getMapView() : { scale: 1, x: 0, y: 0 };
        const mr = mc.getBoundingClientRect();
        const probe = document.createElement("canvas").getContext("2d");
        const out = [];
        host.querySelectorAll("#labels-layer .label-group").forEach((g) => {
            const sid = g.dataset.sid || "";
            // ⚠️ 演示期的两类「临时隐藏」不能当成「永远看不到」：主点让位（HOST_CLASS）与同名
            //    幽灵点去重（DUP_LABEL_CLASS）都是 `display:none !important`，但会随事件推进恢复，
            //    其显隐由**绘制时逐帧判定**（见 paintFrame 的剔除 + alphaAt）。
            //    这里先把类摘掉再测量、量完还原 —— 否则**导出起点正处于让位期**时，那座站的
            //    主点标签从未进缓存，整段视频里就永久缺名（用户实测：解放桥等「由幽灵图元转为
            //    tsf」的站，在开通站内换乘那一拍之后就再没有站名；而本缓存只在导出开始时建一次）。
            const hostOff = g.classList.contains(HOST_CLASS);
            const dupOff = g.classList.contains(DUP_LABEL_CLASS);
            if (hostOff || dupOff) g.classList.remove(HOST_CLASS, DUP_LABEL_CLASS);
            g.querySelectorAll(".stacn, .staen").forEach((sp) => {
                const cs = getComputedStyle(sp);
                if (cs.display === "none" || cs.visibility === "hidden") return;
                const r = sp.getBoundingClientRect();
                if (r.width < 0.5 || r.height < 0.5) return;
                const size = parseFloat(cs.fontSize);
                const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
                const spacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
                probe.font = font;
                if ("letterSpacing" in probe) probe.letterSpacing = spacing;
                // 站名里的 <br> 是数据自带的排版换行（英文长名常有 2~3 行）。canvas 画不到 <br>，
                // 必须自己拆行、逐行落位，否则整串会被画成一行，位置与页面完全对不上。
                const lines = [];
                let cur = "";
                sp.childNodes.forEach((c) => {
                    if (c.nodeName === "BR") { lines.push(cur); cur = ""; }
                    else cur += c.textContent || "";
                });
                lines.push(cur);
                if (!lines.some((t) => t)) return;
                const met = probe.measureText(lines.find((t) => t) || "中");
                // 站名可能带 scaleX（station.textScale），缩放锚点在 transform-origin 上
                const m = /matrix\(([-\d.]+)[, ]+[-\d.]+[, ]+[-\d.]+[, ]+[-\d.]+[, ]+([-\d.]+)/.exec(cs.transform || "");
                const sx = m ? parseFloat(m[1]) : 1;
                const orgPct = parseFloat(cs.transformOrigin) / 100;
                const boxW = r.width / view.scale;
                const boxH = r.height / view.scale;
                out.push({
                    el: sp, sid: sid,
                    // 画布坐标（与相机无关）：把屏幕矩形反解回未变换的画布
                    x: (r.left - mr.left) / view.scale,
                    y: (r.top - mr.top) / view.scale,
                    boxW: boxW,
                    // 行盒高：整块高 ÷ 行数（页面 line-height 由 CSS 统一给，这样最稳）
                    lh: boxH / Math.max(1, lines.length),
                    lines: lines.map((t) => ({ text: t, w: t ? probe.measureText(t).width : 0 })),
                    // 行盒内对齐：页面由 .label-group 的 text-align 决定，canvas 得自己补偏移
                    align: cs.textAlign,
                    ascent: met.fontBoundingBoxAscent || size * 0.8,
                    descent: met.fontBoundingBoxDescent || size * 0.2,
                    font: font,
                    spacing: spacing,
                    color: cs.color,
                    strokeW: parseFloat(cs.webkitTextStrokeWidth) || 0,
                    strokeColor: cs.webkitTextStrokeColor,
                    sx: sx,
                    anchorX: (r.left - mr.left) / view.scale + (Number.isFinite(orgPct) ? orgPct : 0) * boxW
                });
            });
            if (hostOff) g.classList.add(HOST_CLASS);
            if (dupOff) g.classList.add(DUP_LABEL_CLASS);
        });
        return out;
    }

    /**
     * 该站此刻的可见度（0~1）。**不读 DOM**：已弹过的站按 `state.shown` 直接判定，
     * 正在弹的用时间轴上的进度算 —— 逐帧 getComputedStyle 正是要避免的开销。
     */
    function alphaAt(sid, t) {
        if (state.alwaysOn.has(sid)) return 1;
        // 出站换乘期间主点让位（与画面同一口径，见 syncPhantomHosts）—— 导出逐帧走这里，
        // 不能让视频里还留着交叉点上那颗共用的站图元
        if (state.timeline) {
            const i = recAt(t).i;
            if ((state.offPairs || []).some((p) => p.host === sid && p.ghostIn != null
                && i >= p.ghostIn && i < p.ghostOut)) return 0;
        }
        const ap = state.activePops.find((p) => p.sid === sid);
        if (ap) return Math.max(0, Math.min(1, EASE_POP(state.popDur > 0 ? (t - ap.t0) / state.popDur : 1)));
        return state.shown.has(sid) ? 1 : 0;
    }

    /** 把一帧画到 canvas：图形层（栅格化）+ 站名（canvas 文字），相机作为 canvas 变换 */
    async function paintFrame(canvas, t, ctx2d) {
        const mc = document.getElementById("map-content");
        if (!mc) return;
        const W = Math.round(mc.offsetWidth), H = Math.round(mc.offsetHeight);
        const cam = camAt(t) || { x: 0, y: 0, scale: 1 };
        const cw = canvas.width, ch = canvas.height;
        const hostW = mc.parentElement ? mc.parentElement.clientWidth : cw;
        const hostH = mc.parentElement ? mc.parentElement.clientHeight : ch;
        // 「盖住取景」：整体铺满 720p（等比放大到覆盖，超出部分裁掉），内容始终在中央
        const k = Math.max(cw / hostW, ch / hostH);
        const ox = (cw - hostW * k) / 2, oy = (ch - hostH * k) / 2;
        const s = cam.scale * k;

        // ── 图形层：克隆 → 藏站名 → 变量搬到根上 → 外部图片换 data URL → 栅格化 ──
        const clone = mc.cloneNode(true);
        clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        clone.style.transform = "none";
        // ⚠️ foreignObject 里没有 :root，`:root { --x: … }` 一条都匹配不上 → 变量要逐个搬
        [document.documentElement, document.body].forEach((src) => {
            const cs = getComputedStyle(src);
            for (let i = 0; i < cs.length; i++) {
                const name = cs[i];
                if (name.slice(0, 2) === "--") clone.style.setProperty(name, cs.getPropertyValue(name));
            }
        });
        // ⚠️ data URL 的 SVG 没有 base URL，相对图片引用解析不了（静默消失）；
        //    换 blob URL 又会被判跨源加载、污染画布 → 只能先内联成 data URL
        for (const el of clone.querySelectorAll("img, image")) {
            const src = el.getAttribute("src") || el.getAttribute("xlink:href") || el.getAttribute("href");
            const data = src && state.exportImgCache.get(src);
            if (!data) continue;
            let use = data;
            // 龙嘉机场徽标在页面里靠「CSS mask + 文字色底板」着色（见 changchun.js 的
            // installAirportBadgeStyle），而 mask 里的 url 是**相对路径** —— 内联进导出 SVG 后
            // 没有 base URL、解析不到，mask 静默失效（同下面 img 那条注释的理由），
            // 结果只剩一块底色、与「镂空」不符。这里改成**直接把单色轮廓重着色成主题文字色**，
            // 并摘掉 mask、让 img 显形 —— 与页面上看到的一致，且不再依赖 mask。
            if (/\/airport\.svg$/i.test(src.split("?")[0])) {
                use = recolorSvg(data, (state.exportTheme || {}).text || "#222");
                const item = el.closest ? el.closest(".scattered-item") : null;
                if (item) {
                    item.style.setProperty("-webkit-mask", "none");
                    item.style.setProperty("mask", "none");
                    item.style.setProperty("background-color", "transparent");
                }
                el.style.setProperty("visibility", "visible");
            }
            if (el.hasAttribute("src")) el.setAttribute("src", use);
            if (el.hasAttribute("xlink:href")) el.setAttribute("xlink:href", use);
            if (el.hasAttribute("href")) el.setAttribute("href", use);
        }
        const xml = new XMLSerializer().serializeToString(clone);
        // ⚠️ 内联 CSS 走 CDATA：里面出现 `]]>` 就会提前闭合、把后面的标签名当文本，整份 SVG 直接解析失败。
        //    CSS 里合法出现 `]]>` 的情形很少，但一旦出现，症状就是「导出无声失败」，故宁可分段转义。
        const cssText = String(state.exportCss || "").replace(/]]>/g, "]]]]><![CDATA[>");
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">'
            + '<foreignObject width="' + W + '" height="' + H + '">'
            // ⚠️ 只藏**文字**、不藏整个 #labels-layer：呼出框（如沈阳换乘站的「文本框底部描边」
            //    `border-bottom`）是挂在 .label-group 上的，整层藏掉会连框一起丢；文字本身仍要
            //    由 canvas 画（SVG 里没有页面已加载的 webfont，留下会用回退字体、字形不一致）
            + '<style><![CDATA[' + cssText
            + '#labels-layer .stacn, #labels-layer .staen { visibility: hidden !important }]]></style>'
            + xml + '</foreignObject></svg>';
        if (!(W > 0 && H > 0)) {
            console.warn(`[线网发展史] 导出：地图容器尺寸为 ${W}×${H}，栅格化很可能失败`);
        }
        const img = await imgFromData(sanitizeXml(svg));

        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        // 底色取**底图背景色**（暗色主题下不能再铺白）：全览那一拍地图内容缩得比输出画布还小，
        // 四周露出来的就是这层底 —— 早先硬编码 #fff，暗色导出会围一圈白边（用户验收反馈）。
        ctx2d.fillStyle = (state.exportTheme && state.exportTheme.mapBg) || "#fff";
        ctx2d.fillRect(0, 0, cw, ch);
        // 进度卡的让位已在**取景**层做掉（见 viewportBox：导出时按卡的所在侧扣掉一个卡宽），
        // 这里直接把图形层贴上去；站名随后按最终分辨率栅格化。
        const tx = ox + cam.x * k, ty = oy + cam.y * k;
        ctx2d.setTransform(s, 0, 0, s, tx, ty);
        ctx2d.drawImage(img, 0, 0, W, H);

        // ── 站名：与图形层同一套变换，于是文字按最终分辨率栅格化 ──
        (labelCache || []).forEach((L) => {
            // 缓存里收着「临时隐藏」的标签（见 buildLabelCache）——绘制前按 DOM 现状剔除：
            //   · DUP_LABEL_CLASS：同站同名幽灵点只画先入场的那个（与 syncGhostLabels 同一口径）
            //   · HOST_CLASS：主点让位期（alphaAt 已判，这里双保险）
            const gEl = L.el && L.el.closest ? L.el.closest(".label-group") : null;
            if (gEl && (gEl.classList.contains(DUP_LABEL_CLASS) || gEl.classList.contains(HOST_CLASS))) return;
            const a = alphaAt(L.sid, t);
            if (a <= 0.01) return;
            // 更名换字的淡出淡入：DOM 那边由 applyRenameAt 写在 span 的 inline opacity 上（蒙文行
            // 因为整块栅格化，天然跟着变）；canvas 也要乘上同一个 alpha，否则中英文是"啪"地换掉。
            ctx2d.globalAlpha = a * renameAlphaOf(L);
            ctx2d.font = L.font;   // ⚠️ 每个缓存项自带字号（中英蒙三行不同），漏了就用默认字体、全都叠一起
            if ("letterSpacing" in ctx2d) ctx2d.letterSpacing = L.spacing;
            // 与页面一致：淡入时带 blur（页面里是 `--cgo-oh-pop-blur` = 4px × (1 - alpha)，
            // 但那是**地图局部坐标**下的值，会被 map-content 的 scale 放大 —— 导出的输出比例是
            // s = cam.scale × k，故这里也要乘 s 才与页面观感一致）。
            // ⚠️ canvas 的 filter 半径是**输出像素**，不受当前 CTM 缩放影响（实测），所以必须手乘
            const blur = 4 * (1 - a) * s;
            ctx2d.filter = blur > 0.3 ? "blur(" + blur.toFixed(2) + "px)" : "none";
            ctx2d.fillStyle = L.color;
            ctx2d.textAlign = "left";
            ctx2d.textBaseline = "alphabetic";
            // 行盒内对齐：页面里由 .label-group 的 text-align 决定，canvas 默认靠左，得自己补偏移
            const alignDx = (w) => (L.align === "center" ? (L.boxW - w) / 2
                : (L.align === "right" || L.align === "end") ? (L.boxW - w) : 0);
            if (L.sx !== 1) {
                ctx2d.save();
                ctx2d.translate(L.anchorX, 0);
                ctx2d.scale(L.sx, 1);
                ctx2d.translate(-L.anchorX, 0);
            }
            // 逐行落位（数据里的 <br> 换行 canvas 画不到，得自己拆；基线按行盒 + 字体上下缘算）
            // ⚠️ 文字**每帧从 DOM 重取**：更名事件会改写标签里的文字，而缓存那份永远停在导出
            //    开始时的旧文本 —— 于是视频里中英文站名全程都是新名（只有直接栅格化的蒙文行会变）。
            const lines = liveLabelLines(L, ctx2d) || L.lines;
            lines.forEach((line, li) => {
                if (!line.text) return;
                const baseY = L.y + li * L.lh + (L.lh - (L.ascent + L.descent)) / 2 + L.ascent;
                const x = L.x + alignDx(line.w);
                if (L.strokeW > 0) {
                    ctx2d.lineWidth = L.strokeW;
                    ctx2d.strokeStyle = L.strokeColor;
                    ctx2d.strokeText(line.text, x, baseY);
                }
                ctx2d.fillText(line.text, x, baseY);
            });
            if (L.sx !== 1) ctx2d.restore();
            ctx2d.globalAlpha = 1;
        });
        ctx2d.filter = "none";
        if ("letterSpacing" in ctx2d) ctx2d.letterSpacing = "0px";

        // ── 进度卡 / 水印：回到设备坐标单独画，不受相机变换影响 ──
        ctx2d.setTransform(1, 0, 0, 1, 0, 0);
        drawCard(ctx2d, cw, ch, t, k);
        drawWatermark(ctx2d, cw, ch);
        // 收尾那一拍（缩到全图的长停）才补一条免责说明，与水印分居底部两侧
        if (recAt(t).whole) drawDisclaimer(ctx2d, cw, ch);
    }

    /* ---- 进度卡：把面板那套「当前事件 + 说明 + 规模 + 进度」合成进画面 ---- */

    /* 画面浮层（进度卡 / 水印）整体放大一档：视频多在手机或大屏远看，字要比页面里大。
       字号与盒子的尺寸同步放大，版式比例不变。 */
    const OVERLAY_S = 1.5;
    const F = (px) => px * OVERLAY_S;
    const CARD = {
        // 卡面收窄到原设计的 6 成（原 384×1.5）：视频里它只作进度提示，占太多画面会盖住线网
        w: Math.round(384 * OVERLAY_S * 0.6),
        pad: Math.round(16 * OVERLAY_S),
        margin: Math.round(24 * OVERLAY_S),
        radius: Math.round(12 * OVERLAY_S),
        descMax: 3
    };

    /**
     * 当前生效的卡面位置：**两块都关** → `off`（整块不画）；开了「事件列表」→ 卡片纵向撑满，
     * 位置取 `cardPosList`（左 / 右）；只开「当前事件」→ 位置取 `cardPos`（四角）。
     */
    const cardPos = () => {
        if (!state.cardShowSummary && !state.cardShowList) return "off";
        if (state.cardShowList) return state.cardPosList || "right";
        return state.cardPos || "br";
    };

    /** 圆角矩形（Chrome 已支持 roundRect，留一个手写兜底） */
    function roundRect(ctx2d, x, y, w, h, r) {
        ctx2d.beginPath();
        if (typeof ctx2d.roundRect === "function") { ctx2d.roundRect(x, y, w, h, r); return; }
        ctx2d.moveTo(x + r, y);
        ctx2d.arcTo(x + w, y, x + w, y + h, r);
        ctx2d.arcTo(x + w, y + h, x, y + h, r);
        ctx2d.arcTo(x, y + h, x, y, r);
        ctx2d.arcTo(x, y, x + w, y, r);
        ctx2d.closePath();
    }

    /** 逐字折行（中英混排按实际量测宽度切，够用且无需依赖） */
    function wrapText(ctx2d, text, maxW) {
        const out = [];
        let line = "";
        for (const ch of String(text)) {
            const test = line + ch;
            if (line && ctx2d.measureText(test).width > maxW) { out.push(line); line = ch; }
            else line = test;
        }
        if (line) out.push(line);
        return out;
    }

    /**
     * 画布上的玻璃态卡面：把底下**已经画好的地图**挖一块 → 模糊 + 提饱和 → 贴回圆角矩形，
     * 再叠 CGoUI `.glass-panel` 的那几层（0.82 衬底 / 顶部微光圈 / 0.5px 外圈 / 投影）。
     * canvas 没有 backdrop-filter，只能这样「先糊底、再盖膜」，做出同样的磨砂观感。
     * 底衬按 `GLASS_DS` 降采样后再模糊（半径同比缩），再放大贴回 —— 模糊看不出细节，
     * 代价却掉到约 1/4（大半径模糊尤其明显）。
     */
    const GLASS_DS = 0.5;

    let glassScratch = null;
    function paintGlass(ctx2d, cw, ch, x, y, w, h, r, blur, fade) {
        const P = Math.ceil(blur * 2) + 2;
        const sx = Math.max(0, Math.round(x - P)), sy = Math.max(0, Math.round(y - P));
        const ex = Math.min(cw, Math.round(x + w + P)), ey = Math.min(ch, Math.round(y + h + P));
        const sw = Math.max(1, ex - sx), sh = Math.max(1, ey - sy);
        const tw = Math.max(1, Math.round(sw * GLASS_DS)), th = Math.max(1, Math.round(sh * GLASS_DS));
        if (!glassScratch) glassScratch = document.createElement("canvas");
        const tmp = glassScratch;
        if (tmp.width < tw || tmp.height < th) {
            tmp.width = Math.max(tmp.width, tw);
            tmp.height = Math.max(tmp.height, th);
        }
        const tc = tmp.getContext("2d");
        tc.setTransform(1, 0, 0, 1, 0, 0);
        tc.clearRect(0, 0, tw, th);
        tc.filter = "blur(" + (blur * GLASS_DS).toFixed(1) + "px) saturate(135%)";
        tc.drawImage(ctx2d.canvas, sx, sy, sw, sh, 0, 0, tw, th);
        tc.filter = "none";

        // 投影（对齐 --glass-shadow 的 0 8px 24px；半径收着给，太大很费且看不出差别）
        // ⚠️ 阴影不吃 globalAlpha，淡出时得把 alpha 直接揉进 shadowColor
        ctx2d.save();
        ctx2d.shadowColor = "rgba(0,38,59," + (0.16 * fade).toFixed(3) + ")";
        ctx2d.shadowBlur = Math.max(8, blur * 0.6);
        ctx2d.shadowOffsetY = Math.max(4, blur * 0.25);
        roundRect(ctx2d, x, y, w, h, r);
        ctx2d.fillStyle = "rgba(0,0,0,0.002)";
        ctx2d.fill();
        ctx2d.restore();

        // 糊好的底（放大贴回）+ 衬底（对齐 --glass-bg-panel）
        ctx2d.save();
        ctx2d.globalAlpha = fade;
        roundRect(ctx2d, x, y, w, h, r);
        ctx2d.clip();
        ctx2d.drawImage(tmp, 0, 0, tw, th, sx, sy, sw, sh);
        ctx2d.fillStyle = (state.exportTheme && state.exportTheme.glassPanel) || "rgba(255,255,255,.82)";
        ctx2d.fillRect(x, y, w, h);
        ctx2d.restore();

        // 0.5px 外圈 + 顶部 1px 微光圈（`.glass-panel::before` 的简化）
        ctx2d.save();
        ctx2d.globalAlpha = fade;
        ctx2d.lineWidth = 1;
        ctx2d.strokeStyle = "rgba(0,0,0,0.07)";
        roundRect(ctx2d, x + 0.5, y + 0.5, w - 1, h - 1, r);
        ctx2d.stroke();
        ctx2d.beginPath();
        ctx2d.moveTo(x + r, y + 1.5);
        ctx2d.lineTo(x + w - r, y + 1.5);
        ctx2d.strokeStyle = "rgba(255,255,255,0.55)";
        ctx2d.stroke();
        ctx2d.restore();
    }

    /**
     * 收尾那拍「缩到全图」时把进度卡淡出：全图是主画面，卡再杵着就挡景了。
     * 淡出窗口取全图那一拍的**运镜时长**（`whole.from → whole.headEnd`），镜头缩、卡同步消；
     * 之后的停驻期一直是 0。更名换字那类的中间步骤不受影响（整段都是 1）。
     */
    function cardAlphaAt(t) {
        const tl = state.timeline;
        if (!tl || !tl.whole) return 1;
        const w = tl.whole;
        if (t < w.from) return 1;
        const span = Math.max(1, w.headEnd - w.from);
        return Math.max(0, 1 - (t - w.from) / span);
    }

    /**
     * 把进度卡画到画面上。**两块内容各自独立开关**（`state.cardShowSummary` / `state.cardShowList`）：
     * 只开概览 → 自适应高度的摘要卡（四角 / 关）；开了事件列表 → 卡片**纵向撑满**、位置只剩左右；
     * 两块都关 → 整块不画（等价于关掉进度卡）。
     * 取值与面板**同源**（panelModel），所以视频里的数字与面板逐帧一致。
     * @param {number} k 可见视口 → 输出画面的放大系数（玻璃模糊半径按它换算）
     */
    function drawCard(ctx2d, cw, ch, t, k) {
        const showSum = state.cardShowSummary !== false;
        const showList = !!state.cardShowList;
        if (!showSum && !showList) { state.exportCardRect = null; return; }   // 两个开关都关：整块不画
        const pos = cardPos();
        if (!pos || pos === "off") { state.exportCardRect = null; return; }
        const fade = cardAlphaAt(t);
        if (fade <= 0.01) { state.exportCardRect = null; return; }   // 已淡尽：整块别画（也省掉玻璃那笔开销）
        const th = state.exportTheme || {};
        const fam = th.font || "sans-serif";
        const m = panelModel(t, recAt(t));
        const W = CARD.w, PAD = CARD.pad, innerW = W - PAD * 2;
        const GAP = F(6);

        // 三块内容分开排：**标题**（事件本身）/ **描述**（括注那句人话）/ **状态**（本次新增与转乘）。
        // 不是每件事都有括注、都有新增，缺的块直接跳过。宽度不足时都先缩字号，再谈截断。
        const TITLE_FS = [F(15), F(14), F(13)];
        let titleFont = TITLE_FS[0], titleLines = [];
        for (const fs of TITLE_FS) {
            ctx2d.font = "500 " + fs + "px " + fam;
            titleFont = fs; titleLines = wrapText(ctx2d, m.title, innerW);
            if (titleLines.length <= 2) break;
        }
        if (titleLines.length > 2) titleLines = titleLines.slice(0, 2);

        const DESC_FS = [F(13), F(12), F(11)];
        let descFont = DESC_FS[0], descLines = [];
        if (m.desc) {
            for (const fs of DESC_FS) {
                ctx2d.font = "400 " + fs + "px " + fam;
                descFont = fs; descLines = wrapText(ctx2d, m.desc, innerW);
                if (descLines.length <= CARD.descMax) break;
            }
            if (descLines.length > CARD.descMax) descLines = descLines.slice(0, CARD.descMax);
        }

        // 状态行：与清单**同源同序**（COUNT_CHIPS：新增 / 拆除 / 升级 / 降级），CGoUI 图标 + 数字
        const chips = COUNT_CHIPS
            .filter((c) => m.counts && m.counts[c.key])
            .map((c) => ({ icon: c.icon, n: m.counts[c.key] }));
        const statH = chips.length ? F(20) : 0;

        const titleStep = F(20) * (titleFont / F(15));   // 行距随字号等比收
        const descStep = F(19) * (descFont / F(13));
        let contentH = PAD + F(26) + GAP;                 // 日期 + 类型徽标
        contentH += titleLines.length * titleStep + GAP;  // 标题
        if (descLines.length) contentH += descLines.length * descStep + GAP;
        if (statH) contentH += statH + GAP;
        contentH += F(17) + GAP;                          // 规模行
        contentH += F(5) + PAD;                           // 进度条
        // 列表卡面：卡片**纵向撑满**，摘要仍在顶部，其余高度全部留给事件清单
        const listMode = showList;
        const H = listMode ? Math.max(contentH, ch - CARD.margin * 2) : contentH;

        const onRight = pos === "tr" || pos === "br" || pos === "right";
        const x = onRight ? cw - CARD.margin - W : CARD.margin;
        const y = listMode ? CARD.margin : ((pos === "bl" || pos === "br") ? ch - CARD.margin - H : CARD.margin);
        // 记下本帧卡面矩形：下一帧据此裁掉落进卡里的站名（尺寸也让取景知道 —— 见 viewportBox）
        state.exportCardRect = { x: x, y: y, w: W, h: H, pos: pos };

        paintGlass(ctx2d, cw, ch, x, y, W, H, CARD.radius,
            Math.max(6, Math.min(30, (th.glassBlur || 14) * (k || 1))), fade);

        ctx2d.save();
        ctx2d.textAlign = "left";
        ctx2d.textBaseline = "top";
        ctx2d.globalAlpha = fade;   // 卡面已淡出多少，里面的字就跟着淡多少

        // 摘要块（「概览」开关）与清单块（「事件列表」开关）各自独立：都关时整块不画（见函数开头）；
        // 只开列表时卡片仍要纵向撑满 —— 摘要不画，清单直接自卡片顶部起排。
        const lay = {
            PAD: PAD, GAP: GAP, innerW: innerW,
            titleFont: titleFont, titleStep: titleStep, titleLines: titleLines,
            descFont: descFont, descStep: descStep, descLines: descLines,
            chips: chips, statH: statH
        };
        let cy = y + PAD;
        if (showSum) cy = drawCardSummary(ctx2d, x, cy, m, fade, fam, th, lay);

        // 列表卡面：摘要（含进度条）之下，把剩余高度全部铺成「事件清单」——
        // 固定行窗 + 当前事件高亮 + 随进度滚动，与面板清单同一份数据（state.listGroups）
        if (listMode) drawEventList(ctx2d, x, y, W, H, cy, m, fade, fam, th, showSum);
        ctx2d.restore();
    }

    /**
     * 画进度卡的**摘要块**（日期 + 类型徽标 / 标题 / 描述 / 计数 chips / 规模行 / 进度条），
     * 返回画完后的 y。版式尺寸全部取调用方算好的 `lay`，本函数只负责落笔。
     */
    function drawCardSummary(ctx2d, x, cy, m, fade, fam, th, lay) {
        const PAD = lay.PAD, GAP = lay.GAP, innerW = lay.innerW;
        // 日期 + 类型徽标
        ctx2d.font = "700 " + F(21) + "px " + fam;
        ctx2d.fillStyle = th.text || "#222";
        ctx2d.fillText(m.date, x + PAD, cy + F(2));
        const bx = x + PAD + ctx2d.measureText(m.date).width + F(12), by = cy + F(4);
        ctx2d.font = "600 " + F(12) + "px " + fam;
        const btw = ctx2d.measureText(m.badge).width + F(16);
        ctx2d.fillStyle = m.badgeColor || th.primary || "#006098";
        roundRect(ctx2d, bx, by, btw, F(18), F(9));
        ctx2d.fill();
        ctx2d.fillStyle = "#fff";
        ctx2d.fillText(m.badge, bx + F(8), by + F(3));
        cy += F(26) + GAP;

        // 标题：比描述重一点即可，不用加粗到跳出来
        ctx2d.font = "500 " + lay.titleFont + "px " + fam;
        ctx2d.fillStyle = th.text || "#222";
        lay.titleLines.forEach((ln) => { ctx2d.fillText(ln, x + PAD, cy); cy += lay.titleStep; });
        cy += GAP;

        // 描述（括注）
        if (lay.descLines.length) {
            ctx2d.font = "400 " + lay.descFont + "px " + fam;
            ctx2d.globalAlpha = 0.75 * fade;
            ctx2d.fillStyle = th.text || "#222";
            lay.descLines.forEach((ln) => { ctx2d.fillText(ln, x + PAD, cy); cy += lay.descStep; });
            ctx2d.globalAlpha = fade;
            cy += GAP;
        }

        // 状态：新增 / 拆除 / 升级 / 降级 —— 与清单同源同序，图标 + 数字并排（不画胶囊底衬）
        if (lay.statH) {
            let cxp = x + PAD;
            lay.chips.forEach((c) => {
                const img = state.cardIcons && state.cardIcons[c.icon];
                if (img) {
                    ctx2d.drawImage(img, cxp, cy + F(3.5), F(13), F(13));
                    cxp += F(16);
                }
                const txt = String(c.n);
                ctx2d.font = "500 " + F(13) + "px " + fam;
                ctx2d.fillStyle = th.text || "#222";
                ctx2d.globalAlpha = 0.7 * fade;
                ctx2d.fillText(txt, cxp, cy + F(3));
                ctx2d.globalAlpha = fade;
                cxp += ctx2d.measureText(txt).width + F(14);
            });
            cy += lay.statH + GAP;
        }

        // 规模行：与说明同样处理 —— 宽度不足时先缩字号（原字号 F(13)），避免顶出卡面
        const statsText = `线路 ${m.lines} 条 · 运营车站 ${m.stations} 座 · 里程 ${m.mileage.toFixed(1)} km`;
        let statsFont = F(13);
        for (const fs of [F(13), F(12), F(11), F(10)]) {
            ctx2d.font = "400 " + fs + "px " + fam;
            statsFont = fs;
            if (ctx2d.measureText(statsText).width <= innerW) break;
        }
        ctx2d.font = "400 " + statsFont + "px " + fam;
        ctx2d.globalAlpha = 0.62 * fade;
        ctx2d.fillText(statsText, x + PAD, cy);
        ctx2d.globalAlpha = fade;
        cy += F(17) + GAP;

        // 进度条
        ctx2d.fillStyle = th.info || "rgba(0,0,0,.06)";
        roundRect(ctx2d, x + PAD, cy, innerW, F(5), F(2.5));
        ctx2d.fill();
        const pw = Math.max(0, Math.min(1, m.trackPct / 100)) * innerW;
        if (pw > 0.5) {
            ctx2d.fillStyle = th.primary || "#006298";
            roundRect(ctx2d, x + PAD, cy, Math.max(F(5), pw), F(5), F(2.5));
            ctx2d.fill();
        }
        return cy + F(5) + GAP;
    }

    /** 折行并按 `maxLines` 截断（末行加省略号）—— 列表标题排版用 */
    function clipLines(ctx2d, text, maxW, maxLines) {
        const all = wrapText(ctx2d, text, maxW);
        if (all.length <= maxLines) return all;
        const out = all.slice(0, maxLines);
        let last = out[maxLines - 1];
        while (last.length > 1 && ctx2d.measureText(last + "…").width > maxW) last = last.slice(0, -1);
        out[maxLines - 1] = last + "…";
        return out;
    }

    /**
     * 列表卡面的事件清单。**两种排版**（`compact` = 「当前事件」开关是否打开）：
     *   · `compact=true`（与摘要同屏）：每条**一行** —— 日期 | 色点 | 标题 | 计数（计数贴行尾）；
     *   · `compact=false`（纯列表，只开「事件列表」）：每条**两行** ——
     *     第一行「日期 … 计数（贴行尾）」，第二行「色点（当无序列表的项目符号）+ 标题」，
     *     且**当前事件的标题完整折行显示**、其余只占一行（超宽截断）。
     * 当前事件高亮 + 随进度滚动（以当前事件为锚向上下交替填充）。
     * 数据与面板清单同源：`state.listGroups`。
     * ⚠️ 标题一律用正文色 —— 色点取的是线路色，**别让 fillStyle 漏给后面的文字**
     * （早先就漏成了「标题被染成线路色」）。
     */
    function drawEventList(ctx2d, x, y, W, H, top, m, fade, fam, th, compact) {
        const groups = state.listGroups || [];
        if (!groups.length) return;
        const PAD = CARD.pad, innerW = W - PAD * 2;
        const left = x + PAD, right = left + innerW;
        const text = th.text || "#222";
        const bodyFS = compact ? F(12) : F(13);
        const headH = compact ? F(24) : F(16);   // compact：整条高度基准；stacked：日期 / 计数那一行
        const titleStep = F(18);                 // stacked：标题每行高度
        const rowGap = F(6);

        ctx2d.textAlign = "left";
        ctx2d.textBaseline = "middle";
        ctx2d.font = "500 " + F(11) + "px " + fam;
        const dateW = ctx2d.measureText("0000-00-00").width;
        const dotX = left + dateW + F(8);          // compact 的色点（日期右侧）
        const inlineTextX = dotX + F(8) + F(8);    // compact 的标题起点
        const bulletX = left + F(3);               // stacked 的项目符号位置
        const stackedTextX = bulletX + F(8) + F(8);

        let cur = groups.findIndex((g) => m.i >= g.from && m.i <= g.to);
        if (cur < 0) cur = 0;

        // 预排：折行 + 该条高度
        const items = groups.map((g, i) => {
            const full = g.step.evTitle || stepLabel(g.step) || "";
            const counts = COUNT_CHIPS.filter((c) => g[c.key]);
            ctx2d.font = "500 " + F(11) + "px " + fam;
            const chipW = counts.reduce((s, c) => s + F(15) + ctx2d.measureText(String(g[c.key])).width + F(10), 0);
            ctx2d.font = "400 " + bodyFS + "px " + fam;
            let lines, h;
            if (compact) {
                const maxW = Math.max(F(40), right - chipW - F(8) - inlineTextX);
                lines = clipLines(ctx2d, full, maxW, 1);
                h = headH + rowGap;
            } else {
                // 当前事件**完整折行**（至多 3 行，免得极端长标题吃掉整屏）；其余只占一行
                lines = clipLines(ctx2d, full, right - stackedTextX, i === cur ? 3 : 1);
                h = headH + lines.length * titleStep + rowGap;
            }
            return { g: g, counts: counts, lines: lines, chipW: chipW, h: h };
        });

        // ── 滚动：整份清单**一次排好**（静态），再用滚动偏移 + 裁切露出窗口 ──
        // 早先是「每帧重新决定窗口里放哪几项」：项集合会跳变，滚动时出现「大片文字突然消失」
        // 与空行（用户实测）。改成一份固定列表整体平移后，各项位置连续变化，滚动平滑；
        // 已过 / 当前 / 未来三种状态天然由「落在窗口上方 / 窗口内 / 窗口下方」决定，裁切自动出效果。
        const avail = (y + H - PAD) - top;
        if (avail < headH) return;
        const offs = [];                       // 每项顶部在整份列表内的偏移（前缀和）
        let acc = 0;
        items.forEach((it) => { offs.push(acc); acc += it.h; });
        const totalH = acc;
        // 目标偏移：让当前项中心落在窗口中心；再夹进 [0, totalH - avail] ——
        // 到顶 / 到底自然停住（不再向上或向下滚），且只要列表比窗口高就必然铺满、下方不留白。
        const target = Math.max(0, Math.min(
            offs[cur] + (items[cur] ? items[cur].h : 0) / 2 - avail / 2,
            Math.max(0, totalH - avail)));
        // 平滑跟随：每帧向目标缓动（30fps 下约 0.3 秒到位），做出滚动过渡而不是瞬移
        if (listTopSmooth == null) listTopSmooth = target;
        else listTopSmooth += (target - listTopSmooth) * 0.2;
        const scrollY = listTopSmooth;

        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.rect(left - F(4), top, innerW + F(8), avail);
        ctx2d.clip();
        // 当前项高亮块：**跨帧补间** —— 切换事件时从上一项滑过去（位置与高度都补间），
        // 而不是「啪」地跳一下。跟随滚动的位移由 scrollY 的缓动带来，两者用同一系数保持同步。
        const curIy = top - scrollY + offs[cur];
        const curH = items[cur] ? items[cur].h : 0;
        if (hlSmooth == null) hlSmooth = { y: curIy, h: curH };
        else {
            hlSmooth.y += (curIy - hlSmooth.y) * 0.2;
            hlSmooth.h += (curH - hlSmooth.h) * 0.2;
        }
        ctx2d.globalAlpha = 0.12 * fade;
        ctx2d.fillStyle = th.primary || "#006298";
        roundRect(ctx2d, left - F(4), hlSmooth.y - F(2), innerW + F(8), hlSmooth.h, F(6));
        ctx2d.fill();
        items.forEach((it, i) => {
            const iy = top - scrollY + offs[i];
            if (iy >= top + avail || iy + it.h <= top) return;   // 落在窗口外：跳过（画了也看不见）
            const g = it.g;
            const on = i === cur, done = g.to <= m.i;
            // 滚动过渡里**新进入窗口**的项做淡入：按项中心距窗口上下缘的距离渐显
            // （当前项始终足量，免得它刚好落在边缘时被淡掉）
            // ⚠️ 边缘只淡到 10% 不透明度、**不淡到全透明**：贴边那几行仍留一点轮廓，
            //    否则裁切窗口一滑就会看成「大片文字凭空消失」（用户验收反馈）。
            const EDGE = F(30);
            const cyc = iy + it.h / 2;
            const edgeNear = (v) => 0.1 + 0.9 * Math.min(1, Math.max(0, v));
            const edgeA = on ? 1 : Math.min(
                edgeNear((cyc - top) / EDGE),
                edgeNear((top + avail - cyc) / EDGE));
            const dim = (on ? 0.95 : done ? 0.72 : 0.45) * fade * edgeA;
            // 首行：日期（左） + 计数（贴行尾）
            const cy0 = iy + headH / 2;
            ctx2d.globalAlpha = dim;
            ctx2d.font = "500 " + F(11) + "px " + fam;
            ctx2d.fillStyle = text;
            ctx2d.fillText(g.step.date, left, cy0);
            if (it.counts.length) {
                let ccx = right - it.chipW;
                it.counts.forEach((c) => {
                    const img = state.cardIcons && state.cardIcons[c.icon];
                    if (img) {
                        ctx2d.globalAlpha = dim;
                        ctx2d.drawImage(img, ccx, cy0 - F(6.5), F(13), F(13));
                        ccx += F(15);
                    }
                    ctx2d.globalAlpha = (on ? 0.85 : done ? 0.6 : 0.4) * fade * edgeA;
                    ctx2d.fillStyle = text;
                    const t = String(g[c.key]);
                    ctx2d.fillText(t, ccx, cy0);
                    ccx += ctx2d.measureText(t).width + F(10);
                });
            }
            // 标题（一律正文色；色点只在下面单独上色）
            ctx2d.globalAlpha = dim;
            ctx2d.font = (on ? "600 " : "400 ") + bodyFS + "px " + fam;
            ctx2d.fillStyle = text;
            if (compact) {
                // 与摘要同屏：色点在日期右侧，标题紧随其后
                ctx2d.globalAlpha = (on ? 1 : done ? 0.8 : 0.5) * fade * edgeA;
                ctx2d.fillStyle = g.step.color || "#8a94a6";
                roundRect(ctx2d, dotX, cy0 - F(4), F(8), F(8), F(2));
                ctx2d.fill();
                ctx2d.globalAlpha = dim;
                ctx2d.fillStyle = text;
                ctx2d.fillText(it.lines[0] || "", inlineTextX, cy0);
            } else {
                // 纯列表：第二行起「项目符号 + 标题」（可多行）
                const t0 = iy + headH;
                it.lines.forEach((ln, li) => {
                    const cy = t0 + li * titleStep + titleStep / 2;
                    if (li === 0) {
                        ctx2d.globalAlpha = (on ? 1 : done ? 0.8 : 0.5) * fade * edgeA;
                        ctx2d.fillStyle = g.step.color || "#8a94a6";
                        roundRect(ctx2d, bulletX, cy - F(4), F(8), F(8), F(2));
                        ctx2d.fill();
                        ctx2d.globalAlpha = dim;
                        ctx2d.fillStyle = text;
                    }
                    ctx2d.fillText(ln, stackedTextX, cy);
                });
            }
        });
        ctx2d.globalAlpha = fade;
        ctx2d.restore();
    }

    /* ---- 角落水印：来源署名（AGPLv3 / ODbL 双轨下，视频出片同样要署名） ---- */

    /** 水印文案：`CGo OpenMap · {城市} 开放地图`（城市名取当前注册城市） */
    function watermarkText() {
        let city = "";
        try {
            const c = window.CityDataManager && window.CityDataManager.getCurrentCity
                ? window.CityDataManager.getCurrentCity() : null;
            city = (c && c.name) || "";
        } catch (e) { /* 取不到就只留项目名 */ }
        return "CGo OpenMap · " + (city ? city + " " : "") + "开放地图";
    }

    /** 水印是否落右：与进度卡**分居左右下角**（卡在右下 / 整条右侧 → 水印去左下；卡在左下 /
        整条左侧 → 去右下；卡在上半屏或关掉 → 固定右下），两者永不重叠 */
    const watermarkOnRight = () => {
        const pos = cardPos();
        if (pos === "br" || pos === "right") return false;
        return true;
    };

    function drawWatermark(ctx2d, cw, ch) {
        const text = watermarkText();
        if (!text) return;
        const th = state.exportTheme || {};
        const fam = th.font || "sans-serif";
        const pad = CARD.margin;
        const mark = state.exportMark;
        const markSize = F(20), gap = F(8);

        ctx2d.save();
        ctx2d.font = "600 " + F(14) + "px " + fam;
        ctx2d.textBaseline = "middle";
        ctx2d.textAlign = "left";
        const textW = ctx2d.measureText(text).width;
        const totalW = (mark ? markSize + gap : 0) + textW;
        const x = watermarkOnRight() ? cw - pad - totalW : pad;
        const cy = ch - pad - F(13);   // 与进度卡底边同一行
        let cx = x;
        ctx2d.globalAlpha = 0.72;
        if (mark) {
            ctx2d.drawImage(mark, cx, cy - markSize / 2, markSize, markSize);
            cx += markSize + gap;
        }
        // 先描一圈背景色做底衬，压在线上也看得清
        ctx2d.lineWidth = F(3);
        ctx2d.lineJoin = "round";
        ctx2d.strokeStyle = th.mapBg || "#fff";
        ctx2d.strokeText(text, cx, cy);
        ctx2d.fillStyle = th.text || "#222";
        ctx2d.fillText(text, cx, cy);
        ctx2d.restore();
    }

    /* ---- 末尾全览的免责说明：与水印**分居底部两侧**（用户指定），只在收尾那一拍出现 ---- */

    /** 免责说明文案：三条口径（数据由主理团队整理 / 线路图经过变形 / 以实际数据为准） */
    const DISCLAIMER_TEXT = "数据由该项目主理团队整理 · 线路图经过变形处理 · 请以实际数据为准";

    function drawDisclaimer(ctx2d, cw, ch) {
        const th = state.exportTheme || {};
        const fam = th.font || "sans-serif";
        const pad = CARD.margin;
        ctx2d.save();
        // 字号与角落水印**取同一个**（同为 F(14)）、 cy 也同一行 —— 两端文字才会视觉齐平
        ctx2d.font = "500 " + F(14) + "px " + fam;
        ctx2d.textBaseline = "middle";
        // 角落水印在左时说明居右（反之亦然）—— 两端各占一头，互不遮挡
        const onRight = !watermarkOnRight();
        ctx2d.textAlign = onRight ? "right" : "left";
        const x = onRight ? cw - pad : pad;
        const cy = ch - pad - F(13);   // 与水印同一行（贴着底边）
        ctx2d.globalAlpha = 0.72;
        // 与角落水印同款：先描一圈底色做底衬，压在线上也看得清
        ctx2d.lineWidth = F(3);
        ctx2d.lineJoin = "round";
        ctx2d.strokeStyle = th.mapBg || "#fff";
        ctx2d.strokeText(DISCLAIMER_TEXT, x, cy);
        ctx2d.fillStyle = th.text || "#222";
        ctx2d.fillText(DISCLAIMER_TEXT, x, cy);
        ctx2d.restore();
    }

    /**
     * XML 1.0 里**不允许出现**的字符：控制符（除 \t \n \r）、孤立代理项、U+FFFE / U+FFFF。
     * HTML 解析对它们照收不误，但把同一棵 DOM 序列化成 SVG 再交给 XML 解析器就整份失败
     * （实测症状：`invalid attribute value`，指到克隆根节点的 style 属性里）。
     * ⚠️ 正则**不加** `u` 标志：要按 UTF-16 码元匹配，才能抓到孤立代理项。
     */
    const XML_BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/g;

    /** 栅格化前净化：剔掉 XML 不允许的字符，并把它是什么报出来（数据问题便于追溯） */
    function sanitizeXml(str) {
        const bad = str.match(XML_BAD_CHARS);
        if (!bad) return str;
        const uniq = Array.from(new Set(bad))
            .map((c) => "U+" + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"));
        console.warn(`[线网发展史] 导出：SVG 里含 ${bad.length} 个 XML 不允许的字符（${uniq.join("、")}）已剔除，`
            + "多半来自某个样式值或站名文本，可作为上游数据问题排查");
        return str.replace(XML_BAD_CHARS, "");
    }

    /**
     * 诊断用：SVG 栅格化失败时把**真正的原因**说出来。
     * `<img>` 的 onerror 不给任何细节，只能自己再判一次：
     *   · XML 不合法 —— DOMParser 会直指出错位置（命名空间缺失、非法字符、CDATA 里的 `]]>` 等），
     *     并把**出错处上下文**（JSON 转义，控制符会显示成 \u00xx）一起带出来；
     *   · XML 合法却仍失败 —— 多半是 data URL 过大或含不受支持的内容，这时把体积报出来便于定位。
     */
    function describeSvgFailure(svgStr) {
        const bytes = new TextEncoder().encode(svgStr).length;
        const parts = [`${bytes} 字节`, `内联 CSS ${(state.exportCss || "").length} 字符`];
        try {
            const doc = new DOMParser().parseFromString(svgStr, "image/svg+xml");
            const err = doc.querySelector("parsererror");
            if (err) {
                const msg = String(err.textContent || "").replace(/\s+/g, " ").trim().slice(0, 240);
                parts.push("XML 解析失败：" + msg + svgErrorContext(svgStr, msg));
            } else {
                parts.push("XML 合法（可能是 data URL 过大或含不受支持的内容）");
            }
        } catch (e) {
            parts.push("无法用 DOMParser 复核");
        }
        return parts.join("；");
    }

    /** 按 parsererror 报的「line L at column C」切一段上下文（±120 字符，JSON 转义） */
    function svgErrorContext(svgStr, errText) {
        const m = /line (\d+) at column (\d+)/i.exec(errText || "");
        if (!m) return "";
        const line = Number(m[1]), col = Number(m[2]);
        const lines = svgStr.split("\n");
        let offset = 0;
        for (let i = 0; i < Math.min(line - 1, lines.length); i++) offset += lines[i].length + 1;
        offset += Math.max(0, col - 1);
        return "；出错处上下文：" + JSON.stringify(svgStr.slice(Math.max(0, offset - 120), offset + 120));
    }

    /** data URL 的 SVG → <img>（decoded ≠ painted，调用方已在外层留出等待） */
    function imgFromData(svgStr) {
        const bytes = new TextEncoder().encode(svgStr);
        let bin = ""; const CH = 0x8000;
        for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        return new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = () => rej(new Error("SVG 栅格化失败（" + describeSvgFailure(svgStr) + "）"));
            img.src = "data:image/svg+xml;base64," + btoa(bin);
        });
    }

    /** 导出前的准备：同源 CSS 文本、外部图片 data URL 缓存、站名度量缓存 */
    async function prepareExport() {
        let css = "";
        const sheets = document.styleSheets;
        for (let i = 0; i < sheets.length; i++) {
            try {
                const rules = sheets[i].cssRules;
                for (let j = 0; j < rules.length; j++) css += rules[j].cssText + "\n";
            } catch (e) { /* 跨域表（远在字体站的，导出用不到）读不到，跳过 */ }
        }
        state.exportCss = css;
        state.exportImgCache = new Map();
        const mc = document.getElementById("map-content");
        for (const el of mc.querySelectorAll("img, image")) {
            const src = el.getAttribute("src") || el.getAttribute("xlink:href") || el.getAttribute("href");
            if (!src || /^(data:|blob:)/.test(src) || state.exportImgCache.has(src)) continue;
            try {
                const r = await fetch(new URL(src, document.baseURI).href);
                const b = await r.arrayBuffer();
                state.exportImgCache.set(src, "data:" + (r.headers.get("content-type") || "image/png") + ";base64," + b64Bytes(b));
            } catch (e) { /* 取不到就保持原样（该图在导出里会缺失，不致命） */ }
        }
        labelCache = buildLabelCache();
        listTopSmooth = null;   // 清单滚动位置从本段起点重新起算（否则会带着上一段的偏移滑进来）
        hlSmooth = null;        // 高亮块同理
        state.exportTheme = readThemeVars();
        state.exportMark = await prepareMark();
        // 进度卡状态行用的四枚图标（新增 / 拆除 / 升级 / 降级，与面板清单的 COUNT_CHIPS 同源）
        const iconCol = (state.exportTheme || {}).text || "#222";
        state.cardIcons = {
            add: await prepareIcon("add", iconCol, false),
            "zoom-out": await prepareIcon("zoom-out", iconCol, false),
            sparkle: await prepareIcon("sparkle", iconCol, false),
            reverse: await prepareIcon("reverse", iconCol, false)
        };
        state.cardReserve = true;      // 取景给卡让位（全览那一拍除外，见 buildTimeline）
        state.exportCardRect = null;   // 卡面矩形逐帧记，导出开始时清一次（首帧不让位）
    }

    /**
     * 水印左侧的 CGo 小图标：把 CGoUI 的 `<cgo-icon name="cgo">` 临时挂到页面上，取出它
     * shadow DOM 里的 SVG、栅格化一次（拿不到就退化成纯文字水印）。
     * ⚠️ 隔离的 SVG（data URL）里没有页面上的 CSS 变量，品牌渐变（`color-mode="brand"` 的
     * `<stop stop-color="var(--brand-gradient-…)">`）与 `--icon-clr` 都得在根上补好，
     * 否则渐变那两笔会解析不出来、整块不画。
     */
    const MARK_COLOR_MODE = "brand";   // 'mono' 跟随文字色 / 'brand' 用 CGoUI 品牌渐变

    async function prepareMark() {
        return await prepareIcon("cgo", (state.exportTheme || {}).text || "#222", MARK_COLOR_MODE === "brand");
    }

    /**
     * 把一个 `<cgo-icon>` 栅格化成 Image（画布上画图标用）。进度卡状态行的 add / zoom-out / sparkle / reverse
     * 也走这条 —— 与面板清单里的图标同一套 CGoUI 矢量，避免在视频里另画一套「＋」。
     * 拿不到就返回 null，调用方降级为纯文字。
     */
    async function prepareIcon(name, col, brand) {
        const th = state.exportTheme || {};
        let host = document.querySelector(`cgo-icon[name="${name}"]`);
        let temp = null;
        const wrongMode = brand
            ? !!host && host.getAttribute("color-mode") !== "brand"
            : !!host && !!host.getAttribute("color-mode");
        if (!host || wrongMode) {
            temp = document.createElement("cgo-icon");
            temp.setAttribute("name", name);
            temp.setAttribute("size", "24");
            if (brand) temp.setAttribute("color-mode", "brand");
            temp.style.cssText = "position:absolute;left:-9999px;top:0;";
            document.body.appendChild(temp);
            host = temp;
            await new Promise((r) => requestAnimationFrame(() => r()));   // 等组件渲染出 shadow DOM
        }
        try {
            const svg = host.shadowRoot && host.shadowRoot.querySelector("svg");
            if (!svg) return null;
            const doc = new DOMParser().parseFromString(new XMLSerializer().serializeToString(svg), "image/svg+xml");
            const root = doc.documentElement;
            if (!root || root.nodeName === "parsererror") return null;
            root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            root.setAttribute("width", "72");    // 画布上按 30px 画，栅格化给足余量才不发虚
            root.setAttribute("height", "72");
            const cs = getComputedStyle(host);
            const vars = {
                "--icon-clr": col,
                "--brand-gradient-start-appname": cs.getPropertyValue("--brand-gradient-start-appname").trim() || th.primary || "#006098",
                "--brand-gradient-end-appname": cs.getPropertyValue("--brand-gradient-end-appname").trim() || th.primary || "#006098"
            };
            Object.keys(vars).forEach((k) => root.style.setProperty(k, vars[k]));
            root.style.color = col;   // 其余笔画走 currentColor
            return await imgFromData(new XMLSerializer().serializeToString(root));
        } catch (e) {
            return null;
        } finally {
            if (temp) temp.remove();
        }
    }

    /** 进度卡 / 水印要用的主题色：canvas 读不到 CSS 变量，只能先把算好的值取出来 */
    function readThemeVars() {
        const host = stageHost() || document.body;
        const cs = getComputedStyle(host);
        const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
        // CGoUI 玻璃系统的模糊半径（blur(14px) saturate(135%) 里的那个 14）
        const gm = /blur\(\s*([\d.]+)px/.exec(v("--glass-backdrop-blur-surface", "blur(14px)"));
        return {
            font: getComputedStyle(document.body).fontFamily || "sans-serif",
            text: v("--text-main", "#222"),
            primary: v("--primary-color", "#00263b"),
            border: v("--border-color", "rgba(0,0,0,.12)"),
            info: v("--btn-info-bg", "rgba(0,0,0,.06)"),
            mapBg: v("--map-bg", "#ffffff"),
            glassPanel: v("--glass-bg-panel", "rgba(255,255,255,.82)"),
            glassBlur: gm ? parseFloat(gm[1]) : 14
        };
    }

    function b64Bytes(buf) {
        const b = new Uint8Array(buf); let s = ""; const CH = 0x8000;
        for (let i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
        return btoa(s);
    }

    /**
     * 把单色 SVG 图片（base64 data URL）的填充色统一换成给定色。
     * 导出时给「靠 CSS mask 着色」的徽标兜底用（见 paintFrame 里对 airport.svg 的处理）：
     * mask 的相对 url 内联进 SVG 后没有 base URL、解析不到，只能改成直接着色。取不到就原样返回。
     */
    function recolorSvg(dataUrl, color) {
        try {
            const m = /^data:image\/svg\+xml;base64,/i.exec(dataUrl);
            if (!m) return dataUrl;
            const bin = atob(dataUrl.slice(m[0].length).replace(/\s+/g, ""));
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            let svg = new TextDecoder("utf-8").decode(bytes);
            svg = svg.replace(/fill=(['"])(?!none\b)[^'"]*\1/gi, 'fill="' + color + '"');
            if (!/fill=/i.test(svg)) svg = svg.replace(/<svg\b/i, '<svg fill="' + color + '"');
            const out = new TextEncoder().encode(svg);
            let s = "";
            const CH = 0x8000;
            for (let i = 0; i < out.length; i += CH) s += String.fromCharCode.apply(null, out.subarray(i, i + CH));
            return "data:image/svg+xml;base64," + btoa(s);
        } catch (e) { return dataUrl; }
    }

    /* ---- 编码：WebCodecs `VideoEncoder` + mp4-muxer ----
     * 逐帧循环与播放共用 `applyFrame(t)`：每帧先把它之后的画面落到 DOM，再用
     * `paintFrame` 取图。⚠️ 这里用**非落定**模式（settle 省略）—— 站点弹出、涟漪要逐帧
     * 保留，`paintFrame` 的 `alphaAt` 正是按「正在弹的那几个」算可见度；若传 settle=true，
     * 弹出会在同一帧被立刻收尾，导出里就看不到站「弹」出来了。 */

    const encoderConfig = () => ({
        codec: EXPORT.codec,
        width: EXPORT.width,
        height: EXPORT.height,
        bitrate: EXPORT.bitrate,
        framerate: EXPORT.fps,
        avc: { format: "avc" }   // mp4-muxer 要的是 AVCC 格式的块，缺了它封不出可播的 MP4
    });

    /** 按需注入 mp4-muxer（31KB）：不导出就不加载，同一份只注入一次 */
    function loadMuxer() {
        if (window.Mp4Muxer) return Promise.resolve(window.Mp4Muxer);
        if (state.muxerLoading) return state.muxerLoading;
        state.muxerLoading = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = EXPORT.muxerSrc;
            s.onload = () => (window.Mp4Muxer ? resolve(window.Mp4Muxer) : reject(new Error("mp4-muxer 未挂到全局")));
            s.onerror = () => reject(new Error("mp4-muxer 加载失败"));
            document.head.appendChild(s);
        });
        return state.muxerLoading;
    }

    /** 能力自检：浏览器是否真支持这套编码配置（判 supported 而不是只看构造函数存在） */
    async function canEncode() {
        if (typeof window.VideoEncoder !== "function" || typeof window.VideoFrame !== "function") return false;
        try {
            const r = await window.VideoEncoder.isConfigSupported(encoderConfig());
            return !!(r && r.supported);
        } catch (e) { return false; }
    }

    function downloadBlob(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    /** 文件名：`{城市}_线网发展史_{起}_{止}_{导出时间戳}.mp4`（时间戳避免同名导出互相覆盖/看不出先后） */
    const exportFileName = (from, to) => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, "0");
        const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
        const a = state.steps[from] ? state.steps[from].date : "start";
        const b = state.steps[to] ? state.steps[to].date : "end";
        // 文件名带上城市：多城各导一段时不至于混在一起（城市名取当前注册城市）
        let city = "";
        try {
            const c = window.CityDataManager && window.CityDataManager.getCurrentCity
                ? window.CityDataManager.getCurrentCity() : null;
            city = (c && c.name) || "";
        } catch (e) { /* 取不到就不带城市 */ }
        return `${city ? city + "_" : ""}线网发展史_${a}_${b}_${stamp}.mp4`;
    };

    /**
     * 把第 from..to 步导出为 MP4。与播放共用一条时间轴：
     * ① from>0 时先把之前的事件落成「已开通」（jumpTo），画面从 from 起播；
     * ② 逐帧 `applyFrame(t)` → `paintFrame` → `VideoFrame` → `encode`，按背压等队列；
     * ③ flush → finalize → Blob 下载。导出期间停下实时播放并锁住相关控件。
     */
    async function runExport(from, to) {
        if (state.exporting) return;
        // ⚠️ 代次令牌：`state` 是本模块单例，导出期间把面板关掉再打开时，
        //    在飞的旧导出会继续往**新面板**上写状态、还会把画面落位（把新实例的镜头拽走）。
        //    unmount 里 +1 即可让它下一拍自行收手（上游审查意见 #4）。
        const gen = ++state.exportGen;
        const alive = () => gen === state.exportGen;
        state.exporting = true;
        state.exportCancelled = false;
        // 浮层的静态信息：本次导出的范围 + 当前运镜参数（导出期间这些控件都被锁住）
        {
            const e0 = state.els;
            const a = state.steps[from], b = state.steps[to];
            if (e0 && e0.expRange) e0.expRange.textContent = (a && b) ? a.date + " → " + b.date : "—";
            if (e0 && e0.expSpeed) e0.expSpeed.textContent = state.speed + " px/s";
            if (e0 && e0.expZoom) e0.expZoom.textContent = state.zoom.toFixed(1) + "×";
            if (e0 && e0.expNow) e0.expNow.textContent = a ? a.date + " " + (a.title || stepLabel(a)) : "—";
        }
        // 导出与 rAF 会抢同一条时间线：先把实时播放停干净
        clearTimers();
        state.playing = false;
        syncPlayBtn();
        syncExportUI();
        setExportStatus("正在检查编码支持…");
        let encoder = null;
        let muxer = null;
        try {
            if (!(await canEncode())) {
                throw new Error("当前浏览器不支持 WebCodecs H.264 编码，请用较新版 Chrome / Edge");
            }
            if (!alive()) return;
            setExportStatus("准备资源…");
            // 起点画面：from>0 时先补出「之前已开通」的全部线网与车站
            if (from > 0) jumpTo(from - 1);
            else { clearCanvas(); clearMarks(); enterStage(); }
            state.timeline = buildTimeline(from, to);
            state.popDone = new Set();
            state.activePops = [];
            state.ripples = [];
            state.lastPanelI = null;
            state.lastResyncI = null;
            await prepareExport();

            const Mp4Muxer = await loadMuxer();
            muxer = new Mp4Muxer.Muxer({
                target: new Mp4Muxer.ArrayBufferTarget(),
                video: { codec: "avc", width: EXPORT.width, height: EXPORT.height },
                fastStart: "in-memory"
            });
            let encError = null;
            encoder = new window.VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: (e) => { encError = e; }
            });
            encoder.configure(encoderConfig());

            const canvas = document.createElement("canvas");
            canvas.width = EXPORT.width;
            canvas.height = EXPORT.height;
            const ctx2d = canvas.getContext("2d");
            const total = state.timeline.total;
            const dt = 1000 / EXPORT.fps;
            const frames = Math.max(1, Math.ceil(total / dt));
            for (let i = 0; i <= frames; i++) {
                if (!alive() || state.exportCancelled) break;
                if (encError) throw encError;
                const t = Math.min(total, i * dt);
                applyFrame(t);
                await paintFrame(canvas, t, ctx2d);
                const frame = new window.VideoFrame(canvas, {
                    timestamp: Math.round(i * 1e6 / EXPORT.fps),
                    duration: Math.round(1e6 / EXPORT.fps)
                });
                encoder.encode(frame, { keyFrame: i % (EXPORT.fps * 2) === 0 });
                frame.close();
                // 背压：待编码帧堆太多会把内存打爆，超阈值就等一会儿
                while (encoder.encodeQueueSize > 8 && alive() && !state.exportCancelled && !encError) {
                    await new Promise((r) => setTimeout(r, 4));
                }
                if (!alive()) break;
                setExportProgress(i + 1, frames + 1, t);
                if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0));  // 定期让出主线程
            }
            if (encError) throw encError;
            if (!alive()) return;

            if (state.exportCancelled) {
                setExportStatus("已取消");
            } else {
                setExportStatus("正在封装 MP4…");
                await encoder.flush();
                encoder.close();
                encoder = null;
                muxer.finalize();
                const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
                downloadBlob(blob, exportFileName(from, to));
                setExportStatus(`已导出 ${frames + 1} 帧 · ${(total / 1000).toFixed(1)} 秒 · ${(blob.size / 1048576).toFixed(1)} MB`);
            }
            document.dispatchEvent(new CustomEvent("cgo:opening-export-done", {
                detail: { from: from, to: to, cancelled: state.exportCancelled }
            }));
        } catch (e) {
            console.error("[线网发展史] 导出失败：", e);
            if (alive()) setExportStatus("导出失败：" + (e && e.message ? e.message : e), true);
        } finally {
            if (encoder) { try { encoder.close(); } catch (e) { /* 已关闭或未配置 */ } }
            // 面板已被关掉 / 已换新实例（代次变了）时，什么都不碰：旧实例的落位会把新实例的镜头拽走
            if (alive()) {
                // 取消时不要只落最后一帧：先清干净再跳到 to —— 保证生长组的 bookkeeping 与 DOM 一致
                // （只落帧会留下 dataset.no / __segs 与实际子节点不匹配，那条线整段不画）。
                if (state.timeline && state.els) {
                    try {
                        clearCanvas();
                        jumpTo(to);
                    } catch (e) { /* 重建失败也要让流程正常收尾 */ }
                    state.index = to;
                    state.tCur = state.timeline.total;
                }
                state.exporting = false;
                // 成功收尾时让「已导出 N 帧 · xx MB」在浮层上停一会儿再收（否则一闪而过）；
                // 取消 / 失败 / 面板已换则立即收。
                const modal = state.els && state.els.expModal;
                if (modal && !state.exportCancelled) {
                    setTimeout(() => {
                        if (state.els && state.els.expModal === modal) syncExportUI();
                    }, 2600);
                } else {
                    syncExportUI();
                }
            }
        }
    }

    function setExportStatus(text, isError) {
        const el = state.els && state.els.expStatus;
        if (!el) return;
        el.textContent = text || "";
        el.classList.toggle("is-error", !!isError);
    }

    /** 导出首次进度的打点时刻：用来估剩余时间（每轮导出在 done ≤ 1 时重打） */
    let exportStartAt = 0;

    /** 毫秒 → 「N 秒」/「M 分 N 秒」 */
    function fmtDuration(ms) {
        const s = Math.max(1, Math.round(ms / 1000));
        if (s < 60) return s + " 秒";
        return Math.floor(s / 60) + " 分 " + (s % 60) + " 秒";
    }

    function setExportProgress(done, total, t) {
        const e = state.els;
        const pct = total ? Math.round(done / total * 100) : 0;
        if (e && e.expBar) e.expBar.style.width = pct + "%";
        // 预估剩余时间：已用时间 ÷ 已导帧数 × 剩余帧数。⚠️ 从第 3 帧起才显示 —— 头几帧
        // 还要摊上编码器初始化与首屏渲染的开销，拿它估会把结果抬得离谱。
        const now = Date.now();
        if (done <= 1) exportStartAt = now;
        const elapsed = exportStartAt ? (now - exportStartAt) / 1000 : 0;
        // 实时渲染帧率（相对目标帧率）—— 拼在状态行**末尾**（紧随预计剩余时间）
        const fps = (elapsed > 0.3 && done > 1)
            ? (done / elapsed).toFixed(1) + "/" + EXPORT.fps + " fps"
            : "—/" + EXPORT.fps + " fps";
        // 当前正在导出的事件：按 t 落到哪一拍
        if (e && e.expNow && t != null && state.timeline) {
            const rec = recAt(t);
            const s = rec ? state.steps[rec.i] : null;
            if (s) e.expNow.textContent = s.date + " " + (s.title || stepLabel(s));
        }
        let eta = "";
        if (exportStartAt && done > 2 && total && done < total) {
            eta = " · 预计剩余 " + fmtDuration((now - exportStartAt) / done * (total - done));
        }
        setExportStatus(`导出中 ${pct}%${eta} · ${fps}`);
    }

    /** 起止事件下拉：用 CGoUI 的 `<cgo-toolbar-select>`（自带下拉面板与主题跟随） */
    function renderExportSelects() {
        const e = state.els;
        if (!e || !e.expFrom || !e.expTo) return;
        // 选项左边一颗线路色圆点（`.cgo-toolbar-option-dot`），文字用「日期 + 事件标题」
        const opts = state.steps
            .map((s) => `<cgo-toolbar-option value="${s.no - 1}">`
                + `<span class="cgo-toolbar-option-dot" style="background:${s.color}"></span>`
                + `${s.date} ${s.title || stepLabel(s)}</cgo-toolbar-option>`)
            .join("");
        e.expFrom.innerHTML = opts;
        e.expTo.innerHTML = opts;
        e.expFrom.value = "0";
        e.expTo.value = String(state.steps.length - 1);
        setExportStatus("");
    }

    /**
     * 卡面 / 位置控件的状态同步：两个卡面按钮各自点亮（都关即不显示卡片）；
     * 位置项按「是否开了事件列表」分两组显隐 —— 开了列表（卡片纵向撑满）只剩左右，
     * 只开「当前事件」时是四角；**两个都关时整行位置隐藏**（卡片都不显示，位置无从谈起）。
     */
    function syncCardOpts() {
        const el = state.els;
        if (!el) return;
        const showSum = state.cardShowSummary !== false;
        const showList = !!state.cardShowList;
        const pos = cardPos();
        if (el.expMode) {
            el.expMode.querySelectorAll("[data-face]").forEach((b) => {
                const on = b.dataset.face === "summary" ? showSum : showList;
                b.classList.toggle("is-on", on);
                b.setAttribute("aria-pressed", String(on));
            });
        }
        if (el.expCardField) el.expCardField.style.display = (showSum || showList) ? "" : "none";
        if (el.expCard) {
            el.expCard.querySelectorAll(".cgo-rt-need-opt").forEach((b) => {
                const mine = (b.dataset.for === "list") === showList;
                // ⚠️ 用内联 display 而不是 hidden 属性：分段控件的 display 会盖过 [hidden]
                b.style.display = mine ? "" : "none";
                b.classList.toggle("is-on", mine && b.dataset.card === pos);
            });
        }
    }

    /** 导出期间锁住会干扰时间线的控件，只留「取消」；同时同步导出按钮的按下态 */
    function syncExportUI() {
        const e = state.els;
        if (!e) return;
        const on = state.exporting;
        const open = e.exportSet && !e.exportSet.hidden;
        [e.back, e.play, e.replay, e.setSpeed, e.setZoom, e.toggleInfo].forEach((b) => { if (b) b.disabled = on; });
        // 展开导出区时把「当前事件 / 说明 / 规模 / 进度条」四块藏起来：它们已合成进视频的进度卡，
        // 面板上再放一份既重复又占高度（见 opening-history.css 的 .cgo-oh.is-export）
        if (e.root) e.root.classList.toggle("is-export", open);
        if (e.exportToggle) {
            e.exportToggle.classList.toggle("is-on", open);
            e.exportToggle.setAttribute("aria-pressed", String(open));
        }
        if (e.expFrom) e.expFrom.disabled = on;
        if (e.expTo) e.expTo.disabled = on;
        if (e.expCard) e.expCard.querySelectorAll(".cgo-rt-need-opt").forEach((b) => { b.disabled = on; });
        if (e.expStart) e.expStart.hidden = on;
        // 进度 / 剩余时间 / 帧率 / 取消都在 CGoUI 的浮层里（导出期间不随面板乱动）
        if (e.expModal) e.expModal.open = !!on;
        if (e.expBar) e.expBar.style.width = on ? "0%" : e.expBar.style.width;
    }

    /* ── 导出浮层与控件绑定（原在 mount 里，随导出逻辑一起搬来） ─────────── */

    /** 导出浮层改挂到 body：面板容器可能带 transform，留在里面会盖不住整屏 */
    function mountModal() {
        const el = state.els;
        if (!el || !el.expModal) return;
        document.body.appendChild(el.expModal);
        // 安全冗余：关掉浮层（点右上角 ×）即视为取消导出
        state.modalObserver = new MutationObserver(() => {
            if (state.exporting && !el.expModal.open) state.exportCancelled = true;
        });
        state.modalObserver.observe(el.expModal, { attributes: true, attributeFilter: ["open"] });
    }

    /** 导出区的控件绑定（导出按钮 / 起止钳制 / 进度卡 / 开始 / 取消） */
    function bindControls() {
        const el = state.els;
        if (!el) return;
        // 不支持 WebCodecs 的设备上按钮不渲染（见 canExportVideo），绑定随之跳过
        if (el.exportToggle) el.exportToggle.addEventListener("click", () => {
            if (state.exporting) return;
            const open = el.exportSet.hidden;
            el.exportSet.hidden = !open;
            el.speedSet.hidden = true;
            el.zoomSet.hidden = true;
            // 与「事件清单」互斥：两个按钮不同时点亮（清单占的是同一块信息区）
            if (open) { el.root.classList.remove("is-list"); syncToggle(); }
            syncExportUI();
        });
        // 起止两个下拉互相钳制，避免选出「起 > 止」的空区间
        el.expFrom.addEventListener("cgo-change", () => {
            if (Number(el.expTo.value) < Number(el.expFrom.value)) el.expTo.value = el.expFrom.value;
        });
        el.expTo.addEventListener("cgo-change", () => {
            if (Number(el.expFrom.value) > Number(el.expTo.value)) el.expFrom.value = el.expTo.value;
        });
        // 卡面：当前事件 / 事件列表两个**独立开关**（都可关；两个都关即不显示卡片）
        if (el.expMode) el.expMode.addEventListener("click", (ev) => {
            const b = ev.target.closest("[data-face]");
            if (!b || state.exporting) return;
            if (b.dataset.face === "list") state.cardShowList = !state.cardShowList;
            else state.cardShowSummary = !state.cardShowSummary;
            syncCardOpts();
        });
        // 位置：分段控件，点哪段就写到当前生效那一组对应的值上
        el.expCard.addEventListener("click", (ev) => {
            const b = ev.target.closest(".cgo-rt-need-opt");
            if (!b || state.exporting) return;
            const listOn = !!state.cardShowList;
            if ((b.dataset.for === "list") !== listOn) return;   // 只认当前生效那一组（另一组是隐着的）
            if (listOn) state.cardPosList = b.dataset.card;
            else state.cardPos = b.dataset.card;
            syncCardOpts();
        });
        el.expStart.addEventListener("click", () => {
            runExport(Number(el.expFrom.value), Number(el.expTo.value));
        });
        el.expCancel.addEventListener("click", () => { state.exportCancelled = true; });
    }

    SHARED.export = {
        EXPORT: EXPORT,
        CARD: CARD,
        cardPos: cardPos,
        renderSelects: renderExportSelects,
        syncCardOpts: syncCardOpts,
        syncExportUI: syncExportUI,
        mountModal: mountModal,
        bindControls: bindControls,
        run: runExport
    };
})();
