/**
 * CGo OpenMap - 兰州地铁「工程名 / 曾用名」资料表 (city/lanzhou/data_station_names.js)
 * 资料来源于官方公布的建设期工程站名与历史站名沿革。
 */


window.LANZHOU_STATION_NAMES = {
    /** 总开关：false → 兰州全路网车站卡片均不展示工程名 / 曾用名 */
    enabled: true,

    /**
     * 逐站资料表（键为车站 ID）
     * 未列出的车站即视为无资料，卡片中不显示对应行；
     * 编写格式详见文件头部「如何填写」章节。
     */
    stations: {
        // ================= 1号线（东岗 → 陈官营） =================
        "M119": { engineering: "奥体中心", former: "深安大桥南" },        // 奥体中心
        "M118": { engineering: "世纪大道" },                             // 兰州城市学院（省科技馆）
        "M117": { engineering: "迎门滩" },                               // 兰州海关
        "M114": { engineering: "西客站" },                               // 兰州西站北广场
        "M109": { engineering: "西关什字" },                             // 西关
        "M106": { engineering: "盘旋路" },                               // 兰州大学
        "M104": { engineering: "东部市场" },                             // 省气象局

        // ================= 2号线（雁白大桥 → 兰州火车站） =========
        "M201": { engineering: "雁北路" },                               // 雁白大桥
        "M202": { engineering: "雁园路" },                               // 均家滩
        "M203": { engineering: "雁南路" },                               // 张苏滩
        "M205": { engineering: "定西路" },                               // 团结新村
        "M206": { engineering: "公交五公司" },                           // 红星巷
        "M207": { engineering: "火车站" }                                // 兰州火车站
    }
};
