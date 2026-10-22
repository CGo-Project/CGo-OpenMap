# Service Worker 缓存名称与静态资源版本号硬性规范

## 核心规则
在本项目中，所有涉及缓存版本名称与静态资源查询串的版本号必须严格遵循以下规则：

1. **`sw.js` 缓存名称**：
   ```javascript
   const CACHE_NAME = 'cgo-openmap-v{yymmdd.hhmmss}';
   ```
2. **全站静态资源与动态加载脚本 `?v=`**：
   ```html
   <link rel="stylesheet" href="css/style.css?v={yymmdd.hhmmss}">
   <script src="core/script.js?v={yymmdd.hhmmss}"></script>
   ```
   包括 HTML 模板引入、`var v = "{yymmdd.hhmmss}";`、各城市 `const version = "{yymmdd.hhmmss}";` 等变量。

## 格式硬性约束
- **格式**：必须严格为 `yymmdd.hhmmss`，共 12 位纯数字带 1 个英文小数点：
  - 前 6 位为年月日（`YYMMDD`，例如 `261022` 代表 2026 年 10 月 22 日）
  - 点号 `.`
  - 后 6 位为时分秒（`HHMMSS`，例如 `223300` 代表 22 点 33 分 00 秒）
- **禁止项**：
  - ❌ **严禁省略**：严禁省略秒数（例如 `261022.2104` 缺少秒位）；
  - ❌ **严禁格式不匹配**：严禁任意其他长度、截断或不规范字符串；
  - ❌ **严禁全站割裂**：`sw.js` 的 `CACHE_NAME` 与全站引用的所有 `?v=` 必须保持完全一致。
