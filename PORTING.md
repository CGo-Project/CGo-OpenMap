# 🚇 CGo OpenMap 城市移植与二次开发手册

> 本手册为 **CGo OpenMap 开源项目** 官方移植指南。通过本手册，你可以快速基于本项目的基础架构，从零制作任意城市（如上海、广州、深圳、成都、武汉、南京等）的轨道交通交互线路图。目前仓库中已提供北京（`city/beijing/`）与沈阳（`city/shenyang/`）两套完整城市的成熟实现范例供参考借鉴。

---

## 💡 移植核心理念

CGo OpenMap 采用了**核心渲染引擎与城市业务数据完全解耦**的设计模式：
- **核心引擎 (`core/`)**：负责 SVG 矢量渲染、缩放漫游、图层控制、UI 组件交互、手势支持、搜索定位与主题切换，**无需修改**。
- **城市数据 (`city/{city_id}/`)**：负责存储车站坐标、线路走向、站距、图例与时刻表，**这是你唯一需要填充和定制的部分**。

为了大幅降低新城市制图门槛，项目提供了两种数据制作途径：
1. **途径一（强烈推荐）：使用 Drunk 智能转换工作台（全自动/半自动制图，测试版）**；
2. **途径二（底层参考）：纯手动测量坐标与编写数据脚本**。

---

## 🍺 途径一：使用 Drunk 智能转换工作台（推荐，早期测试版）

> [!WARNING]
> **早期开发验证阶段说明**：  
> **Drunk 线路图智能转换系统（`drunk/`）当前处于早期开发验证阶段（Beta 1），仅供测试与实验使用**。系统算法、矢量提取与大模型解析机制仍在持续迭代，导出数据建议进行人工校验。**极其欢迎广大开发者与社区爱好者共同参与核心算法优化与协同开发！**

以往手动移植城市时，最大的痛点在于人工测量并录入数百个站点的 `(x, y)` 像素坐标，并反复调整文字避让方向。**Drunk 工作台**（位于项目 `drunk/` 目录）将这一流程实现了可视化与自动化。

### Drunk 5 步极速制图流程：

1. **启动并进入工作台**：
   启动本地静态服务（如 `npx serve .`），在浏览器中打开 `http://localhost:8080/drunk/`（全深色模式沉浸式界面）。
2. **上传任意底图 / 矢量文件**：
   点击顶栏「上传底图/PDF/AI」，支持：
   - 官方位图格式（PNG, JPG, WebP）；
   - **矢量 PDF 文件** 与 **Adobe Illustrator (`.ai`) 矢量工程**（内置 Mozilla PDF.js 引擎直接提取矢量线条、OCG 图层与 XMP 色板，保真度极高）。
3. **启动智能识图与拓扑提取**：
   - **PDF/AI 矢量直通**：直接从图层抽取坐标与色板，极速还原；
   - **位图图像识图**：点击「API 设置」填入 DeepSeek API Key（仅保存在浏览器本地，直连官方 API，单次识图仅需约 0.01~0.05 元，本站完全免费零抽成），点击「视觉识图」，系统将自动识别全网线路、走向与换乘关系；
   - **维基百科动态对齐**：系统自动检索 Wikipedia 地铁词条，通过 Levenshtein 模糊算法自动补齐中英文站名与消歧义。
4. **所见即所得可视化微调**：
   - **幽灵底图对比**：调节顶栏对比滑块，重叠对比原图与矢量线网；
   - **站点拖拽**：鼠标直接按住圆点拖动微调物理坐标；
   - **8 方向文字轮盘**：选中站点后，在右侧面板点击 8 方向轮盘（`↖ ↑ ↗ ← ● → ↙ ↓ ↘`），秒级切换站名朝向避让线路；
   - **45°/90°吸附**：点击一键吸附，将微小抖动矫正为专业正交地铁图斜角。
5. **一键导出标准代码**：
   点击「导出城市工程」，系统自动通过 5 项完整性自检（站间距、ID引用、换乘点共用等），一键生成 `data_stations.js`、`data_lines.js`、`data_legend.js` 及城市主逻辑代码，直接保存至 `city/{city_id}/` 目录即可！

---

## 📂 文件结构速查

创建新城市时，请在 `city/` 下新建城市文件夹（例如 `city/shanghai/`），结构建议参考现有的 `city/beijing/` 或 `city/shenyang/`：

```text
city/shanghai/
├── shanghai.js                 # 城市特有业务逻辑、连通关系与信息板模块编排
├── modules/                    # 城市专属定制模块目录 (文旅/设施/接驳/时刻等)
│   └── cultural_tip.js         # 示例：文旅地标或特色服务模块
├── data_stations.js            # 车站列表 (坐标、名称、类型、对齐方式)
├── data_lines.js               # 线路列表 (线路颜色、站点序列、站间距、运营单位)
├── data_legend.js              # 图例面板展示结构与线路分组
├── data_timetable.js           # 车站首末班车时刻数据
├── data_notopen.js             # 在建/规划未开通线路数据
├── data_virtual_transfers.js   # 出站虚拟换乘/站外连通配置
├── data_scattered.js           # 特殊单线段或孤立支线
└── staname.csv                 # 智能搜索别名/多音字/旧站名索引库
```

素材文件：
- `assets/svg/`：目标城市的线路徽标 SVG 图标（如 `icon@01.svg`）。
- `assets/icons/`：目标城市的特色车站或地标徽标。

---

## 🛠️ 途径二：纯手动编排配置（进阶参考与底层规范）

如果你希望从底层手动定义每一个车站与走向，或者对 Drunk 导出的代码进行深度手工定制，请遵循以下标准化步骤：

### 第一步：注册新城市 (`city/data.js`)

打开 `city/data.js`，在 `CITY_REGISTRY` 中注册新城市的基础元数据：

```javascript
const CITY_REGISTRY = {
    "shanghai": {
        id: "shanghai",
        name: "上海",
        themeColor: "#b72626", // 城市专属主题色：用于页面按钮、高亮与边框（支持 3/6/8 位 Hex，留空则使用默认蓝色）
        svglogo: '<svg xmlns="http://www.w3.org/2000/svg"><path d="..."/></svg>', // 城市官方矢量徽标：用于首页城市卡片右上角（收录去色去 viewBox，留空默认显示小火车图标）
        folder: "./city/shanghai",
        mainLogic: "./city/shanghai/shanghai.js",
        // 地图初始视图中心点与缩放比例
        center: { x: 1000, y: 800 },
        defaultScale: 1.0,
        // 画布总尺寸 (根据线网图宽高设定)
        mapSize: { width: 2200, height: 1800 },
        // 高德地图检索所属行政区名称
        searchCity: "上海",
        // 网页元数据
        title: "CGo OpenMap - 上海轨道交通线路图",
        keywords: "上海地铁, 申通地铁, 线路图, 轨道交通",
        description: "由 CGo OpenMap 驱动的上海轨道交通智能交互线路图",
        isDefault: false
    }
};
```

#### 🎨 城市视觉定制字段规范：
1. **`themeColor` (城市专属主题色)**：
   - **核心作用**：定制该城市在线路图画布页（`main.html`）与首页城市卡片（`index.html`）中的专属主色调（自动衍生深浅调色板，驱动主要按钮、悬浮态、边框高亮等，且不同城市间彻底隔离防污染）。
   - **格式规范**：支持标准 Hex 颜色（推荐 6 位 Hex 如 `#b72626`、`#c60a16`，引擎亦兼容 3 位与 8 位 Hex）。若配置为 `null`、`""` 或留空，系统将自动回退使用全局经典深蓝色（`#00263b`）。
2. **`svglogo` (城市官方矢量徽标)**：
   - **核心作用**：在门户首页（`index.html`）的城市卡片右上角展示该城市轨道交通官方矢量 Logo（替换默认的小火车 `train` 图标）。
   - **格式规范**：
     - **去色**：去除写死的 `fill` 颜色属性，引擎将自动注入 `currentColor`，使其在浅色模式、深色模式及鼠标悬停卡片反白状态下均保持完美一致；
     - **去 viewBox**：收录时去除 `viewBox` 与 XML 头部声明（引擎在渲染时通过智能量级初筛与 `getBBox()` 自动自适应充满 `22px × 22px` 视口，无论原始坐标系是 100 还是 1024 均等大保真居中呈现）；
     - **留空降级**：若未填入或留空（`svglogo: ""`），系统默认显示经典小火车图标。

> [!TIP]
> **同步配置 PWA 应用快捷直达方式 (`manifest.json`)**：
> 完成城市基础信息注册后，请在项目根目录的 `manifest.json` 中，将新城市加入到 `shortcuts` 数组中。这样安装为 PWA 应用的用户即可在桌面端右键图标或在移动设备上长按应用图标，直接唤起新城市的线路图：
> ```json
> {
>   "name": "上海轨道交通",
>   "short_name": "上海",
>   "description": "查看上海轨道交通线网图",
>   "url": "./main.html?city=shanghai",
>   "icons": [
>     {
>       "src": "./assets/icons/icon-192.png",
>       "sizes": "192x192",
>       "type": "image/png"
>     }
>   ]
> }
> ```

---

## 🎨 第二步：准备线路徽标 (`assets/svg/`)

为目标城市准备各条线路的 SVG 徽标图标：
- **复用现有模板（推荐）**：本项目已内置常用的矢量徽标模板（`assets/svg/icon@01.svg` ~ `icon@57.svg`，完整覆盖 1~40 号线及常用命名专线，详见 [assets/svg 对照表](assets/svg/README.md)）。模板内部采用 CSS 变量动态驱动，**无需重新绘制 SVG 文件**。
- **动态颜色绑定**：在 `data_lines.js` 中配置对应线路的 `color` / `svgclr`（图标背景色）与 `svgtext`（图标文字颜色）属性，系统即可自动为 SVG 图标注入相应颜色。
- **自定义特殊图标**：如需添加有轨电车、市域快线或特殊专线图标，可按统一规则命名（如 `icon@apmr.svg`）存入 `assets/svg/` 目录，图标建议为标准正方形或统一比例的 SVG 矢量图。


---

## 🖱️ 第三步：编排车站与线路数据

### 1. 采集与编写车站坐标 (`data_stations.js`)

在 `data_stations.js` 中定义所有车站的相对坐标、名称与排版属性：

```javascript
const stationsData = {
    // 建议使用标准格式的 Station ID，如 "M101"
    "M101": {
        type: "dot",                // 类型: dot(普通站), tsf(换乘站), no(暂缓开通), rdot(国铁火车站)
        x: 820,                     // 画布 X 坐标 (像素)
        y: 640,                     // 画布 Y 坐标 (像素)
        cn: "人民广场",              // 中文站名
        en: "People's Square",      // 英文站名
        align: "top-right",         // 文字相对锚点位置: top, bottom, left, right, top-left 等
        offset: { x: 4, y: -2 },    // 文字微调偏移量
        textScale: { cn: 1.0, en: 1.0 }, // 字符宽高微调
        hideLabel: false            // 是否隐藏文本标签
    },
    // 更多车站...
};
```

### 2. 串联线路走向 (`data_lines.js`)

在 `data_lines.js` 中按运行顺序将车站连接为线路：

```javascript
const linesData = [
    // 基础单线示例
    {
        id: "M1",
        name: "1号线",
        color: "#E4002B",            // 线路主题色 (Hex)
        svg: "icon@01.svg",          // 关联的线路 SVG 徽标
        company: "上海地铁第一运营公司", // 运营单位
        stationIds: [                // 按运行顺序填入车站 ID
            "M101", "M102", "M103", "M104"
        ],
        distances: [                 // 站间距 (米)，长度为 stationIds.length - 1
            1200, 1500, 980
        ]
    },
    // 环线示例 (如 4号线)
    {
        id: "M4",
        name: "4号线",
        color: "#5B2C84",
        isLoop: true,                // 声明为环线
        stationIds: ["M401", "M402", "M403", "M404"],
        distances: [1100, 1250, 1300, 950],     // 顺时针站距 (长度与 stationIds 相同)
        distances2: [950, 1300, 1250, 1100]    // 逆时针站距 (可选反向站距)
    },
    // 分支 / Y 字形线路示例 (如 11号线主支线)
    {
        id: "M11",
        name: "11号线",
        color: "#852655",
        hasbranch: true,             // 声明含分支
        "stationIds-way1": ["M1101", "M1102", "M1103", "M1104"], // 主线+支线1
        "stationIds-way2": ["M1101", "M1102", "M1105", "M1106"], // 主线+支线2
        "distances-way1": [1300, 1400, 1200],
        "distances-way2": [1300, 1800, 1500]
    }
];
```

### 3. 配置在建与规划未开通线路 (`data_notopen.js`)

对于正在建设中的线路，可在 `data_notopen.js` 中定义平滑虚线走向：

```javascript
const NOT_OPEN_LINES = [
    {
        name: "在建18号线二期",
        points: [
            { x: 500, y: 300 },
            { x: 550, y: 300 },
            { x: 600, y: 350 }
        ],
        style: {
            color: "#D6A841",
            width: "3.4",
            dashArray: "6,4"
        }
    }
];
```

### 4. 配置虚拟换乘与出站连通 (`data_virtual_transfers.js`)

对于出站换乘或同站名不同站厅的特殊车站：

```javascript
const VIRTUAL_FREE_TRANSFER_MAP = {
    // 格式: "主车站ID": ["可虚拟换乘的车站ID_1", "可虚拟换乘的车站ID_2"]
    "M1205": ["M1308"] // 如南京西路 12/13 号线出站换乘
};
```

---

## 🔍 第四步：构建图例与检索别名

1. **图例面板 (`data_legend.js`)**：按照运营制式（如市区地铁、市域铁路、轻轨、磁浮）对线路进行分组归类，配置图例显示。
2. **搜索别名 (`staname.csv`)**：建立旧站名、别名、粤拼/拼音与多音字的映射，增强搜索框的识别能力。

---

## 🧩 第五步：车站信息板模块配置与自定义扩展（可选）

CGo OpenMap 支持**车站信息板模块注册化**架构（由 `core/station-board.js` 统一调度）。城市主理人无需修改底层核心，即可根据本地城市的特点与实际乘客服务需求，随心定制以下 7 大维度的特色服务模块：

1. 🏛️ **文旅信息定制**：
   - 提取重点文旅车站周边的历史名胜、红色旅游路线、城市商圈与网红打卡地标；
   - 示例：北京的天安门东/前门文化小贴士、沈阳的盛京方城文化导览等。
2. ⏱️ **运行时刻信息**：
   - 定制各线路各运行方向的首末班车发车时间表、早晚高峰及平峰发车间隔；
   - 支持多方向班次独立展开与末班车倒计时提醒。
3. ⏳ **预计进站时间**：
   - 定制列车实时预计到站时间看板、即将进站提示动效或模拟运营频次预测看板。
4. 🔄 **换乘详情与走行耗时**：
   - 展现同台换乘（同向/反向）、地下连通道换乘、出站虚拟限时免费换乘指引；
   - 标明换乘步行距离与预估耗时（如“换乘通道约 120 米，步行约 2 分钟”）。
5. 🚌 **接驳空间与微循环交通**：
   - 汇总各出入口周边的地面常规公交线路、微循环接驳巴士、出租车/网约车即停即走区；
   - 标注周边 P+R 驻车换乘停车场位置与共享单车集中停靠点。
6. 🏗️ **站台结构与最佳乘车位置**：
   - 直观呈现岛式/侧式站台平面示意、楼梯与自动扶梯上下行方向；
   - 标明垂直无障碍电梯所在车厢位置、列车车厢编号与最佳换乘车门（如“4号车厢2门下车直达换乘通道”）。
7. 🍼 **设施指南与便民服务**：
   - 明确标示站内母婴关爱室、无障碍卫生间、AED 自动体外除颤仪、便民轮椅与盲道分布；
   - 整合便民充电宝、自动售药售货机、行李寄存处与失物招领中心联系方式。

### 调控与开发方式速览：

#### 1. 在 `{city}.js` 中调控内置与自定义模块
```javascript
// 在 city/{city_id}/{city_id}.js 中
stationBoard: {
    modules: {
        // 开关或调整内置模块顺序
        'stacard': { enabled: true, order: 10 },
        'adjacent-stations': { enabled: true, order: 20 },
        'transfers': { enabled: true, order: 30 },
        'operators': { enabled: false }, // 例如关闭运营商显示

        // 启用城市专属自定义模块
        'my-city-cultural': { enabled: true, targetTab: 'station-info', order: 15 },
        'platform-guide': { enabled: true, targetTab: 'line-tab', order: 25 }
    }
}
```

#### 2. 在 `city/{city_id}/modules/` 下编写模块逻辑
```javascript
// city/{city_id}/modules/cultural.js
window.StationBoard.registerModule({
    id: 'my-city-cultural',
    name: '文旅名胜指引',
    targetTab: 'station-info',
    order: 15,
    shouldRender({ station }) {
        return Boolean(station.culturalTips);
    },
    render({ station }) {
        return `<div class="station-culture-tip">🏛️ ${station.culturalTips}</div>`;
    }
});
```

#### 3. 在 `{city}.js` 顶部同步加载模块脚本
```javascript
// 城市专属模块通过 document.write 同步加载，确保在核心引擎执行前就绪
if (typeof document !== 'undefined' && document.write) {
    document.write('<script src="' + folder + '/modules/cultural.js?v=' + v + '"><\/script>');
}
```

> 📖 **完整开发规范与更多案例**：请查阅官方完整手册 [《车站信息板自定义模块开发与配置指南》](docs/STATION_MODULE_GUIDE.md)。

---

## 🚀 第六步：在 `main.html` 中引入城市数据脚本

在 `main.html` 的底部脚本加载区，系统已配置动态按需加载，亦可直接通过 `main.html?city={city_id}` 动态访问。若需要硬编码调试，可将相关数据脚本指向你的新城市目录（例如 `shanghai`）：

```html
<!-- 城市业务逻辑与数据配置 -->
<script src="city/shanghai/shanghai.js"></script>
<script type="module" src="city/shanghai/stacard/script.js"></script>
<script src="city/shanghai/data_stations.js"></script>
<script src="city/shanghai/data_lines.js"></script>
<script src="city/shanghai/data_virtual_transfers.js"></script>
<script src="city/shanghai/data_scattered.js"></script>
<script src="city/shanghai/data_legend.js"></script>
<script src="city/shanghai/data_timetable.js"></script>
<script src="city/shanghai/data_notopen.js"></script>
```

---

## ⚡ 第七步：更新 Service Worker 离线缓存 (`sw.js`)

> [!IMPORTANT]
> **🚨 极其关键步骤：务必更新 Service Worker，否则更改可能不会生效！**
> 本项目采用原生 Service Worker（`sw.js`）实现全站离线运行与强缓存。
> 1. **登记资源与升级版本**：制作新城市或修改已有数据后，**必须在 `sw.js` 中同步递增 `CACHE_NAME` 版本号**（例如由 `'cgo-openmap-v260904.010000'` 升级为 `'cgo-openmap-v260904.020000'`），并将该城市新建的所有数据与资源路径登记至 `ASSETS_TO_CACHE` 数组中。
> 2. **排错第一准则**：在开发与调试过程中，**如果出现了“明明代码已经修改，但在浏览器刷新后毫无变化、怎么修改都不起作用”的情况，请务必首先思考是否是 Service Worker 强缓存导致的可能性！**
> 3. **本地调试技巧**：按 `F12` 打开浏览器开发者工具，在 **Network** 标签页勾选 **`Disable cache (停用缓存)`**，或在 **Application -> Service Workers** 中勾选 **`Update on reload`** 或直接点击 **`Unregister`** 注销缓存，确保加载到最新代码。

---

## ✅ 发布前自查清单

- [ ] **视觉效果**：所有车站和线路在亮色与暗色模式下对比度是否清晰？
- [ ] **多线换乘**：多条线路交叉的换乘站，坐标是否已统一对齐至同一物理坐标点？
- [ ] **搜索测试**：在搜索栏中输入中文、英文或拼音缩写，能否准确定位车站？
- [ ] **图例联动**：点击图例中的线路，是否能正常高亮对应线路？
- [ ] **定位功能**：在移动端或浏览器中点击定位按钮，能否正确计算出最近的车站？
- [ ] **PWA Shortcuts**：已在 `manifest.json` 的 `shortcuts` 列表中登记新城市快捷直达入口？
- [ ] **Service Worker 缓存**：已在 `sw.js` 中将新城市文件加入预缓存列表，并已更新 `CACHE_NAME` 版本号（避免更改不生效）？

---

## 🏆 第七步：提交 PR 并成为官方「城市主理人」

在本地测试完成后，**强烈建议并欢迎你将该城市数据提交 Pull Request 合入官方主仓库**！

### 为什么一定要回传到官方主仓库？

1. **🌟 尊享官方「城市主理人」专属署名**：
   - 你的名字与 GitHub 个人主页将被写入 `city/data.js` 的 `maintainers` 字段，并在系统的 **「关于与帮助」弹窗**、官方 `README.md` 中动态展示与致谢（如同北京主理人 NaL、沈阳主理人 jrzhang 一样）！
2. **🛡️ 终身享有底层引擎的平滑升级保障（技术反制保障）**：
   - CGo OpenMap 核心引擎正在持续高速演进（包括即将到来的换乘路径寻路算法、时刻表联动、3D模式联动及图形性能大重构）。
   - **合入官方主库的城市**：官方核心团队承诺负责向后兼容性测试、自动化数据迁移以及 Bug 维护，确保你的城市始终享有最新的引擎特性；
   - **脱离主库的私有分支**：由于脱离统一维护生态，引擎迭代时私有格式将迅速失配破损，自行维护成本极高。
3. **⚖️ 遵守开源协议规范**：
   - 本项目数据遵循 **ODbL 1.0 / CC BY-SA 4.0** 相同方式共享协议，开源回馈也是开源社区互利互惠的优良传统。

👉 **立即阅读 [社区贡献指南 (CONTRIBUTING.md)](./CONTRIBUTING.md)，发起你的第一个 Pull Request 吧！**