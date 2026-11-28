# 新加坡地铁、轻轨与圣淘沙捷运线路图

本地预览：在仓库根目录运行 `python3 -m http.server 8080`，打开 <http://localhost:8080/main.html?city=singapore>。无需安装依赖或构建。主理人申请署名：**Deming ZHOU**（[betaxiaozhou](https://github.com/betaxiaozhou/)）。这项本地登记不代表官方已批准申请。

## 收录范围

以 **2026-11-23** 为运营状态截点，收录 **SMRT 与 SBS Transit 完整 MRT/LRT 运营网络**：6 条地铁、3 个轻轨系统，共 **184 个去重物理车站**、30 个换乘标识枢纽（含 Tanah Merah 机场支线换乘；27 个付费区内换乘、3 个出闸换乘）。运营方向与支线拆为 13 个可选渲染条目，不能把条目数当成独立线路数。另收录圣淘沙捷运 4 站，合计 188 个运营物理车站；圣淘沙捷运独立检票、单独计费。

| 系统 | 线路/环路 | 运营商 | 按线路停站数（含换乘） |
|---|---|---|---:|
| MRT | 南北线 NS | SMRT | 27 |
| MRT | 东西线 EW（机场支线另列 CG） | SMRT | 33 + 3（Tanah Merah 重复） |
| MRT | 东北线 NE | SBS Transit | 17 |
| MRT | 环线 CC（多美歌支线另列 CCE） | SMRT | 合计 33 |
| MRT | 滨海市区线 DT | SBS Transit | 35 |
| MRT | 汤申—东海岸线 TE | SMRT | 27 |
| LRT | 武吉班让 BP（A／B交路） | SMRT | 13 |
| LRT | 盛港 SE / SW，经 Sengkang STC | SBS Transit | 14 |
| LRT | 榜鹅 PE / PW，经 Punggol PTC | SBS Transit | 15 |

MRT/LRT 普通付费区内换乘使用共享节点；Newton、Bukit Panjang、Tampines 的两侧分别建模，合计 187 个线路侧节点，184 仍为去重物理车站数。所有环路均闭合。图中展示线路拓扑，不承诺具体列车交路、班次或直通服务。
- 环线已包含 2026-07-12 开通的 Keppel CC30、Cantonment CC31、Prince Edward Road CC32。
- 汤东线运营至 Bayshore TE29，滨海市区线运营至 Expo DT35。另按施工状态绘出 TE30 Bedok South、TE31/DT37 Sungei Bedok 和 DT36 Xilin，未接入运营站序。LTA 已宣布 TEL5 / DTL3e 计划于 2026-12-26 开放载客。
- 不收录未运营的 NS6 Sungei Kadut、CC18 Bukit Brown、TE10 Mount Pleasant、TE21 Marina South，以及已关闭的 BP14 Ten Mile Junction。
- 已补齐东北线（含 Punggol Coast）、滨海市区线（含 Hume）与盛港/榜鹅轻轨全部已开通站（含 Teck Lee）。跨运营商换乘已按付费区内/外的实际关系显示。Newton（NS21↔DT11）、Bukit Panjang（BP6↔DT1）、Tampines（EW2↔DT32）均需出闸；已拆分站码、以双色窄实心带连接，并提供换乘条件与另一侧节点的跳转按钮。
- 画布按 LTA 华文图展示中文站名，中文、英文和站码均可搜索。`cn` 为官方中文站名，`en` 为英文名，`stationCodes` 独立保存站码，避免改为中文后破坏自绘标牌。车站详情以中文为主，标题下方仅显示英文站名，站码由右侧站标展示。轻轨小站使用较小站码与字号。
- 未核实的站距统一使用规范允许的 `"??"`，未加入估算时刻、票价、行程耗时、实时服务或站点经纬度。

## 来源与版次

1. [LTA Rail Network](https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network.html)：核对运营商分工。
2. [LTA SM-26-01-EN 全网矢量图（2026-07-21 版本）](https://www.lta.gov.sg/content/dam/ltagov/getting_around/public_transport/rail_network/pdf/SM_EN_(Ver210726)_CCL6.pdf)：仅供英文名称与历史数据来源追溯，现行几何以中文版为准。
3. [LTA 官方华文全网图（2026-07-21）](https://www.lta.gov.sg/content/dam/ltagov/getting_around/public_transport/rail_network/pdf/SM_CH_(Ver210726)_CCL6.pdf)：**主参考图**。190 个 MRT/LRT 节点、221 个线路代码色块、全部线路轮廓及水系统一按此图核对。
4. [SMRT 官方全网入口](https://journey.smrt.com.sg/journey/mrt_network_map/)：旅客查看完整网络的入口。
5. [LTA：环线三座新站 2026-07-12 开通](https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/6/news-releases/explore-three-new-circle-line-stage-6-stations-on-4-july-2026.html)。
6. [LTA：TEL5 / DTL3e 于 2026-12-26 开通](https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/11/news-releases/tel5-dtl3e-passenger-service-26-dec-2026.html)。

**站名、站码位置、线路、海岸与河流统一以官方中文图 `SM_CH_(Ver210726)_CCL6.pdf` 为主参考。** 原先英文版布局中的北部顶弧、大士西段等偏移已校正。按环线原始圆心与半径登记到现有画布：`scale=0.5974409051053803`、`x=PDF_x×scale+77.5699387463967`、`y=PDF_y×scale−401.7438850169408`。`data_reference_geometry.js` 记录官方来源 URL、PDF SHA-256 和14组原始矢量路径（合成为13个MRT/LRT运营条目）；画面直接使用原始贝塞尔曲线与填充轮廓，不把交汇点强拉到共享站牌中心。站位由中文图的221个线路代码色块定位，普通换乘合并、出闸换乘分开；中文字体及站码牌仍使用本项目的开源字体和自绘外形。`pathPoints` 保留给点击热区与视口边界。原图的彩色填充与白色裁切由作者工具预先合并为静态可见路径，保存在 `SG_VISIBLE_ROUTE_GEOMETRY`；浏览器对同一路径先画稍宽的地图底色轮廓，再画彩色实体。轮廓沿全线连续绘制，选中只为彩色部分添加2px阴影；线路宽度、轮廓及交叉顺序不随选择改变，高亮副本不再重复绘制。图为非官方社区交互版本，线路几何及水系原图版权属于 LTA；不打包官方 PDF 或专有字体，公开贡献时仍须遵循上游来源要求。

新增线路核对资料：
- [LTA 东北线：17 站](https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network/north_east_line.html)
- [LTA 滨海市区线：35 站](https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network/downtown_line.html)
- [LTA 盛港—榜鹅轻轨](https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network/sengkang_punggol_lrt.html)
- [LTA Teck Lee 于 2024-08-15 开通](https://www.lta.gov.sg/content/ltagov/en/newsroom/2024/7/news-releases/Teck_Lee_LRT_station_to_start_operations.html)

## 武吉班让轻轨的 A／B 交路

武吉班让轻轨统一为一个 `BP` 线路条目、一个图例和一个车站线路选项卡。A交路从蔡厝港经武吉班让、信佳、泽拉邦、实加、法嘉、万吉、秉定、柏提，回到武吉班让并沿干线返回蔡厝港；B交路在住宅区环路按相反方向行驶，先经柏提再经信佳。原先独立的 `BPL` 乘客线路条目已删除，图上仍保留干线与住宅区环路的真实形状。旧PDF的 `BP`、`BPL` 原始矢量组作为来源保留，由 `geometrySources` 合成为一条可见线路。

`stationIds-way1/way2` 分别保存完整A/B往返站序，包含去程与回程再次停靠同站；13个物理站只计一次。城市交路模块枚举所有经停位置，避免忽略返程；不修改通用引擎。站卡提供A/B切换，按钮仅显示“A”“B”；干线显示往住宅环路、往蔡厝港两组邻站，环路显示所选交路的邻站。邻站跳转保留所选交路和线路选项卡，不编造班次或首末班时刻。交路表格随站卡内容区收缩，不继承全站表格400px的最小宽度。

核对来源：[LTA武吉班让轻轨介绍](https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network/bukit_panjang_lrt.html)、[SMRT官方方向资料（A via Senja / B via Petir）](https://www.smrt.com.sg/getmedia/4dc714c8-1a2c-4cf7-ac49-e5ea12425ab1/Annex-B-%E2%80%93-Further-details-and-schedule-of-lift-upgrading-work.pdf)、[SMRT 2024/25集团报告第27页](https://www.smrt.com.sg/getmedia/f5eeb838-eb2e-4289-9f76-94513d49fe56/SMRT-Group-Review-2024_25.pdf)（确认2024-12-30恢复完整双环服务）。临时运营调整以官方公告为准，不根据日期自动改变交路。

## 樟宜机场支线

常规运营为 **Tanah Merah（EW4/CG）→ Expo（CG1/DT35）→ Changi Airport（CG2）** 三站接驳，属于东西线机场支线，不计为第七条 MRT。往返市区乘客在 Tanah Merah 换乘东西线主线，或在 Expo 换乘滨海市区线。两处按付费区内换乘处理。

CG 高亮与 EW 主线解耦：点选机场支线或 CG2 时只高亮三站支线；选择 Tanah Merah 枢纽时仍会显示其实际关联线路。仅丹那美拉（EW4）站卡保留紧凑的机场支线换乘提示；博览与樟宜机场不重复显示说明，也不展示额外站点跳转列表。接驳依据为 [樟宜机场官方乘车指引](https://www.changiairport.com/en/at-changi/transport-and-directions/getting-to-changi-airport.html)。不硬编码月台号、时刻表或临时施工安排。

Tanah Merah 标牌的 EW4 与 CG 绿色色块之间保留白色分隔；中空双线从 CG 色块下方接入，Expo 为 CG1/DT35 联合站牌，CG2 为终点，不连接回 Tanah Merah。

## 施工区段

参照 LTA 全网图的施工表示法，TEL5 与 DTL3e 保留棕/蓝色实线及彩色站码，以两条点状边界、实体圆角左括线和深底白字 **施工中** 标牌圈出范围；不把轨道改成通用灰色虚线。施工轨道由中文图原始15.951pt描边按统一比例换算为 `9.52978px`，边界直径与间距由参考图同比换算。暗色主题仅调亮边界线，施工牌仍为深底白字，中文使用已打包的 Noto 子集。

三座施工站统一 `type: "no"`，可按站名、TE30、TE31、DT36、DT37 搜索；Sungei Bedok 使用 TE31/DT37 联合站码，但明确提示换乘尚未启用。置顶信息卡展示项目与计划开通日期。双溪勿洛接入按官方中文图修正：滨海市区线自博览向南后以原始贝塞尔曲线转向西南，经锡林进入联合站牌的蓝色一侧；汤东线自西南以直斜线进入棕色一侧。`data_notopen.js` 保存原始曲线路径与端点，城市钩子使用该路径绘制，避免折线采样再倒角造成畸变。`data_notopen.js` 只负责施工走向，`data_construction.js` 保存施工边界与标牌；两条 `isPointOnly` 元数据项提供线路/运营商信息，不绘运营轨道、不接入现有线路站序。MRT/LRT 口径为 184 个运营物理站 / 187 个运营线路侧节点，连同 3 座施工站为 190 个节点；另有圣淘沙捷运 4 站，详见下节。开通须人工核实，不按日期自动变更。

## 圣淘沙岛与圣淘沙捷运

恢复原先遗漏的圣淘沙岛形，采用 LTA 全网图岛屿轮廓，保持圣淘沙独立示意布局；南部画布从 2300 扩到 2450，水系背景同步延伸，MRT/LRT 的现行几何按上文中文图登记。海峡名称移到岛南侧。

按[圣淘沙官方交通页](https://www.sentosa.com.sg/getting-around)和[2026 年官方华文交通指南](https://www.sentosa.com.sg/-/media/sentosa/hero-asset/promos/discovery-pass/fun-discovery-pass/brochure/2026/fun-discovery-pass-brochure-8-may-2026-cn.pdf)绘出 **怡丰城 → 名胜世界 → 英比奥 → 海滩** 四站。地图站标与线路图例使用 LTA 官方中文地图底部图例的圣淘沙捷运原始矢量标志（仅保留中央侧视列车，去掉两侧点划装饰），线路浅色模式为纯黑、深色模式为纯白，不使用默认圆点、不编造 MRT 站码；该线路为社区示意走向，站距仍用 `??`。怡丰城站整体上移并与港湾站名留出间隔；跨海段竖直，岛内段采用连续45°斜线，在名胜世界转向处保留平滑倒角。英比奥、海滩的横向位置随斜线对齐，站序与检票关系不变。

港湾地铁站与怡丰城捷运站为两个独立站点，在 `VIRTUAL_TRANSFER_MAP` 中以非免费计费换乘关系连接，地图不绘制两站间的步行线；衔接方式由车站信息卡说明。置顶卡片仅在港湾与怡丰城显示简短的“出站换乘”提示：港湾只关联怡丰城捷运站（L大厅3楼），怡丰城只关联港湾地铁站；不罗列岛内其他站或增加站点跳转按钮。两系统需出闸步行、独立检票计费，地铁15分钟换乘计费规则不适用于这段捷运。怡丰城进岛标准票价 4 新元，岛内及出岛乘车免费，优惠和当日安排以官方为准。四站均可搜索，上一站／下一站及其跳转使用标准相邻站区域。每日07:00—24:00的捷运运营时间移至四站各自的“车站信息”选项卡，不显示在港湾地铁站的运营时间中。

现有 MRT/LRT 统计仍为 184 个物理站 / 187 个线路侧节点；新增圣淘沙 4 站后，共 188 个运营物理站 / 191 个运营节点，另有 3 个施工节点，总计 194 个节点。14 个运营渲染条目加 2 个施工元数据条目共 16 项。中文字体子集已补齐新站名和“圣淘沙、步行”等字符。

## 付费区外换乘

三处出闸换乘分别建模为 `NS21 / DT11`、`BP6 / DT1`、`EW2 / DT32` 六个节点。每个节点只属于其实际线路，不把不同付费区作为同一个站点；成对的 `physicalHubId` 保留 184 个物理车站的统计口径。连接关系由 `data_virtual_transfers.js` 定义，城市脚本使用两侧线路色拼成较窄的实心连接带，颜色交界斜切，按官方 Tap Out to Transfer 图例绘制，独立中心线保持不变，避免重新引入线路拐折。

点击任一侧站码，置顶卡片提示先出闸、使用同一支付卡/设备并在 15 分钟内重新进闸，且可跳转到另一侧。只有符合完整距离计费条件时才不另收新起乘费用，不能将整个车程描述为“免费”。城市关闭核心泛化的“电子客票可免费站外换乘”文案，采用本地 `modules/unpaid-transfer.js` 提示。其他换乘枢纽仍为普通付费区内换乘。

官方依据：
- [SimplyGo Transfer Fare Rules](https://simplygo.com.sg/transfer-fare-rules/)
- [交通部 2026-05-06：15 分钟换乘时限说明](https://www.mot.gov.sg/news-resources/newsroom/rationale-for-15-minute-transfer-limit-between-train-stations/)

## 线路线宽与交叉留白

MRT、LRT、机场双轨的彩色实体保留官方中文图原始曲线，底色轮廓与彩色实体拆开处理；不套用旧英文图的统一线带近似值。白色轮廓在深色模式使用地图深色。原始双轨保留镂空，Tanah Merah → Expo → Changi Airport 仍为三站开放接驳，不作为环线。圣淘沙为单独绘制的示意线，浅色纯黑、深色纯白。

本次逐区比对覆盖西北、北部、盛港/榜鹅、西部、中央、东部、南部、宝门廊、大士、实龙岗和东海岸；宝门廊环线闭合点的反向折返已由原始中文圆环替代。

## 水系底图

新增海岸水域、新加坡河及滨海湾，水域边界提取自上述 LTA 图中的两组水色路径，使用同一坐标变换与线网对齐。采用完整 SVG 贝塞尔曲线，亮/暗主题使用两套静态颜色资源；通过城市 `data_scattered.js` 放置在轨道下层，未修改通用渲染逻辑。水域名称“滨海湾”恢复到原位置（1960,1878），仅调整水面文字，不移动滨海湾车站。港湾站标上移到东北线端点纵坐标2022.705，以覆盖线路连接处的白色缺口，轨道几何保持不变。中文水系名称以 Noto Sans CJK SC 轮廓写入 SVG，外部图片不依赖字体跨文件加载。海岸为交通图示意形状，并非 GIS 精确海岸数据。

## 面板线路标

搜索和线路图例使用 LTA 全网图样式的线路缩写标：NSL / EWL / NEL / CCL / DTL / TEL，以及 BP / STC / PTC。素材位于 `assets/line/`，采用线路色、弧形两端及白色外轮廓；DTL 等标识使用白字，CCL 使用深色字。字形与车站站码统一，直接使用已打包的 Lato Bold 并转成路径，不依赖手机字体。

`data_lines.js` 为各交路配置 SVG；机场支线共用 EWL、多美歌支线共用 CCL。城市层只覆盖面板徽标渲染，将同一 SVG 的支线/环路徽标去重；其他线路选项卡与换乘关系保持各自的数据。

车站卡片右侧使用本站站码牌，沿用地图站牌外形；付费区内换乘使用连续的联合站牌，出闸换乘的两侧站牌并列，以双色实心连接带相连，分界斜切；当前点击的一侧排在前面。连接带按官方华文图例第1371/1372条矢量量取：厚24.134pt，站牌色块高67.792pt，厚度约为色块高度的35.6%，随卡片站牌同比缩放，并与两端站牌重叠接合以消除白缝。卡片中所有站码单元统一高度、字号和宽度规则，换乘站不采用地图上的放大比例。圣淘沙卡片保留官方横向品牌字标。

## 站名位置

191 个可见站名以官方华文图的文字位置为参考，使用引擎真实的八方向锚点；左右站名按自绘站牌边缘留出间距，上下及斜向站名直接使用对应方向，不再全部借用右侧锚点叠加大幅偏移。中文字体按可见字形校正基线，普通站、轻轨及圣淘沙分别匹配各自字号，选中前后字号不变；多行站名保留参考图的行位并避开附近轨道。

## 中英文字体

中文站名采用本地打包的 Noto Sans CJK SC 字符子集（内部名称 Singapore Chinese），保证手机和桌面的字宽一致；线路标及车站站码均采用同一份 **Lato Bold**，英文详情采用 Lato Regular。均为 SIL OFL 开源字体，附授权文本。线路标与水系文字转为路径，首次加载后可离线显示。未打包专有 LTA Identity，见 [字体说明](FONT-NOTICE.md)。

## 文件与维护

`data_stations.js` 保存车站与搜索别名，`data_lines.js` 保存站序、中心线与站距；`data_legend.js` 保存分组图例；`singapore.js` 配置城市导航与初始取景；`style.css` 调整中文标签。MRT/LRT 普通站由城市钩子自绘两端弧形、上下平直的站码色块，换乘站采用较大的连续外形、多线路无缝拼接，去除独立切角、白缝与黑色外框；所有 194 个站点节点（含 3 个施工站、4 个圣淘沙单轨站）均不使用引擎默认圆点或默认换乘图元。其余数据文件满足标准加载链，未承诺尚未提供的功能。`stacard/script.js` 为合法空模块，未启用地图卡片服务。

本城市在注册表中设为 `updating`，等待来源许可确认、人工视觉质量评审和官方主理人接纳，不自行宣称达到 B/A 级。

修改后必须同步全站缓存版本并运行：

```sh
node scripts/check-singapore-bplrt.mjs
node scripts/check-singapore-sentosa.mjs
node scripts/check-singapore-chinese-reference.mjs
node scripts/check-singapore-language.mjs
node scripts/check-singapore-construction.mjs
node scripts/check-singapore-airport.mjs
node scripts/check-singapore-transfers.mjs
node scripts/check-singapore-geometry.mjs
node editor/tests/selfcheck.js
node scripts/check-cache-assets.mjs
```

成为城市主理人的具体步骤见 [申请指南](MAINTAINER_GUIDE.md)。

### 终点方向数字圆标

按 LTA 中文全网图 `SM_CH_(Ver210726)_CCL6.pdf` 绘制线路色圆底、白色数字，字体采用站码相同的 Lato Bold：1巴西立、2大士连路、3樟宜机场、4裕廊东、5滨海南码头、6港湾、7榜鹅海岸、11武吉班让、12双溪勿洛（滨海市区线）、13兀兰北、14双溪勿洛（汤东线）。双溪勿洛仍属施工中，不进入运营线路；已成环的环线及轻轨、圣淘沙捷运不添加虚构方向编号。圆标作为城市独立覆盖层，避免改变车站点击范围和线路锚点。

圣淘沙捷运标志位于 `assets/line/sentosa-express.svg`，直接提取自上述 LTA 中文全网图底部图例，保留来源说明；图形版权归原权利人，不纳入开源字体许可，公开再分发许可待确认（见 ASSET-RIGHTS.md）。地图四站与线路图例共用中央列车素材，去掉圆角矩形两侧的点划装饰，深色模式作整体反色以确保可读。车站卡片顶部单独使用圣淘沙发展局[官方品牌页](https://www.sentosa.gov.sg/who-we-are/our-brands-and-subsidiaries/)的橙色横向 Sentosa 字标，位于 `assets/brand/sentosa.svg`；保留原始透明 PNG 像素，只用 SVG 视窗去掉透明留白，不拉伸、不加方形底板、不反色。字标及商标归 Sentosa Development Corporation 所有。

运营线路与施工区段统一使用连续底色轮廓，包括圣淘沙；浅色为白、深色为地图底色。在同色陆地上自然不显眼，跨水或其他线路时露出间隔。MRT填充轮廓的描边总宽8.272px（彩色形状外侧每侧约4.136px），LRT为2.4px；圣淘沙为8.5px底色轨道加5.5px实体。CG仍保留原始中空双轨。

同色且共享站点的线路自动组成绘制组：先绘制全组底色轮廓，再绘制全组彩色轨道，保证主线与支线连接处不被彼此的白边切断；不同色或不相连的线路仍保持独立及原图前后顺序。每条运营线路、施工轨道均有连续轮廓。未知的新增线路也会按现有全部渲染段自动补上底色边缘，不依赖专用矢量数据是否已生成。选中阴影只由彩色轨道产生；整组都选中时按彩色合并轮廓投影，部分选中时仅给选中线路投影，机场接驳仍可独立选中。轮廓不参与阴影，选中不改变线宽或交叉顺序。已移除水域/其他轨道遮罩、全局交叉补片和额外的跨水补片。不会把白色切口当成彩色实体的孔洞去投影。

原始路径和来源指纹保留在 `data_reference_geometry.js`。修改原始路径后，在作者环境安装fonttools、skia-pathops并运行 `python scripts/derive-singapore-route-shapes.py` 重建可见路径；网站运行不需要这些工具。布尔运算保留矢量曲线，圆头描边展开误差小于0.001画布单位。

多美歌环线支线按中文原始矢量从 CC1 色块右侧中部接入，不再对英文末端曲线作局部位移补丁。

线路描边的浏览器回归检查（测试环境需Python Playwright与Chromium）：

```sh
python scripts/check-singapore-route-casings.py 'http://127.0.0.1:8080/main.html?city=singapore'
```

检查普通/选中状态的几何、线宽和交叉顺序保持一致，所有渲染段均有边缘、主支线连接不被同组白边遮挡、仅彩色部分投影、高亮副本不重复绘制，以及深浅色、手机缩放与离线加载。测试还临时加入无专用几何数据的新线路，验证规则可自动适用。

## 审查材料

城市入口和地图标题使用 LTA 公共交通双向箭头标志（绿色单色适配），不使用 SMRT 公司标志或默认车辆图标。见 [素材许可清单](ASSET-RIGHTS.md)、[质量自评](QUALITY_REVIEW.md)、[PR 范围说明](PR-READINESS.md)。官方来源图形许可尚待确认，不能将待许可素材统一声明为开放授权。
