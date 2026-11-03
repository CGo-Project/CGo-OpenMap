# 青岛项目技术文档 01：项目架构与启动链

> 本文说明青岛城市模块如何接入 CGo OpenMap、页面如何加载城市配置与数据，以及 Core 和青岛扩展模块之间的职责边界。按长期维护需要组织；代码结构变化时应同步更新。

## 1. 系统分层

青岛项目不是独立运行的地图程序，而是 CGo OpenMap 多城市应用中的一个城市实现。维护时先判断问题属于哪一层。

| 层级 | 主要文件 | 职责 |
|---|---|---|
| 页面与 DOM 外壳 | `main.html` | 地图容器、线路图层、信息卡、检索面板、控件及脚本加载入口 |
| 全局样式与布局 | `css/style.css`、`css/cgo_*.css` | 地图基础布局、公共图层层级、通用 UI |
| 城市注册与元数据 | `city/data.js` | 城市 ID、目录、中心点、画布尺寸、主题色等注册信息 |
| 通用地图引擎 | `core/script.js` | 数据处理、线路和车站绘制、地图平移缩放、搜索、线路列表、信息卡调用 |
| 通用能力模块 | `core/path-geometry.js`、`core/station-board.js`、`core/station-icons.js`、`core/a11y.js` 等 | 几何、信息卡、图元、无障碍等可复用能力 |
| 青岛城市配置 | `city/qingdao/qingdao.js` | 注册青岛运行配置、加载青岛 CSS 和模块、定义城市专属钩子 |
| 青岛基础数据 | `city/qingdao/data_*.js` | 车站、线路、散点、图例、施工、时刻、区间用时等数据 |
| 青岛业务模块 | `city/qingdao/modules/` | 将青岛数据转化为信息卡内容、专题图层和交互 |
| 青岛静态资源 | `city/qingdao/assets/`、项目公共 `assets/` | 海岸线、交通图标、线路徽标等 SVG 和图片 |

**边界原则：**通用交互和通用渲染优先由 Core 提供；青岛特有的数据、视觉规则和专题交互放在 `city/qingdao/`。只有确认问题属于所有城市都需要的通用能力时，才考虑改 Core。

## 2. 页面启动顺序

### 2.1 `main.html` 提供基础 DOM

地图核心 DOM：

```text
#map-container
└── #map-content
    ├── #scattered-layer
    ├── #lines-layer
    ├── #not-open-layer
    ├── #highlight-layer
    ├── #stations-layer
    └── #labels-layer
```

页面还预先提供 `#info-panel`、`#legend-overlay`、缩放控件、搜索入口和无障碍播报区域。Core 通过固定 ID 获取节点并填充内容。

### 2.2 公共依赖先于 Core

`main.html` 按依赖顺序加载公共脚本，关键项包括：

1. `core/path-geometry.js`：线路折线几何算法。
2. `core/mobile-sheet.js`、`core/panel-tab-swipe.js`、`core/station-icons.js`：移动面板、标签滑动和车站图元。
3. `core/a11y.js`：安全转义、纯文本名称、读屏播报和减少动态效果等工具。
4. `city/data.js`：城市注册表及 `CityDataManager`。
5. `core/station-board.js`：通用车站信息板及模块注册 API。

这些脚本必须在依赖它们的城市脚本或 `core/script.js` 之前可用。

### 2.3 选择城市并加载城市脚本

`main.html` 的城市加载脚本通过 `CityDataManager.getCurrentCity()` 取得当前城市元数据，再得到 `folder` 和 `id`。随后：

- 设置 `window.CGO_ASSET_VERSION`，供城市脚本给动态加载资源追加版本参数。
- 写入页面城市标题、语言、品牌主题色和徽标。
- 通过 `document.write()` 同步插入当前城市主配置脚本和基础数据脚本。
- 最后插入 `core/script.js` 模块脚本。

青岛入口为 `city/qingdao/qingdao.js`。

### 2.4 `qingdao.js` 的职责与二级加载

`city/qingdao/qingdao.js` 是青岛城市配置入口，不是所有青岛功能的实现集中地。它主要完成：

- 动态加载 `city/qingdao/style.css`。
- 给 `<html>` 增加 `map-qingdao` 类，供青岛 CSS 限定作用范围。
- 设置青岛海域 SVG 内联化观察器。
- 创建 `QingdaoCity` 配置对象。
- 提供 `renderStationIcon()`、`handleLineMerge()`、导航链接、信息卡渲染等城市钩子。
- 声明 `stationBoard` 模块配置。
- 通过 `document.write()` 加载青岛专属数据和模块脚本。
- 设置 `window.QINGDAO_CITY`、`window.CURRENT_CITY`，并调用 `CityDataManager.registerCity()`。

青岛配置对象中的主要地图字段：

| 字段 | 含义 |
|---|---|
| `center` | 初始地图视图对准的城市地图坐标中心 |
| `defaultScale` | 城市配置声明的默认缩放值；Core 是否消费它，要以 `core/script.js` 实际赋值逻辑为准 |
| `mapSize` | 城市逻辑地图宽高，Core 的边界计算会读取 |
| `LINE_SORT_ORDER` | 线路列表排序 |
| `LINE_SYNC_GROUPS` | 需要同步处理的线路组 |
| `FUTURE_TRANSFER_NONE_OPEN` | 所有相关线路均未开通的未来换乘站视觉配置 |
| `FUTURE_TRANSFER_SINGLE_OPEN` | 仅一条相关线路已开通的未来换乘站视觉配置 |

### 2.5 青岛基础数据与扩展模块

`main.html` 的动态城市加载段负责加载通用地图数据入口：

- `data_stations.js`
- `data_lines.js`
- `data_virtual_transfers.js`
- `data_scattered.js`
- `data_legend.js`
- `data_timetable.js`
- `data_notopen.js`

`qingdao.js` 还通过自己的加载段引入青岛特有的数据和业务模块，例如：

- `data_station_names.js`
- `data_interval_times.js`
- `modules/qingdao_interval_times.js`
- `modules/qingdao_station_name_history.js`
- `modules/qingdao_travel_guide.js`
- `data_construction.js`
- `modules/qingdao_construction_progress_map.js`
- `modules/qingdao_engineering_name_notice.js`
- `modules/qingdao_timetable.js`
- `modules/qingdao_construction.js`
- `modules/qingdao_line_badges.js`

脚本顺序有依赖关系：模块可能读取前面脚本声明的数据，也可能需要 `StationBoard` 已经存在。移动脚本、合并脚本或改为异步加载之前，必须核对依赖和执行时机。

## 3. Core 初始化流程

`core/script.js` 的 `init()` 是地图首次构建的主入口：

```text
init()
  ├─ initStaCardSystem()
  ├─ initGeoSystem()
  ├─ processData()
  ├─ loadStationAliases()
  ├─ renderScatteredObjects()
  ├─ renderLines()
  ├─ renderNotOpenLines()
  ├─ renderVirtualConnectors()
  ├─ renderStations()
  ├─ renderLegend()
  ├─ bindEvents()
  ├─ initInputControls()
  ├─ initTheme()
  ├─ centerMap()
  └─ handleUrlParams()
```

关键时间点：

- `initStaCardSystem()` 先调用当前城市的 `initStaCard()`（若城市实现了该钩子）。
- `processData()` 在绘制前读取 `stationsData`、`linesData`，为运行时车站对象补充线路关联信息。
- 首次渲染创建地图图层；后续拖动和缩放主要改变 `#map-content` 的 CSS transform，不逐帧重建全部 SVG。
- `centerMap()` 使用城市中心点、当前缩放和视口尺寸设置初始视图。
- `handleUrlParams()` 在地图准备后处理快捷车站定位参数。

`init()` 之外，Core 还会在模块顶层应用开通时刻表，再调用 `init()`，使开通状态在 `processData()` 和通知逻辑读取数据前生效。

## 4. 城市配置如何被 Core 使用

`core/script.js` 通过 `getActiveCity()` 取得当前城市配置。它会合并默认配置、`CityDataManager` 注册表数据和运行时城市对象；青岛功能因此可以通过城市配置钩子扩展 Core，而不需要在 Core 中硬编码城市判断。

青岛当前使用的城市钩子包括：

| 钩子/配置 | Core 用途 |
|---|---|
| `renderStationIcon(station)` | `renderStations()` 创建车站图元时优先调用；返回自定义图元后接管该站图标 |
| `handleLineMerge(station, relatedLinesInfo)` | 车站线路信息生成过程中的城市专属清理逻辑 |
| `getNavigationUrl()` | 生成车站外部地图导航地址 |
| `formatOwnerName()`、`formatCompanyString()` | 运营单位信息格式化 |
| `stacard` / `initStaCard()` | 初始化青岛车站专题详情卡 |
| `stationBoard` | 声明青岛信息卡插槽和城市自定义模块 |

并非所有青岛功能都写在 `qingdao.js`。例如施工进度数据在 `data_construction.js`，统一施工状态 API 在 `modules/qingdao_construction.js`，专题地图绘制在 `modules/qingdao_construction_progress_map.js`。

## 5. 信息卡模块注册关系

通用信息卡引擎在 `core/station-board.js`。青岛通过 `qingdao.js` 的 `stationBoard` 配置声明启用模块、目标选项卡及顺序；模块脚本再通过 `window.StationBoard.registerModule()` 注册具体内容。

三层关系：

1. **Core 框架**：提供插槽、选项卡、渲染时机和上下文。
2. **青岛配置**：决定模块是否启用、目标选项卡和排序，并提供少量城市专属渲染器。
3. **青岛模块**：读取对应数据，生成信息卡区块或专题功能。

新增信息卡内容时，先检查项目根目录的 `docs/STATION_MODULE_GUIDE.md` 和 `docs/STACARD_TIMETABLE_UNIFICATION.md`。

## 6. 关键全局接口

Core 将部分能力和状态挂载到 `window`，供城市模块使用：

| 全局接口 | 用途 |
|---|---|
| `window.getActiveCity()` | 当前城市配置 |
| `window.processedStations` | Core 整理后的运行时车站字典 |
| `window.stationsData` | 原始车站数据对象 |
| `window.linesData` | 原始线路数据数组 |
| `window.highlightLine()` / `window.clearHighlights()` | 线路高亮控制 |
| `window.selectStation()` | 打开指定车站信息卡 |
| `window.updateMapTransform()` | 将地图视图状态写入 DOM |
| `window.enforceBoundaries()` | 执行地图边界限制 |
| `window.setMapView()` / `window.getMapView()` | 设置或读取地图视图 |
| `window.mapContainer` / `window.mapContent` | 地图视口及变换容器 DOM |
| `window.currentScale`、`currentX`、`currentY` | 当前地图视图状态访问代理 |

调用前应确认接口存在；不要在青岛模块中复制 Core 内部实现。

## 7. 需求入口判断

| 需求 | 先读哪里 | 再读哪里 |
|---|---|---|
| 增删线路或调整站序 | `data_lines.js` | `data_stations.js`、`core/path-geometry.js` |
| 调整车站坐标或站名布局 | `data_stations.js` | `core/script.js` 的 `renderStations()`、`style.css` |
| 修改地图拖动/缩放/边界 | `core/script.js` | `css/style.css`、青岛专题图层 |
| 修改海岸线或海水填充 | `assets/qingdao_sea.svg` | `data_scattered.js`、`qingdao.js`、`style.css` |
| 修改车站信息卡 | `qingdao.js`、对应 `modules/qingdao_*.js` | `core/station-board.js` |
| 修改建设进度专题 | `data_construction.js`、对应专题模块 | `style.css`、地图视图 API |
| 修改资源加载 | `main.html`、`qingdao.js` | `sw.js`、缓存版本规范 |

## 8. 维护事实

- `main.html` 是页面结构和动态加载入口；青岛脚本根据城市选择结果动态加载。
- `qingdao.js` 同时承担城市配置和二级资源加载职责。新增模块时要核对数据依赖及执行顺序。
- `core/script.js` 是通用引擎。城市专属需求优先使用城市配置、数据和模块扩展点。
- `core/path-geometry.js` 是线路几何算法共享实现；地图引擎和编辑器都使用它。
- `core/station-board.js` 是通用信息卡框架；青岛模块不应复制整套信息卡引擎。
- 资源加载、Service Worker 预缓存与版本号属于独立发布链路，功能代码改动也要遵循缓存规则。
