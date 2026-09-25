# 三城共享层（city/shenyang/shared/）

> ⚠️ **临时共享位置**
> 本目录挂在沈阳城市目录下，实际由 **沈阳、大连、长春** 三城共用。
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
| `timetable-renderer.js` | `window.CGoTimetable`、`window.CGoDayType` | classic script，各城 `{city}.js` 引入 | 首末班车「归一化行 → HTML」、日期类型判定、终点站代号解析、季节与日期类型标签的差异判定 |
| `stacard-engine.js` | 具名导出 `createStaCardEngine` | ES module，各城 `stacard/script.js` 相对 import | 高德瓦片地图卡片：坐标索引、占位 HTML、瓦片网格、缩放交互、ResizeObserver 生命周期 |
| `station-title.js` | `window.CGoStationTitle.createStationTitleNormalizer` | classic script | 侧栏站名标题归一化（站类判定、标题拼装、MutationObserver 安装与防自触发） |
| `tip-card.js` | `window.CGoTipCard.render` | classic script | 车站信息板提示卡片 DOM（与上游官方模板结构一致） |
| `calligraphy.js` + `calligraphy.css` | `window.CGoCalligraphy.register` | classic script | 站名题字渲染机制（沈阳特色，其他城市可选用）；样式表由脚本按自身 URL 注入 |
| `opening-schedule.js` | `window.CGoOpening` | classic script | 未开通区段与车站的**开通时刻**：状态转换、待开通登记、到点自动刷新，以及未开通车站 footer 的开通文案与倒计时（详见第四节） |
| `opening-schedule.css` | — | 由 `opening-schedule.js` 按自身 URL 注入 | 上述倒计时框的样式（同 `calligraphy.css` 的做法） |

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
