# AGENTS.md - CGo OpenMap AI Agent 快速上手指南

> **适用对象**：各类 AI Coding Agent（包括 DeepSeek-V3/R1 驱动的 Agent、Antigravity、Claude Code、Cursor、Cline、Roo Code 等）。
> **核心目标**：帮助 AI Agent 快速理解项目架构、遵循设计原则、高效准确地执行城市移植、线路/站点增改、样式定制及 Bug 修复任务。

---

## 1. 项目概述与技术栈

**CGo OpenMap** 是一款现代、轻量、高扩展性的开源城市轨道交通交互线路图引擎。

- **核心技术栈**：
  - **结构与渲染**：HTML5 + 原生 SVG 矢量渲染 + CSS3（基于 CSS 变量驱动的主题系统）
  - **核心逻辑**：纯原生 JavaScript (ES6+)，**零前端构建工具与打包依赖**（无需 Vite/Webpack/Node.js 构建步骤）
  - **组件体系**：原生 Web Components (`core/cgo-ui.js`，包含 `<cgo-icon>` 等自定义元素)
  - **离线与 PWA**：原生 Service Worker (`sw.js`) 与 `manifest.json`
- **运行方式**：纯静态 Web 资源，通过任意静态 HTTP 服务器（如 VS Code Live Server、`npx serve .`、`python3 -m http.server`）即可直接在浏览器中运行。

---

## 2. 核心架构最高铁律与开发大前提（严禁违反）

### 🚨 重要大前提（最高原则）：项目所有内容必须为纯前端，禁止使用任何其他（如 Node.js / PM2 / React 等）技术
> **⚠️ 核心技术底线**：本项目所有内容**必须且只能为纯前端静态实现**！**严禁使用任何其他技术栈**（包括但不限于 Node.js 服务端应用、PM2 进程守护/管理、Express/Koa 服务端框架、React、Vue、Angular、Svelte 重型框架及 Vite、Webpack 构建打包工具）。
>
> 1. **纯前端绝对纯粹性**：所有界面、核心引擎、城市数据、车站信息板模块、排版算法及交互脚本，必须且只能基于原生 Web 标准构建（原生 HTML5 + 原生 SVG + CSS3 + Vanilla JS + 原生 Web Components），不包含任何服务端代码与编译器。
> 2. **严禁引入 Node.js 服务端与 PM2 守护**：严禁在项目中编写 Node.js 后端应用服务、严禁使用 PM2 进行进程守护与常驻进程管理（如编写 `ecosystem.config.js`、启后台守护进程等）、严禁依赖任何持久化后台接口或中间件服务。所有数据获取与渲染均在客户端静态进行。
> 3. **严禁引入 React / Vue 等重型框架与打包编译器**：严禁引入 React、Vue、Angular、Svelte、Next.js、Nuxt 等现代重型前端框架；严禁引入 Vite、Webpack、Rollup、Parcel、Babel 等打包编译工具。所有代码必须能够无需编译在现代浏览器中直接执行。
> 4. **100% 纯静态开箱即用**：项目必须能够在任意纯静态托管环境（如 GitHub Pages、Cloudflare Pages、Nginx 纯静态目录、甚至是本地轻量静态 HTTP 服务）中 100% 完整运行。
>
> 📌 **唯一破例例外场景**：
> - **允许破例**：**如果有监控车站运营状态、监控目标网页变化等特殊后台巡检或服务情况，可以破例**使用 Node.js、PM2 进程守护或轻量脚本进行后台监控与维护；
> - **严禁破例（绝对红线）**：**除监控车站、监控网页等监控场景外，其他所有主要地图功能（包括核心渲染引擎、SVG 矢量绘制、视口缩放平移、全网车站检索、车站信息板各模块、样式系统与城市线网业务数据层等）一律严格禁止破例**，必须且只能为纯原生前端静态实现！

### 🚨 铁律一：核心引擎与城市业务数据彻底解耦
1. **`core/` 目录为多城市通用引擎**：
   - 负责 SVG 绘制、视口缩放漫游、手势处理、全局搜索、图例调度、主题切换、图卡弹窗等通用交互。
   - **严禁**在 `core/` 下的任何脚本中硬编码特定城市的车站 ID（如 `M101`）、特定线路名称（如 `1号线`）、特定颜色或特定城市的私有业务逻辑。
2. **`city/` 目录为城市业务数据层**：
   - 所有特定城市（如北京 `city/beijing/`、沈阳 `city/shenyang/`、青岛 `city/qingdao/`、合肥 `city/hefei/`、上海 `city/shanghai/` 等）的车站坐标、线路走向、站距、图例结构、时刻表，**必须且只能**存放在 `city/{city_id}/` 目录下。
   - 所有新城市必须通过 `city/data.js` 的 `CITY_REGISTRY` 进行注册。

### 🚨 铁律二：零重型依赖与单文件纯粹性
- 贯彻项目**纯前端**重要大前提：除**监控车站、监控网页等特殊场景允许破例**外，**其他所有主要地图功能一律严格禁止破例**，严禁引入 Node.js 服务端服务、PM2 进程管理、React/Vue 等重型框架或需要额外编译器的依赖包。
- 新增功能需遵循原生 Web 标准（Vanilla JS, Web Components, Standard DOM/SVG APIs），确保任意静态环境即开即用。

### 🚨 铁律三：严禁破坏暗色/亮色主题与多端适配
- 所有颜色必须优先使用 `css/cgo_clr.css` 和 `css/style.css` 中定义的 CSS 变量（如 `var(--theme-bg)`, `var(--text-color)` 等）。
- 任何 UI 变更必须同时适配桌面端（鼠标滚轮、悬浮、拖拽）与移动触控端（多点手势捏合缩放、触控拖拽）。

### 🚨 铁律四：代码或数据修改必须同步更新 Service Worker
- 本项目基于原生 Service Worker（`sw.js`）实现离线预缓存与性能加速。
- **任何新增文件、修改车站/线路数据或核心引擎逻辑后，必须同步更新 `sw.js` 中的 `CACHE_NAME` 缓存版本号**（新增文件还须同步登记至 `ASSETS_TO_CACHE` 数组），**否则更改将无法生效**。
- 💡 **排错第一准则**：在开发与调试过程中，**若出现“无论怎么修改代码/数据，页面表现都毫无变化、怎么改都不起作用”的情况，请务必首先思考是否是 Service Worker 强缓存导致的可能性！**

### 🚨 铁律五（最重要！）：UI 图标必须严格使用 CGoUI 矢量组件，严禁在界面与模块中滥用 Emoji
- **强制使用 `<cgo-icon>`**：所有按钮、表单、提示横幅、图例、弹窗及车站信息板自定义模块中，**必须且只能**使用原生 Web Components 图标组件 `<cgo-icon name="..." size="..."></cgo-icon>`（如 `<cgo-icon name="location" size="14"></cgo-icon>`、`<cgo-icon name="clock" size="14"></cgo-icon>`、`<cgo-icon name="route" size="14"></cgo-icon>`、`<cgo-icon name="map" size="14"></cgo-icon>`、`<cgo-icon name="train" size="14"></cgo-icon>` 等）。
- **严禁滥用 Emoji 表情符号**：严禁在 UI 界面、模块标题、列表前缀中使用 Emoji（如 🚇、🏛️、⏱️、⏳、🔄、🚌、📍、💡 等）。Emoji 在 Windows/Mac/iOS/Android 各操作系统下色调与字重不一致，破坏界面专业美感，且无法适配暗色/亮色主题与 CSS 矢量变量。
- **唯一例外**：除非实在在 CGoUI 内置图标库（`core/cgo-ui.js`）中匹配不到任何合适或语义相近的图标，才可作为最末降级手段。

---

## 3. 项目目录结构速查

```text
openmap/
├── index.html                  # 欢迎首页门户 (展示标题欢迎、已注册城市动态排序、主理人名录与导航)
├── main.html                   # 线路图核心交互画布 (包含基础DOM、SVG生成与多城市业务脚本加载)
├── LICENSE                     # 双轨开源许可协议 (GNU AGPLv3 + ODbL 1.0)
├── CONTRIBUTING.md              # 社区贡献与城市主理人指南
├── AGENTS.md                   # AI Agent 快速上手指南 (本文件)
├── QUICKSTART.md               # 初学者 AI 快速上手实操手册
├── PORTING.md                  # 城市移植详细操作指南
├── README.md                   # 开源项目说明主文档
├── readme.html                 # 网页版内置说明弹窗页面
├── privacy.html                # 隐私政策页面
├── manifest.json               # PWA 配置文件
├── sw.js                       # Service Worker 离线缓存
├── drunk/                      # Drunk 转换工作台 + OpenMap 城市编辑模式 (早期测试版)
│   ├── index.html              # 沉浸式暗色工作台页面 (样式内联于 <style>，drunk.css 目前未被引用)
│   ├── css/drunk.css           # 早期样式表，当前未被 index.html 引用
│   └── js/                     # 转换管道、识别算法与城市工程读写
│       ├── drunk_pipeline.js   # 交互流程调度总线 (识图/载入城市/编辑/撤销/导出)
│       ├── city_project_io.js  # 城市工程读写层：条目级无损回写 + 分支线路访问器
│       ├── drunk_sanitizer.js  # 识别结果净化与几何校正 (纯函数，可 Node 直跑回归)
│       ├── deepseek_vision.js  # DeepSeek 视觉大模型识图引擎 (客户端直连)
│       ├── pdf_vector_extractor.js # PDF & AI 矢量图层与 XMP 色板直通解析
│       ├── city_knowledge_matcher.js # 维基百科知识库动态匹配与 Levenshtein 纠错
│       ├── ocr_align_solver.js # 智能 OCR 与 8 方向文字排版求解器
│       ├── topology_tracer.js  # 线网拓扑追踪 (分支/环线/换乘)
│       ├── openmap_codegen.js  # 标准代码生成器与数据完整性自检
│       └── drunk_logger.js     # 控制台诊断追踪日志
├── docs/                       # 架构设计与二次开发文档
│   └── STATION_MODULE_GUIDE.md # 车站信息板自定义模块开发与配置指南
├── core/                       # 核心渲染与交互引擎 (多城市通用)
│   ├── script.js               # 主引擎：SVG生成、视口矩阵变换、平滑飞跃定位、事件监听
│   ├── station-board.js        # 车站信息板调度引擎与内置标准模块注册表
│   ├── cgo-ui.js               # Web Components 组件库 (<cgo-icon> 等)
│   ├── path-geometry.js        # 折线倒角几何 (引擎与 Drunk 编辑模式共用的唯一真源)
│   ├── station-icons.js        # 车站图元模板与尺寸 (引擎与 Drunk 共用的唯一真源)
│   ├── settings.js             # 偏好设置面板逻辑 (主题、全屏、清除缓存)
│   ├── help.js                 # 帮助与关于弹窗逻辑
│   ├── notice.js               # 动态公告与消息提示
│   └── tool-theme.js           # 亮暗主题切换控制器
├── city/                       # 城市数据层 (按城市解耦)
│   ├── data.js                 # 城市注册总线 (CITY_REGISTRY) 与运行时元数据
│   ├── beijing/                # 示例城市 (北京)
│   │   ├── beijing.js          # 城市特有业务关系与模块调度配置
│   │   ├── modules/            # 城市专属特色模块 (如 beijing_cultural.js)
│   │   ├── data_stations.js    # 车站坐标、中英文名、对齐方式、类型 (dot/tsf/rdot)
│   │   ├── data_lines.js       # 线路序列、颜色、站距、分支/环线配置
│   │   ├── data_legend.js      # 图例分组与分类显示
│   │   ├── data_timetable.js   # 车站首末班车时刻数据
│   │   ├── data_notopen.js     # 在建与规划虚线走向
│   │   ├── data_virtual_transfers.js # 出站虚拟换乘/站外连通映射
│   │   ├── data_scattered.js   # 孤立/特殊连接线路段
│   │   ├── staname.csv         # 拼音缩写、多音字与旧站名搜索库
│   │   └── stacard/            # 车站详情卡片与站台结构图组件
│   ├── shenyang/               # 示例城市 (沈阳，社区贡献范例)
│   │   ├── shenyang.js         # 城市业务逻辑 (换乘站呼出线/方城文化地标等)
│   │   ├── style.css           # 城市专属样式表
│   │   ├── data_stations.js    # 车站数据 (1~4、9、10号线等)
│   │   ├── data_lines.js       # 线路走向与站距配置
│   │   └── ...                 # 图例、卡片与检索等全套数据
│   ├── hefei/                  # 示例城市 (合肥，社区贡献范例)
│   │   ├── hefei.js            # 城市业务逻辑与模块配置
│   │   ├── modules/            # 城市专属特色模块 (文旅、时刻表)
│   │   ├── data_stations.js    # 车站数据 (1~8号线及S1线)
│   │   └── data_lines.js       # 线路走向与站距配置
│   └── qingdao/                # 示例城市 (青岛，社区贡献范例)
│       ├── qingdao.js          # 城市业务逻辑 (运营中心归属/综合交通换乘等)
│       ├── modules/            # 专属特色模块 (在建工程、工程名提示、更名历史、时刻表)
│       ├── data_stations.js    # 车站数据 (8条在运营及8段在建线路)
│       ├── data_lines.js       # 线路走向与快线配置
│       └── assets/             # 海域轮廓底图与国铁/机场/轮渡图标
├── css/                        # 样式系统
│   ├── style.css               # 地图引擎核心样式、图层排版、手势动画
│   ├── cgo_clr.css             # 线路标志色与全局主题配色变量
│   ├── cgo_element.css         # UI 基础元素样式 (按钮、输入框、徽章)
│   ├── cgo_ui.css              # CGoUI 基础样式
│   └── cgo_components.css      # 车站卡片、检索面板与弹窗样式
└── assets/                     # 静态资源
    ├── icons/                  # 应用图标、车站徽标、天气地标
    └── svg/                    # 线路数字徽标 (icon@01.svg ~ icon@57.svg 等)
```

---

## 4. 关键数据结构与规范

### 4.1 城市注册 (`city/data.js`)

在 `CITY_REGISTRY` 中注册城市基础信息：
```javascript
const CITY_REGISTRY = {
    "shanghai": {
        id: "shanghai",
        name: "上海",
        themeColor: "#b72626",          // 城市专属主题色 (Hex，驱动主要按钮、悬浮态与高亮，留空使用默认蓝色)
        svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="..."/></svg>', // 城市官方矢量徽标 (收录去色去 viewBox，留空默认显示小火车图标)
        folder: "./city/shanghai",
        mainLogic: "./city/shanghai/shanghai.js",
        center: { x: 1000, y: 800 },   // 初始视口居中坐标
        defaultScale: 1.0,              // 初始缩放比例
        mapSize: { width: 2200, height: 1800 }, // 画布总尺寸 (px)
        searchCity: "上海",             // 高德行政区检索名称
        title: "CGo OpenMap - 上海轨道交通线路图",
        keywords: "上海地铁, 申通地铁, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的上海轨道交通智能交互线路图",
        isDefault: false
    }
};
```

> 💡 **城市品牌定制规范**：
> - `themeColor`：优先使用 6 位 Hex（如 `#b72626`、`#c60a16`），亦兼容 3/8 位 Hex。未设置时自动继承系统经典深蓝（`#00263b`）。不同城市之间色彩完全隔离，杜绝相互污染。
> - `svglogo`：收录时**必须去色（移除硬编码 fill）、去 viewBox 并去除 XML 头部**。前端基于 `currentColor` 自动适配亮暗与悬浮反白，并通过 `getBBox()` 自动自适应缩放至与小火车图标一致的 `22px × 22px`。留空则自动降级展示小火车图标。


### 4.2 车站定义 (`data_stations.js`)

每个车站以唯一 ID 为 Key：
```javascript
const stationsData = {
    "M101": {
        type: "dot",                // 站类: dot(普通站，包含地铁站和市郊铁路站), tsf(换乘站), no(暂缓开通), rdot(单独零散的国铁火车站)
        x: 820,                     // 画布 X 坐标 (像素，左上角为原点 0,0)
        y: 640,                     // 画布 Y 坐标 (像素)
        cn: "人民广场",              // 中文站名
        en: "People's Square",      // 英文站名
        align: "top-right",         // 文本对齐锚点: top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
        offset: { x: 4, y: -2 },    // 文本相对站点的微调像素偏移
        textScale: { cn: 1.0, en: 1.0 }, // 文本缩放比例 (可选)
        hideLabel: false            // 是否隐藏文本标签 (可选)
    }
};
```

> **换乘站规范**：多条线路相交的换乘车站，各线路必须共用**相同的车站 ID 与坐标**，或者配置虚拟换乘映射。

### 4.3 线路走向 (`data_lines.js`)

```javascript
const linesData = [
    // 1. 标准单线
    {
        id: "M1",
        name: "1号线",
        color: "#E4002B",            // 线路主色 (16进制 Hex)
        svg: "icon@01.svg",          // 线路图标 (复用 assets/svg/ 下通用模板)
        company: "申通地铁第一运营公司",
        stationIds: ["M101", "M102", "M103"], // 按运行顺序排列的车站 ID 数组
        distances: [1200, 1500]       // 站间距 (米)，严格满足 length === stationIds.length - 1
    },
    // 2. 环线 (必须声明 isLoop: true)
    {
        id: "M4",
        name: "4号线",
        color: "#5B2C84",
        isLoop: true,
        stationIds: ["M401", "M402", "M403", "M404"],
        distances: [1100, 1250, 1300, 950] // 顺时针站距 (length === stationIds.length)
    },
    // 3. 分支/Y字形线路 (必须声明 hasbranch: true)
    {
        id: "M11",
        name: "11号线",
        color: "#852655",
        hasbranch: true,
        "stationIds-way1": ["M1101", "M1102", "M1103"],
        "stationIds-way2": ["M1101", "M1102", "M1104"],
        "distances-way1": [1300, 1400],
        "distances-way2": [1300, 1800]
    }
];
```

### 4.4 矢量徽标颜色注入机制
- `assets/svg/icon@01.svg` ~ `icon@57.svg` 为内置矢量模板，内部使用 CSS 变量动态驱动。
- 无需为新城市额外绘制数字 SVG。只需在 `data_lines.js` 中声明：
  - `color`: 线路主色
  - `svgclr` (可选): 图标底色（默认同 `color`）
  - `svgtext` (可选): 图标文字颜色（默认 `#FFFFFF`）

### 4.5 可定制模块化车站信息板（`core/station-board.js`）

车站信息板采用**模块注册化架构**，核心调度逻辑与城市业务数据完全解耦。各城市主理人可根据本地城市特点与运营需求，自主开关、重排序或定制扩展以下 7 大核心领域内容：

1. 🏛️ **文旅信息**：车站周边历史名胜古迹、红色旅游景点、网红商圈与地标导览（如北京历史名胜、沈阳方城文脉）。
2. ⏱️ **运行时刻信息**：首末班车发车时刻、平日/节假日运营时刻表及全天班次分布。
3. ⏳ **预计进站时间**：列车实时到站倒计时、发车预估及行车间隔动态指示。
4. 🔄 **换乘详情**：同台换乘指引、立体通道换乘、出站限时虚拟免换乘规则、换乘步行耗时与火车站/航站楼连通提示。
5. 🚌 **接驳空间**：地面微循环公交线路、出租车/网约车站台、P+R 驻车换乘停车场、共享单车接驳区。
6. 🏗️ **站台结构**：岛式/侧式站台示意、楼梯/自动扶梯/垂直无障碍电梯分布位置、车厢编号与最佳换乘车门指引。
7. 🍼 **设施指南**：母婴关爱室、无障碍卫生间、AED 自动体外除颤仪、便民服务台与失物招领处。

#### 模块注册与城市配置规范
- **注册模块**：在 `city/{city_id}/modules/` 下编写模块脚本，调用 `window.StationBoard.registerModule({ id, name, targetTab, order, shouldRender, render, onMounted })`；
- **配置与调度**：在 `city/{city_id}/{city_id}.js` 中配置 `stationBoard` 字典统一调度；
- **同步加载机制**：城市专属模块脚本必须在城市主逻辑 `{city}.js` 中通过 `document.write` 同步引入，确保在核心引擎执行前就绪。
- 完整开发手册与 API 规范请参阅：[《车站信息板自定义模块开发与配置指南》](docs/STATION_MODULE_GUIDE.md)。

---

## 5. Drunk 转换系统与 Agent 协作指南 (实验特性)

> [!WARNING]
> **早期开发验证阶段声明**：  
> **Drunk 转换系统（`drunk/`）目前处于早期开发验证阶段，仅供测试与实验使用**。系统算法与数据结构仍在频繁迭代中，导出结果请以实际运行渲染测试为准。**极其欢迎开发者与社区团队共同参与其识别算法、矢量图层直通及拓扑求解器的协同开发！**

Drunk（`drunk/index.html`）有两种工作模式：

- **识图模式（新城市）**：解决“新城市手工测量 `(x, y)` 坐标繁琐且易出错”，从底图/PDF/AI 自动矢量化出整套城市数据；
- **编辑模式（已有城市）**：**Drunk 同时是 OpenMap 任意已注册城市的可视化编辑器**。从顶栏下拉框（或线路图「偏好设置 → 编辑此图」，或直接访问 `drunk/index.html?city={city_id}`）载入 `city/{city_id}/`，即可：
  - **车站**：拖站 / 方向键挪站、改中英文站名、切换类型、调站名朝向与文字偏移、删站；
  - **线路**：点图例项或直接点画布上的线条选中，改线路名 / 标志色 / 运营公司 / `useStrictRounding`，
    并可拖动走向折点、双击线条插入折点、`Delete` 删折点（分支线路的
    `pathPoints-main` / `-branch1` / `-branch2` 一并支持）；
    选中拐角折点后还能调该拐角的圆角半径 `r`（留空=自动按夹角取 18/8px，`0`=保持直角）。

  导出时只改写你实际动过的条目——挪一个折点，`git diff` 里就只有那一行 `{ x: …, y: … }`。

### 5.1 核心架构与模块分工
- `drunk/js/city_project_io.js`：**城市工程读写层**。读取 `city/{city_id}/data_*.js` 并保留源码原文，提供条目级「外科手术式回写」与分支线路数据模型访问器。
- `drunk/js/drunk_sanitizer.js`：**识别结果净化与几何校正器**（纯函数）。噪点站剔除、脏站名清洗、同名换乘站合并、退化线路剔除，以及墨迹吸附 + 最小二乘相似变换的整体歪斜校正。
- `drunk/js/pdf_vector_extractor.js`：基于 Mozilla PDF.js 原生解析 PDF/AI 图层，直通读取矢量路径、OCG 图层语义及 XMP 色板（CMYK/RGB 专色转 Hex），支持多行文字自适应聚类。
- `drunk/js/deepseek_vision.js`：客户端直连 DeepSeek 官方视觉大模型（`deepseek-v4-flash-vision-exp`），零中间服务器，用于整网位图拓扑结构解析。
- `drunk/js/city_knowledge_matcher.js`：动态拉取维基百科分类树（MediaWiki API），结合 Levenshtein 模糊编辑距离自动补全站名与中英双语对齐。
- `drunk/js/ocr_align_solver.js`：计算站名与站点的空间相对方位，自动分配 8 方向避让锚点。
- `drunk/js/openmap_codegen.js`：生成标准 OpenMap 格式代码，并强制执行完整性自检。

### 5.1.1 🚨 编辑模式最高铁律：回写必须无损

城市数据文件里有大量**引擎私有或城市私有的字段**：悉尼每座车站带 `marker.parts` / `marker.halo` / `labelSize` / `labelBold`，北京带 `textScale` / `hideLabel`，线路上还有 `overlayStyle`、`svgclr`、`pathPoints-branch1` 等等。

> **严禁**用「把数据解析成对象再整体重新序列化」的方式写回城市文件。
> 那样会**静默丢弃所有未被识别的字段**，对已经逐像素校准过的城市是灾难性的。

正确做法已封装在 `CityProjectIO.patchEntries(源码, 变量名, { update, remove, append })`：
它扫描出每条条目的字面量区间，**递归比对新旧值，只重写真正变了的那个叶子**，未改动的子树连同注释、缩进、字段顺序、手写换行逐字节保留。实测：改一座车站的 `align` 只产生 1 行 diff，改一条线路的 `color` 也只有 1 行，几百个 `pathPoints` 折点不会被重新排版。

### 5.1.2 🚨 遍历线路时必须使用分支安全访问器

线路的站序有两种写法：普通线 `stationIds` + `distances`；分支线 `hasbranch: true` 配 `stationIds-way1` / `-way2`（及 `distances-wayN`）。折线点阵同理：`pathPoints`，或 `pathPoints-main` / `-branch1` / `-branch2`。

北京 `S2`/`S6`/`JX`、上海 `SH5`/`SH10`/`SH11`、悉尼 `T1`/`T2`/`T4`/`T8` 都是分支线路；合肥全网则**只有 `stationIds` 而没有 `distances`**。

> 凡是遍历线路的代码，**必须**走 `CityProjectIO.lineStationGroups(line)` / `linePathGroups(line)` / `lineAllStationIds(line)`，
> 直接写 `line.stationIds.length` 一碰到这些城市就会 `undefined.length` 崩掉。

返回形状：
- `lineStationGroups(line)` → `[{ idsKey, distKey, ids, distances }]`
- `linePathGroups(line)` → `[{ key, points }]`，`points` 是对原数组的**引用**（编辑模式拖折点即直接改它），`key` 用于写回 `line[key]`
- `lineAllStationIds(line)` → 跨分支去重后的车站 ID 数组

另注意：`distances` 允许是空数组（在建线路）或 `"约21千"` 这类人工标注文本，不可假定为等长数字数组。

### 5.1.2.5 🚨 折线倒角：编辑器预览必须与引擎渲染同源

线路折线不是直角折线——`core/path-geometry.js` 会按拐角夹角自动倒圆角
（90° 取 `RADIUS_90`=18px，斜角取 `RADIUS_45`=8px），折点可用 `r` 字段单独覆盖
（`r: 0` 即保持直角），线路可用 `useStrictRounding: true` 收紧倒角限制。
该字段已在实际使用：北京 20 个折点（20/30/400px）、合肥 24 个（28/32/36px），
上海与悉尼则是逐点 `r: 0` 保持直角（走向本就由密集折点描出）。

**线路走向的来源判定**同样收敛在这里（`lineSegments(line, stations)`），判定链按优先级为：

1. `isPointOnly: true` → **不画走向**，只在图上落站点图元（国铁等散布全城的车站）；
2. `hasbranch: true` → 画 `pathPoints-main` / `-branch1` / `-branch2`，**不回退站序**；
3. `pathPoints` → 画折线点阵；
4. 都没有 → 按 `stationIds` 顺序取站点坐标连成一段。

> **`core/path-geometry.js` 是倒角算法与走向判定的唯一真源**，`core/script.js` 与
> `drunk/js/drunk_pipeline.js` 都必须调用它，**严禁任何一方复刻第二份实现**。
> 这套判定曾经两边各写一份，结果 Drunk 漏了第 1 条，把北京「中国铁路」24 座
> 散布全城的国铁车站从延庆一路连到大兴，编辑器画布上凭空多出一堆横穿全图的
> 长斜线；第 4 条又漏了倒角，北京 M11 的走向与线路图对不上。
> Drunk 是所见即所得编辑器：若编辑器用直角折线预览、引擎渲染时倒了圆角，
> 用户在 Drunk 里调出来的走向与圆角上线后就是另一个样子。
> （站名 `offset` 吃过同样的亏，见 `updateSingleLabelStyle` 的注释。）

`selfcheck.js` 里有结构性断言守着这一点。

### 5.1.2.7 🚨 车站图元：模板、尺寸与配色同样必须同源

`core/station-icons.js` 是车站图元的唯一真源：`SVGTemplates`（dot/tsf/tsfo/no/rdot）、
`STATION_SIZE`（dot 10px、tsf 17.5px…，**必须与 `css/style.css` 保持一致**，
`selfcheck.js` 会直接解析该 CSS 比对）、以及 `computeLineColors`
（普通站的环色取第一条经停线路的标志色）。

城市可用 `city.renderStationIcon(station, id)` 完全接管画法——上海的短横与
换乘胶囊、悉尼的 Interchange 底衬即走这条路。Drunk 会在载入城市时尝试接入它。

> ⚠️ **Drunk 不能无脑注入城市主脚本**：北京 / 合肥 / 青岛的 `{city}.js` 用
> `document.write` 同步加载专属模块，在 DOMContentLoaded 之后再注入会**直接冲掉
> 整个文档**。因此先取回源码检查，含 `document.write` 的一律跳过（这几座城市本来
> 也没实现 `renderStationIcon`）。

### 5.1.2.8 运行期派生字段一律用 `_` 前缀

`_lineColors`（由线路颜色推导）、`_srcCanvasW/H`（PDF 直通的原画布尺寸）这类
**算出来的、不属于城市数据本身**的字段，必须以 `_` 开头：
`city_project_io.js` 的序列化与 `drunk_pipeline.js` 的脏判定都按这个前缀过滤。
否则一载入城市就会显示「477 处改动」，导出摘要把每座车站都列成改过，
甚至可能把派生字段写回数据文件。

### 5.1.3 改动纯函数层后必须跑自检

```bash
node drunk/tools/selfcheck.js
```

零依赖、零构建、不需要浏览器。覆盖 `city_project_io.js` 的条目级无损回写与 `drunk_sanitizer.js` 的净化/几何校正，断言直接跑在 `city/` 下的**全部真实城市数据**上（当前 62 项断言 / 6 座城市）。改动这两个模块后**必须**跑通再提交。

### 5.2 代码生成完整性自检（由 `openmap_codegen.js` 的 `validateData()` 实际执行）

判定为**错误**（会让健康度指示泛红）：
1. **站间距长度自检**：单线必须满足 `distances.length === stationIds.length - 1`；环线必须满足 `distances.length === stationIds.length`。分支线按 way 逐组校验。
2. **车站 ID 引用自检**：`linesData` 中引用的所有 `stationId` 必须在 `stationsData` 中有定义。

判定为**告警**（不阻断导出）：

3. **孤立车站告警**：未被任何线路引用的车站。
4. **站间距待补告警**：有站序但 `distances` 缺失或为空。这是合法的待补全状态而非错误——`data_lines.js` 明确要求「未经可靠来源核实的站间距不得按坐标推算或补写」，在建线路与合肥全网均属此列；若在此处报错，绝大多数城市的健康度指示会长期泛红而失去意义。
5. **无几何告警**：线路既无站序也无折线走向，不会被渲染。

> 注意：换乘站坐标一致性、`svg` 模板存在性与 `color` 合法性目前**尚未**在 `validateData()` 中实现，请勿据此假定已被校验。补齐这几项是欢迎的贡献方向。

### 5.2 代码生成 5 项铁律校验（由 `openmap_codegen.js` 自动检验）
1. **站间距长度自检**：单线必须满足 `distances.length === stationIds.length - 1`；环线必须满足 `distances.length === stationIds.length`。
2. **车站 ID 引用自检**：`linesData` 中引用的所有 `stationId` 必须在 `stationsData` 中有定义。
3. **换乘站物理对齐自检**：共站换乘的车站物理坐标必须严格统一。
4. **孤立车站告警**：未被任何线路引用的车站将提示警告。
5. **矢量徽标与颜色校验**：`color` 必须符合合法 Hex 格式，引用的 `svg` 需对应 `assets/svg/` 中的模板。

---

## 6. AI 任务处理规则与现有城市功能模板参考（强制执行）

AI Agent 在处理用户任务（如新增城市特性、扩展车站信息板模块、调整线网排版及装饰元素）时，**必须且只能严格参考现有成熟城市的标准化实现模板**，杜绝随意自创新格式：

### 6.1 现有城市几大核心功能模板参考
1. **自定义站名外观和线路标志图标**：
   - **推荐参考实现**：**沈阳样式**（`city/shenyang/shenyang.js` 与 `city/shenyang/style.css`）。
   - **核心技术模式**：
     - 在城市主脚本中实现 `getStationLabelStyle(station, stationId)`，为特殊换乘站应用呼出框（`"callout"`）与气泡引线排版（例如沈阳所有 `type: "tsf"` 换乘站启用 `callout` 引线）；
     - 通过局部 `MutationObserver` 监听车站信息板重新渲染，在车站标题前注入城市专属特色矢量地标徽章（如沈阳方城地标 `assets/fangcheng.svg`）；
     - 线路徽标优先复用 `assets/svg/icon@*.svg` 模板，并在 `data_lines.js` 中配置 `svgclr` / `svgtext` 动态调色。
2. **添加名胜古迹与文旅地标信息**：
   - **推荐参考实现**：**北京处理方式**（`city/beijing/modules/beijing_cultural.js` 与 `city/beijing/beijing.js`）。
   - **核心技术模式**：
     - 严格遵循车站信息板模块化注册规范，调用 `window.StationBoard.registerModule`；
     - 建立站名与历史名胜、古迹地标及游览路线的字典映射，利用 `shouldRender` 精确判定命中车站；
     - 默认挂载于 `'station-info'`（车站信息选项卡），排序设为 `order: 15`（置于车站类型后、运营公司前）；
     - **卡片标题与引导图标严格使用 `<cgo-icon name="location" size="14"></cgo-icon>` 或 `<cgo-icon name="map" size="14"></cgo-icon>`，严禁在 HTML 字符串中使用 emoji**。
3. **添加首末车运营时刻信息**：
   - **推荐参考实现**：**青岛处理方式**（`city/qingdao/data_timetable.js` 与 `city/qingdao/modules/qingdao_timetable.js`）。
   - **核心技术模式**：
     - 数据端在 `data_timetable.js` 中按线路方向、终点站、平日/节假日多维度规范收录首末车时刻矩阵；
     - 展示端在 `city/{city_id}/modules/` 下编写时刻表模块，将多方向列车发车时刻组织为响应式数据表格，挂载于 `'line-tab'`（线路选项卡）；
     - **表头、方向与辅助指引必须使用 `<cgo-icon name="clock" size="14"></cgo-icon>` 与 `<cgo-icon name="arrow-right" size="12"></cgo-icon>`，严禁使用 emoji**。
4. **添加水域（海岸线、海湾、河道与湖泊等）**：
   - **推荐参考实现**：**青岛处理方式**（`city/qingdao/assets/qingdao_sea.svg` 与 `city/qingdao/data_scattered.js`）。
   - **核心技术模式**：
     - 在城市专属 `city/{city_id}/assets/` 下存放纯净的独立水域轮廓 SVG 矢量资源；
     - 在 `data_scattered.js` 中作为底图层装饰元素注入（`type: "svg"`, `layer: "background"`, `zIndex: 1`），精准配置大视口物理坐标原点 `(x, y)` 与 `width/height`；
     - 配合深色模式反转或透明度处理，保持核心渲染引擎（`core/script.js`）零侵入，杜绝在核心引擎中硬编码水域路径。
5. **添加规划与建设进度信息（规划图信息、建设进度、建设资讯、最新信息与预计开通运营安排）**：
   - **推荐参考实现**：**青岛处理方式**（`city/qingdao/data_construction.js`、`city/qingdao/modules/qingdao_construction.js` 与 `city/qingdao/modules/qingdao_engineering_name_notice.js`）。
   - **核心技术模式**：
     - **规划与在建底图拓扑**：在 `data_notopen.js` 中维护未开通/规划线路走向虚线，在 `data_stations.js` 中将规划及在建车站设为 `type: "no"`；
     - **建设进度与资讯数据建模**：在 `data_construction.js` 中按线路 ID 细化组织在建车站（主体结构施工/封顶、开挖深度、最新更新日期）及前后盾构区间（左线/右线贯通状态、工程名称与掘进资讯）；
     - **信息板模块动态挂载**：在 `city/{city_id}/modules/` 编写建设进度模块（注册于 `'line-tab'` 线路选项卡，`order: 24`），动态渲染“上一区间 ➔ 本站 ➔ 下一区间”的完整工程建设链路；
     - **工程暂用名与开通安排提示**：搭配工程名提示模块（如 `qingdao_engineering_name_notice.js`），对工程暂用名标注提示，并展示最新建设进展资讯与预计开通运营安排；
     - **状态标识与杜绝 Emoji**：已完成（绿）、建设中（黄）、未开始/待更新（灰）状态指示严格使用原生 CSS 颜色块与 CGoUI 矢量图标（如 `<cgo-icon name="warning" size="14"></cgo-icon>`、`<cgo-icon name="clock" size="14"></cgo-icon>`、`<cgo-icon name="route" size="14"></cgo-icon>`），严禁使用 Emoji。

---

### 6.2 🚨 最重要图标规范：严格使用 CGoUI，严禁使用 Emoji！
- **基本要求**：所有界面输出、按钮、状态标签、图例、弹窗及车站信息板自定义模块中，**必须且只能使用 `<cgo-icon name="..." size="..."></cgo-icon>` 原生组件**。
- **严禁滥用 Emoji**：严禁在代码、HTML 模板、按钮文本及提示语中使用 Emoji 表情符号（如 🚇, 📍, 🏛️, ⏱️, ⏳, 🔄, 🚌, 🍼 等）。
- **降级界限**：**除非且仅当**在 CGoUI 官方图标库（`core/cgo-ui.js`）中实在匹配不到任何语义相近的合适图标时，方允许作为最后的降级手段。
- **常用 CGoUI 图标速查指引**：
  - 车站 / 地点 / 地标：`<cgo-icon name="location" size="14"></cgo-icon>`
  - 路线 / 线路走向：`<cgo-icon name="route" size="14"></cgo-icon>`
  - 列车 / 地铁车次：`<cgo-icon name="train" size="14"></cgo-icon>`
  - 时间 / 首末班时刻：`<cgo-icon name="clock" size="14"></cgo-icon>`
  - 地图 / 导览概览：`<cgo-icon name="map" size="14"></cgo-icon>`
  - 换乘 / 连通节点：`<cgo-icon name="transfer" size="14"></cgo-icon>`
  - 出入口 / 进出站闸机：`<cgo-icon name="gate" size="14"></cgo-icon>`
  - 重点亮点 / 推荐特色：`<cgo-icon name="sparkle" size="14"></cgo-icon>`
  - 帮助 / 关于说明：`<cgo-icon name="help" size="14"></cgo-icon>` / `<cgo-icon name="info" size="14"></cgo-icon>`
  - 外部链接 / 跳转指引：`<cgo-icon name="external" size="13"></cgo-icon>` / `<cgo-icon name="arrow-right" size="12"></cgo-icon>`
  - 校验通过 / 成功状态：`<cgo-icon name="check-circle" size="14"></cgo-icon>`
  - 警告提示 / 在建工程：`<cgo-icon name="warning" size="14"></cgo-icon>`

---

## 7. AI Agent 常见任务执行 SOP

### 任务 A：为项目移植新城市
根据用户情况选择以下两种路径之一：

#### 路径一：借助 Drunk 工作台快速提取并由 Agent 后期整合（推荐，测试阶段）
1. 引导用户启动本地静态服务并访问 `http://localhost:8080/drunk/`；
2. 上传该城市的高清线路图图片、PDF 或 Adobe Illustrator (.ai) 文件；
3. 执行“视觉识图”或矢量解析，利用 8 方向轮盘排版并执行“45°/90°吸附”；
4. 点击“导出城市工程”，将代码交付给 Agent 或直接放置于 `city/{city_id}/` 下；
5. Agent 协助检查 `city/data.js` 注册表与 `sw.js` 缓存版本更新。

#### 路径二：纯手工编写与数据排版
1. **创建城市目录**：在 `city/` 下新建 `city/{city_id}/`，参考 `city/beijing/`、`city/shenyang/`、`city/qingdao/` 或 `city/hefei/` 准备各个 `data_*.js` 文件。
2. **注册城市**：在 `city/data.js` 的 `CITY_REGISTRY` 中添加新城市元数据。
3. **编写车站与线路**：按顺序填充 `data_stations.js` 和 `data_lines.js`。
4. **引入脚本**：在 `main.html` 底部修改引入的城市脚本路径，或保留动态加载支持（通过 `main.html?city={city_id}` 动态访问）。
5. **添加 PWA 快捷方式**：在 `manifest.json` 的 `shortcuts` 中登记该城市快捷入口（`url: "./main.html?city={city_id}"`）。
6. **更新离线缓存**：在 `sw.js` 的 `ASSETS_TO_CACHE` 中登记新城市资源并递增 `CACHE_NAME` 版本号。
7. **验证测试**：启动静态服务验证首页展示、卡片跳转及地图渲染与缩放。

### 任务 B：批量添加/修改站点与调整线路
1. **添加站点**：在 `data_stations.js` 添加车站对象，设置合理的 `(x, y)` 坐标与 `align` 对齐方式。
2. **连接线路**：在 `data_lines.js` 对应线路的 `stationIds` 中插入新站 ID，并同步向 `distances` 插入对应的站间距（注意数组长度校验）。
3. **检查防重叠**：若站名与线网相撞，调整 `align`（如 `top` 改为 `bottom-right`）并微调 `offset`。

### 任务 C：添加出站虚拟换乘
1. 打开 `data_virtual_transfers.js`。
2. 在 `VIRTUAL_FREE_TRANSFER_MAP` 中建立双向或单向连通 ID 关联：
   ```javascript
   const VIRTUAL_FREE_TRANSFER_MAP = {
       "M1205": ["M1308"],
       "M1308": ["M1205"]
   };
   ```

### 任务 D：为城市定制/新增车站信息板模块
1. **明确业务场景与槽位**：根据城市需要，选择定制文旅名胜、运行时刻、预计进站时间、换乘详情、接驳空间、站台结构、便民设施等内容；确定挂载目标（`'line-tab'`、`'station-info'`、`'header'`、`'footer'` 或自定义新 Tab）。
2. **编写模块脚本**：在 `city/{city_id}/modules/{module_name}.js` 中通过 `window.StationBoard.registerModule({...})` 编写渲染逻辑（返回标准 HTML 字符串）。
3. **在城市主脚本中同步引入与调度**：
   - 在 `city/{city_id}/{city_id}.js` 中通过 `document.write('<script src="' + folder + '/modules/{module_name}.js?v=' + v + '"><\/script>');` 同步加载；
   - 在城市对象的 `stationBoard.modules` 字典中配置模块的 `enabled`、`order` 与 `targetTab`。
4. **更新离线缓存**：将新模块文件登记至 `sw.js` 的 `ASSETS_TO_CACHE` 中，并递增 `CACHE_NAME` 版本号。
5. **验证测试**：启动本地服务器，点击对应车站，检查模块内容、事件交互及暗色/浅色模式适配。

---

## 8. 本地运行与调试方法

由于浏览器安全策略（CORS）限制，直接双击 `index.html` 或 `main.html` 无法通过 `file://` 协议加载模块与数据。请使用以下任一方式启动本地静态服务：

```bash
# 方式 1: 使用 npx serve (推荐)
npx serve .

# 方式 2: 使用 Python 3 内置服务器
python3 -m http.server 8080

# 方式 3: VS Code 安装 Live Server 插件后点击右下角 "Go Live"
```

浏览器访问对应端口（如 `http://localhost:8080` 或 `http://127.0.0.1:5500`）即可实时调试。

### ⚠️ 核心注意事项：Service Worker 缓存穿透与失效排查
- **必须更新缓存版本**：修改代码或数据后，务必递增 `sw.js` 中的 `CACHE_NAME` 版本号，**否则更改可能不会生效**。
- **排错第一思考**：如果出现了**“明明修改了代码，但在浏览器里反复刷新也毫无变化、怎么修改都不起作用”**的现象，**请务必首先思考是否是 Service Worker 缓存导致的可能性！**
- **调试推荐操作**：
  1. 按 `F12` 打开浏览器开发者工具，在 **Network（网络）** 标签页勾选 **`Disable cache (停用缓存)`**（只要 DevTools 保持打开，所有请求均直达最新文件）；
  2. 在 **Application（应用）-> Service Workers** 面板中勾选 **`Update on reload`**，或在调试期间直接点击 **`Unregister`** 注销 Service Worker；
  3. 执行硬性强制刷新：`Ctrl + F5`（Windows）或 `Cmd + Shift + R`（Mac）；
  4. 亦可在页面右上角「偏好设置」面板中点击「清除本地缓存并刷新」。
