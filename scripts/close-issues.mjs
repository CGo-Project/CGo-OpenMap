/**
 * close-issues.mjs
 * 用于自动发表中文评论并关闭已解决的 GitHub Issues (#70, #69, #62, #61, #47)
 * 
 * 运行方式:
 *   GITHUB_TOKEN=ghp_xxxx node scripts/close-issues.mjs
 */

const REPO = 'CGo-Project/CGo-OpenMap';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

const ISSUES = [
    {
        number: 70,
        title: 'fix(pwa): 离线页仅缓存一个城市文件就显示“离线就绪”',
        comment: `感谢反馈！该问题已在提交 \`3e8eb2d\` 中修复：

1. **多文件完整性校验**：\`offline.html\` 的 \`detectCachedCities()\` 判定逻辑已重构，现在会严格校验该城市的主脚本（\`mainJs\`）、站点数据（\`data_stations.js\`）及线路走向（\`data_lines.js\`）三者必须同时存在于 CacheStorage 中，方判定为“离线就绪”，彻底杜绝因缓存了单个城市徽标或首批零星文件而触发的虚假就绪。
2. **下载预热状态明确区分**：新增 \`#partialCitiesSection\` 提示分区，清晰展示处于“预热下载中 / 未就绪”的城市，并支持一键重新触发离线缓存。

相关测试断言已合入并通过自动化自检，关闭此 Issue。`
    },
    {
        number: 69,
        title: 'fix(pwa): 后台城市预缓存未延长 SW 生命周期，离线预热可能中断',
        comment: `感谢反馈！该问题已在提交 \`3e8eb2d\` 中修复：

1. **生命周期显式延长**：\`sw.js\` 引入断点续传队列与 \`runPrecacheRemaining()\` 控制器；监听 \`message\` 事件中的 \`PRECACHE_REMAINING\` 消息时，通过 \`event.waitUntil(runPrecacheRemaining(true))\` 显式挂靠当前打开页面，防止浏览器在空闲或低功耗策略下过早终止 Service Worker。
2. **前台空闲期主动调度**：\`main.html\` 与 \`index.html\` 在首屏渲染完毕后，利用 \`requestIdleCallback\` 自动向 Service Worker 发送预热消息，断点续传所有尚未完成预热的城市文件。

相关测试断言已合入并通过自动化自检，关闭此 Issue。`
    },
    {
        number: 62,
        title: 'fix(city): 新城市缺少被固定加载的脚本，宜宾站名别名 CSV 也不存在',
        comment: `感谢反馈！该问题已在提交 \`3e8eb2d\` 中修复：

1. **默认别名库精准收敛**：\`core/script.js\` 中的 \`getActiveCity()\` 默认别名库回落调整为仅针对基准范例城市 \`beijing\`（\`./city/beijing/staname.csv\`），其余城市默认为 \`null\`，杜绝了新城市或无别名库城市向服务器错误发起 404 请求。
2. **网络异常容错**：\`loadStationAliases()\` 中增加了 \`response.ok\` 校验，在可选 CSV 请求返回 404 时优雅退出，不再抛出未捕获的运行时异常。

相关测试断言已合入并通过自动化自检，关闭此 Issue。`
    },
    {
        number: 61,
        title: 'fix(city): 新增 10 座城市图例未按通用引擎格式注册，默认侧栏可能为空',
        comment: `感谢反馈！该问题已在提交 \`3e8eb2d\` 中修复：

1. **图例分组数据兼容**：\`core/script.js\` 的 \`renderDefaultLegend()\` 原生支持解析并展平 \`legendData.groups\` 分组格式为标准图例结构。
2. **线路走向自动兜底**：当城市未提供任何图例配置时，引擎自动基于 \`linesData\` 兜底生成线路列表，保证图例侧栏始终具备可用内容。
3. **消除阻塞式提前退出**：移除图例空配置时直接 \`return\` 的致命逻辑，保证无论图例数据为何种状态，全网搜索栏容器及侧栏基础交互均能 100% 正常装配。
4. **规范挂载补全**：已为 \`beijing_plan\`、\`fuzhou\`、\`suzhou\`、\`hohhot\` 等城市的 \`data_legend.js\` 补齐 \`window.LEGEND_CONFIG\` 规范导出。

相关测试断言已合入并通过自动化自检，关闭此 Issue。`
    },
    {
        number: 47,
        title: 'feat(editor): 支持「同址异站」站名模式（莫斯科型换乘），避免只能靠城市脚本改 DOM',
        comment: `感谢反馈！该功能已在提交 \`3e8eb2d\` 中全面落地：

1. **标准化数据模型**：在 \`data_stations.js\` 规范中确立原生 \`siblings: [{ lineId, cn, en, align, offset, color }]\` 数据结构，允许同一物理站体关联不同线路的独立站名、对齐朝向及微调偏移。
2. **引擎原生渲染与检索**：\`core/script.js\` 自动为异名站渲染带独立配色的 \`station-sibling-label\`；\`selectStation()\` 联动高亮所有同址标签；全网搜索与信息板（\`core/station-board.js\`）原生支持匹配并显示多线异名站。
3. **OpenMap Editor 生产力支持**：编辑器车站图层（\`station-layer.js\`）支持异名标注实时渲染，属性检视面板（\`inspector-view.js\`）提供可视化增删改交互卡片，并无缝接入撤销/重做栈与无损回写。
4. **标杆重构与临时代码清理**：平壤地铁 \`PY02\` 战友/战胜站已重构迁移为原生 \`siblings\` 模型，并彻底删除了 \`pyongyang.js\` 中原有的 44 行 DOM 劫持临时代码。

全部 803 项断言已 100% 通过，关闭此 Issue。`
    }
];

async function main() {
    if (!TOKEN) {
        console.error('未检测到 GITHUB_TOKEN 或 GH_TOKEN 环境变量。');
        console.error('使用方法: GITHUB_TOKEN=your_token node scripts/close-issues.mjs');
        process.exit(1);
    }

    const headers = {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${TOKEN}`,
        'User-Agent': 'CGo-OpenMap-Issue-Closer',
        'X-GitHub-Api-Version': '2022-11-28'
    };

    for (const issue of ISSUES) {
        console.log(`\n正在处理 Issue #${issue.number}: ${issue.title} ...`);

        // 1. 发表评论
        try {
            const commentRes = await fetch(`https://api.github.com/repos/${REPO}/issues/${issue.number}/comments`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ body: issue.comment })
            });

            if (!commentRes.ok) {
                const errText = await commentRes.text();
                console.error(`  ✗ 评论发表失败: ${commentRes.status} ${errText}`);
                continue;
            }
            console.log(`  ✓ 中文评论发表成功！`);
        } catch (err) {
            console.error(`  ✗ 评论请求异常: ${err.message}`);
            continue;
        }

        // 2. 关闭 Issue
        try {
            const closeRes = await fetch(`https://api.github.com/repos/${REPO}/issues/${issue.number}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ state: 'closed', state_reason: 'completed' })
            });

            if (!closeRes.ok) {
                const errText = await closeRes.text();
                console.error(`  ✗ 关闭 Issue 失败: ${closeRes.status} ${errText}`);
                continue;
            }
            console.log(`  ✓ Issue #${issue.number} 状态已更新为 closed (completed)！`);
        } catch (err) {
            console.error(`  ✗ 关闭 Issue 请求异常: ${err.message}`);
        }
    }

    console.log('\n全部选定 Issue 处理完成！');
}

main();
