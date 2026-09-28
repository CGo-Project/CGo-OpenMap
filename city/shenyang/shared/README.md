# 三城共享层（city/shenyang/shared/）

> ⚠️ **临时共享位置**
> 本目录挂在沈阳城市目录下，实际由 **沈阳、大连、长春、哈尔滨** 四城共用。
> 计划在开发团队确认共享位置后整体迁入 `core/`，届时只需 `git mv` 并改动各城
> `{city}.js` 里的引用路径与 3 处 stacard import，**零逻辑改动**。
> 迁移步骤见 [docs/STACARD_TIMETABLE_UNIFICATION.md](../../../docs/STACARD_TIMETABLE_UNIFICATION.md) 第 4.4 节。

---

## 一、这里放什么

三条同时满足，才应该放进本目录：

1. **多城共用**：三城之一已接入，其余城市可直接复用同一份实现；
2. **不含城市业务**：不出现具体站名、线路 ID、季节阈值、运营公司等城市私有数据；
3. **可被薄配置驱动**：城市侧只写差异（文案、阈值、取数），机制部分留在这里。

反例：沈阳的题字素材与 `data_calligraphy.js`、长春的 `data_opening.js` 属于城市数据，
留在各自城市目录；把素材渲染出来的通用算法才放这里。

---

## 二、文件清单

| 文件 | 对外接口 | 加载方式 | 职责 |
| :--- | :--- | :--- | :--- |
| `timetable-renderer.js` | `window.CGoTimetable`、`window.CGoDayType` | classic script，各城 `{city}.js` 引入 | 首末班车「归一化行 → HTML」、日期类型判定（`workday` / `restday`，可选调休日历）、**季节判定（阈值由城市传入）**、终点站代号解析（`line-first` / `line-last` 跳过未开通车站）、未开通车站过滤、按日期类型取行（`rowsForDayType`）、季节与日期类型标签的差异判定。<br>行模型见文件内 typedef：`first` / `last` 一律是字符串，日期类型分档落在**行**上（行带 `dayType`，缺省为通用），共享层不猜值的形状 |
| `stacard-engine.js` | 具名导出 `createStaCard` | ES module，各城 `stacard/script.js` 相对 import | 高德瓦片地图卡片：坐标索引、占位 HTML、瓦片网格、缩放交互、ResizeObserver 生命周期 |
| `station-title.js` | `window.CGoStationTitle.createStationTitleNormalizer` | classic script | 侧栏站名标题归一化（站类判定、标题拼装、MutationObserver 安装与防自触发） |
| `tip-card.js` | `window.CGoTipCard.render` | classic script | 车站信息板提示卡片 DOM（与上游官方模板结构一致） |
| `calligraphy.js` + `calligraphy.css` | `window.CGoCalligraphy.register` | classic script | 站名题字渲染机制（沈阳特色，其他城市可选用）；样式表由脚本按自身 URL 注入 |
| `opening-schedule.js` | `window.CGoOpening` | classic script | 未开通区段与车站的**开通时刻**：状态转换、待开通登记、到点自动刷新，以及未开通车站 footer 的开通文案与倒计时（详见第四节） |
| `opening-schedule.css` | — | 由 `opening-schedule.js` 按自身 URL 注入 | 上述倒计时框的样式（同 `calligraphy.css` 的做法） |
| `line-link.js` | `window.CGoLineLink`（`list` / `atStation` / `ofLine` / `throughPairs` / `mergeStationLines`） | classic script，各城 `{city}.js` 引入，须早于 `route-data.js` | 线路接续声明解析：城市用 `lineLinks` 声明「哪两条线在哪个站接续、是否贯通运行」。声明 `through: true` 时，规划内核把经由衔接站的跨线视作同一列车（不计换乘、无换乘耗时），车站详情也把整条贯通区段合并成一条线、相邻站跨线相连 |
| `loop-direction.js` | `window.CGoLoopDirection`（`of` / `label` / `orientation`） | classic script，各城 `{city}.js` 引入，须早于行程规划与时刻表渲染 | 环线乘车方向的**环别文案**：环线没有终点站，方向只能报「下一站 + 内环 / 外环」。中国等右侧通行城市默认「内环 = 顺时针、外环 = 逆时针」，城市可用 `window.CGO_LOOP_DIRECTION = { clockwise, counterclockwise }` 覆盖命名。顺 / 逆按**站序**（`stationIds`）做鞋带公式判定——规划内核给出的 `dir` 正是相对站序的，两者必须同口径；折线的绘制方向未必与站序一致，拿折线去判会把内外环弄反。行程规划结果面板与时刻表行（`TimetableRow.ring`）共用 |
| `route-data.js` + `route-planner.js` + `route-panel.js` + `route-panel.css` | `window.CGoRouteData`（`build` / `amapCoordIndex` / `collectVirtualTransfers` / `hourSlots`）、`window.CGoRoutePlanner`、`window.CGoRoutePanel` | classic script，各城 `{city}.js` **按 data → planner → panel 的顺序**引入 | 行程规划：网络构建（时刻表实测区间用时 + 坐标里程兜底 + 站外换乘 + 贯通直通 + 未开通车站的穿过判定）、多目标 Dijkstra（最快 / 最短 / 最少换乘 / 最省）、按计费系统结算票价（`fareSystems` 把各自购票的有轨等拆成独立系统，付费出站换乘另行购票）、结果面板与图上高亮。「我的位置」按需取坐标索引 |
| `nearest-station.js` + `nearest-station.css` | 无对外接口（自动接管 `#locate-btn`） | classic script，各城 `{city}.js` 引入 | 跨城市「查找最近车站」：在 `#locate-btn` 上以**捕获阶段**扣下核心 `findNearestStation` 的点击，本模块自足地定位、换算 GCJ-02、比对全城站点后，改用 `cgo-modal` 三选一（切换到更近的城市 / 查看当前城市最近车站 / 取消），替掉核心那个同步 `confirm`；样式表由脚本按自身 URL 注入 |
| `sidebar-refit.js` + `sidebar-refit.css` | `window.CGoSidebarRefit`（`refresh`） | classic script，各城 `{city}.js` 引入（**须晚于 `route-panel.js`**，同名同权重样式以本层为准） | 桌面端固定侧栏（`body.legend-pinned`）形态改造，向官方 `/map` 页面靠拢：① 实测标题栏浮岛矩形（写回 `--cgo-sb-*`），侧栏铺满窗口上下左边缘、右缘与浮岛右缘对齐，内容顶部让开浮岛；② 撤下侧栏顶端的返回/固定按钮与那条 40px 假标题栏，把「取消固定」搬到浮动缩放条的检索面板按钮位（搬的是同一个 `#legend-pin-btn` 节点）；③ 各区块退成「自带底色 + 单条描边 + 圆角 + 等距」的小卡片，标题栏线路色块换成结果面板同款迷你线路标（16px 正方/正圆 + 线路编号，编号规则与 `route-panel.js` 一致；国铁散点线用 railway 图标 + 线路徽标底色）；④ 拖到侧边的停靠提示框顶到窗口顶部、只留右缘虚线，磨砂取 CGoUI 玻璃体系轻档 `--glass-backdrop-blur`；⑤ 展开的车站窗口不足 22em 时，先收起侧栏里其它占高度的可折叠区块（核心各 `panel-section`、行程规划的 `#cgo-route-card` 与 `#cgo-route-result`，以及其它车站窗口），再逐个清退最旧的折叠窗口给它腾高度（沿用核心原先的退场动画，每个都等动画走完再判下一个；核心只按「固定保留 N 条」裁剪，与侧栏实际高度无关），达标即停；清掉的站同步移出 `window.STATION_HISTORY`，免得核心下次重建又放回来；样式表由脚本按自身 URL 注入 |
| `map-tools.js` + `map-tools.css` | `window.CGoMapTools`（`open` / `openTool(tool, stationId?)` / `close`） | classic script，各城 `{city}.js` 引入（须晚于 `route-planner.js`） | 地图小工具：入口在**车站详情与路线结果面板页签栏尾部的「分享」按钮旁边**（与分享按钮同款同处，由观察器补进去、按类名判重，故面板反复重建也不会重复；缩放条上原先那个入口已撤下）。从入口进来时会带上预设车站，省掉再点一次地图 —— **车站详情**带当前车站（两站汇合时它当 A，只需再点一个 B）；**路线结果**带 `[起点, 终点]`（route-panel 的 `cgo:route-opened` / `cgo:route-planned` 里取，`cgo:route-closed` 清空），于是**票价图与等时圈直接用起点站**、**两站汇合直接以起点为 A、终点为 B**（两者都在 `launchTool` 里按工具取：单站工具取第一个、汇合取前两个）。点开是**工具列表浮层**（与结果小窗共用同一套外观、位置与标题栏，不用 `cgo-modal`），内含**票价图（payment）**、**等时圈（time）**与**两站汇合（user）**三个分析工具。三者共用同一条链路——地图选站（胶囊提示条，样式同行程规划的选点提示；两站汇合要连着选两次，提示条会说清是第几个）→ 复用 `route-data` + `route-planner` 按「时间最快」逐站寻路（票价取 `plan().fare`、用时取 `plan().minutes`；两站汇合则对每站分别算到 A、到 B 的用时，取**有符号差值** tA − tB 作着色值，并按**总用时从短到长**推荐 `MEET_PICKS` 个汇合站（总用时相同则取用时差更小的）；建图后会自检连通性——抽样 24 个到达站、可达比例须 ≥ 30%，把"坐标索引尚未就绪就建出"的半成品网络丢掉不入缓存并自动重试一次，否则本会话之后的分析会一直沿用一张碎网络）→ 分层设色 → 图上叠加 → 结果小窗（标题栏 + 图例标尺 + 「更改车站 / 重新选站」chip）。**分层设色三段式**：① **低分辨率 IDW 值场**（`FIELD_CELL`=2）——每采样像素在**固定支撑域**内加权（半径 = 一个格网边长，权重 1/d⁴ 之外再乘一道在半径处归零的窗口），靠一张**站点网格桶**（前缀和 + 紧凑数组、整数格索引）按环逐圈取；**窗口化是关键**：站点进出加权集合时值是连续衰减到 0 的，不会沿网格线留下"方正"的接缝（早先按"最近 K 个"截断，集合成员一变值就跳，画出来正是一块块方盒子）；支撑域空时（郊区站点稀疏）**第二轮回退**到两倍半径（5×5 邻域）重算，**同样带窗口**——不带窗口只是把方盒子放大一圈，而"直接取最近那一站的值"会与周围的插值结果之间留一道硬边，图上那些生硬的"触角"多半出自这里（IDW 在孤立站点处的尖峰是算法固有特性，只能减轻）；② **值场平滑**（3×3 盒式、`SMOOTH_PASSES` 遍）——压掉站点附近被 IDW 顶起来的"平台"、削去细长尖刺；③ **1:1 输出**——双线性上采样值场后分档上色，并按**距离蒙版**（`FADE_START_FACTOR` / `FADE_END_FACTOR`，以平均站距为单位）让离车站很远的空白处平滑淡出，不再一路铺色到画布边；相邻像素跨等级处描白线（`EDGE_ALPHA`，线宽由 `EDGE_SPAN` 控制：距边界不超过该距离的像素都描白，等时圈只按 `EDGE_EVERY` 档的组界画）+ 沿线撒等级数值标签（`15分`/`3元`，间距 `LABEL_GAP`，标签按该处等值线走向旋转、无底色靠深描边，并**避让站点、站名标签与线路**）。③ 的 1:1 是关键：等级线若在低分辨率上画再被放大，必然是糊的。**距离蒙版**（`FADE_START_FACTOR` / `FADE_END_FACTOR`）的主要用途是**把线网边缘那些细长的等值线尖角（"触角"）糊掉**，顺带也让离车站很远的空白处淡出：贴车站的那圈保持实色，越往外越淡至全透明。**覆盖范围比画布大 `COVER_SCALE`=2 倍**（以画布中心向外扩），缩到城市最小缩放（默认 0.5）时视口也不露白；画布外没有站点，靠 IDW 外推把色带延展出去。**色标按工具区分且锚点固定**：等时圈蓝→绿→黄→红，票价图黄→绿→蓝→紫→粉；锚点取自 `referenceRange()` 估出的**全城极值**（均匀抽 `RANGE_SAMPLES` 个起点 × `RANGE_TARGETS` 座到达站求极值，按「城市 + 工具」缓存，只算一次）—— 于是等时圈的红色永远代表"全网最长用时"、票价图的粉色永远代表"全网最高票价"，换个起点颜色含义不变，而不是按当前起点铺满色标；**等时圈档宽就是 5 分钟**（`ISO_STEP`，档数不足 90 分钟时补足），色阶本身即细粒度；等级线与线上标签只按 `EDGE_EVERY` 档（15 分钟）一组来画 —— 5 分钟一条线的话线上会挤满数字，图例刻度也照此每 15 分钟标一个，**图例上的白线同样只画在这些组界上**（由 `bands.edgeEvery` 驱动，色标与地形图一一对应）；**刻度一律用绝对定位摆在 `tick.at` 给出的位置上**（不是 flex 均分：均分只能让两端贴边，中间几个会与白线错开）；**两站汇合**的量程固定为 ±`MEET_CAP`（每 `MEET_STEP` 分钟一档，0 附近是"汇合带"），色标从中间的黄往两侧**先淡化再变浓**（浅粉/浅蓝 → 深红/深蓝，直接插值会经过一片很脏的橙）；等级线按「白实线 / 白虚线 / **黄实线（差值 0）** / 白虚线 / 白实线」往外交替（图例同步用实线、虚线、黄实线三种线型；判定见 `meetCutKind`，⚠️ 组号是**较大侧**的，别再 +1，量程一变就会把黄线画到 −10 上去）；图上两个出发点的原图元整个让位给**落在车站位置上**的 `A` / `B` 标记（分别取色标两端的粉红与蓝），推荐汇合站的数值图元换成**黄底深字**（只把数字改黄在浅色主题下几乎看不清），推荐列表的序号标也是同一套黄色系，结果小窗标题里的箭头用 CGoUI 的 `vi-way` 矢量图标；超出量程的"外带"继续渐隐，色标两端标出"A / B 更近"；**票价图的图例标签按比例跳着标**（最多 6 个，首末必标），不再每块都写字。**悬停读数**（深色胶囊 + 分区色圆点 + 彩色数字，票价「预计 N 元」/等时圈「N 分钟」）不占用画布的指针事件——画布 `pointer-events: none`，监听挂在地图容器上，用 `#map-content` 的实测矩形反算到值场坐标（双线性取样）后读数，故地图拖拽缩放照常。**图上叠加**另起一层（`z-index` 夹在站点层与站名层之间）：各站图元改成**「大圆 + 数值」**、底色统一为地图背景色、边框取文本色，**尺寸固定 20×20 正圆**（数字超宽时由脚本横向压扁 `scaleX`，不把圆撑成椭圆）；并**只让有数值的车站让位**（逐站挂 `cgo-mt-hidden`；未开通站、国铁散点这些没被标注的车站，原图元原样保留）；起点站**复用核心的选中态**——给 `node_{sid}` / `label_{sid}` 挂 `.active`，与点击车站弹窗时的观感完全一致，并用 MutationObserver 看住这两个节点（核心每次选中都会 `clearHighlights()` 摘掉所有 `.active`，地形图展示期间起点这份要补回来）；`#map-content` 上的 `cgo-mt-terrain` 类只作样式挂钩，用来在地形图期间给**站名文字加描边**（色块铺上来会压掉站名的对比度）——用 `-webkit-text-stroke` + `paint-order`，描边宽度直接复用核心的 `--sta-stroke-width-cn` / `-en`，与核心给站名加 active 选中态时是同一套写法。各段都按 `SLICE_ROWS` 分片让帧，长耗时也不卡界面。**与其它浮层的关系**：**窄屏**（≤640，与 `viewport-inset` 同口径）上三块面板（车站详情 / 行程规划 / 路线结果）一出现，本模块面板即挂 `cgo-mt-yield` 收起来（它们收起后自动恢复）；**桌面端不互斥** —— 侧栏形态下车站详情是常驻的，一并让位就再也看不到色标与「更改车站」了（两者位置尺寸并不冲突，共存放得下），窗口跨过阈值时随 `resize` 重判。浮层本身向 `viewport-inset.js` 声明 `data-cgo-inset="right bottom"`，画布的平移边界与居中区于是把右下角一并让开（该模块原先只按"浮层在哪一侧"留白，贴角的浮层只留右侧并不够高），未声明该属性的浮层行为与从前完全一致。**分档完全由数据驱动**：票价按该城 `fare` 规则真正产生的金额分档（有几档算几档），等时圈按 5 分钟一档、档数不足 90 分钟时补足；因此城市改票价规则、增删车站、拆计费系统都不必改动本模块，未配 `fare` 的城市只是票价图不可用（面板明说）。取值全部派生自 `processedStations` 与规划内核，本模块不含任何城市私有数据 |

---

## 三、持续更新中的模块（供其他城市参考）

上游开发团队的建议是：这类内容**由各城市自行维护、保持非强制**，不进核心引擎的强制字段。
下面这些机制仍在持续增补；如果参与者想为自己的城市做同类内容，**直接参考对应城市的
实现模式即可**，不必从零设计。

| 机制 | 当前状态 | 参考入口 |
| :--- | :--- | :--- |
| 首末班车时刻渲染 | 三城统一中，共享层出渲染、城市只写取数与阈值 | `shared/timetable-renderer.js`、`city/shenyang/modules/shenyang_service_info.js`、`city/dalian/modules/dalian_timetable.js`、`city/changchun/modules/changchun_service_info.js` |
| 车站地图卡片 | 三城统一为同一份引擎 | `shared/stacard-engine.js`、各城 `stacard/script.js` |
| 侧栏站名标题归一化 | 三城统一为薄配置 | `shared/station-title.js`、各城 `modules/*_station_title.js` |
| 车站提示卡片 | 共享层出 DOM，城市只写命中判定与文案 | `shared/tip-card.js`、`city/shenyang/modules/shenyang_cultural.js` |
| 站名题字 | 沈阳专属，其他城市可选用 | `shared/calligraphy.js`、`city/shenyang/modules/shenyang_calligraphy.js` |
| **开通时刻** | 长春已接入（5 号线一期），沈阳、大连为空表待用 | `shared/opening-schedule.js`、各城 `data_opening.js` |
| **行程规划** | 三城已接入：共享层出算法、面板与坐标索引，城市只写 `reader` 取数 + `fareSystems` / `fare` 票价（沈阳、大连、长春均可显示票价） | `shared/route-data.js`、`shared/route-planner.js`、`shared/route-panel.js`、各城 `{city}.js` 的 `CGO_ROUTE_CONFIG` |
| **贯通运行（线路接续）** | 大连已接入（3 号线支线 ⇄ 13 号线在九里接续跑同一趟车）；其他城市按同一份 `lineLinks` 声明即可接入 | `shared/line-link.js`、`city/dalian/dalian.js` 的 `lineLinks` |
| **固定侧栏形态（浮岛卡片）** | 三城已接入；上游开发团队认可后再决定是否整体迁入 `core/` | `shared/sidebar-refit.js`、各城 `{city}.js` 里的引入行 |
| **地图小工具（票价图 / 等时圈）** | 东北四市已接入：共享层出选站、计算与分层设色（含悬停读数、起点选中光环与各站数值标注），城市无需新增任何配置（有 `CGO_ROUTE_CONFIG.fare` 即可出票价图） | `shared/map-tools.js`、各城 `{city}.js` 里的引入行 |

---

## 四、开通时刻（opening-schedule.js）

### 4.1 解决什么问题

城市的在建区段与车站往往**已经确定了开通时刻**（如「5 号线一期工程 9 月 28 日 7 时 58 分
开通初期运营」）。使用这个机制后：

- 维护者**提前把开通后的数据写好**，开通前界面依旧如实呈现「未开通」，不会抢跑；
- 到了开通时刻，车站站型、换乘关系与区段虚实**自动切换**，不需要卡点手工改数据；
- 上游不建议把开通时间做成强制字段，因此这里是**可选能力**：不写 `data_opening.js`
  或时刻表为空数组的城市，整条链路不产生任何影响。

### 4.2 数据格式

各城新增 `city/{city}/data_opening.js`，登记一个 `CGO_OPENING_SCHEDULE` 数组：

```js
const CGO_OPENING_SCHEDULE = [
    {
        id: "CCM05-phase1",              // 条目标识，仅用于阅读与日志
        lineId: "CCM05",                 // 线路 ID：用于取该线站序、匹配未开通区段
        name: "5号线一期工程",            // 展示名，出现在车站面板底部的倒计时里
        opensAt: "2026-09-28T07:58+08:00", // 开通时刻，精确到分，必须带时区偏移量
        opensAs: "dot",                  // 未开通车站开通后的站型，默认 "dot"
        mergedAs: "tsf",                 // 被并入的既有站升级后的站型，默认 "tsf"
        merge: {                         // 未开通站 → 既有站的合并映射（可选）
            "0127-1": "0127"
        },
        holdStations: ["0508"],          // 暂缓开通的车站 ID：所在区段开通时仍保持未开通（可选）
        notOpenLines: ["CCM05"]          // 需要撤销的 data_notopen.js 条目标识（可选）
    }
];
```

字段全部可选，只写 `lineId` + `opensAt` + `name` 也能工作（此时该线所有未开通车站
统一转为 `dot`，区段虚线保留）。

### 4.3 行为

| 时点 | 车站 | 区段 | 界面 |
| :--- | :--- | :--- | :--- |
| 开通时刻**之前** | 保持 `type: "no"`；数据里若已写成开通态，会被临时压回 `no` | `data_notopen.js` 的虚线保留 | 车站面板底部显示「该车站将于 9月28日 07:58 开通运营」，其下为「距开通还有 [XX]天 [XX]时 [XX]分 [XX]秒」（数字方块黑底白字），按秒刷新 |
| 开通时刻**之后** | 转为 `opensAs`（默认 `dot`）；`merge` 中的站并入既有站，既有站升级为 `mergedAs`（默认 `tsf`） | 撤销 `notOpenLines` 指定的虚线条目 | footer 恢复为常规外链按钮，车站检索与信息板恢复正常状态 |
| 页面正开着跨过时刻 | — | — | 定时器在时刻后 2 秒触发整页刷新，重新加载即为开通态 |

> **整线开通、个别站暂缓**：用 `holdStations` 列出暂缓开通的车站 ID。它们不随该条目转正，
> 也不显示倒计时——因为条目上的时刻指向的是所在区段而非该站自己，显示出来会误导；
> footer 因此回落为引擎原有的「该车站目前尚未运营」。待拿到该站的明确开通时刻后，
> 再单独登记一条 `stationIds` 指向它的条目即可。
> 实例：长春 5 号线一期 2026-09-28 开通初期运营时，长影旧址博物馆站暂缓开通。

> **换乘侧站：合并还是独立？** 关键看两站站厅是否连通——同一付费区内的换乘站写进
> `merge`（开通后合并为换乘站，如长春人民广场 `0127-1 → 0127`）；
> 若站厅互不连通、需出站另行购票（付费出站换乘），则**不要**写进 `merge`，
> 让它在开通后保留为独立车站，换乘关系登记到城市自己的 `data_virtual_transfers.js`。
> 实例：长春东大桥，3 号线与 5 号线为付费出站换乘，两站在图上是分开的两个点。

### 4.4 时区约定

`opensAt` 必须写成**带时区偏移量的 ISO 8601**（`2026-09-28T07:58+08:00`）。
省略偏移量的写法会被浏览器按访问者本地时区解释，跨时区访问就会整体偏移，
因此解析函数会直接拒绝这类值并在控制台给出提示。
显示时统一按 `Asia/Shanghai` 格式化，无需引入任何时区库。

### 4.5 换乘侧站的合并

「A 线已开通、B 线未开通」的换乘位置，长春的现有画法是**两个独立站点**：
已开通侧一个 `dot`，未开通侧一个 `type: "no"`，**不设虚拟换乘关系**。

开通后这两个站合并为一座换乘站：线路站序里对该站的引用整体改指到既有站
（`0127-1` → `0127`），未开通侧的车站条目被移除，既有站升级为 `tsf`。
合并动作由 `merge` 显式声明，不做命名约定推导——避免新城市沿用别的命名习惯时误合并。

> 与 [docs/NOT_OPEN_AND_QUASI_TRANSFER.md](../../../docs/NOT_OPEN_AND_QUASI_TRANSFER.md)
> 的关系：该文是「**部分**线路未开通的换乘站该怎么画」的设计结论，讨论的是过渡期表现；
> 本机制解决的是「到了开通时刻该变成什么」的时序问题，两者互补、不冲突。

### 4.6 加载与调用链

```
各城 {city}.js
  └─ loadStationBoardModules()
       ├─ document.write shared/opening-schedule.js   ← 暴露 window.CGoOpening、按需注入倒计时样式
       └─ document.write {city}/data_opening.js       ← 定义全局 CGO_OPENING_SCHEDULE
                          ↓
core/script.js 模块顶层
  └─ applyOpeningSchedule()   ← 通用可选钩子，把 CGO_OPENING_SCHEDULE 交给 CGoOpening.applySchedule()
       ↓                        必须早于 init()（渲染）与 DOMContentLoaded（notice.js 推送通知）
core/script.js init()
  └─ processData()            ← 派生出的站型与经停线路取自转换后的数据
```

`core/script.js` 里只有一处通用入口，不含任何城市业务；未接入该能力的城市
（无 `window.CGoOpening` 或未声明 `CGO_OPENING_SCHEDULE`）整段直接跳过。

面板渲染时，未开通车站（`type: "no"`）的 footer 由内置模块 `footer-actions` 向本层取内容：

```
用户点击未开通车站 → StationBoard 渲染面板
  ├─ footer-actions.render()    → CGoOpening.renderPendingNotice(station)
  │                                 有登记：开通日期文案 + 倒计时
  │                                 无登记：回落到引擎原有的「该车站目前尚未运营」
  └─ footer-actions.onMounted() → CGoOpening.mountPendingNotice(container)
                                    启动秒级刷新；换站 / 关面板后节点断开时自动退场
```

### 4.7 调试与自查

浏览器里验证三种状态不必改城市数据——URL 上挂 `openingTest` 参数即可把全部条目的
开通时刻临时覆盖掉，刷新页面或去掉参数即恢复（仅带参数时生效，正常访问零影响）：

| 要验证的状态 | 访问参数 |
| :--- | :--- |
| 开通后状态 | `?openingTest=-1d`（一天前就已开通）；也可写绝对时刻 `?openingTest=2020-01-01T00:00+08:00` |
| 开通前状态 | `?openingTest=1d`（一天后才开通），可看到开通日期与倒计时 |
| 跨过开通时刻自动刷新 | `?openingTest=2m`，打开未开通车站的面板停留两分钟，到点应自动整页刷新并转为开通态 |

参数既接受相对偏移（`30s` / `2m` / `1h` / `1d`，前置 `-` 表示过去），也接受带时区偏移量的绝对时刻。
正向偏移建议直接写 `2m` 而不要写 `+2m`——query string 里的 `+` 会被 form-urlencoded 规则解码成空格
（代码已做 trim 兼容，但无符号写法最稳）。

> 该调试入口有**两道门槛**：URL 带 `openingTest`，且当前访问来源是本地 / 内网
> （`localhost`、`::1`、`*.local`、`127.x`、`10.x`、`192.168.x`、`172.16–31.x`）。
> 线上访客即便照文档拼出参数也不会生效，控制台会给出提示。

### 4.8 新开通线路的一次性通知

开通时刻已过、且仍在推送窗口内（默认**开通后 30 天**）的条目，会在访客打开该城市地图时
推送一条一次性通知（分类 `ops` 运营信息），并同步出现在「帮助与关于」的公告列表里。

- 由本层 `getOpenNotices()` 产出，`core/notice.js` 在推送前合并进自己的 `items`；
- **一次性**复用 notice 的已读记录（`localStorage: nal_notice_read_ids`），id 形如
  `opening-{cityId}-{lineId}-{开通时刻毫秒}`：改一次开通时刻就是一条新通知，改回来又算未读。
  带城市前缀是因为已读记录全局只有一份，避免两城撞 lineId 时互相吃掉通知；
- 文案默认「{name} 已于 X月X日 XX:XX 开通运营」，城市可用 `noticeSummary` / `noticeDetail` 覆盖；
- 卡片的强调色（左侧竖条与分类标题文字）取该线路的标志色，与图上那条线对得上；
  线路没有 `color` 时回落到分类色（`ops` 的橙色）；
- 用 `noticeWindowDays` 可单独调整该条目的窗口天数（例如临时线路只想提示一周）；
- 带调试参数（`openingTest`）时通知照常展示，但**不写已读记录**，退出调试后正式访问仍会推一次。

改动本机制后，建议至少确认这几件事：

1. **开通前**：目标车站仍是 `no`、`NOT_OPEN_LINES` 条目仍在，footer 显示开通日期且倒计时逐秒跳动（换站后旧定时器已停止）；
2. **开通前 1 分钟**：状态不变，不能提前切换；
3. **开通后 1 分钟**：车站站型已变、`merge` 源站已并入、区段虚线已撤销；
4. **空时刻表的城市**：数据、渲染与面板均无任何变化；
5. `sw.js` 的 `CACHE_NAME` 与各页面 `?v=` 版本串已递增（见第五节）。

---

## 五、改动本目录的约定

1. **必须递增缓存版本**：任何新增文件或逻辑修改，都要同步递增 `sw.js` 的 `CACHE_NAME`，
   并把新文件登记进 `ASSETS_TO_CACHE`；页面直接引用的脚本还要递增对应页面的 `?v=` 版本串，
   否则普通刷新可能仍命中浏览器自身缓存（项目铁律）。
2. **保持解耦**：本目录不得引用具体城市的站名、线路 ID 或私有数据；
   城市侧通过配置文件或 `{city}.js` 里的薄配置接入。
3. **同步文档**：新增共享能力后，在本文件第二节与第三节各补一行，让后来者能直接找到入口。
4. **自维护能力统一 `cgo` 前缀**：本目录新增的对外接口、全局变量、CSS 类名与 `data-*` 属性
   一律带 `cgo` / `CGo` 前缀，例如 `window.CGoOpening`、`CGO_OPENING_SCHEDULE`、
   `.cgo-opening-pending`、`data-cgo-unit`，事件走 `cgo:` 命名空间
   （如 `cgo:opening-schedule-ready`）。这样既便于检索归属，也避免与后续新增的同名标识符冲突。

   > ⚠️ **前缀不代表官方归属**：`cgo` 是本项目统一的命名空间，上游核心同样在用
   > （`window.CGoPathGeometry`、`window.CGoStationIcons`、`CGO_ASSET_VERSION`、`cgo-icon`），
   > 因此带该前缀**并不表示**某项能力已被上游收录或获得背书。判断一个能力属于核心还是
   > 各城自维护，看它的**位置**：`core/` 为上游核心；`city/{city}/shared/`、各城 `modules/`
   > 与 `data_*.js` 为自维护内容（第三节即其清单）。
