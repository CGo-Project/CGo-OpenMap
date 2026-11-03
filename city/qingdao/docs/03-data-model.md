# 青岛项目技术文档 03：数据模型与字段规范

> 本文说明青岛线网基础数据及其附属数据的结构、关联键、实际消费者和维护边界。重点是区分“同一车站的不同数据”和“同一个区间的不同数据”，避免修改时找错数据源。
>
> 数据结构以源文件为准；本文描述字段语义与代码读取方式。新增字段、调整 ID 规则或改变数据关联方式时，应同步更新本文。

## 1. 数据模型总览

青岛地图不是从一张总表直接生成。围绕同一个车站，项目分别维护地图显示、线路归属、搜索别名、历史沿革、地理坐标、时刻表和施工进度等数据。

| 数据用途 | 权威数据文件 | 主关联键 | 主要消费者 |
|---|---|---|---|
| 车站当前名称、图上坐标、标签布局、基础类型 | `data_stations.js` | 车站 ID | `core/script.js`、青岛信息卡模块 |
| 线路名称、颜色、线路站序、折点、站间距 | `data_lines.js` | 线路 ID；站序内含车站 ID | `core/script.js`、`core/path-geometry.js`、青岛专题模块 |
| 搜索旧名/别名 | `staname.csv` | 当前中文站名 `ch` | `core/script.js` 的 `loadStationAliases()` |
| 站名沿革 | `data_station_names.js` | 车站 ID | `modules/qingdao_station_name_history.js` |
| 站名历史译名及排版元数据 | `data_station_names.js` | 车站 ID | `modules/qingdao_station_name_history.js` |
| 高德地理坐标 | `amap_data.json` | 文件同时提供 `sid` 和名称 `n`；当前 Core 实际按名称索引 | `core/script.js` 的 `initGeoSystem()`、距离估算和最近车站定位 |
| 区间运行用时 | `data_interval_times.js` | 线路 ID + 有方向的相邻车站 ID 对 | `modules/qingdao_interval_times.js` |
| 首末班车 | `data_timetable.js` | 线路 ID + 车站 ID | `modules/qingdao_timetable.js`、Core 官网入口 |
| 建设施工状态 | `data_construction.js` | 线路 ID + 车站 ID / 区间端点 ID | `modules/qingdao_construction.js`、建设进度专题图 |
| 背景图标和装饰元素 | `data_scattered.js` | 装饰元素 ID | Core `renderScatteredObjects()` |
| 线网图线路端点徽标位置 | `data_scattered.js` 中 `QINGDAO_MAP_LINE_BADGE_CONFIG` | 线路 ID + `start/end` | `modules/qingdao_line_badges.js` |
| 图例与线路分组 | `data_legend.js` | 线路 ID | Core 图例渲染与高亮事件 |
| 虚拟换乘关系 | `data_virtual_transfers.js` | 车站 ID | Core 换乘激活、换乘提示及连接线 |
| 独立未开通线路覆盖 | `data_notopen.js` | 折点数组 | Core `renderNotOpenLines()` |

### 1.1 最重要的关联规则

- **车站 ID 是线路、时刻表、施工进度和站名沿革之间的主要关联键。** 不要用车站显示名称代替 ID 维护这些数据。
- `stationsData` 是以车站 ID 为对象键的字典；车站对象本身不重复写 `id`。Core 的 `processData()` 会把对象键复制到运行时对象的 `id` 字段。
- `linesData` 是线路对象数组；`line.id` 是跨文件的线路关联键，`line.name` 是显示名称，不应作为稳定主键。
- 同一物理换乘站在多条线路中复用同一个车站 ID。`processData()` 据此建立 `relatedLines`，不是靠中文站名相同来合并车站。
- `pathPoints` 是线路图的几何折点，`stationIds` 是运营站序及线路关联，两者承担不同职责，不能互相替代。

## 2. 车站基础数据：`data_stations.js`

### 2.1 顶层结构

```js
const stationsData = {
    "M0112": {
        type: "tsf",
        x: 1557,
        y: 648,
        cn: "兴国路",
        en: "Xingguo Rd",
        align: "left",
        offset: { x: -1, y: 0 },
        textScale: { cn: 1.0, en: 1.0 }
    }
};
```

顶层键（例如 `M0112`）就是车站 ID。当前车站对象字段如下：

| 字段 | 类型 | 含义 | 主要影响 |
|---|---|---|---|
| `type` | string | 站点基础类型 | 图元模板、换乘显示、未开通标记及专题过滤 |
| `x`、`y` | number | 地图逻辑坐标 | 车站圆点位置、站名锚点、地图定位 |
| `cn` | string | 当前中文显示名 | 地图标签、信息卡、搜索、地理名称匹配 |
| `en` | string | 当前英文显示名 | 地图标签、信息卡标题、搜索 |
| `align` | string | 站名相对车站的锚点方向 | 中英文标签整体放在车站的哪个方向 |
| `offset` | `{x,y}` | 站名锚点的额外微调量 | 只移动站名，不移动车站圆点 |
| `textScale` | `{cn,en}` | 中英文标签分别进行 X 轴缩放 | 只调整文字横向宽度，不改变车站坐标 |

当前数据对象没有单独的 `id` 字段；不要为了改站名或位置而新增重复 ID。运行时 ID 由 Core 从字典键补入。

### 2.2 `type` 的实际语义

当前数据使用以下类型：

| 值 | 含义 | Core/青岛侧行为 |
|---|---|---|
| `dot` | 普通车站 | Core 默认普通站图元；青岛城市钩子可能返回青岛专用图元 |
| `tsf` | 换乘车站 | Core 和青岛模块按多线路站点处理；青岛当前使用无箭头双圆环样式 |
| `no` | 未开通车站 | 搜索结果追加“暂未开通”，线路树标记 pending，区间用时模块会过滤与其相邻的区间 |

`type` 不是施工状态字段。一个 `no` 站是否有施工记录、当前施工进度如何，必须另查 `data_construction.js`。

青岛 `qingdao.js` 另有 `FUTURE_TRANSFER_NONE_OPEN` 和 `FUTURE_TRANSFER_SINGLE_OPEN` 两组配置：

- `FUTURE_TRANSFER_NONE_OPEN`：全部相关线路均未开通的未来换乘站，使用专门放大的未开通图元。
- `FUTURE_TRANSFER_SINGLE_OPEN`：相关线路中只有指定线路已开通，地图上暂按普通站外观绘制。

这两组配置只改变图元外观，**不会改写 `stationsData.type`，也不会删除车站的线路归属**。修改未来换乘站外观时，应同时检查 `qingdao.js` 的配置和 `renderStationIcon()`，不要通过改基础 `type` 破坏信息卡线路关系。

### 2.3 站名换行与安全显示

车站名称可能包含普通换行符 `\n`、`<br>`、`<sup>` 或 `<sub>` 等排版内容。

- 源文件注释将普通 `\n` 作为站名换行输入约定，但 `safeNameHtml()` 本身不会把 `\n` 转换成 `<br>`。
- `<br>` 是受控的站名排版标记。`core/a11y.js` 的 `safeNameHtml()` 会先转义字符串，再只放行无属性的 `<br>`、`<sup>`、`<sub>` 标签。
- 当前地图标签 `.label-group` 和信息卡标题样式主要使用 `white-space: nowrap`；HTML 文本节点中的原始换行可能被浏览器折叠。因此需要确保实际断行时，应检查目标容器的 CSS 和具体渲染路径，不能只凭字符串里有 `\n` 就认定页面一定会换行。
- `plainName()` 会去掉标签并压缩空白，供 aria-label、读屏播报等纯文本场景使用。
- 英文词间使用 NBSP（U+00A0）可避免不希望出现的词间断行。
- 当前有少数站名在同一字符串中混用 `\n` 和 `<br>`，其中部分 `<br>` 是信息卡专用换行。修改时应保留原始排版意图，不能统一替换所有换行标记。

不要在数据中放入带属性的 HTML 标签、脚本或任意 HTML。站名数据会进入地图标签和信息卡，必须保持纯文本加受控排版标记。

### 2.4 `align`、`offset`、`textScale`

`align` 支持八个方向：

- `top`、`bottom`、`left`、`right`
- `top-left`、`top-right`、`bottom-left`、`bottom-right`

`core/script.js` 的 `renderStations()` 先按 `align` 计算文字锚点，再叠加 `offset.x/y`。因此：

- 改 `x/y` 会同时移动车站圆点和标签的基准锚点。
- 改 `align` 会改变标签相对圆点的方向。
- 改 `offset` 只会微调标签位置，不会移动圆点。
- `textScale.cn/en` 分别作用于中英文文字的 `scaleX()`。

当前数据中 `offset` 是常见的站名微调手段；`textScale` 字段保留在数据结构中，但当前车站数据的值均为 `1.0`，尚未用于实际压缩或拉伸。

**只改站名位置时优先改 `align/offset`，不要改车站 `x/y`。** 只有线路折点、车站圆点和地理位置都需要一起变化时，才应调整 `x/y`，并检查相邻线路几何。

### 2.5 运行时派生：`processedStations`

`core/script.js` 的 `processData()`：

1. 遍历 `stationsData`，浅拷贝每个车站对象。
2. 用字典键填入 `id`。
3. 初始化 `codes`、`lineColors`、`relatedLines` 三个运行时数组。
4. 遍历 `linesData`，按线路站序把线路名称/站序编码写入 `codes`，把线路颜色写入 `lineColors`，把线路 ID 写入 `relatedLines`。

这些字段不是青岛 `data_stations.js` 的源字段，不应直接写入基础车站数据。

`relatedLines` 是车站与线路之间的实际关联结果。物理换乘站通过相同车站 ID 同时出现在多条线路的 `stationIds` 中实现，不依赖中文名相同。

## 3. 线路基础数据：`data_lines.js`

### 3.1 顶层结构与字段

`linesData` 是数组，每个对象代表一条可绘制或用于线路关系的线路记录。

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | string | 稳定线路 ID，其他数据文件通过它关联线路 |
| `name` | string | 页面显示名称 |
| `color` | string | 线路实体色，通常为 CSS 颜色字符串 |
| `svg` | string | 线路徽标 SVG 文件名，通常引用公共 `assets/svg/` |
| `svgclr` | string，可选 | 徽标 SVG 的颜色覆盖值 |
| `svgtext` | string，可选 | 徽标 SVG 内文字颜色 |
| `company` | string，可选 | 线路默认运营单位 |
| `stationIds` | string[] | 按线路方向排列的车站 ID 序列 |
| `distances` | array | `stationIds[i]` 到 `stationIds[i+1]` 的相邻站间距，单位米 |
| `pathPoints` | `{x,y}[]` | 线路在地图上的完整几何折点序列 |
| `useStrictRounding` | boolean | 是否启用更严格的线路倒角限制 |
| `isVirtual` | boolean，可选 | 当前用于在建段的附加线路绘制记录 |
| `overlayStyle` | object，可选 | 在线路实体色上叠加的描边/纹理样式 |

Core 的 `core/path-geometry.js` 优先使用 `pathPoints` 绘制线路；若没有 `pathPoints`，才按 `stationIds` 中车站坐标连线。`stationIds` 同时用于站点归属、相邻站信息、线路树和其他专题，因此几何折点与站序必须分别维护。

### 3.2 `stationIds` 与 `distances`

`stationIds` 按线路方向排序。例如：

```js
stationIds: ["M1301", "M1302", "M1303"],
distances: [1386, 1434]
```

`distances[i]` 对应 `stationIds[i]` 到 `stationIds[i+1]` 的间距，数组长度应为 `stationIds.length - 1`。

间距可为：

- 数字：精确或按来源记录的米数。
- 字符串，例如 `"约2700"`：保留来源中的近似值，界面会按原文本展示。
- `"??"`：未知占位值，不代表 0 米。

Core 的相邻站信息生成逻辑会在距离值有效时显示该值；遇到 `??`、`?`、`0` 或缺失值时，Core 可能尝试用地图示意坐标和地理坐标估算。青岛 `handleLineMerge()` 会移除自动估算生成的“约 xx 米”，但保留数据中人工填写的 `"约2700"` 等显式近似值。

通用 Core 还支持 `distances2`、`distances-way1`、`distances-way2` 等反向或分支距离字段；当前青岛线路数据使用普通 `distances`，没有实际配置这些字段。

**调整站序时必须同步检查距离数组。** 在站序中插入、删除或移动一个车站后，所有相邻区间的距离索引都会改变。

### 3.3 `pathPoints` 与线路几何

`pathPoints` 是地图逻辑坐标中的折点数组：

```js
pathPoints: [
    { x: 981, y: 1530 },
    { x: 981, y: 1692 },
    { x: 423, y: 1692 }
]
```

当前青岛 `pathPoints` 点对象使用 `x/y`。通用几何引擎还支持在点对象中指定 `r` 控制单个拐角圆角半径，但当前青岛线路折点没有使用 `r`。

线路折点的职责是画线；站序的职责是描述该线路停靠哪些车站以及先后顺序。修改折点不应顺带改站序，修改站序也不应假设线路几何会自动准确跟随。

`useStrictRounding` 由 Core 传给共享几何引擎，用于限制短线段处的圆角半径。圆角算法的唯一实现位于 `core/path-geometry.js`，不要在青岛数据或模块中另写一套圆角算法。

### 3.4 青岛在建段的 `isVirtual` 记录

当前青岛 `linesData` 中有一组 `isVirtual: true` 的在建段记录。其特点是：

- `stationIds: []`、`distances: []`，不参与车站线路归属和站序。
- 仍有 `pathPoints`，所以 Core 的 `renderLines()` 会绘制其线路几何。
- 通过 `overlayStyle` 在对应线路色上叠加细白色线条，形成在建段视觉区分。
- Core 的线路列表 `renderPinModeTree()` 会跳过 `isVirtual` 记录，避免它们作为独立运营线路出现。

因此，青岛当前在建段的白色覆盖纹理不是来自 `NOT_OPEN_LINES`，而是来自 `data_lines.js` 中的虚拟线路对象。`data_notopen.js` 当前为空，不能把两种机制混为一谈。

### 3.5 当前线路组织方式

青岛把部分同名线路拆成独立线路 ID，而不是使用 Core 通用的 `hasbranch` 双交路对象：

- 7 号线分为 `QDM07N` 和 `QDM07S`。
- 8 号线支线使用 `QDM08B`，主线使用 `QDM08`。
- 对应在建覆盖段另有 `QDM07NU`、`QDM07SU`、`QDM08BU` 等虚拟记录。

Core 的通用线路几何仍支持 `hasbranch`、`stationIds-way1/way2` 和多组 `pathPoints-*`，但当前青岛 `data_lines.js` 没有使用这些分支字段。不要为了“看起来是一条分支线”就把青岛现有独立线路记录擅自改成 `hasbranch` 结构；这会影响线路排序、同步高亮、图例和线路列表。

青岛线路排序与联动分组在 `qingdao.js` 的 `LINE_SORT_ORDER`、`LINE_SYNC_GROUPS` 中维护，不由 `data_lines.js` 数组顺序单独决定。

当前非虚拟线路 ID 与显示名：

| 线路 ID | 显示名称 |
|---|---|
| `QDM01` / `QDM02` / `QDM03` / `QDM04` / `QDM05` / `QDM06` | 1、2、3、4、5、6号线 |
| `QDM07N` / `QDM07S` | 7号线（两个独立线路记录，显示名均为“7号线”） |
| `QDM08` / `QDM08B` | 8号线 / 8号线支线 |
| `QDM09` / `QDM11` / `QDM13` / `QDM15` | 9号线 / 蓝谷快线 / 西海岸快线 / 15号线 |

当前虚拟在建覆盖记录为 `QDM02U`、`QDM05U`、`QDM06U`、`QDM07NU`、`QDM07SU`、`QDM08BU`、`QDM09U`、`QDM11U`、`QDM15U`。这些 ID 也会被 `linesData` 和专题模块读取，调整时应检查是否仍与对应正式线路的几何覆盖关系一致。

### 3.6 `LINE_META`

`data_lines.js` 末尾声明 `LINE_META = {}` 并暴露为全局兼容入口。当前线路的 `svg`、`color`、`company` 等信息主要直接写在线路对象上；青岛城市配置中的 `LINE_META` 也为空对象。

修改某条线路徽标、颜色或运营单位时，先检查对应 `linesData` 对象，不要默认把信息写入空的 `LINE_META`。

## 4. 搜索别名：`staname.csv`

### 4.1 CSV 列结构

当前表头结构为：

```text
tag1,tag2,tag3,tag4,tag5,tag6,ch,2018,2019,2020,2021,2022,2023,2024,2025
```

- `ch`：当前标准中文站名，用于匹配 `processedStations[].cn`。
- `2018` 至 `2025`：按年份记录的历史名称、旧译名或搜索别名。
- `tag1` 至 `tag6`：保留的分类/整理信息；当前 Core 搜索解析器不读取这些列。
- `\`：表示该年份没有可用别名，加载时会忽略。

一个 `ch` 可以出现多行。Core 会把同一 `ch` 对应的各年份别名合并到 Set，再写入对应运行时车站的 `aliases` 数组。

### 4.2 加载与搜索流程

`core/script.js` 的 `init()` 在 `processData()` 后 `await loadStationAliases()`，然后才继续渲染地图、绑定搜索事件。因此正常初始化完成后，搜索别名已附加到 `processedStations`。

`loadStationAliases()` 从城市配置的 `dataFiles.stanameCsvUrl` 读取 CSV。青岛在 `qingdao.js` 中把它指向 `./city/qingdao/staname.csv`。

搜索时，Core 检查：

1. 当前中文名 `cn`：使用原始文本包含匹配。
2. 当前英文名 `en`：先标准化，再进行包含或子序列匹配。
3. `aliases`：标准化后参与同一套匹配。

标准化过程会转小写、剥离拼音声调和组合音标、替换部分英文通用词（如 `railway`、`station`、`university`），并移除空格、句点、撇号、括号和连字符。模糊匹配分数：完整包含为 100，按顺序匹配的子序列为 50。

运行时不会自动生成拼音全拼或首字母；这些别名需要在 CSV 中维护。

### 4.3 修改注意事项

- `ch` 必须与当前 `data_stations.js` 的中文站名完全对应；改了当前站名后，应同步检查 CSV 的 `ch`。
- 旧名称和历史英文拼写放在对应年份列，不要放进 `tag` 列期待搜索读取。
- Core 当前使用简单的 `split(',')` 解析行，没有实现带引号字段的完整 CSV 解析；字段内容不要包含未转义逗号。
- 别名按中文站名映射，不按车站 ID 映射。同名的不同车站会共享同一组别名。

## 5. 站名沿革：`data_station_names.js`

该文件提供三个独立数据对象：

### 5.1 `QINGDAO_STATION_NAME_HISTORY`

顶层按车站 ID 索引：

```js
{
    "M0322": {
        sourceLine: "3",
        rows: [
            { type: "拟定站名(2010)", name: "火车站" },
            { type: "正式站名(2010定名)", name: "青岛火车站" }
        ]
    }
}
```

- `sourceLine`：整理资料对应的来源线路标识。
- `rows`：按期望显示顺序排列的沿革记录。
- `rows[].type`：阶段/类别文字，如拟定站名、正式站名、工程站名、调整或更名。
- `rows[].name`：该阶段对应的站名。
- 个别记录可带 `note`，由历史模块作为备注显示。

当前正式显示名仍以 `data_stations.js` 的 `cn` 为准。沿革数据不能反过来覆盖当前站名。

### 5.2 `QINGDAO_STATION_HISTORICAL_TRANSLATIONS`

按车站 ID 保存历史纯拼音译名或旧英文译名。值可以是一个字符串，也可以是字符串数组；数组中的每一项会分别显示。

### 5.3 `QINGDAO_STATION_HISTORICAL_TRANSLATION_META`

与历史译名文本分离的显示元数据。单项译名可配置 `type`、`breakBefore`、`superscript` 等；当译名是数组时，元数据也可以是对应数组。

这样拆分的原因是：译名文本保持纯字符串，类别、有效期和局部排版由另一对象管理。修改译名内容时不要把它改成对象；修改标签或局部排版时应检查对应的 `META`。

### 5.4 消费模块

`modules/qingdao_station_name_history.js` 注册 `qingdao-station-name-history` 模块，挂载到 `station-info` 选项卡。它按 `context.station.id` 读取上述三个对象，并负责转义、排版和输出。

历史沿革与搜索别名是两套独立数据：

- 需要让用户通过旧名搜到当前站：改 `staname.csv`。
- 需要在车站信息卡展示某阶段曾用名：改 `data_station_names.js`。
- 同一个历史名称可能同时需要进入两套数据，但不会自动同步。

## 6. 地理坐标：`amap_data.json`

### 6.1 数据结构

文件采用高德地铁站点数据的结构，主要字段：

- 根对象 `s`：城市名称描述。
- 根对象 `i`：城市代码。
- 根对象 `l`：线路数组。
- `l[].st[]`：车站数组。
- `st[].sid`：车站 ID。
- `st[].n`：车站名称。
- `st[].sl`：`经度,纬度` 字符串。

### 6.2 Core 的实际索引方式

`initGeoSystem()` 从青岛 `dataFiles.amapDataUrl` 加载该文件，解析 `sl` 后建立 `STATION_GEO_MAP`。当前 Core 使用 `STATION_GEO_MAP[sta.n] = coords`，即**按名称 `n` 建立字典，并没有使用文件里已经存在的 `sid`**。

后续 `lookupStationLngLat()` 和最近车站定位也按中文名称查找，另尝试添加/去除末尾“站”字。

### 6.3 工程暂用名造成的同名记录（有意存在）

当前数据中有两组不同车站 ID 使用相同中文显示名。这是工程阶段暂用站名造成的重名，不是车站 ID 重复，也不是误把同一座车站录入两次。

| 车站 ID | 当前中文名 | 英文名 | 当前站型 | 说明 |
|---|---|---|---|---|
| `M0510` | 四方厂 | `SIFANGCHANG` | `no` | 工程暂用名 |
| `M1501` | 四方厂 | `SIFANGCHANG` | `no` | 工程暂用名 |
| `M0625` | 凤凰山路 | `FENGHUANGSHANLU` | `no` | 工程暂用名，与另一条线路车站重名 |
| `M1311` | 凤凰山路 | `Fenghuangshan Rd` | `dot` | 另一条线路上的独立车站 |

这四条记录必须继续以各自的车站 ID 区分。线路站序、坐标、施工数据、时刻表和站名沿革均应按 ID 关联；不能因为显示名称相同就合并车站或删除其中一条记录。

`amap_data.json` 也为四个 ID 分别保留了坐标记录：

- `M0510`：`120.344817,36.107611`
- `M1501`：`120.283656,36.335694`
- `M0625`：`120.027951,35.873523`
- `M1311`：`120.022689,35.890085`

**需要区分“业务上有意重名”和“地理查询按名称索引的技术限制”。** 当前 Core 的 `initGeoSystem()` 以中文名称构建 `STATION_GEO_MAP`，同名记录会发生名称键覆盖；因此按名称查询时可能无法区分上述不同车站。`amap_data.json` 虽然保留 `sid`，但这不代表所有调用方都已经按 ID 查询。

青岛微缩地图 `stacard/script.js` 也会优先检查 `window.STATION_GEO_MAP[stationName]`，之后才回退到内部按 ID 建立的索引。因此，若上述车站出现地理定位或微缩地图坐标异常，应检查名称索引的优先级；不要通过修改工程暂用名、合并车站 ID 或删除地理记录来规避。

后续若要从根本上消除查询歧义，应在公共地理坐标接口中优先支持车站 ID，并保留名称查询作为兼容回退。这属于接口层改进，不改变这几组名称在当前工程数据中的有意重名事实。

## 7. 区间用时：`data_interval_times.js`

顶层对象：

```js
window.QINGDAO_INTERVAL_TIME_DATA = {
    defaultMinutes: 2,
    lines: {
        QDM01: {
            "M0712>M0713": 2,
            "M0713>M0714": 3
        }
    }
};
```

- `defaultMinutes`：某个相邻车站对缺少显式数据时的兜底分钟数。
- `lines`：按线路 ID 分组。
- 每个区间键使用 `fromStationId>toStationId` 格式，值为分钟数。
- 模块也兼容按数组索引保存的格式，但青岛当前数据使用对象键。

`modules/qingdao_interval_times.js`：

1. 只处理内部 `OPERATING_LINE_IDS` 白名单中的线路。
2. 跳过 `isVirtual`、`isPointOnly`、`drawOnly` 线路。
3. 按 `stationIds` 相邻顺序读取每个区间。
4. 如果任一端车站 `type === "no"`，则不显示该区间用时。
5. 先读取 `from>to`，缺失时尝试 `to>from`，仍缺失才使用 `defaultMinutes`。
6. 通过 SVG path 的实际弧长定位两个车站在线路上的位置，再取二者弧长中点放置标记，而不是简单取两个车站坐标的直线中点。

因此，区间用时与 `data_lines.js` 的 `distances` 是两种完全不同的数据：

- `distances` 是站间物理距离，单位米。
- `QINGDAO_INTERVAL_TIME_DATA` 是列车运行时间，单位分钟。

当前模块的运营线路白名单与数据文件中的线路键需要保持一致。新增一条需要展示用时的线路时，除了增加数据，还要检查模块的白名单和线路站序。

## 8. 图例、散点与虚拟连接数据

### 8.1 `data_legend.js`

`LEGEND_CONFIG` 是图例章节数组，当前使用 `title` 和 `grid` 两种结构：

- `title`：章节中文标题、英文副标题和可选描述。
- `grid`：网格列数及 `items`。
- `items[].targets`：点击后要高亮的线路 ID 数组。
- `items[].name`：图例中显示的线路名称。

例如 7 号线图例的 `targets` 同时包含 `QDM07N`、`QDM07S`；8 号线图例同时包含 `QDM08`、`QDM08B`。图例分组是显示层组织，不意味着底层必须合并成一个线路对象。

Core 会优先读取 `window.LEGEND_CONFIG`，再回落到 `LEGEND_SECTIONS` 或城市配置。修改图例名称/分组应编辑此文件；修改线路列表顺序则检查 `qingdao.js` 的 `LINE_SORT_ORDER`，两者不是同一配置。

### 8.2 `data_scattered.js` 的 `SCATTERED_DATA`

散点/装饰对象数组字段：

| 字段 | 含义 |
|---|---|
| `id` | 装饰对象标识 |
| `file` | SVG/图片资源路径 |
| `x`、`y` | 元素中心在地图坐标系中的位置 |
| `width`、`height` | 显示宽高 |
| `opacity` | 透明度 |
| `zIndex` | 散点层内部层级 |
| `rotation` | 可选旋转角度 |

Core `renderScatteredObjects()` 把它们放入 `#scattered-layer`。`x/y` 是中心锚点，基础 CSS 通过 `translate(-50%, -50%)` 将元素中心对准该坐标。

因此，调整罗盘、国铁、机场、汽车站、轮渡或有轨电车图标位置，应修改对应散点对象；不要改车站数据或线路折点。

### 8.3 `QINGDAO_MAP_LINE_BADGE_CONFIG`

同一文件还声明地图线路端点徽标配置，与 `SCATTERED_DATA` 是两套独立数据：

- `defaultHeight`：默认徽标显示高度。
- `placements[]`：每个放置记录通过 `lineId` 指定线路，通过 `at: "start" | "end"` 选择 `pathPoints` 的第一个/最后一个几何点作为锚点，通过 `dx/dy`（地图坐标单位）调整位置。
- `displayNumber`：可选的特殊显示号码覆盖。

真正创建和定位徽标的是 `modules/qingdao_line_badges.js`。若要移动地图上的线路号，修改 placements；若要改徽标 SVG 结构、尺寸比例或端点解析方式，检查模块实现。不要把端点徽标当成静态散点移动。

### 8.4 `data_virtual_transfers.js`

文件声明四个 Core 接口：

- `VIRTUAL_TRANSFER_MAP`：车站 ID → 需要显示为可接驳/付费换乘的其他车站 ID 数组。
- `VIRTUAL_FREE_TRANSFER_MAP`：车站 ID → 可免费站外换乘的其他车站 ID 数组。
- `VIRTUAL_CONNECT_LINES`：可接驳/付费换乘的连接线记录数组。
- `VIRTUAL_FREE_CONNECT_LINES`：免费站外换乘的连接线记录数组。

连接线记录使用 `from`、`to` 两端车站 ID，可选 `offsetFrom`、`offsetTo` 微调端点；Core 根据车站坐标生成连接线。

当前青岛这四个容器均为空。正常的同站换乘不需要写入这里：只要同一个车站 ID 出现在多条线路 `stationIds` 中，Core 就会通过 `relatedLines` 识别。只有两个独立车站对象之间存在站外/虚拟接驳关系时，才考虑使用此配置。

### 8.5 `data_notopen.js`

`NOT_OPEN_LINES` 是独立未开通线路覆盖层数据，Core `renderNotOpenLines()` 会读取其 `points` 和可选 `style` 绘制。

当前青岛 `NOT_OPEN_LINES` 为空。在建段的白色细线覆盖已由 `data_lines.js` 的 `isVirtual + overlayStyle + pathPoints` 记录负责，二者不是同一个机制。

## 9. 首末班车与施工数据的关联入口

这两类数据有自己的复杂专题文档，当前先明确其主键与数据边界。

### 9.1 `data_timetable.js`

- 基础展示数据入口为 `GLOBAL_SCHEDULE_DATA[lineId][stationId]`。
- 车站记录可包含 `url`、`cn`、`sourceCn`、`source` 和 `items`。
- `items` 是有顺序的 `{label, value}` 数组；常规时刻通过“首车-往…”、“末车-往…”标签解析，快速列车通过“快速列车-…”标签解析。
- 文件后半段定义运行图版本表 `QINGDAO_TIMETABLE_VERSIONS`，常规调图用 `regularValues` 更新已有 items 的值，快速列车用 `rapidReplacements` 整组替换，结构变化用 `entryOverrides`。
- 生效时间使用带时区的 ISO 时间，青岛运行图按北京时间（UTC+8）判定。
- `modules/qingdao_timetable.js` 消费 `GLOBAL_SCHEDULE_DATA`；Core 也会读取其中的官网 URL。

修改首末车时刻时，先判断是基础时刻表内容还是某个生效版本的差异，不要只改已被版本覆盖的基准值。

### 9.2 `data_construction.js`

顶层 `window.QINGDAO_CONSTRUCTION_DATA` 按线路 ID 分组。每条线路数据包含：

- `stations`：按车站 ID 索引车站施工记录。
- `segments`：按区间端点组合键索引区间记录。
- 普通区间可有 `name`、`from`、`to`、`details`。
- 分段区间可使用 `parts[]`，每段分别有名称和 `details[]`。
- `details[]` 保存 `side`（左线/右线）、`date`、`status`，日期推测可用 `estimated: true` 标记。

统一状态读取和解释由 `modules/qingdao_construction.js` 暴露的 `window.QingdaoConstructionProgress` 处理；不要在地图专题和车站卡里分别解释原始施工数据。完整字段和区间查找规则将在施工进度专题文档中展开。

## 10. 当前数据关系的静态核查

以下是当前仓库数据的一次一致性检查结果，用于帮助定位数据问题；以后增删线路/车站后应重新运行同类检查，而不是把这些数量当成永久常量。

- `stationsData` 当前包含 262 个车站对象，类型分布为 `dot` 144 个、`tsf` 32 个、`no` 86 个。
- `linesData` 当前包含 23 条线路记录，其中 14 条有站序的常规线路记录，9 条 `isVirtual` 在建覆盖记录。
- 当前 14 条常规线路的所有 `stationIds` 都能在 `stationsData` 找到。
- 每条常规线路的 `distances` 长度均为 `stationIds.length - 1`。
- 当前 262 个车站均至少被一条常规线路引用；35 个车站被两条线路引用，2 个车站被三条线路引用。当前 `textScale` 均为 1.0，站名位置主要通过 `align/offset` 调整。
- 当前青岛数据没有使用 Core 的 `hasbranch` 分支线路结构。
- `VIRTUAL_TRANSFER_MAP`、`VIRTUAL_FREE_TRANSFER_MAP`、`VIRTUAL_CONNECT_LINES`、`VIRTUAL_FREE_CONNECT_LINES` 和 `NOT_OPEN_LINES` 当前为空。
- 当前 `amap_data.json` 有 262 条站点坐标记录，但只有 260 个不同站名；同名记录按名称写入 Core 字典时存在覆盖风险，见第 6.3 节。

## 11. 常见修改任务的正确入口

| 修改需求 | 首要修改位置 | 同步检查 |
|---|---|---|
| 移动车站圆点 | `data_stations.js` 的 `x/y` | 线路 `pathPoints`、站名标签、地图定位 |
| 只移动站名 | `data_stations.js` 的 `align/offset` | 亮暗主题、相邻标签是否重叠 |
| 调整站名中英文 | `data_stations.js` 的 `cn/en` | `staname.csv` 的 `ch`、历史沿革、地理坐标名称匹配 |
| 修改车站基础类型 | `data_stations.js` 的 `type` | `qingdao.js` 未来换乘外观、搜索 pending、进度/区间专题过滤 |
| 改变某条线路经过哪些车站 | `data_lines.js` 的 `stationIds` | `distances`、施工数据、时刻表、区间用时、图例和线路同步组 |
| 调整线路实际走向 | `data_lines.js` 的 `pathPoints` | 车站位置、专题图层是否沿实际线路定位 |
| 修改站间距 | `data_lines.js` 的 `distances` | 数组索引是否对应正确相邻车站 |
| 修改搜索旧名 | `staname.csv` | `ch` 是否等于当前标准站名 |
| 修改信息卡站名沿革 | `data_station_names.js` | 历史译名及 `META` 是否需要同步 |
| 修改最近车站定位数据 | `amap_data.json` | Core 当前按名称而非 sid 索引的限制 |
| 修改区间运行分钟数 | `data_interval_times.js` | 模块运营线路白名单、站序、未开通站过滤 |
| 移动罗盘/交通枢纽图标 | `data_scattered.js` 的 `SCATTERED_DATA` | SVG 路径、尺寸、层级 |
| 移动线路端点号码牌 | `QINGDAO_MAP_LINE_BADGE_CONFIG.placements` | `modules/qingdao_line_badges.js` 的端点解析 |
| 修改图例名称/分组 | `data_legend.js` | targets 是否仍为有效线路 ID |
| 修改站外换乘 | `data_virtual_transfers.js` | 车站 ID、连接线偏移、信息卡提示 |

## 12. 数据修改后的核对清单

- [ ] 新增或删除车站后，检查线路 `stationIds` 是否有悬空 ID。
- [ ] 调整线路站序后，检查 `distances` 是否仍对应每一对相邻站。
- [ ] 改变线路站序后，检查区间用时数据的 `from>to` 键。
- [ ] 线路新增/拆分/合并后，检查 `LINE_SORT_ORDER`、`LINE_SYNC_GROUPS`、`LEGEND_CONFIG` 和线路徽标 placements。
- [ ] 修改当前中文站名后，检查 `staname.csv`、`data_station_names.js` 和 `amap_data.json` 的名称映射。
- [ ] 修改车站 ID 后，检查时刻表、施工进度、历史沿革、区间用时和虚拟换乘数据。
- [ ] 修改 `type` 后，检查未来换乘图元、搜索结果状态和专题过滤。
- [ ] 改动地理坐标后，检查同名站冲突以及最近车站定位。
- [ ] 在浏览器中检查车站标签、线路、信息卡、搜索和相关专题，不以语法检查代替数据验证。
