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

## 2. 核心架构最高铁律（严禁违反）

### 🚨 铁律一：核心引擎与城市业务数据彻底解耦
1. **`core/` 目录为多城市通用引擎**：
   - 负责 SVG 绘制、视口缩放漫游、手势处理、全局搜索、图例调度、主题切换、图卡弹窗等通用交互。
   - **严禁**在 `core/` 下的任何脚本中硬编码特定城市的车站 ID（如 `M101`）、特定线路名称（如 `1号线`）、特定颜色或特定城市的私有业务逻辑。
2. **`city/` 目录为城市业务数据层**：
   - 所有特定城市（如北京 `city/beijing/`、沈阳 `city/shenyang/`、上海 `city/shanghai/` 等）的车站坐标、线路走向、站距、图例结构、时刻表，**必须且只能**存放在 `city/{city_id}/` 目录下。
   - 所有新城市必须通过 `city/data.js` 的 `CITY_REGISTRY` 进行注册。

### 🚨 铁律二：零重型依赖与单文件纯粹性
- 项目面向轻量、开箱即用与跨平台部署，**严禁引入** React/Vue 等重型框架或需要额外编译器的依赖包。
- 新增功能需遵循原生 Web 标准（Vanilla JS, Web Components, Standard DOM/SVG APIs）。

### 🚨 铁律三：严禁破坏暗色/亮色主题与多端适配
- 所有颜色必须优先使用 `css/cgo_clr.css` 和 `css/style.css` 中定义的 CSS 变量（如 `var(--theme-bg)`, `var(--text-color)` 等）。
- 任何 UI 变更必须同时适配桌面端（鼠标滚轮、悬浮、拖拽）与移动触控端（多点手势捏合缩放、触控拖拽）。

### 🚨 铁律四：代码或数据修改必须同步更新 Service Worker
- 本项目基于原生 Service Worker（`sw.js`）实现离线预缓存与性能加速。
- **任何新增文件、修改车站/线路数据或核心引擎逻辑后，必须同步更新 `sw.js` 中的 `CACHE_NAME` 缓存版本号**（新增文件还须同步登记至 `ASSETS_TO_CACHE` 数组），**否则更改将无法生效**。
- 💡 **排错第一准则**：在开发与调试过程中，**若出现“无论怎么修改代码/数据，页面表现都毫无变化、怎么改都不起作用”的情况，请务必首先思考是否是 Service Worker 强缓存导致的可能性！**

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
├── drunk/                      # Drunk 线路图智能转换系统 (早期测试版，仅供测试使用)
│   ├── index.html              # Drunk 沉浸式暗色转换工作台页面
│   ├── css/drunk.css           # 工作台专属样式
│   └── js/                     # 转换管道与识别算法
│       ├── drunk_pipeline.js   # 交互流程调度总线 (上传/渲染/编辑/导出)
│       ├── deepseek_vision.js  # DeepSeek 视觉大模型识图引擎 (客户端直连)
│       ├── pdf_vector_extractor.js # PDF & AI 矢量图层与 XMP 色板直通解析
│       ├── city_knowledge_matcher.js # 维基百科知识库动态匹配与 Levenshtein 纠错
│       ├── ocr_align_solver.js # 智能 OCR 与 8 方向文字排版求解器
│       ├── topology_tracer.js  # 线网拓扑追踪 (分支/环线/换乘)
│       ├── openmap_codegen.js  # 标准代码生成器与 5 项核心铁律自检
│       └── drunk_logger.js     # 控制台诊断追踪日志
├── docs/                       # 架构设计与二次开发文档
│   └── STATION_MODULE_GUIDE.md # 车站信息板自定义模块开发与配置指南
├── core/                       # 核心渲染与交互引擎 (多城市通用)
│   ├── script.js               # 主引擎：SVG生成、视口矩阵变换、平滑飞跃定位、事件监听
│   ├── station-board.js        # 车站信息板调度引擎与内置标准模块注册表
│   ├── cgo-ui.js               # Web Components 组件库 (<cgo-icon> 等)
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
│   └── shenyang/               # 示例城市 (沈阳，社区贡献范例)
│       ├── shenyang.js         # 城市业务逻辑 (换乘站呼出线/方城文化地标等)
│       ├── style.css           # 城市专属样式表
│       ├── data_stations.js    # 车站数据 (1~4、9、10号线等)
│       ├── data_lines.js       # 线路走向与站距配置
│       └── ...                 # 图例、卡片与检索等全套数据
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

Drunk（`drunk/index.html`）是专为解决“新城市手工测量 `(x, y)` 坐标繁琐且易出错”而研发的自动化转换工作台。

### 5.1 核心架构与模块分工
- `drunk/js/pdf_vector_extractor.js`：基于 Mozilla PDF.js 原生解析 PDF/AI 图层，直通读取矢量路径、OCG 图层语义及 XMP 色板（CMYK/RGB 专色转 Hex），支持多行文字自适应聚类。
- `drunk/js/deepseek_vision.js`：客户端直连 DeepSeek 官方视觉大模型（`deepseek-v4-flash-vision-exp`），零中间服务器，用于整网位图拓扑结构解析。
- `drunk/js/city_knowledge_matcher.js`：动态拉取维基百科分类树（MediaWiki API），结合 Levenshtein 模糊编辑距离自动补全站名与中英双语对齐。
- `drunk/js/ocr_align_solver.js`：计算站名与站点的空间相对方位，自动分配 8 方向避让锚点。
- `drunk/js/openmap_codegen.js`：生成标准 OpenMap 格式代码，并强制执行 5 项完整性自检。

### 5.2 代码生成 5 项铁律校验（由 `openmap_codegen.js` 自动检验）
1. **站间距长度自检**：单线必须满足 `distances.length === stationIds.length - 1`；环线必须满足 `distances.length === stationIds.length`。
2. **车站 ID 引用自检**：`linesData` 中引用的所有 `stationId` 必须在 `stationsData` 中有定义。
3. **换乘站物理对齐自检**：共站换乘的车站物理坐标必须严格统一。
4. **孤立车站告警**：未被任何线路引用的车站将提示警告。
5. **矢量徽标与颜色校验**：`color` 必须符合合法 Hex 格式，引用的 `svg` 需对应 `assets/svg/` 中的模板。

---

## 6. AI Agent 常见任务执行 SOP

### 任务 A：为项目移植新城市
根据用户情况选择以下两种路径之一：

#### 路径一：借助 Drunk 工作台快速提取并由 Agent 后期整合（推荐，测试阶段）
1. 引导用户启动本地静态服务并访问 `http://localhost:8080/drunk/`；
2. 上传该城市的高清线路图图片、PDF 或 Adobe Illustrator (.ai) 文件；
3. 执行“视觉识图”或矢量解析，利用 8 方向轮盘排版并执行“45°/90°吸附”；
4. 点击“导出城市工程”，将代码交付给 Agent 或直接放置于 `city/{city_id}/` 下；
5. Agent 协助检查 `city/data.js` 注册表与 `sw.js` 缓存版本更新。

#### 路径二：纯手工编写与数据排版
1. **创建城市目录**：在 `city/` 下新建 `city/{city_id}/`，参考 `city/beijing/` 或 `city/shenyang/` 准备各个 `data_*.js` 文件。
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

## 7. 本地运行与调试方法

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
