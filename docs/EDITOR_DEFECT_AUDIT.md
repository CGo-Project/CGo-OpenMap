# OpenMap Editor（`/editor/`）代码审计与缺陷交接文档

> **文档性质**：面向 AI Agent 的技术交接 / 缺陷报告。读者对象是**没有参与过本次审计**的另一个 AI（或人类工程师）。
> **阅读建议**：第 0 节 → 第 1 节 → 第 2 节（挑与自己任务相关的）→ 第 3 节（缺陷，含可直接运行的复现脚本）。
> **写作原则**：每条结论都带 `文件:行号` 锚点；凡是「我实际跑出来的」与「只是读代码推断的」严格区分；凡是「已核实正常」的也写出来，避免后续 AI 重复排查。

---

## 0. 文档元信息与工作区状态（重要，先读这一节）

| 项 | 值 |
|---|---|
| 仓库 | `CGo-OpenMap`（纯静态 SVG 轨道交通线路图引擎 + 编辑器） |
| 被审计对象 | `editor/` 目录：45 个 JS 文件 / 23,368 行 + 3,229 行 CSS + 1,130 行 HTML + 2,854 行自检脚本（审计基线；并行开发会让 JS 行数继续增长） |
| 审计时间 | 2026-11-09（CST），审计基线 commit `f7364f1` |
| 审计方式 | 全量静态阅读 + Node 下对纯函数/流水线做**可运行实验**（无浏览器，无 E2E） |
| 自检基线 | `node editor/tests/selfcheck.js` → **920 项断言全绿，覆盖 39 座城市**；`node scripts/check-site-version.mjs` → 版本串一致 `261107.024200` |

### 0.1 工作区正在被外部改动（⚠️ 接手前必读，避免撞车）

审计期间（2026-11-09 10:04 起）工作区出现了**并非本次审计产生**的改动，并且**仍在持续增加**：

| 状态 | 文件 | 内容 |
|---|---|---|
| `M` | `editor/index.html` | Beta4 → Beta5；左上角图标 `map` → `drunk`；若干 HTML 换行重排 |
| `M` | `editor/js/core/history-manager.js` | 正在扩展为「Transactional Undo/Redo」：新增 `beginTransaction/commitTransaction/cancelTransaction/runInTransaction`、`pushDebounced` 防抖合并、`sanitizeSelection`（对应 `EDITOR_SURPASS_PLAN.md` 的「矩阵 2 模块 D」） |
| `M` | `editor/js/algorithms/smart-guides.js` | 大幅扩写（+327/-75 行） |
| `M` | `editor/js/layers/grid-layer.js` | 并行改动中（写作时仍在变化） |
| `??` | `docs/EDITOR_SURPASS_PLAN.md` | 新增：《CGo OpenMap Editor 对标 RMP 全面超越专项升级方案》 |
| `??` | `editor/js/tools/rmp-importer.js` | 新增：RMP（Rail Map Painter）格式导入器 |
| `??` | `docs/EDITOR_DEFECT_AUDIT.md` | **本文档**（本次审计唯一产物） |

结论：**有另一个会话/开发者在并行实现「对标 RMP」的升级**。本次审计**没有修改仓库内任何已有文件**（所有实验脚本写在 `/tmp`，已逐一验证可复现）。

⚠️ 上表是**写作时的快照**，并行改动仍在增加（写作过程中已从 2 个文件涨到 4 个）。请以你自己跑出来的 `git status` 为准。

**接手要求**：
1. 先 `git status` + `git diff` 看清对方改了什么；
2. 修复前先与并行的开发者对齐，或把本文档的缺陷单独立分支处理；
3. 本文档列出的 P0/P1 全部落在**对方尚未触碰的文件**里（`pipeline-surgical.js`、`pipeline-draw.js`、`inspector-view.js`、`editor-app.js`、`agent-api.js`、`deepseek-vision.js`），所以修复目标本身是干净的。

### 0.2 本文所有行号的可信度

- ✅ **行号可信**（审计期间逐字未变，且当前 `git status` 未列出）：`editor/js/pipelines/pipeline-surgical.js`、`pipeline-draw.js`、`ui/inspector-view.js`、`editor-app.js`、`tools/agent-api.js`、`tools/deepseek-vision.js`、`tools/bundle-exporter.js`、`algorithms/segment-router.js`、`algorithms/align-45.js`、`algorithms/station-order.js`、`layers/viewport.js`。
- ⚠️ **行号会漂移**：
  - `editor/index.html`（正在被改，引用处请重新 grep；本文只在 D-11 引用它）；
  - `editor/js/core/history-manager.js`（正在被扩写；本文只在 D-13 提到「120 步」，该常量当前仍为 `MAX_STEPS = 120`，但行号会变）。

### 0.3 运行环境注意

本机 `PATH` 里**没有 `node`**（`bash: node: command not found`）。审计时使用的是 harness 自带运行时：

```bash
export PATH="/Users/liuzihan/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin:$PATH"
cd /path/to/CGo-OpenMap
node editor/tests/selfcheck.js
node scripts/check-site-version.mjs
```

如果你在别的环境，请自行确认 `node` ≥ 18（脚本用了 `String.prototype.replaceAll` 之类的新 API 吗？——没有，但用了可选链 `?.`，需 Node ≥ 14；selfcheck 里用 `structuredClone`? ——没有）。

---

## 1. TL;DR —— 缺陷总表

级别定义：**P0 = 会造成城市数据损坏/丢失**；**P1 = 用户可感知的功能失效或静默不保存**；**P2 = 局部错误、可绕开**；**P3 = 规范/一致性/可移植性问题**。

| ID | 级别 | 一句话描述 | 证据强度 | 状态 |
|---|---|---|---|---|
| **D-01** | P0 | 一条线路有多段折线时，保存只留**最后一段** `pathPoints`，其余走向被永久丢弃 | 端到端复现（有脚本+输出） | 未修复 |
| **D-02** | P0 | **新增线路**的走向 `pathPoints` 永远不写回，折角走线保存后退化成「按站序连直线」 | 端到端复现 | 未修复 |
| **D-03** | P1 | `data_notopen.js` 与 `data_virtual_transfers.js` **完全不在写回清单**：删除在建走向后 `hasChanges = false` | 端到端复现 | 未修复 |
| **D-04** | P1 | 一批「界面可改、引擎消费、但永不落盘」的字段：车站 `code`/`amenities`/`siblings`，线路 `strokeWidth`/`strokeDasharray`/`strokeLinecap`/`strokeLinejoin` | 代码双向确认 + 引擎消费点核对 | 未修复 |
| **D-05** | P1 | DeepSeek 配置弹窗 4 个按钮**双绑定** + `deepseekApiBase` id 拼错 → 自定义 Base URL 保存后被静默重置为官方默认 | 静态确认（唯一性 grep） | 未修复 |
| **D-06** | P2 | 线段检视面板「编辑线路」按钮**完全无效**，且会白压一步撤销栈 + 让「已修改」计数 +1 | 静态确认（全仓唯一派发点，无处理分支） | 未修复 |
| **D-07** | P2 | `SegmentRouter` 偶发返回**终点 ≠ 输入终点**（最大 0.495px），根因 `dedupePoints` 丢弃末点 | 54,000 组随机用例（26 组失败） | 未修复 |
| **D-08** | P2 | `AgentAPI.renderSvgString()` 必抛 `TypeError`（把包装对象喂给 `XMLSerializer`） | 静态确认 | 未修复 |
| **D-09** | P2 | 「45/90 对齐」忽略 `project.slope`，对 2:1（香港）/3:2（沈阳）体系会压成 45° | 静态确认（无 slope 参数） | 未修复 |
| **D-10** | P3 | 编辑器**无触控手势**：`activePointers` / `lastPinchDist` 是声明后从未使用的死变量，全项目无 `touchstart/pointerdown` | 静态确认（grep 全文） | 未修复 |
| **D-11** | P3 | PDF.js 走 cdnjs CDN（`index.html` 静态预加载 + `pdf-vector-extractor.js` 动态加载），而编辑器**不进 Service Worker 缓存** → 离线不可用 | 静态确认 | 未修复 |
| **D-12** | P3 | UI 层出现 Emoji（`⚠️/✅/❌/✔`），违反项目铁律五（必须用 `<cgo-icon>`） | grep 结果 | 未修复 |
| **D-13** | P3 | `AGENTS.md` 第 5 章严重落后于代码（221 断言/15 城 vs 实际 920/39；60 步历史 vs 实际 120；30+ 模块未提及） | 数字核对 | 未修复 |

**同一个根因的三条缺陷**：D-01 / D-02 / D-03 都源于 `syncSegmentsToLines` + `computeChangeset` 假定「一个 segment = 该线路的一个走向组」。**建议一起修**，见 §3.4。

---

## 2. 架构速览（帮助你在不改错地方的前提下动刀）

### 2.1 项目铁律（来自 `AGENTS.md`，违反会被评审打回）

1. **纯前端、零构建**：原生 HTML + SVG + CSS + Vanilla JS + Web Components。**禁止** React/Vue/Angular/Svelte、Vite/Webpack/Rollup/Babel、Node 服务端、PM2。
2. **`core/` 与 `city/` 解耦**：`core/` 严禁硬编码任何城市私有 ID / 站名 / 颜色。
3. **主题与多端**：颜色一律走 CSS 变量；UI 必须兼容亮/暗主题（编辑器自身触控支持目前缺失，见 D-10）。
4. **改代码/数据必须同步版本号**：`sw.js` 的 `CACHE_NAME` 与 6 个页面的 `?v=yymmdd.hhmmss`（12 位 + 小数点）**全站一致**，改完必须跑 `node scripts/check-site-version.mjs`。
5. **UI 图标必须用 `<cgo-icon name="…">`，严禁 Emoji**（编辑器是现存违规点，见 D-12）。
6. **编辑器回写必须无损**：禁止「解析成对象再整体重新序列化」；只能用 `CityProjectIO.patchEntries()` 做叶子级替换。
7. **提交纪律**：未经用户明确指示**禁止** `git commit` / `git push` / `git reset`。

### 2.2 加载链与入口

`editor/index.html` 按固定顺序加载（**顺序有依赖，不可打乱**）：

```
cgo-ui.js（module）· path-geometry.js · station-icons.js · city/data.js
→ core/（project-model · history-manager · startup-policy · city-project-io
        · city-render-runtime · station-style-catalog）
→ algorithms/（station-order · align-45 · segment-router · data-sanitizer
               · align-solver · topology-tracer · transform-engine
               · smart-guides · polygon-boolean · parallel-corridor）
→ layers/（viewport · grid · ghost · scattered · water · text-scattered
           · vector-route · not-open · virtual-connector · station）
→ tools/（pdf-vector-extractor · deepseek-vision · knowledge-matcher
          · batch-station · mileage-manager · water-exporter
          · bundle-exporter · swatches-palette · agent-api）
→ pipelines/（ingest · surgical · draw）→ ui/（ribbon · nav-tree · inspector
          · asset-drawer · confirm-dialog · context-menu）→ editor-app.js
```

所有模块统一 IIFE 模式并挂到 `window.OpenMapEditor.X`（多数同时挂 `window.X` 兼容别名），纯函数模块额外 `module.exports` 供 Node 自检使用。

**入口参数**：`editor/index.html?city={city_id}`（载入城市）、`?mode=draw|ingest`（预选 Ribbon 页签）。

### 2.3 三条流水线

| 流水线 | 文件 | 职责 |
|---|---|---|
| **Ingest 智能转换** | `editor/js/pipelines/pipeline-ingest.js`（160 行） | PDF/AI 矢量直通 → `DataSanitizer` 净化 → 生成 Project；矢量层不足时降级到 DeepSeek 视觉识图 |
| **Surgical 存量维护** | `pipeline-surgical.js`（1,096 行） | 载入 `city/{id}/` 六个 `data_*.js` 的**源码原文** → 编辑 → 条目级无损回写 / File System Access 原地直存 |
| **Draw 自由规划** | `pipeline-draw.js`（634 行） | 空白画布建城：车站 / 走线 / 水域 / 自由文本；网格与夹角吸附 |

### 2.4 工程数据模型（`editor/js/core/project-model.js`）

```js
{
  version: 1,
  canvas: { width, height },
  nodes: { [id]: { id, x, y, cn, en, type, align, offset:{x,y}, hideLabel, textScale,
                   marker?, halo?, code?, amenities?, siblings?, lab?, notOpen? } },
  segments: [ { id, lineId, branchKey?, type, points:[{x,y,nid?,r?}], routed?, cornerFlip?, notOpen? } ],
  lines:    [ { id, name, color, company?, stationIds|stationIds-wayN,
                distances|distances-wayN, pathPoints|pathPoints-main/-branchN,
                useStrictRounding?, strokeWidth?, ... } ],
  waters:   [ { id, name, type:'poly'|'river', points:[], width? } ],
  texts:    [ { id, text, x, y, size, bold, anchor, rotate, color } ],
  virtualTransfers: [], virtualConnectors: [ { from, to, offsetFrom, offsetTo, free } ],
  notOpenLines: [ { name, points:[], style:{ width, color } } ],
  scattered: [ { id, x, y, file, width, height, opacity, rotation, zIndex } ],
  legend: [], waterStyle: {…}, slope: { m, n }, lineDistances: {}, idSeq: 1
}
```

**关键约定（改了会引发连锁问题）**：

- **`segments` 才是几何真源**，`lines[].pathPoints` 是导出用的派生结果；`lines[].stationIds` 只是站序（历史原因曾是「点击顺序」，现在由 `StationOrder` 按拓扑重排）。
- **派生字段一律以 `_` 前缀**（`_lineColors`、`_exportedToCity`、`_uncoveredStations`），`city-project-io.js` 的序列化与脏判定都按此前缀过滤。
- **折线倒角只能走 `core/path-geometry.js`**（`CGoPathGeometry`）；车站图元只能走 `core/station-icons.js`（`CGoStationIcons`）。编辑器与引擎共用同一份，`selfcheck.js` 有结构性断言守着。**严禁复刻第二份实现。**

### 2.5 渲染链路（`editor-app.js` 的 `renderAll()`，约 :415）

```
画板底色 → scattered 装饰 → 网格 → 水域 → 线路走向 + 草稿预览
→ 在建走向 → 虚拟换乘连线 → 车站图元/站名 → 变换手柄 → 自由文本
→ 参考底图 → 左侧大纲树 → 右侧检视面板 → 图层状态 → 标尺 → 健康度 → 会话自动保存
```

- 视口：`layers/viewport.js` 提供唯一坐标变换（`screenToWorld / worldToScreen / zoomToPoint / centerOn / fitCanvas`），缩放范围 0.05–6.0；吸附与斜率射线在 `snapPoint / snapPointToRays`。
- 车站外观：`core/city-render-runtime.js` 用 **Proxy 沙箱**把城市脚本「借」进编辑器（`document.write`、`<script>` 注入、对 main.html 图层的查询全部落空），从而复用城市的 `renderStationIcon / decorateStationLabel / getStationUnderlays`，保证「编辑器所见 = 线上所得」。
- 高频拖动用 `scheduleRender()` 合并到每帧一次（`requestAnimationFrame`）。

### 2.6 写回契约（**动它就是动刀口，务必先读**）

```
编辑 → computeDirtyStations() / computeDirtyLines() / patchScatteredSource()
     → patchStationsSource() / patchLinesSource()（生成 patchedSource 文本）
     → computeChangeset()（汇总 3 个文件 + 水域资产）
     → 用户确认 → saveDirectToLocal() / 下载 Changeset ZIP
```

- `CityProjectIO.patchEntries(source, varName, { update, remove, append })`（`core/city-project-io.js:631`）扫描每条数据的**字面量区间**，递归比对只重写真正变化的叶子；注释、缩进、字段顺序、未识别字段（悉尼 `marker.parts`、北京 `textScale`）逐字节保留。
- 目录安全：`resolveCityDir()`（`pipeline-surgical.js:883`）只接受「目录名 == cityId 且内含 `data_stations.js`」，认不出就**报错而不是回落**。
- 写盘重试：`writeOneFile()` 针对 `InvalidStateError`（File System Access 句柄缓存过期）会**重新校验目录后重试一次**。
- 危险操作有护栏：「强制回写」要求手输城市 ID，并先自动下载原件备份 ZIP。

### 2.7 撤销、会话与导出

- 撤销：`core/history-manager.js`，**120 步 / 8MB 双阈值**裁剪，`pushSnapshot` 会去重（与栈顶相同的快照直接丢弃）。
- 会话：`localStorage['openmap_editor_session_v1']` 存工程 + 原始源码 + 载入快照（配额不足时降级为只存工程）；`beforeunload` / `visibilitychange` 时落盘。
- 启动策略：`core/startup-policy.js` 决定 `?city=` 与恢复会话的优先级（issue #50）；线上部署（非 localhost/局域网/file:）**不提供在线城市库**，必须「关联本地目录」。
- 导出：Changeset ZIP / OpenMap 标准城市包（`bundle-exporter.js` 手写 ZIP，method=0 + 自算 CRC32）/ 工程 JSON / SVG / 2x PNG。

### 2.8 自检（**改纯函数层或回写逻辑后必须跑**）

```bash
node editor/tests/selfcheck.js        # 920 断言 / 39 座城市，零依赖、不需要浏览器
node scripts/check-site-version.mjs   # 6 个页面 + sw.js 的版本串一致性
```

覆盖范围：源码扫描器精度、条目级无损回写（改/删/加/组合）、递归最小编辑集、分支访问器、倒角几何、`isPointOnly`、车站图元与 CSS 尺寸一致性、样式目录、Changeset 全要素、AgentAPI、启动策略、批量建站、网格吸附、撤销栈、变换引擎、布尔运算、平行走线……

**已知空白（本文缺陷正好落在这里）**：
- `syncSegmentsToLines()` —— **零覆盖**（grep 全文无一处）；
- 多 segment / 多走向线路上保存后的 `pathPoints` 完整性 —— 无覆盖；
- `data_notopen.js` / `data_virtual_transfers.js` 的写回 —— 无覆盖（功能本身不存在）；
- `code` / `amenities` / `siblings` / `strokeWidth` 等字段的脏判定 —— 无覆盖。

---

## 3. 缺陷详情

> 复现脚本全部在本文 §5 附录 A，可直接复制运行（需 Node）。所有脚本**不会修改仓库**，只在 `/tmp` 下运行。

### D-01（P0）多段折线 → 保存只留最后一段走向

**症状**
在「城市维护」模式下给一条线延长/改线（用 135°、90°、斜 90° 或比例斜率工具），画布上正常；`Ctrl+S` 写回后，文件中该线路的 `pathPoints` **只剩最后画的那一段**，`stationIds` 却仍是完整站序。重新载入，线路断成一截。

**证据（可复现输出，见附录 A-1）**

```
编辑器里看到的走向（3 段折线）:
   seg_a [{0,0,A},{100,0,B}]
   seg_b [{100,0,B},{100,100}]
   seg_c [{100,100},{200,100,C}]
sync 后写入 line.pathPoints = [{100,100},{200,100,C}]        ← 只剩最后一段
changeset: changed = true, dirty = 1
写回磁盘后的 pathPoints = [{100,100},{200,100,C}]
写回磁盘后的 stationIds = ["A","B","C"]                      ← 与走向自相矛盾
```

**根因**
`editor/js/pipelines/pipeline-surgical.js:300` `syncSegmentsToLines()` 对同一条线路的所有 segment 逐个**直接赋值**同名 `pathPoints` 槽位，后写覆盖先写：

```js
// editor/js/pipelines/pipeline-surgical.js:339-349
var bKey = s.branchKey || 'main';
if (bKey === 'pathPoints' || bKey.startsWith('pathPoints-')) {
    line[bKey] = cleanPts;                       // ← 每段都整体覆盖
} else if (bKey === 'main') {
    if (line.hasbranch) {
        line['pathPoints-main'] = cleanPts;      // ← 分支线的主段同样被覆盖
    } else {
        line.pathPoints = cleanPts;              // ← 单线的主段被覆盖
    }
}
```

**为什么极易触发**
`editor/js/pipelines/pipeline-draw.js:485-523` 只有 `segaxis`（自由折线）会把新点**追加**到当前折线（`action:'extend_segment'`）；其余类型在 `:527-546` **每落一笔都 `project.segments.push(...)` 新建一个 segment**：

```js
// pipeline-draw.js:527 之后的注释本身就承认了这一点
// ---- 其余折角类型：按类型路由出一段，再链式继续 ----
...
project.segments.push({ id: segId, lineId: lineId, type: activeTool, points: segPts, routed: true });
```

而载入城市时每条线只生成 **1 个** segment（`pipeline-surgical.js:157-215`，`CGoPathGeometry.lineSegments` 每个 `pathPoints*` 一个）。所以：**载入时不丢，一旦用折角工具画第二笔，保存就丢**。

**影响面**
- 所有「城市维护」里延长线路 / 画新走线的操作；
- 分支线更糟：覆盖的是 `pathPoints-main`，即整条主线走向。
- `stationIds` 与 `pathPoints` 失配后，引擎按 `pathPoints` 渲染（`core/path-geometry.js` 判定链优先级 3），画面与数据都不可信。

**附带缺陷（同根因）**：`computeChangeset()` 并非纯函数——它经 `patchLinesSource → computeDirtyLines → syncSegmentsToLines`（`:543`）**就地改写 `project.lines`**。也就是说「打开改动审查弹窗 / 查看写回摘要」这个只读动作，已经把内存里的 `pathPoints` 改成最后一段了；用户此后再保存就会把这个错误结果落盘。

**修复建议**
1. 把「多个 segment 归并成一条线路的走向」抽成独立纯函数，例如
   `assembleLinePaths(segments, { includeNotOpen }) → { main: [...], branch1: [...], … }`。
   推荐直接复用已有的 `algorithms/station-order.js:273 buildPathPoints(segments, { includeNotOpen })`（它已经能把多段折线按端点 key **串成链**），再按 `branchKey` 分组调用。
2. `syncSegmentsToLines` 改为：先按 `branchKey` 分组 → 每组调用一次 `buildPathPoints` → 每组只写一次目标槽位。
3. 对**首尾相接但方向相反**的段要能反向拼接（`buildPathPoints` 已有 `reversed` 逻辑，注意沿用）。
4. 让 `computeChangeset` 变成纯函数：在快照副本上做 sync，不要改 `app.project`。

**验收断言（请补进 `selfcheck.js`）**
- 同一 line 有 3 段首尾相接的折线 → 写回后 `pathPoints` 长度 == 5 点、首点为 A、末点为 C；
- 分支线 `pathPoints-main` / `-branch1` 各自独立正确；
- 段顺序乱序输入时结果一致（顺序无关）；
- 调用 `computeChangeset()` 前后对 `project` 做深比较，必须**完全相同**（无副作用）。

---

### D-02（P0）新增线路的走向永远不写回

**症状**
在「城市维护」里「新增线路」并画出走线 → 保存 → 文件里该线路**没有 `pathPoints`**，只有 `id/name/color/stationIds/distances`。引擎退化为「按站序连直线」，精心排的 135° 折角全部丢失。

**证据（附录 A-2）**

```
新线 sync 后 pathPoints = undefined
写回后的新线条目 = {"id":"L9","name":"9号线","color":"#0284C7","stationIds":["X","Y"],"distances":[1000]}
→ 是否带走向 pathPoints: false
```

**根因**
`syncSegmentsToLines` 的保守守卫（`:315-326`）对所有线路一视同仁：

```js
if (onlyExistingPath) {
    var snapLine = /* 原始快照里的同 id 线路 */;
    if (!snapLine) return;                       // ← 新增线路：直接跳过，永不生成点阵
    var hadPath = Object.keys(snapLine).some(k => k === 'pathPoints' || /^pathPoints-/.test(k));
    if (!hadPath) return;                        // 站序驱动的线路：也不生成
}
```

守卫本意是保护「合肥这类只有 `stationIds`、没有点阵的城市不被凭空改写」（注释写得很清楚），但**把「新增线路」也误伤了**。

**修复建议**
把守卫条件改成「**原始快照里没有这条线路**（新增）→ 允许生成；原始有但无点阵（站序驱动）→ 仍跳过」。即：

```js
if (onlyExistingPath) {
    if (!snapLine) { /* 新增线路：继续走生成逻辑 */ }
    else if (!hadPath) return;
}
```

**验收断言**
- 新增一条 2 段折角的线路 → 写回条目含 `pathPoints` 且点数正确；
- 合肥式「只有 stationIds」的既有线路 → 写回后**仍然没有** `pathPoints`（不得回归）。

---

### D-03（P1）`data_notopen.js` / `data_virtual_transfers.js` 不在写回清单

**症状**
- 在检视面板点「删除此走向」（在建/规划走向）或「删除此连线」（虚拟换乘）→ 画布上消失 → 保存 → **文件没变**；重载后又回来了。
- 编辑器对这类删除**完全不提示**：`hasChanges = false`，Ctrl+S 直接告诉你「当前无改动条目需要保存」。

**证据（附录 A-3）**

```
载入的 notOpenLines: [{"name":"规划段", ...}]
changeset 覆盖的文件: data_stations.js, data_lines.js, data_scattered.js
hasChanges = false （删掉一段在建走向后，编辑器认为没有改动）
```

**根因**
`computeChangeset()`（`pipeline-surgical.js:783-822`）是**硬编码的 3 个文件**：

```js
var files = [
  { filename: 'data_stations.js',  ... changed: stationsRes.dirtyCount > 0 },
  { filename: 'data_lines.js',     ... changed: linesRes.dirtyCount > 0 },
  { filename: 'data_scattered.js', ... changed: scatteredRes.dirtyCount > 0 }
];
var hasChanges = (stationsRes.dirtyCount > 0 || linesRes.dirtyCount > 0 || scatteredRes.dirtyCount > 0);
```

而这两个文件**都被载入**（`:125` 载入 `NOT_OPEN_LINES`、`:105-122` 载入 `VIRTUAL_TRANSFERS_BUNDLE`）、**都在画布上可选可删**（`editor-app.js:1394` 虚拟连线、`:1418` 在建走向，各自带 `danger` 删除按钮），却没有任何 patch 函数。

**连带影响**
- 删车站时编辑器会清理 `project.virtualConnectors`（`editor-app.js:2112`），但文件里那条连线保留 → 重载后出现**悬空车站 ID**。引擎侧有 `if (!targetS) return` 兜底（`core/script.js:1360-1362`），**不会崩**，但数据变脏。
- 把既有线段标为 `notOpen`：该段仍会被 `syncSegmentsToLines` 写进 `data_lines.js` 的 `pathPoints`（即保持实线），而 `data_notopen.js` 不会收到它 → **「在建」状态保存后丢失**（附录 A-3 后半段已验证）。
- 39 座城市**每座都有**这两个文件（`ls city/*/data_notopen.js | wc -l` → 39；`data_virtual_transfers.js` → 39），不是边缘路径。

**修复建议**
1. 新增 `patchNotOpenSource(project)`：把 `project.notOpenLines` 与原始 `NOT_OPEN_LINES` 比对，用 `CityProjectIO.patchEntries(source, 'NOT_OPEN_LINES', {update/remove/append})` 回写；`data_notopen.js` 的变量名请以实际文件为准（**先用 `grep -n "const .* =" city/*/data_notopen.js` 确认**，避免假设）。
2. 新增 `patchVirtualTransfersSource(project)`：`project.virtualConnectors` ←→ 原始 `{ paidConns, freeConns }`，注意 `free` 布尔决定落到哪个数组。
3. 把两个文件加进 `computeChangeset` 的 `files` 列表与 `hasChanges`。
4. 「线段 `notOpen` 开关」需要明确语义：要么**禁止**在存量维护里切换（置灰并说明），要么实现「从 `pathPoints` 摘出该段 → 追加到 `NOT_OPEN_LINES`」的双向迁移。**当前状态是最危险的：看起来生效、实际不落盘。**

**验收断言**
- 删除 1 段 notOpen → `data_notopen.js` 条目数 -1，其余内容逐字节不变；
- 删除 1 条虚拟换乘连线 → `data_virtual_transfers.js` 对应数组少一项，`free` 归属正确；
- 删车站 → 两个文件里不再残留该站 ID。

---

### D-04（P1）一批「能改、能显示、但永远不落盘」的字段

**症状**
以下字段在右侧检视面板可编辑，画布立即生效，但：
- 「已修改」计数**不增加**；
- Ctrl+S 提示「当前无改动条目需要保存」；
- 即使因别的改动触发了该条目回写，这些字段也**不在 patch 里**。

| 对象 | 界面入口 | 引擎确实消费 | 脏判定包含 | patch 输出 |
|---|---|---|---|---|
| 车站 `code` | `inspector-view.js:307`（`#propNodeCode`） | ✅ `core/script.js:1222`（编号胶囊） | ❌ | ❌ |
| 车站 `amenities` | `inspector-view.js:349`（`.amenity-chip-btn`） | ✅ `core/script.js:1223`（设施徽标） | ❌ | ❌ |
| 车站 `siblings` | `inspector-view.js:400-420`（同址异站编辑） | ✅ `core/script.js:479, 1233`、`core/station-board.js:621` | ❌ | ❌ |
| 线路 `strokeWidth` | `inspector-view.js:1082`（`#propLineStrokeWidth`） | ✅ 引擎按 `line.strokeWidth` 描边 | ❌ | ❌ |
| 线路 `strokeDasharray` | `inspector-view.js:1118`（`#propLineDash`） | ✅ | ❌ | ❌ |
| 线路 `strokeLinecap` | `inspector-view.js:1100`（`#propLineCap`） | ✅ | ❌ | ❌ |
| 线路 `strokeLinejoin` | `inspector-view.js:1109`（`#propLineJoin`） | ✅ | ❌ | ❌ |

> 反证：`amenities` 在 `city/` 里目前只有 `city/suzhou/openmap_project.json`（编辑器工程文件）用到，尚未有城市写进 `data_stations.js`；`siblings` 只有 `city/pyongyang/data_stations.js` 在用。也就是说 **D-04 里 `siblings` 已有真实数据踩中**，`code`/`amenities` 是「引擎已支持但城市还没用」的接口。

**根因（两处白名单）**

```js
// pipeline-surgical.js:441 —— 车站脏判定
var changed = (curr.x !== orig.x || curr.y !== orig.y ||
    curr.cn !== orig.cn || curr.en !== orig.en ||
    curr.align !== orig.align || curr.type !== orig.type ||
    offsetChanged || hideLabelChanged || textScaleChanged ||
    markerChanged || haloChanged);              // ← 没有 code / amenities / siblings / lab

// pipeline-surgical.js:560-567 —— 线路脏判定
if (String(curr.color || '').toLowerCase() !== String(orig.color || '').toLowerCase() ||
    curr.name !== orig.name ||
    String(curr.company || '') !== String(orig.company || '') ||
    !!curr.useStrictRounding !== !!orig.useStrictRounding ||
    !!curr.isLoop !== !!orig.isLoop) { changed = true; }   // ← 没有描边四件套
```

且 patch 组装（`:443-490` 车站、`:619-640` 线路）同样是手写字段清单。

**修复建议**
1. 把「参与脏判定的字段」提取为常量白名单（例如 `STATION_COMPARE_FIELDS = ['x','y','cn','en','align','type','offset','hideLabel','textScale','marker','halo','code','amenities','siblings','lab']`），脏判定与 patch 组装**共用同一份**，避免两处不同步。
2. 更稳妥的做法：对每个条目做一次 `JSON.stringify` 的**深比较**来决定 changed，再用「只写非默认字段」的稀疏 patch 生成输出（现有 `computeDirtyStations` 的稀疏策略必须保留，否则会把编辑器内部字段污染进源文件）。
3. 对线路，注意 `color` 的大小写无关比较（已有）与 `strokeWidth` 等**可选字段的删除语义**（清空 = 从源码删字段，与现有 `hideLabel: null` 的约定一致）。

**验收断言**
- 改 `code` → `data_stations.js` 该条目出现 `code`，其余字节不变；
- 改线宽 → `data_lines.js` 该条目出现 `strokeWidth`；
- 清空 `strokeDasharray` → 该字段从源码条目中**删除**（不是写成空串）；
- 上述每种改动都会让 `dirtyCount` +1。

---

### D-05（P1）DeepSeek 配置面板：4 个按钮双绑定 + 一个 id 拼错

**症状**
1. 填了自定义 Base URL（中转/代理），点「保存配置」后**被静默重置为 `https://api.deepseek.com`**。
2. 点「测试连接」会**发两次请求**，两路结果都写进同一个 `#deepseekStatusText`，互相覆盖（可能显示"成功"但用的是另一个 base）。
3. 打开「模型设置」时 Base URL 不会回填已保存的自定义值。

**证据**

同一元素被两个文件绑定了 `click`：

```
btnDeepseekConfig / click ← editor/js/editor-app.js + editor/js/tools/deepseek-vision.js
btnDeepseekSave   / click ← 同上
btnDeepseekTest   / click ← 同上
btnDeepseekClear  / click ← 同上
```

`editor-app.js` 那一份读的是不存在的 id：

```js
// editor/js/editor-app.js:3575（预填）、:5566（保存）、:5584（测试）
var baseInput = document.getElementById('deepseekApiBase');    // ← 真实 id 是 deepseekBaseUrl
var base = (document.getElementById('deepseekApiBase') || {}).value || '';   // → ''
...
window.DeepSeekVision.setApiBase(base);                        // setApiBase('') → 回落 DEFAULT_API_BASE
```

而 HTML 里的真实 id 是 `deepseekBaseUrl`（`editor/index.html` 的模型设置弹窗内，`#deepseekBaseUrl`）；模块侧用的是带兼容回退的正确写法：

```js
// editor/js/tools/deepseek-vision.js:603-610
function getModalElements() {
    return {
        modal: document.getElementById('modalDeepseekSettings') || document.getElementById('deepseek-api-modal'),
        keyInput: document.getElementById('deepseekApiKey') || document.getElementById('deepseek-input-key'),
        baseInput: document.getElementById('deepseekBaseUrl') || document.getElementById('deepseek-input-base'),  // ← 正确
        modelInput: document.getElementById('deepseekModel') || document.getElementById('deepseek-input-model'),
        statusMsg: document.getElementById('deepseekStatusText') || document.getElementById('deepseek-test-status')
    };
}
```

**触发顺序**（为什么模块的正确值必被覆盖）：`deepseek-vision.js` 先于 `editor-app.js` 被 `<script>` 加载，其 `DOMContentLoaded` 监听（`:772`）先注册 → 先执行（写入正确 base）→ 随后 `editor-app.js` 的 `init()` 里绑定的那份执行（写入 `''` → 重置为默认）。所以**不是竞态，是必现**。

**修复建议**
删掉 `editor-app.js` 里这 4 个重复 handler（模块那份功能完整，含 `openSettingsModal / saveSettings / testConnection / clearSettings`），并统一 id 命名。顺手把 `deepseekApiBase` 这类历史拼写在仓库里 grep 一遍。

**验收**
- 只存在一个 `#btnDeepseekSave` 处理器；
- 保存自定义 base → 刷新页面 → 输入框回填自定义值；
- 「测试连接」只发起一次网络请求。

---

### D-06（P2）「编辑线路」按钮完全无效，且污染撤销栈

**症状**
选中一条线段 → 右侧检视面板「所属线路」旁的**「编辑线路」按钮**点了没有任何反应（预期是切到该线路的属性面板）；但「已修改」计数会 +1、撤销栈多出一步空操作。

**证据**
按钮只存在于 `inspector-view.js`，全仓只有一处派发、**零处处理**：

```js
// editor/js/ui/inspector-view.js:697  按钮定义，title="打开所属线路的属性面板"
// editor/js/ui/inspector-view.js:853-857
var editSegLineBtn = document.getElementById('btnEditSegLine');
if (editSegLineBtn) {
    editSegLineBtn.addEventListener('click', function () {
        fireChange('segment', segment.id, 'open_line', segment.lineId);
    });
}
```

`handlePropertyChange` 的 segment 分支（`editor-app.js:2213-2250`）只处理
`delete / lineId / type / notOpen / flipCorner / point_radius / all_radius / point_position / delete_point`，**没有 `open_line`**。
而撤销快照在 dispatch **之前**就已压入（`editor-app.js:2082`），所以是「白压一步 + 计数 +1 + 什么都不发生」。

**修复建议**
在 `handlePropertyChange` 里加一个**跳过快照**的提前返回分支（参照同文件 `line` 的 `prop === 'focus'` 处理，`:2015-2034`）：

```js
if (targetType === 'segment' && prop === 'open_line') {
    app.selected = { type: 'line', id: value };
    app.activeLineId = value;
    renderAll();
    return;          // 注意：必须在 pushSnapshot 之前
}
```

或者干脆删掉这个按钮（`#propSegLine` 下拉已能改所属线路）并清掉 `open_line` 派发。

**验收**
- 点击后检视面板切换到线路属性，且 `dirtyCounter` 不变、`canUndo` 状态不变。

---

### D-07（P2）走线路由偶发返回「终点 ≠ 输入终点」

**症状**
新画的线段端点与车站圆心错开最多约 0.5px。6× 放大（编辑器最大 6.0）下约 3px，肉眼可见接缝。

**证据（54,000 组随机用例）**

```
用例 54000：起点不精确 0，终点不精确 26（0.05%）
  seg135 1:1 end 偏移 0.200px  b=(108.8,191.2) 末尾=(108.8,191)
  seg90d 1:1 end 偏移 0.495px  b=(23,167.1) 末尾=(22.65,166.75)
```

**根因**

```js
// editor/js/algorithms/segment-router.js:22-31
function dedupePoints(points) {
    var out = [];
    (points || []).forEach(function (p) {
        var last = out[out.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.5) {
            out.push({ x: round2(p.x), y: round2(p.y) });
        }                                      // ← 末点若离前一折点 ≤0.5，被整点丢弃且不补回
    });
    return out.length ? out : [{ x: round2(points[0].x), y: round2(points[0].y) }];
}
```

在 `seg135`/`seg90d` 中，当「中间折点」与终点距离 ≤0.5px（例如 `dy` 只比 `dx` 大 0.2px）时，终点被丢弃。

**影响路径**
- `handlePropertyChange('segment','type')` 与 `flipSegmentCorner` 会**重新钉端点**（`editor-app.js:2224-2226`），所以改类型/翻折角不受影响；
- `pipeline-draw.js:528-533` 落笔时**只给 `nid`、不钉坐标** → 新线段端点与站心错开；
- 之后只要拖动一次车站，`syncSegmentsForNodes` 会把点吸回站心，产生 0.5px 的「跳动」。
- 写回 `pathPoints` 后，引擎渲染该线与站点圆环之间会出现亚像素缝隙。

**修复建议**
`dedupePoints` 增加「保末点」语义：若末点与前一折点过近，用末点**替换**前一折点而不是丢弃它。（`dedupePointsKeepNid` 已实现类似意图，可对齐写法。）

**验收断言**
- 对 `routeBetweenByType` 做属性测试：任意 a/b/type/slope，返回值首尾必须**精确等于**输入（容差 1e-9），且各段方向合法（轴段 / 45° / 项目斜率）；
- 随机 1 万组不得出现零长段。

---

### D-08（P2）`AgentAPI.renderSvgString()` 必抛

```js
// editor/js/tools/agent-api.js:134-140
var cleanSvg = window.OpenMapEditor.BundleExporter.prepareCleanSvgClone(svgEl, app.project);
return new XMLSerializer().serializeToString(cleanSvg);      // ← cleanSvg 是 { clone, width, height }
```

`prepareCleanSvgClone` 的返回值（`editor/js/tools/bundle-exporter.js:467`）是 `{ clone: clone, width: w, height: h }`，`XMLSerializer.serializeToString` 只接受 `Node` → 必抛 `TypeError`。

**修复**：`serializeToString(cleanSvg.clone)`。
**验收**：`AgentAPI.renderSvgString()` 返回以 `<svg` 开头的字符串。目前无内部调用方（对外 Agent 接口），优先级低。

---

### D-09（P2）「45/90 对齐」忽略 `project.slope`

**症状**
香港（2:1 / 26.6°）、沈阳（3:2 / 33.7°）这类非 45° 体系的工程，点「45/90 对齐」（Ribbon → 开始 → 历史与重算）会把所有走线压成 45° 的整数倍，破坏城市本来的斜率规范。

**证据**
- `editor/js/editor-app.js:3230-3244` `alignAllTo45()` 只传 `{ grid: gridStep }`，**没有 slope**：
  ```js
  var plan = A45.alignProject(app.project, { grid: gridStep });
  ```
- `editor/js/algorithms/align-45.js:149` 的 `alignProject(project, opts)` 内部只用 45° 的 `STEP = Math.PI / 4`，全文**不读取 `project.slope`**（grep 确认：`align-45.js` 无 `slope` 字样）。
- 对照：`segment-router.js` 与 `layers/viewport.js:244 snapPointToRays` 都支持 `{m,n}` 斜率；新建画布弹窗（`index.html` → `#newCanvasSlope`）允许 1:1 / 2:1 / 3:2 / 1:2。

**修复建议**
给 `alignProject` 增加 `opts.slope = {m,n}`，把候选射线从 8 个（0/45/90/135）扩展为「轴 + 斜率 m:n 的四个方向」，并在 `alignAllTo45` 传入 `app.project.slope`。UI 文案也应随城市斜率变化（别写死「45°/90°」）。
**注意**：这是有确认框的显式操作，不是自动触发，所以是「语义陷阱」而非静默破坏。

---

### D-10（P3）编辑器无触控手势

```js
// editor/js/layers/viewport.js:36-37
var activePointers = new Map();     // ← 声明后全文再无引用
var lastPinchDist = 0;              // ← 同上
```

全仓 `editor/js/**` 中**没有** `touchstart / touchmove / pointerdown` 监听；只有 `wheel`（含 `ctrlKey + wheel` 触控板捏合，`:326-368`）。结论：平板/触屏上不能双指缩放、不能拖动画布（单指可能靠兼容 mouse 事件勉强拖，但捏合一定没有）。看起来是一段未完成的实现残留。

**修复建议**：用 Pointer Events 统一实现（`pointerdown/move/up` + `setPointerCapture`），填上这两个变量的用途或直接删除以免误导。

---

### D-11（P3）PDF.js 走 CDN，而编辑器不进离线缓存

```html
<!-- editor/index.html（约 :1064-1069，注意该文件正被并行改动，行号需重新定位） -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/.../pdf.worker.min.js';</script>
```

`editor/js/tools/pdf-vector-extractor.js:43-67` 的 `ensurePdfJsLoaded()` **又**动态加载同一份（含 `cMapUrl` 指向 cdnjs）。

- 该函数有 `script.onerror` → 抛「无法加载 PDF.js，请检查网络」，所以**断网不会崩，只是功能不可用**。
- `sw.js:918` 明确 `if (reqUrl.pathname.includes('/editor/')) return;` —— 编辑器**不参与**离线预缓存。
- 结论：这是「破坏纯静态自给自足」的合规问题，不是运行时故障。若要彻底解决，需要把 pdf.js vendor 到本地（并在 `sw.js` 登记 + 升版本号），或在文档里声明「PDF 识别需联网」。

---

### D-12（P3）UI 层出现 Emoji（违反铁律五）

`editor/js/tools/deepseek-vision.js` 把 Emoji 写进用户可见的状态区：

| 行 | 内容 |
|---|---|
| `:655` | `⚠️ 请先输入 DeepSeek API Key (以 sk- 开头)` |
| `:661` | `⏳ …`（识别中状态） |
| `:686` | `✅ 连接成功！…` |
| `:701` | `❌ 连接失败 [HTTP …]` |
| `:709` | `❌ 网络连接异常: …` |

`editor/js/editor-app.js:3964/3969/3973` 的导出校验摘要用了 `⚠ / ✔`；`:5571` 附近还有 `✔ / ✘` 的连接测试文案。
另有大量 Emoji 只在 `logger.info(...)` 控制台日志里（如 `pdf-vector-extractor.js:54`、`knowledge-matcher.js:244`），严格说也在铁律五的射程内，但用户不可见，优先级最低。

**修复**：UI 文案改用 `<cgo-icon name="warning|check-circle|time|close">`，纯文本状态不要带符号。

---

### D-13（P3）`AGENTS.md` 第 5 章与代码脱节

| 文档说法 | 实际 | 位置 |
|---|---|---|
| 221 项断言 / 15 座城市 | **920 项 / 39 座** | `AGENTS.md:124`、`:470` |
| 撤销栈 60 步 | **120 步 / 8MB 双阈值**（该文件正被并行扩写为事务化撤销，但 `MAX_STEPS = 120` 未变） | `editor/js/core/history-manager.js`（`MAX_STEPS` 常量，行号随并行改动漂移，grep 定位） |
| 只描述了 `core/` + `algorithms/` + 3 条流水线 | 另有 `layers/`(10)、`tools/`(9)、`ui/`(6)、`core/`(6) 共 30+ 模块从未提及（`city-render-runtime`、`station-style-catalog`、`startup-policy`、`nav-tree-view`、`asset-drawer`、`agent-api`、`parallel-corridor`、`station-order`、`smart-guides`、`polygon-boolean`、`transform-engine`、`align-45`…） | `AGENTS.md` §5 |
| 「编辑器与引擎同源」只提了 `path-geometry` / `station-icons` | 还有 `city-render-runtime` 的 Proxy 沙箱、`station-style-catalog` 的外观字段快照机制 | — |

**建议**：修 D-01~D-04 时顺手把第 5 章按实际重写（版本号同步规则不适用于 `editor/` 的 JS/CSS，因为 `sw.js` 跳过该目录——但 `editor/index.html` **要**参与版本校验，`scripts/check-site-version.mjs` 里有登记）。

---

## 4. 已核实「正常」的项（不要重复怀疑）

| 项 | 结论 | 依据 |
|---|---|---|
| ZIP 生成器（`bundle-exporter.js` 手写 method=0 + CRC32） | **正确**：Python `zipfile.testzip()` 返回 `None`；中文路径 UTF-8 正确；空文件与二进制内容逐字节一致 | 实测（本文附录 A-5） |
| 条目级无损回写（`CityProjectIO.patchEntries`） | **可靠**：39 座城市全量跑「改 / 删 / 加 / 组合」，未改动条目零变化、diff ≤1 行 | `selfcheck.js` 既有覆盖 + 本次复核 |
| 分支线路访问器（`lineStationGroups / linePathGroups / lineAllStationIds`） | 正确，且 selfcheck 覆盖 | 同上 |
| 车站图元与 `css/style.css` 尺寸一致性 | 有断言守着（`STATION_SIZE` 逐值比对） | `selfcheck.js`「车站图元」小节 |
| 撤销栈去重 | `pushSnapshot` 会丢弃与栈顶相同的快照 | `history-manager.js:69-89` |
| 写回目录安全 | `resolveCityDir` 只接受确认过的城市目录，认不出就报错 | `pipeline-surgical.js:883-920` |
| `InvalidStateError` 重试 | 重新校验目录后重试一次，不跳过安全校验 | `pipeline-surgical.js:1000-1030` |
| 引擎对悬空虚拟换乘 ID 的容错 | `selectStation` 内部 `activate()` 有 `if (!targetS) return` | `core/script.js:1359-1361` |
| 编辑器命名空间完整性 | 88 个 `OpenMapEditor.*` 成员：引用处**无未定义成员** | 脚本交叉核对 |

---

## 5. 附录 A —— 复现脚本（可直接运行）

> 所有脚本都假设：`global.window` 垫片 + 用 `new Function` 求值浏览器端脚本。**不需要浏览器、不修改仓库**。把 `<ROOT>` 改成你的仓库绝对路径（或保留 `process.cwd()` 推导）。

通用前置（每个脚本头部都重复了，方便单独复制）：

```js
const fs = require('fs');
const path = require('path');
const root = '/Users/liuzihan/Documents/GitHub/CGo-OpenMap';   // ← 改成你的仓库路径
global.window = global.window || {};
for (const f of ['editor/js/core/city-project-io.js', 'editor/js/core/project-model.js']) {
  new Function(fs.readFileSync(path.join(root, f), 'utf8'))();
}
const Surgical = require(path.join(root, 'editor/js/pipelines/pipeline-surgical.js'));
```

`Surgical.init(cityId, sources, data)` 返回 `{ city, project }`；`sources` 是「文件名 → 源码文本」，`data` 是「全局变量名 → 已求值的对象」（键：`stationsData`/`linesData`/`NOT_OPEN_LINES`/`VIRTUAL_TRANSFERS_BUNDLE`/`SCATTERED_DATA`/`LEGEND_CONFIG`）。这是自检脚本用的同一个注入通道。

### A-1 复现 D-01（多段折线被覆盖）

```js
const fs = require('fs'), path = require('path');
const root = '/Users/liuzihan/Documents/GitHub/CGo-OpenMap';
global.window = global.window || {};
for (const f of ['editor/js/core/city-project-io.js', 'editor/js/core/project-model.js'])
  new Function(fs.readFileSync(path.join(root, f), 'utf8'))();
const Surgical = require(path.join(root, 'editor/js/pipelines/pipeline-surgical.js'));

const sources = {
  'data_stations.js': `const stationsData = {
  "A": { type: "dot", x: 0, y: 0, cn: "甲", en: "A", align: "top" },
  "B": { type: "dot", x: 100, y: 0, cn: "乙", en: "B", align: "top" },
  "C": { type: "dot", x: 200, y: 0, cn: "丙", en: "C", align: "top" }
};
`,
  'data_lines.js': `const linesData = [ { id: "L1", name: "1号线", color: "#E4002B", stationIds: ["A","B","C"], distances: [1000,1000], pathPoints: [{x:0,y:0,nid:"A"},{x:200,y:0,nid:"C"}] } ];
`,
  'data_notopen.js': 'const NOT_OPEN_LINES = [];\n',
  'data_virtual_transfers.js': 'const VIRTUAL_TRANSFERS_BUNDLE = { paidConns: [], freeConns: [] };\n',
  'data_scattered.js': 'const SCATTERED_DATA = [];\n',
  'data_legend.js': 'const LEGEND_CONFIG = [];\n'
};
const data = {
  stationsData: new Function(sources['data_stations.js'] + ';return stationsData;')(),
  linesData: new Function(sources['data_lines.js'] + ';return linesData;')(),
  NOT_OPEN_LINES: [], VIRTUAL_TRANSFERS_BUNDLE: { paidConns: [], freeConns: [] },
  SCATTERED_DATA: [], LEGEND_CONFIG: []
};
const project = Surgical.init('demo', sources, data).project;

// 模拟用户用「135° 折角」连续画三段（pipeline-draw 每次落笔新建一个 segment）
project.segments = [
  { id: 'seg_a', lineId: 'L1', type: 'seg135', routed: true, points: [{ x: 0,   y: 0,   nid: 'A' }, { x: 100, y: 0,   nid: 'B' }] },
  { id: 'seg_b', lineId: 'L1', type: 'seg135', routed: true, points: [{ x: 100, y: 0,   nid: 'B' }, { x: 100, y: 100 }] },
  { id: 'seg_c', lineId: 'L1', type: 'seg135', routed: true, points: [{ x: 100, y: 100 },        { x: 200, y: 100, nid: 'C' }] }
];
project.nodes.C.x = 200; project.nodes.C.y = 100;

Surgical.syncSegmentsToLines(project, { onlyExistingPath: true });
console.log('sync 后 line.pathPoints =', JSON.stringify(project.lines[0].pathPoints));   // 只剩 seg_c

const cs = Surgical.computeChangeset(project);
const f = cs.files.find(x => x.filename === 'data_lines.js');
const out = new Function(f.patchedSource + ';return linesData;')();
console.log('写回后的 pathPoints =', JSON.stringify(out[0].pathPoints));
console.log('写回后的 stationIds =', JSON.stringify(out[0].stationIds));
```

**预期（当前有缺陷）**：`pathPoints` 只有 `[{100,100},{200,100,C}]`，`stationIds` 仍为 `["A","B","C"]`。
**修复后的期望**：`pathPoints` 为 5 点（A → 折 → 折 → 折 → C）。

### A-2 复现 D-02（新线不写 pathPoints）

```js
// 前置同上
const project = Surgical.init('demo', sources, data).project;

// 「新增线路」对话框造出的新线：没有 pathPoints
project.lines.push({ id: 'L9', name: '9号线', color: '#0284C7', stationIds: ['X', 'Y'], distances: [1000] });
project.nodes.X = { id: 'X', x: 300, y: 0,   cn: '新甲', en: 'X', type: 'dot', align: 'top' };
project.nodes.Y = { id: 'Y', x: 300, y: 100, cn: '新乙', en: 'Y', type: 'dot', align: 'top' };
project.segments.push({ id: 'n1', lineId: 'L9', type: 'seg90', routed: true,
  points: [{ x: 300, y: 0, nid: 'X' }, { x: 300, y: 100, nid: 'Y' }] });

Surgical.syncSegmentsToLines(project, { onlyExistingPath: true });
console.log('新线 pathPoints =', JSON.stringify(project.lines[1].pathPoints));   // undefined

const cs = Surgical.computeChangeset(project);
const out = new Function(cs.files.find(x => x.filename === 'data_lines.js').patchedSource + ';return linesData;')();
console.log('写回后的新线 =', JSON.stringify(out.find(l => l.id === 'L9')));
console.log('是否带 pathPoints:', Object.prototype.hasOwnProperty.call(out.find(l => l.id === 'L9'), 'pathPoints'));
```

### A-3 复现 D-03（notopen / virtual 不写回）

```js
// 前置同上，data 里给 NOT_OPEN_LINES 一条：
// 'data_notopen.js': 'const NOT_OPEN_LINES = [ { name: "规划段", points: [{x:100,y:0},{x:100,y:100}], style: { width: 3.4 } } ];\n'
const project = Surgical.init('demo', sources, data).project;

project.notOpenLines.splice(0, 1);               // 用户点「删除此走向」
const cs1 = Surgical.computeChangeset(project);
console.log('覆盖文件:', cs1.files.map(f => f.filename).join(', '));
console.log('hasChanges =', cs1.hasChanges);      // false ← 删除没有被察觉

project.segments[0].notOpen = true;               // 用户把既有线段标为在建
Surgical.syncSegmentsToLines(project, { onlyExistingPath: true });
const cs2 = Surgical.computeChangeset(project);
const lines = new Function(cs2.files.find(f => f.filename === 'data_lines.js').patchedSource + ';return linesData;')();
console.log('在建段仍留在 data_lines.pathPoints =', JSON.stringify(lines[0].pathPoints));
```

### A-4 复现 D-07（路由终点偏移）

```js
const Router = require('/Users/liuzihan/Documents/GitHub/CGo-OpenMap/editor/js/algorithms/segment-router.js');
let bad = 0, total = 0;
for (const type of ['seg135', 'seg90', 'seg90d', 'segratio'])
  for (const slope of [{ m: 1, n: 1 }, { m: 2, n: 1 }, { m: 3, n: 2 }])
    for (let i = 0; i < 5000; i++) {
      const a = { x: Math.round((Math.random() * 800 - 400) * 10) / 10, y: Math.round((Math.random() * 800 - 400) * 10) / 10 };
      const b = { x: Math.round((Math.random() * 800 - 400) * 10) / 10, y: Math.round((Math.random() * 800 - 400) * 10) / 10 };
      if (Math.hypot(a.x - b.x, a.y - b.y) < 1) continue;
      total++;
      const pts = Router.routeBetweenByType(a, b, type, i % 2 === 0, slope);
      const last = pts[pts.length - 1];
      if (Math.abs(last.x - b.x) > 1e-9 || Math.abs(last.y - b.y) > 1e-9) {
        bad++;
        if (bad <= 3) console.log(`${type} ${slope.m}:${slope.n} 偏移 ${Math.hypot(last.x - b.x, last.y - b.y).toFixed(3)}px`,
          JSON.stringify({ a, b, pts }));
      }
    }
console.log(`终点不精确 ${bad}/${total}`);
```

### A-5 验证 ZIP 生成器（供对照，证明它是好的）

```js
// 步骤 1：Node 侧生成
const fs = require('fs'), path = require('path');
const root = '/Users/liuzihan/Documents/GitHub/CGo-OpenMap';
global.window = global.window || {};
new Function(fs.readFileSync(path.join(root, 'editor/js/core/city-project-io.js'), 'utf8'))();
new Function(fs.readFileSync(path.join(root, 'editor/js/tools/bundle-exporter.js'), 'utf8'))();
const Exp = global.window.OpenMapEditor.BundleExporter;   // 注意：bundle-exporter 挂在 window 上，不是 global 上
const entries = [
  { name: 'data_stations.js', text: 'const stationsData = { "M101": { x: 1, y: 2, cn: "人民广场" } };\n' },
  { name: 'city/中文目录/data_lines.js', text: 'const linesData = [{ id: "M1", color: "#E4002B" }];\n' },
  { name: 'empty.txt', text: '' },
  { name: 'bin.dat', text: '\u0000\u0001\u0002 bin \u00ff' }
];
fs.writeFileSync('/tmp/openmap-test.zip', Buffer.from(Exp.buildZipBytes(entries)));

// 步骤 2：用 Python 校验（CRC / 中文名 / 空文件 / 二进制）
// python3 -c "import zipfile;z=zipfile.ZipFile('/tmp/openmap-test.zip');print(z.testzip());print([(i.filename,i.file_size) for i in z.infolist()])"
// 预期：testzip() 返回 None，文件名与内容逐一正确
```

---

## 6. 附录 B —— 关键文件与行号索引

### 6.1 写回链路（改这里风险最高）

| 位置 | 作用 |
|---|---|
| `editor/js/pipelines/pipeline-surgical.js:300` | `syncSegmentsToLines()` —— **D-01 / D-02 根因** |
| `editor/js/pipelines/pipeline-surgical.js:315-326` | `onlyExistingPath` 守卫 —— D-02 根因 |
| `editor/js/pipelines/pipeline-surgical.js:339-349` | 逐个 segment 覆盖 `pathPoints` —— D-01 根因 |
| `editor/js/pipelines/pipeline-surgical.js:396` | `computeDirtyStations()`，字段白名单在 `:441` —— D-04 根因 |
| `editor/js/pipelines/pipeline-surgical.js:505` | `patchStationsSource()` |
| `editor/js/pipelines/pipeline-surgical.js:541` | `computeDirtyLines()`，字段白名单在 `:560`，patch 在 `:619+` —— D-04 根因 |
| `editor/js/pipelines/pipeline-surgical.js:662` | `patchLinesSource()` |
| `editor/js/pipelines/pipeline-surgical.js:719/733` | `collectWaterScattered()` / `patchScatteredSource()` |
| `editor/js/pipelines/pipeline-surgical.js:783` | `computeChangeset()`，文件清单在 `:789-808` —— **D-03 根因** |
| `editor/js/pipelines/pipeline-surgical.js:883` | `resolveCityDir()`（目录安全，**不要放宽**） |
| `editor/js/pipelines/pipeline-surgical.js:977` | `saveDirectToLocal()`（写盘与重试） |
| `editor/js/core/city-project-io.js:631` | `patchEntries()`（叶子级无损回写，**唯一允许的写回原语**） |
| `editor/js/core/city-project-io.js:530` | `formatEntryValue()`（按源码风格序列化） |

### 6.2 绘制与几何

| 位置 | 作用 |
|---|---|
| `editor/js/pipelines/pipeline-draw.js:485-523` | `segaxis` 追加到现有折线（唯一会复用 segment 的路径） |
| `editor/js/pipelines/pipeline-draw.js:527-546` | **其余类型每次新建 segment** —— D-01 的触发条件 |
| `editor/js/algorithms/segment-router.js:22-31` | `dedupePoints()` —— D-07 根因 |
| `editor/js/algorithms/segment-router.js:236` | `routeBetweenByType()` |
| `editor/js/algorithms/station-order.js:273` | `buildPathPoints()`（**修 D-01 建议复用它**） |
| `editor/js/algorithms/align-45.js:149` | `alignProject()` —— D-09 根因（无 slope） |
| `core/path-geometry.js` | 倒角与走向判定的唯一真源（**严禁复刻**） |
| `core/station-icons.js` | 车站图元与尺寸的唯一真源（**严禁复刻**） |

### 6.3 UI 与交互

| 位置 | 作用 |
|---|---|
| `editor/js/editor-app.js:415` | `renderAll()` 图层渲染顺序 |
| `editor/js/editor-app.js:2009` | `handlePropertyChange()`（属性编辑总入口） |
| `editor/js/editor-app.js:2082` | 撤销快照压入点（**在 dispatch 之前** → D-06 的副作用来源） |
| `editor/js/editor-app.js:2213-2250` | segment 分支（缺 `open_line`） |
| `editor/js/editor-app.js:2749` | `init()` 初始化顺序 |
| `editor/js/editor-app.js:3230` | `alignAllTo45()`（未传 slope） |
| `editor/js/editor-app.js:4082` | `handleSmartSave()`（Ctrl+S 的三条分支） |
| `editor/js/editor-app.js:4218` | `bindCanvasInteractions()`（拖拽/框选/变换） |
| `editor/js/editor-app.js:5354` | 全局键盘快捷键 |
| `editor/js/editor-app.js:6316` | `populateCitySelect()`（在线/本地城市库） |
| `editor/js/ui/inspector-view.js:283` | `renderNodeInspector()` |
| `editor/js/ui/inspector-view.js:673` | `renderSegmentInspector()`（`#btnEditSegLine` 在 `:697`、绑定在 `:853`） |
| `editor/js/ui/inspector-view.js:1033` | `renderLineInspector()`（描边四件套在 `:1082-1118`） |
| `editor/js/layers/viewport.js:244` | `snapPointToRays()`（唯一支持 slope 的吸附） |
| `editor/js/layers/viewport.js:288` | `setNavMode()`（地图 / 设计软件双模式） |

### 6.4 工具链

| 位置 | 作用 |
|---|---|
| `editor/js/tools/bundle-exporter.js:129` | `buildZipBytes()`（手写 ZIP，已核实正确） |
| `editor/js/tools/bundle-exporter.js:467` | `prepareCleanSvgClone()` 返回 `{clone,width,height}` —— D-08 根因 |
| `editor/js/tools/agent-api.js:134` | `renderSvgString()` —— D-08 |
| `editor/js/tools/deepseek-vision.js:603` | `getModalElements()`（正确的 id 回退写法） |
| `editor/js/tools/deepseek-vision.js:758-772` | 弹窗按钮绑定（与 `editor-app.js` 重复 → D-05） |
| `editor/js/tools/pdf-vector-extractor.js:43` | `ensurePdfJsLoaded()`（CDN → D-11） |
| `editor/js/tools/knowledge-matcher.js:231` | `loadCityStationsOnline()`（维基 MediaWiki API） |
| `editor/js/core/history-manager.js:69` | `pushSnapshot()`（120 步 / 8MB，带去重） |
| `editor/js/core/startup-policy.js` | `?city=` 与恢复会话的优先级判定 |
| `editor/js/core/city-render-runtime.js:85` | Proxy 沙箱（借用城市渲染钩子） |

### 6.5 测试与脚本

| 位置 | 作用 |
|---|---|
| `editor/tests/selfcheck.js` | 920 断言 / 39 城（**改动后必须全绿**） |
| `editor/tests/selfcheck.js:68` | 「源码扫描器精度」小节（可参照它写新的回写断言） |
| `editor/tests/selfcheck.js:1139` | 「Milestone 4 全要素外科手术回写」小节（D-01~D-04 的断言建议插在这里） |
| `scripts/check-site-version.mjs` | 6 页面 + `sw.js` 版本串一致性 |
| `scripts/rescale-city.js` | 城市整体等比缩放（改坐标时用，别手改） |

---

## 7. 建议的修复顺序与「不要碰」清单

### 7.1 顺序

1. **D-01 + D-02 + D-03 一起修**（同一根因，改 `syncSegmentsToLines` + `computeChangeset` + 新增两个 patch 函数），并**先补断言再改实现**（当前这块零覆盖，很容易修出回归）。
2. **D-04**：把脏判定与 patch 的白名单收敛成一处常量（避免下次又漏字段）。
3. **D-05 / D-06 / D-08**：三处小而确定的修复，可一次性提交。
4. **D-07**：改 `dedupePoints` 保末点，配属性测试。
5. **D-09**：给 `alignProject` 加 slope（涉及 UI 文案）。
6. **D-10 / D-11 / D-12 / D-13**：排期做，其中 D-11 与 D-13 建议合并到一次「文档 + 依赖」提交。

### 7.2 「不要碰」清单（违反会引入更难查的问题）

- 不要用「解析成对象 → 整体 `JSON.stringify`」写回城市文件（会静默丢弃城市私有字段）。**只能**用 `CityProjectIO.patchEntries()`。
- 不要在编辑器里复刻第二份倒角算法或车站图元模板（`core/path-geometry.js` / `core/station-icons.js` 是唯一真源，`selfcheck.js` 有断言）。
- 不要假定线路一定有 `stationIds` 或 `pathPoints`：北京 S2/S6/JX、上海 SH5/SH10/SH11、悉尼 T1/T2/T4/T8 是分支线；合肥全网**只有 `stationIds`、没有 `distances`**。一律走 `lineStationGroups / linePathGroups / lineAllStationIds`。
- 不要把 `distances` 当等长数字数组：允许空数组（在建）或 `"约21千"` 这类人工标注文本。
- 不要放宽 `resolveCityDir()` 的目录校验（写错城市目录是不可接受的后果）。
- 不要在 `editor/` 之外的 JS/CSS 上引用 `?v=` 版本号（编辑器不进 SW 缓存）；但 `editor/index.html` **必须**参与 `check-site-version.mjs` 的校验。
- 未经用户明确指示**不要提交**。

### 7.3 建议先跑一遍的验证命令

```bash
export PATH="/Users/liuzihan/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin:$PATH"
cd /path/to/CGo-OpenMap

node editor/tests/selfcheck.js          # 基线：920 断言全绿
node scripts/check-site-version.mjs     # 基线：版本串一致

git status                              # 先确认没有别人的未提交改动
git log --oneline -3                    # 确认基线 commit
```

---

## 8. 本次审计的边界（未覆盖的部分，留给下一个人）

**已做**：

- 全部 45 个 JS 文件的静态阅读与交叉核对：
  - 250 处 `getElementById` vs 305 个已定义 id（发现 9 处悬空，其中 `deepseekApiBase` 是 D-05 的根因，其余是旧面板遗留的死代码）；
  - 56 组 UI 派发 prop vs `handlePropertyChange` 的处理分支（发现 `segment/open_line` 无人处理 → D-06）；
  - 88 个 `OpenMapEditor.*` 成员的定义 vs 引用（无未定义成员）；
  - 同一元素被多文件绑定事件（发现 DeepSeek 4 个按钮 → D-05）；
  - 路由函数 54,000 组随机属性测试（→ D-07）；
  - `pipeline-surgical` 的写回链路端到端实验（→ D-01/02/03）；
  - ZIP 产物用 Python `zipfile` 独立校验（→ 正常）。

**未做（建议下一轮）**：

1. `editor/js/algorithms/data-sanitizer.js`（521 行）：同名站合并、墨迹吸附、最小二乘相似变换的边界条件（会不会把两个真实换乘站合并、会不会在稀疏数据上给出夸张变换）。
2. `editor/js/algorithms/align-solver.js`（328 行）：8 方向避让的判定是否会产生「站名压在轨道上」（对应项目质量规范的第一条红线）。
3. `editor/js/tools/batch-station-tool.js`（497 行）：`rowspan/colspan` 表格、异常 HTML、超长站名的解析边界。
4. `editor/js/tools/pdf-vector-extractor.js`（1,109 行）：三级降级（矢量→文本→视觉）的触发阈值；OCG 图层名 UTF-16BE 解码的异常路径。
5. `editor/js/layers/station-layer.js` + `core/city-render-runtime.js` 的沙箱逃逸面（城市脚本能否意外污染编辑器全局）。
6. **真机 / 真实浏览器验证**：本次全部结论来自 Node 与静态阅读，没有跑过浏览器。D-01~D-04 建议在 `http://localhost:8080/editor/` 上用真实城市（例如北京、上海、悉尼）走一遍「画线 → 保存 → 重载」来最终确认。
7. 触控/平板、Safari/Firefox 的 File System Access 降级路径。
