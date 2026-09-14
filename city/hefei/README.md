# 合肥轨道交通城市数据

主理人：**Evin**（[walternie](https://github.com/walternie)）

## 官方排版流程（现行）

对照官方示意图，直接改：

- [`data_stations.js`](./data_stations.js) — 每站 `x` / `y` / `align` / `offset`
- [`data_lines.js`](./data_lines.js) — `stationIds`、拐弯处 `pathPoints`、`distances`

预览：`http://127.0.0.1:8080/main.html?city=hefei`（F12 → Network → Disable cache；改完递增 `sw.js` 的 `CACHE_NAME`）

原则（与北京 / 沈阳范例一致）：

1. 先钉换乘枢纽与端点，再在直线上等距铺中间站（常见站距约 40～80px）
2. 同方向直线共用同一 `x` 或同一 `y`（横平竖直；近 45° 可斜）
3. 多线换乘站共用同一 Station ID 与坐标
4. 站名挡线 → 改该站 `align` / `offset`，少动整段坐标
5. 地理经纬度只写在 `amap_data.json`，不要用真坐标当示意图坐标

地理坐标写在 `amap_data.json`（OSM WGS84 转 GCJ-02，供定位与车站卡片使用）。站间距 `distances` 仅在有可靠官方来源时填写，本版不编造。

## 暂缓 / 未开通（`type: "no"`）

馆驿(3)、紫云湖(4)、市博物馆(6)、合肥四中(7)、S1 独有站。
