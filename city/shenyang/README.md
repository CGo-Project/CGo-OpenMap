# 沈阳地铁城市数据说明

## 站名呼出标注

`modules/shenyang_map.js` 通过 `getStationLabelStyle(station, stationId)` 为换乘站选择站名样式，并使用 `MutationObserver` 将样式应用到核心引擎生成的标签。当前规则是：所有 `type: "tsf"` 的换乘站启用 `"callout"`，但“合作街”保留默认标签样式。

`"callout"` 标签包含文本框底部描边，并由城市脚本在 `lines-layer` 内动态创建 SVG 连线，连接站点中心与文本框左下角、右下角中距离较近的一点。连线会在标签尺寸、地图视口或缩放状态变化后重新计算；样式规则位于本目录的 `style.css`。

如需调整单个车站，可在 `data_stations.js` 的车站对象中设置 `labelStyle: "callout"`。车站对象级设置优先于城市脚本的批量选择规则。

## 详情弹窗标题图标

`modules/shenyang_station_board.js` 注册 `shenyang-fangcheng-decoration` StationBoard 模块，监听详情弹窗重新渲染，为“怀远门”“中街”和“大南门”插入 `assets/fangcheng.svg`。每个站点的装饰图配置包含 `src` 和可编辑的 `title` 字段，当前提示语为“本站位于沈阳方城文化旅游区”。图片会插入 `.header-name-group` 前，核心弹窗逻辑不包含沈阳站名或资源路径。

“大南门”当前尚未录入车站数据；将来在 `data_stations.js` 添加中文名为“大南门”的站点后，无需再次修改匹配逻辑即可显示该图标。

## 报站目的地指引

`modules/shenyang_cultural.js` 将已整理的沈阳地铁报站目的地关系注册为 `shenyang-cultural-destinations` 模块，挂载在“车站信息”选项卡，并排在“车站类型”之前。模块只显示车站与目的地名称的对应关系，不扩写出口、距离或步行时间。

这些重点目的地同时写入对应车站对象的 `aliases` 数组，参与全局车站搜索；已存在历史别名记录的车站会在 `staname.csv` 中同步保留这些搜索词，避免异步加载历史别名时覆盖本地目的地别名。

## 沈阳地铁官网查询

`data_timetable.js` 按沈阳地铁官网的线路站序生成 `GLOBAL_SCHEDULE_DATA`，为每个线路/车站组合提供 `stationInfo2` 查询地址。核心信息板会据此统一渲染标准的“官网查询”按钮；首页城市卡片的“官方参考”链接则由城市注册信息中的 `officialMapUrl` 提供，指向沈阳地铁移动端线路查询页。

## 车站运营信息

`stacard/data.js` 保存沈阳车站的位置、首末班车和出入口数据，`modules/shenyang_service_info.js` 将这些数据注册为 `shenyang-service-info` StationBoard 模块。城市配置中的 `stationBoard.scripts` 是该城市自定义模块的唯一清单，由 `shenyang.js` 在加载时写入页面。
