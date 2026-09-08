# 🚇 CGo OpenMap 城市移植与二次开发手册

> 本手册为 **CGo OpenMap 开源项目** 官方移植指南。通过本手册，你可以快速基于本项目的基础架构，从零制作任意城市（如上海、广州、深圳、成都、武汉、南京等）的轨道交通交互线路图。目前仓库中已提供北京（`city/beijing/`）与沈阳（`city/shenyang/`）两套完整城市的成熟实现范例供参考借鉴。

---

## 💡 移植核心理念

CGo OpenMap 采用了**核心渲染引擎与城市业务数据完全解耦**的设计模式：
- **核心引擎 (`core/`)**：负责 SVG 矢量渲染、缩放漫游、图层控制、UI 组件交互、手势支持、搜索定位与主题切换，**无需修改**。
- **城市数据 (`city/{city_id}/`)**：负责存储车站坐标、线路走向、站距、图例与时刻表，**这是你唯一需要填充和定制的部分**。

移植的核心工作在于**城市数据的配置与填充**，而非重写前端代码。

---

## 📂 文件结构速查

创建新城市时，请在 `city/` 下新建城市文件夹（例如 `city/shanghai/`），结构建议参考现有的 `city/beijing/` 或 `city/shenyang/`：

```text
city/shanghai/
├── shanghai.js                 # 城市特有业务逻辑与连通关系定义
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

## 🛠️ 第一步：注册新城市 (`city/data.js`)

打开 `city/data.js`，在 `CITY_REGISTRY` 中注册新城市的基础元数据：

```javascript
const CITY_REGISTRY = {
    "shanghai": {
        id: "shanghai",
        name: "上海",
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
        isDefault: true // 设为默认激活
    }
};
```

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
        hideLabel: false,           // 是否隐藏文本标签
        // (可选) 站点图元几何，仅在城市实现了自定义画法时才需要
        marker: { shape: "tick", angle: 90, long: 15, short: 7 }
    },
    // 更多车站...
};
```

> [!TIP]
> **自定义城市专属的站点画法**
>
> 各城市线网图对「普通站 / 换乘站」的画法差异很大：北京用同心圆点，上海则用垂直于线路的
> 线路色短横，换乘站是白底深灰描边的胶囊。若目标城市与内置画法不符，可在城市脚本中实现
> `renderStationIcon(station, stationId)` 钩子，返回 `{ html, width, height, className }`，
> 核心引擎会用它替换内置的 `SVGTemplates`；不实现该方法时行为完全不变。
>
> 配套的 `marker` 字段用来记录每座车站在原始矢量图中的图元几何：
> `shape`（`tick` 短横 / `capsule` 胶囊 / `circle` 圆形）、`angle`（长轴方向，度）、
> `long` / `short`（长短轴像素长度）。实现范例见 `city/shanghai/shanghai.js` 与
> `city/shanghai/style.css`。

### 2. 串联线路走向 (`data_lines.js`)

在 `data_lines.js` 中按运行顺序将车站连接为线路。

> [!NOTE]
> `pathPoints` 中的每个拐点都可以携带可选的 `r` 指定圆角半径：省略时引擎按 90°=18px、
> 45°=8px 自动倒角；显式写 `r: 0` 则完全按折线原样绘制，适合从官方矢量图直接提取、
> 拐角本身已是贝塞尔圆弧的走向数据（再次倒角会造成曲率失真）。

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

## 🚀 第五步：在 `main.html` 中引入城市数据脚本

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

## ⚡ 第六步：更新 Service Worker 离线缓存 (`sw.js`)

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