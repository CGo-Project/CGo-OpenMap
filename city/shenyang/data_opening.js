/**
 * CGo OpenMap - 沈阳开通时刻表 (city/shenyang/data_opening.js)
 *
 * 当前沈阳没有已确定开通时间的未开通区段或车站，故为空数组。
 * 数据结构与字段说明见 city/shenyang/shared/README.md「开通时刻」一节；
 * 添加条目后无需改动其他文件，共享层会在渲染前自动应用。
 */
const CGO_OPENING_SCHEDULE = [];

if (typeof window !== "undefined") {
    window.CGO_OPENING_SCHEDULE = CGO_OPENING_SCHEDULE;
}
