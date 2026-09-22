<p align="center">
  <img src="./assets/icons/mapicon.png" alt="CGo OpenMap Logo" width="96" height="96">
</p>

<h1 align="center">CGo OpenMap</h1>

<p align="center">
  轻量、现代、高度可扩展的开源 Web 城市轨道交通交互线路图引擎
</p>

<p align="center">
  <strong>简体中文</strong> • <a href="./README_EN.md">English</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0%20%2F%20ODbL-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/dependencies-none-brightgreen.svg" alt="Zero Dependencies">
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://qm.qq.com/q/nHfgBDS68o"><img src="https://img.shields.io/badge/QQ%E7%BE%A4-619357751-12b7f5.svg" alt="QQ Group"></a>
  <img src="https://img.shields.io/badge/platform-Web%20%2F%20PWA-orange.svg" alt="Platform">
</p>

<p align="center">
  <a href="#项目简介">项目简介</a> •
  <a href="#核心特性">核心特性</a> •
  <a href="#drunk-线路图智能转换系统">Drunk 转换系统</a> •
  <a href="#快速上手">快速上手</a> •
  <a href="#开发文档">开发文档</a> •
  <a href="#项目架构">项目架构</a> •
  <a href="#城市数据移植">城市移植</a> •
  <a href="#城市主理人与鸣谢">主理人与鸣谢</a> •
  <a href="#社区与技术交流">社区交流</a> •
  <a href="#开源许可协议">开源协议</a>
</p>

<p align="center">
  <img src="./assets/images/screenshot-1.png" alt="CGo OpenMap 界面预览" width="85%">
</p>

---

## 项目简介

**CGo OpenMap** 是一款专注于城市轨道交通线网可视化与交互的开源地图引擎。

项目采用原生 Web 技术栈构建，具备**开箱即用、轻量高效、零构建依赖**的特点，旨在为交通爱好者、城市规划研究者以及前端开发者提供可定制的交互式线路图解决方案。

> [!IMPORTANT]
> **🚨 核心架构重要大前提（最高技术铁律）**：  
> **本项目所有内容必须为纯前端，禁止使用任何其他技术（如 Node.js 服务端应用、PM2 进程守护/管理、Express/Koa 后端服务、React/Vue/Angular 重型框架及 Vite/Webpack 构建打包流程）**。项目始终遵循纯原生 Web 标准（HTML5、SVG、CSS3、Vanilla JS、Web Components），确保在任何静态 Web 服务器或托管平台（GitHub Pages、Cloudflare Pages、Nginx 纯静态目录等）开箱即用，零后端与构建依赖。  
> **📌 唯一破例例外场景**：仅在涉及**监控车站运营状态、监控目标网页**等特殊后台巡检或服务场景下，**可以破例**使用 Node.js / PM2 进行后台监控与进程守护；**其他所有主要地图功能一律严格禁止破例**，必须为纯原生前端实现！

目前引擎内置北京轨道交通、沈阳地铁、大连地铁、长春轨道交通、青岛轨道交通、合肥轨道交通、福州轨道交通与悉尼轨道交通（Sydney Trains / Sydney Metro）线网作为完整实现与参考范例，底层采用通用引擎与城市业务数据完全解耦的架构设计。开发者可以基于标准化数据格式，快速移植并部署任意城市（如广州、深圳、成都、武汉等）的轨道交通网络。

项目配套提供 **Drunk 线路图智能转换系统**，无需手动测量繁重的站点坐标，通过上传高清图片、矢量 PDF 或 Adobe Illustrator 工程，即可借助 AI 视觉大模型与矢量解析引擎一键生成符合规范的标准城市代码。

---

## 核心特性

- **纯前端与零框架依赖**：纯原生 Web 标准构建（HTML5、SVG、Vanilla JS、Web Components、CSS 变量）。**项目所有内容必须为纯前端**（除监控车站、监控网页等后台任务可破例外，**其他所有主要地图功能一律严格禁止破例**），无需任何打包构建工具，直接以静态资源方式即拷即用。
- **Drunk 智能转换工作台**：内置面向零基础小白与开发者的全自动/半自动制图工作台（`drunk/`）。支持底图图片、矢量 PDF 及 Adobe Illustrator (`.ai`) 工程直通解析，支持 DeepSeek 视觉多模态大模型拓扑识别、维基百科动态知识库自动校对、8 方向文字排版轮盘、45°/90° 正交网格吸附与标准城市代码一键导出。
- **原生矢量图形交互**：基于原生 SVG 渲染，支持无级平滑缩放、自由平移漫游与视口边界控制，原生适配桌面端鼠标滚轮及移动端多触点缩放手势。
- **深浅色主题适配**：内置深色（Dark）与浅色（Light）两套主题，支持跟随系统色彩偏好自动切换或手动锁定；高分屏下文字与矢量元素均保真呈现。
- **多维车站检索**：支持站名中英文、拼音全拼与首字母简拼、多音字及历史站名别名模糊匹配；检索命中后支持视口平滑定位与聚焦动效。
- **可定制的模块化车站信息板**：采用全解耦模块注册化架构（`core/station-board.js`）。各城市主理人可根据本市特点与运营需求，开箱即用或定制注入**文旅名胜指引**、**运行时刻信息**、**预计进站时间**、**换乘详情与走行指引**、**地面公交与打车接驳空间**、**站台结构图与电梯分布**、**母婴室/AED 设施指南**等丰富内容，所有模块支持自由开关、重排与跨选项卡调度。
- **精细化站点与线路模型**：提供车站信息图卡（换乘线路、运营归属、出入口信息）、站台换乘与楼梯结构示意图、首末班车时刻表查询接口、出站限时虚拟换乘映射，并支持基于高德地理坐标自动标定的示意图站间距智能估算与呈现。
- **位置辅助与服务联动**：基于浏览器 Geolocation API 计算临近站点与直线距离，支持一键调起外部地图导航与铁路枢纽服务。
- **城市专属品牌色与官方矢量徽标**：支持各城市自主登记官方主题标志色（`themeColor`，自动衍生深浅调色板，驱动主要操作、悬浮态与高亮，支持城市间彻底隔离防污染）与地铁官方矢量 Logo（`svglogo`），首页卡片等大自适应渲染并支持留空降级为标准小火车图标。
- **高内聚低耦合的多城市架构**：核心渲染引擎（`core/`）与城市业务配置（`city/`）彻底分离，新增城市仅需配置站点与走向数据，无需修改底层渲染逻辑。
- **PWA 离线支持**：内置 Service Worker 缓存策略与 Web App Manifest 配置，支持在主流桌面与移动操作系统上作为独立应用安装并离线使用。

---

## 快速上手

### 本地运行

由于项目使用了 ES Modules 与 Service Worker，需通过 HTTP/HTTPS 协议访问，建议使用任意静态 HTTP 服务器运行：

1. **克隆代码库**
   ```bash
   git clone https://github.com/CGo-Project/CGo-OpenMap.git
   cd CGo-OpenMap
   ```

2. **启动本地服务（任选一种）**
   - **VS Code**：安装 `Live Server` 插件，在编辑器右下角点击 **Go Live**（或右键 `index.html` / `main.html` 选择 **Open with Live Server**）。
   - **Node.js**：
     ```bash
     npx serve .
     ```
   - **Python 3**：
     ```bash
     python3 -m http.server 8080
     ```

3. **访问应用**
   在浏览器中打开 `http://localhost:8080`（或 Live Server 对应端口如 `http://127.0.0.1:5500`）即可查看。

> [!TIP]
> **开发与调试提示（Service Worker 强缓存）**：
> 本项目启用了原生 Service Worker 离线强缓存机制。修改代码或城市数据后，**务必同步更新 `sw.js` 中的 `CACHE_NAME` 缓存版本号**，否则更改可能不会生效。如果在调试时遇到**“怎么修改都不起作用、刷新无变化”**的情况，请优先排查是否是 Service Worker 缓存所致，可在浏览器 DevTools（F12）Network 面板中勾选 `Disable cache`，或执行硬性强制刷新（`Ctrl + F5` / `Cmd + Shift + R`）。

---

## Drunk 线路图智能转换系统

> [!WARNING]
> **早期开发验证阶段声明**：  
> **Drunk 转换系统目前处于早期开发验证阶段（Beta 1），仅供测试使用**。识别算法、图层解析与数据结构仍在持续迭代演进，导出结果建议人工复核。**热烈欢迎广大开发者、前端工程师与交通图爱好者共同参与核心算法与交互的协同开发！**（欢迎查阅 [CONTRIBUTING.md](./CONTRIBUTING.md) 提交 Pull Request 或 Issue 交流）

**Drunk** 是 CGo OpenMap 配套研发的轨道交通线路图全自动矢量化与移植转换工作台（位于 `drunk/` 目录，启动本地服务后直接访问 `http://localhost:8080/drunk/` 即可使用）。

### 解决的核心痛点
在以往手动移植新城市时，开发者需要人工丈量成百上千个车站的 `(x, y)` 坐标、逐站调整文字对齐方式（`align`）并逐条连通线路，耗时耗力。Drunk 将繁重的人工制图流程革命性地优化为：**上传底图 ➔ 智能提取 ➔ 可视微调 ➔ 一键导出**。

### 核心功能亮点
- **多格式底图直通**：支持 PNG/JPG 高清图片，更支持**矢量/扫描版 PDF 及 Adobe Illustrator (`.ai`) 工程**原生解析，直通提取 OCG 矢量图层、XMP 色板及中英文文字层。
- **DeepSeek 视觉多模态识图**：客户端直连 DeepSeek 官方多模态视觉模型（`deepseek-v4-flash-vision-exp`），按量计费透明（单次整网识别约 0.01~0.05 元，本站零加价零抽成，API Key 本地安全存储），高精解析全网拓扑。
- **维基百科知识库动态对齐**：动态拉取维基百科官方词条，结合 Levenshtein 模糊编辑距离，自动纠错站名与中英双语拼写。
- **所见即所得可视化微调**：幽灵底图透明度实时对比、站点圆点自由拖拽定位、**8 方向文字排版轮盘微调器**（秒级避让交叉线网）、**45°/90° 正交网格吸附**（一键矫正专业地铁图斜角）。
- **CGo OpenMap 标准工程导出**：内置数据完整性自检，一键生成开箱即用的 `data_stations.js`、`data_lines.js`、`data_legend.js` 及城市主逻辑文件。
- **识别结果自动净化**：自动剔除被误识别成车站的底图噪点（极端情况下一张图能「识别」出五六千个车站）、清洗脏站名、合并同名换乘站、剔除退化线路；再通过**墨迹吸附 + 最小二乘相似变换**把整体歪斜的识别结果拉回底图线条上。

### 编辑模式：Drunk 同时是任意已有城市的可视化编辑器

除了做新城市，Drunk 也是 **OpenMap 任意已注册城市的编辑模式**。入口有三个，任选其一：

- 线路图右上角 **「更多 → 偏好设置 → 编辑此图 → 打开编辑模式」**；
- Drunk 顶栏的城市下拉框，选中后点 **「编辑此图」**；
- 直接访问 `drunk/index.html?city={city_id}`。

**车站**：拖站、改中英文站名、切换车站类型、用 8 方向轮盘调站名朝向、用 `Alt + 方向键` 微调文字偏移、`Delete` 删站。

**线路**：点图例项或直接点画布上的线条即可选中，改线路名 / 标志色 / 运营公司；选中后线条上会出现走向折点手柄，**拖动折点改走向、双击线条插入折点、`Delete` 删折点**，分支线路的主线与各分支一并支持。

**圆角**：拐角折点显示为圆形手柄，选中后可调该拐角的圆角半径——滑块、数值输入或「自动 / 直角 / 8 斜角 / 18 直角弯 / 32 大弯」快捷预设。留空为自动（按夹角取 18px 或 8px），填 `0` 保持直角。画布预览与线路图实际渲染共用 `core/path-geometry.js` 同一份倒角实现，**所见即所得**。

`Ctrl/Cmd + Z` 撤销，`Ctrl/Cmd + S` 导出，`Esc` 取消选中。

> **导出是条目级无损回写**：只有你实际改动过的那几条会被重写，其余条目连同注释、缩进、字段顺序、手写换行**逐字节保持原样**。
> 悉尼车站的 `marker.parts` / `halo` / `labelSize`、北京的 `textScale` / `hideLabel`、线路的 `overlayStyle` 都不会在往返中被抹掉或重新排版——
> 改一座车站的朝向，`git diff` 里就只有 1 行；挪一条线路上的一个走向折点，也只有那一行 `{ x: …, y: … }` 会变，同线路其余几百个折点纹丝不动。

---

## 开发文档

针对不同角色与使用场景，项目提供了详细的开发与配置指南：

| 读者场景 | 推荐文档 | 说明 |
| :--- | :--- | :--- |
| 初学者入门 | [QUICKSTART.md](./QUICKSTART.md) | 面向零基础用户的开发环境配置与 AI 辅助开发指南 |
| 线路图智能转换与编辑 | [Drunk 工作台](./drunk/index.html) | 底图矢量化、PDF/AI 直通、AI 视觉拓扑提取，以及**已有城市的可视化编辑模式**（**早期测试阶段**） |
| AI 辅助开发 | [AGENTS.md](./AGENTS.md) | 面向各类 AI Coding Agent 的项目架构、解耦规范与数据标准 |
| 城市数据移植 | [PORTING.md](./PORTING.md) | 城市线网数据结构、站点坐标与线路图例配置说明 |
| 社区贡献规范 | [CONTRIBUTING.md](./CONTRIBUTING.md) | 代码贡献流程、城市主理人机制与 PR 自查清单 |

---

## 项目架构

项目目录采用引擎、转换工具与数据分层设计：

```text
openmap/
├── index.html                  # 欢迎首页门户 (城市列表动态排序与主理人名录)
├── main.html                   # 线路图核心交互画布 (SVG渲染引擎与业务层)
├── LICENSE                     # 双轨开源许可协议 (GNU AGPLv3 + ODbL 1.0)
├── CONTRIBUTING.md              # 社区贡献指南与主理人规范
├── AGENTS.md                   # AI Agent 规范与架构铁律
├── QUICKSTART.md               # 初学者快速上手手册
├── PORTING.md                  # 城市移植实操指南
├── README.md                   # 项目主说明文档
├── readme.html                 # 应用内说明弹窗
├── privacy.html                # 隐私政策说明
├── manifest.json               # PWA 配置文件
├── sw.js                       # Service Worker 离线缓存
├── drunk/                      # Drunk 转换工作台 + OpenMap 城市编辑模式 (早期测试版)
│   ├── index.html              # 沉浸式暗色工作台 (样式内联，drunk.css 目前未被引用)
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
├── docs/                       # 开发与配置文档
│   └── STATION_MODULE_GUIDE.md # 车站信息板自定义模块开发与配置指南
├── core/                       # 核心通用引擎 (多城市通用)
│   ├── script.js               # 主渲染引擎：SVG 绘制、视口变换与交互调度
│   ├── station-board.js        # 模块化车站信息板管理器与内置标准模块
│   ├── cgo-ui.js               # Web Components 组件库 (<cgo-icon> 等)
│   ├── settings.js             # 设置面板控制逻辑
│   ├── help.js                 # 帮助与关于弹窗逻辑
│   ├── notice.js               # 消息通知组件
│   └── tool-theme.js           # 主题切换与调色管理
├── city/                       # 城市数据层 (按城市解耦)
│   ├── data.js                 # 城市注册总线 (CITY_REGISTRY)
│   ├── beijing/                # 参考实现 (北京)
│   │   ├── beijing.js          # 城市特定业务逻辑、扩展与信息板模块编排
│   │   ├── modules/            # 城市专属定制模块 (如 beijing_cultural.js)
│   │   ├── data_stations.js    # 车站坐标、名称、属性与对齐配置
│   │   ├── data_lines.js       # 线路走向、站点序列与标志色
│   │   ├── data_legend.js      # 图例结构与分组展示
│   │   ├── data_timetable.js   # 车站首末班车时刻数据
│   │   ├── data_notopen.js     # 在建及未开通规划走向
│   │   ├── data_scattered.js   # 孤立/特殊连接线路段
│   │   ├── data_virtual_transfers.js # 虚拟换乘映射定义
│   │   ├── staname.csv         # 拼音检索与多音字库
│   │   └── stacard/            # 车站详情卡片与结构图组件
│   ├── shenyang/               # 社区贡献实现 (沈阳)
│   │   ├── shenyang.js         # 城市特定业务逻辑 (换乘站呼出线/方城文化地标等)
│   │   ├── style.css           # 城市专属样式表
│   │   ├── data_stations.js    # 车站数据 (1~4、9、10号线等)
│   │   ├── data_lines.js       # 线路走向与站间距配置
│   │   ├── data_legend.js      # 图例结构与分组展示
│   │   ├── data_timetable.js   # 首末班车时刻数据
│   │   ├── data_notopen.js     # 在建线路规划走向
│   │   ├── data_scattered.js   # 枢纽与地标装饰配置
│   │   ├── data_virtual_transfers.js # 虚拟换乘映射
│   │   ├── staname.csv         # 拼音检索与历史站名索引
│   │   └── stacard/            # 车站详情卡片组件
│   ├── hefei/                  # 社区贡献实现 (合肥)
│   │   ├── hefei.js            # 城市主逻辑与模块配置
│   │   ├── modules/            # 专属模块 (文旅、时刻表)
│   │   ├── data_stations.js    # 车站数据 (1~8号线及S1线)
│   │   ├── data_lines.js       # 线路走向与站间距配置
│   │   └── ...                 # 图例、卡片与时刻表数据
│   ├── qingdao/                # 社区贡献实现 (青岛)
│   │   ├── qingdao.js          # 城市主逻辑 (运营中心归属/综合交通换乘等)
│   │   ├── modules/            # 专属模块 (在建工程、工程名提示、更名历史、时刻表)
│   │   ├── data_stations.js    # 车站数据 (8条在运营及8段在建线路)
│   │   ├── data_lines.js       # 线路走向与快线配置
│   │   ├── assets/             # 海域轮廓底图与国铁/机场/轮渡图标
│   │   └── ...                 # 图例、卡片、更名库与在建数据
│   └── sydney/                 # 海外城市实现 (悉尼，逐像素复刻官方线网图)
│       ├── sydney.js           # 城市主逻辑 (官方站点图元画法与站名排版还原)
│       ├── style.css           # 底图配色、线宽与 Public Sans 站名排版
│       ├── data_stations.js    # 车站数据 (T1~T9 九线、M1 地铁及在建站点)
│       ├── data_lines.js       # 线路折线 (逐点提取自官方矢量图)
│       ├── assets/             # 官方底图静态图层 (海湾、端牌、注记) 与内嵌字体
│       └── ...                 # 图例、在建虚线与检索别名
├── css/                        # 样式系统
│   ├── style.css               # 地图引擎核心样式与图层布局
│   ├── cgo_clr.css             # 线路标志色与全局主题变量
│   ├── cgo_element.css         # UI 基础元素样式
│   ├── cgo_ui.css              # CGoUI 基础样式
│   └── cgo_components.css      # 车站卡片与检索面板样式
└── assets/                     # 静态资源
    ├── icons/                  # 应用与车站图标
    ├── svg/                    # 线路数字矢量徽标
    └── images/                 # 界面截图与演示资源
```

---

## 城市数据移植

制作新城市线路图可选择以下两种方式：

### 推荐方式：借助 Drunk 工作台全自动/半自动制图（早期测试版）
1. 启动本地服务，在浏览器访问 `http://localhost:8080/drunk/`（**必须经由静态服务器访问**，`file://` 协议下浏览器禁止 `fetch`，城市数据读不进来）；
2. 上传该城市的官方线路图底图、PDF 或 Illustrator (`.ai`) 文件；
3. 点击“视觉识图”或执行矢量解析，系统将自动识别全网拓扑、站点位置并匹配维基百科标准站名；
4. 在画布上按需微调站点位置，使用 8 方向轮盘调整站名避让，点击“45°/90°吸附”矫正斜角；
5. 点击“导出城市工程”，将自动生成的代码放入 `city/{city_id}/` 目录；
6. 在 `city/data.js` 中登记城市信息，在 `sw.js` 中更新缓存版本即可快速上线。
*(注：Drunk 目前为早期开发验证阶段，生成结果请予以测试复核，欢迎参与共建)*

> 城市上线之后的日常维护（挪站、改字、调站名朝向）同样回到 Drunk：
> 访问 `drunk/index.html?city={city_id}` 进入编辑模式，改完导出，覆盖回 `city/{city_id}/` 即可。

### 传统方式：手动编排配置
1. **新建城市目录**：在 `city/` 目录下建立对应城市文件夹（例如 `city/shanghai/`），参考 `city/beijing/`、`city/shenyang/`、`city/qingdao/` 或 `city/hefei/` 的数据文件结构。
2. **注册城市信息**：在 `city/data.js` 的 `CITY_REGISTRY` 中添加城市元数据（ID、画布尺寸、默认中心点与初始缩放比例）。
3. **录入站点与线路**：
   - 在 `data_stations.js` 中录入车站唯一 ID、画布坐标 `(x, y)`、中英文名称及文本对齐方式；
   - 在 `data_lines.js` 中配置线路序列、站点串联顺序 `stationIds` 与线路标志色；
   - 准备线路图标或直接复用 `assets/svg/` 中的通用矢量模板。
4. **定制模块化车站信息板（可选）**：
   - 在 `{city}.js` 中通过 `stationBoard` 字段自由开关、排序或新增车站信息模块；
   - 可在 `city/{city_id}/modules/` 下定制注入**文旅名胜**、**运行时刻**、**预计进站时间**、**换乘详情**、**接驳空间**、**站台结构**、**便民设施指南**等专属特色模块（详见 [模块开发指南](docs/STATION_MODULE_GUIDE.md)）。
5. **配置快捷方式与离线缓存**：
   - 在 `manifest.json` 的 `shortcuts` 中登记新城市快捷入口（`url: "./main.html?city={city_id}"`）；
   - 在 `sw.js` 中将新城市文件登记至 `ASSETS_TO_CACHE`，并递增 `CACHE_NAME` 版本号。**一定要更新 Service Worker，否则更改可能不会生效；若出现怎么修改都不起作用的情况，请优先排查 Service Worker 缓存。**
6. **本地验证**：启动本地服务器查看首页城市卡片与地图渲染效果，调整站名排版避免遮挡。

详细规范与进阶配置（如换乘站设置、分支线路、虚拟换乘等）请参阅 **[城市移植实操手册 (PORTING.md)](./PORTING.md)**。

---

## 城市主理人与鸣谢

本项目倡导**开放共建、各城自主主理**的运作模式。完整移植或长期维护特定城市数据的贡献者将作为该城市的官方主理人，其署名与个人主页链接将展示在应用界面（「关于与帮助」弹窗）、项目文档及数据注册表中。

- **北京线网**：[NaL](https://github.com/NokiaimuL/)（城市主理人） · SierraQin（运营数据支持） · Freedom Space（市郊铁路校对）
- **沈阳线网**：[jrzhang](https://github.com/beepingflijo)（城市主理人） · 从恒隆到细河（运营数据支持）
- **青岛线网**：[YoTra青通](https://github.com/YoTraYoungTraffic)（城市主理人）
- **合肥线网**：[Evin](https://github.com/walternie)（城市主理人）
- **上海线网**：[Ryan Si](https://github.com/ryan-si)（城市主理人）
- **大连线网**：[jrzhang](https://github.com/beepingflijo)（城市主理人） · duckinglim（运营数据支持）
- **长春线网**：[jrzhang](https://github.com/beepingflijo)（城市主理人）
- **悉尼线网**：[Ryan Si](https://github.com/ryan-si)（城市主理人）
- **平台架构**：[NaL](https://github.com/NokiaimuL/) & [Ryan](https://github.com/ryan-si)
- **地理数据**：[高德地图开放平台](https://lbs.amap.com/)

> **关于上游维护与兼容性**：
> 核心引擎将持续迭代演进（如寻路算法、时刻表联动、3D/实际走向视图等）。建议将新增城市数据通过 Pull Request 合入官方主库，官方团队将统一提供向后兼容支持与数据迁移维护。
> 欢迎查阅 **[社区贡献指南 (CONTRIBUTING.md)](./CONTRIBUTING.md)** 了解更多提交流程。

---

## 社区与技术交流

欢迎加入 **CGo OpenMap** 官方社群！无论你是轨道交通爱好者、前端技术开发者，还是想为自己的城市制作/认领线路图的城市主理人，都期待与你交流：

- **官方 QQ 交流群**：**619357751**
- **一键直达加群**：[👉 点击一键加入 CGo OpenMap 官方交流群](https://qm.qq.com/q/nHfgBDS68o)
- **手机 QQ 扫码入群**：

<p align="center">
  <img src="./assets/images/qq.png" alt="CGo OpenMap 官方 QQ 交流群二维码" width="220" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);">
  <br>
  <em>扫一扫二维码，加入 CGo OpenMap 官方交流群 (群号: 619357751)</em>
</p>

---

## 开源许可协议

本项目采用核心引擎与城市数据分离的**双轨开源协议**（详见 [LICENSE](./LICENSE)）：

1. **核心引擎与交互代码**（`core/`、`css/`、`index.html`、`main.html` 等）：遵循 **[GNU AGPLv3](./LICENSE)** 协议开源。任何基于网络服务器向公众提供在线地图交互服务的衍生版本，均须向用户公开完整源代码。
2. **城市地图与业务数据**（`city/` 目录）：遵循 **[ODbL 1.0 (Open Database License)](https://opendatacommons.org/licenses/odbl/)** 与 **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)** 协议共享。任何基于本项目数据衍生的公开线网数据，须保持同等协议开源。
3. **知识产权说明**：各城市轨道交通系统的官方标志、线路名称、官方标志色及运营数据版权归各属地运营公司所有。
