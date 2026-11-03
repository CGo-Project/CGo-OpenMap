# 青岛项目技术文档 02：地图渲染、坐标与视图变换

> 本文聚焦地图从数据到画面的过程，以及拖动、缩放、线路定位、海域延伸之间的坐标关系。排查地图位置、图层错位或覆盖问题时，优先从本文建立完整链路。

## 1. 地图 DOM 与图层层级

地图视口结构定义在 `main.html`：

```text
#map-container                 视口窗口，负责裁剪超出可视区域的内容
└── #map-content               整张地图内容的统一变换容器
    ├── ::before / ::after     青岛 CSS 绘制的海域越界补绘
    ├── #scattered-layer       海域、罗盘、交通图标等背景散点
    ├── #lines-layer           正式线路 SVG
    ├── #not-open-layer        未开通线路覆盖 SVG
    ├── #highlight-layer       线路高亮 SVG
    ├── #stations-layer        车站图元 HTML 层
    └── #labels-layer          车站中英文站名 HTML 层
```

Core 基础样式位于 `css/style.css`，青岛覆盖样式位于 `city/qingdao/style.css`。主要层级：

| 图层 | Core z-index | 作用 |
|---|---:|---|
| `#scattered-layer` | 5 | 背景装饰和海域 |
| `#lines-layer` | 10 | 正式线路 |
| `#not-open-layer` | 12 | 未开通线路 |
| `#highlight-layer` | 13 | 高亮 |
| `#stations-layer` | 20 | 车站节点 |
| `#labels-layer` | 30 | 中英文站名 |

青岛海域补绘伪元素位于 `#map-content`，设置 `z-index: 0`，处于散点、线路和车站图层之下。专题图层也挂载在 `#map-content`，其 z-index 由青岛 CSS 单独管理。

**图层问题先看 DOM 父级，再看 z-index。** 元素若挂在 `#map-container` 或 `body`，便不再天然跟随 `#map-content` 的地图变换；即使 z-index 数值正确，也可能出现位置或叠放异常。

## 2. 坐标空间

项目至少涉及三种不同坐标：

### 2.1 地图逻辑坐标

地图数据文件使用的平面坐标，例如：

- `data_stations.js`：车站 `x`、`y`。
- `data_lines.js`：`pathPoints` 及分支折点。
- `data_scattered.js`：散点中心 `x`、`y` 和宽高。
- `assets/qingdao_sea.svg`：SVG `viewBox` 内的坐标。

这些值属于同一张地图的逻辑坐标系，不是浏览器屏幕像素。

### 2.2 视口坐标

浏览器中 `#map-container` 的可视区域坐标。鼠标事件 `clientX/clientY`、元素 `getBoundingClientRect()` 返回的矩形等属于视口或屏幕坐标系。

### 2.3 地图变换状态

`core/script.js` 维护三个关键状态：

- `currentX`：地图在视口中的水平平移像素。
- `currentY`：地图在视口中的垂直平移像素。
- `currentScale`：地图缩放比例。

`localUpdateMapTransform()` 将它们写入：

```js
mapContent.style.transform =
    `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
```

`#map-content` 的 `transform-origin` 是 `0 0`。地图逻辑点到视口位置的基本关系：

\[
screenX = currentX + mapX \times currentScale
\]

\[
screenY = currentY + mapY \times currentScale
\]

反向换算：

\[
mapX = \frac{screenX-currentX}{currentScale}
\]

\[
mapY = \frac{screenY-currentY}{currentScale}
\]

修改地图位置或叠加图层时，先判断数据使用的是地图坐标还是屏幕坐标。

## 3. 初始视图与边界

### 3.1 城市配置字段

青岛在 `qingdao.js` 和 `city/data.js` 中声明：

- `center: { x: 1350, y: 1125 }`
- `defaultScale: 1.45`
- `mapSize: { width: 2700, height: 2250 }`

其中 `center` 由 `centerMap()` 读取，`mapSize` 由 `localEnforceBoundaries()` 读取。

### 3.2 初始缩放的代码核查结果

当前 `core/script.js` 顶层将 `currentScale` 初始化为 `1.1`。`centerMap()` 使用当时的 `currentScale`，但当前代码中没有看到它从 `getActiveCity().defaultScale` 赋值。因此，**青岛配置虽然声明 `defaultScale: 1.45`，当前 Core 首次初始化路径并未消费该字段**；初始居中时使用的是 `currentScale` 当前值。

这是配置与消费逻辑不一致的静态代码发现，不在文档更新中擅自改变运行行为。若以后调整默认缩放，应先确认是否同时修复 Core 的城市默认缩放消费逻辑，以及对其他城市的影响。

### 3.3 边界算法

关键函数：

- `getMapTopOffset()`：计算浮动标题栏顶部安全区域。
- `getViewportInsets()`：读取功能模块声明的 `window.CGoViewportInsets`。
- `getViewportCenter()`：计算扣除面板/抽屉遮挡后的可用区域中心。
- `centerMap()`：按城市中心和当前缩放进行初始居中。
- `localEnforceBoundaries()`：按城市 `mapSize`、当前缩放、视口大小、顶部留白和底部遮挡约束 `currentX/currentY`。
- `enforceBoundaries()`：优先调用外部全局边界实现，否则回落到本地算法。

边界算法使用的地图宽高来自城市 `mapSize`，不是直接读取 `#map-content.offsetWidth/offsetHeight`。

### 3.4 画布 CSS 尺寸与城市 mapSize 的差异

当前 `css/style.css` 为 `#map-content` 声明的基础尺寸是 `1850px × 1300px`。青岛城市配置的 `mapSize` 是 `2700 × 2250`。在当前青岛文件中，没有找到把 `#map-content` 实际 CSS 宽高改为青岛 `mapSize` 的运行时代码。

与此同时，青岛海域 SVG 的 `viewBox` 为 `0 0 2700 2250`，地图各图层设置了 `overflow: visible`，线路和车站坐标可以超出默认容器矩形显示。边界计算则明确使用青岛 `mapSize`。

这意味着**地图逻辑范围、Core 边界范围和 `#map-content` CSS 盒模型尺寸并非同一个来源**。不要仅凭 `mapSize` 就断言 DOM 元素的实际宽高相同。若要调整画布尺寸或处理裁切问题，应先检查所有子图层、海域、专题层和边界算法的实际表现，并做浏览器回归测试。

## 4. 地图内容如何从数据生成

`core/script.js` 的 `init()` 在数据准备后按顺序建立主要图层。

### 4.1 `processData()`

输入：`stationsData`、`linesData`。

对 `stationsData` 中每个车站对象进行浅拷贝，建立 `processedStations`，并增加 `id`、`codes`、`lineColors`、`relatedLines`。随后遍历 `linesData`，根据线路 `stationIds` 或分支站序填充车站的线路编号、线路颜色和所属线路 ID。

**当前这段函数主要做数据派生和线路关联，不是把不同 ID 的同名车站合并成一个对象。** 排查车站拓扑时，应结合原始车站 ID、线路站序和虚拟换乘关系，不要把 `processedStations` 当成全网拓扑合并算法。

### 4.2 `renderScatteredObjects()`

读取 `SCATTERED_DATA`，为每项创建 `.scattered-item`：

- `x/y` 设置元素中心锚点。
- `width/height` 设置元素尺寸。
- `zIndex` 设置散点内部顺序。
- `file` 生成 `<img>`。

`.scattered-item` 的基础 CSS 使用 `position:absolute` 和 `translate(-50%, -50%)`，所以数据中的 `x/y` 是图标中心，不是左上角。

青岛海域是一个特殊散点项：中心 `(1350,1125)`，宽高 `2700×2250`，资源为 `assets/qingdao_sea.svg`。

### 4.3 `renderLines()`

正式线路数据来自 `linesData`。Core 调用 `window.CGoPathGeometry.lineSegments(line, processedStations)` 决定线路应绘制哪些折线段，再逐段创建 SVG Path。

每段线路按以下顺序叠加：

1. 外描边：颜色为 `var(--map-bg)`，宽度 7。
2. 实体线：线路颜色，宽度 5.4。
3. 可选纹理：读取线路 `overlayStyle`。
4. 透明交互热区：宽度 15，提供线路悬停提示等交互。

青岛 `style.css` 将线路端帽和连接角设为 butt / miter，以符合青岛地图视觉要求。

`core/path-geometry.js` 是线路段判定和圆角路径的共享真源。`lineSegments()` 的主要判定顺序：

- `isPointOnly`：不画连续线路。
- `hasbranch`：读取主线及各分支的 `pathPoints-*`。
- 普通 `pathPoints`：直接使用线路折点。
- 没有折点时：按 `stationIds` 从车站坐标生成兜底折线。

圆角路径由 `generateRoundedPath()` 生成。不要在青岛模块中另写一套折线分段或倒角算法。

### 4.4 `renderNotOpenLines()` 与 `renderVirtualConnectors()`

- `renderNotOpenLines()` 读取 `NOT_OPEN_LINES`，在 `#not-open-layer` 绘制未开通覆盖线。
- `renderVirtualConnectors()` 读取虚拟换乘/出站连接配置，使用 `processedStations` 的站点坐标生成连接线，追加到 `#lines-layer`。

未开通覆盖、正式线路和虚拟换乘是不同数据入口，修改时不要互相替代。

### 4.5 `renderStations()`

遍历 `processedStations`：

- 在 `#stations-layer` 创建 `.station` 节点，位置取车站 `x/y`。
- 优先调用城市 `renderStationIcon()`；未返回自定义图元时使用 `core/station-icons.js` 公共模板。
- 在 `#labels-layer` 创建 `.label-group`。
- 根据 `align` 的八方向值计算标签锚点，再应用 `offset`。
- `textScale.cn/en` 控制中英文标签的横向缩放。
- `hideLabel` 可阻止标签生成。
- 站名 HTML 通过 `safeNameHtml()` 处理。

车站圆点和站名是两个不同 DOM 元素，分别位于不同图层。只调整站名位置时优先改 `data_stations.js` 的 `align/offset`，不应移动车站本身坐标。

## 5. 地图平移、缩放和动画

### 5.1 统一变换写入

`localUpdateMapTransform()` 将 `currentX/currentY/currentScale` 写到 `#map-content` 的 CSS transform，并调用 `markMapMoving()`。

`markMapMoving()` 在交互期间给地图内容添加 `is-moving`，通过 `will-change: transform` 提升合成层；一段时间后移除，避免常驻合成层导致放大后的文字长期模糊。

### 5.2 地图视图 API

Core 对城市模块开放：

- `getMapView()`：返回 `{ x, y, scale }`。
- `setMapView(view)`：更新视图状态、执行边界约束、写入 transform，并同步缩放控件显示。
- `updateMapTransform()`：把当前状态写入 DOM。
- `enforceBoundaries()`：执行地图边界限制。

青岛专题模块需要调整地图视图时，应优先使用这些接口，而不是自己创建另一套 transform 状态。

### 5.3 输入交互

`initInputControls()` 统一处理鼠标拖动、滚轮或触控板平移/缩放、鼠标位置锚定缩放、移动端双指捏合和单指平移，以及方向键/WASD 平移和快捷键缩放。

缩放到鼠标位置时，先把鼠标视口位置反算为地图逻辑点，再改变缩放，最后重新计算平移量，保证鼠标指向的地图位置尽量保持不动。

### 5.4 线路列表点击定位

线路列表的 `.tree-line-header` 由 Core 的 `renderPinModeTree()` 创建并绑定点击事件。

展开线路时：

1. 清除旧高亮和信息卡显示。
2. 调用 `highlightLine(lineId)` 高亮整条线路。
3. 普通线路取 `stationIds[0]`；分支线路取 `stationIds-way1[0]`。
4. 按当前 `currentScale` 将该站移到地图容器中心附近。
5. 调用 `enforceBoundaries()` 和 `updateMapTransform()`。
6. 通过 `animate-zoom` 执行约 300ms 的平移动画。

它的设计目标是定位到线路首站，不是计算整条线路包围盒后自动适配全线。若要改变这一行为，需作为独立交互需求处理，并评估边界、海域和缩放控件的联动。

## 6. 青岛海域与海岸线

海域由数据、SVG、运行时主题处理和 CSS 补绘共同组成。

### 6.1 散点数据入口

`data_scattered.js` 中的 `qingdao-sea` 项：

- 文件：`./city/qingdao/assets/qingdao_sea.svg`
- 中心：`x=1350`、`y=1125`
- 尺寸：`2700×2250`
- `zIndex=1`

它由 Core 的 `renderScatteredObjects()` 插入 `#scattered-layer`。

### 6.2 海岸线 SVG

`assets/qingdao_sea.svg` 的根 SVG：

- `viewBox="0 0 2700 2250"`
- 宽高属性为 2700×2250。
- 内部路径放在 `<g transform="scale(0.9)">` 中。

路径原始几何使用更大的坐标范围，经过 0.9 缩放后与当前 SVG 视口对应。不要在不核对 `viewBox`、内部 `scale(0.9)`、散点尺寸和地图数据坐标的情况下再整体缩放路径。

### 6.3 内联化与主题色

Core 默认把散点 SVG 作为 `<img>` 插入。青岛 `qingdao.js` 通过 `MutationObserver` 等待海域 `<img>` 出现，然后 fetch SVG 文本、用 `DOMParser` 解析、`document.importNode()` 导入页面、增加 `qingdao-sea-inline` 类并设置 `aria-hidden`，最后用内联 SVG 替换原 `<img>`。

内联化使海域路径可以使用页面 CSS 变量。若 fetch 或解析失败，保留原始 `<img>` 作为回退。

海水颜色由 `style.css` 的 `--qingdao-sea-color` 管理：亮色为浅蓝，暗色为深蓝绿；未显式选择主题时，CSS 可按系统配色提供启动回退。

### 6.4 右侧和下侧自动延伸

海岸线 SVG 的固定画布之外仍需填充海水，以避免大视口或地图移动后露出空白。当前青岛 CSS 在 `#map-content` 上使用两个伪元素：

- `::before`：从地图逻辑坐标 `(2700,450)` 开始，向右下延伸。
- `::after`：从 `(297,2250)` 开始，向右下延伸，避开左下陆地区域。

两个伪元素与 `#map-content` 共用 transform，所以会随地图平移、缩放和线路定位动画同步运动。它们属于地图坐标系，不应通过 `getBoundingClientRect()` 独立计算屏幕坐标。

海域延伸错位时依次检查：伪元素父级、`left/top` 与 SVG 缩放后边界、`#map-content` transform 和 transform-origin、裁剪与叠放顺序、海域 SVG 是否成功内联，以及是否有其他模块重复绘制海水。

## 7. 当前代码中的结构差异

以下是静态阅读发现，记录为维护检查点，不代表已判定为故障：

| 项目 | 代码现状 | 维护含义 |
|---|---|---|
| 青岛 `defaultScale` | 城市配置声明 1.45；Core 当前 `currentScale` 初值为 1.1，`centerMap()` 使用现值，未看到读取 `defaultScale` 的赋值 | 修改初始缩放前先确认是否要补齐配置消费逻辑 |
| 青岛 `mapSize` 与 `#map-content` 尺寸 | `mapSize` 为 2700×2250；公共 CSS 基础 `#map-content` 尺寸为 1850×1300，当前青岛代码未找到实际盒模型尺寸覆盖 | 边界范围和 DOM 盒模型不是同一个数据源；处理画布裁切/背景时必须实测 |
| 线路列表定位 | 高亮整条线路，但地图只定位到第一站 | 不要把“高亮整线”误认为“自动缩放到全线” |
| 海域补绘 | 伪元素位于 `#map-content`，与地图共用变换 | 新增独立海域 DOM 时需确认是否会脱离地图坐标系 |

## 8. 地图类修改的回归清单

每次改动地图坐标、transform、图层或海域时，按相关性执行检查：

- [ ] 初始打开：中心点、缩放、海岸线和线路位置正常。
- [ ] 线路列表：展开线路后首站定位、高亮和动画正常。
- [ ] 线路交互：桌面悬停提示、触屏点击提示正常。
- [ ] 地图拖动：海水、线路、车站、标签和专题图层同步移动。
- [ ] 鼠标滚轮/触控板：平移和缩放锚点正常。
- [ ] 移动端：双指缩放、单指拖动、面板打开后边界正常。
- [ ] 大屏幕：地图右侧和下侧无空白。
- [ ] 暗色/亮色：海域、线路、交通图标和文字主题正常。
- [ ] 建设进度/区间用时专题：专题图层与地图坐标保持一致。
- [ ] 调整窗口宽度：地图和专题层没有出现尺寸或位置跳变。
- [ ] 减少动态效果：过渡关闭后仍能正确落位。

## 9. 相关源码入口

| 内容 | 文件与函数/选择器 |
|---|---|
| 地图 DOM | `main.html`：`#map-container`、`#map-content` 及基础图层 |
| 地图容器尺寸、图层 z-index | `css/style.css`：`#map-container`、`#map-content`、各 layer |
| 当前地图状态 | `core/script.js`：`currentX`、`currentY`、`currentScale` |
| 初始化 | `core/script.js`：`init()`、`centerMap()` |
| 数据派生 | `core/script.js`：`processData()` |
| 正式线路 | `core/script.js`：`renderLines()` |
| 未开通线路 | `core/script.js`：`renderNotOpenLines()` |
| 虚拟连接 | `core/script.js`：`renderVirtualConnectors()` |
| 车站和站名 | `core/script.js`：`renderStations()` |
| 背景散点 | `core/script.js`：`renderScatteredObjects()` |
| 几何算法 | `core/path-geometry.js`：`lineSegments()`、`generateRoundedPath()` |
| 地图定位和边界 | `core/script.js`：`centerMap()`、`setMapView()`、`getMapView()`、`localEnforceBoundaries()` |
| 线路列表定位 | `core/script.js`：`renderPinModeTree()` 中 `.tree-line-header` 点击处理 |
| 青岛海域数据 | `city/qingdao/data_scattered.js`：`qingdao-sea` |
| 青岛海岸线几何 | `city/qingdao/assets/qingdao_sea.svg` |
| 海域内联化 | `city/qingdao/qingdao.js`：`inlineQingdaoSea()`、`startSeaObserver()` |
| 海域颜色和补绘 | `city/qingdao/style.css`：`--qingdao-sea-color`、`#map-content::before/::after` |
