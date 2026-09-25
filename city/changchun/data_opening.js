/**
 * CGo OpenMap - 长春开通时刻表 (city/changchun/data_opening.js)
 *
 * 记录已确定开通时间的未开通区段与车站；由共享层
 * city/shenyang/shared/opening-schedule.js 在渲染前应用：
 *   - 开通时刻之前：车站保持 type "no"，区段虚线保留，车站面板底部显示倒计时；
 *   - 开通时刻之后：车站转为开通后站型，未开通区段虚线撤销，跨过时刻时页面自动刷新。
 * 未在此登记的未开通车站与区段一律按"永久未开通"处理，不做任何转换。
 *
 * 字段说明（时间必须写成带时区偏移量的 ISO 8601，精确到分即可）：
 *   id            条目标识，仅用于阅读与日志
 *   lineId        线路 ID，用于取该线车站与匹配未开通区段
 *   name          展示名，出现在车站面板底部的倒计时文案里
 *   opensAt       开通时刻，如 "2026-09-28T07:58+08:00"
 *   opensAs       未开通车站开通后的站型，默认 "dot"
 *   mergedAs      被并入的既有站升级后的站型，默认 "tsf"
 *   merge         未开通站 → 既有站的合并映射（换乘侧站开通后并入既有站）
 *   notOpenLines  需要撤销的 data_notopen.js 条目标识（按条目上的 lineId 匹配）
 *   noticeSummary 可选：新开通通知的摘要（默认「{name} 已于 {时刻} 开通运营」）
 *   noticeDetail  可选：帮助弹窗中的通知正文（默认同摘要）
 *   noticeWindowDays 可选：该条目的通知推送窗口天数（默认 30 天）
 */
const CGO_OPENING_SCHEDULE = [
    {
        id: "CCM05-phase1",
        lineId: "CCM05",
        name: "5号线一期工程",
        // 长春轨道交通5号线一期工程于 2026-09-28 07:58 开通初期运营
        opensAt: "2026-09-28T07:58+08:00",
        opensAs: "dot",
        mergedAs: "tsf",
        // 开通前为"既有站的 dot + 5 号线侧的 no"两个独立站点；
        // 开通后并入既有站并把既有站升级为换乘站。
        merge: {
            "0424-1": "0424",
            "0127-1": "0127",
            "0233-1": "0233",
            "0729-1": "0729",
            "0335-1": "0335",
            "0628-1": "0628"
        },
        notOpenLines: ["CCM05"]
    }
];

if (typeof window !== "undefined") {
    window.CGO_OPENING_SCHEDULE = CGO_OPENING_SCHEDULE;
}
