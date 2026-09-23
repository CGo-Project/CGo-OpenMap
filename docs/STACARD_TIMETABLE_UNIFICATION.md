# 三城车站信息板统一设计（地图卡片 + 首末班车）

> 范围：`city/shenyang`、`city/dalian`、`city/changchun`
> 约束：不改动 `core/` 中**现有**文件；改动优先基于上游最新实现
> 目标：统一三城的**数据格式**与**渲染方式**，并统一此前被当作「城市私有」而遗漏的若干机制

---

## 1. 背景

三城各自实现了一份「车站地图卡片（stacard）」与一份「首末班车」模块。逐行比对后确认：

- **重复的是骨架**：瓦片地址、投影算法、缩放交互、占位 DOM、面板扫描，三城几乎逐字相同。
- **差异大多不是业务差异，而是历史写法差异**：日期类型判定、终点站代号、坐标查找链、变量命名，三城各写一套，语义本可一致。
- **真正私有的只有少数几处**：大连的贯通区段合并与推算标记、沈阳的有轨电车端点表、长春的季节阈值。

因此统一策略是：**机制进共享层，数据与阈值留在城市侧**。

---

## 2. 现状

### 2.1 地图卡片（stacard）

| 项 | 沈阳 | 大连 | 长春 |
|---|---|---|---|
| 文件 | `city/shenyang/stacard/script.js` | `city/dalian/stacard/script.js` | `city/changchun/stacard/script.js` |
| 行数 | 264 | 131 | 248 |
| 加载方式 | ES module（`main.html:278` 按 `folder + '/stacard/script.js'` 注入） | 同 | 同 |
| 瓦片地址 | `webrd0{n}.is.autonavi.com/…&style=8` | **完全相同** | **完全相同** |
| 投影 | `WebMercator.lngLatToPoint` | 同 | 同 |
| 缩放 | 默认 15，范围 12–18 | 同 | 同 |

**完全一致、可直接共享**：`escapeHtml`、`AMapTile.getTileUrl`、`WebMercator`、`init()`、`loadData()`、`parseCoordinates()`、`renderCard()` / `renderMapCard()` 瓦片网格循环、`renderPanelCards()`。

**需配置化的差异**：

| 差异项 | 沈阳 | 大连 | 长春 |
|---|---|---|---|
| 坐标索引键 | 站名 + 站 ID | 仅站名（`||=` 先到先得） | 站名 + 去「站」后缀 + 站 ID + `poiid` |
| `hasCard` 判定 | 严格（需坐标） | 宽松（有站名即真） | 严格 |
| 占位 DOM 变体 | 有 `isCrossPlatform` → `hoisted-stacard` 类 + 不同 margin | 无 | 无 |
| 占位 HTML 转义 | 无 | `escapeHtml` | `escapeHtml` |
| 高德署名 | 无 | 无 | 有 |
| ResizeObserver 字段 | `_shenyangStaCardResizeObserver` | `_dalianStaCardResizeObserver` | `_changchunStaCardResizeObserver` |
| `destroyResizeObserver` | 有 | **缺失** | 有 |

### 2.2 首末班车（timetable）

| 项 | 沈阳 | 大连 | 长春 |
|---|---|---|---|
| 展示模块 | `modules/shenyang_service_info.js`（155 行） | `modules/dalian_timetable.js`（104 行） | `modules/changchun_service_info.js`（90 行） |
| 模块 id | `shenyang-service-info` | `dalian-line-timetable` | `changchun-service-info` |
| order / targetTab | 15 / `line-tab` | 15 / `line-tab` | 15 / `line-tab` |
| 数据全局 | `SHENYANG_STACARD_DATA` + `SHENYANG_TRAMWAY_TIMETABLE` | `DALIAN_TIMETABLE_DATA` | `CHANGCHUN_TIMETABLE_DATA` |
| 数据顶层维度 | 车站 → 线路 | 车站 → 线路 | **线路 → 车站** |
| 季节阈值 | 4–10 月为夏令时 | 无季节概念 | **5–10 月**为夏令时 |
| 日期类型 | 无 | 调休日历 + `includeWeekdays` 星期码 | 按星期判定 |

**渲染出的 DOM 三城完全一致**：

```html
<div class="…-card" style="margin:8px 0 14px 0;">
  <div class="stacard-info-content" style="…">
    <div class="info-row">
      <span class="info-label">首末班车<br><small>夏令时 工作日</small></span>
      <span class="info-value">开往XX：06:30-22:00<br>…</span>
    </div>
  </div>
</div>
```

文本格式也都是「开往X：首-末」、缺项退化为「首班 X」/「末班 X」。**差异全在取数，不在渲染。**

### 2.3 此前遗漏、需一并统一的机制

前一版文档把下列机制归入「城市私有」而未纳入统一范围，这是判断失误——它们都不是业务差异，而是同一件事的不同写法：

| 机制 | 沈阳 | 大连 | 长春 | 问题 |
|---|---|---|---|---|
| **日期类型判定** | 无此概念 | `getDalianTimetableDayType` + `DALIAN_TIMETABLE_CALENDAR` 调休表；班次级用 `includeWeekdays` 星期码（`[2..6]`=工作日、`[1,7]`=休息日，周一=1） | 按 `Intl.DateTimeFormat` 取 weekday 判 workday/weekend | 三个判定入口、两套标签词（`restday`/`weekend`）、一套星期码，语义相同表达不同 |
| **终点站代号** | `destination: "line-first"` / `"line-last"`，由 `resolveDestinationStationId` 解析，分支线取 `stationIds-way1` | 直接存 `destinationStationId` 实体 ID | 直接存 `destination` 实体 ID | 仅沈阳用代号；另外两城写死 ID，导致换终点站要改数据 |
| **坐标查找方式** | `getStation`：查死代码全局 → `stationsData[ID]` → `stationsData[站名]` | `getStationCoords`：站对象自带坐标 → `stationsData[站名]`（无 ID 回退） | `getStation`：候选键 `[站名, 去「站」后缀, ID]` 逐个试 | 三条不同的解析链，大连那条最弱（丢 ID、先到先得） |
| **占位 DOM** | 单模板 + `isCrossPlatform` 变体 | 单模板 | 单模板（含署名） | 同一份 DOM 三种拼法，字段顺序与转义策略不一 |
| **命名** | 全局 `ShenyangStaCard` / `SHENYANG_STACARD` / `StaCard`；模块 id `shenyang-service-info` | `DalianStaCard` / `DALIAN_STACARD` / `StaCard`；`dalian-line-timetable` | `ChangchunStaCard` / `CHANGCHUN_STACARD` / `StaCard`；`changchun-service-info` | 全局名 3 个别名/城，模块 id 两种构词法（`-service-info` / `-line-timetable`），observer 字段名带城市前缀 |

### 2.4 车站提示卡片（station-info 选项卡）

挂载在 `station-info` 选项卡上的提示卡片，各城写法如下：

| 城市 | 模块 id | order | 内容形态 | DOM 结构 |
|---|---|---|---|---|
| 北京 | `beijing-cultural-tip` | 15 | 单段景点描述 | 标题行（`location` 图标 14px + 标题）+ 正文，样式内联 |
| 合肥 | `hefei-cultural-tip` | 15 | 同北京 | **与北京逐字相同** |
| 福州 | `fuzhou-cultural-tip` | 15 | 同北京 | **与北京逐字相同** |
| 沈阳 | `shenyang-cultural-destinations` | **5** | 目的地列表 + 固定句式「去往X的乘客，请从该站下车」 | 单行 flex：`info` 图标 18px + 文案，样式在 `city/shenyang/style.css` |

**关键事实**：北京 / 合肥 / 福州 三份模块除类名前缀、模块 id 与 `--primary-color` 的硬编码回退色（`#1a73e8` / `#e71f24` / `#0C2340`）外**逐字一致**，是同一份实现的三次复制。北京的模块头注释自称「官方模板示范」，即上游的标准形态。

沈阳则是另一种设计：无标题行、图标用 `info` 18px、样式走 CSS 类而非内联、`order` 为 5（其余城市为 15）、无卡片底色、内容为「报站目的地」而非「景点介绍」。

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

**班次级的日期过滤**也一并归一化。现状大连用星期码，统一后改为语义标签：

```js
// 现状（大连）
{ includeWeekdays: [2, 3, 4, 5, 6] }   // 工作日
{ includeWeekdays: [1, 7] }            // 休息日

// 统一后
{ dayType: "workday" }   // "workday" | "restday" | "all"
```

**各城映射**：

| 城市 | 统一后 |
|---|---|
| 大连 | `DALIAN_TIMETABLE_CALENDAR` → 作为 `calendar` 传入；`includeWeekdays` → `dayType`（需一次性数据迁移） |
| 长春 | 无日历，纯按星期；季节阈值（5–10 月）保留在城市侧 |
| 沈阳 | 目前无日期类型概念，机制接入即可，`calendar` 缺省 |

### 3.1.1 标签显示规则：只在维度确有差异时显示

标签的作用是**区分当前用的是哪一套时刻表**，不是装饰。因此：

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

**各城实际效果**：

| 城市 | 季节维度 | 日期类型维度 |
|---|---|---|
| 沈阳 | 按数据判定（夏冬时刻相同则不显示） | 无此维度，恒不显示 |
| 大连 | 无此维度，恒不显示 | 按数据判定（工作日与节假日相同则不显示） |
| 长春 | 按数据判定 | 按数据判定 |

> 好处：既统一了机制，又不会给任何城市凭空加上原本没有的标签；同时比现状更准确——现状大连**无条件**显示「工作日/节假日」，即便当天与休息日时刻完全一致。

---

### 3.2 终点站代号解析

把沈阳已有的约定提升为全局契约，三城都可使用：

```js
CGoTimetable.resolveDestination(line, value, { stations })
// "line-first" → 线路首站 ID
// "line-last"  → 线路末站 ID
// 其他         → 原样返回
```

分支线沿用沈阳现行行为：取 `stationIds-way1`（缺省回退 `stationIds`）。

好处：大连、长春的数据不必写死终点站 ID，换终点站时无需改数据。

### 3.3 首末班车行模型

城市 provider 的输出：

```js
{ destination: "十三号街",   // 终点站显示名（不含「开往」）
  first: "06:30",           // 首班，可空
  last:  "22:00",           // 末班，可空
  note:  "推算",             // 可选，标注文本
  estimated: false }        // 可选，true 时渲染为前置「（推算）」
```

元信息（可选，拼在标签第二行）：

```js
{ seasonLabel: "夏令时", dayTypeLabel: "工作日" }
```

渲染器：

```js
CGoTimetable.renderRows(rows)                        // → "开往X：06:30-22:00<br>…"
CGoTimetable.renderCard({ rows, meta, label })       // → 完整卡片 HTML
```

**三城 provider 映射**：

| 城市 | 保留的城市私有逻辑 | 末尾适配 |
|---|---|---|
| 沈阳 | 有轨端点表（`SHENYANG_TRAMWAY_TIMETABLE`）、季节阈值 4–10 月、`line-first`/`line-last` 解析 | 转 rows；有轨分支把 `stationName` 拼进 `destination`，`dailySinglePair` → `note` |
| 大连 | 贯通区段合并、九里开发方向合并、推算标记、调休日历 | 转 rows；`isEstimated` → `estimated` |
| 长春 | 季节阈值 5–10 月、四维（季节 × 日期类型） | 转 rows |

**关键点**：三城的业务换算函数一行不动，只在最后一步接一个「转 rows」适配。

### 3.4 坐标查找链

统一为一条有序解析链，城市用配置开关裁剪：

```js
1. station 对象自带坐标        // lng/lat | longitude/latitude | coordinates 数组
2. byLine[lineId][stationName] // 同名站精确命中（见第 5 节）
3. byName[stationName]
4. byName[stationName 去「站」后缀]
5. byId[stationId]
6. byPoiid[poiid]
```

```js
index: { byLine: true, byName: true, stripSuffix: false, byId: true, byPoiid: false }
hasCard: "strict" | "loose"
```

| 城市 | stripSuffix | byPoiid | hasCard |
|---|---|---|---|
| 沈阳 | false | false | strict |
| 大连 | false | false | **loose** |
| 长春 | **true** | **true** | strict |

### 3.5 占位 DOM

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
| `escapePlaceholders` | false | **true** | **true** |
| `attribution` | false | false | **true** |

> 转义策略统一为「一律转义」更安全；需确认沈阳站名中含 `<br>` 的历史数据（部分英文站名）不受影响——当前占位 HTML 只用中文站名，安全。

### 3.6 命名规范

| 项 | 现状 | 统一为 |
|---|---|---|
| 渲染器全局 | `ShenyangStaCard` / `SHENYANG_STACARD` / `StaCard`（三别名/城） | 共享引擎挂 `window.CGoStaCard`，城市 `getRenderer` 直接返回它 |
| observer 字段 | `_shenyangStaCardResizeObserver` 等三个 | `_cgoStaCardResizeObserver` |
| 时刻表模块 id | `shenyang-service-info` / `dalian-line-timetable` / `changchun-service-info` | `shenyang-timetable` / `dalian-timetable` / `changchun-timetable` |
| 时刻表数据全局 | `SHENYANG_STACARD_DATA` / `DALIAN_TIMETABLE_DATA` / `CHANGCHUN_TIMETABLE_DATA` | `{CITY}_TIMETABLE_DATA`（沈阳需改名，见风险 7） |
| 共享全局 | — | `window.CGoStaCard` / `window.CGoTimetable` / `window.CGoDayType` |

> 模块 id 改名需同步 `{city}.js` 中 `stationBoard.modules` 的键；这些 id 不在 `core/station-board.js` 的 `MODULE_ALIASES` 内，因此**无需改 core**。

### 3.7 车站提示卡片

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

| 配置 | 北京 | 合肥 | 福州 | 沈阳 |
|---|---|---|---|---|
| `title` | 历史文化与名胜指引 | 同 | 同 | **报站目的地指引** |
| `icon` / `iconSize` | `location` / 14 | 同 | 同 | `location` / 14（现为 `info` / 18） |
| `body` | 单段描述 | 同 | 同 | 「去往**X、Y**的乘客，请从该站下车」 |
| `order` | 15 | 15 | 15 | 15（现为 5） |

**对沈阳的影响（可见变更，需确认）**：卡片会多出标题行、图标由 `info` 18px 改为 `location` 14px、`order` 由 5 改为 15（从「车站类型」之前移到之后）、并显示卡片底色。沈阳现有 CSS 类（`city/shenyang/style.css` 中的 `.shenyang-cultural-destination-card` 等 5 处）可随之移除。

**本轮范围**：北京 / 合肥 / 福州 三份逐字复制的模块暂不动（超出三城范围）。待共享层位置与团队达成一致后，四城一并迁移到 `CGoTipCard`。

### 3.8 侧栏站名标题归一化

侧栏历史车站的标题由引擎按「站名 + 站」拼装，无法区分同名车站（地铁 / 有轨电车 / 国铁），站名本身以「站」结尾时还会拼出「XX站站」。三城都在城市层做后处理，不修改 `core/`。

**现状：大连与长春两份实现逐字相同**（仅城市名与 4 处配置不同），沈阳那份则混在 `shenyang_station_board.js` 里，且规则有两处实质差异。

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

**文案规则**（按站类）：

| 情形 | 输出 |
|---|---|
| 有轨站（与地铁同名，或在强制名单内） | `XX站（有轨站）` |
| 国铁站 | `XX站（火车站）` |
| 与国铁同名的地铁站 | 由 `metroRailForm` 决定（见下表） |
| 其余 | `XX站` |

**三城配置差异**：

| 配置 | 沈阳 | 大连 | 长春 |
|---|---|---|---|
| `metroRailForm` | **`"none"`**（不作区分） | `"prefix"` → 「**地铁**XX站」 | `"suffix"` → 「XX站**（轨道交通）**」 |
| `keepDoubleZhanKinds` | **`["metro"]`**（仅地铁保留「XX站站」） | `[]`（全部去重） | `[]`（全部去重） |
| `tramForceSuffixNames` | `[]` | `["大连火车站"]` | `[]` |

**两处实质差异**（统一时按「保留沈阳现状」处理）：

1. **沈阳 `metroRailForm` 为 `"none"`，但它靠「双写」承担了区分职责**。沈阳不额外加「地铁」字样；而它恰好对地铁站保留双写，于是同名站实际仍可区分：

   | 城市 | 地铁侧 | 国铁侧 |
   |---|---|---|
   | 沈阳 | 「沈阳站**站**」 | 「沈阳站（火车站）」 |
   | 大连 | 「**地铁**大连站」 | 「大连站（火车站）」 |
   | 长春 | 「长春站（**轨道交通**）」 | 「长春站（火车站）」 |

   三种写法都能区分，只是风格不同。沈阳的数据里「沈阳站」「沈阳北站」各有地铁与 `rdot` 两份，正好落在这一规则上。**是否改为加标注由城市主理人判断**；统一时先原样保留。

2. **`keepDoubleZhanKinds` 沈阳为 `["metro"]`**，即只有地铁站的「XX站」名会双写，有轨与国铁一律去重；大连/长春一律去重（`[]`）。这与第 1 点是同一机制的两面——沈阳把「双写」同时用作站类区分手段。

**组织方式统一**（本轮主要收益）：三城各自一个薄文件只写配置；沈阳那份需要从 `shenyang_station_board.js` 中**拆出**——它目前与「紧凑线路徽标同步」共用一个 MutationObserver，拆分后标题归一化用共享层自己的 observer，`shenyang_station_board.js` 只留徽标同步。

---

## 4. 共享代码位置

**已定：本轮先放在 `city/shenyang/` 下，作为临时共享位置。**

`core/`（含纯新增文件）或按作者名区分（如 `city/_shared/jrzhang`）等结构性方案，均需先征求开发团队意见，本轮不自行引入。

### 4.1 目录与文件

```
city/shenyang/shared/stacard-engine.js       # ES module，export createStaCard
city/shenyang/shared/timetable-renderer.js   # classic script，挂 CGoTimetable / CGoDayType
city/shenyang/shared/station-title.js        # classic script，挂 CGoStationTitle
city/shenyang/shared/tip-card.js             # classic script，挂 CGoTipCard
```

四个文件顶部均写明「临时共享位置 + 计划迁入 core/」，便于团队评审时一眼看清意图，也避免后续维护者误以为是沈阳专属逻辑。

### 4.2 引用方式

| 使用方 | 引用写法 |
|---|---|
| 沈阳 stacard | `import { createStaCard } from "../shared/stacard-engine.js"` |
| 大连 stacard | `import { createStaCard } from "../../shenyang/shared/stacard-engine.js"` |
| 长春 stacard | 同大连 |
| 三城 timetable / station-title | `document.write('<script src="./city/shenyang/shared/{文件}?v=' + version + '"><\/script>')` |
| 沈阳 tip-card | 同上（目前仅沈阳引用） |

stacard 城市模块已是 ES module，相对 `import` 天然可用，**不改 `main.html`**。
timetable 的路径相对页面而非相对城市目录，故三城写法完全一致。

### 4.3 已知代价与缓解

| 代价 | 缓解 |
|---|---|
| 语义错位：`city/shenyang/` 的定位是「沈阳这座城市的数据」，却托管了三城共享的引擎 | 目录名用 `shared/` 明确标识非城市数据；文件头注明临时性质与迁移计划 |
| 单向依赖：大连、长春依赖沈阳目录存在 | 依赖是显式的三处 import 与三行 `document.write`，可 grep；迁 core 时只需改这几行路径 |
| 可发现性差：按 AGENTS.md 找共享代码只会去 `core/` | 文件头写明迁移计划；本文档第 4 节留档 |
| 沈阳自引用：沈阳自己也用这个引擎 | 相对路径 `../shared/` 与另两城的 `../../shenyang/shared/` 形态不同，一眼可辨 |

### 4.4 迁移路径（待团队同意后）

1. `git mv city/shenyang/shared/stacard-engine.js core/stacard-engine.js`
2. `git mv city/shenyang/shared/timetable-renderer.js core/timetable-renderer.js`
3. `git mv city/shenyang/shared/station-title.js core/station-title.js`
4. `git mv city/shenyang/shared/tip-card.js core/tip-card.js`
5. 改 3 处 stacard 的 import 路径 + 3 处 `{city}.js` 的 `document.write` 路径
6. 更新 `sw.js` 的 `ASSETS_TO_CACHE`
7. **零逻辑改动** —— 这正是选「共享文件」而非「三份复制」的主要理由

### 4.5 备选方案（未采纳）

| 方案 | 未采纳原因 |
|---|---|
| `core/` 纯新增文件 | 需团队同意；本轮不自行引入结构性变更 |
| `city/_shared/` | 易成为其他作者的堆放点；且这些机制本属引擎职责，放在 `city/` 下语义错位 |
| 三份逐字复制 | 改 bug 要同步三处，「统一」仅停留表层；迁移到 core 时还要从三份里挑一份 |

---

## 5. 同名站索引（已完成）

### 5.1 问题

`amap_data.json` 原按**站名**扁平索引（`STATION_GEO_MAP[站名] = "lng,lat"`），同城内同名站只有一份坐标。坐标采集阶段因此做过三处妥协，本阶段已全部撤销：

| 城市 | 站名 | 冲突情形 | 原处置 | 现状 |
|---|---|---|---|---|
| 沈阳 | 综合保税区 | 有轨 5 号线 vs 地铁 2 号线南延线，相距约 15 km | 保留地铁侧，有轨站无坐标 | 两组各存一份，按线路解析 |
| 大连 | 七贤岭 | 有轨 202 路 vs 地铁 1 号线，相距 1.36 km | 保留地铁侧 | 同上 |
| 长春 | 和平大街 / 西环城路 / 腾跃街 / 长春西站 | 有轨 vs 地铁，相距 160–950 m | 覆盖为有轨站位，地铁侧定位偏移 | 同上 |

另有两处顺带解决：沈阳「奥体中心 / 建筑大学」的有轨与地铁同名站位差异（250–350 m），大连其余 6 个同址同名站（44–288 m）。

### 5.2 方案

给 `amap_data.json` 分组增加可选字段 `lines`（线路 ID 数组），索引升级为「线路 + 站名」，扁平表保留作回退：

```json
{ "ln": "54路/55路有轨电车", "lines": ["CCG54", "CCG55"], "st": [ … ] }
```

### 5.2.1 分组书写顺序约定（重要）

**有轨分组写在前面，地铁分组写在后面。**

原因是 core 的 `initGeoSystem` 仍按数组顺序覆盖扁平表（后写胜出），而扁平表是 LBS「最近车站」的唯一数据源。同名站按「地铁侧优先」取值，因为地铁站是线网主干节点、被检索的频率更高。此顺序对 stacard 无影响——stacard 走线路作用域索引，两套坐标并存、各自命中。

> 注：HEAD 版本里地铁组反而在**前**、有轨组在**后**（分组只有 `st`、没有 `ln`/`lines`），所以当时扁平表取的是有轨侧。这条约定是阶段三连同 `lines` 字段一起修正的。

**组内顺序同样有意义**（见 5.6）：一旦地铁组也按线路拆开，跨线站会出现多份坐标，扁平表同样由**最后一个含它的分组**胜出。

### 5.3 实现与验证

| 环节 | 落点 |
|---|---|
| 索引构建 | `stacard-engine.js` 的 `loadData`：按分组的 `lines` 建 `byLine[lineId][站名]` |
| 查找链 | `getStation(stationId, stationInfo, lineId)` 第 2 步优先查线路作用域，再退回扁平表 |
| 线路标识来源 | `hasCard` 的 `lineId` 参数；`getCardPlaceholderHtml` 的 `lineInfo.id`；`renderCard` 的 `context.lineId` 或占位卡片的 `data-lid` |

验证（三城共 15 个同名异值站）：

| 城市 | 同名异值站 | 按线路解析 | LBS 扁平表 |
|---|---|---|---|
| 沈阳 | 3 | 全部正确 | 全部取地铁侧 |
| 大连 | 8 | 全部正确 | 全部取地铁侧 |
| 长春 | 4 | 全部正确 | 全部取地铁侧 |

### 5.4 仍存的限制

LBS 侧受 core 未改动所限，一个站名仍只能对应一份坐标，故 5.2.1 的顺序约定是**人工保证**的。真正的收口需要 core 把 `STATION_GEO_MAP` 也改为「线路 + 站名」，属后续 core 阶段。

### 5.5 影响面

- **stacard（城市侧，已完成）**：`hasCard` / `getCardPlaceholderHtml` / `renderCard` 都拿得到 `lineId`，已接入。
- **LBS 最近车站（core 侧，本轮未改）**：仍用扁平表，靠 5.2.1 的顺序约定控制取值。

### 5.6 按线路分组（阶段三遗留缺口，本轮补做）

**问题**：阶段三只做到「给分组加 `lines` + 建 `byLine` 索引」，**没有**把沈阳、大连的扁平地铁组拆开。沈阳「地铁」分组声明了全部 6 条线，于是 `byLine[SYM01]`～`byLine[SYM10]` 装的是**同一批 145 个站、同一份坐标**——按线路索引形同虚设，同名站在沈阳仍只有一个坐标。只有长春本来就是「每条线一组」（8 组），跨线站在各线各存一份（24 条重复条目）。

**本轮处置**：把两城的地铁组按 `data_lines.js` 的 `stationIds` 拆成按线路分组，与长春对齐。

| 城市 | 拆分前 | 拆分后 |
|---|---|---|
| 沈阳 | 有轨5号线(29) + 地铁(144) | 有轨5号线(29) + 1号线(32) + 2号线(33) + 3号线(27) + 4号线(23) + 9号线(23) + 10号线(21) |
| 大连 | 有轨电车(38) + 地铁(100) | 有轨电车(38) + 1号线(22) + 2号线(29) + 3号线(12) + 3号线支线(7) + 5号线(18) + 12号线(8) + 13号线(12) |

- 分组名用线路名（同长春），分组 `lines` 只含该线一条。
- 组内站序改用**该线的运行顺序**（`stationIds` 顺序），比原先的混合顺序可读。
- 有轨分组保持在前不动；地铁组顺序取 `city.LINE_SORT_ORDER`（大连），沈阳该项为空故用 `data_lines.js` 的声明顺序。
- **stacard 代码零改动**（`byLine` 索引早已就绪）；core 只读 `line.st`、不看 `ln`/`lines`，对拆分完全透明。

**沈阳 14 个换乘站的新坐标**（城市主理人按线右击采集）落点：

| 新坐标站名 | 落点线路 | 旧值偏移 |
|---|---|---|
| 铁西广场 | SYM09 | 69 m |
| 奥体中心 | SYM09 | 100 m |
| 淮河街沈医二院 | SYM10 | ~90 m |
| 中医药大学 | SYM10 | 189 m |
| 滂江街 | SYM10 | 93 m |
| 长青南街 | SYM10 | 101 m |
| 合作街 | SYM04 | 105 m |
| 沈阳北站 | SYM04 | 208 m |
| 太原街 | SYM04 | 148 m |
| 长白南 | SYM04 | 23 m |
| 大通湖街 | SYM03 | 8 m |
| 砂阳 | SYM03 | 140 m |
| 工业展览馆 | SYM03 | 294 m |
| 江东街 | SYM03 | 155 m |

**扁平表取值的连带影响**：新坐标只写进指定线路的那一份副本，其余线路保留旧值；扁平表由**最后一个含该站的分组**胜出。因此有 5 个站的 LBS 取值仍是旧值——**砂阳**（补丁在 SYM03，末位是 SYM04）、**大通湖街**（SYM03 / 末位 SYM09）、**合作街**（SYM04 / 末位 SYM10）、**长白南**（SYM04 / 末位 SYM09）、**江东街**（SYM03 / 末位 SYM10）。其余 9 个站的扁平表值同步更新。差异均在 100–160 m 内，且只影响 LBS 选中哪一份坐标，不影响 stacard 按线路定位。

> 若希望这 5 个站的 LBS 取值也用新值，需要把分组顺序调整为 SYM01/02/09/10/04/03 —— 但那样顺序就纯粹由某一批坐标倒推而来，下一批坐标又会要求另一种顺序，因此**保留按线路编号的稳定顺序**，不为单批数据破坏约定。

**验证**（对 `git HEAD` 修正基准后逐项比对，全部通过）：

| 项 | 沈阳 | 大连 |
|---|---|---|
| 扁平表站名数 | 170 → 170，无丢失 / 无新增 | 130 → 130，无丢失 / 无新增 |
| 扁平表取值变化 | 9 个（与预期一致） | **0 个**（本轮只做结构拆分） |
| 按线路逐站核对 | 159 项站数与坐标全对 | 108 项全对 |
| 有轨分组 | 保持原样 | 保持原样 |
| 文件格式 | UTF-8 无 BOM / CRLF | 同 |

> 基准陷阱：`git show HEAD` 拿到的是**阶段三之前**的版本（`lines` 字段与有轨分组前置都未提交），分组只有 `st`、且地铁在前有轨在后。直接拿它当基准会误报 8 个「有轨同名站取值变化」。正确基准应为「本文件未改动的有轨分组 + HEAD 的地铁分组」。

---

## 6. 实施步骤

三个阶段的顺序有依赖：阶段三（同名站索引）为阶段二（地图卡片）提供「线路 + 站名」的查找能力，但阶段一（时刻表）与它无关，故先做阶段一以最低风险跑通「共享层 + 城市 provider」这套模式。

### 阶段一：首末班车

1. 建立共享层 `city/shenyang/shared/timetable-renderer.js`（`CGoTimetable` + `CGoDayType`）。
2. 三城 `{city}.js` 各加一行 `document.write` 引入共享层（须排在自身模块之前，见风险 4）。
3. 大连迁移 `includeWeekdays` 星期码 → `dayType` 语义标签。
4. 三城展示模块改为「业务换算 → 归一化 rows → 调共享渲染」，DOM 与文案保持不变。
5. 实现 3.1.1 的标签差异判定，替换大连现行「无条件显示工作日/节假日」的写法。
6. 三城模块 id 统一为 `{city}-timetable`，同步 `{city}.js` 的 `stationBoard.modules` 键。
7. 验证：逐城打开车站信息板，比对改动前后的文本与样式；重点核对标签在「夏冬相同」「工作日与节假日相同」时是否正确隐去。

### 阶段二：地图卡片

1. 建立 `city/shenyang/shared/stacard-engine.js`（`createStaCard(config)`）与统一命名。
2. 先改**大连**（131 行、结构最简、坐标刚校准过），肉眼比对卡片效果。
3. 确认等价后推沈阳、长春，补齐各自配置项。
4. 顺带修复大连缺失 `destroyResizeObserver` 导致的监听泄漏。
5. 验证：切站、缩放、滚轮、窗口尺寸变化、跨站台置顶卡片。

### 阶段三：同名站索引（已完成）

1. 给 `amap_data.json` 的分组补 `lines` 字段（线路 ID 数组）。
2. 共享层实现 3.4 的查找链第 2 步（`byLine`）。
3. 撤销 5.1 的三处妥协：沈阳综合保税区、大连七贤岭、长春四个同名站恢复为「地铁与有轨各存一份」。
4. LBS（`core/script.js`）本轮不改，分组书写顺序仍需人工保证「希望生效的取值放后面」。
5. 验证：对有轨与地铁同名站分别点击，确认卡片定位各自正确。

### 阶段四：车站信息板展示层（提示卡片 + 侧栏站名标题）（已完成）

**4b 侧栏站名标题归一化**

1. 在共享层建立 `createStationTitleNormalizer(config)`（`city/shenyang/shared/station-title.js`），含 observer 安装、rAF 节流、防重复安装与防自触发写入。
2. 大连 / 长春两个文件改为薄配置（`metroRailForm` 分别 `"prefix"` / `"suffix"`，`tramForceSuffixNames` 分别 `["大连火车站"]` / `[]`）。
3. **沈阳从 `shenyang_station_board.js` 中拆出**：标题归一化独立成 `modules/shenyang_station_title.js` 走共享层，`shenyang_station_board.js` 只留紧凑线路徽标同步与同名站点击处理；配置为 `metroRailForm: "none"`、`keepDoubleZhanKinds: ["metro"]`。
4. 验证：三城 **499 座车站**逐站比对改动前后的标题文本，**零差异**。关键样例：

   | 城市 | 地铁侧 | 国铁侧 | 有轨侧 |
   |---|---|---|---|
   | 沈阳 | 「沈阳站站」 | 「沈阳站（火车站）」 | 「综合保税区站（有轨站）」 |
   | 大连 | 「地铁大连站」 | 「大连站（火车站）」 | 「七贤岭站（有轨站）」 |
   | 长春 | 「长春站（轨道交通）」 | 「长春站（火车站）」 | 「和平大街站（有轨站）」 |

   > 验证要点：车站的 `id` 与 `relatedLines` 由 core 的 `processData()` 在运行期派生，原始
   > `data_stations.js` 里没有。比对脚本必须先复刻这一步，否则 `isTramStation` 恒为 false、
   > 同名站判定全部落空，会得出「零差异」的假阳性。

**4a 车站提示卡片**

1. 在共享层建立 `CGoTipCard.render({ title, icon, iconSize, body, color })`（`city/shenyang/shared/tip-card.js`），DOM 与上游模板逐属性一致。
2. 沈阳迁移到 `CGoTipCard`：标题「报站目的地指引」、图标 `location` 14px、`order` 5→15，并移除 `city/shenyang/style.css` 中 5 处专属样式。
3. 北京 / 合肥 / 福州 暂不动（见 3.7），待共享层位置与团队达成一致后四城一并迁移。
4. 验证：把上游北京模块与共享层的产出做归一化结构比对（style 声明逐条比对 + 标签结构比对），**完全一致**。

> 沈阳卡片因此产生可见变更（新增标题行、图标 `info`/18px → `location`/14px、`order` 前移到
> 「车站类型」之后、新增卡片底色与边框），已确认采用，见待确认 5。

### 每阶段结束

- 跑 `node drunk/tools/selfcheck.js` 确认无新增失败。
- 递增 `sw.js` 的 `CACHE_NAME`，新增共享文件登记进 `ASSETS_TO_CACHE`。
- 单独提交，便于回滚。

---

## 7. 风险与坑

1. **`window.STATION_GEO_MAP` 是死代码**。三城 stacard 都有查它的分支，但 `core/script.js` 里它是模块作用域的 `let`（第 2360 行），从未挂到 `window`；stacard 以 ES module 加载，同样取不到。该分支恒为 `false`。统一时**直接删除，不要搬进共享层**。

2. **ResizeObserver 泄漏**。大连**缺少 `destroyResizeObserver`**，重复渲染同一容器时旧 observer 不 `disconnect`，字段被覆盖后旧实例失去引用，监听持续累积。统一后使用固定字段名 + 统一销毁。

3. **不要固化「按站名索引」**。共享层若把扁平索引当契约，等于把同名站冲突写进引擎。应按第 5 节改为「线路 + 站名」。

4. **`document.write` 时机**。`{city}.js` 里的模块注入是同步 `document.write`，必须早于 `type=module` 的 `core/script.js`。共享层若也走 `document.write`，务必排在城市模块**之前**，否则模块注册时全局尚未定义。

5. **`cgo-icon` 加载顺序**。`core/cgo-ui.js` 是 module，在所有城市脚本之后加载。渲染发生在用户点击车站时，安全；但**不要在模块顶层同步查询 `cgo-icon` 的 DOM**。

6. **模块 id 改名的连带面**。需同步 `{city}.js` 的 `stationBoard.modules` 键。已确认这些 id 不在 `core/station-board.js` 的 `MODULE_ALIASES` 内，无需改 core。

7. **沈阳数据全局改名成本**。`SHENYANG_STACARD_DATA` 定义在 `city/shenyang/stacard/data.js`（1845 行），被 `modules/shenyang_service_info.js` 消费。改名可行，但该文件路径 `stacard/data.js` 本身也名不副实（存的是时刻数据）。建议：先加 `SHENYANG_TIMETABLE_DATA` 别名并存，待卡片阶段一并整理，避免一次动太多。

8. **季节阈值不统一是有意的**。沈阳 4–10 月、长春 5–10 月，这是城市数据而非机制，**保留在城市侧**，不要为了「统一」而抹平。

---

## 8. 待确认事项

| # | 事项 | 状态 |
|---|---|---|
| 1 | 共享代码位置 | **已定**：本轮放 `city/shenyang/shared/`；`core/` 或 `city/_shared/{作者名}` 待征求开发团队意见（见第 4 节） |
| 2 | 阶段三（同名站索引） | **已定**：本轮一并做 |
| 3 | 沈阳日期类型 | **已定**：机制接入，标签按 3.1.1 的差异判定决定是否显示（沈阳无日期类型维度，故恒不显示） |
| 4 | 是否补 `cgo-icon` | 待定。文档未强制「必须有图标」，铁律只约束「有图标时必须用 cgo-icon、禁用 emoji」；合肥/福州的时刻表已用 `clock`。加则视觉有变化 |
| 5 | 沈阳提示卡片是否采用上游结构 | **已定**：采用。沈阳已迁移到 `CGoTipCard`，可见变更如 3.7 / 阶段四 4a 所述 |
| 6 | 沈阳侧栏标题是否补「地铁/国铁」区分 | 待定。沈阳 `metroRailForm` 现为 `"none"`，改由末尾「站」双写区分（「沈阳站站」vs「沈阳站（火车站）」，已实测生效）；大连/长春分别用「地铁XX站」/「XX站（轨道交通）」，见 3.8 |
| 7 | AGENTS.md 6.1.1 描述是否修正 | 待定。该段称文旅标通过 `MutationObserver` 注入，实际走 `header` 槽位 + `order` 排序渲染；文件里那个 observer 管的是侧栏标题与线路徽标同步 |
| 8 | 是否纳入青岛/合肥 | 待定。本轮仅三城；青岛的 `items` 标签流与直达列车、合肥的 `first/last × weekday/weekend` 更接近归一化，将来接入成本低 |
| 9 | 是否升级 `core/cgo-ui.js` 以取得上游新图标 | **已完成**（2026-09-23）：merge 上游 `75c61d8`，图标库由 125 升至运行时 200 个，`tram`/`railway`/`toilet`/`aed`/`baby`/`speaker` 等设施类图标与 42 座城市标志均已可用。同时按上游新规范将 8 城 `svglogo` 置为 `null`、`index.html` 改走 `<cgo-icon name="{city_id}">` 渲染（悉尼未收录，保留自定义 SVG）。新图标本轮未接入具体模块，留待按需启用 |
