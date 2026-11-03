# 青岛项目技术文档 04：车站信息卡与 StationBoard 模块系统

> 本文说明从点击地图车站到完整信息面板生成的调用链，区分通用 `StationBoard` 框架、青岛注册模块、青岛微缩地图卡片，以及不属于信息板的地图专题层。
>
> 修改信息卡内容时，应先确定目标属于哪个模块和槽位，再追踪其数据源；不要把所有“卡片”都当成同一种组件。

## 1. 先区分三种容易混淆的东西

| 名称 | 主要文件 | 实际职责 |
|---|---|---|
| 车站信息面板 / StationBoard | `core/station-board.js`、`core/script.js` | 车站点击后出现的完整面板，包含标题、线路页签、车站信息、底部操作 |
| 青岛 StaCard 微缩地图 | `city/qingdao/stacard/script.js` | 信息面板中的高德周边地图小窗，显示车站地理位置，可缩放 |
| 地图专题图层 | `qingdao_construction_progress_map.js`、`qingdao_interval_times.js` | 叠加在主地图上的建设进度或区间用时，不属于 StationBoard 信息面板 |

“车站卡片”“区间卡片”等叫法在业务讨论中可能泛指不同 UI。定位问题时先确认是整个信息面板、面板内部的微缩地图，还是主地图上的专题弹窗。

## 2. 完整调用链：从车站选择到面板显示

```text
用户点击车站 / 搜索结果 / 换乘跳转
  └─ Core 选择目标车站
      └─ renderUserModePanel(station, initialTabIndex)
          ├─ 根据 linesData + processedStations 计算 relatedLinesInfo
          ├─ 计算车站类型、换乘类型、同台换乘等上下文
          ├─ 生成 context 与 helpers
          └─ StationBoard.render(infoPanel, context)
              ├─ resolveCityConfig(city.stationBoard)
              ├─ 按 slot / shouldRender / order 选取模块
              ├─ 生成 header、tabs、tab panes、body-top、footer HTML
              ├─ 写入 infoPanel.innerHTML
              ├─ bindEvents()
              ├─ 执行模块 onMounted()
              └─ 调用 renderStationCardsInPanel()
                  └─ QingdaoCity.renderStaCards()
                      └─ QingdaoStaCard.renderPanelCards()
                          └─ renderCard()：绘制微缩地图瓦片
```

### 2.1 启动阶段先初始化 StaCard

`core/script.js` 的 `init()` 一开始会执行并等待 `initStaCardSystem()`，之后才初始化地理系统、处理数据和绘制地图。

`initStaCardSystem()` 调用当前城市的 `initStaCard()`。青岛实现位于 `qingdao.js`：

- `stacard.geoDataUrl` 指向 `./city/qingdao/amap_data.json`。
- `stacard.basePath` 指向 `./city/qingdao/stacard/`。
- `getRenderer()` 取得 `window.QingdaoStaCard`（兼容 `window.StaCard`）。
- `initStaCard()` 调用渲染器的 `init()` 并等待地理数据加载。

微缩地图脚本由 `main.html` 以 `type="module"` 动态加载，早于 Core 地图引擎模块执行。它在模块内部定义 `QingdaoStaCard`，并将实例挂到 `window`。

### 2.2 `renderUserModePanel()` 组装上下文

核心入口在 `core/script.js`。在调用 StationBoard 前，Core 已经根据当前车站与线路数据计算好大部分业务上下文。

主要字段：

| context 字段 | 含义 |
|---|---|
| `station` | 当前选中的运行时车站对象，含 ID、站名、坐标、站型、线路关联等 |
| `initialTabIndex` | 面板初始激活的页签索引 |
| `city` | 当前城市配置对象，即青岛 `QingdaoCity` |
| `relatedLinesInfo` | 当前车站关联的线路信息数组，含线路徽标、线路色、上一站/下一站、运营单位、时刻表 URL 等 |
| `displayLines` | 实际生成线路页签的线路列表；通常排除纯点位线路，国铁 `Rwy` 有例外 |
| `companyList` | 关联线路的运营单位集合 |
| `isMergeStation` | 是否属于城市配置的合并车站 |
| `isSuburbanStation` | 是否关联市郊线路 |
| `isRwyStation` | 是否关联国铁 `Rwy` / `Rwy2` |
| `isNoStation` | `station.type === 'no'` |
| `isTsfMode` | 普通换乘站模式 |
| `isCrossPlatformDisplay` | 是否属于配置中的同台换乘站展示模式 |
| `CROSS_PLATFORM_STATIONS`、`MERGE_STATIONS` | 城市级换乘/合并站配置 |

`relatedLinesInfo` 并非直接来自某一个独立数据文件，而是 Core 遍历 `linesData` 后按 `stationIds`、分支站序和车站 ID 派生。普通线路、分支线路、环线、纯点位线路的上一站/下一站处理方式不同。

线路相邻信息的距离优先使用 `data_lines.js` 中显式的 `distances` / `distances2` / 分支距离字段；没有有效距离时，Core 可能调用地理坐标估算。青岛 `handleLineMerge()` 还会在排序前对合并线路信息进行城市专属清理。

### 2.3 `helpers` 是模块与 Core 的交互接口

Core 传入的 `context.helpers` 包含：

- `findScheduleUrl`
- `getInfoStr`
- `generateTransferHtml`
- `updateStationSectionTitle`
- `handleShare`、`updateShareMeta`
- `resetMapState`
- `toggleMobilePanelSize`、`updateExpandIcon`
- `renderStationCardsInPanel`
- `selectStation`
- `injectInlineSvgs`
- `initPanelDrag`、`initMobileSheetDrag`
- `adjustPanelPosition`

青岛模块需要调用 Core 已有能力时，优先使用 `context.helpers`，不要自己再实现一套关闭面板、站点跳转、SVG 内联或拖动逻辑。

## 3. 通用 StationBoard 框架

文件：`core/station-board.js`。

### 3.1 模块注册表

`window.StationBoard` 是一个 IIFE 导出的全局对象，主要成员：

| 成员 | 作用 |
|---|---|
| `modules: Map` | 已注册模块，按规范化 ID 存储 |
| `customTabs: Map` | 自定义页签注册表 |
| `registerModule(moduleDef)` | 注册/覆盖模块 |
| `getModule(id)` | 按规范化 ID 取得模块 |
| `getAllModules()` | 取得去重后的模块列表 |
| `registerTab(tabDef)` | 注册自定义页签 |
| `resolveCityConfig(city)` | 解析城市 `stationBoard` 配置 |
| `getActiveModulesForSlot(config, slot)` | 按启用状态、槽位和顺序筛选模块 |
| `render(infoPanel, context)` | 组装并写入完整信息面板 |
| `bindEvents(infoPanel, context, displayLines)` | 绑定页签、分享、关闭、换乘跳转等通用事件 |

`registerModule()` 至少需要 `id`。可选字段包括 `name`、`slot` / `targetTab`、`order`、`enabled`、`shouldRender(context)`、`render(context)`、`onMounted(container, context)`。

默认规则：

- 未提供 `slot` / `targetTab` 时，默认进入 `line-tab`。
- 未提供 `order` 时，默认顺序为 `100`。
- 未明确禁用时，模块默认启用。
- `shouldRender()` 默认返回 `true`。
- `render()` 默认返回空字符串。
- 同 ID 再次注册会覆盖注册表中原模块定义。

### 3.2 模块 ID 别名

Core 对部分常用 ID 提供别名，例如：

| 别名 | 标准 ID |
|---|---|
| `minimap`、`station-minimap` | `stacard` |
| `prev-next`、`stops`、`next-prev` | `adjacent-stations` |
| `transfer`、`transfer-lines` | `transfers` |
| `operator`、`operating-companies`、`operators-list` | `operators` |
| `station-name`、`title` | `header-title` |
| `line-badges`、`badges` | `header-badges` |
| `controls`、`close-expand` | `header-controls` |
| `share` | `share-button` |
| `footer`、`action-buttons`、`nav-buttons` | `footer-actions` |

城市配置的模块键名应优先使用标准 ID，避免不必要的别名依赖。

### 3.3 城市配置解析与优先级

`resolveCityConfig(city)` 读取 `city.stationBoard`；若不存在则兼容 `city.stationPanel`。

支持两种 `modules` 形式：

- 数组：字符串表示启用模块；对象可以提供 `id`、`enabled`、`order` 等覆盖，也可内联注册 `render`。
- 对象：键为模块 ID，值可以是布尔值或配置对象。

对每个模块，城市覆盖配置优先于模块注册时的默认值。`getActiveModulesForSlot()` 按有效 `targetTab` / `slot` 过滤，再按有效 `order` 从小到大排序。

当前青岛使用对象形式的 `stationBoard.modules`，没有声明自定义 `tabs`；因此默认页签由关联线路动态生成，最后附加“车站信息”页签。

### 3.4 可用槽位

| 槽位 | 插入位置 | 典型内容 |
|---|---|---|
| `header` | 面板标题栏 | 关闭按钮、中英文站名、线路徽标 |
| `tabs-nav` | 页签导航区域附加内容 | 分享按钮 |
| `body-top` | 面板正文、页签内容之前 | 同台换乘置顶微缩地图 |
| `line-tab` | 每条线路自己的页签内容 | 微缩地图、相邻站、换乘、时刻、建设进度 |
| `station-info` | “车站信息”页签 | 站型、出行指引、站名沿革、运营单位 |
| `footer` | 面板底部 | 官网时刻表、高德导航、铁路查询等按钮 |

不要把 `slot` 和 `targetTab` 理解成完全不同的两个系统：当前框架把它们作为兼容字段，匹配时使用有效 `targetTab || slot`。

## 4. StationBoard 的实际渲染生命周期

`StationBoard.render()` 的执行顺序：

1. 读取 `context.city` 并解析城市模块覆盖。
2. 取得当前车站、初始页签、关联线路和显示线路。
3. 渲染 `header` 槽位模块。
4. 为每条 `displayLines` 创建一个线路页签，并渲染 `line-tab` 模块。
5. 渲染城市自定义页签（青岛当前没有声明）。
6. 创建“车站信息”页签并渲染 `station-info` 模块。
7. 渲染 `tabs-nav` 附加模块。
8. 渲染 `body-top` 模块。
9. 渲染 `footer` 模块。
10. 将拼装好的 HTML 一次性写入 `infoPanel.innerHTML`。
11. 调用 `bindEvents()`。
12. 执行本次参与渲染模块的 `onMounted()`。
13. 调用 Core 提供的 `renderStationCardsInPanel()`，异步填充微缩地图。
14. 如有非默认初始页签，通过点击对应页签恢复初始状态。

模块的 `render()` 返回 HTML 字符串；`onMounted()` 适合在 DOM 已写入后绑定专属交互、启动计时器或初始化依赖 DOM 的控件。若只需要生成静态内容，不需要添加 `onMounted()`。

通用事件由 `bindEvents()` 统一处理：

- 页签点击与激活状态。
- `CGoA11y.enhanceTabs()` 的键盘/语义增强。
- 分享按钮和分享元数据。
- 关闭按钮。
- 移动端抽屉拖动。
- `.transfer-link` 的换乘车站跳转。
- 内联 SVG 注入和面板拖动。

模块自身不应重复绑定这些通用事件。

### 4.1 Core 兜底渲染

`core/script.js` 在 `renderUserModePanel()` 中优先调用 `window.StationBoard.render()`，然后立即 `return`。只有 StationBoard 未加载时，才进入旧的内联面板 HTML 兜底流程。

正常青岛运行中应使用模块化路径。若页面退回旧结构，应先排查 `core/station-board.js` 是否加载成功、`window.StationBoard` 是否存在，而不是同时维护两套面板模板。

## 5. 青岛当前模块配置与显示顺序

青岛配置位于 `city/qingdao/qingdao.js` 的 `QingdaoCity.stationBoard`。

### 5.1 当前有效模块清单

| 槽位 | 顺序 | 模块 ID | 来源 | 内容 |
|---|---:|---|---|---|
| `header` | 10 | `header-controls` | Core 内置 | 关闭按钮、移动端把手 |
| `header` | 20 | `header-title` | 青岛覆盖 | 中英文标题及青岛换行规则 |
| `header` | 30 | `header-badges` | Core 内置 | 经停线路徽标占位 |
| `tabs-nav` | 99 | `share-button` | Core 内置 | 分享按钮 |
| `body-top` | 10 | `hoisted-stacard` | Core 内置 | 同台换乘时置顶的微缩地图 |
| `line-tab` | 10 | `stacard` | Core 内置 + 青岛 renderer | 线路页签中的微缩地图 |
| `line-tab` | 20 | `adjacent-stations` | 青岛覆盖 | 上一站/下一站信息与距离排版 |
| `line-tab` | 21 | `qingdao-engineering-name-notice` | 青岛模块 | 工程暂用站名提示 |
| `line-tab` | 22 | `qingdao-line-timetable` | 青岛模块 | 首末班车及快速列车时刻 |
| `line-tab` | 24 | `qingdao-construction-progress` | 青岛模块 | 本站及相邻区间建设进度 |
| `line-tab` | 30 | `transfers` | Core 内置 | 虚拟换乘、接驳线路 |
| `station-info` | 10 | `station-type` | Core 内置 | 车站类型 |
| `station-info` | 14 | `qingdao-travel-guide` | 青岛模块 | 出行指引 |
| `station-info` | 15 | `qingdao-station-name-history` | 青岛模块 | 站名沿革、历史译名 |
| `station-info` | 20 | `operators` | 青岛覆盖 | 运营单位及换乘站运营中心覆盖 |
| `footer` | 10 | `footer-actions` | Core 内置 | 官网、高德、12306 等操作 |

### 5.2 青岛覆盖的三个内置模块

`qingdao.js` 在 `stationBoard.modules` 中直接覆盖三个 Core 模块：

- **`header-title`**：保留地图/信息卡的原始站名显示规则；把 `<br>` 与换行符转换为信息卡适用的格式；更新分享标题时另行清理为纯文本。
- **`adjacent-stations`**：调整上一站/下一站名称中的 `<br>` 和换行处理；中文相邻名称不额外插空格，英文相邻名称保留单词间空格；继续沿用 Core 计算出的 `prev`、`next`。
- **`operators`**：对指定换乘站按车站 ID 显示运营中心；未命中覆盖时使用各线路 `company`。

这三项属于青岛对通用模块的实现覆盖，不是新增的重复模块。修改时应先确认目标是改青岛规则还是改变所有城市的默认行为。

## 6. 青岛专属信息板模块

### 6.1 微缩地图：`stacard/script.js`

**数据来源：** `amap_data.json`。

主要对象：`QingdaoStaCard`，同时挂载到 `window.QingdaoStaCard`、`window.QINGDAO_STACARD` 和兼容名 `window.StaCard`。

关键方法：

| 方法 | 作用 |
|---|---|
| `init(options)` | 初始化并缓存加载 Promise，避免重复读取 |
| `loadData(options)` | 读取 `amap_data.json`，建立名称和 ID 索引 |
| `parseCoordinates(value)` | 解析 `lng,lat` 字符串 |
| `getStation(stationId, stationInfo)` | 根据全局地理索引、ID 或名称取得坐标 |
| `getStationCoords(station)` | 统一取得经纬度 |
| `hasCard(stationId, lineId, stationInfo)` | 判断是否具备微缩地图数据 |
| `getCardPlaceholderHtml()` | 生成待填充的 `.stacard-container` 占位 HTML |
| `renderCard(container, context)` | 绘制瓦片、站点标记及缩放控件 |
| `renderPanelCards(panel, stationInfo)` | 找到面板内所有占位容器并渲染 |
| `destroyResizeObserver(container)` | 清理旧容器的尺寸观察器 |

地图采用 Web Mercator 瓦片坐标，初始缩放级别 15，允许 12–18 级。瓦片来自高德公开瓦片 URL；容器尺寸变化由 `ResizeObserver` 触发重绘。卡片支持按钮缩放、滚轮缩放和双击放大。

**坐标查询优先级需要特别注意：**`getStation()` 首先尝试 `window.STATION_GEO_MAP[stationName]`，再使用自身 `stationsData` 中的 ID 键和名称键。`amap_data.json` 内部同时保存 ID 和名称索引，但如果名称先命中全局名称表，可能不会继续使用 ID 记录。工程暂用名造成的同名记录详见 `03-data-model.md` 第 6.3 节。

### 6.2 站名沿革：`qingdao_station_name_history.js`

**数据来源：** `data_station_names.js` 导出的三个全局对象：

- `QINGDAO_STATION_NAME_HISTORY`
- `QINGDAO_STATION_HISTORICAL_TRANSLATIONS`
- `QINGDAO_STATION_HISTORICAL_TRANSLATION_META`

模块 ID：`qingdao-station-name-history`；槽位：`station-info`；顺序：15。

主要逻辑：

- `shouldRender()` 根据车站 ID 检查是否有沿革 `rows` 或历史译名。
- `render()` 输出站名调整、更名、历史译名及备注。
- `renderHistoricalTranslation()` 根据独立元数据处理上标和局部换行。
- 文本通过 `escapeHtml()` 转义；仅允许模块明确生成的 `<br>` / `<sup>` 作为排版结构。

注意：当前 `shouldRender()` 的判断依据是 `rows` 或历史译名；如果某条数据只有 `note` 而没有 `rows` / 历史译名，模块不会进入渲染阶段。

### 6.3 出行指引：`qingdao_travel_guide.js`

模块 ID：`qingdao-travel-guide`；槽位：`station-info`；顺序：14。

数据主要维护在模块内的 `QINGDAO_TRAVEL_TIPS`，以车站 ID 为键；同时兼容车站对象的 `station.travelTip`，后者优先。

模块在 `DOMContentLoaded` 时注册；若当时 `StationBoard` 尚未就绪，会短暂重试。它会检查本站是否有站名沿革，并据此调整指引卡片与沿革模块之间的分隔样式。

新增或修改某站出行指引，先改这个模块中的 ID 映射；不要为了出行指引去改车站中文名或线路站序。

### 6.4 工程暂用站名提示：`qingdao_engineering_name_notice.js`

模块 ID：`qingdao-engineering-name-notice`；槽位：`line-tab`；顺序：21。

显示条件同时满足：

- `station.type === "no"`；
- `station.en` 中存在英文字母，且英文字母全部大写。

因此该模块不是按某个固定车站 ID 列表工作，而是用未开通站型和全大写拼音识别工程暂用站名。若修改工程站的英文名大小写或站型，需要考虑提示是否随之消失。

### 6.5 首末班车：`qingdao_timetable.js`

**数据来源：** `data_timetable.js` 的 `GLOBAL_SCHEDULE_DATA`。

关联键：线路 ID → 车站 ID。模块 ID：`qingdao-line-timetable`；槽位：`line-tab`；顺序：22。

关键逻辑：

- `getEntry(lineId, stationId)` 读取当前线路、当前车站的时刻条目。
- `resolveQingdaoTimetableVersions()` 与 `applyQingdaoTimetableVersions()` 在有效调图日期变化后刷新运行图版本。
- `parseRegular()` 从 `首车-往...`、`末车-往...` 标签中整理方向、首车和末车。
- `parseFast()` 解析 `快速列车-方向-第N班`，并按班次编号排序。
- `getAdaptiveColumns()` 根据终点站名称和末班车内容计算表格列宽。
- `shouldRender()` 仅在条目存在且 `items` 非空时显示模块。

`data_timetable.js` 同时保存 `url`、来源说明和 `items`。某些站点条目可能只有官网 `url`、没有时刻 `items`：这种条目不会显示时刻模块，但 Core 仍可利用 URL 显示底部“官网查询”按钮。

新增调图数据时，应按该文件既有的版本结构追加生效时间和替换项；不要只改模块渲染代码。运行图版本状态保存在 `window.QINGDAO_TIMETABLE_STATE`，展示模块最终仍读取 `GLOBAL_SCHEDULE_DATA`。

### 6.6 建设进度信息卡：`qingdao_construction.js`

**数据来源：** `data_construction.js` 的 `QINGDAO_CONSTRUCTION_DATA`。

模块同时承担两项职责：

1. 建立统一 API：`window.QingdaoConstructionProgress`。
2. 注册 `qingdao-construction-progress` 信息板模块，槽位 `line-tab`，顺序 24。

API：

| 方法 | 返回内容 |
|---|---|
| `getLine(lineId)` | 指定线路的完整施工数据 |
| `getStation(lineId, stationId)` | 指定线路、指定车站的施工状态 |
| `getSegment(lineId, a, b)` | 指定相邻区间的数据，兼容 `a-b` / `b-a` 键顺序 |
| `getSegmentDetails(lineId, a, b)` | 将区间 `parts` 或 `details` 展平为统一明细数组 |
| `classifyStatus(status, date)` | 将状态归类为未开始、建设中或已完成 |
| `statusColor(status, date)` | 返回对应状态颜色 |
| `renderSegmentProgressCard(segment)` | 输出专题地图区间弹窗可复用的进度卡 HTML |

信息板模块根据当前线路和车站 ID 取得本站、上一站区间、下一站区间的数据，按统一状态规则渲染。

`qingdao_construction_progress_map.js` 也读取 `window.QingdaoConstructionProgress`，因此信息卡和建设进度专题地图共享数据及状态语义。修改施工状态解释、区间结构或展示状态颜色时，优先改统一 API，再核对两个消费者。

## 7. 与信息面板有关、但不属于 StationBoard 的模块

### 7.1 线路徽标：`qingdao_line_badges.js`

它**不调用 `StationBoard.registerModule()`**，而是一个全局 DOM 后处理模块：

- 读取 `linesData`，按徽标 `data-src` 识别线路。
- 把数字线路徽标替换为青岛自制方形数字徽标。
- 多条连续数字线路合并为一个徽标组；蓝谷快线、西海岸快线等品牌线路保留原 SVG，并作为分组边界。
- 通过 `MutationObserver` 观察 `document.body`，在信息卡、线路选择器、换乘区域、搜索结果和线路 tooltip 出现新徽标后安排同步。
- 等同一容器中的 SVG 完成内联后再分组，避免异步加载过程中只合并部分线路。
- 另创建 `#qingdao-map-line-badges-layer`，读取 `QINGDAO_MAP_LINE_BADGE_CONFIG`，按线路折点在地图端点绘制线路号。

因此，信息卡中线路号显示不正确时，应检查原始徽标是否生成、SVG 是否内联完成、MutationObserver 是否运行以及线路匹配；不应把它误认为 StationBoard 的 `header-badges` 模块本身负责绘制数字徽标。

### 7.2 区间用时专题：`qingdao_interval_times.js`

这是主地图上的独立 SVG 专题层，不属于信息板模块。它读取：

- `QINGDAO_INTERVAL_TIME_DATA`（`data_interval_times.js`）；
- `linesData`、`processedStations`；
- 已绘制的线路 SVG Path。

首次开启时才构建图层。它沿实际 SVG Path 寻找相邻车站在路径上的位置，再取弧长中点放置分钟数标记。只对指定运营线路显示，并跳过端点尚未开通的区间。开启时会关闭建设进度专题，两个专题互斥。

### 7.3 建设进度专题地图：`qingdao_construction_progress_map.js`

它同样不是 StationBoard 模块，而是主地图专题图层，负责：

- 在缩放控件旁添加建设进度按钮。
- 绘制专题线路、车站、站名、线路徽标及最新进度标记。
- 处理区间交互热区和区间弹窗。
- 通过 `QingdaoConstructionProgress` 读取统一施工数据和状态。
- 开启时隐藏/保护普通地图部分图层，关闭时恢复。

地图专题本身的坐标变换、键盘交互、弹窗和响应式细节属于建设进度专题文档（05）的范围；这里仅记录它与信息卡共用 API 的关系。

## 8. 青岛模块脚本加载：容易误判的地方

青岛 `qingdao.js` 的 `stationBoard` 配置中存在 `scripts` 数组，但当前青岛运行链中，Core 的 `resolveCityConfig()` 只读取 `modules` 和 `tabs`，没有读取 `scripts`；青岛 `qingdao.js` 也没有遍历这个数组来加载脚本。

当前青岛专属脚本的实际加载由 `qingdao.js` 中的显式 `document.write()` 完成，包含站名数据、区间用时数据及其模块、站名沿革、出行指引、施工数据、建设进度专题、工程站名提示、时刻、建设进度信息卡和线路徽标等。

另外，`main.html` 会单独按城市目录加载 `stacard/script.js` 作为 ES module，再加载基础车站/线路数据。不要因为文件路径写在 `stationBoard.scripts` 数组中，就认定它必然会自动加载。

**新增青岛 StationBoard 模块时，至少核对三处：**

1. 模块文件是否在实际脚本加载链中被加载（当前青岛应检查 `qingdao.js` 的 `document.write()`）。
2. 模块是否成功调用 `StationBoard.registerModule()`，注册 ID 是否与配置键一致。
3. `stationBoard.modules` 是否启用该 ID，并设置正确的 `targetTab` / `slot` 和 `order`。

若只加载不注册，框架不会渲染；若注册但 `shouldRender()` 为 false，模块不会出现；若目标槽位写错，模块也不会进入预期区域。

## 9. 常见修改任务：从需求定位到文件

| 需求 | 首要文件 | 联查位置 |
|---|---|---|
| 修改信息卡中英文站名排版 | `qingdao.js` 的 `header-title` | `data_stations.js`、Core `header-title` |
| 增加站名沿革 | `data_station_names.js` | `qingdao_station_name_history.js`、`stationBoard.modules` |
| 修改出行指引 | `qingdao_travel_guide.js` | `data_stations.js` 的 `travelTip`（若使用） |
| 修改工程暂用名提示条件/文案 | `qingdao_engineering_name_notice.js` | `data_stations.js` 的 `type`、`en` |
| 修改首末班车时刻 | `data_timetable.js` | `qingdao_timetable.js`、Core 底部时刻链接 |
| 修改本站/区间施工进度内容 | `data_construction.js` | `qingdao_construction.js`、建设进度专题图 |
| 修改运营单位 | `data_lines.js` 的 `company` / 线路元数据 | `qingdao.js` 的站级运营中心覆盖 |
| 修改相邻站和距离显示 | `data_lines.js` 的站序/距离 | Core `renderUserModePanel()`、青岛 `adjacent-stations` 覆盖 |
| 修改虚拟换乘提示 | `data_virtual_transfers.js` | Core `generateTransferHtml()`、线路徽标模块 |
| 修改微缩地图坐标 | `amap_data.json` | Core `initGeoSystem()`、`stacard/script.js` 查询优先级 |
| 修改微缩地图外观/瓦片/缩放 | `stacard/script.js` | `city/qingdao/style.css` |
| 修改信息板整体尺寸、抽屉和布局 | `css/style.css`、`city/qingdao/style.css` | `core/station-board.js` DOM 结构 |
| 修改线路数字徽标 | `qingdao_line_badges.js` | `data_lines.js` 的 SVG/线路信息、`QINGDAO_MAP_LINE_BADGE_CONFIG` |
| 修改地图端点线路号位置 | `data_scattered.js` | `qingdao_line_badges.js`、线路 `pathPoints` |

## 10. 信息板问题的诊断顺序

### 10.1 整个面板没有打开

1. 检查车站点击是否进入 Core 的 `selectStation()` / `renderUserModePanel()`。
2. 检查 `#info-panel` 是否存在。
3. 检查 `window.StationBoard` 是否加载并成功调用 `render()`。
4. 检查 `core/station-board.js` 是否早于 `core/script.js` 加载。
5. 若落入旧版兜底 HTML，重点排查 StationBoard 加载或运行异常。

### 10.2 面板打开，但某个模块缺失

1. 检查模块脚本是否真正加载。
2. 检查模块是否调用 `registerModule()`，以及注册 ID。
3. 检查 `qingdao.js` 的 `stationBoard.modules` 是否启用。
4. 检查模块的 `targetTab` / `slot` 是否与目标区域一致。
5. 检查 `shouldRender(context)` 的数据条件。
6. 检查 `render()` 是否返回非空 HTML。
7. 若依赖 DOM 初始化，检查 `onMounted()` 是否执行及控制台错误。

### 10.3 线路页签内容异常

先检查 `renderUserModePanel()` 派生的 `relatedLinesInfo` 和 `displayLines`，再检查 `line-tab` 各模块。上一站/下一站、首末班车、施工进度都按线路 ID + 车站 ID 工作；同一换乘站的不同线路页签可能显示不同内容。

### 10.4 微缩地图缺失或坐标错误

1. 检查 `amap_data.json` 请求和 JSON 解析。
2. 检查 `QingdaoStaCard.init()` 是否完成。
3. 检查 `hasStaCard()` / `getStationCoords()` 是否能取得坐标。
4. 检查占位容器是否生成、`renderPanelCards()` 是否执行。
5. 对工程暂用名重名车站，检查名称索引优先级与 ID 坐标记录。

## 11. 回归检查清单

修改 StationBoard、信息卡模块或微缩地图后，按改动范围检查：

- [ ] 普通单线路车站：标题、徽标、线路页签、车站信息和底部按钮正常。
- [ ] 普通换乘站：每条线路页签的相邻站、时刻和施工内容对应正确线路。
- [ ] 同台换乘站：微缩地图置顶，不在各线路页签重复出现。
- [ ] 未开通工程站：工程暂用名提示条件和文字正常。
- [ ] 站名沿革：无数据时模块不显示，有历史译名/备注时格式正确。
- [ ] 出行指引：只在配置车站显示，且与站名沿革分隔正常。
- [ ] 微缩地图：瓦片、中心点、缩放按钮、滚轮和尺寸变化正常。
- [ ] 线路徽标：数字线路合并正确，品牌线路保持原徽标。
- [ ] 换乘徽标：点击后跳转目标车站，徽标分组不跨越不同目标站。
- [ ] 移动端：抽屉拖动、展开按钮、页签键盘语义正常。
- [ ] 暗色主题：面板、徽标、微缩地图标记和状态颜色正常。
- [ ] 分享标题：清除排版换行标记，不影响面板原始站名。

## 12. 相关源码入口

| 内容 | 文件 / 关键函数 |
|---|---|
| 信息板注册和渲染框架 | `core/station-board.js`：`registerModule()`、`resolveCityConfig()`、`getActiveModulesForSlot()`、`render()`、`bindEvents()` |
| 面板上下文构建 | `core/script.js`：`renderUserModePanel()` |
| 信息板初始化 | `core/script.js`：`initStaCardSystem()`、`init()` |
| 微缩地图异步填充 | `core/script.js`：`renderStationCardsInPanel()` |
| 青岛信息板配置 | `city/qingdao/qingdao.js`：`stationBoard`、`header-title`、`adjacent-stations`、`operators` |
| 微缩地图 | `city/qingdao/stacard/script.js`：`QingdaoStaCard` |
| 站名沿革 | `data_station_names.js`、`modules/qingdao_station_name_history.js` |
| 出行指引 | `modules/qingdao_travel_guide.js` |
| 工程站名提示 | `modules/qingdao_engineering_name_notice.js` |
| 首末班车 | `data_timetable.js`、`modules/qingdao_timetable.js` |
| 建设进度信息卡与共享 API | `data_construction.js`、`modules/qingdao_construction.js` |
| 线路徽标后处理 | `modules/qingdao_line_badges.js` |
| 区间用时专题 | `data_interval_times.js`、`modules/qingdao_interval_times.js` |
| 建设进度专题 | `modules/qingdao_construction_progress_map.js` |
| 信息面板样式 | `css/style.css`、`city/qingdao/style.css` |
