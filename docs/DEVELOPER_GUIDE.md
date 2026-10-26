# CGo OpenMap 核心架构与底层开发手册 (DEVELOPER_GUIDE.md)

> **适用对象**：CGo OpenMap 核心引擎维护者、深度功能二次开发者及 AI Coding Agent。  
> **核心目标**：提供全站底层架构、图层体系、渲染算法、图元规范、离线缓存机制与通用服务系统的权威技术真源，保证代码实现精简的同时架构设计有据可依。

---

## 1. 地图主视口与图层层级体系

在 `main.html` 及各工作台中，地图视口 (`#map-container`) 承载 SVG 矢量图形与 HTML 交互节点。**DOM 与 SVG 图层必须严格遵循自底向上的堆叠顺序（Z-Index / DOM 渲染顺序）**，以确保视觉遮挡与交互响应正确：

```text
▲ 顶层 (交互与可读性最高)
│
├── 6. #labels-layer          (HTML/CSS) 车站中英文名称标签 (Station Labels，居最顶层防文字被遮挡)
├── 5. #stations-layer        (HTML/SVG) 车站圆点 / 换乘标记节点 (Station Nodes)
├── 4. #highlight-layer       (SVG)      选线高亮发光层 (Hover / Active Route Glow)
├── 3. #not-open-layer        (SVG)      在建工程与规划走向虚线层 (Dash Array Routes)
├── 2. #lines-layer           (SVG)      在运营正式矢量线路层 (Smooth Chamfer Paths)
└── 1. #scattered-layer       (HTML/SVG) 背景装饰物图层 (罗盘、城门、水系轮廓与城市地标)
│
▼ 底层 (背景与装饰)
```

---

## 2. 核心渲染与交互引擎工作流 (`core/script.js`)

`core/script.js` 是全平台通用的核心中枢，负责处理自加载到漫游交互的全套链路：

1. **城市上下文解耦 (`getActiveCity`)**：
   - 自动解析 URL 参数 `?city={city_id}` 或读取 `localStorage('cgo_openmap_city')`；
   - 动态加载对应城市的配置与数据，严禁在通用引擎内硬编码具体城市逻辑。
2. **数据解析与拓扑构建 (`processData`)**：
   - 合并同名/同坐标物理车站，建立跨线物理换乘关系；
   - 校验车站唯一 ID、站间距 `distances` 数组长度，构建全网连通图。
3. **SVG 矢量图形渲染 (`renderLines`)**：
   - 调用倒角几何引擎将点阵折线倒角生成平滑圆角（45°/90°）贝塞尔曲线。
4. **站点与标签布局 (`renderStations`)**：
   - 按照 `align`（8 个方向）与 `offset: { x, y }` 计算双语文字锚点；
   - 自动避让轨道线并根据缩放尺度进行平滑渲染。
5. **手势与漫游系统 (`initInputControls`)**：
   - 支持桌面鼠标拖拽、滚轮平移/缩放；
   - 支持移动触控端双指捏合缩放（Pinch-to-zoom）与惯性平移。
6. **多维车站检索 (`bindSearchAndLegendEvents`)**：
   - 结合各城市拼音缩写库（`staname.csv`）支持汉字、拼音首字母、全拼、英文及历史更名模糊搜索；
   - 选中后视口以平滑缓动动画（Smooth Fly-to）飞跃居中高亮。
7. **车站信息卡片与微缩视窗 (StaCard API)**：
   - 动态调度 `stacard/script.js`，无缝接入高德切片瓦片与立体站台结构。
8. **LBS 地理定位 (`findNearestStation`, `wgs2gcj`)**：
   - 调用浏览器 Geolocation API 获取经纬度；
   - 经 WGS-84 转 GCJ-02 国测局坐标系加密后，计算欧氏距离/大圆距离匹配最近车站并导航定位。
9. **侧边栏吸附与响应式调度 (`dockStationPanel`, `handleResponsiveSwitch`)**：
   - 移动端自动呈现底部抽屉（BottomSheet）；
   - 桌面端支持一键固定为常驻侧边栏，支持历史记录折叠浏览。

---

## 3. 折线倒角几何与平滑圆角算法 (`core/path-geometry.js`)

### 3.1 架构定位：双端唯一真源
`core/path-geometry.js` 是**引擎渲染与编辑器预览共用的唯一几何真源**：
- `core/script.js` 依赖此算法生成实际网页中的 SVG 线路；
- `editor/` 编辑器依赖此算法生成 WYSIWYG（所见即所得）的实时连线。
- 绝不在编辑器中编写独立或近似算法，确保两端输出的 SVG path 指令逐字节一致。

### 3.2 拐角倒角数学原理
1. **向量提取**：遍历点阵序列中的相邻两段向量 $\vec{v}_1 = P_{curr} - P_{prev}$ 与 $\vec{v}_2 = P_{next} - P_{curr}$；
2. **归一化**：计算单位方向向量 $\vec{u}_1 = \frac{\vec{v}_1}{|\vec{v}_1|}, \vec{u}_2 = \frac{\vec{v}_2}{|\vec{v}_2|}$；
3. **点积判定夹角**：
   - 当 $|\vec{u}_1 \cdot \vec{u}_2| < 0.1$ 时判定为 **90° 直角**，采用默认半径 `RADIUS_90` (18px)；
   - 其它夹角判定为 **45° 或斜角**，采用默认半径 `RADIUS_45` (8px)；
   - 若折点显式声明了 `pCurr.r`，则强制采用该数值（`r: 0` 即严格保持尖角直角）；
4. **防畸变收缩保护 (`limitFactor`)**：
   - 取前后两段线长较小值的比例限制最大允许圆角半径：$r_{max} = \min(|\vec{v}_1|, |\vec{v}_2|) \times \text{limitFactor}$；
   - 默认 `limitFactor = 0.9`；若线路声明了 `useStrictRounding: true`，收紧为 `0.5`，防止过密折线圆角重叠产生扭曲；
5. **二次贝塞尔过渡**：
   - 起点 $P_{start} = P_{curr} - \vec{u}_1 \cdot r$；
   - 终点 $P_{end} = P_{curr} + \vec{u}_2 \cdot r$；
   - 输出 SVG 二次贝塞尔曲线指令：`L startX,startY Q currX,currY endX,endY`。

---

## 4. 车站图元模板与尺寸规范 (`core/station-icons.js`)

### 4.1 核心类型定义
- **`dot`（普通站）**：白色实心底，外描经停线路标志色外环（多线经停取第一条线），边长 14px；
- **`tsf`（换乘站）**：白色实心底，黑环双圈强化标识，边长 20px；
- **`tsfo`（虚拟/站外换乘站）**：视觉样式同 `dot`，交互上触发虚线换乘走廊；
- **`rdot`（国铁火车站）**：独立国铁枢纽站，采用灰色专用外环 (`#78848b`)，边长 16px；
- **`no`（暂缓开通站）**：浅灰色齿轮施工图元，边长 14px。

### 4.2 城市专属图元扩展机制
若城市线网有高度特异性的官方视觉规范（如上海地铁短横/胶囊图元、悉尼 Interchange 矩形等），城市主理人可在 `city/{city_id}/{city_id}.js` 中挂载自定义钩子：
```javascript
city.renderStationIcon = function (station, stationId) {
    // 返回原生 SVG 字符串或 DOM 节点，完全接管该站绘制
};
```

---

## 5. 邻城衔接引擎架构 (`core/city-neighbors.js`)

两座地理相近但系统独立的城市（如深圳 ⇄ 香港）可通过 `city/data.js` 的 `CITY_REGISTRY` 声明 `neighbors` 实现双城动态交互：

```javascript
neighbors: [{
    id: "hongkong",                   // 目标邻城 ID
    edge: "bottom",                  // 邻城方位：top | bottom | left | right
    scale: 0.67,                     // 衔接物理比例 (本城线宽 / 邻城线宽)
    offset: { x: 700, y: 1365 },     // 本城坐标系映射偏差：本城坐标 = offset + scale × 邻城坐标
    title: ["香港", "Hong Kong"]     // 双语提示名
}]
```

### 四大交互特性
1. **邻城影子 (Shadow)**：将邻城线网按 `scale` 与 `offset` 渲染在画布外部，平时以半透明淡彩阴影呈现；
2. **拉动进入 (Pull-to-switch)**：平移至画布边缘时，露出邻城视口；拉动超出阈值后出现进度环，拉满后触发平滑飞跃切入邻城；
3. **双城并看 (Dual-city Overview)**：全图缩小至阈值以下时，视口边界自动放宽为 `本城 ∪ 邻城`，两座城市同屏可见，点击邻城影子即刻切换；
4. **线宽自动归一**：基于 `scale` 动态计算 stroke 粗细，确保视口中双城轨道粗细视觉绝对统一。

---

## 6. PWA 离线缓存与瓦片拦截策略 (`sw.js`)

CGo OpenMap 采用原生 Service Worker 实现完全去服务端的纯静态离线运行：

### 6.1 缓存分级模型
1. **静态核心包 (`CACHE_NAME = 'cgo-openmap-v{yymmdd.hhmmss}'`)**：
   - 策略：**Cache-First**（缓存优先，命中即秒开）；
   - 覆盖：HTML 页面、核心 CSS、通用引擎 JS、各城市基础走向与车站定义；
   - 大体积按需资源（如沈阳站名题字切片、高分辨率背景底图）不纳入预缓存，由网络请求首次拉取后自动缓存。
2. **高德地图切片专用缓存 (`map-tiles-cache`)**：
   - 策略：**Stale-While-Revalidate / Cache-First for Tiles**；
   - 拦截目标：`*.autonavi.com` 地图瓦片；
   - 独立生命周期：与代码版本号解耦，发版更新 `CACHE_NAME` 时**保留**瓦片缓存，极大节省二次浏览流量。
3. **直通不拦截范围**：
   - 仅处理 `GET` 请求；
   - 严格排除 `POST` 请求（如编辑器直连 DeepSeek API 等模型服务）、第三方字体外链与非同源非瓦片请求，交给浏览器原生网络栈。

### 6.2 版本号严格格式规范
全站所有引用必须保持 12 位标准时间戳格式：
- 格式：`yymmdd.hhmmss`（例如 `261026.232300`，6位年月日 + 句点 + 6位时分秒）；
- 涉及范围：`sw.js` 中的 `CACHE_NAME`、全站 HTML 脚本标签中的 `?v={version}` 以及 `window.CGO_ASSET_VERSION`。严禁省略秒数。

---

## 7. 公共服务子系统

### 7.1 运营公告与通知系统 (`core/notice.js`)
在页面启动时检测生效公告并在导航栏提供通知入口：
- **分类标准**：
  - `ops`: 运营调整、新线开通（橙色）
  - `app`: 引擎与功能更新（蓝色）
  - `msg`: 作者寄语与重要提示（灰色）
  - `ads`: 社区与官方交流推荐（绿色）
- **字段规范**：
  - `id`: 唯一识别号（已读状态写入 `localStorage.nal_notice_read_ids`）
  - `startTime` / `deadline`: 有效时间段（浏览器本地时区）
  - `city`: 可选限定生效城市 ID（留空为全城通用）
  - `pushWindowDays`: 悬浮卡片的主动弹出窗口天数（默认 30 天，超时后仅收录于弹窗列表）

### 7.2 偏好设置与状态持久化 (`core/settings.js`)
系统所有用户配置统一落盘于浏览器 `localStorage`，键名命名空间规范：
- `cgo_openmap_city`: 当前激活城市 ID
- `app-theme`: 用户选择的颜色主题（`system` / `light` / `dark`）
- `nal_pref_wheel_mode`: 滚轮工作模式（`smart` / `zoom` / `pan`）
- `nal_sidebar_history_limit`: 桌面端侧边栏常驻车站历史卡片数量限制（1~9）
- `cgo_glass_mode`: 液态玻璃效果模式（`liquid` / `standard`）

### 7.3 全局主题调度器 (`core/tool-theme.js`)
- 支持点击快速在 Light / Dark 之间切换；
- 支持长按（800ms）重置为跟随操作系统外观；
- 支持父子窗口 `postMessage` 跨页面同步主题。

### 7.4 无障碍与安全转义工具 (`core/a11y.js`)
- 必须优先使用 `CGoA11y.escapeHtml(str)` 对任何拼入 DOM 的外部或用户输入内容进行转义，杜绝 XSS；
- 读屏播报通过 `CGoA11y.announce(text)` 异步推入常驻 `#cgo-a11y-status` 区域；
- 动效必须监听 `CGoA11y.prefersReducedMotion()`，在系统开启减弱动画时自动禁用物理过渡与飞跃效果。
