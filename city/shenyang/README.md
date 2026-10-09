# 沈阳地铁城市数据说明

## 站名呼出标注

`modules/shenyang_map.js` 通过 `getStationLabelStyle(station, stationId)` 为换乘站选择站名样式，并使用 `MutationObserver` 将样式应用到核心引擎生成的标签。当前规则是：所有 `type: "tsf"` 的换乘站启用 `"callout"`，但“合作街”保留默认标签样式。

`"callout"` 标签包含文本框底部描边，并由城市脚本在 `lines-layer` 内动态创建 SVG 连线，连接站点中心与文本框左下角、右下角中距离较近的一点。连线会在标签尺寸、地图视口或缩放状态变化后重新计算；样式规则位于本目录的 `style.css`。

如需调整单个车站，可在 `data_stations.js` 的车站对象中设置 `labelStyle: "callout"`。车站对象级设置优先于城市脚本的批量选择规则。

## 详情弹窗标题图标

`modules/shenyang_station_board.js` 注册 `shenyang-fangcheng-decoration` StationBoard 模块，监听详情弹窗重新渲染，为“怀远门”“中街”和“大南门”插入 `assets/fangcheng.svg`。每个站点的装饰图配置包含 `src` 和可编辑的 `title` 字段，当前提示语为“本站位于沈阳方城文化旅游区”。图片会插入 `.header-name-group` 前，核心弹窗逻辑不包含沈阳站名或资源路径。

“大南门”当前尚未录入车站数据；将来在 `data_stations.js` 添加中文名为“大南门”的站点后，无需再次修改匹配逻辑即可显示该图标。

## 报站目的地指引

`modules/shenyang_cultural.js` 将已整理的沈阳地铁报站目的地关系注册为 `shenyang-cultural-destinations` 模块，挂载在“车站信息”选项卡**最前**（紧挨标签栏：order 1；后面的车站设施 / 题写者 / 车站类型 / 运营单位分别占 6 / 7 / 10 / 20）。注意**顺序以 `shenyang.js` 的 `stationBoard.modules` 为准**——配置里的 `order` 会覆盖模块注册时的值。模块只显示车站与目的地名称的对应关系，不扩写出口、距离或步行时间。

外观为模块自带的 `.sy-report-card`（均匀细线框 + 填色，`speaker` 图标 + 正文），样式在本目录 `style.css`，不再走共享层的 `tip-card.js`。

这些重点目的地同时写入对应车站对象的 `aliases` 数组，参与全局车站搜索；已存在历史别名记录的车站会在 `staname.csv` 中同步保留这些搜索词，避免异步加载历史别名时覆盖本地目的地别名。

## 车站设施（含车站层级图）

`modules/shenyang_facilities.js` 注册 `shenyang-facilities` 模块，挂载在“车站信息”选项卡 order 6。**车站层级图与设施位置合并在同一个板块里**，避免两个语义相近的板块在信息板里并列。

- **车站层级图**：热链沈阳地铁官网剖面图，是板块的第一个条目、**默认展开**（可点「收起」）；整宽缩略图，点击在新标签页打开官网原图。图是白底 PNG，故配色固定浅色、不随亮暗主题切换，也不再加外层阴影与标题条（图名由折叠行给出）。加载失败即清空该块。
- **车站设施**：数据由 `drunk/tools/facilities/fetch_shenyang_facilities.js`（开发期离线工具，不进运行时、不入版本库）抓取并落盘为 `data_facilities.js`（重跑脚本即刷新）；版式为一行一处设施——左侧「图标 + 设施名」，右侧位置条数与「详情 / 收起」开合按钮（结构与「站名题写者」一致），点开在行下方逐段展示位置原文。换乘站的每段前标注所属线路名；由两线共用的位置（共用站厅、同一出入口、换乘通道）已在抓取阶段跨线合并、不标线名，站台层则按线保留。位置段按楼层由地面到站台排序。
- 两者都只覆盖有官网编号的车站；有轨电车、国铁与未纳入官网编号体系的在建站不渲染该板块。采集口径见 `docs/STATION_FACILITIES_RESEARCH.md`。

## 车站出入口

`modules/shenyang_exits.js` 注册 `shenyang-exits`，挂在独立页签「出入口」（在 `stationBoard.tabs` 里声明，渲染在「车站信息」之前）。数据来自 `data_exits.js`——**全市 144 站 / 507 个出口编号**。

- **数据来源是高德地图开放平台 Web 服务 API**（沈阳地铁官网没有出入口数据）：取数与生成脚本在 `drunk/tools/facilities/`（开发期离线工具，不进运行时、不入版本库）。OSM 曾作为交叉校验源，但其只覆盖 47/144 站且存在无编号节点，两源差异处一律以高德为准。
- 每条出口除编号外还带**所属线路**（取自高德出入口 POI 的 `address` 字段），换乘站据此可分辨哪个口属于哪条线（如沈阳北站 A / C1 / C2 / C3 / D1 / D2 属 2 号线，E / F / H 属 4 号线）。
- **设施里的扶梯 / 电梯已搬到这里**：官网设施数据中「以该出口为起终点」的无障碍电梯与自动扶梯，已按共享层 `exit-vertical.js` 归到对应出口下（460 个「车站-出口」、843 条），车站设施板块不再重复罗列；站内垂直交通（「站厅-站台 …」「站台层 …」）仍留在设施板块。判据**按类型分别配前缀**：`elevator` 取「地面-站厅 / 地面-过街通道-站厅 / 站厅-地面」，`escalator_up` 取「站厅层 / 地下一层」，`escalator_down` **只取「地面层」**——「站厅层」的下行扶梯是站厅往站台层的向下交通、与出口无关（这批曾误搬 122 条，已修正）。配置与理由见 `city/shenyang/shared/README.md`。
- **编号徽标恒为 22×22 正方形**：多段编号（C1、D1、L1）把第一段连续字母 / 数字之后的部分转下标显示，仍放不下的由脚本横向压扁，不把正方形撑成长方形。

## 沈阳地铁官网查询

`data_timetable.js` 按沈阳地铁官网的线路站序生成 `GLOBAL_SCHEDULE_DATA`，为每个线路/车站组合提供 `stationInfo2` 查询地址。核心信息板会据此统一渲染标准的“官网查询”按钮；首页城市卡片的“官方参考”链接则由城市注册信息中的 `officialMapUrl` 提供，指向沈阳地铁移动端线路查询页。

## 车站运营信息

`stacard/data.js` 保存沈阳车站的位置、首末班车和出入口数据，`modules/shenyang_service_info.js` 将这些数据注册为 `shenyang-timetable` StationBoard 模块。城市配置中的 `stationBoard.scripts` 是该城市自定义模块的唯一清单，由 `shenyang.js` 在加载时写入页面。

首末班车的渲染交由三城共享层 `shared/station/timetable-renderer.js` 处理（该文件为临时共享位置，计划在开发团队确认后迁入 `core/`，详见 `docs/STACARD_TIMETABLE_UNIFICATION.md`）；本模块只负责取数、季节阈值与多行组合。
