# CGo OpenMap Editor 对标 RMP 全面超越专项升级方案

> **方案目标**：在保持 CGo 纯静态零依赖运行架构、真实城市引擎同源与条目级外科回写等绝对底座优势的同时，在**排版生产力手感、微操容错、超清海报级交付、RMP 存量生态吸纳**等维度实现跨越式升级，全面超越 Rail Map Painter (RMP)。

---

## 一、方案范围收敛与基准核定

根据决策，排除繁琐的国际化视觉模板与社区云端展厅，聚焦**核心生产力工具链与杀手锏功能**。将原先分散的诉求（包含画布三件套的去重归并）收敛整合为 **4 大功能矩阵 + 1 个生态杀手锏**：

- **矩阵 1（生产力）**：
  - 模块 A：框选选区、多选与成组批量平移 (Marquee & Batch Transform)
  - 模块 B：智能几何磁吸与动态对齐辅助线 (Smart Guides & Snapping)
  - 模块 C：多线共轨与自动并行偏移算法 (Parallel Routing Pipeline)
- **矩阵 2（稳定性）**：
  - 模块 D：原子事务级撤销/重做深度体系 (Transactional Undo/Redo)
- **矩阵 3（交付力）**：
  - 模块 E：超高精度印刷级海报/矢量输出器 (Print-Grade Exporter，纯净独立 SVG + 8K 超清 PNG)
- **矩阵 4（生态杀手锏）**：
  - 模块 F：RMP 格式原生导入器 (RMP to CGo Project Converter)

---

## 二、核心子系统架构设计与实现蓝图

### 模块 A：框选选区、多选与成组批量平移 (Marquee & Batch Transform)
- **输入层**：按住 `Shift` 键或切换至选择工具，在画布空白处拖拽触发动态半透明虚线框选矩形（Marquee Selection Box）；支持 `Shift+Click` 增选、`Alt+Click` 减选；
- **变换层**：计算多选外接包围盒（Bounding Box），计算实时位移矢量 $(\Delta x, \Delta y)$，选区内全部车站坐标及关联线段折点同步更新；
- **性能与平滑度**：采用纯 CSS Transform 临时代理移动，`pointerup` 时一次性写入数据模型，保证 60fps 流畅手感。

### 模块 B：智能几何磁吸与动态对齐辅助线 (Smart Guides & Snapping)
- **几何探测器（`smart-guides.js`）**：
  - 拖动时以当前点为中心嗅探临近物体；
  - 12px 容差内触发**正交对齐线（水平/垂直贯穿）**、**轨交 45°/135° 轴线吸附线**以及**等距分布指示标**；
- **非侵入渲染**：在 GhostLayer 上方使用独立的临时动态 SVG 覆层，松手即刻销毁，零内存泄漏。

### 模块 C：多线共轨与自动并行偏移算法 (Parallel Routing Pipeline)
- **几何偏置算法（`parallel-router.js`）**：
  - 自动提取多条线路公用区间的法向量 $\vec{N}$，计算外角平分线偏移与 Miter 节点，按设定的线距标准生成等间距平行走向；
  - 换乘节点自动匹配对应角度的跑道圆长胶囊（`tsf_pill_h` / `tsf_pill_v` / `tsf_pill_d45`）。

### 模块 D：原子事务级撤销/重做深度体系 (Transactional Undo/Redo)
- **事务包装机制**：引入 `startTransaction()` / `commitTransaction()`，批量移动 50 个站或执行多线偏置只产生 1 条撤销操作；
- **输入防碎化**：文本输入聚焦与拖拽位移自动防抖合并，未产生物理位移时不污染撤销历史。

### 模块 E：超高精度印刷级海报/矢量输出器 (Print-Grade Exporter)
- **纯净独立 SVG**：自动展开并固化 CSS 变量为标准 HEX 颜色，导出即可在 Illustrator/CorelDRAW/Inkscape 中零依赖打开；
- **8K 超清 PNG 输出**：基于离屏 Canvas 分块渲染（Tiled Rendering），支持 2x/4x/8x 分辨率导出（可直接用于 300 DPI 大幅面海报印刷）。

### 模块 F【杀手锏】：RMP 格式原生导入器 (RMP to CGo Project Converter)
- **一键生态吸纳**：
  - 用户只需把 RMP 导出的 `.json` 文件拖入 CGo Editor；
  - 纯前端解析其 `stations`、`lines`、`paths` 与转折点，降级映射至 CGo 图元规范；
  - 配合 `StationOrder` 自动重建拓扑并载入画布；
  - **实现从“静态死画板”到“可离线搜索、测距、带时刻表的运行级高交互地铁 App”的瞬间升维**。

---

## 三、实施阶段排期路线

1. **阶段一：交付与生态突破（首战杀手锏）**
   - 实现 RMP 格式原生导入器（`rmp-importer.js`）；
   - 实现纯净独立 SVG 与 8K 超清 PNG 导出器。
2. **阶段二：生产力与排版飞跃（攻克画图手感）**
   - 框选多选（Marquee）与成组批量平移；
   - 智能几何磁吸与动态对齐辅助线（Smart Guides）；
   - 多线共轨与并行偏移纯算法（`parallel-router.js`）。
3. **阶段三：微操容错与质量封顶（体验打磨）**
   - 显式事务级 Undo/Redo 状态机重构；
   - 扩充 `editor/tests/selfcheck.js` 自动化测试断言至 1000+ 项。

