/**
 * CGo OpenMap - 沈阳官网车站查询地址配置。
 *
 * 核心信息板会读取 GLOBAL_SCHEDULE_DATA，并统一渲染“官网查询”按钮。
 * 官网 stationInfo2 使用官网车站编号；线路图内部车站 ID 只作为本地索引，不能直接拼入地址。
 *
 * 官网编号按线路站序递增或递减，2 号线在蒲河路之后切换为市区段编号，单独列出第二段规则。
 */
const SYMTC_STATION_INFO_BASE = "https://www.symtc.com/wwmhm/stationInfo2";
const SYMTC_OFFICIAL_STATION_ID_RULES = {
    "SYM01": [
        { fromIndex: 0, officialStationId: 121, step: 2 }
    ],
    "SYM02": [
        { fromIndex: 0, toIndex: 6, officialStationId: 283, step: -2 },
        { fromIndex: 7, officialStationId: 203, step: 2 }
    ],
    "SYM03": [
        { fromIndex: 0, officialStationId: 321, step: 2 }
    ],
    "SYM04": [
        { fromIndex: 0, officialStationId: 421, step: 2 }
    ],
    "SYM09": [
        { fromIndex: 0, officialStationId: 921, step: 2 }
    ],
    "SYM10": [
        { fromIndex: 0, officialStationId: 1021, step: 2 }
    ]
};

const GLOBAL_SCHEDULE_DATA = {};

Object.entries(SYMTC_OFFICIAL_STATION_ID_RULES).forEach(([lineId, rules]) => {
    const line = linesData.find((item) => item.id === lineId);
    if (!line) return;

    const stationIds = line.hasbranch
        ? [...new Set([...(line["stationIds-way1"] || []), ...(line["stationIds-way2"] || [])])]
        : (line.stationIds || []);

    stationIds.forEach((stationId, index) => {
        const rule = rules.find((item) => index >= item.fromIndex
            && (item.toIndex === undefined || index <= item.toIndex));
        const station = stationsData[stationId];
        if (!rule || !station?.cn) return;

        const officialStationId = String(
            rule.officialStationId + (index - rule.fromIndex) * rule.step
        ).padStart(4, "0");
        const params = new URLSearchParams({
            stationId: officialStationId,
            lineId: lineId.replace(/^SYM/, ""),
            stationName: station.cn
        });

        (GLOBAL_SCHEDULE_DATA[lineId] ||= {})[stationId]
            = `${SYMTC_STATION_INFO_BASE}?${params.toString()}`;
    });
});

/**
 * 有轨电车固定运营时刻。
 * 该表只记录线路端点站发车时刻，不区分工作日/节假日或夏令时/冬令时。
 * HNT1、HNT3 的端点站名先保留为待线路数据接入时使用，当前地图仅配置 HNT5。
 */
const SHENYANG_TRAMWAY_TIMETABLE = {
    HNT1: {
        dailySinglePair: true,
        endpoints: [
            { stationName: "兴隆大奥莱", first: "11:10" },
            { stationName: "会展中心", first: "10:00" }
        ]
    },
    HNT3: {
        dailySinglePair: true,
        endpoints: [
            { stationName: "世纪大厦", first: "11:05" },
            { stationName: "会展中心", first: "10:10" }
        ]
    },
    HNT5: {
        endpoints: [
            { stationId: "T501", stationName: "奥体中心", first: "06:30", last: "22:00" },
            { stationId: "T528", stationName: "李石寨", first: "05:30", last: "21:00" }
        ]
    }
};

if (typeof window !== "undefined") {
    window.SHENYANG_TRAMWAY_TIMETABLE = SHENYANG_TRAMWAY_TIMETABLE;
}
