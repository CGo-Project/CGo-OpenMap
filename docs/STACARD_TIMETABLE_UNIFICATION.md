# 三城车站信息板共享层设计（地图卡片 + 首末班车）

> 适用范围：`city/shenyang`、`city/dalian`、`city/changchun`
> 目标：把三城重复的「车站地图卡片（stacard）」与「首末班车」实现收敛为一套共享引擎，城市侧只保留数据与阈值

---

## 1. 背景与设计取舍

三城各自实现了一份车站地图卡片与一份首末班车模块。逐行比对后确认：

- **重复的是骨架**：瓦片地址、墨卡托投影、缩放交互、占位 DOM、面板扫描，三城几乎逐字相同。
- **差异大多不是业务差异，而是历史写法差异**：日期类型判定、终点站代号、坐标查找链、变量命名，三城各写一套，语义本可一致。
- **真正私有的只有少数几处**：大连的贯通区段合并与推算标记、沈阳的有轨电车端点表、长春的季节阈值。

因此统一策略是：**机制进共享层，数据与阈值留在城市侧**。

被统一的机制一览：

| 机制 | 统一前的问题 |
|---|---|
| 日期类型判定 | 三个判定入口、两套标签词（`restday`/`weekend`）、一套星期码，语义相同表达不同 |
| 终点站代号 | 仅沈阳用 `line-first`/`line-last` 代号；另两城写死实体 ID，换终点站要改数据 |
| 坐标查找 | 三条不同的解析链，其中一条丢 ID、先到先得 |
| 占位 DOM | 同一份 DOM 三种拼法，字段顺序与转义策略不一 |
| 命名 | 全局名三个别名/城，模块 id 两种构词法，observer 字段名带城市前缀 |
| 车站提示卡片 | 三份逐字复制的实现（北京 / 合肥 / 福州），另一城另起一套设计 |
| 侧栏站名标题 | 两份逐字相同，第三份混在徽标同步模块里且规则不同 |

---

## 2. 共享层结构

### 2.1 目录与文件

```
city/shenyang/shared/stacard-engine.js       # ES module，export createStaCard
city/shenyang/shared/timetable-renderer.js   # classic script，挂 CGoTimetable / CGoDayType
city/shenyang/shared/station-title.js        # classic script，挂 CGoStationTitle
city/shenyang/shared/tip-card.js             # classic script，挂 CGoTipCard
```

四个文件顶部均写明「临时共享位置 + 计划迁入 `core/`」，便于评审时一眼看清意图，也避免后续维护者误以为是沈阳专属逻辑。

### 2.2 引用方式

| 使用方 | 引用写法 |
|---|---|
| 沈阳 stacard | `import { createStaCard } from "../shared/stacard-engine.js"` |
| 大连 / 长春 stacard | `import { createStaCard } from "../../shenyang/shared/stacard-engine.js"` |
| 三城 timetable / station-title | `document.write('<script src="./city/shenyang/shared/{文件}?v=' + version + '"><\/script>')` |
| 沈阳 tip-card | 同上 |

stacard 城市模块已是 ES module，相对 `import` 天然可用，**不改 `main.html`**。
timetable 的路径相对页面而非相对城市目录，故三城写法完全一致。

### 2.3 已知代价与缓解

| 代价 | 缓解 |
|---|---|
| 语义错位：`city/shenyang/` 定位是「沈阳这座城市的数据」，却托管了三城共享引擎 | 目录名用 `shared/` 明确标识非城市数据；文件头注明临时性质与迁移计划 |
| 单向依赖：大连、长春依赖沈阳目录存在 | 依赖是显式的三处 import 与三行 `document.write`，可 grep；迁移时只需改这几行路径 |
| 可发现性差：按 AGENTS.md 找共享代码只会去 `core/` | 文件头写明迁移计划；本文档留档 |
| 沈阳自引用 | 相对路径 `../shared/` 与另两城的 `../../shenyang/shared/` 形态不同，一眼可辨 |

### 2.4 迁移到 core/ 的路径

1. `git mv city/shenyang/shared/stacard-engine.js core/stacard-engine.js`
2. `git mv city/shenyang/shared/timetable-renderer.js core/timetable-renderer.js`
3. `git mv city/shenyang/shared/station-title.js core/station-title.js`
4. `git mv city/shenyang/shared/tip-card.js core/tip-card.js`
5. 改 3 处 stacard 的 `import` 路径 + 3 处 `{city}.js` 的 `document.write` 路径
6. 更新 `sw.js` 的 `ASSETS_TO_CACHE`
7. **零逻辑改动** —— 这正是选「共享文件」而非「三份复制」的主要理由

### 2.5 未采纳的方案

| 方案 | 未采纳原因 |
|---|---|
| `core/` 纯新增文件 | 涉及结构性变更，需先与维护团队达成一致 |
| `city/_shared/` | 易成为其他作者的堆放点；且这些机制本属引擎职责，放在 `city/` 下语义错位 |
| 三份逐字复制 | 改 bug 要同步三处，「统一」仅停留表层；迁移到 core 时还要从三份里挑一份 |

---

## 3. 统一契约

### 3.1 日期类型判定

共享一个解析器，城市只提供日历数据：

```js
CGoDayType.resolve(date = new Date(), { calendar } = {})
// → { key: "workday" | "restday", label: "工作日" | "节假日" }
```

判定顺序（时区固定 `Asia/Shanghai`）：

1. `calendar.holidayDates` 命中 → `restday`（法定假日）
2. `calendar.workdayDates` 命中 → `workday`（调休上班）
3. 否则按星期：周一至周五 `workday`，周六日 `restday`

**班次级的日期过滤**一并归一化，由星期码改为语义标签：

```js
{ includeWeekdays: [2, 3, 4, 5, 6] }   // 统一前（工作日，周一=1）
{ includeWeekdays: [1, 7] }            // 统一前（休息日）

{ dayType: "workday" }                 // 统一后："workday" | "restday" | "all"
```

### 3.2 标签显示规则：只在维度确有差异时显示

标签的作用是**区分当前用的是哪一套时刻表**，不是装饰：

> **某个维度（季节 / 日期类型）在当前车站-线路下若不产生任何差异，则不显示该维度的标签。**

判定方法：provider 除当前上下文的 rows 外，再算出「该维度取另一分支」时的 rows，两者相同即视为该维度无差异。

```js
CGoTimetable.sameRows(rowsA, rowsB)   // 逐行比对 destination/first/last/estimated
```

| 情形 | 标签 |
|---|---|
| 同季节下工作日与节假日时刻完全相同 | 不显示「工作日 / 节假日」 |
| 同日期类型下夏冬时刻完全相同 | 不显示「夏令时 / 冬令时」 |
| 两个维度都有差异 | 都显示（如「夏令时 工作日」） |
| 两个维度都无差异 | 只显示「首末班车」，不带第二行 |

### 3.3 终点站代号解析

```js
CGoTimetable.resolveDestination(line, value, { stations })
// "line-first" → 线路首站 ID
// "line-last"  → 线路末站 ID
// 其他         → 原样返回
```

分支线取 `stationIds-way1`（缺省回退 `stationIds`）。
大连、长春的数据因而不必写死终点站 ID，换终点站时无需改数据。

### 3.4 首末班车行模型

城市 provider 的输出：

```js
{ destination: "十三号街",   // 终点站显示名（不含「开往」）
  first: "06:30",           // 首班，可空
  last:  "22:00",           // 末班，可空
  note:  "推算",             // 可选，标注文本
  estimated: false }        // 可选，true 时渲染为前置「（推算）」
```

元信息（可选，拼在标签第二行）：`{ seasonLabel: "夏令时", dayTypeLabel: "工作日" }`

渲染器：

```js
CGoTimetable.renderRows(rows)                  // → "开往X：06:30-22:00<br>…"
CGoTimetable.renderCard({ rows, meta, label }) // → 完整卡片 HTML
```

**关键点**：城市的业务换算函数（贯通区段合并、有轨端点表、推算标记等）保持不动，只在最后一步接一个「转 rows」适配。

### 3.5 坐标查找链

统一为一条有序解析链，城市用配置开关裁剪：

```js
1. station 对象自带坐标         // lng/lat | longitude/latitude | coordinates 数组
2. byLine[lineId][stationName] // 同名站精确命中（见第 4 节）
3. byName[stationName]
4. byName[stationName 去「站」后缀]
5. byId[stationId]
6. byPoiid[poiid]
```

```js
index:   { byLine: true, byName: true, stripSuffix: false, byId: true, byPoiid: false }
hasCard: "strict" | "loose"
```

| 城市 | stripSuffix | byPoiid | hasCard |
|---|---|---|---|
| 沈阳 | false | false | strict |
| 大连 | false | false | loose |
| 长春 | true | true | strict |

### 3.6 占位 DOM

统一为单一模板，变体由配置产生：

```html
<div class="stacard-container stacard-minimap-box {crossPlatformClass}"
     data-card-type="map"
     data-sid="…" data-sname="…" data-lid="…" data-color="…" data-coords="…"
     style="{margin}">
  <div class="stacard-loading-tip"><span>正在加载车站地图...</span></div>
</div>
```

| 配置 | 沈阳 | 大连 | 长春 |
|---|---|---|---|
| `crossPlatformClass` | `hoisted-stacard` | — | — |
| `margin`（普通 / 跨站台） | `8px 0 14px 0` / `0 0 12px 0` | `8px 0 14px 0` | `8px 0 14px 0` |
| `escapePlaceholders` | false | true | true |
| `attribution` | false | false | true |

> 转义策略统一为「一律转义」更安全。占位 HTML 只用中文站名，故英文站名中含 `<br>` 的历史数据不受影响。

### 3.7 命名规范

| 项 | 统一为 |
|---|---|
| 渲染器全局 | `window.CGoStaCard`（城市 `getRenderer` 直接返回它） |
| observer 字段 | `_cgoStaCardResizeObserver` |
| 时刻表模块 id | `{city}-timetable`（如 `shenyang-timetable`） |
| 时刻表数据全局 | `{CITY}_TIMETABLE_DATA` |
| 共享全局 | `window.CGoStaCard` / `CGoTimetable` / `CGoDayType` / `CGoStationTitle` / `CGoTipCard` |

> 模块 id 改名需同步 `{city}.js` 中 `stationBoard.modules` 的键；这些 id 不在 `core/station-board.js` 的 `MODULE_ALIASES` 内，因此**无需改 core**。

### 3.8 车站提示卡片

统一为一个渲染器 + 城市配置，产出与上游模板一致的 DOM：

```js
CGoTipCard.render({ title, icon, iconSize, body })
```

```html
<div class="cgo-tip-card" style="…">
  <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:bold;color:var(--text-main);">
    <cgo-icon name="{icon}" size="{iconSize}" style="color: var(--primary-color);"></cgo-icon>
    <span>{title}</span>
  </div>
  <div style="font-size:12px;color:var(--text-light);line-height:1.5;">{body}</div>
</div>
```

各地配置：北京 / 合肥 / 福州为「历史文化与名胜指引」+ `location` 14px；沈阳为「报站目的地指引」+ 同一图标与顺序（`order: 15`）。

> 该 DOM 与 `city/beijing/modules/beijing_cultural.js`（上游「官方模板示范」）归一化比对后逐属性一致。北京 / 合肥 / 福州三份逐字复制的实现将来可一并迁移到本渲染器。

### 3.9 侧栏站名标题归一化

侧栏历史车站的标题由引擎按「站名 + 站」拼装，无法区分同名车站（地铁 / 有轨电车 / 国铁），站名本身以「站」结尾时还会拼出「XX站站」。三城都在城市层做后处理，**不修改 `core/`**。

统一为共享工厂 + 城市配置：

```js
createStationTitleNormalizer({
  cityRef,                 // 取 isTramStation 的城市对象
  metroRailForm,           // "prefix" | "suffix" | "none"
  keepDoubleZhanKinds,     // 末尾「站」保留双写的站类
  tramForceSuffixNames,    // 人工强制标注「（有轨站）」的站名
})
```

共享层负责：MutationObserver 安装、`requestAnimationFrame` 节流、`body.dataset` 防重复安装标记、「仅在确有差异时写入」的防自触发保护。

文案规则（按站类）：

| 情形 | 输出 |
|---|---|
| 有轨站（与地铁同名，或在强制名单内） | `XX站（有轨站）` |
| 国铁站 | `XX站（火车站）` |
| 与国铁同名的地铁站 | 由 `metroRailForm` 决定 |
| 其余 | `XX站` |

各城配置：

| 配置 | 沈阳 | 大连 | 长春 |
|---|---|---|---|
| `metroRailForm` | `"none"` | `"prefix"` → 「**地铁**XX站」 | `"suffix"` → 「XX站**（轨道交通）**」 |
| `keepDoubleZhanKinds` | `["metro"]` | `[]` | `[]` |
| `tramForceSuffixNames` | `[]` | `["大连火车站"]` | `[]` |

沈阳的 `metroRailForm` 为 `"none"`（不额外加「地铁」字样），但它对地铁站保留双写，于是同名站实际仍可区分——三种写法都能区分，只是风格不同：

| 城市 | 地铁侧 | 国铁侧 |
|---|---|---|
| 沈阳 | 「沈阳站**站**」 | 「沈阳站（火车站）」 |
| 大连 | 「**地铁**大连站」 | 「大连站（火车站）」 |
| 长春 | 「长春站（**轨道交通**）」 | 「长春站（火车站）」 |

---

## 4. 同名站索引

### 4.1 问题

`amap_data.json` 原按**站名**扁平索引（`STATION_GEO_MAP[站名] = "lng,lat"`），同城内同名站只有一份坐标。三城共有 15 个同名异值站（沈阳 3、大连 8、长春 4），距离从 44 m 到约 15 km 不等，扁平索引无法区分。

### 4.2 方案

给 `amap_data.json` 分组增加可选字段 `lines`（线路 ID 数组），索引升级为「线路 + 站名」，扁平表保留作回退：

```json
{ "ln": "54路/55路有轨电车", "lines": ["CCG54", "CCG55"], "st": [ … ] }
```

实现落点：`stacard-engine.js` 的 `loadData` 按分组的 `lines` 建 `byLine[lineId][站名]`；`getStation(stationId, stationInfo, lineId)` 的第 2 步优先查线路作用域，再退回扁平表。

### 4.3 分组书写顺序约定（重要）

**有轨分组写在前面，地铁分组写在后面。**

原因是 core 的 `initGeoSystem` 仍按数组顺序覆盖扁平表（后写胜出），而扁平表是 LBS「最近车站」的唯一数据源。同名站按「地铁侧优先」取值——地铁站是线网主干节点、被检索的频率更高。此顺序对 stacard 无影响：stacard 走线路作用域索引，两套坐标并存、各自命中。

**组内顺序同样有意义**：地铁组按线路拆开后，跨线站会出现多份坐标，扁平表由**最后一个含它的分组**胜出。

### 4.4 按线路分组

沈阳、大连的地铁组原为「一个分组声明全部线路」，于是 `byLine[线路]` 装的是同一批站、同一份坐标，按线路索引形同虚设。两城的地铁组已按 `data_lines.js` 的 `stationIds` 拆为按线路分组，与长春对齐：

| 城市 | 拆分后 |
|---|---|
| 沈阳 | 有轨5号线 + 1号线 + 2号线 + 3号线 + 4号线 + 9号线 + 10号线 |
| 大连 | 有轨电车 + 1号线 + 2号线 + 3号线 + 3号线支线 + 5号线 + 12号线 + 13号线 |

分组名用线路名，分组 `lines` 只含该线一条，组内站序改用该线运行顺序。**stacard 代码零改动**（`byLine` 索引早已就绪）；core 只读 `line.st`、不看 `ln`/`lines`，对拆分完全透明。

### 4.5 仍存的限制

LBS 侧受 core 未改动所限，一个站名仍只能对应一份坐标，故 4.3 的顺序约定靠**人工保证**。真正的收口需要 core 把 `STATION_GEO_MAP` 也改为「线路 + 站名」，属后续 core 阶段。

---

## 5. 风险与注意事项

1. **`window.STATION_GEO_MAP` 是死代码**。三城 stacard 都有查它的分支，但 `core/script.js` 里它是模块作用域的 `let`，从未挂到 `window`；stacard 以 ES module 加载，同样取不到，该分支恒为 `false`。共享层中已直接删除，未搬入。

2. **ResizeObserver 泄漏**。大连原实现缺少 `destroyResizeObserver`，重复渲染同一容器时旧 observer 不 `disconnect`，字段被覆盖后旧实例失去引用，监听持续累积。共享层使用固定字段名 + 统一销毁。

3. **不要固化「按站名索引」**。共享层若把扁平索引当契约，等于把同名站冲突写进引擎。应按第 4 节改为「线路 + 站名」。

4. **`document.write` 时机**。`{city}.js` 里的模块注入是同步 `document.write`，必须早于 `type=module` 的 `core/script.js`。共享层若也走 `document.write`，务必排在城市模块**之前**，否则模块注册时全局尚未定义。

5. **`cgo-icon` 加载顺序**。`core/cgo-ui.js` 是 module，在所有城市脚本之后加载。渲染发生在用户点击车站时，安全；但**不要在模块顶层同步查询 `cgo-icon` 的 DOM**。

6. **模块 id 改名的连带面**。需同步 `{city}.js` 的 `stationBoard.modules` 键。已确认这些 id 不在 `core/station-board.js` 的 `MODULE_ALIASES` 内，无需改 core。

7. **季节阈值不统一是有意的**。沈阳 4–10 月、长春 5–10 月，这是城市数据而非机制，**保留在城市侧**，不要为了「统一」而抹平。

8. **验证脚本必须先复刻 core 的运行期派生字段**。车站的 `id` 与 `relatedLines` 由 core 的 `processData()` 在运行期派生，原始 `data_stations.js` 里没有；比对脚本若不复刻这一步，`isTramStation` 恒为 `false`、同名站判定全部落空，会得出「零差异」的假阳性。
