# 长春轨道交通城市数据说明

## 数据来源

线路、站点名称、英文名、颜色、换乘标记和原始示意图坐标来自长春轨道交通官方交互线路图：
`http://www.ccqg.com/metro-map/metromap_new/ccSubwayMap1.html`。

运营站点经纬度登记在 `amap_data.json`，来源为高德地铁图接口：
`https://map.amap.com/service/subway?srhdata=2201_drw_changchun.json`。坐标系为 GCJ-02，仅供地图定位和最近车站查询使用。

## 排版约束

线路控制点按官方线网方向整理，并将非 0、±45、90 度的长段拆分为水平、垂直或 ±45 度的连续线段。整体布局以西湖至雾开河大街为横向参考，以小城子街一侧的南北向线路为纵向参考。

已运营线路之间的换乘站使用单一站点 ID；5 号线尚未开通，其与其他线路的预留换乘节点保留独立节点（5 号线一期的开通时刻与开通后的合并规则登记在 `data_opening.js`，机制见 `city/shenyang/shared/README.md`）。双丰、长春西站等平行换乘段保留并行走向，并确保线路中线穿过换乘节点。站点布局和标签方位以 `data_stations.js` 当前人工调整为准。

## 站间距说明

官方交互线路图 SVG 源码仅包含线路示意几何和站点位置，没有可核验的站间里程字段；但官网「行程查询」（`http://www.ccqg.com/metro-map/metromap_new/ccSubwayMap1.html`）背后的接口
`http://app.ccetravel.cn/micro/other/urban/trave/query/list` 会一次性下发全网相邻站对的实测站间距离（`betweenStations[].distance`，单位米）。

因此 `data_lines.js` 的 `distances` 直接采用该接口的站间距离，不再按坐标估算：接口未收录的区段（1 号线南延、3 号线南延尚未开通）按官方规划里程均分。换乘站与预留换乘节点因站码不同，匹配时以站名兜底。

## 首末班车

`data_timetable.js` 和 `modules/changchun_service_info.js` 登记并展示长春轨道交通官网各线路首末班车图的数据（1、2、3、4、6、7、8 号线）。左栏按“首末班车 + 夏/冬令时 + 工作日/节假日”显示，右栏按方向列出“开往终点：首班-末班”。

`GLOBAL_SCHEDULE_DATA` 按运营方登记官网查询入口：地铁与轻轨指向长春轨道交通官网交互地图；有轨电车 G54/G55 归长春公交集团，指向公交集团查询平台（该平台只收录公交与有轨，不含地铁线路）。行程规划面板「官网查询」按钮的图标随之区分，由 `CGO_ROUTE_CONFIG.officialIcon(lineId)` 给出——地铁用 CGoUI 内置城市徽标，有轨用内联的公交集团标志（`assets/ccgj.svg`，内联才能吃到 `currentColor` 染色）。
