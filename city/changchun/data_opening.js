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
 *   holdStations  可选：暂缓开通的车站 ID，所在区段开通时仍保持未开通
 *                 （不转正、不显示倒计时，footer 回落「该车站目前尚未运营」）
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
        // 东大桥（0501）不在合并之列：它与 3 号线东大桥站厅并不连通，属付费出站换乘，
        // 开通后保留为独立车站（站型由 opensAs 决定），换乘关系登记在 data_virtual_transfers.js。
        merge: {
            "0127-1": "0127",
            "0233-1": "0233",
            "0729-1": "0729",
            "0335-1": "0335",
            "0628-1": "0628"
        },
        // 长影旧址博物馆（0508）暂缓开通：5 号线一期 9-28 开通初期运营时该站不开通
        holdStations: ["0508"],
        notOpenLines: ["CCM05"]
    }
];

if (typeof window !== "undefined") {
    window.CGO_OPENING_SCHEDULE = CGO_OPENING_SCHEDULE;
}
