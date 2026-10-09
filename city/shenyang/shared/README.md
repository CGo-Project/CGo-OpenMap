# 多城共享层（city/shenyang/shared/）

> ⚠️ **临时共享位置**
> 本目录挂在沈阳城市目录下，实际由 **沈阳、大连、长春、哈尔滨、呼和浩特** 五城共用；另有福州接入其中的行程规划链、最近车站、侧栏形态与地图小工具（见第三节）。
> 计划在开发团队确认共享位置后整体迁入 `core/`，届时只需 `git mv` 并改动各城
> `{city}.js` 里的引用路径与 5 处 stacard import（沈 / 大 / 长 / 哈 / 呼 的 `stacard/script.js`），**零逻辑改动**。
> 迁移步骤见 [docs/STACARD_TIMETABLE_UNIFICATION.md](../../../docs/STACARD_TIMETABLE_UNIFICATION.md) 第 2.4 节（该文 4.4 节讲的是同名站索引）。

---

## 一、这里放什么

三条同时满足，才应该放进本目录：

1. **多城共用**：已有城市接入，其余城市可直接复用同一份实现；
2. **不含城市业务**：不出现具体站名、线路 ID、季节阈值、运营公司等城市私有数据；
3. **可被薄配置驱动**：城市侧只写差异（文案、阈值、取数），机制部分留在这里。

反例：沈阳的题字素材与 `data_calligraphy.js`、长春的 `data_opening.js` 属于城市数据，
留在各自城市目录；把素材渲染出来的通用算法才放这里。

---

## 二、文件清单

| 文件 | 对外接口 | 加载方式 | 职责 |
| :--- | :--- | :--- | :--- |
| `timetable-renderer.js` | `window.CGoTimetable`、`window.CGoDayType` | classic script，按需引入（沈 / 大 / 长 / 呼 已引入；哈尔滨未引入） | 首末班车「行 → HTML」、日期类型与季节判定、终点站代号解析，详见 2.1 |
| `stacard-engine.js` | 具名导出 `createStaCard`；另外把瓦片与投影挂到 `window.CGoMapTiles` | ES module，五城（沈 / 大 / 长 / 哈 / 呼）的 `stacard/script.js` 相对 import | 高德瓦片地图卡片（ES module）；并把瓦片与投影挂到 `window.CGoMapTiles` 供 classic script 取用，详见 2.1 |
| `station-title.js` | `window.CGoStationTitle.createStationTitleNormalizer` | classic script，接入城市在 `{city}.js` 引入（沈 / 大 / 长 / 哈） | 侧栏站名标题归一化（站类判定、标题拼装、MutationObserver 安装与防自触发） |
| `tip-card.js` | `window.CGoTipCard.render` | classic script（目前仅沈阳引入） | 车站信息板提示卡片 DOM（与上游官方模板结构一致） |
| `label-active.js` | `window.CGoLabelActive`（`sync`） | classic script，目前仅沈阳在 `{city}.js` 引入 | 呼出线随站名标签同步 active 与淡化（按 `data-cgo-callout` 配对），详见 2.1 |
| `calligraphy.js` + `calligraphy.css` | `window.CGoCalligraphy.register` | classic script（目前仅沈阳引入） | 站名题字渲染机制（沈阳特色，其他城市可选用）；素材缺失时给「投稿 / 反馈」入口，详见 2.1 |
| `facilities.js` + `facilities.css` | `window.CGoFacilities`（`register` / `registered`） | classic script，接入城市在 `{city}.js` 引入（沈 / 大 / 长 / 呼），须早于城市设施模块 | 车站设施板块（配置驱动，含可选的车站层级图），详见 2.1 |
| `feedback.js` + `feedback.css` | `window.CGoFeedback`（`open` / `registerKind` / `kinds`） | classic script，接入城市在 `{city}.js` 引入（沈 / 大 / 长 / 哈 / 呼；福州未接入）（**建议**早于 `exits.js` 与 `calligraphy.js`；这两者都在**打开面板前补登记**一次自己的场景、幂等，故先后顺序并不敏感，见 `exits.js` 内注释） | 反馈面板：出入口「待补充」、题字投稿与右上角「更多」入口共用，七类场景，详见 2.1 |
| `exits.js` + `exits.css` | `window.CGoExits.register` | classic script，接入城市在 `{city}.js` 引入（沈 / 大 / 长 / 哈 / 呼），须早于城市出入口模块 | 车站出入口独立页签：分布小地图 + 出口条目，配置驱动，详见 2.1 |
| `exit-vertical.js` | `window.CGoExitVertical`（`codesOf` / `match` / `collect` / `rowHtml`） | classic script，**沈阳 / 大连 / 长春**在 `{city}.js` 引入，**须早于 `facilities.js` 与 `exits.js`**（两者都调用它；未引入的城市经可选链跳过） | 把属于某个出口的扶梯 / 电梯从设施板块搬到出口页签（前缀判据），详见 2.1 |
| `opening-schedule.js` | `window.CGoOpening` | classic script，接入城市在 `{city}.js` 引入（沈 / 大 / 长） | 未开通区段与车站的**开通时刻**：状态转换、待开通登记、到点自动刷新，以及未开通车站 footer 的开通文案与倒计时（详见第四节） |
| `opening-schedule.css` | — | 由 `opening-schedule.js` 按自身 URL 注入 | 上述倒计时框的样式（同 `calligraphy.css` 的做法） |
| `line-link.js` | `window.CGoLineLink`（`list` / `atStation` / `ofLine` / `throughPairs` / `mergeStationLines`） | classic script，**目前仅大连**在 `{city}.js` 引入，须早于 `route-data.js` | 线路接续声明解析：城市用 `lineLinks` 声明「哪两条线在哪个站接续、是否贯通运行」。声明 `through: true` 时，规划内核把经由衔接站的跨线视作同一列车（不计换乘、无换乘耗时），车站详情也把整条贯通区段合并成一条线、相邻站跨线相连 |
| `loop-direction.js` | `window.CGoLoopDirection`（`of` / `label` / `orientation`） | classic script，按需引入（沈 / 大 / 长 / 哈 / 福 已引入；呼和浩特无环线，未引入），须早于行程规划与时刻表渲染 | 环线乘车方向的环别文案（按站序做鞋带公式判顺 / 逆），详见 2.1 |
| `geo-estimate.js` | `window.CGoGeoEstimate`（`estimateForPair` / `applyToPanel` / `loadCoordIndex` / `ready`） | classic script，接入城市在 `{city}.js` 引入（沈 / 大 / 长） | 站距「约X米」估算的经纬度优先实现：观察 `#info-panel`，把命中的「(约X米)」按球面距离**就地改写**（核心是 ES module、顶层函数与 `STATION_GEO_MAP` 不外泄，无法外部覆盖，故走事后改写）；同城同名歧义或球面值异常偏离时保留画布值 |
| `route-data.js` + `route-planner.js` + `route-panel.js` + `route-panel.css` | `window.CGoRouteData`（`build` / `amapCoordIndex` / `collectVirtualTransfers` / `hourSlots`）、`window.CGoRoutePlanner`、`window.CGoRoutePanel` | classic script，六城在 `{city}.js` **按 data → planner → panel 的顺序**引入（沈 / 大 / 长 / 哈 / 呼 / 福） | 行程规划：网络构建 / 多目标 Dijkstra / 票价结算 / 结果面板（**须按 data → planner → panel 的顺序引入**），详见 2.1 |
| `nearest-station.js` + `nearest-station.css` | 无对外接口（自动接管 `#locate-btn`） | classic script，六城在 `{city}.js` 引入（沈 / 大 / 长 / 哈 / 呼 / 福） | 跨城市「查找最近车站」：在 `#locate-btn` 上以**捕获阶段**扣下核心 `findNearestStation` 的点击，本模块自足地定位、换算 GCJ-02、比对全城站点后，改用 `cgo-modal` 三选一（切换到更近的城市 / 查看当前城市最近车站 / 取消），替掉核心那个同步 `confirm`；样式表由脚本按自身 URL 注入 |
| `sidebar-refit.js` + `sidebar-refit.css` | `window.CGoSidebarRefit`（`refresh`） | classic script，六城在 `{city}.js` 引入（沈 / 大 / 长 / 哈 / 呼 / 福）（**须晚于 `route-panel.js`**，同名同权重样式以本层为准） | 桌面端固定侧栏（body.legend-pinned）形态改造，向官方 /map 靠拢，详见 2.1 |
| `viewport-inset.js` | 载体 `window.CGoViewportInsets`（`{left, right, bottom}`，px）、接口 `window.CGoViewportInset`（`refresh` / `compute` / `fit`） | classic script，六城在 `{city}.js` 引入（沈 / 大 / 长 / 哈 / 呼 / 福） | 浮层遮挡上报：把「哪一侧被遮多少」写回引擎，详见 2.1 |
| `map-tools.js` + `map-tools.css` | `window.CGoMapTools`（`open` / `openTool(tool, stationId?)` / `close`） | classic script，六城在 `{city}.js` 引入（沈 / 大 / 长 / 哈 / 呼 / 福）（须晚于 `route-planner.js`） | 地图小工具（票价图 / 等时圈 / 多人汇合）：入口、选站链路、分层设色与结果小窗，详见 2.1 |

### 2.1 各模块要点

> 上表只留一句话职责；下列模块的机制细节较多，单独成小节（排列与表格行序一致）。

#### timetable-renderer.js —— 首末班车渲染与日期 / 季节判定

首末班车「归一化行 → HTML」、日期类型判定（`workday` / `restday`，可选调休日历）、**季节判定（阈值由城市传入）**、终点站代号解析（`line-first` / `line-last` 跳过未开通车站）、未开通车站过滤、按日期类型取行（`rowsForDayType`）、季节与日期类型标签的差异判定。<br>行模型见文件内 typedef：`first` / `last` 一律是字符串，日期类型分档落在**行**上（行带 `dayType`，缺省为通用），共享层不猜值的形状

#### stacard-engine.js —— 高德瓦片地图卡片

高德瓦片地图卡片：坐标索引、占位 HTML、瓦片网格、缩放交互、ResizeObserver 生命周期。`window.CGoMapTiles = { TILE_SIZE, getTileUrl, lngLatToPoint }` 是**给 classic script 用的共享出口**：本引擎是 ES module，而出入口页签（`exits.js`）是 classic script，两边无法互相 import，挂全局总好过让那边复刻一份瓦片模板与投影（本文件开头刚收敛过三份重复实现）。使用方须在**渲染时**读取（本模块 defer 加载，早于其时机的取不到）

#### label-active.js —— 呼出线随标签进入 active

呼出线随站名标签进入 active、也随它淡化：城市给引线元素打 `data-cgo-callout="<车站 ID>"`（引线重建时也要带上）、给装引线的图层打 `data-cgo-callout-layer`，本模块据此把「标签 `label_<ID>` 带 `.active`」同步成引线的 `cgo-callout-active`，并把标签的计算淡化抄给引线（`opacity` 与 `filter` 都抄：路线高亮的淡化走 `filter`、核心让位支线走内联 `opacity`）。引线整层重画后由本模块补回。只管类名与引线自己的 opacity/filter，线宽/颜色等观感由城市样式表定义（沈阳见第三节）

#### calligraphy.js + calligraphy.css —— 站名题字

站名题字渲染机制（沈阳特色，其他城市可选用）；样式表由脚本按自身 URL 注入。题字素材缺失时（横图未采集 / 题写者待考）在展开区给出一句说明 + 一个「投稿 / 反馈」按钮，点击打开共享层的反馈面板（`feedback.js` 的 `CGoFeedback.open({ kind: "calligraphy", … })`——本模块只注册这一种场景的文案，联系方式与正文模板都在反馈层，不再硬编码主理人链接与 QQ 群号）

#### facilities.js + facilities.css —— 车站设施板块

车站设施板块（配置驱动）：城市只声明数据全局名、各类设施的名字与 CGoUI 图标、可选的**车站层级图**（官网剖面图热链）与来源标注；渲染、逐条开合（`详情 / 收起`）与「官网图加载失败即清空该块」都在本层。位置段是自由文本、按来源原文逐段展示；换乘站的段落带 `line` 时标出线名（两条线**共用**的位置在抓取阶段已合并、不带 `line`，故不标）。类型可带 `tone`（如长春给 AED 配 `tone: "alert"`），本层把它转成 `cgo-fac-row--<tone>` 修饰类，配色由本层样式表给（`alert` = 图标与开合按钮文字转红，用于急救设备）。样式表由脚本按自身 URL 注入。沈阳、大连、长春、呼和浩特已接入（大连官网无剖面图，故不配 `levelMap`；长春的换乘站按已查证的共用站厅 / 同台换乘登记表合并，见第三节）

#### feedback.js + feedback.css —— 反馈面板

反馈面板：站内所有「向维护者反馈数据问题」的地方共用它——出入口说明缺失（`exits.js` 的「待补充」标）、题字素材缺失（`calligraphy.js` 的投稿按钮）、以及**右上角「更多」菜单里的「反馈与纠错」**（本模块在运行时把这一条补进 `main.html` 的下拉里、插在「偏好设置」之后，不侵入 `main.html` / core，与 sidebar-refit、map-tools 同一手法；菜单最终顺序为 地图小工具 → 偏好设置 → 反馈与纠错 → 帮助与关于 → 贡献与主理人，末项是静态的 CONTRIBUTING 入口）。面板把**定位信息**拼成一段可复制的正文（城市 / 车站 ID / 相关数据文件路径），给出「复制」「新建 GitHub Issue（预填标题与正文）」「加入 QQ 群」三条出口，剪贴板不可用（非 https / localhost）时退回「选中正文 + 提示手抄」。场景由使用方 `registerKind(id, template)` 注册：模板含 `modalTitle` / `heading` / `subject` / `context` / `notePlaceholder`，**写了 `label` 的才会出现在「更多」入口的场景切换里**（`order` 决定排序，缺省 500）；本模块内置 `general`（其他 / 综合）、`timetable`（首末班车）、`fare`（票价）、`route`（路线规划）、`ux`（操作体验）五种，`exits.js` 注册 `exit`（出口说明）、`calligraphy.js` 注册 `calligraphy`（站名题字）——共七类，切换器里的顺序是 出口说明 → 站名题字 → 首末班车 → 票价 → 路线规划 → 操作体验 → 其他。从通用入口进来的场景没有车站 / 出口上下文，模板会退化成「请在补充说明里写明」；**路线规划**会带上最近一次查询的起终点（监听 `route-panel` 本就发出的 `cgo:route-planned`，反馈层因此不反向依赖规划内核）。`open()` 在调用方未给 `cityId` 时回退到当前城市（`CURRENT_CITY` / `CityDataManager`），故通用入口的正文里不会出现空城市。仓库地址、QQ 群号与分享链接都是**项目级常量**（不含任何城市私有信息），可用 `window.CGO_FEEDBACK_REPO` / `window.CGO_FEEDBACK_QQ` / `window.CGO_FEEDBACK_QQ_URL` 覆盖（链接置空串则该按钮不出现）。样式表由脚本按自身 URL 注入

#### exits.js + exits.css —— 出入口独立页签

车站出入口**独立页签**（配置驱动）：顶部一张**分布小地图**（标出各线路的站厅位置与全部出入口；瓦片与 Web Mercator 投影取自 `window.CGoMapTiles`，见 `stacard-engine.js`；容器未显示时用 ResizeObserver 等它露面再画），下面是一条条出口——「方形编号徽标 + 出口描述 + 所属线路 + 公交线路 + 周边地标 + 该口的扶梯 / 电梯（后者见 `exit-vertical.js`）」，各字段缺哪个就不渲染哪一行；出口之间用**虚线底线**分隔（不再各自成卡片），`closed` 为真的整条压暗并加标签。**地图上的标记配色全部硬编码、不跟随亮暗主题**（底图是浅色栅格图，跟随主题会在暗色下变成白底浅字）：线路站厅直接沿用 `.stacard-pin-dot` 的观感（12px 圆点 + 白描边 + 投影，只靠颜色区分线路、**不带文字**），出入口则是白底胶囊 + 编号，两者一眼分得开。**出口标题就是 `desc`**（维基「出口指示」原文，如「解放路（西侧）」；维基没给的口以「相对所属线路站厅的方位」填空，如「西北口」）——编号由左侧方形徽标承载，标题里不再重复；**只有没有 `desc` 的口**才回落成「A 口 / 1 号口」这样的编号文案（以数字开头的写「1 号口」，哈尔滨的出口编号就是 1 / 2 / 3a 这种）。**兜底的 `roads`**（最近道路的侧向，形如「迎宾街 路南/北站路 路东」，四正方向、最多两条**且必定互相垂直**）只在没有 `desc` 时以弱化小字跟在标题后，免得同一件事说两遍。**说明未收录的口挂「待补充」标**：`desc` 缺失、或它只是「相对站厅方位 + 口」的填空（`desc === bearing + "口"`）时，标题旁出现一枚虚线胶囊，点它打开共享层的**反馈面板**（`shared/feedback.js`；本模块只把「出口说明」这一种场景的文案注册进去，正文带出口编号与数据文件路径）。`window.CGoExits.openFeedback(ctx)` 保留为转发入口。高德逆地理的「最近路口方位」留在 `geoDesc`，**只留档不渲染**。`bearing`（相对所属线路车站的 8 向方位）**仍只存不渲染**。**编号徽标恒为 22×22 正方形**：多段编号按「第一段连续字母 / 数字」拆成主字 + `<sub>` 下标（C1 → C₁、D1 → D₁），仍放不下的由 `onMounted` 按实测宽度横向 `scaleX` 压扁，不把正方形撑成长方形。页签本身由城市在 `stationBoard.tabs` 里声明（`{ id: "<city>-exits", title: "出入口", icon: "gate" }`，`id` 与共享层模块的 `targetTab` 一致），渲染在「车站信息」之前，**激活底线取 `--success-color`**（按 `data-custom-tab$="-exits"` 匹配，与线路页签的线路色、车站信息的文字色区分开）；另配 `facilityGlobals`（指向城市设施表）时才会把扶梯 / 电梯挂到出口下。样式表由脚本按自身 URL 注入。已接入：大连（官网接口 + 高德补方位与坐标）、沈阳 / 长春 / 哈尔滨 / 呼和浩特（前三者来自高德 Web 服务 API，呼和浩特来自中文维基百科）

#### exit-vertical.js —— 出入口垂直交通搬迁

把设施数据里「属于某个出入口的扶梯 / 电梯」从车站设施板块搬到出口页签：`facilities.js` 渲染前用 `match(type, text)` 过滤掉已搬走的段（整条被搬空则该行消失），`exits.js` 用 `collect(facilities)` 取到每个出口名下的设施并渲染成「图标 + 名称 + 位置原文」。城市在 `{city}.js` 顶层声明 `window.CGO_EXIT_VERTICAL = { types }`：`types` 是参与搬迁的设施类型，各自带展示名 / 图标（须与城市 `*_facilities.js` 的 `types` 一致）与位置前缀正则 `patterns`；类型自己没写 `patterns` 则回退到顶层的 `patterns`（大连即此写法）。⚠️ **判据必须是前缀，不能是「文本里出现了出口编号」**——「地面-站厅 A出入口附近」（出口本身就是起终点，该搬）与「站厅-站台 A出入口附近」（站内电梯，只是位置靠近出口，不该搬）都提到出口编号，只有前缀能区分。⚠️ **前缀还必须按类型分开配**：同一句「站厅层 …出入口」对上行与下行含义正好相反——上行扶梯在站厅层，是「站厅 → 地面出口」的起点（属于出口）；下行扶梯在站厅层，是「站厅 → 站台层」的向下交通（与出口无关），真正属于出口的下行扶梯位置写的是「地面层」（地面 → 站厅）。三类共用一组前缀会把站厅层的下行扶梯误搬进出口（沈阳实测多搬 122 条，已修正）。沈阳的配置：`elevator` 用 `地面-站厅 / 地面-过街通道-站厅 / 站厅-地面`，`escalator_up` 用 `站厅层 / 地下一层`，`escalator_down` 用 `地面层`；大连用顶层 `patterns: [/^站外/]`，其混合描述（「站外电梯：A口旁1台，站厅与站台中间位置1台」）整条搬走并保留原文。长春已接入：本城设施表里「无障碍电梯 / 升降平台」的位置多以出口编号开头（「D口」「A、C口通道」「A2口升降平台」），另有「站外C口」以「站外」开头，故两类共用顶层 `patterns: [/^[A-Za-z]{1,2}\d{0,2}(?:[、,，和及][A-Za-z]{1,2}\d{0,2})*\s*口/, /^站外/]`（77 站 / 95 段搬到出口下），不以出口开头的位置（「换乘通道，站厅层中部」「站台层北侧」「站内A口」）属站内垂直交通，留在设施板块。未加载本层、也未声明 `CGO_EXIT_VERTICAL` 的城市经可选链跳过，行为与从前完全一致

#### loop-direction.js —— 环线环别文案

环线乘车方向的**环别文案**：环线没有终点站，方向只能报「下一站 + 内环 / 外环」。中国等右侧通行城市默认「内环 = 顺时针、外环 = 逆时针」，城市可用 `window.CGO_LOOP_DIRECTION = { clockwise, counterclockwise }` 覆盖命名。顺 / 逆按**站序**（`stationIds`）做鞋带公式判定——规划内核给出的 `dir` 正是相对站序的，两者必须同口径；折线的绘制方向未必与站序一致，拿折线去判会把内外环弄反。行程规划结果面板与时刻表行（`TimetableRow.ring`）共用

#### route-data / route-planner / route-panel —— 行程规划

行程规划：网络构建（时刻表实测区间用时 + 坐标里程兜底 + 站外换乘 + 贯通直通 + 未开通车站的穿过判定）、多目标 Dijkstra（最快 / 最短 / 最少换乘 / 最省）、按计费系统结算票价（`fareSystems` 把各自购票的有轨等拆成独立系统，付费出站换乘另行购票）、结果面板与图上高亮。「我的位置」按需取坐标索引

#### sidebar-refit.js + sidebar-refit.css —— 桌面端固定侧栏形态

桌面端固定侧栏（`body.legend-pinned`）形态改造，向官方 `/map` 页面靠拢：① 实测标题栏浮岛矩形（写回 `--cgo-sb-*`），侧栏铺满窗口上下左边缘、右缘与浮岛右缘对齐，内容顶部让开浮岛；② 撤下侧栏顶端的返回/固定按钮与那条 40px 假标题栏，把「取消固定」搬到浮动缩放条的检索面板按钮位（搬的是同一个 `#legend-pin-btn` 节点）；③ 各区块退成「自带底色 + 单条描边 + 圆角 + 等距」的小卡片，标题栏线路色块换成结果面板同款迷你线路标（16px 正方/正圆 + 线路编号，编号规则与 `route-panel.js` 一致；国铁散点线用 railway 图标 + 线路徽标底色）；④ 拖到侧边的停靠提示框顶到窗口顶部、只留右缘虚线，磨砂取 CGoUI 玻璃体系轻档 `--glass-backdrop-blur`；⑤ 展开的车站窗口不足 22em 时，先收起侧栏里其它占高度的可折叠区块（核心各 `panel-section`、行程规划的 `#cgo-route-card` 与 `#cgo-route-result`，以及其它车站窗口），再逐个清退最旧的折叠窗口给它腾高度（沿用核心原先的退场动画，每个都等动画走完再判下一个；核心只按「固定保留 N 条」裁剪，与侧栏实际高度无关），达标即停；清掉的站同步移出 `window.STATION_HISTORY`，免得核心下次重建又放回来；⑥ 车站窗口的**页签栏收细内边距**——内核 `.tab-item` 的 9/13/7/13px 在窄侧栏里偏胖、页签一多就横向滚动，收成约 1/3（3/4/2/4px），字号行高不动，一栏能多露出一个页签；样式表由脚本按自身 URL 注入

#### viewport-inset.js —— 浮层遮挡上报

浮层遮挡上报：只统计 `position: fixed` 且确实可见的面板（核心的 `#info-panel`、行程规划 `#cgo-route-card`、结果 `#cgo-route-result`，以及任何自行声明 `data-cgo-inset` 的浮层——小工具就是用它补上贴角浮层那个 `bottom`），把「哪一侧被遮多少」写回 `window.CGoViewportInsets`，由引擎的 `getViewportInsets()` 消费、收窄平移边界与居中区；遮挡一变就调一次核心的 `enforceBoundaries()` 与 `updateMapTransform()`，全为 0 时与不加本模块完全一致。口径：桌面端按浮层**实际所在的那一侧**留白（跨过中线才左右互换），窄屏按贴底抽屉的高度留底；只认浮层，固定侧栏里的区块是文档流内排布、不与画布重叠，天然不计入，故本模块不需要知道任何形态细节。**窄屏另做一次「主动避让」**：光把平移**区间**放宽是看不见的——内容仍停在原地被压在浮层底下，故在遮挡变化时把地图整体平移「可用区中心移动的那段距离」。该中心的底部口径**必须与引擎 `getViewportCenter()` 一致**（同样含 `mobile-split-active` 期间「0.6 容器高」的托底）：引擎在点选车站时已按这个中心把车站取好景，本模块再按抽屉真实高度算一遍的话，两次位移会叠加、把选中车站顶出屏幕。`fit(box)` 是「查看全程」的取景口（缩放钳在城市 `minScale` / `maxScale` 之内，带一段复用核心 `.animate-zoom` 的过渡）

#### map-tools.js + map-tools.css —— 地图小工具

地图小工具：入口在**车站详情与路线结果面板页签栏尾部的「分享」按钮旁边**（与分享按钮同款同处，由观察器补进去、按类名判重，故面板反复重建也不会重复；缩放条上原先那个入口已撤下）；另在**右上角「更多」菜单**里补一条「地图小工具」（插在「偏好设置」之前，与母产品那条菜单的顺序一致；工具列表面板是贴右下角的固定浮层、不依赖锚点元素，故从菜单进入照常可用）。从入口进来时会带上预设车站，省掉再点一次地图 —— **车站详情**带当前车站（多人汇合时它当 A，只需再点一个 B）；**路线结果**带 `[起点, 终点]`（route-panel 的 `cgo:route-opened` / `cgo:route-planned` 里取，`cgo:route-closed` 清空），于是**票价图与等时圈直接用起点站**、**多人汇合直接以起点为 A、终点为 B**（两者都在 `launchTool` 里按工具取：单站工具取第一个、汇合取前两个）。点开是**工具列表浮层**（与结果小窗共用同一套外观、位置与标题栏，不用 `cgo-modal`），内含**票价图（payment）**、**等时圈（time）**与**多人汇合（user）**三个分析工具。三者共用同一条链路——地图选站（胶囊提示条，样式同行程规划的选点提示；多人汇合要连着选两次，提示条会说清是第几个）→ 复用 `route-data` + `route-planner` 按「时间最快」逐站寻路（票价取 `plan().fare`、用时取 `plan().minutes`；汇合图则对每站分别算到各出发点的用时 —— 两点取**有符号差值** tA − tB 作着色值，出图后再点一座车站即加入第三人、**升级为三点汇合**（C 的语义色为绿），此时改为**三者用时的极差** max − min（三个出发点之间没有"哪边更近"，色标随之变单向，0 = 三人同时到），并按**总用时从短到长**推荐 `MEET_PICKS` 个汇合站（总用时相同则取用时差更小的）；共乘过滤只对两点生效 —— 它本意是"两人本可以更早在某站碰头，再往后是白绕"，这层推理对同行的两人成立，三人汇合点哪怕其中两人早已同行，对第三个人仍是真碰头点）；建图后会自检连通性——抽样 24 个到达站、可达比例须 ≥ 30%，把"坐标索引尚未就绪就建出"的半成品网络丢掉不入缓存并自动重试一次，否则本会话之后的分析会一直沿用一张碎网络）→ 分层设色 → 图上叠加 → 结果小窗（标题栏 + 图例标尺 + 「重新选站」chip，图标为 `location`）。**分层设色三段式**：① **低分辨率 IDW 值场**（`FIELD_CELL`=2）——每采样像素在**固定支撑域**内加权（半径 = 一个格网边长，权重 1/d⁴ 之外再乘一道在半径处归零的窗口），靠一张**站点网格桶**（前缀和 + 紧凑数组、整数格索引）按环逐圈取；**窗口化是关键**：站点进出加权集合时值是连续衰减到 0 的，不会沿网格线留下"方正"的接缝（早先按"最近 K 个"截断，集合成员一变值就跳，画出来正是一块块方盒子）；支撑域空时（郊区站点稀疏）**第二轮回退**到两倍半径（5×5 邻域）重算，**同样带窗口**——不带窗口只是把方盒子放大一圈，而"直接取最近那一站的值"会与周围的插值结果之间留一道硬边，图上那些生硬的"触角"多半出自这里（IDW 在孤立站点处的尖峰是算法固有特性，只能减轻）；② **值场平滑**（3×3 盒式、`SMOOTH_PASSES` 遍）——压掉站点附近被 IDW 顶起来的"平台"、削去细长尖刺；③ **1:1 输出**——双线性上采样值场后分档上色，并按**距离蒙版**（`FADE_START_FACTOR` / `FADE_END_FACTOR`，以平均站距为单位）让离车站很远的空白处平滑淡出，不再一路铺色到画布边；相邻像素跨等级处描白线（`EDGE_ALPHA`，线宽由 `EDGE_SPAN` 控制：距边界不超过该距离的像素都描白，等时圈只按 `EDGE_EVERY` 档的组界画）+ 沿线撒等级数值标签（`15分`/`3元`，间距 `LABEL_GAP`，标签按该处等值线走向旋转、无底色靠深描边，并**避让站点、站名标签与线路**）。③ 的 1:1 是关键：等级线若在低分辨率上画再被放大，必然是糊的。**距离蒙版**（`FADE_START_FACTOR` / `FADE_END_FACTOR`）的主要用途是**把线网边缘那些细长的等值线尖角（"触角"）糊掉**，顺带也让离车站很远的空白处淡出：贴车站的那圈保持实色，越往外越淡至全透明。**覆盖范围比画布大 `COVER_SCALE`=2 倍**（以画布中心向外扩），缩到城市最小缩放（默认 0.5）时视口也不露白；画布外没有站点，靠 IDW 外推把色带延展出去。**色标按工具区分且锚点固定**：等时圈蓝→绿→黄→红，票价图黄→绿→蓝→紫→粉；锚点取自 `referenceRange()` 估出的**全城极值**（均匀抽 `RANGE_SAMPLES` 个起点 × `RANGE_TARGETS` 座到达站求极值，按「城市 + 工具」缓存，只算一次）—— 于是等时圈的红色永远代表"全网最长用时"、票价图的粉色永远代表"全网最高票价"，换个起点颜色含义不变，而不是按当前起点铺满色标；**等时圈档宽就是 5 分钟**（`ISO_STEP`；带「范围」分段控件时色带上限 = 选中项，超出上限的地方**不填色**、上限本身另画一条等级线来收边 —— 实现上是给超出像素打 `CLIP_MARK` 哨兵、描线时把它当边界；没选过范围时才走 `ISO_MIN_BANDS` 那条"不足 90 分钟补足"的下限），色阶本身即细粒度，**组内仍按 5 分钟一档做明暗**，只有色系与等级线按组宽来：默认 `EDGE_EVERY` 档（15 分钟）一组，**量程 ≤30 分（只有 6 档）时改用 10 分钟一组** —— 6 档按 15 分钟分只剩蓝、红两段色系，看着像没分档，10 分钟一组正好三段（蓝 / 绿 / 红）；等级线与线上标签都按这个组界来画 —— 5 分钟一条线的话线上会挤满数字，图例刻度也照此与等级线同拍，**图例上的白线同样只画在这些组界上**（由 `bands.edgeEvery` 驱动，色标与地形图一一对应）；「范围」控件旁边另有「最近 10 站」折叠按钮（按用时升序、点条目即选中该站），色带右端那段斜纹即"超出上限不再填色"的示意（**选中末档「最长」时不画** —— 全网再没有更远的站，斜纹没有可指的东西；末档它本身标作「最长」二字、具体分钟数放在 title 里）；**刻度一律用绝对定位摆在 `tick.at` 给出的位置上**（不是 flex 均分：均分只能让两端贴边，中间几个会与白线错开）；**汇合图（两点）**的量程固定为 ±`MEET_CAP`（每 `MEET_STEP` 分钟一档，0 附近是"汇合带"），色标从中间的黄往两侧**先淡化再变浓**（浅粉/浅蓝 → 深红/深蓝，直接插值会经过一片很脏的橙）；等级线按「白实线 / 白虚线 / **黄实线（差值 0）** / 白虚线 / 白实线」往外交替（图例同步用实线、虚线、黄实线三种线型；判定见 `meetCutKind`，⚠️ 组号是**较大侧**的，别再 +1，量程一变就会把黄线画到 −10 上去）；图上两个出发点的原图元整个让位给**落在车站位置上**的 `A` / `B` 标记（分别取色标两端的粉红与蓝），推荐汇合站的数值图元换成**黄底深字**（只把数字改黄在浅色主题下几乎看不清），推荐列表的序号标也是同一套黄色系，结果小窗标题里的箭头用 CGoUI 的 `vi-way` 矢量图标；超出量程的"外带"继续渐隐，色标两端标出"A / B 更近"；两点模式下推荐列表下方另有一行**「在地图上再点一个车站，加入第三人一起算」**的提示（点击地图上任何非 A / B 的车站即升级为三点，故那一下会被拦下、不再弹车站详情）。**三点汇合**：色标改**单向**（`MEET3_BAND`=10 分以内是汇合带、到 `MEET3_OUTER`=20 分是外带、再远渐隐；前两档钉在纯黄上，其后黄 → 浅蓝 → 深蓝），因而不画色带、改在面板里用两枚图例项说明 **10 分（虚线）与 20 分（实线）** 两条等级线的含义（线型与图上严格一致）；三个出发点各有语义色（`MEET_ORIGINS`：A 粉红 / B 蓝 / C 绿），图上的字母标记、面板标题、推荐列表与悬停读数共用同一份；数值图元标的是**最慢一方的用时**、颜色取**最快一方**的语义色（两点模式下这与"离 A 更近 / 离 B 更近"等价，与色标两端呼应），悬停读数则列出各人的用时；面板里可用「移除 C」退回两点；**票价图的图例标签按比例跳着标**（最多 6 个，首末必标），不再每块都写字。**悬停读数**（深色胶囊 + 分区色圆点 + 彩色数字，票价「预计 N 元」/等时圈「N 分钟」）不占用画布的指针事件——画布 `pointer-events: none`，监听挂在地图容器上，用 `#map-content` 的实测矩形反算到值场坐标（双线性取样）后读数，故地图拖拽缩放照常。**图上叠加**另起一层（`z-index` 夹在站点层与站名层之间）：各站图元改成**「大圆 + 数值」**、底色统一为地图背景色、边框取文本色，**尺寸固定 20×20 正圆**（数字超宽时由脚本横向压扁 `scaleX`，不把圆撑成椭圆）；并**只让有数值的车站让位**（逐站挂 `cgo-mt-hidden`；未开通站、国铁散点这些没被标注的车站，原图元原样保留）；起点站**复用核心的选中态**——给 `node_{sid}` / `label_{sid}` 挂 `.active`，与点击车站弹窗时的观感完全一致，并用 MutationObserver 看住这两个节点（核心每次选中都会 `clearHighlights()` 摘掉所有 `.active`，地形图展示期间起点这份要补回来）；`#map-content` 上的 `cgo-mt-terrain` 类只作样式挂钩，用来在地形图期间给**站名文字加描边**（色块铺上来会压掉站名的对比度）——用 `-webkit-text-stroke` + `paint-order`，描边宽度直接复用核心的 `--sta-stroke-width-cn` / `-en`，与核心给站名加 active 选中态时是同一套写法。各段都按 `SLICE_ROWS` 分片让帧，长耗时也不卡界面。**与其它浮层的关系**：**窄屏**（≤640，与 `viewport-inset` 同口径）上三块面板（车站详情 / 行程规划 / 路线结果）一出现，本模块面板即挂 `cgo-mt-yield` 收起来（它们收起后自动恢复）；**桌面端不互斥** —— 侧栏形态下车站详情是常驻的，一并让位就再也看不到色标与「重新选站」了（两者位置尺寸并不冲突，共存放得下），窗口跨过阈值时随 `resize` 重判。浮层本身向 `viewport-inset.js` 声明 `data-cgo-inset="right bottom"`，画布的平移边界与居中区于是把右下角一并让开（该模块原先只按"浮层在哪一侧"留白，贴角的浮层只留右侧并不够高），未声明该属性的浮层行为与从前完全一致。**分档完全由数据驱动**：票价按该城 `fare` 规则真正产生的金额分档（有几档算几档），等时圈按 5 分钟一档（未选「范围」时才按"不足 90 分钟补足"）；因此城市改票价规则、增删车站、拆计费系统都不必改动本模块，未配 `fare` 的城市只是票价图不可用（面板明说）。取值全部派生自 `processedStations` 与规划内核，本模块不含任何城市私有数据

### 2.2 模块依赖关系

本目录的模块除少数几个纯函数外，都通过 `window.CGoX` 全局对象在**运行时**互相取用（不 import），
因此跨模块依赖几乎都是可选取用（`window.CGoX?.method?.()`）；真正有**顺序约束**的只有下面三条。

```text
① 纯函数 / 无依赖（可单独引入）
   loop-direction.js       环别判定（按站序做鞋带公式）
   line-link.js            线路接续声明（仅大连引入）
   tip-card.js             提示卡片 DOM
   label-active.js         呼出线随标签进入 active（按 data-cgo-callout 同步）
   facilities.js           车站设施（含可选的车站层级图）：配置驱动，样式在同目录 facilities.css
   exits.js                车站出入口独立页签：配置驱动，样式在同目录 exits.css
   exit-vertical.js        出入口垂直交通搬迁（前缀判据），被上面两者共同调用
   feedback.js             反馈面板：被 exits / calligraphy 打开，场景由使用方注册
   station-title.js        侧栏站名标题归一化
   timetable-renderer.js   首末班车渲染 / 日期类型 / 季节判定

② 行程规划链（顺序不可颠倒：data → planner → panel）
   line-link ──▶ route-data ──▶ route-planner ──▶ route-panel
                                                     │
   运行时另取：CGoLoopDirection（环别文案，时刻表渲染也取）
               CGoNearestStation（「我的位置」）
               CGoViewportInset.fit()（查看全程取景）
               core 的 CGoPathGeometry / selectStation / mapContainer

③ 引擎接口层（与核心之间的唯一通道）
   viewport-inset ──▶ core/script.js
       输入 window.CGoViewportInsets（谁开的面板谁报数）
       调用 enforceBoundaries / updateMapTransform，并用 setMapView / getMapView 落位与读位
       被 route-panel、map-tools 在运行时调 refresh / fit

④ 上层消费者
   map-tools       ← route-data + route-planner（建图寻路）
                   ← route-panel（入口挂在两个面板的页签栏、结果跳转）
                   ← viewport-inset（refresh，以及 data-cgo-inset="right bottom" 声明）
   sidebar-refit   ← core 的侧栏 DOM（#legend-content / #legend-pin-btn）
                   ← route-panel 的 #cgo-route-card / #cgo-route-result
   calligraphy     → feedback（投稿按钮打开面板；两者打开前各补登记一次自己的场景，幂等）
   nearest-station ← core 的 #locate-btn（捕获阶段接管其点击）+ cgo-modal 组件
   opening-schedule → core 的 applyOpeningSchedule 钩子 + notice.js 的推送合并
   stacard-engine  ← 高德瓦片；ES module，与上述各条均无耦合

⑤ 城市侧（本目录只提供机制，取数与文案留在城市目录）
   city/{city}/{city}.js          ── 薄配置（reader / fare / fareSystems / lineLinks /
                                     CGO_ROUTE_CONFIG / stationBoard.modules）+ 城市专属 modules/
   city/{city}/stacard/script.js  ── 相对 import stacard-engine.js
```

三条硬性顺序约束：

1. `route-data` → `route-planner` → `route-panel`（各城 `document.write` 的顺序不可颠倒）；
2. `line-link` 早于 `route-data`（声明贯通运行的城市的 `throughPairs` 在建图时即被读取）；
3. `sidebar-refit`、`map-tools` 晚于 `route-panel`（前者样式同名同权重、以本层为准，后者入口要挂进结果面板）。

其余依赖都写成运行时可选取用，所以各城 `{city}.js` 里 `document.write` 的排列存在差异也能正常工作——
例如沈阳把 `timetable-renderer.js`、`viewport-inset.js` 排在 `route-panel.js` 之后，靠的正是这一点。

> 新增共享模块或调整取用关系后，请连同本节一起更新。

---

## 三、持续更新中的模块（供其他城市参考）

上游开发团队的建议是：这类内容**由各城市自行维护、保持非强制**，不进核心引擎的强制字段。
下面这些机制仍在持续增补；如果参与者想为自己的城市做同类内容，**直接参考对应城市的
实现模式即可**，不必从零设计。

| 机制 | 当前状态 | 参考入口 |
| :--- | :--- | :--- |
| 首末班车时刻渲染 | 四城统一中（沈 / 大 / 长 / 呼），共享层出渲染、城市只写取数与阈值 | `shared/timetable-renderer.js`、`city/shenyang/modules/shenyang_service_info.js`、`city/dalian/modules/dalian_timetable.js`、`city/changchun/modules/changchun_service_info.js`、`city/hohhot/modules/hohhot_timetable.js` |
| 车站地图卡片 | 五城统一为同一份引擎（沈 / 大 / 长 / 哈 / 呼） | `shared/stacard-engine.js`、各城 `stacard/script.js` |
| 侧栏站名标题归一化 | 四城统一为薄配置（沈 / 大 / 长 / 哈） | `shared/station-title.js`、各城 `modules/*_station_title.js` |
| 车站提示卡片 | 共享层出 DOM，城市只写命中判定与文案 | `shared/tip-card.js`、`city/shenyang/modules/shenyang_cultural.js` |
| 站名题字 | 沈阳专属，其他城市可选用 | `shared/calligraphy.js`、`city/shenyang/modules/shenyang_calligraphy.js` |
| **呼出线随标签进入 active** | 沈阳已接入（换乘站的呼出框 + 引线，标签被选中 / 成为路线起终点时引线一同转红，标签被淡化时引线一同淡出）；其他城市给引线元素打 `data-cgo-callout="<车站 ID>"`、给引线层打 `data-cgo-callout-layer`，并在样式表里写 `cgo-callout-active` 的观感即可接入 | `shared/label-active.js`、`city/shenyang/modules/shenyang_map.js`、`city/shenyang/style.css` |
| **开通时刻** | 长春已接入（5 号线一期），沈阳、大连为空表待用 | `shared/opening-schedule.js`、各城 `data_opening.js` |
| **行程规划** | 沈阳、大连、长春、哈尔滨、呼和浩特、福州已接入：共享层出算法、面板与坐标索引，城市只写 `reader` 取数 + `fareSystems` / `fare` 票价 | `shared/route-data.js`、`shared/route-planner.js`、`shared/route-panel.js`、各城 `{city}.js` 的 `CGO_ROUTE_CONFIG` |
| **贯通运行（线路接续）** | 大连已接入（3 号线支线 ⇄ 13 号线在九里接续跑同一趟车）；其他城市按同一份 `lineLinks` 声明即可接入 | `shared/line-link.js`、`city/dalian/dalian.js` 的 `lineLinks` |
| **车站设施 / 出入口** | 沈阳已接入（设施，含官网层级图；出入口独立页签，144 站 / 516 条，数据来自高德 Web 服务 API，**每条出口带所属线路与出口描述**（`desc` 已按维基「出口指示」覆盖——含 2026-10-08 补做的 3 号线全线，维基未给的口以「相对所属线路站厅的方位 + 口」填空，如「西北口」；高德逆地理的路口方位整体迁到 `geoDesc`，只留档不渲染；周边地标按维基「建议前往的目的地」补入）；位置在出入口的扶梯 / 电梯已按 `exit-vertical.js` 搬到出口下——460 个「车站-出口」、843 条，设施板块不再重复罗列）；大连已接入（设施 + 出入口独立页签，100 站 / 278 条，同步接入该搬迁——68 个出口、69 条）；长春已接入（设施 + 出入口独立页签，123 站 / 432 条，出口来自高德；出口下已按 `exit-vertical.js` 挂上「无障碍电梯 / 升降平台」——77 站 / 95 段，判据为「出口编号开头 / 站外开头」，站内垂直交通留在设施板块）；哈尔滨已接入（出入口独立页签，72 站 / 261 条，出口来自高德；本城未接设施层）；呼和浩特已接入（出入口独立页签，43 站 / 153 条，出口编号与周边目的地来自**中文维基百科**、**无坐标**故分布小地图不给它标点；本城**有**设施层但类型为空表（`types: {}`），只配了官网车站分层图）。其中长春的**设施**部分仍是官方公众号表格图的**人工转录**（125 站）。共享层出渲染、逐条开合与来源标注，城市只写数据全局名与「类型 → 名字 + 图标」映射；出入口页签另需在城市 `stationBoard.tabs` 里声明 `{ id: "<city>-exits", title: "出入口", icon: "gate" }`（`id` 与共享层模块的 `targetTab` 一致），页签只对**非点线**车站渲染（`shouldRender` 用引擎已有的 `relatedLines` 与线路 `isPointOnly` 判定——国铁散站 / 轻铁 / 在建线即便数据里被同名误收也不出页签），官网无出入口数据的城市，可改用地图服务商的 LBS 接口取数（沈阳、长春、哈尔滨都走高德 Web 服务 API），或像长春的**设施**那样人工转录。**数据来源分三类**：大连是「官方接口 → 离线抓取脚本 → 落盘」；沈阳是「高德 Web 服务 API → 离线抓取脚本 → 落盘」（官方无出入口数据；注意多边形搜索存在**单区域结果截断**——实测中心区 365 条只返回 225 条，故中心城区必须改用周边搜索逐站取，脚本已固化这条口径（`fetch_city_exits_around.js` 一律走逐站周边搜索，不再用多边形））；长春是「人工转录 → 生成脚本」（官方无接口、只有表格图，且源图是 2025-04 静态快照不再更新）；多线换乘站的位置段是否合并、以及电梯与升降平台如何归类，都由各城自己的抓取/生成脚本决定（沈阳按「只点出入口」的判据 + 两张人工登记表做共用位置合并；长春按「取值一致 + 已查证的共用站厅/同台换乘站 + 单条人工登记」合并） | 共享层：`shared/facilities.js`、`shared/exits.js`、`shared/exit-vertical.js`；**开发期脚本**（Node，零依赖，不进运行时、也不入版本库，见 `.gitignore`）：`drunk/tools/facilities/` 下取**车站设施**的 `fetch_shenyang_facilities.js`、`fetch_dalian_facilities.js`、`gen_changchun_facilities.js`（+ 转录件 `changchun_facilities.transcript.json`）；取**出入口**的 `fetch_city_exits_around.js <city>`（逐站周边搜索，须早于下面两个）；算**方位**的 `fetch_exit_bearings.js <city>`（逆地理编码，产出 `.cache/bearing-<city>.json`）；**总装**的 `build_city_exits.js <city>`；大连另需 `patch_city_exits_bearing.js dalian` —— 它的出口数据来自官网、**没有坐标**，方位只能用高德数据事后按「站名 + 编号」合并进去 |
| **固定侧栏形态（浮岛卡片）** | 六城已接入（沈 / 大 / 长 / 哈 / 呼 / 福）；上游开发团队认可后再决定是否整体迁入 `core/` | `shared/sidebar-refit.js`、各城 `{city}.js` 里的引入行 |
| **地图小工具（票价图 / 等时圈 / 多人汇合）** | 东北四市加呼和浩特、福州已接入（六城）：共享层出选站、计算与分层设色（含悬停读数、起点选中光环与各站数值标注；等时圈带「范围」分段控件、范围上限那条等级线与「最近 10 站」列表，汇合图可点第三座车站升级为三点汇合），城市无需新增任何配置（有 `CGO_ROUTE_CONFIG.fare` 即可出票价图） | `shared/map-tools.js`、各城 `{city}.js` 里的引入行 |
| **站外换乘步行时间（逐对）** | 福州已接入：`CGO_ROUTE_CONFIG.walkMinutes` 可传数字（全城统一，默认 6 分钟）或 `{ "起点ID\|终点ID": 分钟 }` 逐对覆盖（水部→闽都 10 分、三叉街（滨海快线）→三叉街 6 分） | `shared/route-data.js` 的 `walkOverride`、`city/fuzhou/fuzhou.js` 的 `walkMinutes` |
| **站距「约X米」经纬度优先** | 沈阳、大连、长春已接入：`distances` 为 `"?"` / `"??"` 的区段，面板里的「约X米」**有经纬度就地改写为球面距离**（自建 `amap_data.json` 站名扁平索引，与核心 LBS 同源同语义）；同城同名多站先按「与当前站同线且站序相邻」收窄、仍歧义不改，球面值与画布现值之比超出 [0.5, 2] 窗口也不改（防「同名异位站」被拉爆，如沈阳有轨 / 地铁两个「杨官」）；缺经纬度原样保留核心画布值 | `shared/geo-estimate.js`、各城 `{city}.js` 引入行 |
| **规划优先级只有三种** | 内核 `OBJECTIVES` 为 **时间最快 / 最少换乘 / 票价最低**，**没有「距离最短」**（该目标已整体移除，所有城市一致；原先的按城市开关 `disabledObjectives` 机制已一并删除）。理由：乘客更关心少换乘与时间短，且最短距离常反而更耗时。里程仍保留在结果字段、等时圈口径与按段计价结算里，只是不再作为寻路目标 | `shared/route-planner.js` 的 `OBJECTIVES`、`extremes()` |
| **官方票价表优先** | 福州已接入：票价**只取自官网抓取的站间票价表**（`city/fuzhou/data_official_fare.js`，10302 组），计算式已删除，查不到的组合返回 `null`（内核按「票价未知」处理）。理由：计价站距与土建站距不同源，用站距套费率必然在档位分界附近错档 | `city/fuzhou/fuzhou.js` 的 `CGO_ROUTE_CONFIG.fare`、`city/fuzhou/tools/fuzhou_check.js`（抓取步骤写在文件头） |
| **站内换乘方式与用时** | 福州已接入：城市用 `CGO_ROUTE_CONFIG.transferAt` 逐站声明换乘方式（同台 / 节点 / 站厅 / 通道换乘）与用时；`pairs` 可按线路对进一步区分（帝封江：4/5 号线同台、换滨海快线通道 4 分），键也可写成**有向**的 `"线路A>线路B"`（从 A 线换到 B 线、优先于无向键命中），用于「同一线对两个乘车方向方式不同」的站体结构差异（沈阳青年大街：1 号线换 2 号线站台层楼梯直上 1 分、2 号线换 1 号线经站厅通道 3 分）；同台方向对用 `sameDir`（如 `"M1+M5-"`）**显式点明**，几何判定（`sameDirMinutes`）仅作兜底 —— 实测中帝封江的几何同向对与现场站台并不一致。换乘方式会随结果步骤显示在行程规划面板上，行程含换乘时末尾附一条「换乘时间因步行速度和车站人流量不同，仅供参考」；未配置的城市行为与不加完全一致 | `shared/route-data.js` 的 `makeTransferLookup` / `resolveSameDir` / `directedPairKey`、`city/fuzhou/fuzhou.js` 与 `city/shenyang/shenyang.js` 的 `transferAt` |

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
