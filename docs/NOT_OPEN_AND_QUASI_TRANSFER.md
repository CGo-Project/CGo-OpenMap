# 未开通线路与「准换乘站」的表示约定（设计结论）

> 本文是调研结论，**尚未实施**。目的：把「A 线路已开通、B 线路尚未开通」的换乘站该怎么画这件事定下来，
> 供后续在核心引擎 / 线路图在线编辑器中落地时直接照做。
>
> 调研范围：`core/script.js` 的站点图元与未开通层实现、`city/*/data_stations.js`、`city/*/data_lines.js`、
> `city/*/data_notopen.js`，以及青岛 / 北京现有城市的真实数据。

---

## 一、结论（推荐做法）

**准换乘站 = 站点 `type: "tsf"`（换乘站样式） + 未开通线路段写入 `data_notopen.js` 画虚线。**

不要用 `type: "no"` 表示准换乘站。

理由：

1. 核心的 `tsf` 图元是**中性深色双环 + ↻ 箭头**，颜色取 `var(--station-stroke)`，**不使用任何线路色**——
   因此它只表达「这里是换乘站」，不会谎称在建线路已经开通；
2. 未开通的线形由 `data_notopen.js` 的 `NOT_OPEN_LINES`（灰虚线，`--not-open-color` + `6,4`）或线路自身的
   `overlayStyle.dashArray`（本色虚线）表达，两者叠加后图上读作「现在这里能换乘，将来还会多一条线」；
3. `type: "no"` 的图元是灰色 ⊘ 且站名整体转灰，语义是「**该站本身未开通**」——用在已有线路开通的站上会让乘客
   误判为整站停用，只适合「该站所有线路都未开通」的情况；
4. 本方案**不需要改动核心引擎**，编辑器现有能力（车站「未开通」、线段「未开通」）已可导出所需数据。

---

## 二、实测到的既有约定（可作为实施依据）

| 项目 | 现状 | 出处 |
| --- | --- | --- |
| 站点图元 | `dot` / `tsfo` → 用**该站第一条线路色**画圆点（`lineColors[0]`，无线路时回落 `--station-stroke`）；`tsf` → 中性深色双环 + ↻（`--station-stroke`）；`no` → 灰 ⊘ + 站名取 `--not-open-color`；`rdot` → 国铁站；城市可用 `city.renderStationIcon` 完全自定义图元 | `core/script.js renderStations()` |
| 站点类型字典 | `dot` 普通站 / `tsf` 换乘站 / `tsfo` 站外换乘站 / `diy` 换乘和接驳站 / `no` 未开通车站 / `rdot` 中国铁路车站 | `core/script.js typeMap` |
| 图元是否自动升级 | **不会**：图元完全由 `data_stations.js` 的 `type` 决定，不根据连接线路数自动升级为换乘站 | `core/script.js renderStations()` |
| 未开通线形 | 两套并存：① `data_notopen.js` 的 `NOT_OPEN_LINES`（默认 `color: var(--not-open-color)`、`width: 3.4`、`dashArray: "6,4"`，可逐条给 `style`）；② 线路自身 `overlayStyle: { color, width, opacity, dashArray }`（本色虚线，青岛多条线在用） | `core/script.js renderNotOpenLines()`、`city/*/data_lines.js` |
| 站卡 | 只有**站点级**的「(暂未开通)」标记（`type: "no"`），**没有线路级的开通状态**；线路级在建信息由城市层承担（如 `city/qingdao/data_construction.js` + `qingdao_construction.js` 模块） | `core/script.js`、`city/qingdao/modules/` |
| 现有城市用例 | 青岛 90 座 `no`，其中 5 座被 ≥2 条线引用；北京 16 座 `no`，5 座被多条线引用。逐座核对后，这些「多线引用」站**两条线都还没开通**（例：`M0208 下王埠` 同时位于 2 号线李村公园以东在建段与 15 号线在建段），因此**仓库里目前没有真正的「A 开 + B 未开」案例，也没有现成约定** | `city/qingdao/data_stations.js`、`city/beijing/data_stations.js` |

### 复现参考截图的方法

在本地起静态服务后打开青岛地图，把 `#map-content` 的 transform 指到目标站（`transform-origin: 0 0`）：

```js
const mc = document.getElementById('map-content');
const box = mc.parentElement.getBoundingClientRect();
const s = 2.4, wx = 1880, wy = 795;                 // M0208 下王埠(外贸学院)
mc.style.transform = `translate(${box.width / 2 - wx * s}px,${box.height / 2 - wy * s}px) scale(${s})`;
```

- `M0208`（灰 ⊘ 站 + 在建线虚线）：准换乘位置目前的观感；
- `M0112 兴国路`（深色双环 + ↻）：正常换乘站观感，用于对比换乘环的中性配色。

---

## 三、三种可选表示与取舍

### 方案一（推荐，零核心改动）

站点 `type: "tsf"`；未开通线路段标注「未开通」并导出到 `data_notopen.js`；需要时在站名旁或站卡里补一句
「X 号线在建 / 未开通」（城市模块或 `data_construction.js` 承担）。

- 优点：语义准确、复用现有能力、其它城市立即可用；与多数官方线路图「在建线画虚线、换乘环照常」的做法一致。
- 缺点：换乘环自身看不出「其中一条还没开通」，只能靠那条虚线与文案提示。

### 方案二（小改核心，最精准）

给 `tsf` 增加「部分线路未开通」的表现：数据侧记录 `notOpenLines: ["M6"]`（或新增站点类型，例如 `tson`），
核心把**未开通线路对应的那半环 / 那段外环**改画 `--not-open-color` 虚线。

- 优点：一眼可辨「准换乘」；属于通用能力，不含城市硬编码（符合「核心与城市数据解耦」铁律）。
- 缺点：核心要加模板与分支；拓扑处理需要携带「该站哪些线路未开通」的信息（数据侧要逐站记录）。

### 方案三（不推荐）

- 沿用现状把准换乘站标成 `no`：语义错误（把已开通车站画成 ⊘）；
- 或在城市层用 `renderStationIcon` 自定义专属图元：单城专用、其它城市不能复用，成本高收益低。

---

## 四、判定规则（编辑器可自动推导）

一座车站的开通状态由**连接它的线段状态**决定：

| 该站连接的线段 | 建议 `type` |
| --- | --- |
| 只要有**已开通线段**，同时也有**未开通线段** | `tsf`（准换乘站，同时把未开通线路段导出到 `data_notopen.js`） |
| **只有**未开通线段 | `no`（未开通车站） |
| **只有**已开通线段，且被 ≥2 条线路连接 | `tsf`（换乘站） |
| **只有**已开通线段，仅 1 条线路 | `dot`（普通站） |

编辑器侧建议增加一条校验提示：**勾选了「未开通车站」但该站仍挂着已开通线段时**，提示
「该站属于准换乘站，建议改用换乘站样式（导出 `type: "tsf"`）」。这条与最终选择哪个方案无关，都值得加。

---

## 五、将来落地时的改动清单

编辑器（`city-editor/`）：

1. 车站属性把「是否开通」扩展为三态或按线段状态自动推导：正常 / 未开通 / 准换乘（`tsf` + 未开通线路段）；
2. 导出：准换乘站写 `type: "tsf"`，未开通线段进 `data_notopen.js`，`data_lines.js` 剔除未开通段
   （后两项编辑器中已实现，可直接复用）；
3. 新增第四节那条校验提示；
4. 若采用方案二，导出时附带 `notOpenLines` 字段，并在属性面板里选择「哪些线路在此站尚未开通」。

核心引擎（仅方案二需要）：

1. 新增站点类型模板（例如 `tson`）或在 `tsf` 分支里读取 `notOpenLines`，把对应半环改为
   `--not-open-color` 虚线；
2. `typeMap` 补上对应中文名（如「准换乘站」）；
3. 站卡里可选择性把未开通线路的徽标/线路名转灰。

文档：

1. 本结论并入 `AGENTS.md` 的城市移植规范（「未开通线路与站点」条目）；
2. 城市主理人指南补一段「A 开 + B 未开怎么画」。

> 注意：任何新增文件或代码修改都必须同步递增 `sw.js` 的 `CACHE_NAME`（项目铁律）；
> 页面直接引用的 css/js 还要同步递增该页面里的 `?v=` 版本串，否则普通 F5 可能仍命中浏览器自身缓存。
