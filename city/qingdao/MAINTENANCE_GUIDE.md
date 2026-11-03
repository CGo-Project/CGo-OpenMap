# 青岛地图项目技术维护手册

> 本文件是青岛城市模块的长期维护总入口。用于日常开发、故障定位和项目交接，不记录某次对话、补丁或临时版本的处理经过。
>
> 专题文档按功能组织；源代码仍按原有文件结构维护。以实际代码为准，架构变化时同步更新相关文档。

## 青岛项目代码修改权限（必须遵守）

**默认可修改的业务文件范围仅限 `city/qingdao/`。** 根目录以及其他目录原则上只允许因青岛更新而修改必要的**资源版本号**，不得顺带调整其他城市、公共 CSS、Core 业务代码或其配置。

- 遇到青岛问题，先研究青岛数据、配置、样式、模块、事件处理等城市侧方案；不以实现方便为由直接修改 Core。
- **未经用户事先明确批准，不得修改 `core/` 的任何业务逻辑。** 只有城市侧无法实现，或代价、复杂度、维护风险明显不合理时，才可以提出 Core 修改建议；提出建议前应说明必要性、替代方案、改动范围和跨城市影响，获得批准后才能动手。
- 每次青岛功能补丁**必须递增 `sw.js` 的 `CACHE_NAME`**，同时检查 `main.html` 动态资源版本及 `qingdao.js` 青岛资源版本。准备提交 PR 时，主动提醒用户检查根目录相关入口页面是否需要统一版本。除此之外，不动青岛目录以外的文件。

## 文档导航

| 文档 | 覆盖范围 | 适用问题 |
|---|---|---|
| [01 项目架构与启动链](docs/01-architecture.md) | 页面入口、城市注册、资源加载、Core 初始化、青岛模块注册 | 不清楚功能由谁负责、脚本顺序、模块为什么未注册 |
| [02 地图渲染、坐标与视图变换](docs/02-map-rendering.md) | DOM 图层、数据到渲染、地图坐标、平移缩放、边界、海域 | 地图错位、线路定位、海水空白、图层遮挡 |
| [03 数据模型与字段规范](docs/03-data-model.md) | 车站、线路、站序、折点、站名、别名、地理坐标及专题数据关联 | 数据应改哪个字段、不同数据如何关联 |
| [04 车站信息卡与模块系统](docs/04-station-board.md) | StationBoard 插槽、渲染生命周期、微缩地图、青岛模块及专题模块边界 | 车站卡内容、标题、换乘信息、模块加载 |
| [05 建设施工进度系统](docs/05-construction-progress.md) | 施工数据、状态 API、专题图层、区间卡、交互和坐标 | 进度状态、区间交互、专题错位 |
| [06 UI、CSS 与响应式](docs/06-ui-and-styles.md) | 公共样式与青岛样式、桌面/移动断点、面板、主题 | 样式错位、暗色主题、移动端适配 |
| [07 静态资源与缓存](docs/07-assets-and-cache.md) | SVG、字体、资源加载、Service Worker、版本策略 | 图片丢失、缓存不更新、离线资源缺失 |
| [08 文档交叉核查与验证索引](docs/08-docs-cross-check.md) | 源码入口交叉核对、功能边界、验证证据、文档维护 | 检查文档是否过时、跨功能定位与回归检查 |

## 按问题定位

| 问题 | 首要入口 | 必须联查 |
|---|---|---|
| 线路走向、颜色、站序、站间距 | `data_lines.js` | `data_stations.js`、`core/path-geometry.js` |
| 车站坐标、站名、方位、偏移 | `data_stations.js` | `core/script.js` 的 `renderStations()`、青岛 `style.css` |
| 线路列表展开、高亮、跳转 | `core/script.js` 的 `renderPinModeTree()` | `data_lines.js`、地图变换函数 |
| 海岸线和海水自动延伸 | `assets/qingdao_sea.svg`、`style.css` | `data_scattered.js`、`qingdao.js`、地图图层顺序 |
| 地图拖动、缩放、边界 | `core/script.js` | `css/style.css`、城市 `center/mapSize` 配置 |
| 车站信息卡 | `qingdao.js`、对应 `modules/qingdao_*.js` | `core/station-board.js`、`docs/04-station-board.md` |
| 站名沿革和历史搜索 | `data_station_names.js`、`staname.csv` | `modules/qingdao_station_name_history.js` |
| 建设施工进度数据 | `data_construction.js` | `modules/qingdao_construction.js` |
| 建设进度专题地图、两级键盘导航与“新”开关 | `modules/qingdao_construction_progress_map.js` | `data_construction.js`、`style.css`、Core 地图视图 API；详见 05 |
| 区间用时专题 | `data_interval_times.js` | `modules/qingdao_interval_times.js`、`data_lines.js` |
| 首末班车 | `data_timetable.js` | `modules/qingdao_timetable.js` |
| 线路端点徽标 | `data_scattered.js` 中 `QINGDAO_MAP_LINE_BADGE_CONFIG` | `modules/qingdao_line_badges.js`、公共 SVG |
| 交通图标、罗盘 | `data_scattered.js`、`assets/*.svg` | `style.css` |
| 资源缓存与更新 | `main.html`、`sw.js` | `.agents/rules/cache-versioning.md` |

## 阅读与修改原则

1. 先确定问题属于数据、Core、青岛业务模块、样式还是静态资源。
2. 先读数据源和直接消费者，再改代码；不要只按文件名猜测职责。
3. 可以阅读、调用 Core 已有接口，但所有业务改动默认只能放在青岛目录；任何 Core 修改必须先取得用户明确批准。
4. 同一功能跨多个文件时，按专题文档追踪完整调用链。
5. 坐标、动画、交互和样式是不同层次，尽量分开修改和验证。
6. 修改后列出受影响文件，并检查桌面/移动、亮/暗主题及相关专题模式。
7. 新增函数、改变数据字段、加载顺序或模块生命周期时，更新对应专题文档。

## 文档覆盖说明

专题文档会随着精读逐步完善。未标记为已完成的章节，不代表相关源代码已经完成函数级审查。静态代码阅读不能代替浏览器实际测试；对坐标、动画、响应式和主题的结论应明确区分“代码已确认”与“实机已验证”。
