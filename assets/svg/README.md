# 线路徽标矢量图标对照表 (SVG Icons Mapping)

本目录（`assets/svg/`）存放 CGo-OpenMap 系统内置的线路数字徽标与专用线路徽标（`icon@01.svg` ~ `icon@57.svg`）。

所有内置 SVG 模板均采用 **CSS 变量动态驱动**，通过在宿主页面或元素上指定以下两个 CSS 变量即可动态改变图标颜色，无需重新绘制矢量图：
- `--svgclr`: 徽标填充主底色（通常与线路 `color` 同步）。
- `--svgtext`: 徽标文字与边框前景颜色（通常为 `#ffffff` 或适合的文字颜色）。

> [!IMPORTANT]
> **编号映射特别提示**：
> 内置图标并非严格按照 1~57 的纯数字顺序连续排列。其中包含常用数字线路（覆盖 **1 ~ 40 号线**）、特殊命名线路（如八通线、大兴线等）、有轨电车、机场快线以及市郊铁路与国铁徽标。
> 各城市的线路配置文件（如 `data_lines.js`）请参照本表选择正确的图标文件。

---

## 📋 全量图标对照清单（按文件名排序）

| 图标文件名 | 中文名称 | 英文标识 | 类别 | 备注说明 |
|:---|:---|:---|:---|:---|
| `icon@01.svg` | 1号线 | Line 1 | 数字线路 | 通用数字线路模板 |
| `icon@02.svg` | 2号线 | Line 2 | 数字线路 | 通用数字线路模板 |
| `icon@03.svg` | 3号线 | Line 3 | 数字线路 | 通用数字线路模板 |
| `icon@04.svg` | 4号线 | Line 4 | 数字线路 | 通用数字线路模板 |
| `icon@05.svg` | 5号线 | Line 5 | 数字线路 | 通用数字线路模板 |
| `icon@06.svg` | 6号线 | Line 6 | 数字线路 | 通用数字线路模板 |
| `icon@07.svg` | 7号线 | Line 7 | 数字线路 | 通用数字线路模板 |
| `icon@08.svg` | 8号线 | Line 8 | 数字线路 | 通用数字线路模板 |
| `icon@09.svg` | 9号线 | Line 9 | 数字线路 | 通用数字线路模板 |
| `icon@10.svg` | 10号线 | Line 10 | 数字线路 | 通用数字线路模板 |
| `icon@11.svg` | 11号线 | Line 11 | 数字线路 | 通用数字线路模板 |
| `icon@12.svg` | 12号线 | Line 12 | 数字线路 | 通用数字线路模板 |
| `icon@13.svg` | 13号线 | Line 13 | 数字线路 | 通用数字线路模板 |
| `icon@14.svg` | 14号线 | Line 14 | 数字线路 | 通用数字线路模板 |
| `icon@15.svg` | 15号线 | Line 15 | 数字线路 | 通用数字线路模板 |
| `icon@16.svg` | 16号线 | Line 16 | 数字线路 | 通用数字线路模板 |
| `icon@17.svg` | 17号线 | Line 17 | 数字线路 | 通用数字线路模板 |
| `icon@18.svg` | 18号线 | Line 18 | 数字线路 | 通用数字线路模板 |
| `icon@19.svg` | 19号线 | Line 19 | 数字线路 | 通用数字线路模板 |
| `icon@20.svg` | 22号线 | Line 22 | 数字线路 | 通用数字线路模板（注意：对应 22号线） |
| `icon@21.svg` | 28号线 | Line 28 | 数字线路 | 通用数字线路模板（注意：对应 28号线） |
| `icon@22.svg` | 八通线 | Batong Line | 命名专线 | 北京八通线专用徽标 |
| `icon@23.svg` | 大兴线 | Daxing Line | 命名专线 | 北京大兴线专用徽标 |
| `icon@24.svg` | 亦庄线 | Yizhuang Line | 命名专线 | 北京亦庄线专用徽标 |
| `icon@25.svg` | 房山线 | Fangshan Line | 命名专线 | 北京房山线专用徽标 |
| `icon@26.svg` | 燕房线 | Yanfang Line | 命名专线 | 北京燕房线专用徽标 |
| `icon@27.svg` | S1线 | S1 Line | 磁浮专线 | 北京S1线中低速磁浮专用徽标 |
| `icon@28.svg` | 昌平线 | Changping Line | 命名专线 | 北京昌平线专用徽标 |
| `icon@29.svg` | 西郊线 | Xijiao Line | 有轨电车 | 北京西郊线专用徽标 |
| `icon@30.svg` | 亦庄T1线 | Yizhuang T1 Line | 有轨电车 | 北京亦庄T1线有轨电车专用徽标 |
| `icon@31.svg` | 首都机场线 | Capital Airport Express | 机场快线 | 首都机场线专用徽标 |
| `icon@32.svg` | 大兴机场线 | Daxing Airport Express | 机场快线 | 大兴机场线专用徽标 |
| `icon@33.svg` | 20号线 | Line 20 | 数字线路 | 通用数字线路模板（注意：对应 20号线） |
| `icon@34.svg` | 21号线 | Line 21 | 数字线路 | 通用数字线路模板（注意：对应 21号线） |
| `icon@35.svg` | 23号线 | Line 23 | 数字线路 | 通用数字线路模板（注意：对应 23号线） |
| `icon@36.svg` | 24号线 | Line 24 | 数字线路 | 通用数字线路模板（注意：对应 24号线） |
| `icon@37.svg` | 25号线 | Line 25 | 数字线路 | 通用数字线路模板（注意：对应 25号线） |
| `icon@38.svg` | 26号线 | Line 26 | 数字线路 | 通用数字线路模板（注意：对应 26号线） |
| `icon@39.svg` | 27号线 | Line 27 | 数字线路 | 通用数字线路模板（注意：对应 27号线） |
| `icon@40.svg` | 29号线 | Line 29 | 数字线路 | 通用数字线路模板（注意：对应 29号线） |
| `icon@41.svg` | 30号线 | Line 30 | 数字线路 | 通用数字线路模板（注意：对应 30号线） |
| `icon@42.svg` | 31号线 | Line 31 | 数字线路 | 通用数字线路模板（注意：对应 31号线） |
| `icon@43.svg` | 32号线 | Line 32 | 数字线路 | 通用数字线路模板（注意：对应 32号线） |
| `icon@44.svg` | 33号线 | Line 33 | 数字线路 | 通用数字线路模板（注意：对应 33号线） |
| `icon@45.svg` | 34号线 | Line 34 | 数字线路 | 通用数字线路模板（注意：对应 34号线） |
| `icon@46.svg` | 35号线 | Line 35 | 数字线路 | 通用数字线路模板（注意：对应 35号线） |
| `icon@47.svg` | 36号线 | Line 36 | 数字线路 | 通用数字线路模板（注意：对应 36号线） |
| `icon@48.svg` | 37号线 | Line 37 | 数字线路 | 通用数字线路模板（注意：对应 37号线） |
| `icon@49.svg` | 38号线 | Line 38 | 数字线路 | 通用数字线路模板（注意：对应 38号线） |
| `icon@50.svg` | 39号线 | Line 39 | 数字线路 | 通用数字线路模板（注意：对应 39号线） |
| `icon@51.svg` | 40号线 | Line 40 | 数字线路 | 通用数字线路模板（注意：对应 40号线） |
| `icon@52.svg` | 城市副中心线 | Sub-Center Line | 市郊铁路 | 北京市郊铁路城市副中心线 (S1) |
| `icon@53.svg` | S2线 | S2 Line | 市郊铁路 | 北京市郊铁路 S2线 |
| `icon@54.svg` | 怀柔-密云线 | Huairou-Miyun Line | 市郊铁路 | 北京市郊铁路怀柔-密云线 (S5) |
| `icon@55.svg` | 通密线 | Tongmi Line | 市郊铁路 | 北京市郊铁路通密线 (S6) |
| `icon@56.svg` | 中国铁路 | China Railway | 国铁线路 | 中国国家铁路通用徽标 (CR) |
| `icon@57.svg` | 京雄快线 | Jingxiong Express | 市域快线 | 北京/雄安新区京雄快线 (R1) |

---

## 🔍 快速反查索引

### 1. 普适性数字线路快速反查（1号线 ~ 40号线及国家铁路）

| 线路名称 | 对应 SVG 图标 | 线路名称 | 对应 SVG 图标 | 线路名称 | 对应 SVG 图标 | 线路名称 | 对应 SVG 图标 |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **1号线** | `icon@01.svg` | **11号线** | `icon@11.svg` | **21号线** | `icon@34.svg` | **31号线** | `icon@42.svg` |
| **2号线** | `icon@02.svg` | **12号线** | `icon@12.svg` | **22号线** | `icon@20.svg` | **32号线** | `icon@43.svg` |
| **3号线** | `icon@03.svg` | **13号线** | `icon@13.svg` | **23号线** | `icon@35.svg` | **33号线** | `icon@44.svg` |
| **4号线** | `icon@04.svg` | **14号线** | `icon@14.svg` | **24号线** | `icon@36.svg` | **34号线** | `icon@45.svg` |
| **5号线** | `icon@05.svg` | **15号线** | `icon@15.svg` | **25号线** | `icon@37.svg` | **35号线** | `icon@46.svg` |
| **6号线** | `icon@06.svg` | **16号线** | `icon@16.svg` | **26号线** | `icon@38.svg` | **36号线** | `icon@47.svg` |
| **7号线** | `icon@07.svg` | **17号线** | `icon@17.svg` | **27号线** | `icon@39.svg` | **37号线** | `icon@48.svg` |
| **8号线** | `icon@08.svg` | **18号线** | `icon@18.svg` | **28号线** | `icon@21.svg` | **38号线** | `icon@49.svg` |
| **9号线** | `icon@09.svg` | **19号线** | `icon@19.svg` | **29号线** | `icon@40.svg` | **39号线** | `icon@50.svg` |
| **10号线** | `icon@10.svg` | **20号线** | `icon@33.svg` | **30号线** | `icon@41.svg` | **40号线** | `icon@51.svg` |

普适性国铁徽标：

| 线路名称 | 对应 SVG 图标 | 类别 |
|:---|:---|:---|
| **中国铁路** | `icon@56.svg` | 国家铁路 (CR) |

---

### 2. 北京专用线路内容

| 线路名称 | 对应 SVG 图标 | 类别 |
|:---|:---|:---|
| **八通线** | `icon@22.svg` | 命名地铁专线 |
| **大兴线** | `icon@23.svg` | 命名地铁专线 |
| **亦庄线** | `icon@24.svg` | 命名地铁专线 |
| **房山线** | `icon@25.svg` | 命名地铁专线 |
| **燕房线** | `icon@26.svg` | 命名地铁专线 |
| **S1线** | `icon@27.svg` | S1磁浮线 |
| **昌平线** | `icon@28.svg` | 命名地铁专线 |
| **西郊线** | `icon@29.svg` | 有轨电车 |
| **亦庄T1线** | `icon@30.svg` | 有轨电车 |
| **首都机场线** | `icon@31.svg` | 机场快轨 |
| **大兴机场线** | `icon@32.svg` | 机场快轨 |
| **城市副中心线** | `icon@52.svg` | 市郊铁路 (S1) |
| **S2线** | `icon@53.svg` | 市郊铁路 (S2) |
| **怀柔-密云线** | `icon@54.svg` | 市郊铁路 (S5) |
| **通密线** | `icon@55.svg` | 市郊铁路 (S6) |
| **京雄快线** | `icon@57.svg` | 市域城际快线 (R1) |

---

## 🎨 自定义线路 Logo / SVG 制作与适配指引

如果需要添加新的有轨电车、市域快铁或城市专线图标，可自制 SVG 矢量文件（如 `icon@custom.svg`）存入本目录。为使其能够**完美适配系统的动态换色功能**，请按以下规则调整元素颜色属性：

### 1. 三大要素改色对照表

| 构件要素 | 必须改为什么颜色 / 属性 | 对应关联配置 (`data_lines.js`) | 说明与设计建议 |
|:---|:---|:---|:---|
| **背景色块 (Background)** | `style="fill: var(--svgclr);"` | `svgclr`（默认取 `color`） | 徽标圆角底块。动态注入线路主色调。 |
| **转曲文字与核心图形 (Text & Graphics)** | `style="fill: var(--svgtext);"` | `svgtext` | 线路中文名、英文名、编号或核心图标图形。动态注入文字高对比色（通常为 `#ffffff` 或反色深色如 `#00263b`）。 |
| **装饰内边框 (Border / Frame)** | `style="fill: #ffffff;"` 或 `style="fill: var(--svgtext);"` | 固定色 / `svgtext` | **方案 A（推荐，官方模板规范）**：设为固定纯白 `#ffffff`，在各类深浅背景底色上均具备良好的层次修饰效果。<br>**方案 B（联动模式）**：若需让边框与文字完全同色，设为 `var(--svgtext)`。 |

---

### 2. 改造前后代码对照示例

#### ❌ 矢量软件直接导出的静态 SVG 代码：
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 150">
  <g id="bg">
    <!-- 静态红色底块，无法随线路换色 -->
    <rect y="25" width="190" height="100" rx="5" ry="5" fill="#a4343a"/>
  </g>
  <g id="border">
    <!-- 边框固定白色 -->
    <path d="..." fill="#ffffff"/>
  </g>
  <g id="text">
    <!-- 静态文字颜色，无法适配浅色底白字看不清的问题 -->
    <path d="..." fill="#ffffff"/>
    <path d="..." fill="#ffffff"/>
  </g>
</svg>
```

#### ✅ 适配动态颜色后的标准 SVG 代码：
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 150">
  <g id="a">
    <!-- 1. 背景底块：改为 style="fill: var(--svgclr);" -->
    <rect y="25" width="190" height="100" rx="5" ry="5" style="fill: var(--svgclr);"/>
  </g>
  <g id="b">
    <!-- 2. 边框：保持 style="fill: #ffffff;" 或设为 style="fill: var(--svgtext);" -->
    <path d="M185,28c1.1,0,2,.9,2,2v90c0,1.1-.9,2-2,2H5c-1.1,0-2-.9-2-2V30c0-1.1.9-2,2-2h180M185,25H5c-2.76,0-5,2.24-5,5v90c0,2.76,2.24,5,5,5h180c2.76,0,5-2.24,5-5V30c0-2.76-2.24-5-5-5h0Z" style="fill: #ffffff;"/>
  </g>
  <g id="c">
    <!-- 3. 转曲文字与图形：统一改为 style="fill: var(--svgtext);" -->
    <path d="M119.2,68.87..." style="fill: var(--svgtext);"/>
    <path d="M128.24,67.16..." style="fill: var(--svgtext);"/>
    <path d="M48.88,109.28..." style="fill: var(--svgtext);"/>
  </g>
</svg>
```

---

### 3. 矢量绘图软件（Illustrator / Figma / Inkscape）实操规范

1. **画布规格**：
   - 建议画布高度设为 `150`。
   - 宽度基准为 `190`（字数较多时可适度横向扩展至 `215`、`237` 或 `270`）。
   - 徽标主体矩形高度为 `100`，y 坐标设为 `25`（即上下各留 `25px` 安全边距），圆角 `rx="5" ry="5"` 或 `7.5`。
2. **文字必须转曲（创建轮廓）**：
   - 在 Illustrator 中选中文字按 `Ctrl + Shift + O`（Mac：`Cmd + Shift + O`）创建轮廓；
   - 在 Figma 中按 `Ctrl + Shift + O`（Outline Stroke / Flatten）。
   - **禁止保留 `<text>` 标签**，必须全部转为 `<path>` 路径，防止因客户端无对应字体导致排版错乱。
3. **导出清理**：
   - 导出后用文本编辑器 (如 VSCode) 打开 SVG 文件。
   - 删除 `<text>`、无用的嵌套 `<defs>` 与不透明度遮罩。
   - 将背景矩形的填充改为 `style="fill: var(--svgclr);"`。
   - 将所有文字与图标 `<path>` 的填充改为 `style="fill: var(--svgtext);"`。
   - 边框确认保留为 `#ffffff`。
4. **命名与存放**：
   - 存入 `assets/svg/` 目录，统一以 `icon@线路简写.svg` 命名（如 `icon@apm.svg`）。

---

## 🛠️ 代码调用示例

### 1. 在城市线路数据中配置（`data_lines.js`）

```javascript
const linesData = [
    {
        id: "M1",
        name: "1号线",
        color: "#a4343a",
        svg: "icon@01.svg",          // 关联 1号线 模板
        svgclr: "#a4343a",           // 徽标背景色（注入 --svgclr）
        svgtext: "#ffffff",          // 徽标文字色（注入 --svgtext）
        ...
    },
    {
        id: "M22",
        name: "22号线",
        color: "#c23a30",
        svg: "icon@20.svg",          // 注意：22号线对应 icon@20.svg
        ...
    },
    {
        id: "M1E",
        name: "八通线",
        color: "#c23a30",
        svg: "icon@22.svg",          // 八通线专用徽标
        ...
    },
    {
        id: "APMR",
        name: "APM专线",
        color: "#007acc",
        svg: "icon@apmr.svg",        // 自定义专属徽标
        svgclr: "#007acc",
        svgtext: "#ffffff",
        ...
    }
];
```

### 2. 页面中嵌入 SVG 并由 CSS 驱动色彩

```html
<!-- 方式一：在容器或内联 SVG 根节点上注入 CSS 变量 -->
<svg class="line-badge" style="--svgclr: #e4002b; --svgtext: #ffffff;">
  <!-- 内联 SVG 内容 -->
</svg>
```

