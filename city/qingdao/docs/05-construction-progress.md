# 青岛项目技术文档 05：建设施工进度系统

> 本文是施工进度数据、信息卡、专题地图与区间交互的长期维护说明。函数与交互的核对依据为青岛项目源代码，而不是历史补丁或聊天记录。本文记录静态代码行为；设备交互和视觉效果仍需浏览器验收。

## 1. 职责边界与文件关系

| 文件 | 负责什么 | 不负责什么 |
|---|---|---|
| `data_construction.js` | 逐线路车站、区间施工事实及日期 | 地图几何、主题色、信息卡 DOM |
| `modules/qingdao_construction.js` | 统一数据查询、状态分类、车站信息卡施工模块、区间卡 HTML | 绘制专题 SVG、定位弹窗 |
| `modules/qingdao_construction_progress_map.js` | 专题开关、图层构造、左右线绘制、站名及线路号克隆、最近进度标记、区间热区及弹窗 | 维护原始施工状态 |
| `data_lines.js` | `stationIds` 站序、线路颜色及路径几何 | 施工进度事实 |
| `data_stations.js` | 车站 ID、位置、显示名称与标签排版 | 施工状态 |
| `modules/qingdao_line_badges.js` | 原有线路号徽标及可克隆位置信息 | 专题开关 |
| `style.css` | 专题各层层级、显示过渡、热区焦点、弹窗及移动端布局 | 施工日期与状态判定 |
| `core/script.js` | 正式线路 SVG 和地图视图 API | 青岛施工进度业务语义 |
| `core/station-board.js`、`core/mobile-sheet.js` | 通用信息卡模块及移动抽屉能力 | 专题施工数据 |

数据链：`data_construction.js` → `QingdaoConstructionProgress` →（A）`StationBoard` 施工条目；（B）`QingdaoConstructionProgressMap` 专题 SVG / 区间弹窗。专题还读取 `linesData`、`stationsData` / `processedStations` 和 Core 已绘制的 SVG 路径。

## 2. 原始施工数据结构

根对象是 `window.QINGDAO_CONSTRUCTION_DATA`，以线路 ID 索引，例如 `QDM05`、`QDM06`、`QDM07N`、`QDM07S`、`QDM08B`、`QDM09`、`QDM15`。**该 ID 必须与 `linesData` 的 `line.id` 一致**，不是按线路显示名称关联。

每条线路通常包含 `stations` 和 `segments` 两组：

```js
window.QINGDAO_CONSTRUCTION_DATA = {
  QDM05: {
    stations: {
      M0502: { date: "—", status: "主体结构施工", side: "", sourceName: "北山公园" }
    },
    segments: {
      "M0502-M0503": {
        name: "北福区间", from: "M0502", to: "M0503",
        details: [
          { side: "左线", date: "2024-02", status: "区间贯通" },
          { side: "右线", date: "2023-12-11", status: "区间贯通" }
        ]
      }
    }
  }
};
```

以上是结构示例；维护时以文件中的现有数据为准。字段含义：

- `stations[stationId]`：车站施工条目；`sourceName` 保留数据来源中的工程名称，不是强制替换地图站名的字段。
- `segments["A-B"]`：相邻车站间的施工区间；`from`、`to` 表示施工区间原定向。
- `details[]`：每条左线 / 右线的独立状态及日期。
- `parts[]`：复合区间可分成多个部分，各部分分别具有 `name`、`details`；公共 API 会展开成包含 `partName` 的明细。
- `estimated: true`：推测日期标记，信息卡展示时附加“推测”说明。
- 日期保留原有精度，可按日（`YYYY-MM-DD`）、月（`YYYY-MM`）或缺失值 `—` 记录；不要自行补齐成精确日期。

原始文件说明明确：运营车站通常不录入站体施工状态，但与在建站相邻的边界施工区间要保留。区间名称沿用原始资料的工程简称；站名展示从 `data_stations.js` 取当前站名。

## 3. 统一状态与查询 API

`modules/qingdao_construction.js` 初始化 `window.QingdaoConstructionProgress`。主要方法：

| 方法 | 输入 | 返回及用途 |
|---|---|---|
| `getLine(lineId)` | 线路 ID | 该线路施工数据或 `null` |
| `getStation(lineId, stationId)` | 线路 ID、车站 ID | 施工车站条目或 `null` |
| `getSegment(lineId,a,b)` | 线路 ID、相邻车站 ID | 正反两种键顺序均可查找的区间或 `null` |
| `getSegmentDetails(lineId,a,b)` | 同上 | 展平后的区间明细数组，复合区间附 `partName` |
| `classifyStatus(status,date)` | 状态文本、日期 | `not-started` / `building` / `complete` |
| `statusColor(status,date)` | 同上 | 状态指示颜色 |
| `renderSegmentProgressCard(segment)` | 区间对象 | 供区间弹窗复用的 HTML |

`classifyStatus()` 采用文本优先的正则判定：包含“暂未 / 未开 / 未施工 / 未掘进”等为 `not-started`；“掘进中 / 施工中 / 主体结构施工 / 开挖中 / 建设中”为 `building`；“封顶 / 贯通 / 完成 / 验收 / 已预留”为 `complete`。其他状态按是否存在日期回退判断。**新增新状态名称时，要检查这套规则**；不要让信息卡和专题图分别制定颜色或分类。

颜色 API 用于信息卡状态标识；专题图的完成轨道采用线路颜色、施工中轨道采用线路颜色加白色内线、未开始轨道用灰色，因此不要把所有视觉元素统一理解为 `statusColor()` 直接涂色。

## 4. 车站信息卡的施工模块

`qingdao_construction.js` 调用 `StationBoard.registerModule()` 注册：

- `id: "qingdao-construction-progress"`
- `targetTab: "line-tab"`
- `order: 24`
- `shouldRender(context)`：只有对应线路及车站存在施工条目时显示。
- `render(context)`：使用 `context.lineInfo.stationIds`（必要时回退到 `linesData`），查找前后邻站，依次取上一区间、本站、下一区间并生成行。

内部重要函数：`renderProgressItem()`、`renderStationRow()`、`renderSegmentPart()`、`renderSegmentRow()`、`renderSegmentProgressCard()`。它们负责格式化文本、推测日期、左右线、复合区间和图例。信息卡是否显示受 `shouldRender` 约束；**边界运营站没有站体条目，不等于对应区间缺失**。

要改“信息卡区间显示不全”，先核对 `stationIds` 前后邻接、`getSegment` 正反查找及 `parts`，不要先改专题 SVG。

## 5. 专题地图主调用链

专题入口脚本为 `modules/qingdao_construction_progress_map.js`，使用 IIFE 保存局部状态：`visible`、`built`、`hideTimer`、`overlayStationIds`、`overlayLineIds`、`overlayStationDeltas` 等。对外暴露：

```js
window.QingdaoConstructionProgressMap = {
  show, hide, toggle, rebuild,
  get visible() { /* 当前模式状态 */ }
};
```

启动：`init()` → `installHighlightGuard()`、`installPopupDismissHandlers()`、`installControl()`；当缩放控件尚不存在时有短暂重试。按钮位于 `#modern-zoom-control`，ID 为 `qd-construction-progress-btn`。

显示：`setVisible(true)` → 如果区间用时模式可见则先关闭 → `ensureLayer()` → 首次 `buildLayer()` → `suppressBaseLineHighlight()` → `showLayer()` → 切换 `body.qd-construction-progress-on` 与按钮 `aria-pressed`。

隐藏：`setVisible(false)` → `closeSegmentPopup()` → `hideLayer()`，在渐隐结束后恢复普通标签和普通线路号。`rebuild()` 使图层重建，适合数据或基础地图几何发生变化后的刷新；它不是改写施工数据的接口。

## 6. 专题地图 DOM 图层与位置

专题使用多个相互独立的层：

| ID | 创建函数 | 职责 |
|---|---|---|
| `qd-construction-progress-layer` | `ensureLayer()` | SVG 灰色蒙版、施工轨道、车站、区间点击热区 |
| `qd-construction-label-layer` | `ensureLabelLayer()` | 根据普通站名克隆出的专题站名 |
| `qd-construction-badge-layer` | `ensureBadgeLayer()` | 专题模式需要浮到蒙版上方的线路号 |
| `qd-construction-latest-marker-layer` | `ensureLatestMarkerLayer()` | 最近进度的“新”标记 |
| `qd-construction-legend` | `ensureLegend()` | 专题图例，不与 SVG 内容共享父级 |
| `qd-construction-segment-popup` | `ensureSegmentPopup()` | 区间信息弹窗，桌面/移动端位置策略不同 |

地图相关的四个层挂载在 `#map-content` 上，因此应该跟随 Core 的地图 transform。`style.css` 负责定位和堆叠，普通标签与徽标在专题模式中通过添加专属隐藏类暂时隐藏，随后由专题克隆代替。

**SVG 视口注意：** `ensureLayer()` 的尺寸、`viewBox`、`preserveAspectRatio` 是否明确设置，必须结合当前源码版本与 CSS 共同核查。不要把“键盘可聚焦”与“改 SVG 视口”捆成一个修复：两者分别涉及交互语义和坐标映射。专题蒙版 `buildLayer()` 创建一个从 `(-50000,-50000)` 开始、宽高各 `100000` 地图单位的 SVG 矩形，意在覆盖广域而不影响专题几何的地图坐标。

## 7. 轨道绘制与左右线语义

`buildLayer()` 获取 `getLines()`、`getStations()`、`getProgressApi()`，清空旧绘制层；对具备施工数据的线路调用 `buildLine()`。

`buildLine()` 从已绘制的 `#lines-layer .line-visual-group[data-visual-id="..."] .line-visual-inner` 取得实际 SVG 线路路径，使用 `getTotalLength()` / `getPointAtLength()` 取得施工区间对应路径长度。它按照 `line.stationIds` 的相邻车站对，调用 `api.getSegment(line.id,fromId,toId)` 查施工数据，而不是仅凭区间名称匹配。

左线/右线有单独且非常重要的方向约定：**以每个施工区间原始 `segment.from → segment.to` 为基准，从 A 看向 B，左线在左、右线在右；不以 `line.stationIds` 的上下行方向重新解释。**

- `appendTrack()` 为左右线建立偏移路径，默认偏移量 `TRACK_OFFSET=4.4`，线宽 `TRACK_WIDTH=6`。
- `makeControlledOffsetPathData()` 优先根据线路可控折点形成偏移路径；不能生成时才由 `makeSampledOffsetPathData()` 采样路径兜底。
- `segmentStyle()` 根据统一 API 的状态分类设置完整、施工中、未开始样式。施工中另绘白色内线（宽度 2.8）。
- `appendStation()` 绘制有施工进度的站点；`appendBuiltJunctionStation()` 补画在建区间端部、但本身无施工状态的已建车站。
- `CENTERLINE_STATION_IDS` 为少量站的专题显示坐标做中心线吸附，位移存入 `overlayStationDeltas`，随后让克隆站名同步偏移；不会直接改写 `data_stations.js`。

对错线侧、曲线偏移、区间端点等问题，依次检查 `segment.from/to`、控制折点、长度映射和采样兜底，而不是调换线路车站顺序。

## 8. 区间交互热区与弹窗

`appendSegmentHit()` 沿该区间路径生成一条透明 SVG Path：`stroke-width=18`、`pointer-events=stroke`，类名 `qd-construction-segment-hit`。在同一热区挂载鼠标 `click` 事件和键盘事件：

- 热区具有 `focusable`、`role=button` 与明确 `aria-label`；当前两级键盘导航通过动态焦点控制进入区间，不再依赖所有热区永久设置 `tabindex=0`。
- Enter 在 `keydown` 激活；Space 在 `keydown` 阻止默认页面滚动、在 `keyup` 激活。
- 激活时先关闭普通车站面板，再调用 `focusSegmentOnMap()` 计算锚点，最后调用 `showSegmentPopup()`。
- `focusSegmentOnMap()` 通过 SVG 路径中点和变换矩阵获取屏幕位置；桌面端主要用于定位弹窗锚点，移动端可调用 `getMapView()` / `setMapView()` 重新对准区间。

`ensureSegmentPopup()` 只创建一次弹窗，`installSegmentPopupInteractions()` 实现桌面端拖动，`ensureSegmentPopupMobileSheet()` 对接 `CGoMobileSheet`，`installSegmentPopupBreakpointHandler()` 处理屏幕宽度跨过 640px 的切换。`positionSegmentPopup()` 限制桌面弹窗尽量留在屏幕范围；`installPopupDismissHandlers()` 处理点击外部、点击车站、Escape 关闭。

**交互与外观相互独立：**鼠标点击出现焦点描边，可能是焦点 CSS 的选择器范围问题；Enter/Space 无效，则应先检查 SVG 热区是否收到焦点和按键；触屏无法显示，应检查 pointer 与移动抽屉，而不是修改整个专题层的 SVG 几何。

## 9. 站名、线路号及最近进度标记

站名克隆：`buildConstructionLabels()` 在专题层复制普通站名布局，`setOriginalLabelsHidden()` 控制原版隐藏与恢复。特殊站名微调由 `PROGRESS_LABEL_DIRECTION_OVERRIDES`、`PROGRESS_LABEL_VECTOR_OVERRIDES`、`PROGRESS_LABEL_PRESERVE_SOURCE_LAYOUT` 管理。克隆会失去某些原始 DOM ID，若该站通过 ID 选择器设置了特殊样式，就需要明确保留最终计算后的布局。

线路号克隆：`buildConstructionBadges()` 从 `window.QingdaoLineBadges?.mapPlacements` 读取原定位信息，`setOriginalBadgesHidden()` 负责隐藏原图标。`CONSTRUCTION_BADGE_ENDPOINTS` 控制只提升哪些属于施工段的线路端点徽标；不要把线路号整体搬到蒙版上层。

最近进度：`parseProgressDateRange()` 解析日期粒度；`isRecentProgressDate()`、`segmentHasRecentProgress()` 和 `recentSegmentSides()` 提供“新”的自动显示条件，`buildLatestMarkers()` 负责生成标记。实际显示还受逐项开关 `LATEST_MARKER_VISIBILITY` 控制；人工位置由 `LATEST_MARKER_POSITION_OFFSETS` 保留。`resolveLatestMarkerLabelCollisions()` 的自动避让目前停用，不应重新覆盖已经人工确认的坐标。日期缺失或推测不应随意当成精确日处理。专题层的状态色与“新”标记是两条逻辑链。

### 9.1 “新”星标独立显示与位置管理

- `LATEST_MARKER_VISIBILITY` 按车站或具体区间方向控制星标：`null` 跟随最近一个月施工进度自动显示，`true` 强制显示，`false` 强制隐藏。调整某一个“新”时不得再通过全量测试开关影响全部星标。
- `LATEST_MARKER_POSITION_OFFSETS` 保存经过人工确认的地图单位偏移；车站按站 ID，区间按线路、起止站及对应方向/序号识别。维护时要核对左右线的标识映射，不能将一侧偏移套到另一侧。
- 车站“新”原则上在站名对侧，区间“新”允许左右线各自定位。移动时整体平移星形与内部“新”字，不单独调整文字定位以掩盖整体位置问题。
- 已核定的偏移量以代码配置为准，不在文档重复维护数值表。自动避让目前关闭；以后有新增施工进度，可以逐项设置 `true` 观察并微调，正常完成后恢复适当的自动显示状态。
- 临时位置编辑器不属于正式运行依赖，调整结果应落入上述常规配置；退出编辑阶段时须清理临时脚本及其加载入口。
- 键盘 Tab 聚焦可见“新”时可触发地图自动定位，Enter / Space 复用对应车站或区间信息卡的原有点击处理。鼠标点击不使用键盘专用自动取景流程。

### 9.2 专题键盘导航与自动取景

专题导航不同于普通地图的站点搜索和线路列表：

1. 从进度专题入口进入后，Tab 首先遍历**当前实际显示**的“新”星标；没有可见星标时跳过这一组。
2. 然后按数字由小到大访问施工专题线路：**5、6、7、8、9、15 号线**。线路焦点范围等于该线路在**建设进度模式中实际绘制的线路区段**，不是仅选取状态为“正在建设”的轨道。因此专题范围内已完工区间也属于线路焦点范围，专题以外的既有运营线路不纳入。例如 6 号线只围绕灵山湾至青岛西站的专题部分，不向灵山湾至横云山路的既有运营部分延伸。
3. 在线路入口按 Enter / Space 进入该线路区间；进入后 Tab / Shift + Tab 逐区间浏览，方向键可切换前后区间，Home / End 可定位首末区间；Enter / Space 打开原有区间信息卡，Escape 返回线路入口。
4. 聚焦线路时，地图以该线**专题绘制范围**为取景依据，居中并适当缩放；聚焦区间或“新”时自动移动到对应位置。键盘自动取景通过地图视图变换完成，不应使用浏览器 `scrollIntoView()` 使 SVG 焦点造成地图容器异常滚动。
5. 线路键盘焦点路径使用 `pointer-events: none`，不参与鼠标命中测试；原有区间热区继续负责鼠标点击。焦点样式采用项目主题 `var(--focus-ring)`，应只在键盘焦点需要可见时出现，不因鼠标点击产生多余轮廓。
6. 打开信息卡后应确认 Escape 关闭、焦点返回及继续导航正常；进出专题时必须恢复合理的焦点顺序。**已知边界行为：**最后一条线路的末区间按 Tab 可能先回到 15 号线入口，继续 Tab 才进入后续控件；目前用户接受此行为，不应将其记作完全消除。

以上行为属于青岛专题的键盘增强，不应改变鼠标点击区间、拖动地图、线路样式及普通地图模式。涉及键盘逻辑的变更只在青岛目录实现，不擅自修改 Core。

## 10. 专题和其他模式的互斥及恢复

- 打开建设进度模式会检查 `window.QingdaoIntervalTimes?.visible`，若区间用时模式已开启，则先关闭。
- 专题激活时 `suppressBaseLineHighlight()` 抑制普通线路高亮，`installHighlightGuard()` 避免普通地图点击把高亮重新带入专题状态。
- 专题隐藏需恢复普通站名、原线路号、鼠标交互和信息卡状态。`hideLayer()` 通过定时器与过渡配合；快速连续切换时必须注意定时器取消。
- 进度图层与地图平移缩放共享父级时通常同步移动，但若其 `SVG viewBox` 与 `#map-content` 的实际盒模型不一致，仍可能错位。这是独立于数据正确性的渲染问题。

## 11. 按症状找函数（维护定位矩阵）

| 现象或需求 | 首先查看 | 联查 / 验证 |
|---|---|---|
| 车站/区间状态有误 | `data_construction.js` 对应 ID | `classifyStatus()`、信息卡格式化 |
| 新增状态文字颜色不对 | `statusKind()`、`segmentStyle()` | 状态正则优先级、图例 |
| 车站信息卡漏上/下区间 | StationBoard `render(context)` | `stationIds`、`findSegment()` 正反方向 |
| 区间左右线反了 | `appendTrack()`、`segment.from/to` | 控制折点、偏移方向、`buildLine()` |
| 弯道偏移不自然 | `makeControlledOffsetPathData()` | `makeSampledOffsetPathData()`、路径采样 |
| 区间无法鼠标点击 | `appendSegmentHit()` | pointer-events、CSS、图层覆盖 |
| 区间不能键盘操作 | 专题线路入口及 `appendSegmentHit()` 的键盘处理 | 动态 tabindex、焦点顺序、aria-label、焦点样式 |
| 区间弹窗无法移动 | `installSegmentPopupInteractions()` | 640px 断点、移动抽屉 |
| 专题 SVG 整体错位 | `ensureLayer()`、`buildLayer()` | `style.css` 尺寸、`map-content`、Core transform |
| 站名重复、隐身或错位 | `buildConstructionLabels()` | 原站名样式、`overlayStationDeltas`、隐藏类 |
| 徽标被蒙版遮住 | `buildConstructionBadges()` | `mapPlacements`、`CONSTRUCTION_BADGE_ENDPOINTS` |
| “新”位置或可见性异常 | `LATEST_MARKER_POSITION_OFFSETS`、`LATEST_MARKER_VISIBILITY` | 左右线 key 对应、日期解析、当前关闭的自动避让 |
| 专题开关残留蒙版 | `setVisible()` / `showLayer()` / `hideLayer()` | 定时器、`.show` 类和 body 模式类 |
| 专题与区间用时互相干扰 | `setVisible()` | `QingdaoIntervalTimes.hide()` 和隐藏还原 |

## 12. 修改后的最小回归清单

- [ ] 施工数据在车站信息卡与专题地图上状态一致；相邻区间按实际站序出现。
- [ ] 左右线与施工区间 `from→to` 约定一致，折角、曲线和端点无明显偏差。
- [ ] 专题开关、连续快速开关、切换区间用时均能完整恢复原地图。
- [ ] 专题站名与线路徽标同原图一致；特殊站名无新增错位。
- [ ] 区间可以用鼠标、键盘 Enter / Space 打开，Esc 能关闭弹窗；“新”打开的车站信息卡也可按 Escape 关闭。
- [ ] Tab 先经过当前可见“新”，随后按 5→6→7→8→9→15 号线顺序；线路内部 Tab / Shift + Tab、方向键、Home / End 可使用。
- [ ] 键盘聚焦“新”、区间、线路时地图取景正确；线路仅框专题绘制区段；鼠标不触发整线选中或键盘专属自动取景。
- [ ] 桌面端弹窗能拖动；移动端抽屉及640px附近断点切换正常。
- [ ] 地图拖动、缩放、线路列表定位后专题层与车站坐标仍对齐。
- [ ] 大屏及小屏、亮色及暗色下，蒙版、线条、图例、最近进度标记层级正确。
- [ ] 减少动态效果设置下功能可用；“新”的人工偏移正确，逐项显示开关生效，自动避让保持既定关闭状态。

## 13. 验证程度与维护方式

本文已静态核对数据结构、统一 API、图层构造、交互入口和模块调用关系。未对所有施工区间逐条做 SVG 像素验收，也未进行浏览器跨尺寸和触屏实测。修改时应以源代码当前状态和实机表现为最终依据，不得把静态推断当作功能已验证。
