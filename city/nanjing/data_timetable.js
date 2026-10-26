/**
 * CGo OpenMap - 南京车站首末班车时刻表 (city/nanjing/data_timetable.js)
 *
 * 结构参考合肥 (city/hefei/data_timetable.js)：
 *   GLOBAL_SCHEDULE_DATA[线路ID][车站ID] = {
 *     cn, sourceCn, url, source,
 *     directions: {
 *        "<终点站名>": {
 *          first: { weekday: "周一至周四首班", weekend: "周五至周日首班" },
 *          last:  { weekday: "周一至周四末班", weekend: "周五至周日末班" }
 *        }
 *     }
 *   }
 * 终点该方向无车：first / last 为 null；官网表不分周中的，weekday 与 weekend 填同一时刻。
 *
 * 官网查询：南京地铁官网 https://www.njmetro.com.cn/
 * ⚠️ 待录入：官方 2026-10-12 发布的 15 条线路首末班时刻表为图片，需转录后按上述结构填入。
 *    数据未填时，本文件仅为占位，不影响线网渲染。
 */

const NANJING_OFFICIAL_LINE_URL = {
    // lineId -> 官网查询链接（待确认逐线 URL）
};

const GLOBAL_SCHEDULE_DATA = {};
