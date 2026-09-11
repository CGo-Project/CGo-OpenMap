# 车站信息板自定义模块开发与配置指南 (Station Board Module Guide)

> **适用对象**：城市主理人（City Maintainers）、线路图制作者、前端二次开发者以及 AI Coding Agent。  
> **核心目标**：指导开发者遵循 CGo OpenMap 模块注册化架构，在各自城市中快速创建、注册、排序与定制车站信息板模块。

---

## 1. 架构总览与设计原则

CGo OpenMap 的车站信息板（`#info-panel`）采用 **模块注册化（Modular Registry Architecture）** 体系：
- **通用核心引擎**：`core/station-board.js` 统一管理生命周期、槽位调度、事件委托与内置标准模块；
- **城市专属业务**：各城市专属的特色模块（如文化名胜、便民设施、地标引导、首末班时刻等）放置在 `city/{city_id}/modules/` 下；
- **零构建开箱即用**：纯原生 JavaScript (ES6+)，无需 Webpack/Vite 编译打包；
- **100% 向下兼容**：未配置 `stationBoard` 的城市自动全量加载默认模块与原版 DOM 布局。

---

## 2. 槽位（Slots）、选项卡（TargetTabs）与 7 大定制领域

车站信息板划分为固定结构槽位与动态内容选项卡，并全面支持以下 **7 大高频特色定制领域**：

### 🎯 7 大核心业务定制领域
1. 🏛️ **文旅与名胜指引**：周边名胜古迹、红色旅游景点、网红商圈、城市游览路线与文化小贴士。
2. ⏱️ **运行时刻信息**：首末班车时刻表、平日/周末运营安排、全天发车时刻分布。
3. ⏳ **预计进站时间**：实时/预测列车到站倒计时、发车预估及车次频次看板。
4. 🔄 **换乘详情**：同台换乘、通道换乘、出站虚拟限时免换乘规则、换乘通道走行耗时与路线图。
5. 🚌 **接驳空间**：地面微循环公交接驳线路、出租车/网约车即停即走站台、P+R 停车换乘停车场、共享单车集中停放点。
6. 🏗️ **站台结构**：岛式/侧式站台平面图、楼扶梯与垂直无障碍电梯空间分布、车厢编号与最佳换乘车门指引。
7. 🍼 **设施指南**：母婴关爱室、无障碍卫生间、AED 急救设备、便民轮椅、行李寄存处与便民充电宝。

### 槽位与选项卡对照表
| 槽位 / 选项卡标识 (`slot` / `targetTab`) | 位置说明 | 默认内置模块 | 适合承载的定制领域 |
| :--- | :--- | :--- | :--- |
| `'header'` | 信息板顶部标题栏内 | `header-controls`, `header-title`, `header-badges` | 站名副标题、文旅特色徽章、紧急运营通告 |
| `'tabs-nav'` | 选项卡切换导航栏内 | `share-button` (分享按钮) | 快速工具外链、实时刷新按钮 |
| `'body-top'` | 信息板主体最顶端 | `hoisted-stacard` (跨线卡片) | 全局置顶通告、站厅全景图横幅、预计进站倒计时看板 |
| `'line-tab'` | **每个经停线路选项卡面板内** | `stacard` (高德地图切片), `adjacent-stations` (邻站), `transfers` (换乘) | **预计进站时间**、**换乘详情**、**站台结构**、**最佳车门**、**设施指南** |
| `'station-info'` | **“车站信息”选项卡面板内** | `station-type` (类型), `operators` (运营单位) | **文旅信息**、**接驳空间**、**车站全量便民设施**、历史沿革 |
| `'{custom_tab_id}'` | **城市自定义选项卡面板内** | 城市自定义模块 | 独立 Tab：如“**运行时刻**”、“**文旅导览**”、“**站内导航**” |
| `'footer'` | 底部外链与操作按钮栏 | `footer-actions` (高德导航、12306、官网) | 外部文旅小程序直达、实时公交 App 跳转、购票外链 |

---

## 3. 标准模块接口规范 (Module Definition API)

每个模块为一个标准的 JavaScript 对象，支持以下属性与生命周期方法：

```javascript
window.StationBoard.registerModule({
    // 1. 基础标识 (必填)
    id: "my-custom-module",          // 模块唯一英文标识 (建议使用小写连字符，如 'shenyang-fangcheng-tip')
    name: "沈阳方城文旅指引",         // 人类可读名称 (用于控制台日志与调试)

    // 2. 挂载位置与排序 (选填)
    targetTab: "station-info",       // 挂载目标: 'line-tab' | 'station-info' | 'header' | 'footer' | 自定义tabId
    order: 15,                       // 渲染排序权重 (数字越小排越靠前，默认 100)
    enabled: true,                   // 是否默认启用 (默认 true，城市配置文件中可随时开关)

    // 3. 渲染判定条件 (选填)
    shouldRender(context) {
        // 返回 false 时跳过当前车站/线路的渲染
        // context 包含: { station, city, lineInfo, isLineTab, tabId, ... }
        return Boolean(context.station?.isCultural);
    },

    // 4. 核心内容渲染 (必填)
    render(context) {
        const station = context.station;
        // 返回符合 HTML 标准的字符串
        return `
            <div class="my-module-box">
                <div class="my-module-title">🏛️ ${station.cn}文化小贴士</div>
                <div class="my-module-desc">本站周边汇聚丰富的历史名胜。</div>
            </div>
        `;
    },

    // 5. 挂载后生命周期回调 (选填)
    onMounted(container, context) {
        // container 为当前挂载后的父级 DOM 容器
        // 可在此绑定微交互事件、执行 Canvas 绘制或发起异步请求
        const btn = container.querySelector('.my-module-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log("点击了自定义模块按钮");
            });
        }
    }
});
```

### 上下文参数 (`context`) 详解

`context` 包含当前车站及渲染环境的全部元数据：
- `context.station`: 当前车站完整对象（包含 `id`, `cn`, `en`, `type`, `relatedLines` 等）；
- `context.city`: 当前激活城市业务对象；
- `context.lineInfo`: （仅在线路选项卡中）当前线路对象（包含 `id`, `name`, `lineColor`, `prev`, `next`, `company` 等）；
- `context.isLineTab`: 是否在线路选项卡渲染；
- `context.tabId`: 当前选项卡标识；
- `context.helpers`: 核心引擎提供的辅助工具（如 `resetMapState()`, `selectStation(sid)` 等）。

---

## 4. 快速实战开发 7 种典型模块范例

### 范例一：文旅与名胜指引模块（挂载至 `'station-info'`）
文件路径：`city/{city_id}/modules/cultural_guide.js`
```javascript
window.StationBoard.registerModule({
    id: 'city-cultural-guide',
    name: '车站文旅名胜指引',
    targetTab: 'station-info',
    order: 15,
    shouldRender({ station }) {
        return Boolean(station.culturalSpots || station.historicalIntro);
    },
    render({ station }) {
        return `
            <div style="margin:10px 0; padding:12px; background:var(--card-sub-bg); border-left:3px solid var(--primary-color); border-radius:6px; font-size:12px;">
                <div style="font-weight:bold; color:var(--text-main); margin-bottom:6px;">🏛️ 周边文旅与名胜</div>
                <div style="color:var(--text-light); line-height:1.5;">${station.culturalSpots}</div>
            </div>
        `;
    }
});
```

### 范例二：运行时刻信息模块（独立选项卡或挂载在 `'line-tab'`）
```javascript
window.StationBoard.registerModule({
    id: 'line-timetable-info',
    name: '首末班发车时刻',
    targetTab: 'line-tab',
    order: 22,
    render({ station, lineInfo }) {
        return `
            <div style="margin:8px 0; padding:8px 10px; background:var(--card-sub-bg); border-radius:6px; font-size:11px;">
                <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">⏱️ 运营时刻表</div>
                <div style="display:flex; justify-content:space-between; color:var(--text-light);">
                    <span>首班车：05:30（开往终点站）</span>
                    <span>末班车：23:15</span>
                </div>
            </div>
        `;
    }
});
```

### 范例三：预计进站时间倒计时模块（挂载在 `'line-tab'` 或 `'body-top'`）
```javascript
window.StationBoard.registerModule({
    id: 'train-arrival-prediction',
    name: '预计进站时间看板',
    targetTab: 'line-tab',
    order: 8, // 置顶于高德切片之前
    render({ station, lineInfo }) {
        return `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; margin-bottom:8px; background:linear-gradient(90deg, rgba(76,175,80,0.15), transparent); border-radius:6px;">
                <span style="font-size:12px; font-weight:600; color:#4CAF50;">🟢 列车预计进站</span>
                <span style="font-size:13px; font-weight:bold; font-family:monospace; color:var(--text-main);">约 3 分钟</span>
            </div>
        `;
    }
});
```

### 范例四：立体换乘详情与走行耗时模块
```javascript
window.StationBoard.registerModule({
    id: 'transfer-walking-details',
    name: '换乘详情与走行耗时',
    targetTab: 'line-tab',
    order: 32, // 紧随换乘线路列表之后
    shouldRender({ station }) {
        return station.type === 'tsf';
    },
    render({ station }) {
        return `
            <div style="font-size:11px; color:var(--text-light); margin:4px 0 8px; padding:6px 8px; background:var(--card-sub-bg); border-radius:4px;">
                🔄 <strong>换乘指南</strong>：经地下中层通道换乘，通道长约 90 米，步行耗时约 1.5 分钟。
            </div>
        `;
    }
});
```

### 范例五：地面公交与接驳空间模块（挂载至 `'station-info'`）
```javascript
window.StationBoard.registerModule({
    id: 'intermodal-transfer-space',
    name: '地面接驳空间与微循环',
    targetTab: 'station-info',
    order: 25,
    render({ station }) {
        return `
            <div style="margin-top:10px; font-size:12px;">
                <div style="font-weight:600; margin-bottom:6px; color:var(--text-main);">🚌 地面接驳与微循环</div>
                <div style="display:flex; flex-direction:column; gap:4px; color:var(--text-light); font-size:11px;">
                    <div>• <strong>公交枢纽</strong>：A口出站即达快速公交专线与微循环接驳巴士。</div>
                    <div>• <strong>P+R 停车场</strong>：B口设有大型驻车换乘停车场（凭地铁消费享优惠）。</div>
                    <div>• <strong>打车/即停即走</strong>：C口设有出租车及网约车专用上下客落客区。</div>
                </div>
            </div>
        `;
    }
});
```

### 范例六：站台结构与最佳换乘车厢门（挂载至 `'line-tab'`）
```javascript
window.StationBoard.registerModule({
    id: 'platform-structure-door',
    name: '站台结构与车厢乘车门指引',
    targetTab: 'line-tab',
    order: 18,
    render({ station, lineInfo }) {
        return `
            <div style="margin:8px 0; padding:8px; background:var(--card-sub-bg); border-radius:6px; font-size:11px;">
                <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">🏗️ 站台结构：地下二层岛式站台</div>
                <div style="color:var(--text-light);">
                    💡 <strong>最佳车门</strong>：乘坐 <strong>3车厢2门</strong> 下车直通无障碍垂直电梯；乘坐 <strong>6车厢4门</strong> 直达换乘扶梯。
                </div>
            </div>
        `;
    }
});
```

### 范例七：便民设施指南与应急服务（母婴室/AED/无障碍）
```javascript
window.StationBoard.registerModule({
    id: 'station-facilities-guide',
    name: '设施指南与应急便民',
    targetTab: 'station-info',
    order: 18,
    render({ station }) {
        return `
            <div style="margin:8px 0; padding:10px; background:var(--card-sub-bg); border-radius:6px; font-size:11px;">
                <div style="font-weight:600; color:var(--text-main); margin-bottom:6px;">🍼 便民与应急设施</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; color:var(--text-light);">
                    <span>🚼 <strong>母婴关爱室</strong>：B口站厅层</span>
                    <span>❤️ <strong>AED 除颤仪</strong>：客服中心旁</span>
                    <span>♿ <strong>无障碍直梯</strong>：A口地面直达</span>
                    <span>🔋 <strong>共享充电宝</strong>：站厅中部</span>
                </div>
            </div>
        `;
    }
});
```

---

## 5. 城市配置文件主理人调控指引 (`city/{city}.js`)

在城市业务主脚本中，城市主理人可直接通过 `stationBoard` 字典实现开关、重排与自定义配置：

```javascript
const MyCity = {
    id: "mycity",
    name: "我的城市",

    // ==================================================================
    // 车站信息板模块注册化配置
    // ==================================================================
    stationBoard: {
        // 1. 声明引入的模块脚本路径 (位于 city/{city_id}/ 下)
        scripts: [
            'modules/cultural_tip.js',
            'modules/station_facilities.js'
        ],

        // 2. 模块级开关与排序重写 (键名为模块 ID)
        modules: {
            // 【控制内置模块】
            'stacard': { enabled: true, order: 10 },           // 高德切片/3D结构图
            'adjacent-stations': { enabled: true, order: 20 }, // 上一站下一站
            'transfers': { enabled: true, order: 30 },         // 换乘线路
            'operators': { enabled: false },                   // 演示：关闭运营商显示
            'station-type': { enabled: true, order: 10 },

            // 【挂载与调控自定义模块】
            'my-cultural-tip': {
                enabled: true,
                targetTab: 'station-info', // 放入车站信息选项卡
                order: 15                  // 排在第 15 位
            },
            'station-facilities': {
                enabled: true,
                targetTab: 'line-tab',     // 放入所有线路选项卡
                order: 25
            }
        }
    }
};
```

### 内置标准模块 ID 及别名速查表

| 标准 ID | 支持的常用别名 | 默认挂载位置 | 默认排序 |
| :--- | :--- | :--- | :--- |
| `header-controls` | `controls`, `close-expand` | `header` | 10 |
| `header-title` | `station-name`, `title` | `header` | 20 |
| `header-badges` | `line-badges`, `badges` | `header` | 30 |
| `share-button` | `share` | `tabs-nav` | 99 |
| `hoisted-stacard` | - | `body-top` | 10 |
| `stacard` | `minimap`, `station-minimap` | `line-tab` | 10 |
| `adjacent-stations` | `prev-next`, `stops` | `line-tab` | 20 |
| `transfers` | `transfer`, `transfer-lines` | `line-tab` | 30 |
| `station-type` | - | `station-info` | 10 |
| `operators` | `operator`, `operating-companies` | `station-info` | 20 |
| `footer-actions` | `footer`, `action-buttons` | `footer` | 10 |

---

## 6. Service Worker 离线缓存更新要求（必须遵守）

新增任何模块脚本（例如 `city/{city_id}/modules/my_module.js`）后：
1. **必须** 在 `sw.js` 的 `ASSETS_TO_CACHE` 数组中添加该文件路径：
   ```javascript
   './city/mycity/modules/my_module.js',
   ```
2. **必须** 递增 `sw.js` 顶部的 `CACHE_NAME` 版本号（例如从 `cgo-openmap-v260907.150700` 改为 `cgo-openmap-v260908.093000`）。
3. 否则浏览器离线强缓存将拦截请求，导致新模块无法加载生效。
